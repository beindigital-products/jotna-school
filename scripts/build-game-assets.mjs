#!/usr/bin/env node
/**
 * FABRIQUER LES IMAGES DU JEU : les cartes de l'album, les objets du marché et
 * le camp de nuit, depuis les PNG du studio.
 *
 *     node scripts/build-game-assets.mjs --raw <dossier>
 *
 * Le dossier `--raw` contient trois sous-dossiers (chacun facultatif) :
 *
 *   cartes/<id>.png   une scène carrée par carte (`gameCatalog.CARDS`)
 *                     → public/images/cartes/<id>.webp (512 px) et <id>-s.webp
 *                       (256 px, pour les appareils à donnée chère)
 *   camp/<id>.png     un objet seul sur fond blanc (`gameCatalog.SHOP_ITEMS`)
 *                     → public/images/camp/<id>.webp, détouré, fond transparent,
 *                       384 px de large au plus
 *   nuit/portrait.png et nuit/wide.png   le camp de nuit, cadré comme le camp
 *                     de jour → public/images/world/hub-savanna-night-*.jpg
 *
 * LE DÉTOURAGE D'UN OBJET part des bords de l'image : tout pixel presque blanc
 * relié au bord par d'autres pixels presque blancs devient transparent. Le
 * blanc qui est DANS l'objet (la peau d'un tambour) n'est donc pas mangé. La
 * frontière est ensuite rognée d'un pixel et adoucie, pour ne pas laisser de
 * liseré blanc sur le décor.
 *
 * Les images viennent du serveur MCP `studio` (modèle `bfl/flux-3-image`), avec
 * le camp ou le coffre en référence de style. Les catalogues sont dans
 * `convex/gameCatalog.ts`, les chemins dans `lib/game-assets.ts`, et
 * `lib/__tests__/game-assets.test.ts` vérifie que chaque entrée a ses fichiers.
 * Voir `docs/economie-du-jeu.md`.
 *
 * `sharp` vient avec Next.js ; pnpm ne l'expose pas à la racine du dépôt, on le
 * résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
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
  console.error("usage: node scripts/build-game-assets.mjs --raw <dossier>");
  process.exit(1);
}

function pngs(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")).sort() : [];
}

// --- Les cartes -----------------------------------------------------------
const CARD_SIZE = 512;
const CARD_SIZE_LITE = 256;
const cardsOut = join(root, "public", "images", "cartes");
for (const file of pngs(join(rawDir, "cartes"))) {
  mkdirSync(cardsOut, { recursive: true });
  const id = file.replace(/\.png$/, "");
  const source = join(rawDir, "cartes", file);
  await sharp(source).resize(CARD_SIZE, CARD_SIZE, { fit: "cover" }).webp({ quality: 80 }).toFile(join(cardsOut, `${id}.webp`));
  await sharp(source)
    .resize(CARD_SIZE_LITE, CARD_SIZE_LITE, { fit: "cover" })
    .webp({ quality: 74 })
    .toFile(join(cardsOut, `${id}-s.webp`));
  console.log(`cartes/${id}.webp`);
}

// --- Les objets du camp ---------------------------------------------------
/** Un pixel est « presque blanc » quand ses trois canaux valent au moins ceci. */
const NEAR_WHITE = 236;
const ITEM_WIDTH = 384;
const itemsOut = join(root, "public", "images", "camp");

async function cutOut(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const isWhite = (i) => data[i * 4] >= NEAR_WHITE && data[i * 4 + 1] >= NEAR_WHITE && data[i * 4 + 2] >= NEAR_WHITE;

  // Remplissage depuis les bords : 1 = fond.
  const background = new Uint8Array(width * height);
  const stack = [];
  const visit = (i) => {
    if (background[i] === 0 && isWhite(i)) {
      background[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (stack.length > 0) {
    const i = stack.pop();
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < width * (height - 1)) visit(i + width);
  }

  // Rogner la frontière d'un pixel : un pixel d'objet qui touche le fond part
  // avec lui (c'est là que traîne le liseré blanc).
  const edge = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (background[i]) continue;
      if (
        (x > 0 && background[i - 1]) ||
        (x < width - 1 && background[i + 1]) ||
        (y > 0 && background[i - width]) ||
        (y < height - 1 && background[i + width])
      ) {
        edge[i] = 1;
      }
    }
  }

  // L'alpha : 0 pour le fond et la frontière, 255 ailleurs, puis une moyenne
  // sur 3 × 3 pour un bord doux.
  const hard = new Uint8Array(width * height);
  for (let i = 0; i < hard.length; i++) hard[i] = background[i] || edge[i] ? 0 : 255;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          sum += hard[yy * width + xx];
          n++;
        }
      }
      data[(y * width + x) * 4 + 3] = Math.round(sum / n);
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } });
}

for (const file of pngs(join(rawDir, "camp"))) {
  mkdirSync(itemsOut, { recursive: true });
  const id = file.replace(/\.png$/, "");
  const cut = await cutOut(join(rawDir, "camp", file));
  const trimmed = await cut.png().toBuffer();
  await sharp(trimmed)
    .trim({ threshold: 1 })
    .resize({ width: ITEM_WIDTH, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 92 })
    .toFile(join(itemsOut, `${id}.webp`));
  console.log(`camp/${id}.webp`);
}

// --- Le camp de nuit ------------------------------------------------------
const worldOut = join(root, "public", "images", "world");
for (const [name, size] of [
  ["portrait", { width: 853, height: 1844 }],
  ["wide", { width: 1920, height: 1071 }],
]) {
  const source = join(rawDir, "nuit", `${name}.png`);
  if (!existsSync(source)) continue;
  await sharp(source)
    .resize(size.width, size.height, { fit: "cover" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(join(worldOut, `hub-savanna-night-${name}.jpg`));
  console.log(`world/hub-savanna-night-${name}.jpg`);
}
