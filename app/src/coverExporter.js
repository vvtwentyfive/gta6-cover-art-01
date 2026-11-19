/* coverExporter.js — render the cover at a post size and save it.
 * exportCoverPng(state, width, height) draws the exact same cover the
 * preview shows onto an offscreen canvas at the requested size (no
 * selection outline, no UI) and resolves with a PNG Blob. The studio
 * then downloads it with a filename that names the size. */
"use strict";

const EXPORT_SIZES = {
  "1080x1080": { width: 1080, height: 1080, label: "Square 1080 × 1080" },
  "1080x1350": { width: 1080, height: 1350, label: "Portrait 1080 × 1350" },
  "1920x1080": { width: 1920, height: 1080, label: "Wide 1920 × 1080" },
  "1080x1920": { width: 1080, height: 1920, label: "Story 1080 × 1920" },
};

function exportCoverPng(state, width, height) {
  return new Promise((resolve, reject) => {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const exportState = Object.assign({}, state, { showSelection: false });
    renderCover(offscreen, exportState);
    offscreen.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the PNG."));
    }, "image/png");
  });
}

function downloadCoverBlob(blob, width, height) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sunset-cover-" + width + "x" + height + ".png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportAndDownloadCover(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  if (!size) return Promise.reject(new Error("Unknown export size: " + sizeKey));
  return exportCoverPng(state, size.width, size.height).then((blob) => {
    downloadCoverBlob(blob, size.width, size.height);
    return { blob: blob, width: size.width, height: size.height };
  });
}
