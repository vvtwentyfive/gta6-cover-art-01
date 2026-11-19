/* coverGrades.js — the five sunset / neon colour grades.
 * A grade is a set of overlay gradients and a tint that the renderer
 * paints over the photos: a warm sky wash from the top, a hot horizon
 * band, a cool shadow lift from the bottom, and an accent colour used
 * for the title underline and panel keylines. Values are CSS colours
 * so the same table drives both the canvas grade and the UI swatches. */
"use strict";

const COVER_GRADES = {
  "neon-sunset": {
    label: "Neon Sunset",
    swatch: "linear-gradient(135deg,#ff2d95,#ff7a3d 55%,#7b2ff7)",
    skyWash: "rgba(255,45,149,0.20)",
    horizonGlow: "rgba(255,122,61,0.34)",
    shadowLift: "rgba(123,47,247,0.26)",
    tint: "rgba(255,80,120,0.10)",
    accent: "#ff2d95",
  },
  "vice-pink": {
    label: "Vice Pink",
    swatch: "linear-gradient(135deg,#ff5da2,#ff8fb8 55%,#c7247a)",
    skyWash: "rgba(255,93,162,0.26)",
    horizonGlow: "rgba(255,143,184,0.30)",
    shadowLift: "rgba(120,20,90,0.30)",
    tint: "rgba(255,93,162,0.12)",
    accent: "#ff5da2",
  },
  "ocean-drive": {
    label: "Ocean Drive",
    swatch: "linear-gradient(135deg,#00e5ff,#2f7bff 55%,#ff7a3d)",
    skyWash: "rgba(0,229,255,0.18)",
    horizonGlow: "rgba(255,122,61,0.28)",
    shadowLift: "rgba(20,60,160,0.30)",
    tint: "rgba(0,180,255,0.10)",
    accent: "#00e5ff",
  },
  midnight: {
    label: "Midnight",
    swatch: "linear-gradient(135deg,#1b1035,#3d1a6e 55%,#ff2d95)",
    skyWash: "rgba(40,20,90,0.30)",
    horizonGlow: "rgba(255,45,149,0.22)",
    shadowLift: "rgba(10,6,30,0.42)",
    tint: "rgba(90,60,200,0.12)",
    accent: "#b18cff",
  },
  "golden-hour": {
    label: "Golden Hour",
    swatch: "linear-gradient(135deg,#ffb13d,#ff7a3d 55%,#ff5e62)",
    skyWash: "rgba(255,177,61,0.20)",
    horizonGlow: "rgba(255,122,40,0.36)",
    shadowLift: "rgba(140,40,30,0.26)",
    tint: "rgba(255,170,60,0.12)",
    accent: "#ffb13d",
  },
};

const COVER_GRADE_ORDER = [
  "neon-sunset",
  "vice-pink",
  "ocean-drive",
  "midnight",
  "golden-hour",
];

function gradeFor(gradeName) {
  return COVER_GRADES[gradeName] || COVER_GRADES["neon-sunset"];
}
