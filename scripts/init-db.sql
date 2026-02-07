-- Run this in Neon SQL Editor or: psql $DATABASE_URL -f scripts/init-db.sql
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
);
