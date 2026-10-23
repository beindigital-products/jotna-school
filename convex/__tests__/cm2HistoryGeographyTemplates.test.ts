import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";

/**
 * L'HISTOIRE ET LA GÉOGRAPHIE DU CM2 : neuf thématiques, cinquante-quatre gabarits (`cm2Histoire.ts`, `cm2Geographie.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts` (le même que pour le CM1). Ce fichier ne lit AUCUN tableau des
 * sources : ses tables, écrites à part, disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`), dans quel ordre
 * vont les suites (`CHAINS`), quelles paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`).
 *
 * Les fragments de `ASSOC` sont des suites de mots entiers, lues sans accent ni majuscule ; un `*` en fin de fragment laisse le dernier
 * mot finir comme il veut. Une réponse sans fragment (`[]`) n'est JAMAIS une bonne réponse : le moteur la refuse dès qu'un exercice la
 * donne pour juste. Une bonne réponse a au moins un de ses fragments dans l'énoncé ; un mauvais choix n'en a aucun qui ne soit aussi un
 * fragment de la bonne réponse.
 */

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "hi-cm2-empires": ["cm2-emp-qcm", "cm2-emp-trou", "cm2-emp-ecrire", "cm2-emp-ordre", "cm2-emp-relier", "cm2-emp-glisser"],
  "hi-cm2-traite": ["cm2-tra-qcm", "cm2-tra-trou", "cm2-tra-ecrire", "cm2-tra-ordre", "cm2-tra-relier", "cm2-tra-glisser"],
  "hi-cm2-colonisation": ["cm2-col-qcm", "cm2-col-trou", "cm2-col-ecrire", "cm2-col-ordre", "cm2-col-relier", "cm2-col-glisser"],
  "hi-cm2-independance": ["cm2-ind-qcm", "cm2-ind-trou", "cm2-ind-ecrire", "cm2-ind-ordre", "cm2-ind-relier", "cm2-ind-glisser"],
  "hi-cm2-progres": ["cm2-pro-qcm", "cm2-pro-trou", "cm2-pro-ecrire", "cm2-pro-ordre", "cm2-pro-relier", "cm2-pro-glisser"],
  "ge-cm2-milieu-activites": ["cm2-mil-qcm", "cm2-mil-trou", "cm2-mil-ecrire", "cm2-mil-ordre", "cm2-mil-relier", "cm2-mil-glisser"],
  "ge-cm2-degradation": ["cm2-deg-qcm", "cm2-deg-trou", "cm2-deg-ecrire", "cm2-deg-ordre", "cm2-deg-relier", "cm2-deg-glisser"],
  "ge-cm2-population": ["cm2-pop-qcm", "cm2-pop-trou", "cm2-pop-ecrire", "cm2-pop-ordre", "cm2-pop-relier", "cm2-pop-glisser"],
  "ge-cm2-villes": ["cm2-vil-qcm", "cm2-vil-trou", "cm2-vil-ecrire", "cm2-vil-ordre", "cm2-vil-relier", "cm2-vil-glisser"],
};

/** Ce que dit toute langue nationale du Sénégal, dans un énoncé qui demande « laquelle de ces langues ». */
const NATIONALE = ["langue nationale", "langues nationales", "laquelle est nationale"];

const ASSOC: Record<string, string[]> = {
  // ---------------------------------------------------------------------------------------------------------------- LES GRANDS EMPIRES
  ghana: ["Koumbi Saleh"],
  "empire du ghana": ["Koumbi Saleh"],
  mali: ["Soundiata", "Mansa Moussa", "Kouroukan Fouga"],
  "empire du mali": ["Soundiata", "Mansa Moussa", "Kouroukan Fouga"],
  songhai: ["Gao", "Sonni Ali Ber", "Askia Mohammed"],
  "empire songhai": ["Gao", "Sonni Ali Ber", "Askia Mohammed"],
  "soundiata keita": ["a fondé l'empire du Mali", "fondateur de l'empire du Mali", "a créé l'empire du Mali"],
  "mansa moussa": ["pèlerinage", "La Mecque"],
  "sonni ali ber": ["avant Askia", "précédé Askia"],
  "askia mohammed": ["après Sonni Ali Ber", "pris le pouvoir", "nouvelle dynastie", "à la suite de Sonni Ali Ber"],
  "koumbi saleh": ["capitale de l'empire du Ghana", "rois du Ghana"],
  gao: ["capitale de l'empire songhaï", "souverains songhaï"],
  tombouctou: [],
  "kouroukan fouga": ["charte du Mali", "charte de l'empire du Mali", "charte contenait", "une charte appelée"],
  "magna carta": [],
  "code civil": [],
  "1324": ["Mansa Moussa"],
  "1224": [],
  "1424": [],
  "1524": [],
  or: ["métal précieux", "riche grâce à son", "célèbre pour son"],
  argent: [],
  platine: [],
  griot: ["conteur", "garde la mémoire d'un peuple"],
  forgeron: [],
  marchand: [],
  // ---------------------------------------------------------------------------------------------------------------- TRAITE NÉGRIÈRE
  boussole: ["trouver le nord", "aiguille aimantée", "s'orienter en pleine mer"],
  caravelle: ["navire léger à voiles", "bateau rapide", "navire à voiles des grands voyages", "navigateurs portugais", "Portugais utilisaient"],
  imprimerie: ["beaucoup de livres identiques", "copier très vite des livres", "circuler les livres", "livres ont circulé"],
  "commerce triangulaire": ["en triangle"],
  "traite negriere": ["Africains comme esclaves", "enlever des Africains"],
  esclavage: ["appartient à un maître", "appartenir à un maître", "sous les ordres d'un maître"],
  abolition: ["supprimer l'esclavage", "fin de l'esclavage décidée", "fin à l'esclavage", "supprime le travail forcé"],
  goree: ["Maison des Esclaves", "en face de Dakar", "tout près de Dakar"],
  carabane: [],
  "joal-fadiouth": [],
  "maison des esclaves": ["bâtiment de Gorée", "maison de Gorée", "lieu de Gorée", "île de Gorée", "à Gorée"],
  "grande mosquee": [],
  "palais de justice": [],
  afrique: ["de quel continent les captifs", "achetaient-ils des captifs", "chargeaient des captifs", "étaient embarqués"],
  amerique: ["emmenaient-ils les captifs", "travailler dans les plantations", "emmenés travailler", "traversée de l'océan"],
  europe: ["rapportaient-ils le sucre", "recevait le sucre", "rentraient chargés", "café des plantations"],
  asie: [],
  oceanie: [],
  "1848": ["pris fin dans les colonies françaises", "fin de l'esclavage", "esclavage a été aboli"],
  "1748": [],
  "1948": [],
  "xve siecle": ["caravelles portugaises", "Portugais explorent", "Portugais explorent-ils", "caravelles explorent"],
  "xie siecle": [],
  "xixe siecle": [],
  // ---------------------------------------------------------------------------------------------------------------- CONQUÊTE COLONIALE
  "louis faidherbe": ["gouverneur français du Sénégal", "gouverneur est resté célèbre", "a combattu El Hadji Oumar Tall", "était gouverneur du Sénégal", "a dirigé la conquête"],
  "blaise diagne": ["premier député africain"],
  "lat dior": ["damel du Cayor"],
  "leopold sedar senghor": ["premier président", "poète est devenu", "pays est devenu indépendant", "poète"],
  gouverneur: ["fonction Faidherbe occupait-il", "titre portait Faidherbe", "chef que la France envoyait", "avec le titre de", "chef envoyé par la France"],
  roi: [],
  president: [],
  aof: ["groupe de colonies françaises de l'Ouest africain", "colonies françaises de l'Ouest africain", "nom court désigne", "Dakar est devenue la capitale de"],
  aef: [],
  oua: [],
  uemoa: [],
  "afrique-occidentale francaise": ["sigle AOF", "nom entier de l'AOF", "lettres AOF"],
  "afrique-equatoriale francaise": [],
  "armee occidentale francaise": [],
  "saint-louis": ["première capitale", "Avant Dakar", "capitale de l'AOF avant 1902"],
  dakar: ["en 1902", "depuis 1902", "Après Saint-Louis", "presqu'île du Cap-Vert", "plus forte densité", "vivent le plus d'habitants", "densément peuplée", "densité de population est la plus forte", "énormément d'habitants"],
  thies: [],
  "1895": ["l'AOF a-t-elle été créée", "création de l'AOF", "l'AOF a été créée", "a créé l'AOF"],
  "1902": ["Dakar est-elle devenue la capitale", "Dakar remplacer Saint-Louis", "Dakar est devenue la capitale de l'AOF", "Dakar a remplacé Saint-Louis"],
  "1885": [],
  "1912": [],
  colonie: ["pays dirigé par un autre pays lointain", "territoire pris et gouverné", "territoire gouverné par un pays lointain", "dirigé par la France", "gouverné par la France"],
  conquete: ["prendre un pays par la force", "prise d'un territoire par les armes", "Prendre un territoire avec une armée"],
  resistance: ["s'opposer à ceux qui occupent son pays", "lutte des habitants contre la conquête", "Refuser l'occupation de son pays"],
  "resistance armee": ["pris les armes contre la conquête", "combattu avec des armes", "Combattre avec des armes", "Lat Dior et Alboury Ndiaye"],
  "resistance pacifique": ["sans prendre les armes", "résisté sans se battre", "Cheikh Ahmadou Bamba a choisi", "sans combattre"],
  soumission: [],
  // ---------------------------------------------------------------------------------------------------------------- MARCHE VERS L'INDÉPENDANCE
  "lamine gueye": ["loi de 1946"],
  "abdou diouf": [],
  "1914": ["Blaise Diagne"],
  "1959": ["Fédération du Mali a-t-elle été créée", "naître la Fédération du Mali", "Fédération du Mali est née", "Fédération du Mali a été créée", "ont formé la Fédération du Mali"],
  "1960": [
    "Fédération du Mali a-t-elle pris fin",
    "fin de la Fédération du Mali",
    "Fédération du Mali a pris fin",
    "Fédération du Mali s'est séparée",
    "est-il devenu indépendant",
    "année est celle de l'indépendance",
    "retrouvé sa liberté",
    "Sénégal est devenu indépendant",
    "Sénégal a pris son indépendance",
  ],
  "1946": [],
  "1958": [],
  "4 avril": ["fête-t-il son indépendance", "fête de l'indépendance", "fête son indépendance", "fête nationale de l'indépendance"],
  "1er mai": [],
  "14 juillet": [],
  "20 aout": [],
  "federation du mali": ["union du Sénégal et du Soudan français", "fédération le Sénégal a-t-il formée", "Soudan français ont formé", "Soudan français se sont unis"],
  "union africaine": [],
  "soudan francais": ["Fédération du Mali avec le Sénégal", "avec quel territoire le Sénégal", "Sénégal a formé la Fédération du Mali avec le", "a uni le Sénégal"],
  gambie: [],
  guinee: [],
  // ---------------------------------------------------------------------------------------------------------------- PROGRÈS DES SCIENCES ET DES TECHNIQUES
  "machine a vapeur": ["eau chauffée", "vapeur d'eau", "chaleur de l'eau bouillante", "peut avancer avec", "premiers trains"],
  electricite: ["ampoule", "éclairer les maisons", "éclairer les rues", "allumer une lampe"],
  telephone: ["parler avec une personne qui est très loin", "entendre un ami qui habite", "transmet la voix à distance", "parler à un ami qui habite loin", "deux personnes éloignées"],
  automobile: ["roule sur la route avec un moteur", "véhicule à moteur", "remplacé peu à peu la charrette", "rouler vite sur la route", "véhicule à moteur à quatre roues"],
  avion: ["voyager dans le ciel", "engin à moteur et à ailes", "rapproché les pays", "traverser l'océan", "engin à ailes"],
  radio: ["sans images", "sans pouvoir répondre", "écouter les mêmes nouvelles", "sans voir d'images", "venues de loin"],
  vaccins: ["protège les enfants contre", "reçoit-on en piqûre", "sauvé des millions de vies", "certaines maladies graves", "épidémies"],
  ordinateur: ["calculer, d'écrire", "écran et à clavier", "calculs très rapides", "écrire un texte et faire des calculs", "machine qui calcule vite"],
  "machine a coudre": [],
  bicyclette: [],
  "parler a distance": ["téléphone"],
  "voyager dans le ciel": ["avion"],
  "se proteger d une maladie": ["vaccins", "vaccin"],
  "ecouter des nouvelles": ["radio"],
  "rouler sur la route": ["automobile"],
  "faire avancer les trains": ["machine à vapeur"],
  "xixe et xxe siecles": ["naître le téléphone", "grands progrès", "sont des progrès des"],
  "xie et xiie siecles": [],
  "xve et xvie siecles": [],
  // ---------------------------------------------------------------------------------------------------------------- LE MILIEU ET LES ACTIVITÉS
  "vallee du fleuve": ["frontière avec la Mauritanie", "près de la Mauritanie", "culture du riz", "rizières", "riz est cultivé surtout"],
  "bassin arachidier": ["Kaolack, Kaffrine, Diourbel et Fatick"],
  cote: ["océan Atlantique", "en pirogue", "des pêcheurs et des ports", "vit surtout de la pêche"],
  ferlo: ["plaines sèches", "troupeaux de zébus et de moutons", "grande région d'élevage", "troupeaux vivent surtout"],
  casamance: ["très arrosée", "mangues et d'autres fruits", "forêts et en vergers", "riche en fruits", "mangues et les fruits"],
  riziculture: ["vallée du fleuve Sénégal"],
  "culture de l arachide": ["bassin arachidier", "Kaolack, Kaffrine, Diourbel et Fatick"],
  peche: ["la côte", "sur la côte", "les ports et les pirogues"],
  elevage: ["Ferlo"],
  "culture des fruits": ["Casamance"],
  kaolack: ["bassin arachidier"],
  kaffrine: ["bassin arachidier"],
  diourbel: ["bassin arachidier"],
  fatick: ["bassin arachidier"],
  ziguinchor: [],
  matam: [],
  kedougou: [],
  senegal: ["frontière avec la Mauritanie", "frontière nord avec la Mauritanie", "borde la Mauritanie", "sépare notre pays de la Mauritanie", "arrose les rizières du nord"],
  saloum: [],
  "saison des pluies": ["sèment-ils le riz et l'arachide", "sèment le riz et l'arachide", "champs de mil et d'arachide", "eau nécessaire", "champs poussent bien"],
  "saison seche": ["mares du Ferlo", "chercher de l'eau pour leurs troupeaux", "dure le plus longtemps", "mares se vident", "cherchent de l'eau"],
  hiver: [],
  printemps: [],
  // ---------------------------------------------------------------------------------------------------------------- PROTÉGER NOS RESSOURCES
  deforestation: ["coupe de trop d'arbres", "couper beaucoup d'arbres", "disparition des forêts", "couper trop d'arbres sans replanter", "forêts coupées"],
  "feux de brousse": ["incendies", "feu qui ravage"],
  surpeche: ["plus de poissons que la mer", "prendre trop de poissons", "vide la mer de ses poissons", "pêcher trop de poissons"],
  "erosion cotiere": ["recul de la plage", "grignotage des plages", "détruit les plages", "vagues qui grignotent"],
  "avancee du desert": ["sable du Sahara", "sable gagne peu à peu", "sable qui envahit"],
  reboisement: ["planter de nouveaux arbres", "replante des arbres", "plantation de jeunes arbres", "refaire une forêt", "Planter de jeunes arbres"],
  "grande muraille verte": ["bande d'arbres", "arrêter le sable du Sahara", "freiner l'avancée du sable"],
  "aires marines protegees": ["zones de mer où la pêche est limitée", "interdisant la pêche", "zone de mer protégée", "la pêche est limitée"],
  "construction de routes": [],
  "ouverture de mines": [],
  "disparition de la foret": ["coupe de trop d'arbres sans replantation", "couper trop d'arbres sans replanter", "coupe excessive du bois"],
  "destruction de l herbe et des arbres": ["feux de brousse", "incendies de la brousse"],
  "diminution des poissons": ["surpêche", "pêcher plus que la mer", "Pêcher trop"],
  "recul de la plage": ["érosion côtière", "vagues qui rongent"],
  "perte de terres cultivables": ["avancée du désert", "sable qui gagne les champs"],
  sahel: ["Grande Muraille verte"],
  sahara: [],
  kalahari: [],
  // ---------------------------------------------------------------------------------------------------------------- LA POPULATION DU SÉNÉGAL
  "18 millions": ["combien d'habitants", "combien de personnes vivent", "combien de Sénégalais", "Sénégal compte environ", "a compté environ"],
  "8 millions": [],
  "80 millions": [],
  "2023": ["dernier recensement", "recensement qui a compté", "a compté environ 18 millions"],
  "2013": [],
  "2003": [],
  recensement: ["compte tous les habitants d'un pays", "comptage de toute la population", "comptage de tous les habitants"],
  "pyramide des ages": ["graphique"],
  densite: ["nombre d'habitants par kilomètre carré", "personnes qui vivent sur chaque kilomètre carré", "personnes sur chaque kilomètre carré"],
  "beaucoup de jeunes": ["pyramide des âges large", "base d'une pyramide des âges est large", "pyramide des âges très large", "base de la pyramide est large"],
  "beaucoup de personnes agees": [],
  "tres peu d enfants": [],
  "population jeune": ["beaucoup d'enfants et de jeunes", "enfants et les jeunes sont nombreux"],
  jeune: ["beaucoup d'enfants et de jeunes", "enfants et les jeunes sont nombreux"],
  "population agee": [],
  agee: [],
  "population vieillissante": [],
  vieillissante: [],
  tambacounda: [],
  inegale: ["répartie", "répartition", "répartis de façon"],
  egale: [],
  reguliere: [],
  wolof: [...NATIONALE, "majorité des Sénégalais", "la plus parlée", "langue commune", "comprennent"],
  pulaar: NATIONALE,
  serere: NATIONALE,
  diola: NATIONALE,
  mandingue: NATIONALE,
  soninke: NATIONALE,
  anglais: [],
  espagnol: [],
  portugais: [],
  allemand: [],
  francais: ["langue officielle", "textes officiels"],
  diversite: ["groupes et langues", "mélange des groupes et des langues"],
  pauvrete: [],
  // ---------------------------------------------------------------------------------------------------------------- VILLES ET CAMPAGNES
  case: ["banco", "terre et en paille", "terre et de la paille"],
  "maison en dur": ["briques de ciment", "solide faite de ciment", "bâtie avec du ciment", "solide en ciment"],
  immeuble: ["plusieurs étages", "appartements"],
  tente: [],
  igloo: [],
  village: ["petit groupe d'habitations entouré de champs", "quelques familles autour des champs", "paysans qui cultivent la terre", "lieu où vivent les paysans"],
  ville: ["immeubles", "grands marchés"],
  desert: [],
  foret: [],
  "exode rural": ["départ des habitants des campagnes", "villageois quittent leur village", "départ des villageois vers les villes", "partent vivre en ville"],
  urbanisation: ["croissance des villes", "villes grandissent", "villes qui grandissent"],
  "chercher du travail": ["jeunes quittent-ils le village", "jeune à partir du village", "jeune qui quitte son village", "jeunes quittent le village", "jeune part en ville"],
  "garder les troupeaux": [],
  "cultiver le champ familial": [],
  "villages se vident": ["exode rural a-t-il sur les villages", "village quand beaucoup de jeunes le quittent"],
  "logements manquent": ["exode rural a-t-il sur les villes", "ville où arrivent beaucoup de nouveaux habitants"],
  "villes se vident": [],
  "villages deviennent des villes": [],
  embouteillages: ["bloque les voitures", "files de voitures arrêtées", "problème de circulation", "voitures bloquées aux heures de pointe"],
  pollution: ["salit l'air", "fumée et les déchets", "fumée, des déchets", "saleté de l'air"],
  "manque de logements": ["familles très nombreuses qui vivent à l'étroit", "manque des maisons et des appartements", "assez d'habitations", "ne trouvent pas où habiter", "manque d'habitations"],
  chomage: ["sans emploi", "trouver de travail", "gens qui cherchent du travail", "cherchent un emploi"],
};

/** Les suites : chaque énoncé qui contient `when` n'accepte que des tuiles prises dans une de ces listes, dans cet ordre. */
const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /empires du plus ancien/, chain: ["Empire du Ghana", "Empire du Mali", "Empire songhaï"] },
  { when: /souverains du plus ancien/, chain: ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber", "Askia Mohammed"] },
  { when: /evenements du plus ancien/, chain: ["Soundiata Keïta fonde l'empire du Mali", "Mansa Moussa part pour La Mecque", "Askia Mohammed prend le pouvoir à Gao"] },
  { when: /evenements du plus ancien/, chain: ["Les caravelles explorent la côte africaine", "Le commerce triangulaire relie trois continents", "L'esclavage prend fin dans les colonies françaises"] },
  { when: /evenements du plus ancien/, chain: ["Faidherbe devient gouverneur du Sénégal", "L'AOF est créée", "Dakar devient la capitale de l'AOF"] },
  { when: /evenements du plus ancien/, chain: ["La conquête coloniale du Sénégal", "La création de l'AOF", "L'indépendance du Sénégal"] },
  { when: /evenements du plus ancien/, chain: ["La création de l'AOF", "Dakar devient capitale", "Le Sénégal devient indépendant"] },
  { when: /evenements du plus ancien/, chain: ["Blaise Diagne devient député", "La Fédération du Mali naît", "Le Sénégal fête son indépendance"] },
  { when: /evenements du plus ancien/, chain: ["Blaise Diagne devient député", "La loi Lamine Guèye est votée", "La Fédération du Mali est créée", "Le Sénégal devient indépendant"] },
  { when: /voyage du commerce triangulaire/, chain: ["Départ d'Europe avec des marchandises", "Achat de captifs en Afrique", "Traversée vers l'Amérique", "Retour en Europe avec le sucre et le coton"] },
  { when: /continents du voyage/, chain: ["Europe", "Afrique", "Amérique"] },
  { when: /dates du plus ancien/, chain: ["Élection de Blaise Diagne", "Loi Lamine Guèye", "Naissance de la Fédération du Mali"] },
  { when: /dates du plus ancien/, chain: ["1914", "1946", "1959", "1960"] },
  { when: /faits du plus ancien/, chain: ["Blaise Diagne devient député", "La loi Lamine Guèye est votée", "Senghor devient président"] },
  { when: /evenements du plus ancien/, chain: ["Les caravelles explorent la côte africaine", "Les captifs traversent l'Atlantique", "L'esclavage prend fin dans les colonies françaises"] },
  { when: /evenements du plus ancien/, chain: ["Faidherbe gouverne le Sénégal", "Lat Dior meurt à Dékheulé", "L'AOF est créée"] },
  { when: /evenements du plus ancien/, chain: ["L'AOF est créée", "Dakar devient la capitale", "La Fédération du Mali naît", "Le Sénégal devient indépendant"] },
  { when: /inventions de la plus ancienne/, chain: ["Machine à vapeur", "Téléphone", "Automobile", "Avion", "Ordinateur"] },
  { when: /regions naturelles du nord au sud/, chain: ["Vallée du fleuve Sénégal", "Ferlo", "Bassin arachidier", "Casamance"] },
  { when: /culture du riz/, chain: ["Préparer la rizière", "Repiquer les plants", "Récolter le riz", "Vendre le riz"] },
  { when: /gestes du pecheur/, chain: ["Jeter le filet", "Remonter le filet", "Trier le poisson", "Vendre le poisson"] },
  { when: /cultive l arachide/, chain: ["Semer les graines", "Arracher les plants", "Faire sécher les arachides", "Vendre les arachides"] },
  { when: /replanter des arbres/, chain: ["Préparer des plants en pépinière", "Creuser les trous", "Planter les jeunes arbres", "Arroser et protéger les arbres"] },
  { when: /protection d un espace marin/, chain: ["La zone de mer est choisie", "La pêche y est limitée", "Les poissons se reproduisent", "La pêche devient meilleure autour"] },
  { when: /effets de la surpeche/, chain: ["Les pêcheurs prennent trop de poissons", "Il reste moins de poissons", "Les pêcheurs rapportent moins de poissons"] },
  { when: /reboisement d un village/, chain: ["Les habitants choisissent un terrain", "Ils plantent de jeunes arbres", "Ils protègent les jeunes arbres", "Les arbres deviennent grands"] },
  { when: /traversee en caravelle/, chain: ["Charger les provisions", "Hisser les voiles", "Suivre la boussole", "Arriver au port"] },
  { when: /fabrication d un livre/, chain: ["Écrire le texte", "Composer les lettres de la page", "Imprimer la page", "Relier les feuilles"] },
  { when: /groupes d age/, chain: ["Nourrisson", "Enfant", "Adulte", "Personne âgée"] },
  { when: /moins peuple au plus peuple/, chain: ["Désert", "Village", "Ville", "Capitale"] },
  { when: /moins haute a la plus haute/, chain: ["Case", "Maison en dur", "Immeuble"] },
  { when: /planter un arbre/, chain: ["Creuser le trou", "Poser le jeune plant", "Reboucher avec de la terre", "Arroser le plant"] },
  { when: /regions de la plus dense/, chain: ["Dakar", "Thiès", "Tambacounda"] },
  { when: /etapes d un recensement/, chain: ["Préparer le questionnaire", "Visiter chaque maison", "Noter les habitants", "Compter le total"] },
  { when: /nombres d habitants du plus petit/, chain: ["1 million", "8 millions", "18 millions"] },
  { when: /lieux du plus petit au plus grand/, chain: ["Maison", "Quartier", "Ville", "Région"] },
  { when: /depart d un jeune/, chain: ["Il quitte son village", "Il prend la route", "Il arrive en ville", "Il cherche du travail"] },
];

const PAIRS: [string, string][] = [
  // Les grands empires
  ["Empire du Ghana", "Koumbi Saleh"], ["Empire du Mali", "Soundiata Keïta"], ["Empire songhaï", "Gao"],
  ["Soundiata Keïta", "Fonde l'empire du Mali"], ["Mansa Moussa", "Part pour La Mecque"], ["Askia Mohammed", "Prend le pouvoir à Gao"],
  ["Koumbi Saleh", "Capitale du Ghana"], ["Gao", "Capitale de l'empire songhaï"], ["Mansa Moussa", "Souverain du Mali"],
  ["Kouroukan Fouga", "Charte du Mali"], ["Or", "Richesse du Ghana"], ["Pèlerinage", "Voyage religieux"],
  ["Griot", "Conteur de l'histoire"], ["Askia Mohammed", "Souverain de Gao"],
  // La traite négrière
  ["Boussole", "Trouver le nord"], ["Caravelle", "Naviguer au loin"], ["Imprimerie", "Fabriquer des livres"],
  ["Gorée", "Île en face de Dakar"], ["Maison des Esclaves", "Souvenir de la traite"], ["1848", "Fin de l'esclavage"],
  ["Afrique", "D'où partent les captifs"], ["Amérique", "Là où ils travaillent"], ["Europe", "Là où arrive le sucre"],
  ["Traite négrière", "Vente d'Africains"], ["Esclavage", "Pas de liberté"], ["Abolition", "Fin par la loi"],
  ["Europe", "Marchandises"], ["Afrique", "Captifs"], ["Amérique", "Du sucre et du coton"],
  ["Boussole", "Trouver sa route en mer"], ["Caravelle", "Aller plus loin en mer"], ["Imprimerie", "Faire circuler les livres"],
  // La conquête coloniale
  ["Faidherbe", "Gouverneur du Sénégal"], ["Lat Dior", "Résiste avec les armes"], ["Cheikh Ahmadou Bamba", "Résiste sans les armes"],
  ["Saint-Louis", "Première capitale de l'AOF"], ["Dakar", "Capitale de l'AOF depuis 1902"],
  ["Colonie", "Pays dirigé de loin"], ["Conquête", "Prise par la force"], ["Résistance", "Lutte contre l'occupant"],
  ["AOF", "Colonies françaises d'Afrique de l'Ouest"], ["1895", "Création de l'AOF"], ["1902", "Dakar devient capitale"],
  ["Résistance armée", "Lat Dior"], ["Résistance pacifique", "Cheikh Ahmadou Bamba"], ["Conquête", "Faidherbe"],
  ["Création de l'AOF", "1895"], ["Dakar devient capitale", "1902"], ["Indépendance du Sénégal", "1960"],
  // La marche vers l'indépendance
  ["Blaise Diagne", "Premier député africain"], ["Léopold Sédar Senghor", "Premier président du Sénégal"], ["Lamine Guèye", "Loi de 1946 sur la citoyenneté"],
  ["1914", "Diagne devient député"], ["1959", "Naissance de la Fédération du Mali"], ["1960", "Indépendance du Sénégal"],
  ["Fédération du Mali", "Union avec le Soudan français"], ["4 avril", "Fête de l'indépendance"], ["Assemblée française", "Lieu où siège Diagne"],
  ["Blaise Diagne", "Député en 1914"], ["Lamine Guèye", "Auteur de la loi de 1946"], ["Léopold Sédar Senghor", "Président en 1960"],
  ["1914", "Élection de Blaise Diagne"], ["1946", "Loi Lamine Guèye"], ["1959", "Naissance de la Fédération du Mali"], ["1960", "Fête de l'indépendance"],
  ["Fédération du Mali", "Union de deux territoires"], ["Loi de 1946", "Citoyenneté pour les habitants des colonies"], ["4 avril", "Fête nationale"],
  // Les progrès des sciences et des techniques
  ["Machine à vapeur", "Fait avancer les trains"], ["Électricité", "Éclaire les maisons"], ["Téléphone", "Transmet la voix"],
  ["Avion", "Vole dans le ciel"], ["Automobile", "Roule sur la route"], ["Radio", "Fait entendre des nouvelles"],
  ["Vaccins", "Protègent des maladies"], ["Ordinateur", "Calcule et classe des informations"], ["Électricité", "Fait briller une ampoule"],
  ["Téléphone", "Parler à distance"], ["Avion", "Voyager vite"], ["Vaccins", "Se soigner"],
  ["Radio", "Communication"], ["Automobile", "Transport"], ["Vaccins", "Santé"], ["Électricité", "Énergie"],
  ["Moyen de transport", "Avion"], ["Moyen de communication", "Téléphone"], ["Source de lumière", "Ampoule"],
  // Le milieu et les activités
  ["Vallée du fleuve Sénégal", "Riziculture"], ["Bassin arachidier", "Culture de l'arachide"], ["Côte", "Pêche"], ["Ferlo", "Élevage"], ["Casamance", "Culture des fruits"],
  ["Pêche", "Pirogue"], ["Riziculture", "Rizière"], ["Élevage", "Troupeau"],
  ["Riziculture", "Du riz"], ["Culture de l'arachide", "Des graines à huile"], ["Pêche", "Du poisson"], ["Élevage", "Du lait et de la viande"],
  ["Vallée du fleuve Sénégal", "Du riz"], ["Bassin arachidier", "Arachides"], ["Casamance", "Mangues"],
  ["Kaolack", "Bassin arachidier"], ["Ziguinchor", "Casamance"], ["Matam", "Vallée du fleuve Sénégal"],
  // Protéger nos ressources
  ["Déforestation", "Trop d'arbres coupés"], ["Surpêche", "Trop de poissons pêchés"], ["Érosion côtière", "La mer ronge la plage"], ["Avancée du désert", "Le sable gagne les terres"],
  ["Déforestation", "Replanter des arbres"], ["Surpêche", "Limiter la pêche en mer"], ["Avancée du désert", "Barrer le sable avec des arbres"],
  ["Reboisement", "Planter de jeunes arbres"], ["Grande Muraille verte", "Longue bande d'arbres au Sahel"], ["Aires marines protégées", "Zones de mer où la pêche est limitée"],
  ["Feux de brousse", "Herbe et arbres brûlés"], ["Surpêche", "Moins de poissons"], ["Érosion côtière", "La plage recule"],
  ["Reboisement", "Déforestation"], ["Aires marines protégées", "Surpêche"], ["Grande Muraille verte", "Avancée du désert"],
  ["Reboisement", "Forêts"], ["Aires marines protégées", "Poissons"], ["Grande Muraille verte", "Les terres du Sahel"],
  // La population du Sénégal
  ["Recensement", "Compter les habitants"], ["Densité", "Habitants par kilomètre carré"], ["Pyramide des âges", "Habitants de chaque âge"],
  ["Dakar", "Région la plus peuplée"], ["Ferlo", "Zone peu peuplée"], ["Wolof", "Langue la plus parlée"],
  ["Français", "Langue officielle"], ["Diola", "Langue parlée en Casamance"],
  ["Population jeune", "Beaucoup d'enfants"], ["Répartition inégale", "Des lieux très peuplés et d'autres presque vides"], ["Diversité", "Plusieurs groupes et langues"],
  ["Diola", "Casamance"], ["Pulaar", "Fleuve"], ["Sérère", "Sine et Saloum"],
  ["18 millions", "Habitants du Sénégal"], ["2023", "Année du recensement"], ["Dakar", "Région la plus dense"],
  // Villes et campagnes
  ["Case", "Banco et paille"], ["Maison en dur", "Ciment et tôle"], ["Immeuble", "Plusieurs étages"],
  ["Village", "Champs et troupeaux"], ["Ville", "Rues, marchés et immeubles"], ["Exode rural", "Départ vers la ville"],
  ["Embouteillages", "Voitures bloquées"], ["Pollution", "Air et rues sales"], ["Chômage", "Jeunes sans emploi"], ["Manque de logements", "Familles à l'étroit"],
  ["Urbanisation", "Croissance des villes"], ["Village", "Petit groupe d'habitations"],
  ["Champ", "Cultiver"], ["Marché", "Vendre"], ["École", "Apprendre"],
  ["Embouteillages", "Trop de voitures"], ["Manque de logements", "Trop d'arrivants"], ["Villages qui se vident", "Départ des jeunes"],
];

const MEMBERS: Record<string, string[]> = {
  // Les grands empires
  "Empire du Mali": ["Soundiata Keïta", "Mansa Moussa", "Kouroukan Fouga"],
  "Empire songhaï": ["Gao", "Sonni Ali Ber", "Askia Mohammed"],
  Souverain: ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber", "Askia Mohammed"],
  Ville: ["Koumbi Saleh", "Gao", "Tombouctou"],
  // La traite négrière
  Invention: ["Boussole", "Caravelle", "Imprimerie"],
  Lieu: ["Gorée", "Afrique", "Amérique", "Europe"],
  "Vers l'Amérique": ["Captifs africains", "Esclaves", "Hommes et femmes vendus"],
  "Vers l'Europe": ["Sucre", "Coton", "Café"],
  // La conquête coloniale
  "Avant 1902": ["Création de l'AOF", "Saint-Louis capitale de l'AOF", "Faidherbe gouverneur"],
  "Depuis 1902": ["Dakar capitale de l'AOF", "Indépendance du Sénégal", "Fête du 4 avril"],
  "Résistance armée": ["Lat Dior", "Alboury Ndiaye", "El Hadji Oumar Tall"],
  "Résistance pacifique": ["Cheikh Ahmadou Bamba", "Aline Sitoé Diatta"],
  // La marche vers l'indépendance
  "Avant 1960": ["Élection de Blaise Diagne", "Loi Lamine Guèye", "Naissance de la Fédération du Mali"],
  "Depuis 1960": ["Senghor président", "Fête du 4 avril", "Fin de la Fédération du Mali"],
  "Un homme politique": ["Blaise Diagne", "Lamine Guèye", "Léopold Sédar Senghor"],
  Date: ["1914", "1959", "4 avril"],
  // Les progrès des sciences et des techniques
  "Se déplacer": ["Automobile", "Avion", "Train à vapeur", "Bateau à vapeur"],
  Communiquer: ["Téléphone", "Radio", "Télégraphe"],
  "Pour se soigner": ["Vaccin", "Piqûre protectrice", "Centre de vaccination"],
  "Pour s'éclairer": ["Ampoule", "Lampe électrique", "Éclairage public"],
  // Le milieu et les activités
  "Vallée du fleuve Sénégal": ["Riz", "Rizière", "Fleuve Sénégal"],
  Côte: ["Pêche", "Pirogue", "Poisson"],
  "Bassin arachidier": ["Arachide", "Huile d'arachide", "Kaolack"],
  Ferlo: ["Troupeau", "Zébu", "Éleveur"],
  Casamance: ["Mangues", "Oranges", "Vergers"],
  // Protéger nos ressources
  Problème: ["Déforestation", "Feux de brousse", "Surpêche", "Érosion côtière", "Avancée du désert"],
  Solution: ["Reboisement", "Grande Muraille verte", "Aires marines protégées"],
  "Problème de la terre": ["Déforestation", "Feux de brousse", "Avancée du désert"],
  "Problème de la mer": ["Surpêche", "Érosion côtière"],
  // La population du Sénégal
  "Une langue nationale": ["Wolof", "Pulaar", "Sérère", "Diola", "Mandingue", "Soninké"],
  "Une langue étrangère": ["Anglais", "Espagnol", "Portugais", "Allemand"],
  "Beaucoup d'habitants": ["Dakar", "Thiès", "Côte"],
  "Peu d'habitants": ["Ferlo", "Kédougou", "Tambacounda"],
  // Villes et campagnes
  "À la campagne": ["Champs de mil", "Troupeaux", "Maison en banco", "Puits du village"],
  "En ville": ["Embouteillages", "Immeubles", "Autobus", "Trottoirs"],
  "Un problème de ville": ["Embouteillages", "Pollution", "Manque de logements"],
  "Un problème de campagne": ["Villages qui se vident", "Champs abandonnés", "Manque de bras pour cultiver"],
};

/**
 * Des réponses qui sont toutes justes pour une même question : elles ne se proposent jamais ensemble.
 * Les groupes de deux valent pour tous les énoncés ; les groupes de trois ou plus valent pour les énoncés qui demandent « lequel de ces… ».
 */
const TWINS: readonly (readonly string[])[] = [
  ["sonni ali ber", "askia mohammed"],
  ["commerce triangulaire", "traite negriere"],
  ["reboisement", "grande muraille verte"],
  ["deforestation", "feux de brousse"],
  ["disparition de la foret", "destruction de l herbe et des arbres"],
  ["maison en dur", "immeuble"],
  ["villages se vident", "logements manquent"],
  ["saint-louis", "dakar"],
  ["vallee du fleuve", "casamance"],
  ["riziculture", "culture des fruits"],
  ["kaolack", "kaffrine", "diourbel", "fatick"],
  ["wolof", "pulaar", "serere", "diola", "mandingue", "soninke"],
];
/** Les énoncés qui demandent « lequel de ces noms » : aucune autre réponse du groupe ne s'y propose. */
const LIST_STEM = /bassin arachidier|laquelle de ces langues|parmi ces langues|quelle langue de la liste|quelle langue de cette liste|quel nom de langue|parmi ces noms|lequel de ces noms|quelle langue fait partie/;

const { checkOf } = defineTemplateTests({
  label: "de l'histoire et de la géographie du CM2",
  klass: "CM2",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 54,
  topicCount: 9,
  kindPattern: /^cm2-(emp|tra|col|ind|pro|mil|deg|pop|vil)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
    ["Empire du Mali", "Empire songhaï"], ["Souverain", "Ville"],
    ["Invention", "Lieu"], ["Vers l'Amérique", "Vers l'Europe"],
    ["Avant 1902", "Depuis 1902"], ["Résistance armée", "Résistance pacifique"],
    ["Avant 1960", "Depuis 1960"], ["Un homme politique", "Date"],
    ["Se déplacer", "Communiquer"], ["Pour se soigner", "Pour s'éclairer"],
    ["Vallée du fleuve Sénégal", "Côte"], ["Bassin arachidier", "Ferlo"], ["Casamance", "Ferlo"],
    ["Problème", "Solution"], ["Problème de la terre", "Problème de la mer"],
    ["Une langue nationale", "Une langue étrangère"], ["Beaucoup d'habitants", "Peu d'habitants"],
    ["À la campagne", "En ville"], ["Un problème de ville", "Un problème de campagne"],
  ],
});

describe("les vérifications voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({
    type: "qcm",
    prompt,
    answerKey: options[correctIndex],
    hints: [],
    payload: { options, correctIndex },
  });

  it("refusent le souverain songhaï donné pour le fondateur du Mali, et deux bonnes réponses dans les choix", () => {
    const check = checkOf("cm2-emp-qcm");
    expect(check(qcm("Quel souverain a fondé l'empire du Mali ?", ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber"], 0))).toBeNull();
    expect(check(qcm("Quel souverain a fondé l'empire du Mali ?", ["Soundiata Keïta", "Mansa Moussa", "Sonni Ali Ber"], 2))).not.toBeNull();
    expect(check(qcm("Quel souverain songhaï a régné avant Askia Mohammed ?", ["Sonni Ali Ber", "Askia Mohammed", "Mansa Moussa"], 0))).not.toBeNull();
  });

  it("refusent le sucre rapporté en Afrique", () => {
    const check = checkOf("cm2-tra-qcm");
    expect(check(qcm("Vers quel continent les bateaux rapportaient-ils le sucre et le coton ?", ["Europe", "Afrique", "Amérique"], 0))).toBeNull();
    expect(check(qcm("Vers quel continent les bateaux rapportaient-ils le sucre et le coton ?", ["Europe", "Afrique", "Amérique"], 1))).not.toBeNull();
  });

  it("refusent Dakar pour la première capitale de l'AOF, et la Casamance pour la zone du riz", () => {
    const col = checkOf("cm2-col-qcm");
    expect(col(qcm("Quelle ville fut la première capitale de l'AOF ?", ["Saint-Louis", "Gorée", "Thiès"], 0))).toBeNull();
    expect(col(qcm("Quelle ville fut la première capitale de l'AOF ?", ["Dakar", "Gorée", "Thiès"], 0))).not.toBeNull();
    const mil = checkOf("cm2-mil-qcm");
    expect(mil(qcm("Quelle zone du nord du pays est célèbre pour la culture du riz ?", ["Vallée du fleuve", "Ferlo", "Côte"], 0))).toBeNull();
    expect(mil(qcm("Quelle zone du nord du pays est célèbre pour la culture du riz ?", ["Vallée du fleuve", "Casamance", "Côte"], 0))).not.toBeNull();
  });
});
