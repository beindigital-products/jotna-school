#!/usr/bin/env node
/**
 * FABRIQUER LES IMAGES DES TUILES : convertit les PNG du studio en fichiers du
 * site, et dessine les six formes.
 *
 *     node scripts/build-item-images.mjs --raw <dossier de png> [--ids a,b,c] [--out public/objets]
 *     node scripts/build-item-images.mjs                       (les six formes, seulement)
 *
 * Pour chaque `<id>.png` du dossier `--raw` (ou seulement les identifiants de
 * `--ids`), écrit `public/objets/<id>.webp` : 384 × 384, fond blanc, la scène
 * entière visible, webp qualité 85 (plus bas pour un dessin qui dépasserait
 * 40 Ko). C'est le pipeline de `scripts/add-exercise-image.mjs` (aplatir sur
 * blanc, `contain`, pixels quasi blancs ramenés à blanc pur), avec trois
 * différences. Le fond qui touche le
 * bord est blanchi plus largement (`BACKGROUND_FLOOR`) : sur l'autocollant
 * blanc d'une tuile, un fond crème ou rose à peine visible se devine comme un
 * carré. Les scènes carrées (`SCENES` : le moment du jour, le ciel, la savane,
 * la salle de classe…) gardent leurs couleurs intactes, un ciel de midi à 250
 * sur 255 n'est pas un fond fantôme. Et un sujet qui occupe moins de la moitié
 * du carré (la balle de la vague 2, à 35 %) est agrandi jusqu'à 60 %, comme les
 * plus petits dessins de la vague 1 : sur une tuile, il flotterait dans le blanc.
 *
 * LES SIX FORMES (carre, rond, triangle, rectangle, coeur, etoile) ne viennent
 * pas du studio : un générateur d'images dessine mal un carré parfait. Elles sont
 * dessinées ici en SVG, rasterisées par sharp : une forme pleine d'une couleur
 * franche, un contour brun foncé épais et arrondi (la même famille que les
 * images générées), un reflet doux en haut à gauche, centrée avec de la marge,
 * sur fond blanc. Sans `--raw`, seules elles sont écrites ; avec `--ids`, seules
 * celles qui sont nommées.
 *
 * Le catalogue est `lib/item-images.ts` (ITEM_IMAGES) : une image sans entrée est
 * signalée, et le test `lib/__tests__/item-images.test.ts` vérifie ensuite que
 * chaque entrée a son fichier, chaque fichier son entrée, et que chaque fichier
 * mesure 384 × 384. Voir `docs/paliers-et-exercices.md`, section « Des images sur
 * les tuiles (CI) ».
 *
 * `sharp` vient avec Next.js ; pnpm ne l'expose pas à la racine du dépôt, on le
 * résout depuis le paquet `next`.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));

/** Le côté d'un fichier (`ITEM_IMAGE_SIZE`, `lib/item-images.ts`). */
const SIZE = 384;
/**
 * Les générateurs d'images laissent des formes fantômes quasi blanches dans le
 * fond (de 246 à 254 sur 255, invisibles seules, visibles sur une tuile
 * colorée) : tout pixel dont les trois canaux valent au moins ce seuil devient
 * blanc pur.
 */
const NEAR_WHITE = 246;
/**
 * Le fond d'un dessin n'est pas toujours aussi blanc que `NEAR_WHITE` l'exige : le
 * studio le teinte parfois d'un crème ou d'un rose à peine plus sombre (la souris :
 * 249, 245, 245 partout, le bleu sous le seuil) et laisse des ombres pâles autour
 * d'un éléphant ou d'une poupée. Sur l'autocollant blanc d'une tuile, c'est un
 * carré qui se devine. Tout pixel dont le plus sombre des trois canaux vaut au
 * moins ce seuil, ET qui rejoint le bord de l'image de proche en proche par des
 * pixels aussi clairs, devient blanc pur. Mesuré sur les 79 dessins qui ne sont
 * pas des ciels : la surface du fond ne bouge plus de 240 à 228, le contour épais
 * ferme chaque sujet ; seul le riz fuit dans son bol, vers 224. 236 est au milieu
 * du plateau.
 */
const BACKGROUND_FLOOR = 236;
/**
 * Les scènes carrées : le dessin remplit tout le carré, sans fond à blanchir (un
 * ciel clair doit rester tel quel : pas de blanc pur forcé) ni sujet à agrandir.
 * Une scène nouvelle s'ajoute ici, sinon son ciel pâle est traité comme un fond.
 */
const SCENES = new Set([
  "matin", "midi", "soir", "nuit",
  "apres-midi", "ciel", "savane", "montagne", "ferme", "jardin", "marche", "salle-de-classe", "passage-pour-pietons",
]);
/**
 * Un sujet qui occupe moins de la moitié du carré (la balle de la vague 2 : 35 %)
 * flotte dans le blanc d'une tuile et se lit mal à cent pixels. Il est agrandi
 * jusqu'à `ZOOM_TO` du carré, la place des plus petits dessins de la vague 1
 * (de 58 à 65 %). Les autres dessins ne bougent pas : le plus petit de la vague 1
 * occupe 58 %, le plus grand 93 %.
 */
const MIN_EXTENT = 0.5;
const ZOOM_TO = 0.6;
/**
 * Le plafond d'un fichier, celui que vérifie `lib/__tests__/item-images.test.ts` :
 * une scène très détaillée (le jardin : 45 Ko à la qualité 85) est ré-encodée plus
 * bas, par pas de 5, jusqu'à passer sous le plafond, sans descendre sous `MIN_QUALITY`.
 */
const MAX_BYTES = 40 * 1024;
const MIN_QUALITY = 60;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ── Les six formes ─────────────────────────────────────────────────────── */

const OUTLINE = "#5a3b22";
const STROKE = 12;

/** Les sommets d'une étoile à cinq branches, la pointe en haut. */
function starPoints(cx, cy, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

/* Chaque forme tient dans le carré de 384 avec au moins 42 px de marge (contour
   compris) et se centre à l'œil. `element(attributs)` écrit la forme avec la
   peinture donnée : la même forme sert au fond, au reflet et au contour. */
const SHAPES = [
  { id: "carre", fill: "#4C9BE8", element: (a) => `<rect x="60" y="60" width="264" height="264" rx="8" ${a}/>` },
  { id: "rond", fill: "#E8504C", element: (a) => `<circle cx="192" cy="192" r="132" ${a}/>` },
  { id: "triangle", fill: "#4CB86B", element: (a) => `<polygon points="192,76 327,310 57,310" ${a}/>` },
  // Deux fois plus large que haut : un rectangle, pas un carré.
  { id: "rectangle", fill: "#F59E2B", element: (a) => `<rect x="48" y="120" width="288" height="144" rx="8" ${a}/>` },
  {
    id: "coeur",
    fill: "#F26B8A",
    element: (a) =>
      `<path d="M192 320C100 250 52 196 52 136C52 92 86 62 128 62C158 62 182 78 192 102C202 78 226 62 256 62C298 62 332 92 332 136C332 196 284 250 192 320Z" ${a}/>`,
  },
  { id: "etoile", fill: "#FFC93C", element: (a) => `<polygon points="${starPoints(192, 206, 150, 68)}" ${a}/>` },
];
const SHAPE_IDS = new Set(SHAPES.map((shape) => shape.id));

function shapeSvg(shape) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="reflet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  ${shape.element(`fill="${shape.fill}"`)}
  ${shape.element(`fill="url(#reflet)"`)}
  ${shape.element(`fill="none" stroke="${OUTLINE}" stroke-width="${STROKE}" stroke-linejoin="round"`)}
</svg>`;
}

/* ── La ligne de commande ───────────────────────────────────────────────── */

const USAGE = `Usage : node scripts/build-item-images.mjs --raw <dossier de png> [--ids a,b,c] [--out public/objets]
        node scripts/build-item-images.mjs          (les six formes, seulement)
Un identifiant : minuscules, chiffres et tirets (chat, lait-caille).`;

function fail(message) {
  console.error(message);
  console.error(`\n${USAGE}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const options = { raw: null, ids: null, out: join(root, "public", "objets") };
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  }
  if (flag !== "--raw" && flag !== "--ids" && flag !== "--out") fail(`Option inconnue : ${flag}`);
  const value = args[++i];
  if (!value || value.startsWith("--")) fail(`${flag} attend une valeur.`);
  if (flag === "--raw") options.raw = resolve(value);
  if (flag === "--ids") options.ids = value.split(",").map((id) => id.trim()).filter(Boolean);
  if (flag === "--out") options.out = resolve(value);
}

for (const id of options.ids ?? []) {
  if (!ID.test(id)) fail(`Identifiant invalide : « ${id} ».`);
}
if (options.raw && !existsSync(options.raw)) fail(`Dossier introuvable : ${options.raw}`);

/* Les identifiants du catalogue, lus dans la source : un simple filet, pas un import. */
const catalogueFile = join(root, "lib", "item-images.ts");
const known = existsSync(catalogueFile)
  ? new Set([...readFileSync(catalogueFile, "utf8").matchAll(/\bid: "([a-z0-9-]+)"/g)].map((match) => match[1]))
  : null;

/* ── La fabrication ─────────────────────────────────────────────────────── */

/**
 * Blanchit le fond qui touche le bord : un remplissage depuis les quatre côtés par
 * les pixels clairs (`BACKGROUND_FLOOR`), en quatre voisins, pour qu'un contour qui
 * ne se touche que par un coin arrête quand même le remplissage. L'intérieur du
 * sujet (le ventre clair d'une souris, le riz d'un bol) n'est pas atteint.
 */
function whitenBackground(data, info) {
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  // Chaque pixel entre une fois dans la pile (il est marqué en y entrant) : width * height suffit.
  const stack = new Uint32Array(width * height);
  let top = 0;
  const visit = (x, y) => {
    const p = y * width + x;
    if (seen[p]) return;
    const i = p * channels;
    if (Math.min(data[i], data[i + 1], data[i + 2]) < BACKGROUND_FLOOR) return;
    seen[p] = 1;
    stack[top++] = p;
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  while (top > 0) {
    const p = stack[--top];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) visit(x - 1, y);
    if (x < width - 1) visit(x + 1, y);
    if (y > 0) visit(x, y - 1);
    if (y < height - 1) visit(x, y + 1);
  }
  for (let p = 0; p < seen.length; p++) {
    if (seen[p]) data[p * channels] = data[p * channels + 1] = data[p * channels + 2] = 255;
  }
}

/** Blanchit le fond qui touche le bord, puis ramène les quasi-blancs à blanc pur. */
function cleanBackground(data, info) {
  whitenBackground(data, info);
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
}

/**
 * La boîte (en pixels, bornes comprises) de tout ce qui n'est pas blanc dans des
 * pixels déjà nettoyés (`cleanBackground`), ou `null` pour un dessin tout blanc.
 */
function subjectBox(data, info) {
  const { width, height, channels } = info;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= NEAR_WHITE) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < 0 ? null : { left, top, right, bottom };
}

/**
 * Écrit `<out>/<id>.webp` depuis des pixels bruts (trois canaux, 384 × 384), après
 * avoir blanchi le fond et ramené les quasi-blancs à blanc pur, sauf pour les
 * scènes.
 */
async function writeWebp(data, info, id) {
  if (!SCENES.has(id)) cleanBackground(data, info);
  const target = join(options.out, `${id}.webp`);
  const pixels = { raw: { width: info.width, height: info.height, channels: info.channels } };
  let quality = 85;
  let encoded = await sharp(data, pixels).webp({ quality }).toBuffer();
  while (encoded.length > MAX_BYTES && quality > MIN_QUALITY) {
    quality -= 5;
    encoded = await sharp(data, pixels).webp({ quality, effort: 6 }).toBuffer();
  }
  if (quality < 85) console.log(`  ${id} : ré-encodé à la qualité ${quality} pour tenir sous ${MAX_BYTES / 1024} Ko.`);
  if (encoded.length > MAX_BYTES) console.warn(`  ATTENTION : « ${id} » pèse ${Math.round(encoded.length / 1024)} Ko, plus que le plafond de ${MAX_BYTES / 1024} Ko.`);
  writeFileSync(target, encoded);
  const written = await sharp(target).metadata();
  // Le chemin depuis le dossier courant ; hors de lui (`--out` ailleurs), le chemin complet.
  const fromHere = relative(process.cwd(), target);
  const where = fromHere.startsWith("..") ? target : fromHere;
  console.log(`${where} : ${written.width} × ${written.height}, ${Math.round(statSync(target).size / 1024)} Ko`);
  if (known && !known.has(id)) {
    console.warn(`  ATTENTION : « ${id} » n'a pas d'entrée dans lib/item-images.ts (ITEM_IMAGES) : l'ajouter.`);
  }
}

/** Les pixels bruts d'un traitement sharp, sans canal alpha. */
const readRaw = (pipeline) => pipeline.removeAlpha().raw().toBuffer({ resolveWithObject: true });

/** Le côté le plus long d'une boîte de `subjectBox`. */
const longestSide = (box) => Math.max(box.right - box.left + 1, box.bottom - box.top + 1);

/**
 * Le PNG d'origine agrandi pour que le sujet (`box`, mesurée sur les 384 px de la
 * première passe) occupe `ZOOM_TO` du carré, au centre. Agrandi depuis l'original
 * plutôt que depuis les 384 px : rien n'est flou.
 */
async function zoomOnSubject(file, box) {
  const { width, height } = await sharp(file).metadata();
  // L'échelle du `contain` de la première passe, puis celle de l'agrandissement.
  const fit = SIZE / Math.max(width, height);
  const zoom = (ZOOM_TO * SIZE) / longestSide(box);
  // Du blanc tout autour : le sujet peut toucher un bord de l'original.
  const scaled = await sharp(file)
    .flatten({ background: "#ffffff" })
    .resize(Math.round(width * fit * zoom), Math.round(height * fit * zoom))
    .extend({ top: SIZE, bottom: SIZE, left: SIZE, right: SIZE, background: "#ffffff" })
    .png()
    .toBuffer();
  // Le centre du sujet dans l'image agrandie : la première passe centrait l'original dans le carré.
  const centerX = ((box.left + box.right + 1) / 2 - (SIZE - width * fit) / 2) * zoom;
  const centerY = ((box.top + box.bottom + 1) / 2 - (SIZE - height * fit) / 2) * zoom;
  return sharp(scaled).extract({
    left: Math.round(centerX + SIZE / 2),
    top: Math.round(centerY + SIZE / 2),
    width: SIZE,
    height: SIZE,
  });
}

async function fromPng(file, id) {
  let { data, info } = await readRaw(
    sharp(file).flatten({ background: "#ffffff" }).resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" }),
  );
  if (!SCENES.has(id)) {
    // On mesure sur une copie nettoyée : `writeWebp` nettoie lui-même les pixels qu'il écrit.
    const measured = Buffer.from(data);
    cleanBackground(measured, info);
    const box = subjectBox(measured, info);
    if (box && longestSide(box) < MIN_EXTENT * SIZE) {
      console.log(
        `  ${id} : le sujet occupe ${Math.round((longestSide(box) / SIZE) * 100)} % du carré, agrandi à ${Math.round(ZOOM_TO * 100)} %.`,
      );
      ({ data, info } = await readRaw(await zoomOnSubject(file, box)));
    }
  }
  await writeWebp(data, info, id);
}

async function fromShape(shape) {
  // Rasterisée à quatre fois la taille puis réduite : un contour sans escalier.
  const { data, info } = await sharp(Buffer.from(shapeSvg(shape)), { density: 288 })
    .flatten({ background: "#ffffff" })
    .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  await writeWebp(data, info, shape.id);
}

mkdirSync(options.out, { recursive: true });

let problems = 0;

// Les PNG du studio. Les formes n'en ont pas : le code les dessine.
if (options.raw) {
  const available = new Map();
  for (const name of readdirSync(options.raw)) {
    if (!name.endsWith(".png")) continue;
    const id = name.slice(0, -".png".length);
    // Avec `--ids`, ce qui n'est pas demandé se tait.
    const asked = !options.ids || options.ids.includes(id);
    if (!ID.test(id)) {
      if (!options.ids) console.warn(`Ignoré : ${name} (identifiant invalide).`);
      continue;
    }
    if (SHAPE_IDS.has(id)) {
      if (asked) console.warn(`Ignoré : ${name} (les formes sont dessinées par le code).`);
      continue;
    }
    available.set(id, join(options.raw, name));
  }
  const wanted = options.ids ? options.ids.filter((id) => !SHAPE_IDS.has(id)) : [...available.keys()].sort();
  for (const id of wanted) {
    const file = available.get(id);
    if (!file) {
      console.error(`Introuvable : ${id}.png dans ${options.raw}`);
      problems++;
      continue;
    }
    try {
      await fromPng(file, id);
    } catch (error) {
      console.error(`Échec : ${id} (${error instanceof Error ? error.message : error})`);
      problems++;
    }
  }
} else if (options.ids) {
  const needRaw = options.ids.filter((id) => !SHAPE_IDS.has(id));
  if (needRaw.length > 0) fail(`--raw est nécessaire pour : ${needRaw.join(", ")}.`);
}

// Les six formes.
for (const shape of SHAPES) {
  if (options.ids && !options.ids.includes(shape.id)) continue;
  try {
    await fromShape(shape);
  } catch (error) {
    console.error(`Échec : ${shape.id} (${error instanceof Error ? error.message : error})`);
    problems++;
  }
}

if (problems > 0) process.exit(1);
