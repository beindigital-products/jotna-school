import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { HOBBIES } from "../paliers/games/cm1AnglaisLoisirs";
import { PLACES } from "../paliers/games/cm1AnglaisIlYa";
import { SUBJECTS, TIMETABLES } from "../paliers/games/ce2AnglaisEcole";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

vi.setConfig({ testTimeout: 60_000 });

/**
 * LE LOT 4 DU PROGRAMME D'ANGLAIS (`docs/programme-anglais-v2.md`) : l'école et l'emploi du temps (`an-ce2-school`), les loisirs
 * (`an-cm1-hobbies`) et « il y a » (`an-cm1-there-is`).
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (la matière de chaque dessin, la forme en -ing de chaque
 * verbe, le singulier et le pluriel de chaque lieu) : il recalcule la bonne réponse depuis l'énoncé et les tuiles. Des
 * MUTATIONS abîment ensuite chaque exercice juste, et le vérificateur doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 40 }, (_, n) => ({ level, seed: `l4:${level}:${n}` })));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
type Klass = "CE2" | "CM1";
const make = (kind: GameKind, klass: Klass, d: (typeof draws)[number]): Exo => GAME_KINDS[kind].make(makeContext(klass, d.level, `${kind}:${d.seed}`)) as Exo;

const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const emojisOf = (text: string) => text.match(/\p{Extended_Pictographic}/gu) ?? [];
const three = (options: string[]) => isTrue(`trois choix différents : ${JSON.stringify(options)}`, options.length === 3 && new Set(options).size === 3);
const afterFirstLine = (prompt: string) => prompt.split("\n").slice(1).join("\n");

type Check = (exo: Exo) => string[];
type Group = { klass: Klass; checks: Record<string, Check>; damage: Record<string, (exo: Exo) => Exo> };

const shift = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, correctIndex: (Number(exo.payload.correctIndex) + 1) % 3 } });
const swapPairs = (exo: Exo): Exo => {
  const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
  [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
  return { ...exo, payload: { ...exo.payload, pairs } };
};
const wrongBlank = (exo: Exo): Exo => ({
  ...exo,
  payload: { ...exo.payload, blanks: [{ ...blankOf(exo), answer: blankOf(exo).options.find((option) => option !== blankOf(exo).answer) }] },
});
const reverse = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, correctSequence: [...sequenceOf(exo)].reverse() } });
const wrongWrite = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, acceptedAnswers: ["zzz"] } });
const flipFirst = (a: string, b: string) => (exo: Exo): Exo => ({
  ...exo,
  payload: { ...exo.payload, items: itemsOf(exo).map((item, i) => (i === 0 ? { ...item, correctZone: item.correctZone === a ? b : a } : item)) },
});

// ===========================================================================
// L'ÉCOLE
// ===========================================================================

const SUBJECT_OF: Record<string, string> = { "📚": "French", "🔢": "Maths", "💬": "English", "🔬": "Science", "🎨": "Art", "🎵": "Music", "⚽": "PE" };
const DAY_OF: Record<string, string> = { lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday", vendredi: "Friday" };
const SUBJECT_OF_FRENCH: Record<string, string> = {
  "le français": "French",
  "les maths": "Maths",
  "l'anglais": "English",
  "les sciences": "Science",
  "le dessin": "Art",
  "la musique": "Music",
  "le sport": "PE",
};
/** Lit la rangée d'un énoncé : « lundi 🔢 · mardi 🎨 · jeudi ⚽ » donne { Monday: Maths, Tuesday: Art, Thursday: PE }. */
function timetableOf(prompt: string): Record<string, string> {
  const table: Record<string, string> = {};
  for (const part of afterFirstLine(prompt).split(" · ")) {
    const [day, emoji] = part.split(" ");
    if (DAY_OF[day] && SUBJECT_OF[emoji]) table[DAY_OF[day]] = SUBJECT_OF[emoji];
  }
  return table;
}
const claim = (sentence: string) => /^I have (\w+) on (\w+)\.$/.exec(sentence);
const isTrueClaim = (table: Record<string, string>, sentence: string) => {
  const match = claim(sentence);
  return match !== null && table[match[2]] === match[1];
};

const SCHOOL_CHECKS: Record<string, Check> = {
  "ce2-en-sc-emploi": (exo) => {
    const table = timetableOf(exo.prompt);
    return [
      ...isTrue("l'emploi du temps a trois jours", Object.keys(table).length === 3),
      ...isTrue("la bonne phrase n'est pas juste d'après la rangée", isTrueClaim(table, rightOption(exo))),
      ...isTrue("un mauvais choix est juste d'après la rangée", optionsOf(exo).filter((o) => isTrueClaim(table, o)).length === 1),
      ...three(optionsOf(exo)),
    ];
  },
  "ce2-en-sc-trou": (exo) => {
    const table = timetableOf(exo.prompt);
    const match = /^On (\w+) I have ___\.$/.exec(textOf(exo));
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("le jour n'est pas dans la rangée", match !== null && table[match[1]] !== undefined),
      ...eq("la matière du jour", answer, match ? table[match[1]] : null),
      ...three(options),
    ];
  },
  "ce2-en-sc-ecrire": (exo) => {
    const table = timetableOf(exo.prompt);
    const day = /la matière du (\w+),/.exec(exo.prompt)?.[1] ?? "";
    const subject = table[DAY_OF[day]];
    return [
      ...isTrue("jour inconnu", DAY_OF[day] !== undefined && subject !== undefined),
      ...eq("la matière", acceptedOf(exo)[0], subject),
      ...isTrue("une écriture admise est une autre matière", acceptedOf(exo).every((a) => a.toLowerCase() === (subject ?? "").toLowerCase())),
    ];
  },
  "ce2-en-sc-mot": (exo) => [...eq("le mot du dessin", rightOption(exo), SUBJECT_OF[emojisOf(exo.prompt)[0] ?? ""]), ...three(optionsOf(exo))],
  "ce2-en-sc-phrase": (exo) => {
    const sentence = sequenceOf(exo).join(" ");
    const match = claim(sentence);
    return [
      ...isTrue(`« ${sentence} » n'est pas une phrase I have`, match !== null),
      ...isTrue("matière inconnue", match !== null && Object.values(SUBJECT_OF).includes(match[1])),
      ...isTrue("jour inconnu", match !== null && Object.values(DAY_OF).includes(match[2])),
    ];
  },
  "ce2-en-sc-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`la matière de ${pair.left}`, pair.right, SUBJECT_OF[pair.left])),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "ce2-en-sc-prefere": (exo) => {
    const french = /« Ma matière préférée est (.+)\. »/.exec(exo.prompt)?.[1] ?? "";
    return [...eq("la bonne phrase", rightOption(exo), `My favourite subject is ${SUBJECT_OF_FRENCH[french]}.`), ...three(optionsOf(exo))];
  },
  "ce2-en-sc-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["Une langue", "Pas une langue"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, ["French", "English"].includes(item.text) ? "Une langue" : "Pas une langue")),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
};
const SCHOOL_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "ce2-en-sc-emploi": shift,
  "ce2-en-sc-trou": wrongBlank,
  "ce2-en-sc-ecrire": wrongWrite,
  "ce2-en-sc-mot": shift,
  "ce2-en-sc-phrase": (exo) => ({ ...exo, payload: { ...exo.payload, correctSequence: ["have", "I", ...sequenceOf(exo).slice(2)] } }),
  "ce2-en-sc-relier": swapPairs,
  "ce2-en-sc-prefere": shift,
  "ce2-en-sc-glisser": flipFirst("Une langue", "Pas une langue"),
};

// ===========================================================================
// LES LOISIRS
// ===========================================================================

type Hob = { verb: string; ing: string; obj?: string; emoji: string };
const HOB: Hob[] = [
  { verb: "play", ing: "playing", obj: "football", emoji: "⚽" },
  { verb: "play", ing: "playing", obj: "basketball", emoji: "🏀" },
  { verb: "read", ing: "reading", emoji: "📖" },
  { verb: "draw", ing: "drawing", emoji: "🎨" },
  { verb: "sing", ing: "singing", emoji: "🎤" },
  { verb: "cook", ing: "cooking", emoji: "🍳" },
  { verb: "dance", ing: "dancing", emoji: "💃" },
  { verb: "swim", ing: "swimming", emoji: "🏊" },
  { verb: "run", ing: "running", emoji: "🏃" },
];
const withObj = (hob: Hob, word: string) => (hob.obj ? `${word} ${hob.obj}` : word);
const VALID_ING = new Set(HOB.map((hob) => hob.ing));
const LIKE_SENTENCES = new Set(HOB.flatMap((hob) => [`I like ${withObj(hob, hob.ing)}.`, `She likes ${withObj(hob, hob.ing)}.`]));
const PRESENT_SENTENCES = new Set(HOB.map((hob) => `I ${withObj(hob, hob.verb)}.`));
const hobOfEmoji = (prompt: string) => HOB.find((hob) => hob.emoji === emojisOf(prompt)[0]);

const HOBBY_CHECKS: Record<string, Check> = {
  "cm1-hb-trou": (exo) => {
    const { options, answer } = blankOf(exo);
    const text = textOf(exo);
    const match = /^(I like|She likes) ___( football| basketball)?\.$/.exec(text);
    return [
      ...isTrue(`la phrase « ${text} » n'a pas la forme attendue`, match !== null),
      ...isTrue("la bonne réponse n'est pas un verbe en -ing bien écrit", VALID_ING.has(answer)),
      ...isTrue("un mauvais choix est un verbe en -ing bien écrit", options.filter((o) => VALID_ING.has(o)).length === 1),
      ...isTrue("le sport demande playing", match?.[2] === undefined || answer === "playing"),
      ...three(options),
    ];
  },
  "cm1-hb-phrase": (exo) => {
    const hob = hobOfEmoji(exo.prompt);
    return [
      ...isTrue("dessin inconnu", hob !== undefined),
      ...eq("la bonne phrase", rightOption(exo), hob ? `I like ${withObj(hob, hob.ing)}.` : null),
      ...isTrue("une phrase fausse est juste", optionsOf(exo).filter((o) => LIKE_SENTENCES.has(o)).length === 1),
      ...three(optionsOf(exo)),
    ];
  },
  "cm1-hb-reponse": (exo) => {
    const hob = hobOfEmoji(exo.prompt);
    return [
      ...isTrue("dessin inconnu", hob !== undefined),
      ...eq("la bonne réponse", rightOption(exo), hob ? `I ${withObj(hob, hob.verb)}.` : null),
      ...isTrue("une réponse fausse est juste", optionsOf(exo).filter((o) => PRESENT_SENTENCES.has(o)).length === 1),
      ...three(optionsOf(exo)),
    ];
  },
  "cm1-hb-ordre": (exo) => {
    const sentence = sequenceOf(exo).join(" ");
    return [
      ...isTrue(`« ${sentence} » n'est pas une phrase de la liste`, LIKE_SENTENCES.has(sentence)),
      ...isTrue("le verbe ne s'accorde pas avec le sujet", /^(I like|She likes) /.test(sentence)),
    ];
  },
  "cm1-hb-ecrire": (exo) => {
    const match = /I like ___( football| basketball)? \((\w+)\)\.$/.exec(exo.prompt);
    const hob = HOB.find((candidate) => candidate.verb === match?.[2]);
    return [...isTrue("verbe inconnu", hob !== undefined), ...eq("la forme en -ing", acceptedOf(exo), [hob?.ing])];
  },
  "cm1-hb-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`la forme en -ing de ${pair.left}`, pair.right, HOB.find((hob) => hob.verb === pair.left)?.ing ?? null)),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "cm1-hb-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["La lettre double", "Seulement -ing"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, ["swim", "run"].includes(item.text) ? "La lettre double" : "Seulement -ing")),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
};
const HOBBY_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "cm1-hb-trou": wrongBlank,
  "cm1-hb-phrase": shift,
  "cm1-hb-reponse": shift,
  "cm1-hb-ordre": reverse,
  "cm1-hb-ecrire": wrongWrite,
  "cm1-hb-relier": swapPairs,
  "cm1-hb-glisser": flipFirst("La lettre double", "Seulement -ing"),
};

// ===========================================================================
// IL Y A
// ===========================================================================

type Place = { en: string; plural: string; emoji?: string };
const PLACE: Place[] = [
  { en: "school", plural: "schools", emoji: "🏫" },
  { en: "shop", plural: "shops", emoji: "🏪" },
  { en: "mosque", plural: "mosques", emoji: "🕌" },
  { en: "hospital", plural: "hospitals", emoji: "🏥" },
  { en: "bank", plural: "banks", emoji: "🏦" },
  { en: "post office", plural: "post offices", emoji: "🏤" },
  { en: "bus station", plural: "bus stations", emoji: "🚏" },
  { en: "market", plural: "markets" },
];
const COUNT_WORD: Record<number, string> = { 1: "a", 2: "two", 3: "three" };
const placeOfEmoji = (emoji: string | undefined) => PLACE.find((place) => place.emoji === emoji);
/** Toutes les phrases justes, pour savoir si un mauvais choix l'est par hasard. */
const THERE_SENTENCES = new Set(PLACE.flatMap((place) => [`There is a ${place.en}.`, ...[2, 3].map((n) => `There are ${COUNT_WORD[n]} ${place.plural}.`)]));

const THERE_CHECKS: Record<string, Check> = {
  "cm1-th-trou": (exo) => {
    const emojis = emojisOf(exo.prompt);
    const place = placeOfEmoji(emojis[0]);
    const match = /^There ___ (a|two|three) ([\w ]+) in my town\.$/.exec(textOf(exo));
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("dessin inconnu", place !== undefined && new Set(emojis).size === 1),
      ...isTrue("la phrase n'a pas la forme attendue", match !== null),
      ...eq("le nombre de dessins", match ? Object.values(COUNT_WORD).indexOf(match[1]) + 1 : null, emojis.length),
      ...eq("is ou are", answer, emojis.length === 1 ? "is" : "are"),
      ...eq("le nom", match?.[2], emojis.length === 1 ? place?.en : place?.plural),
      ...eq("les choix", [...options].sort(), ["am", "are", "is"]),
    ];
  },
  "cm1-th-phrase": (exo) => {
    const emojis = emojisOf(exo.prompt);
    const place = placeOfEmoji(emojis[0]);
    const expected = emojis.length === 1 ? `There is a ${place?.en}.` : `There are ${COUNT_WORD[emojis.length]} ${place?.plural}.`;
    return [
      ...isTrue("dessin inconnu", place !== undefined && new Set(emojis).size === 1),
      ...eq("la bonne phrase", rightOption(exo), expected),
      ...isTrue("une phrase fausse est juste", optionsOf(exo).filter((o) => THERE_SENTENCES.has(o)).length === 1),
      ...three(optionsOf(exo)),
    ];
  },
  "cm1-th-rue": (exo) => {
    const asked = /Is there a ([\w ]+)\?/.exec(exo.prompt)?.[1];
    const street = emojisOf(afterFirstLine(exo.prompt));
    const present = street.some((emoji) => placeOfEmoji(emoji)?.en === asked);
    return [
      ...isTrue("lieu inconnu", PLACE.some((place) => place.en === asked)),
      ...eq("la bonne réponse", rightOption(exo), present ? "Yes, there is." : "No, there is not."),
      ...eq("la rue a trois dessins", street.length, 3),
      ...isTrue("deux dessins pareils", new Set(street).size === 3),
      ...eq("les choix", [...optionsOf(exo)].sort(), ["No, there is not.", "Yes, there are.", "Yes, there is."]),
    ];
  },
  "cm1-th-ordre": (exo) => {
    const sentence = sequenceOf(exo).join(" ");
    const one = /^There is a ([\w ]+) in my town\.$/.exec(sentence);
    const many = /^There are (two|three) ([\w ]+) in my town\.$/.exec(sentence);
    return [
      ...isTrue(
        `« ${sentence} » n'est pas une phrase juste`,
        (one !== null && PLACE.some((place) => place.en === one[1])) || (many !== null && PLACE.some((place) => place.plural === many[2])),
      ),
    ];
  },
  "cm1-th-ecrire": (exo) => {
    const match = /^Écris le mot qui manque, en anglais\.\nThere ___ (a|two|three) ([\w ]+)\.$/.exec(exo.prompt);
    const place = PLACE.find((candidate) => candidate.en === match?.[2] || candidate.plural === match?.[2]);
    return [
      ...isTrue("phrase inconnue", match !== null && place !== undefined),
      ...eq("is ou are", acceptedOf(exo), [match?.[1] === "a" ? "is" : "are"]),
      ...eq("le nom", match?.[2], match?.[1] === "a" ? place?.en : place?.plural),
    ];
  },
  "cm1-th-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => {
      const emojis = emojisOf(pair.right);
      const place = placeOfEmoji(emojis[0]);
      const expected = emojis.length === 1 ? `There is a ${place?.en}.` : `There are ${COUNT_WORD[emojis.length]} ${place?.plural}.`;
      return isTrue(`dessin inconnu : ${pair.right}`, place !== undefined && new Set(emojis).size === 1).concat(eq(`la phrase de ${pair.right}`, pair.left, expected));
    }),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "cm1-th-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["There is", "There are"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, item.text.startsWith("a ") ? "There is" : "There are")),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
};
const THERE_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "cm1-th-trou": wrongBlank,
  "cm1-th-phrase": shift,
  "cm1-th-rue": shift,
  "cm1-th-ordre": (exo) => ({ ...exo, payload: { ...exo.payload, correctSequence: ["is", "There", ...sequenceOf(exo).slice(2)] } }),
  "cm1-th-ecrire": wrongWrite,
  "cm1-th-relier": swapPairs,
  "cm1-th-glisser": flipFirst("There is", "There are"),
};

const GROUPS: Group[] = [
  { klass: "CE2", checks: SCHOOL_CHECKS, damage: SCHOOL_DAMAGE },
  { klass: "CM1", checks: { ...HOBBY_CHECKS, ...THERE_CHECKS }, damage: { ...HOBBY_DAMAGE, ...THERE_DAMAGE } },
];

describe.each(GROUPS)("les gabarits du lot 4 ($klass)", ({ klass, checks, damage }) => {
  const KINDS = Object.keys(checks) as GameKind[];

  it("ont un vérificateur chacun, et chacun a son exercice abîmé", () => {
    expect(Object.keys(damage).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });

  it("donnent une bonne réponse que leur vérificateur retrouve, à tous les niveaux", () => {
    const failures: string[] = [];
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        const problems = checks[kind](exo);
        if (problems.length > 0) failures.push(`${kind} niveau ${d.level} : ${exo.prompt.replace(/\n/g, " / ")} → ${problems.join(" ; ")}`);
      }
    }
    expect([...new Set(failures)].slice(0, 12)).toEqual([]);
  });

  it("sont vus par leur vérificateur quand on abîme la bonne réponse (le contrôle n'est pas vide)", () => {
    for (const kind of KINDS) {
      let total = 0;
      let seen = 0;
      for (const d of draws) {
        const exo = make(kind, klass, d);
        if (checks[kind](exo).length > 0) continue;
        total += 1;
        if (checks[kind](damage[kind](exo)).length > 0) seen += 1;
      }
      expect(total, kind).toBeGreaterThan(40);
      expect(seen, `${kind} : le vérificateur ne voit pas l'exercice abîmé`).toBe(total);
    }
  });

  it("n'ont aucun deux-points, au plus une apostrophe et vingt-huit mots dans l'énoncé", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect((exo.prompt.match(/'/g) ?? []).length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        const words = exo.prompt
          .replace(/\p{Extended_Pictographic}/gu, " ")
          .split(/\s+/)
          .filter((token) => /[\p{L}\p{N}]/u.test(token));
        expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      }
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation ni liaison, et d'Unicode 11 au plus", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
        expect(text, kind).not.toContain(String.fromCodePoint(0xfe0f));
        expect(text, kind).not.toContain(String.fromCodePoint(0x200d));
        for (const glyph of text.match(/\p{Extended_Pictographic}/gu) ?? []) {
          const code = glyph.codePointAt(0) as number;
          expect(code >= 0x1fa70 || (code >= 0x1f9c3 && code <= 0x1f9cf) || (code >= 0x1f7e0 && code <= 0x1f7eb) || code === 0x1f90d || code === 0x1f90e, `${kind} : ${glyph}`).toBe(false);
        }
      }
    }
  });

  it("donnent trois indices différents, qui n'écrivent pas la bonne réponse, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext(klass, 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext(klass, 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints, kind).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
      for (const d of draws.slice(0, 80)) {
        const exo = make(kind, klass, d);
        const answer = String(exo.answerKey);
        if (answer.length < 4 || /^\d+$/.test(answer)) continue;
        for (const hint of exo.hints) expect(hint.toLowerCase(), `${kind} : « ${hint} » écrit « ${answer} »`).not.toContain(answer.toLowerCase());
      }
    }
  });

  it("passent le contrôleur de l'anglais sans aucun défaut, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: klass, subject: "Anglais" });
        expect(defects, `${kind} niveau ${d.level} : ${exo.prompt}`).toEqual([]);
      }
    }
  });

  it("se refont, sans le modèle, quand un exercice est raté", () => {
    for (const kind of KINDS) {
      for (let n = 0; n < 10; n++) {
        const again = regenerateGame({ kind, level: 2 }, klass, `refait:${kind}:${n}`);
        expect(again, kind).not.toBeNull();
        expect(checks[kind](again as unknown as Exo), kind).toEqual([]);
      }
    }
  });
});

describe("les listes du lot 4", () => {
  it("donnent à chaque dessin une matière que le test connaît aussi, et à chaque rangée trois matières et trois jours différents", () => {
    expect(Object.fromEntries(SUBJECTS.map((subject) => [subject.emoji, subject.en]))).toEqual(SUBJECT_OF);
    for (const table of TIMETABLES) {
      expect(new Set(table.map(([, subject]) => subject)).size).toBe(3);
      expect(new Set(table.map(([day]) => day)).size).toBe(3);
    }
    expect(TIMETABLES).toHaveLength(12);
  });

  it("donnent à chaque loisir son -ing, et à chaque lieu son pluriel", () => {
    expect(HOBBIES.map((hobby) => [hobby.verb, hobby.object, hobby.ing, hobby.emoji])).toEqual(HOB.map((hobby) => [hobby.verb, hobby.obj, hobby.ing, hobby.emoji]));
    for (const hobby of HOBBIES) for (const wrong of hobby.wrongIng) expect(VALID_ING.has(wrong), `${hobby.verb} : ${wrong}`).toBe(false);
    expect(PLACES.map((place) => [place.en, place.plural, place.emoji])).toEqual(PLACE.filter((place) => place.emoji).map((place) => [place.en, place.plural, place.emoji]));
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les trois thématiques du lot 4", () => {
  const TOPICS = [
    { key: "an-ce2-school", klass: "CE2" as const },
    { key: "an-cm1-hobbies", klass: "CM1" as const },
    { key: "an-cm1-there-is", klass: "CM1" as const },
  ];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const allChecks: Record<string, Check> = { ...SCHOOL_CHECKS, ...HOBBY_CHECKS, ...THERE_CHECKS };

  it("sont dans la bonne classe, dans l'ordre du plan, en trois paliers, sans le modèle", () => {
    const keys = (klass: string) =>
      allProgrammeEntries()
        .filter((e) => e.klass === klass && /^an-/.test(e.topic.key))
        .map((e) => e.topic.key);
    expect(keys("CE2").at(-1)).toBe("an-ce2-school");
    expect(keys("CM1")).toEqual([
      "an-cm1-present-simple",
      "an-cm1-he-she-it",
      "an-cm1-routine",
      "an-cm1-continuous",
      "an-cm1-hobbies",
      "an-cm1-jobs",
      "an-cm1-market",
      "an-cm1-describe",
      "an-cm1-there-is",
    ]);
    for (const { key, klass } of TOPICS) {
      expect(entryOf(key).klass, key).toBe(klass);
      expect(entryOf(key).topic.palierCount, key).toBe(3);
      const specs = entryOf(key).topic.games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("fabriquent des paliers entiers de dix exercices tous différents, justes, qui passent le contrôleur", () => {
    for (const { key, klass } of TOPICS) {
      for (let n = 0; n < 30; n++) {
        for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
          const games = generateGames(entryOf(key).topic.games ?? [], { klass, palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}|${String(game.payload.text ?? "")}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            expect(allChecks[kind](game as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toEqual([]);
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: klass, subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const { key, klass } of TOPICS) {
      for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
        const games = generateGames(entryOf(key).topic.games ?? [], { klass, palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent le doublement de la lettre (swimming, running) et le e qui tombe (dancing) pour le troisième palier des loisirs", () => {
    const verbsAt = (palierIndex: number) => {
      const found = new Set<string>();
      for (let n = 0; n < 30; n++) {
        for (const game of generateGames(entryOf("an-cm1-hobbies").topic.games ?? [], { klass: "CM1", palierIndex, palierCount: 3, seed: `hb:${n}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (kind === "cm1-hb-ecrire") found.add(/\((\w+)\)\.$/.exec(game.prompt)![1]);
        }
      }
      return found;
    };
    for (const palierIndex of [1, 2]) {
      const found = verbsAt(palierIndex);
      for (const hard of ["dance", "swim", "run"]) expect(found.has(hard), `palier ${palierIndex} : ${hard}`).toBe(false);
    }
    expect([...verbsAt(3)].every((verb) => ["dance", "swim", "run"].includes(verb))).toBe(true);
  });
});
