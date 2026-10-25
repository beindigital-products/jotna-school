/**
 * LES GABARITS DE LA POÉSIE DU CM2 (`fr-cm2-poesie`).
 *
 * La fiche demande les vers, les strophes, les rimes, les sonorités, les comparaisons, jouer avec les mots, déclamer. Elle ajoute une règle : on peut nommer les poètes du Sénégal, mais on ne leur
 * attribue JAMAIS des vers. Aucun nom de poète n'est donc écrit ici, et les dix poèmes sont écrits pour l'exercice : chaque énoncé qui en porte un commence par « Poème écrit pour l'exercice. ».
 *
 * Chaque exercice est BÂTI à partir de tableaux fermés (dix-huit familles de mots qui riment, dix poèmes, douze vers à sonorité, douze comparaisons), jamais écrit par le modèle.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Une rime est un SON, pas une écriture : « soleil » rime avec « réveil », « poisson » avec « maison ». Les familles réunissent des mots qui se terminent par le même son ; deux familles
 *   proches à l'oreille (« papier » et « journée », « plante » et « vent ») ne sont jamais dans le même exercice, et les familles « journée » et « plante » n'existent pas ici.
 * - Les poèmes n'ont ni apostrophe ni deux-points : l'énoncé en porte déjà une (« pour l'exercice »), et il n'en a qu'une au plus. Un poème de huit vers a deux strophes.
 * - Dans un poème à trou, le mot manquant est le dernier d'un vers qui doit rimer avec un autre ; un mauvais choix ne rime avec aucun vers de la strophe.
 * - Une allitération répète la même consonne au début de plusieurs mots d'un vers (« Le serpent siffle sur le sable ») ; un vers qui n'en a pas ne répète aucune initiale.
 * - Une comparaison emploie « comme » entre ce qu'on compare et ce à quoi on le compare ; les mauvais choix n'ont ni « comme » ni « pareil ».
 *
 * HORS FICHE, À FAIRE RELIRE : les dix poèmes (le matin, le marché, la pluie, le baobab, la mer, ma maison, la classe, la lune, les saisons, les amis) et leurs rimes, les dix-huit familles de rimes,
 * les douze vers à sonorité, les douze comparaisons.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "lire un poème : vers, strophes, rimes, sonorités, comparaisons";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

// ===========================================================================
// LES FAMILLES DE MOTS QUI RIMENT
// ===========================================================================

/** Dix-huit familles : des mots de même son final. Aucun mot n'est dans deux familles. */
export const FAMILIES: readonly (readonly string[])[] = [
  ["soleil", "réveil", "sommeil", "pareil", "vermeil"],
  ["maison", "chanson", "saison", "poisson", "ballon"],
  ["caillou", "genou", "bijou", "hibou", "verrou"],
  ["village", "nuage", "courage", "paysage", "plage"],
  ["papier", "panier", "cahier", "sentier", "fermier"],
  ["bateau", "ruisseau", "oiseau", "château", "drapeau"],
  ["cuisine", "voisine", "colline", "racine", "machine"],
  ["famille", "fille", "bille", "brille", "coquille"],
  ["fleur", "bonheur", "chaleur", "couleur", "douleur"],
  ["rive", "olive", "arrive", "vive", "dérive"],
  ["miroir", "soir", "espoir", "noir", "tiroir"],
  ["chemin", "matin", "main", "pain", "jardin"],
  ["hirondelle", "belle", "ficelle", "étincelle", "échelle"],
  ["vent", "enfant", "content", "volant", "géant"],
  ["port", "fort", "dort", "trésor", "or"],
  ["douce", "pousse", "mousse", "secousse", "rousse"],
  ["mer", "hiver", "fer", "air", "éclair"],
  ["lune", "dune", "prune", "brune", "fortune"],
];

/** Les familles proches à l'oreille : elles ne se côtoient jamais dans un exercice (indices de `FAMILIES`). */
const CLOSE_GROUPS: readonly (readonly number[])[] = [[0, 7], [1, 11, 13], [8, 16], [5, 14]];
const close = (a: number, b: number) => a === b || CLOSE_GROUPS.some((group) => group.includes(a) && group.includes(b));
/** La première famille, à partir de `from`, qui n'est proche d'aucune de `avoid`. */
function farFrom(from: number, avoid: readonly number[]): number {
  for (let step = 0; step < FAMILIES.length; step++) {
    const candidate = (((from + step) % FAMILIES.length) + FAMILIES.length) % FAMILIES.length;
    if (avoid.every((other) => !close(candidate, other))) return candidate;
  }
  return from % FAMILIES.length;
}

const RHYME_HINTS = hints("Une rime est un son à la fin du mot.", "Dis les mots à voix haute et écoute la fin.", "Écris-les : la fin peut s'écrire de façons différentes.");
/** Un mot et un autre mot de sa famille ; les mauvais choix viennent de deux autres familles. */
export const RHYME_ROWS: readonly QuestionRow[] = Array.from({ length: 54 }, (_, index) => {
  const family = FAMILIES[index % FAMILIES.length];
  const turn = Math.floor(index / FAMILIES.length);
  const word = family[turn % family.length];
  const answer = family[(turn + 2 + (index % 2)) % family.length];
  const firstAt = farFrom(index + 3, [index % FAMILIES.length]);
  const first = FAMILIES[firstAt];
  const second = FAMILIES[farFrom(index + 7, [index % FAMILIES.length, firstAt])];
  return qr(`Quel mot rime avec « ${word} » ?`, answer, [cycle(first, index), cycle(second, index + 1)], RHYME_HINTS, `poe:rime:${index}`);
});
export function makeCm2PoeRhyme(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-poe-rime", CONCEPT, RHYME_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

const ODD_HINTS = hints("Dis les trois mots à voix haute.", "Deux mots finissent par le même son.", "Le mot qui finit autrement est l'intrus.");
export const ODD_ROWS: readonly QuestionRow[] = Array.from({ length: 36 }, (_, index) => {
  const family = FAMILIES[index % FAMILIES.length];
  const turn = Math.floor(index / FAMILIES.length);
  const other = FAMILIES[farFrom(index + 5 + turn, [index % FAMILIES.length])];
  return qr("Quel mot ne rime pas avec les deux autres ?", cycle(other, index), [cycle(family, turn), cycle(family, turn + 2)], ODD_HINTS, `poe:intrus:${index}`);
});
export function makeCm2PoeOdd(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-poe-intrus", CONCEPT, ODD_ROWS, 1, (row) => `${row.answer}|${row.wrong.join(",")}`);
}

const LINK_HINTS = hints("Deux mots riment quand ils finissent par le même son.", "Dis chaque mot à voix haute avant de relier.", "Commence par la paire dont tu es sûr.");
/** Trois familles dont aucune ne ressemble à l'oreille à une autre. */
export const LINK_ROWS: readonly LinkRow[] = Array.from({ length: 24 }, (_, index) => {
  const first = index % FAMILIES.length;
  const second = farFrom(index + 4, [first]);
  const picked = [first, second, farFrom(index + 9, [first, second])];
  const turn = Math.floor(index / FAMILIES.length);
  return {
    prompt: "Relie chaque mot au mot qui rime avec lui.",
    pairs: picked.map((at, n) => ({ left: FAMILIES[at][(turn + n) % 5], right: FAMILIES[at][(turn + n + 2) % 5] })),
    hints: LINK_HINTS,
    fact: `poe:relier:${picked.join(",")}:${turn}`,
  };
});
export function makeCm2PoeLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-poe-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Dis chaque mot et compare sa fin à celle de l'étiquette.", "Deux mots riment quand ils finissent par le même son.", "Commence par le mot dont tu es sûr.");
export const SORT_ROWS: readonly SortRow[] = Array.from({ length: 36 }, (_, index) => {
  const a = FAMILIES[index % FAMILIES.length];
  const b = FAMILIES[farFrom(index + 5 + Math.floor(index / FAMILIES.length), [index % FAMILIES.length])];
  const zones = [`Rime avec ${a[0]}`, `Rime avec ${b[0]}`] as const;
  const turn = Math.floor(index / FAMILIES.length);
  return {
    prompt: "Glisse chaque mot dans la bonne case.",
    zones,
    items: [
      { text: a[1 + (turn % 4)], zone: zones[0] },
      { text: a[1 + ((turn + 2) % 4)], zone: zones[0] },
      { text: b[1 + ((turn + 1) % 4)], zone: zones[1] },
      { text: b[1 + ((turn + 3) % 4)], zone: zones[1] },
    ],
    hints: SORT_HINTS,
    fact: `poe:glisser:${index}`,
  };
});
export function makeCm2PoeSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-poe-glisser", CONCEPT, SORT_ROWS);
}

// ===========================================================================
// LES POÈMES : strophes, vers, schéma des rimes
// ===========================================================================

type Scheme = "AABB" | "ABAB" | "ABBA";
export type Stanza = { verses: readonly [string, string, string, string]; scheme: Scheme };
export type Poem = { title: string; stanzas: readonly Stanza[] };
const stanza = (scheme: Scheme, v1: string, v2: string, v3: string, v4: string): Stanza => ({ scheme, verses: [v1, v2, v3, v4] });

export const POEMS: readonly Poem[] = [
  {
    title: "Le matin",
    stanzas: [
      stanza("AABB", "Le coq chante au petit matin", "Le soleil monte sur le chemin", "Les enfants courent vers la plage", "Et le vent pousse un grand nuage"),
      stanza("AABB", "La journée peut commencer", "Chacun part travailler", "Le village se réveille", "Sous le soleil vermeil"),
    ],
  },
  { title: "Le marché", stanzas: [stanza("ABAB", "Au marché, les mangues sont sur la table", "Les enfants sourient près du bateau", "Une dame vend du riz fort aimable", "Et le vent agite les drapeaux")] },
  { title: "La pluie", stanzas: [stanza("ABBA", "La pluie tombe sur le toit", "Les enfants regardent le ciel", "Les gouttes brillent comme du miel", "Et le village sourit parfois")] },
  { title: "Le baobab", stanzas: [stanza("AABB", "Le baobab est un grand géant", "Il vit depuis très longtemps", "Son tronc sert de maison aux oiseaux", "Qui chantent le soir sur ses rameaux")] },
  { title: "La mer", stanzas: [stanza("AABB", "La mer est calme comme un lac", "Les pêcheurs rentrent avec leur sac", "Les vagues chantent doucement", "Et dansent sur le sable blanc")] },
  { title: "Ma maison", stanzas: [stanza("ABAB", "Ma maison est petite", "Elle a un grand jardin", "Chaque soir on me rend visite", "Et je partage mon pain")] },
  { title: "La classe", stanzas: [stanza("AABB", "Le maître écrit au tableau", "Je dessine un petit chapeau", "Nous lisons tous ensemble", "Les mots qui se ressemblent")] },
  { title: "La lune", stanzas: [stanza("ABBA", "La lune sur la dune", "Elle guide les voyageurs", "Et rassure les rêveurs", "Elle sourit à chacune")] },
  {
    title: "Les saisons",
    stanzas: [
      stanza("AABB", "En juillet vient la pluie", "Tout le pays est réjoui", "Les champs deviennent tout verts", "Et les rivières sont claires"),
      stanza("ABAB", "Puis vient la saison sèche", "Le vent souffle fort", "Les pêcheurs partent à la pêche", "Le soir ils rentrent au port"),
    ],
  },
  { title: "Les amis", stanzas: [stanza("AABB", "Mon ami Moussa est gentil", "Il chante et rit, il me sourit", "Nous partageons notre pain", "Chaque jour sans nul chagrin")] },
];

const HEADER = "Poème écrit pour l'exercice.";
const stanzaText = (verses: readonly string[]) => verses.join("\n");
const poemText = (poem: Poem) => poem.stanzas.map((s) => stanzaText(s.verses)).join("\n\n");

const SCHEME_LABEL: Record<Scheme, string> = {
  AABB: "Les vers 1 et 2, puis les vers 3 et 4",
  ABAB: "Les vers 1 et 3, puis les vers 2 et 4",
  ABBA: "Les vers 1 et 4, puis les vers 2 et 3",
};
const SCHEMES: readonly Scheme[] = ["AABB", "ABAB", "ABBA"];
const SCHEME_HINTS = hints("Regarde le dernier mot de chaque ligne.", "Deux lignes riment quand leurs derniers mots finissent par le même son.", "Cherche la ligne qui rime avec la première.");
export const SCHEME_ROWS: readonly QuestionRow[] = POEMS.flatMap((poem, index) =>
  poem.stanzas.map((s, n) => {
    const others = SCHEMES.filter((scheme) => scheme !== s.scheme);
    return qr(`${HEADER}\n\n${stanzaText(s.verses)}\n\nQuels vers riment ensemble ?`, SCHEME_LABEL[s.scheme], [SCHEME_LABEL[others[0]], SCHEME_LABEL[others[1]]], SCHEME_HINTS, `poe:schema:${index}:${n}`);
  }),
);
export function makeCm2PoeScheme(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-poe-schema", CONCEPT, SCHEME_ROWS);
}

const COUNT_HINTS = hints("Un vers est une ligne du poème.", "Une strophe est un groupe de vers séparé des autres par un blanc.", "Compte avec ton doigt, ligne après ligne.");
const NUMBER_WORD = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"] as const;
export const COUNT_ROWS: readonly WriteRow[] = POEMS.flatMap((poem, index) => {
  const verses = poem.stanzas.length * 4;
  const stanzas = poem.stanzas.length;
  return [
    wr(`${HEADER}\n\n${poemText(poem)}\n\nCombien de vers ce poème contient-il ?`, [String(verses), NUMBER_WORD[verses]], COUNT_HINTS, `poe:compte:${index}:vers`),
    wr(`${HEADER}\n\n${poemText(poem)}\n\nCombien de strophes ce poème contient-il ?`, [String(stanzas), NUMBER_WORD[stanzas]], COUNT_HINTS, `poe:compte:${index}:strophes`),
  ];
});
export function makeCm2PoeCount(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-poe-compter", CONCEPT, COUNT_ROWS);
}

// ---------------------------------------------------------------------------
// Le mot qui rime, à la fin d'un vers
// ---------------------------------------------------------------------------

type Blank = { poem: number; stanza: number; verse: 1 | 3; answer: string; wrong: readonly [string, string] };
/** Pour chaque strophe à trou : le vers dont le dernier mot est caché, sa bonne réponse, et deux mots qui ne riment avec aucun vers de la strophe. */
const BLANKS: readonly Blank[] = [
  { poem: 0, stanza: 0, verse: 1, answer: "chemin", wrong: ["soleil", "oiseau"] },
  { poem: 0, stanza: 0, verse: 3, answer: "nuage", wrong: ["soleil", "oiseau"] },
  { poem: 0, stanza: 1, verse: 1, answer: "travailler", wrong: ["maison", "dormir"] },
  { poem: 0, stanza: 1, verse: 3, answer: "vermeil", wrong: ["chemin", "plage"] },
  { poem: 1, stanza: 0, verse: 3, answer: "drapeaux", wrong: ["maison", "jardin"] },
  { poem: 2, stanza: 0, verse: 3, answer: "parfois", wrong: ["jardin", "mangue"] },
  { poem: 3, stanza: 0, verse: 1, answer: "longtemps", wrong: ["village", "soleil"] },
  { poem: 3, stanza: 0, verse: 3, answer: "rameaux", wrong: ["tronc", "arbre"] },
  { poem: 4, stanza: 0, verse: 1, answer: "sac", wrong: ["mer", "sable"] },
  { poem: 4, stanza: 0, verse: 3, answer: "blanc", wrong: ["mer", "sable"] },
  { poem: 5, stanza: 0, verse: 3, answer: "pain", wrong: ["fleur", "soleil"] },
  { poem: 6, stanza: 0, verse: 1, answer: "chapeau", wrong: ["village", "soleil"] },
  { poem: 6, stanza: 0, verse: 3, answer: "ressemblent", wrong: ["village", "soleil"] },
  { poem: 7, stanza: 0, verse: 3, answer: "chacune", wrong: ["maison", "soleil"] },
  { poem: 8, stanza: 0, verse: 1, answer: "réjoui", wrong: ["maison", "soleil"] },
  { poem: 8, stanza: 1, verse: 3, answer: "port", wrong: ["maison", "soleil"] },
  { poem: 9, stanza: 0, verse: 1, answer: "sourit", wrong: ["fleur", "soleil"] },
  { poem: 9, stanza: 0, verse: 3, answer: "chagrin", wrong: ["fleur", "soleil"] },
];
const lastWord = (verse: string) => verse.split(" ").pop() as string;
const GAP_HINTS = hints("Le mot qui manque est le dernier du vers.", "Il rime avec le dernier mot d'un autre vers de la strophe.", "Dis à voix haute les derniers mots des autres vers.");
export const POEM_GAP_ROWS: readonly GapRow[] = BLANKS.map((blank, index) => {
  const poem = POEMS[blank.poem];
  const verses = poem.stanzas[blank.stanza].verses.map((verse, at) => (at === blank.verse ? `${verse.slice(0, verse.length - lastWord(verse).length)}___` : verse));
  const before = poem.stanzas.slice(0, blank.stanza).map((s) => stanzaText(s.verses));
  const after = poem.stanzas.slice(blank.stanza + 1).map((s) => stanzaText(s.verses));
  return gr(`${HEADER}\n\n${[...before, stanzaText(verses), ...after].join("\n\n")}`, blank.answer, blank.wrong, GAP_HINTS, `poe:trou:${index}`);
});
export function makeCm2PoeGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-poe-trou", CONCEPT, POEM_GAP_ROWS, 1, 0, "Complète le dernier mot du vers avec celui qui rime.");
}

// ===========================================================================
// LES SONORITÉS : UN VERS QUI RÉPÈTE UNE CONSONNE
// ===========================================================================

export const ALLITERATIONS: readonly string[] = [
  "Le serpent siffle sur le sable",
  "Papa prépare le petit pain",
  "Un gros gorille gronde",
  "Le chat chante dans la chambre",
  "Les fourmis fuient la fumée",
  "Trois tortues traversent la route",
  "Le vent vole vers le village",
  "Un beau bateau berce les bébés",
  "Les lions lèvent leurs larges têtes",
  "Cinq cigales chantent sans cesse",
  "Madame Marie mange une mangue",
  "Des doux dindons dorment dehors",
];
/** Des vers dont les mots de quatre lettres ou plus commencent tous par une consonne différente. */
export const PLAIN_VERSES: readonly string[] = [
  "Le chat dort sur la natte",
  "Les garçons écoutent un conte",
  "Le pêcheur lance son filet",
  "Ma tante vend des mangues",
  "Une fleur pousse au jardin",
  "Le soleil brille sur la mer",
  "Mon frère mange du pain",
  "Les élèves ouvrent leurs cahiers",
  "La maîtresse corrige les devoirs",
  "Un oiseau chante sur le toit",
  "Le village dort sous la lune",
  "Nous buvons de l'eau fraîche",
];
const SOUND_HINTS = hints("Lis chaque ligne à voix haute.", "Cherche le son qui revient plusieurs fois.", "Regarde la première lettre des mots importants.");
export const SOUND_ROWS: readonly QuestionRow[] = ALLITERATIONS.flatMap((verse, index) =>
  [0, 1].map((n) => qr("Quel vers répète le même son au début de plusieurs mots ?", verse, [cycle(PLAIN_VERSES, index + n * 5), cycle(PLAIN_VERSES, index + n * 5 + 3)], SOUND_HINTS, `poe:son:${index}:${n}`)),
);
export function makeCm2PoeSound(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-poe-sonorite", CONCEPT, SOUND_ROWS, 1, (row) => `${row.answer}|${row.wrong.join(",")}`);
}

// ===========================================================================
// LES COMPARAISONS
// ===========================================================================

type Comparison = { right: string; wrong: readonly [string, string] };
export const COMPARISONS: readonly Comparison[] = [
  { right: "Le soleil est rond comme une orange.", wrong: ["Le soleil brille dans le ciel.", "Le soleil se lève tôt le matin."] },
  { right: "Sa voix est douce comme le miel.", wrong: ["Sa voix résonne dans la classe.", "Sa voix chante une belle chanson."] },
  { right: "La nuit est noire comme du charbon.", wrong: ["La nuit tombe sur le village.", "La nuit dure longtemps en hiver."] },
  { right: "Il court rapide comme un éclair.", wrong: ["Il court vers la maison.", "Il court dans la cour de l'école."] },
  { right: "Elle est légère comme une plume.", wrong: ["Elle porte un seau d'eau.", "Elle marche près du fleuve."] },
  { right: "Le baobab est grand comme une maison.", wrong: ["Le baobab donne de l'ombre.", "Le baobab pousse près du village."] },
  { right: "La mer est calme comme un lac.", wrong: ["La mer est bleue ce matin.", "La mer baigne la plage."] },
  { right: "Ses mains sont froides comme la glace.", wrong: ["Ses mains tiennent un livre.", "Ses mains dessinent un arbre."] },
  { right: "Le lion est fort comme un géant.", wrong: ["Le lion dort sous un arbre.", "Le lion chasse dans la savane."] },
  { right: "Mon frère est têtu comme une mule.", wrong: ["Mon frère aime les mangues.", "Mon frère joue au football."] },
  { right: "Le vent hurle comme un loup.", wrong: ["Le vent agite les feuilles.", "Le vent vient de la mer."] },
  { right: "Ses yeux brillent comme des étoiles.", wrong: ["Ses yeux regardent le ciel.", "Ses yeux sont fatigués ce soir."] },
];
const COMPARE_HINTS = hints("Une comparaison rapproche deux choses avec un petit mot.", "Cherche le petit mot qui sert à comparer.", "Élimine les phrases qui ne comparent rien.");
export const COMPARE_ROWS: readonly QuestionRow[] = COMPARISONS.flatMap((item, index) =>
  [0, 1].map((n) => qr("Dans quelle phrase y a-t-il une comparaison ?", item.right, n === 0 ? [item.wrong[0], item.wrong[1]] : [item.wrong[1], cycle(COMPARISONS, index + 3).wrong[0]], COMPARE_HINTS, `poe:compare:${index}:${n}`)),
);
export function makeCm2PoeCompare(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-poe-comparer", CONCEPT, COMPARE_ROWS, 1, (row) => row.answer + row.wrong.join("|"));
}

type Image = { text: string; answer: string; wrong: readonly [string, string] };
const IMAGES: readonly Image[] = [
  { text: "Il est fort comme ___.", answer: "un lion", wrong: ["un escargot", "une plume"] },
  { text: "Elle court, rapide comme ___.", answer: "l'éclair", wrong: ["une tortue", "un caillou"] },
  { text: "Ce sac est léger comme ___.", answer: "une plume", wrong: ["un rocher", "un éléphant"] },
  { text: "Cet agneau est doux comme ___.", answer: "du coton", wrong: ["un caillou", "un clou"] },
  { text: "Mon frère est malin comme ___.", answer: "un singe", wrong: ["une pierre", "un sac"] },
  { text: "Mon ami est têtu comme ___.", answer: "une mule", wrong: ["une feuille", "une plume"] },
  { text: "Le coton est blanc comme ___.", answer: "la neige", wrong: ["le charbon", "la nuit"] },
  { text: "La nuit est noire comme ___.", answer: "le charbon", wrong: ["la neige", "le lait"] },
  { text: "L'escargot est lent comme ___.", answer: "une tortue", wrong: ["un éclair", "un guépard"] },
  { text: "L'eau du puits est froide comme ___.", answer: "la glace", wrong: ["le feu", "le soleil"] },
  { text: "Le four est chaud comme ___.", answer: "le feu", wrong: ["la glace", "la neige"] },
  { text: "L'enfant est sage comme ___.", answer: "une image", wrong: ["un orage", "un volcan"] },
];
const IMAGE_HINTS = hints("Une comparaison doit avoir du sens.", "Pense à la qualité dont on parle, comme la force ou la douceur.", "Élimine ce qui dit le contraire.");
export const IMAGE_ROWS: readonly GapRow[] = IMAGES.map((item, index) => gr(item.text, item.answer, item.wrong, IMAGE_HINTS, `poe:image:${index}`));
export function makeCm2PoeImage(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-poe-comparaison", CONCEPT, IMAGE_ROWS, 1, 0, "Complète la comparaison.");
}
