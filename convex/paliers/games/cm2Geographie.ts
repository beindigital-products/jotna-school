/**
 * LES GABARITS DE LA GÉOGRAPHIE DU CM2 : le milieu et les activités, la protection des ressources, la population du Sénégal, les villes
 * et les campagnes (`ge-cm2-milieu-activites`, `-degradation`, `-population`, `-villes`).
 *
 * Même construction que `cm2Histoire.ts` et `cm1Geographie.ts` : des tableaux de faits fermés (`Pool`, `cm1Faits.ts`), les outils de
 * `ce2Outils.ts`, cinq paliers. Chaque réponse se lit dans un tableau écrit à la main, qui ne dit que ce que la fiche dit, plus quelques
 * faits que personne ne discute (la langue officielle, le fleuve qui borde la Mauritanie) ; la liste de ces faits est donnée dans la
 * description de la PR.
 *
 * Deux règles de forme, nées de la relecture du CE2 et du CM1 :
 * - Une phrase à trou ne met jamais « à », « de » ou « du » devant le trou quand les options changent de genre ou commencent par une voyelle :
 *   « au » et « d'avancée » trahiraient la réponse. La phrase est neutre (« Le mot ___ désigne… ») et l'article fait partie de l'option.
 * - Une zone du programme (la vallée du fleuve, le bassin arachidier) ne s'écrit jamais dans l'énoncé qui la demande : l'énoncé la décrit
 *   par ses villes, sa frontière, son activité.
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
  hints,
  sortRows,
  type LinkRow,
  type OrderRow,
} from "./ce2Outils";
import { SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LE MILIEU ET LES ACTIVITÉS (ge-cm2-milieu-activites)
// ===========================================================================

const MIL_ZONE: Pool = {
  items: [
    {
      id: "vallee-riz",
      q: ["Quelle zone du nord, le long de la frontière avec la Mauritanie, est connue pour ses rizières ?", "Dans quelle zone cultive-t-on surtout du riz, près de la Mauritanie ?", "Quelle zone du nord du pays est célèbre pour la culture du riz ?"],
      a: "Vallée du fleuve",
      also: ["Vallée du fleuve Sénégal", "La vallée du fleuve Sénégal"],
      not: ["Casamance"],
      noWrite: true,
      s: ["La zone appelée ___ est connue pour ses rizières.", "Le riz est cultivé surtout dans la zone appelée ___."],
      hint: "Les rizières y profitent de l'eau d'un grand cours d'eau.",
    },
    {
      id: "bassin-arachide",
      q: ["Quelle zone du centre-ouest regroupe Kaolack, Kaffrine, Diourbel et Fatick ?", "Dans quelle zone se trouvent les champs de Kaolack, Kaffrine, Diourbel et Fatick ?", "Quelle zone du pays groupe les régions de Kaolack, Kaffrine, Diourbel et Fatick ?"],
      a: "Bassin arachidier",
      also: ["Le bassin arachidier"],
      s: ["La zone appelée ___ regroupe Kaolack, Kaffrine, Diourbel et Fatick.", "Kaolack, Kaffrine, Diourbel et Fatick sont dans la zone appelée ___."],
      hint: "Cette zone du centre-ouest est celle d'une plante dont on tire de l'huile.",
    },
    {
      id: "cote-peche",
      q: ["Quelle zone est bordée par l'océan Atlantique et vit de la pêche ?", "Dans quelle zone les pêcheurs partent-ils en pirogue chaque matin ?", "Quelle zone est celle des pêcheurs et des ports de pêche ?"],
      a: "Côte",
      also: ["La côte", "Cote"],
      noWrite: true,
      s: ["La zone appelée ___ vit surtout de la pêche.", "Les pêcheurs partent en pirogue depuis la zone appelée ___."],
      hint: "L'océan y apporte les poissons.",
    },
    {
      id: "ferlo-elevage",
      q: ["Quelle zone de l'intérieur du pays, aux grandes plaines sèches, est connue pour ses troupeaux ?", "Dans quelle zone les éleveurs conduisent-ils leurs troupeaux de zébus et de moutons ?", "Quelle zone est la grande région d'élevage du Sénégal ?"],
      a: "Ferlo",
      also: ["Le Ferlo"],
      s: ["La zone appelée ___ est la grande région d'élevage.", "Les troupeaux vivent surtout dans la zone appelée ___."],
      hint: "Ses plaines sèches ne donnent qu'une herbe rare aux animaux.",
    },
    {
      id: "casamance-fruits",
      q: ["Quelle zone du sud, très arrosée, est connue pour ses fruits ?", "Dans quelle zone du sud du pays récolte-t-on beaucoup de mangues et d'autres fruits ?", "Quelle zone du sud est riche en forêts et en vergers ?"],
      a: "Casamance",
      also: ["La Casamance"],
      not: ["Vallée du fleuve"],
      s: ["La zone appelée ___ est riche en fruits.", "Les mangues et les fruits poussent en abondance dans la zone appelée ___."],
      hint: "Les pluies y sont plus abondantes que dans le reste du pays.",
    },
  ],
};

const MIL_ACTIVITE: Pool = {
  items: [
    {
      id: "vallee-riz",
      q: ["Quelle activité domine dans la vallée du fleuve Sénégal ?", "Quelle activité les paysans de la vallée du fleuve Sénégal pratiquent-ils surtout ?", "Quelle culture est typique de la vallée du fleuve Sénégal ?"],
      a: "Riziculture",
      also: ["La riziculture", "Culture du riz", "La culture du riz", "Riz"],
      not: ["Culture des fruits"],
      ga: "la riziculture",
      s: ["L'activité principale de la vallée du fleuve Sénégal est ___.", "Dans la vallée du fleuve Sénégal, on pratique surtout ___."],
      hint: "Cette céréale pousse les pieds dans l'eau.",
    },
    {
      id: "bassin-arachide",
      q: ["Quelle activité domine dans le bassin arachidier ?", "Quelle activité les paysans de Kaolack, Kaffrine, Diourbel et Fatick pratiquent-ils surtout ?", "Quelle culture donne son nom au bassin arachidier ?"],
      a: "Culture de l'arachide",
      also: ["La culture de l'arachide", "Arachide", "L'arachide", "Culture des arachides"],
      ga: "la culture de l'arachide",
      s: ["L'activité principale du bassin arachidier est ___.", "Dans le bassin arachidier, on pratique surtout ___."],
      hint: "On sème des graines dont on tire de l'huile.",
    },
    {
      id: "cote-peche",
      q: ["Quelle activité domine sur la côte du Sénégal ?", "Quelle activité font vivre les ports et les pirogues de la côte ?", "Quelle activité les habitants de la côte pratiquent-ils surtout ?"],
      a: "Pêche",
      also: ["La pêche", "Peche"],
      ga: "la pêche",
      s: ["L'activité principale de la côte est ___.", "Sur la côte du Sénégal, on pratique surtout ___."],
      hint: "On jette des filets pour attraper du poisson.",
    },
    {
      id: "ferlo-elevage",
      q: ["Quelle activité domine dans le Ferlo ?", "Quelle activité les habitants du Ferlo pratiquent-ils surtout ?", "Quelle activité fait vivre les familles qui gardent des troupeaux dans le Ferlo ?"],
      a: "Élevage",
      also: ["L'élevage", "Elevage", "L'elevage"],
      ga: "l'élevage",
      s: ["L'activité principale du Ferlo est ___.", "Dans le Ferlo, on pratique surtout ___."],
      hint: "On soigne des animaux et on les conduit vers les pâturages.",
    },
    {
      id: "casamance-fruits",
      q: ["Quelle activité fournit des mangues et des oranges en Casamance ?", "Quelle activité agricole, qui donne des fruits, est célèbre en Casamance ?", "Quelle activité domine dans les vergers de la Casamance ?"],
      a: "Culture des fruits",
      also: ["La culture des fruits", "Fruits", "Les fruits", "Arboriculture"],
      not: ["Riziculture"],
      ga: "la culture des fruits",
      s: ["L'activité célèbre de la Casamance est ___.", "En Casamance, on pratique beaucoup ___."],
      hint: "Les arbres des vergers donnent des produits sucrés.",
    },
  ],
};

const MIL_REGION: Pool = {
  items: [
    {
      id: "bassin-regions",
      q: ["Quelle région fait partie du bassin arachidier ?", "Quelle région est un cœur du bassin arachidier ?"],
      a: "Kaolack",
      w: "Écris le nom d'une région du bassin arachidier.",
      also: ["Kaolack", "Kaffrine", "Diourbel", "Fatick"],
      s: ["Le bassin arachidier comprend la région de ___."],
      hint: "Cette région du centre-ouest produit beaucoup de graines à huile.",
    },
    {
      id: "bassin-regions",
      q: ["Laquelle de ces régions appartient au bassin arachidier ?", "Parmi ces régions, laquelle est dans le bassin arachidier ?"],
      a: "Kaffrine",
      noWrite: true,
      s: ["La région de ___ fait partie du bassin arachidier."],
      hint: "Cette région du centre produit beaucoup de graines à huile.",
    },
    {
      id: "bassin-regions",
      q: ["Quelle région de la liste se trouve dans le bassin arachidier ?", "Quel nom est celui d'une région du bassin arachidier ?"],
      a: "Diourbel",
      noWrite: true,
      s: ["On cultive l'arachide dans la région de ___, au cœur du bassin arachidier."],
      hint: "Cette région de l'ouest du centre produit beaucoup de graines à huile.",
    },
    {
      id: "bassin-regions",
      q: ["Quelle région de ces noms fait partie du bassin arachidier ?", "Lequel de ces noms est celui d'une région du bassin arachidier ?"],
      a: "Fatick",
      noWrite: true,
      s: ["Dans le bassin arachidier, on trouve aussi la région de ___."],
      hint: "Cette région proche de la côte produit des graines à huile.",
    },
  ],
  extras: ["Ziguinchor", "Matam", "Kédougou", "Saint-Louis"],
  onlyExtras: true,
};

const MIL_FLEUVE: Pool = {
  items: [
    {
      id: "fleuve",
      q: ["Quel fleuve coule au nord, le long de la frontière avec la Mauritanie ?", "Quel fleuve arrose les rizières du nord et borde la Mauritanie ?", "Quel grand fleuve du nord sépare notre pays de la Mauritanie ?"],
      a: "Sénégal",
      also: ["Le fleuve Sénégal", "Fleuve Sénégal", "Senegal"],
      s: ["Le fleuve ___ forme la frontière nord avec la Mauritanie.", "Le fleuve ___ arrose les rizières du nord du pays."],
      hint: "Il traverse le nord du pays et se jette dans l'Atlantique.",
    },
  ],
  extras: ["Gambie", "Casamance", "Saloum"],
  onlyExtras: true,
};

const MIL_SAISON: Pool = {
  items: [
    {
      id: "saison-pluies",
      q: ["Pendant quelle saison les paysans sèment-ils le riz et l'arachide ?", "Quelle saison permet aux champs de mil et d'arachide de pousser ?", "Quelle saison apporte l'eau nécessaire aux cultures ?"],
      a: "Saison des pluies",
      also: ["La saison des pluies", "Hivernage", "L'hivernage"],
      ga: "la saison des pluies",
      s: ["Les paysans sèment le riz et l'arachide pendant ___.", "Les champs poussent bien pendant ___."],
      hint: "L'eau tombe du ciel et gonfle les rivières.",
    },
    {
      id: "saison-seche",
      q: ["Pendant quelle saison les mares du Ferlo se vident-elles et l'herbe devient-elle rare ?", "Quelle saison oblige les éleveurs à chercher de l'eau pour leurs troupeaux ?", "Quelle saison dure le plus longtemps, avec très peu de pluie ?"],
      a: "Saison sèche",
      also: ["La saison sèche", "Saison seche"],
      ga: "la saison sèche",
      s: ["Les mares se vident pendant ___.", "Les éleveurs cherchent de l'eau pour leurs troupeaux pendant ___."],
      hint: "Le soleil chauffe, les mares baissent et l'herbe jaunit.",
    },
  ],
  extras: ["Hiver", "Printemps"],
  gextras: ["l'hiver", "le printemps"],
};

const MIL_POOLS = [MIL_ZONE, MIL_ACTIVITE, MIL_REGION, MIL_FLEUVE, MIL_SAISON] as const;
const MIL_QCM = questionRows("ge-cm2-milieu-activites", MIL_POOLS);
const MIL_TROU = gapRows("ge-cm2-milieu-activites", MIL_POOLS);
const MIL_ECRIRE = writeRows("ge-cm2-milieu-activites", MIL_POOLS);

const MIL_ORDRE: readonly OrderRow[] = [
  order("Range ces régions naturelles du nord au sud.", ["Vallée du fleuve Sénégal", "Bassin arachidier", "Casamance"], "mil-ordre:nord-sud"),
  order("Range ces régions naturelles du nord au sud.", ["Ferlo", "Bassin arachidier", "Casamance"], "mil-ordre:ferlo"),
  order("Range les étapes de la culture du riz.", ["Préparer la rizière", "Repiquer les plants", "Récolter le riz", "Vendre le riz"], "mil-ordre:riz"),
  order("Range les gestes du paysan qui cultive l'arachide.", ["Semer les graines", "Arracher les plants", "Faire sécher les arachides", "Vendre les arachides"], "mil-ordre:arachide"),
  order("Range les gestes du pêcheur.", ["Jeter le filet", "Remonter le filet", "Trier le poisson", "Vendre le poisson"], "mil-ordre:pecheur"),
];

const MIL_RELIER: readonly LinkRow[] = [
  link("Relie chaque zone à son activité.", [["Vallée du fleuve Sénégal", "Riziculture"], ["Bassin arachidier", "Culture de l'arachide"], ["Côte", "Pêche"]]),
  link("Relie chaque zone à son activité.", [["Ferlo", "Élevage"], ["Casamance", "Culture des fruits"], ["Côte", "Pêche"]]),
  link("Relie chaque activité à ce qu'elle utilise.", [["Pêche", "Pirogue"], ["Riziculture", "Rizière"], ["Élevage", "Troupeau"]]),
  link("Relie chaque activité à ce qu'elle produit.", [["Riziculture", "Du riz"], ["Culture de l'arachide", "Des graines à huile"], ["Pêche", "Du poisson"], ["Élevage", "Du lait et de la viande"]]),
  link("Relie chaque zone à ce qu'elle produit.", [["Vallée du fleuve Sénégal", "Du riz"], ["Bassin arachidier", "Arachides"], ["Casamance", "Mangues"]]),
  link("Relie chaque région à sa zone.", [["Kaolack", "Bassin arachidier"], ["Ziguinchor", "Casamance"], ["Matam", "Vallée du fleuve Sénégal"]]),
];

const MIL_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Vallée du fleuve Sénégal", "Côte"],
    ["Riz", "Rizière", "Fleuve Sénégal"],
    ["Pêche", "Pirogue", "Poisson"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Bassin arachidier", "Ferlo"],
    ["Arachide", "Huile d'arachide", "Kaolack"],
    ["Troupeau", "Zébu", "Éleveur"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Casamance", "Ferlo"],
    ["Mangues", "Oranges", "Vergers"],
    ["Troupeau", "Zébu", "Éleveur"],
    SORT_HINTS,
    4,
  ),
];

export const makeCm2MilQcm: Make = (ctx) => ce2Question(ctx, "cm2-mil-qcm", "les zones du Sénégal et leurs activités", MIL_QCM, 3);
export const makeCm2MilTrou: Make = (ctx) => ce2Gap(ctx, "cm2-mil-trou", "compléter une phrase sur le milieu et les activités", MIL_TROU, 2, 1);
export const makeCm2MilEcrire: Make = (ctx) => ce2Write(ctx, "cm2-mil-ecrire", "écrire un fait sur le milieu et les activités", MIL_ECRIRE, 1, 2);
export const makeCm2MilOrdre: Make = (ctx) => ce2Order(ctx, "cm2-mil-ordre", "ranger des zones du nord au sud ou les étapes d'une culture", MIL_ORDRE);
export const makeCm2MilRelier: Make = (ctx) => ce2Link(ctx, "cm2-mil-relier", "relier une zone ou une activité à ce qu'elle produit", MIL_RELIER);
export const makeCm2MilGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-mil-glisser", "classer les mots de deux zones du Sénégal", MIL_GLISSER, 2);

// ===========================================================================
// PROTÉGER NOS RESSOURCES (ge-cm2-degradation)
// ===========================================================================

const DEG_PROBLEME: Pool = {
  items: [
    {
      id: "deforestation",
      q: ["Comment appelle-t-on la coupe de trop d'arbres sans en replanter ?", "Quel nom porte le fait de couper beaucoup d'arbres dans la forêt sans les remplacer ?", "Comment appelle-t-on la disparition des forêts coupées par les hommes ?"],
      a: "Déforestation",
      also: ["La déforestation", "Deforestation"],
      ga: "déforestation",
      not: ["Feux de brousse"],
      s: ["Le mot ___ désigne le fait de couper trop d'arbres sans replanter.", "Le terme ___ s'applique aux forêts coupées par les hommes."],
      hint: "Les forêts reculent parce que les hommes coupent le bois.",
    },
    {
      id: "feux",
      q: ["Comment appelle-t-on les incendies qui brûlent l'herbe et les arbres de la savane ?", "Quel nom porte le feu qui ravage l'herbe sèche de la brousse ?", "Comment appelle-t-on les incendies de la brousse allumés pendant la saison sèche ?"],
      a: "Feux de brousse",
      also: ["Les feux de brousse", "Feu de brousse"],
      ga: "feux de brousse",
      not: ["Déforestation"],
      s: ["Le mot ___ désigne les incendies qui brûlent l'herbe sèche.", "Le terme ___ s'applique aux incendies de la savane."],
      hint: "Les flammes courent dans l'herbe sèche et abîment tout.",
    },
    {
      id: "surpeche",
      q: ["Comment appelle-t-on le fait de pêcher plus de poissons que la mer ne peut en renouveler ?", "Quel nom porte le fait de prendre trop de poissons dans la mer ?", "Comment appelle-t-on la pêche qui vide la mer de ses poissons ?"],
      a: "Surpêche",
      also: ["La surpêche", "Surpeche"],
      ga: "surpêche",
      s: ["Le mot ___ désigne le fait de pêcher trop de poissons.", "Le terme ___ s'applique au fait de prendre plus de poissons que la mer ne peut en renouveler."],
      hint: "Il reste de moins en moins de poissons dans l'eau.",
    },
    {
      id: "erosion",
      q: ["Comment appelle-t-on le recul de la plage quand la mer ronge le rivage ?", "Quel nom porte le grignotage des plages par les vagues ?", "Comment appelle-t-on le phénomène qui détruit les plages et menace les maisons au bord de l'océan ?"],
      a: "Érosion côtière",
      also: ["L'érosion côtière", "Erosion côtière", "Erosion cotiere"],
      ga: "érosion côtière",
      s: ["Le mot ___ désigne le recul de la plage rongée par la mer.", "Le terme ___ s'applique aux vagues qui grignotent le rivage."],
      hint: "L'eau salée mange la terre au bord du rivage.",
    },
    {
      id: "desert",
      q: ["Comment appelle-t-on la progression du sable du Sahara vers le sud ?", "Quel nom porte le fait que le sable gagne peu à peu des terres fertiles ?", "Comment appelle-t-on le sable qui envahit peu à peu les champs et les villages ?"],
      a: "Avancée du désert",
      also: ["L'avancée du désert", "Désertification", "La désertification"],
      ga: "avancée du désert",
      s: ["Le mot ___ désigne le sable qui envahit peu à peu les champs.", "Le terme ___ s'applique au sable du Sahara qui gagne vers le sud."],
      hint: "Le sable du Sahara avance peu à peu vers le sud.",
    },
  ],
};

const DEG_SOLUTION: Pool = {
  items: [
    {
      id: "reboisement",
      q: ["Comment appelle-t-on le fait de planter de nouveaux arbres là où la forêt a été coupée ?", "Quelle action replante des arbres pour remplacer ceux qui ont disparu ?", "Quel nom porte la plantation de jeunes arbres pour refaire une forêt ?"],
      a: "Reboisement",
      also: ["Le reboisement"],
      not: ["Grande Muraille verte"],
      ga: "le reboisement",
      s: ["Pour refaire une forêt, on pratique ___.", "Planter de jeunes arbres à la place de ceux qui ont été coupés, c'est ___."],
      hint: "Des jeunes plants prennent la place des arbres coupés.",
    },
    {
      id: "muraille",
      q: ["Quelle longue bande d'arbres traverse le Sahel pour freiner le sable ?", "Quel projet plante une longue bande d'arbres à travers le Sahel pour freiner le sable ?", "Quel grand projet africain vise à arrêter le sable du Sahara avec des arbres ?"],
      a: "Grande Muraille verte",
      also: ["La Grande Muraille verte"],
      not: ["Reboisement"],
      ga: "la Grande Muraille verte",
      s: ["Pour freiner l'avancée du sable, on a créé ___.", "La longue bande d'arbres plantée à travers le Sahel se nomme ___."],
      hint: "Elle forme une longue bande d'arbres en travers de l'Afrique.",
    },
    {
      id: "aires",
      q: ["Comment appelle-t-on les zones de mer où la pêche est limitée ou interdite pour protéger les poissons ?", "Quelle mesure protège les poissons en interdisant la pêche dans certaines zones de mer ?", "Quel nom porte une zone de mer protégée où les poissons peuvent se reproduire ?"],
      a: "Aires marines protégées",
      also: ["Aire marine protégée", "Les aires marines protégées", "Aire marine protegee"],
      ga: "les aires marines protégées",
      s: ["Pour protéger les poissons, on a créé ___ où la pêche est limitée.", "Les zones de mer où la pêche est limitée s'appellent ___."],
      hint: "On y laisse les poissons grandir et se reproduire tranquillement.",
    },
  ],
  extras: ["Construction de routes", "Ouverture de mines"],
  gextras: ["la construction de routes", "l'ouverture de mines"],
};

const DEG_CONSEQUENCE: Pool = {
  items: [
    {
      id: "deforestation",
      q: ["Quelle conséquence a la coupe de trop d'arbres sans replantation ?", "Que provoque le fait de couper trop d'arbres sans replanter ?"],
      a: "Disparition de la forêt",
      noWrite: true,
      not: ["Destruction de l'herbe et des arbres"],
      ga: "la disparition de la forêt",
      s: ["Couper trop d'arbres sans replanter entraîne ___.", "La coupe excessive du bois entraîne ___."],
      hint: "À force de couper, il n'en reste presque plus.",
    },
    {
      id: "feux",
      q: ["Que provoquent les feux de brousse dans la savane ?", "Quelle conséquence ont les incendies de la brousse ?"],
      a: "Destruction de l'herbe et des arbres",
      noWrite: true,
      not: ["Disparition de la forêt"],
      ga: "la destruction de l'herbe et des arbres",
      s: ["Les feux de brousse entraînent ___."],
      hint: "Les flammes ne laissent que des cendres derrière elles.",
    },
    {
      id: "surpeche",
      q: ["Que provoque la surpêche en mer ?", "Quelle conséquence a le fait de pêcher plus que la mer ne peut en renouveler ?"],
      a: "Diminution des poissons",
      noWrite: true,
      ga: "la diminution des poissons",
      s: ["La surpêche entraîne ___.", "Pêcher trop entraîne ___."],
      hint: "Les filets reviennent presque vides.",
    },
    {
      id: "erosion",
      q: ["Que provoque l'érosion côtière au bord de la mer ?", "Quelle conséquence ont les vagues qui rongent le rivage ?"],
      a: "Recul de la plage",
      noWrite: true,
      ga: "le recul de la plage",
      s: ["L'érosion côtière entraîne ___.", "Des vagues qui rongent le rivage entraînent ___."],
      hint: "Chaque année, la mer avance un peu plus sur la terre.",
    },
    {
      id: "desert",
      q: ["Que provoque l'avancée du désert dans les champs ?", "Quelle conséquence a le sable qui gagne les champs ?"],
      a: "Perte de terres cultivables",
      noWrite: true,
      ga: "la perte de terres cultivables",
      s: ["L'avancée du désert entraîne ___.", "Le sable qui gagne les champs entraîne ___."],
      hint: "Les paysans ne peuvent plus semer là où le sable s'installe.",
    },
  ],
};

const DEG_SAHEL: Pool = {
  items: [
    {
      id: "sahel",
      q: ["Dans quelle région d'Afrique la Grande Muraille verte est-elle plantée ?", "Quelle région d'Afrique, au sud du Sahara, la Grande Muraille verte traverse-t-elle ?"],
      a: "Sahel",
      also: ["Le Sahel"],
      s: ["La Grande Muraille verte traverse la région du ___.", "Les arbres de la Grande Muraille verte sont plantés dans le ___."],
      hint: "Cette bande de terres sèches borde le grand désert au sud.",
    },
  ],
  extras: ["Sahara", "Kalahari"],
  onlyExtras: true,
};

const DEG_POOLS = [DEG_PROBLEME, DEG_SOLUTION, DEG_CONSEQUENCE, DEG_SAHEL] as const;
const DEG_QCM = questionRows("ge-cm2-degradation", DEG_POOLS);
const DEG_TROU = gapRows("ge-cm2-degradation", DEG_POOLS);
const DEG_ECRIRE = writeRows("ge-cm2-degradation", [DEG_PROBLEME, DEG_SOLUTION]);

const DEG_ORDRE: readonly OrderRow[] = [
  order("Range les étapes pour replanter des arbres.", ["Préparer des plants en pépinière", "Creuser les trous", "Planter les jeunes arbres", "Arroser et protéger les arbres"], "deg-ordre:planter"),
  order("Range les étapes de la protection d'un espace marin.", ["La zone de mer est choisie", "La pêche y est limitée", "Les poissons se reproduisent", "La pêche devient meilleure autour"], "deg-ordre:aire"),
  order("Range les gestes pour planter un arbre.", ["Creuser le trou", "Poser le jeune plant", "Reboucher avec de la terre", "Arroser le plant"], "deg-ordre:arbre"),
  order("Range les effets de la surpêche dans l'ordre.", ["Les pêcheurs prennent trop de poissons", "Il reste moins de poissons", "Les pêcheurs rapportent moins de poissons"], "deg-ordre:surpeche"),
  order("Range les étapes du reboisement d'un village.", ["Les habitants choisissent un terrain", "Ils plantent de jeunes arbres", "Ils protègent les jeunes arbres", "Les arbres deviennent grands"], "deg-ordre:village"),
];

const DEG_RELIER: readonly LinkRow[] = [
  link("Relie chaque problème à ce qu'il décrit.", [["Déforestation", "Trop d'arbres coupés"], ["Surpêche", "Trop de poissons pêchés"], ["Érosion côtière", "La mer ronge la plage"], ["Avancée du désert", "Le sable gagne les terres"]]),
  link("Relie chaque problème à une solution.", [["Déforestation", "Replanter des arbres"], ["Surpêche", "Limiter la pêche en mer"], ["Avancée du désert", "Barrer le sable avec des arbres"]]),
  link("Relie chaque solution à ce qu'elle fait.", [["Reboisement", "Planter de jeunes arbres"], ["Grande Muraille verte", "Longue bande d'arbres au Sahel"], ["Aires marines protégées", "Zones de mer où la pêche est limitée"]]),
  link("Relie chaque problème à sa conséquence.", [["Feux de brousse", "Herbe et arbres brûlés"], ["Surpêche", "Moins de poissons"], ["Érosion côtière", "La plage recule"]]),
  link("Relie chaque solution à un problème.", [["Reboisement", "Déforestation"], ["Aires marines protégées", "Surpêche"], ["Grande Muraille verte", "Avancée du désert"]]),
  link("Relie chaque solution à ce qu'elle protège.", [["Reboisement", "Forêts"], ["Aires marines protégées", "Poissons"], ["Grande Muraille verte", "Les terres du Sahel"]]),
];

const DEG_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Problème", "Solution"],
    ["Déforestation", "Feux de brousse", "Surpêche", "Érosion côtière", "Avancée du désert"],
    ["Reboisement", "Grande Muraille verte", "Aires marines protégées"],
    SORT_HINTS,
    10,
  ),
  ...sortRows(
    "Glisse chaque problème dans la bonne case.",
    ["Problème de la terre", "Problème de la mer"],
    ["Déforestation", "Feux de brousse", "Avancée du désert"],
    ["Surpêche", "Érosion côtière"],
    SORT_HINTS,
    3,
  ),
];

export const makeCm2DegQcm: Make = (ctx) => ce2Question(ctx, "cm2-deg-qcm", "les dégradations des ressources et les réponses", DEG_QCM, 3);
export const makeCm2DegTrou: Make = (ctx) => ce2Gap(ctx, "cm2-deg-trou", "compléter une phrase sur la protection des ressources", DEG_TROU, 2, 1);
export const makeCm2DegEcrire: Make = (ctx) => ce2Write(ctx, "cm2-deg-ecrire", "écrire un problème ou une solution", DEG_ECRIRE, 1, 2);
export const makeCm2DegOrdre: Make = (ctx) => ce2Order(ctx, "cm2-deg-ordre", "ranger les étapes d'une protection", DEG_ORDRE);
export const makeCm2DegRelier: Make = (ctx) => ce2Link(ctx, "cm2-deg-relier", "relier un problème à sa solution ou à sa conséquence", DEG_RELIER);
export const makeCm2DegGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-deg-glisser", "distinguer un problème d'une solution", DEG_GLISSER, 2);

// ===========================================================================
// LA POPULATION DU SÉNÉGAL (ge-cm2-population)
// ===========================================================================

const POP_NOMBRE: Pool = {
  items: [
    {
      id: "habitants",
      q: ["Combien d'habitants le Sénégal compte-t-il environ ?", "Environ combien de personnes vivent au Sénégal selon le recensement de 2023 ?", "Le recensement de 2023 a compté environ combien de Sénégalais ?"],
      a: "18 millions",
      also: ["18 millions d'habitants", "Dix-huit millions"],
      s: ["Le Sénégal compte environ ___ d'habitants.", "Le recensement de 2023 a compté environ ___ de Sénégalais."],
      hint: "Ce nombre est plus grand que dix et plus petit que vingt.",
    },
  ],
  extras: ["8 millions", "80 millions"],
};

const POP_ANNEE: Pool = {
  items: [
    {
      id: "recensement-2023",
      q: ["En quelle année a eu lieu le dernier recensement du Sénégal ?", "Quelle année est celle du recensement qui a compté environ 18 millions d'habitants ?", "Le dernier recensement a compté la population du Sénégal, mais en quelle année ?"],
      a: "2023",
      s: ["Le dernier recensement du Sénégal a eu lieu en ___.", "En ___, le Sénégal a compté environ 18 millions d'habitants."],
      hint: "C'est une année très récente, de notre décennie.",
    },
  ],
  extras: ["2013", "2003"],
};

const POP_TERME: Pool = {
  items: [
    {
      id: "recensement",
      q: ["Comment appelle-t-on le comptage de tous les habitants d'un pays ?", "Quel mot désigne le comptage de toute la population d'un pays ?"],
      a: "Recensement",
      also: ["Le recensement"],
      ga: "recensement",
      s: ["Le mot ___ désigne le comptage de tous les habitants d'un pays.", "Le terme ___ s'applique au comptage de toute la population."],
      hint: "Des agents passent dans chaque maison pour noter les habitants.",
    },
    {
      id: "pyramide",
      q: ["Comment appelle-t-on le graphique qui montre combien il y a d'habitants de chaque âge ?", "Quel graphique montre combien il y a de jeunes et de personnes âgées dans un pays ?"],
      a: "Pyramide des âges",
      also: ["La pyramide des âges", "Pyramide des ages"],
      ga: "pyramide des âges",
      s: ["Le mot ___ désigne le graphique des habitants de chaque âge.", "Le terme ___ s'applique au graphique qui range les habitants selon leur âge."],
      hint: "Sa forme montre s'il y a beaucoup de jeunes ou de personnes âgées.",
    },
    {
      id: "densite",
      q: ["Comment appelle-t-on le nombre d'habitants par kilomètre carré ?", "Quel mot désigne le nombre de personnes qui vivent sur chaque kilomètre carré ?"],
      a: "Densité",
      also: ["La densité", "Densite"],
      ga: "densité",
      s: ["Le mot ___ désigne le nombre d'habitants par kilomètre carré.", "Le terme ___ s'applique au nombre de personnes sur chaque kilomètre carré."],
      hint: "Elle dit si les habitants sont serrés ou éparpillés.",
    },
  ],
};

const POP_JEUNE: Pool = {
  items: [
    {
      id: "jeune",
      q: ["Que montre une pyramide des âges large à sa base ?", "Si la base d'une pyramide des âges est large, que peut-on dire de la population ?", "Que révèle une pyramide des âges très large en bas ?"],
      a: "Beaucoup de jeunes",
      noWrite: true,
      ga: "beaucoup de jeunes",
      s: ["Une pyramide des âges large à sa base montre qu'il y a ___.", "Quand la base de la pyramide est large, il y a ___."],
      hint: "Le bas de la pyramide représente les plus petits.",
    },
  ],
  extras: ["Beaucoup de personnes âgées", "Très peu d'enfants"],
  gextras: ["beaucoup de personnes âgées", "très peu d'enfants"],
};

const POP_POPULATION: Pool = {
  items: [
    {
      id: "jeune",
      q: ["Comment appelle-t-on la population d'un pays où les enfants et les jeunes sont nombreux ?", "Quelle est la caractéristique de la population du Sénégal, où les enfants et les jeunes sont nombreux ?"],
      a: "Population jeune",
      also: ["Une population jeune", "Jeune"],
      ga: "jeune",
      s: ["Comme les enfants et les jeunes sont nombreux au Sénégal, sa population est ___.", "Un pays où il y a beaucoup d'enfants et de jeunes a une population ___."],
      hint: "Les enfants et les jeunes sont plus nombreux que les personnes âgées.",
    },
  ],
  extras: ["Population âgée", "Population vieillissante"],
  gextras: ["âgée", "vieillissante"],
};

const POP_DENSITE: Pool = {
  items: [
    {
      id: "dakar-densite",
      q: ["Quelle région du Sénégal a la plus forte densité de population ?", "Dans quelle région vivent le plus d'habitants par kilomètre carré ?", "Quelle région est la plus densément peuplée du pays ?"],
      a: "Dakar",
      also: ["Région de Dakar", "La région de Dakar"],
      s: ["La densité de population est la plus forte dans la région de ___.", "Dans la région de ___, il y a énormément d'habitants par kilomètre carré."],
      hint: "C'est une presqu'île étroite, très peuplée.",
    },
  ],
  extras: ["Kédougou", "Tambacounda", "Matam"],
};

const POP_REPARTITION: Pool = {
  items: [
    {
      id: "inegale",
      q: ["Comment est répartie la population sur le territoire du Sénégal ?", "Que peut-on dire de la répartition des habitants sur le territoire sénégalais ?"],
      a: "Inégale",
      also: ["Elle est inégale", "Inegale", "Mal répartie"],
      ga: "inégale",
      s: ["La répartition de la population au Sénégal est ___.", "Les habitants sont répartis de façon ___."],
      hint: "Certains endroits sont très peuplés alors que d'autres sont presque vides.",
    },
  ],
  extras: ["Égale", "Régulière"],
  gextras: ["égale", "régulière"],
};

const POP_LANGUE: Pool = {
  items: [
    {
      id: "wolof",
      q: ["Quelle langue nationale est comprise par la majorité des Sénégalais ?", "Quelle langue nationale est la plus parlée au Sénégal ?", "Quelle langue nationale sert souvent de langue commune entre Sénégalais de groupes différents ?"],
      a: "Wolof",
      also: ["Le wolof"],
      ga: "le wolof",
      s: ["La langue nationale la plus parlée au Sénégal est ___.", "La majorité des Sénégalais comprennent ___."],
      hint: "Elle sert de langue commune dans les marchés et dans les villes.",
    },
  ],
  extras: ["Pulaar", "Sérère", "Diola"],
  gextras: ["le pulaar", "le sérère", "le diola"],
  onlyExtras: true,
};

const POP_NATIONALE: Pool = {
  items: [
    {
      id: "langue-nationale",
      q: ["Laquelle de ces langues est une langue nationale du Sénégal ?", "Quelle langue fait partie des langues nationales du Sénégal ?"],
      a: "Wolof",
      w: "Écris le nom d'une langue nationale du Sénégal.",
      also: ["Wolof", "Pulaar", "Sérère", "Serere", "Diola", "Mandingue", "Soninké", "Soninke"],
      ga: "le wolof",
      s: ["Parmi les langues nationales du Sénégal, on trouve ___.", "Une langue nationale du Sénégal est ___."],
      hint: "Cette langue se parle dans le pays depuis très longtemps.",
    },
    {
      id: "langue-nationale",
      q: ["Parmi ces langues, laquelle est nationale au Sénégal ?", "Quelle langue de la liste est parlée au Sénégal comme langue nationale ?"],
      a: "Pulaar",
      noWrite: true,
      ga: "le pulaar",
      s: ["Le Sénégal compte ___ parmi ses langues nationales.", "Au Sénégal, ___ est une langue nationale."],
      hint: "Cette langue se parle surtout le long du fleuve.",
    },
    {
      id: "langue-nationale",
      q: ["Laquelle de ces langues se parle au Sénégal comme langue nationale ?", "Quelle langue de cette liste compte parmi les langues nationales ?"],
      a: "Sérère",
      noWrite: true,
      ga: "le sérère",
      s: ["Parmi les langues du pays, ___ est une langue nationale.", "Le Sénégal reconnaît ___ comme langue nationale."],
      hint: "Cette langue se parle surtout dans le Sine et le Saloum.",
    },
    {
      id: "langue-nationale",
      q: ["Quelle langue de la liste est une langue nationale du Sénégal ?", "Laquelle de ces langues est reconnue comme langue nationale ?"],
      a: "Diola",
      noWrite: true,
      ga: "le diola",
      s: ["En Casamance, ___ est une langue nationale très parlée.", "Le Sénégal compte ___ parmi ses langues nationales."],
      hint: "Cette langue se parle surtout dans le sud-ouest du pays.",
    },
    {
      id: "langue-nationale",
      q: ["Quel nom de langue est celui d'une langue nationale du Sénégal ?", "Parmi ces noms de langues, lequel est celui d'une langue nationale ?"],
      a: "Mandingue",
      noWrite: true,
      ga: "le mandingue",
      s: ["Le Sénégal reconnaît aussi ___ comme langue nationale.", "Parmi les langues nationales du pays, on trouve ___."],
      hint: "Cette langue se parle dans le sud et dans l'est du pays.",
    },
    {
      id: "langue-nationale",
      q: ["Lequel de ces noms est celui d'une langue nationale du Sénégal ?", "Quelle langue de cette liste est une langue nationale ?"],
      a: "Soninké",
      noWrite: true,
      ga: "le soninké",
      s: ["La langue nationale ___ se parle surtout dans l'est du pays.", "Parmi les langues nationales du Sénégal, on trouve aussi ___."],
      hint: "Cette langue se parle surtout dans l'est du pays.",
    },
  ],
  extras: ["Anglais", "Espagnol", "Portugais", "Allemand"],
  gextras: ["l'anglais", "l'espagnol", "le portugais", "l'allemand"],
  onlyExtras: true,
};

const POP_OFFICIELLE: Pool = {
  items: [
    {
      id: "officielle",
      q: ["Quelle est la langue officielle du Sénégal ?", "Dans quelle langue sont écrits les lois et les textes officiels du Sénégal ?"],
      a: "Français",
      also: ["Le français", "Francais"],
      ga: "le français",
      s: ["La langue officielle du Sénégal est ___.", "Les textes officiels du Sénégal sont écrits en ___."],
      hint: "C'est la langue héritée de l'ancienne colonie.",
    },
  ],
  extras: ["Wolof", "Pulaar"],
  gextras: ["le wolof", "le pulaar"],
  onlyExtras: true,
};

const POP_DIVERSITE: Pool = {
  items: [
    {
      id: "diversite",
      q: ["Comment appelle-t-on le fait que de nombreux groupes et langues vivent ensemble au Sénégal ?", "Quelle richesse le mélange des groupes et des langues apporte-t-il au pays ?"],
      a: "Diversité",
      also: ["La diversité", "Diversite"],
      ga: "diversité",
      s: ["Les nombreux groupes et langues du Sénégal forment sa ___.", "Le mélange des groupes et des langues fait la ___ du pays."],
      hint: "Beaucoup de façons de parler et de vivre existent dans un même pays.",
    },
  ],
  extras: ["Densité", "Pauvreté"],
  gextras: ["densité", "pauvreté"],
};

const POP_POOLS = [POP_NOMBRE, POP_ANNEE, POP_TERME, POP_JEUNE, POP_POPULATION, POP_DENSITE, POP_REPARTITION, POP_LANGUE, POP_NATIONALE, POP_OFFICIELLE, POP_DIVERSITE] as const;
const POP_QCM = questionRows("ge-cm2-population", POP_POOLS);
const POP_TROU = gapRows("ge-cm2-population", POP_POOLS);
const POP_ECRIRE = writeRows("ge-cm2-population", [POP_ANNEE, POP_TERME, POP_DENSITE, POP_LANGUE, POP_NATIONALE, POP_OFFICIELLE, POP_DIVERSITE]);

const POP_ORDRE: readonly OrderRow[] = [
  order("Range ces régions de la plus dense à la moins dense.", ["Dakar", "Thiès", "Tambacounda"], "pop-ordre:densite"),
  order("Range les étapes d'un recensement.", ["Préparer le questionnaire", "Visiter chaque maison", "Noter les habitants", "Compter le total"], "pop-ordre:recensement"),
  order("Range ces nombres d'habitants du plus petit au plus grand.", ["1 million", "8 millions", "18 millions"], "pop-ordre:nombres"),
  order("Range ces groupes d'âge du plus jeune au plus âgé.", ["Nourrisson", "Enfant", "Adulte", "Personne âgée"], "pop-ordre:ages"),
  order("Range ces lieux du moins peuplé au plus peuplé.", ["Désert", "Village", "Ville", "Capitale"], "pop-ordre:lieux"),
];

const POP_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à ce qu'il désigne.", [["Recensement", "Compter les habitants"], ["Densité", "Habitants par kilomètre carré"], ["Pyramide des âges", "Habitants de chaque âge"]]),
  link("Relie chaque nom à ce qu'il décrit.", [["Dakar", "Région la plus peuplée"], ["Ferlo", "Zone peu peuplée"], ["Wolof", "Langue la plus parlée"]]),
  link("Relie chaque langue à son rôle.", [["Français", "Langue officielle"], ["Wolof", "Langue la plus parlée"], ["Diola", "Langue nationale de Casamance"]]),
  link("Relie chaque mot à ce qu'il décrit.", [["Population jeune", "Beaucoup d'enfants"], ["Répartition inégale", "Des lieux très peuplés et d'autres presque vides"], ["Diversité", "Plusieurs groupes et langues"]]),
  link("Relie chaque langue nationale à un lieu.", [["Diola", "Casamance"], ["Pulaar", "Fleuve"], ["Sérère", "Sine et Saloum"]]),
  link("Relie chaque chiffre à ce qu'il décrit.", [["18 millions", "Habitants du Sénégal"], ["2023", "Année du recensement"], ["Dakar", "Région la plus dense"]]),
];

const POP_GLISSER = [
  ...sortRows(
    "Glisse chaque langue dans la bonne case.",
    ["Une langue nationale", "Une langue étrangère"],
    ["Wolof", "Pulaar", "Sérère", "Diola", "Mandingue", "Soninké"],
    ["Anglais", "Espagnol", "Portugais", "Allemand"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque lieu dans la bonne case.",
    ["Beaucoup d'habitants", "Peu d'habitants"],
    ["Dakar", "Thiès", "Côte"],
    ["Ferlo", "Kédougou", "Tambacounda"],
    SORT_HINTS,
    6,
  ),
];

export const makeCm2PopQcm: Make = (ctx) => ce2Question(ctx, "cm2-pop-qcm", "la population, sa répartition et ses langues", POP_QCM, 3);
export const makeCm2PopTrou: Make = (ctx) => ce2Gap(ctx, "cm2-pop-trou", "compléter une phrase sur la population du Sénégal", POP_TROU, 2, 1);
export const makeCm2PopEcrire: Make = (ctx) => ce2Write(ctx, "cm2-pop-ecrire", "écrire un fait sur la population du Sénégal", POP_ECRIRE, 1, 2);
export const makeCm2PopOrdre: Make = (ctx) => ce2Order(ctx, "cm2-pop-ordre", "ranger des régions, des nombres ou les étapes d'un recensement", POP_ORDRE);
export const makeCm2PopRelier: Make = (ctx) => ce2Link(ctx, "cm2-pop-relier", "relier un mot de la population à son sens", POP_RELIER);
export const makeCm2PopGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-pop-glisser", "classer les langues et les lieux selon leur peuplement", POP_GLISSER, 2);

// ===========================================================================
// VILLES ET CAMPAGNES (ge-cm2-villes)
// ===========================================================================

const VIL_HABITAT: Pool = {
  items: [
    {
      id: "case",
      q: ["Quelle habitation traditionnelle est faite de banco avec un toit de paille ?", "Comment se nomme l'habitation en terre et en paille des villages ?", "Quel type d'habitat rural est construit avec de la terre et de la paille ?"],
      a: "Case",
      also: ["La case"],
      ga: "la case",
      s: ["Une habitation en banco avec un toit de paille, c'est ___.", "Dans un village, une habitation en terre et en paille, c'est ___."],
      hint: "Ses murs de terre gardent la fraîcheur.",
    },
    {
      id: "maison-dur",
      q: ["Quelle habitation est construite en briques de ciment avec un toit en tôle ?", "Comment appelle-t-on l'habitation solide faite de ciment et de béton ?", "Quelle habitation moderne est bâtie avec du ciment plutôt qu'avec de la terre ?"],
      a: "Maison en dur",
      also: ["Une maison en dur", "La maison en dur", "Maison en ciment"],
      not: ["Immeuble"],
      ga: "la maison en dur",
      s: ["Une habitation solide en ciment, c'est ___.", "Une habitation bâtie en briques de ciment, c'est ___."],
      hint: "Ses murs solides résistent bien à la pluie.",
    },
    {
      id: "immeuble",
      q: ["Quel bâtiment de ville compte plusieurs étages avec un logement sur chaque étage ?", "Comment appelle-t-on le grand bâtiment qui regroupe des appartements les uns au-dessus des autres ?", "Quel type d'habitat urbain est haut, avec plusieurs étages de logements ?"],
      a: "Immeuble",
      also: ["Un immeuble", "L'immeuble"],
      not: ["Maison en dur"],
      ga: "l'immeuble",
      s: ["Un grand bâtiment à plusieurs étages, c'est ___.", "Un bâtiment qui regroupe des appartements, c'est ___."],
      hint: "Des familles vivent les unes au-dessus des autres.",
    },
  ],
  extras: ["Tente", "Igloo"],
  gextras: ["la tente", "l'igloo"],
};

const VIL_LIEU: Pool = {
  items: [
    {
      id: "village",
      q: ["Comment appelle-t-on un petit groupe d'habitations entouré de champs ?", "Quel lieu de vie regroupe quelques familles autour des champs et d'un puits ?", "Où habitent la plupart des paysans qui cultivent la terre ?"],
      a: "Village",
      also: ["Le village"],
      ga: "village",
      s: ["Le mot ___ désigne un petit groupe d'habitations entouré de champs.", "Le terme ___ s'applique au lieu où vivent les paysans."],
      hint: "Les familles se connaissent toutes et vivent près des champs.",
    },
    {
      id: "ville",
      q: ["Comment appelle-t-on un grand lieu avec des immeubles, des rues goudronnées et beaucoup d'habitants ?", "Quel lieu de vie a des marchés, des immeubles, des écoles et beaucoup de voitures ?", "Où se trouvent les grands marchés, les administrations et les immeubles ?"],
      a: "Ville",
      also: ["La ville"],
      ga: "ville",
      s: ["Le mot ___ désigne un grand lieu avec des immeubles et beaucoup d'habitants.", "Le terme ___ s'applique au lieu des grands marchés et des immeubles."],
      hint: "Les rues sont larges, goudronnées et toujours animées.",
    },
  ],
  extras: ["Désert", "Forêt"],
  gextras: ["désert", "forêt"],
};

const VIL_TERME: Pool = {
  items: [
    {
      id: "exode",
      q: ["Comment appelle-t-on le départ des habitants des campagnes vers les villes ?", "Quel nom porte le fait que des villageois quittent leur village pour s'installer en ville ?"],
      a: "Exode rural",
      also: ["L'exode rural", "Exode"],
      ga: "l'exode rural",
      s: ["Le départ des villageois vers les villes se nomme ___.", "Les villageois qui partent vivre en ville provoquent ___."],
      hint: "Les villages perdent des habitants au profit des villes.",
    },
    {
      id: "urbanisation",
      q: ["Comment appelle-t-on la croissance des villes qui accueillent de plus en plus d'habitants ?", "Quel mot désigne le fait que les villes grandissent et que la part des citadins augmente ?"],
      a: "Urbanisation",
      also: ["L'urbanisation", "Croissance des villes", "Croissance urbaine"],
      ga: "l'urbanisation",
      s: ["La croissance des villes qui s'étendent se nomme ___.", "Des villes qui grandissent et reçoivent plus de monde, voilà ___."],
      hint: "Les maisons gagnent peu à peu sur les champs autour des agglomérations.",
    },
  ],
  extras: ["Recensement", "Reboisement"],
  gextras: ["le recensement", "le reboisement"],
};

const VIL_RAISON: Pool = {
  items: [
    {
      id: "raison",
      q: ["Pourquoi beaucoup de jeunes quittent-ils le village pour la ville ?", "Quelle raison pousse souvent un jeune à partir du village vers la ville ?", "Que cherche surtout un jeune qui quitte son village pour la ville ?"],
      a: "Chercher du travail",
      also: ["Pour chercher du travail", "Un travail", "Un emploi", "Du travail"],
      ga: "chercher du travail",
      s: ["Beaucoup de jeunes quittent le village pour ___.", "Un jeune part en ville pour ___."],
      hint: "Au village, il y a peu d'emplois en dehors des champs.",
    },
  ],
  extras: ["Garder les troupeaux", "Cultiver le champ familial"],
  gextras: ["garder les troupeaux", "cultiver le champ familial"],
};

const VIL_CONS: Pool = {
  items: [
    {
      id: "cons-village",
      q: ["Quelle conséquence l'exode rural a-t-il sur les villages ?", "Que devient un village quand beaucoup de jeunes le quittent ?"],
      a: "Les villages se vident",
      noWrite: true,
      not: ["Les logements manquent"],
      hint: "Il reste surtout des enfants et des personnes âgées.",
    },
    {
      id: "cons-ville",
      q: ["Quelle conséquence l'exode rural a-t-il sur les villes ?", "Que se passe-t-il dans une ville où arrivent beaucoup de nouveaux habitants ?"],
      a: "Les logements manquent",
      noWrite: true,
      not: ["Les villages se vident"],
      hint: "Il devient difficile de trouver où habiter.",
    },
  ],
  extras: ["Les villes se vident", "Les villages deviennent des villes"],
  onlyExtras: true,
};

const VIL_PROBLEME: Pool = {
  items: [
    {
      id: "embouteillages",
      q: ["Quel problème bloque les voitures dans les rues des grandes villes aux heures de pointe ?", "Comment appelle-t-on les files de voitures arrêtées dans les rues d'une grande ville ?", "Quel problème de circulation touche les grandes villes comme Dakar ?"],
      a: "Embouteillages",
      also: ["Les embouteillages", "Embouteillage"],
      ga: "embouteillages",
      s: ["Le mot ___ désigne les files de voitures arrêtées dans les rues.", "Le terme ___ s'applique aux voitures bloquées aux heures de pointe."],
      hint: "On avance très lentement alors qu'on est pressé.",
    },
    {
      id: "pollution",
      q: ["Quel problème salit l'air et les rues des grandes villes ?", "Comment appelle-t-on la fumée et les déchets qui abîment l'air et les rues ?", "Quel problème vient de la fumée, des déchets et de la saleté dans les grandes villes ?"],
      a: "Pollution",
      also: ["La pollution"],
      ga: "pollution",
      s: ["Le mot ___ désigne la fumée et les déchets qui abîment l'air.", "Le terme ___ se dit de la saleté de l'air et des rues."],
      hint: "L'air devient difficile à respirer et les rues se salissent.",
    },
    {
      id: "logement",
      q: ["Quel problème touche les familles très nombreuses qui vivent à l'étroit en ville ?", "Quel problème apparaît quand il manque des maisons et des appartements pour tous les habitants ?", "Comment appelle-t-on le fait de ne pas trouver assez d'habitations dans une grande ville ?"],
      a: "Manque de logements",
      also: ["Le manque de logements", "Manque de logement"],
      ga: "manque de logements",
      s: ["Le terme ___ s'applique aux familles qui ne trouvent pas où habiter.", "Le mot ___ désigne le manque d'habitations pour les familles."],
      hint: "Les familles se serrent à plusieurs dans de petites pièces.",
    },
    {
      id: "chomage",
      q: ["Quel problème touche les jeunes sans emploi qui cherchent un travail ?", "Comment appelle-t-on le fait de ne pas trouver de travail alors qu'on en cherche ?", "Quel problème apparaît quand il y a plus de gens qui cherchent du travail que d'emplois ?"],
      a: "Chômage",
      also: ["Le chômage", "Chomage"],
      ga: "chômage",
      s: ["Le mot ___ désigne le fait de ne pas trouver de travail.", "Le terme ___ s'applique aux personnes qui cherchent un emploi sans en trouver."],
      hint: "Beaucoup de gens cherchent un emploi, mais peu en trouvent.",
    },
  ],
};

const VIL_POOLS = [VIL_HABITAT, VIL_LIEU, VIL_TERME, VIL_RAISON, VIL_CONS, VIL_PROBLEME] as const;
const VIL_QCM = questionRows("ge-cm2-villes", VIL_POOLS);
const VIL_TROU = gapRows("ge-cm2-villes", VIL_POOLS);
const VIL_ECRIRE = writeRows("ge-cm2-villes", VIL_POOLS);

/** Le départ d'un jeune : les indices habituels (« arrivé le plus tôt ») écriraient un mot d'une tuile (« arrive »). */
const DEPART_HINTS = hints("Lis toutes les étapes avant de les ranger.", "Commence par ce qui se passe au début du départ.", "Ce qui se passe à la fin se range en dernier.");

const VIL_ORDRE: readonly OrderRow[] = [
  order("Range ces lieux du plus petit au plus grand.", ["Maison", "Quartier", "Ville"], "vil-ordre:lieux"),
  order("Range ces lieux du plus petit au plus grand.", ["Quartier", "Ville", "Région"], "vil-ordre:region"),
  order("Range ces lieux du plus petit au plus grand.", ["Maison", "Quartier", "Ville", "Région"], "vil-ordre:quatre"),
  order("Range les étapes du départ d'un jeune vers la ville.", ["Il quitte son village", "Il prend la route", "Il arrive en ville", "Il cherche du travail"], "vil-ordre:depart", DEPART_HINTS),
  order("Range ces habitations de la moins haute à la plus haute.", ["Case", "Maison en dur", "Immeuble"], "vil-ordre:habitations"),
];

const VIL_RELIER: readonly LinkRow[] = [
  link("Relie chaque habitat à ce qui le décrit.", [["Case", "Banco et paille"], ["Maison en dur", "Ciment et tôle"], ["Immeuble", "Plusieurs étages"]]),
  link("Relie chaque mot à ce qui le décrit.", [["Village", "Champs et troupeaux"], ["Ville", "Rues, marchés et immeubles"], ["Exode rural", "Départ vers la ville"]]),
  link("Relie chaque problème à ce qui le décrit.", [["Embouteillages", "Voitures bloquées"], ["Pollution", "Air et rues sales"], ["Chômage", "Jeunes sans emploi"], ["Manque de logements", "Familles à l'étroit"]]),
  link("Relie chaque mot à son sens.", [["Urbanisation", "Croissance des villes"], ["Exode rural", "Départ vers la ville"], ["Village", "Petit groupe d'habitations"]]),
  link("Relie chaque lieu à ce qu'on y fait.", [["Champ", "Cultiver"], ["Marché", "Vendre"], ["École", "Apprendre"]]),
  link("Relie chaque problème à sa cause.", [["Embouteillages", "Trop de voitures"], ["Manque de logements", "Trop d'arrivants"], ["Villages qui se vident", "Départ des jeunes"]]),
];

const VIL_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["À la campagne", "En ville"],
    ["Champs de mil", "Troupeaux", "Maison en banco", "Puits du village"],
    ["Embouteillages", "Immeubles", "Autobus", "Trottoirs"],
    SORT_HINTS,
    6,
  ),
  ...sortRows(
    "Glisse chaque problème dans la bonne case.",
    ["Un problème de ville", "Un problème de campagne"],
    ["Embouteillages", "Pollution", "Manque de logements"],
    ["Villages qui se vident", "Champs abandonnés", "Manque de bras pour cultiver"],
    SORT_HINTS,
    6,
  ),
];

export const makeCm2VilQcm: Make = (ctx) => ce2Question(ctx, "cm2-vil-qcm", "l'habitat, l'exode rural et la vie en ville", VIL_QCM, 3);
export const makeCm2VilTrou: Make = (ctx) => ce2Gap(ctx, "cm2-vil-trou", "compléter une phrase sur les villes et les campagnes", VIL_TROU, 2, 1);
export const makeCm2VilEcrire: Make = (ctx) => ce2Write(ctx, "cm2-vil-ecrire", "écrire un fait sur les villes et les campagnes", VIL_ECRIRE, 1, 2);
export const makeCm2VilOrdre: Make = (ctx) => ce2Order(ctx, "cm2-vil-ordre", "ranger des lieux ou les étapes d'un départ vers la ville", VIL_ORDRE);
export const makeCm2VilRelier: Make = (ctx) => ce2Link(ctx, "cm2-vil-relier", "relier un habitat, un lieu ou un problème à ce qui le décrit", VIL_RELIER);
export const makeCm2VilGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-vil-glisser", "distinguer la campagne et la ville", VIL_GLISSER, 2);
