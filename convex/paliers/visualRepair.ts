/**
 * UN ÉNONCÉ QUI PARLE D'UNE IMAGE QUE L'ENFANT NE VOIT PAS.
 *
 * Aucune image n'accompagne un exercice : l'énoncé est du texte, et les
 * « images » sont des émojis écrits dans ce texte. Le modèle écrit pourtant
 * « Combien de mangues vois-tu ? » avec des options 3, 5, 7, sans une seule
 * mangue. L'enfant fixe une carte vide et répond au hasard ; la question est
 * injouable, pas seulement difficile.
 *
 * On répare ce qu'on sait réparer, sans rien inventer :
 *
 *   - Une question de dénombrement dont l'objet a un émoji (mangue, pomme,
 *     poisson…) et dont la réponse est un petit nombre : l'énoncé reçoit
 *     autant d'émojis que la réponse.
 *   - Une question de dénombrement déjà illustrée, mais avec un autre nombre
 *     d'émojis que la réponse : la rangée d'émojis est refaite à la taille
 *     de la réponse (l'enfant voit alors ce que la clé dit).
 *
 *   - Un appariement mot ↔ image dont l'« image » est un texte-substitut
 *     (« image_mangue », « image de maïs ») : le substitut devient l'émoji de
 *     l'objet, s'il en existe un et si chaque paire garde le sien. Un émoji
 *     qui contredit le mot (« mangue » ↔ 🍑) est remis juste (🥭).
 *
 * Tout autre énoncé qui renvoie à une image, un dessin ou un « ci-dessous »
 * absent est irréparable : à la génération il est écarté du lot ; en base,
 * son palier repasse en `stale`. Module pur, sans Convex, testé dans
 * `convex/__tests__/visualRepair.test.ts`.
 */
import { exerciseImageIdOf } from "../../lib/exercise-images";
import { BODY_AND_SELF, WRITTEN_DATA } from "./missingVisual";


export type VisualRepairInput = {
  type: string;
  prompt: string;
  payload: unknown;
  /** La réponse écrite par le modèle. */
  answerKey: string;
};

export type VisualRepairOutcome =
  | { kind: "ok" }
  | {
      kind: "repaired";
      prompt: string;
      /** Présent quand les paires d'un appariement ont changé. */
      payload?: unknown;
      change: "added" | "resized" | "pictures";
    }
  | { kind: "unrepairable"; reason: "nothing_to_see" };

/** Un émoji, avec ses variantes (sélecteur 16, jonction de personnages). */
const EMOJI = "\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic})*";
const EMOJI_ANY = new RegExp(EMOJI, "u");
const EMOJI_RUN = new RegExp(`(?:${EMOJI}[\\s\\u00A0]*)+`, "gu");
const EMOJI_EACH = new RegExp(EMOJI, "gu");

/** Le plus grand nombre d'émojis qu'on aligne : au-delà, l'enfant ne compte plus. */
const MAX_DRAWN = 20;

/**
 * Le texte renvoie à quelque chose que l'enfant devrait VOIR : « que
 * vois-tu ? », « sur l'image », « ci-dessous ».
 */
const PICTURE_REFERENCE = new RegExp(
  [
    "\\bvois[- ]?tu\\b",
    "\\bvoyez[- ]?vous\\b",
    // « cette image », « l'image » : l'énoncé en désigne une précise. Pas
    // « la figure » ni « le schéma » : « figure de style », « figure qui a
    // ses côtés parallèles » se répondent avec le texte seul ; pas « le
    // dessin » seul non plus (le cours de dessin).
    "\\b(?:cette |ce )(?:image|illustration|photo|dessin)\\b",
    "\\bl['’](?:image|illustration)\\b",
    "\\b(?:regarde[zr]?|observe[zr]?|sur|dans|selon) (?:la |le )(?:photo|dessin)\\b",
  ].join("|"),
  "iu",
);

/**
 * « ci-dessus », « ci-dessous » : dans un appariement, un glisser-déposer ou un
 * ordre, ce qui est « ci-dessous » est l'ensemble des étiquettes à l'écran
 * (« Assigne les valeurs ci-dessous aux bonnes zones »). Ailleurs, c'est une
 * image ou un texte qui devrait suivre l'énoncé.
 */
const BELOW_REFERENCE = /\bci[- ]dess(?:us|ous)\b/iu;
const TILE_TYPES = new Set(["match", "drag-drop", "order"]);

/** « Combien de mangues voit-on ? » ne se compte que sur une rangée. */
const SEEN_COUNT = /\bvoit[- ]on\b/iu;

/**
 * « Combien de cauris as-tu ? » invite à compter ce que l'écran ne montre pas.
 * Deux exceptions, les mêmes que le contrôleur (`findMissingVisual`) : les
 * données écrites dans l'énoncé (« Tu as trois pommes… ») se calculent sans
 * image, et le corps de l'enfant (« Combien de doigts as-tu ? ») se répond de
 * mémoire.
 */
const OWNED_COUNT = /\bas-tu\b/iu;
const isOwnedCount = (prompt: string): boolean =>
  OWNED_COUNT.test(prompt) && !WRITTEN_DATA.test(prompt) && !BODY_AND_SELF.test(prompt);

/**
 * L'enfant invente ou décrit lui-même (« Décris un fruit que tu aimes. Que
 * vois-tu ? ») : il n'y a rien à voir, et « que voit-on d'en haut dans une
 * classe ? » se répond de tête.
 */
const IMAGINED = /\b(?:d[ée]cris|imagine|raconte|pense [àa]|dessine)\b/iu;

/** Une question de dénombrement sur ce que l'on voit (et non un calcul en mots). */
const COUNTING_QUESTION = /\bcombien (?:de |d['’]|des )\s*(\p{L}+)/iu;

const OBJECT_EMOJI: Record<string, string> = {
  mangue: "🥭",
  pomme: "🍎",
  banane: "🍌",
  orange: "🍊",
  mandarine: "🍊",
  citron: "🍋",
  ananas: "🍍",
  pasteque: "🍉",
  raisin: "🍇",
  fraise: "🍓",
  tomate: "🍅",
  carotte: "🥕",
  oeuf: "🥚",
  bonbon: "🍬",
  gateau: "🍰",
  poisson: "🐟",
  oiseau: "🐦",
  canard: "🦆",
  poule: "🐔",
  chat: "🐱",
  chien: "🐶",
  vache: "🐄",
  mouton: "🐑",
  chevre: "🐐",
  cheval: "🐴",
  elephant: "🐘",
  lion: "🦁",
  singe: "🐒",
  lapin: "🐰",
  souris: "🐭",
  tortue: "🐢",
  serpent: "🐍",
  papillon: "🦋",
  abeille: "🐝",
  etoile: "⭐",
  fleur: "🌸",
  arbre: "🌳",
  maison: "🏠",
  voiture: "🚗",
  ballon: "⚽",
  coeur: "❤️",
  livre: "📘",
  cahier: "📒",
  crayon: "✏️",
  cauri: "🐚",
  bille: "🔴",
};

function plain(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe");
}

/** « mangues » → 🥭 ; un mot inconnu → null. */
export function emojiFor(noun: string): string | null {
  const word = plain(noun);
  return OBJECT_EMOJI[word] ?? OBJECT_EMOJI[word.replace(/[sx]$/, "")] ?? null;
}

export function hasPictograph(text: string): boolean {
  return EMOJI_ANY.test(text);
}

function payloadText(payload: unknown): string {
  try {
    return JSON.stringify(payload ?? "");
  } catch {
    return "";
  }
}

/** Le nombre que la question attend, quand c'est un petit entier. */
function expectedCount(input: VisualRepairInput): number | null {
  let raw = input.answerKey.trim();
  const p =
    input.payload && typeof input.payload === "object"
      ? (input.payload as Record<string, unknown>)
      : {};
  if (input.type === "qcm" && Array.isArray(p.options) && typeof p.correctIndex === "number") {
    const pointed = p.options[p.correctIndex];
    if (typeof pointed === "string") raw = pointed.trim();
  }
  if (!/^\d{1,3}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= MAX_DRAWN ? n : null;
}

/** « image_mangue », « image de maïs », « Image d'un gâteau » : un texte, pas une image. */
const PLACEHOLDER = /^image(?:[_\s]|$)/iu;

function isSinglePictograph(value: string): boolean {
  const found = value.trim().match(EMOJI_EACH) ?? [];
  return found.length === 1 && found[0] === value.trim();
}

/** « image de mangue » → « mangue » ; « gâteau coupé en 4 parts » reste tel quel. */
function pictureSubject(placeholder: string): string {
  return placeholder
    .replace(/^image[_\s]*/iu, "")
    .replace(/^(?:(?:de|d['’]|du|des|la|le|l['’]|un|une)\s*)+/iu, "")
    .replace(/_/g, " ")
    .trim();
}

type Pair = { left: string; right: string };

function repairMatchPictures(payload: unknown): VisualRepairOutcome {
  const p = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  if (!Array.isArray(p.pairs)) return { kind: "ok" };
  const pairs = p.pairs as Pair[];
  if (!pairs.every((x) => x && typeof x.left === "string" && typeof x.right === "string")) {
    return { kind: "ok" };
  }
  let unresolved = false;
  const replaced: string[] = [];
  const next = pairs.map((pair) => {
    const right = pair.right.trim();
    if (PLACEHOLDER.test(right)) {
      const emoji = emojiFor(pictureSubject(right));
      if (!emoji) {
        unresolved = true;
        return pair;
      }
      replaced.push(emoji);
      return { ...pair, right: emoji };
    }
    // Un émoji qui contredit le mot : « mangue » ↔ 🍑.
    const known = emojiFor(pair.left);
    if (known && isSinglePictograph(right) && right !== known) {
      replaced.push(known);
      return { ...pair, right: known };
    }
    return pair;
  });
  // Une paire sans image possible laisse l'appariement injouable. Seules les
  // images qu'on écrit doivent être distinctes : « chaque nom à son genre »
  // répète légitimement la même réponse.
  if (unresolved || new Set(replaced).size !== replaced.length) {
    return { kind: "unrepairable", reason: "nothing_to_see" };
  }
  if (replaced.length === 0) return { kind: "ok" };
  const accepted = Array.isArray(p.accepted)
    ? (p.accepted as Pair[]).map((a) => {
        const index = pairs.findIndex((x) => x.left === a?.left);
        return index >= 0 && a.right === pairs[index].right ? { ...a, right: (next as Pair[])[index].right } : a;
      })
    : undefined;
  return {
    kind: "repaired",
    prompt: "",
    payload: { ...p, pairs: next, ...(accepted ? { accepted } : {}) },
    change: "pictures",
  };
}

export function repairVisualPrompt(input: VisualRepairInput): VisualRepairOutcome {
  if (input.type === "match") {
    const matched = repairMatchPictures(input.payload);
    if (matched.kind === "repaired") return { ...matched, prompt: input.prompt };
    if (matched.kind === "unrepairable") return matched;
  }
  const prompt = input.prompt;
  const counting = COUNTING_QUESTION.exec(prompt);
  // « Combien de mangues Aïssatou a-t-elle ? » (3 + 2) se résout avec les
  // nombres écrits : seule une question qui ne contient aucun chiffre ET
  // qui demande ce qu'on voit dépend d'une image.
  const refersToPicture =
    PICTURE_REFERENCE.test(prompt) ||
    (BELOW_REFERENCE.test(prompt) && !TILE_TYPES.has(input.type)) ||
    (counting !== null && (SEEN_COUNT.test(prompt) || isOwnedCount(prompt)));
  const dependsOnPicture = refersToPicture && !IMAGINED.test(prompt) && !/\d/.test(prompt);

  if (!hasPictograph(prompt)) {
    if (!dependsOnPicture) return { kind: "ok" };
    // L'image peut être dans les options (« Que vois-tu ? 🐶 / 🐱 ») : alors
    // l'enfant la voit.
    if (hasPictograph(payloadText(input.payload))) return { kind: "ok" };
    // Ou être une image du catalogue (`payload.image`, `lib/exercise-images.ts`) :
    // l'écran l'affiche au-dessus de l'énoncé. Pas pour compter : un générateur
    // d'images ne dessine pas « exactement 5 mangues », la question de
    // dénombrement reçoit ses émojis comme avant.
    if (!counting && exerciseImageIdOf(input.payload)) return { kind: "ok" };
    const emoji = counting ? emojiFor(counting[1]) : null;
    const n = counting ? expectedCount(input) : null;
    if (!emoji || n === null) return { kind: "unrepairable", reason: "nothing_to_see" };
    return { kind: "repaired", prompt: `${emoji.repeat(n)}\n${prompt}`, change: "added" };
  }

  // Déjà illustré : la rangée doit montrer le nombre que la clé annonce.
  if (!counting || !dependsOnPicture) return { kind: "ok" };
  const n = expectedCount(input);
  if (n === null) return { kind: "ok" };
  const runs = prompt.match(EMOJI_RUN) ?? [];
  if (runs.length !== 1) return { kind: "ok" };
  const drawn = runs[0].match(EMOJI_EACH) ?? [];
  // Un seul émoji est le plus souvent le NOM de l'objet (« Combien de 🥭
  // vois-tu ? »), pas une rangée à compter : on n'y touche pas.
  const first = drawn[0];
  if (first === undefined || drawn.length < 2 || drawn.length === n || new Set(drawn).size !== 1) return { kind: "ok" };
  const resized = prompt.replace(EMOJI_RUN, () => `${first.repeat(n)} `);
  return { kind: "repaired", prompt: resized.replace(/[ \t]{2,}/g, " ").trim(), change: "resized" };
}
