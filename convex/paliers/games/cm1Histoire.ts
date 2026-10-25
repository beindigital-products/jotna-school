/**
 * LES GABARITS DE L'HISTOIRE DU CM1 : la préhistoire, les royaumes du Sénégal, les premiers contacts, les résistants et ceux qui
 * ont résisté sans les armes (`hi-cm1-prehistoire`, `-royaumes`, `-contacts`, `-resistants`, `-paix`).
 *
 * Sur l'échantillon de CM1 que le modèle écrivait, l'histoire était la matière qui se trompait le plus : des dates inventées, un
 * résistant donné à un autre royaume, un fait que la fiche ne dit pas. Ici chaque réponse se lit dans un tableau fermé, écrit à la
 * main, qui ne dit que ce que la fiche dit, plus quelques faits que personne ne discute (le titre du roi du Cayor, l'année de la
 * mort de Lat Dior). Les dates sont celles de la fiche ; une date qu'elle ne donne pas n'est écrite que si elle ne se discute pas
 * (1960 pour l'indépendance).
 *
 * LE TABLEAU, PUIS LES LIGNES (`cm1Faits.ts`)
 * - Un lot (`Pool`) ne contient que des réponses de même sorte. Les mauvais choix sont les réponses des autres faits du lot et ses
 *   intrus : on ne peut donc pas proposer « Alboury Ndiaye » à « Quel titre portait Lat Dior ? ».
 * - Quand deux faits ont une réponse juste pour la même question (deux sites de cercles de pierres, Sine et Saloum qui ont le même
 *   roi), l'autre réponse est dans `not` : elle n'est jamais proposée, et elle est admise à l'écrit.
 * - Un fait est posé une seule fois par palier, quel que soit le jeu (`id`, partagé entre les gabarits d'une thématique).
 * - Un indice parle du sujet sans écrire un chiffre ni un mot de quatre lettres ou plus de la réponse, d'une tuile ou d'une case.
 *
 * LES JEUX QUI NE SE TIRENT PAS D'UN FAIT (ordre, appariement, glissé) sont des lignes écrites à la main, plus bas.
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
  sortRows,
  type LinkRow,
  type OrderRow,
} from "./ce2Outils";
import { SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LA PRÉHISTOIRE (hi-cm1-prehistoire)
// ===========================================================================

const PRE_AGES: Pool = {
  items: [
    {
      id: "taillee",
      q: ["Quel âge de la préhistoire est celui des outils obtenus en cassant des silex ?", "De quel âge parle-t-on quand les hommes fabriquent des pointes en cassant des silex ?", "Quel âge porte le nom des outils faits d'éclats de silex cassé ?"],
      a: "Pierre taillée",
      ga: "pierre taillée",
      s: ["Les hommes cassaient des silex pour faire des outils tranchants pendant l'âge appelé ___.", "Les premiers outils de l'âge appelé ___ étaient des silex cassés."],
      hint: "Les outils étaient coupants parce qu'on cassait les silex.",
    },
    {
      id: "polie",
      q: ["Quel âge de la préhistoire est celui des haches frottées jusqu'à devenir lisses ?", "De quel âge parle-t-on quand les hommes frottent leurs haches pour les rendre lisses ?", "Quel âge porte le nom des haches usées par frottement pour avoir un tranchant lisse ?"],
      a: "Pierre polie",
      ga: "pierre polie",
      s: ["Les hommes frottaient leurs haches pour les rendre lisses pendant l'âge appelé ___.", "Les haches lisses sont des outils de l'âge appelé ___."],
      hint: "On usait la roche dure en la frottant longtemps.",
    },
  ],
  extras: ["Métaux"],
  gextras: ["métaux"],
};

const PRE_DISCOVERIES: Pool = {
  items: [
    {
      id: "feu",
      q: ["Quelle découverte a permis aux hommes de se chauffer et de cuire la viande ?", "Quelle découverte permet de s'éclairer la nuit et de faire fuir les bêtes sauvages ?", "Quelle découverte, très ancienne, donne de la lumière et de la chaleur ?", "Quelle découverte a protégé les hommes du froid et des bêtes sauvages ?"],
      a: "Feu",
      also: ["feu"],
      ga: "le feu",
      s: ["Se chauffer et cuire la viande, c'est possible avec ___.", "Les hommes ont gardé ___ pour cuire leurs aliments et se chauffer."],
      hint: "Il brille, il brûle et il garde au chaud.",
    },
    {
      id: "agriculture",
      q: ["Quelle activité consiste à semer des graines puis à récolter ce qui a poussé ?", "Quel nom porte l'activité de ceux qui cultivent la terre pour produire leur nourriture ?", "Quelle activité permet de récolter du mil après avoir semé ?"],
      a: "Agriculture",
      also: ["agriculture"],
      ga: "l'agriculture",
      s: ["Semer des graines puis récolter, c'est ___.", "Cultiver la terre pour produire sa nourriture, c'est ___."],
      hint: "On prépare la terre, on y met des graines et on attend.",
    },
    {
      id: "elevage",
      q: ["Quelle activité consiste à garder des troupeaux pour avoir du lait et de la viande ?", "Quel nom porte l'activité de ceux qui gardent des vaches, des moutons et des chèvres ?", "Quelle activité a donné du lait toute l'année grâce à des animaux gardés ?"],
      a: "Élevage",
      also: ["élevage"],
      ga: "l'élevage",
      s: ["Garder des troupeaux de vaches et de moutons, c'est ___.", "Pour avoir du lait, les hommes ont pratiqué ___."],
      hint: "On soigne des bêtes, on les fait paître et on les trait.",
    },
    {
      id: "chasse",
      q: ["Avant de cultiver, comment les hommes se procuraient-ils leur nourriture ?", "Quelles activités permettaient de se nourrir sans cultiver ni élever ?", "Comment vivaient les hommes qui poursuivaient le gibier et ramassaient des fruits ?"],
      a: "Chasse et cueillette",
      also: ["la chasse et la cueillette"],
      ga: "la chasse et la cueillette",
      s: ["Poursuivre le gibier et ramasser des fruits, c'est ___.", "Avant de cultiver, les hommes pratiquaient ___."],
      hint: "Ils suivaient les animaux sauvages et ramassaient des fruits.",
    },
  ],
  extras: ["Commerce"],
  gextras: ["le commerce"],
};

const PRE_SITES: Pool = {
  items: [
    {
      id: "sine-ngayene",
      q: ["Quel site de Sénégambie est célèbre pour ses cercles de pierres dressées ?", "Où trouve-t-on des cercles de pierres dressées inscrits parmi les sites de Sénégambie ?"],
      a: "Sine Ngayène",
      also: ["Wanar"],
      not: ["Wanar"],
      s: ["Les cercles de pierres de ___ sont un site célèbre de Sénégambie.", "Il existe de grands cercles de pierres dressées à ___, en Sénégambie."],
      hint: "Ce site est un grand champ de blocs dressés, au centre du pays.",
    },
    {
      id: "wanar",
      q: ["Quel site, avec Sine Ngayène, garde de grands cercles de pierres en Sénégambie ?", "Quel site, voisin de Sine Ngayène, est célèbre pour ses pierres dressées en cercles ?"],
      a: "Wanar",
      not: ["Sine Ngayène"],
      s: ["Avec Sine Ngayène, le site de ___ garde de grands cercles de pierres.", "À côté de Sine Ngayène, le site de ___ garde aussi des pierres dressées."],
      hint: "Ce second site est lui aussi un champ de blocs dressés, au centre du pays.",
    },
    {
      id: "saloum",
      q: ["Dans quel delta trouve-t-on de grands amas de coquillages laissés par d'anciens habitants ?", "Dans quel delta des pêcheurs d'autrefois ont-ils amassé des coquillages ?"],
      a: "Delta du Saloum",
      ga: "Saloum",
      s: ["Dans le delta du ___, d'anciens habitants ont laissé de grands amas de coquillages.", "Les amas de coquillages du delta du ___ ont été laissés par d'anciens habitants."],
      hint: "Cette région côtière mêle bras de mer, îlots et mangrove.",
    },
  ],
  extras: ["Gorée", "Saint-Louis", "Touba"],
};

const PRE_POOLS = [PRE_AGES, PRE_DISCOVERIES, PRE_SITES] as const;
const PRE_QCM = questionRows("hi-cm1-prehistoire", PRE_POOLS);
const PRE_TROU = gapRows("hi-cm1-prehistoire", PRE_POOLS);
const PRE_ECRIRE = writeRows("hi-cm1-prehistoire", PRE_POOLS);

const PRE_ORDRE: readonly OrderRow[] = [
  order("Range ces âges du plus ancien au plus récent.", ["Pierre taillée", "Pierre polie", "Métaux"], "pre-ordre:ages"),
  order("Range ces étapes du plus ancien au plus récent.", ["Tailler des silex", "Maîtriser le feu", "Polir des haches"], "pre-ordre:etapes"),
  order("Range ces modes de vie du plus ancien au plus récent.", ["Chasser et cueillir", "Cultiver et élever", "Travailler le métal"], "pre-ordre:vie"),
  order("Range ces progrès du plus ancien au plus récent.", ["Tailler des silex", "Maîtriser le feu", "Polir des haches", "Travailler le métal"], "pre-ordre:progres"),
  order("Range les gestes de l'agriculteur du premier au dernier.", ["Préparer le champ", "Semer les graines", "Récolter le grain"], "pre-ordre:champ"),
  order("Range ces gestes du premier au dernier.", ["Allumer le feu", "Poser la viande sur les braises", "Manger la viande cuite"], "pre-ordre:viande"),
  order("Range ces gestes du premier au dernier.", ["Ramasser du bois", "Allumer le feu", "Cuire la viande", "Manger la viande"], "pre-ordre:bois"),
];

const PRE_RELIER: readonly LinkRow[] = [
  link("Relie chaque découverte à son effet.", [["Feu", "Se chauffer et cuire"], ["Agriculture", "Produire sa nourriture"], ["Élevage", "Avoir du lait et de la viande"]]),
  link("Relie chaque âge à son outil.", [["Pierre taillée", "Silex cassé"], ["Pierre polie", "Hache lisse"], ["Métaux", "Outil en fer"]]),
  link("Relie chaque mode de vie à sa nourriture.", [["Chasseur", "Gibier"], ["Cueilleur", "Fruits sauvages"], ["Agriculteur", "Grains récoltés"], ["Éleveur", "Lait des troupeaux"]]),
  link("Relie chaque activité à ce qu'on fait.", [["Chasser", "Poursuivre le gibier"], ["Cueillir", "Ramasser des fruits"], ["Semer", "Mettre des graines en terre"], ["Élever", "Garder un troupeau"]]),
  link("Relie chaque outil à son usage.", [["Silex taillé", "Couper la viande"], ["Hache lisse", "Défricher un champ"], ["Pointe de silex", "Chasser le gibier"]]),
  link("Relie chaque nourriture à son origine.", [["Gibier", "Chasse"], ["Fruits sauvages", "Cueillette"], ["Grains récoltés", "Agriculture"], ["Lait", "Élevage"]]),
];

const PRE_GLISSER = [
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Chasse et cueillette", "Agriculture"],
    ["Cueillir des fruits", "Poursuivre le gibier", "Ramasser des racines", "Pister un animal"],
    ["Semer des graines", "Arroser les champs", "Récolter le grain", "Désherber un champ"],
    SORT_HINTS,
    4,
  ),
  ...sortRows(
    "Glisse chaque objet dans la bonne case.",
    ["Pierre taillée", "Pierre polie"],
    ["Silex cassé", "Éclat de silex", "Pierre cassée"],
    ["Hache lisse", "Hache frottée", "Pierre usée"],
    SORT_HINTS,
    4,
  ),
];

export const makeCm1PreQcm: Make = (ctx) => ce2Question(ctx, "cm1-pre-qcm", "les âges, les découvertes et les sites de la préhistoire", PRE_QCM, 3);
export const makeCm1PreTrou: Make = (ctx) => ce2Gap(ctx, "cm1-pre-trou", "compléter une phrase sur la préhistoire", PRE_TROU, 2, 1);
export const makeCm1PreEcrire: Make = (ctx) => ce2Write(ctx, "cm1-pre-ecrire", "écrire un fait de la préhistoire", PRE_ECRIRE, 1, 2);
export const makeCm1PreOrdre: Make = (ctx) => ce2Order(ctx, "cm1-pre-ordre", "ranger les étapes de la préhistoire", PRE_ORDRE);
export const makeCm1PreRelier: Make = (ctx) => ce2Link(ctx, "cm1-pre-relier", "relier une découverte à son effet", PRE_RELIER);
export const makeCm1PreGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-pre-glisser", "classer les gestes et les objets de la préhistoire", PRE_GLISSER, 2);

// ===========================================================================
// LES ROYAUMES DU SÉNÉGAL (hi-cm1-royaumes)
// ===========================================================================

const ROY_POWER: Pool = {
  items: [
    {
      id: "roi",
      q: ["Qui dirigeait un royaume du Sénégal avant l'arrivée des Européens ?", "Qui prenait les grandes décisions dans le royaume ?", "Comment s'appelait le chef qui commandait chaque royaume du Sénégal ?", "Qui rendait la justice dans un royaume ?"],
      a: "Roi",
      ga: "le roi",
      s: ["Dans un royaume, la justice est rendue par ___.", "Le chef d'un royaume était ___."],
      hint: "Il est au sommet et son titre change selon le royaume.",
    },
    {
      id: "notables",
      q: ["Qui conseillait le roi et l'aidait à gouverner ?", "Qui aidait le roi à décider, avec ses conseils ?"],
      a: "Notables",
      ga: "les notables",
      s: ["Le roi était conseillé par ___ du royaume.", "Avant les grandes décisions, le roi écoutait ___."],
      hint: "Ce sont des personnes importantes, choisies pour leur savoir et leur rang.",
    },
    {
      id: "armee",
      q: ["Qui défendait le royaume et partait à la guerre ?", "Qui protégeait les villages du royaume contre les attaques ?"],
      a: "Armée",
      ga: "l'armée",
      s: ["Pour défendre le royaume, le roi comptait sur ___.", "Les guerriers du royaume formaient ___."],
      hint: "Elle protège les frontières avec des guerriers.",
    },
  ],
  extras: ["Marchands"],
  gextras: ["les marchands"],
};

const ROY_ACTIVITIES: Pool = {
  items: [
    {
      id: "agriculture",
      q: ["Quelle activité faisait vivre la plupart des habitants, avec la culture du mil ?", "Quelle activité consiste à cultiver le mil et le sorgho dans les champs ?", "Quelle activité nourrissait les familles grâce aux champs de mil ?"],
      a: "Agriculture",
      also: ["agriculture"],
      ga: "l'agriculture",
      s: ["Cultiver le mil dans les champs, c'est pratiquer ___.", "Semer et récolter dans les champs, c'est pratiquer ___."],
      hint: "On travaille la terre avec la daba.",
    },
    {
      id: "elevage",
      q: ["Quelle activité consiste à garder des bœufs, des moutons et des chèvres ?", "Quelle activité fournissait le lait et la viande des troupeaux ?"],
      a: "Élevage",
      also: ["élevage"],
      ga: "l'élevage",
      s: ["Garder des bœufs et des moutons, c'est pratiquer ___.", "Garder des troupeaux de chèvres, c'est pratiquer ___."],
      hint: "On s'occupe de bêtes qu'on fait paître.",
    },
    {
      id: "commerce",
      q: ["Quelle activité consiste à échanger et vendre des marchandises ?", "Quelle activité faisait voyager des marchands avec leurs marchandises de pays en pays ?", "Quelle activité faisait venir le sel et les étoffes au marché ?"],
      a: "Commerce",
      also: ["commerce"],
      ga: "le commerce",
      s: ["Échanger et vendre des marchandises, c'est pratiquer ___.", "Aller au marché pour vendre et acheter, c'est pratiquer ___."],
      hint: "On achète, on vend et on échange.",
    },
  ],
};

const ROY_TITLES: Pool = {
  items: [
    { id: "cayor", q: ["Quel est le titre du roi du Cayor ?"], a: "Damel", s: ["Le roi du Cayor portait le titre de ___."], hint: "Ce royaume wolof est proche de la côte, au nord de Dakar." },
    { id: "djolof", q: ["Quel est le titre du roi du Djolof ?"], a: "Bourba", s: ["Le roi du Djolof portait le titre de ___."], hint: "Ce royaume wolof se trouvait à l'intérieur des terres." },
    { id: "baol", q: ["Quel est le titre du roi du Baol ?"], a: "Teigne", s: ["Le roi du Baol portait le titre de ___."], hint: "Ce royaume wolof se trouvait entre le Cayor et le Sine." },
    { id: "walo", q: ["Quel est le titre du roi du Walo ?"], a: "Brak", s: ["Le roi du Walo portait le titre de ___."], hint: "Ce royaume wolof bordait le fleuve Sénégal." },
    { id: "sine", q: ["Quel est le titre du roi du Sine ?"], a: "Bour", s: ["Le roi du Sine portait le titre de ___."], hint: "Ce royaume sérère se trouvait au sud du Baol." },
  ],
  extras: ["Almamy", "Mansa"],
};

const ROY_KINGDOMS: Pool = {
  items: [
    { id: "cayor", q: ["Quel royaume était dirigé par un damel ?"], a: "Cayor", s: ["Le damel était le roi du ___."], hint: "Ce royaume wolof touchait la côte, au nord de Dakar." },
    { id: "djolof", q: ["Quel royaume était dirigé par un bourba ?"], a: "Djolof", s: ["Le bourba était le roi du ___."], hint: "Ce royaume wolof était loin de la mer." },
    { id: "baol", q: ["Quel royaume était dirigé par un teigne ?"], a: "Baol", s: ["Le teigne était le roi du ___."], hint: "Ce royaume wolof était voisin du Sine." },
    { id: "walo", q: ["Quel royaume était dirigé par un brak ?"], a: "Walo", s: ["Le brak était le roi du ___."], hint: "Ce royaume wolof était au bord du fleuve." },
    { id: "sine", q: ["Quel royaume était dirigé par un bour ?"], a: "Sine", also: ["Saloum"], not: ["Saloum"], s: ["Le bour était le roi du ___ ou du Saloum."], hint: "Ce royaume sérère se trouvait au sud du Baol." },
  ],
  extras: ["Gabou", "Fouta"],
};

const ROY_POOLS = [ROY_POWER, ROY_ACTIVITIES, ROY_TITLES, ROY_KINGDOMS] as const;
const ROY_QCM = questionRows("hi-cm1-royaumes", ROY_POOLS);
const ROY_TROU = gapRows("hi-cm1-royaumes", ROY_POOLS);
const ROY_ECRIRE = writeRows("hi-cm1-royaumes", ROY_POOLS);

const ROY_RELIER: readonly LinkRow[] = [
  link("Relie chaque titre à son royaume.", [["Damel", "Cayor"], ["Bourba", "Djolof"], ["Teigne", "Baol"]]),
  link("Relie chaque roi à son royaume.", [["Brak", "Walo"], ["Damel", "Cayor"], ["Bour", "Sine"]]),
  link("Relie chaque titre à son royaume.", [["Teigne", "Baol"], ["Brak", "Walo"], ["Bourba", "Djolof"], ["Bour", "Sine"]]),
  link("Relie chaque personne du royaume à son rôle.", [["Roi", "Dirige le royaume"], ["Notables", "Conseillent le roi"], ["Armée", "Défend le royaume"]]),
  link("Relie chaque activité à ce qu'elle apporte.", [["Agriculture", "Mil"], ["Élevage", "Le lait et la viande"], ["Commerce", "Les échanges de marchandises"]]),
  link("Relie chaque roi à son royaume.", [["Bourba", "Djolof"], ["Damel", "Cayor"], ["Brak", "Walo"], ["Teigne", "Baol"]]),
];

const ROY_GLISSER = sortRows("Glisse chaque mot dans la bonne case.", ["Pouvoir", "Activités"], ["Roi", "Notables", "Armée"], ["Agriculture", "Élevage", "Commerce"], SORT_HINTS, 6);

export const makeCm1RoyQcm: Make = (ctx) => ce2Question(ctx, "cm1-roy-qcm", "l'organisation, les activités et les titres des royaumes", ROY_QCM, 3);
export const makeCm1RoyTrou: Make = (ctx) => ce2Gap(ctx, "cm1-roy-trou", "compléter une phrase sur les royaumes", ROY_TROU, 2, 1);
export const makeCm1RoyEcrire: Make = (ctx) => ce2Write(ctx, "cm1-roy-ecrire", "écrire un fait sur les royaumes", ROY_ECRIRE, 2, 2);
export const makeCm1RoyRelier: Make = (ctx) => ce2Link(ctx, "cm1-roy-relier", "relier un titre à son royaume", ROY_RELIER);
export const makeCm1RoyGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-roy-glisser", "classer le pouvoir et les activités d'un royaume", ROY_GLISSER, 2);

// ===========================================================================
// LES PREMIERS CONTACTS (hi-cm1-contacts)
// ===========================================================================

const CON_ANIMAL: Pool = {
  items: [
    {
      id: "chameau",
      q: ["Quel animal portait les marchandises à travers le désert du Sahara ?", "Quel animal permettait aux caravanes de traverser le Sahara ?", "Quel animal des déserts boit peu et porte de lourdes charges ?"],
      a: "Chameau",
      also: ["chameau"],
      ga: "chameaux",
      s: ["Pour traverser le Sahara, les marchands montaient sur des ___ chargés de marchandises.", "Les caravanes du Sahara étaient formées de nombreux ___."],
      hint: "Il peut marcher longtemps sans boire, grâce à sa bosse.",
    },
  ],
  extras: ["Cheval", "Bœuf"],
  gextras: ["chevaux", "bœufs"],
};

const CON_CARAVANE: Pool = {
  items: [
    {
      id: "caravane",
      q: ["Comment appelle-t-on un groupe de marchands et d'animaux qui traversent le désert ensemble ?", "Comment nomme-t-on le voyage des marchands qui traversent le Sahara en groupe ?"],
      a: "Caravane",
      also: ["caravane"],
      ga: "caravane",
      s: ["Les marchands du désert voyageaient souvent en ___.", "Pour traverser le désert, les marchands voyageaient en ___ avec leurs chameaux."],
      hint: "C'est un long cortège de voyageurs qui avancent ensemble.",
    },
  ],
  extras: ["Armée", "Comptoir"],
  gextras: ["armée", "comptoir"],
};

const CON_RELIGION: Pool = {
  items: [
    {
      id: "islam",
      q: ["Quelle religion les marchands arabes ont-ils fait connaître en Afrique de l'Ouest ?", "Quelle religion est arrivée au Sénégal grâce au commerce avec les Arabes ?"],
      a: "Islam",
      also: ["islam"],
      ga: "l'islam",
      s: ["Les marchands arabes ont fait connaître ___ en Afrique de l'Ouest.", "Grâce au commerce avec les Arabes, ___ s'est répandu au Sénégal."],
      hint: "Ses fidèles prient plusieurs fois par jour, tournés vers La Mecque.",
    },
  ],
  extras: ["Christianisme", "Bouddhisme"],
  gextras: ["le christianisme", "le bouddhisme"],
};

const CON_SIECLES: Pool = {
  items: [
    {
      id: "almoravides",
      q: ["À quel siècle les Almoravides sont-ils arrivés dans la région du Sénégal ?", "Les Almoravides sont arrivés il y a environ mille ans, à quel siècle ?"],
      a: "XIe siècle",
      s: ["Au ___, les Almoravides ont atteint la région du fleuve Sénégal.", "Les Almoravides sont arrivés au ___ dans la région."],
      hint: "C'est il y a environ mille ans.",
    },
    {
      id: "portugais-siecle",
      q: ["À quel siècle les Portugais sont-ils arrivés sur la côte du Sénégal ?", "Les Portugais sont arrivés il y a environ six cents ans, à quel siècle ?"],
      a: "XVe siècle",
      s: ["Au ___, les Portugais sont arrivés sur les côtes du Sénégal.", "Les premiers navires portugais ont touché la côte au ___."],
      hint: "C'est il y a environ six cents ans.",
    },
  ],
  extras: ["XIXe siècle"],
};

const CON_EUROPEANS: Pool = {
  items: [
    {
      id: "portugais",
      q: ["Quels Européens sont arrivés les premiers sur la côte du Sénégal ?", "Quels navigateurs d'Europe ont abordé les premiers la côte du Sénégal ?"],
      a: "Portugais",
      ga: "Portugais",
      s: ["Les premiers Européens à arriver sur la côte étaient les ___.", "Venus par la mer, les ___ ont découvert la côte avant les autres Européens."],
      hint: "Leurs navires venaient d'un pays au sud-ouest de l'Europe.",
    },
  ],
  extras: ["Français", "Anglais"],
  gextras: ["Français", "Anglais"],
};

const CON_COMPTOIR: Pool = {
  items: [
    {
      id: "comptoir",
      q: ["Comment appelle-t-on un poste de commerce installé par les Européens sur la côte ?", "Que construisaient les Européens sur la côte pour y faire du commerce ?"],
      a: "Comptoir",
      also: ["comptoir"],
      ga: "comptoirs",
      s: ["Gorée et Saint-Louis étaient des ___ européens.", "Les Européens ont construit des ___ sur la côte pour faire du commerce."],
      hint: "On y échangeait des marchandises avec les habitants.",
    },
  ],
  extras: ["Village", "Royaume"],
  gextras: ["villages", "royaumes"],
};

const CON_PLACES: Pool = {
  items: [
    {
      id: "goree",
      q: ["Quelle île située en face de Dakar fut un comptoir européen ?", "Quelle petite île, au large de Dakar, servait de comptoir aux Européens ?"],
      a: "Gorée",
      s: ["L'île de ___, en face de Dakar, fut un comptoir européen.", "Au large de Dakar, l'île de ___ servait de comptoir."],
      hint: "Cette petite île se trouve juste au large de la capitale.",
    },
    {
      id: "saint-louis",
      q: ["Quelle ville, à l'embouchure du fleuve Sénégal, fut un comptoir européen ?", "Quelle ville du nord-ouest, sur le fleuve, était un comptoir des Européens ?"],
      a: "Saint-Louis",
      s: ["La ville de ___, à l'embouchure du fleuve Sénégal, fut un comptoir européen.", "Au bord du fleuve Sénégal, ___ était un comptoir européen."],
      hint: "Elle se trouve tout au nord-ouest du pays, là où le fleuve rejoint l'océan.",
    },
  ],
  extras: ["Touba", "Kaolack"],
};

const CON_POOLS = [CON_ANIMAL, CON_CARAVANE, CON_RELIGION, CON_SIECLES, CON_EUROPEANS, CON_COMPTOIR, CON_PLACES] as const;
const CON_QCM = questionRows("hi-cm1-contacts", CON_POOLS);
const CON_TROU = gapRows("hi-cm1-contacts", CON_POOLS);
const CON_ECRIRE = writeRows("hi-cm1-contacts", CON_POOLS);

const CON_ORDRE: readonly OrderRow[] = [
  order("Range ces arrivées du plus ancien au plus récent.", ["Les caravanes du Sahara", "Almoravides", "Portugais"], "con-ordre:arrivees"),
  order("Range ces événements du plus ancien au plus récent.", ["Les Arabes traversent le Sahara", "Les Portugais arrivent par la mer", "Les Européens installent des comptoirs"], "con-ordre:evenements"),
  order("Range ces périodes du plus ancien au plus récent.", ["Almoravides", "Portugais", "La conquête coloniale"], "con-ordre:periodes"),
  order("Range ces contacts du plus ancien au plus récent.", ["Le commerce par le Sahara", "Almoravides", "Portugais", "Les comptoirs de Saint-Louis"], "con-ordre:contacts"),
  order("Range ces moments du plus ancien au plus récent.", ["Almoravides", "Portugais", "La conquête coloniale", "Indépendance"], "con-ordre:moments"),
  order("Range ces faits du plus ancien au plus récent.", ["Le commerce par le Sahara", "Portugais", "Les comptoirs de Saint-Louis"], "con-ordre:faits"),
];

const CON_RELIER: readonly LinkRow[] = [
  link("Relie chaque lieu à sa description.", [["Gorée", "Île en face de Dakar"], ["Saint-Louis", "Ville à l'embouchure du fleuve"], ["Comptoir", "Poste de commerce sur la côte"]]),
  link("Relie chaque mot à son sens.", [["Caravane", "Groupe de marchands en voyage"], ["Comptoir", "Poste de commerce européen"], ["Almoravides", "Peuple venu du Sahara"]]),
  link("Relie chaque voyageur à son moyen de transport.", [["Marchand arabe", "Chameau"], ["Marin portugais", "Caravelle"], ["Pêcheur du fleuve", "Pirogue"]]),
  // « Marchands arabes » allait aussi bien avec l'islam qu'avec les marchandises du Sahara : chaque mot n'a plus qu'une place.
  link("Relie chaque mot à son rôle.", [["Caravane", "Traverse le désert"], ["Caravelle", "Traverse l'océan"], ["Comptoir", "Commerce sur la côte"]]),
  link("Relie chaque période à son siècle.", [["Almoravides", "XIe siècle"], ["Portugais", "XVe siècle"], ["Conquête coloniale", "XIXe siècle"]]),
  link("Relie chaque voyageur à ce qu'il traverse.", [["Marchand arabe", "Désert"], ["Marin portugais", "Océan"], ["Pêcheur du fleuve", "Fleuve"]]),
];

const CON_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Venus par le désert", "Venus par la mer"], ["Chameau", "Caravane", "Almoravides", "Marchands arabes"], ["Caravelle", "Portugais", "Navire", "Marins européens"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Arabes", "Européens"], ["Almoravides", "Islam", "Caravane", "Chameau"], ["Portugais", "Comptoir", "Gorée", "Saint-Louis"], SORT_HINTS, 4),
];

export const makeCm1ConQcm: Make = (ctx) => ce2Question(ctx, "cm1-con-qcm", "les premiers contacts avec les Arabes et les Européens", CON_QCM, 3);
export const makeCm1ConTrou: Make = (ctx) => ce2Gap(ctx, "cm1-con-trou", "compléter une phrase sur les premiers contacts", CON_TROU, 2, 1);
export const makeCm1ConEcrire: Make = (ctx) => ce2Write(ctx, "cm1-con-ecrire", "écrire un fait sur les premiers contacts", CON_ECRIRE, 1, 2);
export const makeCm1ConOrdre: Make = (ctx) => ce2Order(ctx, "cm1-con-ordre", "ranger les premiers contacts dans le temps", CON_ORDRE);
export const makeCm1ConRelier: Make = (ctx) => ce2Link(ctx, "cm1-con-relier", "relier un mot à son sens ou à son lieu", CON_RELIER);
export const makeCm1ConGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-con-glisser", "classer ceux qui viennent par le désert et par la mer", CON_GLISSER, 2);

// ===========================================================================
// LES RÉSISTANTS (hi-cm1-resistants)
// ===========================================================================

const RES_ALL_NAMES = ["Lat Dior", "Alboury Ndiaye", "El Hadji Oumar Tall", "Maba Diakhou Bâ", "Ahmadou Cheikhou", "Fodé Kaba Doumbouya"] as const;

const RES_WHO: Pool = {
  items: [
    {
      id: "lat-dior",
      q: ["Quel résistant, damel du Cayor, est mort à Dékheulé en 1886 ?", "Quel damel du Cayor a refusé la conquête coloniale et a été tué à Dékheulé ?", "Quel damel du Cayor est mort en 1886 en défendant son royaume ?"],
      a: "Lat Dior",
      also: ["Lat Dior Diop"],
      s: ["___ Diop, damel du Cayor, est mort à Dékheulé en 1886.", "Le damel du Cayor ___ Diop a lutté contre la conquête."],
      hint: "Il était roi d'un royaume wolof proche de la côte.",
    },
    {
      id: "alboury",
      q: ["Quel résistant a été le dernier bourba du Djolof ?", "Quel bourba du Djolof a combattu la conquête française ?"],
      a: "Alboury Ndiaye",
      also: ["Alboury", "Albouri", "Albouri Ndiaye", "Alboury N'Diaye", "Albouri N'Diaye"],
      ga: "Alboury",
      s: ["___ Ndiaye, bourba du Djolof, a lutté contre la conquête française.", "Le bourba du Djolof, ___ Ndiaye, a combattu la conquête."],
      hint: "Il commandait un royaume wolof de l'intérieur du pays.",
    },
    {
      id: "oumar",
      q: ["Quel chef religieux toucouleur a fondé un empire et s'est opposé à Faidherbe ?", "Quel chef toucouleur de la vallée du fleuve a mené une guerre sainte ?"],
      a: "El Hadji Oumar Tall",
      ga: "El Hadji Oumar",
      s: ["___ Tall a fondé un empire sur le fleuve Sénégal et s'est opposé à Faidherbe.", "Le chef toucouleur ___ Tall a fondé un empire."],
      hint: "Il venait de la vallée du fleuve et dirigeait la guerre sainte.",
    },
    {
      id: "maba",
      q: ["Quel chef musulman a dirigé la résistance dans le Rip, au Saloum ?", "Quel marabout musulman du Saloum a mené la guerre sainte dans le Rip ?"],
      a: "Maba Diakhou Bâ",
      ga: "Maba",
      s: ["___ Diakhou Bâ a mené la résistance dans le Rip, au Saloum.", "Le marabout ___ Diakhou Bâ a mené la guerre sainte dans le Rip."],
      hint: "Ce marabout a pris les armes dans une région du Saloum.",
    },
  ],
};

const RES_LIST: Pool = {
  items: [
    {
      id: "ahmadou",
      q: ["Parmi ces noms, lequel est celui d'un résistant à la conquête coloniale ?", "Un de ces noms est celui d'un résistant à la conquête, lequel ?"],
      a: "Ahmadou Cheikhou",
      w: "Écris le nom d'un résistant à la conquête coloniale cité dans le cours.",
      also: RES_ALL_NAMES,
      s: ["Parmi les résistants à la conquête coloniale, on cite ___ Cheikhou.", "Le résistant ___ Cheikhou a lutté contre la conquête coloniale."],
      ga: "Ahmadou",
      hint: "Il a lutté contre l'arrivée de l'armée coloniale.",
    },
    {
      id: "fode",
      q: ["Quel nom est celui d'un résistant à la conquête coloniale ?", "Lequel de ces noms appartient à un résistant de la conquête coloniale ?"],
      a: "Fodé Kaba Doumbouya",
      noWrite: true,
      w: "Écris le nom d'un résistant à la conquête coloniale cité dans le cours.",
      also: RES_ALL_NAMES,
      s: ["Parmi les résistants à la conquête coloniale, on cite ___ Kaba Doumbouya.", "Le résistant ___ Kaba Doumbouya a lutté contre la conquête coloniale."],
      ga: "Fodé",
      hint: "Il s'est battu contre ceux qui voulaient conquérir son pays.",
    },
  ],
  extras: ["Louis Faidherbe", "Léopold Sédar Senghor"],
  gextras: ["Louis", "Léopold"],
  onlyExtras: true,
};

const RES_PLACE: Pool = {
  items: [
    {
      id: "lat-dior-lieu",
      q: ["Dans quel lieu Lat Dior est-il mort en 1886 ?", "Quel lieu du Cayor est celui de la mort de Lat Dior ?", "Où le damel Lat Dior a-t-il trouvé la mort ?"],
      a: "Dékheulé",
      s: ["Lat Dior est mort à ___ en 1886.", "Le damel Lat Dior a trouvé la mort à ___."],
      hint: "C'est un lieu du Cayor, dans le nord-ouest du pays.",
    },
  ],
  extras: ["Gorée", "Podor", "Kaolack"],
};

const RES_YEAR: Pool = {
  items: [
    {
      id: "lat-dior-annee",
      q: ["En quelle année Lat Dior est-il mort à Dékheulé ?", "Lat Dior est mort à Dékheulé, mais en quelle année ?"],
      a: "1886",
      s: ["Lat Dior est mort à Dékheulé en ___.", "En ___, Lat Dior est mort à Dékheulé."],
      hint: "C'est peu avant la fin du XIXe siècle.",
    },
  ],
  extras: ["1895", "1902", "1960"],
};

const RES_TITLE: Pool = {
  items: [
    { id: "lat-dior-titre", q: ["Quel titre portait Lat Dior, roi du Cayor ?", "Comment appelait-on Lat Dior, roi du Cayor ?"], a: "Damel", s: ["Lat Dior était le ___ du Cayor.", "Au Cayor, on appelait le roi le ___."], hint: "C'est le nom du roi des Wolofs de la côte." },
    { id: "alboury-titre", q: ["Quel titre portait Alboury Ndiaye, roi du Djolof ?", "Comment appelait-on Alboury Ndiaye, roi du Djolof ?"], a: "Bourba", s: ["Alboury Ndiaye était le ___ du Djolof.", "Au Djolof, on appelait le roi le ___."], hint: "C'est le nom du roi des Wolofs de l'intérieur." },
  ],
  extras: ["Almamy", "Teigne"],
};

const RES_POOLS = [RES_WHO, RES_LIST, RES_PLACE, RES_YEAR, RES_TITLE] as const;
const RES_QCM = questionRows("hi-cm1-resistants", RES_POOLS);
const RES_TROU = gapRows("hi-cm1-resistants", RES_POOLS);
const RES_ECRIRE = writeRows("hi-cm1-resistants", RES_POOLS);

const RES_RELIER: readonly LinkRow[] = [
  link("Relie chaque résistant à son royaume.", [["Lat Dior", "Cayor"], ["Alboury Ndiaye", "Djolof"], ["El Hadji Oumar Tall", "Fouta"]]),
  link("Relie chaque résistant à son titre ou à son peuple.", [["Lat Dior", "Damel du Cayor"], ["Alboury Ndiaye", "Bourba du Djolof"], ["El Hadji Oumar Tall", "Chef religieux toucouleur"]]),
  link("Relie chaque résistant à ce qu'il a fait.", [["Lat Dior", "A défendu le Cayor"], ["El Hadji Oumar Tall", "A fondé un empire sur le fleuve"], ["Maba Diakhou Bâ", "A résisté dans le Rip"], ["Alboury Ndiaye", "A dirigé le Djolof"]]),
  link("Relie chaque résistant à sa région.", [["Lat Dior", "Cayor"], ["Maba Diakhou Bâ", "Rip"], ["Alboury Ndiaye", "Djolof"]]),
  link("Relie chaque résistant à son titre.", [["Lat Dior", "Damel"], ["Alboury Ndiaye", "Bourba"], ["El Hadji Oumar Tall", "Chef religieux"]]),
  link("Relie chaque royaume à son résistant.", [["Cayor", "Lat Dior"], ["Djolof", "Alboury Ndiaye"], ["Fouta", "El Hadji Oumar Tall"], ["Rip", "Maba Diakhou Bâ"]]),
];

const RES_GLISSER = sortRows(
  "Glisse chaque nom dans la bonne case.",
  ["Royaume", "Personne"],
  ["Cayor", "Djolof", "Fouta", "Walo"],
  ["Lat Dior", "Alboury Ndiaye", "El Hadji Oumar Tall", "Maba Diakhou Bâ"],
  SORT_HINTS,
  8,
);

export const makeCm1ResQcm: Make = (ctx) => ce2Question(ctx, "cm1-res-qcm", "les résistants à la conquête coloniale", RES_QCM, 3);
export const makeCm1ResTrou: Make = (ctx) => ce2Gap(ctx, "cm1-res-trou", "compléter une phrase sur un résistant", RES_TROU, 2, 1);
export const makeCm1ResEcrire: Make = (ctx) => ce2Write(ctx, "cm1-res-ecrire", "écrire un fait sur un résistant", RES_ECRIRE, 2, 2);
export const makeCm1ResRelier: Make = (ctx) => ce2Link(ctx, "cm1-res-relier", "relier un résistant à son royaume ou à ce qu'il a fait", RES_RELIER);
export const makeCm1ResGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-res-glisser", "distinguer un royaume d'une personne", RES_GLISSER, 2);

// ===========================================================================
// RÉSISTER SANS LES ARMES (hi-cm1-paix)
// ===========================================================================

const PAI_WHO: Pool = {
  items: [
    {
      id: "bamba",
      q: ["Quel chef religieux, fondateur du mouridisme, a été exilé au Gabon en 1895 ?", "Quel guide religieux a résisté sans les armes et fondé la ville de Touba ?", "Quel fondateur du mouridisme a refusé de prendre les armes ?"],
      a: "Cheikh Ahmadou Bamba",
      also: ["Ahmadou Bamba", "Cheikh Amadou Bamba"],
      ga: "Cheikh Ahmadou",
      s: ["___ Bamba a été exilé au Gabon en 1895.", "Le fondateur du mouridisme, ___ Bamba, a été exilé."],
      hint: "Il a refusé de prendre les armes et il a été envoyé loin de son pays.",
    },
    {
      id: "aline",
      q: ["Quelle résistante de Casamance a été arrêtée en 1943 ?", "Quelle femme de Casamance a résisté aux autorités coloniales et a été arrêtée ?"],
      a: "Aline Sitoé Diatta",
      ga: "Aline",
      s: ["___ Sitoé Diatta, résistante de Casamance, a été arrêtée en 1943.", "La résistante de Casamance ___ Sitoé Diatta a été arrêtée."],
      hint: "C'est une femme du sud du pays qui a refusé les ordres de l'administration.",
    },
    {
      id: "senghor",
      q: ["Qui a été le premier président du Sénégal indépendant ?", "Quel poète est devenu le premier président du Sénégal ?", "Quel poète a dirigé le Sénégal à l'indépendance ?"],
      a: "Léopold Sédar Senghor",
      also: ["Senghor", "Léopold Senghor"],
      ga: "Léopold",
      s: ["___ Sédar Senghor a été le premier président du Sénégal.", "Le premier président du Sénégal est ___ Sédar Senghor."],
      hint: "Il est devenu chef de l'État au moment de l'indépendance.",
    },
  ],
  extras: ["Lat Dior", "Alboury Ndiaye"],
  gextras: ["Lat", "Alboury"],
};

const PAI_COUNTRY: Pool = {
  items: [
    {
      id: "bamba-gabon",
      q: ["Dans quel pays Cheikh Ahmadou Bamba a-t-il été exilé en 1895 ?", "Vers quel pays d'Afrique centrale Cheikh Ahmadou Bamba a-t-il été envoyé en exil ?"],
      a: "Gabon",
      s: ["En 1895, Cheikh Ahmadou Bamba a été exilé dans un pays d'Afrique centrale nommé ___.", "Cheikh Ahmadou Bamba a été envoyé en exil dans le pays nommé ___ en 1895."],
      hint: "C'est un pays d'Afrique centrale, bien loin du Sénégal.",
    },
  ],
  extras: ["Mali", "Mauritanie", "Guinée"],
};

const PAI_REGION: Pool = {
  items: [
    {
      id: "aline-casamance",
      q: ["De quelle région du Sénégal Aline Sitoé Diatta était-elle originaire ?", "Dans quelle région du sud Aline Sitoé Diatta a-t-elle mené sa résistance ?"],
      a: "Casamance",
      s: ["Aline Sitoé Diatta est une résistante de ___.", "La résistante Aline Sitoé Diatta venait de ___, au sud du pays."],
      hint: "C'est le sud du pays, séparé du nord par la Gambie.",
    },
  ],
  extras: ["Sine-Saloum", "Fouta"],
};

const PAI_YEARS: Pool = {
  items: [
    {
      id: "bamba-annee",
      q: ["En quelle année Cheikh Ahmadou Bamba a-t-il été exilé au Gabon ?", "Cheikh Ahmadou Bamba est parti en exil au Gabon, mais en quelle année ?"],
      a: "1895",
      s: ["Cheikh Ahmadou Bamba a été exilé au Gabon en ___.", "En ___, Cheikh Ahmadou Bamba part en exil."],
      hint: "C'était avant la fin du XIXe siècle.",
    },
    {
      id: "aline-annee",
      q: ["En quelle année Aline Sitoé Diatta a-t-elle été arrêtée ?", "Aline Sitoé Diatta a été arrêtée pendant la guerre, mais en quelle année ?"],
      a: "1943",
      s: ["Aline Sitoé Diatta a été arrêtée en ___.", "En ___, Aline Sitoé Diatta est arrêtée."],
      hint: "C'était pendant la Seconde Guerre mondiale.",
    },
    {
      id: "independance-annee",
      q: ["En quelle année le Sénégal est-il devenu indépendant ?", "Le Sénégal est devenu libre, mais en quelle année ?"],
      a: "1960",
      s: ["Le Sénégal est devenu indépendant en ___.", "En ___, le Sénégal est devenu indépendant."],
      hint: "Cette année est au début des années soixante.",
    },
  ],
  extras: ["1886", "1902"],
};

const PAI_DATE: Pool = {
  items: [
    {
      id: "independance-jour",
      q: ["Quel jour fête-t-on l'indépendance du Sénégal ?", "Quelle est la date de la fête de l'indépendance du Sénégal ?"],
      a: "Le 4 avril",
      ga: "4 avril",
      s: ["L'indépendance du Sénégal est fêtée le ___.", "Le ___ est la fête de l'indépendance du Sénégal."],
      hint: "Cette fête a lieu au printemps.",
    },
  ],
  extras: ["Le 1er mai", "Le 14 juillet", "Le 20 août"],
  gextras: ["1er mai", "14 juillet", "20 août"],
};

const PAI_CITY: Pool = {
  items: [
    {
      id: "touba",
      q: ["Quelle ville sainte Cheikh Ahmadou Bamba a-t-il fondée ?", "Dans quelle ville sainte se trouve la grande mosquée des mourides ?"],
      a: "Touba",
      s: ["Cheikh Ahmadou Bamba a fondé la ville sainte de ___.", "La grande mosquée des mourides se trouve à ___."],
      hint: "Cette ville est au centre du pays, dans la région de Diourbel.",
    },
  ],
  extras: ["Dakar", "Kaolack", "Saint-Louis"],
};

const PAI_WAY: Pool = {
  items: [
    {
      id: "mouridisme",
      q: ["Quelle voie religieuse Cheikh Ahmadou Bamba a-t-il fondée ?", "Comment s'appelle la voie religieuse de Cheikh Ahmadou Bamba ?"],
      a: "Mouridisme",
      also: ["mouridisme"],
      ga: "mouridisme",
      s: ["Cheikh Ahmadou Bamba est le fondateur du ___.", "Les mourides sont les disciples du ___."],
      hint: "Ses disciples travaillent et prient pour leur guide.",
    },
  ],
  extras: ["Christianisme", "Bouddhisme"],
  gextras: ["christianisme", "bouddhisme"],
};

const PAI_POOLS = [PAI_WHO, PAI_COUNTRY, PAI_REGION, PAI_YEARS, PAI_DATE, PAI_CITY, PAI_WAY] as const;
const PAI_QCM = questionRows("hi-cm1-paix", PAI_POOLS);
const PAI_TROU = gapRows("hi-cm1-paix", PAI_POOLS);
const PAI_ECRIRE = writeRows("hi-cm1-paix", PAI_POOLS);

const PAI_ORDRE: readonly OrderRow[] = [
  order("Range ces événements du plus ancien au plus récent.", ["L'exil de Cheikh Ahmadou Bamba", "L'arrestation d'Aline Sitoé Diatta", "La fête de l'indépendance"], "pai-ordre:evenements"),
  order("Range ces personnes selon le temps de leur action, de la plus ancienne à la plus récente.", ["Cheikh Ahmadou Bamba", "Aline Sitoé Diatta", "Léopold Sédar Senghor"], "pai-ordre:personnes"),
  order("Range ces faits du plus ancien au plus récent.", ["Départ de Bamba pour le Gabon", "Arrestation d'Aline Sitoé Diatta", "Premier président du Sénégal"], "pai-ordre:faits"),
  order("Range ces moments de l'histoire du plus ancien au plus récent.", ["Bamba est exilé", "Aline est arrêtée", "Le Sénégal est indépendant"], "pai-ordre:moments"),
  order("Range ces faits du plus ancien au plus récent.", ["Cheikh Ahmadou Bamba part en exil", "Aline Sitoé Diatta est arrêtée", "Le Sénégal est indépendant"], "pai-ordre:exil"),
  order("Range ces dates du plus ancien au plus récent.", ["Exil de Bamba", "Arrestation d'Aline", "Indépendance du pays"], "pai-ordre:dates"),
];

const PAI_RELIER: readonly LinkRow[] = [
  link("Relie chaque personne à ce qui la rappelle.", [["Cheikh Ahmadou Bamba", "Exil au Gabon"], ["Aline Sitoé Diatta", "Résistante de Casamance"], ["Léopold Sédar Senghor", "Premier président"]]),
  link("Relie chaque nom à son lieu.", [["Cheikh Ahmadou Bamba", "Touba"], ["Aline Sitoé Diatta", "Casamance"], ["Léopold Sédar Senghor", "Sénégal"]]),
  link("Relie chaque événement à ce qu'il marque.", [["Le 4 avril", "Indépendance"], ["Le départ pour le Gabon", "L'exil de Bamba"], ["L'arrestation de 1943", "Aline Sitoé Diatta"]]),
  link("Relie chaque personne à son action.", [["Cheikh Ahmadou Bamba", "Fonde le mouridisme"], ["Aline Sitoé Diatta", "Refuse les ordres de l'administration"], ["Léopold Sédar Senghor", "Dirige le pays libre"]]),
  link("Relie chaque date à ce qu'elle rappelle.", [["1895", "Exil de Bamba"], ["1943", "Arrestation d'Aline"], ["1960", "Indépendance"]]),
  link("Relie chaque lieu à son souvenir.", [["Touba", "Ville sainte du mouridisme"], ["Casamance", "Région d'Aline Sitoé Diatta"], ["Gabon", "Pays de l'exil de Bamba"]]),
];

const PAI_GLISSER = [
  ...sortRows("Glisse chaque fait dans la bonne case.", ["Avant l'indépendance", "Après l'indépendance"], ["Exil de Bamba", "Arrestation d'Aline", "Résistance sans armes"], ["Fête du 4 avril", "Premier président", "Pays libre"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque nom dans la bonne case.", ["Personne", "Lieu"], ["Bamba", "Aline Sitoé Diatta", "Senghor"], ["Gabon", "Casamance", "Touba"], SORT_HINTS, 4),
];

export const makeCm1PaiQcm: Make = (ctx) => ce2Question(ctx, "cm1-pai-qcm", "Cheikh Ahmadou Bamba, Aline Sitoé Diatta et l'indépendance", PAI_QCM, 3);
export const makeCm1PaiTrou: Make = (ctx) => ce2Gap(ctx, "cm1-pai-trou", "compléter une phrase sur la résistance sans les armes", PAI_TROU, 2, 1);
export const makeCm1PaiEcrire: Make = (ctx) => ce2Write(ctx, "cm1-pai-ecrire", "écrire un fait sur la résistance sans les armes", PAI_ECRIRE, 1, 2);
export const makeCm1PaiOrdre: Make = (ctx) => ce2Order(ctx, "cm1-pai-ordre", "ranger les faits de la marche vers l'indépendance", PAI_ORDRE);
export const makeCm1PaiRelier: Make = (ctx) => ce2Link(ctx, "cm1-pai-relier", "relier une personne à son action ou à son lieu", PAI_RELIER);
export const makeCm1PaiGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-pai-glisser", "classer les faits avant et après l'indépendance", PAI_GLISSER, 2);
