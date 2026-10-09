import { describe, expect, it } from "vitest";
import {
  PROGRAMME,
  allProgrammeEntries,
  normalizeName,
  programmeTopic,
} from "../programme";
import { VISIBLE_CLASSES } from "../curriculum";
import { GAME_KINDS, gameCount } from "../paliers/games";
import { isValidPalierCount } from "../palierRules";
import { PALIER_SIZE } from "../paliers/scoring";

describe("le programme CI → CM2", () => {
  it("compte les sept matières demandées, sans l'éducation physique", () => {
    expect(PROGRAMME.map((s) => s.name)).toEqual([
      "Français",
      "Mathématiques",
      "Éveil scientifique",
      "Histoire",
      "Géographie",
      "Instruction civique",
      "Éducation artistique",
    ]);
  });

  it("donne à chaque matière des thématiques dans chacune des six classes", () => {
    for (const subject of PROGRAMME) {
      for (const klass of VISIBLE_CLASSES) {
        const topics = subject.classes[klass];
        expect(topics.length, `${subject.name} ${klass}`).toBeGreaterThanOrEqual(3);
        expect(topics.length, `${subject.name} ${klass}`).toBeLessThanOrEqual(8);
      }
    }
  });

  it("a des clés de thématique uniques, stables et lisibles", () => {
    const keys = allProgrammeEntries().map((e) => e.topic.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z]{2}-(ci|cp|ce1|ce2|cm1|cm2)-[a-z0-9-]+$/);
  });

  it("range chaque clé dans la classe qu'elle annonce", () => {
    for (const entry of allProgrammeEntries()) {
      expect(entry.topic.key.split("-")[1]).toBe(entry.klass.toLowerCase());
    }
  });

  it("n'a pas deux thématiques du même nom dans une même classe d'une matière", () => {
    for (const subject of PROGRAMME) {
      for (const klass of VISIBLE_CLASSES) {
        const names = subject.classes[klass].map((t) => normalizeName(t.name));
        expect(new Set(names).size, `${subject.name} ${klass}`).toBe(names.length);
      }
    }
  });

  it("décrit chaque thématique assez pour guider la génération", () => {
    for (const { topic } of allProgrammeEntries()) {
      expect(topic.name.length, topic.key).toBeLessThanOrEqual(45);
      expect(topic.description.length, topic.key).toBeGreaterThanOrEqual(80);
      if (topic.palierCount !== undefined) expect(isValidPalierCount(topic.palierCount)).toBe(true);
    }
  });

  it("ne demande que des jeux qui existent, jamais plus qu'un palier", () => {
    for (const { topic } of allProgrammeEntries()) {
      for (const spec of topic.games ?? []) {
        expect(Object.keys(GAME_KINDS), `${topic.key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.count).toBeGreaterThan(0);
      }
      expect(gameCount(topic.games)).toBeLessThanOrEqual(PALIER_SIZE);
    }
  });

  it("met des jeux dans chaque classe d'éducation artistique, et des thématiques tout en jeux pour l'écoute", () => {
    const arts = PROGRAMME.find((s) => s.key === "education-artistique")!;
    for (const klass of VISIBLE_CLASSES) {
      expect(arts.classes[klass].some((t) => (t.games?.length ?? 0) > 0), klass).toBe(true);
    }
    expect(gameCount(programmeTopic("ar-ci-grave-aigu")?.topic.games)).toBe(PALIER_SIZE);
  });

  it("retrouve une thématique par sa clé, et rien pour une clé inconnue", () => {
    expect(programmeTopic("hi-cm2-empires")?.klass).toBe("CM2");
    expect(programmeTopic("hi-cm2-empires")?.subject.name).toBe("Histoire");
    expect(programmeTopic("inconnue")).toBeNull();
    expect(programmeTopic(undefined)).toBeNull();
  });

  it("reconnaît un nom de matière écrit autrement", () => {
    expect(normalizeName("Éducation civique")).toBe(normalizeName("education  civique"));
    expect(normalizeName("Histoire-Géographie")).toBe("histoire geographie");
  });

  it("n'utilise que des alias qui n'appartiennent qu'à une seule matière", () => {
    const owner = new Map<string, string>();
    for (const subject of PROGRAMME) {
      for (const name of [subject.name, ...subject.aliases]) {
        const key = normalizeName(name);
        expect(owner.get(key) ?? subject.key, name).toBe(subject.key);
        owner.set(key, subject.key);
      }
    }
  });
});
