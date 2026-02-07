import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function rowToPin(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
    category: r.category ?? "landmark",
    note: r.note ?? "",
    importBatch: r.import_batch ?? null,
    sourceUrl: r.source_url ?? null,
    enrichment: (r.enrichment as Record<string, unknown>) ?? {},
    status: r.status ?? "confirmed",
  };
}

/** PATCH /api/pins/[id] - Update pin (status, coordinates, enrichment) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json();

    const existing = await sql`SELECT * FROM pins WHERE id = ${id}`;
    const r0 = (existing as Record<string, unknown>[])[0];
    if (!r0) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }

    const status = body.status !== undefined ? body.status : r0.status;
    const lat = body.lat !== undefined ? Number(body.lat) : Number(r0.lat);
    const lng = body.lng !== undefined ? Number(body.lng) : Number(r0.lng);
    let enrichment = (r0.enrichment as Record<string, unknown>) ?? {};
    if (body.rating !== undefined || body.userRatingCount !== undefined) {
      enrichment = { ...enrichment, rating: body.rating ?? enrichment.rating, userRatingCount: body.userRatingCount ?? enrichment.userRatingCount };
    }
    if (body.ticketUrl !== undefined) {
      enrichment = { ...enrichment, ticketUrl: body.ticketUrl ? String(body.ticketUrl).trim() : null };
    }

    const rows = await sql`
      UPDATE pins SET status = ${status}, lat = ${lat}, lng = ${lng}, enrichment = ${JSON.stringify(enrichment)}::jsonb
      WHERE id = ${id} RETURNING *
    `;
    const r = (rows as Record<string, unknown>[])[0];
    if (!r) return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    return NextResponse.json(rowToPin(r));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PATCH /api/pins/[id]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/pins/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;

    const rows = await sql`DELETE FROM pins WHERE id = ${id} RETURNING id`;
    if ((rows as unknown[]).length === 0) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/pins/[id]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
