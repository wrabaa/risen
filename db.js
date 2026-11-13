// RISEN data layer: IndexedDB, all data stays on this phone.
//
// MODEL
//   routines   {id, name, status:'active'|'archived', created, archived}
//              Only ONE active routine. Creating a new one archives the old one (kept, read-only).
//   workouts   {id, routineId, name, days:[1..7] (1=Mon … 7=Sun), time:'HH:MM', order,
//               exercises:[{exerciseId, sets, kg, reps}]}
//              Since the week flow: ONE record per weekday of a routine (days has exactly one entry, time is empty,
//              name is kept in step with the muscle groups). Older multi-day records are converted by migrateWeekdays().
//              since:'YYYY-MM-DD' = the day this weekday's plan (last) went from empty to having exercises. Earlier dates are not
//              "planned", so filling in a day never turns past weeks into misses (stampSince() fills it in for older records).
//   exercises  {id, name, ...}   exercise library, referenced by ID (its photo lives in `photos`)
//   sessions   {id, date:'YYYY-MM-DD', workoutId, routineId, name, extra, startedAt, finishedAt}
//              extra:true = unplanned session.  Skipped:  {..., skipped:true, reason, finishedAt:null}
//   logs       {id, exerciseId, sessionId, date, at, sets:[{kg, reps}]}
//              History is stored per EXERCISE ID, so changing routines never loses progress.
//   settings   {key, value}   name, nameAsked, restSec, activeSession (workout in progress), lastExport,
//              backupAsked (when the weekly "Back up now?" was last shown)
//   photos     {exerciseId, type, data:ArrayBuffer, width, height, updated}
//              ONE photo per exercise, keyed by exercise ID. Resized to max 1000px JPEG before saving.
//              A med's box photo lives here too, under the key 'med-<medId>'.
//   meds       {id, name, dose, times:['08:00',..], freq:'daily'|'days'|'weekly', days:[1..7],
//               food:'yes'|'no'|'any', notes, paused, created}
//   medlogs    {id:'<medId>|<date>|<time>', medId, date, time, takenAt}   one row per dose taken
//   classes    {id, name, studio, day:1..7, time:'HH:MM', duration (min), instructorId|null, notes, seed}   weekly group classes
//              star:true = one of "my classes" (the star on a class in Classes; kept when the schedule is reloaded)
//              seed:true = it came from data/gym-classes.json and its id is the fixed id written there (fz-c01 ...); a class
//              added by hand has a random id and no `seed`
//   instructors {id, name, photo|null}   photo = a file in the app (seed); a photo from the phone lives in `photos` as 'inst-<id>'
//   classlogs  {id:'<classId>|<date>', classId, date, at}   one row per class attended
//   recipes    {id, category:'shakes'|'breakfast'|'lunch'|'snacks'|'dinner', name, ingredients:[{text}], method, created, updated}
//              Each ingredient is an object (not a bare string) so grams / calories can be added to it later; a recipe's photo
//              lives in `photos` as 'recipe-<id>'.
//   settings also holds classesAsked (the one-time "load the schedule?" question has been answered) and classIdsMatched
//              (classes seeded before release .33 have been given their fixed ids, see adoptSeedClasses)
//
// SCHEMA VERSION: raise DB_VERSION and add a new `if (old < N)` step in upgrade().
// Never delete or rename a store in an upgrade, so updates never lose data.
const RisenDB = (() => {
  const DB_NAME = 'risen', DB_VERSION = 5;
  const STORES = ['settings', 'routines', 'workouts', 'exercises', 'sessions', 'logs', 'photos', 'meds', 'medlogs', 'classes', 'instructors', 'classlogs', 'recipes'];
  let dbp;

  function upgrade(db, old) {
    if (old < 1) {
      db.createObjectStore('settings', { keyPath: 'key' });
      db.createObjectStore('routines', { keyPath: 'id' }).createIndex('status', 'status');
      db.createObjectStore('workouts', { keyPath: 'id' }).createIndex('routineId', 'routineId');
      db.createObjectStore('exercises', { keyPath: 'id' });
      const s = db.createObjectStore('sessions', { keyPath: 'id' });
      s.createIndex('date', 'date'); s.createIndex('workoutId', 'workoutId');
      const l = db.createObjectStore('logs', { keyPath: 'id' });
      l.createIndex('exerciseId', 'exerciseId'); l.createIndex('sessionId', 'sessionId');
    }
    if (old < 2) {
      db.createObjectStore('photos', { keyPath: 'exerciseId' });   // v2: one photo per exercise
    }
    if (old < 3) {                                                  // v3: Meds
      db.createObjectStore('meds', { keyPath: 'id' });
      db.createObjectStore('medlogs', { keyPath: 'id' }).createIndex('date', 'date');
    }
    if (old < 4) {                                                  // v4: Classes
      db.createObjectStore('classes', { keyPath: 'id' });
      db.createObjectStore('instructors', { keyPath: 'id' });
      db.createObjectStore('classlogs', { keyPath: 'id' });
    }
    if (old < 5) {                                                  // v5: Meals
      db.createObjectStore('recipes', { keyPath: 'id' });
    }
  }

  function open() {
    return dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = e => upgrade(r.result, e.oldVersion);
      r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); res(r.result); };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('Database blocked: close other RISEN tabs'));
    }));
  }
  const done = t => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  async function all(store) { const db = await open(); return req(db.transaction(store).objectStore(store).getAll()); }
  async function get(store, key) { const db = await open(); return req(db.transaction(store).objectStore(store).get(key)); }
  async function put(store, value) { const db = await open(); const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(value); await done(t); return value; }
  async function byIndex(store, index, key) { const db = await open(); return req(db.transaction(store).objectStore(store).index(index).getAll(key)); }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();

  // ---- Settings ----
  const DEFAULTS = { name: '', nameAsked: false, restSec: 90 };
  async function getSettings() {
    const rows = await all('settings'), s = { ...DEFAULTS };
    for (const r of rows) s[r.key] = r.value;
    return s;
  }
  async function setSetting(key, value) { await put('settings', { key, value }); }

  // ---- Routines (one active; new one archives the old) ----
  async function activeRoutine() { return (await byIndex('routines', 'status', 'active'))[0] || null; }
  async function createRoutine(name) {
    const db = await open(), t = db.transaction('routines', 'readwrite'), st = t.objectStore('routines');
    const routine = { id: uid(), name, status: 'active', created: now(), archived: null };
    const cur = await req(st.index('status').getAll('active'));
    for (const r of cur) st.put({ ...r, status: 'archived', archived: routine.created });
    st.put(routine);
    await done(t); return routine;
  }
  async function assertEditable(routineId) {
    const r = await get('routines', routineId);
    if (!r) throw new Error('Routine not found');
    if (r.status !== 'active') throw new Error('Archived routines are read-only');
  }

  async function renameRoutine(id, name) {
    await assertEditable(id); const r = await get('routines', id); return put('routines', { ...r, name });
  }

  // ---- Workouts ----
  async function saveWorkout(w) {
    await assertEditable(w.routineId);
    return put('workouts', { id: uid(), days: [], time: '', order: 0, exercises: [], ...w });
  }
  const workoutsOf = routineId => byIndex('workouts', 'routineId', routineId);

  // ---- Exercise library ----
  const saveExercise = e => put('exercises', { id: uid(), ...e });

  // ---- Meds ----
  const saveMed = m => put('meds', m);
  async function deleteMed(id) {            // the med, its box photo and every dose logged for it
    const db = await open(), t = db.transaction(['meds', 'medlogs', 'photos'], 'readwrite');
    t.objectStore('meds').delete(id);
    t.objectStore('photos').delete('med-' + id);
    t.objectStore('medlogs').delete(IDBKeyRange.bound(id + '|', id + '|\uffff'));
    await done(t);
  }
  const logDose = (medId, date, time) => put('medlogs', { id: `${medId}|${date}|${time}`, medId, date, time, takenAt: now() });
  async function moveDose(oldId, time) {    // a dose already taken follows its med to a new time (same day, same "taken at")
    const db = await open(), t = db.transaction('medlogs', 'readwrite'), st = t.objectStore('medlogs');
    const l = await req(st.get(oldId)); let out = null;
    if (l) { out = { ...l, id: `${l.medId}|${l.date}|${time}`, time }; st.delete(oldId); st.put(out); }
    await done(t); return out;
  }
  // ---- Recipes ----
  const saveRecipe = r => put('recipes', r);
  async function deleteRecipe(id) {         // the recipe and its photo
    const db = await open(), t = db.transaction(['recipes', 'photos'], 'readwrite');
    t.objectStore('recipes').delete(id); t.objectStore('photos').delete('recipe-' + id);
    await done(t);
  }

  // ---- Classes ----
  const saveClass = c => put('classes', c);
  const saveInstructor = i => put('instructors', i);
  async function deleteClass(id) {          // the class and its attendance
    const db = await open(), t = db.transaction(['classes', 'classlogs'], 'readwrite');
    t.objectStore('classes').delete(id);
    t.objectStore('classlogs').delete(IDBKeyRange.bound(id + '|', id + '|\uffff'));
    await done(t);
  }
  async function deleteInstructor(id) {     // their photo goes too; their classes stay, as "TBA"
    const db = await open(), t = db.transaction(['instructors', 'classes', 'photos'], 'readwrite');
    t.objectStore('instructors').delete(id); t.objectStore('photos').delete('inst-' + id);
    const cs = t.objectStore('classes');
    for (const c of await req(cs.getAll())) if (c.instructorId === id) cs.put({ ...c, instructorId: null });
    await done(t);
  }
  const attendClass = (classId, date) => put('classlogs', { id: `${classId}|${date}`, classId, date, at: now() });
  async function unattendClass(id) { const db = await open(), t = db.transaction('classlogs', 'readwrite'); t.objectStore('classlogs').delete(id); await done(t); }
  async function seedClasses({ instructors, classes }) {        // the one-time "load the schedule" (and the answer is remembered)
    const db = await open(), t = db.transaction(['instructors', 'classes', 'settings'], 'readwrite');
    for (const i of instructors) t.objectStore('instructors').put(i);
    for (const c of classes) t.objectStore('classes').put(c);
    t.objectStore('settings').put({ key: 'classesAsked', value: true });
    t.objectStore('settings').put({ key: 'classIdsMatched', value: true });       // a fresh seed already has the fixed ids
    await done(t);
  }
  // Settings "Reload gym schedule": the classes that came from the schedule go back to the latest file, by their fixed ids.
  //   - a schedule class: name, studio, day, time, duration and instructor are replaced; its own notes, star and attendance stay
  //   - a class new in the file is added; a schedule class no longer in the file is removed (its attendance rows are kept)
  //   - classes added by hand are not touched
  //   - schedule instructors get the file's name and photo path again (a photo chosen on the phone still wins)
  async function reloadSeedClasses(seed) {
    const db = await open(), t = db.transaction(['classes', 'instructors', 'settings'], 'readwrite');
    const cs = t.objectStore('classes'), is = t.objectStore('instructors');
    const classes = await req(cs.getAll()), byId = new Map(classes.map(c => [c.id, c]));
    const ids = new Set(), out = { updated: 0, added: 0, removed: 0 };
    for (const s of seed.classes || []) {
      if (!s.id) continue; ids.add(s.id);
      const old = byId.get(s.id); old ? out.updated++ : out.added++;
      cs.put({ id: s.id, seed: true, name: s.name, studio: s.studio || '', day: s.day, time: s.time, duration: s.duration || 60,
        instructorId: s.instructor || null, notes: (old && old.notes) || '', ...(old && old.star ? { star: true } : {}) });
    }
    for (const c of classes) if (c.seed && !ids.has(c.id)) { cs.delete(c.id); out.removed++; }
    for (const i of seed.instructors || []) is.put({ id: i.id, name: i.name, photo: i.photo || null });
    t.objectStore('settings').put({ key: 'classesAsked', value: true });
    t.objectStore('settings').put({ key: 'classIdsMatched', value: true });
    await done(t); return out;
  }
  async function clearClasses() {           // for changing gym: classes, instructors (and their photos) and attendance
    const db = await open(), t = db.transaction(['classes', 'instructors', 'classlogs', 'photos', 'settings'], 'readwrite');
    for (const s of ['classes', 'instructors', 'classlogs']) t.objectStore(s).clear();
    t.objectStore('photos').delete(IDBKeyRange.bound('inst-', 'inst-\uffff'));
    t.objectStore('settings').put({ key: 'classesAsked', value: true });
    await done(t);
  }
  async function photoKeys() { const db = await open(); return req(db.transaction('photos').objectStore('photos').getAllKeys()); }

  async function undoDose(id) { const db = await open(), t = db.transaction('medlogs', 'readwrite'); t.objectStore('medlogs').delete(id); await done(t); }

  // ---- Sessions + per-exercise logs, saved together ----
  async function logSession({ date, workoutId, routineId, name, extra, startedAt, entries }) {
    const db = await open(), t = db.transaction(['sessions', 'logs'], 'readwrite'), at = now();
    const session = { id: uid(), date, workoutId: workoutId || null, routineId: routineId || null, name: name || '', extra: !!extra,
      startedAt: startedAt || at, finishedAt: at };
    t.objectStore('sessions').put(session);
    for (const e of entries || []) t.objectStore('logs').put({ id: uid(), exerciseId: e.exerciseId, sessionId: session.id, date, at, sets: e.sets });
    await done(t); return session;
  }
  async function skipWorkouts({ date, workoutIds, routineId, reason }) {
    const db = await open(), t = db.transaction('sessions', 'readwrite');
    for (const workoutId of workoutIds) t.objectStore('sessions').put({ id: uid(), date, workoutId, routineId, skipped: true, reason, startedAt: null, finishedAt: null });
    await done(t);
  }
  // Newest first
  const historyOf = async exerciseId => (await byIndex('logs', 'exerciseId', exerciseId))
    .sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date));

  // ---- Exercise photos (stored as bytes: the most reliable form in iPhone Safari) ----
  async function setPhoto(exerciseId, blob, width, height) {
    const data = await blob.arrayBuffer();
    return put('photos', { exerciseId, type: blob.type || 'image/jpeg', data, width, height, updated: now() });
  }
  async function getPhoto(exerciseId) {
    const p = await get('photos', exerciseId);
    return p ? { ...p, blob: new Blob([p.data], { type: p.type }) } : null;
  }
  async function deletePhoto(exerciseId) { const db = await open(); const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').delete(exerciseId); await done(t); }

  const toB64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = str => { const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b.buffer; };

  // ---- Backup: everything in one file (photos as base64 text) ----
  async function exportAll() {
    const stores = {};
    for (const s of STORES) stores[s] = await all(s);
    stores.photos = stores.photos.map(p => ({ ...p, data: toB64(p.data) }));
    return { app: 'RISEN', format: 2, schema: DB_VERSION, exported: now(), stores };
  }
  // The backup FILE, built piece by piece (one store, one photo at a time) so a phone with many photos never has to hold
  // the whole backup as one giant piece of text. Same content and format as exportAll().
  async function exportBlob() {
    const parts = ['{"app":"RISEN","format":2,"schema":' + DB_VERSION + ',"exported":' + JSON.stringify(now()) + ',"stores":{'];
    for (let i = 0; i < STORES.length; i++) {
      const s = STORES[i];
      parts.push((i ? ',' : '') + JSON.stringify(s) + ':[');
      if (s === 'photos') {
        let n = 0;
        for (const key of await photoKeys()) {
          const p = await get('photos', key); if (!p) continue;
          parts.push(new Blob([(n++ ? ',' : '') + JSON.stringify({ ...p, data: toB64(p.data) })]));   // each photo becomes its own piece
        }
      } else parts.push((await all(s)).map(r => JSON.stringify(r)).join(','));
      parts.push(']');
    }
    parts.push('}}');
    return new Blob(parts, { type: 'application/json' });
  }
  // Import is all-or-nothing: the file is checked first, and if anything goes wrong while writing, every change is undone.
  const KEY_OF = { settings: 'key', photos: 'exerciseId' };      // every other store is keyed by `id`
  const DAMAGED = 'This backup file is damaged. Nothing was changed.';
  async function importAll(b) {
    if (!b || b.app !== 'RISEN') throw new Error('Not a RISEN backup');
    if (b.schema > DB_VERSION) throw new Error('Backup is from a newer RISEN. Update the app first.');
    if (b.format === 1 && b.data) {          // backup from release .13: it only holds the name and the rest timer,
      const d = b.data;                      // so only those are restored and everything else on the phone is left alone
      if (d.name) await setSetting('name', String(d.name));
      await setSetting('nameAsked', true);
      if (d.restSec > 0) await setSetting('restSec', Number(d.restSec));
      return { settingsOnly: true };
    }
    if (b.format !== 2 || !b.stores || typeof b.stores !== 'object') throw new Error('Not a RISEN backup');
    const stores = {};
    for (const s of STORES) {                // check every row before touching the phone's data
      const rows = b.stores[s] == null ? [] : b.stores[s];
      if (!Array.isArray(rows)) throw new Error(DAMAGED);
      const k = KEY_OF[s] || 'id';
      for (const row of rows) if (!row || typeof row !== 'object' || (typeof row[k] !== 'string' && typeof row[k] !== 'number')) throw new Error(DAMAGED);
      stores[s] = rows;
    }
    try { stores.photos = stores.photos.map(p => ({ ...p, data: fromB64(p.data) })); } catch (e) { throw new Error(DAMAGED); }
    const db = await open(), t = db.transaction(STORES, 'readwrite'), finished = done(t);
    try {
      for (const s of STORES) { const st = t.objectStore(s); st.clear(); for (const row of stores[s]) st.put(row); }
    } catch (e) { try { t.abort(); } catch (x) {} await finished.catch(() => {}); throw new Error(DAMAGED); }
    try { await finished; } catch (e) { throw new Error('Could not restore the backup. Nothing was changed.'); }
    await migrateWeekdays();                 // a backup made before the week flow gets converted too
    await stampSince();
    return { settingsOnly: false };
  }

  // ---- Week flow: one record per weekday in the active routine ----
  // Safe to run any time (does nothing when the plan already has that shape). It never loses an exercise:
  //   a workout on several days becomes one copy per day, two workouts on the same day are merged (earliest first),
  //   and past sessions are pointed at the record of their weekday, so history and streak stay right.
  async function migrateWeekdays() {
    const db = await open(), t = db.transaction(['routines', 'workouts', 'sessions'], 'readwrite');
    const rs = t.objectStore('routines'), ws = t.objectStore('workouts'), ss = t.objectStore('sessions');
    const [routines, workouts, sessions] = await Promise.all([req(rs.getAll()), req(ws.getAll()), req(ss.getAll())]);
    const active = routines.find(r => r.status === 'active');
    const mine = active ? workouts.filter(w => w.routineId === active.id && (w.days || []).length) : [];   // no days = left alone
    const byDay = d => mine.filter(w => w.days.includes(d)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || (a.order || 0) - (b.order || 0));
    const needed = mine.some(w => w.days.length !== 1 || w.time) || [1, 2, 3, 4, 5, 6, 7].some(d => byDay(d).length > 1);
    if (!needed) { await done(t); return false; }
    const claimed = new Set(), map = new Map(), recs = [];
    for (let d = 1; d <= 7; d++) {
      const src = byDay(d); if (!src.length) continue;
      const id = claimed.has(src[0].id) ? uid() : (claimed.add(src[0].id), src[0].id);
      recs.push({ ...src[0], id, routineId: active.id, days: [d], time: '', order: d, exercises: src.flatMap(w => JSON.parse(JSON.stringify(w.exercises || []))) });
      for (const w of src) map.set(w.id + '|' + d, id);
    }
    for (const w of mine) if (!claimed.has(w.id)) ws.delete(w.id);
    for (const r of recs) ws.put(r);
    const ids = new Set(mine.map(w => w.id));
    for (const s of sessions) {
      if (!ids.has(s.workoutId)) continue;
      const [y, m, dd] = String(s.date).split('-').map(Number), wd = (new Date(y, m - 1, dd).getDay() + 6) % 7 + 1;
      const to = map.get(s.workoutId + '|' + wd) || (claimed.has(s.workoutId) ? s.workoutId : [...map].find(([k]) => k.startsWith(s.workoutId + '|'))?.[1]);
      if (to && to !== s.workoutId) ss.put({ ...s, workoutId: to });
    }
    await done(t); return true;
  }

  // ---- Day plans know since when they exist (week count and streak never judge a date before that) ----
  // Safe to run any time: only touches day plans that have exercises but no `since` yet (made before release .30, or from an
  // older backup). They count from their first logged or skipped workout; a day never used counts from today.
  async function stampSince() {
    const db = await open(), t = db.transaction(['workouts', 'sessions'], 'readwrite'), ws = t.objectStore('workouts');
    const [workouts, sessions] = await Promise.all([req(ws.getAll()), req(t.objectStore('sessions').getAll())]);
    const d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    for (const w of workouts) {
      if (w.since || !(w.exercises || []).length) continue;
      const first = sessions.filter(x => x.workoutId === w.id && x.date && !x.extra && (x.finishedAt || x.skipped)).map(x => String(x.date)).sort()[0];
      ws.put({ ...w, since: first && first < today ? first : today });
    }
    await done(t);
  }

  // ---- Library rebuild: follow `aliases` (old id -> new id) and keep `retired` exercises that are in use ----
  // Safe to run any time and never deletes history: plan entries, logs, notes, the photo and a workout in progress move from
  // an old id to its new one; a retired exercise somebody uses becomes one of their own ("My exercises"), name and all.
  // Returns true when something was changed.
  async function migrateLibrary({ aliases = {}, retired = [] } = {}) {
    const olds = Object.keys(aliases); if (!olds.length && !retired.length) return false;
    const db = await open(), t = db.transaction(['workouts', 'logs', 'photos', 'exercises', 'settings'], 'readwrite');
    const ws = t.objectStore('workouts'), ls = t.objectStore('logs'), ps = t.objectStore('photos'), xs = t.objectStore('exercises'), st = t.objectStore('settings');
    const [workouts, logs, photoKeysNow, exs, act] = await Promise.all([req(ws.getAll()), req(ls.getAll()), req(ps.getAllKeys()), req(xs.getAll()), req(st.get('activeSession'))]);
    const to = id => Object.prototype.hasOwnProperty.call(aliases, id) ? aliases[id] : id;
    let changed = false; const used = new Set();
    for (const w of workouts) {
      let hit = false;
      const list = (w.exercises || []).map(it => { const n = to(it.exerciseId); used.add(n); if (n === it.exerciseId) return it; hit = true; return { ...it, exerciseId: n }; });
      if (hit) { ws.put({ ...w, exercises: list }); changed = true; }
    }
    for (const l of logs) { const n = to(l.exerciseId); used.add(n); if (n !== l.exerciseId) { ls.put({ ...l, exerciseId: n }); changed = true; } }
    const draft = act && act.value;
    if (draft && Array.isArray(draft.exercises)) {
      let hit = false;
      const list = draft.exercises.map(e => { const n = to(e.exerciseId); used.add(n); if (n === e.exerciseId) return e; hit = true; return { ...e, exerciseId: n }; });
      if (hit) { st.put({ key: 'activeSession', value: { ...draft, exercises: list } }); changed = true; }
    }
    const pk = new Set(photoKeysNow.map(String)), xById = new Map(exs.map(x => [x.id, x]));
    for (const o of olds) {
      const n = aliases[o];
      if (pk.has(o) && !pk.has(n)) {                      // the photo follows (an existing photo on the new one wins; nothing is deleted then)
        const p = await req(ps.get(o)); if (p) { ps.put({ ...p, exerciseId: n }); ps.delete(o); pk.add(n); pk.delete(o); changed = true; }
      }
      const xo = xById.get(o);                            // the small notes record of a library exercise
      if (xo && !xo.custom) {
        const xn = xById.get(n);
        if (!xn) { const rec = { ...xo, id: n }; xs.put(rec); xById.set(n, rec); xs.delete(o); xById.delete(o); changed = true; }
        else if (!xn.notes && xo.notes) { const rec = { ...xn, notes: xo.notes }; xs.put(rec); xById.set(n, rec); xs.delete(o); xById.delete(o); changed = true; }
      }
    }
    for (const k of pk) used.add(k);
    for (const r of retired) {                            // in use (plan, history, photo or notes) -> it becomes the user's own exercise
      const x = xById.get(r.id);
      if (!(used.has(r.id) || x) || (x && x.name)) continue;
      xs.put({ ...(x || {}), id: r.id, name: r.name, muscle: r.muscle || 'Custom', custom: true }); changed = true;
    }
    await done(t); return changed;
  }

  // ---- Classes: seeded classes get the fixed ids of data/gym-classes.json (one time, for phones seeded before release .33) ----
  // A class loaded from the schedule earlier has a random id. If it still has the same name + day + time as a class in the
  // file, it takes that class's fixed id and its attendance moves with it. Classes that were changed or added by hand are
  // left exactly as they are. The answer is remembered (classIdsMatched), so this runs once.
  async function adoptSeedClasses(seed) {
    const db = await open(), t = db.transaction(['classes', 'classlogs', 'settings'], 'readwrite');
    const cs = t.objectStore('classes'), ls = t.objectStore('classlogs');
    const [classes, logs] = await Promise.all([req(cs.getAll()), req(ls.getAll())]);
    const key = c => String(c.name || '').trim().toLowerCase() + '|' + c.day + '|' + c.time;
    const have = new Set(classes.map(c => c.id)); let n = 0;
    for (const s of (seed && seed.classes) || []) {
      if (!s.id || have.has(s.id)) continue;
      const same = classes.filter(c => !c.seed && !c._adopted && key(c) === key(s));
      const c = same.find(x => (x.studio || '') === (s.studio || '')) || same[0]; if (!c) continue;
      c._adopted = true; have.add(s.id); n++;
      const { _adopted, ...rest } = c;
      cs.delete(c.id); cs.put({ ...rest, id: s.id, seed: true });
      for (const l of logs) if (l.classId === c.id) { ls.delete(l.id); ls.put({ ...l, id: `${s.id}|${l.date}`, classId: s.id }); }
    }
    t.objectStore('settings').put({ key: 'classIdsMatched', value: true });
    await done(t); return n;
  }

  // ---- One-time move from the old localStorage (releases .12/.13) ----
  async function migrateLocalStorage() {
    let old; try { old = JSON.parse(localStorage.getItem('risen')); } catch (e) { return; }
    if (!old) return;
    const s = await getSettings();
    if (!s.nameAsked) {
      if (old.name) await setSetting('name', old.name);
      await setSetting('nameAsked', true);
    }
    if (old.restSec) await setSetting('restSec', old.restSec);
    try { localStorage.removeItem('risen'); } catch (e) {}
  }

  // ---- Reset: empty every store (back to first launch) ----
  async function resetAll() {
    const db = await open(), t = db.transaction(STORES, 'readwrite');
    for (const s of STORES) t.objectStore(s).clear();
    await done(t);
  }

  async function init() {
    await open();
    await migrateLocalStorage();
    await migrateWeekdays();
    await stampSince();
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  }

  return { DB_VERSION, init, all, uid, getSettings, setSetting, activeRoutine, createRoutine, renameRoutine, migrateWeekdays, migrateLibrary, adoptSeedClasses, saveWorkout, workoutsOf,
    saveExercise, saveMed, deleteMed, logDose, undoDose, moveDose, saveRecipe, deleteRecipe, saveClass, saveInstructor, deleteClass, deleteInstructor, attendClass, unattendClass, seedClasses, reloadSeedClasses, clearClasses, photoKeys, logSession, skipWorkouts, resetAll, historyOf, setPhoto, getPhoto, deletePhoto, exportAll, exportBlob, importAll };
})();
