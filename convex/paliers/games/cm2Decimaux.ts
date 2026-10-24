/**
 * LES OPÉRATIONS SUR LES DÉCIMAUX DU CM2 (`ma-cm2-decimaux`) : multiplier et diviser par 10, 100 et 1 000, multiplier un décimal par un entier ou par un
 * décimal, diviser un décimal ou un entier pour obtenir un quotient décimal, écrire un résultat, trouver le facteur ou le nombre qui manque, ranger des
 * calculs, les relier à leur résultat, dire si un résultat est plus grand ou plus petit.
 *
 * Sur l'échantillon, le modèle écrivait « 2,5 × 1,2 = 30 » (la virgule oubliée), « 4,35 × 100 = 43,5 » (une virgule décalée d'un seul rang) et « 18 ÷ 8 = 2 »
 * (le reste jeté). Ici le nombre est un entier de MILLIÈMES, jamais une chaîne tapée à la main : le produit, le quotient et le décalage se calculent sur des
 * entiers, et c'est `dec3` (`cm2MathsOutils.ts`) qui l'écrit, avec une virgule française et sans zéro inutile à droite.
 *
 * - LES CINQ PALIERS (`stepOf`) : multiplier et diviser un décimal à un ou deux chiffres par 10 et 100 ; par 1 000 aussi, et un décimal fois un entier d'un
 *   chiffre ; un décimal fois un entier de deux chiffres, les divisions qui tombent juste ; un décimal fois un décimal ; les produits à trois chiffres après la
 *   virgule et les quotients décimaux d'un entier. Les millièmes sont la plus fine unité : un résultat n'a jamais plus de trois chiffres après la virgule.
 * - LES ERREURS D'ENFANT : décaler la virgule d'un seul rang ou de trop de rangs, oublier la virgule d'un produit puis la mettre au hasard, jeter le reste d'une
 *   division, prendre la partie entière pour le résultat.
 * - Aucun nombre n'est écrit avec un zéro inutile (« 4,50 »), les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun
 *   indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, type Step } from "./cm1MathsOutils";
import { dec3, wrongDec3 } from "./cm2MathsOutils";

// ===========================================================================
// LES NOMBRES, EN MILLIÈMES
// ===========================================================================

/** Le plus grand nombre de millièmes d'un résultat : 99 999 999 unités. */
const MAX = 99999999 * 1000;

/**
 * Un nombre décimal en millièmes, avec `places` chiffres après la virgule (0 à 3), le dernier jamais nul : pas de zéro inutile à droite. La partie entière est
 * tirée entre `whole[0]` et `whole[1]`.
 */
export function drawDec3(ctx: GameContext, places: 0 | 1 | 2 | 3, whole: readonly [number, number]): number {
  const w = randomInt(ctx.rng, whole[0], whole[1]);
  if (places === 0) return w * 1000;
  const scale = 10 ** (3 - places);
  const last = randomInt(ctx.rng, 1, 9);
  const rest = places === 1 ? last : randomInt(ctx.rng, 0, 10 ** (places - 1) - 1) * 10 + last;
  return w * 1000 + rest * scale;
}

/** Les puissances de dix servies à chaque palier. */
const POWERS: Record<Step, readonly number[]> = { 1: [10, 100], 2: [10, 100, 1000], 3: [10, 100, 1000], 4: [10, 100, 1000], 5: [10, 100, 1000] };

/** Le nombre de chiffres après la virgule d'un nombre en millièmes. */
const placesOf = (t: number) => (t % 1000 === 0 ? 0 : t % 100 === 0 ? 1 : t % 10 === 0 ? 2 : 3);

/** Un facteur ou un diviseur entier écrit comme à l'école : « 1 000 ». */
const times = (n: number) => show(n);

// ===========================================================================
// MULTIPLIER ET DIVISER PAR 10, 100, 1 000
// ===========================================================================

/** « Calcule 4,35 × 100. » : la virgule se décale vers la droite d'autant de rangs que de zéros. */
export function makeCm2DcmTimesTen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-dcm-fois10", "multiplier un décimal par 10, 100 ou 1 000", () => {
    const step = stepOf(ctx);
    const places = pick(ctx.rng, step === 1 ? [1, 2] : [1, 2, 3]) as 1 | 2 | 3;
    const a = drawDec3(ctx, places, step <= 2 ? [1, 99] : [1, 999]);
    const power = pick(ctx.rng, POWERS[step]);
    const answer = a * power;
    return {
      prompt: `Calcule ${dec3(a)} × ${times(power)}.`,
      answer: dec3(answer),
      // Les erreurs d'enfant : un rang de trop ou de moins, la virgule qui ne bouge pas, les zéros ajoutés à la fin.
      wrong: wrongDec3(ctx, answer, [answer * 10, answer / 10, a * (power / 10), a * power * 100], 1, MAX),
      hints: ["Multiplier par dix, cent ou mille agrandit le nombre.", "La virgule se décale vers la droite d'autant de rangs que le nombre a de zéros.", "Si la virgule arrive au bout, on ajoute des zéros."],
    };
  });
}

/** « Calcule 52,4 ÷ 100. » : la virgule se décale vers la gauche d'autant de rangs que de zéros ; le résultat a au plus trois chiffres après la virgule. */
export function makeCm2DcmDivTen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-dcm-div10", "diviser un décimal par 10, 100 ou 1 000", () => {
    const step = stepOf(ctx);
    const power = pick(ctx.rng, POWERS[step]);
    const exponent = String(power).length - 1;
    const places = randomInt(ctx.rng, 0, Math.min(2, 3 - exponent)) as 0 | 1 | 2;
    const a = drawDec3(ctx, places, step <= 2 ? [10, 999] : [10, 9999]);
    const answer = a / power;
    return {
      prompt: `Calcule ${dec3(a)} ÷ ${times(power)}.`,
      answer: dec3(answer),
      wrong: wrongDec3(ctx, answer, [answer * 10, answer / 10, a / (power / 10), a * power], 1, MAX),
      hints: ["Diviser par dix, cent ou mille rend le nombre plus petit.", "La virgule se décale vers la gauche d'autant de rangs que le nombre a de zéros.", "Si la virgule sort du nombre, on ajoute des zéros avant."],
    };
  });
}

// ===========================================================================
// MULTIPLIER, DIVISER
// ===========================================================================

/** Un décimal et un entier : le décimal a un ou deux chiffres après la virgule, l'entier un ou deux chiffres selon le palier. */
function timesInteger(ctx: GameContext): { a: number; k: number } {
  const step = stepOf(ctx);
  const places = pick(ctx.rng, step <= 2 ? [1, 2] : [1, 2]) as 1 | 2;
  const a = drawDec3(ctx, places, step <= 2 ? [1, 19] : [1, 99]);
  const k = step <= 2 ? randomInt(ctx.rng, 2, 9) : randomInt(ctx.rng, 11, 99);
  return { a, k };
}

/** « Calcule 3,25 × 4. » : le produit des millièmes par l'entier, jamais un résultat de plus de trois chiffres après la virgule. */
export function makeCm2DcmTimesInteger(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-dcm-fois-entier", "multiplier un décimal par un entier", () => {
    const { a, k } = timesInteger(ctx);
    const answer = a * k;
    return {
      prompt: `Calcule ${dec3(a)} × ${k}.`,
      answer: dec3(answer),
      // Les erreurs d'enfant : la virgule oubliée puis mal remise, la retenue oubliée, seule la partie entière multipliée.
      wrong: wrongDec3(ctx, answer, [answer * 10, answer / 10, Math.trunc(a / 1000) * k * 1000 + (a % 1000), (Math.trunc(a / 1000) * k) * 1000, answer + 1000 * (k > 9 ? 10 : 1)], 1, MAX),
      hints: ["Multiplie comme si la virgule n'existait pas.", "Puis remets la virgule : le résultat a autant de chiffres après la virgule que le premier nombre.", "Vérifie : le résultat est plus grand que le nombre de départ."],
    };
  });
}

/** Deux décimaux : le produit n'a jamais plus de trois chiffres après la virgule. */
function timesDecimal(ctx: GameContext): { a: number; b: number } {
  const step = stepOf(ctx);
  if (step === 1) return { a: drawDec3(ctx, 1, [0, 0]), b: drawDec3(ctx, 1, [0, 0]) };
  if (step === 2) return { a: drawDec3(ctx, 1, [1, 9]), b: drawDec3(ctx, 1, [0, 0]) };
  if (step === 3) return { a: drawDec3(ctx, 1, [1, 20]), b: drawDec3(ctx, 1, [1, 9]) };
  if (step === 4) return { a: drawDec3(ctx, 2, [1, 20]), b: drawDec3(ctx, 1, [0, 9]) };
  return ctx.rng() < 0.5 ? { a: drawDec3(ctx, 2, [1, 99]), b: drawDec3(ctx, 1, [1, 9]) } : { a: drawDec3(ctx, 1, [1, 99]), b: drawDec3(ctx, 2, [0, 9]) };
}

/** « Calcule 2,5 × 1,2. » : le produit des deux nombres sans virgule, puis la virgule remise à la somme de leurs chiffres décimaux. */
export function makeCm2DcmTimesDecimal(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-dcm-fois-decimal", "multiplier deux décimaux", () => {
    let pair = timesDecimal(ctx);
    // Un produit nul ou égal à un facteur n'apprend rien : au moins 0,01 de résultat.
    while (pair.a === 0 || pair.b === 0) pair = timesDecimal(ctx);
    const { a, b } = pair;
    const answer = (a * b) / 1000;
    return {
      prompt: `Calcule ${dec3(a)} × ${dec3(b)}.`,
      answer: dec3(answer),
      // Les erreurs d'enfant : la virgule oubliée, la virgule mal remise (un rang, deux rangs), la somme au lieu du produit.
      wrong: wrongDec3(ctx, answer, [answer * 10, answer / 10, answer * 100, answer / 100, a + b], 1, MAX),
      hints: ["Multiplie les deux nombres comme s'ils étaient entiers.", "Compte les chiffres après la virgule dans les deux nombres.", "Le résultat a autant de chiffres après la virgule que ce total."],
    };
  });
}

/** Un quotient décimal : un décimal divisé par un entier qui tombe juste, ou un entier divisé par 2, 4, 5 ou 8. */
function divisionOf(ctx: GameContext): { dividend: number; divisor: number; quotient: number; integers: boolean } {
  const step = stepOf(ctx);
  if (step >= 3 && ctx.rng() < 0.45) {
    const divisor = pick(ctx.rng, step === 3 ? [2, 4, 5] : [2, 4, 5, 8]);
    let n = randomInt(ctx.rng, 3, step === 3 ? 60 : 199);
    while (n % divisor === 0) n += 1;
    return { dividend: n * 1000, divisor, quotient: (n * 1000) / divisor, integers: true };
  }
  const divisor = pick(ctx.rng, step <= 2 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8]);
  const places = pick(ctx.rng, step <= 2 ? [1] : [1, 2]) as 1 | 2;
  let quotient = drawDec3(ctx, places, step <= 2 ? [1, 19] : [1, 99]);
  // Aux premiers paliers, le nombre à partager est un décimal : un entier qui se partage en décimal est du troisième palier.
  while (step <= 2 && (quotient * divisor) % 1000 === 0) quotient = drawDec3(ctx, places, [1, 19]);
  return { dividend: quotient * divisor, divisor, quotient, integers: false };
}

/** « Calcule 7,5 ÷ 5. » ou « Calcule 18 ÷ 8. » : le quotient décimal, sans reste. */
export function makeCm2DcmDivide(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-dcm-diviser", "diviser avec un quotient décimal", () => {
    const { dividend, divisor, quotient, integers } = divisionOf(ctx);
    return {
      prompt: `Calcule ${dec3(dividend)} ÷ ${divisor}.`,
      answer: dec3(quotient),
      // Les erreurs d'enfant : le reste jeté, la virgule oubliée dans le quotient, un rang de trop ou de moins.
      wrong: wrongDec3(ctx, quotient, [Math.floor(dividend / divisor / 1000) * 1000, quotient * 10, quotient / 10, integers ? Math.floor(dividend / divisor / 1000) * 1000 + 500 : quotient + 100], 1, MAX),
      hints: [
        "Divise d'abord la partie entière, puis continue après la virgule.",
        "Quand tu abaisses le premier chiffre après la virgule, mets la virgule au quotient.",
        integers ? "Si l'entier ne se partage pas jusqu'au bout, ajoute une virgule et des zéros au nombre à partager." : "Le quotient a autant de chiffres après la virgule que le nombre à partager, ou un peu plus.",
      ],
    };
  });
}

// ===========================================================================
// ÉCRIRE LE RÉSULTAT, TROUVER CE QUI MANQUE
// ===========================================================================

/** Les écritures admises d'un résultat décimal : « 7,5 » et « 7,50 » valent la même chose. */
function acceptedResults(t: number): string[] {
  const base = dec3(t);
  if (!base.includes(",")) return [base];
  const places = base.split(",")[1].length;
  return Array.from({ length: 3 - places + 1 }, (_, i) => `${base}${"0".repeat(i)}`);
}

/** « Écris le résultat de 6,4 × 25. » : une réponse à écrire, avec ou sans zéros inutiles. */
export function makeCm2DcmWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-dcm-ecrire", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, step === 1 ? ["fois10", "div10"] : step === 2 ? ["fois10", "div10", "entier"] : ["fois10", "div10", "entier", "decimal", "division"]);
    let prompt: string;
    let result: number;
    if (form === "fois10") {
      const a = drawDec3(ctx, pick(ctx.rng, [1, 2]) as 1 | 2, [1, 99]);
      const power = pick(ctx.rng, POWERS[step]);
      prompt = `Écris le résultat de ${dec3(a)} × ${times(power)}.`;
      result = a * power;
    } else if (form === "div10") {
      const power = pick(ctx.rng, POWERS[step]);
      const exponent = String(power).length - 1;
      const a = drawDec3(ctx, randomInt(ctx.rng, 0, Math.min(2, 3 - exponent)) as 0 | 1 | 2, [10, 999]);
      prompt = `Écris le résultat de ${dec3(a)} ÷ ${times(power)}.`;
      result = a / power;
    } else if (form === "entier") {
      const { a, k } = timesInteger(ctx);
      prompt = `Écris le résultat de ${dec3(a)} × ${k}.`;
      result = a * k;
    } else if (form === "decimal") {
      let pair = timesDecimal(ctx);
      while (pair.a === 0 || pair.b === 0) pair = timesDecimal(ctx);
      prompt = `Écris le résultat de ${dec3(pair.a)} × ${dec3(pair.b)}.`;
      result = (pair.a * pair.b) / 1000;
    } else {
      const d = divisionOf(ctx);
      prompt = `Écris le résultat de ${dec3(d.dividend)} ÷ ${d.divisor}.`;
      result = d.quotient;
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: acceptedResults(result), game: originOf("cm2-dcm-ecrire", ctx), concept: "écrire le résultat d'une opération sur les décimaux" },
      answerKey: dec3(result),
      hints: ["Décide d'abord si le résultat sera plus grand ou plus petit que le nombre de départ.", "Place la virgule en comptant les rangs qu'elle doit faire avancer ou reculer.", "Écris la virgule avec une virgule, jamais avec un point."],
    };
  });
}

/** « 4,5 × ___ = 450 » (le facteur), « 36,4 ÷ ___ = 0,364 » (le diviseur) ou « ___ × 100 = 45,6 » (le nombre) : le facteur qui manque. */
export function makeCm2DcmGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-dcm-trou", "trouver le facteur ou le nombre qui manque", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, ["facteur", "diviseur", "nombre"]);
    const power = pick(ctx.rng, POWERS[step]);
    if (form === "facteur") {
      const a = drawDec3(ctx, pick(ctx.rng, [1, 2]) as 1 | 2, [1, 99]);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${dec3(a)} × ___ = ${dec3(a * power)}`,
        answer: times(power),
        wrong: [10, 100, 1000, 10000].filter((p) => p !== power).map(times),
        hints: ["Compare les deux nombres : la virgule a avancé.", "Compte de combien de rangs elle a avancé.", "Autant de rangs que de zéros dans le nombre cherché."],
      };
    }
    if (form === "diviseur") {
      const exponent = String(power).length - 1;
      const a = drawDec3(ctx, randomInt(ctx.rng, 0, Math.min(2, 3 - exponent)) as 0 | 1 | 2, [10, 999]);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${dec3(a)} ÷ ___ = ${dec3(a / power)}`,
        answer: times(power),
        wrong: [10, 100, 1000, 10000].filter((p) => p !== power).map(times),
        hints: ["Compare les deux nombres : la virgule a reculé.", "Compte de combien de rangs elle a reculé.", "Autant de rangs que de zéros dans le nombre cherché."],
      };
    }
    const a = drawDec3(ctx, pick(ctx.rng, [1, 2]) as 1 | 2, [1, 99]);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `___ × ${times(power)} = ${dec3(a * power)}`,
      answer: dec3(a),
      wrong: wrongDec3(ctx, a, [a * 10, a / 10, a * power, (a * power) / 10], 1, MAX, [a * power]),
      hints: ["Pour revenir au nombre de départ, fais l'opération inverse.", "Diviser est l'inverse de multiplier.", "La virgule recule d'autant de rangs que le nombre a de zéros."],
    };
  });
}

// ===========================================================================
// RANGER, RELIER, COMPARER AU NOMBRE DE DÉPART
// ===========================================================================

type Expression = { text: string; value: number };

/** Les calculs d'un même nombre `base` (entier ou à un chiffre après la virgule) par 10, 100 ou 1 000 : le texte et le résultat, en millièmes. */
function expressionsOf(base: number, powers: readonly number[]): Expression[] {
  const places = placesOf(base);
  const out: Expression[] = [];
  for (const power of powers) {
    out.push({ text: `${dec3(base)} × ${times(power)}`, value: base * power });
    if (places + String(power).length - 1 <= 3) out.push({ text: `${dec3(base)} ÷ ${times(power)}`, value: base / power });
  }
  return out;
}

/** Un nombre de départ, entier ou à un chiffre après la virgule, d'au moins deux chiffres : tous ses décalages sont différents. */
function baseNumber(ctx: GameContext): number {
  const step = stepOf(ctx);
  return drawDec3(ctx, step === 1 ? 0 : (pick(ctx.rng, [0, 1]) as 0 | 1), [12, 99]);
}

/** « Range ces calculs d'après leur résultat, du plus petit au plus grand. » : quatre calculs du même nombre par 10, 100 ou 1 000. */
export function makeCm2DcmOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-dcm-ranger", "ranger des calculs d'après leur résultat", () => {
    const base = baseNumber(ctx);
    const chosen = shuffle(ctx.rng, expressionsOf(base, POWERS[stepOf(ctx)])).slice(0, 4);
    const ascending = ctx.rng() < 0.65;
    return {
      prompt: ascending ? "Range ces calculs d'après leur résultat, du plus petit au plus grand." : "Range ces calculs d'après leur résultat, du plus grand au plus petit.",
      sequence: [...chosen].sort((a, b) => (ascending ? a.value - b.value : b.value - a.value)).map((e) => e.text),
      hints: ["Multiplier agrandit le nombre, diviser le rend plus petit.", "Multiplier par mille agrandit plus que par dix.", ascending ? "Mets d'abord les divisions, puis les multiplications." : "Mets d'abord les multiplications, puis les divisions."],
    };
  });
}

/** « Relie chaque calcul à son résultat. » : trois calculs de nombres différents. */
export function makeCm2DcmLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-dcm-relier", "relier un calcul à son résultat", () => {
    const step = stepOf(ctx);
    const pairs: { left: string; right: string }[] = [];
    const seen = new Set<string>();
    while (pairs.length < 3) {
      const form = pick(ctx.rng, step <= 2 ? ["fois10", "div10"] : ["fois10", "div10", "entier", "decimal"]);
      let left: string;
      let value: number;
      if (form === "fois10") {
        const a = drawDec3(ctx, pick(ctx.rng, [1, 2]) as 1 | 2, [1, 99]);
        const power = pick(ctx.rng, POWERS[step]);
        left = `${dec3(a)} × ${times(power)}`;
        value = a * power;
      } else if (form === "div10") {
        const power = pick(ctx.rng, POWERS[step]);
        const a = drawDec3(ctx, randomInt(ctx.rng, 0, Math.min(2, 3 - (String(power).length - 1))) as 0 | 1 | 2, [10, 999]);
        left = `${dec3(a)} ÷ ${times(power)}`;
        value = a / power;
      } else if (form === "entier") {
        const { a, k } = timesInteger(ctx);
        left = `${dec3(a)} × ${k}`;
        value = a * k;
      } else {
        const pair = timesDecimal(ctx);
        if (pair.a === 0 || pair.b === 0) continue;
        left = `${dec3(pair.a)} × ${dec3(pair.b)}`;
        value = (pair.a * pair.b) / 1000;
      }
      if (seen.has(left) || seen.has(dec3(value))) continue;
      seen.add(left);
      seen.add(dec3(value));
      pairs.push({ left, right: dec3(value) });
    }
    return {
      prompt: "Relie chaque calcul à son résultat.",
      pairs,
      hints: ["Décide d'abord si le résultat est plus grand ou plus petit que le nombre de départ.", "Compte les rangs dont la virgule avance ou recule.", "Commence par le calcul dont tu es le plus sûr."],
    };
  });
}

/** « Glisse chaque calcul dans la bonne case. » : deux calculs qui agrandissent le nombre de départ, deux qui le rendent plus petit. */
export function makeCm2DcmSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-dcm-glisser", "dire si un résultat est plus grand ou plus petit que le nombre de départ", () => {
    const base = baseNumber(ctx);
    const all = expressionsOf(base, POWERS[stepOf(ctx)]);
    const big = shuffle(ctx.rng, all.filter((e) => e.value > base)).slice(0, 2);
    const small = shuffle(ctx.rng, all.filter((e) => e.value < base)).slice(0, 2);
    const zones: readonly [string, string] = [`Plus grand que ${dec3(base)}`, `Plus petit que ${dec3(base)}`];
    return {
      prompt: "Glisse chaque calcul dans la bonne case.",
      zones,
      items: [...big.map((e) => ({ text: e.text, zone: zones[0] })), ...small.map((e) => ({ text: e.text, zone: zones[1] }))],
      hints: ["Multiplier par dix, cent ou mille agrandit le nombre.", "Diviser par dix, cent ou mille le rend plus petit.", "Regarde le signe du calcul, pas les chiffres."],
    };
  });
}
