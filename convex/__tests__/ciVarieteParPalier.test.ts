import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { generateGames, type GameSpec } from "../paliers/games";
import { levelGroup, makeContext, pickFresh, takeFresh, variantsForLevel, type GameLevel } from "../paliers/games/shared";
import { effectivePalierCount } from "../palierRules";
import { allProgrammeEntries } from "../programme";

vi.setConfig({ testTimeout: 60_000 });

/**
 * LA MÊME QUESTION NE REVIENT PAS D'UN PALIER À L'AUTRE, AU CI.
 *
 * Les paliers d'une thématique sont fabriqués chacun de son côté, avec sa graine : chacun tirait au hasard dans la même petite liste, et
 * la même question revenait à deux ou trois paliers. Relevé sur 200 graines, avant la correction : en moyenne 17,7 % des questions d'une
 * thématique de CI reviennent dans un autre palier de la même thématique, jusqu'à 57 % pour « Les mesures ». Une thématique qui porte
 * `byLevel` partage ses listes entre ses paliers (`variantsForLevel`, `pickFresh`, `takeFresh`) : le premier tiers de chaque liste au
 * premier palier, le deuxième au deuxième, le dernier ensuite.
 *
 * Ces tests ne lisent pas les listes du code : ils fabriquent les paliers comme la fabrication (`generateGames`) et comparent les questions.
 */

/** Une forme qui ne dépend pas de l'ordre des tuiles : deux contenus identiques ont la même. */
function canon(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => JSON.stringify(canon(v))).sort();
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canon((value as Record<string, unknown>)[k])]));
  return value;
}

type Made = { type: string; prompt: string; answerKey: string; payload: Record<string, unknown> };

/**
 * Ce que l'enfant reconnaît comme la même question : le genre, l'énoncé, la bonne réponse et, pour un trou, la phrase ; pour une suite,
 * la suite ; pour un dessin à copier, le dessin ; pour une écoute, les sons. Les mauvais choix, tirés au hasard, ne font pas une autre
 * question : « Quel animal est le plus lourd ? » avec d'autres bêtes autour de l'éléphant reste la même.
 */
function questionOf(game: Made) {
  const origin = game.payload.game as { kind: string };
  return JSON.stringify([
    origin.kind,
    game.prompt,
    game.answerKey,
    game.payload.text ?? null,
    game.payload.sequence ? canon(game.payload.sequence) : null,
    game.type === "pixel-art" ? canon(game.payload.target) : null,
    game.type === "listen" ? canon(game.payload.clips) : null,
  ]);
}

/** Ce qui fait deux exercices identiques dans un palier : tout leur contenu, sauf l'ordre où l'écran mélange les tuiles. */
function exactOf(game: Made) {
  const { game: _origin, concept: _concept, ...content } = game.payload;
  return JSON.stringify([game.type, game.prompt, game.answerKey, canon(content)]);
}

const LEVELS: GameLevel[] = [1, 2, 4];
const ci = allProgrammeEntries().filter((entry) => entry.klass === "CI");

/** Les exercices de chaque palier d'une thématique, pour une graine. */
function paliersOf(entry: (typeof ci)[number], seed: string) {
  const palierCount = effectivePalierCount({ palierCount: entry.topic.palierCount, class: "CI" });
  return Array.from({ length: palierCount }, (_, i) =>
    generateGames(entry.topic.games ?? [], {
      klass: "CI",
      palierIndex: i + 1,
      palierCount,
      seed: `${entry.topic.key}:${i + 1}:${seed}`,
      windowed: entry.topic.byLevel === true,
    }),
  );
}

/** Pour un genre, combien de ses questions reviennent dans un autre palier, sur le total de ses questions, pour N graines. */
function repeated(entry: (typeof ci)[number], kind: string, seeds: number) {
  let total = 0;
  let again = 0;
  for (let s = 0; s < seeds; s++) {
    const perPalier = paliersOf(entry, `variete-${s}`).map(
      (games) => new Set(games.filter((g) => (g.payload.game as { kind: string }).kind === kind).map(questionOf)),
    );
    perPalier.forEach((questions, i) => {
      for (const q of questions) {
        total += 1;
        if (perPalier.some((other, j) => j !== i && other.has(q))) again += 1;
      }
    });
  }
  return { total, again };
}

describe("variantsForLevel : les tiers d'une liste", () => {
  it("trois paliers (niveaux 1, 2, 4) ont trois tiers qui ne se touchent pas et qui font la liste entière", () => {
    for (const length of [6, 7, 9, 10, 12, 15]) {
      const items = Array.from({ length }, (_, i) => i);
      const [a, b, c] = LEVELS.map((level) => variantsForLevel(items, level));
      expect(new Set([...a, ...b, ...c]).size, `liste de ${length}`).toBe(length);
      expect(a.length + b.length + c.length, `liste de ${length}`).toBe(length);
      expect(a.some((x) => b.includes(x) || c.includes(x))).toBe(false);
      expect(b.some((x) => c.includes(x))).toBe(false);
      // Le niveau 3 d'une classe à quatre paliers partage le tiers du niveau 4.
      expect(variantsForLevel(items, 3)).toEqual(c);
    }
  });

  it("le décalage fait prendre à un palier le tiers d'un autre : le groupe se décale de un, de deux, puis revient", () => {
    const items = Array.from({ length: 9 }, (_, i) => i);
    expect(variantsForLevel(items, 1, 1)).toEqual(variantsForLevel(items, 2, 0));
    expect(variantsForLevel(items, 1, 2)).toEqual(variantsForLevel(items, 4, 0));
    expect(variantsForLevel(items, 2, 2)).toEqual(variantsForLevel(items, 1, 0));
    expect(variantsForLevel(items, 4, 1)).toEqual(variantsForLevel(items, 1, 0));
    expect(levelGroup(1)).toBe(0);
    expect(levelGroup(2)).toBe(1);
    expect(levelGroup(3)).toBe(2);
    expect(levelGroup(4)).toBe(2);
  });

  it("une liste de moins de trois éléments reste entière : il n'y a rien à partager", () => {
    expect(variantsForLevel(["a", "b"], 1)).toEqual(["a", "b"]);
    expect(variantsForLevel(["a"], 4)).toEqual(["a"]);
  });
});

describe("pickFresh et takeFresh dans une thématique qui partage ses variantes", () => {
  const items = Array.from({ length: 9 }, (_, i) => `v${i}`);
  const key = (item: string) => `k:${item}`;
  const ctxOf = (level: GameLevel, seed: string, window?: 0 | 1 | 2, used = new Set<string>()) => makeContext("CI", level, seed, used, undefined, window);

  it("sans fenêtre, un palier tire dans toute la liste", () => {
    const seen = new Set<string>();
    for (let n = 0; n < 300; n++) seen.add(pickFresh(ctxOf(1, `sans-${n}`), items, key));
    expect(seen.size).toBe(9);
  });

  it("avec une fenêtre, chaque palier tire dans son tiers, et dans tout son tiers", () => {
    const expected: Record<number, string[]> = { 1: items.slice(0, 3), 2: items.slice(3, 6), 4: items.slice(6, 9) };
    for (const level of LEVELS) {
      const seen = new Set<string>();
      for (let n = 0; n < 200; n++) seen.add(pickFresh(ctxOf(level, `fenetre-${n}`, 0), items, key));
      expect([...seen].sort(), `niveau ${level}`).toEqual(expected[level]);
    }
  });

  it("un décalage prend le tiers suivant : deux jeux d'un même palier ne se disputent pas la même liste", () => {
    for (let n = 0; n < 100; n++) {
      const used = new Set<string>();
      const first = pickFresh(ctxOf(1, `decale-${n}`, 0, used), items, key);
      const second = pickFresh(ctxOf(1, `decale-b-${n}`, 1, used), items, key);
      expect(items.slice(0, 3)).toContain(first);
      expect(items.slice(3, 6)).toContain(second);
    }
  });

  it("quand le tiers est épuisé, le palier prend les autres variantes avant d'en reprendre une", () => {
    const used = new Set<string>();
    const picked = Array.from({ length: 9 }, (_, n) => pickFresh(ctxOf(2, `epuise-${n}`, 0, used), items, key));
    expect(new Set(picked).size).toBe(9);
    expect(picked.slice(0, 3).sort()).toEqual(items.slice(3, 6));
  });

  it("quand tout a servi, le tiers ne compte plus : les variantes reprises viennent de toute la liste", () => {
    // Rester dans le tiers reposerait le même exercice à chaque reprise (deux rangements de couleurs identiques dans un palier).
    const used = new Set<string>();
    for (let n = 0; n < 9; n++) pickFresh(ctxOf(2, `plein-${n}`, 0, used), items, key);
    const again = new Set<string>();
    for (let n = 0; n < 200; n++) again.add(pickFresh(ctxOf(2, `reprise-${n}`, 0, used), items, key));
    expect(again.size).toBe(9);
  });

  it("l'univers : une liste réduite à ce niveau garde les tiers de la liste entière", () => {
    const universe = ["droite", "gauche", "haut", "bas"];
    const easy = universe.slice(0, 2);
    const seen = new Set<string>();
    for (let n = 0; n < 100; n++) seen.add(pickFresh(ctxOf(2, `univers-${n}`, 0), easy, (x) => x, universe));
    // Au deuxième niveau le tiers de la liste entière est « gauche » : c'est lui qu'on tire, pas l'un des deux au hasard.
    expect([...seen]).toEqual(["gauche"]);
    // Quand le tiers ne touche pas la liste réduite, on tire dans la liste réduite.
    const outside = new Set<string>();
    for (let n = 0; n < 100; n++) outside.add(pickFresh(ctxOf(4, `univers-b-${n}`, 0), easy, (x) => x, universe));
    expect([...outside].sort()).toEqual(["droite", "gauche"]);
  });

  it("takeFresh prend d'abord les variantes du tiers, puis les autres", () => {
    for (let n = 0; n < 100; n++) {
      const two = takeFresh(ctxOf(4, `prend-${n}`, 0), items, 2, key);
      expect(two.every((x) => items.slice(6, 9).includes(x))).toBe(true);
      const five = takeFresh(ctxOf(4, `prend-b-${n}`, 0), items, 5, key);
      expect(five.slice(0, 3).sort()).toEqual(items.slice(6, 9));
      expect(new Set(five).size).toBe(5);
    }
  });
});

describe("generateGames : les jeux d'une thématique reçoivent chacun un décalage", () => {
  // Les animaux de l'anglais ne passent que par `pickFresh` : sans le réglage, ils tirent dans toute la liste.
  const specs: GameSpec[] = [
    { kind: "animal-mot", count: 3 },
    { kind: "animal-francais", count: 2 },
    { kind: "animal-intrus", count: 2 },
  ];
  const palier = (palierIndex: number, seed: string, windowed: boolean) =>
    generateGames(specs, { klass: "CI", palierIndex, palierCount: 3, seed, windowed });

  it("avec la fenêtre, les trois paliers repartent d'une liste partagée : bien moins de questions reviennent", () => {
    let withWindow = 0;
    let without = 0;
    for (let n = 0; n < 150; n++) {
      for (const [windowed, count] of [[true, (v: number) => (withWindow += v)], [false, (v: number) => (without += v)]] as const) {
        const [one, two, three] = [1, 2, 3].map((i) => palier(i, `fenetre:${n}`, windowed).map(questionOf));
        count(one.filter((q) => two.includes(q) || three.includes(q)).length + two.filter((q) => three.includes(q)).length);
      }
    }
    expect(withWindow).toBeLessThan(without / 3);
  });

  it("le décalage suit la place du jeu dans la thématique : deux jeux qui puisent dans la même liste préfèrent des tiers différents", () => {
    // Deux fois le même genre, aux places 0 et 1 : le premier prend le premier tiers des animaux, le second le tiers suivant.
    const two: GameSpec[] = [
      { kind: "animal-mot", count: 1 },
      { kind: "animal-mot", count: 1 },
    ];
    const first = new Set<string>();
    const second = new Set<string>();
    for (let n = 0; n < 300; n++) {
      const [a, b] = generateGames(two, { klass: "CI", palierIndex: 1, palierCount: 3, seed: `place:${n}`, windowed: true });
      first.add(a.answerKey);
      second.add(b.answerKey);
    }
    expect(first.size).toBeGreaterThan(1);
    expect([...first].filter((answer) => second.has(answer))).toEqual([]);
  });

  it("sans le réglage, les mêmes graines refont les mêmes exercices", () => {
    expect(palier(2, "meme", false)).toEqual(generateGames(specs, { klass: "CI", palierIndex: 2, palierCount: 3, seed: "meme" }));
  });
});

describe("les thématiques du CI", () => {
  it("toutes partagent leurs variantes entre leurs paliers", () => {
    expect(ci.length).toBe(46);
    const without = ci.filter((entry) => entry.topic.byLevel !== true).map((entry) => entry.topic.key);
    expect(without).toEqual([]);
  });

  it("les autres classes ne changent pas : aucune n'a le réglage", () => {
    const others = allProgrammeEntries().filter((entry) => entry.klass !== "CI" && entry.topic.byLevel === true);
    expect(others.map((entry) => entry.topic.key)).toEqual([]);
  });

  const byKey = (key: string) => ci.find((entry) => entry.topic.key === key) as (typeof ci)[number];

  // Les genres dont la liste est assez longue pour que trois paliers ne se recoupent jamais : zéro question qui revient, sur 120 graines.
  const NEVER: [string, string[]][] = [
    ["sc-ci-outils", ["outil-qui", "outil-trou", "outil-geste", "outil-ordre"]],
    ["ci-ci-route", ["civ-situation"]],
    ["ci-ci-entraide", ["civ-situation"]],
    ["ci-ci-ecole", ["civ-situation"]],
    ["ci-ci-politesse", ["civ-situation"]],
    ["hi-ci-semaine", ["jour-rang"]],
    ["hi-ci-journee", ["activite-moment"]],
    ["ge-ci-lateralite", ["doigt-direction"]],
    ["sc-ci-animaux", ["faune-vit"]],
    ["ma-ci-mesures", ["comparer-mesure"]],
  ];
  for (const [topic, kinds] of NEVER) {
    for (const kind of kinds) {
      it(`${topic} : « ${kind} » ne pose jamais la même question à deux paliers`, () => {
        const { total, again } = repeated(byKey(topic), kind, 120);
        expect(total).toBeGreaterThan(0);
        expect(again, `${again} questions sur ${total}`).toBe(0);
      });
    }
  }

  it("un palier ne pose pas deux fois le même exercice non plus", () => {
    for (const entry of ci) {
      for (let s = 0; s < 80; s++) {
        for (const games of paliersOf(entry, `dans-${s}`)) {
          const exact = games.map(exactOf);
          expect(new Set(exact).size, `${entry.topic.key}, graine ${s}`).toBe(exact.length);
        }
      }
    }
  });

  it("la part des questions qui reviennent dans un autre palier est restée basse dans toute la classe", () => {
    // Avant : 17,7 % en moyenne sur 200 graines. Après : 10,4 %. La marge laisse passer le bruit de 40 graines.
    let sum = 0;
    const worst: string[] = [];
    for (const entry of ci) {
      let total = 0;
      let again = 0;
      for (let s = 0; s < 40; s++) {
        const perPalier = paliersOf(entry, `classe-${s}`).map((games) => new Set(games.map(questionOf)));
        perPalier.forEach((questions, i) => {
          for (const q of questions) {
            total += 1;
            if (perPalier.some((other, j) => j !== i && other.has(q))) again += 1;
          }
        });
      }
      const share = again / total;
      sum += share;
      if (share > 0.65) worst.push(`${entry.topic.key} ${(share * 100).toFixed(0)} %`);
    }
    expect(sum / ci.length).toBeLessThan(0.14);
    expect(worst, "une thématique repasse au-dessus de 65 %").toEqual([]);
  });
});

describe("la fabrication d'un palier passe le réglage de la thématique", () => {
  it("convex/paliers/index.ts donne `byLevel` de la fiche du programme à generateGames", () => {
    const source = readFileSync(join(process.cwd(), "convex", "paliers", "index.ts"), "utf8");
    expect(source).toContain("windowed: programme?.topic.byLevel === true");
  });
});

describe("les genres réécrits pour le partage par palier", () => {
  const ask = (topic: string, kind: string, palierIndex: number, seed: string) => {
    const entry = ci.find((e) => e.topic.key === topic) as (typeof ci)[number];
    const palierCount = effectivePalierCount({ palierCount: entry.topic.palierCount, class: "CI" });
    return generateGames(entry.topic.games ?? [], { klass: "CI", palierIndex, palierCount, seed: `${topic}:${palierIndex}:${seed}`, windowed: true }).filter(
      (g) => (g.payload.game as { kind: string }).kind === kind,
    );
  };

  it("jour-rang : le premier et le dernier jour d'abord, puis le deuxième et le troisième, enfin le quatrième et le cinquième", () => {
    const expected = [
      ["premier", "dernier"],
      ["deuxième", "troisième"],
      ["quatrième", "cinquième"],
    ];
    for (let n = 0; n < 40; n++) {
      [1, 2, 3].forEach((palierIndex, i) => {
        const words = ask("hi-ci-semaine", "jour-rang", palierIndex, `rang-${n}`).map((g) => /le (\S+) jour/.exec(g.prompt)?.[1]);
        expect([...words].sort(), `graine ${n}, palier ${palierIndex}`).toEqual([...expected[i]].sort());
      });
    }
  });

  it("doigt-direction : la droite ou la gauche, puis le haut, puis le bas", () => {
    const expected = [/la droite|la gauche/, /le haut/, /le bas/];
    for (let n = 0; n < 40; n++) {
      [1, 2, 3].forEach((palierIndex, i) => {
        const [game] = ask("ge-ci-lateralite", "doigt-direction", palierIndex, `doigt-${n}`);
        expect(game.prompt, `graine ${n}, palier ${palierIndex}`).toMatch(expected[i]);
      });
    }
  });

  it("faune-vit : le poisson, l'étoile de mer et l'oiseau, chacun à son palier", () => {
    for (let n = 0; n < 40; n++) {
      const answers = [1, 2, 3].map((palierIndex) => ask("sc-ci-animaux", "faune-vit", palierIndex, `vit-${n}`)[0].answerKey);
      expect(new Set(answers).size, `graine ${n} : ${answers.join(", ")}`).toBe(3);
    }
  });

  it("comparer-mesure : la bonne réponse change à chaque palier, pour chaque adjectif", () => {
    for (let n = 0; n < 60; n++) {
      const byAdjective = new Map<string, string[]>();
      [1, 2, 3].forEach((palierIndex) => {
        for (const g of ask("ma-ci-mesures", "comparer-mesure", palierIndex, `mesure-${n}`)) {
          const adjective = /le plus (\S+) \?/.exec(g.prompt)?.[1] as string;
          byAdjective.set(adjective, [...(byAdjective.get(adjective) ?? []), g.answerKey]);
        }
      });
      for (const [adjective, answers] of byAdjective) expect(new Set(answers).size, `graine ${n}, « ${adjective} » : ${answers.join(", ")}`).toBe(answers.length);
    }
  });
});
