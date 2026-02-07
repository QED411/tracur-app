import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** GET /api/trips - List all trips */
export async function GET() {
  try {
    await ensureSchema();
    const rows = (await sql`
      SELECT id, name, destination, start_date, end_date, created_at
      FROM trips ORDER BY start_date DESC NULLS LAST, created_at DESC
    `) as Record<string, unknown>[];
    const trips = rows.map((r) => ({
      id: r.id,
      name: r.name,
      destination: r.destination ?? null,
      startDate: r.start_date ?? null,
      endDate: r.end_date ?? null,
      createdAt: r.created_at,
    }));
    return NextResponse.json(trips);
  } catch (err) {
    console.error("GET /api/trips:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** POST /api/trips - Create trip, optionally add pins by batch or pin IDs */
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const { name, destination, startDate, endDate, batch, pinIds } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const row = (await sql`
      INSERT INTO trips (name, destination, start_date, end_date)
      VALUES (${name.trim()}, ${destination?.trim() ?? null}, ${startDate || null}, ${endDate || null})
      RETURNING id, name, destination, start_date, end_date, created_at
    `) as Record<string, unknown>[];
    const trip = row[0];
    if (!trip) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

    const tripId = trip.id as string;

    if (batch && typeof batch === "string") {
      await sql`UPDATE pins SET trip_id = ${tripId} WHERE import_batch = ${batch}`;
    }
    if (Array.isArray(pinIds) && pinIds.length > 0) {
      const ids = pinIds.filter((id: unknown) => typeof id === "string");
      for (const id of ids) {
        await sql`UPDATE pins SET trip_id = ${tripId} WHERE id = ${id}`;
      }
    }

    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      destination: trip.destination ?? null,
      startDate: trip.start_date ?? null,
      endDate: trip.end_date ?? null,
      createdAt: trip.created_at,
    });
  } catch (err) {
    console.error("POST /api/trips:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
