/**
 * LES GABARITS DU CALENDRIER, DES DURÉES, DES FRÉQUENCES ET DE L'EMPLOI DU TEMPS : pour l'enfant de CP
 * qui se repère dans le temps (histoire, étape 1 : `hi-cp-calendrier`, `hi-cp-durees`,
 * `hi-cp-frequences`, `hi-cp-emploi-du-temps`).
 *
 * Le modèle écrivait « Les mois de la saison sèche sont janvier et décembre » avec avril et juin parmi les
 * choix, « Le cours de français est avant la récréation » sans emploi du temps à l'écran, « Mets ces
 * activités dans l'ordre du plus court au plus long : jouer, manger, dormir » (aucun ordre n'est le bon).
 * Ici la réponse se calcule ou se lit dans ce que l'énoncé montre : les douze mois dans l'ordre de l'année,
 * les sept jours de la semaine, une chaîne de durées (récréation, journée, semaine, mois, année) et un
 * emploi du temps écrit dans l'énoncé.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les mois, les jours et la chaîne des durées sont des ordres que personne ne discute.
 * - Les saisons (saison sèche, hivernage) n'y sont PAS : la fiche ne donne aucun mois, aucun gabarit
 *   n'en parle.
 * - Les fréquences (`EVENTS`) sont celles de la fiche de `hi-cp-frequences` : aller à l'école tous les
 *   jours, le jour de marché chaque semaine, l'anniversaire, la Tabaski, la Korité, Noël et la fête de
 *   l'indépendance chaque année. « Souvent, parfois, jamais » reste au modèle : c'est subjectif.
 * - Les équivalences de durées (`CONVERSIONS`) sont celles du calendrier : sept jours, douze mois,
 *   vingt-quatre heures, soixante minutes.
 * - L'emploi du temps est INVENTÉ par le gabarit et ÉCRIT dans l'énoncé : on y lit la réponse, on n'a
 *   besoin de rien savoir de l'école de l'enfant. Seuls lundi, mardi, mercredi et vendredi y figurent.
 *
 * RÈGLES POUR AJOUTER UN ÉLÉMENT
 * - Une étiquette est un mot SEUL, sans article (« mars », « semaine », « Tabaski ») : au CI, une tuile
 *   « article + un nom » doit avoir son image au catalogue (`lib/item-images.ts`), et la plupart de ces
 *   noms n'en ont pas. Ces gabarits ne sont câblés qu'au CP, mais le CI les joue aussi dans les tests.
 * - Aucun indice n'écrit un mot de la bonne réponse (« mars », « jours », « semaine »).
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe
 *   droite, et vingt-huit mots au plus (la consigne du CP).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, type GameContext, type GeneratedGame } from "./shared";
import { SCHOOL_DAYS } from "./temps";
import { DAYS } from "./things";

const NAMES_DAYS = DAYS as readonly string[];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

// ===========================================================================
// LES MOIS DE L'ANNÉE
// ===========================================================================

/** Les douze mois, dans l'ordre de l'année. */
export const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

const month = (i: number) => MONTHS[i] as string;

/** « Mets ces mois dans l'ordre de l'année. » : trois mois qui se suivent, quatre ensuite, espacés au dernier palier. */
export function makeMonthOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "mois-ordre",
    () => {
      const count = ctx.level === 1 ? 3 : 4;
      let indexes: number[];
      if (ctx.level >= 3) {
        indexes = shuffle(ctx.rng, range(MONTHS.length))
          .slice(0, count)
          .sort((a, b) => a - b);
      } else {
        const start = randomInt(ctx.rng, 0, MONTHS.length - count);
        indexes = Array.from({ length: count }, (_, i) => start + i);
      }
      const sequence = indexes.map(month);
      return {
        type: "order",
        prompt: "Mets ces mois dans l'ordre du calendrier.",
        payload: { correctSequence: sequence, game: originOf("mois-ordre", ctx), concept: "ranger les mois de l'année" },
        answerKey: sequence.join(", "),
        hints: [
          "Récite les mois de l'année, du premier au dernier.",
          "Cherche celui que tu dis en premier, et place-le au début.",
          "Place ensuite celui qui vient après, puis le suivant.",
        ],
      };
    },
    sortedOptions,
  );
}

/** « Quel mois vient juste après mars ? » : le mois de la question n'est jamais un mauvais choix. */
export function makeMonthNeighbour(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mois-voisin", () => {
    const after = ctx.level === 1 || ctx.rng() < 0.5;
    const reference = after ? randomInt(ctx.rng, 0, 10) : randomInt(ctx.rng, 1, 11);
    const answer = reference + (after ? 1 : -1);
    const wrong = shuffle(
      ctx.rng,
      range(MONTHS.length).filter((i) => i !== answer && i !== reference),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]).map(month);
    return {
      type: "qcm",
      prompt: `Quel mois vient juste ${after ? "après" : "avant"} ${month(reference)} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(month(answer)),
        game: originOf("mois-voisin", ctx),
        concept: "le mois d'avant et le mois d'après",
      },
      answerKey: month(answer),
      hints: [
        "Récite les mois de l'année dans l'ordre.",
        "Arrête-toi sur le mois de la question.",
        after ? "Le bon mois est celui que tu dis juste après lui." : "Le bon mois est celui que tu disais juste avant lui.",
      ],
    };
  });
}

const MONTH_ORDINALS: readonly (readonly [string, number])[] = [
  ["premier", 0],
  ["deuxième", 1],
  ["troisième", 2],
  ["quatrième", 3],
  ["cinquième", 4],
  ["sixième", 5],
  ["septième", 6],
  ["huitième", 7],
  ["neuvième", 8],
  ["dixième", 9],
  ["onzième", 10],
  ["dernier", 11],
];

/** « Quel est le troisième mois de l'année ? » : le rang d'un mois, de janvier à décembre. */
export function makeMonthRank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mois-rang", () => {
    const asks =
      ctx.level === 1
        ? [MONTH_ORDINALS[0], MONTH_ORDINALS[1], MONTH_ORDINALS[2], MONTH_ORDINALS[11]]
        : ctx.level === 2
          ? [...MONTH_ORDINALS.slice(0, 6), MONTH_ORDINALS[11]]
          : MONTH_ORDINALS;
    const [word, index] = pickFresh(ctx, asks, ([rank]) => `mois-rang-rang:${rank}`);
    const wrong = shuffle(
      ctx.rng,
      range(MONTHS.length).filter((i) => i !== index),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [index, ...wrong]).map(month);
    return {
      type: "qcm",
      prompt: `Quel est le ${word} mois de l'année ?`,
      payload: {
        options,
        correctIndex: options.indexOf(month(index)),
        game: originOf("mois-rang", ctx),
        concept: "le rang d'un mois dans l'année",
      },
      answerKey: month(index),
      hints: [
        "Récite les mois de l'année dans l'ordre.",
        "Compte sur tes doigts, un doigt par mois.",
        word === "premier"
          ? "Le premier mois est celui par lequel l'année commence."
          : word === "dernier"
            ? "Le dernier mois est celui où l'année se termine."
            : "Arrête-toi au rang que la question demande.",
      ],
    };
  });
}

/** « janvier, février, ___, avril. » : le mois qui manque dans une suite de mois qui se suivent. */
export function makeMissingMonth(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mois-trou", () => {
    const length = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
    const start = randomInt(ctx.rng, 0, MONTHS.length - length);
    const run = Array.from({ length }, (_, i) => month(start + i));
    // Le trou est au milieu au premier palier, n'importe où ensuite.
    const hole = ctx.level === 1 ? 1 : randomInt(ctx.rng, 0, length - 1);
    const answer = run[hole];
    // Les mauvais choix sont des mois qui ne sont pas dans la suite : aucun ne la complète.
    const outside = MONTHS.filter((name) => !run.includes(name));
    const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, outside).slice(0, 2)]);
    return {
      type: "fill-blank",
      prompt: "Complète les mois de l'année.",
      payload: {
        text: `${run.map((name, i) => (i === hole ? "___" : name)).join(", ")}.`,
        blanks: [{ options, answer }],
        game: originOf("mois-trou", ctx),
        concept: "les mois de l'année dans l'ordre",
      },
      answerKey: answer,
      hints: [
        "Récite les mois de l'année dans l'ordre, en commençant par le premier de la suite.",
        "Dis le mois qui vient juste avant le trou.",
        "Le mois qui manque est celui que tu dis juste après lui.",
      ],
    };
  });
}

/** « Nous sommes en mars. Dans combien de mois sera juillet ? Écris le nombre. » : l'écart entre deux mois de la même année, à écrire. */
export function makeMonthGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mois-ecart", () => {
    const maxGap = ctx.level === 1 ? 2 : ctx.level === 2 ? 4 : 6;
    const gap = randomInt(ctx.rng, 1, maxGap);
    const start = randomInt(ctx.rng, 0, MONTHS.length - 1 - gap);
    return {
      type: "short-answer",
      prompt: `Nous sommes en ${month(start)}. Dans combien de mois sera ${month(start + gap)} ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(gap)], game: originOf("mois-ecart", ctx), concept: "compter les mois qui passent" },
      answerKey: String(gap),
      hints: [
        "Récite les mois de l'année dans l'ordre.",
        "Pars du mois où nous sommes, et avance un mois à la fois.",
        "Ne compte pas le mois de départ, compte seulement les pas que tu fais.",
      ],
    };
  });
}

const YEARS = [2024, 2025, 2026, 2027] as const;

/** « Voici une date, le 14 mai 2026. Quel est le mois ? » : le mois, le numéro du jour, puis l'année. */
export function makeReadDate(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "date-lire", () => {
    const which = pick(ctx.rng, ctx.level === 1 ? (["mois"] as const) : ctx.level === 2 ? (["mois", "jour"] as const) : (["mois", "jour", "annee"] as const));
    const monthIndex = randomInt(ctx.rng, 0, 11);
    const day = randomInt(ctx.rng, 2, 28);
    const year = pick(ctx.rng, YEARS);
    let options: string[];
    let answer: string;
    let ask: string;
    let hints: string[];
    if (which === "mois") {
      answer = month(monthIndex);
      options = shuffle(ctx.rng, [
        answer,
        ...shuffle(
          ctx.rng,
          MONTHS.filter((name) => name !== answer),
        ).slice(0, 2),
      ]);
      ask = "Quel est le mois ?";
      hints = [
        "Lis la date doucement, de gauche à droite.",
        "Dans une date, le mot qui suit le numéro du jour est le mois.",
        "Le mois s'écrit avec des lettres, pas avec des chiffres.",
      ];
    } else if (which === "jour") {
      answer = String(day);
      const others = shuffle(
        ctx.rng,
        range(28)
          .map((i) => i + 1)
          .filter((n) => n !== day),
      ).slice(0, 2);
      options = shuffle(ctx.rng, [answer, ...others.map(String)]);
      ask = "Quel est le jour du mois ?";
      hints = [
        "Lis la date doucement, de gauche à droite.",
        "Dans une date, le premier nombre dit le jour du mois.",
        "Le nombre le plus grand est l'année, pas le jour.",
      ];
    } else {
      answer = String(year);
      const others = shuffle(
        ctx.rng,
        YEARS.filter((y) => y !== year),
      ).slice(0, 2);
      options = shuffle(ctx.rng, [answer, ...others.map(String)]);
      ask = "Quelle est l'année ?";
      hints = [
        "Lis la date doucement, de gauche à droite.",
        "Dans une date, l'année est le dernier nombre, le plus grand.",
        "L'année s'écrit avec quatre chiffres.",
      ];
    }
    return {
      type: "qcm",
      prompt: `Voici une date, le ${day} ${month(monthIndex)} ${year}. ${ask}`,
      payload: { options, correctIndex: options.indexOf(answer), game: originOf("date-lire", ctx), concept: "lire une date" },
      answerKey: answer,
      hints,
    };
  });
}

/** Les écarts d'un jour à l'autre : demain, après-demain, la semaine d'après, et aux derniers paliers la veille. */
const DAY_STEPS: Record<number, readonly number[]> = { 1: [1], 2: [1, 2, 7], 3: [1, 2, 3, 7, -1, 8], 4: [1, 2, 3, 7, -1, 8] };

/** « Le 3 mars est un mardi. Quel jour est le 4 mars ? » : on avance ou on recule dans la semaine, sept jours plus tard c'est le même jour. */
export function makeCalendarDay(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "calendrier-jour", () => {
    const step = pick(ctx.rng, DAY_STEPS[ctx.level]);
    const day = randomInt(ctx.rng, 3, 19);
    const monthIndex = randomInt(ctx.rng, 0, 11);
    const todayIndex = randomInt(ctx.rng, 0, 6);
    const answerIndex = (((todayIndex + step) % 7) + 7) % 7;
    // Le jour cité n'est jamais un mauvais choix : l'enfant le prendrait en reconnaissant le mot.
    const wrong = shuffle(
      ctx.rng,
      range(7).filter((i) => i !== answerIndex && i !== todayIndex),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answerIndex, ...wrong]).map((i) => NAMES_DAYS[i]);
    return {
      type: "qcm",
      prompt: `Le ${day} ${month(monthIndex)} est un ${NAMES_DAYS[todayIndex]}. Quel jour est le ${day + step} ${month(monthIndex)} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(NAMES_DAYS[answerIndex]),
        game: originOf("calendrier-jour", ctx),
        concept: "se repérer dans un calendrier",
      },
      answerKey: NAMES_DAYS[answerIndex],
      hints: [
        "Récite les jours de la semaine dans l'ordre.",
        "Compte les jours qui passent entre les deux dates, un par un.",
        "Sept jours plus tard, on retrouve le même jour de la semaine.",
      ],
    };
  });
}

/** « Relie chaque mois au mois qui vient juste après. » : trois paires, jamais un mois des deux côtés. */
export function makeMonthLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "mois-relier",
    () => {
      const after = ctx.level < 3 || ctx.rng() < 0.5;
      // Trois mois espacés d'au moins deux crans : le mois d'après de l'un n'est jamais un des mois donnés.
      let lefts: number[] = [];
      for (let attempt = 0; attempt < 80; attempt++) {
        const picks = shuffle(
          ctx.rng,
          range(MONTHS.length).filter((i) => (after ? i <= 10 : i >= 1)),
        )
          .slice(0, 3)
          .sort((a, b) => a - b);
        if (picks.length === 3 && picks[1] - picks[0] >= 2 && picks[2] - picks[1] >= 2) {
          lefts = picks;
          break;
        }
      }
      if (lefts.length < 3) lefts = after ? [0, 3, 6] : [3, 6, 9];
      const pairs = lefts.map((i) => ({ left: month(i), right: month(i + (after ? 1 : -1)) }));
      return {
        type: "match",
        prompt: after ? "Relie chaque mois au mois qui vient juste après." : "Relie chaque mois au mois qui vient juste avant.",
        payload: { pairs, game: originOf("mois-relier", ctx), concept: "le mois d'avant et le mois d'après" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: [
          "Récite les mois de l'année dans l'ordre.",
          after ? "Dis un mois, puis celui que tu dis juste après lui." : "Dis un mois, puis celui que tu disais juste avant lui.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string; right: string }[])
        .map((p) => `${p.left}${p.right}`)
        .sort()
        .join(","),
  );
}

/** « Glisse chaque mois avant ou après avril. » : un mois au moins de chaque côté, jamais le mois de repère. */
export function makeMonthsAroundOne(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "mois-avant-apres",
    () => {
      const reference = randomInt(ctx.rng, 2, 9);
      const before = range(reference);
      const after = range(MONTHS.length - reference - 1).map((i) => reference + 1 + i);
      const total = ctx.level === 1 ? 3 : 4;
      const chosen = new Set<number>([pick(ctx.rng, before), pick(ctx.rng, after)]);
      for (const i of shuffle(ctx.rng, [...before, ...after])) {
        if (chosen.size >= total) break;
        chosen.add(i);
      }
      const zoneBefore = `Avant ${month(reference)}`;
      const zoneAfter = `Après ${month(reference)}`;
      const items = shuffle(
        ctx.rng,
        [...chosen].map((i) => ({ text: month(i), correctZone: i < reference ? zoneBefore : zoneAfter })),
      );
      return {
        type: "drag-drop",
        prompt: `Glisse chaque mois avant ou après ${month(reference)}.`,
        payload: {
          zones: [zoneBefore, zoneAfter],
          items,
          game: originOf("mois-avant-apres", ctx),
          concept: "avant et après un mois de l'année",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Récite les mois de l'année dans l'ordre.",
          "Les mois que tu dis avant celui de la phrase vont d'un côté.",
          "Ceux que tu dis après lui vont de l'autre côté.",
        ],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

// ===========================================================================
// LES DURÉES
// ===========================================================================

/**
 * La chaîne des durées, de la plus courte à la plus longue. Chacune est un mot SEUL (l'étiquette) et
 * se dit avec son article dans l'énoncé (`than`, une seule apostrophe : « qu'une semaine »).
 */
export const DURATIONS: readonly { tile: string; than: string }[] = [
  { tile: "récréation", than: "qu'une récréation" },
  { tile: "journée", than: "qu'une journée" },
  { tile: "semaine", than: "qu'une semaine" },
  { tile: "mois", than: "qu'un mois" },
  { tile: "année", than: "qu'une année" },
];

const duration = (i: number) => (DURATIONS[i] as (typeof DURATIONS)[number]).tile;
const thanOf = (i: number) => (DURATIONS[i] as (typeof DURATIONS)[number]).than;

/**
 * « Lequel dure le plus longtemps ? » ou « Lequel dure plus longtemps qu'une semaine ? » : une seule des
 * trois durées répond. La durée citée n'est jamais un choix.
 */
export function makeLongerDuration(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "duree-plus-long", () => {
    const variants =
      ctx.level === 1 ? (["plus long", "plus court"] as const) : (["plus long", "plus court", "plus que", "moins que"] as const);
    const variant = pick(ctx.rng, variants);
    let prompt: string;
    let answer: number;
    let chosen: number[];
    let hint: string;
    if (variant === "plus long" || variant === "plus court") {
      chosen = shuffle(ctx.rng, range(DURATIONS.length)).slice(0, 3);
      answer = variant === "plus long" ? Math.max(...chosen) : Math.min(...chosen);
      prompt = variant === "plus long" ? "Lequel dure le plus longtemps ?" : "Lequel dure le moins longtemps ?";
      hint = variant === "plus long" ? "Celui qui prend le plus de temps est la réponse." : "Celui qui prend le moins de temps est la réponse.";
    } else if (variant === "plus que") {
      // Plus longtemps que la semaine ou le mois : au moins une durée plus longue, au moins deux plus courtes.
      const ref = pick(ctx.rng, [2, 3]);
      answer = pick(
        ctx.rng,
        range(DURATIONS.length).filter((i) => i > ref),
      );
      chosen = [answer, ...shuffle(ctx.rng, range(ref)).slice(0, 2)];
      prompt = `Lequel dure plus longtemps ${thanOf(ref)} ?`;
      hint = "Celui qui dure plus que la durée de la question est la réponse.";
    } else {
      // Moins longtemps que la journée ou la semaine : au moins une durée plus courte, au moins deux plus longues.
      const ref = pick(ctx.rng, [1, 2]);
      answer = pick(ctx.rng, range(ref));
      chosen = [
        answer,
        ...shuffle(
          ctx.rng,
          range(DURATIONS.length).filter((i) => i > ref),
        ).slice(0, 2),
      ];
      prompt = `Lequel dure moins longtemps ${thanOf(ref)} ?`;
      hint = "Celui qui dure moins que la durée de la question est la réponse.";
    }
    const options = shuffle(ctx.rng, chosen).map(duration);
    return {
      type: "qcm",
      prompt,
      payload: {
        options,
        correctIndex: options.indexOf(duration(answer)),
        game: originOf("duree-plus-long", ctx),
        concept: "comparer des durées",
      },
      answerKey: duration(answer),
      hints: ["Lis chaque mot doucement.", "Pense à ce qui passe vite et à ce qui prend beaucoup de jours.", hint],
    };
  });
}

/** « Mets ces durées du plus court au plus long. » : trois durées, quatre, puis les cinq. */
export function makeDurationOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "duree-ordre",
    () => {
      const count = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
      const picks = shuffle(ctx.rng, range(DURATIONS.length))
        .slice(0, count)
        .sort((a, b) => a - b);
      const reverse = ctx.level >= 2 && ctx.rng() < 0.5;
      const sequence = (reverse ? [...picks].reverse() : picks).map(duration);
      return {
        type: "order",
        prompt: reverse ? "Mets ces durées du plus long au plus court." : "Mets ces durées du plus court au plus long.",
        payload: { correctSequence: sequence, game: originOf("duree-ordre", ctx), concept: "ranger des durées" },
        answerKey: sequence.join(", "),
        hints: [
          "Lis chaque mot doucement.",
          "Pense à ce qui passe vite et à ce qui prend beaucoup de jours.",
          reverse ? "Place d'abord celle qui dure le plus longtemps." : "Place d'abord celle qui dure le moins longtemps.",
        ],
      };
    },
    sortedOptions,
  );
}

/** Les équivalences du calendrier : chaque durée et ce qu'elle contient. */
export const CONVERSIONS: readonly { left: string; right: string; text: string; wrong: readonly string[] }[] = [
  { left: "semaine", right: "7 jours", text: "Une semaine dure 7 ___.", wrong: ["mois", "heures"] },
  { left: "année", right: "12 mois", text: "Une année dure 12 ___.", wrong: ["jours", "semaines"] },
  { left: "jour", right: "24 heures", text: "Un jour dure 24 ___.", wrong: ["minutes", "mois"] },
  { left: "heure", right: "60 minutes", text: "Une heure dure 60 ___.", wrong: ["heures", "jours"] },
];

/** « Relie chaque durée au bon nombre. » : trois équivalences sur quatre. */
export function makeDurationLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "duree-relier",
    () => {
      const chosen = shuffle(ctx.rng, CONVERSIONS).slice(0, 3);
      const pairs = chosen.map((c) => ({ left: c.left, right: c.right }));
      return {
        type: "match",
        prompt: "Relie chaque durée au bon nombre.",
        payload: { pairs, game: originOf("duree-relier", ctx), concept: "ce que contient une durée" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: ["Dis les mots doucement.", "Pense à ce qu'on compte dans chaque durée.", "Commence par la paire dont tu es le plus sûr."],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((p) => p.left)
        .sort()
        .join(","),
  );
}

export const ZONE_SHORTER = "Plus court";
export const ZONE_LONGER = "Plus long";

/** « Glisse chaque durée dans sa case, plus court ou plus long qu'une semaine. » : trois durées, quatre ensuite. */
export function makeDurationSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "duree-glisser",
    () => {
      const ref = pick(ctx.rng, [1, 2, 3]);
      const shorter = range(ref);
      const longer = range(DURATIONS.length - ref - 1).map((i) => ref + 1 + i);
      const total = ctx.level === 1 ? 3 : 4;
      const chosen = new Set<number>([pick(ctx.rng, shorter), pick(ctx.rng, longer)]);
      for (const i of shuffle(ctx.rng, [...shorter, ...longer])) {
        if (chosen.size >= total) break;
        chosen.add(i);
      }
      const items = shuffle(
        ctx.rng,
        [...chosen].map((i) => ({ text: duration(i), correctZone: i < ref ? ZONE_SHORTER : ZONE_LONGER })),
      );
      return {
        type: "drag-drop",
        prompt: `Glisse chaque durée dans sa case, plus court ou plus long ${thanOf(ref)}.`,
        payload: {
          zones: [ZONE_SHORTER, ZONE_LONGER],
          items,
          game: originOf("duree-glisser", ctx),
          concept: "plus court et plus long qu'une durée",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis chaque mot doucement.",
          "Une durée qui passe plus vite que celle de la phrase va dans la case du plus court.",
          "Une durée qui prend plus de temps va dans l'autre case.",
        ],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Une semaine dure 7 ___. » : le mot qui dit ce qu'on compte, parmi trois. */
export function makeDurationUnits(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "duree-unites", () => {
    const entry = pickFresh(ctx, CONVERSIONS, (c) => `duree-unites-texte:${c.text}`);
    const answer = entry.right.split(" ")[1];
    const options = shuffle(ctx.rng, [answer, ...entry.wrong]);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: {
        text: entry.text,
        blanks: [{ options, answer }],
        game: originOf("duree-unites", ctx),
        concept: "ce que contient une durée",
      },
      answerKey: answer,
      hints: ["Lis la phrase en entier, doucement.", "Pense à ce qu'on compte dans cette durée.", "Choisis le mot qui rend la phrase vraie."],
    };
  });
}

// ===========================================================================
// LES FRÉQUENCES : TOUS LES JOURS, CHAQUE SEMAINE, CHAQUE ANNÉE
// ===========================================================================

export const ZONE_DAILY = "Tous les jours";
export const ZONE_WEEKLY = "Chaque semaine";
export const ZONE_YEARLY = "Chaque année";

type Frequency = "daily" | "weekly" | "yearly";
const ZONE_OF: Record<Frequency, string> = { daily: ZONE_DAILY, weekly: ZONE_WEEKLY, yearly: ZONE_YEARLY };
const FREQUENCY_ZONES = [ZONE_DAILY, ZONE_WEEKLY, ZONE_YEARLY];

type EventEntry = {
  tile: string;
  freq: Frequency;
  /** La question qui n'a que cette fréquence pour réponse. */
  ask: string;
  /** La phrase à trou et ses deux mauvais choix. */
  gap: { text: string; answer: string; wrong: readonly [string, string] };
};

/** Les moments de la fiche : un seul rythme chacun. */
export const EVENTS: readonly EventEntry[] = [
  {
    tile: "Aller à l'école",
    freq: "daily",
    ask: "Quand va-t-on à l'école ?",
    gap: { text: "On va à l'école tous les ___.", answer: "jours", wrong: ["mois", "ans"] },
  },
  {
    tile: "Jour de marché",
    freq: "weekly",
    ask: "Quand revient le jour de marché ?",
    gap: { text: "Le jour de marché revient chaque ___.", answer: "semaine", wrong: ["année", "jour"] },
  },
  {
    tile: "Anniversaire",
    freq: "yearly",
    ask: "Quand revient ton anniversaire ?",
    gap: { text: "Mon anniversaire revient chaque ___.", answer: "année", wrong: ["semaine", "jour"] },
  },
  {
    tile: "Tabaski",
    freq: "yearly",
    ask: "Quand revient la Tabaski ?",
    gap: { text: "La Tabaski revient chaque ___.", answer: "année", wrong: ["semaine", "jour"] },
  },
  {
    tile: "Korité",
    freq: "yearly",
    ask: "Quand revient la Korité ?",
    gap: { text: "La Korité revient chaque ___.", answer: "année", wrong: ["semaine", "jour"] },
  },
  {
    tile: "Noël",
    freq: "yearly",
    ask: "Quand revient Noël ?",
    gap: { text: "Noël revient chaque ___.", answer: "année", wrong: ["semaine", "jour"] },
  },
  {
    tile: "Indépendance",
    freq: "yearly",
    ask: "Quand revient la fête de l'indépendance ?",
    gap: { text: "La fête de l'indépendance revient chaque ___.", answer: "année", wrong: ["semaine", "jour"] },
  },
];

const DAILY = EVENTS.filter((e) => e.freq === "daily");
const WEEKLY = EVENTS.filter((e) => e.freq === "weekly");
const YEARLY = EVENTS.filter((e) => e.freq === "yearly");

const FREQUENCY_HINTS = [
  "Pense à combien de fois cela revient.",
  "Plus cela revient souvent, plus le temps entre deux fois est court.",
  "Cherche ce qui revient le plus souvent, puis ce qui revient le plus rarement.",
];

/** « Glisse chaque moment dans sa case, tous les jours, chaque semaine ou chaque année. » : trois moments, quatre, puis cinq. */
export function makeFrequencySort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "frequence-glisser",
    () => {
      const yearlyCount = ctx.level === 1 ? 1 : ctx.level === 2 ? 2 : 3;
      const chosen = [...DAILY, ...WEEKLY, ...shuffle(ctx.rng, YEARLY).slice(0, yearlyCount)];
      const items = shuffle(
        ctx.rng,
        chosen.map((e) => ({ text: e.tile, correctZone: ZONE_OF[e.freq] })),
      );
      return {
        type: "drag-drop",
        prompt: "Glisse chaque moment dans sa case, tous les jours, chaque semaine ou chaque année.",
        payload: { zones: FREQUENCY_ZONES, items, game: originOf("frequence-glisser", ctx), concept: "ce qui revient souvent ou rarement" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [...FREQUENCY_HINTS],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Quand revient la Tabaski ? » : les trois rythmes de la fiche, un seul va. */
export function makeFrequencyPick(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "frequence-qcm", () => {
    const entry = pickFresh(ctx, EVENTS, (e) => `frequence-qcm-moment:${e.tile}`);
    const options = shuffle(ctx.rng, FREQUENCY_ZONES);
    const answer = ZONE_OF[entry.freq];
    return {
      type: "qcm",
      prompt: entry.ask,
      payload: { options, correctIndex: options.indexOf(answer), game: originOf("frequence-qcm", ctx), concept: "ce qui revient souvent ou rarement" },
      answerKey: answer,
      hints: [...FREQUENCY_HINTS],
    };
  });
}

/** « La Tabaski revient chaque ___. » : semaine, année ou jour, un seul mot va. */
export function makeFrequencyBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "frequence-trou", () => {
    const entry = pickFresh(ctx, EVENTS, (e) => `frequence-trou-moment:${e.tile}`);
    const options = shuffle(ctx.rng, [entry.gap.answer, ...entry.gap.wrong]);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: {
        text: entry.gap.text,
        blanks: [{ options, answer: entry.gap.answer }],
        game: originOf("frequence-trou", ctx),
        concept: "ce qui revient souvent ou rarement",
      },
      answerKey: entry.gap.answer,
      hints: ["Lis la phrase en entier, doucement.", "Pense à combien de fois cela revient.", "Choisis le mot qui rend la phrase vraie."],
    };
  });
}

/** « Relie chaque moment à sa fréquence. » : un moment de chaque rythme. */
export function makeFrequencyLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "frequence-relier",
    () => {
      const yearly = pickFresh(ctx, YEARLY, (e) => `frequence-relier-annuel:${e.tile}`);
      const pairs = shuffle(ctx.rng, [DAILY[0], WEEKLY[0], yearly]).map((e) => ({ left: e.tile, right: ZONE_OF[e.freq] }));
      return {
        type: "match",
        prompt: "Relie chaque moment à sa fréquence.",
        payload: { pairs, game: originOf("frequence-relier", ctx), concept: "ce qui revient souvent ou rarement" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: [...FREQUENCY_HINTS],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((p) => p.left)
        .sort()
        .join(","),
  );
}

/** « Mets ces moments du plus souvent au moins souvent. » : tous les jours, chaque semaine, chaque année. */
export function makeFrequencyOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "frequence-ordre",
    () => {
      const yearly = pickFresh(ctx, YEARLY, (e) => `frequence-ordre-annuel:${e.tile}`);
      const sequence = [DAILY[0].tile, WEEKLY[0].tile, yearly.tile];
      return {
        type: "order",
        prompt: "Mets ces moments du plus souvent au moins souvent.",
        payload: { correctSequence: sequence, game: originOf("frequence-ordre", ctx), concept: "ranger ce qui revient souvent ou rarement" },
        answerKey: sequence.join(", "),
        hints: [...FREQUENCY_HINTS],
      };
    },
    sortedOptions,
  );
}

// ===========================================================================
// L'EMPLOI DU TEMPS
// ===========================================================================

/** Les cours que le gabarit écrit dans l'emploi du temps : un mot chacun. */
export const COURSES = ["lecture", "écriture", "maths", "dessin", "chant", "sport"] as const;

type Slot = { hour: number; label: string; recess: boolean };

/** Une journée de cours : la récréation n'est ni la première ni la dernière, les cours sont tous différents. */
function drawDay(ctx: GameContext, slots: number): { slots: Slot[]; recess: number } {
  const recess = randomInt(ctx.rng, 1, slots - 2);
  const courses = shuffle(ctx.rng, COURSES);
  let next = 0;
  const rows = Array.from({ length: slots }, (_, i): Slot => {
    if (i === recess) return { hour: 8 + i, label: "récréation", recess: true };
    return { hour: 8 + i, label: courses[next++], recess: false };
  });
  return { slots: rows, recess };
}

const lineOf = (slot: Slot) => `${slot.hour} h ${cap(slot.label)}`;
const tableOf = (slots: readonly Slot[]) => slots.map(lineOf).join("\n");
const HEADER = "Regarde l'emploi du temps.";

/** « Quel cours vient juste après la récréation ? » : le cours voisin, lu dans l'emploi du temps écrit dans l'énoncé. */
export function makeTimetableNeighbour(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "edt-apres", () => {
    const { slots, recess } = drawDay(ctx, ctx.level === 1 ? 4 : 5);
    const after = ctx.level === 1 || ctx.rng() < 0.5;
    const answer = slots[recess + (after ? 1 : -1)].label;
    const wrong = shuffle(
      ctx.rng,
      slots.filter((s) => !s.recess && s.label !== answer).map((s) => s.label),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]);
    return {
      type: "qcm",
      prompt: `${HEADER}\n${tableOf(slots)}\nQuel cours vient juste ${after ? "après" : "avant"} la récréation ?`,
      payload: { options, correctIndex: options.indexOf(answer), game: originOf("edt-apres", ctx), concept: "lire un emploi du temps" },
      answerKey: answer,
      hints: [
        "Lis l'emploi du temps de haut en bas, ligne après ligne.",
        "Cherche la ligne de la récréation.",
        after ? "Le bon cours est écrit sur la ligne juste en dessous." : "Le bon cours est écrit sur la ligne juste au-dessus.",
      ],
    };
  });
}

/** « À quelle heure commence la récréation ? » ou « …le cours de dessin ? » : l'heure écrite devant la ligne. */
export function makeTimetableHour(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "edt-quand", () => {
    const { slots } = drawDay(ctx, ctx.level === 1 ? 4 : 5);
    const target = pick(ctx.rng, slots);
    const what = target.recess ? "la récréation" : `le cours de ${target.label}`;
    const wrong = shuffle(
      ctx.rng,
      slots.filter((s) => s.hour !== target.hour).map((s) => `${s.hour} h`),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [`${target.hour} h`, ...wrong]);
    return {
      type: "qcm",
      prompt: `${HEADER}\n${tableOf(slots)}\nÀ quelle heure commence ${what} ?`,
      payload: { options, correctIndex: options.indexOf(`${target.hour} h`), game: originOf("edt-quand", ctx), concept: "lire l'heure dans un emploi du temps" },
      answerKey: `${target.hour} h`,
      hints: [
        "Lis l'emploi du temps de haut en bas, ligne après ligne.",
        "Cherche la ligne dont parle la question.",
        "L'heure est écrite au début de cette ligne.",
      ],
    };
  });
}

/** « Mets ces cours du premier au dernier. » : les cours de la journée, dans l'ordre où l'emploi du temps les écrit. */
export function makeTimetableOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "edt-ordre",
    () => {
      const { slots } = drawDay(ctx, ctx.level === 1 ? 4 : 5);
      const courses = slots.filter((s) => !s.recess).map((s) => s.label);
      const count = ctx.level === 1 ? 3 : 4;
      // Trois ou quatre cours de la journée, gardés dans leur ordre d'emploi du temps.
      const kept = new Set(shuffle(ctx.rng, courses).slice(0, count));
      const inOrder = courses.filter((c) => kept.has(c));
      const reverse = ctx.level >= 2 && ctx.rng() < 0.5;
      const sequence = reverse ? [...inOrder].reverse() : inOrder;
      return {
        type: "order",
        prompt: `${HEADER}\n${tableOf(slots)}\n${reverse ? "Mets ces cours du dernier au premier." : "Mets ces cours du premier au dernier."}`,
        payload: { correctSequence: sequence, game: originOf("edt-ordre", ctx), concept: "ranger les cours d'une journée" },
        answerKey: sequence.join(", "),
        hints: [
          "Lis l'emploi du temps de haut en bas, ligne après ligne.",
          reverse ? "Le dernier cours est écrit tout en bas." : "Le premier cours est écrit tout en haut.",
          "Cherche chaque cours dans l'emploi du temps, un par un.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Après la récréation, il y a le cours de ___. » : le cours voisin, parmi trois cours de l'emploi du temps. */
export function makeTimetableBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "edt-trou", () => {
    const { slots, recess } = drawDay(ctx, ctx.level === 1 ? 4 : 5);
    const after = ctx.level === 1 || ctx.rng() < 0.5;
    const answer = slots[recess + (after ? 1 : -1)].label;
    const wrong = shuffle(
      ctx.rng,
      slots.filter((s) => !s.recess && s.label !== answer).map((s) => s.label),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]);
    return {
      type: "fill-blank",
      prompt: `${HEADER}\n${tableOf(slots)}\nComplète la phrase.`,
      payload: {
        text: `${after ? "Après" : "Avant"} la récréation, il y a le cours de ___.`,
        blanks: [{ options, answer }],
        game: originOf("edt-trou", ctx),
        concept: "lire un emploi du temps",
      },
      answerKey: answer,
      hints: [
        "Lis l'emploi du temps de haut en bas, ligne après ligne.",
        "Cherche la ligne de la récréation.",
        after ? "Le bon cours est écrit sur la ligne juste en dessous." : "Le bon cours est écrit sur la ligne juste au-dessus.",
      ],
    };
  });
}

/** « Quel cours a-t-on le mardi ? » ou « Quel jour a-t-on dessin ? » : un emploi du temps de la semaine, un cours par jour d'école. */
export function makeWeekTimetable(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "edt-semaine", () => {
    const courses = shuffle(ctx.rng, COURSES).slice(0, SCHOOL_DAYS.length);
    const rows = SCHOOL_DAYS.map((day, i) => ({ day: day as string, course: courses[i] as string }));
    const byCourse = ctx.level === 1 || ctx.rng() < 0.5;
    const target = pick(ctx.rng, rows);
    const pool = byCourse ? rows.map((r) => r.course) : rows.map((r) => r.day);
    const answer = byCourse ? target.course : target.day;
    const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, pool.filter((p) => p !== answer)).slice(0, 2)]);
    return {
      type: "qcm",
      prompt: `Voici l'emploi du temps de la semaine.\n${rows.map((r) => `${cap(r.day)} ${cap(r.course)}`).join("\n")}\n${
        byCourse ? `Quel cours a-t-on le ${target.day} ?` : `Quel jour a-t-on ${target.course} ?`
      }`,
      payload: { options, correctIndex: options.indexOf(answer), game: originOf("edt-semaine", ctx), concept: "lire l'emploi du temps de la semaine" },
      answerKey: answer,
      hints: [
        "Lis l'emploi du temps de haut en bas, ligne après ligne.",
        "Chaque ligne dit un jour et un cours.",
        byCourse ? "Cherche la ligne du jour de la question." : "Cherche la ligne du cours de la question.",
      ],
    };
  });
}
