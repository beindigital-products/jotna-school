/**
 * LES GABARITS DE L'HISTOIRE DU CM2 : les grands empires, les grandes découvertes et la traite négrière, la conquête coloniale, la
 * marche vers l'indépendance, les progrès des sciences et des techniques (`hi-cm2-empires`, `-traite`, `-colonisation`, `-independance`,
 * `-progres`).
 *
 * Sur les échantillons que le modèle écrivait, l'histoire était la matière qui se trompait le plus : une date inventée, un souverain
 * donné à un autre empire, un fait que la fiche ne dit pas. Ici chaque réponse se lit dans un tableau fermé, écrit à la main, qui ne dit
 * que ce que la fiche dit, plus quelques faits que personne ne discute (la première capitale de l'AOF, la loi Lamine Guèye). La liste des
 * faits qui ne sont pas dans la fiche est donnée dans la description de la PR, pour qu'on la relise.
 *
 * Même construction que `cm1Histoire.ts` (tableaux de faits `Pool` de `cm1Faits.ts`, outils de `ce2Outils.ts`), à cinq paliers :
 * - Un lot (`Pool`) ne contient que des réponses de même sorte. Les mauvais choix sont les réponses des autres faits du lot et ses intrus.
 * - Quand deux faits ont une réponse juste pour la même question, l'autre réponse est dans `not` : elle n'est jamais proposée.
 * - Un fait est posé une seule fois par palier, quel que soit le jeu : deux lots qui parlent du même fait donnent le même `id`.
 * - Un indice parle du sujet sans écrire un chiffre ni un mot de quatre lettres ou plus de la réponse, d'une tuile ou d'une case.
 * - Une phrase à trou n'a jamais « à » ni « de » devant le trou quand les options changent de genre (« au » et « à la » trahiraient la réponse).
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
// LES GRANDS EMPIRES (hi-cm2-empires)
// ===========================================================================

const EMP_EMPIRE: Pool = {
  items: [
    {
      id: "ghana-koumbi",
      q: ["Quel empire avait pour capitale la ville de Koumbi Saleh ?", "Dans quel empire se trouvait la grande ville de Koumbi Saleh ?", "Koumbi Saleh était la capitale de quel empire ?"],
      a: "Ghana",
      also: ["Empire du Ghana", "Le Ghana"],
      ga: "l'empire du Ghana",
      s: ["La ville de Koumbi Saleh était la capitale de ___.", "Koumbi Saleh était la grande ville de ___."],
      hint: "Cet État, le plus ancien des trois, s'étendait au sud du Sahara.",
    },
    {
      id: "mali-soundiata",
      q: ["Dans quel empire Soundiata Keïta a-t-il régné ?", "Quel empire Soundiata Keïta a-t-il fondé ?", "Quel empire est lié au nom de Soundiata Keïta ?"],
      a: "Mali",
      also: ["Empire du Mali", "Le Mali"],
      ga: "l'empire du Mali",
      s: ["Soundiata Keïta a fondé ___.", "Le roi Soundiata Keïta a régné sur ___."],
      hint: "Cet État a dominé l'Afrique de l'Ouest après le premier.",
    },
    {
      id: "mali-moussa",
      q: ["Quel empire était dirigé par Mansa Moussa ?", "Dans quel empire Mansa Moussa était-il le souverain ?", "Mansa Moussa a régné sur quel empire ?"],
      a: "Mali",
      also: ["Empire du Mali", "Le Mali"],
      ga: "l'empire du Mali",
      s: ["Mansa Moussa a régné sur ___.", "Le célèbre Mansa Moussa dirigeait ___."],
      hint: "Ce pays a le même nom qu'un État voisin du Sénégal à l'est.",
    },
    {
      id: "mali-charte",
      q: ["Quel empire est célèbre pour sa charte du Kouroukan Fouga ?", "Quel empire avait pour loi le Kouroukan Fouga ?", "Le Kouroukan Fouga était la charte de quel empire ?"],
      a: "Mali",
      also: ["Empire du Mali", "Le Mali"],
      ga: "l'empire du Mali",
      s: ["La charte du Kouroukan Fouga était la loi de ___.", "Le Kouroukan Fouga est la charte de ___."],
      hint: "Ses règles organisaient la vie des habitants de cet État.",
    },
    {
      id: "songhai-gao",
      q: ["Quel empire avait pour capitale la ville de Gao ?", "Dans quel empire se trouvait la grande ville de Gao ?", "Gao était la capitale de quel empire ?"],
      a: "Songhaï",
      also: ["Empire songhaï", "Le Songhaï", "Songhai", "Empire songhai"],
      ga: "l'empire songhaï",
      s: ["La ville de Gao était la capitale de ___.", "Gao était la grande ville de ___."],
      hint: "C'est le plus récent des trois, il s'étendait le long du fleuve Niger.",
    },
    {
      id: "songhai-sonni",
      q: ["Dans quel empire Sonni Ali Ber a-t-il régné ?", "Quel empire Sonni Ali Ber a-t-il dirigé depuis Gao ?", "Quel empire est lié au nom de Sonni Ali Ber ?"],
      a: "Songhaï",
      also: ["Empire songhaï", "Le Songhaï", "Songhai", "Empire songhai"],
      ga: "l'empire songhaï",
      s: ["Sonni Ali Ber a régné sur ___.", "Le souverain Sonni Ali Ber dirigeait ___."],
      hint: "Ce grand État est venu après celui de Soundiata Keïta.",
    },
    {
      id: "songhai-askia",
      q: ["Quel empire avait pour souverain Askia Mohammed ?", "Dans quel empire Askia Mohammed a-t-il régné ?", "Askia Mohammed a dirigé quel empire ?"],
      a: "Songhaï",
      also: ["Empire songhaï", "Le Songhaï", "Songhai", "Empire songhai"],
      ga: "l'empire songhaï",
      s: ["Askia Mohammed a régné sur ___.", "Le souverain Askia Mohammed dirigeait ___."],
      hint: "Sa capitale était une ville au bord d'un grand fleuve.",
    },
  ],
};

const EMP_PEOPLE: Pool = {
  items: [
    {
      id: "mali-soundiata",
      q: ["Quel souverain a fondé l'empire du Mali ?", "Quel roi est le fondateur de l'empire du Mali ?", "Qui a créé l'empire du Mali ?"],
      a: "Soundiata Keïta",
      also: ["Soundiata", "Soundiata Keita", "Sunjata"],
      s: ["___ a fondé l'empire du Mali.", "Le fondateur de l'empire du Mali se nomme ___."],
      hint: "Les conteurs de son pays chantent encore ses exploits.",
    },
    {
      id: "mali-moussa",
      q: ["Quel souverain du Mali est célèbre pour son pèlerinage à La Mecque ?", "Quel souverain du Mali est parti en pèlerinage à La Mecque en 1324 ?", "Quel souverain du Mali a quitté son pays en 1324 pour aller à La Mecque ?"],
      a: "Mansa Moussa",
      also: ["Moussa", "Mansa Mousa", "Kankou Moussa"],
      s: ["___ est parti en pèlerinage à La Mecque en 1324.", "Le souverain du Mali ___ a fait un pèlerinage à La Mecque."],
      hint: "Il a fait un très long voyage religieux, loin de son royaume.",
    },
    {
      id: "songhai-sonni",
      q: ["Quel souverain songhaï a régné avant Askia Mohammed ?", "Qui dirigeait Gao avant Askia Mohammed ?", "Quel souverain de l'empire songhaï a précédé Askia Mohammed ?"],
      a: "Sonni Ali Ber",
      also: ["Sonni Ali", "Sonni Ali Ber"],
      not: ["Askia Mohammed"],
      s: ["___ a régné sur l'empire songhaï avant Askia Mohammed.", "Avant Askia Mohammed, le souverain de Gao s'appelait ___."],
      hint: "Il a gouverné à une époque plus ancienne que celle de son successeur.",
    },
    {
      id: "songhai-askia",
      q: ["Quel souverain songhaï a pris le pouvoir après Sonni Ali Ber ?", "Quel souverain de Gao a fondé une nouvelle dynastie après Sonni Ali Ber ?", "Qui a gouverné l'empire songhaï à la suite de Sonni Ali Ber ?"],
      a: "Askia Mohammed",
      also: ["Askia", "Mohammed Askia", "Askia Mohamed", "Mohammed Touré"],
      not: ["Sonni Ali Ber"],
      s: ["___ a pris le pouvoir à Gao après Sonni Ali Ber.", "Après Sonni Ali Ber, ___ a gouverné l'empire songhaï."],
      hint: "Il a fondé une famille de souverains qui a duré longtemps.",
    },
  ],
};

const EMP_CITY: Pool = {
  items: [
    {
      id: "ghana-koumbi",
      q: ["Quelle ville était la capitale de l'empire du Ghana ?", "Quel est le nom de la capitale de l'empire du Ghana ?", "Dans quelle ville les rois du Ghana gouvernaient-ils ?"],
      a: "Koumbi Saleh",
      also: ["Koumbi-Saleh", "Koumbi"],
      s: ["La capitale de l'empire du Ghana se nommait ___.", "Les rois du Ghana gouvernaient depuis la ville de ___."],
      hint: "Cette ville se trouvait au bord du désert, sur la route de l'or.",
    },
    {
      id: "songhai-gao",
      q: ["Quelle ville était la capitale de l'empire songhaï ?", "Quel est le nom de la capitale de l'empire songhaï ?", "Dans quelle ville les souverains songhaï gouvernaient-ils ?"],
      a: "Gao",
      not: ["Tombouctou"],
      s: ["La capitale de l'empire songhaï se nommait ___.", "Les souverains songhaï gouvernaient depuis la ville de ___."],
      hint: "Elle borde un grand fleuve d'Afrique de l'Ouest.",
    },
  ],
  extras: ["Tombouctou", "Dakar"],
};

const EMP_CHARTE: Pool = {
  items: [
    {
      id: "mali-charte",
      q: ["Comment s'appelle la charte du Mali ancien proclamée sous Soundiata Keïta ?", "Quelle charte contenait les grandes règles de vie de l'empire du Mali ?", "Quel nom porte la célèbre charte de l'empire du Mali ?"],
      a: "Kouroukan Fouga",
      also: ["Kurukan Fuga", "Kouroukan-Fouga", "Le Kouroukan Fouga", "La charte du Kouroukan Fouga"],
      s: ["Sous Soundiata Keïta, le Mali a reçu une charte appelée ___.", "La charte de l'empire du Mali porte le nom de ___."],
      hint: "Ce texte réunit des règles pour bien vivre ensemble.",
    },
  ],
  extras: ["Magna Carta", "Code civil"],
  onlyExtras: true,
};

const EMP_YEAR: Pool = {
  items: [
    {
      id: "moussa-1324",
      q: ["En quelle année Mansa Moussa est-il parti en pèlerinage à La Mecque ?", "Quelle année marque le pèlerinage de Mansa Moussa à La Mecque ?", "Mansa Moussa est parti pour La Mecque, mais en quelle année ?"],
      a: "1324",
      s: ["Mansa Moussa est parti en pèlerinage à La Mecque en ___.", "En ___, Mansa Moussa a fait son pèlerinage à La Mecque."],
      hint: "C'est au début d'un siècle, il y a plus de six cents ans.",
    },
  ],
  extras: ["1224", "1424", "1524"],
};

const EMP_GOLD: Pool = {
  items: [
    {
      id: "ghana-or",
      q: ["Quel métal précieux a fait la richesse de l'empire du Ghana ?", "Pour quel métal précieux l'empire du Ghana était-il célèbre ?", "Koumbi Saleh était riche grâce à quel métal précieux ?"],
      a: "Or",
      also: ["L'or", "or"],
      ga: "or",
      s: ["L'empire du Ghana était célèbre pour son ___.", "Koumbi Saleh était riche grâce à son ___."],
      hint: "Ce métal jaune brille et sert à fabriquer des bijoux.",
    },
  ],
  extras: ["Argent", "Platine"],
  gextras: ["argent", "platine"],
};

const EMP_GRIOT: Pool = {
  items: [
    {
      id: "griot",
      q: ["Quel conteur transmet l'histoire de Soundiata Keïta par la parole ?", "Quel nom porte le conteur qui garde la mémoire d'un peuple ?"],
      a: "Griot",
      also: ["Le griot", "Djeli", "Griotte"],
      ga: "griot",
      s: ["Celui qui garde la mémoire d'un peuple se nomme le ___.", "Le conteur qui chante l'histoire de Soundiata Keïta est le ___."],
      hint: "Il chante, il raconte et il se souvient des ancêtres.",
    },
  ],
  extras: ["Forgeron", "Marchand"],
  gextras: ["forgeron", "marchand"],
};

const EMP_POOLS = [EMP_EMPIRE, EMP_PEOPLE, EMP_CITY, EMP_CHARTE, EMP_YEAR, EMP_GOLD, EMP_GRIOT] as const;
const EMP_QCM = questionRows("hi-cm2-empires", EMP_POOLS);
const EMP_TROU = gapRows("hi-cm2-empires", EMP_POOLS);
const EMP_ECRIRE = writeRows("hi-cm2-empires", EMP_POOLS);

const EMP_ORDRE: readonly OrderRow[] = [
  order("Range ces empires du plus ancien au plus récent.", ["Empire du Ghana", "Empire du Mali", "Empire songhaï"], "emp-ordre:empires"),
  order("Range ces souverains du plus ancien au plus récent.", ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber", "Askia Mohammed"], "emp-ordre:souverains"),
  order("Range ces souverains du plus ancien au plus récent.", ["Soundiata Keïta", "Mansa Moussa", "Askia Mohammed"], "emp-ordre:trois"),
  order("Range ces souverains du plus ancien au plus récent.", ["Mansa Moussa", "Sonni Ali Ber", "Askia Mohammed"], "emp-ordre:songhai"),
  order("Range ces événements du plus ancien au plus récent.", ["Soundiata Keïta fonde l'empire du Mali", "Mansa Moussa part pour La Mecque", "Askia Mohammed prend le pouvoir à Gao"], "emp-ordre:evenements"),
];

const EMP_RELIER: readonly LinkRow[] = [
  link("Relie chaque empire à ce qui le fait connaître.", [["Empire du Ghana", "Koumbi Saleh"], ["Empire du Mali", "Soundiata Keïta"], ["Empire songhaï", "Gao"]]),
  link("Relie chaque souverain à ce qu'il a fait.", [["Soundiata Keïta", "Fonde l'empire du Mali"], ["Mansa Moussa", "Part pour La Mecque"], ["Askia Mohammed", "Prend le pouvoir à Gao"]]),
  link("Relie chaque nom à son rôle.", [["Koumbi Saleh", "Capitale du Ghana"], ["Gao", "Capitale de l'empire songhaï"], ["Mansa Moussa", "Souverain du Mali"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Kouroukan Fouga", "Charte du Mali"], ["Or", "Richesse du Ghana"], ["Pèlerinage", "Voyage religieux"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Griot", "Conteur de l'histoire"], ["Kouroukan Fouga", "Charte du Mali"], ["Askia Mohammed", "Souverain de Gao"]]),
];

const EMP_GLISSER = [
  ...sortRows(
    "Glisse chaque nom dans la bonne case.",
    ["Empire du Mali", "Empire songhaï"],
    ["Soundiata Keïta", "Mansa Moussa", "Kouroukan Fouga"],
    ["Gao", "Sonni Ali Ber", "Askia Mohammed"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque nom dans la bonne case.",
    ["Souverain", "Ville"],
    ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber", "Askia Mohammed"],
    ["Koumbi Saleh", "Gao", "Tombouctou"],
    SORT_HINTS,
    6,
  ),
];

export const makeCm2EmpQcm: Make = (ctx) => ce2Question(ctx, "cm2-emp-qcm", "les empires du Ghana, du Mali et de Songhaï", EMP_QCM, 3);
export const makeCm2EmpTrou: Make = (ctx) => ce2Gap(ctx, "cm2-emp-trou", "compléter une phrase sur les grands empires", EMP_TROU, 2, 1);
export const makeCm2EmpEcrire: Make = (ctx) => ce2Write(ctx, "cm2-emp-ecrire", "écrire un fait sur les grands empires", EMP_ECRIRE, 1, 2);
export const makeCm2EmpOrdre: Make = (ctx) => ce2Order(ctx, "cm2-emp-ordre", "ranger les empires et leurs souverains dans le temps", EMP_ORDRE);
export const makeCm2EmpRelier: Make = (ctx) => ce2Link(ctx, "cm2-emp-relier", "relier un empire, un souverain ou une ville à son rôle", EMP_RELIER);
export const makeCm2EmpGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-emp-glisser", "classer les noms de l'empire du Mali et de l'empire songhaï", EMP_GLISSER, 2);

// ===========================================================================
// LES GRANDES DÉCOUVERTES ET LA TRAITE NÉGRIÈRE (hi-cm2-traite)
// ===========================================================================

const TRA_INVENTION: Pool = {
  items: [
    {
      id: "boussole",
      q: ["Quel instrument aide les marins à trouver le nord ?", "Quel objet à aiguille aimantée indique toujours le nord ?", "Quel instrument permet de s'orienter en pleine mer ?"],
      a: "Boussole",
      also: ["La boussole"],
      ga: "la boussole",
      s: ["Pour trouver le nord en mer, les marins utilisent ___.", "Une aiguille aimantée qui indique le nord, c'est ___."],
      hint: "Une petite aiguille y tourne toujours vers le même côté.",
    },
    {
      id: "caravelle",
      q: ["Quel navire léger à voiles a permis aux Portugais d'explorer la côte africaine ?", "Quel bateau rapide a servi aux grands voyages des Européens au XVe siècle ?", "Comment se nomme le navire à voiles des grands voyages d'exploration ?"],
      a: "Caravelle",
      also: ["La caravelle"],
      ga: "la caravelle",
      s: ["Les navigateurs portugais voyageaient sur ___.", "Pour explorer les côtes africaines, les Portugais utilisaient ___."],
      hint: "Ce bateau léger avançait grâce au vent dans ses voiles.",
    },
    {
      id: "imprimerie",
      q: ["Quelle invention permet de fabriquer beaucoup de livres identiques ?", "Quelle invention du XVe siècle a permis de copier très vite des livres ?", "Quelle invention a fait circuler les livres bien plus vite que la copie à la main ?"],
      a: "Imprimerie",
      also: ["L'imprimerie"],
      ga: "l'imprimerie",
      s: ["Pour fabriquer beaucoup de livres identiques, on utilise ___.", "Avec ___, les livres ont circulé plus vite qu'avant."],
      hint: "Elle remplace le travail du copiste qui écrit chaque page à la main.",
    },
  ],
};

const TRA_TERME: Pool = {
  items: [
    {
      id: "triangulaire",
      q: ["Comment appelle-t-on le commerce qui reliait trois continents en triangle ?", "Quel nom porte le trajet des bateaux entre trois continents, en triangle ?"],
      a: "Commerce triangulaire",
      also: ["Le commerce triangulaire"],
      not: ["Traite négrière"],
      ga: "le commerce triangulaire",
      s: ["Le trajet des bateaux entre trois continents, en triangle, se nomme ___.", "Un commerce qui relie trois continents en triangle se nomme ___."],
      hint: "Son nom vient de la forme que dessinent les trois étapes sur une carte.",
    },
    {
      id: "traite",
      q: ["Comment appelle-t-on le fait d'acheter et de vendre des Africains comme esclaves ?", "Quel nom porte le fait d'enlever des Africains pour les vendre comme esclaves ?"],
      a: "Traite négrière",
      also: ["La traite négrière", "Traite des Noirs", "La traite des Noirs", "Traite négrière"],
      not: ["Commerce triangulaire"],
      ga: "la traite négrière",
      s: ["Acheter et vendre des Africains comme esclaves se nomme ___.", "Enlever des Africains pour les vendre comme esclaves se nomme ___."],
      hint: "Des personnes étaient traitées comme une marchandise.",
    },
    {
      id: "esclavage",
      q: ["Comment appelle-t-on la situation d'une personne qui appartient à un maître sans être libre ?", "Quel mot désigne le fait d'appartenir à un maître sans être libre ?"],
      a: "Esclavage",
      also: ["L'esclavage"],
      ga: "l'esclavage",
      s: ["Appartenir à un maître sans être libre se nomme ___.", "Vivre sous les ordres d'un maître, sans liberté, se nomme ___."],
      hint: "La personne ne décide ni de son travail ni de sa vie.",
    },
    {
      id: "abolition",
      q: ["Comment appelle-t-on la décision de supprimer l'esclavage par la loi ?", "Quel mot désigne la fin de l'esclavage décidée par une loi ?"],
      a: "Abolition",
      also: ["L'abolition"],
      not: ["Esclavage"],
      ga: "l'abolition",
      s: ["Mettre fin à l'esclavage par une loi se nomme ___.", "Une loi qui supprime le travail forcé des esclaves s'appelle ___."],
      hint: "Une loi interdit pour toujours une pratique injuste.",
    },
  ],
};

const TRA_ILE: Pool = {
  items: [
    {
      id: "goree",
      q: ["Quelle île du Sénégal garde la Maison des Esclaves ?", "Sur quelle île, en face de Dakar, visite-t-on la Maison des Esclaves ?", "Quelle île, tout près de Dakar, rappelle la traite des Noirs ?"],
      a: "Gorée",
      also: ["L'île de Gorée", "Ile de Gorée", "Goree"],
      s: ["La Maison des Esclaves se trouve sur l'île de ___.", "L'île de ___, en face de Dakar, garde le souvenir de la traite des Noirs."],
      hint: "C'est une petite île toute proche de la capitale.",
    },
  ],
  extras: ["Saint-Louis", "Carabane", "Joal-Fadiouth"],
};

const TRA_MAISON: Pool = {
  items: [
    {
      id: "maison-esclaves",
      q: ["Quel bâtiment de Gorée rappelle la traite des Noirs ?", "Comment s'appelle la maison de Gorée devenue un lieu de mémoire de la traite ?", "Quel lieu de Gorée garde le souvenir des Africains emmenés comme esclaves ?"],
      a: "Maison des Esclaves",
      also: ["La Maison des Esclaves"],
      ga: "la Maison des Esclaves",
      s: ["Sur l'île de Gorée, le lieu de mémoire de la traite se nomme ___.", "À Gorée, les visiteurs découvrent ___."],
      hint: "Les visiteurs y entendent l'histoire de ceux qui ont été emmenés.",
    },
  ],
  extras: ["Grande Mosquée", "Palais de justice"],
  gextras: ["la Grande Mosquée", "le Palais de justice"],
  onlyExtras: true,
};

const TRA_CONTINENT: Pool = {
  items: [
    {
      id: "afrique-captifs",
      q: ["De quel continent les captifs étaient-ils emmenés dans le commerce triangulaire ?", "Sur quel continent les marchands européens achetaient-ils des captifs ?"],
      a: "Afrique",
      ga: "Afrique",
      s: ["Les bateaux chargeaient des captifs en ___ avant la traversée.", "Les captifs du commerce triangulaire étaient embarqués en ___."],
      hint: "C'est le continent où se trouve le Sénégal.",
    },
    {
      id: "amerique-captifs",
      q: ["Vers quel continent les bateaux emmenaient-ils les captifs africains ?", "Sur quel continent les captifs devaient-ils travailler dans les plantations ?"],
      a: "Amérique",
      ga: "Amérique",
      s: ["Les captifs étaient emmenés travailler dans les plantations, en ___.", "Après la traversée de l'océan, les captifs arrivaient en ___."],
      hint: "On y arrive après avoir traversé tout l'océan Atlantique.",
    },
    {
      id: "europe-sucre",
      q: ["Vers quel continent les bateaux rapportaient-ils le sucre et le coton ?", "Quel continent recevait le sucre, le coton et le café des plantations ?"],
      a: "Europe",
      ga: "Europe",
      s: ["Les bateaux rentraient chargés de sucre et de coton, en ___.", "Le sucre et le café des plantations étaient vendus en ___."],
      hint: "Les bateaux y retournaient à la fin du voyage en triangle.",
    },
  ],
  extras: ["Asie", "Océanie"],
};

const TRA_YEAR: Pool = {
  items: [
    {
      id: "abolition-1848",
      q: ["En quelle année l'esclavage a-t-il pris fin dans les colonies françaises ?", "Dans les colonies françaises, quelle année a marqué la fin de l'esclavage ?", "L'esclavage a pris fin dans les colonies françaises, mais en quelle année ?"],
      a: "1848",
      s: ["L'esclavage a pris fin dans les colonies françaises en ___.", "En ___, l'esclavage a été aboli dans les colonies françaises."],
      hint: "C'est au milieu du siècle qui précède celui de l'indépendance.",
    },
  ],
  extras: ["1748", "1948"],
};

const TRA_SIECLE: Pool = {
  items: [
    {
      id: "xve-siecle",
      q: ["Les caravelles portugaises explorent la côte africaine à partir de quel siècle ?", "À partir de quel siècle les Portugais explorent-ils la côte africaine en caravelle ?"],
      a: "XVe siècle",
      also: ["15e siècle", "XVe"],
      ga: "XVe siècle",
      s: ["Les Portugais explorent la côte africaine en caravelle à partir du ___.", "C'est à partir du ___ que les caravelles explorent la côte africaine."],
      hint: "C'est l'époque qu'on appelle celle des grandes découvertes.",
    },
  ],
  extras: ["XIe siècle", "XIXe siècle"],
};

const TRA_POOLS = [TRA_INVENTION, TRA_TERME, TRA_ILE, TRA_MAISON, TRA_CONTINENT, TRA_YEAR, TRA_SIECLE] as const;
const TRA_QCM = questionRows("hi-cm2-traite", TRA_POOLS);
const TRA_TROU = gapRows("hi-cm2-traite", TRA_POOLS);
const TRA_ECRIRE = writeRows("hi-cm2-traite", TRA_POOLS);

const TRA_ORDRE: readonly OrderRow[] = [
  order("Range les étapes d'un voyage du commerce triangulaire, du premier au dernier.", ["Départ d'Europe avec des marchandises", "Achat de captifs en Afrique", "Traversée vers l'Amérique", "Retour en Europe avec le sucre et le coton"], "tra-ordre:voyage"),
  order("Range les continents du voyage du commerce triangulaire, en partant de l'Europe.", ["Europe", "Afrique", "Amérique"], "tra-ordre:continents"),
  order("Range ces événements du plus ancien au plus récent.", ["Les caravelles explorent la côte africaine", "Le commerce triangulaire relie trois continents", "L'esclavage prend fin dans les colonies françaises"], "tra-ordre:evenements"),
  order("Range ces événements du plus ancien au plus récent.", ["Les caravelles explorent la côte africaine", "Les captifs traversent l'Atlantique", "L'esclavage prend fin dans les colonies françaises"], "tra-ordre:atlantique"),
  order("Range les étapes d'une traversée en caravelle, du premier au dernier.", ["Charger les provisions", "Hisser les voiles", "Suivre la boussole", "Arriver au port"], "tra-ordre:caravelle"),
  order("Range les étapes de la fabrication d'un livre imprimé, du premier au dernier.", ["Écrire le texte", "Composer les lettres de la page", "Imprimer la page", "Relier les feuilles"], "tra-ordre:livre"),
];

const TRA_RELIER: readonly LinkRow[] = [
  link("Relie chaque invention à ce qu'elle permet.", [["Boussole", "Trouver le nord"], ["Caravelle", "Naviguer au loin"], ["Imprimerie", "Fabriquer des livres"]]),
  link("Relie chaque lieu ou chaque date à ce qu'il rappelle.", [["Gorée", "Île en face de Dakar"], ["Maison des Esclaves", "Souvenir de la traite"], ["1848", "Fin de l'esclavage"]]),
  link("Relie chaque continent à son rôle dans le triangle.", [["Afrique", "D'où partent les captifs"], ["Amérique", "Là où ils travaillent"], ["Europe", "Là où arrive le sucre"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Traite négrière", "Vente d'Africains"], ["Esclavage", "Pas de liberté"], ["Abolition", "Fin par la loi"]]),
  link("Relie chaque continent à ce qu'il envoie.", [["Europe", "Marchandises"], ["Afrique", "Captifs"], ["Amérique", "Du sucre et du coton"]]),
  link("Relie chaque invention à son effet sur les voyages.", [["Boussole", "Trouver sa route en mer"], ["Caravelle", "Aller plus loin en mer"], ["Imprimerie", "Faire circuler les livres"]]),
];

const TRA_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Invention", "Lieu"],
    ["Boussole", "Caravelle", "Imprimerie"],
    ["Gorée", "Afrique", "Amérique", "Europe"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Vers l'Amérique", "Vers l'Europe"],
    ["Captifs africains", "Esclaves", "Hommes et femmes vendus"],
    ["Sucre", "Coton", "Café"],
    SORT_HINTS,
    4,
  ),
];

export const makeCm2TraQcm: Make = (ctx) => ce2Question(ctx, "cm2-tra-qcm", "les inventions du XVe siècle et la traite négrière", TRA_QCM, 3);
export const makeCm2TraTrou: Make = (ctx) => ce2Gap(ctx, "cm2-tra-trou", "compléter une phrase sur la traite négrière", TRA_TROU, 2, 1);
export const makeCm2TraEcrire: Make = (ctx) => ce2Write(ctx, "cm2-tra-ecrire", "écrire un fait sur la traite négrière", TRA_ECRIRE, 1, 2);
export const makeCm2TraOrdre: Make = (ctx) => ce2Order(ctx, "cm2-tra-ordre", "ranger les étapes du commerce triangulaire", TRA_ORDRE);
export const makeCm2TraRelier: Make = (ctx) => ce2Link(ctx, "cm2-tra-relier", "relier une invention, un lieu ou un mot à son sens", TRA_RELIER);
export const makeCm2TraGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-tra-glisser", "classer les inventions, les lieux et ce qui voyage", TRA_GLISSER, 2);

// ===========================================================================
// LA CONQUÊTE COLONIALE (hi-cm2-colonisation)
// ===========================================================================

const COL_PERSON: Pool = {
  items: [
    {
      id: "faidherbe",
      q: ["Quel gouverneur français du Sénégal a mené la conquête coloniale ?", "Quel gouverneur est resté célèbre pour la conquête coloniale du Sénégal ?", "Quel gouverneur de la colonie du Sénégal a combattu El Hadji Oumar Tall ?"],
      a: "Louis Faidherbe",
      also: ["Faidherbe", "Le général Faidherbe"],
      s: ["___ était gouverneur du Sénégal pendant la conquête coloniale.", "Le gouverneur ___ a dirigé la conquête du Sénégal."],
      hint: "Cet officier français commandait la colonie au nom de son pays.",
    },
  ],
  extras: ["Blaise Diagne", "Lat Dior", "Léopold Sédar Senghor"],
  onlyExtras: true,
};

const COL_TITRE: Pool = {
  items: [
    {
      id: "faidherbe-titre",
      q: ["Quelle fonction Faidherbe occupait-il au Sénégal ?", "Quel titre portait Faidherbe, le chef de la colonie du Sénégal ?", "Comment appelle-t-on le chef que la France envoyait diriger la colonie du Sénégal ?"],
      a: "Gouverneur",
      also: ["Le gouverneur"],
      ga: "gouverneur",
      s: ["Faidherbe dirigeait la colonie du Sénégal avec le titre de ___.", "Le chef envoyé par la France pour diriger la colonie s'appelait ___."],
      hint: "Ce chef recevait ses ordres de la France.",
    },
  ],
  extras: ["Roi", "Président"],
  gextras: ["roi", "président"],
};

const COL_SIGLE: Pool = {
  items: [
    {
      id: "aof",
      q: ["Comment appelle-t-on le groupe de colonies françaises de l'Ouest africain créé en 1895 ?", "Quel sigle désigne les colonies françaises de l'Ouest africain réunies en 1895 ?", "Quel nom court désigne le groupe de colonies dont Dakar fut la capitale ?"],
      a: "AOF",
      also: ["L'AOF", "A.O.F."],
      ga: "l'AOF",
      s: ["Les colonies françaises de l'Ouest africain formaient ___.", "Dakar est devenue la capitale de ___."],
      hint: "Ce sigle réunit plusieurs colonies sous un seul gouverneur général.",
    },
  ],
  extras: ["AEF", "OUA", "UEMOA"],
  gextras: ["l'AEF", "l'OUA", "l'UEMOA"],
  onlyExtras: true,
};

const COL_SENS: Pool = {
  items: [
    {
      id: "aof",
      q: ["Que veut dire le sigle AOF ?", "Quel est le nom entier de l'AOF ?"],
      a: "Afrique-Occidentale française",
      also: ["Afrique Occidentale française", "Afrique-Occidentale Française"],
      s: ["Le sigle AOF veut dire ___.", "Les trois lettres AOF signifient ___."],
      hint: "Le nom dit où se trouvent ces colonies et quel pays les dirigeait.",
    },
  ],
  extras: ["Afrique-Équatoriale française", "Armée occidentale française"],
  onlyExtras: true,
};

const COL_CAPITALE: Pool = {
  items: [
    {
      id: "saint-louis-capitale",
      q: ["Quelle ville fut la première capitale de l'AOF ?", "Avant Dakar, quelle ville était la capitale de l'AOF ?", "Quelle ville du nord fut la capitale de l'AOF avant 1902 ?"],
      a: "Saint-Louis",
      not: ["Dakar"],
      s: ["La première capitale de l'AOF fut ___.", "Avant Dakar, la capitale de l'AOF était ___."],
      hint: "Cette ville se trouve à l'embouchure du fleuve, tout au nord.",
    },
    {
      id: "dakar-capitale",
      q: ["Quelle ville est devenue la capitale de l'AOF en 1902 ?", "Après Saint-Louis, quelle ville est devenue la capitale de l'AOF ?", "Quelle ville de la presqu'île du Cap-Vert a remplacé Saint-Louis comme capitale ?"],
      a: "Dakar",
      not: ["Saint-Louis"],
      s: ["Depuis 1902, la capitale de l'AOF était ___.", "___ est devenue la capitale de l'AOF en 1902."],
      hint: "Cette ville est aujourd'hui la capitale du Sénégal.",
    },
  ],
  extras: ["Gorée", "Thiès"],
};

const COL_YEAR: Pool = {
  items: [
    {
      id: "aof-1895",
      q: ["En quelle année l'AOF a-t-elle été créée ?", "Quelle année marque la création de l'AOF ?", "L'AOF a été créée, mais en quelle année ?"],
      a: "1895",
      s: ["L'AOF a été créée en ___.", "En ___, la France a créé l'AOF."],
      hint: "C'est à la fin du siècle de la conquête coloniale.",
    },
    {
      id: "dakar-1902",
      q: ["En quelle année Dakar est-elle devenue la capitale de l'AOF ?", "Quelle année a vu Dakar remplacer Saint-Louis comme capitale de l'AOF ?", "Dakar est devenue la capitale de l'AOF, mais en quelle année ?"],
      a: "1902",
      s: ["Dakar est devenue la capitale de l'AOF en ___.", "En ___, Dakar a remplacé Saint-Louis comme capitale de l'AOF."],
      hint: "C'est quelques années seulement après la création de l'AOF.",
    },
  ],
  extras: ["1885", "1912"],
};

const COL_TERME: Pool = {
  items: [
    {
      id: "colonie",
      q: ["Comment appelle-t-on un pays dirigé par un autre pays lointain ?", "Comment appelle-t-on un territoire pris et gouverné par un pays étranger ?", "Quand le Sénégal était dirigé par la France, quel nom portait ce territoire ?"],
      a: "Colonie",
      also: ["La colonie"],
      ga: "la colonie",
      s: ["Un territoire gouverné par un pays lointain se nomme ___.", "Le Sénégal fut gouverné par la France comme ___."],
      hint: "Ses habitants obéissaient à des chefs venus d'ailleurs.",
    },
    {
      id: "conquete",
      q: ["Comment appelle-t-on le fait de prendre un pays par la force ?", "Quel mot désigne la prise d'un territoire par les armes ?"],
      a: "Conquête",
      also: ["La conquête"],
      ga: "la conquête",
      s: ["Prendre un pays par la force se nomme ___.", "Prendre un territoire avec une armée se nomme ___."],
      hint: "Une armée arrive et s'empare d'un pays qui ne lui appartient pas.",
    },
    {
      id: "resistance",
      q: ["Comment appelle-t-on le fait de s'opposer à ceux qui occupent son pays ?", "Quel mot désigne la lutte des habitants contre la conquête ?"],
      a: "Résistance",
      also: ["La résistance"],
      ga: "la résistance",
      s: ["Refuser l'occupation de son pays et lutter contre elle se nomme ___.", "S'opposer à ceux qui occupent son pays se nomme ___."],
      hint: "Les habitants refusent de se soumettre à l'envahisseur.",
    },
  ],
};

const COL_TYPE: Pool = {
  items: [
    {
      id: "resistance-armee",
      q: ["Comment appelle-t-on la résistance de ceux qui ont pris les armes contre la conquête ?", "Quel nom porte la lutte de ceux qui ont combattu avec des armes ?"],
      a: "Résistance armée",
      also: ["La résistance armée"],
      ga: "résistance armée",
      s: ["Lat Dior et Alboury Ndiaye ont mené une ___ contre la conquête.", "Combattre avec des armes pour défendre son royaume est une ___."],
      hint: "Elle se joue sur le champ de bataille.",
    },
    {
      id: "resistance-pacifique",
      q: ["Comment appelle-t-on la résistance de ceux qui ont refusé la conquête sans prendre les armes ?", "Quel nom porte la lutte de ceux qui ont résisté sans se battre ?"],
      a: "Résistance pacifique",
      also: ["La résistance pacifique"],
      ga: "résistance pacifique",
      s: ["Cheikh Ahmadou Bamba a choisi une ___ contre la conquête.", "Refuser la conquête sans combattre est une ___."],
      hint: "On s'oppose à la conquête par la foi, par la parole et par le refus.",
    },
  ],
  extras: ["Soumission"],
  gextras: ["soumission"],
};

const COL_POOLS = [COL_PERSON, COL_TITRE, COL_SIGLE, COL_SENS, COL_CAPITALE, COL_YEAR, COL_TERME, COL_TYPE] as const;
const COL_QCM = questionRows("hi-cm2-colonisation", COL_POOLS);
const COL_TROU = gapRows("hi-cm2-colonisation", COL_POOLS);
const COL_ECRIRE = writeRows("hi-cm2-colonisation", COL_POOLS);

const COL_ORDRE: readonly OrderRow[] = [
  order("Range ces événements du plus ancien au plus récent.", ["Faidherbe devient gouverneur du Sénégal", "L'AOF est créée", "Dakar devient la capitale de l'AOF"], "col-ordre:evenements"),
  order("Range ces événements du plus ancien au plus récent.", ["La conquête coloniale du Sénégal", "La création de l'AOF", "L'indépendance du Sénégal"], "col-ordre:conquete"),
  order("Range ces événements du plus ancien au plus récent.", ["La création de l'AOF", "Dakar devient capitale", "Le Sénégal devient indépendant"], "col-ordre:capitale"),
  order("Range ces événements du plus ancien au plus récent.", ["Faidherbe gouverne le Sénégal", "Lat Dior meurt à Dékheulé", "L'AOF est créée"], "col-ordre:dekheule"),
  order("Range ces événements du plus ancien au plus récent.", ["L'AOF est créée", "Dakar devient la capitale", "La Fédération du Mali naît", "Le Sénégal devient indépendant"], "col-ordre:federation"),
];

const COL_RELIER: readonly LinkRow[] = [
  link("Relie chaque nom à son rôle.", [["Faidherbe", "Gouverneur du Sénégal"], ["Lat Dior", "Résiste avec les armes"], ["Cheikh Ahmadou Bamba", "Résiste sans les armes"]]),
  link("Relie chaque ville à son rôle.", [["Saint-Louis", "Première capitale de l'AOF"], ["Dakar", "Capitale de l'AOF depuis 1902"], ["Gorée", "Île en face de Dakar"]]),
  link("Relie chaque mot à son sens.", [["Colonie", "Pays dirigé de loin"], ["Conquête", "Prise par la force"], ["Résistance", "Lutte contre l'occupant"]]),
  link("Relie chaque sigle ou chaque date à ce qu'il désigne.", [["AOF", "Colonies françaises d'Afrique de l'Ouest"], ["1895", "Création de l'AOF"], ["1902", "Dakar devient capitale"]]),
  link("Relie chaque mot à un exemple.", [["Résistance armée", "Lat Dior"], ["Résistance pacifique", "Cheikh Ahmadou Bamba"], ["Conquête", "Faidherbe"]]),
  link("Relie chaque événement à son année.", [["Création de l'AOF", "1895"], ["Dakar devient capitale", "1902"], ["Indépendance du Sénégal", "1960"]]),
];

const COL_GLISSER = [
  ...sortRows(
    "Glisse chaque événement dans la bonne case.",
    ["Avant 1902", "Depuis 1902"],
    ["Création de l'AOF", "Saint-Louis capitale de l'AOF", "Faidherbe gouverneur"],
    ["Dakar capitale de l'AOF", "Indépendance du Sénégal", "Fête du 4 avril"],
    SORT_HINTS,
    9,
  ),
  ...sortRows(
    "Glisse chaque nom dans la bonne case.",
    ["Résistance armée", "Résistance pacifique"],
    ["Lat Dior", "Alboury Ndiaye", "El Hadji Oumar Tall"],
    ["Cheikh Ahmadou Bamba", "Aline Sitoé Diatta"],
    SORT_HINTS,
    3,
  ),
];

export const makeCm2ColQcm: Make = (ctx) => ce2Question(ctx, "cm2-col-qcm", "la conquête coloniale et l'AOF", COL_QCM, 3);
export const makeCm2ColTrou: Make = (ctx) => ce2Gap(ctx, "cm2-col-trou", "compléter une phrase sur la conquête coloniale", COL_TROU, 2, 1);
export const makeCm2ColEcrire: Make = (ctx) => ce2Write(ctx, "cm2-col-ecrire", "écrire un fait sur la conquête coloniale", COL_ECRIRE, 1, 2);
export const makeCm2ColOrdre: Make = (ctx) => ce2Order(ctx, "cm2-col-ordre", "ranger les événements de la conquête coloniale", COL_ORDRE);
export const makeCm2ColRelier: Make = (ctx) => ce2Link(ctx, "cm2-col-relier", "relier un nom, une ville ou un sigle à son rôle", COL_RELIER);
export const makeCm2ColGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-col-glisser", "classer les événements dans le temps et les formes de résistance", COL_GLISSER, 2);

// ===========================================================================
// LA MARCHE VERS L'INDÉPENDANCE (hi-cm2-independance)
// ===========================================================================

const IND_PEOPLE: Pool = {
  items: [
    {
      id: "diagne",
      q: ["Quel Sénégalais fut le premier député africain élu à l'Assemblée française ?", "Quel homme politique du Sénégal a été le premier député africain en France ?", "Qui est devenu le premier député africain de l'Assemblée française en 1914 ?"],
      a: "Blaise Diagne",
      also: ["Diagne"],
      s: ["___ fut le premier député africain élu à l'Assemblée française.", "Le premier député africain de l'Assemblée française se nommait ___."],
      hint: "Il a porté la voix des Africains jusqu'à Paris.",
    },
    {
      id: "gueye",
      q: ["Quel député sénégalais a donné son nom à la loi de 1946 sur la citoyenneté ?", "Quel député sénégalais a donné son nom à la loi de 1946 qui rend citoyens les habitants des colonies ?", "Quel député est à l'origine de la loi de 1946 sur la citoyenneté française ?"],
      a: "Lamine Guèye",
      also: ["Lamine Gueye", "Guèye", "Gueye"],
      s: ["La loi de 1946 sur la citoyenneté porte le nom de ___.", "___ est le député qui a donné son nom à la loi de 1946."],
      hint: "Cet avocat a obtenu des droits égaux pour les habitants des colonies.",
    },
    {
      id: "senghor",
      q: ["Qui fut le premier président de la République du Sénégal ?", "Quel poète est devenu le premier président du Sénégal indépendant ?", "Qui dirigeait le Sénégal quand le pays est devenu indépendant ?"],
      a: "Léopold Sédar Senghor",
      also: ["Senghor", "Leopold Sedar Senghor", "Léopold Senghor"],
      s: ["___ fut le premier président de la République du Sénégal.", "Le poète ___ a été le premier président du pays libre."],
      hint: "Cet écrivain célèbre a dirigé le pays après la fin de la colonie.",
    },
  ],
  extras: ["Abdou Diouf", "Louis Faidherbe"],
};

const IND_YEAR: Pool = {
  items: [
    {
      id: "diagne-1914",
      q: ["En quelle année Blaise Diagne est-il devenu député ?", "Quelle année marque l'élection de Blaise Diagne comme député ?", "Blaise Diagne a été élu député, mais en quelle année ?"],
      a: "1914",
      s: ["Blaise Diagne a été élu député en ___.", "En ___, Blaise Diagne est devenu le premier député africain."],
      hint: "C'est au début du siècle, juste avant une grande guerre.",
    },
    {
      id: "mali-1959",
      q: ["En quelle année la Fédération du Mali a-t-elle été créée ?", "Quelle année a vu naître la Fédération du Mali ?", "La Fédération du Mali est née, mais en quelle année ?"],
      a: "1959",
      s: ["La Fédération du Mali a été créée en ___.", "En ___, le Sénégal et le Soudan français ont formé la Fédération du Mali."],
      hint: "C'est la dernière année avant l'indépendance du pays.",
    },
    {
      id: "mali-fin",
      q: ["En quelle année la Fédération du Mali a-t-elle pris fin ?", "Quelle année a vu la fin de la Fédération du Mali ?"],
      a: "1960",
      s: ["La Fédération du Mali a pris fin en ___.", "En ___, la Fédération du Mali s'est séparée en deux pays."],
      hint: "Elle n'a duré qu'un an et demi environ.",
    },
    {
      id: "independance-1960",
      q: ["En quelle année le Sénégal est-il devenu indépendant ?", "Quelle année est celle de l'indépendance du Sénégal ?", "Le Sénégal a retrouvé sa liberté, mais en quelle année ?"],
      a: "1960",
      s: ["Le Sénégal est devenu indépendant en ___.", "En ___, le Sénégal a pris son indépendance."],
      hint: "C'est une année ronde, au milieu du siècle.",
    },
  ],
  extras: ["1946", "1958"],
};

const IND_DAY: Pool = {
  items: [
    {
      id: "quatre-avril",
      q: ["Quel jour le Sénégal fête-t-il son indépendance ?", "Quelle est la date de la fête de l'indépendance du Sénégal ?", "Le Sénégal fête son indépendance le jour de quelle date ?"],
      a: "4 avril",
      also: ["Le 4 avril", "4 Avril"],
      s: ["Le Sénégal fête son indépendance le ___.", "La fête nationale de l'indépendance du Sénégal a lieu le ___."],
      hint: "C'est un jour de printemps, au début du mois.",
    },
  ],
  extras: ["1er mai", "14 juillet", "20 août"],
};

const IND_FEDE: Pool = {
  items: [
    {
      id: "federation",
      q: ["Comment se nomme l'union du Sénégal et du Soudan français formée en 1959 ?", "Quelle fédération le Sénégal a-t-il formée avec le Soudan français ?", "Quel nom portait l'union du Sénégal et du Soudan français juste avant 1960 ?"],
      a: "Fédération du Mali",
      also: ["La Fédération du Mali", "Federation du Mali"],
      ga: "la Fédération du Mali",
      s: ["Le Sénégal et le Soudan français ont formé ___.", "Le Sénégal et le Soudan français se sont unis dans ___."],
      hint: "Deux pays voisins se sont unis pour obtenir ensemble leur indépendance.",
    },
  ],
  extras: ["AOF", "Union africaine"],
  gextras: ["l'AOF", "l'Union africaine"],
  onlyExtras: true,
};

const IND_PAYS: Pool = {
  items: [
    {
      id: "soudan",
      q: ["Quel territoire a formé la Fédération du Mali avec le Sénégal ?", "Avec quel territoire le Sénégal a-t-il formé la Fédération du Mali ?"],
      a: "Soudan français",
      also: ["Le Soudan français", "Soudan"],
      s: ["Le Sénégal a formé la Fédération du Mali avec le ___.", "La Fédération du Mali a uni le Sénégal et le ___."],
      hint: "Ce territoire voisin deviendra le Mali d'aujourd'hui.",
    },
  ],
  extras: ["Gambie", "Guinée"],
  onlyExtras: true,
};

const IND_POOLS = [IND_PEOPLE, IND_YEAR, IND_DAY, IND_FEDE, IND_PAYS] as const;
const IND_QCM = questionRows("hi-cm2-independance", IND_POOLS);
const IND_TROU = gapRows("hi-cm2-independance", IND_POOLS);
const IND_ECRIRE = writeRows("hi-cm2-independance", IND_POOLS);

const IND_ORDRE: readonly OrderRow[] = [
  order("Range ces événements du plus ancien au plus récent.", ["Blaise Diagne devient député", "La Fédération du Mali naît", "Le Sénégal fête son indépendance"], "ind-ordre:evenements"),
  order("Range ces événements du plus ancien au plus récent.", ["Blaise Diagne devient député", "La loi Lamine Guèye est votée", "La Fédération du Mali est créée", "Le Sénégal devient indépendant"], "ind-ordre:quatre"),
  order("Range ces dates du plus ancien au plus récent.", ["Élection de Blaise Diagne", "Loi Lamine Guèye", "Naissance de la Fédération du Mali"], "ind-ordre:dates"),
  order("Range ces faits du plus ancien au plus récent.", ["Blaise Diagne devient député", "La loi Lamine Guèye est votée", "Senghor devient président"], "ind-ordre:faits"),
  order("Range ces dates du plus ancien au plus récent.", ["1914", "1946", "1959", "1960"], "ind-ordre:annees"),
];

const IND_RELIER: readonly LinkRow[] = [
  link("Relie chaque nom à son rôle.", [["Blaise Diagne", "Premier député africain"], ["Léopold Sédar Senghor", "Premier président du Sénégal"], ["Lamine Guèye", "Loi de 1946 sur la citoyenneté"]]),
  link("Relie chaque date à ce qu'elle rappelle.", [["1914", "Diagne devient député"], ["1959", "Naissance de la Fédération du Mali"], ["1960", "Indépendance du Sénégal"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Fédération du Mali", "Union avec le Soudan français"], ["4 avril", "Fête de l'indépendance"], ["Assemblée française", "Lieu où siège Diagne"]]),
  link("Relie chaque homme politique à sa fonction.", [["Blaise Diagne", "Député en 1914"], ["Lamine Guèye", "Auteur de la loi de 1946"], ["Léopold Sédar Senghor", "Président en 1960"]]),
  link("Relie chaque année à ce qui s'est passé.", [["1914", "Élection de Blaise Diagne"], ["1946", "Loi Lamine Guèye"], ["1959", "Naissance de la Fédération du Mali"], ["1960", "Fête de l'indépendance"]]),
  link("Relie chaque événement à son sens.", [["Fédération du Mali", "Union de deux territoires"], ["Loi de 1946", "Citoyenneté pour les habitants des colonies"], ["4 avril", "Fête nationale"]]),
];

const IND_GLISSER = [
  ...sortRows(
    "Glisse chaque fait dans la bonne case.",
    ["Avant 1960", "Depuis 1960"],
    ["Élection de Blaise Diagne", "Loi Lamine Guèye", "Naissance de la Fédération du Mali"],
    ["Senghor président", "Fête du 4 avril", "Fin de la Fédération du Mali"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Un homme politique", "Date"],
    ["Blaise Diagne", "Lamine Guèye", "Léopold Sédar Senghor"],
    ["1914", "1959", "4 avril"],
    SORT_HINTS,
    6,
  ),
];

export const makeCm2IndQcm: Make = (ctx) => ce2Question(ctx, "cm2-ind-qcm", "Blaise Diagne, la Fédération du Mali et l'indépendance", IND_QCM, 3);
export const makeCm2IndTrou: Make = (ctx) => ce2Gap(ctx, "cm2-ind-trou", "compléter une phrase sur la marche vers l'indépendance", IND_TROU, 2, 1);
export const makeCm2IndEcrire: Make = (ctx) => ce2Write(ctx, "cm2-ind-ecrire", "écrire un fait sur la marche vers l'indépendance", IND_ECRIRE, 1, 2);
export const makeCm2IndOrdre: Make = (ctx) => ce2Order(ctx, "cm2-ind-ordre", "ranger les étapes de la marche vers l'indépendance", IND_ORDRE);
export const makeCm2IndRelier: Make = (ctx) => ce2Link(ctx, "cm2-ind-relier", "relier un nom ou une date à son rôle", IND_RELIER);
export const makeCm2IndGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-ind-glisser", "classer les faits avant et après 1960", IND_GLISSER, 2);

// ===========================================================================
// LES PROGRÈS DES SCIENCES ET DES TECHNIQUES (hi-cm2-progres)
// ===========================================================================

const PRO_INVENT: Pool = {
  items: [
    {
      id: "vapeur",
      q: ["Quelle machine fait avancer des trains et des bateaux grâce à l'eau chauffée ?", "Quelle invention utilise la vapeur d'eau pour faire avancer un train ou un bateau ?", "Quelle machine transforme la chaleur de l'eau bouillante en force pour tirer un train ?"],
      a: "Machine à vapeur",
      also: ["La machine à vapeur"],
      ga: "la machine à vapeur",
      s: ["Un train ou un bateau peut avancer avec ___.", "Pour faire rouler les premiers trains, on a inventé ___."],
      hint: "L'eau chauffée dans une grande chaudière fournit la force.",
    },
    {
      id: "electricite",
      q: ["Quelle invention fait briller une ampoule sans bougie ni pétrole ?", "Quelle invention permet d'éclairer les maisons et les rues le soir ?", "Quelle force invisible circule dans les fils pour allumer une lampe ?"],
      a: "Électricité",
      also: ["L'électricité", "Electricité", "Electricite"],
      ga: "l'électricité",
      s: ["Une ampoule s'allume avec ___.", "Pour éclairer les rues le soir, on utilise ___."],
      hint: "Elle arrive par des fils jusque dans la maison.",
    },
    {
      id: "telephone",
      q: ["Quelle invention permet de parler avec une personne qui est très loin ?", "Quel appareil permet d'entendre un ami qui habite dans une autre ville ?", "Quelle invention du XIXe siècle transmet la voix à distance par un fil ?"],
      a: "Téléphone",
      also: ["Le téléphone", "Telephone"],
      ga: "le téléphone",
      s: ["Pour parler à un ami qui habite loin, on utilise ___.", "Avec ___, deux personnes éloignées peuvent se répondre."],
      hint: "On parle dans un combiné et l'autre personne répond.",
    },
    {
      id: "automobile",
      q: ["Quelle invention roule sur la route avec un moteur, sans cheval ?", "Quel véhicule à moteur transporte des personnes sur les routes ?", "Quelle invention a remplacé peu à peu la charrette tirée par un cheval ?"],
      a: "Automobile",
      also: ["L'automobile", "Voiture", "La voiture"],
      ga: "l'automobile",
      s: ["Pour rouler vite sur la route sans cheval, on a inventé ___.", "Un véhicule à moteur à quatre roues sur la route, c'est ___."],
      hint: "Elle a des roues, un moteur et un volant.",
    },
    {
      id: "avion",
      q: ["Quelle invention permet de voyager dans le ciel en quelques heures ?", "Quel engin à moteur et à ailes vole dans le ciel ?", "Quelle invention du XXe siècle a rapproché les pays en traversant les océans par les airs ?"],
      a: "Avion",
      also: ["L'avion"],
      ga: "l'avion",
      s: ["Pour traverser l'océan en quelques heures, on prend ___.", "Un engin à ailes qui vole dans le ciel s'appelle ___."],
      hint: "Il décolle sur une piste et vole très haut.",
    },
    {
      id: "radio",
      q: ["Quelle invention fait entendre des nouvelles et de la musique venues de loin, sans images ?", "Quel appareil permet d'écouter une émission sans pouvoir répondre ?", "Quelle invention permet à tout un village d'écouter les mêmes nouvelles en même temps ?"],
      a: "Radio",
      also: ["La radio"],
      ga: "la radio",
      s: ["Pour écouter les nouvelles sans voir d'images, on utilise ___.", "On écoute de la musique et des nouvelles venues de loin avec ___."],
      hint: "Les voix et la musique arrivent par les ondes.",
    },
    {
      id: "vaccins",
      q: ["Quelle invention protège les enfants contre certaines maladies graves ?", "Que reçoit-on en piqûre pour se protéger de certaines maladies ?", "Quelle découverte médicale a sauvé des millions de vies en protégeant contre les épidémies ?"],
      a: "Vaccins",
      also: ["Les vaccins", "Vaccin", "Le vaccin"],
      ga: "les vaccins",
      s: ["Pour se protéger de certaines maladies graves, on reçoit ___.", "Contre les épidémies, la médecine a inventé ___."],
      hint: "On les donne dans les centres de santé aux enfants.",
    },
  ],
};

const PRO_ORDI: Pool = {
  items: [
    {
      id: "ordinateur",
      q: ["Quelle machine moderne permet de calculer, d'écrire et de chercher des informations ?", "Quelle machine à écran et à clavier permet de traiter des textes et des données ?", "Quelle invention du XXe siècle effectue des calculs très rapides grâce à des programmes ?"],
      a: "Ordinateur",
      also: ["L'ordinateur"],
      ga: "l'ordinateur",
      s: ["Pour écrire un texte et faire des calculs, on peut utiliser ___.", "Une machine qui calcule vite grâce à des programmes, c'est ___."],
      hint: "Il a un écran, un clavier et il garde tout en mémoire.",
    },
  ],
  extras: ["Machine à coudre", "Bicyclette"],
  gextras: ["la machine à coudre", "la bicyclette"],
};

const PRO_USAGE: Pool = {
  items: [
    {
      id: "telephone",
      q: ["Que permet de faire le téléphone ?", "À quoi sert un téléphone ?", "Quel est le rôle d'un téléphone ?"],
      a: "Parler à distance",
      ga: "parler à distance",
      s: ["Le téléphone sert à ___.", "Avec un téléphone, on peut ___."],
      hint: "Deux personnes éloignées s'entendent comme si elles étaient proches.",
    },
    {
      id: "avion",
      q: ["Que permet de faire un avion ?", "À quoi sert un avion ?", "Quel est le rôle d'un avion ?"],
      a: "Voyager dans le ciel",
      ga: "voyager dans le ciel",
      s: ["L'avion sert à ___.", "Avec un avion, on peut ___."],
      hint: "On traverse de très longues distances en quelques heures.",
    },
    {
      id: "vaccins",
      q: ["À quoi servent les vaccins ?", "Que permettent de faire les vaccins ?", "Quel est le rôle des vaccins ?"],
      a: "Se protéger d'une maladie",
      ga: "se protéger d'une maladie",
      s: ["Les vaccins servent à ___.", "Avec un vaccin, on peut ___."],
      hint: "On évite de tomber gravement malade.",
    },
    {
      id: "radio",
      q: ["Que permet de faire la radio ?", "À quoi sert une radio ?", "Quel est le rôle de la radio ?"],
      a: "Écouter des nouvelles",
      ga: "écouter des nouvelles",
      s: ["La radio sert à ___.", "Avec une radio, on peut ___."],
      hint: "On reçoit des voix et de la musique venues de loin.",
    },
    {
      id: "automobile",
      q: ["Que permet de faire une automobile ?", "À quoi sert une automobile ?", "Quel est le rôle d'une automobile ?"],
      a: "Rouler sur la route",
      ga: "rouler sur la route",
      s: ["L'automobile sert à ___.", "Avec une automobile, on peut ___."],
      hint: "Elle transporte des personnes d'une ville à l'autre.",
    },
    {
      id: "vapeur",
      q: ["Que permet de faire la machine à vapeur ?", "À quoi sert une machine à vapeur ?", "Quel est le rôle d'une machine à vapeur ?"],
      a: "Faire avancer les trains",
      ga: "faire avancer les trains",
      s: ["La machine à vapeur sert à ___.", "Avec une machine à vapeur, on peut ___."],
      hint: "Elle fournit la force qui tire les wagons et pousse les navires.",
    },
  ],
};

const PRO_SIECLE: Pool = {
  items: [
    {
      id: "siecles",
      q: ["Quels siècles ont vu naître le téléphone, la voiture, l'avion et la radio ?", "À quels siècles ont eu lieu les grands progrès comme la radio, le téléphone et l'avion ?"],
      a: "XIXe et XXe siècles",
      also: ["19e et 20e siècles", "XIXe et XXe"],
      s: ["Le téléphone, la radio et l'avion sont des progrès des ___.", "Les grands progrès des sciences et des techniques datent des ___."],
      hint: "Ce sont les deux époques les plus proches de nous.",
    },
  ],
  extras: ["XIe et XIIe siècles", "XVe et XVIe siècles"],
};

const PRO_POOLS = [PRO_INVENT, PRO_ORDI, PRO_USAGE, PRO_SIECLE] as const;
const PRO_QCM = questionRows("hi-cm2-progres", PRO_POOLS);
const PRO_TROU = gapRows("hi-cm2-progres", PRO_POOLS);
const PRO_ECRIRE = writeRows("hi-cm2-progres", [PRO_INVENT, PRO_ORDI]);

const PRO_ORDRE: readonly OrderRow[] = [
  order("Range ces inventions de la plus ancienne à la plus récente.", ["Machine à vapeur", "Téléphone", "Avion", "Ordinateur"], "pro-ordre:quatre"),
  order("Range ces inventions de la plus ancienne à la plus récente.", ["Machine à vapeur", "Automobile", "Avion"], "pro-ordre:transports"),
  order("Range ces inventions de la plus ancienne à la plus récente.", ["Téléphone", "Automobile", "Ordinateur"], "pro-ordre:trois"),
  order("Range ces inventions de la plus ancienne à la plus récente.", ["Machine à vapeur", "Téléphone", "Ordinateur"], "pro-ordre:vapeur"),
  order("Range ces inventions de la plus ancienne à la plus récente.", ["Téléphone", "Automobile", "Avion", "Ordinateur"], "pro-ordre:modernes"),
];

const PRO_RELIER: readonly LinkRow[] = [
  link("Relie chaque invention à ce qu'elle fait.", [["Machine à vapeur", "Fait avancer les trains"], ["Électricité", "Éclaire les maisons"], ["Téléphone", "Transmet la voix"]]),
  link("Relie chaque invention à ce qu'elle fait.", [["Avion", "Vole dans le ciel"], ["Automobile", "Roule sur la route"], ["Radio", "Fait entendre des nouvelles"]]),
  link("Relie chaque invention à ce qu'elle fait.", [["Vaccins", "Protègent des maladies"], ["Ordinateur", "Calcule et classe des informations"], ["Électricité", "Fait briller une ampoule"]]),
  link("Relie chaque invention à ce qu'elle a changé.", [["Téléphone", "Parler à distance"], ["Avion", "Voyager vite"], ["Vaccins", "Se soigner"]]),
  link("Relie chaque invention à son domaine.", [["Radio", "Communication"], ["Automobile", "Transport"], ["Vaccins", "Santé"], ["Électricité", "Énergie"]]),
  link("Relie chaque domaine à une invention.", [["Moyen de transport", "Avion"], ["Moyen de communication", "Téléphone"], ["Source de lumière", "Ampoule"]]),
];

const PRO_GLISSER = [
  ...sortRows(
    "Glisse chaque invention dans la bonne case.",
    ["Se déplacer", "Communiquer"],
    ["Automobile", "Avion", "Train à vapeur", "Bateau à vapeur"],
    ["Téléphone", "Radio", "Télégraphe"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Pour se soigner", "Pour s'éclairer"],
    ["Vaccin", "Piqûre protectrice", "Centre de vaccination"],
    ["Ampoule", "Lampe électrique", "Éclairage public"],
    SORT_HINTS,
    6,
  ),
];

export const makeCm2ProQcm: Make = (ctx) => ce2Question(ctx, "cm2-pro-qcm", "les inventions et ce qu'elles ont changé", PRO_QCM, 3);
export const makeCm2ProTrou: Make = (ctx) => ce2Gap(ctx, "cm2-pro-trou", "compléter une phrase sur les progrès des techniques", PRO_TROU, 2, 1);
export const makeCm2ProEcrire: Make = (ctx) => ce2Write(ctx, "cm2-pro-ecrire", "écrire le nom d'une invention", PRO_ECRIRE, 1, 2);
export const makeCm2ProOrdre: Make = (ctx) => ce2Order(ctx, "cm2-pro-ordre", "ranger des inventions dans le temps", PRO_ORDRE);
export const makeCm2ProRelier: Make = (ctx) => ce2Link(ctx, "cm2-pro-relier", "relier une invention à ce qu'elle fait", PRO_RELIER);
export const makeCm2ProGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-pro-glisser", "classer les inventions par usage", PRO_GLISSER, 2);
