import { describe, expect, it } from "vitest";

import { generateQuoteRequestEmailHtml, quoteRequestRows } from "../../lib/quote-request-email-template";
import {
  cleanQuoteRequest,
  formatQuoteDate,
  isQuoteDate,
  formatQuoteLocalPhone,
  joinQuotePhone,
  normalizeQuotePhone,
  quotePhoneExample,
  QUOTE_DEFAULT_DIAL_CODE,
  QUOTE_DIAL_CODES,
  QUOTE_LIMITS,
  type QuoteRequest,
} from "../quoteRules";

/** Une demande complète et fictive, que chaque test abîme sur un champ. */
const valid: QuoteRequest = {
  schoolName: "  École   Les Baobabs ",
  city: "Thiès",
  schoolType: "privee",
  contactName: "Awa Diop",
  contactRole: "Directrice",
  email: " Direction@Baobabs.SN ",
  phone: "+221 77 123 45 67",
  studentCount: 240,
  classCount: 8,
  levels: ["CM2", "CI", "CE1", "CI"],
  wantsArabic: true,
  startWhen: "  ",
  message: "\nBonjour,\nnous voulons commencer en janvier.\n",
};

const clean = (patch: Partial<QuoteRequest> = {}) => cleanQuoteRequest({ ...valid, ...patch });

describe("cleanQuoteRequest — ce qu'on stocke", () => {
  it("rogne les textes, met l'adresse en minuscules et garde le numéro en chiffres", () => {
    const result = clean();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.schoolName).toBe("École Les Baobabs");
    expect(result.value.email).toBe("direction@baobabs.sn");
    expect(result.value.phone).toBe("+221771234567");
  });

  it("dédoublonne les classes et les range du CI au CM2", () => {
    const result = clean();
    expect(result.ok && result.value.levels).toEqual(["CI", "CE1", "CM2"]);
  });

  it("ne stocke pas un champ facultatif laissé vide, et garde les retours à la ligne du message", () => {
    const result = clean();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect("startWhen" in result.value).toBe(false);
    expect(result.value.message).toBe("Bonjour,\nnous voulons commencer en janvier.");
    const bare = clean({ message: "   " });
    expect(bare.ok && "message" in bare.value).toBe(false);
  });
});

describe("cleanQuoteRequest — refus, avec le champ en faute", () => {
  const cases: Array<[string, Partial<QuoteRequest>, keyof QuoteRequest]> = [
    ["un nom d'école vide", { schoolName: "   " }, "schoolName"],
    ["une ville trop longue", { city: "a".repeat(QUOTE_LIMITS.shortText + 1) }, "city"],
    ["un contact sans nom", { contactName: "" }, "contactName"],
    ["une fonction vide", { contactRole: " " }, "contactRole"],
    ["une adresse sans arobase", { email: "direction.baobabs.sn" }, "email"],
    ["un numéro trop court", { phone: "12345" }, "phone"],
    ["un numéro avec des lettres", { phone: "77 abc 45 67" }, "phone"],
    ["zéro élève", { studentCount: 0 }, "studentCount"],
    ["un nombre d'élèves à virgule", { studentCount: 12.5 }, "studentCount"],
    ["trop d'élèves", { studentCount: QUOTE_LIMITS.maxStudents + 1 }, "studentCount"],
    ["zéro classe", { classCount: 0 }, "classCount"],
    ["aucune classe cochée", { levels: [] }, "levels"],
    ["un message trop long", { message: "a".repeat(QUOTE_LIMITS.message + 1) }, "message"],
    ["une date de démarrage en toutes lettres", { startWhen: "janvier 2027" }, "startWhen"],
    ["un 31 février", { startWhen: "2027-02-31" }, "startWhen"],
  ];

  it.each(cases)("%s", (_name, patch, field) => {
    const result = clean(patch);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe(field);
    expect(result.message).not.toBe("");
  });
});

describe("normalizeQuotePhone", () => {
  it("accepte les écritures courantes d'un numéro sénégalais", () => {
    expect(normalizeQuotePhone("77 123 45 67")).toBe("771234567");
    expect(normalizeQuotePhone("+221-77-123-45-67")).toBe("+221771234567");
    expect(normalizeQuotePhone("(33) 821.00.00")).toBe("338210000");
  });

  it("refuse ce qui n'est pas un numéro", () => {
    for (const raw of ["", "abc", "+", "1234567890123456"]) {
      expect(normalizeQuotePhone(raw), raw).toBeNull();
    }
  });
});

describe("l'indicatif du pays", () => {
  it("propose le Sénégal en premier, et c'est lui par défaut", () => {
    expect(QUOTE_DIAL_CODES[0]).toMatchObject({ country: "Sénégal", code: "+221" });
    expect(QUOTE_DEFAULT_DIAL_CODE).toBe("+221");
    expect(new Set(QUOTE_DIAL_CODES.map((d) => d.code)).size).toBe(QUOTE_DIAL_CODES.length);
  });

  it("donne un numéro complet que la règle accepte", () => {
    expect(normalizeQuotePhone(joinQuotePhone("+221", "77 123 45 67"))).toBe("+221771234567");
    expect(normalizeQuotePhone(joinQuotePhone("+33", "06 12 34 56 78"))).toBe("+33612345678");
  });

  it("donne à chaque pays un exemple qui tient dans ses groupes", () => {
    for (const dial of QUOTE_DIAL_CODES) {
      const size = dial.groups.reduce((sum, n) => sum + n, 0);
      expect(dial.example.length, dial.country).toBe(size);
      expect(dial.example, dial.country).toMatch(/^\d+$/);
      // Le modèle affiché, retapé tel quel, ne change pas.
      expect(formatQuoteLocalPhone(dial.code, quotePhoneExample(dial.code)), dial.country).toBe(
        quotePhoneExample(dial.code),
      );
    }
  });

  it("espace le numéro comme dans le pays", () => {
    expect(quotePhoneExample("+221")).toBe("77 123 45 67");
    expect(quotePhoneExample("+33")).toBe("6 12 34 56 78");
    expect(quotePhoneExample("+234")).toBe("803 123 4567");
    expect(formatQuoteLocalPhone("+221", "771234567")).toBe("77 123 45 67");
    expect(formatQuoteLocalPhone("+33", "0612345678")).toBe("6 12 34 56 78");
    expect(formatQuoteLocalPhone("+221", "77 12")).toBe("77 12");
  });

  it("garde le zéro quand il fait partie du numéro, le retire quand c'est un zéro d'appel", () => {
    expect(formatQuoteLocalPhone("+225", "0712345678")).toBe("07 12 34 56 78");
    expect(formatQuoteLocalPhone("+212", "0612345678")).toBe("6 12 34 56 78");
  });

  it("ignore les lettres et borne le nombre de chiffres du pays", () => {
    expect(formatQuoteLocalPhone("+221", "77a123b4567")).toBe("77 123 45 67");
    expect(formatQuoteLocalPhone("+221", "77123456789999")).toBe("77 123 45 67");
  });

  it("garde un numéro que la personne a écrit en entier", () => {
    expect(joinQuotePhone("+221", " +223 70 00 00 00")).toBe("+223 70 00 00 00");
  });
});

describe("la date de démarrage", () => {
  it("est un jour du calendrier, écrit AAAA-MM-JJ", () => {
    expect(isQuoteDate("2027-01-15")).toBe(true);
    for (const raw of ["15/01/2027", "2027-1-5", "2027-13-01", "2027-02-30", ""]) {
      expect(isQuoteDate(raw), raw).toBe(false);
    }
  });

  it("se lit en français, sans glisser d'un jour selon le fuseau", () => {
    expect(formatQuoteDate("2027-01-15")).toBe("15 janvier 2027");
    expect(formatQuoteDate("2027-03-01")).toBe("1 mars 2027");
  });
});

describe("le courriel de la demande", () => {
  const result = clean({ startWhen: "2027-01-15" });
  if (!result.ok) throw new Error("la demande de référence doit être valide");
  const request = result.value;

  it("porte une ligne par réponse, les facultatives seulement si elles sont remplies", () => {
    const labels = quoteRequestRows(request).map(([label]) => label);
    expect(labels).toEqual([
      "École",
      "Ville",
      "Type",
      "Contact",
      "Fonction",
      "E-mail",
      "Téléphone",
      "Nombre d'élèves",
      "Nombre de classes",
      "Classes concernées",
      "Module Arabe & Coran",
      "Démarrage souhaité",
      "Message",
    ]);
    const bare = clean({ message: "" });
    if (!bare.ok) throw new Error("valide");
    expect(quoteRequestRows(bare.value).map(([label]) => label)).not.toContain("Message");
    expect(quoteRequestRows(request)).toContainEqual(["Démarrage souhaité", "15 janvier 2027"]);
  });

  it("échappe ce que le visiteur a saisi : une balise ne devient pas du balisage", () => {
    const html = generateQuoteRequestEmailHtml({
      request: { ...request, schoolName: '<script>alert("x")</script>' },
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
