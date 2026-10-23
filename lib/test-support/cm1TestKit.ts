import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "@/convex/paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "@/convex/paliers/games";
import { SHORT_OF_CHOICES } from "@/convex/paliers/games/cm1Faits";
import { gameLevel, makeContext, type GameLevel } from "@/convex/paliers/games/shared";
import { topicUsesModel } from "@/convex/paliers/pregen";
import { allProgrammeEntries } from "@/convex/programme";
import { PALIER_SIZE } from "@/convex/paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 120_000 });

/**
 * LE MOTEUR DES TESTS DES GABARITS DU CM1 ET DU CM2 (`cm1Faits.ts`, `ce2Outils.ts`).
 *
 * Un fichier de test fournit ses TABLES, écrites à part des sources : pour chaque réponse, ce qu'un énoncé doit contenir pour l'appeler
 * (`assoc`) ; les réponses aussi justes qui ne se proposent jamais ensemble (`twins`) ; les suites (`chains`), les paires justes
 * (`pairs`), ce qui va dans chaque case (`members`). Le moteur rejoue les gabarits à chacun des paliers, vérifie chaque exercice contre
 * ces tables, abîme la bonne réponse pour voir que les vérifications la voient, applique les règles communes (énoncé, indices, contrôleur)
 * et teste les thématiques du programme. Un fait faux, une réponse échangée, un mauvais choix aussi juste font échouer le fichier.
 */

const VS16 = String.fromCodePoint(0xfe0f);

export const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ARTICLES = ["de l ", "de la ", "du ", "des ", "a l ", "a la ", "au ", "aux ", "l ", "le ", "la ", "les ", "un ", "une "];
/** Une réponse sans son article, repliée : « Le feu » et « feu » sont la même entrée. */
export const norm = (text: string) => {
  const folded = fold(text);
  const article = ARTICLES.find((prefix) => folded.startsWith(prefix));
  return article ? folded.slice(article.length) : folded;
};
const tokens = (text: string) => ` ${fold(text)} `;
/** Un fragment est une suite de mots entiers ; `*` à la fin laisse le dernier mot finir comme il veut. */
const has = (stem: string, fragment: string) => {
  const prefix = fragment.endsWith("*");
  const wanted = fold(prefix ? fragment.slice(0, -1) : fragment);
  return prefix ? tokens(stem).includes(` ${wanted}`) : tokens(stem).includes(` ${wanted} `);
};

export type TemplateTestConfig = {
  /** « de l'histoire et de la géographie du CM1 » : la fin des titres. */
  label: string;
  klass: "CM1" | "CM2";
  /** Le nombre de paliers de ces thématiques (cinq au CM1 et au CM2). */
  count: number;
  topicKinds: Record<string, readonly string[]>;
  expectedKinds: number;
  topicCount: number;
  /** Les noms des gabarits de ces thématiques dans le registre. */
  kindPattern: RegExp;
  assoc: Record<string, string[]>;
  twins: readonly (readonly string[])[];
  /** Les énoncés qui demandent « lequel de ces noms » : aucun autre nom du groupe ne s'y propose. */
  listStem: RegExp;
  chains: { when: RegExp; chain: string[] }[];
  pairs: readonly (readonly [string, string])[];
  members: Record<string, string[]>;
  /** Les couples de cases de glissé : aucune étiquette n'est dans les deux. */
  zonePairs: readonly (readonly [string, string])[];
};

export function defineTemplateTests(cfg: TemplateTestConfig) {
  const KLASS = cfg.klass;
  const COUNT = cfg.count;
  const PALIERS = Array.from({ length: COUNT }, (_, i) => i + 1);
  const TOPIC_KINDS = cfg.topicKinds;
  const ASSOC = cfg.assoc;
  const TWINS = cfg.twins;
  const LIST_STEM = cfg.listStem;
  const CHAINS = cfg.chains;
  const PAIRS = new Set(cfg.pairs.map(([left, right]) => `${norm(left)}|${norm(right)}`));
  const MEMBER_SET = new Map(Object.entries(cfg.members).map(([zone, items]) => [norm(zone), new Set(items.map(norm))]));

  const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
  const KINDS = Object.values(TOPIC_KINDS).flat() as GameKind[];
  const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
  const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
  const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

const draws = PALIERS.flatMap((palier) => Array.from({ length: 40 }, (_, n) => ({ palier, level: gameLevel(palier, COUNT) as GameLevel, seed: `cm1hg:${palier}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) =>
  GAME_KINDS[kind].make(makeContext(KLASS, d.level, `${kind}:${d.seed}`, new Set(), undefined, undefined, { index: d.palier, count: COUNT }));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];


const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);

type Check = (exo: Exo) => string | null;

// ===========================================================================
// LES TABLES, ÉCRITES À PART

/** Une question, une phrase à trou ou une réponse à écrire : la bonne réponse se lit dans l'énoncé, aucun mauvais choix n'est aussi juste. */
function checkAssociation(stem: string, right: string, wrongs: readonly string[]): string | null {
  for (const twins of TWINS) {
    if (twins.length > 2 && !LIST_STEM.test(fold(stem))) continue;
    if (twins.includes(norm(right)) && wrongs.some((wrong) => twins.includes(norm(wrong)))) return `une réponse aussi juste est proposée en mauvais choix : ${[right, ...wrongs].join(" / ")} (${stem})`;
  }
  const needs = ASSOC[norm(right)];
  if (needs === undefined) return `« ${right} » n'est pas dans la table`;
  if (!needs.some((fragment) => has(stem, fragment))) return `rien dans l'énoncé n'appelle « ${right} » : ${stem}`;
  for (const wrong of wrongs) {
    const own = ASSOC[norm(wrong)];
    if (own === undefined) return `le mauvais choix « ${wrong} » n'est pas dans la table`;
    for (const fragment of own) {
      if (!needs.includes(fragment) && has(stem, fragment)) return `le mauvais choix « ${wrong} » serait appelé par « ${fragment} » : ${stem}`;
    }
  }
  return null;
}

const checkQuestion: Check = (exo) => checkAssociation(exo.prompt, rightOption(exo), optionsOf(exo).filter((option) => option !== rightOption(exo)));
const checkGap: Check = (exo) => {
  const blank = blankOf(exo);
  return checkAssociation(`${exo.prompt} ${textOf(exo)}`, blank.answer, blank.options.filter((option) => option !== blank.answer));
};
const checkWrite: Check = (exo) => {
  const accepted = acceptedOf(exo);
  if (accepted[0] !== exo.answerKey) return `la première écriture admise n'est pas la réponse : ${exo.prompt}`;
  return checkAssociation(exo.prompt, accepted[0], []);
};

const checkOrder: Check = (exo) => {
  const sequence = sequenceOf(exo);
  const prompt = fold(exo.prompt);
  const chains = CHAINS.filter((entry) => entry.when.test(prompt));
  if (chains.length === 0) return `aucune suite ne correspond à l'énoncé : ${exo.prompt}`;
  const valid = chains.some(({ chain }) => {
    const ranks = sequence.map((tile) => chain.map(norm).indexOf(norm(tile)));
    return ranks.every((rank) => rank >= 0) && ranks.every((rank, i) => i === 0 || rank > ranks[i - 1]);
  });
  return valid ? null : `l'ordre est faux : ${exo.prompt} → ${sequence.join(" / ")}`;
};

const checkLink: Check = (exo) => {
  for (const pair of pairsOf(exo)) {
    if (!PAIRS.has(`${norm(pair.left)}|${norm(pair.right)}`)) return `paire inconnue : ${pair.left} ~ ${pair.right} (${exo.prompt})`;
  }
  return null;
};

const checkSort: Check = (exo) => {
  const [first, second] = zonesOf(exo);
  const a = MEMBER_SET.get(norm(first));
  const b = MEMBER_SET.get(norm(second));
  if (!a || !b) return `case inconnue : ${first} / ${second}`;
  for (const item of itemsOf(exo)) {
    const mine = norm(item.correctZone) === norm(first) ? a : b;
    const other = mine === a ? b : a;
    if (!mine.has(norm(item.text))) return `« ${item.text} » ne va pas dans « ${item.correctZone} »`;
    if (other.has(norm(item.text))) return `« ${item.text} » irait aussi dans l'autre case (${first} / ${second})`;
  }
  return null;
};

const CHECK_OF_TYPE: Record<string, Check> = { qcm: checkQuestion, "fill-blank": checkGap, "short-answer": checkWrite, order: checkOrder, match: checkLink, "drag-drop": checkSort };
const checkOf = (kind: string): Check => CHECK_OF_TYPE[GAME_KINDS[kind as GameKind].type];


describe(`chaque gabarit ${cfg.label} a sa vérification`, () => {
  it(`couvre exactement les ${cfg.expectedKinds} gabarits, tous rangés dans une thématique`, () => {
    expect(KINDS).toHaveLength(cfg.expectedKinds);
    expect(new Set(KINDS).size).toBe(cfg.expectedKinds);
    for (const kind of KINDS) {
      expect(Object.keys(GAME_KINDS), kind).toContain(kind);
      expect(CHECK_OF_TYPE[GAME_KINDS[kind].type], kind).toBeDefined();
    }
    const registered = Object.keys(GAME_KINDS).filter((kind) => cfg.kindPattern.test(kind));
    expect(registered.sort()).toEqual([...KINDS].sort());
  });

  it("n'a aucun fait sans deux mauvais choix", () => {
    expect(SHORT_OF_CHOICES).toEqual([]);
  });
});

describe(`les gabarits ${cfg.label} recalculent juste, depuis des tables écrites à part`, () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la table, à chacun des cinq paliers`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(checkOf(kind)(exo), `${kind} palier ${d.palier} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
      }
    });
  }
});

describe("les tables elles-mêmes sont saines", () => {
  it("n'ont pas de fragment vide, ni deux fois le même", () => {
    for (const [answer, fragments] of Object.entries(ASSOC)) {
      for (const fragment of fragments) expect(fold(fragment.replace(/\*$/, "")).length, `${answer} : « ${fragment} »`).toBeGreaterThan(2);
      expect(new Set(fragments).size, answer).toBe(fragments.length);
    }
  });

  it("rangent chaque suite sans doublon, de trois tuiles au moins", () => {
    for (const { chain } of CHAINS) {
      expect(new Set(chain.map(norm)).size).toBe(chain.length);
      expect(chain.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("ne mettent aucune étiquette dans les deux cases d'un même glissé", () => {
    const pairs = cfg.zonePairs;
    for (const [a, b] of pairs) {
      const first = MEMBER_SET.get(norm(a))!;
      const second = MEMBER_SET.get(norm(b))!;
      for (const item of first) expect(second.has(item), `${a} / ${b} : ${item}`).toBe(false);
    }
  });
});


/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
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
      payload.acceptedAnswers = ["zzz"];
      return { ...copy(), answerKey: "zzz" };
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : la réponse abîmée est refusée à tous les tirages`, () => {
      for (const d of draws.filter((_, i) => i % 5 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        expect(broken, kind).not.toBeNull();
        expect(checkOf(kind)(broken as Exo), `${kind} : ${exo.prompt}`, ).not.toBeNull();
      }
    });
  }
});


// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe(`tous les gabarits ${cfg.label}`, () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 4 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      const stem = `${exo.prompt} ${exo.payload.text ?? ""}`;
      expect(stem, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(apostrophes(String(exo.payload.text ?? "")), `${kind} : ${stem}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      expect(wordCount(String(exo.payload.text ?? "")), `${kind} : ${stem}`).toBeLessThanOrEqual(28);
    }
  });

  it("écrivent les options d'une phrase à trou toutes de la même façon : toutes avec un article ou aucune, toutes avec une majuscule ou aucune", () => {
    const startsWithArticle = (option: string) => /^(le |la |les |l'|un |une |des |du |de l'|de la )/i.test(option);
    // Un sigle (TER, ASC) s'écrit en capitales par nature : il ne compte pas comme un nom propre.
    const startsWithCapital = (option: string) => /^\p{Lu}/u.test(option) && !/^[\p{Lu}]{2,}$/u.test(option);
    for (const { kind, exo } of exos) {
      if (GAME_KINDS[kind as GameKind].type !== "fill-blank") continue;
      const options = blankOf(exo).options;
      expect(new Set(options.map(startsWithArticle)).size, `${kind} : articles mêlés (${options.join(" / ")}) dans ${textOf(exo)}`).toBe(1);
      expect(new Set(options.map(startsWithCapital)).size, `${kind} : majuscules mêlées (${options.join(" / ")}) dans ${textOf(exo)}`).toBe(1);
    }
  });

  it("n'écrivent aucun émoji, ni sur une tuile, ni dans un indice, ni dans un énoncé", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      expect(exo.prompt.includes(VS16), kind).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes(VS16), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("écrivent les choix d'une phrase à trou comme la phrase les veut : aucun ne commence par un article en capitale", () => {
    for (const { kind, exo } of exos) {
      if (!exo.payload.blanks) continue;
      for (const option of blankOf(exo).options) expect(option, `${kind} : ${textOf(exo)}`).not.toMatch(/^(Le|La|Les|Un|Une|Des|Du)\s|^L'/);
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
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
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(pairs.length, kind).toBeGreaterThanOrEqual(3);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(...optionsOf(exo));
      if (exo.payload.blanks) answers.push(...blankOf(exo).options);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext(KLASS, 2, "graine", new Set(), undefined, undefined, { index: 3, count: COUNT }));
      const b = GAME_KINDS[kind].make(makeContext(KLASS, 2, "graine", new Set(), undefined, undefined, { index: 3, count: COUNT }));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur sans aucun défaut, à tous les paliers", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: KLASS,
        subject: subjectOfKind(kind),
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
    }
  });

  it("écrivent la bonne réponse d'un QCM ou d'un trou parmi les choix, et aucune réponse à écrire n'est vide", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) expect(optionsOf(exo), kind).toContain(exo.answerKey);
      if (exo.payload.blanks) expect(blankOf(exo).options, kind).toContain(blankOf(exo).answer);
      if (exo.payload.acceptedAnswers) {
        expect(acceptedOf(exo).length, kind).toBeGreaterThan(0);
        for (const answer of acceptedOf(exo)) expect(answer.trim(), kind).not.toBe("");
      }
    }
  });

  it("changent de lignes d'un palier à l'autre : la fenêtre suit la place du palier, pas le niveau (les paliers 2 et 3 sont tous deux de niveau 2)", () => {
    for (const kind of KINDS.filter((k) => /-(qcm|trou|ecrire)$/.test(k))) {
      const seen = (palier: number) =>
        new Set(
          Array.from({ length: 30 }, (_, n) => {
            const exo = GAME_KINDS[kind].make(makeContext(KLASS, gameLevel(palier, COUNT), `${kind}:fenetre:${palier}:${n}`, new Set(), undefined, undefined, { index: palier, count: COUNT })) as unknown as Exo;
            return `${exo.prompt}|${exo.payload.text ?? ""}|${exo.answerKey}`;
          }),
        );
      const two = seen(2);
      const three = seen(3);
      const common = [...two].filter((question) => three.has(question));
      expect(common.length, `${kind} : ${common.length} questions communes aux paliers 2 et 3`).toBeLessThan(Math.max(2, Math.ceil(two.size / 2)));
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe(`les thématiques ${cfg.label}`, () => {
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it(`sont celles du ${KLASS}, et n'ont changé ni leur clé ni leur nombre de paliers`, () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe(KLASS);
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(cfg.topicCount);
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 25; n++) {
        for (const palierIndex of PALIERS) {
          const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: KLASS,
              subject: entryOf(key).subject.name,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(checkOf(kind)(game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of PALIERS) {
        const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("ne reposent pas deux fois le même fait dans un palier, ni la même question d'un palier à l'autre plus de trois fois sur cent", () => {
    for (const key of TOPIC_KEYS) {
      let seen = 0;
      let repeated = 0;
      for (let n = 0; n < 40; n++) {
        const before = new Set<string>();
        for (const palierIndex of PALIERS) {
          const games = generateGames(topicOf(key).games ?? [], { klass: KLASS, palierIndex, palierCount: COUNT, seed: `variete:${key}:${n}:${palierIndex}` });
          const keys = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          for (const question of keys) {
            seen += 1;
            if (before.has(question)) repeated += 1;
          }
          keys.forEach((question) => before.add(question));
        }
      }
      expect((100 * repeated) / seen, `${key} : ${repeated} questions revues sur ${seen}`).toBeLessThan(3);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
      expect(typesOf(key).has("order" as never) || typesOf(key).has("match" as never), `${key} : ordre ou appariement`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, KLASS, `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
        expect(checkOf(spec.kind)(again as unknown as Exo), spec.kind).toBeNull();
      }
    }
  });
});


  return { make, draws, checkOf };
}
