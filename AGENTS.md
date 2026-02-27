# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
TraCur is an AI-powered travel curation Next.js 14 app (App Router). It scrapes articles, uses Gemini AI to extract locations, geocodes via Google Places, and displays pins on Google Maps. See `CLAUDE.MD` for full roadmap, UI style guide, and coding standards.

### Running the dev server
```
npm run dev
```
Starts on http://localhost:3000. Hot-reloads on file changes.

### Lint / Build / Test
- **Lint:** `npm run lint` (ESLint via `next lint`; config in `.eslintrc.json`)
- **Build:** `npm run build`
- No automated test suite exists yet (`npm test` is not configured).

### Required environment variables
Create `.env.local` in the project root with:
- `DATABASE_URL` — Neon Postgres connection string
- `GEMINI_API_KEY` — Google Gemini AI key (must NOT have HTTP referrer restrictions; use "None" or "IP addresses" restriction in Google Cloud Console)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps JavaScript API key (needs Maps JS API, Places API, Places API New enabled)
- `YOUTUBE_API_KEY` (optional) — falls back to the Google Maps key

### Gotchas
- The ESLint config (`.eslintrc.json`) must exist before running `npm run lint`, otherwise `next lint` prompts interactively and hangs in non-TTY environments.
- The database schema is auto-migrated on first API call via `ensureSchema()` in `app/lib/db.ts` — no manual migration step needed.
- Without valid API keys, the app still starts and pages render, but Google Maps shows an error overlay and API routes return errors on actual calls.
- `@vercel/postgres` is deprecated in this project; the actual DB driver used is `@neondatabase/serverless`.
