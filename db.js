// RISEN data layer: IndexedDB, all data stays on this phone.
//
// MODEL
//   routines   {id, name, status:'active'|'archived', created, archived}
//              Only ONE active routine. Creating a new one archives the old one (kept, read-only).
//   workouts   {id, routineId, name, days:[1..7] (1=Mon … 7=Sun), time:'HH:MM', order,
//               exercises:[{exerciseId, sets, kg, reps}]}
//              Since the week flow: ONE record per weekday of a routine (days has exactly one entry, time is empty,
//              name is kept in step with the muscle groups). Older multi-day records are converted by migrateWeekdays().
//   exercises  {id, name, ...}   exercise library, referenced by ID (its photo lives in `photos`)
//   sessions   {id, date:'YYYY-MM-DD', workoutId, routineId, name, extra, startedAt, finishedAt}
//              extra:true = unplanned session.  Skipped:  {..., skipped:true, reason, finishedAt:null}
//   logs       {id, exerciseId, sessionId, date, at, sets:[{kg, reps}]}
//              History is stored per EXERCISE ID, so changing routines never loses progress.
//   settings   {key, value}   name, nameAsked, restSec, activeSession (workout in progress), lastExport
//   photos     {exerciseId, type, data:ArrayBuffer, width, height, updated}
//              ONE photo per exercise, keyed by exercise ID. Resized to max 1000px JPEG before saving.
//              A med's box photo lives here too, under the key 'med-<medId>'.
//   meds       {id, name, dose, times:['08:00',..], freq:'daily'|'days'|'weekly', days:[1..7],
//               food:'yes'|'no'|'any', notes, paused, created}
//   medlogs    {id:'<medId>|<date>|<time>', medId, date, time, takenAt}   one row per dose taken
//   classes    {id, name, studio, day:1..7, time:'HH:MM', duration (min), instructorId|null, notes}   weekly group classes
//   instructors {id, name, photo|null}   photo = a file in the app (seed); a photo from the phone lives in `photos` as 'inst-<id>'
//   classlogs  {id:'<classId>|<date>', classId, date, at}   one row per class attended
//   recipes    {id, category:'shakes'|'breakfast'|'lunch'|'snacks'|'dinner', name, ingredients:[{text}], method, created, updated}
//              Each ingredient is an object (not a bare string) so grams / calories can be added to it later; a recipe's photo
//              lives in `photos` as 'recipe-<id>'.
//   settings also holds classesAsked (the one-time "load the schedule?" question has been answered)
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
  async function deleteWorkout(id) {
    const w = await get('workouts', id); if (!w) return;
    await assertEditable(w.routineId);
    const db = await open(), t = db.transaction('workouts', 'readwrite'); t.objectStore('workouts').delete(id); await done(t);
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
    await done(t);
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
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  }

  return { DB_VERSION, init, all, uid, getSettings, setSetting, activeRoutine, createRoutine, renameRoutine, migrateWeekdays, saveWorkout, deleteWorkout, workoutsOf,
    saveExercise, saveMed, deleteMed, logDose, undoDose, saveRecipe, deleteRecipe, saveClass, saveInstructor, deleteClass, deleteInstructor, attendClass, unattendClass, seedClasses, clearClasses, photoKeys, logSession, skipWorkouts, resetAll, historyOf, setPhoto, getPhoto, deletePhoto, exportAll, importAll };
})();
