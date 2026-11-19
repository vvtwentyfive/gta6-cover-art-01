// Canvas renderer: draws the multi-panel poster, colour grade, grain,
// vignette and caption onto any canvas at any size.
import { layoutOf, gradeOf, photoById } from './state.js';

let grainCanvas = null;

function makeGrain(size = 160) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function drawPanel(ctx, panel, photo, rect, gap) {
  const [fx, fy, fw, fh] = rect;
  const x = fx, y = fy, w = fw, h = fh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo || !photo.img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3d1c5c');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('＋ add a photo', x + w / 2, y + h / 2);
  } else {
    const img = photo.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const base = Math.max(w / iw, h / ih);
    const scale = base * (panel.zoom || 1);
    const pw = iw * scale;
    const ph = ih * scale;
    const cx = x + w / 2 + (panel.ox || 0) * w;
    const cy = y + h / 2 + (panel.oy || 0) * h;
    ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  }
  ctx.restore();
  if (gap > 0) {
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = gap;
    ctx.strokeRect(x, y, w, h);
  }
}

/** Render the whole cover onto `canvas` (its own width/height) from state. */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = layoutOf(state);
  const grade = gradeOf(state);
  const gap = state.border ? Math.max(4, Math.round(W * 0.008)) : 0;

  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, W, H);

  layout.rects.forEach((r, i) => {
    const rect = [r[0] * W, r[1] * H, r[2] * W, r[3] * H];
    const panel = state.panels[i];
    const photo = panel && panel.photoId ? photoById(state, panel.photoId) : null;
    drawPanel(ctx, panel || { ox: 0, oy: 0, zoom: 1 }, photo, rect, gap);
  });

  // Colour grade: warm sunset wash, stronger at the bottom.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, hexA(grade.top, 0.10));
  wash.addColorStop(0.55, hexA(grade.mid, 0.16));
  wash.addColorStop(1, hexA(grade.bottom, 0.34));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // Caption band: dark gradient rising from the foot so the title stays legible.
  const bandH = H * 0.30;
  const band = ctx.createLinearGradient(0, H - bandH, 0, H);
  band.addColorStop(0, 'rgba(10,4,20,0)');
  band.addColorStop(1, 'rgba(10,4,20,0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H - bandH, W, bandH);

  if (state.grain) {
    if (!grainCanvas) grainCanvas = makeGrain();
    const pat = ctx.createPattern(grainCanvas, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // Title + subtitle, Anton for the title, Pacifico for the subtitle.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    // Shrink the title until it fits the canvas width with a small margin.
    let size = Math.round(W * 0.115 * (state.titleScale || 1));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const fit = (s) => { ctx.font = `${s}px Anton, 'Arial Black', sans-serif`; return ctx.measureText(title).width; };
    while (size > 18 && fit(size) > W * 0.92) size = Math.round(size * 0.92);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    const ty = H - H * 0.075;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, W / 2, ty);
    ctx.fillStyle = grade.title;
    ctx.fillText(title, W / 2, ty);
    // Accent underline.
    const tw = ctx.measureText(title).width;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(W / 2 - tw * 0.32, ty + size * 0.16, tw * 0.64, Math.max(4, size * 0.07));
  }
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = Math.max(16, Math.round(W * 0.032));
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(sub, W / 2, H - H * 0.018);
    ctx.shadowBlur = 0;
  }
  return canvas;
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Render to a fresh offscreen canvas at the requested export size. */
export function renderExport(state, width, height) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return renderCover(c, state);
}
