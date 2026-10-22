/**
 * LES GABARITS DE L'INSTRUCTION CIVIQUE DU CE1 : les symboles de la Nation, le civisme, respecter les autorités, nos différences
 * et notre richesse (`ci-ce1-nation`, `ci-ce1-civisme`, `ci-ce1-autorites`, `ci-ce1-diversite`).
 *
 * Sur l'échantillon de CE1, le modèle écrivait ici des exercices faux ou sans réponse : « Mets ces éléments en ordre de leur importance
 * dans notre nation » (le drapeau, la devise, l'hymne : aucun ordre n'existe), « Classe les étapes pour respecter un policier »,
 * « Associe chaque image à son bon comportement » (aucune image), « Wolof : langue » et « Peul : ethnie » dans une même question (le
 * wolof est une langue ET une ethnie), « Qu'est-ce que le respect ? » (une question ouverte). Ici chaque exercice lit une ligne d'un
 * tableau fermé, écrit à la main : la bonne réponse est dans la ligne et les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Nation : le drapeau vert, or et rouge avec une étoile verte à cinq branches au centre ; la devise « Un Peuple – Un But – Une Foi » ;
 *   l'hymne « Le Lion rouge », dont les paroles sont de Léopold Sédar Senghor ; le lion et le baobab des armoiries. AUCUNE autre parole
 *   de l'hymne que son titre n'est écrite (la fiche l'interdit). HORS FICHE, À FAIRE RELIRE : que Senghor est un poète et le premier
 *   président (un indice), que le drapeau se hisse sur un mât.
 * - Civisme : respecter le bien public (l'école, la rue, les arbres, les bornes-fontaines), ne pas gaspiller l'eau ni l'électricité,
 *   garder la rue propre. Les scènes sont des gestes d'élève, jamais des faits propres à un village.
 * - Autorités : le maire, le chef de village, le directeur d'école ; les forces de l'ordre et de secours (policier, gendarme,
 *   sapeur-pompier) et ce qu'elles font pour nous. La fiche ne dit pas ce qui distingue un policier d'un gendarme : aucun gabarit ne le
 *   demande, et ils ne sont jamais mauvais choix l'un de l'autre. HORS FICHE, À FAIRE RELIRE : « le maire travaille à la mairie »,
 *   « le directeur est responsable de tous les élèves », la suite des gestes en cas de feu, de blessé, d'enfant perdu.
 * - Diversité : le respect des différences (langues, ethnies, religions, handicap) et le cousinage à plaisanterie, qui rapproche les
 *   familles par le rire. AUCUNE langue, ethnie ni religion n'est rangée dans un groupe : ces classements se discutent. Les gabarits
 *   n'écrivent que des gestes de respect et de moquerie, et des définitions de mots.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Un choix qui nomme une personne ou une chose est un nom SEUL avec sa majuscule (« Maire », « Drapeau »), jamais « le maire » : le
 *   test des images du CI refuse « article + nom ». Un choix qui est une phrase commence par « Je », « On », « Il » ou un verbe.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 * - Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse, d'une étiquette ou d'une case.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  binSort,
  factChoice,
  factGap,
  factWriteLine,
  GESTURE_STEP_HINTS,
  pickPairs,
  stepsByLevel,
  type Fact,
  type GapFact,
  type Steps,
  type WriteFact,
} from "./ce1SciencesOutils";
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LES SYMBOLES DE LA NATION (ci-ce1-nation)
// ===========================================================================

const SYMBOL_FACTS: readonly Fact[] = [
  {
    question: "Quelle couleur est au milieu du drapeau du Sénégal ?",
    answer: "Or",
    wrong: ["Bleu", "Noir"],
    hints: ["Regarde le drapeau, de gauche à droite.", "Il y a trois bandes de couleurs.", "C'est la couleur du milieu."],
  },
  {
    question: "Quelle couleur est l'étoile du drapeau ?",
    answer: "Verte",
    wrong: ["Rouge", "Bleue"],
    hints: ["Elle est au centre du drapeau.", "Elle a cinq branches.", "Elle a la même couleur que la première bande."],
  },
  {
    question: "Combien de branches a l'étoile du drapeau ?",
    answer: "Cinq",
    wrong: ["Trois", "Sept"],
    hints: ["Compte les pointes de l'étoile.", "Une main a le même nombre de doigts.", "C'est plus que trois et moins que six."],
  },
  {
    question: "Quel est le titre de l'hymne national ?",
    answer: "Le Lion rouge",
    wrong: ["Le Baobab vert", "Le Chant du Sénégal"],
    hints: ["Le titre parle d'un animal.", "Cet animal est un grand félin.", "Sa couleur est aussi celle de la dernière bande du drapeau."],
  },
  {
    question: "Quel arbre est sur les armoiries ?",
    answer: "Baobab",
    wrong: ["Manguier", "Cocotier"],
    hints: ["C'est un arbre très gros et très vieux.", "Son tronc est énorme.", "Il pousse dans la savane."],
  },
  {
    question: "Quel animal est sur les armoiries ?",
    answer: "Lion",
    wrong: ["Cheval", "Chat"],
    hints: ["C'est un grand félin.", "On l'appelle le roi des animaux.", "Il apparaît aussi dans le titre de l'hymne."],
  },
  {
    question: "Quel symbole se chante ?",
    answer: "Hymne",
    wrong: ["Drapeau", "Armoiries"],
    hints: ["On l'écoute pendant les cérémonies.", "Il a des paroles et une musique.", "On ne peut pas le voir, on l'entend."],
  },
  {
    question: "Quel symbole flotte au vent au bout d'un mât ?",
    answer: "Drapeau",
    wrong: ["Hymne", "Devise"],
    hints: ["Il est en tissu.", "On le hisse en haut.", "Il a trois couleurs."],
  },
  {
    question: "Qui a écrit les paroles de l'hymne national ?",
    answer: "Léopold Sédar Senghor",
    wrong: ["Cheikh Anta Diop", "Ousmane Sembène"],
    hints: ["C'est un grand poète du Sénégal.", "Il a aussi été le premier président.", "Son prénom commence par la lettre L."],
  },
  {
    question: "Combien de couleurs a le drapeau du Sénégal ?",
    answer: "Trois",
    wrong: ["Deux", "Quatre"],
    hints: ["Compte les bandes.", "Il y a du vert, de l'or et du rouge.", "Ce n'est ni deux ni quatre."],
  },
  {
    question: "Quelle phrase est la devise du Sénégal ?",
    answer: "Un Peuple – Un But – Une Foi",
    wrong: ["Un Pays – Un Chant – Une Terre", "Un Roi – Un Lion – Une Loi"],
    hints: ["Elle dit que le pays est uni.", "Elle a trois morceaux qui se ressemblent.", "Chaque morceau commence par le même petit mot."],
  },
  {
    question: "Quelle couleur est la première bande du drapeau, à gauche ?",
    answer: "Vert",
    wrong: ["Rouge", "Bleu"],
    hints: ["Lis le drapeau de gauche à droite.", "C'est aussi la couleur de l'étoile.", "On la voit sur les feuilles des arbres."],
  },
  {
    question: "Quelle couleur est la dernière bande du drapeau, à droite ?",
    answer: "Rouge",
    wrong: ["Vert", "Bleu"],
    hints: ["Lis le drapeau de gauche à droite.", "C'est la couleur d'une tomate mûre.", "C'est aussi la couleur du lion de l'hymne."],
  },
];

/** « Quelle couleur est au milieu du drapeau ? » : un fait sur le drapeau, la devise, l'hymne ou les armoiries, trois fois par palier. */
export function makeCe1SymbolFact(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-symbole-qcm", "les symboles de la Nation", SYMBOL_FACTS, 3);
}

const SYMBOL_NAMES: readonly Fact[] = [
  {
    question: "Quel symbole a trois bandes de couleurs et une étoile ?",
    answer: "Drapeau",
    wrong: ["Hymne", "Devise"],
    hints: ["On peut le voir flotter.", "Il est fait de tissu.", "Il n'a ni musique ni paroles."],
  },
  {
    question: "Quel symbole est une phrase qui résume ce que veut le pays ?",
    answer: "Devise",
    wrong: ["Drapeau", "Armoiries"],
    hints: ["On peut la lire ou la dire.", "Elle a trois parties.", "Elle ne se chante pas."],
  },
  {
    question: "Quel symbole est une chanson que l'on écoute debout ?",
    answer: "Hymne",
    wrong: ["Devise", "Armoiries"],
    hints: ["Il a une musique.", "On l'entend pendant les fêtes.", "Il a des paroles."],
  },
  {
    question: "Quel symbole montre un lion et un baobab ?",
    answer: "Armoiries",
    wrong: ["Drapeau", "Hymne"],
    hints: ["C'est un dessin.", "On y voit un animal et un arbre.", "Il ressemble à un blason."],
  },
  {
    question: "Quel symbole a des paroles et une musique ?",
    answer: "Hymne",
    wrong: ["Drapeau", "Armoiries"],
    hints: ["On le chante en groupe.", "Les enfants l'apprennent par cœur.", "On ne le regarde pas."],
  },
  {
    question: "Quel symbole se hisse sur un mât ?",
    answer: "Drapeau",
    wrong: ["Devise", "Armoiries"],
    hints: ["Il monte tout en haut.", "Il bouge avec le vent.", "Il a trois couleurs."],
  },
];

/** « Quel symbole est une chanson que l'on écoute debout ? » : le symbole que décrit une phrase. */
export function makeCe1SymbolName(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-symbole-nom", "reconnaître un symbole de la Nation", SYMBOL_NAMES);
}

/** « Glisse chaque élément dans la bonne case » : ce qui est sur le drapeau, ce qui est sur les armoiries. */
export function makeCe1SymbolSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-symbole-glisser",
    "ranger ce qui est sur le drapeau et sur les armoiries",
    "Glisse chaque élément dans la bonne case.",
    { zone: "Sur le drapeau", tiles: ["Vert", "Or", "Rouge", "Étoile"] },
    { zone: "Sur les armoiries", tiles: ["Lion", "Baobab"] },
    [
      "Pense à ce que tu vois sur chacun des deux symboles.",
      "Un symbole a des couleurs, l'autre a un animal et un arbre.",
      "Les couleurs vont ensemble, l'animal et l'arbre aussi.",
    ],
  );
}

const MOTTO_SEQUENCE = ["Peuple", "But", "Foi"] as const;
const MOTTO_HINTS = ["Relis la devise dans ta tête.", "Elle se dit toujours dans le même ordre.", "Avance partie par partie."] as const;
const MOTTO_BACK_HINTS = ["Relis la devise dans ta tête.", "Pars de la fin.", "Avance partie par partie."] as const;
const MOTTO_STEPS: Steps = { prompt: "Range les trois parties de la devise du Sénégal, de la première à la dernière.", sequence: MOTTO_SEQUENCE, hints: MOTTO_HINTS };
const MOTTO_BACK_STEPS: Steps = { prompt: "Range les trois parties de la devise du Sénégal, de la dernière à la première.", sequence: [...MOTTO_SEQUENCE].reverse(), hints: MOTTO_BACK_HINTS };
const MOTTO_SAID_STEPS: Steps = { prompt: "Range ces trois parties de la devise du Sénégal, dans l'ordre où on les dit.", sequence: MOTTO_SEQUENCE, hints: MOTTO_HINTS };
const MOTTO_END_STEPS: Steps = { prompt: "Range ces trois parties de la devise du Sénégal, en partant de la fin.", sequence: [...MOTTO_SEQUENCE].reverse(), hints: MOTTO_BACK_HINTS };

/**
 * « Range les trois parties de la devise du Sénégal » : un ordre qui s'écrit, dans les deux sens. Les couleurs du drapeau ne se rangent
 * pas « de gauche à droite » : un ordre spatial sans scène à l'écran est refusé par le contrôleur, et l'enfant ne voit pas le drapeau.
 */
export function makeCe1SymbolOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-symbole-ordre", "ranger la devise dans un ordre", [MOTTO_STEPS, MOTTO_BACK_STEPS], [MOTTO_SAID_STEPS, MOTTO_END_STEPS]);
}

const SYMBOL_PAIRS: readonly (readonly [string, string])[] = [
  ["Drapeau", "Trois bandes et une étoile"],
  ["Devise", "Une phrase en trois parties"],
  ["Hymne", "Un chant aux paroles de Senghor"],
  ["Armoiries", "Un lion et un baobab"],
  ["Étoile", "Elle a cinq branches"],
];

/** « Relie chaque symbole à ce qui le décrit. » */
export function makeCe1SymbolLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-symbole-relier", "relier un symbole à ce qui le décrit", "Relie chaque symbole à ce qui le décrit.", SYMBOL_PAIRS, [
    "Lis d'abord chaque description, puis cherche le symbole qui lui va.",
    "Un symbole se chante, un autre se voit sur un mât, un autre est une suite de mots à retenir.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const SYMBOL_GAPS: readonly GapFact[] = [
  {
    text: "Le drapeau du Sénégal est vert, or et ___.",
    answer: "rouge",
    wrong: ["bleu", "noir"],
    hints: ["Cherche la couleur qui manque.", "Elle est à droite du drapeau.", "C'est la couleur d'une tomate mûre."],
  },
  {
    text: "L'étoile du drapeau est ___.",
    answer: "verte",
    wrong: ["rouge", "bleue"],
    hints: ["Elle est au centre.", "Elle a cinq branches.", "Elle est comme la première bande."],
  },
  {
    text: "Le titre de l'hymne national est « Le Lion ___ ».",
    answer: "rouge",
    wrong: ["vert", "bleu"],
    hints: ["Le titre parle d'un animal et d'une couleur.", "Cette couleur est sur le drapeau.", "C'est celle de la dernière bande."],
  },
  {
    text: "L'étoile du drapeau a ___ branches.",
    answer: "cinq",
    wrong: ["trois", "sept"],
    hints: ["Compte les pointes de l'étoile.", "Une main a le même nombre de doigts.", "C'est entre quatre et six."],
  },
  {
    text: "La devise du Sénégal commence par « Un ___ ».",
    answer: "Peuple",
    wrong: ["Roi", "Chant"],
    hints: ["Elle parle de tous les habitants.", "Ce mot désigne ceux qui vivent dans le pays.", "Il commence par la lettre P."],
  },
  {
    text: "Les armoiries montrent un lion et un ___.",
    answer: "baobab",
    wrong: ["manguier", "cocotier"],
    hints: ["C'est un arbre énorme.", "Son tronc est très large.", "Il pousse dans la savane."],
  },
  {
    text: "L'hymne national est un chant dont les paroles sont de Léopold Sédar ___.",
    answer: "Senghor",
    wrong: ["Diop", "Sembène"],
    hints: ["C'est un poète du Sénégal.", "Il a été le premier président.", "Son nom commence par la lettre S."],
  },
  {
    text: "Le ___ est hissé en haut d'un mât.",
    answer: "drapeau",
    wrong: ["hymne", "devise"],
    hints: ["Il est en tissu.", "Il flotte au vent.", "Il a trois couleurs."],
  },
  {
    text: "On chante l'___ national.",
    answer: "hymne",
    wrong: ["armoiries", "étoile"],
    hints: ["Il a une musique.", "On l'écoute debout.", "Il a des paroles."],
  },
];

/** « Le drapeau du Sénégal est vert, or et ___. » : le mot qui complète, deux fois par palier. */
export function makeCe1SymbolGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-symbole-trou", "compléter une phrase sur les symboles de la Nation", SYMBOL_GAPS, 2);
}

const SYMBOL_WRITES: readonly WriteFact[] = [
  {
    prompt: "Combien de branches a l'étoile du drapeau ? Écris le nombre.",
    accepted: ["5", "cinq"],
    hints: ["Compte les pointes de l'étoile.", "Une main a le même nombre de doigts.", "Écris le nombre en chiffre."],
  },
  {
    prompt: "Combien de couleurs a le drapeau du Sénégal ? Écris le nombre.",
    accepted: ["3", "trois"],
    hints: ["Compte les bandes.", "Il y a du vert, de l'or et du rouge.", "Écris le nombre en chiffre."],
  },
  {
    prompt: "Quel arbre est sur les armoiries ? Écris le mot.",
    accepted: ["baobab", "le baobab", "un baobab"],
    hints: ["C'est un arbre très gros.", "Son tronc est énorme.", "Le mot commence par la lettre b."],
  },
  {
    prompt: "Quel animal est sur les armoiries ? Écris le mot.",
    accepted: ["lion", "le lion", "un lion"],
    hints: ["C'est un grand félin.", "On l'appelle le roi des animaux.", "Le mot commence par la lettre l."],
  },
  {
    prompt: "De quelle couleur est l'étoile du drapeau ? Écris le mot.",
    accepted: ["verte", "vert", "une étoile verte"],
    hints: ["Elle est au centre du drapeau.", "C'est la couleur de la première bande.", "Le mot commence par la lettre v."],
  },
  {
    prompt: "Quel symbole se chante ? Écris le mot.",
    accepted: ["hymne", "l'hymne", "un hymne"],
    hints: ["Il a une musique et des paroles.", "On l'écoute pendant les fêtes.", "Le mot commence par la lettre h."],
  },
];

/** « Combien de branches a l'étoile du drapeau ? Écris le nombre. » : un nombre ou un mot à écrire. */
export function makeCe1SymbolWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-symbole-ecrire", "écrire un fait sur les symboles de la Nation", SYMBOL_WRITES);
}

// ===========================================================================
// LE CIVISME (ci-ce1-civisme)
// ===========================================================================

const CIVIC_SITUATIONS: readonly Fact[] = [
  {
    question: "Tu vois un robinet ouvert dans la cour. Que fais-tu ?",
    answer: "Je le ferme",
    wrong: ["Je le laisse couler", "Je joue avec l'eau"],
    hints: ["L'eau ne doit pas se perdre.", "Un geste de la main suffit.", "Pense aux autres, qui ont aussi besoin d'eau."],
  },
  {
    question: "Tu as fini de boire à la borne-fontaine. Que fais-tu ?",
    answer: "Je ferme le robinet",
    wrong: ["Je laisse l'eau couler", "Je m'éloigne en courant"],
    hints: ["La borne sert à tout le monde.", "L'eau est précieuse.", "Elle ne doit pas couler pour rien."],
  },
  {
    question: "Tu es le dernier à quitter la classe et la lampe est allumée. Que fais-tu ?",
    answer: "J'éteins la lumière",
    wrong: ["Je la laisse allumée", "Je joue avec l'interrupteur"],
    hints: ["Personne n'a besoin de clarté.", "Cela évite de gaspiller du courant.", "Un seul geste suffit."],
  },
  {
    question: "Tu vois un papier par terre dans la cour. Que fais-tu ?",
    answer: "Je le jette à la poubelle",
    wrong: ["Je le laisse par terre", "Je le cache sous un banc"],
    hints: ["La cour doit rester propre.", "Un endroit est prévu pour les déchets.", "Tu peux le ramasser."],
  },
  {
    question: "Tu manges une mangue dans la rue. Que fais-tu de la peau ?",
    answer: "Je la mets dans une poubelle",
    wrong: ["Je la jette par terre", "Je la lance sur un ami"],
    hints: ["La rue appartient à tout le monde.", "Elle doit rester propre.", "Cherche l'endroit fait pour les restes."],
  },
  {
    question: "Un ami veut casser une branche d'un arbre. Que fais-tu ?",
    answer: "Je lui dis de ne pas le faire",
    wrong: ["Je l'aide à la casser", "Je ne dis rien"],
    hints: ["Un arbre est vivant.", "Il donne de l'ombre à tous.", "Un bon ami donne un bon conseil."],
  },
  {
    question: "Un camarade écrit sur le mur de l'école. Que fais-tu ?",
    answer: "Je lui dis d'arrêter",
    wrong: ["J'écris aussi sur le mur", "Je ris et je regarde"],
    hints: ["Le mur doit rester propre.", "Tout le monde le voit.", "Un bon camarade dit non."],
  },
  {
    question: "Tu vois un jeune arbre qui manque d'eau. Que fais-tu ?",
    answer: "Je l'arrose",
    wrong: ["Je le piétine", "Je le coupe"],
    hints: ["Il a soif.", "Un seau d'eau peut l'aider.", "Prendre soin, c'est donner ce qui manque."],
  },
  {
    question: "Tu te laves les mains. Que fais-tu du robinet pendant que tu savonnes ?",
    answer: "Je le ferme",
    wrong: ["Je le laisse ouvert", "Je l'ouvre plus fort"],
    hints: ["Tu n'as pas besoin d'eau à ce moment-là.", "L'eau est précieuse.", "Tu le rouvres pour rincer."],
  },
  {
    question: "La rue devant l'école est sale. Que peux-tu faire ?",
    answer: "Ramasser les déchets",
    wrong: ["Attendre que ça passe", "Jeter mes déchets aussi"],
    hints: ["Chacun peut aider.", "Un petit geste rend la rue propre.", "Tu peux le faire avec des amis."],
  },
  {
    question: "Tu vois une borne-fontaine qui fuit. Que fais-tu ?",
    answer: "Je préviens un adulte",
    wrong: ["Je ne dis rien", "Je casse le robinet"],
    hints: ["L'eau se perd.", "Quelqu'un doit la réparer.", "Quelqu'un de plus grand saura quoi faire."],
  },
  {
    question: "Tu joues dans la rue. Où mets-tu l'emballage de ton biscuit ?",
    answer: "Dans une poubelle",
    wrong: ["Sur le trottoir", "Dans la rue"],
    hints: ["Il ne doit pas rester dehors.", "La rue doit rester propre.", "Un seau est prévu pour cela."],
  },
  {
    question: "Tu utilises un banc de l'école. Comment en prendre soin ?",
    answer: "Je ne le salis pas",
    wrong: ["Je dessine dessus", "Je saute dessus avec mes chaussures"],
    hints: ["Les autres s'en serviront aussi.", "Il doit rester en bon état.", "Un banc n'est pas un jeu."],
  },
];

/** « Tu vois un robinet ouvert dans la cour. Que fais-tu ? » : le bon geste d'élève, trois fois par palier. */
export function makeCe1CivicSituation(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-civisme-situation", "le bon geste pour le bien public", CIVIC_SITUATIONS, 3);
}

const CIVIC_WHY: readonly Fact[] = [
  {
    question: "Pourquoi éteint-on la lumière en sortant ?",
    answer: "Pour ne pas gaspiller le courant",
    wrong: ["Pour faire plaisir à la lampe", "Pour que la nuit tombe"],
    hints: ["Cela coûte cher.", "Une lampe allumée sans raison en consomme.", "Il faut en garder un peu."],
  },
  {
    question: "Pourquoi ne casse-t-on pas les branches d'un arbre ?",
    answer: "Parce qu'il est vivant",
    wrong: ["Parce qu'elles sont lourdes", "Parce que cela fait du bruit"],
    hints: ["Un arbre peut souffrir.", "Il donne de l'ombre.", "Il faut respecter ce qui vit."],
  },
  {
    question: "Pourquoi garde-t-on la rue propre ?",
    answer: "Pour que chacun s'y sente bien",
    wrong: ["Pour faire du bruit", "Pour cacher les maisons"],
    hints: ["La rue sert à tous.", "Personne n'aime marcher dans les déchets.", "Une rue propre fait plaisir."],
  },
  {
    question: "Pourquoi respecte-t-on les bornes-fontaines ?",
    answer: "Elles servent à tout le monde",
    wrong: ["Elles sont à moi seul", "Elles ne servent à rien"],
    hints: ["Beaucoup de gens y puisent de l'eau.", "Ce qui profite à chacun doit durer.", "Si on la casse, personne n'en profite."],
  },
  {
    question: "Pourquoi respecte-t-on l'école ?",
    answer: "Elle sert à tous les élèves",
    wrong: ["Elle est à moi seul", "Elle n'est pas importante"],
    hints: ["Des enfants y viennent chaque jour.", "Ce qui profite à chacun doit durer.", "Tu y apprends avec tes camarades."],
  },
  {
    question: "Pourquoi ferme-t-on le robinet quand on a fini ?",
    answer: "Pour ne pas gaspiller l'eau",
    wrong: ["Pour qu'il brille", "Pour qu'il soit lourd"],
    hints: ["Une eau qui coule se perd.", "On en aura besoin plus tard.", "Elle est précieuse."],
  },
];

/** « Pourquoi éteint-on la lumière en sortant ? » : la raison d'un geste. */
export function makeCe1CivicWhy(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-civisme-pourquoi", "pourquoi prendre soin du bien public", CIVIC_WHY);
}

/** « Glisse chaque geste dans la bonne case » : ce qui protège le bien commun, ce qui l'abîme. */
export function makeCe1CivicSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-civisme-glisser",
    "ranger les gestes qui protègent ou abîment le bien commun",
    "Glisse chaque geste dans la bonne case.",
    { zone: "Protège le bien commun", tiles: ["Ramasser un papier", "Fermer le robinet", "Éteindre la lampe", "Arroser un arbre", "Jeter à la poubelle"] },
    { zone: "Abîme le bien commun", tiles: ["Casser une branche", "Écrire sur un mur", "Gaspiller l'eau", "Jeter un papier par terre", "Laisser la lampe allumée"] },
    [
      "Pense à ce qui sert à tout le monde.",
      "Un geste qui garde les choses propres et en état est un bon geste.",
      "Un geste qui salit ou qui détruit est un mauvais geste.",
    ],
  );
}

const CIVIC_PAIRS: readonly (readonly [string, string])[] = [
  ["École", "Je ne salis pas les murs"],
  ["Rue", "Je jette mes papiers à la poubelle"],
  ["Arbre", "Je ne casse pas ses branches"],
  ["Borne-fontaine", "Je ferme le robinet après avoir bu"],
  ["Lampe", "J'éteins quand je sors"],
];

/** « Relie chaque bien commun à un bon geste. » */
export function makeCe1CivicLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-civisme-relier", "relier un bien commun à un bon geste", "Relie chaque bien commun à un bon geste.", CIVIC_PAIRS, [
    "Lis d'abord chaque geste, puis cherche ce qu'il protège.",
    "Un geste parle d'eau, un autre de propreté, un autre de la nature.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const STREET_SHORT: Steps = {
  prompt: "Pour garder la rue propre, mets ces gestes du premier au dernier.",
  sequence: ["Je vois un papier", "Je le ramasse", "Je le jette à la poubelle"],
  hints: GESTURE_STEP_HINTS,
};
const STREET_LONG: Steps = {
  prompt: "Pour garder la rue propre, mets ces gestes du premier au dernier.",
  sequence: ["Je me promène dans la rue", "Je vois un papier", "Je le ramasse", "Je le jette à la poubelle"],
  hints: GESTURE_STEP_HINTS,
};
const WATER_SHORT: Steps = {
  prompt: "Pour ne pas gaspiller l'eau, mets ces gestes du premier au dernier.",
  sequence: ["J'ouvre le robinet", "Je me lave les mains", "Je ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};
const WATER_LONG: Steps = {
  prompt: "Pour ne pas gaspiller l'eau, mets ces gestes du premier au dernier.",
  sequence: ["Je prends mon seau", "J'ouvre le robinet", "Je remplis mon seau", "Je ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};
const CLASS_SHORT: Steps = {
  prompt: "Pour quitter la classe, mets ces gestes du premier au dernier.",
  sequence: ["Je range mes affaires", "J'éteins la lampe", "Je ferme la porte"],
  hints: GESTURE_STEP_HINTS,
};
const CLASS_LONG: Steps = {
  prompt: "Pour quitter la classe, mets ces gestes du premier au dernier.",
  sequence: ["Je range mes affaires", "Je pousse ma chaise", "J'éteins la lampe", "Je ferme la porte"],
  hints: GESTURE_STEP_HINTS,
};
const TREE_SHORT: Steps = {
  prompt: "Pour arroser un arbre, mets ces gestes du premier au dernier.",
  sequence: ["Je remplis un seau d'eau", "Je porte le seau à l'arbre", "Je verse l'eau au pied"],
  hints: GESTURE_STEP_HINTS,
};
const TREE_LONG: Steps = {
  prompt: "Pour arroser un arbre, mets ces gestes du premier au dernier.",
  sequence: ["Je prends un seau", "Je remplis le seau d'eau", "Je porte le seau à l'arbre", "Je verse l'eau au pied"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour garder la rue propre, mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1CivicOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-civisme-ordre", "ranger les gestes d'un bon geste", [STREET_SHORT, WATER_SHORT, CLASS_SHORT, TREE_SHORT], [STREET_LONG, WATER_LONG, CLASS_LONG, TREE_LONG]);
}

const CIVIC_GAPS: readonly GapFact[] = [
  {
    text: "On ferme le ___ pour ne pas gaspiller l'eau.",
    answer: "robinet",
    wrong: ["balai", "cartable"],
    hints: ["L'eau y coule.", "On tourne la poignée.", "On le trouve à la borne ou à l'évier."],
  },
  {
    text: "On jette les papiers à la ___.",
    answer: "poubelle",
    wrong: ["fenêtre", "table"],
    hints: ["Elle reçoit les déchets.", "Elle garde la cour propre.", "On la trouve dans la classe."],
  },
  {
    text: "On éteint la ___ en sortant de la classe.",
    answer: "lumière",
    wrong: ["porte", "chaise"],
    hints: ["Elle éclaire quand elle est allumée.", "On appuie sur un bouton.", "Elle ne sert à rien dans une pièce vide."],
  },
  {
    text: "On ne casse pas les ___ des arbres.",
    answer: "branches",
    wrong: ["livres", "bancs"],
    hints: ["Elles portent les feuilles.", "Elles sont attachées au tronc.", "Elles donnent de l'ombre."],
  },
  {
    text: "L'école est un bien qui sert à tous les ___.",
    answer: "élèves",
    wrong: ["chats", "oiseaux"],
    hints: ["Ils y viennent chaque matin.", "Tu en es un.", "Ils apprennent avec leurs camarades."],
  },
  {
    text: "On n'écrit pas sur les ___ de l'école.",
    answer: "murs",
    wrong: ["nuages", "vents"],
    hints: ["Ils tiennent le toit.", "Ils doivent rester propres.", "On les voit de loin."],
  },
  {
    text: "Une rue propre est une rue sans ___.",
    answer: "déchets",
    wrong: ["arbres", "maisons"],
    hints: ["Ils salissent.", "On les met à la poubelle.", "Personne ne veut marcher dedans."],
  },
  {
    text: "On arrose un jeune arbre avec de l'___.",
    answer: "eau",
    wrong: ["encre", "huile"],
    hints: ["C'est un liquide.", "Les plantes en ont besoin.", "Elle coule du robinet."],
  },
  {
    text: "Une eau qui coule pour rien est une eau ___.",
    answer: "gaspillée",
    wrong: ["bue", "claire"],
    hints: ["Elle est perdue.", "Personne n'en profite.", "Ce n'est pas un bon geste."],
  },
];

/** « On ferme le ___ pour ne pas gaspiller l'eau. » : le mot qui complète, deux fois par palier. */
export function makeCe1CivicGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-civisme-trou", "compléter une phrase sur le civisme", CIVIC_GAPS, 2);
}

const CIVIC_WRITES: readonly WriteFact[] = [
  {
    prompt: "Que ferme-t-on après avoir bu à la borne-fontaine ? Écris le mot.",
    accepted: ["robinet", "le robinet", "un robinet"],
    hints: ["L'eau y coule.", "Il se tourne avec la main.", "Le mot commence par la lettre r."],
  },
  {
    prompt: "Où jette-t-on un papier dans la rue ? Écris le mot.",
    accepted: ["poubelle", "la poubelle", "une poubelle"],
    hints: ["Elle reçoit les déchets.", "Elle garde la rue propre.", "Le mot commence par la lettre p."],
  },
  {
    prompt: "Que fait-on pour donner à boire à un arbre ? Écris le verbe.",
    accepted: ["arroser", "l'arroser", "arrose"],
    hints: ["On verse de l'eau.", "On le fait avec un seau.", "Le mot commence par la lettre a."],
  },
  {
    prompt: "Quel objet éteint-on en sortant d'une classe vide ? Écris le mot.",
    accepted: ["lumière", "la lumière", "une lumière"],
    hints: ["Elle éclaire la pièce.", "On appuie sur un bouton.", "Le mot commence par la lettre l."],
  },
];

/** « Que ferme-t-on après avoir bu à la borne-fontaine ? Écris le mot. » : un mot à écrire, de la liste fermée. */
export function makeCe1CivicWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-civisme-ecrire", "écrire un mot du civisme", CIVIC_WRITES);
}

// ===========================================================================
// RESPECTER LES AUTORITÉS (ci-ce1-autorites)
// ===========================================================================

const AUTHORITY_WHO: readonly Fact[] = [
  {
    question: "Qui dirige la commune ?",
    answer: "Maire",
    wrong: ["Sapeur-pompier", "Directeur d'école"],
    hints: ["Il est élu par les habitants.", "Il travaille à la mairie.", "Il s'occupe de la commune."],
  },
  {
    question: "Qui prend les décisions importantes pour un village ?",
    answer: "Chef de village",
    wrong: ["Policier", "Sapeur-pompier"],
    hints: ["Il est respecté par les habitants.", "Il connaît tout le monde.", "Il dirige un endroit où vivent des familles."],
  },
  {
    question: "Qui éteint les incendies ?",
    answer: "Sapeur-pompier",
    wrong: ["Maire", "Directeur d'école"],
    hints: ["Il arrive avec un camion rouge.", "Il utilise une grande lance.", "Il vient quand une maison brûle."],
  },
  {
    question: "Qui dirige l'école ?",
    answer: "Directeur d'école",
    wrong: ["Maire", "Gendarme"],
    hints: ["Il connaît tous les maîtres.", "Il travaille là où tu apprends.", "Son bureau est près de ta classe."],
  },
  {
    question: "Qui protège les gens et fait respecter la loi ?",
    answer: "Policier",
    wrong: ["Sapeur-pompier", "Directeur d'école"],
    hints: ["Il porte un uniforme.", "Il fait partie des forces de l'ordre.", "Il aide quand quelqu'un est en danger."],
  },
  {
    question: "Qui, comme le policier, protège les gens et fait respecter la loi ?",
    answer: "Gendarme",
    wrong: ["Maire", "Chef de village"],
    hints: ["Il porte un uniforme.", "Il fait respecter les règles.", "Il aide les gens."],
  },
  {
    question: "Qui travaille à la mairie ?",
    answer: "Maire",
    wrong: ["Sapeur-pompier", "Directeur d'école"],
    hints: ["Il dirige une commune.", "Les habitants l'ont choisi.", "Son bureau est dans un grand bâtiment public."],
  },
  {
    question: "Qui dirige tout un village, avec sagesse ?",
    answer: "Chef de village",
    wrong: ["Directeur d'école", "Gendarme"],
    hints: ["Il vit parmi les habitants.", "On lui demande conseil.", "On l'écoute avec respect."],
  },
  {
    question: "Qui est responsable de tous les élèves de l'école ?",
    answer: "Directeur d'école",
    wrong: ["Maire", "Policier"],
    hints: ["Il veille sur tous les élèves.", "Les maîtres travaillent avec lui.", "Tu le croises dans la cour."],
  },
  {
    question: "Qui vient quand une maison brûle ?",
    answer: "Sapeur-pompier",
    wrong: ["Maire", "Chef de village"],
    hints: ["Il porte un casque.", "Il arrive vite avec un camion.", "Il éteint les flammes."],
  },
  {
    question: "Qui, comme le gendarme, protège les gens et fait respecter la loi ?",
    answer: "Policier",
    wrong: ["Maire", "Directeur d'école"],
    hints: ["Il porte un uniforme.", "Il fait respecter les règles.", "Il aide les gens."],
  },
  {
    question: "Qui, avec le policier, fait partie des forces de l'ordre ?",
    answer: "Gendarme",
    wrong: ["Sapeur-pompier", "Directeur d'école"],
    hints: ["Il veille sur la population.", "Il porte un uniforme.", "Il fait respecter les règles."],
  },
];

/** « Qui dirige la commune ? » : l'autorité qui a ce rôle, trois fois par palier. Chaque trio de lignes (une part par niveau) a trois réponses différentes. */
export function makeCe1AuthorityWho(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-autorite-qui", "qui a quel rôle", AUTHORITY_WHO, 3);
}

const AUTHORITY_ROLE: readonly Fact[] = [
  {
    question: "Que fait le maire ?",
    answer: "Il dirige la commune",
    wrong: ["Il éteint les incendies", "Il enseigne aux élèves"],
    hints: ["Les habitants l'ont élu.", "Il s'occupe de tous les quartiers.", "Il travaille à la mairie."],
  },
  {
    question: "Que fait le chef de village ?",
    answer: "Il dirige le village",
    wrong: ["Il éteint les incendies", "Il vend des fruits"],
    hints: ["Il est respecté de tous.", "Les habitants lui demandent conseil.", "Il prend des décisions."],
  },
  {
    question: "Que fait le directeur d'école ?",
    answer: "Il dirige l'école",
    wrong: ["Il éteint les incendies", "Il conduit un camion"],
    hints: ["Il travaille avec les maîtres.", "Il veille sur les élèves.", "Son bureau est près des classes."],
  },
  {
    question: "Que fait le sapeur-pompier ?",
    answer: "Il éteint les incendies",
    wrong: ["Il dirige la commune", "Il vend des fruits"],
    hints: ["Il porte un casque.", "Il arrive avec un camion.", "Il secourt aussi les personnes en danger."],
  },
  {
    question: "Que fait le policier ?",
    answer: "Il protège les gens",
    wrong: ["Il dirige un village", "Il éteint les incendies"],
    hints: ["Il porte un uniforme.", "Il fait respecter les règles.", "Il fait partie des forces de l'ordre."],
  },
  {
    question: "Que fait le gendarme ?",
    answer: "Il protège les gens",
    wrong: ["Il dirige la commune", "Il enseigne aux élèves"],
    hints: ["Il porte un uniforme.", "Il fait respecter les règles.", "Il fait partie des forces de l'ordre."],
  },
];

/** « Que fait le maire ? » : ce que fait une autorité. */
export function makeCe1AuthorityRole(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-autorite-role", "ce que fait une autorité", AUTHORITY_ROLE);
}

/** « Glisse chaque personne dans la bonne case » : ceux qui dirigent un lieu, ceux qui protègent et secourent. */
export function makeCe1AuthoritySort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-autorite-glisser",
    "ranger les autorités selon ce qu'elles font",
    "Glisse chaque personne dans la bonne case.",
    { zone: "Dirige un lieu", tiles: ["Maire", "Chef de village", "Directeur d'école"] },
    { zone: "Protège et secourt", tiles: ["Policier", "Gendarme", "Sapeur-pompier"] },
    [
      "Pense à ce que fait chaque personne pour nous.",
      "Certaines prennent les décisions d'un endroit, d'autres veillent sur la sécurité.",
      "Les uniformes sont du côté de la sécurité.",
    ],
  );
}

const AUTHORITY_PAIRS: readonly (readonly [string, string])[] = [
  ["Maire", "Il dirige la commune"],
  ["Chef de village", "Il dirige le village"],
  ["Directeur d'école", "Il dirige l'école"],
  ["Sapeur-pompier", "Il éteint les incendies"],
  ["Policier", "Il protège les gens et fait respecter la loi"],
];

/** « Relie chaque personne à son rôle. » */
export function makeCe1AuthorityLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-autorite-relier", "relier une autorité à son rôle", "Relie chaque personne à son rôle.", AUTHORITY_PAIRS, [
    "Lis d'abord chaque rôle, puis cherche qui le tient.",
    "Trois rôles disent diriger, mais ils ne dirigent pas le même endroit.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const FIRE_SHORT: Steps = {
  prompt: "Il y a un incendie. Mets ces faits du premier au dernier.",
  sequence: ["Un feu se déclare", "Un adulte appelle les secours", "Les sapeurs-pompiers éteignent le feu"],
  hints: ["Pense à ce qui arrive d'abord, puis à ce qui suit.", "Chaque fait amène le suivant.", "Le dernier fait vient de tous les autres."],
};
const FIRE_LONG: Steps = {
  prompt: "Il y a un incendie. Mets ces faits du premier au dernier.",
  sequence: ["Un feu se déclare", "On s'éloigne du feu", "Un adulte appelle les secours", "Les sapeurs-pompiers éteignent le feu"],
  hints: ["Pense à ce qui arrive d'abord, puis à ce qui suit.", "Chaque fait amène le suivant.", "Le dernier fait vient de tous les autres."],
};
const HURT_SHORT: Steps = {
  prompt: "Une personne est blessée. Mets ces gestes du premier au dernier.",
  sequence: ["Je préviens un adulte", "Les secours arrivent", "La personne est soignée"],
  hints: GESTURE_STEP_HINTS,
};
const HURT_LONG: Steps = {
  prompt: "Une personne est blessée. Mets ces gestes du premier au dernier.",
  sequence: ["Une personne tombe", "Je préviens un adulte", "Les secours arrivent", "La personne est soignée"],
  hints: GESTURE_STEP_HINTS,
};
const LOST_SHORT: Steps = {
  prompt: "Tu es perdu dans la rue. Mets ces gestes du premier au dernier.",
  sequence: ["Je reste calme", "Je cherche un policier", "Il m'aide à retrouver ma famille"],
  hints: GESTURE_STEP_HINTS,
};
const LOST_LONG: Steps = {
  prompt: "Tu es perdu dans la rue. Mets ces gestes du premier au dernier.",
  sequence: ["Je me rends compte que je suis perdu", "Je reste calme", "Je cherche un policier", "Il m'aide à retrouver ma famille"],
  hints: GESTURE_STEP_HINTS,
};

/** « Il y a un incendie. Mets ces faits du premier au dernier. » : une suite qui suit la logique des choses. */
export function makeCe1AuthorityOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-autorite-ordre", "ranger ce qui se passe quand les secours viennent", [FIRE_SHORT, HURT_SHORT, LOST_SHORT], [FIRE_LONG, HURT_LONG, LOST_LONG]);
}

const AUTHORITY_GAPS: readonly GapFact[] = [
  {
    text: "Le ___ dirige la commune.",
    answer: "maire",
    wrong: ["pompier", "gendarme"],
    hints: ["Il est élu par les habitants.", "Il travaille à la mairie.", "Il s'occupe de tous les quartiers."],
  },
  {
    text: "Le ___ dirige l'école.",
    answer: "directeur",
    wrong: ["maire", "policier"],
    hints: ["Il veille sur tous les élèves.", "Il travaille avec les maîtres.", "Son bureau est près des classes."],
  },
  {
    text: "Le chef de ___ dirige le village.",
    answer: "village",
    wrong: ["rue", "classe"],
    hints: ["C'est là où vivent les habitants.", "On y trouve des maisons et un marché.", "Il est plus petit qu'une ville."],
  },
  {
    text: "Le sapeur-pompier éteint les ___.",
    answer: "incendies",
    wrong: ["fruits", "chants"],
    hints: ["Ce sont de grands feux.", "Ils font de la fumée.", "Ils sont dangereux."],
  },
  {
    text: "Le policier protège les ___.",
    answer: "gens",
    wrong: ["livres", "tambours"],
    hints: ["Il veille sur les habitants.", "Il aide ceux qui sont en danger.", "Tu en fais partie."],
  },
  {
    text: "La commune est dirigée par le ___.",
    answer: "maire",
    wrong: ["directeur", "pompier"],
    hints: ["Les habitants l'ont élu.", "Il a une écharpe aux couleurs du pays.", "Il travaille à la mairie."],
  },
  {
    text: "Le directeur est le chef de l'___.",
    answer: "école",
    wrong: ["village", "commune"],
    hints: ["C'est là que tu apprends.", "Tu y vas chaque matin.", "Les élèves y ont leurs classes."],
  },
  {
    text: "Le gendarme et le policier font partie des forces de l'___.",
    answer: "ordre",
    wrong: ["école", "village"],
    hints: ["Elles font respecter les règles.", "Elles veillent sur la population.", "Le mot commence par la lettre o."],
  },
  {
    text: "Le sapeur-pompier fait partie des forces de ___.",
    answer: "secours",
    wrong: ["jeux", "classe"],
    hints: ["Elles viennent aider en cas de danger.", "Elles sauvent des personnes.", "Le mot commence par la lettre s."],
  },
];

/** « Le ___ dirige la commune. » : le mot qui complète, deux fois par palier. */
export function makeCe1AuthorityGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-autorite-trou", "compléter une phrase sur les autorités", AUTHORITY_GAPS, 2);
}

const AUTHORITY_WRITES: readonly WriteFact[] = [
  {
    prompt: "Qui dirige la commune ? Écris le mot.",
    accepted: ["maire", "le maire", "la maire"],
    hints: ["Les habitants l'ont élu.", "Il travaille à la mairie.", "Le mot commence par la lettre m."],
  },
  {
    prompt: "Qui éteint les incendies ? Écris le mot.",
    accepted: ["pompier", "sapeur-pompier", "un pompier", "le pompier", "le sapeur-pompier"],
    hints: ["Il arrive avec un camion rouge.", "Il porte un casque.", "Le mot commence par la lettre p."],
  },
  {
    prompt: "Qui dirige l'école ? Écris le mot.",
    accepted: ["directeur", "le directeur", "la directrice", "directrice"],
    hints: ["Il veille sur tous les élèves.", "Il travaille avec les maîtres.", "Le mot commence par la lettre d."],
  },
  {
    prompt: "Qui dirige un village ? Écris le mot.",
    accepted: ["chef", "le chef", "chef de village", "le chef de village"],
    hints: ["Il est respecté de tous.", "Les habitants lui demandent conseil.", "Le mot commence par la lettre c."],
  },
];

/** « Qui dirige la commune ? Écris le mot. » : un mot à écrire, de la liste fermée. */
export function makeCe1AuthorityWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-autorite-ecrire", "écrire le nom d'une autorité", AUTHORITY_WRITES);
}

// ===========================================================================
// NOS DIFFÉRENCES, NOTRE RICHESSE (ci-ce1-diversite)
// ===========================================================================

const DIFF_SITUATIONS: readonly Fact[] = [
  {
    question: "Un nouvel élève arrive et ne connaît personne. Que fais-tu ?",
    answer: "Je lui dis bonjour",
    wrong: ["Je l'ignore", "Je me moque de lui"],
    hints: ["Il se sent seul.", "Un mot gentil lui fera du bien.", "Tu peux le faire en souriant."],
  },
  {
    question: "Un camarade parle une autre langue à la maison. Que fais-tu ?",
    answer: "Je lui demande un mot",
    wrong: ["Je me moque de ses mots", "Je lui dis de se taire"],
    hints: ["Une autre langue est une richesse.", "Tu peux apprendre quelque chose.", "Sois curieux."],
  },
  {
    question: "Un ami prie d'une autre façon que toi. Que fais-tu ?",
    answer: "Je le respecte",
    wrong: ["Je me moque de lui", "Je l'empêche de prier"],
    hints: ["Chacun a sa façon de croire.", "Personne ne doit être moqué pour cela.", "Écoute et laisse-le faire."],
  },
  {
    question: "Un camarade se déplace en fauteuil roulant. Que fais-tu à la récréation ?",
    answer: "Je l'invite à jouer",
    wrong: ["Je joue sans lui", "Je me moque de son fauteuil"],
    hints: ["Il aime s'amuser comme toi.", "Choisis un jeu où il peut venir.", "Personne ne doit rester seul."],
  },
  {
    question: "Un enfant a un accent différent du tien. Que fais-tu ?",
    answer: "Je l'écoute avec attention",
    wrong: ["Je répète son accent pour rire", "Je ne l'écoute pas"],
    hints: ["Il vient peut-être d'un autre endroit.", "Se moquer fait de la peine.", "Une autre façon de parler est une richesse."],
  },
  {
    question: "Deux amis parlent des langues différentes. Que peuvent-ils faire ?",
    answer: "S'apprendre des mots",
    wrong: ["Se disputer", "Ne plus se parler"],
    hints: ["Ils veulent se comprendre.", "Chacun peut enseigner à l'autre.", "C'est amusant."],
  },
  {
    question: "Une camarade porte de grosses lunettes. Que fais-tu ?",
    answer: "Je joue avec elle",
    wrong: ["Je me moque d'elle", "Je lui prends ses lunettes"],
    hints: ["Ces verres l'aident à bien voir.", "C'est une enfant comme toi.", "Un bon camarade n'exclut personne."],
  },
  {
    question: "Un élève ne voit pas bien le tableau. Comment peux-tu l'aider ?",
    answer: "Je lui lis ce qui est écrit",
    wrong: ["Je cache le tableau", "Je ris de lui"],
    hints: ["Il a besoin de ton aide.", "Tu peux le faire à voix basse.", "Aider fait plaisir à deux."],
  },
  {
    question: "Un enfant fête une autre fête que toi. Que fais-tu ?",
    answer: "Je lui souhaite une bonne fête",
    wrong: ["Je lui dis que sa fête est nulle", "Je ne lui parle plus"],
    hints: ["Chaque famille a ses fêtes.", "Un mot gentil fait plaisir.", "Il sera content de ton geste."],
  },
  {
    question: "Un camarade est plus lent que les autres pour courir. Que fais-tu ?",
    answer: "Je l'encourage",
    wrong: ["Je me moque de lui", "Je pars sans l'attendre"],
    hints: ["Chacun va à son rythme.", "Un mot gentil donne du courage.", "Tu peux courir à côté de lui."],
  },
  {
    question: "Tu entends une chanson dans une langue que tu ne connais pas. Que fais-tu ?",
    answer: "J'écoute avec curiosité",
    wrong: ["Je mets mes mains sur les oreilles", "Je dis que c'est bête"],
    hints: ["Une chanson raconte quelque chose.", "Tu peux aimer sans comprendre.", "Sois curieux."],
  },
  {
    question: "Un nouvel élève vient d'un autre village. Que fais-tu ?",
    answer: "Je lui montre l'école",
    wrong: ["Je me moque de son village", "Je l'évite"],
    hints: ["Il ne connaît pas encore les lieux.", "Tu peux faire le tour avec lui.", "Il se sentira accueilli."],
  },
  {
    question: "Un camarade entend mal. Que fais-tu pour lui parler ?",
    answer: "Je le regarde et je parle clairement",
    wrong: ["Je lui tourne le dos", "Je crie très fort"],
    hints: ["Il lit aussi sur tes lèvres.", "Face à face, c'est plus facile.", "Dis les mots doucement et nettement."],
  },
];

/** « Un nouvel élève arrive et ne connaît personne. Que fais-tu ? » : le geste de respect, trois fois par palier. */
export function makeCe1DiffSituation(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-diff-situation", "le geste qui respecte les différences", DIFF_SITUATIONS, 3);
}

const DIFF_FACTS: readonly Fact[] = [
  {
    question: "Que veut dire respecter les différences ?",
    answer: "Accepter chacun comme il est",
    wrong: ["Faire comme tout le monde", "Se moquer des autres"],
    hints: ["Personne n'est pareil.", "Tout le monde a le droit d'être lui-même.", "On ne juge pas."],
  },
  {
    question: "Que fait le cousinage à plaisanterie ?",
    answer: "Il rapproche les familles par le rire",
    wrong: ["Il sépare les familles", "Il fâche les amis"],
    hints: ["Des proches se taquinent gentiment.", "On s'amuse et cela crée des liens.", "On ne se fâche pas."],
  },
  {
    question: "Au Sénégal, combien de langues parle-t-on ?",
    answer: "Plusieurs langues",
    wrong: ["Une seule langue", "Aucune langue"],
    hints: ["Les familles ne parlent pas toutes pareil.", "Chaque région a ses mots.", "C'est une richesse."],
  },
  {
    question: "Pourquoi les différences sont-elles une richesse ?",
    answer: "On apprend les uns des autres",
    wrong: ["On se dispute plus", "On s'ennuie"],
    hints: ["Chacun sait des choses que tu ne sais pas.", "On découvre de nouvelles idées.", "On grandit ensemble."],
  },
  {
    question: "Que fait-on avec un cousin à plaisanterie ?",
    answer: "On se taquine pour rire",
    wrong: ["On se bat", "On se fâche"],
    hints: ["C'est une tradition amusante.", "Personne n'est blessé.", "On rit ensemble."],
  },
  {
    question: "Que peut-on apprendre d'un ami qui parle une autre langue ?",
    answer: "De nouveaux mots",
    wrong: ["À se moquer", "À se fâcher"],
    hints: ["Il t'en dit quelques-uns.", "Tu peux les répéter.", "Tu t'enrichis."],
  },
];

/** « Que fait le cousinage à plaisanterie ? » : une définition, un fait de cours. */
export function makeCe1DiffFact(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-diff-mot", "les mots des différences", DIFF_FACTS);
}

/** « Glisse chaque geste dans la bonne case » : ce qui respecte les différences, ce qui ne les respecte pas. */
export function makeCe1DiffSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-diff-glisser",
    "ranger les gestes qui respectent ou non les différences",
    "Glisse chaque geste dans la bonne case.",
    { zone: "Respecte les autres", tiles: ["Écouter un ami", "Inviter un camarade", "Dire bonjour", "Apprendre un mot", "Partager son goûter"] },
    { zone: "Ne respecte pas", tiles: ["Se moquer d'un ami", "Dire que c'est nul", "Laisser un enfant seul", "Refuser de jouer", "Imiter pour blesser"] },
    [
      "Pense à ce qui fait plaisir à l'autre.",
      "Un geste gentil accueille, un geste méchant éloigne.",
      "Demande-toi si tu aimerais qu'on te le fasse.",
    ],
  );
}

const DIFF_PAIRS: readonly (readonly [string, string])[] = [
  ["Langue", "Ce que l'on parle pour se comprendre"],
  ["Religion", "Ce que l'on croit et que l'on pratique"],
  ["Cousinage à plaisanterie", "Des familles qui se taquinent pour rire"],
  ["Différence", "Ce qui n'est pas pareil chez chacun"],
  ["Respect", "Accepter l'autre comme il est"],
];

/** « Relie chaque mot à ce qu'il veut dire. » */
export function makeCe1DiffLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-diff-relier", "relier un mot des différences à son sens", "Relie chaque mot à ce qu'il veut dire.", DIFF_PAIRS, [
    "Lis d'abord chaque sens, puis cherche le mot qui lui va.",
    "Certains mots parlent de ce qu'on dit, d'une foi ou d'un sentiment.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const WELCOME_SHORT: Steps = {
  prompt: "Un nouvel élève arrive. Mets ces gestes du premier au dernier.",
  sequence: ["Je lui dis bonjour", "Je lui demande son prénom", "Nous jouons ensemble"],
  hints: GESTURE_STEP_HINTS,
};
const WELCOME_LONG: Steps = {
  prompt: "Un nouvel élève arrive. Mets ces gestes du premier au dernier.",
  sequence: ["Je le vois seul dans la cour", "Je lui dis bonjour", "Je lui demande son prénom", "Nous jouons ensemble"],
  hints: GESTURE_STEP_HINTS,
};
const SONG_SHORT: Steps = {
  prompt: "Tu découvres une chanson dans une autre langue. Mets ces gestes du premier au dernier.",
  sequence: ["J'écoute la chanson", "Je demande le sens des mots", "Je chante avec mon ami"],
  hints: GESTURE_STEP_HINTS,
};
const SONG_LONG: Steps = {
  prompt: "Tu découvres une chanson dans une autre langue. Mets ces gestes du premier au dernier.",
  sequence: ["Mon ami met une chanson", "J'écoute la chanson", "Je demande le sens des mots", "Je chante avec mon ami"],
  hints: GESTURE_STEP_HINTS,
};
const WORD_SHORT: Steps = {
  prompt: "Un camarade te dit un mot d'une autre langue. Mets ces gestes du premier au dernier.",
  sequence: ["Il me dit le mot", "Je répète le mot", "Je retiens le mot"],
  hints: GESTURE_STEP_HINTS,
};
const WORD_LONG: Steps = {
  prompt: "Un camarade te dit un mot d'une autre langue. Mets ces gestes du premier au dernier.",
  sequence: ["Je lui demande un mot", "Il me dit le mot", "Je répète le mot", "Je retiens le mot"],
  hints: GESTURE_STEP_HINTS,
};

/** « Un nouvel élève arrive. Mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1DiffOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-diff-ordre", "ranger les gestes d'un bon accueil", [WELCOME_SHORT, SONG_SHORT, WORD_SHORT], [WELCOME_LONG, SONG_LONG, WORD_LONG]);
}

const DIFF_GAPS: readonly GapFact[] = [
  {
    text: "Au Sénégal, on parle plusieurs ___.",
    answer: "langues",
    wrong: ["fruits", "saisons"],
    hints: ["On s'en sert pour se comprendre.", "Chaque région a les siennes.", "On en apprend de nouveaux mots."],
  },
  {
    text: "Le ___ à plaisanterie rapproche les familles par le rire.",
    answer: "cousinage",
    wrong: ["mariage", "voyage"],
    hints: ["Il unit des familles.", "On s'y taquine pour rire.", "Le mot commence par la lettre c."],
  },
  {
    text: "On ne se moque pas des ___ des autres.",
    answer: "différences",
    wrong: ["chaussures", "cartables"],
    hints: ["Chacun n'est pas pareil.", "Elles font notre richesse.", "On les respecte."],
  },
  {
    text: "Un camarade en fauteuil roulant peut ___ avec nous.",
    answer: "jouer",
    wrong: ["voler", "disparaître"],
    hints: ["Il aime s'amuser comme nous.", "On lui propose un jeu.", "Il rit avec les autres."],
  },
  {
    text: "Chaque enfant est ___ des autres.",
    answer: "différent",
    wrong: ["pareil", "identique"],
    hints: ["Personne n'est tout à fait comme un autre.", "C'est ce qui fait la richesse.", "Le mot commence par la lettre d."],
  },
  {
    text: "On respecte la religion de ses ___.",
    answer: "camarades",
    wrong: ["chaussures", "cartables"],
    hints: ["Ce sont les enfants de ta classe.", "Ils ont leurs croyances.", "On les respecte."],
  },
  {
    text: "Quand un ami est différent, je l'___ pour jouer.",
    answer: "invite",
    wrong: ["évite", "oublie"],
    hints: ["Je lui propose de venir.", "Il se sent accueilli.", "C'est un geste gentil."],
  },
  {
    text: "Les différences sont une ___ pour le pays.",
    answer: "richesse",
    wrong: ["peur", "dispute"],
    hints: ["Elles apportent beaucoup.", "Elles rendent le pays plus beau.", "Le mot commence par la lettre r."],
  },
  {
    text: "Pour se comprendre, deux amis peuvent s'apprendre des ___.",
    answer: "mots",
    wrong: ["dents", "nuages"],
    hints: ["Ils sont dans chaque langue.", "On les dit à voix haute.", "On les répète pour les retenir."],
  },
];

/** « Au Sénégal, on parle plusieurs ___. » : le mot qui complète, deux fois par palier. */
export function makeCe1DiffGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-diff-trou", "compléter une phrase sur les différences", DIFF_GAPS, 2);
}

const DIFF_WRITES: readonly WriteFact[] = [
  {
    prompt: "Que doit-on faire des différences des autres ? Écris le verbe.",
    accepted: ["respecter", "les respecter", "accepter"],
    hints: ["On ne s'en moque pas.", "On les accueille avec politesse.", "Le mot commence par la lettre r."],
  },
  {
    prompt: "Au Sénégal, on parle plusieurs, quoi ? Écris le mot.",
    accepted: ["langues", "les langues"],
    hints: ["On s'en sert pour se comprendre.", "Chaque région a les siennes.", "Le mot commence par la lettre l."],
  },
  {
    prompt: "Quel mot dit que chaque enfant n'est pas pareil ? Écris le mot.",
    accepted: ["différent", "différente", "différents"],
    hints: ["C'est le contraire de pareil.", "Cela fait notre richesse.", "Le mot commence par la lettre d."],
  },
  {
    prompt: "Comment s'appelle ce qui rapproche des familles par le rire ? Écris le mot.",
    accepted: ["cousinage", "le cousinage", "cousinage à plaisanterie", "le cousinage à plaisanterie"],
    hints: ["On s'y taquine gentiment.", "Il unit des familles.", "Le mot commence par la lettre c."],
  },
];

/** « Que doit-on faire des différences des autres ? Écris le verbe. » : un mot à écrire, de la liste fermée. */
export function makeCe1DiffWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-diff-ecrire", "écrire un mot des différences", DIFF_WRITES);
}
