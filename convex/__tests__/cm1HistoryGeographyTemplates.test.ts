import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { SHORT_OF_CHOICES, gapRows, questionRows, writeRows, type Pool } from "../paliers/games/cm1Faits";
import { windowAt } from "../paliers/games/ce2Outils";
import { gameLevel, makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 120_000 });

/**
 * L'HISTOIRE ET LA GÉOGRAPHIE DU CM1 : dix thématiques, cinquante-sept gabarits (`cm1Histoire.ts`, `cm1Geographie.ts`).
 *
 * Le CM1 a CINQ paliers, joués aux niveaux 1, 2, 2, 3 et 4 : chaque tirage connaît sa place (`GameContext.palier`).
 *
 * Les gabarits tirent leurs lignes de tableaux de faits (`cm1Faits.ts`). Ce fichier ne lit AUCUN de ces tableaux : il a ses propres
 * tables, écrites à part, qui disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`), dans quel ordre vont
 * les suites (`CHAINS`), quelles paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`). Un fait faux, une réponse
 * échangée, un mauvais choix qui serait aussi juste font échouer ces vérifications. À la fin, des MUTATIONS : on abîme la bonne réponse
 * d'un exercice juste, et chaque vérification doit le voir.
 */

const KLASS = "CM1";
const COUNT = 5;
const PALIERS = [1, 2, 3, 4, 5];
const VS16 = String.fromCodePoint(0xfe0f);

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "hi-cm1-prehistoire": ["cm1-pre-qcm", "cm1-pre-trou", "cm1-pre-ecrire", "cm1-pre-ordre", "cm1-pre-relier", "cm1-pre-glisser"],
  "hi-cm1-royaumes": ["cm1-roy-qcm", "cm1-roy-trou", "cm1-roy-ecrire", "cm1-roy-relier", "cm1-roy-glisser"],
  "hi-cm1-contacts": ["cm1-con-qcm", "cm1-con-trou", "cm1-con-ecrire", "cm1-con-ordre", "cm1-con-relier", "cm1-con-glisser"],
  "hi-cm1-resistants": ["cm1-res-qcm", "cm1-res-trou", "cm1-res-ecrire", "cm1-res-relier", "cm1-res-glisser"],
  "hi-cm1-paix": ["cm1-pai-qcm", "cm1-pai-trou", "cm1-pai-ecrire", "cm1-pai-ordre", "cm1-pai-relier", "cm1-pai-glisser"],
  "ge-cm1-situation": ["cm1-sit-qcm", "cm1-sit-trou", "cm1-sit-ecrire", "cm1-sit-relier", "cm1-sit-glisser"],
  "ge-cm1-climats": ["cm1-cli-qcm", "cm1-cli-trou", "cm1-cli-ecrire", "cm1-cli-ordre", "cm1-cli-relier", "cm1-cli-glisser"],
  "ge-cm1-decoupage": ["cm1-dec-qcm", "cm1-dec-trou", "cm1-dec-ecrire", "cm1-dec-ordre", "cm1-dec-relier", "cm1-dec-glisser"],
  "ge-cm1-economie": ["cm1-eco-qcm", "cm1-eco-trou", "cm1-eco-ecrire", "cm1-eco-ordre", "cm1-eco-relier", "cm1-eco-glisser"],
  "ge-cm1-communication": ["cm1-com-qcm", "cm1-com-trou", "cm1-com-ecrire", "cm1-com-ordre", "cm1-com-relier", "cm1-com-glisser"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const KINDS = Object.values(TOPIC_KINDS).flat() as GameKind[];
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

const draws = PALIERS.flatMap((palier) => Array.from({ length: 40 }, (_, n) => ({ palier, level: gameLevel(palier, COUNT) as GameLevel, seed: `cm1hg:${palier}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) =>
  GAME_KINDS[kind].make(makeContext(KLASS, d.level, `${kind}:${d.seed}`, new Set(), undefined, undefined, { index: d.palier, count: COUNT }));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);

type Check = (exo: Exo) => string | null;

// ===========================================================================
// LES TABLES, ÉCRITES À PART
// ===========================================================================

const ARTICLES = ["de l ", "de la ", "du ", "des ", "a l ", "a la ", "au ", "aux ", "l ", "le ", "la ", "les ", "un ", "une "];
/** Une réponse sans son article, repliée : « Le feu » et « feu » sont la même entrée. */
const norm = (text: string) => {
  const folded = fold(text);
  const article = ARTICLES.find((prefix) => folded.startsWith(prefix));
  return article ? folded.slice(article.length) : folded;
};
const tokens = (text: string) => ` ${fold(text)} `;
/** Un fragment est une suite de mots entiers ; `*` à la fin laisse le dernier mot finir comme il veut. */
const has = (stem: string, fragment: string) => {
  const prefix = fragment.endsWith("*");
  const wanted = fold(prefix ? fragment.slice(0, -1) : fragment);
  return prefix ? tokens(stem).includes(` ${wanted}`) : tokens(stem).includes(` ${wanted} `);
};

/**
 * Pour chaque réponse possible (bonne ou mauvaise), les fragments qu'un énoncé ne contient que s'il parle d'elle.
 * Une bonne réponse doit avoir au moins un de ses fragments dans l'énoncé ; un mauvais choix ne doit en avoir aucun qui ne soit aussi
 * un fragment de la bonne réponse. Une entrée vide : une réponse qui n'est jamais bonne.
 */
const ASSOC: Record<string, string[]> = {
  // La préhistoire
  "pierre taillee": ["silex"],
  taillee: ["silex"],
  "pierre polie": ["hache*", "frott*"],
  polie: ["hache*", "frott*"],
  metaux: [],
  feu: ["chauff*", "eclairer", "lumiere", "froid", "cuire", "cuisaient"],
  agriculture: ["seme*", "cultivent la terre", "cultiver le mil", "cultive l arachide", "champs de mil", "culture du mil", "fait pousser"],
  elevage: ["troupeau*", "lait toute l annee", "vaches", "boeufs", "chevres", "moutons", "viande et le lait", "pour avoir du lait"],
  "chasse et cueillette": ["avant de cultiver", "sans cultiver ni elever", "poursuivaient le gibier", "procuraient", "premiers hommes vivaient"],
  chasse: ["avant de cultiver", "sans cultiver ni elever", "poursuivaient le gibier", "procuraient", "et la cueillette", "premiers hommes vivaient"],
  "sine ngayene": ["cercles de pierres"],
  wanar: ["avec sine ngayene", "voisin de sine ngayene", "cote de sine ngayene"],
  "delta du saloum": ["coquillage*"],
  saloum: ["coquillage*"],
  commerce: ["echanger et vendre", "vendre et acheter", "achete et vend", "acheter et vendre", "de pays en pays", "sel et les etoffes", "circuler les marchandises"],
  // Les royaumes
  roi: ["prenait les grandes decisions", "dirigeait un royaume", "rendait la justice", "chef qui commandait", "chef d un royaume", "dirige et qui rend"],
  notables: ["conseillait le roi", "aidait le roi", "conseille par", "avis au roi"],
  armee: ["defendait le royaume", "defendre le royaume", "protegeait les villages", "guerriers"],
  marchands: [],
  damel: ["cayor", "lat dior"],
  bourba: ["djolof", "alboury"],
  teigne: ["baol"],
  brak: ["walo"],
  bour: ["sine"],
  almamy: ["fouta"],
  mansa: ["gabou"],
  cayor: ["damel"],
  djolof: ["bourba"],
  baol: ["teigne"],
  walo: ["brak"],
  sine: ["bour"],
  gabou: ["mansa"],
  fouta: ["almamy"],
  // Les premiers contacts
  chameau: ["animal", "montaient sur des", "nombreux"],
  chameaux: ["animal", "montaient sur des", "nombreux"],
  cheval: [],
  chevaux: [],
  boeuf: [],
  boeufs: [],
  caravane: ["groupe de marchands", "voyage des marchands", "voyageaient en", "longue"],
  islam: ["religion", "fait connaitre", "repandu au senegal"],
  christianisme: [],
  bouddhisme: [],
  "xie siecle": ["almoravides"],
  "xve siecle": ["portugais"],
  "xixe siecle": ["conquete coloniale"],
  portugais: ["arrives les premiers", "aborde les premiers", "premiers europeens", "avant les autres europeens"],
  francais: [],
  anglais: [],
  comptoir: ["poste de commerce", "construisaient les europeens", "construit des", "goree et saint-louis"],
  comptoirs: ["poste de commerce", "construisaient les europeens", "construit des", "goree et saint-louis"],
  village: [],
  villages: [],
  royaume: [],
  royaumes: [],
  goree: ["en face de dakar", "au large de dakar", "petite ile"],
  "ile de goree": ["en face de dakar", "au large de dakar", "petite ile"],
  "saint-louis": ["embouchure", "nord-ouest", "bord du fleuve"],
  touba: ["ville sainte", "mosquee des mourides"],
  kaolack: [],
  // Les résistants
  "lat dior": ["damel du cayor", "diop"],
  alboury: ["dernier bourba", "bourba du djolof", "ndiaye"],
  "alboury ndiaye": ["dernier bourba", "bourba du djolof", "ndiaye"],
  "el hadji oumar tall": ["toucouleur", "faidherbe", "tall"],
  "el hadji oumar": ["toucouleur", "faidherbe", "tall"],
  "maba diakhou ba": ["rip", "diakhou"],
  maba: ["rip", "diakhou"],
  "ahmadou cheikhou": ["parmi ces noms", "un de ces noms", "cheikhou", "ecris le nom d un resistant"],
  ahmadou: ["parmi ces noms", "un de ces noms", "cheikhou", "ecris le nom d un resistant"],
  "fode kaba doumbouya": ["quel nom est celui", "lequel de ces noms", "doumbouya", "ecris le nom d un resistant"],
  fode: ["quel nom est celui", "lequel de ces noms", "doumbouya", "ecris le nom d un resistant"],
  "louis faidherbe": ["faidherbe"],
  louis: ["faidherbe"],
  dekheule: ["lat dior"],
  podor: [],
  "1886": ["lat dior", "dekheule"],
  "1895": ["bamba"],
  "1902": [],
  "1943": ["aline"],
  "1960": ["independant", "devenu libre"],
  lat: [],
  // La résistance sans les armes
  "cheikh ahmadou bamba": ["mouridisme", "gabon", "touba", "sans les armes", "prendre les armes", "bamba"],
  "cheikh ahmadou": ["mouridisme", "gabon", "touba", "sans les armes", "prendre les armes", "bamba"],
  "aline sitoe diatta": ["casamance", "arretee", "resistante", "sitoe diatta"],
  aline: ["casamance", "arretee", "resistante", "sitoe diatta"],
  "leopold sedar senghor": ["premier president", "poete", "independance", "sedar senghor"],
  leopold: ["premier president", "poete", "independance", "sedar senghor"],
  gabon: ["bamba"],
  mali: ["a l est", "est du senegal"],
  mauritanie: ["au nord", "nord du senegal"],
  casamance: ["aline"],
  "sine-saloum": [],
  "4 avril": ["independance"],
  "1er mai": [],
  "14 juillet": [],
  "20 aout": [],
  mouridisme: ["voie religieuse", "fondateur du", "disciples du", "mourides sont"],
  // La situation du Sénégal
  "ocean atlantique": ["ocean"],
  atlantique: ["ocean"],
  "ocean indien": [],
  indien: [],
  "ocean pacifique": [],
  pacifique: [],
  ouest: ["partie de l afrique", "continent africain"],
  est: [],
  sud: ["guineen", "plus abondantes", "plus de pluie"],
  guinee: ["sud-est"],
  "guinee-bissau": ["au sud du senegal", "au sud et sur la cote"],
  gambie: ["enclave*", "mince pays"],
  "cote d ivoire": [],
  maroc: [],
  "presqu ile du cap-vert": ["dakar", "capitale"],
  "cap-vert": ["dakar", "capitale"],
  "surtout plat": ["relief", "etendues"],
  plat: ["relief", "etendues"],
  "tres montagneux": [],
  montagneux: [],
  "couvert de volcans": [],
  volcanique: [],
  dakar: ["capitale", "gouvernement", "region et la capitale"],
  thies: ["taiba"],
  // Les climats
  sahelien: ["au nord", "nord du senegal", "nord du pays"],
  soudanien: ["au centre", "centre du senegal", "centre du pays"],
  guineen: ["au sud", "sud du senegal", "sud du pays"],
  desertique: [],
  polaire: [],
  nord: ["sahelien", "plus rares", "moins de pluie"],
  centre: ["soudanien"],
  steppe: ["petites herbes", "maigres herbes", "au nord", "le nord"],
  savane: ["herbes hautes", "hautes herbes", "au centre", "le centre"],
  foret: ["grands arbres", "arbres sont hauts", "au sud", "le sud"],
  toundra: [],
  prairie: [],
  // Le découpage administratif
  gouverneur: ["une region", "d une region"],
  prefet: ["un departement", "d un departement"],
  "sous-prefet": ["un arrondissement", "d un arrondissement"],
  maire: ["une commune", "d une commune"],
  region: ["gouverneur"],
  departement: ["le prefet", "un prefet"],
  arrondissement: ["sous-prefet"],
  commune: ["maire"],
  "14": ["regions"],
  "8": [],
  "10": [],
  "12": [],
  // Les activités économiques
  peche: ["poisson", "pirogue*", "filets"],
  mines: ["phosphates", "minerais"],
  industrie: ["usine*", "huile du ciment"],
  artisanat: ["a la main"],
  phosphates: ["taiba"],
  or: ["sabodala"],
  charbon: [],
  diamant: [],
  diamants: [],
  kedougou: ["sabodala"],
  louga: [],
  ziguinchor: [],
  // Les voies de communication
  autoroute: ["peage", "vehicules rapides", "route large"],
  piste: [],
  sentier: [],
  "route de terre": [],
  "chemin de fer": ["roulent les trains", "trains roulent", "rails du"],
  ter: ["train express"],
  "car rapide": [],
  port: ["navires", "bateaux de commerce"],
  gare: [],
  marche: [],
  stade: [],
  "aeroport blaise-diagne": ["aeroport", "avions"],
  diagne: ["blaise"],
  "aeroport de goree": [],
  "aeroport du ferlo": [],
  senghor: [],
  diouf: [],
  radio: ["sans montrer d images", "sans images", "sans image", "voix et de la musique"],
  television: ["images et des sons", "regarder un journal", "voir un journal", "images animees"],
  telephone: ["parler a quelqu un qui est loin", "telephoner", "appeler un ami"],
  internet: ["reseau", "chercher une information", "message* dans le monde"],
};

/** Les suites : chaque énoncé qui contient `when` n'accepte que des tuiles prises dans une de ces listes, dans cet ordre. */
const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /ages/, chain: ["Pierre taillée", "Pierre polie", "Métaux"] },
  { when: /etapes|progres/, chain: ["Tailler des silex", "Maîtriser le feu", "Polir des haches", "Travailler le métal"] },
  { when: /modes de vie/, chain: ["Chasser et cueillir", "Cultiver et élever", "Travailler le métal"] },
  { when: /agriculteur/, chain: ["Préparer le champ", "Semer les graines", "Récolter le grain"] },
  { when: /gestes/, chain: ["Allumer le feu", "Poser la viande sur les braises", "Manger la viande cuite"] },
  { when: /gestes/, chain: ["Ramasser du bois", "Allumer le feu", "Cuire la viande", "Manger la viande"] },
  { when: /arrivees/, chain: ["Les caravanes du Sahara", "Les Almoravides", "Les Portugais"] },
  { when: /evenements/, chain: ["Les Arabes traversent le Sahara", "Les Portugais arrivent par la mer", "Les Européens installent des comptoirs"] },
  { when: /periodes/, chain: ["Les Almoravides", "Les Portugais", "La conquête coloniale"] },
  { when: /contacts/, chain: ["Le commerce par le Sahara", "Les Almoravides", "Les Portugais", "Les comptoirs de Saint-Louis"] },
  { when: /moments de l histoire|moments du plus/, chain: ["Les Almoravides", "Les Portugais", "La conquête coloniale", "L'indépendance"] },
  { when: /moments de l histoire/, chain: ["Bamba est exilé", "Aline est arrêtée", "Le Sénégal est indépendant"] },
  { when: /faits/, chain: ["Le commerce par le Sahara", "Les Portugais", "Les comptoirs de Saint-Louis"] },
  { when: /evenements/, chain: ["L'exil de Cheikh Ahmadou Bamba", "L'arrestation d'Aline Sitoé Diatta", "La fête de l'indépendance"] },
  { when: /personnes/, chain: ["Cheikh Ahmadou Bamba", "Aline Sitoé Diatta", "Léopold Sédar Senghor"] },
  { when: /faits/, chain: ["Départ de Bamba pour le Gabon", "Arrestation d'Aline Sitoé Diatta", "Premier président du Sénégal"] },
  { when: /faits/, chain: ["Cheikh Ahmadou Bamba part en exil", "Aline Sitoé Diatta est arrêtée", "Le Sénégal est indépendant"] },
  { when: /dates/, chain: ["Exil de Bamba", "Arrestation d'Aline", "Indépendance du pays"] },
  { when: /vegetations du nord au sud/, chain: ["Steppe", "Savane", "Forêt"] },
  { when: /climats du nord au sud/, chain: ["Sahélien", "Soudanien", "Guinéen"] },
  { when: /quantites de pluie de la plus faible a la plus forte/, chain: ["Peu de pluie", "Pluies moyennes", "Beaucoup de pluie"] },
  { when: /de la plus seche a la plus pluvieuse/, chain: ["Nord du pays", "Centre du pays", "Sud du pays"] },
  { when: /moins boisee a la plus boisee/, chain: ["Steppe", "Savane", "Forêt"] },
  { when: /divisions de la plus vaste a la plus petite/, chain: ["Région", "Département", "Arrondissement"] },
  { when: /divisions de la plus petite a la plus vaste/, chain: ["Arrondissement", "Département", "Région"] },
  { when: /chefs de celui qui dirige la plus vaste/, chain: ["Gouverneur", "Préfet", "Sous-préfet"] },
  { when: /chefs de celui qui dirige la plus petite/, chain: ["Sous-préfet", "Préfet", "Gouverneur"] },
  { when: /lieux du plus vaste au plus petit/, chain: ["Le Sénégal", "Une région", "Un département"] },
  { when: /culture du mil/, chain: ["Préparer le champ", "Semer le mil", "Récolter le mil", "Vendre le mil au marché"] },
  { when: /pecheur/, chain: ["Jeter le filet", "Remonter le filet", "Trier le poisson", "Vendre le poisson"] },
  { when: /de la mine/, chain: ["Creuser la mine", "Extraire les phosphates", "Charger les camions", "Embarquer au port"] },
  { when: /fabrication de l huile/, chain: ["Récolter l'arachide", "Presser les graines", "Remplir les bidons", "Vendre l'huile"] },
  { when: /eleveur/, chain: ["Traire les vaches", "Verser le lait dans un bidon", "Porter le lait au marché", "Vendre le lait"] },
  { when: /plus lent au plus rapide/, chain: ["À pied", "À vélo", "En voiture", "En avion"] },
  { when: /plus lent au plus rapide/, chain: ["Charrette", "Voiture", "Avion"] },
  { when: /plus lent au plus rapide/, chain: ["Pirogue à rames", "Bateau à moteur", "Avion"] },
  { when: /plus lent au plus rapide/, chain: ["Lettre", "Téléphone", "Internet"] },
  { when: /plus lent au plus rapide/, chain: ["Marcher", "Courir", "Rouler en voiture"] },
];

const PAIRS = new Set(
  [
    ["Feu", "Se chauffer et cuire"], ["Agriculture", "Produire sa nourriture"], ["Élevage", "Avoir du lait et de la viande"], ["Pierre taillée", "Silex cassé"],
    ["Pierre polie", "Hache lisse"], ["Métaux", "Outil en fer"], ["Chasseur", "Gibier"], ["Cueilleur", "Fruits sauvages"], ["Agriculteur", "Grains récoltés"],
    ["Éleveur", "Lait des troupeaux"], ["Chasser", "Poursuivre le gibier"], ["Cueillir", "Ramasser des fruits"], ["Semer", "Mettre des graines en terre"],
    ["Élever", "Garder un troupeau"], ["Silex taillé", "Couper la viande"], ["Hache lisse", "Défricher un champ"], ["Pointe de silex", "Chasser le gibier"],
    ["Gibier", "Chasse"], ["Fruits sauvages", "Cueillette"], ["Grains récoltés", "Agriculture"], ["Lait", "Élevage"],
    ["Damel", "Cayor"], ["Bourba", "Djolof"], ["Teigne", "Baol"], ["Brak", "Walo"], ["Bour", "Sine"], ["Roi", "Dirige le royaume"], ["Notables", "Conseillent le roi"],
    ["Armée", "Défend le royaume"], ["Agriculture", "Le mil"], ["Élevage", "Le lait et la viande"], ["Commerce", "Les échanges de marchandises"],
    ["Gorée", "Île en face de Dakar"], ["Saint-Louis", "Ville à l'embouchure du fleuve"], ["Comptoir", "Poste de commerce sur la côte"],
    ["Caravane", "Groupe de marchands en voyage"], ["Comptoir", "Poste de commerce européen"], ["Almoravides", "Peuple venu du Sahara"],
    ["Marchand arabe", "Chameau"], ["Marin portugais", "Caravelle"], ["Pêcheur du fleuve", "Pirogue"], ["Marchands arabes", "L'islam"],
    ["Caravane", "Marchandises du Sahara"], ["Comptoir", "Commerce sur la côte"], ["Almoravides", "XIe siècle"], ["Portugais", "XVe siècle"],
    ["Conquête coloniale", "XIXe siècle"], ["Marchand arabe", "Le désert"], ["Marin portugais", "L'océan"], ["Pêcheur du fleuve", "Le fleuve"],
    ["Lat Dior", "Cayor"], ["Alboury Ndiaye", "Djolof"], ["El Hadji Oumar Tall", "Fouta"], ["Lat Dior", "Damel du Cayor"], ["Alboury Ndiaye", "Bourba du Djolof"],
    ["El Hadji Oumar Tall", "Chef religieux toucouleur"], ["Lat Dior", "A défendu le Cayor"], ["El Hadji Oumar Tall", "A fondé un empire sur le fleuve"],
    ["Maba Diakhou Bâ", "A résisté dans le Rip"], ["Alboury Ndiaye", "A dirigé le Djolof"], ["Maba Diakhou Bâ", "Rip"], ["Lat Dior", "Damel"],
    ["Alboury Ndiaye", "Bourba"], ["El Hadji Oumar Tall", "Chef religieux"], ["Cayor", "Lat Dior"], ["Djolof", "Alboury Ndiaye"], ["Fouta", "El Hadji Oumar Tall"],
    ["Rip", "Maba Diakhou Bâ"],
    ["Cheikh Ahmadou Bamba", "Exil au Gabon"], ["Aline Sitoé Diatta", "Résistante de Casamance"], ["Léopold Sédar Senghor", "Premier président"],
    ["Cheikh Ahmadou Bamba", "Touba"], ["Aline Sitoé Diatta", "Casamance"], ["Léopold Sédar Senghor", "Sénégal"], ["Le 4 avril", "L'indépendance"],
    ["Le départ pour le Gabon", "L'exil de Bamba"], ["L'arrestation de 1943", "Aline Sitoé Diatta"], ["Cheikh Ahmadou Bamba", "Fonde le mouridisme"],
    ["Aline Sitoé Diatta", "Refuse les ordres de l'administration"], ["Léopold Sédar Senghor", "Dirige le pays libre"], ["1895", "Exil de Bamba"],
    ["1943", "Arrestation d'Aline"], ["1960", "Indépendance"], ["Touba", "Ville sainte du mouridisme"], ["Casamance", "Région d'Aline Sitoé Diatta"],
    ["Gabon", "Pays de l'exil de Bamba"],
    ["Mauritanie", "Au nord"], ["Mali", "À l'est"], ["Guinée-Bissau", "Au sud"], ["Gambie", "Enclavée dans le pays"], ["Guinée", "Au sud-est"],
    ["Dakar", "Capitale du Sénégal"], ["Cap-Vert", "Presqu'île de Dakar"], ["Atlantique", "Océan à l'ouest"], ["Mali", "Voisin de l'est"],
    ["Mauritanie", "Voisin du nord"], ["Gambie", "Pays enclavé"], ["Dakar", "Une ville"], ["Atlantique", "Un océan"], ["Mali", "Un pays"],
    ["Sahélien", "Steppe"], ["Soudanien", "Savane"], ["Guinéen", "Forêt"], ["Sahélien", "Au nord"], ["Soudanien", "Au centre"], ["Guinéen", "Au sud"],
    ["Steppe", "Au nord"], ["Savane", "Au centre"], ["Forêt", "Au sud"], ["Au nord", "Peu de pluie"], ["Au centre", "Pluies moyennes"],
    ["Au sud", "Beaucoup de pluie"], ["Steppe", "Herbes courtes"], ["Savane", "Hautes herbes et arbres espacés"], ["Forêt", "Grands arbres serrés"],
    ["Région", "Gouverneur"], ["Département", "Préfet"], ["Arrondissement", "Sous-préfet"], ["Commune", "Maire"], ["Gouverneur", "Région"],
    ["Préfet", "Département"], ["Maire", "Commune"], ["Sous-préfet", "Arrondissement"], ["Région", "La plus vaste division"], ["Commune", "Dirigée par un maire"],
    ["Pêche", "Le poisson"], ["Mines", "Les phosphates"], ["Pêche", "Une pirogue"], ["Agriculture", "Une daba"], ["Industrie", "Une usine"], ["Phosphates", "Taïba"],
    ["Or", "Sabodala"], ["Pêche", "Le littoral"], ["Agriculture", "Cultivateur"], ["Pêche", "Pêcheur"], ["Élevage", "Éleveur"], ["Artisanat", "Forgeron"],
    ["Industrie", "L'usine"], ["Commerce", "Le marché"], ["Mines", "Le sous-sol"], ["Élevage", "Le lait"],
    ["Bateau", "Port"], ["Avion", "Aéroport"], ["Train", "Gare"], ["Voiture", "Route"], ["Radio", "Fait entendre"], ["Télévision", "Fait voir"],
    ["Téléphone", "Fait parler"], ["Autoroute", "Route à péage"], ["TER", "Train express régional"], ["Port", "Lieu des navires"], ["Aéroport", "Des avions"],
    ["Port", "Des navires"], ["Gare", "Des trains"], ["Rails", "Train"], ["Mer", "Navire"], ["Piste d'envol", "Avion"], ["Autoroute", "Voiture"],
  ].map(([left, right]) => `${norm(left)}|${norm(right)}`),
);

const MEMBERS: Record<string, string[]> = {
  "Chasse et cueillette": ["Cueillir des fruits", "Poursuivre le gibier", "Ramasser des racines", "Pister un animal"],
  Agriculture: ["Semer des graines", "Arroser les champs", "Récolter le grain", "Désherber un champ", "Mil", "Arachide", "Riz", "Maïs"],
  "Pierre taillée": ["Silex cassé", "Éclat de silex", "Pierre cassée"],
  "Pierre polie": ["Hache lisse", "Hache frottée", "Pierre usée"],
  "Le pouvoir": ["Le roi", "Les notables", "L'armée"],
  "Les activités": ["L'agriculture", "L'élevage", "Le commerce"],
  "Venus par le désert": ["Chameau", "Caravane", "Almoravides", "Marchands arabes"],
  "Venus par la mer": ["Caravelle", "Portugais", "Navire", "Marins européens"],
  "Les Arabes": ["Almoravides", "Islam", "Caravane", "Chameau"],
  "Les Européens": ["Portugais", "Comptoir", "Gorée", "Saint-Louis"],
  "Un royaume": ["Cayor", "Djolof", "Fouta", "Walo"],
  "Une personne": ["Lat Dior", "Alboury Ndiaye", "El Hadji Oumar Tall", "Maba Diakhou Bâ", "Bamba", "Aline Sitoé Diatta", "Senghor"],
  "Avant l'indépendance": ["Exil de Bamba", "Arrestation d'Aline", "Résistance sans armes"],
  "Après l'indépendance": ["Fête du 4 avril", "Premier président", "Pays libre"],
  "Un lieu": ["Gabon", "Casamance", "Touba"],
  "Pays voisin": ["Mali", "Mauritanie", "Guinée", "Gambie"],
  "Pas un pays voisin": ["Maroc", "Côte d'Ivoire", "Algérie", "Niger"],
  "Un pays": ["Mali", "Mauritanie", "Guinée", "Gambie"],
  "Une ville": ["Dakar", "Thiès", "Kaolack", "Saint-Louis"],
  "Au nord": ["Climat sahélien", "Steppe", "Peu de pluie"],
  "Au sud": ["Climat guinéen", "Forêt", "Beaucoup de pluie"],
  "Au centre": ["Climat soudanien", "Savane", "Pluies moyennes"],
  "Les divisions": ["Région", "Département", "Arrondissement", "Commune"],
  "Les chefs": ["Gouverneur", "Préfet", "Sous-préfet", "Maire"],
  Pêche: ["Poisson", "Pirogue", "Filet", "Sardinelle"],
  Élevage: ["Bœufs", "Moutons", "Chèvres", "Troupeau"],
  Mines: ["Phosphates", "Or", "Taïba", "Sabodala"],
  Industrie: ["Usine d'huile", "Usine de ciment", "Usine de conserves", "Machine"],
  Artisanat: ["Poterie", "Bijoux", "Tissage", "Sculpture"],
  Transport: ["Autoroute", "Port", "Aéroport", "TER"],
  Communication: ["Radio", "Télévision", "Téléphone", "Internet"],
  "Sur la terre ferme": ["Autoroute", "TER", "Train", "Camion"],
  "Sur l'eau ou dans l'air": ["Avion", "Bateau", "Pirogue", "Hélicoptère"],
};
const MEMBER_SET = new Map(Object.entries(MEMBERS).map(([zone, items]) => [norm(zone), new Set(items.map(norm))]));

// ===========================================================================
// LES VÉRIFICATIONS, PAR FORME D'EXERCICE
// ===========================================================================

/** Des réponses qui sont toutes justes pour une même question : elles ne se proposent jamais ensemble. */
const TWINS: readonly (readonly string[])[] = [
  ["sine ngayene", "wanar"],
  ["sine", "saloum"],
  ["guinee", "guinee-bissau"],
  ["guinee-bissau", "gambie"],
  ["lat dior", "alboury ndiaye", "el hadji oumar tall", "maba diakhou ba", "ahmadou cheikhou", "fode kaba doumbouya"],
  ["lat", "alboury", "el hadji oumar", "maba", "ahmadou", "fode"],
];
/** Les questions qui demandent « un résistant » parmi des noms : aucun autre résistant ne s'y propose. */
const LIST_STEM = /parmi ces noms|un de ces noms|lequel de ces noms|quel nom est celui|ecris le nom d un resistant|on cite|le resistant cheikhou|le resistant kaba/;

/** Une question, une phrase à trou ou une réponse à écrire : la bonne réponse se lit dans l'énoncé, aucun mauvais choix n'est aussi juste. */
function checkAssociation(stem: string, right: string, wrongs: readonly string[]): string | null {
  for (const twins of TWINS) {
    if (twins.length > 2 && !LIST_STEM.test(fold(stem))) continue;
    if (twins.includes(norm(right)) && wrongs.some((wrong) => twins.includes(norm(wrong)))) return `une réponse aussi juste est proposée en mauvais choix : ${[right, ...wrongs].join(" / ")} (${stem})`;
  }
  const needs = ASSOC[norm(right)];
  if (needs === undefined) return `« ${right} » n'est pas dans la table`;
  if (!needs.some((fragment) => has(stem, fragment))) return `rien dans l'énoncé n'appelle « ${right} » : ${stem}`;
  for (const wrong of wrongs) {
    const own = ASSOC[norm(wrong)];
    if (own === undefined) return `le mauvais choix « ${wrong} » n'est pas dans la table`;
    for (const fragment of own) {
      if (!needs.includes(fragment) && has(stem, fragment)) return `le mauvais choix « ${wrong} » serait appelé par « ${fragment} » : ${stem}`;
    }
  }
  return null;
}

const checkQuestion: Check = (exo) => checkAssociation(exo.prompt, rightOption(exo), optionsOf(exo).filter((option) => option !== rightOption(exo)));
const checkGap: Check = (exo) => {
  const blank = blankOf(exo);
  return checkAssociation(`${exo.prompt} ${textOf(exo)}`, blank.answer, blank.options.filter((option) => option !== blank.answer));
};
const checkWrite: Check = (exo) => {
  const accepted = acceptedOf(exo);
  if (accepted[0] !== exo.answerKey) return `la première écriture admise n'est pas la réponse : ${exo.prompt}`;
  return checkAssociation(exo.prompt, accepted[0], []);
};

const checkOrder: Check = (exo) => {
  const sequence = sequenceOf(exo);
  const prompt = fold(exo.prompt);
  const chains = CHAINS.filter((entry) => entry.when.test(prompt));
  if (chains.length === 0) return `aucune suite ne correspond à l'énoncé : ${exo.prompt}`;
  const valid = chains.some(({ chain }) => {
    const ranks = sequence.map((tile) => chain.map(norm).indexOf(norm(tile)));
    return ranks.every((rank) => rank >= 0) && ranks.every((rank, i) => i === 0 || rank > ranks[i - 1]);
  });
  return valid ? null : `l'ordre est faux : ${exo.prompt} → ${sequence.join(" / ")}`;
};

const checkLink: Check = (exo) => {
  for (const pair of pairsOf(exo)) {
    if (!PAIRS.has(`${norm(pair.left)}|${norm(pair.right)}`)) return `paire inconnue : ${pair.left} ~ ${pair.right} (${exo.prompt})`;
  }
  return null;
};

const checkSort: Check = (exo) => {
  const [first, second] = zonesOf(exo);
  const a = MEMBER_SET.get(norm(first));
  const b = MEMBER_SET.get(norm(second));
  if (!a || !b) return `case inconnue : ${first} / ${second}`;
  for (const item of itemsOf(exo)) {
    const mine = norm(item.correctZone) === norm(first) ? a : b;
    const other = mine === a ? b : a;
    if (!mine.has(norm(item.text))) return `« ${item.text} » ne va pas dans « ${item.correctZone} »`;
    if (other.has(norm(item.text))) return `« ${item.text} » irait aussi dans l'autre case (${first} / ${second})`;
  }
  return null;
};

const CHECK_OF_TYPE: Record<string, Check> = { qcm: checkQuestion, "fill-blank": checkGap, "short-answer": checkWrite, order: checkOrder, match: checkLink, "drag-drop": checkSort };
const checkOf = (kind: string): Check => CHECK_OF_TYPE[GAME_KINDS[kind as GameKind].type];

describe("chaque gabarit de l'histoire et de la géographie du CM1 a sa vérification", () => {
  it("couvre exactement les cinquante-sept gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(57);
    expect(new Set(KINDS).size).toBe(57);
    for (const kind of KINDS) {
      expect(Object.keys(GAME_KINDS), kind).toContain(kind);
      expect(CHECK_OF_TYPE[GAME_KINDS[kind].type], kind).toBeDefined();
    }
    const registered = Object.keys(GAME_KINDS).filter((kind) => kind.startsWith("cm1-") && /^cm1-(pre|roy|con|res|pai|sit|cli|dec|eco|com)-/.test(kind));
    expect(registered.sort()).toEqual([...KINDS].sort());
  });

  it("n'a aucun fait sans deux mauvais choix", () => {
    expect(SHORT_OF_CHOICES).toEqual([]);
  });
});

describe("les gabarits de l'histoire et de la géographie du CM1 recalculent juste, depuis des tables écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la table, à chacun des cinq paliers`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(checkOf(kind)(exo), `${kind} palier ${d.palier} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
      }
    });
  }
});

describe("les tables elles-mêmes sont saines", () => {
  it("n'ont pas de fragment vide, ni deux fois le même", () => {
    for (const [answer, fragments] of Object.entries(ASSOC)) {
      for (const fragment of fragments) expect(fold(fragment.replace(/\*$/, "")).length, `${answer} : « ${fragment} »`).toBeGreaterThan(2);
      expect(new Set(fragments).size, answer).toBe(fragments.length);
    }
  });

  it("rangent chaque suite sans doublon, de trois tuiles au moins", () => {
    for (const { chain } of CHAINS) {
      expect(new Set(chain.map(norm)).size).toBe(chain.length);
      expect(chain.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("ne mettent aucune étiquette dans les deux cases d'un même glissé", () => {
    const pairs: [string, string][] = [
      ["Chasse et cueillette", "Agriculture"], ["Agriculture", "Pêche"], ["Pierre taillée", "Pierre polie"], ["Le pouvoir", "Les activités"], ["Venus par le désert", "Venus par la mer"],
      ["Les Arabes", "Les Européens"], ["Un royaume", "Une personne"], ["Avant l'indépendance", "Après l'indépendance"], ["Une personne", "Un lieu"], ["Pays voisin", "Pas un pays voisin"],
      ["Un pays", "Une ville"], ["Au nord", "Au sud"], ["Au centre", "Au nord"], ["Au centre", "Au sud"], ["Les divisions", "Les chefs"], ["Élevage", "Mines"],
      ["Industrie", "Artisanat"], ["Transport", "Communication"], ["Sur la terre ferme", "Sur l'eau ou dans l'air"],
    ];
    for (const [a, b] of pairs) {
      const first = MEMBER_SET.get(norm(a))!;
      const second = MEMBER_SET.get(norm(b))!;
      for (const item of first) expect(second.has(item), `${a} / ${b} : ${item}`).toBe(false);
    }
  });
});

// ===========================================================================
// LE CONSTRUCTEUR DE FAITS ET LES FENÊTRES
// ===========================================================================

describe("le constructeur de faits (cm1Faits.ts)", () => {
  const pool: Pool = {
    items: [
      { id: "a", q: ["Qui est A ?", "Qui est donc A ?"], a: "Alpha", not: ["Beta"], s: ["___ est A."], hint: "Un indice sur le premier.", also: ["alpha lettre"] },
      { id: "b", q: ["Qui est B ?"], a: "Beta", not: ["Alpha"], s: ["___ est B."], hint: "Un indice sur le second." },
      { id: "c", q: ["Qui est C ?"], a: "Gamma", s: ["___ est C."], hint: "Un indice sur le troisième." },
      { id: "d", q: ["Qui est D ?"], a: "Delta", s: ["___ est D."], hint: "Un indice sur le quatrième avec Epsilon." },
    ],
    extras: ["Epsilon", "Zeta"],
  };

  it("ne propose jamais en mauvais choix la réponse d'un fait que `not` écarte, ni la bonne réponse, ni un mot de l'indice", () => {
    for (const row of questionRows("t", [pool])) {
      expect(row.wrong, row.prompt).toHaveLength(2);
      expect(new Set(row.wrong).size, row.prompt).toBe(2);
      expect(row.wrong, row.prompt).not.toContain(row.answer);
      if (row.answer === "Alpha") expect(row.wrong).not.toContain("Beta");
      if (row.answer === "Beta") expect(row.wrong).not.toContain("Alpha");
      if (row.answer === "Delta") expect(row.wrong).not.toContain("Epsilon");
    }
    for (const row of gapRows("t", [pool])) {
      expect(row.wrong, row.text).toHaveLength(2);
      if (row.answer === "Alpha") expect(row.wrong).not.toContain("Beta");
    }
  });

  it("ne prend les mauvais choix que dans les intrus quand le lot le demande", () => {
    const only: Pool = { ...pool, items: pool.items.map((item) => (item.id === "d" ? { ...item, hint: "Un indice sur le quatrième." } : item)), onlyExtras: true };
    for (const row of questionRows("t", [only])) for (const wrong of row.wrong) expect(["Epsilon", "Zeta"], row.prompt).toContain(wrong);
    expect(SHORT_OF_CHOICES).toEqual([]);
  });

  it("pose toutes les façons de demander, la première de chaque fait d'abord, et partage la clé du fait entre les jeux", () => {
    const rows = questionRows("t", [pool]);
    expect(rows.map((row) => row.prompt)).toEqual(["Qui est A ?", "Qui est B ?", "Qui est C ?", "Qui est D ?", "Qui est donc A ?"]);
    expect(new Set(rows.map((row) => row.fact)).size).toBe(4);
    expect(gapRows("t", [pool]).map((row) => row.fact)).toEqual(questionRows("t", [pool]).map((row) => row.fact).slice(0, 4));
    expect(writeRows("t", [pool]).map((row) => row.accepted[0])).toEqual(["Alpha", "Beta", "Gamma", "Delta", "Alpha"]);
  });

  it("admet à l'écrit la réponse sans accent et les autres écritures du fait", () => {
    const rows = writeRows("t", [{ items: [{ id: "x", q: ["Quelle ville ?"], a: "Thiès", also: ["Tivaouane"], hint: "Un indice." }], extras: ["Dakar", "Louga"] }]);
    expect(rows[0].accepted).toEqual(expect.arrayContaining(["Thiès", "Thies", "Tivaouane"]));
    expect(rows[0].accepted[0]).toBe("Thiès");
  });
});

describe("les fenêtres de lignes de chaque palier (ce2Outils.windowAt)", () => {
  it("servent chaque ligne à un palier au moins, sans en oublier, pour deux à six paliers", () => {
    for (let slots = 2; slots <= 6; slots++) {
      for (let total = 1; total <= 40; total++) {
        const items = Array.from({ length: total }, (_, i) => i);
        for (const uses of [1, 2, 3]) {
          const served = new Set<number>();
          for (let slot = 0; slot < slots; slot++) {
            const window = windowAt(items, slot, slots, uses);
            expect(window.length, `${total} lignes, ${slots} paliers, ${uses} fois`).toBeGreaterThanOrEqual(Math.min(uses, total));
            window.forEach((item) => served.add(item));
          }
          expect(served.size, `${total} lignes, ${slots} paliers, ${uses} fois`).toBe(total);
        }
      }
    }
  });

  it("ne partagent aucune ligne entre deux paliers quand la liste est assez longue", () => {
    for (const slots of [4, 5]) {
      const items = Array.from({ length: slots * 4 }, (_, i) => i);
      const seen = new Set<number>();
      for (let slot = 0; slot < slots; slot++) {
        for (const item of windowAt(items, slot, slots, 2)) {
          expect(seen.has(item), `${slots} paliers, ligne ${item}`).toBe(false);
          seen.add(item);
        }
      }
    }
  });
});

// ===========================================================================
// LES MUTATIONS
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      payload.acceptedAnswers = ["zzz"];
      return { ...copy(), answerKey: "zzz" };
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : la réponse abîmée est refusée à tous les tirages`, () => {
      for (const d of draws.filter((_, i) => i % 5 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        expect(broken, kind).not.toBeNull();
        expect(checkOf(kind)(broken as Exo), `${kind} : ${exo.prompt}`, ).not.toBeNull();
      }
    });
  }

  it("voient aussi un énoncé abîmé : une question qui parle d'un autre fait", () => {
    const exo = make("cm1-res-qcm", draws[0]) as unknown as Exo;
    const lat = { ...exo, prompt: "Quel titre portait Alboury Ndiaye, roi du Djolof ?", payload: { ...exo.payload, options: ["Damel", "Bourba", "Almamy"], correctIndex: 0 } };
    expect(checkQuestion(lat as Exo)).not.toBeNull();
    const ok = { ...lat, payload: { ...lat.payload, correctIndex: 1 } };
    expect(checkQuestion(ok as Exo)).toBeNull();
    const twoRight = { ...lat, payload: { ...lat.payload, options: ["Bourba", "Damel", "Almamy"], correctIndex: 0 }, prompt: "Quel titre portait Lat Dior, roi du Cayor, ou Alboury Ndiaye, roi du Djolof ?" };
    expect(checkQuestion(twoRight as Exo)).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'histoire et de la géographie du CM1", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 4 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      const stem = `${exo.prompt} ${exo.payload.text ?? ""}`;
      expect(stem, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(apostrophes(String(exo.payload.text ?? "")), `${kind} : ${stem}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      expect(wordCount(String(exo.payload.text ?? "")), `${kind} : ${stem}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent aucun émoji, ni sur une tuile, ni dans un indice, ni dans un énoncé", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      expect(exo.prompt.includes(VS16), kind).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes(VS16), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("écrivent les choix d'une phrase à trou comme la phrase les veut : aucun ne commence par un article en capitale", () => {
    for (const { kind, exo } of exos) {
      if (!exo.payload.blanks) continue;
      for (const option of blankOf(exo).options) expect(option, `${kind} : ${textOf(exo)}`).not.toMatch(/^(Le|La|Les|Un|Une|Des|Du)\s|^L'/);
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(pairs.length, kind).toBeGreaterThanOrEqual(3);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(...optionsOf(exo));
      if (exo.payload.blanks) answers.push(...blankOf(exo).options);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext(KLASS, 2, "graine", new Set(), undefined, undefined, { index: 3, count: COUNT }));
      const b = GAME_KINDS[kind].make(makeContext(KLASS, 2, "graine", new Set(), undefined, undefined, { index: 3, count: COUNT }));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CM1 sans aucun défaut, à tous les paliers", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: KLASS,
        subject: subjectOfKind(kind),
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
    }
  });

  it("écrivent la bonne réponse d'un QCM ou d'un trou parmi les choix, et aucune réponse à écrire n'est vide", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) expect(optionsOf(exo), kind).toContain(exo.answerKey);
      if (exo.payload.blanks) expect(blankOf(exo).options, kind).toContain(blankOf(exo).answer);
      if (exo.payload.acceptedAnswers) {
        expect(acceptedOf(exo).length, kind).toBeGreaterThan(0);
        for (const answer of acceptedOf(exo)) expect(answer.trim(), kind).not.toBe("");
      }
    }
  });

  it("changent de lignes d'un palier à l'autre : la fenêtre suit la place du palier, pas le niveau (les paliers 2 et 3 sont tous deux de niveau 2)", () => {
    for (const kind of KINDS.filter((k) => /-(qcm|trou|ecrire)$/.test(k))) {
      const seen = (palier: number) =>
        new Set(
          Array.from({ length: 30 }, (_, n) => {
            const exo = GAME_KINDS[kind].make(makeContext(KLASS, gameLevel(palier, COUNT), `${kind}:fenetre:${palier}:${n}`, new Set(), undefined, undefined, { index: palier, count: COUNT })) as unknown as Exo;
            return `${exo.prompt}|${exo.payload.text ?? ""}|${exo.answerKey}`;
          }),
        );
      const two = seen(2);
      const three = seen(3);
      const common = [...two].filter((question) => three.has(question));
      expect(common.length, `${kind} : ${common.length} questions communes aux paliers 2 et 3`).toBeLessThan(Math.max(2, Math.ceil(two.size / 2)));
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les dix thématiques d'histoire et de géographie du CM1", () => {
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CM1, et n'ont changé ni leur clé ni leur nombre de paliers (cinq)", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CM1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(10);
    expect(TOPIC_KEYS.slice().sort()).toEqual(
      ["ge-cm1-climats", "ge-cm1-communication", "ge-cm1-decoupage", "ge-cm1-economie", "ge-cm1-situation", "hi-cm1-contacts", "hi-cm1-paix", "hi-cm1-prehistoire", "hi-cm1-resistants", "hi-cm1-royaumes"],
    );
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 25; n++) {
        for (const palierIndex of PALIERS) {
          const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: KLASS,
              subject: entryOf(key).subject.name,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(checkOf(kind)(game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of PALIERS) {
        const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("ne reposent pas deux fois le même fait dans un palier, ni la même question d'un palier à l'autre plus de trois fois sur cent", () => {
    for (const key of TOPIC_KEYS) {
      let seen = 0;
      let repeated = 0;
      for (let n = 0; n < 40; n++) {
        const before = new Set<string>();
        for (const palierIndex of PALIERS) {
          const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `variete:${key}:${n}:${palierIndex}` });
          const keys = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          for (const question of keys) {
            seen += 1;
            if (before.has(question)) repeated += 1;
          }
          keys.forEach((question) => before.add(question));
        }
      }
      expect((100 * repeated) / seen, `${key} : ${repeated} questions revues sur ${seen}`).toBeLessThan(3);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
      expect(typesOf(key).has("order" as never) || typesOf(key).has("match" as never), `${key} : ordre ou appariement`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, KLASS, `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
        expect(checkOf(spec.kind)(again as unknown as Exo), spec.kind).toBeNull();
      }
    }
  });
});
