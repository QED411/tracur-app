"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const getCategoryIcon = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("eat") || cat.includes("food") || cat.includes("restaurant")) return "🍕";
  if (cat.includes("stay") || cat.includes("hotel")) return "🏨";
  if (cat.includes("beach") || cat.includes("swim") || cat.includes("sea")) return "🏖️";
  if (cat.includes("culture") || cat.includes("museum") || cat.includes("history")) return "🏛️";
  if (cat.includes("adventure") || cat.includes("hike") || cat.includes("ski")) return "⛷️";
  return "📍";
};

const isVegetarianFriendly = (note: string) => {
  if (!note) return false;
  const lower = note.toLowerCase();
  return /vegetarian|vegan|veg-friendly|veg options|lacto-ovo|meat-free/i.test(lower);
};

interface DraftPin {
  id: string;
  name: string;
  category: string;
  note: string;
  sourceUrl?: string;
  sourceTitle?: string;
  coordinates?: { lat: number; lng: number };
  googlePlaceId?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  [key: string]: unknown;
}

const StarRating = ({ rating, count }: { rating: number; count?: number | null }) => (
  <div className="flex items-center gap-1.5 text-amber-500">
    <span className="text-lg">★</span>
    <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
    {count != null && count > 0 && (
      <span className="text-xs text-gray-500">({count.toLocaleString()} reviews)</span>
    )}
  </div>
);

export default function ReviewPage() {
  const [drafts, setDrafts] = useState<DraftPin[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // On-demand enrichment: fetch rating for pins with googlePlaceId but no rating
  useEffect(() => {
    const pin = drafts[currentIndex];
    if (!pin?.googlePlaceId || pin.rating != null) return;
    fetch("/api/enrich-place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: pin.googlePlaceId, pinId: pin.id }),
    }).catch(() => {});
  }, [drafts, currentIndex]);

  useEffect(() => {
    const q = query(
      collection(db, "pins"),
      where("status", "==", "draft")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pins = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as DraftPin[];
      setDrafts(pins);
      setCurrentIndex(0);
    });
    return () => unsubscribe();
  }, []);

  const current = drafts[currentIndex];

  const handleAccept = async () => {
    if (!current) return;
    try {
      await updateDoc(doc(db, "pins", current.id), { status: "confirmed" });
      setCurrentIndex((i) => Math.min(i, drafts.length - 2));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!current) return;
    try {
      await deleteDoc(doc(db, "pins", current.id));
      setCurrentIndex((i) => Math.max(0, Math.min(i, drafts.length - 2)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsSwiping(true);
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    setTouchStart({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStart) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = x - touchStart.x;
    const clamped = Math.max(-120, Math.min(120, diff));
    setSwipeOffset(clamped);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    setTouchStart(null);
    if (swipeOffset > 80) handleAccept();
    else if (swipeOffset < -80) handleReject();
    setSwipeOffset(0);
  };

  const remaining = drafts.length - currentIndex;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          ← Map
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Review Queue</h1>
        <span className="text-sm text-gray-500 w-12 text-right">{remaining} left</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
        {!current ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">No drafts to review</p>
            <p className="text-gray-400 text-sm">Add text via the Chrome extension or Quick Add to create draft pins.</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-[#1B365D] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Back to Map
            </Link>
          </div>
        ) : (
          <>
            <div
              className="relative w-full rounded-2xl shadow-xl overflow-hidden bg-white"
              style={{
                aspectRatio: "3/4",
                maxHeight: "70vh",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={isSwiping ? handleTouchMove : undefined}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div
                className="absolute inset-0 p-6 flex flex-col transition-transform duration-150 ease-out"
                style={{ transform: `translateX(${swipeOffset}px)` }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-3xl">{getCategoryIcon(current.category)}</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase">{current.category}</span>
                  {current.rating != null && current.rating > 0 && (
                    <StarRating rating={current.rating} count={current.userRatingCount} />
                  )}
                  {isVegetarianFriendly(current.note) && (
                    <span
                      className="ml-auto px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: "#007A78" }}
                    >
                      Veg-friendly
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{current.name}</h2>
                <p className="text-base text-gray-600 flex-1 overflow-y-auto leading-relaxed" style={{ lineHeight: 1.5 }}>
                  {current.note}
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(current.name + " 360")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1B365D] font-medium inline-flex items-center gap-1"
                  >
                    <span aria-hidden>▶</span> Watch 360° videos
                  </a>
                  {(current.sourceUrl || current.sourceTitle) && (
                    <a
                      href={current.sourceUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-[#1B365D] truncate"
                    >
                      {current.sourceTitle || "View source"}
                    </a>
                  )}
                  {current.coordinates && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${current.coordinates.lat},${current.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1B365D] font-medium"
                    >
                      🚗 Get directions
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-8 mt-8 justify-center items-center" style={{ paddingBottom: "24px" }}>
              <button
                onClick={handleReject}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 active:scale-95 transition-transform"
                aria-label="Reject"
              >
                <span className="text-2xl">✕</span>
              </button>
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-white hover:opacity-90 active:scale-95 transition-transform"
                style={{ backgroundColor: "#1B365D" }}
                aria-label="Accept"
              >
                <span className="text-2xl">♥</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Swipe or tap to decide</p>
          </>
        )}
      </main>
    </div>
  );
}
