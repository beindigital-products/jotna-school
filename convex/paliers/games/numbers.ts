/**
 * LES GABARITS DE NOMBRES : le voisin d'un nombre, le plus grand, le nombre écrit
 * en lettres, le double et la moitié, le complément, le calcul écrit, la dizaine
 * et les unités. Pour l'enfant de CI qui apprend à compter jusqu'à 10, puis 20.
 *
 * Le modèle de langue se trompait de somme, de double et de voisin, et le
 * contrôleur ne voit pas qu'une réponse de calcul est fausse. Ici la réponse est
 * CALCULÉE, jamais écrite : une seule option juste par construction, les mauvais
 * choix sont des erreurs d'enfant (le nombre lui-même, un de plus, un de moins,
 * l'autre opération) et ne valent jamais la bonne réponse.
 *
 * Le plus grand nombre vient du champ `vocabulary` de la fiche du programme :
 * « nombres-10 » ou « nombres-20 » (10 sans précision).
 *
 * Aucun indice n'écrit un chiffre : une réponse de nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { originOf, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";

const NUMBER_WORDS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt",
] as const;

/** Le plus grand nombre de la fiche : « nombres-20 » vaut 20, tout le reste 10. */
export function numberCap(vocabulary: string | undefined): 10 | 20 {
  return /^nombres-20$/.test(vocabulary ?? "") ? 20 : 10;
}

/** Le plus grand nombre d'un palier, selon sa position : de 5 à 10, ou de 15 à 20. */
const TOP_BY_LEVEL: Record<10 | 20, Record<GameLevel, number>> = {
  10: { 1: 5, 2: 7, 3: 9, 4: 10 },
  20: { 1: 15, 2: 17, 3: 19, 4: 20 },
};

type Range = { cap: 10 | 20; lo: number; top: number };

function rangeOf(ctx: GameContext): Range {
  const cap = numberCap(ctx.vocabulary);
  // De 11 à 20, les nombres de la fiche commencent à onze.
  return { cap, lo: cap === 20 ? 11 : 1, top: TOP_BY_LEVEL[cap][ctx.level] };
}

/** Trois nombres dont `answer` : les voisins, et les erreurs d'enfant qu'on donne (`anchors`). */
function choices(
  ctx: GameContext,
  answer: number,
  cap: number,
  anchors: number[] = [],
): { options: string[]; correctIndex: number } {
  const candidates = Array.from(new Set([...anchors, answer - 2, answer - 1, answer + 1, answer + 2])).filter(
    (n) => Number.isInteger(n) && n >= 0 && n <= cap && n !== answer,
  );
  const wrong = shuffle(ctx.rng, candidates).slice(0, 2);
  const options = shuffle(ctx.rng, [answer, ...wrong]).map(String);
  return { options, correctIndex: options.indexOf(String(answer)) };
}

function qcm(
  kind: string,
  ctx: GameContext,
  concept: string,
  prompt: string,
  answer: number,
  cap: number,
  hints: [string, string, string],
  anchors: number[] = [],
): GeneratedGame {
  return {
    type: "qcm",
    prompt,
    payload: { ...choices(ctx, answer, cap, anchors), game: originOf(kind, ctx), concept },
    answerKey: String(answer),
    hints,
  };
}

/** Un tirage jamais vu dans ce palier : la même question deux fois se remarquerait. */
function fresh(ctx: GameContext, kind: string, build: () => GeneratedGame): GeneratedGame {
  let game = build();
  for (let attempt = 0; attempt < 8; attempt++) {
    const key = `${kind}:${game.prompt}`;
    if (!ctx.used.has(key)) {
      ctx.used.add(key);
      return game;
    }
    game = build();
  }
  return game;
}

/** « Quel nombre vient juste après 7 ? » */
export function makeNeighbour(ctx: GameContext): GeneratedGame {
  const { cap, lo, top } = rangeOf(ctx);
  return fresh(ctx, "nombre-voisin", () => {
    const after = ctx.rng() < 0.5;
    const n = after ? randomInt(ctx.rng, lo, top - 1) : randomInt(ctx.rng, lo + 1, top);
    const answer = after ? n + 1 : n - 1;
    return qcm(
      "nombre-voisin",
      ctx,
      after ? "le nombre qui suit" : "le nombre qui précède",
      `Quel nombre vient juste ${after ? "après" : "avant"} ${n} ?`,
      answer,
      cap,
      [
        "Dis les nombres en comptant, depuis le début.",
        after ? "Arrête-toi sur le nombre de la question, puis dis le suivant." : "Arrête-toi sur le nombre de la question, puis reviens d'un pas en arrière.",
        after ? "Le nombre d'après est un de plus." : "Le nombre d'avant est un de moins.",
      ],
      [n],
    );
  });
}

/** « Quel est le plus grand de ces nombres ? » avec trois nombres différents en options. */
export function makeBiggest(ctx: GameContext): GeneratedGame {
  const { lo, top } = rangeOf(ctx);
  return fresh(ctx, "nombre-plus-grand", () => {
    const numbers: number[] = [];
    while (numbers.length < 3) {
      const n = randomInt(ctx.rng, lo, top);
      if (!numbers.includes(n)) numbers.push(n);
    }
    const biggest = ctx.rng() < 0.65;
    const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
    const options = shuffle(ctx.rng, numbers).map(String);
    return {
      type: "qcm",
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      payload: {
        options,
        correctIndex: options.indexOf(String(answer)),
        game: originOf("nombre-plus-grand", ctx),
        concept: "comparer des nombres",
      },
      answerKey: String(answer),
      hints: [
        "Compte jusqu'à chaque nombre, l'un après l'autre.",
        biggest ? "Le plus grand nombre est celui où l'on arrive en dernier." : "Le plus petit nombre est celui où l'on arrive en premier.",
        "Compare deux nombres, garde le meilleur, puis compare avec le troisième.",
      ],
    };
  });
}

/** « Quel nombre s'écrit « sept » ? » */
export function makeNumberInWords(ctx: GameContext): GeneratedGame {
  const { cap, lo, top } = rangeOf(ctx);
  return fresh(ctx, "nombre-en-lettres", () => {
    const n = randomInt(ctx.rng, lo, top);
    return qcm(
      "nombre-en-lettres",
      ctx,
      "lire un nombre écrit en lettres",
      `Quel nombre s'écrit « ${NUMBER_WORDS[n]} » ?`,
      n,
      cap,
      [
        "Dis le mot à voix haute, doucement.",
        "Compte sur tes doigts jusqu'à ce que tu dises le même mot.",
        "Le nombre est celui où tu t'arrêtes de compter.",
      ],
    );
  });
}

/** « Quel est le double de 3 ? », « Quelle est la moitié de 8 ? » : jusqu'à 10. */
export function makeDoubleHalf(ctx: GameContext): GeneratedGame {
  const { cap, top } = rangeOf(ctx);
  return fresh(ctx, "double-moitie", () => {
    const double = ctx.rng() < 0.55;
    if (double) {
      const n = randomInt(ctx.rng, 1, Math.max(1, Math.floor(top / 2)));
      return qcm(
        "double-moitie",
        ctx,
        "le double d'un nombre",
        `Quel est le double de ${n} ?`,
        n * 2,
        cap,
        [
          "Le double, c'est deux fois le même nombre.",
          "Dessine deux groupes pareils, avec autant de petits traits dans chacun.",
          "Compte tous les petits traits ensemble.",
        ],
        [n],
      );
    }
    const half = randomInt(ctx.rng, 1, Math.max(1, Math.floor(top / 2)));
    return qcm(
      "double-moitie",
      ctx,
      "la moitié d'un nombre",
      `Quelle est la moitié de ${half * 2} ?`,
      half,
      cap,
      [
        "La moitié, c'est partager en deux parts pareilles.",
        "Dessine le nombre en petits traits, puis fais deux groupes avec autant de traits dans chacun.",
        "Compte les traits d'un seul groupe.",
      ],
      [half * 2],
    );
  });
}

/** « Combien faut-il ajouter à 6 pour faire 10 ? » */
export function makeComplement(ctx: GameContext): GeneratedGame {
  const { cap, top } = rangeOf(ctx);
  return fresh(ctx, "complement", () => {
    const n = randomInt(ctx.rng, 1, top - 1);
    return qcm(
      "complement",
      ctx,
      "le complément d'un nombre",
      `Combien faut-il ajouter à ${n} pour faire ${top} ?`,
      top - n,
      cap,
      [
        "Lève autant de doigts que le premier nombre.",
        "Lève des doigts en plus, un par un, jusqu'au total de la question.",
        "Compte les doigts que tu as levés en plus.",
      ],
      [n],
    );
  });
}

/**
 * « Combien font 4 + 3 ? », « Combien font 8 − 5 ? » : le résultat ne dépasse jamais 10 (fiche « jusqu'à 10 »).
 * Dans la fiche « de 11 à 20 », on COMPOSE et on DÉCOMPOSE la dizaine : « Combien font 10 + 4 ? »,
 * « Combien font 14 − 10 ? ». Aucun calcul ne passe la dizaine, le programme n'en demande pas.
 */
export function makeWrittenCalc(ctx: GameContext): GeneratedGame {
  const { cap, top } = rangeOf(ctx);
  return fresh(ctx, "calcul-ecrit", () => {
    const plus = ctx.rng() < 0.55;
    if (cap === 20) {
      const units = randomInt(ctx.rng, 1, Math.min(top, 19) - 10);
      return qcm(
        "calcul-ecrit",
        ctx,
        plus ? "composer une dizaine et des unités" : "décomposer un nombre",
        plus ? `Combien font 10 + ${units} ?` : `Combien font ${10 + units} − 10 ?`,
        plus ? 10 + units : units,
        cap,
        [
          "Une dizaine, c'est dix.",
          plus ? "Pars de dix et avance autant de pas que le deuxième nombre." : "Enlève la dizaine : ce qui reste, ce sont les unités.",
          plus ? "Compte en avançant, un par un." : "Compte ce qu'il y a après dix.",
        ],
        plus ? [units, 10] : [10 + units, 10],
      );
    }
    if (plus) {
      const total = randomInt(ctx.rng, 2, top);
      const a = randomInt(ctx.rng, 1, total - 1);
      const b = total - a;
      return qcm(
        "calcul-ecrit",
        ctx,
        "addition jusqu'à " + cap,
        `Combien font ${a} + ${b} ?`,
        total,
        cap,
        [
          "Utilise tes doigts, ou dessine des petits traits.",
          "Pars du premier nombre et avance autant de pas que le deuxième nombre.",
          "Compte en avançant, un par un.",
        ],
        [Math.abs(a - b)],
      );
    }
    const start = randomInt(ctx.rng, 2, top);
    const b = randomInt(ctx.rng, 1, start - 1);
    return qcm(
      "calcul-ecrit",
      ctx,
      "soustraction jusqu'à " + cap,
      `Combien font ${start} − ${b} ?`,
      start - b,
      cap,
      [
        "Utilise tes doigts, ou dessine des petits traits et barre-en.",
        "Pars du premier nombre et recule autant de pas que le deuxième nombre.",
        "Compte en reculant, un par un.",
      ],
      [start + b],
    );
  });
}

/** « Dans 14, il y a une dizaine et combien d'unités ? » : de 11 à 19. */
export function makeTensAndUnits(ctx: GameContext): GeneratedGame {
  // Une dizaine et des unités, c'est de onze à dix-neuf, quelle que soit la fiche.
  const cap = 20;
  const top = Math.min(TOP_BY_LEVEL[20][ctx.level], 19);
  return fresh(ctx, "dizaine-unites", () => {
    const n = randomInt(ctx.rng, 11, top);
    return qcm(
      "dizaine-unites",
      ctx,
      "une dizaine et des unités",
      `Dans ${n}, il y a une dizaine et combien d'unités ?`,
      n - 10,
      cap,
      [
        "Une dizaine, c'est dix.",
        "Enlève la dizaine : ce qui reste, ce sont les unités.",
        "Compte ce qu'il y a après dix.",
      ],
      [10],
    );
  });
}

/** « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents. */
export function makeNumberOrder(ctx: GameContext): GeneratedGame {
  const { lo, top } = rangeOf(ctx);
  return fresh(ctx, "nombres-ordre", () => {
    const numbers: number[] = [];
    while (numbers.length < 4) {
      const n = randomInt(ctx.rng, lo, top);
      if (!numbers.includes(n)) numbers.push(n);
    }
    const ascending = ctx.level < 3 || ctx.rng() < 0.6;
    const sequence = numbers.sort((a, b) => (ascending ? a - b : b - a)).map(String);
    return {
      type: "order",
      prompt: ascending
        ? "Mets ces nombres dans l'ordre, du plus petit au plus grand."
        : "Mets ces nombres dans l'ordre, du plus grand au plus petit.",
      payload: {
        correctSequence: sequence,
        game: originOf("nombres-ordre", ctx),
        concept: "ranger des nombres",
      },
      answerKey: sequence.join(", "),
      hints: [
        "Compte jusqu'à chaque nombre, l'un après l'autre.",
        ascending
          ? "Le plus petit nombre est celui où l'on arrive en premier : mets-le au début."
          : "Le plus grand nombre est celui où l'on arrive en dernier : mets-le au début.",
        "Place les nombres un par un, en comparant avec celui d'avant.",
      ],
    };
  });
}
