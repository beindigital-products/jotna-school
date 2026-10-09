import { describe, expect, it } from "vitest";
import { roleHomePath } from "../auth";

describe("roleHomePath", () => {
  it("envoie chaque rôle vers son espace", () => {
    expect(roleHomePath("student")).toBe("/student/home");
    expect(roleHomePath("admin")).toBe("/admin/dashboard");
    expect(roleHomePath("directeur")).toBe("/school/dashboard");
    expect(roleHomePath("professeur")).toBe("/teacher/dashboard");
    expect(roleHomePath("parent")).toBe("/parent/dashboard");
    expect(roleHomePath(null)).toBe("/login");
  });
});
