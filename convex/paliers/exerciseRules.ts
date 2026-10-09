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

export type ExerciseType = "qcm" | "drag-drop" | "match" | "order" | "short-answer";

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
    default:
      return false;
  }
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
    default:
      return {};
  }
}

/**
 * Deterministic Fisher-Yates with a string-seeded PRNG (mulberry32 + FNV-1a).
 * Pure, no crypto imports. Decision 75.
 */
export function shuffleDeterministic<T>(arr: T[], seed: string): T[] {
  const rng = mulberry32(fnv1a(seed));
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
