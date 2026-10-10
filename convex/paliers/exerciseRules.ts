/**
 * UN EXERCICE DE PALIER, CÔTÉ ENFANT : CE QU'IL VOIT, ET COMMENT ON JUGE SA
 * RÉPONSE.
 *
 * MODULE PUR, PARTAGÉ PAR LE SERVEUR ET L'APPAREIL. Le serveur s'en sert pour
 * rendre un exercice sans sa réponse (`paliers.getExercisesForPalier`) et pour
 * juger une réponse (`palierAttempts.verifyAttempt`, la synchronisation
 * `offline/sync.ts`). L'application s'en sert pour jouer un palier sans réseau
 * (`lib/offline/palier-session.ts`) : la même règle des deux côtés, sinon
 * l'enfant lirait « bravo » sur son téléphone et « faux » dans son bulletin.
 *
 * Ni base, ni `ctx`, ni import de Convex : le paquet de l'écran l'embarque.
 */
import { numericallyEqual } from "./mathRepair";
import { verifyDragDrop, verifyMatch } from "./answerCheck";
import type { ExerciseType } from "../exerciseTypes";
import {
  BLANK_MARK,
  EMPTY_CELL,
  splitBlanks,
  type ColorMixPayload,
  type FillBlankPayload,
  type ListenPayload,
  type PatternPayload,
  type PixelArtPayload,
} from "./games/types";

export type { ExerciseType };

/** Ce qu'il faut d'un exercice pour le juger ou le montrer. */
export type ExerciseForPlayer = {
  type: ExerciseType | string;
  payload: unknown;
};

// ===========================================================================
// JUGER UNE RÉPONSE
// ===========================================================================

/** La réponse de l'enfant est-elle juste ? Jamais d'exception : un format inattendu est faux. */
export function verifyAnswer(exercise: ExerciseForPlayer, submitted: string): boolean {
  switch (exercise.type) {
    case "qcm":
      return verifyQcm(submitted, exercise.payload as { correctIndex: number });
    case "match":
      return verifyMatch(submitted, exercise.payload as { pairs: { left: string; right: string }[] });
    case "order":
      return verifyOrder(submitted, exercise.payload as { correctSequence: string[] });
    case "drag-drop":
      return verifyDragDrop(
        submitted,
        exercise.payload as { items: { text: string; correctZone: string }[] },
      );
    case "short-answer":
      return verifyShortAnswer(submitted, exercise.payload as { acceptedAnswers: string[] });
    case "fill-blank":
      return verifyFillBlank(submitted, exercise.payload as FillBlankPayload);
    case "pattern":
      return verifyPattern(submitted, exercise.payload as PatternPayload);
    case "pixel-art":
      return verifyPixelArt(submitted, exercise.payload as PixelArtPayload);
    case "listen":
      return verifyQcm(submitted, exercise.payload as ListenPayload);
    case "color-mix":
      return verifyColorMix(submitted, exercise.payload as ColorMixPayload);
    default:
      return false;
  }
}

/** Un tableau JSON de chaînes, ou `null` : une réponse mal formée est fausse. */
function parseStringArray(submitted: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(submitted);
    if (!Array.isArray(parsed)) return null;
    if (!parsed.every((item) => typeof item === "string")) return null;
    return parsed as string[];
  } catch {
    return null;
  }
}

/**
 * Deux mots d'une phrase à trous se comparent sans les espaces du bord ni
 * les doublons d'espaces, et l'apostrophe typographique vaut la droite :
 * l'enfant CHOISIT un mot proposé, il ne le tape pas, donc la casse compte
 * (« Est » en début de phrase n'est pas « est »).
 */
function sameWord(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.replace(/[’‘]/g, "'").replace(/[\s  ]+/g, " ").trim();
  return norm(a) === norm(b);
}

function verifyFillBlank(submitted: string, payload: FillBlankPayload): boolean {
  const chosen = parseStringArray(submitted);
  const blanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
  if (!chosen || blanks.length === 0 || chosen.length !== blanks.length) return false;
  return blanks.every((blank, i) => typeof blank?.answer === "string" && sameWord(chosen[i], blank.answer));
}

function verifyPattern(submitted: string, payload: PatternPayload): boolean {
  const chosen = parseStringArray(submitted);
  const answers = Array.isArray(payload?.answers) ? payload.answers : [];
  if (!chosen || answers.length === 0 || chosen.length !== answers.length) return false;
  return answers.every((answer, i) => chosen[i] === answer);
}

/**
 * Le dessin de l'enfant contre le dessin attendu, case par case. Une case
 * qui ne porte aucune couleur de la palette vaut une case vide : un écran qui
 * enverrait un espace ou un tiret pour « vide » ne fait pas échouer l'enfant.
 */
function verifyPixelArt(submitted: string, payload: PixelArtPayload): boolean {
  const rows = parseStringArray(submitted);
  const target = Array.isArray(payload?.target) ? payload.target : [];
  if (!rows || target.length === 0 || rows.length !== target.length) return false;
  const keys = new Set((payload.palette ?? []).map((paint) => paint.key));
  const normalizeRow = (row: string, width: number) =>
    Array.from({ length: width }, (_, i) => {
      const cell = row[i] ?? EMPTY_CELL;
      return keys.has(cell) ? cell : EMPTY_CELL;
    }).join("");
  return target.every((expected, i) => {
    const width = expected.length;
    if (rows[i].length !== width) return false;
    return normalizeRow(rows[i], width) === normalizeRow(expected, width);
  });
}

/** Une couleur ou un mélange : les noms, dans n'importe quel ordre pour un mélange. */
function verifyColorMix(submitted: string, payload: ColorMixPayload): boolean {
  const chosen = parseStringArray(submitted);
  const answer = Array.isArray(payload?.answer) ? payload.answer : [];
  if (!chosen || answer.length === 0 || chosen.length !== answer.length) return false;
  const sorted = (names: string[]) => [...names].map((n) => n.trim().toLowerCase()).sort();
  const a = sorted(chosen);
  const b = sorted(answer);
  return a.every((name, i) => name === b[i]);
}

function verifyQcm(submitted: string, payload: { correctIndex: number }): boolean {
  return parseInt(submitted, 10) === payload?.correctIndex;
}

function verifyOrder(submitted: string, payload: { correctSequence: string[] }): boolean {
  try {
    const arr: string[] = JSON.parse(submitted);
    const expected = payload?.correctSequence;
    if (!Array.isArray(arr) || !Array.isArray(expected)) return false;
    if (arr.length !== expected.length) return false;
    return arr.every((it, i) => it === expected[i]);
  } catch {
    return false;
  }
}

function verifyShortAnswer(
  submitted: string,
  payload: { acceptedAnswers: string[] },
): boolean {
  // « 2,5 » et « 2.5 », « 1 000 » et « 1000 » : la même réponse. On compare
  // des formes canoniques, sans exiger du modèle toutes les variantes. Et
  // « 18 m » vaut « 18 », « 60% » vaut « 0,6 » : deux formes numériques qui
  // disent le même nombre (`numericallyEqual`). Une fraction, elle, se
  // compare à l'identique : « 1/2 » n'accepte pas « 0,5 ».
  const norm = canonicalAnswer(submitted);
  return (payload?.acceptedAnswers ?? []).some(
    (a) => canonicalAnswer(a) === norm || numericallyEqual(a, submitted),
  );
}

export function canonicalAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/(\d)[\s\u00a0\u202f]+(?=\d)/g, "$1")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, " ");
}

/**
 * La bonne réponse, écrite pour un enfant : ce que l'écran montre quand il
 * n'a pas d'explication pas à pas (sans réseau, « Je veux comprendre » ne
 * peut pas en demander une). `null` quand l'exercice ne s'y prête pas.
 */
export function correctAnswerText(exercise: ExerciseForPlayer): string | null {
  const p = (exercise.payload ?? {}) as Record<string, unknown>;
  switch (exercise.type) {
    case "qcm": {
      const options = Array.isArray(p.options) ? (p.options as unknown[]) : [];
      const index = typeof p.correctIndex === "number" ? p.correctIndex : -1;
      const option = options[index];
      return typeof option === "string" ? option : null;
    }
    case "short-answer": {
      const answers = Array.isArray(p.acceptedAnswers) ? (p.acceptedAnswers as unknown[]) : [];
      const first = answers.find((a): a is string => typeof a === "string" && a.trim() !== "");
      return first ?? null;
    }
    case "order": {
      const seq = Array.isArray(p.correctSequence) ? (p.correctSequence as unknown[]) : [];
      return seq.length > 0 ? seq.map(String).join(" → ") : null;
    }
    case "match": {
      const pairs = Array.isArray(p.pairs) ? (p.pairs as { left?: unknown; right?: unknown }[]) : [];
      return pairs.length > 0
        ? pairs.map((pair) => `${String(pair.left)} ↔ ${String(pair.right)}`).join(" · ")
        : null;
    }
    case "drag-drop": {
      const items = Array.isArray(p.items) ? (p.items as { text?: unknown; correctZone?: unknown }[]) : [];
      return items.length > 0
        ? items.map((item) => `${String(item.text)} → ${String(item.correctZone)}`).join(" · ")
        : null;
    }
    case "fill-blank": {
      // La phrase complète, chaque trou rempli par son mot.
      const text = typeof p.text === "string" ? p.text : "";
      const blanks = Array.isArray(p.blanks) ? (p.blanks as { answer?: unknown }[]) : [];
      const parts = splitBlanks(text);
      if (!text || blanks.length === 0 || parts.length !== blanks.length + 1) return null;
      return parts
        .map((part, i) => (i < blanks.length ? `${part}${String(blanks[i].answer ?? BLANK_MARK)}` : part))
        .join("");
    }
    case "pattern": {
      const answers = Array.isArray(p.answers) ? (p.answers as unknown[]).map(String) : [];
      return answers.length > 0 ? answers.join(" ") : null;
    }
    case "listen": {
      const options = Array.isArray(p.options) ? (p.options as unknown[]) : [];
      const index = typeof p.correctIndex === "number" ? p.correctIndex : -1;
      const option = options[index];
      return typeof option === "string" ? option : null;
    }
    case "color-mix": {
      const answer = Array.isArray(p.answer) ? (p.answer as unknown[]).map(String) : [];
      return answer.length > 0 ? answer.join(" + ") : null;
    }
    // Un dessin ne s'écrit pas en une phrase : l'écran garde le modèle.
    case "pixel-art":
    default:
      return null;
  }
}

// ===========================================================================
// CE QUE L'ENFANT VOIT — l'exercice sans sa réponse (Décision 61).
// ===========================================================================

export type AnswerInputMode = "numeric" | "decimal" | "text";

/** Entier (« 18 », « -3 »), décimal (« 2,5 », « 3.75 ») ou texte : le clavier suit. */
export function inputModeFor(acceptedAnswers: unknown): AnswerInputMode {
  const answers = Array.isArray(acceptedAnswers)
    ? acceptedAnswers.filter((a): a is string => typeof a === "string").map((a) => a.trim())
    : [];
  if (answers.length === 0) return "text";
  if (answers.every((a) => /^-?\d+$/.test(a))) return "numeric";
  if (answers.every((a) => /^-?\d+([.,]\d+)?$/.test(a))) return "decimal";
  return "text";
}

/**
 * Le payload que l'écran affiche : sans la réponse, et mélangé de façon
 * reproductible (Décision 75). La graine porte la tentative et l'exercice :
 * la même tentative remontre les tuiles dans le même ordre, une autre les
 * mélange autrement. `seedPrefix` est l'identifiant de la tentative, celle du
 * serveur ou celle de la séance jouée sur l'appareil.
 */
export function sanitizePayload(
  type: ExerciseForPlayer["type"],
  payload: unknown,
  exerciseId: string,
  seedPrefix: string,
): unknown {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;

  switch (type) {
    case "qcm":
      return {
        options: p.options ?? [],
        // correctIndex stripped — submitted answers go through verifyAttempt
      };
    case "match": {
      const pairs = (p.pairs as Array<{ left: string; right: string }>) ?? [];
      const left = pairs.map((x) => x.left);
      const right = pairs.map((x) => x.right);
      // Shuffle right column with deterministic seed.
      const seed = `${seedPrefix}:${exerciseId}:right`;
      return { left, right: shuffleDeterministic(right, seed) };
    }
    case "order": {
      const seq = (p.correctSequence as string[]) ?? [];
      const seed = `${seedPrefix}:${exerciseId}:order`;
      return { items: shuffleDeterministic(seq, seed) };
    }
    case "drag-drop": {
      const items = (p.items as Array<{ text: string; correctZone: string }>) ?? [];
      const zones = (p.zones as string[]) ?? [];
      const seed = `${seedPrefix}:${exerciseId}:dd`;
      return {
        zones,
        items: shuffleDeterministic(
          items.map((it) => ({ text: it.text })),
          seed,
        ),
      };
    }
    case "short-answer":
      return {
        // No accepted answers exposed — verifyAttempt enforces.
        tolerance: p.tolerance ?? null,
        // LE CLAVIER À OUVRIR, déduit des réponses attendues sans les
        // révéler : un nombre entier ouvre le pavé numérique, un nombre à
        // virgule le pavé décimal, le reste le clavier des lettres. Calculé
        // à la lecture, donc vrai aussi pour les exercices déjà générés.
        inputMode: inputModeFor(p.acceptedAnswers),
      };
    case "fill-blank": {
      const blanks = Array.isArray(p.blanks) ? (p.blanks as { options?: unknown }[]) : [];
      return {
        text: typeof p.text === "string" ? p.text : "",
        // Chaque trou mélange ses mots à sa façon : la bonne réponse n'est
        // pas toujours la première.
        blanks: blanks.map((blank, i) => ({
          options: shuffleDeterministic(
            Array.isArray(blank?.options) ? blank.options.filter((o): o is string => typeof o === "string") : [],
            `${seedPrefix}:${exerciseId}:blank:${i}`,
          ),
        })),
      };
    }
    case "pattern":
      return {
        sequence: Array.isArray(p.sequence)
          ? p.sequence.map((token) => (typeof token === "string" ? token : null))
          : [],
        options: shuffleDeterministic(
          Array.isArray(p.options) ? p.options.filter((o): o is string => typeof o === "string") : [],
          `${seedPrefix}:${exerciseId}:pattern`,
        ),
      };
    case "pixel-art":
      return sanitizePixelArt(p as unknown as PixelArtPayload);
    case "listen":
      // Les sons doivent partir vers l'écran pour être joués ; la bonne
      // option, non.
      return {
        clips: Array.isArray(p.clips) ? p.clips : [],
        options: Array.isArray(p.options) ? p.options : [],
      };
    case "color-mix": {
      const choices = Array.isArray(p.choices) ? p.choices : [];
      return {
        mode: p.mode,
        choices: shuffleDeterministic(choices, `${seedPrefix}:${exerciseId}:paints`),
        ...(Array.isArray(p.given) ? { given: p.given } : {}),
        ...(p.target && typeof p.target === "object" ? { target: p.target } : {}),
      };
    }
    default:
      return {};
  }
}

/**
 * Le dessin sans sa réponse — sauf quand la réponse EST la consigne :
 * reproduire un modèle, c'est le regarder. La symétrie ne montre que sa
 * moitié, le coloriage magique ses numéros.
 */
function sanitizePixelArt(p: PixelArtPayload) {
  const base = {
    mode: p.mode,
    width: p.width,
    height: p.height,
    palette: Array.isArray(p.palette) ? p.palette : [],
  };
  switch (p.mode) {
    case "copy":
      return { ...base, model: p.target };
    case "memory":
      return { ...base, model: p.target, showSeconds: p.showSeconds ?? 5 };
    case "symmetry":
      return { ...base, given: p.given ?? [], axis: p.axis ?? "vertical" };
    case "number":
      return { ...base, numbers: p.numbers ?? [] };
    default:
      return base;
  }
}

/**
 * Deterministic Fisher-Yates with a string-seeded PRNG (mulberry32 + FNV-1a).
 * Pure, no crypto imports. Decision 75.
 */
export function shuffleDeterministic<T>(arr: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Un tirage reproductible : la même graine rend la même suite de nombres
 * entre 0 et 1. Les jeux (`paliers/games`) s'en servent pour qu'un palier
 * régénéré avec la même graine retombe sur les mêmes exercices.
 */
export function seededRandom(seed: string): () => number {
  return mulberry32(fnv1a(seed));
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
