/**
 * LES GABARITS DE L'INSTRUCTION CIVIQUE DU CP : la sécurité sur la route, le règlement de la classe, les responsabilités
 * en classe, filles et garçons, régler un conflit sans se battre (`ci-cp-route`, `ci-cp-reglement`, `ci-cp-responsabilites`,
 * `ci-cp-genre`, `ci-cp-paix`).
 *
 * Sur l'échantillon de CP, le modèle écrivait des exercices à refaire dans près d'un cas sur trois : « Les garçons jouent et
 * les filles aident » (un stéréotype présenté comme la réponse), « Faire la vaisselle » rangé chez les filles, « Associe les
 * droits des enfants » avec des paires que rien ne relie (« droit d'aller à l'école » et « droit de jouer »), « Mets dans
 * l'ordre : 1. Regarde. 2. Traverse. 3. Attends. » avec des numéros qui contredisent l'ordre, un feu rouge pour dire le passage
 * piéton, un émoji de 2020 que les appareils anciens montrent en carré, des réponses libres où plusieurs mots allaient.
 * Ici chaque geste est écrit une fois, avec sa situation, et c'est lui qu'on retrouve dans tous les types d'exercice.
 *
 * LA MAISON DES GESTES. Une SCÈNE est une situation de la vie d'un enfant (« Tu veux traverser la route. »), avec LE geste
 * qui convient (« Je regarde à gauche et à droite avant de traverser. ») et trois gestes qui ne conviennent pas. Tout vient
 * de là :
 * - le QCM pose la scène et propose le bon geste parmi deux mauvais ;
 * - la case « À faire » reçoit les bons gestes de plusieurs scènes, la case « À éviter » leurs mauvais gestes ;
 * - l'intrus en prend deux d'un côté et un de l'autre ;
 * - l'association relie l'étiquette de la scène à son bon geste.
 * Les gestes sont donc COMPRIS HORS DE LEUR SCÈNE : « Je m'arrête au panneau STOP » est bon partout, « Seules les filles
 * balaient la cour » est mauvais partout. Jamais « Je l'aide » (qui ?) ni « Je regarde » (quoi ?).
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Route : le stop, le passage pour piétons, le sens interdit, la ceinture, le casque à moto, monter et descendre d'un car.
 * - Règlement : les règles de vie, les droits et les devoirs de l'élève, réparer une faute.
 * - Responsabilités : chef de classe, responsable de la propreté, du matériel, du lever des couleurs. La fiche ne dit pas ce
 *   que chaque responsable fait : ce fichier lui donne la tâche la plus simple (balayer, ranger, aider à lever le drapeau).
 * - Genre : filles et garçons ont les mêmes droits à l'école, au jeu et à la maison ; ils partagent les tâches. AUCUN geste
 *   n'est rangé « chez les filles » ou « chez les garçons » : tout se partage.
 * - Paix : parler au lieu de frapper, demander l'aide d'un adulte, se réconcilier, ne pas se moquer.
 *
 * RÈGLES POUR AJOUTER UNE SCÈNE
 * - Le bon geste est le seul qui convienne. La situation ne le dit jamais, et aucun mauvais geste n'est « presque bien » :
 *   un geste que le règlement, le code de la route ou le respect des autres interdit, sans rien d'ambigu.
 * - Les gestes de toute la table sont tous différents (un geste servi deux fois se confondrait). Un geste est une phrase
 *   entière, jamais « article + un nom ».
 * - Le `group` rassemble les scènes dont les bons gestes se ressembleraient (deux façons de faire place à un autre enfant) :
 *   elles ne sont jamais reliées dans le même exercice.
 * - Aucun indice n'écrit un mot de quatre lettres ou plus du bon geste.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus (la consigne du CP). Aucun
 *   émoji : les appareils anciens montrent les plus récents en carré.
 *
 * LES ORDRES ne sont posés que sur des suites qui n'ont qu'un ordre : s'arrêter, regarder, traverser ; prendre le balai,
 * balayer, le ranger ; une dispute, le calme, la réconciliation.
 * LES TROUS ne proposent que des mots qui ne vont pas dans la phrase.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";

export type CivicTopic = "route" | "reglement" | "responsabilites" | "genre" | "paix";

/** Les cinq thématiques. La clé `vocabulary` d'un jeu est l'une d'elles ; sans elle, toutes les scènes servent. */
export const CIVIC_TOPICS: readonly CivicTopic[] = ["route", "reglement", "responsabilites", "genre", "paix"];

type Scene = {
  topic: CivicTopic;
  /** Les scènes d'un même groupe ont des bons gestes qui se ressemblent : jamais reliées dans le même exercice. */
  group: string;
  /** La situation, dite à l'enfant : elle ne dit pas ce qu'il faut faire. */
  text: string;
  /** La même situation en étiquette, pour l'association. */
  label: string;
  /** Le seul geste qui convienne. */
  right: string;
  /** Trois gestes à éviter, mauvais même hors de la scène. */
  wrong: readonly [string, string, string];
  /** Pourquoi, en une phrase qui n'écrit aucun mot du bon geste. */
  hint: string;
};

export const SCENES: readonly Scene[] = [
  // ===== La sécurité sur la route =====
  {
    topic: "route",
    group: "traverser",
    text: "Tu veux traverser la route.",
    label: "Tu veux traverser la route",
    right: "Je regarde à gauche et à droite avant de traverser.",
    wrong: ["Je traverse en courant sans regarder.", "Je traverse la route en jouant au ballon.", "Je traverse les yeux fermés."],
    hint: "Une route peut cacher des voitures qui arrivent vite.",
  },
  {
    topic: "route",
    group: "traverser",
    text: "Il y a un passage pour piétons devant toi.",
    label: "Un passage pour piétons est devant toi",
    right: "Je traverse sur le passage pour piétons.",
    wrong: ["Je traverse loin du passage, entre les voitures.", "Je marche au milieu de la route.", "Je joue au ballon au milieu de la route."],
    hint: "Des bandes blanches protègent ceux qui marchent.",
  },
  {
    topic: "route",
    group: "stop",
    text: "Ton père conduit. Il voit le panneau STOP.",
    label: "Papa voit le panneau STOP",
    // Chaque geste nomme son sujet : glissé seul dans une case, « Il roule plus vite » n'avait pas de sujet.
    right: "Papa s'arrête au panneau STOP.",
    wrong: ["Papa roule plus vite au panneau STOP.", "Papa klaxonne et passe sans s'arrêter.", "Papa ferme les yeux et continue."],
    hint: "Le rouge dit de ne plus avancer.",
  },
  {
    topic: "route",
    group: "interdit",
    text: "Ton oncle conduit. Il voit le panneau sens interdit.",
    label: "Oncle voit un sens interdit",
    right: "Mon oncle n'entre pas dans la rue.",
    wrong: ["Mon oncle entre dans la rue en sens interdit.", "Mon oncle entre en sens interdit en klaxonnant.", "Mon oncle fonce en sens interdit à toute vitesse."],
    hint: "Une barre blanche sur un rond rouge ferme le passage.",
  },
  {
    topic: "route",
    group: "voiture",
    text: "Tu montes dans la voiture de ta tante.",
    label: "Tu montes en voiture",
    right: "J'attache ma ceinture de sécurité.",
    wrong: ["Je laisse ma ceinture détachée.", "Je me mets debout sur le siège.", "Je penche la tête dehors par la fenêtre."],
    hint: "Une sangle te retient si la voiture freine fort.",
  },
  {
    topic: "route",
    group: "moto",
    text: "Ton grand frère va t'emmener à moto.",
    label: "Tu montes sur une moto",
    right: "Je mets un casque sur ma tête.",
    wrong: ["Je monte sans casque.", "Je monte à moto avec un chapeau de paille.", "Je monte à moto avec mon cartable sur la tête."],
    hint: "Une coque dure protège le crâne en cas de chute.",
  },
  {
    topic: "route",
    group: "car",
    text: "Le car de l'école arrive devant toi.",
    label: "Le car arrive",
    right: "J'attends que le car soit arrêté pour monter.",
    wrong: ["Je cours vers le car qui roule.", "Je monte avant que le car s'arrête.", "Je pousse les autres pour monter."],
    hint: "Un véhicule qui roule est dangereux à toucher.",
  },
  {
    topic: "route",
    group: "car",
    text: "Le car est arrêté et tu dois descendre.",
    label: "Tu descends du car",
    right: "Je descends doucement et je regarde la route.",
    wrong: ["Je saute du car en courant.", "Je descends sans regarder la route.", "Je pousse mes camarades pour descendre."],
    hint: "Des voitures peuvent passer près de la porte.",
  },
  {
    topic: "route",
    group: "marcher",
    text: "Tu marches au bord de la route.",
    label: "Tu marches au bord de la route",
    right: "Je marche sur le côté, loin des voitures.",
    wrong: ["Je marche au milieu de la chaussée.", "Je joue au ballon sur la route.", "Je marche en dansant devant les voitures."],
    hint: "Les véhicules passent au centre.",
  },
  // ===== Le règlement de la classe =====
  {
    topic: "reglement",
    group: "ecoute",
    text: "Le maître parle à la classe.",
    label: "Le maître parle",
    right: "J'écoute le maître en silence.",
    wrong: ["Je parle fort avec mon voisin.", "Je chante pendant que le maître parle.", "Je me lève et je cours dans la classe."],
    hint: "Pour comprendre, il faut que nos oreilles soient libres.",
  },
  {
    topic: "reglement",
    group: "parole",
    text: "Tu veux répondre à une question.",
    label: "Tu veux répondre",
    right: "Je lève la main et j'attends mon tour.",
    wrong: ["Je crie la réponse sans attendre.", "Je me lève et je parle sans permission.", "Je prends la parole de mon voisin."],
    hint: "Beaucoup d'enfants veulent parler en même temps.",
  },
  {
    topic: "reglement",
    group: "bonjour",
    text: "Tu arrives en classe le matin.",
    label: "Tu arrives en classe",
    right: "Je dis bonjour à mon maître et à mes camarades.",
    wrong: ["Je claque la porte en criant.", "Je jette mon cartable par terre.", "Je tire la langue à mon maître."],
    hint: "Un mot gentil fait plaisir aux autres.",
  },
  {
    topic: "reglement",
    group: "faute",
    text: "Tu as cassé le crayon d'un camarade.",
    label: "Tu as cassé un crayon",
    right: "Je lui dis pardon et je répare ma faute.",
    wrong: ["Je cache le crayon cassé.", "Je dis que c'est sa faute.", "Je me moque de lui."],
    hint: "Quand on abîme une chose, on pense à celui qui s'en servait.",
  },
  {
    topic: "reglement",
    group: "calme",
    text: "Tu as fini ton travail avant les autres.",
    label: "Tu as fini avant les autres",
    right: "Je reste calme sans déranger les autres.",
    wrong: ["Je dérange mes voisins pour jouer.", "Je déchire mes feuilles.", "Je crie que j'ai fini."],
    hint: "Tes camarades cherchent encore leurs réponses.",
  },
  {
    topic: "reglement",
    group: "propre",
    text: "Il y a des papiers par terre dans la classe.",
    label: "Des papiers sont par terre",
    right: "Je mets les papiers à la poubelle.",
    wrong: ["Je jette encore plus de papiers par terre.", "Je cache les papiers sous la table.", "Je laisse les papiers par terre."],
    hint: "Une classe agréable est une classe sans saleté.",
  },
  {
    topic: "reglement",
    group: "demander",
    text: "Tu veux le livre de ton voisin.",
    label: "Tu veux le livre de ton voisin",
    right: "Je lui demande le livre poliment.",
    wrong: ["Je prends son livre sans rien dire.", "Je tire son livre très fort.", "Je cache son livre dans mon sac."],
    hint: "Les choses des autres ne sont pas à nous.",
  },
  {
    topic: "reglement",
    group: "rang",
    text: "La cloche sonne à la fin de la récréation.",
    label: "La cloche sonne",
    right: "Je me mets en rang pour rentrer.",
    wrong: ["Je continue de jouer dans la cour.", "Je me cache pour ne pas rentrer.", "Je cours dans les couloirs."],
    hint: "Il faut arriver tous ensemble et sans bruit.",
  },
  // ===== Mes responsabilités en classe =====
  {
    topic: "responsabilites",
    group: "balayer",
    text: "Tu es responsable de la propreté. La classe est sale.",
    label: "La classe est sale",
    right: "Je balaie la classe.",
    wrong: ["Je jette des papiers par terre.", "Je pars jouer dehors.", "Je renverse la poubelle."],
    hint: "Un balai sert à nettoyer le sol.",
  },
  {
    topic: "responsabilites",
    group: "ranger",
    text: "Tu es responsable du matériel. Les livres sont par terre.",
    label: "Les livres sont par terre",
    right: "Je range les livres sur l'étagère.",
    wrong: ["Je déchire les livres.", "Je lance les livres sur mes amis.", "Je cache les livres sous la table."],
    hint: "Un objet soigné dure longtemps.",
  },
  {
    topic: "responsabilites",
    group: "calme",
    text: "Tu es chef de classe. Le maître sort un moment.",
    label: "Le maître sort",
    right: "Je demande le calme à mes camarades.",
    wrong: ["Je crie plus fort que les autres.", "Je saute sur les tables.", "Je quitte la classe sans permission."],
    hint: "Un chef donne l'exemple aux autres.",
  },
  {
    topic: "responsabilites",
    group: "drapeau",
    text: "C'est lundi matin. Il faut lever le drapeau.",
    label: "Il faut lever le drapeau",
    right: "J'aide à lever le drapeau avec respect.",
    wrong: ["Je joue avec le drapeau.", "Je rigole pendant le lever du drapeau.", "Je jette le drapeau par terre."],
    hint: "C'est le signe de notre pays.",
  },
  {
    topic: "responsabilites",
    group: "balayer",
    text: "Tu es responsable de la propreté. Il y a une peau de banane dans la cour.",
    label: "Une peau de banane est dans la cour",
    right: "Je mets la peau de banane à la poubelle.",
    wrong: ["Je jette la peau de banane sous la table.", "Je laisse la peau de banane par terre.", "Je lance la peau de banane sur un camarade."],
    hint: "Une cour propre protège tout le monde.",
  },
  {
    topic: "responsabilites",
    group: "ranger",
    text: "Tu es responsable du matériel. Il manque des crayons.",
    label: "Il manque des crayons",
    right: "Je compte les crayons et je préviens le maître.",
    wrong: ["Je cache la boîte de crayons.", "Je jette la boîte de crayons.", "Je prends tous les crayons pour moi."],
    hint: "Un adulte peut aider à les retrouver.",
  },
  {
    topic: "responsabilites",
    group: "calme",
    text: "Ton camarade chef de classe te demande de te taire.",
    label: "Le chef de classe te demande le silence",
    right: "Je l'écoute et je me tais.",
    wrong: ["Je me moque de ce chef.", "Je crie encore plus fort.", "Je lui jette mon cahier."],
    hint: "Le chef aide la classe à bien travailler.",
  },
  {
    topic: "responsabilites",
    group: "tableau",
    text: "Tu es de service pour le tableau. Il est plein d'écriture.",
    label: "Le tableau est plein d'écriture",
    right: "J'efface le tableau avec l'éponge.",
    wrong: ["Je laisse le tableau sale.", "Je casse la craie en deux.", "Je jette la craie par la fenêtre."],
    hint: "Le prochain cours aura besoin d'une place propre.",
  },
  // ===== Filles et garçons, tous égaux =====
  {
    topic: "genre",
    group: "inviter",
    text: "Une fille veut jouer au foot avec les garçons.",
    label: "Une fille veut jouer au foot",
    right: "Je l'invite à jouer avec nous.",
    wrong: ["Je lui dis que le foot est seulement pour les garçons.", "Je cache le ballon pour qu'elle ne joue pas.", "Je me moque d'elle."],
    hint: "Un jeu est ouvert à tous les enfants.",
  },
  {
    topic: "genre",
    group: "inviter",
    text: "Un garçon veut sauter à la corde avec les filles.",
    label: "Un garçon veut sauter à la corde",
    right: "Je lui fais une place dans le jeu.",
    wrong: ["Je lui dis que la corde est seulement pour les filles.", "Je me moque de ce garçon.", "Je lui prends la corde."],
    hint: "On peut aimer le même jeu, que l'on soit fille ou garçon.",
  },
  {
    topic: "genre",
    group: "parole",
    text: "Une fille lève la main pour répondre en classe.",
    label: "Une fille répond en classe",
    right: "Je l'écoute comme les autres.",
    wrong: ["Je dis que les filles se trompent toujours.", "Je parle plus fort qu'elle pour l'empêcher.", "Je ris de sa réponse."],
    hint: "Chaque élève a le droit de donner son avis.",
  },
  {
    topic: "genre",
    group: "maison",
    text: "À la maison, il faut balayer la cour.",
    label: "Il faut balayer la cour",
    right: "Mon frère et ma sœur balaient la cour ensemble.",
    wrong: ["Seules les filles balaient la cour.", "Seuls les garçons balaient la cour.", "Personne ne balaie la cour."],
    hint: "Les tâches de la maison se partagent entre tous.",
  },
  {
    topic: "genre",
    group: "chef",
    text: "Le maître cherche un chef de classe.",
    label: "Le maître cherche un chef",
    right: "Une fille ou un garçon peut être chef de classe.",
    wrong: ["Seul un garçon peut être chef de classe.", "Seule une fille peut être chef de classe.", "Seul le plus grand peut être chef de classe."],
    hint: "Le sérieux et la justesse comptent le plus.",
  },
  {
    topic: "genre",
    group: "maison",
    text: "Il faut mettre la table pour le repas.",
    label: "Il faut mettre la table pour le repas",
    right: "Mon frère et ma sœur mettent la table ensemble.",
    wrong: ["Seule ma sœur met la table.", "Seul mon frère met la table.", "Personne n'aide à mettre la table."],
    hint: "Un repas en famille se prépare à plusieurs.",
  },
  {
    topic: "genre",
    group: "partage",
    text: "Une fille et un garçon veulent le même livre.",
    label: "Une fille et un garçon veulent le même livre",
    right: "La fille et le garçon lisent le livre ensemble.",
    wrong: ["Le garçon prend le livre parce qu'il est un garçon.", "La fille prend le livre parce qu'elle est une fille.", "La fille et le garçon se battent pour le livre."],
    hint: "Une histoire peut se lire à deux.",
  },
  {
    topic: "genre",
    group: "consoler",
    text: "Un garçon pleure parce qu'il est tombé.",
    label: "Un garçon pleure",
    right: "Je le console comme n'importe quel enfant.",
    wrong: ["Je lui dis que les garçons ne pleurent jamais.", "Je ris de lui devant tout le monde.", "Je lui dis de partir et de pleurer ailleurs."],
    hint: "Tous les enfants ont du chagrin parfois.",
  },
  // ===== Régler un conflit sans se battre =====
  {
    topic: "paix",
    group: "parole",
    text: "Un camarade te pousse sans le faire exprès.",
    label: "Un camarade te pousse",
    right: "Je lui dis calmement que ça m'a fait mal.",
    wrong: ["Je le pousse très fort.", "Je lui donne un coup de poing.", "Je lui crie des gros mots."],
    hint: "Les mots calmes arrêtent beaucoup de disputes.",
  },
  {
    topic: "paix",
    group: "partage",
    text: "Deux enfants veulent le même ballon.",
    label: "Deux enfants veulent le même ballon",
    right: "Je propose de jouer chacun à notre tour.",
    wrong: ["Je prends le ballon de force.", "Je frappe mon camarade.", "Je cache le ballon."],
    hint: "Un jeu à deux est plus drôle quand on partage.",
  },
  {
    topic: "paix",
    group: "adulte",
    text: "La dispute continue et tu ne sais plus quoi faire.",
    label: "La dispute continue",
    right: "Je demande l'aide d'un adulte.",
    wrong: ["Je continue à me battre.", "Je casse le cahier de mon camarade.", "Je continue la dispute en criant."],
    hint: "Quelqu'un de plus grand peut nous aider.",
  },
  {
    topic: "paix",
    group: "moquerie",
    text: "Un camarade porte de vieilles chaussures.",
    label: "Un camarade a de vieilles chaussures",
    right: "Je ne me moque pas de lui.",
    wrong: ["Je me moque de ses chaussures.", "Je dis aux autres de rire de lui.", "Je cache ses chaussures."],
    hint: "Chacun fait comme il peut, sans être jugé.",
  },
  {
    topic: "paix",
    group: "pardon",
    text: "Tu t'es disputé avec ton ami hier.",
    label: "Tu t'es disputé avec ton ami",
    right: "Je vais lui dire que je suis désolé.",
    wrong: ["Je ne lui parle plus jamais.", "Je le frappe pour me venger.", "Je dis du mal de lui."],
    hint: "Un mot sincère peut ranimer l'amitié.",
  },
  {
    topic: "paix",
    group: "parole",
    text: "Un camarade t'a insulté.",
    label: "Un camarade t'a insulté",
    right: "Je demande à mon camarade de ne plus m'insulter.",
    wrong: ["Je réponds en insultant mon camarade.", "Je tape sur mon camarade pour le punir.", "Je dis à tous que c'est un méchant."],
    hint: "Se défendre avec des mots vaut mieux que se défendre avec les poings.",
  },
  {
    topic: "paix",
    group: "adulte",
    text: "Deux enfants se battent dans la cour.",
    label: "Deux enfants se battent",
    right: "Je préviens un adulte tout de suite.",
    wrong: ["Je crie pour encourager la bagarre.", "Je prends un bâton pour les séparer.", "Je regarde en riant."],
    hint: "Les grands savent séparer sans danger.",
  },
  {
    topic: "paix",
    group: "reconcilier",
    text: "Ton ami est triste après une dispute.",
    label: "Ton ami est triste",
    right: "Je lui dis des mots gentils et je me réconcilie.",
    wrong: ["Je lui tourne le dos en riant.", "Je me moque de sa tristesse.", "Je lui dis que je ne suis plus son ami."],
    hint: "Un geste doux efface la peine.",
  },
];

/** Une suite de gestes qui n'a qu'un seul ordre. */
type Sequence = { topic: CivicTopic; prompt: string; steps: readonly string[] };

export const SEQUENCES: readonly Sequence[] = [
  {
    topic: "route",
    prompt: "Mets ces gestes dans le bon ordre pour traverser la route.",
    steps: ["Je m'arrête au bord de la route.", "Je regarde à gauche et à droite.", "Je traverse quand la route est libre."],
  },
  {
    topic: "route",
    prompt: "Mets ces gestes dans le bon ordre pour monter dans la voiture.",
    steps: ["Je monte dans la voiture.", "Je m'assois sur le siège.", "J'attache ma ceinture."],
  },
  {
    topic: "route",
    prompt: "Mets ces gestes dans le bon ordre pour monter dans le car.",
    steps: ["J'attends que le car s'arrête.", "Je monte doucement.", "Je m'assois à ma place."],
  },
  {
    topic: "reglement",
    prompt: "Mets ces gestes dans le bon ordre pour répondre à une question.",
    steps: ["Je lève la main.", "Le maître me donne la parole.", "Je donne ma réponse."],
  },
  {
    topic: "reglement",
    prompt: "Mets ces gestes dans le bon ordre pour entrer en classe.",
    steps: ["La cloche sonne.", "Je me mets en rang.", "J'entre en classe."],
  },
  {
    topic: "reglement",
    prompt: "Mets ces gestes dans le bon ordre pour saluer le maître.",
    steps: ["Le maître entre dans la classe.", "Je me lève et je dis bonjour.", "Je m'assois quand le maître le dit."],
  },
  {
    topic: "responsabilites",
    prompt: "Mets ces gestes dans le bon ordre pour balayer la classe.",
    steps: ["Je prends le balai.", "Je balaie la classe.", "Je range le balai."],
  },
  {
    topic: "responsabilites",
    prompt: "Mets ces gestes dans le bon ordre pour effacer le tableau.",
    steps: ["Je prends l'éponge.", "J'efface le tableau.", "Je repose l'éponge."],
  },
  {
    topic: "responsabilites",
    prompt: "Mets ces gestes dans le bon ordre pour distribuer les crayons.",
    steps: ["Je prends la boîte de crayons.", "Je donne un crayon à chaque élève.", "Je range la boîte."],
  },
  {
    topic: "genre",
    prompt: "Mets ces gestes dans le bon ordre pour jouer ensemble.",
    steps: ["Je propose un jeu à mes camarades.", "Mes camarades acceptent.", "Nous jouons tous ensemble."],
  },
  {
    topic: "genre",
    prompt: "Mets ces gestes dans le bon ordre pour partager le travail.",
    steps: ["Nous choisissons les tâches.", "Chacun fait sa part.", "Nous finissons ensemble."],
  },
  {
    topic: "genre",
    prompt: "Mets ces gestes dans le bon ordre pour le repas en famille.",
    steps: ["Ma sœur et moi préparons le repas.", "Nous mangeons en famille.", "Ma sœur et moi lavons la vaisselle."],
  },
  {
    topic: "paix",
    prompt: "Mets ces gestes dans le bon ordre pour se réconcilier.",
    steps: ["Nous nous disputons.", "Nous nous calmons.", "Nous nous réconcilions."],
  },
  {
    topic: "paix",
    prompt: "Mets ces gestes dans le bon ordre quand tu es en colère.",
    steps: ["Je suis en colère.", "Je respire doucement.", "Je parle sans crier."],
  },
  {
    topic: "paix",
    prompt: "Mets ces gestes dans le bon ordre pour demander de l'aide.",
    steps: ["Je vois un conflit.", "Je cherche un adulte.", "Je lui explique ce qui se passe."],
  },
];

/** Une phrase à trou : le mot juste, et deux mots qui ne vont pas. */
type Gap = { topic: CivicTopic; text: string; answer: string; wrong: readonly [string, string]; hint: string };

export const GAPS: readonly Gap[] = [
  { topic: "route", text: "Au panneau STOP, la voiture ___.", answer: "s'arrête", wrong: ["accélère", "chante"], hint: "Le rouge dit de ne plus avancer." },
  { topic: "route", text: "Dans la voiture, j'attache ma ___ de sécurité.", answer: "ceinture", wrong: ["chaussure", "casquette"], hint: "Une sangle te retient en cas de freinage." },
  { topic: "route", text: "À moto, je mets un ___ sur la tête.", answer: "casque", wrong: ["ballon", "seau"], hint: "Une coque dure protège le crâne." },
  { topic: "route", text: "Je traverse sur le passage pour ___.", answer: "piétons", wrong: ["voitures", "camions"], hint: "Ce sont ceux qui marchent." },
  { topic: "route", text: "Au passage pour piétons, je regarde avant de ___.", answer: "traverser", wrong: ["manger", "dormir"], hint: "On passe de l'autre côté." },
  { topic: "reglement", text: "En classe, je lève la ___ pour parler.", answer: "main", wrong: ["jambe", "chaise"], hint: "On la montre pour demander la parole." },
  { topic: "reglement", text: "Quand le maître parle, je fais ___.", answer: "silence", wrong: ["du bruit", "la course"], hint: "Pour entendre, on se tait." },
  { topic: "reglement", text: "Je range mes affaires dans mon ___.", answer: "cartable", wrong: ["ballon", "seau"], hint: "Il se porte sur le dos pour aller à l'école." },
  { topic: "reglement", text: "À la récréation, je ___ avec mes amis.", answer: "joue", wrong: ["dors", "me bats"], hint: "C'est le moment de se détendre." },
  { topic: "reglement", text: "Quand j'ai fait une faute, je dis ___.", answer: "pardon", wrong: ["bonjour", "au revoir"], hint: "On regrette ce qu'on a fait." },
  { topic: "responsabilites", text: "Le ___ de classe aide le maître à garder le calme.", answer: "chef", wrong: ["chat", "pain"], hint: "Il est choisi pour aider." },
  { topic: "responsabilites", text: "Le responsable de la propreté ___ la classe.", answer: "balaie", wrong: ["salit", "casse"], hint: "Il utilise un balai." },
  { topic: "responsabilites", text: "Le responsable du matériel range les ___.", answer: "crayons", wrong: ["nuages", "oiseaux"], hint: "On s'en sert pour écrire." },
  { topic: "responsabilites", text: "Le lundi matin, on lève le ___.", answer: "drapeau", wrong: ["gâteau", "cartable"], hint: "Il flotte en haut d'un mât." },
  { topic: "genre", text: "À l'école, les filles et les ___ ont les mêmes droits.", answer: "garçons", wrong: ["chiens", "arbres"], hint: "Ce sont les autres enfants de la classe." },
  { topic: "genre", text: "Filles et garçons peuvent tous ___ au foot.", answer: "jouer", wrong: ["manger", "dormir"], hint: "C'est un jeu de ballon." },
  { topic: "genre", text: "Dans une famille, ___ peuvent aider à la maison.", answer: "tous les enfants", wrong: ["seulement les filles", "seulement les garçons"], hint: "Personne n'est laissé de côté." },
  { topic: "genre", text: "Un garçon peut ___ quand il a du chagrin.", answer: "pleurer", wrong: ["aboyer", "briller"], hint: "Les larmes soulagent la peine." },
  { topic: "genre", text: "Une fille peut être ___ de classe.", answer: "chef", wrong: ["chat", "pain"], hint: "C'est celle qui est choisie pour aider." },
  { topic: "paix", text: "Quand je suis en colère, je ___ au lieu de frapper.", answer: "parle", wrong: ["pousse", "tape"], hint: "Les mots calment la colère." },
  { topic: "paix", text: "Après une dispute, on se ___.", answer: "réconcilie", wrong: ["bat", "moque"], hint: "On redevient amis." },
  { topic: "paix", text: "Je ne me ___ pas de mon camarade.", answer: "moque", wrong: ["lave", "couche"], hint: "Rire de quelqu'un fait de la peine." },
  { topic: "paix", text: "Si la dispute continue, je demande l'aide d'un ___.", answer: "adulte", wrong: ["chat", "ballon"], hint: "Une personne plus grande que toi." },
  { topic: "paix", text: "Pour régler un conflit, on ___ au lieu de se battre.", answer: "discute", wrong: ["crie", "frappe"], hint: "On échange des mots calmement." },
];

// ===========================================================================
// LES CHOIX DE SCÈNES
// ===========================================================================

const isTopic = (value: string | undefined): value is CivicTopic => CIVIC_TOPICS.includes(value as CivicTopic);

/** Les scènes de la thématique du jeu (sans `vocabulary`, toutes). */
const scenesOf = (ctx: GameContext): readonly Scene[] => (isTopic(ctx.vocabulary) ? SCENES.filter((scene) => scene.topic === ctx.vocabulary) : SCENES);

/** Des scènes toutes différentes : les `n` premières d'un mélange. */
const someScenes = (ctx: GameContext, n: number) => shuffle(ctx.rng, scenesOf(ctx)).slice(0, n);

const ASK = ["Lis bien la situation.", "Choisis le geste qui protège les gens."] as const;

/** « Tu veux traverser la route. Que faut-il faire ? » : le bon geste parmi deux mauvais. */
export function makeSceneChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "geste-situation", "le bon geste dans une situation", () => {
    const scene = pickFresh(ctx, scenesOf(ctx), (candidate) => `geste-situation:${candidate.text}`);
    return {
      prompt: `${scene.text} Que faut-il faire ?`,
      answer: scene.right,
      // Les deux mauvais gestes de longueur la plus proche : un bon geste deux fois plus long que les autres se devine.
      wrong: [...scene.wrong].sort((a, b) => Math.abs(a.length - scene.right.length) - Math.abs(b.length - scene.right.length)).slice(0, 2),
      hints: [ASK[0], scene.hint, ASK[1]],
    };
  });
}

/** « Glisse chaque geste dans la bonne case. » : les bons gestes de plusieurs scènes, leurs mauvais gestes. */
export function makeActSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "geste-glisser", "ranger les gestes à faire et à éviter", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const scenes = someScenes(ctx, each * 2);
    const good = scenes.slice(0, each).map((scene) => ({ text: scene.right, zone: "À faire" }));
    const bad = scenes.slice(each).map((scene) => ({ text: shuffle(ctx.rng, scene.wrong)[0], zone: "À éviter" }));
    return {
      prompt: "Glisse chaque geste dans la bonne case.",
      zones: ["À faire", "À éviter"],
      items: [...good, ...bad],
      hints: ["Lis les gestes un par un.", "Un geste qui protège ou respecte appartient à « À faire ».", "Un geste qui blesse ou gêne appartient à « À éviter »."],
    };
  });
}

/**
 * Deux gestes de longueur voisine de `target`, tirés parmi les quatre plus proches : une bonne réponse qui fait le double des
 * autres se devine à sa longueur (le contrôleur le signale).
 */
const alike = (ctx: GameContext, target: string, pool: readonly string[]): string[] =>
  shuffle(
    ctx.rng,
    [...pool].sort((a, b) => Math.abs(a.length - target.length) - Math.abs(b.length - target.length)).slice(0, 4),
  ).slice(0, 2);

/** « Quel geste est bien ? » ou « …n'est pas bien ? » : un geste d'un côté, deux de l'autre, de trois scènes différentes. */
export function makeActOdd(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "geste-intrus", "reconnaître un bon ou un mauvais geste", () => {
    const [first, ...others] = shuffle(ctx.rng, scenesOf(ctx));
    const wantGood = ctx.rng() < 0.5;
    const wrongOf = (scene: Scene) => shuffle(ctx.rng, scene.wrong)[0];
    if (wantGood) {
      return {
        prompt: "Quel geste est bien ?",
        answer: first.right,
        wrong: alike(ctx, first.right, others.map(wrongOf)),
        hints: [ASK[0], "Un bon geste évite la douleur et la peur.", "Les gestes fautifs blessent ou gênent."],
      };
    }
    const answer = wrongOf(first);
    return {
      prompt: "Quel geste n'est pas bien ?",
      answer,
      wrong: alike(
        ctx,
        answer,
        others.map((scene) => scene.right),
      ),
      hints: [ASK[0], "Les gestes corrects protègent ou respectent.", "Le geste fautif blesse ou gêne."],
    };
  });
}

/** « Relie chaque situation au bon geste. » : trois ou quatre scènes de groupes différents. */
export function makeSceneLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "geste-relier", "relier une situation et le bon geste", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: Scene[] = [];
    for (const scene of shuffle(ctx.rng, scenesOf(ctx))) {
      if (chosen.every((other) => other.group !== scene.group)) chosen.push(scene);
      if (chosen.length === wanted) break;
    }
    return {
      prompt: "Relie chaque situation au bon geste.",
      pairs: chosen.map((scene) => ({ left: scene.label, right: scene.right })),
      hints: ["Lis une situation, puis un geste.", "Trouve le geste qui protège.", "Commence par celle dont tu es certain."],
    };
  });
}

/** « Mets ces gestes dans le bon ordre pour traverser la route. » : une suite qui n'a qu'un ordre. */
export function makeSequence(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "geste-ordre", "remettre des gestes dans l'ordre", () => {
    const pool = isTopic(ctx.vocabulary) ? SEQUENCES.filter((sequence) => sequence.topic === ctx.vocabulary) : SEQUENCES;
    const sequence = pickFresh(ctx, pool, (candidate) => `geste-ordre:${candidate.prompt}`);
    return {
      prompt: sequence.prompt,
      sequence: sequence.steps,
      hints: ["Pense d'abord au début de la scène.", "Un geste en entraîne un autre.", "Imagine la scène en lisant les gestes."],
    };
  });
}

/** « Au panneau STOP, la voiture ___. » : un seul mot va dans la phrase. */
export function makeRuleGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "geste-trou", "compléter une règle de vie", () => {
    const pool = isTopic(ctx.vocabulary) ? GAPS.filter((gap) => gap.topic === ctx.vocabulary) : GAPS;
    const gap = pickFresh(ctx, pool, (candidate) => `geste-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase avec le bon mot.",
      text: gap.text,
      answer: gap.answer,
      wrong: gap.wrong,
      hints: ["Lis la phrase en entier.", gap.hint, `Le mot commence par la lettre ${firstLetter(gap.answer)}.`],
    };
  });
}

// ===========================================================================
// LES DROITS ET LES DEVOIRS (ci-cp-reglement)
// ===========================================================================

/** Un droit : ce que l'élève PEUT faire. Un devoir : ce qu'il DOIT faire. Chaque phrase le dit avec « peux » ou « dois ». */
const RIGHTS: readonly string[] = [
  "Je peux jouer à la récréation.",
  "Je peux poser une question au maître.",
  "Je peux être écouté quand je parle.",
  "Je peux être protégé à l'école.",
];
const DUTIES: readonly string[] = ["Je dois écouter le maître.", "Je dois respecter mes camarades.", "Je dois ranger mes affaires.", "Je dois arriver à l'heure."];

/** « Glisse chaque phrase dans la bonne case. » : « Droits » ou « Devoirs ». */
export function makeRightsSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "droit-devoir", "droits et devoirs de l'élève", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque phrase dans la bonne case.",
      zones: ["Droits", "Devoirs"],
      items: [
        ...shuffle(ctx.rng, RIGHTS)
          .slice(0, each)
          .map((text) => ({ text, zone: "Droits" })),
        ...shuffle(ctx.rng, DUTIES)
          .slice(0, each)
          .map((text) => ({ text, zone: "Devoirs" })),
      ],
      hints: ["Lis les phrases une par une.", "Un droit est une chose permise à tout enfant.", "Un devoir est une chose que tout enfant doit tenir."],
    };
  });
}

// ===========================================================================
// LES RESPONSABLES (ci-cp-responsabilites)
// ===========================================================================

/**
 * Les quatre responsables de la fiche. `role` est le nom entier (le QCM le propose en pleine largeur), `label` le même en
 * deux ou trois mots (une étiquette d'association que l'écran coupe en syllabes quand elle est longue), `task` sa seule tâche,
 * et `question` celle qui la décrit.
 */
export const ROLES: readonly { role: string; label: string; task: string; question: string }[] = [
  { role: "le chef de classe", label: "chef de classe", task: "garde le calme", question: "Qui garde le calme dans la classe ?" },
  { role: "le responsable de la propreté", label: "propreté", task: "balaie la classe", question: "Qui balaie la classe ?" },
  { role: "le responsable du matériel", label: "matériel", task: "range les crayons", question: "Qui range les crayons ?" },
  { role: "le responsable du lever des couleurs", label: "lever des couleurs", task: "lève le drapeau", question: "Qui lève le drapeau ?" },
];

/** « Qui balaie la classe et ramasse les papiers ? » : le responsable, parmi trois. */
export function makeRoleChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "role-qui", "qui fait quoi dans la classe", () => {
    const [entry, ...others] = shuffle(ctx.rng, ROLES);
    return {
      prompt: entry.question,
      answer: entry.role,
      wrong: others.map((other) => other.role),
      hints: ["Lis la question en entier.", "Chaque rôle a une seule tâche.", "Pense au travail de chaque élève."],
    };
  });
}

/** « Relie chaque responsable à sa tâche. » : trois ou quatre paires. */
export function makeRoleLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "role-relier", "relier un responsable et sa tâche", () => {
    const count = ctx.level >= 3 ? 4 : 3;
    return {
      prompt: "Relie chaque responsable à sa tâche.",
      pairs: shuffle(ctx.rng, ROLES)
        .slice(0, count)
        .map((entry) => ({ left: entry.label, right: entry.task })),
      hints: ["Lis les tâches une par une.", "Chaque rôle a une seule tâche.", "Commence par celle dont tu es certain."],
    };
  });
}

// ===========================================================================
// LES PANNEAUX ET LE MATÉRIEL DE SÉCURITÉ (ci-cp-route)
// ===========================================================================

/** Un mot à écrire : ce que la route demande de mettre, d'attacher ou de respecter. Un seul mot est juste, jamais écrit dans l'énoncé. */
export const ROAD_WORDS: readonly { prompt: string; word: string; hint: string }[] = [
  { prompt: "À moto, que dois-tu mettre sur la tête pour te protéger ? Écris le mot.", word: "casque", hint: "Une coque dure protège le crâne en cas de chute." },
  { prompt: "Dans une voiture, que dois-tu attacher pour te protéger ? Écris le mot.", word: "ceinture", hint: "Une sangle te retient si la voiture freine fort." },
  { prompt: "Quel panneau te dit de t'arrêter ? Écris le mot.", word: "stop", hint: "Ce mot anglais est écrit en blanc sur un fond rouge." },
];

/** « À moto, que dois-tu mettre sur la tête pour te protéger ? Écris le mot. » : un mot à écrire. */
export function makeRoadWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "route-ecrire", () => {
    const entry = pickFresh(ctx, ROAD_WORDS, (candidate) => `route-ecrire:${candidate.word}`);
    return {
      type: "short-answer",
      prompt: entry.prompt,
      payload: { acceptedAnswers: [entry.word], game: originOf("route-ecrire", ctx), concept: "écrire le mot de la sécurité routière" },
      answerKey: entry.word,
      hints: ["Pense à la route et à la sécurité.", entry.hint, `Le mot commence par la lettre ${firstLetter(entry.word)}.`],
    };
  });
}


/** Les trois panneaux de la fiche : ce qu'ils disent, et deux phrases qui ne les disent pas. */
export const PANELS: readonly { name: string; says: string; wrong: readonly [string, string] }[] = [
  { name: "STOP", says: "Il faut s'arrêter.", wrong: ["Il faut aller plus vite.", "Il faut jouer au ballon."] },
  { name: "sens interdit", says: "On ne peut pas entrer dans la rue.", wrong: ["On peut entrer très vite.", "On doit klaxonner fort."] },
  { name: "passage pour piétons", says: "Les piétons peuvent traverser ici.", wrong: ["Les piétons doivent courir loin d'ici.", "Les voitures doivent accélérer ici."] },
];

/** « Que veut dire le panneau STOP ? » : la phrase juste, parmi trois. */
export function makePanelChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "panneau-qcm", "ce que dit un panneau", () => {
    const panel = pickFresh(ctx, PANELS, (candidate) => `panneau-qcm:${candidate.name}`);
    return {
      prompt: `Que veut dire le panneau ${panel.name} ?`,
      answer: panel.says,
      wrong: panel.wrong,
      hints: ["Pense à la rue et aux gens qui s'y déplacent.", "Un panneau donne une règle à tous.", "Lis les trois phrases en entier."],
    };
  });
}
