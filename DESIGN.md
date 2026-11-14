# RISEN — Design brief (design pass, `.52`–`.54`)

Goal: RISEN must look like a 2026 iPhone app (iOS 26 "Liquid Glass" feel), premium and alive —
while staying simple: one screen, one job, one big button. Same brand, more depth and motion.
Build ONE step per release, test on iPhone 13 + SE, never touch the status bar meta.

## Keep (never change)
- Brand colours from CLAUDE.md (#0B0B0B bg, #CCFF00 the ONE accent, named CSS colours only).
- Oswald for headlines / big numbers, Inter for body. All text is real HTML, never in images.
- Every screen, flow, word and button stays where it is. This is a LOOK change, not a redesign.

## Design language (all steps follow this)
- **Glass:** surfaces = translucent dark (`rgba` of #1A1A1A ~70–80%) + `backdrop-filter: blur(20–30px)
  saturate(150%)` + 1px hairline border (white ~8%) + a faint top highlight (inner light edge).
  Use glass for: tab bar, sheets, sticky headers, cards that sit over photos. Plain cards elsewhere stay solid
  #1A1A1A but get the hairline + soft shadow. Always a solid fallback when `backdrop-filter` is unsupported.
- **Depth:** soft long shadows (e.g. `0 8px 30px rgba(0,0,0,.45)`), no hard borders. Corners 20–24px for cards,
  full pill for buttons/chips/tab bar.
- **Background:** not flat black — a very subtle radial gradient (top: #141414 → #0B0B0B) plus an almost invisible
  lime glow (≤4% opacity) behind the main hero area. Never noisy.
- **Lime use:** active / done / main button only. Allowed new: a soft lime glow (box-shadow, low opacity) on the
  ONE primary button and on active tab icon. Never lime text blocks.
- **Space:** more breathing room — 20px screen padding, 14–16px gap between cards, bigger tap targets.
- **Type scale:** big Oswald numbers (48–64px) for stats, section titles Oswald 13px letter-spaced muted,
  body Inter 16px. Fewer words on screen.
- **Icons:** one line-icon set, 1.75px stroke, rounded ends, same size everywhere.

## Motion (step `.53`)
- Page change: slide + fade 250ms, iOS curve `cubic-bezier(.32,.72,0,1)`.
- Buttons / rows: press = scale .97 + slightly darker, release springs back.
- ✓ tick: pop (scale 0.6 → 1.1 → 1) + lime fill; set row gets a short lime flash.
- Progress ring (Supps) and week/streak numbers: animate from 0 on open (600ms).
- Sheets: slide up with spring, backdrop blur fades in.
- Respect `prefers-reduced-motion`: then no movement, only fades.
- Light haptic-feel is visual only (no vibration API on iPhone web).

## Steps
- `.51` Floating glass tab bar + SUPPS rename (prompt already sent).
- `.52` (built as release `.54`, DONE) **Glass & depth everywhere:** background gradient, card style (hairline, shadow, radius), glass sheets
  and sticky headers, button glow, spacing + type scale. All tabs, no layout changes.
- `.53` (built as release `.56`, DONE) **Motion:** everything in the Motion section.
- `.54` (built as release `.57`, DONE) **Home premium:** greeting big and calm; tiles as glass cards over the subtle background; 01 TRAINING
  tile shows today's exercise image (when images exist) or a lime-tinted gradient; big animated numbers in
  THIS WEEK / STREAK; WEEK SUMMARY as three small rings or bars.
- Later (needs content): exercise clips on the exercise page (big image on top), meal photos as full-width
  rounded headers.

## Done check for every step
Same screens, same words, same flow — only prettier. Readable in sunlight (contrast), smooth on an older
iPhone (no heavy blur stacks, max 2 blurred layers on screen), nothing hidden under the tab bar or home bar.
