# RISEN — Siza's ideas (14 Nov 2026) — NOT BUILT YET

Planning notes only. Each idea is discussed with the planner first, then built as its own small release.

## 1. Profile button replaces the gear ⚙️ — BUILT in `.61`
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

## 2. No name pop-up at first ENTER — BUILT in `.61`
- Remove the "What's your name?" question on first launch. The name is set in PERSONAL INFO.
- Until a name is set, Home says just "HELLO" (as today when skipped).

## 3. Intro without the ENTER button — BUILT in `.63`
- Tap **anywhere** on the intro to enter.
- Instead of the button: one small **glass** element, iOS-lock-screen style (e.g. a glassy "tap to enter" or a
  big lock-screen-like clock/date at the top or middle). Exact look to be decided together first.
- Text stays real HTML (never in the image).
- **DECIDED (Siza):** one glass pill **ENTER**, medium size (not tiny, not huge), placed in the empty dark space
  ABOVE his head in the photo. Tap anywhere (or the pill) enters.

## 4. Swipe between tabs — BUILT in `.62` (option b)
- On a TAB page, a horizontal swipe moves to the neighbour tab, in tab-bar order:
  HOME ⇄ GYM ⇄ MEALS ⇄ SUPPS ⇄ CLASSES (swipe left = next tab to the right, swipe right = tab to the left).
- Sub-pages keep swipe right = back (`.52`/`.53`).
- **Conflict to solve first:** Classes uses left/right swipe to change the DAY. Options:
  a) on Classes, swiping the day list changes the day; swiping the header/title area changes the tab;
  b) Classes days change only by tapping the weekday circles (day swipe removed);
  c) day swipe stays, and at the first/last day of the week it moves to the next tab.
  → **DECIDED: test b first** (swipe always = tab; days by tapping the weekday circles). If Siza doesn't like it → c.

## 5. Supps page title in full — BUILT in `.61`
- The title on the Supps tab page is written out in full: **SUPPLEMENTS** (there is room; the short "SUPPS" is only
  for the tab bar / Home tile, and the tab bar has no words anyway).

## Order (suggestion)
1 + 2 together (profile page) → 4 (tab swipe, after the Classes decision) → 3 (intro, after the look is agreed).

## 6. Planner's ideas — easier, faster, nicer (for Siza to pick)
- **Gym steppers:** kg and reps change with big − / + buttons (kg ±2.5, reps ±1) — no keyboard in the gym. Typing still possible.
- **Beat last time:** when a set beats "Last time", a lime ▲ and a small celebration (PR!). Progress you can feel.
- **Rest timer as a floating pill** at the top (Dynamic-Island style), visible on every tab while it runs.
- **Swipe to take:** swipe a supplement dose right = taken (like Mail), no need to hit the small ✓.
- **Activity ring around the profile photo:** this week's progress as a thin lime ring around the avatar.
- **One NOW card on Home:** the single next thing — workout, next dose, or next class (with instructor face) — with one big button.
- **Character empty states:** rest day / nothing added yet shows the RISEN character (Siza) in a matching image, not just text.
