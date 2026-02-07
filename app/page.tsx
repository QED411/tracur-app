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
    googlePlaceId: p.googlePlaceId ?? p.google_place_id ?? null,
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

/** Map popup: Google Maps data only (website, directions, photos). Notes stay in sidebar. */
function PinInfoWindow({
  pin,
  mapsApiKey,
}: {
  pin: { name: string; coordinates?: { lat: number; lng: number }; enrichment?: Record<string, unknown>; sourceUrl?: string | null; googlePlaceId?: string | null };
  mapsApiKey: string;
}) {
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [youtubeVideo, setYoutubeVideo] = useState<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string } | null>(null);
  const e = pin.enrichment || {};
  const address = (e.address ?? details?.formattedAddress) as string | null;
  const rating = (e.rating ?? details?.rating) as number | null;
  const userRatingCount = (e.userRatingCount ?? details?.userRatingCount) as number | null;
  const websiteUri = (e.websiteUri ?? details?.websiteUri) as string | null;
  const googleMapsUri = (e.googleMapsUri ?? details?.googleMapsUri) as string | null;
  const photos = ((e.photos ?? details?.photos) as { name?: string }[]) ?? [];

  useEffect(() => {
    const pid = pin.googlePlaceId;
    if (!pid || photos.length > 0 || websiteUri) return;
    fetch(`/api/enrich-place?placeId=${encodeURIComponent(pid)}`)
      .then((r) => r.json())
      .then((d) => setDetails(d))
      .catch(() => {});
  }, [pin.googlePlaceId, photos.length, websiteUri]);

  useEffect(() => {
    if (!pin.name?.trim()) return;
    fetch(`/api/youtube-search?q=${encodeURIComponent(pin.name)}`)
      .then((r) => r.json())
      .then((d) => setYoutubeVideo(d.video ?? null))
      .catch(() => setYoutubeVideo(null));
  }, [pin.name]);

  const photoUrl = (name: string) =>
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${mapsApiKey}`;
  const dirUrl = pin.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${pin.coordinates.lat},${pin.coordinates.lng}`
    : googleMapsUri ?? "#";
  const mapsLink = googleMapsUri ?? dirUrl;

  return (
    <div className="p-3 max-w-sm min-w-[240px] max-h-[70vh] overflow-y-auto">
      <h3 className="font-bold text-base">{pin.name}</h3>

      {/* Icons at top: directions, website, youtube, article, google maps — 20% larger (w-5 h-5) */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <a
          href={dirUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Directions"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        </a>
        {websiteUri && (
          <a
            href={websiteUri}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
            title="Website"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </a>
        )}
        {youtubeVideo && (
          <a
            href={`https://www.youtube.com/watch?v=${youtubeVideo.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
            title="Watch video"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </a>
        )}
        {pin.sourceUrl && (
          <a
            href={pin.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-amber-50 text-gray-600 hover:text-amber-700 transition-colors"
            title="Original article"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
            </svg>
          </a>
        )}
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
          title="Open in Google Maps"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </a>
      </div>

      {/* Rating */}
      {rating != null && (
        <div className="flex items-center gap-1 mt-2 text-amber-600 text-sm">
          <span>★</span> {rating.toFixed(1)}
          {userRatingCount != null && (
            <span className="text-gray-500">({userRatingCount.toLocaleString()} reviews)</span>
          )}
        </div>
      )}

      {/* Address */}
      {address && <p className="text-xs text-gray-600 mt-0.5">{address}</p>}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {photos.slice(0, 4).map((p, i) =>
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

      {/* YouTube video about this destination */}
      {youtubeVideo && (
        <a
          href={`https://www.youtube.com/watch?v=${youtubeVideo.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 rounded overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors group"
        >
          <div className="relative aspect-video">
            <img
              src={youtubeVideo.thumbnailUrl}
              alt={youtubeVideo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-800 group-hover:bg-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-1.5 bg-gray-50">
            <p className="text-xs font-medium text-gray-800 truncate">{youtubeVideo.title}</p>
            <p className="text-[10px] text-gray-500">{youtubeVideo.channelTitle}</p>
          </div>
        </a>
      )}
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

/** Inline create-trip from batch - one click, minimal form */
function CreateTripFromBatch({ batch, onCreated }: { batch: string; onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(batch.slice(0, 40));
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || batch.slice(0, 40), batch }),
      });
      if (res.ok) {
        const t = await res.json();
        onCreated();
        window.location.href = `/trips/${t.id}`;
      }
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };
  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Trip name"
        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
      />
      <button
        onClick={handleCreate}
        disabled={creating}
        className="px-3 py-1.5 bg-[#1B365D] text-white text-sm rounded font-medium disabled:opacity-50"
      >
        {creating ? "…" : "Plan trip"}
      </button>
    </div>
  );
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [lastImportBatch, setLastImportBatch] = useState<string | null>(null);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  console.log("MAP KEY CHECK:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "EXISTS" : "MISSING");
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries: ["places"],
  });

  // Load pins from Postgres (all pins so curated drafts are visible)
  useEffect(() => {
    fetch("/api/pins")
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
  const ignoreScrollUntilRef = useRef<number>(0);

  /** Scroll spy: as user scrolls sidebar, pan map to the location card most visible in viewport */
  useEffect(() => {
    const container = sidebarRef.current;
    if (!container || !map || locations.length === 0) return;

    const updateActiveFromScroll = () => {
      if (Date.now() < ignoreScrollUntilRef.current) return;
      const containerRect = container.getBoundingClientRect();
      const viewportCenter = containerRect.top + containerRect.height / 2;
      const isScrolledToBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;

      let bestLoc: (typeof locations)[0] | null = null;
      let bestDistance = Infinity;
      const lastLoc = locations[locations.length - 1];
      const lastEl = lastLoc ? listItemRefs.current[lastLoc.id] : null;
      const lastRect = lastEl?.getBoundingClientRect();
      const lastIsVisible = lastRect && lastRect.bottom >= containerRect.top && lastRect.top <= containerRect.bottom;

      if (isScrolledToBottom && lastIsVisible && lastLoc?.coordinates?.lat != null) {
        bestLoc = lastLoc;
      } else {
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
      }
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
    ignoreScrollUntilRef.current = Date.now() + 400; // Prevent scroll spy from overwriting for 400ms
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
      setLastImportBatch(data.importBatch ?? (newPins[0] as { importBatch?: string })?.importBatch ?? null);
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
    <div className="flex h-screen overflow-hidden font-sans">
      <div ref={sidebarRef} className="w-1/3 shrink-0 h-full min-h-0 overflow-y-auto overflow-x-hidden p-4 bg-gray-100 border-r border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-blue-600">TraCur</h1>
          <div className="flex gap-2">
            <Link href="/trips" className="text-sm font-medium px-2 py-1.5 rounded text-gray-700 hover:bg-gray-200">
              Trips
            </Link>
            <Link
              href="/review"
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1B365D] text-white hover:opacity-90"
            >
              Review
            </Link>
          </div>
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
            placeholder="Paste URL (e.g. theguardian.com/travel/.../readers-favourite-beaches-europe)"
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
          {lastImportBatch && (
            <CreateTripFromBatch batch={lastImportBatch} onCreated={() => setLastImportBatch(null)} />
          )}
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
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {loc.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
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