import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import QcmExercise from "../QcmExercise";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const FISH = String.fromCodePoint(0x1f41f);
const ELEPHANT = String.fromCodePoint(0x1f418);
const BANANA = String.fromCodePoint(0x1f34c);

const MANGOES = { options: ["4", "6", "5", "1"], correctIndex: 2 };

function renderQcm(overrides: Partial<React.ComponentProps<typeof QcmExercise>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    prompt: "Combien de mangues ?",
    payload: MANGOES,
    onSubmit,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<QcmExercise {...props} />);
  return { ...view, onSubmit, props };
}

const option = (letter: string) => screen.getByRole("button", { name: new RegExp(`^${letter}`) });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;

describe("le QCM : des tuiles qu'on choisit, la réponse part comme avant", () => {
  it("nomme chaque option par sa lettre collée à son texte, même sans pastille visible", () => {
    renderQcm();
    // Le nom d'avant (« A » + « 4 »), que la vitrine cherche avec /^[A-D]4$/.
    expect(screen.getByRole("button", { name: /^A4$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^C5$/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^[A-D]\d$/ })).toHaveLength(4);
  });

  it("envoie l'index de la tuile choisie en texte, et rien sans choix", () => {
    const { onSubmit } = renderQcm();
    expect(valider().disabled).toBe(true);
    fireEvent.click(option("C"));
    expect(option("C").getAttribute("aria-pressed")).toBe("true");
    expect(option("A").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(false);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith("2");
  });

  it("met des réponses courtes en deux colonnes et des phrases en une", () => {
    const { container, unmount } = renderQcm();
    expect(container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("deux-colonnes");
    unmount();
    const long = renderQcm({
      payload: { options: ["Parce que la lune tourne autour de la Terre.", "Parce que le soleil se couche."] },
    });
    expect(long.container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("une-colonne");
  });

  it("montre en grand l'émoji qui ouvre une option du CI", () => {
    renderQcm({ payload: { options: [`${FISH} le poisson`, `${ELEPHANT} l'éléphant`, `${BANANA} la banane`] } });
    const fish = option("A");
    expect(fish.textContent).toContain("le poisson");
    const big = fish.querySelector(".text-4xl");
    expect(big?.textContent).toBe(FISH);
  });

  it("juste : la tuile choisie gonfle en vert ; fausse : elle dit non en ambre, jamais en rouge", () => {
    const { container, rerender, props } = renderQcm();
    fireEvent.click(option("C"));
    rerender(<QcmExercise {...props} disabled isCorrect />);
    expect(option("C").getAttribute("data-state")).toBe("juste");
    expect(container.innerHTML).toContain("gk-pop");
    expect((option("A") as HTMLButtonElement).disabled).toBe(true);

    cleanup();
    const again = renderQcm();
    fireEvent.click(option("A"));
    again.rerender(<QcmExercise {...again.props} disabled isCorrect={false} />);
    expect(option("A").getAttribute("data-state")).toBe("fausse");
    expect(again.container.innerHTML).toContain("gk-shake-soft");
    expect(again.container.innerHTML).not.toMatch(/red-\d/);
  });

  it("après « pas tout à fait », la tuile se repose et l'enfant rechoisit", () => {
    const { rerender, props } = renderQcm();
    fireEvent.click(option("A"));
    rerender(<QcmExercise {...props} disabled isCorrect={false} />);
    rerender(<QcmExercise {...props} disabled={false} isCorrect={null} />);
    expect(option("A").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(true);
  });

  it("verrouillé, aucune tuile ne répond", () => {
    const { onSubmit } = renderQcm({ disabled: true });
    fireEvent.click(option("B"));
    expect(option("B").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <QcmExercise prompt="Combien de mangues ?" payload={MANGOES} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // L'énoncé, lui, n'a plus de bouton devant lui.
    expect(container.querySelector("p")?.closest("[data-scene-actions]")).toBeNull();
    expect(container.querySelector("p")?.parentElement?.querySelector("button")).toBeNull();
  });

  it("sans lecteur, la barre ne porte que Valider", () => {
    const { container } = renderQcm();
    expect([...container.querySelector("[data-scene-actions]")!.querySelectorAll("button")]).toHaveLength(1);
  });

  it("un exercice sans options se saute sans pénalité", () => {
    const onSkip = vi.fn();
    renderQcm({ payload: { options: ["seule"] }, onSkip });
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
