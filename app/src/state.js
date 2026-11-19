// Sunset Cover Studio — state: layouts, colour grades and the cover's live state.
// A "panel" is one framed slot on the poster. Each panel remembers which photo it
// shows and how that photo is cropped inside it (zoom, pan, fit).

export const SIZES = [
  { id: "1080x1080", label: "1080 × 1080", w: 1080, h: 1080 },
  { id: "1080x1350", label: "1080 × 1350", w: 1080, h: 1350 },
  { id: "1920x1080", label: "1920 × 1080", w: 1920, h: 1080 },
  { id: "1080x1920", label: "1080 × 1920", w: 1080, h: 1920 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

// A layout is a function of the poster's aspect (w/h) returning panel rects in
// 0..1 poster coordinates, each with an optional tilt in degrees. The poster
// background shows through the gaps, so the panels read as a framed collage.
const GAP = 0.014;

function gridRects(cols, rows) {
  const rects = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: GAP + (c * (1 - 2 * GAP)) / cols + (c > 0 ? GAP / 2 : 0) + (c * GAP) / cols,
        y: GAP + (r * (1 - 2 * GAP)) / rows + (r > 0 ? GAP / 2 : 0) + (r * GAP) / rows,
        w: (1 - 2 * GAP - (cols - 1) * GAP) / cols,
        h: (1 - 2 * GAP - (rows - 1) * GAP) / rows,
        rot: 0,
      });
    }
  }
  return rects;
}

export const LAYOUTS = [
  {
    id: "grid4",
    name: "Four Up",
    panels: 4,
    diagram: "2x2",
    rects: () => gridRects(2, 2),
  },
  {
    id: "hero3",
    name: "Hero + 3",
    panels: 4,
    diagram: "hero",
    rects: (aspect) => {
      const heroW = aspect >= 1 ? 0.62 : 0.58;
      const rects = [{ x: GAP, y: GAP, w: heroW - GAP, h: 1 - 2 * GAP, rot: 0 }];
      const colX = heroW + GAP;
      const colW = 1 - colX - GAP;
      const rowH = (1 - 2 * GAP - 2 * GAP) / 3;
      for (let i = 0; i < 3; i++) {
        rects.push({ x: colX, y: GAP + i * (rowH + GAP), w: colW, h: rowH, rot: 0 });
      }
      return rects;
    },
  },
  {
    id: "full",
    name: "Full Bleed",
    panels: 1,
    diagram: "full",
    rects: () => [{ x: 0.02, y: 0.02, w: 0.96, h: 0.96, rot: 0 }],
  },
  {
    id: "grid9",
    name: "Nine Up",
    panels: 9,
    diagram: "3x3",
    rects: () => gridRects(3, 3),
  },
  {
    id: "strip",
    name: "Snapshot Strip",
    panels: 5,
    diagram: "strip",
    rects: (aspect) => {
      // Overlapping tilted snapshots across the middle band, like prints
      // fanned out on a table. Taller posters get a taller band.
      const bandH = aspect >= 1 ? 0.62 : 0.56;
      const bandY = (1 - bandH) / 2 - 0.08;
      const w = 0.28;
      const tilts = [-5, 3.5, -3, 4.5, -4];
      const rects = [];
      for (let i = 0; i < 5; i++) {
        rects.push({
          x: 0.03 + i * 0.165,
          y: bandY + (i % 2 === 0 ? 0 : 0.03),
          w,
          h: bandH,
          rot: tilts[i],
        });
      }
      return rects;
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// A grade is a gradient map: a photo's luminance is remapped through these
// stops, then blended back with the original so skin and detail survive.
// Each stop is [position 0..1, [r, g, b]].
export const GRADES = [
  {
    id: "vice",
    name: "Vice Sunset",
    note: "magenta → gold",
    strength: 0.85,
    stops: [
      [0.0, [26, 12, 52]],
      [0.3, [123, 45, 139]],
      [0.55, [255, 41, 117]],
      [0.8, [255, 154, 61]],
      [1.0, [255, 230, 109]],
    ],
  },
  {
    id: "neon",
    name: "Neon Nights",
    note: "cyan → hot pink",
    strength: 0.8,
    stops: [
      [0.0, [5, 11, 30]],
      [0.3, [11, 61, 145]],
      [0.55, [0, 229, 255]],
      [0.8, [255, 47, 179]],
      [1.0, [255, 255, 255]],
    ],
  },
  {
    id: "dusk",
    name: "Palm Dusk",
    note: "teal → amber",
    strength: 0.8,
    stops: [
      [0.0, [15, 42, 46]],
      [0.35, [20, 82, 74]],
      [0.6, [224, 138, 60]],
      [0.85, [255, 210, 125]],
      [1.0, [255, 244, 200]],
    ],
  },
  {
    id: "heat",
    name: "Heat Haze",
    note: "ember red duotone",
    strength: 0.85,
    stops: [
      [0.0, [26, 5, 5]],
      [0.3, [122, 14, 14]],
      [0.6, [232, 60, 30]],
      [0.85, [255, 179, 71]],
      [1.0, [255, 240, 180]],
    ],
  },
  {
    id: "noir",
    name: "Mono Noir",
    note: "warm silver mono",
    strength: 0.92,
    stops: [
      [0.0, [8, 8, 12]],
      [0.35, [64, 60, 66]],
      [0.7, [158, 152, 156]],
      [1.0, [245, 240, 232]],
    ],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function blankPanel() {
  return { photo: -1, zoom: 1, ox: 0, oy: 0, fit: "cover" };
}

export function createState() {
  return {
    sizeId: "1080x1080",
    layoutId: "grid4",
    gradeId: "vice",
    grain: true,
    vignette: true,
    title: "VICE CITY",
    subtitle: "one last summer",
    titleGradient: true,
    titleOutline: true,
    photos: [], // { img: HTMLImageElement, name: string }
    panels: Array.from({ length: 9 }, () => blankPanel()),
    selectedPhoto: -1,
    selectedPanel: 0,
  };
}

/** Panels the current layout actually shows, with their live settings. */
export function visiblePanels(state) {
  const layout = layoutById(state.layoutId);
  const size = sizeById(state.sizeId);
  const rects = layout.rects(size.w / size.h);
  return rects.map((rect, i) => ({ rect, panel: state.panels[i], index: i }));
}
