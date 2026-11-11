// RISEN data layer: IndexedDB, all data stays on this phone.
//
// MODEL
//   routines   {id, name, status:'active'|'archived', created, archived}
//              Only ONE active routine. Creating a new one archives the old one (kept, read-only).
//   workouts   {id, routineId, name, days:[1..7] (1=Mon … 7=Sun), time:'HH:MM', order,
//               exercises:[{exerciseId, sets, kg, reps}]}
//   exercises  {id, name, ...}   exercise library, referenced by ID (photos come later)
//   sessions   {id, date:'YYYY-MM-DD', workoutId, routineId, startedAt, finishedAt}
//   logs       {id, exerciseId, sessionId, date, sets:[{kg, reps}]}
//              History is stored per EXERCISE ID, so changing routines never loses progress.
//   settings   {key, value}   name, nameAsked, restSec
//
// SCHEMA VERSION: raise DB_VERSION and add a new `if (old < N)` step in upgrade().
// Never delete or rename a store in an upgrade, so updates never lose data.
const RisenDB = (() => {
  const DB_NAME = 'risen', DB_VERSION = 1;
  const STORES = ['settings', 'routines', 'workouts', 'exercises', 'sessions', 'logs'];
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
    // if (old < 2) { db.createObjectStore('photos', ...) }   <- example of a future step
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

  // ---- Workouts ----
  async function saveWorkout(w) {
    await assertEditable(w.routineId);
    return put('workouts', { id: uid(), days: [], time: '', order: 0, exercises: [], ...w });
  }
  const workoutsOf = routineId => byIndex('workouts', 'routineId', routineId);

  // ---- Exercise library ----
  const saveExercise = e => put('exercises', { id: uid(), ...e });

  // ---- Sessions + per-exercise logs, saved together ----
  async function logSession({ date, workoutId, routineId, startedAt, entries }) {
    const db = await open(), t = db.transaction(['sessions', 'logs'], 'readwrite');
    const session = { id: uid(), date, workoutId, routineId, startedAt: startedAt || now(), finishedAt: now() };
    t.objectStore('sessions').put(session);
    for (const e of entries || []) t.objectStore('logs').put({ id: uid(), exerciseId: e.exerciseId, sessionId: session.id, date, sets: e.sets });
    await done(t); return session;
  }
  const historyOf = exerciseId => byIndex('logs', 'exerciseId', exerciseId);

  // ---- Backup: everything in one file ----
  async function exportAll() {
    const stores = {};
    for (const s of STORES) stores[s] = await all(s);
    return { app: 'RISEN', format: 2, schema: DB_VERSION, exported: now(), stores };
  }
  async function importAll(b) {
    let stores;
    if (b && b.app === 'RISEN' && b.format === 2 && b.stores) stores = b.stores;
    else if (b && b.app === 'RISEN' && b.format === 1 && b.data) {         // backup from release .13
      const d = b.data;
      stores = { settings: [{ key: 'name', value: d.name || '' }, { key: 'nameAsked', value: true }, { key: 'restSec', value: d.restSec || 90 }] };
    } else throw new Error('Not a RISEN backup');
    if (b.schema > DB_VERSION) throw new Error('Backup is from a newer RISEN. Update the app first.');
    const db = await open(), t = db.transaction(STORES, 'readwrite');
    for (const s of STORES) { const st = t.objectStore(s); st.clear(); for (const row of stores[s] || []) st.put(row); }
    await done(t);
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

  async function init() {
    await open();
    await migrateLocalStorage();
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  }

  return { DB_VERSION, init, all, getSettings, setSetting, activeRoutine, createRoutine, saveWorkout, workoutsOf,
    saveExercise, logSession, historyOf, exportAll, importAll };
})();
