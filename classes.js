// RISEN Classes tab. The main screen is TODAY'S TIMELINE (swipe or tap a weekday for another day, WEEK for the 7-day list)
// with live timing, ⭐ my classes, an instructor page (tap a photo) and my stats. Tap a class to edit it. The tab also has the
// instructors list. Until it is answered, opening the tab asks to load the gym's schedule from data/gym-classes.json.
// Uses the shared helpers from index.html (S, load, renderHome, show, toast, esc, dayKey, isoDay, weekDays).
const Classes = (() => {
  const STUDIO_ORDER = ['Energy', 'Balance', 'Power'];
  const CHEV = ICONS.chev, TRASH = ICONS.trash;

  let filter = 'ALL';                 // 'ALL', 'MINE' (starred classes) or one studio (not saved: starts on ALL)
  let lastDay = dayKey(new Date());

  // ================= Small helpers =================
  const pad = n => String(n).padStart(2, '0');
  const hm = t => String(t).replace(/^0/, '');                                   // 09:00 -> 9:00
  const toMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  const addMin = (t, m) => { const x = ((toMin(t) + m) % 1440 + 1440) % 1440; return pad(Math.floor(x / 60)) + ':' + pad(x % 60); };
  const range = c => `${c.time}–${addMin(c.time, c.duration || 60)}`;
  const fmtDay = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };

  // ================= Data selectors =================
  const inst = id => S.instructors.find(i => i.id === id) || null;
  const attId = (classId, date) => `${classId}|${date}`;
  const attMap = () => new Map(S.classlogs.map(l => [l.id, l]));
  function studios() {                // the studios in use: Energy, Balance, Power first, then any others
    const u = [...new Set(S.classes.map(c => c.studio).filter(Boolean))], rank = s => { const i = STUDIO_ORDER.indexOf(s); return i < 0 ? 9 : i; };
    return u.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }
  const byTime = (a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name);
  const classesOn = d => S.classes.filter(c => c.day === d && (filter === 'ALL' || (filter === 'MINE' ? c.star : c.studio === filter))).sort(byTime);
  function lastAttended(classId) { const ds = S.classlogs.filter(l => l.classId === classId).map(l => l.date).sort(); return ds.length ? ds[ds.length - 1] : null; }

  // For the Home tile: the next STARRED class today that is not attended yet; with none left, the next class of any kind.
  // (One that has started but not ended counts as "now".)
  function next() {
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), k = dayKey(now), att = attMap();
    const today = S.classes.filter(c => c.day === isoDay(now)).sort(byTime);
    if (!today.length) return { none: 'today' };
    const left = today.filter(x => !att.has(attId(x.id, k)) && toMin(x.time) + (x.duration || 60) > nowMin);
    const c = left.find(x => x.star) || left[0];
    return c ? { c, i: inst(c.instructorId), now: toMin(c.time) <= nowMin, star: !!c.star } : { none: 'more' };
  }

  // ================= Instructor photos =================
  // A seed instructor's photo is a file in the app; a photo chosen on the phone is kept in the photo store and wins.
  const custom = new Set();           // instructor ids that have a photo of their own
  const urls = new Map();             // instructor id -> object URL of that photo
  function initials(name) { const w = String(name).trim().split(/\s+/); return ((w[0] || '')[0] || '') + (w.length > 1 ? w[w.length - 1][0] : ''); }
  const photoSrc = i => i ? ((custom.has(i.id) && urls.get(i.id)) || i.photo || null) : null;
  function avatar(i, size = '') {     // round photo, or initials; "TBA" when the class has no instructor
    const src = photoSrc(i);
    return `<span class="avatar ${size}">${src ? `<img alt="" src="${esc(src)}">` : `<b>${i ? esc(initials(i.name)) : 'TBA'}</b>`}</span>`;
  }
  async function warm() {             // learn which instructors have a phone photo, and prepare them
    try {
      const ids = (await RisenDB.photoKeys()).filter(k => String(k).startsWith('inst-')).map(k => String(k).slice(5));
      custom.clear(); ids.forEach(id => custom.add(id));
      for (const id of [...urls.keys()]) if (!custom.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      for (const id of ids) if (!urls.has(id)) { const p = await RisenDB.getPhoto('inst-' + id); if (p) urls.set(id, URL.createObjectURL(p.blob)); }
    } catch (e) { /* the original photos still show */ }
  }
  async function setInstPhoto(id, file) {
    const r = await PhotoSlot.resize(file); await RisenDB.setPhoto('inst-' + id, r.blob, r.width, r.height);
    if (urls.get(id)) URL.revokeObjectURL(urls.get(id)); custom.add(id); urls.set(id, URL.createObjectURL(r.blob));
  }
  async function removeInstPhoto(id) {
    await RisenDB.deletePhoto('inst-' + id); if (urls.get(id)) URL.revokeObjectURL(urls.get(id)); custom.delete(id); urls.delete(id);
  }

  // ================= Pages =================
  const openPage = Pages.open, closePage = Pages.close, onClose = Pages.onClose;
  document.querySelectorAll('[data-cls-close]').forEach(b => b.onclick = () => { document.activeElement.blur(); closePage(b.dataset.clsClose); });
  const PAGES = ['clsEditPage', 'instEditPage', 'instPage', 'instViewPage'];
  const closeAll = () => PAGES.forEach(id => $(id).classList.contains('open') && closePage(id));
  const flashSaved = savedFlash;

  // ================= First open: load the schedule? =================
  function askSeed() { $('clsSheet').hidden = false; }
  const notNow = () => { $('clsSheet').hidden = true; };          // not answered: it is asked again the next time the tab opens
  $('clsLater').onclick = notNow; $('clsX').onclick = notNow;
  $('clsSheet').addEventListener('click', e => { if (e.target === $('clsSheet')) notNow(); });
  $('clsNo').onclick = async () => {
    await RisenDB.setSetting('classesAsked', true); S.settings.classesAsked = true; $('clsSheet').hidden = true; render();
  };
  $('clsYes').onclick = async () => {
    const yes = $('clsYes'), no = $('clsNo'); yes.disabled = no.disabled = true; yes.textContent = 'LOADING…';
    try {
      const r = await fetch('data/gym-classes.json'); if (!r.ok) throw new Error('not found');
      const d = await r.json();
      await RisenDB.seedClasses({
        instructors: d.instructors.map(i => ({ id: i.id, name: i.name, photo: i.photo || null })),
        classes: d.classes.map(c => ({ id: c.id || RisenDB.uid(), seed: true, name: c.name, studio: c.studio || '', day: c.day, time: c.time, duration: c.duration || 60, instructorId: c.instructor || null, notes: '' })),
      });
      await load(); S.settings.classesAsked = true; S.settings.classIdsMatched = true; $('clsSheet').hidden = true; render(); renderHome();
      toast(`Loaded ${d.classes.length} classes`);
    } catch (e) { toast('Could not load the schedule. Check your connection and try again.'); }
    yes.disabled = no.disabled = false; yes.textContent = 'YES';
  };

  // ================= THE MAIN SCREEN: today's timeline, or the week =================
  let mode = 'day';                   // 'day' = one day's timeline (the default), 'week' = the 7-day list
  let viewDay = isoDay(new Date());   // the day shown in 'day' mode (1 = Monday ... 7 = Sunday)
  let lastMin = -1, slide = '';       // minute last drawn (live timing) and direction of the last day change (animation)
  const nowMinutes = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const inText = m => m < 60 ? `${m} min` : (m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 60)} h`);
  const studioClass = s => s ? 'st-' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';   // st-energy, st-balance, st-power ...
  const tagHtml = s => s ? `<span class="tag ${studioClass(s)}">${esc(s)}</span>` : '';
  const STAR = ICONS.star;

  function chipsHtml() {
    if (!S.classes.length) return '';
    const chips = [['ALL', 'ALL'], ['MINE', `${STAR} MINE`], ...studios().map(x => [x, esc(x.toUpperCase())])];
    return `<div class="chips sm" style="margin:0 0 16px">${chips.map(([v, l]) => `<button type="button" data-filter="${esc(v)}" aria-pressed="${filter === v}">${l}</button>`).join('')}</div>`;
  }

  function render() {
    lastDay = dayKey(new Date()); lastMin = nowMinutes();
    if (filter !== 'ALL' && filter !== 'MINE' && !studios().includes(filter)) filter = 'ALL';
    $('clsWeek').innerHTML = mode === 'week' ? weekHtml() : dayHtml();
  }

  // ---- a day: header, filter, weekday strip, timeline ----
  function dayHtml() {
    const d = viewDay, tIso = isoDay(new Date()), isToday = d === tIso, date = weekDays()[d - 1];
    const meta = date.toLocaleDateString('en-GB', isToday ? { weekday: 'long', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });
    let h = `<div class="gh"><h2>${isToday ? 'Today' : DAYNAMES[d - 1]}</h2><span class="gh-r"><span class="meta">${meta}</span><button type="button" class="ghost sm" data-act="week">WEEK</button></span></div>`;
    h += chipsHtml();
    h += `<div class="dstrip">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="dsd${n === d ? ' sel' : ''}${n === tIso ? ' tod' : ''}" data-goday="${n}" aria-label="${DAYNAMES[n - 1]}"${n === d ? ' aria-current="true"' : ''}>${'MTWTFSS'[n - 1]}</button>`).join('')}</div>`;
    const list = classesOn(d), att = attMap(), k = dayKey(new Date()), nowM = nowMinutes();
    let body;
    if (!S.classes.length) body = `<div class="card empty"><div class="wname">No classes yet</div><div class="sub">Add your own with the button below.</div></div>`;
    else if (!list.length) body = `<div class="card empty"><div class="wname">${filter === 'MINE' ? 'No starred classes' : 'No classes'}</div><div class="sub">${filter === 'MINE'
      ? (S.classes.some(c => c.star) ? 'None of your starred classes is on this day.' : 'Tap the star on a class to add it to MINE.') : 'Nothing is scheduled on this day.'}</div></div>`;
    else {
      const parts = []; let nowDone = !isToday;                   // the NOW line sits between the classes that have started and the ones still to come
      for (const c of list) {
        if (!nowDone && toMin(c.time) > nowM) { parts.push(nowLine(nowM)); nowDone = true; }
        parts.push(classCard(c, isToday, att, k, nowM));
      }
      if (!nowDone) parts.push(nowLine(nowM));
      body = `<div class="gstack">${parts.join('')}</div>`;
    }
    return h + `<div class="dlist${slide ? ' ' + slide : ''}">${body}</div><button class="primary" type="button" data-act="add" style="margin-top:18px">+ ADD CLASS</button>`;
  }
  const nowLine = m => `<div class="nowline"><span>NOW · ${pad(Math.floor(m / 60))}:${pad(m % 60)}</span></div>`;
  function classCard(c, today, att, k, nowM) {
    const i = inst(c.instructorId), done = today && att.has(attId(c.id, k)), s = toMin(c.time), e = s + (c.duration || 60);
    const st = !today ? '' : nowM >= e ? 'past' : nowM >= s ? 'live' : 'soon';       // live timing: only for today
    const status = st === 'live' ? '<div class="stat"><span class="livepill">LIVE NOW</span></div>' : st === 'soon' ? `<div class="stat starts">Starts in ${inText(s - nowM)}</div>` : '';
    const av = i ? `<button class="avbtn" type="button" data-instview="${esc(i.id)}" aria-label="${esc(i.name)}: classes this week">${avatar(i)}</button>` : avatar(i);
    return `<div class="card cls${st ? ' ' + st : ''}${c.star ? ' mine' : ''}"><div class="clsrow">${av}
      <button class="wmain" data-open="${esc(c.id)}"><div class="xt"><div class="t">${esc(c.name)}</div><div class="s">${range(c)}</div>${status}
        <div class="s ctag">${tagHtml(c.studio)}${i ? esc(i.name) : 'TBA'}</div></div>${CHEV}</button>
      <button class="starbtn${c.star ? ' on' : ''}" type="button" data-star="${esc(c.id)}" aria-pressed="${!!c.star}" aria-label="${c.star ? 'Unstar' : 'Add to my classes'}">${STAR}</button></div>
      ${today ? `<button class="attbtn${done ? ' on' : ''}" data-att="${esc(c.id)}">✓ ATTENDED</button>` : ''}</div>`;
  }

  // ---- the week: 7 day rows, instructors link, my stats ----
  function weekHtml() {
    const tIso = isoDay(new Date()), wk = weekDays();
    const fm = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    let h = `<div class="gh"><h2>Classes</h2><span class="gh-r"><span class="meta">${fm(wk[0])} – ${fm(wk[6])}</span><button type="button" class="ghost sm" data-act="today">TODAY</button></span></div>` + chipsHtml() + '<div class="gstack">';
    for (let d = 1; d <= 7; d++) {
      const list = classesOn(d), n = list.length;
      h += `<button class="card dayrow${d === tIso ? ' today' : ''}" data-day="${d}"><div class="wrow"><span class="wdn">${DAYS[d - 1].toUpperCase()}</span>
        <div class="wdm">${n ? `<div class="m">${n} class${n === 1 ? '' : 'es'}</div><div class="s tline">${list.map(c => c.star ? `<b class="stt">${hm(c.time)}</b>` : hm(c.time)).join(' · ')}</div>` : '<div class="s">No classes</div>'}</div>${CHEV}</div></button>`;
    }
    return h + `</div><div class="proglink"><span>Instructors: <b>${S.instructors.length}</b></span><button class="linkbtn" data-act="instructors">Manage instructors</button></div>` + statsHtml();
  }
  // "8 classes this month · favourite: BodyPump · most with: Mjay" (this calendar month, from the attendance log)
  function statsHtml() {
    const ym = dayKey(new Date()).slice(0, 7), logs = S.classlogs.filter(l => String(l.date).startsWith(ym));
    if (!S.classes.length && !logs.length) return '';
    const byName = new Map(), byInst = new Map();
    for (const l of logs) {
      const c = S.classes.find(x => x.id === l.classId); if (!c) continue;       // a class that is gone still counts in the total, but not below
      const nk = String(c.name).trim().toLowerCase(), e = byName.get(nk) || { name: String(c.name).trim(), n: 0 }; e.n++; byName.set(nk, e);
      const i = c.instructorId && inst(c.instructorId); if (i) { const e2 = byInst.get(i.id) || { name: i.name.split(' ')[0], n: 0 }; e2.n++; byInst.set(i.id, e2); }
    }
    const top = m => [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))[0];
    const n = logs.length, fav = top(byName), who = top(byInst);
    const line = n ? [`<b>${n}</b> class${n === 1 ? '' : 'es'} this month`, fav ? `favourite: <b>${esc(fav.name)}</b>` : '', who ? `most with: <b>${esc(who.name)}</b>` : ''].filter(Boolean).join(' · ') : 'No classes attended this month yet';
    return `<div class="card statscard"><div class="statlabel">My stats</div><div class="stline">${line}</div></div>`;
  }

  // ---- moving between days ----
  // Today's timeline opens scrolled to what is happening now: the live class, or the next one (the finished ones sit above, dimmed).
  function scrollToNow() {
    const v = $('view-classes'); v.scrollTop = 0;
    if (mode !== 'day' || viewDay !== isoDay(new Date())) return;
    if (!$('clsWeek').querySelector('.card.cls.past')) return;                 // nothing has finished yet: stay at the top, header and all
    const c = $('clsWeek').querySelector('.card.cls:not(.past)') || $('clsWeek').querySelector('.nowline'); if (!c) return;
    v.scrollTop = Math.max(0, c.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - 14);
  }
  function goDay(n, dir) {
    if (n === viewDay) return;
    slide = dir || (n > viewDay ? 'next' : 'prev'); viewDay = n; render(); slide = ''; scrollToNow();
  }
  const step = dir => goDay(((viewDay - 1 + dir + 7) % 7) + 1, dir > 0 ? 'next' : 'prev');   // Sunday -> Monday and back
  { // swipe left = next day, swipe right = previous day (day timeline only; not from the screen edges, which belong to the phone)
    const vc = $('view-classes'); let tx = 0, ty = 0, tt = 0, on = false;
    vc.addEventListener('touchstart', e => { const t = e.touches[0]; on = e.touches.length === 1 && mode === 'day' && t.clientX > 24 && t.clientX < innerWidth - 24; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
    vc.addEventListener('touchcancel', () => { on = false; }, { passive: true });
    vc.addEventListener('touchend', e => {
      if (!on) return; on = false;
      const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - tt < 800) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  async function toggleStar(id) {
    const c = S.classes.find(x => x.id === id); if (!c) return;
    const rec = { ...c }; if (rec.star) delete rec.star; else rec.star = true;
    try { await RisenDB.saveClass(rec); } catch (err) { toast(err.message); return; }
    S.classes = S.classes.map(x => x.id === id ? rec : x);
    render(); renderHome();
  }

  $('clsWeek').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.filter) { filter = d.filter; return render(); }
    if (d.goday) return goDay(+d.goday);
    if (d.day) { mode = 'day'; viewDay = +d.day; slide = ''; render(); scrollToNow(); return; }     // a row of the week
    if (d.act === 'week') { mode = 'week'; slide = ''; render(); $('view-classes').scrollTop = 0; return; }
    if (d.act === 'today') { mode = 'day'; viewDay = isoDay(new Date()); slide = ''; render(); scrollToNow(); return; }
    if (d.act === 'instructors') return openInstructors();
    if (d.act === 'add') return openClass(null);
    if (d.open) return openClass(d.open);
    if (d.instview) return openInstView(d.instview);
    if (d.star) return toggleStar(d.star);
    if (d.att) {
      const id = attId(d.att, dayKey(new Date())); let attended = false;
      if (attMap().has(id)) {
        if (!(await ask({ title: 'Mark as not attended?', ok: 'YES, UNDO' }))) return;
        await RisenDB.unattendClass(id); S.classlogs = S.classlogs.filter(l => l.id !== id);
      } else { S.classlogs.push(await RisenDB.attendClass(d.att, dayKey(new Date()))); attended = true; }
      render(); renderHome(); if (attended) Motion.pop([...document.querySelectorAll('#clsWeek [data-att]')].find(b => b.dataset.att === d.att));
    }
  });

  // ================= The instructor page (tap an instructor's photo): big photo, name, all their classes this week =================
  let viewInst = null;
  function openInstView(id) {
    if (!inst(id)) return;
    viewInst = id; renderInstView(); openPage('instViewPage');
    onClose.instViewPage = () => { viewInst = null; render(); renderHome(); };
  }
  function renderInstView() {
    const i = inst(viewInst); if (!i) return;
    const src = photoSrc(i), tIso = isoDay(new Date()), list = S.classes.filter(c => c.instructorId === i.id).sort((a, b) => a.day - b.day || byTime(a, b));
    let h = `<div class="bigph">${src ? `<img alt="" src="${esc(src)}">` : `<b>${esc(initials(i.name))}</b>`}</div>
      <div class="gh" style="margin-top:18px"><h2>${esc(i.name)}</h2><span class="meta">${list.length} class${list.length === 1 ? '' : 'es'} this week</span></div>`;
    if (!list.length) h += '<div class="card empty"><div class="sub">No classes this week.</div></div>';
    for (let d = 1; d <= 7; d++) {
      const ds = list.filter(c => c.day === d); if (!ds.length) continue;
      h += `<div class="label">${d === tIso ? 'Today' : DAYNAMES[d - 1]}</div><div class="gstack">${ds.map(c => `<button type="button" class="card ivrow${c.star ? ' mine' : ''}" data-gotoday="${d}"><div class="wrow"><div class="xt"><div class="t">${esc(c.name)}</div>
        <div class="s ctag"><span>${range(c)}</span>${tagHtml(c.studio)}</div></div>${c.star ? `<span class="starmark" aria-label="My class">${STAR}</span>` : ''}${CHEV}</div></button>`).join('')}</div>`;
    }
    $('instViewBody').innerHTML = h;
  }
  $('instViewBody').addEventListener('click', e => {
    const t = e.target.closest('[data-gotoday]'); if (!t) return;
    mode = 'day'; viewDay = +t.dataset.gotoday; slide = ''; closePage('instViewPage'); scrollToNow();     // its onClose redraws the timeline
  });

  // ================= LEVEL 3: THE CLASS =================
  let cls = null, clsSaved = false;          // clsSaved: has it been written to the database yet?
  const clsProblem = () => !cls.name.trim() ? 'Add a name to save this class.' : !cls.time ? 'Add a time to save this class.' : '';
  function clsNormal() {
    const c = cls, dur = parseInt(c.duration, 10);
    return { id: c.id, name: c.name.trim(), studio: c.studio.trim(), day: c.day, time: c.time, duration: dur > 0 ? dur : 60, instructorId: c.instructorId || null, notes: c.notes.trim(),
      ...(c.seed ? { seed: true } : {}), ...(c.star ? { star: true } : {}) };          // a class from the gym schedule stays marked as one when it is edited
  }
  const saveCls = debounce(async () => {
    if (!cls || clsProblem()) return;
    try {
      const rec = clsNormal(); await RisenDB.saveClass(rec); clsSaved = true;
      S.classes = S.classes.some(x => x.id === rec.id) ? S.classes.map(x => x.id === rec.id ? rec : x) : [...S.classes, rec];
      flashSaved('clsSaved');
    } catch (err) { toast(err.message); }
  }, 400);
  function clsHint() { const p = cls && clsProblem(), h = $('cHint'); if (h) { h.textContent = p || ''; h.hidden = !p; } }
  let clsDirty = false;                 // something was changed in the class editor since it opened
  const clsTouch = () => { clsDirty = true; clsHint(); saveCls(); };

  function openClass(id) {
    const ex = id ? S.classes.find(c => c.id === id) : null;
    clsSaved = !!ex; clsDirty = false;
    cls = ex ? JSON.parse(JSON.stringify(ex)) : { id: RisenDB.uid(), name: '', studio: filter !== 'ALL' ? filter : (studios()[0] || ''), day: viewDay, time: '18:00', duration: 60, instructorId: null, notes: '' };
    cls.notes = cls.notes || ''; cls.studio = cls.studio || '';
    $('clsEditTitle').textContent = ex ? 'Class' : 'New class';
    renderClassEditor(); openPage('clsEditPage');
    onClose.clsEditPage = async () => { await finishClass(); };
    if (!ex) setTimeout(() => $('cName').focus(), 320);
  }
  function bigPhoto() {
    const i = inst(cls.instructorId), src = photoSrc(i);
    return `<div class="bigph">${src ? `<img alt="" src="${esc(src)}">` : `<b>${i ? esc(initials(i.name)) : 'TBA'}</b>`}</div>`;
  }
  function renderClassEditor() {
    const c = cls, la = lastAttended(c.id);
    const insts = [...S.instructors].sort((a, b) => a.name.localeCompare(b.name));
    $('clsEditBody').innerHTML = `<div id="cPhoto">${bigPhoto()}</div>
      <p class="note hint" id="cHint" hidden style="margin-top:14px"></p>
      <div class="label">Class name</div><input class="field" id="cName" type="text" maxlength="40" autocapitalize="words" autocomplete="off" enterkeyhint="done" placeholder="e.g. Spinning" value="${esc(c.name)}">
      <div class="label">Studio</div><input class="field" id="cStudio" type="text" maxlength="30" autocapitalize="words" autocomplete="off" enterkeyhint="done" placeholder="e.g. Energy" value="${esc(c.studio)}">
      ${studios().length ? `<div class="chips" style="margin-top:10px" id="cStudios">${studios().map(s => `<button type="button" data-cst="${esc(s)}" aria-pressed="${c.studio === s}">${esc(s)}</button>`).join('')}</div>` : ''}
      <div class="label">Day</div><div class="days-pick" id="cDays">${DAYS.map((d, i) => `<button type="button" data-cday="${i + 1}" aria-pressed="${c.day === i + 1}" aria-label="${DAYNAMES[i]}">${d[0]}</button>`).join('')}</div>
      <div style="display:flex;gap:10px"><div style="flex:1;min-width:0"><div class="label">Time</div><input class="field" id="cTime" type="time" value="${esc(c.time)}"></div>
        <div style="flex:1;min-width:0"><div class="label">Duration (min)</div><input class="field" id="cDur" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="60" value="${esc(c.duration)}"></div></div>
      <div class="label">Instructor</div><select class="field" id="cInst"><option value="">TBA (no instructor)</option>${insts.map(i => `<option value="${esc(i.id)}"${c.instructorId === i.id ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select>
      <div class="label">Notes (optional)</div><textarea class="field" id="cNotes" rows="2" maxlength="300" placeholder="e.g. bring a towel">${esc(c.notes)}</textarea>
      <div class="last" style="margin-top:18px">${la ? `Last attended: <b>${esc(fmtDay(la))}</b>` : 'Not attended yet'}</div>
      <button class="quiet danger" data-act="del" type="button">Delete class</button>`;
    clsHint();
  }
  $('clsEditBody').addEventListener('input', e => {
    const t = e.target; if (!cls) return;
    if (t.id === 'cName') cls.name = t.value;
    else if (t.id === 'cStudio') { cls.studio = t.value; $('clsEditBody').querySelectorAll('[data-cst]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cst === t.value.trim())); }
    else if (t.id === 'cTime') cls.time = t.value;
    else if (t.id === 'cDur') cls.duration = t.value.replace(/\D/g, '');
    else if (t.id === 'cNotes') cls.notes = t.value;
    else return;
    clsTouch();
  });
  $('clsEditBody').addEventListener('change', e => {
    if (e.target.id !== 'cInst' || !cls) return;
    cls.instructorId = e.target.value || null; $('cPhoto').innerHTML = bigPhoto(); clsTouch();
  });
  $('clsEditBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
  $('clsEditBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !cls) return;
    if (t.dataset.cst) { cls.studio = t.dataset.cst; $('cStudio').value = t.dataset.cst; $('cStudios').querySelectorAll('[data-cst]').forEach(b => b.setAttribute('aria-pressed', b === t)); return clsTouch(); }
    if (t.dataset.cday) { cls.day = +t.dataset.cday; $('cDays').querySelectorAll('[data-cday]').forEach(b => b.setAttribute('aria-pressed', b === t)); return clsTouch(); }
    if (t.dataset.act === 'del') {
      if (!(await ask({ title: 'Delete class?', text: `“${cls.name.trim() || 'This class'}” and its attendance history are deleted.`, ok: 'DELETE', danger: true }))) return;
      const id = cls.id, was = clsSaved; cls = null; onClose.clsEditPage = null;       // a waiting auto-save then does nothing
      if (was) { await RisenDB.deleteClass(id); S.classes = S.classes.filter(c => c.id !== id); S.classlogs = S.classlogs.filter(l => l.classId !== id); }
      closePage('clsEditPage'); render(); renderHome();
    }
  });
  async function finishClass() {             // back arrow / DONE
    if (!cls) return;
    // A new class with something filled in but no name is kept as "Untitled class" instead of being thrown away
    if (!clsSaved && !cls.name.trim() && clsDirty) { cls.name = 'Untitled class'; saveCls(); toast('Saved as “Untitled class”'); }
    await saveCls.flush();
    const p = clsProblem(), was = clsSaved, touched = cls.name || cls.notes;
    if (p && (was || touched)) toast('Not saved: ' + p.replace(' to save this class.', '.').toLowerCase() + (was ? ' Last saved version kept.' : ''));
    cls = null; render(); renderHome();
  }

  // ================= Instructors =================
  function openInstructors() { renderInstructors(); openPage('instPage'); onClose.instPage = () => render(); }
  function renderInstructors() {
    const list = [...S.instructors].sort((a, b) => a.name.localeCompare(b.name));
    $('instBody').innerHTML = `<button class="primary" data-act="addinst" style="margin-top:6px">+ ADD INSTRUCTOR</button><div class="gstack" style="margin-top:18px">${list.map(i => {
      const n = S.classes.filter(c => c.instructorId === i.id).length;
      return `<div class="card cls"><button class="wmain" data-inst="${esc(i.id)}">${avatar(i)}<div class="xt"><div class="t">${esc(i.name)}</div><div class="s">${n} class${n === 1 ? '' : 'es'}</div></div>${CHEV}</button></div>`;
    }).join('') || '<div class="card"><div class="sub">No instructors yet.</div></div>'}</div>`;
  }
  $('instBody').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.inst) return openInstructor(t.dataset.inst);
    if (t.dataset.act === 'addinst') return openInstructor(null);
  });

  let ins = null, insSaved = false;
  const insProblem = () => !ins.name.trim() ? 'Add a name to save this instructor.' : '';
  const saveIns = debounce(async () => {
    if (!ins || insProblem()) return;
    try {
      const rec = { id: ins.id, name: ins.name.trim(), photo: ins.photo || null }; await RisenDB.saveInstructor(rec); insSaved = true;
      S.instructors = S.instructors.some(x => x.id === rec.id) ? S.instructors.map(x => x.id === rec.id ? rec : x) : [...S.instructors, rec];
      flashSaved('instSaved');
    } catch (err) { toast(err.message); }
  }, 400);
  function insHint() { const p = ins && insProblem(), h = $('iHint'); if (h) { h.textContent = p || ''; h.hidden = !p; } }
  function openInstructor(id) {
    const ex = id ? inst(id) : null; insSaved = !!ex;
    ins = ex ? { ...ex } : { id: RisenDB.uid(), name: '', photo: null };
    $('instEditTitle').textContent = ex ? 'Instructor' : 'New instructor';
    renderInstructorEditor(); openPage('instEditPage');
    onClose.instEditPage = async () => { await finishInstructor(); };
    if (!ex) setTimeout(() => $('iName').focus(), 320);
  }
  function renderInstructorEditor() {
    const hasCustom = custom.has(ins.id), hasAny = hasCustom || !!ins.photo;
    $('instEditBody').innerHTML = `<div style="display:grid;place-items:center;margin-top:8px">${avatar(ins, 'xl')}</div>
      <label class="ghost" style="display:flex;align-items:center;justify-content:center;margin:16px auto 0;max-width:260px;cursor:pointer">${hasAny ? 'REPLACE PHOTO' : '+ ADD PHOTO'}<input type="file" id="iFile" accept="image/*" hidden></label>
      ${hasCustom ? `<button class="quiet" id="iRemove" type="button" style="margin-top:6px">${ins.photo ? 'Use the original photo' : 'Delete photo'}</button>` : ''}
      <p class="note hint" id="iHint" hidden style="margin-top:14px"></p>
      <div class="label">Name</div><input class="field" id="iName" type="text" maxlength="40" autocapitalize="words" autocomplete="off" enterkeyhint="done" placeholder="e.g. Mira Ammouri" value="${esc(ins.name)}">
      <button class="quiet danger" data-act="delinst" type="button">Delete instructor</button>`;
    insHint();
  }
  $('instEditBody').addEventListener('input', e => { if (e.target.id === 'iName' && ins) { ins.name = e.target.value; insHint(); saveIns(); } });
  $('instEditBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[type=text]')) { e.preventDefault(); e.target.blur(); } });
  $('instEditBody').addEventListener('change', async e => {
    if (e.target.id !== 'iFile' || !ins) return;
    const f = e.target.files[0]; if (!f) return;
    try { await setInstPhoto(ins.id, f); flashSaved('instSaved'); } catch (err) { toast(err.message || 'Could not read that photo'); }
    renderInstructorEditor();
  });
  $('instEditBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !ins) return;
    if (t.id === 'iRemove') {
      if (!(await ask(ins.photo ? { title: 'Use the original photo?', ok: 'USE ORIGINAL' } : { title: 'Delete photo?', ok: 'DELETE', danger: true }))) return;
      await removeInstPhoto(ins.id); renderInstructorEditor(); return;
    }
    if (t.dataset.act === 'delinst') {
      const n = S.classes.filter(c => c.instructorId === ins.id).length;
      if (!(await ask({ title: 'Delete instructor?', text: `${ins.name.trim() || 'This instructor'} is deleted.${n ? ` Their ${n} class${n === 1 ? '' : 'es'} will show TBA.` : ''}`, ok: 'DELETE', danger: true }))) return;
      const id = ins.id, was = insSaved; ins = null; onClose.instEditPage = null;
      if (was) { await RisenDB.deleteInstructor(id); S.instructors = S.instructors.filter(i => i.id !== id); S.classes = S.classes.map(c => c.instructorId === id ? { ...c, instructorId: null } : c); }
      else await RisenDB.deletePhoto('inst-' + id);
      await removeInstPhotoLocal(id); closePage('instEditPage'); renderInstructors(); renderHome();
    }
  });
  async function removeInstPhotoLocal(id) { if (urls.get(id)) URL.revokeObjectURL(urls.get(id)); custom.delete(id); urls.delete(id); }
  async function finishInstructor() {
    if (!ins) return;
    if (!insSaved && !ins.name.trim() && custom.has(ins.id)) { ins.name = 'Untitled instructor'; saveIns(); toast('Saved as “Untitled instructor”'); }   // a photo was added but no name
    await saveIns.flush();
    const p = insProblem(), was = insSaved, id = ins.id, touched = ins.name || custom.has(id);
    if (!was) { if (custom.has(id)) { await RisenDB.deletePhoto('inst-' + id); await removeInstPhotoLocal(id); } if (p && touched) toast('Not saved: ' + p.replace(' to save this instructor.', '.').toLowerCase()); }
    else if (p) toast('Not saved: ' + p.replace(' to save this instructor.', '.').toLowerCase() + ' Last saved version kept.');
    ins = null; renderInstructors(); renderHome();
  }

  // ================= Opening the tab =================
  function open() {
    closeAll(); show('classes'); mode = 'day'; viewDay = isoDay(new Date()); slide = ''; render();      // opening the tab always shows today
    for (const id of [...urls.keys()]) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    warm().then(() => { if (!$('view-classes').hidden) { render(); scrollToNow(); } renderHome(); });
    if (!S.settings.classesAsked) askSeed();
    scrollToNow();
  }
  function openToday() { open(); }      // Home's Classes tile: the tab opens on today's timeline
  function reset() { closeAll(); filter = 'ALL'; mode = 'day'; viewDay = isoDay(new Date()); viewInst = null; slide = ''; cls = null; ins = null; for (const id of [...urls.keys()]) { URL.revokeObjectURL(urls.get(id)); } urls.clear(); custom.clear(); $('clsSheet').hidden = true; }

  const flush = () => Promise.all([saveCls.flush(), saveIns.flush()]).catch(err => toast(err.message));
  let lastSig = '';
  const sig = () => { const n = next(); return n.none || (n.c.id + (n.now ? 'n' : '')); };
  function tick() {           // a new day, or the "next class" moved on: bring the screens up to date
    const quiet = !$('view-classes').hidden && !PAGES.some(id => $(id).classList.contains('open'));
    if (dayKey(new Date()) !== lastDay) {                       // a new day began while the app was open: today moves on by itself
      if (quiet) { if (mode === 'day') viewDay = isoDay(new Date()); render(); } else lastDay = dayKey(new Date());
    } else if (quiet && mode === 'day' && viewDay === isoDay(new Date()) && nowMinutes() !== lastMin) render();      // live timing: every minute
    const s = sig(); if (s !== lastSig) { lastSig = s; if (!$('view-home').hidden) renderHome(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else tick(); });
  addEventListener('pagehide', flush);
  setInterval(tick, 30000);
  ready.then(() => { lastSig = sig(); return warm(); }).then(() => { if (!$('view-home').hidden) renderHome(); });

  // One time, for a phone that loaded the schedule before release .33: give those classes the fixed ids of the schedule
  // file (same name + day + time), attendance included. If the file can't be read now, it is tried again next time.
  async function matchSeed() {
    if (S.settings.classIdsMatched) return 0;
    let n = 0;
    try {
      let seed = { classes: [] };
      if (S.classes.some(c => !c.seed)) { const r = await fetch('data/gym-classes.json'); if (!r.ok) throw new Error('not found'); seed = await r.json(); }
      n = await RisenDB.adoptSeedClasses(seed);
    } catch (e) { return 0; }
    S.settings.classIdsMatched = true;
    if (n) { await load(); lastSig = sig(); if (!$('view-classes').hidden) render(); renderHome(); }
    return n;
  }
  ready.then(matchSeed);

  // Settings "Reload gym schedule". Classes loaded before the fixed ids existed are matched first, so their attendance
  // is carried over instead of being left behind on a duplicate.
  async function reloadSchedule() {
    const r = await fetch('data/gym-classes.json'); if (!r.ok) throw new Error('Could not read the schedule');
    const seed = await r.json();
    if (!S.settings.classIdsMatched && S.classes.some(c => !c.seed)) await RisenDB.adoptSeedClasses(seed);
    const res = await RisenDB.reloadSeedClasses(seed);
    await load(); reset(); lastSig = sig(); await warm();
    return { ...res, total: (seed.classes || []).length, gym: seed.gym || 'gym' };
  }

  return { open, openToday, next, avatar, reset, flush, matchSeed, reloadSchedule };
})();
