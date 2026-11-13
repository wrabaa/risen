# RISEN — New exercise list (Fitness Zone, Siza's real gym)

Status: `.47` built the first 62 (ids `lib-fz-<file>`). `.48` BUILT: **82** (+20 new, marked NEW) and an
`equipment` tag on every exercise (stored in `library.js`, no filter screen yet). "Check at the gym" items are NOT built yet.
Source: `RISEN_Master_Gym_Equipment_Inventory.pdf` + Siza's photos of the Technogym machine plates
+ standard barbell / dumbbell / cable / bodyweight exercises.

## Rules for the build (see CLAUDE.md, to-do 3)
- New built-in exercises get NEW fixed IDs (`lib-…`), never reuse old ones.
- Old generic exercises: same movement → `aliases` to the new one; otherwise `retired`.
  Plans, history and photos on the phone must follow. Nothing is lost.
- Every exercise has TWO tags:
  - `muscle` = the group heading below (Chest, Back, Shoulders, Legs, Glutes, Arms, Core, Cardio,
    Flexibility) — used for the day title and the library groups.
  - `equipment` = one of: **Machine · Cable · Dumbbell · Barbell · Bodyweight · Cardio**
    (Smith machine counts as Machine). Stored now, filter chips come later.
- `file` = future image/clip name (`assets/exercises/<file>.jpg` or `.mp4`). Not in this step;
  a missing file = no image, the app still works.
- Muscles worked + 2–3 form tips per exercise come later (from the Technogym plates).
- Lat Machine / Pulldown / Vertical Traction are 3 different Technogym machines (3 plates) — keep
  all 3. Low Row and Pulley are also 2 separate machines — keep both.

## CHEST (11)
| Name | equipment | file |
|------|-----------|------|
| Chest Press | Machine | chest-press |
| Incline Chest Press | Machine | incline-chest-press |
| Pectoral (Pec Fly) | Machine | pectoral |
| Assisted Dip | Machine | assisted-dip |
| Cable Crossover | Cable | cable-crossover |
| Bench Press | Barbell | bench-press |
| Barbell Incline Bench Press (NEW) | Barbell | barbell-incline-bench |
| Decline Bench Press (NEW) | Barbell | decline-bench-press |
| Dumbbell Bench Press (NEW) | Dumbbell | db-bench-press |
| Incline Dumbbell Press | Dumbbell | incline-db-press |
| Dumbbell Fly | Dumbbell | db-fly |

## BACK (15)
| Name | equipment | file |
|------|-----------|------|
| Lat Machine | Machine | lat-machine |
| Pulldown | Machine | pulldown |
| Vertical Traction | Machine | vertical-traction |
| Low Row | Machine | low-row |
| Upper Back | Machine | upper-back |
| Pulley (Seated Cable Row) | Machine | pulley |
| Lower Back | Machine | lower-back |
| Assisted Pull-Up | Machine | assisted-pull-up |
| Iso-Lateral Row (plate-loaded) | Machine | iso-lateral-row |
| Straight-Arm Cable Pulldown (NEW) | Cable | straight-arm-pulldown |
| Cable Pull-Over (NEW) | Cable | cable-pullover |
| Deadlift | Barbell | deadlift |
| Barbell Row | Barbell | barbell-row |
| One-Arm Dumbbell Row | Dumbbell | one-arm-db-row |
| Chest-Supported Dumbbell Row (NEW) | Dumbbell | chest-supported-db-row |

## SHOULDERS (10)
| Name | equipment | file |
|------|-----------|------|
| Shoulder Press | Machine | shoulder-press |
| Delts Machine (Lateral Raise) | Machine | delts-machine |
| Cable Face Pull | Cable | cable-face-pull |
| Cable Lateral Raise (NEW) | Cable | cable-lateral-raise |
| Cable Rear Delt Fly (NEW) | Cable | cable-rear-delt-fly |
| Dumbbell Shoulder Press | Dumbbell | db-shoulder-press |
| Lateral Raise | Dumbbell | lateral-raise |
| Dumbbell Front Raise (NEW) | Dumbbell | db-front-raise |
| Rear Delt Fly | Dumbbell | rear-delt-fly |
| Shrugs | Dumbbell | shrugs |

## LEGS (15)
| Name | equipment | file |
|------|-----------|------|
| Leg Press | Machine | leg-press |
| Leg Extension | Machine | leg-extension |
| Leg Curl | Machine | leg-curl |
| Rotary Calf | Machine | rotary-calf |
| Adductor (inner thigh) | Machine | adductor |
| Abductor (outer thigh) | Machine | abductor |
| Plate-Loaded Leg Machine | Machine | plate-leg-machine |
| Smith Machine Squat | Machine | smith-squat |
| Squat (rack) | Barbell | squat |
| Romanian Deadlift | Barbell | romanian-deadlift |
| Lunges | Dumbbell | lunges |
| Goblet Squat | Dumbbell | goblet-squat |
| Bulgarian Split Squat (NEW) | Dumbbell | bulgarian-split-squat |
| Dumbbell Step-Up (NEW) | Dumbbell | db-step-up |
| Standing Calf Raise (NEW) | Dumbbell | standing-calf-raise |

## GLUTES (5)
| Name | equipment | file |
|------|-----------|------|
| Glute Machine | Machine | glute-machine |
| Multi Hip | Machine | multi-hip |
| Cable Glute Kickback (NEW) | Cable | cable-glute-kickback |
| Barbell Hip Thrust (NEW) | Barbell | barbell-hip-thrust |
| Glute Bridge (NEW) | Bodyweight | glute-bridge |

## ARMS (12)
| Name | equipment | file |
|------|-----------|------|
| Arm Curl | Machine | arm-curl |
| Arm Extension | Machine | arm-extension |
| Cable Triceps Pushdown | Cable | cable-pushdown |
| Cable Curl | Cable | cable-curl |
| Cable Overhead Triceps Extension (NEW) | Cable | cable-overhead-extension |
| Barbell Curl | Barbell | barbell-curl |
| Skull Crusher | Barbell | skull-crusher |
| Close-Grip Bench Press (NEW) | Barbell | close-grip-bench |
| Dumbbell Curl | Dumbbell | db-curl |
| Hammer Curl | Dumbbell | hammer-curl |
| Concentration Curl (NEW) | Dumbbell | concentration-curl |
| Overhead Dumbbell Extension | Dumbbell | overhead-db-extension |

## CORE (8)
| Name | equipment | file |
|------|-----------|------|
| Abdominal Crunch | Machine | abdominal-crunch |
| Total Abdominal | Machine | total-abdominal |
| Rotary Torso | Machine | rotary-torso |
| Vertical Knee Raise | Machine | vertical-knee-raise |
| Cable Woodchop (NEW) | Cable | cable-woodchop |
| Weighted Sit-Up (NEW) | Bodyweight | weighted-sit-up |
| Plank | Bodyweight | plank |
| Crunch (floor) | Bodyweight | crunch |

## CARDIO (5)
| Name | equipment | file |
|------|-----------|------|
| Treadmill | Cardio | treadmill |
| Elliptical | Cardio | elliptical |
| Stair Climber | Cardio | stair-climber |
| Rowing | Cardio | rowing |
| Indoor Cycling Bike | Cardio | bike |

## FLEXIBILITY (1)
| Name | equipment | file |
|------|-----------|------|
| Posterior Flexibility Stretch | Machine | flexibility-stretch |

**Total: 82 exercises** (Machine 32 · Dumbbell 19 · Cable 11 · Barbell 11 · Bodyweight 4 · Cardio 5).

## Left out on purpose
- Single-Leg Leg Extension / Single-Leg Leg Curl — same machine; write "single leg" in notes.
- Hanging Knee Raise — same movement as Vertical Knee Raise.

## Check at the gym (NOT in this build)
- T-Bar Row (Barbell) and Preacher Curl (Dumbbell/Machine) — add only if the gym has a T-bar
  handle / preacher bench.
- Plate-loaded machines (inventory 28–31): exact names. "Iso-Lateral Row" and "Plate-Loaded Leg
  Machine" are placeholders; rename later (names can change, IDs stay).

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

## `.48`: retired old exercises that got a NEW match (now aliases; done)
Incline bench press → Barbell Incline Bench Press · Dumbbell bench press → Dumbbell Bench Press · Front raise →
Dumbbell Front Raise · Bulgarian split squat → Bulgarian Split Squat · Hip thrust → Barbell Hip Thrust · Step-up →
Dumbbell Step-Up · Standing calf raise → Standing Calf Raise · Glute bridge → Glute Bridge · Close-grip bench press →
Close-Grip Bench Press. (T-bar row and Preacher curl stay retired until confirmed at the gym.)
