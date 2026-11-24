// RISEN Users (instructor tools, .124). Settings > Users > "+ New user": a person the instructor builds a program and supplements FOR.
// Each user is ONE record in the `students` store (db.js): their program (a list of exercises per weekday) and their supplements.
// THE RULE: nothing in this file reads or writes the owner's own program, supplements, workouts, history or photos (S.routines / S.workouts /
// S.meds / logs ...). A user's pages have their own screens and their own data path, so a workout of the owner can never end up in a user.
// Only the exercise LIST (library.js, the picker) is shared: it is a menu of exercises, not anyone's data.
// Send (.130) builds the file; loading it on the user's phone (Load coach file) is the next release.
const Coach = (() => {
  const on = () => window.RISEN_HOME === 'me' || (window.RisenRole && window.RisenRole() === 'instructor');        // .124: Siza's own Home. (A later release also turns it on for the public app's "Instructor" choice.)
  let list = [], cur = null, curDay = 1, supp = null, suppNew = false, flashId = 'uxSaved';
  const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtN = n => (n === '' || n == null) ? '' : String(Math.round(Number(n) * 100) / 100);
  const isCardio = id => exerciseInfo(id).muscle === 'Cardio';
  const dayList = d => (cur.days[d] = cur.days[d] || []);
  const exCount = u => Object.values(u.days || {}).reduce((n, a) => n + a.length, 0);
  const open = id => document.getElementById(id).classList.contains('open');
  const CARDIO_FIELDS = [['min', 'MIN', 'numeric'], ['speed', 'SPEED KM/H', 'decimal'], ['incline', 'INCLINE %', 'decimal']];
  const STRENGTH_FIELDS = [['sets', 'SETS', 'numeric'], ['kg', 'KG', 'decimal'], ['reps', 'REPS', 'numeric']];
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // ---- saving: the whole user record, 0.4 s after the last change (and at once when a page closes or the app is hidden) ----
  const persist = debounce(async () => {
    if (!cur) return;
    try { await RisenDB.saveStudent(cur); savedFlash(flashId); } catch (err) { toast(err.message); }
  }, 400);
  const flush = () => persist.flush().catch(err => toast(err.message));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  addEventListener('pagehide', flush);

  // ---- Settings > Users ----
  async function refresh() {
    const g = $('coachGroup'); if (!g) return;
    g.hidden = !on(); if (!on()) return;
    try { list = (await RisenDB.all('students')).sort((a, b) => String(a.created).localeCompare(String(b.created))); } catch (err) { list = []; }
    renderList();
  }
  function renderList() {
    $('userList').innerHTML = list.map(u => `<div class="urow"><button class="udel" type="button" data-delu="${esc(u.id)}" aria-label="Delete ${esc(u.name)}">${ICONS.trash}</button>`
      + `<button class="row" data-u="${esc(u.id)}"><span class="ut">${esc(u.name)}<small>${plural(exCount(u), 'exercise')} · ${plural((u.supps || []).length, 'supplement')}</small></span>${ICONS.chev}</button></div>`).join('')
      + `<button class="row addrow" id="newUserBtn">+ New user</button>`;
  }
  // Swipe a user's row to the LEFT: it slides over and a red bin shows (80 px); tap the bin to delete (after a confirm). Swipe back, or tap the row, to close it.
  const BIN = 80;
  function slide(row, x, dragging) {
    const b = row.querySelector('.row'); b.style.transition = dragging ? 'none' : ''; b.style.transform = x ? `translateX(${x}px)` : '';
    row.classList.toggle('open', !dragging && x <= -BIN);
  }
  const closeRows = except => document.querySelectorAll('#userList .urow.open').forEach(r => { if (r !== except) slide(r, 0); });
  let tr = null, swiped = 0;
  $('userList').addEventListener('touchstart', e => {
    const row = e.target.closest('.urow'); if (!row) { tr = null; return; }
    closeRows(row); const t = e.touches[0];
    tr = { row, x: t.clientX, y: t.clientY, base: row.classList.contains('open') ? -BIN : 0, dir: null, cx: 0 };
  }, { passive: true });
  $('userList').addEventListener('touchmove', e => {
    if (!tr) return; const t = e.touches[0], dx = t.clientX - tr.x, dy = t.clientY - tr.y;
    if (!tr.dir) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; tr.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'; }
    if (tr.dir !== 'h') return;
    tr.cx = Math.max(-BIN, Math.min(0, tr.base + dx)); slide(tr.row, tr.cx, true);
  }, { passive: true });
  const endTouch = () => {
    if (tr && tr.dir === 'h') { slide(tr.row, tr.cx <= -BIN / 2 ? -BIN : 0); swiped = Date.now(); }
    tr = null;
  };
  $('userList').addEventListener('touchend', endTouch); $('userList').addEventListener('touchcancel', endTouch);
  $('userList').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.u && Date.now() - swiped < 350) return;        // the end of a swipe over a name is not a tap on it (the bin is always ready)
    if (t.id === 'newUserBtn') { closeRows(); return nameSheet(null); }
    if (t.dataset.delu) return deleteUser(t.dataset.delu);
    if (t.dataset.u) {
      const row = t.closest('.urow'); if (row && row.classList.contains('open')) return slide(row, 0);     // an open row only closes
      openUser(t.dataset.u);
    }
  });
  async function deleteUser(id) {
    const u = list.find(x => x.id === id); if (!u) return;
    if (!(await ask({ title: 'Delete user?', text: `${u.name}, their program and their supplements are deleted from this phone. Your own account is not affected.`, ok: 'DELETE USER', danger: true }))) return closeRows();
    try { await RisenDB.deleteStudent(id); } catch (err) { toast(err.message); return; }
    list = list.filter(x => x.id !== id); renderList();
  }

  // ---- name sheet (new user / rename) ----
  let renaming = null;
  function nameSheet(u) {
    renaming = u;
    $('usTitle').textContent = u ? 'Rename user' : 'New user'; $('usSave').textContent = u ? 'SAVE' : 'CREATE';
    $('usName').value = u ? u.name : ''; $('userSheet').hidden = false;
    setTimeout(() => $('usName').focus(), 300);
  }
  const closeNameSheet = () => { $('usName').blur(); $('userSheet').hidden = true; renaming = null; };
  async function saveName() {
    const name = $('usName').value.trim(); if (!name) return $('usName').focus();
    try {
      if (renaming) {
        const u = list.find(x => x.id === renaming.id); u.name = name; await RisenDB.saveStudent(u);
        closeNameSheet(); if (cur && cur.id === u.id) renderUser(); renderList(); return;
      }
      const u = { id: RisenDB.uid(), name, created: new Date().toISOString(), days: {}, supps: [] };
      await RisenDB.saveStudent(u); list.push(u); closeNameSheet(); renderList(); openUser(u.id);
    } catch (err) { toast(err.message); }
  }
  $('usSave').onclick = saveName;
  $('usCancel').onclick = closeNameSheet;
  $('userSheet').onclick = e => { if (e.target === e.currentTarget) closeNameSheet(); };
  $('usName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveName(); } });

  // ---- the bar that always says whose pages these are ----
  const bar = () => `<div class="editbar"><span>Editing: <b>${esc(cur.name)}</b></span><button type="button" data-act="mine">MY ACCOUNT</button></div>`;
  async function mine() {                            // back to the owner's own account: every user page closes
    await flush();
    for (const id of ['userSuppEdit', 'userSuppPage', 'userExPage', 'userPage']) if (open(id)) Pages.close(id);
  }
  for (const id of ['userBody', 'userExBody', 'userSuppBody', 'userSuppEditBody']) $(id).addEventListener('click', e => { if (e.target.closest('[data-act="mine"]')) mine(); }, true);

  // ---- level 1: the user ----
  // Settings is a layer ABOVE the app (z 10, outside #app), so a page opened from it would stay hidden underneath. While a user's pages are open the
  // whole app layer (with its pages and the exercise picker) is lifted above Settings; it goes back down once the last page has slid away.
  function openUser(id) {
    cur = list.find(u => u.id === id); if (!cur) return;
    document.body.classList.add('usersopen');
    renderUser(); Pages.open('userPage');
    Pages.onClose.userPage = () => { cur = null; renderList(); setTimeout(() => { if (!open('userPage')) document.body.classList.remove('usersopen'); }, 340); };
  }
  function renderUser() {
    $('uTitle').textContent = cur.name;
    $('userBody').innerHTML = bar()
      + `<button class="card ucard" data-go="ex"><span class="uct">Exercises</span><span class="ucs">${plural(exCount(cur), 'exercise')}</span>${ICONS.chev}</button>`
      + `<button class="card ucard" data-go="supp"><span class="uct">Supplements</span><span class="ucs">${plural(cur.supps.length, 'supplement')}</span>${ICONS.chev}</button>`
      + `<button class="primary" data-act="send" style="margin-top:22px">SEND TO ${esc(cur.name.toUpperCase())}</button>`
      + `<button class="ghost" data-act="rename" style="width:100%;margin-top:14px">RENAME</button>`;
  }
  $('userBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !cur) return;
    if (t.dataset.go === 'ex') return openEx();
    if (t.dataset.go === 'supp') return openSupp();
    if (t.dataset.act === 'rename') return nameSheet(cur);
    if (t.dataset.act === 'send') return send();
  });

  // ---- Send (.130): ONE small file with this user's program, supplements and the custom exercises the program uses; WhatsApp / AirDrop / Files through the share sheet,
  // a download when the phone cannot share files. One-way: nothing comes back. Loading it on the user's phone is the next release.
  async function send() {
    await flush();
    const days = {};
    for (let d = 1; d <= 7; d++) if ((cur.days[d] || []).length) days[d] = JSON.parse(JSON.stringify(cur.days[d]));
    const supps = JSON.parse(JSON.stringify(cur.supps || []));
    if (!Object.keys(days).length && !supps.length) return toast('Add an exercise or a supplement first');
    const used = new Set(Object.values(days).flat().map(x => x.exerciseId));
    const customs = S.exercises.filter(x => x.custom && used.has(x.id)).map(x => ({ id: x.id, name: x.name, muscle: x.muscle || 'Custom', notes: x.notes || '' }));
    const data = { app: 'risen-coach', version: 1, coach: (S.settings.name || '').trim() || 'Your coach', user: cur.name, created: new Date().toISOString(), days, supps, customs };
    const slug = cur.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';
    const file = new File([JSON.stringify(data)], 'risen-' + slug + '-' + dayKey(new Date()) + '.json', { type: 'application/json' });
    let can = false; try { can = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
    if (can) {
      try { await navigator.share({ files: [file], title: 'RISEN program for ' + cur.name }); return toast('Sent'); }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('File saved');
  }
  $('uBack').onclick = () => Pages.close('userPage');

  // ---- level 2a: the user's exercises (one list per weekday) ----
  function openEx() {
    curDay = 1; flashId = 'uxSaved'; renderEx(); Pages.open('userExPage');
    Pages.onClose.userExPage = async () => { await flush(); if (cur) renderUser(); };
  }
  function renderEx() {
    const l = dayList(curDay), n = l.length;
    $('userExBody').innerHTML = bar()
      + `<div class="udays">${DAYS.map((d, i) => `<button type="button" data-d="${i + 1}" aria-pressed="${i + 1 === curDay}"${(cur.days[i + 1] || []).length ? ' class="has"' : ''}>${d}</button>`).join('')}</div>`
      + `<button class="primary" data-act="add" style="margin:16px 0 14px">+ ADD EXERCISE</button>`
      + (n ? `<div class="gstack">${l.map((it, i) => {
        const x = exerciseInfo(it.exerciseId), fields = isCardio(it.exerciseId) ? CARDIO_FIELDS : STRENGTH_FIELDS;
        return `<div class="card uex"><div class="uexhead"><div class="uexname"><div class="t">${esc(x.name)}</div><div class="s">${esc(x.muscle || '')}</div></div>
          <div class="tools"><button data-mv="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}><svg class="icon" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button>
          <button data-mv="${i}" data-dir="1" aria-label="Move down" ${i === n - 1 ? 'disabled' : ''}><svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
          <button data-del="${i}" aria-label="Delete">${ICONS.trash}</button></div></div>
          <div class="targets">${fields.map(([f, label, mode]) => `<label>${label}<input class="num" data-i="${i}" data-f="${f}" inputmode="${mode}" value="${esc(fmtN(it[f]))}" placeholder="${isCardio(it.exerciseId) ? '–' : '0'}"></label>`).join('')}</div></div>`;
      }).join('')}</div>` : `<p class="note" style="text-align:center;margin-top:30px">Nothing on ${DAYNAMES[curDay - 1]} yet. It stays a rest day until you add an exercise.</p>`);
  }
  $('userExBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !cur) return;
    if (t.dataset.d) { await flush(); curDay = +t.dataset.d; return renderEx(); }
    if (t.dataset.act === 'add') return Gym.openLibrary(id => {
      if (!cur) return;
      dayList(curDay).push(isCardio(id) ? { exerciseId: id, min: null, speed: null, incline: null } : { exerciseId: id, sets: 3, kg: 0, reps: 10 });
      flashId = 'uxSaved'; persist(); renderEx();
    });
    if (t.dataset.mv != null) {
      const a = dayList(curDay), i = +t.dataset.mv, j = i + +t.dataset.dir; if (j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]]; flashId = 'uxSaved'; persist(); return renderEx();
    }
    if (t.dataset.del != null) {
      const a = dayList(curDay), i = +t.dataset.del;
      if (!(await ask({ title: 'Delete exercise?', text: `${exerciseInfo(a[i].exerciseId).name} is deleted from ${DAYNAMES[curDay - 1]} for ${cur.name}.`, ok: 'DELETE', danger: true }))) return;
      a.splice(i, 1); flashId = 'uxSaved'; persist(); renderEx();
    }
  });
  $('userExBody').addEventListener('input', e => {
    const t = e.target; if (!cur || t.dataset.i == null) return;
    const it = dayList(curDay)[+t.dataset.i]; if (!it) return;
    const v = num(t.value);
    if (isCardio(it.exerciseId)) it[t.dataset.f] = v == null ? null : Math.max(0, v);          // blank = left empty; never below 0
    else if (t.dataset.f === 'sets') it.sets = Math.min(20, Math.max(1, Math.round(v ?? 0) || 1));   // a whole number from 1 to 20
    else it[t.dataset.f] = Math.max(0, v ?? 0);
    flashId = 'uxSaved'; persist();
  });
  $('userExBody').addEventListener('change', e => {            // leaving a field: show the number that was kept
    const t = e.target; if (!cur || t.dataset.i == null) return;
    const it = dayList(curDay)[+t.dataset.i]; if (it) t.value = fmtN(it[t.dataset.f]);
  });
  $('userExBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
  $('uxBack').onclick = () => Pages.close('userExPage');

  // ---- level 2b: the user's supplements ----
  const freqText = m => m.freq === 'weekly' ? 'Weekly · ' + (DAYS[(m.days || [])[0] - 1] || '?')
    : m.freq === 'days' ? ([...(m.days || [])].sort().map(x => DAYS[x - 1]).join(' · ') || 'No days') : 'Every day';
  function openSupp() { renderSupp(); Pages.open('userSuppPage'); Pages.onClose.userSuppPage = () => { if (cur) renderUser(); }; }
  function renderSupp() {
    const l = cur.supps;
    $('userSuppBody').innerHTML = bar() + `<button class="primary" data-act="add" style="margin:6px 0 14px">+ ADD SUPPLEMENT</button>`
      + (l.length ? `<div class="group">${l.map(m => `<button class="row" data-sid="${esc(m.id)}"><span class="ut">${esc(m.name)}<small>${[m.dose, (m.times || []).join(', '), freqText(m)].filter(Boolean).map(esc).join(' · ')}</small></span>${ICONS.chev}</button>`).join('')}</div>`
        : `<p class="note" style="text-align:center;margin-top:30px">No supplements yet for ${esc(cur.name)}.</p>`);
  }
  $('userSuppBody').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || !cur) return;
    if (t.dataset.act === 'add') return openSuppEdit(null);
    if (t.dataset.sid) openSuppEdit(t.dataset.sid);
  });
  $('usBack').onclick = () => Pages.close('userSuppPage');

  // ---- level 3: one supplement (same fields as the owner's own supplement editor, without the box photo for now) ----
  const problem = () => !supp.name.trim() ? 'Add a name to save this supplement.' : !supp.times.some(Boolean) ? 'Add at least one time to save this supplement.'
    : (supp.freq !== 'daily' && !supp.days.length) ? 'Pick at least one day to save this supplement.' : '';
  function updateHint() { const p = problem(), h = $('ueHint'); if (!h) return; h.textContent = p; h.hidden = !p; }
  const normalized = () => ({ id: supp.id, name: supp.name.trim(), dose: supp.dose.trim(), times: [...new Set(supp.times.filter(Boolean))].sort(), freq: supp.freq,
    days: supp.freq === 'daily' ? [] : [...supp.days].sort((a, b) => a - b), food: supp.food, notes: supp.notes.trim() });
  const saveSupp = debounce(() => {
    if (!supp || !cur || problem()) return;
    const rec = normalized(), i = cur.supps.findIndex(x => x.id === rec.id);
    if (i >= 0) cur.supps[i] = rec; else cur.supps.push(rec);
    flashId = 'ueSaved'; persist();
  }, 300);
  const touch = () => { updateHint(); saveSupp(); };
  function openSuppEdit(id) {
    const ex = id ? cur.supps.find(m => m.id === id) : null; suppNew = !ex;
    supp = ex ? JSON.parse(JSON.stringify(ex)) : { id: RisenDB.uid(), name: '', dose: '', times: ['08:00'], freq: 'daily', days: [], food: 'any', notes: '' };
    supp.times = supp.times || []; supp.days = supp.days || [];
    $('ueTitle').textContent = ex ? 'Edit supplement' : 'New supplement';
    renderSuppEdit(); Pages.open('userSuppEdit');
    Pages.onClose.userSuppEdit = async () => { await saveSupp.flush(); await flush(); supp = null; if (cur) renderSupp(); };
    if (!ex) setTimeout(() => $('ueName').focus(), 320);
  }
  function renderSuppEdit() {
    const m = supp;
    $('userSuppEditBody').innerHTML = bar() + `<p class="note hint" id="ueHint" hidden></p>
      <div class="label" style="margin-top:4px">Name</div><input class="field" id="ueName" type="text" maxlength="40" autocapitalize="words" autocomplete="off" enterkeyhint="next" placeholder="e.g. Vitamin D" value="${esc(m.name)}">
      <div class="label">Dose</div><input class="field" id="ueDose" type="text" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="1 tablet, 40 mg, 1 injection" value="${esc(m.dose)}">
      <div class="label">When</div><div id="ueTimes"></div>
      <div class="label">How often</div><div id="ueFreq"></div>
      <div class="label">With food?</div><div class="chips" style="margin-top:0" id="ueFood">${[['yes', 'Yes'], ['no', 'No'], ['any', 'Doesn’t matter']].map(([v, t]) =>
        `<button type="button" data-food="${v}" aria-pressed="${m.food === v}">${t}</button>`).join('')}</div>
      <div class="label">Notes (optional)</div><textarea class="field" id="ueNotes" rows="2" maxlength="300" placeholder="e.g. keep in the fridge">${esc(m.notes)}</textarea>
      <button class="quiet danger" data-act="del" type="button">Delete supplement</button>`;
    renderTimes(); renderFreq(); updateHint();
  }
  function renderTimes() {
    $('ueTimes').innerHTML = supp.times.map((t, i) => `<div class="timerow"><input class="field" type="time" data-ti="${i}" value="${esc(t)}" aria-label="Time ${i + 1}">${
      supp.times.length > 1 ? `<button class="timex" type="button" data-tdel="${i}" aria-label="Delete time">${ICONS.x}</button>` : ''}</div>`).join('')
      + '<button class="dashed" type="button" data-act="addtime">+ Add time</button>';
  }
  function renderFreq() {
    $('ueFreq').innerHTML = `<div class="chips" style="margin-top:0">${[['daily', 'Every day'], ['days', 'Chosen days'], ['weekly', 'Weekly']].map(([v, t]) =>
      `<button type="button" data-freq="${v}" aria-pressed="${supp.freq === v}">${t}</button>`).join('')}</div>` + (supp.freq === 'daily' ? '' :
      `<div class="days-pick" style="margin-top:14px">${DAYS.map((d, i) => `<button type="button" data-day="${i + 1}" aria-pressed="${supp.days.includes(i + 1)}" aria-label="${d}">${d[0]}</button>`).join('')}</div>
       <p class="note" style="margin-top:8px">${supp.freq === 'weekly' ? 'Pick the day of the week.' : 'Pick the days it is taken.'}</p>`);
  }
  $('userSuppEditBody').addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ueName') supp.name = t.value;
    else if (t.id === 'ueDose') supp.dose = t.value;
    else if (t.id === 'ueNotes') supp.notes = t.value;
    else if (t.dataset.ti != null) supp.times[t.dataset.ti] = t.value;
    else return;
    touch();
  });
  $('userSuppEditBody').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('input')) return;
    e.preventDefault(); if (e.target.id === 'ueName') $('ueDose').focus(); else e.target.blur();
  });
  $('userSuppEditBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !supp || t.dataset.act === 'mine') return;
    if (t.dataset.freq) {
      const f = t.dataset.freq; if (f === supp.freq) return;
      supp.freq = f; if (f === 'daily') supp.days = []; else if (f === 'weekly') supp.days = [supp.days[0] || 1]; else if (!supp.days.length) supp.days = [1];
      renderFreq(); return touch();
    }
    if (t.dataset.day) {
      const d = +t.dataset.day;
      supp.days = supp.freq === 'weekly' ? [d] : (supp.days.includes(d) ? supp.days.filter(x => x !== d) : [...supp.days, d]);
      renderFreq(); return touch();
    }
    if (t.dataset.food) { supp.food = t.dataset.food; $('ueFood').querySelectorAll('[data-food]').forEach(b => b.setAttribute('aria-pressed', b === t)); return touch(); }
    if (t.dataset.tdel != null) { supp.times.splice(+t.dataset.tdel, 1); renderTimes(); return touch(); }
    if (t.dataset.act === 'addtime') {
      supp.times.push(['20:00', '12:00', '14:00', '18:00', '22:00'].find(x => !supp.times.includes(x)) || ''); renderTimes(); touch();
      const ins = $('ueTimes').querySelectorAll('input'); return ins[ins.length - 1].focus();
    }
    if (t.dataset.act === 'del') {
      if (!(await ask({ title: 'Delete supplement?', text: `“${supp.name.trim() || 'This supplement'}” is deleted from ${cur.name}.`, ok: 'DELETE', danger: true }))) return;
      const id = supp.id; supp = null;                       // a waiting auto-save then does nothing
      cur.supps = cur.supps.filter(x => x.id !== id); flashId = 'ueSaved'; persist();
      Pages.close('userSuppEdit');
    }
  });
  $('ueBack').onclick = () => Pages.close('userSuppEdit');
  $('ueDone').onclick = () => Pages.close('userSuppEdit');

  return { refresh };
})();
