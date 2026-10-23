/**
 * LES AIDES COMMUNES DES GABARITS DU CE2 : des tableaux de lignes fermés (une question, une phrase à trou, un ordre, un
 * appariement, un glissé, une réponse à écrire), dont chaque ligne porte ses indices, et la fenêtre de lignes que chaque
 * palier reçoit.
 *
 * Le CE2 a quatre paliers, joués aux niveaux 1, 2, 3 et 4, comme le CE1 : `levelGroup` et `variantsForLevel` (`tableaux.ts`)
 * donnent le même groupe aux niveaux 3 et 4. `windowFor` (`ce1Outils.ts`, une aide neutre) donne à chaque niveau sa fenêtre de
 * lignes : au moins `uses` lignes (le nombre de fois que le palier pose le gabarit), et un quart de la liste quand elle est
 * assez longue pour que deux paliers ne partagent aucune ligne. Une liste de moins de quatre fois `uses` lignes oblige à des
 * lignes communes à deux paliers voisins : il faut alors l'allonger.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { cap, joinFrench, windowFor } from "./ce1Outils";
import { fresh, originOf, pickFresh, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame, type Hints } from "./tableaux";

export { cap, joinFrench, windowFor };
export type { Hints };

/**
 * Le FAIT qu'une ligne pose (« royaume:Cayor », « besoin:cuisiner ») : la clé est partagée par les gabarits d'une thématique, quel que
 * soit le jeu. Un palier qui a déjà posé le titre du roi du Cayor en préfère un autre au gabarit suivant, au lieu de poser trois fois
 * le même fait en QCM, en phrase à trou et en réponse à écrire. Sans fait, la ligne ne se compte que dans son propre gabarit.
 */
type Fact = { fact?: string };
/** Une question à trois choix : la bonne réponse et deux mauvais choix qui ne peuvent pas être une deuxième bonne réponse. */
export type QuestionRow = Fact & { prompt: string; answer: string; wrong: readonly string[]; hints: Hints };
/** Une phrase à trou : le trou s'écrit `___`. */
export type GapRow = Fact & { text: string; answer: string; wrong: readonly string[]; hints: Hints };
/** Une suite à remettre dans l'ordre : l'énoncé dit selon quoi. */
export type OrderRow = Fact & { prompt: string; sequence: readonly string[]; hints: Hints };
/** Des paires à relier : toutes les gauches, et toutes les droites, sont différentes. */
export type LinkRow = Fact & { prompt: string; pairs: readonly { left: string; right: string }[]; hints: Hints };
/** Des étiquettes à glisser dans l'une de deux cases. */
export type SortRow = Fact & {
  prompt: string;
  zones: readonly [string, string];
  items: readonly { text: string; zone: string }[];
  hints: Hints;
};
/** Une réponse à écrire : les écritures admises, la première est la réponse donnée. */
export type WriteRow = Fact & { prompt: string; accepted: readonly string[]; hints: Hints };

/** Pose le fait de chaque ligne d'un tableau (selon la ligne et sa place), et rend le tableau. */
export function tag<T extends Fact>(rows: readonly T[], factOf: (row: T, index: number) => string | undefined): readonly T[] {
  rows.forEach((row, index) => {
    const fact = factOf(row, index);
    if (fact !== undefined) row.fact = fact;
  });
  return rows;
}

/**
 * La fenêtre de lignes d'un quart de la liste : `uses` lignes au moins (le palier pose le gabarit `uses` fois), un quart de la liste
 * quand elle est assez longue. Les quatre quarts se suivent du début à la fin de la liste ; `quarter` va de 0 à 3.
 */
function windowAt<T>(items: readonly T[], quarter: number, uses: number): T[] {
  const size = Math.max(uses, Math.floor(items.length / 4));
  if (items.length <= size) return [...items];
  const start = Math.floor(((items.length - size) * quarter) / 3);
  return items.slice(start, start + size);
}

/**
 * Une ligne pour ce palier, prise dans la fenêtre du niveau. `shift` décale la fenêtre de quelques quarts : des gabarits qui posent les
 * mêmes faits, dans des listes rangées dans le même ordre (le titre du roi du Cayor en QCM, en phrase à trou et à écrire), prennent
 * chacun un décalage différent et ne posent donc pas, dans un même palier, le même fait trois fois. Chaque gabarit parcourt toujours les
 * quatre quarts d'une liste d'un palier à l'autre.
 *
 * La clé d'une ligne a son propre préfixe : celle que `fresh` pose pour une question servie (`kind:énoncé|réponse`) ne doit jamais la
 * recouper, sans quoi `fresh` croirait la question déjà vue et prendrait huit lignes de plus pour rien. Une ligne qui pose un fait
 * (`fact`) prend la clé de ce fait, la même pour tous les gabarits du palier : dans sa fenêtre, un gabarit préfère un fait que les
 * gabarits d'avant n'ont pas posé.
 */
function pickRow<T extends Fact>(ctx: GameContext, kind: string, rows: readonly T[], uses: number, keyOf: (row: T) => string, shift: number): T {
  const own = (row: T) => `ligne|${kind}|${keyOf(row)}`;
  const key = (row: T) => (row.fact !== undefined ? `fait|${row.fact}` : own(row));
  const window = windowAt(rows, (ctx.level - 1 + shift) % 4, uses);
  // Un gabarit posé plusieurs fois dans un palier ne reprend jamais sa propre ligne tant que sa fenêtre en a une autre : quand les faits de la
  // fenêtre ont tous servi à d'autres gabarits, `pickFresh` tire au hasard dans la fenêtre et `fresh` n'a que huit essais pour éviter le doublon.
  const notYetHere = window.filter((row) => !ctx.used.has(own(row)));
  const chosen = pickFresh(ctx, notYetHere.length > 0 ? notYetHere : window, key);
  ctx.used.add(own(chosen));
  return chosen;
}

/**
 * `keyOf` dit ce qui fait l'identité d'une question dans un palier : par défaut son énoncé (la même question ne revient pas, quelle
 * que soit sa réponse) ; pour un énoncé que beaucoup de lignes partagent (« Lequel de ces royaumes est un royaume wolof ? »), l'énoncé
 * et la bonne réponse.
 */
export function ce2Question(
  ctx: GameContext,
  kind: string,
  concept: string,
  rows: readonly QuestionRow[],
  uses = 1,
  keyOf: (row: QuestionRow) => string = (row) => row.prompt,
  shift = 0,
): GeneratedGame {
  return choiceGame(ctx, kind, concept, () => {
    const row = pickRow(ctx, kind, rows, uses, keyOf, shift);
    return { prompt: row.prompt, answer: row.answer, wrong: row.wrong, hints: row.hints };
  });
}

export function ce2Gap(ctx: GameContext, kind: string, concept: string, rows: readonly GapRow[], uses = 1, shift = 0): GeneratedGame {
  return gapGame(ctx, kind, concept, () => {
    const row = pickRow(ctx, kind, rows, uses, (candidate) => candidate.text, shift);
    return { prompt: "Complète la phrase.", text: row.text, answer: row.answer, wrong: row.wrong, hints: row.hints };
  });
}

export function ce2Order(ctx: GameContext, kind: string, concept: string, rows: readonly OrderRow[], uses = 1, shift = 0): GeneratedGame {
  return sequenceGame(ctx, kind, concept, () => {
    const row = pickRow(ctx, kind, rows, uses, (candidate) => `${candidate.prompt}|${candidate.sequence.join(",")}`, shift);
    return { prompt: row.prompt, sequence: row.sequence, hints: row.hints };
  });
}

export function ce2Link(ctx: GameContext, kind: string, concept: string, rows: readonly LinkRow[], uses = 1, shift = 0): GeneratedGame {
  return linkGame(ctx, kind, concept, () => {
    const row = pickRow(ctx, kind, rows, uses, (candidate) => `${candidate.prompt}|${candidate.pairs.map((pair) => pair.left).join(",")}`, shift);
    return { prompt: row.prompt, pairs: row.pairs, hints: row.hints };
  });
}

export function ce2Sort(ctx: GameContext, kind: string, concept: string, rows: readonly SortRow[], uses = 1, shift = 0): GeneratedGame {
  return sortGame(ctx, kind, concept, () => {
    const row = pickRow(ctx, kind, rows, uses, (candidate) => `${candidate.prompt}|${candidate.items.map((item) => item.text).join(",")}`, shift);
    return { prompt: row.prompt, zones: row.zones, items: row.items, hints: row.hints };
  });
}

export function ce2Write(ctx: GameContext, kind: string, concept: string, rows: readonly WriteRow[], uses = 1, shift = 0): GeneratedGame {
  return fresh(ctx, kind, () => {
    const row = pickRow(ctx, kind, rows, uses, (candidate) => candidate.prompt, shift);
    return {
      type: "short-answer",
      prompt: row.prompt,
      payload: { acceptedAnswers: [...row.accepted], game: originOf(kind, ctx), concept },
      answerKey: row.accepted[0],
      hints: [...row.hints],
    };
  });
}

/** Toutes les combinaisons de `size` éléments d'une liste, dans l'ordre de la liste. */
export function combinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...rest] = items;
  return [...combinations(rest, size - 1).map((tail) => [head, ...tail]), ...combinations(rest, size)];
}

// ---------------------------------------------------------------------------
// Des constructeurs de lignes, pour écrire les tableaux sans répéter la forme d'une ligne.
// ---------------------------------------------------------------------------

export const hints = (first: string, second: string, third: string): Hints => [first, second, third];
const withFact = (fact: string | undefined) => (fact === undefined ? {} : { fact });
export const qr = (prompt: string, answer: string, wrong: readonly [string, string], h: Hints, fact?: string): QuestionRow => ({ prompt, answer, wrong, hints: h, ...withFact(fact) });
export const gr = (text: string, answer: string, wrong: readonly [string, string], h: Hints, fact?: string): GapRow => ({ text, answer, wrong, hints: h, ...withFact(fact) });
export const wr = (prompt: string, accepted: readonly string[], h: Hints, fact?: string): WriteRow => ({ prompt, accepted, hints: h, ...withFact(fact) });
export const ordr = (prompt: string, sequence: readonly string[], h: Hints, fact?: string): OrderRow => ({ prompt, sequence, hints: h, ...withFact(fact) });

/** Des glissés en deux cases bâtis sur deux listes : deux étiquettes de chaque, `count` tirages répartis sur toutes les combinaisons. */
export function sortRows(prompt: string, zones: readonly [string, string], first: readonly string[], second: readonly string[], h: Hints, count: number): SortRow[] {
  const all = combinations(first, 2).flatMap((a) => combinations(second, 2).map((b) => ({ a, b })));
  const step = all.length / count;
  return Array.from({ length: count }, (_, i) => all[Math.floor(i * step)]).map(({ a, b }) => ({
    prompt,
    zones,
    items: [...a.map((text) => ({ text, zone: zones[0] })), ...b.map((text) => ({ text, zone: zones[1] }))],
    hints: h,
  }));
}

/**
 * Range les lignes d'un tableau selon l'ordre des faits d'une thématique, en commençant par la première ligne de chaque fait : les lignes
 * qui reposent le même fait (deux façons de le demander) viennent après, loin de la première, donc dans un autre quart de la liste.
 * Les lignes sans fait, ou d'un fait inconnu, ferment la liste.
 */
export function inFactOrder<T extends Fact>(rows: readonly T[], order: readonly string[]): readonly T[] {
  const seen = new Map<string, number>();
  const keyed = rows.map((row, index) => {
    const known = row.fact !== undefined && order.includes(row.fact);
    const occurrence = row.fact === undefined ? 0 : (seen.get(row.fact) ?? 0);
    if (row.fact !== undefined) seen.set(row.fact, occurrence + 1);
    return { row, index, occurrence, rank: known ? order.indexOf(row.fact as string) : order.length };
  });
  return keyed.sort((a, b) => a.occurrence - b.occurrence || a.rank - b.rank || a.index - b.index).map(({ row }) => row);
}
