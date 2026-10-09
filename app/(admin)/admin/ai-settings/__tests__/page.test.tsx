import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Chaque requête Convex est désignée par une étiquette, pour que le faux
// `useQuery` sache quoi rendre. `loaded` simule l'arrivée des données.
const state = vi.hoisted(() => ({ loaded: false }));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    profiles: { getCurrentProfile: "profile" },
    settings: {
      index: {
        getSettings: "settings",
        getMonthSpendSummary: "summary",
        listRecentIncidents: "incidents",
        updateSettings: "updateSettings",
      },
    },
  },
}));

const loadedData: Record<string, unknown> = {
  profile: { role: "admin" },
  settings: { aiMonthlyBudgetUsd: 250, economyMode: true, dailyMoreLimitPerKid: 4 },
  summary: {
    month: "2026-10",
    total: 12.5,
    byPurpose: {},
    calls: 40,
    failed: 1,
    rejectedBudget: 0,
    rejectedQuota: 2,
  },
  incidents: [],
};

// Une copie à chaque appel : la page ne doit pas dépendre de l'identité de
// l'objet renvoyé par Convex.
vi.mock("convex/react", () => ({
  useQuery: (ref: string) =>
    state.loaded ? structuredClone(loadedData[ref]) : undefined,
  useMutation: () => vi.fn(),
}));

import AdminAiSettingsPage from "../page";

beforeEach(() => {
  state.loaded = false;
});

describe("la page des réglages IA", () => {
  it("s'affiche quand les réglages arrivent après le premier rendu", () => {
    const { rerender } = render(<AdminAiSettingsPage />);
    expect(screen.getByText("Chargement des paramètres...")).toBeTruthy();

    state.loaded = true;
    rerender(<AdminAiSettingsPage />);

    expect(screen.getByRole("heading", { name: /AI Gateway/ })).toBeTruthy();
  });

  it("remplit le formulaire avec les réglages enregistrés", () => {
    const { rerender } = render(<AdminAiSettingsPage />);
    state.loaded = true;
    rerender(<AdminAiSettingsPage />);

    const [budget, dailyMore] = screen.getAllByRole("spinbutton");
    expect((budget as HTMLInputElement).value).toBe("250");
    expect((dailyMore as HTMLInputElement).value).toBe("4");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });

  it("remplit aussi le formulaire quand les réglages sont déjà en cache", () => {
    state.loaded = true;
    render(<AdminAiSettingsPage />);

    const [budget] = screen.getAllByRole("spinbutton");
    expect((budget as HTMLInputElement).value).toBe("250");
  });
});
