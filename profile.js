// RISEN Profile: the round profile button on every tab page, and the PERSONAL INFO half of the profile page
// (name, profile photo, height, weight, body measurements). The SETTINGS half lives in app.js and index.html, as before.
// Data: store `body` (db.js): one row per dated value  {id, kind, label?, value, date, at}.
//   A new value is saved with today's date. Changing a value that was already saved TODAY corrects that entry (no extra history);
//   a value from an earlier day stays as it was and a new entry is added. The profile photo is in `photos` under the key 'profile'.
// The page itself is #settings (kept under that id: swipe back, update waiting and the sheets all know it).
const Profile = (() => {
  const MEASURES = [['neck', 'Neck'], ['chest', 'Chest'], ['waist', 'Waist'], ['hips', 'Hips'], ['armL', 'Arm · left'], ['armR', 'Arm · right'],
    ['foreL', 'Forearm · left'], ['foreR', 'Forearm · right'], ['thighL', 'Thigh · left'], ['thighR', 'Thigh · right'], ['calfL', 'Calf · left'], ['calfR', 'Calf · right']];
  const BODY = [['height', 'Height', 'cm'], ['weight', 'Weight', 'kg']];
  const PERSON = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20v-.6a7.2 7.2 0 0 1 14.4 0v.6"/></svg>';
  const today = () => dayKey(new Date());
  const unitOf = k => k === 'weight' ? 'kg' : 'cm';
  const fmtVal = v => String(Math.round(v * 10) / 10);
  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ---------- entries ----------
  const entries = kind => S.body.filter(r => r.kind === kind).sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at));   // newest first
  const labelOf = kind => { const s = MEASURES.concat(BODY).find(m => m[0] === kind); if (s) return s[1]; const r = S.body.find(x => x.kind === kind); return r ? (r.label || 'Measurement') : 'Measurement'; };
  const customKinds = () => { const seen = new Map(); for (const r of S.body) if (r.kind.startsWith('c-') && (!seen.has(r.kind) || r.at < seen.get(r.kind))) seen.set(r.kind, r.at);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(e => e[0]); };
  const parse = txt => { const v = Number(String(txt).replace(',', '.').trim()); return txt.trim() !== '' && isFinite(v) && v > 0 && v <= 1000 ? Math.round(v * 10) / 10 : null; };

  // Save what was typed for one value. Returns true when something was written.
  async function setValue(kind, txt, label) {
    const list = entries(kind), last = list[0], v = parse(txt);
    if (txt.trim() === '') {                                        // cleared: only today's own entry can be taken back
      if (last && last.date === today()) { await RisenDB.deleteBody(last.id); S.body = S.body.filter(r => r.id !== last.id); return true; }
      return false;
    }
    if (v == null) return false;                                    // not a usable number: nothing is saved
    if (last && last.date === today()) {
      if (last.value === v) return false;
      const row = { ...last, value: v, at: new Date().toISOString() }; await RisenDB.saveBody(row); S.body = S.body.map(r => r.id === row.id ? row : r); return true;
    }
    if (last && last.value === v) return false;                     // same as the latest value: no new entry
    const row = { id: RisenDB.uid(), kind, value: v, date: today(), at: new Date().toISOString() };
    if (kind.startsWith('c-')) row.label = label || labelOf(kind);
    await RisenDB.saveBody(row); S.body.push(row); return true;
  }

  // ---------- the round button (on every tab page) ----------
  let avUrl = null;
  async function avatars() {
    let url = null;
    try { const p = await RisenDB.getPhoto('profile'); if (p && p.blob) { const u = URL.createObjectURL(p.blob); if (avUrl) URL.revokeObjectURL(avUrl); avUrl = u; url = u; } } catch (e) {}
    if (!url && avUrl) { URL.revokeObjectURL(avUrl); avUrl = null; }
    const name = (S.settings.name || '').trim(), letter = name ? [...name][0].toUpperCase() : '';
    for (const b of document.querySelectorAll('.profbtn')) {
      b.innerHTML = url ? `<img alt="" src="${url}">` : letter ? `<span class="pfl">${esc(letter)}</span>` : PERSON;
      b.classList.toggle('photo', !!url);
    }
  }

  // ---------- PERSONAL INFO ----------
  const rowHtml = (kind, label, unit) => {
    const [cur, prev] = entries(kind);
    return `<div class="row meas" data-kind="${esc(kind)}"><button type="button" class="mlabel" data-hist="${esc(kind)}" aria-label="${esc(label)} history">${esc(label)}${ICONS.chev}</button>
      <span class="mprev">${prev ? 'prev ' + fmtVal(prev.value) : ''}</span>
      <input type="text" inputmode="decimal" autocomplete="off" data-meas="${esc(kind)}" aria-label="${esc(label)} (${unit})" placeholder="–" value="${cur ? fmtVal(cur.value) : ''}"><span class="unit">${unit}</span></div>`;
  };
  function render() {
    const custom = customKinds();
    $('infoBody').innerHTML = `
      <div class="group-label">You</div>
      <div class="group"><label class="row">Name <input id="setName" type="text" maxlength="20" placeholder="Your name" autocapitalize="words" enterkeyhint="done" value="${esc(S.settings.name || '')}"></label></div>
      <div class="group-label">Profile photo</div>
      <div id="profPhoto"></div>
      <div class="group-label">Body</div>
      <div class="group">${BODY.map(([k, l, u]) => rowHtml(k, l, u)).join('')}</div>
      <div class="group-label">Measurements</div>
      <button class="primary nogl" type="button" id="addMeas" style="margin:0 0 14px">+ ADD MEASUREMENT</button>
      <div class="group">${MEASURES.map(([k, l]) => rowHtml(k, l, 'cm')).join('')}${custom.map(k => rowHtml(k, labelOf(k), 'cm')).join('')}</div>
      <p class="note">Each new value is saved with today's date. Tap a name to see its history.</p>`;
    PhotoSlot.mount($('profPhoto'), 'profile', { editable: true, onChange: avatars });
  }
  function showPane(which) {
    const info = which === 'info';
    $('setPane').hidden = info; $('infoPane').hidden = !info;
    document.querySelectorAll('#settings [data-seg]').forEach(b => b.setAttribute('aria-selected', String((b.dataset.seg === 'info') === info)));
    const p = $('settings'); p.scrollTop = 0;
    if (info) render();
  }

  // The latest value changes: the "prev" next to it follows, without redrawing the row (the keyboard stays up).
  function refreshPrev(kind) {
    const row = document.querySelector(`#infoBody .meas[data-kind="${CSS.escape(kind)}"]`); if (!row) return;
    const prev = entries(kind)[1]; row.querySelector('.mprev').textContent = prev ? 'prev ' + fmtVal(prev.value) : '';
  }
  const pending = new Map();
  function schedule(input) {
    const kind = input.dataset.meas; clearTimeout(pending.get(kind));
    pending.set(kind, setTimeout(() => commit(input), 450));
  }
  async function commit(input) {
    const kind = input.dataset.meas; clearTimeout(pending.get(kind)); pending.delete(kind);
    const label = kind.startsWith('c-') ? labelOf(kind) : null;
    try { if (await setValue(kind, input.value, label)) { refreshPrev(kind); savedFlash('setSaved'); } } catch (e) { toast('Could not save: ' + e.message); }
  }
  function flush() {                                                // before the page closes: nothing typed is lost
    const ps = []; for (const [kind] of [...pending]) { const i = document.querySelector(`#infoBody [data-meas="${CSS.escape(kind)}"]`); if (i) ps.push(commit(i)); else pending.delete(kind); }
    return Promise.all(ps);
  }

  // ---------- history sheet ----------
  let histKind = null;
  function openHistory(kind) {
    histKind = kind; const list = entries(kind), unit = unitOf(kind);
    $('histTitle').textContent = labelOf(kind);
    $('histList').innerHTML = list.length ? list.map(r => `<div class="hrow"><span>${esc(fmtDate(r.date))}</span><b>${fmtVal(r.value)} <small>${unit}</small></b>
      <button type="button" class="hdel" data-del="${esc(r.id)}" aria-label="Delete this entry">${ICONS.trash}</button></div>`).join('') : '<p class="note" style="margin:0">Nothing saved yet.</p>';
    $('histDelAll').hidden = !kind.startsWith('c-');
    $('histSheet').hidden = false;
  }
  $('histDone').onclick = () => { $('histSheet').hidden = true; histKind = null; };
  $('histList').onclick = async e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (!(await ask({ title: 'Delete this entry?', ok: 'DELETE', danger: true }))) return;
    await RisenDB.deleteBody(b.dataset.del); S.body = S.body.filter(r => r.id !== b.dataset.del);
    const k = histKind; openHistory(k); render(); savedFlash('setSaved');
  };
  $('histDelAll').onclick = async () => {
    const k = histKind; if (!k) return;
    if (!(await ask({ title: 'Delete "' + labelOf(k) + '"?', text: 'Its whole history is deleted too.', ok: 'DELETE', danger: true }))) return;
    await RisenDB.deleteBody(S.body.filter(r => r.kind === k).map(r => r.id)); S.body = S.body.filter(r => r.kind !== k);
    $('histSheet').hidden = true; histKind = null; render(); savedFlash('setSaved');
  };

  // ---------- add a measurement ----------
  // (the + ADD MEASUREMENT button is drawn by render(); it is handled by delegation below)
  function openAdd() { $('addName').value = ''; $('addVal').value = ''; $('addMeasSheet').hidden = false; setTimeout(() => $('addName').focus(), 300); }
  $('addMeasForm').onsubmit = async e => {
    e.preventDefault();
    const name = $('addName').value.trim().slice(0, 24), v = parse($('addVal').value);
    if (!name) { $('addName').focus(); return; }
    if (v == null) { $('addVal').focus(); return; }
    const taken = MEASURES.concat(BODY).map(m => m[1]).concat(customKinds().map(labelOf)).some(l => l.toLowerCase() === name.toLowerCase());
    if (taken) { toast('That one is already in the list'); return; }
    const kind = 'c-' + RisenDB.uid();
    await RisenDB.saveBody({ id: RisenDB.uid(), kind, label: name, value: v, date: today(), at: new Date().toISOString() }).then(row => S.body.push(row));
    document.activeElement && document.activeElement.blur(); $('addMeasSheet').hidden = true; render(); savedFlash('setSaved');
  };
  $('addCancel').onclick = () => { document.activeElement && document.activeElement.blur(); $('addMeasSheet').hidden = true; };

  // ---------- events on the page ----------
  $('infoBody').addEventListener('input', e => {
    if (e.target.matches('[data-meas]')) return schedule(e.target);
    if (e.target.id === 'setName') {
      S.settings.name = e.target.value.trim();
      RisenDB.setSetting('name', S.settings.name).then(() => { savedFlash('setSaved'); avatars(); });
    }
  });
  $('infoBody').addEventListener('focusout', e => { if (e.target.matches('[data-meas]')) commit(e.target); });
  $('infoBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) e.target.blur(); });
  $('infoBody').addEventListener('click', e => {
    const h = e.target.closest('[data-hist]'); if (h) return openHistory(h.dataset.hist);
    if (e.target.closest('#addMeas')) return openAdd();
  });
  document.querySelectorAll('#settings [data-seg]').forEach(b => b.onclick = () => showPane(b.dataset.seg));
  // the round button: every tab page has one
  document.addEventListener('click', e => { if (e.target.closest('.profbtn')) openSettings(); });

  // Like every other editor: what is typed is saved when the app goes to the background or closes, not only on "<"
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  return { avatars, showPane, flush, render };
})();
