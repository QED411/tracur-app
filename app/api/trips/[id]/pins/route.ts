import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** POST /api/trips/[id]/pins - Add pins to trip (body: { pinIds: string[] }) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json();
    const pinIds = Array.isArray(body.pinIds) ? body.pinIds.filter((x: unknown) => typeof x === "string") : [];

    if (pinIds.length === 0) return NextResponse.json({ success: true, added: 0 });

    for (const pinId of pinIds) {
      await sql`UPDATE pins SET trip_id = ${id} WHERE id = ${pinId}`;
    }
    return NextResponse.json({ success: true, added: pinIds.length });
  } catch (err) {
    console.error("POST /api/trips/[id]/pins:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
