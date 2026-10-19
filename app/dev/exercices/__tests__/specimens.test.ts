import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PlayableExercise } from "@/components/landing/demo/demo-types";
import { categoryOf } from "@/convex/paliers/games/things";
import { verifyAnswer } from "@/convex/paliers/exerciseRules";
import { READING_PROMPT, resolveTilePictures, splitTile } from "@/lib/item-pictures";
import { KINDS, KIND_LABELS, buildSpecimens, isKind, type Kind, type Specimen } from "../specimens";

/** Les six types de tuiles qui nomment une chose : au CI, chacune montre son image. */
const NAMED_TILES = [
  "order-animaux",
  "order-animaux-4",
  "qcm-intrus",
  "qcm-mots-seuls",
  "match-mots",
  "drag-drop-savane",
] as const satisfies readonly Kind[];

const specimens = buildSpecimens();

const idsOf = (tiles: readonly string[], prompt?: string) =>
  resolveTilePictures(tiles, { prompt }).map((picture) => picture?.id ?? null);

/** Ce que l'écran affiche, par côté : les tuiles qui peuvent porter une image. */
function tilesOf(specimen: Specimen): { main: string[]; other?: string[] } {
  const view = specimen.view as Record<string, unknown>;
  switch (specimen.exercise.type) {
    case "qcm":
      return { main: view.options as string[] };
    case "order":
      return { main: view.items as string[] };
    case "match":
      return { main: view.left as string[], other: view.right as string[] };
    case "drag-drop":
      return { main: (view.items as { text: string }[]).map((item) => item.text), other: view.zones as string[] };
    default:
      throw new Error(`type sans tuiles nommées : ${specimen.exercise.type}`);
  }
}

/** La bonne réponse, dans la forme que l'écran envoie à `onSubmit`. */
function rightAnswer(exercise: PlayableExercise): string {
  const payload = exercise.payload as Record<string, unknown>;
  switch (exercise.type) {
    case "qcm":
      return String(payload.correctIndex);
    case "order":
      return JSON.stringify(payload.correctSequence);
    case "match":
      return JSON.stringify(payload.pairs);
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      return JSON.stringify(Object.fromEntries(items.map((item) => [item.text, item.correctZone])));
    }
    default:
      throw new Error(`type inconnu : ${exercise.type}`);
  }
}

/** Une réponse complète et fausse. */
function wrongAnswer(exercise: PlayableExercise): string {
  const payload = exercise.payload as Record<string, unknown>;
  switch (exercise.type) {
    case "qcm": {
      const options = payload.options as string[];
      return String(((payload.correctIndex as number) + 1) % options.length);
    }
    case "order":
      return JSON.stringify([...(payload.correctSequence as string[])].reverse());
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      return JSON.stringify(pairs.map((pair, i) => ({ left: pair.left, right: pairs[(i + 1) % pairs.length].right })));
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      return JSON.stringify(
        Object.fromEntries(items.map((item) => [item.text, zones[(zones.indexOf(item.correctZone) + 1) % zones.length]])),
      );
    }
    default:
      throw new Error(`type inconnu : ${exercise.type}`);
  }
}

describe("les spécimens de tuiles qui nomment une chose", () => {
  it("sont dans KINDS, après les douze d'avant, avec un nom et un spécimen de CI", () => {
    expect(KINDS.slice(-NAMED_TILES.length)).toEqual([...NAMED_TILES]);
    for (const kind of NAMED_TILES) {
      expect(isKind(kind), kind).toBe(true);
      expect(KIND_LABELS[kind].length, kind).toBeGreaterThan(8);
      expect(specimens[kind].kind).toBe(kind);
      expect(specimens[kind].klass, kind).toBe("CI");
      expect(specimens[kind].label).toBe(KIND_LABELS[kind]);
    }
  });

  it("ont chacun leur identifiant : il sert de graine au mélange et de clé à la carte", () => {
    const ids = Object.values(specimens).map((specimen) => specimen.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("se jouent : la règle du serveur juge juste la bonne réponse et faux une réponse complète mais fausse", () => {
    for (const kind of NAMED_TILES) {
      const { exercise } = specimens[kind];
      expect(verifyAnswer(exercise, rightAnswer(exercise)), `${kind} : la bonne réponse`).toBe(true);
      expect(verifyAnswer(exercise, wrongAnswer(exercise)), `${kind} : une mauvaise réponse`).toBe(false);
    }
  });

  it("ne montrent à l'enfant que la vue, jamais la réponse", () => {
    for (const kind of NAMED_TILES) {
      const view = JSON.stringify(specimens[kind].view);
      expect(view, kind).not.toContain("correctIndex");
      expect(view, kind).not.toContain("correctSequence");
      expect(view, kind).not.toContain("correctZone");
    }
  });

  it("ont un énoncé qui ne demande pas de lire et ne montre aucun émoji du catalogue : l'image n'est jamais neutralisée par un garde-fou", () => {
    for (const kind of NAMED_TILES) {
      const { exercise } = specimens[kind];
      expect(READING_PROMPT.test(exercise.prompt), `${kind} : « ${exercise.prompt} »`).toBe(false);
      const { main } = tilesOf(specimens[kind]);
      // Les images avec l'énoncé sont celles sans l'énoncé : aucun garde-fou ne s'est déclenché.
      expect(idsOf(main, exercise.prompt), kind).toEqual(idsOf(main));
    }
  });

  describe("order-animaux : le cas du propriétaire, ranger des animaux", () => {
    it("trois animaux du plus petit au plus grand, émoji ET nom, chacun avec son image", () => {
      const { exercise } = specimens["order-animaux"];
      expect(exercise.prompt).toBe("Mets ces animaux dans l'ordre, du plus petit au plus grand.");
      const sequence = (exercise.payload as { correctSequence: string[] }).correctSequence;
      expect(sequence).toHaveLength(3);
      for (const tile of sequence) {
        const { emoji, rest } = splitTile(tile);
        expect(emoji, tile).not.toBe("");
        expect(rest, tile).toMatch(/^(le|la|l') ?\S+/i);
      }
      expect(idsOf(sequence).every((id) => id !== null)).toBe(true);
      // La vue est mélangée, mais ce sont les mêmes tuiles.
      expect([...tilesOf(specimens["order-animaux"]).main].sort()).toEqual([...sequence].sort());
    });

    it("quatre animaux au niveau 3 (le poids), le plus grand nombre de tuiles d'une mise en ordre", () => {
      const sequence = (specimens["order-animaux-4"].exercise.payload as { correctSequence: string[] }).correctSequence;
      expect(sequence).toHaveLength(4);
      expect(specimens["order-animaux-4"].exercise.prompt).toContain("du plus léger au plus lourd");
      expect(idsOf(sequence).every((id) => id !== null)).toBe(true);
    });
  });

  describe("qcm-intrus : l'émoji devant chaque nom", () => {
    it("quatre tuiles, trois de la même famille et un intrus, fruits et véhicules, toutes avec leur image", () => {
      const options = tilesOf(specimens["qcm-intrus"]).main;
      expect(options).toHaveLength(4);
      const families = options.map((tile) => categoryOf(splitTile(tile).emoji.trim()));
      expect(families.every((family) => family === "fruit" || family === "vehicule")).toBe(true);
      const counts = [...new Set(families)].map((family) => families.filter((other) => other === family).length);
      expect(counts.sort()).toEqual([1, 3]);
      expect(idsOf(options).every((id) => id !== null)).toBe(true);
    });
  });

  describe("les noms seuls, sans émoji : l'image est tout ce que l'enfant peut lire", () => {
    it("qcm-mots-seuls : Lion, Poule, Chat, Âne, aucun émoji, une image chacun", () => {
      const options = tilesOf(specimens["qcm-mots-seuls"]).main;
      expect(options).toEqual(["Lion", "Poule", "Chat", "Âne"]);
      expect(options.every((tile) => splitTile(tile).emoji === "")).toBe(true);
      expect(idsOf(options)).toEqual(["lion", "poule", "chat", "ane"]);
    });

    it("match-mots : les animaux ont leur image, leurs cris n'en ont pas, et huit tuiles au total", () => {
      const { main, other } = tilesOf(specimens["match-mots"]);
      expect(main).toHaveLength(4);
      expect(other).toHaveLength(4);
      expect(idsOf(main).every((id) => id !== null)).toBe(true);
      expect(idsOf(other ?? [])).toEqual([null, null, null, null]);
    });

    it("drag-drop-savane : les quatre étiquettes ont leur image, les deux boîtes (savane, ferme) n'en ont pas", () => {
      const { main, other } = tilesOf(specimens["drag-drop-savane"]);
      expect([...main].sort()).toEqual(["Chèvre", "Hyène", "Lion", "Poule"]);
      expect(idsOf(main).every((id) => id !== null)).toBe(true);
      expect([...(other ?? [])].sort()).toEqual(["Ferme", "Savane"]);
      expect(idsOf(other ?? [])).toEqual([null, null]);
    });
  });

});

describe("les listes de types écrites ailleurs que dans specimens.ts", () => {
  it("scripts/shoot-exercises.mjs prend en charge les mêmes types, dans le même ordre", () => {
    const source = readFileSync(join(process.cwd(), "scripts", "shoot-exercises.mjs"), "utf8");
    const block = /const KINDS = \[([\s\S]*?)\];/.exec(source)?.[1] ?? "";
    const listed = Array.from(block.replace(/\/\/.*$/gm, "").matchAll(/"([a-z0-9-]+)"/g), (match) => match[1]);
    expect(listed).toEqual([...KINDS]);
  });

  it("docs/boucle-native-jeu.md nomme chaque type, et le paramètre images", () => {
    const doc = readFileSync(join(process.cwd(), "docs", "boucle-native-jeu.md"), "utf8");
    for (const kind of KINDS) expect(doc, kind).toContain(`\`${kind}\``);
    expect(doc).toContain("`images`");
  });
});
