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
import { exerciseImageIdOf } from "../../lib/exercise-images";
import { sceneClipIdOf } from "../../lib/scene-clips";
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
      return verifyMatch(
        submitted,
        exercise.payload as {
          pairs: { left: string; right: string }[];
          accepted?: { left: string; right: string }[];
        },
      );
    case "order":
      return verifyOrder(submitted, exercise.payload as { correctSequence: string[] });
    case "drag-drop":
      return verifyDragDrop(
        submitted,
        exercise.payload as { items: { text: string; correctZone: string }[] },
      );
    case "short-answer":
      return judgeShortAnswer(submitted, exercise.payload as ShortAnswerPayload).correct;
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

type ShortAnswerPayload = { acceptedAnswers: string[]; exactSpelling?: boolean };

export type ShortAnswerVerdict = {
  correct: boolean;
  /**
   * La réponse est validée MAIS mal écrite : la graphie attendue, à montrer
   * à l'enfant (« Attention, tu as mal écrit »). `null` quand la réponse est
   * écrite comme attendu, ou fausse.
   */
  spelling: string | null;
};

/**
 * JUGER UNE RÉPONSE COURTE, SANS PUNIR L'ORTHOGRAPHE.
 *
 * Un enfant qui apprend à écrire tape « mangu » ou « ecole » : il a la bonne
 * idée, il se trompe de lettre. Refuser sa réponse lui apprend qu'il s'est
 * trompé de réponse, pas de lettre. On la VALIDE et on lui montre la bonne
 * graphie.
 *
 * Trois étages, du plus strict au plus large :
 *   1. identique à une réponse admise, à la casse, aux espaces et aux
 *      nombres près (« 2,5 » = « 2.5 », « 18 m » = « 18 ») : juste, sans note ;
 *   2. identique une fois les accents, la ponctuation et les tirets effacés
 *      (« ecole » pour « école ») : juste, avec note ;
 *   3. à une faute de frappe près — une lettre en trop, en moins, changée ou
 *      deux lettres échangées (« mangu » pour « mangue ») ; deux fautes à
 *      partir de 8 lettres : juste, avec note.
 *
 * LES LIMITES, POUR NE PAS VALIDER UNE VRAIE ERREUR. Un mot de moins de 4
 * lettres se juge à l'identique (« a » et « à », « on » et « ont » sont
 * deux réponses). Une réponse admise qui porte un chiffre se juge à
 * l'identique (« 12 » n'accepte pas « 13 »). Un exercice dont l'orthographe
 * EST la question (conjugaison, accord, homophone) pose `exactSpelling: true`
 * dans son payload : « mange » n'y accepte pas « manges ».
 */
export function judgeShortAnswer(submitted: string, payload: ShortAnswerPayload): ShortAnswerVerdict {
  const accepted = (Array.isArray(payload?.acceptedAnswers) ? payload.acceptedAnswers : []).filter(
    (a): a is string => typeof a === "string" && a.trim() !== "",
  );
  // « 2,5 » et « 2.5 », « 1 000 » et « 1000 » : la même réponse. On compare
  // des formes canoniques, sans exiger du modèle toutes les variantes. Et
  // « 18 m » vaut « 18 », « 60% » vaut « 0,6 » : deux formes numériques qui
  // disent le même nombre (`numericallyEqual`). Une fraction, elle, se
  // compare à l'identique : « 1/2 » n'accepte pas « 0,5 ».
  const exact = payload?.exactSpelling === true;
  const norm = canonicalAnswer(submitted);
  // « le maire » et « maire » disent la même chose : l'article de tête ne compte pas, sauf quand l'orthographe est la question.
  const sameAnswer = (a: string) => canonicalAnswer(a) === norm || (!exact && withoutArticle(canonicalAnswer(a)) === withoutArticle(norm));
  if (accepted.some((a) => sameAnswer(a) || numericallyEqual(a, submitted))) {
    return { correct: true, spelling: null };
  }
  if (exact) return { correct: false, spelling: null };

  const typedForms = [foldSpelling(submitted), foldSpelling(withoutArticle(norm))];
  if (typedForms[0].length < 2) return { correct: false, spelling: null };
  let best: { answer: string; distance: number } | null = null;
  for (const answer of accepted) {
    if (/\d/.test(answer)) continue;
    for (const expected of [foldSpelling(answer), foldSpelling(withoutArticle(canonicalAnswer(answer)))]) {
      if (expected.length < 4) continue;
      const allowed = expected.length >= 8 ? 2 : 1;
      for (const typed of typedForms) {
        const distance = editDistance(typed, expected);
        if (distance <= allowed && (!best || distance < best.distance)) {
          best = { answer: answer.trim(), distance };
        }
      }
    }
  }
  return best ? { correct: true, spelling: best.answer } : { correct: false, spelling: null };
}

/** L'article ou la préposition-article qui ouvre une réponse : « le », « la », « l' », « un », « une », « des », « du », « de la », « au », « aux », « à la ». */
const LEADING_ARTICLE = /^(?:à la |à l['’]\s*|au |aux |les |le |la |l['’]\s*|un |une |des |du |de la |de l['’]\s*|d['’]\s*)/;

/**
 * La réponse sans son article de tête, pour comparer « le maire » à « maire ». Un mot qui ne serait plus que de une ou deux lettres une
 * fois l'article ôté reste intact (« l'a », « la » : les homophones se jugent à l'identique).
 */
function withoutArticle(canonical: string): string {
  const stripped = canonical.replace(LEADING_ARTICLE, "");
  return stripped.replace(/[^\p{L}]/gu, "").length >= 3 ? stripped : canonical;
}

/** La graphie à montrer quand la réponse est juste mais mal écrite, sinon `null`. */
export function spellingNote(exercise: ExerciseForPlayer, submitted: string): string | null {
  if (exercise.type !== "short-answer") return null;
  return judgeShortAnswer(submitted, exercise.payload as ShortAnswerPayload).spelling;
}

/** Sans accents, majuscules, ponctuation ni tirets : la forme où deux graphies d'un mot se rejoignent. */
function foldSpelling(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Distance de Damerau (échange de deux lettres voisines compté pour une faute). */
function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
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
  const safe = sanitizePayloadByType(type, payload, exerciseId, seedPrefix);
  // L'image d'énoncé n'est pas un secret : l'écran l'affiche. Seul un
  // identifiant du catalogue passe (`lib/exercise-images.ts`). Le clip d'une
  // scène du CI (`payload.scene`, `lib/scene-clips.ts`) de même : il montre la
  // situation, pas la réponse.
  const image = exerciseImageIdOf(payload);
  const scene = sceneClipIdOf(payload);
  if (!safe || typeof safe !== "object" || (!image && !scene)) return safe;
  return { ...(safe as Record<string, unknown>), ...(image ? { image } : {}), ...(scene ? { scene } : {}) };
}

function sanitizePayloadByType(
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
