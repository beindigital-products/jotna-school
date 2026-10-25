/**
 * LES GABARITS DE LA PHRASE COMPLEXE DU CM2 (`fr-cm2-phrase-complexe`).
 *
 * La fiche demande les propositions indépendantes, juxtaposées et coordonnées, la proposition subordonnée relative (qui, que, dont, où), complément du nom, et le COI
 * et le COS (complément d'objet second). Ici chaque exercice est BÂTI à partir d'un corpus fermé de phrases analysées à la main (le nombre de propositions, leur
 * lien, le pronom relatif, le mot qu'il complète, la fonction d'un groupe), jamais écrit par le modèle. La phrase est TOUJOURS donnée.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Une proposition est bâtie sur un verbe conjugué : « Moussa et Fatou mangent du riz » n'en a qu'une (un sujet double), « Ma sœur prépare le repas et le sert » en a
 *   deux. Un verbe à l'infinitif ne compte pas (« Je veux jouer mais je dois travailler » : deux).
 * - Le mot de liaison d'une phrase à trou n'est choisi que dans un jeu où chaque mauvais choix est faux par le sens : « car » annonce la cause, « donc » la conséquence,
 *   « mais » l'opposition. « Et » n'est jamais un mauvais choix (il se lit presque partout), et « ou » ne se pose pas : « Dépêche-toi ou tu rateras le car » se lit aussi avec « car ».
 * - Un pronom relatif a une seule bonne réponse dans la phrase : « qui » remplace le sujet, « que » un COD, « dont » un complément en « de », « où » un lieu. On n'emploie pas
 *   « habiter » (« le village que nous habitons » se dit aussi) ni « le jour que » (un usage régional, que l'école ne reconnaît pas).
 * - Le COI se construit avec « à » ou « de » sans COD ; le COS suit un COD (« donner un livre à Awa »). On ne pose pas les verbes qui se prêtent à deux analyses.
 * - Une phrase n'a qu'une apostrophe droite au plus.
 *
 * HORS FICHE, À FAIRE RELIRE : les cent phrases du corpus et leur analyse, « jouer au ballon » comme COI, « sourire aux enfants » et « rêver de leurs vacances » comme COI.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LE CORPUS
// ===========================================================================

/** Une phrase à une proposition. */
export const SIMPLE: readonly string[] = [
  "Awa chante une chanson.",
  "Les enfants jouent dans la cour.",
  "Moussa et Fatou mangent du riz.",
  "Le pêcheur lance son filet dans la mer.",
  "Le car arrive demain matin.",
  "Nous achetons du pain et des mangues.",
  "Le maître donne un livre à Awa.",
  "Mon frère travaille dans le champ.",
  "Les femmes vendent des légumes au marché.",
  "Khady lit un livre sur les baobabs.",
  "Ma mère et ma tante préparent le repas.",
  "Le chef parle aux villageois.",
];
/** Des propositions juxtaposées : séparées par une virgule, sans mot de liaison. Le nombre de propositions suit. */
export const JUXTAPOSED: readonly (readonly [string, number])[] = [
  ["Awa chante, Moussa danse.", 2],
  ["Le soleil se lève, les oiseaux chantent.", 2],
  ["Il pleut, les enfants restent à la maison.", 2],
  ["Fatou lit, Modou dessine.", 2],
  ["Le vent souffle, les feuilles tombent.", 2],
  ["Le car arrive, les voyageurs montent.", 2],
  ["Les pêcheurs partent, la mer est calme.", 2],
  ["Le chef parle, tout le monde écoute.", 2],
  ["J'arrive, tu pars.", 2],
  ["La nuit tombe, le village s'endort.", 2],
  ["Le coq chante, le jour se lève, les paysans partent.", 3],
];
/** Des propositions coordonnées par une conjonction de coordination (et, mais, donc, car, ou). */
export const COORDINATED: readonly (readonly [string, number])[] = [
  ["Awa chante et Moussa danse.", 2],
  ["Il est petit mais il court vite.", 2],
  ["Awa reste à la maison car elle est malade.", 2],
  ["Il a beaucoup plu donc la route est inondée.", 2],
  ["Moussa pêche et sa sœur vend le poisson.", 2],
  ["Le chat dort mais le chien veille.", 2],
  ["Je veux jouer mais je dois travailler.", 2],
  ["Nous avons faim donc nous mangeons.", 2],
  ["Elle ouvre la porte et elle sort.", 2],
  ["Il ne sort pas car il est malade.", 2],
  ["Les enfants jouent et les parents bavardent.", 2],
  ["Ma sœur prépare le repas et le sert.", 2],
];
/** Deux phrases à trois propositions qui mêlent juxtaposition et coordination : elles ne se posent que pour compter. */
export const MIXED: readonly (readonly [string, number])[] = [
  ["Il pleut, nous restons dedans et nous jouons.", 3],
  ["Le coq chante, le jour se lève et les paysans partent.", 3],
];

export type Relative = { before: string; rel: string; after: string; pronoun: "qui" | "que" | "dont" | "où"; antecedent: string; others: readonly [string, string] };
const rel = (before: string, relClause: string, after: string, pronoun: Relative["pronoun"], antecedent: string, others: readonly [string, string]): Relative => ({ before, rel: relClause, after, pronoun, antecedent, others });
/** Vingt phrases à une proposition relative : la phrase est « avant + relative + après ». */
export const RELATIVES: readonly Relative[] = [
  rel("Le garçon", "qui joue au ballon", "est mon frère.", "qui", "garçon", ["ballon", "frère"]),
  rel("Un oiseau", "qui chantait", "s'est posé sur le toit.", "qui", "oiseau", ["toit", "chantait"]),
  rel("La femme", "qui vend des mangues", "s'appelle Awa.", "qui", "femme", ["mangues", "Awa"]),
  rel("Les enfants", "qui courent", "sont contents.", "qui", "enfants", ["courent", "contents"]),
  rel("Le pêcheur", "qui lance le filet", "est fort.", "qui", "pêcheur", ["filet", "fort"]),
  rel("Mon voisin", "qui travaille au port", "rentre tard.", "qui", "voisin", ["port", "tard"]),
  rel("Le livre", "que j'ai lu", "est long.", "que", "livre", ["long", "lu"]),
  rel("La mangue", "que tu manges", "est mûre.", "que", "mangue", ["mûre", "manges"]),
  rel("Les chansons", "que Fatou chante", "sont belles.", "que", "chansons", ["Fatou", "belles"]),
  rel("Le poisson", "que le pêcheur a pris", "est gros.", "que", "poisson", ["pêcheur", "gros"]),
  rel("Le cadeau", "que Moussa offre", "est joli.", "que", "cadeau", ["Moussa", "joli"]),
  rel("Les fruits", "que ma mère achète", "sont frais.", "que", "fruits", ["mère", "frais"]),
  rel("La fille", "dont je parle", "est ma cousine.", "dont", "fille", ["cousine", "parle"]),
  rel("Le livre", "dont tu as besoin", "est sur la table.", "dont", "livre", ["table", "besoin"]),
  rel("Le chien", "dont les enfants ont peur", "est attaché.", "dont", "chien", ["enfants", "attaché"]),
  rel("Le village", "dont il vient", "est loin d'ici.", "dont", "village", ["vient", "loin"]),
  rel("La maison", "où Awa dort", "est petite.", "où", "maison", ["Awa", "petite"]),
  rel("Le marché", "où ma mère vend des légumes", "est grand.", "où", "marché", ["légumes", "grand"]),
  rel("La cour", "où les enfants jouent", "est grande.", "où", "cour", ["enfants", "grande"]),
  rel("La ville", "où mon oncle travaille", "est grande.", "où", "ville", ["oncle", "grande"]),
];
const relativeText = (r: Relative) => `${r.before} ${r.rel} ${r.after}`;
const JUXTAPOSED_TWO = JUXTAPOSED.filter(([, count]) => count === 2).map(([text]) => text);
const COORDINATED_TEXTS = COORDINATED.map(([text]) => text);
const RELATIVE_TEXTS = RELATIVES.map(relativeText);
const at = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

export type Fn = "COD" | "COI" | "COS";
/** Un groupe de mots d'une phrase, et sa fonction. */
export const OBJECTS: readonly (readonly [string, string, Fn])[] = [
  ["Je donne un livre à Awa.", "un livre", "COD"],
  ["Je donne un livre à Awa.", "à Awa", "COS"],
  ["Le maître prête un crayon à Moussa.", "un crayon", "COD"],
  ["Le maître prête un crayon à Moussa.", "à Moussa", "COS"],
  ["Maman offre un cadeau à ma sœur.", "un cadeau", "COD"],
  ["Maman offre un cadeau à ma sœur.", "à ma sœur", "COS"],
  ["Le pêcheur vend du poisson aux clients.", "du poisson", "COD"],
  ["Le pêcheur vend du poisson aux clients.", "aux clients", "COS"],
  ["Fatou envoie une lettre à sa tante.", "une lettre", "COD"],
  ["Fatou envoie une lettre à sa tante.", "à sa tante", "COS"],
  ["Le chef raconte une histoire aux enfants.", "une histoire", "COD"],
  ["Le chef raconte une histoire aux enfants.", "aux enfants", "COS"],
  ["Papa montre le chemin à Omar.", "le chemin", "COD"],
  ["Papa montre le chemin à Omar.", "à Omar", "COS"],
  ["Nous apportons des mangues à notre voisine.", "des mangues", "COD"],
  ["Nous apportons des mangues à notre voisine.", "à notre voisine", "COS"],
  ["Le maître rend les cahiers aux élèves.", "les cahiers", "COD"],
  ["Le maître rend les cahiers aux élèves.", "aux élèves", "COS"],
  ["Moussa écrit une carte à son ami.", "une carte", "COD"],
  ["Moussa écrit une carte à son ami.", "à son ami", "COS"],
  ["Le directeur donne un prix à Fatou.", "un prix", "COD"],
  ["Le directeur donne un prix à Fatou.", "à Fatou", "COS"],
  ["Ma tante envoie des fruits à mon père.", "des fruits", "COD"],
  ["Ma tante envoie des fruits à mon père.", "à mon père", "COS"],
  ["Le vendeur rend la monnaie au client.", "la monnaie", "COD"],
  ["Le vendeur rend la monnaie au client.", "au client", "COS"],
  ["Tu prêtes ton vélo à ton frère.", "ton vélo", "COD"],
  ["Tu prêtes ton vélo à ton frère.", "à ton frère", "COS"],
  ["Awa parle à Moussa.", "à Moussa", "COI"],
  ["Les élèves obéissent au maître.", "au maître", "COI"],
  ["Fatou téléphone à sa tante.", "à sa tante", "COI"],
  ["Moussa pense à sa mère.", "à sa mère", "COI"],
  ["Nous parlons de notre voyage.", "de notre voyage", "COI"],
  ["Les enfants jouent au ballon.", "au ballon", "COI"],
  ["Tu ressembles à ton père.", "à ton père", "COI"],
  ["Le chef sourit aux enfants.", "aux enfants", "COI"],
  ["Ils rêvent de leurs vacances.", "de leurs vacances", "COI"],
  ["Elle répond à sa voisine.", "à sa voisine", "COI"],
];

export type Link = "juxtaposées" | "coordonnées" | "relative";
const LINK_LABEL: Record<Link, string> = { juxtaposées: "Juxtaposées", coordonnées: "Coordonnées", relative: "Subordonnée relative" };
const LINKS: readonly Link[] = ["juxtaposées", "coordonnées", "relative"];

/** Mêle des listes en prenant un élément de chacune à tour de rôle : chaque palier reçoit un peu de chaque sorte. */
function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const out: T[] = [];
  const longest = Math.max(...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) for (const list of lists) if (i < list.length) out.push(list[i]);
  return out;
}
const concept = "analyser la phrase complexe : propositions, pronom relatif, COI et COS";
const NUMBER_WORD = ["", "une", "deux", "trois"] as const;

// ===========================================================================
// COMBIEN DE PROPOSITIONS ?
// ===========================================================================

type Counted = { text: string; count: number };
const COUNTED: readonly Counted[] = interleave<Counted>([
  SIMPLE.map((text) => ({ text, count: 1 })),
  JUXTAPOSED.map(([text, count]) => ({ text, count })),
  COORDINATED.map(([text, count]) => ({ text, count })),
  RELATIVES.map((r) => ({ text: relativeText(r), count: 2 })),
  MIXED.map(([text, count]) => ({ text, count })),
]);

const COUNT_HINTS = hints("Cherche les verbes conjugués de la phrase.", "Chaque verbe conjugué forme une proposition.", "Un verbe à l'infinitif ne compte pas.");
const countQuestion = (text: string) => `Combien de propositions la phrase « ${text} » contient-elle ?`;

export const COUNT_ROWS: readonly QuestionRow[] = COUNTED.map(({ text, count }) => {
  const others = [1, 2, 3].filter((n) => n !== count);
  return qr(countQuestion(text), String(count), [String(others[0]), String(others[1])], COUNT_HINTS, `phc:${text}`);
});
export function makeCm2PhcCount(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-phc-nombre", concept, COUNT_ROWS, 1, (row) => row.prompt);
}

const WRITE_COUNT_HINTS = hints("Cherche les verbes conjugués de la phrase.", "Chaque verbe conjugué forme une proposition.", "Écris seulement le nombre, en chiffre.");
export const WRITE_ROWS: readonly WriteRow[] = COUNTED.filter(({ text }) => !MIXED.some(([mixed]) => mixed === text)).map(({ text, count }) =>
  wr(`Écris en chiffre le nombre de propositions de la phrase « ${text} ».`, [String(count), NUMBER_WORD[count]], WRITE_COUNT_HINTS, `phc:${text}`),
);
export function makeCm2PhcWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-phc-ecrire", concept, WRITE_ROWS);
}

// ===========================================================================
// COMMENT LES PROPOSITIONS SONT-ELLES RELIÉES ?
// ===========================================================================

type Linked = { text: string; link: Link };
const LINKED: readonly Linked[] = interleave<Linked>([
  JUXTAPOSED.filter(([, count]) => count === 2).map(([text]) => ({ text, link: "juxtaposées" as const })),
  COORDINATED.map(([text]) => ({ text, link: "coordonnées" as const })),
  RELATIVES.map((r) => ({ text: relativeText(r), link: "relative" as const })),
]);

const LINK_HINTS = hints("Regarde ce qui sépare les deux verbes.", "Une virgule seule sépare deux propositions de même rang.", "Un pronom comme qui, que, dont ou où commence une proposition qui complète un nom.");
export const LINK_QUESTION_ROWS: readonly QuestionRow[] = LINKED.map(({ text, link }) => {
  const others = LINKS.filter((candidate) => candidate !== link);
  return qr(`Comment sont reliées les propositions de la phrase « ${text} » ?`, LINK_LABEL[link], [LINK_LABEL[others[0]], LINK_LABEL[others[1]]], LINK_HINTS, `phc:${text}`);
});
export function makeCm2PhcLink(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-phc-lien", concept, LINK_QUESTION_ROWS, 1, (row) => row.prompt);
}

// ===========================================================================
// LE PRONOM RELATIF
// ===========================================================================

const PRONOUNS = ["qui", "que", "dont", "où"] as const;
const PRONOUN_HINTS = hints("Lis la phrase sans le pronom.", "Demande-toi si le pronom remplace le sujet, un COD, un complément en « de » ou un lieu.", "Un complément qui commence par « de » appelle un pronom particulier, et un lieu en appelle un autre.");
function pronounRow(r: Relative, index: number): GapRow {
  const others = PRONOUNS.filter((candidate) => candidate !== r.pronoun);
  // Les deux mauvais choix tournent d'une ligne à l'autre : les trois autres pronoms sont fautifs dans chaque phrase.
  const first = others[index % 3];
  const second = others[(index + 1) % 3];
  return gr(`${r.before} ___ ${r.rel.slice(r.pronoun.length + 1)} ${r.after}`, r.pronoun, [first, second], PRONOUN_HINTS, `phc:${relativeText(r)}`);
}
export const PRONOUN_ROWS: readonly GapRow[] = interleave<Relative>([RELATIVES.filter((r) => r.pronoun === "qui"), RELATIVES.filter((r) => r.pronoun === "que"), RELATIVES.filter((r) => r.pronoun === "dont"), RELATIVES.filter((r) => r.pronoun === "où")]).map(pronounRow);
export function makeCm2PhcPronoun(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-phc-pronom", concept, PRONOUN_ROWS, 1, 0, "Complète la phrase avec le bon pronom relatif.");
}

const ANTECEDENT_HINTS = hints("Le pronom remplace un mot déjà dit.", "Ce mot est juste avant le pronom.", "C'est le nom que le reste de la proposition complète.");
export const ANTECEDENT_ROWS: readonly QuestionRow[] = interleave<Relative>([RELATIVES.filter((r) => r.pronoun === "qui"), RELATIVES.filter((r) => r.pronoun === "que"), RELATIVES.filter((r) => r.pronoun === "dont"), RELATIVES.filter((r) => r.pronoun === "où")]).map((r) =>
  qr(`Dans la phrase « ${relativeText(r)} », quel mot le pronom « ${r.pronoun} » complète-t-il ?`, r.antecedent, [r.others[0], r.others[1]], ANTECEDENT_HINTS, `phc:${relativeText(r)}`),
);
export function makeCm2PhcAntecedent(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-phc-antecedent", concept, ANTECEDENT_ROWS, 1, (row) => row.prompt, 1);
}

const RELATIVE_HINTS = hints("Cherche, dans chaque phrase, un pronom qui reprend un nom déjà nommé.", "Ce pronom commence un groupe qui complète ce nom.", "Dans les autres phrases, une virgule ou un mot de liaison sépare les verbes.");
/** La phrase à relative et, à côté d'elle, une phrase à propositions juxtaposées et une à propositions coordonnées : trois phrases de longueur voisine. */
export const RELATIVE_ROWS: readonly QuestionRow[] = interleave<Relative>([RELATIVES.filter((r) => r.pronoun === "qui"), RELATIVES.filter((r) => r.pronoun === "que"), RELATIVES.filter((r) => r.pronoun === "dont"), RELATIVES.filter((r) => r.pronoun === "où")]).map((r, index) =>
  qr("Quelle phrase contient une proposition subordonnée relative ?", relativeText(r), [at(JUXTAPOSED_TWO, index * 3 + 1), at(COORDINATED_TEXTS, index * 5 + 2)], RELATIVE_HINTS, `phc:${relativeText(r)}`),
);
export function makeCm2PhcRelative(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-phc-relative", concept, RELATIVE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 2);
}

// ===========================================================================
// LA FONCTION D'UN GROUPE : COD, COI, COS
// ===========================================================================

const FUNCTIONS: readonly Fn[] = ["COD", "COI", "COS"];
const FUNCTION_HINTS = hints("Pose la question qui ? ou quoi ? juste après le verbe.", "Un COI se relie au verbe par à ou de, sans autre objet.", "Un COS suit un premier objet et se relie au verbe par à.");
export const FUNCTION_ROWS: readonly QuestionRow[] = interleave<readonly [string, string, Fn]>([OBJECTS.filter((o) => o[2] === "COD"), OBJECTS.filter((o) => o[2] === "COI"), OBJECTS.filter((o) => o[2] === "COS")]).map(([sentence, group, fn]) => {
  const others = FUNCTIONS.filter((candidate) => candidate !== fn);
  return qr(`Dans la phrase « ${sentence} », quelle est la fonction du groupe « ${group} » ?`, fn, [others[0], others[1]], FUNCTION_HINTS, `phc:${sentence}:${group}`);
});
export function makeCm2PhcFunction(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-phc-fonction", concept, FUNCTION_ROWS, 1, (row) => row.prompt);
}

// ===========================================================================
// LE MOT DE LIAISON
// ===========================================================================

type Conjunction = "mais" | "car" | "donc";
const CONJUNCTIONS: readonly Conjunction[] = ["mais", "car", "donc"];
/** Six phrases pour chaque mot : l'opposition, la cause, la conséquence. Un autre mot de la liste rend la phrase fausse par le sens. */
export const LIAISONS: readonly (readonly [string, string, Conjunction])[] = [
  ["Il est petit", "il court très vite.", "mais"],
  ["Le sol est mouillé", "il a plu.", "car"],
  ["Il a beaucoup plu", "la route est inondée.", "donc"],
  ["Moussa est fatigué", "il continue de travailler.", "mais"],
  ["Awa reste à la maison", "elle est malade.", "car"],
  ["Awa est fatiguée", "elle se couche tôt.", "donc"],
  ["Awa est malade", "elle va à l'école.", "mais"],
  ["Les enfants sont contents", "c'est vendredi.", "car"],
  ["Moussa a faim", "il mange du riz.", "donc"],
  ["Il pleut", "nous sortons quand même.", "mais"],
  ["Moussa mange beaucoup", "il a très faim.", "car"],
  ["Le car est en retard", "nous attendons.", "donc"],
  ["Je voudrais venir", "je n'ai pas le temps.", "mais"],
  ["Nous rentrons", "la nuit tombe.", "car"],
  ["Il fait nuit", "les enfants dorment.", "donc"],
  ["Le car est ancien", "il roule bien.", "mais"],
  ["Fatou allume la lampe", "il fait sombre.", "car"],
  ["Le puits est vide", "les femmes vont à la rivière.", "donc"],
];
const LIAISON_HINTS = hints("Demande-toi pourquoi les deux propositions sont ensemble.", "Une opposition, une cause et une conséquence ont chacune leur mot.", "Lis la phrase avec chaque mot avant de choisir.");
export const LIAISON_ROWS: readonly GapRow[] = interleave<readonly [string, string, Conjunction]>([LIAISONS.filter((l) => l[2] === "mais"), LIAISONS.filter((l) => l[2] === "car"), LIAISONS.filter((l) => l[2] === "donc")]).map(([first, second, answer], index) => {
  const others = CONJUNCTIONS.filter((candidate) => candidate !== answer);
  return gr(`${first}, ___ ${second}`, answer, [others[index % 2], others[(index + 1) % 2]], LIAISON_HINTS, `phc:${first}`);
});
export function makeCm2PhcLiaison(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-phc-conjonction", concept, LIAISON_ROWS, 1, 0, "Complète la phrase avec le bon mot de liaison.");
}

// ===========================================================================
// RELIER, GLISSER
// ===========================================================================

const RELIER_HINTS = hints("Regarde ce qui relie les verbes de chaque phrase.", "Un pronom qui reprend un nom déjà nommé commence une proposition particulière.", "Commence par la phrase qui te paraît la plus facile.");
export const LINK_ROWS: readonly LinkRow[] = Array.from({ length: 30 }, (_, n) => {
  const triple: [string, Link][] = [
    [at(JUXTAPOSED_TWO, n * 3 + 1), "juxtaposées"],
    [at(COORDINATED_TEXTS, n * 5 + 2), "coordonnées"],
    [at(RELATIVE_TEXTS, n * 7 + 3), "relative"],
  ];
  return { prompt: "Relie chaque phrase à ce qui lie ses propositions.", pairs: triple.map(([left, link]) => ({ left, right: LINK_LABEL[link] })), hints: RELIER_HINTS, fact: `phc:${triple[0][0]}` };
});
export function makeCm2PhcLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-phc-relier", concept, LINK_ROWS);
}

const SORT_HINTS = hints("Compte les verbes conjugués de chaque ligne.", "Un seul verbe conjugué, c'est une seule proposition.", "Deux verbes conjugués ou plus font plusieurs propositions.");
const COMPLEX_TEXTS = [...JUXTAPOSED_TWO, ...COORDINATED_TEXTS, ...RELATIVE_TEXTS];
export const SORT_ROWS: readonly SortRow[] = Array.from({ length: 30 }, (_, n) => {
  const simple = [at(SIMPLE, n * 2), at(SIMPLE, n * 2 + 5)];
  const complex = [at(COMPLEX_TEXTS, n * 4 + 1), at(COMPLEX_TEXTS, n * 4 + 22)];
  const zones: readonly [string, string] = ["Phrase simple", "Phrase complexe"];
  return { prompt: "Glisse chaque phrase dans la bonne case.", zones, items: [...simple.map((text) => ({ text, zone: zones[0] })), ...complex.map((text) => ({ text, zone: zones[1] }))], hints: SORT_HINTS, fact: `phc:${simple[0]}` };
});
export function makeCm2PhcSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-phc-glisser", concept, SORT_ROWS);
}

