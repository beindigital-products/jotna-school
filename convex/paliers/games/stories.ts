/**
 * LE MONDE DES PETITS PROBLÈMES DU CI : les enfants, les choses qu'ils ont, les
 * verbes qui en ajoutent ou en enlèvent, les scènes à regarder, les cases d'un
 * tableau à double entrée. De quoi écrire, sans modèle, un problème dont la
 * réponse est certaine (`problems.ts`).
 *
 * Le modèle écrivait « Awa a 3 mangues, elle en mange 5 », « le poule », « 1
 * mangues », « vend-t-il ». Ici chaque chose est écrite UNE fois avec son
 * genre, son pluriel, son émoji et les verbes qui lui vont (on ne mange pas une
 * bille) ; chaque forme interrogative est écrite à la main, jamais fabriquée.
 *
 * RÈGLES POUR AJOUTER UNE CHOSE
 * - Un émoji ancien (Unicode 11 au plus, sans sélecteur de variation).
 * - Le singulier est dans `genders.ts` avec le même genre : un test le vérifie.
 * - Une famille d'au moins deux membres : au dernier palier, le mauvais choix
 *   vient de la même famille que la réponse.
 * - `clashes` : les émojis qu'on confond en petit (🥭 et 🍊) ne se montrent
 *   jamais dans une même image.
 * - 🔵 est une bille, et seulement une bille : il n'entre dans aucun tableau
 *   comme « rond bleu », l'enfant verrait le même dessin sous deux noms.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { Gender } from "../genders";

// ===========================================================================
// LES ENFANTS
// ===========================================================================

/** Un prénom : son genre (« il » ou « elle »), et s'il commence par une voyelle (« d'Awa »). */
export type Child = { name: string; gender: Gender; vowel: boolean };

const girl = (name: string): Child => ({ name, gender: "f", vowel: /^[aeiouyAEIOUY]/.test(name) });
const boy = (name: string): Child => ({ name, gender: "m", vowel: /^[aeiouyAEIOUY]/.test(name) });

/**
 * Vingt prénoms : dix gabarits par palier en tirent jusqu'à treize, et deux
 * histoires voisines (la donnée inutile, le problème avec donnée inutile) ne
 * doivent pas tomber sur le même héros.
 */
export const CHILDREN: readonly Child[] = [
  girl("Awa"),
  girl("Fatou"),
  girl("Mariama"),
  girl("Aïssatou"),
  girl("Penda"),
  girl("Khady"),
  girl("Sokhna"),
  girl("Coumba"),
  girl("Ndèye"),
  girl("Rama"),
  boy("Moussa"),
  boy("Modou"),
  boy("Ibrahima"),
  boy("Ousmane"),
  boy("Cheikh"),
  boy("Mamadou"),
  boy("Abdou"),
  boy("Lamine"),
  boy("Samba"),
  boy("Malick"),
];

/** « il » ou « elle ». */
export const pronoun = (child: Child): "il" | "elle" => (child.gender === "f" ? "elle" : "il");

/** « a-t-il » ou « a-t-elle ». */
export const hasHe = (child: Child): string => `a-t-${pronoun(child)}`;

/** « de Moussa », « d'Awa ». */
export const ofChild = (child: Child): string => (child.vowel ? `d'${child.name}` : `de ${child.name}`);

// ===========================================================================
// LES VERBES
// ===========================================================================

/** Un verbe qui enlève : sa forme au présent (« mange ») et sa forme interrogative sans le pronom (« mange-t- »). */
export type Verb = { present: string; question: string };

/** Les verbes de retrait, chaque forme écrite : « vend-il », jamais « vend-t-il ». */
export const VERBS = {
  mange: { present: "mange", question: "mange-t-" },
  donne: { present: "donne", question: "donne-t-" },
  perd: { present: "perd", question: "perd-" },
  vend: { present: "vend", question: "vend-" },
} as const satisfies Record<string, Verb>;

export type VerbKey = keyof typeof VERBS;

/** « mange-t-elle », « vend-il ». */
export const asks = (verb: Verb, child: Child): string => `${verb.question}${pronoun(child)}`;

// ===========================================================================
// LES CHOSES
// ===========================================================================

export type Family = "fruit" | "nourriture" | "jeu" | "animal" | "ecole";

/** Comment un enfant se retrouve avec « ces mangues » sous les yeux : il les cueille, les achète, ou les a. */
export type Gets = "cueille" | "achète" | "a";

export type Item = {
  emoji: string;
  singular: string;
  plural: string;
  gender: Gender;
  family: Family;
  /** Le pluriel commence par une voyelle : « d'oranges », jamais « de oranges ». */
  vowel: boolean;
  /** Les verbes de retrait qui lui vont : on vend une poule, on ne la mange pas dans un problème de CI. */
  remove: readonly VerbKey[];
  gets: Gets;
  /** Les émojis qu'on confond avec lui en petit : jamais ensemble dans une image. */
  clashes: readonly string[];
};

function item(
  emoji: string,
  singular: string,
  plural: string,
  gender: Gender,
  family: Family,
  remove: readonly VerbKey[],
  gets: Gets,
  clashes: readonly string[] = [],
): Item {
  return { emoji, singular, plural, gender, family, vowel: /^[aeiouyéè]/i.test(plural), remove, gets, clashes };
}

/** Les choses du quotidien, chaque famille avec au moins deux membres. */
export const ITEMS: readonly Item[] = [
  item("🥭", "mangue", "mangues", "f", "fruit", ["mange", "donne", "vend"], "cueille", ["🍊"]),
  item("🍌", "banane", "bananes", "f", "fruit", ["mange", "donne", "vend"], "cueille"),
  item("🍊", "orange", "oranges", "f", "fruit", ["mange", "donne", "vend"], "cueille", ["🥭"]),
  item("🥖", "pain", "pains", "m", "nourriture", ["mange", "donne"], "achète"),
  item("🍬", "bonbon", "bonbons", "m", "nourriture", ["mange", "donne", "perd"], "achète"),
  item("🔵", "bille", "billes", "f", "jeu", ["donne", "perd"], "a"),
  item("⚽", "ballon", "ballons", "m", "jeu", ["donne", "perd"], "a"),
  item("🐔", "poule", "poules", "f", "animal", ["vend", "donne"], "a"),
  item("🐑", "mouton", "moutons", "m", "animal", ["vend", "donne"], "a"),
  item("🐄", "vache", "vaches", "f", "animal", ["vend", "donne"], "a"),
  item("🐟", "poisson", "poissons", "m", "animal", ["vend", "mange", "donne"], "achète"),
  item("📒", "cahier", "cahiers", "m", "ecole", ["donne", "perd"], "achète"),
  item("📏", "règle", "règles", "f", "ecole", ["donne", "perd"], "achète"),
];

/** « 1 mangue », « 3 mangues » : le nombre en chiffres, le nom accordé. */
export const quantity = (n: number, thing: Item): string => `${n} ${n === 1 ? thing.singular : thing.plural}`;

/** « de mangues », « d'oranges ». */
export const ofItems = (thing: Item): string => (thing.vowel ? `d'${thing.plural}` : `de ${thing.plural}`);

/** Deux choses qu'on ne met pas dans la même image. */
export const clash = (a: Item, b: Item): boolean => a.clashes.includes(b.emoji) || b.clashes.includes(a.emoji);

// ===========================================================================
// LES SCÈNES À REGARDER (image-compter)
// ===========================================================================

/** Un lieu et les choses qu'on y voit : aucun pluriel à voyelle (« Combien de … vois-tu » sans apostrophe). */
export type Scene = { place: string; things: readonly Item[] };

const itemOf = (emoji: string): Item => ITEMS.find((thing) => thing.emoji === emoji)!;

export const SCENES: readonly Scene[] = [
  { place: "dans la cour", things: [itemOf("🐔"), itemOf("🐑"), itemOf("🐄")] },
  { place: "dans le panier", things: [itemOf("🥭"), itemOf("🍌"), itemOf("🥖")] },
  { place: "sur la table", things: [itemOf("📒"), itemOf("📏"), itemOf("🍬")] },
];

// ===========================================================================
// LE TABLEAU À DOUBLE ENTRÉE (tableau-case)
// ===========================================================================

export type CellObject = "coeur" | "livre" | "losange";
export type CellColor = "rouge" | "bleu" | "vert" | "jaune" | "orange" | "violet" | "noir";

/** Une case : un émoji dont l'objet et la couleur ne font pas de doute. */
export type Cell = { emoji: string; object: CellObject; color: CellColor };

const cell = (emoji: string, object: CellObject, color: CellColor): Cell => ({ emoji, object, color });

/**
 * Toutes les cases possibles. Les cœurs et les livres portent trois couleurs
 * communes (vert, bleu, orange), les losanges deux (orange, bleu) ; les autres
 * couleurs ne servent qu'aux mauvais choix (« un cœur, mais jaune »). Pas de
 * cœur rouge (il exige un sélecteur de variation), pas de rond bleu (c'est la
 * bille), pas de rond ni de carré blanc (invisibles sur fond blanc).
 */
export const CELLS: readonly Cell[] = [
  cell("💙", "coeur", "bleu"),
  cell("💚", "coeur", "vert"),
  cell("💛", "coeur", "jaune"),
  cell("🧡", "coeur", "orange"),
  cell("💜", "coeur", "violet"),
  cell("🖤", "coeur", "noir"),
  cell("📕", "livre", "rouge"),
  cell("📗", "livre", "vert"),
  cell("📘", "livre", "bleu"),
  cell("📙", "livre", "orange"),
  cell("🔶", "losange", "orange"),
  cell("🔷", "losange", "bleu"),
];

export const cellOf = (object: CellObject, color: CellColor): Cell | undefined =>
  CELLS.find((c) => c.object === object && c.color === color);

/** Une grille complète : chaque objet existe dans chaque couleur. */
export type Grid = { objects: readonly CellObject[]; colors: readonly CellColor[] };

/** Les grilles de deux cases sur deux ; la 2 × 3 et la 3 × 2 servent aux paliers avancés. */
export const SMALL_GRIDS: readonly Grid[] = [
  { objects: ["coeur", "livre"], colors: ["vert", "bleu"] },
  { objects: ["coeur", "livre"], colors: ["bleu", "orange"] },
  { objects: ["coeur", "livre"], colors: ["vert", "orange"] },
  { objects: ["coeur", "losange"], colors: ["orange", "bleu"] },
  { objects: ["livre", "losange"], colors: ["orange", "bleu"] },
];

export const LARGE_GRIDS: readonly Grid[] = [
  { objects: ["coeur", "livre"], colors: ["vert", "bleu", "orange"] },
  { objects: ["coeur", "livre", "losange"], colors: ["orange", "bleu"] },
];

/** La case qui manque dans le tableau : un point d'interrogation (Unicode 6.0), rendu en émoji sans sélecteur. */
export const MISSING_CELL = "❔";

/** Les âges d'un enfant de l'histoire : la donnée qui ne sert à rien pour compter des mangues. */
export const AGES: readonly number[] = [5, 6, 7, 8, 9];
