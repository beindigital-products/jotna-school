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
