import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { SCENE_THINGS } from "../paliers/games/espace";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";
import { pictureForTile } from "../../lib/item-pictures";

/**
 * LES GABARITS DU TEMPS (histoire) ET DE L'ESPACE (géographie) DU CI : les jours de la semaine, hier et
 * demain, les moments de la journée, ce qui vient avant et après ; sur et sous, devant et derrière, à côté,
 * entre, près et loin, droite et gauche, les repères fixes et mobiles, le quadrillage.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part
 * (les jours, les moments, les cycles, les repères) : un gabarit dont la réponse contredit sa table échoue.
 * L'échantillon que le modèle avait écrit sur ces thématiques comptait quinze exercices faux sur dix-neuf en
 * géographie et cinq sur dix-neuf en histoire (ordre sans critère, scène absente, deux réponses qui vont).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ht:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];

const pictographs = (text: string) => Array.from(text.matchAll(/\p{Extended_Pictographic}/gu)).map((m) => m[0]);
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const lowerFirst = (text: string) => `${text[0].toLowerCase()}${text.slice(1)}`;
/** Le nom d'une option « 🐈 le chat » : ce qui suit l'émoji. */
const nameOf = (option: string) => option.split(" ").slice(1).join(" ");
const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

const WEEK = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const nextDay = (day: string) => WEEK[(WEEK.indexOf(day) + 1) % 7];
const previousDay = (day: string) => WEEK[(WEEK.indexOf(day) + 6) % 7];

const MOMENT_CHAIN = ["le matin", "midi", "l'après-midi", "le soir", "la nuit"];

const MOMENT_OF_ASK: Record<string, string> = {
  "Quand se lève-t-on ?": "le matin",
  "Quand prend-on le petit-déjeuner ?": "le matin",
  "Quand déjeune-t-on ?": "midi",
  "Quand fait-on la sieste ?": "l'après-midi",
  "Quand dîne-t-on ?": "le soir",
  "Quand dort-on dans son lit ?": "la nuit",
};

/** Les activités de la journée, dans l'ordre : le rang de chaque émoji, et le moment de chaque activité. */
const ACTIVITY_RANK: Record<string, number> = { "⏰": 0, "🍞": 1, "🍚": 2, "😴": 3, "🍜": 4, "🌙": 5 };
const ACTIVITY_MOMENT: Record<string, string> = {
  "⏰": "Le matin",
  "🍞": "Le matin",
  "🍚": "Midi",
  "😴": "L'après-midi",
  "🍜": "Le soir",
  "🌙": "La nuit",
};

const CYCLES = [
  ["la graine", "la plante", "la fleur", "le fruit"],
  ["l'œuf", "le poussin", "la poule"],
];

/** Ce que devient chaque chose : une étape après l'autre, avec la famille qui la porte. */
const BECOMES: Record<string, { next: string; family: string }> = {
  "l'œuf": { next: "le poussin", family: "poule" },
  "le poussin": { next: "la poule", family: "poule" },
  "la graine": { next: "la plante", family: "plante" },
  "la fleur": { next: "le fruit", family: "plante" },
  "le chaton": { next: "le chat", family: "chat" },
  "le lionceau": { next: "le lion", family: "lion" },
  "le chevreau": { next: "la chèvre", family: "chèvre" },
};
const FAMILY_OF: Record<string, string> = {};
for (const [from, { next, family }] of Object.entries(BECOMES)) {
  FAMILY_OF[from] = family;
  FAMILY_OF[next] = family;
}

const GROW_PAIRS = [
  ["le poussin", "la poule"],
  ["le chaton", "le chat"],
  ["le lionceau", "le lion"],
  ["le chevreau", "la chèvre"],
];

const LABEL_OF: Record<string, string> = {
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
};
const EMOJI_OF = Object.fromEntries(Object.entries(LABEL_OF).map(([emoji, label]) => [label, emoji]));
const optionEmoji = (option: string) => pictographs(option)[0];
/** « du chien » devient « le chien », « de la poule » devient « la poule ». */
const labelFromDe = (phrase: string) => (phrase.startsWith("du ") ? `le ${phrase.slice(3)}` : phrase.replace(/^de /, ""));

const SUPPORT_LABEL: Record<string, string> = { "🌳": "l'arbre", "🏠": "la maison", "🚗": "la voiture", "📦": "la boîte" };
const LAND_ANIMALS = ["🐔", "🐑", "🐄", "🐈", "🐕"];

const FIXED = ["le baobab", "la mosquée", "le portail", "la maison", "le marché", "le manguier", "le fromager"];
const MOBILE = ["la voiture", "le bus", "la charrette", "l'âne", "le vélo", "la moto", "le cheval", "la pirogue"];

const FINGER_DIRECTION: Record<string, string> = { "👉": "la droite", "👈": "la gauche", "👆": "le haut", "👇": "le bas" };

const NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"];

const TIME_KINDS = [
  "jours-ordre",
  "jour-manquant",
  "jour-ecole-repos",
  "jour-rang",
  "jours-relier",
  "jour-relatif",
  "jour-hier-demain",
  "jour-trou",
  "temps-ordre",
  "activite-moment",
  "moment-ordre",
  "activite-ordre",
  "moment-voisin",
  "activite-moments",
  "cycle-ordre",
  "avant-apres",
  "avant-apres-glisser",
  "grandir-relier",
] as const satisfies readonly GameKind[];

const SPACE_KINDS = [
  "sur-sous",
  "devant-derriere",
  "position-glisser",
  "file-ordre",
  "a-cote",
  "entre",
  "pres-loin",
  "rangee-voisin",
  "doigt-direction",
  "doigt-relier",
  "gauche-droite-glisser",
  "rangee-copie",
  "repere-glisser",
  "repere-qcm",
  "repere-intrus",
  "repere-trajet",
  "grille-position",
  "grille-ligne-colonne",
  "grille-trou",
  "pion-deplacement",
  "grille-glisser",
] as const satisfies readonly GameKind[];

const NEW_KINDS: readonly GameKind[] = [...TIME_KINDS, ...SPACE_KINDS];

// ===========================================================================
// LES JOURS DE LA SEMAINE
// ===========================================================================

describe("les gabarits des jours de la semaine recalculent juste, depuis une table écrite à part", () => {
  it("jours-ordre : des jours dans l'ordre de la semaine, qui se suivent aux deux premiers paliers", () => {
    for (const d of draws) {
      const exo = make("jours-ordre", d);
      const sequence = sequenceOf(exo);
      const ranks = sequence.map((day) => WEEK.indexOf(day));
      expect(ranks.every((rank) => rank >= 0), exo.answerKey).toBe(true);
      expect(ranks, exo.answerKey).toEqual([...ranks].sort((a, b) => a - b));
      expect(new Set(sequence).size).toBe(sequence.length);
      expect(sequence.length, exo.answerKey).toBe(d.level === 1 ? 3 : 4);
      if (d.level < 3) expect(ranks.every((rank, i) => i === 0 || rank - ranks[i - 1] === 1), exo.answerKey).toBe(true);
    }
  });

  it("jour-manquant : le trou est le jour qui complète des jours qui se suivent, aucun mauvais choix ne les complète", () => {
    for (const d of draws) {
      const exo = make("jour-manquant", d);
      const text = exo.payload.text as string;
      const shown = text.replace(/\.$/, "").split(", ");
      const hole = shown.indexOf("___");
      expect(hole, text).toBeGreaterThanOrEqual(0);
      expect(shown.length, text).toBe(d.level === 1 ? 3 : d.level === 2 ? 4 : 5);
      const neighbour = hole > 0 ? nextDay(shown[hole - 1]) : previousDay(shown[hole + 1]);
      expect(blankOf(exo).answer, text).toBe(neighbour);
      // La suite entière, une fois le trou rempli, se suit sans retour au lundi.
      const full = shown.map((day, i) => WEEK.indexOf(i === hole ? neighbour : day));
      expect(full.every((rank) => rank >= 0), text).toBe(true);
      expect(full.every((rank, i) => i === 0 || rank - full[i - 1] === 1), text).toBe(true);
      const options = blankOf(exo).options;
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(neighbour);
      for (const option of options.filter((o) => o !== neighbour)) expect(shown, option).not.toContain(option);
    }
  });

  it("jour-ecole-repos : dimanche est le seul jour de repos, jeudi et samedi ne sont jamais proposés", () => {
    for (const d of draws) {
      const exo = make("jour-ecole-repos", d);
      const items = itemsOf(exo);
      expect(zonesOf(exo)).toEqual(["Jour d'école", "Jour de repos"]);
      expect(new Set(items.map((item) => item.text)).size).toBe(items.length);
      for (const item of items) {
        expect(["jeudi", "samedi"], item.text).not.toContain(item.text);
        expect(item.correctZone, item.text).toBe(item.text === "dimanche" ? "Jour de repos" : "Jour d'école");
      }
      expect(items.filter((item) => item.text === "dimanche")).toHaveLength(1);
      expect(items.length, exo.answerKey).toBe(d.level === 1 ? 3 : d.level === 2 ? 4 : 5);
    }
  });

  it("jour-rang : le rang demandé est celui du jour de la bonne réponse", () => {
    const RANK: Record<string, number> = { premier: 0, deuxième: 1, troisième: 2, quatrième: 3, cinquième: 4, dernier: 6 };
    for (const d of draws) {
      const exo = make("jour-rang", d);
      const word = /^Quel est le (\p{L}+) jour de la semaine \?$/u.exec(exo.prompt)![1];
      expect(rightOption(exo), exo.prompt).toBe(WEEK[RANK[word]]);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      if (d.level === 1) expect(["premier", "deuxième", "dernier"], exo.prompt).toContain(word);
      if (d.level === 2) expect(["premier", "deuxième", "troisième", "dernier"], exo.prompt).toContain(word);
    }
  });

  it("jour-rang : deux questions d'un même palier ne se répètent pas", () => {
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "jour-rang", count: 2 }], { klass: "CI", palierIndex: 1, palierCount: 3, seed: `rang:${n}` });
      expect(new Set(games.map((game) => game.prompt)).size, `graine ${n}`).toBe(2);
    }
  });

  it("jours-relier : chaque jour est relié à celui qui vient juste après (ou avant), jamais un jour des deux côtés", () => {
    for (const d of draws) {
      const exo = make("jours-relier", d);
      const pairs = pairsOf(exo);
      const after = /juste après\.$/.test(exo.prompt);
      expect(after || /juste avant\.$/.test(exo.prompt), exo.prompt).toBe(true);
      expect(pairs).toHaveLength(3);
      for (const pair of pairs) expect(pair.right, `${pair.left} ~ ${pair.right}`).toBe(after ? nextDay(pair.left) : previousDay(pair.left));
      const lefts = pairs.map((p) => p.left);
      const rights = pairs.map((p) => p.right);
      expect(new Set([...lefts, ...rights]).size, exo.answerKey).toBe(6);
      // Ni retour de dimanche au lundi, ni du lundi au dimanche.
      for (const pair of pairs) expect(Math.abs(WEEK.indexOf(pair.left) - WEEK.indexOf(pair.right))).toBe(1);
      if (d.level < 3) expect(after, exo.prompt).toBe(true);
    }
  });
});

// ===========================================================================
// HIER, AUJOURD'HUI, DEMAIN
// ===========================================================================

describe("les gabarits d'hier et de demain recalculent juste", () => {
  it("jour-relatif : demain, hier, ou le jour d'aujourd'hui retrouvé depuis hier ou demain, jamais avec le jour cité en mauvais choix", () => {
    for (const d of draws) {
      const exo = make("jour-relatif", d);
      let expected: string;
      let cited: string;
      let variant: string;
      let m: RegExpExecArray | null;
      if ((m = /^Nous sommes (\p{L}+)\. Quel jour sera demain \?$/u.exec(exo.prompt))) {
        [expected, cited, variant] = [nextDay(m[1]), m[1], "demain"];
      } else if ((m = /^Nous sommes (\p{L}+)\. Quel jour était hier \?$/u.exec(exo.prompt))) {
        [expected, cited, variant] = [previousDay(m[1]), m[1], "hier"];
      } else if ((m = /^Hier, c'était (\p{L}+)\. Quel jour sommes-nous \?$/u.exec(exo.prompt))) {
        [expected, cited, variant] = [nextDay(m[1]), m[1], "inverse"];
      } else if ((m = /^Demain, ce sera (\p{L}+)\. Quel jour sommes-nous \?$/u.exec(exo.prompt))) {
        [expected, cited, variant] = [previousDay(m[1]), m[1], "inverse"];
      } else {
        throw new Error(`énoncé inattendu : ${exo.prompt}`);
      }
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect(optionsOf(exo), exo.prompt).not.toContain(cited);
      expect(new Set(optionsOf(exo)).size, exo.prompt).toBe(3);
      if (d.level === 1) expect(variant, exo.prompt).toBe("demain");
      if (d.level === 2) expect(["demain", "hier"], exo.prompt).toContain(variant);
    }
  });

  it("jour-hier-demain : le jour d'avant est hier, le jour de la phrase aujourd'hui, le jour d'après demain", () => {
    for (const d of draws) {
      const exo = make("jour-hier-demain", d);
      const today = /^Nous sommes (\p{L}+)\. Glisse chaque jour dans la bonne case\.$/u.exec(exo.prompt)![1];
      const expected: Record<string, string> = { [previousDay(today)]: "Hier", [today]: "Aujourd'hui", [nextDay(today)]: "Demain" };
      const items = itemsOf(exo);
      expect(items).toHaveLength(3);
      for (const item of items) expect(item.correctZone, `${today} : ${item.text}`).toBe(expected[item.text]);
      expect(zonesOf(exo)).toEqual(["Hier", "Aujourd'hui", "Demain"]);
    }
  });

  it("jour-trou : le jour du trou est celui d'hier, de demain ou d'aujourd'hui, jamais le jour cité en mauvais choix", () => {
    for (const d of draws) {
      const exo = make("jour-trou", d);
      const text = exo.payload.text as string;
      let expected: string;
      let cited: string;
      let m: RegExpExecArray | null;
      if ((m = /^Nous sommes (\p{L}+)\. Hier, c'était ___\.$/u.exec(text))) [expected, cited] = [previousDay(m[1]), m[1]];
      else if ((m = /^Nous sommes (\p{L}+)\. Demain, ce sera ___\.$/u.exec(text))) [expected, cited] = [nextDay(m[1]), m[1]];
      else if ((m = /^Hier, c'était (\p{L}+)\. Aujourd'hui, nous sommes ___\.$/u.exec(text))) [expected, cited] = [nextDay(m[1]), m[1]];
      else throw new Error(`phrase inattendue : ${text}`);
      expect(blankOf(exo).answer, text).toBe(expected);
      expect(blankOf(exo).options, text).not.toContain(cited);
      expect(new Set(blankOf(exo).options).size, text).toBe(3);
      if (d.level === 1) expect(text, text).not.toMatch(/Aujourd'hui, nous sommes/);
    }
  });

  it("temps-ordre : une suite de mots du temps écrite dans son seul bon ordre, jamais deux fois la même dans un palier", () => {
    const SETS = [
      ["hier", "aujourd'hui", "demain"],
      ["avant", "maintenant", "après"],
      ["hier", "maintenant", "demain"],
    ];
    for (const d of draws) {
      const exo = make("temps-ordre", d);
      expect(SETS, exo.answerKey).toContainEqual(sequenceOf(exo));
      if (d.level === 1) expect(SETS.slice(0, 2), exo.answerKey).toContainEqual(sequenceOf(exo));
    }
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "temps-ordre", count: 2 }], { klass: "CI", palierIndex: 1, palierCount: 3, seed: `temps:${n}` });
      expect(games).toHaveLength(2);
      expect(sequenceOf(games[0]), `graine ${n}`).not.toEqual(sequenceOf(games[1]));
    }
  });
});

// ===========================================================================
// LES MOMENTS DE LA JOURNÉE
// ===========================================================================

describe("les gabarits des moments de la journée recalculent juste", () => {
  it("activite-moment : le moment de la bonne réponse est celui de l'activité, et aucun mauvais choix ne va aussi", () => {
    const AVOID: Record<string, string[]> = {
      "Quand déjeune-t-on ?": ["l'après-midi"],
      "Quand fait-on la sieste ?": ["midi"],
      "Quand dîne-t-on ?": ["la nuit"],
      "Quand dort-on dans son lit ?": ["le soir", "l'après-midi"],
    };
    for (const d of draws) {
      const exo = make("activite-moment", d);
      expect(rightOption(exo), exo.prompt).toBe(MOMENT_OF_ASK[exo.prompt]);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      // Le soir et la nuit ne se proposent jamais ensemble.
      expect(optionsOf(exo).includes("le soir") && optionsOf(exo).includes("la nuit"), exo.prompt).toBe(false);
      for (const avoided of AVOID[exo.prompt] ?? []) expect(optionsOf(exo), exo.prompt).not.toContain(avoided);
    }
  });

  it("moment-ordre : des moments dans l'ordre de la journée", () => {
    for (const d of draws) {
      const exo = make("moment-ordre", d);
      const sequence = sequenceOf(exo);
      const ranks = sequence.map((label) => MOMENT_CHAIN.indexOf(label));
      expect(ranks.every((rank) => rank >= 0), exo.answerKey).toBe(true);
      expect(ranks, exo.answerKey).toEqual([...ranks].sort((a, b) => a - b));
      expect(new Set(sequence).size).toBe(sequence.length);
      expect(sequence.length, exo.answerKey).toBe(d.level === 1 ? 3 : 4);
    }
  });

  it("activite-ordre : le réveil, les repas, la sieste et le sommeil dans l'ordre de la journée", () => {
    for (const d of draws) {
      const exo = make("activite-ordre", d);
      const ranks = sequenceOf(exo).map((tile) => ACTIVITY_RANK[pictographs(tile)[0]]);
      expect(ranks.every((rank) => rank !== undefined), exo.answerKey).toBe(true);
      expect(ranks, exo.answerKey).toEqual([...ranks].sort((a, b) => a - b));
      expect(new Set(ranks).size).toBe(ranks.length);
      expect(sequenceOf(exo).length, exo.answerKey).toBe(d.level === 1 ? 3 : 4);
      const name = /^Mets ce que fait (\p{L}+) dans l'ordre de la journée\.$/u.exec(exo.prompt)![1];
      expect(NAMES, exo.prompt).toContain(name);
    }
  });

  it("moment-voisin : le moment juste avant ou juste après, jamais autour de l'après-midi, jamais après la nuit", () => {
    for (const d of draws) {
      const exo = make("moment-voisin", d);
      const [, direction, reference] = /^Quel moment vient juste (avant|après) (.+) \?$/u.exec(exo.prompt)!;
      const at = MOMENT_CHAIN.indexOf(reference);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(reference, exo.prompt).not.toBe("l'après-midi");
      const answer = MOMENT_CHAIN[at + (direction === "après" ? 1 : -1)];
      expect(answer, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(answer);
      expect(optionsOf(exo), exo.prompt).not.toContain(reference);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      if (d.level === 1 && at < MOMENT_CHAIN.length - 1) expect(direction, exo.prompt).toBe("après");
    }
  });

  it("activite-moments : chaque activité est dans le moment où on la fait, et chaque case en reçoit une", () => {
    for (const d of draws) {
      const exo = make("activite-moments", d);
      const items = itemsOf(exo);
      for (const item of items) expect(item.correctZone, item.text).toBe(ACTIVITY_MOMENT[pictographs(item.text)[0]]);
      const zones = zonesOf(exo);
      for (const zone of zones) expect(items.some((item) => item.correctZone === zone), `${zone} : ${exo.answerKey}`).toBe(true);
      // Les cases suivent l'ordre de la journée.
      const ranks = zones.map((zone) => MOMENT_CHAIN.findIndex((label) => label.toLowerCase() === zone.toLowerCase()));
      expect(ranks.every((rank) => rank >= 0), zones.join()).toBe(true);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
      expect(zones.length, exo.answerKey).toBe(d.level === 1 ? 2 : 3);
      expect(zones[0], exo.answerKey).toBe("Le matin");
    }
  });

  it("avant-apres-glisser : ce qui vient avant le moment cité va d'un côté, ce qui vient après de l'autre, sans case vide", () => {
    for (const d of draws) {
      const exo = make("avant-apres-glisser", d);
      const reference = /^Glisse chaque moment avant ou après (.+)\.$/u.exec(exo.prompt)![1];
      const at = MOMENT_CHAIN.indexOf(reference);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(zonesOf(exo)).toEqual([`Avant ${reference}`, `Après ${reference}`]);
      const items = itemsOf(exo);
      for (const item of items) {
        const rank = MOMENT_CHAIN.indexOf(item.text);
        expect(rank, item.text).toBeGreaterThanOrEqual(0);
        expect(rank, item.text).not.toBe(at);
        expect(item.correctZone, `${reference} : ${item.text}`).toBe(rank < at ? `Avant ${reference}` : `Après ${reference}`);
      }
      for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), exo.prompt).toBe(true);
      expect(new Set(items.map((item) => item.text)).size).toBe(items.length);
      expect(items.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
    }
  });
});

// ===========================================================================
// AVANT ET APRÈS : GRANDIR
// ===========================================================================

describe("les gabarits de croissance recalculent juste", () => {
  it("cycle-ordre : des étapes d'un même cycle, dans l'ordre où elles grandissent, jamais deux fois le même cycle dans un palier", () => {
    for (const d of draws) {
      const exo = make("cycle-ordre", d);
      const sequence = sequenceOf(exo);
      const cycle = CYCLES.find((steps) => sequence.every((label) => steps.includes(label)));
      expect(cycle, exo.answerKey).toBeDefined();
      const ranks = sequence.map((label) => (cycle as string[]).indexOf(label));
      expect(ranks, exo.answerKey).toEqual([...ranks].sort((a, b) => a - b));
      expect(new Set(sequence).size).toBe(sequence.length);
      expect(sequence.length, exo.answerKey).toBe(Math.min((cycle as string[]).length, d.level === 1 ? 3 : 4));
    }
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "cycle-ordre", count: 2 }], { klass: "CI", palierIndex: 2, palierCount: 3, seed: `cycle:${n}` });
      const families = games.map((game) => CYCLES.findIndex((steps) => sequenceOf(game).every((label) => steps.includes(label))));
      expect(new Set(families).size, `graine ${n}`).toBe(2);
    }
  });

  it("avant-apres : ce que devient une chose, ou ce qui vient avant elle, avec des mauvais choix d'une autre famille", () => {
    for (const d of draws) {
      const exo = make("avant-apres", d);
      let asked: string;
      let expected: string;
      let m: RegExpExecArray | null;
      if ((m = /^Que devient (.+) \?$/u.exec(exo.prompt))) {
        asked = m[1];
        expected = BECOMES[asked].next;
      } else if ((m = /^Qu'est-ce qui vient avant (.+) \?$/u.exec(exo.prompt))) {
        asked = m[1];
        expected = Object.keys(BECOMES).find((from) => BECOMES[from].next === asked) as string;
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(2);
      } else {
        throw new Error(`énoncé inattendu : ${exo.prompt}`);
      }
      expect(expected, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      for (const option of optionsOf(exo).filter((o) => o !== expected)) {
        expect(FAMILY_OF[option], `${exo.prompt} : ${option}`).toBeDefined();
        expect(FAMILY_OF[option], `${exo.prompt} : ${option}`).not.toBe(FAMILY_OF[asked]);
      }
      // Une seule apostrophe dans l'énoncé, même quand la chose demandée en porte une.
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });

  it("avant-apres : trois questions d'un palier ne se répètent pas", () => {
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "avant-apres", count: 3 }], { klass: "CI", palierIndex: 1, palierCount: 3, seed: `avant:${n}` });
      expect(new Set(games.map((game) => game.prompt)).size, `graine ${n}`).toBe(3);
    }
  });

  it("grandir-relier : chaque petit est relié à l'animal qu'il devient, sans doublon", () => {
    for (const d of draws) {
      const exo = make("grandir-relier", d);
      const pairs = pairsOf(exo);
      expect(pairs, exo.answerKey).toHaveLength(d.level === 1 ? 3 : 4);
      for (const pair of pairs) expect(GROW_PAIRS, `${pair.left} ~ ${pair.right}`).toContainEqual([pair.left, pair.right]);
      expect(new Set(pairs.map((p) => p.left)).size).toBe(pairs.length);
      expect(new Set(pairs.map((p) => p.right)).size).toBe(pairs.length);
    }
  });
});

// ===========================================================================
// SUR, SOUS, DEVANT, DERRIÈRE
// ===========================================================================

describe("les gabarits de position recalculent juste, depuis la scène écrite dans l'énoncé", () => {
  it("sur-sous : le dessin du haut est sur le support, celui du bas est dessous, le troisième n'est pas dans la pile", () => {
    for (const d of draws) {
      const exo = make("sur-sous", d);
      const lines = exo.prompt.split("\n");
      expect(lines, exo.prompt).toHaveLength(5);
      const [intro, top, support, bottom, question] = lines;
      expect(intro).toBe("Regarde le dessin.");
      const [, ask, label] = /^Qui est (sur|sous) (.+) \?$/u.exec(question)!;
      expect(SUPPORT_LABEL[support], exo.prompt).toBe(label);
      expect(LAND_ANIMALS, exo.prompt).toContain(top);
      expect(LAND_ANIMALS, exo.prompt).toContain(bottom);
      expect(top).not.toBe(bottom);
      const answer = ask === "sur" ? top : bottom;
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(answer);
      const optionEmojis = optionsOf(exo).map(optionEmoji);
      expect(new Set(optionEmojis).size).toBe(3);
      expect(optionEmojis, exo.prompt).toContain(top);
      expect(optionEmojis, exo.prompt).toContain(bottom);
      if (d.level === 1) expect(ask, exo.prompt).toBe("sur");
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });

  it("devant-derriere : la réponse se lit dans les phrases, deux animaux puis trois à la queue leu leu", () => {
    for (const d of draws) {
      const exo = make("devant-derriere", d);
      let m: RegExpExecArray | null;
      if ((m = /^(.+?) est devant (.+?)\. (.+?) est devant (.+?)\. Qui est (tout derrière|au milieu) \?$/u.exec(exo.prompt))) {
        const [, a, b, b2, c, ask] = m;
        expect(lowerFirst(b2), exo.prompt).toBe(b);
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(3);
        const answer = ask === "tout derrière" ? c : b;
        expect(nameOf(rightOption(exo)), exo.prompt).toBe(answer);
        expect(optionsOf(exo).map(nameOf).sort(), exo.prompt).toEqual([lowerFirst(a), b, c].sort());
      } else if ((m = /^(.+?) est devant (.+?)\. Qui est (devant|derrière) \?$/u.exec(exo.prompt))) {
        const [, a, b, ask] = m;
        const answer = ask === "devant" ? lowerFirst(a) : b;
        expect(nameOf(rightOption(exo)), exo.prompt).toBe(answer);
        expect(d.level, exo.prompt).toBeLessThan(3);
        if (d.level === 1) expect(ask, exo.prompt).toBe("devant");
      } else {
        throw new Error(`énoncé inattendu : ${exo.prompt}`);
      }
      expect(new Set(optionsOf(exo)).size).toBe(3);
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });

  it("position-glisser : l'animal devant est dans la case du devant, celui de derrière dans l'autre", () => {
    for (const d of draws) {
      const exo = make("position-glisser", d);
      const [, a, reference, b, reference2] = /^(.+?) est devant (.+?)\. (.+?) est derrière (.+?)\. Glisse chaque animal dans sa case\.$/u.exec(exo.prompt)!;
      expect(reference2, exo.prompt).toBe(reference);
      expect(zonesOf(exo)).toEqual([`Devant ${reference}`, `Derrière ${reference}`]);
      const items = itemsOf(exo);
      expect(items).toHaveLength(2);
      for (const item of items) expect(item.correctZone, item.text).toBe(item.text === lowerFirst(a) ? `Devant ${reference}` : `Derrière ${reference}`);
      expect(items.map((item) => item.text).sort()).toEqual([lowerFirst(a), lowerFirst(b)].sort());
    }
  });

  it("file-ordre : un seul ordre respecte toutes les phrases, et c'est celui de la bonne réponse", () => {
    for (const d of draws) {
      const exo = make("file-ordre", d);
      const body = exo.prompt.replace(/ Mets-les dans l'ordre de la file\.$/u, "");
      expect(body, exo.prompt).not.toBe(exo.prompt);
      const sentences = body.split(/(?<=\.) /u);
      expect(sentences, exo.prompt).toHaveLength(2);
      const names = sequenceOf(exo).map(nameOf);
      expect(names, exo.prompt).toHaveLength(3);
      expect(new Set(names).size).toBe(names.length);
      const relations = sentences.map((sentence) => {
        const [, first, word, second] = /^(.+?) est (devant|derrière) (.+?)\.$/u.exec(sentence)!;
        return word === "devant" ? { front: lowerFirst(first), back: second } : { front: second, back: lowerFirst(first) };
      });
      const respects = (order: string[]) => relations.every(({ front, back }) => order.indexOf(front) >= 0 && order.indexOf(front) < order.indexOf(back));
      expect(permutations(names).filter(respects), exo.prompt).toEqual([names]);
      if (d.level === 1) expect(body, exo.prompt).not.toMatch(/derrière/);
      // Avant le dernier palier, les phrases suivent l'ordre de la file : la première lie les deux premiers animaux, la seconde les deux derniers.
      if (d.level < 3) {
        expect([relations[0].front, relations[0].back], exo.prompt).toEqual([names[0], names[1]]);
        expect([relations[1].front, relations[1].back], exo.prompt).toEqual([names[1], names[2]]);
      }
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });
});

// ===========================================================================
// UNE RANGÉE : À CÔTÉ, ENTRE, PRÈS, LOIN, DROITE, GAUCHE
// ===========================================================================

const rowOf = (prompt: string) => pictographs(/Regarde la rangée (.*?)\. /u.exec(prompt)![1]);

describe("les gabarits d'une rangée recalculent juste", () => {
  it("a-cote : le dessin de la question est au bout, la bonne réponse est son seul voisin, les mauvais choix ne le touchent pas", () => {
    for (const d of draws) {
      const exo = make("a-cote", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level >= 3 ? 5 : 4);
      expect(new Set(row).size).toBe(row.length);
      const target = EMOJI_OF[labelFromDe(/à côté (du .+|de la .+) \?$/u.exec(exo.prompt)![1])];
      const at = row.indexOf(target);
      expect([0, row.length - 1], exo.prompt).toContain(at);
      const neighbour = at === 0 ? row[1] : row[row.length - 2];
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(neighbour);
      for (const option of optionsOf(exo).filter((o) => o !== rightOption(exo))) {
        expect(Math.abs(row.indexOf(optionEmoji(option)) - at), `${exo.prompt} : ${option}`).toBeGreaterThanOrEqual(2);
      }
      expect(new Set(optionsOf(exo)).size).toBe(3);
    }
  });

  it("entre : la bonne réponse est au milieu des deux dessins nommés, qui ne sont jamais proposés", () => {
    for (const d of draws) {
      const exo = make("entre", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level === 1 ? 3 : 5);
      const [, first, last] = /Lequel est entre (.+?) et (.+?) \?$/u.exec(exo.prompt)!;
      const [i, j] = [row.indexOf(EMOJI_OF[first]), row.indexOf(EMOJI_OF[last])];
      expect(i, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(j - i, exo.prompt).toBe(2);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(row[i + 1]);
      const options = optionsOf(exo).map(optionEmoji);
      expect(options, exo.prompt).not.toContain(row[i]);
      expect(options, exo.prompt).not.toContain(row[j]);
      expect(new Set(options).size).toBe(3);
    }
  });

  it("pres-loin : le plus près est le voisin du dessin de la question, le plus loin est le bout de la rangée", () => {
    for (const d of draws) {
      const exo = make("pres-loin", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level >= 3 ? 5 : 4);
      const [, word, de] = /Lequel est le plus (près|loin) (du .+|de la .+) \?$/u.exec(exo.prompt)!;
      const target = EMOJI_OF[labelFromDe(de)];
      const at = row.indexOf(target);
      expect([0, row.length - 1], exo.prompt).toContain(at);
      const ordered = at === 0 ? row : [...row].reverse();
      const answer = word === "près" ? ordered[1] : ordered[ordered.length - 1];
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(answer);
      expect(new Set(optionsOf(exo).map(optionEmoji)).size).toBe(3);
      // Le plus près et le plus loin sont toujours proposés : la question n'a qu'une réponse parmi eux.
      expect(optionsOf(exo).map(optionEmoji), exo.prompt).toContain(ordered[1]);
      expect(optionsOf(exo).map(optionEmoji), exo.prompt).toContain(ordered[ordered.length - 1]);
    }
  });

  it("rangee-voisin : le voisin juste à droite ou juste à gauche du dessin de la question", () => {
    for (const d of draws) {
      const exo = make("rangee-voisin", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      const [, side, de] = /juste à (droite|gauche) (du .+|de la .+) \?$/u.exec(exo.prompt)!;
      const at = row.indexOf(EMOJI_OF[labelFromDe(de)]);
      expect(at, exo.prompt).toBeGreaterThanOrEqual(0);
      const neighbour = row[at + (side === "droite" ? 1 : -1)];
      expect(neighbour, exo.prompt).toBeDefined();
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(neighbour);
      expect(new Set(optionsOf(exo).map(optionEmoji)).size).toBe(3);
    }
  });

  it("gauche-droite-glisser : ce qui est avant le dessin de la question est à gauche, ce qui est après est à droite", () => {
    for (const d of draws) {
      const exo = make("gauche-droite-glisser", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level >= 3 ? 5 : 4);
      const de = /à gauche ou à droite (du .+|de la .+)\.$/u.exec(exo.prompt)![1];
      const at = row.indexOf(EMOJI_OF[labelFromDe(de)]);
      expect(at, exo.prompt).toBeGreaterThan(0);
      expect(at, exo.prompt).toBeLessThan(row.length - 1);
      const items = itemsOf(exo);
      expect(items).toHaveLength(row.length - 1);
      for (const item of items) {
        const rank = row.indexOf(optionEmoji(item.text));
        expect(rank, item.text).not.toBe(at);
        expect(item.correctZone, `${exo.prompt} : ${item.text}`).toBe(rank < at ? "À gauche" : "À droite");
      }
      for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), exo.prompt).toBe(true);
    }
  });

  it("rangee-copie : l'ordre à reproduire est celui de la rangée, de gauche à droite", () => {
    for (const d of draws) {
      const exo = make("rangee-copie", d);
      const row = rowOf(exo.prompt);
      expect(row.length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(sequenceOf(exo).map(optionEmoji), exo.prompt).toEqual(row);
      expect(new Set(row).size).toBe(row.length);
    }
  });

  it("doigt-direction : chaque doigt montre le sens qu'on lui donne, sans mot à lire dans les choix", () => {
    for (const d of draws) {
      const exo = make("doigt-direction", d);
      const asked = /^Quel doigt montre (.+) \?$/u.exec(exo.prompt)![1];
      expect(FINGER_DIRECTION[rightOption(exo)], exo.prompt).toBe(asked);
      for (const option of optionsOf(exo)) expect(FINGER_DIRECTION[option], option).toBeDefined();
      expect(new Set(optionsOf(exo)).size).toBe(3);
      if (d.level === 1) expect(["la droite", "la gauche"], exo.prompt).toContain(asked);
    }
    for (let n = 0; n < 60; n++) {
      const games = generateGames([{ kind: "doigt-direction", count: 2 }], { klass: "CI", palierIndex: 1, palierCount: 3, seed: `doigt:${n}` });
      expect(new Set(games.map((game) => game.prompt)).size, `graine ${n}`).toBe(2);
    }
  });

  it("doigt-relier : chaque doigt est relié à la direction qu'il montre, sans doublon", () => {
    for (const d of draws) {
      const exo = make("doigt-relier", d);
      const pairs = pairsOf(exo);
      expect(pairs, exo.answerKey).toHaveLength(d.level >= 3 ? 4 : 3);
      const WORDS: Record<string, string> = { "la droite": "à droite", "la gauche": "à gauche", "le haut": "en haut", "le bas": "en bas" };
      for (const pair of pairs) expect(WORDS[FINGER_DIRECTION[pair.left]], `${pair.left} ~ ${pair.right}`).toBe(pair.right);
      expect(new Set(pairs.map((pair) => pair.left)).size).toBe(pairs.length);
      expect(new Set(pairs.map((pair) => pair.right)).size).toBe(pairs.length);
    }
  });
});

// ===========================================================================
// LES REPÈRES
// ===========================================================================

describe("les gabarits de repères recalculent juste", () => {
  it("repere-glisser : chaque repère est dans la case de son sorte, et chaque case en a au moins deux", () => {
    for (const d of draws) {
      const exo = make("repere-glisser", d);
      const items = itemsOf(exo);
      expect(zonesOf(exo)).toEqual(["Repères fixes", "Repères mobiles"]);
      for (const item of items) {
        const fixed = FIXED.includes(item.text);
        expect(fixed || MOBILE.includes(item.text), item.text).toBe(true);
        expect(item.correctZone, item.text).toBe(fixed ? "Repères fixes" : "Repères mobiles");
      }
      expect(new Set(items.map((item) => item.text)).size).toBe(items.length);
      expect(items.length, exo.answerKey).toBe(d.level === 1 ? 4 : 5);
      for (const zone of zonesOf(exo)) expect(items.filter((item) => item.correctZone === zone).length, exo.answerKey).toBeGreaterThanOrEqual(2);
    }
  });

  it("repere-qcm : « ne bouge pas » a un repère fixe pour réponse, « peut bouger » un repère mobile, les autres choix sont de l'autre sorte", () => {
    for (const d of draws) {
      const exo = make("repere-qcm", d);
      const fixed = exo.prompt === "Lequel ne bouge pas ?";
      expect(fixed || exo.prompt === "Lequel peut bouger ?", exo.prompt).toBe(true);
      expect(fixed ? FIXED : MOBILE, exo.prompt).toContain(rightOption(exo));
      for (const option of optionsOf(exo).filter((o) => o !== rightOption(exo))) expect(fixed ? MOBILE : FIXED, `${exo.prompt} : ${option}`).toContain(option);
      expect(new Set(optionsOf(exo)).size).toBe(3);
      if (d.level === 1) expect(fixed, exo.prompt).toBe(true);
    }
  });

  it("repere-intrus : trois repères de la même sorte et un seul de l'autre, qui est la réponse", () => {
    for (const d of draws) {
      const exo = make("repere-intrus", d);
      const options = optionsOf(exo);
      expect(options).toHaveLength(4);
      expect(new Set(options).size).toBe(4);
      const fixed = options.filter((option) => FIXED.includes(option));
      const mobile = options.filter((option) => MOBILE.includes(option));
      expect(fixed.length + mobile.length, exo.prompt).toBe(4);
      const odds = fixed.length === 1 ? fixed : mobile.length === 1 ? mobile : [];
      expect(odds, options.join()).toHaveLength(1);
      expect(rightOption(exo)).toBe(odds[0]);
    }
  });

  it("repere-trajet : le départ, le repère devant lequel on passe et l'arrivée, dans l'ordre du trajet", () => {
    for (const d of draws) {
      const exo = make("repere-trajet", d);
      const m = /^(\p{L}+) part (du|de la) (.+?), passe devant (.+?) et arrive (au|à la) (.+?)\. Mets-les dans l'ordre du trajet\.$/u.exec(exo.prompt)!;
      expect(m, exo.prompt).not.toBeNull();
      const [, name, deArticle, start, middle, atArticle, end] = m;
      expect(NAMES).toContain(name);
      const startLabel = `${deArticle === "du" ? "le" : "la"} ${start}`;
      const endLabel = `${atArticle === "au" ? "le" : "la"} ${end}`;
      expect(sequenceOf(exo), exo.prompt).toEqual([startLabel, middle, endLabel]);
      expect(new Set(sequenceOf(exo)).size).toBe(3);
      for (const stop of sequenceOf(exo)) expect(FIXED, stop).toContain(stop);
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });
});

// ===========================================================================
// LE QUADRILLAGE
// ===========================================================================

/** Le quadrillage écrit dans l'énoncé : les lignes entre « Regarde le quadrillage. » et la question. */
const gridOf = (prompt: string) => {
  const lines = prompt.split("\n");
  expect(lines[0], prompt).toBe("Regarde le quadrillage.");
  return lines.slice(1, -1).map((line) => pictographs(line));
};

/** Les places qu'une phrase sait dire, et la case qu'elle désigne dans un quadrillage de côté `size`. */
const PLACES: Record<string, (size: number) => [number, number]> = {
  "en haut à gauche": () => [0, 0],
  "en haut à droite": (size) => [0, size - 1],
  "en bas à gauche": (size) => [size - 1, 0],
  "en bas à droite": (size) => [size - 1, size - 1],
  "au milieu": () => [1, 1],
};

describe("les gabarits du quadrillage recalculent juste, depuis le quadrillage écrit dans l'énoncé", () => {
  it("grille-position : le dessin de la place demandée, avec une seule case par dessin", () => {
    for (const d of draws) {
      const exo = make("grille-position", d);
      const grid = gridOf(exo.prompt);
      expect(grid.length, exo.prompt).toBe(d.level === 1 ? 2 : 3);
      for (const row of grid) expect(row, exo.prompt).toHaveLength(grid.length);
      expect(new Set(grid.flat()).size, exo.prompt).toBe(grid.length * grid.length);
      const place = /Lequel est (.+) \?$/u.exec(exo.prompt)![1];
      if (grid.length === 2) expect(place, exo.prompt).not.toBe("au milieu");
      const [r, c] = PLACES[place](grid.length);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[r][c]);
      expect(new Set(optionsOf(exo).map(optionEmoji)).size).toBe(3);
    }
  });

  it("grille-ligne-colonne : la ligne et la colonne se croisent sur le dessin de la bonne réponse", () => {
    const ORDINAL: Record<string, number> = { première: 0, deuxième: 1, troisième: 2 };
    for (const d of draws) {
      const exo = make("grille-ligne-colonne", d);
      const grid = gridOf(exo.prompt);
      expect(grid.length, exo.prompt).toBe(d.level === 1 ? 2 : 3);
      const [, line, column] = /dans la (\p{L}+) ligne et la (\p{L}+) colonne \?$/u.exec(exo.prompt)!;
      expect(ORDINAL[line], exo.prompt).toBeLessThan(grid.length);
      expect(ORDINAL[column], exo.prompt).toBeLessThan(grid.length);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[ORDINAL[line]][ORDINAL[column]]);
      expect(new Set(optionsOf(exo).map(optionEmoji)).size).toBe(3);
    }
  });

  it("grille-trou : la phrase dit une place, et le dessin de cette place est la seule bonne réponse", () => {
    for (const d of draws) {
      const exo = make("grille-trou", d);
      const grid = gridOf(exo.prompt);
      expect(exo.prompt.split("\n").at(-1), exo.prompt).toBe("Complète la phrase.");
      expect(grid.length, exo.prompt).toBe(d.level === 1 ? 2 : 3);
      const text = exo.payload.text as string;
      const place = /^(.+), il y a ___\.$/u.exec(text)![1].toLowerCase();
      if (grid.length === 2) expect(place, text).not.toBe("au milieu");
      const [r, c] = PLACES[place](grid.length);
      const { options, answer } = blankOf(exo);
      expect(optionEmoji(answer), text).toBe(grid[r][c]);
      expect(options, text).toContain(answer);
      expect(new Set(options.map(optionEmoji)).size, text).toBe(3);
      expect(exo.answerKey).toBe(answer);
    }
  });

  it("pion-deplacement : l'arrivée est le dessin atteint depuis le départ, toujours dans le quadrillage", () => {
    const MOVES: Record<string, [number, number]> = { monte: [-1, 0], descend: [1, 0], gauche: [0, -1], droite: [0, 1] };
    for (const d of draws) {
      const exo = make("pion-deplacement", d);
      const grid = gridOf(exo.prompt);
      expect(grid.length, exo.prompt).toBe(d.level === 1 ? 2 : 3);
      const last = exo.prompt.split("\n").at(-1) as string;
      const m = /Le pion est sur (.+?)\. Il (monte|descend|va) (?:d'une case|de deux cases)(?: vers la (gauche|droite))?\. Où arrive-t-il \?$/u.exec(last);
      expect(m, exo.prompt).not.toBeNull();
      const [, startLabel, verb, side] = m!;
      const cases = /d'une case/.test(last) ? 1 : 2;
      expect(cases, exo.prompt).toBe(d.level >= 3 ? 2 : 1);
      const start = EMOJI_OF[startLabel];
      const r = grid.findIndex((row) => row.includes(start));
      const c = grid[r].indexOf(start);
      const [dr, dc] = MOVES[verb === "va" ? (side as string) : verb];
      const [toR, toC] = [r + dr * cases, c + dc * cases];
      expect(toR, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(toR, exo.prompt).toBeLessThan(grid.length);
      expect(toC, exo.prompt).toBeGreaterThanOrEqual(0);
      expect(toC, exo.prompt).toBeLessThan(grid.length);
      expect(optionEmoji(rightOption(exo)), exo.prompt).toBe(grid[toR][toC]);
      expect(new Set(optionsOf(exo).map(optionEmoji)).size).toBe(3);
      expect(apostrophes(exo.prompt), exo.prompt).toBeLessThanOrEqual(1);
    }
  });

  it("grille-glisser : les dessins de la première ligne (ou colonne) sont d'un côté, ceux de la seconde de l'autre", () => {
    for (const d of draws) {
      const exo = make("grille-glisser", d);
      const grid = gridOf(exo.prompt);
      expect(grid).toHaveLength(2);
      const byRows = /en haut ou en bas\.$/.test(exo.prompt);
      expect(byRows || /à gauche ou à droite\.$/.test(exo.prompt), exo.prompt).toBe(true);
      if (d.level === 1) expect(byRows, exo.prompt).toBe(true);
      const items = itemsOf(exo);
      expect(items).toHaveLength(4);
      for (const item of items) {
        const emoji = optionEmoji(item.text);
        const r = grid.findIndex((row) => row.includes(emoji));
        const c = grid[r].indexOf(emoji);
        expect(item.correctZone, `${exo.prompt} : ${item.text}`).toBe(byRows ? (r === 0 ? "En haut" : "En bas") : c === 0 ? "À gauche" : "À droite");
      }
      for (const zone of zonesOf(exo)) expect(items.filter((item) => item.correctZone === zone), zone).toHaveLength(2);
    }
  });
});

// ===========================================================================
// CE QUI VAUT POUR TOUS
// ===========================================================================

describe("tous les gabarits du temps et de l'espace", () => {
  const exos = NEW_KINDS.flatMap((kind) => draws.slice(0, 120).map((d) => ({ kind, exo: make(kind, d) })));

  it("ne mettent aucun deux-points ni plus d'une apostrophe dans l'énoncé, et tiennent en vingt mots", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      const words = exo.prompt
        .replace(/\p{Extended_Pictographic}/gu, " ")
        .split(/\s+/)
        .filter((token) => /[\p{L}\p{N}]/u.test(token));
      expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(20);
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation (Unicode 11 au plus, un appareil ancien montre sinon un carré)", () => {
    for (const { kind, exo } of exos) {
      const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey]);
      expect(text, kind).not.toContain("\uFE0F");
    }
    for (const thing of SCENE_THINGS) expect(thing.emoji).not.toContain("\uFE0F");
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
      // Les étiquettes à placer, pas les noms des cases : un indice peut dire « la case du devant ».
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
      const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de leur matière sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const subject = (TIME_KINDS as readonly string[]).includes(kind) ? "Histoire" : "Géographie";
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CI",
        subject,
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("donnent une image à chaque tuile qui nomme une chose : un animal, un repère, une étape de croissance, un moment", () => {
    const THING_KINDS: readonly GameKind[] = [
      "moment-ordre",
      "activite-moment",
      "moment-voisin",
      "avant-apres-glisser",
      "cycle-ordre",
      "avant-apres",
      "grandir-relier",
      "sur-sous",
      "devant-derriere",
      "position-glisser",
      "file-ordre",
      "a-cote",
      "entre",
      "pres-loin",
      "rangee-voisin",
      "gauche-droite-glisser",
      "rangee-copie",
      "repere-glisser",
      "repere-qcm",
      "repere-intrus",
      "repere-trajet",
      "grille-position",
      "grille-ligne-colonne",
      "grille-trou",
      "pion-deplacement",
      "grille-glisser",
    ];
    for (const { kind, exo } of exos.filter(({ kind }) => THING_KINDS.includes(kind))) {
      const tiles: string[] = [];
      if (exo.payload.options) tiles.push(...optionsOf(exo));
      if (exo.payload.blanks) tiles.push(...blankOf(exo).options);
      if (exo.payload.correctSequence) tiles.push(...sequenceOf(exo));
      if (exo.payload.pairs) tiles.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) tiles.push(...itemsOf(exo).map((item) => item.text));
      for (const tile of tiles) expect(pictureForTile(tile), `${kind} : « ${tile} »`).not.toBeNull();
    }
    // Les cases des moments de la journée ont, elles aussi, leur scène.
    for (const label of ["Le matin", "Midi", "L'après-midi", "Le soir", "La nuit"]) expect(pictureForTile(label), label).not.toBeNull();
  });
});

// ===========================================================================
// LES HUIT THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les huit thématiques d'histoire et de géographie du CI", () => {
  const KEYS = ["hi-ci-journee", "hi-ci-ordre", "hi-ci-hier-demain", "hi-ci-semaine", "ge-ci-position", "ge-ci-lateralite", "ge-ci-reperes", "ge-ci-quadrillage"];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      // « ge-ci-quadrillage » garde ses trois copies de dessin (un jeu, pas un gabarit) : le reste est écrit par le code.
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      const subject = key.startsWith("hi-") ? "Histoire" : "Géographie";
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          // Deux exercices identiques dans un palier : l'enfant le remarque. Les dessins à copier (pixel-art) ont leur propre règle.
          const questions = games.filter((game) => game.type !== "pixel-art").map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games.filter((g) => g.type !== "pixel-art")) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CI",
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
      const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex: 2, palierCount: 3, seed: key });
      expect(new Set(games.map((game) => game.type)).size, key).toBeGreaterThanOrEqual(3);
    }
  });
});
