/**
 * LES GABARITS DU TEMPS : les jours de la semaine, hier et demain, les moments de la journée, ce
 * qui vient avant et après. Pour l'enfant de CI qui apprend à se repérer dans le temps (histoire,
 * étape 1 : `hi-ci-semaine`, `hi-ci-hier-demain`, `hi-ci-journee`, `hi-ci-ordre`).
 *
 * Le modèle écrivait « Mets ces actions dans l'ordre : saluer, s'excuser, remercier » (aucun ordre
 * n'est le bon), « Aujourd'hui, je vais ___ à l'école » (aller, manger et jouer vont aussi),
 * « Quelle étape vient après se réveiller ? » (le petit-déjeuner aussi), trois jours rangés dans la
 * même case. Ici chaque question s'appuie sur un ordre qui ne se discute pas : les sept jours dans
 * l'ordre de la semaine, les cinq moments dans l'ordre de la journée, un cycle de croissance
 * (l'œuf, le poussin, la poule), le repas qui suit le réveil. Les mauvais choix ne peuvent pas être
 * une deuxième bonne réponse.
 *
 * RÈGLES POUR AJOUTER UNE ACTIVITÉ, UN MOMENT, UN CYCLE
 * - Un ordre que tout le monde admet : on ne déjeune pas avant de se réveiller. Pas de « se laver »
 *   avant ou après le petit-déjeuner : cela dépend de la maison.
 * - Un émoji ancien (Unicode 11 au plus, sans sélecteur de variation) pour chaque activité.
 * - Les noms de choses d'une tuile viennent du catalogue d'images (`lib/item-images.ts`) : un test
 *   (`templatePictures.test.ts`) refuse une tuile « le + un nom » sans image au CI.
 * - Jamais jeudi ni samedi comme jour d'école ou de repos : selon l'école, la demi-journée libre
 *   n'est pas la même. Seuls lundi, mardi, mercredi et vendredi sont des jours d'école, seul
 *   dimanche est un jour de repos.
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une
 * apostrophe droite, et vingt mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, type GameContext, type GeneratedGame } from "./shared";
import { DAYS } from "./things";
import { levelGroup, pickForLevel } from "./tableaux";

type Day = (typeof DAYS)[number];

/** Les jours d'école et le jour de repos qui ne se discutent pas. */
export const SCHOOL_DAYS: readonly Day[] = ["lundi", "mardi", "mercredi", "vendredi"];
export const REST_DAY: Day = "dimanche";

export const ZONE_SCHOOL = "Jour d'école";
export const ZONE_REST = "Jour de repos";

/** Les prénoms des petites histoires : sans apostrophe, jamais deux fois le même dans un palier. */
const NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"] as const;

// ===========================================================================
// LES MOMENTS ET LES ACTIVITÉS D'UNE JOURNÉE
// ===========================================================================

export type MomentName = "matin" | "midi" | "apres-midi" | "soir" | "nuit";

/** Les cinq moments, dans l'ordre de la journée : de quoi dire ce qui vient juste avant ou après. */
export const DAY_MOMENTS: readonly { name: MomentName; label: string }[] = [
  { name: "matin", label: "le matin" },
  { name: "midi", label: "midi" },
  { name: "apres-midi", label: "l'après-midi" },
  { name: "soir", label: "le soir" },
  { name: "nuit", label: "la nuit" },
];

const momentLabel = (name: MomentName) => (DAY_MOMENTS.find((moment) => moment.name === name) as (typeof DAY_MOMENTS)[number]).label;
/** Le libellé d'une case : la même chose avec une majuscule (« Le matin », « Midi »). */
const zoneLabel = (name: MomentName) => {
  const label = momentLabel(name);
  return `${label[0].toUpperCase()}${label.slice(1)}`;
};

type Activity = {
  /** Ce que l'enfant fait, à l'infinitif. */
  text: string;
  emoji: string;
  moment: MomentName;
  /** La question qui n'a que ce moment pour réponse. */
  ask: string;
  /** Les moments qu'on ne propose jamais comme mauvais choix : ils iraient aussi. */
  avoid: readonly MomentName[];
};

/**
 * Les activités, dans l'ordre de la journée : on ne prend pas le petit-déjeuner avant de se
 * réveiller, on ne dîne pas avant de déjeuner. « Aller à l'école » n'y est pas : on y va le matin
 * comme l'après-midi. Chaque émoji est différent : deux étiquettes au même dessin se confondraient.
 */
export const ACTIVITIES: readonly Activity[] = [
  { text: "se réveiller", emoji: "⏰", moment: "matin", ask: "Quand se lève-t-on ?", avoid: [] },
  { text: "prendre le petit-déjeuner", emoji: "🍞", moment: "matin", ask: "Quand prend-on le petit-déjeuner ?", avoid: [] },
  { text: "déjeuner", emoji: "🍚", moment: "midi", ask: "Quand déjeune-t-on ?", avoid: ["apres-midi"] },
  { text: "faire la sieste", emoji: "😴", moment: "apres-midi", ask: "Quand fait-on la sieste ?", avoid: ["midi"] },
  { text: "dîner", emoji: "🍜", moment: "soir", ask: "Quand dîne-t-on ?", avoid: ["nuit"] },
  { text: "dormir", emoji: "🌙", moment: "nuit", ask: "Quand dort-on dans son lit ?", avoid: ["soir", "apres-midi"] },
];

const activityTile = (activity: Activity) => `${activity.emoji} ${activity.text}`;

const isEveningOrNight = (name: MomentName) => name === "soir" || name === "nuit";

// ===========================================================================
// LES JOURS DE LA SEMAINE
// ===========================================================================

/** « Mets ces jours dans l'ordre de la semaine. » : trois jours qui se suivent, quatre ensuite, espacés au dernier palier. */
export function makeWeekOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "jours-ordre",
    () => {
      const count = ctx.level === 1 ? 3 : 4;
      let indexes: number[];
      if (ctx.level >= 3) {
        indexes = shuffle(
          ctx.rng,
          DAYS.map((_, i) => i),
        )
          .slice(0, count)
          .sort((a, b) => a - b);
      } else {
        const start = randomInt(ctx.rng, 0, DAYS.length - count);
        indexes = Array.from({ length: count }, (_, i) => start + i);
      }
      const sequence = indexes.map((i) => DAYS[i]);
      return {
        type: "order",
        prompt: "Mets ces jours dans l'ordre de la semaine.",
        payload: {
          correctSequence: sequence,
          game: originOf("jours-ordre", ctx),
          concept: "ranger les jours de la semaine",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Récite les jours de la semaine, du premier au dernier.",
          "Cherche celui que tu dis en premier, et place-le au début.",
          "Place ensuite celui qui vient après, puis le suivant.",
        ],
      };
    },
    sortedOptions,
  );
}

/** « lundi, ___, mercredi. » : le jour qui manque dans une suite de jours qui se suivent. */
export function makeMissingDay(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "jour-manquant", () => {
    const length = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
    const start = randomInt(ctx.rng, 0, DAYS.length - length);
    const run = Array.from({ length }, (_, i) => DAYS[start + i]);
    // Le trou est au milieu au premier palier, n'importe où ensuite.
    const hole = ctx.level === 1 ? 1 : randomInt(ctx.rng, 0, length - 1);
    const answer = run[hole];
    // Les mauvais choix sont des jours qui ne sont pas dans la suite : aucun ne la complète.
    const outside = DAYS.filter((day) => !run.includes(day));
    const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, outside).slice(0, 2)]);
    const text = `${run.map((day, i) => (i === hole ? "___" : day)).join(", ")}.`;
    return {
      type: "fill-blank",
      prompt: "Complète les jours de la semaine.",
      payload: {
        text,
        blanks: [{ options, answer }],
        game: originOf("jour-manquant", ctx),
        concept: "les jours de la semaine dans l'ordre",
      },
      answerKey: answer,
      hints: [
        "Récite les jours de la semaine dans l'ordre, en commençant par le premier de la suite.",
        "Dis le jour qui vient juste avant le trou.",
        "Le jour qui manque est celui que tu dis juste après lui.",
      ],
    };
  });
}

/** « Glisse chaque jour dans sa case, jour d'école ou jour de repos. » : dimanche est toujours là, jamais jeudi ni samedi. */
export function makeSchoolOrRest(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "jour-ecole-repos",
    () => {
      const schoolCount = ctx.level === 1 ? 2 : ctx.level === 2 ? 3 : 4;
      const school = shuffle(ctx.rng, SCHOOL_DAYS).slice(0, schoolCount);
      const items = shuffle(ctx.rng, [
        ...school.map((day) => ({ text: day as string, correctZone: ZONE_SCHOOL })),
        { text: REST_DAY as string, correctZone: ZONE_REST },
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque jour dans sa case, jour d'école ou jour de repos.",
        payload: {
          zones: [ZONE_SCHOOL, ZONE_REST],
          items,
          game: originOf("jour-ecole-repos", ctx),
          concept: "les jours de classe et le jour de repos",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Pense à la semaine d'un enfant qui va en classe.",
          "Un seul de ces jours est sans classe.",
          "Les autres jours, tu retrouves ta maîtresse ou ton maître.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

const ORDINALS: readonly (readonly [string, number])[] = [
  ["premier", 0],
  ["deuxième", 1],
  ["troisième", 2],
  ["quatrième", 3],
  ["cinquième", 4],
  ["dernier", 6],
];

/** Les rangs (places de `ORDINALS`) que chaque groupe de niveaux demande : jamais deux paliers sur le même. */
const RANK_WINDOWS: readonly (readonly number[])[] = [
  [0, 5],
  [1, 2],
  [3, 4],
];

/** « Quel est le troisième jour de la semaine ? » : le rang d'un jour, du lundi au dimanche. */
export function makeDayRank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "jour-rang", () => {
    // Chaque palier a ses deux rangs : le premier et le dernier jour d'abord, puis le deuxième et le troisième, enfin le quatrième
    // et le cinquième. Trois paliers ne posent ainsi jamais la même question.
    const asks = RANK_WINDOWS[levelGroup(ctx.level)].map((rank) => ORDINALS[rank]);
    // Deux questions dans un même palier ne sont jamais la même : on épuise les rangs avant d'en reprendre un.
    const [word, index] = pickFresh(ctx, asks, ([rank]) => `jour-rang-rang:${rank}`);
    const answer = DAYS[index];
    const wrong = shuffle(
      ctx.rng,
      DAYS.filter((day) => day !== answer),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]);
    return {
      type: "qcm",
      prompt: `Quel est le ${word} jour de la semaine ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer),
        game: originOf("jour-rang", ctx),
        concept: "le rang d'un jour dans la semaine",
      },
      answerKey: answer,
      // Aucun indice ne nomme un jour : « commence le lundi » serait la réponse à « premier ».
      hints: [
        "Récite les jours de la semaine dans l'ordre.",
        "Compte sur tes doigts, un doigt par jour.",
        word === "premier"
          ? "Le premier jour est celui par lequel la semaine commence."
          : word === "dernier"
            ? "Le dernier jour est celui où la semaine se termine."
            : "Arrête-toi au rang que la question demande.",
      ],
    };
  });
}

/** « Relie chaque jour au jour qui vient juste après. » : trois paires, jamais un jour des deux côtés. */
export function makeDayLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "jours-relier",
    () => {
      const after = ctx.level < 3 || ctx.rng() < 0.5;
      // Trois jours espacés d'au moins deux crans : le jour d'après de l'un n'est jamais un des jours donnés.
      let lefts: number[] = [];
      for (let attempt = 0; attempt < 80; attempt++) {
        const picks = shuffle(
          ctx.rng,
          DAYS.map((_, i) => i).filter((i) => (after ? i <= 5 : i >= 1)),
        )
          .slice(0, 3)
          .sort((a, b) => a - b);
        if (picks.length === 3 && picks[1] - picks[0] >= 2 && picks[2] - picks[1] >= 2) {
          lefts = picks;
          break;
        }
      }
      if (lefts.length < 3) lefts = after ? [0, 2, 4] : [2, 4, 6];
      const pairs = lefts.map((i) => ({ left: DAYS[i] as string, right: DAYS[i + (after ? 1 : -1)] as string }));
      return {
        type: "match",
        prompt: after ? "Relie chaque jour au jour qui vient juste après." : "Relie chaque jour au jour qui vient juste avant.",
        payload: { pairs, game: originOf("jours-relier", ctx), concept: "le jour d'avant et le jour d'après" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: [
          "Récite les jours de la semaine dans l'ordre.",
          after ? "Dis un jour, puis celui que tu dis juste après lui." : "Dis un jour, puis celui que tu disais juste avant lui.",
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

// ===========================================================================
// HIER, AUJOURD'HUI, DEMAIN
// ===========================================================================

/**
 * « Nous sommes mardi. Quel jour sera demain ? » : demain d'abord, hier ensuite, et au dernier palier
 * le chemin inverse (« Hier, c'était jeudi. Quel jour sommes-nous ? »). Le jour de la question n'est
 * jamais un mauvais choix : l'enfant le choisirait en reconnaissant le mot.
 */
export function makeRelativeDay(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "jour-relatif", () => {
    const today = randomInt(ctx.rng, 0, DAYS.length - 1);
    const variants =
      ctx.level === 1
        ? (["demain"] as const)
        : ctx.level === 2
          ? (["demain", "hier"] as const)
          : (["demain", "hier", "inverse-hier", "inverse-demain"] as const);
    const variant = pick(ctx.rng, variants);
    const next = (today + 1) % DAYS.length;
    const before = (today + DAYS.length - 1) % DAYS.length;
    let prompt: string;
    let answer: number;
    let cited: number;
    let trap: number;
    if (variant === "demain") {
      prompt = `Nous sommes ${DAYS[today]}. Quel jour sera demain ?`;
      [answer, cited, trap] = [next, today, before];
    } else if (variant === "hier") {
      prompt = `Nous sommes ${DAYS[today]}. Quel jour était hier ?`;
      [answer, cited, trap] = [before, today, next];
    } else if (variant === "inverse-hier") {
      // « Hier, c'était jeudi » : on est vendredi, et le piège est le jour d'avant le jour cité.
      prompt = `Hier, c'était ${DAYS[before]}. Quel jour sommes-nous ?`;
      [answer, cited, trap] = [today, before, (before + DAYS.length - 1) % DAYS.length];
    } else {
      prompt = `Demain, ce sera ${DAYS[next]}. Quel jour sommes-nous ?`;
      [answer, cited, trap] = [today, next, (next + 1) % DAYS.length];
    }
    const others = shuffle(
      ctx.rng,
      DAYS.map((_, i) => i).filter((i) => i !== answer && i !== cited && i !== trap),
    );
    const options = shuffle(ctx.rng, [answer, trap, others[0]]).map((i) => DAYS[i] as string);
    return {
      type: "qcm",
      prompt,
      payload: {
        options,
        correctIndex: options.indexOf(DAYS[answer]),
        game: originOf("jour-relatif", ctx),
        concept: "hier, aujourd'hui et demain",
      },
      answerKey: DAYS[answer],
      hints: [
        "Récite les jours de la semaine dans l'ordre.",
        variant === "demain" || variant === "inverse-hier"
          ? "Pour savoir ce qui vient après, avance d'un pas dans la semaine."
          : "Pour savoir ce qui vient avant, recule d'un pas dans la semaine.",
        "Hier est le jour d'avant, demain est le jour d'après.",
      ],
    };
  });
}

const ZONE_YESTERDAY = "Hier";
const ZONE_TODAY = "Aujourd'hui";
const ZONE_TOMORROW = "Demain";

/** « Nous sommes jeudi. Glisse chaque jour dans la bonne case. » : mercredi est hier, jeudi aujourd'hui, vendredi demain. */
export function makeDayZones(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "jour-hier-demain",
    () => {
      const today = randomInt(ctx.rng, 0, DAYS.length - 1);
      const before = (today + DAYS.length - 1) % DAYS.length;
      const next = (today + 1) % DAYS.length;
      const items = shuffle(ctx.rng, [
        { text: DAYS[before] as string, correctZone: ZONE_YESTERDAY },
        { text: DAYS[today] as string, correctZone: ZONE_TODAY },
        { text: DAYS[next] as string, correctZone: ZONE_TOMORROW },
      ]);
      return {
        type: "drag-drop",
        prompt: `Nous sommes ${DAYS[today]}. Glisse chaque jour dans la bonne case.`,
        payload: {
          zones: [ZONE_YESTERDAY, ZONE_TODAY, ZONE_TOMORROW],
          items,
          game: originOf("jour-hier-demain", ctx),
          concept: "hier, aujourd'hui et demain",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Cherche d'abord le jour dont parle la phrase.",
          "Le jour qui vient juste avant lui a déjà passé.",
          "Le jour qui vient juste après lui n'est pas encore là.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Nous sommes mardi. Hier, c'était ___. » : un jour à choisir parmi trois, jamais celui qui est cité. */
export function makeRelativeBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "jour-trou", () => {
    const today = randomInt(ctx.rng, 0, DAYS.length - 1);
    const next = (today + 1) % DAYS.length;
    const before = (today + DAYS.length - 1) % DAYS.length;
    const variants = ctx.level === 1 ? (["hier", "demain"] as const) : (["hier", "demain", "inverse"] as const);
    const variant = pick(ctx.rng, variants);
    let text: string;
    let answer: number;
    let cited: number;
    if (variant === "hier") {
      text = `Nous sommes ${DAYS[today]}. Hier, c'était ___.`;
      [answer, cited] = [before, today];
    } else if (variant === "demain") {
      text = `Nous sommes ${DAYS[today]}. Demain, ce sera ___.`;
      [answer, cited] = [next, today];
    } else {
      text = `Hier, c'était ${DAYS[before]}. Aujourd'hui, nous sommes ___.`;
      [answer, cited] = [today, before];
    }
    const wrong = shuffle(
      ctx.rng,
      DAYS.map((_, i) => i).filter((i) => i !== answer && i !== cited),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]).map((i) => DAYS[i] as string);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: {
        text,
        blanks: [{ options, answer: DAYS[answer] }],
        game: originOf("jour-trou", ctx),
        concept: "hier, aujourd'hui et demain",
      },
      answerKey: DAYS[answer],
      hints: [
        "Lis la phrase en entier, doucement.",
        "Récite les jours de la semaine dans l'ordre, en t'arrêtant sur le jour de la phrase.",
        "Avance ou recule d'un seul pas.",
      ],
    };
  });
}

/** Les suites de mots du temps : chacune a un seul ordre, du plus tôt au plus tard. */
const TIME_WORDS: readonly (readonly string[])[] = [
  ["hier", "aujourd'hui", "demain"],
  ["avant", "maintenant", "après"],
  ["hier", "maintenant", "demain"],
];

/** « Mets ces mots dans l'ordre du temps. » : hier, aujourd'hui, demain ; avant, maintenant, après. */
export function makeTimeWords(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "temps-ordre",
    () => {
      // Les deux premières suites au premier palier : deux ordres dans un même palier ne sont jamais la même suite.
      const sets = ctx.level === 1 ? TIME_WORDS.slice(0, 2) : TIME_WORDS;
      const sequence = [...pickFresh(ctx, sets, (set) => `temps-ordre-mots:${set.join()}`)];
      return {
        type: "order",
        prompt: "Mets ces mots dans l'ordre du temps.",
        payload: {
          correctSequence: sequence,
          game: originOf("temps-ordre", ctx),
          concept: "avant, maintenant, après",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Pense à ce qui est déjà passé, à ce qui se passe, à ce qui va venir.",
          "Commence par ce qui s'est passé en premier.",
          "Finis par ce qui n'est pas encore arrivé.",
        ],
      };
    },
    sortedOptions,
  );
}

// ===========================================================================
// LES MOMENTS DE LA JOURNÉE
// ===========================================================================

/** « Quand dîne-t-on ? » : l'activité n'a qu'un moment, les mauvais choix ne vont pas avec elle. */
export function makeActivityMoment(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "activite-moment", () => {
    // Les activités sont rangées dans l'ordre de la journée : le premier palier prend le matin, le deuxième le milieu de la journée, le dernier le soir.
    const activity = pickForLevel(ctx, ACTIVITIES, (candidate) => `activite-moment:${candidate.text}`);
    const pool = DAY_MOMENTS.filter((moment) => moment.name !== activity.moment && !activity.avoid.includes(moment.name));
    let wrong = shuffle(ctx.rng, pool).slice(0, 2);
    // Le soir et la nuit ne se proposent jamais ensemble : une fois le soleil couché, il fait noir ET c'est encore le soir.
    if (wrong.length === 2 && isEveningOrNight(wrong[0].name) && isEveningOrNight(wrong[1].name)) {
      wrong = [wrong[0], pool.find((moment) => !isEveningOrNight(moment.name)) as (typeof pool)[number]];
    }
    const options = shuffle(ctx.rng, [momentLabel(activity.moment), ...wrong.map((moment) => moment.label)]);
    return {
      type: "qcm",
      prompt: activity.ask,
      payload: {
        options,
        correctIndex: options.indexOf(momentLabel(activity.moment)),
        game: originOf("activite-moment", ctx),
        concept: "ce qu'on fait à chaque moment de la journée",
      },
      answerKey: momentLabel(activity.moment),
      hints: [
        "Pense à ta journée, du réveil jusqu'au coucher.",
        "Regarde où est le soleil quand tu fais cela.",
        "Les autres moments ne vont pas avec ce que tu fais.",
      ],
    };
  });
}

/** « Mets ces moments dans l'ordre de la journée. » : trois moments, quatre ensuite. */
export function makeMomentOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "moment-ordre",
    () => {
      const count = ctx.level === 1 ? 3 : 4;
      const picks = shuffle(
        ctx.rng,
        DAY_MOMENTS.map((_, i) => i),
      )
        .slice(0, count)
        .sort((a, b) => a - b);
      const sequence = picks.map((i) => DAY_MOMENTS[i].label);
      return {
        type: "order",
        prompt: "Mets ces moments dans l'ordre de la journée.",
        payload: {
          correctSequence: sequence,
          game: originOf("moment-ordre", ctx),
          concept: "ranger les moments de la journée",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Pense à la place du soleil dans le ciel, du lever jusqu'à la lune.",
          "Le jour commence quand le soleil se lève.",
          "Place celui qui vient en premier, puis celui qui vient juste après.",
        ],
      };
    },
    sortedOptions,
  );
}

/** « Mets ce que fait Moussa dans l'ordre de la journée. » : le réveil, les repas, la sieste, le sommeil. */
export function makeActivityOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "activite-ordre",
    () => {
      const count = ctx.level === 1 ? 3 : 4;
      const picks = shuffle(
        ctx.rng,
        ACTIVITIES.map((_, i) => i),
      )
        .slice(0, count)
        .sort((a, b) => a - b);
      const sequence = picks.map((i) => activityTile(ACTIVITIES[i]));
      const name = pickFresh(ctx, NAMES, (n) => `activite-ordre-nom:${n}`);
      return {
        type: "order",
        prompt: `Mets ce que fait ${name} dans l'ordre de la journée.`,
        payload: {
          correctSequence: sequence,
          game: originOf("activite-ordre", ctx),
          concept: "ranger les activités d'une journée",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Pense à ta propre journée, du réveil jusqu'au coucher.",
          "On ne mange pas le matin avant de s'être réveillé.",
          "Le repas du milieu de la journée vient avant celui du soir.",
        ],
      };
    },
    sortedOptions,
  );
}

/** « Quel moment vient juste après le matin ? » : le voisin dans l'ordre de la journée. */
export function makeMomentNeighbour(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "moment-voisin", () => {
    // Le moment de la question n'est jamais l'après-midi (« juste après l'après-midi » : deux apostrophes et un mot lourd).
    const references = DAY_MOMENTS.filter((moment) => moment.name !== "apres-midi");
    const reference = pick(ctx.rng, references);
    const at = DAY_MOMENTS.findIndex((moment) => moment.name === reference.name);
    const choices: ("avant" | "après")[] = [];
    if (at > 0) choices.push("avant");
    if (at < DAY_MOMENTS.length - 1) choices.push("après");
    const direction = ctx.level === 1 && choices.includes("après") ? "après" : pick(ctx.rng, choices);
    const answer = DAY_MOMENTS[at + (direction === "après" ? 1 : -1)];
    const wrong = shuffle(
      ctx.rng,
      DAY_MOMENTS.filter((moment) => moment.name !== reference.name && moment.name !== answer.name),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]).map((moment) => moment.label);
    return {
      type: "qcm",
      prompt: `Quel moment vient juste ${direction} ${reference.label} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.label),
        game: originOf("moment-voisin", ctx),
        concept: "le moment d'avant et le moment d'après",
      },
      answerKey: answer.label,
      hints: [
        "Pense aux moments de la journée, du lever du soleil jusqu'à la lune.",
        "Dis-les dans l'ordre, et arrête-toi sur celui de la question.",
        direction === "après" ? "Dis celui qui vient juste après lui." : "Dis celui que tu as dit juste avant lui.",
      ],
    };
  });
}

/** « Glisse chaque activité dans le bon moment de la journée. » : le matin a deux activités, les autres moments une. */
export function makeActivityMoments(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "activite-moments",
    () => {
      const others = shuffle(
        ctx.rng,
        DAY_MOMENTS.filter((moment) => moment.name !== "matin"),
      ).slice(0, ctx.level === 1 ? 1 : 2);
      const zones: MomentName[] = ["matin", ...others.map((moment) => moment.name)];
      // Chaque activité va dans un seul moment : le matin en a deux, chaque autre moment une.
      const items = shuffle(
        ctx.rng,
        ACTIVITIES.filter((activity) => zones.includes(activity.moment)).map((activity) => ({
          text: activityTile(activity),
          correctZone: zoneLabel(activity.moment),
        })),
      );
      return {
        type: "drag-drop",
        prompt: "Glisse chaque activité dans le bon moment de la journée.",
        payload: {
          // Les cases suivent l'ordre de la journée.
          zones: DAY_MOMENTS.filter((moment) => zones.includes(moment.name)).map((moment) => zoneLabel(moment.name)),
          items,
          game: originOf("activite-moments", ctx),
          concept: "ce qu'on fait à chaque moment de la journée",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Pense à ta journée, du réveil jusqu'au coucher.",
          "Regarde le dessin devant chaque activité.",
          "Commence par l'activité dont tu es le plus sûr.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

// ===========================================================================
// AVANT ET APRÈS : GRANDIR, DEVENIR
// ===========================================================================

type Cycle = { key: string; steps: readonly string[] };

/** Ce qui grandit, dans l'ordre : chaque étape est un dessin du catalogue, et une seule étape vient après l'autre. */
export const CYCLES: readonly Cycle[] = [
  { key: "plante", steps: ["la graine", "la plante", "la fleur", "le fruit"] },
  { key: "poule", steps: ["l'œuf", "le poussin", "la poule"] },
];

/** « Mets ces dessins dans l'ordre où ils grandissent. » : une graine, une plante, une fleur, un fruit ; un œuf, un poussin, une poule. */
export function makeCycleOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "cycle-ordre",
    () => {
      const cycle = pickFresh(ctx, CYCLES, (c) => `cycle-ordre-cycle:${c.key}`);
      const count = Math.min(cycle.steps.length, ctx.level === 1 ? 3 : 4);
      // Trois étapes qui se suivent ou espacées : l'ordre ne change pas, toujours du plus tôt au plus tard.
      const picks = shuffle(
        ctx.rng,
        cycle.steps.map((_, i) => i),
      )
        .slice(0, count)
        .sort((a, b) => a - b);
      const sequence = picks.map((i) => cycle.steps[i]);
      return {
        type: "order",
        prompt: "Mets ces dessins dans l'ordre où ils grandissent.",
        payload: {
          correctSequence: sequence,
          game: originOf("cycle-ordre", ctx),
          concept: "l'ordre de la croissance",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Dis le nom de chaque dessin.",
          "Cherche celui qui est tout petit, au début.",
          "Place ensuite celui qui a grandi, puis le suivant.",
        ],
      };
    },
    sortedOptions,
  );
}

/** Ce que devient chaque chose, une étape après l'autre : un seul devenir, jamais deux. */
export const BECOMES: readonly { from: string; to: string; family: string }[] = [
  { from: "l'œuf", to: "le poussin", family: "poule" },
  { from: "le poussin", to: "la poule", family: "poule" },
  { from: "la graine", to: "la plante", family: "plante" },
  { from: "la fleur", to: "le fruit", family: "plante" },
  { from: "le chaton", to: "le chat", family: "chat" },
  { from: "le lionceau", to: "le lion", family: "lion" },
  { from: "le chevreau", to: "la chèvre", family: "chèvre" },
];

/**
 * « Que devient l'œuf ? » ou « Qu'est-ce qui vient avant le poussin ? » : les mauvais choix viennent
 * d'une autre famille, jamais de celle de la question (la poule vient aussi après l'œuf).
 */
export function makeBeforeAfter(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "avant-apres", () => {
    // « Avant » demande une apostrophe de plus (« Qu'est-ce qui »), donc une chose sans élision ; « devient » n'en a pas.
    const before = ctx.level >= 2 && ctx.rng() < 0.5;
    const candidates = BECOMES.filter((step) => !before || !step.to.startsWith("l'"));
    // Trois questions dans un même palier : on épuise les étapes avant d'en reprendre une.
    const step = pickForLevel(ctx, candidates, (candidate) => `avant-apres-pas:${before ? "avant" : "apres"}:${candidate.from}`);
    const answer = before ? step.from : step.to;
    const asked = before ? step.to : step.from;
    const pool = BECOMES.filter((other) => other.family !== step.family).flatMap((other) => [other.from, other.to]);
    const wrong = shuffle(ctx.rng, [...new Set(pool)].filter((label) => label !== answer && label !== asked)).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]);
    return {
      type: "qcm",
      prompt: before ? `Qu'est-ce qui vient avant ${asked} ?` : `Que devient ${asked} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer),
        game: originOf("avant-apres", ctx),
        concept: "ce qui vient avant et ce qui vient après",
      },
      answerKey: answer,
      hints: [
        "Dis le nom de chaque dessin.",
        before ? "Cherche ce qui était là d'abord, avant de grandir." : "Cherche ce qui arrive quand il grandit.",
        "Les deux autres dessins ne grandissent pas de cette façon.",
      ],
    };
  });
}

/** « Glisse chaque moment avant ou après midi. » : le matin est avant midi, le soir et la nuit sont après. */
export function makeBeforeAfterMoments(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "avant-apres-glisser",
    () => {
      const reference = pick(ctx.rng, [DAY_MOMENTS[1], DAY_MOMENTS[3]]);
      const at = DAY_MOMENTS.findIndex((moment) => moment.name === reference.name);
      const before = DAY_MOMENTS.slice(0, at);
      const after = DAY_MOMENTS.slice(at + 1);
      // Au premier palier trois moments, ensuite tous : chaque case en garde toujours au moins un.
      const count = ctx.level === 1 ? 3 : 4;
      const pool = shuffle(ctx.rng, [...before, ...after]);
      let chosen = pool.slice(0, count);
      if (!chosen.some((m) => before.includes(m))) chosen = [before[0], ...chosen.slice(0, count - 1)];
      if (!chosen.some((m) => after.includes(m))) chosen = [after[0], ...chosen.slice(0, count - 1)];
      const zoneBefore = `Avant ${reference.label}`;
      const zoneAfter = `Après ${reference.label}`;
      const items = shuffle(
        ctx.rng,
        chosen.map((moment) => ({ text: moment.label, correctZone: before.includes(moment) ? zoneBefore : zoneAfter })),
      );
      return {
        type: "drag-drop",
        prompt: `Glisse chaque moment avant ou après ${reference.label}.`,
        payload: {
          zones: [zoneBefore, zoneAfter],
          items,
          game: originOf("avant-apres-glisser", ctx),
          concept: "avant et après un moment de la journée",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Pense à la place du soleil dans le ciel, du lever jusqu'à la lune.",
          "Les moments qui ont déjà passé vont d'un côté.",
          "Ceux qui ne sont pas encore arrivés vont de l'autre.",
        ],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** Les petits et ce qu'ils deviennent : chacun a un seul devenir, et personne n'est des deux côtés. */
const GROW_PAIRS: readonly { young: string; grown: string }[] = [
  { young: "le poussin", grown: "la poule" },
  { young: "le chaton", grown: "le chat" },
  { young: "le lionceau", grown: "le lion" },
  { young: "le chevreau", grown: "la chèvre" },
];

/** « Relie chaque petit à l'animal adulte. » : trois paires, quatre ensuite. */
export function makeGrowLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "grandir-relier",
    () => {
      const chosen = shuffle(ctx.rng, GROW_PAIRS).slice(0, ctx.level === 1 ? 3 : 4);
      const pairs = chosen.map((pair) => ({ left: pair.young, right: pair.grown }));
      return {
        type: "match",
        prompt: "Relie chaque petit à l'animal adulte.",
        payload: { pairs, game: originOf("grandir-relier", ctx), concept: "ce que devient un petit animal" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: [
          "Dis le nom de chaque animal.",
          "Un petit animal grandit et devient un animal adulte de sa famille.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((p) => p.left)
        .sort()
        .join(","),
  );
}
