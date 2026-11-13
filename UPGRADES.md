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
- Safari warning banner (from the Parking lot) — built in `.36`, iPhone test pending.
- G. Gym comfort — built in `.37`, iPhone test pending.
- K. One shared helper file + `index.html` split — built in `.38`, iPhone test pending.
- H + I + J. One confirm sheet, same behaviour in every tab, named colours — built in `.39`,
  iPhone test pending.

**Waiting / on hold**
- C. Plan the calories screen — WAITING: Siza plans it with the planner first.
- D. Med reminders — ON HOLD until the native Apple app (Capacitor). Not to be built in the web app.

**What's left** (in suggested order)
- E. Backup that does not rely on memory
- F. Weekly summary on Home
- L. Clean-up

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

### F. Weekly summary on Home
- **Why:** a sense of progress without bringing back a Progress tab.
- **What:** one tile: workouts done, meds taken, classes attended this week.
- **Size:** small.

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

## Done from the code review (for reference)
- `.28` Safe import (all-or-nothing, old backups keep data, contents shown first).
- `.29` Backup date saved only when the export really completes.
- `.30` Plan edits no longer rewrite the streak and THIS WEEK.
- `.31` Updates wait for a quiet moment instead of reloading mid-use.
- `.32` A dose taken today follows its med when the time is edited.

## Done from this file
- `.33` Upgrade A: fixed IDs for gym classes and library exercises.
- `.34` Upgrade B: images and fonts cached separately from the app.
- `.36` Safari warning banner (was in the Parking lot). In a Safari tab on iPhone/iPad a small
  banner at the top says: "You're in Safari — your data here is separate from the home-screen
  app. Open RISEN from your home screen icon." × hides it for this visit. Never shown in the
  home-screen app, and not on a computer or Android. Why: Siza's meds once looked "missing"
  because they had been entered in Safari, not the app.
- `.37` Upgrade G: gym comfort.
- `.38` Upgrade K: shared helper file, `index.html` split into `styles.css` + `app.js`.
- `.39` Upgrades H + I + J: one confirm sheet, same behaviour in every tab, named colours.

## Done from the `CLAUDE.md` to-do list
- `.35` To-do 1: Settings → "Reload gym schedule". Schedule classes go back to the latest
  `data/gym-classes.json` by their fixed IDs. Kept: attendance history, your notes on a class,
  classes and instructors you added yourself, and a photo you chose for an instructor.
  Instructor photos load from `assets/instructors/`. To change the schedule for everyone:
  edit `data/gym-classes.json` (new class = next free `fz-c..` number), release, then each
  phone taps Reload.

## Parking lot
- (new ideas go here)
