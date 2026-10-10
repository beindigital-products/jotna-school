import { describe, expect, it } from "vitest";
import {
  GAME_KINDS,
  gameCount,
  gameOriginOf,
  generateGames,
  interleave,
  regenerateGame,
  type GameKind,
} from "../paliers/games";
import {
  ALL_MOTIFS,
  LARGE_MOTIFS,
  PAINTS,
  SMALL_MOTIFS,
  isMirrorSymmetric,
  paletteOf,
} from "../paliers/games/pixel";
import { MIXES, mixOf } from "../paliers/games/colors";
import { formatNumber } from "../paliers/games/patterns";
import { correctAnswerText, sanitizePayload, verifyAnswer } from "../paliers/exerciseRules";
import type {
  ColorMixPayload,
  ListenPayload,
  PatternPayload,
  PixelArtPayload,
} from "../paliers/games/types";
import { VISIBLE_CLASSES } from "../curriculum";

const KINDS = Object.keys(GAME_KINDS) as GameKind[];

/** La bonne réponse d'un jeu, telle qu'un écran l'enverrait. */
function rightAnswer(type: string, payload: unknown): string {
  switch (type) {
    case "pattern":
      return JSON.stringify((payload as PatternPayload).answers);
    case "pixel-art":
      return JSON.stringify((payload as PixelArtPayload).target);
    case "listen":
      return String((payload as ListenPayload).correctIndex);
    case "color-mix":
      return JSON.stringify((payload as ColorMixPayload).answer);
    default:
      throw new Error(`type inattendu ${type}`);
  }
}

describe("les motifs dessinés à la main", () => {
  it("ont des lignes de même longueur et des couleurs de la palette", () => {
    for (const motif of ALL_MOTIFS) {
      const width = motif.rows[0].length;
      for (const row of motif.rows) {
        expect(row.length, `${motif.key} : ligne « ${row} »`).toBe(width);
        for (const cell of row) {
          expect(cell === "." || PAINTS[cell] !== undefined, `${motif.key} : case « ${cell} »`).toBe(true);
        }
      }
      expect(paletteOf(motif.rows).length).toBeGreaterThan(0);
    }
  });

  it("sont symétriques quand ils le prétendent, avec une largeur paire", () => {
    for (const motif of ALL_MOTIFS.filter((m) => m.mirror)) {
      expect(isMirrorSymmetric(motif.rows), motif.key).toBe(true);
      expect(motif.rows[0].length % 2, motif.key).toBe(0);
    }
  });

  it("restent petits pour les petits et tiennent sur un téléphone pour les grands", () => {
    for (const motif of SMALL_MOTIFS) expect(motif.rows[0].length).toBeLessThanOrEqual(5);
    for (const motif of LARGE_MOTIFS) {
      expect(motif.rows[0].length).toBeLessThanOrEqual(9);
      expect(motif.rows.length).toBeLessThanOrEqual(9);
    }
  });

  it("portent des clés uniques", () => {
    const keys = ALL_MOTIFS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("chaque jeu, à chaque niveau, dans chaque classe", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse est juste, une mauvaise est fausse, l'écran ne voit pas la réponse`, () => {
      for (const klass of VISIBLE_CLASSES) {
        for (const palierIndex of [1, 2, 3, 4, 5]) {
          const [game] = generateGames([{ kind, count: 1 }], {
            klass,
            palierIndex,
            palierCount: 5,
            seed: `test:${klass}:${palierIndex}`,
          });
          expect(game.type).toBe(GAME_KINDS[kind].type);
          expect(game.prompt.length).toBeGreaterThan(10);
          // L'écran coupe une consigne en deux sur un deux-points ou entre
          // deux apostrophes droites (`ExercisePrompt`) : les jeux n'en ont pas.
          expect(game.prompt, game.prompt).not.toMatch(/:/);
          expect((game.prompt.match(/'/g) ?? []).length, game.prompt).toBeLessThanOrEqual(1);
          expect(game.hints).toHaveLength(3);
          expect(game.answerKey.length).toBeGreaterThan(0);
          expect(gameOriginOf(game.payload)?.kind).toBe(kind);

          const exercise = { type: game.type, payload: game.payload };
          expect(verifyAnswer(exercise, rightAnswer(game.type, game.payload)), `${kind} ${klass} p${palierIndex}`).toBe(true);
          expect(verifyAnswer(exercise, "[]")).toBe(false);
          expect(verifyAnswer(exercise, "pas du JSON")).toBe(false);

          const view = JSON.stringify(sanitizePayload(game.type, game.payload, "exo", "tentative"));
          expect(view).not.toContain("answers");
          expect(view).not.toContain("correctIndex");
          expect(view).not.toContain('"answer"');
          expect(view).not.toContain('"game"');
          if (game.type === "pixel-art") {
            const p = game.payload as unknown as PixelArtPayload;
            if (p.mode === "symmetry" || p.mode === "number") expect(view).not.toContain('"target"');
          }
        }
      }
    });
  }
});

describe("les frises", () => {
  it("ont des réponses parmi les options et autant de réponses que de cases vides", () => {
    for (const kind of ["frise-couleurs", "frise-formes", "frise-objets", "frise-rythme", "suite-nombres"] as const) {
      for (const klass of VISIBLE_CLASSES) {
        for (let palierIndex = 1; palierIndex <= 4; palierIndex++) {
          const [game] = generateGames([{ kind, count: 1 }], { klass, palierIndex, palierCount: 4, seed: `f:${klass}` });
          const p = game.payload as unknown as PatternPayload;
          const blanks = p.sequence.filter((t) => t === null).length;
          expect(blanks).toBe(p.answers.length);
          for (const answer of p.answers) expect(p.options).toContain(answer);
          expect(new Set(p.options).size).toBe(p.options.length);
        }
      }
    }
  });

  it("une suite de nombres avance d'un pas constant et reste dans les nombres de la classe", () => {
    for (let palierIndex = 1; palierIndex <= 4; palierIndex++) {
      const [game] = generateGames([{ kind: "suite-nombres", count: 1 }], {
        klass: "CI",
        palierIndex,
        palierCount: 4,
        seed: `n:${palierIndex}`,
      });
      const p = game.payload as unknown as PatternPayload;
      const values = p.sequence.map((t, i) => {
        const token = t ?? p.answers[p.sequence.slice(0, i).filter((x) => x === null).length];
        return Number(token.replace(/\s/g, ""));
      });
      const step = values[1] - values[0];
      expect(step).not.toBe(0);
      values.forEach((v, i) => {
        if (i > 0) expect(v - values[i - 1]).toBe(step);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(20);
      });
    }
  });

  it("écrit les grands nombres avec des espaces", () => {
    expect(formatNumber(12500)).toBe("12 500");
    expect(formatNumber(1000000)).toBe("1 000 000");
    expect(formatNumber(950)).toBe("950");
  });
});

describe("le dessin sur quadrillage", () => {
  it("la symétrie : la moitié donnée est la moitié gauche de la réponse, la réponse est symétrique", () => {
    for (const klass of VISIBLE_CLASSES) {
      for (let palierIndex = 1; palierIndex <= 4; palierIndex++) {
        const [game] = generateGames([{ kind: "pixel-symetrie", count: 1 }], {
          klass,
          palierIndex,
          palierCount: 4,
          seed: `s:${klass}:${palierIndex}`,
        });
        const p = game.payload as unknown as PixelArtPayload;
        expect(isMirrorSymmetric(p.target)).toBe(true);
        const half = p.width / 2;
        p.target.forEach((row, r) => {
          expect(p.given?.[r].slice(0, half)).toBe(row.slice(0, half));
          expect(p.given?.[r].slice(half)).toBe(".".repeat(half));
        });
        // La moitié donnée seule ne suffit pas.
        expect(verifyAnswer({ type: "pixel-art", payload: p }, JSON.stringify(p.given))).toBe(false);
      }
    }
  });

  it("le coloriage magique : chaque numéro désigne la couleur attendue", () => {
    const [game] = generateGames([{ kind: "coloriage-magique", count: 1 }], {
      klass: "CE2",
      palierIndex: 2,
      palierCount: 4,
      seed: "cm",
    });
    const p = game.payload as unknown as PixelArtPayload;
    p.target.forEach((row, r) => {
      row.split("").forEach((cell, c) => {
        const digit = Number(p.numbers?.[r][c]);
        if (cell === ".") expect(digit).toBe(0);
        else expect(p.palette[digit - 1].key).toBe(cell);
      });
    });
  });

  it("une case vide écrite autrement qu'un point reste une case vide", () => {
    const payload: PixelArtPayload = {
      mode: "copy",
      width: 3,
      height: 1,
      palette: [PAINTS.R],
      target: ["R.R"],
    };
    expect(verifyAnswer({ type: "pixel-art", payload }, JSON.stringify(["R R"]))).toBe(true);
    expect(verifyAnswer({ type: "pixel-art", payload }, JSON.stringify(["RRR"]))).toBe(false);
    expect(verifyAnswer({ type: "pixel-art", payload }, JSON.stringify(["R."]))).toBe(false);
  });

  it("le dessin de mémoire dure moins longtemps quand le palier avance", () => {
    const seconds = (palierIndex: number) => {
      const [game] = generateGames([{ kind: "pixel-memoire", count: 1 }], {
        klass: "CM1",
        palierIndex,
        palierCount: 4,
        seed: "m",
      });
      return (game.payload as unknown as PixelArtPayload).showSeconds ?? 0;
    };
    expect(seconds(4)).toBeLessThan(seconds(1));
  });

  it("deux dessins du même palier ne reprennent pas le même motif", () => {
    const games = generateGames([{ kind: "pixel-copie", count: 6 }], {
      klass: "CM2",
      palierIndex: 2,
      palierCount: 5,
      seed: "uniq",
    });
    const drawings = games.map((g) => JSON.stringify((g.payload as unknown as PixelArtPayload).target));
    expect(new Set(drawings).size).toBe(drawings.length);
  });
});

describe("l'écoute", () => {
  it("le plus aigu est bien la fréquence la plus haute", () => {
    for (let n = 0; n < 40; n++) {
      const [game] = generateGames([{ kind: "ecoute-hauteur", count: 1 }], {
        klass: "CE1",
        palierIndex: (n % 4) + 1,
        palierCount: 4,
        seed: `p${n}`,
      });
      const p = game.payload as unknown as ListenPayload;
      const freqs = p.clips.map((c) => c.notes[0].f);
      const askHigh = game.prompt.includes("aigu");
      const expected = askHigh ? Math.max(...freqs) : Math.min(...freqs);
      expect(freqs[p.correctIndex]).toBe(expected);
      expect(p.options).toHaveLength(p.clips.length);
    }
  });

  it("le nombre de coups annoncé est celui que l'on entend", () => {
    for (let n = 0; n < 30; n++) {
      const [game] = generateGames([{ kind: "ecoute-rythme", count: 1 }], {
        klass: "CP",
        palierIndex: (n % 3) + 1,
        palierCount: 3,
        seed: `r${n}`,
      });
      const p = game.payload as unknown as ListenPayload;
      const beats = p.clips[0].notes.filter((note) => note.k === "drum").length;
      expect(p.options[p.correctIndex]).toBe(String(beats));
    }
  });

  it("une mélodie qui monte monte, une mélodie qui descend descend", () => {
    for (let n = 0; n < 30; n++) {
      const [game] = generateGames([{ kind: "ecoute-melodie", count: 1 }], {
        klass: "CM1",
        palierIndex: (n % 5) + 1,
        palierCount: 5,
        seed: `m${n}`,
      });
      const p = game.payload as unknown as ListenPayload;
      const f = p.clips[0].notes.map((note) => note.f);
      const answer = p.options[p.correctIndex];
      if (answer === "Elle monte") f.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(f[i]));
      if (answer === "Elle descend") f.slice(1).forEach((x, i) => expect(x).toBeLessThan(f[i]));
      if (answer === "Elle monte puis descend") {
        const top = f.indexOf(Math.max(...f));
        expect(top).toBeGreaterThan(0);
        expect(top).toBeLessThan(f.length - 1);
      }
    }
  });

  it("le rythme écrit correspond aux silences entre les coups", () => {
    for (let n = 0; n < 20; n++) {
      const [game] = generateGames([{ kind: "ecoute-motif-rythmique", count: 1 }], {
        klass: "CM2",
        palierIndex: (n % 4) + 1,
        palierCount: 4,
        seed: `t${n}`,
      });
      const p = game.payload as unknown as ListenPayload;
      const notes = p.clips[0].notes;
      const gaps = notes.filter((note) => note.f === 0).map((note) => note.d);
      const written = p.options[p.correctIndex].split(" · ");
      // Le dernier coup n'a pas de silence qui le suit (0) : il n'est ni
      // long ni court à l'oreille, on vérifie les autres.
      written.slice(0, -1).forEach((beat, i) => {
        expect(beat === "TAM" ? gaps[i] > 400 : gaps[i] < 400).toBe(true);
      });
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });
});

describe("l'atelier des couleurs", () => {
  it("connaît les mélanges de l'école, dans les deux sens", () => {
    expect(mixOf("rouge", "jaune")).toBe("orange");
    expect(mixOf("bleu", "jaune")).toBe("vert");
    expect(mixOf("bleu", "rouge")).toBe("violet");
    expect(mixOf("rouge", "vert")).toBeNull();
  });

  it("un mélange inverse accepte les deux pots dans n'importe quel ordre", () => {
    for (let n = 0; n < 20; n++) {
      const [game] = generateGames([{ kind: "couleurs-melange-inverse", count: 1 }], {
        klass: "CE2",
        palierIndex: (n % 4) + 1,
        palierCount: 4,
        seed: `c${n}`,
      });
      const p = game.payload as unknown as ColorMixPayload;
      const [a, b] = p.answer;
      expect(mixOf(a, b)).toBe(p.target?.name);
      const exercise = { type: "color-mix", payload: p };
      expect(verifyAnswer(exercise, JSON.stringify([b, a]))).toBe(true);
      expect(verifyAnswer(exercise, JSON.stringify([a, a]))).toBe(false);
      for (const name of p.answer) expect(p.choices.map((c) => c.name)).toContain(name);
    }
  });

  it("le résultat proposé parmi les pots est bien celui du mélange", () => {
    for (let n = 0; n < 20; n++) {
      const [game] = generateGames([{ kind: "couleurs-melange", count: 1 }], {
        klass: "CP",
        palierIndex: (n % 3) + 1,
        palierCount: 3,
        seed: `r${n}`,
      });
      const p = game.payload as unknown as ColorMixPayload;
      expect(mixOf(p.given![0].name, p.given![1].name)).toBe(p.answer[0]);
      expect(p.choices.map((c) => c.name)).toContain(p.answer[0]);
    }
  });

  it("chaque mélange du catalogue a ses deux pots dans la palette", () => {
    for (const mix of MIXES) {
      expect(mix.a).not.toBe(mix.b);
    }
  });
});

describe("la fabrique", () => {
  it("la même graine refait les mêmes exercices, une autre graine en fait d'autres", () => {
    const opts = { klass: "CE1" as const, palierIndex: 2, palierCount: 4, seed: "graine" };
    const specs = [
      { kind: "frise-couleurs" as const, count: 2 },
      { kind: "pixel-copie" as const, count: 2 },
    ];
    expect(generateGames(specs, opts)).toEqual(generateGames(specs, opts));
    expect(JSON.stringify(generateGames(specs, { ...opts, seed: "autre" }))).not.toBe(
      JSON.stringify(generateGames(specs, opts)),
    );
  });

  it("ne dépasse jamais un palier de dix exercices et ignore un jeu inconnu", () => {
    const specs = [
      { kind: "frise-couleurs" as const, count: 8 },
      { kind: "ecoute-hauteur" as const, count: 8 },
      { kind: "jeu-disparu" as GameKind, count: 3 },
    ];
    expect(gameCount(specs)).toBe(10);
    expect(generateGames(specs, { klass: "CI", palierIndex: 1, palierCount: 3, seed: "x" })).toHaveLength(10);
  });

  it("refait une variation du même jeu, au même niveau", () => {
    const variation = regenerateGame({ kind: "pixel-symetrie", level: 3 }, "CM1", "variation");
    expect(variation?.type).toBe("pixel-art");
    expect(gameOriginOf(variation?.payload)).toEqual({ kind: "pixel-symetrie", level: 3 });
    expect(regenerateGame(null, "CM1", "x")).toBeNull();
    expect(regenerateGame({ kind: "inconnu", level: 1 }, "CM1", "x")).toBeNull();
  });

  it("mêle les jeux aux exercices du modèle sans changer l'ordre de chaque liste", () => {
    const merged = interleave(["a1", "a2", "a3", "a4", "a5", "a6"], ["j1", "j2", "j3", "j4"]);
    expect(merged).toHaveLength(10);
    expect(merged.filter((x) => x.startsWith("a"))).toEqual(["a1", "a2", "a3", "a4", "a5", "a6"]);
    expect(merged.filter((x) => x.startsWith("j"))).toEqual(["j1", "j2", "j3", "j4"]);
    // Les jeux ne s'agglutinent pas à la fin.
    expect(merged.slice(0, 5).some((x) => x.startsWith("j"))).toBe(true);
    expect(interleave([], ["j1"])).toEqual(["j1"]);
  });
});

describe("la réponse montrée à l'enfant après cinq essais", () => {
  it("se lit pour une frise, une couleur, une écoute et une phrase à trous, jamais pour un dessin", () => {
    const [frise] = generateGames([{ kind: "frise-couleurs", count: 1 }], {
      klass: "CI",
      palierIndex: 1,
      palierCount: 3,
      seed: "a",
    });
    expect(correctAnswerText(frise)).toBe(frise.answerKey);
    const [dessin] = generateGames([{ kind: "pixel-copie", count: 1 }], {
      klass: "CI",
      palierIndex: 1,
      palierCount: 3,
      seed: "a",
    });
    expect(correctAnswerText(dessin)).toBeNull();
    expect(
      correctAnswerText({
        type: "fill-blank",
        payload: {
          text: "Hier, Modou ___ au marché et Awa ___ des mangues.",
          blanks: [
            { options: ["est allé", "va"], answer: "est allé" },
            { options: ["a acheté", "achète"], answer: "a acheté" },
          ],
        },
      }),
    ).toBe("Hier, Modou est allé au marché et Awa a acheté des mangues.");
  });
});

describe("la phrase à trous", () => {
  const exercise = {
    type: "fill-blank",
    payload: {
      text: "Le chat ___ du lait. Il ___ content.",
      blanks: [
        { options: ["boit", "bois", "boivent"], answer: "boit" },
        { options: ["est", "et", "ai"], answer: "est" },
      ],
    },
  };

  it("juge chaque trou, dans l'ordre", () => {
    expect(verifyAnswer(exercise, JSON.stringify(["boit", "est"]))).toBe(true);
    expect(verifyAnswer(exercise, JSON.stringify([" boit ", "est"]))).toBe(true);
    expect(verifyAnswer(exercise, JSON.stringify(["est", "boit"]))).toBe(false);
    expect(verifyAnswer(exercise, JSON.stringify(["boit"]))).toBe(false);
    expect(verifyAnswer(exercise, JSON.stringify(["boit", "et"]))).toBe(false);
  });

  it("l'apostrophe typographique vaut l'apostrophe droite", () => {
    const apostrophe = {
      type: "fill-blank",
      payload: { text: "___ arbre", blanks: [{ options: ["l'", "le"], answer: "l'" }] },
    };
    expect(verifyAnswer(apostrophe, JSON.stringify(["l’"]))).toBe(true);
  });

  it("montre les mots mélangés, sans la bonne réponse", () => {
    const view = sanitizePayload("fill-blank", exercise.payload, "e1", "t1") as {
      text: string;
      blanks: { options: string[] }[];
    };
    expect(view.text).toBe(exercise.payload.text);
    expect(view.blanks).toHaveLength(2);
    expect([...view.blanks[0].options].sort()).toEqual(["boit", "bois", "boivent"].sort());
    expect(JSON.stringify(view)).not.toContain("answer");
  });
});
