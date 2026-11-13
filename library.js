// RISEN built-in exercise library.
// Every exercise has a FIXED id, written here. The id never changes and is never reused: history, "Last time", plans and
// photos are linked to it. The NAME and the muscle group can be changed freely at any time.
// Custom exercises live in the `exercises` store and use random IDs.
//
// REBUILDING THE LIST (RisenDB.migrateLibrary applies this once, on the next open, and never deletes anything):
//   - rename an exercise        -> just change `name`, keep `id`.
//   - replace one by another    -> remove it from `list`, add a line to `aliases`:  'old-id': 'new-id'
//                                  (its plan entries, history, notes and photo move to the new one).
//   - drop one with no successor-> move its line from `list` to `retired`. If someone uses it, it stays theirs under
//                                  "My exercises" with its history and photo; if nobody uses it, it simply disappears.
//   - add a new one             -> new line with a NEW id (lib-...), never an id that was used before.
// Later fields (image, muscles worked, form tips) can be added to a line without touching anything else.
const LIBRARY = (() => {
  const list = [
    // Chest
    { id: 'lib-bench-press', name: 'Bench press', muscle: 'Chest' },
    { id: 'lib-incline-bench-press', name: 'Incline bench press', muscle: 'Chest' },
    { id: 'lib-dumbbell-bench-press', name: 'Dumbbell bench press', muscle: 'Chest' },
    { id: 'lib-incline-dumbbell-press', name: 'Incline dumbbell press', muscle: 'Chest' },
    { id: 'lib-dumbbell-fly', name: 'Dumbbell fly', muscle: 'Chest' },
    { id: 'lib-cable-crossover', name: 'Cable crossover', muscle: 'Chest' },
    { id: 'lib-push-up', name: 'Push-up', muscle: 'Chest' },
    { id: 'lib-dips-chest', name: 'Dips (chest)', muscle: 'Chest' },
    // Back
    { id: 'lib-deadlift', name: 'Deadlift', muscle: 'Back' },
    { id: 'lib-pull-up', name: 'Pull-up', muscle: 'Back' },
    { id: 'lib-chin-up', name: 'Chin-up', muscle: 'Back' },
    { id: 'lib-barbell-row', name: 'Barbell row', muscle: 'Back' },
    { id: 'lib-dumbbell-row', name: 'Dumbbell row', muscle: 'Back' },
    { id: 'lib-t-bar-row', name: 'T-bar row', muscle: 'Back' },
    { id: 'lib-back-extension', name: 'Back extension', muscle: 'Back' },
    { id: 'lib-shrug', name: 'Shrug', muscle: 'Back' },
    // Shoulders
    { id: 'lib-overhead-press', name: 'Overhead press', muscle: 'Shoulders' },
    { id: 'lib-dumbbell-shoulder-press', name: 'Dumbbell shoulder press', muscle: 'Shoulders' },
    { id: 'lib-arnold-press', name: 'Arnold press', muscle: 'Shoulders' },
    { id: 'lib-lateral-raise', name: 'Lateral raise', muscle: 'Shoulders' },
    { id: 'lib-front-raise', name: 'Front raise', muscle: 'Shoulders' },
    { id: 'lib-rear-delt-fly', name: 'Rear delt fly', muscle: 'Shoulders' },
    { id: 'lib-face-pull', name: 'Face pull', muscle: 'Shoulders' },
    // Legs
    { id: 'lib-back-squat', name: 'Back squat', muscle: 'Legs' },
    { id: 'lib-front-squat', name: 'Front squat', muscle: 'Legs' },
    { id: 'lib-romanian-deadlift', name: 'Romanian deadlift', muscle: 'Legs' },
    { id: 'lib-bulgarian-split-squat', name: 'Bulgarian split squat', muscle: 'Legs' },
    { id: 'lib-walking-lunge', name: 'Walking lunge', muscle: 'Legs' },
    { id: 'lib-hip-thrust', name: 'Hip thrust', muscle: 'Legs' },
    { id: 'lib-goblet-squat', name: 'Goblet squat', muscle: 'Legs' },
    { id: 'lib-step-up', name: 'Step-up', muscle: 'Legs' },
    { id: 'lib-standing-calf-raise', name: 'Standing calf raise', muscle: 'Legs' },
    { id: 'lib-glute-bridge', name: 'Glute bridge', muscle: 'Legs' },
    // Arms
    { id: 'lib-barbell-curl', name: 'Barbell curl', muscle: 'Arms' },
    { id: 'lib-dumbbell-curl', name: 'Dumbbell curl', muscle: 'Arms' },
    { id: 'lib-hammer-curl', name: 'Hammer curl', muscle: 'Arms' },
    { id: 'lib-preacher-curl', name: 'Preacher curl', muscle: 'Arms' },
    { id: 'lib-triceps-pushdown', name: 'Triceps pushdown', muscle: 'Arms' },
    { id: 'lib-overhead-triceps-extension', name: 'Overhead triceps extension', muscle: 'Arms' },
    { id: 'lib-skull-crusher', name: 'Skull crusher', muscle: 'Arms' },
    { id: 'lib-close-grip-bench-press', name: 'Close-grip bench press', muscle: 'Arms' },
    // Core
    { id: 'lib-plank', name: 'Plank', muscle: 'Core' },
    { id: 'lib-side-plank', name: 'Side plank', muscle: 'Core' },
    { id: 'lib-crunch', name: 'Crunch', muscle: 'Core' },
    { id: 'lib-hanging-leg-raise', name: 'Hanging leg raise', muscle: 'Core' },
    { id: 'lib-russian-twist', name: 'Russian twist', muscle: 'Core' },
    { id: 'lib-ab-wheel-rollout', name: 'Ab wheel rollout', muscle: 'Core' },
    { id: 'lib-cable-crunch', name: 'Cable crunch', muscle: 'Core' },
    // Cardio
    { id: 'lib-treadmill', name: 'Treadmill', muscle: 'Cardio' },
    { id: 'lib-exercise-bike', name: 'Exercise bike', muscle: 'Cardio' },
    { id: 'lib-rowing-machine', name: 'Rowing machine', muscle: 'Cardio' },
    { id: 'lib-elliptical', name: 'Elliptical', muscle: 'Cardio' },
    { id: 'lib-stair-climber', name: 'Stair climber', muscle: 'Cardio' },
    { id: 'lib-jump-rope', name: 'Jump rope', muscle: 'Cardio' },
    // Machines
    { id: 'lib-leg-press', name: 'Leg press', muscle: 'Machines' },
    { id: 'lib-leg-extension', name: 'Leg extension', muscle: 'Machines' },
    { id: 'lib-lying-leg-curl', name: 'Lying leg curl', muscle: 'Machines' },
    { id: 'lib-seated-leg-curl', name: 'Seated leg curl', muscle: 'Machines' },
    { id: 'lib-lat-pulldown', name: 'Lat pulldown', muscle: 'Machines' },
    { id: 'lib-seated-cable-row', name: 'Seated cable row', muscle: 'Machines' },
    { id: 'lib-chest-press-machine', name: 'Chest press machine', muscle: 'Machines' },
    { id: 'lib-pec-deck', name: 'Pec deck', muscle: 'Machines' },
    { id: 'lib-shoulder-press-machine', name: 'Shoulder press machine', muscle: 'Machines' },
    { id: 'lib-hip-abductor', name: 'Hip abductor', muscle: 'Machines' },
    { id: 'lib-hip-adductor', name: 'Hip adductor', muscle: 'Machines' },
    { id: 'lib-seated-calf-raise', name: 'Seated calf raise', muscle: 'Machines' },
  ];
  const groups = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Cardio', 'Machines'];          // order of the groups on screen
  const aliases = {};                 // 'old-id': 'new-id'
  const retired = [];                 // { id, name, muscle } of exercises taken out of the list with no successor
  return { groups, list, byId: Object.fromEntries(list.map(e => [e.id, e])), aliases, retired };
})();
