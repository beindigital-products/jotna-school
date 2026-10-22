/**
 * Trois gabarits qui reposaient la même question aux trois paliers d'une thématique du CP, relevés en production après la PR #115 :
 * « Que prends-tu pour modeler un pot ? » (technique-qcm) aux trois paliers, les mêmes trois paires de « Relie chaque geste à ce
 * qu'on prend » (technique-relier), « Combien de coins a un carré ? » (forme-coins) au premier et au dernier palier.
 *
 * Ces tests fabriquent les trois paliers par `generateGames`, comme la fabrication, et recalculent les réponses depuis des tables
 * écrites ici : ils ne lisent pas les listes du code.
 */
import { describe, expect, it, vi } from "vitest";
import { generateGames, type GameKind } from "../paliers/games";
import type { VisibleClassName } from "../curriculum";

vi.setConfig({ testTimeout: 30_000 });

const SEEDS = Array.from({ length: 80 }, (_, i) => `repetitions-${i}`);

/** Ce qu'on prend pour chaque geste. */
const MATERIAL: Record<string, string> = { modeler: "argile", peindre: "pinceau", dessiner: "crayon", découper: "ciseaux", coller: "colle" };
/** Le nombre de coins de chaque forme. */
const CORNERS: Record<string, number> = { carré: 4, triangle: 3, rond: 0, rectangle: 4 };

/** La forme que chaque dessin représente, et le solide que chaque objet rappelle (`forme-nom`, `solide-nom`). */
const SHAPE_OF: Record<string, string> = {
  "⬛": "carré", "⬜": "carré", "🔲": "carré", "🔳": "carré",
  "🔴": "rond", "🔵": "rond", "⚫": "rond", "⚪": "rond",
  "🔺": "triangle", "🔻": "triangle",
};
const SOLID_OF: Record<string, string> = {
  "🎲": "cube", "🧱": "pavé", "🥫": "cylindre", "🧻": "cylindre", "🔋": "cylindre",
  "⚽": "boule", "🏀": "boule", "⚾": "boule", "🎾": "boule",
};
const SOLID_ARTICLE: Record<string, string> = { cube: "le cube", pavé: "le pavé", cylindre: "le cylindre", boule: "la boule" };

type Exo = { prompt: string; answerKey: string; payload: Record<string, unknown> };

/** Les exercices de chaque palier d'une thématique : un tableau par palier, avec son niveau. */
function paliers(klass: VisibleClassName, palierCount: number, kind: GameKind, count: number, seed: string) {
  return Array.from({ length: palierCount }, (_, i) => {
    const games = generateGames([{ kind, count }], { klass, palierIndex: i + 1, palierCount, seed: `${seed}-p${i + 1}` }) as unknown as Exo[];
    return { level: (games[0].payload.game as { level: number }).level, games };
  });
}

const options = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => options(exo)[exo.payload.correctIndex as number];
const pairs = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];

describe("technique-qcm : « Que prends-tu pour… ? » ne revient pas d'un palier à l'autre", () => {
  it("deux questions distinctes par palier, aucune dans deux paliers, et la bonne matière", () => {
    for (const seed of SEEDS) {
      const all = paliers("CP", 3, "technique-qcm", 2, seed);
      const seen = new Map<string, number>();
      for (const palier of all) {
        expect(new Set(palier.games.map((g) => g.prompt)).size, `${seed} niveau ${palier.level}`).toBe(2);
        for (const exo of palier.games) {
          const match = /^Que prends-tu pour (modeler|peindre|dessiner) (.+) \?$/u.exec(exo.prompt);
          expect(match, exo.prompt).not.toBeNull();
          expect(rightOption(exo), exo.prompt).toBe(MATERIAL[match![1]]);
          expect(new Set(options(exo)).size, exo.prompt).toBe(3);
          expect(seen.has(exo.prompt), `${seed} : « ${exo.prompt} » aux niveaux ${seen.get(exo.prompt)} et ${palier.level}`).toBe(false);
          seen.set(exo.prompt, palier.level);
        }
      }
    }
  });

  it("chaque palier garde ses trois questions : sur 80 graines, il les pose toutes", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      for (const palier of paliers("CP", 3, "technique-qcm", 2, seed)) {
        const set = byLevel.get(palier.level) ?? new Set<string>();
        for (const exo of palier.games) set.add(exo.prompt);
        byLevel.set(palier.level, set);
      }
    }
    for (const [level, set] of byLevel) expect(set.size, `niveau ${level}`).toBe(3);
  });
});

describe("technique-relier : les trois paliers ne relient pas les mêmes gestes", () => {
  it("trois paires justes et distinctes par palier, un jeu de gestes différent à chaque palier", () => {
    for (const seed of SEEDS) {
      const sets = paliers("CP", 3, "technique-relier", 1, seed).map((palier) => {
        const [exo] = palier.games;
        expect(pairs(exo), `${seed} niveau ${palier.level}`).toHaveLength(3);
        for (const pair of pairs(exo)) expect(MATERIAL[pair.left], `« ${pair.left} » relié à « ${pair.right} »`).toBe(pair.right);
        expect(new Set(pairs(exo).map((p) => p.left)).size).toBe(3);
        expect(new Set(pairs(exo).map((p) => p.right)).size).toBe(3);
        return pairs(exo).map((p) => p.left).sort().join(",");
      });
      expect(new Set(sets).size, `${seed} : ${sets.join(" | ")}`).toBe(3);
    }
  });
});

/** Les contraires et les phrases à trou de « Décrire et comparer » (`fr-cp-decrire`), écrits ici. */
const CONTRARY: Record<string, string> = {
  grand: "petit", petit: "grand", chaud: "froid", froid: "chaud", lourd: "léger", léger: "lourd", plein: "vide", vide: "plein", long: "court", court: "long",
};
const GAP_ANSWER: Record<string, string> = {
  "Le feu est chaud, la glace est ___.": "froid",
  "Le chat est petit, le lion est ___.": "grand",
  "Le coton est léger, le fer est ___.": "lourd",
  "Le verre n'est pas plein, il est ___.": "vide",
  "Le crayon est long, le bout de crayon est ___.": "court",
};
/** Les choses de chaque couleur (`couleur-objet`) et les animaux, du plus petit au plus grand puis du plus léger au plus lourd (`comparer-*`). */
const COLOUR_OF: Record<string, string> = { rouge: "🍎🍓🍅", jaune: "🍌🍋", vert: "🥒🥦", orange: "🥕", violet: "🍆" };
const SIZE_ORDER = ["🐜", "🐭", "🐔", "🐕", "🐄", "🦒"];
const WEIGHT_ORDER = ["🐜", "🐭", "🐔", "🐕", "🐑", "🐄", "🐘"];
const MASCULINE: Record<string, string> = { grande: "grand", petite: "petit", lourde: "lourd", légère: "léger" };

/** Les niveaux d'un thème de trois paliers (CP, CI) et la graine d'un palier. */
const blanks = (exo: Exo) => exo.payload.blanks as { options: string[]; answer: string }[];

describe("fr-cp-decrire : les contraires, les couleurs et les comparaisons ne reviennent pas d'un palier à l'autre", () => {
  it("contraire-qcm : deux mots distincts par palier, aucun dans deux paliers, et le bon contraire", () => {
    for (const seed of SEEDS) {
      const seen = new Map<string, number>();
      for (const palier of paliers("CP", 3, "contraire-qcm", 2, seed)) {
        expect(new Set(palier.games.map((g) => g.prompt)).size, `${seed} niveau ${palier.level}`).toBe(2);
        for (const exo of palier.games) {
          const word = /« (.+) »/u.exec(exo.prompt)![1];
          expect(rightOption(exo), exo.prompt).toBe(CONTRARY[word]);
          expect(new Set(options(exo)).size, exo.prompt).toBe(3);
          expect(seen.has(word), `${seed} : « ${word} » aux niveaux ${seen.get(word)} et ${palier.level}`).toBe(false);
          seen.set(word, palier.level);
        }
      }
    }
  });

  it("contraire-qcm : chaque palier garde de la variété (trois mots aux niveaux 1 et 2, quatre au dernier)", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      for (const palier of paliers("CP", 3, "contraire-qcm", 2, seed)) {
        const set = byLevel.get(palier.level) ?? new Set<string>();
        for (const exo of palier.games) set.add(exo.prompt);
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:3", "2:3", "4:4"]);
  });

  it("contraire-trou : une phrase différente à chaque palier, avec le bon mot, et les cinq phrases servent", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      const seenIn = new Map<string, number>();
      for (const palier of paliers("CP", 3, "contraire-trou", 1, seed)) {
        const [exo] = palier.games;
        const text = exo.payload.text as string;
        expect(GAP_ANSWER[text], `phrase inconnue « ${text} »`).toBeDefined();
        expect(blanks(exo)[0].answer, text).toBe(GAP_ANSWER[text]);
        expect(blanks(exo)[0].options, text).toContain(GAP_ANSWER[text]);
        expect(seenIn.has(text), `${seed} : « ${text} » aux niveaux ${seenIn.get(text)} et ${palier.level}`).toBe(false);
        seenIn.set(text, palier.level);
        const set = byLevel.get(palier.level) ?? new Set<string>();
        set.add(text);
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:1", "2:2", "4:2"]);
  });

  it("couleur-objet : une couleur demandée différente à chaque palier, et la bonne chose", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      const seenIn = new Map<string, number>();
      for (const palier of paliers("CP", 3, "couleur-objet", 1, seed)) {
        const [exo] = palier.games;
        const colour = /^Qu'est-ce qui est (.+) \?$/u.exec(exo.prompt)![1];
        expect(COLOUR_OF[colour], exo.prompt).toBeDefined();
        expect(COLOUR_OF[colour], `${exo.prompt} → ${rightOption(exo)}`).toContain(Array.from(rightOption(exo))[0]);
        expect(seenIn.has(colour), `${seed} : « ${colour} » aux niveaux ${seenIn.get(colour)} et ${palier.level}`).toBe(false);
        seenIn.set(colour, palier.level);
        const set = byLevel.get(palier.level) ?? new Set<string>();
        set.add(colour);
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${[...set].sort().join("+")}`).sort()).toEqual(["1:rouge", "2:jaune+vert", "4:orange+violet"]);
  });

  it("comparer-trou : deux comparaisons distinctes par palier, aucune dans deux paliers, et le bon mot", () => {
    for (const seed of SEEDS) {
      const seen = new Map<string, number>();
      for (const palier of paliers("CP", 3, "comparer-trou", 2, seed)) {
        expect(new Set(palier.games.map((g) => g.prompt)).size, `${seed} niveau ${palier.level}`).toBe(2);
        for (const exo of palier.games) {
          const [first, second] = exo.prompt.split("\n")[1].split(" ");
          const answer = blanks(exo)[0].answer;
          const base = MASCULINE[answer] ?? answer;
          const order = base === "grand" || base === "petit" ? SIZE_ORDER : WEIGHT_ORDER;
          const more = base === "grand" || base === "lourd";
          expect(order.indexOf(first) > order.indexOf(second), `${exo.prompt} → ${answer}`).toBe(more);
          const signature = `${first} ${second} ${more ? "plus" : "moins"} ${order === SIZE_ORDER ? "taille" : "poids"}`;
          expect(seen.has(signature), `${seed} : ${signature} aux niveaux ${seen.get(signature)} et ${palier.level}`).toBe(false);
          seen.set(signature, palier.level);
        }
      }
    }
  });

  it("comparer-mesure : un mot différent à chaque palier (lourd, léger, puis grand ou petit), et le bon animal", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      const seenIn = new Map<string, number>();
      for (const palier of paliers("CP", 3, "comparer-mesure", 1, seed)) {
        const [exo] = palier.games;
        const word = /le plus (\p{L}+) \?$/u.exec(exo.prompt)![1];
        const order = word === "grand" || word === "petit" ? SIZE_ORDER : WEIGHT_ORDER;
        const ranks = options(exo).map((option) => order.indexOf(Array.from(option)[0]));
        expect(ranks.every((rank) => rank >= 0), exo.prompt).toBe(true);
        const wanted = word === "grand" || word === "lourd" ? Math.max(...ranks) : Math.min(...ranks);
        expect(order.indexOf(Array.from(rightOption(exo))[0]), exo.prompt).toBe(wanted);
        expect(seenIn.has(word), `${seed} : « ${word} » aux niveaux ${seenIn.get(word)} et ${palier.level}`).toBe(false);
        seenIn.set(word, palier.level);
        const set = byLevel.get(palier.level) ?? new Set<string>();
        set.add(word);
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${[...set].sort().join("+")}`).sort()).toEqual(["1:lourd", "2:léger", "4:grand+petit"]);
  });

  it("comparer-mesure, au CI où il en pose quatre par palier : quatre mots différents dans chaque palier", () => {
    for (const seed of SEEDS) {
      for (const palier of paliers("CI", 3, "comparer-mesure", 4, seed)) {
        expect(new Set(palier.games.map((g) => g.prompt)).size, `${seed} niveau ${palier.level}`).toBe(4);
      }
    }
  });
});

describe("monnaie-payer : la somme à payer ne revient pas d'un palier à l'autre", () => {
  it("une tranche de sommes par palier (jusqu'à 35 F, de 50 à 60 F, 75 F et plus), la bonne somme, des choix distincts", () => {
    const byLevel = new Map<number, Set<number>>();
    for (const seed of SEEDS) {
      const seenIn = new Map<number, number>();
      for (const palier of paliers("CP", 3, "monnaie-payer", 1, seed)) {
        const [exo] = palier.games;
        const price = Number(/doit payer (\d+) F/u.exec(exo.prompt)![1]);
        const total = (text: string) => text.split(" + ").reduce((sum, part) => sum + Number(part.replace(" F", "")), 0);
        expect(total(rightOption(exo)), exo.prompt).toBe(price);
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
        for (const wrong of options(exo).filter((option) => option !== rightOption(exo))) expect(total(wrong), `${exo.prompt} → ${wrong}`).not.toBe(price);
        if (palier.level === 1) expect(price, exo.prompt).toBeLessThanOrEqual(35);
        if (palier.level === 2) expect([price >= 50, price <= 60], exo.prompt).toEqual([true, true]);
        if (palier.level === 4) expect(price, exo.prompt).toBeGreaterThanOrEqual(75);
        expect(seenIn.has(price), `${seed} : ${price} F aux niveaux ${seenIn.get(price)} et ${palier.level}`).toBe(false);
        seenIn.set(price, palier.level);
        const set = byLevel.get(palier.level) ?? new Set<number>();
        set.add(price);
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${[...set].sort((a, b) => a - b).join(",")}`).sort()).toEqual([
      "1:10,15,20,30,35",
      "2:50,55,60",
      "4:75,100",
    ]);
  });
});

/** « 3 heures et demie » : l'heure en lettres, écrite ici. */
const timeWords = (hour: number, half: boolean) => `${hour} heure${hour > 1 ? "s" : ""}${half ? " et demie" : ""}`;
/** L'heure d'une horloge d'émoji (U+1F550 à U+1F55B les heures justes, U+1F55C à U+1F567 les heures et demie), lue dans le code du glyphe. */
const clockTime = (glyph: string) => {
  const code = glyph.codePointAt(0)!;
  return code >= 0x1f55c ? { hour: code - 0x1f55c + 1, half: true } : { hour: code - 0x1f550 + 1, half: false };
};
/** Les heures que chaque niveau (1, 2, 4) a pour lui : une sur trois. */
const HOURS_OF_LEVEL: Record<number, number[]> = { 1: [1, 4, 7, 10], 2: [2, 5, 8, 11], 4: [3, 6, 9, 12] };

describe("heure-lire et heure-trou : la même heure ne revient pas d'un palier à l'autre", () => {
  it("heure-lire : une heure du palier, la bonne réponse, jamais la même heure dans deux paliers", () => {
    const seen = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      const hours = new Map<number, number>();
      for (const palier of paliers("CP", 3, "heure-lire", 1, seed)) {
        const [exo] = palier.games;
        const { hour, half } = clockTime(Array.from(exo.prompt.split("? ").at(-1)!.trim())[0]);
        expect(rightOption(exo), exo.prompt).toBe(timeWords(hour, half));
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
        expect(HOURS_OF_LEVEL[palier.level], `${seed} niveau ${palier.level}`).toContain(hour);
        if (palier.level === 1) expect(half, `${seed} : le premier palier n'a que des heures justes`).toBe(false);
        expect(hours.has(hour), `${seed} : ${hour} h aux niveaux ${hours.get(hour)} et ${palier.level}`).toBe(false);
        hours.set(hour, palier.level);
        const set = seen.get(palier.level) ?? new Set<string>();
        set.add(`${hour}${half ? "½" : ""}`);
        seen.set(palier.level, set);
      }
    }
    expect([...seen].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:4", "2:8", "4:8"]);
  });

  it("heure-trou : une heure de départ du palier, la bonne heure d'arrivée, jamais le même départ dans deux paliers", () => {
    const seen = new Map<number, Set<number>>();
    for (const seed of SEEDS) {
      const hours = new Map<number, number>();
      for (const palier of paliers("CP", 3, "heure-trou", 1, seed)) {
        const [exo] = palier.games;
        const match = /^Il est (\d+) heures?( et demie)?\. (Une heure|Une demi-heure) plus tard, il sera ___\.$/u.exec(exo.payload.text as string);
        expect(match, exo.payload.text as string).not.toBeNull();
        const hour = Number(match![1]);
        const half = match![2] !== undefined;
        const minutes = (hour % 12) * 60 + (half ? 30 : 0) + (match![3] === "Une heure" ? 60 : 30);
        const arrival = minutes % 720;
        expect(blanks(exo)[0].answer, exo.payload.text as string).toBe(timeWords(Math.floor(arrival / 60) || 12, arrival % 60 === 30));
        expect(HOURS_OF_LEVEL[palier.level], `${seed} niveau ${palier.level}`).toContain(hour);
        if (palier.level === 1) expect(half).toBe(false);
        expect(hours.has(hour), `${seed} : départ ${hour} h aux niveaux ${hours.get(hour)} et ${palier.level}`).toBe(false);
        hours.set(hour, palier.level);
        const set = seen.get(palier.level) ?? new Set<number>();
        set.add(hour);
        seen.set(palier.level, set);
      }
    }
    // Les quatre heures de chaque palier servent, le 12 au dernier palier aussi.
    const summary = [...seen].map(([level, set]) => `${level}:${[...set].sort((a, b) => a - b).join(",")}`).sort();
    expect(summary).toEqual(["1:1,4,7,10", "2:2,5,8,11", "4:3,6,9,12"]);
  });
});

describe("heure-ordre et monnaie-rendre : la même suite ou le même achat ne revient pas d'un palier à l'autre", () => {
  const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];

  it("heure-ordre : les horloges du palier, rangées du plus tôt au plus tard, jamais la même horloge dans deux paliers", () => {
    const seen = new Map<number, Set<string>>();
    // Les heures de chaque niveau pour ce jeu (de 6 h à 11 h 30) : le premier palier 7 et 10, le deuxième 8 et 11, le dernier 6 et 9.
    const HOURS: Record<number, number[]> = { 1: [7, 10], 2: [8, 11], 4: [6, 9] };
    for (const seed of SEEDS) {
      const clocks = new Map<string, number>();
      for (const palier of paliers("CP", 3, "heure-ordre", 1, seed)) {
        const [exo] = palier.games;
        const times = sequenceOf(exo).map((glyph) => clockTime(glyph));
        expect(times, `${seed} niveau ${palier.level}`).toHaveLength(palier.level === 4 ? 4 : 3);
        const minutes = times.map((time) => time.hour * 60 + (time.half ? 30 : 0));
        expect(minutes, `${seed} : pas dans l'ordre`).toEqual([...minutes].sort((a, b) => a - b));
        expect(new Set(minutes).size, `${seed} : deux fois la même horloge`).toBe(minutes.length);
        for (const time of times) {
          expect(HOURS[palier.level], `${seed} niveau ${palier.level} : ${time.hour} h`).toContain(time.hour);
          const key = `${time.hour}${time.half ? "½" : ""}`;
          expect(clocks.has(key), `${seed} : ${key} aux niveaux ${clocks.get(key)} et ${palier.level}`).toBe(false);
          clocks.set(key, palier.level);
          const set = seen.get(palier.level) ?? new Set<string>();
          set.add(key);
          seen.set(palier.level, set);
        }
      }
    }
    // Les quatre horloges de chaque palier servent, trois sur quatre à la fois aux deux premiers.
    expect([...seen].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:4", "2:4", "4:4"]);
  });

  it("monnaie-rendre : une tranche de prix par palier (jusqu'à 30 F, de 35 à 60 F, 65 F et plus), la bonne monnaie, jamais le même prix", () => {
    const seen = new Map<number, Set<number>>();
    for (const seed of SEEDS) {
      const prices = new Map<number, number>();
      for (const palier of paliers("CP", 3, "monnaie-rendre", 1, seed)) {
        const [exo] = palier.games;
        const match = /à (\d+) F\. .+ paie avec une pièce de (\d+) F\./u.exec(exo.prompt);
        expect(match, exo.prompt).not.toBeNull();
        const price = Number(match![1]);
        const paid = Number(match![2]);
        expect(price < paid && price % 5 === 0, exo.prompt).toBe(true);
        expect(rightOption(exo), exo.prompt).toBe(String(paid - price));
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
        if (palier.level === 1) expect([paid, price <= 30], exo.prompt).toEqual([50, true]);
        if (palier.level === 2) expect([price >= 35, price <= 60], exo.prompt).toEqual([true, true]);
        if (palier.level === 4) expect([paid, price >= 65], exo.prompt).toEqual([100, true]);
        expect(prices.has(price), `${seed} : ${price} F aux niveaux ${prices.get(price)} et ${palier.level}`).toBe(false);
        prices.set(price, palier.level);
        const set = seen.get(palier.level) ?? new Set<number>();
        set.add(price);
        seen.set(palier.level, set);
      }
    }
    // Les prix de chaque tranche servent tous : six, six et sept.
    expect([...seen].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:6", "2:6", "4:7"]);
  });
});

describe("monnaie-pieces et monnaie-relier : la même somme ne revient pas d'un palier à l'autre", () => {
  it("monnaie-pieces : une tranche de sommes par palier (jusqu'à 35 F, de 36 à 60 F, au-delà), la bonne réponse, jamais la même somme", () => {
    for (const seed of SEEDS) {
      const seen = new Map<number, number>();
      for (const palier of paliers("CP", 3, "monnaie-pieces", 1, seed)) {
        const [exo] = palier.games;
        const match = /pièces de (\d+) F faut-il pour payer (\d+) F \?$/u.exec(exo.prompt);
        expect(match, exo.prompt).not.toBeNull();
        const coin = Number(match![1]);
        const total = Number(match![2]);
        expect(total % coin, exo.prompt).toBe(0);
        expect(rightOption(exo), exo.prompt).toBe(String(total / coin));
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
        if (palier.level === 1) expect(total, exo.prompt).toBeLessThanOrEqual(35);
        if (palier.level === 2) expect([total > 35, total <= 60], exo.prompt).toEqual([true, true]);
        if (palier.level === 4) expect(total, exo.prompt).toBeGreaterThan(60);
        expect(seen.has(total), `${seed} : ${total} F aux niveaux ${seen.get(total)} et ${palier.level}`).toBe(false);
        seen.set(total, palier.level);
      }
    }
  });

  it("monnaie-relier : trois groupes de sommes différentes par palier, justes, et jamais les mêmes trois groupes dans deux paliers", () => {
    for (const seed of SEEDS) {
      const sets = paliers("CP", 3, "monnaie-relier", 1, seed).map((palier) => {
        const [exo] = palier.games;
        expect(pairs(exo), `${seed} niveau ${palier.level}`).toHaveLength(3);
        const totals = pairs(exo).map((pair) => {
          const match = /^(\d+) pièces de (\d+) F$/u.exec(pair.left)!;
          const total = Number(match[1]) * Number(match[2]);
          expect(pair.right, pair.left).toBe(`${total} F`);
          return total;
        });
        expect(new Set(totals).size, `${seed} niveau ${palier.level}`).toBe(3);
        if (palier.level === 1) expect(Math.max(...totals), `${seed} : le premier palier n'a que de petites sommes`).toBeLessThanOrEqual(35);
        return pairs(exo).map((pair) => pair.left).sort().join(" | ");
      });
      expect(new Set(sets).size, `${seed} : ${sets.join(" // ")}`).toBe(3);
    }
  });
});

/** Le dessin d'un énoncé « … ? ⬛ » : ce qui suit le point d'interrogation. */
const drawingOf = (exo: Exo) => exo.prompt.split("? ").at(-1)!.trim();

describe("forme-nom et solide-nom : le même dessin ne revient pas d'un palier à l'autre (ma-ci-formes en pose deux de chaque)", () => {
  it("forme-nom : deux dessins distincts par palier, aucun dans deux paliers, et la bonne forme", () => {
    for (const seed of SEEDS) {
      const seen = new Map<string, number>();
      for (const palier of paliers("CI", 3, "forme-nom", 2, seed)) {
        expect(new Set(palier.games.map(drawingOf)).size, `${seed} niveau ${palier.level}`).toBe(2);
        for (const exo of palier.games) {
          const emoji = drawingOf(exo);
          expect(SHAPE_OF[emoji], `dessin inconnu « ${emoji} »`).toBeDefined();
          expect(rightOption(exo), exo.prompt).toBe(`le ${SHAPE_OF[emoji]}`);
          expect(new Set(options(exo)).size, exo.prompt).toBe(3);
          // Un carré est un rectangle particulier : « rectangle » ne se propose jamais pour lui.
          if (SHAPE_OF[emoji] === "carré") expect(options(exo).join(), exo.prompt).not.toContain("rectangle");
          expect(seen.has(emoji), `${seed} : ${emoji} aux niveaux ${seen.get(emoji)} et ${palier.level}`).toBe(false);
          seen.set(emoji, palier.level);
        }
      }
    }
  });

  it("forme-nom : chaque palier garde de la variété (trois dessins aux niveaux 1 et 2, quatre au dernier)", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      for (const palier of paliers("CI", 3, "forme-nom", 2, seed)) {
        const set = byLevel.get(palier.level) ?? new Set<string>();
        for (const exo of palier.games) set.add(drawingOf(exo));
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:3", "2:3", "4:4"]);
    // Les dix dessins servent tous, à un palier ou à un autre.
    expect(new Set([...byLevel.values()].flatMap((set) => [...set]))).toEqual(new Set(Object.keys(SHAPE_OF)));
  });

  it("solide-nom : deux objets distincts par palier, aucun dans deux paliers, et le bon solide", () => {
    for (const seed of SEEDS) {
      const seen = new Map<string, number>();
      for (const palier of paliers("CI", 3, "solide-nom", 2, seed)) {
        expect(new Set(palier.games.map(drawingOf)).size, `${seed} niveau ${palier.level}`).toBe(2);
        for (const exo of palier.games) {
          const emoji = drawingOf(exo);
          const solid = SOLID_OF[emoji];
          expect(solid, `objet inconnu « ${emoji} »`).toBeDefined();
          expect(rightOption(exo), exo.prompt).toBe(SOLID_ARTICLE[solid]);
          expect(new Set(options(exo)).size, exo.prompt).toBe(3);
          // Un cube est un pavé particulier : ni « le pavé » pour le dé, ni « le cube » pour la brique.
          if (solid === "cube") expect(options(exo), exo.prompt).not.toContain("le pavé");
          if (solid === "pavé") expect(options(exo), exo.prompt).not.toContain("le cube");
          expect(seen.has(emoji), `${seed} : ${emoji} aux niveaux ${seen.get(emoji)} et ${palier.level}`).toBe(false);
          seen.set(emoji, palier.level);
        }
      }
    }
  });

  it("solide-nom : chaque palier garde de la variété (trois objets), et les neuf servent", () => {
    const byLevel = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      for (const palier of paliers("CI", 3, "solide-nom", 2, seed)) {
        const set = byLevel.get(palier.level) ?? new Set<string>();
        for (const exo of palier.games) set.add(drawingOf(exo));
        byLevel.set(palier.level, set);
      }
    }
    expect([...byLevel].map(([level, set]) => `${level}:${set.size}`).sort()).toEqual(["1:3", "2:3", "4:3"]);
    expect(new Set([...byLevel.values()].flatMap((set) => [...set]))).toEqual(new Set(Object.keys(SOLID_OF)));
  });
});

describe("forme-coins : la même forme ne revient pas d'un palier à l'autre", () => {
  const formOf = (exo: Exo) => /^Combien de coins a un (\p{L}+) \?$/u.exec(exo.prompt)![1];

  it("au CP, une forme différente à chacun des trois paliers, et le bon nombre de coins", () => {
    for (const seed of SEEDS) {
      const all = paliers("CP", 3, "forme-coins", 1, seed);
      const forms = all.map((palier) => formOf(palier.games[0]));
      for (const palier of all) {
        const exo = palier.games[0];
        expect(Number(rightOption(exo)), exo.prompt).toBe(CORNERS[formOf(exo)]);
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
      }
      expect(new Set(forms).size, `${seed} : ${forms.join(", ")}`).toBe(3);
      // Le premier palier garde les formes aux coins visibles.
      expect(["carré", "triangle"], `${seed} niveau 1`).toContain(forms[0]);
    }
  });

  it("au CI, où il en pose deux par palier, aucune forme deux fois dans un palier", () => {
    for (const seed of SEEDS) {
      for (const palier of paliers("CI", 3, "forme-coins", 2, seed)) {
        const forms = palier.games.map(formOf);
        expect(new Set(forms).size, `${seed} niveau ${palier.level} : ${forms.join(", ")}`).toBe(2);
        if (palier.level === 1) expect([...forms].sort(), seed).toEqual(["carré", "triangle"]);
      }
    }
  });
});

describe("heure-relier : les trois horloges du palier, jamais les mêmes dans deux paliers", () => {
  it("trois heures différentes, justes, toutes du palier, et aucune heure dans deux paliers", () => {
    const seen = new Map<number, Set<number>>();
    for (const seed of SEEDS) {
      const hours = new Map<number, number>();
      for (const palier of paliers("CP", 3, "heure-relier", 1, seed)) {
        const [exo] = palier.games;
        expect(pairs(exo), `${seed} niveau ${palier.level}`).toHaveLength(3);
        for (const pair of pairs(exo)) {
          const { hour, half } = clockTime(Array.from(pair.left)[0]);
          expect(pair.right, pair.left).toBe(timeWords(hour, half));
          expect(HOURS_OF_LEVEL[palier.level], `${seed} niveau ${palier.level}`).toContain(hour);
          if (palier.level === 1) expect(half, `${seed} : le premier palier n'a que des heures justes`).toBe(false);
          expect(hours.has(hour), `${seed} : ${hour} h aux niveaux ${hours.get(hour)} et ${palier.level}`).toBe(false);
          hours.set(hour, palier.level);
          const set = seen.get(palier.level) ?? new Set<number>();
          set.add(hour);
          seen.set(palier.level, set);
        }
        expect(new Set(pairs(exo).map((pair) => pair.right)).size, `${seed} niveau ${palier.level}`).toBe(3);
      }
    }
    // Les quatre heures de chaque palier servent, le 12 au dernier palier aussi.
    const summary = [...seen].map(([level, set]) => `${level}:${[...set].sort((a, b) => a - b).join(",")}`).sort();
    expect(summary).toEqual(["1:1,4,7,10", "2:2,5,8,11", "4:3,6,9,12"]);
  });
});

/** Les étapes d'un calcul posé, écrites ici : une suite par palier (niveaux 1, 2 et 4). */
const CALC_STEPS_OF_LEVEL: Record<number, { prompt: string; steps: string[] }> = {
  1: {
    prompt: "Mets dans le bon ordre les étapes pour poser une addition.",
    steps: ["J'écris un nombre en haut.", "J'écris l'autre nombre en dessous, unités sous unités.", "Je trace un trait sous les nombres.", "J'additionne en commençant par les unités."],
  },
  2: {
    prompt: "Mets dans le bon ordre les étapes d'une addition avec retenue.",
    steps: ["J'additionne les unités.", "J'écris les unités et je retiens une dizaine.", "J'additionne les dizaines avec la retenue."],
  },
  4: {
    prompt: "Mets dans le bon ordre les étapes d'une soustraction avec emprunt.",
    steps: ["Je regarde les unités.", "J'emprunte une dizaine pour avoir plus d'unités.", "J'enlève les unités.", "J'enlève les dizaines qui restent."],
  },
};

describe("calc-ordre : une suite d'étapes par palier", () => {
  it("chaque palier pose sa suite, dans le bon ordre, et les trois paliers en posent trois différentes", () => {
    for (const seed of SEEDS) {
      const prompts: string[] = [];
      for (const palier of paliers("CP", 3, "calc-ordre", 1, seed)) {
        const [exo] = palier.games;
        const expected = CALC_STEPS_OF_LEVEL[palier.level];
        expect(exo.prompt, `${seed} niveau ${palier.level}`).toBe(expected.prompt);
        expect(exo.payload.correctSequence, exo.prompt).toEqual(expected.steps);
        expect(exo.answerKey, exo.prompt).toBe(expected.steps.join(" "));
        prompts.push(exo.prompt);
      }
      expect(new Set(prompts).size, `${seed} : ${prompts.join(" // ")}`).toBe(3);
    }
  });
});

describe("contraire-relier : les paires reliées ne sont pas les mêmes d'un palier à l'autre", () => {
  /** La paire d'un lien, par son mot de la liste (le premier de la paire, quel que soit le côté). */
  const FIRST_OF: Record<string, string> = {
    grand: "grand", petit: "grand", chaud: "chaud", froid: "chaud", lourd: "lourd", léger: "lourd", plein: "plein", vide: "plein", long: "long", court: "long",
  };
  const ALL = ["grand", "chaud", "lourd", "plein", "long"];

  it("trois paires au premier palier, quatre ensuite, toutes justes, et jamais deux paliers avec les mêmes paires", () => {
    for (const seed of SEEDS) {
      const sets: string[] = [];
      for (const palier of paliers("CP", 3, "contraire-relier", 1, seed)) {
        const [exo] = palier.games;
        expect(pairs(exo), `${seed} niveau ${palier.level}`).toHaveLength(palier.level === 1 ? 3 : 4);
        for (const pair of pairs(exo)) expect(CONTRARY[pair.left], `« ${pair.left} » relié à « ${pair.right} »`).toBe(pair.right);
        const used = pairs(exo).map((pair) => FIRST_OF[pair.left]);
        expect(new Set(used).size, `${seed} niveau ${palier.level}`).toBe(used.length);
        sets.push([...used].sort().join(","));
      }
      expect(new Set(sets).size, `${seed} : ${sets.join(" // ")}`).toBe(3);
    }
  });

  it("chaque palier laisse de côté ses paires : les deux premières au premier palier, « chaud » ou « long » au deuxième, « lourd » au dernier", () => {
    const leftOut = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      for (const palier of paliers("CP", 3, "contraire-relier", 1, seed)) {
        const used = pairs(palier.games[0]).map((pair) => FIRST_OF[pair.left]);
        const left = ALL.filter((word) => !used.includes(word));
        if (palier.level === 1) expect(left, `${seed} niveau 1`).toEqual(["grand", "plein"]);
        if (palier.level === 2) expect(["chaud", "long"], `${seed} niveau 2`).toContain(left[0]);
        if (palier.level === 4) expect(left, `${seed} niveau 4`).toEqual(["lourd"]);
        const set = leftOut.get(palier.level) ?? new Set<string>();
        for (const word of left) set.add(word);
        leftOut.set(palier.level, set);
      }
    }
    // Au deuxième palier, les deux paires possibles servent tour à tour : le palier garde de la variété.
    expect([...(leftOut.get(2) ?? [])].sort()).toEqual(["chaud", "long"]);
  });
});

describe("adjectif-ordre : un nom par palier, donc jamais la même phrase", () => {
  /** Les noms de chaque palier (niveaux 1, 2 et 4) avec leur genre et le verbe de la phrase, écrits ici. */
  const NOUNS_OF_LEVEL: Record<number, Record<string, { determiner: string; verb: string }>> = {
    1: { ballon: { determiner: "un", verb: "a" }, livre: { determiner: "un", verb: "a" }, poule: { determiner: "une", verb: "voit" } },
    2: { cartable: { determiner: "un", verb: "porte" }, chat: { determiner: "un", verb: "voit" }, vache: { determiner: "une", verb: "voit" } },
    4: { robe: { determiner: "une", verb: "porte" }, chien: { determiner: "un", verb: "voit" }, mouton: { determiner: "un", verb: "voit" } },
  };
  const NAMES = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Modou"];
  const SIZES = ["grand", "grande", "petit", "petite", "joli", "jolie", "gros", "grosse"];
  const COLOURS = ["rouge", "jaune", "bleu", "bleue", "vert", "verte", "blanc", "blanche", "noir", "noire"];

  it("cinq mots, un nom du palier, le bon article et le bon verbe, un adjectif de taille avant le nom ou de couleur après", () => {
    const seen = new Map<number, Set<string>>();
    for (const seed of SEEDS) {
      const nouns = new Map<string, number>();
      for (const palier of paliers("CP", 3, "adjectif-ordre", 1, seed)) {
        const [exo] = palier.games;
        const tiles = exo.payload.correctSequence as string[];
        expect(tiles, `${seed} niveau ${palier.level}`).toHaveLength(5);
        const [name, verb, determiner, third, fourth] = tiles;
        const before = SIZES.includes(third);
        const noun = (before ? fourth : third).replace(/\.$/u, "");
        const row = NOUNS_OF_LEVEL[palier.level][noun];
        expect(row, `${seed} niveau ${palier.level} : « ${tiles.join(" ")} »`).toBeDefined();
        expect(NAMES, tiles.join(" ")).toContain(name);
        expect([verb, determiner], tiles.join(" ")).toEqual([row.verb, row.determiner]);
        if (before) expect(fourth, tiles.join(" ")).toBe(`${noun}.`);
        else expect(COLOURS, tiles.join(" ")).toContain(fourth.replace(/\.$/u, ""));
        expect(nouns.has(noun), `${seed} : ${noun} aux niveaux ${nouns.get(noun)} et ${palier.level}`).toBe(false);
        nouns.set(noun, palier.level);
        const set = seen.get(palier.level) ?? new Set<string>();
        set.add(noun);
        seen.set(palier.level, set);
      }
    }
    // Les trois noms de chaque palier servent tous.
    expect([...seen].map(([level, set]) => `${level}:${[...set].sort().join(",")}`).sort()).toEqual([
      "1:ballon,livre,poule",
      "2:cartable,chat,vache",
      "4:chien,mouton,robe",
    ]);
  });
});

describe("ma-cp-retenue : les calculs et les sommes tirés au hasard ne reviennent pas d'un palier à l'autre", () => {
  /** Le groupe de chaque niveau (1, 2 et 4) : le premier nombre d'un calcul a ce reste dans la division par 3. */
  const GROUP: Record<number, number> = { 1: 0, 2: 1, 4: 2 };
  const units = (n: number) => n % 10;
  /** Les premiers nombres vus par niveau, sur les 80 graines : chaque palier garde de la variété. */
  const firsts = () => ({ 1: new Set<number>(), 2: new Set<number>(), 4: new Set<number>() }) as Record<number, Set<number>>;

  it("calc-ajouter : une addition avec retenue, juste, dont le premier nombre est du palier", () => {
    const seen = firsts();
    for (const seed of SEEDS) {
      const all = new Map<number, number>();
      for (const palier of paliers("CP", 3, "calc-ajouter", 1, seed)) {
        const [exo] = palier.games;
        const match = /^Combien font (\d+) \+ (\d+) \?$/u.exec(exo.prompt)!;
        const [a, b] = [Number(match[1]), Number(match[2])];
        expect(units(a) + units(b), exo.prompt).toBeGreaterThanOrEqual(10);
        expect(a + b, exo.prompt).toBeLessThanOrEqual(100);
        expect(Number(rightOption(exo)), exo.prompt).toBe(a + b);
        expect(new Set(options(exo)).size, exo.prompt).toBe(3);
        expect(a % 3, `${seed} niveau ${palier.level} : ${exo.prompt}`).toBe(GROUP[palier.level]);
        expect(all.has(a), `${seed} : ${a} aux niveaux ${all.get(a)} et ${palier.level}`).toBe(false);
        all.set(a, palier.level);
        seen[palier.level].add(a);
      }
    }
    for (const level of [1, 2, 4]) expect(seen[level].size, `niveau ${level}`).toBeGreaterThanOrEqual(10);
  });

  it("calc-enlever : une soustraction avec emprunt, juste, dont le premier nombre est du palier", () => {
    const seen = firsts();
    for (const seed of SEEDS) {
      const all = new Map<number, number>();
      for (const palier of paliers("CP", 3, "calc-enlever", 1, seed)) {
        const [exo] = palier.games;
        const match = /^Combien font (\d+) − (\d+) \?$/u.exec(exo.prompt)!;
        const [a, b] = [Number(match[1]), Number(match[2])];
        expect(units(a), exo.prompt).toBeLessThan(units(b));
        expect(a, exo.prompt).toBeLessThanOrEqual(99);
        expect(Number(rightOption(exo)), exo.prompt).toBe(a - b);
        expect(a % 3, `${seed} niveau ${palier.level} : ${exo.prompt}`).toBe(GROUP[palier.level]);
        expect(all.has(a), `${seed} : ${a} aux niveaux ${all.get(a)} et ${palier.level}`).toBe(false);
        all.set(a, palier.level);
        seen[palier.level].add(a);
      }
    }
    for (const level of [1, 2, 4]) expect(seen[level].size, `niveau ${level}`).toBeGreaterThanOrEqual(10);
  });

  it("calc-retenue : l'addition ou la soustraction de l'énoncé a un premier nombre du palier, avec retenue ou emprunt", () => {
    for (const seed of SEEDS) {
      const all = new Map<string, number>();
      for (const palier of paliers("CP", 3, "calc-retenue", 1, seed)) {
        const [exo] = palier.games;
        const match = /^Dans (\d+) ([+−]) (\d+)/u.exec(exo.prompt)!;
        const [a, b] = [Number(match[1]), Number(match[3])];
        if (match[2] === "+") expect(units(a) + units(b), exo.prompt).toBeGreaterThanOrEqual(10);
        else expect(units(a), exo.prompt).toBeLessThan(units(b));
        expect(a % 3, `${seed} niveau ${palier.level} : ${exo.prompt}`).toBe(GROUP[palier.level]);
        const key = `${a}${match[2]}${b}`;
        expect(all.has(key), `${seed} : ${key} aux niveaux ${all.get(key)} et ${palier.level}`).toBe(false);
        all.set(key, palier.level);
      }
    }
  });

  it("calc-trou : le nombre qui manque est juste, et le premier nombre est du palier", () => {
    for (const seed of SEEDS) {
      const all = new Map<number, number>();
      for (const palier of paliers("CP", 3, "calc-trou", 1, seed)) {
        const [exo] = palier.games;
        const text = exo.payload.text as string;
        const match = /^(\d+) ([+−]) ___ = (\d+)$/u.exec(text)!;
        const [a, result] = [Number(match[1]), Number(match[3])];
        const missing = match[2] === "+" ? result - a : a - result;
        expect(blanks(exo)[0].answer, text).toBe(String(missing));
        expect(a % 3, `${seed} niveau ${palier.level} : ${text}`).toBe(GROUP[palier.level]);
        expect(all.has(a), `${seed} : ${a} aux niveaux ${all.get(a)} et ${palier.level}`).toBe(false);
        all.set(a, palier.level);
      }
    }
  });

  it("calc-relier : chaque calcul relié a un premier nombre du palier, et le bon résultat", () => {
    for (const seed of SEEDS) {
      for (const palier of paliers("CP", 3, "calc-relier", 1, seed)) {
        for (const pair of pairs(palier.games[0])) {
          const match = /^(\d+) ([+−]) (\d+)$/u.exec(pair.left)!;
          const [a, b] = [Number(match[1]), Number(match[3])];
          expect(pair.right, pair.left).toBe(String(match[2] === "+" ? a + b : a - b));
          expect(a % 3, `${seed} niveau ${palier.level} : ${pair.left}`).toBe(GROUP[palier.level]);
        }
      }
    }
  });

  it("monnaie-somme : la somme des pièces est juste, de la tranche du palier, et jamais la même dans deux paliers", () => {
    const BAND: Record<number, [number, number]> = { 1: [15, 35], 2: [40, 60], 4: [65, 100] };
    const totals: Record<number, Set<number>> = { 1: new Set(), 2: new Set(), 4: new Set() };
    for (const seed of SEEDS) {
      const all = new Map<number, number>();
      for (const palier of paliers("CP", 3, "monnaie-somme", 1, seed)) {
        const [exo] = palier.games;
        const parts = [...exo.prompt.matchAll(/(\d+) pièces? de (\d+) F/gu)].map((m) => ({ count: Number(m[1]), value: Number(m[2]) }));
        const total = parts.reduce((sum, part) => sum + part.count * part.value, 0);
        expect(Number(rightOption(exo)), exo.prompt).toBe(total);
        expect(new Set(parts.map((part) => part.value)).size, exo.prompt).toBe(parts.length);
        for (const part of parts) {
          expect([5, 10, 25, 50], exo.prompt).toContain(part.value);
          expect([part.count >= 1, part.count <= 3], exo.prompt).toEqual([true, true]);
        }
        if (palier.level === 1) expect(parts, exo.prompt).toHaveLength(2);
        else expect([2, 3], exo.prompt).toContain(parts.length);
        const [low, high] = BAND[palier.level];
        expect([total >= low, total <= high], `${seed} niveau ${palier.level} : ${exo.prompt}`).toEqual([true, true]);
        expect(all.has(total), `${seed} : ${total} F aux niveaux ${all.get(total)} et ${palier.level}`).toBe(false);
        all.set(total, palier.level);
        totals[palier.level].add(total);
      }
    }
    for (const level of [1, 2, 4]) expect(totals[level].size, `niveau ${level}`).toBeGreaterThanOrEqual(3);
  });
});
