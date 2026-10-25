/**
 * LES GABARITS DES ARTS PLASTIQUES DU CM1 : le dessin de mémoire (`ar-cm1-memoire`) et les frises et motifs (`ar-cm1-motifs`).
 *
 * Ces deux fiches gardent leurs jeux de dessin (`pixel-memoire`, `pixel-copie`, `frise-*`) : les gabarits ne prennent que les places qui
 * restent (trois sur dix à chacune) et posent les mots et les gestes de la fiche. Chaque réponse se lit dans un tableau fermé, écrit à la
 * main, qui ne dit que ce que la fiche dit : observer, retenir, redessiner de mémoire et comparer ; répéter, alterner, symétriser un motif ;
 * la frise, le motif, la symétrie ; les objets décorés (pagne, calebasse, poterie). Aucune consigne n'attend un dessin : tout se répond sur l'écran.
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, son indice). Les mauvais choix d'un fait sont les
 * réponses des autres faits de son lot et ses intrus.
 *
 * HORS FICHE, À FAIRE RELIRE : l'ordre des cinq gestes du dessin de mémoire, les étapes de la reproduction, ce que le pagne, la calebasse et
 * la poterie sont faits (tissu, fruit séché gravé, argile cuite), les suites de formes à répéter ou à alterner.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Link, ce2Order, ce2Question, ce2Sort, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, link, order, questionRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ---------------------------------------------------------------------------
// Le dessin de mémoire
// ---------------------------------------------------------------------------

const MEM_MOTS: Pool = {
  items: [
    {
      id: "dessin-memoire",
      q: ["Comment appelle-t-on le dessin fait de tête, sans rien regarder ?", "Quel nom porte un dessin refait en se souvenant de l'image vue ?"],
      a: "Dessin de mémoire",
      noWrite: true,
      hint: "On a gardé l'image dans sa tête.",
    },
    {
      id: "reproduction",
      q: ["Comment appelle-t-on un dessin qui copie un modèle que l'on a sous les yeux ?", "Quel nom porte un dessin fait en copiant un modèle posé devant soi ?"],
      a: "Reproduction",
      noWrite: true,
      hint: "Le résultat doit ressembler à l'original.",
    },
    {
      id: "modele",
      q: ["Comment appelle-t-on ce que l'on regarde pour le dessiner ?", "Quel mot désigne une image ou un objet à reproduire ?"],
      a: "Modèle",
      noWrite: true,
      hint: "Il reste posé devant les yeux du dessinateur.",
    },
  ],
  extras: ["Esquisse", "Coloriage"],
};

const MEM_VERBES: Pool = {
  items: [
    {
      id: "observer",
      q: ["Que fait-on d'abord pour dessiner de mémoire ?", "Que fait-on avec ses yeux avant de cacher le modèle ?"],
      a: "Observer le modèle",
      noWrite: true,
      hint: "Les yeux travaillent avant la main.",
    },
    {
      id: "retenir",
      q: ["Que fait-on pour garder le modèle dans sa tête ?", "Que fait-on pour se souvenir des formes et des couleurs ?"],
      a: "Retenir ce qu'on a vu",
      noWrite: true,
      hint: "On répète les images en pensée.",
    },
    {
      id: "cacher",
      q: ["Que fait-on du modèle pour dessiner vraiment de mémoire ?", "Que fait-on du modèle juste avant de redessiner de mémoire ?"],
      a: "Cacher le modèle",
      // Observer le modèle et retenir ce qu'on a vu sont aussi des étapes du dessin de mémoire, et effacer un modèle tracé au tableau
      // le cache : aucun des trois n'est un mauvais choix.
      not: ["Observer le modèle", "Retenir ce qu'on a vu", "Effacer le modèle"],
      noWrite: true,
      hint: "Il ne doit plus rester sous les yeux.",
    },
    {
      id: "redessiner",
      q: ["Que fait-on une fois le modèle caché ?", "Que fait-on après avoir mis le modèle de côté ?"],
      a: "Redessiner de mémoire",
      noWrite: true,
      hint: "La main refait ce que la tête a gardé.",
    },
    {
      id: "comparer",
      q: ["Que fait-on à la fin, avec le modèle et son dessin ?", "Que fait-on pour repérer ses erreurs une fois le dessin terminé ?"],
      a: "Comparer son dessin au modèle",
      noWrite: true,
      hint: "On cherche les différences, une à une.",
    },
  ],
  extras: ["Colorier le dessin", "Effacer le modèle"],
};

const MEM_QCM = questionRows("ar-cm1-memoire", [MEM_MOTS, MEM_VERBES]);

const MEM_DE_MEMOIRE = "Range ces étapes pour dessiner de mémoire, de la première à la dernière.";
const MEM_REPRODUIRE = "Range ces étapes pour reproduire un dessin, de la première à la dernière.";
const MEM_ORDRE: readonly OrderRow[] = [
  order(MEM_DE_MEMOIRE, ["Observer le modèle", "Cacher le modèle", "Redessiner de mémoire", "Comparer avec le modèle"], "mem-ordre:a", RANK_HINTS),
  order(MEM_DE_MEMOIRE, ["Observer le modèle", "Retenir les formes", "Redessiner de mémoire"], "mem-ordre:b", RANK_HINTS),
  order(MEM_DE_MEMOIRE, ["Retenir les formes", "Cacher le modèle", "Redessiner de mémoire", "Comparer avec le modèle"], "mem-ordre:c", RANK_HINTS),
  order(MEM_DE_MEMOIRE, ["Observer le modèle", "Retenir les formes", "Cacher le modèle", "Redessiner de mémoire"], "mem-ordre:d", RANK_HINTS),
  order(MEM_DE_MEMOIRE, ["Observer le modèle", "Redessiner de mémoire", "Comparer avec le modèle"], "mem-ordre:e", RANK_HINTS),
  order(MEM_DE_MEMOIRE, ["Cacher le modèle", "Redessiner de mémoire", "Comparer avec le modèle"], "mem-ordre:f", RANK_HINTS),
  order(MEM_REPRODUIRE, ["Regarder le modèle", "Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"], "mem-ordre:g", RANK_HINTS),
  order(MEM_REPRODUIRE, ["Regarder le modèle", "Tracer les grandes formes", "Colorier le dessin"], "mem-ordre:h", RANK_HINTS),
  order(MEM_REPRODUIRE, ["Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"], "mem-ordre:i", RANK_HINTS),
  order(MEM_REPRODUIRE, ["Regarder le modèle", "Ajouter les détails", "Colorier le dessin"], "mem-ordre:j", RANK_HINTS),
];

const MEM_GLISSER = sortRows(
  "Glisse chaque geste dans la bonne case.",
  ["Avec le modèle", "Sans le modèle"],
  ["Observer les formes", "Repérer les couleurs", "Compter les carreaux", "Copier les traits"],
  ["Redessiner de mémoire", "Se souvenir des couleurs", "Retrouver la place des formes", "Dessiner de tête"],
  SORT_HINTS,
  8,
);

export const makeCm1MemQcm: Make = (ctx) => ce2Question(ctx, "cm1-mem-qcm", "les mots et les gestes du dessin de mémoire", MEM_QCM, 1);
export const makeCm1MemOrdre: Make = (ctx) => ce2Order(ctx, "cm1-mem-ordre", "ranger les étapes du dessin de mémoire ou de la reproduction", MEM_ORDRE);
export const makeCm1MemGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-mem-glisser", "classer les gestes faits avec ou sans le modèle", MEM_GLISSER, 1);

// ---------------------------------------------------------------------------
// Les frises et les motifs
// ---------------------------------------------------------------------------

const MOT_MOTS: Pool = {
  items: [
    {
      id: "frise",
      q: ["Comment appelle-t-on une bande décorée où un motif revient plusieurs fois ?", "Quel nom donne-t-on à une longue bande de motifs qui se suivent ?"],
      a: "Frise",
      noWrite: true,
      hint: "Elle se déroule le long d'un mur ou d'un bord.",
    },
    {
      id: "motif",
      q: ["Comment appelle-t-on le petit dessin que l'on répète pour décorer ?", "Quel mot désigne le dessin qui revient dans une bande décorée ?"],
      a: "Motif",
      noWrite: true,
      hint: "Rond, losange ou triangle, il sert de brique.",
    },
    {
      id: "symetrie",
      q: ["Comment appelle-t-on un dessin pareil de chaque côté de son axe ?", "Quel mot décrit un motif identique de chaque côté d'une ligne ?"],
      a: "Symétrie",
      noWrite: true,
      hint: "Un miroir posé au milieu montrerait la même image.",
    },
  ],
  extras: ["Collage", "Aquarelle"],
};

const MOT_VERBES: Pool = {
  items: [
    {
      id: "repeter",
      q: ["Que fait-on quand on dessine le même motif plusieurs fois de suite ?", "Comment décore-t-on une frise avec un seul motif qui revient ?"],
      a: "Répéter le motif",
      noWrite: true,
      hint: "Le même dessin revient sans cesse.",
    },
    {
      id: "alterner",
      q: ["Que fait-on quand on dessine un motif, puis un autre, puis le premier de nouveau ?", "Comment décore-t-on une frise avec deux motifs qui se suivent chacun à son tour ?"],
      a: "Alterner deux motifs",
      noWrite: true,
      hint: "Les dessins se relaient à tour de rôle.",
    },
    {
      id: "symetriser",
      q: ["Que fait-on quand on dessine un motif puis son reflet de l'autre côté ?", "Comment décore-t-on une frise avec un motif et son image dans un miroir ?"],
      a: "Symétriser le motif",
      noWrite: true,
      hint: "On retourne le dessin comme dans un miroir.",
    },
  ],
  extras: ["Effacer le motif", "Colorier au hasard"],
};

const MOT_QCM = questionRows("ar-cm1-motifs", [MOT_MOTS, MOT_VERBES]);

const MOT_RELIER: readonly LinkRow[] = [
  link("Relie chaque objet à ce qui le décore.", [["Pagne", "Tissu décoré de motifs"], ["Calebasse", "Fruit séché gravé de motifs"], ["Poterie", "Argile cuite puis peinte"]]),
  link("Relie chaque mot à son sens.", [["Frise", "Bande de motifs"], ["Motif", "Dessin qui se répète"], ["Symétrie", "Pareil de chaque côté"]]),
  link("Relie chaque geste à ce qu'il fait.", [["Répéter", "Le même motif revient"], ["Alterner", "Deux motifs à tour de rôle"], ["Symétriser", "Dessiner un reflet"]]),
  link("Relie chaque mot à son sens.", [["Pagne", "Tissu décoré de motifs"], ["Frise", "Bande de motifs"], ["Répéter", "Le même motif revient"]]),
  link("Relie chaque mot à son sens.", [["Calebasse", "Fruit séché gravé de motifs"], ["Motif", "Dessin qui se répète"], ["Alterner", "Deux motifs à tour de rôle"]]),
  link("Relie chaque mot à son sens.", [["Poterie", "Argile cuite puis peinte"], ["Symétrie", "Pareil de chaque côté"], ["Alterner", "Deux motifs à tour de rôle"]]),
  link("Relie chaque mot à son sens.", [["Pagne", "Tissu décoré de motifs"], ["Motif", "Dessin qui se répète"], ["Symétriser", "Dessiner un reflet"]]),
  link("Relie chaque mot à son sens.", [["Calebasse", "Fruit séché gravé de motifs"], ["Frise", "Bande de motifs"], ["Symétrie", "Pareil de chaque côté"]]),
];

const MOT_GLISSER = sortRows(
  "Glisse chaque suite de motifs dans la bonne case.",
  ["Répéter", "Alterner"],
  ["Rond, rond, rond", "Carré, carré, carré", "Triangle, triangle, triangle", "Losange, losange, losange"],
  ["Rond, carré, rond, carré", "Triangle, losange, triangle, losange", "Carré, triangle, carré, triangle", "Losange, rond, losange, rond"],
  SORT_HINTS,
  8,
);

export const makeCm1MotQcm: Make = (ctx) => ce2Question(ctx, "cm1-mot-qcm", "les mots et les gestes des frises et des motifs", MOT_QCM, 1);
export const makeCm1MotRelier: Make = (ctx) => ce2Link(ctx, "cm1-mot-relier", "relier un objet décoré, un mot ou un geste à son sens", MOT_RELIER);
export const makeCm1MotGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-mot-glisser", "classer les suites de motifs répétées ou alternées", MOT_GLISSER, 1);
