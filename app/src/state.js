// Central state for Sunset Cover Studio: layouts, grades, panels, photos.
// A panel holds a reference to a library photo plus its own crop (offset + zoom).

export const LAYOUTS = [
  { id: 'hero', name: 'Hero', desc: '1 large + 2 small',
    rects: [[0, 0, 0.66, 1], [0.67, 0, 0.33, 0.495], [0.67, 0.505, 0.33, 0.495]] },
  { id: 'trio', name: 'Banner rows', desc: 'wide banner + 3 rows',
    rects: [[0, 0, 1, 0.42], [0, 0.43, 0.495, 0.27], [0.505, 0.43, 0.495, 0.27],
            [0, 0.71, 1, 0.29]] },
  { id: 'quad', name: 'Quad', desc: '2 × 2 grid',
    rects: [[0, 0, 0.495, 0.495], [0.505, 0, 0.495, 0.495],
            [0, 0.505, 0.495, 0.495], [0.505, 0.505, 0.495, 0.495]] },
  { id: 'duo', name: 'Duo', desc: '2 tall columns',
    rects: [[0, 0, 0.495, 1], [0.505, 0, 0.495, 1]] },
  { id: 'strip', name: 'Strip', desc: '1 wide + 3 small',
    rects: [[0, 0, 1, 0.58], [0, 0.59, 0.326, 0.41], [0.337, 0.59, 0.326, 0.41],
            [0.674, 0.59, 0.326, 0.41]] },
];

export const GRADES = [
  { id: 'neon', name: 'Neon Sunset', top: '#ff2e88', mid: '#ff7a18', bottom: '#2a0f45',
    title: '#ffffff', accent: '#ffd166', stops: ['#ff2e88', '#ff7a18', '#ffd166'] },
  { id: 'vice', name: 'Vice Pink', top: '#ff5fa2', mid: '#b537f2', bottom: '#1c0b33',
    title: '#ffe9f4', accent: '#7ad9ff', stops: ['#ff5fa2', '#b537f2', '#7ad9ff'] },
  { id: 'ocean', name: 'Ocean Drive', top: '#00c2ff', mid: '#0077ff', bottom: '#0b1e3f',
    title: '#ffffff', accent: '#ff5e62', stops: ['#00c2ff', '#0077ff', '#ff5e62'] },
  { id: 'midnight', name: 'Midnight', top: '#7b2ff7', mid: '#3b1d8f', bottom: '#0a0618',
    title: '#f5eefc', accent: '#ff2e88', stops: ['#7b2ff7', '#3b1d8f', '#ff2e88'] },
  { id: 'golden', name: 'Golden Hour', top: '#ffb347', mid: '#ff6b35', bottom: '#3d1c10',
    title: '#fff7e0', accent: '#2a0f45', stops: ['#ffb347', '#ff6b35', '#ffd166'] },
];

export const EXPORT_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
  '1080x1920': [1080, 1920],
};

export function blankPanel() {
  return { photoId: null, ox: 0, oy: 0, zoom: 1 };
}

export function createState() {
  return {
    layoutId: 'hero',
    gradeId: 'neon',
    grain: true,
    vignette: true,
    border: true,
    title: 'NEON HEAT',
    subtitle: 'Vice City · Summer 2026',
    titleScale: 1,
    selectedPanel: 0,
    exportSize: '1080x1080',
    panels: LAYOUTS[0].rects.map(() => blankPanel()),
    library: [], // { id, name, img, sample }
  };
}

export function layoutOf(state) {
  return LAYOUTS.find((l) => l.id === state.layoutId) || LAYOUTS[0];
}

export function gradeOf(state) {
  return GRADES.find((g) => g.id === state.gradeId) || GRADES[0];
}

export function setLayout(state, layoutId) {
  const layout = LAYOUTS.find((l) => l.id === layoutId);
  if (!layout) return;
  const old = state.panels;
  state.layoutId = layoutId;
  state.panels = layout.rects.map((_, i) => old[i] || blankPanel());
  state.selectedPanel = Math.min(state.selectedPanel, state.panels.length - 1);
}

export function photoById(state, id) {
  return state.library.find((p) => p.id === id) || null;
}
