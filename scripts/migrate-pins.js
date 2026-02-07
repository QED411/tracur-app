/**
 * Add missing columns to pins table
 * Run: node scripts/migrate-pins.js
 */

const fs = require("fs");
const path = require("path");
try {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch (_) {}

async function migrate() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);

  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS note TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS import_batch TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS enrichment JSONB`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS google_place_id TEXT`;
  await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS place_id TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS pins_place_id_key ON pins (place_id) WHERE place_id IS NOT NULL`;
  console.log("✅ Migration done");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
