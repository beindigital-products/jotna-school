/**
 * UNE LETTRE, UNE IMAGE — le mot qui aide l'enfant à retenir chaque lettre.
 *
 * C'est le principe des abécédaires arabes pour enfants : « أ comme أَسَد, le
 * lion ». L'enfant de cinq ans ne retient pas un son abstrait ; il retient le
 * lion, et le lion lui rend la lettre. Ici, la première lettre a de la
 * chance : son lion, c'est Pio.
 *
 * TROIS RÈGLES POUR LE CHOIX DES MOTS :
 *   1. le mot COMMENCE par la lettre, prononcée avec sa valeur de base ;
 *   2. il désigne une chose qu'un enfant du Sénégal connaît et qu'une image
 *      montre sans ambiguïté (un animal, un fruit, un objet du quotidien) ;
 *   3. l'image est un emoji : dessiné pareil sur tous les téléphones, sans
 *      texte, sans fichier à charger. Pas de chien (كَلْب) pour ك : on prend la
 *      balle (كُرَة), qui ne gêne aucune famille.
 *
 * LES MOTS SONT VOCALISÉS et sont lus par la voix arabe du parcours
 * (`voice.ts`, référence `letterWord`). Comme le texte coranique
 * (`docs/module-arabe-coran.md`, §4), ils sont saisis à la main : un maître
 * d'arabe doit les relire avant la mise en classe.
 */

import type { ArabicLetterKey } from "./alphabet";

export interface LetterWord {
  /** Le mot, en arabe vocalisé. */
  ar: string;
  /** Son sens, pour l'adulte qui lit l'écran. */
  fr: string;
  emoji: string;
}

export const LETTER_WORDS: Readonly<Record<ArabicLetterKey, LetterWord>> = {
  alif: { ar: "أَسَد", fr: "le lion", emoji: "🦁" },
  ba: { ar: "بَطَّة", fr: "le canard", emoji: "🦆" },
  ta: { ar: "تُفَّاحَة", fr: "la pomme", emoji: "🍎" },
  tha: { ar: "ثَعْلَب", fr: "le renard", emoji: "🦊" },
  jim: { ar: "جَمَل", fr: "le chameau", emoji: "🐫" },
  ha: { ar: "حِصَان", fr: "le cheval", emoji: "🐴" },
  kha: { ar: "خَرُوف", fr: "le mouton", emoji: "🐑" },
  dal: { ar: "دُبّ", fr: "l'ours", emoji: "🐻" },
  dhal: { ar: "ذُرَة", fr: "le maïs", emoji: "🌽" },
  ra: { ar: "رِيشَة", fr: "la plume", emoji: "🪶" },
  zay: { ar: "زَرَافَة", fr: "la girafe", emoji: "🦒" },
  sin: { ar: "سَمَكَة", fr: "le poisson", emoji: "🐟" },
  shin: { ar: "شَمْس", fr: "le soleil", emoji: "☀️" },
  sad: { ar: "صُنْدُوق", fr: "la boîte", emoji: "📦" },
  dad: { ar: "ضِفْدَع", fr: "la grenouille", emoji: "🐸" },
  taEmph: { ar: "طَائِرَة", fr: "l'avion", emoji: "✈️" },
  zaEmph: { ar: "ظَرْف", fr: "l'enveloppe", emoji: "✉️" },
  ayn: { ar: "عِنَب", fr: "le raisin", emoji: "🍇" },
  ghayn: { ar: "غَيْمَة", fr: "le nuage", emoji: "☁️" },
  fa: { ar: "فِيل", fr: "l'éléphant", emoji: "🐘" },
  qaf: { ar: "قَمَر", fr: "la lune", emoji: "🌙" },
  kaf: { ar: "كُرَة", fr: "la balle", emoji: "⚽" },
  lam: { ar: "لَيْمُون", fr: "le citron", emoji: "🍋" },
  mim: { ar: "مَوْز", fr: "la banane", emoji: "🍌" },
  nun: { ar: "نَحْلَة", fr: "l'abeille", emoji: "🐝" },
  haSoft: { ar: "هَدِيَّة", fr: "le cadeau", emoji: "🎁" },
  waw: { ar: "وَرْدَة", fr: "la rose", emoji: "🌹" },
  ya: { ar: "يَد", fr: "la main", emoji: "✋" },
};

/** Le mot-image d'une lettre, ou `null` si la clé ne désigne aucune lettre. */
export function letterWord(key: string): LetterWord | null {
  return Object.prototype.hasOwnProperty.call(LETTER_WORDS, key)
    ? LETTER_WORDS[key as ArabicLetterKey]
    : null;
}
