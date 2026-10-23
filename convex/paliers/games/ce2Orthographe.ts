/**
 * LES GABARITS D'ORTHOGRAPHE DU CE2 : le féminin des noms, le pluriel des noms, ou et où, son et sont (`fr-ce2-orthographe`).
 *
 * Sur l'échantillon de CE2 lu le 22 octobre 2026, le modèle écrivait ici des exercices faux ou creux : « ___ (ils/ils sont) là » (un trou dont le
 * choix répète l'énoncé), « Remets ces mots dans l'ordre : à / Mame / la / mangue » (une phrase qui n'en est pas une), « Le pluriel ajoute -s à
 * fille. C'est comme fils et fils », une clé qui disait « Les mots sont correctement associés ». Ici chaque exercice lit une ligne d'un tableau
 * fermé : le mot et son féminin, le mot et son pluriel, la phrase et son petit mot.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Le féminin des noms : un lion / une lionne, un boulanger / une boulangère, un maître / une maîtresse ; avec la même règle, un ami / une amie, un
 *   cousin / une cousine, un chanteur / une chanteuse, un musicien / une musicienne, un chien / une chienne.
 * - Le pluriel des noms : -s (une fille, des filles), -x (un gâteau, des gâteaux), -al devient -aux (un cheval, des chevaux).
 * - Les homophones ou / où et son / sont.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - Les exceptions du pluriel (un bal, des bals ; un pneu, des pneus ; un bijou, des bijoux) ne sont jamais demandées : la fiche ne les donne pas.
 * - Un mauvais choix de féminin ou de pluriel est une forme qui n'existe pas (« lione », « gâteaus », « chevales ») ou le singulier : jamais un autre mot
 *   du dictionnaire qui irait aussi.
 * - Un mauvais choix de « ou / où » ou de « son / sont » est un mot qui ne tient pas dans la phrase : « au » n'y va jamais, « ont » n'y va jamais.
 * - Un nom est écrit seul (« lionne », « cheval »), jamais avec son article : `templatePictures.test.ts` refuse une option « article + un seul nom ».
 *   Les articles sont dans l'énoncé (« Un lion, une ___ »), qui n'est pas une option.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre
 * ni mot de quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 4, 8, 12, 16 ou 20 lignes). Les tableaux d'un même
 * fait (le féminin de « boulanger » en QCM, en trou, en appariement, à écrire) sont décalés l'un de l'autre, pour qu'un palier ne pose pas deux fois le
 * même mot.
 *
 * HORS FICHE, À FAIRE RELIRE : les neuf féminins au-delà des trois de la fiche (ami, cousin, chanteur, vendeur, danseur, musicien, chien, berger, voisin),
 * les seize pluriels (feu, jeu, cheveu, canal, hôpital, journal, animal…), les phrases de ou / où et de son / sont.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  ce2Gap,
  ce2Link,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  gr,
  hints,
  qr,
  sortRows,
  wr,
  type GapRow,
  type LinkRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const ORTHO = "le féminin et le pluriel des noms, ou et où, son et sont";

/** Décale une liste de `by` lignes : les tableaux d'un même fait n'ont pas les mêmes mots dans le même quart. */
const rotate = <T>(rows: readonly T[], by: number): readonly T[] => [...rows.slice(by), ...rows.slice(0, by)];

// ===========================================================================
// LE FÉMININ DES NOMS
// ===========================================================================

type Feminine = { masculine: string; feminine: string; wrong: readonly [string, string] };
export const FEMININES: readonly Feminine[] = [
  { masculine: "lion", feminine: "lionne", wrong: ["lione", "lionnes"] },
  { masculine: "boulanger", feminine: "boulangère", wrong: ["boulangeuse", "boulangere"] },
  { masculine: "maître", feminine: "maîtresse", wrong: ["maîtrèsse", "maîtrese"] },
  { masculine: "ami", feminine: "amie", wrong: ["amis", "amiee"] },
  { masculine: "cousin", feminine: "cousine", wrong: ["cousinne", "cousines"] },
  { masculine: "chanteur", feminine: "chanteuse", wrong: ["chanteure", "chanteuze"] },
  { masculine: "vendeur", feminine: "vendeuse", wrong: ["vendeure", "vendeuze"] },
  { masculine: "musicien", feminine: "musicienne", wrong: ["musiciene", "musicienee"] },
  { masculine: "chien", feminine: "chienne", wrong: ["chiene", "chiennee"] },
  { masculine: "berger", feminine: "bergère", wrong: ["bergeuse", "bergere"] },
  { masculine: "voisin", feminine: "voisine", wrong: ["voisinne", "voisines"] },
  { masculine: "danseur", feminine: "danseuse", wrong: ["danseure", "danseuze"] },
];
const feminineOf = (masculine: string): Feminine => FEMININES.find((row) => row.masculine === masculine) as Feminine;

const FEMININE_HINTS = hints(
  "Pense à la fin du mot : elle change au féminin.",
  "Beaucoup de noms prennent un e, d'autres doublent une lettre ou changent de fin.",
  "Dis « une » devant le mot pour entendre le féminin.",
);
const feminineFact = (row: Feminine) => `féminin:${row.masculine}`;

export const FEMININE_CHOICE_ROWS: readonly QuestionRow[] = FEMININES.map((row) =>
  qr(`Quel est le féminin de « ${row.masculine} » ?`, row.feminine, row.wrong, FEMININE_HINTS, feminineFact(row)),
);
export const FEMININE_GAP_ROWS: readonly GapRow[] = rotate(FEMININES, 4).map((row) =>
  gr(`Un ${row.masculine}, une ___.`, row.feminine, row.wrong, FEMININE_HINTS, feminineFact(row)),
);
const FEMININE_LINK_HINTS = hints("Cherche les deux mots qui se ressemblent le plus.", "Le féminin garde le début du mot et change sa fin.", "Commence par le mot dont tu es le plus sûr.");
const feminineLinkRows = (): LinkRow[] => {
  const all = combinations(rotate(FEMININES, 8), 3);
  const step = all.length / 12;
  return Array.from({ length: 12 }, (_, i) => all[Math.floor(i * step)]).map((trio) => ({
    prompt: "Relie chaque nom à son féminin.",
    pairs: trio.map((row) => ({ left: row.masculine, right: row.feminine })),
    hints: FEMININE_LINK_HINTS,
  }));
};
export const FEMININE_LINK_ROWS: readonly LinkRow[] = feminineLinkRows();

// ===========================================================================
// LE PLURIEL DES NOMS
// ===========================================================================

/** `article` : « Une » pour un nom féminin (« Une mangue, des mangues »), « Un » sinon. */
type Plural = { singular: string; plural: string; wrong: readonly [string, string]; article?: "Une" };
export const PLURALS: readonly Plural[] = [
  { singular: "fille", plural: "filles", wrong: ["fille", "fillex"], article: "Une" },
  { singular: "cahier", plural: "cahiers", wrong: ["cahier", "cahierx"] },
  { singular: "mangue", plural: "mangues", wrong: ["mangue", "manguex"], article: "Une" },
  { singular: "chat", plural: "chats", wrong: ["chat", "chatx"] },
  { singular: "gâteau", plural: "gâteaux", wrong: ["gâteaus", "gâteau"] },
  { singular: "oiseau", plural: "oiseaux", wrong: ["oiseaus", "oiseau"] },
  { singular: "bateau", plural: "bateaux", wrong: ["bateaus", "bateau"] },
  { singular: "château", plural: "châteaux", wrong: ["châteaus", "château"] },
  { singular: "jeu", plural: "jeux", wrong: ["jeus", "jeu"] },
  { singular: "feu", plural: "feux", wrong: ["feus", "feu"] },
  { singular: "cheveu", plural: "cheveux", wrong: ["cheveus", "cheveu"] },
  { singular: "cheval", plural: "chevaux", wrong: ["chevals", "chevales"] },
  { singular: "animal", plural: "animaux", wrong: ["animals", "animales"] },
  { singular: "journal", plural: "journaux", wrong: ["journals", "journales"] },
  { singular: "hôpital", plural: "hôpitaux", wrong: ["hôpitals", "hôpitales"] },
  { singular: "canal", plural: "canaux", wrong: ["canals", "canales"] },
];
const pluralOf = (singular: string): Plural => PLURALS.find((row) => row.singular === singular) as Plural;

const PLURAL_HINTS = hints(
  "Pense à la fin du mot : elle change au pluriel.",
  "La plupart des noms prennent un s, d'autres un x, et ceux qui finissent comme cheval changent de fin.",
  "Dis « des » devant le mot pour entendre le pluriel.",
);
const pluralFact = (row: Plural) => `pluriel:${row.singular}`;

export const PLURAL_CHOICE_ROWS: readonly QuestionRow[] = rotate(PLURALS, 4).map((row) =>
  qr(`Quel est le pluriel de « ${row.singular} » ?`, row.plural, row.wrong, PLURAL_HINTS, pluralFact(row)),
);
export const PLURAL_GAP_ROWS: readonly GapRow[] = rotate(PLURALS, 8).map((row) => gr(`${row.article ?? "Un"} ${row.singular}, des ___.`, row.plural, row.wrong, PLURAL_HINTS, pluralFact(row)));

const SINGULAR_TILES = ["cheval", "gâteau", "animal", "oiseau", "journal", "cahier", "feu", "canal"] as const;
const PLURAL_TILES = ["chevaux", "gâteaux", "animaux", "oiseaux", "journaux", "cahiers", "feux", "filles"] as const;
export const PLURAL_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque mot dans la bonne case.",
  ["Singulier", "Pluriel"],
  SINGULAR_TILES,
  PLURAL_TILES,
  hints("Un seul ou plusieurs ?", "Beaucoup de mots à plusieurs finissent par s ou par x.", "Les mots en al font aux quand ils sont plusieurs."),
  12,
);

// ===========================================================================
// OU ET OÙ, SON ET SONT
// ===========================================================================

const OU_HINTS = hints(
  "Remplace le petit mot par ou bien : si la phrase tient, il s'écrit sans accent.",
  "Quand la phrase parle d'un endroit, le petit mot prend un accent.",
  "Lis la phrase en entier pour comprendre le sens du petit mot.",
);
const ouGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, OU_HINTS);
export const OU_GAP_ROWS: readonly GapRow[] = [
  ouGap("___ habites-tu ?", "Où", ["Ou", "Au"]),
  ouGap("Veux-tu du riz ___ du pain ?", "ou", ["où", "au"]),
  ouGap("Le village ___ je suis né est loin.", "où", ["ou", "au"]),
  ouGap("Tu viens à pied ___ en car ?", "ou", ["où", "au"]),
  ouGap("___ est mon cahier ?", "Où", ["Ou", "Au"]),
  ouGap("Awa ___ Fatou arrive demain.", "ou", ["où", "au"]),
  ouGap("Je ne sais pas ___ il est.", "où", ["ou", "au"]),
  ouGap("Le champ ___ travaille mon père est grand.", "où", ["ou", "au"]),
  ouGap("Prends le bleu ___ le rouge.", "ou", ["où", "au"]),
  ouGap("___ vont les enfants ?", "Où", ["Ou", "Au"]),
  ouGap("Mange un fruit ___ prends un jus.", "ou", ["où", "au"]),
  ouGap("La case ___ nous habitons est petite.", "où", ["ou", "au"]),
];

const SON_HINTS = hints(
  "Remplace le petit mot par étaient : si la phrase tient, c'est le verbe.",
  "Si tu peux dire mon ou ton à la place, c'est celui qui montre à qui appartient la chose.",
  "Regarde le mot qui suit le petit mot.",
);
const sonGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, SON_HINTS);
export const SON_GAP_ROWS: readonly GapRow[] = [
  sonGap("Les enfants ___ contents.", "sont", ["son", "ont"]),
  sonGap("___ cahier est bleu.", "Son", ["Sont", "Ont"]),
  sonGap("Ils ___ au marché.", "sont", ["son", "ont"]),
  sonGap("Moussa range ___ sac.", "son", ["sont", "ont"]),
  sonGap("Elles ___ en classe.", "sont", ["son", "ont"]),
  sonGap("Fatou aime ___ frère.", "son", ["sont", "ont"]),
  sonGap("Les mangues ___ mûres.", "sont", ["son", "ont"]),
  sonGap("Awa a perdu ___ crayon.", "son", ["sont", "ont"]),
  sonGap("Mes amis ___ gentils.", "sont", ["son", "ont"]),
  sonGap("Omar lave ___ vélo.", "son", ["sont", "ont"]),
  sonGap("Les élèves ___ dans la cour.", "sont", ["son", "ont"]),
  sonGap("Pape suit ___ père.", "son", ["sont", "ont"]),
];

const HOMOPHONE_HINTS = hints(
  "Les trois phrases se disent de la même façon, une seule s'écrit juste.",
  "Essaie de remplacer le petit mot : par ou bien, par étaient, ou par mon.",
  "Lis chaque phrase en entier avant de choisir.",
);
const homophone = (answer: string, wrong: readonly [string, string]): QuestionRow => qr("Quelle phrase est écrite correctement ?", answer, wrong, HOMOPHONE_HINTS);
export const HOMOPHONE_ROWS: readonly QuestionRow[] = [
  homophone("Il mange son riz.", ["Il mange sont riz.", "Il mange ont riz."]),
  homophone("Où vas-tu ?", ["Ou vas-tu ?", "Au vas-tu ?"]),
  homophone("Les filles sont gentilles.", ["Les filles son gentilles.", "Les filles ont gentilles."]),
  homophone("Veux-tu du lait ou du jus ?", ["Veux-tu du lait où du jus ?", "Veux-tu du lait au du jus ?"]),
  homophone("Son frère est grand.", ["Sont frère est grand.", "Ont frère est grand."]),
  homophone("Voici le puits où nous puisons.", ["Voici le puits ou nous puisons.", "Voici le puits au nous puisons."]),
  homophone("Ils sont partis.", ["Ils son partis.", "Ils ont partis."]),
  homophone("Fatou ou Awa arrive.", ["Fatou où Awa arrive.", "Fatou au Awa arrive."]),
  homophone("Elles sont en classe.", ["Elles son en classe.", "Elles ont en classe."]),
  homophone("Où est ton cahier ?", ["Ou est ton cahier ?", "Au est ton cahier ?"]),
  homophone("Moussa lave son sac.", ["Moussa lave sont sac.", "Moussa lave ont sac."]),
  homophone("Prends le bleu ou le rouge.", ["Prends le bleu où le rouge.", "Prends le bleu au le rouge."]),
];

// ===========================================================================
// ÉCRIRE UN MOT
// ===========================================================================

const FEMININE_WRITE_HINTS = hints("Pense à la fin du mot : elle change au féminin.", "Dis « une » devant le mot pour entendre le féminin.", "Écris seulement le mot.");
const PLURAL_WRITE_HINTS = hints("Pense à la fin du mot : elle change au pluriel.", "Dis « des » devant le mot pour entendre le pluriel.", "Écris seulement le mot.");
const HOMOPHONE_WRITE_HINTS = hints("Lis la phrase en entier pour comprendre le sens du petit mot.", "Essaie de le remplacer par un autre petit mot.", "Écris seulement le petit mot.");
/** « de » devant un mot, élidé devant une voyelle ou un h muet : « de cahier », « d'animal », « d'oiseau ». Aucun nom des tableaux ne commence par un h aspiré. */
const deWord = (word: string): string => (/^[aeiouyàâéèêëîïôûùh]/iu.test(word) ? `d'${word}` : `de ${word}`);
const feminineWrite = (masculine: string): WriteRow => {
  const row = feminineOf(masculine);
  return wr(`Écris le féminin ${deWord(row.masculine)}.`, [row.feminine], FEMININE_WRITE_HINTS, feminineFact(row));
};
const pluralWrite = (singular: string): WriteRow => {
  const row = pluralOf(singular);
  return wr(`Écris le pluriel ${deWord(row.singular)}.`, [row.plural], PLURAL_WRITE_HINTS, pluralFact(row));
};
export const ORTHO_WRITE_ROWS: readonly WriteRow[] = [
  feminineWrite("boulanger"),
  feminineWrite("maître"),
  feminineWrite("lion"),
  feminineWrite("musicien"),
  pluralWrite("cheval"),
  pluralWrite("gâteau"),
  pluralWrite("journal"),
  pluralWrite("oiseau"),
  wr("Quel mot complète « ___ habites-tu ? » Écris le mot.", ["où"], HOMOPHONE_WRITE_HINTS),
  wr("Quel mot complète « Moussa range ___ sac. » Écris le mot.", ["son"], HOMOPHONE_WRITE_HINTS),
  feminineWrite("chanteur"),
  pluralWrite("animal"),
];

export function makeCe2OrthoFeminineChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-ortho-feminin", ORTHO, FEMININE_CHOICE_ROWS);
}
export function makeCe2OrthoFeminineGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-ortho-feminin-trou", ORTHO, FEMININE_GAP_ROWS);
}
export function makeCe2OrthoFeminineLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-ortho-feminin-relier", ORTHO, FEMININE_LINK_ROWS);
}
export function makeCe2OrthoPluralChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-ortho-pluriel", ORTHO, PLURAL_CHOICE_ROWS);
}
export function makeCe2OrthoPluralGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-ortho-pluriel-trou", ORTHO, PLURAL_GAP_ROWS);
}
export function makeCe2OrthoPluralSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-ortho-pluriel-glisser", ORTHO, PLURAL_SORT_ROWS);
}
export function makeCe2OrthoOu(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-ortho-ou", ORTHO, OU_GAP_ROWS);
}
export function makeCe2OrthoSon(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-ortho-son", ORTHO, SON_GAP_ROWS);
}
export function makeCe2OrthoHomophone(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-ortho-homophone", ORTHO, HOMOPHONE_ROWS, 1, (row) => row.answer);
}
export function makeCe2OrthoWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-ortho-ecrire", ORTHO, ORTHO_WRITE_ROWS);
}
