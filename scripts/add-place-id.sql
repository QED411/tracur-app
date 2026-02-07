-- Add place_id column for curate route deduplication
-- Run: psql $DATABASE_URL -f scripts/add-place-id.sql

ALTER TABLE pins ADD COLUMN IF NOT EXISTS place_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS pins_place_id_key ON pins (place_id) WHERE place_id IS NOT NULL;
