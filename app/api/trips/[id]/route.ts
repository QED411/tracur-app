import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function rowToPin(r: Record<string, unknown>) {
  const e = (r.enrichment as Record<string, unknown>) ?? {};
  return {
    id: r.id,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
    category: r.category ?? "landmark",
    note: r.note ?? "",
    importBatch: r.import_batch ?? null,
    sourceUrl: r.source_url ?? null,
    enrichment: e,
    ticketUrl: e.ticketUrl ?? null,
    status: r.status ?? "confirmed",
    googlePlaceId: r.google_place_id ?? null,
    tripId: r.trip_id ?? null,
  };
}

/** GET /api/trips/[id] - Get trip with pins */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;

    const tripRows = (await sql`
      SELECT id, name, destination, start_date, end_date, created_at FROM trips WHERE id = ${id}
    `) as Record<string, unknown>[];
    const trip = tripRows[0];
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const pinRows = (await sql`
      SELECT id, name, lat, lng, category, note, import_batch, source_url, enrichment, status, google_place_id, trip_id
      FROM pins WHERE trip_id = ${id} ORDER BY created_at ASC
    `) as Record<string, unknown>[];

    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      destination: trip.destination ?? null,
      startDate: trip.start_date ?? null,
      endDate: trip.end_date ?? null,
      createdAt: trip.created_at,
      pins: pinRows.map(rowToPin),
    });
  } catch (err) {
    console.error("GET /api/trips/[id]:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** PATCH /api/trips/[id] - Update trip */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json();

    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const destination = body.destination !== undefined ? (body.destination ? String(body.destination).trim() : null) : undefined;
    const startDate = body.startDate !== undefined ? (body.startDate || null) : undefined;
    const endDate = body.endDate !== undefined ? (body.endDate || null) : undefined;

    if (name !== undefined) await sql`UPDATE trips SET name = ${name} WHERE id = ${id}`;
    if (destination !== undefined) await sql`UPDATE trips SET destination = ${destination} WHERE id = ${id}`;
    if (startDate !== undefined) await sql`UPDATE trips SET start_date = ${startDate} WHERE id = ${id}`;
    if (endDate !== undefined) await sql`UPDATE trips SET end_date = ${endDate} WHERE id = ${id}`;

    const rows = (await sql`SELECT * FROM trips WHERE id = ${id}`) as Record<string, unknown>[];
    const trip = rows[0];
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      destination: trip.destination ?? null,
      startDate: trip.start_date ?? null,
      endDate: trip.end_date ?? null,
      createdAt: trip.created_at,
    });
  } catch (err) {
    console.error("PATCH /api/trips/[id]:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** DELETE /api/trips/[id] - Delete trip (pins get trip_id set to null) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    await sql`DELETE FROM trips WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/trips/[id]:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
