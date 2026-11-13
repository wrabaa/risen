# RISEN — NEVER TOO LATE

Personal health app for iPhone (PWA): gym training, meds, gym classes and meals.
Offline, no accounts, no server — all data stays on the phone.

Live: https://wrabaa.github.io/risen/

**Read `CLAUDE.md` first** — it is the project brief (what the app is, the brand, the decisions and the
to-do list). `UPGRADES.md` lists the upgrade ideas and where each one stands.

## Install on iPhone
1. Open the link above in **Safari**
2. Tap **Share → Add to Home Screen**
3. Open RISEN from the home screen icon — it works offline

Always use the home-screen icon. A Safari tab keeps its own, separate data (the app shows a banner there).

## Files
| File | What it holds |
|---|---|
| `index.html` | page markup only |
| `styles.css` | all styles; colours are named on `:root` |
| `shared.js` | helpers every tab uses (`$`, `esc`, `debounce`, `Pages`, `savedFlash`, `ask`, icons) |
| `app.js` | data in memory, Home, tabs, Settings, backup, updates |
| `db.js` | all storage (IndexedDB), backup export/import, one-time data migrations |
| `photo.js` | photo slot (resize to 1000 px JPEG, stored on the phone) |
| `library.js` | built-in exercise list with fixed IDs |
| `gym.js` `meds.js` `classes.js` `meals.js` | one file per tab |
| `data/gym-classes.json` | the gym's class schedule, fixed IDs |
| `sw.js` | offline cache and updates |

## Releasing an update
1. Change `VERSION` at the top of `sw.js` (format `YYYY-MM-DD.N`, the number keeps counting up).
2. A new file must be added to `CORE` in `sw.js`; a new or replaced image to `ASSETS` (replace = raise its number).
3. Push to `main`. GitHub Pages publishes it in about a minute.

The phone checks for a new version when the app opens or comes back to the front, downloads it, and reloads at a
quiet moment (never in the middle of a workout or an editor). The installed version shows at the bottom of Settings.

## Data
All data is stored in IndexedDB on the phone (`db.js`), never on a server. The model is described at the top of `db.js`.
To change the data layout, raise `DB_VERSION` and add an upgrade step. Never delete or rename a store, and add every
new store to Export / Import / Reset. Settings → Export backup saves everything to one file; Import backup restores it.

## Fonts
Oswald and Inter are stored in `assets/fonts/` (SIL Open Font License), so they work offline from the first launch.
