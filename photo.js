// RISEN exercise photo slot: one photo per exercise, linked to the exercise ID.
//   PhotoSlot.mount(element, exerciseId, {editable})
//   editable:true  (Plan)  -> "+ Add photo", tap photo = full screen, trash = delete (asks first)
//   editable:false (Today) -> photo only (nothing shown if there is none), tap = full screen
//   video:true     (exercises only) -> a short video clip (MP4 / MOV, up to 8 MB) may be chosen instead of a photo; it plays silent and looping
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

  // What gets stored. An animated picture (GIF, WebP) is kept EXACTLY as the file is (no canvas, no re-encode: that would flatten it to its first frame), with its real
  // width and height read from the image; up to 5 MB. Everything else is resized to a JPEG as before.
  const KEEP = ['image/gif', 'image/webp'], MAX_ANIMATED = 5 * 1024 * 1024;
  const TOO_BIG = 'That file is too big — keep it under 5 MB';
  function naturalSize(file) {
    return new Promise((res, rej) => {
      const src = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(src); res({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(src); rej(new Error('Could not read that photo')); };
      img.src = src;
    });
  }
  async function prepare(file, { video = false } = {}) {
    if (isVideo(file.type)) {
      if (!video) throw new Error('A video only works on an exercise');
      if (file.size > MAX_VIDEO) throw new Error(VIDEO_TOO_BIG);
      const { width, height } = await videoSize(file);
      return { blob: file, width, height };
    }
    if (KEEP.includes(file.type)) {
      if (file.size > MAX_ANIMATED) throw new Error(TOO_BIG);
      const { width, height } = await naturalSize(file);
      return { blob: file, width, height };
    }
    return resize(file);
  }
  // A short video clip (exercises only, the slot asks for it with {video:true}): kept EXACTLY as the file is (MP4, or the MOV an iPhone hands over), up to 8 MB.
  // It is shown silent and looping wherever the exercise photo sits (`media()` below).
  const MAX_VIDEO = 8 * 1024 * 1024, VIDEO_TOO_BIG = 'That video is too big — keep it under 8 MB (3–5 seconds)';
  const isVideo = t => /^video\//.test(t || '');
  function videoSize(file) {              // the clip's real width and height; 0 × 0 when the phone will not say (never a reason to refuse the clip)
    return new Promise(res => {
      const src = URL.createObjectURL(file), v = document.createElement('video');
      let over = false; const end = (w, h) => { if (over) return; over = true; URL.revokeObjectURL(src); res({ width: w || 0, height: h || 0 }); };
      v.preload = 'metadata'; v.muted = true; v.playsInline = true;
      v.onloadedmetadata = () => end(v.videoWidth, v.videoHeight); v.onerror = () => end(0, 0);
      setTimeout(() => end(0, 0), 4000);
      v.src = src;
    });
  }
  // ONE way to show a stored picture or clip: a clip is a silent, looping, inline video (no controls, never full screen by itself); everything else is an <img>
  const media = (url, type) => isVideo(type)
    ? `<video src="${url}#t=0.001" muted loop autoplay playsinline webkit-playsinline disablepictureinpicture preload="auto" aria-hidden="true"></video>`
    : `<img alt="" src="${url}">`;
  // After drawing: make sure every clip under `root` really is silent and running (an iPhone only starts a muted one by itself)
  function kick(root) {
    (root || document).querySelectorAll('video').forEach(v => { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(document); });      // back in front: the clips go on

  const sizeText = b => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB';
  const kindText = t => isVideo(t) ? 'VIDEO' : t === 'image/gif' ? 'GIF' : t === 'image/webp' ? 'WebP' : 'JPG';

  function urlFor(id, blob) {
    if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
    const u = URL.createObjectURL(blob); urls.set(id, u); return u;
  }

  // Full-screen viewer (one shared overlay)
  let viewer;
  function openViewer(url, type, { cover = false, placeholder = '' } = {}) {          // cover: fill the whole screen (a vertical picture / clip, Day Off) · placeholder: text shown when there is no picture yet
    if (!viewer) {
      viewer = document.createElement('div'); viewer.className = 'pviewer';
      viewer.innerHTML = '<div class="pviewer-m"></div><button class="pviewer-x" aria-label="Close"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
      viewer.onclick = () => { viewer.classList.remove('open'); const v = viewer.querySelector('video'); if (v) v.pause(); };
      document.body.appendChild(viewer);
    }
    viewer.classList.toggle('cover', !!cover);
    const m = viewer.querySelector('.pviewer-m'); m.innerHTML = url ? media(url, type) : `<div class="pviewer-ph"><b>${placeholder}</b></div>`; kick(m);
    requestAnimationFrame(() => viewer.classList.add('open'));
  }

  const TRASH = ICONS.trash;
  const CAMERA = '<svg class="icon" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  async function mount(el, exerciseId, { editable = false, onChange, video = false, swap = false, builtIn = null } = {}) {          // builtIn: async () => ({url, type}) | null = the app's own picture for this slot (exercise clip, pack recipe), shown when the user has none          // video:true (exercises) = a short clip may be chosen instead of a photo
    const p = await RisenDB.getPhoto(exerciseId);
    let built = null;
    const again = () => mount(el, exerciseId, { editable, onChange, video, swap, builtIn });
    async function pick(e) {                          // a file was chosen: store it, then draw the slot again
      const f = e.target.files[0]; if (!f) return;
      const s = el.querySelector('span'); if (s) s.textContent = 'Saving…';
      try { const r = await prepare(f, { video }); await RisenDB.setPhoto(exerciseId, r.blob, r.width, r.height); }
      catch (err) { toast(err.message || 'Could not read that photo'); }
      await again(); if (onChange) onChange();
    }
    el.classList.add('pslot');
    if (p) {
      el.innerHTML = `<button class="pslot-img" aria-label="${isVideo(p.type) ? 'View video' : 'View photo'}">${media(urlFor(exerciseId, p.blob), p.type)}</button>` +
        (editable ? `<span class="pslot-size" aria-label="Stored size">${kindText(p.type)} · ${sizeText(p.blob.size)}</span><button class="pslot-del" aria-label="Delete photo">${TRASH}</button>` : '');       // what this photo costs
      kick(el);
      el.querySelector('.pslot-img').onclick = () => openViewer(urls.get(exerciseId), p.type);
      if (editable) el.querySelector('.pslot-del').onclick = async () => {
        if (!(await ask({ title: 'Delete this photo?', ok: 'DELETE', danger: true }))) return;
        await RisenDB.deletePhoto(exerciseId); await again(); if (onChange) onChange();
      };
    } else if (builtIn && (built = await builtIn())) {
      // no photo of the user's own: the BUILT-IN picture / clip (media.js: an exercise's from assets/exercises/, a pack recipe's from assets/recipes/). `swap` (exercise page) adds a quiet way to put his own over it
      el.innerHTML = `<button class="pslot-img" aria-label="${isVideo(built.type) ? 'View video' : 'View photo'}">${media(built.url, built.type)}</button>` +
        (editable && swap ? `<label class="pslot-own"><span>${video ? '+ Use my own photo or video' : '+ Use my own photo'}</span><input type="file" accept="${video ? 'image/*,video/mp4,video/quicktime' : 'image/*'}" hidden></label>` : '');
      kick(el);
      el.querySelector('.pslot-img').onclick = () => openViewer(built.url, built.type);
      const inp = el.querySelector('input'); if (inp) inp.onchange = pick;
    } else if (editable) {
      el.innerHTML = `<label class="pslot-add">${CAMERA}<span>${video ? '+ Add photo or video' : '+ Add photo'}</span><input type="file" accept="${video ? 'image/*,video/mp4,video/quicktime' : 'image/*'}" hidden></label>`;
      el.querySelector('input').onchange = pick;
    } else {
      el.innerHTML = ''; el.classList.remove('pslot');
    }
  }

  return { mount, resize, prepare, media, kick, isVideo, view: openViewer };
})();
