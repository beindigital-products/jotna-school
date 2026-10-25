/**
 * LES AIDES DE L'ANGLAIS DU CM1 : de quoi bâtir des lignes de tableau à partir de petites tables fermées (un sujet, un verbe, un complément).
 *
 * Une phrase anglaise ne s'écrit pas à la main ici : elle se DÉDUIT d'un sujet, d'un verbe et d'un complément pris dans des tables, avec
 * la règle de la fiche (le s de he, she, it ; do ou does ; am, is ou are + -ing ; at ou in). Les mauvais choix sont les fautes d'enfant de la
 * fiche, jamais une phrase qui serait juste aussi. Les lignes passent ensuite par les aides du CE2 (`ce2Outils.ts`) qui donnent à chaque
 * palier sa fenêtre de lignes : les thématiques du CM1 ont deux, trois ou quatre paliers.
 *
 * COMME AU CE2 : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend ; aucune écoute ni prononciation ; aucun
 * indice n'écrit un mot de quatre lettres ou plus d'une bonne réponse ; les énoncés n'ont aucun « : », au plus une apostrophe droite,
 * vingt-huit mots au plus ; aucun émoji. Les formes contractées (I'm, don't, isn't) ne sont jamais exigées ni proposées.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { hints, type Hints, type LinkRow } from "./ce2Outils";

export const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** « Le mot commence par la lettre p. » : le troisième indice d'une réponse courte. */
export const firstLetter = (word: string) => `Le mot commence par la lettre ${word.charAt(0).toLowerCase()}.`;

/** Les mots d'une phrase, tels qu'on les range : la ponctuation reste collée au dernier mot. */
export const wordsOf = (sentence: string) => sentence.split(" ");

/**
 * Mêle plusieurs listes en tournant (une ligne de chaque, puis une autre de chaque) : la fenêtre d'un palier, qui est une part continue
 * de la liste, voit ainsi un peu de chaque sorte de ligne au lieu de n'en voir qu'une.
 */
export function interleave<T>(...lists: readonly (readonly T[])[]): T[] {
  // Chaque ligne a sa place relative dans sa liste ; en les triant par cette place, les listes plus courtes se répartissent sur toute la
  // longueur au lieu de s'épuiser au début.
  return lists
    .flatMap((list, l) => list.map((item, i) => ({ item, at: (i + 0.5) / list.length, l })))
    .sort((a, b) => a.at - b.at || a.l - b.l)
    .map(({ item }) => item);
}

export const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
export const startsWithVowel = (word: string) => /^[aeiouéèê]/i.test(word);
/** Le complément d'une phrase, avec son espace devant : vide quand le verbe se suffit (« It sleeps. »). */
export const withObj = (obj: string) => (obj === "" ? "" : ` ${obj}`);

/** Des trios de lignes qui se suivent : les deux côtés de chaque paire diffèrent quand les lignes diffèrent. */
export const trios = <T,>(rows: readonly T[], step: number): T[][] => {
  const out: T[][] = [];
  for (let start = 0; start + 3 <= rows.length; start += step) out.push(rows.slice(start, start + 3));
  return out;
};

export const SENTENCE_PROMPT = "Remets les mots dans l'ordre pour écrire une phrase.";
export const QUESTION_PROMPT = "Remets les mots dans l'ordre pour écrire une question.";
export const SENTENCE_HINTS: Hints = hints("Une phrase commence par une majuscule.", "Le sujet vient d'abord, puis le verbe.", "Le dernier mot finit par un point.");
export const QUESTION_HINTS: Hints = hints("Une question commence par une majuscule.", "Dans une question, le petit mot d'aide vient avant le sujet.", "Le dernier mot finit par un point d'interrogation.");
export const SORT_PROMPT = "Glisse chaque phrase dans la bonne case.";
export const SORT_HINTS_EN: Hints = hints("Lis chaque étiquette en entier.", "Cherche ce qui change d'une case à l'autre.", "Les étiquettes d'une même case se ressemblent.");
export const LINK_HINTS_EN: Hints = hints("Lis les deux colonnes avant de relier.", "Dis le mot anglais, puis cherche son sens.", "Commence par la paire dont tu es le plus sûr.");
export const REPLY_HINTS: Hints = hints("Lis la question, puis ce que tu réponds : oui ou non.", "La réponse reprend le petit mot d'aide de la question.", "Après non, ce petit mot est suivi de not.");

/** Des paires à relier : l'anglais à gauche, le sens à droite. */
export const link = (prompt: string, pairs: readonly (readonly [string, string])[], fact?: string): LinkRow => ({
  prompt,
  pairs: pairs.map(([left, right]) => ({ left, right })),
  hints: LINK_HINTS_EN,
  ...(fact === undefined ? {} : { fact }),
});
