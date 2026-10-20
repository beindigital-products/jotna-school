/**
 * LA VOIX DES TUILES — Pio dit ce que l'enfant de CI ne sait pas encore lire.
 *
 * La consigne d'un exercice se dit déjà toute seule (`voice/exercisePrompt.ts`,
 * `components/exercises/prompt-reader.tsx`). Mais une consigne entendue ne sert
 * à rien si les RÉPONSES restent écrites : « le chat », « la girafe », « je dis
 * bonjour » sont des tuiles que l'enfant de six ans regarde sans les lire. Le
 * propriétaire l'a demandé le 20 octobre 2026 : lire les propositions, et les
 * relire quand l'enfant en touche une. Ce module dit CE QUI SE LIT, et à QUI :
 * le reste (la file d'attente, la tuile qui s'allume) est dans le lecteur.
 *
 * MODULE PUR, PARTAGÉ PAR LE SERVEUR ET L'ÉCRAN, comme `speakable.ts` : le
 * serveur décide (`offline/voice.ts`), l'écran range les tuiles et ne demande que
 * des sons que le serveur accepterait.
 *
 * POUR QUI : le CI seulement (`TILE_VOICE_CLASSES`). Un enfant de CP lit déjà
 * des mots courts, et lui dire chaque tuile le ferait lire moins. Pour l'étendre,
 * il suffit d'y écrire « CP » : même règle que les images de tuile
 * (`PICTURE_TILE_CLASSES`, `lib/item-pictures.ts`), les deux listes sont
 * indépendantes de la voix des consignes (`READING_LEARNER_CLASSES`).
 *
 * CE QUE LA VOIX NE DIT JAMAIS, parce qu'elle donnerait la réponse ou dirait
 * faux :
 *   - quand l'énoncé demande de LIRE ou de DÉCODER (`READING_PROMPT`,
 *     `DECODING_PROMPT`, les mêmes que pour les images, `lib/item-pictures.ts`) :
 *     « Lis le mot », « Quel mot commence par la syllabe « pou » ? ». Lire la
 *     tuile à l'enfant, c'est lire à sa place ce qu'il doit apprendre à lire ;
 *   - quand l'énoncé demande une TRADUCTION (« Comment dit-on « chat » en
 *     anglais ? ») ou que la thématique est d'ANGLAIS : un mot anglais lu par la
 *     voix française est faux, et l'exercice, lui, fait ENTENDRE l'anglais ;
 *   - une tuile qui n'est que des émojis ou des signes : il n'y a rien à dire ;
 *   - une tuile d'UNE SEULE LETTRE (« a », « m ») : c'est du déchiffrage, même
 *     quand l'énoncé ne le dit pas (« Complète le mot : ba_ane »). Dire le nom de
 *     la lettre, c'est la lire à la place de l'enfant ; c'est la raison d'être des
 *     garde-fous « lire » et « décoder » ci-dessus ;
 *   - un exercice qui fait COMPLÉTER UN MOT : un trou collé à des lettres
 *     (« ba___ne », « ___ngue »), dans l'énoncé ou dans la phrase à trous. Les
 *     tuiles sont des lettres, des syllabes ou des sons (« ch », « pa ») ; les dire,
 *     c'est déchiffrer à la place de l'enfant, même quand l'énoncé ne parle ni de
 *     lettre ni de syllabe. Un trou entre deux espaces (« Le ___ miaule ») complète
 *     une phrase, pas un mot : il se dit.
 *
 * ON NE SYNTHÉTISE QUE CE QUE L'EXERCICE CONTIENT, comme pour la consigne
 * (`exercisePrompt.ts`) : la requête porte une référence (l'exercice) ET le
 * texte de la tuile, et le serveur vérifie que ce texte est bien une tuile (ou
 * la phrase à trous) de cet exercice. Sans cela, « dis ce que je te donne » ferait
 * du dépôt un générateur de voix gratuit. Le texte dit est celui de
 * `speakablePrompt` : les pictogrammes retirés, un trou devenu une pause, les
 * signes de calcul en français ; c'est aussi la clé du cache audio, donc « le
 * chat » est synthétisé une fois pour tous les exercices et tous les enfants.
 */

import { DECODING_PROMPT, READING_PROMPT, TRANSLATION_PROMPT } from "../../lib/item-pictures";
import { speakablePrompt } from "./speakable";

/** Les classes dont les tuiles se disent : le CI. Pour le CP, ajouter "CP". */
export const TILE_VOICE_CLASSES = ["CI"] as const;

const TILE_VOICE: ReadonlySet<string> = new Set(TILE_VOICE_CLASSES);

/** Vrai pour une classe dont les tuiles se disent. Un niveau absent n'en est pas un. */
export function isTileVoiceClass(klass: string | undefined | null): boolean {
  return typeof klass === "string" && TILE_VOICE.has(klass);
}

/**
 * Une thématique d'anglais : sa fiche du programme commence par « an- »
 * (`an-ci-colours`, `convex/programme/anglais.ts`), ou sa matière s'appelle
 * « Anglais » (une thématique créée à la main n'a pas de fiche).
 */
export function isEnglishTopic(topic: { programmeKey?: string | null; subjectName?: string | null }): boolean {
  if (typeof topic.programmeKey === "string" && /^an-/.test(topic.programmeKey)) return true;
  if (typeof topic.subjectName !== "string") return false;
  const name = topic.subjectName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  return name === "anglais" || name === "english";
}

/** Les énoncés qui interdisent la voix des tuiles : lire, décoder, traduire. */
const FORBIDDEN_PROMPTS: readonly RegExp[] = [READING_PROMPT, DECODING_PROMPT, TRANSLATION_PROMPT];

/** Un trou (deux soulignés ou plus, `BLANK_MARK`) collé à une lettre, d'un côté ou de l'autre. */
const GLUED_BLANK = /(?:\p{L}_{2,}|_{2,}\p{L})/u;

/**
 * Vrai quand un texte fait COMPLÉTER UN MOT : un trou collé à des lettres
 * (« ba___ne », « ___ngue »). Un trou entre deux espaces complète une phrase.
 */
export function completesAWord(text: unknown): boolean {
  return typeof text === "string" && GLUED_BLANK.test(text.normalize("NFC"));
}

/**
 * Vrai quand l'énoncé interdit de dire les tuiles. Même lecture que
 * `promptForbidsPictures` : « NFC » (une lettre accentuée en deux points de code
 * reste reconnue) et l'apostrophe courbe vaut la droite. Un énoncé qui fait
 * compléter un mot (« Complète : ___ngue ») l'interdit aussi (`completesAWord`).
 */
export function promptForbidsTileVoice(prompt: unknown): boolean {
  if (typeof prompt !== "string" || !prompt) return false;
  const text = prompt.normalize("NFC").replace(/[‘’ʼ′]/g, "'");
  return completesAWord(text) || FORBIDDEN_PROMPTS.some((pattern) => pattern.test(text));
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * Les tuiles d'un exercice, dans l'ordre où l'écran les pose. Elle se lit sur
 * le payload du SERVEUR (avec sa réponse) comme sur celui de l'ÉCRAN
 * (`sanitizePayload`, sans elle et mélangé) : un test compare les deux.
 *   - QCM : les options ;
 *   - association : la colonne de gauche, puis celle de droite ;
 *   - mise en ordre : les éléments à ranger ;
 *   - glisser-déposer : les étiquettes, puis les cases ;
 *   - phrase à trous : les mots proposés pour chaque trou.
 * Les autres types n'ont pas de tuile à dire (une frise d'émojis, un dessin,
 * une réponse tapée, une écoute dont le son EST l'exercice).
 */
export function tileTextsOf(type: string, payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  switch (type) {
    case "qcm":
      return strings(p.options);
    case "match": {
      if (Array.isArray(p.pairs)) {
        const pairs = p.pairs as { left?: unknown; right?: unknown }[];
        return [...strings(pairs.map((pair) => pair?.left)), ...strings(pairs.map((pair) => pair?.right))];
      }
      return [...strings(p.left), ...strings(p.right)];
    }
    case "order":
      return Array.isArray(p.correctSequence) ? strings(p.correctSequence) : strings(p.items);
    case "drag-drop": {
      const items = Array.isArray(p.items) ? (p.items as unknown[]).map((item) => (item as { text?: unknown } | null)?.text) : [];
      return [...strings(items), ...strings(p.zones)];
    }
    case "fill-blank": {
      const blanks = Array.isArray(p.blanks) ? (p.blanks as unknown[]) : [];
      return blanks.flatMap((blank) => strings((blank as { options?: unknown } | null)?.options));
    }
    default:
      return [];
  }
}

/**
 * La phrase à trous d'une « phrase à compléter » : un enfant qui ne lit pas ne
 * sait pas ce qu'on lui demande de compléter. Elle se dit avec une pause à la
 * place de chaque trou. Les autres types n'en ont pas.
 */
export function sentenceOf(type: string, payload: unknown): string | null {
  if (type !== "fill-blank" || !payload || typeof payload !== "object") return null;
  const text = (payload as { text?: unknown }).text;
  return typeof text === "string" && text.trim() !== "" ? text : null;
}

/** Tout ce que le serveur accepte de dire pour cet exercice : ses tuiles et, le cas échéant, sa phrase. */
export function readableTextsOf(type: string, payload: unknown): string[] {
  const sentence = sentenceOf(type, payload);
  return sentence === null ? tileTextsOf(type, payload) : [sentence, ...tileTextsOf(type, payload)];
}

/**
 * Le texte à faire dire pour une tuile, ou `null` s'il n'y a rien à dire (que
 * des émojis, des signes), trop (ce n'est plus une tuile) ou une lettre seule
 * (voir l'en-tête). C'est `speakablePrompt`, donc aussi la clé du cache audio.
 * L'écran s'en sert aussi : il ne demande jamais un son que le serveur refuserait.
 */
export function speakableTile(text: string): string | null {
  if (typeof text !== "string") return null;
  const spoken = speakablePrompt(text);
  if (spoken === null || /^\p{L}$/u.test(spoken)) return null;
  return spoken;
}

export type TileClipVerdict =
  | { ok: true; text: string }
  | { ok: false; reason: "not_allowed" | "unknown_text" };

/**
 * LA DÉCISION DU SERVEUR pour une requête de son de tuile : ce que l'enfant a le
 * droit d'entendre, et ce que Pio dit. Pure, pour qu'un test la passe en revue
 * sans base (le dépôt n'a pas de `convex-test`) ; `offline/voice.ts` n'y ajoute
 * que la lecture de la base et l'accès au palier.
 *
 * Dans l'ordre : la classe de l'enfant, l'anglais, l'énoncé qui interdit, puis
 * que le texte soit bien une tuile de CET exercice, enfin qu'il y ait quelque
 * chose à dire.
 */
export function tileClipVerdict(args: {
  /** La classe de l'enfant ; à défaut, celle du palier. */
  learnerClass: string | undefined | null;
  topic: { programmeKey?: string | null; subjectName?: string | null };
  exercise: { type: string; prompt: string; payload: unknown };
  /** Le texte de la tuile, tel que l'écran l'affiche. */
  text: string;
}): TileClipVerdict {
  if (!isTileVoiceClass(args.learnerClass)) return { ok: false, reason: "not_allowed" };
  if (isEnglishTopic(args.topic)) return { ok: false, reason: "not_allowed" };
  if (promptForbidsTileVoice(args.exercise.prompt)) return { ok: false, reason: "not_allowed" };
  // Une phrase à trous qui fait compléter un mot : les tuiles sont des lettres ou des syllabes.
  if (completesAWord(sentenceOf(args.exercise.type, args.exercise.payload))) {
    return { ok: false, reason: "not_allowed" };
  }
  if (!readableTextsOf(args.exercise.type, args.exercise.payload).includes(args.text)) {
    return { ok: false, reason: "unknown_text" };
  }
  const spoken = speakableTile(args.text);
  return spoken ? { ok: true, text: spoken } : { ok: false, reason: "unknown_text" };
}
