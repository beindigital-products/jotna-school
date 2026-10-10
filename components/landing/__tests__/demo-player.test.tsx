import { act } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import DemoPlayer from "../demo/demo-player";
import { BANK } from "../demo/bank/mathematiques";
import { toPlayable } from "../demo/playable";

// Les confettis dessinent sur un canvas : jsdom n'en a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Les animations s'achèvent aussitôt : une bande qui s'en va ne reste pas dans la page.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Le QCM de CE2 : « 56 mangues en 7 tas », la bonne réponse est « 8 ». */
const item = BANK.CE2.find((entry) => entry.type === "qcm")!;
const exercise = toPlayable(item, "mathematiques", "CE2");
const hints = item.hints;

const pick = (name: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^[A-D]${name}$`) }));
const validate = () => fireEvent.click(screen.getByRole("button", { name: "Valider" }));
const answer = (name: string) => {
  pick(name);
  validate();
};
/** Laisse passer le temps où « Pas tout à fait » reste affiché. */
const waitForDismiss = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(2700);
  });

describe("le lecteur de la vitrine : un exercice de l'élève, sans compte", () => {
  it("montre la consigne et les quatre propositions, sans indice ni « Réessayer »", () => {
    render(<DemoPlayer exercise={exercise} />);
    expect(screen.getByText(item.prompt)).toBeTruthy();
    for (const option of ["7", "49", "9", "8"]) expect(screen.getByRole("button", { name: new RegExp(`^[A-D]${option}$`) })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Réessayer/ })).toBeNull();
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("ne montre pas la bonne réponse avant que l'enfant réponde", () => {
    const { container } = render(<DemoPlayer exercise={exercise} />);
    expect(container.innerHTML).not.toContain("correctIndex");
    expect(screen.queryByText("Voici la bonne réponse")).toBeNull();
  });

  it("fête une bonne réponse avec Pio, et propose de recommencer", () => {
    render(<DemoPlayer exercise={exercise} />);
    answer("8");
    const status = screen.getByRole("status");
    expect(status.querySelector("img")?.getAttribute("src")).toBe("/images/pio/mini/cheer.webp");
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();
    expect(screen.getByRole("button", { name: /Réessayer/ })).toBeTruthy();
  });

  it("encourage après une erreur, compte les essais, puis rend la main", async () => {
    render(<DemoPlayer exercise={exercise} />);
    answer("7");
    const status = screen.getByRole("status");
    expect(status.querySelector("img")?.getAttribute("src")).toBe("/images/pio/mini/encourage.webp");
    expect(status.textContent).toContain("Encore 2 essais");

    await waitForDismiss();
    // L'enfant peut rechoisir : les propositions sont de nouveau actives.
    expect((screen.getByRole("button", { name: /^D8$/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("ouvre les indices comme la séance : le 1er après un essai raté, le 2e après deux", async () => {
    render(<DemoPlayer exercise={exercise} />);
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();

    answer("7");
    await waitForDismiss();
    fireEvent.click(screen.getByRole("button", { name: "Voir un indice" }));
    expect(screen.getByText(hints[0])).toBeTruthy();
    // Un seul indice à la fois : il faut rater encore pour ouvrir le suivant.
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();

    answer("49");
    await waitForDismiss();
    fireEvent.click(screen.getByRole("button", { name: "Voir un indice" }));
    expect(screen.getByText(hints[1])).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();
  });

  it("donne la bonne réponse et son explication au troisième essai raté", async () => {
    render(<DemoPlayer exercise={exercise} />);
    answer("7");
    await waitForDismiss();
    answer("49");
    await waitForDismiss();
    answer("9");

    const status = screen.getByRole("status");
    expect(status.querySelector("img")?.getAttribute("src")).toBe("/images/pio/mini/sad.webp");
    expect(status.textContent).toContain("Voici la bonne réponse");
    expect(status.textContent).toContain("8");
    expect(status.textContent).toContain("56 ÷ 7 = 8, car 7 × 8 = 56.");
    // Plus d'essai : le message reste jusqu'à « Réessayer ».
    await waitForDismiss();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("repart de zéro à « Réessayer »", async () => {
    render(<DemoPlayer exercise={exercise} />);
    answer("7");
    await waitForDismiss();
    fireEvent.click(screen.getByRole("button", { name: "Voir un indice" }));
    fireEvent.click(screen.getByRole("button", { name: /Réessayer/ }));

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByText(hints[0])).toBeNull();
    expect(screen.queryByRole("button", { name: /Réessayer/ })).toBeNull();
    // L'écran est neuf : aucune proposition n'est restée choisie.
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("propose « Un autre exemple » seulement quand il y en a un", () => {
    const onAnother = vi.fn();
    const { rerender } = render(<DemoPlayer exercise={exercise} />);
    expect(screen.queryByRole("button", { name: /Un autre exemple/ })).toBeNull();

    rerender(<DemoPlayer exercise={exercise} onAnother={onAnother} />);
    fireEvent.click(screen.getByRole("button", { name: /Un autre exemple/ }));
    expect(onAnother).toHaveBeenCalledTimes(1);
  });
});
