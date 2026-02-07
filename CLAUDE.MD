# 📍 Tracur Product Roadmap

**Vision:** A seamless "Tinder-style" travel curator that helps users discover, refine, and plan trips based on their specific dietary, interest, and accessibility needs.

---

## 🟢 Phase 1: The "Dreaming" Engine (Current Focus)
- [x] **Chrome Extension MVP:** Capture snippets from articles and send them to the API.
- [x] **Curation API:** Use Gemini 3 Pro to extract precise locations and Google Place IDs.
- [x] **Lacto-Ovo Vegetarian Filter:** Automatically highlight vegetarian options for the user.
- [ ] **Review Queue (The "Tinder" UI):** A dedicated `/review` page to swipe through "Draft" pins.
- [ ] **Rich Content Enrichment:** Integrate YouTube 360° videos and Google Star ratings into the review cards.

## 🟡 Phase 2: Personalization & Memory
- [ ] **User Preference Profile:** Initial input for dietary (Lacto-Ovo), disabilities, and interests (Skiing, Squash).
- [ ] **Learning Feedback Loop:** Use "Accepted" vs "Rejected" pins to refine future Gemini extractions.
- [ ] **Original Source Backlinks:** Ensure every pin links back to the original article for context.

## 🔴 Phase 3: The Itinerary Builder
- [ ] **Interactive Map View:** View all "Confirmed" pins on a global map.
- [ ] **Trip Grouping:** Organize pins into specific upcoming trips (e.g., "Niseko Ski 2026").
- [ ] **Sharing & Collaboration:** Invite family to swipe on potential locations.
- [ ] # TraCur: Key Insights from User Research & Updated Requirements

## What I Learned from Rick Steves Forum Reviews

### What Users LOVE About Wanderlog
- **Visual map interface** - seeing pins clustered helps plan days efficiently
- **Restaurant discovery** - search a city, see restaurants with photos and ratings
- **Optimize route** feature - rearranges places by distance/time
- **Sections & lists** - organize by region, then move to daily itinerary
- **Color coding** - different colors for different days or categories
- **Budget tracking** - though currency conversion is basic
- **Ease of use** - intuitive drag and drop

### What Users HATE About Wanderlog
- **Can't move reservations between trips** - painful for multi-segment planning
- **Email forwarding is janky** - often fails to parse, especially non-English
- **No calendar integration** - can't export to Google Calendar
- **Limited search** - can't search your own itinerary
- **Information overload** - too much at once, overwhelming
- **10-layer limit on Google My Maps** - hits ceiling with power users
- **No comprehensive export** - can't export to PDF/Word/Calendar easily
- **Annoying tip popups** - get in the way during use

### What Users LOVE About TripIt
- **Flight alerts** - notifies of delays/changes BEFORE airlines do
- **Clean information architecture** - just the facts, organized
- **Works across devices** - phone, tablet, computer sync
- **Historical trips** - can reference old trips years later
- **Email parsing** - mostly works well for flights/hotels
- **Calendar sync** - syncs to Google Calendar (though not real-time)

### What Users HATE About TripIt
- **Too boring/business-focused** - feels like work, not vacation
- **Limited activity features** - doesn't help with daily planning
- **Too much information** - some users found it overwhelming
- **Manual entry required** - for things email doesn't capture
- **No fun discovery** - doesn't suggest restaurants/activities
- **Cluttered calendar entries** - exports too much detail to calendar

### The Gap TraCur Must Fill

**What EVERY user complained about:**
1. **Scattered information** - bookmarks, emails, notes, screenshots everywhere
2. **Re-entering data** - same info typed into multiple apps
3. **Can't find things** - saved something months ago, can't locate it
4. **Switching between apps** - planning uses 5+ different tools
5. **Information overload** - too many options, paralysis sets in
6. **Missing the "good surprises"** - over-planning kills serendipity

**What users ACTUALLY do (not what apps assume):**
- Research 6-12 months out (not week before)
- Save ideas gradually over time (not all at once)
- Make decisions over weeks (not in one planning session)
- Want flexibility during trip (not rigid schedules)
- Value authentic/local (not tourist traps)
- Trust personal recommendations (not algorithms)

---

## Updated Requirements from Final Discussion

### Core Philosophy: "Structured Serendipity"
**We are NOT building a planning app**
- TraCur curates OPTIONS, doesn't plan itineraries
- User maintains agency and discovery
- Like a trusted friend sharing secrets
- Preserves the "good surprise" of authentic travel

### Twitter Thread Processing (Critical Feature)
**User workflow:**
1. See Twitter thread: "I'm going to Philly with my 12-year-old - tell me what to do"
2. Thread has 20+ replies with ideas
3. Send entire thread to TraCur
4. TraCur AI:
   - Extracts all location mentions
   - Cross-references with user's trusted sources
   - Enriches each with context (hours, menus, videos)
   - Creates draft Philly map
5. User reviews: Accept/Ignore each suggestion
6. Final curated map ready

**Why this matters:** Twitter threads are WHERE real recommendations happen, not in blogs or formal reviews. This is the "friend sharing secrets" experience.

### Google Calendar Integration (Not Planning App)
**Export loose structure:**
- "Lunch options: 3 trattorias nearby"
- "Morning: Uffizi Gallery" (with ticket PDF attached)
- User chooses in the moment
- Calendar shows possibilities, not rigid schedule

**Attachment handling:**
- PDFs (tickets, menus, maps) attach to calendar events
- TraCur doesn't host documents (keeps it light)
- Links to user's Gmail/Google Drive instead

**Why this matters:** People already use Google Calendar. Don't rebuild what exists, integrate with it.

### Family/Kids Features
**Kids mode:**
- Daily quiz: "We're at the Louvre - find the orange in this painting"
- Scavenger hunt preparation
- YouTube videos to build excitement
- Restaurant menus to browse ahead of time
- Educational but fun

**Pre-trip engagement:**
- Flashcards over days/weeks
- Build anticipation without overwhelm
- Kids learn about destination gradually
- Aryan (high school junior) gets history/science context

**Why this matters:** Travel planning is family activity, kids need their own interface.

### Voice-First Design
**Primary use while traveling:**
- "Tracur, best gelato near me" → Reads top 3 options
- "Tracur, save this place" → GPS + voice note
- "Tracur, what to order at Trattoria Mario?" → Menu + recommendations
- AI transcribes and categorizes automatically

**Voice note cleanup:**
- User: "Amazing mac and cheese at steakhouse, kids loved it"
- AI cleanup: Categorizes as "Vegetarian options at omnivore restaurants"
- Saves to proper map with clean transcription

**Why this matters:** Hands-free essential with family, walking around, busy moments.

### Location-Triggered Intelligence
**While traveling:**
- Google Maps shows TraCur pins overlaid
- Buzzes when near curated location
- "3 gelato spots within 5-min walk"
- Click location → Full context (menu, videos, tips)
- Navigate via Google Maps seamlessly

**Why this matters:** ONE app while traveling, not switching between 5.

### Import Existing Data (Critical for Ash)
**Launch strategy:**
1. Import Ash's existing Google My Maps (London, Dolomites, Japan)
2. Import Wanderlog itineraries
3. AI analyzes patterns to learn Ash's taste
4. Use as training data for new maps

**Generate new maps based on patterns:**
- "Create CDMX map based on Ash's taste"
- AI knows: Vegetarian-first, authentic local, family-friendly, mid-range
- Surfaces vegetarian street taco carts
- Includes YouTube videos from trusted sources
- Ash reviews/refines via flashcards

**Why this matters:** Prove value immediately with existing data, don't start from zero.

### Vegetarian/Dietary Critical Filter
**Always-on preference:**
- Default view shows vegetarian-first
- Smart: Also shows "Great veg options at omnivore restaurants"
- Example: "Amazing mac & cheese at steakhouse"
- Better than Happy Cow (which misses creative veg at non-veg places)

**Why this matters:** Ash is vegetarian, his family eats vegetarian, this is non-negotiable.

### Preserve "Good Surprise" Serendipity
**Design principles:**
- Show OPTIONS, not decisions
- Curate possibilities, user chooses
- No rigid schedules
- No "you must do this at 2pm"
- Framework + freedom

**Anti-patterns to avoid:**
- Minute-by-minute itineraries
- "Best route" optimization (kills discovery)
- Algorithmic recommendations (not personal)
- Overwhelming choice (analysis paralysis)

**Instead:**
- "Here are 5 gelato places near you - all good"
- User picks based on mood/weather/energy
- Structured (curated list) + serendipity (choice in moment)

---

## Revised MVP Based on All Research

### Phase 1: Chrome Extension (Weeks 1-4)
**Core capture:**
1. Highlight text → Save to TraCur
2. **Twitter thread capture:** Send whole thread → AI extracts locations
3. **Bulk scraping:** "Scrape Guardian Travel for Florence ideas"
4. **Import existing:** Google My Maps + Wanderlog

**AI enrichment:**
- Extract location + context
- Find relevant YouTube videos (Smart History, etc.)
- Pull menus for restaurants
- Cross-reference user's trusted sources

**Storage:**
- Firebase backend
- Syncs to Google My Maps
- Exports to Google Calendar

### Phase 2: Progressive Web App (Weeks 5-8)
**Mobile experience:**
- Share-to-TraCur from any app
- Voice capture: "Save this place"
- Voice discovery: "Gelato near me"
- Location-triggered notifications

**Flashcards:**
- Daily: "Florence Flashcard - Trattoria Mario"
- Swipe to save/skip
- Builds maps over time (hobby mode)
- Kids get age-appropriate versions

**Google Maps overlay:**
- TraCur pins show in Google Maps
- Tap → Full context
- Navigate via Google Maps
- ONE app while traveling

### Phase 3: Family Features (Weeks 9-12)
**Kids mode:**
- Quizzes based on upcoming attractions
- YouTube videos to build excitement
- Restaurant menus to browse
- Scavenger hunt preparation

**Group collaboration:**
- Family members add finds to shared map
- Pool of options to choose from
- Vote/favorite to narrow down
- Export to shared Google Calendar

---

## Critical Success Factors

### For Ash Personally
1. **Imports London maps** - proves value day one
2. **Voice works perfectly** - essential for travel with family
3. **AI learns his taste** - generates good CDMX map from Dolomites/Japan patterns
4. **Vegetarian filter** - always shows relevant options
5. **Google Calendar export** - family can see possibilities

### For Friends/Beta Users
1. **Twitter thread capture** - they see the magic immediately
2. **Flashcards are fun** - hobby mode, not work mode
3. **Beautiful design** - premium feel justifies price
4. **Location triggers work** - useful while traveling
5. **Shares easily** - word of mouth growth

### For Business Model
1. **$500/year justified** - saves hours of research + better trips
2. **B2B partnerships viable** - AirBnB hosts, tourism boards, publishers
3. **Sustainable as 1-2 person business** - AI does heavy lifting
4. **1,000 true fans achievable** - self-selecting audience who values curation

---

## What Makes TraCur Different

**NOT:**
- Planning app (that's Wanderlog/TripIt)
- Booking engine (that's Expedia/Booking.com)
- Review site (that's TripAdvisor/Yelp)
- Social network (that's Instagram)

**IS:**
- **Curation engine** - Store ideas from anywhere
- **Location-triggered assistant** - "What's good near me right now?"
- **Voice-first discovery** - "TraCur, best gelato around here?"
- **Flashcard learning** - Absorb options over days/weeks, not all at once
- **Single app while traveling** - Don't switch between 5 apps
- **Trusted friend sharing secrets** - Preserves serendipity

**The tagline:**
"TraCur: Your trusted friend's travel secrets, when and where you need them"

Or:

"TraCur: Structured serendipity for authentic travelers"
# TraCur: Complete Product Roadmap
## MVP-First Strategy for Individual Users

**Last Updated**: February 4, 2026  
**Vision**: Structured serendipity for authentic travelers  
**Primary User**: You (Ash) + friends → Goal: 1,000 users @ $500/year

---

## What We're Building

**TraCur replaces 5+ tools with ONE:**
- ❌ Wanderlog (janky, no calendar export)
- ❌ Google My Maps (10-layer limit, manual)
- ❌ Google Keep (unorganized notes)
- ❌ Email (scattered confirmations)
- ❌ YouTube (manual searches)

**✅ TraCur = All of the above, but:**
- AI-enriched (auto-finds videos, menus, tips)
- Voice-first (hands-free while traveling)
- Location-triggered (knows where you are)
- Exports to Google Calendar (family sees plans)
- Preserves serendipity (options, not rigid schedules)

---

# PHASE 1: MVP (8 Weeks)
## Goal: Working app you use for next London trip

### Week 1-2: Foundation + Import

#### What Works After Week 2:
✅ Import your Google My Maps (London, Dolomites, Japan)  
✅ Import Wanderlog itineraries  
✅ Chrome extension installed  
✅ Highlight text on Guardian → Sidebar opens → Save to map  
✅ AI extracts location + recommendation from article  

#### User Stories

**US-001: Import Existing Maps**
```yaml
Actor: Ash
Goal: Import 200+ pins from Google My Maps and Wanderlog
Why: Don't re-enter data; TraCur learns my taste immediately

Acceptance Criteria:
  - Click "Import from Google My Maps" → OAuth → Select maps
  - All pins import with names, locations, categories, notes
  - Display: "Imported 247 locations from 5 maps"
  - AI analyzes patterns: "Detected: Vegetarian, family-friendly, mid-range, history/science focus"
  - Trusted sources identified: "Rick Steves (47x), Guardian (23x), Smart History (31x)"
  - Imports complete in <2 minutes

Technical:
  - Google My Maps API (KML export)
  - Wanderlog CSV upload
  - Claude API analyzes notes for patterns
  - Store: Firestore users/{userId}/maps/{mapId}/pins/{pinId}
```

**US-002: Chrome Extension - Highlight & Save**
```yaml
Actor: Ash reading Guardian.co.uk/travel
Goal: Save "Trattoria Mario in Florence" with one click
Why: Capture while researching without copy/paste/switching apps

Acceptance Criteria:
  - Highlight: "Best pasta at Trattoria Mario - order the tagliatelle"
  - Right-click → "Save to TraCur" (or Cmd+Shift+S)
  - Sidebar opens showing:
    * Detected location on mini Google Map
    * Extracted tip: "Order the tagliatelle"
    * Category dropdown (pre-selected: Food)
    * Map selector (Florence)
  - Click Save → Pin added
  - Sidebar stays open: "Add another from this article?"

Technical:
  - Chrome Extension Manifest V3
  - Content script captures highlighted text
  - Claude API: Extract location + context
  - Google Places API: Geocode + verify
  - Save to Firestore
```

**US-003: AI Taste Profile**
```yaml
Actor: System (automated)
Goal: Learn Ash's preferences from imported maps
Why: Inform future recommendations, enrichment, generation

Acceptance Criteria:
  - Runs after import completion
  - Analyzes all 247 pins and notes
  - Identifies:
    * Dietary: "Vegetarian-first; creative veg at omnivore restaurants OK"
    * Budget: "Mid-range (€15-40/meal), local authentic over luxury"
    * Interests: "Renaissance art, history of science, family activities"
    * Sources: Rick Steves, Guardian, Smart History most-cited
  - Shows summary: "Here's what I learned - confirm/edit?"
  - Saves as users/{userId}/tasteProfile

Technical:
  - Cloud Function triggered on import
  - Claude API pattern analysis
  - Natural language processing on notes
  - Extract price ranges, keywords, source citations
```

---

### Week 3-4: Core Enrichment

#### What Works After Week 4:
✅ Bulk scrape: "Get all Florence ideas from this Guardian article"  
✅ AI finds relevant YouTube videos (Smart History, Rick Steves)  
✅ Restaurant menus auto-attached  
✅ Vegetarian filter highlights appropriate options  

#### User Stories

**US-004: Bulk Article Scraping**
```yaml
Actor: Ash
Goal: Extract 23 Florence locations from one Guardian article
Why: Build draft map in 5 minutes instead of 2 hours

Acceptance Criteria:
  - Paste URL: "https://www.theguardian.com/travel/florence"
  - TraCur scrapes entire article
  - Shows preview: "Found 23 locations - review before adding?"
  - List shows:
    * Restaurant name + "Order the bistecca"
    * Museum name + "Don't miss the Botticelli room"
    * Each with checkbox (checked by default)
  - Bulk actions: "Add all restaurants" or "Add checked only"
  - Background processing, email when done
  - Result: Draft Florence map with 23 enriched pins

Technical:
  - Cloud Function with Puppeteer (headless browser)
  - Claude API extracts location mentions + tips
  - Batch geocoding (Google Places API)
  - Queue for long articles
  - Email notification via SendGrid
```

**US-005: Auto-Find YouTube Videos**
```yaml
Actor: Ash saves "Uffizi Gallery, Florence"
Goal: Relevant videos auto-attached without manual search
Why: Save 5 minutes per location × 50 locations = 4 hours saved

Acceptance Criteria:
  - Save location → TraCur searches YouTube
  - Prioritizes channels: Smarthistory, Rick Steves, art historians
  - Shows 3 best results with thumbnails
  - Example results:
    * "Uffizi Gallery Highlights" - Smarthistory (4:23)
    * "Uffizi Tour" - Rick Steves' Europe (8:45)
    * "Botticelli at the Uffizi" - Khan Academy (6:12)
  - Click checkbox to attach (or attach all)
  - Videos saved with pin
  - Later: Click pin → "Watch 3 videos"

Technical:
  - YouTube Data API v3
  - Search query: "{location name} {trusted channel}"
  - Filter by: views, ratings, channel authority
  - Store: pins/{pinId}/videos/[{title, url, duration, channel}]
```

**US-006: Restaurant Menu Extraction**
```yaml
Actor: Ash (vegetarian)
Goal: See menu before deciding where to eat
Why: Check vegetarian options without visiting 5 websites

Acceptance Criteria:
  - Save "Trattoria Mario, Florence"
  - TraCur searches for menu:
    * Restaurant website (scrape)
    * Google Maps photos (OCR)
    * TripAdvisor menu section
  - Extracts text from images if needed
  - Highlights vegetarian dishes in green
  - Shows: "Vegetarian options: Pappardelle al Sugo di Noci, Ribollita, Panzanella"
  - Attaches full menu PDF/image
  - Later: Click pin → See menu instantly

Technical:
  - Web scraping (restaurant websites)
  - Google Vision API (OCR for menu photos)
  - Claude API: Identify vegetarian dishes
  - Store in Cloud Storage, link in Firestore
  - Fallback: Link to menu URL if scraping fails
```

**US-007: Vegetarian Filter Always-On**
```yaml
Actor: Ash
Goal: Never waste time on non-vegetarian restaurants
Why: Default filter matches my dietary needs

Acceptance Criteria:
  - Vegetarian restaurants auto-flagged (Happy Cow, menu analysis)
  - Also flags: "Great veg options at omnivore restaurants"
  - Example: Steakhouse with "amazing mac & cheese" = flagged
  - Map shows:
    * Green pin: Vegetarian restaurant
    * Yellow pin: Omnivore with good veg options
    * Gray pin: Limited/no veg (hidden by default)
  - Toggle: Show all / Veg-friendly only
  - Default: Veg-friendly only

Technical:
  - Happy Cow API (vegetarian restaurant database)
  - Menu parsing for veg dishes
  - Claude API: Assess veg-friendliness from notes
  - Firestore flag: pins/{pinId}/vegetarianLevel (full/partial/none)
```

---

### Week 5-6: Mobile & Voice

#### What Works After Week 6:
✅ Install TraCur PWA on iPhone (no app store)  
✅ Share articles from mobile → TraCur processes  
✅ Voice: "TraCur, save this place" (GPS + voice note)  
✅ Voice: "TraCur, gelato near me" (reads top 3 options)  

#### User Stories

**US-008: Progressive Web App**
```yaml
Actor: Ash on iPhone
Goal: Use TraCur like native app without app store
Why: Avoid Apple's 30% fee, faster updates

Acceptance Criteria:
  - Visit tracur.com on mobile Safari
  - Prompt: "Install TraCur?" → Add to Home Screen
  - Icon appears on home screen
  - Opens fullscreen (no browser chrome)
  - Works offline for saved maps
  - Share sheet: "Share to TraCur" from Safari, Instagram
  - Shared URLs go to inbox for later curation
  - Syncs when online

Technical:
  - PWA manifest.json
  - Service worker for offline
  - IndexedDB for local storage
  - Background sync API
  - Share target API for "Share to TraCur"
```

**US-009: Voice Capture**
```yaml
Actor: Ash walking past great restaurant
Goal: Save location hands-free without stopping
Why: Kids in tow, can't type, don't want to forget

Acceptance Criteria:
  - Open TraCur app → Voice button
  - Say: "Save this place - amazing mac and cheese, kids loved it"
  - TraCur:
    * Gets GPS location
    * Transcribes voice
    * Searches Google Places for nearest restaurant
    * Shows: "Is this Steakhouse 123 on Main St?"
  - Confirm or correct
  - Saves with cleaned note: "Amazing mac & cheese, kids loved it"
  - Category: "Vegetarian options at omnivore restaurant"

Technical:
  - Web Speech API (voice recognition)
  - Geolocation API (GPS coordinates)
  - Google Places Nearby Search
  - Claude API: Clean transcription, categorize
  - Confirmation UI (photo + name)
```

**US-010: Voice Discovery**
```yaml
Actor: Ash walking in Florence
Goal: Find gelato without pulling out phone to read
Why: Hands-free, immediate answers while exploring

Acceptance Criteria:
  - Say: "TraCur, gelato near me"
  - TraCur responds (audio):
    * "3 curated spots within 5 minutes:
    * Gelateria dei Neri - Try pistachio from Sicilian nuts
    * Vivoli - Oldest in Florence, cream-based flavors
    * La Carraia - Budget option, still excellent"
  - Shows on screen simultaneously
  - Tap any → Navigate via Google Maps
  - Tap microphone → Ask follow-up: "Which is closest?"

Technical:
  - Web Speech API (voice recognition + synthesis)
  - Parse query: Extract category + proximity
  - Filter saved pins: category="food", subtype="gelato", distance<800m
  - Rank by: distance + ratings + source trust
  - Text-to-speech response
```

---

### Week 7-8: Calendar Export & Polish

#### What Works After Week 8:
✅ Select pins → Export to Google Calendar  
✅ PDFs (tickets, menus) attached to events  
✅ Beautiful UI polish based on feedback  
✅ **COMPLETE MVP READY FOR YOUR LONDON TRIP**  

#### User Stories

**US-011: Google Calendar Export**
```yaml
Actor: Ash
Goal: Family sees trip options in Google Calendar
Why: They use calendar, not TraCur; need shared visibility

Acceptance Criteria:
  - View Florence map with 30 pins
  - Select 15 must-dos → "Export to Calendar"
  - Creates calendar: "Florence May 2026"
  - Events added:
    * "Lunch options: Trattoria Mario, Osteria dell'Enoteca, Il Latini"
    * "10am: Uffizi Gallery" (ticket PDF attached)
    * "3pm options: Boboli Gardens OR Piazzale Michelangelo"
  - Each event links back to TraCur pin
  - Times suggested but flexible (can drag/drop)
  - Shared with family via Google Calendar

Technical:
  - Google Calendar API
  - OAuth for calendar access
  - Create calendar or use existing
  - Events include:
    * summary: "Lunch: 3 trattorias"
    * description: Links to TraCur pins + notes
    * attachments: Drive file links (tickets, menus)
    * location: First option's address
```

**US-012: PDF Attachment via Drive**
```yaml
Actor: Ash
Goal: Museum tickets appear in calendar at right time
Why: Everything in one place, no TraCur needed on trip

Acceptance Criteria:
  - Save Uffizi ticket PDF → Uploads to my Google Drive
  - TraCur creates calendar event: "10am: Uffizi Gallery"
  - Ticket attached from my Drive (link, not upload)
  - Calendar notification at 9:30am: "Uffizi in 30min" + ticket
  - Click attachment → PDF opens from my Drive
  - TraCur doesn't store PDF (stays lightweight)
  - Privacy: My documents stay in my Drive

Technical:
  - Google Drive API (upload to user's Drive)
  - Calendar API: Attach Drive file link
  - TraCur stores Drive file ID only
  - User controls sharing/access via Drive settings
```

---

## Post-MVP: Iteration Based on Usage
### Weeks 9-16

**Features to Add After Testing:**

**US-013: Flashcard Curation Mode**
- Daily notification: "Florence Flashcard: Trattoria Mario"
- Swipe to save/skip
- Makes curation feel like game
- 10-15 min daily on commute

**US-014: Kids Quiz Mode**
- "Tomorrow: Uffizi - Quiz: What's David made of?"
- Smart History video after answer
- Scavenger hunt prep
- Educational + fun for Aryan

**US-015: Twitter Thread Capture**
- Share thread → Extract all location mentions
- "Going to Philly with 12yo" → Draft Philly map
- Cross-reference with trusted sources

**US-016: ZTL Alerts (Italy)**
- Map overlay showing restricted zones
- Drive Mode: "ZTL in 500m - park here instead"
- Auto-generate permit requests

**US-017: Booking Runway**
- "Colosseum tickets open 60 days ahead"
- Calendar reminder: "Buy tickets TODAY"
- Direct link to booking site

**US-018: Site Clustering**
- Duomo + Baptistery + Crypt = "Duomo Campus"
- One map pin, expands to show 4 venues
- Reduces map clutter

**US-019: Accessibility Profile**
- Toggle "Limited Mobility"
- Highlights: Elevators, ramps, step-free
- Wheelchair permit forms linked

**US-020: AI-Generated Maps**
- "Create CDMX map based on my taste"
- Uses Dolomites/Japan patterns
- 50 pins generated, user reviews via flashcards

**US-021: Dreamscape Mode**
- Daily: "Escape to Florence for 5min"
- Immersive: Photos, sounds, narration
- Builds maps while entertaining
- Retention engine (use TraCur daily)

---

# Technical Architecture

## Stack

**Frontend:**
- React (web + PWA)
- Chrome Extension (Manifest V3, React)
- Material-UI or Tailwind CSS
- Google Maps JavaScript API

**Backend:**
- **Firebase** (all-in-one):
  - Authentication (Google OAuth)
  - Firestore (NoSQL database)
  - Cloud Functions (Node.js serverless)
  - Cloud Storage (PDFs, images)
  - Hosting (PWA deployment)

**AI & External APIs:**
- Claude API (Anthropic): Text extraction, generation, analysis
- Google Maps: Places, Geocoding, Directions
- Google Calendar API
- Google Drive API
- YouTube Data API v3
- Web Speech API (voice)

**Cost Estimate (MVP):**
- Firebase: $0 (free tier sufficient)
- Claude API: ~$50/month (development)
- Google APIs: ~$100/month (limited usage)
- **Total**: <$200/month MVP

**Cost at Scale (1,000 users):**
- Firebase: ~$500/month
- Claude API: ~$2K/month
- Google APIs: ~$500/month
- **Total**: ~$3K/month = $36K/year
- **Profit**: $500K revenue - $36K costs = $464K (93% margin)

## Data Model (Firestore)

```
users/
  {userId}/
    profile:
      name, email, createdAt
      tasteProfile:
        dietary: ["vegetarian"]
        budget: "mid-range"
        interests: ["art", "history", "family"]
        trustedSources: ["Rick Steves", "Guardian", ...]
    
    maps/
      {mapId}/
        name, destination, dates
        sharedWith: [userIds]
        pins/
          {pinId}/
            name, category, location {lat, lng}
            notes, source, addedDate
            videos: [{title, url, duration, channel}]
            menuUrl, accessibility
            enrichmentData: {fromAI, confidence}
    
    imports/
      {importId}/
        source: "GoogleMyMaps" | "Wanderlog"
        status, importedAt, pinCount

calendarExports/
  {exportId}/
    mapId, pinIds[], googleCalendarId
    exportedAt, lastSync
```

## Security

- Firebase Auth (Google OAuth only for MVP)
- Firestore security rules:
  ```
  match /users/{userId} {
    allow read, write: if request.auth.uid == userId;
  }
  ```
- No third-party analytics
- No ad tracking
- GDPR compliant: Full data export + deletion

---

# Go-to-Market: Individual Users

## Target: 1,000 users @ $500/year = $500K ARR

### Phase 1: Friends & Family (Months 1-2)
- **Target**: 20-50 users
- **Price**: Free beta
- **Channels**: Personal network, word of mouth
- **Goal**: Validate core value, iterate based on feedback

### Phase 2: Soft Launch (Months 3-4)
- **Target**: 100 users
- **Price**: $50 trial (3 months, 3 maps)
- **Channels**:
  - Rick Steves forum post
  - Reddit: r/travel, r/solotravel
  - "I built an alternative to Wanderlog" positioning
- **Goal**: Testimonials, refine pricing, test conversion

### Phase 3: Full Launch (Months 5-8)
- **Target**: 500 users
- **Price**: $500/year
- **Channels**:
  - Product Hunt launch
  - Content marketing: "How I plan trips in 1/4 the time"
  - Travel blogger partnerships
- **Goal**: Product-market fit, 30% trial→paid conversion

### Phase 4: Scale (Months 9-12)
- **Target**: 1,000 users
- **Price**: $500/year (founding members locked)
- **Channels**:
  - Press coverage (Travel + Leisure, Condé Nast)
  - Affiliate program (users refer friends)
  - SEO: "Wanderlog alternative", "Best travel planning app"
- **Goal**: Sustainable business, <10% churn

## Pricing Strategy

**Simple, No Games:**
- **Starter Trial**: $50 for 3 months (max 3 maps)
- **Unlimited Annual**: $500/year (cancel anytime, full refund first 30 days)
- **Founding Members**: First 100 users, $500/year locked forever
- NO free tier, NO monthly option, NO feature tiers

**Why $500/year?**
- Compare to: High-end travel agent ($1,000+ per trip)
- Value: Saves 10+ hours per trip × 3 trips/year = 30 hours
- $500 ÷ 30 hours = $16.67/hour (cheap for time savings)
- Plus: Better trips, less stress, family uses it
- Like Costco: Pay once, peace of mind

---

# Future Phases (Not MVP, But In Roadmap)

## Phase 5: B2B Expansion (Year 2)

**AirBnB Hosts:**
- $99/year per property
- Create curated local map for guests
- Guests get temporary access during stay
- Convert to subscribers post-trip

**Corporate Travel:**
- $2,000/year for 10 employees
- Quick business trip recommendations
- Better than Yelp for road warriors

**Publisher Partnerships:**
- Guardian, NYT, Rick Steves: $20-50K/year
- "Save to TraCur" button in articles
- Revenue share or flat fee

## Phase 6: UHNWI & Travel Agents (Year 2-3)

**Self-Hosted Option:**
- Single-tenant deployment on client's AWS
- Complete privacy, no TraCur access to data
- **Price**: $5-10K/year
- **Target**: 50 installations = $250-500K

**Travel Agent Platform:**
- Ovation, Protravel, Beyond & Back
- Agent creates itineraries for UHNWI clients
- White-label option (agent's branding)
- **Price**: $5-10K/year per agent
- **Target**: 20-50 agents

**Luxury Features (Add Later):**
- Virtuoso sources (not Rick Steves)
- Concierge integrations
- VIP access, private guides
- Security protocols

---

# Success Metrics

## MVP Success (Week 9):
- ✅ Ash uses TraCur exclusively for London trip
- ✅ No need for Wanderlog, Google Keep, email searches
- ✅ Voice capture works reliably
- ✅ Family uses exported calendar successfully
- ✅ Saves 10+ hours of planning time
- ✅ 5 friends request access

## Early Traction (Month 6):
- ✅ 100 active users
- ✅ 50 paying subscribers ($25K ARR)
- ✅ 30% trial→paid conversion
- ✅ NPS >50
- ✅ <10% churn
- ✅ 5+ testimonials

## Product-Market Fit (Month 12):
- ✅ 500-1,000 users
- ✅ $250-500K ARR
- ✅ Organic growth (word of mouth)
- ✅ Featured on Rick Steves forum, Reddit
- ✅ 1+ press mention
- ✅ Sustainable as 1-2 person business

## Long-Term (Year 2-3):
- ✅ 1,500 individual users ($750K)
- ✅ 50 self-hosted ($250K)
- ✅ 30 agents ($240K)
- ✅ **Total: $1.24M ARR**
- ✅ 1-2 people, AI does heavy lifting

---

# Risks & Mitigation

## Technical Risks

**AI Accuracy <90%:**
- Mitigation: Manual correction always available, learn from fixes
- Fallback: Show confidence score, let user verify

**Google API Costs Exceed Budget:**
- Mitigation: Cache aggressively, batch requests, monitor usage
- Fallback: Negotiate enterprise pricing at scale

**Voice Recognition Unreliable:**
- Mitigation: Noise cancellation, push-to-talk option
- Fallback: Text input always available

## Business Risks

**Users Won't Pay $500/year:**
- Mitigation: Free trial proves value first, money-back guarantee
- Validation: Survey beta users on pricing before launch

**UHNWI Market Doesn't Materialize:**
- Mitigation: Individual market is sufficient ($500K sustainable)
- Plan B: Focus on individuals, skip enterprise

**Google Changes API Pricing:**
- Mitigation: Build abstraction layer, can swap providers
- Alternatives: OpenStreetMap, Mapbox

## Competitive Risks

**Wanderlog Copies Features:**
- Mitigation: AI + voice + privacy differentiation
- Advantage: Better taste, faster iteration

**Google Builds This Into Maps:**
- Mitigation: Unlikely (not their business model)
- Advantage: Specialized, better curation

---

# Week 1 Action Items

## For Ash:
1. **Export your data**:
   - Google My Maps (provide OAuth access)
   - Wanderlog itineraries (CSV export)
   
2. **Share samples**:
   - 3-5 Guardian articles you'd save from
   - Top 10 YouTube channels you trust
   - Sample voice notes you'd record

3. **Recruit beta testers**:
   - 5 friends who travel frequently
   - Willing to give weekly feedback

## For Development:
1. **Infrastructure**:
   - Set up Firebase project
   - Initialize React app (web + extension)
   - Configure Google OAuth

2. **Core Features**:
   - Build Google My Maps import
   - Test AI extraction on sample articles
   - Design sidebar UI (Chrome extension)

3. **Design**:
   - TraCur brand identity (logo, colors)
   - Custom map icons (professional, not emoji)
   - Mobile PWA mockups

## Decisions to Confirm:
- ✅ SaaS architecture (Firebase)
- ✅ Individual users first
- ✅ 8-week MVP timeline
- ✅ $500/year pricing
- ✅ Start development this week?

---

**Next Step**: Should I create:
1. **Technical spec for developers** (database schema, API endpoints)
2. **Interactive prototype** (clickable mockup in React)
3. **Chrome extension scaffold** (working code you can test)

**Ready to build?** Let's get you using TraCur for your next trip.

## Development & Prompting Standards

### 1. Firebase & Data Safety
- **No Undefined:** Never pass `undefined` to Firestore. Always use `field: value || null`.
- **Atomic Writes:** Use Firebase transactions or batches when updating multiple related documents.
- **Security First:** Ensure all Firestore queries are structured to eventually work with "User ID" rules (even if we are in MVP mode).

### 2. Next.js & React Best Practices
- **Server vs Client:** Keep API logic and sensitive keys in `app/api` (Server). Use `"use client"` only for interactive UI components (buttons, swipes).
- **TypeScript Strictness:** Always define interfaces for API responses. No `any` types.
- **Tailwind Utility:** Use mobile-first responsive classes for all UI (e.g., `flex-col md:flex-row`).

### 3. AI & Prompting Logic
- **Structured JSON:** Always ask Gemini for JSON output using a regex-safe wrapper to avoid "AI chatter" breaking the code.
- **Contextual Memory:** Before writing new features, read the existing `ROADMAP.md` to ensure the logic aligns with the "Dreamer's Workflow."
- **Lacto-Ovo Validation:** Every restaurant extraction MUST include a "Vegetarian Friendly" check against the excerpt.

### 4. Error Handling
- **Graceful Fallbacks:** If a Google Place ID is missing, the UI must fall back to showing the original article excerpt ("Special Reasons").
- **Visible Logs:** API errors should be returned with clear messages so I can debug them in the Vercel logs.

## 🎨 UI & UX Style Guide

### 1. Visual Philosophy: "Clean & Immersive"
- **Minimalism:** Prioritize intent over decoration. Remove any element that doesn't help the user make a "Dreaming" decision.
- **Whitespace:** Use an 8px base grid system for all spacing (8px, 16px, 24px, 32px). Never use random pixel values for margins or padding.
- **Modern Depth:** Use subtle "Glassmorphism" (semi-transparent backgrounds with blur) for overlays and navigation bars to create a sense of layered space.

### 2. Typography (The "Roboto/San Francisco" Rule)
- **Fonts:** Stick to system fonts (Sans-Serif) for maximum performance and native feel.
- **Body Text:** Minimum **16px** for readability. Line height should be **1.5** (e.g., 16px text = 24px line height).
- **Hierarchy:** - H1 (Headings): 24px-28px, Bold.
  - H2 (Subheadings): 20px-22px, Semibold.
  - Metadata (Captions): 12px-14px, Medium gray.

### 3. Color & Accessibility (WCAG 2.1 Compliant)
- **Contrast:** Maintain a minimum contrast ratio of **4.5:1** for all text. Use dark text on light backgrounds (#FFFFFF) or light text on dark mode backgrounds (#121212).
- **Dietary Highlighting:** Use a specific **"Lacto-Ovo Green"** (#007A78) for vegetarian-friendly tags. It must be high-contrast and easily distinguishable.
- **Action Colors:** Use a "Primary Blue" (#1B365D) for "Accept" buttons and a "Subtle Gray" or "Soft Red" for "Reject" actions.

### 4. Mobile Interaction Patterns
- **The "Thumb Zone":** Place primary actions (Swipe, Accept, Save) in the bottom third of the screen for easy one-handed use.
- **Touch Targets:** Every button or tappable area must be at least **44x44px**.
- **Micro-interactions:** Add subtle haptic-like feedback (CSS transitions) when a card is swiped or a button is pressed to confirm the action.

### 5. Media & Enrichment
- **360° Video Integration:** Use a consistent "360°" icon overlay on thumbnails to indicate immersive content.
- **Google Social Proof:** Star ratings should always follow the Google standard (Yellow stars, number of reviews in parentheses).

## 🧠 Lessons Learned & Critical Fixes

### API & Billing Keys
- **Organization vs Personal:** Always verify if the API key belongs to the 'Tracur' Organization or a personal project. Use the Org key for production deploys to avoid billing quota issues.
- **Key Storage:** Never hardcode keys. Use `.env.local` for development and Vercel Environment Variables for production.

### Firebase / Firestore
- **The 'Undefined' Rule:** Firestore will crash if an `undefined` value is passed. 
  - **Fix:** Always use the fallback pattern: `field: value || null` or `field: value || ""`.
- **Nesting Exports:** Never nest an `export async function` inside another block. This causes a Vercel build failure.

### Chrome Extension Communication
- **URL Safety:** When the extension sends data to the API, it must verify the `sourceUrl` is present. If missing, the API must handle it as `null` rather than letting it be `undefined`.

## 🤖 AI Model Selection Guide
- **Logic & Database (GPT-5.2/5.3-Codex):** Use for Firestore transactions, API route refactoring, and complex data parsing.
- **UI & UX (Claude 3.5 Sonnet):** Use for Tailwind CSS styling, Tinder-style card animations, and mobile responsiveness.
- **Strategic Planning (Gemini 3 Pro):** Use for brainstorming new Phase 2 features and interpreting Google Maps/YouTube API docs.

---
*Last Updated: February 6, 2026*
