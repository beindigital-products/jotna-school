/**
 * LES AIDES DE L'ANGLAIS DU CM2 : de quoi bâtir des lignes de tableau à partir de petites tables fermées (un sujet, un verbe, un complément).
 *
 * Une phrase anglaise ne s'écrit pas à la main ici : elle se DÉDUIT d'un sujet, d'un verbe et d'un complément pris dans des tables, avec la
 * règle de la fiche (was ou were ; le verbe qui reste à l'infinitif après did ; am, is ou are devant going to ; -er et -est ou more et most).
 * Les mauvais choix sont les fautes d'enfant de la fiche, jamais une phrase qui serait juste aussi. Les lignes passent ensuite par les aides
 * du CE2 (`ce2Outils.ts`) qui donnent à chaque palier sa fenêtre de lignes : les thématiques du CM2 ont trois ou quatre paliers.
 *
 * COMME AU CE2 : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend ; aucune écoute ni prononciation ; aucun
 * indice n'écrit un mot de quatre lettres ou plus d'une bonne réponse ; les énoncés n'ont aucun « : » et au plus une apostrophe droite ;
 * aucun émoji. Les formes contractées (I'm, didn't, wasn't) ne sont jamais exigées ni proposées.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { hints, type Hints, type LinkRow } from "./ce2Outils";

export const cm2EnCap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** « Le mot commence par la lettre p. » : le troisième indice d'une réponse courte. */
export const cm2EnFirstLetter = (word: string) => `Le mot commence par la lettre ${word.charAt(0).toLowerCase()}.`;

/** Les mots d'une phrase, tels qu'on les range : la ponctuation reste collée au dernier mot. */
export const cm2EnWordsOf = (sentence: string) => sentence.split(" ");

/**
 * Mêle plusieurs listes en tournant : la fenêtre d'un palier, qui est une part continue de la liste, voit ainsi un peu de chaque sorte de
 * ligne au lieu de n'en voir qu'une. Chaque ligne a sa place relative dans sa liste ; en les triant par cette place, les listes plus courtes
 * se répartissent sur toute la longueur au lieu de s'épuiser au début.
 */
export function cm2EnInterleave<T>(...lists: readonly (readonly T[])[]): T[] {
  return lists
    .flatMap((list, l) => list.map((item, i) => ({ item, at: (i + 0.5) / list.length, l })))
    .sort((a, b) => a.at - b.at || a.l - b.l)
    .map(({ item }) => item);
}

export const cm2EnApostrophes = (text: string) => (text.match(/'/g) ?? []).length;
export const cm2EnStartsWithVowel = (word: string) => /^[aeiouéèêh]/i.test(word);
/** Le complément d'une phrase, avec son espace devant : vide quand le verbe se suffit (« I danced yesterday. »). */
export const cm2EnWithObj = (obj: string) => (obj === "" ? "" : ` ${obj}`);

/** Des trios de lignes qui se suivent : les deux côtés de chaque paire diffèrent quand les lignes diffèrent. */
export const cm2EnTrios = <T,>(rows: readonly T[], step: number): T[][] => {
  const out: T[][] = [];
  for (let start = 0; start + 3 <= rows.length; start += step) out.push(rows.slice(start, start + 3));
  return out;
};

export const CM2_EN_SENTENCE_PROMPT = "Remets les mots dans l'ordre pour écrire une phrase.";
export const CM2_EN_QUESTION_PROMPT = "Remets les mots dans l'ordre pour écrire une question.";
export const CM2_EN_SENTENCE_HINTS: Hints = hints("Une phrase commence par une majuscule.", "Le sujet vient d'abord, puis le verbe.", "Le dernier mot finit par un point.");
export const CM2_EN_QUESTION_HINTS: Hints = hints("Une question commence par une majuscule.", "Dans une question, le petit mot d'aide vient avant le sujet.", "Le dernier mot finit par un point d'interrogation.");
export const CM2_EN_SORT_PROMPT = "Glisse chaque étiquette dans la bonne case.";
export const CM2_EN_SORT_HINTS: Hints = hints("Lis chaque étiquette en entier.", "Cherche ce qui change d'une case à l'autre.", "Les étiquettes d'une même case se ressemblent.");
export const CM2_EN_LINK_HINTS: Hints = hints("Lis chaque colonne en entier avant de relier.", "Dis le mot anglais, puis cherche son sens.", "Commence par la paire dont tu es le plus sûr.");
export const CM2_EN_REPLY_HINTS: Hints = hints("Lis la question, puis ce que tu réponds : oui ou non.", "La réponse reprend le petit mot d'aide de la question.", "Après non, ce petit mot est suivi de not.");

/** Des paires à relier : l'anglais à gauche, le sens à droite. */
export const cm2EnLink = (prompt: string, pairs: readonly (readonly [string, string])[], fact?: string): LinkRow => ({
  prompt,
  pairs: pairs.map(([left, right]) => ({ left, right })),
  hints: CM2_EN_LINK_HINTS,
  ...(fact === undefined ? {} : { fact }),
});
