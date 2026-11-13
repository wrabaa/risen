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
