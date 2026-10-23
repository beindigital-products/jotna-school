/**
 * LES GABARITS DE LECTURE DU CE2 : lire une lettre (l'expéditeur, le destinataire, la date, la formule de politesse), lire une affiche (de quoi, où,
 * quand, combien), lire un poème (les strophes, les vers, les rimes) (`fr-ce2-lecture`).
 *
 * Sur l'échantillon de CE2 lu le 22 octobre 2026, le modèle écrivait ici des questions sans texte ou avec un texte qui ne disait pas la réponse :
 * « Combien de strophes a ce poème ? » sans aucun poème à l'écran, « Associe chaque élément à son contenu » sur une affiche absente, « Complète la
 * phrase : Les ____ dansent dans le vent » (un trou sans réponse unique), « Remets cette phrase dans l'ordre » sur un récit de trois phrases.
 * Ici le TEXTE est dans l'énoncé et la réponse s'y lit : chaque lettre, chaque affiche, chaque poème est écrit à partir de champs (le lieu, la date, le
 * destinataire, le corps ; le titre, l'endroit, le moment, le prix ; les vers), et un mauvais choix est une chose que le texte ne dit pas.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Une lettre : l'expéditeur (qui écrit), le destinataire (à qui), la date, la formule de politesse. Une affiche : quoi, où, quand, combien. Un poème :
 *   des vers, des strophes, des rimes. Les textes sont écrits pour l'exercice.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TEXTES ÉVITENT
 * - Un mauvais choix n'est jamais écrit dans le texte (le nom d'un autre expéditeur, une autre date, un autre prix) ; une lettre, une affiche et un poème
 *   n'ont pas d'apostrophe (au plus une, dans « Je t'embrasse ») et aucun deux-points : un énoncé a une apostrophe droite au plus.
 * - Dans un poème, deux couples de vers ne finissent jamais par le même son : le mot qui rime avec un mot est unique. Les rimes sont des sons, pas des
 *   lettres (« toit » rime avec « moi »).
 * - Une réponse à écrire n'est jamais écrite dans l'énoncé : les questions à écrire demandent un mot de la leçon (expéditeur, strophe, rime), pas une
 *   chose lue dans le texte.
 * - Les options sont de longueurs voisines : un lieu de 12 lettres ne côtoie pas un lieu de 26 (le contrôleur voit une bonne option deux fois plus longue).
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts`, avec la place d'un texte : un énoncé n'a aucun deux-points, une apostrophe droite au plus,
 * cent dix mots au plus (le plafond du CE2 du contrôleur). Les noms propres des lettres sont des prénoms sénégalais courants.
 *
 * HORS FICHE, À FAIRE RELIRE : les douze lettres (leurs lieux, leurs dates, leurs phrases), les douze affiches (les fêtes, les lieux, les prix en francs CFA),
 * les six poèmes (quatorze couples de vers), les douze formules de fin de lettre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, sortRows, wr, type GapRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const LECTURE = "lire une lettre, une affiche et un poème";

/** Décale une liste de `by` lignes : les tableaux d'un même fait n'ont pas les mêmes lettres dans le même quart. */
const rotate = <T>(rows: readonly T[], by: number): readonly T[] => [...rows.slice(by), ...rows.slice(0, by)];
/** `count` valeurs différentes de `own` et entre elles, prises dans `pool` à partir de la place `start`. */
function others(pool: readonly string[], excluded: readonly string[], start: number, count: number): string[] {
  const picked: string[] = [];
  for (let step = 0; picked.length < count && step < pool.length * 2; step++) {
    const value = pool[(start + step * 3) % pool.length];
    if (!excluded.includes(value) && !picked.includes(value)) picked.push(value);
  }
  return picked;
}

// ===========================================================================
// LES LETTRES
// ===========================================================================

type Letter = { place: string; date: string; salutation: string; dest: string; body: string; closing: string; sender: string };
export const LETTERS: readonly Letter[] = [
  { place: "Dakar", date: "5 mai", salutation: "Cher Moussa", dest: "Moussa", body: "Viens à ma fête samedi à midi.", closing: "À bientôt", sender: "Awa" },
  { place: "Thiès", date: "12 juin", salutation: "Chère Fatou", dest: "Fatou", body: "Merci pour ton beau cadeau.", closing: "Je t'embrasse", sender: "Omar" },
  { place: "Kaolack", date: "3 mars", salutation: "Cher grand-père", dest: "grand-père", body: "Je pars en vacances chez toi lundi.", closing: "Avec affection", sender: "Khady" },
  { place: "Saint-Louis", date: "20 avril", salutation: "Chère tante Aminata", dest: "tante Aminata", body: "Nous avons bien reçu ton colis.", closing: "Amicalement", sender: "Pape" },
  { place: "Ziguinchor", date: "8 juillet", salutation: "Cher Cheikh", dest: "Cheikh", body: "Je te souhaite une bonne année scolaire.", closing: "Bien à toi", sender: "Mariama" },
  { place: "Dakar", date: "15 janvier", salutation: "Chère maîtresse", dest: "maîtresse", body: "Merci pour votre aide cette année.", closing: "Respectueusement", sender: "Ibou" },
  { place: "Mbour", date: "1er octobre", salutation: "Cher Ousmane", dest: "Ousmane", body: "Le match de football est samedi.", closing: "À samedi", sender: "Rokhaya" },
  { place: "Louga", date: "25 août", salutation: "Chère Penda", dest: "Penda", body: "La rentrée des classes est proche.", closing: "À très vite", sender: "Seynabou" },
  { place: "Kolda", date: "14 février", salutation: "Cher papa", dest: "papa", body: "Je pense bien à toi.", closing: "Je t'embrasse fort", sender: "Modou" },
  { place: "Tambacounda", date: "9 novembre", salutation: "Chère maman", dest: "maman", body: "Je vais bien et je travaille beaucoup.", closing: "Bisous", sender: "Abdou" },
  { place: "Fatick", date: "30 décembre", salutation: "Cher Pape", dest: "Pape", body: "Joyeuses fêtes à toute ta famille.", closing: "Cordialement", sender: "Dieynaba" },
  { place: "Matam", date: "17 mai", salutation: "Chère Dieynaba", dest: "Dieynaba", body: "Ton dessin est très beau.", closing: "Affectueusement", sender: "Alioune" },
];
const letterText = (letter: Letter) => `${letter.place}, le ${letter.date}.\n${letter.salutation},\n${letter.body}\n${letter.closing},\n${letter.sender}`;
const letterFact = (index: number) => `lettre:${index}`;

const SENDER_NAMES = [...new Set(LETTERS.flatMap((letter) => [letter.sender, letter.dest]).filter((name) => /^[A-ZÉ]/u.test(name)))];
const DEST_NAMES = LETTERS.map((letter) => letter.dest);
const DATES = LETTERS.map((letter) => letter.date);
const CLOSINGS = LETTERS.map((letter) => letter.closing);
const textOfLetterWords = (letter: Letter) => [letter.sender, letter.dest, letter.date, letter.closing];

const SENDER_HINTS = hints("Cherche le nom écrit tout en bas de la lettre.", "C'est celui qui signe.", "Il n'est pas écrit après le mot cher.");
const DEST_HINTS = hints("Cherche le nom écrit juste après le mot cher.", "C'est celui à qui la lettre est envoyée.", "Il n'est pas écrit tout en bas.");
const DATE_HINTS = hints("Cherche la date en haut de la lettre.", "Elle est écrite après le lieu.", "Elle dit le jour et le mois.");
const CLOSING_HINTS = hints("Cherche la ligne qui est juste avant la signature.", "C'est une formule polie.", "Elle ferme la lettre.");

export const LETTER_ROWS: readonly QuestionRow[] = LETTERS.map((letter, i) => {
  const text = letterText(letter);
  const mine = textOfLetterWords(letter);
  const prompt = (question: string) => `${text}\n\n${question}`;
  switch (i % 4) {
    case 0:
      return qr(prompt("Qui a écrit cette lettre ?"), letter.sender, others(SENDER_NAMES, mine, i * 2, 2) as [string, string], SENDER_HINTS, letterFact(i));
    case 1:
      return qr(prompt("À qui cette lettre est-elle adressée ?"), letter.dest, others(DEST_NAMES, mine, i * 2, 2) as [string, string], DEST_HINTS, letterFact(i));
    case 2:
      return qr(prompt("Quelle est la date de cette lettre ?"), letter.date, others(DATES, mine, i * 2, 2) as [string, string], DATE_HINTS, letterFact(i));
    default:
      return qr(prompt("Quelle formule de politesse termine cette lettre ?"), letter.closing, others(CLOSINGS, mine, i * 2, 2) as [string, string], CLOSING_HINTS, letterFact(i));
  }
});

const LETTER_ORDER_HINTS = hints(
  "Une lettre commence par le lieu et la date.",
  "Le nom de celui qui écrit termine la lettre.",
  "La formule de politesse vient juste avant la signature.",
);
export const LETTER_ORDER_ROWS: readonly OrderRow[] = rotate(LETTERS, 6).map((letter) =>
  ordr(
    "Remets les parties de cette lettre dans l'ordre, de haut en bas.",
    [`${letter.place}, le ${letter.date}.`, `${letter.salutation},`, letter.body, `${letter.closing},`, letter.sender],
    LETTER_ORDER_HINTS,
    letterFact(LETTERS.indexOf(letter)),
  ),
);

// ===========================================================================
// LES AFFICHES
// ===========================================================================

type Poster = { title: string; place: string; when: string; price: string };
export const POSTERS: readonly Poster[] = [
  { title: "Grande fête du village", place: "Sur la place du marché", when: "Le samedi 12 juin à 16 heures", price: "Entrée 500 FCFA" },
  { title: "Match de football", place: "Au stade municipal", when: "Le dimanche 3 mars à 17 heures", price: "Entrée gratuite" },
  { title: "Spectacle de théâtre", place: "Dans la salle des fêtes", when: "Le vendredi 8 mai à 20 heures", price: "Entrée 1000 FCFA" },
  { title: "Concours de dessin", place: "Dans la cour de la mairie", when: "Le mercredi 20 avril à 9 heures", price: "Entrée gratuite" },
  { title: "Vente de gâteaux", place: "Devant la boutique de Mame", when: "Le samedi 15 janvier à 10 heures", price: "Gâteaux 200 FCFA" },
  { title: "Cinéma en plein air", place: "Au bord du fleuve", when: "Le jeudi 25 août à 19 heures", price: "Entrée 300 FCFA" },
  { title: "Journée de la propreté", place: "Dans tout le quartier", when: "Le lundi 1er octobre à 8 heures", price: "Participation gratuite" },
  { title: "Course de pirogues", place: "Sur la plage de Yoff", when: "Le dimanche 14 février à 15 heures", price: "Entrée 200 FCFA" },
  { title: "Séance de vaccination", place: "Au dispensaire du village", when: "Le mardi 9 novembre à 8 heures", price: "Vaccin gratuit" },
  { title: "Concert de musique", place: "Sur la place du village", when: "Le samedi 30 décembre à 21 heures", price: "Entrée 1500 FCFA" },
  { title: "Tournoi de jeux", place: "Dans la maison de quartier", when: "Le mercredi 11 juillet à 14 heures", price: "Entrée 100 FCFA" },
  { title: "Fête de la lecture", place: "À la bibliothèque", when: "Le mercredi 17 mai à 14 heures", price: "Entrée gratuite" },
];
const posterText = (poster: Poster) => `${poster.title}\n${poster.place}\n${poster.when}\n${poster.price}`;
const TITLES = POSTERS.map((poster) => poster.title);
const PLACES = POSTERS.map((poster) => poster.place);
const WHENS = POSTERS.map((poster) => poster.when);
const PRICES = POSTERS.map((poster) => poster.price);

const TITLE_HINTS = hints("Lis la première ligne de l'affiche.", "Elle dit ce qui est annoncé.", "Le titre est écrit en haut.");
const PLACE_HINTS = hints("Cherche la ligne qui dit un endroit.", "Elle répond à la question où.", "L'endroit est écrit après le titre.");
const WHEN_HINTS = hints("Cherche la ligne qui dit un jour et une heure.", "Elle répond à la question quand.", "Le jour est écrit avant l'heure.");
const PRICE_HINTS = hints("Cherche la ligne qui parle d'argent.", "Elle répond à la question combien.", "Le prix est écrit en dernier.");
export const POSTER_ROWS: readonly QuestionRow[] = POSTERS.map((poster, i) => {
  const text = posterText(poster);
  const prompt = (question: string) => `${text}\n\n${question}`;
  const mine = [poster.title, poster.place, poster.when, poster.price];
  switch (i % 4) {
    case 0:
      return qr(prompt("De quoi parle cette affiche ?"), poster.title, others(TITLES, mine, i * 2, 2) as [string, string], TITLE_HINTS, `affiche:${i}`);
    case 1:
      return qr(prompt("Où a lieu cet événement ?"), poster.place, others(PLACES, mine, i * 2, 2) as [string, string], PLACE_HINTS, `affiche:${i}`);
    case 2:
      return qr(prompt("Quand a lieu cet événement ?"), poster.when, others(WHENS, mine, i * 2, 2) as [string, string], WHEN_HINTS, `affiche:${i}`);
    default:
      return qr(prompt("Combien faut-il payer ?"), poster.price, others(PRICES, mine, i * 2, 2) as [string, string], PRICE_HINTS, `affiche:${i}`);
  }
});

const PLACE_TILES = ["sur la place", "au stade", "au dispensaire", "au bord du fleuve", "à la mairie", "à la bibliothèque"] as const;
const WHEN_TILES = ["samedi à 16 heures", "dimanche à 9 heures", "lundi à 8 heures", "jeudi à 19 heures", "le soir", "demain matin"] as const;
const PRICE_TILES = ["500 FCFA", "200 FCFA", "gratuit", "1000 FCFA", "300 FCFA", "1500 FCFA"] as const;
const POSTER_SORT_HINTS = hints(
  "Pose la question de chaque étiquette : un lieu, un moment ou un prix ?",
  "Un moment parle de jour ou d'heure.",
  "Un prix parle d'argent ou de gratuité.",
);
export const POSTER_SORT_ROWS: readonly SortRow[] = [
  ...sortRows("Glisse chaque information dans la bonne case.", ["Où", "Quand"], PLACE_TILES, WHEN_TILES, POSTER_SORT_HINTS, 4),
  ...sortRows("Glisse chaque information dans la bonne case.", ["Où", "Combien"], PLACE_TILES, PRICE_TILES, POSTER_SORT_HINTS, 4),
  ...sortRows("Glisse chaque information dans la bonne case.", ["Quand", "Combien"], WHEN_TILES, PRICE_TILES, POSTER_SORT_HINTS, 4),
];

// ===========================================================================
// LES POÈMES
// ===========================================================================

type Poem = { stanzas: readonly (readonly [string, string])[] };
export const POEMS: readonly Poem[] = [
  { stanzas: [["Au village il fait grand jour,", "les enfants font un tour."], ["Sous le baobab tout est doux,", "le vent berce mes genoux."]] },
  { stanzas: [["La pluie tombe sur le toit,", "elle chante près de moi."], ["Le soir descend sur la mer,", "les pêcheurs rentrent sur la terre."]] },
  {
    stanzas: [
      ["Le coq chante au petit matin,", "il réveille tout le chemin."],
      ["Les oiseaux volent vers le ciel,", "ils goûtent le doux miel."],
      ["Le jour se lève sur le port,", "les bateaux dorment encore."],
    ],
  },
  { stanzas: [["Une étoile brille dans la nuit,", "elle ne fait aucun bruit."], ["La lune éclaire la plage,", "le sable a un doux visage."]] },
  { stanzas: [["Dans mon jardin il y a une fleur,", "elle a une belle couleur."], ["Je la regarde chaque soir,", "elle brille sous le ciel noir."]] },
  {
    stanzas: [
      ["Le chat dort sur la natte,", "il est doux comme une patte."],
      ["Le chien garde la maison,", "il aboie en toute saison."],
      ["Il est temps de dormir,", "je garde un doux souvenir."],
    ],
  },
];
const poemText = (poem: Poem) => poem.stanzas.map((stanza) => stanza.join("\n")).join("\n\n");
/** Le dernier mot d'un vers, sans sa ponctuation. */
const lastWord = (verse: string) => verse.replace(/[.,;!?]+$/u, "").split(" ").slice(-1)[0];
const poemFact = (index: number) => `poème:${index}`;

const RHYME_HINTS = hints("Dis les mots à haute voix pour entendre leur fin.", "Deux mots qui riment finissent par le même son.", "Cherche le mot qui finit comme celui qui est donné.");
const STANZA_HINTS = hints("Une strophe est un groupe de lignes.", "Un blanc sépare une strophe de la suivante.", "Compte les groupes de lignes.");
const VERSE_HINTS = hints("Chaque ligne du poème compte pour un.", "Compte toutes les lignes, dans toutes les strophes.", "Un blanc sépare les groupes, mais il ne compte pas.");

const rhymeRow = (poem: Poem, index: number): QuestionRow => {
  const chosen = index % poem.stanzas.length;
  const [first, second] = poem.stanzas[chosen];
  const target = lastWord(first);
  const answer = lastWord(second);
  const otherEnds = poem.stanzas.flatMap((stanza, s) => (s === chosen ? [] : [lastWord(stanza[index % 2]), lastWord(stanza[(index + 1) % 2])]));
  const wrong = poem.stanzas.length === 2 ? otherEnds.slice(0, 2) : [otherEnds[0], otherEnds[2]];
  return qr(`${poemText(poem)}\n\nQuel mot rime avec « ${target} » dans ce poème ?`, answer, wrong as [string, string], RHYME_HINTS, poemFact(index));
};
const structureRow = (poem: Poem, index: number): QuestionRow => {
  const text = poemText(poem);
  const stanzas = poem.stanzas.length;
  if (index % 2 === 0) {
    return qr(`${text}\n\nCombien de strophes a ce poème ?`, `${stanzas} strophes`, ["1 strophe", ...["2 strophes", "3 strophes"].filter((option) => option !== `${stanzas} strophes`)] as [string, string], STANZA_HINTS, poemFact(index));
  }
  const verses = stanzas * 2;
  return qr(`${text}\n\nCombien de vers a ce poème ?`, `${verses} vers`, ["2 vers", "4 vers", "6 vers"].filter((option) => option !== `${verses} vers`) as [string, string], VERSE_HINTS, poemFact(index));
};
export const POEM_ROWS: readonly QuestionRow[] = [...POEMS.map(rhymeRow), ...POEMS.map(structureRow)];

const RHYME_GAP_HINTS = hints(
  "Dis le dernier mot du vers d'avant, puis cherche un mot qui finit comme lui.",
  "Deux mots qui riment finissent par le même son.",
  "Lis le vers en entier pour que le mot ait du sens.",
);
const couplets = POEMS.flatMap((poem, p) => poem.stanzas.map((stanza, s) => ({ poem, p, s, stanza })));
// Douze couples sur les quatorze : le troisième couple des deux poèmes de trois strophes est écarté.
const CHOSEN_COUPLETS = couplets.filter(({ poem, s }) => poem.stanzas.length === 2 || s < 2);
export const RHYME_GAP_ROWS: readonly GapRow[] = rotate(CHOSEN_COUPLETS, 5).map(({ poem, p, s, stanza }) => {
  const answer = lastWord(stanza[1]);
  const otherEnds = poem.stanzas.flatMap((other, o) => (o === s ? [] : [lastWord(other[0]), lastWord(other[1])]));
  const wrong = poem.stanzas.length === 2 ? otherEnds.slice(0, 2) : [otherEnds[0], otherEnds[2]];
  const verse = stanza[1].replace(new RegExp(`${answer}([.,;!?]*)$`, "u"), "___$1");
  return gr(`${stanza[0]} / ${verse}`, answer, wrong as [string, string], RHYME_GAP_HINTS, poemFact(p));
});

// ===========================================================================
// ÉCRIRE UN MOT
// ===========================================================================

const SENDER_WRITE_HINTS = hints("C'est celui qui signe la lettre.", "Il est écrit en bas de la lettre.", "Le mot commence par e.");
const DEST_WRITE_HINTS = hints("C'est celui à qui on écrit.", "Son nom suit le mot cher.", "Le mot commence par d.");
const STANZA_WRITE_HINTS = hints("Les lignes sont rangées par groupes.", "Un blanc sépare un groupe du suivant.", "Le mot commence par s.");
const VERSE_WRITE_HINTS = hints("Un poème est fait de lignes.", "On les compte une à une.", "Le mot est court.");
const RHYME_WRITE_HINTS = hints("Deux mots qui riment finissent pareil.", "C'est un son qui revient.", "Le mot commence par r.");
const FORMULA_WRITE_HINTS = hints("On l'écrit juste avant la signature.", "Elle est polie.", "Elle commence par f.");
export const LECTURE_WRITE_ROWS: readonly WriteRow[] = [
  wr("Comment appelle-t-on la personne qui écrit une lettre ? Écris le mot.", ["expéditeur", "l'expéditeur"], SENDER_WRITE_HINTS),
  wr("Comment appelle-t-on un groupe de vers dans un poème ? Écris le mot.", ["strophe", "une strophe"], STANZA_WRITE_HINTS),
  wr("Comment appelle-t-on la personne qui reçoit une lettre ? Écris le mot.", ["destinataire", "le destinataire"], DEST_WRITE_HINTS),
  wr("Comment appelle-t-on chaque ligne d'un poème ? Écris le mot.", ["vers", "un vers"], VERSE_WRITE_HINTS),
  wr("Comment appelle-t-on le son identique à la fin de deux vers ? Écris le mot.", ["rime", "la rime"], RHYME_WRITE_HINTS),
  wr("Comment appelle-t-on « À bientôt » à la fin d'une lettre ? Écris les trois mots.", ["formule de politesse", "une formule de politesse"], FORMULA_WRITE_HINTS),
  wr("Quel mot désigne celui qui envoie une lettre ? Écris le mot.", ["expéditeur", "l'expéditeur"], SENDER_WRITE_HINTS),
  wr("Quel mot désigne un paragraphe de poème, séparé des autres par un blanc ? Écris le mot.", ["strophe", "une strophe"], STANZA_WRITE_HINTS),
  wr("Quel mot désigne celui à qui une lettre est adressée ? Écris le mot.", ["destinataire", "le destinataire"], DEST_WRITE_HINTS),
  wr("Quel mot désigne une ligne de poème ? Écris le mot.", ["vers", "un vers"], VERSE_WRITE_HINTS),
  wr("Comment appelle-t-on le son qui revient à la fin de « jour » et de « tour » ? Écris le mot.", ["rime", "la rime"], RHYME_WRITE_HINTS),
  wr("Quelle formule termine poliment une lettre ? Écris les trois mots.", ["formule de politesse", "une formule de politesse"], FORMULA_WRITE_HINTS),
];

export function makeCe2LectureLetter(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-lecture-lettre", LECTURE, LETTER_ROWS, 2);
}
export function makeCe2LecturePoster(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-lecture-affiche", LECTURE, POSTER_ROWS, 2);
}
export function makeCe2LecturePosterSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-lecture-affiche-glisser", LECTURE, POSTER_SORT_ROWS);
}
export function makeCe2LecturePoem(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-lecture-poeme", LECTURE, POEM_ROWS, 2);
}
export function makeCe2LecturePoemGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-lecture-poeme-trou", LECTURE, RHYME_GAP_ROWS, 1, 0, "Complète le vers avec le mot qui rime.");
}
export function makeCe2LectureLetterOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-lecture-lettre-ordre", LECTURE, LETTER_ORDER_ROWS);
}
export function makeCe2LectureWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-lecture-ecrire", LECTURE, LECTURE_WRITE_ROWS);
}
