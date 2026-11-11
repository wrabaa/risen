# RISEN — NEVER TOO LATE

Personal health app for iPhone (PWA). Offline, no accounts, no server — all data stays on the phone.

**Section 1: Gym** — in planning.

## Install on iPhone (once live)
1. Open the GitHub Pages link in **Safari**
2. Tap **Share → Add to Home Screen**
3. Open RISEN from the home screen — works offline

## Releasing an update
Every time you change any file, also change `VERSION` at the top of `sw.js` (e.g. `2026-11-11.1` → `2026-11-11.2`).
The phone checks for a new version when the app opens or comes back to the front. It downloads the new files, then reloads.
The version installed on the phone shows as small text at the bottom of the app screen.

## Fonts
Oswald and Inter are stored in `assets/fonts/` (SIL Open Font License), so they work offline from the first launch.
