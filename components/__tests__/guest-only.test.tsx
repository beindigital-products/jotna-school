import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  profile: undefined as { role?: string } | null | undefined,
  replace: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: { profiles: { getCurrentProfile: "profile" } },
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isLoading: state.isLoading, isAuthenticated: state.isAuthenticated }),
  useQuery: (_q: unknown, args: unknown) => (args === "skip" ? undefined : state.profile),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
}));

import { GuestOnly } from "../guest-only";

function storeSession() {
  localStorage.setItem("__convexAuthJWT_test", "jwt");
}

const form = <p>Formulaire de connexion</p>;

beforeEach(() => {
  state.isLoading = false;
  state.isAuthenticated = false;
  state.profile = undefined;
  state.replace = vi.fn();
  localStorage.clear();
});
afterEach(cleanup);

describe("les écrans de connexion", () => {
  it("s'affichent pour un visiteur sans session", () => {
    render(<GuestOnly>{form}</GuestOnly>);
    expect(screen.getByText("Formulaire de connexion")).toBeTruthy();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("renvoient un compte connecté vers son espace", () => {
    storeSession();
    state.isAuthenticated = true;
    state.profile = { role: "professeur" };
    render(<GuestOnly>{form}</GuestOnly>);
    expect(screen.queryByText("Formulaire de connexion")).toBeNull();
    expect(state.replace).toHaveBeenCalledWith("/teacher/dashboard");
  });

  it("ne montrent rien tant que la session se vérifie", () => {
    storeSession();
    state.isLoading = true;
    render(<GuestOnly>{form}</GuestOnly>);
    expect(screen.queryByText("Formulaire de connexion")).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("s'affichent quand la session gardée est refusée", () => {
    storeSession();
    render(<GuestOnly>{form}</GuestOnly>);
    expect(screen.getByText("Formulaire de connexion")).toBeTruthy();
  });

  it("gardent un compte sans rôle, pour ne pas boucler", () => {
    storeSession();
    state.isAuthenticated = true;
    state.profile = null;
    render(<GuestOnly>{form}</GuestOnly>);
    expect(screen.getByText("Formulaire de connexion")).toBeTruthy();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("laissent un formulaire ouvrir sa session sans l'interrompre", () => {
    const { rerender } = render(<GuestOnly>{form}</GuestOnly>);
    // L'inscription vient d'ouvrir la session, l'école n'est pas encore créée.
    storeSession();
    state.isAuthenticated = true;
    state.profile = { role: "directeur" };
    rerender(<GuestOnly>{form}</GuestOnly>);
    expect(screen.getByText("Formulaire de connexion")).toBeTruthy();
    expect(state.replace).not.toHaveBeenCalled();
  });
});
