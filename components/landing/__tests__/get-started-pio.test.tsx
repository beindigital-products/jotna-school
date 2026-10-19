import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { GetStarted } from "../get-started";

afterEach(cleanup);

describe("la section « Créez votre compte »", () => {
  it("garde ses trois parcours, vers l'inscription du bon rôle", () => {
    render(<GetStarted />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/register?role=parent", "/register?role=professeur", "/register?role=directeur"]);
  });

  it("fait attendre l'élève par Pio : une affiche légère, sans clip, un clin d'œil et pas un poids de plus", () => {
    const { container } = render(<GetStarted />);
    expect(screen.getByRole("img", { name: "Pio te dit bonjour" })).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/images/pio/lite/hello.webp");
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText(/Et l'élève/).parentElement?.textContent).toMatch(/Pio l'attend déjà !/);
  });
});
