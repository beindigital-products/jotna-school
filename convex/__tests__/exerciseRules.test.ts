import { describe, expect, it } from "vitest";
import {
  correctAnswerText,
  inputModeFor,
  sanitizePayload,
  shuffleDeterministic,
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
