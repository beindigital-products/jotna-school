import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

/**
 * LES GABARITS DU CP EN HISTOIRE ET EN GÉOGRAPHIE : le calendrier, les durées, les fréquences, l'emploi du
 * temps ; l'itinéraire, les distances, le plan vu de dessus, le quartier.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part
 * (les mois, les jours, les durées, les fréquences de la fiche, les cours, les lieux) : un gabarit dont la
 * réponse contredit sa table échoue. L'échantillon que le modèle avait écrit sur ces thématiques comptait
 * seize exercices faux sur vingt-trois en géographie et sept sur vingt et un en histoire (un emploi du temps
 * absent, deux mois de la saison sèche faux, des ordres sans critère, une réponse libre qui refuse la bonne).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `cp:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

const MONTH_LIST = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const WEEK = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const ORDINAL_MONTH: Record<string, number> = {
  premier: 0,
  deuxième: 1,
  troisième: 2,
  quatrième: 3,
  cinquième: 4,
  sixième: 5,
  septième: 6,
  huitième: 7,
  neuvième: 8,
  dixième: 9,
  onzième: 10,
  dernier: 11,
};

/** Les durées, de la plus courte à la plus longue : le rang dit tout. */
const DURATION_RANK: Record<string, number> = { récréation: 0, journée: 1, semaine: 2, mois: 3, année: 4 };
const THAN: Record<string, string> = { "qu'une récréation": "récréation", "qu'une journée": "journée", "qu'une semaine": "semaine", "qu'un mois": "mois", "qu'une année": "année" };

/** Ce que contient chaque durée : la table du calendrier. */
const CONTAINS: Record<string, { number: string; unit: string }> = {
  semaine: { number: "7", unit: "jours" },
  année: { number: "12", unit: "mois" },
  jour: { number: "24", unit: "heures" },
  heure: { number: "60", unit: "minutes" },
};

/** Les moments de la fiche de `hi-cp-frequences` et leur seul rythme. */
const FREQUENCY_OF: Record<string, string> = {
  "Aller à l'école": "Tous les jours",
  "Jour de marché": "Chaque semaine",
  Anniversaire: "Chaque année",
  Tabaski: "Chaque année",
  Korité: "Chaque année",
  Noël: "Chaque année",
  Indépendance: "Chaque année",
};
const FREQUENCY_RANK: Record<string, number> = { "Tous les jours": 0, "Chaque semaine": 1, "Chaque année": 2 };
const ASK_TO_MOMENT: Record<string, string> = {
  "Quand va-t-on à l'école ?": "Aller à l'école",
  "Quand revient le jour de marché ?": "Jour de marché",
  "Quand revient ton anniversaire ?": "Anniversaire",
  "Quand revient la Tabaski ?": "Tabaski",
  "Quand revient la Korité ?": "Korité",
  "Quand revient Noël ?": "Noël",
  "Quand revient la fête de l'indépendance ?": "Indépendance",
};
const GAP_TO_MOMENT: Record<string, string> = {
  "On va à l'école tous les ___.": "Aller à l'école",
  "Le jour de marché revient chaque ___.": "Jour de marché",
  "Mon anniversaire revient chaque ___.": "Anniversaire",
  "La Tabaski revient chaque ___.": "Tabaski",
  "La Korité revient chaque ___.": "Korité",
  "Noël revient chaque ___.": "Noël",
  "La fête de l'indépendance revient chaque ___.": "Indépendance",
};
/** Le mot qui complète « … chaque ___ » ou « … tous les ___ » selon le rythme. */
const FREQUENCY_WORD: Record<string, string> = { "Tous les jours": "jours", "Chaque semaine": "semaine", "Chaque année": "année" };

const SCHOOL_DAYS_OK = ["lundi", "mardi", "mercredi", "vendredi"];
const COURSE_LIST = ["lecture", "écriture", "maths", "dessin", "chant", "sport"];

const HISTORY_KINDS = [
  "mois-ordre",
  "mois-voisin",
  "mois-rang",
  "mois-trou",
  "mois-ecart",
  "date-lire",
  "calendrier-jour",
  "mois-relier",
  "mois-avant-apres",
  "duree-plus-long",
  "duree-ordre",
  "duree-relier",
  "duree-glisser",
  "duree-unites",
  "frequence-glisser",
  "frequence-qcm",
  "frequence-trou",
  "frequence-relier",
  "frequence-ordre",
  "edt-apres",
  "edt-quand",
  "edt-ordre",
  "edt-trou",
  "edt-semaine",
] as const satisfies readonly GameKind[];


// ===========================================================================
// LES MOIS ET LES DATES
// ===========================================================================

describe("les gabarits des mois recalculent juste, depuis une table écrite à part", () => {
  it("mois-ordre : des mois dans l'ordre de l'année, qui se suivent aux deux premiers paliers", () => {
    for (const d of draws) {
      const exo = make("mois-ordre", d);
      const sequence = sequenceOf(exo);
      const ranks = sequence.map((name) => MONTH_LIST.indexOf(name));
      expect(ranks.every((r) => r >= 0), exo.answerKey).toBe(true);
      expect(ranks, exo.answerKey).toEqual([...ranks].sort((a, b) => a - b));
      expect(new Set(sequence).size).toBe(sequence.length);
      expect(sequence.length, exo.answerKey).toBe(d.level === 1 ? 3 : 4);
      if (d.level < 3) expect(ranks.every((r, i) => i === 0 || r - ranks[i - 1] === 1), exo.answerKey).toBe(true);
    }
  });

  it("mois-voisin : le mois juste avant ou juste après, jamais le mois de la question parmi les choix", () => {
    for (const d of draws) {
      const exo = make("mois-voisin", d);
      const [, direction, cited] = /^Quel mois vient juste (après|avant) (\p{L}+) \?$/u.exec(exo.prompt) as RegExpExecArray;
      const at = MONTH_LIST.indexOf(cited);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(rightOption(exo), exo.prompt).toBe(MONTH_LIST[at + (direction === "après" ? 1 : -1)]);
      expect(optionsOf(exo), exo.prompt).not.toContain(cited);
      expect(optionsOf(exo).every((o) => MONTH_LIST.includes(o))).toBe(true);
      if (d.level === 1) expect(direction).toBe("après");
    }
  });

  it("mois-rang : le rang demandé est celui du mois de la bonne réponse", () => {
    for (const d of draws) {
      const exo = make("mois-rang", d);
      const word = /^Quel est le (\p{L}+) mois de l'année \?$/u.exec(exo.prompt)![1];
      expect(rightOption(exo), exo.prompt).toBe(MONTH_LIST[ORDINAL_MONTH[word]]);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      if (d.level === 1) expect(["premier", "deuxième", "troisième", "dernier"], exo.prompt).toContain(word);
      if (d.level === 2) expect(ORDINAL_MONTH[word] <= 5 || word === "dernier", exo.prompt).toBe(true);
    }
  });

  it("mois-rang : trois questions d'un même palier ne se répètent pas", () => {
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "mois-rang", count: 3 }], { klass: "CP", palierIndex: 2, palierCount: 3, seed: `rang:${n}` });
      expect(new Set(games.map((game) => game.prompt)).size, `graine ${n}`).toBe(3);
    }
  });

  it("mois-trou : le trou est le mois qui complète des mois qui se suivent, aucun mauvais choix ne les complète", () => {
    for (const d of draws) {
      const exo = make("mois-trou", d);
      const text = exo.payload.text as string;
      const shown = text.replace(/\.$/, "").split(", ");
      const hole = shown.indexOf("___");
      expect(hole, text).toBeGreaterThanOrEqual(0);
      expect(shown.length, text).toBe(d.level === 1 ? 3 : d.level === 2 ? 4 : 5);
      const known = shown.findIndex((name) => name !== "___");
      const expected = MONTH_LIST[MONTH_LIST.indexOf(shown[known]) + (hole - known)];
      expect(blankOf(exo).answer, text).toBe(expected);
      const run = shown.map((name, i) => (i === hole ? expected : name));
      expect(run.every((name, i) => i === 0 || MONTH_LIST.indexOf(name) - MONTH_LIST.indexOf(run[i - 1]) === 1), text).toBe(true);
      expect(new Set(blankOf(exo).options).size).toBe(3);
      for (const option of blankOf(exo).options.filter((o) => o !== expected)) expect(run, option).not.toContain(option);
    }
  });

  it("mois-ecart : le nombre de mois entre deux mois de la même année, à écrire en chiffres", () => {
    for (const d of draws) {
      const exo = make("mois-ecart", d);
      const [, from, to] = /^Nous sommes en (\p{L}+)\. Dans combien de mois sera (\p{L}+) \? Écris le nombre\.$/u.exec(exo.prompt) as RegExpExecArray;
      const gap = MONTH_LIST.indexOf(to) - MONTH_LIST.indexOf(from);
      expect(gap, exo.prompt).toBeGreaterThanOrEqual(1);
      expect(exo.payload.acceptedAnswers, exo.prompt).toEqual([String(gap)]);
      expect(exo.answerKey).toBe(String(gap));
      expect(gap, exo.prompt).toBeLessThanOrEqual(d.level === 1 ? 2 : d.level === 2 ? 4 : 6);
      expect(exo.payload.options).toBeUndefined();
    }
  });

  it("date-lire : le mois, le jour ou l'année de la date écrite dans l'énoncé", () => {
    const seen = new Set<string>();
    for (const d of draws) {
      const exo = make("date-lire", d);
      const [, day, name, year, ask] = /^Voici une date, le (\d+) (\p{L}+) (\d+)\. (.+)$/u.exec(exo.prompt) as RegExpExecArray;
      expect(MONTH_LIST, exo.prompt).toContain(name);
      expect(Number(day), exo.prompt).toBeGreaterThanOrEqual(2);
      expect(Number(day), exo.prompt).toBeLessThanOrEqual(28);
      const expected = ask === "Quel est le mois ?" ? name : ask === "Quel est le jour du mois ?" ? day : ask === "Quelle est l'année ?" ? year : "?";
      expect(expected, exo.prompt).not.toBe("?");
      expect(rightOption(exo), exo.prompt).toBe(expected);
      seen.add(ask);
      if (d.level === 1) expect(ask).toBe("Quel est le mois ?");
      if (d.level === 2) expect(ask).not.toBe("Quelle est l'année ?");
    }
    expect(seen.size).toBe(3);
  });

  it("calendrier-jour : quel jour de la semaine tombe une autre date du même mois", () => {
    for (const d of draws) {
      const exo = make("calendrier-jour", d);
      const [, day, name, cited, ask, otherDay, otherName] = /^Le (\d+) (\p{L}+) est un (\p{L}+)\. (Quel jour) est le (\d+) (\p{L}+) \?$/u.exec(
        exo.prompt,
      ) as RegExpExecArray;
      expect(ask).toBe("Quel jour");
      expect(otherName, exo.prompt).toBe(name);
      const delta = Number(otherDay) - Number(day);
      const expected = WEEK[(((WEEK.indexOf(cited) + delta) % 7) + 7) % 7];
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect(delta, exo.prompt).not.toBe(0);
      if (d.level === 1) expect(delta).toBe(1);
      if (d.level === 2) expect([1, 2, 7]).toContain(delta);
      expect(Number(day), exo.prompt).toBeGreaterThanOrEqual(3);
      expect(Number(otherDay), exo.prompt).toBeLessThanOrEqual(28);
      // Le jour cité n'est un choix que lorsqu'il est la réponse (sept jours plus tard).
      if (expected !== cited) expect(optionsOf(exo), exo.prompt).not.toContain(cited);
      expect(new Set(optionsOf(exo)).size).toBe(3);
    }
  });

  it("mois-relier : chaque mois est relié à celui qui vient juste après (ou avant), jamais un mois des deux côtés", () => {
    for (const d of draws) {
      const exo = make("mois-relier", d);
      const pairs = pairsOf(exo);
      const after = /juste après\.$/.test(exo.prompt);
      expect(after || /juste avant\.$/.test(exo.prompt), exo.prompt).toBe(true);
      expect(pairs).toHaveLength(3);
      for (const pair of pairs) expect(MONTH_LIST.indexOf(pair.right) - MONTH_LIST.indexOf(pair.left), `${pair.left} ~ ${pair.right}`).toBe(after ? 1 : -1);
      const lefts = pairs.map((p) => p.left);
      const rights = pairs.map((p) => p.right);
      expect(new Set([...lefts, ...rights]).size).toBe(6);
      if (d.level < 3) expect(after).toBe(true);
    }
  });

  it("mois-avant-apres : chaque mois est rangé selon sa place par rapport au mois de repère, un mois au moins de chaque côté", () => {
    for (const d of draws) {
      const exo = make("mois-avant-apres", d);
      const reference = /^Glisse chaque mois avant ou après (\p{L}+)\.$/u.exec(exo.prompt)![1];
      const at = MONTH_LIST.indexOf(reference);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(2);
      expect(at, exo.prompt).toBeLessThanOrEqual(9);
      expect(zonesOf(exo)).toEqual([`Avant ${reference}`, `Après ${reference}`]);
      const items = itemsOf(exo);
      expect(items.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      for (const item of items) {
        expect(item.text, exo.prompt).not.toBe(reference);
        expect(item.correctZone, item.text).toBe(MONTH_LIST.indexOf(item.text) < at ? `Avant ${reference}` : `Après ${reference}`);
      }
    }
  });
});

// ===========================================================================
// LES DURÉES
// ===========================================================================

describe("les gabarits des durées recalculent juste", () => {
  it("duree-plus-long : la durée la plus longue, la plus courte, ou plus longue ou plus courte que celle citée", () => {
    const kinds = new Set<string>();
    for (const d of draws) {
      const exo = make("duree-plus-long", d);
      const options = optionsOf(exo);
      const ranks = options.map((o) => DURATION_RANK[o]);
      expect(ranks.every((r) => r !== undefined), exo.prompt).toBe(true);
      expect(new Set(options).size).toBe(3);
      const right = DURATION_RANK[rightOption(exo)];
      if (exo.prompt === "Lequel dure le plus longtemps ?") {
        expect(right, exo.prompt).toBe(Math.max(...ranks));
        kinds.add("plus long");
      } else if (exo.prompt === "Lequel dure le moins longtemps ?") {
        expect(right, exo.prompt).toBe(Math.min(...ranks));
        kinds.add("plus court");
      } else {
        const [, comparison, than] = /^Lequel dure (plus|moins) longtemps (qu'une? \p{L}+) \?$/u.exec(exo.prompt) as RegExpExecArray;
        const cited = DURATION_RANK[THAN[than]];
        expect(options, exo.prompt).not.toContain(THAN[than]);
        const good = options.filter((o) => (comparison === "plus" ? DURATION_RANK[o] > cited : DURATION_RANK[o] < cited));
        expect(good, exo.prompt).toEqual([rightOption(exo)]);
        kinds.add(comparison);
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(2);
      }
    }
    expect(kinds.size).toBe(4);
  });

  it("duree-ordre : les durées sont rangées selon le sens écrit dans l'énoncé", () => {
    for (const d of draws) {
      const exo = make("duree-ordre", d);
      const sequence = sequenceOf(exo);
      const ranks = sequence.map((name) => DURATION_RANK[name]);
      expect(ranks.every((r) => r !== undefined)).toBe(true);
      expect(new Set(sequence).size).toBe(sequence.length);
      expect(sequence.length, exo.prompt).toBe(d.level === 1 ? 3 : d.level === 2 ? 4 : 5);
      const ascending = exo.prompt === "Mets ces durées du plus court au plus long.";
      const descending = exo.prompt === "Mets ces durées du plus long au plus court.";
      expect(ascending || descending, exo.prompt).toBe(true);
      expect(ranks, exo.prompt).toEqual([...ranks].sort((a, b) => (ascending ? a - b : b - a)));
      if (d.level === 1) expect(ascending).toBe(true);
    }
  });

  it("duree-relier : chaque durée est reliée à ce qu'elle contient, d'après la table du calendrier", () => {
    for (const d of draws) {
      const exo = make("duree-relier", d);
      const pairs = pairsOf(exo);
      expect(pairs).toHaveLength(3);
      for (const pair of pairs) {
        const fact = CONTAINS[pair.left];
        expect(fact, pair.left).toBeDefined();
        expect(pair.right, pair.left).toBe(`${fact.number} ${fact.unit}`);
      }
      expect(new Set(pairs.map((p) => p.left)).size).toBe(3);
      expect(new Set(pairs.map((p) => p.right)).size).toBe(3);
    }
  });

  it("duree-glisser : chaque durée est plus courte ou plus longue que celle de l'énoncé", () => {
    for (const d of draws) {
      const exo = make("duree-glisser", d);
      const [, than] = /^Glisse chaque durée dans sa case, plus court ou plus long (qu'une? \p{L}+)\.$/u.exec(exo.prompt) as RegExpExecArray;
      const cited = DURATION_RANK[THAN[than]];
      expect(zonesOf(exo)).toEqual(["Plus court", "Plus long"]);
      const items = itemsOf(exo);
      expect(items.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      for (const item of items) {
        expect(item.text, exo.prompt).not.toBe(THAN[than]);
        expect(item.correctZone, item.text).toBe(DURATION_RANK[item.text] < cited ? "Plus court" : "Plus long");
      }
    }
  });

  it("duree-unites : le mot du trou est celui du calendrier, aucun autre ne rend la phrase vraie", () => {
    const TRUE_SENTENCES = new Set([
      "Une semaine dure 7 jours.",
      "Une année dure 12 mois.",
      "Un jour dure 24 heures.",
      "Une heure dure 60 minutes.",
    ]);
    for (const d of draws) {
      const exo = make("duree-unites", d);
      const text = exo.payload.text as string;
      const { options, answer } = blankOf(exo);
      expect(TRUE_SENTENCES.has(text.replace("___", answer)), text).toBe(true);
      for (const option of options.filter((o) => o !== answer)) expect(TRUE_SENTENCES.has(text.replace("___", option)), `${text} avec ${option}`).toBe(false);
      expect(new Set(options).size).toBe(3);
    }
  });
});

// ===========================================================================
// LES FRÉQUENCES
// ===========================================================================

describe("les gabarits des fréquences s'en tiennent à la fiche", () => {
  it("frequence-glisser : chaque moment va dans le rythme que la fiche lui donne, chaque case reçoit un moment", () => {
    for (const d of draws) {
      const exo = make("frequence-glisser", d);
      expect(zonesOf(exo)).toEqual(["Tous les jours", "Chaque semaine", "Chaque année"]);
      const items = itemsOf(exo);
      expect(items.length, exo.prompt).toBe(d.level === 1 ? 3 : d.level === 2 ? 4 : 5);
      for (const item of items) expect(item.correctZone, item.text).toBe(FREQUENCY_OF[item.text]);
    }
  });

  it("frequence-qcm : le rythme du moment de la question, parmi les trois rythmes de la fiche", () => {
    const asked = new Set<string>();
    for (const d of draws) {
      const exo = make("frequence-qcm", d);
      const moment = ASK_TO_MOMENT[exo.prompt];
      expect(moment, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(FREQUENCY_OF[moment]);
      expect([...optionsOf(exo)].sort()).toEqual(["Chaque année", "Chaque semaine", "Tous les jours"]);
      asked.add(moment);
    }
    expect(asked.size).toBe(7);
  });

  it("frequence-qcm : trois questions d'un même palier ne se répètent pas", () => {
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "frequence-qcm", count: 3 }], { klass: "CP", palierIndex: 2, palierCount: 3, seed: `freq:${n}` });
      expect(new Set(games.map((game) => game.prompt)).size, `graine ${n}`).toBe(3);
    }
  });

  it("frequence-trou : le mot du trou est celui du rythme du moment, un seul des trois va", () => {
    for (const d of draws) {
      const exo = make("frequence-trou", d);
      const text = exo.payload.text as string;
      const moment = GAP_TO_MOMENT[text];
      expect(moment, text).toBeDefined();
      const { options, answer } = blankOf(exo);
      expect(answer, text).toBe(FREQUENCY_WORD[FREQUENCY_OF[moment]]);
      expect(new Set(options).size).toBe(3);
      // Les deux autres mots sont d'autres rythmes ou d'autres unités : ils ne conviennent pas à CE moment.
      for (const option of options.filter((o) => o !== answer)) expect(option, text).not.toBe(FREQUENCY_WORD[FREQUENCY_OF[moment]]);
    }
  });

  it("frequence-relier : un moment de chaque rythme, relié à son rythme", () => {
    for (const d of draws) {
      const exo = make("frequence-relier", d);
      const pairs = pairsOf(exo);
      expect(pairs).toHaveLength(3);
      for (const pair of pairs) expect(pair.right, pair.left).toBe(FREQUENCY_OF[pair.left]);
      expect(new Set(pairs.map((p) => p.right)).size).toBe(3);
    }
  });

  it("frequence-ordre : du moment le plus fréquent au moins fréquent, un de chaque rythme", () => {
    for (const d of draws) {
      const exo = make("frequence-ordre", d);
      const sequence = sequenceOf(exo);
      expect(sequence).toHaveLength(3);
      expect(sequence.map((moment) => FREQUENCY_RANK[FREQUENCY_OF[moment]])).toEqual([0, 1, 2]);
    }
  });
});

// ===========================================================================
// L'EMPLOI DU TEMPS
// ===========================================================================

type Timetable = { rows: { hour: number; label: string }[]; question: string };

/** L'emploi du temps écrit dans l'énoncé : « 8 h Lecture », une ligne par heure, puis la question. */
function readTimetable(prompt: string): Timetable {
  const lines = prompt.split("\n");
  expect(lines[0], prompt).toBe("Regarde l'emploi du temps.");
  const rows = lines.slice(1, -1).map((line) => {
    const match = /^(\d+) h (\p{L}+)$/u.exec(line);
    expect(match, `ligne « ${line} »`).not.toBeNull();
    return { hour: Number(match![1]), label: match![2].toLowerCase() };
  });
  return { rows, question: lines[lines.length - 1] };
}

function checkTimetable(prompt: string, level: number) {
  const { rows, question } = readTimetable(prompt);
  expect(rows.length, prompt).toBe(level === 1 ? 4 : 5);
  rows.forEach((row, i) => expect(row.hour, prompt).toBe(8 + i));
  const recess = rows.findIndex((row) => row.label === "récréation");
  expect(recess, prompt).toBeGreaterThanOrEqual(1);
  expect(recess, prompt).toBeLessThanOrEqual(rows.length - 2);
  expect(rows.filter((row) => row.label === "récréation"), prompt).toHaveLength(1);
  const courses = rows.filter((row) => row.label !== "récréation").map((row) => row.label);
  expect(new Set(courses).size, prompt).toBe(courses.length);
  for (const course of courses) expect(COURSE_LIST, prompt).toContain(course);
  return { rows, question, recess, courses };
}

describe("les gabarits de l'emploi du temps lisent l'emploi du temps écrit dans l'énoncé", () => {
  it("edt-apres : le cours juste avant ou juste après la récréation", () => {
    for (const d of draws) {
      const exo = make("edt-apres", d);
      const { rows, question, recess } = checkTimetable(exo.prompt, d.level);
      const [, direction] = /^Quel cours vient juste (après|avant) la récréation \?$/u.exec(question) as RegExpExecArray;
      expect(rightOption(exo), exo.prompt).toBe(rows[recess + (direction === "après" ? 1 : -1)].label);
      expect(optionsOf(exo), exo.prompt).not.toContain("récréation");
      expect(new Set(optionsOf(exo)).size).toBe(3);
      for (const option of optionsOf(exo)) expect(rows.map((r) => r.label), exo.prompt).toContain(option);
      if (d.level === 1) expect(direction).toBe("après");
    }
  });

  it("edt-quand : l'heure écrite devant la ligne du cours ou de la récréation", () => {
    for (const d of draws) {
      const exo = make("edt-quand", d);
      const { rows, question } = checkTimetable(exo.prompt, d.level);
      const match = /^À quelle heure commence (la récréation|le cours de (\p{L}+)) \?$/u.exec(question) as RegExpExecArray;
      const label = match[2] ?? "récréation";
      expect(rightOption(exo), exo.prompt).toBe(`${rows.find((r) => r.label === label)!.hour} h`);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      for (const option of optionsOf(exo)) expect(rows.map((r) => `${r.hour} h`), exo.prompt).toContain(option);
    }
  });

  it("edt-ordre : les cours cités sont rangés comme l'emploi du temps les écrit, du premier au dernier ou l'inverse", () => {
    for (const d of draws) {
      const exo = make("edt-ordre", d);
      const { rows, question } = checkTimetable(exo.prompt, d.level);
      const reverse = question === "Mets ces cours du dernier au premier.";
      expect(reverse || question === "Mets ces cours du premier au dernier.", exo.prompt).toBe(true);
      const sequence = sequenceOf(exo);
      expect(sequence.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      const hours = sequence.map((course) => rows.find((r) => r.label === course)!.hour);
      expect(hours, exo.prompt).toEqual([...hours].sort((a, b) => (reverse ? b - a : a - b)));
      expect(sequence, exo.prompt).not.toContain("récréation");
      if (d.level === 1) expect(reverse).toBe(false);
    }
  });

  it("edt-trou : le cours du trou est celui qui suit ou précède la récréation dans l'emploi du temps", () => {
    for (const d of draws) {
      const exo = make("edt-trou", d);
      const { rows, question, recess } = checkTimetable(exo.prompt, d.level);
      expect(question).toBe("Complète la phrase.");
      const text = exo.payload.text as string;
      const [, direction] = /^(Après|Avant) la récréation, il y a le cours de ___\.$/u.exec(text) as RegExpExecArray;
      expect(blankOf(exo).answer, exo.prompt).toBe(rows[recess + (direction === "Après" ? 1 : -1)].label);
      expect(new Set(blankOf(exo).options).size).toBe(3);
      for (const option of blankOf(exo).options) expect(rows.map((r) => r.label), exo.prompt).toContain(option);
      expect(blankOf(exo).options).not.toContain("récréation");
    }
  });

  it("edt-semaine : le cours d'un jour ou le jour d'un cours, lus dans le tableau de la semaine", () => {
    const seen = new Set<string>();
    for (const d of draws) {
      const exo = make("edt-semaine", d);
      const lines = exo.prompt.split("\n");
      expect(lines[0]).toBe("Voici l'emploi du temps de la semaine.");
      const rows = lines.slice(1, -1).map((line) => {
        const [day, course] = line.split(" ");
        return { day: day.toLowerCase(), course: course.toLowerCase() };
      });
      expect(rows.map((r) => r.day)).toEqual(SCHOOL_DAYS_OK);
      expect(new Set(rows.map((r) => r.course)).size).toBe(4);
      for (const row of rows) expect(COURSE_LIST).toContain(row.course);
      const question = lines[lines.length - 1];
      const byDay = /^Quel cours a-t-on le (\p{L}+) \?$/u.exec(question);
      if (byDay) {
        expect(rightOption(exo), exo.prompt).toBe(rows.find((r) => r.day === byDay[1])!.course);
        for (const option of optionsOf(exo)) expect(rows.map((r) => r.course)).toContain(option);
        seen.add("jour");
      } else {
        const byCourse = /^Quel jour a-t-on (\p{L}+) \?$/u.exec(question);
        expect(byCourse, question).not.toBeNull();
        expect(rightOption(exo), exo.prompt).toBe(rows.find((r) => r.course === byCourse![1])!.day);
        for (const option of optionsOf(exo)) expect(SCHOOL_DAYS_OK).toContain(option);
        seen.add("cours");
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(2);
      }
      expect(new Set(optionsOf(exo)).size).toBe(3);
      // Jeudi et samedi ne figurent jamais : selon l'école, la demi-journée libre n'est pas la même.
      expect(exo.prompt).not.toMatch(/jeudi|samedi|dimanche/i);
    }
    expect(seen.size).toBe(2);
  });
});

// ===========================================================================
// LA GÉOGRAPHIE : LES TABLES DE VÉRITÉ
// ===========================================================================

const PLACE_NAMES = ["maison", "boutique", "mosquée", "école", "marché", "puits", "dispensaire", "jardin", "terrain de football"];
const MASCULINE_NAMES = ["marché", "puits", "dispensaire", "jardin", "terrain de football"];
const WALK_NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"];
const FUNCTION_OF: Record<string, string> = {
  école: "apprendre",
  marché: "acheter",
  mosquée: "prier",
  dispensaire: "se soigner",
  "terrain de football": "jouer",
};

/** Les lieux d'un texte, dans l'ordre où ils sont écrits. */
function placesIn(text: string): string[] {
  const found: { at: number; name: string }[] = [];
  for (const name of PLACE_NAMES) {
    for (const match of text.matchAll(new RegExp(`(?<![\\p{L}])${name}(?![\\p{L}])`, "gu"))) found.push({ at: match.index!, name });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.name);
}

/** Les dessins des quadrillages, avec leur nom : de quoi retrouver le dessin que l'énoncé nomme. */
const LABEL_OF_EMOJI: Record<string, string> = {
  "🥭": "la mangue",
  "🍌": "la banane",
  "🍉": "la pastèque",
  "🍎": "la pomme",
  "🍋": "le citron",
  "🐔": "la poule",
  "🐑": "le mouton",
  "🐄": "la vache",
  "🐟": "le poisson",
  "🐈": "le chat",
  "🐕": "le chien",
  "🦒": "la girafe",
  "📏": "la règle",
  "🎒": "le cartable",
  "📒": "le cahier",
  "⚽": "le ballon",
  "🏠": "la maison",
  "🚗": "la voiture",
  "🚲": "le vélo",
};
const EMOJI_OF_LABEL = Object.fromEntries(Object.entries(LABEL_OF_EMOJI).map(([emoji, label]) => [label, emoji]));
const PLURAL_OF_LABEL: Record<string, string> = {
  "la règle": "règles",
  "le cartable": "cartables",
  "le cahier": "cahiers",
  "la mangue": "mangues",
  "la banane": "bananes",
  "la pastèque": "pastèques",
  "la pomme": "pommes",
  "le citron": "citrons",
  "le ballon": "ballons",
  "la maison": "maisons",
  "la voiture": "voitures",
  "le vélo": "vélos",
  "la poule": "poules",
  "le mouton": "moutons",
  "la vache": "vaches",
  "le chat": "chats",
  "le chien": "chiens",
};
const TABLE_EMOJIS = ["📏", "🎒", "📒", "🥭", "🍌", "🍉", "🍎", "🍋", "⚽"];
const COURT_EMOJIS = ["🏠", "🚗", "🚲", "⚽", "🐔", "🐑", "🐄", "🐈", "🐕"];

const optionLabel = (option: string) => option.split(" ").slice(1).join(" ");
const optionEmoji = (option: string) => option.split(" ")[0];

/** Le quadrillage écrit dans l'énoncé, ligne par ligne : les lignes d'émojis entre la première et la dernière ligne. */
function readGrid(prompt: string): string[][] {
  const lines = prompt.split("\n");
  return lines.slice(1, -1).map((line) => line.split(" "));
}

/** Les places qu'on sait dire sur un plan, d'après les coins et le milieu. */
function placeWords(r: number, c: number, size: number): string | null {
  const last = size - 1;
  if (r === 0 && c === 0) return "en haut à gauche";
  if (r === 0 && c === last) return "en haut à droite";
  if (r === last && c === 0) return "en bas à gauche";
  if (r === last && c === last) return "en bas à droite";
  if (size === 3 && r === 1 && c === 1) return "au milieu";
  return null;
}
function cellOfWords(words: string, size: number): [number, number] {
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (placeWords(r, c, size) === words) return [r, c];
  throw new Error(`place inconnue : ${words}`);
}

const GEOGRAPHY_KINDS = [
  "trajet-case",
  "trajet-tourne",
  "itineraire-ordre",
  "itineraire-passe",
  "itineraire-trou",
  "itineraire-glisser",
  "distance-pas",
  "distance-ordre",
  "mesure-comparer",
  "chemin-court",
  "pas-difference",
  "distance-trou",
  "distance-glisser",
  "plan-ou",
  "plan-objet",
  "plan-compter",
  "plan-glisser",
  "plan-relier",
  "plan-trou",
  "quartier-rue",
  "quartier-ordre",
  "quartier-glisser",
  "quartier-trou",
  "lieu-fonction",
] as const satisfies readonly GameKind[];

const NEW_KINDS: readonly GameKind[] = [...HISTORY_KINDS, ...GEOGRAPHY_KINDS];

// ===========================================================================
// L'ITINÉRAIRE
// ===========================================================================

describe("les gabarits de l'itinéraire recalculent juste, depuis la scène écrite dans l'énoncé", () => {
  it("trajet-case : deux déplacements à angle droit, le pion reste dans le quadrillage", () => {
    for (const d of draws) {
      const exo = make("trajet-case", d);
      const grid = readGrid(exo.prompt);
      expect(grid, exo.prompt).toHaveLength(3);
      for (const row of grid) expect(row, exo.prompt).toHaveLength(3);
      expect(new Set(grid.flat()).size, exo.prompt).toBe(9);
      const last = exo.prompt.split("\n").slice(-1)[0];
      const [, label, text] = /^Le pion est sur (.+?)\. Il (.+)\. Où arrive-t-il \?$/u.exec(last) as RegExpExecArray;
      const parts = text.split(" puis ");
      expect(parts, last).toHaveLength(2);
      const deltas = parts.map((part) => {
        let m = /^(monte|descend) de (\d+) cases?$/u.exec(part);
        if (m) return { dr: (m[1] === "monte" ? -1 : 1) * Number(m[2]), dc: 0, n: Number(m[2]) };
        m = /^va de (\d+) cases? vers la (gauche|droite)$/u.exec(part);
        expect(m, part).not.toBeNull();
        return { dr: 0, dc: (m![2] === "gauche" ? -1 : 1) * Number(m![1]), n: Number(m![1]) };
      });
      // Un déplacement vertical puis un horizontal, ou l'inverse : jamais le même axe deux fois.
      expect(deltas[0].dr !== 0 ? deltas[1].dc !== 0 : deltas[1].dr !== 0, last).toBe(true);
      for (const delta of deltas) expect(delta.n, last).toBeLessThanOrEqual(d.level === 1 ? 1 : 2);
      const flatGrid = grid.flat();
      const startIndex = flatGrid.findIndex((emoji) => LABEL_OF_EMOJI[emoji] === label);
      expect(startIndex, last).toBeGreaterThanOrEqual(0);
      let r = Math.floor(startIndex / 3);
      let c = startIndex % 3;
      for (const delta of deltas) {
        r += delta.dr;
        c += delta.dc;
        expect(r >= 0 && r < 3 && c >= 0 && c < 3, last).toBe(true);
      }
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[r][c]);
      expect(rightOption(exo)).not.toContain(label);
    }
  });

  it("trajet-tourne : on avance, on tourne à droite ou à gauche du pion, on avance encore", () => {
    const HEADING = ["en haut", "à droite", "en bas", "à gauche"];
    const STEP = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    const seen = new Set<string>();
    for (const d of draws) {
      const exo = make("trajet-tourne", d);
      const grid = readGrid(exo.prompt);
      expect(grid).toHaveLength(3);
      const last = exo.prompt.split("\n").slice(-1)[0];
      const [, label, looks, turn] = /^Le pion est sur (.+?) et regarde (en haut|à droite|en bas|à gauche)\. Il avance de 1 case, tourne à (droite|gauche) et avance de 1 case\. Où arrive-t-il \?$/u.exec(
        last,
      ) as RegExpExecArray;
      const heading = HEADING.indexOf(looks);
      if (d.level <= 2) expect(looks, last).toBe("en haut");
      const flatGrid = grid.flat();
      const startIndex = flatGrid.findIndex((emoji) => LABEL_OF_EMOJI[emoji] === label);
      let r = Math.floor(startIndex / 3) + STEP[heading][0];
      let c = (startIndex % 3) + STEP[heading][1];
      expect(r >= 0 && r < 3 && c >= 0 && c < 3, last).toBe(true);
      const turned = (heading + (turn === "droite" ? 1 : 3)) % 4;
      r += STEP[turned][0];
      c += STEP[turned][1];
      expect(r >= 0 && r < 3 && c >= 0 && c < 3, last).toBe(true);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[r][c]);
      seen.add(`${looks}|${turn}`);
    }
    // Tous les paliers confondus, le pion regarde les quatre côtés et tourne des deux côtés.
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });

  it("itineraire-ordre : les lieux sont rangés dans l'ordre où le trajet les cite, sans l'école", () => {
    for (const d of draws) {
      const exo = make("itineraire-ordre", d);
      const route = exo.prompt.split(". ")[0];
      const stops = placesIn(route);
      expect(sequenceOf(exo), exo.prompt).toEqual(stops);
      expect(stops.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(new Set(stops).size).toBe(stops.length);
      expect(stops, exo.prompt).not.toContain("école");
      expect(stops, exo.prompt).not.toContain("terrain de football");
      expect(exo.prompt).toMatch(/Mets les lieux dans l'ordre du trajet\.$/);
      expect(WALK_NAMES).toContain(exo.prompt.split(" ")[0]);
    }
  });

  it("itineraire-passe : le lieu devant lequel on passe, jamais le départ ni l'arrivée, ni parmi les mauvais choix", () => {
    for (const d of draws) {
      const exo = make("itineraire-passe", d);
      const route = exo.prompt.split(". ")[0];
      const stops = placesIn(route);
      const long = d.level >= 2;
      expect(stops.length, exo.prompt).toBe(long ? 4 : 3);
      expect(/ en premier \?$/.test(exo.prompt), exo.prompt).toBe(long);
      expect(rightOption(exo), exo.prompt).toBe(stops[1]);
      for (const option of optionsOf(exo).filter((o) => o !== stops[1])) {
        // Un mauvais choix est un lieu hors trajet, ou le second lieu devant lequel on passe quand la question dit « en premier ».
        expect(option === stops[0] || option === stops[stops.length - 1], `${option} : ${exo.prompt}`).toBe(false);
        expect(!stops.includes(option) || (long && option === stops[2]), `${option} : ${exo.prompt}`).toBe(true);
      }
    }
  });

  it("itineraire-trou : le lieu du trou est celui devant lequel on passe, tous les lieux sont masculins", () => {
    for (const d of draws) {
      const exo = make("itineraire-trou", d);
      const route = exo.prompt.split("\n")[0].replace(/ Complète la phrase\.$/, "");
      const stops = placesIn(route);
      expect(stops, exo.prompt).toHaveLength(3);
      for (const stop of stops) expect(MASCULINE_NAMES, stop).toContain(stop);
      expect(blankOf(exo).answer, exo.prompt).toBe(stops[1]);
      expect(exo.payload.text as string).toMatch(/^\p{L}+ passe devant le ___\.$/u);
      for (const option of blankOf(exo).options) expect(MASCULINE_NAMES, option).toContain(option);
      for (const option of blankOf(exo).options.filter((o) => o !== stops[1])) expect(stops, option).not.toContain(option);
    }
  });

  it("itineraire-glisser : chaque lieu est rangé avant ou après le lieu de repère, d'après l'ordre du trajet", () => {
    for (const d of draws) {
      const exo = make("itineraire-glisser", d);
      const [route, task] = exo.prompt.split(" Glisse chaque lieu avant ou après ");
      const stops = placesIn(route);
      expect(stops, exo.prompt).toHaveLength(4);
      const reference = placesIn(task)[0];
      const at = stops.indexOf(reference);
      expect(at === 1 || at === 2, exo.prompt).toBe(true);
      expect(reference, exo.prompt).not.toBe("école");
      const items = itemsOf(exo);
      expect(items.map((i) => i.text).sort()).toEqual(stops.filter((s) => s !== reference).sort());
      for (const item of items) {
        const before = stops.indexOf(item.text) < at;
        expect(item.correctZone, `${item.text} : ${exo.prompt}`).toMatch(before ? /^Avant / : /^Après /);
        expect(placesIn(item.correctZone), item.correctZone).toEqual([reference]);
      }
    }
  });
});

// ===========================================================================
// LES DISTANCES
// ===========================================================================

describe("les gabarits des distances recalculent juste, depuis les nombres de pas écrits", () => {
  const WALK = /^Pour aller (.+?), (\p{L}+) fait (\d+) pas, (\p{L}+) (\d+) pas et (\p{L}+) (\d+) pas\. (.+)$/u;
  const walkOf = (prompt: string) => {
    const [, destination, a, sa, b, sb, c, sc, rest] = WALK.exec(prompt) as RegExpExecArray;
    return { destination, kids: [a, b, c], steps: [Number(sa), Number(sb), Number(sc)], rest };
  };
  const range = (level: number): [number, number] => (level === 1 ? [3, 10] : level === 2 ? [5, 20] : [8, 30]);

  it("distance-pas : le moins de pas est le plus près, le plus de pas est le plus loin", () => {
    for (const d of draws) {
      const exo = make("distance-pas", d);
      const { kids, steps, rest, destination } = walkOf(exo.prompt);
      expect(destination, exo.prompt).not.toBe("à la maison");
      const near = rest === "Qui habite le plus près ?";
      expect(near || rest === "Qui habite le plus loin ?", exo.prompt).toBe(true);
      expect(new Set(kids).size).toBe(3);
      const expected = kids[steps.indexOf(near ? Math.min(...steps) : Math.max(...steps))];
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect([...optionsOf(exo)].sort()).toEqual([...kids].sort());
      const sorted = [...steps].sort((a, b) => a - b);
      expect(sorted[1] - sorted[0] >= 2 && sorted[2] - sorted[1] >= 2, exo.prompt).toBe(true);
      const [min, max] = range(d.level);
      for (const step of steps) expect(step >= min && step <= max, exo.prompt).toBe(true);
      if (d.level === 1) expect(near).toBe(true);
    }
  });

  it("distance-ordre : les enfants sont rangés selon leurs pas, dans le sens écrit", () => {
    for (const d of draws) {
      const exo = make("distance-ordre", d);
      const { kids, steps, rest } = walkOf(exo.prompt);
      // Le lieu où l'on va est dit deux fois, « à la boutique » puis « de la boutique » : proche DE QUOI.
      const to = /^Pour aller à la (\p{L}+),/u.exec(exo.prompt)!;
      expect(to, exo.prompt).not.toBeNull();
      const from = `de la ${to[1]}`;
      const ascending = rest === `Mets-les du plus près au plus loin ${from}.`;
      expect(ascending || rest === `Mets-les du plus loin ${from} au plus près.`, exo.prompt).toBe(true);
      const order = [0, 1, 2].sort((a, b) => (ascending ? steps[a] - steps[b] : steps[b] - steps[a]));
      expect(sequenceOf(exo), exo.prompt).toEqual(order.map((i) => kids[i]));
      if (d.level === 1) expect(ascending).toBe(true);
    }
  });

  it("mesure-comparer : le plus grand nombre est l'objet le plus long, un seul enfant et une seule unité", () => {
    const FAMILIES: Record<string, string[]> = { empans: ["cahier", "table", "tableau"], pas: ["classe", "cour", "terrain"] };
    const RANGES: Record<string, [number, number]> = {
      cahier: [1, 2],
      table: [5, 7],
      tableau: [10, 13],
      classe: [8, 13],
      cour: [20, 30],
      terrain: [40, 60],
    };
    const seen = new Set<string>();
    for (const d of draws) {
      const exo = make("mesure-comparer", d);
      const match = /^(\p{L}+) mesure avec ses (empans|pas)\. (.+) fait (\d+) (?:empans?|pas), (.+) (\d+) (?:empans?|pas) et (.+) (\d+) (?:empans?|pas)\. Qu'est-ce qui est le plus (long|court) \?$/u.exec(
        exo.prompt,
      ) as RegExpExecArray;
      expect(match, exo.prompt).not.toBeNull();
      const [, name, unit, first, n1, second, n2, third, n3, which] = match;
      expect(WALK_NAMES).toContain(name);
      const objects = [first, second, third].map((text) => text.replace(/^(le|la|Le|La) /, "").toLowerCase());
      expect(objects, exo.prompt).toEqual(FAMILIES[unit]);
      const numbers = [Number(n1), Number(n2), Number(n3)];
      numbers.forEach((n, i) => expect(n >= RANGES[objects[i]][0] && n <= RANGES[objects[i]][1], exo.prompt).toBe(true));
      // Le nombre suit la taille réelle : le plus grand nombre est toujours l'objet le plus grand.
      expect(numbers[0] < numbers[1] && numbers[1] < numbers[2], exo.prompt).toBe(true);
      const expected = objects[numbers.indexOf(which === "long" ? Math.max(...numbers) : Math.min(...numbers))];
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect([...optionsOf(exo)].sort()).toEqual([...objects].sort());
      // Un seul empan s'écrit « 1 empan », jamais « 1 empans ».
      expect(exo.prompt, exo.prompt).not.toMatch(/\b1 empans\b/);
      expect(exo.prompt, exo.prompt).not.toMatch(/\b(?:[2-9]|\d\d+) empan\b/);
      expect(exo.hints.join(" "), exo.prompt).not.toMatch(/de empans/);
      seen.add(`${unit}|${which}`);
      if (d.level === 1) expect(`${unit}|${which}`).toBe("empans|long");
    }
    expect(seen.size).toBe(4);
  });

  it("chemin-court : le chemin du plus petit (ou du plus grand) nombre de pas, parmi trois chemins", () => {
    for (const d of draws) {
      const exo = make("chemin-court", d);
      const [, destination, paths, ask] = /^Trois chemins mènent (.+?)\. (.+) Quel chemin est le plus (court|long) \?$/u.exec(exo.prompt) as RegExpExecArray;
      const entries = [...paths.matchAll(/Par (.+?), (\d+) pas\./gu)].map((m) => ({ via: m[1], steps: Number(m[2]) }));
      expect(entries, exo.prompt).toHaveLength(3);
      const target = ask === "court" ? Math.min(...entries.map((e) => e.steps)) : Math.max(...entries.map((e) => e.steps));
      expect(entries.filter((e) => e.steps === target), exo.prompt).toHaveLength(1);
      expect(rightOption(exo), exo.prompt).toBe(`Par ${entries.find((e) => e.steps === target)!.via}`);
      expect([...optionsOf(exo)].sort()).toEqual(entries.map((e) => `Par ${e.via}`).sort());
      // Le lieu où l'on va n'est pas un lieu par où l'on passe.
      expect(placesIn(destination).length).toBe(1);
      for (const e of entries) expect(placesIn(e.via)[0], exo.prompt).not.toBe(placesIn(destination)[0]);
      const sorted = entries.map((e) => e.steps).sort((a, b) => a - b);
      expect(sorted[1] - sorted[0] >= 2 && sorted[2] - sorted[1] >= 2, exo.prompt).toBe(true);
      if (d.level === 1) expect(ask).toBe("court");
    }
  });

  it("pas-difference : l'écart entre deux nombres de pas, à écrire en chiffres, de plus ou de moins selon l'énoncé", () => {
    for (const d of draws) {
      const exo = make("pas-difference", d);
      const match = /^Pour aller (.+?), (\p{L}+) fait (\d+) pas et (\p{L}+) (\d+) pas\. Combien de pas de (plus|moins) fait (\p{L}+) \? Écris le nombre\.$/u.exec(
        exo.prompt,
      ) as RegExpExecArray;
      expect(match, exo.prompt).not.toBeNull();
      const [, , a, na, b, nb, how, who] = match;
      expect(new Set([a, b]).size).toBe(2);
      expect([a, b]).toContain(who);
      const steps: Record<string, number> = { [a]: Number(na), [b]: Number(nb) };
      const other = who === a ? b : a;
      // « de plus » : celui qui est nommé fait le plus de pas ; « de moins » : le moins.
      if (how === "plus") expect(steps[who], exo.prompt).toBeGreaterThan(steps[other]);
      else expect(steps[who], exo.prompt).toBeLessThan(steps[other]);
      const gap = Math.abs(steps[who] - steps[other]);
      expect(gap, exo.prompt).toBeGreaterThanOrEqual(2);
      expect(exo.payload.acceptedAnswers, exo.prompt).toEqual([String(gap)]);
      expect(exo.answerKey).toBe(String(gap));
      if (d.level === 1) expect(how).toBe("plus");
      const [min, max] = range(d.level);
      for (const value of Object.values(steps)) expect(value >= min && value <= max, exo.prompt).toBe(true);
    }
  });

  it("distance-trou : le lieu du trou est le plus près (ou le plus loin) de chez l'enfant, tous les lieux sont masculins", () => {
    for (const d of draws) {
      const exo = make("distance-trou", d);
      const first = exo.prompt.split("\n")[0];
      const [, name, told] = /^De chez (\p{L}+), (.+)\. Complète la phrase\.$/u.exec(first) as RegExpExecArray;
      const entries = [...told.matchAll(/(?:le|la) (.+?) est à (\d+) pas/gu)].map((m) => ({ place: m[1], steps: Number(m[2]) }));
      expect(entries, first).toHaveLength(3);
      for (const e of entries) expect(MASCULINE_NAMES, e.place).toContain(e.place);
      const near = (exo.payload.text as string).includes("le plus près");
      expect(exo.payload.text, first).toBe(`Le lieu le plus ${near ? "près" : "loin"} de chez ${name} est le ___.`);
      const target = near ? Math.min(...entries.map((e) => e.steps)) : Math.max(...entries.map((e) => e.steps));
      expect(entries.filter((e) => e.steps === target)).toHaveLength(1);
      expect(blankOf(exo).answer, first).toBe(entries.find((e) => e.steps === target)!.place);
      expect([...blankOf(exo).options].sort()).toEqual(entries.map((e) => e.place).sort());
    }
  });

  it("distance-glisser : chaque lieu est plus près ou plus loin que le lieu de l'énoncé, d'après son nombre de pas", () => {
    for (const d of draws) {
      const exo = make("distance-glisser", d);
      const [, limit, rest] = /^.+? est à (\d+) pas de chez \p{L}+\. (.+)$/u.exec(exo.prompt) as RegExpExecArray;
      expect(rest).toMatch(/^Glisse chaque lieu plus près ou plus loin que /);
      expect(zonesOf(exo)).toEqual(["Plus près", "Plus loin"]);
      const reference = placesIn(exo.prompt.split(". ")[0])[0];
      const items = itemsOf(exo);
      expect(items.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      for (const item of items) {
        const [, tile, steps] = /^(.+?) (\d+) pas$/u.exec(item.text) as RegExpExecArray;
        expect(tile.toLowerCase(), exo.prompt).not.toBe(reference);
        expect(tile, exo.prompt).not.toBe("Maison");
        expect(Number(steps), item.text).not.toBe(Number(limit));
        expect(item.correctZone, `${item.text} : ${exo.prompt}`).toBe(Number(steps) < Number(limit) ? "Plus près" : "Plus loin");
      }
      expect(reference).not.toBe("école");
    }
  });
});

// ===========================================================================
// LE PLAN VU DE DESSUS
// ===========================================================================

describe("les gabarits du plan recalculent juste, depuis le plan dessiné dans l'énoncé", () => {
  const checkPlan = (prompt: string, level: number, size = level === 1 ? 2 : 3) => {
    const first = prompt.split("\n")[0];
    const scene = /^Regarde (la table|la cour) vue de dessus\.$/u.exec(first)![1];
    const grid = readGrid(prompt);
    expect(grid, prompt).toHaveLength(size);
    for (const row of grid) expect(row, prompt).toHaveLength(size);
    const allowed = scene === "la table" ? TABLE_EMOJIS : COURT_EMOJIS;
    for (const emoji of grid.flat()) expect(allowed, prompt).toContain(emoji);
    expect(new Set(grid.flat()).size, prompt).toBe(size * size);
    return { scene, grid };
  };
  const lastLine = (prompt: string) => prompt.split("\n").slice(-1)[0];

  it("plan-ou : la place du dessin nommé, parmi trois places", () => {
    for (const d of draws) {
      const exo = make("plan-ou", d);
      const { grid } = checkPlan(exo.prompt, d.level);
      const size = grid.length;
      const label = /^Où est (.+) \?$/u.exec(lastLine(exo.prompt))![1];
      const emoji = EMOJI_OF_LABEL[label];
      let words: string | null = null;
      grid.forEach((row, r) => row.forEach((e, c) => e === emoji && (words = placeWords(r, c, size))));
      expect(words, exo.prompt).not.toBeNull();
      expect(rightOption(exo), exo.prompt).toBe(words);
      expect(new Set(optionsOf(exo)).size).toBe(3);
    }
  });

  it("plan-objet : le dessin à la place dite", () => {
    for (const d of draws) {
      const exo = make("plan-objet", d);
      const { grid } = checkPlan(exo.prompt, d.level);
      const words = /^Qu'est-ce qui est (.+) \?$/u.exec(lastLine(exo.prompt))![1];
      const [r, c] = cellOfWords(words, grid.length);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[r][c]);
      expect(optionLabel(rightOption(exo))).toBe(LABEL_OF_EMOJI[grid[r][c]]);
    }
  });

  it("plan-compter : le nombre de fois que le dessin nommé est dessiné", () => {
    for (const d of draws) {
      const exo = make("plan-compter", d);
      const first = exo.prompt.split("\n")[0];
      const scene = /^Regarde (la table|la cour) vue de dessus\.$/u.exec(first)![1];
      const grid = readGrid(exo.prompt);
      expect(grid, exo.prompt).toHaveLength(d.level === 1 ? 2 : 3);
      for (const row of grid) expect(row).toHaveLength(3);
      const allowed = scene === "la table" ? TABLE_EMOJIS : COURT_EMOJIS;
      for (const emoji of grid.flat()) expect(allowed).toContain(emoji);
      const plural = /^Combien de (\p{L}+) y a-t-il \?$/u.exec(lastLine(exo.prompt))![1];
      const label = Object.keys(PLURAL_OF_LABEL).find((l) => PLURAL_OF_LABEL[l] === plural)!;
      const count = grid.flat().filter((emoji) => emoji === EMOJI_OF_LABEL[label]).length;
      expect(count, exo.prompt).toBeGreaterThanOrEqual(1);
      expect(Number(rightOption(exo)), exo.prompt).toBe(count);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      for (const option of optionsOf(exo)) expect(Number(option)).toBeGreaterThanOrEqual(1);
    }
  });

  it("plan-glisser : chaque dessin va dans la moitié du plan où il est dessiné", () => {
    for (const d of draws) {
      const exo = make("plan-glisser", d);
      const { grid } = checkPlan(exo.prompt, d.level, 2);
      const byRows = /en haut ou en bas\.$/.test(exo.prompt);
      expect(byRows || /à gauche ou à droite\.$/.test(exo.prompt), exo.prompt).toBe(true);
      const items = itemsOf(exo);
      expect(items).toHaveLength(4);
      for (const item of items) {
        let r = -1;
        let c = -1;
        grid.forEach((row, i) => row.forEach((e, j) => e === optionEmoji(item.text) && ((r = i), (c = j))));
        expect(r, item.text).toBeGreaterThanOrEqual(0);
        expect(item.correctZone, item.text).toBe(byRows ? (r === 0 ? "En haut" : "En bas") : c === 0 ? "À gauche" : "À droite");
      }
    }
  });

  it("plan-relier : chaque dessin est relié à sa place dans le plan", () => {
    for (const d of draws) {
      const exo = make("plan-relier", d);
      const { grid } = checkPlan(exo.prompt, d.level, 3);
      const pairs = pairsOf(exo);
      expect(pairs).toHaveLength(3);
      expect(new Set(pairs.map((p) => p.right)).size).toBe(3);
      for (const pair of pairs) {
        const [r, c] = cellOfWords(pair.right, 3);
        expect(optionEmoji(pair.left), exo.prompt).toBe(grid[r][c]);
      }
    }
  });

  it("plan-trou : le dessin du trou est celui de la place dite dans la phrase", () => {
    for (const d of draws) {
      const exo = make("plan-trou", d);
      const { grid } = checkPlan(exo.prompt, d.level);
      const words = /^(.+), il y a ___\.$/u.exec(exo.payload.text as string)![1].toLowerCase();
      const [r, c] = cellOfWords(words, grid.length);
      expect(optionEmoji(blankOf(exo).answer), exo.prompt).toBe(grid[r][c]);
      expect(new Set(blankOf(exo).options).size).toBe(3);
    }
  });
});

// ===========================================================================
// LE QUARTIER
// ===========================================================================

describe("les gabarits du quartier recalculent juste, depuis la rue écrite dans l'énoncé", () => {
  const streetOf = (prompt: string) => placesIn(prompt.split(/\. |\n/)[0]);

  it("quartier-rue : le voisin d'un bout, le lieu juste avant ou après, le lieu entre deux", () => {
    const seen = new Set<string>();
    for (const d of draws) {
      const exo = make("quartier-rue", d);
      const [street, question] = exo.prompt.split(". ");
      const stops = placesIn(street);
      expect(stops.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(new Set(stops).size).toBe(stops.length);
      const cited = placesIn(question);
      let expected: string;
      if (/^Quel lieu est à côté /.test(question)) {
        const at = stops.indexOf(cited[0]);
        expect(at === 0 || at === stops.length - 1, exo.prompt).toBe(true);
        expected = stops[at === 0 ? 1 : at - 1];
        seen.add("bout");
      } else if (/^Quel lieu est juste après /.test(question)) {
        expected = stops[stops.indexOf(cited[0]) + 1];
        seen.add("après");
      } else if (/^Quel lieu est juste avant /.test(question)) {
        expected = stops[stops.indexOf(cited[0]) - 1];
        seen.add("avant");
      } else {
        const [a, b] = cited;
        expect(stops.indexOf(b) - stops.indexOf(a), exo.prompt).toBe(2);
        expected = stops[stops.indexOf(a) + 1];
        seen.add("entre");
      }
      expect(expected, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(expected);
      // Les lieux de la question ne sont jamais des choix.
      for (const lieu of cited) expect(optionsOf(exo), exo.prompt).not.toContain(lieu);
      if (d.level === 1) expect([...seen].every((s) => s === "bout" || seen.size > 1)).toBe(true);
    }
    expect(seen.size).toBe(4);
  });

  it("quartier-ordre : les lieux sont rangés dans l'ordre où la rue les cite", () => {
    for (const d of draws) {
      const exo = make("quartier-ordre", d);
      const stops = streetOf(exo.prompt);
      expect(stops.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(sequenceOf(exo), exo.prompt).toEqual(stops);
      expect(exo.prompt).toMatch(/Mets les lieux dans le même ordre\.$/);
    }
  });

  it("quartier-glisser : chaque lieu est rangé avant ou après le lieu de repère, d'après l'ordre de la rue", () => {
    for (const d of draws) {
      const exo = make("quartier-glisser", d);
      const [street, task] = exo.prompt.split(" Glisse chaque lieu avant ou après ");
      const stops = placesIn(street);
      expect(stops.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      const reference = placesIn(task)[0];
      const at = stops.indexOf(reference);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(1);
      expect(at, exo.prompt).toBeLessThanOrEqual(stops.length - 2);
      expect(reference).not.toBe("école");
      const items = itemsOf(exo);
      expect(items.map((i) => i.text).sort()).toEqual(stops.filter((s) => s !== reference).sort());
      for (const item of items) expect(item.correctZone, item.text).toMatch(stops.indexOf(item.text) < at ? /^Avant / : /^Après /);
    }
  });

  it("quartier-trou : le lieu du trou est le voisin du lieu de la phrase, de l'autre côté, tous les lieux sont masculins", () => {
    for (const d of draws) {
      const exo = make("quartier-trou", d);
      const stops = streetOf(exo.prompt);
      expect(stops, exo.prompt).toHaveLength(3);
      for (const stop of stops) expect(MASCULINE_NAMES, stop).toContain(stop);
      const text = exo.payload.text as string;
      const named = placesIn(text);
      expect(named, text).toHaveLength(2);
      expect(stops[1], text).toBe(named.includes(stops[1]) ? stops[1] : "?");
      const known = named.find((n) => n !== stops[1]) ?? "";
      const expected = known === stops[0] ? stops[2] : stops[0];
      expect(known === stops[0] || known === stops[2], text).toBe(true);
      expect(blankOf(exo).answer, text).toBe(expected);
      for (const option of blankOf(exo).options.filter((o) => o !== expected)) expect(stops, option).not.toContain(option);
    }
  });

  it("lieu-fonction : chaque lieu est relié à ce qu'on y fait, d'après la définition du lieu", () => {
    for (const d of draws) {
      const exo = make("lieu-fonction", d);
      const pairs = pairsOf(exo);
      expect(pairs).toHaveLength(3);
      for (const pair of pairs) expect(pair.right, pair.left).toBe(FUNCTION_OF[pair.left]);
      expect(new Set(pairs.map((p) => p.left)).size).toBe(3);
    }
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES À TOUS LES GABARITS
// ===========================================================================

describe("tous les gabarits du CP en histoire et en géographie", () => {
  const exos = NEW_KINDS.flatMap((kind) => draws.slice(0, 120).map((d) => ({ kind, exo: make(kind, d) })));

  it("ne mettent aucun deux-points ni plus d'une apostrophe dans l'énoncé, et tiennent en vingt-huit mots", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent aucun émoji avec sélecteur de variation, et aucun caractère invisible", () => {
    for (const { kind, exo } of exos) {
      const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
      expect(text, kind).not.toContain("\uFE0F");
      expect(/[\p{Cf}]/u.test(text), kind).toBe(false);
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeGreaterThanOrEqual(3);
        expect(options.filter((option) => option === rightOption(exo)), `${kind} : ${exo.prompt}`).toHaveLength(1);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.payload.text}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${exo.payload.text}`).toHaveLength(1);
      }
      if (exo.payload.acceptedAnswers) {
        // Une réponse courte : un seul nombre, en chiffres collés (le pavé numérique s'ouvre), et une consigne qui le demande.
        const accepted = exo.payload.acceptedAnswers as string[];
        expect(accepted, `${kind} : ${exo.prompt}`).toHaveLength(1);
        expect(accepted[0], `${kind} : ${exo.prompt}`).toMatch(/^\d+$/);
        expect(exo.prompt, kind).toMatch(/Écris le nombre\.$/);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        // Chaque case reçoit au moins une étiquette : une case vide se devine par élimination.
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
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
      // Les étiquettes à placer, pas les noms des cases : un indice peut dire « la case du plus court ».
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer.replace(/\p{Extended_Pictographic}/gu, " "))
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4 && !["avant", "apres", "dans", "chaque"].includes(word)),
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
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject: (HISTORY_KINDS as readonly string[]).includes(kind) ? "Histoire" : "Géographie",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("n'écrivent aucune tuile « article + un nom » : au CI, elle demanderait une image que le catalogue n'a pas", () => {
    const ARTICLE_THEN_NOUN = /^(?:(?:le|la|les|un|une|des|du|de la)\s+|(?:de\s+)?l['’]\s?)[\p{L}'’-]+$/iu;
    for (const { kind, exo } of exos) {
      const tiles: string[] = [];
      if (exo.payload.options) tiles.push(...optionsOf(exo));
      if (exo.payload.blanks) tiles.push(...blankOf(exo).options);
      if (exo.payload.correctSequence) tiles.push(...sequenceOf(exo));
      if (exo.payload.pairs) tiles.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) tiles.push(...itemsOf(exo).map((item) => item.text));
      for (const tile of tiles) expect(ARTICLE_THEN_NOUN.test(tile), `${kind} : « ${tile} »`).toBe(false);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les huit thématiques d'histoire et de géographie du CP", () => {
  const KEYS = [
    "hi-cp-calendrier",
    "hi-cp-durees",
    "hi-cp-frequences",
    "hi-cp-emploi-du-temps",
    "ge-cp-itineraire",
    "ge-cp-distances",
    "ge-cp-plan",
    "ge-cp-quartier",
  ];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;
  const subjectOf = (key: string) => (key.startsWith("hi-") ? "Histoire" : "Géographie");

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

  it("sont les seules thématiques du CP entièrement faites par le code (les autres gardent des exercices du modèle)", () => {
    const allCode = allProgrammeEntries()
      .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((e) => e.topic.key);
    expect(allCode.sort()).toEqual([...KEYS].sort());
  });

  it("sont celles du CP, et n'ont changé aucune clé de programme", () => {
    const entries = KEYS.map((key) => allProgrammeEntries().find((e) => e.topic.key === key)!);
    for (const entry of entries) expect(entry.klass, entry.topic.key).toBe("CP");
    expect(entries.map((e) => e.topic.key)).toEqual(KEYS);
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
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
              subject: subjectOf(key),
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
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
