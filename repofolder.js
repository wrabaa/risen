// RepoFolder (`.138`): the engine that keeps a repo folder's files on the phone (moved here from media.js, unchanged, so baking.html can use it
// without the Gym / Meals / intro parts of media.js). How it works: see the top of media.js.
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
        if (!kept && have) {                                          // .134: the same file under the other kind of list: keep it, never download it again
          const m = await c.match('m/' + k), ob = m ? await m.blob() : null;
          if (ob && /^p\d+$/.test(w.sha) && 'p' + ob.size === w.sha) continue;                  // fallback list, same size as the stored file = that file
          if (ob && /^p\d+$/.test(have.sha) && !/^p\d+$/.test(w.sha)) {                         // stored from the fallback list, GitHub's list is back: check the bytes once
            let h = null; try { h = await gitSha(ob); } catch (e) {}
            if (h === w.sha) { have.sha = w.sha; have.v = 1; changed = true; await save(); continue; }
          }
        }
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


// The baking pictures (`.138`/`.141`): assets/baking/<category id>/<recipe id>.jpg|png|webp and assets/baking/main/<category id>.jpg (≤3 MB).
// Used by baking.html (all screens) and by Siza's Home card 07 BAKING (one picture per opening). Same cache, so a picture is downloaded once.
function BakingPics() {
  const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  return RepoFolder({ dir: 'assets/baking', cache: 'risen.baking', deep: true, pick(rows) {
    const want = {};
    for (const r of rows) {
      const m = /^([a-z0-9-]+)\/([a-z0-9_-]+)\.(jpg|jpeg|png|webp)$/i.exec(r.path || '');
      if (!m || r.size > 3 * 1024 * 1024) continue;
      const k = (m[1] + '/' + m[2]).toLowerCase(); if (want[k]) continue;
      want[k] = { name: r.name, path: r.path, sha: r.sha, type: TYPES[m[3].toLowerCase()] };
    }
    return want;
  } });
}
