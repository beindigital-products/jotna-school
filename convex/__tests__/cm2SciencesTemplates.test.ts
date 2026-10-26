import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";
import { allProgrammeEntries } from "../programme";
import { generateGames } from "../paliers/games";

/**
 * LES SCIENCES DU CM2 : cinq thématiques, vingt-neuf gabarits (`cm2Sciences.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts` (le même que pour le CM1 et l'histoire du CM2). Ce fichier ne lit
 * AUCUN tableau des sources : ses tables, écrites à part, disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`),
 * dans quel ordre vont les suites (`CHAINS`), quelles paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`).
 *
 * Les fragments de `ASSOC` sont des suites de mots entiers, lues sans accent ni majuscule. Une réponse sans fragment (`[]`) n'est JAMAIS
 * une bonne réponse : le moteur la refuse dès qu'un exercice la donne pour juste. Une bonne réponse a au moins un de ses fragments dans
 * l'énoncé ; un mauvais choix n'en a aucun qui ne soit aussi un fragment de la bonne réponse.
 */

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "sc-cm2-milieux": ["cm2-mli-qcm", "cm2-mli-trou", "cm2-mli-ecrire", "cm2-mli-relier", "cm2-mli-glisser"],
  "sc-cm2-appareils": ["cm2-apr-qcm", "cm2-apr-trou", "cm2-apr-ecrire", "cm2-apr-ordre", "cm2-apr-relier", "cm2-apr-glisser"],
  "sc-cm2-nutrition": ["cm2-nut-qcm", "cm2-nut-trou", "cm2-nut-ecrire", "cm2-nut-ordre", "cm2-nut-relier", "cm2-nut-glisser"],
  "sc-cm2-ressources": ["cm2-rsc-qcm", "cm2-rsc-trou", "cm2-rsc-ecrire", "cm2-rsc-ordre", "cm2-rsc-relier", "cm2-rsc-glisser"],
  "sc-cm2-sante": ["cm2-san-qcm", "cm2-san-trou", "cm2-san-ecrire", "cm2-san-ordre", "cm2-san-relier", "cm2-san-glisser"],
};

const ASSOC: Record<string, string[]> = {
  // ---------------------------------------------------------------------------------------------------------------- MILIEUX
  branchies: ["respirer dans l'eau", "respire-t-il sous l'eau", "respirer sous l'eau", "respire sous l'eau"],
  nageoires: ["agite-t-il pour nager", "avance-t-il dans l'eau", "se diriger dans l'eau", "nage et se dirige", "pour avancer dans l'eau"],
  ecailles: ["recouvre la peau du poisson", "petites plaques dures", "couverture brillante", "peau du poisson est protégée", "corps du poisson est couvert"],
  poils: ["couvre la peau de la chèvre", "corps d'une chèvre", "animaux comme la chèvre", "corps de la chèvre est couvert", "chèvre se protège du froid"],
  plumes: ["corps d'un oiseau", "permettent à l'oiseau de voler", "ailes d'un oiseau", "corps de l'oiseau est couvert", "oiseau vole grâce à ses"],
  poisson: ["Lequel de ces êtres vivants vit dans l'eau", "animal à nageoires", "aquatique a des écailles", "Dans l'eau vit"],
  crevette: ["animal à carapace", "aquatique a une carapace", "vit dans la mer ou dans le fleuve", "animaux du milieu aquatique", "Dans la mer ou dans le fleuve vit"],
  nenuphar: ["surface de l'eau", "plante aquatique", "larges feuilles", "plante du milieu aquatique", "étang flotte"],
  chevre: ["animal terrestre a des poils", "terre ferme et a des poils", "terre ferme broute", "Sur la terre ferme vit", "animal terrestre qui broute"],
  baobab: ["arbre géant", "grand arbre de la savane", "tronc énorme", "êtres vivants du milieu terrestre", "grand arbre de la terre ferme"],
  lion: [],
  "racines profondes": ["chercher l'eau très loin", "puiser l'eau profondément", "trouver de l'eau", "pour chercher l'eau", "loin sous le sol"],
  "feuilles epineuses": ["se protéger et garder leur eau", "protection piquante", "éloigne les animaux", "se protéger en zone sèche", "se défend avec des"],
  "grandes fleurs": [],
  "tiges flottantes": [],
  "milieu aquatique": ["où vivent le poisson et la crevette", "lieu vit le nénuphar", "passent leur vie dans l'eau", "poisson vit dans un milieu", "nénuphar pousse dans un milieu"],
  aquatique: ["où vivent le poisson et la crevette", "lieu vit le nénuphar", "passent leur vie dans l'eau", "poisson vit dans un milieu", "nénuphar pousse dans un milieu"],
  "milieu terrestre": ["où vivent la chèvre et le baobab", "lieu vit la chèvre", "passent leur vie sur la terre ferme", "chèvre vit dans un milieu", "baobab pousse dans un milieu"],
  terrestre: ["où vivent la chèvre et le baobab", "lieu vit la chèvre", "passent leur vie sur la terre ferme", "chèvre vit dans un milieu", "baobab pousse dans un milieu"],
  "milieu polaire": [],
  polaire: [],
  // ---------------------------------------------------------------------------------------------------------------- APPAREILS
  refrigerateur: ["garde les aliments au frais", "conserve le lait", "aliments se gâtent", "garder les aliments au frais", "lait reste frais"],
  ventilateur: ["brasse l'air pour rafraîchir", "fait du vent avec des pales", "aide à avoir moins chaud", "avoir moins chaud dans une pièce", "pour faire du vent"],
  "telephone portable": ["se glisse dans la poche", "sans fil permet de téléphoner", "sert à appeler et à envoyer des messages", "appeler un ami", "envoie un message"],
  "fer a repasser": ["chaud sert à défroisser", "lisse le tissu quand il est chaud", "laisser refroidir avant de le ranger", "défroisser un habit", "lisse un habit froissé avec"],
  radio: [],
  ampoule: [],
  "debrancher l appareil": ["avant de nettoyer un appareil électrique", "avant de nettoyer un appareil branché", "avant de nettoyer un ventilateur", "nettoyer un ventilateur en sécurité"],
  "secher ses mains": ["avant de toucher une prise", "mains mouillees avant de brancher", "à ses mains avant de brancher", "brancher un appareil sans danger"],
  "appeler un adulte": ["fume ou fait des étincelles", "sent le brûlé", "fil électrique est abîmé", "Si un appareil fume", "fil est abîmé"],
  "mouiller la prise": [],
  "tirer sur le fil pour debrancher": [],
  "toucher les fils nus": [],
  "brancher plusieurs appareils sur une prise": [],
  "eteindre la lumiere": ["économise l'électricité quand on quitte", "lumière en sortant", "courant en quittant la classe", "économiser l'électricité, on peut", "En quittant une pièce vide"],
  "debrancher le chargeur": ["chargeur quand le téléphone est plein", "après la recharge", "fini de charger", "Quand la recharge est finie", "après la charge"],
  "ouvrir la porte le moins possible": ["porte du réfrigérateur pour qu'il consomme moins", "garde le froid dans le réfrigérateur", "limiter l'électricité utilisée", "réfrigérateur consomme moins", "Pour garder le froid"],
  "laisser la lumiere allumee": [],
  "laisser le chargeur branche": [],
  "laisser la porte ouverte longtemps": [],
  "enlever la poussiere": ["pales sales pour que le ventilateur tourne", "retire la saleté posée sur un ventilateur", "retirer des pales", "entretenir un ventilateur", "ventilateur tourne mieux"],
  "laisser refroidir": ["fer à repasser chaud avant de le ranger", "après le repassage", "attendre avant de ranger un fer", "Avant de ranger le fer à repasser", "Après le repassage"],
  "eviter les chocs": ["que le téléphone portable dure", "protège un téléphone portable", "prendre soin d'un téléphone portable", "pour que le téléphone dure", "téléphone portable se casse moins"],
  "mouiller l appareil": [],
  // ---------------------------------------------------------------------------------------------------------------- NUTRITION
  "aliments energetiques": ["force pour courir et jouer", "énergie au corps", "nous fait avancer toute la journée", "Le riz et le mil", "force pour la journée", "riz", "mil"],
  "aliment energetique": ["riz", "mil"],
  "aliments de construction": ["grandir et à fabriquer muscles et os", "sert à construire le corps", "riches en protéines font grandir", "Le poisson et le niébé", "aident l'enfant à grandir", "poisson", "niébé", "haricots"],
  "aliment de construction": ["poisson", "niébé", "haricots"],
  "aliments de protection": ["protègent le corps contre les maladies", "apporte des vitamines", "aident le corps à se défendre", "La mangue et les légumes verts", "défendent le corps contre les maladies", "mangue", "légumes verts", "feuilles vertes"],
  "aliment de protection": ["mangue", "légumes verts", "feuilles vertes"],
  thieboudienne: ["riz, le poisson et des légumes", "riz rouge et du poisson", "riz au poisson", "au riz et au poisson"],
  mafe: ["sauce à l'arachide servie", "pâte d'arachide et de la viande", "sauce épaisse d'arachide", "à la pâte d'arachide"],
  yassa: ["poulet, oignons et citron", "oignons dorés et du citron", "poulet mariné avec des oignons", "au poulet et au citron", "poulet mariné aux oignons"],
  pizza: [],
  hamburger: [],
  "aliments des trois groupes": ["contient un repas équilibré", "Un repas équilibré contient", "composé un repas équilibré", "repas qui fait grandir sainement", "repas doit contenir"],
  "seul groupe d aliments": [],
  "seulement des sucreries": [],
  "sucreries seulement": [],
  carence: ["manque d'une substance dont le corps a besoin", "manque d'un élément important", "manque de vitamines ou de fer", "manque d'une substance utile"],
  malnutrition: ["alimentation insuffisante ou mal choisie", "alimentation qui ne couvre pas les besoins du corps", "enfant mal nourri"],
  obesite: ["poids beaucoup trop élevé", "trop de graisse dans le corps", "trop de sucreries et de graisses", "poids très élevé", "trop gras et trop sucré"],
  allergie: [],
  rhume: [],
  // ---------------------------------------------------------------------------------------------------------------- RESSOURCES
  "ressource naturelle": ["ce que la nature donne aux hommes", "tout ce que la nature fournit"],
  jachere: ["repos d'un champ laissé sans culture", "champ qu'on laisse au repos", "Un champ laissé au repos pour que le sol se refasse", "Mettre un champ au repos quelques saisons"],
  "sol epuise": ["terre qui n'a plus assez de richesses", "sol trop cultivé qui ne donne presque plus", "Une terre qui ne nourrit plus les plantes", "Après trop de récoltes sans repos"],
  pauvrete: ["personnes qui manquent de nourriture et d'argent", "manque de biens et de ressources dans une famille", "Manquer de nourriture et d'argent", "Le manque de ressources peut aggraver"],
  "fermer le robinet pendant le savonnage": ["gaspiller l'eau en se lavant les mains", "économise l'eau quand on se lave", "perdre de l'eau inutilement", "Pour économiser l'eau", "Pour ne pas gaspiller l'eau"],
  "planter un arbre a la place de celui qu on coupe": ["garder des arbres quand on en coupe un", "refaire la forêt", "après avoir coupé un arbre", "Après avoir coupé un arbre", "refaire un petit bois"],
  "laisser le champ au repos quelques saisons": ["champ retrouve sa richesse", "sol fatigué", "champ qui ne donne presque plus de récolte", "sol retrouve sa richesse", "champ est fatigué"],
  "rejeter a l eau les petits poissons": ["pêcheur responsable des petits poissons", "poissons qui n'ont pas fini de grandir", "pêcher sans vider la mer", "pêcheur responsable doit", "pêche dure"],
  "laisser l eau couler pendant des heures": [],
  "bruler la brousse pour nettoyer le champ": [],
  "pecher tous les petits poissons": [],
  "cultiver sans jamais laisser reposer le sol": ["épuise un sol", "champ cultivé chaque année", "sol pauvre en richesses", "Un sol s'épuise", "champ donne moins"],
  "pecher plus de poissons qu il n en nait": ["fait disparaître les poissons de la mer", "mer se vide-t-elle de ses poissons", "poissons de plus en plus rares", "La mer se vide", "moins de poissons parce"],
  "couper des arbres sans en replanter": ["fait disparaître une forêt", "forêt devient-elle de plus en plus petite", "moins boisé d'année en année", "Une forêt disparaît", "arbres manquent parce"],
  "recoltes plus petites": ["conséquence a un sol épuisé", "récoltes quand le sol est épuisé", "sol fatigué sur les récoltes"],
  "moins de poissons a vendre": ["rapportent les pêcheurs au port", "surpêche pour les familles de pêcheurs", "prises des pêcheurs"],
  "plantes qui sechent": ["plantes quand l'eau manque", "long manque d'eau", "cultures quand il ne pleut presque plus"],
  // Des intrus sans lien avec le sol, la pêche ou la sécheresse : « des récoltes plus petites » était aussi juste pour un manque d'eau.
  "rivieres plus pleines": [],
  "arbres plus nombreux": [],
  // ---------------------------------------------------------------------------------------------------------------- SANTÉ
  "consultation prenatale": ["visite de santé d'une femme enceinte", "visite au centre de santé suit la grossesse", "rendez-vous de santé aide la mère", "visite de santé avant la naissance", "femme enceinte va au centre de santé"],
  vaccination: ["protège l'enfant contre des maladies grâce à un vaccin", "geste fait au centre de santé protège les enfants", "bébé au centre de santé pour ne pas tomber", "protège l'enfant grâce à un vaccin", "bébé qui reçoit son vaccin"],
  allaitement: ["nourrir un bébé avec le lait de sa mère", "repas d'un bébé au sein", "donner le lait de la mère au nourrisson", "lait de la mère donné au bébé"],
  "carnet de sante": ["liste des vaccins reçus", "note-t-on la santé et les vaccins", "vaccins d'un enfant sont notés", "suivre la santé d'un bébé"],
  "cahier de textes": [],
  "carnet de notes": [],
  "lait maternel": ["suffit au bébé", "meilleur aliment d'un nourrisson", "tout petit bébé pour grandir", "premiers mois, le bébé boit", "nourrisson grandit bien"],
  "eau sucree": [],
  "bouillie epaisse": [],
  "reprendre des forces": ["espacement des naissances", "naissances sont espacées", "espacer les naissances", "naissances espacées permettent"],
  "travailler davantage": [],
  "manger moins": [],
  vih: ["virus cause le sida", "virus responsable du sida", "sida est causé par le virus"],
  sida: ["maladie est causée par le virus", "maladie due au virus", "maladie due au VIH", "virus VIH peut provoquer"],
  paludisme: [],
  rougeole: [],
  "par le sang": ["passer d'une personne à une autre", "virus du sida peut-il se transmettre", "De quelle façon le VIH peut-il se transmettre", "virus du sida peut se transmettre"],
  "par une poignee de main": [],
  "en partageant un repas": [],
  "par une piqure de moustique": [],
  "ne pas partager d aiguille ni de lame": ["Que doit-on faire pour se protéger du VIH", "geste protège du virus du sida", "règle simple évite de prendre le VIH", "Pour se protéger du VIH, il faut", "Pour éviter le VIH, on doit"],
  "aiguille ou une lame": ["ne faut-il jamais partager pour éviter le VIH", "objet qui pique ou qui coupe ne se partage jamais", "on ne partage jamais", "il ne faut jamais partager"],
  "ballon de foot": [],
  "cahier d ecole": [],
  "suivre son traitement au centre de sante": ["personne qui vit avec le VIH pour rester en bonne santé", "personne séropositive peut-elle vivre longtemps", "malade du sida à se soigner", "Une personne qui vit avec le VIH", "personne séropositive doit"],
  "eviter de serrer la main d un malade": [],
  "ne plus manger avec ses amis": [],
};

/** Les suites : chaque énoncé qui contient `when` n'accepte que des tuiles prises dans une de ces listes, dans cet ordre. */
const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /repasser un habit/, chain: ["Brancher le fer", "Attendre qu'il chauffe", "Repasser l'habit", "Débrancher le fer"] },
  { when: /nettoyer un ventilateur/, chain: ["Débrancher le ventilateur", "Enlever la poussière", "Laisser sécher", "Rebrancher le ventilateur"] },
  { when: /recharger un telephone/, chain: ["Brancher le chargeur", "Brancher le téléphone", "Attendre la fin de la charge", "Débrancher le chargeur"] },
  { when: /changer une ampoule/, chain: ["Éteindre la lumière", "Attendre que l'ampoule refroidisse", "Dévisser l'ampoule", "Visser la nouvelle ampoule"] },
  { when: /brancher un appareil/, chain: ["Se laver les mains", "Sécher ses mains", "Prendre la fiche", "Brancher la fiche"] },
  { when: /repas de la journee/, chain: ["Petit-déjeuner", "Déjeuner", "Goûter", "Dîner"] },
  { when: /preparer un repas/, chain: ["Acheter les aliments", "Laver les légumes", "Cuire le repas", "Servir le repas"] },
  { when: /etapes de la jachere/, chain: ["On cultive le champ", "Le sol s'épuise", "On laisse le champ au repos", "Le sol retrouve sa richesse"] },
  { when: /pecheur responsable/, chain: ["Jeter le filet", "Remonter le filet", "Rejeter les petits poissons", "Vendre les gros poissons au marché"] },
  { when: /laver les mains sans gaspiller/, chain: ["Mouiller les mains", "Fermer le robinet", "Se savonner", "Rouvrir pour rincer"] },
  { when: /refaire un petit bois/, chain: ["Choisir un terrain", "Planter les jeunes arbres", "Arroser les jeunes arbres", "Attendre que les arbres grandissent"] },
  { when: /arroser un jardin/, chain: ["Remplir l'arrosoir", "Porter l'arrosoir au jardin", "Arroser au pied des plantes", "Replacer l'arrosoir"] },
  { when: /moments de la vie d un bebe/, chain: ["Consultation prénatale", "Naissance", "Allaitement"] },
  { when: /moments de la vie d un bebe/, chain: ["Consultation prénatale", "Naissance", "Premier vaccin"] },
  { when: /moments de la vie d un enfant/, chain: ["Naissance", "Premier anniversaire", "Entrée à l'école"] },
  { when: /visite de vaccination/, chain: ["Aller au centre de santé", "Montrer le carnet", "Recevoir le vaccin", "Noter le vaccin dans le carnet"] },
  { when: /gestes d une consultation prenatale/, chain: ["Prendre le carnet de santé", "Arriver au centre de santé", "Être examinée par la sage-femme", "Prendre le prochain rendez-vous"] },
];

const PAIRS: [string, string][] = [
  // Milieux
  ["Poisson", "Écailles"], ["Chèvre", "Poils"], ["Oiseau", "Plumes"],
  ["Branchies", "Respirer dans l'eau"], ["Nageoires", "Nager"], ["Écailles", "Protéger la peau"],
  ["Poisson", "Dans l'eau"], ["Chèvre", "Sur la terre ferme"], ["Nénuphar", "À la surface de l'eau"],
  ["Branchies", "Poisson"], ["Poils", "Chèvre"], ["Plumes", "Oiseau"],
  ["Racines profondes", "Trouver l'eau loin"], ["Feuilles épineuses", "Éloigner les animaux"], ["Écailles", "Protéger le poisson"],
  // Appareils
  ["Réfrigérateur", "Garder au frais"], ["Ventilateur", "Rafraîchir l'air"], ["Téléphone portable", "Appeler"], ["Fer à repasser", "Défroisser"],
  ["Réfrigérateur", "Conserve les aliments"], ["Ventilateur", "Fait du vent"], ["Fer à repasser", "Chauffe pour lisser les habits"],
  ["Éteindre la lumière", "Économiser l'électricité"], ["Fermer la porte du réfrigérateur", "Garder le froid"], ["Débrancher l'appareil", "Éviter le choc électrique"],
  ["Ventilateur", "Enlever la poussière"], ["Fer à repasser", "Laisser refroidir"], ["Téléphone portable", "Éviter les chocs"],
  ["Fer à repasser", "Brûlure"], ["Prise", "Choc électrique"], ["Ventilateur", "Doigts dans les pales"],
  // Nutrition
  ["Riz", "Énergétique"], ["Poisson", "Construction"], ["Mangue", "Protection"],
  ["Igname", "Énergétique"], ["Niébé", "Construction"], ["Orange", "Protection"],
  ["Thiéboudienne", "Riz et poisson"], ["Mafé", "Riz et sauce d'arachide"], ["Yassa", "Poulet et oignons"],
  ["Carence", "Manque d'un élément"], ["Malnutrition", "Mauvaise alimentation"], ["Obésité", "Poids trop élevé"],
  ["Énergétique", "Donne de la force"], ["Construction", "Fait grandir"], ["Protection", "Défend contre les maladies"],
  // Ressources
  ["Sol épuisé", "Récoltes plus petites"], ["Surpêche", "Moins de poissons"], ["Manque d'eau", "Cultures qui sèchent"],
  ["Jachère", "Reposer le sol"], ["Fermer le robinet", "Garder l'eau"], ["Planter un arbre", "Refaire la forêt"],
  ["Ressource naturelle", "Eau, arbres, sol"], ["Pauvreté", "Manque de biens"], ["Jachère", "Champ au repos"],
  ["Eau", "Gaspillage"], ["Poissons", "Surpêche"], ["Sol", "Épuisement"],
  ["Eau", "Fermer le robinet"], ["Sol", "Jachère"], ["Poissons", "Pêche responsable"],
  // Santé
  ["Consultation prénatale", "Suivre la grossesse"], ["Vaccination", "Protéger l'enfant"], ["Allaitement", "Nourrir le bébé"],
  ["Carnet de santé", "Noter les vaccins"], ["Centre de santé", "Soigner et vacciner"], ["Lait maternel", "Nourrir et protéger"],
  ["VIH", "Virus"], ["Sida", "Maladie"], ["Vaccin", "Protection"],
  ["Sage-femme", "Suit la grossesse"], ["Infirmier", "Vaccine l'enfant"], ["Mère", "Allaite son bébé"],
  ["Femme enceinte", "Consultation prénatale"], ["Bébé", "Lait maternel"], ["Personne séropositive", "Traitement chaque jour"],
];

const MEMBERS: Record<string, string[]> = {
  "Milieu aquatique": ["Poisson", "Crevette", "Nénuphar"],
  "Milieu terrestre": ["Chèvre", "Baobab", "Lion"],
  "Pour vivre dans l'eau": ["Branchies", "Nageoires", "Écailles"],
  "Pour vivre sur la terre": ["Poils", "Plumes", "Racines profondes", "Feuilles épineuses"],
  Sécurité: ["Sécher ses mains", "Débrancher avant de nettoyer", "Appeler un adulte", "Ne pas mouiller la prise"],
  Économie: ["Éteindre la lumière", "Éteindre la radio en sortant", "Éteindre le ventilateur", "Fermer la porte du frigo"],
  "Appareil électrique": ["Réfrigérateur", "Ventilateur", "Fer à repasser", "Téléphone portable"],
  "Outil sans électricité": ["Balai", "Pilon", "Daba"],
  "Aliment énergétique": ["Riz", "Mil", "Igname", "Patate"],
  "Aliment de construction": ["Poisson", "Niébé", "Viande", "Œuf"],
  "Aliment de protection": ["Mangue", "Orange", "Papaye", "Légumes verts"],
  "Gaspille une ressource": ["Laisser couler l'eau", "Pêcher les petits poissons", "Couper sans replanter", "Cultiver sans repos"],
  "Protège une ressource": ["Fermer le robinet", "Mettre en jachère", "Planter un arbre", "Pêcher avec modération"],
  Ressource: ["Eau", "Arbres", "Poissons", "Sol"],
  Problème: ["Sol épuisé", "Surpêche", "Pauvreté", "Manque d'eau"],
  "Avant la naissance": ["Consultation prénatale", "Suivi de la grossesse", "Visite chez la sage-femme"],
  "Après la naissance": ["Allaitement", "Vaccin du bébé", "Pesée du bébé"],
  "Peut transmettre le VIH": ["Aiguille déjà utilisée", "Lame déjà utilisée", "Sang d'une personne infectée"],
  "Ne transmet pas le VIH": ["Poignée de main", "Repas partagé", "Câlin entre amis", "Piqûre de moustique"],
};

/** Des réponses qui sont toutes justes pour une même question : elles ne se proposent jamais ensemble. */
const TWINS: readonly (readonly string[])[] = [
  ["carence", "malnutrition"],
  ["vih", "sida"],
  ["chevre", "baobab"],
  ["poisson", "crevette", "nenuphar"],
  ["debrancher l appareil", "secher ses mains", "appeler un adulte"],
  // Une personne qui vit avec le VIH se protège aussi en ne partageant ni aiguille ni lame : les deux gestes ne sont jamais proposés ensemble.
  ["ne pas partager d aiguille ni de lame", "suivre son traitement au centre de sante"],
];
/** Les énoncés où tout le groupe est juste : « vit dans l'eau », « sur la terre ferme », « si un appareil fume ». */
const LIST_STEM = /lequel de ces etres vivants vit dans l eau|parmi les animaux du milieu aquatique|dans l eau vit|si un appareil fume|quand un fil est abime|fume ou fait des etincelles|sent le brule|fil electrique est abime/;

const { checkOf } = defineTemplateTests({
  label: "des sciences du CM2",
  klass: "CM2",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 29,
  topicCount: 5,
  kindPattern: /^cm2-(mli|apr|nut|rsc|san)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
    ["Milieu aquatique", "Milieu terrestre"], ["Pour vivre dans l'eau", "Pour vivre sur la terre"],
    ["Sécurité", "Économie"], ["Appareil électrique", "Outil sans électricité"],
    ["Aliment énergétique", "Aliment de construction"], ["Aliment énergétique", "Aliment de protection"], ["Aliment de construction", "Aliment de protection"],
    ["Gaspille une ressource", "Protège une ressource"], ["Ressource", "Problème"],
    ["Avant la naissance", "Après la naissance"], ["Peut transmettre le VIH", "Ne transmet pas le VIH"],
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

  it("refusent la branchie donnée pour la nage, et deux bonnes réponses dans les choix", () => {
    const check = checkOf("cm2-mli-qcm");
    expect(check(qcm("Quels organes permettent au poisson de respirer dans l'eau ?", ["Branchies", "Plumes", "Poils"], 0))).toBeNull();
    expect(check(qcm("Quels organes permettent au poisson de respirer dans l'eau ?", ["Nageoires", "Branchies", "Poils"], 0))).not.toBeNull();
  });

  it("refusent la malnutrition pour une carence, et le sida pour le virus", () => {
    const check = checkOf("cm2-nut-qcm");
    expect(check(qcm("Comment appelle-t-on le manque d'un élément important dans l'alimentation ?", ["Carence", "Obésité", "Allergie"], 0))).toBeNull();
    expect(check(qcm("Comment appelle-t-on le manque d'un élément important dans l'alimentation ?", ["Carence", "Malnutrition", "Allergie"], 0))).not.toBeNull();
    const san = checkOf("cm2-san-qcm");
    expect(san(qcm("Quel virus cause le sida ?", ["VIH", "Paludisme", "Rougeole"], 0))).toBeNull();
    expect(san(qcm("Quel virus cause le sida ?", ["Sida", "Paludisme", "Rougeole"], 0))).not.toBeNull();
  });
});

describe("l'indice de la première lettre ne trompe pas", () => {
  const initial = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/^(le |la |les |l'|un |une |des |du |de la |de l')/i, "")
      .charAt(0)
      .toUpperCase();

  it("ne nomme jamais A, B ou C dans un QCM (ses choix portent ces lettres), ni une lettre que porte aussi un mauvais choix", () => {
    for (const entry of allProgrammeEntries()) {
      if (!(entry.topic.key in TOPIC_KINDS)) continue;
      for (let n = 0; n < 10; n++)
        for (let palier = 1; palier <= 5; palier++) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CM2", palierIndex: palier, palierCount: 5, seed: `lettre:${entry.topic.key}:${n}:${palier}` });
          for (const game of games) {
            const letter = game.hints.map((hint) => /^La réponse commence par la lettre ([A-Z])\.$/.exec(hint)?.[1]).find((found) => found !== undefined);
            if (letter === undefined) continue;
            const qcm = game.type === "qcm";
            const blank = (game.payload.blanks as { options: string[]; answer: string }[] | undefined)?.[0];
            const options = qcm ? (game.payload.options as string[]) : (blank?.options ?? []);
            const answer = qcm ? options[game.payload.correctIndex as number] : blank?.answer;
            const wrong = options.filter((option) => option !== answer);
            expect(qcm && ["A", "B", "C"].includes(letter), `${game.prompt} : « lettre ${letter} » sur un QCM`).toBe(false);
            expect(wrong.filter((option) => initial(option) === letter), `${game.prompt} : la lettre ${letter} ne départage rien`).toEqual([]);
          }
        }
    }
  });
});

describe("une phrase à trou n'accorde aucun mot placé après le blanc", () => {
  /** Les seuls mots qui suivent un blanc dans ce lot : jamais un adjectif ni un participe, que le genre de la réponse ferait accorder. */
  const AFTER_BLANK = new Set(["aident", "après", "d'abord", "donnent", "défendent", "en", "le", "pour", "qui"]);

  it("laisse après le blanc un verbe ou un petit mot, jamais un mot qui s'accorde", () => {
    for (const entry of allProgrammeEntries()) {
      if (!(entry.topic.key in TOPIC_KINDS)) continue;
      for (let n = 0; n < 30; n++)
        for (let palier = 1; palier <= 5; palier++) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CM2", palierIndex: palier, palierCount: 5, seed: `accord:${entry.topic.key}:${n}:${palier}` });
          for (const game of games) {
            if (game.type !== "fill-blank") continue;
            const next = /___ ([\p{L}']+)/u.exec(String(game.payload.text))?.[1];
            if (next !== undefined) expect(AFTER_BLANK.has(next.toLowerCase()), `« ${String(game.payload.text)} » : « ${next} » suit le blanc`).toBe(true);
          }
        }
    }
  });
});
