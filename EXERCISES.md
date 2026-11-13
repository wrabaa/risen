# RISEN — New exercise list (Fitness Zone, Siza's real gym)

Status: BUILT in release `.47` (`library.js`: 62 exercises, ids `lib-fz-<file>`; images still to come). Source: `RISEN_Master_Gym_Equipment_Inventory.pdf` (45 items) + Siza's
photos of the Technogym machine plates (13 Nov 2026) + standard barbell/dumbbell exercises.

Rules for the build (see CLAUDE.md, to-do 3):
- New built-in exercises get NEW fixed IDs (`lib-…`), never reuse old ones.
- Old generic exercises: map to the new one with `aliases` when it is the same movement
  (e.g. old Bench Press → new Bench Press), otherwise `retired`. Nothing on the phone is lost.
- Image / clip per exercise comes later. File name = the `file` column below
  (`assets/exercises/<file>.jpg` or `.mp4`). Missing file = no image, the app still works.
- Muscles + 2–3 form tips per exercise come later (from the Technogym plates). Not in this step.
- `M` = machine (Technogym), `C` = cable, `FW` = free weights, `CA` = cardio.

## CHEST
| # | Name | Type | file |
|---|------|------|------|
| 1 | Chest Press | M | chest-press |
| 2 | Incline Chest Press | M | incline-chest-press |
| 3 | Pectoral (Pec Fly) | M | pectoral |
| 4 | Cable Crossover | C | cable-crossover |
| 5 | Bench Press | FW | bench-press |
| 6 | Incline Dumbbell Press | FW | incline-db-press |
| 7 | Dumbbell Fly | FW | db-fly |
| 8 | Assisted Dip | M | assisted-dip |

## BACK
| # | Name | Type | file |
|---|------|------|------|
| 9 | Lat Machine | M | lat-machine |
| 10 | Pulldown | M | pulldown |
| 11 | Vertical Traction | M | vertical-traction |
| 12 | Low Row | M | low-row |
| 13 | Upper Back | M | upper-back |
| 14 | Pulley (Seated Cable Row) | M | pulley |
| 15 | Lower Back | M | lower-back |
| 16 | Assisted Pull-Up | M | assisted-pull-up |
| 17 | Iso-Lateral Row (plate-loaded) | M | iso-lateral-row |
| 18 | Deadlift | FW | deadlift |
| 19 | Barbell Row | FW | barbell-row |
| 20 | One-Arm Dumbbell Row | FW | one-arm-db-row |

## SHOULDERS
| # | Name | Type | file |
|---|------|------|------|
| 21 | Shoulder Press | M | shoulder-press |
| 22 | Delts Machine (Lateral Raise) | M | delts-machine |
| 23 | Dumbbell Shoulder Press | FW | db-shoulder-press |
| 24 | Lateral Raise | FW | lateral-raise |
| 25 | Rear Delt Fly | FW | rear-delt-fly |
| 26 | Cable Face Pull | C | cable-face-pull |
| 27 | Shrugs | FW | shrugs |

## LEGS
| # | Name | Type | file |
|---|------|------|------|
| 28 | Leg Press | M | leg-press |
| 29 | Leg Extension | M | leg-extension |
| 30 | Leg Curl | M | leg-curl |
| 31 | Rotary Calf | M | rotary-calf |
| 32 | Adductor (inner thigh) | M | adductor |
| 33 | Abductor (outer thigh) | M | abductor |
| 34 | Plate-Loaded Leg Machine | M | plate-leg-machine |
| 35 | Squat (rack) | FW | squat |
| 36 | Smith Machine Squat | FW | smith-squat |
| 37 | Romanian Deadlift | FW | romanian-deadlift |
| 38 | Lunges | FW | lunges |
| 39 | Goblet Squat | FW | goblet-squat |

## GLUTES
| # | Name | Type | file |
|---|------|------|------|
| 40 | Glute Machine | M | glute-machine |
| 41 | Multi Hip | M | multi-hip |

## ARMS
| # | Name | Type | file |
|---|------|------|------|
| 42 | Arm Curl | M | arm-curl |
| 43 | Arm Extension | M | arm-extension |
| 44 | Cable Triceps Pushdown | C | cable-pushdown |
| 45 | Cable Curl | C | cable-curl |
| 46 | Barbell Curl | FW | barbell-curl |
| 47 | Dumbbell Curl | FW | db-curl |
| 48 | Hammer Curl | FW | hammer-curl |
| 49 | Skull Crusher | FW | skull-crusher |
| 50 | Overhead Dumbbell Extension | FW | overhead-db-extension |

## CORE
| # | Name | Type | file |
|---|------|------|------|
| 51 | Abdominal Crunch | M | abdominal-crunch |
| 52 | Total Abdominal | M | total-abdominal |
| 53 | Rotary Torso | M | rotary-torso |
| 54 | Vertical Knee Raise | M | vertical-knee-raise |
| 55 | Plank | FW | plank |
| 56 | Crunch (floor) | FW | crunch |

## CARDIO
| # | Name | Type | file |
|---|------|------|------|
| 57 | Treadmill | CA | treadmill |
| 58 | Elliptical | CA | elliptical |
| 59 | Stair Climber | CA | stair-climber |
| 60 | Rowing | CA | rowing |
| 61 | Indoor Cycling Bike | CA | bike |

## FLEXIBILITY
| # | Name | Type | file |
|---|------|------|------|
| 62 | Posterior Flexibility Stretch | M | flexibility-stretch |

Total: 62 exercises.

## Open questions (Siza confirms at the gym)
- Plate-loaded machines (inventory 28–31): what exactly are they? For now one row-type (#17)
  and one leg-type (#34). "Upper-Body" and "Seated" plate-loaded machines are left out until
  confirmed.
- Pulldown vs Lat Machine vs Vertical Traction: three separate machines? (Kept as three.)

## How the old 66 generic exercises were handled in `.47`
Rule used: **same exercise (same movement and implement) → alias; anything else → retired.** Nothing on a phone is
deleted: plans, history ("Last time"), notes and photos follow an alias; a retired exercise that someone uses stays
theirs under "My exercises" with its history and photo; unused ones simply disappear.

**Aliased to the new exercise (42):**
- Bench press → Bench Press
- Incline dumbbell press → Incline Dumbbell Press
- Dumbbell fly → Dumbbell Fly
- Cable crossover → Cable Crossover
- Chest press machine → Chest Press
- Pec deck → Pectoral (Pec Fly)
- Deadlift → Deadlift
- Barbell row → Barbell Row
- Dumbbell row → One-Arm Dumbbell Row
- Back extension → Lower Back
- Shrug → Shrugs
- Lat pulldown → Lat Machine
- Seated cable row → Pulley (Seated Cable Row)
- Dumbbell shoulder press → Dumbbell Shoulder Press
- Lateral raise → Lateral Raise
- Rear delt fly → Rear Delt Fly
- Face pull → Cable Face Pull
- Shoulder press machine → Shoulder Press
- Back squat → Squat (rack)
- Romanian deadlift → Romanian Deadlift
- Walking lunge → Lunges
- Goblet squat → Goblet Squat
- Seated calf raise → Rotary Calf
- Leg press → Leg Press
- Leg extension → Leg Extension
- Lying leg curl → Leg Curl
- Seated leg curl → Leg Curl
- Hip abductor → Abductor (outer thigh)
- Hip adductor → Adductor (inner thigh)
- Barbell curl → Barbell Curl
- Dumbbell curl → Dumbbell Curl
- Hammer curl → Hammer Curl
- Triceps pushdown → Cable Triceps Pushdown
- Overhead triceps extension → Overhead Dumbbell Extension
- Skull crusher → Skull Crusher
- Plank → Plank
- Crunch → Crunch (floor)
- Treadmill → Treadmill
- Elliptical → Elliptical
- Stair climber → Stair Climber
- Exercise bike → Indoor Cycling Bike
- Rowing machine → Rowing

**Retired (24):** Incline bench press, Dumbbell bench press, Push-up, Dips (chest), Pull-up, Chin-up, T-bar row, Overhead press, Arnold press, Front raise, Front squat, Bulgarian split squat, Hip thrust, Step-up, Standing calf raise, Glute bridge, Preacher curl, Close-grip bench press, Side plank, Hanging leg raise, Russian twist, Ab wheel rollout, Cable crunch, Jump rope.

Judgement calls (easy to change later in `library.js`): Lat pulldown → Lat Machine (not Pulldown); Lying and Seated
leg curl both → Leg Curl; Seated calf raise → Rotary Calf; Back extension → Lower Back; Walking lunge → Lunges;
Dumbbell row → One-Arm Dumbbell Row. Barbell incline, dumbbell bench, pull-up/chin-up and dips were NOT merged into
the machine versions (different load), so they were retired.
