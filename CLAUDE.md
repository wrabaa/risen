# RISEN — Project Brief (read this first, every session)

## What RISEN is
A personal health app for Siza (and a few friends) — **NEVER TOO LATE**.
Gym training, meds/supplements, gym group classes and meals, in one simple app.
It is NOT an international product: simple, useful, fast to understand beats feature-rich.
Rule of thumb: **one screen, one job, one big button. No manual needed.**

## How it runs
- Files: `index.html` (markup only) · `styles.css` · `shared.js` (helpers every tab uses) ·
  `app.js` (Home, tabs, Settings, backup, updates) · `profile.js` (profile button, Personal info) · `coach.js` (instructor: Users, `.124`) · `media.js` (content that comes from repo folders by itself: exercise pictures / clips `.90`, recipe pack `.91`) · one file per tab. A new file must be
  added to `CORE` in `sw.js` or it will not work offline.
- Plain HTML/CSS/JS PWA, no build step, no framework. Hosted on GitHub Pages:
  https://wrabaa.github.io/risen/ (repo `wrabaa/risen`, branch `main`).
- Installed on iPhone via Safari → Share → Add to Home Screen.
- Fully offline, no accounts, no server, no analytics. Each phone keeps its own data.
- Data: IndexedDB (`db.js`) with a versioned schema — never lose user data on update.
  Every new store goes into Export / Import / Reset.
- Photos: `photo.js` (resize ≤1000px JPEG, stored in IndexedDB, included in backup; a GIF / WebP is kept as it is, up to 5 MB, so it stays animated; on an EXERCISE a short video clip, MP4 or MOV up to 8 MB, may be chosen instead and plays silent and looping, `.87`).
- Service worker `sw.js` — bump `VERSION` on every release (format `YYYY-MM-DD.N`).
  App files (pages, code, `data/`) are re-downloaded on every release. Images and fonts live
  in their own cache that survives releases, driven by the `ASSETS` list at the top of `sw.js`:
  **add an image → new line with number 1 · replace an image (same name) → raise its number
  by 1 · remove an image → delete its line.** Forgetting this means phones keep the old image.
- Offline safety net (`.46`): a page request with no cached copy and no network serves the cached
  `index.html` instead of the browser's error (`sw.js`); non-page files are unchanged.
- A new release never takes the screen away (`.135`): it loads when the intro is tapped (the app reloads straight onto Home, flag
  `risen.skipIntro` in sessionStorage, no second intro) or when the app goes to the background on a quiet Home / the intro; otherwise it waits.
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
`--danger` #FF6B6B (delete/reset ONLY — the one exception to "one accent") · `--live` #E5252A (the red LIVE tag on Home's CLASSES tile ONLY, white text; Siza asked for red, `.88`) · `--field` #0F0F0F
(inputs) · `--press` #202020 · `--dash` #3A3A3A · `--mid` #4A4A4A · `--dim` #5A5A5A ·
`--faint` #6A6A6A · `--off` #2A2A2A · `--soft` #C9C9C9 · `--soft2` #D6D6D6 · `--volt-press` #B8E600 ·
tab bar glass: `--glass` rgba(26,26,26,.84) (`.58`; it was .62 and let lime show through bright) · `--glass-hi` rgba(255,255,255,.1) (the pill behind the active tab) · `--chip` rgba(11,11,11,.55) (small label chips that sit on a photo, `.82`; also the role card's dim) · `--scrim` rgba(11,11,11,.92) (role card background without blur, `.134`) ·
depth (`.54`): `--bg-top` #141414 + `--glow` (≤4% lime) = the background gradient `--bg-grad` · `--hairline` white 8% (card edge) ·
`--hilite` white 6% (light along a card's top) · Home (`.57`): `--glass-tile` (frosted tile, no blur) · `--volt-tint` / `--volt-edge`
(lime tint and edge of the 01 TRAINING tile) · motion (`.56`): `--volt-flash` (lime flash on a ticked set row) · `--ease` / `--spring` (curves) · `--shadow` · `--glass-sheet` · `--glass-bar` · `--glass-solid` (fallback when the
browser cannot blur) · `--volt-glow` (under the main button and active tab icon) · `--r-card` 20px · `--card-depth` ·
studio tags (Classes only, subtle): `--studio-energy` #D9A25E · `--studio-balance` #7CB9AE ·
`--studio-power` #A592D6.
No dot-matrix font. Intro = Siza's photo + logo + "STRONGER EVERY DAY" + no ENTER button (tap anywhere enters; the look of ENTER is to be redesigned later, `.67`)
(all text/buttons in code, never baked into images).

## Structure
Intro → Home. Tab bar (a floating glass pill, icons only): **HOME · GYM · MEALS · SUPPS · CLASSES**. A round profile button (top right of the shared top bar) opens the profile page: SETTINGS · PERSONAL INFO.
- **HOME** (`app.js`): Hello [name], tiles 01 TRAINING (shortcut to today's gym day),
  02 SUPPLEMENTS, 03 WATER, 04 COFFEE, 05 TRY TODAY (a recipe card, `.98`), 06 CLASSES, 07 THIS WEEK, 08 STREAK, 09 WEEK SUMMARY (four small rings: workouts · supplements taken/due ·
  classes attended · water), backup reminder line.
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

## Status (release 2026-11-24.33)
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
- `.66` ONE shared top bar (`#tbar` in `index.html`, `.tbar` in `styles.css`) on Home, Gym, Meals, Supps and Classes: R mark (24 px) · page title (Oswald 22 px, HOME / GYM / MEALS / SUPPLEMENTS / CLASSES,
  set by `show()` in `app.js` from `TAB_TITLES`) · profile button. It is fixed (never scrolls, the same box on every tab to the pixel, touches pass through to the page below); pages start at `--topb`
  and fade out under it (mask). What each tab used to show at its top (date range, date, WEEK / TODAY button, workout name + clock) is now the small `.subline` right under the bar (Meals has none).
  Home's greeting stays below the bar. Sub-pages keep their own "<" bar. A NEW tab page: add it to `TAB_TITLES` and start its content with a `.subline` (or nothing). iPhone test pending.
- `.67` the glass ENTER letters, the head cut-out layer (`assets/bg-fg.png` deleted, its `ASSETS` line removed) and the head measurements / `fitEnter()` in the code are REMOVED again. The intro is the photo, the
  logo, STRONGER EVERY DAY + tagline at the bottom; tap anywhere enters; the hidden real ENTER button stays for VoiceOver. How ENTER looks is to be redesigned later (`IDEAS.md` item 3). iPhone test pending.
- `.68` workout log: every set's kg and reps have big − / + buttons (kg ±2.5, reps ±1, never below 0; a tap steps once, holding repeats), the number is still a typing field; the set number is now a tiny
  label in the row's top-left corner (the row is `kg group · reps group · ✓`). Beat last time: a TICKED set that beats the best set of "Last time" (more kg at the same or more reps, or more reps at the same kg;
  nothing to beat the first time) gets a lime ▲ PR badge (pops in, follows edits and un-ticking); on FINISH the session stores `prs` (exercise ids) and those exercises show "▲ PR today" in the day's list and
  on the exercise page. iPhone test pending.
- `.69` NOW card on Home (`nowInfo()` / `renderNow()` in `app.js`; `#nowCard` between the greeting and the tiles): ONE glass card with the single next thing and one big button, first match wins:
  1 workout running ("Workout in progress · N min", RESUME → Gym) · 2 a dose due now or overdue today (names + time, ✓ TAKE ticks them with `Motion.pop`; `Meds.dueNow()` / `Meds.takeDoses()`) ·
  3 a class starting within 60 min, starred first (photo, "Starts in N min", OPEN → Classes; `Classes.soon()`) · 4 today's workout not done (day title, exercise count, START) ·
  5 next dose later today ("Next: Omega 3 at 14:00", no button) · 6 "All done today ✓" in lime. A brand-new app (no meds, no program, no classes) shows no card. It refreshes every minute
  (not while a sheet is open), whenever Home is drawn and when the app comes back to the front. Its button is the ONE glowing button on Home; the ▶ on the TRAINING tile no longer glows. iPhone test pending.
- `.70` Home says "Supplements" in full (tile 04, the week-summary ring label and "Add them in Supplements"); the tab bar has no words, so nothing else is short any more. iPhone test pending.
- `.71` review 3 fixes (`REVIEW.md`): Personal info also saves pending edits on `pagehide` / when the app is hidden (`profile.js`); a dose is not due on the day its supplement was added if its time is earlier than the moment it
  was added (first done in `doseTimes()`, which hid doses and was reverted in `.72`; now only in `Meds.dueNow()`); the database upgrade no longer fails with a system error: an old window lets go of the database when a newer one asks
  (`onversionchange`, shows "RISEN was updated"), and an upgrade still blocked after 4 s shows "RISEN is open in another window / Close other RISEN windows, then reopen" (`onblocked`, `db.js` + `app.js`). iPhone test pending.
- `.72` SUPPS fixes: the `.71` rule hid doses (a supplement added after its dose time lost that dose from TODAY: no card, no ✓, "No doses today"). `doseTimes()` is gone again: TODAY, the Home tile and the week dots show and
  count every dose; the rule now lives ONLY in `Meds.dueNow()` (NOW card: a dose earlier than the moment the supplement was added today is not due / overdue). The editor starts with "Photo of the box" (above Name). In this
  section the user-facing word is "supplement" (page title, New / Edit supplement, Delete supplement, hints, Untitled supplement); ids, data keys and the store name stay "med". iPhone test pending.
- `.73` SUPPS redesign (`meds.js`): the plain ring card is now **NEXT UP**: one card with the next supplement's box photo big in the middle of the day's progress ring (same ring animation; pill icon without a photo; a big ✓ when all are
  done), name, dose and time under it, a lime ✓ TAKE button that ticks it, and a small taken/total count in the corner. Which one (changed in `.77`: the LATEST untaken dose that is due, i.e. the one closest to now; was the earliest untaken DUE dose), else the next one later today ("At 14:00"),
  else an untaken dose from before the supplement existed ("Earlier today"), else "All done today ✓". ONE due rule for everything (`isDue()` in `meds.js`: time reached today, unless the supplement was added today after that time):
  NOW card, NEXT UP and the dose cards. A due, unticked dose card gets a lime border and a lime "TIME TO TAKE" pill (`.dose.due`, same look as `.cls.live` / `.livepill`). The Supps tab redraws every minute while it is open and in front
  (`minuteTick()`), so a dose lights up at its time by itself. MY SUPPS rows show the box photo on the left (`data-mphoto`, same loader as the dose cards). The `+ ADD` there is `.nogl` (the NEXT UP button is the one glowing button). iPhone test pending.
- `.74` WATER on Home only (no tab): new store `waterlogs` (DB 7, one record per day `{date, glasses}`, keyed by `date`, a glass = 250 ml) in Export / Import / Reset; the goal is the setting `waterGoal` (glasses, default 10; nothing new in Settings).
  Home tile 06 WATER (week summary is now 07): big litres, "N of G glasses"; a tap ANYWHERE on the tile adds a glass (count-up via `Motion.count`, which now also counts decimals with `data-dec`), the round − takes the last one back (never below 0),
  the small gear opens the goal sheet (glasses with − / +, the litres it adds up to, DONE); − and gear never add a glass. It resets by itself at midnight (Home redraws when the day changes: minute timer). The week summary has a 4th ring, WATER:
  glasses from Monday up to today against the goal × those days (rings are smaller: 64 px, labels 9 px). iPhone test pending.
- `.75` SUPPS NEXT UP card is information only: no ring, no TAKE button (ticking is on the dose cards below). The box photo runs edge to edge at the top of the card (4:3, cropped to fill, the card's rounded top corners clip it);
  without a photo the pill icon sits centred on a plain card-coloured block of the same height. Name, "dose · time" (and TIME TO TAKE when due) sit under it; the taken/total count and the NEXT UP label are small chips in the top corners
  of the photo. The `+ ADD` in MY SUPPS is the Supps screen's glowing main button again. iPhone test pending.
- `.76` CARDIO exercises (muscle group "Cardio": Treadmill, Elliptical, Stair Climber, Rowing, Indoor Cycling Bike, and any custom exercise put under Cardio; `isCardio()` in `gym.js`) get their own fields instead of sets · kg · reps:
  setup screen = MIN · SPEED KM/H · INCLINE % (same `.targets` look, number keypad, blanks allowed; plan entry `{exerciseId, min, speed, incline}`); in a started workout ONE row (three labelled fields with big − / + (min ±1, speed ±.5,
  incline ±.5, never below 0) and a ✓; no "+ Add set", no rest timer; the ✓ needs minutes). It is stored as a one-set draft entry flagged `cardio`, so ticking / finishing work as before. The finished entry (log row) keeps `sets: []` plus
  `min`, `speed`, `incline` (a blank or 0 field = left empty, saved as null); no new store, and strength entries save exactly what they did. "Last time" and the day-list targets read "28 min · 6.0 km/h · 3%" (empty fields skipped).
  No ▲ PR on cardio. iPhone test pending.
- `.77` SUPPS NEXT UP picks the dose CLOSEST to now: the LATEST untaken dose whose time has passed (a dose missed in the morning no longer holds the card all day; it keeps its own card with its ✓ below), else the next one coming up later today, else "All done today ✓". iPhone test pending.
- `.78` Home is a visual scan screen. `Classes.next()` looks ahead up to 7 days: when nothing is left today it returns the first class of the next day that has one (`dayOffset`, `day`); the Classes tab does not use it and is unchanged.
  CLASSES tile: avatar, class name, time, ★ when mine; not today = the day in front ("Tomorrow · ZUMBA · 19:30", "Mon · SIXPAX · 18:00"); only with no class in 7 days it keeps its old message. SUPPLEMENTS tile (`Meds.homeInfo()`): the box photo
  of the dose to feature (same pick as NEXT UP: the latest due, else the next today, else the first tomorrow), its name and time, the taken/total count, and under it a row of 44 px box photos for every other dose of today in time order (taken = dimmed
  with a ✓); the row scrolls sideways, never smaller. Tapping an untaken thumb takes that dose from Home (pop, same log as the Supps tab); tapping the rest of the tile or a taken thumb opens the Supplements tab. The photo loader is
  `Meds.loadThumbs(root)` (same cache as the Supps tab; pill icon without a photo). iPhone test pending.
- `.79` Home tiles with a picture share ONE layout (`picRow()` in `app.js`, `.picrow` / `.tpic` / `.ttxt` / `.tcount` in `styles.css`): the image on the LEFT, the text to its right, the image a rounded square (72 px, the card's
  corner radius = 1.3 × the old 56 px avatar), same gap in the CLASSES and SUPPLEMENTS tiles. The SUPPLEMENTS tile shows only the next dose (photo, name, time) and the taken/total count: the row of small box photos and taking a dose from Home
  are gone (tap the tile = the Supplements tab). The round `.avatar` is unchanged everywhere else in the app. iPhone test pending.
- `.80` Home reordered: the NOW card is REMOVED (the tiles cover the same ground with photos and times; `nowInfo()` / `renderNow()` / `#nowCard`, `Meds.dueNow()`, `Classes.soon()` and the `.nowcard` CSS are gone). Tile order, numbered 01 up:
  TRAINING · SUPPLEMENTS · WATER · CLASSES · THIS WEEK · STREAK · WEEK SUMMARY. Nothing inside any tile changed. Home redraws every minute while it is open (a dose becomes due, a class gets close, midnight). The ▶ on the TRAINING tile
  is the one glowing button on Home again. iPhone test pending.
- `.81` WATER tile look (nothing it does changed): litres as the big number with a small L, "6 of 10 glasses" on the same line pushed to the right, and under it one small glass (22 × 30 px, 6 px apart, rounded-bottom shape, thin `--line` outline,
  filled `--volt` when drunk) per glass of the goal. Too many for one line = evenly filled rows (never narrower than 22 px); over the goal the row stays at the goal and a lime "+2" ends it (room is kept for it). The round − now sits in the
  tile's top corner next to the gear (so the glasses can use the full width; 10 fit on one line on iPhone 13 and SE). Class names: `.wbody` / `.wline` / `.wcount` / `.wglasses` / `.wgrow` / `.wg` (not `.wmain`, which the Gym lists use). iPhone test pending.
- `.82` review 4 fixes (`REVIEW.md`): the minute timer on Home (`tickHome()` in `app.js`) only looks at the clock tiles (SUPPLEMENTS, CLASSES, WATER) and redraws one only when what it SAYS changed (`tileText`); a new day redraws the
  greeting and tiles (`drawHome()`); the timer never touches the top bar or the profile photo, and `Profile.avatars()` no longer rebuilds an unchanged photo / letter (`avSig`). New named colour `--chip` (label chips on a photo). CLASSES tile day
  label: Tomorrow, the weekday for 2-6 days ahead, the date ("Sat 22 Nov") from 7 days. Water − label "Delete a glass"; a cardio target typed below 0 is kept as 0; the water goal sheet shows "✓ Saved". iPhone test pending.
- `.83` COFFEE card on Home, directly under WATER (tiles below renumbered; no ring in the week summary): new store `coffeelogs` (DB 8, one record per drink bought `{id, date, price}`; the price is stored WITH the purchase, so changing the price never
  rewrites what was spent; the id starts with the time so records keep their order) in Export / Import / Reset. The drink name and the current price are the settings `coffeeName` / `coffeePrice` (default "Coffee", $3.50; nothing in the Settings page).
  Card: the picture on the left (shared `.tpic`; the file `assets/coffee.png` when it exists, a cup icon until then — to use a picture, drop the file in `assets/` and add `'assets/coffee.png': 1` to `ASSETS` in `sw.js`), the CURRENT CALENDAR MONTH's total as the
  big number ("$84.50") and "19 cups · November" under it (it starts again on the 1st; past months stay in the data). A tap anywhere adds a drink at the current price (count-up; `data-fix` = fixed decimals in `Motion.count`), the round − removes
  the last drink of this month (never below zero), the gear (water-card corner buttons) opens a sheet with the name and the price (− / + by $0.50, saved at once with "✓ Saved", DONE closes). iPhone test pending.
- `.84` photo rows share one look: the picture is a SQUARE flush with the row's left, top and bottom edges (the card's rounded corners clip it, no padding; the stored photo is scaled with `object-fit: cover`, never stretched), the text beside it,
  every row of a list the same height. Gym day exercises: 112 px rows, name up to 2 lines then an ellipsis, target line, ▲ ▼ 🗑 stacked on the right (same x on every row); the big muscle-group heading is gone and the "N exercises" count (or "Rest day") is on the
  day title's line in the top bar (`#gymPageCount`). Supps: TODAY dose cards 124 px (name ≤ 2 lines, dose, ONE status line: TIME TO TAKE or taken / food, the 7-day strip, the tick on the right), MY SUPPS rows 96 px. Home picture tiles (SUPPLEMENTS, CLASSES, COFFEE; drawn by
  `tileHtml()` from a `picRow()` object): the image is a 134 px square flush left over the tile's full 136 px height, the head and the text to its right; the Classes tile shows the class name (2 lines) and the day · time · instructor on the small line. The minute
  tick redraws a changed tile as a whole (`tileHtml()`). iPhone test pending.
- `.85` animated pictures keep moving: `PhotoSlot.prepare(file)` (`photo.js`, also used for instructor photos) stores a GIF or WebP file EXACTLY as chosen (no canvas, no re-encode, so the frames survive; its real width and height are read from the image;
  the `type` is kept in the photos store, so every `<img>` made from the stored blob animates: gym rows and exercise page, Supps cards, MY SUPPS, NEXT UP, Home tiles; Export / Import carry the bytes unchanged). Over 5 MB is refused with the toast "That file is too big — keep it under 5 MB"
  (nothing stored). Everything else still goes through `resize()` to a JPEG. The photo slot shows the stored size and kind ("GIF · 1.2 MB", "JPG · 180 KB") on the photo. The slot's error is a toast now (no system `alert()`). iPhone test pending.
- `.86` CLASS ROWS (`classCard()` in `classes.js`, the day timeline for any day) get the `.84` photo treatment: the instructor photo is a 120 px square flush with the row's left, top and bottom edges (the card's rounded corners clip it, no padding, `object-fit: cover`,
  never stretched), the class name (2 lines then an ellipsis), time, LIVE NOW / Starts in, studio tag + instructor beside it, the > and the star on the right; every row 120 px (the ✓ ATTENDED button sits under it on today). No photo (Cesar) or no instructor (TBA) =
  the initial / TBA centred on a plain card-coloured square of the same size. Tapping the photo still opens the instructor page. The WEEK list's day rows have no photo, and the round `.avatar` is unchanged everywhere else (instructor lists / pages, profile button). The lime "mine" edge
  is not drawn on these rows (the photo covers it; the star shows it). iPhone test pending.
- `.87` VIDEO CLIPS on exercises (built by the planner chat, not Claude Code): the exercise photo slot (`PhotoSlot.mount(..., {video:true})`, exercise page and workout log only) says "+ Add photo or video" and also takes a video (`video/mp4`, and the `video/quicktime` MOV an
  iPhone hands over from Photos). The file is stored EXACTLY as chosen in the same `photos` store with its `type` (so Export / Import carry it), up to 8 MB ("That video is too big — keep it under 8 MB (3–5 seconds)"). `PhotoSlot.media(url, type)` is the ONE way to draw it:
  a clip = `<video muted loop autoplay playsinline>` (no controls), anything else = `<img>`; `PhotoSlot.kick(root)` starts the clips after a draw and when the app returns to the front. Shown in the gym day rows (`thumbHtml()` + `thumbKind` in `gym.js`), on the exercise page,
  in the workout log and in the full-screen viewer; the size label reads "VIDEO · 1.2 MB". Supps, recipes, profile and instructor photos still take pictures only (a video there is refused: "A video only works on an exercise"). `assets/coffee.png` is now in `ASSETS` (review 5).
  Known limits: in iPhone Low Power Mode clips do not start by themselves (first frame shows); many big clips make the backup heavy. iPhone test pending.
- `.88` Home CLASSES tile shows a class that is running NOW (planner chat): `Classes.next()` picks a live class first (a starred live one before the others), then the next starred, then the next of any kind (before, a starred class later today hid the one running now).
  A live class gets a red rectangle "LIVE" in white (`.livetag`, colour `--live`; since `.89` at the right end of the tile's head line, not on the photo) and its name alone (no "Now:"); it goes away by itself when the class ends (minute timer). The Classes tab is unchanged (lime LIVE NOW). iPhone test pending.
- `.89` Gym day page (planner chat): when today's workout can be started, "+ ADD EXERCISE" and "START WORKOUT" sit SIDE BY SIDE (`.daybtns`, equal halves, 15 px text; START is the glowing one, on the right); they used to be stacked and touching since `.84` took the heading
  between them away. On any other day, or once the workout is done / skipped, ADD is alone at full width with 14 px under it. Home CLASSES tile: the red LIVE tag moved off the photo to the right end of the "05 CLASSES" line. iPhone test pending.
- `.90` BUILT-IN EXERCISE PICTURES / CLIPS (planner chat; `media.js`, `ExMedia`): a file in the repo folder `assets/exercises/` named after an exercise's `file` in `library.js` (`chest-press.mp4`, `leg-curl.jpg`; the 82 names are in `assets/exercises/README.md`) belongs to that
  exercise. NOTHING in the code lists the files and NO release is needed to add one: when the app is open and online (3 s after opening, on returning to the front, at most every 10 minutes) it asks GitHub's public API what is in the folder
  (`api.github.com/repos/wrabaa/risen/contents/assets/exercises`; this is the app's ONE call outside its own site, it sends nothing about the user), downloads new or changed files (by `sha`; the program's exercises first; over 8 MB skipped; a clip wins over a picture) into its own
  cache `risen.exmedia` (index in `m/index.json`), and deletes what left the folder. Offline it shows what it has. `sw.js` lets `assets/exercises/` requests pass (no second copy) and these files are NOT in `ASSETS`. Shown where the exercise photo sits (gym day rows, exercise page, workout log)
  ONLY when the user has no photo / clip of his own for that exercise (his own always wins; deleting it brings the built-in back). On the exercise page a quiet "+ Use my own photo or video" sits under a built-in one (`swap:true`). App content, not user data: not in Export / Import / Reset.
  Custom exercises have none. If GitHub cannot be reached, nothing changes. iPhone test pending.
- `.91` RISEN RECIPE PACK (planner chat). `media.js` is now ONE engine, `RepoFolder` (asks GitHub what is in a repo folder, keeps the files in its own cache, follows changes by `sha`), used twice: `ExMedia` (`assets/exercises/`, behaves exactly as in `.90`; exercises are NOT a choice:
  pick an exercise and its clip is there) and `RecipePack` (`assets/recipes/`: `recipes.json` = the text, one picture per recipe named after its `id`; format and rules in `assets/recipes/README.md`). So a recipe is added, corrected or removed by changing that folder: no release.
  The pack IS a choice: opening Meals asks once "Load RISEN recipes?" (YES, LOAD THEM / Start empty; only when the pack really has recipes), setting `recipePack` = 'yes' / 'no'; Settings > Data > "RISEN recipes" loads them later or deletes them again. On YES each pack recipe becomes a normal
  recipe in the `recipes` store (id `pack-<id>`, plus `pack`, `packSig`, and `kcal` / `serves` / `health`), free to edit, move, delete (`applyPack()` in `meals.js`). Three rules: a recipe the user DELETED stays deleted (`recipePackGone`); one he EDITED is his (`edited:true`, never
  overwritten, kept when the pack is deleted from Settings); an untouched one follows the pack (corrections arrive, a recipe taken out of the pack goes). The pictures are fetched only on YES and shown when the recipe has no photo of the user's own (cards, category covers, recipe page with
  "+ Use my own photo"; `PhotoSlot.mount(..., {builtIn})` is now how a slot gets the app's own picture, exercises use it too). The recipe page shows "180 kcal per serving · Serves 2" and the health line when a recipe has them (`.rfacts`; not editable yet). The pack starts EMPTY
  (`"recipes": []`): the planner adds Siza's recipes there when he says push. iPhone test pending.
- `.92` GYM log fixes from Siza's real use: a **"− Remove set"** button next to "+ Add set" (takes the LAST set out of the running workout only, the program doesn't change; one set always stays, the button is greyed at one; a
  set that is already ticked asks first). "+ Add set" / "− Remove set" now redraw only that exercise's rows (`strengthRow()` / `setsHtml()` / `setBtnsHtml()` / `refreshSets()` in `gym.js`, `.setbtns` in `styles.css`): the page no longer
  jumps back to the top and the exercise pictures are not reloaded. The cardio card has no set buttons. Siza also reported that the treadmill ✓ could not be pressed: it could NOT be reproduced (it ticks with minutes typed or stepped, with a
  photo on the card, and a blank MIN answers "Enter the minutes first"); waiting for what he sees when he taps it. iPhone test pending.
- `.93` taps landing a row off (Siza: pressing a set's ✓ marked the one BELOW; the treadmill ✓ could not be pressed): not reproducible without an iPhone, so the likely cause is fixed. A field that is redrawn away while it still has the focus
  (type a kg, then press + Add set / − Remove set / the bin) leaves the iPhone keyboard half open and the page nudged, and every tap lands off the finger. `leaveField()` in `gym.js` lets go of the field before any redraw of the log, and a small block in
  `app.js` (next to the typing sync) puts the window back at the origin whenever NO field is focused (focusout, taps, `visualViewport` resize / scroll, `scroll`): the app never scrolls the window itself, so this is safe, and it leaves the page alone
  while a field is focused. If it still happens: next suspect is the fade `mask-image` on `.view` (`styles.css`), a known cause of wrong touch positions on iPhone; replace it by a fade overlay on `.tbar`. iPhone test pending.
- `.94` REST TIMER "PONG": a soft bell plays at the moment the rest time ends (with the lime flash). `Pong` in `gym.js` makes it with the phone's own Web Audio (a note + two overtones, ~1 s; no sound file, works offline). iPhone only allows sound after a tap, so the
  audio is switched on by the tap that starts or changes the timer (the ✓, ±15). It plays only at the moment it ends (reopening the app to a timer that ran out long ago stays quiet; Skip makes no sound) and follows the ringer switch (silent mode = no pong; it does not
  interrupt music). No setting for it yet. iPhone test pending.
- `.95` NEW GYM SCHEDULE (planner chat; `data/gym-classes.json` version 3, from the gym's app, week of 16 Nov 2026): 33 classes. Changed: Mon 10:00 Tabata → Spinning (Bader) · Tue 10:00 Iron Core → BootyCore Blaster (Mijay) · Tue 19:00 Circuit Training → Shape Up (Mira) ·
  Tue 19:00 Stretch is Ghada's (was Patricia) · NEW Tue 20:00 Belly Dance (Hanin Abdallah) · Wed 19:00 Stretch n Roll gone (the Rouane clash is solved) · Thu 18:00 Yoga, 19:00 RPM, 19:30 Zumba gone · Fri 17:30 Pound, 18:00 Sixpax, 19:00 BodyBalance gone, NEW Fri 18:00 Tabata and
  19:00 Spinning (Hassan Katiba). New ids `fz-c38`–`fz-c43`; retired, never reused: `fz-c02, c06, c07, c15, c16, c17, c26, c29, c30, c36`; next free `fz-c44`. Two new instructors without a photo (Hanin, Hassan); "Mjay" is now "Mijay Jawad", "Cesar" is "Cesar Ghanem"; Patricia, Jad and Bahaa
  stay in the instructor list with no class. The new file gave no studio: kept for classes that stayed, guessed for the six new ones (Spinning = Power, Belly Dance = Balance, the rest = Energy). Class names keep the app's wording (the gym's app shortens: B.Pump, RPM, Yoga, Six Pax).
  Phones take it with Settings → Reload gym schedule. iPhone test pending.
- `.96` review 6 fixes (`REVIEW.md`, planner chat): a RISEN recipe that gets a photo of the user's OWN is marked `edited` (his: never taken away with the pack; `meals.js`, the photo slot's `onChange`); a `recipes.json` with no `recipes` list is treated like a
  broken file (nothing changes on the phones; only a real empty list empties the pack; `RecipePack.list()` in `media.js`); after a round where a file did not download, GitHub is asked again in 2 minutes, not at every return to the app (`RepoFolder.sync()`). iPhone test pending.

- `.97` PULL DOWN TO REFRESH (Siza asked, planner chat; `Pull` in `app.js`, `.ptr` in `styles.css`, `#ptr` in `index.html`, `window.RepoNow` in `media.js`): on a tab page scrolled to the very top, a clear pull DOWN (armed at 90 px of finger) and release = refresh. A small card-coloured
  chip under the top bar says PULL TO REFRESH → RELEASE TO REFRESH (lime) → UPDATING (spinner) → ✓ UPDATED (lime), or NO INTERNET offline. It asks GitHub about both folders NOW without the 10-minute wait (`RepoNow()` = `ExMedia.sync(mine, true)` + `RecipePack.sync(true)`;
  `ExMedia.sync` got the same `force` argument), asks the service worker to look for a new release (a release still loads by the usual quiet-Home rule), and redraws Home; Meals / Gym follow by their own `onChange`. SOFT: the page is never reloaded, nothing can be lost. Never starts: on inputs,
  while typing, under a sheet / sub-page / photo viewer, in a running workout, or when the page is not at the top; a sideways or upward move steps aside (tab swipe, swipe back and the Classes chips are untouched). Max 12 s wait. Only transform and opacity move; reduced motion = no spin. No blur on the chip.
  Tested at iPhone 13 and SE size with synthetic touches (Home, Meals, Gym, offline, sheet open, scrolled, diagonal, up, tab swipe). iPhone test pending.

- `.98` TRY TODAY card on Home (Siza's idea, planner chat; `meals.js` `tryInfo()` / `tryPrep()` / `openTry()`, tile in `app.js`, `.tile.tryit` in `styles.css`): tile 05, between COFFEE and CLASSES (the numbers after it moved up by one: CLASSES 06, THIS WEEK 07, STREAK 08, WEEK SUMMARY 09).
  A big picture card like the Meals covers: the recipe's picture fills the card under a dark fade, "05 TRY TODAY" on top, the recipe name (Oswald, 2 lines) and "Lunch · 380 kcal" at the bottom, a small lime outline "TRY IT" pill (no glow). The recipe is picked ONCE per app opening
  from the recipes that have a picture on the phone (own photo or the pack's picture), never the same one as last time (setting `tryLast`), and stays for the whole opening (Home redraws all day). The whole card opens the Meals tab with THAT recipe's page on top (back = the Meals tab).
  No recipe with a picture yet = no card, and the numbers close up (a tile may have `show()` in `TILES`; `tileNo()`); it appears by itself when recipes arrive (`risen-try` event) or on a pull-down refresh. Its picture URL is its own, so leaving the Meals tab never breaks it. iPhone test pending.

- `.99` review 7 fixes (`REVIEW.md`; `.96`–`.98` reviewed): **a replaced picture or recipes.json could stay OLD on a phone for good.** GitHub lists the new file at once, the site serves it a minute or two later; a phone that looked
  in between stored the old file under the new `sha`. Now every downloaded file is CHECKED against the `sha` GitHub listed (`same()` in `media.js`: git's SHA-1 of the file); a file that is still the old one is not stored and is asked
  for again in 2 minutes (a pull down asks at once). Records carry `v` (checked) and `at` (when stored); a file stored before `.99` is checked once and fetched again if it is wrong, so phones that are stuck heal by themselves.
  Safety valve: a file that never matches for 20 minutes is taken as it is (`u`) and looked at again once a day, so content can never get stuck. One download round at a time; a pull down during a round waits for that round.
  When a pack picture is replaced, the Meals screens let go of the old one (`RecipePack.onChange` with the file's key) and the TRY TODAY card follows (`tryFollow()`). The card's picture URL is always its own
  (`RecipePack.imageBlob()`), freed when the card goes. Its recipe deleted = a new pick the next time Home is shown. The card's picture no longer fades in again at every redraw of Home (a glass of water, a coffee);
  its number is readable on the photo. A RISEN recipe given an own photo is marked his even when the page is closed at that very moment. Recipe photo list is swapped in one go (`refreshKeys()`). iPhone test pending.

- `.100` ANIMATED INTRO (Siza's clip): the intro picture is now a 4 s looping, silent video `assets/bg.mp4` (480×852, from OpenArt; audio track removed) with `assets/bg.jpg` (its first frame) as poster / fallback (Low Power Mode shows the still). `<video class="photo" autoplay muted loop playsinline>` in `index.html`; it plays only while the intro is on screen (`introPlay()` in `app.js`). Both are in `ASSETS` (`bg.jpg` 3, `bg.mp4` 1). `sw.js` now answers a `Range` request from the cached copy with a 206 slice (iPhone Safari always asks for video in slices; without this a cached video does not play) and only stores a full 200. Tested in the browser (plays, pauses on enter). iPhone test pending.

- `.101` DAY OFF (Siza): a new built-in exercise `lib-fz-day-off` "Day Off" in a new library group "Rest" (library = 83), file name `day-off` (put `day-off.mp4` / `.jpg` in `assets/exercises/` like any other clip). On a day, its target line reads "Rest and enjoy it" (`targetText()` in `gym.js`); a day with only Day Off is titled "Rest". 
- `.102` (replaced by `.104`) Day Off first opened a full-screen viewer; `PhotoSlot.view` was removed again.
- `.103` a day whose only content is Day Off is a REST day, not a workout (`onlyDayOff(w)` in `gym.js`): the Gym week row says "Day off · Rest and enjoy it" (no "1 exercise"), the day page says "Day off" and has no START WORKOUT, it is not in `plannedOn()` (so THIS WEEK, streak, SKIP TODAY and "missed" ignore it) and Home's TRAINING tile says "Day off". Day Off mixed with real exercises is just an exercise (title unchanged). iPhone test pending.

- `.104` a day with only Day Off shows the picture / clip ON THE DAY PAGE itself, vertical 9:16 under the ADD EXERCISE button (`.dayoff` / `.dayoffm` / `.dayoff-del` in `styles.css`, `renderDay()` in `gym.js`): his own photo first, else `assets/exercises/day-off.*`, else a black block with a lime "DAY OFF" (`DAYOFF_PH`, `.pviewer-ph`). No exercise card, nothing to open, no sets; a small bin in the corner takes Day Off away; swipe right = back (it is a normal sub-page). iPhone test pending.
- `.105` EXERCISE CLIPS IN BODY-PART FOLDERS + RANDOM DAY OFF (Siza, planner chat; `media.js`): the clips now sit in `assets/exercises/<chest|back|shoulders|legs|glutes|arms|core|cardio|flexibility|rest>/` (the muscle group of each exercise in `library.js`, lower case; each folder has an empty `.gitkeep` so it exists on GitHub). `RepoFolder` got `deep:true` for exercises: ONE ask to GitHub's tree API (`git/trees/main?recursive=1`) lists the folder and all subfolders (the recipes folder stays on the flat listing, which is also the fallback); each file keeps its `path`, downloaded from `assets/exercises/<path>`. A clip is matched by its FILE NAME (case-insensitive), wherever it sits, so a clip in the wrong folder or loose in `assets/exercises/` still works; the keys on the phones are unchanged, so nothing is downloaded again. The 12 existing clips were moved with `git mv` (names made lower case). DAY OFF may have several clips: `day-off`, `day-off-2`, `day-off-3`, … in `rest/`; `ExMedia.dayOff()` picks one at random each time the app is opened, never the one of the last opening (`localStorage` `risen.dayoff`, try/catch), and keeps it for that opening; his own photo on the day still wins. Tested with a mocked tree (picks vary, offline works, no flat call). iPhone test pending.

- `.106` SEVERAL INTRO CLIPS, SHUFFLED (Siza; `media.js` `IntroMedia`, `index.html`, `sw.js`): extra intro videos go in the repo folder `assets/intro/` (any name, `.mp4` / `.mov`, over 8 MB skipped; `assets/intro/README.md`); they reach the phones by themselves like the exercise clips (`RepoFolder`, cache `risen.intro`, `sw.js` lets `assets/intro/` pass), no release. Each time the app is opened ONE is picked at random from the downloaded clips PLUS the built-in `assets/bg.mp4`, never the one of the last opening (`localStorage` `risen.intro`), and it plays for that whole opening. The intro `<video>` has no `src` in `index.html` any more: `IntroMedia.start()` sets it at once (the poster `bg.jpg` shows for that instant; it is kept only when bg.mp4 itself is chosen). Nothing downloaded yet, offline or any failure = bg.mp4. A pull-down refresh also asks about this folder (`RepoNow`). Tested with a mocked folder (random, never twice in a row, plays, offline OK). iPhone test pending.

- `.107` TWO HOMES (Siza; `me.html`, `make-me.sh`, `manifest-me.json`, `app.js`, `sw.js`): the app has ONE code base and two entry pages. `index.html` = the friends' Home (https://wrabaa.github.io/risen/), `me.html` = Siza's own Home (https://wrabaa.github.io/risen/me.html). Everything inside (Gym, Meals, Supps, Classes, clips, recipes, intro) is the same code and the same content; only the Home tiles can differ.
  **me.html is GENERATED: after ANY change to `index.html` run `./make-me.sh` (it copies index.html and changes only the manifest link and adds `window.RISEN_HOME='me'`), and commit both.** Never edit me.html by hand. `manifest-me.json` = the same manifest with `start_url` / `id` = `me.html`, so the icon added from his link opens his Home. Both pages and the manifest are in `CORE` in `sw.js`; the offline safety net opens `me.html` for a `me.html` request. In `app.js` a Home tile with `only:'me'` shows only on me.html (`HOME_VARIANT`, `shown()`); the numbers close up as with `show()`. Step 1 only: the two Homes are IDENTICAL for now; his extra cards come one at a time, as he sends them. Tested: both pages load with the same tiles, the right manifest, me.html works offline. Install only the me.html link as the app on his phone (an installed app and a Safari tab keep separate data on iPhone). iPhone test pending.


- `.108` PRAYER card on Siza's Home only (`prayer.js` = `Prayer`, tile `{title:'Prayer', only:'me'}` right under 01 TRAINING in `app.js`, `#prayerSheet` in `index.html`, `.prayer` / `.pcol` / `.prrow` in `styles.css`; `prayer.js` is in `CORE`). Calculated offline on the phone (Muslim World League: Fajr 18°, Isha 17°, Asr standard), place Baabda by default (or "Use my location"), the phone's own time zone / summer time. Card: next prayer big (Sunrise is shown but never counted to; after Isha it counts to tomorrow's Fajr), "2 h 33 min to go", the six times in a row, the Islamic date (changes at Maghrib; ±1 day adjuster because Lebanon often sights the moon). Gear sheet: − / + per time = ONE minute per tap (hold repeats, ±120), auto-saved with "✓ Saved" (settings `prayerOffsets`, `prayerHijri`, `prayerLat` / `prayerLon`). No sound / notifications (waits for the native app). Friends' index.html shows no prayer card (sheet markup is there but unused); tile numbers shift only on me.html. Tested at 390 and 375 width. iPhone test pending.
- `.109` PRAYER card look: the right side now mirrors the left: "TO GO" (30 px, grey) on top, the minutes left under it big (44 px) in red (new named colour `--clock-red`, only for this number). Fits on SE width. iPhone test pending.
- `.110` PRAYER card: the countdown is written as hours:minutes ("2:29", no h / min) in red, "TO GO" above it is lime. iPhone test pending.
- `.111` PRAYER settings sheet fix (Siza could not reach DONE: the sheet started 14% down and ran off the bottom): it now starts near the top, never taller than the screen, scrolls inside itself, has a lime DONE at its top right (plus the one at the bottom), and a tap on the dark area closes it. iPhone test pending.
- `.112` MUSIC card on Siza's Home only (`music.js` = `Music`, tile `{title:'Music', only:'me'}` right under PRAYER, `#musicSheet` + hidden `#musicFile` in `index.html`; `music.js` is in `CORE`). His own songs (made in Suno): the gear / "+ ADD SONGS" opens the Files picker (audio files up to 30 MB, several at once); songs live ONLY on the phone in two new stores (DB 9): `songs` (list: id, name, size, added) and `songdata` ({id, blob}, read only when a song plays). **Both are deliberately NOT in Export / Import (heavy; a restore keeps the songs) but ARE cleared by Reset all data** (`EXTRA` in `db.js`). Card: song name (lime while playing), "N songs · Shuffle on/off", shuffle / back / big PLAY-PAUSE / next, thin progress bar with times; the play button is plain (the glow stays on TRAINING's ▶). Shuffle is the setting `musicShuffle` (default on); a finished song goes to the next; the lock-screen card uses the Media Session API. The card redraws only on player changes and its bar moves without a redraw (`redrawMusic()`). Delete = bin in the sheet (asks first). Friends' Home has none (the sheet markup is there, unused). Open question for the iPhone: does the music keep playing with the screen locked / app in the background. Tested in the browser at 390 and 375 wide (add, play, next, pause, shuffle, reload keeps songs, delete). iPhone test pending.
- `.113` the MUSIC card now shows on BOTH Homes (friends' index.html too; Siza tested `.112` on his iPhone, works). Songs stay on each phone. PRAYER stays Siza's only.
- `.114` MINIMIZE A HOME CARD (Siza, both Homes): a small chevron right after every card's title (`.tchev`, `toggleTile()` / `collapsed()` in `app.js`). Tap = the card shrinks to its title line (51 px, chevron turns to point right), tap again (the chevron, or anywhere on the small card; it never presses the card's buttons, so a tap cannot add a glass of water) = full size. Remembered per phone in the setting `homeCollapsed` (list of card titles; the numbers on the cards stay). A minimized card does not draw its body (the minute tick skips nothing: `tileSaid` is set for it too). Tested at 375 wide (collapse, expand, reload keeps it, no water added). iPhone test pending.
- `.115` EXERCISE STILLS (Siza; `media.js` `ExMedia`, `gym.js` `loadThumbs()`): small pictures in `assets/exercises/still/<exercise file name>.jpg` (640 px, ~60 KB; made from the pictures his clips are animated from; `still/README.md`; no release needed to add one). The gym DAY list shows the still of each exercise instead of playing the clip (the 6-8 playing clips made Monday slow to open and slow again every time he came back from an exercise); order for a row: his own photo / clip, then the built-in still, then the built-in clip, then the bar icon. The exercise page and the workout log still play the clip. If an exercise has a still but no clip, the exercise page shows the still. Stills are listed by the same one tree call (`still/` rows are keyed `still/<name>`, never taken for the exercise's own picture; images only, ≤ 2 MB, must be a known exercise name or day-off*). 18 stills pushed (chest-press, incline-chest-press, pectoral, assisted-dip, cable-crossover, barbell-incline-bench, decline-bench-press, low-row, pulley, shoulder-press, delts-machine, leg-press, leg-extension, cable-pushdown, cable-overhead-extension, day-off, day-off-2, day-off-3). Day Off stills are not used yet. Note: his clip `shoulders/lateral-raise.mp4` belongs to the DUMBBELL lateral raise in the library, but the still he made for the MACHINE is saved as `delts-machine`; to be sorted out with Siza. Tested with a mocked tree (stills found, clips unchanged, no still = nothing). iPhone test pending.
- `.116` a MINIMIZED MUSIC card keeps three small buttons on its title line (back · play/pause · next; `.mmini` in `styles.css`, drawn by the minimized branch of `tileHtml()` in `app.js`), so he can control the music without opening the card; they work like the big ones (the music buttons are checked BEFORE the "tap a minimized card = open it" rule). Both Homes. iPhone test pending.

- `.117` PEEK on minimized Home cards (Siza; `peekOf()` in `app.js`, `.tpeek` in `styles.css`; both Homes): a minimized card shows ONE short line at the right of its title, same Oswald 16 px / lime on every card, never wraps (cut with …): Training = today's day groups (max 3, "Rest", "Done ✓", "In progress"), Prayer = "TO GO 2:29" in red, Supplements = the next one's name (or "All done ✓"), Water = "N to go" (or "Done ✓"), Coffee = month total "$84.50", Classes = the next class name, Music keeps its 3 buttons; Try today / This week / Streak / Week summary show nothing. All minimized cards are 52 px high. FIX: on the Coffee card the chevron sat under the − button (could not be tapped): slimmer title gap and a 26 px chevron there. iPhone test pending.

- `.118` the red Prayer countdown on a minimized card is bigger and bolder (22 px, bold; its TO GO 13 px). iPhone test pending.

- `.119` review 8 fixes (Fable's review of `.108`–`.118`, planner chat): Reset all data now also stops the music and empties the Music card (`Music.reset()`), and its warning says songs are deleted too and are not in a backup; two quick taps on Next/Back start only the last song (`startSeq` in `music.js`); a prayer minute change still waiting for its 0.35 s save is saved at once when the sheet closes or the app is hidden (`flushPrayer()`); a song that fails to save says "could not be saved (is the phone storage full?)" instead of the audio-file message; `.tpeek.red` uses only the named colour. NOT changed (to watch on the iPhone): first Play / next song after one ends wait for the database before `audio.play()` (Fable: iPhone might refuse sound with the screen locked; music works on his phone so far). iPhone test pending.

- `.120` MUSIC keeps going on a LOCKED screen (Siza confirmed on his iPhone: when a song ended on the lock screen the next did not start): while a song plays, the NEXT one is already read from the database (`prefetch()` / `pre` in `music.js`); when a song ends or Next is pressed, `playUrl()` sets the source and calls `play()` at once with no waiting, which is what iPhone needs. The prepared song is dropped when the order changes (shuffle, delete, reset). Tested in the browser (Next changes song in the same tick). iPhone test pending.

- `.121` DAY OFF page plays and shuffles again (Siza: the pictures were stuck and never changed): since `.115` the day page asked for the exercise's STILL first, and `still/day-off.jpg` exists, so it always showed that one still. `ExMedia.still()` now answers nothing for Day Off, so the page gets `dayOff()`: one of the `day-off`, `day-off-2`, … clips at random per opening (`media.js`). iPhone test pending.

- `.122` the Day Off clip (and any list picture) no longer RESTARTS while the phone downloads new content (Siza: picture, video, picture, then stuck; reproduced with slowed downloads): every finished download used to redraw every built-in row, so a playing clip began again at each of ~20 files. `ExMedia.sigOf(id)` (`media.js`) says which picture / clip a row shows; `ExMedia.onChange` in `gym.js` leaves a row alone when that did not change (`thumbSig`). Day Off diving clip is `rest/day-off-4.mp4` (4 clips shuffle). iPhone test pending.

- `.123` SMOOTHNESS (Siza): (1) the intro `<video>` has `src="assets/bg.mp4"` right in `index.html`, so it starts at first paint; `IntroMedia.start()` (`media.js`) changes the src ONLY when an extra clip from `assets/intro/` is picked (bg = nothing touched; poster kept). (2) Exercise photo slots (`PhotoSlot.mount(..., {video:true})`: exercise page, workout log) have a FIXED box (`.pslot-img.fix`: 4:3, same max heights 340 / 260 / 200, `object-fit: cover`), so nothing grows or jumps. A built-in clip is drawn OVER the built-in still (`still:` option = `ExMedia.still`, `gym.js`): the still shows at once, the clip (`video.clip`) fades in when it really plays; Low Power Mode keeps the still. His own photo / clip still wins. Recipe and profile slots unchanged. iPhone test pending.

- `.124` USERS, Release 1 of the Coach & Students plan (Siza, planner chat; `coach.js` = `Coach`, store `students` (DB 10) in Export / Import / Reset, plan in the project doc `claude/RISEN-COACH-PLAN.md`): on **me.html only** (`window.RISEN_HOME==='me'`; a later release also turns it on for the public app's "Instructor" choice) Settings has a **Users** group: one row per user ("3 exercises · 1 supplement") and **+ New user** (name sheet). A user opens its own pages: EXERCISES (Mon-Sun chips with a dot on days that have exercises, + ADD EXERCISE through the normal exercise picker `Gym.openLibrary`, sets / kg / reps or min / speed / incline inline, up / down / delete) and SUPPLEMENTS (same fields as the owner's supplement editor, no box photo yet), plus RENAME (Delete user moved to the list in `.125`). EVERY user page shows a lime bar "Editing: Name  MY ACCOUNT" (one tap closes all user pages back to Settings). THE RULE: a user is ONE record `{id, name, created, days:{1..7:[entries]}, supps:[…]}` and `coach.js` never reads or writes the owner's own routines / workouts / meds / logs / photos, so an owner's workout can never land in a user (tested: owner data byte-identical before / after). No logging for users. Needed a fix: Settings (z 10) sits ABOVE `#app`, so while a user page is open `body.usersopen #app{z-index:11}` (removed 340 ms after the last page closes). Customs the coach makes in the picker are the coach's own exercises: Release 2 (Send) must carry any custom exercise a user's program uses (and decide about photos / sizes). Not built yet: Send to user (Release 2), Load coach file and the Instructor / User choice on the public app (Release 3), copy program between users. Tested at 390 and 375 wide on me.html (create, add, clamp sets 25 to 20, cardio fields, days, supplement with times / days, MY ACCOUNT, reload keeps all, rename, export holds `students`, delete) and index.html (no Users group). iPhone test pending.

- `.125` DELETE A USER by swiping (Siza): in Settings > Users a user's row swipes LEFT to show a red bin (80 px, colour `--danger`, `.udel`); tap the bin = confirm sheet "Delete user?" then it is gone (cancel closes the row). A short swipe snaps back, swiping another row or tapping an open row only closes it, swiping right closes it; only one row is open at a time. The list has `data-hswipe`, so the Settings swipe-back only starts from the left edge there. The "Delete user" button on the user's own page is REMOVED (it is the only way now). iPhone test pending.

- `.126` RECIPES LOAD EVEN WHEN GITHUB'S LIST SERVICE FAILS (Siza's me.html showed no Try today and no recipe question): `RepoFolder` has a `fallback` option; if GitHub's API answers an error (rate limit 403, blocked network) the RecipePack reads `assets/recipes/recipes.json` straight from the app's own site and checks each picture (`<id>.jpg|png|webp`) with a HEAD request; those files carry a stand-in `p<size>` sha that `same()` accepts. The normal path is unchanged. Tested with the API mocked as 403 on me.html and index.html (31 recipes, Try today appears) and with the normal listing. iPhone test pending.

- `.127` ROLE QUESTION (Siza; public `index.html` only, never `me.html`): the first time the app is entered with no role set (and it is installed, not a Safari tab), a floating glass card over a blurred Home asks "WHO ARE YOU?": STUDENT (the normal app) or INSTRUCTOR (adds the Users group in Settings, `coach.js` `on()` now also true for role 'instructor'). Setting `role` ('student' / 'instructor'); a Settings row "I am" (`#roleGroup`, hidden on me.html) reopens the question; switching back to Student only hides Users, the data stays. The weekly backup question waits until a role is chosen. Not built yet: Send to user and Load coach file (Releases 2 and 3). iPhone test pending.

- `.128` safety for `.126`: a list that came from the FALLBACK never deletes files already on the phone (`fromFallback` in `RepoFolder.sync()`, `media.js`); Settings → Data → RISEN recipes shows "Loaded" / "Not loaded" (`paintPack()` in `app.js`). Tested: recipes loaded, then GitHub's list refused: all 33 cached files and Try today stay. iPhone test pending.

- `.129` RECIPES ROW TELLS WHY (Siza's me.html cannot load the recipes): tapping Settings → Data → RISEN recipes when nothing is loaded now asks GitHub and the app's own site at once (`RecipePack.sync(true)`), and if there is still no list it shows a "Recipes not found" sheet with what the phone could reach (`RecipePack.diag()`: "GitHub list: 403 · Recipe file: 200 · Online: yes"). Tested: normal (question appears), site file blocked (sheet with codes). Version is `.25` (`.24` = `.128`). iPhone test pending.

- `.130` SEND (Coach Release 2, Siza said go and yes to custom exercises; `coach.js` `send()`): on a user's page a lime "SEND TO <NAME>" button builds ONE file `risen-<name>-<date>.json` = `{app:'risen-coach', version:1, coach (the instructor's name from Personal info, else "Your coach"), user, created, days:{1..7:[entries]}, supps:[…with their ids], customs:[{id,name,muscle,notes}] (only the custom exercises the program uses, no photos)}` and opens the phone's share sheet (WhatsApp / AirDrop / Files); a phone that cannot share files downloads it. Nothing to send = "Add an exercise or a supplement first". One-way. The file is NOT yet loadable: Release 3 (Load coach file on the student's phone + the choice screen is already in `.127`). Tested in the browser (download path, content, custom included). iPhone share sheet test pending.

- `.131` WHILE TESTING, the public app asks Student / Instructor at EVERY opening (`ROLE_ASK_EVERY_OPENING = true` in `app.js`; the answer is still saved and the Settings "I am" row still works). To go back to asking only once: set it to `false`. Not on me.html. iPhone test pending.

- `.133` the Settings "I am" row shows ONLY for an instructor (so he can go back to Student); a student sees no such row. (While `ROLE_ASK_EVERY_OPENING` is true the question comes at every opening anyway; when it goes back to once, a student who chose wrongly would need a new row or a reset: decide then.) iPhone test pending.
- `.134` review 8 fixes (`REVIEW.md`): a user's supplement typed just before MY ACCOUNT (or before the app is hidden) is saved (`flushAll()` in `coach.js`); a double tap on CREATE makes ONE user;
  SEND opens the share sheet straight from the tap (nothing awaited first), a second tap while it is open does nothing, a failed share says "Could not open sharing. Try again.", a phone that cannot share files gets a download ("File downloaded");
  a sideways swipe on a user's name no longer scrolls Settings; while a user's pages are open the app layer shows only those pages (tab page, top bar and tab bar hidden, layer see-through), so closing or swiping one back shows Settings, never Home;
  the weekly "Back up now?" question comes right after the Student / Instructor card (it never showed on the public app while the card was asked); the card says "Instructors can change this later in Settings";
  the role card's dim uses `--chip` and the new named colour `--scrim` (no raw codes); a future rename in `library.js` (`aliases`) also moves the exercises in users' programs (`migrateLibrary`, `students`);
  the restore question counts users; a recipe picture already on the phone is never downloaded again just because the list came from the other source (GitHub list ↔ the site's fallback). iPhone test pending.
- `.135` NO MORE JUMPS ON UPDATE: before, a new release reloaded the app on the intro (the welcome clip flickered and started over) or on a quiet Home (thrown back to the
  welcome screen); with many releases a day this happened often. Now an update loads only when you tap to enter (straight onto Home, no second intro) or while the app is in the
  background (`applyUpdate()` / `reloadToHome()` in `app.js`). An EXTRA intro clip (assets/intro/) no longer swaps out the running bg.mp4: it plays on a second video laid over it and
  fades in once it really plays (`.photo.alt` in `styles.css`, `IntroMedia` in `media.js`); the intro play / pause looks at every intro video. iPhone test pending.

- `.136` ARMS SPLIT (Siza): the library group "Arms" is now two groups, **Biceps** (arm-curl, cable-curl, barbell-curl, db-curl, hammer-curl, concentration-curl) and **Triceps** (arm-extension, cable-pushdown, cable-overhead-extension, skull-crusher, close-grip-bench, overhead-db-extension); ids, `file` names and stills unchanged, so plans, history, photos and clips follow. The 12 clips moved from `assets/exercises/arms/` to `biceps/` and `triceps/` (clips match by file name anywhere, so phones keep working with no re-download). A custom exercise that was filed under "Arms" stays in My exercises (its muscle chip is simply unlit; pick Biceps or Triceps). iPhone test pending.

- `.137` Adductor and Abductor moved from the Legs group to Glutes in `library.js` (ids, file names, clips and stills unchanged; their clips already sat in `glutes/`). Library: Glutes 7, Legs 13. iPhone test pending.

- **REMINDER (Siza, 25 Nov):** when ALL the current exercise videos / stills are finished, remind him and ask to ADD MORE FREE-WEIGHT exercises for every body part (Glutes is thinnest, then Triceps, Core, Back; see the count by group). Write the list, he picks, then add with new ids and file names. Do not start before he says.

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
- Glow (`.57`): the lime glow (`--volt-glow`) belongs to the ONE main button on a screen: the ▶ (`.play`) on Home's TRAINING tile (the NOW card that took the glow in `.69` was removed in `.80`), the main `.primary` elsewhere
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
- Big − / + steppers on kg (±2.5) and reps (±1) in the log (`.68`); a ticked set that beats "Last time" gets ▲ PR (stored as `prs` on the finished session, shown as "PR today").
- Reps required to tick a set; empty kg = 0 (bodyweight). No sets ticked → offer discard.
- Rest timer starts automatically on ✓, default from Settings (1:30), ±15 s, flashes lime at 0 and plays a soft "pong" (`.94`).
- One photo per exercise, linked to exercise ID, shown everywhere; addable in the gym too.
- Exercise library = Siza's real gym (62 in `.47`, 82 in `.48`, `EXERCISES.md`), replaced the 66 generic ones through
  `aliases` / `retired` so plans, history and photos followed. Every exercise has `muscle` (library group, day title)
  and `equipment` (Machine/Cable/Dumbbell/Barbell/Bodyweight/Cardio; stored only, filter chips later). Images
  (`assets/exercises/<file>`) come later. T-bar row and Preacher curl stay retired until confirmed at the gym.
  A retired exercise that later gets a match moves to `aliases`; a phone where it was already in "My exercises"
  moves it (plan, history, notes, photo) and drops the stale entry. After a merge a day keeps ONE copy of the same exercise
  (the first); the old check at start-up runs once per library change (fingerprint in settings `libraryFollowed`).

**SUPPS (meds.js)**
- A med counts from the day it's added (earlier days = "not scheduled", not "missed"); every dose still shows in TODAY, but a dose earlier than the moment it was added is not counted as due / overdue on the NOW card (`.72`, `Meds.dueNow()` only).
- Known small flaw (accepted for now): changing a schedule re-judges past days. Exception
  (`.32`): a dose already taken TODAY follows its med to the new time (no double dose).
- Weekly = one weekday. Groups by exact time. Undo is per dose (on purpose, safer).
- No notifications: ON HOLD until the native Apple app (Capacitor). Do not build in the web app.

**CLASSES**
- Gym = Fitness Zone; 3 studios: Energy, Balance, Power. 33 classes, 17 instructors since `.95` (was 37 / 15)
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
- **Both Homes (Siza's rule, `.115`):** from now on EVERYTHING is built for both Homes (friends' `index.html` and Siza's `me.html`) unless Siza says "only for me" (then the tile gets `only:'me'`). Shared code (gym, stills, music, minimize…) already reaches both.
- **Siza + Claude (chat) plan; Claude Code builds; Siza tests on his iPhone.**
- Build ONLY what the message asks. Do not redesign, rename, move or remove anything else.
  If something is unclear, ask before building.
- Small steps. Never a huge change at once.
- Test in the browser at iPhone 13 and SE sizes before pushing; re-run other tabs' tests.
- When done, report: what changed (short list), choices you made, version number,
  how to test on iPhone. No long essays.
- Siza is not a developer: plain words, no jargon in reports.
