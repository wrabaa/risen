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
- A. Fixed IDs for gym classes and library exercises — built in `.33`, not yet tested on iPhone.

**What's left** (in suggested order)
- B. Images cached separately from the app
- C. Plan the calories screen
- D. Med reminders
- E. Backup that does not rely on memory
- F. Weekly summary on Home
- G. Gym comfort
- H. One confirm sheet for the whole app
- I. Same behaviour in every tab
- J. Brand colours written down
- K. One shared helper file
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
- **Status: BUILT in release `2026-11-13.33`. Tested in the browser; iPhone test pending.**
  - Library: every exercise has a fixed ID written in `library.js` (same IDs as before, so
    nothing changes today). Names can now be changed freely.
  - Library rebuild mechanism is ready: `aliases` (old → new) and `retired` in `library.js`.
    Plan entries, history, notes, photo and a running workout follow automatically.
  - Classes: fixed IDs `fz-c01` … `fz-c37` in `data/gym-classes.json`, and a "from the gym
    schedule" mark on seeded classes that survives editing.
  - One-time match on phones that loaded the schedule earlier: same name + day + time gets the
    fixed ID and keeps its attendance. Renamed, re-timed or hand-added classes are left alone.
  - **Still to do with the real gym list (to-do 3):** fill in `aliases` / `retired`.
  - **Now possible:** to-do 1 "Reload gym schedule" (not built yet).

### B. Images cached separately from the app
- **Why:** every release re-downloads every file, and one failed file blocks the update. With
  ~80 exercise images that becomes several MB per release.
- **What:** keep images in their own long-lived cache; only fetch new or changed ones.
- **Size:** medium. Do before to-do 3.

### C. Plan the calories screen
- **Why:** ingredients are one free-text box; grams and calories cannot live there.
- **What:** one row per ingredient (food + grams), food list as its own data file.
- **Discuss first:** the screen layout, on paper, before any code.
- **Size:** big. This is the first step of to-do 6.

## Daily-use upgrades

### D. Med reminders
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

## Look and consistency

### H. One confirm sheet for the whole app
- **Why:** most deletes use the grey iOS box; Reset and Skip use RISEN sheets.
- **What:** one shared RISEN sheet for every "are you sure?", with an "Export first" button on Import.
- **Size:** medium.

### I. Same behaviour in every tab
- Settings name shows "✓ Saved".
- Meds tile on Home opens Meds on tap, like Training and Classes.
- Add buttons in the same place in every tab.
- One word for each thing: program / plan, workout / session, delete / remove.
- Unnamed recipe, med or class: save as "Untitled" or ask, instead of discarding.
- **Size:** small each.

### J. Brand colours written down
- **What:** name the danger red and the extra greys once at the top of the styles and add them
  to the Brand section of `CLAUDE.md`.
- **Size:** small.

## Under the hood (no visible change)

### K. One shared helper file
- **Why:** delayed save, page open/close, "✓ Saved", photo thumbnails, day names and icons are
  copied in four or five files.
- **What:** one small shared file; split `index.html` into styles and app code.
- **Size:** medium. Makes every later change quicker and safer.

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

## Parking lot
- (new ideas go here)
