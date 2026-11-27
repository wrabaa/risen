// RISEN BAKING (`.138`, Siza's me.html only): his Magnolia baking book. Three screens: MENU (search, ★ favourites, 14 categories) → CATEGORY (recipe grid) → RECIPE
// (AI picture + one photo of his own, ★, batch ½× 1× 2×, tick the ingredients, linked sub-recipes, steps).
//
// WHERE THINGS LIVE
//   - The recipe TEXT: his own file magnolia-recipes.json (made from his books; NEVER put it on GitHub, the repo is public). Loaded once with LOAD RECIPE FILE,
//     kept in this phone's database `risen-baking` (store `kv`, key `book`). Replace it any time from the line at the bottom of the menu.
//   - The AI pictures: repo folder assets/baking/<category id>/<recipe id>.jpg (also .png / .webp); the 14 category cards of the menu: assets/baking/main/<category id>.jpg
//     (no card picture yet: the category's first recipe picture is shown).
//     They come to the phone by themselves (repofolder.js, cache `risen.baking`), no release needed, and stay for offline use.
//   - His own photo (one per recipe) and the ★ list: the same database (`photos`, keyed by recipe id; `kv` key `favs`). Only on this phone, not in RISEN's backup.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const main = $('bk');

  // ---------- database ----------
  const DB = (() => {
    let p = null;
    const open = () => p || (p = new Promise((res, rej) => {
      const r = indexedDB.open('risen-baking', 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos'); };
      r.onsuccess = () => res(r.result); r.onerror = () => { p = null; rej(r.error); };
    }));
    const tx = (st, mode, fn) => open().then(d => new Promise((res, rej) => {
      const t = d.transaction(st, mode), q = fn(t.objectStore(st));
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
    return { get: (st, k) => tx(st, 'readonly', s => s.get(k)), put: (st, k, v) => tx(st, 'readwrite', s => s.put(v, k)),
             del: (st, k) => tx(st, 'readwrite', s => s.delete(k)), keys: st => tx(st, 'readonly', s => s.getAllKeys()) };
  })();

  // ---------- the AI pictures from the repo ----------
  const PIC_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const Pics = RepoFolder({ dir: 'assets/baking', cache: 'risen.baking', deep: true, pick(rows) {
    const want = {};
    for (const r of rows) {
      const m = /^([a-z0-9-]+)\/([a-z0-9_-]+)\.(jpg|jpeg|png|webp)$/i.exec(r.path || '');
      if (!m || r.size > 3 * 1024 * 1024) continue;
      const k = (m[1] + '/' + m[2]).toLowerCase(); if (want[k]) continue;
      want[k] = { name: r.name, path: r.path, sha: r.sha, type: PIC_TYPES[m[3].toLowerCase()] };
    }
    return want;
  } });
  let picTimer = 0;
  Pics.onChange = () => { clearTimeout(picTimer); picTimer = setTimeout(fillPics, 300); };
  const syncPics = force => { if (!document.hidden) Pics.sync([], force).catch(() => {}); };

  // ---------- state ----------
  let book = null, byId = {}, favs = new Set(), own = new Set(), q = '';
  const heroPick = {}, batch = {}, ticks = {};               // per recipe, for this opening only
  const ownUrls = new Map();
  const ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14l-1.5 9h-11z"/><path d="M7 11a5 5 0 0 1 10 0"/><path d="M12 3v3"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
  const BIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const toast = t => { const el = $('bkToast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2200); };

  function setBook(doc) {
    book = doc; byId = {};
    for (const r of doc.recipes) byId[r.id] = r;
  }
  const catOf = id => book.categories.find(c => c.id === id);
  const inCat = id => book.recipes.filter(r => r.category === id);
  const factLine = r => [r.yield && r.yield.replace(/^makes /i, 'Makes ').replace(/\s*\(.*$/, ''), r.oven].filter(Boolean).join(' · ');

  // ---------- navigation (#/ · #/c/<category> · #/fav · #/r/<recipe>) ----------
  let depth = 0;
  const go = h => { depth++; location.hash = h; };
  function back(parent) {
    if (depth > 0) { depth--; history.back(); }
    else location.replace(parent);
  }
  function leave() {                                          // back to his RISEN Home, straight onto Home (no intro again)
    try { sessionStorage.setItem('risen.skipIntro', '1'); } catch (e) {}
    location.href = 'me.html';
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

  // ---------- screens ----------
  function render() {
    if (!book) return renderLoad();
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'r' && byId[h[1]]) return renderRecipe(byId[h[1]]);
    if (h[0] === 'c' && catOf(h[1])) return renderCat(catOf(h[1]));
    if (h[0] === 'fav') return renderFav();
    renderMenu();
  }
  const bar = (title, act, label) => `<header class="bkbar"><button type="button" class="iconbtn" data-act="${act}" aria-label="${label}">${BACK}</button><h1>${esc(title)}</h1></header>`;
  const card = r => `<button type="button" class="rc" data-go="#/r/${r.id}"><div class="ph" data-pic="${r.category}/${r.id}" data-own="${r.id}">${ICON}${favs.has(r.id) ? '<span class="star" aria-label="Favourite">★</span>' : ''}</div><div class="t"><b>${esc(r.name)}</b><small>${esc(factLine(r))}</small></div></button>`;

  function renderLoad() {
    main.innerHTML = `${bar('Baking', 'home', 'Back to Home')}<div class="load">${ICON.replace('class="ico"', 'class="ico" style="width:64px;height:64px;color:#4A4A4A"')}
      <h2>Your baking book</h2><p>Load your recipe file once (magnolia-recipes.json, from Files). It stays on this phone and works offline.</p>
      <button type="button" class="primary" data-act="load">LOAD RECIPE FILE</button></div>`;
  }

  function renderMenu() {
    const n = book.recipes.length, fv = [...favs].filter(id => byId[id]).length;
    const cats = book.categories.map(c => { const k = inCat(c.id).length;
      return `<button type="button" class="cat" data-go="#/c/${c.id}"><div class="ph" data-pic="main/${c.id}" data-first="${c.id}">${ICON}</div><div class="fade"></div><div class="t"><b>${esc(c.name)}</b><small>${k} recipe${k === 1 ? '' : 's'}</small></div></button>`; }).join('');
    const favCard = fv ? `<button type="button" class="cat fav" data-go="#/fav"><div class="ph" style="color:var(--volt)"><svg class="ico" viewBox="0 0 24 24" style="fill:var(--volt);stroke:var(--volt)" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg></div><div class="t"><b>My favourites</b><small>${fv} recipe${fv === 1 ? '' : 's'}</small></div></button>` : '';
    main.innerHTML = `${bar('Baking', 'home', 'Back to Home')}
      <div class="subline">${book.categories.length} categories · ${n} recipes</div>
      <label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="bkQ" placeholder="Search a recipe or ingredient" aria-label="Search" autocomplete="off" value="${esc(q)}"></label>
      <div id="bkRes"></div><div class="grid" id="bkCats">${favCard}${cats}</div>
      <div class="foot">${n} recipes on this phone<br><button type="button" data-act="load">Replace recipe file</button></div>`;
    $('bkQ').oninput = e => { q = e.target.value; showResults(); };
    showResults(); fillPics();
  }
  function showResults() {
    const res = $('bkRes'), cats = $('bkCats'); if (!res) return;
    const s = q.trim().toLowerCase();
    if (s.length < 2) { res.innerHTML = ''; cats.hidden = false; return; }
    const hit = book.recipes.filter(r => r.name.toLowerCase().includes(s) || r.ingredients.some(g => g.items.some(i => i.text.toLowerCase().includes(s))));
    hit.sort((a, b) => (b.name.toLowerCase().includes(s)) - (a.name.toLowerCase().includes(s)));
    cats.hidden = true;
    res.innerHTML = hit.length ? `<div class="subline">${hit.length} found</div><div class="grid">${hit.slice(0, 60).map(card).join('')}</div>` : `<div class="empty">Nothing found for “${esc(q)}”</div>`;
    fillPics();
  }
  function renderCat(c) {
    const list = inCat(c.id);
    main.innerHTML = `${bar(c.name, 'up', 'Back to Baking')}<div class="subline">${list.length} recipe${list.length === 1 ? '' : 's'}</div><div class="grid">${list.map(card).join('')}</div>`;
    fillPics();
  }
  function renderFav() {
    const list = [...favs].map(id => byId[id]).filter(Boolean);
    main.innerHTML = `${bar('My favourites', 'up', 'Back to Baking')}<div class="subline">${list.length} recipe${list.length === 1 ? '' : 's'}</div>${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">Tap ★ on a recipe to keep it here</div>'}`;
    fillPics();
  }

  // ---- batch: ½× 1× 2× changes every amount (cups, spoons, grams, sticks) ----
  const FR = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
  const NICE = [[0, ''], [.125, '⅛'], [.25, '¼'], [1 / 3, '⅓'], [.375, '⅜'], [.5, '½'], [.625, '⅝'], [2 / 3, '⅔'], [.75, '¾'], [.875, '⅞'], [1, '']];
  const val = s => { const m = /^(\d+(?:\.\d+)?)?([½¼¾⅓⅔⅛⅜⅝⅞])?$/.exec(s); if (!m || !(m[1] || m[2])) return null; return (m[1] ? Number(m[1]) : 0) + (m[2] ? FR[m[2]] : 0); };
  function fmt(x) {
    if (x >= 10) return String(Math.round(x));
    const w = Math.floor(x + 1e-9), f = x - w; let best = NICE[0];
    for (const n of NICE) if (Math.abs(n[0] - f) < Math.abs(best[0] - f)) best = n;
    if (Math.abs(best[0] - f) > .04) return String(Math.round(x * 10) / 10);
    const whole = w + (best[0] === 1 ? 1 : 0);
    return (whole ? String(whole) : '') + best[1] || '0';
  }
  const AMT = '(\\d+(?:\\.\\d+)?[½¼¾⅓⅔⅛⅜⅝⅞]?|[½¼¾⅓⅔⅛⅜⅝⅞])';
  function scale(t, k) {
    if (k === 1) return t;
    const one = s => { const v = val(s); return v == null ? s : fmt(v * k); };
    t = t.replace(new RegExp('^' + AMT + '(\\s*(?:–|-|to)\\s*' + AMT + ')?(?=\\s)'), (all, a, rng, b) => one(a) + (rng ? rng.replace(b, one(b)) : ''));
    t = t.replace(/(\d+(?:\.\d+)?)g(?=[)/])/g, (all, g) => { const v = Number(g) * k; return (v < 20 ? Math.round(v) : 5 * Math.round(v / 5)) + 'g'; });
    t = t.replace(new RegExp('([(/,]\\s*)' + AMT + '(\\s+sticks?)', 'g'), (all, pre, a, st) => pre + one(a) + st);
    return t;
  }
  const BATCHES = [[.5, '½×'], [1, '1×'], [2, '2×']];

  function renderRecipe(r) {
    const k = batch[r.id] || 1, tk = ticks[r.id] || (ticks[r.id] = new Set()), mine = own.has(r.id);
    const showMine = mine && (heroPick[r.id] === 'mine' || (!heroPick[r.id] && !hasAi(r)));
    let n = 0;
    const ings = r.ingredients.map((g, gi) => `${g.part ? `<div class="part">${esc(g.part)}</div>` : ''}${g.items.map((it, ii) => {
      const key = gi + '.' + ii, done = tk.has(key), ref = it.ref && byId[it.ref];
      return `<div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line)"><button type="button" class="ing${done ? ' done' : ''}" style="border:0;flex:1;width:auto" data-tick="${key}" aria-pressed="${done}"><span class="box" aria-hidden="true">✓</span><span class="tx">${esc(scale(it.text, k))}</span></button>${ref ? `<button type="button" class="iconbtn" style="width:auto;padding:0 4px;color:var(--volt);font-size:13px;white-space:nowrap" data-go="#/r/${ref.id}">Open ›</button>` : ''}</div>`;
    }).join('')}`).join('');
    const steps = r.steps.map(s => { const tipish = /^(note|tip|variation)\b/i.test(s); if (!tipish) n++;
      return `<div class="step"><div class="n">${tipish ? '•' : n}</div><div class="s">${esc(s)}</div></div>`; }).join('');
    const chips = [r.yield && r.yield.replace(/^makes /i, 'Makes '), r.oven && 'Oven ' + r.oven].filter(Boolean).map(x => `<div class="chip">${esc(x)}</div>`).join('');
    main.innerHTML = `<div class="rp">
      <div class="hero" data-pic="${showMine ? '' : r.category + '/' + r.id}" data-own="${showMine ? r.id : ''}">${ICON}<div class="fade"></div>
        <button type="button" class="back" data-act="up" aria-label="Back">${BACK}</button>
        ${showMine ? `<button type="button" class="del" data-act="delphoto" aria-label="Delete my photo">${BIN}</button>` : ''}
        <button type="button" class="bkstar${favs.has(r.id) ? ' on' : ''}" data-act="fav" aria-label="${favs.has(r.id) ? 'Remove from favourites' : 'Add to favourites'}" aria-pressed="${favs.has(r.id)}">${STAR}</button>
      </div>
      <div class="rbody">
        <div class="thumbs">
          <button type="button" class="th${showMine ? '' : ' on'}" data-hero="ai" aria-label="Show the AI picture"><span data-pic="${r.category}/${r.id}" style="position:absolute;inset:0"></span><span class="tag">AI</span></button>
          ${mine ? `<button type="button" class="th${showMine ? ' on' : ''}" data-hero="mine" aria-label="Show my photo"><span data-own="${r.id}" style="position:absolute;inset:0"></span><span class="tag">MINE</span></button>`
                 : `<button type="button" class="th add" data-act="addphoto" aria-label="Add my own photo">${PLUS}</button><span class="hint">Add your<br>own photo</span>`}
        </div>
        <div class="rt">${esc(r.name)}</div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ''}
        <div class="sec"><h3>Ingredients</h3><div class="seg" role="group" aria-label="Batch size">${BATCHES.map(([v, l]) => `<button type="button" class="${v === k ? 'on' : ''}" data-batch="${v}" aria-pressed="${v === k}">${l}</button>`).join('')}</div></div>
        <div class="tip">Tap an ingredient when it is in the bowl${k !== 1 ? ` · amounts shown for ${k === 2 ? 'a double' : 'half a'} batch` : ''}</div>
        <div class="ings">${ings}</div>
        <div class="sec"><h3>How to</h3></div>
        <div class="steps">${steps}</div>
        <div class="src">From: The Magnolia Bakery ${esc(r.source === 'Handbook' ? 'Handbook' : r.source === 'Complete' ? 'Complete Cookbook' : '· At Home with Magnolia')}${k !== 1 ? ' · the steps are written for 1×' : ''}</div>
      </div></div>`;
    fillPics();
  }
  const aiKeys = new Set();
  const hasAi = r => aiKeys.has(r.category + '/' + r.id);

  // ---------- pictures into the page ----------
  async function fillPics() {
    let keys = []; try { keys = await Pics.keys(); } catch (e) {}
    aiKeys.clear(); keys.forEach(x => aiKeys.add(x));
    for (const el of main.querySelectorAll('[data-pic],[data-own]')) {
      const ownId = el.dataset.own || '', key0 = el.dataset.pic || '';
      let url = null;
      if (key0) {                                             // the AI picture (a category card with no cover yet shows its first recipe's picture)
        let key = key0;
        if (!aiKeys.has(key) && el.dataset.first) key = [el.dataset.first + '/_cover'].find(x => aiKeys.has(x)) || keys.find(x => x.startsWith(el.dataset.first + '/') && !x.endsWith('/_cover')) || key;
        if (aiKeys.has(key)) { const g = await Pics.get(key); url = g && g.url; }
      }
      if (!url && ownId && own.has(ownId)) url = await ownUrl(ownId);      // his own photo (alone, or where there is no AI picture yet)
      if (!el.isConnected) continue;
      const img = el.querySelector(':scope > img.pic');
      if (!url) { if (img) img.remove(); continue; }
      if (img) { if (img.src !== url) img.src = url; }
      else { const i = new Image(); i.className = 'pic'; i.alt = ''; i.decoding = 'async'; i.src = url; i.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; el.prepend(i); }
    }
  }
  async function ownUrl(id) {
    if (ownUrls.has(id)) return ownUrls.get(id);
    let b = null; try { b = await DB.get('photos', id); } catch (e) {}
    if (!b) return null;
    const u = URL.createObjectURL(b); ownUrls.set(id, u); return u;
  }
  function dropOwn(id) { const u = ownUrls.get(id); if (u) URL.revokeObjectURL(u); ownUrls.delete(id); }

  async function shrink(file) {                               // his photo: max 1200 px, JPEG (keeps the phone light)
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      const s = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return await new Promise(ok => c.toBlob(ok, 'image/jpeg', .85));
    } finally { URL.revokeObjectURL(url); }
  }

  // ---------- taps ----------
  let photoFor = null, fileBusy = false;
  main.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    const cur = (location.hash.match(/^#\/r\/(.+)$/) || [])[1], r = cur && byId[cur];
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.tick && r) { const s = ticks[r.id]; s.has(t.dataset.tick) ? s.delete(t.dataset.tick) : s.add(t.dataset.tick); t.classList.toggle('done'); t.setAttribute('aria-pressed', s.has(t.dataset.tick)); return; }
    if (t.dataset.batch && r) { batch[r.id] = Number(t.dataset.batch); return renderRecipe(r); }
    if (t.dataset.hero && r) { heroPick[r.id] = t.dataset.hero; return renderRecipe(r); }
    const a = t.dataset.act;
    if (a === 'home') return leave();
    if (a === 'up') { const h = location.hash; return back(h.startsWith('#/r/') && r ? '#/c/' + r.category : '#/'); }
    if (a === 'load') { if (!fileBusy) $('bkFile').click(); return; }
    if (a === 'fav' && r) {
      favs.has(r.id) ? favs.delete(r.id) : favs.add(r.id);
      try { await DB.put('kv', 'favs', [...favs]); } catch (err) { toast('Could not save'); }
      toast(favs.has(r.id) ? '★ Added to favourites' : 'Removed from favourites'); return renderRecipe(r);
    }
    if (a === 'addphoto' && r) { photoFor = r.id; $('bkPhoto').value = ''; return $('bkPhoto').click(); }
    if (a === 'delphoto' && r) {
      if (!await ask('Delete my photo?', 'Your photo of this recipe is deleted from this phone. The AI picture stays.')) return;
      try { await DB.del('photos', r.id); } catch (err) { return toast('Could not delete'); }
      own.delete(r.id); dropOwn(r.id); heroPick[r.id] = 'ai'; toast('Photo deleted'); return renderRecipe(r);
    }
  });

  $('bkPhoto').onchange = async e => {
    const f = e.target.files && e.target.files[0], id = photoFor; photoFor = null; if (!f || !id) return;
    try {
      const b = await shrink(f); if (!b) throw 0;
      await DB.put('photos', id, b); dropOwn(id); own.add(id); heroPick[id] = 'mine'; toast('✓ Photo saved');
      if (byId[id] && location.hash === '#/r/' + id) renderRecipe(byId[id]);
    } catch (err) { toast('That photo could not be saved'); }
  };

  $('bkFile').onchange = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    fileBusy = true;
    try {
      const doc = JSON.parse(await f.text());
      if (!doc || doc.app !== 'risen-baking' || !Array.isArray(doc.recipes) || !Array.isArray(doc.categories) || !doc.recipes.length) { toast('That is not the recipe file'); return; }
      await DB.put('kv', 'book', doc); setBook(doc); toast(`✓ ${doc.recipes.length} recipes loaded`);
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (err) {}
      location.hash === '#/' || location.hash === '' ? render() : location.replace('#/');
      syncPics(true);
    } catch (err) { toast('That file could not be read'); }
    finally { fileBusy = false; }
  };

  // the RISEN "are you sure?" sheet (never the system confirm)
  function ask(title, text) {
    return new Promise(done => {
      const s = $('bkSheet'); $('bkSheetT').textContent = title; $('bkSheetP').textContent = text; s.hidden = false;
      const end = v => { s.hidden = true; $('bkYes').onclick = $('bkNo').onclick = s.onclick = null; done(v); };
      $('bkYes').onclick = () => end(true); $('bkNo').onclick = () => end(false); s.onclick = ev => { if (ev.target === s) end(false); };
    });
  }

  // ---------- start ----------
  (async () => {
    try {
      const [doc, fv, ph] = await Promise.all([DB.get('kv', 'book'), DB.get('kv', 'favs'), DB.keys('photos')]);
      if (doc && Array.isArray(doc.recipes)) setBook(doc);
      favs = new Set(Array.isArray(fv) ? fv : []); own = new Set(ph || []);
    } catch (e) { main.innerHTML = `${bar('Baking', 'home', 'Back to Home')}<div class="empty">The baking book can't open its data on this phone. Close the app and open it again.</div>`; return; }
    try { (await Pics.keys()).forEach(x => aiKeys.add(x)); } catch (e) {}
    render();
    setTimeout(() => syncPics(false), 1200);
  })();
  document.addEventListener('visibilitychange', () => syncPics(false));
  window.addEventListener('online', () => syncPics(false));
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }); } catch (e) {} }
})();
