/**
 * LES GABARITS DE GRAMMAIRE DU CE2 : le COD, le COI et les pronoms ; les compléments circonstanciels, la phrase nominale et les articles ;
 * les adjectifs possessifs et démonstratifs (`fr-ce2-cod-coi`, `fr-ce2-cc`, `fr-ce2-determinants`).
 *
 * Sur l'échantillon de CE2 lu le 22 octobre 2026, le modèle écrivait ici des phrases qui ne sont pas du français (« Aminata va à le marché »),
 * des exercices sans réponse unique (« Les arbres dansent dans le vent »), des glissés dont la clé ne dit que « Les mots sont bien placés » et
 * des ordres sans critère. Ici chaque exercice lit une ligne d'un tableau fermé, écrit à la main : la phrase est du français, la réponse est
 * dans la ligne, et un mauvais choix n'est jamais une deuxième bonne réponse.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Le COD répond à « qui ? » ou « quoi ? » après le verbe, sans petit mot devant ; le COI répond à « à qui ? », « à quoi ? » ou « de quoi ? ».
 *   Les pronoms sujets (il, elle, ils, elles) et compléments (le, la, les, lui, leur) remplacent un nom.
 * - Les compléments circonstanciels de lieu (où ?), de temps (quand ?) et de manière (comment ?) ; la phrase nominale (sans verbe conjugué) ;
 *   les articles définis (le, la, les) et indéfinis (un, une, des).
 * - Les adjectifs possessifs (mon, ma, mes, ton, ta, tes, son, sa, ses, notre, nos, votre, vos, leur, leurs) et démonstratifs (ce, cet, cette, ces).
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - « du », « des » et « de la » devant un nom sont ambigus (« du pain » est un COD partitif, « parler du village » un COI) : un COD n'est jamais
 *   écrit avec « du » ; « des » n'est un COD que comme article (« des fleurs »). Aucun COI n'est introduit par « des ».
 * - Un verbe qui peut se construire des deux façons (« jouer au ballon », « penser un projet ») ne sert pas d'exemple : les verbes sont sans
 *   ambiguïté (manger, laver, regarder, parler à, répondre à, téléphoner à, sourire à).
 * - Le pronom d'un nom qui commence par une voyelle s'élide (« Awa l'écoute ») et ne dit plus le genre : les verbes des pronoms commencent par
 *   une consonne.
 * - « Chez ma tante », « à Thiès », « à midi » : la préposition « à » ne suffit pas à dire le type (lieu ou temps) ; un complément de temps
 *   porte un mot de temps (matin, midi, soir, lundi, demain), un complément de lieu porte un lieu.
 * - Un mot de la phrase est un choix de trou : jamais deux compléments circonstanciels qui iraient aussi (« sur » ou « sous » la table).
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Civique.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans
 * chiffre ni mot de quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 4, 8, 12, 16 ou 20 lignes). Les
 * indices ne nomment jamais une case (« lieu », « temps ») ni un mot de la phrase (« regarde », « parle »).
 *
 * HORS FICHE, À FAIRE RELIRE : les phrases de la vie courante (les prénoms, le marché, le puits, la cour, le cartable), la liste des quinze
 * verbes (prêter, cueillir, poursuivre, ressembler à, rêver de, obéir à, sourire à, téléphoner à), les trente compléments des glissés et des
 * appariements, les douze phrases nominales (« Bon voyage aux pêcheurs ! », « Joyeux anniversaire à Awa ! »).
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  ce2Gap,
  ce2Link,
  ce2Order,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  gr,
  hints,
  ordr,
  qr,
  sortRows,
  wr,
  type GapRow,
  type Hints,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const SENTENCE_PROMPT = "Remets les mots dans l'ordre pour écrire une phrase.";
const SENTENCE_HINTS: Hints = hints(
  "Une phrase commence par une majuscule.",
  "Cherche le mot qui commence par une majuscule, c'est le premier.",
  "Le dernier mot finit la phrase, avec son point.",
);
/** Une phrase à remettre dans l'ordre : ses mots, le premier avec sa majuscule, le dernier avec son point. */
const sentenceRow = (text: string): OrderRow => ordr(SENTENCE_PROMPT, text.split(" "), SENTENCE_HINTS);

const ct = (left: string, right: string) => ({ left, right });

// ===========================================================================
// LE COD, LE COI ET LES PRONOMS (fr-ce2-cod-coi)
// ===========================================================================

const COD_COI = "le COD, le COI et les pronoms qui les remplacent";

const COD_HINTS = hints(
  "Pose la question « qui ? » ou « quoi ? » juste après le verbe.",
  "Le COD se lie au verbe sans petit mot devant lui, ni à ni de.",
  "Le sujet fait l'action, le COD la reçoit.",
);
const codOf = (sentence: string, cod: string, wrong: readonly [string, string]): QuestionRow => qr(`Lis la phrase « ${sentence} » Quel est le COD ?`, cod, wrong, COD_HINTS);

/** Chaque phrase a un seul COD (jamais « du pain ») ; les mauvais choix sont le sujet, le verbe ou un autre complément. */
export const COD_ROWS: readonly QuestionRow[] = [
  codOf("Awa mange une mangue.", "une mangue", ["Awa", "mange"]),
  codOf("Le papa lave la voiture.", "la voiture", ["Le papa", "lave"]),
  codOf("Les enfants écoutent la maîtresse.", "la maîtresse", ["Les enfants", "écoutent"]),
  codOf("Le pêcheur lance son filet.", "son filet", ["Le pêcheur", "lance"]),
  codOf("Moussa donne un cadeau à Fatou.", "un cadeau", ["à Fatou", "Moussa"]),
  codOf("Le chien poursuit le chat.", "le chat", ["Le chien", "poursuit"]),
  codOf("Les vendeurs comptent leurs pièces.", "leurs pièces", ["Les vendeurs", "comptent"]),
  codOf("Maman achète le pain au marché.", "le pain", ["au marché", "Maman"]),
  codOf("Fatou range ses cahiers dans le cartable.", "ses cahiers", ["dans le cartable", "Fatou"]),
  codOf("Ibrahima prête son ballon à Omar.", "son ballon", ["à Omar", "Ibrahima"]),
  codOf("Aminata cueille des fleurs dans le jardin.", "des fleurs", ["dans le jardin", "Aminata"]),
  codOf("Cheikh montre son dessin à la maîtresse.", "son dessin", ["à la maîtresse", "Cheikh"]),
];

const COI_HINTS = hints(
  "Pose la question « à qui ? », « à quoi ? » ou « de quoi ? » après le verbe.",
  "Le COI est lié au verbe par un petit mot : à ou de.",
  "Le sujet n'est jamais le COI.",
);
const coiOf = (sentence: string, coi: string, wrong: readonly [string, string]): QuestionRow => qr(`Lis la phrase « ${sentence} » Quel est le COI ?`, coi, wrong, COI_HINTS);

export const COI_ROWS: readonly QuestionRow[] = [
  coiOf("Awa parle à sa maman.", "à sa maman", ["Awa", "parle"]),
  coiOf("Moussa répond à la maîtresse.", "à la maîtresse", ["Moussa", "répond"]),
  coiOf("Fatou téléphone à sa tante.", "à sa tante", ["Fatou", "téléphone"]),
  coiOf("Omar sourit à son ami.", "à son ami", ["Omar", "sourit"]),
  coiOf("Les élèves obéissent au directeur.", "au directeur", ["Les élèves", "obéissent"]),
  coiOf("Le bébé ressemble à son père.", "à son père", ["Le bébé", "ressemble"]),
  coiOf("Cheikh donne un ballon à Pape.", "à Pape", ["un ballon", "Cheikh"]),
  coiOf("Khady pense à ses vacances.", "à ses vacances", ["Khady", "pense"]),
  coiOf("Aminata raconte une histoire à ses cousins.", "à ses cousins", ["une histoire", "Aminata"]),
  coiOf("Le chef parle de son village.", "de son village", ["Le chef", "parle"]),
  coiOf("Mariama rêve de son voyage.", "de son voyage", ["Mariama", "rêve"]),
  coiOf("Le garçon écrit une lettre à son oncle.", "à son oncle", ["une lettre", "Le garçon"]),
];

const QUESTION_HINTS = hints(
  "Pour un COD, la question n'a pas de petit mot devant elle.",
  "Pour un COI, la question commence par un petit mot, à ou de.",
  "Pose la question en gardant le sujet et le verbe de la phrase.",
);
const questionSentence = (sentence: string, kind: "COD" | "COI", answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Pour trouver le ${kind} de « ${sentence} », quelle question pose-t-on ?`, answer, wrong, QUESTION_HINTS);

export const COD_QUESTION_ROWS: readonly QuestionRow[] = [
  qr("Quelle question permet de trouver le COD ?", "Qui ? ou quoi ?", ["À qui ? ou à quoi ?", "Où ? ou quand ?"], QUESTION_HINTS),
  qr("Quelle question permet de trouver le COI ?", "À qui ? ou à quoi ?", ["Qui ? ou quoi ?", "Où ? ou quand ?"], QUESTION_HINTS),
  questionSentence("Awa lit un livre.", "COD", "Awa lit quoi ?", ["Awa lit à qui ?", "Awa lit où ?"]),
  questionSentence("Moussa regarde Fatou.", "COD", "Moussa regarde qui ?", ["Moussa regarde à quoi ?", "Moussa regarde quand ?"]),
  questionSentence("Maman prépare le repas.", "COD", "Maman prépare quoi ?", ["Maman prépare à qui ?", "Maman prépare où ?"]),
  questionSentence("Le chien suit le garçon.", "COD", "Le chien suit qui ?", ["Le chien suit à quoi ?", "Le chien suit quand ?"]),
  questionSentence("Fatou lave ses habits.", "COD", "Fatou lave quoi ?", ["Fatou lave à qui ?", "Fatou lave où ?"]),
  questionSentence("Omar parle à son voisin.", "COI", "Omar parle à qui ?", ["Omar parle quoi ?", "Omar parle quand ?"]),
  questionSentence("Awa répond à la maîtresse.", "COI", "Awa répond à qui ?", ["Awa répond quoi ?", "Awa répond où ?"]),
  questionSentence("Khady pense à son frère.", "COI", "Khady pense à qui ?", ["Khady pense quoi ?", "Khady pense quand ?"]),
  questionSentence("Le bébé sourit à sa maman.", "COI", "Le bébé sourit à qui ?", ["Le bébé sourit quoi ?", "Le bébé sourit où ?"]),
  questionSentence("Pape téléphone à son oncle.", "COI", "Pape téléphone à qui ?", ["Pape téléphone quoi ?", "Pape téléphone quand ?"]),
];

const COD_TILES = ["un livre", "sa mangue", "le ballon", "des fleurs", "son cahier", "la porte"] as const;
const COI_TILES = ["à sa mère", "à Moussa", "à ses amis", "à son oncle", "de son village", "à la maîtresse"] as const;
export const COD_SORT_ROWS: readonly SortRow[] = sortRows(
  "Lis chaque complément puis glisse-le dans la bonne case.",
  ["COD", "COI"],
  COD_TILES,
  COI_TILES,
  hints("Un COI commence par un petit mot, à ou de.", "Un COD s'écrit sans petit mot devant lui.", "Observe le premier mot de chaque étiquette."),
  12,
);

const PRONOUN_LINK_HINTS = hints(
  "Observe si le nom est précédé du petit mot à.",
  "Le nom sans petit mot se remplace par le, la ou les.",
  "Un seul nom ou plusieurs : le petit mot change.",
);
const pronounLinks = (...pairs: readonly (readonly [string, string])[]): LinkRow => ({
  prompt: "Relie chaque phrase à la même phrase avec un pronom.",
  pairs: pairs.map(([left, right]) => ct(left, right)),
  hints: PRONOUN_LINK_HINTS,
});
export const COD_LINK_ROWS: readonly LinkRow[] = [
  pronounLinks(["Awa regarde Moussa.", "Awa le regarde."], ["Awa regarde Fatou.", "Awa la regarde."], ["Awa regarde ses amis.", "Awa les regarde."]),
  pronounLinks(["Moussa cherche son frère.", "Moussa le cherche."], ["Moussa cherche sa sœur.", "Moussa la cherche."], ["Moussa cherche ses cahiers.", "Moussa les cherche."]),
  pronounLinks(["Fatou lave le bol.", "Fatou le lave."], ["Fatou lave la casserole.", "Fatou la lave."], ["Fatou lave les assiettes.", "Fatou les lave."]),
  pronounLinks(["Omar suit son oncle.", "Omar le suit."], ["Omar suit sa tante.", "Omar la suit."], ["Omar suit ses cousins.", "Omar les suit."]),
  pronounLinks(["Khady prend le sac.", "Khady le prend."], ["Khady prend la natte.", "Khady la prend."], ["Khady prend les clés.", "Khady les prend."]),
  pronounLinks(["Pape ramasse le ballon.", "Pape le ramasse."], ["Pape ramasse la corde.", "Pape la ramasse."], ["Pape ramasse les billes.", "Pape les ramasse."]),
  pronounLinks(["Awa parle à Moussa.", "Awa lui parle."], ["Awa parle à ses amis.", "Awa leur parle."], ["Awa regarde Moussa.", "Awa le regarde."]),
  pronounLinks(["Omar répond à sa tante.", "Omar lui répond."], ["Omar répond à ses cousins.", "Omar leur répond."], ["Omar cherche sa tante.", "Omar la cherche."]),
  pronounLinks(["Fatou sourit à son frère.", "Fatou lui sourit."], ["Fatou sourit à ses voisins.", "Fatou leur sourit."], ["Fatou lave ses habits.", "Fatou les lave."]),
  pronounLinks(["Pape téléphone à sa grand-mère.", "Pape lui téléphone."], ["Pape téléphone à ses parents.", "Pape leur téléphone."], ["Pape prend son sac.", "Pape le prend."]),
  pronounLinks(["Khady obéit à la maîtresse.", "Khady lui obéit."], ["Khady obéit aux grands.", "Khady leur obéit."], ["Khady regarde la maîtresse.", "Khady la regarde."]),
  pronounLinks(["Moussa écrit à son oncle.", "Moussa lui écrit."], ["Moussa écrit à ses cousines.", "Moussa leur écrit."], ["Moussa prend ses cahiers.", "Moussa les prend."]),
];

const PRONOUN_GAP_HINTS = hints(
  "Le nom remplacé répond à « qui ? » ou à « à qui ? ».",
  "Avec le petit mot à devant le nom, on emploie un pronom qui ne dit pas le genre.",
  "Observe si le nom est masculin ou féminin, seul ou à plusieurs.",
);
const pronounGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, PRONOUN_GAP_HINTS);
export const COD_GAP_ROWS: readonly GapRow[] = [
  pronounGap("Awa regarde Moussa. Awa ___ regarde.", "le", ["la", "lui"]),
  pronounGap("Fatou lave la casserole. Fatou ___ lave.", "la", ["le", "lui"]),
  pronounGap("Omar prend les clés. Omar ___ prend.", "les", ["le", "leur"]),
  pronounGap("Khady parle à sa sœur. Khady ___ parle.", "lui", ["la", "leur"]),
  pronounGap("Pape parle à ses amis. Pape ___ parle.", "leur", ["les", "lui"]),
  pronounGap("Moussa suit son frère. Moussa ___ suit.", "le", ["lui", "les"]),
  pronounGap("Mariama cherche sa poupée. Mariama ___ cherche.", "la", ["lui", "les"]),
  pronounGap("Cheikh répond à la maîtresse. Cheikh ___ répond.", "lui", ["la", "les"]),
  pronounGap("Aminata lave ses assiettes. Aminata ___ lave.", "les", ["la", "leur"]),
  pronounGap("Ibou téléphone à ses cousins. Ibou ___ téléphone.", "leur", ["les", "lui"]),
  pronounGap("Rokhaya ferme la porte. Rokhaya ___ ferme.", "la", ["le", "lui"]),
  pronounGap("Ousmane sourit à son voisin. Ousmane ___ sourit.", "lui", ["le", "leur"]),
];

const SUBJECT_HINTS = hints(
  "Le pronom sujet remplace celui qui fait l'action.",
  "Compte les personnes : une seule ou plusieurs.",
  "Des filles ensemble, des garçons ensemble, ou les deux mêlés ?",
);
const subjectOf = (noun: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Quel pronom sujet remplace « ${noun} » ?`, answer, wrong, SUBJECT_HINTS);
export const COD_SUBJECT_ROWS: readonly QuestionRow[] = [
  subjectOf("Fatou", "Elle", ["Il", "Elles"]),
  subjectOf("Moussa", "Il", ["Elle", "Ils"]),
  subjectOf("Awa et Fatou", "Elles", ["Ils", "Elle"]),
  subjectOf("Omar et Pape", "Ils", ["Elles", "Il"]),
  subjectOf("La maîtresse", "Elle", ["Il", "Elles"]),
  subjectOf("Le chef", "Il", ["Elle", "Ils"]),
  subjectOf("Les filles", "Elles", ["Ils", "Elle"]),
  subjectOf("Les garçons", "Ils", ["Elles", "Il"]),
  subjectOf("Moussa et Awa", "Ils", ["Elles", "Elle"]),
  subjectOf("Ma sœur et mes cousines", "Elles", ["Ils", "Il"]),
  subjectOf("Le chat", "Il", ["Elles", "Ils"]),
  subjectOf("La voisine et le voisin", "Ils", ["Elles", "Elle"]),
];

const PRONOUN_WRITE_HINTS = hints(
  "Pose la question « qui ? » ou « à qui ? » après le verbe.",
  "Observe si le nom est seul ou à plusieurs, garçon ou fille.",
  "Le petit mot à devant le nom change le pronom.",
);
const SUBJECT_WRITE_HINTS = hints("Le pronom sujet remplace celui qui fait l'action.", "Compte les personnes : une seule ou plusieurs.", "Des filles ensemble ou des garçons ensemble ?");
export const COD_WRITE_ROWS: readonly WriteRow[] = [
  wr("Awa regarde Fatou. Quel pronom remplace Fatou ? Écris le mot.", ["la"], PRONOUN_WRITE_HINTS),
  wr("Moussa regarde son frère. Quel pronom remplace son frère ? Écris le mot.", ["le"], PRONOUN_WRITE_HINTS),
  wr("Omar prend ses cahiers. Quel pronom remplace ses cahiers ? Écris le mot.", ["les"], PRONOUN_WRITE_HINTS),
  wr("Khady parle à sa sœur. Quel pronom remplace à sa sœur ? Écris le mot.", ["lui"], PRONOUN_WRITE_HINTS),
  wr("Pape parle à ses amis. Quel pronom remplace à ses amis ? Écris le mot.", ["leur"], PRONOUN_WRITE_HINTS),
  wr("Fatou et Awa dansent. Quel pronom sujet remplace Fatou et Awa ? Écris le mot.", ["elles"], SUBJECT_WRITE_HINTS),
  wr("Moussa et Omar jouent. Quel pronom sujet remplace Moussa et Omar ? Écris le mot.", ["ils"], SUBJECT_WRITE_HINTS),
  wr("Mariama lave la casserole. Quel pronom remplace la casserole ? Écris le mot.", ["la"], PRONOUN_WRITE_HINTS),
  wr("Ibou répond à la maîtresse. Quel pronom remplace à la maîtresse ? Écris le mot.", ["lui"], PRONOUN_WRITE_HINTS),
  wr("Cheikh écoute ses amis. Quel pronom remplace ses amis ? Écris le mot.", ["les"], PRONOUN_WRITE_HINTS),
  wr("Rokhaya téléphone à ses cousins. Quel pronom remplace à ses cousins ? Écris le mot.", ["leur"], PRONOUN_WRITE_HINTS),
  wr("Aminata cherche son frère. Quel pronom remplace son frère ? Écris le mot.", ["le"], PRONOUN_WRITE_HINTS),
];

export function makeCe2CodFind(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cod-trouver", COD_COI, COD_ROWS, 2);
}
export function makeCe2CoiFind(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-coi-trouver", COD_COI, COI_ROWS);
}
export function makeCe2CodQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cod-question", COD_COI, COD_QUESTION_ROWS);
}
export function makeCe2CodSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-cod-glisser", COD_COI, COD_SORT_ROWS);
}
export function makeCe2CodLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-cod-relier", COD_COI, COD_LINK_ROWS);
}
export function makeCe2CodGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-cod-pronom", COD_COI, COD_GAP_ROWS, 2);
}
export function makeCe2CodSubject(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cod-sujet", COD_COI, COD_SUBJECT_ROWS);
}
export function makeCe2CodWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-cod-ecrire", COD_COI, COD_WRITE_ROWS);
}

// ===========================================================================
// LES COMPLÉMENTS CIRCONSTANCIELS, LA PHRASE NOMINALE, LES ARTICLES (fr-ce2-cc)
// ===========================================================================

const CC = "les compléments circonstanciels, la phrase nominale et les articles";

const CC_TYPE_HINTS = hints(
  "Pose la question où ? quand ? ou comment ? après le verbe.",
  "Où cherche un endroit, quand cherche un moment, comment cherche une façon de faire.",
  "Essaie les trois questions, une seule va avec ce groupe de mots.",
);
const PLACE = "Lieu";
const TIME = "Temps";
const MANNER = "Manière";
const typeOf = (sentence: string, complement: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Dans « ${sentence} », que dit « ${complement} » ?`, answer, wrong, CC_TYPE_HINTS);
export const CC_TYPE_ROWS: readonly QuestionRow[] = [
  typeOf("Awa danse dans la cour.", "dans la cour", PLACE, [TIME, MANNER]),
  typeOf("Le matin, les oiseaux chantent.", "Le matin", TIME, [PLACE, MANNER]),
  typeOf("Le chat marche doucement.", "doucement", MANNER, [PLACE, TIME]),
  typeOf("Les enfants jouent sur la plage.", "sur la plage", PLACE, [MANNER, TIME]),
  typeOf("Chaque dimanche, Khady rend visite à sa tante.", "Chaque dimanche", TIME, [MANNER, PLACE]),
  typeOf("Les élèves écoutent attentivement.", "attentivement", MANNER, [TIME, PLACE]),
  typeOf("Le pêcheur travaille au port.", "au port", PLACE, [TIME, MANNER]),
  typeOf("Ce soir, nous mangeons du riz.", "Ce soir", TIME, [PLACE, MANNER]),
  typeOf("Awa parle à voix basse.", "à voix basse", MANNER, [PLACE, TIME]),
  typeOf("Mariama habite près du fleuve.", "près du fleuve", PLACE, [TIME, MANNER]),
  typeOf("Demain, Omar part au village.", "Demain", TIME, [MANNER, PLACE]),
  typeOf("Omar mange avec appétit.", "avec appétit", MANNER, [TIME, PLACE]),
];

const CC_QUESTION_HINTS = hints(
  "Ce petit mot sert à poser une question sur l'action.",
  "Il y en a un pour un endroit, un pour un moment et un pour une façon de faire.",
  "Dis la phrase puis pose la question juste après le verbe.",
);
const questionOf = (sentence: string, complement: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Quelle question permet de trouver « ${complement} » dans « ${sentence} » ?`, answer, wrong, CC_QUESTION_HINTS);
export const CC_QUESTION_ROWS: readonly QuestionRow[] = [
  questionOf("Le chef parle devant le village.", "devant le village", "Où ?", ["Quand ?", "Comment ?"]),
  questionOf("Après la classe, Aminata joue.", "Après la classe", "Quand ?", ["Où ?", "Comment ?"]),
  questionOf("Awa chante joyeusement.", "joyeusement", "Comment ?", ["Où ?", "Quand ?"]),
  questionOf("Les poules dorment sous le manguier.", "sous le manguier", "Où ?", ["Comment ?", "Quand ?"]),
  questionOf("Pendant la nuit, le vent souffle.", "Pendant la nuit", "Quand ?", ["Comment ?", "Où ?"]),
  questionOf("Le lion s'approche lentement.", "lentement", "Comment ?", ["Quand ?", "Où ?"]),
  questionOf("Pape vit près du fleuve.", "près du fleuve", "Où ?", ["Quand ?", "Comment ?"]),
  questionOf("Ce soir, nous mangeons du riz.", "Ce soir", "Quand ?", ["Comment ?", "Où ?"]),
  questionOf("Moussa écrit avec soin.", "avec soin", "Comment ?", ["Où ?", "Quand ?"]),
  questionOf("Mariama attend près de la maison.", "près de la maison", "Où ?", ["Comment ?", "Quand ?"]),
  questionOf("En juillet, il pleut.", "En juillet", "Quand ?", ["Où ?", "Comment ?"]),
  questionOf("Ils travaillent sans bruit.", "sans bruit", "Comment ?", ["Quand ?", "Où ?"]),
];

const CC_FIND_HINTS = hints(
  "Un complément circonstanciel peut se déplacer ou disparaître sans que la phrase perde son sens.",
  "Pose la question du type demandé après le verbe et son sujet.",
  "Il ne répond ni à qui ? ni à quoi ?",
);
const findOf = (kind: "de lieu" | "de temps" | "de manière", sentence: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Lis la phrase « ${sentence} » Quel est le complément ${kind} ?`, answer, wrong, CC_FIND_HINTS);
export const CC_FIND_ROWS: readonly QuestionRow[] = [
  findOf("de lieu", "Fatou range ses livres dans le cartable.", "dans le cartable", ["Fatou", "ses livres"]),
  findOf("de temps", "Chaque matin, Awa balaie la cour.", "Chaque matin", ["Awa", "la cour"]),
  findOf("de manière", "Khady ferme la porte doucement.", "doucement", ["Khady", "la porte"]),
  findOf("de lieu", "Les vendeurs installent leurs étals au marché.", "au marché", ["Les vendeurs", "leurs étals"]),
  findOf("de temps", "Le soir, Omar lit un livre.", "Le soir", ["Omar", "un livre"]),
  findOf("de manière", "Le jeune garçon répond poliment à la maîtresse.", "poliment", ["Le jeune garçon", "à la maîtresse"]),
  findOf("de lieu", "Moussa pose son sac sous le banc.", "sous le banc", ["Moussa", "son sac"]),
  findOf("de temps", "Ce samedi, nous visitons le village.", "Ce samedi", ["nous", "le village"]),
  findOf("de manière", "Les enfants rangent leurs affaires avec soin.", "avec soin", ["Les enfants", "leurs affaires"]),
  findOf("de lieu", "Le griot chante sur la place.", "sur la place", ["Le griot", "chante"]),
  findOf("de temps", "À midi, les élèves mangent le riz.", "À midi", ["les élèves", "le riz"]),
  findOf("de manière", "Le vieil homme marche lentement.", "lentement", ["Le vieil homme", "marche"]),
];

const PLACES = ["dans la cour", "au marché", "sous le manguier", "près du puits", "sur la plage", "devant la maison"] as const;
const TIMES = ["le matin", "à midi", "ce soir", "chaque dimanche", "en juillet", "demain"] as const;
const MANNERS = ["doucement", "avec soin", "à voix basse", "lentement", "sans bruit", "avec joie"] as const;
const CC_SORT_HINTS = hints(
  "Pose une question à chaque étiquette : où ?, quand ? ou comment ?",
  "Une réponse à où ? dit un endroit.",
  "Une réponse à comment ? dit une façon de faire.",
);
export const CC_SORT_ROWS: readonly SortRow[] = [
  ...sortRows("Glisse chaque complément dans la bonne case.", ["Lieu", "Temps"], PLACES, TIMES, CC_SORT_HINTS, 4),
  ...sortRows("Glisse chaque complément dans la bonne case.", ["Lieu", "Manière"], PLACES, MANNERS, CC_SORT_HINTS, 4),
  ...sortRows("Glisse chaque complément dans la bonne case.", ["Temps", "Manière"], TIMES, MANNERS, CC_SORT_HINTS, 4),
];

const LINK_PLACES = ["dans la cour", "au marché", "sous le manguier", "près du puits", "sur la plage", "devant la maison", "à Thiès", "au bord du fleuve", "derrière l'école", "dans le jardin", "sur la colline", "chez ma tante"] as const;
const LINK_TIMES = ["le matin", "à midi", "ce soir", "chaque dimanche", "en juillet", "demain", "chaque lundi", "pendant la nuit", "après la classe", "hier soir", "tous les jours", "à la récréation"] as const;
const LINK_MANNERS = ["doucement", "avec soin", "à voix basse", "lentement", "sans bruit", "avec joie", "poliment", "très vite", "avec courage", "en silence", "à pas lents", "avec attention"] as const;
const CC_LINK_HINTS = hints(
  "Pose les questions à tour de rôle : où ?, quand ?, comment ?",
  "Un endroit, un moment et une façon de faire ne se mêlent pas.",
  "Commence par l'étiquette dont tu es le plus sûr.",
);
export const CC_LINK_ROWS: readonly LinkRow[] = LINK_PLACES.map((place, i) => ({
  prompt: "Relie chaque complément à ce qu'il dit.",
  pairs: [ct(place, PLACE), ct(LINK_TIMES[i], TIME), ct(LINK_MANNERS[i], MANNER)],
  hints: CC_LINK_HINTS,
}));

const NOMINAL_HINTS = hints(
  "Une phrase nominale n'a pas de verbe conjugué.",
  "Cherche les mots qui disent ce que quelqu'un fait ou ce qui se passe.",
  "Les trois phrases ont une majuscule et un point, mais une seule n'a pas de verbe.",
);
const nominal = (answer: string, wrong: readonly [string, string]): QuestionRow => qr("Laquelle de ces phrases est une phrase nominale ?", answer, wrong, NOMINAL_HINTS);
export const CC_NOMINAL_ROWS: readonly QuestionRow[] = [
  nominal("Grande fête au village.", ["Les enfants dansent au village.", "Awa prépare une grande fête."]),
  nominal("Beau temps sur Dakar.", ["Il fait beau sur Dakar.", "Le soleil brille sur Dakar."]),
  nominal("Attention au chien !", ["Le chien aboie très fort.", "Moussa surveille le chien."]),
  nominal("Entrée gratuite.", ["L'entrée est gratuite.", "Les élèves entrent dans la cour."]),
  nominal("Silence dans la classe !", ["Les élèves font du bruit.", "La maîtresse demande le silence."]),
  nominal("Bon voyage aux pêcheurs !", ["Les pêcheurs partent en mer.", "Je souhaite un bon voyage."]),
  nominal("Fin de la leçon.", ["La leçon finit bientôt.", "Awa termine sa leçon."]),
  nominal("Bonne année à tous !", ["Nous souhaitons une bonne année.", "Tous chantent ensemble."]),
  nominal("Marché ce samedi à Thiès.", ["Le marché ouvre ce samedi.", "Fatou va à Thiès."]),
  nominal("Sortie des élèves à midi.", ["Les élèves sortent à midi.", "La cloche sonne à midi."]),
  nominal("Propreté dans le quartier !", ["Nous gardons le quartier propre.", "Les enfants ramassent les déchets."]),
  nominal("Joyeux anniversaire à Awa !", ["Nous chantons pour Awa.", "Awa célèbre son anniversaire."]),
];

const ARTICLE_DEFINITE_HINTS = hints(
  "Un article défini parle de quelque chose de connu.",
  "Il y en a trois : un pour chaque genre et un pour le pluriel.",
  "Il se place devant le nom.",
);
const ARTICLE_INDEFINITE_HINTS = hints(
  "Un article indéfini parle de quelque chose qu'on ne connaît pas encore.",
  "Il y en a trois : un pour chaque genre et un pour le pluriel.",
  "Il se place devant le nom.",
);
const defini = (sentence: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Quel est l'article défini de « ${sentence} » ?`, answer, wrong, ARTICLE_DEFINITE_HINTS);
const indefini = (sentence: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Quel est l'article indéfini de « ${sentence} » ?`, answer, wrong, ARTICLE_INDEFINITE_HINTS);
export const CC_ARTICLE_ROWS: readonly QuestionRow[] = [
  defini("Moussa lit le livre.", "le", ["un", "des"]),
  indefini("Awa mange une mangue.", "une", ["la", "les"]),
  defini("Omar ferme la porte.", "la", ["une", "des"]),
  indefini("Fatou voit des oiseaux.", "des", ["le", "les"]),
  defini("Les enfants chantent en classe.", "Les", ["Une", "Des"]),
  indefini("Pape achète un cahier.", "un", ["le", "la"]),
  defini("Aminata cueille les fleurs.", "les", ["une", "un"]),
  indefini("Khady porte un seau.", "un", ["le", "les"]),
  defini("Le chat dort ici.", "Le", ["Un", "Des"]),
  indefini("Mariama a une poupée.", "une", ["la", "le"]),
  defini("Ibou range les cahiers.", "les", ["des", "un"]),
  indefini("Cheikh regarde des étoiles.", "des", ["les", "la"]),
];

const CC_GAP_HINTS = hints(
  "Ce petit mot relie le complément à la phrase.",
  "Dis la phrase en essayant les petits mots pour entendre le bon.",
  "Pense à la question où, quand ou comment.",
);
const ccGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, CC_GAP_HINTS);
export const CC_GAP_ROWS: readonly GapRow[] = [
  ccGap("Les enfants jouent ___ la cour.", "dans", ["pendant", "avec"]),
  ccGap("Nous arrivons ___ midi.", "à", ["dans", "sur"]),
  ccGap("Il parle ___ voix basse.", "à", ["sur", "pour"]),
  ccGap("Awa range ses affaires ___ soin.", "avec", ["dans", "sur"]),
  ccGap("Le pêcheur travaille ___ port.", "au", ["du", "aux"]),
  ccGap("Les élèves sortent ___ la récréation.", "pendant", ["avec", "sur"]),
  ccGap("Le chat saute ___ la table.", "sur", ["pendant", "avec"]),
  ccGap("Mariama habite ___ Thiès.", "à", ["pour", "avec"]),
  ccGap("Il pleut ___ juillet.", "en", ["à", "dans"]),
  ccGap("Omar répond ___ politesse.", "avec", ["sur", "dans"]),
  ccGap("Nous allons ___ Dakar.", "à", ["avec", "pendant"]),
  ccGap("Les enfants chantent ___ joie.", "avec", ["sur", "dans"]),
];

const CC_WRITE_HINTS = hints("Ce mot sert à poser une question sur l'action.", "Dis la phrase puis pose la question juste après le verbe.", "Un endroit, un moment et une manière n'ont pas la même question.");
const NOMINAL_WRITE_HINTS = hints("Il n'y a pas de verbe conjugué dans ce genre d'énoncé.", "Il dit un nom, un lieu ou une date, sans dire ce que quelqu'un fait.", "Le deuxième mot vient du mot nom.");
const ARTICLE_WRITE_HINTS = hints("Pense à ce que dit ce petit mot : quelque chose de connu ou d'inconnu.", "Il y en a trois, un pour chaque genre et un pour le pluriel.", "Observe le mot qui est devant le nom.");
export const CC_WRITE_ROWS: readonly WriteRow[] = [
  wr("Quel mot interrogatif sert à trouver le complément de lieu ? Écris le mot.", ["où", "ou"], CC_WRITE_HINTS),
  wr("Quel mot interrogatif sert à trouver le complément de temps ? Écris le mot.", ["quand"], CC_WRITE_HINTS),
  wr("Quel mot interrogatif sert à trouver le complément de manière ? Écris le mot.", ["comment"], CC_WRITE_HINTS),
  wr("Pour savoir à quel endroit se passe l'action, on pose quelle question ? Écris le mot.", ["où", "ou"], CC_WRITE_HINTS),
  wr("Pour savoir à quel moment se passe l'action, on pose quelle question ? Écris le mot.", ["quand"], CC_WRITE_HINTS),
  wr("Pour savoir de quelle façon se fait l'action, on pose quelle question ? Écris le mot.", ["comment"], CC_WRITE_HINTS),
  wr("Comment appelle-t-on un énoncé qui n'a pas de verbe conjugué ? Écris les deux mots.", ["phrase nominale", "une phrase nominale"], NOMINAL_WRITE_HINTS),
  wr("Comment appelle-t-on l'énoncé « Grande fête au village. » ? Écris les deux mots.", ["phrase nominale", "une phrase nominale"], NOMINAL_WRITE_HINTS),
  wr("Comment appelle-t-on l'article le, la ou les ? Écris le mot.", ["défini", "définis", "article défini"], ARTICLE_WRITE_HINTS),
  wr("Quel mot décrit l'article de « la porte » ? Écris le mot.", ["défini", "article défini"], ARTICLE_WRITE_HINTS),
  wr("Comment appelle-t-on l'article un, une ou des ? Écris le mot.", ["indéfini", "indéfinis", "article indéfini"], ARTICLE_WRITE_HINTS),
  wr("Quel mot décrit l'article de « une porte » ? Écris le mot.", ["indéfini", "article indéfini"], ARTICLE_WRITE_HINTS),
];

export function makeCe2CcType(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cc-type", CC, CC_TYPE_ROWS, 2);
}
export function makeCe2CcQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cc-question", CC, CC_QUESTION_ROWS);
}
export function makeCe2CcFind(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cc-trouver", CC, CC_FIND_ROWS);
}
export function makeCe2CcSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-cc-glisser", CC, CC_SORT_ROWS);
}
export function makeCe2CcLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-cc-relier", CC, CC_LINK_ROWS);
}
export function makeCe2CcNominal(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cc-nominale", CC, CC_NOMINAL_ROWS);
}
export function makeCe2CcArticle(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cc-article", CC, CC_ARTICLE_ROWS);
}
export function makeCe2CcGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-cc-mot", CC, CC_GAP_ROWS);
}
export function makeCe2CcWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-cc-ecrire", CC, CC_WRITE_ROWS);
}

// ===========================================================================
// LES ADJECTIFS POSSESSIFS ET DÉMONSTRATIFS (fr-ce2-determinants)
// ===========================================================================

const DET = "les adjectifs possessifs et démonstratifs";

const POSS_GAP_HINTS = hints(
  "Cherche à qui appartient la chose.",
  "Observe si le nom est au masculin, au féminin, au singulier ou au pluriel.",
  "Le petit mot change avec celui qui possède et avec le nom.",
);
/**
 * Les mauvais choix (du trou comme de la phrase à choisir) portent une FAUTE D'ACCORD avec le nom, jamais un autre possesseur : « Nous aimons votre village »,
 * « Omar et Pape cherchent son ballon » sont des phrases justes que l'app refusait (défaut relevé en production le 25 octobre 2026).
 */
const possGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, POSS_GAP_HINTS);
export const POSS_GAP_ROWS: readonly GapRow[] = [
  possGap("Moussa a un ballon. C'est ___ ballon.", "son", ["sa", "ses"]),
  possGap("Fatou a une poupée. C'est ___ poupée.", "sa", ["son", "ses"]),
  possGap("Awa a deux sœurs. Ce sont ___ sœurs.", "ses", ["son", "sa"]),
  possGap("Je range ___ affaires.", "mes", ["mon", "ma"]),
  possGap("Tu ranges ___ cahiers.", "tes", ["ton", "ta"]),
  possGap("Nous aimons ___ village.", "notre", ["nos", "ma"]),
  possGap("Vous lavez ___ mains.", "vos", ["votre", "ta"]),
  possGap("Les élèves ouvrent ___ cahiers.", "leurs", ["leur", "son"]),
  possGap("Pape et Omar jouent avec ___ ballon.", "leur", ["leurs", "ses"]),
  possGap("Je range ___ cartable.", "mon", ["ma", "mes"]),
  possGap("Tu prends ___ natte.", "ta", ["ton", "tes"]),
  possGap("Nous cherchons ___ amies.", "nos", ["notre", "votre"]),
];

const POSS_CHOICE_HINTS = hints(
  "Compte le nombre de choses qui appartiennent à quelqu'un.",
  "Cherche si le nom est masculin ou féminin.",
  "Une seule phrase accorde bien le petit mot avec le nom.",
);
const possChoice = (answer: string, wrong: readonly [string, string]): QuestionRow => qr("Quelle phrase est écrite correctement ?", answer, wrong, POSS_CHOICE_HINTS);
export const POSS_CHOICE_ROWS: readonly QuestionRow[] = [
  possChoice("Fatou ouvre son cahier.", ["Fatou ouvre sa cahier.", "Fatou ouvre ses cahier."]),
  possChoice("Moussa prend sa casquette.", ["Moussa prend son casquette.", "Moussa prend ses casquette."]),
  possChoice("Les filles lavent leurs mains.", ["Les filles lavent leur mains.", "Les filles lavent sa mains."]),
  possChoice("Je range mes crayons.", ["Je range mon crayons.", "Je range ma crayons."]),
  possChoice("Tu fermes ta porte.", ["Tu fermes ton porte.", "Tu fermes tes porte."]),
  possChoice("Nous aimons notre école.", ["Nous aimons nos école.", "Nous aimons mes école."]),
  possChoice("Vous montrez vos dessins.", ["Vous montrez votre dessins.", "Vous montrez ton dessins."]),
  possChoice("Omar et Pape cherchent leur ballon.", ["Omar et Pape cherchent leurs ballon.", "Omar et Pape cherchent ses ballon."]),
  possChoice("Awa aide ses cousins.", ["Awa aide son cousins.", "Awa aide sa cousins."]),
  possChoice("Mariama lit sa lettre.", ["Mariama lit son lettre.", "Mariama lit ses lettre."]),
  possChoice("Tu cherches tes clés.", ["Tu cherches ton clés.", "Tu cherches ta clés."]),
  possChoice("Les enfants gardent leur village.", ["Les enfants gardent leurs village.", "Les enfants gardent ses village."]),
];

const DEM_GAP_HINTS = hints(
  "Observe si le nom est seul ou à plusieurs.",
  "Cherche si le nom est masculin ou féminin.",
  "Un nom masculin qui commence par une voyelle change le petit mot.",
);
const demGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, DEM_GAP_HINTS);
export const DEM_GAP_ROWS: readonly GapRow[] = [
  demGap("___ garçon court vite.", "Ce", ["Cette", "Ces"]),
  demGap("___ fille chante bien.", "Cette", ["Ce", "Ces"]),
  demGap("___ arbres sont grands.", "Ces", ["Ce", "Cet"]),
  demGap("Regarde ___ oiseau dans le ciel.", "cet", ["ce", "cette"]),
  demGap("J'aime ___ chanson.", "cette", ["ce", "ces"]),
  demGap("Donne-moi ___ ballon.", "ce", ["cet", "cette"]),
  demGap("Je veux ___ fruits.", "ces", ["cette", "cet"]),
  demGap("Voici ___ éléphant.", "cet", ["ce", "ces"]),
  demGap("Tu vois ___ maison ?", "cette", ["ce", "cet"]),
  demGap("___ enfants jouent dans la cour.", "Ces", ["Ce", "Cette"]),
  demGap("Nous aimons ___ village.", "ce", ["cet", "cette"]),
  demGap("Elle porte ___ pagne.", "ce", ["cette", "cet"]),
];

const DEM_CHOICE_HINTS = hints(
  "Regarde si le nom est masculin ou féminin, seul ou à plusieurs.",
  "Un petit mot va avec un nom féminin, un autre avec plusieurs noms.",
  "Un nom masculin qui commence par une voyelle prend un autre petit mot.",
);
const demChoice = (noun: string, answer: string, wrong: readonly [string, string]): QuestionRow =>
  qr(`Quel mot convient devant « ${noun} » ?`, answer, wrong, DEM_CHOICE_HINTS);
export const DEM_CHOICE_ROWS: readonly QuestionRow[] = [
  demChoice("garçon", "ce", ["cet", "cette"]),
  demChoice("filles", "ces", ["ce", "cette"]),
  demChoice("mangue", "cette", ["ce", "ces"]),
  demChoice("arbre", "cet", ["ce", "cette"]),
  demChoice("livre", "ce", ["cet", "cette"]),
  demChoice("amis", "ces", ["ce", "cet"]),
  demChoice("école", "cette", ["ce", "cet"]),
  demChoice("éléphant", "cet", ["ce", "ces"]),
  demChoice("cahier", "ce", ["cette", "cet"]),
  demChoice("chaises", "ces", ["ce", "cette"]),
  demChoice("maison", "cette", ["ce", "ces"]),
  demChoice("orage", "cet", ["ce", "cette"]),
];

const SINGULAR_DET = ["mon", "ma", "ton", "ta", "son", "sa", "notre", "votre", "leur", "ce", "cet", "cette"] as const;
const PLURAL_DET = ["mes", "tes", "ses", "nos", "vos", "leurs", "ces"] as const;
export const DET_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque petit mot dans la bonne case.",
  ["Singulier", "Pluriel"],
  SINGULAR_DET,
  PLURAL_DET,
  hints("Une seule chose ou plusieurs choses ?", "Dis le petit mot devant un nom : un seul ou plusieurs ?", "Les petits mots qui finissent par s parlent de plusieurs choses."),
  12,
);

type OwnerSet = readonly { word: string; noun: string; right: string }[];
const OWNERS: Record<string, OwnerSet> = {
  moi: [
    { word: "mon", noun: "cahier", right: "Le cahier est à moi." },
    { word: "ma", noun: "natte", right: "La natte est à moi." },
    { word: "mes", noun: "billes", right: "Les billes sont à moi." },
  ],
  toi: [
    { word: "ton", noun: "ballon", right: "Le ballon est à toi." },
    { word: "ta", noun: "corde", right: "La corde est à toi." },
    { word: "tes", noun: "livres", right: "Les livres sont à toi." },
  ],
  lui: [
    { word: "son", noun: "sac", right: "Le sac est à lui ou à elle." },
    { word: "sa", noun: "robe", right: "La robe est à lui ou à elle." },
    { word: "ses", noun: "crayons", right: "Les crayons sont à lui ou à elle." },
  ],
  nous: [
    { word: "notre", noun: "maison", right: "La maison est à nous." },
    { word: "nos", noun: "jouets", right: "Les jouets sont à nous." },
    { word: "notre", noun: "village", right: "Le village est à nous." },
  ],
  vous: [
    { word: "votre", noun: "classe", right: "La classe est à vous." },
    { word: "vos", noun: "cahiers", right: "Les cahiers sont à vous." },
    { word: "votre", noun: "pagne", right: "Le pagne est à vous." },
  ],
  eux: [
    { word: "leur", noun: "jardin", right: "Le jardin est à eux." },
    { word: "leurs", noun: "chèvres", right: "Les chèvres sont à eux." },
    { word: "leur", noun: "école", right: "L'école est à eux." },
  ],
};
const OWNER_KEYS = Object.keys(OWNERS);
const OWNER_HINTS = hints(
  "Le petit mot dit à qui appartient la chose.",
  "Celui qui parle dit « moi », celui à qui on parle dit « toi ».",
  "Quand plusieurs personnes possèdent la chose, la fin du mot change.",
);
/** Trois possesseurs différents par ligne, un nom différent à chaque tour. */
export const DET_LINK_ROWS: readonly LinkRow[] = combinations(OWNER_KEYS, 3)
  .filter((_, i) => i % 5 !== 4)
  .slice(0, 12)
  .map((keys, i) => ({
    prompt: "Relie chaque groupe à celui à qui il appartient.",
    pairs: keys.map((key) => {
      const entry = OWNERS[key][i % 3];
      return ct(`${entry.word} ${entry.noun}`, entry.right);
    }),
    hints: OWNER_HINTS,
  }));

export const DET_ORDER_ROWS: readonly OrderRow[] = [
  sentenceRow("Mes amis jouent dans la cour."),
  sentenceRow("Cette mangue est très sucrée."),
  sentenceRow("Ton frère range ses affaires."),
  sentenceRow("Ces enfants chantent une chanson."),
  sentenceRow("Notre maîtresse écrit au tableau."),
  sentenceRow("Ce garçon porte son cartable."),
  sentenceRow("Vos cahiers sont sur la table."),
  sentenceRow("Cet arbre donne de l'ombre."),
  sentenceRow("Leur village est près du fleuve."),
  sentenceRow("Sa sœur lave ses habits."),
  sentenceRow("Ces fruits viennent de notre jardin."),
  sentenceRow("Mon père travaille au port."),
];

const DEM_WRITE_HINTS = hints("Observe si le nom est masculin ou féminin.", "Regarde si le nom est seul ou à plusieurs.", "Un nom masculin qui commence par une voyelle change le petit mot.");
const POSS_WRITE_HINTS = hints("Pense à celui qui possède la chose.", "Regarde si le nom est masculin ou féminin, seul ou à plusieurs.", "Le petit mot change avec celui qui possède et avec le nom.");
export const DET_WRITE_ROWS: readonly WriteRow[] = [
  wr("Quel petit mot démonstratif va devant « oiseau » ? Écris le mot.", ["cet"], DEM_WRITE_HINTS),
  wr("Quel petit mot démonstratif va devant « fille » ? Écris le mot.", ["cette"], DEM_WRITE_HINTS),
  wr("Quel petit mot démonstratif va devant « chaises » ? Écris le mot.", ["ces"], DEM_WRITE_HINTS),
  wr("Quel petit mot démonstratif va devant « garçon » ? Écris le mot.", ["ce"], DEM_WRITE_HINTS),
  wr("Awa a une poupée. Quel mot va devant poupée pour dire qu'elle est à Awa ? Écris le mot.", ["sa"], POSS_WRITE_HINTS),
  wr("Awa a un ballon. Quel mot va devant ballon pour dire qu'il est à Awa ? Écris le mot.", ["son"], POSS_WRITE_HINTS),
  wr("Awa a trois crayons. Quel mot va devant crayons pour dire qu'ils sont à Awa ? Écris le mot.", ["ses"], POSS_WRITE_HINTS),
  wr("Pape et Omar ont une case. Quel mot va devant case pour dire qu'elle est à eux ? Écris le mot.", ["leur"], POSS_WRITE_HINTS),
  wr("Pape et Omar ont des vélos. Quel mot va devant vélos pour dire qu'ils sont à eux ? Écris le mot.", ["leurs"], POSS_WRITE_HINTS),
  wr("Nous avons un jardin. Quel mot va devant jardin pour dire qu'il est à nous ? Écris le mot.", ["notre"], POSS_WRITE_HINTS),
  wr("Vous avez des livres. Quel mot va devant livres pour dire qu'ils sont à vous ? Écris le mot.", ["vos"], POSS_WRITE_HINTS),
  wr("Tu as une natte. Quel mot va devant natte pour dire qu'elle est à toi ? Écris le mot.", ["ta"], POSS_WRITE_HINTS),
];

export function makeCe2PossGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-poss-trou", DET, POSS_GAP_ROWS, 2);
}
export function makeCe2PossChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-poss-choisir", DET, POSS_CHOICE_ROWS, 1, (row) => row.answer);
}
export function makeCe2DemGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-dem-trou", DET, DEM_GAP_ROWS, 2);
}
export function makeCe2DemChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-dem-choisir", DET, DEM_CHOICE_ROWS);
}
export function makeCe2DetSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-det-glisser", DET, DET_SORT_ROWS);
}
export function makeCe2DetLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-det-relier", DET, DET_LINK_ROWS);
}
export function makeCe2DetOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-det-ordre", DET, DET_ORDER_ROWS);
}
export function makeCe2DetWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-det-ecrire", DET, DET_WRITE_ROWS);
}
