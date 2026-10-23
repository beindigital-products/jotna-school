import { describe, expect, it } from "vitest";
import { SHORT_OF_CHOICES, gapRows, questionRows, writeRows, type Pool } from "../paliers/games/cm1Faits";
import { windowAt } from "../paliers/games/ce2Outils";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";

/**
 * L'HISTOIRE ET LA GÉOGRAPHIE DU CM1 : dix thématiques, cinquante-sept gabarits (`cm1Histoire.ts`, `cm1Geographie.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts`. Ce fichier ne lit AUCUN tableau des sources : ses tables, écrites à part, disent
 * pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`), dans quel ordre vont les suites (`CHAINS`), quelles paires sont
 * justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`). Il garde aussi les tests du constructeur de faits et des fenêtres de lignes,
 * qui ne se jouent qu'une fois pour tous les lots du CM1 et du CM2.
 */

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
  agriculture: ["seme*", "cultivent la terre", "cultiver le mil", "cultive l arachide", "champs de mil", "culture du mil", "fait pousser", "cultiver la terre pour produire"],
  elevage: ["troupeau*", "lait toute l annee", "vaches", "boeufs", "chevres", "moutons", "viande et le lait", "pour avoir du lait"],
  "chasse et cueillette": ["avant de cultiver", "sans cultiver ni elever", "poursuivaient le gibier", "procuraient", "poursuivre le gibier"],
  "chasse et la cueillette": ["avant de cultiver", "sans cultiver ni elever", "poursuivaient le gibier", "procuraient", "poursuivre le gibier"],
  chasse: ["avant de cultiver", "sans cultiver ni elever", "poursuivaient le gibier", "procuraient", "et la cueillette"],
  "sine ngayene": ["cercles de pierres"],
  wanar: ["avec sine ngayene", "voisin de sine ngayene", "cote de sine ngayene"],
  "delta du saloum": ["coquillage*"],
  saloum: ["coquillage*"],
  commerce: ["echanger et vendre", "vendre et acheter", "achete et vend", "acheter et vendre", "de pays en pays", "sel et les etoffes", "circuler les marchandises"],
  // Les royaumes
  roi: ["prenait les grandes decisions", "dirigeait un royaume", "rendait la justice", "chef qui commandait", "chef d un royaume", "justice est rendue"],
  notables: ["conseillait le roi", "aidait le roi", "conseille par", "roi ecoutait"],
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
  caravane: ["groupe de marchands", "voyage des marchands", "voyageaient souvent en", "voyageaient en avec leurs chameaux"],
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


const PAIRS: [string, string][] = 
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
  ] as [string, string][];


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

const { checkOf } = defineTemplateTests({
  label: "de l'histoire et de la géographie du CM1",
  klass: "CM1",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 57,
  topicCount: 10,
  kindPattern: /^cm1-(pre|roy|con|res|pai|sit|cli|dec|eco|com)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
  ["Chasse et cueillette", "Agriculture"], ["Agriculture", "Pêche"], ["Pierre taillée", "Pierre polie"], ["Le pouvoir", "Les activités"], ["Venus par le désert", "Venus par la mer"],
  ["Les Arabes", "Les Européens"], ["Un royaume", "Une personne"], ["Avant l'indépendance", "Après l'indépendance"], ["Une personne", "Un lieu"], ["Pays voisin", "Pas un pays voisin"],
  ["Un pays", "Une ville"], ["Au nord", "Au sud"], ["Au centre", "Au nord"], ["Au centre", "Au sud"], ["Les divisions", "Les chefs"], ["Élevage", "Mines"],
  ["Industrie", "Artisanat"], ["Transport", "Communication"], ["Sur la terre ferme", "Sur l'eau ou dans l'air"],
],
});

describe("les vérifications voient un énoncé abîmé", () => {
  const base = { type: "qcm", answerKey: "Bourba", hints: [], payload: { options: ["Damel", "Bourba", "Almamy"], correctIndex: 0 }, prompt: "" };
  const check = checkOf("cm1-res-qcm");

  it("refusent un titre donné à un autre roi, et deux réponses aussi justes", () => {
    const wrong = { ...base, prompt: "Quel titre portait Alboury Ndiaye, roi du Djolof ?" };
    expect(check(wrong)).not.toBeNull();
    const right = { ...wrong, payload: { ...wrong.payload, correctIndex: 1 } };
    expect(check(right)).toBeNull();
    const twoRight = { ...wrong, prompt: "Quel titre portait Lat Dior, roi du Cayor, ou Alboury Ndiaye, roi du Djolof ?", payload: { options: ["Bourba", "Damel", "Almamy"], correctIndex: 0 } };
    expect(check(twoRight)).not.toBeNull();
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

