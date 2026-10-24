/**
 * LES GABARITS DES ARTS DU CM2 : les rosaces et la symétrie, observer et illustrer, les instruments à vent, chanter et accompagner, la mise
 * en scène (`ar-cm2-rosaces`, `-observer`, `-vent`, `-chanter`, `-mise-en-scene`).
 *
 * Les quatre premières fiches gardent leurs jeux de dessin et d'écoute (`pixel-symetrie`, `coloriage-magique`, `pixel-memoire`, `pixel-copie`,
 * `ecoute-*`) : les gabarits ne prennent que les places qui restent (trois, six, six et quatre sur dix) et posent les mots et les gestes de
 * la fiche. La mise en scène n'avait aucun jeu : elle a ses dix places, six gabarits. Chaque réponse se lit dans un tableau fermé, écrit
 * à la main, qui ne dit que ce que la fiche dit. Aucune consigne n'attend un dessin, un son ou un enregistrement : tout se répond sur l'écran.
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais choix d'un
 * fait sont les réponses des autres faits de son lot et ses intrus ; une réponse aussi juste (`not`) n'est jamais proposée.
 *
 * HORS FICHE, À FAIRE RELIRE : les étapes pour tracer une rosace au compas et une figure symétrique ; les images qui illustrent chaque
 * phrase, les étapes du dessin d'observation et de l'illustration ; la trompette à trois pistons, le saxophone à anche, le
 * clairon sans piston ; ce que fredonner veut dire ; le refrain ; le décor, le costume, le déguisement, le metteur en scène, le spectateur ;
 * les étapes pour préparer un spectacle.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// ROSACES ET SYMÉTRIES (ar-cm2-rosaces)
// ===========================================================================

const ROS_MOTS: Pool = {
  items: [
    {
      id: "rosace",
      q: ["Comment appelle-t-on un décor en forme de fleur, répété autour d'un centre ?", "Quel décor tourne autour d'un point central, comme les pétales de la fleur ?"],
      a: "Rosace",
      also: ["La rosace", "Une rosace"],
      not: ["Motif"],
      hint: "Ses parties se répètent autour du centre.",
    },
    {
      id: "symetrie",
      q: ["Comment appelle-t-on le fait que les deux moitiés d'une figure se ressemblent comme dans un miroir ?", "Quel mot dit qu'une figure est pareille de chaque côté de la ligne ?"],
      a: "Symétrie",
      also: ["La symétrie"],
      not: ["Axe de symétrie"],
      hint: "Un miroir posé sur la ligne ne change rien.",
    },
    {
      id: "axe",
      q: ["Comment appelle-t-on la ligne qui partage une figure en deux moitiés identiques ?", "Quelle ligne sépare une figure symétrique en deux parties pareilles ?"],
      a: "Axe de symétrie",
      also: ["L'axe de symétrie", "Axe"],
      not: ["Symétrie"],
      hint: "Elle sert de charnière pour plier la figure.",
    },
    {
      id: "motif",
      q: ["Comment appelle-t-on un petit dessin décoratif que l'on répète ?", "Quel mot désigne un dessin qui revient pour décorer ?"],
      a: "Motif",
      also: ["Un motif", "Le motif"],
      not: ["Rosace", "Décoration"],
      hint: "Il revient plusieurs fois pour orner un objet.",
    },
    {
      id: "decoration",
      q: ["Comment appelle-t-on le fait d'embellir un objet avec des motifs ?"],
      a: "Décoration",
      also: ["La décoration"],
      hint: "Un objet simple devient plus joli.",
    },
  ],
  extras: ["Palette", "Pinceau"],
};

const ROS_QCM = questionRows("ar-cm2-rosaces", [ROS_MOTS]);
const ROS_ECRIRE = writeRows("ar-cm2-rosaces", [ROS_MOTS]);

const ROS_ORDRE: readonly OrderRow[] = [
  order("Range les étapes pour tracer une rosace au compas, de la première à la dernière.", ["Tracer un cercle au compas", "Piquer sur le cercle et tracer un arc", "Recommencer tout autour du cercle", "Colorier les pétales"], "ros-ordre:compas"),
  order("Range les étapes pour tracer une rosace au compas, de la première à la dernière.", ["Tracer un cercle au compas", "Piquer sur le cercle et tracer un arc", "Recommencer tout autour du cercle"], "ros-ordre:sans-couleur"),
  order("Range les étapes pour tracer une rosace au compas, de la première à la dernière.", ["Tracer un cercle au compas", "Piquer sur le cercle et tracer un arc", "Colorier les pétales"], "ros-ordre:sans-tour"),
  order("Range les étapes pour tracer une rosace au compas, de la première à la dernière.", ["Piquer sur le cercle et tracer un arc", "Recommencer tout autour du cercle", "Colorier les pétales"], "ros-ordre:sans-cercle"),
  order("Range les étapes pour dessiner une figure symétrique, de la première à la dernière.", ["Tracer l'axe de symétrie", "Dessiner une moitié de la figure", "Dessiner l'autre moitié de l'autre côté", "Colorier les deux moitiés pareil"], "ros-ordre:symetrique"),
  order("Range les étapes pour dessiner une figure symétrique, de la première à la dernière.", ["Tracer l'axe de symétrie", "Dessiner une moitié de la figure", "Dessiner l'autre moitié de l'autre côté"], "ros-ordre:symetrique-court"),
];

export const makeCm2RosQcm: Make = (ctx) => ce2Question(ctx, "cm2-ros-qcm", "les mots des rosaces et de la symétrie", ROS_QCM, 1);
export const makeCm2RosEcrire: Make = (ctx) => ce2Write(ctx, "cm2-ros-ecrire", "écrire un mot des rosaces et de la symétrie", ROS_ECRIRE, 1, 2);
export const makeCm2RosOrdre: Make = (ctx) => ce2Order(ctx, "cm2-ros-ordre", "ranger les étapes pour tracer une rosace ou une figure symétrique", ROS_ORDRE);

// ===========================================================================
// OBSERVER ET ILLUSTRER (ar-cm2-observer)
// ===========================================================================

const OBS_MOTS: Pool = {
  items: [
    {
      id: "observation",
      q: ["Comment appelle-t-on le dessin fait en regardant bien un objet réel ?", "Quel nom porte le dessin d'un objet placé sous les yeux ?"],
      a: "Dessin d'observation",
      noWrite: true,
      ga: "le dessin d'observation",
      s: ["Le dessin fait en regardant bien un objet réel est ___.", "Quand on dessine un objet que l'on a sous les yeux, on fait ___."],
      hint: "Les yeux restent posés sur la chose à dessiner.",
    },
    {
      id: "imitation",
      q: ["Comment appelle-t-on le dessin qui copie un dessin déjà fait ?", "Quel nom porte le dessin qui reproduit un modèle déjà dessiné ?"],
      a: "Dessin d'imitation",
      noWrite: true,
      ga: "le dessin d'imitation",
      s: ["Le dessin qui copie un dessin déjà fait est ___.", "Reproduire un modèle déjà dessiné, c'est faire ___."],
      hint: "On refait ce qu'une autre main a déjà tracé.",
    },
    {
      id: "illustration",
      q: ["Comment appelle-t-on une image qui accompagne un texte pour le montrer ?", "Quel mot désigne le dessin placé dans un livre pour montrer ce que dit le texte ?"],
      a: "Illustration",
      noWrite: true,
      ga: "une illustration",
      s: ["Une image qui accompagne un texte pour le montrer est ___.", "Le dessin placé dans un livre pour montrer le texte s'appelle ___."],
      hint: "Elle aide à voir l'histoire que l'on lit.",
    },
    {
      id: "illustrateur",
      q: ["Comment appelle-t-on la personne qui dessine les images d'un livre ?", "Qui crée les dessins qui accompagnent un texte ?"],
      a: "Illustrateur",
      noWrite: true,
      ga: "un illustrateur",
      s: ["La personne qui dessine les images d'un livre est ___.", "Celui qui crée les dessins d'un livre est ___."],
      hint: "Il met des images sur les mots d'un auteur.",
    },
    {
      id: "modele",
      q: ["Comment appelle-t-on ce que l'on regarde pour le dessiner ?", "Quel mot désigne ce qu'on place devant soi pour le dessiner ?"],
      a: "Modèle",
      noWrite: true,
      ga: "un modèle",
      s: ["Ce que l'on regarde pour le dessiner est ___.", "Pour dessiner, on place devant soi ___."],
      hint: "Il reste posé devant les yeux du dessinateur.",
    },
  ],
  extras: ["Palette", "Gomme"],
  gextras: ["une palette", "une gomme"],
};

/** Quelle image convient à quelle phrase : chaque réponse est la scène que la phrase décrit, les mauvais choix sont les scènes des autres phrases. */
const OBS_IMAGE: Pool = {
  items: [
    {
      id: "peche",
      q: ["Quelle image illustre le mieux le passage « Le pêcheur jette son filet à la mer » ?", "Quel dessin convient au texte « Le pêcheur jette son filet à la mer » ?"],
      a: "Un pêcheur qui lance son filet",
      noWrite: true,
      hint: "On y voit un homme et son outil au bord de l'eau.",
    },
    {
      id: "vendeuse",
      q: ["Quelle image illustre le mieux le passage « La vendeuse range ses mangues sur l'étal » ?", "Quel dessin convient au texte « La vendeuse range ses mangues sur l'étal » ?"],
      a: "Une vendeuse devant ses mangues",
      noWrite: true,
      hint: "La scène se passe au marché.",
    },
    {
      id: "enfants",
      q: ["Quelle image illustre le mieux le passage « Les enfants jouent au ballon sous le baobab » ?", "Quel dessin convient au texte « Les enfants jouent au ballon sous le baobab » ?"],
      a: "Des enfants qui jouent sous un grand arbre",
      noWrite: true,
      hint: "On y voit plusieurs personnes et un jeu.",
    },
    {
      id: "griot",
      q: ["Quelle image illustre le mieux le passage « Le griot joue de la kora devant le village » ?", "Quel dessin convient au texte « Le griot joue de la kora devant le village » ?"],
      a: "Un griot avec sa kora",
      noWrite: true,
      hint: "Un artiste tient un instrument à cordes.",
    },
    {
      id: "pluie",
      q: ["Quelle image illustre le mieux le passage « La pluie tombe sur les champs » ?", "Quel dessin convient au texte « La pluie tombe sur les champs » ?"],
      a: "Des champs sous la pluie",
      noWrite: true,
      hint: "Le ciel est chargé et la terre se mouille.",
    },
  ],
};

const OBS_QCM = questionRows("ar-cm2-observer", [OBS_MOTS, OBS_IMAGE]);
const OBS_TROU = gapRows("ar-cm2-observer", [OBS_MOTS]);

const OBS_ORDRE: readonly OrderRow[] = [
  order("Range les étapes pour dessiner un objet réel, de la première à la dernière.", ["Observer le modèle", "Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"], "obs-ordre:observation"),
  order("Range les étapes pour dessiner un objet réel, de la première à la dernière.", ["Observer le modèle", "Tracer les grandes formes", "Ajouter les détails"], "obs-ordre:sans-couleur"),
  order("Range les étapes pour dessiner un objet réel, de la première à la dernière.", ["Observer le modèle", "Tracer les grandes formes", "Colorier le dessin"], "obs-ordre:sans-details"),
  order("Range les étapes pour dessiner un objet réel, de la première à la dernière.", ["Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"], "obs-ordre:sans-observer"),
  order("Range les étapes pour illustrer un texte, de la première à la dernière.", ["Lire le texte", "Choisir le passage", "Dessiner la scène", "Colorier l'image"], "obs-ordre:illustrer"),
  order("Range les étapes pour illustrer un texte, de la première à la dernière.", ["Lire le texte", "Dessiner la scène", "Colorier l'image"], "obs-ordre:illustrer-court"),
];

const OBS_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Dessin d'observation", "Regarder un objet réel"], ["Dessin d'imitation", "Copier un dessin"], ["Illustration", "Image d'un texte"], ["Illustrateur", "Dessine les images d'un livre"]]),
  link("Relie chaque mot à son sens.", [["Dessin d'observation", "Regarder un objet réel"], ["Dessin d'imitation", "Copier un dessin"], ["Illustration", "Image d'un texte"]]),
  link("Relie chaque mot à son sens.", [["Dessin d'imitation", "Copier un dessin"], ["Illustration", "Image d'un texte"], ["Illustrateur", "Dessine les images d'un livre"]]),
  link("Relie chaque mot à son sens.", [["Dessin d'observation", "Regarder un objet réel"], ["Illustration", "Image d'un texte"], ["Illustrateur", "Dessine les images d'un livre"]]),
  link("Relie chaque mot à son sens.", [["Modèle", "Ce qu'on regarde pour dessiner"], ["Illustration", "Image d'un texte"], ["Illustrateur", "Dessine les images d'un livre"]]),
  link("Relie chaque mot à son sens.", [["Modèle", "Ce qu'on regarde pour dessiner"], ["Dessin d'observation", "Regarder un objet réel"], ["Dessin d'imitation", "Copier un dessin"]]),
];

const OBS_GLISSER = sortRows(
  "Glisse chaque dessin dans la bonne case.",
  ["D'après un modèle réel", "D'après son imagination"],
  ["Dessiner le baobab de la cour", "Dessiner son cartable sur la table", "Dessiner une mangue devant soi", "Dessiner son voisin de classe"],
  ["Dessiner un animal qui vole et parle", "Dessiner la maison de ses rêves", "Dessiner une ville sur la lune", "Dessiner un dragon gentil"],
  SORT_HINTS,
  8,
);

export const makeCm2ObsQcm: Make = (ctx) => ce2Question(ctx, "cm2-obs-qcm", "les mots du dessin d'observation et de l'illustration, et l'image qui convient à une phrase", OBS_QCM, 2);
export const makeCm2ObsTrou: Make = (ctx) => ce2Gap(ctx, "cm2-obs-trou", "compléter une phrase sur le dessin d'observation et l'illustration", OBS_TROU, 1, 1);
export const makeCm2ObsOrdre: Make = (ctx) => ce2Order(ctx, "cm2-obs-ordre", "ranger les étapes d'un dessin d'observation ou d'une illustration", OBS_ORDRE);
export const makeCm2ObsRelier: Make = (ctx) => ce2Link(ctx, "cm2-obs-relier", "relier un mot du dessin d'observation ou de l'illustration à son sens", OBS_RELIER);
export const makeCm2ObsGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-obs-glisser", "classer les dessins faits d'après un modèle ou d'après l'imagination", OBS_GLISSER, 1);

// ===========================================================================
// LES INSTRUMENTS À VENT (ar-cm2-vent)
// ===========================================================================

const VEN_INSTRUMENT: Pool = {
  items: [
    {
      id: "flute",
      q: ["Quel instrument à vent traditionnel est joué par les bergers peuls ?", "Quel instrument à vent de la tradition peule se joue en soufflant dans un tuyau ?"],
      a: "Flûte peule",
      also: ["Flûte", "La flûte peule", "Flute peule"],
      ga: "la flûte peule",
      s: ["Le berger peul joue de ___.", "Un instrument à vent de la tradition peule est ___."],
      hint: "Un tuyau percé de trous que l'on fait chanter.",
    },
    {
      id: "trompette",
      q: ["Quel instrument à vent en cuivre se joue avec trois pistons ?", "Quel instrument à vent en cuivre a trois pistons et un son brillant ?"],
      a: "Trompette",
      also: ["La trompette"],
      not: ["Clairon", "Saxophone"],
      ga: "la trompette",
      s: ["Un instrument à vent en cuivre à trois pistons est ___.", "Pour jouer avec trois pistons, on prend ___."],
      hint: "Son pavillon brille et son son est éclatant.",
    },
    {
      id: "saxophone",
      q: ["Quel instrument à vent est très utilisé dans le jazz ?", "Quel instrument à vent à anche accompagne souvent les orchestres de jazz ?"],
      a: "Saxophone",
      also: ["Le saxophone", "Saxo"],
      not: ["Trompette"],
      ga: "le saxophone",
      s: ["Un instrument à vent à anche, joué dans le jazz, est ___.", "Dans un orchestre de jazz, on entend souvent ___."],
      hint: "Son corps recourbé fait vibrer une languette.",
    },
    {
      id: "clairon",
      q: ["Quel instrument à vent en cuivre sonne les appels militaires ?", "Quel instrument à vent simple, sans piston, sert à sonner l'appel ?"],
      a: "Clairon",
      also: ["Le clairon"],
      not: ["Trompette"],
      ga: "le clairon",
      s: ["Le soldat sonne l'appel avec ___.", "Un instrument à vent sans piston qui sonne l'appel est ___."],
      hint: "Il réveille la caserne au lever du jour.",
    },
  ],
  extras: ["Kora", "Djembé", "Balafon"],
  gextras: ["la kora", "le djembé", "le balafon"],
};

const VEN_SOUFFLE: Pool = {
  items: [
    {
      id: "souffle",
      q: ["Comment produit-on un son avec un instrument à vent ?", "Comment fait-on sonner une flûte ou une trompette ?"],
      a: "En soufflant",
      also: ["Souffler", "Avec son souffle", "En soufflant dedans"],
      ga: "en soufflant",
      s: ["On fait sonner un instrument à vent ___.", "Une flûte sonne ___."],
      hint: "Il faut de l'air et de bons poumons.",
    },
  ],
  extras: ["En frappant", "En pinçant les cordes", "En frottant"],
  gextras: ["en frappant", "en pinçant les cordes", "en frottant"],
};

const VEN_FREDONNER: Pool = {
  items: [
    {
      id: "fredonner",
      q: ["Comment appelle-t-on le fait de chanter un air la bouche fermée ?", "Que fait-on quand on chante un air sans les paroles, les lèvres closes ?"],
      a: "Fredonner",
      also: ["Fredonnement", "Le fredonnement"],
      ga: "fredonner",
      s: ["Chanter un air la bouche fermée, c'est ___.", "Pour chanter sans les paroles, on peut ___."],
      hint: "Seul un petit ronronnement sort des lèvres.",
    },
  ],
  extras: ["Crier", "Applaudir"],
  gextras: ["crier", "applaudir"],
};

const VEN_MELODIE: Pool = {
  items: [
    {
      id: "melodie",
      q: ["Comment appelle-t-on une suite de notes qui forme un air ?", "Quel mot désigne l'air de la chanson ?"],
      a: "Mélodie",
      also: ["Une mélodie", "Melodie"],
      ga: "une mélodie",
      s: ["Une suite de notes qui forme un air est ___.", "L'air de la chanson se nomme ___."],
      hint: "On la reconnaît même sans les paroles.",
    },
  ],
  extras: ["Rythme", "Refrain"],
  gextras: ["un rythme", "un refrain"],
};

const VEN_POOLS = [VEN_INSTRUMENT, VEN_SOUFFLE, VEN_FREDONNER, VEN_MELODIE] as const;
const VEN_QCM = questionRows("ar-cm2-vent", VEN_POOLS);
const VEN_TROU = gapRows("ar-cm2-vent", VEN_POOLS);
const VEN_ECRIRE = writeRows("ar-cm2-vent", VEN_POOLS);

const VEN_RELIER: readonly LinkRow[] = [
  link("Relie chaque instrument à ce qui le distingue.", [["Flûte peule", "Instrument des bergers peuls"], ["Trompette", "Trois pistons"], ["Saxophone", "Une anche qui vibre"], ["Clairon", "Appels militaires"]]),
  link("Relie chaque instrument à sa famille.", [["Kora", "Instrument à cordes"], ["Djembé", "Instrument à percussion"], ["Flûte peule", "Instrument à vent"]]),
  link("Relie chaque instrument à sa famille.", [["Trompette", "Instrument à vent"], ["Xalam", "Instrument à cordes"], ["Tama", "Instrument à percussion"]]),
  link("Relie chaque instrument à sa famille.", [["Clairon", "Instrument à vent"], ["Balafon", "Instrument à percussion"], ["Guitare", "Instrument à cordes"]]),
  link("Relie chaque mot à son sens.", [["Mélodie", "Suite de notes"], ["Fredonner", "Chanter bouche fermée"], ["Rythme", "Sons longs et courts"]]),
  link("Relie chaque instrument à ce qui le distingue.", [["Flûte peule", "Instrument des bergers peuls"], ["Saxophone", "Une anche qui vibre"], ["Clairon", "Appels militaires"]]),
];

const VEN_GLISSER = sortRows(
  "Glisse chaque instrument dans la bonne case.",
  ["Instrument à vent", "Autre instrument"],
  ["Flûte peule", "Trompette", "Saxophone", "Clairon"],
  ["Kora", "Djembé", "Balafon", "Xalam", "Tama"],
  SORT_HINTS,
  8,
);

export const makeCm2VenQcm: Make = (ctx) => ce2Question(ctx, "cm2-ven-qcm", "les instruments à vent, le souffle, le fredonnement et la mélodie", VEN_QCM, 2);
export const makeCm2VenTrou: Make = (ctx) => ce2Gap(ctx, "cm2-ven-trou", "compléter une phrase sur les instruments à vent", VEN_TROU, 1, 1);
export const makeCm2VenEcrire: Make = (ctx) => ce2Write(ctx, "cm2-ven-ecrire", "écrire le nom d'un instrument à vent ou d'un mot de la musique", VEN_ECRIRE, 1, 2);
export const makeCm2VenRelier: Make = (ctx) => ce2Link(ctx, "cm2-ven-relier", "relier un instrument ou un mot de la musique à ce qui le distingue", VEN_RELIER);
export const makeCm2VenGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-ven-glisser", "classer les instruments à vent et les autres instruments", VEN_GLISSER, 1);

// ===========================================================================
// CHANTER ET ACCOMPAGNER (ar-cm2-chanter)
// ===========================================================================

const CHA_MOTS: Pool = {
  items: [
    {
      id: "nuance",
      q: ["Comment appelle-t-on le fait de chanter plus fort ou plus doux ?", "Quel mot désigne la force du son, forte ou douce ?"],
      a: "Nuance",
      noWrite: true,
      ga: "la nuance",
      s: ["Chanter plus fort ou plus doux, c'est jouer sur ___.", "Fort ou doux, voilà ___ du chant."],
      hint: "Elle change la force avec laquelle la voix sort.",
    },
    {
      id: "rythme",
      q: ["Comment appelle-t-on la suite de sons longs et courts qui marque le pas du chant ?", "Quel mot désigne la façon dont les sons durent, longs ou courts ?"],
      a: "Rythme",
      noWrite: true,
      ga: "le rythme",
      s: ["Les sons longs et courts qui marquent le pas forment ___.", "Taper dans les mains au pas du chant, c'est suivre ___."],
      hint: "On le bat du pied ou des mains.",
    },
    {
      id: "melodie",
      q: ["Comment appelle-t-on la suite de notes qui forme un air de chant ?", "Quel mot désigne la ligne des notes que la voix chante ?"],
      a: "Mélodie",
      noWrite: true,
      ga: "la mélodie",
      s: ["La suite de notes qui forme un air de chant est ___.", "Les notes que la voix chante forment ___."],
      hint: "On peut la fredonner sans les mots.",
    },
    {
      id: "accompagnement",
      q: ["Comment appelle-t-on les instruments ou les battements qui soutiennent un chant ?", "Quel mot désigne ce qui accompagne la voix pendant un chant ?"],
      a: "Accompagnement",
      noWrite: true,
      ga: "l'accompagnement",
      s: ["Les instruments qui soutiennent un chant forment ___.", "Jouer sous la voix avec un instrument, voilà ___."],
      hint: "Il soutient la voix sans la couvrir.",
    },
    {
      id: "refrain",
      q: ["Comment appelle-t-on la partie d'un chant qui revient après chaque couplet ?"],
      a: "Refrain",
      noWrite: true,
      ga: "le refrain",
      s: ["La partie qui revient après chaque couplet est ___."],
      hint: "Tout le monde le chante en chœur.",
    },
  ],
  extras: ["Silence", "Solo"],
  gextras: ["le silence", "un solo"],
};

const CHA_QCM = questionRows("ar-cm2-chanter", [CHA_MOTS]);
const CHA_TROU = gapRows("ar-cm2-chanter", [CHA_MOTS]);

const CHA_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Nuance", "Fort ou doux"], ["Rythme", "Sons longs et courts"], ["Mélodie", "Suite de notes"], ["Accompagnement", "Soutient le chant"]]),
  link("Relie chaque mot à son sens.", [["Nuance", "Fort ou doux"], ["Rythme", "Sons longs et courts"], ["Mélodie", "Suite de notes"]]),
  link("Relie chaque mot à son sens.", [["Rythme", "Sons longs et courts"], ["Mélodie", "Suite de notes"], ["Accompagnement", "Soutient le chant"]]),
  link("Relie chaque mot à son sens.", [["Refrain", "Partie qui revient"], ["Nuance", "Fort ou doux"], ["Mélodie", "Suite de notes"]]),
  link("Relie chaque mot à son sens.", [["Refrain", "Partie qui revient"], ["Rythme", "Sons longs et courts"], ["Accompagnement", "Soutient le chant"]]),
  link("Relie chaque mot à son sens.", [["Refrain", "Partie qui revient"], ["Nuance", "Fort ou doux"], ["Rythme", "Sons longs et courts"]]),
];

const CHA_GLISSER = sortRows(
  "Glisse chaque son dans la bonne case.",
  ["Fort", "Doux"],
  ["Un coup de tonnerre", "Un tambour de fête", "Un klaxon dans la rue", "Un cri de joie"],
  ["Une berceuse pour bébé", "Un murmure à l'oreille", "Le vent dans les feuilles", "Un chuchotement en classe"],
  SORT_HINTS,
  8,
);

export const makeCm2ChaQcm: Make = (ctx) => ce2Question(ctx, "cm2-cha-qcm", "les mots du chant : la nuance, le rythme, la mélodie, l'accompagnement et le refrain", CHA_QCM, 1);
export const makeCm2ChaTrou: Make = (ctx) => ce2Gap(ctx, "cm2-cha-trou", "compléter une phrase sur le chant et son accompagnement", CHA_TROU, 1, 1);
export const makeCm2ChaRelier: Make = (ctx) => ce2Link(ctx, "cm2-cha-relier", "relier un mot du chant à son sens", CHA_RELIER);
export const makeCm2ChaGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-cha-glisser", "classer les sons forts et les sons doux", CHA_GLISSER, 1);

// ===========================================================================
// LA MISE EN SCÈNE (ar-cm2-mise-en-scene)
// ===========================================================================

const MES_MOTS: Pool = {
  items: [
    {
      id: "decor",
      q: ["Comment appelle-t-on ce qui montre le lieu de l'histoire sur la scène ?", "Quel mot désigne les éléments qui représentent l'endroit où se passe la pièce ?"],
      a: "Décor",
      also: ["Le décor", "Décors"],
      ga: "le décor",
      s: ["Ce qui montre le lieu de l'histoire sur la scène est ___.", "Sur la scène, les arbres en carton forment ___."],
      hint: "Il change quand l'histoire change d'endroit.",
    },
    {
      id: "costume",
      q: ["Comment appelle-t-on les vêtements que porte un comédien pour jouer son rôle ?", "Quel mot désigne la tenue d'un personnage sur la scène ?"],
      a: "Costume",
      also: ["Le costume"],
      not: ["Déguisement"],
      ga: "le costume",
      s: ["Les vêtements du comédien pour son rôle forment ___.", "La tenue du personnage sur la scène s'appelle ___."],
      hint: "Il aide le public à reconnaître le personnage.",
    },
    {
      id: "deguisement",
      q: ["Comment appelle-t-on le fait de se transformer avec des vêtements pour ressembler à une autre personne ?", "Quel mot désigne la transformation d'un enfant en pirate ou en roi pour jouer ?"],
      a: "Déguisement",
      also: ["Le déguisement"],
      not: ["Costume"],
      ga: "le déguisement",
      s: ["Un enfant qui se transforme en roi porte ___.", "Les vêtements de fête pour ressembler à une autre personne forment ___."],
      hint: "On le met pour s'amuser à être un autre.",
    },
    {
      id: "mise-en-scene",
      q: ["Comment appelle-t-on l'art de placer les comédiens, les décors et la lumière ?", "Quel mot désigne la façon d'organiser le spectacle sur la scène ?"],
      a: "Mise en scène",
      also: ["La mise en scène"],
      ga: "la mise en scène",
      s: ["Placer les comédiens, le décor et la lumière, c'est faire ___.", "Organiser le spectacle sur la scène, c'est faire ___."],
      hint: "Elle règle chaque déplacement avant le spectacle.",
    },
  ],
  extras: ["Spectateur", "Applaudissement"],
  gextras: ["le spectateur", "un applaudissement"],
};

const MES_PERSONNE: Pool = {
  items: [
    {
      id: "metteur",
      q: ["Qui dirige les comédiens et organise le spectacle ?", "Comment appelle-t-on la personne qui dirige tout le spectacle et les comédiens ?"],
      a: "Metteur en scène",
      also: ["Le metteur en scène"],
      ga: "le metteur en scène",
      s: ["La personne qui dirige les comédiens est ___.", "Celui qui dirige tout le spectacle est ___."],
      hint: "Il dit à chacun où se placer et comment jouer.",
    },
    {
      id: "comedien",
      q: ["Qui interprète un personnage devant le public ?", "Comment appelle-t-on la personne qui joue un rôle sur la scène ?"],
      a: "Comédien",
      also: ["Le comédien", "Comédienne", "Acteur"],
      ga: "le comédien",
      s: ["La personne qui joue un rôle sur la scène est ___.", "Celui qui interprète un personnage est ___."],
      hint: "Il apprend son texte par cœur.",
    },
    {
      id: "spectateur",
      q: ["Comment appelle-t-on une personne qui regarde le spectacle ?", "Qui s'assoit dans la salle pour voir la pièce ?"],
      a: "Spectateur",
      also: ["Le spectateur", "Spectatrice", "Public"],
      ga: "le spectateur",
      s: ["La personne qui regarde le spectacle est ___.", "Celui qui s'assoit dans la salle pour voir la pièce est ___."],
      hint: "Il applaudit à la fin de la pièce.",
    },
  ],
  extras: ["Cuisinier", "Berger"],
  gextras: ["le cuisinier", "le berger"],
};

const MES_VERBE: Pool = {
  items: [
    {
      id: "interpreter",
      q: ["Que fait un comédien qui joue un personnage devant le public ?", "Quel verbe dit que le comédien donne vie à un personnage ?"],
      a: "Interpréter",
      also: ["Jouer", "Interpréter un rôle"],
      ga: "interpréter",
      s: ["Jouer un personnage devant le public, c'est ___ un rôle.", "Le comédien va ___ son personnage."],
      hint: "Il se met dans la peau d'un autre.",
    },
  ],
  extras: ["Applaudir", "Regarder"],
  gextras: ["applaudir", "regarder"],
};

const MES_POOLS = [MES_MOTS, MES_PERSONNE, MES_VERBE] as const;
const MES_QCM = questionRows("ar-cm2-mise-en-scene", MES_POOLS);
const MES_TROU = gapRows("ar-cm2-mise-en-scene", MES_POOLS);
const MES_ECRIRE = writeRows("ar-cm2-mise-en-scene", MES_POOLS);

const MES_ORDRE: readonly OrderRow[] = [
  order("Range les étapes pour préparer un spectacle, de la première à la dernière.", ["Choisir l'histoire", "Distribuer les rôles", "Répéter la pièce", "Jouer devant le public"], "mes-ordre:spectacle"),
  order("Range les étapes pour préparer un spectacle, de la première à la dernière.", ["Distribuer les rôles", "Répéter la pièce", "Jouer devant le public"], "mes-ordre:sans-histoire"),
  order("Range les étapes pour préparer un spectacle, de la première à la dernière.", ["Choisir l'histoire", "Répéter la pièce", "Jouer devant le public"], "mes-ordre:sans-roles"),
  order("Range les étapes pour préparer un spectacle, de la première à la dernière.", ["Choisir l'histoire", "Distribuer les rôles", "Jouer devant le public"], "mes-ordre:sans-repetition"),
  order("Range les étapes pour préparer un spectacle, de la première à la dernière.", ["Choisir l'histoire", "Distribuer les rôles", "Répéter la pièce"], "mes-ordre:sans-jeu"),
  order("Range ces moments d'un spectacle, du premier au dernier.", ["Entrer en scène", "Jouer son rôle", "Saluer le public"], "mes-ordre:moments"),
];

const MES_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Décor", "Montre le lieu de l'histoire"], ["Costume", "Vêtement du personnage"], ["Metteur en scène", "Dirige les comédiens"], ["Comédien", "Joue un personnage"]]),
  link("Relie chaque mot à son sens.", [["Décor", "Montre le lieu de l'histoire"], ["Costume", "Vêtement du personnage"], ["Spectateur", "Regarde le spectacle"]]),
  link("Relie chaque mot à son sens.", [["Metteur en scène", "Dirige les comédiens"], ["Comédien", "Joue un personnage"], ["Spectateur", "Regarde le spectacle"]]),
  link("Relie chaque mot à son sens.", [["Mise en scène", "Organise le spectacle"], ["Costume", "Vêtement du personnage"], ["Spectateur", "Regarde le spectacle"]]),
  link("Relie chaque mot à son sens.", [["Mise en scène", "Organise le spectacle"], ["Décor", "Montre le lieu de l'histoire"], ["Comédien", "Joue un personnage"]]),
  link("Relie chaque mot à son sens.", [["Interpréter", "Jouer un personnage"], ["Décor", "Montre le lieu de l'histoire"], ["Spectateur", "Regarde le spectacle"]]),
];

const MES_GLISSER = [
  ...sortRows(
    "Glisse chaque personne ou chose dans la bonne case.",
    ["Sur la scène", "Dans la salle"],
    ["Comédien", "Décor", "Costume", "Personnage"],
    ["Spectateur", "Public", "Fauteuil", "Applaudissements"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Avant le spectacle", "Pendant le spectacle"],
    ["Choisir l'histoire", "Distribuer les rôles", "Répéter la pièce", "Fabriquer le décor"],
    ["Entrer en scène", "Dire son texte", "Jouer son rôle", "Se déplacer sur la scène"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2MesQcm: Make = (ctx) => ce2Question(ctx, "cm2-mes-qcm", "le décor, le costume, le déguisement, la mise en scène et ceux qui font un spectacle", MES_QCM, 3);
export const makeCm2MesTrou: Make = (ctx) => ce2Gap(ctx, "cm2-mes-trou", "compléter une phrase sur la mise en scène", MES_TROU, 2, 1);
export const makeCm2MesEcrire: Make = (ctx) => ce2Write(ctx, "cm2-mes-ecrire", "écrire un mot de la mise en scène", MES_ECRIRE, 1, 2);
export const makeCm2MesOrdre: Make = (ctx) => ce2Order(ctx, "cm2-mes-ordre", "ranger les étapes pour préparer un spectacle", MES_ORDRE);
export const makeCm2MesRelier: Make = (ctx) => ce2Link(ctx, "cm2-mes-relier", "relier un mot de la mise en scène à son sens", MES_RELIER);
export const makeCm2MesGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-mes-glisser", "classer ce qui est sur la scène ou dans la salle, avant ou pendant le spectacle", MES_GLISSER, 2);
