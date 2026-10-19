#!/usr/bin/env node
/**
 * LES DEUX IMAGES FIXES DU COFFRE : PNG avec alpha -> WebP avec alpha.
 *
 *     node scripts/coffre-stills.mjs <dossier de png> <dossier de sortie>
 *
 * Appelé par `scripts/coffre-encode.sh`, qui dépose `ferme.png` (la première
 * image du clip) et `ouvert.png` (la dernière) dans un dossier temporaire. Écrit
 * `ferme.webp` et `ouvert.webp` en qualité 90 avec un alpha à 100 : l'alpha est le
 * contour du coffre sur le décor, une perte s'y verrait en escalier.
 *
 * Comme `scripts/add-exercise-image.mjs`, `sharp` vient avec Next.js ; pnpm ne
 * l'expose pas à la racine du dépôt, on le résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.error("Usage : node scripts/coffre-stills.mjs <dossier de png> <dossier de sortie>");
  process.exit(1);
}
mkdirSync(resolve(to), { recursive: true });

for (const name of ["ferme", "ouvert"]) {
  const target = join(resolve(to), `${name}.webp`);
  await sharp(join(resolve(from), `${name}.png`)).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(target);
  console.log(`${target}  ${Math.round(statSync(target).size / 1024)} Ko`);
}
