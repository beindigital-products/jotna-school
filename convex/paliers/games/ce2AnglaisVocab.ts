/**
 * LES GABARITS D'ANGLAIS DU CE2, LE VOCABULAIRE : la maison et où c'est, les mois, le temps qu'il fait, l'heure
 * (`an-ce2-home`, `an-ce2-months`, `an-ce2-weather`, `an-ce2-clock`).
 *
 * Le modèle écrivait ici « The cat is on the kitchen » pour un chat « sous la table », des mois dans le désordre, « It is half to seven »,
 * une saison des pluies en janvier. Ici le vocabulaire et les phrases sont la liste FERMÉE de la fiche de chaque thématique, la phrase
 * française dit toujours où est la chose, quel temps il fait ou quelle heure il est (c'est elle qui donne la bonne réponse), et les mauvais
 * choix sont des phrases fausses : une autre préposition, un autre mois, une autre heure.
 *
 * COMME AU CP ET AU CE1 (`anglais.ts`, `ce1Anglais.ts`) : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend ;
 * aucune écoute ni prononciation ; aucun indice n'écrit un mot de quatre lettres ou plus d'une bonne réponse ; les énoncés n'ont aucun
 * « : », au plus une apostrophe droite, vingt-huit mots au plus ; aucun émoji (les dessins du temps qu'il fait ont un U+FE0F, que le dépôt
 * refuse). Pas de « quarter past » ni de « to » : l'heure est pile ou la demie.
 *
 * PALIERS. `an-ce2-home` en a quatre (un tableau coupé en quatre quarts, une préposition de plus à chaque palier), `an-ce2-months` et
 * `an-ce2-weather` deux (niveaux 1 et 4 : le premier semestre puis le second, trois temps puis trois autres), `an-ce2-clock` trois (niveaux
 * 1, 2 et 4 : les heures de 1 à 4, de 5 à 8, de 9 à 12). Un tableau coupé en parts égales sert toutes ses lignes (`bandPart`).
 *
 * LES FAITS QUI NE VIENNENT PAS DE LA FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - La maison : le français de chaque mot et de chaque phrase (« derrière la télé », « à côté du lit »), et que le chat et le sac sont les
 *   deux seules choses qu'on place (la fiche donne cat et bag dans le vocabulaire).
 * - Les mois : que « My birthday is in May. » se dit avec chaque mois ; les mois de 30 et de 31 jours (février n'est jamais classé).
 * - Le temps : le français de chaque temps (« Il y a du vent. »), et les mois de la saison des pluies (juillet, août, septembre) et de la saison
 *   sèche (décembre, janvier, février, mars, avril) ; les mois de passage (mai, juin, octobre, novembre) ne sont jamais posés.
 * - L'heure : le français de chaque heure, et que « What time is it? » est la seule question d'heure.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pickFresh, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { levelGroup, linkGame, type Hints } from "./tableaux";
import { partOf, triples, type Fact, type Steps } from "./ce1SciencesOutils";
import { choiceLine, frenchWord, gap as enGap, gapLine, orderLine, pairsOf, sortTiles, writeLine, type EnGap, type EnWrite } from "./ce1Anglais";
import { type Word } from "./anglais";

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const firstLetter = (word: string) => `Le mot commence par la lettre ${word.charAt(0)}.`;

// ===========================================================================
// LA MAISON ET OÙ C'EST (an-ce2-home, quatre paliers)
// ===========================================================================

const HOME_CONCEPT = "dire où est une chose dans la maison";

const PREPS = ["in", "on", "under", "behind", "next to", "in front of"] as const;
type Prep = (typeof PREPS)[number];
const PREP_FR: Record<Prep, string> = { in: "dans", on: "sur", under: "sous", behind: "derrière", "next to": "à côté", "in front of": "devant" };

type Place = { en: string; fr: string; de: string };
export const PLACES = {
  kitchen: { en: "kitchen", fr: "la cuisine", de: "de la cuisine" },
  bedroom: { en: "bedroom", fr: "la chambre", de: "de la chambre" },
  bathroom: { en: "bathroom", fr: "la salle de bain", de: "de la salle de bain" },
  "living room": { en: "living room", fr: "le salon", de: "du salon" },
  house: { en: "house", fr: "la maison", de: "de la maison" },
  bed: { en: "bed", fr: "le lit", de: "du lit" },
  table: { en: "table", fr: "la table", de: "de la table" },
  chair: { en: "chair", fr: "la chaise", de: "de la chaise" },
  TV: { en: "TV", fr: "la télé", de: "de la télé" },
} as const satisfies Record<string, Place>;
type PlaceKey = keyof typeof PLACES;

const MOVABLE = { cat: "le chat", bag: "le sac" } as const;
type Movable = keyof typeof MOVABLE;

type Scene = { thing: Movable; prep: Prep; place: PlaceKey; index: number };

const scene = (thing: Movable, prep: Prep, place: PlaceKey): Omit<Scene, "index"> => ({ thing, prep, place });

/** Quatre quarts de huit scènes : in, on, under d'abord, puis behind, next to, in front of. Aucune scène n'est posée deux fois. */
export const HOME_BANDS: readonly (readonly Omit<Scene, "index">[])[] = [
  [
    scene("cat", "in", "kitchen"),
    scene("bag", "on", "chair"),
    scene("cat", "under", "table"),
    scene("bag", "in", "bedroom"),
    scene("cat", "on", "bed"),
    scene("bag", "under", "bed"),
    scene("cat", "in", "bathroom"),
    scene("bag", "on", "table"),
  ],
  [
    scene("bag", "behind", "chair"),
    scene("cat", "behind", "TV"),
    scene("bag", "behind", "table"),
    scene("cat", "behind", "bed"),
    scene("cat", "in", "living room"),
    scene("bag", "under", "chair"),
    scene("cat", "on", "chair"),
    scene("bag", "in", "house"),
  ],
  [
    scene("cat", "next to", "bed"),
    scene("bag", "next to", "chair"),
    scene("cat", "next to", "table"),
    scene("bag", "next to", "TV"),
    scene("bag", "behind", "bed"),
    scene("cat", "under", "chair"),
    scene("cat", "in", "house"),
    scene("bag", "on", "bed"),
  ],
  [
    scene("cat", "in front of", "TV"),
    scene("bag", "in front of", "table"),
    scene("cat", "in front of", "house"),
    scene("bag", "in front of", "bed"),
    scene("bag", "in", "living room"),
    scene("bag", "behind", "TV"),
    scene("cat", "on", "table"),
    scene("bag", "under", "table"),
  ],
];

export const HOME_SCENES: readonly Scene[] = HOME_BANDS.flat().map((item, index) => ({ ...item, index }));

/** « The cat is under the table. » */
export const sceneEn = (s: Scene, prep: Prep = s.prep) => `The ${s.thing} is ${prep} the ${PLACES[s.place].en}.`;
/** « Le chat est sous la table. » : la phrase française donne la bonne préposition. */
export const sceneFr = (s: Scene) => `${cap(MOVABLE[s.thing])} est ${PREP_FR[s.prep]} ${s.prep === "next to" ? PLACES[s.place].de : PLACES[s.place].fr}.`;

/** Deux prépositions fausses pour cette scène, à deux pas l'une de l'autre dans la liste. */
const wrongPreps = (s: Scene): [Prep, Prep] => {
  const others = PREPS.filter((prep) => prep !== s.prep);
  return [others[s.index % others.length], others[(s.index + 2) % others.length]];
};

const HOME_PHRASES: readonly Fact[] = HOME_SCENES.map((s) => ({
  question: `${sceneFr(s)} Quelle phrase dit la même chose en anglais ?`,
  answer: sceneEn(s),
  wrong: wrongPreps(s).map((prep) => sceneEn(s, prep)) as unknown as readonly [string, string],
  hints: ["Lis la phrase française, puis cherche où est la chose.", "Le petit mot de lieu change d'une phrase anglaise à l'autre.", "Cherche le petit mot qui dit la même chose que le français."],
}));

/** « Le chat est sous la table. Quelle phrase dit la même chose en anglais ? » */
export function makeCe2EnHomePhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-home-phrase", HOME_CONCEPT, HOME_PHRASES, 4, 2);
}

const HOME_WHERE: readonly Fact[] = HOME_SCENES.map((s) => ({
  question: `${sceneFr(s)} On te demande « Where is the ${s.thing}? ». Que réponds-tu ?`,
  answer: `It is ${s.prep} the ${PLACES[s.place].en}.`,
  wrong: wrongPreps(s).map((prep) => `It is ${prep} the ${PLACES[s.place].en}.`) as unknown as readonly [string, string],
  hints: ["Lis la phrase française, puis cherche où est la chose.", "La réponse commence par It is, puis dit où.", "Cherche le petit mot de lieu qui dit la même chose que le français."],
}));

/** « On te demande « Where is the bag? ». » : It is on the chair. */
export function makeCe2EnHomeWhere(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-home-ou", HOME_CONCEPT, HOME_WHERE, 4, 1);
}

const HOME_GAPS: readonly EnGap[] = HOME_SCENES.map((s) =>
  enGap(
    `The ${s.thing} is ___ the ${PLACES[s.place].en}.`,
    s.prep,
    wrongPreps(s),
    "Le petit mot cherché dit où est la chose, comme dans la phrase française.",
    `${sceneFr(s)} Complète la phrase en anglais.`,
  ),
);

/** « Le chat est sous la table. Complète la phrase en anglais. » : The cat is ___ the table. */
export function makeCe2EnHomeGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-home-trou", HOME_CONCEPT, HOME_GAPS, 4, 2);
}

const HOME_ORDER_HINTS: Hints = ["Une phrase commence par une majuscule.", "Dis la phrase en français, puis cherche chaque mot anglais.", "Le dernier mot finit la phrase."];

const HOME_ORDERS: readonly Steps[] = HOME_SCENES.map((s) => ({
  prompt: `Remets les mots dans l'ordre pour dire « ${sceneFr(s)} ».`,
  sequence: sceneEn(s).split(" "),
  hints: HOME_ORDER_HINTS,
}));

/** « Remets les mots dans l'ordre pour dire « Le chat est sous la table. ». » */
export function makeCe2EnHomeOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-home-ordre", HOME_CONCEPT, HOME_ORDERS, 4);
}

const word = (en: string, fr: string, the: string): Word => ({ en, fr, the });

/** Les onze mots de la fiche, du premier au dernier palier. */
export const HOME_WORDS: readonly Word[] = [
  word("house", "maison", "la maison"),
  word("kitchen", "cuisine", "la cuisine"),
  word("bedroom", "chambre", "la chambre"),
  word("bathroom", "salle de bain", "la salle de bain"),
  word("living room", "salon", "le salon"),
  word("bed", "lit", "le lit"),
  word("table", "table", "la table"),
  word("chair", "chaise", "la chaise"),
  word("TV", "télé", "la télé"),
  word("cat", "chat", "le chat"),
  word("bag", "sac", "le sac"),
];

/** « Comment dit-on « la cuisine » en anglais ? » : un mot du quart du palier, deux autres mots de la fiche. */
export function makeCe2EnHomeWord(ctx: GameContext): GeneratedGame {
  return frenchWord("ce2-en-home-mot", ctx, partOf(HOME_WORDS, ctx.level - 1, 4), HOME_WORDS, HOME_CONCEPT);
}

/** Le mot « table » s'écrit pareil en français : il ne se relie pas (deux côtés identiques). */
const HOME_PAIRS: readonly (readonly [string, string])[] = HOME_WORDS.filter((item) => item.en !== "table").map((item) => [item.en, item.fr] as const);

/** « Relie chaque mot anglais à son sens en français. » */
export function makeCe2EnHomeLinks(ctx: GameContext): GeneratedGame {
  return pairsOf(ctx, "ce2-en-home-relier", HOME_CONCEPT, "Relie chaque mot anglais à son sens en français.", HOME_PAIRS, [
    "Pense à ce que désigne chaque mot.",
    "Dis le mot anglais, puis cherche le mot français qui lui va.",
    "Commence par la paire dont tu es le plus sûr.",
  ], 4);
}

/** « Glisse chaque mot dans la bonne case. » : une pièce ou un objet de la maison. */
export function makeCe2EnHomeSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce2-en-home-glisser",
    "ranger les mots de la maison",
    "Glisse chaque mot dans la bonne case.",
    { zone: "Pièce", tiles: ["kitchen", "bedroom", "bathroom", "living room"] },
    { zone: "Objet", tiles: ["bed", "table", "chair", "TV", "bag"] },
    ["Pense à ce qu'on trouve dans la maison.", "On dort, on cuisine ou on se lave à un endroit précis de la maison.", "Un meuble ou un sac se pose à l'intérieur de cet endroit."],
  );
}

/** Seize lignes, quatre par palier : seules les scènes à une préposition d'un mot, que l'enfant écrit en un mot. */
const HOME_WRITES: readonly EnWrite[] = HOME_BANDS.flatMap((band, b) =>
  band
    .map((item, i) => HOME_SCENES[b * 8 + i])
    .filter((s) => !s.prep.includes(" "))
    .slice(0, 4)
    .map((s) => ({
      prompt: `${sceneFr(s)} Écris le petit mot anglais qui manque dans The ${s.thing} is ___ the ${PLACES[s.place].en}.`,
      accepted: [s.prep],
      hints: ["Pense à où est la chose, comme le dit le français.", "Le petit mot cherché est court et se place avant the.", firstLetter(s.prep)],
    })),
);

/** « Écris le petit mot anglais qui manque dans The cat is ___ the table. » : in, on, under ou behind. */
export function makeCe2EnHomeWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-home-ecrire", HOME_CONCEPT, HOME_WRITES, 4, 1);
}

// ===========================================================================
// LES MOIS (an-ce2-months, deux paliers)
// ===========================================================================

const MONTHS_CONCEPT = "dire les mois de l'année en anglais";

export const MONTHS: readonly Word[] = [
  word("January", "janvier", "janvier"),
  word("February", "février", "février"),
  word("March", "mars", "mars"),
  word("April", "avril", "avril"),
  word("May", "mai", "mai"),
  word("June", "juin", "juin"),
  word("July", "juillet", "juillet"),
  word("August", "août", "août"),
  word("September", "septembre", "septembre"),
  word("October", "octobre", "octobre"),
  word("November", "novembre", "novembre"),
  word("December", "décembre", "décembre"),
];

/** Le premier semestre au premier palier, le second au dernier. */
const monthsOfBand = (band: number) => MONTHS.map((month, index) => ({ month, index })).filter(({ index }) => Math.floor(index / 6) === band);

/** « Comment dit-on « mars » en anglais ? » : un mois du semestre du palier, deux autres mois. */
export function makeCe2EnMonthsWord(ctx: GameContext): GeneratedGame {
  return frenchWord("ce2-en-months-mot", ctx, partOf(MONTHS, ctx.level <= 2 ? 0 : 1, 2), MONTHS, MONTHS_CONCEPT);
}

const MONTH_ORDER_HINTS: Hints = ["Dis les mois de l'année dans l'ordre, du premier au dernier.", "Cherche le mois juste avant ou juste après celui qu'on te donne.", "Un mois s'écrit avec une majuscule."];

/** Onze lignes par palier : « après » pour les mois du semestre qui ont un suivant, « avant » pour ceux qui ont un précédent. */
const MONTH_NEIGHBOURS: readonly Fact[] = [0, 1].flatMap((band) => {
  const rows: Fact[] = [];
  for (const { month, index } of monthsOfBand(band)) {
    if (index < 11) {
      rows.push({
        question: `Quel mois vient après ${month.en} ?`,
        answer: MONTHS[index + 1].en,
        wrong: [MONTHS[(index + 2) % 12].en, MONTHS[(index + 11) % 12].en] as const,
        hints: MONTH_ORDER_HINTS,
      });
    }
  }
  for (const { month, index } of monthsOfBand(band)) {
    if (index > 0) {
      rows.push({
        question: `Quel mois vient avant ${month.en} ?`,
        answer: MONTHS[index - 1].en,
        wrong: [MONTHS[(index + 10) % 12].en, MONTHS[(index + 1) % 12].en] as const,
        hints: MONTH_ORDER_HINTS,
      });
    }
  }
  return rows;
});

/** « Quel mois vient après March ? » ou « avant May ? » */
export function makeCe2EnMonthsNeighbour(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-months-voisin", MONTHS_CONCEPT, MONTH_NEIGHBOURS, 2, 2);
}

const BIRTHDAYS: readonly Fact[] = [0, 1].flatMap((band) =>
  monthsOfBand(band).map(({ month }) => ({
    question: `Mon anniversaire est en ${month.fr}. Que dis-tu en anglais ?`,
    answer: `My birthday is in ${month.en}.`,
    wrong: [`My birthday is on ${month.en}.`, `My birthday is at ${month.en}.`] as const,
    hints: ["Pour dire en quel mois, on utilise le même petit mot pour tous les mois.", "Lis chaque phrase en entier.", "Le petit mot qui précède le mois est le seul qui change."],
  })),
);

/** « Mon anniversaire est en mai. Que dis-tu en anglais ? » : My birthday is in May. */
export function makeCe2EnMonthsBirthday(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-months-anniversaire", MONTHS_CONCEPT, BIRTHDAYS, 2, 1);
}

const MONTH_GAPS: readonly EnGap[] = [0, 1].flatMap((band) => [
  ...monthsOfBand(band).map(({ month }) =>
    enGap(`My birthday is ___ ${month.en}.`, "in", ["on", "at"], "Le petit mot cherché va avec tous les mois.", `Mon anniversaire est en ${month.fr}. Complète la phrase en anglais.`),
  ),
  ...monthsOfBand(band).map(({ month, index }) => {
    const text = index === 0 ? "___, February, March" : index === 11 ? "October, November, ___" : `${MONTHS[index - 1].en}, ___, ${MONTHS[index + 1].en}`;
    return enGap(text, month.en, [MONTHS[(index + 3) % 12].en, MONTHS[(index + 9) % 12].en], "Dis les mois de l'année dans l'ordre : un seul va à la place du trou.", "Quel mois manque ?");
  }),
]);

/** « Mon anniversaire est en mai. Complète la phrase en anglais. » ou « March, ___, May » */
export function makeCe2EnMonthsGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-months-trou", MONTHS_CONCEPT, MONTH_GAPS, 2, 2);
}

const MONTH_ORDERS: readonly Steps[] = [0, 1, 2, 3, 5, 6, 7, 8].map((start) => ({
  prompt: "Remets ces mois dans l'ordre.",
  sequence: MONTHS.slice(start, start + 4).map((month) => month.en),
  hints: ["Dis les mois de l'année dans l'ordre, en commençant par le premier.", "Le mois qui suit est celui qui vient juste après.", "Un mois s'écrit avec une majuscule."],
}));

/** « Remets ces mois dans l'ordre. » : quatre mois qui se suivent. */
export function makeCe2EnMonthsOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-months-ordre", MONTHS_CONCEPT, MONTH_ORDERS, 2);
}

const MONTH_PAIRS: readonly (readonly [string, string])[] = MONTHS.map((month) => [month.en, month.fr] as const);

/** « Relie chaque mois anglais à son nom en français. » */
export function makeCe2EnMonthsLinks(ctx: GameContext): GeneratedGame {
  return pairsOf(ctx, "ce2-en-months-relier", MONTHS_CONCEPT, "Relie chaque mois anglais à son nom en français.", MONTH_PAIRS, [
    "Dis le mois anglais, puis cherche le mois français qui lui ressemble.",
    "Regarde les premières lettres de chaque mois.",
    "Commence par la paire dont tu es le plus sûr.",
  ], 2);
}

/** Les mois de 31 jours et de 30 jours : février, qui a 28 jours, n'est jamais classé. */
export const DAYS_31 = ["January", "March", "May", "July", "August", "October", "December"] as const;
export const DAYS_30 = ["April", "June", "September", "November"] as const;

/** « Glisse chaque mois dans la bonne case. » : 31 jours ou 30 jours. */
export function makeCe2EnMonthsSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce2-en-months-glisser",
    "ranger les mois selon leur nombre de jours",
    "Glisse chaque mois dans la bonne case.",
    { zone: "31 jours", tiles: DAYS_31 },
    { zone: "30 jours", tiles: DAYS_30 },
    ["Pense au petit poème des mois, celui qu'on récite par cœur.", "Avril, juin, septembre et novembre sont des mois plus courts.", "Les autres mois, sauf février, sont les plus longs."],
  );
}

const MONTH_WRITES: readonly EnWrite[] = [0, 1].flatMap((band) => {
  const rows: EnWrite[] = [];
  for (const { month, index } of monthsOfBand(band)) {
    const target = band === 1 && index === 11 ? MONTHS[10] : MONTHS[index + 1];
    const after = !(band === 1 && index === 11);
    rows.push({
      prompt: `Écris en anglais le mois qui vient ${after ? "après" : "avant"} ${month.en}.`,
      accepted: [target.en],
      hints: ["Dis les mois de l'année dans l'ordre.", "Le mois cherché touche celui de la question.", `${firstLetter(target.en)} Un mois s'écrit avec une majuscule.`],
    });
  }
  return rows;
});

/** « Écris en anglais le mois qui vient après April. » : May. */
export function makeCe2EnMonthsWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-months-ecrire", MONTHS_CONCEPT, MONTH_WRITES, 2, 1);
}

// ===========================================================================
// LE TEMPS QU'IL FAIT (an-ce2-weather, deux paliers)
// ===========================================================================

const WEATHER_CONCEPT = "dire le temps qu'il fait";

type Weather = { en: string; adj: string; phrase: string };
const weather = (en: string, adj: string, phrase: string): Weather => ({ en, adj, phrase });

/** Trois temps au premier palier, trois autres au dernier. */
export const WEATHERS: readonly Weather[] = [
  weather("sunny", "ensoleillé", "Il y a du soleil."),
  weather("rainy", "pluvieux", "Il pleut."),
  weather("hot", "chaud", "Il fait chaud."),
  weather("windy", "venteux", "Il y a du vent."),
  weather("cloudy", "nuageux", "Il y a des nuages."),
  weather("cold", "froid", "Il fait froid."),
];

const weatherBand = (level: GameLevel) => (level <= 2 ? 0 : 1);
const weatherOf = (band: number) => WEATHERS.slice(band * 3, band * 3 + 3);
const otherWeathers = (item: Weather, shift: number): [Weather, Weather] => {
  const others = WEATHERS.filter((candidate) => candidate !== item);
  return [others[shift % others.length], others[(shift + 2) % others.length]];
};
const todayFr = (phrase: string) => `${phrase.slice(0, -1)} aujourd'hui.`;

/** « Comment dit-on « pluvieux » en anglais ? » : un temps du palier, deux autres temps. */
export function makeCe2EnWeatherWord(ctx: GameContext): GeneratedGame {
  const words: Word[] = WEATHERS.map((item) => ({ en: item.en, fr: item.adj, the: item.adj }));
  return frenchWord("ce2-en-weather-mot", ctx, words.slice(weatherBand(ctx.level) * 3, weatherBand(ctx.level) * 3 + 3), words, WEATHER_CONCEPT);
}

const WEATHER_PHRASES: readonly Fact[] = [0, 1].flatMap((band) =>
  weatherOf(band).flatMap((item, i) =>
    [false, true].map((today) => ({
      question: `${today ? todayFr(item.phrase) : item.phrase} Quelle phrase dit la même chose en anglais ?`,
      answer: `It is ${item.en}${today ? " today" : ""}.`,
      wrong: otherWeathers(item, i + (today ? 1 : 0)).map((other) => `It is ${other.en}${today ? " today" : ""}.`) as unknown as readonly [string, string],
      hints: ["Lis la phrase française, puis cherche le temps qu'il fait.", "Chaque phrase anglaise dit un temps différent.", "Cherche le mot anglais qui dit la même chose que le français."],
    })),
  ),
);

/** « Il pleut. Quelle phrase dit la même chose en anglais ? » : It is rainy. */
export function makeCe2EnWeatherPhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-weather-phrase", WEATHER_CONCEPT, WEATHER_PHRASES, 2, 1);
}

const WEATHER_REPLIES: readonly Fact[] = [0, 1].flatMap((band) =>
  weatherOf(band).map((item, i) => ({
    question: `${item.phrase} On te demande « What is the weather like? ». Que réponds-tu ?`,
    answer: `It is ${item.en}.`,
    wrong: otherWeathers(item, i + 1).map((other) => `It is ${other.en}.`) as unknown as readonly [string, string],
    hints: ["Lis la phrase française, puis cherche le temps qu'il fait.", "La réponse commence par It is, puis dit le temps.", "Cherche le mot anglais qui dit la même chose que le français."],
  })),
);

/** « Il pleut. On te demande « What is the weather like? ». » : It is rainy. */
export function makeCe2EnWeatherReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-weather-question", WEATHER_CONCEPT, WEATHER_REPLIES, 2, 1);
}

const WEATHER_GAPS: readonly EnGap[] = [0, 1].flatMap((band) =>
  weatherOf(band).flatMap((item, i) =>
    [false, true].map((today) =>
      enGap(
        `It is ___${today ? " today" : ""}.`,
        item.en,
        otherWeathers(item, i + 2 + (today ? 1 : 0)).map((other) => other.en) as unknown as readonly [string, string],
        "Le mot cherché dit le temps qu'il fait, comme dans la phrase française.",
        `${today ? todayFr(item.phrase) : item.phrase} Complète la phrase en anglais.`,
      ),
    ),
  ),
);

/** « Il pleut. Complète la phrase en anglais. » : It is ___. */
export function makeCe2EnWeatherGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-weather-trou", WEATHER_CONCEPT, WEATHER_GAPS, 2, 2);
}

const WEATHER_ORDERS: readonly Steps[] = WEATHERS.map((item) => ({
  prompt: `Remets les mots dans l'ordre pour dire « ${item.phrase} ».`,
  sequence: ["It", "is", `${item.en}.`],
  hints: ["Une phrase commence par une majuscule.", "Dis la phrase en français, puis cherche chaque mot anglais.", "Le dernier mot finit la phrase."],
}));

/** « Remets les mots dans l'ordre pour dire « Il fait chaud. ». » : It is hot. */
export function makeCe2EnWeatherOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-weather-ordre", WEATHER_CONCEPT, WEATHER_ORDERS, 2);
}

const WEATHER_PAIRS: readonly (readonly [string, string])[] = WEATHERS.map((item) => [item.en, item.adj] as const);

/** « Relie chaque mot anglais à son sens en français. » */
export function makeCe2EnWeatherLinks(ctx: GameContext): GeneratedGame {
  return pairsOf(ctx, "ce2-en-weather-relier", WEATHER_CONCEPT, "Relie chaque mot anglais à son sens en français.", WEATHER_PAIRS, [
    "Pense au temps que dit chaque mot.",
    "Dis le mot anglais, puis cherche le mot français qui lui va.",
    "Commence par la paire dont tu es le plus sûr.",
  ], 2);
}

/** Les saisons du Sénégal : la saison des pluies en juillet, août et septembre, la saison sèche de décembre à avril. */
export const RAINY_MONTHS = ["July", "August", "September"] as const;
export const DRY_MONTHS = ["December", "January", "February", "March", "April"] as const;
const MONTH_FR: Record<string, string> = Object.fromEntries(MONTHS.map((month) => [month.en, month.fr]));

type Season = { rainy: boolean; month: string };
const SEASONS: readonly Season[] = [
  { rainy: true, month: "July" },
  { rainy: false, month: "January" },
  { rainy: true, month: "August" },
  { rainy: false, month: "February" },
  { rainy: true, month: "September" },
  { rainy: false, month: "December" },
  { rainy: false, month: "March" },
  { rainy: false, month: "April" },
];

const SEASON_FACTS: readonly Fact[] = SEASONS.map((season, i) => {
  const name = season.rainy ? "rainy" : "dry";
  const other = season.rainy ? DRY_MONTHS[i % DRY_MONTHS.length] : RAINY_MONTHS[i % RAINY_MONTHS.length];
  return {
    question: `En ${MONTH_FR[season.month]}, au Sénégal, c'est la ${season.rainy ? "saison des pluies" : "saison sèche"}. Que dis-tu en anglais ?`,
    answer: `It is the ${name} season in ${season.month}.`,
    wrong: [`It is the ${season.rainy ? "dry" : "rainy"} season in ${season.month}.`, `It is the ${name} season in ${other}.`] as const,
    hints: ["Lis chaque phrase en entier.", "Cherche la saison, puis le mois, qui doivent aller ensemble.", "La bonne phrase dit la saison et le mois de la phrase française."],
  };
});

/** « En juillet, au Sénégal, c'est la saison des pluies. » : It is the rainy season in July. */
export function makeCe2EnWeatherSeason(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-weather-saison", WEATHER_CONCEPT, SEASON_FACTS, 2, 1);
}

/** « Glisse chaque mois dans la bonne case. » : la saison sèche ou la saison des pluies. */
export function makeCe2EnWeatherSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce2-en-weather-glisser",
    "ranger les mois selon la saison du Sénégal",
    "Glisse chaque mois dans la bonne case.",
    { zone: "Saison sèche", tiles: DRY_MONTHS },
    { zone: "Saison des pluies", tiles: RAINY_MONTHS },
    ["Pense à la pluie au Sénégal.", "Il pleut en milieu d'année, et il ne pleut pas en début d'année.", "Décembre et janvier sont secs, juillet et août sont humides."],
  );
}

const WEATHER_WRITES: readonly EnWrite[] = [0, 1].flatMap((band) =>
  weatherOf(band).map((item) => ({
    prompt: `${item.phrase} Écris le mot anglais qui manque dans It is ___.`,
    accepted: [item.en],
    hints: ["Pense au temps que dit la phrase française.", "Le mot cherché est un adjectif qui dit le temps.", firstLetter(item.en)],
  })),
);

/** « Il fait froid. Écris le mot anglais qui manque dans It is ___. » : cold. */
export function makeCe2EnWeatherWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-weather-ecrire", WEATHER_CONCEPT, WEATHER_WRITES, 2, 1);
}

// ===========================================================================
// L'HEURE (an-ce2-clock, trois paliers)
// ===========================================================================

const CLOCK_CONCEPT = "dire l'heure pile et la demie";

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"] as const;
const wordOf = (hour: number) => NUMBER_WORDS[hour - 1];

type Time = { hour: number; half: boolean };

/** Les heures de 1 à 4, de 5 à 8, de 9 à 12 : huit lignes par palier (l'heure pile, puis la demie). */
const CLOCK_TIMES: readonly Time[] = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((hour) => [{ hour, half: false }, { hour, half: true }]);
const clockBand = (level: GameLevel) => levelGroup(level);
const nextHour = (hour: number) => (hour % 12) + 1;
const digits = (time: Time) => `${time.hour}:${time.half ? "30" : "00"}`;
/** L'heure dans un énoncé : « 3 h 30 », « 4 h » (un énoncé n'a aucun deux-points). */
const frenchTime = (time: Time) => (time.half ? `${time.hour} h 30` : `${time.hour} h`);
const clockSentence = (time: Time) => (time.half ? `It is half past ${wordOf(time.hour)}.` : `It is ${wordOf(time.hour)} o'clock.`);

const CLOCK_PHRASES: readonly Fact[] = CLOCK_TIMES.map((time) => ({
  question: `Il est ${frenchTime(time)}. Quelle phrase dit l'heure ?`,
  answer: clockSentence(time),
  wrong: [clockSentence({ hour: time.hour, half: !time.half }), clockSentence({ hour: nextHour(time.hour), half: time.half })] as const,
  hints: ["Lis l'heure en chiffres, puis dis-la en français.", "L'heure pile et la demie ne se disent pas pareil.", "Cherche la phrase qui a la bonne heure et la bonne façon de la dire."],
}));

/** « Il est 7:30. Quelle phrase dit l'heure ? » : It is half past seven. */
export function makeCe2EnClockPhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-clock-phrase", CLOCK_CONCEPT, CLOCK_PHRASES, 3, 2);
}

const CLOCK_HOURS: readonly Fact[] = CLOCK_TIMES.map((time) => ({
  question: `Quelle heure dit la phrase « ${clockSentence(time)} » ?`,
  answer: digits(time),
  wrong: [digits({ hour: time.hour, half: !time.half }), digits({ hour: nextHour(time.hour), half: time.half })] as const,
  hints: ["Lis la phrase anglaise, puis cherche l'heure en chiffres.", "L'heure pile et la demie ne se disent pas pareil.", "Cherche l'heure et les minutes qui vont avec la phrase."],
}));

/** « Quelle heure dit la phrase « It is five o'clock. » ? » : 5:00. */
export function makeCe2EnClockDigits(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-clock-heure", CLOCK_CONCEPT, CLOCK_HOURS, 3, 1);
}

const CLOCK_GAPS: readonly EnGap[] = CLOCK_TIMES.map((time) =>
  enGap(
    time.half ? "It is half past ___." : "It is ___ o'clock.",
    wordOf(time.hour),
    [wordOf(((time.hour + 1) % 12) + 1), wordOf(((time.hour + 4) % 12) + 1)],
    "Le nombre cherché est l'heure de la phrase française.",
    `Il est ${frenchTime(time)}. Complète la phrase en anglais.`,
  ),
);

/** « Il est 4:00. Complète la phrase en anglais. » : It is ___ o'clock. */
export function makeCe2EnClockGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-clock-trou", CLOCK_CONCEPT, CLOCK_GAPS, 3, 2);
}

const QUESTION_DISTRACTORS = ["How old are you?", "What is your name?", "Where are you from?", "How are you?"] as const;

/** Trois énoncés, un par palier : la même question ne revient pas d'un palier à l'autre. */
const CLOCK_QUESTION_PROMPTS = ["Quelle question demande l'heure ?", "Pour savoir quelle heure il est, que demandes-tu ?", "Tu veux connaître l'heure. Que demandes-tu en anglais ?"] as const;

const CLOCK_QUESTIONS: readonly Fact[] = [0, 1, 2].map((band) => ({
  question: CLOCK_QUESTION_PROMPTS[band],
  answer: "What time is it?",
  wrong: [QUESTION_DISTRACTORS[band], QUESTION_DISTRACTORS[(band + 2) % 4]] as const,
  hints: ["Cherche la question qui parle de l'heure.", "Les autres questions parlent d'un âge, d'un nom ou d'un lieu.", "Pense à la question qu'on pose pour savoir s'il est tôt ou tard."],
}));

/** « Quelle question demande l'heure ? » : What time is it? */
export function makeCe2EnClockQuestion(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-clock-question", CLOCK_CONCEPT, CLOCK_QUESTIONS, 3, 1);
}

/** « Relie chaque heure à la phrase qui la dit. » : trois heures du palier. */
export function makeCe2EnClockLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-en-clock-relier", CLOCK_CONCEPT, () => {
    const band = clockBand(ctx.level);
    const pool = CLOCK_TIMES.slice(band * 8, band * 8 + 8).map((time) => [digits(time), clockSentence(time)] as const);
    const chosen = pickFresh(ctx, triples(pool), (trio) => `ce2-en-clock-relier:${trio.map((pair) => pair[0]).join("|")}`);
    return {
      prompt: "Relie chaque heure à la phrase qui la dit.",
      pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })),
      hints: ["Lis l'heure en chiffres, puis dis-la en français.", "L'heure pile et la demie ne se disent pas pareil.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

/** Trois séries de quatre heures qui se suivent par demi-heure, par palier. */
const CLOCK_STARTS: readonly (readonly Time[])[] = [
  [{ hour: 1, half: false }, { hour: 2, half: false }, { hour: 3, half: false }],
  [{ hour: 5, half: false }, { hour: 6, half: false }, { hour: 7, half: false }],
  [{ hour: 8, half: true }, { hour: 9, half: true }, { hour: 10, half: true }],
];

const stepsFrom = (start: Time): Time[] => {
  const steps: Time[] = [];
  let hour = start.hour;
  let half = start.half;
  for (let i = 0; i < 4; i++) {
    steps.push({ hour, half });
    if (half) hour += 1;
    half = !half;
  }
  return steps;
};

const CLOCK_ORDERS: readonly Steps[] = CLOCK_STARTS.flat().map((start) => ({
  prompt: "Range ces heures de la plus petite à la plus grande.",
  sequence: stepsFrom(start).map(clockSentence),
  hints: ["Cherche d'abord l'heure la plus petite.", "Une heure pile vient avant sa demie.", "La demie d'une heure vient avant l'heure d'après."],
}));

/** « Range ces heures de la plus petite à la plus grande. » : quatre phrases qui se suivent par demi-heure. */
export function makeCe2EnClockOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-clock-ordre", CLOCK_CONCEPT, CLOCK_ORDERS, 3);
}

/** « Glisse chaque heure dans la bonne case. » : o'clock ou half past. */
export function makeCe2EnClockSort(ctx: GameContext): GeneratedGame {
  const band = clockBand(ctx.level);
  const times = CLOCK_TIMES.slice(band * 8, band * 8 + 8);
  return sortTiles(
    ctx,
    "ce2-en-clock-glisser",
    "ranger les heures selon pile ou demie",
    "Glisse chaque heure dans la bonne case.",
    { zone: "o'clock", tiles: times.filter((time) => !time.half).map(digits) },
    { zone: "half past", tiles: times.filter((time) => time.half).map(digits) },
    ["Regarde les minutes après les deux points.", "Zéro minute, c'est l'heure pile.", "Trente minutes, c'est la demie."],
  );
}

const CLOCK_WRITES: readonly EnWrite[] = CLOCK_TIMES.map((time) => ({
  prompt: `Il est ${frenchTime(time)}. Écris en anglais le nombre qui manque dans ${time.half ? "It is half past ___." : "It is ___ o'clock."}`,
  accepted: [wordOf(time.hour)],
  hints: ["Pense à l'heure de la phrase française.", "Le nombre cherché s'écrit en lettres, en anglais.", firstLetter(wordOf(time.hour))],
}));

/** « Il est 3:30. Écris en anglais le nombre qui manque dans It is half past ___. » : three. */
export function makeCe2EnClockWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-clock-ecrire", CLOCK_CONCEPT, CLOCK_WRITES, 3, 1);
}
