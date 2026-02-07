# Questions for Ash – Review Tomorrow

Questions or decisions noted during the overnight build.

---

## 1. Map: Show all pins or only confirmed?
Currently the map loads all pins (draft + confirmed) so curated pins are visible before review. Alternative: show only confirmed pins (cleaner, but user wouldn't see drafts until they go to Review).

---

## 2. Google Calendar export
Roadmap mentions exporting trips to Google Calendar. Not implemented yet. Needs:
- Google OAuth for Calendar API
- UI: “Export to Calendar” on trip page
- Event format: loose structure (“Lunch options: 3 trattorias”) per roadmap

---

## 3. Trip creation: add pins before or after review?
Flow now: Curate → (optional) Review → Create trip from batch. Pins in the batch (draft or confirmed) are added to the trip. Should we restrict to confirmed only?

---

## 4. Ticket URL: per-pin only?
Tickets are stored per pin in enrichment.ticketUrl. No separate “tickets” table. Is that enough, or do we need flight/hotel-style bookings later?

---

## 5. Guardian URL: default demo
The Guardian beaches article is set up as the demo. Should this be pre-filled somewhere (e.g. Map page placeholder) for quick testing?

---

## 6. Review page: link to YouTube
Review cards link to a YouTube search. Should we integrate the `/api/youtube-search` result directly (one video per card) like the map popup?
