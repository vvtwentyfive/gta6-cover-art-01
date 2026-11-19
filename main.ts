// Sunset Cover Studio — entry program for gta6-cover-art-01.
//
// What this does, in three steps:
//   1. copies the app's static files (app/) into the output directory,
//   2. copies the maker's screenshots (screenshots/) alongside them,
//   3. writes /output/dossier.json, the summary the judge reads, using the
//      vendored make.fun library (vendor/makefun-app.ts).
//
// Runs on Node 22 with the standard library only — nothing is installed
// before it runs. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the dossier comes out byte-identical both times.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where the repository lives on disk, and where the handed-in files go.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer enforces on what lands in /output. Only the text cap
// changes the dossier's bytes; the rest refuse an entry the scorer would
// refuse anyway, so they are checked here up front instead of at grade time.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  if (existsSync(sourceDir)) {
    cpSync(sourceDir, targetDir, { recursive: true });
  }
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, dossierLimits),
);
