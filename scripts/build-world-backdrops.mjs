#!/usr/bin/env node
/**
 * LES DÉCORS DE SÉANCE DES HUIT MONDES — du rendu brut au fichier servi.
 *
 * Une séance se joue dans le monde de sa matière (`lib/world-scenes.ts`,
 * `components/student/game-kit/stage-backdrop.tsx`) : le boulier géant pour
 * les mathématiques, le livre et la plume pour le français, le phare pour
 * l'anglais. Chaque monde a deux peintures, générées avec le serveur `studio`
 * (modèle `bfl/flux-3-image`, la savane du camp et la vignette du monde en
 * références de style) :
 *
 *   <id>-portrait.png   9:16, pour un téléphone debout
 *   <id>-wide.png       16:9, dès 640 px de large (tablette, ordinateur)
 *
 * Ce script les convertit en WebP et les range dans
 * `public/images/world/decors/`. Les fichiers sont embarqués dans
 * l'application : le décor s'affiche aussi sans réseau.
 *
 *   node scripts/build-world-backdrops.mjs --raw <dossier des PNG>
 *
 * `sharp` vient avec Next.js ; pnpm ne l'expose pas à la racine du dépôt, on
 * le résout depuis le paquet `next` (comme `build-game-assets.mjs`).
 */
import { existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public/images/world/decors");

/** Les mêmes identifiants que `WORLD_SCENE_IDS` (`lib/world-scenes.ts`). */
const WORLDS = ["maths", "francais", "sciences", "histoire", "geographie", "civique", "arts", "anglais"];

/** Les deux formats : la taille servie et la qualité WebP. */
const FORMATS = [
  { suffix: "portrait", width: 768, height: 1360, quality: 78 },
  { suffix: "wide", width: 1600, height: 900, quality: 76 },
];

const rawFlag = process.argv.indexOf("--raw");
const raw = rawFlag === -1 ? null : process.argv[rawFlag + 1];
if (!raw) {
  console.error("Usage : node scripts/build-world-backdrops.mjs --raw <dossier des PNG>");
  process.exit(1);
}

mkdirSync(out, { recursive: true });

let missing = 0;
for (const world of WORLDS) {
  for (const format of FORMATS) {
    const source = join(resolve(raw), `${world}-${format.suffix}.png`);
    if (!existsSync(source)) {
      console.error(`Manque : ${source}`);
      missing += 1;
      continue;
    }
    const target = join(out, `${world}-${format.suffix}.webp`);
    await sharp(source)
      .resize(format.width, format.height, { fit: "cover", position: "centre" })
      .webp({ quality: format.quality })
      .toFile(target);
    console.log(`${world}-${format.suffix}.webp  ${Math.round(statSync(target).size / 1024)} Ko`);
  }
}

if (missing > 0) process.exit(1);
