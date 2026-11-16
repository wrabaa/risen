// RISEN built-in exercise pictures and clips (.90).
// HOW IT WORKS: every file in the repo folder `assets/exercises/` whose name is an exercise's `file` name from library.js
// (chest-press.mp4, leg-curl.jpg, ...) belongs to that exercise. Nothing in the code lists the files: when the app is open and
// online it asks GitHub what is in the folder, downloads what is new or changed, and keeps it on the phone for offline use.
// So: put a file in the folder (right name) and every phone shows it the next time RISEN is opened online. Delete the file and it goes.
//   - a video (.mp4 / .mov) wins over a picture (.jpg / .jpeg / .png / .webp / .gif) of the same exercise;
//   - a photo or clip the user added on the phone always wins over the built-in one;
//   - files over 8 MB are skipped; this is app content, not user data: it is NOT in Export / Import / Reset.
// The files live in their own cache `risen.exmedia` (the dot keeps it out of the app-version clean-up in sw.js, which deletes `risen-…`).
const ExMedia = (() => {
  const API = 'https://api.github.com/repos/wrabaa/risen/contents/assets/exercises', DIR = 'assets/exercises/';
  const CACHE = 'risen.exmedia', INDEX = 'm/index.json', MAX = 8 * 1024 * 1024, EVERY = 10 * 60 * 1000;      // GitHub is asked at most every 10 minutes
  const TYPES = { mp4: 'video/mp4', mov: 'video/quicktime', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const rank = n => /\.(mp4|mov)$/i.test(n) ? 0 : 1;                 // a clip before a picture
  const ok = typeof caches !== 'undefined';
  let idx = null;                          // { checked: time, files: { 'chest-press': { name, sha, type } } } = what is ON this phone
  const urls = new Map();                  // file -> { url, type, sha } (object URLs, made once)
  let onChange = null, busy = false;

  async function load() {
    if (idx) return idx;
    idx = { checked: 0, files: {} };
    if (!ok) return idx;
    try { const c = await caches.open(CACHE), r = await c.match(INDEX); if (r) { const j = await r.json(); if (j && j.files) idx = j; } } catch (e) {}
    return idx;
  }
  async function save() { try { const c = await caches.open(CACHE); await c.put(INDEX, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } })); } catch (e) {} }
  const fileOf = id => { const x = typeof LIBRARY !== 'undefined' && LIBRARY.byId[id]; return x && x.file || null; };

  // The built-in picture / clip of an exercise: { url, type } or null (none in the folder, not downloaded yet, or a custom exercise)
  async function get(exerciseId) {
    const f = fileOf(exerciseId); if (!f || !ok) return null;
    const rec = (await load()).files[f]; if (!rec) return null;
    const have = urls.get(f); if (have && have.sha === rec.sha) return have;
    try {
      const c = await caches.open(CACHE), r = await c.match('m/' + f); if (!r) return null;
      const blob = new Blob([await r.arrayBuffer()], { type: rec.type });
      if (have) URL.revokeObjectURL(have.url);
      const u = { url: URL.createObjectURL(blob), type: rec.type, sha: rec.sha }; urls.set(f, u); return u;
    } catch (e) { return null; }
  }

  // Ask GitHub what is in the folder and bring this phone in line with it. Quiet: no network, no answer or a busy GitHub = nothing changes.
  async function sync(first = []) {         // first: exercise ids to fetch before the others (the ones in the program)
    if (!ok || busy || !navigator.onLine) return;
    await load(); if (Date.now() - idx.checked < EVERY) return;
    busy = true;
    try {
      const res = await fetch(API, { cache: 'no-store', headers: { accept: 'application/vnd.github+json' } }); if (!res.ok) return;
      const rows = await res.json(); if (!Array.isArray(rows)) return;
      const known = new Set(LIBRARY.list.map(e => e.file)), want = {};
      for (const r of rows.filter(r => r && r.type === 'file').sort((a, b) => rank(a.name) - rank(b.name))) {
        const m = /^(.+)\.([a-z0-9]+)$/i.exec(r.name); if (!m) continue;
        const f = m[1].toLowerCase(), type = TYPES[m[2].toLowerCase()];
        if (!type || !known.has(f) || r.size > MAX || want[f]) continue;
        want[f] = { name: r.name, sha: r.sha, type };
      }
      const c = await caches.open(CACHE); let changed = false, complete = true;
      for (const f of Object.keys(idx.files)) if (!want[f]) { await c.delete('m/' + f); delete idx.files[f]; changed = true; }      // taken out of the folder
      const front = new Set(first.map(fileOf)), order = Object.keys(want).sort((a, b) => front.has(b) - front.has(a));
      for (const f of order) {
        const w = want[f], have = idx.files[f];
        if (have && have.sha === w.sha && await c.match('m/' + f)) continue;
        try {
          const r = await fetch(DIR + encodeURIComponent(w.name) + '?v=' + w.sha.slice(0, 8), { cache: 'no-store' });
          if (!r.ok) { complete = false; continue; }                  // the site is a minute behind the folder: next time
          await c.put('m/' + f, new Response(await r.blob(), { headers: { 'content-type': w.type } }));
          idx.files[f] = w; changed = true; await save();
          if (onChange) onChange(f);
        } catch (e) { complete = false; break; }                       // connection lost: the rest next time
      }
      if (complete) idx.checked = Date.now();
      await save();
      if (changed && onChange) onChange(null);
    } catch (e) { /* nothing changes */ } finally { busy = false; }
  }

  // When: a few seconds after the app opens and every time it comes back to the front (never more often than every 10 minutes). The program's exercises first.
  const mine = () => { try { return [...new Set(S.workouts.flatMap(w => (w.exercises || []).map(e => e.exerciseId)))]; } catch (e) { return []; } };
  const go = () => { if (!document.hidden) sync(mine()); };
  setTimeout(go, 3000);
  document.addEventListener('visibilitychange', go);
  window.addEventListener('online', go);

  return { get, sync, fileOf, set onChange(fn) { onChange = fn; } };
})();
