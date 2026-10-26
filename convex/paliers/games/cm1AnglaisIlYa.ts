/**
 * LES GABARITS DE « IL Y A » EN ANGLAIS, AU CM1 (`an-cm1-there-is`) : « There is a school. », « There are two shops. ».
 *
 * Le plan (`docs/programme-anglais-v2.md`, lot 4) : « there is » et « there are » manquaient, alors que le CM2 demande son chemin
 * en ville (`an-cm2-directions`). La thématique vient après la description (`an-cm1-describe`) et prépare les itinéraires.
 *
 * SEPT LIEUX AVEC UN DESSIN D'UNICODE 11 AU PLUS, sans U+FE0F : school 🏫, shop 🏪, mosque 🕌, hospital 🏥, bank 🏦, post office 🏤,
 * bus station 🚏. Le marché (market) n'a pas de dessin sûr : il n'entre que dans les phrases à remettre dans l'ordre. Tous prennent
 * « a » (jamais « an »), et un pluriel en -s (« post offices » compris).
 *
 * LE DESSIN ET LA PHRASE DISENT LA MÊME CHOSE. Un lieu = un dessin répété autant de fois que le nombre. Les réponses « Is there a
 * bank? » se lisent sur une rue de trois dessins, avec ou sans la banque. « Yes, there are. » n'est jamais juste à une question au
 * singulier.
 *
 * COMME AU CM1 (`cm1AnglaisMots.ts`) : la consigne est en français, l'anglais est entre guillemets dans l'énoncé quand il faut le
 * lire, les formes longues (« there is not ») sont exigées, jamais « isn't ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sentence, sortTiles, writeLine, type Bands, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const BANDS: Bands = 3;
const CONCEPT = "il y a : there is, there are";
const NUMBER_WORDS = ["zero", "one", "two", "three"];

export type Place = { en: string; plural: string; the: string; emoji?: string };

/** Les lieux avec un dessin, rangés par palier (deux, deux, trois), puis le marché sans dessin. */
export const PLACES: readonly Place[] = [
  { en: "school", plural: "schools", the: "l'école", emoji: "🏫" },
  { en: "shop", plural: "shops", the: "la boutique", emoji: "🏪" },
  { en: "mosque", plural: "mosques", the: "la mosquée", emoji: "🕌" },
  { en: "hospital", plural: "hospitals", the: "l'hôpital", emoji: "🏥" },
  { en: "bank", plural: "banks", the: "la banque", emoji: "🏦" },
  { en: "post office", plural: "post offices", the: "la poste", emoji: "🏤" },
  { en: "bus station", plural: "bus stations", the: "la gare routière", emoji: "🚏" },
];
export const MARKET: Place = { en: "market", plural: "markets", the: "le marché" };

const drawn = (place: Place, count: number) => (place.emoji ?? "").repeat(count);
/** Combien de dessins quand il y en a plusieurs : deux ou trois, en tournant. */
export const countFor = (index: number) => 2 + (index % 2);

const SINGULAR_CLUE = "Un seul lieu : on emploie is.";
const PLURAL_CLUE = "Plusieurs lieux : on emploie are.";
const hints = (clue: string, last: string): Hints => ["Compte les dessins.", clue, last];

/** « There ___ a school in my town. » : is pour un seul, are pour plusieurs ; am est toujours faux. */
const GAPS: readonly EnGap[] = PLACES.flatMap((place, index): EnGap[] => {
  const count = countFor(index);
  return [
    {
      prompt: `Complète avec le bon mot.\n${drawn(place, 1)}`,
      text: `There ___ a ${place.en} in my town.`,
      answer: "is",
      wrong: ["are", "am"],
      hints: hints(SINGULAR_CLUE, "Le mot commence par la lettre i."),
    },
    {
      prompt: `Complète avec le bon mot.\n${drawn(place, count)}`,
      text: `There ___ ${NUMBER_WORDS[count]} ${place.plural} in my town.`,
      answer: "are",
      wrong: ["is", "am"],
      hints: hints(PLURAL_CLUE, "Le mot commence par la lettre a."),
    },
  ];
});

export function makeCm1EnThereGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "cm1-th-trou", CONCEPT, GAPS, BANDS, 2);
}

/** « Regarde le dessin et choisis la bonne phrase. » puis 🕌🕌🕌 : `There are three mosques.`, parmi `There is three mosques.` et `There are three mosque.` */
const COUNT_CHOICES: readonly Fact[] = PLACES.flatMap((place, index): Fact[] => {
  const count = countFor(index);
  return [
    {
      question: `Regarde le dessin et choisis la bonne phrase.\n${drawn(place, 1)}`,
      answer: `There is a ${place.en}.`,
      wrong: [`There are a ${place.en}.`, `There is ${NUMBER_WORDS[count]} ${place.plural}.`] as [string, string],
      hints: hints(SINGULAR_CLUE, "Un seul lieu : le nom n'a pas de s."),
    },
    {
      question: `Regarde le dessin et choisis la bonne phrase.\n${drawn(place, count)}`,
      answer: `There are ${NUMBER_WORDS[count]} ${place.plural}.`,
      wrong: [`There is ${NUMBER_WORDS[count]} ${place.plural}.`, `There are ${NUMBER_WORDS[count]} ${place.en}.`] as [string, string],
      hints: hints(PLURAL_CLUE, "Plusieurs lieux : le nom prend un s."),
    },
  ];
});

export function makeCm1EnThereChoice(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "cm1-th-phrase", CONCEPT, COUNT_CHOICES, BANDS, 2);
}

/**
 * « Réponds à « Is there a bank? » » puis une rue de trois dessins : `Yes, there is.` si la banque y est, `No, there is not.` sinon.
 * « Yes, there are. » est le troisième choix, jamais juste.
 */
const STREET_CHOICES: readonly Fact[] = PLACES.flatMap((place, index): Fact[] => {
  const others = PLACES.filter((candidate) => candidate.en !== place.en);
  const pick = (offset: number) => others[(index + offset) % others.length];
  const present = [pick(0), place, pick(1)];
  const absent = [pick(0), pick(1), pick(2)];
  const street = (places: readonly Place[]) => places.map((candidate) => candidate.emoji).join(" ");
  const question = (places: readonly Place[]) => `Regarde la rue et réponds à « Is there a ${place.en}? »\n${street(places)}`;
  const look: Hints = [`Cherche ${place.the} parmi les trois dessins.`, "Si le dessin y est, la réponse commence par yes.", "Si le dessin n'y est pas, la réponse commence par no."];
  return [
    { question: question(present), answer: "Yes, there is.", wrong: ["No, there is not.", "Yes, there are."], hints: look },
    { question: question(absent), answer: "No, there is not.", wrong: ["Yes, there is.", "Yes, there are."], hints: look },
  ];
});

export function makeCm1EnThereStreet(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "cm1-th-rue", CONCEPT, STREET_CHOICES, BANDS, 2);
}

/** « There is a school in my town. » et « There are two shops in my town. » remis dans l'ordre, le marché compris. */
const SENTENCES = [...PLACES, MARKET].flatMap((place, index) => [
  sentence(`There is a ${place.en} in my town.`),
  sentence(`There are ${NUMBER_WORDS[countFor(index)]} ${place.plural} in my town.`),
]);

export function makeCm1EnThereOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "cm1-th-ordre", CONCEPT, SENTENCES, BANDS);
}

/** « Écris le mot qui manque, en anglais. » puis `There ___ two schools.` : `are` (la consigne ne nomme pas la réponse). */
const WRITES: readonly EnWrite[] = PLACES.flatMap((place, index): EnWrite[] => [
  { prompt: `Écris le mot qui manque, en anglais.\nThere ___ a ${place.en}.`, accepted: ["is"], hints: hints(SINGULAR_CLUE, "Le mot commence par la lettre i.") },
  { prompt: `Écris le mot qui manque, en anglais.\nThere ___ ${NUMBER_WORDS[countFor(index)]} ${place.plural}.`, accepted: ["are"], hints: hints(PLURAL_CLUE, "Le mot commence par la lettre a.") },
]);

export function makeCm1EnThereWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "cm1-th-ecrire", CONCEPT, WRITES, BANDS, 2);
}

/** `There is a school. ~ 🏫`, `There are two shops. ~ 🏪🏪` : une phrase et ses dessins. */
const PAIRS: readonly (readonly [string, string])[] = PLACES.flatMap((place, index) => [
  [`There is a ${place.en}.`, drawn(place, 1)] as const,
  [`There are ${NUMBER_WORDS[countFor(index)]} ${place.plural}.`, drawn(place, countFor(index))] as const,
]);

export function makeCm1EnThereLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "cm1-th-relier",
    CONCEPT,
    "Relie chaque phrase à son dessin.",
    PAIRS,
    ["Compte les dessins de chaque groupe.", "Un seul lieu : is. Plusieurs lieux : are.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Glisse chaque groupe de mots dans la bonne case. » : There is, ou There are. */
const IS_TILES = PLACES.map((place) => `a ${place.en}`);
const ARE_TILES = PLACES.map((place, index) => `${NUMBER_WORDS[countFor(index)]} ${place.plural}`);

export function makeCm1EnThereSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "cm1-th-glisser",
    CONCEPT,
    "Glisse chaque groupe de mots dans la bonne case.",
    { zone: "There is", tiles: IS_TILES },
    { zone: "There are", tiles: ARE_TILES },
    ["Regarde si le groupe de mots est au singulier ou au pluriel.", "Avec a, on emploie there is.", "Avec two ou three, on emploie there are."],
  );
}
