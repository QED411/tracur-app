/**
 * Test Neon Postgres connectivity
 * Run: node scripts/check-neon.js
 *       or: node --env-file=.env.local scripts/check-neon.js  (Node 20.6+)
 * Requires: .env.local with DATABASE_URL (or set DATABASE_URL)
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

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

async function check() {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);

    console.log("Connecting to Neon...");
    const result = await sql`SELECT 1 as ok, current_database() as db`;
    console.log("✅ Connected:", result[0]);

    const tables = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pins' 
      ORDER BY ordinal_position
    `;
    console.log("\nPins table columns:", tables.length ? tables : "(table empty or missing)");

    if (tables.length > 0) {
      const count = await sql`SELECT count(*)::int as n FROM pins`;
      console.log("Row count:", count[0]?.n ?? 0);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.code) console.error("   Code:", err.code);
    process.exit(1);
  }
}

check();
