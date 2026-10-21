/**
 * LES FRISES — une suite qui se répète, des cases vides à remplir.
 *
 * Programme : « motifs, guirlandes et frises » en arts plastiques (étapes 1 et
 * 3), « classification, sériation » en mathématiques au CI, les rythmes en
 * éducation musicale. La frise est calculée : la réponse est la suite
 * elle-même, elle ne peut pas être fausse.
 */
import type { PatternPayload } from "./types";
import { originOf, pick, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";

type Token = { glyph: string; name: string };

const COLORS: Token[] = [
  { glyph: "🔴", name: "rouge" },
  { glyph: "🟡", name: "jaune" },
  { glyph: "🔵", name: "bleu" },
  { glyph: "🟢", name: "vert" },
  { glyph: "🟣", name: "violet" },
  { glyph: "🟠", name: "orange" },
];

const SHAPES: Token[] = [
  { glyph: "🔺", name: "triangle" },
  { glyph: "🟦", name: "carré" },
  { glyph: "⭐", name: "étoile" },
  { glyph: "🟢", name: "rond" },
  { glyph: "🔷", name: "losange" },
  { glyph: "❤️", name: "cœur" },
];

// Le Sénégal de l'enfant, comme dans les consignes du modèle (`prompts.ts`).
const THINGS: Token[] = [
  { glyph: "🥭", name: "mangue" },
  { glyph: "🐟", name: "poisson" },
  { glyph: "🌴", name: "palmier" },
  { glyph: "🥁", name: "tam-tam" },
  { glyph: "⛵", name: "pirogue" },
  { glyph: "🐐", name: "chèvre" },
  { glyph: "☀️", name: "soleil" },
  { glyph: "🌙", name: "lune" },
  { glyph: "🦁", name: "lion" },
  { glyph: "🐢", name: "tortue" },
];

/** Le rythme écrit : un coup de tam-tam, un frappé de mains, un silence. */
const BEATS: Token[] = [
  { glyph: "🥁", name: "tam-tam" },
  { glyph: "👏", name: "frappé" },
  { glyph: "🤫", name: "silence" },
];

/**
 * Les groupes qui se répètent, du plus simple au plus long. Chaque lettre
 * est un jeton différent.
 */
const MOTIFS_BY_STEP: string[][] = [
  ["AB"],
  ["AB", "AAB", "ABB"],
  ["ABC", "AABB", "AAB", "ABB"],
  ["ABC", "AABC", "ABAC", "ABCC", "ABBC"],
  ["ABCD", "AABC", "ABAC", "ABCB"],
];

/** Plus la classe est grande et le palier avancé, plus le groupe est long. */
function motifStep(ctx: GameContext): number {
  return Math.min(MOTIFS_BY_STEP.length - 1, ctx.band + ctx.level - 1);
}

type FriseTheme = "couleurs" | "formes" | "objets" | "rythme";

const THEME_TOKENS: Record<FriseTheme, Token[]> = {
  couleurs: COLORS,
  formes: SHAPES,
  objets: THINGS,
  rythme: BEATS,
};

/** La consigne d'une frise, au singulier quand une seule case manque. */
const FRISE_PROMPTS: Record<FriseTheme, { one: string[]; many: string[] }> = {
  couleurs: {
    one: [
      "Complète la frise de couleurs.",
      "Quelle couleur manque dans la frise ?",
      "Continue le motif. Quelle couleur vient ensuite ?",
    ],
    many: ["Complète la frise de couleurs.", "Quelles couleurs manquent dans la frise ?"],
  },
  formes: {
    one: [
      "Complète la frise de formes.",
      "Quelle forme manque dans la guirlande ?",
      "Continue le motif avec la bonne forme.",
    ],
    many: ["Complète la frise de formes.", "Quelles formes manquent dans la guirlande ?"],
  },
  objets: {
    one: ["Complète la frise.", "Quelle image manque dans la guirlande ?", "Continue la suite avec la bonne image."],
    many: ["Complète la frise.", "Quelles images manquent dans la guirlande ?"],
  },
  rythme: {
    one: ["Complète la suite du rythme. Tam-tam, frappé ou silence ?", "Le rythme se répète. Qu'est-ce qui manque ?"],
    many: ["Complète la suite du rythme. Tam-tam, frappé ou silence ?", "Le rythme se répète. Qu'est-ce qui manque ?"],
  },
};

const FRISE_HINTS = [
  "Regarde le début de la frise : qu'est-ce qui revient toujours ?",
  "Trouve le petit groupe qui se répète, puis dis-le à voix haute.",
  "Continue le groupe à partir de la dernière case remplie, sans sauter de case.",
];

function blankPositions(ctx: GameContext, length: number, period: number): number[] {
  // Découverte : la dernière case. Ensuite deux cases, puis une case au milieu
  // de la frise, là où l'on ne peut plus seulement « continuer ».
  if (ctx.level <= 1 && ctx.band === 0) return [length - 1];
  if (ctx.level <= 2) return ctx.band === 0 ? [length - 1] : [length - 2, length - 1];
  const middle = randomInt(ctx.rng, period, length - period - 1);
  return [middle, length - 1];
}

export function makeFrise(ctx: GameContext, theme: FriseTheme): GeneratedGame {
  const motif = pick(ctx.rng, MOTIFS_BY_STEP[motifStep(ctx)]);
  const letters = Array.from(new Set(motif.split("")));
  const pool = THEME_TOKENS[theme];
  // Le rythme n'a que trois jetons : un groupe en demande au plus trois.
  const usable = letters.length <= pool.length ? letters : letters.slice(0, pool.length);
  const chosen = shuffle(ctx.rng, pool).slice(0, usable.length);
  const tokenOf = new Map(usable.map((letter, i) => [letter, chosen[i]]));

  const period = motif.length;
  const reps = period <= 2 ? 4 : 3;
  const full: Token[] = [];
  for (let r = 0; r < reps; r++) {
    for (const letter of motif) full.push(tokenOf.get(letter) ?? chosen[0]);
  }
  const blanks = blankPositions(ctx, full.length, period);
  const sequence = full.map((token, i) => (blanks.includes(i) ? null : token.glyph));
  const answers = blanks.map((i) => full[i].glyph);

  // Les jetons du groupe, et un intrus dès que l'enfant a pris la main.
  const intruders = pool.filter((token) => !chosen.includes(token));
  const extra = ctx.level >= 2 && intruders.length > 0 ? [pick(ctx.rng, intruders)] : [];
  const options = shuffle(ctx.rng, [...chosen, ...extra]).map((token) => token.glyph);

  const payload: PatternPayload = { sequence, options, answers };
  return {
    type: "pattern",
    prompt: pick(ctx.rng, blanks.length === 1 ? FRISE_PROMPTS[theme].one : FRISE_PROMPTS[theme].many),
    payload: {
      ...payload,
      concept: theme === "rythme" ? "rythme qui se répète" : `frise de ${theme}`,
      game: { kind: `frise-${theme}`, level: ctx.level },
    },
    answerKey: answers.join(" "),
    hints: FRISE_HINTS,
  };
}

// ===========================================================================
// SUITES DE NOMBRES — 2, 4, 6, ?
// ===========================================================================

/** Les pas d'une suite et le plus grand nombre, classe par classe. */
const NUMBER_RANGES: Record<string, { max: number; steps: number[] }> = {
  CI: { max: 20, steps: [1, 2] },
  CP: { max: 100, steps: [1, 2, 5, 10] },
  CE1: { max: 1000, steps: [2, 5, 10, 100] },
  CE2: { max: 10000, steps: [5, 25, 50, 100, 1000] },
  CM1: { max: 1000000, steps: [25, 125, 250, 1000, 5000] },
  CM2: { max: 1000000, steps: [75, 125, 250, 2500, 10000] },
};

/**
 * Les milliers séparés par une espace, comme à l'école : « 12 500 ». Écrit à
 * la main : `toLocaleString` dépend des locales du moteur, et le serveur
 * comme l'application doivent écrire le même nombre.
 */
export function formatNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.abs(Math.trunc(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * LA PLAGE DES SUITES D'UNE FICHE « nombres-10 » OU « nombres-20 » (champ `vocabulary`
 * de la fiche du programme). « Les nombres jusqu'à 10 » compte de 0 à 10 ; « Les nombres
 * de 11 à 20 » de 10 à 20 : une suite y passe la dizaine. Le haut de la plage monte avec
 * le palier, mais une suite de six termes tient dans au moins sept nombres.
 */
const CAPPED_RANGES: Record<10 | 20 | 50 | 100, { lo: number; hi: Record<GameLevel, number> }> = {
  10: { lo: 0, hi: { 1: 7, 2: 9, 3: 10, 4: 10 } },
  20: { lo: 10, hi: { 1: 16, 2: 18, 3: 20, 4: 20 } },
  // Le CP : « Les nombres jusqu'à 50 » ne passe jamais cinquante, « Les nombres jusqu'à 100 » compte de cinquante à cent.
  50: { lo: 0, hi: { 1: 20, 2: 30, 3: 40, 4: 50 } },
  100: { lo: 50, hi: { 1: 70, 2: 80, 3: 90, 4: 100 } },
};

/**
 * Une suite de nombres qui avance ou recule toujours du même pas. Sans `vocabulary`, la
 * plage est celle de la classe (`NUMBER_RANGES`). La même suite deux fois dans un palier
 * se remarquerait : on en tire une autre (jusqu'à dix tirages).
 */
export function makeNumberSuite(ctx: GameContext): GeneratedGame {
  let game = drawNumberSuite(ctx);
  for (let attempt = 0; attempt < 10; attempt++) {
    const key = `suite:${JSON.stringify(game.payload.sequence)}:${game.prompt}`;
    if (!ctx.used.has(key)) {
      ctx.used.add(key);
      return game;
    }
    game = drawNumberSuite(ctx);
  }
  return game;
}

function drawNumberSuite(ctx: GameContext): GeneratedGame {
  const base = NUMBER_RANGES[ctx.klass] ?? NUMBER_RANGES.CP;
  const capMatch = /^nombres-(10|20|50|100)$/.exec(ctx.vocabulary ?? "");
  const cap = capMatch ? (Number(capMatch[1]) as 10 | 20 | 50 | 100) : null;
  const length = 6;
  const classSteps = base.steps.slice(0, Math.min(base.steps.length, ctx.level + 1));

  // La plage de la fiche, ou celle de la classe.
  const lo = cap ? CAPPED_RANGES[cap].lo : 0;
  const hi = cap ? Math.min(base.max, CAPPED_RANGES[cap].hi[ctx.level]) : base.max;
  // Un pas dont six termes ne tiennent pas dans la plage est écarté (« 0, 2, 4, 6, 8, 10 » veut 11 nombres).
  const steps = cap ? classSteps.filter((step) => (length - 1) * step <= hi - lo) : classSteps;
  const step = pick(ctx.rng, steps.length > 0 ? steps : [1]);

  // À partir de la consolidation, la suite peut descendre.
  const descending = ctx.level >= 2 && ctx.rng() < 0.4;
  let start: number;
  if (cap) {
    // Le départ est dans la plage : toute la suite aussi.
    const span = (length - 1) * step;
    start = descending ? randomInt(ctx.rng, lo + span, hi) : randomInt(ctx.rng, lo, hi - span);
  } else {
    // Le départ est un multiple du pas : « 15, 20, 25 » se lit mieux que
    // « 17, 22, 27 » quand on apprend à compter de 5 en 5. Toute la suite
    // reste entre 0 et le plus grand nombre de la classe.
    const maxK = Math.floor(base.max / step);
    const k = descending
      ? randomInt(ctx.rng, length - 1, Math.max(length - 1, maxK))
      : randomInt(ctx.rng, 0, Math.max(0, maxK - (length - 1)));
    start = k * step;
  }
  const values = Array.from({ length }, (_, i) => (descending ? start - i * step : start + i * step));
  const blanks = ctx.level >= 3 ? [randomInt(ctx.rng, 1, length - 2), length - 1] : [length - 1];
  const sequence = values.map((n, i) => (blanks.includes(i) ? null : formatNumber(n)));
  const answers = blanks.map((i) => formatNumber(values[i]));

  // Les distracteurs sont les erreurs d'un enfant : un pas de trop, un pas
  // de moins, le pas oublié. Jamais plus grand que le plus grand nombre de la fiche ou de la
  // classe (« jusqu'à 10 » ne montre pas 11), jamais dans la suite.
  const ceiling = cap ?? base.max;
  const last = values[length - 1];
  const first = values[0];
  const typical = [last + step, last - step, last + 1, last - 1, last + 2 * step, first - 1, first - step, first - 2];
  const wrong = new Set<number>();
  for (const candidate of typical) {
    if (candidate >= 0 && candidate <= ceiling && !values.includes(candidate)) wrong.add(candidate);
  }
  if (cap && wrong.size < 3) {
    // Une suite qui touche 0 ou le plafond n'a plus d'erreur typique : les nombres les plus proches de la bonne réponse,
    // pour qu'un exercice garde toujours au moins deux mauvais choix.
    const near = Array.from({ length: cap + 1 }, (_, n) => n)
      .filter((n) => !values.includes(n) && !wrong.has(n))
      .sort((a, b) => Math.abs(a - last) - Math.abs(b - last) || a - b);
    for (const n of near) {
      if (wrong.size >= 3) break;
      wrong.add(n);
    }
  }
  const options = shuffle(ctx.rng, [...new Set([...answers, ...Array.from(wrong).slice(0, 3).map(formatNumber)])]);

  const payload: PatternPayload = { sequence, options, answers };
  return {
    type: "pattern",
    prompt: descending
      ? "Complète la suite de nombres. Elle descend toujours du même pas."
      : "Complète la suite de nombres. Elle avance toujours du même pas.",
    payload: {
      ...payload,
      concept: `suite de nombres de ${step} en ${step}`,
      game: originOf("suite-nombres", ctx),
    },
    answerKey: answers.join(" "),
    hints: [
      "Regarde deux nombres qui se suivent : de combien avance-t-on ?",
      `Calcule l'écart entre le premier et le deuxième nombre, puis vérifie avec les suivants.`,
      "Ajoute (ou enlève) ce même écart à la case d'avant pour trouver la case vide.",
    ],
  };
}

export const FRISE_THEMES: FriseTheme[] = ["couleurs", "formes", "objets", "rythme"];

/** Une frise jamais vue dans ce palier : la même frise deux fois se remarquerait. */
export function makeFreshFrise(ctx: GameContext, theme: FriseTheme): GeneratedGame {
  for (let attempt = 0; attempt < 6; attempt++) {
    const game = makeFrise(ctx, theme);
    const key = `frise:${JSON.stringify(game.payload.sequence)}`;
    if (!ctx.used.has(key)) {
      ctx.used.add(key);
      return game;
    }
  }
  return makeFrise(ctx, theme);
}
