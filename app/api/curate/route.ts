import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';
import { scrapeArticle } from '@/app/lib/scraper';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/** Parse Gemini's JSON array response - handles markdown/code blocks */
function parseExtractedLocations(raw: string): { name: string; note?: string; category?: string; region?: string }[] {
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
  const result: { name: string; note?: string; category?: string; region?: string }[] = [];
  const validCategories = ['Beach', 'Eat', 'Stay', 'Culture', 'Adventure', 'Do'];
  for (const item of parsed) {
    if (typeof item === 'string') {
      const n = item.trim();
      if (n) result.push({ name: n });
    } else if (item && typeof item === 'object' && 'name' in item && typeof (item as { name: unknown }).name === 'string') {
      const o = item as { name: string; note?: string; tip?: string; recommendation?: string; description?: string; category?: string; region?: string; country?: string };
      const n = String(o.name).trim();
      const note = o.note ?? o.tip ?? o.recommendation ?? o.description;
      const cat = typeof o.category === 'string' && validCategories.includes(o.category) ? o.category : undefined;
      const region = typeof o.region === 'string' ? o.region.trim() : (typeof o.country === 'string' ? o.country.trim() : undefined);
      if (n) result.push({ name: n, note: typeof note === 'string' ? note.trim() : undefined, category: cat, region: region || undefined });
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
  displayName?: string,
  importBatch?: string
) {
  const category = inferCategory(place.name, note, explicitCategory);
  const name = (displayName && displayName.trim()) ? displayName.trim() : place.name;
  const result = await sql`
    INSERT INTO pins (place_id, name, lat, lng, category, note, source_url, status, google_place_id, import_batch)
    VALUES (${place.place_id}, ${name}, ${place.lat}, ${place.lng}, ${category}, ${note ?? null}, ${sourceUrl ?? null}, 'draft', ${place.place_id}, ${importBatch ?? null})
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

    let articleTitle: string | undefined;
    // ---------------------------------------------------------
    // 0. URL scraping (if url provided)
    // ---------------------------------------------------------
    if (url && typeof url === 'string' && url.trim()) {
      const scraped = await scrapeArticle(url.trim());
      content = scraped.text;
      sourceUrl = scraped.url;
      articleTitle = scraped.title;
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

    const titleHint = articleTitle ? `\nArticle title: "${articleTitle}" — if it says "beaches" or similar, the main locations are beaches in the order they appear.` : '';
    const extractionPrompt = `Extract only SPECIFIC destinations (beaches, restaurants, attractions) — NOT parent towns or region overviews.
${titleHint}
Rules:
1. Extract the specific place from each section. For "Cefalù" section with a beach → extract "Spiaggia di Cefalù" (the beach), NOT "Cefalù" (the town). Do NOT create a separate first entry for the town/region.
2. Use proper place names: Spiaggia di Cefalù, Fuseta, Porto de Mós, Petrokopio/Fourni, Jūrmala, San Lorenzo/Gijón.
3. Add "region" for each: country or area (e.g. "Sicily, Italy", "Algarve, Portugal").
4. For "note": use the FULL PARAGRAPH for that specific location. Include nearby square, cathedral, etc.
Return JSON: [{"name":"Place Name","region":"Country or area","note":"full paragraph","category":"Beach"|"Eat"|"Stay"|"Culture"|"Adventure"|"Do"}, ...]
6 sections → 6 objects. First section yields the beach (Spiaggia di Cefalù), not the town.`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractionPrompt + '\n\nText:\n' + content.slice(0, 30000) }] }],
      }),
    });
    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    let items: { name: string; note?: string; category?: string; region?: string }[];
    try {
      items = parseExtractedLocations(rawText);
    } catch {
      items = [{ name: content.slice(0, 200) }];
    }

    // Remove first entry if it appears to be a town/region overview (e.g. "Cefalù" before "Spiaggia di Cefalù")
    if (items.length > 1) {
      const first = items[0].name.trim();
      const second = items[1].name.trim();
      const firstInSecond = second.toLowerCase().includes(first.toLowerCase());
      const firstIsShort = first.split(/\s+/).length <= 2 && first.length < 25;
      if (firstInSecond && firstIsShort) items = items.slice(1);
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, pins: [], sourceUrl: sourceUrl ?? null });
    }

    const pins: Record<string, unknown>[] = [];
    for (const item of items) {
      // Use per-item region first (critical for multi-country articles), else fallback to article context
      const geoContext = (item.region && item.region.trim()) ? item.region.trim() : locationContext || undefined;
      let place = await geocodePlace(item.name, GOOGLE_MAPS_KEY, geoContext);
      if (!place && geoContext) {
        // Retry without context — sometimes place name alone works better
        place = await geocodePlace(item.name, GOOGLE_MAPS_KEY);
      }
      if (!place) continue;
      const relevantExcerpt = item.note?.trim() || null;
      let batch: string | undefined;
      if (sourceUrl) batch = articleTitle ? articleTitle.slice(0, 50) : (() => { try { return new URL(sourceUrl).hostname; } catch { return sourceUrl.slice(0, 50); } })();
      const saved = await savePin(place, relevantExcerpt ?? undefined, sourceUrl, item.category, item.name, batch);
      pins.push({
        id: saved.id,
        name: saved.name ?? item.name ?? place.name,
        lat: saved.lat ?? place.lat,
        lng: saved.lng ?? place.lng,
        category: saved.category ?? inferCategory(place.name, relevantExcerpt ?? undefined, item.category),
        status: saved.status ?? 'draft',
        note: saved.note ?? relevantExcerpt ?? null,
        sourceUrl: sourceUrl ?? null,
        googlePlaceId: place.place_id,
        importBatch: batch ?? null,
      });
    }

    const firstBatch = pins[0]?.importBatch ?? (articleTitle ? articleTitle.slice(0, 50) : null);
    return NextResponse.json({ success: true, pins, sourceUrl: sourceUrl ?? null, importBatch: firstBatch });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('CURATION_ERROR:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
