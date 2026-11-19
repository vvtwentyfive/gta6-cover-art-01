// Sunset Cover Studio — entry point. Wires the editor, loads the two
// illustrated sample photos, and paints the first preview.
import { createState } from './state.js';
import { initEditor, loadImage, addPhoto } from './editor.js';

const state = createState();

const els = {
  canvas: document.getElementById('cover'),
  layouts: document.getElementById('layouts'),
  grades: document.getElementById('grades'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  titleSize: document.getElementById('title-size'),
  titleSizeVal: document.getElementById('title-size-val'),
  grain: document.getElementById('grain'),
  vignette: document.getElementById('vignette'),
  border: document.getElementById('border'),
  zoom: document.getElementById('zoom'),
  zoomVal: document.getElementById('zoom-val'),
  panelPhoto: document.getElementById('panel-photo'),
  panelLabel: document.getElementById('panel-label'),
  previewLabel: document.getElementById('preview-label'),
  photoInput: document.getElementById('photo-input'),
  dropzone: document.getElementById('dropzone'),
  library: document.getElementById('library'),
  fillAll: document.getElementById('btn-fill-all'),
  clearPanel: document.getElementById('btn-clear-panel'),
  exportSize: document.getElementById('export-size'),
  btnExport: document.getElementById('btn-export'),
  btnReset: document.getElementById('btn-reset'),
  status: document.getElementById('status'),
};

const { redraw } = initEditor(state, els, () => {});

// Sample buttons: load one sample into every panel.
async function useSample(url, name) {
  try {
    const img = await loadImage(url);
    addPhoto(state, els, { name, img, sample: true }, redraw);
    els.status.textContent = name + ' loaded — pick a panel and drag to reposition.';
  } catch (e) {
    els.status.textContent = 'Could not load ' + name;
  }
}
document.getElementById('btn-sample-boulevard').addEventListener('click', () =>
  useSample('./samples/neon-boulevard.jpg', 'Neon Boulevard'));
document.getElementById('btn-sample-rooftop').addEventListener('click', () =>
  useSample('./samples/rooftop-sunset.jpg', 'Rooftop Sunset'));

// Wait for the bundled fonts so the first paint already uses Anton/Pacifico.
async function paint() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('32px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (e) { /* fall back to system fonts */ }
  redraw();
}

// Load both samples up front so the first paint already looks like a poster.
Promise.all([
  loadImage('./samples/neon-boulevard.jpg').catch(() => null),
  loadImage('./samples/rooftop-sunset.jpg').catch(() => null),
]).then(([boulevard, rooftop]) => {
  if (boulevard) addPhoto(state, els, { name: 'Neon Boulevard', img: boulevard, sample: true }, redraw);
  if (rooftop) addPhoto(state, els, { name: 'Rooftop Sunset', img: rooftop, sample: true }, redraw);
  // Hero layout: big panel = boulevard, small panels = rooftop.
  const b = state.library.find((p) => p.name === 'Neon Boulevard');
  const r = state.library.find((p) => p.name === 'Rooftop Sunset');
  if (b && r) {
    state.panels[0].photoId = b.id;
    if (state.panels[1]) state.panels[1].photoId = r.id;
    if (state.panels[2]) state.panels[2].photoId = b.id;
  }
  paint();
});
