"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { GoogleMap, MarkerF, InfoWindowF, useLoadScript } from "@react-google-maps/api";

// Pins persisted in Postgres, loaded via /api/pins

/** Normalize API pin to UI shape */
function toPinShape(p: Record<string, unknown>) {
  const coords = p.coordinates as { lat?: number; lng?: number } | undefined;
  return {
    id: p.id,
    name: p.name,
    coordinates: { lat: Number(p.lat ?? coords?.lat ?? 0), lng: Number(p.lng ?? coords?.lng ?? 0) },
    category: p.category ?? "landmark",
    note: p.note ?? "",
    importBatch: p.importBatch ?? p.import_batch ?? null,
    sourceUrl: p.sourceUrl ?? p.source_url ?? null,
    enrichment: (p.enrichment as Record<string, unknown>) ?? {},
  };
}

/** Short label for batch/source display */
function batchLabel(batch: string | undefined, sourceUrl?: string | null): string {
  if (sourceUrl) {
    try {
      const u = new URL(sourceUrl);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return batch || "Article";
    }
  }
  return batch || "Quick Add";
}

/** Enriched pin InfoWindow - Google Maps data + curated note */
function PinInfoWindow({
  pin,
  mapsApiKey,
}: {
  pin: { name: string; note?: string; coordinates?: { lat: number; lng: number }; enrichment?: Record<string, unknown>; sourceUrl?: string | null };
  mapsApiKey: string;
}) {
  const e = pin.enrichment || {};
  const address = e.address as string | null;
  const rating = e.rating as number | null;
  const userRatingCount = e.userRatingCount as number | null;
  const openingHours = e.openingHours as string[] | null;
  const websiteUri = e.websiteUri as string | null;
  const googleMapsUri = e.googleMapsUri as string | null;
  const photos = (e.photos as { name?: string }[]) ?? [];

  const photoUrl = (name: string) =>
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${mapsApiKey}`;
  const dirUrl = pin.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${pin.coordinates.lat},${pin.coordinates.lng}`
    : googleMapsUri ?? "#";

  return (
    <div className="p-2 max-w-sm min-w-[260px] max-h-[70vh] overflow-y-auto">
      {/* Opening hours & Website first (Google Maps enrichment) */}
      {openingHours && openingHours.length > 0 && (
        <div className="mb-3 text-xs">
          <div className="font-medium text-gray-800">Opening hours</div>
          <ul className="text-gray-600 mt-0.5">
            {openingHours.slice(0, 7).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      {(websiteUri || googleMapsUri) && (
        <div className="mb-3 flex gap-2">
          {websiteUri && (
            <a
              href={websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-600 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-amber-700"
            >
              🌐 Website / Menu
            </a>
          )}
        </div>
      )}

      {/* Name */}
      <h3 className="font-bold text-base">{pin.name}</h3>

      {/* Curated tip/note from article */}
      {pin.note && (
        <div className="mt-2 p-2 bg-amber-50 border-l-2 border-amber-500 text-sm text-gray-700">
          {pin.note}
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {photos.slice(0, 3).map((p, i) =>
            p.name ? (
              <img
                key={i}
                src={photoUrl(p.name)}
                alt=""
                className="h-20 w-28 object-cover rounded flex-shrink-0"
              />
            ) : null
          )}
        </div>
      )}

      {/* Rating */}
      {rating != null && (
        <div className="flex items-center gap-1 mt-1 text-amber-600 text-sm">
          <span>★</span> {rating.toFixed(1)}
          {userRatingCount != null && (
            <span className="text-gray-500">({userRatingCount.toLocaleString()} reviews)</span>
          )}
        </div>
      )}

      {/* Address */}
      {address && (
        <p className="text-xs text-gray-600 mt-1">{address}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <a
          href={dirUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[100px] text-center bg-blue-600 text-white font-bold py-1.5 px-2 rounded text-xs hover:bg-blue-700"
        >
          🚗 Directions
        </a>
        {pin.sourceUrl && (
          <a
            href={pin.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[100px] text-center bg-amber-600 text-white font-bold py-1.5 px-2 rounded text-xs hover:bg-amber-700"
          >
            📰 Original article
          </a>
        )}
      </div>
    </div>
  );
}

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
  const [sourceUrl, setSourceUrl] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  console.log("MAP KEY CHECK:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "EXISTS" : "MISSING");
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries: ["places"],
  });

  // Load pins from Postgres (confirmed only for map)
  useEffect(() => {
    fetch("/api/pins?status=confirmed")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLocations(data.map(toPinShape));
        }
      })
      .catch((e) => console.error("Failed to load pins:", e));
  }, []);

  // Fit map to show all pins when they load
  useEffect(() => {
    if (!map || locations.length === 0) return;
    const valid = locations.filter((l) => l.coordinates?.lat != null && l.coordinates?.lng != null);
    if (valid.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    valid.forEach((l) => bounds.extend({ lat: l.coordinates.lat, lng: l.coordinates.lng }));
    map.fitBounds(bounds, 40);
  }, [map, locations]);

  const activeBatches = Array.from(new Set(locations.map(l => l.importBatch).filter(Boolean)));

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/pins/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== deleteConfirm.id));
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete pin");
    }
    setDeleteConfirm(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  /** Scroll spy: as user scrolls sidebar, pan map to the location card most visible in viewport */
  useEffect(() => {
    const container = sidebarRef.current;
    if (!container || !map || locations.length === 0) return;

    const updateActiveFromScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportCenter = containerRect.top + containerRect.height / 2;

      let bestLoc: (typeof locations)[0] | null = null;
      let bestDistance = Infinity;
      for (const loc of locations) {
        const el = listItemRefs.current[loc.id];
        if (!el) continue;
        const elRect = el.getBoundingClientRect();
        const elCenter = elRect.top + elRect.height / 2;
        const distance = Math.abs(elCenter - viewportCenter);
        if (elRect.bottom >= containerRect.top && elRect.top <= containerRect.bottom && distance < bestDistance) {
          bestDistance = distance;
          bestLoc = loc;
        }
      }
      if (!bestLoc && locations.length > 0) bestLoc = locations[0];
      if (bestLoc?.coordinates?.lat != null && bestLoc?.coordinates?.lng != null) {
        setSelected((prev: (typeof locations)[0] | null) => {
          if (prev?.id === bestLoc?.id) return prev;
          map.panTo(bestLoc!.coordinates);
          map.setZoom(15);
          return bestLoc;
        });
      }
    };

    container.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    updateActiveFromScroll(); // initial run
    return () => container.removeEventListener("scroll", updateActiveFromScroll);
  }, [locations, map]);

  /** Click sidebar location: pan map to pin, open InfoWindow, highlight in list */
  const handleLocationClick = (loc: (typeof locations)[0]) => {
    if (!loc.coordinates?.lat || !loc.coordinates?.lng) return;
    setSelected(loc);
    if (map) {
      map.panTo(loc.coordinates);
      map.setZoom(15);
    }
  };

  /** Scroll sidebar to selected location when selection changes (e.g. from map pin click) */
  useEffect(() => {
    if (selected?.id && listItemRefs.current[selected.id]) {
      listItemRefs.current[selected.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected?.id]);

  const handleDeleteBatch = async (batchName: string) => {
    if (!confirm(`WARNING: This will delete ALL pins from "${batchName}".\n\nAre you sure?`)) return;
    try {
      const res = await fetch(`/api/pins?batch=${encodeURIComponent(batchName)}`, { method: "DELETE" });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.importBatch !== batchName));
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to delete batch");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete batch");
    }
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

  // --- AI CURATION --- Parses single or multiple locations, adds all to local state. Supports URL-only (scrapes article).
  const handleCurate = async () => {
    if (!inputText.trim() && !sourceUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          url: sourceUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const pins = data.pins ?? [];
      const newPins = pins.map((p: Record<string, unknown>) => toPinShape({ ...p, sourceUrl: p.sourceUrl ?? data.sourceUrl ?? sourceUrl.trim() }));
      setLocations((prev) => [...prev, ...newPins]);
      setInputText("");
      if (newPins.length > 1) setSourceUrl(""); // clear URL after bulk so user can paste next article
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error curating. Check console.";
      console.error("Curate error:", msg, e);
      alert(msg);
    }
    setLoading(false);
  };

  // --- IMPORT --- Add to local state (no Firebase)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(text, "text/xml");
    const placemarks = kml.getElementsByTagName("Placemark");

    const iconMap: Record<string, string> = {
      "1577": "Eat", "1603": "Eat", "1535": "Eat", "1502": "Stay", "1636": "Stay",
      "1733": "Beach", "1720": "Beach", "1596": "Adventure", "1765": "Adventure",
      "1715": "Adventure", "1532": "Culture", "1684": "Culture", "1685": "Culture",
      "1517": "Culture", "1899": "Do",
    };

    const toInsert: { name: string; lat: number; lng: number; category: string; note: string; importBatch: string }[] = [];
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

        const cleanNote = description.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>?/gm, "").trim();
        toInsert.push({
          name,
          category,
          note: cleanNote,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          importBatch: file.name,
        });
      }
    });
    try {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInsert),
      });
      const saved = await res.json();
      if (Array.isArray(saved)) {
        setLocations((prev) => [...prev, ...saved.map(toPinShape)]);
        alert(`Successfully imported ${saved.length} pins!`);
      } else {
        throw new Error(saved.error ?? "Import failed");
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to import pins");
    }
    setImporting(false);
    e.target.value = "";
  };

  const handleDragEnd = async (id: string, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    try {
      const res = await fetch(`/api/pins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      if (res.ok) {
        setLocations((prev) =>
          prev.map((l) => (l.id === id ? { ...l, coordinates: { lat, lng } } : l))
        );
      }
    } catch (err) {
      console.error("Failed to update pin position:", err);
    }
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
      <div ref={sidebarRef} className="w-1/3 min-h-0 overflow-y-auto p-4 bg-gray-100 border-r border-gray-300">
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
          <textarea 
            className="w-full p-2 border rounded text-sm h-32 mb-2"
            placeholder="Paste article text (optional if URL provided below)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <input
            type="url"
            className="w-full p-2 border rounded text-sm mb-2"
            placeholder="Or paste URL only to scrape article (e.g. theguardian.com/...)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <button 
            onClick={handleCurate}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium"
          >
            {loading ? "Curating..." : "Curate"}
          </button>
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

        {/* Delete confirmation dialog */}
        {deleteConfirm && (
          <div className="mb-4 p-4 bg-white border border-red-200 rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-800 mb-3">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={handleDeleteCancel}
                className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PINS LIST */}
        <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase">All Locations ({locations.length})</h2>
        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              ref={(el) => { listItemRefs.current[loc.id] = el; }}
              data-loc-id={loc.id}
              onClick={() => handleLocationClick(loc)}
              className={`bg-white p-2 rounded shadow-sm text-sm relative group border-l-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                selected?.id === loc.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-transparent hover:border-blue-300"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(loc.id, loc.name);
                }}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold px-2"
                title="Delete Location"
              >
                ✕
              </button>
              <div className="font-bold text-gray-800 pr-6">
                <span className="mr-2">{getCategoryIcon(loc.category)}</span>
                {loc.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {batchLabel(loc.importBatch, loc.sourceUrl)}
              </div>
              {loc.note && (
                <p className="text-xs text-gray-600 mt-1.5 italic leading-relaxed whitespace-pre-wrap">
                  {loc.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3">
        <GoogleMap
          center={{ lat: 38.038, lng: 14.022 }}
          zoom={3}
          mapContainerClassName="w-full h-full"
          onLoad={(m) => setMap(m)}
        >
          {locations
            .filter((loc) => loc.coordinates?.lat != null && loc.coordinates?.lng != null)
            .map((loc) => (
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
              <PinInfoWindow pin={selected} mapsApiKey={googleMapsApiKey} />
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}