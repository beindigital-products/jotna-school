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
    expect(subjectRules("Anglais")).toContain("[Anglais");
    // « Langue anglaise » contient « langue » : l'anglais passe avant le français.
    expect(subjectRules("Langue anglaise")).toContain("[Anglais");
    expect(subjectRules("Langue anglaise")).not.toContain("[Français]");
    expect(subjectRules("Espagnol")).toBe("");
  });

  it("en anglais, l'énoncé reste en français, sans mot anglais au CI ni au CP", () => {
    const ci = buildPalierBaseSystemPrompt({ ...base, subject: "Anglais", class: "CI" });
    expect(ci).toContain("FRANÇAIS simple");
    expect(ci).toContain("AUCUN mot");
    expect(ci).toContain("apprend à lire");
    expect(ci).not.toContain("[Français]");
    // La phrase à trous reste permise : le verbe, l'article, la préposition.
    expect(buildPalierBasePrompt({ ...base, subject: "Anglais" })).toContain("fill-blank");
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

describe("le niveau des maths suit la classe", () => {
  const maths = { ...base, subject: "Mathématiques", topic: "Les fractions" };
  const classes = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const;

  it.each(classes)("nomme l'étendue de %s dans la consigne système", (cls) => {
    const prompt = buildPalierBaseSystemPrompt({ ...maths, class: cls });
    expect(prompt).toContain(`[Niveau ${cls} — étendue des mathématiques]`);
    expect(prompt).toContain(`Programme ${cls} :`);
  });

  it("interdit les calculs de CI-CP à partir du CE2", () => {
    for (const cls of ["CE2", "CM1", "CM2"] as const) {
      expect(buildPalierBaseSystemPrompt({ ...maths, class: cls })).toContain("INTERDIT");
    }
    for (const cls of ["CI", "CP", "CE1"] as const) {
      expect(buildPalierBaseSystemPrompt({ ...maths, class: cls })).not.toContain("INTERDIT");
    }
  });

  it("donne au CM2 des pourcentages et des décimaux, pas des nombres de CI", () => {
    const cm2 = buildPalierBaseSystemPrompt({ ...maths, class: "CM2" });
    expect(cm2).toContain("pourcentages");
    expect(cm2).toContain("décimaux");
    expect(cm2).not.toContain("nombres jusqu'à 10 (20 au plus)");
  });

  it("veut des prix entiers et réalistes en FCFA", () => {
    expect(buildPalierBaseSystemPrompt({ ...maths, class: "CM2" })).toContain("Le FCFA n'a pas de centimes");
  });

  it("applique la même étendue aux variations", () => {
    const prompt = buildVariationSystemPrompt({
      class: "CM2",
      subject: "Mathématiques",
      topic: "Les fractions",
      failed: [],
    });
    expect(prompt).toContain("[Niveau CM2");
  });

  it("applique l'étendue de classe à toutes les matières", () => {
    const subjects = ["Français", "Anglais", "Histoire", "Géographie", "Éveil scientifique", "Instruction civique", "Éducation artistique", "Arabe"];
    for (const subject of subjects) {
      for (const cls of classes) {
        const prompt = buildPalierBaseSystemPrompt({ ...base, subject, class: cls });
        expect(prompt, `${subject} ${cls}`).toContain(`[Niveau ${cls} — étendue de la matière]`);
        expect(prompt, `${subject} ${cls}`).toContain(`Langue de l'exercice en ${cls}`);
        expect(prompt, `${subject} ${cls}`).toContain("pas de notions d'une classe inférieure");
      }
    }
  });

  it("donne un programme différent à chaque classe pour chaque matière connue", () => {
    for (const subject of ["Français", "Anglais", "Histoire", "Géographie", "Éveil scientifique", "Instruction civique", "Éducation artistique", "Mathématiques"]) {
      const lines = classes.map((cls) => {
        const prompt = buildPalierBaseSystemPrompt({ ...base, subject, class: cls });
        return prompt.split("\n").find((l) => l.startsWith(`- Programme ${cls} :`));
      });
      expect(lines.every(Boolean), subject).toBe(true);
      expect(new Set(lines.map((l) => l!.split(" : ")[1])).size, subject).toBe(6);
    }
  });

  it("interdit les exercices de CI-CP à partir du CE2 dans toutes les matières", () => {
    for (const subject of ["Français", "Histoire", "Éveil scientifique"]) {
      expect(buildPalierBaseSystemPrompt({ ...base, subject, class: "CM2" })).toContain("résout sans effort est un ÉCHEC");
      expect(buildPalierBaseSystemPrompt({ ...base, subject, class: "CP" })).not.toContain("résout sans effort");
    }
  });

  it("garde un énoncé court et sans texte au CI, élaboré au CM2", () => {
    const ci = buildPalierBaseSystemPrompt({ ...base, class: "CI" });
    const cm2 = buildPalierBaseSystemPrompt({ ...base, class: "CM2" });
    expect(ci).toContain("8 mots au plus");
    expect(cm2).toContain("préparent la 6e");
  });
});
