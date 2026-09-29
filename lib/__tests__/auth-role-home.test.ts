import { afterEach, describe, expect, it, vi } from "vitest";

/** `roleHomePath` lit la cible au chargement du module : on le recharge par cible. */
async function loadRoleHomePath(target: "web" | "app") {
  vi.resetModules();
  process.env.NEXT_PUBLIC_JOTNA_TARGET = target;
  return (await import("../auth")).roleHomePath;
}

describe("roleHomePath selon la cible de construction", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_JOTNA_TARGET;
  });

  it("sur le site web, envoie l'élève vers l'application", async () => {
    const roleHomePath = await loadRoleHomePath("web");
    expect(roleHomePath("student")).toBe("/eleve");
  });

  it("sur le site web, garde les trois tableaux de bord", async () => {
    const roleHomePath = await loadRoleHomePath("web");
    expect(roleHomePath("admin")).toBe("/admin/dashboard");
    expect(roleHomePath("professeur")).toBe("/teacher/dashboard");
    expect(roleHomePath("parent")).toBe("/parent/dashboard");
  });

  it("dans l'application, l'élève retrouve son camp", async () => {
    const roleHomePath = await loadRoleHomePath("app");
    expect(roleHomePath("student")).toBe("/student/home");
  });
});
