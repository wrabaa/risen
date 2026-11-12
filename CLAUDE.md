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

## Decisions & history (WHY things are the way they are — do not "fix" these)
**App-wide**
- Web app (PWA) first because the Apple Developer account is blocked by payment from
  Lebanon. Later it may be wrapped as a native app (Capacitor) for iCloud sync + Apple Health.
- Personal + a few friends. Each phone is separate; friends can't affect each other's data.
- Storage moved from localStorage to IndexedDB early (photos would exceed ~5 MB).
- `persisted()` is false on iPhone → that's why Home shows a backup reminder after 7 days
  (only when there's a plan; date saved only when export really completes).
- Full-screen bug history: iOS standalone with `black-translucent` paints only 812 of 874 pt
  → 62 pt dead strip at the bottom. `100lvh` made it worse (content cut). Fix = opaque
  `black` status bar. Debug panel was removed after the fix.
- Intro: text and buttons baked into a picture broke on every screen size → rule: photos are
  backgrounds only; all text/buttons are real HTML. Intro photo = Siza's real B&W photo.
- Navigation: ☰ menu was removed; bottom tab bar is the only navigation (gear = Settings).
  Calendar and Progress tabs were removed on purpose (not needed; "Last time" on each
  exercise IS the progress tracking).
- Name: asked once on first ENTER; Skip → greeting just "HELLO" (friends use the app too).
- Every editor: auto-save (0.4 s) + visible "✓ Saved" + DONE button + flush on
  background (`visibilitychange` / `pagehide`).
- Delete levels: 🗑 exercise (history kept) · 🗑 day/workout · "New program" (archives,
  history kept) · Settings "Reset all data" (export first, double confirm).

**GYM**
- Siza thinks in DAYS, not "workouts": Week → Day → Exercise. No workout names, no days
  picker, no time field (the time field pre-filled "now" — that was a bug, removed).
- Day title is automatic from muscle groups (e.g. "Chest · Triceps").
- Old "workouts with days" data was converted once to one plan per weekday (done, .23).
- Home TRAINING tile = shortcut: shows the DAY name; tap → today's Day page (not the logger).
  0 exercises → "Rest day", no ▶. Running workout stays in sync with the plan (.24).
- THIS WEEK: a skipped workout drops out of the total (excused, like the streak).
  Extra workouts count for history / "Last time" only, not THIS WEEK or STREAK.
  STREAK: today not done yet doesn't break it; skipped-with-reason doesn't break it.
- 🗑 inside a running workout removes the exercise only for that day.
- Reps required to tick a set; empty kg = 0 (bodyweight). No sets ticked → offer discard.
- Rest timer starts automatically on ✓, default from Settings (1:30), ±15 s, flashes lime at 0.
- One photo per exercise, linked to exercise ID, shown everywhere; addable in the gym too.
- Exercise library (66 generic) will be REPLACED by Siza's real gym list + built-in images.

**MEDS**
- A med counts from the day it's added (earlier days = "not scheduled", not "missed").
- Known small flaw (accepted for now): changing a schedule re-judges past days.
- Weekly = one weekday. Groups by exact time. Undo is per dose (on purpose, safer).
- No notifications yet (separate project for later).

**CLASSES**
- Gym = Fitness Zone; 3 studios: Energy, Balance, Power. 37 classes, 15 instructors
  (Cesar has no photo; Zumba Thu 19:30 instructor unknown = TBA).
  Fri Pound time set to 17:30 (not labeled on the board — Siza's call).
- Seed loads once on YES; afterwards it's normal editable data.
- Instructor photos are public in the repo — Siza decided this is fine (they're already
  public in the gym's own app). Current crops are low quality; better ones coming.
- "Clear all classes" also removes instructors (they belong to the old gym).

**MEALS**
- 5 fixed categories. Ingredients stored as objects `{text}` so grams/kcal can be added
  later without breaking recipes. Calories/barcode come later, planned in small steps.

## How we work (important)
- **Siza + Claude (chat) plan; Claude Code builds; Siza tests on his iPhone.**
- Build ONLY what the message asks. Do not redesign, rename, move or remove anything else.
  If something is unclear, ask before building.
- Small steps. Never a huge change at once.
- Test in the browser at iPhone 13 and SE sizes before pushing; re-run other tabs' tests.
- When done, report: what changed (short list), choices you made, version number,
  how to test on iPhone. No long essays.
- Siza is not a developer: plain words, no jargon in reports.
