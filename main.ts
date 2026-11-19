// Sunset Cover Studio — hand-in program for gta6-cover-art-01.
//
// Node 22, standard library only. It stages the static app (app/) and its
// screenshots (screenshots/) from beside this file into the output directory
// and writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. Run locally with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory holding this file, i.e. the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// Destination: the grader's /output, or the local override for testing.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this competition (from the kit's gate): only
// text_max_bytes shapes the dossier bytes; the rest make this program
// refuse exactly where the scorer would refuse.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function stageFolder(name) {
  const source = join(repoRoot, name);
  const target = join(outputDir, name);
  mkdirSync(target, { recursive: true });
  if (existsSync(source)) {
    cpSync(source, target, { recursive: true });
    console.log(`staged ${name}/ -> ${target}`);
    return true;
  }
  // screenshots/ is filled in by a later step, so a missing folder here is
  // only a warning; a missing app/ is fatal and buildDossier will refuse it.
  console.warn(`warning: ${name}/ not found beside main.ts; staging an empty ${name}/`);
  return false;
}

mkdirSync(outputDir, { recursive: true });
const appStaged = stageFolder('app');
stageFolder('screenshots');
if (!appStaged) {
  throw new Error('app/ is missing beside main.ts; cannot build a dossier without the app');
}

const dossier = buildDossier(outputDir, dossierCaps);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
