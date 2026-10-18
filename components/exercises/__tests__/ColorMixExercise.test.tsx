import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import ColorMixExercise from "../ColorMixExercise";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const PAINT = {
  rouge: { name: "rouge", color: "#ef4444" },
  jaune: { name: "jaune", color: "#facc15" },
  bleu: { name: "bleu", color: "#3b82f6" },
  orange: { name: "orange", color: "#f97316" },
  vert: { name: "vert", color: "#22c55e" },
  violet: { name: "violet", color: "#a855f7" },
};

function renderMix(payload: React.ComponentProps<typeof ColorMixExercise>["payload"], overrides: Partial<React.ComponentProps<typeof ColorMixExercise>> = {}) {
  const onSubmit = vi.fn();
  const onSkip = vi.fn();
  const props = {
    prompt: "Touche le pot de couleur JAUNE.",
    payload,
    onSubmit,
    onSkip,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<ColorMixExercise {...props} />);
  return { ...view, onSubmit, onSkip, props };
}

const pot = (name: string) => screen.getByRole("button", { name: `Pot ${name}` });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;
const pressed = (name: string) => pot(name).getAttribute("aria-pressed") === "true";

describe("l'atelier des couleurs : des pots qu'on soulève, la réponse part comme avant", () => {
  it("« pick » : un seul pot à la fois, envoyé en JSON", () => {
    const { onSubmit } = renderMix({ mode: "pick", choices: [PAINT.rouge, PAINT.jaune, PAINT.bleu] });
    expect(valider().disabled).toBe(true);
    fireEvent.click(pot("jaune"));
    expect(pressed("jaune")).toBe(true);
    expect(pot("jaune").querySelector('[data-lifted="1"]')).not.toBeNull();
    fireEvent.click(pot("bleu"));
    expect(pressed("jaune")).toBe(false);
    expect(pressed("bleu")).toBe(true);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["bleu"]));
  });

  it("« pair » : deux pots, le troisième remplace le plus ancien, le bocal attend le verdict", () => {
    const { onSubmit, rerender, props } = renderMix({
      mode: "pair",
      target: PAINT.orange,
      choices: [PAINT.rouge, PAINT.jaune, PAINT.bleu],
    });
    expect(screen.getByRole("img", { name: "Le bol de mélange" })).toBeTruthy();
    fireEvent.click(pot("rouge"));
    expect(valider().disabled).toBe(true);
    fireEvent.click(pot("jaune"));
    expect(valider().disabled).toBe(false);
    fireEvent.click(pot("bleu"));
    expect(pressed("rouge")).toBe(false);
    expect(pressed("jaune")).toBe(true);
    expect(pressed("bleu")).toBe(true);
    fireEvent.click(pot("bleu"));
    fireEvent.click(pot("rouge"));
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["jaune", "rouge"]));

    // Juste : le bocal révèle la couleur visée.
    rerender(<ColorMixExercise {...props} disabled isCorrect />);
    expect(screen.getByRole("img", { name: "Le mélange donne orange" })).toBeTruthy();
    expect(document.querySelector('[data-verdict="juste"]')).not.toBeNull();
  });

  it("« result » : les deux pots donnés se versent, le pot choisi se révèle quand c'est juste", () => {
    const { onSubmit, rerender, props } = renderMix({
      mode: "result",
      given: [PAINT.rouge, PAINT.jaune],
      choices: [PAINT.orange, PAINT.vert, PAINT.violet],
    });
    fireEvent.click(pot("orange"));
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["orange"]));

    rerender(<ColorMixExercise {...props} disabled isCorrect />);
    expect(screen.getByRole("img", { name: "Le mélange donne orange" })).toBeTruthy();

    // Faux : rien ne se révèle, rien de rouge, le pot choisi dit non.
    rerender(<ColorMixExercise {...props} disabled isCorrect={false} />);
    expect(screen.getByRole("img", { name: "Le bol de mélange" })).toBeTruthy();
    expect(document.querySelector('[data-verdict="faux"]')).not.toBeNull();
    expect(document.querySelector(".border-red-400")).toBeNull();
  });

  it("ne bouge plus quand l'exercice est verrouillé", () => {
    renderMix({ mode: "pick", choices: [PAINT.rouge, PAINT.jaune] }, { disabled: true });
    fireEvent.click(pot("jaune"));
    expect(pressed("jaune")).toBe(false);
    expect(valider().disabled).toBe(true);
  });

  it("saute un mélange sans ses deux pots, sans pénalité", () => {
    const { onSkip } = renderMix({ mode: "result", given: [PAINT.rouge], choices: [PAINT.orange, PAINT.vert] });
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ColorMixExercise
          prompt="Touche le pot JAUNE."
          payload={{ mode: "pick", choices: [PAINT.rouge, PAINT.jaune, PAINT.bleu] }}
          onSubmit={vi.fn()}
          disabled={false}
          isCorrect={null}
        />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // Les pots sont devant la barre, dernier bloc de la carte.
    expect(bar!.nextElementSibling).toBeNull();
    expect(pot("jaune").compareDocumentPosition(bar!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
