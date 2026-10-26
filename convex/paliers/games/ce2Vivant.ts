/**
 * LES GABARITS DES SCIENCES DU VIVANT AU CE2 : le corps humain, la vie des plantes et la vie des animaux
 * (`sc-ce2-corps`, `sc-ce2-plantes`, `sc-ce2-animaux`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait des phrases fausses ou creuses dans ces thématiques : « Le squelette est composé de
 * os et de côtes », une paire « mangue ~ mangue », une pile « Plante, Fleur, Fruit » à ranger, une respiration en « échange de gaz »
 * que la fiche ne dit pas. Ici chaque réponse se lit dans une table fermée, écrite à la main, qui ne dit que ce que la fiche dit.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Le corps : le squelette (crâne, colonne vertébrale, côtes), les muscles, les cinq sens et leur organe (la vue et les yeux, l'ouïe
 *   et les oreilles, l'odorat et le nez, le goût et la langue, le toucher et la peau). Le rôle d'un os se dit en une phrase que
 *   l'enfant du CE2 connaît : le crâne protège le cerveau, les côtes protègent le cœur et les poumons, la colonne vertébrale tient le
 *   corps droit, les muscles font bouger les os.
 * - Les plantes : la graine germe avec de l'eau, de l'air et de la chaleur (et rien d'autre, la lumière n'est pas dite) ; la racine sort
 *   la première ; la fleur devient un fruit, le fruit porte les graines (le noyau de la mangue, la gousse de l'arachide, les grains
 *   de mil).
 * - Les animaux : ovipares (poule, tortue, poisson) et vivipares (chèvre, chat, homme) ; la vie de la grenouille (œuf, têtard,
 *   grenouille) et du papillon (œuf, chenille, chrysalide, papillon). Les autres animaux des tables (canard, vache, lion…) sont des
 *   exemples sûrs de la même règle.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom SEUL, avec sa majuscule, sans article (« Yeux », « Chenille »), comme l'exige `templatePictures.test.ts`
 *   qui joue chaque gabarit comme au CI. Une étiquette de plusieurs mots n'est pas jugée.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus ; une phrase à trou en a une au plus aussi.
 *   Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 * - Un gabarit qui pose plusieurs fois la même question dans un palier (`uses`) a au moins quatre fois `uses` lignes.
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
  inFactOrder,
  ordr,
  qr,
  sortRows,
  wr,
  type GapRow,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
type Hints = ReturnType<typeof hints>;
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LE CORPS HUMAIN
// ===========================================================================

/** L'ordre des faits du corps : les lignes de chaque gabarit s'y rangent, pour que deux gabarits n'aient pas le même fait dans le même quart. */
const BODY_FACTS = ["organe:Yeux", "os:crâne", "sens:nombre", "organe:Oreilles", "os:côtes", "organe:Nez", "os:colonne", "organe:Langue", "os:squelette", "organe:Peau", "os:muscles"];

type SenseName = "Vue" | "Ouïe" | "Odorat" | "Goût" | "Toucher";
const SENSE_HINTS: Record<SenseName, Hints> = {
  Vue: hints("Pense à la scène que tu observes.", "Quelle partie de ton visage reçoit la lumière ?", "Ce sont tes yeux qui travaillent."),
  Ouïe: hints("Pense à ce que tu perçois dans cette scène.", "Quelle partie de ta tête reçoit les bruits ?", "Ce sont tes oreilles qui travaillent."),
  Odorat: hints("Pense à ce que tu perçois dans cette scène.", "Quelle partie de ton visage respire l'air ?", "C'est ton nez qui travaille."),
  Goût: hints("Pense à ce que tu perçois dans cette scène.", "Quelle partie de ta bouche reconnaît les saveurs ?", "C'est ta langue qui travaille."),
  Toucher: hints("Pense à ce que tu perçois dans cette scène.", "Quelle partie de ton corps couvre tout le reste ?", "C'est ta peau qui travaille."),
};
const SENSES: readonly SenseName[] = ["Vue", "Ouïe", "Odorat", "Goût", "Toucher"];
const situation = (prompt: string, sense: SenseName, wrong: readonly [SenseName, SenseName]) => qr(prompt, sense, wrong, SENSE_HINTS[sense]);

/** Une scène de la vie, et le sens qu'elle fait travailler. */
const SENSE_SITUATION_ROWS: readonly QuestionRow[] = [
  situation("Tu entends le tam-tam d'un village voisin. Quel sens utilises-tu ?", "Ouïe", ["Odorat", "Goût"]),
  situation("Tu respires le parfum d'une mangue mûre. Quel sens utilises-tu ?", "Odorat", ["Ouïe", "Toucher"]),
  situation("Tu goûtes un morceau de citron. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]),
  situation("Tu poses ta main sur une pierre chaude. Quel sens utilises-tu ?", "Toucher", ["Ouïe", "Goût"]),
  situation("Tu regardes les étoiles dans le ciel. Quel sens utilises-tu ?", "Vue", ["Goût", "Odorat"]),
  situation("Tu écoutes la voix de ta maîtresse. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]),
  situation("Tu respires le parfum d'une fleur. Quel sens utilises-tu ?", "Odorat", ["Ouïe", "Goût"]),
  situation("Tu mords dans une mangue sucrée. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]),
  situation("Tu caresses le pelage doux d'un chat. Quel sens utilises-tu ?", "Toucher", ["Ouïe", "Goût"]),
  situation("Tu lis un livre sous l'arbre. Quel sens utilises-tu ?", "Vue", ["Odorat", "Goût"]),
  situation("Tu entends le coq chanter le matin. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]),
  situation("Tu respires l'odeur du poisson grillé. Quel sens utilises-tu ?", "Odorat", ["Ouïe", "Toucher"]),
  situation("Tu goûtes une cuillère de sucre. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]),
  situation("Tu plonges ta main dans l'eau fraîche du puits. Quel sens utilises-tu ?", "Toucher", ["Odorat", "Goût"]),
  situation("Tu admires les couleurs d'un boubou. Quel sens utilises-tu ?", "Vue", ["Goût", "Odorat"]),
  situation("Tu entends la cloche de l'école. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]),
];

const ORGAN_OF: Record<SenseName, string> = { Vue: "Yeux", Ouïe: "Oreilles", Odorat: "Nez", Goût: "Langue", Toucher: "Peau" };
const ORGANS = SENSES.map((sense) => ORGAN_OF[sense]);
const ORGAN_HINTS: Record<string, Hints> = {
  Yeux: hints("Pense à ce que ce sens te permet de faire.", "Il y en a deux, dans le visage.", "On les ferme pour dormir."),
  Oreilles: hints("Pense à ce que ce sens te permet de faire.", "Il y en a une de chaque côté de la tête.", "Elles captent les bruits et la musique."),
  Nez: hints("Pense à ce que ce sens te permet de faire.", "Il est au milieu du visage.", "Il respire l'air et les parfums."),
  Langue: hints("Pense à ce que ce sens te permet de faire.", "Elle se trouve dans la bouche.", "Elle reconnaît le sucré, le salé et l'acide."),
  Peau: hints("Pense à ce que ce sens te permet de faire.", "Elle couvre tout ton corps.", "Elle sent le chaud, le froid et le doux."),
};
const organRow = (prompt: string, organ: string, shift: number): QuestionRow => {
  const others = ORGANS.filter((name) => name !== organ);
  return qr(prompt, organ, [others[shift % 4], others[(shift + 2) % 4]], ORGAN_HINTS[organ], `organe:${organ}`);
};
/** Quel organe pour quel sens : deux façons de demander chacun. */
const ORGAN_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    organRow("Avec quel organe voit-on ?", "Yeux", 0),
    organRow("Quel organe nous permet d'entendre ?", "Oreilles", 1),
    organRow("Quel organe nous permet de reconnaître les odeurs ?", "Nez", 2),
    organRow("Quel organe nous permet de goûter ?", "Langue", 3),
    organRow("Quel organe est celui du toucher ?", "Peau", 0),
    organRow("Quel est l'organe de la vue ?", "Yeux", 1),
    organRow("Quel organe sert à l'ouïe ?", "Oreilles", 2),
    organRow("Quel organe sert à l'odorat ?", "Nez", 3),
    organRow("Quel est l'organe du goût ?", "Langue", 0),
    organRow("Avec quel organe sent-on le chaud et le froid ?", "Peau", 1),
  organRow("Avec quel organe écoute-t-on la musique ?", "Oreilles", 2),
  organRow("Quel organe nous permet de sentir qu'un objet est rugueux ?", "Peau", 3),
  ],
  BODY_FACTS,
);

const SENSE_LINK_HINTS = hints("Pense à ce que chaque organe te permet de faire.", "Associe chaque partie du corps à ce qu'elle capte.", "Un seul sens va avec chaque organe.");
/** Trois organes sur cinq à relier à leur sens : toutes les combinaisons. */
const SENSE_LINK_ROWS: readonly LinkRow[] = combinations(SENSES, 3).slice(0, 8).map((senses) => ({
  prompt: "Relie chaque organe au sens qu'il permet.",
  pairs: senses.map((sense) => ({ left: ORGAN_OF[sense], right: sense })),
  hints: SENSE_LINK_HINTS,
}));

const BONE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Quelle partie du squelette protège le cerveau ?", "Crâne", ["Côtes", "Colonne vertébrale"], hints("Le cerveau est dans la tête.", "Cet os forme une sorte de boîte autour de lui.", "C'est l'os le plus haut du squelette."), "os:crâne"),
    qr("Quelle partie du squelette protège le cœur et les poumons ?", "Côtes", ["Crâne", "Colonne vertébrale"], hints("Ces organes sont dans la poitrine.", "Ces os forment une cage autour d'eux.", "Ils sont courbés comme des arcs."), "os:côtes"),
    qr("Quelle partie du squelette tient le corps droit ?", "Colonne vertébrale", ["Crâne", "Côtes"], hints("Elle est dans le dos.", "Elle est faite de petits os empilés.", "Elle part du cou et descend jusqu'en bas."), "os:colonne"),
    qr("Que protège le crâne ?", "Cerveau", ["Cœur", "Estomac"], hints("Pense à ce qui se trouve dans la tête.", "Cet organe commande tout le corps.", "On s'en sert pour penser."), "os:crâne"),
    qr("Que protègent les côtes ?", "Cœur et poumons", ["Cerveau et yeux", "Dents et langue"], hints("Pense à la poitrine.", "Ces organes battent et respirent.", "Une cage d'os les entoure."), "os:côtes"),
    qr("De quoi le squelette est-il fait ?", "Os", ["Muscles", "Peau"], hints("Pense à ce qui est dur dans ton corps.", "Cela tient ton corps debout.", "Les chiens les rongent."), "os:squelette"),
    qr("Que font les muscles ?", "Ils font bouger les os", ["Ils protègent le cerveau", "Ils goûtent les aliments"], hints("Pense à ce qui se passe quand tu cours.", "Ils se contractent puis se relâchent.", "Ils tirent sur le squelette."), "os:muscles"),
    qr("Quelle partie du corps fait bouger les os ?", "Muscles", ["Peau", "Cheveux"], hints("Pense à ce qui gonfle quand tu serres le poing.", "Ils tirent sur les os.", "Les sportifs les entraînent."), "os:muscles"),
    qr("Comment appelle-t-on l'ensemble des os du corps ?", "Squelette", ["Cerveau", "Peau"], hints("Pense à ce qui tient ton corps debout.", "C'est un mot de neuf lettres.", "Il commence par la lettre s."), "os:squelette"),
  qr("Quelle partie du squelette se trouve dans la tête ?", "Crâne", ["Côtes", "Colonne vertébrale"], hints("Pense à la forme d'une boîte arrondie.", "Elle protège ce qui nous fait penser.", "On la touche quand on se tient le front."), "os:crâne"),
  qr("Quand tu cours, quelles parties du corps travaillent beaucoup ?", "Les muscles des jambes", ["Les yeux", "Les oreilles"], hints("Pense à ce qui te fait avancer.", "Ces parties sont en bas du corps.", "Elles tirent sur les os des cuisses.")),
    qr("Quand tu portes un seau d'eau, quelles parties du corps travaillent ?", "Les muscles des bras", ["Les oreilles", "Le nez"], hints("Pense à ce qui tient le seau.", "Ces parties sont en haut du corps.", "Elles se plient au niveau du coude.")),
  ],
  BODY_FACTS,
);

const BONE_LINK_POOL = [
  { left: "Crâne", right: "Il protège le cerveau" },
  { left: "Côtes", right: "Elles protègent le cœur" },
  { left: "Colonne vertébrale", right: "Elle tient le corps droit" },
  { left: "Muscles", right: "Ils font bouger les os" },
] as const;
const BONE_LINK_ROWS: readonly LinkRow[] = combinations(BONE_LINK_POOL, 3).map((pairs) => ({
  prompt: "Relie chaque partie du corps à son rôle.",
  pairs,
  hints: hints("Pense à ce que chaque partie fait pour toi.", "Lis les rôles un par un.", "Un seul rôle va avec chaque partie."),
}));

const SKELETON_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque étiquette dans la bonne case.",
  ["Squelette", "Organe d'un sens"],
  ["Crâne", "Côtes", "Colonne vertébrale"],
  ORGANS,
  hints("Certaines étiquettes sont des os.", "Les autres servent à voir, entendre, sentir ou goûter.", "Les os sont durs et tiennent le corps."),
  20,
);

const SENSE_ACTIONS: Record<SenseName, readonly string[]> = {
  Vue: ["Regarder le ciel", "Lire un livre", "Voir un arc-en-ciel"],
  Ouïe: ["Écouter une chanson", "Entendre le tonnerre", "Entendre un tam-tam"],
  Odorat: ["Respirer un parfum", "Sentir la fumée", "Humer un repas qui cuit"],
  Goût: ["Manger du sucre", "Goûter un citron", "Croquer une mangue"],
  Toucher: ["Caresser un chat", "Toucher une pierre chaude", "Tenir un glaçon"],
};
const SENSE_PAIRS = combinations(SENSES, 2);
/** Deux scènes de chacun de deux sens, à glisser sous le bon sens : dix paires de sens, deux tirages chacune. */
const SENSE_SORT_ROWS: readonly SortRow[] = [0, 1].flatMap((variant) =>
  SENSE_PAIRS.map(([a, b], i): SortRow => ({
    prompt: "Glisse chaque scène sous le sens qu'elle fait travailler.",
    zones: [a, b],
    items: [
      ...[SENSE_ACTIONS[a][(i + variant) % 3], SENSE_ACTIONS[a][(i + variant + 1) % 3]].map((text) => ({ text, zone: a })),
      ...[SENSE_ACTIONS[b][(i + 2 * variant) % 3], SENSE_ACTIONS[b][(i + 2 * variant + 1) % 3]].map((text) => ({ text, zone: b })),
    ],
    hints: hints("Imagine ce que ton corps fait dans chaque scène.", "Demande-toi quel organe travaille.", "Chaque scène va dans une seule case."),
  })),
);

const BODY_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Le crâne protège le ___.", "cerveau", ["cœur", "estomac"], hints("Pense à ce qui se trouve dans la tête.", "Cet organe commande tout le corps.", "On s'en sert pour penser."), "os:crâne"),
    gr("Les côtes protègent le cœur et les ___.", "poumons", ["oreilles", "mains"], hints("Pense à ce qui se gonfle quand tu respires.", "Ils sont dans la poitrine.", "Ils ressemblent à deux grands sacs."), "os:côtes"),
    gr("La colonne vertébrale est au milieu du ___.", "dos", ["ventre", "bras"], hints("Pense à la partie du corps que tu ne vois pas.", "Elle est derrière toi.", "Tu t'appuies dessus sur une chaise."), "os:colonne"),
    gr("Les ___ font bouger les os.", "muscles", ["dents", "cheveux"], hints("Pense à ce qui gonfle quand tu serres le poing.", "Ils tirent sur le squelette.", "Les sportifs les entraînent."), "os:muscles"),
    gr("Nous avons ___ sens.", "cinq", ["trois", "dix"], hints("Compte la vue, l'ouïe, l'odorat, le goût et le toucher.", "C'est le nombre de doigts d'une main.", "C'est plus que trois et moins que dix."), "sens:nombre"),
    gr("On voit avec les ___.", "yeux", ["oreilles", "mains"], hints("Pense à l'organe de la vue.", "Il y en a deux, dans le visage.", "On les ferme pour dormir."), "organe:Yeux"),
    gr("On entend avec les ___.", "oreilles", ["yeux", "pieds"], hints("Pense à l'organe de l'ouïe.", "Il y en a une de chaque côté de la tête.", "Elles captent les bruits."), "organe:Oreilles"),
    gr("On reconnaît les odeurs avec le ___.", "nez", ["doigt", "genou"], hints("Pense à l'organe de l'odorat.", "Il est au milieu du visage.", "Il respire l'air et les parfums."), "organe:Nez"),
    gr("On goûte les aliments avec la ___.", "langue", ["main", "oreille"], hints("Pense à l'organe du goût.", "Elle se trouve dans la bouche.", "Elle reconnaît le sucré et le salé."), "organe:Langue"),
    gr("La peau est l'organe du ___.", "toucher", ["goût", "bruit"], hints("Pense à ce que tu sens au bout des doigts.", "Elle couvre tout ton corps.", "Elle sent le chaud et le froid."), "organe:Peau"),
    gr("Pour courir, on se sert des ___ de nos jambes.", "muscles", ["dents", "yeux"], hints("Pense à ce qui gonfle sous la peau.", "Ils tirent sur les os.", "Les sportifs les entraînent."), "os:muscles"),
    gr("Le squelette est fait d'os qui tiennent le corps ___.", "debout", ["couché", "plié"], hints("Pense à la position pour marcher.", "Sans os, tu serais mou comme une chaussette.", "Tu ne tombes pas parce qu'ils te soutiennent."), "os:squelette"),
  ],
  BODY_FACTS,
);

const BODY_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Combien de sens avons-nous ? Écris le nombre.", ["5", "cinq"], hints("Compte la vue, l'ouïe, l'odorat, le goût et le toucher.", "C'est le nombre de doigts d'une main.", "Il y en a un de moins que six."), "sens:nombre"),
    wr("Avec quel organe entend-on ? Écris le mot.", ["oreilles", "les oreilles", "oreille"], hints("Pense à l'organe de l'ouïe.", "Il y en a une de chaque côté de la tête.", "Elles captent les bruits."), "organe:Oreilles"),
    wr("Quel organe nous permet de voir ? Écris le mot.", ["yeux", "les yeux", "œil"], hints("Pense à l'organe de la vue.", "Il y en a deux, dans le visage.", "On les ferme pour dormir."), "organe:Yeux"),
    wr("Quelle partie du squelette protège le cerveau ? Écris le mot.", ["crâne", "crane", "le crâne"], hints("Le cerveau est dans la tête.", "Cet os forme une sorte de boîte autour de lui.", "C'est l'os le plus haut du squelette."), "os:crâne"),
    wr("Quelle partie du squelette protège le cœur et les poumons ? Écris le mot.", ["côtes", "cotes", "les côtes"], hints("Ces organes sont dans la poitrine.", "Ces os forment une cage autour d'eux.", "Ils sont courbés comme des arcs."), "os:côtes"),
    wr("Avec quoi goûte-t-on les aliments ? Écris le mot.", ["langue", "la langue"], hints("Pense à l'organe du goût.", "Elle se trouve dans la bouche.", "Elle reconnaît le sucré et le salé."), "organe:Langue"),
    wr("Quel organe nous permet de reconnaître les odeurs ? Écris le mot.", ["nez", "le nez"], hints("Pense à l'organe de l'odorat.", "Il est au milieu du visage.", "Il respire l'air et les parfums."), "organe:Nez"),
    wr("Quelles parties du corps font bouger les os ? Écris le mot.", ["muscles", "les muscles", "muscle"], hints("Pense à ce qui gonfle quand tu serres le poing.", "Ils tirent sur le squelette.", "Les sportifs les entraînent."), "os:muscles"),
  ],
  BODY_FACTS,
);

export function makeCe2SenseSituation(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-sens-situation", "reconnaître le sens que fait travailler une scène", SENSE_SITUATION_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2OrganChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-organe-qcm", "l'organe de chaque sens", ORGAN_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 0);
}
export function makeCe2SenseLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-sens-relier", "relier un organe à son sens", SENSE_LINK_ROWS, 1, 0);
}
export function makeCe2BoneChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-os-qcm", "le rôle du crâne, des côtes, de la colonne vertébrale et des muscles", BONE_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2BoneLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-os-relier", "relier une partie du corps à son rôle", BONE_LINK_ROWS, 1, 0);
}
export function makeCe2SkeletonSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-squelette-glisser", "ranger les os et les organes des sens", SKELETON_SORT_ROWS, 1, 0);
}
export function makeCe2SenseSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-scene-glisser", "ranger des scènes selon le sens qu'elles font travailler", SENSE_SORT_ROWS, 1, 0);
}
export function makeCe2BodyGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-corps-trou", "compléter une phrase sur le squelette, les muscles ou les sens", BODY_GAP_ROWS, 2, 3);
}
export function makeCe2BodyWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-corps-ecrire", "écrire le nom d'un organe, d'un os ou le nombre de sens", BODY_WRITE_ROWS, 1, 1);
}

// ===========================================================================
// LA VIE DES PLANTES
// ===========================================================================

const PLANT_FACTS = ["germe:Eau", "plante:fleur", "plante:mangue", "germe:Chaleur", "plante:racine", "plante:arachide", "germe:Air", "plante:fruit", "plante:mil", "germe:nombre", "plante:graine", "plante:germination", "plante:cycle", "plante:parties"];

const NEEDS = ["Eau", "Chaleur", "Air"] as const;
const NOT_NEEDS = ["Sel", "Sucre", "Savon", "Huile"] as const;
const needRow = (prompt: string, answer: (typeof NEEDS)[number], wrongAt: number): QuestionRow =>
  qr(prompt, answer, [NOT_NEEDS[wrongAt % 4], NOT_NEEDS[(wrongAt + 1) % 4]], hints("Pense à ce que tu donnes à une graine semée.", "C'est l'une des trois choses qu'il lui faut pour germer.", "Les autres choix ne servent à rien pour une graine."), `germe:${answer}`);

const PLANT_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    needRow("Qu'est-ce qui aide une graine à germer ?", "Eau", 0),
    needRow("De quoi une graine a-t-elle besoin pour germer ?", "Chaleur", 1),
    needRow("Qu'est-ce qui aide une graine à germer ?", "Air", 2),
    needRow("De quoi une graine a-t-elle besoin pour germer ?", "Eau", 3),
    qr("Que devient la fleur d'une plante ?", "Fruit", ["Racine", "Feuille"], hints("Pense à ce qui vient après la fleur.", "On le mange souvent, comme la mangue.", "Il porte des graines."), "plante:fleur"),
    qr("Que porte le fruit ?", "Graines", ["Racines", "Plumes"], hints("Pense à ce qui permet de semer une nouvelle plante.", "On les met dans la terre.", "Elles germent avec de l'eau."), "plante:fruit"),
    qr("Que donne une graine qui germe ?", "Jeune plante", ["Fruit", "Fleur"], hints("Pense à ce qui pousse dans la terre.", "Elle est toute petite au début.", "Elle va grandir."), "plante:graine"),
    qr("Où se trouvent les graines d'une plante ?", "Dans le fruit", ["Dans les racines", "Dans la tige"], hints("Pense à ce qu'on trouve au milieu d'une mangue.", "Elles sont bien protégées.", "On les sème pour faire pousser une nouvelle plante."), "plante:fruit"),
    qr("Quelle partie sort la première de la graine qui germe ?", "La racine", ["La fleur", "Le fruit"], hints("Elle descend dans la terre.", "Elle va chercher l'eau.", "On ne la voit pas."), "plante:racine"),
    qr("Que cache une mangue en son centre ?", "Noyau", ["Racine", "Fleur"], hints("Pense à ce qu'on jette après avoir mangé la mangue.", "Il est dur.", "C'est la graine du manguier."), "plante:mangue"),
    qr("Où se trouvent les graines de l'arachide ?", "Dans une gousse", ["Dans une fleur", "Dans une feuille"], hints("Pense à ce qu'on casse avant de manger.", "Elle pousse sous la terre.", "Elle est dure et allongée."), "plante:arachide"),
    qr("Que sont les grains de mil ?", "Graines", ["Racines", "Feuilles"], hints("On les sème au début des pluies.", "On les pile pour faire de la farine.", "Chaque grain peut donner une nouvelle plante."), "plante:mil"),
    qr("Que boit la graine avant de germer ?", "Eau", ["Sel", "Sucre"], hints("Pense à ce que tu verses sur la terre semée.", "La graine gonfle avec ce liquide.", "On la boit aussi."), "germe:Eau"),
  qr("Quelle partie de la plante porte les graines ?", "Fruit", ["Racine", "Feuille"], hints("Pense à la mangue.", "Il vient après la fleur.", "On le cueille quand il est mûr."), "plante:fruit"),
  qr("Que fait la graine d'abord quand on la sème ?", "Elle boit l'eau", ["Elle donne un fruit", "Elle perd ses racines"], hints("Pense à la terre humide.", "La graine gonfle.", "Après, la racine sort."), "plante:germination"),
    qr("Que devient le fruit mûr ?", "Il libère ses graines", ["Il devient une racine", "Il redevient une fleur"], hints("Pense au mil, à l'arachide et à la mangue.", "Il s'ouvre ou se casse quand il est mûr.", "On peut ensuite les semer."), "plante:fruit"),
  ],
  PLANT_FACTS,
);

const PLANT_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    // Pas « elle fait gonfler la graine » : c'est l'eau qui la gonfle.
    gr("Eau, air et ___ font germer la graine.", "chaleur", ["glace", "nuit"], hints("Pense à ce que le soleil donne.", "C'est le contraire du froid.", "Sans elle, la graine reste endormie dans un endroit trop froid."), "germe:Chaleur"),
    gr("Sans ___, une graine ne germe pas.", "eau", ["sel", "sucre"], hints("Pense à ce que tu verses sur la terre.", "On la boit aussi.", "Elle tombe pendant la saison des pluies."), "germe:Eau"),
    gr("Sans ___, une graine ne germe pas.", "air", ["sel", "huile"], hints("Pense à ce que tu respires.", "On ne le voit pas.", "Il est tout autour de nous."), "germe:Air"),
    gr("De la fleur naît le ___.", "fruit", ["tronc", "caillou"], hints("Pense à la mangue ou à l'arachide.", "On le cueille quand il est mûr.", "Il porte les graines."), "plante:fleur"),
    gr("Le fruit porte les ___.", "graines", ["racines", "écorces"], hints("Pense à ce qu'on sème dans la terre.", "Chacune peut donner une nouvelle plante.", "Le mil en donne beaucoup."), "plante:fruit"),
    gr("Une graine qui germe devient une jeune ___.", "plante", ["pierre", "maison"], hints("Pense à ce qui pousse dans la terre.", "Elle a une tige et des racines.", "Elle va grandir."), "plante:graine"),
    gr("La première partie qui sort de la graine est la ___.", "racine", ["fleur", "feuille"], hints("Elle descend dans la terre.", "Elle va chercher l'eau.", "On ne la voit pas."), "plante:racine"),
    gr("La mangue a un gros ___ en son centre.", "noyau", ["sable", "papier"], hints("Pense à ce qu'on jette après la mangue.", "Il est dur.", "C'est la graine du manguier."), "plante:mangue"),
    gr("L'arachide pousse dans une ___.", "gousse", ["fleur", "feuille"], hints("Pense à ce qu'on casse avant de manger.", "Elle pousse sous la terre.", "Elle est dure et allongée."), "plante:arachide"),
    gr("Une graine bien arrosée finit par ___.", "germer", ["fondre", "voler"], hints("Pense à ce qui se passe dans la terre humide.", "Le verbe commence par la lettre g.", "Une petite racine apparaît."), "plante:germination"),
  gr("La racine descend dans la ___.", "terre", ["lune", "mer"], hints("Pense à l'endroit où la graine est semée.", "Elle va chercher l'eau.", "On ne la voit pas."), "plante:racine"),
  gr("Le mil donne de petits ___.", "grains", ["noyaux", "oignons"], hints("On les pile pour faire de la farine.", "Ce sont des graines.", "Un épi en porte beaucoup."), "plante:mil"),
  ],
  PLANT_FACTS,
);

const PLANT_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Eau, air et ___ font germer la graine. Écris le mot.", ["chaleur", "la chaleur"], hints("Pense à ce que le soleil donne.", "C'est le contraire du froid.", "Sans elle, la graine reste endormie dans un endroit trop froid."), "germe:Chaleur"),
    wr("Combien de choses faut-il à une graine pour germer ? Écris le nombre.", ["3", "trois"], hints("Pense à l'eau, à l'air et à la chaleur.", "C'est un de plus que deux.", "On les compte sur les doigts d'une main."), "germe:nombre"),
    wr("Que devient la fleur de la plante ? Écris le mot.", ["fruit", "un fruit", "le fruit"], hints("Pense à la mangue.", "On le cueille quand il est mûr.", "Il porte les graines."), "plante:fleur"),
    wr("Que porte le fruit ? Écris le mot.", ["graines", "des graines", "graine"], hints("Pense à ce qu'on sème dans la terre.", "Chacune peut donner une nouvelle plante.", "Le mil en donne beaucoup."), "plante:fruit"),
    wr("Quelle partie de la mangue contient la graine ? Écris le mot.", ["noyau", "le noyau"], hints("Pense à ce qu'on jette après la mangue.", "Il est dur.", "C'est la graine du manguier."), "plante:mangue"),
    // « Coque » et « cosse » : les mots courants au Sénégal pour l'enveloppe qu'on casse, et justes.
    wr("Dans quoi se trouvent les graines de l'arachide ? Écris le mot.", ["gousse", "une gousse", "la gousse", "coque", "cosse"], hints("Pense à ce qu'on casse avant de manger.", "Elle pousse sous la terre.", "Elle est dure et allongée."), "plante:arachide"),
    wr("Quelle partie sort la première de la graine qui germe ? Écris le mot.", ["racine", "la racine"], hints("Elle descend dans la terre.", "Elle va chercher l'eau.", "On ne la voit pas."), "plante:racine"),
    wr("Comment s'appelle le moment où la graine commence à pousser ? Écris le mot.", ["germination", "la germination"], hints("Le verbe de cette étape est germer.", "Le mot se termine par ion.", "Il commence par la lettre g."), "plante:graine"),
  ],
  PLANT_FACTS,
);

const PLANT_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque mot dans la bonne case, selon ce qu'il faut à une graine pour germer.",
  ["Il lui faut", "Il ne lui faut pas"],
  NEEDS,
  NOT_NEEDS,
  hints("Pense à une graine que tu sèmes.", "Peu de choses aident une graine à germer.", "Les autres choses ne lui servent à rien."),
  16,
);

const PLANT_ORDER_ROWS: readonly OrderRow[] = inFactOrder(
  [
    ordr("Mets les étapes de la vie de la plante dans l'ordre du temps.", ["Graine", "Jeune plante", "Fleur", "Fruit"], hints("Tout commence par ce qu'on sème.", "La partie colorée vient avant ce qu'on cueille.", "La dernière étape se mange souvent."), "plante:cycle"),
    ordr("Mets ces étapes de la germination dans l'ordre du temps.", ["La graine est semée", "La graine boit l'eau", "La racine sort", "La tige pousse"], hints("Pense à ce qui se passe dans la terre.", "Le liquide arrive avant la partie qui descend.", "La partie qui monte vers le ciel vient en dernier."), "plante:germination"),
    ordr("Range ces parties de la plante dans l'ordre de la terre vers le ciel.", ["Racine", "Tige", "Fleur"], hints("Imagine une plante entière.", "Une partie est cachée sous la terre.", "La partie colorée est tout en haut."), "plante:parties"),
    ordr("Mets ces étapes dans l'ordre du temps, après la fleur.", ["Fruit", "Graines", "Jeune plante"], hints("La liste commence par ce qu'on cueille.", "On sème ensuite ce qu'il contient.", "La dernière étape est toute petite et verte."), "plante:cycle"),
  ],
  PLANT_FACTS,
);

const PLANT_LINK_ROWS: readonly LinkRow[] = [
  {
    prompt: "Relie chaque plante à ce qui porte sa graine.",
    pairs: [
      { left: "Mangue", right: "Noyau" },
      { left: "Arachide", right: "Gousse" },
      { left: "Mil", right: "Grains" },
    ],
    hints: hints("Pense à ce que tu jettes, ce que tu casses ou ce que tu piles.", "Chaque plante cache sa graine à sa façon.", "Un seul mot va avec chaque plante."),
    fact: "plante:fruit",
  },
  ...combinations(
    [
      { left: "Fleur", right: "Elle devient un fruit" },
      { left: "Fruit", right: "Il porte les graines" },
      { left: "Graine", right: "Elle germe avec de l'eau" },
      { left: "Racine", right: "Elle sort la première" },
    ],
    3,
  )
    .slice(0, 3)
    .map(
    (pairs): LinkRow => ({
      prompt: "Relie chaque partie à ce qu'elle fait.",
      pairs,
      hints: hints("Pense à ce que fait chaque partie dans la vie du végétal.", "Lis les phrases une par une.", "Une seule phrase correspond à chaque mot."),
    }),
  ),
];

export function makeCe2PlantChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-plante-qcm", "la germination, la fleur, le fruit et les graines", PLANT_ROWS, 3, (row) => `${row.prompt}|${row.answer}`, 3);
}
export function makeCe2PlantGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-plante-trou", "compléter une phrase sur la germination, le fruit et la graine", PLANT_GAP_ROWS, 2, 2);
}
export function makeCe2PlantWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-plante-ecrire", "écrire un mot sur la vie d'une plante", PLANT_WRITE_ROWS, 2, 1);
}
export function makeCe2GerminationSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-besoin-glisser", "ranger ce dont une graine a besoin pour germer", PLANT_SORT_ROWS, 1, 0);
}
export function makeCe2PlantOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-plante-ordre", "ranger les étapes de la vie d'une plante", PLANT_ORDER_ROWS, 1, 0);
}
export function makeCe2PlantLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-plante-relier", "relier une partie de la plante à ce qu'elle fait", PLANT_LINK_ROWS, 1, 1);
}

// ===========================================================================
// LA VIE DES ANIMAUX
// ===========================================================================

const ANIMAL_FACTS = ["definition:ovipare", "cycle:papillon", "animal:Poule", "cycle:grenouille", "definition:vivipare", "cycle:chenille", "animal:Tortue", "cycle:poule", "animal:Chèvre", "cycle:chrysalide", "animal:Chat", "cycle:canard", "animal:Mouton", "cycle:têtard", "animal:Canard", "cycle:tortue", "animal:ovipare", "animal:vivipare"];

/** Les ovipares : la poule, la tortue et le poisson de la fiche, et cinq exemples sûrs de la même règle. */
const OVIPARES = ["Poule", "Tortue", "Poisson", "Canard", "Pigeon", "Crocodile", "Grenouille", "Papillon", "Pintade"] as const;
/** Les vivipares : la chèvre, le chat et l'homme de la fiche, et huit exemples sûrs de la même règle. */
const VIVIPARES = ["Chèvre", "Chat", "Homme", "Vache", "Mouton", "Chien", "Âne", "Cheval", "Lion", "Éléphant", "Singe"] as const;

/**
 * Ce qu'un enfant peut écrire à « Nomme un animal ovipare » : la question est ouverte, donc tout ovipare
 * courant au Sénégal est juste (les oiseaux, les reptiles, les insectes). Pas le requin (beaucoup de
 * requins sont vivipares), ni le coq (il ne pond pas). Le pluriel d'un mot de quatre lettres ou plus
 * passe déjà comme une faute de frappe ; « oie », trop court, a le sien.
 */
const OVIPARES_WRITTEN = [
  ...OVIPARES.map((name) => name.toLowerCase()),
  "oiseau", "serpent", "lézard", "margouillat", "autruche", "caïman", "crapaud", "oie", "oies", "dinde", "perroquet", "aigle", "moineau",
  "abeille", "fourmi", "moustique", "escargot", "araignée", "criquet", "sauterelle",
];
/** Ce qu'un enfant peut écrire à « Nomme un animal vivipare » : les mammifères de la ferme, de la savane et de la mer. */
const VIVIPARES_WRITTEN = [
  ...VIVIPARES.map((name) => name.toLowerCase()),
  "lapin", "cochon", "porc", "chameau", "dromadaire", "girafe", "zèbre", "hyène", "gazelle", "antilope", "phacochère", "hippopotame",
  "rhinocéros", "buffle", "bœuf", "taureau", "brebis", "bouc", "souris", "rat", "chauve-souris", "baleine", "dauphin", "panthère",
  "léopard", "guépard", "chacal", "renard", "loup", "ours", "gorille", "chimpanzé", "humain",
];

const OVIPARE_ROWS: readonly QuestionRow[] = [
  ...OVIPARES.map((animal, i) =>
    qr(
      "Lequel de ces animaux est ovipare ?",
      animal,
      [VIVIPARES[(2 * i) % 11], VIVIPARES[(2 * i + 5) % 11]],
      hints("Un animal ovipare pond des œufs.", "Pense à celui dont les petits sortent d'une coquille.", "Les autres choix mettent leurs petits au monde."),
      `animal:${animal}`,
    ),
  ),
  ...VIVIPARES.map((animal, j) =>
    qr(
      "Lequel de ces animaux est vivipare ?",
      animal,
      [OVIPARES[(3 * j) % OVIPARES.length], OVIPARES[(3 * j + 4) % OVIPARES.length]],
      hints("Un animal vivipare met ses petits au monde.", "Pense à celui dont la mère porte son bébé dans son ventre.", "Les autres choix pondent des œufs."),
      `animal:${animal}`,
    ),
  ),
];

const ANIMAL_DEFINITION_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que veut dire ovipare ?", "Qui pond des œufs", ["Qui met ses petits au monde", "Qui vit dans l'eau"], hints("Le début du mot rappelle un œuf.", "Pense à la poule.", "Les petits sortent d'une coquille."), "definition:ovipare"),
    qr("Que veut dire vivipare ?", "Qui met ses petits au monde", ["Qui pond des œufs", "Qui vit dans l'eau"], hints("Pense à la chèvre ou au chat.", "Le bébé grandit dans le ventre de sa mère.", "Il naît déjà formé."), "definition:vivipare"),
    qr("Comment naissent les petits de la poule ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans un terrier"], hints("Pense à un animal de la cour.", "La poule pond.", "Les petits sortent d'une coquille."), "animal:Poule"),
    qr("Comment naissent les petits de la chèvre ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"], hints("Une chèvre ne pond pas.", "Elle porte ses petits avant qu'ils naissent.", "Le bébé grandit en elle."), "animal:Chèvre"),
    qr("Comment naissent les petits de la tortue ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans une poche"], hints("Pense à un animal à carapace.", "La tortue pond.", "Les petits sortent d'une coquille."), "animal:Tortue"),
    qr("Comment naissent les petits du canard ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans une poche"], hints("Pense à un oiseau de la mare.", "Le canard pond.", "Les petits sortent d'une coquille."), "animal:Canard"),
  qr("Comment naissent les petits du mouton ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"], hints("Un mouton ne pond pas.", "Sa maman le porte avant qu'il naisse.", "Le bébé grandit en elle."), "animal:Mouton"),
  qr("Comment naissent les petits du chat ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"], hints("Un chat ne pond pas.", "Sa maman les porte avant la naissance.", "Le bébé grandit en elle."), "animal:Chat"),
  ],
  ANIMAL_FACTS,
);

const ANIMAL_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque animal dans la bonne case, ovipare ou vivipare.",
  ["Ovipares", "Vivipares"],
  OVIPARES,
  VIVIPARES,
  hints("Un ovipare pond des œufs, un vivipare met son bébé au monde.", "Pense à la naissance de chaque animal.", "Le petit d'un vivipare grandit dans le ventre de sa mère."),
  32,
);

const YOUNG_POOL = [
  { left: "Poule", right: "Poussin" },
  { left: "Chèvre", right: "Chevreau" },
  { left: "Chat", right: "Chaton" },
  { left: "Chien", right: "Chiot" },
  { left: "Vache", right: "Veau" },
  { left: "Mouton", right: "Agneau" },
  { left: "Canard", right: "Caneton" },
  { left: "Cheval", right: "Poulain" },
] as const;
/** Trois couples animal et petit sur huit : seize combinaisons sur cinquante-six. */
const YOUNG_LINK_ROWS: readonly LinkRow[] = combinations(YOUNG_POOL, 3)
  .filter((_, i) => i % 7 === 0 || i % 7 === 3)
  .map((pairs) => ({
    prompt: "Relie chaque animal à son petit.",
    pairs,
    hints: hints("Chaque petit a un nom particulier.", "Le nom du petit ressemble souvent à celui de sa mère.", "Pense à la ferme et à la maison."),
  }));

const LIFE_ORDER_ROWS: readonly OrderRow[] = inFactOrder(
  [
    ordr("Mets les étapes de la vie du papillon dans l'ordre du temps.", ["Œuf", "Chenille", "Chrysalide", "Papillon"], hints("Pense à une vie qui change de forme.", "Le dernier est un animal qui vole.", "Avant l'animal qui vole, il y a une enveloppe."), "cycle:papillon"),
    ordr("Dans l'ordre du temps, range les étapes de la vie du papillon.", ["Œuf", "Chenille", "Chrysalide", "Papillon"], hints("Tout commence dans un œuf.", "La deuxième étape mange des feuilles.", "La dernière étape a des ailes."), "cycle:papillon"),
    ordr("Mets les étapes de la vie de la grenouille dans l'ordre du temps.", ["Œuf", "Têtard", "Grenouille"], hints("Le début de sa vie se passe dans l'eau.", "Le petit a une queue et pas de pattes.", "À la fin, elle saute sur la terre."), "cycle:grenouille"),
    ordr("Dans l'ordre du temps, range les étapes de la vie de la grenouille.", ["Œuf", "Têtard", "Grenouille"], hints("Tout commence dans un œuf.", "La deuxième étape nage avec sa queue.", "La dernière étape saute et coasse."), "cycle:grenouille"),
    ordr("Mets les étapes de la vie de la poule dans l'ordre du temps.", ["Œuf", "Poussin", "Poule"], hints("Pense à un animal de la cour.", "Le petit est tout jaune et duveteux.", "La mère le couve avant sa naissance."), "cycle:poule"),
    ordr("Mets les étapes de la vie de la tortue dans l'ordre du temps.", ["Œuf", "Bébé tortue", "Tortue"], hints("Pense à un animal à carapace.", "Le début de sa vie est dans une coquille.", "L'adulte est la dernière étape."), "cycle:tortue"),
  ordr("Dans l'ordre du temps, range les étapes de la vie de la poule.", ["Œuf", "Poussin", "Poule"], hints("Tout commence dans une coquille.", "Le petit est tout jaune.", "L'adulte pond à son tour."), "cycle:poule"),
  ordr("Mets les étapes de la vie du canard dans l'ordre du temps.", ["Œuf", "Caneton", "Canard"], hints("Pense à un oiseau qui nage sur la mare.", "Le petit suit sa mère en file.", "L'adulte est la dernière étape."), "cycle:canard"),
  ],
  ANIMAL_FACTS,
);

const LIFE_CHOICE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que sort de l'œuf du papillon ?", "Chenille", ["Têtard", "Poussin"], hints("Pense à un petit animal mou.", "Elle a beaucoup de pattes et mange des feuilles.", "Elle se change ensuite en chrysalide."), "cycle:chenille"),
    qr("Que devient la chenille ?", "Chrysalide", ["Têtard", "Poussin"], hints("Elle s'enferme pour se transformer.", "C'est une étape avant le papillon.", "Elle ne bouge presque plus."), "cycle:chrysalide"),
    qr("Que devient la chrysalide ?", "Papillon", ["Chenille", "Têtard"], hints("C'est la dernière étape.", "Il a des ailes colorées.", "Il vole de fleur en fleur."), "cycle:papillon"),
    qr("Que sort de l'œuf de la grenouille ?", "Têtard", ["Chenille", "Poussin"], hints("Pense à un petit animal qui nage.", "Il a une queue.", "Il respire dans l'eau."), "cycle:têtard"),
    qr("Que devient le têtard ?", "Grenouille", ["Papillon", "Poussin"], hints("Sa queue disparaît peu à peu.", "Il sort de l'eau.", "Il saute et il coasse."), "cycle:grenouille"),
    qr("Que sort de l'œuf de la poule ?", "Poussin", ["Têtard", "Chenille"], hints("Pense à un petit tout jaune.", "Il fait piou piou.", "Sa mère le couve."), "cycle:poule"),
    qr("Que sort de l'œuf de la tortue ?", "Bébé tortue", ["Têtard", "Poussin"], hints("Pense à un petit à carapace.", "Il ressemble à sa mère en plus petit.", "Il sort de sa coquille."), "cycle:tortue"),
  qr("Que sort de l'œuf du canard ?", "Caneton", ["Poussin", "Têtard"], hints("Pense à un petit oiseau de la mare.", "Il aime nager.", "Il suit sa mère en file."), "cycle:canard"),
  ],
  ANIMAL_FACTS,
);

const ANIMAL_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("La poule pond des ___.", "œufs", ["fruits", "graines"], hints("Pense à ce qu'on ramasse dans la cour.", "Les poussins en sortent.", "Ils ont une coquille."), "animal:Poule"),
    gr("La chèvre met au monde ses ___.", "petits", ["œufs", "graines"], hints("Pense au chevreau.", "Ils grandissent dans le ventre de leur mère.", "Ils boivent son lait."), "animal:Chèvre"),
    gr("Un animal qui pond des œufs est ___.", "ovipare", ["vivipare", "aquatique"], hints("Le début du mot rappelle un œuf.", "C'est le cas de la poule.", "Ce mot se termine comme vivipare."), "definition:ovipare"),
    gr("Un animal qui met ses petits au monde est ___.", "vivipare", ["ovipare", "aquatique"], hints("Le mot rappelle une vie qui naît.", "C'est le cas de la chèvre.", "Ce mot se termine comme ovipare."), "definition:vivipare"),
    gr("Avant d'être papillon, il est une ___.", "chenille", ["poule", "tortue"], hints("Pense à un petit animal qui mange des feuilles.", "Elle se change en chrysalide.", "Elle rampe sur une branche."), "cycle:chenille"),
    gr("De l'œuf de la grenouille sort un ___.", "têtard", ["poussin", "papillon"], hints("Pense à un petit animal qui nage.", "Il a une queue.", "Il devient grenouille."), "cycle:têtard"),
    gr("Le poussin sort d'un ___.", "œuf", ["fruit", "caillou"], hints("Pense à la poule.", "Il a une coquille.", "On le ramasse dans la cour."), "cycle:poule"),
    gr("Le chat est un animal ___.", "vivipare", ["ovipare", "aquatique"], hints("Pense à la naissance des chatons.", "La mère les porte avant leur naissance.", "Il ne pond pas."), "animal:Chat"),
    gr("La poule, la tortue et le poisson pondent des ___.", "œufs", ["fruits", "graines"], hints("Pense à ce qui a une coquille.", "Les petits en sortent.", "Les poules en pondent chaque jour."), "animal:ovipare"),
  gr("Le mouton met au monde ses ___.", "agneaux", ["œufs", "graines"], hints("Pense au petit du mouton.", "Il tète sa mère.", "Il saute dans le pré."), "animal:Mouton"),
  gr("Le têtard devient une ___.", "grenouille", ["chenille", "poule"], hints("Sa queue disparaît peu à peu.", "Il sort de l'eau.", "Elle saute et coasse."), "cycle:grenouille"),
  gr("La tortue est un animal ___.", "ovipare", ["vivipare", "volant"], hints("Pense à la naissance des bébés tortues.", "Elle pond dans un trou.", "Ses petits sortent d'une coquille."), "animal:Tortue"),
  ],
  ANIMAL_FACTS,
);

const ANIMAL_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Un animal qui pond des œufs est ___. Écris le mot.", ["ovipare", "ovipares"], hints("Le début du mot rappelle un œuf.", "C'est le cas de la poule.", "Ce mot se termine comme vivipare."), "definition:ovipare"),
    wr("Un animal qui met ses petits au monde est ___. Écris le mot.", ["vivipare", "vivipares"], hints("Le mot rappelle une vie qui naît.", "C'est le cas de la chèvre.", "Ce mot se termine comme ovipare."), "definition:vivipare"),
    wr("Comment s'appelle le bébé de la grenouille ? Écris le mot.", ["têtard", "tetard", "le têtard"], hints("Pense à un petit animal qui nage.", "Il a une queue.", "Il devient grenouille."), "cycle:têtard"),
    wr("Quel animal sort de l'œuf du papillon ? Écris le mot.", ["chenille", "la chenille", "une chenille"], hints("Pense à un petit animal qui mange des feuilles.", "Elle se change en chrysalide.", "Elle rampe sur une branche."), "cycle:chenille"),
    wr("Nomme un animal ovipare. Écris le mot.", OVIPARES_WRITTEN, hints("Pense à un animal qui pond.", "Il y en a dans la cour de l'école ou dans la mare.", "Il a des petits qui sortent d'une coquille."), "animal:ovipare"),
    wr("Nomme un animal vivipare. Écris le mot.", VIVIPARES_WRITTEN, hints("Pense à un animal qui n'a pas de coquille.", "Son bébé grandit dans le ventre de sa mère.", "Pense à la ferme ou à la savane."), "animal:vivipare"),
    wr("Comment s'appelle le bébé de la poule ? Écris le mot.", ["poussin", "le poussin"], hints("Il est tout jaune.", "Il sort d'un œuf.", "Il fait piou piou."), "cycle:poule"),
    wr("Quelle étape vient entre la chenille et le papillon ? Écris le mot.", ["chrysalide", "la chrysalide"], hints("La chenille s'enferme pour se transformer.", "Elle ne bouge presque plus.", "Le mot commence par la lettre c."), "cycle:chrysalide"),
  ],
  ANIMAL_FACTS,
);

export function makeCe2OvipareChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-ovipare-qcm", "reconnaître un animal ovipare ou vivipare", OVIPARE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 2);
}
export function makeCe2AnimalDefinition(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-animal-definition", "ovipare, vivipare et la naissance des petits", ANIMAL_DEFINITION_ROWS, 1, (row) => row.prompt, 2);
}
export function makeCe2AnimalSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-animal-glisser", "ranger les animaux ovipares et vivipares", ANIMAL_SORT_ROWS, 1, 0);
}
export function makeCe2YoungLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-petit-relier", "relier un animal à son petit", YOUNG_LINK_ROWS, 1, 0);
}
export function makeCe2LifeOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-cycle-ordre", "ranger les étapes de la vie du papillon, de la grenouille, de la poule ou du canard", LIFE_ORDER_ROWS, 1, 0);
}
export function makeCe2LifeChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-cycle-qcm", "ce que devient un animal à l'étape suivante de sa vie", LIFE_CHOICE_ROWS, 1, (row) => row.prompt, 2);
}
export function makeCe2AnimalGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-animal-trou", "compléter une phrase sur les animaux ovipares, vivipares et leur vie", ANIMAL_GAP_ROWS, 2, 1);
}
export function makeCe2AnimalWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-animal-ecrire", "écrire un mot sur la naissance et la vie des animaux", ANIMAL_WRITE_ROWS, 2, 3);
}
