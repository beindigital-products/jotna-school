#!/usr/bin/env node
/**
 * FABRIQUER LES SONS EMBARQUÉS : synthétise, une seule fois, les textes d'alphabet de l'anglais et les range dans
 * `public/voix/` avec une table (`lib/voice-static/manifest.ts`) que l'application lit avant le serveur.
 *
 *     ELEVENLABS_API_KEY=... pnpm voix:build --dry-run      compte, ne synthétise rien
 *     ELEVENLABS_API_KEY=... pnpm voix:build                synthétise ce qui manque
 *     ELEVENLABS_API_KEY=... pnpm voix:build --redo "ei, bee, see"   refait ce texte-là (une voix mal dite)
 *     pnpm voix:build --prune --dry-run                     montre les fichiers que la liste n'utilise plus
 *
 * MÊME VOIX QUE LE SERVEUR : `voiceConfig()` et `synthesize()` sont ceux de `convex/voice/elevenlabs.ts`, avec les mêmes
 * variables d'environnement. Si la production règle `ELEVENLABS_EN_VOICE_ID`, `ELEVENLABS_VOICE_ID` ou
 * `ELEVENLABS_EN_MODEL_ID` (`npx convex env list --prod`), donnez les mêmes ici, sinon le serveur et l'application
 * parleraient avec deux voix. La voix et le modèle sont écrits dans le manifeste ; un changement de voix demande
 * `--replace-all`.
 *
 * SANS DANGER À RELANCER : un texte déjà fabriqué (fichier présent, même voix) ne coûte rien. Une panne de réseau
 * laisse le manifeste à jour de ce qui est fait ; on relance.
 *
 * Options : --dry-run, --limit N (sons neufs au plus), --seeds N (graines essayées pour relever les textes), --redo TEXTE
 * (répétable), --replace-all (nouvelle voix), --prune (retire fichiers et lignes que la liste n'utilise plus).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": root } });
const { staticVoiceTexts, STATIC_VOICE_SEEDS } = await jiti.import(join(root, "lib/voice-static/set.ts"));
const { voiceConfig, voiceFor, synthesize } = await jiti.import(join(root, "convex/voice/elevenlabs.ts"));
const { estimatedCostUsd } = await jiti.import(join(root, "convex/voice/warmTexts.ts"));

const OUT_DIR = join(root, "public/voix");
const MANIFEST = join(root, "lib/voice-static/manifest.ts");
const PARALLEL = 2;
const RETRIES = 4;

function arg(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}
const flag = (name) => process.argv.includes(name);
const redo = process.argv.flatMap((value, at) => (value === "--redo" ? [process.argv[at + 1]] : []));
const dryRun = flag("--dry-run");
const prune = flag("--prune");
const replaceAll = flag("--replace-all");
const limit = arg("--limit") === undefined ? Infinity : Number(arg("--limit"));
const seeds = arg("--seeds") === undefined ? STATIC_VOICE_SEEDS : Number(arg("--seeds"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fileOf = (voiceId, modelId, text) =>
  `${createHash("sha1").update(`${voiceId}|${modelId}|${text}`).digest("hex").slice(0, 16)}.mp3`;

// La table est un module TypeScript (Convex ne regroupe pas du JSON hors de `convex/`) : on le lit comme le code.
async function readManifest() {
  if (!existsSync(MANIFEST)) return { voiceId: "", modelId: "", clips: {} };
  const parsed = (await jiti.import(MANIFEST)).STATIC_VOICE_MANIFEST;
  return { voiceId: parsed.voiceId ?? "", modelId: parsed.modelId ?? "", clips: { ...parsed.clips } };
}

function writeManifest(manifest) {
  const clips = Object.fromEntries(Object.entries(manifest.clips).sort(([a], [b]) => a.localeCompare(b)));
  const body = JSON.stringify({ voiceId: manifest.voiceId, modelId: manifest.modelId, clips }, null, 2);
  writeFileSync(
    MANIFEST,
    "// ÉCRIT PAR `pnpm voix:build` (scripts/build-voix-statique.mjs) : ne pas modifier à la main.\n" +
      "// Le texte dit -> le fichier de `public/voix/`, avec la voix et le modèle qui l'ont dit.\n" +
      `export const STATIC_VOICE_MANIFEST = ${body};\n`,
  );
}

const config = voiceConfig();
if (!config) {
  console.error("ELEVENLABS_API_KEY manquante : sans elle, on ne sait ni quelle voix ni quel modèle utiliser.");
  process.exit(1);
}
const voice = voiceFor(config, "en");
const texts = staticVoiceTexts(seeds);
let manifest = await readManifest();

if (manifest.voiceId && (manifest.voiceId !== voice.voiceId || manifest.modelId !== voice.modelId)) {
  if (!replaceAll) {
    console.error(
      `Le manifeste a été fabriqué avec ${manifest.voiceId} / ${manifest.modelId}, la configuration dit ${voice.voiceId} / ${voice.modelId}.\n` +
        "Deux voix dans l'application, c'est pire qu'une voix imparfaite. Rien n'a été écrit. Pour tout refaire : --replace-all.",
    );
    process.exit(1);
  }
  manifest = { voiceId: voice.voiceId, modelId: voice.modelId, clips: {} };
}
manifest.voiceId = voice.voiceId;
manifest.modelId = voice.modelId;

const wanted = new Set(texts);
for (const text of redo) {
  if (!wanted.has(text)) {
    console.error(`« ${text} » n'est pas dans la liste (lib/voice-static/set.ts) : rien à refaire.`);
    process.exit(1);
  }
}
const needs = (text) =>
  redo.includes(text) ||
  manifest.clips[text] === undefined ||
  !existsSync(join(OUT_DIR, manifest.clips[text])) ||
  manifest.clips[text] !== fileOf(voice.voiceId, voice.modelId, text);
const missing = texts.filter(needs);
const missingChars = missing.reduce((sum, text) => sum + text.length, 0);
const stale = Object.keys(manifest.clips).filter((text) => !wanted.has(text));

console.log(
  JSON.stringify(
    {
      voix: voice.voiceId,
      modele: voice.modelId,
      textes: texts.length,
      dejaFabriques: texts.length - missing.length,
      aFabriquer: missing.length,
      caracteres: missingChars,
      coutEstimeUsd: estimatedCostUsd(missingChars),
      horsListe: stale.length,
      dryRun,
    },
    null,
    2,
  ),
);

if (prune) {
  const used = new Set(Object.entries(manifest.clips).filter(([text]) => wanted.has(text)).map(([, file]) => file));
  const orphans = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((name) => name.endsWith(".mp3") && !used.has(name)) : [];
  console.log(`prune : ${stale.length} ligne(s) du manifeste et ${orphans.length} fichier(s) hors liste${dryRun ? " (à blanc)" : ""}`);
  if (!dryRun) {
    for (const text of stale) delete manifest.clips[text];
    for (const name of orphans) rmSync(join(OUT_DIR, name));
    writeManifest(manifest);
  }
}
if (dryRun) process.exit(0);

mkdirSync(OUT_DIR, { recursive: true });

async function synthesizeWithRetry(text) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await synthesize(text, config, voice);
    } catch (error) {
      const message = String(error?.message ?? error);
      const transient = /\b(429|500|502|503|504)\b/.test(message);
      if (!transient || attempt >= RETRIES) throw error;
      await sleep(1500 * (attempt + 1));
    }
  }
}

const todo = missing.slice(0, limit);
let done = 0;
const failed = [];
for (let at = 0; at < todo.length; at += PARALLEL) {
  await Promise.all(
    todo.slice(at, at + PARALLEL).map(async (text) => {
      try {
        const audio = await synthesizeWithRetry(text);
        const file = fileOf(voice.voiceId, voice.modelId, text);
        writeFileSync(join(OUT_DIR, file), Buffer.from(await audio.arrayBuffer()));
        manifest.clips[text] = file;
        done += 1;
      } catch (error) {
        failed.push(text);
        console.error(`échec : « ${text} » : ${String(error?.message ?? error).slice(0, 160)}`);
      }
    }),
  );
  writeManifest(manifest);
  if ((at / PARALLEL) % 10 === 9) console.log(`${done}/${todo.length}`);
}
writeManifest(manifest);
console.log(JSON.stringify({ fabriques: done, echecs: failed.length, restant: missing.length - done }, null, 2));
process.exit(failed.length > 0 ? 2 : 0);
