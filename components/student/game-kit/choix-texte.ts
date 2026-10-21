/**
 * LE TEXTE D'UN ÉNONCÉ OU D'UNE OPTION, LU COMME UN ENFANT LE VOIT.
 *
 * Le contenu vient du serveur : des consignes et des options en texte, avec
 * des émojis dedans (« Regarde la rangée [éléphant] [poisson] [banane]. Lequel est
 * au milieu ? », « [poisson] le poisson »). Pour un enfant de CI qui ne lit pas encore, l'émoji EST
 * la question : il doit être énorme, posé sur un socle, et l'option se
 * reconnaît à son dessin avant son mot. Ces fonctions découpent le texte sans
 * en perdre un caractère : ce que l'écran affiche, mis bout à bout, est
 * exactement la chaîne reçue (les tests de `ExercisePrompt` y tiennent).
 *
 * UN ÉMOJI, ICI, C'EST UN GRAPHÈME QUI SE DESSINE EN COULEUR : la propriété
 * Unicode `Emoji_Presentation`, ou un sélecteur de variation émoji (U+FE0F)
 * dans la séquence. Ni « © », ni une flèche, ni un chiffre : ils sont
 * « Extended_Pictographic » pour certains, mais s'écrivent en texte. Les
 * graphèmes viennent d'`Intl.Segmenter` quand il existe (iOS 14.5, Chrome 87,
 * Node 16), sinon des points de code : un drapeau ou une famille y compterait
 * pour plusieurs, sans autre dégât qu'un socle un peu plus large.
 *
 * Aucun émoji n'est écrit dans ce fichier, même en commentaire ([poisson] tient
 * lieu d'exemple) : tout vient du contenu.
 */

/* Le sélecteur de variation émoji (U+FE0F) est construit par son code : écrit
   en clair, il serait invisible dans la source. */
const EMOJI_GRAPHEME = new RegExp(`\\p{Emoji_Presentation}|${String.fromCharCode(0xfe0f)}`, "u");
const WHITESPACE = /^\s+$/u;

type Segmenter = { segment: (text: string) => Iterable<{ segment: string }> };

function segmenter(): Segmenter | null {
  const api = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: string }) => Segmenter })
    .Segmenter;
  if (typeof api !== "function") return null;
  try {
    return new api("fr", { granularity: "grapheme" });
  } catch {
    return null;
  }
}

let cached: Segmenter | null | undefined;

/** Les graphèmes d'un texte, tels qu'un lecteur les voit (un émoji composé = un graphème). */
export function graphemes(text: string): string[] {
  if (cached === undefined) cached = segmenter();
  if (cached) return Array.from(cached.segment(text), (part) => part.segment);
  return Array.from(text);
}

/** Le nombre de graphèmes d'un texte : la longueur « à l'œil », pas en unités UTF-16. */
export function graphemeCount(text: string): number {
  return graphemes(text).length;
}

/** Vrai pour un graphème qui se dessine en émoji couleur. */
export function isEmojiGrapheme(grapheme: string): boolean {
  return EMOJI_GRAPHEME.test(grapheme);
}

/**
 * Vrai pour un cadran d'horloge d'Unicode : une heure juste (U+1F550 à U+1F55B) ou une
 * demi-heure (U+1F55C à U+1F567). Les aiguilles ne se lisent pas à la taille d'un mot :
 * l'énoncé et les tuiles qui montrent UN cadran le dessinent en grand.
 */
export function isClockEmoji(grapheme: string): boolean {
  const code = grapheme.codePointAt(0) ?? 0;
  return code >= 0x1f550 && code <= 0x1f567 && Array.from(grapheme).length === 1;
}

/**
 * Sépare les émojis qui OUVRENT une option de son mot : « [poisson] le
 * poisson » donne `{ emoji: "[poisson]", rest: "le poisson" }`. L'espace entre les deux est
 * rendue au mot (`gap`), pas au texte : `emoji + rest` ne contient donc plus
 * cet espace, ce qui n'a d'effet que sur le nom accessible, inchangé à l'œil.
 * Sans émoji en tête : `emoji` vide, `rest` entier. Rien que des émojis :
 * `rest` vide.
 */
export function splitLeadingEmoji(text: string): { emoji: string; rest: string } {
  const parts = graphemes(text);
  let i = 0;
  let lastEmoji = -1;
  while (i < parts.length) {
    const g = parts[i];
    if (isEmojiGrapheme(g)) {
      lastEmoji = i;
      i++;
      continue;
    }
    if (WHITESPACE.test(g) && lastEmoji !== -1) {
      i++;
      continue;
    }
    break;
  }
  if (lastEmoji === -1) return { emoji: "", rest: text };
  const emoji = parts.slice(0, lastEmoji + 1).join("");
  const rest = parts.slice(lastEmoji + 1).join("").replace(/^\s+/u, "");
  return { emoji, rest };
}

export type PromptSegment =
  /** Du texte ordinaire, tel quel. */
  | { kind: "texte"; text: string }
  /** Un émoji seul dans la phrase (« une robe [robe] ») : un peu plus grand, en ligne. */
  | { kind: "emoji"; text: string }
  /** Un cadran d'horloge seul (« Quelle heure est-il ? [horloge] ») : ce que l'enfant lit, en grand sur son socle, sous la phrase. */
  | { kind: "horloge"; text: string }
  /** Une rangée d'au moins deux émojis (« [éléphant] [poisson] [banane] », « [mangue][mangue][mangue] ») : posée sur un socle. */
  | { kind: "rangee"; text: string; count: number };

/**
 * Découpe une consigne en texte, émojis seuls et rangées d'émojis. Les
 * espaces ENTRE les émojis d'une rangée restent dans la rangée ; celles qui
 * la bordent restent au texte. La concaténation des segments est la consigne
 * d'origine, caractère pour caractère.
 */
export function segmentPrompt(text: string): PromptSegment[] {
  const parts = graphemes(text);
  const out: PromptSegment[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ kind: "texte", text: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < parts.length) {
    if (!isEmojiGrapheme(parts[i])) {
      buffer += parts[i];
      i++;
      continue;
    }
    // Une rangée : des émojis, séparés au plus par des espaces.
    let end = i;
    let count = 0;
    let j = i;
    while (j < parts.length) {
      if (isEmojiGrapheme(parts[j])) {
        count++;
        end = j;
        j++;
      } else if (WHITESPACE.test(parts[j])) {
        j++;
      } else {
        break;
      }
    }
    const run = parts.slice(i, end + 1).join("");
    flush();
    out.push(
      count >= 2 ? { kind: "rangee", text: run, count } : isClockEmoji(run) ? { kind: "horloge", text: run } : { kind: "emoji", text: run },
    );
    i = end + 1;
  }
  flush();
  return out;
}

/**
 * LA DISPOSITION D'UN QCM : deux colonnes pour des réponses courtes (des
 * émojis, des nombres, un mot ou deux), une colonne pour des phrases. Deux
 * colonnes sur un téléphone de 390 px laissent environ 110 px de texte par
 * tuile : douze graphèmes en Fredoka 18 px y tiennent, « le crocodile » se
 * plie proprement en deux lignes. Au-delà de six options, une colonne.
 */
export function qcmLayout(options: readonly string[]): { columns: 1 | 2; size: "md" | "lg" } {
  const parts = options.map(splitLeadingEmoji);
  const compact =
    options.length >= 2 &&
    options.length <= 6 &&
    parts.every((part) => {
      const word = part.rest.trim();
      return graphemeCount(word) <= 12 && word.split(/\s+/u).filter(Boolean).length <= 2;
    });
  if (compact) return { columns: 2, size: "lg" };
  const longest = Math.max(0, ...options.map((option) => graphemeCount(option)));
  return { columns: 1, size: longest <= 30 ? "lg" : "md" };
}

/**
 * La taille d'une rangée d'émojis sur son socle : énorme à trois, plus serrée
 * à dix. Dans une consigne longue (`dense`), un cran de moins : le socle
 * coupe moins la phrase sur un téléphone. Avec `short`, la classe POUR UN
 * ÉCRAN COURT (667 px ou moins, hors paysage) : encore un cran de moins, et
 * jamais sous 20 px, le budget du premier écran (`ExercisePrompt`) ; une
 * classe écrite en entier, avec sa requête média, pour que Tailwind la voie.
 */
export function emojiRowSizeClass(count: number, dense = false, short = false): string {
  const step = count <= 4 ? 0 : count <= 8 ? 1 : 2;
  const sizes = short ? SHORT_SIZES : SIZES;
  return sizes[Math.min(sizes.length - 1, step + (dense ? 1 : 0) + (short ? 1 : 0))];
}

const SIZES = ["text-4xl", "text-3xl", "text-2xl", "text-xl"];
const SHORT_SIZES = [
  "[@media(max-height:667px)_and_(min-height:481px)]:text-4xl",
  "[@media(max-height:667px)_and_(min-height:481px)]:text-3xl",
  "[@media(max-height:667px)_and_(min-height:481px)]:text-2xl",
  "[@media(max-height:667px)_and_(min-height:481px)]:text-xl",
];

/** Au-delà de cette longueur, une consigne est « longue » : ses socles se serrent. */
export const DENSE_PROMPT_GRAPHEMES = 60;
