import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// `loaded` simule l'arrivée du profil, qui manque au premier rendu tant que
// la requête Convex charge.
const state = vi.hoisted(() => ({ loaded: false }));

vi.mock("@/convex/_generated/api", () => ({
  api: { profiles: { getCurrentProfile: "profile", updateProfile: "updateProfile" } },
}));
vi.mock("convex/react", () => ({
  useQuery: () => (state.loaded ? { name: "Moussa Ndiaye" } : undefined),
  useMutation: () => vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import TeacherSettingsPage from "../page";

beforeEach(() => {
  state.loaded = false;
});

describe("les paramètres du professeur", () => {
  it("reprennent le profil quand il arrive après le premier rendu", () => {
    const { rerender } = render(<TeacherSettingsPage />);
    state.loaded = true;
    rerender(<TeacherSettingsPage />);

    expect((screen.getByLabelText(/nom/i) as HTMLInputElement).value).toBe("Moussa Ndiaye");
  });

  it("reprennent aussi un profil déjà en cache", () => {
    state.loaded = true;
    render(<TeacherSettingsPage />);

    expect((screen.getByLabelText(/nom/i) as HTMLInputElement).value).toBe("Moussa Ndiaye");
  });
});
