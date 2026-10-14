import { describe, expect, it } from "vitest";
import {
  correctAnswerText,
  inputModeFor,
  sanitizePayload,
  shuffleDeterministic,
  spellingNote,
  verifyAnswer,
} from "../paliers/exerciseRules";
import { inputModeFor as inputModeFromIndex, shuffleDeterministic as shuffleFromIndex } from "../paliers";

// LA MÊME RÈGLE SUR LE SERVEUR ET SUR LE TÉLÉPHONE (`docs/hors-ligne.md`) :
// l'appareil juge sans réseau, le serveur rejuge à la synchronisation.

describe("juger une réponse", () => {
  it("QCM : l'index de la bonne option", () => {
    const ex = { type: "qcm", payload: { options: ["3", "4"], correctIndex: 1 } };
    expect(verifyAnswer(ex, "1")).toBe(true);
    expect(verifyAnswer(ex, "0")).toBe(false);
  });

  it("réponse courte : formes canoniques et nombres égaux", () => {
    const ex = { type: "short-answer", payload: { acceptedAnswers: ["2,5", "1000"] } };
    expect(verifyAnswer(ex, "2.5")).toBe(true);
    expect(verifyAnswer(ex, "1 000")).toBe(true);
    expect(verifyAnswer(ex, "3")).toBe(false);
    expect(verifyAnswer({ type: "short-answer", payload: {} }, "3")).toBe(false);
  });

  describe("réponse courte : l'orthographe ne punit pas", () => {
    const word = (acceptedAnswers: string[], extra: object = {}) => ({
      type: "short-answer",
      payload: { acceptedAnswers, ...extra },
    });

    it("valide plusieurs réponses admises, sans note quand l'écriture est bonne", () => {
      const ex = word(["mangue", "la mangue"]);
      expect(verifyAnswer(ex, "La Mangue")).toBe(true);
      expect(spellingNote(ex, "mangue")).toBeNull();
      expect(spellingNote(ex, "la mangue")).toBeNull();
    });

    it("valide une lettre oubliée, en trop ou changée, et rend la bonne graphie", () => {
      const ex = word(["mangue"]);
      for (const typed of ["mangu", "manngue", "mangie", "magnue"]) {
        expect(verifyAnswer(ex, typed)).toBe(true);
        expect(spellingNote(ex, typed)).toBe("mangue");
      }
    });

    it("valide l'accent manquant et la ponctuation, avec la bonne graphie", () => {
      expect(verifyAnswer(word(["école"]), "ecole")).toBe(true);
      expect(spellingNote(word(["école"]), "ecole")).toBe("école");
      expect(spellingNote(word(["pied-de-biche"]), "pied de biche")).toBe("pied-de-biche");
    });

    it("compare au plus proche des réponses admises", () => {
      expect(spellingNote(word(["tomate", "citron"]), "citrn")).toBe("citron");
    });

    it("tolère deux fautes à partir de 8 lettres, une seule avant", () => {
      expect(verifyAnswer(word(["thiéboudienne"]), "tieboudiene")).toBe(true);
      expect(verifyAnswer(word(["mangue"]), "mnagu")).toBe(false);
    });

    it("refuse une autre réponse, même proche en apparence", () => {
      expect(verifyAnswer(word(["mangue"]), "banane")).toBe(false);
      expect(verifyAnswer(word(["mangue"]), "")).toBe(false);
      expect(spellingNote(word(["mangue"]), "banane")).toBeNull();
    });

    it("juge un mot de moins de 4 lettres à l'identique", () => {
      expect(verifyAnswer(word(["à"]), "a")).toBe(false);
      expect(verifyAnswer(word(["mer"]), "mir")).toBe(false);
      expect(verifyAnswer(word(["mer"]), "MER")).toBe(true);
    });

    it("juge un nombre à l'identique", () => {
      expect(verifyAnswer(word(["12"]), "13")).toBe(false);
      expect(verifyAnswer(word(["1/2"]), "1/3")).toBe(false);
    });

    it("exactSpelling refuse la faute quand l'orthographe est la question", () => {
      const ex = word(["mange"], { exactSpelling: true });
      expect(verifyAnswer(ex, "manges")).toBe(false);
      expect(verifyAnswer(ex, "Mange")).toBe(true);
      expect(verifyAnswer(word(["mange"]), "manges")).toBe(true);
    });

    it("ne donne une graphie que pour une réponse courte", () => {
      expect(spellingNote({ type: "qcm", payload: { options: ["a"], correctIndex: 0 } }, "0")).toBeNull();
    });
  });

  it("ordre : la séquence exacte, et jamais une liste vide pour une séquence absente", () => {
    const ex = { type: "order", payload: { correctSequence: ["a", "b"] } };
    expect(verifyAnswer(ex, JSON.stringify(["a", "b"]))).toBe(true);
    expect(verifyAnswer(ex, JSON.stringify(["b", "a"]))).toBe(false);
    expect(verifyAnswer({ type: "order", payload: {} }, "[]")).toBe(false);
  });

  it("appariement et glisser-déposer : en multi-ensembles", () => {
    const match = { type: "match", payload: { pairs: [{ left: "x", right: "a" }, { left: "y", right: "a" }] } };
    expect(verifyAnswer(match, JSON.stringify([{ left: "y", right: "a" }, { left: "x", right: "a" }]))).toBe(true);
    const dd = { type: "drag-drop", payload: { items: [{ text: "n", correctZone: "Z" }] } };
    expect(verifyAnswer(dd, JSON.stringify({ n: "Z" }))).toBe(true);
  });

  it("un type inconnu n'est jamais juste", () => {
    expect(verifyAnswer({ type: "dessin", payload: {} }, "x")).toBe(false);
  });
});

describe("ce que l'enfant voit", () => {
  it("le payload montré ne porte jamais la réponse", () => {
    expect(sanitizePayload("qcm", { options: ["a"], correctIndex: 0 }, "e", "s")).toEqual({ options: ["a"] });
    const short = sanitizePayload("short-answer", { acceptedAnswers: ["12"] }, "e", "s") as Record<string, unknown>;
    expect(short.acceptedAnswers).toBeUndefined();
    expect(short.inputMode).toBe("numeric");
    const dd = sanitizePayload("drag-drop", { zones: ["Z"], items: [{ text: "n", correctZone: "Z" }] }, "e", "s");
    expect(JSON.stringify(dd)).not.toContain("correctZone");
  });

  it("le mélange dépend de la tentative : même tentative, même ordre", () => {
    const payload = { correctSequence: ["a", "b", "c", "d", "e"] };
    const one = sanitizePayload("order", payload, "e1", "session-1");
    expect(sanitizePayload("order", payload, "e1", "session-1")).toEqual(one);
    expect(shuffleDeterministic([1, 2, 3], "x")).toEqual(shuffleFromIndex([1, 2, 3], "x"));
  });

  it("le clavier suit les réponses attendues", () => {
    expect(inputModeFor(["18"])).toBe("numeric");
    expect(inputModeFor(["2,5"])).toBe("decimal");
    expect(inputModeFor(["chat"])).toBe("text");
    expect(inputModeFromIndex(["18"])).toBe("numeric");
  });

  it("la bonne réponse, écrite pour l'explication sans réseau", () => {
    expect(correctAnswerText({ type: "qcm", payload: { options: ["3", "4"], correctIndex: 1 } })).toBe("4");
    expect(correctAnswerText({ type: "short-answer", payload: { acceptedAnswers: ["", "7"] } })).toBe("7");
    expect(correctAnswerText({ type: "order", payload: { correctSequence: ["un", "deux"] } })).toBe("un → deux");
    expect(correctAnswerText({ type: "qcm", payload: {} })).toBeNull();
  });
});
