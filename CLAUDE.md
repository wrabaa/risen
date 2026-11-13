# RISEN — Project Brief (read this first, every session)

## What RISEN is
A personal health app for Siza (and a few friends) — **NEVER TOO LATE**.
Gym training, meds/supplements, gym group classes and meals, in one simple app.
It is NOT an international product: simple, useful, fast to understand beats feature-rich.
Rule of thumb: **one screen, one job, one big button. No manual needed.**

## How it runs
- Files: `index.html` (markup only) · `styles.css` · `shared.js` (helpers every tab uses) ·
  `app.js` (Home, tabs, Settings, backup, updates) · one file per tab. A new file must be
  added to `CORE` in `sw.js` or it will not work offline.
- Plain HTML/CSS/JS PWA, no build step, no framework. Hosted on GitHub Pages:
  https://wrabaa.github.io/risen/ (repo `wrabaa/risen`, branch `main`).
- Installed on iPhone via Safari → Share → Add to Home Screen.
- Fully offline, no accounts, no server, no analytics. Each phone keeps its own data.
- Data: IndexedDB (`db.js`) with a versioned schema — never lose user data on update.
  Every new store goes into Export / Import / Reset.
- Photos: `photo.js` (resize ≤1000px JPEG, stored in IndexedDB, included in backup).
- Service worker `sw.js` — bump `VERSION` on every release (format `YYYY-MM-DD.N`).
  App files (pages, code, `data/`) are re-downloaded on every release. Images and fonts live
  in their own cache that survives releases, driven by the `ASSETS` list at the top of `sw.js`:
  **add an image → new line with number 1 · replace an image (same name) → raise its number
  by 1 · remove an image → delete its line.** Forgetting this means phones keep the old image.
- A new release reloads the app only on the intro or on a quiet Home (nothing open, no
  keyboard); otherwise it waits until Home is shown again or the app is next opened.
- **Fixed IDs — never change, never reuse:** built-in exercises (`library.js`, `lib-…`) and
  schedule classes (`data/gym-classes.json`, `fz-c01…`). History, photos and attendance hang
  on them. Names can change freely. Rebuilding the exercise list: use `aliases` (old → new)
  and `retired` in `library.js` (see the comment there); nothing on the phone is deleted.
- `UPGRADES.md` = upgrade ideas after this plan, one section at a time, discussed first,
  with a "Where we are" block that is updated after every section.
- Status bar meta must stay `black` (opaque). `black-translucent` breaks full screen on
  current iOS (bottom 62px gap). Do not touch.

## Brand (keep EXACTLY)
Background #0B0B0B · cards #1A1A1A · borders #262626 · text #F2F2F2 · muted #9A9A9A ·
ONE accent volt #CCFF00 (buttons, active, highlights, done). Oswald (headlines, uppercase,
big numbers) + Inter (body). 16px rounded cards, pill buttons, simple line icons.
Supporting colours (named on `:root` in `styles.css`, use the names, never raw codes):
`--danger` #FF6B6B (delete/reset ONLY — the one exception to "one accent") · `--field` #0F0F0F
(inputs) · `--press` #202020 · `--dash` #3A3A3A · `--mid` #4A4A4A · `--dim` #5A5A5A ·
`--faint` #6A6A6A · `--off` #2A2A2A · `--soft` #C9C9C9 · `--soft2` #D6D6D6 · `--volt-press` #B8E600.
No dot-matrix font. Intro = Siza's black & white photo + logo + "STRONGER EVERY DAY" + ENTER
(all text/buttons in code, never baked into images).

## Structure
Intro → Home. Tab bar: **HOME · GYM · MEALS · MEDS · CLASSES**. Gear ⚙️ (top right) = Settings.
- **HOME** (`app.js`): Hello [name], tiles 01 TRAINING (shortcut to today's gym day),
  02 THIS WEEK, 03 STREAK, 04 MEDS, 05 CLASSES, 06 WEEK SUMMARY (workouts · meds taken/due ·
  classes attended), backup reminder line.
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
- **SETTINGS**: name, rest timer, Export/Import backup, View intro, Reload gym schedule,
  Clear all classes, Reset all data.

## Status (release 2026-11-13.41)
- ✅ Intro, Home, Settings, backup, full-screen fix.
- ✅ MEDS — done.
- ✅ CLASSES — done (polish pending: better instructor photos).
- 🔄 GYM — works; Siza is testing it in real gym sessions. Exercise library to be rebuilt.
- 🟡 MEALS — base only.
- ✅ Code-review fixes `.28`–`.32` (safe import, honest backup date, streak/week counting,
  quiet updates, med tick follows a time change) — tested on iPhone.
- ✅ Upgrade A fixed IDs (`.33`, tested on iPhone) · Upgrade B image cache (`.34`) ·
  Reload gym schedule (`.35`) · Safari banner (`.36`) · Gym comfort (`.37`) · code split,
  no visible change (`.38`) · confirm sheet, consistency, named colours (`.39`) · clean-up (`.40`) · weekly backup
  prompt, piece-by-piece backups, week summary tile (`.41`). `.34`–`.41`: iPhone test pending.

## To-do (in this order — do ONLY what Siza / the planner sends, one step at a time)
1. ✅ DONE (`.35`) **Settings: "Reload gym schedule"** → confirm → schedule classes go back
   to the latest `data/gym-classes.json` (by fixed ID). Kept: attendance, notes on a class,
   classes/instructors added by hand, a phone photo of an instructor. To change the schedule
   for everyone: edit the JSON (new class = next free `fz-c..` number), release, tap Reload.
2. **Instructor photos**: new sharper photos coming → replace files, same names, and raise
   each file's number in the `ASSETS` list in `sw.js`.
3. **GYM exercise library rebuild**: Siza sends photos of his gym's machines → planner
   writes the new list (machines + free weights, by muscle) → one built-in image per
   exercise (Siza generates them, file name = exercise) → images built into the app
   (one line per image in `ASSETS` in `sw.js`). Real history now exists: rebuild through
   `aliases` / `retired` in `library.js`, never by renaming IDs.
4. **Exercise detail polish**: big image on top, muscles worked, 2–3 form tips, notes,
   "Last time".
5. **GYM fine-tunes** from Siza's real use (will come as notes).
6. **MEALS phase 2 — calories** (WAITING: Siza plans the screen with the planner first):
   built-in offline food list (~300–500 foods incl. Lebanese basics, kcal + protein/carbs/fat
   per 100 g); ingredient + grams → auto totals, servings; custom foods from label.
   Planned in small steps first.
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
  background (`visibilitychange` / `pagehide`). Settings shows "✓ Saved" too (`.39`).
- Every "are you sure?" is the RISEN sheet `ask()` in `shared.js` — never the system
  `confirm()`. Red outline button = deletes something; lime = everything else.
- Words: "program" (not plan/routine) · "workout" (not session) · "delete" (not remove).
- A NEW item with something filled in but no name is saved as "Untitled …"; an untouched new
  item is discarded; an existing item whose name is cleared keeps its last saved version.
- Add buttons: lime "+ ADD …" at the top of the list it adds to.
- Storage cannot open → full-screen "RISEN can't open your data" + TRY AGAIN (`.40`); the app
  never opens looking empty. Home redraws whenever the app returns to the front.
- Delete levels: 🗑 exercise (history kept) · 🗑 day/workout · "New program" (archives,
  history kept) · Settings "Reset all data" (export first, double confirm).
- Import is all-or-nothing: the file is checked first and any failure undoes everything.
  A release-.13 backup restores only name + rest timer. The confirm lists what is in the file.
- Weekly "Back up now?" sheet on opening (`.41`): only with data, last backup 7+ days old or
  missing, not asked in the last 7 days, never during a workout. The file is prepared while
  the sheet shows, so one tap opens the share sheet. Backup files are built piece by piece.
- The backup date is stored only when the share sheet really finishes. If it cannot open,
  the file is kept two minutes and the next tap on Export opens it.
- Safari tab vs home-screen app = two separate data stores on iPhone (Siza's meds once looked
  "missing" for this reason; fixed with export/import). Since `.36` a small banner at the top
  says so in a Safari tab on iPhone/iPad (× hides it for the visit); never in the home-screen app.

**GYM**
- Siza thinks in DAYS, not "workouts": Week → Day → Exercise. No workout names, no days
  picker, no time field (the time field pre-filled "now" — that was a bug, removed).
- Day title is automatic from muscle groups (e.g. "Chest · Triceps").
- Old "workouts with days" data was converted once to one plan per weekday (done, .23).
- Home TRAINING tile = shortcut: shows the DAY name; tap → today's Day page (not the logger).
  0 exercises → "Rest day", no ▶. Running workout stays in sync with the plan (.24).
- Plan edits never rewrite the past (`.30`): a finished planned workout always counts for its
  day; a day can only be "missed" from the date it got its exercises (`since` on the day plan).
- THIS WEEK: a skipped workout drops out of the total (excused, like the streak).
  Extra workouts count for history / "Last time" only, not THIS WEEK or STREAK.
  STREAK: today not done yet doesn't break it; skipped-with-reason doesn't break it.
- 🗑 inside a running workout removes the exercise only for that day.
- Gym comfort (`.37`): screen stays awake during a workout; a workout in progress skips the
  intro and opens directly; sets are whole numbers 1–20; a failed FINISH keeps the workout open.
- Reps required to tick a set; empty kg = 0 (bodyweight). No sets ticked → offer discard.
- Rest timer starts automatically on ✓, default from Settings (1:30), ±15 s, flashes lime at 0.
- One photo per exercise, linked to exercise ID, shown everywhere; addable in the gym too.
- Exercise library (66 generic, fixed IDs) will be REPLACED by Siza's real gym list + built-in
  images, through `aliases` / `retired` so plans, history and photos follow.

**MEDS**
- A med counts from the day it's added (earlier days = "not scheduled", not "missed").
- Known small flaw (accepted for now): changing a schedule re-judges past days. Exception
  (`.32`): a dose already taken TODAY follows its med to the new time (no double dose).
- Weekly = one weekday. Groups by exact time. Undo is per dose (on purpose, safer).
- No notifications: ON HOLD until the native Apple app (Capacitor). Do not build in the web app.

**CLASSES**
- Gym = Fitness Zone; 3 studios: Energy, Balance, Power. 37 classes, 15 instructors
  (Cesar has no photo; Zumba Thu 19:30 instructor unknown = TBA).
  Fri Pound time set to 17:30 (not labeled on the board — Siza's call).
- Seed loads once on YES; afterwards it's normal editable data. Schedule classes carry
  `seed:true` and a fixed ID; "Reload gym schedule" resets only those.
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
