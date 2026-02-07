# Overnight Build Summary

## What was built

### 1. Trips & Itinerary
- **`trips` table** – name, destination, start_date, end_date
- **`pins.trip_id`** – links pins to trips
- **`/trips`** – List trips, create new trip
- **`/trips/[id]** – Trip itinerary with pins, add ticket/booking URL per pin

### 2. Map → Trip flow
- After **Curate**, a **“Plan trip from this batch”** form appears (name + button)
- Creates a trip and assigns all pins in that batch to it
- Redirects to the trip itinerary page

### 3. Ticket links
- Each pin in a trip can have a **ticket/booking URL**
- Stored in `enrichment.ticketUrl`
- UI: “+ Add ticket” or “Edit ticket” on each itinerary item

### 4. Curate improvements
- `import_batch` set from article title when curating from URL
- Batch name returned in curate response for trip creation

### 5. Navigation
- **Trips** and **Review** links in the map header
- Trips page links back to Map and Review

---

## Workflow (Guardian beaches example)

1. **Map** → Paste Guardian beaches URL → **Curate**
2. **Plan trip** → Enter name, click “Plan trip” (adds all pins from that batch)
3. **Trip itinerary** → Add ticket URLs per location (e.g. ferry, museum)
4. **Review** (optional) → Swipe to accept/reject draft pins first
5. **Map** → View pins, scroll sidebar, open popups

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/trips` | GET | List trips |
| `/api/trips` | POST | Create trip (body: name, destination, startDate, endDate, batch?) |
| `/api/trips/[id]` | GET | Get trip with pins |
| `/api/trips/[id]` | PATCH | Update trip |
| `/api/trips/[id]` | DELETE | Delete trip |
| `/api/trips/[id]/pins` | POST | Add pins (body: pinIds[]) |
| `/api/pins/[id]` | PATCH | Update pin (status, ticketUrl, etc.) |

---

## Questions

See **QUESTIONS.md** for items to decide tomorrow.
