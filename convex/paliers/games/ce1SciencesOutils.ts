/**
 * LES AIDES COMMUNES DES GABARITS DE SCIENCES DU CE1 (`ce1Vivant.ts` et `ce1Matiere.ts`) : un QCM, une phrase à trou, un
 * appariement, un glissé, un ordre et une réponse à écrire qui se lisent dans un tableau FERMÉ de faits.
 *
 * Le modèle écrivait ici des exercices faux ou sans réponse unique : « Associe chaque aliment à son effet » (hors sujet),
 * « Mets les étapes de la prévention du paludisme dans l'ordre » (un ordre arbitraire), « Quel aliment aide les poumons ? »
 * (le bissap), « Nomme une manière de séparer le sable de l'eau » (deux réponses justes). Un gabarit lit une ligne d'un tableau
 * écrit à la main : la bonne réponse est dans la ligne, les mauvais choix ne peuvent pas être une deuxième bonne réponse, et le
 * test recalcule chaque ligne à part.
 *
 * Le CE1 a quatre paliers aux niveaux 1 à 4 : `quarter` donne à chaque niveau sa part du tableau, quatre parts qui le couvrent TOUT (aucune ligne
 * n'est jamais perdue, aucune n'est servie à deux niveaux), pour que deux paliers ne posent pas la même question. Un tableau lu `uses` fois par
 * palier doit avoir au moins quatre fois `uses` lignes ; en dessous, un niveau lit tout le tableau.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { originOf, pickFresh, shuffle, takeFresh, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame, type Hints } from "./tableaux";

/** La part `index` (de 0 à `parts` - 1) d'une liste coupée en `parts` morceaux qui la couvrent entièrement, de longueurs égales à une près. */
export function partOf<T>(items: readonly T[], index: number, parts: number): T[] {
  return items.slice(Math.floor((items.length * index) / parts), Math.floor((items.length * (index + 1)) / parts));
}

/** Les lignes d'un niveau : sa part de la liste coupée en quatre. Si la part est plus courte que `uses`, tout le tableau. */
export function quarter<T>(items: readonly T[], level: GameLevel, uses = 1): T[] {
  const part = partOf(items, level - 1, 4);
  return part.length >= uses ? part : [...items];
}

/** Une question à trois choix : la bonne réponse et deux mauvais choix, dont aucun n'est juste. */
export type Fact = { question: string; answer: string; wrong: readonly [string, string]; hints: Hints };

/** Une phrase à trou : la phrase écrite avec `___`, le mot qui la complète, deux mots qui ne la complètent pas. */
export type GapFact = { text: string; answer: string; wrong: readonly [string, string]; hints: Hints };

/** Une réponse à écrire : un mot de la liste fermée, avec les écritures admises (la première est la bonne réponse). */
export type WriteFact = { prompt: string; accepted: readonly string[]; hints: Hints };

/**
 * Une ligne du tableau pour ce palier : de préférence une dont la bonne réponse n'a pas déjà servi dans ce palier, pour que deux phrases
 * à trou d'un même palier ne se complètent pas par le même mot.
 */
export function pickLine<T extends { answer: string }>(ctx: GameContext, kind: string, lines: readonly T[], keyOf: (line: T) => string): T {
  const unused = lines.filter((line) => !ctx.used.has(`${kind}:answer:${line.answer}`));
  const chosen = pickFresh(ctx, unused.length > 0 ? unused : lines, keyOf);
  ctx.used.add(`${kind}:answer:${chosen.answer}`);
  return chosen;
}

/** Un QCM lu dans un tableau de faits. */
export function factChoice(ctx: GameContext, kind: string, concept: string, facts: readonly Fact[], uses = 1): GeneratedGame {
  return choiceGame(ctx, kind, concept, () => {
    const fact = pickLine(ctx, kind, quarter(facts, ctx.level, uses), (candidate) => `${kind}:${candidate.question}`);
    return { prompt: fact.question, answer: fact.answer, wrong: fact.wrong, hints: fact.hints };
  });
}

/** Une phrase à trou lue dans un tableau de phrases. */
export function factGap(ctx: GameContext, kind: string, concept: string, facts: readonly GapFact[], uses = 1): GeneratedGame {
  return gapGame(ctx, kind, concept, () => {
    const fact = pickLine(ctx, kind, quarter(facts, ctx.level, uses), (candidate) => `${kind}:${candidate.text}`);
    return { prompt: "Complète la phrase.", text: fact.text, answer: fact.answer, wrong: fact.wrong, hints: fact.hints };
  });
}

/** Une réponse à écrire lue dans un tableau de questions. */
export function factWrite(ctx: GameContext, kind: string, concept: string, facts: readonly WriteFact[], uses = 1): GeneratedGame {
  const fact = pickFresh(ctx, quarter(facts, ctx.level, uses), (candidate) => `${kind}:${candidate.prompt}`);
  return {
    type: "short-answer",
    prompt: fact.prompt,
    payload: { acceptedAnswers: [...fact.accepted], game: originOf(kind, ctx), concept },
    answerKey: fact.accepted[0],
    hints: [...fact.hints],
  };
}

/** Un ensemble de choses rangées dans une case : ce que la case dit, et les étiquettes (un nom seul, avec sa majuscule). */
export type Bin = { zone: string; tiles: readonly string[] };

/**
 * Un glissé entre deux cases lu dans deux ensembles : `count` étiquettes en tout (au moins une dans chaque case), prises de préférence
 * parmi celles que le palier n'a pas encore montrées. Aux deux premiers niveaux, quatre étiquettes ; ensuite, cinq.
 */
export function binSort(
  ctx: GameContext,
  kind: string,
  concept: string,
  prompt: string,
  first: Bin,
  second: Bin,
  hints: Hints,
  counts: { easy: number; hard: number } = { easy: 4, hard: 5 },
): GeneratedGame {
  return sortGame(ctx, kind, concept, () => {
    const total = ctx.level <= 2 ? counts.easy : counts.hard;
    // Un ensemble plus court que sa part (le sel et le sucre, seuls à se dissoudre) donne toute sa place à l'autre.
    const wanted = ctx.rng() < 0.5 ? Math.ceil(total / 2) : Math.floor(total / 2);
    const firstCount = Math.max(total - second.tiles.length, Math.min(wanted, first.tiles.length));
    const firstTiles = takeFresh(ctx, quarter(first.tiles, ctx.level, firstCount + 1), firstCount, (tile) => `${kind}:tile:${tile}`);
    const secondTiles = takeFresh(ctx, quarter(second.tiles, ctx.level, total - firstCount + 1), total - firstCount, (tile) => `${kind}:tile:${tile}`);
    return {
      prompt,
      zones: [first.zone, second.zone],
      items: [...firstTiles.map((text) => ({ text, zone: first.zone })), ...secondTiles.map((text) => ({ text, zone: second.zone }))],
      hints,
    };
  });
}

/** Toutes les façons de prendre trois paires dans un tableau, rangées dans l'ordre du tableau. */
function triples<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let a = 0; a < items.length; a++)
    for (let b = a + 1; b < items.length; b++) for (let c = b + 1; c < items.length; c++) out.push([items[a], items[b], items[c]]);
  return out;
}

/**
 * Un appariement de trois paires prises dans un tableau : la gauche et la droite de chaque paire sont toutes différentes. Chaque niveau
 * a ses propres trios de paires (`quarter` sur la liste des trios), pour que deux paliers ne posent pas le même appariement.
 */
export function pickPairs(
  ctx: GameContext,
  kind: string,
  concept: string,
  prompt: string,
  pool: readonly (readonly [string, string])[],
  hints: Hints,
): GeneratedGame {
  return linkGame(ctx, kind, concept, () => {
    const chosen = pickFresh(ctx, quarter(triples(pool), ctx.level, 1), (trio) => `${kind}:${trio.map((pair) => pair[0]).join("|")}`);
    return { prompt, pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })), hints };
  });
}

/** Une suite à ranger lue dans un tableau : l'énoncé dit en quel sens, les étapes sont dans l'ordre juste. `steps` est déjà la part du niveau. */
export type Steps = { prompt: string; sequence: readonly string[]; hints: Hints };

/** Les indices d'un ordre de gestes, et d'un ordre de faits : ils ne nomment aucune étape, ils disent comment chercher. */
export const GESTURE_STEP_HINTS: Hints = ["Pense à ce qui doit se faire en premier.", "Chaque geste prépare le suivant.", "Le dernier geste termine le travail."];
export const FACT_STEP_HINTS: Hints = ["Pense à ce qui arrive d'abord, puis à ce qui suit.", "Chaque fait amène le suivant.", "Le dernier fait vient de tous les autres."];

export function stepsOrder(ctx: GameContext, kind: string, concept: string, steps: readonly Steps[]): GeneratedGame {
  return sequenceGame(ctx, kind, concept, () => {
    const entry = pickFresh(ctx, steps, (candidate) => `${kind}:${candidate.sequence.join("|")}`);
    return { prompt: entry.prompt, sequence: entry.sequence, hints: entry.hints };
  });
}

/** Une réponse à écrire lue dans un tableau, de préférence une dont le mot juste n'a pas déjà servi dans ce palier (le mot juste est la première écriture admise). */
export function factWriteLine(ctx: GameContext, kind: string, concept: string, facts: readonly WriteFact[], uses = 1): GeneratedGame {
  const lines = quarter(facts, ctx.level, uses).map((fact) => ({ fact, answer: fact.accepted[0] }));
  const chosen = pickLine(ctx, kind, lines, (line) => `${kind}:${line.fact.prompt}`).fact;
  return {
    type: "short-answer",
    prompt: chosen.prompt,
    payload: { acceptedAnswers: [...chosen.accepted], game: originOf(kind, ctx), concept },
    answerKey: chosen.accepted[0],
    hints: [...chosen.hints],
  };
}

/**
 * Un ordre dont les suites sont écrites en deux versions, une courte (trois étapes, aux niveaux 1 et 2) et une longue (quatre, aux niveaux 3 et 4) :
 * chaque niveau lit sa moitié de la liste de son niveau, toutes les suites sont servies à un niveau ou à un autre.
 */
export function stepsByLevel(ctx: GameContext, kind: string, concept: string, short: readonly Steps[], long: readonly Steps[]): GeneratedGame {
  const steps = ctx.level <= 2 ? partOf(short, ctx.level - 1, 2) : partOf(long, ctx.level - 3, 2);
  return stepsOrder(ctx, kind, concept, steps);
}
