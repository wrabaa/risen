// RELEASE: change VERSION every time you push a change (e.g. 2026-11-11.2).
// A new version makes the phone download a fresh copy of the APP files (pages, code, data) and delete the old one.
const VERSION = '2026-11-14.54';
const CACHE = 'risen-' + VERSION;

// APP FILES: small, change often. All of them are downloaded again on every release, all or nothing.
const CORE = ['./', 'index.html', 'styles.css', 'shared.js', 'app.js', 'db.js', 'photo.js', 'library.js', 'gym.js', 'meds.js', 'classes.js', 'meals.js', 'manifest.json', 'data/gym-classes.json'];

// IMAGES AND FONTS: big, change rarely. They live in their own cache that survives releases, so an update only
// downloads the ones that are new or changed.
//   - ADD a file      -> add a line here with the number 1.
//   - REPLACE a file  -> keep the name, raise its number by 1 (that is what tells every phone to fetch it again).
//   - REMOVE a file   -> delete its line (phones drop their copy).
// Safety net: if a file was replaced and its number was forgotten, a different file size is noticed and it is fetched anyway.
// One image that fails to download never blocks an update: it is fetched the first time it is shown, and tried again
// at the next release.
const ASSETS = {
  'assets/bg.jpg': 1,
  'assets/mark.png': 1,
  'assets/icon-180.png': 1,
  'assets/icon-192.png': 1,
  'assets/icon-512.png': 1,
  'assets/fonts/inter.woff2': 1,
  'assets/fonts/oswald.woff2': 1,
  'assets/instructors/bader.jpg': 2,
  'assets/instructors/bahaa.jpg': 2,
  'assets/instructors/dolly.jpg': 2,
  'assets/instructors/elie.jpg': 2,
  'assets/instructors/ghada.jpg': 2,
  'assets/instructors/jad.jpg': 2,
  'assets/instructors/mira.jpg': 2,
  'assets/instructors/mjay.jpg': 2,
  'assets/instructors/olga.jpg': 2,
  'assets/instructors/patricia.jpg': 2,
  'assets/instructors/robert.jpg': 2,
  'assets/instructors/rouane.jpg': 2,
  'assets/instructors/samir.jpg': 2,
  'assets/instructors/yasmine.jpg': 2,
};
// Not named "risen-…" on purpose: every cache with that prefix is an app version and gets deleted on update.
const ASSET_CACHE = 'risen.assets';
const SCOPE = self.registration.scope;
const abs = path => SCOPE + path;
const INDEX = abs('__asset-index');            // remembers which number of each file this phone has

async function syncAssets() {
  const cache = await caches.open(ASSET_CACHE);
  const idxRes = await cache.match(INDEX);
  const idx = idxRes ? await idxRes.json().catch(() => ({})) : {};
  const firstRun = !Object.keys(idx).length;   // moving from the old single cache: copy what is already on the phone
  await Promise.allSettled(Object.entries(ASSETS).map(async ([path, rev]) => {
    const url = abs(path);
    let have = idx[path] === rev ? await cache.match(url) : null;
    if (have) {                                // replaced without raising the number? the size gives it away
      try {
        const head = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        const a = head.ok && head.headers.get('content-length'), b = have.headers.get('content-length');
        if (a && b && a !== b) have = null;
      } catch (e) { /* offline: keep what we have */ }
    }
    if (have) return;
    let res = firstRun && rev === 1 ? await caches.match(url) : null;
    if (!res || !res.ok) {
      res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error(path + ' ' + res.status);
    }
    await cache.put(url, res); idx[path] = rev;
  }));
  for (const req of await cache.keys()) {      // files taken off the list
    const rel = req.url.slice(SCOPE.length);
    if (req.url !== INDEX && ASSETS[rel] == null) { await cache.delete(req); delete idx[rel]; }
  }
  for (const k of Object.keys(idx)) if (ASSETS[k] == null) delete idx[k];
  await cache.put(INDEX, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } }));
}

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's HTTP cache, so a new version never stores stale files
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))),
    syncAssets().catch(() => {}),              // images never block an update
  ]).then(() => self.skipWaiting()));
});

// The page asks "which version are you?" (Settings shows the answer). Answers on the message port, or straight back to the sender.
self.addEventListener('message', e => {
  if (e.data !== 'version') return;
  if (e.ports && e.ports[0]) e.ports[0].postMessage({ version: VERSION });
  else if (e.source) e.source.postMessage({ version: VERSION });
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('risen-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache-first: instant and fully offline. Fresh app files arrive when VERSION changes, fresh images when their number changes.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const rel = req.url.split(/[?#]/)[0].slice(SCOPE.length);
  if (ASSETS[rel] != null) {
    e.respondWith(caches.open(ASSET_CACHE).then(c => c.match(abs(rel)).then(hit => hit || fetch(req).then(res => {
      if (res.ok) c.put(abs(rel), res.clone());   // missed at install (weak connection): kept from the first time it is shown
      return res;
    }))));
    return;
  }
  e.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: req.mode === 'navigate' }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })).catch(() => req.mode === 'navigate'
    ? caches.match(abs('index.html'), { cacheName: CACHE })     // safety net: a page with no copy and no network opens the app, not the browser's error
    : Response.error()));
});
