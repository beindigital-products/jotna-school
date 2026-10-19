import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import PatternExercise from "../PatternExercise";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const RED = String.fromCodePoint(0x1f534);
const YELLOW = String.fromCodePoint(0x1f7e1);
const GREEN = String.fromCodePoint(0x1f7e2);

// Rouge, jaune, rouge, ?, rouge, ? : deux trous, la réponse est « jaune, jaune ».
const PAYLOAD = { sequence: [RED, YELLOW, RED, null, RED, null], options: [RED, YELLOW, GREEN] };

function renderPattern(overrides: Partial<React.ComponentProps<typeof PatternExercise>> = {}) {
  const onSubmit = vi.fn();
  const onSkip = vi.fn();
  const props = {
    prompt: "Complète la frise de couleurs.",
    payload: PAYLOAD,
    onSubmit,
    onSkip,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<PatternExercise {...props} />);
  return { ...view, onSubmit, onSkip, props };
}

const placer = (token: string) => screen.getByRole("button", { name: `Placer ${token}` });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;
const socket = (n: number) => screen.getByRole("button", { name: new RegExp(`^Case (vide )?${n}`) });

describe("la frise : des perles qu'on enfile, la réponse part comme avant", () => {
  it("pose la perle touchée dans le trou qui attend, puis allume le trou suivant", () => {
    renderPattern();
    expect(screen.getByRole("button", { name: "Case vide 1" })).toBeTruthy();
    expect(valider().disabled).toBe(true);

    fireEvent.click(placer(YELLOW));
    expect(screen.getByRole("button", { name: `Case 1 : ${YELLOW}, toucher pour la vider` })).toBeTruthy();
    expect(socket(1).getAttribute("data-filled")).toBe("1");
    expect(socket(2).getAttribute("data-filled")).toBe("0");
    // Sans ressort (jsdom), la perle est posée tout de suite.
    expect(socket(1).querySelector("[data-bead]")).not.toBeNull();
    expect(valider().disabled).toBe(true);

    fireEvent.click(placer(GREEN));
    expect(socket(2).getAttribute("data-filled")).toBe("1");
    expect(valider().disabled).toBe(false);
  });

  it("envoie les perles posées, de gauche à droite, en JSON comme avant", () => {
    const { onSubmit } = renderPattern();
    fireEvent.click(placer(YELLOW));
    fireEvent.click(placer(YELLOW));
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify([YELLOW, YELLOW]));
  });

  it("toucher une perle posée la rend à la boîte, et ce trou redevient celui qui attend", () => {
    renderPattern();
    fireEvent.click(placer(YELLOW));
    fireEvent.click(placer(GREEN));
    fireEvent.click(socket(1));
    expect(screen.getByRole("button", { name: "Case vide 1" })).toBeTruthy();
    expect(valider().disabled).toBe(true);
    // La prochaine perle va dans le trou vidé, pas ailleurs.
    fireEvent.click(placer(RED));
    expect(screen.getByRole("button", { name: `Case 1 : ${RED}, toucher pour la vider` })).toBeTruthy();
  });

  it("ne bouge plus quand l'exercice est verrouillé", () => {
    const { onSubmit } = renderPattern({ disabled: true });
    fireEvent.click(placer(YELLOW));
    expect(socket(1).getAttribute("data-filled")).toBe("0");
    expect(valider().disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("colore les perles posées et la table selon le verdict, vert ou ambre, jamais rouge", () => {
    const { rerender, props } = renderPattern();
    fireEvent.click(placer(YELLOW));
    fireEvent.click(placer(YELLOW));

    rerender(<PatternExercise {...props} disabled isCorrect />);
    expect(document.querySelectorAll('[data-bead="juste"]')).toHaveLength(2);
    expect(document.querySelector('[data-verdict="juste"]')).not.toBeNull();

    rerender(<PatternExercise {...props} disabled isCorrect={false} />);
    expect(document.querySelectorAll('[data-bead="fausse"]')).toHaveLength(2);
    expect(document.querySelector('[data-verdict="faux"]')).not.toBeNull();
    expect(document.querySelector(".border-red-400")).toBeNull();
  });

  it("saute un exercice sans trou, sans pénalité", () => {
    const { onSkip } = renderPattern({ payload: { sequence: [RED, YELLOW, RED], options: [RED, YELLOW] } });
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <PatternExercise prompt="Complète la frise." payload={PAYLOAD} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // La boîte à perles vient avant la barre ; seule la perle en vol (absolue) peut la suivre.
    expect(placer(YELLOW).compareDocumentPosition(bar!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar!.nextElementSibling?.className ?? "").toMatch(/^$|absolute/);
  });
});
