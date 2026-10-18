import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { verifyAnswer } from "../paliers/exerciseRules";
import { genderOf } from "../paliers/genders";
import { GAME_KINDS, gameCount, gameOriginOf, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { noTenCrossing } from "../paliers/games/problems";
import { gameLevel, makeContext, type GameLevel } from "../paliers/games/shared";
import { CELLS, CHILDREN, ITEMS, LARGE_GRIDS, SMALL_GRIDS, cellOf } from "../paliers/games/stories";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";
import { speakablePrompt } from "../voice/speakable";

/**
 * LES GABARITS DE PETITS PROBLÈMES DU CI (« Petits problèmes », `ma-ci-problemes`) :
 * dix exercices écrits par le code, dont la réponse se RECALCULE depuis l'énoncé avec
 * des tables de faits écrites ici, à part du lexique (`stories.ts`). Un gabarit qui
 * se trompe d'accord, de compte, de plafond ou de verbe, ce test le voit.
 */

const KINDS = [
  "image-compter",
  "image-qui",
  "tableau-case",
  "tableau-nombre",
  "image-donnee",
  "probleme-donnee",
  "donnee-ou-question",
  "probleme-question",
  "donnee-inutile",
  "probleme-inutile",
] as const satisfies readonly GameKind[];

type Kind = (typeof KINDS)[number];

// ---------------------------------------------------------------------------
// Les faits, écrits à part du lexique
// ---------------------------------------------------------------------------

/** Le pluriel de chaque chose et son émoji. */
const EMOJI: Record<string, string> = {
  mangues: "🥭", bananes: "🍌", oranges: "🍊", pains: "🥖", bonbons: "🍬", billes: "🔵", ballons: "⚽",
  poules: "🐔", moutons: "🐑", vaches: "🐄", poissons: "🐟", cahiers: "📒", règles: "📏",
};
const PLURAL_OF: Record<string, string> = {
  mangue: "mangues", banane: "bananes", orange: "oranges", pain: "pains", bonbon: "bonbons", bille: "billes", ballon: "ballons",
  poule: "poules", mouton: "moutons", vache: "vaches", poisson: "poissons", cahier: "cahiers", règle: "règles",
};
const GENDER: Record<string, "m" | "f"> = {
  mangues: "f", bananes: "f", oranges: "f", pains: "m", bonbons: "m", billes: "f", ballons: "m",
  poules: "f", moutons: "m", vaches: "f", poissons: "m", cahiers: "m", règles: "f",
};
const FAMILY: Record<string, string> = {
  mangues: "fruit", bananes: "fruit", oranges: "fruit", pains: "nourriture", bonbons: "nourriture", billes: "jeu", ballons: "jeu",
  poules: "animal", moutons: "animal", vaches: "animal", poissons: "animal", cahiers: "ecole", règles: "ecole",
};
/** Comment on se retrouve avec « ces mangues » : on les cueille, on les achète, on les a. */
const GETS: Record<string, string> = {
  mangues: "cueille", bananes: "cueille", oranges: "cueille", pains: "achète", bonbons: "achète", billes: "a", ballons: "a",
  poules: "a", moutons: "a", vaches: "a", poissons: "achète", cahiers: "achète", règles: "achète",
};
/** Ce qu'on fait d'une chose pour en avoir moins : on ne mange pas une bille. */
const REMOVES: Record<string, string[]> = {
  mangues: ["mange", "donne", "vend"], bananes: ["mange", "donne", "vend"], oranges: ["mange", "donne", "vend"],
  pains: ["mange", "donne"], bonbons: ["mange", "donne", "perd"], billes: ["donne", "perd"], ballons: ["donne", "perd"],
  poules: ["vend", "donne"], moutons: ["vend", "donne"], vaches: ["vend", "donne"], poissons: ["vend", "mange", "donne"],
  cahiers: ["donne", "perd"], règles: ["donne", "perd"],
};
/** La forme interrogative de chaque verbe, sans le pronom : « vend-il », jamais « vend-t-il ». */
const ASKS: Record<string, string> = { mange: "mange-t-", donne: "donne-t-", perd: "perd-", vend: "vend-" };
/** Deux émojis qu'on confond en petit. */
const CLASHES: [string, string][] = [["🥭", "🍊"]];

const GIRLS = ["Awa", "Fatou", "Mariama", "Aïssatou", "Penda", "Khady", "Sokhna", "Coumba", "Ndèye", "Rama"];
const BOYS = ["Moussa", "Modou", "Ibrahima", "Ousmane", "Cheikh", "Mamadou", "Abdou", "Lamine", "Samba", "Malick"];
const NAMES = [...GIRLS, ...BOYS];
const pronounOf = (name: string) => (GIRLS.includes(name) ? "elle" : "il");
/** Un prénom du lexique, entier, où qu'il soit dans un texte. */
const ANY_NAME = new RegExp(`(?<!\\p{L})(?:${NAMES.join("|")})(?!\\p{L})`, "u");

/** Chaque case du tableau : son objet et sa couleur. */
const CELL: Record<string, [string, string]> = {
  "💙": ["coeur", "bleu"], "💚": ["coeur", "vert"], "💛": ["coeur", "jaune"], "🧡": ["coeur", "orange"], "💜": ["coeur", "violet"], "🖤": ["coeur", "noir"],
  "📕": ["livre", "rouge"], "📗": ["livre", "vert"], "📘": ["livre", "bleu"], "📙": ["livre", "orange"],
  "🔶": ["losange", "orange"], "🔷": ["losange", "bleu"],
};
const SCENE: Record<string, string[]> = {
  "dans la cour": ["🐔", "🐑", "🐄"],
  "dans le panier": ["🥭", "🍌", "🥖"],
  "sur la table": ["📒", "📏", "🍬"],
};
/** Le plus grand nombre d'un palier, selon le plafond de la fiche. */
const TOP: Record<10 | 20, Record<GameLevel, number>> = {
  10: { 1: 5, 2: 7, 3: 9, 4: 10 },
  20: { 1: 5, 2: 10, 3: 15, 4: 20 },
};

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const CAPS = [10, 20] as const;
const DRAWS = 300;

type Exo = ReturnType<(typeof GAME_KINDS)[Kind]["make"]>;
type Draw = { cap: 10 | 20; level: GameLevel; seed: string; top: number };

const draws: Draw[] = CAPS.flatMap((cap) =>
  LEVELS.flatMap((level) => Array.from({ length: DRAWS }, (_, n) => ({ cap, level, seed: `pb:${cap}:${level}:${n}`, top: TOP[cap][level] }))),
);
const make = (kind: Kind, d: Draw): Exo => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`, undefined, `nombres-${d.cap}`));

/**
 * Les tirages d'un gabarit, fabriqués UNE fois et partagés par ses tests : les refaire à chaque
 * test doublait le temps de la suite entière, et dépassait le délai de cinq secondes sur une
 * machine chargée.
 */
const drawnByKind = new Map<Kind, { d: Draw; exo: Exo }[]>();
function drawn(kind: Kind): { d: Draw; exo: Exo }[] {
  let list = drawnByKind.get(kind);
  if (!list) {
    list = draws.map((d) => ({ d, exo: make(kind, d) }));
    drawnByKind.set(kind, list);
  }
  return list;
}

const pictographs = (text: string) => Array.from(text.matchAll(/\p{Extended_Pictographic}/gu)).map((m) => m[0]);
const numbersIn = (text: string) => Array.from(text.matchAll(/\d+/g)).map(Number);
const wordCount = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const sentences = (text: string) => (text.match(/[.?!](?=\s|$)/g) ?? []).length;
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
/** Le pluriel d'un nom écrit au singulier ou au pluriel. */
const pluralOf = (word: string) => PLURAL_OF[word] ?? word;
/** « 1 mangue », « 3 mangues » : l'accord du nom avec le nombre. */
function expectAgreement(n: number, word: string, where: string) {
  if (n === 1) expect(PLURAL_OF[word], `${where} : « 1 ${word} »`).toBeDefined();
  else expect(EMOJI[word], `${where} : « ${n} ${word} »`).toBeDefined();
}

/** Tous les textes que l'enfant lit : l'énoncé, les options, les étiquettes, la phrase à trous, les indices. */
function shownTexts(exo: Exo): string[] {
  const p = exo.payload;
  return [
    exo.prompt,
    ...(Array.isArray(p.options) ? (p.options as string[]) : []),
    ...(Array.isArray(p.zones) ? (p.zones as string[]) : []),
    ...(Array.isArray(p.items) ? itemsOf(exo).map((item) => item.text) : []),
    ...(typeof p.text === "string" ? [p.text, ...blankOf(exo).options] : []),
    ...exo.hints,
  ];
}

/** La réponse juste d'un exercice fabriqué, dans la forme que l'écran envoie. */
function rightAnswer(exo: Exo): string {
  switch (exo.type) {
    case "qcm":
      return String(exo.payload.correctIndex);
    case "fill-blank":
      return JSON.stringify([blankOf(exo).answer]);
    case "drag-drop":
      return JSON.stringify(Object.fromEntries(itemsOf(exo).map((item) => [item.text, item.correctZone])));
    default:
      throw new Error(`type inattendu : ${exo.type}`);
  }
}

// ---------------------------------------------------------------------------
// Le lexique
// ---------------------------------------------------------------------------

describe("le lexique des petits problèmes", () => {
  it("donne à chaque chose le genre du dictionnaire (genders.ts), son pluriel, sa famille et un émoji sûr", () => {
    expect(ITEMS.map((t) => t.plural).sort()).toEqual(Object.keys(EMOJI).sort());
    for (const thing of ITEMS) {
      expect(genderOf(thing.singular), thing.singular).toBe(thing.gender);
      expect(thing.gender, thing.plural).toBe(GENDER[thing.plural]);
      expect(thing.emoji, thing.plural).toBe(EMOJI[thing.plural]);
      expect(PLURAL_OF[thing.singular], thing.singular).toBe(thing.plural);
      expect(thing.family, thing.plural).toBe(FAMILY[thing.plural]);
      expect(thing.gets, thing.plural).toBe(GETS[thing.plural]);
      expect([...thing.remove].sort(), thing.plural).toEqual([...REMOVES[thing.plural]].sort());
      expect(thing.vowel, thing.plural).toBe(/^[aeiouyéè]/i.test(thing.plural));
      expect(thing.emoji, thing.plural).not.toMatch(/[\u{FE0F}\u{200D}]/u);
      expect(Array.from(thing.emoji), thing.plural).toHaveLength(1);
    }
    // Chaque famille a au moins deux membres : au dernier palier, le mauvais choix vient de la même famille.
    for (const family of new Set(ITEMS.map((t) => t.family))) {
      expect(ITEMS.filter((t) => t.family === family).length, family).toBeGreaterThanOrEqual(2);
    }
    expect(new Set(ITEMS.map((t) => t.emoji)).size).toBe(ITEMS.length);
  });

  it("connaît vingt prénoms, leur genre et leur voyelle initiale", () => {
    expect(CHILDREN.map((c) => c.name).sort()).toEqual([...NAMES].sort());
    for (const child of CHILDREN) {
      expect(child.gender, child.name).toBe(GIRLS.includes(child.name) ? "f" : "m");
      expect(child.vowel, child.name).toBe(/^[AEIOUY]/.test(child.name));
    }
  });

  it("dessine chaque case d'un tableau avec un émoji dont l'objet et la couleur sont sûrs, et des grilles complètes", () => {
    expect(CELLS.map((c) => c.emoji).sort()).toEqual(Object.keys(CELL).sort());
    for (const cell of CELLS) {
      expect([cell.object, cell.color], cell.emoji).toEqual(CELL[cell.emoji]);
      expect(cell.emoji).not.toMatch(/[\u{FE0F}\u{200D}]/u);
    }
    // 🔵 est une bille : jamais une case du tableau.
    expect(CELLS.map((c) => c.emoji)).not.toContain("🔵");
    for (const grid of [...SMALL_GRIDS, ...LARGE_GRIDS]) {
      for (const object of grid.objects) for (const color of grid.colors) expect(cellOf(object, color), `${object} ${color}`).toBeDefined();
    }
    for (const grid of SMALL_GRIDS) expect([grid.objects.length, grid.colors.length]).toEqual([2, 2]);
    for (const grid of LARGE_GRIDS) expect(grid.objects.length * grid.colors.length).toBe(6);
  });

  it("ne passe jamais la dizaine", () => {
    expect(noTenCrossing(4, "+", 3)).toBe(true);
    expect(noTenCrossing(7, "+", 3)).toBe(true);
    expect(noTenCrossing(8, "+", 5)).toBe(false);
    expect(noTenCrossing(10, "+", 6)).toBe(true);
    expect(noTenCrossing(12, "+", 5)).toBe(true);
    expect(noTenCrossing(15, "+", 5)).toBe(false);
    expect(noTenCrossing(7, "-", 3)).toBe(true);
    expect(noTenCrossing(13, "-", 5)).toBe(false);
    expect(noTenCrossing(17, "-", 4)).toBe(true);
    expect(noTenCrossing(14, "-", 4)).toBe(true);
    expect(noTenCrossing(20, "-", 3)).toBe(false);
    expect(noTenCrossing(3, "-", 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Ce que les dix gabarits respectent tous
// ---------------------------------------------------------------------------

describe.each(KINDS)("le gabarit « %s »", (kind) => {
  it("refait le même exercice avec la même graine, et garde son origine", () => {
    for (const d of draws.slice(0, 40)) {
      expect(make(kind, d)).toEqual(make(kind, d));
      expect(gameOriginOf(make(kind, d).payload)).toEqual({ kind, level: d.level, vocabulary: `nombres-${d.cap}` });
    }
  });

  it("passe le contrôleur sans aucun défaut, avertissements compris, et se corrige avec la règle de toujours", () => {
    for (const { d, exo } of drawn(kind)) {
      const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: "CI", subject: "Mathématiques" });
      expect(defects, `${d.seed} : ${exo.prompt}`).toEqual([]);
      expect(verifyAnswer(exo, rightAnswer(exo)), exo.prompt).toBe(true);
      expect(verifyAnswer(exo, "[]"), exo.prompt).toBe(false);
      if (exo.type === "qcm") {
        const wrongIndex = optionsOf(exo).findIndex((_, i) => i !== exo.payload.correctIndex);
        expect(verifyAnswer(exo, String(wrongIndex)), exo.prompt).toBe(false);
        expect(rightOption(exo), exo.prompt).toBe(exo.answerKey);
        expect(optionsOf(exo).filter((o) => o === exo.answerKey), exo.prompt).toHaveLength(1);
        expect(new Set(optionsOf(exo)).size, exo.prompt).toBe(optionsOf(exo).length);
        expect(optionsOf(exo).length, exo.prompt).toBeGreaterThanOrEqual(3);
      }
    }
  });

  // Les textes fautifs sont ramassés dans une liste, puis UN `expect` par exercice : des milliers de
  // tirages fois dix textes fois deux `expect` pesaient plus que la fabrication des exercices.
  it("écrit deux phrases au plus, vingt mots au plus, sans deux-points, une apostrophe droite au plus, sans sélecteur de variation", () => {
    for (const { exo } of drawn(kind)) {
      expect(sentences(exo.prompt), exo.prompt).toBeLessThanOrEqual(2);
      expect(wordCount(exo.prompt), exo.prompt).toBeLessThanOrEqual(20);
      expect(exo.prompt, exo.prompt).not.toMatch(/:/);
      expect((exo.prompt.match(/'/g) ?? []).length, exo.prompt).toBeLessThanOrEqual(1);
      // Jamais « de oranges », ni « d'mangues ».
      expect(exo.prompt, exo.prompt).not.toMatch(/\bde [aeiouyAEIOUY]/);
      expect(exo.prompt, exo.prompt).not.toMatch(/\bd'[^aeiouyAEIOUYÏ]/);
      // Ni sélecteur de variation, ni double espace, dans tout ce que l'enfant lit.
      expect(shownTexts(exo).filter((text) => /[\u{FE0F}\u{200D}]/u.test(text) || /\S {2,}\S/.test(text)), exo.prompt).toEqual([]);
      // Aucun signe entre deux groupes d'émojis : le contrôleur y lirait un calcul.
      expect(exo.prompt, exo.prompt).not.toMatch(/\p{Extended_Pictographic}\s*[+−–-]\s*\p{Extended_Pictographic}/u);
      // Une rangée d'une même sorte ne dépasse jamais dix.
      expect((exo.prompt.match(/(\p{Extended_Pictographic})(?:\s?\1)*/gu) ?? []).filter((run) => pictographs(run).length > 10), exo.prompt).toEqual([]);
    }
  });

  it("ne montre aucun nombre au-delà du plafond du palier, ni en énoncé, ni en options, ni en étiquettes", () => {
    for (const { d, exo } of drawn(kind)) {
      const shown = shownTexts(exo).filter((t) => !exo.hints.includes(t));
      expect(shown.filter((text) => numbersIn(text).some((n) => n > d.top)), `${d.seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("donne trois indices différents, sans chiffre, sans prénom quand la réponse est un prénom, sans mot proposé quand la réponse est un mot", () => {
    for (const { exo } of drawn(kind)) {
      expect(exo.hints, exo.prompt).toHaveLength(3);
      expect(new Set(exo.hints).size, exo.prompt).toBe(3);
      expect(exo.hints.filter((hint) => /\d/.test(hint) || /\p{Extended_Pictographic}/u.test(hint)), exo.prompt).toEqual([]);
      if (kind === "image-qui") expect(exo.hints.filter((hint) => ANY_NAME.test(hint)), exo.prompt).toEqual([]);
      if (kind === "probleme-question") {
        const proposed = blankOf(exo).options.map((option) => option.replace(/\p{Extended_Pictographic}/gu, "").trim());
        expect(exo.hints.filter((hint) => proposed.some((word) => hint.toLowerCase().includes(word))), exo.prompt).toEqual([]);
      }
    }
  });

  it("se dit à voix haute sans émoji ni retour à la ligne, et garde une phrase correcte", () => {
    for (const { exo } of drawn(kind).slice(0, 200)) {
      const spoken = speakablePrompt(exo.prompt);
      expect(spoken).not.toBeNull();
      expect(spoken, spoken!).not.toMatch(/\p{Extended_Pictographic}|\n/u);
      // Un émoji retiré ne laisse ni espace avant une virgule ni double espace.
      expect(spoken, spoken!).not.toMatch(/\s[,.]|\s{2}/);
    }
  });

  if (GAME_KINDS[kind].type === "qcm") {
    it("ne met pas toujours la bonne réponse au même endroit", () => {
      const positions = new Set(drawn(kind).slice(0, 120).map(({ exo }) => exo.payload.correctIndex as number));
      expect(positions.size).toBeGreaterThanOrEqual(2);
    });
  }
});

// ---------------------------------------------------------------------------
// Chaque gabarit, recalculé depuis l'énoncé
// ---------------------------------------------------------------------------

describe("trouver un indice dans une image", () => {
  it("image-compter : la réponse est le nombre de dessins de la sorte demandée, parmi d'autres sortes de la même scène", () => {
    for (const { d, exo } of drawn("image-compter")) {
      const m = /^Combien de (\p{L}+) vois-tu (dans la cour|dans le panier|sur la table) \? (.+)$/u.exec(exo.prompt);
      expect(m, exo.prompt).not.toBeNull();
      const [, plural, place, drawn] = m!;
      const emoji = EMOJI[plural];
      const row = drawn.split(" ");
      expect(row.every((e) => SCENE[place].includes(e)), exo.prompt).toBe(true);
      expect(row.filter((e) => e === emoji).length, exo.prompt).toBe(Number(rightOption(exo)));
      expect(row.length, exo.prompt).toBeLessThanOrEqual(Math.min(10, d.top));
      // « Tout compter » (le total de la rangée) est l'erreur que le gabarit fait voir : toujours proposée.
      expect(optionsOf(exo).map(Number), exo.prompt).toContain(row.length);
      const sorts = new Set(row).size;
      expect(sorts, exo.prompt).toBe(d.level >= 3 ? 3 : 2);
      // Chaque autre sorte est là au moins une fois, et jamais autant que la sorte demandée.
      for (const other of new Set(row.filter((e) => e !== emoji))) expect(row.filter((e) => e === other).length, exo.prompt).not.toBe(Number(rightOption(exo)));
      if (d.level === 1) expect(Number(rightOption(exo)), exo.prompt).toBeLessThanOrEqual(4);
    }
  });

  it("image-qui : le plus, le moins ou autant se lisent en comptant chaque groupe derrière son prénom", () => {
    for (const { d, exo } of drawn("image-qui")) {
      const m = /^Voici les (\p{L}+) (.+)\. Qui a (le plus|le moins|autant) de \1(?: que (\p{L}+))? \?$/u.exec(exo.prompt);
      expect(m, exo.prompt).not.toBeNull();
      const [, plural, groups, how, ref] = m!;
      expect(EMOJI[plural], exo.prompt).toBeDefined();
      expect(plural, exo.prompt).not.toMatch(/^[aeiou]/);
      const kids = groups.split(/, | et /).map((part) => {
        const g = /^d(?:e |')(\p{L}+) (\p{Extended_Pictographic}+)$/u.exec(part);
        expect(g, `${exo.prompt} : ${part}`).not.toBeNull();
        expect(new Set(pictographs(g![2])), part).toEqual(new Set([EMOJI[plural]]));
        expect(part.startsWith("d'"), part).toBe(/^d'[AEIOUY]/.test(part));
        return { name: g![1], count: pictographs(g![2]).length };
      });
      expect(kids.every((k) => NAMES.includes(k.name)), exo.prompt).toBe(true);
      expect(new Set(kids.map((k) => k.name)).size, exo.prompt).toBe(kids.length);
      const counts = kids.map((k) => k.count);
      if (how === "autant") {
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(3);
        expect(kids, exo.prompt).toHaveLength(4);
        expect(kids[0].name, exo.prompt).toBe(ref);
        const same = kids.slice(1).filter((k) => k.count === kids[0].count);
        expect(same, exo.prompt).toHaveLength(1);
        expect(rightOption(exo), exo.prompt).toBe(same[0].name);
        expect([...optionsOf(exo)].sort(), exo.prompt).toEqual(kids.slice(1).map((k) => k.name).sort());
        expect(new Set(kids.slice(1).map((k) => k.count)).size, exo.prompt).toBe(3);
      } else {
        expect(d.level, exo.prompt).toBeLessThanOrEqual(2);
        expect(kids, exo.prompt).toHaveLength(3);
        expect(new Set(counts).size, exo.prompt).toBe(3);
        const wanted = how === "le plus" ? Math.max(...counts) : Math.min(...counts);
        expect(rightOption(exo), exo.prompt).toBe(kids[counts.indexOf(wanted)].name);
        expect([...optionsOf(exo)].sort(), exo.prompt).toEqual(kids.map((k) => k.name).sort());
        if (d.level === 1) {
          expect(how, exo.prompt).toBe("le plus");
          const sorted = [...counts].sort((a, b) => b - a);
          expect(sorted[0] - sorted[1], exo.prompt).toBeGreaterThanOrEqual(2);
        }
      }
      for (const count of counts) expect(count, exo.prompt).toBeLessThanOrEqual(Math.min(10, d.top));
    }
  });

  it("image-donnee : le premier nombre se compte dans l'image, le verbe dit l'opération, et le calcul ne passe pas la dizaine", () => {
    for (const { d, exo } of drawn("image-donnee")) {
      const m =
        /^(\p{L}+) (cueille|achète|a) ces (\p{L}+) (\p{Extended_Pictographic}+) et (?:en (mange|donne|perd|vend) (\d+)\. Combien lui en reste-t-il \?|(\p{L}+) lui en donne (\d+)\. Combien en a-t-(il|elle) maintenant \?)$/u.exec(
          exo.prompt,
        );
      expect(m, exo.prompt).not.toBeNull();
      const [, hero, gets, plural, drawn, verb, taken, giver, given, pronoun] = m!;
      expect(gets, exo.prompt).toBe(GETS[plural]);
      expect(new Set(pictographs(drawn)), exo.prompt).toEqual(new Set([EMOJI[plural]]));
      const a = pictographs(drawn).length;
      expect(numbersIn(exo.prompt), exo.prompt).toHaveLength(1);
      // « Oublier de calculer » (le nombre du dessin) est l'erreur que le gabarit fait voir : toujours proposée.
      expect(optionsOf(exo).map(Number), exo.prompt).toContain(a);
      if (verb) {
        expect(REMOVES[plural], exo.prompt).toContain(verb);
        expect(noTenCrossing(a, "-", Number(taken)), exo.prompt).toBe(true);
        expect(Number(rightOption(exo)), exo.prompt).toBe(a - Number(taken));
      } else {
        expect(giver, exo.prompt).not.toBe(hero);
        // Le donneur est de l'autre genre : « a-t-elle » ne peut désigner que le héros, à l'oral aussi.
        expect(pronounOf(giver), exo.prompt).not.toBe(pronounOf(hero));
        expect(pronoun, exo.prompt).toBe(pronounOf(hero));
        expect(noTenCrossing(a, "+", Number(given)), exo.prompt).toBe(true);
        expect(Number(rightOption(exo)), exo.prompt).toBe(a + Number(given));
      }
      expect(a, exo.prompt).toBeLessThanOrEqual(Math.min(10, d.top));
      if (d.level === 1) expect(a, exo.prompt).toBeLessThanOrEqual(5);
    }
  });
});

describe("lire un tableau à double entrée", () => {
  it("tableau-case : la case qui manque est celle dont la ligne donne l'objet et la colonne la couleur (ou l'inverse)", () => {
    for (const { d, exo } of drawn("tableau-case")) {
      const lines = exo.prompt.split("\n");
      expect(lines[0], exo.prompt).toBe("Regarde le tableau.");
      expect(lines[lines.length - 1], exo.prompt).toBe("Quel dessin manque dans le tableau ?");
      const grid = lines.slice(1, -1).map((line) => line.split(" "));
      const width = grid[0].length;
      expect(grid.every((line) => line.length === width), exo.prompt).toBe(true);
      if (d.level <= 2) expect([grid.length, width], exo.prompt).toEqual([2, 2]);
      else expect(grid.length * width, exo.prompt).toBe(6);
      const holes = grid.flatMap((line, i) => line.flatMap((cell, j) => (cell === "❔" ? [[i, j]] : [])));
      expect(holes, exo.prompt).toHaveLength(1);
      const [r, c] = holes[0];
      const cells = grid.flat().filter((cell) => cell !== "❔");
      expect(cells.every((cell) => CELL[cell] !== undefined), exo.prompt).toBe(true);
      expect(new Set(cells).size, exo.prompt).toBe(cells.length);
      // Chaque ligne ne porte qu'un objet et chaque colonne qu'une couleur, ou l'inverse : un vrai tableau à double entrée.
      const facet = (cell: string, k: 0 | 1) => CELL[cell][k];
      const uniform = (cellsOf: string[], k: 0 | 1) => new Set(cellsOf.filter((cell) => cell !== "❔").map((cell) => facet(cell, k))).size === 1;
      const rows = grid.map((line) => line);
      const columns = Array.from({ length: width }, (_, j) => grid.map((line) => line[j]));
      const objectRows = rows.every((line) => uniform(line, 0)) && columns.every((column) => uniform(column, 1));
      const colorRows = rows.every((line) => uniform(line, 1)) && columns.every((column) => uniform(column, 0));
      expect(objectRows || colorRows, exo.prompt).toBe(true);
      const rowValue = facet(rows[r].find((cell) => cell !== "❔")!, objectRows ? 0 : 1);
      const colValue = facet(columns[c].find((cell) => cell !== "❔")!, objectRows ? 1 : 0);
      const [object, color] = objectRows ? [rowValue, colValue] : [colValue, rowValue];
      const expected = Object.entries(CELL).find(([, [o, k]]) => o === object && k === color)![0];
      expect(rightOption(exo), exo.prompt).toBe(expected);
      expect(cells, exo.prompt).not.toContain(expected);
      // Les mauvais choix : jamais le même objet ET la même couleur, et chacun est une vraie case.
      for (const option of optionsOf(exo).filter((o) => o !== expected)) {
        expect(CELL[option], `${exo.prompt} : ${option}`).toBeDefined();
        expect(CELL[option][0] === object && CELL[option][1] === color, option).toBe(false);
      }
      expect(optionsOf(exo).length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(exo.prompt, exo.prompt).not.toMatch(/forme|figure/i);
      // La case qui manque montre un point d'interrogation, pas du vide : les indices disent ce que l'écran montre.
      for (const hint of exo.hints) expect(hint, hint).not.toMatch(/vide/i);
      expect(exo.hints[0], exo.prompt).toMatch(/point d'interrogation/);
    }
  });

  it("tableau-nombre : la case demandée se lit sur la ligne de l'enfant et dans la colonne de l'objet", () => {
    for (const { d, exo } of drawn("tableau-nombre")) {
      const [first, rest] = exo.prompt.split("\n");
      expect(first, exo.prompt).toMatch(/,$/);
      const q = /^(.+)\. Combien (?:de |d')(\p{L}+) a (\p{L}+) \?$/u.exec(rest);
      expect(q, exo.prompt).not.toBeNull();
      const [, second, asked, who] = q!;
      const line = /^(\p{L}+) a (\d+) (\p{L}+)(?: (\p{Extended_Pictographic}+))? et (\d+) (\p{L}+)(?: (\p{Extended_Pictographic}+))?$/u;
      const rows = [first.slice(0, -1), second].map((text) => {
        const m = line.exec(text);
        expect(m, `${exo.prompt} : ${text}`).not.toBeNull();
        const [, name, n1, w1, e1, n2, w2, e2] = m!;
        expectAgreement(Number(n1), w1, text);
        expectAgreement(Number(n2), w2, text);
        for (const [n, w, e] of [[n1, w1, e1], [n2, w2, e2]] as const) {
          if (d.level <= 2) {
            expect(e, text).toBeDefined();
            expect(pictographs(e!).length, text).toBe(Number(n));
            expect(new Set(pictographs(e!)), text).toEqual(new Set([EMOJI[pluralOf(w)]]));
          } else expect(e, text).toBeUndefined();
        }
        return { name, cells: { [pluralOf(w1)]: Number(n1), [pluralOf(w2)]: Number(n2) } };
      });
      expect(rows.map((r) => r.name).every((name) => NAMES.includes(name)), exo.prompt).toBe(true);
      expect(rows[0].name, exo.prompt).not.toBe(rows[1].name);
      const nouns = Object.keys(rows[0].cells);
      expect(nouns, exo.prompt).toHaveLength(2);
      expect(Object.keys(rows[1].cells), exo.prompt).toEqual(nouns);
      for (const [a, b] of CLASHES) expect(nouns.map((n) => EMOJI[n]).includes(a) && nouns.map((n) => EMOJI[n]).includes(b), exo.prompt).toBe(false);
      const values = rows.flatMap((r) => Object.values(r.cells));
      expect(new Set(values).size, exo.prompt).toBe(4);
      const row = rows.find((r) => r.name === who);
      expect(row, exo.prompt).toBeDefined();
      expect(Number(rightOption(exo)), exo.prompt).toBe(row!.cells[asked]);
      // Les mauvais choix sont les autres cases.
      for (const option of optionsOf(exo)) expect(values, exo.prompt).toContain(Number(option));
      expect(optionsOf(exo).length, exo.prompt).toBe(d.level === 1 ? 3 : 4);
    }
  });
});

describe("repérer la donnée et la question d'un problème", () => {
  const story = /^(\p{L}+) a (\d+) (\p{L}+), (?:(il|elle) en (mange|donne|perd|vend) (\d+)(?: à (\p{L}+))?|(\p{L}+) lui en donne (\d+))\.$/u;

  it("probleme-donnee : la réponse est la donnée demandée, jamais le résultat, qui diffère des deux données", () => {
    for (const { d, exo } of drawn("probleme-donnee")) {
      const dot = exo.prompt.indexOf(". ");
      const m = story.exec(exo.prompt.slice(0, dot + 1));
      expect(m, exo.prompt).not.toBeNull();
      const [, hero, aText, word, pronoun, verb, bText, to, giver, givenText] = m!;
      const a = Number(aText);
      const b = Number(verb ? bText : givenText);
      const plural = pluralOf(word);
      expectAgreement(a, word, exo.prompt);
      const question = exo.prompt.slice(dot + 2);
      if (verb) {
        expect(pronoun, exo.prompt).toBe(pronounOf(hero));
        expect(REMOVES[plural], exo.prompt).toContain(verb);
        expect(to !== undefined, exo.prompt).toBe(verb === "donne");
        if (to) expect(to, exo.prompt).not.toBe(hero);
        expect(noTenCrossing(a, "-", b), exo.prompt).toBe(true);
        expect(a - b, exo.prompt).not.toBe(b);
      } else {
        expect(giver, exo.prompt).not.toBe(hero);
        expect(noTenCrossing(a, "+", b), exo.prompt).toBe(true);
        expect(a + b, exo.prompt).toBeLessThanOrEqual(d.top);
      }
      expect(a, exo.prompt).not.toBe(b);
      const de = /^[aeiou]/.test(plural) ? "d'" : "de ";
      if (/au début \?$/.test(question)) {
        expect(question, exo.prompt).toBe(`Combien ${de}${plural} ${hero} a-t-${pronounOf(hero)} au début ?`);
        expect(Number(rightOption(exo)), exo.prompt).toBe(a);
      } else {
        expect(d.level, exo.prompt).toBeGreaterThanOrEqual(2);
        const subject = verb ? hero : giver;
        expect(question, exo.prompt).toBe(`Combien ${de}${plural} ${subject} ${ASKS[verb ?? "donne"]}${pronounOf(subject)} ?`);
        expect(Number(rightOption(exo)), exo.prompt).toBe(b);
      }
    }
  });

  it("donnee-ou-question : la seule phrase en « ? » va dans « Ce que je cherche », le reste dans « Ce que je sais » ; avec l'âge, les cases sont « Ce qui sert » et « Ce qui ne sert pas »", () => {
    for (const { d, exo } of drawn("donnee-ou-question")) {
      const items = itemsOf(exo);
      const zones = exo.payload.zones as string[];
      const questions = items.filter((item) => item.text.endsWith(" ?"));
      expect(questions, exo.answerKey).toHaveLength(1);
      expect(questions[0].correctZone).toBe("Ce que je cherche");
      const withAge = items.some((item) => /^\p{L}+ a \d+ ans\.$/u.test(item.text));
      // Les cases ne se recouvrent jamais : l'âge est aussi « ce que je sais », donc avec l'âge la case
      // des données s'appelle « Ce qui sert », et « Ce que je sais » disparaît.
      expect(zones, exo.answerKey).toEqual(withAge ? ["Ce qui sert", "Ce qui ne sert pas", "Ce que je cherche"] : ["Ce que je sais", "Ce que je cherche"]);
      for (const item of items.filter((item) => !item.text.endsWith(" ?"))) {
        expect(item.text, item.text).toMatch(/\.$/);
        expect(item.correctZone, item.text).toBe(/^\p{L}+ a \d+ ans\.$/u.test(item.text) ? "Ce qui ne sert pas" : withAge ? "Ce qui sert" : "Ce que je sais");
      }
      expect(new Set(items.map((item) => item.text)).size, exo.answerKey).toBe(items.length);
      for (const zone of zones) expect(items.some((item) => item.correctZone === zone), `${zone} : ${exo.answerKey}`).toBe(true);
      if (d.level <= 2) expect(withAge, exo.answerKey).toBe(false);
      expect(exo.prompt, exo.answerKey).toBe(
        withAge
          ? "Glisse chaque phrase dans sa case, ce qui sert, ce qui ne sert pas, ce que je cherche."
          : "Glisse chaque phrase du problème dans la bonne case, ce que je sais ou ce que je cherche.",
      );
      // Chaque étiquette se comprend seule : l'écran les mélange. Ni pronom sujet, ni « en ».
      for (const item of items) {
        expect(item.text, item.text).not.toMatch(/^(Il|Elle) |\ben (mange|donne|perd|vend|a)\b/);
        if (!item.text.startsWith("Qui ") && !item.text.startsWith("Combien ")) expect(NAMES.some((name) => item.text.startsWith(`${name} `)), item.text).toBe(true);
        for (const [, n, word, emojis] of item.text.matchAll(/(\d+) (\p{L}+)(?: (\p{Extended_Pictographic}+))?/gu)) {
          if (word === "ans") continue;
          expectAgreement(Number(n), word, item.text);
          if (emojis) {
            expect(d.level, item.text).toBeLessThanOrEqual(2);
            expect(pictographs(emojis).length, item.text).toBe(Number(n));
            expect(new Set(pictographs(emojis)), item.text).toEqual(new Set([EMOJI[pluralOf(word)]]));
          } else expect(d.level, item.text).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("probleme-question : le mot juste est le seul mot proposé qui est dans l'énoncé, sans article devant le trou", () => {
    for (const { d, exo } of drawn("probleme-question")) {
      const m = /^(\p{L}+) a (\d+) (\p{L}+)(?: (\p{Extended_Pictographic}+))? et (?:(il|elle) en (mange|donne|perd|vend) (\d+)|(\p{L}+) lui en donne (\d+))\. Complète la question du problème\.$/u.exec(exo.prompt);
      expect(m, exo.prompt).not.toBeNull();
      const [, hero, aText, word, emojis, pronoun, verb, bText, giver, givenText] = m!;
      const plural = pluralOf(word);
      expectAgreement(Number(aText), word, exo.prompt);
      expect(plural, exo.prompt).not.toMatch(/^[aeiou]/);
      if (emojis) {
        expect(d.level, exo.prompt).toBeLessThanOrEqual(2);
        expect(pictographs(emojis).length, exo.prompt).toBe(Number(aText));
        expect(new Set(pictographs(emojis)), exo.prompt).toEqual(new Set([EMOJI[plural]]));
      } else expect(d.level, exo.prompt).toBeGreaterThanOrEqual(3);
      const text = exo.payload.text as string;
      if (verb) {
        expect(pronoun, exo.prompt).toBe(pronounOf(hero));
        expect(REMOVES[plural], exo.prompt).toContain(verb);
        expect(noTenCrossing(Number(aText), "-", Number(bText)), exo.prompt).toBe(true);
        expect(text, exo.prompt).toBe("Combien de ___ lui reste-t-il ?");
      } else {
        expect(giver, exo.prompt).not.toBe(hero);
        // Le donneur est de l'autre genre : « a-t-elle » ne peut désigner que le héros, à l'oral aussi.
        expect(pronounOf(giver), exo.prompt).not.toBe(pronounOf(hero));
        expect(noTenCrossing(Number(aText), "+", Number(givenText)), exo.prompt).toBe(true);
        expect(text, exo.prompt).toBe(`Combien de ___ a-t-${pronounOf(hero)} maintenant ?`);
      }
      const blank = blankOf(exo);
      const wordOf = (option: string) => option.replace(/\p{Extended_Pictographic}/gu, "").trim();
      expect(blank.options, exo.prompt).toHaveLength(3);
      expect(new Set(blank.options).size, exo.prompt).toBe(3);
      expect(wordOf(blank.answer), exo.prompt).toBe(plural);
      expect(blank.options.filter((option) => new RegExp(`\\b${wordOf(option)}\\b`, "u").test(exo.prompt)), exo.prompt).toEqual([blank.answer]);
      for (const option of blank.options) {
        expect(EMOJI[wordOf(option)], option).toBeDefined();
        expect(/\p{Extended_Pictographic}/u.test(option), option).toBe(d.level <= 2);
        if (d.level <= 2) expect(pictographs(option), option).toEqual([EMOJI[wordOf(option)]]);
      }
      const sameFamily = blank.options.filter((option) => option !== blank.answer && FAMILY[wordOf(option)] === FAMILY[plural]).length;
      if (d.level === 1) expect(sameFamily, exo.prompt).toBe(0);
      else expect(sameFamily, exo.prompt).toBeGreaterThanOrEqual(1);
      expect(`${exo.prompt} ${text}`, exo.prompt).not.toMatch(/lettre|syllabe|le mot/i);
    }
  });
});

describe("les données utiles et inutiles", () => {
  const withAge = /^(\p{L}+), (\d+) ans, a (\d+) (\p{L}+) et en (mange|donne|perd|vend) (\d+)\.$/u;
  const withOther = /^(\p{L}+) a (\d+) (\p{L}+) et (\d+) (\p{L}+), (il|elle) (mange|donne|perd|vend) (\d+) (\p{L}+)\.$/u;
  const giftWithAge = /^(\p{L}+), (\d+) ans, a (\d+) (\p{L}+), (\p{L}+) lui donne (\d+) (\p{L}+)\.$/u;
  const giftWithOther = /^(\p{L}+) a (\d+) (\p{L}+) et (\d+) (\p{L}+), (\p{L}+) lui donne (\d+) (\p{L}+)\.$/u;

  type Parsed = { hero: string; giver?: string; a: number; b: number; plural: string; useless: number; uselessKind: "age" | "thing"; otherPlural?: string; op: "+" | "-" };

  function parseStory(text: string, where: string): Parsed {
    let m = withAge.exec(text);
    if (m) {
      const [, hero, age, a, word, verb, b] = m;
      expect(REMOVES[pluralOf(word)], where).toContain(verb);
      expectAgreement(Number(a), word, where);
      return { hero, a: Number(a), b: Number(b), plural: pluralOf(word), useless: Number(age), uselessKind: "age", op: "-" };
    }
    m = withOther.exec(text);
    if (m) {
      const [, hero, a, word, c, other, pronoun, verb, b, bWord] = m;
      expect(pronoun, where).toBe(pronounOf(hero));
      expect(REMOVES[pluralOf(word)], where).toContain(verb);
      expectAgreement(Number(a), word, where);
      expectAgreement(Number(c), other, where);
      expectAgreement(Number(b), bWord, where);
      expect(pluralOf(bWord), where).toBe(pluralOf(word));
      return { hero, a: Number(a), b: Number(b), plural: pluralOf(word), useless: Number(c), uselessKind: "thing", otherPlural: pluralOf(other), op: "-" };
    }
    m = giftWithAge.exec(text);
    if (m) {
      const [, hero, age, a, word, giver, b, bWord] = m;
      expect(giver, where).not.toBe(hero);
      expectAgreement(Number(a), word, where);
      expectAgreement(Number(b), bWord, where);
      expect(pluralOf(bWord), where).toBe(pluralOf(word));
      return { hero, giver, a: Number(a), b: Number(b), plural: pluralOf(word), useless: Number(age), uselessKind: "age", op: "+" };
    }
    m = giftWithOther.exec(text);
    expect(m, where).not.toBeNull();
    const [, hero, a, word, c, other, giver, b, bWord] = m!;
    expect(giver, where).not.toBe(hero);
    expectAgreement(Number(a), word, where);
    expectAgreement(Number(c), other, where);
    expectAgreement(Number(b), bWord, where);
    expect(pluralOf(bWord), where).toBe(pluralOf(word));
    return { hero, giver, a: Number(a), b: Number(b), plural: pluralOf(word), useless: Number(c), uselessKind: "thing", otherPlural: pluralOf(other), op: "+" };
  }

  function expectUselessFits(p: Parsed, d: Draw, where: string) {
    expect(NAMES, where).toContain(p.hero);
    expect(noTenCrossing(p.a, p.op, p.b), where).toBe(true);
    const result = p.op === "+" ? p.a + p.b : p.a - p.b;
    expect(result, where).toBeGreaterThanOrEqual(1);
    expect(result, where).toBeLessThanOrEqual(d.top);
    expect([p.a, p.b, result], where).not.toContain(p.useless);
    if (p.uselessKind === "age") {
      expect(d.level, where).toBe(2);
      expect(p.useless, where).toBeGreaterThanOrEqual(5);
      expect(p.useless, where).toBeLessThanOrEqual(9);
    } else {
      expect(p.otherPlural, where).not.toBe(p.plural);
      const sameFamily = FAMILY[p.otherPlural!] === FAMILY[p.plural];
      expect(sameFamily, where).toBe(d.level >= 3);
      for (const [x, y] of CLASHES) expect([EMOJI[p.plural], EMOJI[p.otherPlural!]].sort(), where).not.toEqual([x, y].sort());
    }
  }

  it("donnee-inutile : la réponse est le nombre qui ne parle pas de l'objet de la question, les options sont les trois nombres", () => {
    for (const { d, exo } of drawn("donnee-inutile")) {
      const dot = exo.prompt.indexOf(". ");
      const p = parseStory(exo.prompt.slice(0, dot + 1), exo.prompt);
      expect(p.op, exo.prompt).toBe("-");
      expectUselessFits(p, d, exo.prompt);
      expect(exo.prompt.slice(dot + 2), exo.prompt).toBe(`Quel nombre est inutile pour les ${p.plural} qui restent ?`);
      expect(Number(rightOption(exo)), exo.prompt).toBe(p.useless);
      expect(optionsOf(exo).map(Number).sort((x, y) => x - y), exo.prompt).toEqual([p.a, p.b, p.useless].sort((x, y) => x - y));
    }
  });

  it("probleme-inutile : la réponse se calcule avec les deux seules données qui parlent de l'objet demandé", () => {
    for (const { d, exo } of drawn("probleme-inutile")) {
      const dot = exo.prompt.indexOf(". ");
      const p = parseStory(exo.prompt.slice(0, dot + 1), exo.prompt);
      expectUselessFits(p, d, exo.prompt);
      const de = /^[aeiou]/.test(p.plural) ? "d'" : "de ";
      const question = exo.prompt.slice(dot + 2);
      if (p.op === "-") {
        expect(question, exo.prompt).toBe(`Combien ${de}${p.plural} lui reste-t-il ?`);
        expect(Number(rightOption(exo)), exo.prompt).toBe(p.a - p.b);
      } else {
        expect(question, exo.prompt).toBe(`Combien ${de}${p.plural} a-t-${pronounOf(p.hero)} maintenant ?`);
        expect(Number(rightOption(exo)), exo.prompt).toBe(p.a + p.b);
        // Le donneur est de l'autre genre : « a-t-elle » ne peut désigner que le héros, à l'oral aussi.
        expect(pronounOf(p.giver!), exo.prompt).not.toBe(pronounOf(p.hero));
        // Le dernier indice ne dit pas « compte tout » : tout, c'est le piège de l'exercice.
        expect(exo.hints[2], exo.prompt).toBe(`Ajoute ce qu'on lui donne, puis compte les ${p.plural}.`);
      }
      // « Se servir de la donnée inutile » est l'erreur que le gabarit fait voir : un des deux calculs
      // faits avec elle est toujours proposé (la donnée inutile est tirée pour qu'un des deux tienne sous le plafond).
      const withUseless = p.op === "+" ? [p.useless + p.b, p.a + p.useless] : [p.useless - p.b, p.a - p.useless];
      expect(withUseless.some((n) => n >= 1 && n <= d.top), exo.prompt).toBe(true);
      expect(optionsOf(exo).map(Number).some((n) => withUseless.includes(n)), exo.prompt).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// La fiche du programme et le palier entier
// ---------------------------------------------------------------------------

describe("la fiche « Petits problèmes » (ma-ci-problemes)", () => {
  const topic = allProgrammeEntries().find((e) => e.topic.key === "ma-ci-problemes")!.topic;
  const specs = topic.games ?? [];
  const palier = (palierIndex: number, palierCount: number, n: number) =>
    generateGames(specs, { klass: "CI", palierIndex, palierCount, seed: `problemes:${palierIndex}:${palierCount}:${n}` });
  // Soixante paliers par configuration : six cents paliers, six mille exercices passés au contrôleur,
  // en une demi-seconde. Les gabarits eux-mêmes sont fouillés plus haut, avec 2 400 tirages chacun.
  const runs = ([[1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5]] as const).flatMap(([palierIndex, palierCount]) =>
    Array.from({ length: 60 }, (_, n) => ({ palierIndex, palierCount, n })),
  );

  it("demande les dix gabarits, une fois chacun, dans l'ordre de la fiche, avec le plafond « nombres-20 »", () => {
    expect(specs.map((spec) => spec.kind)).toEqual([...KINDS]);
    expect(specs.every((spec) => spec.count === 1)).toBe(true);
    expect(gameCount(specs)).toBe(PALIER_SIZE);
    for (const spec of specs) expect(spec.vocabulary, spec.kind).toBe(spec.kind === "tableau-case" ? undefined : "nombres-20");
    expect(topicUsesModel("ma-ci-problemes")).toBe(false);
  });

  it("fabrique des paliers de dix exercices distincts qui passent le contrôleur, jamais au-delà du plafond du palier", () => {
    for (const { palierIndex, palierCount, n } of runs) {
      const games = palier(palierIndex, palierCount, n);
      const where = `palier ${palierIndex}/${palierCount} #${n}`;
      expect(games, where).toHaveLength(PALIER_SIZE);
      expect(games.map((g) => gameOriginOf(g.payload)?.kind), where).toEqual([...KINDS]);
      expect(new Set(games.map((g) => `${g.prompt}|${g.answerKey}`)).size, where).toBe(PALIER_SIZE);
      const top = TOP[20][gameLevel(palierIndex, palierCount)];
      for (const exo of games) {
        const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: "CI", subject: "Mathématiques" });
        expect(defects, `${where} : ${exo.prompt}`).toEqual([]);
        const shown = shownTexts(exo).filter((t) => !exo.hints.includes(t));
        expect(shown.filter((text) => numbersIn(text).some((value) => value > top)), `${where} : ${exo.prompt}`).toEqual([]);
      }
      // Les héros des histoires changent d'un exercice à l'autre.
      const heroes = games.flatMap((g) => {
        const name = /^(\p{L}+)[ ,]/u.exec(g.prompt)?.[1];
        return name && NAMES.includes(name) ? [name] : [];
      });
      expect(new Set(heroes).size, `${where} : ${heroes.join(", ")}`).toBe(heroes.length);
    }
  });

  it("monte en difficulté d'un palier à l'autre : jusqu'à 5, puis 10, puis 20", () => {
    const maxShown = (palierIndex: number) =>
      Math.max(...Array.from({ length: 60 }, (_, n) => palier(palierIndex, 3, n)).flat().flatMap((exo) => shownTexts(exo).filter((t) => !exo.hints.includes(t)).flatMap(numbersIn)));
    expect(maxShown(1)).toBe(5);
    expect(maxShown(2)).toBeLessThanOrEqual(10);
    expect(maxShown(2)).toBeGreaterThan(5);
    expect(maxShown(3)).toBeGreaterThan(10);
    expect(maxShown(3)).toBeLessThanOrEqual(20);
  });

  it("refait chaque gabarit raté par le code, au même niveau et au même plafond", () => {
    for (const spec of specs) {
      for (const level of LEVELS) {
        const origin = { kind: spec.kind, level, vocabulary: spec.vocabulary };
        const again = regenerateGame(origin, "CI", `reprise:${spec.kind}:${level}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
        expect(gameOriginOf(again!.payload), spec.kind).toEqual(origin);
      }
    }
  });
});
