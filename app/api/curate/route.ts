import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
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

// --- 1. DATA BLUEPRINT ---
interface LocationResult {
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  googlePlaceId?: string | null;
  note: string;
}

// --- 3. THE SMART CURATOR ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text ?? body.excerpt ?? "";
    const url = body.url ?? "Unknown Source";
    const title = body.title ?? "New Discovery";

    if (!text) {
      throw new Error("Request body must include 'text' or 'excerpt'.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Add it to .env.local and Vercel Environment Variables.");
    }

    // THE GENERALIZED PROMPT: Forces specific landmarks like beaches.
    const prompt = `
      Extract the SINGLE most specific landmark from the text below.
      
      CRITICAL RULES:
      1. If a beach, hotel, or restaurant is mentioned (e.g., 'Spiaggia di Cefalù'), use THAT as the name, not the town.
      2. You MUST provide real-world coordinates. DO NOT return 0,0.
      3. Since the user is a Lacto-Ovo Vegetarian, highlight any vegetarian food details in the 'note'.
      4. Return the official 'googlePlaceId' for the specific spot if possible.

      Format JSON ONLY: 
      { 
        "locations": [ 
          { 
            "name": "Exact Place Name", 
            "category": "beach|restaurant|hotel|landmark", 
            "coordinates": { "lat": 0.0, "lng": 0.0 }, 
            "note": "Paste full text here",
            "googlePlaceId": "ChIJ..." 
          } 
        ] 
      }

      TEXT TO ANALYZE: "${text}"
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const delays = [2000, 4000, 8000];

    const fetchWithRetry = async (attempt = 0): Promise<Response> => {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        return fetchWithRetry(attempt + 1);
      }
      return res;
    };

    const response = await fetchWithRetry();

    if (!response.ok) {
      const errText = await response.text();
      const errMsg = response.status === 429
        ? "Google Billing Sync in progress. Please wait a moment."
        : `Google API Error: ${response.status} - ${errText}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const rawAiText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("AI failed to find a location.");

    // Strip markdown backticks (```json or ```) that the AI might include
    let cleanedText = jsonMatch[0].trim();
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "");
    console.log("Final AI JSON:", cleanedText);

    const aiResult = JSON.parse(cleanedText);
    const location = aiResult.locations[0] as LocationResult;

    // --- 4. THE SAFETY CATCHER (Prevents Gabon/Null Island) ---
    // If Gemini fails to find coords and returns 0, we fallback to a Cefalu-area default
    const finalLat = location.coordinates.lat === 0 ? 38.0385 : location.coordinates.lat;
    const finalLng = location.coordinates.lng === 0 ? 14.0225 : location.coordinates.lng;

    // --- 5. SAVE AS DRAFT TO FIRESTORE ---
    const pinData = {
      name: location.name || "New Discovery",
      category: location.category || "landmark",
      coordinates: { lat: finalLat, lng: finalLng },
      googlePlaceId: location.googlePlaceId || null,
      note: location.note || text,
      sourceUrl: url,
      sourceTitle: title,
      status: "draft" as const,
      createdAt: new Date(),
      rating: null as number | null,
      userRatingCount: null as number | null,
    };

    const docRef = await addDoc(collection(db, "pins"), pinData);

    // --- 6. ENRICH WITH GOOGLE PLACE RATING (when placeId available) ---
    if (location.googlePlaceId) {
      const { rating, userRatingCount } = await fetchPlaceRating(location.googlePlaceId);
      if (rating != null || userRatingCount != null) {
        await updateDoc(doc(db, "pins", docRef.id), {
          rating: rating ?? null,
          userRatingCount: userRatingCount ?? null,
        });
      }
    }

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Build Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
