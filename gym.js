// RISEN Gym tab. Three levels: THE WEEK (7 days) -> THE DAY (its exercises) -> THE EXERCISE (targets, photo, notes),
// plus the workout logger (START WORKOUT), which takes over the tab until you finish or discard.
// Uses the shared helpers from index.html (S, load, renderHome, show, toast, esc, dayKey, isoDay, weekDays, plannedOn, ...).

// ---- Shared (also used by Home): exercise info and the automatic title of a day ----
function exerciseInfo(id) {
  const base = LIBRARY.byId[id], rec = S.exercises.find(e => e.id === id);
  if (base) return rec && rec.notes ? { ...base, notes: rec.notes } : base;       // notes on a library exercise live in a small record of their own
  return rec && rec.name ? rec : { ...(rec || {}), id, name: 'Unknown exercise', muscle: '' };   // a record with only notes has no name of its own
}
function workoutTitle(w) {          // "Chest · Triceps": the muscle groups of the exercises, in order
  const seen = [];
  for (const it of w.exercises || []) { const m = exerciseInfo(it.exerciseId).muscle; if (m && m !== 'Custom' && !seen.includes(m)) seen.push(m); }
  return seen.length ? seen.join(' · ') : ((w.exercises || []).length ? 'Workout' : (w.name || ''));
}

const Gym = (() => {
  const I = { ...ICONS,
    up: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    bar: '<svg class="icon" viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  };
  let curDay = null, curEx = null;            // which day / exercise is open (levels 2 and 3)
  let lastDay = dayKey(new Date());

  const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtN = n => (n === '' || n == null) ? '' : String(Math.round(Number(n) * 100) / 100);
  const exInfo = exerciseInfo;
  const daysText = d => (d && d.length) ? [...d].sort().map(x => DAYS[x - 1]).join(' · ') : 'No days set';
  const fmtDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const targetText = it => `${it.sets} × ${fmtN(it.reps)}${num(it.kg) > 0 ? ' · ' + fmtN(it.kg) + ' kg' : ''}`;
  function fmtClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; }
  function fmtDur(ms) { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; }

  // ================= Navigation =================
  function open() { closeAll(); show('gym'); renderGym(); }       // the Gym tab always opens on the week (or the workout in progress)
  // The workout in progress is a copy of the day's plan made at START. This keeps it honest: a plan-based session whose
  // day has no exercises left (or that has none itself) has nothing to log or save, so it is closed and its timer stops.
  // A blank extra workout is built by hand, so it is left alone.
  function syncDraft() {
    const d = draft(); if (!d || d.extra || !d.workoutId) return false;
    const w = S.workouts.find(x => x.id === d.workoutId);
    if (w && (w.exercises || []).length && d.exercises.length) return false;
    S.settings.activeSession = null; saveDraft(); Rest.stop(); return true;
  }
  function openToday() {       // Home's Training tile: today's day (or the workout already running)
    closeAll(); show('gym'); renderGym(); if (!draft()) openDay(isoDay(new Date()));
  }
  function renderGym() {
    if (syncDraft()) toast('Workout closed: no exercises left');
    const d = draft();
    $('gymLog').hidden = !d; $('gymWeek').hidden = !!d;
    if (d) renderLog($('gymLog'), d); else { $('gymLog').innerHTML = ''; renderWeek(); }
    $('view-gym').scrollTop = 0;
    keepAwake();
  }
  // Keep the screen awake while a workout is running (the phone gives the lock back when the app goes to the background,
  // so it is asked for again each time the app returns). Phones that can't do this simply behave as before.
  let wake = null, waking = false;
  async function keepAwake() {
    const want = !!draft() && document.visibilityState === 'visible';
    if (waking) return;
    waking = true;
    try {
      if (want && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
      else if (!want && wake) { const w = wake; wake = null; await w.release(); }
    } catch (e) { wake = null; }
    waking = false;
  }
  const openPage = Pages.open, closePage = Pages.close, onClose = Pages.onClose;
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { document.activeElement.blur(); closePage(b.dataset.close); });

  function openSheet(html, { dismiss = true } = {}) {
    $('gymSheetBody').innerHTML = html; $('gymSheet').hidden = false; $('gymSheet').dataset.dismiss = dismiss ? '1' : '';
  }
  function closeSheet() { document.activeElement.blur(); $('gymSheet').hidden = true; $('gymSheetBody').innerHTML = ''; }
  $('gymSheet').addEventListener('click', e => { if (e.target === $('gymSheet') && $('gymSheet').dataset.dismiss) closeSheet(); });
  function closeAll() { closeSheet(); ['libPage', 'exPage', 'gymPage'].forEach(id => $(id).classList.contains('open') && closePage(id)); }

  // ================= Plan data: one record per weekday in the active program =================
  function dayRec(d) {
    const r = activeRoutine(); if (!r) return null;
    return S.workouts.filter(w => w.routineId === r.id && (w.days || []).length === 1 && w.days[0] === d)
      .sort((a, b) => (b.exercises || []).length - (a.exercises || []).length)[0] || null;
  }
  async function ensureDay(d) {       // the program and the day's record are created the first time they're needed
    let r = activeRoutine();
    if (!r) { r = await RisenDB.createRoutine('My program'); S.routines.push(r); }
    let w = dayRec(d);
    if (!w) { w = await RisenDB.saveWorkout({ routineId: r.id, days: [d], time: '', order: d, exercises: [], name: '' }); S.workouts.push(w); }
    return w;
  }
  const flashSaved = () => savedFlash($('exPage').classList.contains('open') ? 'exSaved' : 'savedMark');
  async function persistDay(d) {
    const w = dayRec(d); if (!w) return;
    w.name = workoutTitle(w);
    if (!w.exercises.length) delete w.since; else if (!w.since) w.since = dayKey(new Date());   // planned from the day it got exercises
    try { await RisenDB.saveWorkout(w); flashSaved(); } catch (err) { toast(err.message); }
    if (syncDraft()) { renderGym(); toast('Workout closed: no exercises left'); }
  }
  const saveDay = debounce(() => curDay ? persistDay(curDay) : null, 400);
  const dirtyNotes = new Set();       // exercises whose notes changed (several can be waiting at once)
  const saveNotes = debounce(async () => {
    const ids = [...dirtyNotes]; dirtyNotes.clear();
    try { for (const id of ids) { const x = S.exercises.find(z => z.id === id); if (x) await RisenDB.saveExercise(x); } if (ids.length) flashSaved(); }
    catch (err) { toast(err.message); }
  }, 400);
  function setNote(id, text) {
    let x = S.exercises.find(e => e.id === id);
    if (!x) { x = { id, notes: '' }; S.exercises.push(x); }
    x.notes = text; dirtyNotes.add(id); saveNotes();
  }

  // ================= LEVEL 1: THE WEEK =================
  function renderWeek() {
    lastDay = dayKey(new Date());
    const el = $('gymWeek'), r = activeRoutine(), tIso = isoDay(new Date()), today = new Date(), wk = weekDays();
    const ids = doneIds(today), sk = skippedIds(today), fm = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    let h = `<div class="gh"><h2>Week</h2><span class="meta">${fm(wk[0])} – ${fm(wk[6])}</span></div><div class="gstack">`;
    let pending = false;
    for (let d = 1; d <= 7; d++) {
      const w = dayRec(d), n = w ? w.exercises.length : 0, isToday = d === tIso;
      let stat = '';
      if (isToday && n) { if (ids.has(w.id)) stat = '<span class="status ok">DONE ✓</span>'; else if (sk.has(w.id)) stat = '<span class="status">SKIPPED</span>'; else pending = true; }
      h += `<button class="card dayrow${isToday ? ' today' : ''}" data-day="${d}"><div class="wrow"><span class="wdn">${DAYS[d - 1].toUpperCase()}</span>
        <div class="wdm">${n ? `<div class="m">${esc(workoutTitle(w))}</div><div class="s">${n} exercise${n === 1 ? '' : 's'}</div>` : '<div class="s">Rest</div>'}</div>${stat}${I.chev}</div></button>`;
    }
    h += '</div>';
    const extras = S.sessions.filter(x => x.date === dayKey(today) && x.extra && x.finishedAt);
    if (extras.length) h += `<div class="gstack" style="margin-top:12px">${extras.map(x => `<div class="card"><div class="wrow"><div><div class="t">${esc(x.name || 'Extra workout')}</div><div class="s">Extra workout</div></div><span class="status ok">DONE ✓</span></div></div>`).join('')}</div>`;
    h += `<div class="btnrow"><button class="ghost" data-act="extra">LOG EXTRA</button>${pending ? '<button class="ghost" data-act="skip">SKIP TODAY</button>' : ''}</div>`;
    if (r) h += `<div class="proglink"><span>Program: <b>${esc(r.name)}</b></span><button class="linkbtn" data-act="rename">Rename</button><button class="linkbtn" data-act="newprogram">New program</button></div>`;
    const archived = S.routines.filter(x => x.status === 'archived').sort((a, b) => (b.archived || '').localeCompare(a.archived || ''));
    if (archived.length) h += `<div class="label">Archived programs</div><div class="group">${archived.map(a =>
      `<button class="row" data-archived="${esc(a.id)}"><span>${esc(a.name)}<br><small style="color:var(--muted);font-size:13px">${fmtDate(a.created)} – ${fmtDate(a.archived)}</small></span>${I.chev}</button>`).join('')}</div>`;
    el.innerHTML = h;
  }
  $('gymWeek').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.day) return openDay(+t.dataset.day);
    if (t.dataset.archived) return openArchived(t.dataset.archived);
    switch (t.dataset.act) {
      case 'extra': return extraSheet();
      case 'skip': return skipSheet();
      case 'rename': return routineSheet('rename');
      case 'newprogram': {
        const r = activeRoutine();
        ask({ title: 'Start a new program?', text: `“${r.name}” will be archived (read-only). Your history, including “Last time”, is kept.`, ok: 'CONTINUE' }).then(y => { if (y) routineSheet('new'); });
        return;
      }
    }
  });
  function routineSheet(mode) {
    const r = activeRoutine();
    openSheet(`<h2>${mode === 'rename' ? 'Rename program' : 'New program'}</h2>
      <p>${mode === 'rename' ? '' : r ? `“${esc(r.name)}” will be archived. You can still look at it, but not change it.` : 'Give it a name, e.g. “Autumn block”.'}</p>
      <input class="field" id="routineName" type="text" maxlength="40" placeholder="Program name" value="${mode === 'rename' ? esc(r.name) : ''}" autocapitalize="words" enterkeyhint="done">
      <button class="primary" data-sheet="routine" data-mode="${mode}">${mode === 'rename' ? 'SAVE' : 'CREATE'}</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
    setTimeout(() => $('routineName').focus(), 300);
  }

  // ================= LEVEL 2: THE DAY =================
  const thumbs = new Map();            // exerciseId -> object URL, or null when there is no photo
  const thumbHtml = id => thumbs.get(id) ? `<img alt="" src="${thumbs.get(id)}">` : I.bar;
  function dropThumb(id) { if (thumbs.get(id)) URL.revokeObjectURL(thumbs.get(id)); thumbs.delete(id); }
  function clearThumbs() { for (const id of [...thumbs.keys()]) dropThumb(id); }
  async function loadThumbs() {
    const els = [...document.querySelectorAll('#gymPageBody [data-xph]')];
    for (const el of els) { const id = el.dataset.xph; if (thumbs.has(id)) continue; const p = await RisenDB.getPhoto(id); thumbs.set(id, p ? URL.createObjectURL(p.blob) : null); }
    for (const el of els) { const u = thumbs.get(el.dataset.xph); if (u && !el.querySelector('img')) el.innerHTML = `<img alt="" src="${u}">`; }
  }

  function openDay(d) {
    curDay = d; clearThumbs(); $('gymPage').classList.add('editing'); $('gymPageTitle').textContent = DAYNAMES[d - 1];
    renderDay(); openPage('gymPage');
    onClose.gymPage = async () => { await flush(); curDay = null; renderWeek(); renderHome(); };
  }
  function renderDay() {
    const d = curDay, w = dayRec(d), list = w ? w.exercises : [], n = list.length;
    const canStart = d === isoDay(new Date()) && n && !doneIds(new Date()).has(w.id) && !skippedIds(new Date()).has(w.id);   // START WORKOUT is the main button then
    let h = `<button class="primary${canStart ? ' nogl' : ''}" data-act="addex" style="margin-top:6px">+ ADD EXERCISE</button>
      <div class="gh" style="margin-top:22px"><h2>${esc(n ? workoutTitle(w) : 'Rest day')}</h2><span class="meta">${n} exercise${n === 1 ? '' : 's'}</span></div>`;
    if (d === isoDay(new Date()) && n) {              // starting is only possible on today's day
      const today = new Date();
      if (doneIds(today).has(w.id)) h += `<div class="card" style="margin-bottom:14px"><div class="wrow"><div><div class="t">Workout done</div></div><span class="status ok">DONE ✓</span></div></div>`;
      else if (skippedIds(today).has(w.id)) h += `<div class="card" style="margin-bottom:14px"><div class="wrow"><div><div class="t">Skipped today</div><div class="s">${esc(S.sessions.find(x => x.date === dayKey(today) && x.skipped && x.workoutId === w.id).reason)}</div></div><span class="status">SKIPPED</span></div></div>`;
      else h += `<button class="primary big" data-act="startw" style="margin:0 0 14px">START WORKOUT</button>`;
    }
    h += `<div class="gstack">${list.map((it, i) => {
      const x = exInfo(it.exerciseId);
      return `<div class="card wcard"><div class="wrow xrow"><button class="wmain" data-open="${i}"><span class="exthumb" data-xph="${esc(it.exerciseId)}">${thumbHtml(it.exerciseId)}</span>
        <div class="xt"><div class="t">${esc(x.name)}</div><div class="s">${esc(targetText(it))}</div></div></button>
        <div class="tools"><button data-mv="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${I.up}</button>
        <button data-mv="${i}" data-dir="1" aria-label="Move down" ${i === n - 1 ? 'disabled' : ''}>${I.down}</button>
        <button data-del="${i}" aria-label="Delete">${I.trash}</button></div></div></div>`;
    }).join('')}</div>`;
    if (n) h += `<button class="ghost" data-act="copy" style="width:100%;margin-top:18px">COPY TO…</button>`;
    $('gymPageBody').innerHTML = h;
    loadThumbs();
  }
  $('gymPageBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || curDay == null) return;
    const w = dayRec(curDay);
    if (t.dataset.open != null) return openExercise(+t.dataset.open);
    if (t.dataset.mv != null) {
      const i = +t.dataset.mv, j = i + +t.dataset.dir, a = w.exercises;
      [a[i], a[j]] = [a[j], a[i]]; await persistDay(curDay); return renderDay();
    }
    if (t.dataset.del != null) {
      const i = +t.dataset.del;
      if (!(await ask({ title: 'Delete exercise?', text: `${exInfo(w.exercises[i].exerciseId).name} is deleted from ${DAYNAMES[curDay - 1]}. Its history is kept.`, ok: 'DELETE', danger: true }))) return;
      w.exercises.splice(i, 1); await persistDay(curDay); return renderDay();
    }
    switch (t.dataset.act) {
      case 'addex': return openLibrary(async id => {
        const rec = await ensureDay(curDay); rec.exercises.push({ exerciseId: id, sets: 3, kg: 0, reps: 10 });
        await persistDay(curDay); renderDay();
      });
      case 'startw': return start(w.id);
      case 'copy': return copySheet();
    }
  });
  function copySheet() {
    const w = dayRec(curDay), n = w.exercises.length;
    openSheet(`<h2>Copy to…</h2><p>Copy ${DAYNAMES[curDay - 1]} (${esc(workoutTitle(w))}, ${n} exercise${n === 1 ? '' : 's'}) to the days you pick, targets included.</p>
      <div class="chips">${DAYS.map((nm, i) => i + 1 === curDay ? '' : `<button type="button" data-cday="${i + 1}" aria-pressed="false">${nm}</button>`).join('')}</div>
      <button class="primary" data-sheet="docopy">COPY</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
  }

  // ================= LEVEL 3: THE EXERCISE =================
  function openExercise(i) {
    curEx = i; const it = dayRec(curDay).exercises[i];
    renderExercise(); openPage('exPage');
    onClose.exPage = async () => { await flush(); dropThumb(it.exerciseId); curEx = null; renderDay(); };
  }
  function renderExercise() {
    const it = dayRec(curDay).exercises[curEx], x = exInfo(it.exerciseId);
    $('exTitle').textContent = x.name;
    $('exBody').innerHTML = `<div id="exPhoto"></div>
      <div class="label">Sets · KG · Reps</div>
      <div class="targets" style="margin-top:0">${['sets', 'kg', 'reps'].map(f => `<label>${f.toUpperCase()}<input class="num" data-t="${f}" inputmode="${f === 'kg' ? 'decimal' : 'numeric'}" value="${esc(fmtN(it[f]))}" placeholder="0"></label>`).join('')}</div>
      <div class="last" id="exLast" style="margin-top:12px"></div>
      <div class="label">Notes</div><textarea class="field" id="exNotes" rows="2" maxlength="300" placeholder="Seat, machine, settings…">${esc(x.notes || '')}</textarea>
      ${x.custom ? `<div class="label">Muscle group</div><div class="chips" style="margin-top:0" id="exMuscle">${LIBRARY.groups.map(g => `<button type="button" data-xm="${g}" aria-pressed="${x.muscle === g}">${g}</button>`).join('')}</div>` : ''}`;
    PhotoSlot.mount($('exPhoto'), it.exerciseId, { editable: true });
    const idx = curEx;
    RisenDB.historyOf(it.exerciseId).then(hs => {
      const l = hs.find(h => h.sets && h.sets.length), el = $('exLast'); if (!el || curEx !== idx) return;
      const s = l && topSet(l.sets);
      el.innerHTML = l ? `Last time: <b>${fmtN(s.kg)} kg × ${fmtN(s.reps)}</b>` : 'No history yet';
    });
  }
  $('exBody').addEventListener('input', e => {
    const t = e.target, w = curDay != null && dayRec(curDay); if (!w || curEx == null) return;
    const it = w.exercises[curEx];
    if (t.dataset.t) {
      let v = num(t.value) ?? 0;
      if (t.dataset.t === 'sets') v = Math.min(20, Math.max(1, Math.round(v) || 1));     // sets: a whole number from 1 to 20
      it[t.dataset.t] = v; saveDay();
    }
    else if (t.id === 'exNotes') setNote(it.exerciseId, t.value);
  });
  $('exBody').addEventListener('change', e => {      // leaving the sets field: show the number that was kept (e.g. 25 -> 20)
    const t = e.target, w = curDay != null && dayRec(curDay); if (!w || curEx == null || t.dataset.t !== 'sets') return;
    t.value = fmtN(w.exercises[curEx].sets);
  });
  $('exBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
  $('exBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !t.dataset.xm) return;
    const id = dayRec(curDay).exercises[curEx].exerciseId, x = S.exercises.find(z => z.id === id); if (!x) return;
    x.muscle = t.dataset.xm; await RisenDB.saveExercise(x); flashSaved();
    $('exMuscle').querySelectorAll('[data-xm]').forEach(b => b.setAttribute('aria-pressed', b === t));
    await persistDay(curDay);                       // the day's title follows the muscle group
  });

  // ================= The workout in progress (logger) =================
  const draft = () => S.settings.activeSession || null;
  const saveDraft = () => RisenDB.setSetting('activeSession', S.settings.activeSession || null);
  const saveDraftSoon = debounce(saveDraft, 400);

  function topSet(sets) { return sets.reduce((a, b) => (num(b.kg) ?? 0) > (num(a.kg) ?? 0) || ((num(b.kg) ?? 0) === (num(a.kg) ?? 0) && (num(b.reps) ?? 0) > (num(a.reps) ?? 0)) ? b : a); }
  async function newEntry(exerciseId, target) {
    const last = (await RisenDB.historyOf(exerciseId)).find(h => h.sets && h.sets.length);
    const n = Math.min(20, Math.max(1, Math.round(target && target.sets ? target.sets : (last ? last.sets.length : 3)) || 1));
    const sets = [...Array(n)].map((_, i) => {
      const src = last ? (last.sets[i] || last.sets[last.sets.length - 1]) : (target ? { kg: target.kg, reps: target.reps } : {});
      return { kg: fmtN(src.kg), reps: fmtN(src.reps), done: false };
    });
    return { exerciseId, sets, last: last ? topSet(last.sets) : null };
  }

  async function start(workoutId, { extra = false } = {}) {
    const d = draft();
    if (d) { open(); if (d.workoutId !== workoutId) toast('Finish or discard the workout in progress first'); return; }
    const w = workoutId ? S.workouts.find(x => x.id === workoutId) : null;
    if (w && !(w.exercises || []).length) return toast('Nothing planned for that day');
    const exercises = [];
    for (const t of (w ? w.exercises : [])) exercises.push(await newEntry(t.exerciseId, t));
    S.settings.activeSession = { id: RisenDB.uid(), workoutId: w ? w.id : null, routineId: w ? w.routineId : ((activeRoutine() || {}).id || null),
      name: w ? (workoutTitle(w) || w.name || 'Workout') : 'Extra workout', extra, date: dayKey(new Date()), startedAt: new Date().toISOString(), exercises };
    await saveDraft(); open();
  }

  function renderLog(el, d) {
    let h = `<div class="gh"><h2>${esc(d.name)}</h2><span class="meta elapsed" id="elapsed">${fmtClock(Date.now() - new Date(d.startedAt))}</span></div><div class="gstack">`;
    d.exercises.forEach((e, i) => {
      const x = exerciseInfo(e.exerciseId);
      h += `<div class="card ex"><div class="exhead"><div><h3>${esc(x.name)}</h3>${x.notes ? `<div class="notes">${esc(x.notes)}</div>` : ''}</div>
        <div class="tools"><button data-rmex="${i}" aria-label="Delete from this workout">${I.trash}</button></div></div>
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

  $('gymLog').addEventListener('input', e => {
    const inp = e.target.closest('.num'); if (!inp) return;
    const row = inp.closest('.setrow'), d = draft();
    d.exercises[row.dataset.ex].sets[row.dataset.set][inp.dataset.f] = inp.value; saveDraftSoon();
  });
  $('gymLog').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('.num')) return;
    e.preventDefault(); const row = e.target.closest('.setrow');
    if (e.target.dataset.f === 'kg') row.querySelector('[data-f="reps"]').focus(); else e.target.blur();
  });
  $('gymLog').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = draft();
    if (t.hasAttribute('data-tick')) {
      const row = t.closest('.setrow'), s = d.exercises[row.dataset.ex].sets[row.dataset.set];
      if (!s.done) {
        if (!(num(s.reps) > 0)) { row.querySelector('[data-f="reps"]').focus(); toast('Enter the reps first'); return; }
        if (num(s.kg) == null) { s.kg = '0'; row.querySelector('[data-f="kg"]').value = '0'; }
        s.done = true; document.activeElement.blur(); Rest.start();
      } else s.done = false;
      row.classList.toggle('done', s.done); if (s.done) Motion.pop(row.querySelector('.tick'), row); saveDraft(); return;
    }
    if (t.dataset.addset != null) {
      const sets = d.exercises[t.dataset.addset].sets, p = sets[sets.length - 1] || { kg: '', reps: '' };
      sets.push({ kg: p.kg, reps: p.reps, done: false }); saveDraft(); renderGym(); return;
    }
    if (t.dataset.rmex != null) {
      if (!(await ask({ title: 'Delete from this workout?', text: `${exerciseInfo(d.exercises[t.dataset.rmex].exerciseId).name} is taken out of this workout only. Your program doesn't change.`, ok: 'DELETE', danger: true }))) return;
      d.exercises.splice(t.dataset.rmex, 1); saveDraft(); renderGym(); return;
    }
    switch (t.dataset.act) {
      case 'addex': return openLibrary(async id => { draft().exercises.push(await newEntry(id, null)); await saveDraft(); renderGym(); });
      case 'finish': return finish();
      case 'discard':
        if (!(await ask({ title: 'Discard this workout?', text: 'Nothing will be saved.', ok: 'DISCARD', danger: true }))) return;
        S.settings.activeSession = null; await saveDraft(); Rest.stop(); renderGym(); renderHome(); return;
    }
  });

  async function finish() {
    const d = draft();
    const all = d.exercises.flatMap(e => e.sets), doneN = all.filter(s => s.done).length;
    if (!doneN) { if (await ask({ title: 'Nothing to save', text: 'No sets are ticked. Discard this workout?', ok: 'DISCARD', danger: true, cancel: 'Keep going' })) { S.settings.activeSession = null; await saveDraft(); Rest.stop(); renderGym(); } return; }
    if (doneN < all.length && !(await ask({ title: 'Finish anyway?', text: "Unchecked sets won't be saved.", ok: 'FINISH' }))) return;
    const entries = d.exercises.map(e => ({ exerciseId: e.exerciseId, sets: e.sets.filter(s => s.done).map(s => ({ kg: num(s.kg) ?? 0, reps: num(s.reps) ?? 0 })) }))
      .filter(e => e.sets.length);
    let ses;
    try { ses = await RisenDB.logSession({ date: d.date, workoutId: d.workoutId, routineId: d.routineId, name: d.name, extra: d.extra, startedAt: d.startedAt, entries }); }
    catch (err) { toast('Could not save the workout. Nothing is lost: tap FINISH WORKOUT again.'); return; }
    S.settings.activeSession = null; await saveDraft(); Rest.stop();
    await load(); renderHome(); renderGym();
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
    const r = activeRoutine(), ws = r ? S.workouts.filter(w => w.routineId === r.id && (w.days || []).length === 1 && (w.exercises || []).length).sort((a, b) => a.days[0] - b.days[0]) : [];
    openSheet(`<h2>Log extra workout</h2><p>An unplanned workout. It's saved to your history.</p>
      <div class="list">${ws.map(w => `<button data-extra="${esc(w.id)}">${DAYS[w.days[0] - 1]} · ${esc(workoutTitle(w))}</button>`).join('')}<button data-extra="">Blank workout (add exercises as you go)</button></div>
      <button class="textbtn" data-sheet="cancel">Cancel</button>`);
  }

  $('gymSheetBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.chip) { const on = t.getAttribute('aria-pressed') !== 'true'; $('gymSheetBody').querySelectorAll('[data-chip]').forEach(c => c.setAttribute('aria-pressed', 'false')); t.setAttribute('aria-pressed', on); return; }
    if (t.dataset.mchip) { const on = t.getAttribute('aria-pressed') !== 'true'; $('gymSheetBody').querySelectorAll('[data-mchip]').forEach(c => c.setAttribute('aria-pressed', 'false')); t.setAttribute('aria-pressed', on); return; }
    if (t.dataset.cday) { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true'); return; }
    if (t.dataset.extra != null) { closeSheet(); return start(t.dataset.extra || null, { extra: true }); }
    switch (t.dataset.sheet) {
      case 'cancel': return closeSheet();
      case 'home': closeSheet(); renderHome(); return show('home');
      case 'doskip': {
        const chip = $('gymSheetBody').querySelector('[data-chip][aria-pressed="true"]'), note = $('skipNote').value.trim();
        const reason = [chip && chip.dataset.chip, note].filter(Boolean).join(': ');
        if (!reason) return toast('Pick a reason or type one');
        const today = new Date(), ids = doneIds(today), sk = skippedIds(today);
        await RisenDB.skipWorkouts({ date: dayKey(today), workoutIds: plannedOn(today).filter(w => !ids.has(w.id) && !sk.has(w.id)).map(w => w.id), routineId: activeRoutine().id, reason });
        closeSheet(); await load(); renderGym(); renderHome(); return toast('Day skipped');
      }
      case 'routine': {
        const name = $('routineName').value.trim(); if (!name) return $('routineName').focus();
        if (t.dataset.mode === 'rename') await RisenDB.renameRoutine(activeRoutine().id, name); else await RisenDB.createRoutine(name);
        closeSheet(); await load(); renderWeek(); renderHome(); return;
      }
      case 'docopy': {
        const days = [...$('gymSheetBody').querySelectorAll('[data-cday][aria-pressed="true"]')].map(b => +b.dataset.cday);
        if (!days.length) return toast('Pick a day');
        const filled = days.filter(d => (dayRec(d) || { exercises: [] }).exercises.length);
        if (filled.length && !(await ask({ title: 'Replace exercises?', text: `The exercises on ${filled.map(d => DAYNAMES[d - 1]).join(', ')} will be replaced.`, ok: 'REPLACE', danger: true }))) return;
        const copy = JSON.parse(JSON.stringify(dayRec(curDay).exercises));
        for (const d of days) { const w = await ensureDay(d); w.exercises = JSON.parse(JSON.stringify(copy)); await persistDay(d); }
        closeSheet(); renderDay(); return toast('Copied to ' + days.map(d => DAYS[d - 1]).join(', '));
      }
      case 'custom': {
        const name = $('cxName').value.trim(); if (!name) return $('cxName').focus();
        const m = $('gymSheetBody').querySelector('[data-mchip][aria-pressed="true"]');
        const ex = await RisenDB.saveExercise({ name, muscle: m ? m.dataset.mchip : 'Custom', notes: $('cxNotes').value.trim(), custom: true });
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

  // ================= Archived program (read-only) =================
  function openArchived(id) {
    const r = S.routines.find(x => x.id === id);
    const ws = S.workouts.filter(w => w.routineId === id && (w.exercises || []).length).sort((a, b) => ((a.days || [9])[0]) - ((b.days || [9])[0]) || (a.order || 0) - (b.order || 0));
    let h = `<p class="note" style="margin:0 2px 16px">${fmtDate(r.created)} – ${fmtDate(r.archived)} · Archived, read-only</p><div class="gstack">`;
    for (const w of ws) h += `<div class="card ro"><div class="t" style="font-family:Oswald,sans-serif;font-weight:700;font-size:21px;text-transform:uppercase">${esc(workoutTitle(w))}</div>
      <div class="sub" style="margin-top:4px">${daysText(w.days)}</div>
      <div class="sub" style="margin-top:10px;color:var(--text);line-height:1.6">${w.exercises.map(it => `${esc(exInfo(it.exerciseId).name)} <span style="color:var(--muted)">${it.sets} × ${fmtN(it.reps)} @ ${fmtN(it.kg)} kg</span>`).join('<br>')}</div></div>`;
    if (!ws.length) h += '<div class="card"><div class="sub">No exercises in this program.</div></div>';
    $('gymPageBody').innerHTML = h + '</div>';
    curDay = null; onClose.gymPage = null; $('gymPage').classList.remove('editing'); $('gymPageTitle').textContent = r.name; openPage('gymPage');
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
        <div class="chips" style="margin-top:14px">${LIBRARY.groups.map(g => `<button type="button" data-mchip="${g}" aria-pressed="false">${g}</button>`).join('')}</div>
        <textarea class="field" id="cxNotes" rows="2" maxlength="300" placeholder="Notes: machine, seat setting…"></textarea>
        <button class="primary" data-sheet="custom">SAVE</button><button class="textbtn" data-sheet="cancel">Cancel</button>`);
      setTimeout(() => $('cxName').focus(), 300);
    }
  });

  function reset() { Rest.stop(); closeAll(); curDay = null; curEx = null; clearThumbs(); }

  // Write every pending change now (day plan, notes, workout in progress)
  function flush() { return Promise.all([saveDay.flush(), saveNotes.flush(), saveDraftSoon.flush()]).catch(err => toast(err.message)); }
  function dayRolled() {      // a new day started while the app was open: today's row moves on by itself
    if (dayKey(new Date()) === lastDay) return;
    if (!$('view-gym').hidden && !draft() && !$('gymPage').classList.contains('open')) renderWeek(); else lastDay = dayKey(new Date());
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else dayRolled(); keepAwake(); });
  addEventListener('pagehide', flush);
  setInterval(dayRolled, 60000);

  // A workout left over from before (e.g. emptied) is cleaned up as soon as the data is loaded
  ready.then(() => {
    if (syncDraft()) renderHome();
    // A workout is in progress (the phone restarted the app, or it was closed): skip the intro and open it
    if (draft() && !intro.classList.contains('hidden')) { renderHome(); intro.classList.add('hidden'); app.classList.remove('hidden'); open(); }
  });

  // The built-in list changed (library.js: aliases / retired)? Bring this phone's plan, history and photos along. Does nothing otherwise.
  // Done once per library change: the fingerprint of aliases + retired is remembered in settings (libraryFollowed), so an ordinary
  // start does not read every workout and every log. A new alias changes the fingerprint and it runs again by itself. An import
  // (old backups may hold old ids) passes force.
  const libSig = () => { const s = JSON.stringify([LIBRARY.aliases, LIBRARY.retired]); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };
  async function followLibrary({ force = false } = {}) {
    const sig = libSig();
    if (!force && S.settings.libraryFollowed === sig) return false;
    let changed;
    try { changed = await RisenDB.migrateLibrary(LIBRARY); } catch (err) { console.error(err); return false; }       // not marked done: tried again next time
    try { await RisenDB.setSetting('libraryFollowed', sig); S.settings.libraryFollowed = sig; } catch (err) { console.error(err); }
    if (!changed) return false;
    await load(); clearThumbs();
    if (!$('view-gym').hidden && !$('gymPage').classList.contains('open')) renderGym();
    renderHome(); return true;
  }
  ready.then(() => followLibrary());

  return { open, openToday, start, reset, flush, followLibrary };
})();
