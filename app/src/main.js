// Sunset Cover Studio — boot: load the display fonts, build the editor, and
// expose a small automation handle so a headless driver can export a cover
// without a download prompt (window.sunsetCover.exportPng()).

import { createState } from "./state.js";
import { createEditor } from "./editor.js";

const canvas = document.getElementById("previewCanvas");
const state = createState();
const editor = createEditor(state, canvas);

// The vendored display faces must be ready before the first paint, or the
// caption falls back to a system face for a frame.
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('64px Anton'),
      document.fonts.load('32px Pacifico'),
    ]);
  } catch (err) {
    console.warn("Display fonts did not load in time:", err);
  }
  editor.requestRender();
}

window.sunsetCover = {
  state,
  editor,
  exportPng: () => editor.exportPng(),
  sizes: ["1080x1080", "1080x1350", "1920x1080", "1080x1920"],
  layouts: ["grid4", "hero3", "full", "grid9", "strip"],
  grades: ["vice", "neon", "dusk", "heat", "noir"],
};

boot();
