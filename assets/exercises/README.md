# RISEN exercise pictures and clips

Put ONE file per exercise in the folder of its body part (`chest`, `back`, `shoulders`, `legs`, `glutes`, `biceps`, `triceps`, `core`, `cardio`, `flexibility`, `rest`), with the exact name from the list below. The app finds a clip by its NAME, wherever it sits: one in the wrong folder, or loose here, still works. That is all: every phone shows it the next time RISEN is opened with internet (it can take a minute or two after the upload). No code change, no new release.

## Rules

- **Name:** exactly as listed, small letters, dashes, no spaces. Example: `chest-press.mp4`.
- **Clip:** `.mp4` (best) or `.mov`. 3 to 5 seconds, no sound needed, square or 4:3. Aim for under 1 MB; over 8 MB is ignored.
- **Picture:** `.jpg` (best), `.png` or `.webp`. About 1000 px wide is plenty.
- If an exercise has both a clip and a picture, the clip is shown.
- **Replace:** upload a new file with the same name. **Remove:** delete the file.
- A photo or clip someone adds on their own phone still wins over the one here, on that phone only.
- This repo is public: anyone can see these files.

## Day Off: several clips

Put `day-off.mp4`, `day-off-2.mp4`, `day-off-3.mp4` … in `rest/`. Each time the app is opened it picks one at random (never the same as last time) and keeps it until it is closed. His own photo on the day still wins.

## The 83 names

Add `.mp4` for a clip or `.jpg` for a picture.

### Chest (11)

| Exercise | File name |
|---|---|
| Chest Press | `chest-press` |
| Incline Chest Press | `incline-chest-press` |
| Pectoral (Pec Fly) | `pectoral` |
| Assisted Dip | `assisted-dip` |
| Cable Crossover | `cable-crossover` |
| Bench Press | `bench-press` |
| Barbell Incline Bench Press | `barbell-incline-bench` |
| Decline Bench Press | `decline-bench-press` |
| Dumbbell Bench Press | `db-bench-press` |
| Incline Dumbbell Press | `incline-db-press` |
| Dumbbell Fly | `db-fly` |

### Back (15)

| Exercise | File name |
|---|---|
| Lat Machine | `lat-machine` |
| Pulldown | `pulldown` |
| Vertical Traction | `vertical-traction` |
| Low Row | `low-row` |
| Upper Back | `upper-back` |
| Pulley (Seated Cable Row) | `pulley` |
| Lower Back | `lower-back` |
| Assisted Pull-Up | `assisted-pull-up` |
| Iso-Lateral Row (plate-loaded) | `iso-lateral-row` |
| Straight-Arm Cable Pulldown | `straight-arm-pulldown` |
| Cable Pull-Over | `cable-pullover` |
| Deadlift | `deadlift` |
| Barbell Row | `barbell-row` |
| One-Arm Dumbbell Row | `one-arm-db-row` |
| Chest-Supported Dumbbell Row | `chest-supported-db-row` |

### Shoulders (10)

| Exercise | File name |
|---|---|
| Shoulder Press | `shoulder-press` |
| Delts Machine (Lateral Raise) | `delts-machine` |
| Cable Face Pull | `cable-face-pull` |
| Cable Lateral Raise | `cable-lateral-raise` |
| Cable Rear Delt Fly | `cable-rear-delt-fly` |
| Dumbbell Shoulder Press | `db-shoulder-press` |
| Lateral Raise | `lateral-raise` |
| Dumbbell Front Raise | `db-front-raise` |
| Rear Delt Fly | `rear-delt-fly` |
| Shrugs | `shrugs` |

### Legs (13)

| Exercise | File name |
|---|---|
| Leg Press | `leg-press` |
| Leg Extension | `leg-extension` |
| Leg Curl | `leg-curl` |
| Rotary Calf | `rotary-calf` |
| Plate-Loaded Leg Machine | `plate-leg-machine` |
| Smith Machine Squat | `smith-squat` |
| Squat (rack) | `squat` |
| Romanian Deadlift | `romanian-deadlift` |
| Lunges | `lunges` |
| Goblet Squat | `goblet-squat` |
| Bulgarian Split Squat | `bulgarian-split-squat` |
| Dumbbell Step-Up | `db-step-up` |
| Standing Calf Raise | `standing-calf-raise` |

### Glutes (7)

| Exercise | File name |
|---|---|
| Glute Machine | `glute-machine` |
| Multi Hip | `multi-hip` |
| Cable Glute Kickback | `cable-glute-kickback` |
| Barbell Hip Thrust | `barbell-hip-thrust` |
| Glute Bridge | `glute-bridge` |
| Adductor (inner thigh) | `adductor` |
| Abductor (outer thigh) | `abductor` |

### Biceps (6)

| Exercise | File name |
|---|---|
| Arm Curl | `arm-curl` |
| Cable Curl | `cable-curl` |
| Barbell Curl | `barbell-curl` |
| Dumbbell Curl | `db-curl` |
| Hammer Curl | `hammer-curl` |
| Concentration Curl | `concentration-curl` |

### Triceps (6)

| Exercise | File name |
|---|---|
| Arm Extension | `arm-extension` |
| Cable Triceps Pushdown | `cable-pushdown` |
| Cable Overhead Triceps Extension | `cable-overhead-extension` |
| Skull Crusher | `skull-crusher` |
| Close-Grip Bench Press | `close-grip-bench` |
| Overhead Dumbbell Extension | `overhead-db-extension` |

### Core (8)

| Exercise | File name |
|---|---|
| Abdominal Crunch | `abdominal-crunch` |
| Total Abdominal | `total-abdominal` |
| Rotary Torso | `rotary-torso` |
| Vertical Knee Raise | `vertical-knee-raise` |
| Cable Woodchop | `cable-woodchop` |
| Weighted Sit-Up | `weighted-sit-up` |
| Plank | `plank` |
| Crunch (floor) | `crunch` |

### Cardio (5)

| Exercise | File name |
|---|---|
| Treadmill | `treadmill` |
| Elliptical | `elliptical` |
| Stair Climber | `stair-climber` |
| Rowing | `rowing` |
| Indoor Cycling Bike | `bike` |

### Flexibility (1)

| Exercise | File name |
|---|---|
| Posterior Flexibility Stretch | `flexibility-stretch` |

### Rest (1)

| Exercise | File name |
|---|---|
| Day Off | `day-off` |


---

## PLANNED: more free-weight exercises (41) — NOT in the app yet

This is the plan we follow together. Nothing here is in `library.js` or in the app until Siza picks. Status: **PROPOSED** (tick = approved, then we add them with new fixed ids `lib-fz-<file>` and the clip + still use the file name below, in the body-part folder).

How we go: Siza strikes out what he does not want, adds what is missing, then says GO. Retired old ids (`lib-front-squat`, `lib-preacher-curl`, `lib-jump-rope`) stay as they are; the new ones get their own ids.

### Chest (4)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Incline Dumbbell Fly | `incline-db-fly` | Dumbbell |
| [ ] | Decline Dumbbell Press | `decline-db-press` | Dumbbell |
| [ ] | Push-Up | `push-up` | Bodyweight |
| [ ] | Chest Dip | `chest-dip` | Bodyweight |

### Back (6)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Pull-Up | `pull-up` | Bodyweight |
| [ ] | Chin-Up | `chin-up` | Bodyweight |
| [ ] | Pendlay Row | `pendlay-row` | Barbell |
| [ ] | Rack Pull | `rack-pull` | Barbell |
| [ ] | Good Morning | `good-morning` | Barbell |
| [ ] | Dumbbell Pullover | `db-pullover` | Dumbbell |

### Shoulders (5)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Barbell Overhead Press | `barbell-overhead-press` | Barbell |
| [ ] | Arnold Press | `arnold-press` | Dumbbell |
| [ ] | Dumbbell Upright Row | `db-upright-row` | Dumbbell |
| [ ] | Push Press | `push-press` | Barbell |
| [ ] | Barbell Shrug | `barbell-shrug` | Barbell |

### Legs (4)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Front Squat | `front-squat` | Barbell |
| [ ] | Walking Lunge | `walking-lunge` | Dumbbell |
| [ ] | Dumbbell Reverse Lunge | `db-reverse-lunge` | Dumbbell |
| [ ] | Dumbbell Calf Raise | `db-calf-raise` | Dumbbell |

### Glutes (6)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Dumbbell Hip Thrust | `db-hip-thrust` | Dumbbell |
| [ ] | Dumbbell Sumo Squat | `db-sumo-squat` | Dumbbell |
| [ ] | Single-Leg Glute Bridge | `single-leg-glute-bridge` | Bodyweight |
| [ ] | Single-Leg Romanian Deadlift | `single-leg-rdl` | Dumbbell |
| [ ] | Curtsy Lunge | `curtsy-lunge` | Dumbbell |
| [ ] | Kettlebell Swing | `kettlebell-swing` | Kettlebell |

### Biceps (5)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Incline Dumbbell Curl | `incline-db-curl` | Dumbbell |
| [ ] | EZ-Bar Curl | `ez-bar-curl` | Barbell |
| [ ] | Preacher Curl (EZ-bar) | `preacher-curl` | Barbell |
| [ ] | Zottman Curl | `zottman-curl` | Dumbbell |
| [ ] | Reverse Curl | `reverse-curl` | Barbell |

### Triceps (4)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Dumbbell Kickback | `db-kickback` | Dumbbell |
| [ ] | Single-Arm Overhead Extension | `one-arm-overhead-extension` | Dumbbell |
| [ ] | Bench Dip | `bench-dip` | Bodyweight |
| [ ] | Diamond Push-Up | `diamond-push-up` | Bodyweight |

### Core (6)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Hanging Leg Raise | `hanging-leg-raise` | Bodyweight |
| [ ] | Russian Twist | `russian-twist` | Dumbbell |
| [ ] | Ab Wheel Rollout | `ab-wheel-rollout` | Bodyweight |
| [ ] | Side Plank | `side-plank` | Bodyweight |
| [ ] | Dead Bug | `dead-bug` | Bodyweight |
| [ ] | Farmer's Carry | `farmers-carry` | Dumbbell |

### Cardio (1)

| Done | Exercise | File name | Equipment |
|---|---|---|---|
| [ ] | Jump Rope | `jump-rope` | Bodyweight |

