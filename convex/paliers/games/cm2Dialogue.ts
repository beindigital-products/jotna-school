/**
 * LES GABARITS DU DIALOGUE DU CM2 (`fr-cm2-dialogue`).
 *
 * La fiche demande la ponctuation du dialogue (deux-points, guillemets, tiret), les verbes de parole (demander, répondre, s'écrier, murmurer), passer du dialogue au récit, et la
 * conversation au téléphone. Ici chaque exercice est BÂTI à partir de tableaux fermés (seize phrases à ponctuer, quinze phrases à verbe de parole, douze phrases à mettre au récit,
 * huit conversations), jamais écrit par le modèle.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Un énoncé ne contient jamais de deux-points : les dialogues qui en ont (« Awa demande : « Où vas-tu ? » ») sont des CHOIX, des tuiles ou le trou d'une phrase, jamais l'énoncé.
 * - Deux façons de ponctuer sont justes (guillemets après deux-points, tiret avec le verbe de parole après) ; un choix faux ne mélange pas les deux et n'est jamais la seconde façon juste.
 *   Les fautes proposées sont celles des enfants : le deux-points oublié, les guillemets oubliés, la majuscule après le deux-points oubliée, le tiret oublié, la majuscule du verbe de parole
 *   après la parole, le point à la place de la virgule.
 * - Un verbe de parole ne se choisit que si le texte le dit : une question appelle « demande » (« répond » est impossible sans question avant), un cri appelle « s'écrie » (avec « de toutes ses
 *   forces »), un secret appelle « murmure » (avec « tout bas »), un ordre appelle « ordonne » (avec « d'un ton sévère »). Un mauvais choix est un verbe que la phrase interdit.
 * - Au récit, les personnes changent : « je » devient « il » ou « elle », « tu » devient « il » ou « elle », et une question devient « demande où il va », sans point d'interrogation.
 *   Les phrases avec « nous » ne sont pas posées : le récit y est ambigu.
 *
 * HORS FICHE, À FAIRE RELIRE : « explique » et « ordonne » comme verbes de parole en plus des quatre de la fiche, les seize phrases à ponctuer, les douze phrases à mettre au récit, les huit
 * conversations de politesse au téléphone.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "écrire et lire un dialogue : ponctuation, verbes de parole, récit, téléphone";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// ===========================================================================
// QUELLE PHRASE EST BIEN PONCTUÉE ?
// ===========================================================================

type Line = { speaker: string; verb: string; speech: string; mark: "." | "?" | "!" };
export const LINES: readonly Line[] = [
  { speaker: "Awa", verb: "demande", speech: "Où vas-tu", mark: "?" },
  { speaker: "Moussa", verb: "répond", speech: "Je vais au marché", mark: "." },
  { speaker: "la maîtresse", verb: "dit", speech: "Ouvrez vos cahiers", mark: "." },
  { speaker: "Fatou", verb: "s'écrie", speech: "Quelle belle surprise", mark: "!" },
  { speaker: "le grand-père", verb: "murmure", speech: "Il est tard", mark: "." },
  { speaker: "Binta", verb: "demande", speech: "Veux-tu jouer avec nous", mark: "?" },
  { speaker: "Sidy", verb: "répond", speech: "Oui, j'arrive", mark: "." },
  { speaker: "le pêcheur", verb: "explique", speech: "La mer est calme ce matin", mark: "." },
  { speaker: "Khady", verb: "s'écrie", speech: "Attention à la voiture", mark: "!" },
  { speaker: "maman", verb: "demande", speech: "As-tu fini tes devoirs", mark: "?" },
  { speaker: "Cheikh", verb: "murmure", speech: "Chut, le bébé dort", mark: "." },
  { speaker: "le maître", verb: "répond", speech: "Bien sûr, entrez", mark: "." },
  { speaker: "Mariama", verb: "dit", speech: "Je suis contente", mark: "." },
  { speaker: "papa", verb: "s'écrie", speech: "Bravo, tu as gagné", mark: "!" },
  { speaker: "Modou", verb: "demande", speech: "Quelle heure est-il", mark: "?" },
  { speaker: "la voisine", verb: "explique", speech: "Le puits est à gauche", mark: "." },
];

/** Un point colle au dernier mot ; un point d'interrogation ou d'exclamation s'écrit avec une espace avant. */
const closing = (mark: Line["mark"]) => (mark === "." ? "." : ` ${mark}`);
/** Les deux façons justes de ponctuer. */
const withQuotes = (line: Line) => `${upperFirst(line.speaker)} ${line.verb} : « ${line.speech}${closing(line.mark)} »`;
const withDash = (line: Line) => `— ${line.speech}${line.mark === "." ? "," : closing(line.mark)} ${line.verb} ${line.speaker}.`;
/** Les fautes d'une phrase avec guillemets, puis d'une phrase avec tiret. */
const quoteMistakes = (line: Line): string[] => [
  `${upperFirst(line.speaker)} ${line.verb} « ${line.speech}${closing(line.mark)} »`,
  `${upperFirst(line.speaker)} ${line.verb} : ${line.speech}${closing(line.mark)}`,
  `${upperFirst(line.speaker)} ${line.verb} : « ${lowerFirst(line.speech)}${closing(line.mark)} »`,
];
const dashMistakes = (line: Line): string[] => {
  const end = line.mark === "." ? "," : closing(line.mark);
  const mistakes = [`${line.speech}${end} ${line.verb} ${line.speaker}.`, `— ${line.speech}${end} ${upperFirst(line.verb)} ${line.speaker}.`];
  if (line.mark === ".") mistakes.push(`— ${line.speech}. ${line.verb} ${line.speaker}.`);
  else mistakes.push(`— ${line.speech} ${line.verb} ${line.speaker}${closing(line.mark)}`);
  return mistakes;
};

const PUNCT_HINTS = hints("Compare la place des signes autour des paroles.", "Les paroles sont encadrées de guillemets ou précédées d'un tiret.", "Après un tiret, le verbe de parole s'écrit sans majuscule.");
export const PUNCT_ROWS: readonly QuestionRow[] = LINES.flatMap((line, index) => {
  const quoted = index % 2 === 0;
  const mistakes = quoted ? quoteMistakes(line) : dashMistakes(line);
  const otherMistakes = quoted ? dashMistakes(line) : quoteMistakes(line);
  return [
    qr("Quelle phrase est bien ponctuée ?", quoted ? withQuotes(line) : withDash(line), [cycle(mistakes, index), cycle(mistakes, index + 1)], PUNCT_HINTS, `dia:ponct:${index}`),
    qr("Quelle phrase est bien ponctuée ?", quoted ? withDash(line) : withQuotes(line), [cycle(otherMistakes, index + 1), cycle(otherMistakes, index + 2)], PUNCT_HINTS, `dia:ponct:${index}:b`),
  ];
});
export function makeCm2DiaPunct(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-dia-ponctuation", CONCEPT, PUNCT_ROWS, 1, (row) => row.answer);
}

// ===========================================================================
// LE VERBE DE PAROLE QUI CONVIENT
// ===========================================================================

type Speech = { text: string; answer: string; wrong: readonly [string, string] };
/** Cinq sortes de phrases : une question, une réponse, un cri, un secret, un ordre. */
const SPEECH: readonly Speech[] = [
  { text: "— Où habites-tu ? ___ le maître.", answer: "demande", wrong: ["répond", "ordonne"] },
  { text: "— Où est ton frère ? demande la voisine. — Il est au champ, ___ Fatou.", answer: "répond", wrong: ["demande", "ordonne"] },
  { text: "— Au secours ! ___ Awa de toutes ses forces.", answer: "s'écrie", wrong: ["murmure", "demande"] },
  { text: "— Chut, ___ Moussa tout bas.", answer: "murmure", wrong: ["s'écrie", "demande"] },
  { text: "— Range ton cahier ! ___ le maître d'un ton sévère.", answer: "ordonne", wrong: ["demande", "murmure"] },
  { text: "— Aimes-tu la mangue ? ___ Binta.", answer: "demande", wrong: ["répond", "ordonne"] },
  { text: "— Quel âge as-tu ? demande Awa. — J'ai douze ans, ___ Sidy.", answer: "répond", wrong: ["demande", "ordonne"] },
  { text: "— Au feu ! ___ le pêcheur très fort.", answer: "s'écrie", wrong: ["murmure", "demande"] },
  { text: "— Dors bien, ___ maman à voix basse.", answer: "murmure", wrong: ["s'écrie", "demande"] },
  { text: "— Sortez en rang ! ___ la maîtresse d'une voix ferme.", answer: "ordonne", wrong: ["demande", "murmure"] },
  { text: "— Qui a pris mon cahier ? ___ Moussa.", answer: "demande", wrong: ["répond", "ordonne"] },
  { text: "— Aimes-tu le riz ? demande maman. — Oui, beaucoup, ___ Khady.", answer: "répond", wrong: ["demande", "ordonne"] },
  { text: "— Attention ! ___ Cheikh à pleine voix.", answer: "s'écrie", wrong: ["murmure", "demande"] },
  { text: "— Viens ici tout de suite ! ___ papa d'un ton sévère.", answer: "ordonne", wrong: ["demande", "murmure"] },
  { text: "— Ne réveille pas le bébé, ___ Mariama tout bas.", answer: "murmure", wrong: ["s'écrie", "demande"] },
];
const VERB_HINTS = hints("Lis les mots qui suivent le trou : ils disent comment la personne parle.", "Une question appelle un verbe qui pose une question.", "Un cri, un secret et un ordre n'ont pas le même verbe.");
export const VERB_ROWS: readonly GapRow[] = SPEECH.map((speech, index) => gr(speech.text, speech.answer, speech.wrong, VERB_HINTS, `dia:verbe:${index}`));
export function makeCm2DiaVerb(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-dia-verbe", CONCEPT, VERB_ROWS, 1, 0, "Choisis le verbe de parole qui convient.");
}

// ===========================================================================
// DU DIALOGUE AU RÉCIT
// ===========================================================================

type Story = { speech: string; answer: string; wrong: readonly [string, string] };
export const STORIES: readonly Story[] = [
  { speech: "— Je viens demain, dit Awa.", answer: "Awa dit qu'elle vient demain.", wrong: ["Awa dit que je viens demain.", "Awa dit qu'elle viens demain."] },
  { speech: "— Je suis fatigué, dit Moussa.", answer: "Moussa dit qu'il est fatigué.", wrong: ["Moussa dit que je suis fatigué.", "Moussa dit qu'il es fatigué."] },
  { speech: "— J'ai faim, dit Fatou.", answer: "Fatou dit qu'elle a faim.", wrong: ["Fatou dit que j'ai faim.", "Fatou dit qu'elle as faim."] },
  { speech: "— Tu as bien travaillé, dit la maîtresse à Sidy.", answer: "La maîtresse dit à Sidy qu'il a bien travaillé.", wrong: ["La maîtresse dit à Sidy que tu as bien travaillé.", "La maîtresse dit à Sidy qu'il as bien travaillé."] },
  { speech: "— Où vas-tu ? demande Awa à Moussa.", answer: "Awa demande à Moussa où il va.", wrong: ["Awa demande à Moussa où vas-tu.", "Awa demande à Moussa où il vas."] },
  { speech: "— As-tu faim ? demande maman à Binta.", answer: "Maman demande à Binta si elle a faim.", wrong: ["Maman demande à Binta si tu as faim.", "Maman demande à Binta si elle as faim."] },
  { speech: "— Qui a pris mon cahier ? demande le maître.", answer: "Le maître demande qui a pris son cahier.", wrong: ["Le maître demande qui a pris mon cahier.", "Le maître demande qui as pris son cahier."] },
  { speech: "— Je ne sais pas, répond Khady.", answer: "Khady répond qu'elle ne sait pas.", wrong: ["Khady répond que je ne sais pas.", "Khady répond qu'elle ne sais pas."] },
  { speech: "— Je suis content, dit Sidy.", answer: "Sidy dit qu'il est content.", wrong: ["Sidy dit que je suis content.", "Sidy dit qu'il es content."] },
  { speech: "— Tu peux venir, dit Mariama à Modou.", answer: "Mariama dit à Modou qu'il peut venir.", wrong: ["Mariama dit à Modou que tu peux venir.", "Mariama dit à Modou qu'il peuvent venir."] },
  { speech: "— Quelle heure est-il ? demande papa.", answer: "Papa demande quelle heure il est.", wrong: ["Papa demande quelle heure est-il.", "Papa demande quelle heure il es."] },
  { speech: "— Je chante bien, dit Binta.", answer: "Binta dit qu'elle chante bien.", wrong: ["Binta dit que je chante bien.", "Binta dit qu'elle chantes bien."] },
];
const STORY_HINTS = hints("Dans le récit, celui qui parle n'est plus désigné par « je ».", "Une question racontée ne prend plus de point d'interrogation.", "Vérifie la terminaison du verbe après le nouveau sujet.");
export const STORY_ROWS: readonly QuestionRow[] = STORIES.map((story, index) => qr(`Transforme en récit la phrase suivante. ${story.speech}`, story.answer, story.wrong, STORY_HINTS, `dia:recit:${index}`));
export function makeCm2DiaStory(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-dia-recit", CONCEPT, STORY_ROWS);
}

// ===========================================================================
// AU TÉLÉPHONE
// ===========================================================================

type Phone = { prompt: string; answer: string; wrong: readonly [string, string] };
export const PHONES: readonly Phone[] = [
  { prompt: "Que dit-on pour décrocher le téléphone poliment ?", answer: "Allô, bonjour, ici la famille Ba.", wrong: ["Qui c'est ? Dépêche-toi !", "Parle vite, je n'ai pas le temps."] },
  { prompt: "Comment demande-t-on poliment à parler à Fatou ?", answer: "Bonjour madame, puis-je parler à Fatou, s'il vous plaît ?", wrong: ["Passe-moi Fatou tout de suite !", "Fatou ! Viens ici vite !"] },
  { prompt: "Comment dit-on son nom au début d'un appel ?", answer: "Bonjour, c'est Moussa à l'appareil.", wrong: ["Devine qui est au téléphone.", "Je ne dis jamais mon nom."] },
  { prompt: "Que dit-on quand on s'est trompé de numéro ?", answer: "Excusez-moi, je me suis trompé de numéro.", wrong: ["Ce n'est pas ma faute, raccrochez.", "Pourquoi répondez-vous chez vous ?"] },
  { prompt: "Comment termine-t-on poliment un appel ?", answer: "Merci beaucoup, au revoir et à bientôt.", wrong: ["Ça suffit, je raccroche !", "Je raccroche sans rien dire."] },
  { prompt: "Que fait-on quand la personne n'est pas là ?", answer: "On demande poliment de laisser un message.", wrong: ["On raccroche en criant très fort.", "On rappelle dix fois de suite."] },
  { prompt: "Quel ton faut-il avoir au téléphone ?", answer: "Un ton calme et poli.", wrong: ["Un ton fâché et fort.", "Un ton moqueur et pressé."] },
  { prompt: "Que doit-on faire si l'on ne comprend pas ?", answer: "Demander poliment de répéter.", wrong: ["Dire que l'autre parle mal.", "Raccrocher tout de suite."] },
];
const PHONE_HINTS = hints("On ne voit pas la personne qui répond, donc la politesse repose sur les mots.", "Une phrase polie salue, remercie ou s'excuse.", "Élimine la phrase qui ordonne ou qui blesse.");
export const PHONE_ROWS: readonly QuestionRow[] = PHONES.map((phone, index) => qr(phone.prompt, phone.answer, phone.wrong, PHONE_HINTS, `dia:tel:${index}`));
export function makeCm2DiaPhone(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-dia-telephone", CONCEPT, PHONE_ROWS);
}

// ===========================================================================
// RANGER LES RÉPLIQUES D'UNE CONVERSATION
// ===========================================================================

export const CONVERSATIONS: readonly (readonly [string, string, string, string])[] = [
  ["— Allô ?", "— Bonjour, c'est Moussa. Peux-tu venir jouer ?", "— Oui, j'arrive dans cinq minutes.", "— À tout à l'heure !"],
  ["— Bonjour, madame. Je voudrais une mangue.", "— Voilà, elle coûte cent francs.", "— Merci, voici l'argent.", "— Merci à toi, au revoir !"],
  ["— Où as-tu mis mon cahier ?", "— Il est sur la table.", "— Je ne le vois pas.", "— Regarde mieux, il est sous ton livre."],
  ["— Excusez-moi, quelle heure est-il ?", "— Il est midi.", "— Merci beaucoup.", "— Je vous en prie."],
  ["— Bonjour Fatou, comment vas-tu ?", "— Je vais bien, merci, et toi ?", "— Moi aussi, je vais bien.", "— Alors viens jouer avec nous !"],
  ["— Maître, puis-je sortir ?", "— Pourquoi veux-tu sortir ?", "— Je dois boire un peu d'eau.", "— D'accord, mais reviens vite."],
  ["— Que fais-tu demain ?", "— Je vais au marché avec maman.", "— Peux-tu m'acheter une mangue ?", "— Bien sûr, je t'en rapporte une."],
  ["— Allô ?", "— Bonjour Sidy, c'est Binta.", "— Bonjour Binta, que veux-tu ?", "— Peux-tu me prêter ton livre ?"],
];
const ORDER_HINTS = hints("Une conversation commence par un appel ou une salutation.", "Une question est suivie de sa réponse.", "Les derniers mots terminent l'échange.");
export const ORDER_ROWS: readonly OrderRow[] = CONVERSATIONS.map((lines, index) => ordr("Remets ces répliques dans l'ordre, selon le sens de la conversation.", lines, ORDER_HINTS, `dia:ordre:${index}`));
export function makeCm2DiaOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm2-dia-ranger", CONCEPT, ORDER_ROWS);
}

// ===========================================================================
// LE SIGNE QUI MANQUE, LE RÔLE DES SIGNES
// ===========================================================================

const SIGN_HINTS = hints("Regarde où commencent et où finissent les paroles.", "Un nouveau personnage qui parle commence sa réplique par un tiret.", "Le signe qui annonce les paroles se place juste après le verbe de parole.");
type Sign = { text: string; answer: string; wrong: readonly [string, string] };
const SIGNS: readonly Sign[] = [
  { text: "Awa demande ___ « Où vas-tu ? »", answer: ":", wrong: [";", ","] },
  { text: "___ Où vas-tu ? demande Awa.", answer: "—", wrong: [":", "«"] },
  { text: "Moussa répond : ___ Je vais au marché. »", answer: "«", wrong: ["—", ":"] },
  { text: "Moussa répond : « Je vais au marché. ___", answer: "»", wrong: ["—", ":"] },
  { text: "— Bonjour, dit Awa. ___ Bonjour, répond Moussa.", answer: "—", wrong: [":", "«"] },
  { text: "Fatou s'écrie ___ « Quelle belle surprise ! »", answer: ":", wrong: [";", ","] },
  { text: "La maîtresse dit ___ « Ouvrez vos cahiers. »", answer: ":", wrong: [";", "."] },
  { text: "___ Je suis content, dit Sidy.", answer: "—", wrong: [":", "»"] },
  { text: "Papa s'écrie : ___ Bravo, tu as gagné ! »", answer: "«", wrong: ["—", ";"] },
  { text: "Maman demande : « As-tu fini tes devoirs ? ___", answer: "»", wrong: ["—", ";"] },
  { text: "— Où vas-tu ? demande Awa. ___ Au marché, répond Moussa.", answer: "—", wrong: ["«", ";"] },
  { text: "Le pêcheur explique ___ « La mer est calme ce matin. »", answer: ":", wrong: [";", ","] },
];
export const SIGN_GAP_ROWS: readonly GapRow[] = SIGNS.map((sign, index) => gr(sign.text, sign.answer, sign.wrong, SIGN_HINTS, `dia:signe:${index}`));
export function makeCm2DiaSignGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-dia-signe", CONCEPT, SIGN_GAP_ROWS, 1, 0, "Choisis le signe qui manque.");
}

type Role = { prompt: string; answer: string; wrong: readonly [string, string] };
export const ROLES: readonly Role[] = [
  { prompt: "Quel signe encadre les paroles d'un personnage ?", answer: "Guillemets", wrong: ["Parenthèses", "Point-virgule"] },
  { prompt: "Quel signe montre qu'un nouveau personnage prend la parole ?", answer: "Tiret", wrong: ["Parenthèses", "Point-virgule"] },
  { prompt: "Quel signe suit le verbe de parole et annonce les paroles ?", answer: "Deux-points", wrong: ["Point-virgule", "Parenthèses"] },
  { prompt: "À quoi servent les guillemets dans un dialogue ?", answer: "À encadrer les paroles dites", wrong: ["À compter les phrases", "À séparer les syllabes"] },
  { prompt: "À quoi sert le tiret dans un dialogue ?", answer: "À changer de personnage qui parle", wrong: ["À compter les phrases", "À séparer les syllabes"] },
  { prompt: "À quoi servent les deux-points avant les paroles ?", answer: "À annoncer les paroles qui suivent", wrong: ["À finir toute la phrase", "À compter tous les mots"] },
  { prompt: "Quand le verbe de parole suit une affirmation, que met-on à la fin de la parole ?", answer: "Virgule", wrong: ["Point", "Tiret"] },
  { prompt: "Quelle lettre commence les paroles après les guillemets ?", answer: "Une majuscule", wrong: ["Une minuscule", "Un chiffre"] },
];
const ROLE_HINTS = hints("Pense à ce que le signe montre dans un dialogue.", "Il aide à voir qui prend la parole et ce qui est dit.", "Élimine ce qui n'a rien à voir avec un dialogue.");
export const ROLE_ROWS: readonly QuestionRow[] = ROLES.map((role, index) => qr(role.prompt, role.answer, role.wrong, ROLE_HINTS, `dia:role:${index}`));
export function makeCm2DiaRole(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-dia-role", CONCEPT, ROLE_ROWS);
}

// ===========================================================================
// COMPTER LES RÉPLIQUES
// ===========================================================================

/** Des conversations sans apostrophe : le texte est dans l'énoncé. */
export const COUNTED: readonly (readonly string[])[] = [
  ["— Bonjour Fatou, dit Moussa.", "— Bonjour Moussa, répond Fatou."],
  ["— Veux-tu jouer ? demande Binta.", "— Oui, avec plaisir, répond Sidy.", "— Alors viens vite, dit Binta."],
  ["— Quelle heure est-il ? demande le maître.", "— Il est midi, répond Awa.", "— Merci, dit le maître.", "— Je vous en prie, dit Awa."],
  ["— Voici ton cahier, dit maman.", "— Merci beaucoup, répond Cheikh."],
  ["— Allô ? dit Khady.", "— Bonjour Khady, répond Modou.", "— Peux-tu venir demain ? demande Khady.", "— Oui, bien sûr, répond Modou.", "— À demain, dit Khady."],
  ["— Attention à la route ! s'écrie papa.", "— Je fais très attention, répond Mariama.", "— Bravo, murmure papa."],
  ["— Combien coûte cette mangue ? demande Sidy.", "— Cent francs, répond la vendeuse."],
  ["— Venez vite ! s'écrie le maître.", "— Nous arrivons, répond la classe.", "— Rangez vos cahiers, dit le maître.", "— Oui, maître, murmure Fatou."],
];
const COUNT_HINTS = hints("Chaque personnage qui parle commence sa réplique par un tiret.", "Compte les tirets en début de ligne.", "Une réplique contient les paroles et le verbe de parole.");
const NUMBER_WORD = ["", "", "deux", "trois", "quatre", "cinq"] as const;
export const COUNT_ROWS: readonly WriteRow[] = COUNTED.map((lines, index) =>
  wr(`${lines.join(" ")} Combien de répliques ce dialogue contient-il ?`, [String(lines.length), NUMBER_WORD[lines.length]], COUNT_HINTS, `dia:compte:${index}`),
);
export function makeCm2DiaCount(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-dia-compter", CONCEPT, COUNT_ROWS);
}

// ===========================================================================
// LE SENS DES VERBES DE PAROLE, PAROLES ET RÉCIT
// ===========================================================================

export const VERB_SENSES: readonly (readonly [string, string])[] = [
  ["demander", "poser une question"],
  ["répondre", "donner une réponse"],
  ["s'écrier", "parler très fort sous le coup de l'émotion"],
  ["murmurer", "parler très bas"],
  ["ordonner", "dire de faire quelque chose"],
  ["expliquer", "dire pour faire comprendre"],
];
const LINK_HINTS = hints("Un verbe de parole dit comment ou pourquoi on parle.", "Pense à la situation où tu emploies ce verbe.", "Commence par le verbe dont tu es sûr.");
export const LINK_ROWS: readonly LinkRow[] = Array.from({ length: 12 }, (_, index) => {
  const picked = [index % 6, (index + 2 + (index > 5 ? 1 : 0)) % 6, (index + 4) % 6];
  return {
    prompt: "Relie chaque verbe de parole à son sens.",
    pairs: picked.map((at) => ({ left: VERB_SENSES[at][0], right: VERB_SENSES[at][1] })),
    hints: LINK_HINTS,
    fact: `dia:relier:${picked.join(",")}`,
  };
});
export function makeCm2DiaLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-dia-relier", CONCEPT, LINK_ROWS);
}

export const SPOKEN: readonly string[] = [
  "Où vas-tu ?", "Je vais au marché.", "Ouvrez vos cahiers.", "Quelle belle surprise !", "As-tu fini tes devoirs ?", "Chut, le bébé dort.",
  "Bravo, tu as gagné !", "Quelle heure est-il ?", "Attention à la voiture !", "Oui, j'arrive.", "Bien sûr, entrez.", "Je suis contente.",
];
export const NARRATED: readonly string[] = [
  "demande Awa", "répond Moussa", "dit la maîtresse", "s'écrie Fatou", "murmure le grand-père", "explique le pêcheur",
  "dit Sidy en riant", "répond Khady avec un sourire", "demande maman d'une voix douce", "s'écrie papa de joie", "murmure Cheikh tout bas", "répond le maître calmement",
];
const SORT_HINTS = hints("Une moitié est ce que le personnage dit lui-même.", "L'autre moitié dit qui parle et comment il parle.", "Un verbe de parole se trouve dans une seule des deux moitiés.");
const SORT_ZONES = ["Paroles", "Récit"] as const;
export const SORT_ROWS: readonly SortRow[] = Array.from({ length: 24 }, (_, index) => ({
  prompt: "Glisse chaque morceau dans la bonne case.",
  zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
  items: [
    { text: cycle(SPOKEN, index * 5), zone: SORT_ZONES[0] },
    { text: cycle(SPOKEN, index * 5 + 7), zone: SORT_ZONES[0] },
    { text: cycle(NARRATED, index * 5 + 2), zone: SORT_ZONES[1] },
    { text: cycle(NARRATED, index * 5 + 9), zone: SORT_ZONES[1] },
  ],
  hints: SORT_HINTS,
  fact: `dia:glisser:${index}`,
}));
export function makeCm2DiaSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-dia-glisser", CONCEPT, SORT_ROWS);
}
