# RISEN — Project Brief (read this first, every session)

## What RISEN is
A personal health app for Siza (and a few friends) — **NEVER TOO LATE**.
Gym training, meds/supplements, gym group classes and meals, in one simple app.
It is NOT an international product: simple, useful, fast to understand beats feature-rich.
Rule of thumb: **one screen, one job, one big button. No manual needed.**

## How it runs
- Files: `index.html` (markup only) · `styles.css` · `shared.js` (helpers every tab uses) ·
  `app.js` (Home, tabs, Settings, backup, updates) · `profile.js` (profile button, Personal info) · one file per tab. A new file must be
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
- Offline safety net (`.46`): a page request with no cached copy and no network serves the cached
  `index.html` instead of the browser's error (`sw.js`); non-page files are unchanged.
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
big numbers) + Inter (body). 20px rounded cards (since `.54`, see `DESIGN.md`), pill buttons, simple line icons.
Supporting colours (named on `:root` in `styles.css`, use the names, never raw codes):
`--danger` #FF6B6B (delete/reset ONLY — the one exception to "one accent") · `--field` #0F0F0F
(inputs) · `--press` #202020 · `--dash` #3A3A3A · `--mid` #4A4A4A · `--dim` #5A5A5A ·
`--faint` #6A6A6A · `--off` #2A2A2A · `--soft` #C9C9C9 · `--soft2` #D6D6D6 · `--volt-press` #B8E600 ·
tab bar glass: `--glass` rgba(26,26,26,.84) (`.58`; it was .62 and let lime show through bright) · `--glass-hi` rgba(255,255,255,.1) (the pill behind the active tab) ·
depth (`.54`): `--bg-top` #141414 + `--glow` (≤4% lime) = the background gradient `--bg-grad` · `--hairline` white 8% (card edge) ·
`--hilite` white 6% (light along a card's top) · Home (`.57`): `--glass-tile` (frosted tile, no blur) · `--volt-tint` / `--volt-edge`
(lime tint and edge of the 01 TRAINING tile) · motion (`.56`): `--volt-flash` (lime flash on a ticked set row) · `--ease` / `--spring` (curves) · `--shadow` · `--glass-sheet` · `--glass-bar` · `--glass-solid` (fallback when the
browser cannot blur) · `--volt-glow` (under the main button and active tab icon) · `--r-card` 20px · `--card-depth` ·
studio tags (Classes only, subtle): `--studio-energy` #D9A25E · `--studio-balance` #7CB9AE ·
`--studio-power` #A592D6.
No dot-matrix font. Intro = Siza's photo + logo + "STRONGER EVERY DAY" + embossed glass "ENTER" letters behind his head (tap anywhere enters, `.64`/`.65`)
(all text/buttons in code, never baked into images).

## Structure
Intro → Home. Tab bar (a floating glass pill, icons only): **HOME · GYM · MEALS · SUPPS · CLASSES**. A round profile button (top right, on the title line of every tab page) opens the profile page: SETTINGS · PERSONAL INFO.
- **HOME** (`app.js`): Hello [name], tiles 01 TRAINING (shortcut to today's gym day),
  02 THIS WEEK, 03 STREAK, 04 SUPPS, 05 CLASSES, 06 WEEK SUMMARY (three small rings: workouts · supps taken/due ·
  classes attended), backup reminder line.
- **GYM** (`gym.js`, `library.js`): Week (Mon–Sun, today lime) → Day (+ ADD EXERCISE,
  list, Copy to…, START WORKOUT on today) → Exercise (photo, sets/kg/reps, notes,
  "Last time"). Logging: pre-filled sets, ✓, auto rest timer, finish. History per exercise ID.
  Program in background (rename / New program link at bottom).
- **SUPPS** (`meds.js`; the tab used to be called MEDS, code and data keep the name "meds"; title inside the tab:
  "Supplements"): progress ring, doses grouped by time with ✓ TAKE ALL, compact
  cards with box photo, 7-day dots; My meds list (tap row → edit, pause/delete inside).
- **CLASSES** (`classes.js`, `data/gym-classes.json`, `assets/instructors/`):
  opening the tab asks "Load Fitness Zone schedule?" until answered: YES / START EMPTY, or
  × / NOT NOW = ask again next time (the sheet stops above the tab bar). The tab opens on
  TODAY'S TIMELINE (live timing, NOW line, ✓ ATTENDED, ⭐ star per class); tap a
  weekday circle for another day (no day swipe: a sideways swipe changes the TAB); WEEK button = 7-day list + my stats + instructors list. Chips (one line, scrolls sideways if needed): ALL ·
  ★ (my classes) · Energy/Balance/Power. Tap a class = edit; tap an instructor photo = instructor page.
- **MEALS** (`meals.js`): Shakes · Breakfast · Lunch · Snacks · Dinner → recipes →
  recipe page (photo, ingredients one per line stored as objects `{text}`, how-to, Move to…).
- **PROFILE PAGE** (`#settings` in `index.html`, `profile.js`; two segments):
  **SETTINGS**: rest timer, Export/Import backup, View intro, Reload gym schedule, Clear all classes, Reset all data, version line.
  **PERSONAL INFO**: name, profile photo, height, weight, body measurements (dated, with history).

## Status (release 2026-11-14.65)
- ✅ Intro, Home, Settings, backup, full-screen fix.
- ✅ SUPPS (was MEDS) — done.
- ✅ CLASSES — done (new instructor portraits since `.45`; Cesar still has none).
- 🔄 GYM — works; Siza is testing it in real gym sessions. Exercise library rebuilt (82, `.48`); images to come.
- 🟡 MEALS — base only.
- ✅ Code-review fixes `.28`–`.32` (safe import, honest backup date, streak/week counting,
  quiet updates, med tick follows a time change) — tested on iPhone.
- ✅ Upgrade A fixed IDs (`.33`, tested on iPhone) · Upgrade B image cache (`.34`) ·
  Reload gym schedule (`.35`) · Safari banner (`.36`) · Gym comfort (`.37`) · code split,
  no visible change (`.38`) · confirm sheet, consistency, named colours (`.39`) · clean-up (`.40`) · weekly backup
  prompt, piece-by-piece backups, week summary tile (`.41`). `.34`–`.41` tested on iPhone, OK.
- Queue 3 (Classes alive + install pop-up), one release per item, details in `UPGRADES.md`:
  `.42` Classes first-open question has × / NOT NOW and keeps the tab bar · `.43` install pop-up
  replaces the Safari banner · `.44` Classes made alive (today's timeline, swipe days, live
  timing, ⭐ my classes, instructor page, studio colours, my stats). `.42`–`.44`: iPhone test pending.
- `.46` offline safety net · `.47` new exercise library (62, from `EXERCISES.md`); old plans/history/photos
  follow by alias · `.48` library = 82 (+20 new) with an `equipment` tag on each; 9 old retired exercises now
  alias to their new match, also for phones where they already sat under "My exercises" (iPhone test pending).
- `.49` Settings version line made reliable: the running service worker answers a `'version'` message (`sw.js`),
  Settings shows that, with the cache name as fallback (it was empty in the home-screen app once).
- `.50` fixes from review 1 (`REVIEW.md`): a merge never leaves the same exercise twice in a day; the old photo stays in the
  backup when both had one; the old-ID check runs once (`libraryFollowed`, import forces it); Settings shows the RUNNING
  version (read at start); star label "Delete". `.42`–`.50`: iPhone test pending.
- `.51` floating glass tab bar (icons only, sliding lighter pill behind the active icon, content scrolls under it);
  MEDS tab renamed SUPPS; star label "Unstar" (iPhone test pending).
- `.52` swipe back: swipe right anywhere on a sub-page or Settings = tap its "<" (the page follows the finger, a short
  or slow swipe snaps back). iPhone test pending.
- `.53` swipe-back tuning: back when dragged past 50% of the width (any speed) OR flicked fast past 25%, like iOS.
- `.54` design step 1 (`DESIGN.md`): glass and depth everywhere (background gradient, cards with hairline + soft shadow + 20px
  corners, glass sheets and sticky header, glow on the main button and active tab icon, section titles in Oswald); "My supps"
  and "+ ADD" in Supps. No layout, flow or word changes otherwise (iPhone test pending).
- `.55` new intro image (Siza) · `.56` design step 2, motion (`DESIGN.md`): page change slide + fade, press feel (scale .97 + darker,
  spring back), ✓ pop + lime flash, rings and numbers count up from 0, sheets spring up, prefers-reduced-motion respected
  (iPhone test pending).
- `.57` design step 3, premium Home (`DESIGN.md`): calm big greeting, glass tiles, lime-tinted 01 TRAINING, bigger animated numbers,
  WEEK SUMMARY as three small rings; the lime glow only on the ONE main button per screen (iPhone test pending).
- `.58` tab bar glass darker (84%, less colour boost) so a lime button scrolling under it is only a faint hint; schedule: Sixpax (Fri 18:00,
  Sat 09:30) and Fri Pound are 30 min (phones take it with Settings → Reload gym schedule).
- `.59` Classes filter chips always on ONE line: "★ MINE" is just ★ (aria-label "My classes"), chips a bit smaller; if a screen is still too
  narrow the row scrolls sideways (never wraps), and a touch on the row never swipes the day (`.cfilter` in `styles.css` / `classes.js`). iPhone test pending.
- `.60` review 2 fixes (`REVIEW.md`): the tab bar and swipe back always return as soon as no text field is focused (`body.typing` is re-checked
  on every focus change, tap and redraw, `app.js`); Supps empty state says "Nothing added yet". iPhone test pending.
- `.61` Profile page (`IDEAS.md` 1, 2, 5): the gear is gone; a round profile button (photo, else the name's first letter, else a person icon) sits top right of
  every tab page (Home's top bar, and a slim top row on Gym / Meals / Supps / Classes). Tap = one page with two segments, SETTINGS · PERSONAL INFO (swipe back works).
  SETTINGS = the old Settings as is, minus the Name row. PERSONAL INFO (`profile.js`): name, profile photo (same photo tools), height, weight, 12 body
  measurements in cm + "+ ADD MEASUREMENT"; each value is saved with its date, the latest is shown with a small "prev" value, tap a name for its history.
  New store `body` (DB 6) is in Export / Import / Reset. No name pop-up on first ENTER (Home says HELLO until a name is set). Supps page title: SUPPLEMENTS.
  iPhone test pending.
- `.62` (`IDEAS.md` 4, option b) the profile button sits on the TITLE line (right side) of Gym / Meals / Supps / Classes (the extra row is gone); on SE width the
  Supps date drops its weekday word. Tab swipe (`TabSwipe` in `app.js`): on a tab page a clear sideways swipe moves to the neighbour tab in tab-bar order (left = next to
  the right, right = the one on the left, no wrap), running the tab's own opener, the two pages slide (transform only). Never on inputs, while typing, under a sheet /
  sub-page / photo viewer, on anything that scrolls sideways itself (Classes chips), or within 20 px of the screen edges. Classes day swipe is REMOVED: days change
  only by tapping the weekday circles (if Siza dislikes it: option c in `IDEAS.md`). iPhone test pending.
- `.63` (`IDEAS.md` 3) intro: no ENTER button any more; TAP ANYWHERE enters. One medium glass pill "ENTER" (same glass as the tab bar, slow gentle pulse, transform +
  opacity only) sits above his head: its top is a % of the screen height (the photo fills the height, so the head starts at 22.6% on every phone), so it never covers him
  on iPhone 13 or SE. Logo, STRONGER EVERY DAY and the tagline are unchanged (same place). The pill is still a real button (keyboard / VoiceOver). Tab swipe is OFF while the
  workout logger is open (Gym tab with a running workout); the tab bar still works. iPhone test pending.
- `.64` intro like the iOS lock screen: the small ENTER pill is replaced by huge glass letters "ENTER" (tall, condensed Oswald 300, ~85% of the width, frosted translucent
  grey, light edge, a very slow shimmer = opacity only) in the dark upper part of the photo. A background-removed cut-out of him (`assets/bg-fg.png`, made with Apple's Vision
  foreground mask, same 941×1672 size, only head and shoulders kept, in `ASSETS`) is layered ON TOP of the letters through the same `.photo` rule, so it matches the photo exactly
  on every screen: his head covers the bottom ~38% of the letters. `fitEnter()` in `app.js` places the SVG letters from the photo's cover/50% 35% maths (head top at
  378 px and head centre at 458 px of bg.jpg): never under the logo, tied to his head. "STRONGER EVERY DAY" + tagline moved down to the dark floor (clear of the home bar).
  Tap anywhere enters; a hidden real ENTER button stays for keyboard / VoiceOver. If bg.jpg is ever replaced, redo bg-fg.png and the two head numbers in `fitEnter()`. iPhone test pending.
- `.65` ENTER letters reworked: about half the size (~45% of the width, centred, just above his head so the cut-out head covers only their bottom edge), Oswald 600 uppercase with a little
  letter-spacing (the app's headline font, not stretched), embossed transparent glass: mostly see-through fill, light top-left edge + soft dark bottom-right inner shadow (SVG filter `egEmboss`),
  a blurred copy of the photo shows inside the letters (frost), slow faint shimmer kept. Font settings sit on `#enterSvg` itself (copies made by `<use>` do not get rules on `text`). iPhone test pending.

## To-do (in this order — do ONLY what Siza / the planner sends, one step at a time)
1. ✅ DONE (`.35`) **Settings: "Reload gym schedule"** → confirm → schedule classes go back
   to the latest `data/gym-classes.json` (by fixed ID). Kept: attendance, notes on a class,
   classes/instructors added by hand, a phone photo of an instructor. To change the schedule
   for everyone: edit the JSON (new class = next free `fz-c..` number), release, tap Reload.
2. ✅ DONE (`.45`) **Instructor photos**: 14 new AI-cleaned studio portraits (640×800, Cesar still none) → replace files, same names, and raise
   each file's number in the `ASSETS` list in `sw.js`.
3. 🔄 **GYM exercise library rebuild** — list DONE (`.47`: 62, `.48`: 82 real exercises with `equipment`, fixed ids
   `lib-fz-…`, old ones aliased/retired, see `EXERCISES.md`); images still to come. Original plan: Siza sends photos of his gym's machines → planner
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
  backgrounds only; all text/buttons are real HTML. Intro photo = Siza's real B&W photo (taken by Siza); since `.55` = the RISEN character (Siza, AI) doing battle ropes, B&W with the lime chest logo.
- Navigation: ☰ menu was removed; bottom tab bar (and, since `.62`, a sideways swipe on a tab page) moves between tabs (the round profile button = Settings + Personal info).
  Calendar and Progress tabs were removed on purpose (not needed; "Last time" on each
  exercise IS the progress tracking).
- Name: set in Profile > Personal info (no pop-up on first ENTER since `.61`); until it is set the greeting is just "HELLO" (friends use the app too).
- Every editor: auto-save (0.4 s) + visible "✓ Saved" + DONE button + flush on
  background (`visibilitychange` / `pagehide`). Settings shows "✓ Saved" too (`.39`).
- Every "are you sure?" is the RISEN sheet `ask()` in `shared.js` — never the system
  `confirm()`. Red outline button = deletes something; lime = everything else.
- Words: "program" (not plan/routine) · "workout" (not session) · "delete" (not remove).
- A NEW item with something filled in but no name is saved as "Untitled …"; an untouched new
  item is discarded; an existing item whose name is cleared keeps its last saved version.
- Add buttons: lime "+ ADD …" at the top of the list it adds to (exception: Classes' day
  timeline has it at the bottom, so the timeline comes first).
- Glow (`.57`): the lime glow (`--volt-glow`) belongs to the ONE main button on a screen: `.play` on Home, the main `.primary` elsewhere
  (the Gym day's ADD EXERCISE gets `.nogl` while START WORKOUT is shown). Never more than one glowing button per screen.
- Home (`.57`): the week-summary rings fill as: workouts done / planned this week · doses taken / due · classes attended / starred
  (with none starred, a ring is full from the first one). Rings and numbers fill from empty when Home opens (`data-ring`, `data-count`).
- Motion (`.56`, `Motion` in `shared.js` + the MOTION block at the end of `styles.css`): only transform and opacity move. A
  new ✓ button calls `Motion.pop(button, row?)`; a number that should count up on open gets `data-count="N"` and its screen calls
  `Motion.count(root)` when it opens (Home: when the tab is entered or the app opens; Supps: when the tab opens, the ring starts
  from 0). Sub-pages, sheets and tab pages animate through their shared classes (nothing to add). Under
  `prefers-reduced-motion` nothing moves, only fades; keep that block in step with any new animation.
- Depth and glass (`.54`): a card = `--card` + hairline + `--card-depth` + `--r-card`; sheets and the sticky library header are
  blurred glass (the sheet backdrop only dims); at most TWO blurred layers on a screen (tab bar + one other: sheet, rest bar or
  sticky header; the toast does not blur); always a solid fallback in `@supports not (backdrop-filter)`.
- Tab bar (`.51`): a floating glass pill (16 px side margin, above the home bar via `--tabb`), icons only (names are
  `aria-label`s), volt icon + lighter pill (`.tabpill`, slides via `--i`) on the active tab. It sits over the content, so
  EVERY screen that shows it needs `padding-bottom: var(--tabspace)`; toast / rest bar / Classes question sit above it
  (`--tabb` + `--tabh`). It steps out of the way (`body.typing`) while a text field is focused; that state is re-checked on every focus change,
  tap and redraw (`.60`), never left to the "focus lost" event alone (a field redrawn away while focused sends none). Sub-pages, Settings and
  sheets cover it. Never touch the status bar meta.
- Swipe back (`.52`, `SwipeBack` in `shared.js`): on every sub-page (`.subpage`) and Settings. The page follows the finger;
  on release (`.53`, like iOS) it goes back if dragged past 50% of the width at ANY speed, or flicked past 25% while still
  moving ≥ 0.3 px/ms; anything less snaps back.
  Commit slides the page out and then presses the page's OWN "<" button, so each page closes exactly as before (saves,
  flushes, redraws): a NEW sub-page therefore needs its "<" as the first `.iconbtn` in its `.subtop`. Never starts on
  top-level tab pages (not sub-pages), while a field is focused / `body.typing`, on input / textarea / select (sliders
  too) / `[data-noswipe]`, under a sheet or the photo viewer, or unless the first move is clearly horizontal and to the
  right (vertical scroll stays native; pages are `touch-action: pan-y`). A region with its own horizontal swipe gets
  `data-hswipe`: there only a swipe from the left edge (24 px) goes back.
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
  "missing" for this reason; fixed with export/import). Since `.43` opening RISEN in a browser
  (not the icon) shows an install pop-up: iPhone/iPad = 3 illustrated steps, Android/Chrome =
  one INSTALL RISEN button, otherwise nothing; × closes it for the visit; never in the app.

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
- Exercise library = Siza's real gym (62 in `.47`, 82 in `.48`, `EXERCISES.md`), replaced the 66 generic ones through
  `aliases` / `retired` so plans, history and photos followed. Every exercise has `muscle` (library group, day title)
  and `equipment` (Machine/Cable/Dumbbell/Barbell/Bodyweight/Cardio; stored only, filter chips later). Images
  (`assets/exercises/<file>`) come later. T-bar row and Preacher curl stay retired until confirmed at the gym.
  A retired exercise that later gets a match moves to `aliases`; a phone where it was already in "My exercises"
  moves it (plan, history, notes, photo) and drops the stale entry. After a merge a day keeps ONE copy of the same exercise
  (the first); the old check at start-up runs once per library change (fingerprint in settings `libraryFollowed`).

**SUPPS (meds.js)**
- A med counts from the day it's added (earlier days = "not scheduled", not "missed").
- Known small flaw (accepted for now): changing a schedule re-judges past days. Exception
  (`.32`): a dose already taken TODAY follows its med to the new time (no double dose).
- Weekly = one weekday. Groups by exact time. Undo is per dose (on purpose, safer).
- No notifications: ON HOLD until the native Apple app (Capacitor). Do not build in the web app.

**CLASSES**
- Gym = Fitness Zone; 3 studios: Energy, Balance, Power. 37 classes, 15 instructors
  (Cesar has no photo; Zumba Thu 19:30 instructor unknown = TBA).
  Fri Pound time set to 17:30 (not labeled on the board — Siza's call). Since `.58`: Sixpax (Fri 18:00, Sat 09:30) and Fri Pound
  (17:30–18:00) last 30 minutes; every other class 60.
- Seed loads once on YES; afterwards it's normal editable data. Schedule classes carry
  `seed:true` and a fixed ID; "Reload gym schedule" resets only those.
- Instructor photos are public in the repo — Siza decided this is fine (they're already
  public in the gym's own app). New studio portraits since `.45`.
- "Clear all classes" also removes instructors (they belong to the old gym).
- ⭐ = `star:true` on the class record (no new store); kept by "Reload gym schedule". Home tile =
  next starred class today, else next class of any kind. Live timing only exists for TODAY.
  My stats = this calendar month. The tab always opens on today, scrolled to the live/next class.

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
