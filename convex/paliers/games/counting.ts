/**
 * LES GABARITS DE DÉNOMBREMENT : compter, ajouter, enlever, avec des objets dessinés
 * en émojis.
 *
 * Le modèle de langue écrivait « Combien de mangues as-tu ? 🥭🥭 + 🥭 » avec « 2 »
 * pour réponse. Le nombre d'émojis EST la réponse : un gabarit le compte, il ne
 * l'écrit pas. Au CI, jamais plus de 10 objets sur une rangée (consigne
 * `SELF_CONTAINED_RULE`, `paliers/prompts.ts`).
 *
 * Les émojis sont anciens (Unicode 11 au plus), voir `docs/programme-et-jeux.md`.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { originOf, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";

type Countable = { emoji: string; plural: string; withDe: string };

/** Ce qu'on fait compter : le pluriel, et « de » ou « d' » devant lui. */
const OBJECTS: readonly Countable[] = [
  { emoji: "🥭", plural: "mangues", withDe: "de mangues" },
  { emoji: "🔵", plural: "billes", withDe: "de billes" },
  { emoji: "🐔", plural: "poules", withDe: "de poules" },
  { emoji: "🐟", plural: "poissons", withDe: "de poissons" },
  { emoji: "⭐", plural: "étoiles", withDe: "d'étoiles" },
  { emoji: "⚽", plural: "ballons", withDe: "de ballons" },
  { emoji: "🐚", plural: "cauris", withDe: "de cauris" },
  { emoji: "🌸", plural: "fleurs", withDe: "de fleurs" },
];

/** Le plus grand nombre d'une rangée, selon le palier : de 5 à 10. */
const MAX_BY_LEVEL: Record<GameLevel, number> = { 1: 5, 2: 7, 3: 9, 4: 10 };

const row = (emoji: string, count: number) => emoji.repeat(count);

/** Trois nombres dont `answer`, voisins les uns des autres, jamais négatifs ni nuls. */
function numberChoices(ctx: GameContext, answer: number): { options: string[]; correctIndex: number } {
  const near = shuffle(
    ctx.rng,
    [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && n !== answer),
  ).slice(0, 2);
  const options = shuffle(ctx.rng, [answer, ...near]).map(String);
  return { options, correctIndex: options.indexOf(String(answer)) };
}

function game(
  kind: string,
  ctx: GameContext,
  concept: string,
  prompt: string,
  answer: number,
  hints: [string, string, string],
): GeneratedGame {
  return {
    type: "qcm",
    prompt,
    payload: { ...numberChoices(ctx, answer), game: originOf(kind, ctx), concept },
    answerKey: String(answer),
    hints,
  };
}

/** « Combien de mangues vois-tu ? 🥭🥭🥭 » */
export function makeCountEmojis(ctx: GameContext): GeneratedGame {
  const thing = pickFresh(ctx, OBJECTS, (o) => o.emoji);
  const count = randomInt(ctx.rng, 2, MAX_BY_LEVEL[ctx.level]);
  return game(
    "compter-emojis",
    ctx,
    "dénombrer jusqu'à 10",
    `Combien ${thing.withDe} vois-tu ? ${row(thing.emoji, count)}`,
    count,
    [
      "Touche chaque dessin du doigt, l'un après l'autre.",
      "Dis un nombre à chaque dessin touché : un, deux, trois…",
      "Le dernier nombre que tu dis est la réponse.",
    ],
  );
}

/** « Combien de mangues en tout ? 🥭🥭 + 🥭 » */
export function makeAddEmojis(ctx: GameContext): GeneratedGame {
  const thing = pickFresh(ctx, OBJECTS, (o) => o.emoji);
  const total = randomInt(ctx.rng, 3, MAX_BY_LEVEL[ctx.level]);
  const first = randomInt(ctx.rng, 1, total - 1);
  const second = total - first;
  return game(
    "ajouter-emojis",
    ctx,
    "addition jusqu'à 10",
    `Combien ${thing.withDe} en tout ? ${row(thing.emoji, first)} + ${row(thing.emoji, second)}`,
    total,
    [
      "Regarde les deux groupes.",
      "Compte le premier groupe, puis continue avec le deuxième.",
      "Compte tous les dessins ensemble.",
    ],
  );
}

/** « Combien en reste-t-il ? 🥭🥭🥭🥭 − 🥭 » */
export function makeTakeAwayEmojis(ctx: GameContext): GeneratedGame {
  const thing = pickFresh(ctx, OBJECTS, (o) => o.emoji);
  const start = randomInt(ctx.rng, 3, MAX_BY_LEVEL[ctx.level]);
  const removed = randomInt(ctx.rng, 1, start - 1);
  return game(
    "enlever-emojis",
    ctx,
    "soustraction jusqu'à 10",
    `Combien ${thing.withDe} reste-t-il ? ${row(thing.emoji, start)} − ${row(thing.emoji, removed)}`,
    start - removed,
    [
      "Regarde le grand groupe, puis le petit groupe.",
      "Le petit groupe s'en va : barre autant de dessins dans le grand groupe.",
      "Compte les dessins qui restent.",
    ],
  );
}

/** « Quelle rangée a le plus de mangues ? » : trois rangées de dessins, de nombres différents. */
export function makeCompareRows(ctx: GameContext): GeneratedGame {
  const thing = pickFresh(ctx, OBJECTS, (o) => o.emoji);
  const max = MAX_BY_LEVEL[ctx.level];
  const counts: number[] = [];
  while (counts.length < 3) {
    const n = randomInt(ctx.rng, 1, max);
    if (!counts.includes(n)) counts.push(n);
  }
  const most = ctx.rng() < 0.6;
  const answer = most ? Math.max(...counts) : Math.min(...counts);
  const options = shuffle(
    ctx.rng,
    counts.map((n) => row(thing.emoji, n)),
  );
  const correct = options.indexOf(row(thing.emoji, answer));
  return {
    type: "qcm",
    prompt: `Quelle rangée a le ${most ? "plus" : "moins"} ${thing.withDe} ?`,
    payload: { options, correctIndex: correct, game: originOf("rangee-plus-moins", ctx), concept: "comparer des quantités" },
    answerKey: options[correct],
    hints: [
      "Compte les dessins de chaque rangée avec le doigt.",
      most
        ? "La rangée qui en a le plus est celle où tu comptes le plus loin."
        : "La rangée qui en a le moins est celle où tu t'arrêtes le plus tôt.",
      "Compare les nombres que tu as comptés, deux par deux.",
    ],
  };
}

/** « Relie chaque nombre au bon groupe de mangues. » : trois groupes de dessins, trois nombres différents. */
export function makeNumberGroups(ctx: GameContext): GeneratedGame {
  const thing = pickFresh(ctx, OBJECTS, (o) => o.emoji);
  const max = MAX_BY_LEVEL[ctx.level];
  const counts: number[] = [];
  while (counts.length < 3) {
    const n = randomInt(ctx.rng, 1, max);
    if (!counts.includes(n)) counts.push(n);
  }
  counts.sort((a, b) => a - b);
  const pairs = counts.map((n) => ({ left: String(n), right: row(thing.emoji, n) }));
  return {
    type: "match",
    prompt: `Relie chaque nombre au bon groupe ${thing.withDe}.`,
    payload: { pairs, game: originOf("nombre-groupe", ctx), concept: "associer un nombre et une quantité" },
    answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
    hints: [
      "Compte les dessins de chaque groupe avec le doigt.",
      "Le dernier nombre que tu dis, en comptant, est le nombre du groupe.",
      "Commence par le groupe le plus facile à compter.",
    ],
  };
}
