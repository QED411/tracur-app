import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';
import { scrapeArticle } from '@/app/lib/scraper';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/** Parse Gemini's JSON array response - handles markdown/code blocks */
function parseExtractedLocations(raw: string): { name: string; note?: string; category?: string }[] {
  const cleaned = raw.replace(/```json|```\s*/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error('Could not parse extracted locations from AI response');
  }
  if (!Array.isArray(parsed)) return [];
  const result: { name: string; note?: string; category?: string }[] = [];
  const validCategories = ['Beach', 'Eat', 'Stay', 'Culture', 'Adventure', 'Do'];
  for (const item of parsed) {
    if (typeof item === 'string') {
      const n = item.trim();
      if (n) result.push({ name: n });
    } else if (item && typeof item === 'object' && 'name' in item && typeof (item as { name: unknown }).name === 'string') {
      const o = item as { name: string; note?: string; tip?: string; recommendation?: string; description?: string; category?: string };
      const n = String(o.name).trim();
      const note = o.note ?? o.tip ?? o.recommendation ?? o.description;
      const cat = typeof o.category === 'string' && validCategories.includes(o.category) ? o.category : undefined;
      if (n) result.push({ name: n, note: typeof note === 'string' ? note.trim() : undefined, category: cat });
    }
  }
  return result;
}

/** Geocode a single location via Google Places Text Search (with optional location bias) */
async function geocodePlace(
  locationName: string,
  apiKey: string,
  locationContext?: string
): Promise<{ place_id: string; name: string; lat: number; lng: number } | null> {
  const query = locationContext
    ? `${locationName}, ${locationContext}`.trim()
    : locationName;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results?.length) return null;
  const p = data.results[0];
  return {
    place_id: p.place_id,
    name: p.name,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
  };
}

/** Infer category from name, note, or explicit category */
function inferCategory(name: string, note?: string, explicitCategory?: string): string {
  if (explicitCategory) return explicitCategory;
  const text = ((name || '') + ' ' + (note || '')).toLowerCase();
  if (/restaurant|food|pizza|burger|cafe|bistro|trattoria|osteria|gelato|dinner|lunch|steak|ramen|sushi|noodle|kitchen|grill|bar|pub|menu|eat/i.test(text)) return 'Eat';
  if (/hotel|resort|airbnb|stay|apartment|bnb|hostel|accommodation/i.test(text)) return 'Stay';
  if (/beach|spiaggia|lido|cove|sea|ocean|sand|swim|lagoon|petrokopio|cefalù|cefalu|turquoise|golden sand/i.test(text)) return 'Beach';
  if (/ski|surf|dive|climb|kayak|hike|trail|mountain|sport|stadium|arena|golf/i.test(text)) return 'Adventure';
  if (/museum|gallery|church|cathedral|duomo|ruins|theater|history|art|palace|castle|culture|norman|byzantine|mosaic/i.test(text)) return 'Culture';
  return 'Do';
}

/** Save a single pin to Postgres (draft status, ON CONFLICT DO NOTHING) */
async function savePin(
  place: { place_id: string; name: string; lat: number; lng: number },
  note?: string,
  sourceUrl?: string,
  explicitCategory?: string,
  displayName?: string
) {
  const category = inferCategory(place.name, note, explicitCategory);
  const name = (displayName && displayName.trim()) ? displayName.trim() : place.name;
  const result = await sql`
    INSERT INTO pins (place_id, name, lat, lng, category, note, source_url, status, google_place_id)
    VALUES (${place.place_id}, ${name}, ${place.lat}, ${place.lng}, ${category}, ${note ?? null}, ${sourceUrl ?? null}, 'draft', ${place.place_id})
    ON CONFLICT (place_id) DO NOTHING
    RETURNING *;
  `;
  const row = Array.isArray(result) ? result[0] : (result as { rows?: unknown[] })?.rows?.[0];
  if (row) return row as Record<string, unknown>;
  return { id: place.place_id, place_id: place.place_id, name, lat: place.lat, lng: place.lng, category, status: 'existing', note: note ?? null };
}

export async function POST(req: NextRequest) {
  try {
    const { excerpt, text, url } = await req.json();
    let content = (excerpt ?? text ?? '').toString().trim();
    let sourceUrl: string | undefined;

    // ---------------------------------------------------------
    // 0. URL scraping (if url provided)
    // ---------------------------------------------------------
    if (url && typeof url === 'string' && url.trim()) {
      const scraped = await scrapeArticle(url.trim());
      content = scraped.text;
      sourceUrl = scraped.url;
    }
    if (sourceUrl === undefined && url && typeof url === 'string' && url.trim()) {
      sourceUrl = url.trim();
    }

    if (!content || content.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Missing text/excerpt or could not scrape content from URL' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 1. AI extraction (Gemini) - bulk or single
    // ---------------------------------------------------------
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!GEMINI_API_KEY || !GOOGLE_MAPS_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing GEMINI_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' },
        { status: 500 }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // First pass: extract primary location context (city/region) for accurate geocoding
    const contextPrompt = `From this text, extract the PRIMARY location (city and country if mentioned). Examples: "Florence, Italy", "Tokyo", "London, UK". Reply with ONLY the location string, nothing else. If unclear, reply "".`;
    const contextRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt + '\n\nText:\n' + content.slice(0, 1500) }] }],
      }),
    });
    const contextData = await contextRes.json();
    const locationContext = contextData.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["']|["']$/g, '') ?? '';

    const extractionPrompt = content.length > 500
      ? `Extract ALL specific location/place names (restaurants, hotels, attractions, beaches, neighborhoods, etc.) from this text.
IMPORTANT: When text describes a destination with a dominant natural or landmark feature (e.g. a beach in a town, a cathedral), extract that FEATURE with its proper/local name. Example: "Cefalù has a perfect half-moon beach" → extract "Spiaggia di Cefalù" (the beach), not just "Cefalù" (the town). Use Italian names for Italian places: Spiaggia = beach, Duomo = cathedral.
CRITICAL: Each "note" must be ONLY the tip or evocative description for THAT specific place. Do NOT mix notes between places.
Include a "category" for each: "Beach", "Eat", "Stay", "Culture", "Adventure", or "Do" based on what the place is.
Return JSON only: [{"name":"Place Name","note":"description for this place","category":"Beach"}]
If no tip, use "note":"".`
      : `Extract the PRIMARY place from this descriptive text. When a beach, cathedral, or landmark is the main focus, use its proper name (e.g. "Spiaggia di Cefalù" for a beach in Cefalù). Put the evocative description in "note". Include "category": "Beach"|"Eat"|"Stay"|"Culture"|"Adventure"|"Do".
Return JSON: [{"name":"Place Name","note":"description","category":"Beach"}]. Only the JSON array.`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractionPrompt + '\n\nText:\n' + content.slice(0, 30000) }] }],
      }),
    });
    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    let items: { name: string; note?: string; category?: string }[];
    try {
      items = parseExtractedLocations(rawText);
    } catch {
      items = [{ name: content.slice(0, 200) }];
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, pins: [], sourceUrl: sourceUrl ?? null });
    }

    // ---------------------------------------------------------
    // 2. Geocode each location (Google Places)
    // ---------------------------------------------------------
    const pins: Record<string, unknown>[] = [];
    for (const item of items) {
      const place = await geocodePlace(item.name, GOOGLE_MAPS_KEY, locationContext || undefined);
      if (!place) continue;
      const saved = await savePin(place, item.note ?? undefined, sourceUrl, item.category, item.name);
      pins.push({
        id: saved.id,
        name: saved.name ?? item.name ?? place.name,
        lat: saved.lat ?? place.lat,
        lng: saved.lng ?? place.lng,
        category: saved.category ?? inferCategory(place.name, item.note, item.category),
        status: saved.status ?? 'draft',
        note: saved.note ?? item.note ?? null,
        sourceUrl: sourceUrl ?? null,
        googlePlaceId: place.place_id,
      });
    }

    return NextResponse.json({ success: true, pins, sourceUrl: sourceUrl ?? null });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('CURATION_ERROR:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
