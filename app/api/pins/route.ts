import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** GET /api/pins - List pins (optional ?status=draft|confirmed) */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const rows = status
      ? await sql`
          SELECT id, name, lat, lng, category, note, import_batch, source_url, enrichment, status, google_place_id, created_at
          FROM pins WHERE status = ${status} ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, name, lat, lng, category, note, import_batch, source_url, enrichment, status, google_place_id, created_at
          FROM pins ORDER BY created_at DESC
        `;

    const pins = (rows as Record<string, unknown>[]).map((r) => {
      const enrichment = (r.enrichment as Record<string, unknown>) ?? {};
      return {
        id: r.id,
        name: r.name,
        coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
        category: r.category ?? "landmark",
        note: r.note ?? "",
        importBatch: r.import_batch ?? null,
        sourceUrl: r.source_url ?? null,
        enrichment,
        rating: (enrichment.rating as number) ?? null,
        userRatingCount: (enrichment.userRatingCount as number) ?? null,
        status: r.status ?? "confirmed",
        googlePlaceId: r.google_place_id ?? null,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json(pins);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/pins:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/pins - Create pin(s) */
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const pins = Array.isArray(body) ? body : [body];
    const inserted: Record<string, unknown>[] = [];

    for (const p of pins) {
      const row = await sql`
        INSERT INTO pins (name, lat, lng, category, note, import_batch, source_url, enrichment, status, google_place_id)
        VALUES (
          ${p.name ?? "Unknown"},
          ${Number(p.lat) ?? 0},
          ${Number(p.lng) ?? 0},
          ${p.category ?? "landmark"},
          ${p.note ?? null},
          ${p.importBatch ?? p.import_batch ?? null},
          ${p.sourceUrl ?? p.source_url ?? null},
          ${JSON.stringify(p.enrichment ?? {})}::jsonb,
          ${p.status ?? "confirmed"},
          ${p.googlePlaceId ?? p.google_place_id ?? null}
        )
        RETURNING id, name, lat, lng, category, note, import_batch, source_url, enrichment, status, created_at
      `;
      const r = (row as Record<string, unknown>[])[0];
      if (r) {
        inserted.push({
          id: r.id,
          name: r.name,
          coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
          category: r.category ?? "landmark",
          note: r.note ?? "",
          importBatch: r.import_batch ?? null,
          sourceUrl: r.source_url ?? null,
          enrichment: (r.enrichment as Record<string, unknown>) ?? {},
          status: r.status ?? "confirmed",
          createdAt: r.created_at,
        });
      }
    }

    return NextResponse.json(Array.isArray(body) ? inserted : inserted[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/pins:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/pins?batch=xxx - Delete all pins in a batch */
export async function DELETE(req: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch");

    if (!batch) {
      return NextResponse.json({ error: "Query param 'batch' required" }, { status: 400 });
    }

    const rows = await sql`DELETE FROM pins WHERE import_batch = ${batch} RETURNING id`;
    return NextResponse.json({ success: true, deleted: (rows as unknown[]).length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/pins:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
