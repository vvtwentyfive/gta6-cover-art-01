// Sunset Cover Studio — editor: wires the controls, the photo tray, dragging,
// file input and drag-and-drop, and the PNG export button to the engine.

import { GRADES, LAYOUTS, layoutById, sizeById } from "./state.js";
import { exportCoverPng, panelAt, renderCover } from "./engine.js";

const SAMPLE_PHOTOS = [
  { src: "samples/woman-boulevard.jpg", name: "woman-boulevard" },
  { src: "samples/man-rooftop.jpg", name: "man-rooftop" },
];

export function createEditor(state, canvas) {
  const $ = (id) => document.getElementById(id);
  const els = {
    tray: $("photoTray"),
    fileInput: $("fileInput"),
    loadSamples: $("loadSamplesBtn"),
    layoutPicker: $("layoutPicker"),
    gradePicker: $("gradePicker"),
    grain: $("grainToggle"),
    vignette: $("vignetteToggle"),
    title: $("titleInput"),
    subtitle: $("subtitleInput"),
    gradient: $("gradientToggle"),
    outline: $("outlineToggle"),
    zoom: $("zoomSlider"),
    zoomValue: $("zoomValue"),
    fitBtn: $("fitBtn"),
    resetPanel: $("resetPanelBtn"),
    panelHint: $("panelHint"),
    exportBtn: $("exportBtn"),
    dropZone: $("dropZone"),
  };

  let renderQueued = false;

  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderCover(canvas, state, true);
      syncPanelControls();
    });
  }

  // --- photos --------------------------------------------------------------

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, name: file.name.replace(/\.[^.]+$/, "") });
      img.onerror = () => reject(new Error(`Could not read ${file.name}`));
      img.src = url;
    });
  }

  function loadImageUrl(src, name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, name });
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  async function addPhotos(files) {
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const photo = await loadImageFile(file);
        state.photos.push(photo);
        added++;
      } catch (err) {
        console.warn(err.message);
      }
    }
    if (added > 0) {
      state.selectedPhoto = state.photos.length - 1;
      autoFillEmptyPanels();
      renderTray();
      requestRender();
    }
    return added;
  }

  async function loadSamples() {
    for (const sample of SAMPLE_PHOTOS) {
      if (state.photos.some((p) => p.name === sample.name)) continue;
      try {
        state.photos.push(await loadImageUrl(sample.src, sample.name));
      } catch (err) {
        console.warn(err.message);
      }
    }
    if (state.photos.length > 0) {
      if (state.selectedPhoto < 0) state.selectedPhoto = 0;
      autoFillEmptyPanels();
      renderTray();
      requestRender();
    }
  }

  /** First photo fills every empty visible panel; extra photos spread across them. */
  function autoFillEmptyPanels() {
    const layout = layoutById(state.layoutId);
    for (let i = 0; i < layout.panels; i++) {
      const panel = state.panels[i];
      if (panel.photo < 0 && state.photos.length > 0) {
        panel.photo = Math.min(i, state.photos.length - 1);
      }
    }
  }

  function renderTray() {
    els.tray.innerHTML = "";
    if (state.photos.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tray-empty";
      empty.textContent = "No photos yet — add your own or load the demo photos.";
      els.tray.appendChild(empty);
      return;
    }
    state.photos.forEach((photo, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tray-thumb" + (i === state.selectedPhoto ? " is-selected" : "");
      btn.title = photo.name;
      const thumb = document.createElement("img");
      thumb.src = photo.img.src;
      thumb.alt = photo.name;
      btn.appendChild(thumb);
      btn.addEventListener("click", () => {
        state.selectedPhoto = i;
        const panel = state.panels[state.selectedPanel];
        if (panel) panel.photo = i;
        renderTray();
        requestRender();
      });
      els.tray.appendChild(btn);
    });
  }

  // --- pickers ---------------------------------------------------------------

  function buildLayoutPicker() {
    for (const layout of LAYOUTS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "layout-btn" + (layout.id === state.layoutId ? " is-active" : "");
      btn.dataset.layout = layout.id;
      const diagram = document.createElement("span");
      diagram.className = "layout-diagram";
      diagram.setAttribute("aria-hidden", "true");
      if (layout.diagram === "2x2") {
        diagram.style.gridTemplateColumns = "1fr 1fr";
        diagram.style.gridTemplateRows = "1fr 1fr";
        for (let i = 0; i < 4; i++) diagram.appendChild(document.createElement("i"));
      } else if (layout.diagram === "hero") {
        diagram.style.gridTemplateColumns = "1.6fr 1fr";
        diagram.style.gridTemplateRows = "1fr 1fr 1fr";
        const hero = document.createElement("i");
        hero.style.gridRow = "1 / 4";
        diagram.appendChild(hero);
        for (let i = 0; i < 3; i++) diagram.appendChild(document.createElement("i"));
      } else if (layout.diagram === "full") {
        diagram.appendChild(document.createElement("i"));
      } else if (layout.diagram === "3x3") {
        diagram.style.gridTemplateColumns = "1fr 1fr 1fr";
        diagram.style.gridTemplateRows = "1fr 1fr 1fr";
        for (let i = 0; i < 9; i++) diagram.appendChild(document.createElement("i"));
      } else {
        diagram.style.gridTemplateColumns = "repeat(5, 1fr)";
        for (let i = 0; i < 5; i++) {
          const bar = document.createElement("i");
          bar.style.transform = `rotate(${i % 2 === 0 ? -6 : 6}deg)`;
          diagram.appendChild(bar);
        }
      }
      btn.appendChild(diagram);
      btn.appendChild(document.createTextNode(layout.name));
      btn.addEventListener("click", () => {
        state.layoutId = layout.id;
        state.selectedPanel = 0;
        autoFillEmptyPanels();
        document.querySelectorAll(".layout-btn").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.layout === layout.id),
        );
        requestRender();
      });
      els.layoutPicker.appendChild(btn);
    }
  }

  function buildGradePicker() {
    for (const grade of GRADES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "grade-btn" + (grade.id === state.gradeId ? " is-active" : "");
      btn.dataset.grade = grade.id;
      const swatch = document.createElement("span");
      swatch.className = "grade-swatch";
      swatch.style.background = `linear-gradient(90deg, ${grade.stops
        .map(([p, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round(p * 100)}%`)
        .join(", ")})`;
      const label = document.createElement("span");
      label.textContent = grade.name;
      const note = document.createElement("span");
      note.className = "grade-note";
      note.textContent = grade.note;
      btn.append(swatch, label, note);
      btn.addEventListener("click", () => {
        state.gradeId = grade.id;
        document.querySelectorAll(".grade-btn").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.grade === grade.id),
        );
        requestRender();
      });
      els.gradePicker.appendChild(btn);
    }
  }

  function buildSizePicker() {
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sizeId = btn.dataset.size;
        document.querySelectorAll(".size-btn").forEach((b) =>
          b.classList.toggle("is-active", b === btn),
        );
        requestRender();
      });
    });
  }

  // --- panel controls --------------------------------------------------------

  function syncPanelControls() {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    els.zoom.value = String(panel.zoom);
    els.zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
    els.fitBtn.textContent = `Fit: ${panel.fit === "cover" ? "fill" : "fit"}`;
    const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;
    els.panelHint.textContent = photo
      ? `Panel ${state.selectedPanel + 1} — ${photo.name}. Drag to move, scroll to zoom.`
      : `Panel ${state.selectedPanel + 1} is empty — pick a photo below to fill it.`;
  }

  function bindPanelControls() {
    els.zoom.addEventListener("input", () => {
      const panel = state.panels[state.selectedPanel];
      panel.zoom = Number(els.zoom.value);
      els.zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
      requestRender();
    });
    els.fitBtn.addEventListener("click", () => {
      const panel = state.panels[state.selectedPanel];
      panel.fit = panel.fit === "cover" ? "contain" : "cover";
      requestRender();
    });
    els.resetPanel.addEventListener("click", () => {
      state.panels[state.selectedPanel] = blankPanel();
      if (state.selectedPhoto >= 0) state.panels[state.selectedPanel].photo = state.selectedPhoto;
      requestRender();
    });
  }

  // --- caption + effects -------------------------------------------------------

  function bindTextControls() {
    els.title.addEventListener("input", () => {
      state.title = els.title.value;
      requestRender();
    });
    els.subtitle.addEventListener("input", () => {
      state.subtitle = els.subtitle.value;
      requestRender();
    });
    els.gradient.addEventListener("change", () => {
      state.titleGradient = els.gradient.checked;
      requestRender();
    });
    els.outline.addEventListener("change", () => {
      state.titleOutline = els.outline.checked;
      requestRender();
    });
    els.grain.addEventListener("change", () => {
      state.grain = els.grain.checked;
      requestRender();
    });
    els.vignette.addEventListener("change", () => {
      state.vignette = els.vignette.checked;
      requestRender();
    });
  }

  // --- canvas pointer: select + drag to pan, wheel to zoom -------------------

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const size = sizeById(state.sizeId);
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1,
      y: ((event.clientY - rect.top) / rect.height) * 1,
      size,
    };
  }

  function bindCanvas() {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener("pointerdown", (event) => {
      const { x, y } = canvasPoint(event);
      const hit = panelAt(state, x, y);
      if (hit < 0) return;
      state.selectedPanel = hit;
      const panel = state.panels[hit];
      if (state.selectedPhoto >= 0 && panel.photo < 0) {
        panel.photo = state.selectedPhoto;
      } else if (state.selectedPhoto >= 0 && event.shiftKey) {
        panel.photo = state.selectedPhoto;
      }
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      requestRender();
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const panel = state.panels[state.selectedPanel];
      if (!panel) return;
      panel.ox += (event.clientX - lastX) / rect.width;
      panel.oy += (event.clientY - lastY) / rect.height;
      lastX = event.clientX;
      lastY = event.clientY;
      requestRender();
    });

    const endDrag = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const { x, y } = canvasPoint(event);
      const hit = panelAt(state, x, y);
      if (hit < 0) return;
      state.selectedPanel = hit;
      const panel = state.panels[hit];
      panel.zoom = Math.min(3, Math.max(0.5, panel.zoom * (event.deltaY < 0 ? 1.12 : 0.89)));
      requestRender();
    }, { passive: false });
  }

  // --- file input + drag and drop ---------------------------------------------

  function bindFiles() {
    els.fileInput.addEventListener("change", () => {
      addPhotos([...els.fileInput.files]);
      els.fileInput.value = "";
    });
    els.loadSamples.addEventListener("click", loadSamples);
    const zone = els.dropZone;
    ["dragenter", "dragover"].forEach((name) =>
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.add("drag-over");
      }),
    );
    ["dragleave", "drop"].forEach((name) =>
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.remove("drag-over");
      }),
    );
    zone.addEventListener("drop", (event) => {
      addPhotos([...(event.dataTransfer?.files ?? [])]);
    });
    document.addEventListener("dragover", (event) => event.preventDefault());
    document.addEventListener("drop", (event) => event.preventDefault());
  }

  // --- export ------------------------------------------------------------------

  async function exportPng() {
    els.exportBtn.disabled = true;
    els.exportBtn.textContent = "Exporting…";
    try {
      const blob = await exportCoverPng(state);
      const size = sizeById(state.sizeId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sunset-cover-${size.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return blob;
    } finally {
      els.exportBtn.disabled = false;
      els.exportBtn.textContent = "Export PNG ↓";
    }
  }

  els.exportBtn.addEventListener("click", () => {
    exportPng().catch((err) => console.error(err));
  });

  // --- boot ----------------------------------------------------------------------

  buildLayoutPicker();
  buildGradePicker();
  buildSizePicker();
  bindPanelControls();
  bindTextControls();
  bindCanvas();
  bindFiles();
  renderTray();
  loadSamples();

  return {
    requestRender,
    addPhotos,
    loadSamples,
    exportPng,
    state,
  };
}
