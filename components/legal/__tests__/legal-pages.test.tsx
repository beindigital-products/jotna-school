import { existsSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { LegalDocument } from "../legal-document";
import {
  LEGAL_DOCS,
  LEGAL_LINKS,
  getLegalDoc,
  legalHref,
  type LegalBlock,
} from "@/lib/legal/docs";
import {
  CONTACT_EMAIL,
  LEGAL_ENTITY,
  PENDING,
  pendingEntityFields,
} from "@/lib/legal/entity";

afterEach(cleanup);

function allText(blocks: LegalBlock[]): string[] {
  return blocks.flatMap((b) => (typeof b === "string" ? [b] : b.list));
}

function fullText(slug: string): string {
  const doc = getLegalDoc(slug);
  return [
    doc.title,
    doc.description,
    ...doc.sections.flatMap((s) => [s.title, ...allText(s.blocks)]),
  ].join("\n");
}

describe("les pages légales du pied de page", () => {
  it("existent toutes : aucun lien ne mène à une page absente", () => {
    expect(LEGAL_LINKS.length).toBeGreaterThanOrEqual(6);
    for (const link of LEGAL_LINKS) {
      const slug = link.href.replace("/legal/", "");
      const file = path.join(process.cwd(), "app", "legal", slug, "page.tsx");
      expect(existsSync(file), `${link.href} n'a pas de page`).toBe(true);
    }
  });

  it("ont un identifiant unique et un lien qui y mène", () => {
    const slugs = LEGAL_DOCS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const doc of LEGAL_DOCS) {
      expect(LEGAL_LINKS).toContainEqual({
        label: doc.label,
        href: legalHref(doc.slug),
      });
    }
  });

  it("proposent les trois textes que le pied de page promettait en premier", () => {
    const hrefs = LEGAL_LINKS.map((l) => l.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/legal/mentions",
        "/legal/cgu",
        "/legal/confidentialite",
      ]),
    );
  });
});

describe("le contenu des textes", () => {
  it("a des sections, chacune avec un titre et du texte", () => {
    for (const doc of LEGAL_DOCS) {
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const section of doc.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it("n'emploie ni tiret cadratin ni guillemet courbe", () => {
    for (const doc of LEGAL_DOCS) {
      const text = fullText(doc.slug);
      expect(text, doc.slug).not.toMatch(/[—–]/);
      expect(text, doc.slug).not.toMatch(/[‘’“”]/);
    }
  });

  it("donne l'adresse de contact partout où l'on doit pouvoir écrire", () => {
    for (const slug of ["mentions", "cgu", "confidentialite", "mineurs"]) {
      expect(fullText(slug), slug).toContain(CONTACT_EMAIL);
    }
  });

  it("nomme les prestataires qui reçoivent des données, comme le code les appelle", () => {
    const privacy = fullText("confidentialite");
    for (const name of [
      "Convex",
      "ElevenLabs",
      "OpenAI",
      "Resend",
      "PayDunya",
      "Bictorys",
    ]) {
      expect(privacy, name).toContain(name);
    }
  });

  it("dit que la voix n'est pas conservée, et que la bannière de cookies est inutile", () => {
    expect(fullText("confidentialite")).toMatch(/ne conserve ni l'enregistrement/);
    expect(fullText("mineurs")).toMatch(/Aucune voix n'est conservée/);
    expect(fullText("cookies")).toMatch(/ni outil de mesure d'audience/);
  });
});

describe("l'éditeur à renseigner", () => {
  it("ne laisse un champ vide que parmi ceux que le code ne peut pas connaître", () => {
    const known = Object.keys(LEGAL_ENTITY);
    for (const field of pendingEntityFields()) {
      expect(known).toContain(field);
    }
  });

  it("surligne chaque champ encore vide dans les mentions légales", () => {
    const { container } = render(<LegalDocument slug="mentions" />);
    const marks = container.querySelectorAll("mark");
    if (pendingEntityFields().length > 0) {
      expect(marks.length).toBeGreaterThan(0);
      for (const mark of marks) expect(mark.textContent).toBe(PENDING);
    } else {
      expect(marks.length).toBe(0);
    }
  });
});

describe("LegalDocument", () => {
  it("affiche le titre, la date de révision et les sections", () => {
    render(<LegalDocument slug="confidentialite" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Politique de confidentialité" }),
    ).toBeTruthy();
    expect(screen.getByText(/Dernière mise à jour :/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Vos droits" })).toBeTruthy();
  });

  it("refuse un texte inconnu plutôt que d'afficher une page vide", () => {
    expect(() => render(<LegalDocument slug="inconnu" />)).toThrow(/inconnu/);
  });
});
