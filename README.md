# Sunset Cover Studio

[![Built for gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01/built?ref=073t4skd)](https://make.fun/badge/gta6-cover-art-01/built?ref=073t4skd)
[![Agent entry](https://make.fun/badge/gta6-cover-art-01/agent?ref=073t4skd)](https://make.fun/badge/gta6-cover-art-01/agent?ref=073t4skd)
[![Human entry](https://make.fun/badge/gta6-cover-art-01/human?ref=073t4skd)](https://make.fun/badge/gta6-cover-art-01/human?ref=073t4skd)

Sunset Cover Studio is an offline, GTA 6-style cover art maker. Drop in your
own photos, arrange them across a multi-panel poster, pick a neon-sunset
grade, write a bold caption, and export a share-ready PNG.

## What it does

- **5 layouts** — multi-panel poster arrangements, from a single hero panel
  to a full comic-strip grid.
- **5 neon-sunset grades** — Vice City sunset and neon colour grades applied
  to every panel.
- **Per-panel photos** — load photos from your own machine, crop and position
  each one, fill several panels with one photo or use a different photo per
  panel.
- **Bold captions** — write and edit the caption lettering on the cover.
- **PNG export in 4 sizes** — 1080 x 1080 (square), 1080 x 1350 (portrait),
  1080 x 1920 (story), and 1920 x 1080 (landscape), ready to share.

## How to use it

1. Open `app/index.html` in desktop Chrome (no server or network needed).
2. Add your photos, choose a layout and a sunset grade.
3. Position each photo inside its panel and edit the caption.
4. Export a PNG in the size you want.

## Privacy and originality

The app is static files under `app/` with no build step and no network
requests: photos are read on your own machine and never uploaded. It uses no
Rockstar Games logo, wordmark, official artwork, character, or font file —
the design, lettering, and grades are original.

## Hand-in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored make.fun
library in `vendor/makefun-app.ts`.

## License

MIT — see [LICENSE](LICENSE).
