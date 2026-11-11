// RISEN built-in exercise library. IDs never change (history and photos are linked to them).
// Custom exercises live in the `exercises` store and use random IDs.
const LIBRARY = (() => {
  const groups = {
    Chest: ['Bench press', 'Incline bench press', 'Dumbbell bench press', 'Incline dumbbell press', 'Dumbbell fly', 'Cable crossover', 'Push-up', 'Dips (chest)'],
    Back: ['Deadlift', 'Pull-up', 'Chin-up', 'Barbell row', 'Dumbbell row', 'T-bar row', 'Back extension', 'Shrug'],
    Shoulders: ['Overhead press', 'Dumbbell shoulder press', 'Arnold press', 'Lateral raise', 'Front raise', 'Rear delt fly', 'Face pull'],
    Legs: ['Back squat', 'Front squat', 'Romanian deadlift', 'Bulgarian split squat', 'Walking lunge', 'Hip thrust', 'Goblet squat', 'Step-up', 'Standing calf raise', 'Glute bridge'],
    Arms: ['Barbell curl', 'Dumbbell curl', 'Hammer curl', 'Preacher curl', 'Triceps pushdown', 'Overhead triceps extension', 'Skull crusher', 'Close-grip bench press'],
    Core: ['Plank', 'Side plank', 'Crunch', 'Hanging leg raise', 'Russian twist', 'Ab wheel rollout', 'Cable crunch'],
    Cardio: ['Treadmill', 'Exercise bike', 'Rowing machine', 'Elliptical', 'Stair climber', 'Jump rope'],
    Machines: ['Leg press', 'Leg extension', 'Lying leg curl', 'Seated leg curl', 'Lat pulldown', 'Seated cable row', 'Chest press machine', 'Pec deck', 'Shoulder press machine', 'Hip abductor', 'Hip adductor', 'Seated calf raise'],
  };
  const slug = s => 'lib-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const list = [];
  for (const [muscle, names] of Object.entries(groups)) for (const name of names) list.push({ id: slug(name), name, muscle });
  return { groups: Object.keys(groups), list, byId: Object.fromEntries(list.map(e => [e.id, e])) };
})();
