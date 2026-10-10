import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { pioPosterSrc, type PioState } from "@/components/student/pio";
import { pioSays } from "@/lib/pioCopy";
import { HERO_BASE, MEET_BASE, MOMENTS } from "../pio-moments";
import { SECRET_LINE, TAP_LINES, TAP_POSES } from "../pio-reactions";

const NBSP = " ";
const publicFile = (src: string) => path.join(process.cwd(), "public", src);

/** Un espace ordinaire devant « ! » « ? » « : » « ; » ou « » », ou derrière « « » : la ponctuation passerait seule à la ligne. */
const BAD_SPACE = / [!?:;»]|« /;

describe("les quatre moments de Pio", () => {
  it("sont quatre, chacun avec son titre, son texte, sa pose et sa phrase", () => {
    expect(MOMENTS.map((moment) => moment.id)).toEqual(["accueil", "reussite", "erreur", "difficulte"]);
    for (const moment of MOMENTS) {
      expect(moment.title.trim(), moment.id).not.toBe("");
      expect(moment.text.trim(), moment.id).not.toBe("");
      expect(moment.line.trim(), moment.id).not.toBe("");
    }
  });

  it("prononcent les phrases de l'application, pas d'autres", () => {
    const line = (id: string) => MOMENTS.find((moment) => moment.id === id)?.line.replaceAll(NBSP, " ");
    expect(line("accueil")).toBe(pioSays.coldStart(""));
    expect(line("reussite")).toBe(`${pioSays.answerRight[0]} ${pioSays.answerRightSub[0]}`);
    expect(line("erreur")).toBe(`${pioSays.answerWrong[0]} ${pioSays.answerWrongSub[0]}`);
    expect(line("difficulte")).toBe(pioSays.answerOutSub);
  });

  it("prennent les poses que l'application leur donne", () => {
    expect(Object.fromEntries(MOMENTS.map((moment) => [moment.id, moment.pose]))).toEqual({
      accueil: "hello",
      reussite: "cheer",
      erreur: "encourage",
      difficulte: "sad",
    });
  });

  it("ne mettent jamais la ponctuation seule en début de ligne", () => {
    const texts = [
      ...MOMENTS.flatMap((moment) => [moment.title, moment.text, moment.line]),
      HERO_BASE.line,
      MEET_BASE.line,
      ...TAP_LINES,
      SECRET_LINE,
    ];
    for (const text of texts) expect(text, text).not.toMatch(BAD_SPACE);
  });

  it("ne chiffrent rien : le nombre d'essais n'est pas le même dans la séance (cinq) et dans la démonstration (trois)", () => {
    const words = MOMENTS.map((moment) => `${moment.title} ${moment.text}`).join(" ");
    expect(words).not.toMatch(/\d/);
  });
});

describe("Pio sur la page d'accueil", () => {
  it("fait coucou en haut de la page, et c'est aussi sa pose de départ dans la scène (son clip est déjà chargé)", () => {
    expect(HERO_BASE.pose).toBe("hello");
    expect(MEET_BASE.pose).toBe("hello");
    expect(HERO_BASE.line).toContain("Pio");
    expect(MEET_BASE.line).toContain("Pio");
  });

  it("réagit au toucher avec les poses et les répliques du camp, sauf la réplique qui parle du camp", () => {
    expect([...TAP_POSES]).toEqual(["hello", "cheer", "amazed", "encourage"]);
    expect(TAP_LINES.length).toBeGreaterThanOrEqual(4);
    expect(TAP_LINES.join(" ")).not.toMatch(/\bcamp\b/);
    for (const line of TAP_LINES) {
      expect(pioSays.tapReactions.map((original) => original.replaceAll(NBSP, " "))).toContain(line.replaceAll(NBSP, " "));
    }
    expect(SECRET_LINE.replaceAll(NBSP, " ")).toBe(pioSays.secret);
  });
});

describe("les affiches légères de la page d'accueil", () => {
  const poses = ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep"] as const;

  it("existent pour chaque pose, et pèsent moins de 60 Ko (les PNG d'origine, 500 Ko)", () => {
    for (const pose of poses) {
      const file = publicFile(pioPosterSrc(pose, "classic", true));
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, pose).toBeLessThan(60 * 1024);
    }
  });

  it("couvrent toutes les poses que la page peut montrer", () => {
    const shown = new Set<PioState>([HERO_BASE.pose, MEET_BASE.pose, ...MOMENTS.map((moment) => moment.pose), ...TAP_POSES, "cheer"]);
    for (const pose of shown) {
      expect(existsSync(publicFile(pioPosterSrc(pose, "classic", true))), pose).toBe(true);
    }
  });
});
