import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

/**
 * AVANT LE LANCEMENT : un bouton d'inscription ouvre la pop-up « Lancement
 * prochainement », et seul un code d'invitation reconnu par le serveur mène
 * au formulaire.
 */
const state = vi.hoisted(() => ({
  push: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: { invitations: { check: "invitations:check" } },
}));
vi.mock("convex/react", () => ({
  useConvex: () => ({ query: state.query }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
}));

import { SignupGateProvider, SignupLink } from "../signup-gate";

beforeEach(() => {
  state.push = vi.fn();
  state.query = vi.fn();
});
afterEach(cleanup);

function renderGate() {
  return render(
    <SignupGateProvider>
      <SignupLink>S&apos;inscrire</SignupLink>
      <SignupLink signupRole="professeur">Créer mon compte professeur</SignupLink>
    </SignupGateProvider>,
  );
}

/**
 * Clique, et dit si le composant a RETENU le clic (`preventDefault`).
 *
 * L'écouteur posé sur le document passe après ceux de React : il lit le
 * verdict du composant, puis retient lui-même le clic, pour que jsdom ne
 * tente pas de « naviguer » vers le lien (il ne sait pas, et l'écrit dans la
 * sortie des tests).
 */
function click(element: HTMLElement, init?: MouseEventInit): { held: boolean } {
  const verdict = { held: false };
  document.addEventListener(
    "click",
    (event) => {
      verdict.held = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true },
  );
  fireEvent.click(element, init);
  return verdict;
}

async function openPopup(name = "S'inscrire") {
  fireEvent.click(screen.getByRole("link", { name }));
  return await screen.findByRole("dialog");
}

async function submitCode(code: string) {
  fireEvent.change(screen.getByPlaceholderText("JOTNA-XXXX-XXXX"), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
}

describe("un bouton d'inscription, sans la pop-up autour", () => {
  it("reste un lien vers /register, qui affiche la même annonce", () => {
    render(<SignupLink>S&apos;inscrire</SignupLink>);
    const link = screen.getByRole("link", { name: "S'inscrire" });
    expect(link.getAttribute("href")).toBe("/register");
    expect(link.getAttribute("aria-haspopup")).toBeNull();

    // Le clic n'est pas retenu : le navigateur suit le lien.
    expect(click(link).held).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("porte le type de compte du bouton", () => {
    render(<SignupLink signupRole="directeur">Inscrire mon école</SignupLink>);
    expect(
      screen.getByRole("link", { name: "Inscrire mon école" }).getAttribute("href"),
    ).toBe("/register?role=directeur");
  });

  it("appelle le `onClick` de l'appelant (le menu mobile s'y referme)", () => {
    const onClick = vi.fn();
    render(<SignupLink onClick={onClick}>S&apos;inscrire</SignupLink>);
    click(screen.getByRole("link", { name: "S'inscrire" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("la pop-up « Lancement prochainement »", () => {
  it("s'ouvre au clic, sans quitter la page, et annonce le lancement", async () => {
    renderGate();
    const link = screen.getByRole("link", { name: "S'inscrire" });
    expect(link.getAttribute("aria-haspopup")).toBe("dialog");

    // Le clic est retenu : pas de navigation vers le formulaire.
    expect(click(link).held).toBe(true);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Lancement prochainement");
    expect(dialog.textContent).toContain(
      "Jotna School n'est pas encore en ligne : le projet est en cours de lancement.",
    );
    expect(dialog.textContent).toContain("Vous avez reçu un code d'invitation ?");
    expect(state.push).not.toHaveBeenCalled();
  });

  it("laisse un clic « nouvel onglet » suivre le lien", () => {
    renderGate();
    const link = screen.getByRole("link", { name: "S'inscrire" });
    expect(click(link, { ctrlKey: true }).held).toBe(false);
    expect(click(link, { metaKey: true }).held).toBe(false);
    expect(click(link, { button: 1 }).held).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("refuse un code que le serveur ne reconnaît pas, avec la phrase du serveur", async () => {
    state.query.mockResolvedValue({
      ok: false,
      reason: "unknown",
      message: "Ce code d'invitation n'existe pas.",
    });
    renderGate();
    await openPopup();
    await submitCode("JOTNA-AAAA-BBBB");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Ce code d'invitation n'existe pas.");
    expect(state.query).toHaveBeenCalledWith("invitations:check", {
      code: "JOTNA-AAAA-BBBB",
    });
    expect(state.push).not.toHaveBeenCalled();
    // La pop-up reste ouverte, pour corriger sur place.
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("mène au formulaire avec un code reconnu, et se referme", async () => {
    state.query.mockResolvedValue({ ok: true });
    renderGate();
    await openPopup();
    await submitCode("  JOTNA-7C4K-2MQX ");

    await waitFor(() =>
      expect(state.push).toHaveBeenCalledWith("/register?code=JOTNA-7C4K-2MQX"),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("garde le type de compte du bouton cliqué", async () => {
    state.query.mockResolvedValue({ ok: true });
    renderGate();
    await openPopup("Créer mon compte professeur");
    await submitCode("JOTNA-7C4K-2MQX");

    await waitFor(() =>
      expect(state.push).toHaveBeenCalledWith(
        "/register?code=JOTNA-7C4K-2MQX&role=professeur",
      ),
    );
  });

  it("dit que la vérification a échoué quand le serveur ne répond pas", async () => {
    state.query.mockRejectedValue(new Error("réseau coupé"));
    renderGate();
    await openPopup();
    await submitCode("JOTNA-7C4K-2MQX");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("n'a pas pu être vérifié");
    expect(state.push).not.toHaveBeenCalled();
    // On peut réessayer : le bouton n'est pas resté en attente.
    expect(
      (screen.getByRole("button", { name: "Continuer" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("efface le refus dès que la personne corrige son code", async () => {
    state.query.mockResolvedValue({
      ok: false,
      reason: "unknown",
      message: "Ce code d'invitation n'existe pas.",
    });
    renderGate();
    await openPopup();
    await submitCode("JOTNA-AAAA-BBBB");
    await screen.findByRole("alert");

    fireEvent.change(screen.getByPlaceholderText("JOTNA-XXXX-XXXX"), {
      target: { value: "JOTNA-AAAA-BBBC" },
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("propose la connexion à qui a déjà un compte", async () => {
    renderGate();
    const dialog = await openPopup();
    const login = Array.from(dialog.querySelectorAll("a")).find(
      (a) => a.textContent === "Se connecter",
    );
    expect(login?.getAttribute("href")).toBe("/login");
  });
});
