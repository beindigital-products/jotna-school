import { describe, expect, it } from "vitest";
import { invitationLink, isSignupRole, registerPath } from "../signup";

describe("registerPath — le chemin de la page d'inscription", () => {
  it("est /register quand on ne sait rien de la personne", () => {
    expect(registerPath()).toBe("/register");
    expect(registerPath({})).toBe("/register");
    expect(registerPath({ code: "", role: null })).toBe("/register");
  });

  it("garde l'adresse des boutons de la page d'accueil : le rôle seul", () => {
    expect(registerPath({ role: "parent" })).toBe("/register?role=parent");
    expect(registerPath({ role: "directeur" })).toBe("/register?role=directeur");
  });

  it("porte le code d'invitation, puis le rôle", () => {
    expect(registerPath({ code: "JOTNA-7C4K-2MQX" })).toBe(
      "/register?code=JOTNA-7C4K-2MQX",
    );
    expect(registerPath({ code: "JOTNA-7C4K-2MQX", role: "professeur" })).toBe(
      "/register?code=JOTNA-7C4K-2MQX&role=professeur",
    );
  });

  it("encode un code saisi avec des espaces, que la page relira tel quel", () => {
    const path = registerPath({ code: "jotna 7c4k 2mqx" });
    expect(new URL(path, "https://exemple.sn").searchParams.get("code")).toBe(
      "jotna 7c4k 2mqx",
    );
  });
});

describe("invitationLink — le lien envoyé à la personne invitée", () => {
  it("vise la page d'inscription, barre finale comprise, avec le code", () => {
    expect(invitationLink("https://jotnaschool.com", "JOTNA-7C4K-2MQX")).toBe(
      "https://jotnaschool.com/register/?code=JOTNA-7C4K-2MQX",
    );
  });

  it("donne un lien que la page relit : le code en ressort intact", () => {
    const link = invitationLink("http://localhost:3000", "JOTNA-7C4K-2MQX");
    const url = new URL(link);
    expect(url.pathname).toBe("/register/");
    expect(url.searchParams.get("code")).toBe("JOTNA-7C4K-2MQX");
  });
});

describe("isSignupRole — les types de compte qu'un adulte peut créer", () => {
  it("reconnaît parent, professeur et école", () => {
    expect(isSignupRole("parent")).toBe(true);
    expect(isSignupRole("professeur")).toBe(true);
    expect(isSignupRole("directeur")).toBe(true);
  });

  it("écarte élève, admin et tout le reste", () => {
    for (const value of ["student", "admin", "", "Parent", null]) {
      expect(isSignupRole(value)).toBe(false);
    }
  });
});
