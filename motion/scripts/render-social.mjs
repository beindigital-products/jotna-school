// Rend les publications dans out/social/ et écrit le calendrier éditorial.
//   out/social/J01-midi_<id>.mp4                 vidéos 1080 × 1920
//   out/social/J02-soir_<id>/01.png ... 0N.png   cartes de carrousel 1080 × 1350
//   out/social/calendrier.csv, calendrier.md     2 publications par jour, légendes par réseau
//
// Usage :
//   node scripts/render-social.mjs                 tout rendre (long)
//   node scripts/render-social.mjs --only d02      seulement les ids qui commencent par d02
//   node scripts/render-social.mjs --still d02-midi-enfants-fractions:120,300   images de contrôle
//   node scripts/render-social.mjs --plan          calendrier seulement
//   node scripts/render-social.mjs --check         durées seulement (chaque vidéo doit faire au moins 60 s)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const posts = JSON.parse(readFileSync(join(root, "src/social/posts.json"), "utf8"));
const out = join(root, "out/social");
mkdirSync(out, { recursive: true });

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? true) : null;
};
const only = arg("--only");
const stillArg = arg("--still");
const planOnly = process.argv.includes("--plan");

// Premier jour de publication : le lundi 19 octobre 2026 (le calendrier s'adapte avec --start AAAA-MM-JJ).
const start = new Date(`${arg("--start") ?? "2026-10-19"}T00:00:00Z`);
const dateOf = (day) => {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toISOString().slice(0, 10);
};
const HOURS = { midi: "12:30", soir: "19:30" };
const NAMES = { pub: "Publicité", explicatif: "Explicatif", tutoriel: "Tutoriel", enfants: "Cours pour enfants", visuel: "Visuel" };
const slugOf = (p) => p.id.split("-").slice(2).join("-");
const fileOf = (p) => (p.bank ? `BANQUE-${p.id.split("-")[1]}_${slugOf(p)}` : `J${String(p.day).padStart(2, "0")}-${p.slot}_${slugOf(p)}`);
const planned = posts.filter((p) => !p.bank);
const bank = posts.filter((p) => p.bank);
const fileLabel = (p) => (p.format === "video" ? `${fileOf(p)}.mp4` : `${fileOf(p)}/ (cartes 01 à ${String(p.slides.length).padStart(2, "0")})`);

function writePlan() {
  const days = planned.at(-1).day;
  const rows = [["Date", "Heure (Dakar)", "Jour", "Créneau", "Type", "Public", "Titre", "Format", "Fichier", "Légende TikTok", "Légende Instagram", "Légende Facebook"]];
  let md = `# Planning éditorial : ${planned.length} publications en ${days} jours (du ${dateOf(1)} au ${dateOf(days)})\n\n`;
  md += `**Règle : deux publications par jour, jamais plus.** Le créneau de midi (12 h 30) est une publicité, ou un explicatif ou un tutoriel en fin de planning. Le créneau du soir (19 h 30) est un mini-cours pour enfants, dans la classe du jour.\n\n`;
  md += `Les cours tournent sur les classes : CI, CP, CE1, CE2, CM1, CM2, puis Arabe & Coran, et on recommence. Chaque classe a trois cours, le module Arabe & Coran en a deux. `;
  md += `Chaque publication part sur TikTok, Instagram (Reels ou carrousel) et Facebook (Reels ou carrousel), avec la légende du réseau. Heures conseillées à Dakar (GMT) : 12 h 30 et 19 h 30.\n\n`;
  md += `| Date | Heure | Classe / type | Public | Titre | Fichier |\n|---|---|---|---|---|---|\n`;
  for (const p of planned) {
    const label = p.level ?? NAMES[p.type];
    rows.push([dateOf(p.day), HOURS[p.slot], p.day, p.slot, label, p.audience, p.title, p.format === "video" ? "Vidéo 9:16" : "Carrousel 4:5", fileLabel(p), p.caption.tiktok, p.caption.instagram, p.caption.facebook]);
    md += `| ${dateOf(p.day)} | ${HOURS[p.slot]} | ${label} | ${p.audience} | ${p.title} | \`${fileLabel(p)}\` |\n`;
  }
  md += `\n## Banque de contenus bonus (à publier de façon aléatoire et régulière)\n\nÀ publier quand on veut, **à la place** d'une publicité du planning, jamais en plus : on reste à deux publications par jour. Un bon rythme : une publication de la banque par semaine.\n\n| Contenu | Public | Fichier |\n|---|---|---|\n`;
  for (const p of bank) {
    rows.push(["Banque", "", "", "", NAMES[p.type], p.audience, p.title, p.format === "video" ? "Vidéo 9:16" : "Carrousel 4:5", fileLabel(p), p.caption.tiktok, p.caption.instagram, p.caption.facebook]);
    md += `| ${p.title} | ${p.audience} | \`${fileLabel(p)}\` |\n`;
  }
  md += `\n## Légendes\n`;
  for (const p of [...planned, ...bank]) {
    const when = p.bank ? "Banque" : `${dateOf(p.day)} ${HOURS[p.slot]}`;
    md += `\n### ${when} : ${p.title}\n\n**TikTok**\n\n${p.caption.tiktok}\n\n**Instagram**\n\n${p.caption.instagram}\n\n**Facebook**\n\n${p.caption.facebook}\n`;
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
  writeFileSync(join(out, "calendrier.csv"), String.fromCharCode(0xfeff) + csv + "\n");
  writeFileSync(join(out, "calendrier.md"), md);
  console.log("calendrier écrit");
}

writePlan();
if (planOnly) process.exit(0);

const serveUrl = await bundle({ entryPoint: join(root, "src/index.ts"), publicDir: join(root, "public") });
const chromiumOptions = { gl: "angle" };

if (stillArg) {
  const [id, frames] = String(stillArg).split(":");
  const comp = await selectComposition({ serveUrl, id: `social-${id}`, inputProps: { id } });
  for (const f of (frames ?? "30").split(",")) {
    const output = join(out, `_still_${id}_${f}.png`);
    await renderStill({ serveUrl, composition: comp, frame: Number(f), output, inputProps: { id }, imageFormat: "png" });
    console.log(output);
  }
  process.exit(0);
}

const check = process.argv.includes("--check");
for (const p of posts) {
  if (only && !p.id.startsWith(only)) continue;
  if (check) {
    if (p.format !== "video") continue;
    const c = await selectComposition({ serveUrl, id: `social-${p.id}`, inputProps: { id: p.id } });
    const sec = c.durationInFrames / 30;
    console.log(`${sec < 60 ? "TROP COURTE" : "ok"}  ${sec.toFixed(1)} s  ${p.id}`);
    continue;
  }
  if (p.format === "video") {
    const comp = await selectComposition({ serveUrl, id: `social-${p.id}`, inputProps: { id: p.id } });
    const output = join(out, `${fileOf(p)}.mp4`);
    await renderMedia({ serveUrl, composition: comp, codec: "h264", crf: 18, outputLocation: output, inputProps: { id: p.id }, concurrency: 6, chromiumOptions, jpegQuality: 92 });
    console.log(`vidéo  ${output} (${(comp.durationInFrames / 30).toFixed(1)} s)`);
  } else {
    const dir = join(out, fileOf(p));
    mkdirSync(dir, { recursive: true });
    const comp = await selectComposition({ serveUrl, id: `slides-${p.id}`, inputProps: { id: p.id, index: 0 } });
    for (let i = 0; i < p.slides.length; i++) {
      await renderStill({ serveUrl, composition: comp, frame: 0, output: join(dir, `${String(i + 1).padStart(2, "0")}.png`), inputProps: { id: p.id, index: i }, imageFormat: "png" });
    }
    console.log(`cartes ${dir} (${p.slides.length})`);
  }
}
