import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

/** Run schema creation and migrations (idempotent) */
export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS pins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      category TEXT,
      note TEXT,
      import_batch TEXT,
      source_url TEXT,
      enrichment JSONB,
      status TEXT DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed')),
      google_place_id TEXT,
      place_id TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add missing columns for existing tables (Postgres 9.6+)
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS note TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS import_batch TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS enrichment JSONB`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS google_place_id TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS place_id TEXT`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS pins_place_id_key 
    ON pins (place_id) WHERE place_id IS NOT NULL
  `;

  // Trips table
  await sql`
    CREATE TABLE IF NOT EXISTS trips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      destination TEXT,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL`;
}
