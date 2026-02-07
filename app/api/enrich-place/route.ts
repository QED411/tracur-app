import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

/** Fetch full place details from Google Places API (New) for map popup */
async function fetchPlaceDetails(placeId: string): Promise<{
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  formattedAddress: string | null;
  photos: { name: string }[];
  openingHours: string[] | null;
}> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const empty = {
    rating: null,
    userRatingCount: null,
    websiteUri: null,
    googleMapsUri: null,
    formattedAddress: null,
    photos: [],
    openingHours: null,
  };
  if (!apiKey) return empty;
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,websiteUri,googleMapsUri,formattedAddress,photos,regularOpeningHours",
        },
      }
    );
    if (!res.ok) return empty;
    const data = await res.json();
    const hours = data.regularOpeningHours?.weekdayDescriptions;
    return {
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
      websiteUri: data.websiteUri ?? null,
      googleMapsUri: data.googleMapsUri ?? null,
      formattedAddress: data.formattedAddress ?? null,
      photos: Array.isArray(data.photos) ? data.photos.map((p: { name?: string }) => ({ name: p.name || "" })).filter((p: { name: string }) => p.name) : [],
      openingHours: Array.isArray(hours) ? hours : null,
    };
  } catch {
    return empty;
  }
}

/** GET: Fetch full place details for map popup (website, photos, etc.) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

  const details = await fetchPlaceDetails(placeId);
  return NextResponse.json(details);
}

/** POST: Enrich a pin by placeId, update Postgres. Body: { placeId, pinId } */
export async function POST(req: Request) {
  try {
    const { placeId, pinId } = await req.json();
    if (!placeId || !pinId) return NextResponse.json({ error: "placeId and pinId required" }, { status: 400 });

    const details = await fetchPlaceDetails(placeId);
    const hasData = details.rating != null || details.userRatingCount != null || details.websiteUri || details.photos.length > 0;
    if (hasData) {
      await ensureSchema();
      const enrichment = {
        rating: details.rating ?? null,
        userRatingCount: details.userRatingCount ?? null,
        websiteUri: details.websiteUri ?? null,
        googleMapsUri: details.googleMapsUri ?? null,
        address: details.formattedAddress ?? null,
        openingHours: details.openingHours ?? null,
        photos: details.photos,
      };
      await sql`
        UPDATE pins SET enrichment = COALESCE(enrichment, '{}'::jsonb) || ${JSON.stringify(enrichment)}::jsonb
        WHERE id = ${pinId}
      `;
    }
    return NextResponse.json({ success: true, ...details });
  } catch (e) {
    console.error("Enrich error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
