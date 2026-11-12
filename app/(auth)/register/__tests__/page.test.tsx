import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { INVITATION_REFUSALS } from "@/convex/invitationRules";

/**
 * AVANT LE LANCEMENT, `/register` n'ouvre son formulaire qu'à qui présente un
 * code d'invitation reconnu par le serveur. Sans code : l'annonce « Lancement
 * prochainement » et la saisie du code.
 */
type Check = { ok: true } | { ok: false; reason: string; message: string };

const state = vi.hoisted(() => ({
  /** La chaîne de requête de l'adresse (`?code=…&role=…`). */
  search: "",
  /** Ce que répond la lecture vivante `invitations.check` ; `undefined` : en cours. */
  check: undefined as Check | undefined,
  /** Les arguments avec lesquels la lecture vivante a été demandée. */
  checkArgs: [] as unknown[],
  /** La vérification ponctuelle faite par le champ de saisie. */
  query: vi.fn(),
  signIn: vi.fn(),
  replace: vi.fn(),
  createMySchool: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    invitations: { check: "invitations:check" },
    schoolSpace: { createMySchool: "schoolSpace:createMySchool" },
  },
}));
vi.mock("convex/react", () => ({
  useQuery: (_query: unknown, args: unknown) => {
    state.checkArgs.push(args);
    return args === "skip" ? undefined : state.check;
  },
  useMutation: () => state.createMySchool,
  useConvex: () => ({ query: state.query }),
}));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: state.signIn }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
  useSearchParams: () => new URLSearchParams(state.search),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import RegisterPage from "../page";

const CODE = "JOTNA-7C4K-2MQX";

beforeEach(() => {
  state.search = "";
  state.check = undefined;
  state.checkArgs = [];
  state.query = vi.fn();
  state.signIn = vi.fn().mockResolvedValue({ signingIn: true });
  state.replace = vi.fn();
  state.createMySchool = vi.fn().mockResolvedValue(null);
});
afterEach(cleanup);

const announcement = () =>
  screen.queryByRole("heading", { name: "Lancement prochainement" });
const codeField = () =>
  screen.getByPlaceholderText("JOTNA-XXXX-XXXX") as HTMLInputElement;
const emailField = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="email"]');
const passwordField = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="password"]');

function fillAndSubmit(container: HTMLElement) {
  fireEvent.change(container.querySelector('input[autocomplete="name"]')!, {
    target: { value: "Awa Diop" },
  });
  fireEvent.change(emailField(container)!, {
    target: { value: "awa@exemple.sn" },
  });
  fireEvent.change(passwordField(container)!, {
    target: { value: "secret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
}

describe("/register sans code d'invitation", () => {
  it("annonce le lancement et ne montre aucun formulaire d'inscription", () => {
    const { container } = render(<RegisterPage />);

    expect(announcement()).toBeTruthy();
    expect(container.textContent).toContain(
      "Jotna School n'est pas encore en ligne : le projet est en cours de lancement.",
    );
    expect(codeField().value).toBe("");
    expect(emailField(container)).toBeNull();
    expect(passwordField(container)).toBeNull();
    expect(screen.queryByRole("button", { name: "Créer mon compte" })).toBeNull();
    // Rien à vérifier tant qu'aucun code n'est présenté.
    expect(state.checkArgs.every((args) => args === "skip")).toBe(true);
  });

  it("ne se laisse pas ouvrir par le seul type de compte dans l'adresse", () => {
    state.search = "role=parent";
    const { container } = render(<RegisterPage />);
    expect(announcement()).toBeTruthy();
    expect(emailField(container)).toBeNull();
  });

  it("garde la porte des familles qui ont un billet de l'école, et la connexion", () => {
    render(<RegisterPage />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/register/code", "/login"]);
  });

  it("refuse un code saisi que le serveur ne reconnaît pas", async () => {
    state.query.mockResolvedValue({
      ok: false,
      reason: "unknown",
      message: INVITATION_REFUSALS.unknown,
    });
    const { container } = render(<RegisterPage />);
    fireEvent.change(codeField(), { target: { value: "JOTNA-AAAA-BBBB" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(INVITATION_REFUSALS.unknown);
    expect(emailField(container)).toBeNull();
  });

  it("ouvre le choix du type de compte quand le code saisi est reconnu", async () => {
    state.query.mockResolvedValue({ ok: true });
    render(<RegisterPage />);
    fireEvent.change(codeField(), { target: { value: CODE } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByText("Code d'invitation accepté")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Créer un compte" })).toBeTruthy();
    expect(announcement()).toBeNull();
    expect(state.query).toHaveBeenCalledWith("invitations:check", { code: CODE });
  });
});

describe("/register avec un lien d'invitation (?code=…)", () => {
  it("attend la réponse du serveur : ni annonce, ni formulaire", () => {
    state.search = `code=${CODE}`;
    const { container } = render(<RegisterPage />);

    expect(announcement()).toBeNull();
    expect(emailField(container)).toBeNull();
    expect(container.textContent).toContain("Vérification du code d'invitation");
    expect(state.checkArgs).toContainEqual({ code: CODE });
  });

  it("montre pourquoi un lien est refusé, code prérempli, sans formulaire", () => {
    state.search = `code=${CODE}`;
    state.check = {
      ok: false,
      reason: "exhausted",
      message: INVITATION_REFUSALS.exhausted,
    };
    const { container } = render(<RegisterPage />);

    expect(announcement()).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      INVITATION_REFUSALS.exhausted,
    );
    expect(codeField().value).toBe(CODE);
    expect(emailField(container)).toBeNull();
  });

  it("ouvre le choix du type de compte sur un lien valide", () => {
    state.search = `code=${CODE}`;
    state.check = { ok: true };
    render(<RegisterPage />);

    expect(screen.getByText("Code d'invitation accepté")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Créer un compte" })).toBeTruthy();
    expect(announcement()).toBeNull();
  });

  it("ouvre directement le bon formulaire quand le lien porte aussi le type de compte", () => {
    state.search = `code=${CODE}&role=professeur`;
    state.check = { ok: true };
    const { container } = render(<RegisterPage />);

    expect(screen.getByRole("heading", { name: "Compte professeur" })).toBeTruthy();
    expect(emailField(container)).toBeTruthy();
  });

  it("envoie le code d'invitation au serveur avec l'inscription", async () => {
    state.search = `code=${CODE}&role=parent`;
    state.check = { ok: true };
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);

    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/post-auth"));
    expect(state.signIn).toHaveBeenCalledWith("password", {
      flow: "signUp",
      email: "awa@exemple.sn",
      password: "secret123",
      name: "Awa Diop",
      role: "parent",
      invitationCode: CODE,
    });
  });

  it("ne revient pas à l'annonce quand le code vient d'être consommé par cette inscription", () => {
    // La lecture `check` est vivante : après l'inscription, un code à une
    // place répond « déjà utilisé ». L'écran ne doit pas se retourner contre
    // la personne qui vient de réussir.
    state.search = `code=${CODE}&role=parent`;
    state.check = { ok: true };
    const { container, rerender } = render(<RegisterPage />);
    expect(emailField(container)).toBeTruthy();

    state.check = {
      ok: false,
      reason: "exhausted",
      message: INVITATION_REFUSALS.exhausted,
    };
    rerender(<RegisterPage />);

    expect(emailField(container)).toBeTruthy();
    expect(announcement()).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    // Une fois le code accepté, la page cesse d'écouter le serveur.
    expect(state.checkArgs.at(-1)).toBe("skip");
  });
});

describe("/register quand le serveur refuse à l'envoi du formulaire", () => {
  it("revient à la saisie du code, avec la phrase du serveur, si c'est le code qui est refusé", async () => {
    state.search = `code=${CODE}&role=parent`;
    state.check = { ok: true };
    // Une `ConvexError` arrive au client avec sa phrase dans `data`.
    state.signIn.mockRejectedValue(
      Object.assign(new Error("[CONVEX A(auth:signIn)] Server Error"), {
        data: INVITATION_REFUSALS.exhausted,
      }),
    );
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(INVITATION_REFUSALS.exhausted);
    expect(announcement()).toBeTruthy();
    expect(codeField().value).toBe(CODE);
    expect(emailField(container)).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("garde le formulaire rempli pour toute autre erreur", async () => {
    state.search = `code=${CODE}&role=parent`;
    state.check = { ok: true };
    state.signIn.mockRejectedValue(
      new Error("Account awa@exemple.sn already exists"),
    );
    const { container } = render(<RegisterPage />);
    fillAndSubmit(container);

    expect(
      await screen.findByText(/Un compte existe déjà avec cette adresse/),
    ).toBeTruthy();
    expect(emailField(container)?.value).toBe("awa@exemple.sn");
    expect(announcement()).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });
});
