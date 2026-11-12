// RELEASE: change VERSION every time you push a change (e.g. 2026-11-11.2).
// A new version makes the phone download a fresh copy of every file and delete the old one.
const VERSION = '2026-11-13.29';
const CACHE = 'risen-' + VERSION;
const CORE = ['./', 'index.html', 'db.js', 'photo.js', 'library.js', 'gym.js', 'meds.js', 'classes.js', 'meals.js', 'manifest.json', 'data/gym-classes.json',
  'assets/bg.jpg', 'assets/mark.png',
  'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/fonts/inter.woff2', 'assets/fonts/oswald.woff2',
  ...['bader', 'bahaa', 'dolly', 'elie', 'ghada', 'jad', 'mira', 'mjay', 'olga', 'patricia', 'robert', 'rouane', 'samir', 'yasmine'].map(n => 'assets/instructors/' + n + '.jpg')];

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's HTTP cache, so a new version never stores stale files
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('risen-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache-first: instant and fully offline. Fresh files arrive when VERSION changes.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: req.mode === 'navigate' }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
