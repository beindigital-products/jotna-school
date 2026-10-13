/**
 * UNE QUESTION SANS SA SCÈNE : « Combien de billes as-tu ? » ET RIEN À L'ÉCRAN.
 *
 * Le 12 octobre 2026, un enfant de CI voyait « Combien de billes as-tu ? »,
 * un champ de réponse, et l'indice « Regarde tes billes. » Il n'y avait pas de
 * billes : le modèle écrit pour un manuel illustré, et l'écran n'affiche que le
 * texte de l'énoncé et les options. L'exercice était impossible à comprendre,
 * donc impossible à réussir, et un enfant de six ans ne sait pas que c'est la
 * faute de l'exercice.
 *
 * Deux gardes, sans appel au modèle :
 *
 *   1. `findMissingVisual` écarte un énoncé qui renvoie à ce qui n'est pas là :
 *      « combien de billes as-tu » sans un chiffre ni un émoji, « regarde
 *      l'image », « ci-dessous », « observe tes billes ». Les indices qui
 *      renvoient à une scène absente sont retirés (`withoutDanglingHints`).
 *   2. `repairEmojiCount` vérifie le compte des objets dessinés en émojis. La
 *      consigne de génération demande de dessiner ce qu'on fait compter
 *      (« 🔵🔵🔵🔵🔵 »), et un modèle de langage compte mal ses émojis : la
 *      réponse attendue devient le nombre d'émojis réellement écrits.
 *
 * Module pur, sans Convex : il sert à la génération, à la réparation en base
 * (`paliers/pregen:auditExercises`) et aux tests
 * (`convex/__tests__/missingVisual.test.ts`).
 */
import { exerciseImageIdOf } from "../../lib/exercise-images";


/** Une scène dessinée : au moins un pictogramme dans l'énoncé. */
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

/**
 * Une image du catalogue (`lib/exercise-images.ts`) est une scène dessinée au
 * même titre qu'un émoji : `displayedText` en porte la trace par ce pictogramme,
 * et tous les gardes (génération, contrôleur, `pregen:auditExercises`) la voient.
 */
const IMAGE_PICTOGRAPH = "🖼️";

/**
 * Ce que l'enfant peut lire dans l'énoncé comme donnée : un chiffre, un nombre
 * écrit en lettres (« un » et « une » sont des articles), une citation.
 */
const WRITTEN_DATA =
  /\d|[«»“”"]|(?<!\p{L})(?:deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|cent|mille)(?!\p{L})/iu;

/**
 * Un nom qu'on ne peut montrer qu'avec une image, un dessin ou une carte. La
 * « carte d'identité » et le « tableau » de la classe n'en sont pas : seuls
 * les verbes d'observation les désignent (voir `NAMES_AN_IMAGE`).
 */
const SHOWN_NOUN = "(?:image|illustration|dessin|photo|photographie|sch[ée]ma|figure|graphique)(?!\\s+anim)";
const OBSERVED_NOUN = "(?:image|illustration|dessin|photo|photographie|sch[ée]ma|figure|graphique|tableau|frise|carte|plan)";
const ARTICLE = "(?:l'|le |la |un |une |cette |ce )";
/**
 * Un verbe à l'impératif commence la phrase : « Awa regarde ses billes » et
 * « Fatou compte ses mangues » racontent une histoire, ils ne désignent rien.
 */
const SENTENCE_START = "(?:^|[.!?:;]\\s+)(?:\\p{L}+,\\s+)?";

/**
 * Ce qui désigne quelque chose que l'écran ne montre pas :
 * « ci-dessous », « sur l'image », « regarde le dessin », « observe tes billes ».
 * « Regarde les options » n'en fait pas partie : les options sont à l'écran.
 */
const NAMES_AN_IMAGE: RegExp[] = [
  /\bci[- ](?:dessous|dessus|contre|joint)\b/i,
  new RegExp(`\\b(?:sur|dans|d'apr[èe]s|selon)\\s+${ARTICLE}${SHOWN_NOUN}`, "iu"),
  new RegExp(
    `${SENTENCE_START}(?:regarde|regardez|observe|observez|voici|voilà)\\s+(?:bien\\s+)?${ARTICLE}${OBSERVED_NOUN}(?!\\p{L})`,
    "iu",
  ),
];

/**
 * Ce qui est à l'enfant (« Regarde tes billes ») : rien à l'écran ne lui
 * appartient, sauf son corps (« Regarde ta main »).
 */
const POINTS_AT_BELONGINGS = new RegExp(
  `${SENTENCE_START}(?:regarde|regardez|observe|observez|compte|comptez)\\s+(?:bien\\s+)?(?:tes|ton|ta|vos|votre)\\s+\\p{L}+`,
  "iu",
);

/**
 * « Combien de billes as-tu ? » : l'enfant est invité à compter ce qu'il n'a
 * pas. Les parties du corps en sont exclues : « Combien de doigts as-tu ? » se
 * répond de mémoire.
 */
const COUNTS_WHAT_IS_NOT_THERE: RegExp[] = [
  /\bcombien\s+(?:de|d')\s*[^?.!]*\b(?:as-tu|ai-je|vois-tu|vois-je|comptes-tu|peux-tu compter)\b/iu,
  /\bcombien\s+(?:de|d')\s*[^?.!]*\by a-t-il\s+(?:ici|là|dedans|dessous|dessus|sur l'image|sur le dessin)(?!\p{L})/iu,
];
const BODY_AND_SELF =
  /(?<!\p{L})(?:doigts?|mains?|pieds?|orteils?|yeux|œil|oeil|oreilles?|dents?|bras|jambes?|sens|frères|sœurs|soeurs)(?!\p{L})/iu;

function pointsAtAbsent(text: string): boolean {
  if (NAMES_AN_IMAGE.some((pattern) => pattern.test(text))) return true;
  return POINTS_AT_BELONGINGS.test(text) && !BODY_AND_SELF.test(text);
}

export type MissingVisual = "counts_what_is_not_there" | "points_at_absent_image";

/**
 * Pourquoi cet énoncé ne peut pas se jouer sur l'écran de l'enfant, ou `null`.
 * Ce qui prouve qu'une scène existe : un émoji (elle est dessinée), ou, pour
 * « combien… as-tu », un chiffre ou une citation (les données sont écrites).
 */
export function findMissingVisual(prompt: string): MissingVisual | null {
  const text = prompt.trim();
  if (text === "") return null;
  const drawn = PICTOGRAPH.test(text);
  if (drawn) return null;
  if (!WRITTEN_DATA.test(text) && !BODY_AND_SELF.test(text)) {
    if (COUNTS_WHAT_IS_NOT_THERE.some((pattern) => pattern.test(text))) {
      return "counts_what_is_not_there";
    }
  }
  if (pointsAtAbsent(text)) return "points_at_absent_image";
  return null;
}

// ---------------------------------------------------------------------------
// Ce que l'écran montre en plus de l'énoncé
// ---------------------------------------------------------------------------

function textsIn(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

/**
 * Les textes du payload que l'écran affiche : les options, les mots à relier,
 * les tuiles, la phrase à trous. Une image y est parfois dessinée en émojis
 * (« Glisse chaque image dans la bonne case » avec 🍎 et 🐟 en étiquettes) : un
 * énoncé qui renvoie à « l'image » n'y est pas sans scène.
 */
export function displayedText(type: string, payload: unknown): string {
  const p = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const objects = (value: unknown, keys: string[]) =>
    (Array.isArray(value) ? value : []).flatMap((entry) =>
      entry && typeof entry === "object"
        ? keys.flatMap((key) => {
            const text = (entry as Record<string, unknown>)[key];
            return typeof text === "string" ? [text] : [];
          })
        : [],
    );
  const parts: string[] = [];
  if (exerciseImageIdOf(p)) parts.push(IMAGE_PICTOGRAPH);
  switch (type) {
    case "qcm":
      parts.push(...textsIn(p.options));
      break;
    case "match":
      parts.push(...objects(p.pairs, ["left", "right"]));
      break;
    case "order":
      parts.push(...textsIn(p.correctSequence));
      break;
    case "drag-drop":
      parts.push(...textsIn(p.zones), ...objects(p.items, ["text"]));
      break;
    case "fill-blank":
      if (typeof p.text === "string") parts.push(p.text);
      for (const blank of Array.isArray(p.blanks) ? p.blanks : []) {
        parts.push(...textsIn((blank as Record<string, unknown> | null)?.options));
      }
      break;
    default:
      break;
  }
  return parts.join(" ");
}

/**
 * `findMissingVisual` sur ce que l'enfant voit vraiment : l'énoncé et la phrase
 * à trous. Un renvoi à « l'image » est levé quand les options ou les tuiles
 * portent un pictogramme ; compter « tes billes » ne l'est jamais, car des
 * options qui sont des chiffres ne sont pas des billes.
 */
export function findMissingVisualOnScreen(
  prompt: string,
  type: string,
  payload: unknown,
): MissingVisual | null {
  const p = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const sentence = type === "fill-blank" && typeof p.text === "string" ? ` ${p.text}` : "";
  const missing = findMissingVisual(`${prompt}${sentence}`);
  if (missing === "points_at_absent_image" && PICTOGRAPH.test(displayedText(type, payload))) return null;
  return missing;
}

/**
 * Les indices qui renvoient à une scène que l'énoncé ne dessine pas
 * (« Regarde tes billes. ») sont retirés ; les autres gardent leur ordre. Un
 * énoncé qui dessine sa scène garde tous ses indices.
 */
export function withoutDanglingHints(prompt: string, hints: string[]): string[] {
  if (PICTOGRAPH.test(prompt)) return hints;
  return hints.filter((hint) => !pointsAtAbsent(hint));
}

// ---------------------------------------------------------------------------
// Compter des émojis
// ---------------------------------------------------------------------------

/** Une rangée : deux pictogrammes de suite au moins, espaces tolérés entre eux. */
const EMOJI_RUN = /(?:\p{Extended_Pictographic}[︎️]?\s*){2,}/gu;

/** Le plus grand nombre d'objets dessiné dans une rangée : « jusqu'à 20 ». */
const MAX_COUNTED = 20;

/**
 * Le nombre d'objets dessinés que l'énoncé demande de compter, ou `null` quand
 * on ne peut pas l'affirmer : pas de « combien », un chiffre dans l'énoncé (un
 * calcul se cache peut-être derrière), plusieurs rangées ou plusieurs sortes
 * d'objets (une collection se compare, se retire, s'additionne).
 */
export function countedEmojis(prompt: string): number | null {
  if (!/\bcombien\b/i.test(prompt) || /\d/.test(prompt)) return null;
  const runs = prompt.match(EMOJI_RUN);
  if (!runs || runs.length !== 1) return null;
  const glyphs = Array.from(runs[0].replace(/[︎️\s]/g, ""));
  if (glyphs.length < 2 || glyphs.length > MAX_COUNTED) return null;
  if (new Set(glyphs).size !== 1) return null;
  return glyphs.length;
}

export type EmojiCountInput = {
  type: string;
  prompt: string;
  payload: unknown;
  answerKey: string;
};

export type EmojiCountOutcome =
  /** Pas une rangée à compter, ou une réponse qu'on ne sait pas lire. */
  | { kind: "skipped" }
  /** La réponse attendue est le nombre d'émojis. */
  | { kind: "ok"; counted: number }
  /** Corrigé : l'option juste est celle qui vaut le compte, ou la réponse courte. */
  | {
      kind: "repaired";
      counted: number;
      previous: string;
      answerKey: string;
      payload: Record<string, unknown>;
    }
  /** Aucune option ne vaut le compte : l'exercice est injouable. */
  | { kind: "unrepairable"; counted: number };

/** L'explication écrite pour l'ancienne réponse ne vaut plus pour la nouvelle. */
function withoutExplanation(payload: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...payload };
  delete rest.explanation;
  return rest;
}

const LEADING_INTEGER = /^\s*(\d+)(?!\s*[.,]\d)/;

function leadingInteger(text: string): number | null {
  const found = LEADING_INTEGER.exec(text);
  return found ? Number(found[1]) : null;
}

export function repairEmojiCount(input: EmojiCountInput): EmojiCountOutcome {
  if (input.type !== "qcm" && input.type !== "short-answer") return { kind: "skipped" };
  const counted = countedEmojis(input.prompt);
  if (counted === null) return { kind: "skipped" };
  const key = leadingInteger(input.answerKey);
  if (key === null) return { kind: "skipped" };
  const payload =
    input.payload && typeof input.payload === "object"
      ? (input.payload as Record<string, unknown>)
      : {};

  if (input.type === "qcm") {
    const options = Array.isArray(payload.options)
      ? payload.options.filter((option): option is string => typeof option === "string")
      : [];
    const correctIndex = typeof payload.correctIndex === "number" ? payload.correctIndex : -1;
    if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) {
      return { kind: "skipped" };
    }
    const pointed = options[correctIndex];
    if (leadingInteger(pointed) === counted) return { kind: "ok", counted };
    const matches = options.flatMap((option, index) => (leadingInteger(option) === counted ? [index] : []));
    if (matches.length !== 1) return { kind: "unrepairable", counted };
    return {
      kind: "repaired",
      counted,
      previous: pointed,
      answerKey: options[matches[0]],
      payload: { ...withoutExplanation(payload), correctIndex: matches[0] },
    };
  }

  const accepted = Array.isArray(payload.acceptedAnswers)
    ? payload.acceptedAnswers.filter((answer): answer is string => typeof answer === "string")
    : [];
  const everyAcceptedMatches = accepted.every((answer) => leadingInteger(answer) === counted);
  if (key === counted && everyAcceptedMatches) return { kind: "ok", counted };
  return {
    kind: "repaired",
    counted,
    previous: input.answerKey,
    answerKey: String(counted),
    payload: { ...withoutExplanation(payload), acceptedAnswers: [String(counted)] },
  };
}

// ---------------------------------------------------------------------------
// Le tout, pour un exercice écrit par le modèle
// ---------------------------------------------------------------------------

export type VisualGuardInput = {
  type: string;
  prompt: string;
  payload: unknown;
  answerKey: string;
  hints: string[];
  mathExpression: string | null;
};

export type VisualGuardOutcome =
  /** L'exercice ne peut pas se jouer : il est écarté du lot. */
  | { kind: "rejected"; reason: MissingVisual | "miscounted" }
  | {
      kind: "accepted";
      payload: unknown;
      answerKey: string;
      hints: string[];
      mathExpression: string | null;
      /** Le compte des émojis a corrigé la réponse attendue. */
      recounted: boolean;
    };

/**
 * Ce que `toPersistedShape` fait d'un exercice du modèle : écarté s'il parle de
 * ce qui n'est pas à l'écran, sinon réponse recomptée et indices nettoyés.
 * Quand le compte corrige la réponse, `mathExpression` tombe : elle portait la
 * même erreur, et `verifyMathBatch` défairait la réparation avec elle.
 */
export function guardVisuals(input: VisualGuardInput): VisualGuardOutcome {
  const missing = findMissingVisualOnScreen(input.prompt, input.type, input.payload);
  if (missing) return { kind: "rejected", reason: missing };
  const counted = repairEmojiCount(input);
  if (counted.kind === "unrepairable") return { kind: "rejected", reason: "miscounted" };
  const recounted = counted.kind === "repaired";
  return {
    kind: "accepted",
    payload: recounted ? counted.payload : input.payload,
    answerKey: recounted ? counted.answerKey : input.answerKey,
    hints: withoutDanglingHints(`${input.prompt} ${displayedText(input.type, input.payload)}`, input.hints),
    mathExpression: recounted ? null : input.mathExpression,
    recounted,
  };
}
