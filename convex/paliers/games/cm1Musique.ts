/**
 * LES GABARITS DE LA MUSIQUE DU CM1 : les percussions et les cordes (`ar-cm1-instruments`) et les rythmes (`ar-cm1-rythmes`).
 *
 * Ces deux fiches gardent leurs jeux d'écoute (`ecoute-rythme`, `ecoute-motif-rythmique`, `frise-rythme`) : les gabarits ne prennent que les
 * places qui restent (six sur dix aux instruments, deux aux rythmes). Chaque réponse se lit dans un tableau fermé, écrit à la main, qui ne
 * dit que ce que la fiche dit : le djembé, le sabar, le tama et le balafon sont des percussions, la kora, le xalam, le riti et la guitare ont
 * des cordes ; comment on en joue ; ce qu'est un rythme (coups longs et courts), la pulsation, le silence. Aucune consigne n'attend un son
 * ni un enregistrement : tout se répond sur l'écran, et le rythme se lit en mots (« long, court, court »).
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais choix d'un
 * fait sont les réponses des autres faits de son lot et ses intrus.
 *
 * HORS FICHE, À FAIRE RELIRE : comment on joue de chaque instrument (le djembé avec les mains, le sabar avec une main et une baguette, le
 * tama sous le bras, le balafon avec des mailloches, la kora pincée avec les doigts et ses vingt et une cordes, le riti à une corde frottée
 * avec un archet), la forme du djembé (calice), la définition de la pulsation et du silence, les rythmes écrits en mots.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow } from "./ce2Outils";
import { SORT_HINTS, gapRows, link, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ---------------------------------------------------------------------------
// Les percussions et les cordes
// ---------------------------------------------------------------------------

/** Un instrument, sa famille : « Percussion » ou « Cordes ». Les mauvais choix sont l'autre famille et un intrus (« Vent »). */
const INS_FAMILLE: Pool = {
  items: [
    {
      id: "famille-djembe",
      q: ["À quelle famille appartient le djembé ?", "Dans quelle famille range-t-on le djembé ?"],
      a: "Percussion",
      noWrite: true,
      s: ["Le djembé est un instrument à ___.", "Un djembé, c'est un instrument à ___."],
      ga: "percussion",
      hint: "On le joue en frappant une peau tendue.",
    },
    {
      id: "famille-sabar",
      q: ["À quelle famille appartient le sabar ?", "Dans quelle famille range-t-on le sabar ?"],
      a: "Percussion",
      noWrite: true,
      s: ["Le sabar est un instrument à ___.", "Un sabar, c'est un instrument à ___."],
      ga: "percussion",
      hint: "Une main et une baguette frappent sa peau.",
    },
    {
      id: "famille-tama",
      q: ["À quelle famille appartient le tama ?", "Dans quelle famille range-t-on le tama ?"],
      a: "Percussion",
      noWrite: true,
      s: ["Le tama est un instrument à ___.", "Un tama, c'est un instrument à ___."],
      ga: "percussion",
      hint: "Coincé sous le bras, il se frappe avec une baguette.",
    },
    {
      id: "famille-balafon",
      q: ["À quelle famille appartient le balafon ?", "Dans quelle famille range-t-on le balafon ?"],
      a: "Percussion",
      noWrite: true,
      s: ["Le balafon est un instrument à ___.", "Un balafon, c'est un instrument à ___."],
      ga: "percussion",
      hint: "Des mailloches frappent ses lames de bois.",
    },
    {
      id: "famille-kora",
      q: ["À quelle famille appartient la kora ?", "Dans quelle famille range-t-on la kora ?"],
      a: "Cordes",
      noWrite: true,
      s: ["La kora est un instrument à ___.", "Une kora, c'est un instrument à ___."],
      ga: "cordes",
      hint: "Des fils tendus vibrent sur une calebasse.",
    },
    {
      id: "famille-xalam",
      q: ["À quelle famille appartient le xalam ?", "Dans quelle famille range-t-on le xalam ?"],
      a: "Cordes",
      noWrite: true,
      s: ["Le xalam est un instrument à ___.", "Un xalam, c'est un instrument à ___."],
      ga: "cordes",
      hint: "Des fils tendus vibrent sur un long manche.",
    },
    {
      id: "famille-riti",
      q: ["À quelle famille appartient le riti ?", "Dans quelle famille range-t-on le riti ?"],
      a: "Cordes",
      noWrite: true,
      s: ["Le riti est un instrument à ___.", "Un riti, c'est un instrument à ___."],
      ga: "cordes",
      hint: "Un archet frotte son fil tendu.",
    },
    {
      id: "famille-guitare",
      q: ["À quelle famille appartient la guitare ?", "Dans quelle famille range-t-on la guitare ?"],
      a: "Cordes",
      noWrite: true,
      s: ["La guitare est un instrument à ___.", "Une guitare, c'est un instrument à ___."],
      ga: "cordes",
      hint: "Des fils tendus vibrent sur une caisse en bois.",
    },
  ],
  extras: ["Vent"],
  gextras: ["vent"],
};

/** Comment on joue de cinq instruments : chaque réponse est la seule qui lui va (la peau aux mains, la baguette au sabar). */
const INS_JEU: Pool = {
  items: [
    {
      id: "jeu-djembe",
      q: ["Comment joue-t-on du djembé ?", "Que fait le musicien pour jouer du djembé ?"],
      a: "En frappant la peau avec les mains",
      noWrite: true,
      hint: "Le musicien claque ses paumes sur le tambour.",
    },
    {
      id: "jeu-sabar",
      q: ["Comment joue-t-on du sabar ?", "Que fait le musicien pour jouer du sabar ?"],
      a: "En frappant la peau avec une main et une baguette",
      noWrite: true,
      hint: "Une paume et un bâton se partagent le travail.",
    },
    {
      id: "jeu-balafon",
      q: ["Comment joue-t-on du balafon ?", "Que fait le musicien pour jouer du balafon ?"],
      a: "En frappant les lames avec des mailloches",
      noWrite: true,
      hint: "Des bâtons à bout rond tapent sur du bois.",
    },
    {
      id: "jeu-kora",
      q: ["Comment joue-t-on de la kora ?", "Que fait le musicien pour jouer de la kora ?"],
      a: "En pinçant les cordes avec les doigts",
      noWrite: true,
      hint: "Le musicien fait vibrer des fils en les tirant.",
    },
    {
      id: "jeu-riti",
      q: ["Comment joue-t-on du riti ?", "Que fait le musicien pour jouer du riti ?"],
      a: "En frottant la corde avec un archet",
      noWrite: true,
      hint: "Un crin tendu glisse sur le fil unique.",
    },
  ],
};

/** Reconnaître un instrument à ce qui le décrit : la question, la phrase à trou et la réponse à écrire disent la même chose. */
const INS_NOMS: Pool = {
  items: [
    {
      id: "nom-kora",
      q: ["Quel instrument à cordes a vingt et une cordes et un grand corps en calebasse ?", "Quel instrument à cordes ouest-africain compte vingt et une cordes ?"],
      a: "Kora",
      also: ["La kora"],
      s: ["Cet instrument à vingt et une cordes s'appelle ___.", "L'instrument à vingt et une cordes est ___."],
      ga: "la kora",
      hint: "Un griot en joue en pinçant ses fils.",
    },
    {
      id: "nom-balafon",
      q: ["Quel instrument à percussion a des lames de bois que l'on frappe avec des mailloches ?", "Quel instrument fait de lames de bois se joue avec des mailloches ?"],
      a: "Balafon",
      also: ["Le balafon"],
      s: ["Cet instrument à lames de bois frappées avec des mailloches s'appelle ___.", "L'instrument à lames de bois est ___."],
      ga: "le balafon",
      hint: "Il ressemble à un xylophone de bois.",
    },
    {
      id: "nom-tama",
      q: ["Quel petit tambour se tient sous le bras et se frappe avec une baguette courbe ?", "Quel tambour se joue sous le bras avec une baguette ?"],
      a: "Tama",
      also: ["Le tama"],
      s: ["Ce petit tambour tenu sous le bras s'appelle ___.", "Le petit tambour sous le bras est ___."],
      ga: "le tama",
      hint: "Il se serre contre le corps du musicien.",
    },
    {
      id: "nom-riti",
      q: ["Quel instrument à cordes a une seule corde frottée avec un archet ?", "Quel instrument à une corde se joue avec un archet ?"],
      a: "Riti",
      also: ["Le riti"],
      s: ["Cet instrument à une seule corde frottée avec un archet s'appelle ___.", "L'instrument à une corde et à archet est ___."],
      ga: "le riti",
      hint: "Son archet le fait chanter comme un violon.",
    },
    {
      id: "nom-djembe",
      q: ["Quel grand tambour en forme de calice se joue avec les mains ?", "Quel tambour en forme de calice se frappe à mains nues ?"],
      a: "Djembé",
      also: ["Le djembé"],
      s: ["Ce grand tambour en forme de calice s'appelle ___.", "Le tambour en forme de calice est ___."],
      ga: "le djembé",
      hint: "Sa forme rappelle un grand verre à pied.",
    },
    {
      id: "nom-sabar",
      q: ["Quel tambour du Sénégal se joue avec une main et une baguette ?", "Quel tambour se frappe avec une main et une baguette ?"],
      a: "Sabar",
      also: ["Le sabar"],
      s: ["Ce tambour joué avec une main et une baguette s'appelle ___.", "Le tambour à une main et une baguette est ___."],
      ga: "le sabar",
      hint: "Il est joué pendant les fêtes sénégalaises.",
    },
  ],
};

const INS_QCM = questionRows("ar-cm1-instruments", [INS_FAMILLE, INS_JEU, INS_NOMS]);
const INS_TROU = gapRows("ar-cm1-instruments", [INS_FAMILLE, INS_NOMS]);
const INS_ECRIRE = writeRows("ar-cm1-instruments", [INS_NOMS]);

const INS_SON = "Relie chaque instrument à ce qui produit son son.";
const INS_GESTE = "Relie chaque instrument au geste du musicien.";
const INS_RELIER: readonly LinkRow[] = [
  link(INS_SON, [["Djembé", "Une peau tendue"], ["Balafon", "Des lames de bois"], ["Kora", "Des cordes pincées"]]),
  link(INS_SON, [["Djembé", "Une peau tendue"], ["Balafon", "Des lames de bois"], ["Riti", "Une corde frottée"]]),
  link(INS_SON, [["Balafon", "Des lames de bois"], ["Kora", "Des cordes pincées"], ["Riti", "Une corde frottée"]]),
  link(INS_SON, [["Djembé", "Une peau tendue"], ["Kora", "Des cordes pincées"], ["Riti", "Une corde frottée"]]),
  link(INS_SON, [["Djembé", "Une peau tendue"], ["Riti", "Une corde frottée"], ["Guitare", "Des cordes grattées"]]),
  link(INS_SON, [["Balafon", "Des lames de bois"], ["Guitare", "Des cordes grattées"], ["Djembé", "Une peau tendue"]]),
  link(INS_GESTE, [["Djembé", "Frapper"], ["Kora", "Pincer"], ["Riti", "Frotter"]]),
  link(INS_GESTE, [["Balafon", "Frapper"], ["Kora", "Pincer"], ["Riti", "Frotter"]]),
];

const INS_GLISSER = sortRows(
  "Glisse chaque instrument dans la bonne famille.",
  ["Percussion", "Cordes"],
  ["Djembé", "Sabar", "Tama", "Balafon"],
  ["Kora", "Xalam", "Riti", "Guitare"],
  SORT_HINTS,
  8,
);

export const makeCm1InsQcm: Make = (ctx) => ce2Question(ctx, "cm1-ins-qcm", "reconnaître la famille d'un instrument et la façon d'en jouer", INS_QCM, 2);
export const makeCm1InsTrou: Make = (ctx) => ce2Gap(ctx, "cm1-ins-trou", "compléter une phrase sur un instrument à percussion ou à cordes", INS_TROU, 1, 1);
export const makeCm1InsEcrire: Make = (ctx) => ce2Write(ctx, "cm1-ins-ecrire", "écrire le nom d'un instrument", INS_ECRIRE, 1, 2);
export const makeCm1InsRelier: Make = (ctx) => ce2Link(ctx, "cm1-ins-relier", "relier un instrument à ce qui produit son son ou au geste du musicien", INS_RELIER);
export const makeCm1InsGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-ins-glisser", "classer les instruments à percussion et à cordes", INS_GLISSER, 1);

// ---------------------------------------------------------------------------
// Les rythmes
// ---------------------------------------------------------------------------

const RYT_MOTS: Pool = {
  items: [
    {
      id: "rythme",
      q: ["Comment appelle-t-on une suite de sons longs et courts qui se répète ?", "Quel mot désigne une suite de coups longs et courts ?"],
      a: "Rythme",
      hint: "On peut le frapper dans les mains.",
    },
    {
      id: "pulsation",
      q: ["Comment appelle-t-on le battement régulier que l'on sent dans une musique ?", "Quel mot désigne le battement régulier, comme un pas qui avance ?"],
      a: "Pulsation",
      hint: "Elle bat sans jamais ralentir.",
    },
    {
      id: "silence",
      q: ["Comment appelle-t-on le moment où l'on ne joue aucun son ?", "Quel mot désigne une pause entre deux sons ?"],
      a: "Silence",
      hint: "On ne l'entend pas, mais il compte.",
    },
  ],
  extras: ["Couplet", "Accord"],
};

/** Une ligne de lecture d'un rythme écrit en mots : la suite, ce qu'on compte, le nombre. Chaque suite est comptée à la main. */
const lecture = (id: string, suite: string, compte: "courts" | "longs", a: string, chiffre: string) => ({
  id,
  q: [`Un rythme se joue ${suite}. Combien de coups ${compte} contient-il ?`],
  a,
  also: [chiffre],
  w: `Un rythme se joue ${suite}. Combien de coups ${compte} contient-il ? Écris le nombre.`,
  hint: "Relis la suite sans compter les autres coups.",
});

/** Lire un rythme écrit en mots : combien de coups longs ou courts. Chaque ligne est un rythme différent. */
const RYT_LECTURE: Pool = {
  items: [
    lecture("lecture-1", "long, court, court", "courts", "Deux", "2"),
    lecture("lecture-2", "court, long, court, court", "courts", "Trois", "3"),
    lecture("lecture-3", "long, court, long, court", "longs", "Deux", "2"),
    lecture("lecture-4", "court, court, court, long", "longs", "Un", "1"),
    lecture("lecture-5", "long, long, court, long", "longs", "Trois", "3"),
    lecture("lecture-6", "court, court, long, court, court", "courts", "Quatre", "4"),
  ],
};

const RYT_QCM = questionRows("ar-cm1-rythmes", [RYT_MOTS, RYT_LECTURE]);
const RYT_ECRIRE = writeRows("ar-cm1-rythmes", [RYT_MOTS, RYT_LECTURE]);

export const makeCm1RytQcm: Make = (ctx) => ce2Question(ctx, "cm1-ryt-qcm", "les mots du rythme et la lecture d'un rythme écrit", RYT_QCM, 1);
export const makeCm1RytEcrire: Make = (ctx) => ce2Write(ctx, "cm1-ryt-ecrire", "écrire un mot du rythme ou le nombre de coups d'un rythme écrit", RYT_ECRIRE, 1, 2);
