import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

async function fetchPlaceRating(placeId: string): Promise<{ rating: number | null; userRatingCount: number | null }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { rating: null, userRatingCount: null };
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount",
        },
      }
    );
    if (!res.ok) return { rating: null, userRatingCount: null };
    const data = await res.json();
    return {
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
    };
  } catch {
    return { rating: null, userRatingCount: null };
  }
}

/** GET: Fetch rating only. POST: Fetch rating and update pin in Firestore. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

  const { rating, userRatingCount } = await fetchPlaceRating(placeId);
  return NextResponse.json({ rating, userRatingCount });
}

/** POST: Enrich a pin by placeId, update Firestore. Body: { placeId, pinId } */
export async function POST(req: Request) {
  try {
    const { placeId, pinId } = await req.json();
    if (!placeId || !pinId) return NextResponse.json({ error: "placeId and pinId required" }, { status: 400 });

    const { rating, userRatingCount } = await fetchPlaceRating(placeId);
    if (rating != null || userRatingCount != null) {
      await updateDoc(doc(db, "pins", pinId), {
        rating: rating ?? null,
        userRatingCount: userRatingCount ?? null,
      });
    }
    return NextResponse.json({ success: true, rating, userRatingCount });
  } catch (e) {
    console.error("Enrich error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
