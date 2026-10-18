// LE TOUR DES ÉCRANS DANS LE WEBVIEW ANDROID — chaque type d'exercice dans
// chaque état (la galerie `/dev/exercices/`), puis les scènes de la séance
// factice (`/dev/seance/`), photographiés dans l'application lancée par
// `scripts/native-loop-android.sh`, SANS reconstruire l'APK : la page change
// par le protocole DevTools du WebView (`Page.navigate`), la capture vient
// d'`adb exec-out screencap`. Mode d'emploi : docs/boucle-native-jeu.md § 4.
//
//   node scripts/android-webview-tour.mjs --out DOSSIER [--types a,b] [--etats a,b]
//       [--galerie | --seance | --seance-types] [--host http://localhost:3000]
//
//   --out      où vont les images : DOSSIER/galerie/<type>-<état>.png,
//              DOSSIER/seance/<scène>.png et DOSSIER/seance-types/<type>.png
//              (jamais dans le dépôt : le scratchpad)
//   --types    sous-ensemble des types de la galerie (défaut : les onze)
//   --etats    sous-ensemble des états (défaut : les cinq)
//   --galerie  la galerie seule ; --seance : la séance seule (défaut : les deux)
//   --seance-types  chaque type en PREMIÈRE QUESTION de la séance factice
//              (`/dev/seance/?exo=`), avec le grand Pio et la barre d'action :
//              une capture par type et, sur la console, le premier écran
//              mesuré dans le WebView (hauteur de Pio, bas de la barre
//              d'action contre la fenêtre, défilement horizontal). C'est le
//              pendant Android de `scripts/shoot-exercises.mjs --seance-types`.
//
// Prérequis : l'émulateur allumé, l'application lancée sur le serveur de
// développement (`adb reverse tcp:3000` posé par la boucle), `adb` dans
// ANDROID_HOME/platform-tools. Le script pose lui-même `adb forward tcp:9333`
// vers le WebView du processus de l'application.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { connectWebView, waitStageReady } from "./lib/android-webview.mjs";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const out = opt("--out");
if (!out) { console.error("--out DOSSIER est obligatoire (le scratchpad de la session, pas le dépôt)."); process.exit(2); }
const host = opt("--host") ?? "http://localhost:3000";
const TYPES = (opt("--types") ?? "qcm3,qcm4,match,order,drag-drop,fill-blank,short-answer,pattern,color-mix,listen,pixel-art").split(",");
const ETATS = (opt("--etats") ?? "repos,choisie,bonne,mauvaise,desactive").split(",");
const SCENES = ["exercice", "bonne", "mauvaise", "plus-d-essai", "fin-validee", "fin-manquee"];
const doSeanceTypes = args.includes("--seance-types");
const doGalerie = !args.includes("--seance") && !doSeanceTypes;
const doSeance = !args.includes("--galerie") && !doSeanceTypes;
const OUT_G = join(out, "galerie");
const OUT_S = join(out, "seance");
const OUT_T = join(out, "seance-types");
mkdirSync(OUT_G, { recursive: true });
mkdirSync(OUT_S, { recursive: true });
mkdirSync(OUT_T, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wv = await connectWebView();
const errors = [];
wv.onConsole((type, text) => {
  // Le bruit connu de l'application entière (hydratation du pont Capacitor,
  // `Filesystem.readFile` du hors-ligne) n'est pas la galerie.
  if ((type === "error" || type === "warning") && !/hydrat|readFile|Filesystem|React DevTools|^Object$/.test(text)) errors.push(`${type} ${text.slice(0, 160)}`);
});

async function shoot(file, url, settle, waitReady) {
  const before = errors.length;
  await wv.navigate(url);
  const ok = waitReady ? await waitStageReady(wv) : (await sleep(7000), true);
  await wv.hideNextBadge();
  await sleep(settle);
  writeFileSync(file, wv.screencap());
  const added = errors.slice(before);
  console.log(`capture ${file}${ok ? "" : " (cartes non prêtes)"}${added.length ? "  !! " + added.join(" | ") : ""}`);
}

const G = `${host}/dev/exercices/?barre=0`;
const SE = `${host}/dev/seance/?barre=0`;
if (doGalerie) {
  for (const type of TYPES) for (const etat of ETATS) await shoot(join(OUT_G, `${type}-${etat}.png`), `${G}&type=${type}&etat=${etat}`, 1500, true);
}
if (doSeance) {
  for (const scene of SCENES) await shoot(join(OUT_S, `${scene}.png`), `${SE}&scene=${scene}`, scene.startsWith("fin") ? 4000 : 2500, false);
}
if (doSeanceTypes) {
  // Le premier écran de chaque type dans la vraie coque : la barre d'action
  // (ou, sans elle, le bas de la carte) doit finir au-dessus du bas de la
  // fenêtre, et rien ne doit déborder en largeur (un débordement horizontal
  // fait dézoomer la vue mobile : `innerWidth` dépasse alors l'écran).
  const MESURE = `(() => {
    const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom), Math.round(b.height)]; };
    return JSON.stringify({
      fenetre: [innerWidth, innerHeight], ecran: [screen.width, screen.height],
      pio: r(".pio"), carte: r("[data-exercise-card]"), actions: r("[data-scene-actions]"),
      largeur: document.documentElement.scrollWidth, enLigne: document.querySelector("[data-scene-actions]")?.getAttribute("data-row") ?? "auto",
    });
  })()`;
  for (const type of TYPES) {
    await shoot(join(OUT_T, `${type}.png`), `${SE}&exo=${type}`, 2500, false);
    const m = JSON.parse(await wv.evaluate(MESURE));
    const bas = m.actions?.[1] ?? m.carte?.[1];
    const marge = bas == null ? null : m.fenetre[1] - bas;
    const verdict = marge == null ? "pas de barre ni de carte" : marge >= 0 ? `tient (${marge} px de marge)` : `déborde de ${-marge} px`;
    const largeur = m.largeur > m.fenetre[0] ? ` !! défilement horizontal : ${m.largeur} > ${m.fenetre[0]}` : "";
    console.log(`  ${type} : fenêtre ${m.fenetre.join("×")} · Pio ${m.pio?.[2] ?? "?"} px · carte ${m.carte?.[0]}–${m.carte?.[1]} · barre d'action ${m.actions ? `${m.actions[0]}–${m.actions[1]}` : "absente"} : ${verdict}${largeur}`);
  }
}
await wv.navigate(G);
wv.close();
console.log(`fin : ${errors.length} erreur(s) console hors bruit connu`);
