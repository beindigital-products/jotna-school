import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * AVANT LE LANCEMENT (demande du propriétaire, 12 novembre 2026) : la vitrine
 * annonce « Lancement prochainement », garde ses boutons d'inscription, et
 * chacun d'eux ouvre la pop-up au lieu du formulaire.
 *
 * Ce fichier tient les deux bouts : les mots de l'annonce, et le fait que
 * CHAQUE bouton d'inscription de la page passe par la pop-up. Un bouton
 * rebranché en simple lien mènerait encore à `/register`, qui est fermé lui
 * aussi, mais ce ne serait plus la pop-up demandée.
 */
vi.mock("@/convex/_generated/api", () => ({
  api: { invitations: { check: "invitations:check" } },
}));
vi.mock("convex/react", () => ({ useConvex: () => ({ query: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("../use-media-query", () => ({ useMediaQuery: () => true }));

import { SignupGateProvider } from "@/components/launch/signup-gate";
import { ExerciseTypes } from "../exercise-types";
import { FAQ } from "../faq";
import { Footer } from "../footer";
import { GetStarted } from "../get-started";
import { Hero } from "../hero";
import { Navbar } from "../navbar";

beforeAll(() => {
  // jsdom n'a ni observateur d'intersection ni lecture de média.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(cleanup);

/** Les liens d'inscription d'un rendu : tout ce qui vise `/register`, sauf le billet d'école. */
function signupLinks(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(
    container.querySelectorAll<HTMLAnchorElement>('a[href^="/register"]'),
  ).filter((a) => !a.getAttribute("href")!.startsWith("/register/code"));
}

describe("la vitrine annonce le lancement", () => {
  it("le dit dès le haut de la page, à la place de « Gratuit, ouvert à tous »", () => {
    const { container } = render(<Hero />);
    expect(screen.getByText("Lancement prochainement")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Gratuit, ouvert/);
    // Le bouton d'inscription est toujours là.
    expect(screen.getByRole("link", { name: "S'inscrire" })).toBeTruthy();
  });

  it("le redit dans la section « Commencer », sans promettre une inscription libre", () => {
    const { container } = render(<GetStarted />);
    expect(screen.getByText("Lancement prochainement")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Jotna School ouvre bientôt." }),
    ).toBeTruthy();
    expect(container.textContent).toContain("Vous avez reçu un code d'invitation ?");
    expect(container.textContent).not.toMatch(/s'inscrivent librement/);
  });

  it("répond à « quand ? » en tête des questions fréquentes", () => {
    render(<FAQ />);
    const questions = screen.getAllByRole("button").map((b) => b.textContent);
    expect(questions[0]).toBe("Quand Jotna School sera-t-il disponible ?");
  });
});

describe("chaque bouton d'inscription de la vitrine ouvre la pop-up", () => {
  const sections: Array<[string, ReactElement, number]> = [
    ["le haut de la page", <Hero key="hero" />, 1],
    ["la barre de navigation", <Navbar key="navbar" />, 1],
    ["la section des exercices", <ExerciseTypes key="exercises" />, 1],
    ["la section « Commencer »", <GetStarted key="start" />, 3],
    ["le pied de page", <Footer key="footer" />, 1],
  ];

  it.each(sections)("%s", async (_name, section, expected) => {
    const { container } = render(<SignupGateProvider>{section}</SignupGateProvider>);
    const links = signupLinks(container);
    expect(links).toHaveLength(expected);

    for (const link of links) {
      // Le clic est retenu par le bouton : on ne part pas vers le formulaire.
      expect(fireEvent.click(link)).toBe(false);
      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByRole("heading", { name: "Lancement prochainement" }),
      ).toBeTruthy();
      fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
      await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
  });

  it("le pied de page garde la porte des familles qui ont un billet de l'école", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: "J'ai un code d'école" }).getAttribute("href"),
    ).toBe("/register/code");
  });
});
