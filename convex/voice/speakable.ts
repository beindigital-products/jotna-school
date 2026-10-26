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

/** Les mots des signes de calcul, dans la langue de la voix qui les dit. */
const SIGN_WORDS = {
  fr: { plus: "plus", minus: "moins", times: "fois", by: "divisé par", lt: "est plus petit que", gt: "est plus grand que", eq: "égale" },
  en: { plus: "plus", minus: "minus", times: "times", by: "divided by", lt: "is less than", gt: "is greater than", eq: "equals" },
} as const;

/**
 * Le texte à faire dire, ou `null` s'il n'y a rien à dire (que des émojis)
 * ou trop à dire. `lang` : la voix qui le dira. Une tuile d'anglais passe par la
 * voix anglaise : « eight = … » se dit « eight equals », pas « eight égale ».
 */
export function speakablePrompt(prompt: string, lang: "fr" | "en" = "fr"): string | null {
  // `=== "en"` et non `SIGN_WORDS[lang]` : `.map(speakablePrompt)` passe l'index en second argument.
  const w = SIGN_WORDS[lang === "en" ? "en" : "fr"];
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
    .replace(new RegExp(`${OPERAND}\\s*\\+\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.plus} `)
    .replace(new RegExp(`${OPERAND}\\s*[-−–]\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.minus} `)
    .replace(new RegExp(`${OPERAND}\\s*[×x*]\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.times} `)
    .replace(new RegExp(`${OPERAND}\\s*÷\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.by} `)
    .replace(new RegExp(`${OPERAND}\\s+:\\s+${NEXT_OPERAND}`, "g"), `$1 ${w.by} `)
    .replace(new RegExp(`${OPERAND}\\s*<\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.lt} `)
    .replace(new RegExp(`${OPERAND}\\s*>\\s*${NEXT_OPERAND}`, "g"), `$1 ${w.gt} `)
    .replace(/\s*=\s*/g, ` ${w.eq} `)
    // Ce qu'un pictogramme retiré laisse derrière lui : « pommes : . ».
    .replace(/\s+/g, " ")
    .replace(/\s*[:;,]\s*(?=[.!?]|$)/g, "")
    .replace(/\s+([.,])/g, "$1")
    .trim();

  if (!/[\p{L}\p{N}]/u.test(text)) return null;
  if (text.length > MAX_SPOKEN_PROMPT_CHARS) return null;
  return text;
}

/**
 * LA CONSIGNE D'UN APPARIEMENT SE COMPLÈTE : « Associe les couleurs aux
 * objets » ne dit pas où toucher. Le 12 octobre 2026, un enfant ne savait pas
 * par où commencer. Cette phrase est écrite sous la consigne (`MatchExercise`)
 * ET dite par Pio avec elle (`speakableExercise`) : l'enfant lit ce qu'il
 * entend. On peut commencer par la gauche ou par la droite.
 */
export const MATCH_HINT =
  "Touche un mot, puis le mot qui va avec lui dans l'autre colonne. Tu peux commencer par la gauche ou par la droite.";

/** Ce que Pio dit d'un exercice : sa consigne, plus le mode d'emploi d'un appariement. */
export function speakableExercise(type: string, prompt: string): string | null {
  const text = speakablePrompt(prompt);
  if (!text || type !== "match") return text;
  const spoken = `${/[.!?…]$/.test(text) ? text : `${text}.`} ${MATCH_HINT}`;
  return spoken.length > MAX_SPOKEN_PROMPT_CHARS + MATCH_HINT.length ? text : spoken;
}
