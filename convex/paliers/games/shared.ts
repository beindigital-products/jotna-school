/**
 * Ce que tous les jeux partagent : le tirage reproductible, la difficulté,
 * la forme d'un exercice fabriqué.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { VisibleClassName } from "../../curriculum";
import { difficultyStage } from "../../palierRules";
import { seededRandom } from "../exerciseRules";
import type { GameOrigin } from "./types";

/**
 * Les exercices fabriqués par le code : les quatre jeux (`exerciseTypes.ts`)
 * et les GABARITS, qui rendent un type classique (QCM, ordre, association,
 * phrase à trous) écrit à partir d'un vocabulaire fermé et vérifié
 * (`words.ts`, `counting.ts`). Le modèle de langue se trompait de découpe en
 * syllabes et de somme ; un gabarit ne se trompe pas.
 */
export type GameExerciseType =
  | "pattern"
  | "pixel-art"
  | "listen"
  | "color-mix"
  | "qcm"
  | "order"
  | "match"
  | "drag-drop"
  | "fill-blank"
  // Une réponse à écrire, dès le CP : un nombre en chiffres, ou un mot de la liste fermée du gabarit (une seule réponse admise).
  | "short-answer";

/** Un exercice fabriqué, prêt à rejoindre les exercices du palier. */
export type GeneratedGame = {
  type: GameExerciseType;
  prompt: string;
  /** Le payload complet ; `game` et `concept` y voyagent, jamais montrés à l'enfant. */
  payload: Record<string, unknown> & { game: GameOrigin; concept: string };
  answerKey: string;
  hints: string[];
};

/**
 * L'âge de la classe, en trois tranches : CI-CP (on apprend à lire),
 * CE1-CE2, CM1-CM2. Les jeux s'agrandissent d'une tranche à l'autre.
 */
export type AgeBand = 0 | 1 | 2;

export function ageBand(klass: VisibleClassName): AgeBand {
  if (klass === "CI" || klass === "CP") return 0;
  if (klass === "CE1" || klass === "CE2") return 1;
  return 2;
}

/**
 * La difficulté d'un jeu, de 1 à 4, lue sur la position du palier dans sa
 * thématique : découverte, consolidation, approfondissement, maîtrise
 * (`palierRules.difficultyStage`, la même échelle que la consigne du modèle).
 */
export type GameLevel = 1 | 2 | 3 | 4;

export function gameLevel(palierIndex: number, palierCount: number): GameLevel {
  switch (difficultyStage(palierIndex, palierCount)) {
    case "decouverte":
      return 1;
    case "consolidation":
      return 2;
    case "approfondissement":
      return 3;
    case "maitrise":
      return 4;
  }
}

/**
 * Le groupe de variantes qu'un palier préfère : 0 au niveau 1, 1 au niveau 2, 2 aux niveaux 3 et 4. Le CP et le CI ont trois paliers, joués
 * aux niveaux 1, 2 et 4 : chacun a son groupe. Les classes à quatre paliers en ont trois, dont le dernier est partagé.
 */
export function levelGroup(level: GameLevel): 0 | 1 | 2 {
  return level === 1 ? 0 : level === 2 ? 1 : 2;
}

/**
 * Les variantes d'un gabarit qui n'en a que quelques-unes, réparties par palier : le premier tiers au premier palier, le deuxième
 * au deuxième, le dernier tiers ensuite. Deux paliers d'une même thématique ne tirent ainsi jamais la même variante (le CP a trois
 * paliers, joués aux niveaux 1, 2 et 4) : sans cela, un enfant revoyait « Deux ___ font un kilogramme » aux trois paliers. Il faut
 * au moins trois variantes ; en dessous, toutes restent permises. `shift` décale le groupe de 0, 1 ou 2 crans.
 */
export function variantsForLevel<T>(items: readonly T[], level: GameLevel, shift = 0): T[] {
  const group = (levelGroup(level) + shift) % 3;
  const from = Math.floor((items.length * group) / 3);
  const to = Math.floor((items.length * (group + 1)) / 3);
  return to > from ? items.slice(from, to) : [...items];
}

/** Ce qu'un jeu sait de l'exercice à fabriquer. */
export type GameContext = {
  klass: VisibleClassName;
  band: AgeBand;
  level: GameLevel;
  rng: () => number;
  /**
   * Ce que les exercices précédents du même palier ont déjà pris (un motif,
   * une frise) : deux exercices identiques dans un palier, l'enfant le voit.
   */
  used: Set<string>;
  /** Le vocabulaire d'un gabarit de mots (« mots-2 » : les mots vus jusqu'au deuxième palier de lecture). */
  vocabulary?: string;
  /**
   * Présent quand la thématique partage ses variantes entre ses paliers (`ProgrammeTopic.byLevel`) : le décalage de groupe de ce jeu
   * (0, 1 ou 2, selon sa place dans la thématique). `pickFresh` et `takeFresh` préfèrent alors le tiers de la liste qui revient à ce
   * palier, décalé de ce nombre de crans : les genres qui puisent dans les mêmes faits préfèrent des tiers différents dans un même
   * palier. Absent, ils tirent dans toute la liste.
   */
  window?: 0 | 1 | 2;
};

export function makeContext(
  klass: VisibleClassName,
  level: GameLevel,
  seed: string,
  used: Set<string> = new Set(),
  vocabulary?: string,
  window?: 0 | 1 | 2,
): GameContext {
  return { klass, band: ageBand(klass), level, rng: seededRandom(seed), used, vocabulary, window };
}

/** L'origine à poser dans le payload : de quoi refaire le même gabarit avec une autre graine. */
export function originOf(kind: string, ctx: GameContext): GameOrigin {
  return ctx.vocabulary ? { kind, level: ctx.level, vocabulary: ctx.vocabulary } : { kind, level: ctx.level };
}

/**
 * La question qu'un tirage pose : son énoncé et sa bonne réponse. Les mauvais choix, tirés au hasard
 * et mélangés, ne font pas une autre question : « Quel nombre vient juste avant 14 ? » avec d'autres
 * distracteurs reste la même question.
 */
const questionOf = (game: GeneratedGame) => `${game.prompt}|${game.answerKey}`;

/** Les options d'un tirage, triées : deux QCM aux mêmes choix dans un autre ordre sont le même exercice. */
export const sortedOptions = (game: GeneratedGame) =>
  `${game.prompt}|${JSON.stringify([...((game.payload.options ?? game.payload.correctSequence ?? []) as string[])].sort())}`;

/**
 * Un tirage jamais vu dans ce palier : la même question deux fois se remarquerait. On refait
 * jusqu'à huit tirages ; au-delà, le dernier est servi (l'espace des questions est épuisé).
 * `keyOf` dit ce qui fait l'identité d'un tirage : par défaut l'énoncé et la bonne réponse ; pour
 * un énoncé qui ne change jamais (« Lequel n'est pas comme les autres ? »), les choix triés.
 */
export function fresh(
  ctx: GameContext,
  kind: string,
  build: () => GeneratedGame,
  keyOf: (game: GeneratedGame) => string = questionOf,
): GeneratedGame {
  let game = build();
  for (let attempt = 0; attempt < 8; attempt++) {
    const key = `${kind}:${keyOf(game)}`;
    if (!ctx.used.has(key)) {
      ctx.used.add(key);
      return game;
    }
    game = build();
  }
  return game;
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Tire un élément pas encore pris dans ce palier ; quand tout a servi, on
 * recommence plutôt que d'échouer.
 */
export function pickFresh<T>(
  ctx: GameContext,
  items: readonly T[],
  keyOf: (item: T) => string,
  universe: readonly T[] = items,
): T {
  const fresh = items.filter((item) => !ctx.used.has(keyOf(item)));
  // Une thématique qui partage ses variantes entre ses paliers (`ctx.window`) tire d'abord, parmi les variantes pas encore prises, dans
  // le tiers de la liste qui revient à son palier. `universe` est la liste entière quand `items` n'en garde qu'une partie à ce niveau
  // (les six couleurs du premier palier, les deux premières directions) : les tiers se prennent sur la liste entière, pour que les paliers
  // ne se chevauchent pas. Quand tout a servi, `fresh` est vide et le tiers ne compte plus : y rester ferait reposer le même exercice.
  const own = ctx.window === undefined ? null : new Set(variantsForLevel(universe, ctx.level, ctx.window));
  const inWindow = own === null ? [] : fresh.filter((item) => own.has(item));
  const chosen = pick(ctx.rng, inWindow.length > 0 ? inWindow : fresh.length > 0 ? fresh : items);
  ctx.used.add(keyOf(chosen));
  return chosen;
}

/**
 * Tire `count` éléments, de préférence ceux qui n'ont pas encore servi dans ce palier, puis les autres : un exercice
 * qui range cinq choses n'en reprend pas trois de celui d'avant tant qu'il en reste d'autres. La clé que `keyOf` donne
 * est partagée par les gabarits d'une thématique, quel que soit le jeu : « l'assiette » ne revient pas dans quatre
 * exercices du même palier.
 */
export function takeFresh<T>(ctx: GameContext, items: readonly T[], count: number, keyOf: (item: T) => string): T[] {
  // Dans une thématique qui partage ses variantes entre ses paliers (`ctx.window`), le tiers du palier passe avant les autres variantes pas
  // encore prises ; celles qui ont déjà servi se tirent au hasard, sans tiers, sinon le même exercice reviendrait.
  const own = ctx.window === undefined ? null : new Set(variantsForLevel(items, ctx.level, ctx.window));
  const unused = items.filter((item) => !ctx.used.has(keyOf(item)));
  const fresh =
    own === null
      ? shuffle(ctx.rng, unused)
      : [...shuffle(ctx.rng, unused.filter((item) => own.has(item))), ...shuffle(ctx.rng, unused.filter((item) => !own.has(item)))];
  const stale = shuffle(ctx.rng, items.filter((item) => ctx.used.has(keyOf(item))));
  const chosen = [...fresh, ...stale].slice(0, count);
  for (const item of chosen) ctx.used.add(keyOf(item));
  return chosen;
}
