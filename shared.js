// RISEN shared helpers: used by every tab, so they are written once here (loaded right after db.js).
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYNAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Line icons used in more than one place
const ICONS = {
  trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  chev: '<svg class="icon chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg>',
  x: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
  star: '<svg class="icon" viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
};

// Auto-save: runs fn after ms of quiet. flush() runs it now, but only if a change is waiting.
function debounce(fn, ms) {
  let t = null, args = [];
  const run = () => { t = null; return fn(...args); };
  const f = (...a) => { args = a; clearTimeout(t); t = setTimeout(run, ms); };
  f.flush = () => { if (t === null) return Promise.resolve(); clearTimeout(t); return Promise.resolve(run()); };
  return f;
}

// Sub-pages that slide in from the right. Pages.onClose[id] = what to do once, when that page closes.
const Pages = (() => {
  const onClose = {};
  function open(id) { const p = $(id); p.scrollTop = 0; p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); }
  function close(id) {
    const p = $(id); p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
    const f = onClose[id]; onClose[id] = null; if (f) f();
  }
  return { open, close, onClose };
})();

// The one "are you sure?" of the app: a RISEN sheet instead of the grey system box.
//   if (!(await ask({ title, text, ok: 'DELETE', danger: true }))) return;
// Resolves true (ok), false (cancel or a tap outside) or 'extra' (the optional extra button, shown first).
function ask({ title, text = '', ok = 'OK', danger = false, cancel = 'Cancel', extra = '' }) {
  return new Promise(res => {
    const w = $('askSheet'), b = $('askBody');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    b.innerHTML = `<h2>${esc(title)}</h2>${text ? `<p>${esc(text).replace(/\n/g, '<br>')}</p>` : ''}`
      + (extra ? `<button class="primary" type="button" data-ask="extra">${esc(extra)}</button>` : '')
      + `<button class="${danger ? 'dangerbtn' : 'primary'}" type="button" data-ask="ok">${esc(ok)}</button>`
      + `<button class="textbtn" type="button" data-ask="cancel">${esc(cancel)}</button>`;
    const done = v => { w.hidden = true; b.innerHTML = ''; w.onclick = null; res(v); };
    w.onclick = e => {
      const t = e.target.closest('[data-ask]');
      if (t) done(t.dataset.ask === 'ok' ? true : t.dataset.ask === 'extra' ? 'extra' : false);
      else if (e.target === w) done(false);
    };
    w.hidden = false;
  });
}

// "✓ Saved" for about a second after a change has really been written
const savedTimers = {};
function savedFlash(id) {
  const m = $(id); m.classList.add('show'); clearTimeout(savedTimers[id]);
  savedTimers[id] = setTimeout(() => m.classList.remove('show'), 1200);
}

// ---- Swipe back ----
// Swipe right anywhere on a sub-page (or Settings) = tap its "<". The page follows the finger and slides away like iOS. The back
// button of the page itself is what gets pressed, so every page closes exactly as it does today (saves, flushes, redraws).
// A short or slow swipe snaps back and does nothing. It never starts: on a top-level tab page (these are not sub-pages), while a
// text field is focused (keyboard up), on inputs / textareas / selects (sliders too), under a sheet or the photo viewer, or when
// the first movement is not clearly horizontal (vertical scrolling stays native). A region that has its own horizontal swipe
// carries data-hswipe; there only a swipe that starts at the left screen edge goes back.
const SwipeBack = (() => {
  const EDGE = 24, LOCK = 10, MIN_FRAC = 0.25, MIN_V = 0.3, SAMPLE_MS = 110;   // px · px · share of the width · px per ms · ms
  const BLOCK = 'input,textarea,select,[contenteditable],[data-noswipe]';
  let st = null, busyUntil = 0;                                // busyUntil: a swipe-back is being carried out (a time, so a stalled timer can never block it for long)
  const backBtn = p => p.querySelector('.subtop .iconbtn, .settings-top .iconbtn, button.iconbtn');
  const typing = () => { const a = document.activeElement; return document.body.classList.contains('typing') || !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };
  const overlay = () => !!document.querySelector('.sheet-wrap:not([hidden]), .pviewer.open');
  const reset = p => { p.classList.remove('dragging'); p.style.transition = ''; p.style.transform = ''; p.style.willChange = ''; };

  function start(e) {
    st = null; if (Date.now() < busyUntil || e.touches.length !== 1) return;
    const p = e.currentTarget, t = e.touches[0];
    if (!p.classList.contains('open') || e.target.closest(BLOCK) || typing() || overlay()) return;
    if (e.target.closest('[data-hswipe]') && t.clientX > EDGE) return;       // its own horizontal swipe has the job; only the edge goes back
    st = { p, x0: t.clientX, y0: t.clientY, locked: false, off0: 0, off: 0, samples: [{ t: e.timeStamp, x: t.clientX }] };
  }
  function move(e) {
    if (!st) return;
    if (e.touches.length !== 1) { if (st.locked) snap(st.p); st = null; return; }
    const t = e.touches[0], dx = t.clientX - st.x0, dy = t.clientY - st.y0;
    if (!st.locked) {
      if (Math.abs(dy) > LOCK && Math.abs(dy) > Math.abs(dx)) { st = null; return; }            // vertical: the page scrolls, we step aside
      if (dx < -LOCK) { st = null; return; }                                                      // leftwards: not ours
      if (dx > LOCK && dx > Math.abs(dy) * 2) {                                                   // clearly horizontal and to the right: lock
        st.locked = true; st.off0 = dx; st.p.classList.add('dragging'); st.p.style.transition = 'none'; st.p.style.willChange = 'transform';
      } else return;
    }
    if (e.cancelable) e.preventDefault();
    st.off = Math.max(0, dx - st.off0);
    st.p.style.transform = `translate3d(${st.off}px,0,0)`;
    st.samples.push({ t: e.timeStamp, x: t.clientX });
  }
  function velocity(samples, endT) {                           // px per ms over the last moments before the finger lifted
    const r = samples.filter(s => endT - s.t <= SAMPLE_MS);
    return r.length < 2 ? 0 : (r[r.length - 1].x - r[0].x) / Math.max(1, r[r.length - 1].t - r[0].t);
  }
  function snap(p) {                                           // back to where it was; nothing happens
    p.classList.remove('dragging'); p.style.transition = 'transform .28s cubic-bezier(.32,.72,0,1)'; p.style.transform = 'translate3d(0,0,0)';
    setTimeout(() => reset(p), 320);
  }
  function end(e) {
    if (!st) return;
    const s = st; st = null; if (!s.locked) return;
    const btn = backBtn(s.p), v = velocity(s.samples, e.timeStamp);
    if (!(e.type === 'touchend' && btn && s.off >= innerWidth * MIN_FRAC && v >= MIN_V)) return snap(s.p);
    busyUntil = Date.now() + 1500; const p = s.p;                                // slide the rest of the way out, then press the page's own "<"
    p.style.transition = 'transform .22s cubic-bezier(.32,.72,0,1)'; p.style.transform = 'translate3d(100%,0,0)';
    setTimeout(() => {
      btn.click();
      const t0 = Date.now();                                   // an async close (saving first) may take a moment: stay out of sight until it is closed
      (function wait() { if (!p.classList.contains('open') || Date.now() - t0 > 800) { reset(p); busyUntil = 0; } else setTimeout(wait, 40); })();
    }, 230);
  }
  function attach(p) {
    p.addEventListener('touchstart', start, { passive: true });
    p.addEventListener('touchmove', move, { passive: false });
    p.addEventListener('touchend', end, { passive: true });
    p.addEventListener('touchcancel', end, { passive: true });
  }
  document.querySelectorAll('.subpage, #settings').forEach(attach);
  return { attach };
})();
