import { describe, expect, it } from "vitest";
import {
  buildPalierBasePrompt,
  buildPalierBaseSystemPrompt,
  buildPersonalizedSystemPrompt,
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

/** La consigne est écrite sur plusieurs lignes : on cherche une phrase, pas une coupure. */
const flat = (text: string) => text.replace(/\s+/g, " ");

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

  it("dit au modèle que l'enfant ne voit que le texte, et comment dessiner une collection", () => {
    for (const cls of ["CI", "CP", "CE2", "CM2"] as const) {
      for (const subject of ["Mathématiques", "Histoire"]) {
        const prompt = flat(buildPalierBaseSystemPrompt({ ...base, subject, class: cls }));
        expect(prompt, `${subject} ${cls}`).toContain("L'énoncé se suffit à lui-même");
        expect(prompt).toContain("Combien de billes as-tu ?");
        expect(prompt).toContain("DESSINE-LES avec des émojis");
        expect(prompt).toContain("EXACTEMENT la réponse");
      }
    }
  });

  it("ne demande plus d'« observer » dans le premier indice", () => {
    const prompt = buildPalierBaseSystemPrompt(base);
    expect(prompt).not.toContain("relire l'énoncé / observer");
    expect(prompt).toContain("jamais « Regarde");
  });

  it("applique la règle de la scène aux variations d'exercices ratés", () => {
    const prompt = buildVariationSystemPrompt({
      class: "CI",
      subject: "Mathématiques",
      topic: "Les nombres jusqu'à 10",
      failed: [],
    });
    expect(prompt).toContain("L'énoncé se suffit à lui-même");
  });

  it("en anglais, l'énoncé ne parle jamais d'« image »", () => {
    const prompt = flat(buildPalierBaseSystemPrompt({ ...base, subject: "Anglais", class: "CI" }));
    expect(prompt).not.toContain("Quel mot va avec l'image");
    expect(prompt).toContain("ne parle jamais d'« image »");
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

describe("les règles de qualité, doublées par le contrôleur structurel", () => {
  const quality = (text: string) => {
    const start = text.indexOf("[Qualité");
    return start === -1 ? "" : flat(text.slice(start, text.indexOf("\n[", start + 1) === -1 ? undefined : text.indexOf("\n[", start + 1)));
  };

  it("nomme les défauts que le contrôleur écarte : options, phrase complète, trou, indices", () => {
    const rules = quality(buildPalierBaseSystemPrompt(base));
    expect(rules).toContain("phrase COMPLÈTE");
    expect(rules).toContain("jamais coupée");
    expect(rules).toContain("Complète » exige un trou");
    expect(rules).toContain("UNE seule vraie");
    expect(rules).toContain("« Toutes les réponses »");
    expect(rules).toContain("« Aucune de ces réponses »");
    expect(rules).toContain("« 5 » et « cinq »");
    expect(rules).toContain("n'est pas la plus longue");
    expect(rules).toContain("options[correctIndex]");
    expect(rules).toContain("3 indices non vides et différents");
    expect(rules).toContain("le 1er ne donne pas la réponse");
  });

  it("vaut pour toutes les classes et toutes les matières, et pour les variations", () => {
    for (const cls of ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const) {
      for (const subject of ["Mathématiques", "Français", "Anglais", "Histoire"]) {
        expect(buildPalierBaseSystemPrompt({ ...base, subject, class: cls }), `${subject} ${cls}`).toContain("[Qualité");
      }
    }
    expect(buildPersonalizedSystemPrompt({ ...base, weaknesses: [], frequentMistakes: [] })).toContain("[Qualité");
    expect(
      buildVariationSystemPrompt({ class: "CE1", subject: "Histoire", topic: "Les rois", failed: [] }),
    ).toContain("[Qualité");
  });

  it("reste courte : le coût en jetons compte", () => {
    const rules = quality(buildPalierBaseSystemPrompt(base));
    expect(rules.length).toBeGreaterThan(300);
    expect(rules.length).toBeLessThan(1100);
  });

  it("ne touche pas à la règle de la scène, qui garde sa place et son texte", () => {
    const prompt = flat(buildPalierBaseSystemPrompt(base));
    const scene = prompt.indexOf("[L'énoncé se suffit à lui-même — RÈGLE ABSOLUE]");
    expect(scene).toBeGreaterThan(-1);
    expect(prompt.indexOf("[Qualité")).toBeGreaterThan(scene);
    expect(prompt).toContain("Avant de répondre, relis chaque énoncé en imaginant l'enfant devant un écran où il n'y a QUE ce texte");
  });

  it("ne répète pas les règles du match, du drag-drop et du fill-blank, déjà dans le format", () => {
    const rules = quality(buildPalierBaseSystemPrompt(base));
    expect(rules).not.toContain("Zone A");
    expect(rules).not.toContain('"accepted"');
    expect(rules).not.toContain('"blanks"');
  });
});
