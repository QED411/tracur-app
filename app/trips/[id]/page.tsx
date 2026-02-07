"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const getCategoryIcon = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("eat")) return "🍕";
  if (c.includes("stay")) return "🏨";
  if (c.includes("beach")) return "🏖️";
  if (c.includes("culture")) return "🏛️";
  if (c.includes("adventure")) return "⛷️";
  return "📍";
};

interface Pin {
  id: string;
  name: string;
  category: string;
  note: string;
  sourceUrl: string | null;
  coordinates: { lat: number; lng: number };
  ticketUrl: string | null;
}

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  pins: Pin[];
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [ticketInput, setTicketInput] = useState("");

  useEffect(() => {
    fetch(`/api/trips/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setTrip(null);
        else setTrip(data);
      })
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  const saveTicket = async (pinId: string, url: string) => {
    try {
      const res = await fetch(`/api/pins/${pinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketUrl: url.trim() || null }),
      });
      if (res.ok && trip) {
        setTrip({
          ...trip,
          pins: trip.pins.map((p) => (p.id === pinId ? { ...p, ticketUrl: url.trim() || null } : p)),
        });
      }
      setEditingTicket(null);
      setTicketInput("");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!trip) return <div className="p-8 text-gray-500">Trip not found</div>;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/trips" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          ← Trips
        </Link>
        <h1 className="text-lg font-bold text-gray-900 truncate max-w-[60%]">{trip.name}</h1>
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          Map
        </Link>
      </header>

      <main className="max-w-lg mx-auto p-4 pb-20">
        {(trip.destination || trip.startDate) && (
          <div className="text-sm text-gray-600 mb-4">
            {[trip.destination, trip.startDate && `📅 ${trip.startDate}`, trip.endDate && `– ${trip.endDate}`]
              .filter(Boolean)
              .join(" ")}
          </div>
        )}

        {trip.pins.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No locations yet</p>
            <p className="text-sm mb-4">Add pins from the map: curate an article, review, then &quot;Add to trip&quot;.</p>
            <Link href="/" className="text-[#1B365D] font-medium text-sm">
              Go to Map →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {trip.pins.map((pin) => (
              <li key={pin.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getCategoryIcon(pin.category)}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pin.coordinates.lat},${pin.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-[#1B365D] block truncate"
                      >
                        {pin.name}
                      </a>
                      {pin.note && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{pin.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {editingTicket === pin.id ? (
                      <>
                        <input
                          type="url"
                          placeholder="Ticket / booking URL"
                          value={ticketInput}
                          onChange={(e) => setTicketInput(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => saveTicket(pin.id, ticketInput)}
                          className="px-3 py-1.5 bg-[#1B365D] text-white text-sm rounded"
                        >
                          Save
                        </button>
                        <button onClick={() => { setEditingTicket(null); setTicketInput(""); }} className="text-gray-500 text-sm">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingTicket(pin.id); setTicketInput(pin.ticketUrl || ""); }}
                          className="text-xs text-[#1B365D] font-medium"
                        >
                          {pin.ticketUrl ? "Edit ticket" : "+ Add ticket"}
                        </button>
                        {pin.ticketUrl && (
                          <a
                            href={pin.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:underline truncate max-w-[180px]"
                          >
                            🔗 Open
                          </a>
                        )}
                      </>
                    )}
                  </div>
                  {pin.sourceUrl && (
                    <a href={pin.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:text-[#1B365D] mt-1 block truncate">
                      Source
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
