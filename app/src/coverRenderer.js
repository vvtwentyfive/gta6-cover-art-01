/* coverRenderer.js — draws the whole cover onto any canvas.
 * renderCover(canvas, state) paints the layout's panels (each photo
 * cover-fit, draggable and zoomable), the sunset grade, film grain,
 * vignette and the bold caption lettering. The same function draws
 * the live preview and the exported PNG, so what you see is what
 * you get at every export size. */
"use strict";

let cachedGrainPattern = null;

function createGrainPattern() {
  if (cachedGrainPattern) return cachedGrainPattern;
  const size = 140;
  const grain = document.createElement("canvas");
  grain.width = size;
  grain.height = size;
  const gctx = grain.getContext("2d");
  const data = gctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  gctx.putImageData(data, 0, 0);
  cachedGrainPattern = grain;
  return grain;
}

function drawPanelPhoto(ctx, image, rect, panel) {
  const pw = rect.w;
  const ph = rect.h;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const zoom = panel.zoom || 1;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (pw - dw) / 2 + (panel.offsetX || 0) * pw;
  const dy = rect.y + (ph - dh) / 2 + (panel.offsetY || 0) * ph;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, pw, ph);
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}

function drawPanelPlaceholder(ctx, rect, index) {
  ctx.save();
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, "#3a1c52");
  grad.addColorStop(1, "#1a0c28");
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "rgba(255,246,236,0.65)";
  ctx.font = Math.round(Math.min(rect.w, rect.h) * 0.09) + "px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PANEL " + (index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

function applySunsetGrade(ctx, width, height, grade) {
  ctx.save();
  let wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, grade.skyWash);
  wash.addColorStop(0.55, "rgba(0,0,0,0)");
  wash.addColorStop(1, grade.shadowLift);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  const horizon = ctx.createRadialGradient(
    width * 0.5, height * 0.62, 0,
    width * 0.5, height * 0.62, width * 0.75
  );
  horizon.addColorStop(0, grade.horizonGlow);
  horizon.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyFilmGrain(ctx, width, height) {
  const grain = createGrainPattern();
  const pattern = ctx.createPattern(grain, "repeat");
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyVignette(ctx, width, height) {
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(10,4,20,0.42)");
  ctx.save();
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawPanelKeylines(ctx, panels, width, height, accent) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,246,236,0.92)";
  ctx.lineWidth = Math.max(2, width * 0.004);
  for (const p of panels) {
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
  ctx.restore();
}

function fitAntonSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = size + "px Anton, sans-serif";
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = size + "px Anton, sans-serif";
  }
  return size;
}

function drawCoverCaption(ctx, width, height, state, grade) {
  const title = (state.title || "").trim() || "VICE CITY";
  const script = (state.script || "").trim();
  const subtitle = (state.subtitle || "").trim();
  const scale = state.titleScale || 1;

  ctx.save();
  // Scrim so lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, height * 0.62, 0, height);
  scrim.addColorStop(0, "rgba(12,4,24,0)");
  scrim.addColorStop(1, "rgba(12,4,24,0.78)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.62, width, height * 0.38);

  // Diagonal accent stripes, top-right corner.
  ctx.save();
  ctx.translate(width, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-height * 0.35, -height * 0.10, height * 0.7, height * 0.018);
  ctx.fillStyle = "rgba(255,246,236,0.9)";
  ctx.fillRect(-height * 0.35, -height * 0.075, height * 0.7, height * 0.008);
  ctx.restore();

  const cx = width / 2;
  const titleSize = fitAntonSize(
    ctx, title, width * 0.92, width * 0.115 * scale
  );
  const titleY = height * 0.90;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (script) {
    ctx.font = Math.round(width * 0.052 * scale) + "px Pacifico, cursive";
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = width * 0.012;
    ctx.shadowOffsetY = width * 0.004;
    ctx.fillText(script, cx, titleY - titleSize * 1.02);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Bold Anton title: dark outline, sunset gradient fill, hard shadow.
  ctx.font = titleSize + "px Anton, sans-serif";
  try { ctx.letterSpacing = Math.round(width * 0.004) + "px"; } catch (e) { /* older canvas */ }
  const titleGrad = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
  titleGrad.addColorStop(0, "#fff6ec");
  titleGrad.addColorStop(0.55, "#ffd9a0");
  titleGrad.addColorStop(1, grade.accent);
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(16,4,28,0.95)";
  ctx.lineWidth = Math.max(3, titleSize * 0.14);
  ctx.strokeText(title, cx, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, cx, titleY);
  try { ctx.letterSpacing = "0px"; } catch (e) { /* older canvas */ }

  // Accent underline.
  const underlineW = Math.min(width * 0.5, ctx.measureText(title).width * 0.62);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(cx - underlineW / 2, titleY + height * 0.018, underlineW, Math.max(3, height * 0.006));

  if (subtitle) {
    ctx.font = "700 " + Math.round(width * 0.028 * scale) + "px system-ui, sans-serif";
    try { ctx.letterSpacing = Math.round(width * 0.006) + "px"; } catch (e) { /* older canvas */ }
    ctx.fillStyle = "rgba(255,246,236,0.95)";
    ctx.fillText(subtitle, cx, titleY + height * 0.055);
    try { ctx.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
  }
  ctx.restore();
}

function renderCover(canvas, state) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const grade = gradeFor(state.grade);
  const panels = layoutPanelsFor(state.layout).map((p) => ({
    x: p.x * width,
    y: p.y * height,
    w: p.w * width,
    h: p.h * height,
  }));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#160a20";
  ctx.fillRect(0, 0, width, height);

  panels.forEach((rect, i) => {
    const panelState = (state.panels && state.panels[i]) || { photoIndex: 0, offsetX: 0, offsetY: 0, zoom: 1 };
    const photo = state.photos && state.photos[panelState.photoIndex];
    if (photo && photo.image) {
      drawPanelPhoto(ctx, photo.image, rect, panelState);
    } else {
      drawPanelPlaceholder(ctx, rect, i);
    }
  });

  applySunsetGrade(ctx, width, height, grade);
  drawPanelKeylines(ctx, panels, width, height, grade.accent);
  if (state.grain) applyFilmGrain(ctx, width, height);
  if (state.vignette) applyVignette(ctx, width, height);
  drawCoverCaption(ctx, width, height, state, grade);

  if (state.showSelection && typeof state.selectedPanel === "number" && state.selectedPanel >= 0) {
    const rect = panels[state.selectedPanel];
    if (rect) {
      ctx.save();
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = Math.max(3, width * 0.005);
      ctx.setLineDash([Math.max(8, width * 0.012), Math.max(6, width * 0.008)]);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.restore();
    }
  }
}
