#!/usr/bin/env node
/**
 * LA PLANCHE DU COFFRE : l'image du coffre fermé, recentrée pour le clip.
 *
 *     node scripts/coffre-plate.mjs <image.png> <planche.png> [largeur=600] [pied=905]
 *
 * L'image vient de `generate_image` du studio : un coffre fermé sur un fond bleu
 * pur (#0000FF), n'importe où dans le cadre. Ce script cherche la boîte du coffre
 * (tout ce qui n'est pas le bleu), la ramène à `largeur` pixels et la pose, centrée,
 * dans un cadre carré de 1024 × 1024 bleu pur, le bas de la caisse à `pied` pixels
 * du haut. Avec 600 et 905, la caisse occupe le bas du cadre et le haut reste libre :
 * le couvercle ouvert monte jusqu'au tiers du cadre (voir `docs/pio-animations.md`,
 * section « Le coffre au trésor »). C'est cette planche, première image du clip, qui
 * part en image vers vidéo ; `scripts/coffre-encode.sh` fait le reste.
 *
 * Comme `scripts/add-exercise-image.mjs`, `sharp` vient avec Next.js ; pnpm ne
 * l'expose pas à la racine du dépôt, on le résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

const [input, output, widthArg = "600", bottomArg = "905"] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage : node scripts/coffre-plate.mjs <image.png> <planche.png> [largeur=600] [pied=905]");
  process.exit(1);
}

/** Un pixel est du fond tant qu'il reste proche du bleu pur (somme des écarts, sur 765). */
const BACKGROUND_DISTANCE = 90;

const { data, info } = await sharp(resolve(input)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
let minX = info.width;
let minY = info.height;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    const distance = data[i] + data[i + 1] + (255 - data[i + 2]);
    if (distance > BACKGROUND_DISTANCE) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
if (maxX <= minX || maxY <= minY) {
  console.error("Aucun coffre trouvé : l'image est-elle bien sur un fond bleu pur ?");
  process.exit(1);
}

const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
const width = Number(widthArg);
const bottom = Number(bottomArg);
const height = Math.round((box.height * width) / box.width);
const crop = await sharp(resolve(input)).extract(box).resize(width, height, { kernel: "lanczos3" }).toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: { r: 0, g: 0, b: 255 } } })
  .composite([{ input: crop, left: Math.round((1024 - width) / 2), top: bottom - height }])
  .png()
  .toFile(resolve(output));
console.log(`planche ${resolve(output)} : coffre ${width} x ${height}, haut à ${bottom - height}, boîte d'origine`, box);
