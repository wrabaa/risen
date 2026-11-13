// RISEN built-in exercise library: Fitness Zone's real gym (62 exercises, see EXERCISES.md). Replaced the 66 generic ones in .47.
// Every exercise has a FIXED id, written here. The id never changes and is never reused: history, "Last time", plans and
// photos are linked to it. The NAME and the muscle group can be changed freely at any time.
// Custom exercises live in the `exercises` store and use random IDs.
//
// Fields: id · name · muscle (the group it is listed under) · type (M machine, C cable, FW free weights, CA cardio) ·
// file (the name of its image/clip for later: assets/exercises/<file>.jpg or .mp4; nothing uses it yet).
//
// REBUILDING THE LIST (RisenDB.migrateLibrary applies this on the next open and never deletes anything):
//   - rename an exercise        -> just change `name`, keep `id`.
//   - replace one by another    -> remove it from `list`, add a line to `aliases`:  'old-id': 'new-id'
//                                  (its plan entries, history, notes and photo move to the new one).
//   - drop one with no successor-> move its line from `list` to `retired`. If someone uses it, it stays theirs under
//                                  "My exercises" with its history and photo; if nobody uses it, it simply disappears.
//   - add a new one             -> new line with a NEW id (lib-fz-...), never an id that was used before.
// Keep `aliases` and `retired` forever (an old phone or an old backup may still hold those ids).
const LIBRARY = (() => {
  const list = [
    // Chest
    { id: 'lib-fz-chest-press', name: 'Chest Press', muscle: 'Chest', type: 'M', file: 'chest-press' },
    { id: 'lib-fz-incline-chest-press', name: 'Incline Chest Press', muscle: 'Chest', type: 'M', file: 'incline-chest-press' },
    { id: 'lib-fz-pectoral', name: 'Pectoral (Pec Fly)', muscle: 'Chest', type: 'M', file: 'pectoral' },
    { id: 'lib-fz-cable-crossover', name: 'Cable Crossover', muscle: 'Chest', type: 'C', file: 'cable-crossover' },
    { id: 'lib-fz-bench-press', name: 'Bench Press', muscle: 'Chest', type: 'FW', file: 'bench-press' },
    { id: 'lib-fz-incline-db-press', name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'FW', file: 'incline-db-press' },
    { id: 'lib-fz-db-fly', name: 'Dumbbell Fly', muscle: 'Chest', type: 'FW', file: 'db-fly' },
    { id: 'lib-fz-assisted-dip', name: 'Assisted Dip', muscle: 'Chest', type: 'M', file: 'assisted-dip' },
    // Back
    { id: 'lib-fz-lat-machine', name: 'Lat Machine', muscle: 'Back', type: 'M', file: 'lat-machine' },
    { id: 'lib-fz-pulldown', name: 'Pulldown', muscle: 'Back', type: 'M', file: 'pulldown' },
    { id: 'lib-fz-vertical-traction', name: 'Vertical Traction', muscle: 'Back', type: 'M', file: 'vertical-traction' },
    { id: 'lib-fz-low-row', name: 'Low Row', muscle: 'Back', type: 'M', file: 'low-row' },
    { id: 'lib-fz-upper-back', name: 'Upper Back', muscle: 'Back', type: 'M', file: 'upper-back' },
    { id: 'lib-fz-pulley', name: 'Pulley (Seated Cable Row)', muscle: 'Back', type: 'M', file: 'pulley' },
    { id: 'lib-fz-lower-back', name: 'Lower Back', muscle: 'Back', type: 'M', file: 'lower-back' },
    { id: 'lib-fz-assisted-pull-up', name: 'Assisted Pull-Up', muscle: 'Back', type: 'M', file: 'assisted-pull-up' },
    { id: 'lib-fz-iso-lateral-row', name: 'Iso-Lateral Row (plate-loaded)', muscle: 'Back', type: 'M', file: 'iso-lateral-row' },
    { id: 'lib-fz-deadlift', name: 'Deadlift', muscle: 'Back', type: 'FW', file: 'deadlift' },
    { id: 'lib-fz-barbell-row', name: 'Barbell Row', muscle: 'Back', type: 'FW', file: 'barbell-row' },
    { id: 'lib-fz-one-arm-db-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', type: 'FW', file: 'one-arm-db-row' },
    // Shoulders
    { id: 'lib-fz-shoulder-press', name: 'Shoulder Press', muscle: 'Shoulders', type: 'M', file: 'shoulder-press' },
    { id: 'lib-fz-delts-machine', name: 'Delts Machine (Lateral Raise)', muscle: 'Shoulders', type: 'M', file: 'delts-machine' },
    { id: 'lib-fz-db-shoulder-press', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', type: 'FW', file: 'db-shoulder-press' },
    { id: 'lib-fz-lateral-raise', name: 'Lateral Raise', muscle: 'Shoulders', type: 'FW', file: 'lateral-raise' },
    { id: 'lib-fz-rear-delt-fly', name: 'Rear Delt Fly', muscle: 'Shoulders', type: 'FW', file: 'rear-delt-fly' },
    { id: 'lib-fz-cable-face-pull', name: 'Cable Face Pull', muscle: 'Shoulders', type: 'C', file: 'cable-face-pull' },
    { id: 'lib-fz-shrugs', name: 'Shrugs', muscle: 'Shoulders', type: 'FW', file: 'shrugs' },
    // Legs
    { id: 'lib-fz-leg-press', name: 'Leg Press', muscle: 'Legs', type: 'M', file: 'leg-press' },
    { id: 'lib-fz-leg-extension', name: 'Leg Extension', muscle: 'Legs', type: 'M', file: 'leg-extension' },
    { id: 'lib-fz-leg-curl', name: 'Leg Curl', muscle: 'Legs', type: 'M', file: 'leg-curl' },
    { id: 'lib-fz-rotary-calf', name: 'Rotary Calf', muscle: 'Legs', type: 'M', file: 'rotary-calf' },
    { id: 'lib-fz-adductor', name: 'Adductor (inner thigh)', muscle: 'Legs', type: 'M', file: 'adductor' },
    { id: 'lib-fz-abductor', name: 'Abductor (outer thigh)', muscle: 'Legs', type: 'M', file: 'abductor' },
    { id: 'lib-fz-plate-leg-machine', name: 'Plate-Loaded Leg Machine', muscle: 'Legs', type: 'M', file: 'plate-leg-machine' },
    { id: 'lib-fz-squat', name: 'Squat (rack)', muscle: 'Legs', type: 'FW', file: 'squat' },
    { id: 'lib-fz-smith-squat', name: 'Smith Machine Squat', muscle: 'Legs', type: 'FW', file: 'smith-squat' },
    { id: 'lib-fz-romanian-deadlift', name: 'Romanian Deadlift', muscle: 'Legs', type: 'FW', file: 'romanian-deadlift' },
    { id: 'lib-fz-lunges', name: 'Lunges', muscle: 'Legs', type: 'FW', file: 'lunges' },
    { id: 'lib-fz-goblet-squat', name: 'Goblet Squat', muscle: 'Legs', type: 'FW', file: 'goblet-squat' },
    // Glutes
    { id: 'lib-fz-glute-machine', name: 'Glute Machine', muscle: 'Glutes', type: 'M', file: 'glute-machine' },
    { id: 'lib-fz-multi-hip', name: 'Multi Hip', muscle: 'Glutes', type: 'M', file: 'multi-hip' },
    // Arms
    { id: 'lib-fz-arm-curl', name: 'Arm Curl', muscle: 'Arms', type: 'M', file: 'arm-curl' },
    { id: 'lib-fz-arm-extension', name: 'Arm Extension', muscle: 'Arms', type: 'M', file: 'arm-extension' },
    { id: 'lib-fz-cable-pushdown', name: 'Cable Triceps Pushdown', muscle: 'Arms', type: 'C', file: 'cable-pushdown' },
    { id: 'lib-fz-cable-curl', name: 'Cable Curl', muscle: 'Arms', type: 'C', file: 'cable-curl' },
    { id: 'lib-fz-barbell-curl', name: 'Barbell Curl', muscle: 'Arms', type: 'FW', file: 'barbell-curl' },
    { id: 'lib-fz-db-curl', name: 'Dumbbell Curl', muscle: 'Arms', type: 'FW', file: 'db-curl' },
    { id: 'lib-fz-hammer-curl', name: 'Hammer Curl', muscle: 'Arms', type: 'FW', file: 'hammer-curl' },
    { id: 'lib-fz-skull-crusher', name: 'Skull Crusher', muscle: 'Arms', type: 'FW', file: 'skull-crusher' },
    { id: 'lib-fz-overhead-db-extension', name: 'Overhead Dumbbell Extension', muscle: 'Arms', type: 'FW', file: 'overhead-db-extension' },
    // Core
    { id: 'lib-fz-abdominal-crunch', name: 'Abdominal Crunch', muscle: 'Core', type: 'M', file: 'abdominal-crunch' },
    { id: 'lib-fz-total-abdominal', name: 'Total Abdominal', muscle: 'Core', type: 'M', file: 'total-abdominal' },
    { id: 'lib-fz-rotary-torso', name: 'Rotary Torso', muscle: 'Core', type: 'M', file: 'rotary-torso' },
    { id: 'lib-fz-vertical-knee-raise', name: 'Vertical Knee Raise', muscle: 'Core', type: 'M', file: 'vertical-knee-raise' },
    { id: 'lib-fz-plank', name: 'Plank', muscle: 'Core', type: 'FW', file: 'plank' },
    { id: 'lib-fz-crunch', name: 'Crunch (floor)', muscle: 'Core', type: 'FW', file: 'crunch' },
    // Cardio
    { id: 'lib-fz-treadmill', name: 'Treadmill', muscle: 'Cardio', type: 'CA', file: 'treadmill' },
    { id: 'lib-fz-elliptical', name: 'Elliptical', muscle: 'Cardio', type: 'CA', file: 'elliptical' },
    { id: 'lib-fz-stair-climber', name: 'Stair Climber', muscle: 'Cardio', type: 'CA', file: 'stair-climber' },
    { id: 'lib-fz-rowing', name: 'Rowing', muscle: 'Cardio', type: 'CA', file: 'rowing' },
    { id: 'lib-fz-bike', name: 'Indoor Cycling Bike', muscle: 'Cardio', type: 'CA', file: 'bike' },
    // Flexibility
    { id: 'lib-fz-flexibility-stretch', name: 'Posterior Flexibility Stretch', muscle: 'Flexibility', type: 'M', file: 'flexibility-stretch' },
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
  };
  // Old exercises with no counterpart. One that somebody uses stays theirs under "My exercises", with its history and photo.
  const retired = [
    { id: 'lib-incline-bench-press', name: 'Incline bench press', muscle: 'Chest' },
    { id: 'lib-dumbbell-bench-press', name: 'Dumbbell bench press', muscle: 'Chest' },
    { id: 'lib-push-up', name: 'Push-up', muscle: 'Chest' },
    { id: 'lib-dips-chest', name: 'Dips (chest)', muscle: 'Chest' },
    { id: 'lib-pull-up', name: 'Pull-up', muscle: 'Back' },
    { id: 'lib-chin-up', name: 'Chin-up', muscle: 'Back' },
    { id: 'lib-t-bar-row', name: 'T-bar row', muscle: 'Back' },
    { id: 'lib-overhead-press', name: 'Overhead press', muscle: 'Shoulders' },
    { id: 'lib-arnold-press', name: 'Arnold press', muscle: 'Shoulders' },
    { id: 'lib-front-raise', name: 'Front raise', muscle: 'Shoulders' },
    { id: 'lib-front-squat', name: 'Front squat', muscle: 'Legs' },
    { id: 'lib-bulgarian-split-squat', name: 'Bulgarian split squat', muscle: 'Legs' },
    { id: 'lib-hip-thrust', name: 'Hip thrust', muscle: 'Glutes' },
    { id: 'lib-step-up', name: 'Step-up', muscle: 'Legs' },
    { id: 'lib-standing-calf-raise', name: 'Standing calf raise', muscle: 'Legs' },
    { id: 'lib-glute-bridge', name: 'Glute bridge', muscle: 'Glutes' },
    { id: 'lib-preacher-curl', name: 'Preacher curl', muscle: 'Arms' },
    { id: 'lib-close-grip-bench-press', name: 'Close-grip bench press', muscle: 'Arms' },
    { id: 'lib-side-plank', name: 'Side plank', muscle: 'Core' },
    { id: 'lib-hanging-leg-raise', name: 'Hanging leg raise', muscle: 'Core' },
    { id: 'lib-russian-twist', name: 'Russian twist', muscle: 'Core' },
    { id: 'lib-ab-wheel-rollout', name: 'Ab wheel rollout', muscle: 'Core' },
    { id: 'lib-cable-crunch', name: 'Cable crunch', muscle: 'Core' },
    { id: 'lib-jump-rope', name: 'Jump rope', muscle: 'Cardio' },
  ];
  return { groups, list, byId: Object.fromEntries(list.map(e => [e.id, e])), aliases, retired };
})();
