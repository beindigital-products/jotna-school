/**
 * LES GABARITS DE LA GÉOGRAPHIE DU CE1 : les points cardinaux, le climat et les saisons, le relief et les cours d'eau, le plan
 * de la classe et de l'école (`ge-ce1-orientation`, `ge-ce1-saisons`, `ge-ce1-eau-relief`, `ge-ce1-plan`).
 *
 * Sur l'échantillon de CE1, le modèle écrivait des exercices faux dans un cas sur quatre en géographie : « Le centre se trouve
 * entre le nord et le sud » (la clé disait « Est »), « Quel fleuve se jette dans l'océan Atlantique ? » (le Sénégal, le Niger et le
 * Congo y arrivent tous), « Associe chaque région à son fleuve : Dakar, fleuve Sénégal », « Place les étiquettes sur le plan de
 * l'école » sans aucun plan. Ici la réponse se calcule (un quart de tour, un décalage de mois, un lieu au nord d'un autre) ou se lit
 * dans ce que l'énoncé montre (un plan dessiné par des carrés de couleur, avec sa légende écrite dans l'énoncé).
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Orientation : le nord, le sud, l'est et l'ouest ; le soleil se lève à l'est et se couche à l'ouest ; la boussole. Le tour sur
 *   soi-même, les lieux d'un village l'un par rapport à l'autre et la boussole se calculent.
 * - Saisons : la saison sèche va « à peu près » de novembre à juin, la saison des pluies (l'hivernage) « à peu près » de juillet à
 *   octobre. Les mois de BORD (novembre, juin, juillet, octobre) ne sont jamais posés : seuls décembre, janvier, février, mars, avril
 *   et mai sont de la saison sèche, août et septembre de la saison des pluies. L'harmattan est un vent chaud et sec ; il pleut plus
 *   au sud qu'au nord.
 * - Relief et eau : un pays surtout plat, des collines au sud-est (région de Kédougou) ; les fleuves Sénégal, Gambie et Casamance ;
 *   les lacs de Guiers et Rose ; les mares et les puits. Le Saloum n'est pas posé (fleuve ou bras de mer, la fiche ne tranche pas).
 *   HORS FICHE, À FAIRE RELIRE : les villes d'un fleuve (Saint-Louis, Podor et Bakel sur le Sénégal ; Ziguinchor, Kolda et Sédhiou sur
 *   la Casamance) et les définitions de la mare et du puits.
 * - Plan : représenter la classe, l'école ou la maison sur un plan, avec une légende simple ; retrouver un lieu sur un plan. Le plan
 *   est un quadrillage de carrés de couleur ; la légende (« le carré rouge est la porte ») est écrite dans l'énoncé.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom SEUL, avec sa majuscule, sans article (« Porte », « Lac Rose »).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. La voix de Pio ne dit pas les émojis : un
 *   plan est toujours accompagné de sa légende écrite.
 * - Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { MONTHS } from "./calendrier";
import { cap, windowFor } from "./ce1Outils";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";

// ===========================================================================
// LES POINTS CARDINAUX (ge-ce1-orientation)
// ===========================================================================

/** Les points cardinaux dans le sens des aiguilles d'une montre, à partir du nord. */
const DIRECTIONS = ["nord", "est", "sud", "ouest"] as const;
type Direction = (typeof DIRECTIONS)[number];

/** Le point cardinal avec son article (« le nord », « l'est »), et avec « de » (« du nord », « de l'est »). */
const THE: Record<Direction, string> = { nord: "le nord", est: "l'est", sud: "le sud", ouest: "l'ouest" };
const OF: Record<Direction, string> = { nord: "du nord", est: "de l'est", sud: "du sud", ouest: "de l'ouest" };
/** L'étiquette d'un point cardinal : un nom seul, avec sa majuscule. */
const tileOf = (direction: Direction) => cap(direction);
/** « Au nord », « À l'est » : la position d'un lieu, comme une réponse la dit. */
const AT: Record<Direction, string> = { nord: "Au nord", est: "À l'est", sud: "Au sud", ouest: "À l'ouest" };

/** Le point cardinal que l'on a après `quarters` quarts de tour vers la droite (à gauche si négatif). */
function turned(from: Direction, quarters: number): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(from) + quarters + 40) % 4];
}

/** Les deux points cardinaux autres que celui-ci et son opposé. */
const perpendicular = (direction: Direction): Direction[] => [turned(direction, 1), turned(direction, 3)];

/** Les questions sur l'opposé : quatre points cardinaux, deux façons de le dire (« en face », « le contraire »). */
const OPPOSITES = ["est en face", "est le contraire"].flatMap((lead) => DIRECTIONS.map((direction) => ({ direction, lead })));

/** « Quel point cardinal est en face du nord ? » : l'opposé, parmi trois. */
export function makeCe1Opposite(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-oppose", "l'opposé d'un point cardinal", () => {
    const { direction, lead } = pickFresh(ctx, windowFor(OPPOSITES, ctx.level, 1), (candidate) => `ce1-oppose:${candidate.direction}:${candidate.lead}`);
    const opposite = turned(direction, 2);
    return {
      prompt: `Quel point cardinal ${lead} ${OF[direction]} ?`,
      answer: tileOf(opposite),
      wrong: perpendicular(direction).map(tileOf),
      hints: [
        "Pense à la boussole, où les quatre directions forment une croix.",
        "Deux directions de la croix se tournent le dos.",
        "La direction cherchée est de l'autre côté de la croix.",
      ],
    };
  });
}

/** Les questions sur le soleil : il se lève à l'est et se couche à l'ouest. */
const SUN: readonly { question: string; answer: Direction }[] = [
  { question: "De quel côté le soleil se lève-t-il ?", answer: "est" },
  { question: "De quel côté le soleil se couche-t-il ?", answer: "ouest" },
  { question: "Le matin, de quel côté vient la première lumière du jour ?", answer: "est" },
  { question: "Le soir, de quel côté le soleil disparaît-il ?", answer: "ouest" },
];

/** « De quel côté le soleil se lève-t-il ? » : l'est ou l'ouest, parmi trois points cardinaux. */
export function makeCe1Sun(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-soleil", "le chemin du soleil", () => {
    const entry = pickFresh(ctx, windowFor(SUN, ctx.level, 1), (candidate) => `ce1-soleil:${candidate.question}`);
    return {
      prompt: entry.question,
      answer: tileOf(entry.answer),
      wrong: shuffle(
        ctx.rng,
        DIRECTIONS.filter((direction) => direction !== entry.answer),
      ).map(tileOf),
      hints: [
        "Pense à ce que tu vois dans le ciel le matin et le soir.",
        "Le soleil fait un chemin dans le ciel pendant la journée.",
        "Il apparaît d'un côté et disparaît du côté opposé.",
      ],
    };
  });
}

/** Les trois côtés que l'on peut demander : à droite, à gauche, derrière soi. */
const SIDES = [
  { words: "à ta droite", quarters: 1 },
  { words: "à ta gauche", quarters: 3 },
  { words: "derrière toi", quarters: 2 },
] as const;

/** Toutes les questions « je regarde vers… », rangées de la plus facile à la plus difficile. */
const FACINGS: readonly { facing: Direction; side: (typeof SIDES)[number] }[] = [
  ...(["nord", "sud"] as const).flatMap((facing) => [SIDES[0], SIDES[1]].map((side) => ({ facing, side }))),
  ...(["est", "ouest"] as const).flatMap((facing) => [SIDES[0], SIDES[1]].map((side) => ({ facing, side }))),
  ...DIRECTIONS.map((facing) => ({ facing, side: SIDES[2] })),
];

/** « Tu regardes vers le nord. Quel point cardinal est à ta droite ? » : un quart de tour calculé, parmi trois points cardinaux. */
export function makeCe1Facing(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-face", "se repérer en regardant un point cardinal", () => {
    const { facing, side } = pickFresh(ctx, windowFor(FACINGS, ctx.level, 1), (candidate) => `ce1-face:${candidate.facing}:${candidate.side.words}`);
    const answer = turned(facing, side.quarters);
    return {
      prompt: `Tu regardes vers ${THE[facing]}. Quel point cardinal est ${side.words} ?`,
      answer: tileOf(answer),
      wrong: shuffle(
        ctx.rng,
        DIRECTIONS.filter((direction) => direction !== answer),
      )
        .slice(0, 2)
        .map(tileOf),
      hints: [
        "Imagine-toi debout, le visage tourné vers la direction donnée.",
        "Tes deux bras montrent les deux directions qui sont à côté de celle que tu regardes.",
        "La direction dans ton dos est celle qui est à l'opposé de celle que tu regardes.",
      ],
    };
  });
}

const TURNS = [
  { words: "Tu tournes à droite.", quarters: 1 },
  { words: "Tu tournes à gauche.", quarters: 3 },
  { words: "Tu fais demi-tour.", quarters: 2 },
] as const;

/** « Tu regardes vers l'est. Tu tournes à droite. Vers quel point cardinal regardes-tu maintenant ? » : un ou plusieurs tours. */
export function makeCe1Turn(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-tourne", "tourner sur soi-même et dire où l'on regarde", () => {
    const start = pick(ctx.rng, DIRECTIONS);
    const count = ctx.level === 1 || ctx.level === 2 ? 1 : ctx.level === 3 ? 2 : randomInt(ctx.rng, 2, 3);
    const turns = Array.from({ length: count }, () => (ctx.level === 1 ? pick(ctx.rng, [TURNS[0], TURNS[1]]) : pick(ctx.rng, TURNS)));
    const answer = turns.reduce((direction, turn) => turned(direction, turn.quarters), start);
    return {
      prompt: `Tu regardes vers ${THE[start]}. ${turns.map((turn) => turn.words).join(" ")} Vers quel point cardinal regardes-tu maintenant ?`,
      answer: tileOf(answer),
      wrong: shuffle(
        ctx.rng,
        DIRECTIONS.filter((direction) => direction !== answer),
      )
        .slice(0, 2)
        .map(tileOf),
      hints: [
        "Imagine-toi debout, le visage tourné vers la direction de départ.",
        "À chaque tour, tu avances d'un quart de tour dans le bon sens.",
        "Fais les tours un par un, en disant la direction après chacun.",
      ],
    };
  });
}

/** Les ordres de la boussole : on part d'un point cardinal et on tourne toujours du même côté. */
const COMPASS_ORDERS = DIRECTIONS.flatMap((start) => [1, 3].map((step) => ({ start, step })));

/** « Tu regardes vers l'est puis tu tournes à droite, par quarts de tour. Mets les points cardinaux en suivant tes regards, du premier au dernier. » */
export function makeCe1CompassOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-boussole-ordre", "faire le tour de la boussole", () => {
    const { start, step } = pickFresh(ctx, windowFor(COMPASS_ORDERS, ctx.level, 1), (candidate) => `ce1-boussole-ordre:${candidate.start}:${candidate.step}`);
    return {
      prompt: `Tu regardes vers ${THE[start]} puis tu tournes ${step === 1 ? "à droite" : "à gauche"}, par quarts de tour. Mets les points cardinaux en suivant tes regards, du premier au dernier.`,
      sequence: [0, 1, 2, 3].map((i) => tileOf(turned(start, i * step))),
      hints: [
        "Imagine-toi debout, le visage tourné vers la direction de départ.",
        "Chaque quart de tour te fait regarder la direction voisine.",
        "Tu reviens à ta direction de départ après quatre quarts de tour.",
      ],
    };
  });
}

/** Les phrases à trou sur l'orientation, avec la bonne réponse et deux mauvais choix. */
const DIRECTION_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hints: readonly [string, string, string] }[] = [
  {
    text: "Le soleil se lève à l'___.",
    answer: "est",
    wrong: ["ouest", "ouest"],
    hints: ["Pense au début de la journée.", "Le soleil apparaît le matin.", "C'est la direction où commence le jour."],
  },
  {
    text: "Le soleil se couche à l'___.",
    answer: "ouest",
    wrong: ["est", "est"],
    hints: ["Pense à la fin de la journée.", "Le soleil disparaît le soir.", "C'est la direction où finit le jour."],
  },
  {
    text: "Le contraire du nord est le ___.",
    answer: "sud",
    wrong: ["est", "ouest"],
    hints: ["Pense à la croix de la boussole.", "Deux directions se tournent le dos.", "Cette direction est en bas de la croix."],
  },
  {
    text: "Le contraire du sud est le ___.",
    answer: "nord",
    wrong: ["est", "ouest"],
    hints: ["Pense à la croix de la boussole.", "Deux directions se tournent le dos.", "Cette direction est en haut de la croix."],
  },
  {
    text: "La boussole montre toujours le ___.",
    answer: "nord",
    wrong: ["sud", "est"],
    hints: ["Regarde l'aiguille d'une boussole.", "Son aiguille s'arrête toujours dans la même direction.", "Cette direction est celle que l'on met en haut d'une carte."],
  },
  {
    text: "Le contraire de l'est est l'___.",
    answer: "ouest",
    wrong: ["est", "est"],
    hints: ["Pense à la croix de la boussole.", "Deux directions se tournent le dos.", "Le soleil se couche de ce côté."],
  },
];

/** « Le soleil se lève à l'___. » : un point cardinal, parmi deux ou trois. */
export function makeCe1DirectionGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-point-trou", "compléter une phrase sur les points cardinaux", () => {
    const entry = pickFresh(ctx, windowFor(DIRECTION_GAPS, ctx.level, 1), (candidate) => `ce1-point-trou:${candidate.text}`);
    return { prompt: "Complète la phrase.", text: entry.text, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** Les lieux d'un village, avec leur article, leur « de » et leur étiquette : aucun n'est élidé (un énoncé n'a qu'une apostrophe). */
const VILLAGE_PLACES = [
  { the: "le puits", of: "du puits", to: "au puits", tile: "Puits" },
  { the: "la mosquée", of: "de la mosquée", to: "à la mosquée", tile: "Mosquée" },
  { the: "le marché", of: "du marché", to: "au marché", tile: "Marché" },
  { the: "la boutique", of: "de la boutique", to: "à la boutique", tile: "Boutique" },
  { the: "le dispensaire", of: "du dispensaire", to: "au dispensaire", tile: "Dispensaire" },
  { the: "le manguier", of: "du manguier", to: "au manguier", tile: "Manguier" },
] as const;

/**
 * Un lieu par rapport à un autre. Aux deux premiers paliers, deux lieux (« Où est la mosquée par rapport au puits ? ») ; ensuite,
 * trois lieux alignés du nord au sud (« Quel lieu est le plus au nord ? »).
 */
export function makeCe1PlacesDirection(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-lieux-direction", "dire où est un lieu par rapport à un autre", () => {
    if (ctx.level <= 2) {
      const [first, second] = shuffle(ctx.rng, VILLAGE_PLACES);
      const direction = pick(ctx.rng, DIRECTIONS);
      const answer = turned(direction, 2);
      const where = direction === "nord" || direction === "sud" ? `au ${direction}` : `à ${THE[direction]}`;
      return {
        prompt: `${cap(first.the)} est ${where} ${second.of}. Où est ${second.the} par rapport ${first.to.replace(/^à la /, "à la ")} ?`,
        answer: AT[answer],
        wrong: shuffle(
          ctx.rng,
          DIRECTIONS.filter((candidate) => candidate !== answer),
        )
          .slice(0, 2)
          .map((candidate) => AT[candidate]),
        hints: [
          "Fais un petit dessin avec les deux lieux.",
          "Si le premier lieu est d'un côté du second, le second est du côté contraire du premier.",
          "Retourne la phrase, les deux lieux se font face.",
        ],
      };
    }
    const [first, second, third] = shuffle(ctx.rng, VILLAGE_PLACES);
    const north = ctx.rng() < 0.5;
    // Chaîne : le deuxième est au nord (ou au sud) du premier, le troisième au nord (ou au sud) du deuxième.
    const word = north ? "au nord" : "au sud";
    return {
      prompt: `${cap(second.the)} est ${word} ${first.of}. ${cap(third.the)} est ${word} ${second.of}. Quel lieu est le plus ${word} ?`,
      answer: third.tile,
      wrong: [first.tile, second.tile],
      hints: [
        "Dessine une ligne avec les trois lieux.",
        "Place d'abord les deux lieux de la première phrase, puis ajoute le troisième.",
        "Le lieu cherché est tout au bout de la ligne.",
      ],
    };
  });
}

/** Les indices qui désignent un point cardinal : le soleil, la boussole, le contraire d'un autre. */
const DIRECTION_CLUES: Record<Direction, readonly string[]> = {
  est: ["Le soleil se lève", "Le contraire de l'ouest"],
  ouest: ["Le soleil se couche", "Le contraire de l'est"],
  nord: ["L'aiguille de la boussole montre", "Le contraire du sud"],
  sud: ["Le contraire du nord", "Ce qui est derrière toi quand tu regardes le nord"],
};

/** « Relie chaque indice à son point cardinal. » : trois points cardinaux, un indice pour chacun. */
export function makeCe1DirectionLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-point-relier", "relier un indice et un point cardinal", () => ({
    prompt: "Relie chaque indice à son point cardinal.",
    pairs: shuffle(ctx.rng, DIRECTIONS)
      .slice(0, 3)
      .map((direction) => ({ left: pick(ctx.rng, DIRECTION_CLUES[direction]), right: tileOf(direction) })),
    hints: [
      "Lis les trois indices, puis les trois directions.",
      "Pense au chemin de la lumière au-dessus de nos têtes et à la croix des directions.",
      "Commence par l'indice dont tu es certain.",
    ],
  }));
}

/** Ce qui se passe du côté de l'est et du côté de l'ouest. */
const SUN_SIDES = {
  est: ["Le soleil se lève", "Le matin", "Le lever du jour", "Le soleil du matin"],
  ouest: ["Le soleil se couche", "Le soir", "La tombée de la nuit", "Le soleil du soir"],
} as const;

/** « Glisse chaque phrase dans la bonne case, selon le côté du soleil. » : ce qui est de l'est, ce qui est de l'ouest. */
export function makeCe1DirectionSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-point-glisser", "ranger ce qui est de l'est et de l'ouest", () => {
    const each = ctx.level <= 2 ? 2 : 3;
    return {
      prompt: "Glisse chaque phrase dans la bonne case, selon le côté du soleil.",
      zones: ["Est", "Ouest"],
      items: [
        ...shuffle(ctx.rng, SUN_SIDES.est)
          .slice(0, each)
          .map((text) => ({ text, zone: "Est" })),
        ...shuffle(ctx.rng, SUN_SIDES.ouest)
          .slice(0, each)
          .map((text) => ({ text, zone: "Ouest" })),
      ],
      hints: [
        "Pense au chemin que fait la lumière dans le ciel.",
        "Elle apparaît d'un côté et disparaît de l'autre.",
        "Ce qui arrive au commencement est d'un côté, ce qui arrive à la fin est du côté opposé.",
      ],
    };
  });
}

// ===========================================================================
// LE CLIMAT ET LES SAISONS (ge-ce1-saisons)
// ===========================================================================

/** Les mois posés : seuls les mois du milieu de chaque saison, jamais ceux de bord (la fiche dit « à peu près »). */
export const DRY_MONTHS = ["décembre", "janvier", "février", "mars", "avril", "mai"] as const;
export const RAIN_MONTHS = ["août", "septembre"] as const;

const DRY = "Saison sèche";
const RAIN = "Saison des pluies";

/** Deux indices par saison, sans jamais écrire son nom : où elle commence et finit, puis comment on la compte. */
const SEASON_HINTS = {
  dry: ["Pense aux mois où l'on voit peu d'eau tomber du ciel.", "Cette période va à peu près de novembre à juin."],
  rain: ["Pense aux mois où les averses reviennent souvent.", "Cette période va à peu près de juillet à octobre."],
} as const;

type MonthQuestion = { prompt: string; answer: string; wrong: readonly string[]; season: "dry" | "rain" };

/** Les questions « quel mois » et « quelle saison » : quatre groupes mêlés, pour que chaque niveau voie les deux saisons. */
const MONTH_QUESTIONS: readonly MonthQuestion[] = (() => {
  const dryWhich = DRY_MONTHS.map((month): MonthQuestion => ({ prompt: "Quel mois est de la saison sèche ?", answer: month, wrong: [...RAIN_MONTHS], season: "dry" }));
  const rainWhich = RAIN_MONTHS.map(
    (month, i): MonthQuestion => ({
      prompt: "Quel mois est de la saison des pluies ?",
      answer: month,
      wrong: [DRY_MONTHS[i], DRY_MONTHS[i + 3]],
      season: "rain",
    }),
  );
  const dryWhen = DRY_MONTHS.map((month): MonthQuestion => ({ prompt: `En quelle saison est le mois ${/^[aeiouéh]/u.test(month) ? "d'" : "de "}${month} ?`, answer: DRY, wrong: [RAIN], season: "dry" }));
  const rainWhen = RAIN_MONTHS.map(
    (month): MonthQuestion => ({ prompt: `En quelle saison est le mois ${month === "août" ? "d'août" : "de septembre"} ?`, answer: RAIN, wrong: [DRY], season: "rain" }),
  );
  const groups = [dryWhich, rainWhich, dryWhen, rainWhen];
  const out: MonthQuestion[] = [];
  for (let i = 0; groups.some((group) => i < group.length); i++) for (const group of groups) if (i < group.length) out.push(group[i]);
  return out;
})();

/** « Quel mois est de la saison sèche ? » ou « En quelle saison est le mois de mars ? » : la saison d'un mois du milieu. */
export function makeCe1MonthSeason(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mois-saison", "dire la saison d'un mois", () => {
    const entry = pickFresh(ctx, windowFor(MONTH_QUESTIONS, ctx.level, 3), (candidate) => `ce1-mois-saison:${candidate.prompt}:${candidate.answer}`);
    return { prompt: entry.prompt, answer: entry.answer, wrong: entry.wrong.slice(0, 2), hints: ["Lis la question en entier.", ...SEASON_HINTS[entry.season]] };
  });
}

/** « Glisse chaque mois dans la bonne saison. » : deux ou trois mois secs, les deux mois de pluie. */
export function makeCe1SeasonSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-saison-glisser", "ranger les mois selon la saison", () => {
    const dry = shuffle(ctx.rng, DRY_MONTHS).slice(0, ctx.level <= 2 ? 2 : 3);
    return {
      prompt: "Glisse chaque mois dans la bonne saison.",
      zones: [DRY, RAIN],
      items: [...dry.map((month) => ({ text: cap(month), zone: DRY })), ...RAIN_MONTHS.map((month) => ({ text: cap(month), zone: RAIN }))],
      hints: [
        "Pense aux mois où l'on voit peu d'eau tomber du ciel, et à ceux où les averses reviennent.",
        "Les mois secs vont à peu près de novembre à juin.",
        "Les mois d'averses vont à peu près de juillet à octobre.",
      ],
    };
  });
}

/** Les faits de la fiche sur le climat : la saison, son autre nom, l'harmattan, la durée, le nord et le sud. */
const SEASON_FACTS: readonly { question: string; answer: string; wrong: readonly string[]; hints: readonly [string, string, string] }[] = [
  {
    question: "Pendant quelle période de l'année pleut-il beaucoup ?",
    answer: RAIN,
    wrong: [DRY],
    hints: ["Lis la question en entier.", "Pense à l'eau qui tombe du ciel.", "C'est le moment de l'année où l'on sort avec un parapluie."],
  },
  {
    question: "Quel autre nom donne-t-on à la saison des pluies ?",
    answer: "Hivernage",
    wrong: ["Harmattan", DRY],
    hints: ["Lis la question en entier.", "Ce mot commence par la lettre h.", "Il se termine par la syllabe « nage »."],
  },
  {
    question: "Quel vent chaud et sec souffle pendant la saison sèche ?",
    answer: "Harmattan",
    wrong: ["Hivernage", "Pluie"],
    hints: ["Lis la question en entier.", "Il vient du désert.", "Son nom commence par la lettre h."],
  },
  {
    question: "Quelle saison dure le plus longtemps au Sénégal ?",
    answer: DRY,
    wrong: [RAIN],
    hints: ["Lis la question en entier.", "Compte les mois de chaque période.", "L'une dure huit mois et l'autre quatre mois."],
  },
  {
    question: "Où pleut-il le plus au Sénégal ?",
    answer: "Au sud",
    wrong: ["Au nord"],
    hints: ["Lis la question en entier.", "Pense à la région du pays où le ciel est le plus souvent chargé.", "Elle est à l'opposé du désert."],
  },
  {
    question: "Dans quelle saison l'harmattan souffle-t-il ?",
    answer: DRY,
    wrong: [RAIN],
    hints: ["Lis la question en entier.", "Ce vent est chaud et sec.", "Il souffle quand il pleut très peu."],
  },
  {
    question: "Quelle saison porte aussi le nom d'hivernage ?",
    answer: RAIN,
    wrong: [DRY],
    hints: ["Lis la question en entier.", "Ce nom parle de l'eau qui tombe.", "Les champs se remplissent d'eau pendant cette période."],
  },
  {
    question: "Pendant la saison sèche, tombe-t-il beaucoup ou peu de pluie ?",
    answer: "Peu de pluie",
    wrong: ["Beaucoup de pluie"],
    hints: ["Lis la question en entier.", "Pense aux mois où le sol reste sec.", "Les nuages sont rares pendant cette période."],
  },
];

/** « Quel vent chaud et sec souffle pendant la saison sèche ? » : un fait de la fiche sur le climat. */
export function makeCe1SeasonFact(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-saison-fait", "le climat et les saisons du Sénégal", () => {
    const entry = pickFresh(ctx, windowFor(SEASON_FACTS, ctx.level, 2), (candidate) => `ce1-saison-fait:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** Trois façons de dire ce que sont la saison sèche, l'hivernage et l'harmattan. */
const SEASON_WORDINGS: readonly (readonly [string, string, string])[] = [
  ["Il ne pleut presque pas", "Il pleut souvent", "Un vent chaud et sec"],
  ["Les mois sans averses", "Les mois d'averses", "Un vent venu du désert"],
  ["Les champs attendent la pluie", "Les champs reçoivent beaucoup d'eau", "Un vent qui sèche l'air"],
  ["Les mois où le sol se fend", "Les mois où l'eau remplit les mares", "Un vent chargé de poussière"],
];

/** « Relie chaque mot à ce qu'il veut dire. » : la saison sèche, l'hivernage et l'harmattan. */
export function makeCe1SeasonLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-saison-relier", "relier une saison ou un vent et ce qu'il veut dire", () => {
    const wording = SEASON_WORDINGS[ctx.level - 1];
    return {
      prompt: "Relie chaque mot à ce qu'il veut dire.",
      pairs: shuffle(ctx.rng, [
        { left: DRY, right: wording[0] },
        { left: "Hivernage", right: wording[1] },
        { left: "Harmattan", right: wording[2] },
      ]),
      hints: ["Lis les trois mots, puis les trois phrases.", "Un souffle d'air n'est pas une période de l'année.", "Commence par le mot dont tu es certain."],
    };
  });
}

/** Les mois à ranger : tous les groupes de trois mois, puis tous les groupes de quatre, de janvier à mai, chacun dans l'ordre du calendrier. */
const DRY_ORDERS: readonly (readonly string[])[] = (() => {
  const inYear: string[] = [...MONTHS.slice(0, 5)];
  const groups = (size: number): string[][] =>
    size === 0 ? [[]] : inYear.flatMap((month, i) => groups(size - 1).filter((rest) => rest.every((other) => inYear.indexOf(other) > i)).map((rest) => [month, ...rest]));
  return [...groups(3), ...groups(4)];
})();

/** « Mets ces mois de la saison sèche dans l'ordre du calendrier. » : trois ou quatre mois de janvier à mai. */
export function makeCe1SeasonOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-saison-ordre", "ranger les mois de la saison sèche", () => {
    const chosen = pickFresh(ctx, windowFor(DRY_ORDERS, ctx.level, 1), (candidate) => `ce1-saison-ordre:${candidate.join("")}`);
    return {
      prompt: "Mets ces mois de la saison sèche dans l'ordre du calendrier.",
      sequence: chosen.map(cap),
      hints: ["Récite les mois de l'année dans l'ordre.", "Cherche celui que tu dis en premier, et place-le au début.", "Place ensuite celui qui vient après, puis le suivant."],
    };
  });
}

/** Les phrases à trou sur les saisons, avec la bonne réponse et deux mauvais choix. */
const SEASON_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hints: readonly [string, string, string] }[] = [
  {
    text: "L'harmattan est un vent ___ et sec.",
    answer: "chaud",
    wrong: ["froid", "mouillé"],
    hints: ["Lis la phrase en entier.", "Il vient du désert.", "Il n'apporte pas de fraîcheur."],
  },
  {
    text: "L'harmattan est un vent chaud et ___.",
    answer: "sec",
    wrong: ["humide", "froid"],
    hints: ["Lis la phrase en entier.", "Il souffle quand il ne pleut presque pas.", "Il assèche l'air et la peau."],
  },
  {
    text: "Pendant la saison sèche, il ne ___ presque pas.",
    answer: "pleut",
    wrong: ["neige", "gèle"],
    hints: ["Lis la phrase en entier.", "Pense à l'eau qui tombe du ciel.", "Il ne neige jamais au Sénégal."],
  },
  {
    text: "Pendant l'hivernage, il ___ souvent.",
    answer: "pleut",
    wrong: ["neige", "gèle"],
    hints: ["Lis la phrase en entier.", "Pense à l'eau qui tombe du ciel.", "Il ne neige jamais au Sénégal."],
  },
  {
    text: "L'hivernage est le nom de la saison des ___.",
    answer: "pluies",
    wrong: ["vents", "récoltes"],
    hints: ["Lis la phrase en entier.", "Pense à l'eau qui tombe du ciel.", "Les champs se remplissent d'eau pendant cette période."],
  },
  {
    text: "Il pleut davantage au ___ du pays qu'au nord.",
    answer: "sud",
    wrong: ["nord", "nord"],
    hints: ["Lis la phrase en entier.", "Le nord du pays est plus sec.", "Cherche la direction opposée à celle de la fin de la phrase."],
  },
  {
    text: "Pendant l'hivernage, la terre est souvent ___.",
    answer: "mouillée",
    wrong: ["sèche", "gelée"],
    hints: ["Lis la phrase en entier.", "Pense à l'eau qui tombe pendant cette période.", "Les mares se remplissent."],
  },
  {
    text: "L'harmattan souffle surtout pendant la saison ___.",
    answer: "sèche",
    wrong: ["pluvieuse", "froide"],
    hints: ["Lis la phrase en entier.", "Ce vent est chaud et sec.", "Il souffle quand il ne pleut presque pas."],
  },
];

/** « L'harmattan est un vent ___ et sec. » : un mot du climat, parmi deux ou trois. */
export function makeCe1SeasonGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-saison-trou", "compléter une phrase sur le climat", () => {
    const entry = pickFresh(ctx, windowFor(SEASON_GAPS, ctx.level, 2), (candidate) => `ce1-saison-trou:${candidate.text}`);
    return { prompt: "Complète la phrase.", text: entry.text, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

// ===========================================================================
// LE RELIEF ET LES COURS D'EAU (ge-ce1-eau-relief)
// ===========================================================================

const LAKE_TILES = ["Lac Rose", "Lac de Guiers"] as const;
const RIVER_TILES = ["Gambie", "Casamance"] as const;

/** Les questions « lequel de ces points d'eau » : le fleuve, le lac, le puits, la mare. */
type WaterType = { question: string; answer: string; wrong: readonly string[]; hints: readonly [string, string] };

/** Une question « lequel est un fleuve » ou « lequel est un lac », dite de deux façons. */
const riverQuestion = (lead: string, answer: string): WaterType => ({
  question: `${lead} est un fleuve ?`,
  answer,
  wrong: [...LAKE_TILES],
  hints: ["Pense à un grand cours d'eau.", "Son eau avance sans cesse jusqu'à la mer."],
});
const lakeQuestion = (lead: string, answer: string): WaterType => ({
  question: `${lead} est un lac ?`,
  answer,
  wrong: [...RIVER_TILES],
  hints: ["Pense à une grande eau entourée de terre.", "Son eau ne va pas vers la mer."],
});
const FIRST_LEAD = "Lequel de ces points d'eau";
const SECOND_LEAD = "Parmi ces points d'eau, lequel";

/** Les questions « lequel de ces points d'eau » : le fleuve, le lac, le puits, la mare, mêlés pour que chaque niveau en voie de plusieurs sortes. */
const WATER_TYPES: readonly WaterType[] = [
  riverQuestion(FIRST_LEAD, "Gambie"),
  lakeQuestion(FIRST_LEAD, "Lac Rose"),
  {
    question: "Lequel de ces points d'eau est un trou creusé dans le sol ?",
    answer: "Puits",
    wrong: ["Lac Rose", "Gambie"],
    hints: ["Pense à un trou profond.", "On y descend un seau attaché à une corde."],
  },
  {
    question: "Lequel de ces points d'eau reste après la pluie dans un creux du sol ?",
    answer: "Mare",
    wrong: ["Gambie", "Casamance"],
    hints: ["Pense à de l'eau de pluie qui ne s'en va pas.", "Elle disparaît quand il fait très chaud et sec."],
  },
  riverQuestion(FIRST_LEAD, "Casamance"),
  lakeQuestion(FIRST_LEAD, "Lac de Guiers"),
  riverQuestion(SECOND_LEAD, "Gambie"),
  lakeQuestion(SECOND_LEAD, "Lac Rose"),
  riverQuestion(SECOND_LEAD, "Casamance"),
  lakeQuestion(SECOND_LEAD, "Lac de Guiers"),
];

/** « Lequel de ces points d'eau est un fleuve ? » : un fleuve, un lac, un puits ou une mare, parmi trois. */
export function makeCe1WaterType(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-eau-type", "reconnaître un fleuve, un lac, un puits ou une mare", () => {
    const entry = pickFresh(ctx, windowFor(WATER_TYPES, ctx.level, 2), (candidate) => `ce1-eau-type:${candidate.question}:${candidate.answer}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: ["Lis la question en entier.", ...entry.hints] };
  });
}

type WaterWord = { tile: string; gives: string; hints: readonly [string, string] };

/** Les quatre mots de l'eau : le puits, la mare, le lac, le fleuve, avec leur définition. */
const WATER_WORDS: readonly WaterWord[] = [
  { tile: "Puits", gives: "Un trou creusé pour trouver l'eau", hints: ["On y descend un seau attaché à une corde.", "On creuse la terre pour le faire."] },
  { tile: "Mare", gives: "De l'eau de pluie dans un creux", hints: ["Elle se forme quand il a beaucoup plu.", "Elle disparaît quand il fait très chaud et sec."] },
  { tile: "Lac", gives: "Une grande eau entourée de terre", hints: ["L'eau y reste et ne va pas vers la mer.", "On peut en faire le tour à pied ou en pirogue."] },
  { tile: "Fleuve", gives: "Un grand cours d'eau qui va vers la mer", hints: ["Son eau avance toujours dans le même sens.", "Il se jette dans l'océan."] },
  { tile: "Océan", gives: "Une immense eau salée au bord du pays", hints: ["Son eau est salée.", "Les fleuves du pays s'y jettent."] },
];

const waterWordOf = (tile: string) => WATER_WORDS.find((word) => word.tile === tile) as WaterWord;

/** Les questions sur les mots de l'eau : à chaque question, un seul mot qui y répond. */
const WATER_QUESTIONS: readonly { question: string; answer: string; wrong: readonly [string, string] }[] = [
  { question: "Comment appelle-t-on un trou creusé pour atteindre l'eau ?", answer: "Puits", wrong: ["Mare", "Lac"] },
  { question: "Comment appelle-t-on une petite étendue d'eau qui reste après la pluie ?", answer: "Mare", wrong: ["Puits", "Fleuve"] },
  { question: "Comment appelle-t-on une grande étendue d'eau entourée de terre ?", answer: "Lac", wrong: ["Puits", "Fleuve"] },
  { question: "Comment appelle-t-on un grand cours d'eau qui coule vers la mer ?", answer: "Fleuve", wrong: ["Lac", "Puits"] },
  { question: "Quel mot désigne un trou profond dans le sol pour puiser de l'eau ?", answer: "Puits", wrong: ["Fleuve", "Lac"] },
  { question: "Quel mot désigne l'eau de pluie qui reste dans un creux du sol ?", answer: "Mare", wrong: ["Lac", "Fleuve"] },
  { question: "Quel mot désigne une grande eau calme entourée de terre ?", answer: "Lac", wrong: ["Mare", "Fleuve"] },
  { question: "Quel mot désigne une grande eau qui coule sans cesse vers la mer ?", answer: "Fleuve", wrong: ["Puits", "Lac"] },
];

/** « Comment appelle-t-on un trou creusé pour atteindre l'eau ? » : le mot de l'eau, parmi trois. */
export function makeCe1WaterDefinition(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-eau-mot", "nommer un point d'eau", () => {
    const entry = pickFresh(ctx, windowFor(WATER_QUESTIONS, ctx.level, 2), (candidate) => `ce1-eau-mot:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: ["Lis la question en entier.", ...waterWordOf(entry.answer).hints] };
  });
}

/** « Glisse chaque point d'eau dans la bonne case. » : une eau qui coule, une eau qui reste. */
export function makeCe1WaterSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-eau-glisser", "ranger les points d'eau selon que l'eau coule ou reste", () => {
    const flowing = shuffle(ctx.rng, [...RIVER_TILES, "Fleuve"]).slice(0, ctx.level <= 2 ? 2 : 3);
    const still = shuffle(ctx.rng, [...LAKE_TILES, "Mare", "Puits"]).slice(0, ctx.level <= 2 ? 2 : 3);
    return {
      prompt: "Glisse chaque point d'eau dans la bonne case.",
      zones: ["Eau qui coule", "Eau qui reste"],
      items: [...flowing.map((text) => ({ text, zone: "Eau qui coule" })), ...still.map((text) => ({ text, zone: "Eau qui reste" }))],
      hints: [
        "Regarde si l'eau avance vers la mer ou ne bouge pas.",
        "Un grand cours d'eau avance sans cesse.",
        "Un trou ou une grande eau entourée de terre garde son eau.",
      ],
    };
  });
}

/** « Relie chaque mot à ce qu'il veut dire. » : trois des quatre mots de l'eau. */
export function makeCe1WaterLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-eau-relier", "relier un point d'eau et sa définition", () => ({
    prompt: "Relie chaque mot à ce qu'il veut dire.",
    pairs: shuffle(ctx.rng, WATER_WORDS)
      .slice(0, 3)
      .map((word) => ({ left: word.tile, right: word.gives })),
    hints: ["Lis les trois mots, puis les trois phrases.", "Une eau qui avance n'est pas une eau qui reste.", "Commence par le mot dont tu es certain."],
  }));
}

/** Les villes d'un fleuve, HORS FICHE (à faire relire) : trois villes du Sénégal et trois de la Casamance. */
const RIVER_TOWNS: readonly { town: string; river: "Sénégal" | "Casamance"; hint: string }[] = [
  { town: "Saint-Louis", river: "Sénégal", hint: "Cette ville est dans le nord du pays." },
  { town: "Ziguinchor", river: "Casamance", hint: "Cette ville est dans le sud du pays." },
  { town: "Podor", river: "Sénégal", hint: "Cette ville est dans le nord du pays." },
  { town: "Kolda", river: "Casamance", hint: "Cette ville est dans le sud du pays." },
  { town: "Bakel", river: "Sénégal", hint: "Cette ville est dans l'est du pays, près d'un grand fleuve." },
  { town: "Sédhiou", river: "Casamance", hint: "Cette ville est dans le sud du pays." },
];

/** « Quel fleuve passe près de Saint-Louis ? » : le fleuve d'une ville, parmi les trois fleuves de la fiche. */
export function makeCe1RiverTown(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-eau-ville", "relier une ville et son fleuve", () => {
    const entry = pickFresh(ctx, windowFor(RIVER_TOWNS, ctx.level, 1), (candidate) => `ce1-eau-ville:${candidate.town}`);
    return {
      prompt: `Quel fleuve passe près de ${entry.town} ?`,
      answer: entry.river,
      wrong: ["Sénégal", "Casamance", "Gambie"].filter((river) => river !== entry.river),
      hints: ["Lis la question en entier.", entry.hint, "Pense aux trois grands fleuves du pays, et à la région où coule chacun."],
    };
  });
}

/** Le relief, d'après la fiche : un pays surtout plat, des collines au sud-est, vers Kédougou. */
const RELIEFS: readonly { question: string; answer: string; wrong: readonly [string, string]; hints: readonly [string, string, string] }[] = [
  {
    question: "Comment est le relief du Sénégal ?",
    answer: "Surtout plat",
    wrong: ["Très montagneux", "Couvert de volcans"],
    hints: ["Lis la question en entier.", "Pense à un pays où l'on voit loin à l'horizon.", "Il y a très peu de reliefs élevés."],
  },
  {
    question: "Où trouve-t-on des collines au Sénégal ?",
    answer: "Au sud-est",
    wrong: ["Au nord", "À l'ouest"],
    hints: ["Lis la question en entier.", "Elles sont loin de la mer.", "Elles sont près de la région de Kédougou."],
  },
  {
    question: "Dans quelle région trouve-t-on des collines ?",
    answer: "Kédougou",
    wrong: ["Saint-Louis", "Ziguinchor"],
    hints: ["Lis la question en entier.", "Cette région est loin de la mer.", "Elle est dans le sud-est du pays."],
  },
  {
    question: "Quelle région du Sénégal a un relief de collines ?",
    answer: "Kédougou",
    wrong: ["Ziguinchor", "Saint-Louis"],
    hints: ["Lis la question en entier.", "Cette région est loin de la mer.", "Elle est dans le sud-est du pays."],
  },
];

/** « Où trouve-t-on des collines au Sénégal ? » : le relief du pays, d'après la fiche. */
export function makeCe1Relief(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-relief", "le relief du Sénégal", () => {
    const entry = pickFresh(ctx, windowFor(RELIEFS, ctx.level, 1), (candidate) => `ce1-relief:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** Les phrases à trou sur l'eau et le relief, avec la bonne réponse et deux mauvais choix. */
const WATER_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hints: readonly [string, string, string] }[] = [
  {
    text: "Le ___ de Guiers est un grand point d'eau.",
    answer: "lac",
    wrong: ["fleuve", "puits"],
    hints: ["Lis la phrase en entier.", "Son eau ne va pas vers la mer.", "Il est entouré de terre."],
  },
  {
    text: "La Casamance est un ___.",
    answer: "fleuve",
    wrong: ["lac", "puits"],
    hints: ["Lis la phrase en entier.", "Son eau avance jusqu'à la mer.", "C'est un grand cours d'eau du sud."],
  },
  {
    text: "Un ___ est un trou creusé pour trouver de l'eau.",
    answer: "puits",
    wrong: ["lac", "fleuve"],
    hints: ["Lis la phrase en entier.", "On y descend un seau attaché à une corde.", "On creuse la terre pour le faire."],
  },
  {
    text: "Une ___ garde l'eau de pluie dans un creux du sol.",
    answer: "mare",
    wrong: ["colline", "montagne"],
    hints: ["Lis la phrase en entier.", "Elle se forme quand il a beaucoup plu.", "Elle disparaît quand il fait très chaud et sec."],
  },
  {
    text: "Le Sénégal est un pays surtout ___.",
    answer: "plat",
    wrong: ["montagneux", "volcanique"],
    hints: ["Lis la phrase en entier.", "On y voit loin à l'horizon.", "Il y a très peu de reliefs élevés."],
  },
  {
    text: "Les collines du Sénégal se trouvent au sud-___.",
    answer: "est",
    wrong: ["ouest", "nord"],
    hints: ["Lis la phrase en entier.", "Elles sont loin de la mer.", "Elles sont près de la région de Kédougou."],
  },
  {
    text: "Un ___ est une grande eau entourée de terre.",
    answer: "lac",
    wrong: ["puits", "fleuve"],
    hints: ["Lis la phrase en entier.", "Son eau ne va pas vers la mer.", "On peut en faire le tour à pied ou en pirogue."],
  },
  {
    text: "Le ___ est un grand cours d'eau qui va vers la mer.",
    answer: "fleuve",
    wrong: ["lac", "puits"],
    hints: ["Lis la phrase en entier.", "Son eau avance toujours dans le même sens.", "Il se jette dans l'océan."],
  },
];

/** « Le ___ de Guiers est un grand point d'eau. » : un mot de l'eau ou du relief, parmi trois. */
export function makeCe1WaterGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-eau-trou", "compléter une phrase sur l'eau et le relief", () => {
    const entry = pickFresh(ctx, windowFor(WATER_GAPS, ctx.level, 2), (candidate) => `ce1-eau-trou:${candidate.text}`);
    return { prompt: "Complète la phrase.", text: entry.text, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

// ===========================================================================
// LE PLAN DE LA CLASSE ET DE L'ÉCOLE (ge-ce1-plan)
// ===========================================================================

type PlanObject = { tile: string; word: string; many: string };
type PlanScene = { of: string; which: string; noun: string; nouns: string; objects: readonly PlanObject[] };

/** Les trois plans de la fiche : la classe, l'école, la maison. Aucun objet n'est élidé (un énoncé n'a qu'une apostrophe). */
export const PLAN_SCENES: readonly PlanScene[] = [
  {
    of: "de la classe",
    which: "Quel objet",
    noun: "objet",
    nouns: "objets",
    objects: [
      { tile: "Porte", word: "la porte", many: "portes" },
      { tile: "Fenêtre", word: "la fenêtre", many: "fenêtres" },
      { tile: "Bureau", word: "le bureau", many: "bureaux" },
      { tile: "Table", word: "la table", many: "tables" },
      { tile: "Chaise", word: "la chaise", many: "chaises" },
      { tile: "Placard", word: "le placard", many: "placards" },
    ],
  },
  {
    of: "de l'école",
    which: "Quel lieu",
    noun: "lieu",
    nouns: "lieux",
    objects: [
      { tile: "Classe", word: "la classe", many: "classes" },
      { tile: "Cour", word: "la cour", many: "cours" },
      { tile: "Puits", word: "le puits", many: "puits" },
      { tile: "Cantine", word: "la cantine", many: "cantines" },
      { tile: "Bibliothèque", word: "la bibliothèque", many: "bibliothèques" },
      { tile: "Terrain", word: "le terrain", many: "terrains" },
    ],
  },
  {
    of: "de la maison",
    which: "Quelle pièce",
    noun: "pièce",
    nouns: "pièces",
    objects: [
      { tile: "Cuisine", word: "la cuisine", many: "cuisines" },
      { tile: "Chambre", word: "la chambre", many: "chambres" },
      { tile: "Salon", word: "le salon", many: "salons" },
      { tile: "Cour", word: "la cour", many: "cours" },
      { tile: "Douche", word: "la douche", many: "douches" },
      { tile: "Véranda", word: "la véranda", many: "vérandas" },
    ],
  },
];

const SQUARES = ["🟥", "🟦", "🟩", "🟨", "🟪", "🟧"] as const;
const EMPTY = "⬜";
const COLUMNS = 3;

type Plan = {
  scene: PlanScene;
  rows: number;
  /** Les objets de la légende, dans l'ordre de la légende. */
  objects: PlanObject[];
  /** Le carré de couleur de chaque objet. */
  squareOf: Map<PlanObject, string>;
  cells: (PlanObject | null)[][];
};

/** L'endroit d'une case, dit comme une réponse le dit : « en haut à gauche », « au centre », « en bas à droite ». */
function placeWords(rows: number, r: number, c: number): string {
  if (rows === 3 && r === 1 && c === 1) return "au centre";
  const vertical = r === 0 ? "en haut" : r === rows - 1 ? "en bas" : "au milieu";
  const horizontal = c === 0 ? "à gauche" : c === COLUMNS - 1 ? "à droite" : "au milieu";
  return `${vertical} ${horizontal}`;
}

/**
 * Trois objets d'une scène, un carré de couleur chacun, posés dans des cases différentes d'un plan de 2 ou 3 lignes. Avec `repeat`,
 * le premier objet est posé plusieurs fois.
 */
function drawPlan(ctx: GameContext, rows: number, repeat?: { times: number }): Plan {
  const scene = pick(ctx.rng, PLAN_SCENES);
  const objects = shuffle(ctx.rng, scene.objects).slice(0, 3);
  const squares = shuffle(ctx.rng, SQUARES);
  const squareOf = new Map(objects.map((object, i) => [object, squares[i]]));
  const cells: (PlanObject | null)[][] = Array.from({ length: rows }, () => Array.from({ length: COLUMNS }, () => null));
  const slots = shuffle(
    ctx.rng,
    Array.from({ length: rows * COLUMNS }, (_, i) => ({ r: Math.floor(i / COLUMNS), c: i % COLUMNS })),
  );
  const toPlace = objects.flatMap((object, i) => (i === 0 && repeat ? Array.from({ length: repeat.times }, () => object) : [object]));
  toPlace.forEach((object, i) => {
    cells[slots[i].r][slots[i].c] = object;
  });
  return { scene, rows, objects, squareOf, cells };
}

/** « Voici le plan de la classe vu de dessus. 🟥 est la porte, 🟦 la fenêtre et 🟨 le bureau. » : l'introduction et la légende, écrites. */
function planIntro(plan: Plan): string {
  const square = (object: PlanObject) => plan.squareOf.get(object) as string;
  const [a, b, c] = plan.objects;
  return `Voici le plan ${plan.scene.of} vu de dessus. ${square(a)} est ${a.word}, ${square(b)} ${b.word} et ${square(c)} ${c.word}.`;
}

const gridText = (plan: Plan) => plan.cells.map((row) => row.map((cell) => (cell ? (plan.squareOf.get(cell) as string) : EMPTY)).join("")).join("\n");

/** Le plan en entier, prêt à être lu : introduction, légende et quadrillage. */
const planText = (plan: Plan) => `${planIntro(plan)}\n${gridText(plan)}`;

/** Les cases occupées d'un plan : l'objet et sa place. */
function occupied(plan: Plan): { object: PlanObject; place: string }[] {
  return plan.cells.flatMap((row, r) => row.flatMap((object, c) => (object ? [{ object, place: placeWords(plan.rows, r, c) }] : [])));
}

const PLAN_HINTS = [
  "Lis d'abord ce que veut dire chaque couleur.",
  "Cherche la couleur dans le plan, ligne après ligne.",
  "Quand tu l'as trouvée, dis où elle se trouve par rapport aux bords du plan.",
] as const;

const planRows = (ctx: GameContext) => (ctx.level === 1 ? 2 : 3);

/** « Où est la porte ? » : l'endroit d'un objet, parmi les endroits des trois objets. */
export function makeCe1PlanWhere(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-ou", () => {
    const plan = drawPlan(ctx, planRows(ctx));
    const places = occupied(plan);
    const target = pick(ctx.rng, places);
    const options = shuffle(
      ctx.rng,
      places.map((entry) => entry.place),
    );
    return {
      type: "qcm",
      prompt: `${planText(plan)}\nOù est ${target.object.word} ?`,
      payload: { options, correctIndex: options.indexOf(target.place), game: originOf("ce1-plan-ou", ctx), concept: "retrouver un lieu sur un plan" },
      answerKey: target.place,
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Quel objet est en haut à gauche ? » : l'objet à une place du plan, parmi les trois objets. */
export function makeCe1PlanWhat(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-quoi", () => {
    const plan = drawPlan(ctx, planRows(ctx));
    const target = pick(ctx.rng, occupied(plan));
    const options = shuffle(
      ctx.rng,
      plan.objects.map((object) => object.tile),
    );
    return {
      type: "qcm",
      prompt: `${planText(plan)}\n${plan.scene.which} est ${target.place} ?`,
      payload: { options, correctIndex: options.indexOf(target.object.tile), game: originOf("ce1-plan-quoi", ctx), concept: "lire un plan avec sa légende" },
      answerKey: target.object.tile,
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Combien de chaises y a-t-il sur le plan ? » : un même objet à plusieurs places. */
export function makeCe1PlanCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-compter", () => {
    const times = randomInt(ctx.rng, 2, ctx.level === 1 ? 3 : 4);
    const plan = drawPlan(ctx, planRows(ctx), { times });
    const repeated = plan.objects[0];
    const options = shuffle(
      ctx.rng,
      [times, times + 1, times - 1].map(String),
    );
    return {
      type: "qcm",
      prompt: `${planText(plan)}\nCombien de ${repeated.many} y a-t-il sur le plan ?`,
      payload: { options, correctIndex: options.indexOf(String(times)), game: originOf("ce1-plan-compter", ctx), concept: "compter sur un plan" },
      answerKey: String(times),
      hints: [
        "Lis d'abord ce que veut dire chaque couleur.",
        "Cherche toutes les cases de la couleur de la question.",
        "Compte avec le doigt, une case à la fois, sans en oublier.",
      ],
    };
  });
}

/** « Relie chaque objet à sa place. » : trois objets, trois places. */
export function makeCe1PlanLinks(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-relier", () => {
    const plan = drawPlan(ctx, planRows(ctx));
    const pairs = occupied(plan).map((entry) => ({ left: entry.object.tile, right: entry.place }));
    return {
      type: "match",
      prompt: `${planText(plan)}\nRelie chaque ${plan.scene.noun} à sa place.`,
      payload: { pairs, game: originOf("ce1-plan-relier", ctx), concept: "retrouver un lieu sur un plan" },
      answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Mets les objets de la ligne du haut de gauche à droite. » : les trois objets d'une même ligne. */
export function makeCe1PlanOrder(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-ordre", () => {
    const rows = planRows(ctx);
    const base = drawPlan(ctx, rows);
    const row = randomInt(ctx.rng, 0, rows - 1);
    const alphabetical = [...base.objects].sort((a, b) => a.tile.localeCompare(b.tile, "fr"));
    let line = shuffle(ctx.rng, base.objects);
    // Une suite déjà rangée par ordre alphabétique, dans un sens ou dans l'autre, se devine sans lire le plan.
    for (let attempt = 0; attempt < 12 && (line.every((o, i) => o === alphabetical[i]) || line.every((o, i) => o === alphabetical[2 - i])); attempt++) {
      line = shuffle(ctx.rng, base.objects);
    }
    const cells: (PlanObject | null)[][] = Array.from({ length: rows }, (_, r) => (r === row ? [...line] : Array.from({ length: COLUMNS }, () => null)));
    const plan: Plan = { ...base, cells };
    return {
      type: "order",
      prompt: `${planText(plan)}\nMets les ${plan.scene.nouns} du plan de gauche à droite.`,
      payload: { correctSequence: line.map((object) => object.tile), game: originOf("ce1-plan-ordre", ctx), concept: "lire une ligne d'un plan" },
      answerKey: line.map((object) => object.tile).join(" "),
      hints: [
        "Lis d'abord ce que veut dire chaque couleur.",
        "Repère la ligne demandée, puis lis ses trois cases une à une.",
        "Dis le nom de chaque objet en suivant la ligne avec le doigt.",
      ],
    };
  });
}

/** « Complète la phrase. En haut à gauche, il y a ___. » : l'objet à une place du plan, parmi les trois objets. */
export function makeCe1PlanGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-trou", () => {
    const plan = drawPlan(ctx, planRows(ctx));
    const target = pick(ctx.rng, occupied(plan));
    const options = shuffle(
      ctx.rng,
      plan.objects.map((object) => object.word),
    );
    return {
      type: "fill-blank",
      prompt: `${planText(plan)}\nComplète la phrase.`,
      payload: {
        text: `${cap(target.place)}, il y a ___.`,
        blanks: [{ options, answer: target.object.word }],
        game: originOf("ce1-plan-trou", ctx),
        concept: "lire un plan avec sa légende",
      },
      answerKey: target.object.word,
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Glisse chaque objet en haut ou en bas. » : un plan de deux lignes, au moins un objet sur chacune. */
export function makeCe1PlanSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ce1-plan-glisser",
    () => {
      let plan = drawPlan(ctx, 2);
      // Chaque ligne doit montrer au moins un objet : sinon l'une des deux cases est vide.
      for (let attempt = 0; attempt < 12 && plan.cells.some((row) => row.every((cell) => cell === null)); attempt++) plan = drawPlan(ctx, 2);
      const items = shuffle(
        ctx.rng,
        plan.cells.flatMap((row, r) => row.flatMap((object) => (object ? [{ text: object.tile, correctZone: r === 0 ? "En haut" : "En bas" }] : []))),
      );
      return {
        type: "drag-drop",
        prompt: `${planText(plan)}\nGlisse chaque ${plan.scene.noun} en haut ou en bas.`,
        payload: { zones: ["En haut", "En bas"], items, game: originOf("ce1-plan-glisser", ctx), concept: "ranger les objets d'un plan" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [...PLAN_HINTS],
      };
    },
    (game) => String(game.prompt),
  );
}

/** Ce que la fiche dit du plan et de sa légende. */
const PLAN_FACTS: readonly { question: string; answer: string; wrong: readonly [string, string]; hints: readonly [string, string, string] }[] = [
  {
    question: "À quoi sert la légende d'un plan ?",
    answer: "À expliquer ce que chaque signe montre",
    wrong: ["À choisir les couleurs du plan", "À compter les élèves de la classe"],
    hints: ["Lis la question en entier.", "Elle est écrite à côté du dessin.", "Sans elle, on ne sait pas lire les couleurs du dessin."],
  },
  {
    question: "Que dessine-t-on sur un plan ?",
    answer: "Un lieu vu de dessus",
    wrong: ["Un animal de face", "Un voyage raconté"],
    hints: ["Lis la question en entier.", "Pense à un oiseau qui regarde la classe depuis le ciel.", "On y voit le sol et la place de chaque chose."],
  },
  {
    question: "Comment voit-on un lieu sur un plan ?",
    answer: "Vu de dessus",
    wrong: ["Vu de face", "Vu de côté"],
    hints: ["Lis la question en entier.", "Pense à un oiseau qui regarde la classe depuis le ciel.", "On ne voit pas les murs, on voit le sol."],
  },
  {
    question: "Que trouve-t-on dans la légende d'un plan ?",
    answer: "Le sens de chaque couleur",
    wrong: ["Le prix des objets", "Le nom des élèves"],
    hints: ["Lis la question en entier.", "Elle est écrite à côté du dessin.", "Sans elle, on ne saurait pas ce que montre un carré."],
  },
];

/** « À quoi sert la légende d'un plan ? » : un fait de la fiche sur le plan, parmi trois réponses. */
export function makeCe1PlanFact(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-plan-legende", "ce qu'est un plan et sa légende", () => {
    const entry = pickFresh(ctx, windowFor(PLAN_FACTS, ctx.level, 1), (candidate) => `ce1-plan-legende:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** « Combien de cases vides y a-t-il ? Écris le nombre. » : les cases sans objet d'un plan. */
export function makeCe1PlanBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-plan-ecrire", () => {
    const plan = drawPlan(ctx, planRows(ctx));
    const blank = plan.cells.flat().filter((cell) => cell === null).length;
    return {
      type: "short-answer",
      prompt: `${planText(plan)}\nCombien de cases vides y a-t-il ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(blank)], game: originOf("ce1-plan-ecrire", ctx), concept: "compter les cases d'un plan" },
      answerKey: String(blank),
      hints: [
        "Lis d'abord ce que veut dire chaque couleur.",
        "Une case vide est une case où il n'y a aucun objet.",
        "Compte avec le doigt, une case à la fois, ligne après ligne.",
      ],
    };
  });
}
