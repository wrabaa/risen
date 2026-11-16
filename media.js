// RISEN content that lives in the GitHub repo and reaches the phones BY ITSELF, without a release (.90 exercises, .91 recipes).
//
// HOW IT WORKS: a folder of the repo (assets/exercises/, assets/recipes/) is the source. Nothing in the code lists its files.
// When the app is open and online it asks GitHub what is in the folder, downloads what is new or changed (by `sha`), deletes what
// left the folder, and keeps the files on the phone for offline use. So: put a file in the folder and every phone has it the next
// time RISEN is opened online; replace it (same name) and phones follow; delete it and it goes.
// This is app content, not user data: it is NOT in Export / Import / Reset. If GitHub cannot be reached, nothing changes.
// Each folder has its own cache (`risen.exmedia`, `risen.recipes`; the dot keeps them out of the app-version clean-up in sw.js,
// which deletes `risen-…`), and sw.js lets requests for these folders pass, so there is never a second copy.
//
//   ExMedia    = built-in exercise pictures / clips: a file named after an exercise's `file` in library.js (chest-press.mp4).
//   RecipePack = the RISEN recipes: assets/recipes/recipes.json (the text) + one picture per recipe named after its id (tabbouleh.jpg).
function RepoFolder({ dir, cache: CACHE, pick }) {
  const API = 'https://api.github.com/repos/wrabaa/risen/contents/' + dir, DIR = dir + '/';
  const INDEX = 'm/index.json', EVERY = 10 * 60 * 1000;                   // GitHub is asked at most every 10 minutes
  const ok = typeof caches !== 'undefined';
  let idx = null;                          // { checked: time, files: { key: { name, sha, type } } } = what is ON this phone
  const urls = new Map();                  // key -> { url, type, sha } (object URLs, made once)
  let onChange = null, busy = false;

  async function load() {
    if (idx) return idx;
    idx = { checked: 0, files: {} };
    if (!ok) return idx;
    try { const c = await caches.open(CACHE), r = await c.match(INDEX); if (r) { const j = await r.json(); if (j && j.files) idx = j; } } catch (e) {}
    return idx;
  }
  async function save() { try { const c = await caches.open(CACHE); await c.put(INDEX, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } })); } catch (e) {} }

  async function blob(key) {               // the stored file, or null
    if (!ok || !key) return null;
    const rec = (await load()).files[key]; if (!rec) return null;
    try { const c = await caches.open(CACHE), r = await c.match('m/' + key); return r ? new Blob([await r.arrayBuffer()], { type: rec.type }) : null; } catch (e) { return null; }
  }
  async function get(key) {                // { url, type } to show it, or null
    if (!ok || !key) return null;
    const rec = (await load()).files[key]; if (!rec) return null;
    const have = urls.get(key); if (have && have.sha === rec.sha) return have;
    const b = await blob(key); if (!b) return null;
    if (have) URL.revokeObjectURL(have.url);
    const u = { url: URL.createObjectURL(b), type: rec.type, sha: rec.sha }; urls.set(key, u); return u;
  }
  const keys = async () => Object.keys((await load()).files);
  const sha = async key => { const r = (await load()).files[key]; return r ? r.sha : null; };

  // Ask GitHub what is in the folder and bring this phone in line with it. Quiet: no network, no answer or a busy GitHub = nothing changes.
  //   first: keys to fetch before the others · force: do not wait for the 10 minutes (the user just asked for it)
  async function sync(first = [], force = false) {
    if (!ok || busy || !navigator.onLine) return;
    await load(); if (!force && Date.now() - idx.checked < EVERY) return;
    busy = true;
    try {
      const res = await fetch(API, { cache: 'no-store', headers: { accept: 'application/vnd.github+json' } }); if (!res.ok) return;
      const rows = await res.json(); if (!Array.isArray(rows)) return;
      const want = pick(rows.filter(r => r && r.type === 'file')) || {};          // key -> { name, sha, type }
      const c = await caches.open(CACHE); let changed = false, complete = true;
      for (const k of Object.keys(idx.files)) if (!want[k]) { await c.delete('m/' + k); delete idx.files[k]; changed = true; }      // taken out of the folder (or no longer wanted)
      const front = new Set(first), order = Object.keys(want).sort((a, b) => front.has(b) - front.has(a));
      for (const k of order) {
        const w = want[k], have = idx.files[k];
        if (have && have.sha === w.sha && await c.match('m/' + k)) continue;
        try {
          const r = await fetch(DIR + encodeURIComponent(w.name) + '?v=' + w.sha.slice(0, 8), { cache: 'no-store' });
          if (!r.ok) { complete = false; continue; }                  // the site is a minute behind the folder: next time
          await c.put('m/' + k, new Response(await r.blob(), { headers: { 'content-type': w.type } }));
          idx.files[k] = w; changed = true; await save();
          if (onChange) onChange(k);
        } catch (e) { complete = false; break; }                       // connection lost: the rest next time
      }
      if (complete) idx.checked = Date.now();
      await save();
      if (changed && onChange) onChange(null);
    } catch (e) { /* nothing changes */ } finally { busy = false; }
  }

  return { get, blob, keys, sha, sync, set onChange(fn) { onChange = fn; } };
}

const MEDIA_TYPES = { mp4: 'video/mp4', mov: 'video/quicktime', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const mediaName = n => { const m = /^(.+)\.([a-z0-9]+)$/i.exec(n); return m ? { base: m[1].toLowerCase(), ext: m[2].toLowerCase() } : null; };

// ---------- Exercises: assets/exercises/<file>.mp4 | .mov | .jpg | .png | .webp | .gif ----------
//   a clip wins over a picture of the same exercise · over 8 MB is skipped · the user's own photo / clip always wins (gym.js, photo.js)
const ExMedia = (() => {
  const rank = n => /\.(mp4|mov)$/i.test(n) ? 0 : 1;                 // a clip before a picture
  const F = RepoFolder({ dir: 'assets/exercises', cache: 'risen.exmedia', pick(rows) {
    const known = new Set(LIBRARY.list.map(e => e.file)), want = {};
    for (const r of rows.sort((a, b) => rank(a.name) - rank(b.name))) {
      const n = mediaName(r.name), type = n && MEDIA_TYPES[n.ext];
      if (!type || !known.has(n.base) || r.size > 8 * 1024 * 1024 || want[n.base]) continue;
      want[n.base] = { name: r.name, sha: r.sha, type };
    }
    return want;
  } });
  const fileOf = id => { const x = typeof LIBRARY !== 'undefined' && LIBRARY.byId[id]; return x && x.file || null; };
  // The built-in picture / clip of an exercise: { url, type } or null (none in the folder, not downloaded yet, or a custom exercise)
  const get = exerciseId => F.get(fileOf(exerciseId));
  const sync = (first = []) => F.sync(first.map(fileOf).filter(Boolean));
  return { get, sync, fileOf, set onChange(fn) { F.onChange = fn; } };
})();

// ---------- Recipes: assets/recipes/recipes.json + assets/recipes/<recipe id>.jpg | .png | .webp ----------
//   recipes.json = { "recipes": [ { "id": "tabbouleh", "category": "lunch", "name": "Tabbouleh", "serves": 2, "kcal": 180,
//                    "health": "one line", "ingredients": ["1 bunch parsley", "…"], "method": "1. …\n2. …" } ] }
//   id: small letters, digits and dashes; NEVER change or reuse one (it ties the recipe on the phones to its picture and to updates).
//   category: shakes | breakfast | lunch | snacks | dinner. The text is always fetched (tiny); the pictures only when the user said YES
//   to the recipes (setting `recipePack` = 'yes'). What a phone does with the list is in meals.js (applyPack).
const RecipePack = (() => {
  const wanted = () => { try { return S.settings.recipePack === 'yes'; } catch (e) { return false; } };
  const F = RepoFolder({ dir: 'assets/recipes', cache: 'risen.recipes', pick(rows) {
    const want = {};
    for (const r of rows) {
      if (r.name === 'recipes.json') { want['recipes.json'] = { name: r.name, sha: r.sha, type: 'application/json' }; continue; }
      const n = mediaName(r.name), type = n && /^(jpg|jpeg|png|webp)$/.test(n.ext) && MEDIA_TYPES[n.ext];
      if (!type || !wanted() || r.size > 3 * 1024 * 1024 || want['img/' + n.base]) continue;
      want['img/' + n.base] = { name: r.name, sha: r.sha, type };
    }
    return want;
  } });
  let parsed = null, parsedSha = null;
  // The recipes of the pack as last downloaded: a clean list (bad entries are dropped), or null when there is no file yet
  async function list() {
    const s = await F.sha('recipes.json'); if (!s) return null;
    if (parsed && parsedSha === s) return parsed;
    try {
      const j = JSON.parse(await (await F.blob('recipes.json')).text()), seen = new Set(), out = [];
      for (const r of (j && Array.isArray(j.recipes) ? j.recipes : [])) {
        if (!r || typeof r.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(r.id) || seen.has(r.id) || typeof r.name !== 'string' || !r.name.trim()) continue;
        seen.add(r.id);
        out.push({ id: r.id, category: String(r.category || '').toLowerCase(), name: r.name.trim().slice(0, 60),
          ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map(x => String(x).trim()).filter(Boolean),
          method: typeof r.method === 'string' ? r.method : Array.isArray(r.method) ? r.method.join('\n') : '',
          kcal: Number(r.kcal) > 0 ? Math.round(Number(r.kcal)) : null, serves: Number(r.serves) > 0 ? Number(r.serves) : null,
          health: typeof r.health === 'string' ? r.health.trim() : '' });
      }
      parsed = out; parsedSha = s; return out;
    } catch (e) { return null; }
  }
  const image = id => F.get('img/' + id);                                             // { url, type } or null
  const images = async () => new Set((await F.keys()).filter(k => k.startsWith('img/')).map(k => k.slice(4)));
  return { list, image, images, sync: force => F.sync([], force), set onChange(fn) { F.onChange = fn; } };
})();

// When: a few seconds after the app opens and every time it comes back to the front or online (never more often than every 10 minutes).
// Exercises: the program's own first.
(() => {
  const mine = () => { try { return [...new Set(S.workouts.flatMap(w => (w.exercises || []).map(e => e.exerciseId)))]; } catch (e) { return []; } };
  const go = () => { if (!document.hidden) { ExMedia.sync(mine()); RecipePack.sync(); } };
  setTimeout(go, 3000);
  document.addEventListener('visibilitychange', go);
  window.addEventListener('online', go);
})();
