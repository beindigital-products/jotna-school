/**
 * LES GABARITS DE L'HISTOIRE DU CE2 : le progrès, les royaumes du Sénégal (1 et 2) et les titres des rois
 * (`hi-ce2-progres`, `hi-ce2-royaumes-1`, `hi-ce2-royaumes-2`, `hi-ce2-rois`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait des exercices faux dans près d'un cas sur deux en histoire : « le Walo est le
 * royaume le plus au sud » (il est au nord, sur le fleuve), « Alboury, roi du Fouta », « Toucouleur » rangé parmi les royaumes, un
 * royaume classé « par importance », un fait inventé (« le Walo, royaume commercial »). Ici chaque réponse se lit dans une table
 * fermée, écrite à la main, qui ne dit que ce que la fiche dit.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les royaumes : le Djolof (fondé, selon la tradition, par Ndiadiane Ndiaye), le Cayor, le Baol et le Walo (royaumes wolofs) ;
 *   le Sine et le Saloum (royaumes sérères) ; le Tékrour et le Fouta (vallée du fleuve Sénégal) ; le Gabou et les royaumes de
 *   Casamance ; un roi, des conseillers, des villages. Leur place sur la carte ne se dit qu'en trois grandes parties (au nord, au
 *   centre, au sud) et seulement pour les royaumes dont la place ne se discute pas : le Walo, le Tékrour et le Fouta sont au
 *   nord, le Baol, le Sine et le Saloum au centre, le Gabou et la Casamance au sud. Le Djolof et le Cayor, à la limite du nord
 *   et du centre, ne sont jamais posés.
 * - Les titres : le Bourba au Djolof, le Damel au Cayor, le Teigne au Baol, le Brak au Walo, le Bour au Sine et au Saloum,
 *   l'Almamy au Fouta, le Mansa au Gabou. AUCUN autre roi, AUCUNE date : la fiche l'interdit.
 * - Le progrès : se déplacer (à pied, en charrette, en car rapide, en train), s'éclairer (lampe à pétrole, électricité),
 *   communiquer (lettre, téléphone fixe, téléphone portable), cuisiner (feu de bois, gaz). Seuls les couples dont l'ordre dans le temps
 *   ne se discute pas sont comparés : jamais le train et le car rapide.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom SEUL, avec sa majuscule, sans article (« Walo », « Lettre »).
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe droite, vingt-huit mots
 *   au plus. Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 * - Un gabarit qui pose plusieurs fois la même question dans un palier (`uses`) a au moins quatre fois `uses` lignes.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  cap,
  ce2Gap,
  ce2Link,
  ce2Order,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  joinFrench,
  tag,
  type GapRow,
  type Hints,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import { fresh, originOf, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";

// ===========================================================================
// LES ROYAUMES ET LEURS TITRES
// ===========================================================================

type Place = "Au nord" | "Au centre" | "Au sud";
type Kingdom = { name: string; people?: "wolof" | "sérère"; title?: string; place?: Place };

/** Les neuf royaumes que les fiches nomment, avec ce qu'elles disent (ou ce qui ne se discute pas) de chacun. */
const KINGDOMS: readonly Kingdom[] = [
  { name: "Djolof", people: "wolof", title: "Bourba" },
  { name: "Cayor", people: "wolof", title: "Damel" },
  { name: "Baol", people: "wolof", title: "Teigne", place: "Au centre" },
  { name: "Walo", people: "wolof", title: "Brak", place: "Au nord" },
  { name: "Sine", people: "sérère", title: "Bour", place: "Au centre" },
  { name: "Saloum", people: "sérère", title: "Bour", place: "Au centre" },
  { name: "Tékrour", place: "Au nord" },
  { name: "Fouta", title: "Almamy", place: "Au nord" },
  { name: "Gabou", title: "Mansa", place: "Au sud" },
];

const named = (name: string): Kingdom => KINGDOMS.find((kingdom) => kingdom.name === name) as Kingdom;
const the = (name: string) => `le ${name}`;

const WOLOF = KINGDOMS.filter((kingdom) => kingdom.people === "wolof");
const SERERE = KINGDOMS.filter((kingdom) => kingdom.people === "sérère");
const NOT_WOLOF = KINGDOMS.filter((kingdom) => kingdom.people !== "wolof");
const NORTH = KINGDOMS.filter((kingdom) => kingdom.place === "Au nord");
const CENTRE = KINGDOMS.filter((kingdom) => kingdom.place === "Au centre");
const SOUTH = KINGDOMS.filter((kingdom) => kingdom.place === "Au sud");
const PLACES: readonly Place[] = ["Au nord", "Au centre", "Au sud"];

/** Les royaumes qui ont un titre, et les sept titres (le Sine et le Saloum partagent le Bour). */
const TITLED = KINGDOMS.filter((kingdom) => kingdom.title);
const TITLES = [...new Set(TITLED.map((kingdom) => kingdom.title as string))];

/** Les trios « un royaume du nord, un du centre, un du sud » : la place de chacun se lit sans hésiter. */
const TRIOS = NORTH.flatMap((north) => CENTRE.flatMap((centre) => SOUTH.map((south) => [north, centre, south] as const)));

const hints = (a: string, b: string, c: string): Hints => [a, b, c];

/** Les lignes d'une liste, sans les doublons de clé. */
function uniqueBy<T>(rows: readonly T[], keyOf: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = keyOf(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Le Djolof et ses fondateurs, les royaumes wolofs
// ---------------------------------------------------------------------------

const FOUNDER_ROWS: readonly QuestionRow[] = [
  {
    prompt: "Selon la tradition, Ndiadiane Ndiaye a fondé quel royaume ?",
    answer: "Djolof",
    wrong: ["Sine", "Gabou"],
    hints: hints("Relis le nom du fondateur dans la question.", "Ce royaume était installé dans l'intérieur du pays.", "Son nom commence par la lettre D."),
  },
  {
    prompt: "Quel royaume doit son origine à Ndiadiane Ndiaye, selon la tradition ?",
    answer: "Djolof",
    wrong: ["Saloum", "Fouta"],
    hints: hints("Relis le nom du fondateur dans la question.", "Ce royaume est un royaume wolof.", "Son nom commence par la lettre D."),
  },
  {
    prompt: "Quel royaume Ndiadiane Ndiaye a-t-il fondé, d'après la tradition ?",
    answer: "Djolof",
    wrong: ["Gabou", "Saloum"],
    hints: hints("Relis le nom du fondateur dans la question.", "Ce royaume n'est ni le Cayor ni le Baol.", "Son nom commence par la lettre D."),
  },
  {
    prompt: "D'après la tradition, quel royaume a pour fondateur Ndiadiane Ndiaye ?",
    answer: "Djolof",
    wrong: ["Fouta", "Sine"],
    hints: hints("Relis le nom du fondateur dans la question.", "Retiens ce nom avec celui du royaume.", "Son nom commence par la lettre D."),
  },
];

tag(FOUNDER_ROWS, () => "royaume:Djolof");

/** « Selon la tradition, Ndiadiane Ndiaye a fondé quel royaume ? » : le Djolof, parmi trois. */
export function makeCe2Founder(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-fondateur", "le fondateur du Djolof", FOUNDER_ROWS);
}

const WOLOF_GAP_HINTS = hints("Lis la phrase en entier.", "Quatre royaumes sont dans la phrase, un seul est caché.", "Le mot caché est celui qui manque à la liste des royaumes wolofs.");
const WOLOF_GAP_ROWS: readonly GapRow[] = [
  { text: "Le ___, le Cayor, le Baol et le Walo sont des royaumes wolofs.", answer: "Djolof", wrong: ["Sine", "Gabou"], hints: WOLOF_GAP_HINTS },
  { text: "Le Djolof, le ___, le Baol et le Walo sont des royaumes wolofs.", answer: "Cayor", wrong: ["Saloum", "Fouta"], hints: WOLOF_GAP_HINTS },
  { text: "Le Djolof, le Cayor, le ___ et le Walo sont des royaumes wolofs.", answer: "Baol", wrong: ["Sine", "Gabou"], hints: WOLOF_GAP_HINTS },
  { text: "Le Djolof, le Cayor, le Baol et le ___ sont des royaumes wolofs.", answer: "Walo", wrong: ["Saloum", "Fouta"], hints: WOLOF_GAP_HINTS },
];

tag(WOLOF_GAP_ROWS, (row) => `royaume:${row.answer}`);

/** « Le ___, le Cayor, le Baol et le Walo sont des royaumes wolofs. » : le royaume qui manque à la liste. */
export function makeCe2WolofGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-wolof-trou", "les royaumes wolofs", WOLOF_GAP_ROWS, 1, 1);
}

/** « Le Cayor, le Sine et le Walo sont cités. Combien sont des royaumes wolofs ? » : un nombre à écrire, de un à trois. */
export function makeCe2WolofCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-wolof-compte", () => {
    const total = ctx.level >= 3 ? 4 : 3;
    const count = randomInt(ctx.rng, 1, total - 1);
    const cited = shuffle(ctx.rng, [...shuffle(ctx.rng, WOLOF).slice(0, count), ...shuffle(ctx.rng, NOT_WOLOF).slice(0, total - count)]);
    return {
      type: "short-answer",
      prompt: `${cap(joinFrench(cited.map((kingdom) => the(kingdom.name))))} sont cités. Combien sont des royaumes wolofs ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(count)], game: originOf("ce2-wolof-compte", ctx), concept: "compter les royaumes wolofs d'une liste" },
      answerKey: String(count),
      hints: [
        "Lis les noms des royaumes, l'un après l'autre.",
        "Pour chaque nom, demande-toi si c'est un royaume wolof.",
        "Compte seulement les royaumes wolofs, avec le doigt, sans en oublier.",
      ],
    };
  });
}

/** Les glissés « wolof ou sérère » : deux royaumes de chaque peuple, ou trois wolofs et un sérère. */
const PEOPLE_SORT_ROWS: readonly SortRow[] = [
  ...combinations(WOLOF, 2).map(
    (wolof): SortRow => ({
      prompt: "Glisse chaque royaume sous son peuple, wolof ou sérère.",
      zones: ["Wolof", "Sérère"],
      items: [...wolof.map((k) => ({ text: k.name, zone: "Wolof" })), ...SERERE.map((k) => ({ text: k.name, zone: "Sérère" }))],
      hints: hints("Lis chaque royaume l'un après l'autre.", "Demande-toi à quel peuple il appartient.", "Les royaumes d'un même peuple vont dans la même case."),
    }),
  ),
  ...combinations(WOLOF, 3).flatMap((wolof) =>
    SERERE.map(
      (serere): SortRow => ({
        prompt: "Glisse chaque royaume sous son peuple, wolof ou sérère.",
        zones: ["Wolof", "Sérère"],
        items: [...wolof.map((k) => ({ text: k.name, zone: "Wolof" })), { text: serere.name, zone: "Sérère" }],
        hints: hints("Lis chaque royaume l'un après l'autre.", "Demande-toi à quel peuple il appartient.", "Un seul de ces royaumes n'a pas le même peuple que les autres."),
      }),
    ),
  ),
];

/** « Glisse chaque royaume sous son peuple, wolof ou sérère. » : le Djolof, le Cayor, le Baol, le Walo, le Sine, le Saloum. */
export function makeCe2PeopleSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-peuple-glisser", "les peuples des royaumes", PEOPLE_SORT_ROWS);
}

const peopleRow = (people: "wolof" | "sérère", answer: Kingdom, wrong: readonly Kingdom[]): QuestionRow => ({
  prompt: `Lequel de ces royaumes est un royaume ${people} ?`,
  fact: `royaume:${answer.name}`,
  answer: answer.name,
  wrong: wrong.map((k) => k.name),
  hints: hints("Pense aux peuples du Sénégal avant l'indépendance.", "Un seul de ces trois royaumes est un royaume de ce peuple.", people === "wolof" ? "Quatre royaumes seulement sont de ce peuple, retiens-les." : "Deux royaumes seulement sont de ce peuple, retiens-les."),
});
/**
 * Les lignes sont rangées par bonne réponse : la fenêtre d'un palier (un quart de la liste) ne porte alors que deux réponses, et les
 * quatre paliers posent quatre réponses différentes.
 */
const PEOPLE_ROWS: readonly QuestionRow[] = [
  ...WOLOF.flatMap((answer) => combinations(NOT_WOLOF, 2).map((wrong) => peopleRow("wolof", answer, wrong))),
  ...SERERE.flatMap((answer) =>
    combinations(
      KINGDOMS.filter((k) => k.people !== "sérère"),
      2,
    ).map((wrong) => peopleRow("sérère", answer, wrong)),
  ),
];

/** « Lequel de ces royaumes est un royaume wolof ? » (ou sérère) : un royaume du peuple, deux autres. */
export function makeCe2KingdomPeople(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-royaume-peuple", "le peuple d'un royaume", PEOPLE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 3);
}

// ---------------------------------------------------------------------------
// La place des royaumes sur la carte du Sénégal : au nord, au centre, au sud
// ---------------------------------------------------------------------------

const PLACE_HINTS: Record<Place, string> = {
  "Au nord": "Cherche tout en haut de la carte, au bord du grand fleuve.",
  "Au centre": "Cherche vers le milieu de la carte, ni en haut ni en bas.",
  "Au sud": "Cherche tout en bas de la carte, loin du grand fleuve.",
};

/** Ce que la question de place dit d'un royaume : son nom avec l'article, et son pluriel quand ce sont plusieurs royaumes. */
type PlaceSubject = { name: string; words: string; place: Place; plural?: boolean };
const subjectOf = (kingdom: Kingdom): PlaceSubject => ({ name: kingdom.name, words: the(kingdom.name), place: kingdom.place as Place });
const CASAMANCE: PlaceSubject = { name: "Casamance", words: "les royaumes de Casamance", place: "Au sud", plural: true };

/** Deux façons de poser la question de la place d'un royaume, les royaumes alternant au nord, au centre et au sud d'une ligne à l'autre. */
function placeRows(subjects: readonly PlaceSubject[]): QuestionRow[] {
  return [0, 1].flatMap((form) =>
    subjects.map(
      (subject): QuestionRow => ({
        prompt:
          form === 0
            ? `Où ${subject.plural ? "se placent" : "se place"} ${subject.words} sur la carte du Sénégal ?`
            : `Dans quelle partie du pays ${subject.plural ? "se trouvaient" : "se trouvait"} ${subject.words} ?`,
        fact: `royaume:${subject.name}`,
        answer: subject.place,
        wrong: PLACES.filter((place) => place !== subject.place),
        hints: hints("Imagine la carte du Sénégal posée devant toi.", "Le haut de la carte, le milieu et le bas ne sont pas au même endroit.", PLACE_HINTS[subject.place]),
      }),
    ),
  );
}

const WOLOF_PLACE_ROWS = placeRows([subjectOf(named("Walo")), subjectOf(named("Baol"))]);
const OTHER_PLACE_ROWS = placeRows([subjectOf(named("Sine")), subjectOf(named("Tékrour")), subjectOf(named("Gabou")), subjectOf(named("Saloum")), subjectOf(named("Fouta")), CASAMANCE]);

/** « Où se place le Walo sur la carte du Sénégal ? » : au nord, au centre ou au sud, pour le Walo et le Baol. */
export function makeCe2WolofPlace(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-wolof-place", "la place d'un royaume wolof sur la carte", WOLOF_PLACE_ROWS, 1, undefined, 2);
}

/** « Où se place le Sine sur la carte du Sénégal ? » : au nord, au centre ou au sud, pour les autres royaumes. */
export function makeCe2KingdomPlace(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-royaume-place", "la place d'un royaume sur la carte", OTHER_PLACE_ROWS, 2, undefined, 2);
}

/** « Lequel de ces royaumes est le plus au nord ? » : un royaume du nord, un du centre, un du sud. */
function northSouthRows(trios: readonly (readonly [Kingdom, Kingdom, Kingdom])[]): QuestionRow[] {
  return trios.flatMap((trio) => [
    {
      prompt: "Lequel de ces royaumes est le plus au nord ?",
      answer: trio[0].name,
      wrong: [trio[1].name, trio[2].name],
      hints: hints("Imagine la carte du Sénégal posée devant toi.", "Compare la place de chaque royaume, de haut en bas.", "Cherche celui qui est le plus haut sur la carte."),
    },
    {
      prompt: "Lequel de ces royaumes est le plus au sud ?",
      answer: trio[2].name,
      wrong: [trio[0].name, trio[1].name],
      hints: hints("Imagine la carte du Sénégal posée devant toi.", "Compare la place de chaque royaume, de haut en bas.", "Cherche celui qui est le plus bas sur la carte."),
    },
  ]);
}

const isWolofTrio = (trio: readonly Kingdom[]) => trio.some((kingdom) => kingdom.name === "Walo" || kingdom.name === "Baol");
const WOLOF_NORTH_SOUTH_ROWS = northSouthRows(TRIOS.filter(isWolofTrio));
const OTHER_NORTH_SOUTH_ROWS = northSouthRows(TRIOS.filter((trio) => !isWolofTrio(trio)));

/** « Lequel de ces royaumes est le plus au nord ? » avec le Walo ou le Baol parmi les trois. */
export function makeCe2WolofNorthSouth(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-wolof-nord-sud", "le royaume le plus au nord ou au sud", WOLOF_NORTH_SOUTH_ROWS);
}

/** « Lequel de ces royaumes est le plus au nord ? » avec trois autres royaumes. */
export function makeCe2KingdomNorthSouth(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-royaume-nord-sud", "le royaume le plus au nord ou au sud", OTHER_NORTH_SOUTH_ROWS);
}

/** « Relie chaque royaume à sa place sur la carte. » : un royaume du nord, un du centre, un du sud. */
const PLACE_LINK_ROWS: readonly LinkRow[] = TRIOS.map(
  (trio): LinkRow => ({
    prompt: "Relie chaque royaume à sa place sur la carte du Sénégal.",
    pairs: trio.map((kingdom) => ({ left: kingdom.name, right: kingdom.place as string })),
    hints: hints("Imagine la carte du Sénégal posée devant toi.", "Un royaume est en haut, un autre au milieu et le dernier en bas.", "Commence par le royaume dont tu connais la place."),
  }),
);

export function makeCe2PlaceLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-place-relier", "relier un royaume à sa place sur la carte", PLACE_LINK_ROWS);
}

/** Les ordres « du nord au sud » : les trois royaumes d'un trio, dans un sens ou dans l'autre. */
const NORTH_SOUTH_ORDER_ROWS: readonly OrderRow[] = TRIOS.flatMap((trio) => [
  {
    prompt: "Mets ces trois royaumes dans l'ordre, du nord au sud.",
    sequence: trio.map((kingdom) => kingdom.name),
    hints: hints("Regarde où chaque royaume se place sur la carte.", "Le haut de la carte est le côté du grand fleuve.", "Commence par le royaume le plus haut sur la carte."),
  },
  {
    prompt: "Mets ces trois royaumes dans l'ordre, du sud au nord.",
    sequence: [...trio].reverse().map((kingdom) => kingdom.name),
    hints: hints("Regarde où chaque royaume se place sur la carte.", "Le haut de la carte est le côté du grand fleuve.", "Commence par le royaume le plus bas sur la carte."),
  },
]);

export function makeCe2KingdomOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-royaume-ordre", "ranger des royaumes du nord au sud", NORTH_SOUTH_ORDER_ROWS);
}

// ---------------------------------------------------------------------------
// Le Sine, le Saloum, la vallée du fleuve, un roi, des conseillers, des villages
// ---------------------------------------------------------------------------

const VALLEY_HINTS = hints("Pense au grand fleuve qui coule au bord du pays.", "Les royaumes de la vallée étaient les voisins du fleuve.", "Les autres royaumes de la liste étaient loin de l'eau du fleuve.");
const VALLEY_ROWS: readonly QuestionRow[] = [
  { prompt: "Quel royaume se trouvait dans la vallée du fleuve Sénégal ?", answer: "Fouta", wrong: ["Sine", "Gabou"], hints: VALLEY_HINTS },
  { prompt: "Quel royaume se trouvait dans la vallée du fleuve Sénégal ?", answer: "Tékrour", wrong: ["Saloum", "Gabou"], hints: VALLEY_HINTS },
  { prompt: "Lequel de ces royaumes était installé le long du fleuve Sénégal ?", answer: "Fouta", wrong: ["Saloum", "Sine"], hints: VALLEY_HINTS },
  { prompt: "Lequel de ces royaumes était installé le long du fleuve Sénégal ?", answer: "Tékrour", wrong: ["Sine", "Gabou"], hints: VALLEY_HINTS },
];

tag(VALLEY_ROWS, (row) => `royaume:${row.answer}`);

/** « Quel royaume se trouvait dans la vallée du fleuve Sénégal ? » : le Tékrour ou le Fouta, parmi trois. */
export function makeCe2Valley(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-vallee", "les royaumes de la vallée du fleuve", VALLEY_ROWS);
}

const SERERE_HINTS = hints("Lis la phrase en entier.", "Ces deux royaumes sont voisins et leur peuple est le même.", "Le mot caché est le nom de l'autre royaume, ou celui de leur peuple.");
const SERERE_GAP_ROWS: readonly GapRow[] = [
  { text: "Le Sine et le ___ sont les deux royaumes sérères.", answer: "Saloum", wrong: ["Walo", "Gabou"], hints: SERERE_HINTS },
  { text: "Le ___ et le Saloum sont les deux royaumes sérères.", answer: "Sine", wrong: ["Fouta", "Cayor"], hints: SERERE_HINTS },
  { text: "Le Saloum est un royaume ___.", answer: "sérère", wrong: ["wolof", "mandingue"], hints: SERERE_HINTS },
  { text: "Le Sine est un royaume ___.", answer: "sérère", wrong: ["wolof", "peul"], hints: SERERE_HINTS },
];

tag(SERERE_GAP_ROWS, (_, index) => `royaume:${index % 2 === 0 ? "Saloum" : "Sine"}`);

/** « Le Sine et le ___ sont les deux royaumes sérères. » : le royaume qui manque, ou le peuple. */
export function makeCe2SerereGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-serere-trou", "les royaumes sérères", SERERE_GAP_ROWS, 1, 1);
}

/** Les glissés « au nord ou au centre » : deux royaumes de chaque partie. */
const AREA_SORT_ROWS: readonly SortRow[] = combinations(NORTH, 2).flatMap((north) =>
  combinations(CENTRE, 2).map(
    (centre): SortRow => ({
      prompt: "Glisse chaque royaume sous sa place sur la carte, au nord ou au centre.",
      zones: ["Nord", "Centre"],
      items: [...north.map((k) => ({ text: k.name, zone: "Nord" })), ...centre.map((k) => ({ text: k.name, zone: "Centre" }))],
      hints: hints("Imagine la carte du Sénégal posée devant toi.", "Les royaumes du haut de la carte sont près du grand fleuve.", "Ceux du milieu sont loin du fleuve."),
    }),
  ),
);

export function makeCe2AreaSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-royaume-glisser", "classer des royaumes selon leur place", AREA_SORT_ROWS);
}

const ROLE_ROWS: readonly QuestionRow[] = [
  {
    prompt: "Qui commandait tout le royaume ?",
    answer: "Roi",
    wrong: ["Conseillers", "Villages"],
    hints: hints("Pense à celui qui avait le plus de pouvoir.", "Il portait un titre qui change selon le royaume.", "Les autres choix l'aidaient ou vivaient sous son autorité."),
  },
  {
    prompt: "Qui aidait le roi à prendre ses décisions ?",
    answer: "Conseillers",
    wrong: ["Villages", "Champs"],
    hints: hints("Pense à ceux qui donnent leur avis avant une décision.", "Ce sont des personnes, pas des lieux.", "Ils restent près du roi pour l'éclairer."),
  },
  {
    prompt: "Où vivaient les habitants du royaume ?",
    answer: "Dans les villages",
    wrong: ["Sur les bateaux", "Dans le palais"],
    hints: hints("Pense à l'endroit où vivent les familles.", "Un royaume en comptait beaucoup, répartis sur ses terres.", "Le roi, lui, vivait à part, près de ses conseillers."),
  },
  {
    prompt: "Que formaient les villages réunis sous l'autorité du roi ?",
    answer: "Royaume",
    wrong: ["Conseil", "Famille"],
    hints: hints("Pense à ce que forment plusieurs villages et leur roi.", "C'est le nom du pays que dirige un roi.", "Les autres choix sont beaucoup trop petits."),
  },
  {
    prompt: "Comment appelle-t-on les personnes qui conseillent le roi ?",
    answer: "Conseillers",
    wrong: ["Paysans", "Voyageurs"],
    hints: hints("Pense à ce qu'elles font auprès du roi.", "Le nom de ces personnes vient de leur travail.", "Elles donnent leur avis, elles ne cultivent pas les champs."),
  },
];

tag(ROLE_ROWS, (_, index) => `role:${["roi", "conseillers", "villages", "villages", "conseillers"][index]}`);

/** « Qui aidait le roi à prendre ses décisions ? » : le roi, les conseillers, les villages. */
export function makeCe2RoleQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-role-qcm", "le roi, les conseillers et les villages", ROLE_ROWS);
}

const ROLE_GAP_HINTS = hints("Lis la phrase en entier.", "Pense à celui qui règne, à ceux qui conseillent et à l'endroit où l'on vit.", "Le mot caché complète le sens de toute la phrase.");
const ROLE_GAP_ROWS: readonly GapRow[] = [
  { text: "Le roi est aidé par ses ___ pour décider.", answer: "conseillers", wrong: ["cousins", "voyageurs"], hints: ROLE_GAP_HINTS },
  { text: "Un royaume est fait de plusieurs ___ réunis sous le roi.", answer: "villages", wrong: ["rivières", "bateaux"], hints: ROLE_GAP_HINTS },
  { text: "Dans un royaume, c'est le ___ qui commande.", answer: "roi", wrong: ["puits", "voyageur"], hints: ROLE_GAP_HINTS },
  { text: "Avant une grande décision, le roi écoute ses ___.", answer: "conseillers", wrong: ["chèvres", "maisons"], hints: ROLE_GAP_HINTS },
  { text: "Les paysans vivent dans les ___ du royaume.", answer: "villages", wrong: ["nuages", "palais"], hints: ROLE_GAP_HINTS },
  { text: "Le ___ choisit avec l'aide de ses conseillers.", answer: "roi", wrong: ["champ", "marché"], hints: ROLE_GAP_HINTS },
];

tag(ROLE_GAP_ROWS, (_, index) => `role:${["conseillers", "villages", "roi", "conseillers", "villages", "roi"][index]}`);

/** « Le roi est aidé par ses ___ pour décider. » : le roi, les conseillers ou les villages. */
export function makeCe2RoleGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-role-trou", "le roi, les conseillers et les villages", ROLE_GAP_ROWS);
}

const ROLE_LINK_HINTS = hints("Lis chaque mot de la colonne de gauche.", "Pense à celui qui règne, à ceux qui conseillent et à l'endroit où l'on vit.", "Commence par le mot le plus facile.");
const ROLE_LINK_ROWS: readonly LinkRow[] = [
  [
    ["Roi", "Il commande le royaume"],
    ["Conseillers", "Ils aident le roi à décider"],
    ["Villages", "Les habitants y vivent"],
  ],
  [
    ["Roi", "Il dirige tout le pays"],
    ["Conseillers", "Ils donnent leur avis au roi"],
    ["Villages", "Ils réunissent les familles"],
  ],
  [
    ["Roi", "Il porte un titre"],
    ["Conseillers", "Ils restent près du roi"],
    ["Villages", "Ils forment le royaume"],
  ],
  [
    ["Roi", "Il décide en dernier"],
    ["Conseillers", "Ils préparent ses choix"],
    ["Villages", "Les paysans y habitent"],
  ],
].map((pairs): LinkRow => ({ prompt: "Relie chaque mot à ce qu'il veut dire.", pairs: pairs.map(([left, right]) => ({ left, right })), hints: ROLE_LINK_HINTS }));

export function makeCe2RoleLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-role-relier", "relier le roi, les conseillers et les villages à leur rôle", ROLE_LINK_ROWS);
}

// ---------------------------------------------------------------------------
// Les rois et leurs titres
// ---------------------------------------------------------------------------

const TITLE_HINTS = hints("Pense au royaume dont la question parle.", "Chaque royaume a donné un titre à son roi.", "Retiens chaque titre avec le nom de son royaume.");

/** Deux autres titres que celui du royaume : de quoi faire de mauvais choix. */
const otherTitles = (title: string, shift: number): string[] => {
  const others = TITLES.filter((candidate) => candidate !== title);
  return [others[shift % others.length], others[(shift + 2) % others.length]];
};

/** Deux autres royaumes que celui du titre, qui n'ont pas ce titre. */
const otherKingdoms = (title: string, shift: number): string[] => {
  const others = TITLED.filter((kingdom) => kingdom.title !== title);
  return [others[shift % others.length].name, others[(shift + 3) % others.length].name];
};

/** Les lignes se suivent royaume par royaume (les deux formes de la question d'un royaume côte à côte) : les gabarits qui posent le titre d'un royaume, rangés dans le même ordre, se décalent d'un quart. */
const TITLE_QUESTION_ROWS: readonly QuestionRow[] = TITLED.flatMap((kingdom, i): QuestionRow[] => [
  {
    prompt: `Quel est le titre du roi du ${kingdom.name} ?`,
    fact: `royaume:${kingdom.name}`,
    answer: kingdom.title as string,
    wrong: otherTitles(kingdom.title as string, i),
    hints: TITLE_HINTS,
  },
  ...(kingdom.title === "Bour"
    ? []
    : [
        {
          prompt: `Quel royaume avait un roi appelé ${kingdom.title} ?`,
          fact: `royaume:${kingdom.name}`,
          answer: kingdom.name,
          wrong: otherKingdoms(kingdom.title as string, i),
          hints: TITLE_HINTS,
        },
      ]),
  ...(kingdom.name === "Saloum"
    ? [
        {
          prompt: "Au Sine comme au Saloum, quel est le titre du roi ?",
          fact: "royaume:Saloum",
          answer: "Bour",
          wrong: otherTitles("Bour", 1),
          hints: TITLE_HINTS,
        },
      ]
    : []),
]);

/** « Quel est le titre du roi du Walo ? » (ou le royaume d'un titre) : un titre, parmi trois. */
export function makeCe2TitleQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-titre-qcm", "le titre du roi d'un royaume", TITLE_QUESTION_ROWS, 2);
}

const TITLE_GAP_HINTS = hints("Lis la phrase en entier.", "Pense au titre du roi de ce royaume.", "Rappelle-toi la liste des royaumes et de leurs titres.");
const TITLE_GAP_ROWS: readonly GapRow[] = TITLED.flatMap((kingdom, i): GapRow[] => [
  {
    text: `Au ${kingdom.name}, le roi porte le titre de ___.`,
    fact: `royaume:${kingdom.name}`,
    answer: kingdom.title as string,
    wrong: otherTitles(kingdom.title as string, i),
    hints: TITLE_GAP_HINTS,
  },
  ...(kingdom.title === "Bour"
    ? []
    : [
        {
          // « de » s'élide devant une voyelle : « Le titre d'Almamy », « Le titre de Damel ».
          text: `Le titre ${/^[aeiouyàâéèêëîïôûùh]/iu.test(kingdom.title as string) ? "d'" : "de "}${kingdom.title} était celui du roi du ___.`,
          fact: `royaume:${kingdom.name}`,
          answer: kingdom.name,
          wrong: otherKingdoms(kingdom.title as string, i),
          hints: TITLE_GAP_HINTS,
        },
      ]),
]);

/** « Au Walo, le roi porte le titre de ___. » : le titre, ou le royaume du titre. */
export function makeCe2TitleGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-titre-trou", "le titre du roi d'un royaume", TITLE_GAP_ROWS, 2, 1);
}

/** Les royaumes qui ont chacun un titre à eux, le Sine représentant le Sine et le Saloum. */
const DISTINCT_TITLED = TITLED.filter((kingdom) => kingdom.name !== "Saloum");
const TITLE_LINK_ROWS: readonly LinkRow[] = combinations(DISTINCT_TITLED, 3).map(
  (trio): LinkRow => ({
    prompt: "Relie chaque royaume au titre de son roi.",
    pairs: trio.map((kingdom) => ({ left: kingdom.name, right: kingdom.title as string })),
    hints: hints("Lis les noms des royaumes à gauche.", "Chaque roi portait un titre différent dans ces royaumes.", "Commence par le titre que tu connais le mieux."),
  }),
);

export function makeCe2TitleLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-titre-relier", "relier un royaume au titre de son roi", TITLE_LINK_ROWS, 2);
}

/** Les glissés de titres : trois titres wolofs et le Bour, ou deux titres du nord et deux du centre. */
const TITLE_SORT_ROWS: readonly SortRow[] = [
  ...combinations(WOLOF, 3).map(
    (wolof): SortRow => ({
      prompt: "Glisse chaque titre sous le peuple dont le roi le portait.",
      zones: ["Wolof", "Sérère"],
      items: [...wolof.map((k) => ({ text: k.title as string, zone: "Wolof" })), { text: "Bour", zone: "Sérère" }],
      hints: hints("Pense au royaume où chaque titre était porté.", "Chaque case reçoit les titres d'un même peuple.", "Un seul de ces titres est celui d'un autre peuple que les autres."),
    }),
  ),
  {
    prompt: "Glisse chaque titre sous la place de son royaume, au nord ou au centre.",
    zones: ["Nord", "Centre"],
    items: [
      { text: "Brak", zone: "Nord" },
      { text: "Almamy", zone: "Nord" },
      { text: "Teigne", zone: "Centre" },
      { text: "Bour", zone: "Centre" },
    ],
    hints: hints("Pense au royaume où chaque titre était porté.", "Imagine la carte du Sénégal posée devant toi.", "Les royaumes du haut de la carte sont près du grand fleuve."),
  },
];

export function makeCe2TitleSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-titre-glisser", "classer des titres de rois", TITLE_SORT_ROWS);
}

const TITLE_WRITE_ROWS: readonly WriteRow[] = TITLED.map(
  (kingdom): WriteRow => ({
    prompt: `Écris le titre du roi du ${kingdom.name}.`,
    fact: `royaume:${kingdom.name}`,
    accepted: [kingdom.title as string, kingdom.title === "Almamy" ? "l'Almamy" : `le ${kingdom.title}`, `un ${kingdom.title}`],
    hints: hints("Pense au royaume dont la question parle.", "Chaque royaume avait un titre pour son roi.", `Le titre commence par la lettre ${(kingdom.title as string)[0]}.`),
  }),
);

/** « Écris le titre du roi du Cayor. » : un titre à écrire, un des sept. */
export function makeCe2TitleWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-titre-ecrire", "écrire le titre du roi d'un royaume", TITLE_WRITE_ROWS, 2, 2);
}

/** Les trios dont chaque royaume a un titre : le roi de chaque royaume, dans l'ordre du nord au sud. */
const TITLE_ORDER_ROWS: readonly OrderRow[] = TRIOS.filter((trio) => trio.every((kingdom) => kingdom.title)).flatMap((trio) => {
  const titles = trio.map((kingdom) => kingdom.title as string);
  const clauses = trio.map((kingdom, i) => `${kingdom.title === "Almamy" ? "l'Almamy" : `le ${kingdom.title}`}${i === 0 ? " règne" : ""} au ${kingdom.name}`);
  const sentence = `${cap(joinFrench(clauses))}.`;
  return [
    {
      prompt: `${sentence} Range ces titres du nord au sud.`,
      sequence: titles,
      hints: hints("Lis à quel royaume chaque titre appartient.", "Cherche ensuite la place de chaque royaume sur la carte.", "Commence par celui dont le royaume est le plus haut sur la carte."),
    },
    {
      prompt: `${sentence} Range ces titres du sud au nord.`,
      sequence: [...titles].reverse(),
      hints: hints("Lis à quel royaume chaque titre appartient.", "Cherche ensuite la place de chaque royaume sur la carte.", "Commence par celui dont le royaume est le plus bas sur la carte."),
    },
  ];
});

export function makeCe2TitleOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-titre-ordre", "ranger des titres de rois du nord au sud", TITLE_ORDER_ROWS);
}

// ===========================================================================
// HIER ET AUJOURD'HUI : LE PROGRÈS
// ===========================================================================

/**
 * Les besoins et les moyens, du plus ancien au plus récent. La fiche donne quatre besoins : se déplacer, s'éclairer, donner des
 * nouvelles, cuisiner. Le train n'est pas rangé avec le car rapide, dont l'ordre dans le temps se discute.
 */
type Need = { need: string; zone: string; ladder: readonly string[] };
const NEEDS: readonly Need[] = [
  { need: "s'éclairer", zone: "S'éclairer", ladder: ["Lampe à pétrole", "Lampe électrique"] },
  { need: "donner des nouvelles", zone: "Donner des nouvelles", ladder: ["Lettre", "Téléphone fixe", "Téléphone portable"] },
  { need: "cuisiner", zone: "Cuisiner", ladder: ["Feu de bois", "Cuisinière à gaz"] },
  { need: "se déplacer", zone: "Se déplacer", ladder: ["À pied", "Charrette", "Car rapide"] },
];

/** Le moyen dit avec son article dans une phrase, et dit comme un choix de QCM (un nom nu : la règle des tuiles d'une classe qui ne lit pas encore). */
const WITH_ARTICLE: Record<string, string> = {
  "Lampe à pétrole": "la lampe à pétrole",
  "Lampe électrique": "la lampe électrique",
  Lettre: "la lettre",
  "Téléphone fixe": "le téléphone fixe",
  "Téléphone portable": "le téléphone portable",
  "Feu de bois": "le feu de bois",
  "Cuisinière à gaz": "la cuisinière à gaz",
  "À pied": "la marche à pied",
  Charrette: "la charrette",
  "Car rapide": "le car rapide",
};
const CHOICE: Record<string, string> = {
  "Lampe à pétrole": "Lampe à pétrole",
  "Lampe électrique": "Lampe électrique",
  Lettre: "Lettre",
  "Téléphone fixe": "Téléphone fixe",
  "Téléphone portable": "Téléphone portable",
  "Feu de bois": "Feu de bois",
  "Cuisinière à gaz": "Cuisinière à gaz",
  "À pied": "Aller à pied",
  Charrette: "Charrette",
  "Car rapide": "Car rapide",
};

const COMPARE_HINTS = hints("Lis bien le besoin dont parle la question.", "Pense à ce qu'on utilisait avant et à ce qu'on utilise maintenant.", "Élimine d'abord ce qui ne sert pas au même besoin.");

/** Deux moyens d'AUTRES besoins : de mauvais choix qui ne servent pas au besoin de la question. */
const elsewhere = (need: Need, shift: number): string[] => {
  const pool = NEEDS.filter((other) => other !== need).flatMap((other) => other.ladder);
  return [CHOICE[pool[shift % pool.length]], CHOICE[pool[(shift + 3) % pool.length]]];
};

/** « Pour donner des nouvelles, lequel est plus récent que la lettre ? » : un moyen du besoin, deux moyens d'autres besoins. */
const COMPARE_ROWS: readonly QuestionRow[] = NEEDS.flatMap((need, n) =>
  need.ladder.flatMap((first, i) =>
    need.ladder.slice(i + 1).flatMap((later, j): QuestionRow[] => [
      { prompt: `Pour ${need.need}, lequel est plus récent que ${WITH_ARTICLE[first]} ?`, fact: `besoin:${need.need}`, answer: CHOICE[later], wrong: elsewhere(need, n + i + j), hints: COMPARE_HINTS },
      { prompt: `Pour ${need.need}, lequel est plus ancien que ${WITH_ARTICLE[later]} ?`, fact: `besoin:${need.need}`, answer: CHOICE[first], wrong: elsewhere(need, n + i + j + 1), hints: COMPARE_HINTS },
    ]),
  ),
);

/** « Pour s'éclairer, lequel est plus récent que la lampe à pétrole ? » : un moyen plus récent ou plus ancien. */
export function makeCe2Compare(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-progres-compare", "comparer deux moyens dans le temps", COMPARE_ROWS, 2);
}

const SUPERLATIVE_ROWS: readonly QuestionRow[] = NEEDS.filter((need) => need.ladder.length === 3).flatMap((need) => [
  {
    prompt: `Pour ${need.need}, lequel est le plus récent ?`,
    fact: `besoin:${need.need}`,
    answer: CHOICE[need.ladder[2]],
    wrong: [CHOICE[need.ladder[0]], CHOICE[need.ladder[1]]],
    hints: hints("Lis bien le besoin dont parle la question.", "Compare les trois moyens, du plus ancien au plus récent.", "Cherche celui qui est arrivé en dernier."),
  },
  {
    prompt: `Pour ${need.need}, lequel est le plus ancien ?`,
    fact: `besoin:${need.need}`,
    answer: CHOICE[need.ladder[0]],
    wrong: [CHOICE[need.ladder[1]], CHOICE[need.ladder[2]]],
    hints: hints("Lis bien le besoin dont parle la question.", "Compare les trois moyens, du plus ancien au plus récent.", "Cherche celui qui est arrivé en premier."),
  },
]);

/** « Pour se déplacer, lequel est le plus récent ? » : le premier ou le dernier d'une échelle de trois moyens. */
export function makeCe2Superlative(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-progres-rang", "trouver le plus ancien ou le plus récent", SUPERLATIVE_ROWS);
}

const PROGRESS_ORDER_ROWS: readonly OrderRow[] = NEEDS.filter((need) => need.ladder.length === 3).flatMap((need) => [
  {
    prompt: `Pour ${need.need}, mets ces moyens du plus ancien au plus récent.`,
    fact: `besoin:${need.need}`,
    sequence: [...need.ladder],
    hints: hints("Pense à ce qui existait avant tout le reste.", "Chaque moyen est arrivé après le précédent.", "Commence par celui qu'on utilisait le plus tôt."),
  },
  {
    prompt: `Pour ${need.need}, mets ces moyens du plus récent au plus ancien.`,
    fact: `besoin:${need.need}`,
    sequence: [...need.ladder].reverse(),
    hints: hints("Pense à ce qu'on utilise aujourd'hui.", "Chaque moyen est arrivé après le précédent.", "Commence par celui qui est arrivé en dernier."),
  },
]);

export function makeCe2ProgressOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-progres-ordre", "ranger des moyens dans l'ordre du temps", PROGRESS_ORDER_ROWS);
}

/** Les glissés « à quel besoin sert ce moyen » : deux besoins, deux moyens de chacun. */
const NEED_ITEMS: Record<string, readonly (readonly string[])[]> = {
  "S'éclairer": [["Lampe à pétrole", "Lampe électrique"]],
  "Donner des nouvelles": [
    ["Lettre", "Téléphone portable"],
    ["Téléphone fixe", "Lettre"],
  ],
  Cuisiner: [["Feu de bois", "Cuisinière à gaz"]],
  "Se déplacer": [
    ["Charrette", "Car rapide"],
    ["À pied", "Car rapide"],
  ],
};
const NEED_SORT_ROWS: readonly SortRow[] = uniqueBy(
  combinations(NEEDS, 2).flatMap(([first, second]) =>
    [0, 1].map((variant): SortRow => {
      const choose = (need: Need) => NEED_ITEMS[need.zone][variant % NEED_ITEMS[need.zone].length];
      return {
        prompt: "Glisse chaque moyen sous le besoin qu'il sert.",
        zones: [first.zone, second.zone],
        items: [...choose(first).map((text) => ({ text, zone: first.zone })), ...choose(second).map((text) => ({ text, zone: second.zone }))],
        hints: hints("Lis chaque moyen l'un après l'autre.", "Demande-toi à quoi sert chaque moyen.", "Les moyens qui rendent le même service vont ensemble."),
      };
    }),
  ),
  (row) => row.items.map((item) => item.text).sort().join(","),
);

export function makeCe2NeedSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-progres-glisser", "classer des moyens selon leur besoin", NEED_SORT_ROWS);
}

const OLDEST_ROWS: readonly LinkRow[] = combinations(NEEDS, 3).map(
  (needs): LinkRow => ({
    prompt: "Relie chaque besoin au moyen le plus ancien.",
    pairs: needs.map((need) => ({ left: need.zone, right: need.ladder[0] })),
    hints: hints("Lis chaque besoin à gauche.", "Pour chaque besoin, pense à ce qui existait avant tout le reste.", "Commence par le besoin le plus facile."),
  }),
);
const NEWEST_ROW: LinkRow = {
  prompt: "Relie chaque besoin au moyen le plus récent.",
  pairs: NEEDS.filter((need) => need.need !== "se déplacer").map((need) => ({ left: need.zone, right: need.ladder[need.ladder.length - 1] })),
  hints: hints("Lis chaque besoin à gauche.", "Pour chaque besoin, pense à ce qu'on utilise aujourd'hui.", "Commence par le besoin le plus facile."),
};

export function makeCe2ProgressLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-progres-relier", "relier un besoin à son moyen le plus ancien ou le plus récent", [...OLDEST_ROWS, NEWEST_ROW]);
}

const PROGRESS_GAP_HINTS = hints("Lis la phrase en entier.", "Pense à l'objet dont la phrase parle.", "Un seul des trois mots a un sens dans cette phrase.");
const PROGRESS_GAP_ROWS: readonly GapRow[] = [
  { text: "Avant la lampe électrique, on s'éclairait avec une lampe à ___.", answer: "pétrole", wrong: ["eau", "sable"], hints: PROGRESS_GAP_HINTS },
  { text: "Avant le téléphone, on envoyait des nouvelles avec une ___.", answer: "lettre", wrong: ["charrette", "lampe"], hints: PROGRESS_GAP_HINTS },
  { text: "Le téléphone ___ se met dans la poche et se porte partout.", answer: "portable", wrong: ["fixe", "mural"], hints: PROGRESS_GAP_HINTS },
  { text: "Autrefois, on faisait cuire le riz sur un feu de ___.", answer: "bois", wrong: ["sable", "verre"], hints: PROGRESS_GAP_HINTS },
  { text: "La ___ est tirée par un animal sur la route.", answer: "charrette", wrong: ["lampe", "lettre"], hints: PROGRESS_GAP_HINTS },
  { text: "Le ___ roule sur des rails.", answer: "train", wrong: ["car rapide", "feu"], hints: PROGRESS_GAP_HINTS },
  { text: "Pour écrire une lettre, on utilise un stylo et du ___.", answer: "papier", wrong: ["sable", "feu"], hints: PROGRESS_GAP_HINTS },
  { text: "Le ___ permet de donner des nouvelles en quelques secondes.", answer: "téléphone", wrong: ["puits", "cheval"], hints: PROGRESS_GAP_HINTS },
];

tag(PROGRESS_GAP_ROWS, (row) => `mot:${row.answer}`);

export function makeCe2ProgressGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-progres-trou", "compléter une phrase sur le progrès", PROGRESS_GAP_ROWS, 2);
}

const PROGRESS_WRITE_ROWS: readonly WriteRow[] = [
  { prompt: "Avant l'électricité, une lampe brûlait du ___. Écris le mot.", accepted: ["pétrole", "petrole"], hints: hints("Lis bien la phrase.", "On remplissait la lampe de ce liquide.", "Le mot commence par P.") },
  { prompt: "Un téléphone à emporter partout est un téléphone ___. Écris le mot.", accepted: ["portable"], hints: hints("Lis bien la phrase.", "On peut l'emporter partout avec soi.", "Le mot commence par P.") },
  { prompt: "Un message écrit sur du papier et glissé dans une enveloppe est une ___. Écris le mot.", accepted: ["lettre", "une lettre"], hints: hints("Lis bien la phrase.", "On la glisse dans une enveloppe.", "Le mot commence par L.") },
  { prompt: "Pour cuire le riz sans gaz, on allume un feu avec du ___. Écris le mot.", accepted: ["bois"], hints: hints("Lis bien la phrase.", "On le ramasse dans la brousse.", "Le mot commence par B.") },
  { prompt: "Pour aller loin sur la route, on prend un car ___. Écris le mot.", accepted: ["rapide"], hints: hints("Lis bien la phrase.", "Ce car est peint de couleurs vives.", "Le mot commence par R.") },
  { prompt: "Une lampe qui marche avec le courant est une lampe ___. Écris le mot.", accepted: ["électrique", "electrique"], hints: hints("Lis bien la phrase.", "Elle s'allume en appuyant sur un bouton.", "Le mot commence par E.") },
  { prompt: "Pour cuisiner sans feu de bois, on peut utiliser une cuisinière à ___. Écris le mot.", accepted: ["gaz"], hints: hints("Lis bien la phrase.", "On le trouve dans une bouteille.", "Le mot commence par G.") },
  { prompt: "Cette voiture à deux roues, tirée par un cheval ou un âne, s'appelle une ___. Écris le mot.", accepted: ["charrette", "une charrette"], hints: hints("Lis bien la phrase.", "Elle a deux grandes roues.", "Le mot commence par C.") },
];

tag(PROGRESS_WRITE_ROWS, (row) => `mot:${row.accepted[0]}`);

export function makeCe2ProgressWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-progres-ecrire", "écrire le mot d'un moyen d'hier ou d'aujourd'hui", PROGRESS_WRITE_ROWS, 2);
}
