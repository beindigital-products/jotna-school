import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORLD_SCENE_IDS, worldBackdropSrc, worldSceneIdFor, worldSceneIdForTopic, worldSceneSrc } from "../world-scenes";

const SCENE_DIR = join(process.cwd(), "public", "images", "world", "mondes");

describe("worldSceneIdFor", () => {
  it.each([
    ["Mathématiques", "maths"],
    ["Français", "francais"],
    ["Éveil scientifique", "sciences"],
    ["Sciences", "sciences"],
    ["Histoire", "histoire"],
    ["Histoire-Géographie", "histoire"],
    ["Géographie", "geographie"],
    ["Instruction civique", "civique"],
    ["EMC", "civique"],
    ["Éducation artistique", "arts"],
    ["Arts plastiques", "arts"],
    ["Éducation musicale", "arts"],
    ["Anglais", "anglais"],
  ])("%s a son monde %s", (name, id) => {
    expect(worldSceneIdFor(name)).toBe(id);
  });

  it("ne trouve rien pour un nom que personne n'a prévu", () => {
    expect(worldSceneIdFor("Jardinage")).toBeNull();
    expect(worldSceneIdFor("")).toBeNull();
    expect(worldSceneIdFor(undefined)).toBeNull();
  });

  it("donne le chemin du fichier", () => {
    expect(worldSceneSrc("Géographie")).toBe("/images/world/mondes/geographie.webp");
    expect(worldSceneSrc("Géographie", "lite")).toBe("/images/world/mondes/geographie-s.webp");
    expect(worldSceneSrc("Jardinage")).toBeNull();
  });
});

describe("les fichiers des mondes", () => {
  it("chaque identifiant a ses deux tailles, chaque fichier son identifiant", () => {
    for (const id of WORLD_SCENE_IDS) {
      expect(existsSync(join(SCENE_DIR, `${id}.webp`))).toBe(true);
      expect(existsSync(join(SCENE_DIR, `${id}-s.webp`))).toBe(true);
    }
    const files = readdirSync(SCENE_DIR)
      .filter((f) => f.endsWith(".webp") && !f.endsWith("-s.webp"))
      .map((f) => f.replace(/\.webp$/, ""))
      .sort();
    expect(files).toEqual([...WORLD_SCENE_IDS].sort());
  });
});

describe("worldSceneIdForTopic — le monde d'une thématique", () => {
  it.each([
    ["ma-ci-nombres-10", "maths"],
    ["fr-cp-syllabes", "francais"],
    ["sc-ce1-plantes", "sciences"],
    ["hi-cm1-empires", "histoire"],
    ["ge-ce2-senegal", "geographie"],
    ["ci-cp-vivre-ensemble", "civique"],
    ["ar-ci-couleurs", "arts"],
    ["an-cm2-family", "anglais"],
  ])("la clé du programme %s mène au monde %s", (programmeKey, world) => {
    expect(worldSceneIdForTopic({ programmeKey })).toBe(world);
  });

  it("sans clé du programme, le nom de la matière décide", () => {
    expect(worldSceneIdForTopic({ programmeKey: null, subjectName: "Éveil scientifique" })).toBe("sciences");
    expect(worldSceneIdForTopic({ subjectName: "Mathématiques" })).toBe("maths");
  });

  it("une clé inconnue ou une thématique sans matière n'a pas de monde : la savane du camp", () => {
    expect(worldSceneIdForTopic({ programmeKey: "zz-inconnu", subjectName: "Jardinage" })).toBeNull();
    expect(worldSceneIdForTopic({})).toBeNull();
  });
});

describe("worldBackdropSrc — le décor de séance d'un monde", () => {
  it.each(WORLD_SCENE_IDS)("le monde %s a ses deux cadrages sur le disque", (id) => {
    for (const framing of ["portrait", "wide"] as const) {
      const src = worldBackdropSrc(id, framing);
      expect(src).toBe(`/images/world/decors/${id}-${framing}.webp`);
      expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
    }
  });
});
