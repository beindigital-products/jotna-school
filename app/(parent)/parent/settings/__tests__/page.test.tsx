import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// `loaded` simule l'arrivée du profil, qui manque au premier rendu tant que
// la requête Convex charge.
const state = vi.hoisted(() => ({ loaded: false }));

vi.mock("@/convex/_generated/api", () => ({
  api: { profiles: { getCurrentProfile: "profile", updateProfile: "updateProfile" } },
}));
vi.mock("convex/react", () => ({
  useQuery: () =>
    state.loaded
      ? { name: "Awa Diallo", preferences: { receiveReports: false } }
      : undefined,
  useMutation: () => vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import ParentSettingsPage from "../page";

beforeEach(() => {
  state.loaded = false;
});

describe("les paramètres du parent", () => {
  it("reprennent le profil quand il arrive après le premier rendu", () => {
    const { rerender } = render(<ParentSettingsPage />);
    state.loaded = true;
    rerender(<ParentSettingsPage />);

    expect((screen.getByLabelText(/nom/i) as HTMLInputElement).value).toBe("Awa Diallo");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("reprennent aussi un profil déjà en cache", () => {
    state.loaded = true;
    render(<ParentSettingsPage />);

    expect((screen.getByLabelText(/nom/i) as HTMLInputElement).value).toBe("Awa Diallo");
  });
});
