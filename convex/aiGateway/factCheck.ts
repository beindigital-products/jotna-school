/**
 * AI Gateway — fact-check for math exercises.
 *
 * Decision 53 + 71 + 72:
 *   1. The model emits a structured `mathExpression` string per numeric exo.
 *   2. We parse it with a minimal AST (no `eval`, no `Function`) supporting:
 *        + - * × · / ÷ ( ) decimals fractions
 *        unary minus
 *        whitespace & unicode operators
 *   3. We compare `evaluate(expression)` to the model's `correctAnswer`. On
 *      divergence (>EPSILON or unparseable), the action layer either:
 *        - flags `needsManualReview = true` and re-asks the model (max 2
 *          retries), or
 *        - falls back to a one-shot `verify_math` LLM call (~$0.001/check).
 *
 * Pure module — safe to import from anywhere.
 */

const EPSILON = 1e-6;

export type FactCheckOutcome =
  | { ok: true; computed: number; expected: number }
  | { ok: false; reason: "parse_error"; expression: string }
  | { ok: false; reason: "divergence"; computed: number; expected: number }
  | { ok: false; reason: "answer_not_numeric"; expected: string };

/** Top-level: verify (mathExpression, correctAnswer) pair. */
export function checkMathExercise(
  mathExpression: string | null | undefined,
  correctAnswer: string,
): FactCheckOutcome {
  if (!mathExpression || mathExpression.trim() === "") {
    return { ok: false, reason: "parse_error", expression: mathExpression ?? "" };
  }
  const expectedNum = parseAnswerNumber(correctAnswer);
  if (expectedNum === null) {
    return { ok: false, reason: "answer_not_numeric", expected: correctAnswer };
  }
  let computed: number;
  try {
    computed = evaluateExpression(mathExpression);
  } catch {
    return { ok: false, reason: "parse_error", expression: mathExpression };
  }
  if (!Number.isFinite(computed)) {
    return { ok: false, reason: "parse_error", expression: mathExpression };
  }
  if (Math.abs(computed - expectedNum) <= EPSILON) {
    return { ok: true, computed, expected: expectedNum };
  }
  return { ok: false, reason: "divergence", computed, expected: expectedNum };
}

/**
 * Parse a numeric answer string. Supports plain numbers, decimals with `.` or
 * `,`, simple fractions `a/b`, and trailing units (we strip non-digit suffixes
 * after a successful number prefix).
 */
export function parseAnswerNumber(raw: string): number | null {
  if (raw === null || raw === undefined) return null;
  const cleaned = raw
    .toString()
    .trim()
    .replace(/\s/g, "")
    .replace(/,/g, ".");
  if (cleaned === "") return null;
  // fraction a/b
  const fracMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den === 0) return null;
    return num / den;
  }
  // leading number
  const numMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)/);
  if (!numMatch) return null;
  const n = Number(numMatch[1]);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// AST evaluator — recursive descent. Operators: + - * / and parentheses.
// Unicode operators (× · ÷) and explicit fractions are normalised first.
// ---------------------------------------------------------------------------

interface ParserState {
  src: string;
  i: number;
}

export function evaluateExpression(input: string): number {
  const normalised = input
    .replace(/×|·|✕|✖/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
  const state: ParserState = { src: normalised, i: 0 };
  const result = parseExpression(state);
  if (state.i !== state.src.length) {
    throw new Error(`Unexpected token at index ${state.i}: ${state.src.slice(state.i)}`);
  }
  return result;
}

function parseExpression(s: ParserState): number {
  let value = parseTerm(s);
  while (s.i < s.src.length) {
    const c = s.src[s.i];
    if (c === "+" || c === "-") {
      s.i++;
      const right = parseTerm(s);
      value = c === "+" ? value + right : value - right;
    } else {
      break;
    }
  }
  return value;
}

function parseTerm(s: ParserState): number {
  let value = parsePower(s);
  while (s.i < s.src.length) {
    const c = s.src[s.i];
    if (c === "*" || c === "/") {
      s.i++;
      const right = parsePower(s);
      if (c === "/") {
        if (right === 0) throw new Error("Division by zero");
        value = value / right;
      } else {
        value = value * right;
      }
    } else {
      break;
    }
  }
  return value;
}

/** `a ^ b`, associatif à droite : « 2^3^2 » vaut 2^9. */
function parsePower(s: ParserState): number {
  const base = parseFactor(s);
  if (s.src[s.i] === "^") {
    s.i++;
    const exponent = parsePower(s);
    return Math.pow(base, exponent);
  }
  return base;
}

function parseFactor(s: ParserState): number {
  if (s.i >= s.src.length) throw new Error("Unexpected end of expression");
  const c = s.src[s.i];
  if (c === "+") {
    s.i++;
    return parsePower(s);
  }
  if (c === "-") {
    s.i++;
    return -parsePower(s);
  }
  if (c === "√") {
    s.i++;
    return Math.sqrt(parsePower(s));
  }
  if (c === "(") {
    s.i++;
    const value = parseExpression(s);
    if (s.src[s.i] !== ")") throw new Error(`Expected )`);
    s.i++;
    return value;
  }
  return parseNumber(s);
}

function parseNumber(s: ParserState): number {
  const start = s.i;
  while (s.i < s.src.length && /[0-9.]/.test(s.src[s.i])) s.i++;
  if (start === s.i) throw new Error(`Expected number at index ${start}`);
  const raw = s.src.slice(start, s.i);
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Bad number: ${raw}`);
  return n;
}
