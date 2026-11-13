// RISEN Meals tab. MEALS (5 category cards) -> CATEGORY (its recipes) -> RECIPE (photo, name, ingredients, method).
// Uses the shared helpers from index.html (S, load, show, toast, esc) and PhotoSlot (photo.js) for the recipe photo.
const Meals = (() => {
  const icon = p => `<svg class="icon" viewBox="0 0 24 24">${p}</svg>`;
  const CATS = [
    { id: 'shakes', label: 'Shakes', one: 'shake', icon: icon('<path d="M7 8h10l-1.2 11a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8L7 8z"/><path d="M6 8h12"/><path d="m13 8 2-5h3"/>') },
    { id: 'breakfast', label: 'Breakfast', one: 'breakfast', icon: icon('<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3v3M12 3v3"/>') },
    { id: 'lunch', label: 'Lunch', one: 'lunch', icon: icon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>') },
    { id: 'snacks', label: 'Snacks', one: 'snack', icon: icon('<path d="M12 7C11 5.6 9 5.2 7.5 6 5.3 7.2 4.6 9.7 5.4 12c.8 2.5 2.3 4.7 4.1 5.5 1 .4 1.6.1 2.5-.2.9.3 1.5.6 2.5.2 1.8-.8 3.3-3 4.1-5.5.8-2.3.1-4.8-2.1-6-1.5-.8-3.5-.4-4.5 1z"/><path d="M12 7c0-2 .8-3.3 2.2-4"/>') },
    { id: 'dinner', label: 'Dinner', one: 'dinner', icon: icon('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>') },
  ];
  const cat = id => CATS.find(c => c.id === id) || CATS[0];
  let curCat = null;

  // ================= Data selectors =================
  const inCat = id => S.recipes.filter(r => r.category === id);
  const lines = r => (r.ingredients || []).map(i => i.text).join('\n');
  // Ingredients are objects ({text}, later also grams / calories). Keep the object of any line that stays the same.
  function ingredientsFrom(text, old) {
    const used = new Set();
    return String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(line => {
      const k = (old || []).findIndex((o, n) => !used.has(n) && o.text === line);
      if (k >= 0) { used.add(k); return old[k]; }
      return { text: line };
    });
  }

  // ================= Photos =================
  // Which recipes have a photo is known from the photo keys; the pictures themselves are only read when a screen needs them.
  const hasPhoto = new Set(), urls = new Map();
  async function refreshKeys() {
    hasPhoto.clear();
    try { (await RisenDB.photoKeys()).forEach(k => { k = String(k); if (k.startsWith('recipe-')) hasPhoto.add(k.slice(7)); }); } catch (e) { /* no photos then */ }
  }
  async function loadUrls(ids) {                  // true when something new was loaded (the screen then redraws once)
    let added = false;
    for (const id of ids) {
      if (urls.has(id) || !hasPhoto.has(id)) continue;
      const p = await RisenDB.getPhoto('recipe-' + id); if (p) { urls.set(id, URL.createObjectURL(p.blob)); added = true; }
    }
    return added;
  }
  const dropUrl = id => { if (urls.get(id)) URL.revokeObjectURL(urls.get(id)); urls.delete(id); };
  const clearUrls = () => { for (const id of [...urls.keys()]) dropUrl(id); };
  function latestWithPhoto(catId) {               // the newest recipe of the category that has a photo
    return inCat(catId).filter(r => hasPhoto.has(r.id)).sort((a, b) => (b.created || '').localeCompare(a.created || ''))[0] || null;
  }

  // ================= Pages and the move sheet =================
  const openPage = Pages.open, closePage = Pages.close, onClose = Pages.onClose;
  document.querySelectorAll('[data-meal-close]').forEach(b => b.onclick = () => { document.activeElement.blur(); closePage(b.dataset.mealClose); });
  const closeAll = () => ['recipePage', 'mealPage'].forEach(id => $(id).classList.contains('open') && closePage(id));
  const closeSheet = () => { document.activeElement.blur(); $('mealSheet').hidden = true; $('mealSheetBody').innerHTML = ''; };
  $('mealSheet').addEventListener('click', e => { if (e.target === $('mealSheet')) closeSheet(); });
  const flashSaved = () => savedFlash('recipeSaved');

  // ================= LEVEL 1: MEALS =================
  function renderCats() {
    $('mealCats').innerHTML = `<div class="gh"><h2>Meals</h2></div><div class="gstack">${CATS.map(c => {
      const n = inCat(c.id).length, lp = latestWithPhoto(c.id), u = lp && urls.get(lp.id);
      return `<button class="mcat${u ? ' ph' : ''}" data-cat="${c.id}"${u ? ` style="background-image:url('${esc(u)}')"` : ''}>
        <div><div class="mt">${c.label}</div><div class="mn">${n ? `${n} recipe${n === 1 ? '' : 's'}` : 'No recipes yet'}</div></div>${u ? '' : `<span class="micon">${c.icon}</span>`}</button>`;
    }).join('')}</div>`;
  }
  $('mealCats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) openCat(b.dataset.cat); });
  function open() {
    closeAll(); clearUrls(); show('meals'); renderCats(); $('view-meals').scrollTop = 0;
    refreshKeys().then(() => loadUrls(CATS.map(c => (latestWithPhoto(c.id) || {}).id).filter(Boolean))).then(() => { if (!$('view-meals').hidden && !curCat) renderCats(); });
  }

  // ================= LEVEL 2: A CATEGORY =================
  function openCat(id) {
    curCat = id; $('mealPageTitle').textContent = cat(id).label; renderCat(); openPage('mealPage');
    onClose.mealPage = () => { curCat = null; renderCats(); };
    loadUrls(inCat(id).map(r => r.id)).then(added => { if (added && curCat === id) renderCat(); });
  }
  function renderCat() {
    const c = cat(curCat), list = inCat(curCat).sort((a, b) => a.name.localeCompare(b.name));
    $('mealPageBody').innerHTML = `<button class="primary" data-act="add" style="margin-top:6px">+ ADD RECIPE</button>` + (list.length
      ? `<div class="gstack" style="margin-top:18px">${list.map(r => `<button class="rcard" data-open="${esc(r.id)}"><div class="rimg">${urls.get(r.id) ? `<img alt="" src="${esc(urls.get(r.id))}">` : c.icon}</div>
          <div class="rname">${esc(r.name)}</div></button>`).join('')}</div>`
      : `<div class="card empty" style="margin-top:18px"><div class="wname">No ${c.one} recipes yet</div><div class="sub">Add your first one with the button above.</div></div>`);
  }
  $('mealPageBody').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.open) return openRecipe(t.dataset.open);
    if (t.dataset.act === 'add') return openRecipe(null);
  });

  // ================= LEVEL 3: A RECIPE =================
  let rec = null, persisted = false;               // persisted: written to the database yet? (a new recipe needs a name first)
  const saveRec = debounce(async () => {
    if (!rec || !rec.name.trim()) return;
    try {
      const out = { id: rec.id, category: rec.category, name: rec.name.trim(), ingredients: ingredientsFrom(rec.ingText, rec.ingredients),
        method: rec.method.replace(/\s+$/, ''), created: rec.created, updated: new Date().toISOString() };
      await RisenDB.saveRecipe(out); persisted = true; rec.ingredients = out.ingredients;
      S.recipes = S.recipes.some(x => x.id === out.id) ? S.recipes.map(x => x.id === out.id ? out : x) : [...S.recipes, out];
      flashSaved();
    } catch (err) { toast(err.message); }
  }, 400);
  const grow = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; };

  function openRecipe(id) {
    const ex = id ? S.recipes.find(r => r.id === id) : null; persisted = !!ex;
    rec = ex ? JSON.parse(JSON.stringify(ex)) : { id: RisenDB.uid(), category: curCat, name: '', ingredients: [], method: '', created: new Date().toISOString() };
    rec.method = rec.method || ''; rec.ingText = lines(rec);
    $('recipeTitle').textContent = ex ? 'Recipe' : 'New recipe';
    $('recipeBody').innerHTML = `<div id="rPhoto"></div>
      <div class="label">Name</div><input class="field" id="rName" type="text" maxlength="60" autocapitalize="sentences" autocomplete="off" enterkeyhint="done" placeholder="e.g. Protein pancakes" value="${esc(rec.name)}">
      <div class="label">Ingredients</div><textarea class="field grow" id="rIng" rows="5" placeholder="One ingredient per line">${esc(rec.ingText)}</textarea>
      <div class="label">How to make it (optional)</div><textarea class="field grow" id="rMethod" rows="4" placeholder="Steps, tips…">${esc(rec.method)}</textarea>
      <button class="ghost" id="rMove" type="button" style="width:100%;margin-top:22px">MOVE TO…</button>
      <button class="quiet danger" id="rDelete" type="button">Delete recipe</button>`;
    PhotoSlot.mount($('rPhoto'), 'recipe-' + rec.id, { editable: true });
    openPage('recipePage'); $('recipeBody').querySelectorAll('textarea.grow').forEach(grow);
    onClose.recipePage = () => finishRecipe();
    if (!ex) setTimeout(() => $('rName').focus(), 320);
  }
  $('recipeBody').addEventListener('input', e => {
    const t = e.target; if (!rec) return;
    if (t.id === 'rName') rec.name = t.value;
    else if (t.id === 'rIng') { rec.ingText = t.value; grow(t); }
    else if (t.id === 'rMethod') { rec.method = t.value; grow(t); }
    else return;
    saveRec();
  });
  $('recipeBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'rName') { e.preventDefault(); e.target.blur(); } });
  $('recipeBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !rec) return;
    if (t.id === 'rMove') {
      await saveRec.flush();
      if (!persisted) return toast('Add a name first');
      $('mealSheetBody').innerHTML = `<h2>Move to…</h2><p>Pick the category for “${esc(rec.name.trim())}”.</p>
        <div class="list">${CATS.filter(c => c.id !== rec.category).map(c => `<button data-moveto="${c.id}">${c.label}</button>`).join('')}</div>
        <button class="textbtn" data-cancel="1">Cancel</button>`;
      $('mealSheet').hidden = false; return;
    }
    if (t.id === 'rDelete') {
      if (!confirm(`Delete “${rec.name.trim() || 'this recipe'}”? Its photo is deleted too.`)) return;
      const id = rec.id, was = persisted; rec = null; onClose.recipePage = null;          // a waiting auto-save then does nothing
      if (was) { await RisenDB.deleteRecipe(id); S.recipes = S.recipes.filter(r => r.id !== id); } else await RisenDB.deletePhoto('recipe-' + id);
      hasPhoto.delete(id); dropUrl(id); closePage('recipePage'); if (curCat) renderCat(); renderCats();
    }
  });
  $('mealSheetBody').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.cancel) return closeSheet();
    if (t.dataset.moveto && rec) {
      const to = t.dataset.moveto; rec.category = to; saveRec(); await saveRec.flush(); closeSheet();
      toast('Moved to ' + cat(to).label); closePage('recipePage');
    }
  });
  async function finishRecipe() {                  // back arrow / DONE
    if (!rec) return;
    await saveRec.flush();
    const id = rec.id, was = persisted, touched = rec.name || rec.ingText || rec.method;
    if (!was) {                                     // a brand-new recipe that never got a name: nothing is kept, not even its photo
      if (hasPhoto.has(id) || await RisenDB.getPhoto('recipe-' + id)) await RisenDB.deletePhoto('recipe-' + id);
      if (touched) toast('Not saved: add a name.');
    } else if (!rec.name.trim()) toast('Not saved: add a name. Last saved version kept.');
    rec = null; dropUrl(id); await refreshKeys();
    if (curCat) { renderCat(); loadUrls(inCat(curCat).map(r => r.id)).then(a => { if (a && curCat) renderCat(); }); }
    renderCats();
  }

  const flush = () => saveRec.flush().catch(err => toast(err.message));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  addEventListener('pagehide', flush);
  function reset() { closeAll(); closeSheet(); curCat = null; rec = null; clearUrls(); hasPhoto.clear(); }

  return { open, flush, reset };
})();
