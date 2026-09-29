import { describe, expect, it } from "vitest";
import { MAX_SPOKEN_PROMPT_CHARS, speakablePrompt } from "../voice/speakable";
import { isReadingLearnerClass, READING_LEARNER_CLASSES } from "../curriculum";

describe("speakablePrompt — ce que Pio dit d'une consigne", () => {
  it("laisse une consigne ordinaire telle quelle", () => {
    expect(speakablePrompt("Fais correspondre les mots avec leur son.")).toBe(
      "Fais correspondre les mots avec leur son.",
    );
  });

  it("garde les traits d'union et les deux-points des phrases", () => {
    expect(speakablePrompt("Combien y en a-t-il ? Écoute bien : réponds.")).toBe(
      "Combien y en a-t-il ? Écoute bien : réponds.",
    );
  });

  it("fait d'un trou une pause", () => {
    expect(speakablePrompt("Complète le mot : ma_an")).toBe("Complète le mot : ma … an");
    expect(speakablePrompt("7 - 3 = ___")).toBe("7 moins 3 égale …");
  });

  it("dit les signes de calcul en français", () => {
    expect(speakablePrompt("Combien font 3 + 4 ?")).toBe("Combien font 3 plus 4 ?");
    expect(speakablePrompt("12 : 3 = 4")).toBe("12 divisé par 3 égale 4");
    expect(speakablePrompt("2 × 6 = 12")).toBe("2 fois 6 égale 12");
    expect(speakablePrompt("5 < 8")).toBe("5 est plus petit que 8");
  });

  it("lit un « ? » qui remplace un nombre comme un trou", () => {
    expect(speakablePrompt("3 + ? = 7")).toBe("3 plus … égale 7");
    expect(speakablePrompt("? × 6 = 24")).toBe("… fois 6 égale 24");
    expect(speakablePrompt("Quel nombre manque : 5, ?, 7 ?")).toBe(
      "Quel nombre manque : 5, …, 7 ?",
    );
  });

  it("ne touche pas l'heure écrite avec deux-points collés", () => {
    expect(speakablePrompt("Il est 10:30.")).toBe("Il est 10:30.");
  });

  it("retire les émojis sans laisser de ponctuation orpheline", () => {
    expect(speakablePrompt("Compte les pommes : 🍎🍎🍎. Combien y en a-t-il ?")).toBe(
      "Compte les pommes. Combien y en a-t-il ?",
    );
    expect(speakablePrompt("Trouve le chiffre 1\ufe0f\u20e3 dans la liste.")).toBe(
      "Trouve le chiffre 1 dans la liste.",
    );
  });

  it("ne dit rien quand il n'y a rien à dire, ou trop", () => {
    expect(speakablePrompt("🍎🍎🍎")).toBeNull();
    expect(speakablePrompt("   ")).toBeNull();
    expect(speakablePrompt("a".repeat(MAX_SPOKEN_PROMPT_CHARS + 1))).toBeNull();
  });
});

describe("isReadingLearnerClass — les classes où l'on apprend à lire", () => {
  it("vaut pour le CI et le CP", () => {
    expect(READING_LEARNER_CLASSES).toEqual(["CI", "CP"]);
    expect(isReadingLearnerClass("CI")).toBe(true);
    expect(isReadingLearnerClass("CP")).toBe(true);
  });

  it("ne vaut ni à partir du CE1, ni sans classe", () => {
    expect(isReadingLearnerClass("CE1")).toBe(false);
    expect(isReadingLearnerClass("CM2")).toBe(false);
    expect(isReadingLearnerClass("6e")).toBe(false);
    expect(isReadingLearnerClass(undefined)).toBe(false);
    expect(isReadingLearnerClass(null)).toBe(false);
  });
});
