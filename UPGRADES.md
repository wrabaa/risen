# RISEN — Upgrades (after the main plan)

Ideas to make RISEN better once the app in `CLAUDE.md` is done and in daily use.
This file does NOT replace the to-do list in `CLAUDE.md`; it comes after it.

## How we use this file
- One section at a time, about one a day.
- We discuss the section first. Nothing is built until Siza says go.
- Each section ends with: built? tested on iPhone? release number.
- New ideas go at the bottom under "Parking lot".
- After every section this file is updated: the section gets a status line, and the list below moves on.

## Where we are
**Done**
- Review fixes `.28`–`.32` — tested on iPhone, all OK.
- A. Fixed IDs for gym classes and library exercises — `.33`, tested on iPhone, OK.
- B. Images cached separately from the app — built in `.34`, iPhone test pending.
- `CLAUDE.md` to-do 1, Settings "Reload gym schedule" — built in `.35`, iPhone test pending.
- Safari warning banner (from the Parking lot) — `.36`; REPLACED by the install pop-up in `.43`.
- G. Gym comfort — built in `.37`, iPhone test pending.
- K. One shared helper file + `index.html` split — built in `.38`, iPhone test pending.
- H + I + J. One confirm sheet, same behaviour in every tab, named colours — built in `.39`,
  iPhone test pending.
- L. Clean-up — built in `.40`, iPhone test pending.
- E + F. Weekly backup prompt, piece-by-piece backups, week summary tile — `.41`, tested on
  iPhone, all OK.
- **Queue 3 (Classes and install)** — see the section at the bottom of this file:
  1. Classes first-open question: × / NOT NOW, tab bar visible — built in `.42`, iPhone test pending.
  2. Install pop-up (replaces the Safari banner) — built in `.43`, iPhone test pending.
  3. Classes made alive (a–f) — built in `.44`, iPhone test pending.
- **After queue 3:** `.45` new instructor portraits · `.46` offline safety net (`sw.js`) · `.47` new exercise library (62) ·
  `.48` library 82 + equipment tags, 9 retired exercises now alias to their new match · `.49` Settings version line
  made reliable · `.50` fixes from the first code review (below). `.42`–`.50`: iPhone test pending.

**Waiting / on hold**
- C. Plan the calories screen — WAITING: Siza plans it with the planner first.
- D. Med reminders — ON HOLD until the native Apple app (Capacitor). Not to be built in the web app.

**What's left**
- Nothing open in this file. C waits for planning and D is on hold (see above).

## Do early (cheap now, painful later)

### A. Fixed IDs for gym classes and library exercises
- **Why:** seeded classes get random IDs, and exercise IDs come from the name. "Reload gym
  schedule" cannot keep attendance, and renaming an exercise would detach its history and photo.
- **What:** fixed IDs written in `data/gym-classes.json` and in the exercise list; a "from the gym
  schedule" mark on seeded classes; one-time match of existing classes by name, day and time.
- **Discussed and agreed:** a rebuild never deletes or changes anything in the plan, history or
  photos. An old exercise with a match in the new list is linked to it once; one with no match
  stays as it is under "My exercises".
- **Size:** medium. Do before to-do 1 and to-do 3.
- **Status: DONE in release `2026-11-13.33`. Tested in the browser and on iPhone, OK.**
  - Library: every exercise has a fixed ID written in `library.js` (same IDs as before, so
    nothing changes today). Names can now be changed freely.
  - Library rebuild mechanism is ready: `aliases` (old → new) and `retired` in `library.js`.
    Plan entries, history, notes, photo and a running workout follow automatically.
  - Classes: fixed IDs `fz-c01` … `fz-c37` in `data/gym-classes.json`, and a "from the gym
    schedule" mark on seeded classes that survives editing.
  - One-time match on phones that loaded the schedule earlier: same name + day + time gets the
    fixed ID and keeps its attendance. Renamed, re-timed or hand-added classes are left alone.
  - **Still to do with the real gym list (to-do 3):** fill in `aliases` / `retired`.
  - **Built on top of this:** to-do 1 "Reload gym schedule" (release `.35`).

### B. Images cached separately from the app
- **Why:** every release re-downloads every file, and one failed file blocks the update. With
  ~80 exercise images that becomes several MB per release.
- **What:** keep images in their own long-lived cache; only fetch new or changed ones.
- **Size:** medium. Do before to-do 3.
- **Status: BUILT in release `2026-11-13.34`. Tested in the browser; iPhone test pending.**
  - App files (pages, code, schedule data) are still downloaded fresh on every release.
  - Images and fonts live in their own cache that survives releases. The list is `ASSETS`
    at the top of `sw.js`, one line per file with a number.
  - **Add an image:** new line, number 1. **Replace an image (same name):** raise its number
    by 1. **Remove an image:** delete its line.
  - Safety net: a replaced file whose number was forgotten is still noticed by its size.
  - One image that fails to download no longer blocks an update.
  - First update to `.34` copies the images already on the phone; nothing is downloaded twice.
  - **For to-do 2 (new instructor photos):** replace the files and raise their numbers.
  - **For to-do 3 (exercise images):** add one line per image to `ASSETS`.

### C. Plan the calories screen — WAITING
- **Status:** waiting. Siza plans it with the planner first; nothing to build yet.
- **Why:** ingredients are one free-text box; grams and calories cannot live there.
- **What:** one row per ingredient (food + grams), food list as its own data file.
- **Discuss first:** the screen layout, on paper, before any code.
- **Size:** big. This is the first step of to-do 6.

## Daily-use upgrades

### D. Med reminders — ON HOLD
- **Decision (13 Nov 2026):** on hold until RISEN is a native Apple app (Capacitor).
  Do NOT build it in the web app.
- **Why:** a meds tracker that cannot remind is the biggest gap in daily use.
- **What:** notifications at dose times.
- **Discuss first:** needs either a small server or the native app (Capacitor). Which route?
- **Size:** big.

### E. Backup that does not rely on memory
- **Why:** the only protection is a manual export.
- **What:** a weekly "Back up now" prompt on opening the app (one tap to the share sheet);
  show what is in a backup before importing (done in .28); build big backups piece by piece
  so many photos cannot crash the export.
- **Size:** small (prompt) + medium (big backups).
- **Status: BUILT in release `2026-11-13.41`. Tested in the browser; iPhone test pending.**
  - Weekly prompt: on opening the app (after ENTER), if there is data, the last backup is 7+
    days old or missing, and the question was not shown in the last 7 days, a sheet asks
    "Back up now?" with BACK UP NOW and Later. Not shown during a workout or on first launch.
  - One tap: the file is prepared while the question is on screen, so BACK UP NOW opens the
    share sheet directly.
  - Big backups: the file is built piece by piece (one store, one photo at a time) instead of
    as one giant text. Same content and format; old and new backups both import.
  - Not done: IMPORT still reads the whole file at once. Fine for normal sizes; revisit if a
    backup ever grows past a few hundred MB.

### F. Weekly summary on Home
- **Why:** a sense of progress without bringing back a Progress tab.
- **What:** one tile: workouts done, meds taken, classes attended this week.
- **Size:** small.
- **Status: BUILT in release `2026-11-13.41`. Tested in the browser; iPhone test pending.**
  Home tile 06 WEEK SUMMARY (Mon–Sun): Workouts = every finished workout this week, extra ones
  included · Meds = doses taken / doses due from Monday up to today · Classes = classes attended.

### G. Gym comfort
- Keep the screen awake during a workout.
- Skip the intro and open the workout when one is in progress.
- Sets field: whole numbers 1–20 only; clear message if FINISH cannot save.
- **Size:** small each.
- **Status: BUILT in release `2026-11-13.37`. Tested in the browser; iPhone test pending.**
  The screen stays awake while a workout runs (given back when the app is in the background).
  A workout in progress skips the intro and opens directly. Sets are whole numbers 1–20
  (25 → 20, 0 → 1, 2.5 → 3). If FINISH cannot save, a message says so and the workout stays open.

## Look and consistency

### H. One confirm sheet for the whole app
- **Why:** most deletes use the grey iOS box; Reset and Skip use RISEN sheets.
- **What:** one shared RISEN sheet for every "are you sure?", with an "Export first" button on Import.
- **Size:** medium.
- **Status: BUILT in release `2026-11-13.39`. Tested in the browser; iPhone test pending.**
  All 19 system confirm boxes are replaced by one RISEN sheet (`ask()` in `shared.js`):
  red outline button for anything that deletes, lime for the rest. Import shows EXPORT FIRST,
  REPLACE EVERYTHING and Cancel; EXPORT FIRST saves the phone's data and asks again.

### I. Same behaviour in every tab
- Settings name shows "✓ Saved".
- Meds tile on Home opens Meds on tap, like Training and Classes.
- Add buttons in the same place in every tab.
- One word for each thing: program / plan, workout / session, delete / remove.
- Unnamed recipe, med or class: save as "Untitled" or ask, instead of discarding.
- **Size:** small each.
- **Status: BUILT in release `2026-11-13.39`. Tested in the browser; iPhone test pending.**
  - Settings shows "✓ Saved" (top right) for the name and the rest timer.
  - The Meds tile on Home opens Meds.
  - Meds: "+ ADD MED" is a lime button at the top of "My meds" (it used to be a dashed button
    at the bottom). The ring and today's doses stay first on the screen.
  - Words: "program" (not plan/routine), "workout" (not session), "delete" (not remove).
  - A new recipe, med, class or instructor with something filled in but no name is saved as
    "Untitled …". One left completely untouched is still discarded. An existing item whose
    name is cleared keeps its last saved version, as before.

### J. Brand colours written down
- **What:** name the danger red and the extra greys once at the top of the styles and add them
  to the Brand section of `CLAUDE.md`.
- **Size:** small.
- **Status: BUILT in release `2026-11-13.39`. No visible change.** Eleven supporting colours
  are named on `:root` in `styles.css` and listed in `CLAUDE.md`; no raw colour codes are left
  in the styles except pure black/white in the photo viewer.

## Under the hood (no visible change)

### K. One shared helper file
- **Why:** delayed save, page open/close, "✓ Saved", photo thumbnails, day names and icons are
  copied in four or five files.
- **What:** one small shared file; split `index.html` into styles and app code.
- **Size:** medium. Makes every later change quicker and safer.
- **Status: BUILT in release `2026-11-13.38`. No visible change. All-tabs test passed in the
  browser; iPhone test pending.**
  - `index.html` is now only the page markup; styles are in `styles.css`, the app shell
    (Home, tabs, Settings, backup, updates) in `app.js`.
  - `shared.js` holds what every tab uses: `$`, `esc`, day names, shared icons, the auto-save
    helper (`debounce`), sub-page open/close (`Pages`) and the "✓ Saved" flash (`savedFlash`).
  - Not unified yet: each tab still has its own small photo-thumbnail cache.

### L. Clean-up
- Remove unused `assets/bg-gym.jpg`, old comments and unused code; bring `README.md` up to date.
- If storage cannot open, show a clear full-screen message instead of an empty app.
- Home refreshes every time the app comes back to the front.
- **Size:** small.
- **Status: BUILT in release `2026-11-13.40`. Tested in the browser; iPhone test pending.**
  - Removed: unused `assets/bg-gym.jpg` (186 KB), unused styles, a dead tap handler, an unused
    database function and an old comment. `README.md` rewritten to match the app today.
  - If the phone's storage cannot be opened, a full-screen message says the data has not been
    deleted and offers TRY AGAIN; the app no longer opens looking empty.
  - Home redraws every time the app comes back to the front (date, doses, next class).

## Done from the code review (for reference)
- `.28` Safe import (all-or-nothing, old backups keep data, contents shown first).
- `.29` Backup date saved only when the export really completes.
- `.30` Plan edits no longer rewrite the streak and THIS WEEK.
- `.31` Updates wait for a quiet moment instead of reloading mid-use.
- `.32` A dose taken today follows its med when the time is edited.

## Done from this file
- `.33` Upgrade A: fixed IDs for gym classes and library exercises.
- `.46` Offline safety net: `sw.js` serves the cached `index.html` when a page request has no cached copy and
  the network fails. Tested offline: `/`, `/index.html?x=1`, `/#gym` and an uncached path all open the app.
- `.34` Upgrade B: images and fonts cached separately from the app.
- `.36` Safari warning banner (was in the Parking lot). In a Safari tab on iPhone/iPad a small
  banner at the top says: "You're in Safari — your data here is separate from the home-screen
  app. Open RISEN from your home screen icon." × hides it for this visit. Never shown in the
  home-screen app, and not on a computer or Android. Why: Siza's meds once looked "missing"
  because they had been entered in Safari, not the app. (Replaced by the install pop-up in `.43`.)
- `.37` Upgrade G: gym comfort.
- `.38` Upgrade K: shared helper file, `index.html` split into `styles.css` + `app.js`.
- `.39` Upgrades H + I + J: one confirm sheet, same behaviour in every tab, named colours.
- `.40` Upgrade L: clean-up, storage-failure screen, Home refresh on return.
- `.41` Upgrades E + F: weekly backup prompt, piece-by-piece backups, week summary tile.

## Done from the `CLAUDE.md` to-do list
- `.35` To-do 1: Settings → "Reload gym schedule". Schedule classes go back to the latest
  `data/gym-classes.json` by their fixed IDs. Kept: attendance history, your notes on a class,
  classes and instructors you added yourself, and a photo you chose for an instructor.
  Instructor photos load from `assets/instructors/`. To change the schedule for everyone:
  edit `data/gym-classes.json` (new class = next free `fz-c..` number), release, then each
  phone taps Reload.

## Queue 3 — Classes and install (from 13 Nov 2026, one release per item)
Siza's order. Each item: built? tested on iPhone? release number.
1. **Classes first-open question** — `.42`. The "Load Fitness Zone schedule?" sheet used to cover
   the whole screen, tab bar included, so you could not leave Classes without answering. Now it
   has × and NOT NOW (both = ask again the next time the Classes tab opens), tapping outside it
   is the same, it stops above the tab bar so the tabs stay usable, and it closes by itself if
   you switch tab. YES and START EMPTY work as before (START EMPTY is remembered).
   iPhone test pending.
2. **Install pop-up** — `.43`. Replaces the Safari banner (banner removed). Shown only when RISEN
   is opened in a browser, never in the home-screen app:
   - iPhone / iPad: "Add RISEN to your home screen" with 3 illustrated steps (Share → Add to
     Home Screen → open the icon) and a reminder that the data lives in the app, not in Safari.
   - Android, and Chrome/Edge on a computer: one INSTALL RISEN button that opens the browser's
     own install prompt (only when the browser offers it).
   - Any other browser or computer with no way to install: nothing is shown.
   - × always closes it for this visit (so does tapping outside it); it closes itself once
     RISEN is installed. iPhone test pending.
3. **Classes — make it alive** — `.44` (changes only Classes and its Home tile; no new database
   store, nothing in a backup changes shape). iPhone test pending.
   - **a) Today first.** Opening Classes shows today's timeline: header TODAY + date, filter chips,
     a row of 7 weekday buttons, then the classes by time. Swipe left = next day, right = previous
     day (Sunday wraps to Monday); tap a weekday to jump. A small WEEK button opens the old week
     list (tap a row = that day); TODAY in the week view comes back. Opening the tab always lands
     on today, scrolled so the live or next class is at the top (finished ones sit above, dimmed).
     The old separate day page is gone: the timeline is the day.
   - **b) Live timing** (today only): "Starts in 25 min" (or "7 h 5 min"), a lime LIVE NOW pill and
     lime border while a class runs, finished classes dimmed, and a lime NOW line between them.
     Redraws every minute by itself.
   - **c) ⭐ My classes.** A star on every class card (stored as `star:true` on the class; kept
     when the gym schedule is reloaded, edited or backed up). Starred cards get a lime edge; in the
     week list their times are lime/underlined. New chip ★ MINE next to ALL/ENERGY/BALANCE/POWER.
     Home tile: shows the next STARRED class today first (with a small star); when no starred
     class is left today it falls back to the next class of any kind.
   - **d) Instructor page.** Tap an instructor's photo on a class card: big photo, name, and all
     their classes this week by day (starred ones marked). Tap a row = jump to that day.
   - **e) Studio colours.** Subtle tag colours: Energy amber `--studio-energy`, Balance sage
     `--studio-balance`, Power violet `--studio-power` (named on `:root`). Lime stays the only accent.
   - **f) My stats** at the bottom of the week view: "8 classes this month · favourite: BodyPump ·
     most with: Mjay" (this calendar month, from the attendance log; instructor by first name;
     "No classes attended this month yet" when empty).
   - Choices: + ADD CLASS now sits at the bottom of the day timeline (the timeline is the hero);
     a starred class later today wins the Home tile even while an unstarred one is live.

## After queue 3 (14 Nov 2026)
- `.45` Instructor photos: 14 new studio portraits (Siza); every file's number in `ASSETS` raised.
- `.46` Offline safety net: a page with no cached copy and no network opens the cached `index.html`.
- `.47` / `.48` Exercise library = Siza's real gym (`EXERCISES.md`): 62, then 82 with an `equipment` tag; old exercises
  aliased or retired, nothing lost on a phone.
- `.49` Settings version line asks the running service worker (cache name as fallback).
- `.50` Review fixes (REVIEW.md, review 1):
  1. A day that ends up with the same exercise twice after a merge keeps ONE (the first); history is untouched. Two
     copies the user made on purpose are left alone; a day already doubled by `.47` (Leg Curl) is repaired.
  2. Old and new exercise both had a photo: the new one is shown, the old stays stored under its old id (still in every backup).
  3. The old-ID check at start-up runs once and remembers it (`libraryFollowed` in settings); a changed alias list or an
     import runs it again.
  4. Settings shows the version that is RUNNING (read once at start), not the newest one downloaded.
  5. These notes. 6. Star label "Remove" → "Delete" (screen-reader text).
- `.51` Floating glass tab bar (iOS 26 style pill, icons only, sliding active pill, content scrolls under it, bar steps aside
  while typing); MEDS tab renamed SUPPS (tab, Home tile, week summary; title inside "Supplements & Meds"; data and code
  names unchanged); star label "Unstar". iPhone test pending.

## Parking lot
- (new ideas go here)
