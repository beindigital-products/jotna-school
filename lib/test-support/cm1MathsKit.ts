import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "@/convex/paliers/exerciseAudit";
import { GAME_KINDS, gameOriginOf, generateGames, regenerateGame, type GameKind } from "@/convex/paliers/games";
import { gameLevel, makeContext, type GameLevel } from "@/convex/paliers/games/shared";
import { topicUsesModel } from "@/convex/paliers/pregen";
import { allProgrammeEntries } from "@/convex/programme";
import { PALIER_SIZE } from "@/convex/paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 120_000 });

/**
 * LE MOTEUR DES TESTS DES MATHÉMATIQUES DU CM1 (`nombresCm1.ts`, `divisibiliteCm1.ts`, `divisionCm1.ts`, `fractionsCm1.ts`, `decimauxCm1.ts`).
 *
 * Ces gabarits CALCULENT leur réponse : il n'y a pas de table de faits à comparer. Chaque fichier de test fournit donc, pour chaque gabarit, une
 * VÉRIFICATION (`Check`) qui lit l'énoncé et les tuiles, RECALCULE la bonne réponse avec sa propre arithmétique (écrite à part des sources) et
 * rend `null` quand tout concorde, sinon la raison. Le moteur rejoue chaque gabarit à chacun des cinq paliers, abîme la bonne réponse d'un exercice
 * juste pour voir que la vérification la voit, applique les règles communes (énoncé, tuiles, indices, contrôleur, variété) et teste les
 * thématiques du programme (dix places, aucun modèle, dix exercices distincts par palier, reprise d'un exercice raté).
 */

export type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
export type Check = (exo: Exo) => string | null;

export const optionsOf = (exo: Exo) => exo.payload.options as string[];
export const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
export const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
export const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
export const zonesOf = (exo: Exo) => exo.payload.zones as string[];
export const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
export const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
export const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
export const textOf = (exo: Exo) => String(exo.payload.text);
export const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
export const levelOf = (exo: Exo) => (exo.payload.game as { level: GameLevel }).level;

export const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
export const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

export const ok = (condition: boolean, message: string) => (condition ? null : message);
export const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;

/** Un nombre écrit à l'école : les milliers séparés par une espace. */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** Le nombre d'un texte : « 12 345 » vaut 12345. */
export const num = (text: string) => Number(text.replace(/ /g, ""));
export const NUMBER = String.raw`\d+(?: \d{3})*`;

/** Tous les textes qu'un enfant lit dans un exercice, hors énoncé : indices, choix, trou, tuiles, cases. */
export function textsOf(exo: Exo): string[] {
  const out = [...exo.hints];
  if (exo.payload.options) out.push(...optionsOf(exo));
  if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
  if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
  if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
  if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
  return out;
}

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. */
export function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      payload.acceptedAnswers = ["999999999"];
      return { ...copy(), answerKey: "999999999" };
    }
    default:
      return null;
  }
}

export type MathsTestConfig = {
  /** « des grands nombres du CM1 » : la fin des titres. */
  label: string;
  checks: Record<string, Check>;
  /** Les gabarits de chaque thématique, dans l'ordre de la fiche. */
  topicKinds: Record<string, readonly string[]>;
  /** Aucun nombre au-dessus de `max` dans un énoncé, un choix, une tuile ou un indice des gabarits dont le nom commence par `prefix`. */
  caps?: readonly { prefix: string; max: number }[];
  /** Ce qu'un exercice demande, quand deux exercices d'un même palier ne doivent pas le demander deux fois (une table, une division) ; `null` : rien à suivre. */
  asked?: (exo: Exo) => string[] | null;
};

export function defineMathsTests(cfg: MathsTestConfig) {
  const KLASS = "CM1" as const;
  const COUNT = 5;
  const PALIERS = [1, 2, 3, 4, 5];
  const CHECKS = cfg.checks;
  const KINDS = Object.keys(CHECKS) as GameKind[];
  const TOPIC_KEYS = Object.keys(cfg.topicKinds);
  const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;

  const draws = PALIERS.flatMap((palier) => Array.from({ length: 60 }, (_, n) => ({ palier, level: gameLevel(palier, COUNT), seed: `cm1m:${palier}:${n}` })));
  const make = (kind: GameKind, d: (typeof draws)[number]) =>
    GAME_KINDS[kind].make(makeContext(KLASS, d.level, `${kind}:${d.seed}`, new Set(), undefined, undefined, { index: d.palier, count: COUNT })) as unknown as Exo;
  const audit = (exo: Exo, kind: string) =>
    auditExercise({ type: GAME_KINDS[kind as GameKind].type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: KLASS, subject: "Mathématiques" });

  describe(`chaque gabarit ${cfg.label} a sa vérification`, () => {
    it("couvre exactement les gabarits des thématiques, tous inscrits au registre", () => {
      expect([...new Set(Object.values(cfg.topicKinds).flat())].sort()).toEqual([...KINDS].sort());
      for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
    });
  });

  describe(`les gabarits ${cfg.label} recalculent juste, depuis une arithmétique écrite à part`, () => {
    for (const kind of KINDS) {
      it(`${kind} : la bonne réponse se lit dans la règle, à chacun des cinq paliers`, () => {
        for (const d of draws) {
          const exo = make(kind, d);
          expect(CHECKS[kind](exo), `${kind} palier ${d.palier} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
        }
      });
    }
  });

  describe(`les vérifications ${cfg.label} voient une bonne réponse abîmée`, () => {
    for (const kind of KINDS) {
      it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
        let mutated = 0;
        for (const d of draws.filter((_, i) => i % 3 === 0)) {
          const exo = make(kind, d);
          const broken = mutate(kind, exo);
          if (!broken) continue;
          mutated += 1;
          expect(CHECKS[kind](broken), `${kind} palier ${d.palier} : ${exo.prompt}`).not.toBeNull();
        }
        expect(mutated, kind).toBeGreaterThan(0);
      });
    }
  });

  describe(`tous les gabarits ${cfg.label}`, () => {
    const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 2 === 0).map((d) => ({ kind, exo: make(kind, d) })));

    it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
      for (const { kind, exo } of exos) {
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      }
    });

    it("n'écrivent qu'un trou et au plus une apostrophe par phrase à trou", () => {
      for (const { kind, exo } of exos.filter(({ exo: e }) => e.payload.blanks)) {
        expect(apostrophes(textOf(exo)), `${kind} : ${textOf(exo)}`).toBeLessThanOrEqual(1);
        expect((textOf(exo).match(/___/g) ?? []).length, `${kind} : ${textOf(exo)}`).toBe(1);
      }
    });

    it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun sélecteur de variation", () => {
      const selector = String.fromCodePoint(0xfe0f);
      for (const { kind, exo } of exos) {
        expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
        for (const text of textsOf(exo)) {
          expect(text.includes(selector), `${kind} : « ${text} »`).toBe(false);
          expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        }
      }
    });

    it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
      for (const { kind, exo } of exos) {
        if (exo.payload.options) {
          expect(new Set(optionsOf(exo)).size, `${kind} : ${exo.prompt}`).toBe(optionsOf(exo).length);
          expect(optionsOf(exo).length, `${kind} : ${exo.prompt}`).toBe(3);
        }
        if (exo.payload.blanks) {
          const { options, answer } = blankOf(exo);
          expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
          expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
          expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
        }
        if (exo.payload.items) {
          const items = itemsOf(exo);
          expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        }
        if (exo.payload.pairs) {
          const pairs = pairsOf(exo);
          expect(new Set(pairs.map((pair) => pair.left)).size, kind).toBe(pairs.length);
          expect(new Set(pairs.map((pair) => pair.right)).size, kind).toBe(pairs.length);
        }
        if (exo.payload.correctSequence) expect(new Set(sequenceOf(exo)).size, kind).toBe(sequenceOf(exo).length);
      }
    });

    it("n'écrivent aucun chiffre dans un indice : un résultat se lirait dedans", () => {
      for (const { kind, exo } of exos) for (const hint of exo.hints) expect(hint, `${kind} : « ${hint} »`).not.toMatch(/\d/);
    });

    it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
      for (const kind of KINDS) {
        const a = GAME_KINDS[kind].make(makeContext(KLASS, 3, "graine", new Set(), undefined, undefined, { index: 4, count: COUNT }));
        const b = GAME_KINDS[kind].make(makeContext(KLASS, 3, "graine", new Set(), undefined, undefined, { index: 4, count: COUNT }));
        expect(a).toEqual(b);
        expect(a.hints).toHaveLength(3);
        expect(new Set(a.hints).size, kind).toBe(3);
      }
    });

    it("passent le contrôleur au CM1 sans aucun défaut, avertissement compris, à tous les paliers", () => {
      for (const { kind, exo } of exos) expect(audit(exo, kind), `${kind} : ${exo.prompt} ${exo.payload.text ?? ""}`).toEqual([]);
    });

    it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
      for (const { kind, exo } of exos) {
        const origin = exo.payload.game as { kind: string; level: number };
        expect(origin.kind, kind).toBe(kind);
        expect([1, 2, 3, 4], kind).toContain(origin.level);
      }
    });

    it("n'écrivent un nombre de plus de trois chiffres qu'avec des espaces entre les milliers", () => {
      for (const { kind, exo } of exos) for (const text of [exo.prompt, ...textsOf(exo)]) expect(/\d{4,}/.test(text), `${kind} : « ${text} »`).toBe(false);
    });

    for (const { prefix, max } of cfg.caps ?? []) {
      it(`ne dépassent jamais ${fmt(max)} (${prefix}…), ni dans un énoncé, ni dans un choix, ni dans un indice`, () => {
        for (const { kind, exo } of exos.filter(({ kind: k }) => k.startsWith(prefix))) {
          for (const text of [exo.prompt, ...textsOf(exo)]) for (const found of text.match(new RegExp(NUMBER, "g")) ?? []) expect(num(found), `${kind} : « ${text} »`).toBeLessThanOrEqual(max);
        }
      });
    }
  });

  describe(`les thématiques ${cfg.label}`, () => {
    it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
      for (const key of TOPIC_KEYS) {
        const specs = topicOf(key).games ?? [];
        expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
        expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...cfg.topicKinds[key]].sort());
        for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(topicUsesModel(key), key).toBe(false);
      }
    });

    it("sont celles du CM1, à cinq paliers, et gardent leur clé", () => {
      for (const key of TOPIC_KEYS) {
        expect(entryOf(key).klass, key).toBe(KLASS);
        expect(entryOf(key).subject.name, key).toBe("Mathématiques");
        expect(topicOf(key).palierCount, key).toBeUndefined();
      }
    });

    it("fabriquent des paliers entiers, de dix exercices distincts, de cinq types au moins, qui passent le contrôleur et la règle, aux cinq paliers", () => {
      for (const key of TOPIC_KEYS) {
        for (let n = 0; n < 30; n++) {
          for (const palierIndex of PALIERS) {
            const paliers = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `${key}:${n}:${palierIndex}` });
            expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
            const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
            expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
            expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(5);
            const askedInPalier: string[] = [];
            for (const game of paliers) {
              const kind = (game.payload.game as { kind: string }).kind;
              const exo = game as unknown as Exo;
              expect(audit(exo, kind), `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
              expect(CHECKS[kind](exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
              askedInPalier.push(...(cfg.asked?.(exo) ?? []));
            }
            expect(new Set(askedInPalier).size, `${key} palier ${palierIndex} : ${askedInPalier.join(" ; ")}`).toBe(askedInPalier.length);
          }
        }
      }
    });

    it("ne reposent pas, d'un palier à l'autre, plus d'une question sur vingt", () => {
      for (const key of TOPIC_KEYS) {
        let questions = 0;
        let repeats = 0;
        for (let n = 0; n < 200; n++) {
          const seen = new Set<string>();
          for (const palierIndex of PALIERS) {
            const paliers = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `variete:${key}:${n}:${palierIndex}` });
            const here = new Set<string>();
            for (const game of paliers) {
              const id = `${(game.payload.game as { kind: string }).kind}|${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`;
              questions += 1;
              if (seen.has(id)) repeats += 1;
              here.add(id);
            }
            for (const id of here) seen.add(id);
          }
        }
        expect(repeats / questions, `${key} : ${repeats} questions revues sur ${questions}`).toBeLessThan(0.05);
      }
    });

    it("refont chaque exercice raté par le code, à chaque niveau, avec une vérification juste", () => {
      for (const key of TOPIC_KEYS) {
        for (const spec of topicOf(key).games ?? []) {
          const kind = spec.kind as GameKind;
          for (const level of [1, 2, 3, 4]) {
            for (let n = 0; n < 20; n++) {
              const origin = { kind, level };
              const again = regenerateGame(origin, KLASS, `reprise:${key}:${kind}:${level}:${n}`);
              expect(again, `${kind} niveau ${level}`).not.toBeNull();
              expect(again!.type, kind).toBe(GAME_KINDS[kind].type);
              expect(gameOriginOf(again!.payload), kind).toEqual(origin);
              expect(CHECKS[kind](again as unknown as Exo), `${kind} niveau ${level} : ${again!.prompt}`).toBeNull();
            }
          }
        }
      }
    });
  });
}
