#!/usr/bin/env node
/**
 * COUVERTURE DES IMAGES DE TUILE SUR LE CONTENU RÉEL, ET FUITES PÉDAGOGIQUES.
 *
 *     node scripts/item-pictures-coverage.mjs <dossier> [--class CI] [--out rapport.json]
 *         [--details exercices.json] [--wave2 mots.json] [--things choses.json] [--top 80]
 *         [--judgments jugements.json] [--quiet]
 *
 * `<dossier>` est un export de la production, en lecture seule : `exercises.jsonl`
 * (un exercice par ligne : _id, type, prompt, payload, palierId), `paliers.jsonl`
 * (_id, topicId, class) et `topics.jsonl` (_id, class, programmeKey, name). On ne
 * garde que les exercices dont le palier appartient à un sujet de la classe
 * `--class` (par défaut la première de `PICTURE_TILE_CLASSES`, le CI).
 *
 * CE QUE L'ÉLÈVE VOIT, ET RIEN D'AUTRE. Le script ne refait aucune règle : il
 * charge, avec jiti, les vrais modules du site.
 *   - `sanitizePayload` (`convex/paliers/exerciseRules.ts`) : le payload tel que
 *     le serveur l'envoie à l'écran (la réponse retirée, `pairs` devenu `left` et
 *     `right`, `correctSequence` devenu `items`). Le mélange ne change pas les
 *     tuiles, seulement leur ordre : la couverture n'en dépend pas.
 *   - `explainTilePictures` (`lib/item-pictures.ts`) : l'image de chaque tuile,
 *     garde-fous compris, et le garde-fou qui a tout retiré, avec ce que chaque
 *     écran lui passe (`groupsOf`). `groupsOf` est écrit d'après `QcmExercise`,
 *     `OrderExercise`, `MatchExercise` et `DragDropExercise` : un écran dont le
 *     contexte change (un garde-fou de plus, une prop de plus) doit changer ici
 *     aussi, sans quoi le rapport décrit un écran qui n'existe plus.
 *   - `glyphTilesOf` (`components/exercises/tile-picture.tsx`) : les tuiles « que
 *     des glyphes » de l'autre côté, pour l'association et le glisser-déposer.
 * Si l'un de ces fichiers change, le rapport change avec lui. Rien n'est écrit
 * dans `lib/`, ni dans `convex/`, ni dans les données.
 *
 * LE RAPPORT (`--out`, par défaut `<dossier>/coverage.json`, et un résumé à
 * l'écran) donne, par type d'exercice et par thème (`programmeKey`) :
 *   - `exercises`   les exercices jouables (un exercice « cassé », que l'écran
 *                   saute, est compté à part : `broken`) ;
 *   - `wordTiles`   les tuiles qui portent au moins une lettre (les tuiles de
 *                   chiffres, de formes et d'émojis n'en sont pas) ;
 *   - `nameTiles`   parmi elles, celles qui ont la forme d'un nom : trois mots au
 *                   plus, pas de chiffre (une phrase, un calcul n'en sont pas) ;
 *   - `pictured`    les tuiles qui montrent une image, une fois les garde-fous
 *                   passés ; `rawPictured` celles qui en auraient une sans eux ;
 *   - `exercisesWithPicture`  les exercices dont au moins une tuile a une image ;
 *   - `exercisesCut`  les exercices où un garde-fou a tout coupé, avec LEQUEL
 *                   (`TILE_GUARDS` de la lib) : `cutBy.a` (l'énoncé demande de lire,
 *                   de décoder, de ranger des mots, de nommer ou de traduire),
 *                   `cutBy.b` (l'énoncé montre l'émoji de la chose), `cutBy.c`
 *                   (l'autre côté de l'association la montre en émojis), `cutBy.d`
 *                   (un QCM aux images partielles), `cutBy.e` (l'image d'énoncé est
 *                   celle d'une tuile), `cutBy.f` (la même image des deux côtés).
 *                   Une association dont un seul côté est coupé compte dans
 *                   `exercisesPartlyCut`.
 * Une AUTO-VÉRIFICATION relit l'invariant de la lib : un groupe dont un garde-fou
 * a joué n'a plus aucune image, un groupe que rien n'a coupé garde exactement les
 * images reconnues (`selfCheck.disagreements` doit rester à 0 ; le script sort
 * alors avec le code 2 si ce n'est pas le cas).
 *
 * LA DEUXIÈME VAGUE (`--wave2`). Les tuiles-mots sans image faute d'entrée au
 * catalogue, groupées par mot (sans émoji de tête ni article), avec leur
 * fréquence, leurs thèmes et l'émoji qui les ouvre. Trois sortes de tuiles n'y
 * sont PAS des images à fabriquer : les pluriels d'un mot du catalogue (« ronds »,
 * « bicyclettes » : la règle d'exactitude de la lib les écarte), le mot ambigu
 * seul (« orange ») et les groupes à préposition (« sous la table », « à midi »).
 * `--things` est un fichier JSON `{ "mots": { "<mot normalisé>": { "kind": "...",
 * "aussi": ["<autre forme>"], "note": "..." } } }` écrit à la main : les mots JUGÉS
 * NOMS DE CHOSES (ni verbe, ni prénom, ni jour, ni nombre, ni catégorie
 * abstraite). Il sert à chiffrer la couverture de ce que la règle demande
 * vraiment (une tuile qui NOMME une chose), et non de toutes les tuiles qui
 * portent des lettres ; `--top` borne la liste écrite (80 par défaut).
 *
 * LES FUITES. Une image ne doit jamais donner la réponse d'un exercice de lecture,
 * de décodage ou de traduction. Les règles R1 à R6 de `CANDIDATE_RULES` ont été
 * proposées par ce script, vérifiées sur la production (elles coupaient 15, 12, 3, 5,
 * 0 et 11 exercices, tous à raison), puis ADOPTÉES dans `lib/item-pictures.ts` (les
 * garde-fous a, b, c et f) : elles ne coupent plus rien de plus, et le rapport le dit
 * (« coupe 0 »). Elles restent ici pour éprouver une règle de plus, et leurs sondes
 * (des exercices fabriqués qu'elle doit couper ou laisser) vérifient que la lib les
 * tient toujours. `RELAXING_RULES` propose l'assouplissement d'un garde-fou qui
 * coupe trop (S1), que la lib n'applique PAS : c'est une décision du propriétaire.
 * Le rapport liste, pour chaque règle, les exercices qu'elle couperait (ou
 * rétablirait). Avec `--judgments` (un fichier `{ "<id
 * d'exercice>": { "verdict": "a" | "b" | "c", "note": "..." } }` écrit en lisant
 * les exercices), il dit aussi lesquels elle coupe à tort. Verdicts : `a` l'image
 * aide à comprendre ce qui est demandé (voulu), `b` l'image donne la réponse d'un
 * exercice de lecture, de décodage ou de traduction (à empêcher), `c` neutre. Le
 * rapport donne aussi, pour les QCM, si le motif « cette option a une image, celle-là
 * non » désigne la bonne réponse par élimination (`asymmetry`). Les règles
 * s'importent aussi (`CANDIDATE_RULES`, `analyseExercise`) pour les éprouver sur
 * d'autres exercices que ceux de la production : les tirages des gabarits de
 * `convex/paliers/games/`, par exemple.
 *
 * `--details` écrit, pour chaque exercice qui aurait au moins une image sans
 * les garde-fous, l'énoncé, les tuiles et l'image de chacune : de quoi relire.
 *
 * jiti n'est qu'une dépendance d'eslint : pnpm ne l'expose pas à la racine, on le
 * cherche dans `node_modules/.pnpm`. Le fichier s'importe aussi comme un module
 * (`loadSite`, `analyseExercise`, `CANDIDATE_RULES`) : le script ne s'exécute que
 * lancé en ligne de commande.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Les types d'exercice dont les tuiles montrent des images (`docs/paliers-et-exercices.md`). */
export const TYPES = ["qcm", "order", "match", "drag-drop"];

/** Au plus ce nombre de mots pour une tuile qui a « la forme d'un nom » (`FALLBACK_MAX_WORDS` de la lib). */
const NAME_MAX_WORDS = 3;

/** Les garde-fous de la lib, dans l'ordre où `resolveTilePictures` les applique. */
const GUARDS = ["a", "b", "c", "d", "e", "f"];

/* ── Les arguments ──────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const args = { folder: null, flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage(console.log);
      process.exit(0);
    }
    if (arg === "--quiet") args.flags.quiet = true;
    else if (arg.startsWith("--")) {
      const value = argv[++i];
      if (value === undefined) fail(`${arg} attend une valeur.`);
      args.flags[arg.slice(2)] = value;
    } else if (args.folder === null) args.folder = arg;
    else fail(`Argument en trop : ${arg}`);
  }
  return args;
}

function usage(print) {
  print("Usage : node scripts/item-pictures-coverage.mjs <dossier> [--class CI] [--out rapport.json]");
  print("        [--details exercices.json] [--wave2 mots.json] [--things choses.json] [--top 80] [--judgments jugements.json] [--quiet]");
}

function fail(message) {
  console.error(`item-pictures-coverage : ${message}`);
  usage(console.error);
  process.exit(1);
}

/* ── Les modules du site, chargés avec jiti ─────────────────────────────── */

async function loadJiti() {
  const pnpm = join(root, "node_modules", ".pnpm");
  const folder = existsSync(pnpm) ? readdirSync(pnpm).find((name) => name.startsWith("jiti@")) : undefined;
  if (!folder) fail("jiti introuvable dans node_modules/.pnpm (pnpm install).");
  const { createJiti } = await import(pathToFileURL(join(pnpm, folder, "node_modules/jiti/lib/jiti.mjs")).href);
  // Pas de cache sur disque : rien ne s'écrit dans le dépôt. `jsx` : tile-picture.tsx en contient.
  return createJiti(import.meta.url, { fsCache: false, moduleCache: false, jsx: true, alias: { "@": root } });
}

/** Les modules du site dont le rapport dépend, et jiti pour en charger d'autres. */
export async function loadSite() {
  const jiti = await loadJiti();
  const lib = await jiti.import(join(root, "lib/item-pictures.ts"));
  const images = await jiti.import(join(root, "lib/item-images.ts"));
  const rules = await jiti.import(join(root, "convex/paliers/exerciseRules.ts"));
  const tilePicture = await jiti.import(join(root, "components/exercises/tile-picture.tsx"));
  const exerciseImages = await jiti.import(join(root, "lib/exercise-images.ts"));
  return { jiti, root, lib, images, rules, exerciseImages, glyphTilesOf: tilePicture.glyphTilesOf };
}

/* ── L'export de la production ──────────────────────────────────────────── */

function readJsonl(file) {
  if (!existsSync(file)) fail(`Fichier absent : ${file}`);
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function readJson(file, what) {
  if (!existsSync(file)) fail(`${what} absent : ${file}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

/* ── Les tuiles de chaque écran ─────────────────────────────────────────── */

const isString = (value) => typeof value === "string";

/**
 * Les groupes de tuiles qu'un écran résout, avec ce qu'il passe à
 * `useTilePictures` (`ctx`, sans l'énoncé ni l'image d'énoncé, que `analyseExercise`
 * ajoute). `payload` est celui que le serveur envoie (`sanitizePayload`). Rend `null`
 * quand l'écran saute l'exercice (« Cet exercice est cassé, on te le saute »).
 *
 *   qcm        `QcmExercise`        les options, `choice` ;
 *   order      `OrderExercise`      les étiquettes (`items`, à défaut `correctSequence`) ;
 *   match      `MatchExercise`      chaque côté, avec les tuiles « que des glyphes » de l'autre
 *                                   (`glyphTiles`) et les textes de l'autre côté (`counterpart`) ;
 *   drag-drop  `DragDropExercise`   les étiquettes et les cases, de même.
 *
 * COPIE DES ÉCRANS : si l'un d'eux change ce qu'il passe à `useTilePictures`, cette
 * fonction doit le suivre.
 */
export function groupsOf(type, payload, glyphTilesOf) {
  switch (type) {
    case "qcm": {
      const options = Array.isArray(payload?.options) ? payload.options.filter(isString) : [];
      return options.length < 2 ? null : [{ name: "options", tiles: options, ctx: { choice: true } }];
    }
    case "order": {
      const source = Array.isArray(payload?.items)
        ? payload.items.filter(isString)
        : Array.isArray(payload?.correctSequence)
          ? payload.correctSequence.filter(isString)
          : [];
      return source.length < 2 ? null : [{ name: "items", tiles: source, ctx: {} }];
    }
    case "match": {
      const left = Array.isArray(payload?.left) ? payload.left : [];
      const right = Array.isArray(payload?.right) ? payload.right : [];
      if (left.length === 0 || right.length !== left.length) return null;
      return [
        { name: "left", tiles: left, glyphTiles: glyphTilesOf(right), ctx: { glyphTiles: glyphTilesOf(right), counterpart: right } },
        { name: "right", tiles: right, glyphTiles: glyphTilesOf(left), ctx: { glyphTiles: glyphTilesOf(left), counterpart: left } },
      ];
    }
    case "drag-drop": {
      const zones = Array.isArray(payload?.zones) ? payload.zones.filter(isString) : [];
      const items = Array.isArray(payload?.items)
        ? payload.items.filter((item) => !!item && typeof item === "object" && isString(item.text))
        : [];
      if (zones.length < 2 || items.length < 2) return null;
      const itemTexts = items.map((item) => item.text);
      return [
        { name: "items", tiles: itemTexts, glyphTiles: glyphTilesOf(zones), ctx: { glyphTiles: glyphTilesOf(zones), counterpart: zones } },
        { name: "zones", tiles: zones, glyphTiles: glyphTilesOf(itemTexts), ctx: { glyphTiles: glyphTilesOf(itemTexts), counterpart: itemTexts } },
      ];
    }
    default:
      return null;
  }
}

/* ── Un exercice, tel que l'élève le voit ───────────────────────────────── */

/**
 * Passe un exercice de la production dans la chaîne de l'écran. Rend `null` si
 * l'écran le saute. `entry.groups[i]` porte `tiles`, `raw` (l'image de chaque
 * tuile reconnue, avant les garde-fous), `final` (après), `fired` (le garde-fou qui a
 * tout retiré, dit par la lib : `explainTilePictures`) ; `entry.disagreements` liste
 * les groupes qui contredisent l'invariant de la lib.
 */
export function analyseExercise(site, exo, programmeKey) {
  const { lib } = site;
  const payload = site.rules.sanitizePayload(exo.type, exo.payload, String(exo._id), "couverture");
  const groups = groupsOf(exo.type, payload, site.glyphTilesOf);
  if (!groups) return null;
  const prompt = exo.prompt;
  const exerciseImage = site.exerciseImages.exerciseImageIdOf(payload) ?? undefined;
  const disagreements = [];
  let groupsChecked = 0;
  for (const group of groups) {
    const explained = lib.explainTilePictures(group.tiles, { prompt, ...group.ctx, exerciseImage });
    group.raw = explained.recognized;
    group.final = explained.pictures;
    group.fired = explained.guard ? [explained.guard] : [];
    const named = group.raw.filter(Boolean);
    if (named.length > 0) {
      groupsChecked++;
      // L'invariant : un garde-fou qui a joué ne laisse aucune image ; sinon les images reconnues restent.
      const noneLeft = group.final.every((picture) => picture === null);
      const sameAsRecognized = group.final.every((picture, index) => picture === group.raw[index]);
      const consistent = explained.guard ? noneLeft : sameAsRecognized;
      if (!consistent) disagreements.push({ id: exo._id, group: group.name, fired: group.fired, libCut: noneLeft });
    }
  }
  const all = (pick) => groups.flatMap((group) => group[pick].filter(Boolean));
  const pictured = all("final").length;
  const rawPictured = all("raw").length;
  const groupsWithRaw = groups.filter((group) => group.raw.some(Boolean)).length;
  const groupsKept = groups.filter((group) => group.final.some(Boolean)).length;
  const fired = GUARDS.filter((guard) => groups.some((group) => group.fired.includes(guard)));
  return {
    exo,
    id: exo._id,
    type: exo.type,
    programmeKey,
    prompt,
    payload,
    groups,
    pictured,
    rawPictured,
    cut: rawPictured > 0 && pictured === 0,
    partlyCut: groupsWithRaw > groupsKept && groupsKept > 0,
    fired,
    groupsChecked,
    disagreements,
  };
}

/** Un exercice fabriqué à la main pour une sonde : mêmes étapes que la production. */
export function probeEntry(site, probe) {
  const exo = { _id: "sonde", type: probe.type, prompt: probe.prompt, payload: probe.payload };
  return analyseExercise(site, exo, "(sonde)");
}

/* ── Les compteurs ──────────────────────────────────────────────────────── */

function emptyStats() {
  return {
    exercises: 0,
    broken: 0,
    tiles: 0,
    wordTiles: 0,
    nameTiles: 0,
    pictured: 0,
    rawPictured: 0,
    exercisesWithPicture: 0,
    exercisesWithRawPicture: 0,
    exercisesCut: 0,
    cutBy: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 },
    exercisesPartlyCut: 0,
  };
}

function addStats(into, from) {
  for (const key of Object.keys(into)) {
    if (key === "cutBy") for (const guard of GUARDS) into.cutBy[guard] += from.cutBy[guard];
    else into[key] += from[key];
  }
}

const percent = (part, whole) => (whole === 0 ? null : Math.round((1000 * part) / whole) / 10);

function withPercents(stats) {
  return {
    ...stats,
    picturedOfWordTilesPercent: percent(stats.pictured, stats.wordTiles),
    picturedOfNameTilesPercent: percent(stats.pictured, stats.nameTiles),
    exercisesWithPicturePercent: percent(stats.exercisesWithPicture, stats.exercises),
  };
}

/** Une tuile « a la forme d'un nom » : au plus trois mots, pas de chiffre. `label` est normalisé. */
const nameShaped = (label) => !/\p{N}/u.test(label) && label.split(" ").length <= NAME_MAX_WORDS;

function statsOf(entry, site) {
  const stats = emptyStats();
  if (!entry) {
    stats.broken = 1;
    return stats;
  }
  stats.exercises = 1;
  for (const group of entry.groups) {
    group.tiles.forEach((tile, index) => {
      stats.tiles++;
      if (!isString(tile) || !/\p{L}/u.test(tile)) return;
      stats.wordTiles++;
      const label = site.images.normalizeWord(site.lib.splitTile(tile).rest || tile);
      if (nameShaped(label)) stats.nameTiles++;
      if (group.final[index]) stats.pictured++;
      if (group.raw[index]) stats.rawPictured++;
    });
  }
  if (entry.pictured > 0) stats.exercisesWithPicture = 1;
  if (entry.rawPictured > 0) stats.exercisesWithRawPicture = 1;
  if (entry.cut) {
    stats.exercisesCut = 1;
    const primary = entry.fired[0];
    if (primary) stats.cutBy[primary] = 1;
  }
  if (entry.partlyCut) stats.exercisesPartlyCut = 1;
  return stats;
}

/* ── La deuxième vague : les tuiles-mots sans image ─────────────────────── */

/** Les prépositions qui ouvrent un groupe de lieu ou de temps (sur un texte normalisé). */
const PREPOSITION = /^(?:a cote de|a|au|aux|en|dans|sur|sous|chez|vers|devant|derriere|pres de|loin de|avec|pour|sans|par) /;

/** Le singulier d'un pluriel simple (s, x, aux) qui est un mot du catalogue, ou `null`. */
function catalogueSingular(word, images) {
  const forms = [];
  if (word.endsWith("aux")) forms.push(`${word.slice(0, -3)}al`);
  if (word.endsWith("s") || word.endsWith("x")) forms.push(word.slice(0, -1));
  for (const form of forms) {
    const hit = images.findItemImageByWord(form);
    if (hit) return hit;
  }
  return null;
}

/**
 * Ce que la lib écarte exprès, et que le catalogue pourrait pourtant servir (`null`
 * si rien). `samples` : les tuiles telles qu'écrites, pour distinguer la préposition
 * « à » du verbe « a » (le mot normalisé n'a plus d'accent).
 */
function whyNoPicture(word, site, samples) {
  const { lib, images } = site;
  const plural = catalogueSingular(word, images);
  if (plural) return { reason: "pluriel", imageId: plural.id };
  const hit = images.findItemImageByWord(word);
  if (hit?.ambiguousBare) return { reason: "ambigu", imageId: hit.id };
  const prefix = PREPOSITION.exec(word);
  const verbA = prefix?.[0] === "a " && !samples.some((sample) => /^à\s/iu.test(lib.splitTile(sample).rest));
  if (prefix && !verbA) {
    const rest = lib.stripArticle(word.slice(prefix[0].length)).word;
    const near = rest ? images.findItemImageByWord(rest) : null;
    if (near) return { reason: "préposition", imageId: near.id };
  }
  return null;
}

/** L'écriture d'un mot telle qu'on la lit sur une tuile : sans émoji de tête, article ni ponctuation finale. */
function displayWord(sample, site) {
  const rest = site.lib.splitTile(sample).rest || sample;
  return rest
    .replace(/[\s.,;:!?…]+$/u, "")
    .replace(/^(?:de la |de l'|de l’|les |des |une |un |du |le |la |l'|l’)/iu, "")
    .trim()
    .toLocaleLowerCase("fr");
}

function collectUnmatched(into, entry, site) {
  for (const group of entry.groups) {
    group.tiles.forEach((tile, index) => {
      if (!isString(tile) || !/\p{L}/u.test(tile) || group.raw[index]) return;
      const { emoji, rest } = site.lib.splitTile(tile);
      const label = site.images.normalizeWord(rest || tile);
      if (!nameShaped(label)) return;
      const { word } = site.lib.stripArticle(label);
      if (!word) return;
      let record = into.get(word);
      if (!record) {
        record = { word, count: 0, exerciseIds: new Set(), samples: [], themes: {}, types: {}, emojiHeads: {} };
        into.set(word, record);
      }
      record.count++;
      record.exerciseIds.add(entry.id);
      if (record.samples.length < 3 && !record.samples.includes(tile)) record.samples.push(tile);
      record.themes[entry.programmeKey] = (record.themes[entry.programmeKey] ?? 0) + 1;
      record.types[entry.type] = (record.types[entry.type] ?? 0) + 1;
      if (emoji) record.emojiHeads[emoji] = (record.emojiHeads[emoji] ?? 0) + 1;
    });
  }
}

/** Les mots sans image, dans la forme du fichier `--wave2`. */
function buildWave2(unmatched, things, site, top) {
  const records = [...unmatched.values()].map((record) => ({
    word: displayWord(record.samples[0], site),
    key: record.word,
    count: record.count,
    exercises: record.exerciseIds.size,
    themes: record.themes,
    types: record.types,
    emojiHeads: record.emojiHeads,
    samples: record.samples,
    why: whyNoPicture(record.word, site, record.samples),
  }));
  const byKey = new Map(records.map((record) => [record.key, record]));

  // Les mots jugés « choses », leurs autres formes (« fleurs » pour « fleur ») ramenées à eux.
  const merged = [];
  const absorbed = new Set();
  const unknownThingKeys = [];
  if (things) {
    for (const [key, info] of Object.entries(things.mots)) {
      const main = byKey.get(key);
      const others = (info.aussi ?? []).map((other) => byKey.get(other)).filter(Boolean);
      // Un mot de `--things` absent des tuiles : une faute de frappe, ou un export plus récent.
      if (!main && others.length === 0) {
        unknownThingKeys.push(key);
        continue;
      }
      const forms = [main, ...others].filter(Boolean);
      for (const form of forms) absorbed.add(form.key);
      const sum = (pick) => forms.reduce((total, form) => total + pick(form), 0);
      const mergeCounts = (name) =>
        forms.reduce((acc, form) => {
          for (const [k, n] of Object.entries(form[name])) acc[k] = (acc[k] ?? 0) + n;
          return acc;
        }, {});
      merged.push({
        word: (main ?? others[0]).word,
        key,
        kind: info.kind,
        count: sum((form) => form.count),
        exercises: sum((form) => form.exercises),
        themes: mergeCounts("themes"),
        types: mergeCounts("types"),
        emojiHeads: mergeCounts("emojiHeads"),
        samples: forms.flatMap((form) => form.samples).slice(0, 3),
        forms: forms.map((form) => form.key),
        ...(info.note ? { note: info.note } : {}),
      });
    }
    merged.sort((x, y) => y.count - x.count || x.word.localeCompare(y.word, "fr"));
  }

  const ranked = (list) => list.map((item, index) => ({ rank: index + 1, ...item }));
  const sortByCount = (list) => [...list].sort((x, y) => y.count - x.count || x.word.localeCompare(y.word, "fr"));
  const wanted = merged.filter((item) => item.kind !== "personne");
  const free = records.filter((record) => !absorbed.has(record.key));
  const occurrences = (list) => list.reduce((total, item) => total + item.count, 0);
  const plurals = free.filter((record) => record.why?.reason === "pluriel");
  const ambiguous = free.filter((record) => record.why?.reason === "ambigu");
  // Les tuiles qui nomment une chose sans avoir d'image, thème par thème (pluriels et mot ambigu compris).
  const thingTilesByTheme = {};
  for (const item of [...wanted, ...plurals, ...ambiguous]) {
    for (const [theme, n] of Object.entries(item.themes)) thingTilesByTheme[theme] = (thingTilesByTheme[theme] ?? 0) + n;
  }
  return {
    criteria:
      "Tuiles-mots (au plus 3 mots, sans chiffre) des exercices qcm, ordre, association et glisser-déposer du CI, sans image faute d'entrée au catalogue " +
      "(pas coupées par un garde-fou). `words` : les mots jugés noms de choses, du plus fréquent au moins fréquent. Les pluriels d'un mot du catalogue, " +
      "le mot ambigu seul et les groupes à préposition sont à part : ce n'est pas une image à fabriquer.",
    distinctUnmatchedWords: records.length,
    unmatchedTileOccurrences: occurrences(records),
    thingWords: things ? wanted.length : null,
    thingTiles: things ? occurrences(wanted) : null,
    unknownThingKeys,
    pluralTiles: occurrences(plurals),
    ambiguousTiles: occurrences(ambiguous),
    thingTilesByTheme,
    words: things ? ranked(wanted.slice(0, top)) : [],
    outOfScope: things ? ranked(merged.filter((item) => item.kind === "personne")) : [],
    pluralOfCatalogue: ranked(sortByCount(plurals)),
    ambiguousBare: ranked(sortByCount(ambiguous)),
    prepositionPhrases: ranked(sortByCount(free.filter((record) => record.why?.reason === "préposition"))),
    // Le reste : sans `--things`, les candidats à juger ; avec lui, ce qu'on a jugé autre chose qu'un nom de chose.
    [things ? "notThings" : "candidates"]: sortByCount(free.filter((record) => !record.why)),
  };
}

/* ── Le motif d'images d'un QCM désigne-t-il la bonne réponse ? ─────────── */

/**
 * Dans un QCM où seules certaines options ont une image, l'enfant qui ne lit pas
 * voit une option « à part ». Si c'était la bonne, l'image la désignerait par
 * élimination. On compte, avec la clé de réponse (que l'écran n'a pas), combien
 * de fois le motif isole la bonne réponse, et combien de fois une mauvaise : au
 * hasard, une option sur trois (QCM de trois options) est isolée à bon escient.
 */
function asymmetryOf(entries, site) {
  const result = { qcmWithPicture: 0, mixed: 0, singlesOutCorrect: 0, singlesOutWrong: 0, neither: 0, singledOut: [] };
  for (const entry of entries) {
    if (entry.type !== "qcm" || entry.pictured === 0) continue;
    result.qcmWithPicture++;
    const group = entry.groups[0];
    const options = entry.exo.payload?.options;
    const correct = Array.isArray(options) ? options[entry.exo.payload.correctIndex] : undefined;
    if (!isString(correct)) continue;
    const named = group.tiles
      .map((tile, index) => ({ tile, picture: group.final[index] }))
      .filter(({ tile }) => /\p{L}/u.test(tile) && nameShaped(site.images.normalizeWord(site.lib.splitTile(tile).rest || tile)));
    const withPicture = named.filter((item) => item.picture).length;
    const without = named.length - withPicture;
    const correctTile = named.find((item) => item.tile === correct);
    if (withPicture === 0 || without === 0 || !correctTile) continue;
    result.mixed++;
    const correctHasPicture = correctTile.picture != null;
    const singlesOutCorrect = (withPicture === 1 && correctHasPicture) || (without === 1 && !correctHasPicture);
    const singlesOutWrong = (withPicture === 1 && !correctHasPicture) || (without === 1 && correctHasPicture);
    if (singlesOutCorrect) {
      result.singlesOutCorrect++;
      result.singledOut.push({ id: entry.id, programmeKey: entry.programmeKey, prompt: entry.prompt });
    } else if (singlesOutWrong) result.singlesOutWrong++;
    else result.neither++;
  }
  return result;
}

/* ── Les règles candidates ──────────────────────────────────────────────── */

/** L'énoncé tel qu'une règle le lit : un seul point de code par lettre accentuée, apostrophe droite. */
const promptOf = (entry) => (isString(entry.prompt) ? entry.prompt.normalize("NFC").replace(/[‘’ʼ′]/g, "'") : "");

/* Les énoncés des règles R1, R2, R4 et R5 sont ceux de la lib (`DECODING_PROMPT`,
   `NAMING_PROMPT`, `SENTENCE_PROMPT`, `TRANSLATION_PROMPT`), lus par `site.lib` : une
   règle adoptée n'a qu'une définition, et la lire ici ne peut pas dériver de ce que
   l'écran applique. Les émojis de forme et de solide de la règle R6 sont les
   `guardEmoji` du catalogue, que `itemImagesInText` lit. */

/** Les ids d'images que les émojis d'un texte désignent (les glyphes larges des garde-fous compris). */
function imageIdsInText(site, text) {
  return new Set(site.lib.itemImagesInText(text).map((image) => image.id));
}

/** Les ids d'images des tuiles qui en ont une (après les garde-fous). */
const shownIds = (group) => group.final.filter(Boolean).map((picture) => picture.id);

/**
 * Les garde-fous proposés par ce script. R1 à R6 sont ADOPTÉS par `lib/item-pictures.ts`
 * (R1, R2, R4 et R5 dans le garde-fou a, R6 dans les garde-fous b et c par les
 * `guardEmoji` du catalogue, R3 dans le garde-fou f) : le rapport montre qu'ils ne
 * coupent plus rien de plus. Une règle de plus s'écrit ici d'abord, comme eux, avant
 * d'entrer dans la lib. Chacune est une fonction PURE de l'exercice analysé
 * (`entry` : `type`, `prompt`, `programmeKey`, `groups`) qui dit s'il faut
 * retirer TOUTES les images, comme les garde-fous de la lib (épargner une tuile
 * désignerait la bonne par élimination). Elles ne s'appliquent qu'aux exercices
 * qui montrent encore une image. `probes` : des exercices fabriqués que la règle doit
 * couper (`cut`) ou laisser (`keep`).
 */
export const CANDIDATE_RULES = [
  {
    id: "R1",
    title: "Décodage : l'énoncé parle d'une syllabe ou d'une lettre",
    rule: "prompt ~ /syllabe|lettre|majuscule|minuscule|(commence|finit) par/ (tous les types)",
    why: "« Quel mot commence par la syllabe « pou » ? », « Relie chaque syllabe au mot qui commence par elle » : l'enfant doit LIRE les mots (c'est le CI, les sons). Une image sur certains mots lui permet de répondre à l'oral, et le motif des images isole une option. Un mot du catalogue qui est aussi une syllabe (« pen », le stylo anglais) reçoit une image absurde.",
    applies: (entry, site) => site.lib.DECODING_PROMPT.test(promptOf(entry)),
    probes: {
      cut: [
        { type: "qcm", prompt: "Quel mot commence par la syllabe « pou » ?", payload: { options: ["bonbon", "poule", "tata"], correctIndex: 1 } },
        { type: "qcm", prompt: "Par quelle syllabe commence « penda » ?", payload: { options: ["lo", "pen", "lou"], correctIndex: 1 } },
        {
          type: "match",
          prompt: "Relie chaque syllabe au mot qui commence par elle.",
          payload: { pairs: [{ left: "pou", right: "poule" }, { left: "mi", right: "midi" }] },
        },
      ],
      keep: [{ type: "qcm", prompt: "Quel animal est le plus grand ?", payload: { options: ["🐜 la fourmi", "🦒 la girafe"], correctIndex: 1 } }],
    },
  },
  {
    id: "R2",
    title: "Nommer : l'énoncé demande le nom de ce qu'il montre",
    rule: "prompt ~ /quel est le nom (du|de|d')|comment s'appelle|comment appelle-t-on/ (tous les types)",
    why: "« Quel est le nom du solide qui ressemble à cet objet ? 🎲 » : l'énoncé montre l'objet en émoji, les tuiles montrent les solides dessinés, l'enfant apparie les deux images sans connaître un seul nom. Les garde-fous b et c ne le voient pas : le dé, la brique et la boîte de conserve ne sont pas des émojis du catalogue, et le cylindre n'a pas d'image (la seule option sans image est alors la bonne).",
    applies: (entry, site) => site.lib.NAMING_PROMPT.test(promptOf(entry)),
    probes: {
      cut: [
        { type: "qcm", prompt: "Quel est le nom du solide qui ressemble à cet objet ? 🎲", payload: { options: ["la boule", "le cube", "le cylindre"], correctIndex: 1 } },
        { type: "qcm", prompt: "Quel est le nom de cette forme ? 🔺", payload: { options: ["le rond", "le carré", "le triangle"], correctIndex: 2 } },
      ],
      keep: [{ type: "qcm", prompt: "Quelle forme est ronde ?", payload: { options: ["Carré", "Cœur", "Rond"], correctIndex: 2 } }],
    },
  },
  {
    id: "R3",
    title: "Même image des deux côtés",
    rule: "une même image sur au moins deux tuiles de l'exercice (association, glisser-déposer)",
    why: "« Arachide » face à « Cacahuète » (deux noms de la même image) : l'enfant relie les deux dessins identiques, sans savoir ce qu'est la plante ni son fruit.",
    applies: (entry) => {
      const ids = entry.groups.flatMap(shownIds);
      return new Set(ids).size < ids.length;
    },
    probes: {
      cut: [
        {
          type: "match",
          prompt: "Associe chaque plante à son fruit.",
          payload: { pairs: [{ left: "Arachide", right: "Cacahuète" }, { left: "Manguier", right: "Mangue" }] },
        },
      ],
      keep: [{ type: "match", prompt: "Relie l'animal à son habitat.", payload: { pairs: [{ left: "Lion", right: "Terre" }, { left: "Poisson", right: "Eau" }] } }],
    },
  },
  {
    id: "R4",
    title: "Mots d'une phrase à ranger",
    rule: "type order ou drag-drop, et prompt ~ « mots … dans l'ordre / dans le bon ordre / dans la bonne phrase / une phrase »",
    why: "« Remets les mots dans l'ordre » : les tuiles sont les mots d'une phrase (« Fatou a une mangue »), pas des noms de choses. L'image identifie le seul nom, qui est toujours le dernier mot de la phrase : une place sur quatre est donnée, et la lecture des autres mots n'est plus qu'à moitié nécessaire.",
    applies: (entry, site) => (entry.type === "order" || entry.type === "drag-drop") && site.lib.SENTENCE_PROMPT.test(promptOf(entry)),
    probes: {
      cut: [
        { type: "order", prompt: "Remets les mots dans l'ordre.", payload: { correctSequence: ["Cheikh", "a", "un", "chat."] } },
        { type: "drag-drop", prompt: "Mets les mots dans l'ordre : une, Fatou, mangue, a.", payload: { items: [{ text: "une", correctZone: "Z" }, { text: "mangue", correctZone: "Z" }], zones: ["Fatou a une mangue.", "Mots mélangés."] } },
      ],
      keep: [
        { type: "order", prompt: "Mets ces animaux dans l'ordre, du plus léger au plus lourd.", payload: { correctSequence: ["🐜 la fourmi", "🐕 le chien", "🐄 la vache"] } },
        { type: "order", prompt: "Classe ces mots par ordre de croissance.", payload: { correctSequence: ["œuf", "poussin", "poule"] } },
      ],
    },
  },
  {
    id: "R5",
    title: "Traduction : l'énoncé demande le mot dans l'autre langue",
    rule: "prompt ~ /en anglais|in english|comment dit-on|how do you say|que veut dire/ (tous les types)",
    why: "« Comment dit-on « chat » en anglais ? » avec les tuiles cat, dog, fish : l'image du chat sur « cat » donne la réponse sans que le mot anglais ait été entendu. Préventive : aucun exercice de la production ne la déclenche aujourd'hui (les QCM d'anglais du CI ont des émojis pour options).",
    applies: (entry, site) => site.lib.TRANSLATION_PROMPT.test(promptOf(entry)),
    probes: {
      cut: [
        { type: "qcm", prompt: "Comment dit-on « chat » en anglais ?", payload: { options: ["cat", "dog", "fish"], correctIndex: 0 } },
        { type: "qcm", prompt: "Que veut dire « dog » ?", payload: { options: ["chat", "chien", "poisson"], correctIndex: 1 } },
      ],
      keep: [{ type: "order", prompt: "Mets ces animaux dans l'ordre alphabétique.", payload: { correctSequence: ["cat", "dog", "fish"] } }],
    },
  },
  {
    id: "R6",
    title: "Les émojis de forme et de solide, vus par les garde-fous b et c",
    rule: "garde-fous b et c de la lib, avec les `guardEmoji` du catalogue (⬛ 🔴 🔺 ⭐ 💖 🎲 🧱…)",
    why: "« Associe chaque forme à son nom » avec ⭐ 💖 🔺 face aux mots Étoile, Cœur, Triangle : les six formes n'avaient pas d'émoji au catalogue (`emoji: []`, prudent : « [rond rouge] rouge » est la couleur), donc le garde-fou c ne voyait pas que le côté des mots montre les mêmes dessins. C'est une correction de DONNÉE (les listes `guardEmoji` de `lib/item-images.ts`, que seuls les garde-fous lisent), pas de code.",
    applies: (entry, site) => {
      const prompt = promptOf(entry);
      const fromPrompt = prompt ? imageIdsInText(site, prompt) : new Set();
      return entry.groups.some((group) => {
        const ids = shownIds(group);
        if (ids.length === 0) return false;
        if (ids.some((id) => fromPrompt.has(id))) return true;
        const fromOtherSide = new Set((group.glyphTiles ?? []).flatMap((tile) => [...imageIdsInText(site, tile)]));
        return ids.some((id) => fromOtherSide.has(id));
      });
    },
    probes: {
      cut: [
        { type: "qcm", prompt: "Quel est le nom de cette forme ? ⬛", payload: { options: ["le triangle", "le carré", "le rond"], correctIndex: 1 } },
        {
          type: "match",
          prompt: "Associe chaque forme à son nom.",
          payload: { pairs: [{ left: "⭐", right: "Étoile" }, { left: "💖", right: "Cœur" }, { left: "🔺", right: "Triangle" }] },
        },
      ],
      keep: [{ type: "qcm", prompt: "Quelle forme est ronde ?", payload: { options: ["Carré", "Cœur", "Rond"], correctIndex: 2 } }],
    },
  },
];

/**
 * Les assouplissements : des garde-fous de la lib qui coupent TROP. Une règle
 * `restore` s'évalue sur les exercices que la lib a coupés ; elle dit lesquels
 * retrouveraient leurs images.
 */
export const RELAXING_RULES = [
  {
    id: "S1",
    title: "Garde-fou b : l'énoncé montre une rangée, pas la réponse",
    rule: "ne pas couper quand TOUTES les images des tuiles sont celles que l'énoncé montre en émojis",
    why: "« Regarde la rangée 🐘 🍉 🐑 🐈. Lequel est le premier ? » : les quatre options sont dans la rangée, l'émoji de l'énoncé n'en désigne aucune plus qu'une autre, et la question porte sur la POSITION. Le garde-fou b y retire les images de 24 QCM de `ma-ci-espace` sans rien protéger. Le garde-fou a un sens quand l'émoji désigne UNE option parmi des distracteurs absents de l'énoncé (« Quel animal est-ce ? 🐘 » : l'éléphant, le lion, la girafe).",
    applies: (entry, site) => {
      if (!entry.cut || entry.fired.join("") !== "b") return false;
      const prompt = promptOf(entry);
      const shown = imageIdsInText(site, prompt);
      return entry.groups.every((group) => group.raw.filter(Boolean).every((picture) => shown.has(picture.id)));
    },
    probes: {
      restore: [{ type: "qcm", prompt: "Regarde la rangée 🐘 🍉 🐑 🐈. Lequel est le premier, en lisant de gauche à droite ?", payload: { options: ["🐘 l'éléphant", "🐑 le mouton", "🐈 le chat", "🍉 la pastèque"], correctIndex: 0 } }],
      stayCut: [{ type: "qcm", prompt: "Quel animal est-ce ? 🐘", payload: { options: ["l'éléphant", "le lion", "la girafe"], correctIndex: 0 } }],
    },
  },
];

/** Évalue une règle de coupe sur les exercices analysés, avec les jugements écrits en les relisant. */
export function evaluateCutRule(rule, entries, judgments, site) {
  const cut = entries.filter((entry) => entry.pictured > 0 && rule.applies(entry, site));
  const verdictOf = (entry) => judgments[entry.id]?.verdict;
  const label = (entry) => ({ id: entry.id, type: entry.type, programmeKey: entry.programmeKey, prompt: entry.prompt, verdict: verdictOf(entry) ?? null });
  const probes = { cutOk: 0, cutTotal: rule.probes.cut.length, keepOk: 0, keepTotal: rule.probes.keep.length, failures: [] };
  // Une règle ADOPTÉE par la lib coupe déjà l'exercice fabriqué : `entry.cut` le dit, et `applies`
  // (qui ne regarde que les images encore montrées) n'a plus rien à voir. Une règle pas encore
  // adoptée, elle, s'éprouve par `applies`. Une sonde « garde » ne doit être coupée ni par l'une ni par l'autre.
  for (const probe of rule.probes.cut) {
    const entry = probeEntry(site, probe);
    if (entry && (entry.cut || rule.applies(entry, site))) probes.cutOk++;
    else probes.failures.push({ expected: "coupe", prompt: probe.prompt });
  }
  for (const probe of rule.probes.keep) {
    const entry = probeEntry(site, probe);
    if (entry && !entry.cut && !rule.applies(entry, site)) probes.keepOk++;
    else probes.failures.push({ expected: "garde", prompt: probe.prompt });
  }
  return {
    id: rule.id,
    title: rule.title,
    rule: rule.rule,
    why: rule.why,
    cut: cut.length,
    cutRight: cut.filter((entry) => verdictOf(entry) === "b").map(label),
    cutWrong: cut.filter((entry) => ["a", "c"].includes(verdictOf(entry))).map(label),
    cutUnjudged: cut.filter((entry) => verdictOf(entry) === undefined).map(label),
    probes,
    cutIds: new Set(cut.map((entry) => entry.id)),
  };
}

export function evaluateRelaxingRule(rule, entries, judgments, site) {
  const restored = entries.filter((entry) => rule.applies(entry, site));
  const verdictOf = (entry) => judgments[entry.id]?.verdict;
  const label = (entry) => ({ id: entry.id, type: entry.type, programmeKey: entry.programmeKey, prompt: entry.prompt, verdict: verdictOf(entry) ?? null });
  const probes = { restoreOk: 0, restoreTotal: rule.probes.restore.length, stayCutOk: 0, stayCutTotal: rule.probes.stayCut.length, failures: [] };
  for (const probe of rule.probes.restore) {
    const entry = probeEntry(site, probe);
    if (entry && rule.applies(entry, site)) probes.restoreOk++;
    else probes.failures.push({ expected: "rétabli", prompt: probe.prompt });
  }
  for (const probe of rule.probes.stayCut) {
    const entry = probeEntry(site, probe);
    if (entry && entry.cut && !rule.applies(entry, site)) probes.stayCutOk++;
    else probes.failures.push({ expected: "reste coupé", prompt: probe.prompt });
  }
  return {
    id: rule.id,
    title: rule.title,
    rule: rule.rule,
    why: rule.why,
    restored: restored.length,
    restoredRight: restored.filter((entry) => verdictOf(entry) !== "b").map(label),
    restoredLeak: restored.filter((entry) => verdictOf(entry) === "b").map(label),
    restoredUnjudged: restored.filter((entry) => verdictOf(entry) === undefined).map(label),
    probes,
  };
}

/* ── Le calcul ──────────────────────────────────────────────────────────── */

async function main() {
  const { folder, flags } = parseArgs(process.argv.slice(2));
  if (!folder) fail("Il manque le dossier de l'export.");
  const dataDir = resolve(folder);

  const site = await loadSite();
  const klass = flags.class ?? site.lib.PICTURE_TILE_CLASSES[0];
  const topics = readJsonl(join(dataDir, "topics.jsonl"));
  const paliers = readJsonl(join(dataDir, "paliers.jsonl"));
  const exercises = readJsonl(join(dataDir, "exercises.jsonl"));
  const topicById = new Map(topics.map((topic) => [topic._id, topic]));
  const palierById = new Map(paliers.map((palier) => [palier._id, palier]));

  const things = flags.things ? readJson(resolve(flags.things), "Fichier --things") : null;
  const judgments = flags.judgments ? readJson(resolve(flags.judgments), "Fichier --judgments") : {};
  const top = Number(flags.top ?? 80);

  const total = emptyStats();
  const byType = Object.fromEntries(TYPES.map((type) => [type, emptyStats()]));
  const byTheme = new Map();
  const entries = [];
  const guardLists = Object.fromEntries(GUARDS.map((guard) => [guard, []]));
  const unmatched = new Map();
  const selfCheck = { groupsChecked: 0, disagreements: [] };
  let otherClass = 0;
  let otherType = 0;

  for (const exo of exercises) {
    const palier = palierById.get(exo.palierId);
    const topic = palier ? topicById.get(palier.topicId) : undefined;
    if (!topic || topic.class !== klass) {
      otherClass++;
      continue;
    }
    if (!TYPES.includes(exo.type)) {
      otherType++;
      continue;
    }
    const programmeKey = topic.programmeKey ?? "(sans programmeKey)";
    if (!byTheme.has(programmeKey)) {
      byTheme.set(programmeKey, {
        programmeKey,
        name: topic.name,
        total: emptyStats(),
        byType: Object.fromEntries(TYPES.map((type) => [type, emptyStats()])),
      });
    }
    const theme = byTheme.get(programmeKey);
    const entry = analyseExercise(site, exo, programmeKey);
    const stats = statsOf(entry, site);
    for (const target of [total, byType[exo.type], theme.total, theme.byType[exo.type]]) addStats(target, stats);
    if (!entry) continue;
    entries.push(entry);
    selfCheck.groupsChecked += entry.groupsChecked;
    selfCheck.disagreements.push(...entry.disagreements);
    collectUnmatched(unmatched, entry, site);
    if (entry.cut && entry.fired[0]) {
      guardLists[entry.fired[0]].push({ id: entry.id, type: entry.type, programmeKey, prompt: entry.prompt, also: entry.fired.slice(1) });
    }
  }

  const wave2 = buildWave2(unmatched, things, site, top);

  const cutRules = CANDIDATE_RULES.map((rule) => evaluateCutRule(rule, entries, judgments, site));
  const relaxingRules = RELAXING_RULES.map((rule) => evaluateRelaxingRule(rule, entries, judgments, site));

  // Les cas b encore visibles (la lib n'en protège pas) et ce que les règles en couvrent.
  const stillShown = entries.filter((entry) => entry.pictured > 0);
  const leaks = stillShown.filter((entry) => judgments[entry.id]?.verdict === "b");
  const coveredBy = new Map(leaks.map((entry) => [entry.id, cutRules.filter((rule) => rule.cutIds.has(entry.id)).map((rule) => rule.id)]));
  const leakSummary = {
    judged: Object.keys(judgments).length,
    verdicts: Object.values(judgments).reduce((acc, item) => ({ ...acc, [item.verdict]: (acc[item.verdict] ?? 0) + 1 }), {}),
    leaksStillShown: leaks.length,
    coveredByRules: leaks.filter((entry) => coveredBy.get(entry.id).length > 0).length,
    notCovered: leaks.filter((entry) => coveredBy.get(entry.id).length === 0).map((entry) => ({ id: entry.id, programmeKey: entry.programmeKey, prompt: entry.prompt, note: judgments[entry.id]?.note })),
    alreadyStoppedByLib: entries.filter((entry) => entry.cut && judgments[entry.id]?.verdict === "b").length,
  };

  const report = {
    meta: {
      class: klass,
      source: dataDir,
      generatedAt: new Date().toISOString(),
      exercisesInExport: exercises.length,
      exercisesOfClass: exercises.length - otherClass,
      skippedOtherType: otherType,
      catalogue: site.images.ITEM_IMAGES.length,
    },
    selfCheck,
    total: withPercents(total),
    byType: Object.fromEntries(TYPES.map((type) => [type, withPercents(byType[type])])),
    byTheme: [...byTheme.values()]
      .sort((x, y) => x.programmeKey.localeCompare(y.programmeKey))
      .map((theme) => {
        // Les tuiles qui nomment une chose et n'ont pas d'image, dans ce thème (avec `--things`).
        const without = things ? (wave2.thingTilesByTheme[theme.programmeKey] ?? 0) : null;
        return {
          programmeKey: theme.programmeKey,
          name: theme.name,
          total: withPercents(theme.total),
          byType: Object.fromEntries(TYPES.map((type) => [type, withPercents(theme.byType[type])])),
          thingTilesWithoutPicture: without,
          thingCoveragePercent: things ? percent(theme.total.pictured, theme.total.pictured + without) : null,
        };
      }),
    // La couverture de ce que la règle demande : une tuile qui NOMME une chose.
    thingCoverage: things
      ? {
          picturedNameTiles: total.pictured,
          cutByGuards: total.rawPictured - total.pictured,
          thingTilesWithoutPicture: wave2.thingTiles,
          pluralTilesOfCatalogue: wave2.pluralTiles,
          ambiguousBareTiles: wave2.ambiguousTiles,
          coveragePercent: percent(total.pictured, total.pictured + wave2.thingTiles + wave2.pluralTiles + wave2.ambiguousTiles),
          coverageWithGuardCutsPercent: percent(
            total.pictured,
            total.pictured + (total.rawPictured - total.pictured) + wave2.thingTiles + wave2.pluralTiles + wave2.ambiguousTiles,
          ),
        }
      : null,
    wave2: things
      ? {
          thingWords: wave2.thingWords,
          thingTiles: wave2.thingTiles,
          pluralWords: wave2.pluralOfCatalogue.length,
          pluralTiles: wave2.pluralTiles,
          notThingWords: wave2.notThings.length,
          notThingTiles: wave2.notThings.reduce((sum, item) => sum + item.count, 0),
          unknownThingKeys: wave2.unknownThingKeys,
          top: wave2.words.slice(0, 12).map((item) => ({ word: item.word, count: item.count })),
        }
      : null,
    guards: guardLists,
    asymmetry: asymmetryOf(entries, site),
    cutRules: cutRules.map(({ cutIds, ...rest }) => rest),
    relaxingRules,
    leaks: leakSummary,
  };

  const outFile = resolve(flags.out ?? join(dataDir, "coverage.json"));
  writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
  if (flags.details) writeFileSync(resolve(flags.details), `${JSON.stringify(detailsOf(entries), null, 2)}\n`);
  if (flags.wave2) writeFileSync(resolve(flags.wave2), `${JSON.stringify({ generatedAt: report.meta.generatedAt, ...wave2 }, null, 2)}\n`);

  if (!flags.quiet) printSummary(report, outFile);
  if (selfCheck.disagreements.length > 0) process.exitCode = 2;
}

/** Pour chaque exercice qui aurait une image sans les garde-fous : l'énoncé, les tuiles et l'image de chacune. */
function detailsOf(entries) {
  return entries
    .filter((entry) => entry.rawPictured > 0)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      programmeKey: entry.programmeKey,
      prompt: entry.prompt,
      groups: entry.groups.map((group) => ({
        name: group.name,
        tiles: group.tiles.map((text, index) => ({ text, picture: group.final[index]?.id ?? null, rawPicture: group.raw[index]?.id ?? null })),
        fired: group.fired,
      })),
    }));
}

/* ── Le résumé lisible ──────────────────────────────────────────────────── */

const pad = (value, width) => String(value ?? "-").padStart(width);
const pct = (value) => (value === null ? "-" : `${value}%`);

function row(label, stats, things) {
  const cut = stats.cutBy;
  return [
    label.padEnd(24),
    pad(stats.exercises, 5),
    pad(stats.wordTiles, 6),
    pad(stats.nameTiles, 6),
    pad(stats.pictured, 6),
    pad(pct(stats.picturedOfWordTilesPercent), 7),
    pad(pct(stats.picturedOfNameTilesPercent), 7),
    pad(stats.exercisesWithPicture, 6),
    pad(pct(stats.exercisesWithPicturePercent), 7),
    pad(`${stats.exercisesCut} (${cut.a}/${cut.b}/${cut.c}/${cut.d}/${cut.e}/${cut.f})`, 20),
    pad(stats.exercisesPartlyCut, 5),
    ...(things ? [pad(things.without, 6), pad(pct(things.percent), 8)] : []),
  ].join(" ");
}

function printSummary(report, outFile) {
  const withThings = report.thingCoverage !== null;
  const header = [
    "".padEnd(24),
    pad("exos", 5),
    pad("mots", 6),
    pad("noms", 6),
    pad("images", 6),
    pad("/mots", 7),
    pad("/noms", 7),
    pad("exos+", 6),
    pad("exos+%", 7),
    pad("coupés a/b/c/d/e/f", 20),
    pad("part", 5),
    ...(withThings ? [pad("choses-", 6), pad("choses%", 8)] : []),
  ].join(" ");
  const line = "-".repeat(header.length);
  console.log(`Couverture des images de tuile, classe ${report.meta.class}`);
  console.log(
    `${report.meta.exercisesOfClass} exercices de la classe, ${report.total.exercises} jouables dans les quatre types, ` +
      `${report.total.broken} cassés ; catalogue de ${report.meta.catalogue} images.`,
  );
  console.log("mots = tuiles avec lettres ; noms = tuiles de forme nom (3 mots, sans chiffre) ; images = tuiles avec image ;");
  console.log("exos+ = exercices avec au moins une image ; coupés = garde-fous a à f de la lib (`TILE_GUARDS`, `lib/item-pictures.ts`) ; part = coupé d'un côté seulement.");
  if (withThings) console.log("choses- = tuiles qui nomment une chose et n'ont pas d'image ; choses% = images / (images + choses-).");
  console.log(`Auto-vérification des garde-fous : ${report.selfCheck.groupsChecked} groupes, ${report.selfCheck.disagreements.length} désaccord(s).`);
  console.log("");
  console.log(header);
  console.log(line);
  for (const type of TYPES) console.log(row(type, report.byType[type]));
  console.log(line);
  const totalThings = report.thingCoverage
    ? {
        without: report.thingCoverage.thingTilesWithoutPicture + report.thingCoverage.pluralTilesOfCatalogue + report.thingCoverage.ambiguousBareTiles,
        percent: report.thingCoverage.coveragePercent,
      }
    : undefined;
  console.log(row("TOTAL", report.total, totalThings));
  console.log("");
  console.log("Par thème");
  console.log(header);
  console.log(line);
  for (const theme of report.byTheme) {
    console.log(row(theme.programmeKey, theme.total, withThings ? { without: theme.thingTilesWithoutPicture, percent: theme.thingCoveragePercent } : undefined));
  }
  if (report.thingCoverage) {
    const c = report.thingCoverage;
    console.log("");
    console.log(
      `Tuiles qui NOMMENT une chose : ${c.picturedNameTiles} avec image, ${c.cutByGuards} coupées par un garde-fou, ${c.thingTilesWithoutPicture} sans entrée au catalogue, ` +
        `${c.pluralTilesOfCatalogue} au pluriel d'un mot du catalogue, ${c.ambiguousBareTiles} « orange » seul : couverture ${pct(c.coveragePercent)} ` +
        `(${pct(c.coverageWithGuardCutsPercent)} en comptant les coupes des garde-fous).`,
    );
  }
  if (report.wave2) {
    const w = report.wave2;
    console.log(
      `Deuxième vague : ${w.thingWords} noms de choses sans image (${w.thingTiles} tuiles), ${w.pluralWords} pluriels d'un mot du catalogue (${w.pluralTiles} tuiles), ` +
        `${w.notThingWords} autres mots sans image (verbes, prénoms, jours, nombres, syllabes, phrases : ${w.notThingTiles} tuiles).`,
    );
    console.log(`  Les plus fréquents : ${w.top.map((item) => `${item.word} ${item.count}`).join(", ")}.`);
    if (w.unknownThingKeys.length > 0) console.log(`  ATTENTION, mots de --things absents des tuiles : ${w.unknownThingKeys.join(", ")}.`);
  }
  const a = report.asymmetry;
  console.log("");
  console.log(
    `QCM avec image : ${a.qcmWithPicture}, dont ${a.mixed} où seules certaines options en ont une ; le motif isole la bonne réponse ${a.singlesOutCorrect} fois, ` +
      `une mauvaise ${a.singlesOutWrong} fois, aucune ${a.neither} fois.`,
  );
  for (const rule of report.cutRules) {
    console.log("");
    console.log(`Règle ${rule.id} (coupe) : ${rule.title}`);
    console.log(`  ${rule.rule}`);
    console.log(
      `  coupe ${rule.cut} exercice(s) : ${rule.cutRight.length} à raison (b), ${rule.cutWrong.length} à tort (a ou c), ${rule.cutUnjudged.length} non jugé(s) ; ` +
        `sondes : ${rule.probes.cutOk}/${rule.probes.cutTotal} coupées, ${rule.probes.keepOk}/${rule.probes.keepTotal} gardées.`,
    );
  }
  for (const rule of report.relaxingRules) {
    console.log("");
    console.log(`Règle ${rule.id} (rétablit) : ${rule.title}`);
    console.log(`  ${rule.rule}`);
    console.log(
      `  rétablit ${rule.restored} exercice(s) : ${rule.restoredRight.length} sans fuite, ${rule.restoredLeak.length} avec fuite (b), ${rule.restoredUnjudged.length} non jugé(s) ; ` +
        `sondes : ${rule.probes.restoreOk}/${rule.probes.restoreTotal} rétablies, ${rule.probes.stayCutOk}/${rule.probes.stayCutTotal} restent coupées.`,
    );
  }
  const l = report.leaks;
  console.log("");
  console.log(
    `Fuites (b) encore visibles : ${l.leaksStillShown} ; coupées par au moins une règle : ${l.coveredByRules} ; ${l.notCovered.length} laissées passer ; ` +
      `${l.alreadyStoppedByLib} déjà empêchées par un garde-fou de la lib.`,
  );
  console.log("");
  console.log(`Rapport : ${outFile}`);
}

const isMain = process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
