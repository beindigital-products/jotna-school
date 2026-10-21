/**
 * L'HEURE, LE CALENDRIER ET LA MONNAIE AU CP (`ma-cp-heure-monnaie`) : lire l'heure (heures justes et demi-heures), les jours, les semaines
 * et les mois du calendrier, la monnaie de 5 F à 100 F (payer une somme).
 *
 * Sur l'échantillon de CP, la thématique n'avait ni horloge ni pièces : « Il y a ___ jours dans une semaine » renvoyait à un calendrier
 * que l'écran ne montrait pas. L'HORLOGE est ici un ÉMOJI : Unicode donne une horloge pour chaque heure juste (🕐 à 🕛, U+1F550 à
 * U+1F55B) et pour chaque demi-heure (🕜 à 🕧, U+1F55C à U+1F567). Aucun composant d'horloge n'est nécessaire, mais la TAILLE compte : à la
 * taille d'un mot (36 px), les aiguilles ne se lisent pas (relu sur l'iPhone 17, le 21 octobre 2026). L'énoncé (`ExercisePrompt`, segment
 * « horloge » de `choix-texte.ts`) pose donc un cadran seul en grand sur son socle, sous la phrase, et les tuiles (`TileGlyphs`) le dessinent à
 * 48 px. La voix de Pio ne lit que l'énoncé, sans l'émoji.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Des heures justes et des demi-heures, jamais un quart d'heure ni une minute. L'heure s'écrit « 3 heures » ou « 3 heures et demie »,
 *   jamais « midi » ni « 15 h » : une horloge de douze heures ne dit pas le matin ou le soir. Un rangement d'horloges se fait donc sur
 *   les heures du MATIN, et l'énoncé le dit.
 * - Une semaine a sept jours, une année douze mois, jamais d'autre fait de calendrier que ces nombres.
 * - Les pièces valent 5, 10, 25, 50 et 100 F, les sommes sont des multiples de cinq et ne passent pas cent francs.
 * - Une étiquette qui se glisse ou se relie est un mot seul ou un groupe de mots : jamais « article + nom », qui demanderait au CI une
 *   image du catalogue.
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, pickFresh, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, pronoun } from "./stories";
import { choiceGame, gapGame, levelGroup, linkGame, pickPreferred, sequenceGame, sortGame, variantsForLevel } from "./tableaux";
import { wrongNumbers } from "./nombresCp";

// ===========================================================================
// L'HORLOGE ET L'HEURE EN LETTRES
// ===========================================================================

/** L'horloge de `hour` heures (1 à 12), juste ou et demie : un émoji d'horloge de Unicode. */
export const clockOf = (hour: number, half: boolean): string => String.fromCodePoint((half ? 0x1f55c : 0x1f550) + hour - 1);

/** « 1 heure », « 3 heures », « 3 heures et demie ». */
export const timeWords = (hour: number, half: boolean): string => `${hour} heure${hour > 1 ? "s" : ""}${half ? " et demie" : ""}`;

/** L'heure d'après : après 12 heures, 1 heure. */
const nextHour = (hour: number): number => (hour % 12) + 1;
const previousHour = (hour: number): number => (hour === 1 ? 12 : hour - 1);

type Clock = { hour: number; half: boolean };

/**
 * Les heures de chaque palier : une sur trois (la 1re, la 4e, la 7e, la 10e au premier palier ; la 2e, la 5e, la 8e, la 11e au deuxième ; la 3e, la 6e, la 9e,
 * la 12e ensuite). Deux paliers d'une même thématique ne lisent ni ne complètent jamais la même heure : sans cela, « Quelle heure est-il ? 🕒 » ou
 * « Il est 4 heures… » revenait d'un palier à l'autre.
 */
const ownHour = (ctx: GameContext, hour: number): boolean => (hour - 1) % 3 === levelGroup(ctx.level);

/** Une heure pour ce palier : juste au premier palier, juste ou et demie ensuite, parmi les heures du palier. */
function pickClock(ctx: GameContext): Clock {
  const all: Clock[] = [];
  for (let hour = 1; hour <= 12; hour++) {
    all.push({ hour, half: false });
    if (ctx.level > 1) all.push({ hour, half: true });
  }
  return pickPreferred(ctx, all, all.filter((clock) => ownHour(ctx, clock.hour)), (clock) => `lire:${clock.hour}:${clock.half}`);
}

/** « Quelle heure est-il ? 🕒 » : l'heure de l'horloge, avec l'heure d'avant ou d'après, ou sans « et demie », pour mauvais choix. */
export function makeReadClock(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "heure-lire", "lire l'heure sur une horloge", () => {
    const { hour, half } = pickClock(ctx);
    return {
      prompt: `Quelle heure est-il ? ${clockOf(hour, half)}`,
      answer: timeWords(hour, half),
      // Les erreurs d'enfant : oublier la demi-heure, lire l'heure d'après, ajouter « et demie » sans raison.
      wrong: half
        ? [timeWords(hour, false), timeWords(nextHour(hour), false)]
        : [timeWords(hour, true), timeWords(previousHour(hour), false)],
      hints: [
        "Regarde d'abord la petite aiguille.",
        "Regarde ensuite où est la grande aiguille.",
        "La grande aiguille tout en haut dit l'heure juste, tout en bas elle dit l'heure et demie.",
      ],
    };
  });
}

/** « Relie chaque horloge à son heure. » : trois horloges (quatre tuiles de 48 px ne tiennent pas sur le premier écran d'un petit téléphone), chacune avec son heure en lettres. */
export function makeClockLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "heure-relier", "relier une horloge et son heure", () => {
    const count = 3;
    const hours = shuffle(
      ctx.rng,
      Array.from({ length: 12 }, (_, i) => i + 1),
    ).slice(0, count);
    return {
      prompt: "Relie chaque horloge à son heure.",
      pairs: hours.map((hour) => {
        const half = ctx.level > 1 && ctx.rng() < 0.5;
        return { left: clockOf(hour, half), right: timeWords(hour, half) };
      }),
      hints: ["Regarde la petite aiguille de chaque horloge.", "Regarde ensuite la grande aiguille.", "Commence par l'horloge dont tu es le plus sûr."],
    };
  });
}

/** « Range ces heures du matin, du plus tôt au plus tard. » : trois ou quatre horloges de six heures à onze heures et demie. */
export function makeClockOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "heure-ordre", "ranger des heures du matin", () => {
    const all: Clock[] = [];
    for (let hour = 6; hour <= 11; hour++) all.push({ hour, half: false }, { hour, half: true });
    const count = ctx.level <= 2 ? 3 : 4;
    const chosen = shuffle(ctx.rng, all)
      .slice(0, count)
      .sort((x, y) => x.hour + (x.half ? 0.5 : 0) - (y.hour + (y.half ? 0.5 : 0)));
    return {
      prompt: "Range ces heures du matin, du plus tôt au plus tard.",
      sequence: chosen.map((clock) => clockOf(clock.hour, clock.half)),
      hints: ["Regarde la petite aiguille de chaque horloge.", "Le matin, les heures grandissent.", "Mets d'abord l'heure la plus petite."],
    };
  });
}

/** « Il est 4 heures. Une heure plus tard, il sera ___. » : ajouter une heure ou une demi-heure. */
export function makeLaterGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "heure-trou", "ajouter une heure ou une demi-heure", () => {
    // Une heure du palier (voir `ownHour`) : juste au premier palier, juste ou et demie ensuite ; et ce qu'on ajoute, une heure ou une demi-heure.
    const starts: { hour: number; half: boolean; addHour: boolean }[] = [];
    for (let candidate = 1; candidate <= (ctx.level >= 3 ? 12 : 11); candidate++) {
      for (const fromHalf of ctx.level > 1 ? [false, true] : [false]) {
        for (const byHour of [true, false]) starts.push({ hour: candidate, half: fromHalf, addHour: byHour });
      }
    }
    const { hour, half, addHour } = pickPreferred(
      ctx,
      starts,
      starts.filter((start) => ownHour(ctx, start.hour)),
      (start) => `trou:${start.hour}:${start.half}:${start.addHour}`,
    );
    const result = (fromHalf: boolean, byHour: boolean): Clock =>
      byHour ? { hour: nextHour(hour), half: fromHalf } : fromHalf ? { hour: nextHour(hour), half: false } : { hour, half: true };
    const answer = result(half, addHour);
    const other = result(half, !addHour);
    return {
      prompt: "Complète la phrase.",
      text: `Il est ${timeWords(hour, half)}. ${addHour ? "Une heure" : "Une demi-heure"} plus tard, il sera ___.`,
      answer: timeWords(answer.hour, answer.half),
      // Les erreurs : ne rien ajouter, ajouter l'autre durée.
      wrong: [timeWords(hour, half), timeWords(other.hour, other.half)],
      hints: [
        "Une demi-heure, c'est la moitié d'une heure.",
        "Une heure plus tard, la petite aiguille avance d'un chiffre.",
        "Une demi-heure plus tard, la grande aiguille fait la moitié du tour.",
      ],
    };
  });
}

// ===========================================================================
// LE CALENDRIER
// ===========================================================================

/** Les faits du calendrier, du plus simple au plus long : un par palier (la semaine, l'année, puis deux ou trois semaines). */
const FACTS: readonly { prompt: string; answer: number; wrong: readonly number[]; hints: readonly [string, string, string] }[] = [
  {
    prompt: "Combien de jours y a-t-il dans une semaine ?",
    answer: 7,
    wrong: [5, 6, 8, 10],
    hints: ["Pense au calendrier de la classe.", "Récite les jours dans ta tête, du lundi au dimanche.", "Compte-les un par un sur tes doigts."],
  },
  {
    prompt: "Combien de mois y a-t-il dans une année ?",
    answer: 12,
    wrong: [10, 11, 7, 6],
    hints: ["Pense au calendrier de la classe.", "Récite les mois dans ta tête, de janvier à décembre.", "Compte-les un par un sur tes doigts."],
  },
  {
    prompt: "Combien de jours y a-t-il dans deux semaines ?",
    answer: 14,
    wrong: [7, 12, 10, 21],
    hints: ["Une semaine a toujours le même nombre de jours.", "Pense à combien de semaines on compte.", "Additionne le même nombre de jours pour chaque semaine."],
  },
  {
    prompt: "Combien de jours y a-t-il dans trois semaines ?",
    answer: 21,
    wrong: [14, 7, 28, 30],
    hints: ["Une semaine a toujours le même nombre de jours.", "Pense à combien de semaines on compte.", "Additionne le même nombre de jours pour chaque semaine."],
  },
];

/** Le nombre de jours d'une semaine, de mois d'une année, de jours de deux ou trois semaines. */
export function makeCalendarCount(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "calendrier-combien", "les jours, les semaines et les mois", () => {
    const fact = pick(ctx.rng, variantsForLevel(FACTS, ctx.level));
    return {
      prompt: fact.prompt,
      answer: String(fact.answer),
      wrong: shuffle(ctx.rng, fact.wrong.map(String)),
      hints: [...fact.hints],
    };
  });
}

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

/** « Un jour ou un mois ? Glisse chaque mot dans la bonne case. » : lundi, mars… */
export function makeDayOrMonth(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "calendrier-glisser", "distinguer un jour et un mois", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Un jour ou un mois ? Glisse chaque mot dans la bonne case.",
      zones: ["Jours", "Mois"],
      items: [
        ...shuffle(ctx.rng, DAYS)
          .slice(0, each)
          .map((text) => ({ text, zone: "Jours" })),
        ...shuffle(ctx.rng, MONTHS)
          .slice(0, each)
          .map((text) => ({ text, zone: "Mois" })),
      ],
      hints: ["Un jour est l'un des jours de la semaine.", "Un mois est l'un des mois de l'année.", "Récite la semaine dans ta tête pour t'aider."],
    };
  });
}

// ===========================================================================
// LA MONNAIE
// ===========================================================================

/** La plus grande somme servie, selon le palier. */
const MONEY_TOP: Record<GameLevel, number> = { 1: 35, 2: 60, 3: 80, 4: 100 };

/** La tranche d'une somme : jusqu'à 35 F, de 36 à 60 F, au-delà. Chaque palier préfère la sienne (`makePayCoins`). */
const moneyBand = (sum: number): 0 | 1 | 2 => (sum <= 35 ? 0 : sum <= 60 ? 1 : 2);

/** « 25 F + 10 F » : les pièces d'une somme, la plus grosse d'abord. */
const coinsText = (coins: readonly number[]): string =>
  [...coins]
    .sort((x, y) => y - x)
    .map((coin) => `${coin} F`)
    .join(" + ");

/** Toutes les paires de pièces (5, 10, 25, 50) dont la somme ne passe pas `top`. */
function coinPairs(top: number): [number, number][] {
  const pairs: [number, number][] = [];
  const coins = [5, 10, 25, 50];
  for (const a of coins) for (const b of coins) if (a >= b && a + b <= top) pairs.push([a, b]);
  return pairs;
}

/** « Awa doit payer 35 F. Quelles pièces donne-t-elle ? » : la paire de pièces dont la somme est juste, deux autres sommes. */
export function makePayCoins(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "monnaie-payer", "payer une somme avec des pièces", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `payer:${candidate.name}`);
    const pairs = coinPairs(MONEY_TOP[ctx.level]);
    // Chaque palier a sa tranche de sommes (jusqu'à 35 F, puis de 50 à 60 F, puis 75 F et plus) : sans cela, « doit payer 15 F » revenait aux paliers 1 et 2.
    const own = pairs.filter(([x, y]) => moneyBand(x + y) === levelGroup(ctx.level));
    const [a, b] = pickPreferred(ctx, pairs, own, ([x, y]) => `payer-somme:${x + y}`);
    const price = a + b;
    // Des paires proches de la somme, jamais la même somme : une seule réponse juste.
    const others = shuffle(
      ctx.rng,
      pairs.filter(([x, y]) => x + y !== price),
    ).sort((p, q) => Math.abs(p[0] + p[1] - price) - Math.abs(q[0] + q[1] - price));
    return {
      prompt: `${child.name} doit payer ${price} F. Quelles pièces donne-t-${pronoun(child)} ?`,
      answer: coinsText([a, b]),
      wrong: others.slice(0, 2).map(([x, y]) => coinsText([x, y])),
      hints: ["Additionne les pièces de chaque réponse.", "Commence par la plus grosse pièce.", "Compare chaque total avec la somme à payer."],
    };
  });
}

/** « Combien de pièces de 10 F faut-il pour payer 50 F ? » : une somme, des pièces toutes pareilles. */
export function makeCoinCount(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "monnaie-pieces", "compter des pièces pareilles", () => {
    const top = Math.min(MONEY_TOP[ctx.level] + (ctx.level === 1 ? 15 : 0), 100);
    // Au moins deux pièces : une pièce de 50 F ne sert pas là où la somme ne monte pas jusqu'à cent.
    const groups: { coin: number; count: number }[] = [];
    for (const value of [5, 10, 25, 50].filter((candidate) => candidate * 2 <= top)) {
      for (let n = 2; n <= Math.min(10, Math.floor(top / value)); n++) groups.push({ coin: value, count: n });
    }
    // Chaque palier a sa tranche de sommes (voir `moneyBand`) : sans cela, « 25 F pour payer 50 F » revenait aux paliers 1 et 2.
    const { coin, count } = pickPreferred(
      ctx,
      groups,
      groups.filter((group) => moneyBand(group.coin * group.count) === levelGroup(ctx.level)),
      (group) => `pieces:${group.coin * group.count}`,
    );
    return {
      prompt: `Combien de pièces de ${coin} F faut-il pour payer ${coin * count} F ?`,
      answer: String(count),
      wrong: wrongNumbers(ctx, count, [count + 1, count - 1, count + 2, count * 2], 1, 20),
      hints: ["Chaque pièce vaut la même somme.", "Compte de pièce en pièce jusqu'à la somme à payer.", "Ajoute la valeur d'une pièce, encore et encore."],
    };
  });
}

/** « Relie chaque groupe de pièces à sa somme. » : trois groupes de pièces pareilles, trois sommes différentes. */
export function makeCoinLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "monnaie-relier", "relier des pièces et leur somme", () => {
    const candidates: { left: string; total: number }[] = [];
    for (const coin of [5, 10, 25, 50]) {
      for (const count of [2, 3, 4]) {
        if (coin * count <= MONEY_TOP[ctx.level] + 15) candidates.push({ left: `${count} pièces de ${coin} F`, total: coin * count });
      }
    }
    // Trois groupes de sommes différentes, de préférence dans la tranche du palier (voir `moneyBand`) : le premier palier n'a que des petites sommes, les
    // suivants en ont au moins deux de leur tranche, donc deux paliers ne relient jamais les mêmes trois groupes.
    const picked: { left: string; total: number }[] = [];
    while (picked.length < 3) {
      const rest = candidates.filter((candidate) => picked.every((other) => other.total !== candidate.total));
      if (rest.length === 0) break;
      const own = rest.filter((candidate) => moneyBand(candidate.total) === levelGroup(ctx.level));
      picked.push(pickPreferred(ctx, rest, own, (candidate) => `relier:${candidate.left}`));
    }
    return {
      prompt: "Relie chaque groupe de pièces à sa somme.",
      pairs: shuffle(ctx.rng, picked).map((entry) => ({ left: entry.left, right: `${entry.total} F` })),
      hints: ["Additionne l'argent de chaque groupe.", "Dans un groupe, tout vaut la même somme.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}
