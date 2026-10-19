import { describe, it, expect } from "vitest";
import { decideProvisionedRole } from "../roleRules";

describe("decideProvisionedRole", () => {
  it("accepte les quatre rôles qu'un provisionnement pose", () => {
    // Les deux premiers viennent de l'école et du code parent ; les deux
    // suivants d'un administrateur plateforme, et d'aucun autre chemin.
    expect(decideProvisionedRole("parent")).toBe("parent");
    expect(decideProvisionedRole("student")).toBe("student");
    expect(decideProvisionedRole("professeur")).toBe("professeur");
    expect(decideProvisionedRole("directeur")).toBe("directeur");
  });

  it("REFUSE `admin`, que rien dans l'application ne pose", () => {
    // Un administrateur qui en fabrique un autre transforme une
    // compromission de compte en compromission de plateforme. Ce rôle se
    // pose sur le déploiement, hors de l'application.
    expect(() => decideProvisionedRole("admin")).toThrow("Rôle non autorisé");
  });

  it("refuse aussi ce qui ne ressemble à aucun rôle", () => {
    for (const value of ["", "PARENT", "Professeur", "teacher", "{}"]) {
      expect(() => decideProvisionedRole(value)).toThrow("Rôle non autorisé");
    }
  });

  it("ne retombe sur `student` QUE pour un rôle absent", () => {
    // La nuance qui porte tout : un appelant qui ne précise rien provisionne
    // un élève, le cas de loin le plus courant. Un rôle PRÉSENT mais interdit
    // doit lever, sans quoi une demande de compte admin deviendrait un compte
    // élève sans un mot.
    expect(decideProvisionedRole(undefined)).toBe("student");
    expect(() => decideProvisionedRole("admin")).toThrow();
  });
});
