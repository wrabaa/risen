// RISEN Meds tab: TODAY (progress ring + today's doses) and MY MEDS (add, edit, pause, delete).
// Uses the shared helpers from index.html (S, load, renderHome, show, toast, esc, dayKey, isoDay, weekDays).
const Meds = (() => {
  const I = {
    check: ICONS.check, x: ICONS.x,
    pill: '<svg class="icon" viewBox="0 0 24 24"><rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)"/><path d="m8.6 8.6 6.8 6.8"/></svg>',
  };

  // ================= Schedule helpers =================
  const pad = n => String(n).padStart(2, '0');
  const hhmm = iso => { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const logId = (medId, date, time) => `${medId}|${date}|${time}`;
  const logMap = () => new Map(S.medlogs.map(l => [l.id, l]));

  // Is this med due on that day? (paused meds never are; nothing before the day it was added)
  function dueOn(m, d) {
    if (m.paused || dayKey(d) < dayKey(new Date(m.created))) return false;
    return m.freq === 'daily' || !m.freq ? true : (m.days || []).includes(isoDay(d));
  }
  function dosesOn(d) {   // every dose due that day, in time order
    const k = dayKey(d), out = [];
    for (const m of S.meds) if (dueOn(m, d)) for (const t of m.times || []) out.push({ m, t, id: logId(m.id, k, t) });
    return out.sort((a, b) => a.t.localeCompare(b.t) || a.m.name.localeCompare(b.m.name));
  }
  function summary() {    // for the Home tile
    const lm = logMap(), doses = dosesOn(new Date());
    return { hasMeds: S.meds.length > 0, total: doses.length, taken: doses.filter(x => lm.has(x.id)).length, next: doses.find(x => !lm.has(x.id)) };
  }
  const foodText = m => m.food === 'yes' ? 'With food' : m.food === 'no' ? 'Without food' : '';
  function freqText(m) {
    if (m.freq === 'weekly') return 'Weekly · ' + (DAYS[(m.days || [])[0] - 1] || '?');
    if (m.freq === 'days') return [...(m.days || [])].sort().map(x => DAYS[x - 1]).join(' · ') || 'No days';
    return 'Every day';
  }

  // ================= Photos (small cache so a tap doesn't make the pictures flash) =================
  const thumbs = new Map();   // medId -> object URL, or null when there's no photo
  const thumbHtml = id => thumbs.get(id) ? `<img alt="" src="${thumbs.get(id)}">` : I.pill;
  function dropThumb(id) { if (thumbs.get(id)) URL.revokeObjectURL(thumbs.get(id)); thumbs.delete(id); }
  function clearThumbs() { for (const id of [...thumbs.keys()]) dropThumb(id); }
  async function loadThumbs() {
    const els = [...document.querySelectorAll('#medsBody [data-mphoto]')];
    for (const el of els) {
      const id = el.dataset.mphoto; if (thumbs.has(id)) continue;
      const p = await RisenDB.getPhoto('med-' + id); thumbs.set(id, p ? URL.createObjectURL(p.blob) : null);
    }
    for (const el of els) { const u = thumbs.get(el.dataset.mphoto); if (u && !el.querySelector('img')) el.innerHTML = `<img alt="" src="${u}">`; }
  }

  // ================= TODAY + MY MEDS =================
  let lastFrac = null, lastDay = dayKey(new Date());

  function stripHtml(m, lm) {   // last 7 days (Mon-Sun): lime = all taken, half = some, grey = missed, tiny = not scheduled
    const todayK = dayKey(new Date());
    return '<div class="mstrip">' + weekDays().map(d => {
      const k = dayKey(d), due = dueOn(m, d) ? m.times : [], n = due.filter(t => lm.has(logId(m.id, k, t))).length;
      const st = !due.length ? 'off' : n === due.length ? 'full' : n > 0 ? 'half' : k < todayK ? 'miss' : 'pend';
      return `<span class="sd${k === todayK ? ' today' : ''}"><i class="md ${st}"></i><b>${'MTWTFSS'[isoDay(d) - 1]}</b></span>`;
    }).join('') + '</div>';
  }
  function doseCard(d, lm) {
    const m = d.m, log = lm.get(d.id), food = foodText(m);
    const meta = [log ? `<b>Taken ${hhmm(log.takenAt)}</b>` : '', food].filter(Boolean).join(' · ');
    return `<div class="dose${log ? ' taken' : ''}"><div class="drow">
      <div class="dphoto" data-mphoto="${esc(m.id)}">${thumbHtml(m.id)}</div>
      <div class="dmain"><div class="dname">${esc(m.name)}</div>${m.dose ? `<div class="ddose">${esc(m.dose)}</div>` : ''}${meta ? `<div class="dtime">${meta}</div>` : ''}</div>
      <button class="dtick" data-dose="${esc(d.id)}" aria-label="${log ? 'Taken, tap to undo' : 'Mark as taken'}">${I.check}</button></div>
      ${stripHtml(m, lm)}</div>`;
  }
  // Doses with the same time sit under one header, e.g. "14:00 · LUNCH"
  function dayPart(t) { const h = +String(t).slice(0, 2); return h >= 5 && h < 11 ? 'Morning' : h >= 11 && h < 15 ? 'Lunch' : h >= 15 && h < 21 ? 'Evening' : 'Night'; }
  function groupHtml(g, lm) {
    const left = g.ds.filter(d => !lm.has(d.id)).length;
    return `<div class="dgroup"><div class="dhead"><span class="dh">${esc(g.t)} · ${dayPart(g.t)}</span>${left
      ? `<button class="takeall" data-takeall="${esc(g.t)}">✓ TAKE ALL</button>` : '<span class="alldone">ALL TAKEN ✓</span>'}</div>
      <div class="dstack">${g.ds.map(d => doseCard(d, lm)).join('')}</div></div>`;
  }
  // A row of "My meds": the whole row opens the editor (pause and delete live there)
  function listCard(m) {
    const sub = [m.dose, (m.times || []).join(', '), freqText(m), m.paused ? 'Paused' : ''].filter(Boolean).map(esc).join(' · ');
    return `<button class="card${m.paused ? ' paused' : ''}" data-edit="${esc(m.id)}"><div class="wrow"><div><div class="t">${esc(m.name)}</div><div class="s">${sub}</div></div></div></button>`;
  }

  function render() {
    const el = $('medsBody'); lastDay = dayKey(new Date());
    const now = new Date(), lm = logMap(), doses = dosesOn(now), total = doses.length, taken = doses.filter(d => lm.has(d.id)).length;
    let h = `<div class="gh"><h2>Meds</h2><span class="meta">${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>`;
    const groups = []; for (const d of doses) { const g = groups[groups.length - 1]; if (g && g.t === d.t) g.ds.push(d); else groups.push({ t: d.t, ds: [d] }); }
    let ring = null;
    if (!S.meds.length) {
      h += `<div class="card empty"><div class="wname">No meds yet</div><div class="sub">Add your medication and supplements to tick off what you take each day.</div>
        <button class="primary" data-act="add">+ ADD MED</button></div>`;
    } else {
      const C = 2 * Math.PI * 52, frac = total ? taken / total : 0, from = lastFrac == null ? frac : lastFrac; lastFrac = frac;
      const complete = total > 0 && taken === total;
      const label = complete ? 'All done today ✓' : total ? `${total - taken} dose${total - taken === 1 ? '' : 's'} to go` : 'No doses today';
      ring = { C, frac, from };
      h += `<div class="gstack"><div class="card ringcard"><div class="ringwrap"><svg viewBox="0 0 120 120"><circle class="rtrack" cx="60" cy="60" r="52"/>
        <circle class="rfill" id="rfill" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - from)}" transform="rotate(-90 60 60)"/></svg>
        <div class="rnum"><span>${taken}<small>/${total}</small></span></div></div><div class="rlabel${complete ? ' ok' : ''}">${label}</div></div>
        ${groups.map(g => groupHtml(g, lm)).join('')}</div>`;
      const list = [...S.meds].sort((a, b) => (a.paused ? 1 : 0) - (b.paused ? 1 : 0)           // active first (by time), paused last
        || ((a.times || [])[0] || '').localeCompare((b.times || [])[0] || '') || a.name.localeCompare(b.name));
      h += `<div class="label">My meds</div><div class="gstack">${list.map(listCard).join('')}<button class="dashed" data-act="add">+ Add med</button></div>`;
    }
    el.innerHTML = h;
    if (ring && ring.from !== ring.frac) requestAnimationFrame(() => requestAnimationFrame(() => { const c = $('rfill'); if (c) c.style.strokeDashoffset = ring.C * (1 - ring.frac); }));
    loadThumbs();
  }

  function open() { clearThumbs(); show('meds'); render(); $('view-meds').scrollTop = 0; }

  $('medsBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.dose) {
      const id = t.dataset.dose;
      if (logMap().has(id)) {
        if (!confirm('Mark this dose as not taken?')) return;
        await RisenDB.undoDose(id); S.medlogs = S.medlogs.filter(l => l.id !== id);
      } else {
        const [medId, date, time] = id.split('|'); S.medlogs.push(await RisenDB.logDose(medId, date, time));
      }
      render(); renderHome(); return;
    }
    if (t.dataset.takeall) {
      const lm = logMap();
      for (const d of dosesOn(new Date()).filter(x => x.t === t.dataset.takeall && !lm.has(x.id))) {
        const [medId, date, time] = d.id.split('|'); S.medlogs.push(await RisenDB.logDose(medId, date, time));
      }
      render(); renderHome(); return;
    }
    if (t.dataset.edit) return openEditor(t.dataset.edit);
    if (t.dataset.act === 'add') return openEditor(null);
  });
  async function removeMed(id) {
    await RisenDB.deleteMed(id);
    S.meds = S.meds.filter(x => x.id !== id); S.medlogs = S.medlogs.filter(l => l.medId !== id); dropThumb(id);
  }

  // ================= Editor =================
  let med = null, persisted = false;   // persisted: has this med been written to the database yet?
  // tickAt[i] = the time under which today's tick of time row i is stored. When a time is edited, a dose already taken
  // today moves with it, so it never shows as "not taken" again (which would invite a double dose).
  let tickAt = [];
  async function moveTicks() {
    const today = dayKey(new Date());
    for (let i = 0; i < med.times.length; i++) {
      const cur = med.times[i], was = tickAt[i]; if (!cur || cur === was) continue;
      tickAt[i] = cur; if (!was) continue;
      const from = logId(med.id, today, was), to = logId(med.id, today, cur);
      if (!S.medlogs.some(l => l.id === from) || S.medlogs.some(l => l.id === to)) continue;
      const moved = await RisenDB.moveDose(from, cur);
      if (moved) S.medlogs = S.medlogs.filter(l => l.id !== from).concat(moved);
    }
  }
  const flashSaved = () => savedFlash('medSaved');
  const problem = () => !med.name.trim() ? 'Add a name to save this med.' : !med.times.some(Boolean) ? 'Add at least one time to save this med.'
    : (med.freq !== 'daily' && !med.days.length) ? 'Pick at least one day to save this med.' : '';
  function updateHint() { const p = problem(), h = $('mHint'); if (!h) return; h.textContent = p; h.hidden = !p; }
  function normalized() {
    const m = med;
    return { id: m.id, name: m.name.trim(), dose: m.dose.trim(), times: [...new Set(m.times.filter(Boolean))].sort(), freq: m.freq,
      days: m.freq === 'daily' ? [] : [...m.days].sort((a, b) => a - b), food: m.food, notes: m.notes.trim(), paused: !!m.paused, created: m.created };
  }
  const saveMed = debounce(async () => {
    if (!med || problem()) return;
    try {
      const rec = normalized(); await RisenDB.saveMed(rec); persisted = true; if (med) await moveTicks();
      S.meds = S.meds.some(x => x.id === rec.id) ? S.meds.map(x => x.id === rec.id ? rec : x) : [...S.meds, rec];
      flashSaved();
    } catch (err) { toast(err.message); }
  }, 400);
  const touch = () => { updateHint(); saveMed(); };
  const flush = () => saveMed.flush().catch(err => toast(err.message));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else if (dayKey(new Date()) !== lastDay) { if (!$('view-meds').hidden) render(); renderHome(); }   // the day changed while away
  });
  addEventListener('pagehide', flush);

  const openPage = () => Pages.open('medPage'), closePage = () => Pages.close('medPage');

  function openEditor(id) {
    const ex = id ? S.meds.find(m => m.id === id) : null;
    persisted = !!ex;
    med = ex ? JSON.parse(JSON.stringify(ex)) : { id: RisenDB.uid(), name: '', dose: '', times: ['08:00'], freq: 'daily', days: [], food: 'any', notes: '', paused: false, created: new Date().toISOString() };
    med.times = med.times || []; med.days = med.days || []; tickAt = ex ? [...med.times] : [];
    $('medTitle').textContent = ex ? 'Edit med' : 'New med';
    renderEditor(); openPage();
    if (!ex) setTimeout(() => $('mName').focus(), 320);
  }
  function renderEditor() {
    const m = med;
    $('medBody').innerHTML = `<p class="note hint" id="mHint" hidden></p>
      <div class="label" style="margin-top:4px">Name</div><input class="field" id="mName" type="text" maxlength="40" autocapitalize="words" autocomplete="off" enterkeyhint="next" placeholder="e.g. Vitamin D" value="${esc(m.name)}">
      <div class="label">Dose</div><input class="field" id="mDose" type="text" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="1 tablet, 40 mg, 1 injection" value="${esc(m.dose)}">
      <div class="label">When</div><div id="mTimes"></div>
      <div class="label">How often</div><div id="mFreq"></div>
      <div class="label">With food?</div><div class="chips" style="margin-top:0" id="mFood">${[['yes', 'Yes'], ['no', 'No'], ['any', 'Doesn’t matter']].map(([v, t]) =>
        `<button type="button" data-food="${v}" aria-pressed="${m.food === v}">${t}</button>`).join('')}</div>
      <div class="label">Notes (optional)</div><textarea class="field" id="mNotes" rows="2" maxlength="300" placeholder="e.g. keep in the fridge">${esc(m.notes)}</textarea>
      <div class="label">Photo of the box</div><div id="mPhoto"></div>
      <button class="ghost" id="mPause" type="button" style="width:100%;margin-top:26px"></button>
      <button class="quiet danger" data-act="del" type="button">Delete med</button>`;
    renderTimes(); renderFreq(); renderPauseBtn(); updateHint();
    PhotoSlot.mount($('mPhoto'), 'med-' + m.id, { editable: true });
  }
  function renderTimes() {
    $('mTimes').innerHTML = med.times.map((t, i) => `<div class="timerow"><input class="field" type="time" data-ti="${i}" value="${esc(t)}" aria-label="Time ${i + 1}">${
      med.times.length > 1 ? `<button class="timex" type="button" data-tdel="${i}" aria-label="Remove time">${I.x}</button>` : ''}</div>`).join('')
      + '<button class="dashed" type="button" data-act="addtime">+ Add time</button>';
  }
  function renderFreq() {
    $('mFreq').innerHTML = `<div class="chips" style="margin-top:0">${[['daily', 'Every day'], ['days', 'Chosen days'], ['weekly', 'Weekly']].map(([v, t]) =>
      `<button type="button" data-freq="${v}" aria-pressed="${med.freq === v}">${t}</button>`).join('')}</div>` + (med.freq === 'daily' ? '' :
      `<div class="days-pick" style="margin-top:14px">${DAYS.map((d, i) => `<button type="button" data-day="${i + 1}" aria-pressed="${med.days.includes(i + 1)}" aria-label="${d}">${d[0]}</button>`).join('')}</div>
       <p class="note" style="margin-top:8px">${med.freq === 'weekly' ? 'Pick the day of the week.' : 'Pick the days you take it.'}</p>`);
  }
  function renderPauseBtn() { $('mPause').textContent = med.paused ? 'RESUME (SHOW IN TODAY AGAIN)' : 'PAUSE (HIDE FROM TODAY)'; }

  $('medBody').addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'mName') med.name = t.value;
    else if (t.id === 'mDose') med.dose = t.value;
    else if (t.id === 'mNotes') med.notes = t.value;
    else if (t.dataset.ti != null) med.times[t.dataset.ti] = t.value;
    else return;
    touch();
  });
  $('medBody').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('input')) return;
    e.preventDefault(); if (e.target.id === 'mName') $('mDose').focus(); else e.target.blur();
  });
  $('medBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !med) return;
    if (t.dataset.freq) {
      const f = t.dataset.freq; if (f === med.freq) return;
      med.freq = f; if (f === 'daily') med.days = []; else if (f === 'weekly') med.days = [med.days[0] || isoDay(new Date())]; else if (!med.days.length) med.days = [isoDay(new Date())];
      renderFreq(); return touch();
    }
    if (t.dataset.day) {
      const d = +t.dataset.day;
      med.days = med.freq === 'weekly' ? [d] : (med.days.includes(d) ? med.days.filter(x => x !== d) : [...med.days, d]);
      renderFreq(); return touch();
    }
    if (t.dataset.food) { med.food = t.dataset.food; $('mFood').querySelectorAll('[data-food]').forEach(b => b.setAttribute('aria-pressed', b === t)); return touch(); }
    if (t.dataset.tdel != null) { med.times.splice(+t.dataset.tdel, 1); tickAt.splice(+t.dataset.tdel, 1); renderTimes(); return touch(); }
    if (t.dataset.act === 'addtime') {
      med.times.push(['20:00', '12:00', '14:00', '18:00', '22:00'].find(x => !med.times.includes(x)) || ''); tickAt.push(null); renderTimes(); touch();
      const ins = $('mTimes').querySelectorAll('input'); return ins[ins.length - 1].focus();
    }
    if (t.id === 'mPause') { med.paused = !med.paused; renderPauseBtn(); return touch(); }
    if (t.dataset.act === 'del') {
      if (!confirm(`Delete “${med.name.trim() || 'this med'}”? Its photo and history are deleted too.`)) return;
      const id = med.id, wasSaved = persisted; med = null;       // a waiting auto-save then does nothing
      if (wasSaved) await removeMed(id); else { await RisenDB.deletePhoto('med-' + id); dropThumb(id); }
      closePage(); render(); renderHome();
    }
  });

  async function closeEditor() {
    if (!med) return closePage();
    document.activeElement && document.activeElement.blur();
    await flush();
    const id = med.id, wasSaved = persisted, p = problem(), touched = med.name || med.dose || med.notes;
    if (!wasSaved) {             // a brand-new med that never got a name: nothing is kept, not even its photo
      const photo = await RisenDB.getPhoto('med-' + id); if (photo) await RisenDB.deletePhoto('med-' + id);
      if (p && (touched || photo)) toast('Not saved: ' + p.replace(' to save this med.', '.').toLowerCase());
    } else if (p) toast('Not saved: ' + p.replace(' to save this med.', '.').toLowerCase() + ' Last saved version kept.');
    med = null; dropThumb(id); closePage(); await load(); render(); renderHome();
  }
  $('medBack').onclick = closeEditor;
  $('medDone').onclick = closeEditor;

  return { open, render, summary, flush };
})();
