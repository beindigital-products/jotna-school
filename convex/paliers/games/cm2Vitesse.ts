/**
 * VITESSE, DISTANCE ET DURÉE AU CM2 (`ma-cm2-vitesse`) : la distance d'un mouvement uniforme (vitesse × durée), la vitesse, la durée, l'heure d'arrivée d'un car
 * ou d'un train, la durée entre deux horaires.
 *
 * La thématique n'avait aucun jeu de code. Ici chaque tirage choisit d'abord la vitesse et la durée, puis en déduit la distance : elle est toujours entière,
 * et la réponse est CALCULÉE (distance = vitesse × durée), jamais écrite à la main.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Le mouvement est uniforme : la vitesse ne change pas pendant le trajet. Aucun arrêt, aucun ralentissement.
 * - Les vitesses sont celles d'un marcheur (4 à 6 km/h), d'un cycliste (10 à 20), d'un camion (40 à 70), d'un car (50 à 90) et d'un train (80 à 120). Ce sont des
 *   ordres de grandeur plausibles, pas des mesures. Aucune distance entre deux villes n'est écrite : une ville ne sert que de nom de départ.
 * - Les durées sont des heures entières (jamais une heure seule : la distance serait la vitesse recopiée) aux deux premiers paliers, puis des demi-heures, puis des quarts d'heure : « 2 h 30 min » vaut deux heures et demie,
 *   « 1 h 15 min » une heure et quart. La distance tombe toujours juste : un quart d'heure n'est servi qu'avec une vitesse qui s'y divise.
 * - Une heure s'écrit « 7 h 45 », une durée « 2 h 30 min » ; les minutes d'une heure ont deux chiffres. Aucun trajet ne passe minuit.
 * - Les erreurs d'enfant : multiplier par « 2,30 » au lieu de deux heures et demie, oublier les minutes, diviser au lieu de multiplier, soustraire les minutes
 *   sans emprunter une heure.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES MOBILES, LES VITESSES ET LES DURÉES
// ===========================================================================

type Mover = { name: string; verb: string; speeds: readonly number[] };
const WALKER: Mover = { name: "Un marcheur", verb: "marche", speeds: [4, 5, 6] };
const CYCLIST: Mover = { name: "Un cycliste", verb: "roule", speeds: [10, 12, 15, 16, 20] };
const TRUCK: Mover = { name: "Un camion", verb: "roule", speeds: [40, 50, 60, 70] };
const COACH: Mover = { name: "Un car", verb: "roule", speeds: [50, 60, 70, 80, 90] };
const TRAIN: Mover = { name: "Un train", verb: "roule", speeds: [80, 90, 100, 120] };

const MOVERS_BY_STEP: Record<Step, readonly Mover[]> = {
  1: [WALKER, CYCLIST, COACH],
  2: [WALKER, CYCLIST, TRUCK, COACH],
  3: [CYCLIST, TRUCK, COACH, TRAIN],
  4: [WALKER, CYCLIST, TRUCK, COACH, TRAIN],
  5: [WALKER, CYCLIST, TRUCK, COACH, TRAIN],
};

/** Les durées servies à chaque palier, en minutes : des heures entières, puis des demi-heures, puis des quarts d'heure. */
function durationPool(step: Step): number[] {
  if (step === 1) return [120, 180, 240];
  if (step === 2) return [120, 180, 240, 300, 360];
  if (step === 3) return [30, 90, 120, 150, 180, 210, 240];
  const top = step === 4 ? 270 : 360;
  const out: number[] = [];
  // Jamais une heure exacte : la distance serait la vitesse recopiée.
  for (let minutes = 45; minutes <= top; minutes += 15) if (minutes !== 60) out.push(minutes);
  return out;
}

/** Une durée écrite à l'école : « 3 h », « 45 min », « 2 h 30 min ». */
export function durationText(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  if (hours === 0) return `${rest} min`;
  return `${hours} h ${rest} min`;
}

/** Une heure écrite à l'école : « 7 h », « 7 h 45 », « 9 h 05 ». */
export function clockText(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

type Trip = { mover: Mover; speed: number; minutes: number; distance: number };

/** Un trajet : un mobile, sa vitesse, sa durée et la distance qui en découle, toujours entière. `wholeHours` : une durée en heures entières. */
function drawTrip(ctx: GameContext, wholeHours = false): Trip {
  const step = stepOf(ctx);
  for (let attempt = 0; attempt < 500; attempt++) {
    const mover = pick(ctx.rng, MOVERS_BY_STEP[step]);
    const speed = pick(ctx.rng, mover.speeds);
    let pool = durationPool(step);
    if (wholeHours) pool = pool.filter((minutes) => minutes % 60 === 0);
    const minutes = pick(ctx.rng, pool);
    if ((speed * minutes) % 60 !== 0) continue;
    const distance = (speed * minutes) / 60;
    if (distance < 2) continue;
    return { mover, speed, minutes, distance };
  }
  return { mover: COACH, speed: 60, minutes: 120, distance: 120 };
}

const kmh = (n: number) => `${show(n)} km/h`;
const km = (n: number) => `${show(n)} km`;

/** Les deux mauvais choix d'un nombre de kilomètres ou de km/h : les erreurs d'enfant d'abord, les voisins ensuite. */
function wrong(ctx: GameContext, answer: number, pool: readonly number[], avoid: readonly number[], format: (n: number) => string): string[] {
  // Un mauvais choix plus de trois fois plus grand que la bonne réponse se récuse tout seul : on ne le sert pas.
  return wrongNumbers(ctx, answer, pool, 1, Math.max(answer * 3, 12), avoid).map((text) => format(Number(text.replace(/ /g, ""))));
}

/** Les deux mauvaises durées : les erreurs d'enfant d'abord (2 h 30 lu comme 2,30), les voisines ensuite, jamais la bonne ni une durée de `avoid`. */
function wrongDurations(ctx: GameContext, answer: number, pool: readonly number[], avoid: readonly number[]): string[] {
  const fits = (n: number) => Number.isInteger(n) && n >= 15 && n <= 600 && n !== answer && !avoid.includes(n);
  const typical = shuffle(ctx.rng, [...new Set(pool.filter(fits))]);
  const near = shuffle(ctx.rng, [...new Set([answer - 30, answer + 30, answer - 60, answer + 60, answer - 15, answer + 15].filter(fits))].filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let minutes = 15; out.length < 2 && minutes <= 600; minutes += 15) if (fits(minutes) && !out.includes(minutes)) out.push(minutes);
  return out.map(durationText);
}

// ===========================================================================
// LA DISTANCE, LA VITESSE, LA DURÉE
// ===========================================================================

/** « Un car roule à 60 km/h pendant 2 h 30 min. Quelle distance parcourt-il ? » : la vitesse fois la durée. */
export function makeCm2VitDistance(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vit-distance", "calculer une distance", () => {
    const { mover, speed, minutes, distance } = drawTrip(ctx);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    // Les erreurs d'enfant : oublier les minutes, arrondir à l'heure suivante, lire 2 h 30 comme 2,30, diviser au lieu de multiplier.
    const pool = [speed * hours, speed * Math.ceil(minutes / 60), rest ? speed * (hours + rest / 100) : -1, rest ? speed * minutes : -1, Math.round(speed / (minutes / 60))];
    return {
      prompt: `${mover.name} ${mover.verb} à ${kmh(speed)} pendant ${durationText(minutes)}. Quelle distance parcourt-il ?`,
      answer: km(distance),
      wrong: wrong(ctx, distance, pool, [speed, minutes, hours, rest], km),
      hints: [
        "La vitesse dit combien de kilomètres on parcourt en une heure.",
        "Pour trouver la distance, multiplie la vitesse par la durée.",
        rest ? "Change d'abord les minutes en fraction d'heure, une demi-heure ou un quart d'heure." : "Multiplie le nombre de kilomètres par heure par le nombre d'heures.",
      ],
    };
  });
}

/** « Un cycliste parcourt 45 km en 3 h. Quelle est sa vitesse en kilomètres par heure ? » : la distance divisée par la durée. */
export function makeCm2VitSpeed(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vit-vitesse", "calculer une vitesse", () => {
    const { mover, speed, minutes, distance } = drawTrip(ctx);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    // Les erreurs d'enfant : diviser par le nombre d'heures entières seulement, par l'heure suivante, multiplier au lieu de diviser, soustraire.
    const pool = [hours > 0 ? Math.round(distance / hours) : -1, Math.round(distance / Math.ceil(minutes / 60)), distance * Math.max(1, hours), distance - Math.max(1, hours), Math.round(distance / (minutes / 100))];
    return {
      prompt: `${mover.name} parcourt ${km(distance)} en ${durationText(minutes)}. Quelle est sa vitesse en kilomètres par heure ?`,
      answer: kmh(speed),
      wrong: wrong(ctx, speed, pool, [distance, minutes, hours, rest], kmh),
      hints: [
        "La vitesse est la distance que l'on parcourt en une heure.",
        "Pour trouver la vitesse, divise la distance par la durée.",
        rest ? "Écris la durée en heures, une demi-heure ou un quart d'heure, avant de diviser." : "Cherche combien de kilomètres on parcourt en une seule heure.",
      ],
    };
  });
}

/** « Un car roule à 80 km/h. Il parcourt 200 km. Combien de temps dure son trajet ? » : la distance divisée par la vitesse. */
export function makeCm2VitDuration(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vit-duree", "calculer une durée", () => {
    const { mover, speed, minutes, distance } = drawTrip(ctx);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    // Les erreurs d'enfant : lire 2,5 h comme 2 h 50 min, arrondir à l'heure, oublier de convertir, doubler.
    const pool = [rest ? hours * 60 + (rest / 30) * 50 : -1, Math.ceil(minutes / 60) * 60, hours * 60 || -1, minutes * 2, Math.round(minutes / 2)];
    return {
      prompt: `${mover.name} ${mover.verb} à ${kmh(speed)}. Il parcourt ${km(distance)}. Combien de temps dure son trajet ?`,
      answer: durationText(minutes),
      wrong: wrongDurations(ctx, minutes, pool, []),
      hints: [
        "La durée dit combien de temps il faut pour faire le trajet.",
        "Pour trouver la durée, divise la distance par la vitesse.",
        rest ? "Une demi-heure vaut trente minutes et un quart d'heure vaut quinze minutes." : "Cherche combien de fois la vitesse tient dans la distance.",
      ],
    };
  });
}

// ===========================================================================
// LES HORAIRES D'UN CAR OU D'UN TRAIN
// ===========================================================================

const CITIES = ["Dakar", "Thiès", "Kaolack", "Touba", "Saint-Louis", "Ziguinchor", "Tambacounda", "Kolda", "Louga", "Matam", "Fatick", "Mbour"] as const;

/** Le pas des horaires et des durées de trajet, en minutes, à chaque palier : l'heure pleine, la demi-heure, le quart d'heure, puis cinq minutes. */
const CLOCK_STEP: Record<Step, number> = { 1: 60, 2: 30, 3: 15, 4: 5, 5: 5 };

/** Une durée de trajet en minutes, un multiple du pas du palier. */
function tripLength(ctx: GameContext): number {
  const step = stepOf(ctx);
  const unit = CLOCK_STEP[step];
  const hi = step === 1 ? 4 : step === 2 ? 5 : step === 3 ? 6 : 7;
  return randomInt(ctx.rng, Math.ceil(60 / unit), Math.floor((hi * 60) / unit)) * unit;
}

/** Un départ, un multiple du pas du palier, entre 5 h et 15 h, pour que l'arrivée reste dans la journée. */
function departure(ctx: GameContext): number {
  const unit = CLOCK_STEP[stepOf(ctx)];
  return randomInt(ctx.rng, Math.ceil(300 / unit), Math.floor(900 / unit)) * unit;
}

/** « Le car part de Thiès à 7 h 45 et roule 2 h 30 min. À quelle heure arrive-t-il ? » : le départ plus la durée. */
export function makeCm2VitArrival(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vit-arrivee", "calculer une heure d'arrivée", () => {
    const start = departure(ctx);
    const length = tripLength(ctx);
    const arrival = start + length;
    const vehicle = pick(ctx.rng, ["car", "train"] as const);
    const hours = Math.floor(length / 60);
    // Les erreurs d'enfant : oublier les minutes de la durée, oublier les minutes du départ, ajouter une heure de trop ou de moins.
    const clockPool = [start + hours * 60, Math.floor(start / 60) * 60 + length, arrival + 60, arrival - 60, arrival + 30, arrival - 30, arrival + 15, arrival - 15];
    const fits = (n: number) => n > start && n < 24 * 60 && n !== arrival && n % 5 === 0;
    const typical = shuffle(ctx.rng, [...new Set(clockPool.filter(fits))]);
    const chosen = typical.slice(0, 2);
    for (let n = arrival + 5; chosen.length < 2 && n < 24 * 60; n += 5) if (fits(n) && !chosen.includes(n)) chosen.push(n);
    return {
      prompt: `${vehicle === "car" ? "Le car" : "Le train"} part de ${pick(ctx.rng, CITIES)} à ${clockText(start)} et roule ${durationText(length)}. À quelle heure arrive-t-il ?`,
      answer: clockText(arrival),
      wrong: chosen.map(clockText),
      hints: [
        "Ajoute d'abord les heures de la durée à l'heure de départ.",
        "Ajoute ensuite les minutes de la durée.",
        "Quand les minutes dépassent soixante, change-les en une heure de plus.",
      ],
    };
  });
}

/** « Un train part à 9 h 20 et arrive à 12 h 05. Combien de temps dure le trajet ? » : l'arrivée moins le départ. */
export function makeCm2VitSpan(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vit-horaire", "calculer la durée entre deux horaires", () => {
    const start = departure(ctx);
    const length = tripLength(ctx);
    const arrival = start + length;
    const vehicle = pick(ctx.rng, ["car", "train"] as const);
    // Les erreurs d'enfant : soustraire les minutes sans emprunter (de 9 h 20 à 12 h 05, 3 h 15 min), ajouter ou retirer une demi-heure ou une heure.
    const borrowless = (Math.floor(arrival / 60) - Math.floor(start / 60)) * 60 + Math.abs((arrival % 60) - (start % 60));
    const pool = [borrowless, length + 60, length - 60, length + 30, length - 30, length + 15, length - 15];
    return {
      prompt: `${vehicle === "car" ? "Un car" : "Un train"} part à ${clockText(start)} et arrive à ${clockText(arrival)}. Combien de temps dure le trajet ?`,
      answer: durationText(length),
      wrong: wrongDurations(ctx, length, pool, []),
      hints: [
        "Compte les heures qui séparent le départ de l'arrivée.",
        "Compte ensuite les minutes qui restent.",
        "Avance de l'heure de départ jusqu'à l'heure pleine suivante, puis jusqu'à l'arrivée.",
      ],
    };
  });
}

// ===========================================================================
// LES TROUS, LES RÉPONSES À ÉCRIRE, LES TRAJETS À COMPARER
// ===========================================================================

/** « Un cycliste parcourt 45 km en 3 h. Sa vitesse est ___ km/h. » : la distance, la vitesse ou la durée en heures entières manque. */
export function makeCm2VitGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-vit-trou", "trouver la distance, la vitesse ou la durée qui manque", () => {
    const { mover, speed, minutes, distance } = drawTrip(ctx, true);
    const hours = minutes / 60;
    const missing = pick(ctx.rng, ["distance", "vitesse", "duree"] as const);
    const text =
      missing === "distance"
        ? `${mover.name} ${mover.verb} à ${kmh(speed)} pendant ${hours} h. Il parcourt ___ km.`
        : missing === "vitesse"
          ? `${mover.name} parcourt ${km(distance)} en ${hours} h. Sa vitesse est ___ km/h.`
          : `${mover.name} ${mover.verb} à ${kmh(speed)}. Il parcourt ${km(distance)} en ___ h.`;
    const answer = missing === "distance" ? distance : missing === "vitesse" ? speed : hours;
    // Les erreurs d'enfant : multiplier quand il faut diviser, diviser quand il faut multiplier, additionner.
    const pool =
      missing === "distance"
        ? [speed + hours, Math.round(speed / hours), speed * (hours + 1)]
        : missing === "vitesse"
          ? [distance * hours, distance - hours, Math.round(distance / (hours + 1))]
          : [distance * speed, distance - speed, Math.round(distance / (speed + 10))];
    const avoid = missing === "distance" ? [speed, hours] : missing === "vitesse" ? [distance, hours] : [speed, distance];
    return {
      prompt: "Complète avec le bon nombre.",
      text,
      answer: show(answer),
      // Un mauvais choix plus de dix fois plus grand que la bonne réponse (72 h pour 2 h) se récuse tout seul : on ne le sert pas.
      wrong: wrongNumbers(ctx, answer, pool, 1, Math.max(answer * 10, 20), avoid),
      hints:
        missing === "distance"
          ? ["La vitesse dit combien de kilomètres on parcourt en une heure.", "Pour trouver la distance, multiplie la vitesse par la durée.", "Multiplie le nombre de kilomètres par heure par le nombre d'heures."]
          : missing === "vitesse"
            ? ["La vitesse est la distance que l'on parcourt en une heure.", "Pour trouver la vitesse, divise la distance par la durée.", "Cherche combien de kilomètres on parcourt en une seule heure."]
            : ["La durée dit combien de temps il faut pour faire le trajet.", "Pour trouver la durée, divise la distance par la vitesse.", "Cherche combien de fois la vitesse tient dans la distance."],
    };
  });
}

/** « Un train roule à 90 km/h pendant 3 h 20 min. Écris la distance en kilomètres. » : une réponse à écrire, toujours entière. */
export function makeCm2VitWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-vit-ecrire", () => {
    const { mover, speed, minutes, distance } = drawTrip(ctx);
    const answer = String(distance);
    return {
      type: "short-answer",
      prompt: `${mover.name} ${mover.verb} à ${kmh(speed)} pendant ${durationText(minutes)}. Écris la distance parcourue en kilomètres.`,
      payload: { acceptedAnswers: [...new Set([show(distance), answer])], game: originOf("cm2-vit-ecrire", ctx), concept: "écrire une distance" },
      answerKey: show(distance),
      hints: [
        "La vitesse dit combien de kilomètres on parcourt en une heure.",
        "Pour trouver la distance, multiplie la vitesse par la durée.",
        "Écris seulement le nombre, sans mot.",
      ],
    };
  });
}

/** Des trajets de vitesses toutes différentes, « 120 km en 2 h » : la distance se déduit de la vitesse et de la durée. */
function distinctTrips(ctx: GameContext, count: number): { speed: number; text: string }[] {
  const step = stepOf(ctx);
  const out = new Map<number, string>();
  let guard = 0;
  while (out.size < count && guard++ < 2000) {
    const minutes = pick(ctx.rng, durationPool(step));
    const speed = pick(ctx.rng, [20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 100, 120]);
    if ((speed * minutes) % 60 !== 0) continue;
    out.set(speed, `${km((speed * minutes) / 60)} en ${durationText(minutes)}`);
  }
  return [...out.entries()].map(([speed, text]) => ({ speed, text }));
}

/** « Range ces trajets, du plus rapide au plus lent. » : quatre trajets de vitesses différentes. */
export function makeCm2VitOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-vit-ranger", "ranger des trajets d'après leur vitesse", () => {
    const trips = distinctTrips(ctx, 4);
    const fastest = ctx.rng() < 0.6;
    return {
      prompt: fastest ? "Range ces trajets, du plus rapide au plus lent." : "Range ces trajets, du plus lent au plus rapide.",
      sequence: [...trips].sort((a, b) => (fastest ? b.speed - a.speed : a.speed - b.speed)).map((trip) => trip.text),
      hints: ["Calcule la vitesse de chaque trajet.", "Divise la distance par la durée en heures.", fastest ? "Mets d'abord le trajet le plus rapide." : "Mets d'abord le trajet le plus lent."],
    };
  });
}

/** « Relie chaque trajet à sa vitesse. » : trois trajets de vitesses différentes. */
export function makeCm2VitLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-vit-relier", "relier un trajet à sa vitesse", () => ({
    prompt: "Relie chaque trajet à sa vitesse.",
    pairs: distinctTrips(ctx, 3).map((trip) => ({ left: trip.text, right: kmh(trip.speed) })),
    hints: ["Calcule la vitesse de chaque trajet.", "Divise la distance par la durée en heures.", "Commence par le trajet dont tu es le plus sûr."],
  }));
}

/** « Glisse chaque trajet dans la bonne case. » : deux trajets plus lents que le seuil, deux plus rapides. */
export function makeCm2VitSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-vit-glisser", "placer des trajets par rapport à une vitesse", () => {
    const threshold = pick(ctx.rng, [40, 50, 60]);
    const zones: readonly [string, string] = [`Plus lent que ${threshold} km/h`, `Plus rapide que ${threshold} km/h`];
    const slow: string[] = [];
    const fast: string[] = [];
    let guard = 0;
    while ((slow.length < 2 || fast.length < 2) && guard++ < 3000) {
      for (const trip of distinctTrips(ctx, 4)) {
        if (trip.speed < threshold && slow.length < 2 && !slow.includes(trip.text)) slow.push(trip.text);
        else if (trip.speed > threshold && fast.length < 2 && !fast.includes(trip.text)) fast.push(trip.text);
      }
    }
    return {
      prompt: "Glisse chaque trajet dans la bonne case.",
      zones,
      items: [...slow.map((text) => ({ text, zone: zones[0] })), ...fast.map((text) => ({ text, zone: zones[1] }))],
      hints: ["Calcule la vitesse de chaque trajet.", "Compare-la au nombre écrit sur la case.", "Une vitesse plus petite que ce nombre va dans la première case."],
    };
  });
}
