#!/usr/bin/env node
/**
 * COPIER LE CACHE AUDIO D'UN DÉPLOIEMENT CONVEX À UN AUTRE, sans appeler ElevenLabs (donc sans crédit).
 *
 *     pnpm voix:copier --from dev --to prod --confirm <nom de la production>            à blanc : compte, ne copie rien
 *     pnpm voix:copier --from dev --to prod --confirm <nom de la production> --apply     copie pour de bon
 *
 * `--from` et `--to` : ce que `npx convex run --deployment` accepte (`dev`, `prod`, `local`, un nom de déploiement).
 * `--confirm` : le nom du déploiement CIBLE, comme `confirmDeployment` de `paliers/pregen` ; l'action refuse si la cible
 * n'est pas celle-là. Sans `--apply`, rien n'est écrit nulle part.
 *
 * Ce que la copie fait et ne fait pas : `convex/voice/cacheCopy.ts`. Elle ne copie que les voix que la cible lit, ne
 * remplace jamais un son, et se relance sans danger (un son déjà là est compté, pas recopié).
 */
import { execFileSync } from "node:child_process";

const PAGE = 200;
const CHUNK = 100;

function arg(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}
const from = arg("--from");
const to = arg("--to");
const confirm = arg("--confirm");
const apply = process.argv.includes("--apply");

if (!from || !to || !confirm) {
  console.error("Usage : pnpm voix:copier --from <source> --to <cible> --confirm <nom de la cible> [--apply]");
  process.exit(1);
}
// « current » : le déploiement que l'environnement désigne (`.env.local`), sans `--deployment`. Utile pour un essai en local.
// `--allow-same` : source et cible identiques, pour tester le script sur un seul backend (les sons y sont déjà : rien ne se copie).
if (from === to && !process.argv.includes("--allow-same")) {
  console.error("La source et la cible sont le même déploiement : rien à copier.");
  process.exit(1);
}
const deploymentArgs = (deployment) => (deployment === "current" ? [] : ["--deployment", deployment]);

/** Le premier JSON complet de la sortie : `convex run` peut mêler des lignes de journal à son résultat. */
function parseResult(output) {
  const text = output.trim();
  try {
    return JSON.parse(text);
  } catch {
    // Les lignes de journal passent devant : on cherche le premier « { » en début de ligne qui forme un JSON entier.
    for (const match of text.matchAll(/^\{/gm)) {
      try {
        return JSON.parse(text.slice(match.index));
      } catch {
        // essai suivant
      }
    }
  }
  throw new Error(`Réponse illisible de convex run :\n${text.slice(0, 400)}`);
}

function run(deployment, fn, args) {
  const output = execFileSync("npx", ["convex", "run", ...deploymentArgs(deployment), fn, JSON.stringify(args)], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
  return parseResult(output);
}

// 1. Tout le cache de la source, page par page.
const clips = [];
let cursor = null;
for (;;) {
  const page = run(from, "voice/cacheCopy:listClips", { cursor, numItems: PAGE });
  clips.push(...page.clips);
  process.stdout.write(`\rsource ${from} : ${clips.length} sons lus`);
  if (page.isDone) break;
  cursor = page.cursor;
}
process.stdout.write("\n");

const byVoice = new Map();
for (const clip of clips) byVoice.set(`${clip.voiceId} | ${clip.modelId}`, (byVoice.get(`${clip.voiceId} | ${clip.modelId}`) ?? 0) + 1);
console.log("voix de la source :");
for (const [voice, count] of byVoice) console.log(`  ${count} × ${voice}`);

// 2. À blanc d'abord, toujours : la cible dit ce qu'elle copierait.
function pass(dryRun) {
  const total = { received: 0, toCopy: 0, alreadyCached: 0, otherVoice: 0, badKey: 0, badSize: 0, noUrl: 0, badUrl: 0, duplicate: 0, copied: 0, failed: [] };
  for (let at = 0; at < clips.length; at += CHUNK) {
    const summary = run(to, "voice/cacheCopy:importClips", { confirmDeployment: confirm, dryRun, clips: clips.slice(at, at + CHUNK) });
    for (const key of Object.keys(total)) {
      if (key === "failed") total.failed.push(...summary.failed);
      else total[key] += summary[key];
    }
    process.stdout.write(`\r${dryRun ? "à blanc" : "copie"} sur ${to} : ${Math.min(at + CHUNK, clips.length)}/${clips.length}`);
  }
  process.stdout.write("\n");
  return total;
}

const planned = pass(true);
console.log(JSON.stringify({ ...planned, failed: undefined, dryRun: true }, null, 2));
if (!apply) {
  console.log("À blanc : rien n'a été copié. Ajoutez --apply pour copier.");
  process.exit(0);
}
if (planned.toCopy === 0) {
  console.log("Rien à copier.");
  process.exit(0);
}

const done = pass(false);
console.log(JSON.stringify({ copies: done.copied, echecs: done.failed.length, echecsTextes: done.failed.slice(0, 20) }, null, 2));
process.exit(done.failed.length > 0 ? 2 : 0);
