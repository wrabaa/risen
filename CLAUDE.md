# RISEN — Project Brief (read this first, every session)

## What RISEN is
A personal health app for Siza (and a few friends) — **NEVER TOO LATE**.
Gym training, meds/supplements, gym group classes and meals, in one simple app.
It is NOT an international product: simple, useful, fast to understand beats feature-rich.
Rule of thumb: **one screen, one job, one big button. No manual needed.**

## How it runs
- Plain HTML/CSS/JS PWA, no build step, no framework. Hosted on GitHub Pages:
  https://wrabaa.github.io/risen/ (repo `wrabaa/risen`, branch `main`).
- Installed on iPhone via Safari → Share → Add to Home Screen.
- Fully offline, no accounts, no server, no analytics. Each phone keeps its own data.
- Data: IndexedDB (`db.js`) with a versioned schema — never lose user data on update.
  Every new store goes into Export / Import / Reset.
- Photos: `photo.js` (resize ≤1000px JPEG, stored in IndexedDB, included in backup).
- Service worker `sw.js` — bump `VERSION` on every release (format `YYYY-MM-DD.N`).
- Status bar meta must stay `black` (opaque). `black-translucent` breaks full screen on
  current iOS (bottom 62px gap). Do not touch.

## Brand (keep EXACTLY)
Background #0B0B0B · cards #1A1A1A · borders #262626 · text #F2F2F2 · muted #9A9A9A ·
ONE accent volt #CCFF00 (buttons, active, highlights, done). Oswald (headlines, uppercase,
big numbers) + Inter (body). 16px rounded cards, pill buttons, simple line icons.
No dot-matrix font. Intro = Siza's black & white photo + logo + "STRONGER EVERY DAY" + ENTER
(all text/buttons in code, never baked into images).

## Structure
Intro → Home. Tab bar: **HOME · GYM · MEALS · MEDS · CLASSES**. Gear ⚙️ (top right) = Settings.
- **HOME** (`index.html`): Hello [name], tiles 01 TRAINING (shortcut to today's gym day),
  02 THIS WEEK, 03 STREAK, 04 MEDS, 05 CLASSES, backup reminder line.
- **GYM** (`gym.js`, `library.js`): Week (Mon–Sun, today lime) → Day (+ ADD EXERCISE,
  list, Copy to…, START WORKOUT on today) → Exercise (photo, sets/kg/reps, notes,
  "Last time"). Logging: pre-filled sets, ✓, auto rest timer, finish. History per exercise ID.
  Program in background (rename / New program link at bottom).
- **MEDS** (`meds.js`): progress ring, doses grouped by time with ✓ TAKE ALL, compact
  cards with box photo, 7-day dots; My meds list (tap row → edit, pause/delete inside).
- **CLASSES** (`classes.js`, `data/gym-classes.json`, `assets/instructors/`):
  first open asks "Load Fitness Zone schedule?" YES / START EMPTY. Week → Day → Class,
  studio chips (Energy/Balance/Power), ✓ ATTENDED, instructors list.
- **MEALS** (`meals.js`): Shakes · Breakfast · Lunch · Snacks · Dinner → recipes →
  recipe page (photo, ingredients one per line stored as objects `{text}`, how-to, Move to…).
- **SETTINGS**: name, rest timer, Export/Import backup, View intro, Clear all classes,
  Reset all data.

## Status (release 2026-11-12.27)
- ✅ Intro, Home, Settings, backup, full-screen fix.
- ✅ MEDS — done.
- ✅ CLASSES — done (polish pending: better instructor photos).
- 🔄 GYM — works; Siza is testing it in real gym sessions. Exercise library to be rebuilt.
- 🟡 MEALS — base only.

## To-do (in this order — do ONLY what Siza / the planner sends, one step at a time)
1. **Settings: "Reload gym schedule"** → confirm → replace seeded classes with latest
   `data/gym-classes.json`, keep attendance history + user-added classes. Seeded
   instructor photos must load from `assets/instructors/` so replacing a file updates
   every phone.
2. **Instructor photos**: new sharper photos coming → replace files, same names.
3. **GYM exercise library rebuild**: Siza sends photos of his gym's machines → planner
   writes the new list (machines + free weights, by muscle) → one built-in image per
   exercise (Siza generates them, file name = exercise) → images built into the app.
   No real history yet, so the library can be rebuilt from zero.
4. **Exercise detail polish**: big image on top, muscles worked, 2–3 form tips, notes,
   "Last time".
5. **GYM fine-tunes** from Siza's real use (will come as notes).
6. **MEALS phase 2 — calories**: built-in offline food list (~300–500 foods incl. Lebanese
   basics, kcal + protein/carbs/fat per 100 g); ingredient + grams → auto totals,
   servings; custom foods from label. Planned in small steps first.
7. **MEALS phase 3 — barcode scan** (needs internet; optional extra).
8. **Design pass** over the whole app (animations, premium feel) — later.
9. Later: iCloud sync when RISEN becomes a native app (Capacitor). For now: Export/Import.

## How we work (important)
- **Siza + Claude (chat) plan; Claude Code builds; Siza tests on his iPhone.**
- Build ONLY what the message asks. Do not redesign, rename, move or remove anything else.
  If something is unclear, ask before building.
- Small steps. Never a huge change at once.
- Test in the browser at iPhone 13 and SE sizes before pushing; re-run other tabs' tests.
- When done, report: what changed (short list), choices you made, version number,
  how to test on iPhone. No long essays.
- Siza is not a developer: plain words, no jargon in reports.
