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
 * Tout autre énoncé qui renvoie à une image, un dessin ou un « ci-dessous »
 * absent est irréparable : à la génération il est écarté du lot ; en base,
 * son palier repasse en `stale`. Module pur, sans Convex, testé dans
 * `convex/__tests__/visualRepair.test.ts`.
 */

export type VisualRepairInput = {
  type: string;
  prompt: string;
  payload: unknown;
  /** La réponse écrite par le modèle. */
  answerKey: string;
};

export type VisualRepairOutcome =
  | { kind: "ok" }
  | { kind: "repaired"; prompt: string; change: "added" | "resized" }
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
const PICTURE_REFERENCE =
  /(?:\bvois[- ]?tu\b|\bvoyez[- ]?vous\b|\bvoit[- ]on\b|\bci[- ]dessus\b|\bci[- ]dessous\b|\b(?:l['’]|la |le |cette |ce )(?:image|illustration|photo|dessin|figure|sch[ée]ma)\b)/iu;

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

export function repairVisualPrompt(input: VisualRepairInput): VisualRepairOutcome {
  const prompt = input.prompt;
  const counting = COUNTING_QUESTION.exec(prompt);
  // « Combien de mangues Aïssatou a-t-elle ? » (3 + 2) se résout avec les
  // nombres écrits : seule une question qui ne contient aucun chiffre ET
  // qui demande ce qu'on voit dépend d'une image.
  const dependsOnPicture = PICTURE_REFERENCE.test(prompt) && !/\d/.test(prompt);

  if (!hasPictograph(prompt)) {
    if (!dependsOnPicture) return { kind: "ok" };
    // L'image peut être dans les options (« Que vois-tu ? 🐶 / 🐱 ») : alors
    // l'enfant la voit.
    if (hasPictograph(payloadText(input.payload))) return { kind: "ok" };
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
