/**
 * LA TYPOGRAPHIE DES TUILES : la règle de l'énoncé, étendue à tout ce qu'on touche.
 *
 * `ExercisePrompt` compose déjà la consigne avec `typeset` (PR #97) : l'espace
 * avant « ? », « ! », « : » et « ; » y est insécable, et ces signes ne commencent
 * jamais une ligne. Les tuiles n'en profitaient pas : les données ont une espace
 * ordinaire avant ces signes (« Viens manger chez moi demain ! »), et sur un
 * téléphone le « ! » partait seul en tête de ligne, dans une étiquette de
 * glisser-déposer, une tuile d'association, une option ou un trou (audit visuel
 * des 10 280 exercices, octobre 2026 : 155 exercices, 41 gabarits).
 *
 * `typesetTile` y ajoute UN calcul qui ne se coupe pas : l'espace autour d'un
 * opérateur posé entre deux nombres (ou une parenthèse) devient insécable, pour
 * que « (22 + 13) ÷ 5 » ne se lise plus « (22 + ⏎ 13) ÷ 5 » dans un « relier » de
 * problèmes. Un calcul trop long pour sa tuile se coupe encore, mais seulement là
 * où la donnée n'a pas d'espace autour d'un opérateur, c'est-à-dire nulle part :
 * il déborde alors sur la ligne par `overflow-wrap: anywhere` (`TileGlyphs`).
 *
 * C'EST UN REMPLACEMENT À L'AFFICHAGE, JAMAIS DANS LA DONNÉE : le texte d'une
 * tuile, la réponse envoyée à `onSubmit`, ce que lit la voix de Pio et ce que
 * reconnaissent les images gardent leurs espaces ordinaires. Les tests qui lisent
 * le texte exact affiché passent par `withoutNbsp`.
 */
import { typeset } from "@/components/landing/typeset";

const NBSP = " ";

/**
 * Un opérateur entre deux espaces, précédé d'un chiffre ou d'une parenthèse
 * fermante, suivi d'un chiffre, d'une parenthèse ouvrante, d'un trou ou d'un
 * « ? » : « 22 + 13 », « ) ÷ 5 », « 4 × ( », « 12 = ? ». Le moins s'écrit avec le
 * trait d'union, le signe moins ou le tiret demi-cadratin ; le deux-points est la
 * division française (« 20 : 4 »).
 */
const SPACED_OPERATOR = /([\d)]) ([+\-−–×x*÷/:=<>≤≥]) (?=[\d(?_…])/gu;

/** Le texte d'une tuile, composé pour l'écran : `typeset` et les calculs insécables. */
export function typesetTile(text: string): string {
  if (typeof text !== "string" || !text) return text;
  return typeset(text.replace(SPACED_OPERATOR, `$1${NBSP}$2${NBSP}`));
}
