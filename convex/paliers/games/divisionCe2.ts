/**
 * LA DIVISION DU CE2 : le sens de la division (partager, grouper), la division comme l'inverse d'une multiplication, le reste, la division posée par
 * un nombre à un chiffre (`ma-ce2-division`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait des divisions au reste plus grand que le diviseur (« 23 ÷ 5 = 3 reste 8 »), des partages qui tombaient
 * juste sans le dire, des problèmes où « combien de boîtes pleines ? » et « combien de boîtes faut-il ? » avaient la même réponse. Ici la division est
 * FAITE par le code, jamais écrite : le dividende est le diviseur fois le quotient plus le reste, et le reste est toujours plus petit que le diviseur.
 *
 * - LES PALIERS : sans reste d'abord (les tables de 2 à 5, un quotient jusqu'à 10) ; avec un reste ensuite (diviseur de 2 à 9, quotient jusqu'à 9) ; la
 *   division posée (quotient de 10 à 30) ; enfin trois chiffres (quotient de 20 à 150).
 * - Les erreurs d'enfant : un reste plus grand que le diviseur (« 15 reste 5 » pour 47 ÷ 3), un quotient d'un de trop sans reste qui suit, le reste pris
 *   pour le quotient, le diviseur pris pour le quotient, arrondir au lieu de garder le reste. Aucun mauvais choix n'est vrai en chiffres (« 4 reste 2 » pour
 *   10 ÷ 2 vaut bien 10, mais n'est pas la réponse de l'école : il n'est jamais proposé).
 * - « Combien de boîtes pleines ? » est le quotient, « combien de voyages faut-il ? » est le quotient plus un quand il y a un reste (dernier palier).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, pronoun } from "./stories";
import { choiceGame, gapGame, linkGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { TABLES_CE2 } from "./tablesCe2";

const show = (n: number) => formatNumber(n);

export type Division = { d: number; q: number; r: number; n: number };

/** Les diviseurs, les quotients et la part des divisions avec reste, par palier. */
const PLAN: Record<GameLevel, { divisors: readonly number[]; quotient: [number, number]; withRest: number }> = {
  1: { divisors: [2, 3, 4, 5], quotient: [2, 10], withRest: 0 },
  2: { divisors: [2, 3, 4, 5, 6, 7, 8, 9], quotient: [2, 9], withRest: 0.6 },
  3: { divisors: [2, 3, 4, 5, 6, 7, 8, 9], quotient: [10, 30], withRest: 0.6 },
  4: { divisors: [3, 4, 5, 6, 7, 8, 9], quotient: [20, 150], withRest: 0.7 },
};

/** « 47 = 3 × 15 + 2 » : le dividende, le diviseur, le quotient et le reste, toujours plus petit que le diviseur. */
export function drawDivision(ctx: GameContext, options: { rest?: boolean; exact?: boolean } = {}): Division {
  const plan = PLAN[ctx.level];
  let found: Division | undefined;
  for (let attempt = 0; attempt < 60; attempt++) {
    const d = pick(ctx.rng, plan.divisors);
    const q = randomInt(ctx.rng, plan.quotient[0], plan.quotient[1]);
    const wantsRest = options.exact ? false : options.rest ? true : ctx.rng() < plan.withRest;
    const r = wantsRest ? randomInt(ctx.rng, 1, d - 1) : 0;
    found = { d, q, r, n: d * q + r };
    if (!ctx.used.has(`ce2-div:${found.n}:${d}`)) break;
  }
  ctx.used.add(`ce2-div:${found!.n}:${found!.d}`);
  return found!;
}

/** « 15 reste 2 », ou « 12 » quand la division tombe juste. */
export const quotientText = (q: number, r: number) => (r === 0 ? show(q) : `${show(q)} reste ${show(r)}`);

// ===========================================================================
// LES TABLES À L'ENVERS, LE SENS, LE RESTE
// ===========================================================================

/** « Combien font 56 ÷ 7 ? » : une table du palier à l'envers, un quotient de 2 à 10. */
export function makeCe2DivTable(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-table", "diviser avec les tables de multiplication", () => {
    const d = pickFresh(ctx, TABLES_CE2[ctx.level], (table) => `ce2-div:table:${table}`);
    const q = pickFresh(ctx, [2, 3, 4, 5, 6, 7, 8, 9, 10], (factor) => `ce2-div:table:${d}x${factor}`);
    return {
      prompt: `Combien font ${d * q} ÷ ${d} ?`,
      answer: show(q),
      wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, d, q + 2, q - 2, d * q - d], 1, 20),
      hints: ["Cherche par quel nombre multiplier le diviseur pour arriver au premier nombre.", "Récite la table du diviseur jusqu'au premier nombre.", "Vérifie en multipliant ton résultat par le diviseur."],
    };
  });
}

const THINGS: readonly string[] = ["bonbons", "billes", "crayons", "cahiers", "mangues", "pains"];

/** « Awa partage 29 bonbons entre 4 amis. Combien de bonbons chacun reçoit-il ? » : le quotient, le reste étant gardé. */
export function makeCe2DivShare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-partage", "partager en parts égales", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-div:enfant:${candidate.name}`);
    const { d, q, r, n } = drawDivision(ctx);
    const thing = pick(ctx.rng, THINGS);
    return {
      prompt: `${child.name} partage ${show(n)} ${thing} entre ${d} amis${r > 0 ? ", sans en couper" : ""}. Combien de ${thing} chacun reçoit-il ?`,
      answer: show(q),
      // L'erreur de l'enfant : arrondir au quotient suivant, répondre le reste, répondre le nombre d'amis.
      wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, r > 0 ? r : q + 2, d, q + 10, n - d], 1, 999),
      hints: ["Partager, c'est faire des parts égales.", "Cherche combien de fois le nombre d'amis entre dans le nombre total.", "Vérifie en multipliant la part par le nombre d'amis."],
    };
  });
}

/** « Moussa range 29 billes par paquets de 6. Combien de paquets pleins fait-il ? » : le quotient, jamais le quotient plus un. */
export function makeCe2DivGroup(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-groupement", "grouper par paquets égaux", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-div:enfant:${candidate.name}`);
    const { d, q, r, n } = drawDivision(ctx);
    const thing = pick(ctx.rng, THINGS);
    return {
      prompt: `${child.name} range ${show(n)} ${thing} par paquets de ${d}. Combien de paquets pleins fait-${pronoun(child)} ?`,
      answer: show(q),
      wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, r > 0 ? r : q + 2, d, q + 10, n - d], 1, 999),
      hints: ["Grouper, c'est faire des paquets de la même taille.", "Cherche combien de fois la taille d'un paquet entre dans le nombre total.", "Un paquet qui n'est pas plein ne se compte pas."],
    };
  });
}

/** « Quel est le reste de 29 ÷ 4 ? » : un reste toujours, plus petit que le diviseur (même au premier palier, où le reste fait sa première apparition). */
export function makeCe2DivRest(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-reste", "trouver le reste d'une division", () => {
    const { d, q, r, n } = drawDivision(ctx, { rest: true });
    return {
      prompt: `Quel est le reste de ${show(n)} ÷ ${d} ?`,
      answer: show(r),
      // Les erreurs d'enfant : le diviseur, le quotient, un reste d'un de trop ou de moins.
      wrong: wrongNumbersCe1(ctx, r, [d, q, r + 1, r - 1, d - r, r + d], 0, 999),
      hints: ["Le reste est ce qui ne rentre plus dans les parts égales.", "Cherche le plus grand multiple du diviseur qui ne dépasse pas le nombre.", "Retire ce multiple du nombre : le reste est plus petit que le diviseur."],
    };
  });
}

// ===========================================================================
// LA DIVISION POSÉE
// ===========================================================================

/** Les mauvais choix d'une division posée : un reste trop grand, un quotient d'un de trop, le reste pris pour le quotient. */
function wrongDivisions(division: Division): string[] {
  const { d, q, r } = division;
  if (r === 0) return [show(q + 1), show(q - 1), `${show(q)} reste ${d}`, show(q + 10), `${show(q)} reste 1`];
  return [`${show(q)} reste ${show(r + d)}`, `${show(q + 1)} reste ${show(d - r)}`, `${show(q - 1)} reste ${show(r)}`, `${show(r)} reste ${show(q)}`, `${show(q)} reste ${show(d - r)}`, `${show(q + 1)} reste ${show(r)}`];
}

/** « Pose 47 ÷ 3. Quel est le résultat ? » : « 15 reste 2 », ou « 12 » quand la division tombe juste. */
export function makeCe2DivPosed(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-poser", "poser une division", () => {
    const division = drawDivision(ctx);
    const { d, q, r, n } = division;
    const answer = quotientText(q, r);
    const wrong = [...new Set(wrongDivisions(division))].filter((option) => option !== answer);
    return {
      prompt: `Pose ${show(n)} ÷ ${d}. Quel est le résultat ?`,
      answer,
      wrong: shuffle(ctx.rng, wrong),
      hints: [
        "Cherche combien de fois le diviseur entre dans les premiers chiffres du nombre.",
        "Écris ce quotient, retire le multiple du diviseur, puis abaisse le chiffre suivant.",
        "Le reste doit toujours être plus petit que le diviseur.",
      ],
    };
  });
}

/** « 56 ÷ 7 = ___ » (sans reste), « 29 = 4 × 7 + ___ » (le reste), « 29 = 4 × ___ + 1 » (le quotient). */
export function makeCe2DivGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-div-trou", "compléter une division", () => {
    const form = ctx.level === 1 ? "egal" : ctx.level === 2 ? pick(ctx.rng, ["egal", "reste"]) : pick(ctx.rng, ["reste", "quotient"]);
    const { d, q, r, n } = drawDivision(ctx, { exact: form === "egal", rest: form !== "egal" });
    if (form === "egal") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} ÷ ${d} = ___`,
        answer: show(q),
        wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, d, q + 2, q - 2], 1, 999),
        hints: ["Cherche par quel nombre multiplier le diviseur pour arriver au premier nombre.", "Récite la table du diviseur.", "Vérifie en multipliant ton résultat par le diviseur."],
      };
    }
    if (form === "quotient") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} = ${d} × ___ + ${r}`,
        answer: show(q),
        wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, d, r, q + 10], 1, 999),
        hints: ["Retire d'abord le reste du premier nombre.", "Cherche par quel nombre multiplier le diviseur pour obtenir ce qui reste.", "Vérifie en multipliant puis en ajoutant le reste."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${show(n)} = ${d} × ${show(q)} + ___`,
      answer: show(r),
      wrong: wrongNumbersCe1(ctx, r, [d, q, r + 1, r - 1, d - r], 0, 999),
      hints: ["Multiplie d'abord le diviseur par le quotient.", "Compare ce produit au premier nombre.", "Le reste est ce qui manque pour arriver au premier nombre."],
    };
  });
}

/** « Pose 47 ÷ 3. Écris le quotient. » ou « Écris le reste. » : une réponse courte. Sans reste, « Écris le résultat de 56 ÷ 7. » */
export function makeCe2DivWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-div-ecrire", () => {
    const division = drawDivision(ctx, { rest: ctx.level >= 3 });
    const { d, q, r, n } = division;
    const hints: [string, string, string] = [
      "Pose la division et cherche combien de fois le diviseur entre dans les premiers chiffres.",
      "Retire chaque multiple du diviseur, puis abaisse le chiffre suivant.",
      "Vérifie en multipliant le quotient par le diviseur, puis en ajoutant le reste.",
    ];
    if (r === 0) {
      return {
        type: "short-answer",
        prompt: `Écris le résultat de ${show(n)} ÷ ${d}.`,
        payload: { acceptedAnswers: [String(q)], game: originOf("ce2-div-ecrire", ctx), concept: "diviser avec les tables de multiplication" },
        answerKey: String(q),
        hints,
      };
    }
    const wantsRest = ctx.rng() < 0.5;
    return {
      type: "short-answer",
      prompt: `Pose ${show(n)} ÷ ${d}. Écris le ${wantsRest ? "reste" : "quotient"}.`,
      payload: { acceptedAnswers: [String(wantsRest ? r : q)], game: originOf("ce2-div-ecrire", ctx), concept: "poser une division et écrire un résultat" },
      answerKey: String(wantsRest ? r : q),
      hints,
    };
  });
}

// ===========================================================================
// RELIER, RANGER, PROBLÈMES
// ===========================================================================

/** « Relie chaque division à son résultat. » : trois divisions, tous les résultats différents ; avec reste dès le deuxième palier. */
export function makeCe2DivLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-div-relier", "relier une division et son résultat", () => {
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
      pairs: chosen.map((division) => ({ left: `${show(division.n)} ÷ ${division.d}`, right: quotientText(division.q, division.r) })),
      hints: ["Pose chaque division dans ta tête, ou récite la table.", "Commence par la division que tu connais le mieux.", "Chaque résultat va avec une seule division."],
    };
  });
}

/** « Glisse chaque division dans la bonne case. » : la division tombe juste, ou il reste quelque chose. */
export function makeCe2DivSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce2-div-glisser", "reconnaître une division qui tombe juste", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const exact: Division[] = [];
    const rested: Division[] = [];
    for (let attempt = 0; attempt < 200 && (exact.length < each || rested.length < each); attempt++) {
      const division = drawDivision(ctx, { rest: rested.length < each && exact.length >= each, exact: exact.length < each && rested.length >= each });
      const text = `${show(division.n)} ÷ ${division.d}`;
      if ([...exact, ...rested].some((other) => `${show(other.n)} ÷ ${other.d}` === text)) continue;
      if (division.r === 0 && exact.length < each) exact.push(division);
      else if (division.r > 0 && rested.length < each) rested.push(division);
    }
    const exactZone = "Tombe juste";
    const restZone = "Il reste quelque chose";
    return {
      prompt: "Glisse chaque division dans la bonne case.",
      zones: [exactZone, restZone],
      items: [
        ...exact.map((division) => ({ text: `${show(division.n)} ÷ ${division.d}`, zone: exactZone })),
        ...rested.map((division) => ({ text: `${show(division.n)} ÷ ${division.d}`, zone: restZone })),
      ],
      hints: ["Cherche si le diviseur entre un nombre exact de fois dans le premier nombre.", "Si c'est le cas, rien ne reste.", "Récite la table du diviseur jusqu'au premier nombre."],
    };
  });
}

/**
 * Un problème de partage ou de groupement : le quotient, le reste, et au dernier palier le nombre de voyages qu'il faut (le quotient plus un quand il reste
 * quelque chose).
 */
export function makeCe2DivProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-div-probleme", "résoudre un petit problème de division", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-div:enfant:${candidate.name}`);
    const thing = pick(ctx.rng, THINGS);
    const forms = ctx.level === 1 ? ["partage", "groupement"] : ctx.level === 2 ? ["partage", "groupement", "reste"] : ctx.level === 3 ? ["groupement", "reste"] : ["reste", "voyages"];
    const form = pick(ctx.rng, forms);
    // Un partage ou un groupement du problème tombe juste : sans reste, « combien chacun reçoit-il » n'a qu'une réponse.
    const { d, q, r, n } = drawDivision(ctx, form === "reste" || form === "voyages" ? { rest: true } : { exact: true });
    if (form === "partage") {
      return {
        prompt: `${child.name} partage ${show(n)} ${thing} entre ${d} amis. Combien de ${thing} chacun reçoit-il ?`,
        answer: show(q),
        wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, d, q + 10, n - d], 1, 999),
        hints: ["Partager, c'est faire des parts égales.", "Cherche combien de fois le nombre d'amis entre dans le nombre total.", "Vérifie en multipliant la part par le nombre d'amis."],
      };
    }
    if (form === "groupement") {
      return {
        prompt: `${child.name} range ${show(n)} ${thing} par paquets de ${d}. Combien de paquets fait-${pronoun(child)} ?`,
        answer: show(q),
        wrong: wrongNumbersCe1(ctx, q, [q + 1, q - 1, d, q + 10, n - d], 1, 999),
        hints: ["Grouper, c'est faire des paquets de la même taille.", "Cherche combien de fois la taille d'un paquet entre dans le nombre total.", "Vérifie en multipliant le nombre de paquets par leur taille."],
      };
    }
    if (form === "reste") {
      return {
        prompt: `${child.name} range ${show(n)} ${thing} par paquets de ${d}. Combien de ${thing} reste-t-il hors des paquets pleins ?`,
        answer: show(r),
        wrong: wrongNumbersCe1(ctx, r, [d, q, r + 1, r - 1, d - r], 0, 999),
        hints: ["Fais d'abord les paquets pleins.", "Compte ce qui ne remplit pas un paquet entier.", "Ce reste est toujours plus petit que la taille d'un paquet."],
      };
    }
    return {
      prompt: `Une charrette porte ${d} sacs par voyage. Combien de voyages faut-il pour porter ${show(n)} sacs ?`,
      answer: show(q + 1),
      // L'erreur de l'enfant : oublier le dernier voyage, celui des sacs qui restent.
      wrong: wrongNumbersCe1(ctx, q + 1, [q, q + 2, r, d, q - 1], 1, 999),
      hints: ["Compte d'abord les voyages pleins.", "Que faire des sacs qui restent ?", "Ils ont besoin d'un voyage de plus."],
    };
  });
}
