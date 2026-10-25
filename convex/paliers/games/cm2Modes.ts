/**
 * LES GABARITS DU CONDITIONNEL ET DU SUBJONCTIF DU CM2 (`fr-cm2-modes`).
 *
 * La fiche demande les quatre modes (indicatif, impératif, conditionnel, subjonctif), le conditionnel présent et le subjonctif présent des verbes usuels (être,
 * avoir, aller, faire, finir, prendre), et le subjonctif après « il faut que » et « pour que ». Ici chaque exercice est BÂTI à partir d'un tableau fermé de
 * quinze verbes, jamais écrit par le modèle : le conditionnel se déduit du futur (le radical du futur, les terminaisons de l'imparfait), le subjonctif est écrit
 * une fois pour chaque verbe, et un mauvais choix est une forme que le mot qui précède interdit.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Au singulier, le subjonctif présent des verbes en -er s'écrit comme l'indicatif présent (« que tu chantes », « tu chantes »). Un mauvais choix n'est donc jamais
 *   l'indicatif présent quand il s'écrit comme la bonne réponse : le futur ou le conditionnel le remplace.
 * - Après « si » à l'imparfait, un conditionnel est attendu. Le mauvais choix « si + imparfait, imparfait » (« si le temps était beau, nous chantions ») se lit aussi
 *   comme une habitude (« chaque fois que ») : il ne se propose jamais. Les mauvais choix sont le présent, le futur, ou « si » suivi d'un conditionnel.
 * - Le mode se demande pour un verbe NOMMÉ dans la phrase (« le verbe « finisses » »), jamais « le verbe de la phrase » : une phrase en a souvent deux.
 * - Le verbe « pouvoir » n'a pas d'impératif : il n'est jamais posé à l'impératif.
 * - Un sujet à la première personne devant une voyelle s'écrit « j' » (« j'irais », « que j'aie »), et « que » devant « il » et « ils » s'écrit « qu' » : une phrase n'a
 *   donc jamais plus d'une apostrophe, parce que les noms de personnes commencent par une consonne.
 *
 * HORS FICHE, À FAIRE RELIRE : les neuf verbes en plus des six de la fiche (chanter, jouer, manger, choisir, venir, pouvoir, voir, dire, savoir), « papa répète pour que » et
 * « maman prépare le repas pour que » comme phrases d'appui du subjonctif, « si le temps était beau » pour le conditionnel, l'impératif de quatorze verbes.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import { VERBS, formOf, type Verb } from "./cm1Conjugaison";
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LES VERBES, LEUR CONDITIONNEL, LEUR SUBJONCTIF, LEUR IMPÉRATIF
// ===========================================================================

const verbOf = (inf: string): Verb => VERBS.find((verb) => verb.inf === inf) as Verb;

/** Les quinze verbes de ces gabarits, dans l'ordre où ils entrent aux paliers. */
export const MODE_VERBS = ["chanter", "jouer", "être", "avoir", "finir", "manger", "choisir", "aller", "faire", "prendre", "venir", "voir", "dire", "pouvoir", "savoir"] as const;

/** Le subjonctif présent de chaque verbe, pour « que je », « que tu », « qu'il », « que nous », « que vous », « qu'ils ». */
export const SUBJUNCTIVE: Record<string, readonly string[]> = {
  chanter: ["chante", "chantes", "chante", "chantions", "chantiez", "chantent"],
  jouer: ["joue", "joues", "joue", "jouions", "jouiez", "jouent"],
  manger: ["mange", "manges", "mange", "mangions", "mangiez", "mangent"],
  finir: ["finisse", "finisses", "finisse", "finissions", "finissiez", "finissent"],
  choisir: ["choisisse", "choisisses", "choisisse", "choisissions", "choisissiez", "choisissent"],
  être: ["sois", "sois", "soit", "soyons", "soyez", "soient"],
  avoir: ["aie", "aies", "ait", "ayons", "ayez", "aient"],
  aller: ["aille", "ailles", "aille", "allions", "alliez", "aillent"],
  faire: ["fasse", "fasses", "fasse", "fassions", "fassiez", "fassent"],
  prendre: ["prenne", "prennes", "prenne", "prenions", "preniez", "prennent"],
  venir: ["vienne", "viennes", "vienne", "venions", "veniez", "viennent"],
  voir: ["voie", "voies", "voie", "voyions", "voyiez", "voient"],
  dire: ["dise", "dises", "dise", "disions", "disiez", "disent"],
  pouvoir: ["puisse", "puisses", "puisse", "puissions", "puissiez", "puissent"],
  savoir: ["sache", "saches", "sache", "sachions", "sachiez", "sachent"],
};

/** L'impératif présent (tu, nous, vous) des verbes qui en ont un : « pouvoir » n'en a pas. */
export const IMPERATIVE: Record<string, readonly [string, string, string]> = {
  chanter: ["chante", "chantons", "chantez"],
  jouer: ["joue", "jouons", "jouez"],
  manger: ["mange", "mangeons", "mangez"],
  finir: ["finis", "finissons", "finissez"],
  choisir: ["choisis", "choisissons", "choisissez"],
  être: ["sois", "soyons", "soyez"],
  avoir: ["aie", "ayons", "ayez"],
  aller: ["va", "allons", "allez"],
  faire: ["fais", "faisons", "faites"],
  prendre: ["prends", "prenons", "prenez"],
  venir: ["viens", "venons", "venez"],
  voir: ["vois", "voyons", "voyez"],
  dire: ["dis", "disons", "dites"],
  savoir: ["sache", "sachons", "sachez"],
};

const CONDITIONAL_ENDINGS = ["ais", "ais", "ait", "ions", "iez", "aient"] as const;
/** Le conditionnel présent : le radical du futur (« chanter-ai » devient « chanter ») et les terminaisons de l'imparfait. */
export const conditional = (verb: Verb, person: number): string => verb.forms.futur[0].slice(0, -2) + CONDITIONAL_ENDINGS[person];
export const subjunctive = (verb: Verb, person: number): string => SUBJUNCTIVE[verb.inf][person];
const present = (verb: Verb, person: number): string => formOf(verb, "présent", person);
const future = (verb: Verb, person: number): string => formOf(verb, "futur", person);
const imperativeOf = (verb: Verb, person: number): string | null => {
  const forms = IMPERATIVE[verb.inf];
  if (!forms) return null;
  return person === 1 ? forms[0] : person === 3 ? forms[1] : person === 4 ? forms[2] : null;
};

// ===========================================================================
// LES PHRASES : sujets, « que », amorces
// ===========================================================================

const NAMES_SINGULAR = ["Moussa", "Fatou", "Modou", "Binta", "Sidy", "Khady", "Cheikh", "Mariama"] as const;
const NAMES_PLURAL = ["les enfants", "les pêcheurs", "Moussa et Fatou", "les élèves", "mes cousins", "Binta et Sidy"] as const;
const PRONOUN = ["je", "tu", "il", "nous", "vous", "ils"] as const;
/** Le pronom précédé de « que », élidé devant « il » et « ils » : jamais « que il ». */
const QUE_PRONOUN = ["que je", "que tu", "qu'il", "que nous", "que vous", "qu'ils"] as const;
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const startsWithVowel = (text: string) => /^[aeiouyéèêâîôûh]/iu.test(text);

/** Le sujet qui précède le verbe, avec son espace ou son apostrophe : « nous », « Moussa », « j' » ; avec `que` : « que tu », « qu'il », « que j' ». */
function lead(person: number, form: string, index: number, que: boolean): string {
  if (person === 0) return que ? (startsWithVowel(form) ? "que j'" : "que je ") : startsWithVowel(form) ? "j'" : "je ";
  if (person === 1) return que ? "que tu " : "tu ";
  if (person === 3) return que ? "que nous " : "nous ";
  if (person === 4) return que ? "que vous " : "vous ";
  if (person === 2) {
    if (index % 2 === 1) return que ? `que ${cycle(NAMES_SINGULAR, index)} ` : `${cycle(NAMES_SINGULAR, index)} `;
    return que ? "qu'il " : "il ";
  }
  if (index % 2 === 1) return que ? `que ${cycle(NAMES_PLURAL, index)} ` : `${cycle(NAMES_PLURAL, index)} `;
  return que ? "qu'ils " : "ils ";
}
/** Un pronom devant la forme, pour une étiquette : « tu irais », « j'irais », « que nous allions », « qu'il aille ». */
const pronounTile = (person: number, form: string, que: boolean) => {
  if (person === 0) return que ? (startsWithVowel(form) ? `que j'${form}` : `que je ${form}`) : startsWithVowel(form) ? `j'${form}` : `je ${form}`;
  if (person === 2) return que ? `qu'il ${form}` : `il ${form}`;
  if (person === 5) return que ? `qu'ils ${form}` : `ils ${form}`;
  return `${que ? "que " : ""}${PRONOUN[person]} ${form}`;
};

const IF_CLAUSE = "Si le temps était beau, ";
const SUBJECTIVE_FRAMES = [(core: string) => `Il faut ${core}.`, (core: string) => `Papa répète pour ${core}.`, (core: string) => `Maman prépare le repas pour ${core}.`] as const;

/** « Si le temps était beau, nous chanterions une chanson. » ; avec `gap`, la forme est remplacée par `___`. */
const conditionalSentence = (verb: Verb, person: number, index: number, gap: boolean) => {
  const form = conditional(verb, person);
  return `${IF_CLAUSE}${lead(person, form, index, false)}${gap ? "___" : form} ${verb.comp}.`;
};
/** « Il faut que nous chantions une chanson. » ; l'amorce change d'une ligne à l'autre. */
const subjunctiveSentence = (verb: Verb, person: number, index: number, gap: boolean) => {
  const form = subjunctive(verb, person);
  return cycle(SUBJECTIVE_FRAMES, index)(`${lead(person, form, index, true)}${gap ? "___" : form} ${verb.comp}`);
};

// ===========================================================================
// LES PALIERS : des cases (verbe, personne), du plus facile au plus difficile
// ===========================================================================

type Cell = { verb: Verb; person: number };
const POOL_1 = ["chanter", "jouer", "être", "avoir", "finir"];
const POOL_2 = [...POOL_1, "manger", "choisir", "aller", "faire"];
const POOL_3 = [...POOL_2, "prendre", "venir", "voir", "dire"];
const POOL_4 = [...MODE_VERBS];
const STAGES: readonly (readonly string[])[] = [POOL_1, POOL_2, POOL_3, POOL_4, POOL_4];

/** `count` cases différentes d'un palier, prises dans ses verbes à partir de `seed` ; les cases refusées par `usable` sont sautées. */
function cells(pool: readonly string[], count: number, seed: number, usable: (verb: Verb, person: number) => boolean = () => true): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>();
  for (let j = 0; out.length < count && j < 800; j++) {
    const verb = verbOf(pool[(seed * 3 + j * 7) % pool.length]);
    const wanted = (seed * 2 + j * 5) % 6;
    for (let shift = 0; shift < 6; shift++) {
      const person = (wanted + shift) % 6;
      const key = `${verb.inf}|${person}`;
      if (seen.has(key) || !usable(verb, person)) continue;
      seen.add(key);
      out.push({ verb, person });
      break;
    }
  }
  return out;
}
/** Cinq étapes de six cases : la liste d'un gabarit, qui donne six lignes à chacun des cinq paliers. */
const ladder = (seed: number, usable?: (verb: Verb, person: number) => boolean): Cell[] => STAGES.flatMap((pool, rank) => cells(pool, 6, seed + rank, usable));

type Mode = "indicatif" | "conditionnel" | "subjonctif" | "impératif";
const MODE_LABEL: Record<Mode, string> = { indicatif: "Indicatif", conditionnel: "Conditionnel", subjonctif: "Subjonctif", impératif: "Impératif" };
const MODES: readonly Mode[] = ["indicatif", "conditionnel", "subjonctif", "impératif"];
const fact = (verb: Verb, kind: string, person: number) => `mod:${verb.inf}:${kind}:${person}`;
const CONCEPT = "employer le conditionnel présent et le subjonctif présent";

// ---------------------------------------------------------------------------
// Compléter une phrase avec le verbe de la parenthèse
// ---------------------------------------------------------------------------

const CONDITIONAL_GAP_HINTS = hints("Cherche le mot « si » au début de la phrase.", "Après « si » à l'imparfait, l'autre partie de la phrase est au conditionnel.", "Le conditionnel prend le radical du futur et les terminaisons de l'imparfait.");
const SUBJUNCTIVE_GAP_HINTS = hints("Cherche « il faut que » ou « pour que » avant le verbe.", "Après ces mots, le verbe se met au subjonctif.", "Pense à la personne : pour « que nous » et « que vous », la terminaison est -ions ou -iez.");

function gapRow(cell: Cell, index: number): GapRow {
  const { verb, person } = cell;
  if (index % 2 === 0) {
    const form = conditional(verb, person);
    return gr(`${conditionalSentence(verb, person, index, true)} (${verb.inf})`, form, [future(verb, person), present(verb, person)], CONDITIONAL_GAP_HINTS, fact(verb, "conditionnel", person));
  }
  const form = subjunctive(verb, person);
  // Au singulier, l'indicatif présent s'écrit comme le subjonctif des verbes en -er : le conditionnel prend alors sa place.
  const second = present(verb, person) !== form ? present(verb, person) : conditional(verb, person);
  return gr(`${subjunctiveSentence(verb, person, index, true)} (${verb.inf})`, form, [second, future(verb, person)], SUBJUNCTIVE_GAP_HINTS, fact(verb, "subjonctif", person));
}
export const GAP_ROWS: readonly GapRow[] = ladder(1).map(gapRow);
export function makeCm2ModGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-mod-trou", CONCEPT, GAP_ROWS, 1, 0, "Complète la phrase avec le verbe de la parenthèse.");
}

// ---------------------------------------------------------------------------
// À quel mode est le verbe ?
// ---------------------------------------------------------------------------

const MODE_HINTS = hints("Cherche le mot qui précède le verbe dans la phrase.", "Un ordre n'a pas de sujet.", "Après « il faut que », le verbe change de forme.");

/** Un mode que la case permet : l'impératif seulement à tu, nous, vous, et jamais pour « pouvoir ». */
const allowedMode = (verb: Verb, person: number, mode: Mode) => (mode !== "impératif" ? true : imperativeOf(verb, person) !== null);

function modeRow(cell: Cell, index: number): QuestionRow {
  const { verb, person } = cell;
  let mode = cycle(MODES, index);
  if (!allowedMode(verb, person, mode)) mode = cycle(["indicatif", "conditionnel", "subjonctif"] as const, index);
  let sentence: string;
  let form: string;
  if (mode === "indicatif") {
    form = present(verb, person);
    sentence = `${cap(lead(person, form, index, false))}${form} ${verb.comp}.`;
  } else if (mode === "conditionnel") {
    form = conditional(verb, person);
    sentence = conditionalSentence(verb, person, index, false);
  } else if (mode === "subjonctif") {
    form = subjunctive(verb, person);
    sentence = subjunctiveSentence(verb, person, index, false);
  } else {
    form = imperativeOf(verb, person) as string;
    sentence = `${cap(form)} ${verb.comp} !`;
  }
  const others = MODES.filter((candidate) => candidate !== mode);
  const first = cycle(others, index);
  const second = cycle(others, index + 1 + (index % 2));
  return qr(`Dans la phrase « ${sentence} », à quel mode est le verbe « ${form} » ?`, MODE_LABEL[mode], [MODE_LABEL[first], MODE_LABEL[second]], MODE_HINTS, fact(verb, `mode-${mode}`, person));
}
export const MODE_ROWS: readonly QuestionRow[] = ladder(2).map(modeRow);
export function makeCm2ModMode(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-mod-mode", CONCEPT, MODE_ROWS, 1, (row) => row.prompt);
}

// ---------------------------------------------------------------------------
// Écrire le verbe, choisir sa forme
// ---------------------------------------------------------------------------

const WRITE_HINTS = hints("Pense à la personne demandée.", "Pour le conditionnel, pars du radical du futur et prends les terminaisons de l'imparfait.", "Écris seulement le verbe, sans le pronom.");
const WRITE_SUBJUNCTIVE_HINTS = hints("Pense à la personne demandée.", "Au subjonctif, pour « que nous » et « que vous », la terminaison est -ions ou -iez.", "Écris seulement le verbe, sans « que » ni le pronom.");

function writeRow(cell: Cell, index: number): WriteRow {
  const { verb, person } = cell;
  if (index % 2 === 0) return wr(`Écris le verbe ${verb.inf} au conditionnel présent avec « ${PRONOUN[person]} ».`, [conditional(verb, person)], WRITE_HINTS, fact(verb, "conditionnel", person));
  return wr(`Écris le verbe ${verb.inf} au subjonctif présent avec « ${QUE_PRONOUN[person]} ».`, [subjunctive(verb, person)], WRITE_SUBJUNCTIVE_HINTS, fact(verb, "subjonctif", person));
}
export const WRITE_ROWS: readonly WriteRow[] = ladder(3).map(writeRow);
export function makeCm2ModWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-mod-ecrire", CONCEPT, WRITE_ROWS);
}

const FORM_HINTS = hints("Repère le mode et la personne demandés.", "Le conditionnel se construit sur le radical du futur, avec les terminaisons de l'imparfait.", "Le subjonctif s'emploie après « que » et change la fin du verbe.");

function formRow(cell: Cell, index: number): QuestionRow {
  const { verb, person } = cell;
  if (index % 2 === 0) {
    const form = conditional(verb, person);
    return qr(`Quelle est la forme du verbe ${verb.inf} au conditionnel présent avec « ${PRONOUN[person]} » ?`, form, [future(verb, person), formOf(verb, "imparfait", person)], FORM_HINTS, fact(verb, "conditionnel", person));
  }
  const form = subjunctive(verb, person);
  const second = present(verb, person) !== form ? present(verb, person) : conditional(verb, person);
  return qr(`Quelle est la forme du verbe ${verb.inf} au subjonctif présent avec « ${QUE_PRONOUN[person]} » ?`, form, [second, future(verb, person)], FORM_HINTS, fact(verb, "subjonctif", person));
}
export const FORM_ROWS: readonly QuestionRow[] = ladder(4).map(formRow);
export function makeCm2ModForm(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-mod-forme", CONCEPT, FORM_ROWS, 1, (row) => row.prompt);
}

// ---------------------------------------------------------------------------
// Quelle phrase est correcte ?
// ---------------------------------------------------------------------------

const CONDITIONAL_SENTENCE_HINTS = hints("Regarde le verbe qui suit le mot « si ».", "Après « si » à l'imparfait, on emploie le conditionnel dans l'autre partie.", "Le futur et le conditionnel ne s'écrivent pas de la même façon.");
const SUBJUNCTIVE_SENTENCE_HINTS = hints("Repère le petit mot qui appelle un verbe particulier.", "Après lui, le verbe se met au subjonctif.", "Un verbe au futur ou au conditionnel ne va pas ici.");

function conditionalSentenceRow(cell: Cell, index: number): QuestionRow {
  const { verb, person } = cell;
  const good = conditionalSentence(verb, person, index, false);
  const wrongFuture = `${IF_CLAUSE}${lead(person, future(verb, person), index, false)}${future(verb, person)} ${verb.comp}.`;
  // « si le temps serait beau » : « si » suivi d'un conditionnel est la faute classique.
  const wrongIf = `Si le temps serait beau, ${lead(person, conditional(verb, person), index, false)}${conditional(verb, person)} ${verb.comp}.`;
  return qr("Quelle phrase est correcte ?", good, [wrongFuture, wrongIf], CONDITIONAL_SENTENCE_HINTS, fact(verb, "conditionnel", person));
}
export const CONDITIONAL_SENTENCE_ROWS: readonly QuestionRow[] = ladder(5).map(conditionalSentenceRow);
export function makeCm2ModConditional(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-mod-conditionnel", CONCEPT, CONDITIONAL_SENTENCE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

function subjunctiveSentenceRow(cell: Cell, index: number): QuestionRow {
  const { verb, person } = cell;
  const frame = cycle(SUBJECTIVE_FRAMES, index);
  const sentence = (form: string) => frame(`${lead(person, form, index, true)}${form} ${verb.comp}`);
  const form = subjunctive(verb, person);
  const second = present(verb, person) !== form ? present(verb, person) : conditional(verb, person);
  return qr("Quelle phrase est correcte ?", sentence(form), [sentence(second), sentence(future(verb, person))], SUBJUNCTIVE_SENTENCE_HINTS, fact(verb, "subjonctif", person));
}
export const SUBJUNCTIVE_SENTENCE_ROWS: readonly QuestionRow[] = ladder(6).map(subjunctiveSentenceRow);
export function makeCm2ModSubjunctive(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-mod-subjonctif", CONCEPT, SUBJUNCTIVE_SENTENCE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

// ---------------------------------------------------------------------------
// Ranger les personnes d'un verbe
// ---------------------------------------------------------------------------

const ORDER_HINTS = hints("Les personnes se suivent toujours dans le même ordre.", "Commence par celui qui parle, puis celui à qui on parle.", "Les personnes du pluriel viennent après celles du singulier.");
const PERSON_SETS: readonly (readonly number[])[] = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [0, 2, 3, 5], [0, 1, 4, 5], [1, 2, 4, 5], [0, 3, 4, 5], [0, 1, 2, 5]];

function orderRow(cell: Cell, index: number): OrderRow {
  const { verb } = cell;
  const set = cycle(PERSON_SETS, index);
  const que = index % 2 === 1;
  const form = (person: number) => (que ? subjunctive(verb, person) : conditional(verb, person));
  return ordr(
    `Range ces formes du verbe ${verb.inf} ${que ? "au subjonctif présent" : "au conditionnel présent"} selon la personne, de je à ils.`,
    set.map((person) => pronounTile(person, form(person), que)),
    ORDER_HINTS,
    fact(verb, `ordre-${que ? "subjonctif" : "conditionnel"}`, set[0]),
  );
}
export const ORDER_ROWS: readonly OrderRow[] = ladder(7).map(orderRow);
export function makeCm2ModOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm2-mod-ranger", CONCEPT, ORDER_ROWS);
}

// ---------------------------------------------------------------------------
// Relier une phrase à son mode, glisser des formes dans deux modes
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Lis la phrase en entier avant de choisir.", "Un ordre sans sujet est à un mode à part.", "Commence par la phrase dont tu es le plus sûr.");

/** Le même verbe, la même personne (tu ou vous), trois des quatre modes : trois phrases, trois modes. */
function linkRow(cell: Cell, index: number): LinkRow {
  const { verb } = cell;
  const person = index % 2 === 0 ? 1 : 4;
  const present1 = present(verb, person);
  const sentences: Record<Mode, string> = {
    indicatif: `${cap(lead(person, present1, 0, false))}${present1} ${verb.comp}.`,
    conditionnel: `${cap(lead(person, conditional(verb, person), 0, false))}${conditional(verb, person)} ${verb.comp}.`,
    subjonctif: `Il faut ${lead(person, subjunctive(verb, person), 0, true)}${subjunctive(verb, person)} ${verb.comp}.`,
    impératif: `${cap(imperativeOf(verb, person) as string)} ${verb.comp} !`,
  };
  const dropped = cycle(MODES, index);
  return {
    prompt: "Relie chaque phrase à son mode.",
    pairs: MODES.filter((mode) => mode !== dropped).map((mode) => ({ left: sentences[mode], right: MODE_LABEL[mode] })),
    hints: LINK_HINTS,
    fact: fact(verb, "relier", person),
  };
}
const LINK_CELLS = (seed: number) => STAGES.flatMap((pool, rank) => cells(pool, 6, seed + rank, (verb, person) => person === 1 && imperativeOf(verb, person) !== null));
export const LINK_ROWS: readonly LinkRow[] = LINK_CELLS(8).map(linkRow);
export function makeCm2ModLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-mod-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Cherche le petit mot qui précède chaque verbe.", "Un « que » devant le pronom annonce un mode.", "Classe d'abord les formes dont tu es sûr.");

function sortRow(rank: number, n: number): SortRow {
  const picked = cells(STAGES[rank], 4, n * 5 + rank, () => true);
  const [a, b, c, d] = picked;
  const asConditional = (cell: Cell) => ({ text: pronounTile(cell.person, conditional(cell.verb, cell.person), false), zone: "Conditionnel présent" });
  const asSubjunctive = (cell: Cell) => ({ text: pronounTile(cell.person, subjunctive(cell.verb, cell.person), true), zone: "Subjonctif présent" });
  return { prompt: "Glisse chaque forme dans la bonne case.", zones: ["Conditionnel présent", "Subjonctif présent"], items: [asConditional(a), asConditional(b), asSubjunctive(c), asSubjunctive(d)], hints: SORT_HINTS, fact: fact(a.verb, "glisser", a.person) };
}
export const SORT_ROWS: readonly SortRow[] = STAGES.flatMap((_, rank) => Array.from({ length: 6 }, (__, n) => sortRow(rank, n)));
export function makeCm2ModSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-mod-glisser", CONCEPT, SORT_ROWS);
}

// ---------------------------------------------------------------------------
// L'intrus du conditionnel
// ---------------------------------------------------------------------------

const ODD_HINTS = hints("Compare la fin de chaque forme.", "Le conditionnel présent finit comme l'imparfait.", "Le futur finit par -rai, -ras, -ra, -rons, -rez ou -ront.");

function oddRow(cell: Cell, index: number): QuestionRow {
  const { verb, person } = cell;
  const other = (person + 1 + (index % 2) * 2) % 6;
  const third = (person + 3) % 6;
  const futureForm = future(verb, third);
  return qr(
    `Parmi ces formes du verbe ${verb.inf}, laquelle n'est pas au conditionnel présent ?`,
    pronounTile(third, futureForm, false),
    [pronounTile(person, conditional(verb, person), false), pronounTile(other === third ? (other + 1) % 6 : other, conditional(verb, other === third ? (other + 1) % 6 : other), false)],
    ODD_HINTS,
    fact(verb, "intrus", person),
  );
}
export const ODD_ROWS: readonly QuestionRow[] = ladder(9).map(oddRow);
export function makeCm2ModOdd(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-mod-intrus", CONCEPT, ODD_ROWS, 1, (row) => row.prompt);
}
