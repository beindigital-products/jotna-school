/**
 * LES OUTILS COMMUNS DES GABARITS DU CE1 : les variantes réparties entre les quatre paliers, les prénoms des petites
 * histoires et les chronologies datées (histoire et géographie du CE1, `ce1Histoire.ts` et `ce1Geographie.ts`).
 *
 * Le CE1 a quatre paliers, joués aux niveaux 1, 2, 3 et 4. `levelGroup` et `variantsForLevel` (`tableaux.ts`) donnent le même
 * groupe aux niveaux 3 et 4, comme il convient aux classes à trois paliers : un gabarit du CE1 qui n'a que quelques variantes
 * reposerait la même question aux paliers 3 et 4. `windowOf` donne à chaque niveau sa propre fenêtre de variantes.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { randomInt, shuffle, takeFresh, type GameContext, type GameLevel } from "./shared";
import { cap } from "./tableaux";

export { cap };

/**
 * La fenêtre de variantes d'un niveau : `size` variantes qui glissent du début de la liste au niveau 1 à la fin de la liste au
 * niveau 4. Deux paliers voisins se partagent peu de variantes, le premier et le dernier aucune quand la liste est assez longue.
 * Une liste plus courte que la fenêtre reste entière.
 */
export function windowOf<T>(items: readonly T[], level: GameLevel, size: number): T[] {
  if (items.length <= size) return [...items];
  const start = Math.floor(((items.length - size) * (level - 1)) / 3);
  return items.slice(start, start + size);
}

/**
 * La fenêtre d'un niveau pour un gabarit que le palier demande `uses` fois : au moins `uses` variantes (sans quoi le palier reposerait la
 * même question), et un quart de la liste quand elle est assez longue, pour que deux paliers ne partagent aucune variante. Une liste
 * plus courte que quatre fois `uses` oblige à des variantes communes à deux paliers voisins : il faut alors l'allonger.
 */
export function windowFor<T>(items: readonly T[], level: GameLevel, uses = 1): T[] {
  return windowOf(items, level, Math.max(uses, Math.floor(items.length / 4)));
}

/** Les prénoms des petites histoires : sans apostrophe, jamais mêlés dans un même énoncé. */
export const FEMININE_NAMES = ["Awa", "Fatou", "Aminata", "Khady", "Penda", "Mariama"] as const;
export const MASCULINE_NAMES = ["Moussa", "Cheikh", "Modou", "Ibrahima", "Ousmane", "Samba"] as const;

/** « a, b et c » : une liste dite en français. */
export function joinFrench(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

// ===========================================================================
// LES CHRONOLOGIES DATÉES
// ===========================================================================

/**
 * Un événement d'un village ou d'une école : l'étiquette est un nom seul, sans article, et la proposition ne contient
 * aucune apostrophe (un énoncé n'en a qu'une au plus).
 */
export type ChronoEvent = { tile: string; clause: (year: number) => string };

/** Ce qui arrive dans un village, dans un ordre quelconque : aucun n'est avant les autres. */
export const VILLAGE_EVENTS: readonly ChronoEvent[] = [
  { tile: "Marché", clause: (y) => `le marché ouvre en ${y}` },
  { tile: "Mairie", clause: (y) => `la mairie est bâtie en ${y}` },
  { tile: "Puits", clause: (y) => `le puits est creusé en ${y}` },
  { tile: "Dispensaire", clause: (y) => `le dispensaire ouvre en ${y}` },
  { tile: "Pont", clause: (y) => `le pont est construit en ${y}` },
  { tile: "Mosquée", clause: (y) => `la mosquée est bâtie en ${y}` },
  { tile: "Fontaine", clause: (y) => `la fontaine est installée en ${y}` },
  { tile: "Route", clause: (y) => `la route est goudronnée en ${y}` },
  { tile: "Monument", clause: (y) => `le monument est élevé en ${y}` },
];

/** Ce qui s'ajoute à une école, dans un ordre quelconque. */
export const SCHOOL_EVENTS: readonly ChronoEvent[] = [
  { tile: "Cantine", clause: (y) => `la cantine ouvre en ${y}` },
  { tile: "Bibliothèque", clause: (y) => `la bibliothèque ouvre en ${y}` },
  { tile: "Puits", clause: (y) => `le puits est creusé en ${y}` },
  { tile: "Clôture", clause: (y) => `la clôture est posée en ${y}` },
  { tile: "Terrain", clause: (y) => `le terrain est tracé en ${y}` },
  { tile: "Cour", clause: (y) => `la cour est goudronnée en ${y}` },
];

export type Dated = { event: ChronoEvent; year: number };

/** L'écart minimal entre deux années, et le pas des années, par niveau : de plus en plus serrés. */
const YEAR_GAP: Record<GameLevel, number> = { 1: 20, 2: 10, 3: 5, 4: 3 };
const YEAR_STEP: Record<GameLevel, number> = { 1: 20, 2: 10, 3: 5, 4: 1 };

/** `count` années distinctes entre 1900 et 2020, rangées de la plus ancienne à la plus récente. */
export function drawYears(ctx: GameContext, count: number): number[] {
  const low = 1900;
  const high = 2020;
  const step = YEAR_STEP[ctx.level];
  const gap = YEAR_GAP[ctx.level];
  const slots = Math.floor((high - low) / step);
  for (let attempt = 0; attempt < 400; attempt++) {
    const years = new Set<number>();
    while (years.size < count) years.add(low + step * randomInt(ctx.rng, 0, slots));
    const sorted = [...years].sort((a, b) => a - b);
    if (sorted.every((year, i) => i === 0 || year - sorted[i - 1] >= gap)) return sorted;
  }
  // Un tirage serré qui n'aboutit pas : des années régulières, jamais deux fois la même.
  return Array.from({ length: count }, (_, i) => low + Math.floor(((high - low) * i) / (count - 1 || 1)));
}

/**
 * `count` événements de la liste, chacun avec son année. `chronological` les range du plus ancien au plus récent, `shown`
 * les range dans un ordre qui n'est pas celui du temps (l'énoncé les dit en désordre). Avec `withBase`, une année plus ancienne
 * que toutes les autres est réservée à un événement de départ, que l'appelant écrit lui-même (`baseYear`).
 */
export function drawDated(
  ctx: GameContext,
  pool: readonly ChronoEvent[],
  count: number,
  withBase = false,
): { chronological: Dated[]; shown: Dated[]; baseYear: number } {
  const events = takeFresh(ctx, pool, count, (event) => `ce1-evenement:${event.tile}`);
  const years = drawYears(ctx, withBase ? count + 1 : count);
  const baseYear = withBase ? years[0] : 0;
  const rest = shuffle(ctx.rng, withBase ? years.slice(1) : years);
  const dated = events.map((event, i) => ({ event, year: rest[i] }));
  const chronological = [...dated].sort((a, b) => a.year - b.year);
  const sorted = (list: readonly Dated[]) => list.every((entry, i) => entry === chronological[i]);
  let shown = shuffle(ctx.rng, dated);
  for (let attempt = 0; attempt < 8 && sorted(shown); attempt++) shown = shuffle(ctx.rng, dated);
  return { chronological, shown, baseYear };
}

/** « Le marché ouvre en 1980, la mairie est bâtie en 1950 et le puits est creusé en 2000. » */
export function sentenceOf(list: readonly Dated[]): string {
  const clauses = list.map((entry) => entry.event.clause(entry.year));
  return `${cap(joinFrench(clauses))}.`;
}
