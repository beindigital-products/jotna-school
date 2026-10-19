/**
 * L'ATELIER DES COULEURS — reconnaître une couleur, prévoir un mélange,
 * retrouver les deux couleurs d'un mélange, trier chaudes et froides.
 *
 * Programme d'arts plastiques : « discrimination de formes et de couleurs »,
 * « peindre » (étape 1), « coloriage » (étape 2). Les mélanges sont ceux de
 * l'école, avec les trois couleurs primaires (rouge, jaune, bleu) et le
 * blanc qui éclaircit.
 */
import type { ColorMixPayload, Paint } from "./types";
import { pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";

export const COLOR_PAINTS: Record<string, Paint> = {
  rouge: { name: "rouge", color: "#ef4444" },
  jaune: { name: "jaune", color: "#facc15" },
  bleu: { name: "bleu", color: "#3b82f6" },
  vert: { name: "vert", color: "#22c55e" },
  orange: { name: "orange", color: "#f97316" },
  violet: { name: "violet", color: "#a855f7" },
  blanc: { name: "blanc", color: "#ffffff" },
  noir: { name: "noir", color: "#1f2937" },
  rose: { name: "rose", color: "#f9a8d4" },
  gris: { name: "gris", color: "#9ca3af" },
  "bleu clair": { name: "bleu clair", color: "#93c5fd" },
  marron: { name: "marron", color: "#92400e" },
};

/** Les mélanges de l'école : deux pots, un résultat. */
export const MIXES: { a: string; b: string; result: string; level: number }[] = [
  { a: "rouge", b: "jaune", result: "orange", level: 1 },
  { a: "jaune", b: "bleu", result: "vert", level: 1 },
  { a: "rouge", b: "bleu", result: "violet", level: 1 },
  { a: "rouge", b: "blanc", result: "rose", level: 3 },
  { a: "noir", b: "blanc", result: "gris", level: 3 },
  { a: "bleu", b: "blanc", result: "bleu clair", level: 3 },
];

/** Le mélange de deux pots, ou `null` quand l'école ne l'enseigne pas. */
export function mixOf(a: string, b: string): string | null {
  const found = MIXES.find((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a));
  return found ? found.result : null;
}

const WARM = ["rouge", "orange", "jaune"];
const COLD = ["bleu", "vert", "violet"];

const MIX_HINTS = [
  "Les trois couleurs primaires sont le rouge, le jaune et le bleu.",
  "Rouge et jaune font de l'orange ; jaune et bleu font du vert ; rouge et bleu font du violet.",
  "Le blanc éclaircit une couleur : rouge et blanc font du rose, noir et blanc du gris.",
];

const paint = (name: string): Paint => COLOR_PAINTS[name];

/** « du vert », mais « de l'orange ». */
function partitive(name: string): string {
  return /^[aeiouyéè]/i.test(name) ? `de l'${name}` : `du ${name}`;
}

function mixesFor(ctx: GameContext) {
  // Les mélanges au blanc arrivent avec l'approfondissement, et plus tôt pour
  // les grands.
  const maxLevel = ctx.level + ctx.band;
  return MIXES.filter((m) => m.level <= maxLevel);
}

export function makeColorPick(ctx: GameContext): GeneratedGame {
  const pool = ctx.band === 0 && ctx.level <= 2
    ? ["rouge", "jaune", "bleu", "vert"]
    : ["rouge", "jaune", "bleu", "vert", "orange", "violet", "rose", "marron", "noir", "gris"];
  const target = pickFresh(ctx, pool, (name) => `couleur:${name}`);
  const count = Math.min(pool.length, ctx.band === 0 ? 3 : 4);
  const others = shuffle(ctx.rng, pool.filter((n) => n !== target)).slice(0, count - 1);
  const payload: ColorMixPayload = {
    mode: "pick",
    choices: shuffle(ctx.rng, [target, ...others]).map(paint),
    answer: [target],
  };
  return {
    type: "color-mix",
    prompt: `Touche le pot de couleur ${target.toUpperCase()}.`,
    payload: { ...payload, concept: "reconnaître les couleurs", game: { kind: "couleurs-reconnaitre", level: ctx.level } },
    answerKey: target,
    hints: [
      "Regarde bien chaque pot.",
      `Pense à une chose de cette couleur autour de toi : ${exampleOf(target)}.`,
      "Élimine d'abord les pots qui ne sont pas de cette couleur.",
    ],
  };
}

function exampleOf(name: string): string {
  const examples: Record<string, string> = {
    rouge: "la tomate, le bissap",
    jaune: "le soleil, la banane",
    bleu: "le ciel, la mer",
    vert: "les feuilles du manguier",
    orange: "la mangue bien mûre",
    violet: "l'aubergine",
    rose: "la fleur de bougainvillier",
    marron: "le tronc du baobab",
    noir: "la nuit",
    gris: "les nuages de pluie",
  };
  return examples[name] ?? "un objet de la classe";
}

export function makeColorResult(ctx: GameContext): GeneratedGame {
  const mix = pickFresh(ctx, mixesFor(ctx), (m) => `melange:${m.result}`);
  const distractors = shuffle(
    ctx.rng,
    ["orange", "vert", "violet", "rose", "gris", "marron", "bleu clair"].filter((n) => n !== mix.result),
  ).slice(0, ctx.band === 0 ? 2 : 3);
  const payload: ColorMixPayload = {
    mode: "result",
    given: [paint(mix.a), paint(mix.b)],
    choices: shuffle(ctx.rng, [mix.result, ...distractors]).map(paint),
    answer: [mix.result],
  };
  return {
    type: "color-mix",
    prompt: `On mélange ${partitive(mix.a)} et ${partitive(mix.b)}. Quelle couleur obtient-on ?`,
    payload: { ...payload, concept: "mélange de deux couleurs", game: { kind: "couleurs-melange", level: ctx.level } },
    answerKey: mix.result,
    hints: MIX_HINTS,
  };
}

export function makeColorPair(ctx: GameContext): GeneratedGame {
  const mix = pickFresh(ctx, mixesFor(ctx), (m) => `paire:${m.result}`);
  const base = ["rouge", "jaune", "bleu"];
  const extra = mix.a === "blanc" || mix.b === "blanc" || mix.a === "noir" ? ["blanc", "noir"] : [];
  const choices = Array.from(new Set([...base, ...extra, mix.a, mix.b]));
  // Un pot de plus que nécessaire dès la consolidation : l'enfant choisit
  // vraiment ses deux couleurs.
  if (ctx.level >= 2 && !choices.includes("blanc")) choices.push("blanc");
  const payload: ColorMixPayload = {
    mode: "pair",
    target: paint(mix.result),
    choices: shuffle(ctx.rng, choices).map(paint),
    answer: [mix.a, mix.b],
  };
  return {
    type: "color-mix",
    prompt: `Quelles deux couleurs faut-il mélanger pour obtenir ${partitive(mix.result)} ? Touche deux pots.`,
    payload: { ...payload, concept: "retrouver les couleurs d'un mélange", game: { kind: "couleurs-melange-inverse", level: ctx.level } },
    answerKey: `${mix.a} + ${mix.b}`,
    hints: MIX_HINTS,
  };
}

export function makeWarmCold(ctx: GameContext): GeneratedGame {
  const askWarm = ctx.rng() < 0.5;
  const target = pick(ctx.rng, askWarm ? WARM : COLD);
  const others = shuffle(ctx.rng, askWarm ? COLD : WARM).slice(0, 2);
  const payload: ColorMixPayload = {
    mode: "pick",
    choices: shuffle(ctx.rng, [target, ...others]).map(paint),
    answer: [target],
  };
  return {
    type: "color-mix",
    prompt: askWarm
      ? "Touche la couleur CHAUDE, celle du soleil et du feu."
      : "Touche la couleur FROIDE, celle de la mer et de la nuit.",
    payload: { ...payload, concept: "couleurs chaudes et froides", game: { kind: "couleurs-chaudes-froides", level: ctx.level } },
    answerKey: target,
    hints: [
      "Les couleurs chaudes rappellent le soleil et le feu.",
      "Les couleurs froides rappellent l'eau, le ciel et l'ombre des arbres.",
      "Chaudes : rouge, orange, jaune. Froides : bleu, vert, violet.",
    ],
  };
}
