/**
 * LES GABARITS DES TEXTES QUI EXPLIQUENT DU CM2 (`fr-cm2-informer`).
 *
 * La fiche demande des textes informatifs et explicatifs (pourquoi, comment), l'idée principale, les causes et les conséquences, et les mots de liaison (car, donc, c'est pourquoi,
 * parce que). Le TEXTE est dans l'énoncé : dix documents écrits pour l'exercice, de cinq phrases, un titre, sans deux-points ni chiffre. Chaque question porte sur une phrase
 * du texte, et une bonne réponse n'emploie que des mots du texte.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TEXTES ÉVITENT
 * - Un énoncé n'a qu'une apostrophe droite au plus, texte compris : un document en a une au plus (« beaucoup d'eau », « c'est pourquoi »), et sa question n'en a aucune.
 * - Un mot de liaison n'est posé que dans une phrase où un seul des trois rapports va (la cause, la conséquence, l'opposition) : « Il a beaucoup plu, donc les routes sont inondées »
 *   n'accepte ni « car » (qui renverrait la cause à l'envers) ni « mais ». Deux mots du même rapport (« car » et « parce que ») ne sont jamais ensemble parmi les choix.
 * - Une bonne réponse reprend le texte ; un mauvais choix contient au moins un mot que le texte n'écrit pas.
 * - Les causes et les conséquences glissées dans deux cases sont les deux moitiés de paires distinctes : aucune moitié n'est à la fois cause d'une paire et conséquence d'une autre.
 *
 * HORS FICHE, À FAIRE RELIRE : les dix documents (la mer salée, boire, les pêcheurs, le baobab, se laver les mains, les moustiques, le plastique, le sommeil, la mangrove, le désert)
 * et leurs explications, les mots de liaison en plus de la fiche (alors, ainsi, mais, pourtant), les vingt phrases de liaison.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "lire un texte qui explique : idée principale, cause, conséquence, mots de liaison";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type Ask = { question: string; answer: string; wrong: readonly [string, string] };
export type Doc = {
  title: string;
  sentences: readonly [string, string, string, string, string];
  subject: { answer: string; wrong: readonly [string, string] };
  cause: Ask;
  effect: Ask;
  statement: Ask;
  /** Trois paires (cause, conséquence) aux moitiés toutes différentes. */
  links: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  cloze: { word: string; wrong: readonly [string, string] };
};
const ask = (question: string, answer: string, w1: string, w2: string): Ask => ({ question, answer, wrong: [w1, w2] });

export const DOCS: readonly Doc[] = [
  // Palier 1.
  {
    title: "Pourquoi la mer est salée",
    sentences: [
      "La mer contient beaucoup de sel.",
      "Les rivières apportent à la mer des sels pris dans la roche.",
      "Le soleil chauffe la mer et une partie de son eau monte dans le ciel.",
      "Le sel ne monte pas avec elle, donc il reste dans la mer.",
      "Voilà pourquoi la mer est salée depuis très longtemps.",
    ],
    subject: { answer: "Le sel qui reste dans la mer", wrong: ["Comment on pêche les poissons", "Comment on fabrique le sucre"] },
    cause: ask("Pourquoi le sel reste-t-il dans la mer ?", "Il ne monte pas avec l'eau", "Les poissons le mangent", "Le vent le pousse vers la terre"),
    effect: ask("Que fait une partie de l'eau quand le soleil chauffe ?", "Elle monte dans le ciel", "Elle tombe sur les pêcheurs", "Elle devient de la glace"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Les rivières apportent des sels à la mer.", "Les pêcheurs ajoutent du sel dans la mer.", "Le sel monte dans les nuages."),
    // Des phrases complètes, sans pronom sans référent (« Il reste », « avec elle ») ; « La mer contient beaucoup de sel » se lisait comme un constat, rangé en cause
    // (défaut relevé en production le 25 octobre 2026). L'ordre compte : le glissé montre la cause de la première paire et la conséquence de la troisième seules.
    links: [["Le sel ne monte pas avec l'eau", "Le sel reste dans la mer"], ["Les rivières apportent du sel", "La mer devient salée"], ["Le soleil chauffe la mer", "Une partie de l'eau de la mer monte dans le ciel"]],
    cloze: { word: "roche", wrong: ["boue", "forêt"] },
  },
  {
    title: "Pourquoi il faut boire",
    sentences: [
      "Notre corps contient beaucoup d'eau.",
      "Quand il fait chaud, nous transpirons et nous perdons une partie de cette eau.",
      "Si nous ne buvons pas, le corps manque de liquide et nous avons la tête lourde.",
      "Nous devons donc boire souvent, surtout pendant la saison chaude.",
      "Un verre à chaque repas aide le corps à rester en forme.",
    ],
    subject: { answer: "Pourquoi nous devons boire souvent", wrong: ["Comment on cuisine le riz", "Comment on construit une maison"] },
    cause: ask("Pourquoi avons-nous la tête lourde ?", "Le corps manque de liquide", "Nous avons trop mangé", "Nous avons couru la veille"),
    effect: ask("Que se passe-t-il quand il fait chaud ?", "Nous transpirons et perdons de cette eau", "Nous gagnons beaucoup de force", "Nous mangeons plus de fruits"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Un verre à chaque repas aide le corps.", "Il faut boire seulement le matin.", "Le corps ne perd jamais de liquide."),
    // « Notre corps perd de cette eau » se reliait aussi bien à « Le corps manque de liquide » (défaut relevé en production le 25 octobre 2026).
    links: [["Il fait chaud", "Nous transpirons"], ["Nous ne buvons pas", "Le corps manque de liquide"], ["Un verre à chaque repas", "Le corps reste en forme"]],
    cloze: { word: "liquide", wrong: ["froid", "sang"] },
  },
  // Palier 2.
  {
    title: "Pourquoi les pêcheurs partent tôt",
    sentences: [
      "Les pêcheurs partent en mer avant le lever du soleil.",
      "Le matin, la mer est calme et le vent est faible.",
      "Les poissons montent près de la surface car ils cherchent leur nourriture.",
      "Les pêcheurs lancent donc leurs filets très tôt.",
      "Quand la chaleur monte à midi, les poissons descendent au fond de la mer.",
    ],
    subject: { answer: "Les pêcheurs qui partent en mer", wrong: ["Comment on répare un bateau", "Comment on vend le poisson"] },
    cause: ask("Pourquoi les poissons montent-ils près de la surface ?", "Ils cherchent leur nourriture", "Ils fuient les oiseaux", "Ils aiment le bruit des moteurs"),
    effect: ask("Que font les pêcheurs quand les poissons montent ?", "Ils lancent leurs filets très tôt", "Ils rentrent dormir à la maison", "Ils réparent leurs pirogues"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "À midi, les poissons descendent au fond de la mer.", "Le soir, les poissons montent très haut.", "Les pêcheurs partent quand le vent est fort."),
    links: [["Ils cherchent leur nourriture", "Les poissons montent près de la surface"], ["La mer est calme le matin", "Les pêcheurs partent en mer avant le lever du soleil"], ["La chaleur monte à midi", "Les poissons descendent au fond de la mer"]],
    cloze: { word: "filets", wrong: ["bateaux", "paniers"] },
  },
  {
    title: "Le baobab et son eau",
    sentences: [
      "Le baobab pousse dans des régions où il pleut peu.",
      "Pendant la saison des pluies, son tronc large se remplit d'eau.",
      "Pendant la saison sèche, le baobab perd ses feuilles pour garder son eau.",
      "Grâce à cette réserve, il survit même quand il ne pleut pas pendant des mois.",
      "Les habitants utilisent parfois cette eau en cas de grande soif.",
    ],
    subject: { answer: "Comment le baobab peut garder son eau", wrong: ["Comment on cultive le mil", "Pourquoi les singes aiment ses fruits"] },
    cause: ask("Pourquoi le baobab perd-il ses feuilles ?", "Pour garder son eau", "Il a trop froid la nuit", "Les oiseaux les mangent"),
    effect: ask("Que permet la réserve du tronc ?", "Il survit même quand il ne pleut pas", "Il pousse vite chaque année", "Il donne plus de fruits"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Le tronc du baobab se remplit pendant la saison des pluies.", "Le baobab perd ses racines en été.", "Les habitants coupent le tronc pour jouer."),
    links: [["Pendant la saison des pluies", "Son tronc large se remplit d'eau"], ["Pendant la saison sèche", "Le baobab perd ses feuilles"], ["Grâce à cette réserve", "Il survit même quand il ne pleut pas"]],
    cloze: { word: "réserve", wrong: ["graine", "racine"] },
  },
  // Palier 3.
  {
    title: "Pourquoi il faut laver ses mains",
    sentences: [
      "Nos mains touchent beaucoup de choses pendant la journée.",
      "Elles prennent ainsi des microbes que nous ne voyons pas.",
      "Si nous mangeons sans nous laver les mains, les microbes entrent dans le ventre.",
      "Alors nous risquons une maladie comme la diarrhée.",
      "Un lavage au savon avant le repas protège donc toute la famille.",
    ],
    subject: { answer: "Les microbes sur nos mains", wrong: ["Comment on fabrique le savon", "Pourquoi les enfants aiment jouer dehors"] },
    cause: ask("Pourquoi risquons-nous une maladie ?", "Les microbes entrent dans le ventre", "Nous dormons trop longtemps", "Nous avons marché au soleil"),
    effect: ask("Que fait un lavage au savon avant le repas ?", "Il protège toute la famille", "Il rend les mains plus rouges", "Il remplace le repas du soir"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Les mains prennent des microbes que nous ne voyons pas.", "Les microbes se voient très bien.", "Le savon donne de la fièvre."),
    links: [["Nos mains touchent beaucoup de choses", "Elles prennent des microbes"], ["Nous mangeons sans nous laver les mains", "Les microbes entrent dans le ventre"], ["Un lavage au savon avant le repas", "Il protège toute la famille"]],
    cloze: { word: "microbes", wrong: ["insectes", "poussières"] },
  },
  {
    title: "Les moustiques et l'eau qui dort",
    sentences: [
      "Les moustiques pondent leurs œufs dans une eau qui ne bouge pas.",
      "Une flaque oubliée devient donc un bon nid pour eux.",
      "Quand le soleil se couche, ils sortent et piquent les gens.",
      "Certains moustiques peuvent donner le paludisme, une maladie grave.",
      "Vider les seaux et les pots chaque semaine empêche les œufs de grandir.",
    ],
    subject: { answer: "Où les moustiques pondent leurs œufs", wrong: ["Comment on soigne une maladie", "Pourquoi les oiseaux chantent le matin"] },
    cause: ask("Pourquoi une flaque oubliée devient-elle un bon nid ?", "Les moustiques y pondent leurs œufs", "Les poissons y vivent", "La pluie la remplit chaque jour"),
    effect: ask("Que permet de vider les seaux chaque semaine ?", "Les œufs ne peuvent pas grandir", "Les seaux deviennent propres", "Les moustiques piquent moins fort"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Les moustiques sortent quand le soleil se couche.", "Les moustiques dorment pendant la nuit.", "Le paludisme est une maladie légère."),
    // Des phrases complètes (« y pondent » n'avait pas de référent) ; le glissé montre « Le soleil se couche » et « Les œufs ne peuvent pas grandir » seuls,
    // sans qu'une cause montrée y paraisse la cause d'une autre conséquence montrée (défaut relevé en production le 25 octobre 2026).
    links: [["Une eau ne bouge pas", "Les moustiques pondent leurs œufs dans cette eau"], ["Vider les seaux chaque semaine", "Les œufs ne peuvent pas grandir"], ["Le soleil se couche", "Les moustiques sortent et piquent les gens"]],
    cloze: { word: "paludisme", wrong: ["rhume", "hoquet"] },
  },
  // Palier 4.
  {
    title: "Pourquoi il faut recycler le plastique",
    sentences: [
      "Le plastique jeté dans la rue ne disparaît pas vite.",
      "Il peut rester plus de cent ans sur le sol.",
      "Quand il pleut, les sachets sont emportés vers les rivières et vers la mer.",
      "Les poissons mangent parfois ces morceaux et tombent malades.",
      "Ramasser et recycler le plastique protège donc les animaux et nos villages.",
    ],
    subject: { answer: "Le plastique jeté dans la rue", wrong: ["Comment on pêche en pirogue", "Pourquoi le sable devient chaud"] },
    cause: ask("Pourquoi les sachets arrivent-ils dans la mer ?", "Ils sont emportés quand il pleut", "Les enfants les jettent loin", "Le vent les cache sous le sable"),
    effect: ask("Que se passe-t-il quand les poissons mangent ces morceaux ?", "Ils tombent malades", "Ils grossissent très vite", "Ils nagent plus loin"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Le plastique peut rester plus de cent ans sur le sol.", "Le plastique disparaît en une semaine.", "Les poissons digèrent bien le plastique."),
    links: [["Il pleut", "Les sachets sont emportés vers les rivières"], ["Les poissons mangent ces morceaux", "Ils tombent malades"], ["Ramasser et recycler le plastique", "Cela protège les animaux et nos villages"]],
    // Pas « lacs » : la pluie emporte aussi les sachets vers les lacs, et rien dans le texte ne l'écarte (défaut relevé en production le 25 octobre 2026).
    cloze: { word: "rivières", wrong: ["nuages", "toits"] },
  },
  {
    title: "Pourquoi il faut dormir",
    sentences: [
      "Un enfant grandit vite, donc il a besoin de dormir environ dix heures par nuit.",
      "Pendant le sommeil, le corps se repose et grandit.",
      "Un enfant qui dort peu est fatigué le lendemain.",
      "Il écoute alors moins bien en classe et se met vite en colère.",
      "C'est pourquoi il faut se coucher tôt.",
    ],
    subject: { answer: "Le sommeil de l'enfant", wrong: ["Comment on prépare le dîner", "Pourquoi les étoiles brillent"] },
    cause: ask("Pourquoi un enfant est-il fatigué le lendemain ?", "Il dort peu", "Il a trop joué au ballon", "Il a mangé trop de riz"),
    effect: ask("Que se passe-t-il quand un enfant est fatigué ?", "Il écoute moins bien en classe", "Il grandit plus vite que les autres", "Il oublie son cartable chaque jour"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Le corps se repose pendant le sommeil.", "Le corps travaille plus la nuit.", "Un enfant doit dormir deux heures."),
    links: [["Un enfant dort peu", "Il est fatigué le lendemain"], ["Pendant le sommeil", "Le corps se repose et grandit"], ["Un enfant grandit vite", "Il a besoin de dormir dix heures par nuit"]],
    cloze: { word: "sommeil", wrong: ["repas", "travail"] },
  },
  // Palier 5.
  {
    title: "Pourquoi protéger la mangrove",
    sentences: [
      "La mangrove est une forêt qui pousse dans une eau salée.",
      "Ses racines retiennent la terre et empêchent la mer de ronger la côte.",
      "Les poissons et les crevettes viennent se cacher entre les racines pour grandir.",
      "Si on coupe trop les arbres, la côte disparaît peu à peu et les poissons deviennent rares.",
      "Protéger la mangrove, c'est donc protéger les familles de pêcheurs.",
    ],
    subject: { answer: "La mangrove et les familles de pêcheurs", wrong: ["Comment on construit une pirogue", "Pourquoi les crabes marchent de côté"] },
    cause: ask("Pourquoi la côte disparaît-elle peu à peu ?", "On coupe trop les arbres", "Les touristes la piétinent", "Le soleil la brûle chaque été"),
    effect: ask("Que deviennent les poissons quand on coupe trop les arbres ?", "Ils deviennent rares", "Ils deviennent plus gros", "Ils partent vers les rivières"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Les racines retiennent la terre.", "Les racines mangent les crevettes.", "La mangrove pousse dans le désert."),
    links: [["Les racines retiennent la terre", "La mer ne ronge pas la côte"], ["On coupe trop les arbres", "La côte disparaît peu à peu"], ["Les poissons viennent se cacher entre les racines", "Ils peuvent grandir"]],
    cloze: { word: "racines", wrong: ["feuilles", "branches"] },
  },
  {
    title: "Pourquoi le désert avance",
    sentences: [
      "Dans certaines régions, le désert gagne un peu de terrain chaque année.",
      "Les habitants coupent des arbres pour faire du feu et construire des cases.",
      "Sans arbres, le vent emporte la terre et le sol devient sec.",
      "Rien ne pousse plus sur ce sol, alors les familles doivent partir.",
      "Planter des arbres retient donc la terre et arrête peu à peu le désert.",
    ],
    subject: { answer: "Pourquoi le désert gagne du terrain", wrong: ["Comment on construit une case", "Pourquoi les troupeaux voyagent"] },
    cause: ask("Pourquoi le sol devient-il sec ?", "Le vent emporte la terre sans arbres", "Les pluies sont trop fortes", "Le feu brûle toute la verdure"),
    effect: ask("Que doivent faire les familles quand rien ne pousse ?", "Elles doivent partir", "Elles plantent du riz partout", "Elles construisent un barrage"),
    statement: ask("Quelle phrase est vraie selon le texte ?", "Planter des arbres retient la terre.", "Le désert recule quand on coupe les arbres.", "Les habitants brûlent la terre pour la sauver."),
    links: [["Les habitants coupent des arbres", "Le vent emporte la terre"], ["Rien ne pousse plus", "Les familles doivent partir"], ["Planter des arbres", "Le désert s'arrête peu à peu"]],
    cloze: { word: "vent", wrong: ["froid", "sable"] },
  },
];

/** Le texte tel que l'enfant le lit : le titre, puis les cinq phrases. */
export const textOf = (doc: Doc) => `${doc.title}\n\n${doc.sentences.join(" ")}`;
const withText = (doc: Doc, question: string) => `${textOf(doc)}\n\nLis le texte. ${question}`;

// ---------------------------------------------------------------------------
// Le sujet, la cause, la conséquence, vrai d'après le texte
// ---------------------------------------------------------------------------

const SUBJECT_HINTS = hints("Lis le titre, puis relis la première et la dernière phrase.", "Le sujet répond à la question que le titre pose.", "Élimine ce dont le texte ne parle pas.");
export const SUBJECT_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, "Quel est le sujet du texte ?"), doc.subject.answer, doc.subject.wrong, SUBJECT_HINTS, `inf:${index}:sujet`));
export function makeCm2InfSubject(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-inf-sujet", CONCEPT, SUBJECT_ROWS);
}

const CAUSE_HINTS = hints("Une cause répond à la question pourquoi.", "Cherche, au fil du texte, la phrase qui explique.", "Élimine les réponses absentes du texte.");
export const CAUSE_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, doc.cause.question), doc.cause.answer, doc.cause.wrong, CAUSE_HINTS, `inf:${index}:cause`));
export function makeCm2InfCause(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-inf-cause", CONCEPT, CAUSE_ROWS);
}

const EFFECT_HINTS = hints("Une conséquence est ce qui arrive ensuite.", "Cherche, au fil du texte, la phrase qui dit ce qui se passe.", "Élimine les réponses absentes du texte.");
export const EFFECT_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, doc.effect.question), doc.effect.answer, doc.effect.wrong, EFFECT_HINTS, `inf:${index}:consequence`));
export function makeCm2InfEffect(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-inf-consequence", CONCEPT, EFFECT_ROWS);
}

const TRUE_HINTS = hints("Relis le texte phrase par phrase.", "Une phrase vraie se retrouve presque mot à mot au fil du texte.", "Élimine ce que le texte ne dit pas.");
export const TRUE_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, doc.statement.question), doc.statement.answer, doc.statement.wrong, TRUE_HINTS, `inf:${index}:vrai`));
export function makeCm2InfTrue(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-inf-vrai", CONCEPT, TRUE_ROWS);
}

// ---------------------------------------------------------------------------
// Compléter le texte, remettre les phrases dans l'ordre
// ---------------------------------------------------------------------------

const CLOZE_HINTS = hints("Lis tout le texte avant de choisir.", "Le mot qui manque revient ailleurs ou s'explique par la phrase.", "Élimine les mots que le texte ne peut pas contenir.");
/** Le mot est caché dans le corps du texte, jamais dans le titre. */
const hideWord = (doc: Doc) => `${doc.title}\n\n${doc.sentences.join(" ").replace(doc.cloze.word, "___")}`;
export const CLOZE_ROWS: readonly GapRow[] = DOCS.map((doc, index) => gr(hideWord(doc), doc.cloze.word, doc.cloze.wrong, CLOZE_HINTS, `inf:${index}:trou`));
export function makeCm2InfGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-inf-trou", CONCEPT, CLOZE_ROWS, 1, 0, "Complète le texte avec le bon mot.");
}

/** La première phrase du texte n'est pas à ranger : elle reste en place, et le premier indice ne la cherche pas (relecture du 26 octobre 2026). */
const ORDER_HINTS = hints("Relis la première phrase du texte, puis cherche celle qui la suit.", "Les phrases s'enchaînent selon les idées du texte.", "Repère la phrase qui conclut.");
export const ORDER_ROWS: readonly OrderRow[] = DOCS.map((doc, index) => ordr(withText(doc, "Remets ces phrases dans le même ordre que le texte."), doc.sentences.slice(1), ORDER_HINTS, `inf:${index}:ordre`));
export function makeCm2InfOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm2-inf-ordre", CONCEPT, ORDER_ROWS);
}

// ---------------------------------------------------------------------------
// Relier une cause à sa conséquence, glisser dans « cause » et « conséquence »
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Une cause explique pourquoi quelque chose arrive.", "Relis le texte pour retrouver ce qui arrive ensuite.", "Commence par la paire dont tu es sûr.");
export const LINK_ROWS: readonly LinkRow[] = DOCS.map((doc, index) => ({
  prompt: withText(doc, "Relie chaque cause à sa conséquence."),
  pairs: doc.links.map(([left, right]) => ({ left, right })),
  hints: LINK_HINTS,
  fact: `inf:${index}:relier`,
}));
export function makeCm2InfLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-inf-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Une moitié explique pourquoi quelque chose arrive.", "L'autre moitié dit ce qui arrive ensuite.", "Demande-toi laquelle des deux arrive la première.");
const SORT_ZONES = ["Cause", "Conséquence"] as const;
/** Deux causes et deux conséquences de paires différentes. */
export const SORT_ROWS: readonly SortRow[] = DOCS.map((doc, index) => {
  const at = index % 3;
  const other = (at + 1) % 3;
  const third = (at + 2) % 3;
  return {
    prompt: withText(doc, "Glisse chaque phrase dans la bonne case."),
    zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
    items: [
      { text: doc.links[at][0], zone: SORT_ZONES[0] },
      { text: doc.links[other][0], zone: SORT_ZONES[0] },
      { text: doc.links[other][1], zone: SORT_ZONES[1] },
      { text: doc.links[third][1], zone: SORT_ZONES[1] },
    ],
    hints: SORT_HINTS,
    fact: `inf:${index}:glisser`,
  };
});
export function makeCm2InfSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-inf-glisser", CONCEPT, SORT_ROWS);
}

// ===========================================================================
// LES MOTS DE LIAISON : une partie de phrase, le mot, l'autre partie
// ===========================================================================

type Relation = "cause" | "conséquence" | "opposition";
const CAUSE_WORDS = ["car", "parce que"] as const;
const EFFECT_WORDS = ["donc", "alors", "c'est pourquoi", "ainsi"] as const;
const OPPOSITION_WORDS = ["mais", "pourtant"] as const;
const WORDS: Record<Relation, readonly string[]> = { cause: CAUSE_WORDS, conséquence: EFFECT_WORDS, opposition: OPPOSITION_WORDS };

/** Quatorze paires (cause, conséquence) : la cause vient la première dans la vie, la conséquence ensuite. */
export const CAUSAL_PAIRS: readonly (readonly [string, string])[] = [
  ["il a beaucoup plu", "les routes sont inondées"],
  ["Fatou a faim", "elle mange une mangue"],
  ["le taxi est en panne", "nous allons à pied au village"],
  ["Moussa est malade", "il reste à la maison"],
  ["la nuit tombe", "les enfants rentrent"],
  ["il fait très chaud", "nous buvons beaucoup"],
  ["le puits est vide", "les femmes marchent loin"],
  ["Binta a bien révisé", "elle réussit son examen"],
  ["le marché ferme tôt", "les vendeurs rangent leurs fruits"],
  ["le vent souffle fort", "les pêcheurs restent au port"],
  ["la lampe est cassée", "nous lisons à la bougie"],
  ["les élèves sont en sortie", "la classe est vide"],
  ["le feu est rouge", "les voitures attendent"],
  ["Awa a perdu son cahier", "elle est triste"],
];
/** Six paires d'idées qui s'opposent. */
export const OPPOSITE_PAIRS: readonly (readonly [string, string])[] = [
  ["Il est petit", "il court vite"],
  ["Il pleut", "nous sortons quand même"],
  ["Moussa est fatigué", "il continue de jouer"],
  ["Fatou chante bien", "elle a peur de la scène"],
  ["Le chemin est long", "nous arrivons vite"],
  ["Le sac est lourd", "Binta le porte sans peine"],
];

type Connected = { before: string; word: string; after: string; relation: Relation };
const startsWithVowel = (text: string) => /^[aeiouyéèêâîôûh]/iu.test(text);
/** Un pronom qui reprend un nom ne passe jamais avant ce nom : ces conséquences ne se disent pas à l'envers. */
const PRONOUN_EFFECTS = new Set(["elle mange une mangue", "il reste à la maison", "elle réussit son examen", "elle est triste"]);
const CONNECTED: readonly Connected[] = (() => {
  const out: Connected[] = [];
  CAUSAL_PAIRS.forEach(([cause, effect], index) => {
    out.push({ before: upperFirst(cause), word: cycle(EFFECT_WORDS, index), after: effect, relation: "conséquence" });
    // « parce que » devient « parce qu' » devant une voyelle : cette graphie n'a pas de trou, « car » la remplace.
    if (!PRONOUN_EFFECTS.has(effect)) out.push({ before: upperFirst(effect), word: startsWithVowel(cause) ? "car" : cycle(CAUSE_WORDS, index), after: cause, relation: "cause" });
  });
  OPPOSITE_PAIRS.forEach(([first, second], index) => out.push({ before: first, word: cycle(OPPOSITION_WORDS, index), after: second, relation: "opposition" }));
  return out;
})();
/** Les rapports se mêlent de proche en proche : chaque palier reçoit un peu de chacun. */
export const CONNECTED_SPREAD: readonly Connected[] = (() => {
  const by: Record<Relation, Connected[]> = { cause: [], conséquence: [], opposition: [] };
  CONNECTED.forEach((part) => by[part.relation].push(part));
  const out: Connected[] = [];
  for (let i = 0; i < by.conséquence.length; i++) {
    out.push(by.conséquence[i]);
    if (by.cause[i]) out.push(by.cause[i]);
    if (i % 2 === 0 && by.opposition[i / 2]) out.push(by.opposition[i / 2]);
  }
  return out;
})();

const LIAISON_HINTS = hints(
  "Lis les deux parties de la phrase.",
  "Demande-toi si la deuxième partie explique la première, ou si elle en est la suite.",
  "Si les deux parties s'opposent, le mot qui convient les oppose.",
);
/** Les mauvais choix viennent des deux autres rapports : ils changent le sens de la phrase. */
function wrongsOf(part: Connected, index: number): [string, string] {
  const others = (["cause", "conséquence", "opposition"] as const).filter((relation) => relation !== part.relation);
  return [cycle(WORDS[others[0]], index), cycle(WORDS[others[1]], index + 1)];
}
export const LIAISON_ROWS: readonly GapRow[] = CONNECTED_SPREAD.map((part, index) =>
  gr(`${part.before}${part.relation === "cause" ? "" : ","} ___ ${part.after}.`, part.word, wrongsOf(part, index), LIAISON_HINTS, `lia:${part.before}|${part.relation}`),
);
export function makeCm2InfLiaison(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-inf-liaison", CONCEPT, LIAISON_ROWS, 1, 0, "Choisis le mot de liaison qui convient.");
}

const WRITE_HINTS = hints("Lis les deux parties de la phrase.", "Demande-toi si la deuxième partie explique la première, ou si elle en est la suite, ou si elle s'y oppose.", "Écris le petit mot qui les relie.");
/**
 * Des mots de liaison justes que le choix multiple ne propose pas, mais qu'une phrase à écrire admet : « par conséquent » et « de ce fait » disent la suite, « cependant »
 * et « toutefois » l'opposition (« Il a beaucoup plu, par conséquent les routes sont inondées » était refusé, relecture du 26 octobre 2026).
 */
const EXTRA_WRITTEN: Record<Relation, readonly string[]> = { cause: [], conséquence: ["par conséquent", "de ce fait"], opposition: ["cependant", "toutefois"] };
/**
 * Tous les mots du rapport sont admis, la graphie « c'est pourquoi » avec les deux apostrophes ; le mot du tableau est le premier. Pour la cause, « puisque » aussi.
 * Devant une voyelle, « parce qu'il » (avec les deux apostrophes) ET « parce que », la forme du mot de liaison qu'un enfant apprend : l'app n'acceptait que « car »
 * (défaut relevé en production le 25 octobre 2026).
 */
const accepted = (part: Connected): string[] => {
  const words = part.relation === "cause" ? [...WORDS.cause, "puisque"] : [...WORDS[part.relation], ...EXTRA_WRITTEN[part.relation]];
  const vowel = startsWithVowel(part.after);
  const same = words.flatMap((word) => {
    if (word === "c'est pourquoi") return [word, "c’est pourquoi"];
    if (vowel && word.endsWith("que")) return [word, `${word.slice(0, -1)}'`, `${word.slice(0, -1)}’`];
    return [word];
  });
  return [part.word, ...same.filter((word) => word !== part.word)];
};
export const WRITE_ROWS: readonly WriteRow[] = CONNECTED_SPREAD.map((part) =>
  wr(`Dans la phrase « ${part.before}${part.relation === "cause" ? "" : ","} ___ ${part.after}. », écris le mot de liaison qui manque.`, accepted(part), WRITE_HINTS, `lia:${part.before}|${part.relation}`),
);
export function makeCm2InfWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-inf-ecrire", CONCEPT, WRITE_ROWS);
}
