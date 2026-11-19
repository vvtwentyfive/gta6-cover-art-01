/* coverStudio.js — wires the Sunset Cover Studio UI together.
 * Owns the cover state (layout, grade, caption, one photo + position
 * + zoom per panel), the choice buttons, photo intake (picker, drag &
 * drop, paste), drag-to-position and scroll-to-zoom on the preview,
 * and the export buttons. The preview re-renders on every change. */
"use strict";

const coverState = {
  layout: "hero",
  grade: "neon-sunset",
  grain: true,
  vignette: true,
  script: "Vice",
  title: "VICE CITY",
  subtitle: "SUNSET DRIVE · LEONIDA",
  titleScale: 1,
  photos: [],
  panels: [],
  selectedPanel: 0,
  showSelection: true,
  previewSize: "1080x1080",
};

const canvas = document.getElementById("coverCanvas");
const statusLine = document.getElementById("statusLine");
const panelPhotoSelect = document.getElementById("panelPhotoSelect");
const zoomSlider = document.getElementById("zoomSlider");
const zoomValue = document.getElementById("zoomValue");

function setStatus(message) {
  statusLine.textContent = message;
}

function rebuildPanelsForLayout() {
  const count = layoutPanelsFor(coverState.layout).length;
  const next = [];
  for (let i = 0; i < count; i++) {
    const previous = coverState.panels[i];
    next.push(previous || {
      photoIndex: coverState.photos.length ? i % coverState.photos.length : 0,
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
    });
  }
  coverState.panels = next;
  if (coverState.selectedPanel >= count) coverState.selectedPanel = 0;
}

function renderPreview() {
  renderCover(canvas, coverState);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = coverState.panels[coverState.selectedPanel];
  if (!panel) return;
  panelPhotoSelect.value = String(panel.photoIndex);
  zoomSlider.value = String(Math.round((panel.zoom || 1) * 100));
  zoomValue.textContent = Math.round((panel.zoom || 1) * 100) + "%";
}

function refreshPhotoOptions() {
  panelPhotoSelect.innerHTML = "";
  coverState.photos.forEach((photo, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = photo.label;
    panelPhotoSelect.appendChild(option);
  });
  syncPanelControls();
}

function addPhotoToStudio(photo, assignToSelected) {
  coverState.photos.push(photo);
  refreshPhotoOptions();
  if (assignToSelected) {
    const panel = coverState.panels[coverState.selectedPanel];
    if (panel) panel.photoIndex = coverState.photos.length - 1;
  }
  renderPreview();
  return coverState.photos.length - 1;
}

function buildChoiceButtons(containerId, order, table, currentKey, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  order.forEach((key) => {
    const entry = table[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.setAttribute("aria-pressed", String(key === currentKey));
    button.title = entry.blurb || entry.label;
    if (entry.swatch) {
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = entry.swatch;
      button.appendChild(swatch);
    }
    button.appendChild(document.createTextNode(entry.label));
    button.addEventListener("click", () => {
      onPick(key);
      container.querySelectorAll(".choice-btn").forEach((b) => {
        b.setAttribute("aria-pressed", "false");
      });
      button.setAttribute("aria-pressed", "true");
    });
    container.appendChild(button);
  });
}

function buildLayoutChoices() {
  buildChoiceButtons("layoutChoices", COVER_LAYOUT_ORDER, COVER_LAYOUTS,
    coverState.layout, (key) => {
      coverState.layout = key;
      rebuildPanelsForLayout();
      renderPreview();
      setStatus("Layout: " + COVER_LAYOUTS[key].label + " — " + COVER_LAYOUTS[key].blurb + ".");
    });
}

function buildGradeChoices() {
  buildChoiceButtons("gradeChoices", COVER_GRADE_ORDER, COVER_GRADES,
    coverState.grade, (key) => {
      coverState.grade = key;
      renderPreview();
      setStatus("Grade: " + COVER_GRADES[key].label + ".");
    });
}

function setPreviewSize(sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  if (!size) return;
  coverState.previewSize = sizeKey;
  canvas.width = size.width;
  canvas.height = size.height;
  renderPreview();
}

function panelAtPoint(canvasX, canvasY) {
  const panels = layoutPanelsFor(coverState.layout);
  const fx = canvasX / canvas.width;
  const fy = canvasY / canvas.height;
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return -1;
}

function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

let dragState = null;

function attachCanvasGestures() {
  canvas.addEventListener("pointerdown", (event) => {
    const point = canvasPointFromEvent(event);
    const index = panelAtPoint(point.x, point.y);
    if (index < 0) return;
    coverState.selectedPanel = index;
    dragState = { panelIndex: index, lastX: point.x, lastY: point.y, moved: false };
    canvas.setPointerCapture(event.pointerId);
    renderPreview();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const point = canvasPointFromEvent(event);
    const panel = coverState.panels[dragState.panelIndex];
    const rect = layoutPanelsFor(coverState.layout)[dragState.panelIndex];
    if (!panel || !rect) return;
    const dx = point.x - dragState.lastX;
    const dy = point.y - dragState.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 0) dragState.moved = true;
    panel.offsetX += dx / (rect.w * canvas.width);
    panel.offsetY += dy / (rect.h * canvas.height);
    panel.offsetX = Math.max(-0.6, Math.min(0.6, panel.offsetX));
    panel.offsetY = Math.max(-0.6, Math.min(0.6, panel.offsetY));
    dragState.lastX = point.x;
    dragState.lastY = point.y;
    renderPreview();
  });
  const endDrag = () => {
    if (dragState && dragState.moved) {
      setStatus("Panel " + (dragState.panelIndex + 1) + " repositioned — drag again or scroll to zoom.");
    }
    dragState = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const panel = coverState.panels[coverState.selectedPanel];
    if (!panel) return;
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * factor));
    renderPreview();
    setStatus("Zoom: " + Math.round(panel.zoom * 100) + "% on panel " + (coverState.selectedPanel + 1) + ".");
  }, { passive: false });
}

function attachPhotoIntake() {
  const picker = document.getElementById("photoPicker");
  picker.addEventListener("change", () => {
    const file = picker.files && picker.files[0];
    if (!file) return;
    loadPhotoFromFile(file).then((image) => {
      const index = addPhotoToStudio({ id: "upload-" + Date.now(), label: file.name, image }, true);
      setStatus("Loaded “" + file.name + "” into panel " + (coverState.selectedPanel + 1) + ".");
      return index;
    }).catch((err) => setStatus(err.message));
    picker.value = "";
  });

  const dropZone = document.getElementById("dropZone");
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = firstImageFileFromDataTransfer(event.dataTransfer);
    if (!file) { setStatus("Drop an image file to use it as a photo."); return; }
    loadPhotoFromFile(file).then((image) => {
      addPhotoToStudio({ id: "upload-" + Date.now(), label: file.name, image }, true);
      setStatus("Dropped “" + file.name + "” into panel " + (coverState.selectedPanel + 1) + ".");
    }).catch((err) => setStatus(err.message));
  });

  document.addEventListener("paste", (event) => {
    const file = firstImageFileFromClipboard(event.clipboardData);
    if (!file) return;
    loadPhotoFromFile(file).then((image) => {
      addPhotoToStudio({ id: "paste-" + Date.now(), label: "Pasted photo", image }, true);
      setStatus("Pasted photo loaded into panel " + (coverState.selectedPanel + 1) + ".");
    }).catch((err) => setStatus(err.message));
  });

  document.getElementById("sampleAButton").addEventListener("click", () => {
    loadSamplePhoto("neon-street").then((photo) => {
      addPhotoToStudio(photo, true);
      setStatus("Sample “Neon Street” loaded into panel " + (coverState.selectedPanel + 1) + ".");
    });
  });
  document.getElementById("sampleBButton").addEventListener("click", () => {
    loadSamplePhoto("ocean-drive").then((photo) => {
      addPhotoToStudio(photo, true);
      setStatus("Sample “Ocean Drive” loaded into panel " + (coverState.selectedPanel + 1) + ".");
    });
  });
}

function attachPanelControls() {
  panelPhotoSelect.addEventListener("change", () => {
    const panel = coverState.panels[coverState.selectedPanel];
    if (!panel) return;
    panel.photoIndex = Number(panelPhotoSelect.value);
    renderPreview();
    setStatus("Panel " + (coverState.selectedPanel + 1) + " now shows “" +
      coverState.photos[panel.photoIndex].label + "”.");
  });
  zoomSlider.addEventListener("input", () => {
    const panel = coverState.panels[coverState.selectedPanel];
    if (!panel) return;
    panel.zoom = Number(zoomSlider.value) / 100;
    zoomValue.textContent = zoomSlider.value + "%";
    renderPreview();
  });
  document.getElementById("resetPanelButton").addEventListener("click", () => {
    const panel = coverState.panels[coverState.selectedPanel];
    if (!panel) return;
    panel.offsetX = 0;
    panel.offsetY = 0;
    panel.zoom = 1;
    renderPreview();
    setStatus("Panel " + (coverState.selectedPanel + 1) + " reset to fit.");
  });
  document.getElementById("fitPanelButton").addEventListener("click", () => {
    const panel = coverState.panels[coverState.selectedPanel];
    if (!panel) return;
    panel.offsetX = 0;
    panel.offsetY = 0;
    panel.zoom = 1;
    renderPreview();
    setStatus("Panel " + (coverState.selectedPanel + 1) + " fitted.");
  });
  document.getElementById("fillAllButton").addEventListener("click", () => {
    const source = coverState.panels[coverState.selectedPanel];
    if (!source) return;
    coverState.panels.forEach((panel) => { panel.photoIndex = source.photoIndex; });
    renderPreview();
    setStatus("All panels now show “" + coverState.photos[source.photoIndex].label + "”.");
  });
  document.getElementById("shuffleButton").addEventListener("click", () => {
    const layouts = COVER_LAYOUT_ORDER.filter((l) => l !== coverState.layout);
    const grades = COVER_GRADE_ORDER.filter((g) => g !== coverState.grade);
    coverState.layout = layouts[Math.floor(Math.random() * layouts.length)];
    coverState.grade = grades[Math.floor(Math.random() * grades.length)];
    rebuildPanelsForLayout();
    buildLayoutChoices();
    buildGradeChoices();
    renderPreview();
    setStatus("Shuffled to " + COVER_LAYOUTS[coverState.layout].label + " + " +
      COVER_GRADES[coverState.grade].label + ".");
  });
}

function attachCaptionControls() {
  const scriptInput = document.getElementById("scriptInput");
  const titleInput = document.getElementById("titleInput");
  const subtitleInput = document.getElementById("subtitleInput");
  const titleSizeSlider = document.getElementById("titleSizeSlider");
  const titleSizeValue = document.getElementById("titleSizeValue");
  scriptInput.addEventListener("input", () => { coverState.script = scriptInput.value; renderPreview(); });
  titleInput.addEventListener("input", () => { coverState.title = titleInput.value; renderPreview(); });
  subtitleInput.addEventListener("input", () => { coverState.subtitle = subtitleInput.value; renderPreview(); });
  titleSizeSlider.addEventListener("input", () => {
    coverState.titleScale = Number(titleSizeSlider.value) / 100;
    titleSizeValue.textContent = titleSizeSlider.value + "%";
    renderPreview();
  });
  document.getElementById("grainToggle").addEventListener("change", (event) => {
    coverState.grain = event.target.checked;
    renderPreview();
  });
  document.getElementById("vignetteToggle").addEventListener("change", (event) => {
    coverState.vignette = event.target.checked;
    renderPreview();
  });
}

function attachExportButtons() {
  document.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => {
      const sizeKey = button.getAttribute("data-export");
      setStatus("Exporting " + EXPORT_SIZES[sizeKey].label + "…");
      exportAndDownloadCover(coverState, sizeKey).then((result) => {
        setPreviewSize(sizeKey);
        setStatus("Exported " + result.width + " × " + result.height +
          " PNG — check your downloads. Preview now shows that size.");
      }).catch((err) => setStatus(err.message));
    });
  });
}

function loadDefaultSamples() {
  return loadAllSamplePhotos().then((photos) => {
    coverState.photos = photos;
    refreshPhotoOptions();
    rebuildPanelsForLayout();
    renderPreview();
    setStatus("Ready — sample photos loaded. Pick a photo, a layout and a grade, then export a PNG.");
  }).catch(() => {
    rebuildPanelsForLayout();
    renderPreview();
    setStatus("Sample photos could not load — choose your own photo to start.");
  });
}

function loadCoverFonts() {
  if (!document.fonts || !document.fonts.load) return;
  Promise.all([
    document.fonts.load("40px Anton"),
    document.fonts.load("40px Pacifico"),
  ]).then(() => renderPreview()).catch(() => { /* fall back to system fonts */ });
}

buildLayoutChoices();
buildGradeChoices();
attachCanvasGestures();
attachPhotoIntake();
attachPanelControls();
attachCaptionControls();
attachExportButtons();
rebuildPanelsForLayout();
renderPreview();
loadDefaultSamples();
loadCoverFonts();
