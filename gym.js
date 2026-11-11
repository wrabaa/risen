// RISEN Gym tab: TODAY (log today's workout) and PLAN (routine builder).
// Uses the shared helpers from index.html (S, load, renderHome, show, toast, esc, dayKey, plannedOn, ...).
const Gym = (() => {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const I = {
    up: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    chev: '<svg class="icon chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
  };
  let seg = 'today';

  const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtN = n => (n === '' || n == null) ? '' : String(Math.round(Number(n) * 100) / 100);
  const exInfo = id => LIBRARY.byId[id] || S.exercises.find(e => e.id === id) || { id, name: 'Unknown exercise', muscle: '' };
  const daysText = d => (d && d.length) ? [...d].sort().map(x => DAYS[x - 1]).join(' · ') : 'No days set';
  const fmtDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  function fmtClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; }
  function fmtDur(ms) { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; }
  function debounce(fn, ms) { let t; const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; f.flush = () => { clearTimeout(t); return fn(); }; return f; }

  // ================= Navigation =================
  function open(which) {
    seg = which || 'today';
    closeAll(); show('gym'); renderSeg();
  }
  function renderSeg() {
    document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.seg === seg));
    $('gymToday').hidden = seg !== 'today'; $('gymPlan').hidden = seg !== 'plan';
    seg === 'today' ? renderToday() : renderPlan();
    $('view-gym').scrollTop = 0;
  }
  document.querySelector('.seg').onclick = e => { const b = e.target.closest('[data-seg]'); if (b && b.dataset.seg !== seg) { seg = b.dataset.seg; renderSeg(); } };

  function openPage(id, title) {
    if (title != null) $('gymPageTitle').textContent = title;
    const p = $(id); p.scrollTop = 0; p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  }
  function closePage(id) { const p = $(id); p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); if (id === 'gymPage' && pageOnClose) { const f = pageOnClose; pageOnClose = null; f(); } }
  let pageOnClose = null;
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { document.activeElement.blur(); closePage(b.dataset.close); });

  function openSheet(html, { dismiss = true } = {}) {
    $('gymSheetBody').innerHTML = html; $('gymSheet').hidden = false; $('gymSheet').dataset.dismiss = dismiss ? '1' : '';
  }
  function closeSheet() { document.activeElement.blur(); $('gymSheet').hidden = true; $('gymSheetBody').innerHTML = ''; }
  $('gymSheet').addEventListener('click', e => { if (e.target === $('gymSheet') && $('gymSheet').dataset.dismiss) closeSheet(); });
  function closeAll() { closeSheet(); ['libPage', 'gymPage'].forEach(id => $(id).classList.contains('open') && closePage(id)); }

  // ================= TODAY =================
  const draft = () => S.settings.activeSession || null;
  const saveDraft = () => RisenDB.setSetting('activeSession', S.settings.activeSession || null);
  const saveDraftSoon = debounce(saveDraft, 400);

  function renderToday() {
    const el = $('gymToday'), d = draft();
    if (d) return renderLogger(el, d);
    const r = activeRoutine();
    if (!r) {
      el.innerHTML = `<div class="card empty"><div class="wname">No plan yet</div><div class="sub">Build your routine in Plan. Your workouts then show up here on their days.</div>
        <button class="primary" data-act="toplan">GO TO PLAN</button></div>`;
      return;
    }
    const today = new Date(), list = plannedOn(today), ids = doneIds(today), sk = skippedIds(today);
    const extras = S.sessions.filter(x => x.date === dayKey(today) && x.extra && x.finishedAt);
    const pending = list.filter(w => !ids.has(w.id) && !sk.has(w.id));
    let h = `<div class="gh"><h2>Today</h2><span class="meta">${today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div><div class="gstack">`;
    if (!list.length) h += `<div class="card"><div class="wrow"><div><div class="t">Rest day</div><div class="s">No workout planned today.</div></div></div></div>`;
    for (const w of list) {
      const n = (w.exercises || []).length, sub = `${n} exercise${n === 1 ? '' : 's'}${w.time ? ' · ' + esc(w.time) : ''}`;
      if (ids.has(w.id)) h += `<div class="card"><div class="wrow"><div><div class="t">${esc(w.name)}</div><div class="s">${sub}</div></div><span class="status ok">DONE ✓</span></div></div>`;
      else if (sk.has(w.id)) { const why = S.sessions.find(x => x.date === dayKey(today) && x.skipped && x.workoutId === w.id).reason;
        h += `<div class="card"><div class="wrow"><div><div class="t">${esc(w.name)}</div><div class="s">Skipped · ${esc(why)}</div></div><span class="status">SKIPPED</span></div></div>`; }
      else h += `<button class="card" data-start="${esc(w.id)}"><div class="wrow"><div><div class="t">${esc(w.name)}</div><div class="s">${sub}</div></div><span class="play sm">${I.play}</span></div></button>`;
    }
    for (const x of extras) h += `<div class="card"><div class="wrow"><div><div class="t">${esc(x.name || 'Extra workout')}</div><div class="s">Extra workout</div></div><span class="status ok">DONE ✓</span></div></div>`;
    h += `</div><div class="btnrow"><button class="ghost" data-act="extra">LOG EXTRA</button>${pending.length ? '<button class="ghost" data-act="skip">SKIP DAY</button>' : ''}</div>`;
    el.innerHTML = h;
  }

  function topSet(sets) { return sets.reduce((a, b) => (num(b.kg) ?? 0) > (num(a.kg) ?? 0) || ((num(b.kg) ?? 0) === (num(a.kg) ?? 0) && (num(b.reps) ?? 0) > (num(a.reps) ?? 0)) ? b : a); }
  async function newEntry(exerciseId, target) {
    const last = (await RisenDB.historyOf(exerciseId)).find(h => h.sets && h.sets.length);
    const n = Math.max(1, target && target.sets ? target.sets : (last ? last.sets.length : 3));
    const sets = [...Array(n)].map((_, i) => {
      const src = last ? (last.sets[i] || last.sets[last.sets.length - 1]) : (target ? { kg: target.kg, reps: target.reps } : {});
      return { kg: fmtN(src.kg), reps: fmtN(src.reps), done: false };
    });
    return { exerciseId, sets, last: last ? topSet(last.sets) : null };
  }

  async function start(workoutId, { extra = false } = {}) {
    const d = draft();
    if (d) { open('today'); if (d.workoutId !== workoutId) toast('Finish or discard the workout in progress first'); return; }
    const w = workoutId ? S.workouts.find(x => x.id === workoutId) : null;
    const exercises = [];
    for (const t of (w ? w.exercises : [])) exercises.push(await newEntry(t.exerciseId, t));
    S.settings.activeSession = { id: RisenDB.uid(), workoutId: w ? w.id : null, routineId: w ? w.routineId : ((activeRoutine() || {}).id || null),
      name: w ? w.name : 'Extra workout', extra, date: dayKey(new Date()), startedAt: new Date().toISOString(), exercises };
    await saveDraft(); open('today');
  }

  function renderLogger(el, d) {
    let h = `<div class="gh"><h2>${esc(d.name)}</h2><span class="meta elapsed" id="elapsed">${fmtClock(Date.now() - new Date(d.startedAt))}</span></div><div class="gstack">`;
    d.exercises.forEach((e, i) => {
      const x = exInfo(e.exerciseId);
      h += `<div class="card ex"><div class="exhead"><div><h3>${esc(x.name)}</h3>${x.notes ? `<div class="notes">${esc(x.notes)}</div>` : ''}</div>
        <div class="tools"><button data-rmex="${i}" aria-label="Remove from this workout">${I.trash}</button></div></div>
        <div class="last">${e.last ? `Last time: <b>${fmtN(e.last.kg)} kg × ${fmtN(e.last.reps)}</b>` : 'First time'}</div>
        <div data-photo="${esc(e.exerciseId)}"></div>
        <div class="sets"><div class="setrow sethead"><span>SET</span><span>KG</span><span>REPS</span><span></span></div>`;
      e.sets.forEach((s, j) => {
        h += `<div class="setrow${s.done ? ' done' : ''}" data-ex="${i}" data-set="${j}"><span class="n">${j + 1}</span>
          <input class="num" data-f="kg" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${esc(s.kg)}" placeholder="0" aria-label="Set ${j + 1} kg">
          <input class="num" data-f="reps" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" value="${esc(s.reps)}" placeholder="0" aria-label="Set ${j + 1} reps">
          <button class="tick" data-tick aria-label="Confirm set ${j + 1}">${I.check}</button></div>`;
      });
      h += `</div><button class="dashed addset" data-addset="${i}">+ Add set</button></div>`;
    });
    h += `<button class="dashed" data-act="addex">+ Add exercise</button></div>
      <button class="primary finish" data-act="finish">FINISH WORKOUT</button>
      <button class="quiet" data-act="discard">Discard workout</button>`;
    el.innerHTML = h;
    el.querySelectorAll('[data-photo]').forEach(p => PhotoSlot.mount(p, p.dataset.photo, { editable: true }));
  }
  setInterval(() => { const e = $('elapsed'), d = draft(); if (e && d) e.textContent = fmtClock(Date.now() - new Date(d.startedAt)); }, 1000);

  $('gymToday').addEventListener('input', e => {
    const inp = e.target.closest('.num'); if (!inp) return;
    const row = inp.closest('.setrow'), d = draft();
    d.exercises[row.dataset.ex].sets[row.dataset.set][inp.dataset.f] = inp.value; saveDraftSoon();
  });
  $('gymToday').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('.num')) return;
    e.preventDefault(); const row = e.target.closest('.setrow');
    if (e.target.dataset.f === 'kg') row.querySelector('[data-f="reps"]').focus(); else e.target.blur();
  });
  $('gymToday').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = draft();
    if (t.dataset.start) return start(t.dataset.start);
    if (t.hasAttribute('data-tick')) {
      const row = t.closest('.setrow'), s = d.exercises[row.dataset.ex].sets[row.dataset.set];
      if (!s.done) {
        if (!(num(s.reps) > 0)) { row.querySelector('[data-f="reps"]').focus(); toast('Enter the reps first'); return; }
        if (num(s.kg) == null) { s.kg = '0'; row.querySelector('[data-f="kg"]').value = '0'; }
        s.done = true; document.activeElement.blur(); Rest.start();
      } else s.done = false;
      row.classList.toggle('done', s.done); saveDraft(); return;
    }
    if (t.dataset.addset != null) {
      const sets = d.exercises[t.dataset.addset].sets, p = sets[sets.length - 1] || { kg: '', reps: '' };
      sets.push({ kg: p.kg, reps: p.reps, done: false }); saveDraft(); renderToday(); return;
    }
    if (t.dataset.rmex != null) {
      if (!confirm(`Remove ${exInfo(d.exercises[t.dataset.rmex].exerciseId).name} from this workout? Your plan doesn't change.`)) return;
      d.exercises.splice(t.dataset.rmex, 1); saveDraft(); renderToday(); return;
    }
    switch (t.dataset.act) {
      case 'toplan': seg = 'plan'; return renderSeg();
      case 'extra': return extraSheet();
      case 'skip': return skipSheet();
      case 'addex': return openLibrary(async id => { draft().exercises.push(await newEntry(id, null)); await saveDraft(); renderToday(); });
      case 'finish': return finish();
      case 'discard':
        if (!confirm('Discard this workout? Nothing will be saved.')) return;
        S.settings.activeSession = null; await saveDraft(); Rest.stop(); renderToday(); renderHome(); return;
    }
  });

  async function finish() {
    const d = draft();
    const all = d.exercises.flatMap(e => e.sets), doneN = all.filter(s => s.done).length;
    if (!doneN) { if (confirm('No sets are ticked, so there is nothing to save. Discard this workout?')) { S.settings.activeSession = null; await saveDraft(); Rest.stop(); renderToday(); } return; }
    if (doneN < all.length && !confirm("Finish anyway? Unchecked sets won't be saved.")) return;
    const entries = d.exercises.map(e => ({ exerciseId: e.exerciseId, sets: e.sets.filter(s => s.done).map(s => ({ kg: num(s.kg) ?? 0, reps: num(s.reps) ?? 0 })) }))
      .filter(e => e.sets.length);
    const ses = await RisenDB.logSession({ date: d.date, workoutId: d.workoutId, routineId: d.routineId, name: d.name, extra: d.extra, startedAt: d.startedAt, entries });
    S.settings.activeSession = null; await saveDraft(); Rest.stop();
    await load(); renderHome(); renderToday();
    openSheet(`<h2>Workout done</h2><p>${esc(d.name)}</p>
      <div class="stats"><div><b>${entries.length}</b><span>Exercises</span></div><div><b>${doneN}</b><span>Sets</span></div>
      <div><b>${fmtDur(new Date(ses.finishedAt) - new Date(d.startedAt))}</b><span>Time</span></div></div>
      <button class="primary" data-sheet="home">BACK TO HOME</button>`, { dismiss: false });
  }

  function skipSheet() {
    openSheet(`<h2>Skip today?</h2><p>Pick a reason. A skipped day doesn't break your streak.</p>
      <div class="chips">${['Sick', 'Travel', 'Family', 'Rest needed'].map(c => `<button type="button" aria-pressed="false" data-chip="${c}">${c}</button>`).join('')}</div>
      <input class="field" id="skipNote" type="text" maxlength="80" placeholder="Other reason (optional)" enterkeyhint="done">
      <button class="primary" data-sheet="doskip">SKIP DAY</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
  }
  function extraSheet() {
    const ws = S.workouts.filter(w => w.routineId === (activeRoutine() || {}).id).sort((a, b) => (a.order || 0) - (b.order || 0));
    openSheet(`<h2>Log extra workout</h2><p>An unplanned session. It's saved to your history.</p>
      <div class="list">${ws.map(w => `<button data-extra="${esc(w.id)}">${esc(w.name)}</button>`).join('')}<button data-extra="">Blank workout (add exercises as you go)</button></div>
      <button class="textbtn" data-sheet="cancel">Cancel</button>`);
  }

  $('gymSheetBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.chip) { const on = t.getAttribute('aria-pressed') !== 'true'; $('gymSheetBody').querySelectorAll('[data-chip]').forEach(c => c.setAttribute('aria-pressed', 'false')); t.setAttribute('aria-pressed', on); return; }
    if (t.dataset.extra != null) { closeSheet(); return start(t.dataset.extra || null, { extra: true }); }
    switch (t.dataset.sheet) {
      case 'cancel': return closeSheet();
      case 'home': closeSheet(); seg = 'today'; renderHome(); return show('home');
      case 'doskip': {
        const chip = $('gymSheetBody').querySelector('[data-chip][aria-pressed="true"]'), note = $('skipNote').value.trim();
        const reason = [chip && chip.dataset.chip, note].filter(Boolean).join(': ');
        if (!reason) return toast('Pick a reason or type one');
        const today = new Date(), ids = doneIds(today), sk = skippedIds(today);
        await RisenDB.skipWorkouts({ date: dayKey(today), workoutIds: plannedOn(today).filter(w => !ids.has(w.id) && !sk.has(w.id)).map(w => w.id), routineId: activeRoutine().id, reason });
        closeSheet(); await load(); renderToday(); renderHome(); return toast('Day skipped');
      }
      case 'routine': {
        const name = $('routineName').value.trim(); if (!name) return $('routineName').focus();
        if (t.dataset.mode === 'rename') await RisenDB.renameRoutine(activeRoutine().id, name); else await RisenDB.createRoutine(name);
        closeSheet(); await load(); renderPlan(); renderHome(); return;
      }
      case 'custom': {
        const name = $('cxName').value.trim(); if (!name) return $('cxName').focus();
        const ex = await RisenDB.saveExercise({ name, muscle: 'Custom', notes: $('cxNotes').value.trim(), custom: true });
        S.exercises.push(ex); closeSheet(); return pick(ex.id);
      }
    }
  });

  // ================= Rest timer =================
  const Rest = (() => {
    let end = 0, iv = null, hideT = null;
    const bar = $('restbar');
    function paint() {
      const left = end - Date.now();
      if (left > 0) { bar.classList.remove('zero'); $('restCd').textContent = fmtClock(left + 999); return; }
      $('restCd').textContent = '0:00';
      if (!bar.classList.contains('zero')) { bar.classList.add('zero'); clearInterval(iv); iv = null; hideT = setTimeout(stop, 5000); }
    }
    function run() { clearTimeout(hideT); bar.classList.add('show'); app.classList.add('resting'); if (!iv) iv = setInterval(paint, 250); paint(); }
    function start() { end = Date.now() + (S.settings.restSec || 90) * 1000; bar.classList.remove('zero'); run(); }
    function adjust(sec) { end = Math.max(Date.now(), end) + sec * 1000; if (sec > 0) bar.classList.remove('zero'); run(); }
    function stop() { clearInterval(iv); iv = null; clearTimeout(hideT); bar.classList.remove('show', 'zero'); app.classList.remove('resting'); }
    bar.onclick = e => { const b = e.target.closest('[data-rest]'); if (!b) return; b.dataset.rest === 'skip' ? stop() : adjust(+b.dataset.rest); };
    return { start, stop };
  })();

  // ================= PLAN =================
  function renderPlan() {
    const el = $('gymPlan'), r = activeRoutine();
    const archived = S.routines.filter(x => x.status === 'archived').sort((a, b) => (b.archived || '').localeCompare(a.archived || ''));
    let h = '';
    if (!r) h += `<div class="card empty"><div class="wname">No routine yet</div><div class="sub">A routine holds your weekly workouts.</div>
      <button class="primary" data-act="newroutine">CREATE ROUTINE</button></div>`;
    else {
      const ws = S.workouts.filter(w => w.routineId === r.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      h += `<div class="label" style="margin-top:0">Active routine</div><div class="card"><div class="wname">${esc(r.name)}</div><div class="sub">Since ${fmtDate(r.created)}</div>
        <div class="btnrow"><button class="ghost" data-act="rename">RENAME</button><button class="ghost" data-act="newroutine">NEW ROUTINE</button></div></div>
        <div class="label">Workouts</div><div class="gstack">`;
      for (const w of ws) { const n = w.exercises.length;
        h += `<button class="card" data-edit="${esc(w.id)}"><div class="wrow"><div><div class="t">${esc(w.name)}</div>
          <div class="s">${daysText(w.days)}${w.time ? ' · ' + esc(w.time) : ''} · ${n} exercise${n === 1 ? '' : 's'}</div></div>${I.chev}</div></button>`; }
      h += `<button class="dashed" data-act="addworkout">+ Add workout</button></div>`;
    }
    if (archived.length) h += `<div class="label">Archived</div><div class="group">${archived.map(a =>
      `<button class="row" data-archived="${esc(a.id)}"><span>${esc(a.name)}<br><small style="color:var(--muted);font-size:13px">${fmtDate(a.created)} – ${fmtDate(a.archived)}</small></span>${I.chev}</button>`).join('')}</div>`;
    el.innerHTML = h;
  }

  function routineSheet(mode) {
    const r = activeRoutine();
    openSheet(`<h2>${mode === 'rename' ? 'Rename routine' : 'New routine'}</h2>
      <p>${mode === 'rename' ? '' : r ? `“${esc(r.name)}” will be archived. You can still look at it, but not change it.` : 'Give it a name, e.g. “Autumn block”.'}</p>
      <input class="field" id="routineName" type="text" maxlength="40" placeholder="Routine name" value="${mode === 'rename' ? esc(r.name) : ''}" autocapitalize="words" enterkeyhint="done">
      <button class="primary" data-sheet="routine" data-mode="${mode}">${mode === 'rename' ? 'SAVE' : 'CREATE'}</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
    setTimeout(() => $('routineName').focus(), 300);
  }

  $('gymPlan').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.edit) return openEditor(t.dataset.edit);
    if (t.dataset.archived) return openArchived(t.dataset.archived);
    switch (t.dataset.act) {
      case 'newroutine': return routineSheet('new');
      case 'rename': return routineSheet('rename');
      case 'addworkout': {
        const r = activeRoutine(), ws = S.workouts.filter(w => w.routineId === r.id);
        const w = await RisenDB.saveWorkout({ routineId: r.id, name: 'New workout', order: ws.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1 });
        await load(); return openEditor(w.id, true);
      }
    }
  });

  // ---- Workout editor ----
  let edit = null;
  const saveEdit = debounce(() => edit && RisenDB.saveWorkout(edit).catch(err => toast(err.message)), 400);
  const saveNotes = debounce(ex => RisenDB.saveExercise(ex), 400);

  function openEditor(id, isNew) {
    edit = JSON.parse(JSON.stringify(S.workouts.find(w => w.id === id)));
    renderEditor(); openPage('gymPage', 'Workout');
    pageOnClose = async () => { await saveEdit.flush(); edit = null; await load(); renderPlan(); renderHome(); };
    if (isNew) setTimeout(() => { $('wName').focus(); $('wName').select(); }, 320);
  }
  function renderEditor() {
    const w = edit;
    let h = `<div class="label" style="margin-top:4px">Name</div><input class="field" id="wName" type="text" maxlength="40" value="${esc(w.name)}" autocapitalize="words" enterkeyhint="done">
      <div class="label">Days</div><div class="days-pick">${DAYS.map((d, i) => `<button type="button" data-day="${i + 1}" aria-pressed="${w.days.includes(i + 1)}" aria-label="${d}">${d[0]}</button>`).join('')}</div>
      <div class="label">Time (optional)</div><input class="field" id="wTime" type="time" value="${esc(w.time || '')}">
      <div class="label">Exercises</div><div class="gstack">`;
    w.exercises.forEach((it, i) => {
      const x = exInfo(it.exerciseId);
      h += `<div class="card"><div class="exhead"><div class="wrow"><div><div class="t">${esc(x.name)}</div><div class="s">${esc(x.muscle || '')}</div></div></div>
        <div class="tools"><button data-mv="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${I.up}</button>
        <button data-mv="${i}" data-dir="1" aria-label="Move down" ${i === w.exercises.length - 1 ? 'disabled' : ''}>${I.down}</button>
        <button data-del="${i}" aria-label="Delete">${I.trash}</button></div></div>
        ${x.custom ? `<textarea class="field" style="margin-top:12px" data-notes="${esc(x.id)}" rows="2" maxlength="300" placeholder="Notes: machine, seat setting…">${esc(x.notes || '')}</textarea>` : ''}
        <div class="targets">${['sets', 'kg', 'reps'].map(f => `<label>${f.toUpperCase()}<input class="num" data-i="${i}" data-t="${f}" inputmode="${f === 'kg' ? 'decimal' : 'numeric'}" value="${esc(fmtN(it[f]))}" placeholder="0"></label>`).join('')}</div>
        <div data-photo="${esc(it.exerciseId)}"></div></div>`;
    });
    h += `<button class="dashed" data-act="addex">+ Add exercise</button></div>
      <button class="quiet danger" data-act="delworkout">Delete workout</button>`;
    $('gymPageBody').innerHTML = h;
    $('gymPageBody').querySelectorAll('[data-photo]').forEach(p => PhotoSlot.mount(p, p.dataset.photo, { editable: true }));
  }
  $('gymPageBody').addEventListener('input', e => {
    if (!edit) return; const t = e.target;
    if (t.id === 'wName') edit.name = t.value.trim() || 'Workout';
    else if (t.id === 'wTime') edit.time = t.value;
    else if (t.dataset.t) edit.exercises[t.dataset.i][t.dataset.t] = num(t.value) ?? 0;
    else if (t.dataset.notes) { const x = S.exercises.find(z => z.id === t.dataset.notes); if (x) { x.notes = t.value; saveNotes(x); } return; }
    else return;
    saveEdit();
  });
  $('gymPageBody').addEventListener('change', e => { if (edit && e.target.id === 'wTime') { edit.time = e.target.value; saveEdit(); } });
  $('gymPageBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
  $('gymPageBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !edit) return;
    if (t.dataset.day) {
      const d = +t.dataset.day, on = !edit.days.includes(d);
      edit.days = on ? [...edit.days, d].sort() : edit.days.filter(x => x !== d);
      t.setAttribute('aria-pressed', on); saveEdit(); return;
    }
    if (t.dataset.mv != null) {
      const i = +t.dataset.mv, j = i + +t.dataset.dir, a = edit.exercises;
      [a[i], a[j]] = [a[j], a[i]]; saveEdit(); renderEditor(); return;
    }
    if (t.dataset.del != null) {
      const i = +t.dataset.del;
      if (!confirm(`Delete ${exInfo(edit.exercises[i].exerciseId).name} from this workout? Its history is kept.`)) return;
      edit.exercises.splice(i, 1); saveEdit(); renderEditor(); return;
    }
    if (t.dataset.act === 'addex') return openLibrary(id => { edit.exercises.push({ exerciseId: id, sets: 3, kg: 0, reps: 10 }); saveEdit(); renderEditor(); });
    if (t.dataset.act === 'delworkout') {
      if (!confirm(`Delete the workout “${edit.name}”? Its history is kept.`)) return;
      const id = edit.id; edit = null; pageOnClose = null;
      await RisenDB.deleteWorkout(id); closePage('gymPage'); await load(); renderPlan(); renderHome(); return;
    }
  });

  // ---- Archived routine (read-only) ----
  function openArchived(id) {
    const r = S.routines.find(x => x.id === id), ws = S.workouts.filter(w => w.routineId === id).sort((a, b) => (a.order || 0) - (b.order || 0));
    let h = `<p class="note" style="margin:0 2px 16px">${fmtDate(r.created)} – ${fmtDate(r.archived)} · Archived, read-only</p><div class="gstack">`;
    for (const w of ws) h += `<div class="card ro"><div class="t" style="font-family:Oswald,sans-serif;font-weight:700;font-size:21px;text-transform:uppercase">${esc(w.name)}</div>
      <div class="sub" style="margin-top:4px">${daysText(w.days)}${w.time ? ' · ' + esc(w.time) : ''}</div>
      <div class="sub" style="margin-top:10px;color:var(--text);line-height:1.6">${w.exercises.map(it => `${esc(exInfo(it.exerciseId).name)} <span style="color:var(--muted)">${it.sets} × ${fmtN(it.reps)} @ ${fmtN(it.kg)} kg</span>`).join('<br>') || 'No exercises'}</div></div>`;
    if (!ws.length) h += '<div class="card"><div class="sub">No workouts in this routine.</div></div>';
    $('gymPageBody').innerHTML = h + '</div>';
    pageOnClose = null; openPage('gymPage', r.name);
  }

  // ================= Exercise library =================
  let onPick = null;
  function openLibrary(cb) { onPick = cb; $('libSearch').value = ''; renderLibrary(); openPage('libPage'); }
  function pick(id) { const cb = onPick; onPick = null; closePage('libPage'); if (cb) cb(id); }
  function renderLibrary() {
    const q = $('libSearch').value.trim().toLowerCase();
    const custom = S.exercises.filter(x => x.custom).sort((a, b) => a.name.localeCompare(b.name));
    const groups = [['My exercises', custom], ...LIBRARY.groups.map(g => [g, LIBRARY.list.filter(x => x.muscle === g)])];
    let h = `<button class="dashed" data-act="custom" style="margin:6px 0 4px">+ Custom exercise</button>`;
    for (const [g, items] of groups) {
      const list = items.filter(x => !q || x.name.toLowerCase().includes(q) || g.toLowerCase().includes(q));
      if (!list.length) continue;
      h += `<div class="label">${esc(g)}</div><div class="group libgroup">${list.map(x => `<button class="row" data-pick="${esc(x.id)}">${esc(x.name)}${x.notes ? ` <small>${esc(x.notes)}</small>` : ''}</button>`).join('')}</div>`;
    }
    if (q && !h.includes('data-pick')) h += `<p class="note" style="text-align:center;margin-top:24px">No match. Add it as a custom exercise.</p>`;
    $('libBody').innerHTML = h;
  }
  $('libSearch').addEventListener('input', renderLibrary);
  $('libBody').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.pick) return pick(t.dataset.pick);
    if (t.dataset.act === 'custom') {
      openSheet(`<h2>Custom exercise</h2><p>For a machine or move that isn't in the list.</p>
        <input class="field" id="cxName" type="text" maxlength="40" placeholder="Name" value="${esc($('libSearch').value.trim())}" autocapitalize="sentences">
        <textarea class="field" id="cxNotes" rows="2" maxlength="300" placeholder="Notes: machine, seat setting…"></textarea>
        <button class="primary" data-sheet="custom">SAVE</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
      setTimeout(() => $('cxName').focus(), 300);
    }
  });

  return { open, start };
})();
