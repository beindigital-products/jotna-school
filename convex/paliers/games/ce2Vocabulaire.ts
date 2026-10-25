/**
 * LES GABARITS DE VOCABULAIRE DU CE2 : les synonymes, les familles de mots, les homonymes, les formules pour commencer et pour terminer une lettre,
 * l'ordre alphabétique du dictionnaire (`fr-ce2-vocabulaire`).
 *
 * Sur l'échantillon de CE2 lu le 22 octobre 2026, le modèle écrivait ici des exercices faux ou discutables : « Place ces mots dans la bonne
 * catégorie : mère, mer, maire » (une seule catégorie « Homonymes » et une autre vide), « Associe chaque mot à son synonyme : grand / énorme »
 * (un synonyme plus fort), « Quel est le synonyme de rapide ? » avec « vite » (un adverbe pour un adjectif), des clés qui disaient « Les mots sont
 * bien classés ». Ici chaque exercice lit une ligne d'un tableau fermé.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les synonymes, les familles de mots (terre, terrain, enterrer), les homonymes (vers, verre, vert ; mer, mère, maire), les formules pour commencer et
 *   pour terminer une lettre, l'usage du dictionnaire (l'ordre alphabétique).
 * - Les jeux de mots de la fiche ne sont pas des gabarits : une devinette n'a pas de réponse qu'une clé puisse juger.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - Un synonyme est de même nature et de même force que le mot (heureux / content, pas grand / énorme) ; un mauvais choix est le contraire du mot ou un
 *   mot sans rapport, jamais un autre synonyme (« triste » a pour mauvais choix « joyeux » et « content », pas « malheureux »).
 * - Un mot d'une famille garde son radical (terre, terrain) : « tarte » et « tirer » ressemblent à « terre » sans en être. Un mauvais choix n'est jamais
 *   un mot que le dictionnaire met dans la famille.
 * - Un mot à trou de la série vert, verre, vers, ver est choisi pour que les autres mots ne tiennent pas dans la phrase (« La ___ est bleue » n'a pas de
 *   « mère » possible quand la phrase parle de bateaux) ; « la maire » existe au féminin : « Ma ___ » n'a donc jamais « maire » pour mauvais choix.
 * - Les formules de lettre se rangent en deux groupes qui ne se mêlent pas : celles qui commencent (« Cher Moussa, ») et celles qui terminent
 *   (« À bientôt, »).
 * - Un mot est écrit seul (« terrain », « dentiste »), jamais avec son article : `templatePictures.test.ts` refuse une option « article + un seul nom ».
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre
 * ni mot de quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile — les noms des cases comptent —, une liste de 4, 8, 12, 16 ou 20
 * lignes, jamais une bonne option deux fois plus longue que les autres).
 *
 * HORS FICHE, À FAIRE RELIRE : les douze couples de synonymes, les douze familles de mots (leurs mots et leurs faux amis), les douze phrases des
 * homonymes, les douze formules de lettre, les douze listes alphabétiques.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, combinations, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const VOCAB = "les synonymes, les familles de mots, les homonymes, les formules de lettre et l'ordre alphabétique";

/** Décale une liste de `by` lignes : les tableaux d'un même fait n'ont pas les mêmes mots dans le même quart. */
const rotate = <T>(rows: readonly T[], by: number): readonly T[] => [...rows.slice(by), ...rows.slice(0, by)];
/** `count` triplets pris au long de toutes les combinaisons de trois éléments. */
const spreadTrios = <T>(items: readonly T[], count: number): T[][] => {
  const all = combinations(items, 3);
  const step = all.length / count;
  return Array.from({ length: count }, (_, i) => all[Math.floor(i * step)]);
};

// ===========================================================================
// LES SYNONYMES
// ===========================================================================

type Synonym = { word: string; synonym: string; wrong: readonly [string, string] };
export const SYNONYMS: readonly Synonym[] = [
  { word: "heureux", synonym: "content", wrong: ["triste", "fâché"] },
  { word: "triste", synonym: "malheureux", wrong: ["joyeux", "content"] },
  { word: "beau", synonym: "joli", wrong: ["laid", "petit"] },
  { word: "finir", synonym: "terminer", wrong: ["commencer", "jouer"] },
  { word: "commencer", synonym: "débuter", wrong: ["finir", "manger"] },
  { word: "cadeau", synonym: "présent", wrong: ["cahier", "repas"] },
  { word: "peur", synonym: "crainte", wrong: ["joie", "force"] },
  { word: "courageux", synonym: "brave", wrong: ["peureux", "bruyant"] },
  { word: "gentil", synonym: "aimable", wrong: ["méchant", "pressé"] },
  { word: "voiture", synonym: "auto", wrong: ["train", "route"] },
  { word: "malin", synonym: "rusé", wrong: ["bête", "fatigué"] },
  { word: "énorme", synonym: "immense", wrong: ["minuscule", "léger"] },
];

const SYNONYM_HINTS = hints(
  "Cherche un mot que tu peux mettre à la place dans une phrase.",
  "Le sens doit rester presque le même.",
  "Un mot de sens contraire n'est pas la bonne réponse.",
);
const synonymFact = (row: Synonym) => `synonyme:${row.word}`;
export const SYNONYM_ROWS: readonly QuestionRow[] = SYNONYMS.map((row) =>
  qr(`Quel mot a presque le même sens que « ${row.word} » ?`, row.synonym, row.wrong, SYNONYM_HINTS, synonymFact(row)),
);
const SYNONYM_LINK_HINTS = hints("Lis chaque mot à gauche et cherche celui qui dit presque la même chose.", "Deux mots de sens contraire ne vont pas ensemble.", "Commence par le mot dont tu es le plus sûr.");
export const SYNONYM_LINK_ROWS: readonly LinkRow[] = spreadTrios(rotate(SYNONYMS, 6), 12).map((trio) => ({
  prompt: "Relie chaque mot à un mot de même sens.",
  pairs: trio.map((row) => ({ left: row.word, right: row.synonym })),
  hints: SYNONYM_LINK_HINTS,
}));

// ===========================================================================
// LES FAMILLES DE MOTS
// ===========================================================================

type Family = { root: string; members: readonly [string, string]; intruders: readonly [string, string] };
export const FAMILIES: readonly Family[] = [
  { root: "terre", members: ["terrain", "enterrer"], intruders: ["tarte", "tirer"] },
  { root: "dent", members: ["dentiste", "dentier"], intruders: ["danse", "dame"] },
  { root: "fleur", members: ["fleuriste", "fleurir"], intruders: ["fleuve", "flèche"] },
  { root: "lait", members: ["laitier", "laitage"], intruders: ["laine", "lampe"] },
  { root: "porte", members: ["portier", "portail"], intruders: ["pomme", "poule"] },
  { root: "jardin", members: ["jardinier", "jardiner"], intruders: ["jambon", "journal"] },
  { root: "mer", members: ["marin", "marée"], intruders: ["mère", "maire"] },
  { root: "cuisine", members: ["cuisinier", "cuisiner"], intruders: ["cuisse", "cuir"] },
  { root: "plume", members: ["plumage", "plumeau"], intruders: ["pluie", "plomb"] },
  { root: "danse", members: ["danseur", "danser"], intruders: ["dent", "dame"] },
  { root: "chant", members: ["chanteur", "chanter"], intruders: ["champ", "chat"] },
  { root: "neige", members: ["neiger", "neigeux"], intruders: ["nuage", "nager"] },
];
const FAMILY_HINTS = hints(
  "Un mot de la même famille garde le début du mot de départ.",
  "Il parle de la même chose que le mot de départ.",
  "Un mot qui lui ressemble peut venir d'une autre famille.",
);
const familyFact = (row: Family) => `famille:${row.root}`;
export const FAMILY_ROWS: readonly QuestionRow[] = rotate(FAMILIES, 3).map((row, i) =>
  qr(`Quel mot est de la famille de « ${row.root} » ?`, row.members[i % 2], row.intruders, FAMILY_HINTS, familyFact(row)),
);

const FAMILY_SORT_PAIRS: readonly (readonly [number, number])[] = [
  [0, 2], [1, 5], [2, 7], [3, 10], [4, 11], [5, 8], [6, 9], [7, 3], [8, 4], [9, 0], [10, 6], [11, 1],
];
const FAMILY_SORT_HINTS = hints(
  "Cherche le début que le mot partage avec le mot de départ.",
  "Les mots d'une même famille se ressemblent.",
  "Un mot qui lui ressemble sans parler de la même chose n'est pas de la famille.",
);
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
export const FAMILY_SORT_ROWS: readonly SortRow[] = FAMILY_SORT_PAIRS.map(([a, b]) => {
  const first = FAMILIES[a];
  const second = FAMILIES[b];
  return {
    prompt: "Glisse chaque mot dans la famille de son mot de départ.",
    zones: [capital(first.root), capital(second.root)] as const,
    items: [...first.members.map((text) => ({ text, zone: capital(first.root) })), ...second.members.map((text) => ({ text, zone: capital(second.root) }))],
    hints: FAMILY_SORT_HINTS,
  };
});

// ===========================================================================
// LES HOMONYMES
// ===========================================================================

const HOMONYM_HINTS = hints(
  "Lis la phrase en entier pour comprendre le sens du mot.",
  "Ces mots se disent pareil mais ne veulent pas dire la même chose.",
  "Cherche le mot qui a du sens dans la phrase.",
);
const homonym = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, HOMONYM_HINTS);
export const HOMONYM_ROWS: readonly GapRow[] = [
  homonym("Il boit un ___ d'eau.", "verre", ["vert", "vers"]),
  homonym("Les bateaux naviguent sur la ___.", "mer", ["vers", "vert"]),
  homonym("Le feuillage du manguier est ___.", "vert", ["verre", "ver"]),
  homonym("Ma ___ prépare le repas.", "mère", ["mer", "vers"]),
  homonym("Awa court ___ la porte.", "vers", ["verre", "vert"]),
  homonym("Le ___ du village parle aux habitants.", "maire", ["mer", "mère"]),
  homonym("Un petit ___ sort de la terre.", "ver", ["vert", "verre"]),
  homonym("Les pêcheurs partent en ___.", "mer", ["mère", "maire"]),
  homonym("Le chemin va ___ le puits.", "vers", ["vert", "ver"]),
  homonym("La ___ de Moussa lui sourit.", "mère", ["mer", "vert"]),
  homonym("Le ___ s'est cassé sur la table.", "verre", ["vert", "ver"]),
  homonym("Le ___ signe un papier important.", "maire", ["mer", "vert"]),
];

// ===========================================================================
// LES FORMULES DE LETTRE
// ===========================================================================

const OPENINGS = ["Cher Moussa,", "Chère Fatou,", "Chers amis,", "Bonjour tante Awa,", "Chère maîtresse,", "Cher grand-père,"] as const;
const CLOSINGS = ["À bientôt,", "Je t'embrasse,", "Amicalement,", "Bien à toi,", "Avec affection,", "À très vite,"] as const;
const LETTER_HINTS = hints(
  "Une lettre commence par un mot gentil pour la personne.",
  "Elle finit par une formule polie avant la signature.",
  "Regarde quelle formule ouvre la lettre et quelle formule la ferme.",
);
export const LETTER_FORMULA_ROWS: readonly QuestionRow[] = [0, 1, 2, 3, 4, 5].flatMap((i) => [
  qr("Quelle formule sert à commencer une lettre ?", OPENINGS[i], [CLOSINGS[i], CLOSINGS[(i + 2) % 6]], LETTER_HINTS, `formule:ouvre:${i}`),
  qr("Quelle formule sert à terminer une lettre ?", CLOSINGS[(i + 3) % 6], [OPENINGS[i], OPENINGS[(i + 2) % 6]], LETTER_HINTS, `formule:ferme:${i}`),
]);

// ===========================================================================
// L'ORDRE ALPHABÉTIQUE
// ===========================================================================

const ALPHABETICAL: readonly (readonly [string, string, string])[] = [
  ["banane", "mangue", "orange"],
  ["cahier", "livre", "stylo"],
  ["arbre", "maison", "table"],
  ["chat", "lion", "zèbre"],
  ["dent", "main", "pied"],
  ["école", "fleuve", "route"],
  ["lait", "lampe", "lion"],
  ["panier", "pomme", "puits"],
  ["riz", "sel", "thé"],
  ["natte", "nez", "nid"],
  ["vache", "vélo", "ville"],
  ["jambe", "jeu", "joue"],
];
const ALPHABET_HINTS = hints(
  "Compare la première lettre de chaque mot.",
  "Si deux mots commencent pareil, regarde la deuxième lettre.",
  "Dans l'alphabet, a vient avant b et b avant c.",
);
export const ALPHABET_ROWS: readonly OrderRow[] = ALPHABETICAL.map((words) => ordr("Mets ces mots dans l'ordre alphabétique.", words, ALPHABET_HINTS));

// ===========================================================================
// ÉCRIRE UN MOT
// ===========================================================================

const DICTIONARY_HINTS = hints("C'est un gros livre qui explique les mots.", "On y cherche le sens d'un mot que l'on ne connaît pas.", "Le mot commence par d.");
const HOMONYM_WRITE_HINTS = hints("Ces mots se disent pareil mais ne s'écrivent pas pareil.", "Le nom de ces mots commence par h.", "Écris seulement le mot.");
const COLOUR_WRITE_HINTS = hints("Ce mot se dit comme « verre » mais s'écrit autrement.", "C'est la couleur de l'herbe.", "Écris seulement le mot.");
const SYNONYM_WRITE_HINTS = hints("Ces mots veulent dire presque la même chose.", "Le nom de ces mots commence par s.", "Écris seulement le mot.");
const FAMILY_WRITE_HINTS = hints("Ces termes viennent du même terme de départ.", "Ils se ressemblent par leur début.", "Écris un seul terme, celui du trou.");
/**
 * « Comment appelle-t-on dent, dentiste et dentier ? Écris les trois mots. » se lisait « recopie ces trois mots » (défaut relevé en production le
 * 25 octobre 2026) : la phrase a un trou d'un seul mot, et le juge ignore l'article de tête (« une famille »).
 */
const familyWrite = (words: string): WriteRow => wr(`Des mots comme ${words} forment une ___ de mots. Écris le mot qui manque.`, ["famille", "famille de mots"], FAMILY_WRITE_HINTS);
const ORDER_WRITE_HINTS = hints("Les mots du dictionnaire sont rangés comme les lettres de l'alphabet.", "A est la première lettre, z la dernière.", "Écris les deux mots.");
const SPELLING_WRITE_HINTS = hints("Ces mots se disent pareil mais ne s'écrivent pas pareil.", "Pense au petit mot qui commence par m et finit par e.", "Écris seulement le mot.");
export const VOCAB_WRITE_ROWS: readonly WriteRow[] = [
  wr("Dans quel livre cherche-t-on le sens d'un mot ? Écris le mot.", ["dictionnaire", "le dictionnaire"], DICTIONARY_HINTS),
  wr("Comment appelle-t-on deux mots qui se disent pareil mais s'écrivent autrement ? Écris le mot.", ["homonymes", "des homonymes"], HOMONYM_WRITE_HINTS),
  wr("Comment appelle-t-on des mots de sens proche, comme heureux et content ? Écris le mot.", ["synonymes", "des synonymes"], SYNONYM_WRITE_HINTS),
  familyWrite("terre, terrain et enterrer"),
  wr("Quel livre explique les mots dans l'ordre alphabétique ? Écris le mot.", ["dictionnaire", "le dictionnaire"], DICTIONARY_HINTS),
  wr("Comment appelle-t-on vert, verre et vers, qui se disent pareil ? Écris le mot.", ["homonymes", "des homonymes"], HOMONYM_WRITE_HINTS),
  wr("Comment appelle-t-on joli et beau, qui veulent dire presque la même chose ? Écris le mot.", ["synonymes", "des synonymes"], SYNONYM_WRITE_HINTS),
  familyWrite("dent, dentiste et dentier"),
  wr("Dans quel ordre les mots du dictionnaire sont-ils rangés ? Écris les deux mots.", ["ordre alphabétique", "l'ordre alphabétique", "alphabétique"], ORDER_WRITE_HINTS),
  wr("Les mots d'un dictionnaire se suivent selon quel ordre ? Écris les deux mots.", ["ordre alphabétique", "l'ordre alphabétique", "alphabétique"], ORDER_WRITE_HINTS),
  wr("Quel homonyme de « mer » désigne la maman ? Écris le mot.", ["mère"], SPELLING_WRITE_HINTS),
  wr("Quel homonyme de « verre » est une couleur ? Écris le mot.", ["vert"], COLOUR_WRITE_HINTS),
];

export function makeCe2VocabSynonym(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-vocab-synonyme", VOCAB, SYNONYM_ROWS, 2);
}
export function makeCe2VocabSynonymLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-vocab-synonyme-relier", VOCAB, SYNONYM_LINK_ROWS);
}
export function makeCe2VocabFamily(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-vocab-famille", VOCAB, FAMILY_ROWS);
}
export function makeCe2VocabFamilySort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-vocab-famille-glisser", VOCAB, FAMILY_SORT_ROWS);
}
export function makeCe2VocabHomonym(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-vocab-homonyme", VOCAB, HOMONYM_ROWS, 2);
}
export function makeCe2VocabLetter(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-vocab-lettre", VOCAB, LETTER_FORMULA_ROWS, 1, (row) => row.answer);
}
export function makeCe2VocabAlphabet(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-vocab-ordre", VOCAB, ALPHABET_ROWS);
}
export function makeCe2VocabWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-vocab-ecrire", VOCAB, VOCAB_WRITE_ROWS);
}
