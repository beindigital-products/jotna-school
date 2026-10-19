#!/usr/bin/env node
/**
 * AJOUTER UNE IMAGE D'ÉNONCÉ : convertit l'image du studio en fichier du site.
 *
 *     node scripts/add-exercise-image.mjs <fichier.png|jpg|webp> <identifiant> [--out <dossier>]
 *
 * Écrit `public/exercices/<identifiant>.webp` (512 × 512, fond blanc, la scène
 * entière visible, webp qualité 85) et affiche l'entrée à coller dans
 * `lib/exercise-images.ts` (`EXERCISE_IMAGES`). Le test
 * `lib/__tests__/exercise-images.test.ts` vérifie ensuite que chaque entrée a
 * son fichier et chaque fichier son entrée. Voir `docs/paliers-et-exercices.md`,
 * section « Des images dans l'énoncé ».
 *
 * `sharp` vient avec Next.js ; pnpm ne l'expose pas à la racine du dépôt, on le
 * résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

const SIZE = 512;
/**
 * Les générateurs d'images laissent des formes fantômes quasi blanches dans le
 * fond (de 246 à 254 sur 255, invisibles seules, visibles sur une carte
 * colorée) : tout pixel dont les trois canaux valent au moins ce seuil devient
 * blanc pur. Les blancs réels d'un dessin (la laine d'un mouton, vers 235)
 * restent intacts.
 */
const NEAR_WHITE = 246;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? resolve(args.splice(outIndex, 2)[1] ?? "") : join(root, "public", "exercices");
const [source, id] = args;

if (!source || !id || !ID.test(id)) {
  console.error("Usage : node scripts/add-exercise-image.mjs <fichier> <identifiant> [--out <dossier>]");
  console.error("L'identifiant : minuscules, chiffres et tirets (chat, pirogue-coloree).");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const target = join(outDir, `${id}.webp`);
const { data, info } = await sharp(resolve(source))
  .flatten({ background: "#ffffff" })
  .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) {
  if (data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE) {
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .webp({ quality: 85 })
  .toFile(target);

console.log(`Écrit : ${target} (${Math.round(statSync(target).size / 1024)} Ko)`);
console.log("\nÀ ajouter à EXERCISE_IMAGES dans lib/exercise-images.ts :");
console.log(`  { id: "${id}", alt: "À RÉDIGER (ce que lit un lecteur d'écran)", about: "À RÉDIGER (le sujet, pour le modèle)" },`);
