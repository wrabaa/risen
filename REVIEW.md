# RISEN — Code reviews

Review-only passes over the commits. No code is changed by a review; findings are listed here and fixed
(or not) on Siza's go. Each review starts from the "last reviewed" commit below.

**Last reviewed: release 2026-11-24.29 (`b3ce669`); its fixes are release `.134` (2026-11-24.30)**

## Review 8 — 24 Nov 2026 — releases `.123` → `.133` (`8e1e338` … `b3ce669`, fixed in `.134`)
Method: read the full diff of the day (leg / glute clips and stills, Users = coach.js + store `students` (DB 10), swipe to delete, recipe fallback list, Student / Instructor card, Send),
then (on Siza's go) fixed everything and ran it in Chrome at iPhone 13 and SE size with synthetic taps and touches. Nothing was run on a real iPhone.

🔴 Fixed
1. **A user's supplement could be lost.** Typing in a user's supplement and tapping MY ACCOUNT within about half a second: the pages closed first, the user was forgotten, the save did nothing. Now everything is saved before the pages close, and also when the app is hidden. (`coach.js`)

🟡 Fixed
2. The weekly "Back up now?" question never showed on the public app (the Student / Instructor card took its place at every opening). It now follows the card. (`app.js`)
3. A future rename / merge in `library.js` moved the owner's program and history but not the users' programs (they would show "Unknown exercise"). `migrateLibrary` now follows `students` too. (`db.js`)
4. SEND: the share sheet was opened after a wait (iPhone may then refuse it), a refused share fell back to a download that may do nothing in the home-screen app but said "File saved", and a double tap made a second file. Now: straight from the tap, one at a time, an honest message. (`coach.js`)
5. The role card promised "You can change this later in Settings", but since `.133` a student has no such row. Text now: "Instructors can change this later in Settings". (Open: once the question is asked only once again, a student who wants to become an instructor has no way back except Reset; Siza to decide.)

🟢 Fixed (small)
6. Double tap on CREATE made two users with the same name. 7. Closing a user's page showed the Home / tab page for a moment instead of Settings. 8. Raw colour codes in the role card (now `--chip` / `--scrim`).
9. A sideways swipe on a user's name also scrolled Settings. 10. The restore question did not count users. 11. Recipe pictures were downloaded again whenever the list switched between GitHub and the fallback.

Left as is: a recipe picture replaced by one of EXACTLY the same size is only noticed once GitHub's own list answers again (the fallback list knows sizes only). A deleted custom exercise in a user's program: custom exercises cannot be deleted in the app, so this cannot happen today.

🟢 Checked and fine
- 13 leg / glute clips + 13 stills: every name matches an exercise `file` in `library.js`, all under the size limits. DB 10 only adds `students`; it is in Export / Import / Reset.
- `coach.js` never reads or writes the owner's program, workouts, supplements, logs or photos (only adds to the shared exercise menu via + Custom exercise). Students never see Users; me.html never asks the role.
- Recipe fallback never deletes stored files; offline it does nothing. `coach.js` is in CORE; every release raised VERSION; me.html matched make-me.sh after every index.html change.


## Review 7 — 16 Nov 2026 — releases `.96` → `.98` (fixed in `.99`)
Method: read the code of `.96` (recipe pack fixes), `.97` (pull down to refresh) and `.98` (TRY TODAY card), then ran it in Chrome at iPhone 13 and SE size with a
pretend GitHub and synthetic touches. This time the fixes were made in the same pass (Siza asked). Nothing was run on a real iPhone.

🔴 Fixed
1. **A replaced picture or recipe text could stay OLD on a phone for good.** GitHub lists a changed file at once; the site hands it out a minute or two later. A phone
   that looked in between (easy since pull down exists) stored the OLD file under the NEW mark and never looked again. Now each downloaded file is checked against
   GitHub's mark; a file that is still the old one is asked for again in 2 minutes. Phones already stuck check what they hold once and heal by themselves. (`media.js`)

🟡 Fixed
2. A replaced pack picture could leave the TRY TODAY card or a Meals cover on a dead picture: the card's picture is now its own and follows the new one. (`meals.js`, `media.js`)
3. The TRY TODAY picture faded in again at every redraw of Home (each glass of water or coffee). Once only now. (`styles.css`)
4. The card's recipe deleted = no card until the next opening. Now a new one is picked when Home is shown again. (`app.js`)
5. A pull down while a download round was already running said "✓ UPDATED" at once. It now waits for that round. (`media.js`)
6. A RISEN recipe given an own photo, page closed in the same instant: it was not always marked as his. (`meals.js`)
7. Small: the card's object URL is freed; the photo list is swapped in one go; the card's number is readable on the photo.

🟢 Checked and fine
- Pull down: arms at 90 px, UPDATING → ✓ UPDATED, NO INTERNET offline; never on a scrolled page, a sub-page, under a sheet, while typing, in a running workout, on a
  sideways / diagonal / upward move. Tab swipe, swipe back and the Classes chips work as before. Only transform and opacity move; no blur on the chip; no glow on the card.
- TRY TODAY: no card and the numbers close up without recipes; the pick changes at every opening, never twice in a row, the same all through one opening; a tap opens that recipe.
- `.96`: a `recipes.json` without a `recipes` list changes nothing; a failed round is tried again in 2 minutes.

Left as it is (on purpose)
- "✓ UPDATED" also shows when GitHub was reached but refused (it allows 60 asks an hour per network, 2 per pull): nothing is lost, the next ask works. Not worth a new message.
- The dark fades on the TRY TODAY card and the Meals covers use raw `rgba(11,11,11,…)` (same as the covers since `.91`); naming them is for the design pass.
- On a real iPhone the page may bounce a little under the finger while pulling: cannot be seen in Chrome; to judge on the phone.
- The same "old file under a new mark" can no longer happen for exercise clips either (same engine); the Gym screens pick up a healed clip the next time they are drawn.


## Status of review 6
Fixed in `.96`: 🟡1 (own photo makes a RISEN recipe his), 🟡2 (wrong-shaped `recipes.json` changes nothing), 🟡3 (2-minute wait after a failed round). 🟡4 and 🟡5 stay rules of use.

## Review 6 — 16 Nov 2026 — commits `.87` → `.95` (`df90293` … `a21c4d3`)
Method: read the code diff since `.86` (`1dd0fdf`) and compared the old and new class schedule by id; `.92`–`.95` were used by Siza on his iPhone at the gym, the recipe pack has not run on a phone yet (it is empty). No code changed.

🔴 Must fix
- None found. No new store, no DB change. `media.js` is in `CORE`; the two repo folders bypass the service worker and keep their own caches (`risen.exmedia`, `risen.recipes`), which a release does not delete. New schedule (v3): no class id reused or changed, 10 retired, 6 new, every instructor id exists.

🟡 Should fix
1. **A photo added to a RISEN recipe does not make it "his".** Only a text change sets `edited`. If he only adds his own photo, and the recipe is later taken out of the pack (or "Delete RISEN recipes" is used), the recipe and his photo go together. Fix: adding or deleting a photo on a pack recipe sets `edited` too. (`meals.js` openRecipe → PhotoSlot `onChange`)
2. **A wrong-shaped `recipes.json` empties the phones.** Broken JSON changes nothing (good), but valid JSON with no `recipes` list reads as "the pack is empty": untouched RISEN recipes disappear until the file is fixed (they come back; edited ones and the user's own are never touched). Rule of use: check the file before every push. A cheap guard: ignore a list that is empty while the phone has pack recipes.
3. **A file that keeps failing is asked for at every return to the app.** `idx.checked` is only set when everything downloaded, so one bad file removes the 10-minute wait and GitHub is asked each time the app comes to the front (GitHub allows 60 asks an hour per network). Nothing breaks; the folder just stops updating for the hour. Fix: set `checked` also after a failed round. (`media.js` sync)
4. **Own video clips make the backup heavy.** A clip the user adds himself (up to 8 MB) goes into the backup as text, like the GIFs of review 5. One or two are fine; many could make Export fail. The built-in clips in `assets/exercises/` are outside the backup, so this only matters for own clips.
5. **The new schedule does not arrive by itself.** A phone that already loaded the classes gets v3 only through Settings → Reload gym schedule. Not a bug, a thing to tell friends.

🟢 Fine
- `.87` video clips (silent, looping, 8 MB cap, toast on error) · `.88`/`.89` LIVE tag and side-by-side day buttons · `.90` built-in exercise media (user's own always wins, built-in URL never revoked by the rows) · `.91` recipe pack (asked once, deleted stays deleted, open recipe never overwritten) · `.92` remove set (asks when ticked, one set always stays, plan untouched) · `.93` page put back after the keyboard · `.94` pong (no file, works offline, quiet when coming back late) · `.95` schedule.


## Status of review 5
Fixed in `.87`: 🟡1 (`assets/coffee.png` is in `ASSETS`). 🟡2 stays a rule of use (few, small clips). 🟡3 stays open (iPhone test).

## Review 5 — 16 Nov 2026 — commits `.82` → `.86` (`75b86f2` … `1dd0fdf`)
Method: read the code diff since `.81` (`16b9b21`); nothing was run on an iPhone. No code changed.

🔴 Must fix
- None found. `coffeelogs` (DB 8) only adds a store and is in Export / Import / Reset; animated photos keep their `type` through backup and restore.

🟡 Should fix
1. **`assets/coffee.png` is not in the `ASSETS` list in `sw.js`.** It is only kept after it was seen online, and that copy is thrown away at every release: open the app offline right after an update and the COFFEE card shows the cup icon. Fix: add `'assets/coffee.png': 1` to `ASSETS`.
2. **Many big GIFs make the backup heavy.** Each one may be 5 MB and goes into the backup file as text (a third bigger). A handful is fine; dozens could make Export fail on the phone. Keep own GIFs few and small (the built-in clips are planned as MP4 files, outside the backup).
3. **`.82`–`.86` not yet tested on a real iPhone.**

🟢 Fine
- `.82` minute timer (only changed clock tiles, top bar untouched) · `.83` coffee (price stored with each drink) · `.84` / `.86` photo rows · `.85` animated pictures (5 MB cap, toast instead of `alert()`).

## Status of review 4
Fixed in `.82`: 🟡1 (minute timer: only clock tiles that changed, never the top bar / profile photo), 🟡2 (`--chip`), 🟡3 (date for a class a week away), 🟡4 ("Delete a glass", cardio target never below 0, "✓ Saved" on the water goal sheet). 🟡5 stays open (iPhone test).

## Review 4 — 15 Nov 2026 — commits `.71` → `.81` (`a3b2ad2` … `16b9b21`)
Method: read the code changes since `.70` (`10d0110`); nothing was run on an iPhone. No code changed.

🔴 Must fix
- None found. `waterlogs` (DB 7) is in Export / Import / Reset and only adds a store; cardio entries add fields to the log row without touching strength entries; no new file outside `CORE`; no system `confirm()`.

🟡 Should fix
1. **Home redraws everything every minute (`.80`).** Since the NOW card went, the minute timer calls the full `renderHome()`: all tiles are rebuilt and the profile photo is re-read from the database and swapped (a possible flicker every minute; a tap that lands exactly on the redraw can be lost). Fix: redraw only what depends on the time (Supplements, Classes, and the day change), and load the profile photo once, not on every redraw. (`app.js`, `profile.js`)
2. **One raw colour code.** The NEXT UP chips use `rgba(11,11,11,.55)` written out (rule: named colours only). Give it a name on `:root`. (`styles.css`)
3. **"Sat" can mean today.** When the only next class is a week away on today's weekday, the Classes tile says "Sat · SPINNING · 17:00" on a Saturday, which reads like today. Say "Next Sat". (`app.js` / `classes.js`)
4. **Small wording / input points.** The water − is labelled "Remove a glass" (rule: "delete", screen-reader text only); a cardio target accepts a negative number typed by hand (it is hidden, not refused); the water goal sheet saves without the "✓ Saved" flash the other editors show.
5. **`.71`–`.81` not yet tested on a real iPhone** (water, cardio row, NEXT UP, Home order, glasses row).

🟢 Fine
- `.71` flush on hide, blocked-upgrade messages · `.72` doses shown again (rule only where a dose is called due) · `.73`/`.75`/`.77` NEXT UP + TIME TO TAKE (one `isDue()` rule, minute redraw skipped under a sheet / editor) · `.74` water (midnight reset, goal in settings) ·
  `.76` cardio (one-row draft entry, minutes needed to tick, no PR, no rest timer) · `.78`/`.79` Home tiles (7-day look-ahead, shared picture layout) · `.80` order · `.81` glasses row.
- CLAUDE.md rules: status bar untouched, fixed IDs unchanged, only transform / opacity animate, one glowing main button per screen.

## Status of review 3
Fixed in `.71`: 🟡1 (Personal info saves on `pagehide` / hidden), 🟡2 (a dose before the med was added is not due), 🟡3 (`onblocked` / `onversionchange`: plain messages). `.72`: 🟡2 was too wide (it hid the doses from TODAY); it now applies only to the NOW card.

## Review 3 — 14 Nov 2026 — commits `.60` → `.70` (`ae3aab3` … `10d0110`)
Method: read every code diff since `.59` (`e754172`); nothing was run on an iPhone. No code changed.

🔴 Must fix
- None found. The new `body` store is in Export / Import / Reset (all-or-nothing import still holds, checked), DB upgrade 5→6 only adds a store, `profile.js` is in `CORE`, the deleted `bg-fg.png` leaves the image cache by itself.

🟡 Should fix
1. **Measurements typed just before leaving the app can be lost.** Personal info saves 0.45 s after the last key; every other editor also saves on `pagehide`, this one does not (`Profile.flush()` runs only when the page is closed with "<"). Fix: also call it on `pagehide` / when the app goes to the background. (`profile.js`, `app.js`)
2. **NOW card nags about a dose that was never due.** A supplement added today with an earlier time (added 15:00, time 08:00) counts as "due / overdue" at once (same as the Supps tab and Home tile since the beginning). Fix: a dose earlier than the moment the med was created does not count today. (`meds.js` dueOn / dosesOn)
3. **Two RISEN windows open at the same time can block the DB upgrade** ("Database blocked"); old behaviour, now more visible because `.61` upgrades the DB. Only if the app is open twice (rare on iPhone). (`db.js`)

🟢 Fine
- `.60` typing state re-checked on every focus change / tap / redraw · `.61` profile page (photo key `profile`, dated values, same-day correction, history) · `.62` tab swipe (not on inputs, sheets, sub-pages, sideways-scrolling rows; off in a running workout `.63`) · `.63`–`.67` intro (letters and cut-out fully removed, tap anywhere + hidden real button) · `.66` shared top bar · `.68` steppers (a scroll starting on a button never steps; hold repeats; typing intact) and PR (`prs` on the session, in backups) · `.69` NOW card (six cases, minute refresh, button is the one glow) · `.70` wording.
- CLAUDE.md rules: no system `confirm()`, no raw colour codes added, status bar untouched, fixed IDs unchanged, only transform / opacity animate.

## Status of review 2
Fixed in `.60`: 🟡1 (tab bar / swipe back always return: the typing state is re-checked on every focus change, tap and redraw),
🟡3 ("Nothing added yet"). 🟡2 (deliberate double of a merged exercise) is ACCEPTED as it is: rare, no history lost. 🟡4 stays open
(iPhone test).

## Review 2 — 14 Nov 2026 — commits `.50` → `.59` (`fd888c5` … `e754172`)
Method: read every code diff since `.49` (`1e03b39`); nothing was run on an iPhone. No code changed.

🔴 Must fix
- None found. No data-loss risk, no broken offline/update path (no new file outside `CORE`; `bg.jpg` number raised).

🟡 Should fix
1. **Tab bar can stay hidden.** The bar hides while a field is focused (`body.typing`) and returns on "focus lost". If the screen
   is redrawn while the field is still focused (iPhone: tapping a button does not leave the field), "focus lost" may never
   arrive: the bar stays hidden and swipe-back stays off until a field is tapped and left again. Fix: also clear `typing`
   when the focused field is gone (check on redraw / tab change / a short timer). To confirm on iPhone. (`app.js`)
2. **A deliberate double can be collapsed.** After `.50`, a day where the user put a MERGED exercise twice on purpose (e.g.
   Leg Curl twice) loses the second entry at the next library change or after an import. History is untouched. (`db.js`)
3. **One "No meds yet" left** inside the Supps tab (Home says "Nothing added yet"). Wording only. (`meds.js`)
4. **`.50`–`.59` not yet tested on a real iPhone** (glass, motion, swipe back, chips row).

🟢 Fine
- `.50` review fixes (once-only library check, forced after import, retried after a failure) · `.51` tab bar · `.52`/`.53`
  swipe back (presses the page's own "<", so saves still run) · `.54`–`.57` design steps (transform/opacity only, reduced
  motion respected) · `.58` glass + 30-min classes (same IDs) · `.59` chips on one line.
- CLAUDE.md rules: no system `confirm()`, no raw colour codes added, status bar untouched, fixed IDs unchanged.

## Status of review 1
Fixed in `.50`: 🟡1 (merge duplicates, incl. repairing a day already doubled), 🟡2 (old photo kept in the backup, new one
shown), 🟡3 (check runs once), 🟡4 (running version), 🟡5 (notes), 🟡6 (star label).

## Review 1 — 13 Nov 2026 — commits `.42` → `.49` (`abb272d` … `1e03b39`)
Method: read every diff since `.41` (`ba88bf9`); nothing was run on an iPhone.

🔴 Must fix
- None found. No data-loss risk, no broken offline/update path.

🟡 Should fix
1. **Two "Leg Curl" rows in one day.** `.47` merges Lying + Seated leg curl into Leg Curl; a day that had both now
   lists Leg Curl twice (same for any two old exercises that share one new match). Nothing is lost, it just looks
   doubled. Fix: when a day ends up with the same exercise twice after a merge, keep one. (`db.js` migrateLibrary)
2. **Old photo hidden when both had one.** If an old exercise and its new match both have a photo, the new one wins
   and the old photo stays stored but is never shown again. Rare; nothing deleted. (`db.js` migrateLibrary)
3. **Library check runs in full on every start.** Since `.47` the alias list is never empty, so each launch reads all
   workouts and all history to look for old IDs. Fast today; grows with years of history. Fix: remember "done for
   library version N" in settings and skip. (`gym.js` followLibrary / `db.js`)
4. **Version line can run ahead of the code.** When an update has downloaded but is waiting for a quiet moment
   (`.31` rule), Settings already shows the NEW version while the old screens are still running. (`app.js` showVersion)
5. **Notes are behind.** `CLAUDE.md` still says "better instructor photos pending", "library to be rebuilt" and
   "current crops are low quality"; `UPGRADES.md` "Where we are" stops at `.44`. `.42`–`.49` are marked or left as
   not tested on iPhone.
6. **One "Remove" left.** The star button's spoken label says "Remove from my classes" (rule: "delete", not
   "remove"). Screen-reader text only. (`classes.js`)

🟢 Fine
- `.42` Classes question (×, NOT NOW, tab bar free) · `.43` install pop-up (never in the app; banner fully removed)
  · `.44` Classes timeline, swipe, live timing, stars, instructor page, stats (no new store; star survives edit,
  reload and backup) · `.45` photos (all 14 numbers raised in `ASSETS`) · `.46` offline safety net · `.47`/`.48`
  library (all 66 old IDs accounted for: 51 aliases + 15 retired; no ID reused) · `.49` version line.
- CLAUDE.md rules: no system `confirm()`, colours by name, no new file missing from `CORE`, status bar untouched.
