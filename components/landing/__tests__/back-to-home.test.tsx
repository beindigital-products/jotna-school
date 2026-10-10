import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const platform = vi.hoisted(() => ({ native: false }));
vi.mock("@/hooks/use-native-app", () => ({ useIsNativeApp: () => platform.native }));

import AuthLayout from "@/app/(auth)/layout";
import { BackToHome } from "../back-to-home";

describe("« Retour à l'accueil » des pages de connexion et d'inscription", () => {
  it("ramène à la vitrine sur le web", () => {
    platform.native = false;
    render(<BackToHome />);
    expect(screen.getByRole("link", { name: "Retour à l'accueil" }).getAttribute("href")).toBe("/");
  });

  it("n'existe pas dans l'application iOS/Android, dont la vitrine renvoie à la connexion", () => {
    platform.native = true;
    const { container } = render(<BackToHome />);
    expect(container.innerHTML).toBe("");
  });

  it("est dans la mise en page commune : connexion, inscription, mot de passe oublié", () => {
    platform.native = false;
    render(
      <AuthLayout>
        <p>le formulaire</p>
      </AuthLayout>,
    );
    expect(screen.getByRole("link", { name: "Retour à l'accueil" }).getAttribute("href")).toBe("/");
    expect(screen.getByText("le formulaire")).toBeTruthy();
  });
});
