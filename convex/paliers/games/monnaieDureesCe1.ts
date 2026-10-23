/**
 * LA MONNAIE ET LES DURÉES DU CE1 : les pièces et les billets en francs CFA jusqu'à 10 000 F, rendre la monnaie ; lire l'heure, calculer une durée en
 * heures et en minutes, le calendrier (`ma-ce1-monnaie-durees`).
 *
 * Le modèle écrivait des sommes qui ne se paient pas avec les pièces citées, une monnaie rendue fausse, une durée qui traverse midi sans le dire, un mois
 * de « 30 jours » qui en a 31. Ici les sommes, la monnaie et les durées sont FAITES par le code, le calendrier est une suite fermée qu'on parcourt.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Les pièces valent 5, 10, 25, 50, 100, 200 et 500 F ; les billets 1 000, 2 000, 5 000 et 10 000 F. Une somme ne dépasse jamais 10 000 F, une
 *   monnaie rendue est un multiple de 50 F au premier palier et de 250 F ensuite.
 * - L'horloge est un émoji (heures justes et demi-heures seulement, `heureCp.ts`) : les quarts d'heure et les minutes ne s'écrivent qu'en lettres.
 * - Une durée ne passe jamais de 12 heures à 1 heure : l'heure est lue sur une horloge de douze heures, et le matin ou le soir ne se dit pas. Un palier lit des
 *   heures entières, puis des demi-heures, puis des minutes dans une même heure, puis des minutes d'une heure à l'autre.
 * - Les mois ont 30 ou 31 jours, sauf février (28 jours « d'une année ordinaire », dit dans la phrase).
 * - La semaine commence le lundi, l'année en janvier : un rangement ne traverse jamais le 31 décembre.
 * - Aucun indice n'écrit un chiffre ni le mot de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe, pronoun } from "./stories";
import { cap, choiceGame, pickPreferred, sequenceGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { clockOf, timeWords } from "./heureCp";
import { factGap, pickPairs, quarter, type GapFact } from "./ce1SciencesOutils";

const show = (n: number) => formatNumber(n);
const francs = (n: number) => `${show(n)} F`;

// ===========================================================================
// LES PIÈCES ET LES BILLETS
// ===========================================================================

/** Un nombre de pièces ou de billets d'une même valeur : « 3 pièces de 100 F », « 1 billet de 1 000 F ». */
export type Stack = { count: number; value: number };

export const COINS: readonly number[] = [5, 10, 25, 50, 100, 200, 500];
export const NOTES: readonly number[] = [1000, 2000, 5000, 10000];

export const isNote = (value: number) => value >= 1000;
const noun = (value: number, count: number) => `${isNote(value) ? "billet" : "pièce"}${count > 1 ? "s" : ""}`;
export const stackText = (stack: Stack) => `${stack.count} ${noun(stack.value, stack.count)} de ${francs(stack.value)}`;
export const stackTotal = (stacks: readonly Stack[]) => stacks.reduce((sum, stack) => sum + stack.count * stack.value, 0);

/** « 3 billets de 1 000 F, 1 billet de 500 F et 2 pièces de 100 F » : la liste d'un porte-monnaie. */
export function purseText(stacks: readonly Stack[]): string {
  const parts = stacks.map(stackText);
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

/** Les valeurs servies à chaque palier, de la plus grande à la plus petite. */
const VALUES_BY_LEVEL: Record<GameLevel, readonly number[]> = {
  1: [500, 200, 100, 50],
  2: [2000, 1000, 500, 200, 100],
  3: [5000, 2000, 1000, 500, 200],
  4: [10000, 5000, 2000, 1000, 500],
};

/** La somme la plus haute d'un porte-monnaie, selon le palier. */
const PURSE_TOP: Record<GameLevel, number> = { 1: 1000, 2: 5000, 3: 10000, 4: 10000 };

/** Deux piles de valeurs différentes (trois au dernier palier), avec au plus trois pièces ou billets chacune, et une somme qui reste dans le plafond. */
export function drawPurse(ctx: GameContext, key = "ce1-mon-bourse"): Stack[] {
  const values = VALUES_BY_LEVEL[ctx.level];
  const stacksWanted = ctx.level === 4 ? 3 : 2;
  let purse: Stack[] = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    const picked = shuffle(ctx.rng, values).slice(0, stacksWanted).sort((a, b) => b - a);
    purse = picked.map((value) => ({ count: randomInt(ctx.rng, 1, 3), value }));
    const total = stackTotal(purse);
    if (total > PURSE_TOP[ctx.level] || total < values[values.length - 1] * 2) continue;
    if (ctx.used.has(`${key}:${purseText(purse)}`)) continue;
    break;
  }
  ctx.used.add(`${key}:${purseText(purse)}`);
  return purse;
}

const PURSE_HINTS: Hints = [
  "Calcule la valeur de chaque pile, puis additionne.",
  "Une pile de pièces de même valeur se compte en ajoutant, ou en multipliant.",
  "Additionne les valeurs de gauche à droite, une pile après l'autre.",
];

/** « Awa a 2 billets de 1 000 F et 1 pièce de 500 F. Combien d'argent a-t-elle en tout ? » : la somme du porte-monnaie. */
export function makeCe1MonSum(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mon-somme", "calculer la valeur de pièces et de billets", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-mon-somme:${candidate.name}`);
    const purse = drawPurse(ctx);
    const total = stackTotal(purse);
    const values = purse.map((stack) => stack.value);
    // Les erreurs d'enfant : oublier une pile, compter toutes les pièces à la valeur de la plus grande.
    const pool = [
      total - purse[purse.length - 1].count * purse[purse.length - 1].value,
      total - purse[0].count * purse[0].value,
      purse.reduce((sum, stack) => sum + stack.count, 0) * values[0],
      ...values.flatMap((value) => [total + value, total - value]),
    ];
    return {
      prompt: `${child.name} a ${purseText(purse)}. Combien d'argent ${hasHe(child)} en tout ?`,
      answer: francs(total),
      wrong: wrongNumbersCe1(ctx, total, pool, 50, 10000).map((value) => `${value} F`),
      hints: PURSE_HINTS,
    };
  });
}

/** « Combien de pièces de 50 F faut-il pour payer 300 F ? » : la somme à payer avec des pièces ou des billets de même valeur. */
export function makeCe1MonCount(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mon-pieces", "payer une somme avec des pièces ou des billets de même valeur", () => {
    const values = VALUES_BY_LEVEL[ctx.level];
    let value = values[0];
    let count = 2;
    for (let attempt = 0; attempt < 100; attempt++) {
      value = pick(ctx.rng, values);
      count = randomInt(ctx.rng, 2, 9);
      if (value * count > PURSE_TOP[ctx.level]) continue;
      if (!ctx.used.has(`ce1-mon-pieces:${value}:${count}`)) break;
    }
    ctx.used.add(`ce1-mon-pieces:${value}:${count}`);
    const total = value * count;
    return {
      prompt: `Combien de ${isNote(value) ? "billets" : "pièces"} de ${francs(value)} faut-il pour payer ${francs(total)} ?`,
      answer: `${count} ${noun(value, count)}`,
      wrong: wrongNumbersCe1(ctx, count, [count + 1, count - 1, count * 2, count + 2, count - 2], 2, 20).map((n) => `${n} ${noun(value, Number(n))}`),
      hints: [
        "Cherche combien de fois la valeur d'une pièce entre dans la somme.",
        "Compte de valeur en valeur jusqu'à la somme à payer.",
        "Vérifie en additionnant les pièces ou en multipliant.",
      ],
    };
  });
}

/** Des choses qu'on achète au marché, au singulier, avec leur article. */
const GOODS: readonly string[] = ["un cahier", "une règle", "un ballon", "un pain", "une natte", "un seau", "un livre", "une casserole"];

const CHANGE_STEP: Record<GameLevel, number> = { 1: 50, 2: 250, 3: 250, 4: 250 };
const PAID_BY_LEVEL: Record<GameLevel, readonly number[]> = { 1: [500, 1000], 2: [1000, 2000], 3: [2000, 5000], 4: [5000, 10000] };

/** Un achat : le prix, la somme donnée, la monnaie à rendre. Les prix sont des multiples de 50 F au premier palier et de 250 F ensuite. */
export function drawChange(ctx: GameContext): { child: (typeof CHILDREN)[number]; good: string; price: number; paid: number; change: number } {
  const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-mon-rendre:${candidate.name}`);
  const step = CHANGE_STEP[ctx.level];
  let paid = PAID_BY_LEVEL[ctx.level][0];
  let price = step;
  for (let attempt = 0; attempt < 100; attempt++) {
    paid = pick(ctx.rng, PAID_BY_LEVEL[ctx.level]);
    price = step * randomInt(ctx.rng, 1, paid / step - 1);
    if (!ctx.used.has(`ce1-mon-rendre:${price}:${paid}`)) break;
  }
  ctx.used.add(`ce1-mon-rendre:${price}:${paid}`);
  return { child, good: pick(ctx.rng, GOODS), price, paid, change: paid - price };
}

const paidWith = (paid: number) => (isNote(paid) ? `un billet de ${francs(paid)}` : `une pièce de ${francs(paid)}`);

/** Rendre la monnaie : la somme donnée moins le prix. Les erreurs d'enfant : répondre le prix, se tromper d'un cran. */
export function makeCe1MonChange(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mon-rendre", "rendre la monnaie", () => {
    const { child, good, price, paid, change } = drawChange(ctx);
    const step = CHANGE_STEP[ctx.level];
    const pool = [change + step, change - step, change + 2 * step, change - 2 * step, price].filter((n) => n % step === 0);
    return {
      prompt: `${child.name} achète ${good} à ${francs(price)}. ${cap(pronoun(child))} paie avec ${paidWith(paid)}. Combien lui rend-on ?`,
      answer: francs(change),
      wrong: wrongNumbersCe1(ctx, change, pool, step, paid).map((value) => `${value} F`),
      hints: [
        "On rend la différence entre ce qu'on donne et ce qu'on doit.",
        "Pars du prix et compte jusqu'à la somme donnée.",
        "Retire le prix de la somme donnée.",
      ],
    };
  });
}

/** Des porte-monnaie et leur somme, du plus simple au plus long : chaque somme est différente. */
export const PURSE_PAIRS: readonly (readonly [string, string])[] = [
  ["3 pièces de 50 F", "150 F"],
  ["2 pièces de 200 F", "400 F"],
  ["1 pièce de 500 F et 2 pièces de 100 F", "700 F"],
  ["2 billets de 1 000 F", "2 000 F"],
  ["1 billet de 1 000 F et 1 pièce de 500 F", "1 500 F"],
  ["1 billet de 2 000 F et 3 pièces de 500 F", "3 500 F"],
  ["1 billet de 5 000 F et 1 billet de 1 000 F", "6 000 F"],
  ["2 billets de 5 000 F", "10 000 F"],
];

/** « Relie chaque porte-monnaie à sa somme. » : trois porte-monnaie pris dans la banque. */
export function makeCe1MonLinks(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-mon-relier", "relier des pièces et des billets à leur somme", "Relie chaque porte-monnaie à sa somme.", PURSE_PAIRS, [
    "Calcule d'abord la valeur de chaque pile.",
    "Additionne ensuite les piles du même porte-monnaie.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

/** « Awa a 3 billets de 1 000 F et 2 pièces de 500 F. Combien de francs a-t-elle ? Écris le nombre. » ou la monnaie rendue : une réponse courte. */
export function makeCe1MonWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-mon-ecrire", () => {
    if (ctx.rng() < 0.5) {
      const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-mon-ecrire:${candidate.name}`);
      const purse = drawPurse(ctx, "ce1-mon-ecrire-bourse");
      const total = stackTotal(purse);
      return {
        type: "short-answer",
        prompt: `${child.name} a ${purseText(purse)}. Combien de francs ${hasHe(child)} ? Écris le nombre.`,
        payload: { acceptedAnswers: [String(total)], game: originOf("ce1-mon-ecrire", ctx), concept: "écrire la valeur de pièces et de billets" },
        answerKey: String(total),
        hints: [...PURSE_HINTS],
      };
    }
    const { child, good, price, paid, change } = drawChange(ctx);
    return {
      type: "short-answer",
      prompt: `${child.name} achète ${good} à ${francs(price)}. ${cap(pronoun(child))} paie avec ${paidWith(paid)}. Combien de francs lui rend-on ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(change)], game: originOf("ce1-mon-ecrire", ctx), concept: "écrire la monnaie rendue" },
      answerKey: String(change),
      hints: ["On rend la différence entre ce qu'on donne et ce qu'on doit.", "Pars du prix et compte jusqu'à la somme donnée.", "Retire le prix de la somme donnée."],
    };
  });
}

// ===========================================================================
// LIRE L'HEURE
// ===========================================================================

type Clock = { hour: number; half: boolean };

/** Les 24 horloges : les heures justes de 1 à 12, puis les demi-heures de 1 à 12. Un quart du tableau par palier. */
export const CLOCKS: readonly Clock[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ hour: i + 1, half: false })),
  ...Array.from({ length: 12 }, (_, i) => ({ hour: i + 1, half: true })),
];

const nextHour = (hour: number) => (hour % 12) + 1;
const previousHour = (hour: number) => (hour === 1 ? 12 : hour - 1);

/** « Quelle heure est-il ? 🕒 » : l'heure de l'horloge, avec l'heure d'avant ou d'après, ou sans « et demie », pour mauvais choix. */
export function makeCe1DurRead(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-dur-lire", "lire l'heure sur une horloge", () => {
    const own = quarter(CLOCKS, ctx.level);
    const { hour, half } = pickPreferred(ctx, CLOCKS, own, (clock) => `ce1-dur-lire:${clock.hour}:${clock.half}`);
    return {
      prompt: `Quelle heure est-il ? ${clockOf(hour, half)}`,
      answer: timeWords(hour, half),
      wrong: half ? [timeWords(hour, false), timeWords(nextHour(hour), false)] : [timeWords(hour, true), timeWords(previousHour(hour), false)],
      hints: [
        "Regarde d'abord la petite aiguille.",
        "Regarde ensuite où est la grande aiguille.",
        "La grande aiguille tout en haut dit l'heure juste, tout en bas elle dit l'heure et demie.",
      ],
    };
  });
}

// ===========================================================================
// UNE DURÉE
// ===========================================================================

/** Ce qui commence puis finit : un film, un match, un cours. */
const EVENTS: readonly string[] = ["Le film", "Le match", "Le cours de lecture", "La fête", "Le marché", "La réunion"];

/** Une durée de 30 minutes à 4 heures : « 30 minutes », « 2 heures », « 2 heures et demie » (« une demi-heure » serait « article + nom » absent du catalogue du CI). */
export const hourText = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return "30 minutes";
  return `${hours} heure${hours > 1 ? "s" : ""}${rest === 30 ? " et demie" : ""}`;
};

/** Le temps qui sépare deux heures : des heures entières, des demi-heures, des minutes dans une même heure, des minutes d'une heure à l'autre. */
export function drawDuration(ctx: GameContext): { prompt: string; answer: string; wrong: string[] } {
  const event = pick(ctx.rng, EVENTS);
  const level = ctx.level;
  const start = { hour: 0, minute: 0 };
  let duration = 0;
  for (let attempt = 0; attempt < 200; attempt++) {
    if (level === 1) {
      duration = 60 * randomInt(ctx.rng, 1, 4);
      start.hour = randomInt(ctx.rng, 1, 12 - duration / 60);
      start.minute = 0;
    } else if (level === 2) {
      duration = 30 * randomInt(ctx.rng, 1, 6);
      start.minute = pick(ctx.rng, [0, 30]);
      start.hour = randomInt(ctx.rng, 1, 11);
      if (start.hour * 60 + start.minute + duration > 12 * 60 + 30) continue;
    } else {
      duration = 5 * randomInt(ctx.rng, 3, 11);
      start.minute = 5 * randomInt(ctx.rng, 0, 11);
      start.hour = randomInt(ctx.rng, 1, 11);
      const crosses = start.minute + duration >= 60;
      if (level === 3 && crosses) continue;
      if (level === 4 && !crosses) continue;
    }
    if (!ctx.used.has(`ce1-dur-duree:${start.hour}:${start.minute}:${duration}`)) break;
  }
  ctx.used.add(`ce1-dur-duree:${start.hour}:${start.minute}:${duration}`);
  const endTotal = start.hour * 60 + start.minute + duration;
  const end = { hour: Math.floor(endTotal / 60), minute: endTotal % 60 };
  const at = (time: { hour: number; minute: number }): string => {
    if (level <= 2) return `${time.hour} heure${time.hour > 1 ? "s" : ""}${time.minute === 30 ? " et demie" : ""}`;
    return time.minute === 0 ? `${time.hour} h` : `${time.hour} h ${String(time.minute).padStart(2, "0")}`;
  };
  const prompt = `${event} commence à ${at(start)} et finit à ${at(end)}. Combien de temps dure-t-${event.startsWith("Le ") ? "il" : "elle"} ?`;
  if (level <= 2) {
    const pool = [duration + 30, duration - 30, duration + 60, duration - 60].filter((n) => n >= 30 && n <= 240 && (level === 2 || n % 60 === 0));
    const wrongs = shuffle(ctx.rng, Array.from(new Set(pool)).filter((n) => n !== duration)).slice(0, 2);
    const fallback = [60, 120, 180, 240, 30].filter((n) => n !== duration && (level === 2 || n % 60 === 0) && !wrongs.includes(n));
    while (wrongs.length < 2) wrongs.push(fallback.shift()!);
    return { prompt, answer: hourText(duration), wrong: wrongs.map(hourText) };
  }
  // Les erreurs d'enfant : retrancher les minutes sans emprunter, ajouter ou enlever un quart d'heure.
  const naive = Math.abs(end.minute - start.minute);
  const pool = [duration + 10, duration - 10, duration + 15, duration - 15, naive, 60 - duration].filter((n) => n >= 5 && n <= 55 && n % 5 === 0);
  return {
    prompt,
    answer: `${duration} minutes`,
    wrong: wrongNumbersCe1(ctx, duration, pool, 5, 55).map((value) => `${value} minutes`),
  };
}

/** « Le film commence à 4 h 45 et finit à 5 h 30. Combien de temps dure-t-il ? » : une durée parmi trois. */
export function makeCe1DurSpan(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-dur-duree", "calculer une durée entre deux heures", () => {
    const d = drawDuration(ctx);
    return {
      prompt: d.prompt,
      answer: d.answer,
      wrong: d.wrong,
      hints: [
        "Pars de l'heure du début et avance jusqu'à l'heure de la fin.",
        ctx.level <= 2 ? "Compte les heures, puis les demi-heures." : "Va d'abord à l'heure pleine suivante, puis ajoute le reste.",
        "Vérifie en ajoutant ta durée à l'heure du début.",
      ],
    };
  });
}

// ===========================================================================
// LES ÉGALITÉS DU TEMPS ET LES MOIS
// ===========================================================================

const GAP_HINTS: Hints = ["Lis la phrase en entier avant de choisir.", "Pense à ce que tu sais du temps et du calendrier.", "Teste chaque choix dans la phrase."];

const gap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: GAP_HINTS });

/** Trois phrases par palier. */
export const TIME_GAPS: readonly GapFact[] = [
  // Palier 1
  gap("1 heure = ___ minutes", "60", ["30", "100"]),
  gap("Une semaine a ___ jours.", "7", ["5", "10"]),
  gap("Une année a ___ mois.", "12", ["10", "30"]),
  // Palier 2
  gap("Une demi-heure = ___ minutes", "30", ["15", "20"]),
  gap("Un jour a ___ heures.", "24", ["12", "60"]),
  gap("Le mois de juin a ___ jours.", "30", ["31", "28"]),
  // Palier 3
  gap("Un quart d'heure = ___ minutes", "15", ["10", "25"]),
  gap("Le mois de juillet a ___ jours.", "31", ["30", "28"]),
  gap("En février d'une année ordinaire, il y a ___ jours.", "28", ["30", "31"]),
  // Palier 4
  gap("2 heures = ___ minutes", "120", ["100", "200"]),
  gap("1 heure et demie = ___ minutes", "90", ["60", "100"]),
  gap("3 heures = ___ minutes", "180", ["130", "300"]),
];

/** « 1 heure = ___ minutes » ou « Le mois de juin a ___ jours. » : le nombre qui manque. */
export function makeCe1DurGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-dur-trou", "compléter une égalité du temps ou du calendrier", TIME_GAPS, 3);
}

export const DAYS: readonly string[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export const MONTHS: readonly string[] = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const wrap = (index: number, length: number) => ((index % length) + length) % length;

const CALENDAR_HINTS: Hints = ["Récite les jours ou les mois dans l'ordre.", "Avance ou recule d'un cran à la fois.", "Vérifie en récitant la suite depuis le début."];

const CALENDAR_FORMS: Record<GameLevel, readonly string[]> = {
  1: ["jour-apres", "jour-avant"],
  2: ["mois-apres", "mois-avant"],
  3: ["entre-jours", "entre-mois"],
  4: ["jours-plus", "mois-plus"],
};

/** « Quel jour vient après mardi ? », « Quel mois vient entre mai et juillet ? », « Nous sommes mercredi. Quel jour sera-t-on dans 3 jours ? » : la suite des jours et des mois. */
export function makeCe1DurCalendar(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-dur-calendrier", "se repérer dans la suite des jours et des mois", () => {
    const form = pick(ctx.rng, CALENDAR_FORMS[ctx.level]);
    const days = form.includes("jour");
    const list = days ? DAYS : MONTHS;
    const size = list.length;
    const word = days ? "jour" : "mois";
    for (let attempt = 0; attempt < 30; attempt++) {
      const i = randomInt(ctx.rng, 0, size - 1);
      let prompt = "";
      let answerIndex = i;
      if (form.endsWith("apres")) {
        prompt = `Quel ${word} vient juste après ${list[i]} ?`;
        answerIndex = wrap(i + 1, size);
      } else if (form.endsWith("avant")) {
        prompt = `Quel ${word} vient juste avant ${list[i]} ?`;
        answerIndex = wrap(i - 1, size);
      } else if (form.startsWith("entre")) {
        prompt = `Quel ${word} vient entre ${list[wrap(i - 1, size)]} et ${list[wrap(i + 1, size)]} ?`;
        answerIndex = i;
      } else {
        const n = randomInt(ctx.rng, 2, 5);
        prompt = days ? `Nous sommes ${list[i]}. Quel jour sera-t-on dans ${n} jours ?` : `Nous sommes en ${list[i]}. Quel mois sera-t-on dans ${n} mois ?`;
        answerIndex = wrap(i + n, size);
      }
      if (ctx.used.has(`ce1-dur-calendrier:${prompt}`) && attempt < 29) continue;
      ctx.used.add(`ce1-dur-calendrier:${prompt}`);
      return {
        prompt,
        answer: list[answerIndex],
        wrong: [list[wrap(answerIndex + 1, size)], list[wrap(answerIndex - 1, size)]],
        hints: CALENDAR_HINTS,
      };
    }
    throw new Error("unreachable");
  });
}

/** « Range ces jours dans l'ordre de la semaine. » : des jours ou des mois qui se suivent dans l'année, jamais en passant du 31 décembre au 1er janvier. */
export function makeCe1DurOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-dur-ordre", "ranger des jours ou des mois dans l'ordre", () => {
    if (ctx.level === 1) {
      const start = randomInt(ctx.rng, 0, 3);
      return {
        prompt: "Range ces jours dans l'ordre de la semaine.",
        sequence: DAYS.slice(start, start + 4),
        hints: ["La semaine commence le lundi.", "Récite les jours depuis le début.", "Place d'abord celui dont tu es sûr."],
      };
    }
    const hints: Hints = ["L'année commence en janvier.", "Récite les mois depuis le début.", "Place d'abord celui dont tu es sûr."];
    if (ctx.level < 4) {
      const count = ctx.level === 2 ? 4 : 5;
      const start = randomInt(ctx.rng, 0, 12 - count);
      return { prompt: "Range ces mois, du premier de l'année au dernier.", sequence: MONTHS.slice(start, start + count), hints };
    }
    // Au dernier palier les mois ne se suivent pas : il faut connaître la place de chacun.
    const picked = shuffle(ctx.rng, MONTHS.map((_, index) => index)).slice(0, 5).sort((a, b) => a - b);
    return { prompt: "Range ces mois, du premier de l'année au dernier.", sequence: picked.map((index) => MONTHS[index]), hints };
  });
}
