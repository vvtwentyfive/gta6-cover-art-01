// Sunset Cover Studio — cover engine: draws the whole poster onto a canvas.
// Pipeline per panel: photo -> gradient-map grade (cached per photo+grade) ->
// framed slot with white border -> caption band -> grain + vignette.

import { gradeById, sizeById, visiblePanels } from "./state.js";

const DEG = Math.PI / 180;

// --- gradient-map lookup tables -------------------------------------------

const lutCache = new Map(); // gradeId -> { r: Uint8Array, g: Uint8Array, b: Uint8Array }

function gradeLut(grade) {
  let lut = lutCache.get(grade.id);
  if (lut) return lut;
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let c = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        c = stops[s + 1];
        break;
      }
    }
    const f = c[0] === a[0] ? 0 : (t - a[0]) / (c[0] - a[0]);
    r[i] = Math.round(a[1][0] + (c[1][0] - a[1][0]) * f);
    g[i] = Math.round(a[1][1] + (c[1][1] - a[1][1]) * f);
    b[i] = Math.round(a[1][2] + (c[1][2] - a[1][2]) * f);
  }
  lut = { r, g, b };
  lutCache.set(grade.id, lut);
  return lut;
}

// --- graded photo cache ----------------------------------------------------
// One graded copy per (photo object, grade, draw size) so a drag re-render
// only redraws, never re-grades.

const gradedCache = new Map();

function gradedPhoto(photo, grade, w, h) {
  const key = `${photo.name}|${grade.id}|${w}x${h}`;
  let canvas = gradedCache.get(key);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(photo.img, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const lut = gradeLut(grade);
  const s = grade.strength;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = Math.round(data[i] * (1 - s) + lut.r[lum] * s);
    data[i + 1] = Math.round(data[i + 1] * (1 - s) + lut.g[lum] * s);
    data[i + 2] = Math.round(data[i + 2] * (1 - s) + lut.b[lum] * s);
  }
  ctx.putImageData(image, 0, 0);
  if (gradedCache.size > 24) gradedCache.clear();
  gradedCache.set(key, canvas);
  return canvas;
}

// --- grain -----------------------------------------------------------------

let grainTile = null;

function grainCanvas() {
  if (grainTile) return grainTile;
  grainTile = document.createElement("canvas");
  grainTile.width = 160;
  grainTile.height = 160;
  const ctx = grainTile.getContext("2d");
  const image = ctx.createImageData(160, 160);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return grainTile;
}

// --- panel drawing ---------------------------------------------------------

/** Where a photo lands inside a panel rect, for fit + zoom + pan. */
function photoDrawRect(photo, rectPx, panel) {
  const iw = photo.img.naturalWidth;
  const ih = photo.img.naturalHeight;
  const panelAspect = rectPx.w / rectPx.h;
  const imgAspect = iw / ih;
  let baseW;
  let baseH;
  if (panel.fit === "contain") {
    if (imgAspect > panelAspect) {
      baseW = rectPx.w;
      baseH = rectPx.w / imgAspect;
    } else {
      baseH = rectPx.h;
      baseW = rectPx.h * imgAspect;
    }
  } else {
    if (imgAspect > panelAspect) {
      baseH = rectPx.h;
      baseW = rectPx.h * imgAspect;
    } else {
      baseW = rectPx.w;
      baseH = rectPx.w / imgAspect;
    }
  }
  const w = baseW * panel.zoom;
  const h = baseH * panel.zoom;
  return {
    x: rectPx.x + (rectPx.w - w) / 2 + panel.ox * rectPx.w,
    y: rectPx.y + (rectPx.h - h) / 2 + panel.oy * rectPx.h,
    w,
    h,
  };
}

function drawPanel(ctx, state, slot, W, H, showSelection) {
  const { rect, panel, index } = slot;
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  const cx = px + pw / 2;
  const cy = py + ph / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rect.rot ?? 0) * DEG);

  // White photo-paper border + soft drop shadow.
  const border = Math.max(3, Math.round(Math.min(pw, ph) * 0.012));
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(W * 0.012);
  ctx.shadowOffsetY = Math.round(W * 0.006);
  ctx.fillStyle = "#fdf8f2";
  ctx.fillRect(-pw / 2 - border, -ph / 2 - border, pw + border * 2, ph + border * 2);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.rect(-pw / 2, -ph / 2, pw, ph);
  ctx.clip();

  const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;
  if (photo && photo.img.complete && photo.img.naturalWidth > 0) {
    const grade = gradeById(state.gradeId);
    const gw = Math.min(900, Math.max(120, Math.round(pw)));
    const gh = Math.min(900, Math.max(120, Math.round(ph)));
    const graded = gradedPhoto(photo, grade, gw, gh);
    const draw = photoDrawRect(
      { img: { naturalWidth: graded.width, naturalHeight: graded.height } },
      { x: -pw / 2, y: -ph / 2, w: pw, h: ph },
      panel,
    );
    ctx.drawImage(graded, draw.x, draw.y, draw.w, draw.h);
  } else {
    // Empty slot: warm placeholder with a sun glyph and a hint.
    const grad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
    grad.addColorStop(0, "#3a1c5e");
    grad.addColorStop(1, "#12081f");
    ctx.fillStyle = grad;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = "rgba(255,211,25,0.9)";
    ctx.font = `${Math.round(ph * 0.16)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☀", 0, -ph * 0.08);
    ctx.fillStyle = "rgba(245,238,252,0.75)";
    ctx.font = `600 ${Math.round(Math.min(pw, ph) * 0.045)}px sans-serif`;
    ctx.fillText("add a photo", 0, ph * 0.1);
  }
  ctx.restore();

  if (showSelection && index === state.selectedPanel) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rect.rot ?? 0) * DEG);
    ctx.strokeStyle = "#ffd319";
    ctx.lineWidth = Math.max(2, Math.round(W * 0.004));
    ctx.setLineDash([Math.round(W * 0.012), Math.round(W * 0.008)]);
    ctx.strokeRect(-pw / 2 - border - 4, -ph / 2 - border - 4, pw + border * 2 + 8, ph + border * 2 + 8);
    ctx.restore();
  }
}

// --- caption ---------------------------------------------------------------

function fitFont(ctx, text, fontTemplate, maxWidth, startSize) {
  let size = startSize;
  while (size > 12) {
    ctx.font = fontTemplate(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawCaption(ctx, state, W, H) {
  const title = (state.title || "").trim().toUpperCase();
  const subtitle = (state.subtitle || "").trim();
  if (!title && !subtitle) return;

  // Scrim so the lettering reads over any photo.
  const bandH = H * 0.26;
  const scrim = ctx.createLinearGradient(0, H - bandH, 0, H);
  scrim.addColorStop(0, "rgba(10,4,24,0)");
  scrim.addColorStop(0.55, "rgba(10,4,24,0.55)");
  scrim.addColorStop(1, "rgba(10,4,24,0.82)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H - bandH, W, bandH);

  const margin = W * 0.055;
  const maxW = W - margin * 2;
  let baseline = H - H * 0.045;

  if (subtitle) {
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const subSize = fitFont(
      ctx,
      subtitle,
      (s) => `${s}px Pacifico, cursive`,
      maxW,
      Math.round(W * 0.048),
    );
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = "#ff7ad9";
    ctx.shadowColor = "#ff2975";
    ctx.shadowBlur = Math.round(W * 0.018);
    ctx.fillText(subtitle, margin, baseline);
    ctx.shadowBlur = 0;
    baseline -= subSize * 1.15;
  }

  if (title) {
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const titleSize = fitFont(
      ctx,
      title,
      (s) => `${s}px Anton, sans-serif`,
      maxW,
      Math.round(W * 0.115),
    );
    ctx.font = `${titleSize}px Anton, sans-serif`;
    if (state.titleGradient) {
      const grad = ctx.createLinearGradient(margin, baseline - titleSize, margin, baseline);
      grad.addColorStop(0, "#ffd319");
      grad.addColorStop(0.5, "#ff9a3d");
      grad.addColorStop(0.8, "#ff2975");
      grad.addColorStop(1, "#c86bff");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = "#ffffff";
    }
    if (state.titleOutline) {
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = Math.round(W * 0.008);
      ctx.shadowOffsetY = Math.round(W * 0.004);
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a0b2e";
      ctx.lineWidth = Math.max(2, Math.round(titleSize * 0.09));
      ctx.strokeText(title, margin, baseline);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.fillText(title, margin, baseline);
  }
}

// --- whole poster ----------------------------------------------------------

/**
 * Draw the cover onto `canvas` at its own pixel size.
 * `showSelection` draws the editor's dashed outline; exports pass false.
 */
export function renderCover(canvas, state, showSelection) {
  const size = sizeById(state.sizeId);
  const W = size.w;
  const H = size.h;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");

  // Poster paper: deep plum, so gaps read as a designed frame.
  ctx.fillStyle = "#1a0b2e";
  ctx.fillRect(0, 0, W, H);

  for (const slot of visiblePanels(state)) {
    drawPanel(ctx, state, slot, W, H, showSelection);
  }

  drawCaption(ctx, state, W, H);

  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vig.addColorStop(0, "rgba(8,0,18,0)");
    vig.addColorStop(1, "rgba(8,0,18,0.42)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.grain) {
    const tile = grainCanvas();
    const pattern = ctx.createPattern(tile, "repeat");
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return canvas;
}

/** Render at full export size and hand back a PNG blob. */
export function exportCoverPng(state) {
  const canvas = document.createElement("canvas");
  renderCover(canvas, state, false);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export produced no data"))),
      "image/png",
    );
  });
}

/** Which visible panel (if any) contains poster point (x, y) in 0..1 coords. */
export function panelAt(state, x, y) {
  const slots = visiblePanels(state);
  // Later panels are drawn on top, so check in reverse.
  for (let i = slots.length - 1; i >= 0; i--) {
    const { rect } = slots[i];
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const rot = -((rect.rot ?? 0) * DEG);
    const dx = x - cx;
    const dy = y - cy;
    const lx = dx * Math.cos(rot) - dy * Math.sin(rot) + cx;
    const ly = dx * Math.sin(rot) + dy * Math.cos(rot) + cy;
    if (lx >= rect.x && lx <= rect.x + rect.w && ly >= rect.y && ly <= rect.y + rect.h) {
      return slots[i].index;
    }
  }
  return -1;
}
