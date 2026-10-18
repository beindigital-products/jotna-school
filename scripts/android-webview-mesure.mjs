// LA FLUIDITÉ DANS LE WEBVIEW ANDROID — mesurée dans l'application, sans
// aucun code de mesure dans le dépôt : une sonde `requestAnimationFrame`
// injectée par le protocole DevTools, des touchers synthétiques
// (`Input.dispatchTouchEvent`), et pour chaque geste les écarts entre deux
// images depuis le geste. Deux autres regards sur le même geste : la trace
// Chromium (qui du JavaScript, du style, de la peinture, de la rastérisation
// ou du GPU coûte) et le profil JavaScript (quelle fonction). Mode d'emploi
// et lecture des chiffres : docs/boucle-native-jeu.md § 6.
//
//   node scripts/android-webview-mesure.mjs <scénario> [--mode raf|trace|profil]
//       [--level riche|sobre] [--css "règles"] [--record fichier.mp4] [--out DOSSIER]
//
//   scénario  seance (une option fausse, Valider, la bonne, Valider, puis une
//             paire de l'association suivante) · scene (LA SCÈNE DE LA
//             QUESTION avec une voix qui joue, `?voix=1`, au niveau riche :
//             toucher Pio pendant son clip, toucher Écouter puis l'arrêter,
//             une tuile, Valider faux, Valider juste et l'arrivée de la carte
//             suivante avec sa voix automatique et son clip) · qcm · match ·
//             order · drag · fill · listen · pattern (un geste de la galerie)
//   --level   force le tier mémorisé par `use-device-tier` (sessionStorage)
//             avant de charger la page. Sans lui, l'appareil décide : l'AVD
//             Pixel_Jotna (2 Go) se range en « sobre ». La valeur RESTE dans
//             la session du WebView jusqu'au prochain --level ou à un
//             `am force-stop` de l'application.
//   --css     une feuille de style injectée après le chargement : pour juger
//             une variante sans toucher au code (A/B), par exemple
//             "[data-exercise-card]{will-change:auto !important}"
//   --record  filme le scénario (`adb shell screenrecord`) : à part, pas
//             pendant une mesure que l'on compare (le film coûte des images)
//   --out     où écrire la trace JSON (mode trace) ; défaut : pas de fichier
//
// LIRE LES CHIFFRES. Critères : moyenne sous 25 ms, aucun écart au-dessus de
// 100 ms. L'émulateur en GPU logiciel (`swiftshader_indirect`, défaut de la
// boucle) rastérise tout au processeur : il grossit tout ce qui est peinture
// (ombres, grandes surfaces, toile des confettis) sans toucher au JavaScript ;
// le même émulateur en `--gpu host` est proche d'un téléphone à GPU. Mesurer
// les deux, et `uptime` sous 30 avant de commencer.
import { execFileSync, spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ADB, buttonByText, connectWebView, sleep, waitGamePage } from "./lib/android-webview.mjs";

const args = process.argv.slice(2);
const scenario = args[0] && !args[0].startsWith("--") ? args[0] : "seance";
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const mode = opt("--mode") ?? "raf";
// La scène de la question se juge avec le clip de Pio : niveau riche sauf demande contraire.
const level = opt("--level") ?? (scenario === "scene" ? "riche" : null);
const css = opt("--css");
const record = opt("--record");
const out = opt("--out");
const host = opt("--host") ?? "http://localhost:3000";
const G = `${host}/dev/exercices/?barre=0`;
const SE = `${host}/dev/seance/?barre=0`;

const wv = await connectWebView();
const noise = [];
wv.onConsole((type, text) => { if (/Fast Refresh|\[HMR\]/.test(text)) noise.push(text.slice(0, 60)); });

/* ── La sonde ────────────────────────────────────────────────────────────── */
const PROBE = `(() => {
  if (window.__probe) return "déjà";
  const gaps = []; let last = performance.now(); const marks = {};
  function loop(t) { gaps.push([t, t - last]); last = t; requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__probe = {
    mark(n) { marks[n] = performance.now(); },
    report(n, fromMs = 0, toMs = Infinity) {
      const t0 = marks[n] + fromMs; const t1 = marks[n] + toMs;
      const g = gaps.filter(([t]) => t > t0 && t <= t1).map(([, d]) => d).sort((a, b) => a - b);
      if (!g.length) return null;
      const mean = g.reduce((a, b) => a + b, 0) / g.length;
      return { n: g.length, mean: +mean.toFixed(1), p95: +(g[Math.floor(g.length * 0.95)] ?? g[g.length - 1]).toFixed(1), max: +g[g.length - 1].toFixed(1), over50: g.filter((x) => x > 50).length, over100: g.filter((x) => x > 100).length, worst: g.slice(-4).map((x) => Math.round(x)) };
    },
  };
  return "posée";
})()`;

async function open(url) {
  if (level) await wv.evaluate(`sessionStorage.setItem("jotna.deviceTier", ${JSON.stringify(level === "riche" ? "full" : "lite")})`);
  await wv.navigate(url);
  await sleep(1500);
  await waitGamePage(wv);
  await sleep(1200);
  await wv.hideNextBadge();
  await wv.evaluate(PROBE);
  if (css) await wv.evaluate(`(() => { const st = document.createElement("style"); st.textContent = ${JSON.stringify(css)}; document.head.appendChild(st); })()`);
  const info = await wv.evaluate(`JSON.stringify({ mem: navigator.deviceMemory, cores: navigator.hardwareConcurrency, tier: sessionStorage.getItem("jotna.deviceTier"), vp: [innerWidth, innerHeight, devicePixelRatio], rm: matchMedia("(prefers-reduced-motion: reduce)").matches })`);
  console.log("page :", url.replace(host, ""), info);
}

/** Un toucher, puis le rapport des écarts d'images depuis le toucher (par fenêtres de temps si demandé). */
async function tap(expr, label, { settle = 1200, windows } = {}) {
  const [x, y] = await wv.center(expr);
  await sleep(250);
  await wv.evaluate(`__probe.mark(${JSON.stringify(label)})`);
  await wv.tapAt(x, y);
  await sleep(settle);
  await report(label, windows);
}
async function drag(expr, dx, dy, label, { steps = 14, hold = 0, settle = 1200 } = {}) {
  const [x, y] = await wv.center(expr);
  await sleep(250);
  await wv.evaluate(`__probe.mark(${JSON.stringify(label)})`);
  await wv.dragFrom(x, y, dx, dy, { steps, hold });
  await sleep(settle);
  await report(label);
}
async function report(label, windows) {
  for (const [a, b] of windows ?? [[0, Infinity]]) {
    const o = JSON.parse(await wv.evaluate(`JSON.stringify(__probe.report(${JSON.stringify(label)}, ${a}, ${b === Infinity ? "Infinity" : b}))`));
    const win = windows ? ` [${a}–${b === Infinity ? "fin" : b} ms]` : "";
    console.log(`  ${label}${win}: ${o ? `n=${o.n} mean=${o.mean} p95=${o.p95} max=${o.max} >50=${o.over50} >100=${o.over100} pires=${o.worst.join("/")}` : "aucune image"}`);
  }
}

/* ── Les scénarios ───────────────────────────────────────────────────────── */
const GALLERY_BUTTONS = `Array.from(document.querySelectorAll("[data-stage-ready] button")).filter((b) => !/Valider/.test(b.textContent) && !/consigne/.test(b.getAttribute("aria-label") || ""))`;
const SCENARIOS = {
  async seance() {
    await open(SE);
    // 1. Une option fausse, puis Valider : la scène « pas tout à fait » arrive, dit non, part seule (2,6 s).
    await tap(`document.querySelector('button[data-option="0"]')`, "toucher tuile", { settle: 700 });
    await tap(buttonByText("Valider"), "valider faux", { settle: 3400, windows: [[0, 700], [700, 2600], [2600, 3400]] });
    // 2. La bonne option (le spécimen qcm4 : index 2), Valider : verdict, éclat, scène, puis la carte suivante (1,8 s après).
    await tap(`document.querySelector('button[data-option="2"]')`, "toucher bonne tuile", { settle: 700 });
    await tap(buttonByText("Valider"), "valider juste", { settle: 3600, windows: [[0, 600], [600, 1800], [1800, 3000], [3000, 3600]] });
    // 3. L'association qui suit : une paire.
    await tap(`Array.from(document.querySelectorAll("button")).filter((b) => b.textContent.trim() === "2")[0]`, "assoc gauche", { settle: 600 });
    await tap(`(() => { const all = Array.from(document.querySelectorAll("[data-exercise-card] button")).filter((b) => !/Valider|consigne/.test(b.textContent + (b.getAttribute("aria-label") || ""))); return all[all.length - 3]; })()`, "assoc droite", { settle: 900 });
  },
  async scene() {
    await open(`${SE}&voix=1`);
    // La voix automatique (1,5 s) a joué pendant l'ouverture ; le clip « ask »
    // monte 700 ms après la carte et dès que la voix se tait.
    await sleep(1500);
    const pio = `document.querySelector("[data-pio-listen]")`;
    const ecouter = `document.querySelector("[data-listen-status]")`;
    console.log("  clip de Pio avant le toucher :", await wv.evaluate(`document.querySelector("[data-coach-clip]")?.getAttribute("data-coach-clip")`));
    // 1. Toucher Pio : la voix part, le clip se démonte (affiche), puis revient quand elle se tait.
    await tap(pio, "toucher Pio (voix, clip → affiche)", { settle: 2600, windows: [[0, 400], [400, 1800], [1800, 2600]] });
    // 2. Toucher Écouter : même chose ; un second toucher l'arrête (le clip remonte).
    await tap(ecouter, "toucher Écouter", { settle: 900, windows: [[0, 400], [400, 900]] });
    await tap(ecouter, "arrêter Écouter (clip remonte)", { settle: 1500, windows: [[0, 400], [400, 1500]] });
    // 3. Une tuile fausse, Valider : la scène de réponse ; puis la bonne, Valider :
    //    verdict, éclat, scène, et la carte suivante avec sa voix automatique et son clip.
    await tap(`document.querySelector('button[data-option="0"]')`, "toucher tuile", { settle: 700 });
    await tap(buttonByText("Valider"), "valider faux", { settle: 3400, windows: [[0, 700], [700, 2600], [2600, 3400]] });
    await tap(`document.querySelector('button[data-option="2"]')`, "toucher bonne tuile", { settle: 700 });
    await tap(buttonByText("Valider"), "valider juste (puis carte suivante, voix, clip)", { settle: 4200, windows: [[0, 600], [600, 1800], [1800, 2600], [2600, 3400], [3400, 4200]] });
    console.log("  clip de Pio sur la carte suivante :", await wv.evaluate(`document.querySelector("[data-coach-clip]")?.getAttribute("data-coach-clip")`), "· voix :", await wv.evaluate(`document.querySelector("[data-listen-status]")?.getAttribute("data-listen-status")`));
  },
  async qcm() {
    await open(`${G}&type=qcm4`);
    await tap(`document.querySelector('button[data-option="0"]')`, "toucher tuile 1", { settle: 700 });
    await tap(`document.querySelector('button[data-option="1"]')`, "toucher tuile 2", { settle: 700 });
    await tap(`document.querySelector('button[data-option="2"]')`, "toucher tuile 3", { settle: 700 });
    await tap(buttonByText("Valider"), "valider juste (galerie)", { settle: 1800, windows: [[0, 400], [400, 1800]] });
  },
  async match() {
    await open(`${G}&type=match`);
    const L = (i) => `(${GALLERY_BUTTONS})[${i}]`;
    await tap(L(0), "gauche 1", { settle: 600 });
    await tap(L(4), "droite 1 (câble)", { settle: 900 });
    await tap(L(1), "gauche 2", { settle: 600 });
    await tap(L(5), "droite 2 (câble)", { settle: 900 });
  },
  async order() {
    await open(`${G}&type=order`);
    await drag(`document.querySelector('[aria-roledescription="sortable"]')`, 0, 150, "glisser poignée (2 crans)", { steps: 18, hold: 60 });
  },
  async drag() {
    await open(`${G}&type=drag-drop`);
    const chip = `document.querySelector('.border-dashed [aria-roledescription="draggable"]')`;
    const box = await wv.center(`Array.from(document.querySelectorAll("h4"))[0].parentElement`);
    const from = await wv.center(chip);
    await drag(chip, box[0] - from[0], box[1] - from[1], "glisser étiquette", { steps: 20, hold: 120 });
  },
  async fill() {
    await open(`${G}&type=fill-blank`);
    await tap(`Array.from(document.querySelectorAll("[data-stage-ready] button")).find((b) => b.textContent.trim() === "une")`, "jeton vole", { settle: 1200 });
  },
  async listen() {
    await open(`${G}&type=listen`);
    await tap(`document.querySelector('button[aria-label^="Écouter"]')`, "écouter", { settle: 1500 });
    await tap(`document.querySelector('button[data-option="0"]')`, "toucher tuile", { settle: 700 });
  },
  async pattern() {
    await open(`${G}&type=pattern`);
    await tap(`document.querySelector('button[aria-label^="Placer"]')`, "placer perle", { settle: 1200 });
  },
};
if (!SCENARIOS[scenario]) { console.error(`scénario inconnu : ${scenario} (${Object.keys(SCENARIOS).join(", ")})`); process.exit(2); }

/* ── Le film ─────────────────────────────────────────────────────────────── */
let rec = null;
if (record) {
  rec = spawn(ADB, ["shell", "screenrecord", "--time-limit", "60", "--bit-rate", "6000000", "/sdcard/jotna-mesure.mp4"], { stdio: "ignore" });
  await sleep(1200);
}
console.log("uptime :", execFileSync("uptime").toString().trim().replace(/.*load averages?: /, "charge "));

/* ── Les trois modes ─────────────────────────────────────────────────────── */
if (mode === "raf") {
  await SCENARIOS[scenario]();
} else if (mode === "trace") {
  // Les catégories : sans `devtools.timeline.picture` ni `cc.debug.picture`,
  // qui sérialisent chaque liste d'affichage pendant la trace et inventent
  // 800 ms de `FinishDisplayItemListUpdate` qui n'existent pas sans trace.
  const CATS = "devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu,viz,disabled-by-default-devtools.timeline.frame,benchmark,v8.execute";
  const events = [];
  let done = null;
  wv.onEvent((msg) => {
    if (msg.method === "Tracing.dataCollected") events.push(...msg.params.value);
    if (msg.method === "Tracing.tracingComplete") done?.();
  });
  await wv.send("Tracing.start", { categories: CATS, options: "record-continuously", transferMode: "ReportEvents" });
  await sleep(300);
  await SCENARIOS[scenario]();
  const complete = new Promise((r) => { done = r; });
  await wv.send("Tracing.end");
  await complete;
  if (out) writeFileSync(join(out, `trace-${scenario}${level ? "-" + level : ""}.json`), JSON.stringify(events));
  summarizeTrace(events);
} else if (mode === "profil") {
  await wv.send("Profiler.enable");
  await wv.send("Profiler.setSamplingInterval", { interval: 500 });
  await wv.send("Profiler.start");
  await SCENARIOS[scenario]();
  const r = await wv.send("Profiler.stop");
  summarizeProfile(r.result.profile);
} else {
  console.error(`mode inconnu : ${mode} (raf, trace, profil)`);
  process.exit(2);
}

if (rec) {
  await sleep(500);
  execFileSync(ADB, ["shell", "pkill", "-INT", "screenrecord"]);
  await new Promise((r) => rec.on("exit", r));
  await sleep(800);
  execFileSync(ADB, ["pull", "/sdcard/jotna-mesure.mp4", record]);
  execFileSync(ADB, ["shell", "rm", "/sdcard/jotna-mesure.mp4"]);
  console.log("film :", record);
}
if (noise.length) console.log("console pendant la mesure (une recompilation invalide la mesure) :", noise.join(" | "));
wv.close();

/* ── Dépouillement de la trace ───────────────────────────────────────────── */
function summarizeTrace(events) {
  const threadNames = new Map();
  const processNames = new Map();
  for (const e of events) {
    if (e.ph === "M" && e.name === "thread_name") threadNames.set(`${e.pid}:${e.tid}`, e.args.name);
    if (e.ph === "M" && e.name === "process_name") processNames.set(e.pid, e.args.name);
  }
  // Durée propre de chaque évènement complet (X) : sa durée moins celle de ses enfants.
  const complete = events.filter((e) => e.ph === "X" && typeof e.dur === "number").sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const stacks = new Map();
  for (const e of complete) {
    const key = `${e.pid}:${e.tid}`;
    const stack = stacks.get(key) ?? [];
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) parent.childDur = (parent.childDur ?? 0) + e.dur;
    stack.push(e);
    stacks.set(key, stack);
  }
  const selfByThread = new Map();
  for (const e of complete) {
    const key = `${e.pid}:${e.tid}`;
    const m = selfByThread.get(key) ?? new Map();
    m.set(e.name, (m.get(e.name) ?? 0) + (e.dur - (e.childDur ?? 0)));
    selfByThread.set(key, m);
  }
  const tMin = Math.min(...complete.map((e) => e.ts));
  const tMax = Math.max(...complete.map((e) => e.ts + e.dur));
  console.log(`trace : ${((tMax - tMin) / 1000).toFixed(0)} ms, ${events.length} évènements`);
  for (const [key, m] of selfByThread) {
    const total = [...m.values()].reduce((a, b) => a + b, 0) / 1000;
    if (total < 120) continue;
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, d]) => `${n} ${(d / 1000).toFixed(0)}`).join(", ");
    console.log(`  ${processNames.get(Number(key.split(":")[0])) ?? "?"}/${threadNames.get(key) ?? key} : ${total.toFixed(0)} ms occupés : ${top}`);
  }
  // Par tranche de 200 ms : fil principal du rendu / GPU (dont rastérisation) / composition.
  const bins = new Map();
  const add = (k, ts, dur) => { const b = Math.floor((ts - tMin) / 200000); const o = bins.get(b) ?? { main: 0, gpu: 0, raster: 0, viz: 0 }; o[k] += dur / 1000; bins.set(b, o); };
  let tiles = 0;
  for (const e of complete) {
    const name = threadNames.get(`${e.pid}:${e.tid}`);
    const self = e.dur - (e.childDur ?? 0);
    if (name === "CrRendererMain") add("main", e.ts, self);
    else if (name === "Chrome_InProcGpuThread") { add("gpu", e.ts, self); if (/Raster/.test(e.name)) add("raster", e.ts, self); if (e.name === "RasterDecoderImpl::DoEndRasterCHROMIUM") tiles += 1; }
    else if (name === "RenderThread") add("viz", e.ts, self);
  }
  console.log("  tranches de 200 ms (principal / gpu dont raster / composition) :", [...bins.entries()].sort((a, b) => a[0] - b[0]).map(([b, o]) => `${b * 200}:${o.main.toFixed(0)}/${o.gpu.toFixed(0)}(${o.raster.toFixed(0)})/${o.viz.toFixed(0)}`).join(" "));
  console.log(`  tuiles rastérisées : ${tiles} (le chiffre à comparer entre deux variantes : il ne dépend pas de la charge de la machine)`);
  const mainKeys = [...threadNames.entries()].filter(([, n]) => n === "CrRendererMain").map(([k]) => k);
  const tasks = complete.filter((e) => mainKeys.includes(`${e.pid}:${e.tid}`) && e.name === "RunTask" && e.dur > 50000).sort((a, b) => b.dur - a.dur);
  for (const t of tasks.slice(0, 8)) {
    const inside = complete.filter((e) => `${e.pid}:${e.tid}` === `${t.pid}:${t.tid}` && e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
    const agg = new Map();
    for (const e of inside) agg.set(e.name, (agg.get(e.name) ?? 0) + (e.dur - (e.childDur ?? 0)));
    console.log(`  tâche longue du fil principal @${((t.ts - tMin) / 1000).toFixed(0)} ms, ${(t.dur / 1000).toFixed(0)} ms : ${[...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, d]) => `${n} ${(d / 1000).toFixed(0)}`).join(", ")}`);
  }
}

/* ── Dépouillement du profil ─────────────────────────────────────────────── */
function summarizeProfile(profile) {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const selfTime = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const nid = profile.samples[i];
    selfTime.set(nid, (selfTime.get(nid) ?? 0) + (profile.timeDeltas[i + 1] ?? 0) / 1000);
  }
  const label = (cf) => `${cf.functionName || "(anonyme)"} [${(cf.url || "").split("/").pop().replace(/\?.*$/, "")}:${cf.lineNumber}]`;
  const total = [...selfTime.values()].reduce((a, b) => a + b, 0);
  const byFn = new Map();
  const idle = new Map();
  const inclusive = new Map();
  for (const [nid, t] of selfTime) {
    const cf = nodes.get(nid).callFrame;
    if (["(idle)", "(program)", "(garbage collector)", "(root)"].includes(cf.functionName)) { idle.set(cf.functionName, (idle.get(cf.functionName) ?? 0) + t); continue; }
    byFn.set(label(cf), (byFn.get(label(cf)) ?? 0) + t);
    const seen = new Set();
    for (let cur = nid; cur !== undefined; cur = parent.get(cur)) {
      const k = label(nodes.get(cur).callFrame);
      if (!seen.has(k)) { seen.add(k); inclusive.set(k, (inclusive.get(k) ?? 0) + t); }
    }
  }
  const busy = total - [...idle.values()].reduce((a, b) => a + b, 0);
  console.log(`profil : ${total.toFixed(0)} ms échantillonnés, ${busy.toFixed(0)} ms de JavaScript (${[...idle.entries()].map(([k, v]) => `${k} ${v.toFixed(0)}`).join(", ")})`);
  console.log("  temps propre :", [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([f, t]) => `${f} ${t.toFixed(0)}`).join(" | "));
  console.log("  inclusif, hors React/framer/Next :", [...inclusive.entries()].filter(([k]) => !/react|framer|motion-dom|next_dist|scheduler|\(root\)|\(program\)|\(idle\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([f, t]) => `${f} ${t.toFixed(0)}`).join(" | "));
}
