"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      if (res.ok) {
        const t = await res.json();
        setTrips((prev) => [t, ...prev]);
        setShowCreate(false);
        setName("");
        setDestination("");
        setStartDate("");
        setEndDate("");
        window.location.href = `/trips/${t.id}`;
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          ← Map
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Trips</h1>
        <Link href="/review" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          Review
        </Link>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full py-3 rounded-lg bg-[#1B365D] text-white font-medium mb-4 hover:opacity-90"
        >
          + New trip
        </button>

        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <input
              type="text"
              placeholder="Trip name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Destination (e.g. Europe Beaches)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
            />
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                placeholder="Start"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                type="date"
                placeholder="End"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-[#1B365D] text-white rounded text-sm font-medium">
                Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : trips.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No trips yet</p>
            <p className="text-sm">Create a trip and add locations from the map.</p>
            <Link href="/" className="inline-block mt-4 text-[#1B365D] font-medium text-sm">
              Curate from article →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {trips.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/trips/${t.id}`}
                  className="block p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-[#1B365D] transition-colors"
                >
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  {(t.destination || t.startDate) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[t.destination, t.startDate && `📅 ${t.startDate}`].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
