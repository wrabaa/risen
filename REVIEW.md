# RISEN — Code reviews

Review-only passes over the commits. No code is changed by a review; findings are listed here and fixed
(or not) on Siza's go. Each review starts from the "last reviewed" commit below.

**Last reviewed: `e754172` — release 2026-11-14.59**

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
