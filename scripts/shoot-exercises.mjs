#!/usr/bin/env node
/**
 * LES CAPTURES DE LA GALERIE DES EXERCICES — une image par type d'écran et
 * par état, en téléphone et en tablette, prise dans un Chromium tactile.
 *
 * Il parcourt `/dev/exercices/` (`app/dev/exercices/`), qui rend chaque
 * écran de `components/exercises` dans la coque de la séance, et attend que
 * la carte signale `data-stage-ready="1"` (les gestes joués, l'état posé),
 * puis quelques centaines de millisecondes pour que `pop-in` et `shake`
 * aient fini. Le serveur de développement doit déjà tourner (`pnpm dev`).
 *
 * USAGE
 *   node scripts/shoot-exercises.mjs --label avant --out <dossier>
 *
 *   --label <nom>        le sous-dossier des captures (défaut : la date)
 *   --out <dossier>      la racine ; défaut : $SHOTS_DIR, sinon /tmp/jotna-shots.
 *                        JAMAIS dans le dépôt : viser le scratchpad de la session.
 *   --base <url>         le serveur (défaut http://localhost:3000)
 *   --types a,b          qcm3,qcm4,match,order,drag-drop,fill-blank,short-answer,
 *                        short-answer-texte,pattern,color-mix,listen,pixel-art,
 *                        puis les six types de TUILES QUI NOMMENT UNE CHOSE, dont
 *                        un enfant de CI voit l'image : order-animaux,
 *                        order-animaux-4, qcm-intrus, qcm-mots-seuls, match-mots,
 *                        drag-drop-savane (`app/dev/exercices/specimens.ts`)
 *                        (défaut : tous)
 *   --images 0|1         passe `&images=0` (aucune image de tuile : l'écran
 *                        d'avant, pour les comparaisons) ou `&images=1` (des
 *                        images même au CP) à toutes les pages. Sans l'option,
 *                        la classe du spécimen décide, comme en séance : le CI
 *                        les montre, le CP et le CE1 non (`app/dev/images.ts`).
 *                        Chaque capture attend que les images soient chargées.
 *   --states a,b         repos,choisie,bonne,mauvaise,desactive (défaut : tous)
 *   --devices a,b        petit (360 × 640, Android d'entrée de gamme), se
 *                        (375 × 667, iPhone SE), telephone (390 × 844, échelle 3),
 *                        grand (412 × 915, Android courant), tablette (820 × 1180,
 *                        échelle 2), paysage (667 × 375, un téléphone couché),
 *                        iphone (390 × 844 avec une ENCOCHE SIMULÉE de 47 px et
 *                        une barre d'accueil de 34), iphone17 (402 × 874, encoche
 *                        62, barre 34 : l'iPhone 17 du simulateur), android
 *                        (412 × 840 : la fenêtre du WebView Android, barres
 *                        d'état et de navigation déduites), mini (320 × 568) ;
 *                        défaut : telephone et tablette
 *   --tous-appareils     les dix appareils
 *
 * L'ENCOCHE SIMULÉE. Chromium ne sait pas émuler `env(safe-area-inset-*)`
 * (son protocole `Emulation.setSafeAreaInsets` n'existe pas dans la version
 * de Playwright). Un appareil à encoche est donc photographié dans une fenêtre
 * amputée de l'encoche et de la barre d'accueil (390 × 763 pour l'iPhone de
 * 844), et le grand Pio reprend la taille qu'il aurait sur le vrai écran : son
 * `--stage-pio` est recalculé avec la vraie hauteur à la place de `100svh` et
 * l'encoche à la place du `0px` de repli d'`env()` (`session-stage.tsx`). Le
 * budget du premier écran est le même qu'avec l'encoche (l'en-tête collant
 * passe sous elle, le dock garde la barre d'accueil sous lui) ; seules les
 * requêtes média voient la hauteur amputée, et aucun palier ne tombe entre les
 * deux (668 à 960 px dans les deux cas). Vérifié contre le simulateur iPhone 17
 * le 18 octobre 2026 : même marge à 2 px près.
 *   --full               ajoute une capture de la page entière (suffixe -pleine)
 *   --reduced            Chromium émule `prefers-reduced-motion: reduce`
 *                        (suffixe -rm) : la vraie requête média, pas la
 *                        simulation de la barre de commande
 *   --seance             photographie aussi `/dev/seance/` dans ses six scènes
 *                        (exercice, bonne, mauvaise, plus-d-essai, fin-validee,
 *                        fin-manquee) : `seance-<scène>-<appareil>.png`. Pour la
 *                        scène « exercice », il mesure et imprime la place du
 *                        premier écran : la hauteur de Pio (`--stage-pio`), la
 *                        hauteur du dock (la barre « Écouter + Valider » collée
 *                        en bas, `game-kit/scene-dock.tsx`), si la PREMIÈRE
 *                        réponse (tuile, champ, pot…) est visible au-dessus du
 *                        dock sans défiler, si TOUTES les réponses le sont
 *                        (« toutes : tient » ou « toutes : débordent de N px »,
 *                        la dernière tuile d'un QCM comprise, flanc compris :
 *                        l'objectif pour un QCM sur un téléphone debout), puis,
 *                        la page défilée tout en bas, si le bas de la carte
 *                        passe au-dessus du dock (la dernière tuile n'est
 *                        jamais cachée) : une seconde capture `-bas.png` le
 *                        montre quand la page défile.
 *   --scenes a,b         seulement ces scènes de la séance (défaut : les six)
 *   --seance-seule       saute la galerie : seulement `--seance` et `--seance-types`
 *   --seance-types a,b   photographie `/dev/seance/?exo=<type>` (la scène
 *                        « exercice » du palier de poche ouvert sur ce type :
 *                        le grand Pio, la vraie coque) pour chacun de ces
 *                        types de la galerie, et mesure le premier écran comme
 *                        ci-dessus : `seance-<type>-<appareil>.png`. « tous »
 *                        pour les dix-huit. Rien sans `--seance`.
 *   --video              enregistre une courte vidéo d'interaction sur
 *                        `/dev/seance/` (choisir une option, valider, une
 *                        mauvaise puis une bonne) : `interaction-<appareil>.webm`
 *
 * SORTIE
 *   <out>/<label>/<type>-<état>-<appareil>.png
 *
 * Exemple (banc d'essai « avant ») :
 *   node scripts/shoot-exercises.mjs --label avant --full --seance --video \
 *     --out "$SCRATCHPAD/shots"
 *
 * Exemple (les images de tuile, sans puis avec, sur les six types de tuiles nommées :
 * la galerie à l'état de repos, puis la vraie coque avec la mesure du premier écran) :
 *   T=order-animaux,order-animaux-4,qcm-intrus,qcm-mots-seuls,match-mots,drag-drop-savane
 *   node scripts/shoot-exercises.mjs --label sans-images --images 0 --types $T \
 *     --states repos --devices petit,telephone,tablette --seance --scenes exercice \
 *     --seance-types $T --out "$SCRATCHPAD/shots"
 *   node scripts/shoot-exercises.mjs --label avec-images --types $T \
 *     --states repos --devices petit,telephone,tablette --seance --scenes exercice \
 *     --seance-types $T --out "$SCRATCHPAD/shots"
 *
 * LE MOTEUR EST BLINK, PAS WEBKIT : ces captures jugent la mise en page et les
 * états, pas Safari. Le webview d'iOS et d'Android se photographie avec
 * `scripts/native-loop-ios.sh` et `scripts/native-loop-android.sh`
 * (`docs/boucle-native-jeu.md`).
 */
import { mkdir, rename } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const KINDS = [
  "qcm3",
  "qcm4",
  "match",
  "order",
  "drag-drop",
  "fill-blank",
  "short-answer",
  "short-answer-texte",
  "pattern",
  "color-mix",
  "listen",
  "pixel-art",
  // Les tuiles qui nomment une chose (au CI, chacune montre son image) : la suite de `KINDS`
  // dans `app/dev/exercices/specimens.ts`, qu'un test compare à cette liste.
  "order-animaux",
  "order-animaux-4",
  "qcm-intrus",
  "qcm-mots-seuls",
  "match-mots",
  "drag-drop-savane",
];
const STATES = ["repos", "choisie", "bonne", "mauvaise", "desactive"];
const SCENES = ["exercice", "bonne", "mauvaise", "plus-d-essai", "fin-validee", "fin-manquee"];

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const touch = { isMobile: true, hasTouch: true };

/**
 * Les appareils, au doigt : du plus petit téléphone du terrain à la tablette,
 * et un téléphone couché. Les deux de toujours (`telephone`, `tablette`)
 * restent le défaut ; `--tous-appareils` prend les six.
 */
const DEVICES = {
  petit: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, userAgent: ANDROID_UA, ...touch },
  se: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, userAgent: IPHONE_UA, ...touch },
  telephone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, userAgent: IPHONE_UA, ...touch },
  grand: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, userAgent: ANDROID_UA, ...touch },
  tablette: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, userAgent: IPAD_UA, ...touch },
  paysage: { viewport: { width: 667, height: 375 }, deviceScaleFactor: 2, userAgent: IPHONE_UA, ...touch },
  // Les appareils à encoche simulée (voir l'en-tête) : `notch` dit l'encoche,
  // la barre d'accueil et la vraie hauteur ; la fenêtre en est amputée.
  iphone: { viewport: { width: 390, height: 844 - 47 - 34 }, deviceScaleFactor: 3, userAgent: IPHONE_UA, ...touch, notch: { top: 47, bottom: 34, height: 844 } },
  iphone17: { viewport: { width: 402, height: 874 - 62 - 34 }, deviceScaleFactor: 3, userAgent: IPHONE_UA, ...touch, notch: { top: 62, bottom: 34, height: 874 } },
  android: { viewport: { width: 412, height: 840 }, deviceScaleFactor: 2.625, userAgent: ANDROID_UA, ...touch },
  mini: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, userAgent: IPHONE_UA, ...touch },
};
const DEFAULT_DEVICES = ["telephone", "tablette"];

function parseArgs(argv) {
  const args = { label: new Date().toISOString().slice(0, 10), base: "http://localhost:3000" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "--label") args.label = next();
    else if (arg === "--out") args.out = next();
    else if (arg === "--base") args.base = next();
    else if (arg === "--types") args.types = next().split(",");
    else if (arg === "--states") args.states = next().split(",");
    else if (arg === "--devices") args.devices = next().split(",");
    else if (arg === "--tous-appareils") args.devices = Object.keys(DEVICES);
    else if (arg === "--full") args.full = true;
    else if (arg === "--reduced") args.reduced = true;
    else if (arg === "--images") {
      const value = next();
      if (value !== "0" && value !== "1") throw new Error(`--images vaut 0 ou 1 : ${value}`);
      args.images = value;
    } else if (arg === "--seance") args.seance = true;
    else if (arg === "--scenes") args.scenes = next().split(",");
    else if (arg === "--seance-seule") args.seanceOnly = true;
    else if (arg === "--seance-types") {
      const value = next();
      args.seanceTypes = value === "tous" ? KINDS : value.split(",");
    } else if (arg === "--video") args.video = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("Voir l'en-tête de scripts/shoot-exercises.mjs");
      process.exit(0);
    } else throw new Error(`Option inconnue : ${arg}`);
  }
  args.out ??= process.env.SHOTS_DIR ?? path.join(os.tmpdir(), "jotna-shots");
  args.types ??= KINDS;
  args.states ??= STATES;
  args.devices ??= DEFAULT_DEVICES;
  args.scenes ??= SCENES;
  args.seanceTypes ??= [];
  for (const type of [...args.types, ...args.seanceTypes]) if (!KINDS.includes(type)) throw new Error(`Type inconnu : ${type}`);
  for (const state of args.states) if (!STATES.includes(state)) throw new Error(`État inconnu : ${state}`);
  for (const device of args.devices) if (!DEVICES[device]) throw new Error(`Appareil inconnu : ${device}`);
  for (const scene of args.scenes) if (!SCENES.includes(scene)) throw new Error(`Scène inconnue : ${scene}`);
  return args;
}

/**
 * L'encoche simulée (`DEVICES[...].notch`) : le grand Pio reprend la taille du
 * vrai écran (voir l'en-tête). À appeler une fois la scène rendue.
 */
async function simulateNotch(page, notch) {
  if (!notch) return;
  await page.evaluate(({ top, height }) => {
    const scene = document.querySelector("[data-question-scene]");
    if (!scene) return;
    const raw = getComputedStyle(scene).getPropertyValue("--stage-pio").trim();
    const real = raw.replaceAll("100svh", `${height}px`).replaceAll("100vh", `${height}px`).replaceAll("- 0px", `- ${top}px`);
    scene.style.setProperty("--stage-pio", real);
    scene.setAttribute("data-notch", `${top}`);
  }, notch);
}

/**
 * La place du premier écran dans la scène « exercice » : Pio, l'en-tête, la
 * carte, le dock (la barre « Écouter + Valider » collée en bas), la PREMIÈRE
 * réponse de la carte (la première tuile, le champ, le premier pot : le premier
 * bouton ou champ de la carte qui n'est pas de la barre d'action) et TOUTES
 * les réponses (la plus basse) par rapport au haut du dock. Le bas d'une
 * réponse est son bas VISIBLE : sa boîte et ses couches peintes (le flanc
 * d'une tuile, décalé vers le bas), pas la boîte transparente de son ombre
 * floue. Mesuré dans la page, sans défilement.
 */
async function measureFirstScreen(page) {
  return page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
    const scene = document.querySelector("[data-question-scene]");
    const pio = scene ? getComputedStyle(scene).getPropertyValue("--stage-pio").trim() : "";
    const pioBox = rect("[data-question-scene] .pio");
    const actions = rect("[data-scene-actions]");
    const dock = document.querySelector("[data-scene-dock]:not([data-dock-empty])")?.getBoundingClientRect() ?? null;
    const card = rect("[data-exercise-card]");
    const hud = rect("[data-session-hud]");
    // Le premier élément de réponse : une tuile, un champ, une étiquette à
    // glisser, une case du quadrillage ; jamais la barre d'action.
    const answers = Array.from(
      document.querySelectorAll(
        '[data-exercise-card] button, [data-exercise-card] input, [data-exercise-card] [aria-roledescription="draggable"], [data-exercise-card] [aria-roledescription="sortable"], [data-exercise-card] [role="gridcell"]',
      ),
    ).filter((element) => !element.closest("[data-scene-actions]") && !element.closest("[data-hint-slot]"));
    const visualBottom = (element) => {
      let bottom = element.getBoundingClientRect().bottom;
      for (const child of element.querySelectorAll("*")) {
        const style = getComputedStyle(child);
        if (style.backgroundColor === "rgba(0, 0, 0, 0)" && style.backgroundImage === "none" && !child.textContent?.trim()) continue;
        bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
      }
      return bottom;
    };
    const bottoms = answers.map(visualBottom);
    // Le bas utile de l'écran : le haut du dock s'il existe, sinon le bas de la fenêtre.
    const floor = dock ? dock.top : innerHeight;
    return {
      viewport: `${innerWidth} × ${innerHeight}`,
      pio,
      pioPx: pioBox ? Math.round(pioBox.height) : null,
      hudBottom: hud ? Math.round(hud.bottom) : null,
      cardTop: card ? Math.round(card.top) : null,
      dockHeight: dock ? Math.round(dock.height) : null,
      dockTop: dock ? Math.round(dock.top) : null,
      actionsBottom: actions ? Math.round(actions.bottom) : null,
      /** Le bas de la barre d'action par rapport au bas de l'écran (> 0 : elle déborde). */
      overflow: actions ? Math.round(actions.bottom - innerHeight) : null,
      /** La marge entre la première réponse et le dock (< 0 : elle est cachée). */
      firstAnswerRoom: bottoms.length ? Math.round(floor - bottoms[0]) : null,
      /** La marge entre la plus basse des réponses et le dock (< 0 : une réponse est cachée, même en partie). */
      allAnswersRoom: bottoms.length ? Math.round(floor - Math.max(...bottoms)) : null,
      answerCount: answers.length,
    };
  });
}

/**
 * La page défilée tout en bas : la marge entre le bas de la carte et le haut
 * du dock (< 0 : la dernière tuile est cachée derrière lui), et si la page
 * défile vraiment. Laisse la page en bas : la capture suivante la montre.
 */
async function measureBottom(page) {
  return page.evaluate(async () => {
    const root = document.documentElement;
    window.scrollTo({ top: root.scrollHeight, behavior: "instant" });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const card = document.querySelector("[data-exercise-card]")?.getBoundingClientRect() ?? null;
    const dock = document.querySelector("[data-scene-dock]:not([data-dock-empty])")?.getBoundingClientRect() ?? null;
    const floor = dock ? dock.top : innerHeight;
    return {
      scrolls: root.scrollHeight > innerHeight + 1,
      scrollY: Math.round(window.scrollY),
      cardRoom: card ? Math.round(floor - card.bottom) : null,
    };
  });
}

/** Le paramètre `images` de l'URL (`app/dev/images.ts`) ; vide quand `--images` n'est pas donné. */
const imagesQuery = (args) => (args.images ? `&images=${args.images}` : "");

/** La page est prête : polices chargées, carte(s) armée(s), images chargées, animations finies. */
async function settle(page, selector, extra = 900) {
  await page.waitForSelector(selector, { timeout: 30_000, state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  // Les images de tuile (`/objets/*.webp`) arrivent après le rendu : une image à mi-chemin se
  // photographierait en pastille blanche vide. On attend qu'elles aient chargé et décodé, ou
  // échoué (la pastille cède alors la place à l'émoji de la tuile, `item-pictures.tsx`), mais
  // jamais plus de cinq secondes : une image qui ne vient pas ne bloque pas la capture.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        Array.from(document.images, (image) =>
          image.complete
            ? image.decode().catch(() => {})
            : new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
              }),
        ),
      ),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]),
  );
  // Le badge « N » des outils de développement de Next, en bas à gauche, n'est
  // pas l'écran de l'enfant.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(extra);
}

async function shootGallery({ page, args, device, dir, suffix }) {
  for (const type of args.types) {
    for (const state of args.states) {
      const url = `${args.base}/dev/exercices/?type=${type}&etat=${state}&barre=0${args.reduced ? "&rm=1" : ""}${imagesQuery(args)}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await settle(page, `[data-specimen="${type}"][data-state="${state}"][data-stage-ready="1"]`);
      const name = `${type}-${state}-${device}${suffix}`;
      await page.screenshot({ path: path.join(dir, `${name}.png`) });
      if (args.full) await page.screenshot({ path: path.join(dir, `${name}-pleine.png`), fullPage: true });
      console.log(`  ${name}.png`);
    }
  }
}

/**
 * La note imprimée pour la scène « exercice » : Pio, l'en-tête, la carte, le
 * dock, si la barre d'action tient, si la première réponse est visible
 * au-dessus du dock, si TOUTES le sont ; puis, la page défilée en bas, si la
 * dernière tuile passe au-dessus du dock. La page reste défilée en bas :
 * l'appelant photographie ensuite, s'il le veut.
 */
async function firstScreenNote(page, notch) {
  await simulateNotch(page, notch);
  const m = await measureFirstScreen(page);
  const fit = m.overflow === null ? "pas de barre d'action" : m.overflow <= 0 ? "tient" : `déborde de ${m.overflow} px`;
  const dock = m.dockHeight === null ? "pas de dock" : `dock ${m.dockHeight} px (haut ${m.dockTop})`;
  const first =
    m.firstAnswerRoom === null
      ? "pas de réponse trouvée"
      : m.firstAnswerRoom >= 0
        ? `1re réponse visible (marge ${m.firstAnswerRoom} px)`
        : `1re réponse CACHÉE de ${-m.firstAnswerRoom} px`;
  const all =
    m.allAnswersRoom === null
      ? ""
      : m.allAnswersRoom >= 0
        ? ` · toutes (${m.answerCount}) : tient (marge ${m.allAnswersRoom} px)`
        : ` · toutes (${m.answerCount}) : débordent de ${-m.allAnswersRoom} px`;
  const b = await measureBottom(page);
  const bottom = !b.scrolls
    ? "ne défile pas"
    : b.cardRoom === null
      ? "pas de carte"
      : b.cardRoom >= 0
        ? `en bas, carte dégagée (marge ${b.cardRoom} px)`
        : `en bas, carte CACHÉE de ${-b.cardRoom} px`;
  return {
    text: `  (${m.viewport}${notch ? ` encoche ${notch.top}` : ""} · Pio ${m.pio || "?"} = ${m.pioPx ?? "?"} px · en-tête ${m.hudBottom} · carte ${m.cardTop} · ${dock} · actions ${m.actionsBottom} : ${fit} · ${first}${all} · ${bottom})`,
    scrolls: b.scrolls,
  };
}

async function shootSession({ page, args, device, dir, suffix }) {
  for (const scene of args.scenes) {
    const url = `${args.base}/dev/seance/?scene=${scene}&barre=0${args.reduced ? "&rm=1" : ""}${imagesQuery(args)}`;
    await page.goto(url, { waitUntil: "networkidle" });
    // Les scènes de réponse et de fin ont des entrées à ressort : on leur laisse le temps.
    await settle(page, "main", scene === "exercice" ? 1200 : 2200);
    const name = `seance-${scene}-${device}${suffix}`;
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
    if (args.full) await page.screenshot({ path: path.join(dir, `${name}-pleine.png`), fullPage: true });
    if (scene === "exercice") await noteAndShootBottom(page, dir, name, DEVICES[device].notch);
    else console.log(`  ${name}.png`);
  }
  // Chaque type de la galerie, en première question du palier de poche : la
  // vraie coque, le grand Pio, et la mesure du premier écran.
  for (const type of args.seanceTypes) {
    const url = `${args.base}/dev/seance/?exo=${type}&barre=0${args.reduced ? "&rm=1" : ""}${imagesQuery(args)}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await settle(page, "[data-scene-actions]", 1200);
    // L'encoche simulée avant la photo : Pio à sa vraie taille.
    await simulateNotch(page, DEVICES[device].notch);
    await page.waitForTimeout(100);
    const name = `seance-${type}-${device}${suffix}`;
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
    if (args.full) await page.screenshot({ path: path.join(dir, `${name}-pleine.png`), fullPage: true });
    await noteAndShootBottom(page, dir, name, DEVICES[device].notch);
  }
}

/** Imprime la mesure du premier écran et, si la page défile, la photographie défilée en bas (`-bas.png`). */
async function noteAndShootBottom(page, dir, name, notch) {
  const note = await firstScreenNote(page, notch);
  console.log(`  ${name}.png${note.text}`);
  if (note.scrolls) {
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dir, `${name}-bas.png`) });
    console.log(`  ${name}-bas.png`);
  }
}

/**
 * Une courte vidéo : l'enfant touche une option fausse, valide, voit Pio
 * encourager, puis touche la bonne, valide, et Pio fête. Le premier exercice
 * de la séance factice est le QCM des mangues (`qcm4` : « 4, 6, 5, 1 », la
 * bonne est la troisième).
 */
async function recordInteraction({ browser, args, device, dir, suffix }) {
  const videoDir = path.join(dir, ".video");
  const { notch: _notch, ...emulation } = DEVICES[device];
  const context = await browser.newContext({
    ...emulation,
    ...(args.reduced ? { reducedMotion: "reduce" } : {}),
    recordVideo: { dir: videoDir, size: emulation.viewport },
  });
  const page = await context.newPage();
  await page.goto(`${args.base}/dev/seance/?barre=0${args.reduced ? "&rm=1" : ""}${imagesQuery(args)}`, { waitUntil: "networkidle" });
  await settle(page, "main", 800);
  const options = page.locator("main button").filter({ hasText: /^[A-D]/ });
  await options.nth(0).tap();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Valider", exact: true }).tap();
  await page.waitForTimeout(3200);
  await options.nth(2).tap();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Valider", exact: true }).tap();
  await page.waitForTimeout(2600);
  const video = page.video();
  await context.close();
  if (video) {
    const target = path.join(dir, `interaction-${device}${suffix}.webm`);
    await rename(await video.path(), target);
    console.log(`  interaction-${device}${suffix}.webm`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = path.join(args.out, args.label);
  await mkdir(dir, { recursive: true });
  const suffix = args.reduced ? "-rm" : "";
  console.log(`Captures dans ${dir}`);

  const browser = await chromium.launch();
  try {
    for (const device of args.devices) {
      console.log(`${device} :`);
      const { notch: _notch, ...emulation } = DEVICES[device];
      const context = await browser.newContext({
        ...emulation,
        ...(args.reduced ? { reducedMotion: "reduce" } : {}),
      });
      const page = await context.newPage();
      if (!args.seanceOnly) await shootGallery({ page, args, device, dir, suffix });
      if (args.seance) await shootSession({ page, args, device, dir, suffix });
      await context.close();
      if (args.video) await recordInteraction({ browser, args, device, dir, suffix });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
