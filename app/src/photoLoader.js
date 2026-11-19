/* photoLoader.js — get photos into the studio without uploading them.
 * Photos come from the file picker, drag & drop, or the clipboard, and
 * are read with FileReader / createImageBitmap on the user's machine.
 * The two code-drawn sample illustrations ship under samples/ and load
 * the same way, so the studio opens with a finished-looking cover. */
"use strict";

const SAMPLE_PHOTOS = [
  { id: "neon-street", label: "Neon Street", src: "samples/neon-street.png" },
  { id: "ocean-drive", label: "Ocean Drive", src: "samples/ocean-drive.png" },
];

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image: " + src));
    img.src = src;
  });
}

function loadPhotoFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      reject(new Error("That file is not an image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      loadImageElement(reader.result).then(resolve, reject);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function loadSamplePhoto(sampleId) {
  const sample = SAMPLE_PHOTOS.find((s) => s.id === sampleId);
  if (!sample) return Promise.reject(new Error("Unknown sample: " + sampleId));
  return loadImageElement(sample.src).then((img) => ({
    id: sample.id,
    label: sample.label,
    image: img,
  }));
}

function loadAllSamplePhotos() {
  return Promise.all(SAMPLE_PHOTOS.map((s) => loadSamplePhoto(s.id)));
}

function firstImageFileFromDataTransfer(dataTransfer) {
  if (!dataTransfer || !dataTransfer.files) return null;
  for (const file of dataTransfer.files) {
    if (file.type && file.type.indexOf("image/") === 0) return file;
  }
  return null;
}

function firstImageFileFromClipboard(clipboardData) {
  if (!clipboardData || !clipboardData.items) return null;
  for (const item of clipboardData.items) {
    if (item.type && item.type.indexOf("image/") === 0) {
      return item.getAsFile();
    }
  }
  return null;
}
