/**
 * LES GABARITS DE LA COMÉDIE DU CM1 : jouer la joie et la tristesse (`ar-cm1-comedie`).
 *
 * Ici le modèle écrivait des consignes de mise en scène sans réponse à vérifier. Chaque réponse se lit dans un tableau fermé, écrit à la
 * main, qui ne dit que ce que la fiche dit : ce que le visage, la voix et le corps montrent de la joie et de la tristesse, quelques mots
 * du théâtre (comédien, rôle, jeu de rôle, imiter) et les étapes pour préparer et jouer un jeu de rôle. Aucune consigne n'attend un
 * dessin ni un enregistrement : tout se répond sur l'écran.
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais
 * choix d'un fait sont les réponses des autres faits de son lot et ses intrus ; un signe aussi juste (`not`) n'est jamais proposé.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

const JOIE = ["Un grand sourire", "Une voix claire et vive", "Des sauts et de grands gestes"] as const;
const TRISTESSE = ["Des yeux humides", "Une voix basse et lente", "Des épaules basses"] as const;
const otherThan = (own: string, group: readonly string[]) => group.filter((sign) => sign !== own);

const CMD_SIGNES: Pool = {
  items: [
    {
      id: "joie-visage",
      q: ["Quel signe du visage montre la joie ?", "Sur le visage d'un comédien joyeux, que voit-on ?"],
      a: JOIE[0],
      noWrite: true,
      not: otherThan(JOIE[0], JOIE),
      s: ["Sur le visage d'un comédien joyeux, on voit ___.", "Pour jouer la joie, le visage montre ___."],
      ga: "un grand sourire",
      hint: "Les coins de la bouche remontent.",
    },
    {
      id: "joie-voix",
      q: ["Quel signe de la voix montre la joie ?", "Comment parle un comédien joyeux ?"],
      a: JOIE[1],
      noWrite: true,
      not: otherThan(JOIE[1], JOIE),
      s: ["Un comédien joyeux parle avec ___.", "Pour jouer la joie, on parle avec ___."],
      ga: "une voix claire et vive",
      hint: "Le ton monte et les mots chantent.",
    },
    {
      id: "joie-corps",
      q: ["Quel signe du corps montre la joie ?", "Comment bouge un comédien joyeux ?"],
      a: JOIE[2],
      noWrite: true,
      not: otherThan(JOIE[2], JOIE),
      s: ["Un comédien joyeux bouge avec ___.", "Pour jouer la joie, le corps fait ___."],
      ga: "des sauts et de grands gestes",
      hint: "Tout son corps semble léger.",
    },
    {
      id: "tristesse-visage",
      q: ["Quel signe du visage montre la tristesse ?", "Sur le visage d'un comédien triste, que voit-on ?"],
      a: TRISTESSE[0],
      noWrite: true,
      not: otherThan(TRISTESSE[0], TRISTESSE),
      s: ["Sur le visage d'un comédien triste, on voit ___.", "Pour jouer la tristesse, le visage montre ___."],
      ga: "des yeux humides",
      hint: "Le regard brille et les paupières pèsent.",
    },
    {
      id: "tristesse-voix",
      q: ["Quel signe de la voix montre la tristesse ?", "Comment parle un comédien triste ?"],
      a: TRISTESSE[1],
      noWrite: true,
      not: otherThan(TRISTESSE[1], TRISTESSE),
      s: ["Un comédien triste parle avec ___.", "Pour jouer la tristesse, on parle avec ___."],
      ga: "une voix basse et lente",
      hint: "Les mots sortent doucement, presque en murmurant.",
    },
    {
      id: "tristesse-corps",
      q: ["Quel signe du corps montre la tristesse ?", "Comment se tient un comédien triste ?"],
      a: TRISTESSE[2],
      noWrite: true,
      not: otherThan(TRISTESSE[2], TRISTESSE),
      s: ["Un comédien triste se tient avec ___.", "Pour jouer la tristesse, le corps garde ___."],
      ga: "des épaules basses",
      hint: "Il semble porter un poids sur le dos.",
    },
  ],
  extras: ["Des poings serrés", "Un cri de colère"],
  gextras: ["des poings serrés", "un cri de colère"],
};

const CMD_EMOTIONS: Pool = {
  items: [
    {
      id: "joue-joie",
      q: ["Un comédien sourit, rit et saute. Quelle émotion joue-t-il ?", "Le comédien chante, bondit et rit aux éclats. Quelle émotion montre-t-il ?"],
      a: "Joie",
      also: ["La joie"],
      s: ["Un comédien qui sourit, rit et saute joue ___.", "Un comédien qui bondit et rit aux éclats montre ___."],
      ga: "la joie",
      hint: "Tout son corps déborde d'énergie.",
    },
    {
      id: "joue-tristesse",
      q: ["Un comédien pleure, parle tout bas et baisse la tête. Quelle émotion joue-t-il ?", "Le comédien soupire, marche lentement et les larmes montent. Quelle émotion montre-t-il ?"],
      a: "Tristesse",
      also: ["La tristesse"],
      s: ["Un comédien qui pleure et baisse la tête joue ___.", "Un comédien qui soupire et marche lentement montre ___."],
      ga: "la tristesse",
      hint: "Tout son corps semble lourd.",
    },
  ],
  extras: ["Colère", "Peur", "Surprise"],
  gextras: ["la colère", "la peur", "la surprise"],
};

const CMD_MOTS: Pool = {
  items: [
    {
      id: "comedien",
      q: ["Comment appelle-t-on la personne qui joue un rôle devant le public ?", "Qui joue un personnage sur une scène ?"],
      a: "Comédien",
      s: ["La personne qui joue un rôle devant le public est ___.", "Sur une scène, celui qui joue un personnage est ___."],
      ga: "le comédien",
      hint: "Il apprend son texte et monte sur les planches.",
    },
    {
      id: "role",
      q: ["Comment appelle-t-on le personnage qu'un comédien joue ?"],
      a: "Rôle",
      s: ["Le personnage qu'un comédien joue est ___."],
      ga: "un rôle",
      hint: "Il peut être un roi, une mère ou un marchand.",
    },
    {
      id: "jeu-de-role",
      q: ["Comment appelle-t-on le jeu où l'on joue un personnage dans une situation imaginée ?"],
      a: "Jeu de rôle",
      s: ["Jouer un personnage dans une situation imaginée, c'est faire ___."],
      ga: "un jeu de rôle",
      hint: "On se met dans la peau de quelqu'un d'autre.",
    },
  ],
  extras: ["Spectateur", "Décor"],
  gextras: ["le spectateur", "un décor"],
};

/** Un verbe ne se mêle pas à des noms dans une phrase à trou : « imiter » a son lot, avec des verbes pour intrus. */
const CMD_IMITER: Pool = {
  items: [
    {
      id: "imiter",
      q: ["Que fait un comédien qui reproduit les gestes et la voix d'une autre personne ?"],
      a: "Imiter",
      s: ["Reproduire les gestes et la voix des autres, c'est ___."],
      ga: "imiter",
      hint: "Il copie ce qu'il a bien observé.",
    },
  ],
  extras: ["Chanter", "Applaudir"],
  gextras: ["chanter", "applaudir"],
};

const CMD_POOLS = [CMD_SIGNES, CMD_EMOTIONS, CMD_MOTS, CMD_IMITER] as const;
const CMD_QCM = questionRows("ar-cm1-comedie", CMD_POOLS);
const CMD_TROU = gapRows("ar-cm1-comedie", CMD_POOLS);
const CMD_ECRIRE = writeRows("ar-cm1-comedie", CMD_POOLS);

const CMD_ORDRE: readonly OrderRow[] = [
  order("Range ces étapes d'un jeu de rôle, de la première à la dernière.", ["Choisir la situation", "Répartir les rôles", "Répéter la scène", "Jouer devant les camarades"], "cmd-ordre:jeu", RANK_HINTS),
  order("Range ces étapes d'un jeu de rôle, de la première à la dernière.", ["Choisir la situation", "Répartir les rôles", "Jouer devant les camarades"], "cmd-ordre:haut", RANK_HINTS),
  order("Range ces étapes d'un jeu de rôle, de la première à la dernière.", ["Répartir les rôles", "Répéter la scène", "Jouer devant les camarades"], "cmd-ordre:bas", RANK_HINTS),
  order("Range ces étapes d'un jeu de rôle, de la première à la dernière.", ["Choisir la situation", "Répéter la scène", "Jouer devant les camarades"], "cmd-ordre:sauts", RANK_HINTS),
  order("Range ces étapes pour imiter un comédien, de la première à la dernière.", ["Observer le comédien", "Retenir ses gestes", "Imiter ses gestes"], "cmd-ordre:imiter", RANK_HINTS),
  order("Range ces moments d'une scène, du premier au dernier.", ["Entrer en scène", "Jouer son rôle", "Saluer le public"], "cmd-ordre:scene", RANK_HINTS),
];

const CMD_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Comédien", "Joue un rôle"], ["Rôle", "Personnage joué"], ["Imiter", "Reproduire ce qu'on a vu"], ["Jeu de rôle", "Situation jouée à plusieurs"]]),
  link("Relie chaque mot à son sens.", [["Comédien", "Joue un rôle"], ["Imiter", "Reproduire ce qu'on a vu"], ["Jeu de rôle", "Situation jouée à plusieurs"]]),
  link("Relie chaque mot à son sens.", [["Comédien", "Joue un rôle"], ["Rôle", "Personnage joué"], ["Imiter", "Reproduire ce qu'on a vu"]]),
  link("Relie chaque moyen d'expression à un signe de la joie.", [["Visage", "Grand sourire"], ["Voix", "Ton clair et vif"], ["Corps", "Sauts et grands gestes"]]),
  link("Relie chaque moyen d'expression à un signe de la tristesse.", [["Visage", "Yeux humides"], ["Voix", "Ton bas et lent"], ["Corps", "Épaules basses"]]),
  link("Relie chaque mot à son sens.", [["Scène", "Lieu où l'on joue"], ["Répétition", "Entraînement pour jouer"], ["Public", "Ceux qui regardent"]]),
];

const CMD_GLISSER = [
  ...sortRows(
    "Glisse chaque signe dans la bonne case.",
    ["Joie", "Tristesse"],
    ["Grand sourire", "Rire clair", "Sauts joyeux", "Voix vive"],
    ["Yeux humides", "Voix lente", "Épaules basses", "Tête baissée"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Joie", "Tristesse"],
    ["Danser", "Applaudir", "Éclater de rire", "Sourire"],
    ["Pleurer", "Soupirer", "Marcher lentement", "Parler d'une voix éteinte"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1CmdQcm: Make = (ctx) => ce2Question(ctx, "cm1-cmd-qcm", "ce que montrent le visage, la voix et le corps dans la joie et la tristesse", CMD_QCM, 3);
export const makeCm1CmdTrou: Make = (ctx) => ce2Gap(ctx, "cm1-cmd-trou", "compléter une phrase sur le jeu de la joie et de la tristesse", CMD_TROU, 2, 1);
export const makeCm1CmdEcrire: Make = (ctx) => ce2Write(ctx, "cm1-cmd-ecrire", "écrire un mot du théâtre", CMD_ECRIRE, 1, 2);
export const makeCm1CmdOrdre: Make = (ctx) => ce2Order(ctx, "cm1-cmd-ordre", "ranger les étapes d'un jeu de rôle", CMD_ORDRE);
export const makeCm1CmdRelier: Make = (ctx) => ce2Link(ctx, "cm1-cmd-relier", "relier un mot du théâtre ou un moyen d'expression à son sens", CMD_RELIER);
export const makeCm1CmdGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-cmd-glisser", "classer les signes de la joie et de la tristesse", CMD_GLISSER, 2);
