/**
 * LES GABARITS DE L'INSTRUCTION CIVIQUE DU CI : le respect des autres, la vie à l'école, l'entraide, la route
 * (`ci-ci-politesse`, `ci-ci-ecole`, `ci-ci-entraide`, `ci-ci-route`).
 *
 * Le modèle avait écrit cent cinq exercices pour ces quatre thématiques, et plus d'un sur trois était à refaire :
 * des ordres sans ordre (« Bonjour, Merci, Pardon » ou « On s'aide, On est amis, On joue ensemble »), l'ordre
 * « regarder à gauche, regarder à droite, vérifier le feu, traverser » (le feu se regarde en premier), le même
 * exercice avec deux ordres contraires d'un palier à l'autre (« Se réveiller, S'habiller, Petit déjeuner » puis
 * « Se réveiller, Petit déjeuner, S'habiller »), « Marcher vite » rangé sous « Quand je traverse » et « S'arrêter »
 * sous « En traversant », « Sur la route, je ___ » avec « marche » pour réponse (la fiche dit de ne pas marcher sur
 * la route), des cases abstraites (« Assiduité », « Ponctualité », « Non aide »), des paires que rien ne détermine
 * (« Aïssatou partage ses crayons, Modou aide à ranger »), « Stylo » relié à « Dessiner », un QCM de deux
 * options, une phrase à deux trous, des « images » qui n'étaient que des mots, un crayon et un piéton écrits avec
 * U+FE0F et U+200D que les appareils anciens montrent en carré. Ici chaque geste est écrit une fois, avec sa
 * situation, et c'est lui qu'on retrouve dans tous les types d'exercice.
 *
 * LA MAISON DES GESTES. Une SCÈNE est une situation de la vie d'un enfant (« Ta grand-mère te parle. »), avec LE
 * geste qui convient (« J'écoute ma grand-mère ») et trois gestes qui ne conviennent pas. Tout vient de là :
 * - le QCM pose la scène (son clip joue au-dessus de l'énoncé : `payload.scene`, `lib/scene-clips.ts`) et propose
 *   le bon geste parmi deux mauvais ;
 * - la case « à faire » reçoit les bons gestes de plusieurs scènes, la case « à éviter » leurs mauvais gestes ;
 * - l'intrus en prend deux d'un côté et un de l'autre ;
 * - l'association relie l'étiquette de la scène à son bon geste.
 * Les gestes sont donc COMPRIS HORS DE LEUR SCÈNE : « Je m'arrête au feu rouge » est bon partout, « Je traverse
 * quand le feu est rouge » est mauvais partout. Jamais « Je m'arrête » (bon au feu rouge, mauvais au passage
 * piéton) ni « Je l'aide » (qui ?).
 *
 * RÈGLES POUR AJOUTER UNE SCÈNE
 * - Le bon geste est le seul qui convienne. La situation ne le dit jamais, et aucun mauvais geste n'est
 *   « presque bien » : un geste d'enfant que le règlement ou le code de la route interdit, rien d'ambigu.
 * - Tous les textes de gestes sont différents dans toute la table, et les émojis d'une scène aussi (la scène,
 *   le bon geste, les trois mauvais) : deux étiquettes au même dessin se confondraient.
 * - Le `group` rassemble les scènes dont les bons gestes se ressembleraient (« regarder » pour le feu vert et le
 *   bord du trottoir) : elles ne sont jamais reliées dans le même exercice.
 * - Une scène qui nomme une chose du catalogue (`lib/item-images.ts`) la nomme comme lui : « le feu rouge », « le
 *   feu vert », « le passage piéton ». L'écran y met l'image du catalogue à la place de l'émoji.
 * - Un émoji ancien (Unicode 11 au plus), jamais suivi de U+FE0F : pas de 🖍 ✏ 🗑 ⚠ ❤ ni de pastille de couleur.
 * - L'énoncé n'a aucun « : », au plus une apostrophe droite, vingt mots au plus (la consigne du CI).
 * - Une scène a son clip, de même identifiant (`lib/scene-clips.ts`, `public/videos/scenes/<id>.mp4`) : il montre la
 *   situation et JAMAIS le bon geste, les bureaux des élèves face au tableau. Voir `docs/scenes-civiques-clips.md` ;
 *   un test refuse une scène sans clip.
 *
 * LES ORDRES ne sont posés que sur des suites qui n'ont qu'un ordre : la traversée (s'arrêter, gauche, droite,
 * traverser), « le feu DEVIENT vert » (après le rouge, jamais avant), le matin, le repas, le prêt du ballon.
 * LES TROUS ne proposent que des mots qui ne vont pas dans la phrase : pas de « puis à gauche » (certains
 * programmes font regarder deux fois à gauche), pas de « chaque soir ».
 *
 * La politesse (bonjour, au revoir, merci, s'il te plaît, pardon) n'est pas refaite ici : `ci-ci-politesse`
 * emprunte les gabarits de `politesse.ts`, déjà vérifiés pour le français du CI.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, type GameContext, type GeneratedGame } from "./shared";
import { linkKey, pairsCount } from "./anglais";

export type Topic = "politesse" | "ecole" | "entraide" | "route";

/** Les quatre thématiques, dans l'ordre de la matière. La clé `vocabulary` d'un jeu est l'une d'elles. */
export const TOPICS: readonly Topic[] = ["politesse", "ecole", "entraide", "route"];

/** Un geste : son émoji, puis ce que l'enfant fait ou dit, à la première personne. */
export type Act = readonly [emoji: string, short: string];

const actTile = (act: Act) => `${act[0]} ${act[1]}`;

export type Scene = {
  id: string;
  topic: Topic;
  /** Les scènes d'un même groupe ont des bons gestes qui se ressemblent : jamais reliées dans le même exercice. */
  group: string;
  /** La situation, dite à l'enfant : elle ne dit pas ce qu'il faut faire. */
  text: string;
  /** La même situation en étiquette. */
  emoji: string;
  short: string;
  /** Le seul geste qui convienne. */
  right: Act;
  /** Trois gestes à éviter, mauvais même hors de la scène. */
  wrong: readonly [Act, Act, Act];
  /** Pourquoi, en une phrase qui n'écrit pas le bon geste. */
  hint: string;
};

export const SCENES: readonly Scene[] = [
  // ===== Bonjour, merci, pardon : respecter les grandes personnes, se tenir propre, prendre soin de ses affaires =====
  {
    id: "po1",
    topic: "politesse",
    group: "parole",
    text: "Ta grand-mère te parle.",
    emoji: "👵",
    short: "Grand-mère me parle",
    right: ["👂", "J'écoute ma grand-mère calmement"],
    wrong: [
      ["😛", "Je tire la langue à ma grand-mère"],
      ["🙉", "Je n'écoute pas ma grand-mère"],
      ["🤐", "Je ne réponds pas à ma grand-mère"],
    ],
    hint: "Quand une grande personne nous parle, on l'écoute avec respect.",
  },
  {
    id: "po2",
    topic: "politesse",
    group: "salut",
    text: "Tu vois un vieux monsieur dans la rue.",
    emoji: "👴",
    short: "Je vois un vieux monsieur",
    right: ["👋", "Je dis bonjour au vieux monsieur"],
    wrong: [
      ["😝", "Je me moque du vieux monsieur"],
      ["🙈", "Je tourne le dos au vieux monsieur"],
      ["😠", "Je crie sur le vieux monsieur"],
    ],
    hint: "On salue les personnes plus âgées que nous.",
  },
  {
    id: "po3",
    topic: "politesse",
    group: "aide",
    text: "Une vieille dame porte un gros panier.",
    emoji: "🧺",
    short: "Une dame porte un panier",
    right: ["🤝", "J'aide la vieille dame"],
    wrong: [
      ["🙅", "Je refuse d'aider la vieille dame"],
      ["😆", "Je ris de la vieille dame"],
      ["💥", "Je bouscule la vieille dame"],
    ],
    hint: "On aide les personnes âgées quand elles ont du mal.",
  },
  {
    id: "po4",
    topic: "politesse",
    group: "parole",
    text: "Papa parle avec un voisin. Tu as quelque chose à dire.",
    emoji: "💬",
    short: "Papa parle avec un voisin",
    right: ["🤫", "J'attends mon tour pour parler"],
    wrong: [
      ["📢", "Je parle plus fort que papa"],
      ["💪", "Je tire papa par le bras en criant"],
      ["😤", "Je coupe la parole à papa"],
    ],
    hint: "On attend que les grandes personnes aient fini de parler.",
  },
  {
    id: "po5",
    topic: "politesse",
    group: "parole",
    text: "Le directeur te dit bonjour.",
    emoji: "🧔",
    short: "Le directeur me dit bonjour",
    right: ["🙂", "Je réponds poliment au directeur"],
    wrong: [
      ["🤐", "Je ne réponds pas quand le directeur me salue"],
      ["😒", "Je fais la tête au directeur"],
      ["🙊", "Je me moque du directeur"],
    ],
    hint: "Quand quelqu'un nous dit bonjour, on lui répond poliment.",
  },
  {
    id: "po6",
    topic: "politesse",
    group: "propre",
    text: "Tu vas manger.",
    emoji: "🍚",
    short: "Je vais manger",
    right: ["🧼", "Je me lave les mains avec du savon"],
    wrong: [
      ["🤢", "Je mange avec les mains sales"],
      ["👄", "Je mets les doigts sales à la bouche"],
      ["🍞", "Je mange du pain tombé par terre"],
    ],
    hint: "Avant de manger, on garde les mains propres.",
  },
  {
    id: "po7",
    topic: "politesse",
    group: "propre",
    text: "Tu te lèves le matin.",
    emoji: "🌅",
    short: "Je me lève le matin",
    right: ["🦷", "Je me lave bien les dents"],
    wrong: [
      ["😴", "Je me recouche sans me laver"],
      ["🙅", "Je ne me lave pas le visage"],
      ["👕", "Je garde mes habits sales"],
    ],
    hint: "Le matin, on se lave pour être propre.",
  },
  {
    id: "po8",
    topic: "politesse",
    group: "propre",
    text: "Tu as un papier sale dans la main.",
    emoji: "📄",
    short: "J'ai un papier sale",
    right: ["🚮", "Je jette le papier à la poubelle"],
    wrong: [
      ["🚯", "Je jette le papier par terre"],
      ["💨", "Je lance le papier dans la rue"],
      ["🙈", "Je cache le papier sous la table"],
    ],
    hint: "Un papier sale se jette à un seul endroit.",
  },
  {
    id: "po9",
    topic: "politesse",
    group: "affaires",
    text: "Tu rentres à la maison avec ton cartable.",
    emoji: "🎒",
    short: "Je rentre avec mon cartable",
    right: ["🏠", "Je range mon cartable à sa place"],
    wrong: [
      ["💥", "Je jette mon cartable par terre"],
      ["☔", "Je laisse mon cartable sous la pluie"],
      ["🌙", "Je laisse mon cartable dehors la nuit"],
    ],
    hint: "On range ses affaires pour ne pas les abîmer.",
  },
  {
    id: "po10",
    topic: "politesse",
    group: "affaires",
    text: "Ton cahier est tout neuf.",
    emoji: "📒",
    short: "Mon cahier est tout neuf",
    right: ["📗", "Je garde mon cahier bien propre"],
    wrong: [
      ["💢", "Je déchire les pages de mon cahier"],
      ["🎨", "Je gribouille sur tout mon cahier"],
      ["💦", "Je mouille mon cahier exprès"],
    ],
    hint: "On prend soin de son cahier pour qu'il reste propre.",
  },
  {
    id: "po11",
    topic: "politesse",
    group: "affaires",
    text: "Tu as fini de jouer avec tes jouets.",
    emoji: "🧸",
    short: "J'ai fini de jouer",
    right: ["📦", "Je range mes jouets dans la boîte"],
    wrong: [
      ["😡", "Je casse mes jouets exprès"],
      ["🎯", "Je lance mes jouets contre le mur"],
      ["💧", "Je laisse mes jouets sous la pluie"],
    ],
    hint: "On range ses jouets pour les garder en bon état.",
  },

  // ===== À l'école chaque jour : venir et arriver à l'heure, le règlement, le matériel commun =====
  {
    id: "ec1",
    topic: "ecole",
    group: "heure",
    text: "C'est lundi matin et tu es en bonne santé.",
    emoji: "📅",
    short: "C'est lundi matin",
    right: ["🏫", "Je me lève et je vais à l'école"],
    wrong: [
      ["😴", "Je reste au lit sans raison"],
      ["⚽", "Je ne vais pas à l'école pour jouer"],
      ["📺", "Je regarde la télé au lieu d'aller en classe"],
    ],
    hint: "Quand on n'est pas malade, on va à l'école chaque jour.",
  },
  {
    id: "ec2",
    topic: "ecole",
    group: "heure",
    text: "Tu pars pour l'école. La cloche sonne bientôt.",
    emoji: "⏰",
    short: "Je pars pour l'école",
    right: ["🚶", "Je me dépêche d'arriver à l'heure"],
    wrong: [
      ["🐌", "Je traîne et j'arrive en retard"],
      ["🎲", "Je joue en chemin au lieu d'aller à l'école"],
      ["💤", "Je me rendors au lieu de partir"],
    ],
    hint: "Pour être à l'heure, on part tôt et on ne traîne pas.",
  },
  {
    id: "ec3",
    topic: "ecole",
    group: "heure",
    text: "Tu arrives en retard. Les élèves sont déjà en classe.",
    emoji: "🚪",
    short: "J'arrive en retard",
    right: ["🙋", "Je m'excuse et j'entre doucement"],
    wrong: [
      ["📢", "J'entre en criant"],
      ["🔊", "Je claque la porte"],
      ["😝", "Je ris de mon retard"],
    ],
    hint: "Quand on est en retard, on s'excuse et on entre sans bruit.",
  },
  {
    id: "ec4",
    topic: "ecole",
    group: "heure",
    text: "La cloche sonne. Il faut entrer en classe.",
    emoji: "🔔",
    short: "La cloche sonne",
    right: ["👫", "Je me mets calmement en rang"],
    wrong: [
      ["🏃", "Je cours dans tous les sens"],
      ["🙊", "Je crie dans le rang"],
      ["💥", "Je pousse les autres pour passer"],
    ],
    hint: "À la cloche, on se met en rang et on avance calmement.",
  },
  {
    id: "ec5",
    topic: "ecole",
    group: "classe",
    text: "La maîtresse pose une question. Tu veux répondre.",
    emoji: "❓",
    short: "Je veux répondre",
    right: ["✋", "Je lève la main et j'attends"],
    wrong: [
      ["📣", "Je crie ma réponse"],
      ["🏃", "Je me lève et je cours vers la maîtresse"],
      ["👉", "Je parle sans attendre mon tour"],
    ],
    hint: "En classe, on lève la main et on attend d'avoir la parole.",
  },
  {
    id: "ec6",
    topic: "ecole",
    group: "classe",
    text: "La maîtresse explique la leçon.",
    emoji: "👩",
    short: "La maîtresse explique la leçon",
    right: ["👂", "J'écoute la maîtresse"],
    wrong: [
      ["💬", "Je bavarde pendant la leçon"],
      ["😴", "Je dors sur ma table"],
      ["🎲", "Je joue pendant la leçon"],
    ],
    hint: "Pendant la leçon, on écoute pour bien apprendre.",
  },
  {
    id: "ec7",
    topic: "ecole",
    group: "livre",
    text: "Un livre de la classe est tombé par terre.",
    emoji: "📚",
    short: "Un livre est par terre",
    right: ["📖", "Je ramasse et je range le livre"],
    wrong: [
      ["🦶", "Je marche sur le livre"],
      ["🚮", "Je jette le livre à la poubelle"],
      ["💢", "Je déchire le livre"],
    ],
    hint: "Les livres de la classe sont à tout le monde, on en prend soin.",
  },
  {
    id: "ec8",
    topic: "ecole",
    group: "ballon",
    text: "Tu as fini de jouer avec le ballon de la classe.",
    emoji: "⚽",
    short: "J'ai fini avec le ballon",
    right: ["🤲", "Je rends le ballon à la maîtresse"],
    wrong: [
      ["🏠", "Je garde le ballon de la classe chez moi"],
      ["🌳", "Je cache le ballon dans la cour"],
      ["💥", "Je tape le ballon contre la fenêtre"],
    ],
    hint: "Le ballon de la classe est à tout le monde, on le rend.",
  },
  {
    id: "ec9",
    topic: "ecole",
    group: "papier",
    text: "Tu as fini ton bonbon dans la cour.",
    emoji: "🍬",
    short: "J'ai fini mon bonbon",
    right: ["🚮", "Je mets le papier à la poubelle"],
    wrong: [
      ["🚯", "Je jette le papier dans la cour"],
      ["💨", "Je laisse le vent emporter le papier"],
      ["🌳", "Je cache le papier sous l'arbre"],
    ],
    hint: "La cour doit rester propre pour tout le monde.",
  },
  {
    id: "ec10",
    topic: "ecole",
    group: "classe",
    text: "Tu es en classe et tu as envie de jouer.",
    emoji: "🎈",
    short: "J'ai envie de jouer en classe",
    right: ["💺", "Je reste assis à ma place"],
    wrong: [
      ["🏃", "Je cours entre les tables"],
      ["🤸", "Je fais des galipettes en classe"],
      ["🎯", "Je lance des boulettes de papier"],
    ],
    hint: "En classe, on reste assis à sa place pour bien travailler.",
  },

  // ===== On s'entraide : aider un camarade, partager, filles et garçons ensemble =====
  {
    id: "en1",
    topic: "entraide",
    group: "chagrin",
    text: "Un camarade tombe dans la cour.",
    emoji: "🤕",
    short: "Un camarade est tombé",
    right: ["🤝", "J'aide mon camarade à se relever"],
    wrong: [
      ["😆", "Je ris de mon camarade"],
      ["🚶", "Je laisse mon camarade par terre"],
      ["🙈", "Je fais semblant de ne rien voir"],
    ],
    hint: "On aide un camarade qui est tombé.",
  },
  {
    id: "en2",
    topic: "entraide",
    group: "partage",
    text: "Tu as un pain. Ton ami n'a rien à manger.",
    emoji: "😟",
    short: "Mon ami a faim",
    right: ["🍞", "Je partage mon pain avec mon ami"],
    wrong: [
      ["😋", "Je mange mon pain devant mon ami qui a faim"],
      ["🙊", "Je cache mon pain pour ne rien donner"],
      ["😝", "Je me moque de mon ami qui a faim"],
    ],
    hint: "Quand on a de quoi manger, on partage avec son ami.",
  },
  {
    id: "en3",
    topic: "entraide",
    group: "pret",
    text: "Ton ami a oublié son crayon.",
    emoji: "😕",
    short: "Mon ami n'a pas de crayon",
    right: ["📝", "Je prête mon crayon à mon ami"],
    wrong: [
      ["🙅", "Je refuse de prêter mon crayon à mon ami"],
      ["🤭", "Je rigole de mon ami"],
      ["🤫", "Je cache mon crayon pour ne pas le prêter"],
    ],
    hint: "On prête ses affaires à un ami qui en a besoin.",
  },
  {
    id: "en4",
    topic: "entraide",
    group: "accueil",
    text: "Une fille veut jouer au ballon avec toi.",
    emoji: "👧",
    short: "Une fille veut jouer",
    right: ["🤗", "J'invite la fille à jouer avec nous"],
    wrong: [
      ["🚫", "Je refuse parce que c'est une fille"],
      ["😝", "Je me moque de la fille"],
      ["🙊", "Je dis à la fille de s'en aller"],
    ],
    hint: "Les filles et les garçons peuvent jouer ensemble.",
  },
  {
    id: "en5",
    topic: "entraide",
    group: "accueil",
    text: "Un garçon veut jouer à la corde avec toi.",
    emoji: "👦",
    short: "Un garçon veut jouer",
    right: ["🙌", "J'invite le garçon à sauter à la corde"],
    wrong: [
      ["🚫", "Je refuse parce que c'est un garçon"],
      ["🤭", "Je rigole du garçon"],
      ["🙊", "Je dis au garçon de s'en aller"],
    ],
    hint: "Les filles et les garçons peuvent jouer à tous les jeux.",
  },
  {
    id: "en6",
    topic: "entraide",
    group: "travail",
    text: "La maîtresse demande de travailler à deux.",
    emoji: "👥",
    short: "On travaille à deux",
    right: ["🤝", "Je travaille bien avec mon voisin"],
    wrong: [
      ["🙅", "Je refuse de travailler avec mon voisin"],
      ["👀", "Je regarde ailleurs sans rien faire"],
      ["😠", "Je me dispute avec mon voisin"],
    ],
    hint: "À deux, on travaille ensemble et chacun fait sa part.",
  },
  {
    id: "en7",
    topic: "entraide",
    group: "expliquer",
    text: "Ton camarade ne comprend pas l'exercice.",
    emoji: "🤔",
    short: "Il ne comprend pas",
    right: ["💡", "J'explique doucement à mon camarade"],
    wrong: [
      ["🤭", "Je me moque de mon camarade"],
      ["😠", "Je dis à mon camarade qu'il est bête"],
      ["🙅", "Je refuse de l'aider"],
    ],
    hint: "On aide un camarade en lui expliquant avec gentillesse.",
  },
  {
    id: "en8",
    topic: "entraide",
    group: "chagrin",
    text: "Un camarade pleure parce qu'il est triste.",
    emoji: "😢",
    short: "Un camarade pleure",
    right: ["🤗", "Je console doucement mon camarade"],
    wrong: [
      ["🙊", "Je traite mon camarade de bébé"],
      ["🚶", "Je laisse mon camarade pleurer seul"],
      ["😈", "J'embête encore plus mon camarade"],
    ],
    hint: "On console un camarade qui a du chagrin.",
  },
  {
    id: "en9",
    topic: "entraide",
    group: "partage",
    text: "Il y a un seul ballon pour toute l'équipe.",
    emoji: "🏀",
    short: "Un seul ballon pour tous",
    right: ["🔁", "Je passe le ballon aux autres"],
    wrong: [
      ["😤", "Je garde le ballon pour moi seul"],
      ["🏃", "Je pars avec le ballon"],
      ["🙅", "Je ne laisse personne jouer"],
    ],
    hint: "Quand il y a un seul ballon, on le partage pour que chacun joue.",
  },
  {
    id: "en10",
    topic: "entraide",
    group: "accueil",
    text: "Un nouvel élève arrive dans ta classe.",
    emoji: "🆕",
    short: "Un nouvel élève arrive",
    right: ["🙋", "J'accueille le nouvel élève"],
    wrong: [
      ["🙈", "Je tourne le dos au nouvel élève"],
      ["🤭", "Je me moque du nouvel élève"],
      ["🚫", "Je ne parle pas au nouvel élève"],
    ],
    hint: "On accueille avec gentillesse un nouvel élève.",
  },

  // ===== Traverser la rue : le feu, le passage piéton, regarder, le trottoir, ne pas jouer sur la route =====
  {
    id: "ro1",
    topic: "route",
    group: "arret",
    text: "Tu veux traverser. Le feu est rouge pour toi.",
    emoji: "🔴",
    short: "le feu rouge",
    right: ["🛑", "Je m'arrête et j'attends au feu rouge"],
    wrong: [
      ["🏃", "Je traverse quand le feu est rouge"],
      ["🙈", "Je ferme les yeux et je traverse"],
      ["🚗", "Je passe devant les voitures qui roulent"],
    ],
    hint: "Quand le feu est rouge pour toi, les voitures passent.",
  },
  {
    id: "ro2",
    topic: "route",
    group: "traverser",
    text: "Tu veux traverser. Le feu est vert pour toi.",
    emoji: "💚",
    short: "le feu vert",
    right: ["👀", "Je regarde bien avant de traverser"],
    wrong: [
      ["🏃", "Je traverse sans regarder"],
      ["🙈", "Je traverse les yeux fermés"],
      ["⚽", "Je traverse en jouant au ballon"],
    ],
    hint: "Même quand le feu est vert, on regarde avant de traverser.",
  },
  {
    id: "ro3",
    topic: "route",
    group: "traverser",
    text: "Tu veux traverser la route.",
    emoji: "🚸",
    short: "le passage piéton",
    right: ["🦓", "Je traverse sur les bandes blanches"],
    wrong: [
      ["🚗", "Je traverse entre les voitures"],
      ["🏃", "Je traverse n'importe où"],
      ["🙊", "Je traverse là où personne ne me voit"],
    ],
    hint: "On traverse sur le passage piéton, là où les voitures nous attendent.",
  },
  {
    id: "ro4",
    topic: "route",
    group: "traverser",
    text: "Tu es au bord du trottoir, prêt à traverser.",
    emoji: "🚶",
    short: "Je vais traverser",
    right: ["👈", "Je regarde à gauche puis à droite"],
    wrong: [
      ["👟", "Je regarde seulement mes chaussures"],
      ["💬", "Je parle à mon ami sans regarder"],
      ["🙈", "Je ferme les yeux et j'avance"],
    ],
    hint: "Avant de traverser, on regarde des deux côtés de la route.",
  },
  {
    id: "ro5",
    topic: "route",
    group: "marcher",
    text: "Il y a un trottoir le long de la route.",
    emoji: "🌇",
    short: "Un trottoir longe la route",
    right: ["👣", "Je marche sur le trottoir"],
    wrong: [
      ["🚌", "Je marche au milieu de la route"],
      ["🏃", "Je cours sur la route"],
      ["👥", "Je marche sur la route avec mes amis"],
    ],
    hint: "Le trottoir est la place des piétons.",
  },
  {
    id: "ro6",
    topic: "route",
    group: "ballon-route",
    text: "Ton ballon roule sur la route.",
    emoji: "🏐",
    short: "Mon ballon roule sur la route",
    right: ["🙋", "J'appelle un adulte pour mon ballon"],
    wrong: [
      ["🏃", "Je cours après mon ballon sur la route"],
      ["🚧", "Je me mets au milieu de la route"],
      ["😠", "Je crie après les voitures"],
    ],
    hint: "On ne court jamais sur la route, même pour un ballon.",
  },
  {
    id: "ro7",
    topic: "route",
    group: "jouer",
    text: "Tes amis jouent au ballon sur la route.",
    emoji: "👬",
    short: "Mes amis jouent sur la route",
    right: ["🌳", "Je joue ailleurs, loin de la route"],
    wrong: [
      ["⚽", "Je joue au ballon sur la route"],
      ["🏁", "Je fais la course sur la route"],
      ["🚲", "Je fais du vélo au milieu de la route"],
    ],
    hint: "On joue dans la cour, pas sur la route.",
  },
  {
    id: "ro8",
    topic: "route",
    group: "traverser",
    text: "Tu sors de classe. Ta maman est de l'autre côté de la route.",
    emoji: "👪",
    short: "Maman est de l'autre côté",
    right: ["🧑", "Je traverse avec un adulte qui me guide"],
    wrong: [
      ["💨", "Je cours vers maman sans regarder"],
      ["🚖", "Je me faufile entre les voitures"],
      ["📣", "Je crie pour que les voitures s'arrêtent"],
    ],
    hint: "Quand on est petit, on traverse avec un adulte.",
  },
  {
    id: "ro9",
    topic: "route",
    group: "arret",
    text: "Tu entends une moto arriver très vite.",
    emoji: "🛵",
    short: "Une moto arrive vite",
    right: ["✋", "J'attends que la moto soit bien passée"],
    wrong: [
      ["🏃", "Je traverse en courant devant la moto"],
      ["🙈", "Je ne regarde pas la moto qui arrive"],
      ["🚶", "Je m'avance sur la route pour voir la moto"],
    ],
    hint: "Quand un véhicule arrive vite, on attend qu'il soit passé.",
  },
  {
    id: "ro10",
    topic: "route",
    group: "marcher",
    text: "Il n'y a pas de trottoir sur ton chemin.",
    emoji: "🌾",
    short: "Pas de trottoir sur mon chemin",
    right: ["🚶", "Je marche tout au bord de la route"],
    wrong: [
      ["🚕", "Je marche au milieu des voitures"],
      ["🌀", "Je zigzague d'un côté à l'autre de la route"],
      ["🎯", "Je marche sur la route pour aller plus vite"],
    ],
    hint: "Sans trottoir, on marche tout au bord, loin des voitures.",
  },
];

/** Les scènes d'une thématique. */
export const scenesOf = (topic: Topic): readonly Scene[] => SCENES.filter((scene) => scene.topic === topic);

const CONCEPT: Record<Topic, string> = {
  politesse: "le respect des autres, de soi et de ses affaires",
  ecole: "la vie à l'école : être à l'heure, suivre le règlement, prendre soin du matériel",
  entraide: "l'entraide et le partage, filles et garçons ensemble",
  route: "la sécurité sur la route : le feu, le passage piéton, regarder, le trottoir",
};

/** La thématique d'un jeu : sa clé `vocabulary` quand le programme la donne, une au hasard sinon (les tests, les jeux sans programme). */
function topicOf(ctx: GameContext): Topic {
  const asked = (TOPICS as readonly string[]).includes(ctx.vocabulary ?? "") ? (ctx.vocabulary as Topic) : null;
  return asked ?? pick(ctx.rng, TOPICS);
}

// ===========================================================================
// QUE FAIS-TU ? UNE SITUATION, TROIS GESTES
// ===========================================================================

/**
 * L'écart de longueur d'un groupe de gestes (le plus long sur le plus court). Les bons gestes sont plus courts que les
 * mauvais (le mauvais geste porte son contexte) : sans précaution, « le plus court » serait la bonne réponse.
 */
const spread = (acts: readonly Act[]) => Math.max(...acts.map((act) => act[1].length)) / Math.min(...acts.map((act) => act[1].length));

/** « Ta grand-mère te parle. Que fais-tu ? » : le bon geste parmi trois, deux mauvais de longueur voisine pris dans les trois de la scène. */
export function makeSceneChoice(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(ctx, "civ-situation", () => {
    const scene = pickFresh(ctx, scenesOf(topic), (candidate) => `civ-scene:${candidate.id}`);
    const [first, second, third] = scene.wrong;
    const pairs: [Act, Act][] = [
      [first, second],
      [first, third],
      [second, third],
    ];
    const tightest = Math.min(...pairs.map((pair) => spread([scene.right, ...pair])));
    const wrong = pick(
      ctx.rng,
      pairs.filter((pair) => spread([scene.right, ...pair]) <= tightest + 0.15),
    );
    const options = shuffle(ctx.rng, [scene.right, ...wrong].map(actTile));
    return {
      type: "qcm",
      prompt: `${scene.text} Que fais-tu ?`,
      payload: {
        options,
        correctIndex: options.indexOf(actTile(scene.right)),
        // Le clip de la scène (`lib/scene-clips.ts`) : la situation en images, jamais le bon geste.
        scene: scene.id,
        game: originOf("civ-situation", ctx),
        concept: CONCEPT[topic],
      },
      answerKey: actTile(scene.right),
      hints: ["Lis la situation, doucement.", scene.hint, "Écarte les gestes qui font de la peine ou du danger."],
    };
  });
}

// ===========================================================================
// À FAIRE, À ÉVITER
// ===========================================================================

/** Des gestes de scènes différentes, aux émojis tous différents : deux étiquettes au même dessin se confondraient. */
function drawActs(ctx: GameContext, scenes: readonly Scene[], goodCount: number, badCount: number): { good: Act[]; bad: Act[] } {
  let drawn: { good: Act[]; bad: Act[] } = { good: [], bad: [] };
  for (let attempt = 0; attempt < 30; attempt++) {
    const picked = shuffle(ctx.rng, scenes).slice(0, goodCount + badCount);
    drawn = {
      good: picked.slice(0, goodCount).map((scene) => scene.right),
      bad: picked.slice(goodCount).map((scene) => pick(ctx.rng, scene.wrong)),
    };
    const emojis = [...drawn.good, ...drawn.bad].map((act) => act[0]);
    if (new Set(emojis).size === emojis.length) break;
  }
  return drawn;
}

/** Les deux cases, dans les mots de la démonstration : la première reçoit les bons gestes, la seconde les mauvais. */
const ZONES = ["✅ À faire", "❌ À éviter"] as const;

/** « Glisse chaque geste dans la bonne case. » : quatre gestes au premier niveau, cinq ensuite (des phrases entières : six feraient un écran trop haut). */
export function makeActSort(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(
    ctx,
    "civ-glisser",
    () => {
      const total = ctx.level === 1 ? 4 : 5;
      const goodCount = Math.floor(total / 2) + (total % 2 === 1 ? randomInt(ctx.rng, 0, 1) : 0);
      const { good, bad } = drawActs(ctx, scenesOf(topic), goodCount, total - goodCount);
      const items = shuffle(ctx.rng, [
        ...good.map((act) => ({ text: actTile(act), correctZone: ZONES[0] as string })),
        ...bad.map((act) => ({ text: actTile(act), correctZone: ZONES[1] as string })),
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque geste dans la bonne case.",
        payload: {
          zones: shuffle(ctx.rng, [...ZONES]),
          items,
          game: originOf("civ-glisser", ctx),
          concept: CONCEPT[topic],
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis les gestes l'un après l'autre.",
          "Un geste à faire est gentil, poli ou sûr.",
          "Un geste à éviter fait de la peine ou du danger.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Quel geste est bien ? » ou « Quel geste n'est pas bien ? » : trois gestes de trois scènes, un seul d'un côté. */
export function makeActOdd(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(
    ctx,
    "civ-intrus",
    () => {
      const answerIsBad = ctx.rng() < 0.5;
      const draw = () => drawActs(ctx, scenesOf(topic), answerIsBad ? 2 : 1, answerIsBad ? 1 : 2);
      let { good, bad } = draw();
      // Les trois gestes de longueur voisine : la réponse ne se devine pas au texte le plus long ou le plus court.
      for (let attempt = 0; attempt < 30 && spread([...good, ...bad]) >= 1.8; attempt++) ({ good, bad } = draw());
      const answer = answerIsBad ? bad[0] : good[0];
      const options = shuffle(ctx.rng, [...good, ...bad].map(actTile));
      return {
        type: "qcm",
        prompt: answerIsBad ? "Quel geste n'est pas bien ?" : "Quel geste est bien ?",
        payload: {
          options,
          correctIndex: options.indexOf(actTile(answer)),
          game: originOf("civ-intrus", ctx),
          concept: CONCEPT[topic],
        },
        answerKey: actTile(answer),
        hints: [
          "Lis les trois gestes l'un après l'autre.",
          answerIsBad
            ? "Deux gestes sont gentils ou sûrs, un seul fait de la peine ou du danger."
            : "Deux gestes font de la peine ou du danger, un seul est gentil et sûr.",
          "Pense à ce que tu aimerais que les autres fassent pour toi.",
        ],
      };
    },
    sortedOptions,
  );
}

// ===========================================================================
// RELIER UNE SITUATION ET SON GESTE
// ===========================================================================

/** Des scènes de groupes différents, aux émojis tous différents. */
function drawScenes(ctx: GameContext, scenes: readonly Scene[], count: number): Scene[] {
  let chosen: Scene[] = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    const groups = new Set<string>();
    chosen = [];
    for (const scene of shuffle(ctx.rng, scenes)) {
      if (groups.has(scene.group)) continue;
      groups.add(scene.group);
      chosen.push(scene);
      if (chosen.length === count) break;
    }
    const emojis = chosen.flatMap((scene) => [scene.emoji, scene.right[0]]);
    if (new Set(emojis).size === emojis.length) break;
  }
  return chosen;
}

/** « Relie chaque situation au bon geste. » : trois paires au premier niveau, quatre ensuite (des phrases entières : cinq feraient un écran trop haut). */
export function makeSceneLinks(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(
    ctx,
    "civ-relier",
    () => {
      const scenes = scenesOf(topic);
      const chosen = drawScenes(ctx, scenes, Math.min(4, pairsCount(ctx.level, new Set(scenes.map((scene) => scene.group)).size)));
      const pairs = chosen.map((scene) => ({ left: `${scene.emoji} ${scene.short}`, right: actTile(scene.right) }));
      return {
        type: "match",
        prompt: "Relie chaque situation au bon geste.",
        payload: { pairs, game: originOf("civ-relier", ctx), concept: CONCEPT[topic] },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Lis les situations l'une après l'autre.",
          "Chaque situation va avec un seul geste.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

// ===========================================================================
// DANS L'ORDRE
// ===========================================================================

export type Sequence = {
  id: string;
  topic: Topic;
  /** Le critère est dans l'énoncé : « dans l'ordre de la traversée », « pour arriver à temps ». */
  prompt: string;
  /** Les étapes dans l'ordre, trois ou quatre. Une seule suite possible : l'ordre se lit dans les gestes eux-mêmes. */
  steps: readonly Act[];
};

export const SEQUENCES: readonly Sequence[] = [
  {
    id: "sq-po1",
    topic: "politesse",
    prompt: "Mets ces gestes dans l'ordre du matin.",
    steps: [
      ["🌅", "Je me lève"],
      ["🚿", "Je me lave"],
      ["👕", "Je m'habille"],
      ["🎒", "Je prends mon cartable"],
    ],
  },
  {
    id: "sq-po2",
    topic: "politesse",
    prompt: "Mets ces gestes dans l'ordre du repas.",
    steps: [
      ["🧼", "Je me lave les mains"],
      ["🍚", "Je mange"],
      ["🦷", "Je me lave les dents"],
    ],
  },
  {
    id: "sq-po3",
    topic: "politesse",
    prompt: "Mets ces gestes dans l'ordre du retour.",
    steps: [
      ["🏠", "J'arrive à la maison"],
      ["🧼", "Je me lave les mains"],
      ["🍞", "Je prends mon goûter"],
    ],
  },
  {
    id: "sq-ec1",
    topic: "ecole",
    prompt: "Mets ces gestes dans l'ordre de la matinée.",
    steps: [
      ["🏫", "J'arrive à l'école"],
      ["👫", "Je me mets en rang"],
      ["📚", "J'entre en classe"],
      ["✋", "Je lève la main pour parler"],
    ],
  },
  {
    id: "sq-ec2",
    topic: "ecole",
    prompt: "Mets ces gestes dans l'ordre pour arriver à temps.",
    steps: [
      ["⏰", "Je me réveille tôt"],
      ["👕", "Je m'habille vite"],
      ["🚶", "Je pars de la maison"],
      ["🏫", "J'arrive à l'école"],
    ],
  },
  {
    id: "sq-ec3",
    topic: "ecole",
    prompt: "Mets ces gestes dans l'ordre du jeu de ballon.",
    steps: [
      ["🙋", "Je demande le ballon"],
      ["⚽", "Je joue avec mes camarades"],
      ["🤲", "Je rends le ballon"],
    ],
  },
  {
    id: "sq-en1",
    topic: "entraide",
    prompt: "Mets ces moments dans l'ordre de la scène.",
    steps: [
      ["🤕", "Mon camarade tombe"],
      ["🏃", "J'accours vers lui"],
      ["🤝", "Je l'aide à se relever"],
      ["😊", "Il me dit merci"],
    ],
  },
  {
    id: "sq-en2",
    topic: "entraide",
    prompt: "Mets ces gestes dans l'ordre du partage.",
    steps: [
      ["🍞", "J'ai un pain"],
      ["🤲", "Je partage mon pain"],
      ["😋", "Nous mangeons ensemble"],
    ],
  },
  {
    id: "sq-en3",
    topic: "entraide",
    prompt: "Mets ces gestes dans l'ordre du jeu.",
    steps: [
      ["👫", "Nous choisissons un jeu"],
      ["⚽", "Nous jouons ensemble"],
      ["🧺", "Nous rangeons le jeu"],
    ],
  },
  {
    id: "sq-ro1",
    topic: "route",
    prompt: "Mets ces gestes dans l'ordre de la traversée.",
    steps: [
      ["🚸", "Je m'arrête au bord du trottoir"],
      ["👈", "Je regarde à gauche"],
      ["👉", "Je regarde à droite"],
      ["🚶", "Je traverse sur le passage piéton"],
    ],
  },
  {
    id: "sq-ro2",
    topic: "route",
    prompt: "Mets ces moments dans l'ordre du feu.",
    steps: [
      ["🔴", "Le feu est rouge"],
      ["🛑", "Je m'arrête"],
      ["💚", "Le feu devient vert"],
      ["🚶", "Je regarde et je traverse"],
    ],
  },
  {
    id: "sq-ro3",
    topic: "route",
    prompt: "Mets ces gestes dans l'ordre de la traversée.",
    steps: [
      ["🚸", "Je m'arrête au bord du trottoir"],
      ["👀", "Je regarde à gauche puis à droite"],
      ["🚶", "Je traverse sur le passage piéton"],
    ],
  },
];

/** « Mets ces gestes dans l'ordre du matin. » : trois étapes au premier niveau quand la thématique en a, trois ou quatre ensuite. */
export function makeSequence(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(
    ctx,
    "civ-ordre",
    () => {
      const all = SEQUENCES.filter((sequence) => sequence.topic === topic);
      const short = all.filter((sequence) => sequence.steps.length <= 3);
      const sequence = pickFresh(ctx, ctx.level === 1 && short.length > 0 ? short : all, (candidate) => `civ-seq:${candidate.id}`);
      const tiles = sequence.steps.map(actTile);
      return {
        type: "order",
        prompt: sequence.prompt,
        payload: { correctSequence: tiles, game: originOf("civ-ordre", ctx), concept: CONCEPT[topic] },
        answerKey: tiles.join(", "),
        hints: ["Pense à ce qui se passe en premier.", "Cherche ce qui arrive en dernier.", "Dis les gestes à voix haute, dans l'ordre."],
      };
    },
    (game) => String(game.answerKey),
  );
}

// ===========================================================================
// COMPLÈTE LA PHRASE
// ===========================================================================

export type Gap = {
  id: string;
  topic: Topic;
  /** Une seule phrase, un seul trou, au plus une apostrophe droite. */
  text: string;
  answer: string;
  /** Deux mots qui ne vont pas dans la phrase, ni par le sens ni par la grammaire. */
  wrong: readonly [string, string];
  /** Ce que le mot désigne, sans l'écrire. */
  hint: string;
};

export const GAPS: readonly Gap[] = [
  { id: "gp1", topic: "politesse", text: "Avant de manger, je me lave les ___.", answer: "mains", wrong: ["pieds", "cheveux"], hint: "On se lave ce qui touche le pain et le riz." },
  { id: "gp2", topic: "politesse", text: "Je jette mes papiers à la ___.", answer: "poubelle", wrong: ["fenêtre", "chaise"], hint: "Les papiers sales vont à un seul endroit." },
  { id: "gp3", topic: "politesse", text: "Je range mon cahier dans mon ___.", answer: "cartable", wrong: ["lit", "seau"], hint: "On range ses affaires d'école dans un sac." },
  { id: "gp4", topic: "politesse", text: "Je ne tire pas la ___ aux grandes personnes.", answer: "langue", wrong: ["porte", "table"], hint: "Tirer ce qu'on a dans la bouche est impoli." },
  { id: "ge1", topic: "ecole", text: "Je lève la ___ pour parler en classe.", answer: "main", wrong: ["jambe", "langue"], hint: "On lève ce qui est au bout du bras." },
  { id: "ge2", topic: "ecole", text: "J'arrive à temps, avant la ___.", answer: "cloche", wrong: ["mangue", "chaise"], hint: "C'est un son qui annonce le début des cours." },
  { id: "ge3", topic: "ecole", text: "Je mets mes papiers à la ___.", answer: "poubelle", wrong: ["porte", "table"], hint: "Un papier sale a sa place." },
  { id: "ge4", topic: "ecole", text: "Je range les livres dans l'___.", answer: "armoire", wrong: ["arbre", "eau"], hint: "C'est un meuble de la classe." },
  { id: "ge5", topic: "ecole", text: "Je viens à l'école chaque ___.", answer: "jour", wrong: ["nuit", "étoile"], hint: "On y va tous les matins." },
  { id: "gn1", topic: "entraide", text: "Je partage mon pain avec mon ___.", answer: "ami", wrong: ["mur", "toit"], hint: "On partage avec quelqu'un qu'on aime bien." },
  { id: "gn2", topic: "entraide", text: "Je prête mon ___ à un ami qui n'en a pas.", answer: "crayon", wrong: ["lion", "nuage"], hint: "C'est ce qu'il faut pour écrire." },
  { id: "gn3", topic: "entraide", text: "Je ne me moque jamais de mon ___.", answer: "camarade", wrong: ["toit", "mur"], hint: "On ne se moque de personne." },
  { id: "gr1", topic: "route", text: "Au feu ___, je m'arrête.", answer: "rouge", wrong: ["vert", "bleu"], hint: "C'est la couleur qui veut dire stop." },
  { id: "gr2", topic: "route", text: "Au feu ___, je regarde puis je traverse.", answer: "vert", wrong: ["rouge", "bleu"], hint: "C'est la couleur qui laisse passer." },
  { id: "gr3", topic: "route", text: "Je regarde à gauche, puis à ___.", answer: "droite", wrong: ["terre", "nuit"], hint: "C'est le côté opposé à la gauche." },
  { id: "gr4", topic: "route", text: "Je marche sur le ___, pas sur la route.", answer: "trottoir", wrong: ["toit", "mur"], hint: "C'est la place des piétons le long de la route." },
  { id: "gr5", topic: "route", text: "Je traverse sur le passage pour ___.", answer: "piétons", wrong: ["voitures", "motos"], hint: "Ce sont ceux qui marchent à pied." },
  { id: "gr6", topic: "route", text: "Je ne joue pas sur la ___.", answer: "route", wrong: ["main", "dent"], hint: "C'est là que roulent les voitures." },
];

/** « Au feu ___, je m'arrête. » : le mot juste parmi trois, deux qui ne vont pas dans la phrase. */
export function makeRuleGap(ctx: GameContext): GeneratedGame {
  const topic = topicOf(ctx);
  return fresh(ctx, "civ-trou", () => {
    const gap = pickFresh(
      ctx,
      GAPS.filter((candidate) => candidate.topic === topic),
      (candidate) => `civ-gap:${candidate.id}`,
    );
    return {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: {
        text: gap.text,
        blanks: [{ options: shuffle(ctx.rng, [gap.answer, ...gap.wrong]), answer: gap.answer }],
        game: originOf("civ-trou", ctx),
        concept: CONCEPT[topic],
      },
      answerKey: gap.answer,
      hints: ["Lis la phrase en entier, doucement.", gap.hint, "Écarte les mots qui ne vont pas dans la phrase."],
    };
  });
}
