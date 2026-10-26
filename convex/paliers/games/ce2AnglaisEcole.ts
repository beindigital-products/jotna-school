/**
 * LES GABARITS DE L'ÉCOLE EN ANGLAIS, AU CE2 (`an-ce2-school`) : les matières et l'emploi du temps.
 *
 * Le plan (`docs/programme-anglais-v2.md`, lot 4) : l'école manquait au programme. Elle réutilise les jours (CE1), « have » et
 * les phrases courtes (« I have Maths on Monday. »).
 *
 * LES SEPT MATIÈRES, chacune avec un dessin d'Unicode 11 au plus, sans U+FE0F : French 📚, Maths 🔢, English 💬, Science 🔬,
 * Art 🎨, Music 🎵, PE ⚽. Le français et l'anglais sont des matières et des langues : ce sont les deux de la case « Une langue ».
 *
 * L'EMPLOI DU TEMPS SE LIT DANS L'ÉNONCÉ. Une rangée de trois jours français et d'un dessin chacun
 * (« lundi 🔢 · mardi 🎨 · jeudi ⚽ »). La consigne est en français ; l'anglais n'est que dans les réponses. Les jours de la phrase
 * anglaise sont ceux de la rangée. Une mauvaise réponse est toujours FAUSSE d'après la rangée : la bonne matière un autre jour,
 * ou un autre jour de la rangée avec la matière demandée. Jamais une matière qui aurait pu être au même jour.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sentence, sortTiles, writeLine, type Bands, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const BANDS: Bands = 3;
const CONCEPT = "l'école et l'emploi du temps en anglais";

export type Subject = { en: string; the: string; emoji: string };

export const SUBJECTS: readonly Subject[] = [
  { en: "French", the: "le français", emoji: "📚" },
  { en: "Maths", the: "les maths", emoji: "🔢" },
  { en: "English", the: "l'anglais", emoji: "💬" },
  { en: "Science", the: "les sciences", emoji: "🔬" },
  { en: "Art", the: "le dessin", emoji: "🎨" },
  { en: "Music", the: "la musique", emoji: "🎵" },
  { en: "PE", the: "le sport", emoji: "⚽" },
];

/** Un jour de la semaine d'école : son nom français (dans l'énoncé) et anglais (dans la phrase). */
export type Day = { fr: string; en: string };
export const SCHOOL_DAYS: readonly Day[] = [
  { fr: "lundi", en: "Monday" },
  { fr: "mardi", en: "Tuesday" },
  { fr: "mercredi", en: "Wednesday" },
  { fr: "jeudi", en: "Thursday" },
  { fr: "vendredi", en: "Friday" },
];

/** Une rangée d'emploi du temps : trois jours, chacun avec l'indice de sa matière dans `SUBJECTS`. Une matière par rangée au plus. */
export type Timetable = readonly (readonly [dayIndex: number, subjectIndex: number])[];

/** Douze rangées, quatre par palier. Le jour 0 est lundi. */
export const TIMETABLES: readonly Timetable[] = [
  [[0, 1], [1, 4], [3, 6]],
  [[0, 0], [2, 5], [4, 3]],
  [[1, 2], [3, 1], [4, 4]],
  [[0, 6], [1, 0], [2, 2]],
  [[2, 3], [3, 5], [4, 1]],
  [[0, 4], [3, 2], [4, 6]],
  [[1, 5], [2, 0], [4, 2]],
  [[0, 3], [2, 6], [3, 4]],
  [[1, 1], [3, 0], [4, 5]],
  [[0, 2], [1, 3], [2, 4]],
  [[1, 6], [2, 1], [3, 3]],
  [[0, 5], [3, 6], [4, 0]],
];

export const tableOf = (table: Timetable) => table.map(([day, subject]) => `${SCHOOL_DAYS[day].fr} ${SUBJECTS[subject].emoji}`).join(" · ");
const sentenceOf = (subject: Subject, day: Day) => `I have ${subject.en} on ${day.en}.`;
/** Le rang de la ligne interrogée dans une rangée : tourne d'une rangée à l'autre. */
export const askedOf = (tableIndex: number) => tableIndex % 3;

const schoolHints = (subject: Subject, clue: string, first = "Lis l'emploi du temps, un jour après l'autre."): Hints => [
  first,
  clue,
  `Le mot commence par la lettre ${subject.en[0]}.`,
];

/** « Lis l'emploi du temps. Quelle phrase est juste ? » : la bonne phrase, la bonne matière un autre jour, un autre jour avec cette matière. */
const TIMETABLE_CHOICES: readonly Fact[] = TIMETABLES.map((table, index) => {
  const asked = table[askedOf(index)];
  const day = SCHOOL_DAYS[asked[0]];
  const subject = SUBJECTS[asked[1]];
  const others = table.filter((_, i) => i !== askedOf(index));
  const otherDay = SCHOOL_DAYS[others[0][0]];
  const otherSubject = SUBJECTS[others[1][1]];
  return {
    question: `Lis l'emploi du temps. Quelle phrase est juste ?\n${tableOf(table)}`,
    answer: sentenceOf(subject, day),
    wrong: [sentenceOf(subject, otherDay), sentenceOf(otherSubject, day)] as [string, string],
    hints: schoolHints(subject, `Trouve le jour ${day.fr} dans l'emploi du temps, puis regarde son dessin.`),
  };
});

export function makeCe2EnSchoolTimetable(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-sc-emploi", CONCEPT, TIMETABLE_CHOICES, BANDS, 2);
}

/** « On Monday I have ___. » : la matière du jour interrogé, deux autres matières. */
const TIMETABLE_GAPS: readonly EnGap[] = TIMETABLES.map((table, index) => {
  const asked = table[askedOf(index)];
  const day = SCHOOL_DAYS[asked[0]];
  const subject = SUBJECTS[asked[1]];
  const wrong = SUBJECTS.filter((s) => s.en !== subject.en)
    .slice(index % 4, (index % 4) + 2)
    .map((s) => s.en) as [string, string];
  return {
    prompt: `Lis l'emploi du temps et complète la phrase.\n${tableOf(table)}`,
    text: `On ${day.en} I have ___.`,
    answer: subject.en,
    wrong,
    hints: schoolHints(subject, `Trouve le jour ${day.fr} dans l'emploi du temps, puis regarde son dessin.`),
  };
});

export function makeCe2EnSchoolGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-sc-trou", CONCEPT, TIMETABLE_GAPS, BANDS, 2);
}

/** « Écris la matière du lundi, en anglais. » : le nom de la matière, avec ou sans majuscule. */
const TIMETABLE_WRITES: readonly EnWrite[] = TIMETABLES.map((table, index) => {
  const asked = table[askedOf(index)];
  const day = SCHOOL_DAYS[asked[0]];
  const subject = SUBJECTS[asked[1]];
  return {
    prompt: `Lis l'emploi du temps. Écris la matière du ${day.fr}, en anglais.\n${tableOf(table)}`,
    accepted: [...new Set([subject.en, subject.en.toLowerCase()])],
    hints: schoolHints(subject, "Regarde le dessin du jour demandé et dis la matière en français."),
  };
});

export function makeCe2EnSchoolWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-sc-ecrire", CONCEPT, TIMETABLE_WRITES, BANDS, 2);
}

/** « Quel mot va avec ce dessin ? » : la matière dessinée, deux autres matières en choix. */
const SUBJECT_WORDS: readonly Fact[] = SUBJECTS.map((subject, index) => ({
  question: `Quel mot va avec ce dessin ?\n${subject.emoji}`,
  answer: subject.en,
  wrong: [SUBJECTS[(index + 2) % 7].en, SUBJECTS[(index + 4) % 7].en] as [string, string],
  hints: schoolHints(subject, "Dis en français la matière que montre le dessin.", "Regarde bien le dessin."),
}));

export function makeCe2EnSchoolWord(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-sc-mot", CONCEPT, SUBJECT_WORDS, BANDS, 1);
}

/** « I have Maths on Monday. » remis dans l'ordre : une phrase par rangée. */
const SCHOOL_SENTENCES = TIMETABLES.map((table, index) => {
  const asked = table[askedOf(index)];
  return sentence(sentenceOf(SUBJECTS[asked[1]], SCHOOL_DAYS[asked[0]]));
});

export function makeCe2EnSchoolOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-sc-phrase", CONCEPT, SCHOOL_SENTENCES, BANDS);
}

/** `🔢 ~ Maths` : un dessin et le nom de sa matière. */
const SUBJECT_PAIRS: readonly (readonly [string, string])[] = SUBJECTS.map((subject) => [subject.emoji, subject.en] as const);

export function makeCe2EnSchoolLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce2-en-sc-relier",
    CONCEPT,
    "Relie chaque dessin à sa matière.",
    SUBJECT_PAIRS,
    ["Dis en français la matière que montre chaque dessin.", "Cherche le mot anglais que tu connais.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Comment dit-on « Ma matière préférée est le dessin. » en anglais ? » : `My favourite subject is Art.` */
const FAVOURITES: readonly Fact[] = SUBJECTS.map((subject, index) => ({
  question: `Comment dit-on « Ma matière préférée est ${subject.the}. » en anglais ?`,
  answer: `My favourite subject is ${subject.en}.`,
  wrong: [`My favourite subject is ${SUBJECTS[(index + 2) % 7].en}.`, `My favourite subject is ${SUBJECTS[(index + 5) % 7].en}.`] as [string, string],
  hints: schoolHints(subject, "Cherche dans les trois phrases le nom anglais de la matière.", "Lis les trois phrases en entier."),
}));

export function makeCe2EnSchoolFavourite(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-sc-prefere", CONCEPT, FAVOURITES, BANDS, 1);
}

/** « Glisse chaque matière dans la bonne case. » : une langue (French, English), ou pas une langue. */
export function makeCe2EnSchoolSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce2-en-sc-glisser",
    CONCEPT,
    "Glisse chaque matière dans la bonne case.",
    { zone: "Une langue", tiles: ["French", "English"] },
    { zone: "Pas une langue", tiles: ["Maths", "Science", "Art", "Music", "PE"] },
    ["Pense aux matières où l'on apprend à parler et à écrire.", "Le français et l'anglais sont des langues.", "Les maths, les sciences, le dessin, la musique et le sport ne sont pas des langues."],
  );
}
