# Sunset Cover Studio — Make GTA 6 Cover Art

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![Rank](https://make.fun/badge/gta6-cover-art-01/vvtwentyfive/gta6-cover-art-01/rank.svg)
![Reward](https://make.fun/badge/gta6-cover-art-01/vvtwentyfive/gta6-cover-art-01/reward.svg)

Turn your own photo and a caption into GTA 6-style cover art — right in your browser, fully offline.

Sunset Cover Studio is an offline web app that takes a person's photo and a short caption and lays them out as a bold, neon-sunset poster in the spirit of a GTA 6 cover: multi-panel compositions, big display lettering, a neon script subtitle, warm sunset grades, film grain and a vignette. Everything runs locally. Your photo never leaves your machine, there are no network requests, and all of the art is original — no Rockstar assets are used.

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- Upload any photo and turn it into a poster-style cover in seconds.
- Choose from five multi-panel layouts:
  - **4-panel grid** — four equal panels, classic poster grid.
  - **Hero-and-three** — one large hero panel with three smaller panels beside it.
  - **Full-bleed** — one photo filling the whole cover.
  - **Nine-panel grid** — a 3×3 mosaic of crops from the same photo.
  - **Tilted snapshot strip** — a playful strip of tilted snapshots.
- Crop, position and zoom each panel independently, so every face and detail lands exactly where you want it.
- Pick from 5 neon-sunset grades to set the mood — warm gold, hot pink, deep violet, teal dusk, and blazing orange.
- Add bold display lettering in Anton for the title, with a neon script subtitle in Pacifico.
- Finish with grain and vignette for that printed-poster feel.
- Export a finished PNG in one click, in four sizes:
  - 1080×1080 (square)
  - 1080×1350 (portrait)
  - 1920×1080 (landscape)
  - 1080×1920 (story / vertical)

## Features

- **100% offline** — no uploads, no tracking, no network requests. Photos stay on your machine.
- **Five layouts** — grid, hero-and-three, full-bleed, nine-panel, and tilted snapshot strip.
- **Per-panel control** — crop, drag to position, and zoom each panel on its own.
- **Five neon-sunset grades** — one click changes the whole poster's colour mood.
- **Bold typography** — Anton display type for the title, Pacifico neon script for the subtitle.
- **Poster finish** — grain and vignette applied to the final export.
- **Four export sizes** — 1080×1080, 1080×1350, 1920×1080, and 1080×1920 PNG.
- **Original art only** — every layout, grade and lettering treatment is original work; no Rockstar assets.

## How to use it

1. **Load a photo** — open the app and upload a photo from your device. It stays on your machine; nothing is uploaded anywhere.
2. **Pick a layout** — choose the 4-panel grid, hero-and-three, full-bleed, nine-panel grid, or tilted snapshot strip.
3. **Crop and position** — drag each panel to frame the shot, and zoom in or out until every panel looks right.
4. **Add a caption** — type your title in bold Anton display lettering and add a neon script subtitle in Pacifico.
5. **Pick a grade** — try the 5 neon-sunset grades and choose the one that fits the mood.
6. **Export** — hit export and download a PNG in 1080×1080, 1080×1350, 1920×1080, or 1080×1920. Share it wherever you like.

## How to run

The entry is verified with `main.ts` (Node 22):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This builds/renders the app output into the `out/` directory.

## How to try the app locally

Serve the `app/` directory with any static server, then open it in your browser. For example, with Python:

```sh
cd app
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Any other static server works the same way — the app is plain HTML, CSS and JavaScript with no build step and no network requests.

## Privacy

Your photos never leave your machine. The app makes no network requests, stores nothing remotely, and works fully offline once loaded.

## License

MIT — see [LICENSE](LICENSE).

---

Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun — [try make.fun with ?ref=073t4skd](https://make.fun/r/073t4skd).
