#!/usr/bin/env node
/**
 * FABRIQUER LES MONDES DE LA CARTE : convertit les PNG du studio (une vignette
 * ronde peinte par matière, sur fond blanc) en disques webp transparents.
 *
 *     node scripts/build-world-scenes.mjs --raw <dossier> [--size 384] [--suffix ""] [--out public/images/world/mondes]
 *
 * Le dossier `--raw` contient un `<id>.png` par monde (les identifiants sont
 * ceux de `lib/world-scenes.ts`). Chaque image est déjà un disque sur fond blanc :
 * on ne cherche pas son fond (les nuages blancs du bord seraient mangés), on
 * taille un disque net, adouci d'un pixel, et on écrit un webp avec
 * transparence. Deux tailles servent : 384 pixels (`full`) et 192 pixels
 * (`lite`, suffixe `-s`), pour les appareils à donnée chère.
 *
 *     node scripts/build-world-scenes.mjs --raw <dossier>
 *     node scripts/build-world-scenes.mjs --raw <dossier> --size 192 --suffix -s
 *
 * Les images viennent du serveur MCP `studio` (modèle `bfl/flux-3-image`), avec
 * le biome `biome-riviere.jpg` en référence de style : même peinture douce en 3D,
 * même lumière dorée que les biomes et le camp. Voir `docs/monde-de-pio.md`.
 *
 * `sharp` vient avec Next.js ; pnpm ne l'expose pas à la racine du dépôt, on le
 * résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

const rawDir = arg("--raw");
if (!rawDir) {
  console.error("usage: node scripts/build-world-scenes.mjs --raw <dossier> [--size 384] [--suffix -s] [--out <dossier>]");
  process.exit(1);
}
const SIZE = Number(arg("--size") ?? 384);
const SUFFIX = arg("--suffix") ?? "";
const outDir = resolve(root, arg("--out") ?? "public/images/world/mondes");
mkdirSync(outDir, { recursive: true });

const r = SIZE / 2 - 1.5;
const mask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${r}" fill="#fff"/></svg>`,
);

for (const file of readdirSync(rawDir).filter((f) => f.endsWith(".png")).sort()) {
  const id = file.replace(/\.png$/, "");
  await sharp(join(rawDir, file))
    .resize(SIZE, SIZE, { fit: "cover" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(join(outDir, `${id}${SUFFIX}.webp`));
  console.log(`${id}${SUFFIX}.webp`);
}
