# RISEN — Siza's ideas (14 Nov 2026) — NOT BUILT YET

Planning notes only. Each idea is discussed with the planner first, then built as its own small release.

## 1. Profile button replaces the gear ⚙️
- Top right of EVERY tab page (Home, Gym, Meals, Supps, Classes): a round **profile photo** (Siza's face; a
  neutral avatar / initial until a photo is added). The gear goes away.
- Tap → one page with **two tabs: SETTINGS · PERSONAL INFO**.
  - **SETTINGS:** everything that is in Settings today, moved as is.
  - **PERSONAL INFO:**
    - name, profile photo
    - height, weight
    - body measurements: neck, chest, waist, hips, arm (L/R), forearm, thigh (L/R), calf — and room to add more
    - every entry is **dated**, so later we can compare (then vs now). Latest value shown, history below.
- New data store → must go into Export / Import / Reset (CLAUDE.md rule).
- Swipe back works on this page like on every sub-page.

## 2. No name pop-up at first ENTER
- Remove the "What's your name?" question on first launch. The name is set in PERSONAL INFO.
- Until a name is set, Home says just "HELLO" (as today when skipped).

## 3. Intro without the ENTER button (to discuss more)
- Tap **anywhere** on the intro to enter.
- Instead of the button: one small **glass** element, iOS-lock-screen style (e.g. a glassy "tap to enter" or a
  big lock-screen-like clock/date at the top or middle). Exact look to be decided together first.
- Text stays real HTML (never in the image).

## 4. Swipe between tabs
- On a TAB page, a horizontal swipe moves to the neighbour tab, in tab-bar order:
  HOME ⇄ GYM ⇄ MEALS ⇄ SUPPS ⇄ CLASSES (swipe left = next tab to the right, swipe right = tab to the left).
- Sub-pages keep swipe right = back (`.52`/`.53`).
- **Conflict to solve first:** Classes uses left/right swipe to change the DAY. Options:
  a) on Classes, swiping the day list changes the day; swiping the header/title area changes the tab;
  b) Classes days change only by tapping the weekday circles (day swipe removed);
  c) day swipe stays, and at the first/last day of the week it moves to the next tab.
  → Siza + planner decide before building.

## Order (suggestion)
1 + 2 together (profile page) → 4 (tab swipe, after the Classes decision) → 3 (intro, after the look is agreed).
