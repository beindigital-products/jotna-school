import { describe, expect, it, vi } from "vitest";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { makeContext } from "../paliers/games/shared";
import type { ListenPayload } from "../paliers/games/types";
import type { VisibleClassName } from "../curriculum";
import { effectivePalierCount } from "../palierRules";
import { allProgrammeEntries } from "../programme";

// Les boucles de ces tests fabriquent des milliers de paliers : sur une machine chargée, les cinq secondes par défaut ne suffisent pas.
vi.setConfig({ testTimeout: 30_000 });

/**
 * L'ÉCOUTE NE POSE JAMAIS DEUX FOIS LE MÊME EXERCICE DANS UN PALIER.
 *
 * Relevé sur 300 graines par palier avant la correction : « Grave ou aigu ? » et « Long ou court, fort ou doux » (CI) avaient
 * un exercice en double dans 90 % et 79 % de leurs paliers, les sept autres thématiques d'écoute du CE1 au CM2 dans 8 à 38 %.
 * Les genres d'écoute tiraient au hasard sans regarder ce que le palier avait déjà posé, et quatre d'entre eux n'ont que quelques
 * variantes par niveau.
 *
 * Ces tests fabriquent les paliers par `generateGames`, comme la fabrication, et recalculent chaque réponse depuis les sons
 * avec leurs propres tables : ils ne lisent pas les listes du code.
 */

type Listen = {
  prompt: string;
  answerKey: string;
  payload: ListenPayload & { game: { kind: string; level: number } };
};

/** Les dix notes de la gamme des mélodies, en hertz. */
const SCALE = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];

/** Ce que l'enfant entend et ce qu'on lui demande : l'énoncé et les sons. */
const heard = (game: Listen) => JSON.stringify([game.prompt, game.payload.clips]);

function palier(klass: VisibleClassName, palierIndex: number, palierCount: number, specs: { kind: GameKind; count: number }[], seed: string) {
  return generateGames(specs, { klass, palierIndex, palierCount, seed }) as unknown as Listen[];
}

const isListen = (game: Listen) => String(game.payload.game.kind).startsWith("ecoute-");

describe("le programme : aucun palier n'a deux exercices d'écoute identiques", () => {
  const SEEDS = Array.from({ length: 80 }, (_, i) => `ecoute-${i}`);
  const topics = allProgrammeEntries().filter(({ topic }) => (topic.games ?? []).some((spec) => String(spec.kind).startsWith("ecoute-")));

  it("le programme joue de l'écoute dans plusieurs classes, dont les deux thématiques du CI", () => {
    const keys = topics.map(({ topic }) => topic.key);
    expect(keys).toEqual(expect.arrayContaining(["ar-ci-grave-aigu", "ar-ci-long-fort", "ar-ce1-sons"]));
    expect(new Set(topics.map(({ klass }) => klass)).size).toBeGreaterThanOrEqual(5);
  });

  for (const { klass, topic } of topics) {
    it(`${topic.key} (${klass}) : jamais les mêmes sons avec la même question dans un palier`, () => {
      const palierCount = effectivePalierCount({ palierCount: topic.palierCount, class: klass });
      for (const seed of SEEDS) {
        for (let palierIndex = 1; palierIndex <= palierCount; palierIndex++) {
          const games = palier(klass, palierIndex, palierCount, topic.games ?? [], `${seed}:${topic.key}:${palierIndex}`);
          const keys = games.filter(isListen).map(heard);
          expect(new Set(keys).size, `graine ${seed}, palier ${palierIndex}`).toBe(keys.length);
        }
      }
    });
  }
});

describe("le CI : « Grave ou aigu ? » et « Long ou court, fort ou doux »", () => {
  const SEEDS = Array.from({ length: 200 }, (_, i) => `ci-${i}`);
  const THEMES = [
    { name: "grave-aigu", specs: [{ kind: "ecoute-hauteur", count: 7 }, { kind: "ecoute-melodie", count: 3 }] },
    { name: "long-fort", specs: [{ kind: "ecoute-duree", count: 5 }, { kind: "ecoute-intensite", count: 5 }] },
  ] as { name: string; specs: { kind: GameKind; count: number }[] }[];

  for (const theme of THEMES) {
    it(`${theme.name} : chaque genre pose autant d'exercices différents que le palier en demande`, () => {
      for (const seed of SEEDS) {
        for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
          const games = palier("CI", palierIndex, 3, theme.specs, `${seed}:${theme.name}:${palierIndex}`);
          for (const spec of theme.specs) {
            const ofKind = games.filter((g) => g.payload.game.kind === spec.kind).map(heard);
            expect(ofKind, `graine ${seed}, palier ${palierIndex}, ${spec.kind}`).toHaveLength(spec.count);
            expect(new Set(ofKind).size, `graine ${seed}, palier ${palierIndex}, ${spec.kind}`).toBe(spec.count);
          }
        }
      }
    });
  }
});

/** Le mouvement de chaque mélodie, relu sur les notes : la forme annoncée est celle qu'on entend. */
function checkMelody(game: Listen, band: number) {
  const p = game.payload;
  const f = p.clips[0].notes.map((note) => note.f);
  expect(f, game.prompt).toHaveLength(band === 0 ? 3 : band === 1 ? 4 : 5);
  for (const hertz of f) expect(SCALE, `${hertz} n'est pas une note de la gamme`).toContain(hertz);
  const answer = p.options[p.correctIndex];
  const rises = (list: number[]) => list.every((x, i) => i === 0 || x > list[i - 1]);
  const falls = (list: number[]) => list.every((x, i) => i === 0 || x < list[i - 1]);
  if (answer === "Elle monte") expect(rises(f)).toBe(true);
  else if (answer === "Elle descend") expect(falls(f)).toBe(true);
  else {
    expect(answer).toBe("Elle monte puis descend");
    const top = f.indexOf(Math.max(...f));
    expect(top > 0 && top < f.length - 1).toBe(true);
    expect(rises(f.slice(0, top + 1))).toBe(true);
    expect(falls(f.slice(top))).toBe(true);
  }
  // La forme en arche n'est proposée qu'à partir du troisième niveau.
  expect(p.options.includes("Elle monte puis descend")).toBe(p.game.level >= 3);
  expect(game.answerKey).toBe(answer);
}

describe("les réponses se recalculent depuis les sons, à tous les niveaux de chaque tranche d'âge", () => {
  const CASES: { klass: VisibleClassName; band: number }[] = [
    { klass: "CI", band: 0 },
    { klass: "CE1", band: 1 },
    { klass: "CM2", band: 2 },
  ];
  const SEEDS = Array.from({ length: 25 }, (_, i) => `reponses-${i}`);

  /** Chaque palier de chaque classe de l'essai, avec huit exercices du genre demandé. */
  function everyPalier(kind: GameKind, visit: (game: Listen, band: number) => void) {
    for (const { klass, band } of CASES) {
      for (const palierCount of [3, 4, 5]) {
        for (let palierIndex = 1; palierIndex <= palierCount; palierIndex++) {
          for (const seed of SEEDS) {
            for (const game of palier(klass, palierIndex, palierCount, [{ kind, count: 8 }], `${seed}:${kind}:${klass}:${palierIndex}`)) {
              visit(game, band);
            }
          }
        }
      }
    }
  }

  it("le son le plus aigu, ou le plus grave, est celui qu'on désigne", () => {
    everyPalier("ecoute-hauteur", (game) => {
      const p = game.payload;
      const freqs = p.clips.map((clip) => clip.notes[0].f);
      const expected = game.prompt.includes("le plus aigu")
        ? Math.max(...freqs)
        : game.prompt.includes("le plus grave")
          ? Math.min(...freqs)
          : Number.NaN;
      expect(freqs[p.correctIndex], game.prompt).toBe(expected);
      expect(new Set(freqs).size).toBe(freqs.length);
      expect(p.options).toEqual(p.clips.map((_, i) => `Le son ${i + 1}`));
      expect(game.answerKey).toBe(p.options[p.correctIndex]);
    });
  });

  it("le son le plus long, ou le plus court, est celui qu'on désigne, sur une seule note", () => {
    everyPalier("ecoute-duree", (game) => {
      const p = game.payload;
      const durations = p.clips.map((clip) => clip.notes[0].d);
      const expected = game.prompt.includes("le plus longtemps")
        ? Math.max(...durations)
        : game.prompt.includes("le plus court")
          ? Math.min(...durations)
          : Number.NaN;
      expect(durations[p.correctIndex], game.prompt).toBe(expected);
      expect(new Set(durations).size).toBe(durations.length);
      expect(new Set(p.clips.map((clip) => clip.notes[0].f)).size).toBe(1);
      expect(game.answerKey).toBe(p.options[p.correctIndex]);
    });
  });

  it("le son le plus fort, ou le plus doux, est celui qu'on désigne, sur une seule note et une seule durée", () => {
    everyPalier("ecoute-intensite", (game) => {
      const p = game.payload;
      const volumes = p.clips.map((clip) => clip.notes[0].v as number);
      const expected = game.prompt.includes("le plus fort")
        ? Math.max(...volumes)
        : game.prompt.includes("le plus doux")
          ? Math.min(...volumes)
          : Number.NaN;
      expect(volumes[p.correctIndex], game.prompt).toBe(expected);
      expect(new Set(volumes).size).toBe(volumes.length);
      expect(new Set(p.clips.map((clip) => clip.notes[0].f)).size).toBe(1);
      expect(new Set(p.clips.map((clip) => clip.notes[0].d)).size).toBe(1);
      expect(game.answerKey).toBe(p.options[p.correctIndex]);
    });
  });

  it("la mélodie monte, descend ou fait l'arche comme la réponse le dit, sans sortir de la gamme", () => {
    everyPalier("ecoute-melodie", checkMelody);
  });
});

describe("aucune variante n'est perdue : sur beaucoup de graines, un niveau les pose toutes", () => {
  const SEEDS = Array.from({ length: 400 }, (_, i) => `variantes-${i}`);

  /** Les exercices différents que `kind` pose au palier `palierIndex` d'une thématique de `palierCount` paliers. */
  function reached(kind: GameKind, klass: VisibleClassName, palierIndex: number, palierCount: number) {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      for (const game of palier(klass, palierIndex, palierCount, [{ kind, count: 10 }], `${seed}:${kind}`)) seen.add(heard(game));
    }
    return seen.size;
  }

  it("grave ou aigu, au CI et au premier palier : 3 paires x 2 ordres x 2 questions = 12", () => {
    expect(reached("ecoute-hauteur", "CI", 1, 3)).toBe(12);
  });

  it("grave ou aigu, au CE1 et au troisième palier de quatre : trois sons, 3 paires x 6 ordres x 2 questions = 36", () => {
    expect(reached("ecoute-hauteur", "CE1", 3, 4)).toBe(36);
  });

  it("long ou court, au CI et au premier palier : 4 notes x 2 ordres x 2 questions = 16", () => {
    expect(reached("ecoute-duree", "CI", 1, 3)).toBe(16);
  });

  it("fort ou doux, au CI et au premier palier : 3 notes x 2 ordres x 2 questions = 12", () => {
    expect(reached("ecoute-intensite", "CI", 1, 3)).toBe(12);
  });

  it("la mélodie du CI, au premier palier : pas de deux notes, 6 départs x (monte, descend) = 12", () => {
    expect(reached("ecoute-melodie", "CI", 1, 3)).toBe(12);
  });

  it("la mélodie du CI, au dernier palier : 8 départs qui montent, 8 qui descendent, 9 arches = 25", () => {
    expect(reached("ecoute-melodie", "CI", 3, 3)).toBe(25);
  });
});

describe("un tirage identique à un exercice déjà posé est refait", () => {
  it("compter les coups, reconnaître un rythme, deux mélodies : la même graine ne redonne pas le même exercice dans le palier", () => {
    // Les trois genres ont des centaines de variantes : le hasard les répète rarement, un tirage identique doit être refait.
    for (const kind of ["ecoute-rythme", "ecoute-motif-rythmique", "ecoute-pareil"] as const) {
      for (let n = 0; n < 20; n++) {
        const used = new Set<string>();
        const first = GAME_KINDS[kind].make(makeContext("CE1", 2, `meme-${n}`, used)) as unknown as Listen;
        const second = GAME_KINDS[kind].make(makeContext("CE1", 2, `meme-${n}`, used)) as unknown as Listen;
        expect(heard(second), `${kind}, graine meme-${n}`).not.toBe(heard(first));
      }
    }
  });
});

describe("quand un palier demande plus d'exercices que le genre n'a de variantes", () => {
  it("les variantes reviennent, une fois chacune d'abord, et tout reste juste", () => {
    // Au CM2 et au premier palier de cinq, la mélodie a cinq notes et un pas de deux : 2 départs x (monte, descend) = 4 variantes.
    for (let n = 0; n < 40; n++) {
      const games = palier("CM2", 1, 5, [{ kind: "ecoute-melodie", count: 10 }], `epuise-${n}`);
      expect(games).toHaveLength(10);
      expect(new Set(games.slice(0, 4).map(heard)).size, `graine epuise-${n}`).toBe(4);
      expect(new Set(games.map(heard)).size).toBe(4);
      for (const game of games) checkMelody(game, 2);
    }
  });
});
