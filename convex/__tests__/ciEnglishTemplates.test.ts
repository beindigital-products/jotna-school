import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { ANIMALS, COLOURS, FRUITS, SAYINGS } from "../paliers/games/anglaisCi";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

/**
 * LES GABARITS D'ANGLAIS DU CI : les salutations, les couleurs, les nombres de 0 à 10, les animaux, les fruits.
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (un mot, son dessin, son sens en français,
 * les couleurs qu'on confond, ce qu'on dit dans chaque situation) : il recalcule la bonne réponse depuis l'énoncé
 * et les tuiles, et il liste ce qui cloche. Un test abîme ensuite chaque gabarit (la bonne réponse déplacée, une
 * paire croisée, une case changée) et exige que son vérificateur le voie : un contrôle qui ne verrait rien ne
 * prouverait rien. Le modèle avait écrit cent dix-huit exercices pour ces cinq thématiques, un sur trois faux,
 * ambigu ou hors niveau (six étoiles pour « seven », un cheval hors de la ferme, « hello » et « hi » tous deux
 * justes, « I see a ___ » où trois mots vont).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `en:${level}:${n}` })));
/** Un tirage sur deux : cent vingt tirages qui couvrent les quatre niveaux. */
const spread = draws.filter((_, i) => i % 2 === 0);
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => exo.payload.text as string;
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level;

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const stripEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
const quoted = (prompt: string) => /« ([^»]+) »/.exec(prompt)?.[1] ?? "";
/** « la couleur rouge » donne « rouge », « l'oiseau » donne « oiseau ». */
const frenchNoun = (text: string) => text.replace(/^(?:la couleur|le|la|l'|les)\s*/u, "");
const lastLine = (prompt: string) => prompt.split("\n").slice(1).join("\n");

const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const JOINER = String.fromCodePoint(0x200d);

const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const distinct = (label: string, values: readonly string[]): string[] => isTrue(`${label} : des doublons dans ${JSON.stringify(values)}`, new Set(values).size === values.length);

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

/** Un animal : son dessin, son nom français, où il vit (la ferme, la nature, ou ni l'un ni l'autre). */
const ANIMAL = {
  dog: ["🐶", "chien", "autre"],
  cat: ["🐱", "chat", "autre"],
  bird: ["🐦", "oiseau", "autre"],
  fish: ["🐟", "poisson", "autre"],
  cow: ["🐄", "vache", "ferme"],
  goat: ["🐐", "chèvre", "ferme"],
  sheep: ["🐑", "mouton", "ferme"],
  horse: ["🐴", "cheval", "ferme"],
  chicken: ["🐔", "poule", "ferme"],
  monkey: ["🐒", "singe", "sauvage"],
  lion: ["🦁", "lion", "sauvage"],
  elephant: ["🐘", "éléphant", "sauvage"],
} as const;
const FRUIT = {
  mango: ["🥭", "mangue"],
  banana: ["🍌", "banane"],
  orange: ["🍊", "orange"],
  apple: ["🍎", "pomme"],
  lemon: ["🍋", "citron"],
  watermelon: ["🍉", "pastèque"],
  pineapple: ["🍍", "ananas"],
} as const;

const ANIMAL_OF_EMOJI = Object.fromEntries(Object.entries(ANIMAL).map(([en, [emoji]]) => [emoji, en]));
const ANIMAL_OF_FRENCH = Object.fromEntries(Object.entries(ANIMAL).map(([en, [, fr]]) => [fr, en]));
const FRUIT_OF_EMOJI = Object.fromEntries(Object.entries(FRUIT).map(([en, [emoji]]) => [emoji, en]));
const FRUIT_OF_FRENCH = Object.fromEntries(Object.entries(FRUIT).map(([en, [, fr]]) => [fr, en]));

/** La couleur de chaque dessin (ronds, cœurs, chocolat) et de chaque chose, sans doute possible. */
const COLOUR_OF: Record<string, string> = {
  "🔴": "red",
  "🔵": "blue",
  "💛": "yellow",
  "💚": "green",
  "🧡": "orange",
  "🖤": "black",
  "⚪": "white",
  "💗": "pink",
  "🍫": "brown",
  "💜": "purple",
  "🍅": "red",
  "🍓": "red",
  "🌊": "blue",
  "🍌": "yellow",
  "🍋": "yellow",
  "🌻": "yellow",
  "🥒": "green",
  "🐸": "green",
  "🥬": "green",
  "🥕": "orange",
  "🎃": "orange",
  "🥛": "white",
  "🦷": "white",
  "⛄": "white",
  "🐷": "pink",
  "🌸": "pink",
  "🐻": "brown",
  "🥜": "brown",
  "🍆": "purple",
};
const THING_NAME: Record<string, string> = {
  "🍅": "tomate",
  "🍓": "fraise",
  "🌊": "vague",
  "🍌": "banane",
  "🍋": "citron",
  "🌻": "tournesol",
  "🥒": "concombre",
  "🐸": "grenouille",
  "🥬": "salade",
  "🥕": "carotte",
  "🎃": "citrouille",
  "🥛": "lait",
  "🦷": "dent",
  "⛄": "bonhomme de neige",
  "🐷": "cochon",
  "🌸": "fleur de cerisier",
  "🐻": "ours",
  "🥜": "cacahuète",
  "🍆": "aubergine",
};
const COLOUR_FRENCH: Record<string, string> = {
  rouge: "red",
  bleu: "blue",
  jaune: "yellow",
  vert: "green",
  orange: "orange",
  noir: "black",
  blanc: "white",
  rose: "pink",
  marron: "brown",
  violet: "purple",
  // « la couleur » est féminin : l'énoncé accorde l'adjectif.
  bleue: "blue",
  verte: "green",
  noire: "black",
  blanche: "white",
  violette: "purple",
};
/** Les couleurs qu'un enfant confond : une banane trop mûre est brune, une tomate verte est rouge qui n'a pas mûri. */
const CONFUSABLE: readonly [string, string][] = [
  ["red", "orange"],
  ["red", "pink"],
  ["red", "brown"],
  ["red", "purple"],
  ["orange", "yellow"],
  ["orange", "brown"],
  ["orange", "pink"],
  ["yellow", "green"],
  ["yellow", "brown"],
  ["yellow", "white"],
  ["green", "blue"],
  ["green", "brown"],
  ["blue", "purple"],
  ["blue", "black"],
  ["purple", "pink"],
  ["purple", "black"],
  ["pink", "white"],
  ["brown", "black"],
];
const confusable = (a: string, b: string) => CONFUSABLE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const BASIC_COLOURS = ["red", "blue", "yellow", "green", "black", "white"];

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const numberRange = (level: number): [number, number] => (level === 1 ? [1, 5] : level === 2 ? [0, 8] : [0, 10]);
const inRange = (label: string, n: number, level: number): string[] => {
  const [min, max] = numberRange(level);
  return isTrue(`${label} : ${n} hors de ${min} à ${max} au niveau ${level}`, n >= min && n <= max);
};
const COUNTABLES = ["🍎", "⚽", "⭐", "🐟", "🌸", "🥭"];

const FRENCH_MEANING: Record<string, string> = {
  bonjour: "hello",
  "au revoir": "goodbye",
  merci: "thank you",
  pardon: "sorry",
  "s'il te plaît": "please",
  oui: "yes",
  non: "no",
  "bonne nuit": "good night",
};
const PICTURE_WORD: Record<string, string> = { "🌅": "good morning", "🌙": "good night", "👍": "yes", "👎": "no", "😔": "sorry" };
/** Ce qu'on peut dire dans chaque situation : tous les mots justes, jumeaux compris. */
const ACCEPTABLE: Record<string, readonly string[]> = {
  "Tu arrives à l'école.": ["hello", "hi", "good morning"],
  "Ton oncle arrive chez toi.": ["hello", "hi", "good morning"],
  "Tu pars de l'école.": ["goodbye", "bye"],
  "Ton ami s'en va.": ["goodbye", "bye"],
  "On te donne un cadeau.": ["thank you"],
  "Ta tante te donne une mangue.": ["thank you"],
  "Tu marches sur le pied de ton ami.": ["sorry"],
  "Tu bouscules ton ami sans le vouloir.": ["sorry"],
  "Tu demandes du pain poliment.": ["please"],
  "Tu vas te coucher.": ["good night"],
  "Ton ami te propose un jeu que tu acceptes.": ["yes", "please", "thank you"],
  "Ton ami te propose un jeu que tu refuses.": ["no", "thank you"],
};
const NAMES = ["Awa", "Modou", "Fatou", "Cheikh", "Aminata", "Ibrahima"];
const SAY_HELLO = ["hello", "hi", "good morning"];
const SAY_GOODBYE = ["goodbye", "bye"];

// ---------------------------------------------------------------------------
// Les vérificateurs : ce qui cloche dans un exercice, ou rien
// ---------------------------------------------------------------------------

type Check = (exo: Exo) => string[];

/** La bonne réponse d'un QCM sur un mot : le mot attendu, parmi trois mots tous connus et différents. */
const qcmWord = (exo: Exo, expected: string | undefined, known: (word: string) => boolean): string[] => [
  ...isTrue("réponse attendue inconnue", expected !== undefined),
  ...eq("bonne option", rightOption(exo), expected),
  ...distinct("options", optionsOf(exo)),
  ...eq("nombre d'options", optionsOf(exo).length, 3),
  ...optionsOf(exo).flatMap((option) => isTrue(`option inconnue « ${option} »`, known(option))),
  ...eq("clé", exo.answerKey, expected),
];

/** Les paires d'une association : des côtés tous différents et chaque paire juste. */
const pairChecks = (exo: Exo, right: (pair: { left: string; right: string }) => string[]): string[] => [
  ...distinct("côtés gauches", pairsOf(exo).map((pair) => pair.left)),
  ...distinct("côtés droits", pairsOf(exo).map((pair) => pair.right)),
  ...pairsOf(exo).flatMap(right),
  ...isTrue("moins de trois paires", pairsOf(exo).length >= 3),
];

const knownIn = (table: Record<string, unknown>) => (word: string) => word in table;

const CHECKS: Record<string, Check> = {
  // --- les animaux
  "animal-mot": (exo) => qcmWord(exo, ANIMAL_OF_EMOJI[lastLine(exo.prompt)], knownIn(ANIMAL)),
  "animal-francais": (exo) => qcmWord(exo, ANIMAL_OF_FRENCH[frenchNoun(quoted(exo.prompt))], knownIn(ANIMAL)),
  "animal-relier": (exo) =>
    pairChecks(exo, ({ left, right }) =>
      right in ANIMAL ? isTrue(`paire fausse ${left} ~ ${right}`, ANIMAL[right as keyof typeof ANIMAL][0] === left || ANIMAL[right as keyof typeof ANIMAL][1] === left) : [`mot inconnu ${right}`],
    ),
  "animal-glisser": (exo) => [
    ...eq("cases", [...zonesOf(exo)].sort(), ["Animaux de la ferme", "Animaux sauvages"]),
    ...itemsOf(exo).flatMap((item) => {
      const word = stripEmoji(item.text);
      if (!(word in ANIMAL)) return [`mot inconnu ${word}`];
      const home = ANIMAL[word as keyof typeof ANIMAL][2];
      return home === "autre" ? [`${word} ne va dans aucune case`] : eq(`case de ${word}`, item.correctZone, home === "ferme" ? "Animaux de la ferme" : "Animaux sauvages");
    }),
    ...zonesOf(exo).flatMap((zone) => isTrue(`case vide ${zone}`, itemsOf(exo).filter((item) => item.correctZone === zone).length >= 1)),
    ...isTrue("nombre de mots", itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6),
  ],
  "animal-intrus": (exo) => {
    const homes = optionsOf(exo).map((option) => ANIMAL[stripEmoji(option) as keyof typeof ANIMAL]?.[2]);
    const wanted = exo.prompt === "Lequel vit à la ferme ?" ? "ferme" : exo.prompt === "Lequel ne vit pas à la ferme ?" ? "sauvage" : "?";
    const other = wanted === "ferme" ? "sauvage" : "ferme";
    return [
      ...isTrue(`question inconnue « ${exo.prompt} »`, wanted !== "?"),
      ...eq("un seul de la famille demandée", homes.filter((home) => home === wanted).length, 1),
      ...eq("deux de l'autre famille", homes.filter((home) => home === other).length, 2),
      ...eq("bonne option", ANIMAL[stripEmoji(rightOption(exo)) as keyof typeof ANIMAL]?.[2], wanted),
      ...distinct("options", optionsOf(exo)),
      ...optionsOf(exo).flatMap((option) => isTrue(`la tuile ${option} n'a pas son dessin`, option.startsWith(ANIMAL[stripEmoji(option) as keyof typeof ANIMAL]?.[0] ?? "?"))),
    ];
  },
  // --- les fruits
  "fruit-mot": (exo) => qcmWord(exo, FRUIT_OF_EMOJI[lastLine(exo.prompt)], knownIn(FRUIT)),
  "fruit-francais": (exo) => qcmWord(exo, FRUIT_OF_FRENCH[frenchNoun(quoted(exo.prompt))], knownIn(FRUIT)),
  "fruit-relier": (exo) =>
    pairChecks(exo, ({ left, right }) =>
      right in FRUIT ? isTrue(`paire fausse ${left} ~ ${right}`, FRUIT[right as keyof typeof FRUIT][0] === left || FRUIT[right as keyof typeof FRUIT][1] === left) : [`mot inconnu ${right}`],
    ),
  "fruit-glisser": (exo) => [
    ...eq("cases", [...zonesOf(exo)].sort(), ["Animaux", "Fruits"]),
    ...itemsOf(exo).flatMap((item) => {
      const word = stripEmoji(item.text);
      return eq(`case de ${word}`, item.correctZone, word in FRUIT ? "Fruits" : word in ANIMAL ? "Animaux" : "?");
    }),
    ...zonesOf(exo).flatMap((zone) => isTrue(`case vide ${zone}`, itemsOf(exo).filter((item) => item.correctZone === zone).length >= 1)),
    ...isTrue("nombre de mots", itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6),
  ],
  "fruit-intrus": (exo) => {
    const isFruit = optionsOf(exo).map((option) => stripEmoji(option) in FRUIT);
    const isAnimal = optionsOf(exo).map((option) => stripEmoji(option) in ANIMAL);
    const wantFruit = exo.prompt === "Lequel est un fruit ?";
    return [
      ...isTrue(`question inconnue « ${exo.prompt} »`, wantFruit || exo.prompt === "Lequel n'est pas un fruit ?"),
      ...eq("fruits proposés", isFruit.filter(Boolean).length, wantFruit ? 1 : 2),
      ...eq("animaux proposés", isAnimal.filter(Boolean).length, wantFruit ? 2 : 1),
      ...eq("bonne option", wantFruit ? stripEmoji(rightOption(exo)) in FRUIT : stripEmoji(rightOption(exo)) in ANIMAL, true),
      ...distinct("options", optionsOf(exo)),
    ];
  },
  // --- les couleurs
  "couleur-mot": (exo) => {
    const colour = COLOUR_OF[lastLine(exo.prompt)];
    return [
      ...qcmWord(exo, colour, (word) => Object.values(COLOUR_FRENCH).includes(word)),
      ...optionsOf(exo).flatMap((option) => (option === colour ? [] : isTrue(`${option} se confond avec ${colour}`, !confusable(option, colour)))),
      ...(levelOf(exo) === 1 ? optionsOf(exo).flatMap((option) => isTrue(`${option} n'est pas une couleur du premier palier`, BASIC_COLOURS.includes(option))) : []),
    ];
  },
  "couleur-chose": (exo) => {
    const emoji = lastLine(exo.prompt);
    const colour = COLOUR_OF[emoji];
    return [
      ...isTrue(`le nom de la chose ne va pas avec ${emoji}`, exo.prompt.split("\n")[0].includes(THING_NAME[emoji] ?? "?")),
      ...qcmWord(exo, colour, (word) => Object.values(COLOUR_FRENCH).includes(word)),
      ...optionsOf(exo).flatMap((option) => (option === colour ? [] : isTrue(`${option} se confond avec ${colour}`, !confusable(option, colour)))),
    ];
  },
  "couleur-francais": (exo) => qcmWord(exo, COLOUR_FRENCH[frenchNoun(quoted(exo.prompt))], (word) => Object.values(COLOUR_FRENCH).includes(word)),
  "couleur-relier": (exo) => pairChecks(exo, ({ left, right }) => eq(`couleur de ${left}`, COLOUR_OF[left], right)),
  "couleur-glisser": (exo) => {
    const zones = zonesOf(exo);
    return [
      ...eq("deux cases", zones.length, 2),
      ...isTrue(`${zones.join(" et ")} se confondent`, zones.length === 2 && !confusable(zones[0], zones[1])),
      ...itemsOf(exo).flatMap((item) => eq(`case de ${item.text}`, item.correctZone, COLOUR_OF[item.text])),
      ...zones.flatMap((zone) => isTrue(`moins de deux dessins sous ${zone}`, itemsOf(exo).filter((item) => item.correctZone === zone).length >= 2)),
      ...distinct("dessins", itemsOf(exo).map((item) => item.text)),
    ];
  },
  "couleur-phrase": (exo) => {
    const emoji = textOf(exo).split(" ")[0];
    const colour = COLOUR_OF[emoji];
    const { options, answer } = blankOf(exo);
    return [
      ...eq("phrase", textOf(exo), `${emoji} It is ___.`),
      ...eq("réponse", answer, colour),
      ...eq("clé", exo.answerKey, colour),
      ...distinct("options", options),
      ...eq("nombre d'options", options.length, 3),
      ...options.flatMap((option) => (option === colour ? [] : isTrue(`${option} se confond avec ${colour}`, !confusable(option, colour)))),
    ];
  },
  // --- les nombres de 0 à 10
  "compte-mot": (exo) => {
    const n = Number(/chiffre (\d+) \?/.exec(exo.prompt)?.[1]);
    return [...qcmWord(exo, WORDS[n], (word) => WORDS.includes(word)), ...inRange("chiffre", n, levelOf(exo))];
  },
  "compte-chiffre": (exo) => {
    const word = textOf(exo).replace(" = ___", "");
    const n = WORDS.indexOf(word);
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue(`mot inconnu ${word}`, n >= 0),
      ...eq("réponse", answer, String(n)),
      ...distinct("options", options),
      ...eq("nombre d'options", options.length, 3),
      ...options.flatMap((option) => isTrue(`chiffre hors de 0 à 10 : ${option}`, /^(\d|10)$/.test(option))),
      ...inRange("chiffre", n, levelOf(exo)),
    ];
  },
  "compte-dessins": (exo) => {
    const rows = lastLine(exo.prompt).split("\n");
    const glyphs = rows.flatMap((row) => Array.from(row));
    const n = glyphs.length;
    return [
      ...qcmWord(exo, WORDS[n], (word) => WORDS.includes(word)),
      ...isTrue("des dessins de plusieurs sortes", new Set(glyphs).size === 1 && COUNTABLES.includes(glyphs[0])),
      ...isTrue("plus de deux rangées", rows.length <= 2),
      ...isTrue("une rangée de plus de cinq", rows.every((row) => Array.from(row).length <= 5)),
      ...isTrue("zéro dessin", n >= 1),
      ...inRange("nombre de dessins", n, levelOf(exo)),
    ];
  },
  "compte-relier": (exo) => pairChecks(exo, ({ left, right }) => eq(`mot de ${left}`, WORDS[Number(left)], right)),
  "compte-relier-dessins": (exo) => [
    ...pairChecks(exo, ({ left, right }) => {
      const glyphs = Array.from(left);
      return [
        ...isTrue(`groupe de plusieurs sortes ${left}`, new Set(glyphs).size === 1 && COUNTABLES.includes(glyphs[0])),
        ...eq(`mot de ${left}`, WORDS[glyphs.length], right),
        ...isTrue(`plus de cinq dessins dans une tuile : ${left}`, glyphs.length <= 5),
      ];
    }),
    ...distinct("dessins", pairsOf(exo).map((pair) => Array.from(pair.left)[0])),
  ],
  "compte-ordre": (exo) => {
    const numbers = sequenceOf(exo).map((word) => WORDS.indexOf(word));
    return [
      ...isTrue("mot inconnu", numbers.every((n) => n >= 0)),
      ...eq("ordre", numbers, [...numbers].sort((a, b) => a - b)),
      ...distinct("mots", sequenceOf(exo)),
      ...eq("nombre de mots", sequenceOf(exo).length, levelOf(exo) === 1 ? 3 : 4),
      ...numbers.flatMap((n) => inRange("nombre", n, levelOf(exo))),
    ];
  },
  "compte-suivant": (exo) => {
    const n = Number(/après (\d+) \?/.exec(exo.prompt)?.[1]);
    return [
      ...qcmWord(exo, WORDS[n + 1], (word) => WORDS.includes(word)),
      ...inRange("repère", n, levelOf(exo)),
      ...inRange("réponse", n + 1, levelOf(exo)),
      ...isTrue("le repère est une option", !optionsOf(exo).includes(WORDS[n])),
    ];
  },
  "compte-suite": (exo) => {
    const shown = textOf(exo).replace(", ___", "").split(", ").map((word) => WORDS.indexOf(word));
    const step = shown[1] - shown[0];
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("mot inconnu", shown.every((n) => n >= 0)),
      ...eq("nombres montrés", shown.length, levelOf(exo) === 1 ? 2 : 3),
      ...isTrue("pas de un", Math.abs(step) === 1),
      ...eq("suite régulière", shown.slice(1).map((n, i) => n - shown[i]), shown.slice(1).map(() => step)),
      ...isTrue("une suite qui descend avant le troisième niveau", step === 1 || levelOf(exo) >= 3),
      ...eq("réponse", answer, WORDS[shown[shown.length - 1] + step]),
      ...distinct("options", options),
      ...eq("nombre d'options", options.length, 3),
      ...options.flatMap((option) => isTrue(`${option} est déjà dans la suite`, option === answer || !shown.includes(WORDS.indexOf(option)))),
      ...[...shown, shown[shown.length - 1] + step].flatMap((n) => inRange("nombre", n, levelOf(exo))),
    ];
  },
  "compte-glisser": (exo) => {
    const mark = Number(/Moins de (\d+)/.exec(zonesOf(exo)[0])?.[1]);
    return [
      ...eq("cases", zonesOf(exo), [`Moins de ${mark}`, `Plus de ${mark}`]),
      ...itemsOf(exo).flatMap((item) => {
        const n = WORDS.indexOf(item.text);
        return [
          ...isTrue(`mot inconnu ${item.text}`, n >= 0),
          ...isTrue(`le repère ${mark} est un mot à ranger`, n !== mark),
          ...eq(`case de ${item.text}`, item.correctZone, n < mark ? `Moins de ${mark}` : `Plus de ${mark}`),
        ];
      }),
      ...zonesOf(exo).flatMap((zone) => isTrue(`case vide ${zone}`, itemsOf(exo).some((item) => item.correctZone === zone))),
      ...itemsOf(exo).flatMap((item) => inRange("nombre", WORDS.indexOf(item.text), levelOf(exo))),
      ...distinct("mots", itemsOf(exo).map((item) => item.text)),
    ];
  },
  // --- les salutations
  "salut-francais": (exo) => qcmWord(exo, FRENCH_MEANING[quoted(exo.prompt)], (word) => Object.values(FRENCH_MEANING).includes(word)),
  "salut-dessin": (exo) => qcmWord(exo, PICTURE_WORD[lastLine(exo.prompt)], (word) => Object.values(PICTURE_WORD).includes(word)),
  "salut-situation": (exo) => {
    const situation = exo.prompt.replace(" Que dis-tu en anglais ?", "");
    const acceptable = ACCEPTABLE[situation];
    return [
      ...isTrue(`situation inconnue « ${situation} »`, acceptable !== undefined),
      ...isTrue("la bonne option n'est pas juste", acceptable?.includes(rightOption(exo)) ?? false),
      ...eq("un seul mot juste parmi les choix", optionsOf(exo).filter((option) => acceptable?.includes(option)).length, 1),
      ...distinct("options", optionsOf(exo)),
      ...eq("nombre d'options", optionsOf(exo).length, 3),
      ...optionsOf(exo).flatMap((option) => isTrue(`mot inconnu ${option}`, Object.values(FRENCH_MEANING).includes(option))),
      ...eq("clé", exo.answerKey, rightOption(exo)),
    ];
  },
  "salut-relier": (exo) =>
    pairChecks(exo, ({ left, right }) => {
      const meaning = left in PICTURE_WORD ? PICTURE_WORD[left] : FRENCH_MEANING[left];
      return eq(`sens de ${left}`, meaning, right);
    }),
  "salut-glisser": (exo) => [
    ...eq("cases", [...zonesOf(exo)].sort(), ["Pour dire au revoir", "Pour dire bonjour"]),
    ...itemsOf(exo).flatMap((item) => {
      const expected = SAY_HELLO.includes(item.text) ? "Pour dire bonjour" : SAY_GOODBYE.includes(item.text) ? "Pour dire au revoir" : "?";
      return eq(`case de ${item.text}`, item.correctZone, expected);
    }),
    ...zonesOf(exo).flatMap((zone) => isTrue(`case vide ${zone}`, itemsOf(exo).some((item) => item.correctZone === zone))),
    ...distinct("mots", itemsOf(exo).map((item) => item.text)),
  ],
  "salut-prenom": (exo) => {
    const tiles = sequenceOf(exo);
    const name = tiles[tiles.length - 1].replace(".", "");
    const sentence = tiles.join(" ");
    return [
      ...isTrue(`prénom inconnu ${name}`, NAMES.includes(name)),
      ...isTrue(`phrase inconnue « ${sentence} »`, sentence === `I am ${name}.` || sentence === `My name is ${name}.`),
      ...eq("clé", exo.answerKey, sentence),
    ];
  },
  "salut-trou": (exo) => {
    const name = /My ___ is (\w+)\./.exec(textOf(exo))?.[1] ?? "";
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue(`prénom inconnu ${name}`, NAMES.includes(name)),
      ...eq("réponse", answer, "name"),
      ...distinct("options", options),
      ...eq("nombre d'options", options.length, 3),
      ...options.flatMap((option) => isTrue(`${option} fait une phrase`, option === "name" || ["hello", "sorry", "please", "yes", "no", "goodbye"].includes(option))),
    ];
  },
  "salut-trou-dessin": (exo) => {
    const emoji = textOf(exo).split(" ")[0];
    const expected = emoji === "🌅" ? "morning" : emoji === "🌙" ? "night" : "?";
    const { options, answer } = blankOf(exo);
    return [
      ...eq("phrase", textOf(exo), `${emoji} Good ___!`),
      ...eq("réponse", answer, expected),
      ...distinct("options", options),
      ...eq("nombre d'options", options.length, 3),
      ...isTrue("morning et night manquent", options.includes("morning") && options.includes("night")),
      ...options.flatMap((option) => isTrue(`${option} ferait « Good ${option} »`, ["morning", "night", "please", "yes", "sorry", "no"].includes(option))),
    ];
  },
  "salut-rencontre": (exo) => {
    const tiles = sequenceOf(exo);
    const name = /^I am (\w+)\.$/.exec(tiles[1])?.[1] ?? "";
    return [...eq("ordre", [tiles[0], tiles[2]], ["Hello!", "Goodbye!"]), ...isTrue(`prénom inconnu ${name}`, NAMES.includes(name))];
  },
};

const KINDS = Object.keys(CHECKS) as GameKind[];

/** Abîme un exercice : la bonne réponse déplacée, une paire croisée, une case changée. */
function corrupt(exo: Exo): Exo {
  const copy: Exo = JSON.parse(JSON.stringify(exo));
  const p = copy.payload;
  if (copy.type === "qcm") {
    const options = p.options as string[];
    const other = options.findIndex((_, i) => i !== p.correctIndex);
    p.correctIndex = other >= 0 ? other : 0;
  } else if (copy.type === "fill-blank") {
    const blank = (p.blanks as { options: string[]; answer: string }[])[0];
    blank.answer = blank.options.find((option) => option !== blank.answer) as string;
  } else if (copy.type === "order") {
    const sequence = p.correctSequence as string[];
    [sequence[0], sequence[1]] = [sequence[1], sequence[0]];
  } else if (copy.type === "match") {
    const pairs = p.pairs as { left: string; right: string }[];
    [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
  } else if (copy.type === "drag-drop") {
    const items = p.items as { text: string; correctZone: string }[];
    const zones = p.zones as string[];
    items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
  }
  return copy;
}

// ---------------------------------------------------------------------------

describe("les gabarits d'anglais du CI", () => {
  it("ont un vérificateur chacun, et seulement ceux-là", () => {
    const ci = Object.keys(GAME_KINDS).filter((kind) => /^(animal|fruit|couleur|compte|salut)-/.test(kind) && kind !== "couleur-objet");
    expect([...ci].sort()).toEqual([...KINDS].sort());
    expect(KINDS).toHaveLength(34);
  });

  it("donnent une bonne réponse que leur vérificateur retrouve, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const d of spread) {
        const exo = make(kind, d);
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} ${d.seed} : ${exo.prompt}`).toEqual([]);
        expect(exo.type, kind).toBe(GAME_KINDS[kind].type);
        expect(exo.payload.game, kind).toEqual({ kind, level: d.level });
      }
    }
  });

  it("sont vus par leur vérificateur quand on abîme la bonne réponse (le contrôle n'est pas vide)", () => {
    for (const kind of KINDS) {
      let seen = 0;
      for (const d of spread.slice(0, 40)) {
        const exo = make(kind, d);
        if (CHECKS[kind](corrupt(exo)).length > 0) seen++;
      }
      expect(seen, `${kind} : le vérificateur ne voit pas l'erreur`).toBe(40);
    }
  });

  it("voient aussi un mauvais choix qui irait lui aussi (un jumeau, une couleur voisine, un dessin de trop, la question à l'envers)", () => {
    const find = (kind: GameKind, wanted: (exo: Exo) => boolean): Exo => {
      for (const d of draws) {
        const exo = make(kind, d);
        if (wanted(exo)) return exo;
      }
      throw new Error(`aucun tirage de ${kind}`);
    };
    // « hi » à côté de « hello » : deux mots justes pour « Tu arrives à l'école ».
    const arrival = find("salut-situation", (exo) => rightOption(exo) === "hello");
    const twinned = JSON.parse(JSON.stringify(arrival)) as Exo;
    twinned.payload.options = optionsOf(twinned).map((option, i) => (i === (twinned.payload.correctIndex as number) ? option : i === (twinned.payload.correctIndex === 0 ? 1 : 0) ? "good morning" : option));
    expect(CHECKS["salut-situation"](twinned).join(" | ")).toContain("un seul mot juste");
    // « orange » à côté de « yellow » pour une banane.
    const banana = find("couleur-chose", (exo) => rightOption(exo) === "yellow");
    const near = JSON.parse(JSON.stringify(banana)) as Exo;
    const other = optionsOf(near).findIndex((_, i) => i !== near.payload.correctIndex);
    (near.payload.options as string[])[other] = "orange";
    expect(CHECKS["couleur-chose"](near).join(" | ")).toContain("se confond avec yellow");
    // Un dessin de plus que le mot choisi.
    const count = find("compte-dessins", () => true);
    const extra = JSON.parse(JSON.stringify(count)) as Exo;
    extra.prompt = `${extra.prompt}🍎`;
    expect(CHECKS["compte-dessins"](extra).length).toBeGreaterThan(0);
    // La question posée à l'envers : « Lequel ne vit pas à la ferme ? » pour une vache parmi deux animaux sauvages.
    const farm = find("animal-intrus", (exo) => exo.prompt === "Lequel vit à la ferme ?");
    const reversed = JSON.parse(JSON.stringify(farm)) as Exo;
    reversed.prompt = "Lequel ne vit pas à la ferme ?";
    expect(CHECKS["animal-intrus"](reversed).length).toBeGreaterThan(0);
    // Un cheval chez les animaux sauvages.
    const sort = find("animal-glisser", (exo) => itemsOf(exo).some((item) => stripEmoji(item.text) === "horse"));
    const wrongZone = JSON.parse(JSON.stringify(sort)) as Exo;
    for (const item of itemsOf(wrongZone)) if (stripEmoji(item.text) === "horse") item.correctZone = "Animaux sauvages";
    expect(CHECKS["animal-glisser"](wrongZone).join(" | ")).toContain("case de horse");
  });

  it("n'ont aucun deux-points, au plus une apostrophe et vingt mots dans l'énoncé, et aucun mot anglais dedans", () => {
    const english = new Set<string>([
      ...Object.keys(ANIMAL),
      ...Object.keys(FRUIT),
      ...Object.values(COLOUR_FRENCH),
      ...WORDS,
      ...Object.values(FRENCH_MEANING).flatMap((phrase) => phrase.split(" ")),
      ...SAY_HELLO.flatMap((phrase) => phrase.split(" ")),
      ...SAY_GOODBYE,
      "name",
      "morning",
      "night",
    ]);
    // Des mots qui s'écrivent pareil en français : « orange », « lion », « six », « zéro », « éléphant ».
    for (const same of ["orange", "lion", "six", "zero", "elephant"]) english.delete(same);
    for (const kind of KINDS) {
      for (const d of spread) {
        const exo = make(kind, d);
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        const words = exo.prompt
          .replace(/\p{Extended_Pictographic}/gu, " ")
          .split(/\s+/)
          .filter((token) => /[\p{L}\p{N}]/u.test(token));
        expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(20);
        for (const token of fold(exo.prompt).split(/[^a-z]+/)) expect(english.has(token), `${kind} : « ${exo.prompt} » écrit « ${token} » en anglais`).toBe(false);
      }
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation ni liaison, et d'Unicode 11 au plus", () => {
    for (const kind of KINDS) {
      for (const d of spread) {
        const exo = make(kind, d);
        const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
        expect(text, kind).not.toContain(VARIATION_SELECTOR);
        expect(text, kind).not.toContain(JOINER);
        for (const glyph of text.match(/\p{Extended_Pictographic}/gu) ?? []) {
          const code = glyph.codePointAt(0) as number;
          // Rien d'Unicode 12 ou plus : pastilles de couleur, cœurs blanc et marron, émojis étendus. Un téléphone ancien montre une case vide.
          expect(code >= 0x1fa70 || (code >= 0x1f9c3 && code <= 0x1f9cf) || (code >= 0x1f7e0 && code <= 0x1f7eb) || code === 0x1f90d || code === 0x1f90e, `${kind} : ${glyph}`).toBe(false);
        }
      }
    }
  });

  it("n'écrivent dans aucun indice le mot anglais de la bonne réponse", () => {
    for (const kind of KINDS) {
      for (const d of spread) {
        const exo = make(kind, d);
        const answers = new Set<string>();
        if (exo.payload.options) answers.add(stripEmoji(rightOption(exo)));
        if (exo.payload.blanks) answers.add(blankOf(exo).answer);
        for (const answer of answers) {
          if (answer.length < 3 || exo.prompt.includes(answer)) continue;
          for (const hint of exo.hints) expect(fold(hint).split(/[^a-z]+/), `${kind} : « ${hint} » écrit « ${answer} »`).not.toContain(fold(answer));
        }
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints, kind).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de l'anglais sans aucun défaut, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const defects = auditExercise({
          type: exo.type,
          prompt: exo.prompt,
          payload: exo.payload,
          answerKey: exo.answerKey,
          hints: exo.hints,
          class: "CI",
          subject: "Anglais",
        });
        expect(defects, `${kind} niveau ${d.level} : ${exo.prompt}`).toEqual([]);
      }
    }
  });
});

describe("les listes de mots des gabarits d'anglais du CI", () => {
  it("sont celles des fiches, avec les dessins et les sens du test", () => {
    expect(ANIMALS.map((a) => [a.en, a.emoji, a.fr, a.home])).toEqual(Object.entries(ANIMAL).map(([en, [emoji, fr, home]]) => [en, emoji, fr, home]));
    expect(FRUITS.map((a) => [a.en, a.emoji, a.fr])).toEqual(Object.entries(FRUIT).map(([en, [emoji, fr]]) => [en, emoji, fr]));
    expect(COLOURS.map((c) => c.en)).toEqual(["red", "blue", "yellow", "green", "orange", "black", "white", "pink", "brown", "purple"]);
    for (const colour of COLOURS) {
      expect(COLOUR_OF[colour.emoji as string], colour.en).toBe(colour.en);
      expect(COLOUR_FRENCH[colour.fr], colour.en).toBe(colour.en);
      for (const thing of colour.things) {
        expect(COLOUR_OF[thing.emoji], thing.the).toBe(colour.en);
        expect(thing.the, thing.emoji).toContain(THING_NAME[thing.emoji]);
      }
      // Les couleurs qu'on confond sont celles du test, dans les deux sens.
      for (const near of colour.near) expect(confusable(colour.en, near), `${colour.en} / ${near}`).toBe(true);
    }
    expect(SAYINGS.map((s) => [s.en, s.fr])).toEqual(Object.entries(FRENCH_MEANING).map(([fr, en]) => [en, fr]).sort((a, b) => SAYINGS.findIndex((s) => s.en === a[0]) - SAYINGS.findIndex((s) => s.en === b[0])));
  });

  it("donnent à chaque dessin une seule chose, et à chaque mot un seul dessin", () => {
    const emojis = [...Object.values(ANIMAL).map((a) => a[0]), ...Object.values(FRUIT).map((f) => f[0])];
    expect(new Set(emojis).size).toBe(emojis.length);
    const colourEmojis = COLOURS.flatMap((c) => [c.emoji, ...c.things.map((t) => t.emoji)]);
    expect(new Set(colourEmojis).size).toBe(colourEmojis.length);
  });

  it("laissent toujours deux couleurs éloignées à proposer, au premier palier comme au dernier", () => {
    for (const pool of [COLOURS.filter((c) => BASIC_COLOURS.includes(c.en)), COLOURS]) {
      for (const colour of pool) {
        const far = pool.filter((other) => other.en !== colour.en && !confusable(other.en, colour.en));
        expect(far.length, colour.en).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("les cinq thématiques d'anglais du CI", () => {
  const KEYS = ["an-ci-hello", "an-ci-colours", "an-ci-numbers", "an-ci-animals", "an-ci-fruits"];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;
  const countOf = (key: string) => topicOf(key).palierCount ?? 3;

  /** Les mots de la fiche, et ceux des structures qu'elle donne (« I am Awa. », « My name is Modou. », « It is red. », « Good night »). */
  const ALLOWED: Record<string, string[]> = {
    "an-ci-hello": ["hello", "hi", "goodbye", "bye", "good", "morning", "night", "yes", "no", "please", "thank", "you", "sorry", "i", "am", "my", "name", "is", ...NAMES.map((n) => n.toLowerCase())],
    "an-ci-colours": ["red", "blue", "yellow", "green", "orange", "black", "white", "pink", "brown", "purple", "it", "is"],
    "an-ci-numbers": WORDS,
    "an-ci-animals": Object.keys(ANIMAL),
    "an-ci-fruits": [...Object.keys(FRUIT), ...Object.keys(ANIMAL)],
  };

  /** Les mots anglais qu'un exercice met devant l'enfant : choix, trous, tuiles, cases de couleur. */
  function englishWords(exo: Exo, kind: string): string[] {
    const texts: string[] = [];
    if (exo.payload.options) texts.push(...optionsOf(exo).map(stripEmoji));
    if (exo.payload.blanks) texts.push(...blankOf(exo).options, blankOf(exo).answer, textOf(exo).replace(/___/g, "").replace(/=/g, ""));
    if (exo.payload.correctSequence) texts.push(...sequenceOf(exo));
    if (exo.payload.pairs) texts.push(...pairsOf(exo).map((pair) => pair.right));
    if (exo.payload.items) texts.push(...itemsOf(exo).map((item) => stripEmoji(item.text)));
    if (kind === "couleur-glisser") texts.push(...zonesOf(exo));
    return texts.flatMap((text) => stripEmoji(text).toLowerCase().split(/[^a-z]+/).filter(Boolean));
  }

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (let palierIndex = 1; palierIndex <= countOf(key); palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: countOf(key), seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const kind = (game.payload.game as { kind: GameKind }).kind;
            expect(CHECKS[kind](game), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toEqual([]);
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CI", subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (let palierIndex = 1; palierIndex <= countOf(key); palierIndex++) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: countOf(key), seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'emploient que les mots de la fiche et de ses structures", () => {
    for (const key of KEYS) {
      const allowed = new Set(ALLOWED[key]);
      for (let n = 0; n < 20; n++) {
        for (let palierIndex = 1; palierIndex <= countOf(key); palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: countOf(key), seed: `mots:${key}:${n}:${palierIndex}` });
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            for (const word of englishWords(game, kind)) expect(allowed.has(word), `${key} palier ${palierIndex} ${kind} : « ${word} » n'est pas dans la fiche (${game.prompt})`).toBe(true);
          }
        }
      }
    }
  });

  it("sont des fiches sans phrase pour les animaux et les fruits : aucun trou, aucun ordre", () => {
    for (const key of ["an-ci-animals", "an-ci-fruits"]) {
      for (let palierIndex = 1; palierIndex <= countOf(key); palierIndex++) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: countOf(key), seed: `sans-phrase:${key}` });
        for (const game of games) expect(["qcm", "match", "drag-drop"], `${key} : ${game.prompt}`).toContain(game.type);
      }
    }
  });

  it("n'écrivent un nombre que de zéro à dix, et au premier palier de un à cinq seulement", () => {
    for (let n = 0; n < 40; n++) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf("an-ci-numbers").games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `bornes:${n}` });
        for (const game of games) {
          const level = (game.payload.game as { level: number }).level;
          const tokens = JSON.stringify([game.prompt, game.payload]).match(/[a-z]+|\d+/g) ?? [];
          for (const token of tokens) {
            const isDigits = /^\d+$/.test(token);
            if (!isDigits && !WORDS.includes(token)) continue;
            const value = isDigits ? Number(token) : WORDS.indexOf(token);
            // Les chiffres de « level », de « order » et des graines ne sont pas des nombres de l'exercice : seuls comptent ceux qui sont dits en mots ou en chiffres isolés.
            if (isDigits && JSON.stringify(game.payload).includes(`"${token}"`) === false && !game.prompt.includes(token)) continue;
            expect(value, `${game.prompt} : ${token}`).toBeLessThanOrEqual(10);
            if (level === 1 && !isDigits) expect(value, `${game.prompt} : ${token}`).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }
  });

  it("proposent aux deux derniers paliers des couleurs que le premier palier n'a pas", () => {
    const first = new Set<string>();
    const last = new Set<string>();
    for (let n = 0; n < 40; n++) {
      for (const [palierIndex, seen] of [[1, first], [2, last]] as const) {
        const games = generateGames(topicOf("an-ci-colours").games ?? [], { klass: "CI", palierIndex, palierCount: 2, seed: `etendue:${n}` });
        for (const game of games) for (const word of englishWords(game, (game.payload.game as { kind: string }).kind)) seen.add(word);
      }
    }
    for (const colour of ["pink", "brown", "purple", "orange"]) {
      expect(first.has(colour), `${colour} au premier palier`).toBe(false);
      expect(last.has(colour), `${colour} au dernier palier`).toBe(true);
    }
  });
});
