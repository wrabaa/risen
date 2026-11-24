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
function RepoFolder({ dir, cache: CACHE, pick, deep = false, fallback = null }) {
  const API = 'https://api.github.com/repos/wrabaa/risen/contents/' + dir, DIR = dir + '/';
  const TREE = 'https://api.github.com/repos/wrabaa/risen/git/trees/main?recursive=1';      // deep folders (.105): ONE ask lists the folder AND its subfolders
  const INDEX = 'm/index.json', EVERY = 10 * 60 * 1000;                   // GitHub is asked at most every 10 minutes
  const ok = typeof caches !== 'undefined';
  let idx = null;                          // { checked: time, files: { key: { name, sha, type } } } = what is ON this phone
  const urls = new Map();                  // key -> { url, type, stamp } (object URLs, made once)
  let onChange = null, running = null;
  const DAY = 24 * 60 * 60 * 1000, GIVE_UP = 20 * 60 * 1000;
  // Is this file really the one GitHub listed? (.99) The list comes from GitHub at once, the file from the site, which follows a minute or two
  // later: a REPLACED file (same name) would otherwise be stored in its OLD form under the new `sha` and never looked at again.
  // `sha` is git's: SHA-1 of "blob <bytes>\0" + the file. Where the browser cannot hash, the file is taken as it is.
  async function gitSha(b) {
    const body = new Uint8Array(await b.arrayBuffer()), head = new TextEncoder().encode('blob ' + body.length + '\0'), all = new Uint8Array(head.length + body.length);
    all.set(head); all.set(body, head.length);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-1', all))].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  async function same(b, sha) {
    if (/^p\d+$/.test(sha)) return true;                         // .126: a stand-in "sha" from the fallback list (p + size in bytes): nothing to check against
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) return true;
      const body = new Uint8Array(await b.arrayBuffer()), head = new TextEncoder().encode('blob ' + body.length + '\0'), all = new Uint8Array(head.length + body.length);
      all.set(head); all.set(body, head.length);
      return [...new Uint8Array(await crypto.subtle.digest('SHA-1', all))].map(x => x.toString(16).padStart(2, '0')).join('') === sha;
    } catch (e) { return true; }
  }
  const stamp = r => r.sha + ':' + (r.at || 0);                // changes whenever the stored file changes

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
    const have = urls.get(key); if (have && have.stamp === stamp(rec)) return have;
    const b = await blob(key); if (!b) return null;
    if (have) URL.revokeObjectURL(have.url);
    const u = { url: URL.createObjectURL(b), type: rec.type, stamp: stamp(rec) }; urls.set(key, u); return u;
  }
  const keys = async () => Object.keys((await load()).files);
  const sig = async key => { const r = (await load()).files[key]; return r ? stamp(r) : null; };

  // Ask GitHub what is in the folder and bring this phone in line with it. Quiet: no network, no answer or a busy GitHub = nothing changes.
  //   first: keys to fetch before the others · force: do not wait for the 10 minutes (the user just asked for it)
  function sync(first = [], force = false) {
    if (running) return running;                                    // one round at a time: a second ask (pull down) waits for the same round
    return running = round(first, force).finally(() => { running = null; });
  }
  async function round(first, force) {
    if (!ok || !navigator.onLine) return;
    await load(); if (!force && Date.now() - idx.checked < EVERY) return;
    try {
      let rows = null;                                                // { type:'file', name (the file's own name), path (inside the folder, "chest/chest-press.mp4"), sha, size }
      if (deep) {                                                     // the whole repo tree in one answer; keep what sits under this folder, however deep
        try {
          const t = await fetch(TREE, { cache: 'no-store', headers: { accept: 'application/vnd.github+json' } });
          if (t.ok) { const j = await t.json(); if (j && Array.isArray(j.tree) && !j.truncated) rows = j.tree.filter(x => x && x.type === 'blob' && String(x.path).startsWith(DIR)).map(x => ({ type: 'file', path: x.path.slice(DIR.length), name: x.path.slice(x.path.lastIndexOf('/') + 1), sha: x.sha, size: x.size })); }
        } catch (e) {}
      }
      let fromFallback = false;                                       // .127: a list from the fallback may be incomplete: it never deletes what is already on the phone
      if (!rows) {                                                    // flat listing of the folder itself (recipes; and the fallback when the tree could not be read)
        try {
          const res = await fetch(API, { cache: 'no-store', headers: { accept: 'application/vnd.github+json' } });
          const flat = res.ok ? await res.json() : null;
          if (Array.isArray(flat)) rows = flat.filter(r => r && r.type === 'file').map(r => ({ type: 'file', name: r.name, path: r.name, sha: r.sha, size: r.size }));
        } catch (e) {}
        // .126 GitHub's list is limited to 60 asks an hour per network (a shared Lebanese connection can use that up): when it does not answer, the folder may
        // bring its own list from the app's own site (the RISEN recipes do: recipes.json + one picture per recipe id).
        if (!rows && fallback) { try { rows = await fallback({ gitSha }); if (rows) fromFallback = true; } catch (e) {} }
        if (!rows) return;
      }
      const want = pick(rows) || {};          // key -> { name, path, sha, type }
      const c = await caches.open(CACHE), miss = idx.miss || (idx.miss = {}); let changed = false, complete = true;
      if (!fromFallback) for (const k of Object.keys(idx.files)) if (!want[k]) { await c.delete('m/' + k); delete idx.files[k]; changed = true; }      // taken out of the folder (or no longer wanted)
      for (const k of Object.keys(miss)) if (!want[k] || want[k].sha !== miss[k].sha) delete miss[k];
      const front = new Set(first), order = Object.keys(want).sort((a, b) => front.has(b) - front.has(a));
      for (const k of order) {
        const w = want[k], have = idx.files[k], kept = have && have.sha === w.sha ? await c.match('m/' + k) : null;
        if (kept && (have.v || Date.now() - (have.u || 0) < DAY)) continue;       // on the phone and checked (or taken unchecked less than a day ago)
        if (kept && !have.u && await same(await kept.blob(), w.sha)) { have.v = 1; continue; }      // stored before .99: checked once, it is the right file
        try {
          const r = await fetch(DIR + (w.path || w.name).split('/').map(encodeURIComponent).join('/') + '?v=' + w.sha.slice(0, 8), { cache: 'no-store' });
          if (!r.ok) { complete = false; continue; }                  // the site is a minute behind the folder: next time
          const b = await r.blob(), rec = { name: w.name, path: w.path || w.name, sha: w.sha, type: w.type, at: Date.now() };
          if (await same(b, w.sha)) rec.v = 1;
          else {                                                      // the site still serves the file as it was BEFORE: not stored, asked again in 2 minutes
            const m = miss[k] || (miss[k] = { sha: w.sha, t: Date.now() });
            if (Date.now() - m.t < GIVE_UP) { complete = false; continue; }
            delete miss[k];                                           // never the right one for 20 minutes: taken as it is, so content cannot get stuck; looked at again once a day
            if (kept) { have.u = Date.now(); continue; }              // (what is on the phone is those same bytes: it stays)
            rec.u = Date.now();
          }
          delete miss[k];
          await c.put('m/' + k, new Response(b, { headers: { 'content-type': w.type } }));
          idx.files[k] = rec; changed = true; await save();
          if (onChange) onChange(k);
        } catch (e) { complete = false; break; }                       // connection lost: the rest next time
      }
      idx.checked = complete ? Date.now() : Date.now() - EVERY + 2 * 60 * 1000;      // something did not download: try again in 2 minutes, not at every return to the app (.96; GitHub allows 60 asks an hour per network)
      await save();
      if (changed && onChange) onChange(null);
    } catch (e) { /* nothing changes */ }
  }

  return { get, blob, keys, sig, sync, set onChange(fn) { onChange = fn; } };
}

const MEDIA_TYPES = { mp4: 'video/mp4', mov: 'video/quicktime', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const mediaName = n => { const m = /^(.+)\.([a-z0-9]+)$/i.exec(n); return m ? { base: m[1].toLowerCase(), ext: m[2].toLowerCase() } : null; };

// ---------- Exercises: assets/exercises/<file>.mp4 | .mov | .jpg | .png | .webp | .gif ----------
//   a clip wins over a picture of the same exercise · over 8 MB is skipped · the user's own photo / clip always wins (gym.js, photo.js)
const ExMedia = (() => {
  const rank = n => /\.(mp4|mov)$/i.test(n) ? 0 : 1;                 // a clip before a picture
  // .105: the clips sit in body-part folders (assets/exercises/chest/…, back/, shoulders/, legs/, glutes/, arms/, core/, cardio/, flexibility/, rest/).
  // A clip is found by its FILE NAME wherever it sits (a clip in the wrong folder, or loose in assets/exercises/, still works). Day Off may have
  // several clips: day-off, day-off-2, day-off-3 … (one is picked at random each time the app opens, `dayOff()`).
  const F = RepoFolder({ dir: 'assets/exercises', cache: 'risen.exmedia', deep: true, pick(rows) {
    const known = new Set(LIBRARY.list.map(e => e.file)), want = {};
    for (const r of rows.sort((a, b) => rank(a.name) - rank(b.name))) {
      const n = mediaName(r.name), type = n && MEDIA_TYPES[n.ext];
      // .115 STILLS: a picture in assets/exercises/still/ is the small still shown in the gym DAY list (stored under the key 'still/<name>'); it is never the exercise's own picture / clip
      if (/(^|\/)still\//i.test(r.path || '')) {
        if (n && /^(jpg|jpeg|png|webp)$/.test(n.ext) && type && (known.has(n.base) || /^day-off(-\d+)?$/.test(n.base)) && r.size <= 2 * 1024 * 1024 && !want['still/' + n.base]) want['still/' + n.base] = { name: r.name, path: r.path, sha: r.sha, type };
        continue;
      }
      if (!type || !(known.has(n.base) || /^day-off-\d+$/.test(n.base)) || r.size > 8 * 1024 * 1024 || want[n.base]) continue;
      want[n.base] = { name: r.name, path: r.path, sha: r.sha, type };
    }
    return want;
  } });
  const fileOf = id => { const x = typeof LIBRARY !== 'undefined' && LIBRARY.byId[id]; return x && x.file || null; };
  // The built-in picture / clip of an exercise: { url, type } or null (none in the folder, not downloaded yet, or a custom exercise)
  let dayPick = null;                      // the Day Off clip of this opening of the app
  async function dayOff() {                // day-off, day-off-2, … : one at random, never the same as the last opening, the same one all through this opening
    const ks = (await F.keys()).filter(k => /^day-off(-\d+)?$/.test(k)).sort(); if (!ks.length) return null;
    if (!dayPick || !ks.includes(dayPick)) {
      let last = ''; try { last = localStorage.getItem('risen.dayoff') || ''; } catch (e) {}
      const pool = ks.length > 1 ? ks.filter(k => k !== last) : ks;
      dayPick = pool[Math.floor(Math.random() * pool.length)];
      try { localStorage.setItem('risen.dayoff', dayPick); } catch (e) {}
    }
    return F.get(dayPick);
  }
  const get = async exerciseId => fileOf(exerciseId) === 'day-off' ? dayOff() : ((await F.get(fileOf(exerciseId))) || F.get('still/' + fileOf(exerciseId)));      // the clip, else (.115) the still as the picture
  const still = exerciseId => { const f = fileOf(exerciseId); return f && f !== 'day-off' ? F.get('still/' + f) : Promise.resolve(null); };         // Day Off has no still: its page plays a (shuffled) clip, `.121`         // .115: the small still of the day list
  const sync = (first = [], force = false) => F.sync([].concat(first.map(fileOf).filter(Boolean).map(f => 'still/' + f), first.map(fileOf).filter(Boolean)), force);
  // `.122`: what the list row shows for an exercise right now, as a short code. When a download finishes, a row whose code did not change is left alone
  // (before, EVERY finished file redrew every built-in row, so a playing Day Off clip started over at each of the ~20 downloads).
  const sigOf = async exerciseId => {
    const f = fileOf(exerciseId); if (!f) return null;
    if (f === 'day-off') { const ks = (await F.keys()).filter(k => /^day-off(-\d+)?$/.test(k)); return dayPick && ks.includes(dayPick) ? dayPick + (await F.sig(dayPick)) : null; }
    const a = await F.sig('still/' + f); if (a) return 'S' + a;
    const b = await F.sig(f); return b ? 'C' + b : null;
  };
  return { get, still, sigOf, sync, fileOf, set onChange(fn) { F.onChange = fn; } };
})();

// ---------- Recipes: assets/recipes/recipes.json + assets/recipes/<recipe id>.jpg | .png | .webp ----------
//   recipes.json = { "recipes": [ { "id": "tabbouleh", "category": "lunch", "name": "Tabbouleh", "serves": 2, "kcal": 180,
//                    "health": "one line", "ingredients": ["1 bunch parsley", "…"], "method": "1. …\n2. …" } ] }
//   id: small letters, digits and dashes; NEVER change or reuse one (it ties the recipe on the phones to its picture and to updates).
//   category: shakes | breakfast | lunch | snacks | dinner. The text is always fetched (tiny); the pictures only when the user said YES
//   to the recipes (setting `recipePack` = 'yes'). What a phone does with the list is in meals.js (applyPack).
const RecipePack = (() => {
  const wanted = () => { try { return S.settings.recipePack === 'yes'; } catch (e) { return false; } };
  const F = RepoFolder({ dir: 'assets/recipes', cache: 'risen.recipes', async fallback({ gitSha }) {
    // GitHub did not give the list: read recipes.json from the app's own site and look for each recipe's picture there (a 'p<size>' stand-in marks a change)
    const r = await fetch('assets/recipes/recipes.json?v=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return null;
    const b = await r.blob(), rows = [{ type: 'file', name: 'recipes.json', path: 'recipes.json', sha: await gitSha(b), size: b.size }];
    if (!wanted()) return rows;
    let j = null; try { j = JSON.parse(await b.text()); } catch (e) {}
    const ids = (j && Array.isArray(j.recipes) ? j.recipes : []).map(x => x && x.id).filter(id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(id));
    const found = await Promise.all(ids.map(async id => {
      for (const ext of ['jpg', 'png', 'webp']) {
        try { const h = await fetch('assets/recipes/' + id + '.' + ext, { method: 'HEAD', cache: 'no-store' }); const n = Number(h.headers.get('content-length')); if (h.ok) return { type: 'file', name: id + '.' + ext, path: id + '.' + ext, sha: 'p' + (n > 0 ? n : 1), size: n || 0 }; } catch (e) {}
      }
      return null;
    }));
    return rows.concat(found.filter(Boolean));
  }, pick(rows) {
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
    const s = await F.sig('recipes.json'); if (!s) return null;
    if (parsed && parsedSha === s) return parsed;
    try {
      const j = JSON.parse(await (await F.blob('recipes.json')).text()), seen = new Set(), out = [];
      if (!j || !Array.isArray(j.recipes)) return null;               // a wrong-shaped file is treated like a broken one: nothing changes on the phone (.96). Only a real, empty "recipes": [] empties the pack
      for (const r of j.recipes) {
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
  const imageBlob = id => F.blob('img/' + id);                                        // the picture's bytes (the TRY TODAY card makes its own URL from them)
  const images = async () => new Set((await F.keys()).filter(k => k.startsWith('img/')).map(k => k.slice(4)));
  // .129: what the phone can reach, in plain words (shown when the recipes cannot be found)
  async function diag() {
    const t = async (label, url) => { try { const r = await fetch(url, { cache: 'no-store' }); return label + ': ' + r.status; } catch (e) { return label + ': no answer'; } };
    return [await t('GitHub list', 'https://api.github.com/repos/wrabaa/risen/contents/assets/recipes'), await t('Recipe file', 'assets/recipes/recipes.json?v=' + Date.now()), 'Online: ' + (navigator.onLine ? 'yes' : 'no')].join('\n');
  }
  return { list, image, imageBlob, images, diag, sync: force => F.sync([], force), set onChange(fn) { F.onChange = fn; } };
})();

// ---------- Intro clips: assets/bg.mp4 (built in) + assets/intro/<any name>.mp4 ----------
//   .106: several intro clips. Each time the app is opened ONE is picked at random (the built-in bg.mp4 is one of them), never the one of the last opening,
//   and it plays for that whole opening. Clips in assets/intro/ come by themselves like the exercise clips (no release; over 8 MB is skipped).
//   With no internet, or before they were downloaded, only bg.mp4 is in the draw. The video starts on assets/bg.mp4 straight from index.html (`.123`); this only swaps the src when an extra clip is picked.
const IntroMedia = (() => {
  const F = RepoFolder({ dir: 'assets/intro', cache: 'risen.intro', pick(rows) {
    const want = {};
    for (const r of rows) { const n = mediaName(r.name); if (!n || (n.ext !== 'mp4' && n.ext !== 'mov') || r.size > 8 * 1024 * 1024 || want[n.base]) continue; want[n.base] = { name: r.name, path: r.name, sha: r.sha, type: MEDIA_TYPES[n.ext] }; }
    return want;
  } });
  async function start() {
    const v = document.querySelector('#intro video'); if (!v) return;
    const play = src => { v.removeAttribute('poster'); v.src = src; try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };      // `.123`: only for an EXTRA clip; bg.mp4 is already the video's own src in index.html, so it starts at first paint
    let keys = []; try { keys = await F.keys(); } catch (e) {}
    const all = ['bg', ...keys.sort()]; let last = ''; try { last = localStorage.getItem('risen.intro') || ''; } catch (e) {}
    const pool = all.length > 1 ? all.filter(k => k !== last) : all, pick = pool[Math.floor(Math.random() * pool.length)];
    try { localStorage.setItem('risen.intro', pick); } catch (e) {}
    if (pick !== 'bg') { let g = null; try { g = await F.get(pick); } catch (e) {} if (g) play(g.url); }      // nothing to change for bg (or when the extra clip is not there): leave the src alone, it keeps playing
  }
  start();
  return { sync: force => F.sync([], force) };
})();

// When: a few seconds after the app opens and every time it comes back to the front or online (never more often than every 10 minutes).
// Exercises: the program's own first.
(() => {
  const mine = () => { try { return [...new Set(S.workouts.flatMap(w => (w.exercises || []).map(e => e.exerciseId)))]; } catch (e) { return []; } };
  const go = () => { if (!document.hidden) { ExMedia.sync(mine()); RecipePack.sync(); IntroMedia.sync(); } };
  // Pull down to refresh (.97, app.js): ask GitHub about both folders NOW, without the 10-minute wait
  window.RepoNow = () => Promise.all([ExMedia.sync(mine(), true), RecipePack.sync(true), IntroMedia.sync(true)]);
  setTimeout(go, 3000);
  document.addEventListener('visibilitychange', go);
  window.addEventListener('online', go);
})();
