/**
 * RÉPARER LA RÉPONSE ATTENDUE D'UN EXERCICE DE MATHÉMATIQUES.
 *
 * Le modèle écrit deux choses par exercice numérique : l'expression à
 * calculer (`mathExpression`, « 3 × 5 + 2 ») et la réponse qu'il croit juste
 * (« 15 »). Il se trompe régulièrement sur la seconde, surtout quand deux
 * opérations se combinent, et jusqu'ici on servait quand même l'exercice à
 * l'enfant, en le marquant « à relire » dans une table que personne n'ouvre.
 * Un élève qui répondait 17 (la bonne valeur) était compté faux. Pire, sur
 * un QCM, `correctIndex` pointe souvent une autre option que la réponse
 * écrite (« 5 × 6 » : réponse 30, index sur 36).
 *
 * Ici, l'arithmétique a raison sur le modèle : on calcule, et si ce que
 * l'exercice tient pour juste diverge, on réécrit la clé de correction et le
 * payload avec la valeur calculée. Un QCM pointe l'option qui vaut le
 * résultat, ou reçoit le résultat à la place de l'option fausse ; une
 * réponse courte accepte le résultat (et sa forme à virgule).
 *
 * D'OÙ VIENT LA VALEUR CALCULÉE, dans l'ordre :
 *
 *   1. L'égalité à trou écrite dans l'énoncé (« Complète : ? × 6 = 24 ») :
 *      c'est la vérité de l'exercice, on la résout en remontant l'opération.
 *   2. Sinon `mathExpression`, évaluée avec les priorités usuelles. Deux
 *      lectures prudentes : quand l'énoncé a un trou et que la réponse du
 *      modèle figure comme opérande (« 4 × 4 = 16 » pour « ? × 4 = 16 »),
 *      l'expression est l'énoncé rempli, on vérifie sa cohérence sans en
 *      prendre la valeur ; quand l'énoncé est un problème en mots, une
 *      expression écrite de gauche à droite (« 24 − 10 − 10 ÷ 2 » pour une
 *      largeur de 2) compte aussi, le modèle raconte un calcul plus qu'il ne
 *      l'écrit.
 *
 * Les clés en fraction (« 3/4 ») ne sont jamais remplacées par un décimal.
 * L'algèbre, les racines, π, les logarithmes sont laissés tels quels,
 * signalés. Une `tolerance` déclarée dans le payload est respectée.
 *
 * Module pur, sans Convex : il sert à la génération, à la réparation en base
 * (`paliers/pregen:repairMath`), à la vérification d'une réponse courte et
 * aux tests.
 */
import { evaluateExpression, parseAnswerNumber } from "../aiGateway/factCheck";

const EPSILON = 1e-6;

export type MathRepairInput = {
  type: string;
  /** L'énoncé : une égalité à trou dedans fait foi. */
  prompt?: string;
  payload: unknown;
  answerKey: string;
  mathExpression: string | null | undefined;
};

export type MathRepairOutcome =
  /** Pas d'expression, type sans réponse numérique, ou clé non numérique. */
  | { kind: "skipped" }
  /** La réponse attendue vaut le calcul, et le payload la désigne bien. */
  | { kind: "ok"; computed: number }
  /**
   * Corrigé. `previous` est ce que l'exercice tenait pour juste (l'option
   * pointée, la clé, les formes acceptées fausses) ; `change` dit quoi :
   * `option` (l'index du QCM bouge vers l'option qui vaut le résultat),
   * `value` (le résultat remplace une valeur fausse), `key` (seule la clé de
   * correction était fausse, le payload était juste).
   */
  | {
      kind: "repaired";
      computed: number;
      previous: string;
      answerKey: string;
      payload: Record<string, unknown>;
      change: "option" | "value" | "key";
    }
  /**
   * Divergence qu'on ne sait pas corriger : l'exercice reste à relire.
   * `parse_error` : expression illisible. `fraction` : une clé en fraction
   * qui diverge. `inconsistent` : l'énoncé rempli par le modèle est faux, et
   * rien ne dit où était le trou.
   */
  | {
      kind: "unrepairable";
      reason: "parse_error" | "fraction" | "inconsistent";
      computed?: number;
    };

export function repairMathExercise(input: MathRepairInput): MathRepairOutcome {
  const expression = input.mathExpression?.trim() ?? "";
  if (expression === "") return { kind: "skipped" };
  if (input.type !== "qcm" && input.type !== "short-answer") return { kind: "skipped" };
  const key = input.answerKey.trim();
  if (!isNumericForm(key) && !isFraction(key)) return { kind: "skipped" };
  const keyValue = parseAnswerNumber(stripGroupSpaces(key));
  if (keyValue === null) return { kind: "skipped" };

  const payload =
    input.payload && typeof input.payload === "object"
      ? (input.payload as Record<string, unknown>)
      : {};
  const tolerance = declaredTolerance(payload, keyValue);
  const prompt = input.prompt ?? "";

  let computed = solveFromPrompt(prompt);
  if (computed === null) {
    const fromExpression = solveOrEvaluate(expression);
    if (fromExpression === null) return { kind: "unrepairable", reason: "parse_error" };
    const normalised = normalise(expression);
    if (
      !normalised.includes("?") &&
      (promptHasBlank(prompt) || normalised.includes("=")) &&
      isOperandOf(expression, keyValue)
    ) {
      // L'énoncé rempli par le modèle (« 7 × 4 = 28 » pour « quel nombre
      // multiplié par 4 donne 28 ») : sa cohérence est tout ce qu'on peut
      // vérifier, sa valeur n'est pas la réponse.
      return isConsistent(expression)
        ? { kind: "ok", computed: keyValue }
        : { kind: "unrepairable", reason: "inconsistent" };
    }
    computed = fromExpression;
    // « 10 ÷ 3 » pour « combien de mangues à 3 FCFA avec 10 FCFA » : dans
    // un problème en mots, la réponse est le quotient entier, pas 3,33.
    if (
      !promptIsSymbolic(prompt) &&
      /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(normalised) &&
      !Number.isInteger(computed) &&
      Number.isInteger(keyValue) &&
      Math.floor(computed) === keyValue
    ) {
      computed = keyValue;
    }
    if (!valueEquals(key, computed, tolerance) && !promptIsSymbolic(prompt)) {
      const sequential = evaluateLeftToRight(normalise(expression));
      if (sequential !== null && valueEquals(key, sequential, tolerance)) computed = sequential;
    }
  }

  const keyMatches = valueEquals(key, computed, tolerance);
  const answerKey = formatNumber(computed);

  if (input.type === "qcm") {
    const options = Array.isArray(payload.options)
      ? payload.options.filter((o): o is string => typeof o === "string")
      : [];
    const correctIndex = typeof payload.correctIndex === "number" ? payload.correctIndex : -1;
    if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) {
      return { kind: "skipped" };
    }
    const pointed = options[correctIndex];
    if (valueEquals(pointed, computed, tolerance)) {
      if (keyMatches) return { kind: "ok", computed };
      return {
        kind: "repaired",
        computed,
        previous: key,
        answerKey,
        payload: withoutExplanation(payload),
        change: "key",
      };
    }
    if (!keyMatches && isFraction(key)) {
      return { kind: "unrepairable", reason: "fraction", computed };
    }
    const matchIndex = closestOption(options, computed, tolerance);
    if (matchIndex >= 0) {
      return {
        kind: "repaired",
        computed,
        previous: pointed,
        answerKey,
        payload: { ...withoutExplanation(payload), options, correctIndex: matchIndex },
        change: "option",
      };
    }
    // Aucune option ne vaut le résultat : l'option pointée prend la bonne
    // valeur (avec son unité), les distracteurs restent. Sauf parmi des
    // fractions : on n'écrit pas « 1.166667 » à côté de « 2/3 ».
    if (options.some(isFraction) || isFraction(key)) {
      return { kind: "unrepairable", reason: "fraction", computed };
    }
    const nextOptions = [...options];
    nextOptions[correctIndex] = withUnitOf(pointed, answerKey);
    return {
      kind: "repaired",
      computed,
      previous: pointed,
      answerKey,
      payload: { ...withoutExplanation(payload), options: nextOptions, correctIndex },
      change: "value",
    };
  }

  const accepted = Array.isArray(payload.acceptedAnswers)
    ? payload.acceptedAnswers.filter((a): a is string => typeof a === "string")
    : [];
  if (!keyMatches) {
    if (isFraction(key) || accepted.some(isFraction)) {
      return { kind: "unrepairable", reason: "fraction", computed };
    }
    return {
      kind: "repaired",
      computed,
      previous: key,
      answerKey,
      payload: { ...withoutExplanation(payload), acceptedAnswers: acceptedForms(computed) },
      change: "value",
    };
  }
  // La clé est juste ; une forme acceptée peut encore être fausse
  // (« 15 » et « 16 »). Les formes non numériques (« quinze ») restent.
  const wrong = accepted.filter(
    (a) => (isNumericForm(a) || isFraction(a)) && !valueEquals(a, computed, tolerance),
  );
  if (wrong.length === 0) return { kind: "ok", computed };
  const kept = accepted.filter((a) => !wrong.includes(a));
  return {
    kind: "repaired",
    computed,
    previous: wrong.join(", "),
    answerKey,
    payload: {
      ...withoutExplanation(payload),
      acceptedAnswers: kept.some((a) => valueEquals(a, computed, tolerance))
        ? kept
        : [...kept, ...acceptedForms(computed)],
    },
    change: "value",
  };
}

// ---------------------------------------------------------------------------
// Lire une réponse
// ---------------------------------------------------------------------------

/**
 * Un nombre, éventuellement suivi d'une unité (« 18 m », « 2000 FCFA »,
 * « 60% »). Pas une fraction, pas une expression, pas de l'algèbre
 * (« 8x + 12 », « 2√3 »).
 */
export function isNumericForm(raw: string): boolean {
  const whole = stripGroupSpaces(raw.trim());
  const rest = whole.replace(/^[-−]?\d+(?:[.,]\d+)?/, "");
  if (rest.length === whole.length) return false;
  return !/[\d+\-−*/×÷=^()?√]/.test(rest);
}

export function isFraction(raw: string): boolean {
  return /^-?\d+\s*\/\s*\d+$/.test(raw.trim());
}

/**
 * Deux réponses qui disent le même nombre : « 18 m » et « 18 », « 0,6 » et
 * « 60% », « 2,5 » et « 2.5 ». Seulement pour deux formes numériques ; une
 * fraction se compare à l'identique, ailleurs.
 */
export function numericallyEqual(a: string, b: string): boolean {
  if (!isNumericForm(a) || !isNumericForm(b)) return false;
  const va = parseAnswerNumber(stripGroupSpaces(a));
  const vb = parseAnswerNumber(stripGroupSpaces(b));
  if (va === null || vb === null) return false;
  const tol = Math.max(EPSILON, roundingTolerance(a), roundingTolerance(b));
  if (Math.abs(va - vb) <= tol) return true;
  const pa = isPercent(a) ? va / 100 : va;
  const pb = isPercent(b) ? vb / 100 : vb;
  return Math.abs(pa - pb) <= tol;
}

/** Une forme écrite vaut-elle le nombre calculé ? Tolère l'arrondi de ce qui est écrit. */
function valueEquals(raw: string, n: number, extra = 0): boolean {
  const v = parseAnswerNumber(stripGroupSpaces(raw));
  if (v === null) return false;
  const tol = Math.max(EPSILON, roundingTolerance(raw), extra);
  if (Math.abs(v - n) <= tol) return true;
  return isPercent(raw) && Math.abs(v / 100 - n) <= tol;
}

/** « 0,33 » écrit pour un tiers : une demi-unité de la dernière décimale. */
function roundingTolerance(raw: string): number {
  const m = stripGroupSpaces(raw.trim()).match(/^[-−]?\d+[.,](\d+)/);
  return m ? 0.5 * 10 ** -m[1].length : 0;
}

/** `tolerance` du payload : « 0.01 », « 1 », ou « 1% » (relatif à la clé). */
function declaredTolerance(payload: Record<string, unknown>, keyValue: number): number {
  const raw = payload.tolerance;
  if (typeof raw === "number") return Math.max(0, raw);
  if (typeof raw !== "string") return 0;
  const percent = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*%$/);
  if (percent) return Math.abs(keyValue) * (Number(percent[1].replace(",", ".")) / 100);
  const n = parseAnswerNumber(raw);
  return n === null ? 0 : Math.max(0, n);
}

function isPercent(raw: string): boolean {
  return /%\s*$/.test(raw.trim());
}

function stripGroupSpaces(raw: string): string {
  return raw.replace(/(\d)[\s  ]+(?=\d{3}(?!\d))/g, "$1");
}

/** Un nombre tel que l'enfant l'écrit : entier sans décimale, sinon un point. */
export function formatNumber(n: number): string {
  const rounded = Math.round(n * 1e6) / 1e6;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * Le résultat, et ses formes courantes : à virgule, et arrondi à deux
 * décimales quand il en a davantage (« 6666,67 » pour 8000 ÷ 1,2).
 */
export function acceptedForms(n: number): string[] {
  const exact = formatNumber(n);
  const forms = [exact];
  if (exact.includes(".")) {
    const short = String(Math.round(n * 100) / 100);
    if (short !== exact) forms.push(short);
    for (const f of [...forms]) forms.push(f.replace(".", ","));
  }
  return Array.from(new Set(forms));
}

/** « 2000 FCFA » devient « 1600 FCFA » : la valeur change, l'unité reste. */
function withUnitOf(previous: string, value: string): string {
  const m = previous.trim().match(/^[-−]?\d+(?:[.,]\d+)?(\s*)(.*)$/);
  if (!m || m[2] === "") return value;
  return `${value}${m[1]}${m[2]}`;
}

/** L'explication écrite par le modèle défend sa réponse fausse : on l'ôte. */
function withoutExplanation(payload: Record<string, unknown>): Record<string, unknown> {
  const { explanation: _dropped, ...rest } = payload;
  void _dropped;
  return rest;
}

// ---------------------------------------------------------------------------
// Lire l'énoncé
// ---------------------------------------------------------------------------

const BLANK = /[?…_]/;
const EQUATION_CHARS = /[\d?…_\s+\-−×x*÷/=(),]+/g;

/** L'égalité à trou écrite dans l'énoncé, résolue. `null` s'il n'y en a pas. */
export function solveFromPrompt(prompt: string): number | null {
  if (prompt === "") return null;
  for (const match of prompt.match(EQUATION_CHARS) ?? []) {
    let chunk = match.trim();
    if (!chunk.includes("=") || !BLANK.test(chunk)) continue;
    // « 2/5 de 25 = ? » laisse le bout « 25 = ? » : sans opération, ce
    // n'est pas une égalité à résoudre.
    if (!/[+\-−×x*÷/]/.test(chunk.replace(/^\s*-/, ""))) continue;
    // Le « ? » qui ferme la question n'est pas un trou.
    const trimmed = chunk.replace(/\s*\?\s*$/, "");
    if (BLANK.test(trimmed)) chunk = trimmed;
    const value = solveOrEvaluate(chunk);
    if (value !== null) return value;
  }
  return null;
}

/** L'énoncé demande de remplir un trou : un « ? » collé à une opération. */
function promptHasBlank(prompt: string): boolean {
  return /[?…_]\s*[+\-−×x*÷/=]|[+\-−×x*÷/=]\s*[?…_]/.test(prompt);
}

/** L'énoncé écrit lui-même l'opération en symboles : les priorités s'imposent. */
function promptIsSymbolic(prompt: string): boolean {
  if (prompt === "") return true;
  return /[×÷*/]|\d\s*[+\-−]\s*\d/.test(prompt);
}

/**
 * La valeur figure parmi les opérandes de l'expression. Dans « 7 × 4 = 28 »,
 * 28 n'est pas un opérande : c'est le résultat, le côté sans opération.
 */
function isOperandOf(expression: string, value: number): boolean {
  const sides = normalise(expression)
    .split("=")
    .filter((side) => /[+\-*/^]/.test(side.replace(/^-/, "")));
  const numbers = sides.join("=").match(/\d+(?:\.\d+)?/g) ?? [];
  return numbers.some((n) => Math.abs(Number(n) - value) <= EPSILON);
}

/** L'option la plus proche du résultat, parmi celles qui le valent. -1 sinon. */
function closestOption(options: string[], computed: number, tolerance: number): number {
  let best = -1;
  let bestGap = Infinity;
  options.forEach((o, i) => {
    if (!valueEquals(o, computed, tolerance)) return;
    const v = parseAnswerNumber(stripGroupSpaces(o)) ?? computed;
    const gap = Math.min(Math.abs(v - computed), isPercent(o) ? Math.abs(v / 100 - computed) : Infinity);
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  });
  return best;
}

/** « 4 × 4 = 16 » : les deux côtés valent pareil. Sans « = », rien à redire. */
function isConsistent(expression: string): boolean {
  const src = normalise(expression);
  if (!src.includes("=")) return true;
  const sides = src.split("=");
  if (sides.length !== 2) return false;
  const a = safeEvaluate(sides[0]);
  const b = safeEvaluate(sides[1]);
  return a !== null && b !== null && Math.abs(a - b) <= EPSILON;
}

// ---------------------------------------------------------------------------
// Calculer, ou résoudre
// ---------------------------------------------------------------------------

/**
 * Valeur d'une expression, ou de l'inconnue d'une égalité à trou.
 *
 * « 3 × 5 + 2 » s'évalue. « ? × 6 = 24 », « 2 × (6 + ?) = 28 »,
 * « 25 − x = 15 » se résolvent en remontant l'opération, tant que
 * l'inconnue n'apparaît qu'une fois. « 7 × 8 = 56 » vaut l'énoncé (56),
 * même si le modèle a écrit une réponse fausse en face. `null` quand on ne
 * sait pas.
 */
export function solveOrEvaluate(expression: string): number | null {
  const src = normalise(expression);
  if (src === "") return null;
  if (!src.includes("=")) return src.includes("?") ? null : safeEvaluate(src);

  const sides = src.split("=");
  if (sides.length !== 2) return null;
  const [lhs, rhs] = sides;
  const lhsBlank = lhs.includes("?");
  const rhsBlank = rhs.includes("?");
  if (lhsBlank && rhsBlank) return null;
  if (!lhsBlank && !rhsBlank) {
    const a = safeEvaluate(lhs);
    const b = safeEvaluate(rhs);
    if (a === null || b === null) return null;
    if (Math.abs(a - b) <= EPSILON) return a;
    return /^-?\d+(?:\.\d+)?$/.test(rhs) ? a : null;
  }
  const target = safeEvaluate(lhsBlank ? rhs : lhs);
  if (target === null) return null;
  return solveFor(lhsBlank ? lhs : rhs, target, 0);
}

/** Remonte l'opération de tête jusqu'à l'inconnue. Une seule inconnue. */
function solveFor(expr: string, target: number, depth: number): number | null {
  if (depth > 12) return null;
  const e = stripOuterParens(expr);
  if (e === "?") return target;
  if ((e.match(/\?/g) ?? []).length !== 1) return null;
  const split = splitTopLevel(e);
  if (!split) return null;
  const { left, op, right } = split;
  if (left.includes("?")) {
    const b = safeEvaluate(right);
    if (b === null) return null;
    const next =
      op === "+"
        ? target - b
        : op === "-"
          ? target + b
          : op === "*"
            ? b === 0
              ? null
              : target / b
            : target * b;
    return next === null ? null : solveFor(left, next, depth + 1);
  }
  const a = safeEvaluate(left);
  if (a === null) return null;
  const next =
    op === "+"
      ? target - a
      : op === "-"
        ? a - target
        : op === "*"
          ? a === 0
            ? null
            : target / a
          : target === 0
            ? null
            : a / target;
  return next === null ? null : solveFor(right, next, depth + 1);
}

/** Coupe à l'opérateur de plus faible priorité, hors parenthèses, le plus à droite. */
function splitTopLevel(e: string): { left: string; op: string; right: string } | null {
  let depth = 0;
  let lastAdd = -1;
  let lastMul = -1;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0) {
      if (c === "+" || c === "-") {
        // Un signe en tête, ou juste après un opérateur : unaire, pas une coupe.
        const prev = i === 0 ? "" : e[i - 1];
        if (prev !== "" && !"+-*/(^".includes(prev)) lastAdd = i;
      } else if (c === "*" || c === "/") {
        lastMul = i;
      }
    }
  }
  const at = lastAdd >= 0 ? lastAdd : lastMul;
  if (at <= 0 || at >= e.length - 1) return null;
  return { left: e.slice(0, at), op: e[at], right: e.slice(at + 1) };
}

function stripOuterParens(e: string): string {
  let s = e;
  while (s.startsWith("(") && s.endsWith(")")) {
    let depth = 0;
    let closesAtEnd = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      if (depth === 0 && i < s.length - 1) {
        closesAtEnd = false;
        break;
      }
    }
    if (!closesAtEnd) break;
    s = s.slice(1, -1);
  }
  return s;
}

/**
 * Lecture de gauche à droite, sans priorité des opérations, parenthèses
 * respectées : « 24 − 10 − 10 ÷ 2 » vaut 2. Sur une expression normalisée.
 */
export function evaluateLeftToRight(src: string): number | null {
  if (src === "" || src.includes("?") || src.includes("=") || src.includes("^")) return null;
  const state = { src, i: 0 };
  try {
    const value = readSequence(state);
    return state.i === src.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function readSequence(s: { src: string; i: number }): number {
  let value = readOperand(s);
  while (s.i < s.src.length) {
    const op = s.src[s.i];
    if (op === ")") break;
    if (!"+-*/".includes(op)) throw new Error("operator");
    s.i++;
    const right = readOperand(s);
    if (op === "+") value += right;
    else if (op === "-") value -= right;
    else if (op === "*") value *= right;
    else {
      if (right === 0) throw new Error("division");
      value /= right;
    }
  }
  return value;
}

function readOperand(s: { src: string; i: number }): number {
  const c = s.src[s.i];
  if (c === "-") {
    s.i++;
    return -readOperand(s);
  }
  if (c === "+") {
    s.i++;
    return readOperand(s);
  }
  if (c === "(") {
    s.i++;
    const value = readSequence(s);
    if (s.src[s.i] !== ")") throw new Error("paren");
    s.i++;
    return value;
  }
  const m = s.src.slice(s.i).match(/^\d+(?:\.\d+)?/);
  if (!m) throw new Error("number");
  s.i += m[0].length;
  return Number(m[0]);
}

function normalise(expression: string): string {
  // « 3/4 ÷ 1/2 » : le trait est une fraction, le ÷ la division. Sans
  // parenthèses, la lecture usuelle donnerait 3/4/1/2. On isole les
  // fractions quand un ÷ ou un : marque la division.
  const withFractions = /[÷:]/.test(expression)
    ? expression.replace(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/g, "($1/$2)")
    : expression;
  return (
    withFractions
      // Une unité collée à un nombre (« 50g », « 3 cm », « 200 FCFA ») ne compte pas.
      .replace(/(?<=\d)\s*(?:FCFA|km|cm|mm|kg|min|ml|dl|cl|m|g|l|h|s)(?![\w])/g, "")
      .replace(/[×·✕✖]/g, "*")
      // « 3 x 4 », « 2 x ? » : le x sert de signe. « 2x + 3 » reste de l'algèbre.
      .replace(/(?<=[\d)?])\s*[xX]\s*(?=[\d(?])/g, "*")
      .replace(/[÷:]/g, "/")
      .replace(/[−–]/g, "-")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/(?:\.\.\.|…|_+|□|▢|\[\s*\]|\(\s*\))/g, "?")
      // L'inconnue écrite « x », seule : « 25 − x = 15 ».
      .replace(/(?<![\w.])[xX](?![\w.])/g, "?")
      // Une inconnue nommée (« 2 × (10 + largeur) ») : le seul mot de
      // l'expression. Deux mots différents, on ne devine pas.
      .replace(/[A-Za-zÀ-ÿ]{2,}/g, (word, offset: number, whole: string) => {
        const words = new Set((whole.match(/[A-Za-zÀ-ÿ]{2,}/g) ?? []).map((w) => w.toLowerCase()));
        return words.size === 1 ? "?" : word;
      })
      .replace(/,/g, ".")
      .replace(/\s+/g, "")
  );
}

function safeEvaluate(src: string): number | null {
  if (src === "" || src.includes("?")) return null;
  try {
    const value = evaluateExpression(src);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
