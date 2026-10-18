import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import FillBlankExercise from "../FillBlankExercise";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const PAYLOAD = {
  text: "Penda a ___ robe. Modou a ___ ballon.",
  blanks: [{ options: ["une", "un"] }, { options: ["un", "une"] }],
};

function renderBlanks(overrides: Partial<React.ComponentProps<typeof FillBlankExercise>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    prompt: "Choisis le petit mot qui va dans chaque phrase.",
    payload: PAYLOAD,
    onSubmit,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<FillBlankExercise {...props} />);
  return { ...view, onSubmit, props };
}

const word = (text: string) => screen.getByRole("button", { name: new RegExp(`^${text}$`) });
const hole = (pattern: RegExp) => screen.getByRole("button", { name: pattern });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;

describe("la phrase à trous : des jetons qui se posent, la réponse part en tableau", () => {
  it("remplit le trou actif, ouvre le suivant, et envoie un mot par trou", () => {
    const { onSubmit } = renderBlanks();
    expect(hole(/^Trou 1, vide$/)).toBeTruthy();
    expect(valider().disabled).toBe(true);

    fireEvent.click(word("une"));
    expect(hole(/^Trou 1 : une$/)).toBeTruthy();
    // Le mot est posé tout de suite : pas de vol dans jsdom (les boîtes mesurent zéro).
    expect(hole(/^Trou 1 : une$/).querySelector(".invisible")).toBeNull();
    expect(screen.getByText(/Trou 2 : choisis le bon mot/)).toBeTruthy();

    fireEvent.click(word("un"));
    expect(hole(/^Trou 2 : un$/)).toBeTruthy();
    expect(valider().disabled).toBe(false);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["une", "un"]));
  });

  it("toucher un trou rempli permet de changer d'avis", () => {
    renderBlanks();
    fireEvent.click(word("une"));
    fireEvent.click(word("un"));
    fireEvent.click(hole(/^Trou 1 : une$/));
    expect(screen.getByText(/Trou 1 : choisis le bon mot/)).toBeTruthy();
    expect(word("une").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(word("un"));
    expect(hole(/^Trou 1 : un$/)).toBeTruthy();
  });

  it("juste : la phrase gonfle en vert ; fausse : elle dit non en ambre, sans rouge", () => {
    const { container, rerender, props } = renderBlanks();
    fireEvent.click(word("une"));
    fireEvent.click(word("un"));
    rerender(<FillBlankExercise {...props} disabled isCorrect />);
    expect(container.innerHTML).toContain("gk-pop");
    expect(container.innerHTML).toContain("#16a34a");
    rerender(<FillBlankExercise {...props} disabled isCorrect={false} />);
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/red-\d|#dc2626/);
  });

  it("verrouillée, rien ne bouge", () => {
    const { onSubmit } = renderBlanks({ disabled: true });
    fireEvent.click(word("une"));
    expect(hole(/^Trou 1, vide$/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("une phrase sans trou se saute", () => {
    const onSkip = vi.fn();
    renderBlanks({ payload: { text: "Pas de trou ici.", blanks: [] }, onSkip });
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <FillBlankExercise prompt="Choisis le petit mot." payload={PAYLOAD} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // Seul le jeton en vol (absolu, sans place) peut suivre la barre.
    expect(bar!.nextElementSibling?.className ?? "").toMatch(/^$|absolute/);
    expect(hole(/^Trou 1, vide$/)).toBeTruthy();
  });
});
