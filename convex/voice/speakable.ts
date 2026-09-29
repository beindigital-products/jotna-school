/**
 * CE QUE PIO DIT D'UNE CONSIGNE ÉCRITE.
 *
 * Une consigne d'exercice est écrite pour l'œil. Lue telle quelle par la
 * synthèse vocale :
 * - les émojis à compter (« 🍎🍎🍎 ») deviennent du bruit, ou des noms anglais ;
 * - un trou à remplir (« ma_an », « 3 + ? = 7 ») se lit comme un signe ;
 * - les signes de calcul se lisent parfois en anglais au milieu du français.
 * On garde les mots, on fait du trou une pause (« … »), on dit les signes en
 * français et on retire les pictogrammes. Ce que l'enfant VOIT ne change pas.
 *
 * MODULE PUR : `voice/exercisePrompt.ts` l'applique avant la synthèse, et le
 * texte rendu est aussi la clé du cache audio — deux consignes qui se disent
 * pareil partagent leur fichier.
 */

/** Au-delà, ce n'est plus une consigne d'exercice : on ne la fait pas dire. */
export const MAX_SPOKEN_PROMPT_CHARS = 400;

/** Un opérande : un nombre, ou un trou déjà rendu en pause. */
const OPERAND = String.raw`(\d|…)`;
const NEXT_OPERAND = String.raw`(?=\s*(?:\d|…))`;

/**
 * Le texte à faire dire, ou `null` s'il n'y a rien à dire (que des émojis)
 * ou trop à dire.
 */
export function speakablePrompt(prompt: string): string | null {
  const text = prompt
    // Les pictogrammes, avec leurs jointures et sélecteurs de variante.
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/[\u200d\ufe0e\ufe0f\u20e3]/g, "")
    // Un trou à remplir : une pause, pas une lettre.
    .replace(/_+/g, " … ")
    // Un « ? » qui tient la place d'un nombre (« 3 + ? = 7 », « 5, ?, 7 »),
    // pas celui qui finit la question.
    .replace(/(^|[\s(])\?(?=\s*[,;+\-−–×x*÷:=<>\d])/g, "$1…")
    // Les signes de calcul, entre deux opérandes seulement : le trait
    // d'union de « a-t-il » et les deux-points d'une consigne restent.
    .replace(new RegExp(`${OPERAND}\\s*\\+\\s*${NEXT_OPERAND}`, "g"), "$1 plus ")
    .replace(new RegExp(`${OPERAND}\\s*[-−–]\\s*${NEXT_OPERAND}`, "g"), "$1 moins ")
    .replace(new RegExp(`${OPERAND}\\s*[×x*]\\s*${NEXT_OPERAND}`, "g"), "$1 fois ")
    .replace(new RegExp(`${OPERAND}\\s*÷\\s*${NEXT_OPERAND}`, "g"), "$1 divisé par ")
    .replace(new RegExp(`${OPERAND}\\s+:\\s+${NEXT_OPERAND}`, "g"), "$1 divisé par ")
    .replace(new RegExp(`${OPERAND}\\s*<\\s*${NEXT_OPERAND}`, "g"), "$1 est plus petit que ")
    .replace(new RegExp(`${OPERAND}\\s*>\\s*${NEXT_OPERAND}`, "g"), "$1 est plus grand que ")
    .replace(/\s*=\s*/g, " égale ")
    // Ce qu'un pictogramme retiré laisse derrière lui : « pommes : . ».
    .replace(/\s+/g, " ")
    .replace(/\s*[:;,]\s*(?=[.!?]|$)/g, "")
    .replace(/\s+([.,])/g, "$1")
    .trim();

  if (!/[\p{L}\p{N}]/u.test(text)) return null;
  if (text.length > MAX_SPOKEN_PROMPT_CHARS) return null;
  return text;
}
