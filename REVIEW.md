# RISEN — Code reviews

Review-only passes over the commits. No code is changed by a review; findings are listed here and fixed
(or not) on Siza's go. Each review starts from the "last reviewed" commit below.

**Last reviewed: `1e03b39` — release 2026-11-13.49**

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
