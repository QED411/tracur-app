"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { GoogleMap, MarkerF, InfoWindowF, useLoadScript } from "@react-google-maps/api";
import { db } from "./lib/firebase"; 
import { collection, deleteDoc, updateDoc, doc, onSnapshot, writeBatch, query, where, getDocs } from "firebase/firestore";

// Helper for icons (Frontend Display)
const getCategoryIcon = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("eat") || cat.includes("food") || cat.includes("restaurant") || cat.includes("bar")) return "🍕";
  if (cat.includes("stay") || cat.includes("hotel") || cat.includes("airbnb")) return "🏨";
  if (cat.includes("beach") || cat.includes("swim") || cat.includes("sea")) return "🏖️";
  if (cat.includes("culture") || cat.includes("museum") || cat.includes("history")) return "🏛️";
  if (cat.includes("adventure") || cat.includes("hike") || cat.includes("ski") || cat.includes("sport")) return "⛷️";
  return "📍";
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries: ["places"],
  });

  // LIVE SYNC - confirmed pins + legacy (no status) for map; drafts go to /review
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, "pins"), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const confirmed = all.filter((p) => p.status !== "draft");
      setLocations(confirmed);
    });
    return () => unsubscribe();
  }, []);

  const activeBatches = Array.from(new Set(locations.map(l => l.importBatch).filter(Boolean)));

  // --- SAFE DELETE HANDLERS ---
  const handleDelete = async (id: string, name: string) => {
    // 1. SAFETY CHECK: Confirm before deleting
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    
    try {
      await deleteDoc(doc(db, "pins", id));
    } catch (e) {
      console.error(e);
      alert("Error deleting pin");
    }
  };

  const handleDeleteBatch = async (batchName: string) => {
    // 1. SAFETY CHECK for Batch
    if (!confirm(`WARNING: This will delete ALL pins from "${batchName}".\n\nAre you sure?`)) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, "pins"), where("importBatch", "==", batchName));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) { console.error(e); alert("Error deleting batch."); }
    setLoading(false);
  };

  // --- KML EXPORT ---
  const handleExportKML = () => {
    if (locations.length === 0) {
      alert("No locations to export!");
      return;
    }
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>TraCur Export</name>
<Style id="icon-eat"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/shapes/dining.png</href></Icon></IconStyle></Style>
<Style id="icon-stay"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/shapes/lodging.png</href></Icon></IconStyle></Style>
<Style id="icon-beach"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/shapes/water.png</href></Icon></IconStyle></Style>
<Style id="icon-culture"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/shapes/camera.png</href></Icon></IconStyle></Style>
<Style id="icon-adventure"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/shapes/hiker.png</href></Icon></IconStyle></Style>
<Style id="icon-default"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>`;

    const kmlBody = locations.map(loc => {
      let styleId = "icon-default";
      const cat = (loc.category || "").toLowerCase();
      if (cat.includes("eat")) styleId = "icon-eat";
      else if (cat.includes("stay")) styleId = "icon-stay";
      else if (cat.includes("beach")) styleId = "icon-beach";
      else if (cat.includes("culture")) styleId = "icon-culture";
      else if (cat.includes("adventure")) styleId = "icon-adventure";

      return `<Placemark><name>${loc.name.replace(/&/g, '&')}</name><description><![CDATA[${loc.note}]]></description><styleUrl>#${styleId}</styleUrl><Point><coordinates>${loc.coordinates.lng},${loc.coordinates.lat}</coordinates></Point></Placemark>`;
    }).join("");

    const blob = new Blob([kmlHeader + kmlBody + "</Document></kml>"], { type: "application/vnd.google-earth.kml+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TraCur_Export_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- AI CURATION --- (API saves draft to Firestore; pins appear via onSnapshot)
  const handleCurate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/curate", { method: "POST", body: JSON.stringify({ text: inputText }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInputText("");
    } catch (e) {
      console.error(e);
      alert("Error curating. Check console.");
    }
    setLoading(false);
  };

  // --- IMPORT ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(text, "text/xml");
    const placemarks = kml.getElementsByTagName("Placemark");
    let count = 0;
    const batch = writeBatch(db);

    const iconMap: Record<string, string> = {
      "1577": "Eat", "1603": "Eat", "1535": "Eat", "1502": "Stay", "1636": "Stay",
      "1733": "Beach", "1720": "Beach", "1596": "Adventure", "1765": "Adventure", 
      "1715": "Adventure", "1532": "Culture", "1684": "Culture", "1685": "Culture", 
      "1517": "Culture", "1899": "Do",
    };

    Array.from(placemarks).forEach((placemark) => {
      const name = placemark.getElementsByTagName("name")[0]?.textContent || "Unknown";
      const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
      const coordsRaw = placemark.getElementsByTagName("coordinates")[0]?.textContent?.trim();
      const styleUrl = placemark.getElementsByTagName("styleUrl")[0]?.textContent || "";

      if (coordsRaw) {
        const [lng, lat] = coordsRaw.split(",");
        let category = "Do";
        const iconMatch = styleUrl.match(/icon-(\d+)/);
        const iconId = iconMatch ? iconMatch[1] : null;

        if (iconId && iconMap[iconId]) category = iconMap[iconId];
        else {
          const fullText = (name + " " + description).toLowerCase();
          if (fullText.match(/restaurant|food|pizza|burger|cafe|bistro|trattoria|osteria|gelato|dinner|lunch|steak|ramen|sushi|noodle|kitchen|grill|bar|pub|wagamama/)) category = "Eat";
          else if (fullText.match(/hotel|resort|airbnb|stay|apartment|bnb|hostel/)) category = "Stay";
          else if (fullText.match(/beach|spiaggia|lido|cove|sea|ocean|sand|swim|lagoon/)) category = "Beach";
          else if (fullText.match(/ski|surf|dive|climb|kayak|hike|trail|mountain|sport|cricket|football|soccer|stadium|arena|golf/)) category = "Adventure";
          else if (fullText.match(/museum|gallery|church|cathedral|duomo|ruins|theater|history|art|palace|castle/)) category = "Culture";
        }

        const cleanNote = description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '').trim();
        const docRef = doc(collection(db, "pins"));
        batch.set(docRef, {
          name, category, note: cleanNote, coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          createdAt: new Date(), source: "Google My Maps Import", importBatch: file.name, originalIconId: iconId || "unknown"
        });
        count++;
      }
    });
    await batch.commit();
    setImporting(false);
    alert(`Successfully imported ${count} pins!`);
    e.target.value = "";
  };

  const handleDragEnd = async (id: string, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    try {
      const pinRef = doc(db, "pins", id);
      await updateDoc(pinRef, { coordinates: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
    } catch (error) { console.error("Error moving pin:", error); }
  };

  if (!googleMapsApiKey) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">Google Maps API key is missing.</p>
        <p className="text-gray-600 mt-2 text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">Map failed to load</p>
        <p className="text-gray-600 mt-2 text-sm">{String(loadError)}</p>
      </div>
    );
  }
  if (!isLoaded) return <div className="p-8">Loading Map...</div>;

  return (
    <div className="flex h-screen font-sans">
      <div className="w-1/3 p-4 bg-gray-100 overflow-y-auto border-r border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-blue-600">TraCur</h1>
          <Link
            href="/review"
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1B365D] text-white hover:opacity-90"
          >
            Review drafts
          </Link>
        </div>
        
        {/* ADD TEXT */}
        <div className="mb-6 border-b pb-6">
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase">Quick Add</h2>
          <div className="flex gap-2">
            <textarea 
              className="w-full p-2 border rounded text-sm h-16"
              placeholder="Paste article text..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              onClick={handleCurate}
              disabled={loading}
              className="bg-blue-600 text-white px-4 rounded text-sm hover:bg-blue-700"
            >
              {loading ? "..." : "Add"}
            </button>
          </div>
        </div>

        {/* DATA TOOLS */}
        <div className="mb-6 border-b pb-6">
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase">Data Tools</h2>
          <div className="flex gap-2 mb-3">
            <label className="flex-1 p-2 text-center bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-xs font-bold">
              {importing ? "..." : "📂 Import KML"}
              <input type="file" className="hidden" accept=".kml" onChange={handleFileUpload} disabled={importing} />
            </label>
            <button 
              onClick={handleExportKML}
              className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold"
            >
              💾 Export My Map
            </button>
          </div>
          {/* Batches */}
          {activeBatches.length > 0 && (
            <div className="space-y-1">
              {activeBatches.map((batchName: any) => (
                <div key={batchName} className="flex justify-between items-center bg-gray-200 p-2 rounded text-xs">
                  <span className="truncate font-medium text-gray-700">{batchName}</span>
                  <button 
                    onClick={() => handleDeleteBatch(batchName)}
                    className="text-red-600 hover:text-red-800 font-bold px-2"
                  >
                    Delete Group
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PINS LIST */}
        <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase">All Locations ({locations.length})</h2>
        <div className="space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white p-2 rounded shadow-sm text-sm relative group border-l-4 border-transparent hover:border-blue-500">
              <button 
                onClick={() => handleDelete(loc.id, loc.name)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold px-2"
                title="Delete Location"
              >
                ✕
              </button>
              <div className="font-bold text-gray-800 pr-6">
                <span className="mr-2">{getCategoryIcon(loc.category)}</span>
                {loc.name}
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {loc.importBatch || "Unknown Source"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3">
        <GoogleMap center={{ lat: 38.038, lng: 14.022 }} zoom={6} mapContainerClassName="w-full h-full">
          {locations.map((loc) => (
            <MarkerF 
              key={loc.id} 
              position={loc.coordinates}
              label={{ text: getCategoryIcon(loc.category), fontSize: "20px" }}
              onClick={() => setSelected(loc)}
              draggable={true} 
              onDragEnd={(e) => handleDragEnd(loc.id, e)}
            />
          ))}
          {selected && (
            <InfoWindowF position={selected.coordinates} onCloseClick={() => setSelected(null)}>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold">{selected.name}</h3>
                <p className="text-sm mt-1 mb-2">{selected.note}</p>
                <div className="text-xs text-gray-400 mb-2">Source: {selected.importBatch}</div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.coordinates.lat},${selected.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs hover:bg-blue-700"
                >
                  🚗 Get Directions
                </a>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}