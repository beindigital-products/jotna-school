/**
 * LES GABARITS DE TRI ET DE MESURE : l'intrus, « est-ce un fruit ? », la couleur d'une chose,
 * ranger des animaux du plus petit au plus grand, qui est le plus lourd, le moment de la journée,
 * le jour qui vient avant ou après. Pour l'enfant de CI qui classe, range et compare.
 *
 * Le modèle écrivait « Quel animal est le plus lourd ? » sans rien montrer, « Mets ces animaux dans
 * l'ordre » sans dire lequel, « Quelle est la couleur de la mangue ? » (verte, jaune, orange ?). Ici
 * la chose est DESSINÉE par un émoji, sa catégorie, sa couleur et son rang sont écrits une fois
 * (`things.ts`), et deux choses comparées sont toujours espacées d'au moins deux crans de l'échelle.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, variantsForLevel, type GameContext, type GeneratedGame } from "./shared";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COLORS,
  DAYS,
  MOMENTS,
  SIZE_SCALE,
  WEIGHT_SCALE,
  categoryOf,
  optionOf,
  type Thing,
} from "./things";
import { pickForLevel } from "./tableaux";

/** « Lequel n'est pas comme les autres ? » : trois choses d'une catégorie, une d'une autre. */
export function makeOddOneOut(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "intrus", () => {
    const [main, other] = shuffle(ctx.rng, CATEGORY_KEYS);
    // Trois dessins de la même famille et un intrus ; quatre et un aux paliers avancés (toutes les familles en ont quatre).
    const group = shuffle(ctx.rng, CATEGORIES[main].things).slice(0, ctx.level >= 3 ? 4 : 3);
    const odd = pick(ctx.rng, CATEGORIES[other].things);
    const options = shuffle(ctx.rng, [...group, odd]).map(optionOf);
    return {
      type: "qcm",
      prompt: "Lequel n'est pas comme les autres ?",
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(odd)),
        game: originOf("intrus", ctx),
        concept: "trouver celui qui n'est pas de la même famille",
      },
      answerKey: optionOf(odd),
      hints: [
        "Dis le nom de chaque dessin.",
        "Cherche trois dessins qui vont ensemble : ils sont de la même famille.",
        "Celui qui reste n'est pas de cette famille.",
      ],
    };
  }, sortedOptions);
}

/** « Est-ce un fruit ? 🐔 » : oui ou non, d'après la catégorie écrite. */
export function makeBelongs(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "appartient", () => {
    const itemKey = pick(ctx.rng, CATEGORY_KEYS);
    const item = pick(ctx.rng, CATEGORIES[itemKey].things);
    const same = ctx.rng() < 0.5;
    const askedKey = same ? itemKey : pick(ctx.rng, CATEGORY_KEYS.filter((k) => k !== itemKey));
    // La vérité se lit dans la liste, pas dans le tirage : une chose absente de la catégorie demandée est « non ».
    const yes = categoryOf(item.emoji) === askedKey;
    const options = shuffle(ctx.rng, ["Oui", "Non"]);
    return {
      type: "qcm",
      prompt: `Est-ce ${CATEGORIES[askedKey].question} ? ${item.emoji}`,
      payload: {
        options,
        correctIndex: options.indexOf(yes ? "Oui" : "Non"),
        game: originOf("appartient", ctx),
        concept: "appartient ou n'appartient pas",
      },
      answerKey: yes ? "Oui" : "Non",
      hints: [
        "Dis le nom du dessin.",
        "Demande-toi : est-ce qu'il fait partie de cette famille ?",
        "Pense à d'autres dessins de la même famille.",
      ],
    };
  });
}

/** « Qu'est-ce qui est jaune ? » : trois choses de trois couleurs différentes. */
export function makeColorOfThing(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "couleur-objet", () => {
    // La couleur demandée est celle du palier (le rouge, puis le jaune ou le vert, puis l'orange ou le violet) : sans cela, « Qu'est-ce qui est rouge ? »
    // revenait aux paliers 1 et 3. Les deux ou trois autres couleurs se tirent parmi les autres.
    const asked = pickForLevel(ctx, Object.keys(COLORS), (color) => `couleur-demandee:${color}`);
    const colors = [
      asked,
      ...shuffle(
        ctx.rng,
        Object.keys(COLORS).filter((color) => color !== asked),
      ).slice(0, ctx.level >= 3 ? 3 : 2),
    ];
    const things: Thing[] = colors.map((color) => pick(ctx.rng, COLORS[color]));
    const target = things[0];
    const options = shuffle(ctx.rng, things).map(optionOf);
    return {
      type: "qcm",
      prompt: `Qu'est-ce qui est ${colors[0]} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(target)),
        game: originOf("couleur-objet", ctx),
        concept: "classer selon la couleur",
      },
      answerKey: optionOf(target),
      hints: [
        "Regarde la couleur de chaque dessin.",
        "Cherche le dessin qui a la couleur demandée.",
        "Les deux autres dessins n'ont pas cette couleur.",
      ],
    };
  });
}

/**
 * Des choses espacées sur une échelle : `count` rangs dont deux voisins sont éloignés d'au moins
 * `gap`. Un chien et un mouton, une poule et un chien, se discutent : on ne les compare pas.
 */
function spacedFrom(ctx: GameContext, scale: readonly Thing[], count: number, gap: number): Thing[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const indexes = shuffle(
      ctx.rng,
      scale.map((_, i) => i),
    )
      .slice(0, count)
      .sort((a, b) => a - b);
    if (indexes.every((value, i) => i === 0 || value - indexes[i - 1] >= gap)) return indexes.map((i) => scale[i]);
  }
  // Repli sûr : un rang sur deux, depuis le début.
  return Array.from({ length: count }, (_, i) => scale[i * gap]);
}

/** Les rangs qui peuvent gagner : le plus lourd d'un trio a, plus bas que lui, `count - 1` bêtes espacées de `gap`. */
function winningRanks(scale: readonly Thing[], count: number, gap: number, max: boolean): number[] {
  const span = gap * (count - 1);
  return Array.from({ length: Math.max(0, scale.length - span) }, (_, i) => (max ? span + i : i));
}

/**
 * Les trios d'une thématique qui partage ses variantes entre ses paliers (`ctx.window`) : la bonne réponse change à chaque palier. Les
 * rangs qui peuvent gagner aux deux premiers paliers (deux bêtes très différentes) et aux suivants (trois bêtes espacées de deux crans)
 * se rangent du côté où seul le premier palier peut les donner vers le côté que tous les paliers partagent, puis se coupent en tiers : le
 * premier palier prend le premier tiers, le deuxième le suivant, le dernier le dernier. Le reste du trio se tire au hasard du bon côté
 * de la réponse. Rend `null` quand aucun trio ne convient (le tirage d'origine prend alors le relais).
 */
function windowedTrio(ctx: GameContext, scale: readonly Thing[], count: number, gap: number, max: boolean): Thing[] | null {
  const now = winningRanks(scale, count, gap, max);
  if (now.length === 0) return null;
  const union = [...new Set([...winningRanks(scale, 2, 3, max), ...winningRanks(scale, 3, 2, max)])].sort((x, y) => (max ? x - y : y - x));
  const own = variantsForLevel(union, ctx.level).filter((rank) => now.includes(rank));
  const answer = pick(ctx.rng, own.length > 0 ? own : now);
  // Les rangs du bon côté de la réponse, espacés de `gap` entre eux et avec elle.
  const side = max ? Array.from({ length: answer - gap + 1 }, (_, i) => i) : Array.from({ length: scale.length - answer - gap }, (_, i) => answer + gap + i);
  const combos: number[][] = [];
  const build = (start: number, chosen: number[]) => {
    if (chosen.length === count - 1) {
      combos.push([...chosen]);
      return;
    }
    for (let i = start; i < side.length; i++) {
      if (chosen.length === 0 || side[i] - chosen[chosen.length - 1] >= gap) build(i + 1, [...chosen, side[i]]);
    }
  };
  build(0, []);
  if (combos.length === 0) return null;
  const others = pick(ctx.rng, combos);
  return [...others, answer].sort((x, y) => x - y).map((i) => scale[i]);
}

/** Les mesures : l'adjectif demandé, l'échelle qui le décide, et le côté de l'échelle qui gagne. */
const DIMENSIONS = [
  { adjective: "lourd", scale: WEIGHT_SCALE, max: true, hint: "Le plus lourd est celui qui s'enfoncerait le plus dans le sable." },
  { adjective: "léger", scale: WEIGHT_SCALE, max: false, hint: "Le plus léger est celui que tu soulèverais le plus facilement." },
  { adjective: "grand", scale: SIZE_SCALE, max: true, hint: "Le plus grand est celui dont la tête monte le plus haut." },
  { adjective: "petit", scale: SIZE_SCALE, max: false, hint: "Le plus petit est celui qui se cacherait le mieux." },
] as const;

/** « Quel animal est le plus lourd ? » : trois animaux dessinés, jamais deux voisins de l'échelle. */
export function makeCompareAnimals(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "comparer-mesure", () => {
    // Le mot demandé est celui du palier (« lourd », puis « léger », puis « grand » ou « petit ») : sans cela, « Quel animal est le plus petit ? » revenait
    // d'un palier à l'autre. Un palier qui pose plusieurs fois la question change de mot à chaque fois (quatre au CI).
    const dimension = pickForLevel(ctx, DIMENSIONS, (candidate) => `dimension:${candidate.adjective}`);
    // Deux animaux très différents (trois crans d'écart) au premier palier, trois espacés de deux crans ensuite.
    const count = ctx.level === 1 ? 2 : 3;
    const gap = ctx.level === 1 ? 3 : 2;
    const animals =
      (ctx.window === undefined ? null : windowedTrio(ctx, dimension.scale, count, gap, dimension.max)) ?? spacedFrom(ctx, dimension.scale, count, gap);
    // `spacedFrom` rend les animaux du plus léger au plus lourd (ou du plus petit au plus grand).
    const answer = dimension.max ? animals[animals.length - 1] : animals[0];
    const options = shuffle(ctx.rng, animals).map(optionOf);
    return {
      type: "qcm",
      prompt: `Quel animal est le plus ${dimension.adjective} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("comparer-mesure", ctx),
        concept: "comparer des tailles et des poids",
      },
      answerKey: optionOf(answer),
      hints: [
        "Dis le nom de chaque animal.",
        dimension.hint,
        "Compare deux animaux, puis compare le gagnant avec le troisième.",
      ],
    };
  });
}

/** « Mets ces animaux dans l'ordre, du plus petit au plus grand. » : trois animaux, quatre pour le poids aux paliers avancés. */
export function makeOrderAnimals(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "animaux-ordre", () => {
    const bySize = ctx.rng() < 0.5;
    const scale = bySize ? SIZE_SCALE : WEIGHT_SCALE;
    // Quatre animaux espacés de deux crans demandent sept rangs : seule l'échelle du poids les a.
    const count = !bySize && ctx.level >= 3 ? 4 : 3;
    const sequence = spacedFrom(ctx, scale, count, 2).map(optionOf);
    return {
      type: "order",
      prompt: bySize
        ? "Mets ces animaux dans l'ordre, du plus petit au plus grand."
        : "Mets ces animaux dans l'ordre, du plus léger au plus lourd.",
      payload: {
        correctSequence: sequence,
        game: originOf("animaux-ordre", ctx),
        concept: "ranger du plus petit au plus grand",
      },
      answerKey: sequence.join(", "),
      hints: [
        "Dis le nom de chaque animal.",
        bySize ? "Commence par le plus petit, celui qui tiendrait dans ta main." : "Commence par le plus léger, celui que tu soulèverais le plus facilement.",
        "Compare deux animaux, puis place le suivant.",
      ],
    };
  }, sortedOptions);
}

const isEveningOrNight = (name: string) => name === "soir" || name === "nuit";

/** « Le soleil se lève. Quel moment de la journée est-ce ? » : un indice qui ne va qu'à un moment. */
export function makeMoment(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "moment-journee", () => {
    // Une thématique qui partage ses variantes entre ses paliers (`ctx.window`) prend ses moments dans le tiers du palier.
    const moment = ctx.window === undefined ? pick(ctx.rng, MOMENTS) : pickFresh(ctx, MOMENTS, (candidate) => `moment-journee-moment:${candidate.name}`);
    const clue = pick(ctx.rng, moment.clues);
    // Le soir et la nuit ne se proposent jamais ensemble : une fois le soleil couché, il fait noir et c'est encore le soir.
    const pool = MOMENTS.filter((m) => m.name !== moment.name && !(isEveningOrNight(m.name) && isEveningOrNight(moment.name)));
    let wrong = shuffle(ctx.rng, pool).slice(0, 2);
    if (wrong.length === 2 && isEveningOrNight(wrong[0].name) && isEveningOrNight(wrong[1].name)) {
      wrong = [wrong[0], pool.find((m) => !isEveningOrNight(m.name)) as (typeof MOMENTS)[number]];
    }
    const options = shuffle(ctx.rng, [moment, ...wrong]).map((m) => m.label);
    return {
      type: "qcm",
      prompt: `${clue} Quel moment de la journée est-ce ?`,
      payload: {
        options,
        correctIndex: options.indexOf(moment.label),
        game: originOf("moment-journee", ctx),
        concept: "les moments de la journée",
      },
      answerKey: moment.label,
      hints: [
        "Pense à la place du soleil dans le ciel.",
        "Pense à ce que tu fais à ce moment-là.",
        "Les autres moments ne vont pas avec ce que dit la phrase.",
      ],
    };
  });
}

/** « Quel jour vient juste après mardi ? » : le lundi vient après le dimanche, le dimanche avant le lundi. */
export function makeNeighbourDay(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "jour-voisin", () => {
    // Une thématique qui partage ses variantes entre ses paliers (`ctx.window`) prend ses jours dans le tiers du palier.
    const index =
      ctx.window === undefined
        ? randomInt(ctx.rng, 0, DAYS.length - 1)
        : pickFresh(
            ctx,
            DAYS.map((_, i) => i),
            (candidate) => `jour-voisin-jour:${candidate}`,
          );
    // Le jour d'après au premier palier ; le jour d'avant ensuite.
    const after = ctx.level === 1 || ctx.rng() < 0.5;
    const answerIndex = (index + (after ? 1 : DAYS.length - 1)) % DAYS.length;
    // Le jour de la question n'est jamais un mauvais choix : l'enfant le choisirait en reconnaissant le mot.
    const wrong = shuffle(
      ctx.rng,
      DAYS.map((_, i) => i).filter((i) => i !== answerIndex && i !== index),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answerIndex, ...wrong]).map((i) => DAYS[i]);
    return {
      type: "qcm",
      prompt: `Quel jour vient juste ${after ? "après" : "avant"} ${DAYS[index]} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(DAYS[answerIndex]),
        game: originOf("jour-voisin", ctx),
        concept: "les jours de la semaine",
      },
      answerKey: DAYS[answerIndex],
      hints: [
        "Récite les jours de la semaine dans l'ordre, du premier au dernier.",
        after ? "Arrête-toi sur le jour de la question, puis dis le suivant." : "Arrête-toi sur le jour de la question, puis reviens d'un pas en arrière.",
        "Une semaine tourne en rond : après le dernier jour, on recommence.",
      ],
    };
  });
}
