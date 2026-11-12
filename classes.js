// RISEN Classes tab. THE WEEK (7 days, studio filter) -> THE DAY (its classes, ✓ ATTENDED on today) -> THE CLASS (edit),
// plus the instructors list. The first time the tab opens it offers to load the gym's schedule from data/gym-classes.json.
// Uses the shared helpers from index.html (S, load, renderHome, show, toast, esc, dayKey, isoDay, weekDays).
const Classes = (() => {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAYNAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const STUDIO_ORDER = ['Energy', 'Balance', 'Power'];
  const CHEV = '<svg class="icon chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
  const TRASH = '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';

  let filter = 'ALL';                 // studio shown, or ALL (not saved: starts on ALL)
  let curDay = null, lastDay = dayKey(new Date());

  // ================= Small helpers =================
  const pad = n => String(n).padStart(2, '0');
  const hm = t => String(t).replace(/^0/, '');                                   // 09:00 -> 9:00
  const toMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  const addMin = (t, m) => { const x = ((toMin(t) + m) % 1440 + 1440) % 1440; return pad(Math.floor(x / 60)) + ':' + pad(x % 60); };
  const range = c => `${c.time}–${addMin(c.time, c.duration || 60)}`;
  const fmtDay = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  function debounce(fn, ms) {
    let t = null;
    const run = () => { t = null; return fn(); };
    const f = () => { clearTimeout(t); t = setTimeout(run, ms); };
    f.flush = () => { if (t === null) return Promise.resolve(); clearTimeout(t); return Promise.resolve(run()); };
    return f;
  }

  // ================= Data selectors =================
  const inst = id => S.instructors.find(i => i.id === id) || null;
  const attId = (classId, date) => `${classId}|${date}`;
  const attMap = () => new Map(S.classlogs.map(l => [l.id, l]));
  function studios() {                // the studios in use: Energy, Balance, Power first, then any others
    const u = [...new Set(S.classes.map(c => c.studio).filter(Boolean))], rank = s => { const i = STUDIO_ORDER.indexOf(s); return i < 0 ? 9 : i; };
    return u.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }
  const byTime = (a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name);
  const classesOn = d => S.classes.filter(c => c.day === d && (filter === 'ALL' || c.studio === filter)).sort(byTime);
  function lastAttended(classId) { const ds = S.classlogs.filter(l => l.classId === classId).map(l => l.date).sort(); return ds.length ? ds[ds.length - 1] : null; }

  // For the Home tile: the next class today that is not attended yet (one that has started but not ended counts as "now")
  function next() {
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), k = dayKey(now), att = attMap();
    const today = S.classes.filter(c => c.day === isoDay(now)).sort(byTime);
    if (!today.length) return { none: 'today' };
    const c = today.find(x => !att.has(attId(x.id, k)) && toMin(x.time) + (x.duration || 60) > nowMin);
    return c ? { c, i: inst(c.instructorId), now: toMin(c.time) <= nowMin } : { none: 'more' };
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
  const onClose = {};
  function openPage(id) { const p = $(id); p.scrollTop = 0; p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); }
  function closePage(id) {
    const p = $(id); p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
    const f = onClose[id]; onClose[id] = null; if (f) f();
  }
  document.querySelectorAll('[data-cls-close]').forEach(b => b.onclick = () => { document.activeElement.blur(); closePage(b.dataset.clsClose); });
  const PAGES = ['clsEditPage', 'instEditPage', 'instPage', 'clsPage'];
  const closeAll = () => PAGES.forEach(id => $(id).classList.contains('open') && closePage(id));
  let savedT;
  function flashSaved(id) { const m = $(id); m.classList.add('show'); clearTimeout(savedT); savedT = setTimeout(() => ['clsSaved', 'instSaved'].forEach(i => $(i).classList.remove('show')), 1200); }

  // ================= First open: load the schedule? =================
  function askSeed() { $('clsSheet').hidden = false; }
  $('clsNo').onclick = async () => {
    await RisenDB.setSetting('classesAsked', true); S.settings.classesAsked = true; $('clsSheet').hidden = true; renderWeek();
  };
  $('clsYes').onclick = async () => {
    const yes = $('clsYes'), no = $('clsNo'); yes.disabled = no.disabled = true; yes.textContent = 'LOADING…';
    try {
      const r = await fetch('data/gym-classes.json'); if (!r.ok) throw new Error('not found');
      const d = await r.json();
      await RisenDB.seedClasses({
        instructors: d.instructors.map(i => ({ id: i.id, name: i.name, photo: i.photo || null })),
        classes: d.classes.map(c => ({ id: RisenDB.uid(), name: c.name, studio: c.studio || '', day: c.day, time: c.time, duration: c.duration || 60, instructorId: c.instructor || null, notes: '' })),
      });
      await load(); S.settings.classesAsked = true; $('clsSheet').hidden = true; renderWeek(); renderHome();
      toast(`Loaded ${d.classes.length} classes`);
    } catch (e) { toast('Could not load the schedule. Check your connection and try again.'); }
    yes.disabled = no.disabled = false; yes.textContent = 'YES';
  };

  // ================= LEVEL 1: THE WEEK =================
  function renderWeek() {
    lastDay = dayKey(new Date());
    const el = $('clsWeek'), tIso = isoDay(new Date()), wk = weekDays(), st = studios();
    if (filter !== 'ALL' && !st.includes(filter)) filter = 'ALL';
    const fm = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    let h = `<div class="gh"><h2>Classes</h2><span class="meta">${fm(wk[0])} – ${fm(wk[6])}</span></div>`;
    if (st.length > 1) h += `<div class="chips sm" style="margin:0 0 16px">${['ALL', ...st].map(s => `<button type="button" data-filter="${esc(s)}" aria-pressed="${filter === s}">${esc(s.toUpperCase())}</button>`).join('')}</div>`;
    h += '<div class="gstack">';
    for (let d = 1; d <= 7; d++) {
      const list = classesOn(d), n = list.length;
      h += `<button class="card dayrow${d === tIso ? ' today' : ''}" data-day="${d}"><div class="wrow"><span class="wdn">${DAYS[d - 1].toUpperCase()}</span>
        <div class="wdm">${n ? `<div class="m">${n} class${n === 1 ? '' : 'es'}</div><div class="s tline">${list.map(c => hm(c.time)).join(' · ')}</div>` : '<div class="s">No classes</div>'}</div>${CHEV}</div></button>`;
    }
    h += `</div><div class="proglink"><span>Instructors: <b>${S.instructors.length}</b></span><button class="linkbtn" data-act="instructors">Manage instructors</button></div>`;
    el.innerHTML = h;
  }
  $('clsWeek').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.filter) { filter = t.dataset.filter; return renderWeek(); }
    if (t.dataset.day) return openDay(+t.dataset.day);
    if (t.dataset.act === 'instructors') return openInstructors();
  });

  // ================= LEVEL 2: THE DAY =================
  function openDay(d) {
    curDay = d; $('clsPageTitle').textContent = DAYNAMES[d - 1]; renderDay(); openPage('clsPage');
    onClose.clsPage = () => { curDay = null; renderWeek(); renderHome(); };
  }
  function renderDay() {
    const d = curDay, list = classesOn(d), n = list.length, today = d === isoDay(new Date()), k = dayKey(new Date()), att = attMap();
    let h = `<button class="primary" data-act="add" style="margin-top:6px">+ ADD CLASS</button>
      <div class="gh" style="margin-top:22px"><h2>${n ? `${n} class${n === 1 ? '' : 'es'}` : 'No classes'}</h2><span class="meta">${filter === 'ALL' ? '' : esc(filter)}</span></div><div class="gstack">`;
    for (const c of list) {
      const i = inst(c.instructorId), done = today && att.has(attId(c.id, k));
      h += `<div class="card cls"><button class="wmain" data-open="${esc(c.id)}">${avatar(i)}
        <div class="xt"><div class="t">${esc(c.name)}</div><div class="s">${range(c)}</div>
        <div class="s ctag">${c.studio ? `<span class="tag">${esc(c.studio)}</span>` : ''}${i ? esc(i.name) : 'TBA'}</div></div>${CHEV}</button>
        ${today ? `<button class="attbtn${done ? ' on' : ''}" data-att="${esc(c.id)}">✓ ATTENDED</button>` : ''}</div>`;
    }
    $('clsPageBody').innerHTML = h + '</div>';
  }
  $('clsPageBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || curDay == null) return;
    if (t.dataset.open) return openClass(t.dataset.open);
    if (t.dataset.act === 'add') return openClass(null);
    if (t.dataset.att) {
      const id = attId(t.dataset.att, dayKey(new Date()));
      if (attMap().has(id)) {
        if (!confirm('Mark this class as not attended?')) return;
        await RisenDB.unattendClass(id); S.classlogs = S.classlogs.filter(l => l.id !== id);
      } else S.classlogs.push(await RisenDB.attendClass(t.dataset.att, dayKey(new Date())));
      renderDay(); renderHome();
    }
  });

  // ================= LEVEL 3: THE CLASS =================
  let cls = null, clsSaved = false;          // clsSaved: has it been written to the database yet?
  const clsProblem = () => !cls.name.trim() ? 'Add a name to save this class.' : !cls.time ? 'Add a time to save this class.' : '';
  function clsNormal() {
    const c = cls, dur = parseInt(c.duration, 10);
    return { id: c.id, name: c.name.trim(), studio: c.studio.trim(), day: c.day, time: c.time, duration: dur > 0 ? dur : 60, instructorId: c.instructorId || null, notes: c.notes.trim() };
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
  const clsTouch = () => { clsHint(); saveCls(); };

  function openClass(id) {
    const ex = id ? S.classes.find(c => c.id === id) : null;
    clsSaved = !!ex;
    cls = ex ? JSON.parse(JSON.stringify(ex)) : { id: RisenDB.uid(), name: '', studio: filter !== 'ALL' ? filter : (studios()[0] || ''), day: curDay, time: '18:00', duration: 60, instructorId: null, notes: '' };
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
      if (!confirm(`Delete “${cls.name.trim() || 'this class'}”? Its attendance history is deleted too.`)) return;
      const id = cls.id, was = clsSaved; cls = null; onClose.clsEditPage = null;       // a waiting auto-save then does nothing
      if (was) { await RisenDB.deleteClass(id); S.classes = S.classes.filter(c => c.id !== id); S.classlogs = S.classlogs.filter(l => l.classId !== id); }
      closePage('clsEditPage'); renderDay(); renderHome();
    }
  });
  async function finishClass() {             // back arrow / DONE
    if (!cls) return;
    await saveCls.flush();
    const p = clsProblem(), was = clsSaved, touched = cls.name || cls.notes;
    if (p && (was || touched)) toast('Not saved: ' + p.replace(' to save this class.', '.').toLowerCase() + (was ? ' Last saved version kept.' : ''));
    cls = null; renderDay(); renderHome();
  }

  // ================= Instructors =================
  function openInstructors() { renderInstructors(); openPage('instPage'); onClose.instPage = () => { renderWeek(); if (curDay != null) renderDay(); }; }
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
      ${hasCustom ? `<button class="quiet" id="iRemove" type="button" style="margin-top:6px">${ins.photo ? 'Use the original photo' : 'Remove photo'}</button>` : ''}
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
      if (!confirm(ins.photo ? 'Use the original photo again?' : 'Remove this photo?')) return;
      await removeInstPhoto(ins.id); renderInstructorEditor(); return;
    }
    if (t.dataset.act === 'delinst') {
      const n = S.classes.filter(c => c.instructorId === ins.id).length;
      if (!confirm(`Delete ${ins.name.trim() || 'this instructor'}?${n ? ` Their ${n} class${n === 1 ? '' : 'es'} will show TBA.` : ''}`)) return;
      const id = ins.id, was = insSaved; ins = null; onClose.instEditPage = null;
      if (was) { await RisenDB.deleteInstructor(id); S.instructors = S.instructors.filter(i => i.id !== id); S.classes = S.classes.map(c => c.instructorId === id ? { ...c, instructorId: null } : c); }
      else await RisenDB.deletePhoto('inst-' + id);
      await removeInstPhotoLocal(id); closePage('instEditPage'); renderInstructors(); renderHome();
    }
  });
  async function removeInstPhotoLocal(id) { if (urls.get(id)) URL.revokeObjectURL(urls.get(id)); custom.delete(id); urls.delete(id); }
  async function finishInstructor() {
    if (!ins) return;
    await saveIns.flush();
    const p = insProblem(), was = insSaved, id = ins.id, touched = ins.name || custom.has(id);
    if (!was) { if (custom.has(id)) { await RisenDB.deletePhoto('inst-' + id); await removeInstPhotoLocal(id); } if (p && touched) toast('Not saved: ' + p.replace(' to save this instructor.', '.').toLowerCase()); }
    else if (p) toast('Not saved: ' + p.replace(' to save this instructor.', '.').toLowerCase() + ' Last saved version kept.');
    ins = null; renderInstructors(); renderHome();
  }

  // ================= Opening the tab =================
  function open() {
    closeAll(); show('classes'); renderWeek();
    for (const id of [...urls.keys()]) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    warm().then(() => { if (!$('view-classes').hidden) { renderWeek(); if (curDay != null) renderDay(); } renderHome(); });
    if (!S.settings.classesAsked) askSeed();
    $('view-classes').scrollTop = 0;
  }
  function openToday() {      // Home's Classes tile: today's classes
    open(); if (S.settings.classesAsked && S.classes.length) openDay(isoDay(new Date()));
  }
  function reset() { closeAll(); filter = 'ALL'; curDay = null; cls = null; ins = null; for (const id of [...urls.keys()]) { URL.revokeObjectURL(urls.get(id)); } urls.clear(); custom.clear(); $('clsSheet').hidden = true; }

  const flush = () => Promise.all([saveCls.flush(), saveIns.flush()]).catch(err => toast(err.message));
  let lastSig = '';
  const sig = () => { const n = next(); return n.none || (n.c.id + (n.now ? 'n' : '')); };
  function tick() {           // a new day, or the "next class" moved on: bring the screens up to date
    if (dayKey(new Date()) !== lastDay) {
      if (!$('view-classes').hidden && !PAGES.some(id => $(id).classList.contains('open'))) renderWeek(); else lastDay = dayKey(new Date());
    }
    const s = sig(); if (s !== lastSig) { lastSig = s; if (!$('view-home').hidden) renderHome(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else tick(); });
  addEventListener('pagehide', flush);
  setInterval(tick, 30000);
  ready.then(() => { lastSig = sig(); return warm(); }).then(() => { if (!$('view-home').hidden) renderHome(); });

  return { open, openToday, next, avatar, reset, flush };
})();
