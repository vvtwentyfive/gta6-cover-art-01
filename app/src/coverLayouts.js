/* coverLayouts.js — the five multi-panel poster layouts.
 * Each layout is a function of the cover size (width, height) that
 * returns panel rectangles as fractions of the cover (x, y, w, h in
 * 0..1), plus a short label and a one-line description for the UI.
 * The renderer draws one photo per panel and the caption over the
 * bottom of the cover, so every layout keeps the lower band clear
 * of panel seams where the title sits. */
"use strict";

const COVER_LAYOUTS = {
  hero: {
    label: "Hero",
    blurb: "One full-bleed photo",
    layoutPanels: function layoutPanelsHero() {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    },
  },
  banner: {
    label: "Banner",
    blurb: "Three stacked rows",
    layoutPanels: function layoutPanelsBanner() {
      return [
        { x: 0, y: 0, w: 1, h: 0.34 },
        { x: 0, y: 0.35, w: 1, h: 0.30 },
        { x: 0, y: 0.66, w: 1, h: 0.34 },
      ];
    },
  },
  quad: {
    label: "Quad",
    blurb: "Two-by-two grid",
    layoutPanels: function layoutPanelsQuad() {
      return [
        { x: 0, y: 0, w: 0.495, h: 0.495 },
        { x: 0.505, y: 0, w: 0.495, h: 0.495 },
        { x: 0, y: 0.505, w: 0.495, h: 0.495 },
        { x: 0.505, y: 0.505, w: 0.495, h: 0.495 },
      ];
    },
  },
  duo: {
    label: "Duo",
    blurb: "Two tall halves",
    layoutPanels: function layoutPanelsDuo() {
      return [
        { x: 0, y: 0, w: 0.495, h: 1 },
        { x: 0.505, y: 0, w: 0.495, h: 1 },
      ];
    },
  },
  strip: {
    label: "Strip",
    blurb: "Four vertical strips",
    layoutPanels: function layoutPanelsStrip() {
      const panels = [];
      for (let i = 0; i < 4; i++) {
        panels.push({ x: i * 0.2533, y: 0, w: 0.24, h: 1 });
      }
      return panels;
    },
  },
};

const COVER_LAYOUT_ORDER = ["hero", "banner", "quad", "duo", "strip"];

function layoutPanelsFor(layoutName) {
  const layout = COVER_LAYOUTS[layoutName] || COVER_LAYOUTS.hero;
  return layout.layoutPanels();
}
