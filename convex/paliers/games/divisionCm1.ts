/**
 * LA DIVISION POSÉE DU CM1 (`ma-cm1-division`) : poser une division par un nombre à un ou deux chiffres, le quotient et le reste, vérifier une division
 * (dividende = diviseur × quotient + reste), les problèmes de partage et de groupement.
 *
 * Sur l'échantillon, le modèle écrivait des restes plus grands que le diviseur (« 4 567 ÷ 7 = 652 reste 13 »), des partages qui ne tombaient pas juste sans le
 * dire, et des problèmes où « combien de voyages » et « combien de boîtes pleines » avaient la même réponse. Ici la division est FAITE par le code, jamais écrite :
 * le dividende est le diviseur fois le quotient plus le reste, et le reste est toujours plus petit que le diviseur.
 *
 * - LES CINQ PALIERS (`stepOf`) : un diviseur à un chiffre et un quotient à deux chiffres ; un quotient à trois chiffres ; un diviseur de dix à vingt-cinq ; un
 *   diviseur de onze à trente ; un diviseur de vingt et un à quatre-vingt-dix-neuf et un quotient jusqu'à 999. Le dividende ne passe jamais 99 999.
 * - LES ERREURS D'ENFANT : un reste plus grand que le diviseur (« 652 reste 10 » pour 4 567 ÷ 7), un quotient d'un de trop sans le reste qui suit, le reste pris pour
 *   le quotient, arrondir au lieu de garder le reste. Aucun mauvais choix n'est vrai en chiffres : « q reste r + d » vaut un autre dividende, et « q − 1 reste r + d »,
 *   qui vaudrait le bon, n'est jamais proposé.
 * - « Combien de boîtes pleines ? » est le quotient ; « combien de voyages faut-il ? » est le quotient plus un quand il reste quelque chose.
 * - Un palier ne pose jamais deux fois la même division (dividende et diviseur).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

export type Division = { d: number; q: number; r: number; n: number };

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Les diviseurs, les quotients et la part des divisions avec reste, par palier. */
const PLAN: Record<Step, { divisors: readonly number[]; quotient: readonly [number, number]; withRest: number }> = {
  1: { divisors: range(2, 9), quotient: [10, 99], withRest: 0.5 },
  2: { divisors: range(2, 9), quotient: [100, 999], withRest: 0.6 },
  3: { divisors: [10, 11, 12, 15, 20, 25], quotient: [10, 99], withRest: 0.6 },
  4: { divisors: range(11, 30), quotient: [20, 300], withRest: 0.7 },
  5: { divisors: range(21, 99), quotient: [30, 999], withRest: 0.7 },
};

/** « 4 567 = 7 × 652 + 3 » : le dividende, le diviseur, le quotient et le reste, toujours plus petit que le diviseur. Une division déjà posée dans le palier n'est pas reprise. */
export function drawDivision(ctx: GameContext, options: { rest?: boolean; exact?: boolean } = {}): Division {
  const plan = PLAN[stepOf(ctx)];
  let found: Division | undefined;
  for (let attempt = 0; attempt < 80; attempt++) {
    const d = pick(ctx.rng, plan.divisors);
    const q = randomInt(ctx.rng, plan.quotient[0], plan.quotient[1]);
    const wantsRest = options.exact ? false : options.rest ? true : ctx.rng() < plan.withRest;
    const r = wantsRest ? randomInt(ctx.rng, 1, d - 1) : 0;
    found = { d, q, r, n: d * q + r };
    if (!ctx.used.has(`cm1-div:${found.n}:${d}`)) break;
  }
  ctx.used.add(`cm1-div:${found!.n}:${found!.d}`);
  return found!;
}

/** « 652 reste 3 », ou « 652 » quand la division tombe juste. */
const quotientText = (q: number, r: number) => (r === 0 ? show(q) : `${show(q)} reste ${show(r)}`);

/** « 4 567 ÷ 7 » : la division comme elle s'écrit sur une tuile. */
const divisionText = (division: Division) => `${show(division.n)} ÷ ${division.d}`;

const POSE_HINTS = [
  "Cherche combien de fois le diviseur entre dans les premiers chiffres du nombre.",
  "Écris ce quotient, retire le multiple du diviseur, puis abaisse le chiffre suivant.",
  "Le reste doit toujours être plus petit que le diviseur.",
] as const;

// ===========================================================================
// POSER, LE RESTE, VÉRIFIER
// ===========================================================================

/** Les mauvais choix d'une division posée : un reste trop grand, un quotient d'un de trop, le reste pris pour le quotient. */
function wrongDivisions(division: Division): string[] {
  const { d, q, r } = division;
  if (r === 0) return [show(q + 1), show(q - 1), `${show(q)} reste ${d}`, show(q + 10), `${show(q)} reste 1`];
  return [`${show(q)} reste ${show(r + d)}`, `${show(q + 1)} reste ${show(d - r)}`, `${show(q - 1)} reste ${show(r)}`, `${show(r)} reste ${show(q)}`, `${show(q)} reste ${show(d - r)}`, `${show(q + 1)} reste ${show(r)}`];
}

/** « Pose 4 567 ÷ 7. Quel est le résultat ? » : « 652 reste 3 », ou « 652 » quand la division tombe juste. */
export function makeCm1DivPosed(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-div-poser", "poser une division", () => {
    const division = drawDivision(ctx);
    const answer = quotientText(division.q, division.r);
    const wrong = [...new Set(wrongDivisions(division))].filter((option) => option !== answer);
    return {
      prompt: `Pose ${show(division.n)} ÷ ${division.d}. Quel est le résultat ?`,
      answer,
      wrong: shuffle(ctx.rng, wrong),
      hints: [...POSE_HINTS],
    };
  });
}

/** « Quel est le reste de 4 567 ÷ 7 ? » : un reste toujours, plus petit que le diviseur. */
export function makeCm1DivRest(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-div-reste", "trouver le reste d'une division", () => {
    const { d, q, r, n } = drawDivision(ctx, { rest: true });
    return {
      prompt: `Quel est le reste de ${show(n)} ÷ ${d} ?`,
      answer: show(r),
      // Les erreurs d'enfant : le diviseur, le quotient, un reste d'un de trop ou de moins.
      wrong: wrongNumbers(ctx, r, [d, q, r + 1, r - 1, d - r, r + d], 0, 99999),
      hints: ["Le reste est ce qui ne rentre plus dans les parts égales.", "Cherche le plus grand multiple du diviseur qui ne dépasse pas le nombre.", "Retire ce multiple du nombre : le reste est plus petit que le diviseur."],
    };
  });
}

/** Les trois façons de vérifier : le reste (dès le premier palier), le quotient (dès le deuxième), le diviseur (dès le troisième). */
const CHECK_FORMS: Record<Step, readonly string[]> = { 1: ["reste"], 2: ["reste", "quotient"], 3: ["reste", "quotient", "diviseur"], 4: ["reste", "quotient", "diviseur"], 5: ["reste", "quotient", "diviseur"] };

/** « 4 567 = 7 × 652 + ___ » (le reste), « 4 567 = 7 × ___ + 3 » (le quotient) ou « 4 567 = ___ × 652 + 3 » (le diviseur). */
export function makeCm1DivCheck(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-div-verifier", "vérifier une division", () => {
    const form = pick(ctx.rng, CHECK_FORMS[stepOf(ctx)]);
    const { d, q, r, n } = drawDivision(ctx, { rest: true });
    if (form === "reste") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} = ${d} × ${show(q)} + ___`,
        answer: show(r),
        wrong: wrongNumbers(ctx, r, [d, q, r + 1, r - 1, d - r], 0, 99999),
        hints: ["Multiplie d'abord le diviseur par le quotient.", "Compare ce produit au premier nombre.", "Le reste est ce qui manque pour arriver au premier nombre."],
      };
    }
    if (form === "quotient") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} = ${d} × ___ + ${r}`,
        answer: show(q),
        wrong: wrongNumbers(ctx, q, [q + 1, q - 1, d, r, q + 10], 1, 99999),
        hints: ["Retire d'abord le reste du premier nombre.", "Cherche par quel nombre multiplier le diviseur pour obtenir ce qui reste.", "Vérifie en multipliant puis en ajoutant le reste."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${show(n)} = ___ × ${show(q)} + ${r}`,
      answer: String(d),
      wrong: wrongNumbers(ctx, d, [d + 1, d - 1, d + 2, d - 2, r], 2, 99),
      hints: ["Retire d'abord le reste du premier nombre.", "Il reste un produit : quelque chose fois le quotient.", "Divise ce produit par le quotient pour trouver le diviseur."],
    };
  });
}

/** « Pose 4 567 ÷ 7. Écris le quotient. » ou « Écris le reste. » : une réponse courte. Sans reste, « Écris le résultat de 4 564 ÷ 7. » */
export function makeCm1DivWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-div-ecrire", () => {
    const { d, q, r, n } = drawDivision(ctx, { rest: stepOf(ctx) >= 3 });
    const hints: [string, string, string] = [
      "Pose la division et cherche combien de fois le diviseur entre dans les premiers chiffres.",
      "Retire chaque multiple du diviseur, puis abaisse le chiffre suivant.",
      "Vérifie en multipliant le quotient par le diviseur, puis en ajoutant le reste.",
    ];
    if (r === 0) {
      return {
        type: "short-answer",
        prompt: `Écris le résultat de ${show(n)} ÷ ${d}.`,
        payload: { acceptedAnswers: [String(q)], game: originOf("cm1-div-ecrire", ctx), concept: "diviser sans reste" },
        answerKey: String(q),
        hints,
      };
    }
    const wantsRest = ctx.rng() < 0.5;
    return {
      type: "short-answer",
      prompt: `Pose ${show(n)} ÷ ${d}. Écris le ${wantsRest ? "reste" : "quotient"}.`,
      payload: { acceptedAnswers: [String(wantsRest ? r : q)], game: originOf("cm1-div-ecrire", ctx), concept: "poser une division et écrire un résultat" },
      answerKey: String(wantsRest ? r : q),
      hints,
    };
  });
}

/** « Combien de chiffres a le quotient de 4 567 ÷ 7 ? » : estimer avant de poser. */
export function makeCm1DivDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-div-chiffres", "estimer la taille d'un quotient", () => {
    const { q, n, d } = drawDivision(ctx);
    const digits = String(q).length;
    return {
      prompt: `Combien de chiffres a le quotient de ${show(n)} ÷ ${d} ?`,
      answer: String(digits),
      wrong: shuffle(ctx.rng, [digits - 1, digits + 1, String(n).length].filter((count, i, all) => count >= 1 && count !== digits && all.indexOf(count) === i)).map(String),
      hints: ["Compare le nombre aux premiers multiples du diviseur.", "Regarde si les premiers chiffres du nombre suffisent à contenir le diviseur.", "Si oui, le quotient a autant de chiffres que le nombre ; sinon, un de moins."],
    };
  });
}

// ===========================================================================
// RELIER, GLISSER, RANGER
// ===========================================================================

/** « Relie chaque division à son résultat. » : trois divisions, tous les résultats différents. */
export function makeCm1DivLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-div-relier", "relier une division et son résultat", () => {
    const chosen: Division[] = [];
    const seen = new Set<string>();
    for (let attempt = 0; attempt < 200 && chosen.length < 3; attempt++) {
      const division = drawDivision(ctx);
      const text = quotientText(division.q, division.r);
      if (seen.has(text)) continue;
      seen.add(text);
      chosen.push(division);
    }
    return {
      prompt: "Relie chaque division à son résultat.",
      pairs: chosen.map((division) => ({ left: divisionText(division), right: quotientText(division.q, division.r) })),
      hints: ["Pose chaque division dans ta tête, ou récite la table.", "Commence par la division que tu connais le mieux.", "Chaque résultat va avec une seule division."],
    };
  });
}

/** « Glisse chaque division dans la bonne case. » : la division tombe juste, ou il reste quelque chose. */
export function makeCm1DivSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-div-glisser", "reconnaître une division qui tombe juste", () => {
    const each = stepOf(ctx) === 1 ? 2 : 3;
    const exact: Division[] = [];
    const rested: Division[] = [];
    for (let attempt = 0; attempt < 200 && (exact.length < each || rested.length < each); attempt++) {
      const division = drawDivision(ctx, { rest: rested.length < each && exact.length >= each, exact: exact.length < each && rested.length >= each });
      if (division.r === 0 && exact.length < each) exact.push(division);
      else if (division.r > 0 && rested.length < each) rested.push(division);
    }
    const exactZone = "Tombe juste";
    const restZone = "Il reste quelque chose";
    return {
      prompt: "Glisse chaque division dans la bonne case.",
      zones: [exactZone, restZone],
      items: [...exact.map((division) => ({ text: divisionText(division), zone: exactZone })), ...rested.map((division) => ({ text: divisionText(division), zone: restZone }))],
      hints: ["Cherche si le diviseur entre un nombre exact de fois dans le premier nombre.", "Si c'est le cas, rien ne reste.", "Récite la table du diviseur jusqu'au premier nombre."],
    };
  });
}

/** « Range ces divisions du plus petit au plus grand quotient. » : quatre divisions dont les quotients sont différents. */
export function makeCm1DivOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm1-div-ordre", "comparer des quotients", () => {
    const chosen: Division[] = [];
    for (let attempt = 0; attempt < 300 && chosen.length < 4; attempt++) {
      const division = drawDivision(ctx);
      if (chosen.some((other) => other.q === division.q)) continue;
      chosen.push(division);
    }
    const ascending = stepOf(ctx) < 3 || ctx.rng() < 0.6;
    const sorted = [...chosen].sort((x, y) => (ascending ? x.q - y.q : y.q - x.q));
    return {
      prompt: ascending ? "Range ces divisions du plus petit au plus grand quotient." : "Range ces divisions du plus grand au plus petit quotient.",
      sequence: sorted.map(divisionText),
      hints: ["Estime chaque quotient sans poser toute la division.", "Un petit diviseur donne un grand quotient pour un même nombre.", "Compare les quotients, puis range les divisions."],
    };
  });
}

// ===========================================================================
// PROBLÈMES
// ===========================================================================

const THINGS: readonly string[] = ["mangues", "billes", "cahiers", "livres", "crayons", "bananes"];
const GROUPS: readonly (readonly [string, string])[] = [
  ["familles", "famille"],
  ["classes", "classe"],
  ["équipes", "équipe"],
  ["villages", "village"],
];

/** « On partage 4 800 mangues entre 12 familles. Combien de mangues reçoit chaque famille ? » : le partage tombe juste, sinon la question aurait deux réponses. */
export function makeCm1DivShare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-div-partage", "partager en parts égales", () => {
    const { d, q, n } = drawDivision(ctx, { exact: true });
    const thing = pick(ctx.rng, THINGS);
    const [plural, singular] = pick(ctx.rng, GROUPS);
    return {
      prompt: `On partage ${show(n)} ${thing} entre ${d} ${plural}. Combien de ${thing} reçoit chaque ${singular} ?`,
      answer: show(q),
      wrong: wrongNumbers(ctx, q, [q + 1, q - 1, d, q + 10, n - d], 1, 99999),
      hints: ["Partager, c'est faire des parts égales.", "Cherche combien de fois le nombre de parts entre dans le nombre total.", "Vérifie en multipliant une part par le nombre de parts."],
    };
  });
}

const GROUP_FORMS: Record<Step, readonly string[]> = {
  1: ["paquets"],
  2: ["paquets", "reste"],
  3: ["paquets", "reste", "voyages"],
  4: ["reste", "voyages", "paquets"],
  5: ["reste", "voyages"],
};

/** Un groupement : les boîtes pleines (le quotient), ce qui reste (le reste), ou les voyages qu'il faut (le quotient plus un, puisqu'il reste quelque chose). */
export function makeCm1DivGroup(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-div-groupement", "grouper par paquets égaux", () => {
    const form = pick(ctx.rng, GROUP_FORMS[stepOf(ctx)]);
    const thing = pick(ctx.rng, THINGS);
    if (form === "paquets") {
      const { d, q, r, n } = drawDivision(ctx);
      return {
        prompt: `On range ${show(n)} ${thing} dans des boîtes de ${d}. Combien de boîtes pleines obtient-on ?`,
        answer: show(q),
        wrong: wrongNumbers(ctx, q, [q + 1, q - 1, r > 0 ? r : q + 2, d, q + 10, n - d], 1, 99999),
        hints: ["Grouper, c'est faire des paquets de la même taille.", "Cherche combien de fois la taille d'une boîte entre dans le nombre total.", "Une boîte qui n'est pas pleine ne se compte pas."],
      };
    }
    const { d, q, r, n } = drawDivision(ctx, { rest: true });
    if (form === "reste") {
      return {
        prompt: `On range ${show(n)} ${thing} dans des boîtes de ${d}. Combien de ${thing} restent hors des boîtes pleines ?`,
        answer: show(r),
        wrong: wrongNumbers(ctx, r, [d, q, r + 1, r - 1, d - r], 0, 99999),
        hints: ["Fais d'abord les boîtes pleines.", "Compte ce qui ne remplit pas une boîte entière.", "Ce reste est toujours plus petit que la taille d'une boîte."],
      };
    }
    return {
      prompt: `Un camion porte ${d} sacs par voyage. Combien de voyages faut-il pour porter ${show(n)} sacs ?`,
      answer: show(q + 1),
      // L'erreur de l'enfant : oublier le dernier voyage, celui des sacs qui restent.
      wrong: wrongNumbers(ctx, q + 1, [q, q + 2, r, d, q - 1], 1, 99999),
      hints: ["Compte d'abord les voyages pleins.", "Que faire des sacs qui restent ?", "Ils ont besoin d'un voyage de plus."],
    };
  });
}
