import { describe, expect, it } from "vitest";
import { DEFAULT_PALIERS_BY_CLASS } from "../palierRules";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

/**
 * LES GABARITS DU CP EN ANGLAIS, EN LECTURE ET EN ÉCRITURE : la famille, le corps, la classe, les nombres de
 * 11 à 20, les aliments ; lire des mots et des sons proches ; écrire une phrase, un/des, le pluriel.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part
 * (les mots de la fiche et leur dessin, les syllabes, les sons que chaque mot fait entendre, le genre de chaque
 * nom) : un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme la bonne
 * réponse d'un exercice juste, et chaque vérification doit le voir. L'échantillon que le modèle avait écrit sur
 * ces sept thématiques comptait neuf exercices faux ou injouables sur vingt-neuf en lecture et en écriture
 * (« bateau » pour le son ou, le mot à écrire dans l'énoncé, des associations arbitraires), et en anglais des
 * cases vides et des consignes en anglais.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `cp2:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const emojiIn = (text: string) => text.match(/\p{Extended_Pictographic}/u)?.[0] ?? "";
const emojiCount = (text: string) => (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
const withoutEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").trim();
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** Une vérification renvoie `null` quand l'exercice est juste, sinon ce qui cloche. */
type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);

// ---------------------------------------------------------------------------
// Les tables de vérité de l'anglais, écrites à part des gabarits
// ---------------------------------------------------------------------------

const FAMILY_EMOJI: Record<string, string> = { "👩": "mother", "👨": "father", "👦": "brother", "👧": "sister", "👵": "grandmother", "👴": "grandfather", "👶": "baby" };
const FAMILY_WORDS = ["mother", "father", "brother", "sister", "grandmother", "grandfather", "baby", "friend"];
const FAMILY_CLUE: Record<string, string> = {
  "la maman": "mother",
  "le papa": "father",
  "le garçon qui a les mêmes parents que toi": "brother",
  "la fille qui a les mêmes parents que toi": "sister",
  "la maman de ta maman": "grandmother",
  "le papa de ton papa": "grandfather",
  "un tout petit enfant qui ne marche pas encore": "baby",
  "celui ou celle avec qui tu joues": "friend",
};
const FEMALES = ["mother", "sister", "grandmother"];
const MALES = ["father", "brother", "grandfather"];

const BODY_EMOJI: Record<string, string> = { "👂": "ear", "👃": "nose", "👄": "mouth", "✋": "hand", "💪": "arm", "🦵": "leg", "🦶": "foot" };
const BODY_YOURS: Record<string, string> = {
  "ta tête": "head",
  "tes cheveux": "hair",
  "ton œil": "eye",
  "ton oreille": "ear",
  "ton nez": "nose",
  "ta bouche": "mouth",
  "ta main": "hand",
  "ton doigt": "finger",
  "ton bras": "arm",
  "ta jambe": "leg",
  "ton pied": "foot",
};
const BODY_BARE: Record<string, string> = { tête: "head", cheveux: "hair", œil: "eye", oreille: "ear", nez: "nose", bouche: "mouth", main: "hand", doigt: "finger", bras: "arm", jambe: "leg", pied: "foot" };
const BODY_WORDS = Object.values(BODY_BARE);
const FACE = ["eye", "ear", "nose", "mouth"];
const LIMBS = ["hand", "finger", "arm", "leg", "foot"];

const CLASS_EMOJI: Record<string, string> = { "📖": "book", "🎒": "bag", "📏": "ruler", "🚪": "door" };
const CLASS_THE: Record<string, string> = {
  "le livre": "book",
  "le stylo": "pen",
  "le crayon": "pencil",
  "le cartable": "bag",
  "la règle": "ruler",
  "le bureau": "desk",
  "la chaise": "chair",
  "le tableau": "board",
  "la porte": "door",
  "la fenêtre": "window",
};
const CLASS_BARE: Record<string, string> = { livre: "book", stylo: "pen", crayon: "pencil", cartable: "bag", règle: "ruler", bureau: "desk", chaise: "chair", tableau: "board", porte: "door", fenêtre: "window" };
const CLASS_WORDS = Object.values(CLASS_BARE);
const SMALL = ["book", "pen", "pencil", "ruler"];
const BIG = ["desk", "chair", "board", "door", "window"];

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

const FOOD_EMOJI: Record<string, string> = { "🍚": "rice", "🐟": "fish", "🍞": "bread", "🥛": "milk", "💧": "water", "🥚": "egg", "🍗": "chicken", "🍵": "tea" };
const FOOD_THE: Record<string, string> = {
  "le riz": "rice",
  "le poisson": "fish",
  "le pain": "bread",
  "le lait": "milk",
  "l'eau": "water",
  "l'œuf": "egg",
  "le poulet": "chicken",
  "le thé": "tea",
  "le jus": "juice",
};
const FOOD_BARE: Record<string, string> = { riz: "rice", poisson: "fish", pain: "bread", lait: "milk", eau: "water", œuf: "egg", poulet: "chicken", thé: "tea", jus: "juice" };
const FOOD_WORDS = Object.values(FOOD_BARE);
const EAT = ["rice", "fish", "bread", "egg", "chicken"];
const DRINK = ["milk", "water", "tea", "juice"];

// ---------------------------------------------------------------------------
// Les tables de vérité de la lecture
// ---------------------------------------------------------------------------

const READ_EMOJI: Record<string, string> = {
  "🐑": "mouton",
  "⛵": "bateau",
  "🍅": "tomate",
  "🧼": "savon",
  "🍗": "poulet",
  "🍲": "marmite",
  "🤒": "malade",
  "🌙": "lune",
  "👗": "robe",
  "⚽": "ballon",
  "🍌": "banane",
  "📻": "radio",
  "🐔": "poule",
  "🚲": "vélo",
  "🐇": "lapin",
  "🍬": "bonbon",
  "🐢": "tortue",
  "🦒": "girafe",
  "🍍": "ananas",
  "🥭": "mangue",
  "🥣": "soupe",
  "👶": "bébé",
};
const READ_SYLLABLES: Record<string, string[]> = {
  mouton: ["mou", "ton"],
  bateau: ["ba", "teau"],
  tomate: ["to", "ma", "te"],
  savon: ["sa", "von"],
  poulet: ["pou", "let"],
  marmite: ["mar", "mi", "te"],
  malade: ["ma", "la", "de"],
  lune: ["lu", "ne"],
  robe: ["ro", "be"],
  ballon: ["bal", "lon"],
  banane: ["ba", "na", "ne"],
  radio: ["ra", "di", "o"],
  poule: ["pou", "le"],
  vélo: ["vé", "lo"],
  lapin: ["la", "pin"],
  bonbon: ["bon", "bon"],
  tortue: ["tor", "tue"],
  girafe: ["gi", "ra", "fe"],
  ananas: ["a", "na", "nas"],
  mangue: ["man", "gue"],
  soupe: ["sou", "pe"],
  bébé: ["bé", "bé"],
};
/** Les sons proches que chaque mot fait ENTENDRE, relus un à un, orthographe en main. Un mot absent n'a aucun de ces sons. */
const HEARD: Record<string, string[]> = {
  mouton: ["ou", "on"],
  bateau: ["o"],
  tomate: ["o"],
  savon: ["on"],
  poulet: ["ou", "è"],
  marmite: [],
  malade: [],
  lune: ["u"],
  robe: ["o"],
  ballon: ["on"],
  banane: [],
  radio: ["o"],
  poule: ["ou"],
  vélo: ["é", "o"],
  lapin: [],
  bonbon: ["on"],
  tortue: ["o", "u"],
  girafe: [],
  ananas: [],
  mangue: [],
  soupe: ["ou"],
  bébé: ["é"],
  café: ["é"],
  été: ["é"],
  fumée: ["u", "é"],
  père: ["è"],
  mère: ["è"],
  moto: ["o"],
  dodo: ["o"],
  salon: ["on"],
  jupe: ["u"],
  sucre: ["u"],
  papa: [],
  dent: [],
  pain: ["è"],
};
const READ_GENDER: Record<string, "m" | "f"> = {
  mouton: "m",
  bateau: "m",
  tomate: "f",
  savon: "m",
  marmite: "f",
  lune: "f",
  robe: "f",
  ballon: "m",
  banane: "f",
  radio: "f",
  poule: "f",
  vélo: "m",
  tortue: "f",
  girafe: "f",
  ananas: "m",
  mangue: "f",
  soupe: "f",
  bonbon: "m",
};
const READ_PEOPLE = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"];
const READ_ACTIONS = ["mange une mangue", "boit du lait", "porte un sac", "lit un livre", "joue au ballon", "range son cahier", "lave un bol", "chante une chanson"];

// ---------------------------------------------------------------------------
// Les tables de vérité de l'écriture
// ---------------------------------------------------------------------------

const NOUN_GENDER: Record<string, "m" | "f"> = {
  ballon: "m",
  chat: "m",
  chien: "m",
  livre: "m",
  cahier: "m",
  mouton: "m",
  cartable: "m",
  crayon: "m",
  stylo: "m",
  mangue: "f",
  banane: "f",
  orange: "f",
  poule: "f",
  pomme: "f",
  vache: "f",
  fleur: "f",
  robe: "f",
  table: "f",
  chaise: "f",
  maison: "f",
};
const NOUN_EMOJI: Record<string, string> = {
  "⚽": "ballon",
  "🐱": "chat",
  "🐶": "chien",
  "📖": "livre",
  "📒": "cahier",
  "🐑": "mouton",
  "🎒": "cartable",
  "🥭": "mangue",
  "🍌": "banane",
  "🍊": "orange",
  "🐔": "poule",
  "🍎": "pomme",
  "🐄": "vache",
  "🌸": "fleur",
  "👗": "robe",
  "🏠": "maison",
};
const PERSON_PRONOUN: Record<string, "Il" | "Elle"> = { Awa: "Elle", Fatou: "Elle", Aminata: "Elle", Moussa: "Il", Cheikh: "Il", Modou: "Il" };
const SVO_OK: Record<string, string[]> = {
  mange: ["mangue", "banane", "orange", "pomme"],
  porte: ["robe", "cartable"],
  lit: ["livre", "cahier"],
  a: ["ballon", "chat", "chien", "poule"],
  voit: ["mouton", "vache", "chat"],
};
const ANIMAL_SENTENCES = ["Le chat dort.", "Le chien court.", "La poule mange.", "La vache mange.", "Le mouton dort.", "Le lapin saute."];
const OUTINGS: Record<string, string[]> = {
  "va au marché.": ["achète une mangue.", "achète une banane.", "achète du riz."],
  "va à l'école.": ["lit un livre.", "prend un cahier.", "écrit avec un crayon."],
  "va au jardin.": ["cueille une fleur.", "mange une pomme.", "cueille une orange."],
};
const EDIBLE = ["mangue", "banane", "orange", "pomme", "carotte", "tomate", "melon", "citron", "ananas", "avocat", "gâteau", "oignon"];
const WORN = ["robe", "jupe", "chemise", "veste", "casquette", "pantalon", "chapeau", "boubou", "pagne", "foulard"];
const ANIMAL_CRY: Record<string, string> = { chat: "miaou", chien: "ouaf", âne: "hi-han", coq: "cocorico", poule: "cot cot", vache: "meuh", chèvre: "bê" };
const GENDER: Record<string, "m" | "f"> = {
  ...NOUN_GENDER,
  carotte: "f",
  tomate: "f",
  melon: "m",
  citron: "m",
  ananas: "m",
  avocat: "m",
  gâteau: "m",
  oignon: "m",
  jupe: "f",
  chemise: "f",
  veste: "f",
  casquette: "f",
  pantalon: "m",
  chapeau: "m",
  boubou: "m",
  pagne: "m",
  foulard: "m",
  ardoise: "f",
  gomme: "f",
  règle: "f",
  trousse: "f",
  âne: "m",
  coq: "m",
  chèvre: "f",
  banc: "m",
};
const articleOfGender = (word: string, kind: "indefinite" | "definite") =>
  kind === "indefinite" ? (GENDER[word] === "f" ? "une" : "un") : GENDER[word] === "f" ? "la" : "le";

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const ENGLISH_KINDS = [
  "famille-mot",
  "famille-lien",
  "famille-relier",
  "famille-glisser",
  "famille-trou",
  "famille-phrase",
  "corps-mot",
  "corps-consigne",
  "corps-relier",
  "corps-glisser",
  "corps-trou",
  "corps-phrase",
  "classe-mot",
  "classe-francais",
  "classe-relier",
  "classe-glisser",
  "classe-trou",
  "classe-question",
  "classe-phrase",
  "nombre-mot",
  "nombre-chiffre",
  "nombre-relier",
  "nombre-ordre",
  "nombre-suivant",
  "nombre-age",
  "nombre-ecrire",
  "nombre-glisser",
  "nombre-compter",
  "aliment-mot",
  "aliment-francais",
  "aliment-relier",
  "aliment-glisser",
  "aliment-trou",
  "aliment-trou-francais",
  "aliment-phrase",
] as const satisfies readonly GameKind[];

const READING_KINDS = [
  "lire-dessin",
  "lire-relier",
  "lire-syllabes",
  "lire-assembler",
  "lire-son",
  "lire-son-glisser",
  "lire-lettre",
  "lire-trou",
  "lire-phrase",
] as const satisfies readonly GameKind[];

const WRITING_KINDS = [
  "ecrire-ordre",
  "ecrire-bien-ecrite",
  "ecrire-un-des",
  "ecrire-groupe",
  "ecrire-pluriel",
  "ecrire-nombre",
  "ecrire-texte",
  "ecrire-mot",
] as const satisfies readonly GameKind[];

const NEW_KINDS: readonly GameKind[] = [...ENGLISH_KINDS, ...READING_KINDS, ...WRITING_KINDS];

/** « Quel mot va avec ce dessin ? » : l'émoji de la ligne du dessin donne le mot parmi trois mots de la liste. */
function drawingCheck(table: Record<string, string>, words: readonly string[]): Check {
  return (exo) => {
    const answer = table[emojiIn(exo.prompt)];
    return (
      ok(answer !== undefined && rightOption(exo) === answer, `le dessin ${emojiIn(exo.prompt)} dit « ${answer} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(optionsOf(exo).every((option) => words.includes(option)), "un choix hors de la liste de la fiche")
    );
  };
}

/** Des paires dont la gauche est un dessin ou un mot français, et la droite le mot anglais. */
function linksCheck(emojis: Record<string, string>, french: Record<string, string>): Check {
  return (exo) => {
    const pairs = pairsOf(exo);
    if (pairs.length < 3 || pairs.length > 5) return `${pairs.length} paires`;
    for (const pair of pairs) {
      const expected = emojis[pair.left] ?? french[pair.left];
      if (expected !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${expected} »`;
    }
    if (new Set(pairs.map((pair) => pair.left)).size !== pairs.length) return "deux paires ont la même gauche";
    return null;
  };
}

/** Un glissé en deux cases dont chaque étiquette (le mot, avec ou sans dessin) a une seule case. */
function sortCheck(zones: [string, string], firstGroup: readonly string[], secondGroup: readonly string[]): Check {
  return (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(zones)) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const word = withoutEmoji(item.text);
      const zone = firstGroup.includes(word) ? zones[0] : secondGroup.includes(word) ? zones[1] : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const used = new Set(itemsOf(exo).map((item) => item.correctZone));
    return ok(used.size === 2 && itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6, "une case vide ou un nombre d'étiquettes hors de quatre à six");
  };
}

/** Une phrase à remettre dans l'ordre : le premier mot a sa majuscule, le dernier son point, aucun autre n'a de point. */
function sentenceShape(tiles: readonly string[]): string | null {
  if (!/^\p{Lu}/u.test(tiles[0])) return "le premier mot n'a pas de majuscule";
  if (!tiles[tiles.length - 1].endsWith(".")) return "le dernier mot n'a pas de point";
  if (tiles.slice(0, -1).some((tile) => tile.includes("."))) return "un autre mot a un point";
  return null;
}

const permutations = (items: string[]): string[][] =>
  items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

const CHECKS: Record<string, Check> = {
  // ----- ma famille -----
  "famille-mot": drawingCheck(FAMILY_EMOJI, FAMILY_WORDS),
  "famille-lien": (exo) => {
    const clue = /« (.+) »/u.exec(exo.prompt)?.[1] ?? "";
    return ok(FAMILY_CLUE[clue] === rightOption(exo), `« ${clue} » dit « ${FAMILY_CLUE[clue]} », la bonne option est « ${rightOption(exo)} »`);
  },
  "famille-relier": linksCheck(FAMILY_EMOJI, {}),
  "famille-glisser": sortCheck(["Femme ou fille", "Homme ou garçon"], FEMALES, MALES),
  "famille-trou": (exo) => {
    const emoji = emojiIn(textOf(exo));
    return (
      ok(textOf(exo) === `${emoji} This is my ___.`, `phrase ${textOf(exo)}`) ??
      ok(FAMILY_EMOJI[emoji] === blankOf(exo).answer, `le dessin ${emoji} dit « ${FAMILY_EMOJI[emoji]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(blankOf(exo).options.every((option) => Object.values(FAMILY_EMOJI).includes(option)), "un choix sans dessin")
    );
  },
  "famille-phrase": (exo) => {
    const tiles = sequenceOf(exo);
    return (
      sentenceShape(tiles) ??
      ok(tiles.length === 4 && tiles[0] === "This" && tiles[1] === "is" && tiles[2] === "my" && FAMILY_WORDS.includes(tiles[3].slice(0, -1)), `phrase ${tiles.join(" ")}`)
    );
  },
  // ----- mon corps -----
  "corps-mot": drawingCheck(BODY_EMOJI, BODY_WORDS),
  "corps-consigne": (exo) => {
    const match = /^Comment dit-on « (touche|montre) (.+) » en anglais \?$/u.exec(exo.prompt);
    if (!match) return `consigne ${exo.prompt}`;
    const part = BODY_YOURS[match[2]];
    const sentence = (word: string) => (match[1] === "touche" ? `Touch your ${word}.` : `Point to your ${word}.`);
    return (
      ok(rightOption(exo) === sentence(part), `« ${match[1]} ${match[2]} » dit « ${sentence(part)} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(
        optionsOf(exo).every((option) => BODY_WORDS.includes(option.replace(/^(Touch|Point to) your /u, "").replace(/\.$/u, ""))),
        "un choix hors de la liste",
      ) ??
      ok(optionsOf(exo).every((option) => option.startsWith(match[1] === "touche" ? "Touch your " : "Point to your ")), "les choix n'ont pas le même verbe")
    );
  },
  "corps-relier": linksCheck(BODY_EMOJI, BODY_BARE),
  "corps-glisser": sortCheck(["Visage", "Bras et jambes"], FACE, LIMBS),
  "corps-trou": (exo) => {
    const match = /^Complète la phrase pour (toucher|montrer) (.+)\.$/u.exec(exo.prompt);
    if (!match) return `consigne ${exo.prompt}`;
    return (
      ok(textOf(exo) === (match[1] === "toucher" ? "Touch your ___." : "Point to your ___."), `phrase ${textOf(exo)}`) ??
      ok(BODY_YOURS[match[2]] === blankOf(exo).answer, `« ${match[2]} » dit « ${BODY_YOURS[match[2]]} », le trou dit « ${blankOf(exo).answer} »`)
    );
  },
  "corps-phrase": (exo) => {
    const tiles = sequenceOf(exo);
    const word = tiles[tiles.length - 1].slice(0, -1);
    return sentenceShape(tiles) ?? ok(BODY_WORDS.includes(word) && tiles.slice(0, -1).join(" ") === "Touch your", `phrase ${tiles.join(" ")}`);
  },
  // ----- dans ma classe -----
  "classe-mot": drawingCheck(CLASS_EMOJI, CLASS_WORDS),
  "classe-francais": (exo) => {
    const phrase = /« (.+) »/u.exec(exo.prompt)?.[1] ?? "";
    return ok(CLASS_THE[phrase] === rightOption(exo), `« ${phrase} » dit « ${CLASS_THE[phrase]} », la bonne option est « ${rightOption(exo)} »`);
  },
  "classe-relier": linksCheck(CLASS_EMOJI, CLASS_BARE),
  "classe-glisser": sortCheck(["Petit objet", "Grand objet"], SMALL, BIG),
  "classe-trou": (exo) => {
    const emoji = emojiIn(textOf(exo));
    return (
      ok(textOf(exo) === `${emoji} It is a ___.`, `phrase ${textOf(exo)}`) ??
      ok(CLASS_EMOJI[emoji] === blankOf(exo).answer, `le dessin ${emoji} dit « ${CLASS_EMOJI[emoji]} », le trou dit « ${blankOf(exo).answer} »`) ??
      // La fiche : tous ces mots commencent par une consonne, donc « a » seulement.
      ok(blankOf(exo).options.every((option) => /^[bcdfghjklmnpqrstvwxz]/u.test(option) && CLASS_WORDS.includes(option)), "un choix qui commence par une voyelle ou hors de la liste")
    );
  },
  "classe-question": (exo) => {
    const emoji = emojiIn(textOf(exo));
    return (
      ok(textOf(exo) === `What is it? ${emoji} It is a ___.`, `phrase ${textOf(exo)}`) ??
      ok(CLASS_EMOJI[emoji] === blankOf(exo).answer, `le dessin ${emoji} dit « ${CLASS_EMOJI[emoji]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(blankOf(exo).options.every((option) => CLASS_WORDS.includes(option)), "un choix hors de la liste")
    );
  },
  "classe-phrase": (exo) => {
    const tiles = sequenceOf(exo);
    return sentenceShape(tiles) ?? ok(tiles.length === 4 && tiles.slice(0, 3).join(" ") === "It is a" && CLASS_WORDS.includes(tiles[3].slice(0, -1)), `phrase ${tiles.join(" ")}`);
  },
  // ----- les nombres de 11 à 20 -----
  "nombre-mot": (exo) => {
    const n = Number(/nombre (\d+) en anglais/u.exec(exo.prompt)?.[1]);
    return (
      ok(NUMBERS[n] === rightOption(exo), `${n} dit « ${NUMBERS[n]} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(optionsOf(exo).every((option) => NUMBERS.includes(option)), "un mot qui n'est pas un nombre de 0 à 20")
    );
  },
  "nombre-chiffre": (exo) => {
    const word = /^(\w+) = ___$/u.exec(textOf(exo))?.[1] ?? "";
    return ok(String(NUMBERS.indexOf(word)) === blankOf(exo).answer, `« ${word} » dit ${NUMBERS.indexOf(word)}, le trou dit ${blankOf(exo).answer}`);
  },
  "nombre-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (NUMBERS[Number(pair.left)] !== pair.right) return `${pair.left} est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 5 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "nombre-ordre": (exo) => {
    const indexes = sequenceOf(exo).map((word) => NUMBERS.indexOf(word));
    if (indexes.includes(-1)) return "un mot qui n'est pas un nombre";
    for (let i = 1; i < indexes.length; i++) if (indexes[i] <= indexes[i - 1]) return `${sequenceOf(exo).join(" > ")} n'est pas croissant`;
    return ok(indexes.length >= 3 && indexes.length <= 4, "nombre de mots");
  },
  "nombre-suivant": (exo) => {
    const n = Number(/après (\d+) \?$/u.exec(exo.prompt)?.[1]);
    return ok(NUMBERS[n + 1] === rightOption(exo), `après ${n} vient « ${NUMBERS[n + 1]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(n >= 11 && n <= 19, `le nombre ${n} est hors de 11 à 19`);
  },
  "nombre-age": (exo) => {
    const n = Number(/^Tu as (\d+) ans\./u.exec(exo.prompt)?.[1]);
    return (
      ok(textOf(exo) === "How old are you? I am ___.", `phrase ${textOf(exo)}`) ??
      ok(NUMBERS[n] === blankOf(exo).answer, `${n} ans dit « ${NUMBERS[n]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(n >= 6 && n <= 12, `âge ${n}`)
    );
  },
  "nombre-ecrire": (exo) => {
    const n = Number(/le nombre (\d+)\.$/u.exec(exo.prompt)?.[1]);
    return (
      ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify([NUMBERS[n]]), `${n} se dit « ${NUMBERS[n]} », la réponse acceptée est ${acceptedOf(exo).join(" | ")}`) ??
      ok(n >= 11 && n <= 20, `le nombre ${n} est hors de 11 à 20`)
    );
  },
  "nombre-glisser": (exo) => {
    const zones = zonesOf(exo);
    const mark = Number(/^Moins de (\d+)$/u.exec(zones[0])?.[1]);
    if (zones[1] !== `Plus de ${mark}`) return `cases ${zones.join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const n = NUMBERS.indexOf(item.text);
      if (n === mark) return "le nombre de repère est une étiquette";
      if ((n < mark ? zones[0] : zones[1]) !== item.correctZone) return `« ${item.text} » (${n}) est mal rangé par rapport à ${mark}`;
    }
    const used = new Set(itemsOf(exo).map((item) => item.correctZone));
    return ok(used.size === 2 && itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6, "une case vide");
  },
  "nombre-compter": (exo) => {
    const rows = exo.prompt.split("\n").slice(1);
    const count = emojiCount(exo.prompt);
    return (
      ok(rows.length === 2 && emojiCount(rows[0]) === 10, "deux rangées dont la première a dix dessins") ??
      ok(NUMBERS[count] === rightOption(exo), `${count} dessins disent « ${NUMBERS[count]} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(count >= 11 && count <= 20, `${count} dessins`)
    );
  },
  // ----- manger et boire -----
  "aliment-mot": drawingCheck(FOOD_EMOJI, FOOD_WORDS),
  "aliment-francais": (exo) => {
    const phrase = /« (.+) »/u.exec(exo.prompt)?.[1] ?? "";
    return ok(FOOD_THE[phrase] === rightOption(exo), `« ${phrase} » dit « ${FOOD_THE[phrase]} », la bonne option est « ${rightOption(exo)} »`);
  },
  "aliment-relier": linksCheck(FOOD_EMOJI, FOOD_BARE),
  "aliment-glisser": sortCheck(["Je mange", "Je bois"], EAT, DRINK),
  "aliment-trou": (exo) => {
    const emoji = emojiIn(textOf(exo));
    return (
      ok(textOf(exo) === `${emoji} I like ___.`, `phrase ${textOf(exo)}`) ??
      ok(FOOD_EMOJI[emoji] === blankOf(exo).answer, `le dessin ${emoji} dit « ${FOOD_EMOJI[emoji]} », le trou dit « ${blankOf(exo).answer} »`) ??
      // « I like egg. » est faux en anglais : « egg » se compte.
      ok(!blankOf(exo).options.includes("egg"), "egg dans « I like ___. »")
    );
  },
  "aliment-trou-francais": (exo) => {
    const phrase = /^Complète la phrase pour dire que tu aimes (.+)\.$/u.exec(exo.prompt)?.[1] ?? "";
    return (
      ok(textOf(exo) === "I like ___.", `phrase ${textOf(exo)}`) ??
      ok(FOOD_THE[phrase] === blankOf(exo).answer, `« ${phrase} » dit « ${FOOD_THE[phrase]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(!blankOf(exo).options.includes("egg"), "egg dans « I like ___. »")
    );
  },
  "aliment-phrase": (exo) => {
    const tiles = sequenceOf(exo);
    const word = tiles[2]?.slice(0, -1);
    return sentenceShape(tiles) ?? ok(tiles.length === 3 && tiles[0] === "I" && tiles[1] === "like" && FOOD_WORDS.includes(word) && word !== "egg", `phrase ${tiles.join(" ")}`);
  },
  // ----- lire -----
  "lire-dessin": (exo) => {
    const word = READ_EMOJI[emojiIn(exo.prompt)];
    const options = optionsOf(exo);
    return (
      ok(rightOption(exo) === word, `le dessin dit « ${word} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(!(options.includes("poule") && options.includes("poulet")), "poule et poulet ensemble") ??
      ok(options.every((option) => option in READ_SYLLABLES), "un mot hors de la table")
    );
  },
  "lire-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (READ_EMOJI[pair.right] !== pair.left) return `« ${pair.left} » est relié à ${pair.right}`;
    const words = pairs.map((pair) => pair.left);
    return ok(!(words.includes("poule") && words.includes("poulet")), "poule et poulet ensemble") ?? ok(pairs.length >= 3 && pairs.length <= 5 && new Set(words).size === pairs.length, "nombre de paires");
  },
  "lire-syllabes": (exo) => {
    const word = READ_EMOJI[emojiIn(exo.prompt)];
    const syllables = READ_SYLLABLES[word];
    return (
      ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(syllables), `${sequenceOf(exo).join("-")} n'est pas « ${word} » (${syllables?.join("-")})`) ??
      ok(syllables.length >= 3 && new Set(syllables).size === syllables.length, "moins de trois syllabes, ou deux tuiles identiques") ??
      ok(exo.answerKey === word, "la clé ne dit pas le mot")
    );
  },
  "lire-assembler": (exo) => {
    const word = READ_EMOJI[emojiIn(exo.prompt)];
    const syllables = READ_SYLLABLES[word];
    const shown = /^Assemble les syllabes (.+) pour écrire le mot de ce dessin\./u.exec(exo.prompt)?.[1]?.split(" - ") ?? [];
    return (
      ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify([word]), `réponse ${acceptedOf(exo).join(" | ")} au lieu de « ${word} »`) ??
      ok(same(shown, syllables) && shown.join("-") !== syllables.join("-"), `syllabes ${shown.join("-")} pour ${syllables?.join("-")}`) ??
      ok(new Set(syllables).size === syllables.length, "deux syllabes identiques") ??
      ok(!exo.prompt.includes(word), "le mot est écrit dans l'énoncé")
    );
  },
  "lire-son": (exo) => {
    const sound = /^Quel mot a le son (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const options = optionsOf(exo);
    for (const option of options) if (!(option in HEARD)) return `« ${option} » n'est pas dans la table des sons`;
    const having = options.filter((option) => HEARD[option].includes(sound));
    return (
      ok(having.length === 1 && having[0] === rightOption(exo), `le son ${sound} est dans ${having.join(" et ")}, la bonne option est « ${rightOption(exo)} »`) ??
      // Un mot que l'oreille entend sans que l'orthographe l'écrive n'est jamais offert.
      ok(!(["é", "è"].includes(sound) && options.some((option) => ["poulet", "pain"].includes(option))), "poulet ou pain pour é ou è") ??
      ok(!(["o", "on"].includes(sound) && options.includes("bateau")), "bateau pour o ou on")
    );
  },
  "lire-son-glisser": (exo) => {
    const sounds = zonesOf(exo).map((zone) => /^Le son (.+)$/u.exec(zone)?.[1] ?? "");
    for (const item of itemsOf(exo)) {
      if (!(item.text in HEARD)) return `« ${item.text} » n'est pas dans la table des sons`;
      const heard = HEARD[item.text].filter((sound) => sounds.includes(sound));
      if (heard.length !== 1) return `« ${item.text} » fait entendre ${heard.join(" et ") || "aucun"} des sons ${sounds.join(" et ")}`;
      if (`Le son ${heard[0]}` !== item.correctZone) return `« ${item.text} » va dans « ${item.correctZone} », il fait entendre ${heard[0]}`;
    }
    const used = new Set(itemsOf(exo).map((item) => item.correctZone));
    return ok(used.size === 2, "une case vide");
  },
  "lire-lettre": (exo) => {
    const letter = /par la lettre (\p{L}) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const options = optionsOf(exo);
    const starts = options.map((option) => option[0]);
    return (
      ok(rightOption(exo).startsWith(letter), `« ${rightOption(exo)} » ne commence pas par ${letter}`) ??
      ok(options.filter((option) => option.startsWith(letter)).length === 1, "deux mots commencent par la lettre") ??
      ok(same(starts, ["b", "d", "p"]), `premières lettres ${starts.join(" ")}`)
    );
  },
  "lire-trou": (exo) => {
    const match = /^(\p{Extended_Pictographic}) Voici (un|une) ___\.$/u.exec(textOf(exo));
    if (!match) return `phrase ${textOf(exo)}`;
    const word = READ_EMOJI[match[1]];
    return (
      ok(word === blankOf(exo).answer, `le dessin dit « ${word} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(match[2] === (READ_GENDER[word] === "m" ? "un" : "une"), `l'article « ${match[2]} » ne va pas avec « ${word} »`) ??
      ok(blankOf(exo).options.every((option) => READ_GENDER[option] === READ_GENDER[word]), "un mauvais choix d'un autre genre")
    );
  },
  "lire-phrase": (exo) => {
    const match = /^(\p{Lu}\p{L}*) (.+?)\. (\p{Lu}\p{L}*) (.+?)\.\n(?:Qui (.+) \?|Que fait (\p{Lu}\p{L}*) \?)$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const [, a, actionA, b, actionB, whoAction, whatName] = match;
    if (a === b || actionA === actionB) return "deux fois la même personne ou la même action";
    if (!READ_PEOPLE.includes(a) || !READ_PEOPLE.includes(b) || !READ_ACTIONS.includes(actionA) || !READ_ACTIONS.includes(actionB)) return "un prénom ou une action hors de la table";
    const options = optionsOf(exo);
    if (whoAction !== undefined) {
      const who = whoAction === actionA ? a : whoAction === actionB ? b : null;
      return (
        ok(who !== null && rightOption(exo) === who, `qui ${whoAction} : ${who}, la bonne option est « ${rightOption(exo)} »`) ??
        ok(options.includes(a) && options.includes(b), "les deux personnes du texte ne sont pas des choix")
      );
    }
    const what = whatName === a ? actionA : whatName === b ? actionB : null;
    return (
      ok(what !== null && rightOption(exo) === what, `${whatName} ${what}, la bonne option est « ${rightOption(exo)} »`) ??
      ok(options.includes(actionA) && options.includes(actionB), "les deux actions du texte ne sont pas des choix")
    );
  },
  // ----- écrire -----
  "ecrire-ordre": (exo) => {
    const tiles = sequenceOf(exo);
    const shape = sentenceShape(tiles);
    if (shape) return shape;
    if (ANIMAL_SENTENCES.includes(tiles.join(" "))) {
      // Un article avec sa majuscule, un nom, un verbe avec son point : un seul ordre commence par la majuscule et finit par le point.
      return ok(permutations(tiles).filter((order) => /^\p{Lu}/u.test(order[0]) && order[2].endsWith(".")).length === 1, "plusieurs façons de ranger les mots");
    }
    const subjects = ["Il", "Elle", ...Object.keys(PERSON_PRONOUN)];
    // La phrase est la SEULE façon de ranger les tuiles : sujet, verbe, article, nom ; aucun autre ordre ne le fait.
    const valid = (order: string[]) =>
      subjects.includes(order[0]) &&
      order[1] in SVO_OK &&
      (order[2] === "un" || order[2] === "une") &&
      order[3].endsWith(".") &&
      SVO_OK[order[1]].includes(order[3].slice(0, -1)) &&
      order[2] === articleOfGender(order[3].slice(0, -1), "indefinite");
    return ok(valid(tiles), `phrase ${tiles.join(" ")}`) ?? ok(permutations(tiles).filter(valid).length === 1, "plusieurs façons de ranger les mots");
  },
  "ecrire-bien-ecrite": (exo) => {
    const options = optionsOf(exo);
    const wellWritten = (text: string) => /^\p{Lu}/u.test(text) && text.endsWith(".");
    const good = options.filter(wellWritten);
    if (good.length !== 1 || good[0] !== rightOption(exo)) return `bonnes phrases ${good.join(" | ")}`;
    const core = (text: string) => text.replace(/\.$/u, "").toLowerCase();
    if (new Set(options.map(core)).size !== 1) return "les trois phrases ne disent pas la même chose";
    const [name, verb, article, noun] = good[0].slice(0, -1).split(" ");
    return ok(name in PERSON_PRONOUN && verb in SVO_OK && SVO_OK[verb].includes(noun) && article === articleOfGender(noun, "indefinite"), `phrase ${good[0]}`);
  },
  "ecrire-un-des": (exo) => {
    const text = textOf(exo);
    const indefinite = /^(\p{Lu}\p{L}*) a ___ (\p{L}+)\.$/u.exec(text);
    const definite = /^Voici ___ (\p{L}+)\.$/u.exec(text);
    const options = blankOf(exo).options;
    if (indefinite) {
      const noun = indefinite[2];
      const many = noun.endsWith("s");
      const base = many ? noun.slice(0, -1) : noun;
      const expected = many ? "des" : articleOfGender(base, "indefinite");
      return (
        ok(base in NOUN_GENDER && indefinite[1] in PERSON_PRONOUN, `phrase ${text}`) ??
        ok(blankOf(exo).answer === expected, `« ${noun} » veut « ${expected} », le trou dit « ${blankOf(exo).answer} »`) ??
        ok(same(options, ["un", "une", "des"]), `choix ${options.join(" ")}`)
      );
    }
    if (definite) {
      const noun = definite[1];
      const many = noun.endsWith("s");
      const base = many ? noun.slice(0, -1) : noun;
      const expected = many ? "les" : articleOfGender(base, "definite");
      return (
        ok(base in NOUN_GENDER && !/^[aeiouyéèêh]/u.test(base), `phrase ${text}`) ??
        ok(blankOf(exo).answer === expected, `« ${noun} » veut « ${expected} », le trou dit « ${blankOf(exo).answer} »`) ??
        ok(same(options, ["le", "la", "les"]), `choix ${options.join(" ")}`)
      );
    }
    return `phrase ${text}`;
  },
  "ecrire-groupe": (exo) => {
    const emoji = emojiIn(exo.prompt);
    const count = emojiCount(exo.prompt);
    const match = /^Il y a ___ (\p{L}+)\.$/u.exec(textOf(exo));
    if (!match) return `phrase ${textOf(exo)}`;
    const noun = match[1];
    const base = count > 1 ? noun.slice(0, -1) : noun;
    const expected = count > 1 ? "des" : articleOfGender(base, "indefinite");
    return (
      ok(NOUN_EMOJI[emoji] === base, `le dessin ${emoji} dit « ${NOUN_EMOJI[emoji]} », la phrase dit « ${base} »`) ??
      ok(count === 1 || noun.endsWith("s"), "plusieurs dessins et un nom au singulier") ??
      ok(blankOf(exo).answer === expected, `${count} dessin(s) veulent « ${expected} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(same(blankOf(exo).options, ["un", "une", "des"]), "choix")
    );
  },
  "ecrire-pluriel": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (!(pair.left in NOUN_GENDER) || pair.right !== `${pair.left}s`) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 5 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "ecrire-nombre": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Singulier", "Pluriel"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const many = item.text.endsWith("s");
      const base = many ? item.text.slice(0, -1) : item.text;
      if (!(base in NOUN_GENDER)) return `« ${item.text} » n'est pas un nom de la liste`;
      if ((many ? "Pluriel" : "Singulier") !== item.correctZone) return `« ${item.text} » va dans « ${item.correctZone} »`;
    }
    const used = new Set(itemsOf(exo).map((item) => item.correctZone));
    return ok(used.size === 2 && itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6, "une case vide");
  },
  "ecrire-texte": (exo) => {
    const tiles = sequenceOf(exo);
    if (tiles.length !== 3) return `${tiles.length} phrases`;
    const first = /^(\p{Lu}\p{L}*) (.+)$/u.exec(tiles[0]);
    const second = /^(Il|Elle) (.+)$/u.exec(tiles[1]);
    const third = /^(Il|Elle) rentre à la maison\.$/u.exec(tiles[2]);
    if (!first || !second || !third) return `phrases ${tiles.join(" ")}`;
    const pronoun = PERSON_PRONOUN[first[1]];
    // L'histoire n'a qu'un ordre : on arrive d'abord (un prénom), on fait ce qu'on est venu faire (Il ou Elle), on rentre à la fin.
    const startsWithName = (tile: string) => tile.split(" ")[0] in PERSON_PRONOUN;
    const goodOrders = permutations(tiles).filter((order) => startsWithName(order[0]) && order[2].includes("rentre"));
    return (
      ok(first[2] in OUTINGS && OUTINGS[first[2]].includes(second[2]), `phrase ${tiles.join(" ")}`) ??
      ok(second[1] === pronoun && third[1] === pronoun, `le pronom ne va pas avec « ${first[1]} »`) ??
      ok(goodOrders.length === 1, "plusieurs façons de ranger l'histoire")
    );
  },
  "ecrire-mot": (exo) => {
    const text = textOf(exo);
    const { options, answer } = blankOf(exo);
    const sameGender = options.every((option) => GENDER[option] === GENDER[answer]);
    const eat = /^On mange (un|une) ___\.$/u.exec(text);
    const wear = /^Je mets (un|une) ___ pour aller à l'école\.$/u.exec(text);
    const cry = /^(Le|La) ___ dit (.+)\.$/u.exec(text);
    const sit = /^On s'assoit sur (un|une) ___\.$/u.exec(text);
    if (eat) {
      return (
        ok(EDIBLE.includes(answer) && options.filter((option) => EDIBLE.includes(option)).length === 1, "pas un seul mot qui se mange") ??
        ok(eat[1] === articleOfGender(answer, "indefinite") && sameGender, "article ou genre")
      );
    }
    if (wear) {
      return (
        ok(WORN.includes(answer) && options.filter((option) => WORN.includes(option)).length === 1, "pas un seul vêtement") ??
        ok(wear[1] === articleOfGender(answer, "indefinite") && sameGender, "article ou genre")
      );
    }
    if (cry) {
      const sound = ANIMAL_CRY[answer];
      return (
        ok(sound === cry[2], `« ${answer} » fait « ${sound} », la phrase dit « ${cry[2]} »`) ??
        ok(options.every((option) => option in ANIMAL_CRY) && options.filter((option) => ANIMAL_CRY[option] === cry[2]).length === 1, "deux animaux font ce cri") ??
        ok(cry[1] === (GENDER[answer] === "f" ? "La" : "Le") && sameGender, "article ou genre")
      );
    }
    if (sit) {
      return (
        ok(["chaise", "banc"].includes(answer) && options.filter((option) => ["chaise", "banc", "table"].includes(option)).length === 1, "pas un seul siège") ??
        ok(sit[1] === articleOfGender(answer, "indefinite") && sameGender, "article ou genre")
      );
    }
    return `phrase ${text}`;
  },
};

/** Tous les gabarits du lot ont une vérification : un gabarit ajouté sans table ferait échouer ce test. */
describe("chaque gabarit du lot a sa vérification", () => {
  it("couvre exactement les gabarits de l'anglais, de la lecture et de l'écriture du CP", () => {
    expect(Object.keys(CHECKS).sort()).toEqual([...NEW_KINDS].sort());
    for (const kind of NEW_KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

for (const [name, kinds] of [
  ["l'anglais", ENGLISH_KINDS],
  ["la lecture", READING_KINDS],
  ["l'écriture", WRITING_KINDS],
] as const) {
  describe(`les gabarits de ${name} recalculent juste, depuis une table écrite à part`, () => {
    for (const kind of kinds) {
      it(`${kind} : la bonne réponse se lit dans la table, à tous les niveaux`, () => {
        for (const d of draws) {
          const exo = make(kind, d);
          expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
        }
      });
    }
  });
}

// ===========================================================================
// LES MUTATIONS : une vérification qui ne voit pas une réponse abîmée ne prouve rien
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. `null` si rien ne peut être abîmé. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      if (options.length < 2) return null;
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      // Deux tuiles différentes échangées : la première et la dernière.
      if (sequence.length < 2 || sequence[0] === sequence[sequence.length - 1]) return null;
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      if (pairs.length < 2) return null;
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      payload.acceptedAnswers = [`${(payload.acceptedAnswers as string[])[0]}x`];
      return copy();
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of NEW_KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const d of draws.filter((_, i) => i % 6 === 0)) {
        const exo = make(kind, d);
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'anglais, de la lecture et de l'écriture du CP", () => {
  const exos = NEW_KINDS.flatMap((kind) => draws.map((d) => ({ kind, exo: make(kind, d) as Exo, level: d.level })));

  const texts = (exo: Exo): string[] => {
    const out = [exo.prompt, ...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      expect(exo.prompt.length, kind).toBeGreaterThan(10);
    }
  });

  it("n'écrivent jamais U+FE0F ni un émoji de Unicode 12 ou après : sur un téléphone ancien, il s'afficherait en case vide", () => {
    const recent = /[\u{1F7E0}-\u{1F7EB}\u{1F90D}-\u{1F90F}\u{1FA70}-\u{1FAFF}]/u;
    for (const { kind, exo } of exos) {
      for (const text of texts(exo)) {
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
        expect(recent.test(text), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeGreaterThanOrEqual(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.length, kind).toBe(3);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
      }
    }
  });

  it("n'écrivent dans aucun indice un mot de la bonne réponse ni d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer.replace(/\p{Extended_Pictographic}/gu, " "))
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of NEW_KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de leur matière au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const subject = (ENGLISH_KINDS as readonly string[]).includes(kind) ? "Anglais" : "Français";
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject,
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("n'écrivent aucune tuile « article + un nom » : au CI, elle demanderait une image que le catalogue n'a pas", () => {
    const ARTICLE_THEN_NOUN = /^(?:(?:le|la|les|un|une|des|du|de la)\s+|(?:de\s+)?l['’]\s?)[\p{L}'’-]+$/iu;
    for (const { kind, exo } of exos) {
      const tiles: string[] = [];
      if (exo.payload.options) tiles.push(...optionsOf(exo));
      if (exo.payload.correctSequence) tiles.push(...sequenceOf(exo));
      if (exo.payload.pairs) tiles.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) tiles.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      for (const tile of tiles) expect(ARTICLE_THEN_NOUN.test(withoutEmoji(tile)), `${kind} : « ${tile} »`).toBe(false);
    }
  });

  it("gardent l'anglais hors de la consigne : la consigne est en français", () => {
    const ENGLISH = /(?<![\p{L}])(?:touch|your|what|this|like|old|are|you|the|my|is|it|am)(?![\p{L}])/iu;
    for (const kind of ENGLISH_KINDS) {
      for (const d of draws.filter((_, i) => i % 4 === 0)) {
        const exo = make(kind, d);
        expect(exo.prompt, `${kind} : ${exo.prompt}`).not.toMatch(ENGLISH);
      }
    }
  });

  it("n'acceptent, en réponse courte, qu'un mot écrit en lettres : le clavier des lettres s'ouvre, jamais le pavé des chiffres", () => {
    for (const kind of ["nombre-ecrire", "lire-assembler"] as const) {
      for (const d of draws) {
        const accepted = acceptedOf(make(kind, d) as Exo);
        expect(accepted, kind).toHaveLength(1);
        expect(accepted[0], kind).toMatch(/^\p{L}+$/u);
      }
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les sept thématiques d'anglais, de lecture et d'écriture du CP", () => {
  const KEYS = ["an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food", "fr-cp-lecture", "fr-cp-ecrire"];
  const LOT1_KEYS = [
    "hi-cp-calendrier",
    "hi-cp-durees",
    "hi-cp-frequences",
    "hi-cp-emploi-du-temps",
    "ge-cp-itineraire",
    "ge-cp-distances",
    "ge-cp-plan",
    "ge-cp-quartier",
  ];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;
  const countOf = (key: string) => topicOf(key).palierCount ?? DEFAULT_PALIERS_BY_CLASS.CP;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont entièrement faites par le code (l'ensemble des thématiques du CP faites par le code est vérifié dans cpFrancaisArtsTemplates.test.ts)", () => {
    const allCode = allProgrammeEntries()
      .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((e) => e.topic.key);
    for (const key of KEYS) expect(allCode, key).toContain(key);
    for (const key of LOT1_KEYS) expect(allCode, key).toContain(key);
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    const palierCounts: Record<string, number | undefined> = {
      "an-cp-family": 2,
      "an-cp-body": 2,
      "an-cp-classroom": 2,
      "an-cp-numbers-20": undefined,
      "an-cp-food": 2,
      "fr-cp-lecture": undefined,
      "fr-cp-ecrire": undefined,
    };
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBe(palierCounts[key]);
    }
  });

  it("n'emploient jamais un jeu d'écoute en anglais : l'application ne lit pas l'anglais", () => {
    for (const key of KEYS.filter((k) => k.startsWith("an-"))) {
      for (const spec of topicOf(key).games ?? []) expect(GAME_KINDS[spec.kind].type, `${key} : ${spec.kind}`).not.toBe("listen");
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      const palierCount = countOf(key);
      const subject = entryOf(key).subject.name;
      for (let n = 0; n < 40; n++) {
        for (let palierIndex = 1; palierIndex <= palierCount; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CP",
              subject,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (let palierIndex = 1; palierIndex <= countOf(key); palierIndex++) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: countOf(key), seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un exercice de chaque type que la banque attend sur ces thématiques", () => {
    // La banque (`components/landing/demo/bank`) montre, au CP, un QCM en « Mon corps », un glissé en « Manger et boire »,
    // un appariement en « Ma famille », un ordre et un mot à écrire en « Les nombres », un trou en « Dans ma classe »,
    // un ordre en « J'écris des phrases » et un mot à écrire en « Je lis des syllabes et des mots ».
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("an-cp-body").has("qcm")).toBe(true);
    expect(typesOf("an-cp-food").has("drag-drop")).toBe(true);
    expect(typesOf("an-cp-family").has("match")).toBe(true);
    expect(typesOf("an-cp-numbers-20").has("order")).toBe(true);
    expect(typesOf("an-cp-numbers-20").has("short-answer")).toBe(true);
    expect(typesOf("an-cp-classroom").has("fill-blank")).toBe(true);
    expect(typesOf("fr-cp-ecrire").has("order")).toBe(true);
    expect(typesOf("fr-cp-lecture").has("short-answer")).toBe(true);
  });

  it("opposent « des » à « un » ou « une » : chaque palier d'écriture montre une fois plusieurs dessins et une fois un seul", () => {
    for (let n = 0; n < 40; n++) {
      for (let palierIndex = 1; palierIndex <= countOf("fr-cp-ecrire"); palierIndex++) {
        const games = generateGames(topicOf("fr-cp-ecrire").games ?? [], { klass: "CP", palierIndex, palierCount: countOf("fr-cp-ecrire"), seed: `groupe:${n}:${palierIndex}` });
        const counts = games.filter((game) => game.payload.game.kind === "ecrire-groupe").map((game) => emojiCount(game.prompt));
        expect(counts.filter((count) => count === 1), `palier ${palierIndex} #${n}`).toHaveLength(1);
        expect(counts.filter((count) => count > 1), `palier ${palierIndex} #${n}`).toHaveLength(1);
      }
    }
  });

  it("varient les sons d'un palier de lecture, et rangent les nombres de chaque côté du repère", () => {
    for (let n = 0; n < 40; n++) {
      for (let palierIndex = 1; palierIndex <= countOf("fr-cp-lecture"); palierIndex++) {
        const games = generateGames(topicOf("fr-cp-lecture").games ?? [], { klass: "CP", palierIndex, palierCount: countOf("fr-cp-lecture"), seed: `son:${n}:${palierIndex}` });
        const sounds = games.filter((game) => game.payload.game.kind === "lire-son").map((game) => /le son (.+) \?$/u.exec(game.prompt)?.[1]);
        expect(new Set(sounds).size, `palier ${palierIndex} #${n}`).toBe(sounds.length);
      }
      for (let palierIndex = 1; palierIndex <= countOf("an-cp-numbers-20"); palierIndex++) {
        const games = generateGames(topicOf("an-cp-numbers-20").games ?? [], { klass: "CP", palierIndex, palierCount: countOf("an-cp-numbers-20"), seed: `glisser:${n}:${palierIndex}` });
        const sort = games.find((game) => game.payload.game.kind === "nombre-glisser")!;
        const items = sort.payload.items as { correctZone: string }[];
        const perZone = (zone: string) => items.filter((item) => item.correctZone === zone).length;
        const zones = sort.payload.zones as string[];
        // Le premier palier n'a que cinq nombres : un de chaque côté au moins. Ensuite, deux au moins.
        const least = palierIndex === 1 ? 1 : 2;
        expect(perZone(zones[0]), `palier ${palierIndex} #${n}`).toBeGreaterThanOrEqual(least);
        expect(perZone(zones[1]), `palier ${palierIndex} #${n}`).toBeGreaterThanOrEqual(least);
      }
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 2 };
        const again = regenerateGame(origin, "CP", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
