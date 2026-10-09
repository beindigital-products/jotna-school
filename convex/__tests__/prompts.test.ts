import { describe, expect, it } from "vitest";
import {
  buildPalierBasePrompt,
  buildPalierBaseSystemPrompt,
  buildVariationSystemPrompt,
  subjectRules,
} from "../paliers/prompts";

const base = {
  subject: "Histoire",
  topic: "Les rois et leurs titres",
  class: "CE2" as const,
  palierIndex: 1,
  palierCount: 4,
};

describe("la consigne de génération d'un palier", () => {
  it("transmet au modèle le contenu officiel de la thématique", () => {
    const prompt = buildPalierBasePrompt({
      ...base,
      topicDescription: "Le Damel au Cayor, le Teigne au Baol.",
    });
    expect(prompt).toContain("Contenu officiel visé");
    expect(prompt).toContain("Le Damel au Cayor, le Teigne au Baol.");
  });

  it("n'ajoute pas de bloc vide quand la thématique n'a pas de description", () => {
    expect(buildPalierBasePrompt({ ...base, topicDescription: "  " })).not.toContain("Contenu officiel");
  });

  it("demande moins d'exercices quand des jeux complètent le palier", () => {
    const prompt = buildPalierBasePrompt({ ...base, exerciseCount: 4 });
    expect(prompt).toContain("Génère 4 exercices");
    expect(prompt).toContain("4 items au total");
    expect(buildPalierBasePrompt(base)).toContain("Génère 10 exercices");
  });

  it("propose la phrase à trous et décrit sa forme, sauf en mathématiques", () => {
    const prompt = buildPalierBasePrompt(base);
    expect(prompt).toContain("Types autorisés : qcm, drag-drop, match, order, short-answer, fill-blank.");
    expect(prompt).toContain('"blanks"');
    // Un calcul à trou reste une réponse courte, vérifiée par le calcul.
    expect(buildPalierBasePrompt({ ...base, subject: "Mathématiques" })).toContain(
      "Types autorisés : qcm, drag-drop, match, order, short-answer.",
    );
  });

  it("rappelle l'exactitude des faits en histoire, pas en mathématiques", () => {
    expect(buildPalierBaseSystemPrompt(base)).toContain("N'invente AUCUN fait");
    const maths = buildPalierBaseSystemPrompt({ ...base, subject: "Mathématiques" });
    expect(maths).not.toContain("N'invente AUCUN fait");
    expect(maths).toContain("mathExpression");
  });

  it("choisit les règles de chaque matière, y compris sous ses anciens noms", () => {
    expect(subjectRules("Français")).toContain("[Français]");
    expect(subjectRules("Histoire")).toContain("[Histoire]");
    expect(subjectRules("Histoire-Géographie")).toContain("[Histoire]");
    expect(subjectRules("Géographie")).toContain("[Géographie]");
    expect(subjectRules("Éveil scientifique")).toContain("[Éveil scientifique]");
    expect(subjectRules("Sciences")).toContain("[Éveil scientifique]");
    expect(subjectRules("Instruction civique")).toContain("[Instruction civique]");
    expect(subjectRules("EMC")).toContain("[Instruction civique]");
    expect(subjectRules("Éducation artistique")).toContain("[Éducation artistique]");
    expect(subjectRules("Mathématiques")).toBe("");
    expect(subjectRules("Anglais")).toBe("");
  });

  it("au CI et au CP, rappelle que l'enfant ne lit pas encore", () => {
    expect(buildPalierBaseSystemPrompt({ ...base, class: "CI" })).toContain("apprend à lire");
    expect(buildPalierBaseSystemPrompt({ ...base, class: "CM1" })).not.toContain("apprend à lire");
  });

  it("garde les règles de la matière pour les variations d'exercices ratés", () => {
    const prompt = buildVariationSystemPrompt({
      class: "CM2",
      subject: "Histoire",
      topic: "Les grands empires",
      failed: [],
    });
    expect(prompt).toContain("[Histoire]");
  });
});
