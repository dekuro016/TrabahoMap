# TrabahoMap — Prototype (Group 7)

**The right help, right in your barangay.**
An AI-assisted job/gig board that connects Batangas residents with verified local skilled workers.

**Two sections:** one-time **Quests** (a resident posts a problem, nearby workers quote) and **Steady Jobs**
(full-time, part-time and contract work from local businesses). Everything is shown on an **interactive map of Batangas**, the first thing on the home page.

---

## 1. Run it on your laptop (first time)

You need **Node.js 20.12 or newer** → download the "LTS" version at https://nodejs.org

Open a terminal **inside this folder**, then:

```bash
npm install        # downloads the libraries (once)
npm run build      # builds the website
npm start          # starts it
```

Open **http://localhost:3000** in your browser. Done.

While editing code, use `npm run dev` instead. It rebuilds automatically when you save; just refresh the browser.

## 2. Add your API keys (.env)

Both keys are optional. Without them the site still works (keyword AI + free CARTO/Esri maps).

1. Copy `.env.example` → rename the copy to `.env` (in this same folder).
2. Fill in the lines you need:

```
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

3. Save, then restart (`Ctrl + C`, then `npm start`). The terminal shows:
   `Maps: Google Maps tiles (key set)` and `AI mode: Gemini (...)`.

> Never upload `.env` to GitHub, send it in chat, or put a key inside `src/`.

### Gemini (Task Analyzer, AI Assistant, Review Guard)
Get a key at https://aistudio.google.com/apikey (it usually starts with `AIza`). If Google retires the model name, change `GEMINI_MODEL`.

### Google Maps (Street / Satellite views)
**Free option (no card): the Maps Demo Key** — made for prototypes like this.
1. Go to https://mapsplatform.google.com/maps-demo-key/ → **Get a Demo Key** → sign in → accept the terms. Copy the key (it is also emailed to you).
2. Put it in `.env` as `GOOGLE_MAPS_API_KEY=...` and restart (`npm start`).
3. On the map, choose **Street** or **Satellite** — Google's own logo appears at the bottom-left of the map.

The demo key has a daily limit. If it's reached, the map switches to the free CARTO/Esri map for the rest of the day (no charges).

**With billing:** a normal key works too, if **Maps JavaScript API** (or **Map Tiles API**) is enabled for it.
Restrict it under *Credentials → your key → Websites* to `http://localhost:3000/*` (plus your Vercel address).

If Google refuses the key, a notice on the map says why and the free map is used instead.
The Maps key is sent to the browser (all map websites work this way). The Gemini key never leaves the server.

## 3. Demo script (5 minutes)

After the intro animation, first-time visitors on the home page see the **welcome screen**: **Sign in**, **Create account** (Google / Apple / Email — simulated) or **Continue as guest**. It shows once per browser and comes back after you sign out. Links to a specific quest or job skip it. Footer → **Show welcome screen** brings it back for a demo.

Guests can browse the map, quests, jobs and workers freely. The **profile icon** (top right) has **Sign in** and **Try a demo account** to switch identities without passwords. On phones, the main pages are in the **bottom tab bar**.

**New in this version**
- **Home search:** type the problem in the big search box ("Hindi lumalamig ang aircon") → sign up as a resident → the Post form opens already filled in and analyzed.
- **Photos on quests:** on *Post a problem*, add up to 3 photos (shrunk, location data removed). Tick **Also let the AI look at my first photo** to send one small copy to Gemini (off by default). Photos show on the quest page and as a cover on the Quest Board.
- **Messages:** Juan → quest *Sparking kitchen outlet* → **Message** next to Mario's quote → type a phone number → it is hidden until you **Hire**. Mario sees the chat in his **Inbox** (bell icon).
- **Job alerts:** demo worker → *My Dashboard* → **Job alerts** → pick services and towns → when a resident posts a matching quest, the worker's **bell** shows a notification. Residents get notified of new quotes; workers of hires; employers of applications.
- **Fair price guide:** the typical price appears after the AI analysis, above the quotes (each quote is tagged *Typical price / Above typical / Below typical*), and on the **Price guide** page (footer). Services with fewer than 3 quotes show a **starter estimate** labeled as such — check those numbers with local workers.

1. **Guest** → click **Ask AI** (bottom right) → type "May tumutulo sa ilalim ng lababo" → answer the 1–2 questions → **Use details for my quest** → the site asks you to sign up (the details are kept).
2. Profile icon → demo **Juan Dela Cruz** (resident) → the **Post a problem** form is already filled in → review/edit → **Post to Quest Board**. Nothing is posted until you press the button.
3. **Ask AI** → "Nag-spark ang saksakan at may usok" → shows the **Safety first** box (breaker, 911) before anything else.
4. Demo **Mario Dimaculangan** (worker) → *My Dashboard* → open the new gig → **Send quote**.
5. **Juan** → open the gig → **Hire** → **Mark job as done** → leave a review. A one-star review with "bobo" → **Review Guard** flags it.
6. Profile icon → **Create an account** → pick **Worker** → choose services and your **Skill Set** → profile icon → **My profile** to edit skills anytime.
7. Demo **TrabahoMap Admin** → approve the new pending worker, handle flagged reviews and reports, see AI usage in *Overview*.
8. **Map (home page)** → green towns are open; gray towns/provinces are "coming soon" and can't be clicked. **Near me** drops a "You are here" pin and opens your town (location is never saved). **Street / Satellite / Simple** at the top right.
9. **New services:** *Quest Board* → filter Tutor, Tech Support, Home Cleaning, Event Assistance.
10. Demo **Kumintang Hardware** (employer) → *Steady Jobs* → shortlist/hire applicants → *Post a job*.
11. Footer → **Policies** (Terms, Privacy, Community Guidelines, Verification & Reviews, AI Use, Safety Tips).

Footer → **Reset demo data** restores everything (and signs you out). **Replay intro** plays the opening animation again.

## 4. Where things are

| File | What it does |
|---|---|
| `src/pages/` | One file per page (Home, Post, Board, Map, Workers, WorkerProfile, GigDetail, Dashboard, Admin, Jobs, Profile, Policies) |
| `src/components/AssistantChat.tsx` | The floating **AI Assistant** chat head and panel |
| `server/ai.mjs` | Gemini prompts: Task Analyzer, AI Assistant, Review Guard (falls back to keywords on any error) |
| `shared/assistant.js` | Keyword-based assistant used when Gemini is off + emergency safety advice |
| `shared/classifier.js` | Keyword Task Analyzer (English/Filipino/Taglish) |
| `shared/categories.js`, `shared/places.js` | The 12 services; pilot towns and barangays (used to read locations in chats) |
| `src/components/Welcome.tsx` | The welcome screen after the intro (sign in / create account / continue as guest) |
| `src/components/AuthFlow.tsx`, `AuthModal.tsx` | The sign-up / log-in steps (shared by the welcome screen and the pop-up) |
| `src/components/ProfileMenu.tsx`, `Nudges.tsx`, `Layout.tsx` | Top-right menu, "Get started" reminder, top bar + phone tab bar + footer |
| `src/components/Photos.tsx`, `src/lib/photos.ts` | Quest photo picker (shrinks photos), gallery and full-screen viewer |
| `src/components/QuestChat.tsx`, `src/pages/Inbox.tsx` | Quest messages (contact details hidden until hired), Inbox with notifications |
| `src/components/AlertsCard.tsx` | Workers' job alerts |
| `src/lib/prices.ts`, `src/components/PriceGuide.tsx`, `src/pages/Prices.tsx` | Fair price guide (typical price per service and town) |
| `src/components/SkillSetEditor.tsx`, `src/pages/Profile.tsx` | Worker services & Skill Set; profile dashboard |
| `src/lib/store.ts` | **All data reads/writes** (localStorage for now), including accounts |
| `src/lib/seed.ts` | Demo data: towns, barangays, workers, gigs, jobs, accounts |
| `src/lib/matching.ts` | Smart Matching: 40% skill + 25% distance + 25% rating + 10% response rate |
| `src/components/MapView.tsx`, `src/lib/googleTiles.ts` | The map, tile providers (Google → CARTO → Esri → Simple), Near me |
| `server/index.mjs` | Node server: the site + `/api/analyze-task`, `/api/assistant`, `/api/check-review`, `/api/config` |
| `api/` | The same endpoints for Vercel |
| `src/styles.css` | All styling (colors are at the top) |

## 5. Prototype limits (say this honestly if asked)

- **Data is saved in the browser** (localStorage). Each device has its own copy. For a real pilot, replace `src/lib/store.ts` with a shared database (e.g. Supabase).
- **Google / Apple sign-up are simulated** (labeled in the form). Real OAuth needs a registered domain, a backend and app approval — Supabase Auth or Firebase Auth can add it later without changing the pages. There are no passwords in the demo.
- The AI Assistant suggests; it never diagnoses with certainty, posts, or hires. Chats are not saved.
- **Photos and messages are stored in the browser too.** Browsers allow only about 5 MB per site, so photos are shrunk; if storage is full the quest is posted without photos (a message says so). Messages and notifications only reach people using the same browser — real delivery needs the shared database.
- Phone numbers are hidden with simple pattern matching; spelled-out numbers ("zero nine one seven…") can slip through.
- The price guide's **starter estimates** are placeholders set by the team, not market data.
- If no map tiles can load (like the one-file preview), the map switches to Simple automatically; the boundaries are built in, so the map always works.
- Policies are a **draft** written for a student prototype; have your adviser review them.
- Coordinates and phone numbers in the seed data are approximate/fake.

## 6. Put it online (optional)

**Vercel (free):** push this folder to GitHub (without `.env`) → import the repo at vercel.com → add `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` under *Settings → Environment Variables* → Deploy. Add your Vercel address to the Maps key's website restrictions.

**One-file preview:** `npm run build:single` creates `dist-single/index.html`. It runs anywhere, with AI in fallback mode and free map tiles.

## 7. Credits

- Province and municipal boundaries: PSGC 2023 data via [faeldon/philippines-json-maps](https://github.com/faeldon/philippines-json-maps) (MIT License).
- Map library: [Leaflet](https://leafletjs.com). Street tiles: Google Maps (with your key), © OpenStreetMap contributors, © CARTO. Street/satellite imagery: © Esri.
- All businesses, people and phone numbers in the demo data are fictional.
