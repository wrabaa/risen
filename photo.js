// RISEN exercise photo slot: one photo per exercise, linked to the exercise ID.
//   PhotoSlot.mount(element, exerciseId, {editable})
//   editable:true  (Plan)  -> "+ Add photo", tap photo = full screen, trash = delete (asks first)
//   editable:false (Today) -> photo only (nothing shown if there is none), tap = full screen
const PhotoSlot = (() => {
  const MAX = 1000, QUALITY = 0.85;
  const urls = new Map(); // exerciseId -> object URL, freed when replaced

  // Resize to max 1000px on the longest side and save as JPEG
  function resize(file) {
    return new Promise((res, rej) => {
      const src = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(src);
        c.toBlob(b => b ? res({ blob: b, width: w, height: h }) : rej(new Error('Could not read that photo')), 'image/jpeg', QUALITY);
      };
      img.onerror = () => { URL.revokeObjectURL(src); rej(new Error('Could not read that photo')); };
      img.src = src;
    });
  }

  function urlFor(id, blob) {
    if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
    const u = URL.createObjectURL(blob); urls.set(id, u); return u;
  }

  // Full-screen viewer (one shared overlay)
  let viewer;
  function openViewer(url) {
    if (!viewer) {
      viewer = document.createElement('div'); viewer.className = 'pviewer';
      viewer.innerHTML = '<img alt=""><button class="pviewer-x" aria-label="Close"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
      viewer.onclick = () => viewer.classList.remove('open');
      document.body.appendChild(viewer);
    }
    viewer.querySelector('img').src = url;
    requestAnimationFrame(() => viewer.classList.add('open'));
  }

  const TRASH = ICONS.trash;
  const CAMERA = '<svg class="icon" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  async function mount(el, exerciseId, { editable = false } = {}) {
    const p = await RisenDB.getPhoto(exerciseId);
    el.classList.add('pslot');
    if (p) {
      el.innerHTML = `<button class="pslot-img" aria-label="View photo"><img alt="" src="${urlFor(exerciseId, p.blob)}"></button>` +
        (editable ? `<button class="pslot-del" aria-label="Delete photo">${TRASH}</button>` : '');
      el.querySelector('.pslot-img').onclick = () => openViewer(urls.get(exerciseId));
      if (editable) el.querySelector('.pslot-del').onclick = async () => {
        if (!confirm('Delete this photo?')) return;
        await RisenDB.deletePhoto(exerciseId); mount(el, exerciseId, { editable });
      };
    } else if (editable) {
      el.innerHTML = `<label class="pslot-add">${CAMERA}<span>+ Add photo</span><input type="file" accept="image/*" hidden></label>`;
      el.querySelector('input').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        el.querySelector('span').textContent = 'Saving…';
        try { const r = await resize(f); await RisenDB.setPhoto(exerciseId, r.blob, r.width, r.height); }
        catch (err) { alert(err.message); }
        mount(el, exerciseId, { editable });
      };
    } else {
      el.innerHTML = ''; el.classList.remove('pslot');
    }
  }

  return { mount, resize };
})();
