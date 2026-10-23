/**
 * « Touche la couleur chaude / froide » (`couleurs-chaudes-froides`) : les trois exercices d'un palier ne se répètent pas, et aucune question
 * ne revient d'un palier à l'autre.
 *
 * En production, les trois exercices d'un palier du CE2 (`ar-ce2-coloriage`) tiraient une couleur et une température au hasard parmi six
 * couleurs et deux énoncés : deux « Touche la couleur FROIDE, celle de la mer et de la nuit. » dans le même palier, et les mêmes couleurs d'un
 * palier à l'autre. Ces tests fabriquent les paliers par `generateGames`, comme la fabrication, et relisent chaque exercice avec leur propre
 * table de couleurs chaudes et froides.
 */
import { describe, expect, it } from "vitest";
import { generateGames, type GameKind } from "../paliers/games";

const SEEDS = Array.from({ length: 120 }, (_, i) => `chaud-froid-${i}`);
/** Les couleurs chaudes et froides de la fiche, écrites ici. */
const WARM = ["rouge", "orange", "jaune"];
const COLD = ["bleu", "vert", "violet"];
const SPECS = [{ kind: "couleurs-chaudes-froides" as GameKind, count: 3 }];

type Question = { prompt: string; answer: string; choices: string[] };

function palier(seed: string, palierIndex: number): Question[] {
  return generateGames(SPECS, { klass: "CE2", palierIndex, palierCount: 4, seed: `${seed}-p${palierIndex}` }).map((game) => {
    const payload = game.payload as unknown as { choices: { name: string }[] };
    return { prompt: game.prompt, answer: game.answerKey, choices: payload.choices.map((choice) => choice.name) };
  });
}

describe("couleurs-chaudes-froides : un palier, quatre paliers", () => {
  it("chaque exercice a trois pots dont un seul a la température demandée, et c'est la réponse", () => {
    for (const seed of SEEDS) {
      for (let p = 1; p <= 4; p++) {
        for (const q of palier(seed, p)) {
          const warmAsked = q.prompt.includes("CHAUDE");
          const coldAsked = q.prompt.includes("FROIDE");
          expect(warmAsked !== coldAsked, `${seed} : ${q.prompt}`).toBe(true);
          const rightOnes = q.choices.filter((name) => (warmAsked ? WARM : COLD).includes(name));
          expect(q.choices, `${seed} : ${q.prompt}`).toHaveLength(3);
          expect(rightOnes, `${seed} : ${q.prompt} : ${q.choices.join(", ")}`).toEqual([q.answer]);
        }
      }
    }
  });

  it("les trois exercices d'un palier ont trois réponses différentes et trois énoncés différents", () => {
    for (const seed of SEEDS) {
      for (let p = 1; p <= 4; p++) {
        const questions = palier(seed, p);
        expect(new Set(questions.map((q) => q.answer)).size, `${seed} palier ${p} : deux fois la même réponse`).toBe(3);
        expect(new Set(questions.map((q) => q.prompt)).size, `${seed} palier ${p} : deux fois le même énoncé`).toBe(3);
        const warm = questions.filter((q) => q.prompt.includes("CHAUDE")).length;
        expect([1, 2], `${seed} palier ${p} : chaudes et froides alternent`).toContain(warm);
      }
    }
  });

  it("aucun énoncé ne nomme un objet d'une seule couleur, qui contredirait une autre bonne réponse de la même température", () => {
    // « celle des feuilles du manguier » (vert) avec « bleu » ou « violet » pour réponse, « celle d'une mangue mûre » avec « jaune » : l'énoncé
    // décrit la température, jamais une couleur en particulier.
    const oneColourObjects = /feuille|manguier|mangue|herbe|ciel|banane|tomate|aubergine/iu;
    for (const seed of SEEDS.slice(0, 40)) {
      for (let p = 1; p <= 4; p++) for (const q of palier(seed, p)) expect(q.prompt, `${seed} palier ${p}`).not.toMatch(oneColourObjects);
    }
  });

  it("aucune question (énoncé et réponse) ne revient d'un palier à l'autre", () => {
    for (const seed of SEEDS) {
      const seen = new Map<string, number>();
      for (let p = 1; p <= 4; p++) {
        for (const q of palier(seed, p)) {
          const key = `${q.prompt}|${q.answer}`;
          expect(seen.has(key), `${seed} : « ${q.prompt} » (${q.answer}) aux paliers ${seen.get(key)} et ${p}`).toBe(false);
          seen.set(key, p);
        }
      }
    }
  });
});
