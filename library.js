// RISEN built-in exercise library: Fitness Zone's real gym (82 exercises, see EXERCISES.md). .47 replaced the 66 generic ones with 62; .48 made it 82.
// Every exercise has a FIXED id, written here. The id never changes and is never reused: history, "Last time", plans and
// photos are linked to it. The NAME, the muscle group and the equipment can be changed freely at any time.
// Custom exercises live in the `exercises` store and use random IDs.
//
// Fields: id · name · muscle (the group it is listed under) · equipment (Machine, Cable, Dumbbell, Barbell, Bodyweight or
// Cardio; stored only, no filter screen yet) · file (the name of its image/clip for later: assets/exercises/<file>.jpg or
// .mp4; nothing uses it yet).
//
// REBUILDING THE LIST (RisenDB.migrateLibrary applies this on the next open and never deletes anything):
//   - rename an exercise        -> just change `name`, keep `id`.
//   - replace one by another    -> remove it from `list`, add a line to `aliases`:  'old-id': 'new-id'
//                                  (its plan entries, history, notes and photo move to the new one).
//   - an exercise gets a match later -> move its line from `retired` to `aliases`. A phone where it already sits under
//                                  "My exercises" moves it to the new exercise (plan, history, notes, photo) and drops the stale entry.
//   - drop one with no successor-> move its line from `list` to `retired`. If someone uses it, it stays theirs under
//                                  "My exercises" with its history and photo; if nobody uses it, it simply disappears.
//   - add a new one             -> new line with a NEW id (lib-fz-...), never an id that was used before.
// Keep `aliases` and `retired` forever (an old phone or an old backup may still hold those ids).
const LIBRARY = (() => {
  const list = [
    // Chest
    { id: 'lib-fz-chest-press', name: 'Chest Press', muscle: 'Chest', equipment: 'Machine', file: 'chest-press' },
    { id: 'lib-fz-incline-chest-press', name: 'Incline Chest Press', muscle: 'Chest', equipment: 'Machine', file: 'incline-chest-press' },
    { id: 'lib-fz-pectoral', name: 'Pectoral (Pec Fly)', muscle: 'Chest', equipment: 'Machine', file: 'pectoral' },
    { id: 'lib-fz-assisted-dip', name: 'Assisted Dip', muscle: 'Chest', equipment: 'Machine', file: 'assisted-dip' },
    { id: 'lib-fz-cable-crossover', name: 'Cable Crossover', muscle: 'Chest', equipment: 'Cable', file: 'cable-crossover' },
    { id: 'lib-fz-bench-press', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell', file: 'bench-press' },
    { id: 'lib-fz-barbell-incline-bench', name: 'Barbell Incline Bench Press', muscle: 'Chest', equipment: 'Barbell', file: 'barbell-incline-bench' },
    { id: 'lib-fz-decline-bench-press', name: 'Decline Bench Press', muscle: 'Chest', equipment: 'Barbell', file: 'decline-bench-press' },
    { id: 'lib-fz-db-bench-press', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbell', file: 'db-bench-press' },
    { id: 'lib-fz-incline-db-press', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', file: 'incline-db-press' },
    { id: 'lib-fz-db-fly', name: 'Dumbbell Fly', muscle: 'Chest', equipment: 'Dumbbell', file: 'db-fly' },
    // Back
    { id: 'lib-fz-lat-machine', name: 'Lat Machine', muscle: 'Back', equipment: 'Machine', file: 'lat-machine' },
    { id: 'lib-fz-pulldown', name: 'Pulldown', muscle: 'Back', equipment: 'Machine', file: 'pulldown' },
    { id: 'lib-fz-vertical-traction', name: 'Vertical Traction', muscle: 'Back', equipment: 'Machine', file: 'vertical-traction' },
    { id: 'lib-fz-low-row', name: 'Low Row', muscle: 'Back', equipment: 'Machine', file: 'low-row' },
    { id: 'lib-fz-upper-back', name: 'Upper Back', muscle: 'Back', equipment: 'Machine', file: 'upper-back' },
    { id: 'lib-fz-pulley', name: 'Pulley (Seated Cable Row)', muscle: 'Back', equipment: 'Machine', file: 'pulley' },
    { id: 'lib-fz-lower-back', name: 'Lower Back', muscle: 'Back', equipment: 'Machine', file: 'lower-back' },
    { id: 'lib-fz-assisted-pull-up', name: 'Assisted Pull-Up', muscle: 'Back', equipment: 'Machine', file: 'assisted-pull-up' },
    { id: 'lib-fz-iso-lateral-row', name: 'Iso-Lateral Row (plate-loaded)', muscle: 'Back', equipment: 'Machine', file: 'iso-lateral-row' },
    { id: 'lib-fz-straight-arm-pulldown', name: 'Straight-Arm Cable Pulldown', muscle: 'Back', equipment: 'Cable', file: 'straight-arm-pulldown' },
    { id: 'lib-fz-cable-pullover', name: 'Cable Pull-Over', muscle: 'Back', equipment: 'Cable', file: 'cable-pullover' },
    { id: 'lib-fz-deadlift', name: 'Deadlift', muscle: 'Back', equipment: 'Barbell', file: 'deadlift' },
    { id: 'lib-fz-barbell-row', name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell', file: 'barbell-row' },
    { id: 'lib-fz-one-arm-db-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', file: 'one-arm-db-row' },
    { id: 'lib-fz-chest-supported-db-row', name: 'Chest-Supported Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', file: 'chest-supported-db-row' },
    // Shoulders
    { id: 'lib-fz-shoulder-press', name: 'Shoulder Press', muscle: 'Shoulders', equipment: 'Machine', file: 'shoulder-press' },
    { id: 'lib-fz-delts-machine', name: 'Delts Machine (Lateral Raise)', muscle: 'Shoulders', equipment: 'Machine', file: 'delts-machine' },
    { id: 'lib-fz-cable-face-pull', name: 'Cable Face Pull', muscle: 'Shoulders', equipment: 'Cable', file: 'cable-face-pull' },
    { id: 'lib-fz-cable-lateral-raise', name: 'Cable Lateral Raise', muscle: 'Shoulders', equipment: 'Cable', file: 'cable-lateral-raise' },
    { id: 'lib-fz-cable-rear-delt-fly', name: 'Cable Rear Delt Fly', muscle: 'Shoulders', equipment: 'Cable', file: 'cable-rear-delt-fly' },
    { id: 'lib-fz-db-shoulder-press', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell', file: 'db-shoulder-press' },
    { id: 'lib-fz-lateral-raise', name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbell', file: 'lateral-raise' },
    { id: 'lib-fz-db-front-raise', name: 'Dumbbell Front Raise', muscle: 'Shoulders', equipment: 'Dumbbell', file: 'db-front-raise' },
    { id: 'lib-fz-rear-delt-fly', name: 'Rear Delt Fly', muscle: 'Shoulders', equipment: 'Dumbbell', file: 'rear-delt-fly' },
    { id: 'lib-fz-shrugs', name: 'Shrugs', muscle: 'Shoulders', equipment: 'Dumbbell', file: 'shrugs' },
    // Legs
    { id: 'lib-fz-leg-press', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', file: 'leg-press' },
    { id: 'lib-fz-leg-extension', name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine', file: 'leg-extension' },
    { id: 'lib-fz-leg-curl', name: 'Leg Curl', muscle: 'Legs', equipment: 'Machine', file: 'leg-curl' },
    { id: 'lib-fz-rotary-calf', name: 'Rotary Calf', muscle: 'Legs', equipment: 'Machine', file: 'rotary-calf' },
    { id: 'lib-fz-adductor', name: 'Adductor (inner thigh)', muscle: 'Legs', equipment: 'Machine', file: 'adductor' },
    { id: 'lib-fz-abductor', name: 'Abductor (outer thigh)', muscle: 'Legs', equipment: 'Machine', file: 'abductor' },
    { id: 'lib-fz-plate-leg-machine', name: 'Plate-Loaded Leg Machine', muscle: 'Legs', equipment: 'Machine', file: 'plate-leg-machine' },
    { id: 'lib-fz-smith-squat', name: 'Smith Machine Squat', muscle: 'Legs', equipment: 'Machine', file: 'smith-squat' },
    { id: 'lib-fz-squat', name: 'Squat (rack)', muscle: 'Legs', equipment: 'Barbell', file: 'squat' },
    { id: 'lib-fz-romanian-deadlift', name: 'Romanian Deadlift', muscle: 'Legs', equipment: 'Barbell', file: 'romanian-deadlift' },
    { id: 'lib-fz-lunges', name: 'Lunges', muscle: 'Legs', equipment: 'Dumbbell', file: 'lunges' },
    { id: 'lib-fz-goblet-squat', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', file: 'goblet-squat' },
    { id: 'lib-fz-bulgarian-split-squat', name: 'Bulgarian Split Squat', muscle: 'Legs', equipment: 'Dumbbell', file: 'bulgarian-split-squat' },
    { id: 'lib-fz-db-step-up', name: 'Dumbbell Step-Up', muscle: 'Legs', equipment: 'Dumbbell', file: 'db-step-up' },
    { id: 'lib-fz-standing-calf-raise', name: 'Standing Calf Raise', muscle: 'Legs', equipment: 'Dumbbell', file: 'standing-calf-raise' },
    // Glutes
    { id: 'lib-fz-glute-machine', name: 'Glute Machine', muscle: 'Glutes', equipment: 'Machine', file: 'glute-machine' },
    { id: 'lib-fz-multi-hip', name: 'Multi Hip', muscle: 'Glutes', equipment: 'Machine', file: 'multi-hip' },
    { id: 'lib-fz-cable-glute-kickback', name: 'Cable Glute Kickback', muscle: 'Glutes', equipment: 'Cable', file: 'cable-glute-kickback' },
    { id: 'lib-fz-barbell-hip-thrust', name: 'Barbell Hip Thrust', muscle: 'Glutes', equipment: 'Barbell', file: 'barbell-hip-thrust' },
    { id: 'lib-fz-glute-bridge', name: 'Glute Bridge', muscle: 'Glutes', equipment: 'Bodyweight', file: 'glute-bridge' },
    // Arms
    { id: 'lib-fz-arm-curl', name: 'Arm Curl', muscle: 'Arms', equipment: 'Machine', file: 'arm-curl' },
    { id: 'lib-fz-arm-extension', name: 'Arm Extension', muscle: 'Arms', equipment: 'Machine', file: 'arm-extension' },
    { id: 'lib-fz-cable-pushdown', name: 'Cable Triceps Pushdown', muscle: 'Arms', equipment: 'Cable', file: 'cable-pushdown' },
    { id: 'lib-fz-cable-curl', name: 'Cable Curl', muscle: 'Arms', equipment: 'Cable', file: 'cable-curl' },
    { id: 'lib-fz-cable-overhead-extension', name: 'Cable Overhead Triceps Extension', muscle: 'Arms', equipment: 'Cable', file: 'cable-overhead-extension' },
    { id: 'lib-fz-barbell-curl', name: 'Barbell Curl', muscle: 'Arms', equipment: 'Barbell', file: 'barbell-curl' },
    { id: 'lib-fz-skull-crusher', name: 'Skull Crusher', muscle: 'Arms', equipment: 'Barbell', file: 'skull-crusher' },
    { id: 'lib-fz-close-grip-bench', name: 'Close-Grip Bench Press', muscle: 'Arms', equipment: 'Barbell', file: 'close-grip-bench' },
    { id: 'lib-fz-db-curl', name: 'Dumbbell Curl', muscle: 'Arms', equipment: 'Dumbbell', file: 'db-curl' },
    { id: 'lib-fz-hammer-curl', name: 'Hammer Curl', muscle: 'Arms', equipment: 'Dumbbell', file: 'hammer-curl' },
    { id: 'lib-fz-concentration-curl', name: 'Concentration Curl', muscle: 'Arms', equipment: 'Dumbbell', file: 'concentration-curl' },
    { id: 'lib-fz-overhead-db-extension', name: 'Overhead Dumbbell Extension', muscle: 'Arms', equipment: 'Dumbbell', file: 'overhead-db-extension' },
    // Core
    { id: 'lib-fz-abdominal-crunch', name: 'Abdominal Crunch', muscle: 'Core', equipment: 'Machine', file: 'abdominal-crunch' },
    { id: 'lib-fz-total-abdominal', name: 'Total Abdominal', muscle: 'Core', equipment: 'Machine', file: 'total-abdominal' },
    { id: 'lib-fz-rotary-torso', name: 'Rotary Torso', muscle: 'Core', equipment: 'Machine', file: 'rotary-torso' },
    { id: 'lib-fz-vertical-knee-raise', name: 'Vertical Knee Raise', muscle: 'Core', equipment: 'Machine', file: 'vertical-knee-raise' },
    { id: 'lib-fz-cable-woodchop', name: 'Cable Woodchop', muscle: 'Core', equipment: 'Cable', file: 'cable-woodchop' },
    { id: 'lib-fz-weighted-sit-up', name: 'Weighted Sit-Up', muscle: 'Core', equipment: 'Bodyweight', file: 'weighted-sit-up' },
    { id: 'lib-fz-plank', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', file: 'plank' },
    { id: 'lib-fz-crunch', name: 'Crunch (floor)', muscle: 'Core', equipment: 'Bodyweight', file: 'crunch' },
    // Cardio
    { id: 'lib-fz-treadmill', name: 'Treadmill', muscle: 'Cardio', equipment: 'Cardio', file: 'treadmill' },
    { id: 'lib-fz-elliptical', name: 'Elliptical', muscle: 'Cardio', equipment: 'Cardio', file: 'elliptical' },
    { id: 'lib-fz-stair-climber', name: 'Stair Climber', muscle: 'Cardio', equipment: 'Cardio', file: 'stair-climber' },
    { id: 'lib-fz-rowing', name: 'Rowing', muscle: 'Cardio', equipment: 'Cardio', file: 'rowing' },
    { id: 'lib-fz-bike', name: 'Indoor Cycling Bike', muscle: 'Cardio', equipment: 'Cardio', file: 'bike' },
    // Flexibility
    { id: 'lib-fz-flexibility-stretch', name: 'Posterior Flexibility Stretch', muscle: 'Flexibility', equipment: 'Machine', file: 'flexibility-stretch' },
  ];
  const groups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Glutes', 'Arms', 'Core', 'Cardio', 'Flexibility'];          // order of the groups on screen
  // Old (generic, pre-.47) exercise -> the same movement in the new list. Plans, history, notes and photos follow.
  const aliases = {
    'lib-bench-press': 'lib-fz-bench-press',   // Bench press -> Bench Press
    'lib-incline-dumbbell-press': 'lib-fz-incline-db-press',   // Incline dumbbell press -> Incline Dumbbell Press
    'lib-dumbbell-fly': 'lib-fz-db-fly',   // Dumbbell fly -> Dumbbell Fly
    'lib-cable-crossover': 'lib-fz-cable-crossover',   // Cable crossover -> Cable Crossover
    'lib-chest-press-machine': 'lib-fz-chest-press',   // Chest press machine -> Chest Press
    'lib-pec-deck': 'lib-fz-pectoral',   // Pec deck -> Pectoral (Pec Fly)
    'lib-deadlift': 'lib-fz-deadlift',   // Deadlift -> Deadlift
    'lib-barbell-row': 'lib-fz-barbell-row',   // Barbell row -> Barbell Row
    'lib-dumbbell-row': 'lib-fz-one-arm-db-row',   // Dumbbell row -> One-Arm Dumbbell Row
    'lib-back-extension': 'lib-fz-lower-back',   // Back extension -> Lower Back
    'lib-shrug': 'lib-fz-shrugs',   // Shrug -> Shrugs
    'lib-lat-pulldown': 'lib-fz-lat-machine',   // Lat pulldown -> Lat Machine
    'lib-seated-cable-row': 'lib-fz-pulley',   // Seated cable row -> Pulley (Seated Cable Row)
    'lib-dumbbell-shoulder-press': 'lib-fz-db-shoulder-press',   // Dumbbell shoulder press -> Dumbbell Shoulder Press
    'lib-lateral-raise': 'lib-fz-lateral-raise',   // Lateral raise -> Lateral Raise
    'lib-rear-delt-fly': 'lib-fz-rear-delt-fly',   // Rear delt fly -> Rear Delt Fly
    'lib-face-pull': 'lib-fz-cable-face-pull',   // Face pull -> Cable Face Pull
    'lib-shoulder-press-machine': 'lib-fz-shoulder-press',   // Shoulder press machine -> Shoulder Press
    'lib-back-squat': 'lib-fz-squat',   // Back squat -> Squat (rack)
    'lib-romanian-deadlift': 'lib-fz-romanian-deadlift',   // Romanian deadlift -> Romanian Deadlift
    'lib-walking-lunge': 'lib-fz-lunges',   // Walking lunge -> Lunges
    'lib-goblet-squat': 'lib-fz-goblet-squat',   // Goblet squat -> Goblet Squat
    'lib-seated-calf-raise': 'lib-fz-rotary-calf',   // Seated calf raise -> Rotary Calf
    'lib-leg-press': 'lib-fz-leg-press',   // Leg press -> Leg Press
    'lib-leg-extension': 'lib-fz-leg-extension',   // Leg extension -> Leg Extension
    'lib-lying-leg-curl': 'lib-fz-leg-curl',   // Lying leg curl -> Leg Curl
    'lib-seated-leg-curl': 'lib-fz-leg-curl',   // Seated leg curl -> Leg Curl
    'lib-hip-abductor': 'lib-fz-abductor',   // Hip abductor -> Abductor (outer thigh)
    'lib-hip-adductor': 'lib-fz-adductor',   // Hip adductor -> Adductor (inner thigh)
    'lib-barbell-curl': 'lib-fz-barbell-curl',   // Barbell curl -> Barbell Curl
    'lib-dumbbell-curl': 'lib-fz-db-curl',   // Dumbbell curl -> Dumbbell Curl
    'lib-hammer-curl': 'lib-fz-hammer-curl',   // Hammer curl -> Hammer Curl
    'lib-triceps-pushdown': 'lib-fz-cable-pushdown',   // Triceps pushdown -> Cable Triceps Pushdown
    'lib-overhead-triceps-extension': 'lib-fz-overhead-db-extension',   // Overhead triceps extension -> Overhead Dumbbell Extension
    'lib-skull-crusher': 'lib-fz-skull-crusher',   // Skull crusher -> Skull Crusher
    'lib-plank': 'lib-fz-plank',   // Plank -> Plank
    'lib-crunch': 'lib-fz-crunch',   // Crunch -> Crunch (floor)
    'lib-treadmill': 'lib-fz-treadmill',   // Treadmill -> Treadmill
    'lib-elliptical': 'lib-fz-elliptical',   // Elliptical -> Elliptical
    'lib-stair-climber': 'lib-fz-stair-climber',   // Stair climber -> Stair Climber
    'lib-exercise-bike': 'lib-fz-bike',   // Exercise bike -> Indoor Cycling Bike
    'lib-rowing-machine': 'lib-fz-rowing',   // Rowing machine -> Rowing
    'lib-incline-bench-press': 'lib-fz-barbell-incline-bench',   // Incline bench press -> Barbell Incline Bench Press
    'lib-dumbbell-bench-press': 'lib-fz-db-bench-press',   // Dumbbell bench press -> Dumbbell Bench Press
    'lib-front-raise': 'lib-fz-db-front-raise',   // Front raise -> Dumbbell Front Raise
    'lib-bulgarian-split-squat': 'lib-fz-bulgarian-split-squat',   // Bulgarian split squat -> Bulgarian Split Squat
    'lib-hip-thrust': 'lib-fz-barbell-hip-thrust',   // Hip thrust -> Barbell Hip Thrust
    'lib-step-up': 'lib-fz-db-step-up',   // Step-up -> Dumbbell Step-Up
    'lib-standing-calf-raise': 'lib-fz-standing-calf-raise',   // Standing calf raise -> Standing Calf Raise
    'lib-glute-bridge': 'lib-fz-glute-bridge',   // Glute bridge -> Glute Bridge
    'lib-close-grip-bench-press': 'lib-fz-close-grip-bench',   // Close-grip bench press -> Close-Grip Bench Press
  };
  // Old exercises with no counterpart (T-bar row and Preacher curl wait for the gym to confirm). One that somebody uses stays
  // theirs under "My exercises", with its history and photo.
  const retired = [
    { id: 'lib-push-up', name: 'Push-up', muscle: 'Chest' },
    { id: 'lib-dips-chest', name: 'Dips (chest)', muscle: 'Chest' },
    { id: 'lib-pull-up', name: 'Pull-up', muscle: 'Back' },
    { id: 'lib-chin-up', name: 'Chin-up', muscle: 'Back' },
    { id: 'lib-t-bar-row', name: 'T-bar row', muscle: 'Back' },
    { id: 'lib-overhead-press', name: 'Overhead press', muscle: 'Shoulders' },
    { id: 'lib-arnold-press', name: 'Arnold press', muscle: 'Shoulders' },
    { id: 'lib-front-squat', name: 'Front squat', muscle: 'Legs' },
    { id: 'lib-preacher-curl', name: 'Preacher curl', muscle: 'Arms' },
    { id: 'lib-side-plank', name: 'Side plank', muscle: 'Core' },
    { id: 'lib-hanging-leg-raise', name: 'Hanging leg raise', muscle: 'Core' },
    { id: 'lib-russian-twist', name: 'Russian twist', muscle: 'Core' },
    { id: 'lib-ab-wheel-rollout', name: 'Ab wheel rollout', muscle: 'Core' },
    { id: 'lib-cable-crunch', name: 'Cable crunch', muscle: 'Core' },
    { id: 'lib-jump-rope', name: 'Jump rope', muscle: 'Cardio' },
  ];
  return { groups, list, byId: Object.fromEntries(list.map(e => [e.id, e])), aliases, retired };
})();
