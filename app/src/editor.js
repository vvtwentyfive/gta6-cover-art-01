// Editor wiring: controls, library, drag-to-reposition, panel selection.
import { LAYOUTS, GRADES, EXPORT_SIZES, layoutOf, setLayout, photoById } from './state.js';
import { renderCover, renderExport } from './engine.js';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image: ' + src));
    img.src = src;
  });
}

let uid = 0;

export function initEditor(state, els, onRedraw) {
  const redraw = () => { onRedraw(); renderCover(els.canvas, state); syncPanelUI(state, els); };

  // ---- layout + grade swatches ----
  buildSwatches(els.layouts, LAYOUTS, state.layoutId, (id) => {
    setLayout(state, id);
    redraw();
  }, (l) => `<span class="mini" style="grid-template-columns:repeat(${l.rects.length > 3 ? 2 : 1},1fr)">
      ${l.rects.map(() => '<i></i>').join('')}</span>${l.name}`);
  buildSwatches(els.grades, GRADES, state.gradeId, (id) => { state.gradeId = id; redraw(); },
    (g) => `<span class="bars">${g.stops.map((s) => `<i style="background:${s}"></i>`).join('')}</span>${g.name}`);

  // ---- text ----
  els.title.addEventListener('input', () => { state.title = els.title.value; redraw(); });
  els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
  els.titleSize.addEventListener('input', () => {
    state.titleScale = els.titleSize.value / 100;
    els.titleSizeVal.textContent = els.titleSize.value + '%';
    redraw();
  });

  // ---- toggles ----
  els.grain.addEventListener('change', () => { state.grain = els.grain.checked; redraw(); });
  els.vignette.addEventListener('change', () => { state.vignette = els.vignette.checked; redraw(); });
  els.border.addEventListener('change', () => { state.border = els.border.checked; redraw(); });

  // ---- export size ----
  els.exportSize.addEventListener('change', () => {
    state.exportSize = els.exportSize.value;
    const [w, h] = EXPORT_SIZES[state.exportSize];
    els.canvas.width = w;
    els.canvas.height = h;
    els.previewLabel.textContent = `Preview · ${w} × ${h}`;
    redraw();
  });

  // ---- zoom ----
  els.zoom.addEventListener('input', () => {
    const p = state.panels[state.selectedPanel];
    if (p) p.zoom = els.zoom.value / 100;
    els.zoomVal.textContent = els.zoom.value + '%';
    redraw();
  });

  // ---- panel photo select ----
  els.panelPhoto.addEventListener('change', () => {
    const p = state.panels[state.selectedPanel];
    if (p) { p.photoId = els.panelPhoto.value || null; p.ox = 0; p.oy = 0; }
    redraw();
  });
  els.fillAll.addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    if (p && p.photoId) state.panels.forEach((q) => { q.photoId = p.photoId; });
    redraw();
  });
  els.clearPanel.addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    if (p) { p.photoId = null; p.ox = 0; p.oy = 0; p.zoom = 1; }
    redraw();
  });

  // ---- library: file picker, dropzone, paste ----
  const addFiles = async (files) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        addPhoto(state, els, { name: file.name, img, sample: false }, redraw);
      } catch (e) { els.status.textContent = 'Could not read ' + file.name; }
    }
  };
  els.photoInput.addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  ['dragover', 'dragenter'].forEach((ev) => els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); els.dropzone.classList.add('over');
  }));
  ['dragleave', 'drop'].forEach((ev) => els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); els.dropzone.classList.remove('over');
  }));
  els.dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
  document.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) addFiles(files);
  });

  // ---- canvas: click to select panel, drag to reposition ----
  let drag = null;
  const panelAt = (e) => {
    const r = els.canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    return layoutOf(state).rects.findIndex(([x, y, w, h]) =>
      px >= x && px <= x + w && py >= y && py <= y + h);
  };
  els.canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e);
    if (i < 0) return;
    state.selectedPanel = i;
    els.canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy };
    redraw();
  });
  els.canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = els.canvas.getBoundingClientRect();
    const p = state.panels[state.selectedPanel];
    if (!p) return;
    p.ox = clamp(drag.ox + (e.clientX - drag.x) / r.width, -0.6, 0.6);
    p.oy = clamp(drag.oy + (e.clientY - drag.y) / r.height, -0.6, 0.6);
    renderCover(els.canvas, state);
  });
  const endDrag = () => { drag = null; };
  els.canvas.addEventListener('pointerup', endDrag);
  els.canvas.addEventListener('pointercancel', endDrag);

  // ---- keyboard: arrow keys nudge the selected panel's photo ----
  els.canvas.setAttribute('tabindex', '0');
  els.canvas.addEventListener('keydown', (e) => {
    const p = state.panels[state.selectedPanel];
    if (!p || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const step = e.shiftKey ? 0.05 : 0.02;
    if (e.key === 'ArrowLeft') p.ox = clamp(p.ox - step, -0.6, 0.6);
    if (e.key === 'ArrowRight') p.ox = clamp(p.ox + step, -0.6, 0.6);
    if (e.key === 'ArrowUp') p.oy = clamp(p.oy - step, -0.6, 0.6);
    if (e.key === 'ArrowDown') p.oy = clamp(p.oy + step, -0.6, 0.6);
    renderCover(els.canvas, state);
  });

  // ---- export ----
  els.btnExport.addEventListener('click', () => {
    const [w, h] = EXPORT_SIZES[state.exportSize];
    const out = renderExport(state, w, h);
    out.toBlob((blob) => {
      if (!blob) { els.status.textContent = 'Export failed.'; return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sunset-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      els.status.textContent = `Saved sunset-cover-${w}x${h}.png`;
    }, 'image/png');
  });

  els.btnReset.addEventListener('click', () => {
    const keep = state.library;
    Object.assign(state, {
      layoutId: 'hero', gradeId: 'neon', grain: true, vignette: true, border: true,
      title: 'NEON HEAT', subtitle: 'Vice City · Summer 2026', titleScale: 1,
      selectedPanel: 0, exportSize: '1080x1080',
      panels: LAYOUTS[0].rects.map(() => ({ photoId: null, ox: 0, oy: 0, zoom: 1 })),
      library: keep,
    });
    els.title.value = state.title;
    els.subtitle.value = state.subtitle;
    els.grain.checked = els.vignette.checked = els.border.checked = true;
    els.exportSize.value = '1080x1080';
    const [w, h] = EXPORT_SIZES[state.exportSize];
    els.canvas.width = w; els.canvas.height = h;
    els.previewLabel.textContent = `Preview · ${w} × ${h}`;
    redraw();
  });

  return { redraw, addFiles };
}

function buildSwatches(container, items, activeId, onPick, labelHtml) {
  container.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (item.id === activeId ? ' active' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', item.id === activeId ? 'true' : 'false');
    b.innerHTML = labelHtml(item);
    b.title = item.desc || item.name;
    b.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach((s) => {
        s.classList.remove('active'); s.setAttribute('aria-checked', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-checked', 'true');
      onPick(item.id);
    });
    container.appendChild(b);
  });
}

export function addPhoto(state, els, photo, redraw) {
  photo.id = 'p' + (++uid);
  state.library.push(photo);
  const thumb = document.createElement('img');
  thumb.src = photo.img.src;
  thumb.alt = photo.name;
  thumb.className = photo.sample ? 'sample' : '';
  thumb.title = photo.name + (photo.sample ? ' (sample)' : '');
  thumb.addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    if (p) { p.photoId = photo.id; p.ox = 0; p.oy = 0; }
    els.library.querySelectorAll('img').forEach((i) => i.classList.remove('active'));
    thumb.classList.add('active');
    redraw();
  });
  els.library.appendChild(thumb);
  // Auto-assign: first photo fills the first empty panel, samples fill all panels.
  const empty = state.panels.find((p) => !p.photoId);
  if (photo.sample) {
    state.panels.forEach((p) => { if (!p.photoId) p.photoId = photo.id; });
  } else if (empty) {
    empty.photoId = photo.id;
  }
  redraw();
}

function syncPanelUI(state, els) {
  const p = state.panels[state.selectedPanel];
  els.panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length} selected`;
  els.zoom.value = Math.round((p?.zoom || 1) * 100);
  els.zoomVal.textContent = els.zoom.value + '%';
  const sel = els.panelPhoto;
  const current = sel.value;
  sel.innerHTML = '<option value="">— empty —</option>';
  state.library.forEach((photo) => {
    const o = document.createElement('option');
    o.value = photo.id;
    o.textContent = photo.name;
    sel.appendChild(o);
  });
  sel.value = p?.photoId || '';
  if (sel.value !== current) { /* keep in sync */ }
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
