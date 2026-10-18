import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import ShortAnswerExercise from "../ShortAnswerExercise";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

function renderShort(overrides: Partial<React.ComponentProps<typeof ShortAnswerExercise>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    prompt: "Awa a 18 billes. Elle en perd 7. Combien en a-t-elle ?",
    payload: { inputMode: "numeric" as const },
    onSubmit,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<ShortAnswerExercise {...props} />);
  return { ...view, onSubmit, props };
}

const field = () => screen.getByRole("textbox", { name: "Ta réponse" }) as HTMLInputElement;
const key = (name: string) => screen.getByRole("button", { name });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;

describe("la réponse courte : une ardoise et de grosses touches", () => {
  it("un nombre se tape sur le pavé de la carte, sans clavier du téléphone", () => {
    const { onSubmit, container } = renderShort();
    expect(container.querySelector('[data-pave="chiffres"]')).not.toBeNull();
    // Le pavé n'est pas un `role="group"` : la vitrine compte ses cartes par ce rôle.
    expect(screen.queryByRole("group")).toBeNull();
    expect(field().readOnly).toBe(true);
    expect(field().getAttribute("inputmode")).toBe("none");
    expect(valider().disabled).toBe(true);

    fireEvent.click(key("Chiffre 1"));
    fireEvent.click(key("Chiffre 6"));
    expect(field().value).toBe("16");
    fireEvent.click(key("Effacer le dernier chiffre"));
    expect(field().value).toBe("1");
    fireEvent.click(key("Chiffre 1"));
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith("11");
  });

  it("une touche physique écrit aussi, et Entrée valide", () => {
    const { onSubmit } = renderShort();
    fireEvent.keyDown(field(), { key: "7" });
    fireEvent.keyDown(field(), { key: "a" });
    expect(field().value).toBe("7");
    fireEvent.keyDown(field(), { key: "Backspace" });
    expect(field().value).toBe("");
    fireEvent.keyDown(field(), { key: "2" });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("2");
  });

  it("le pavé décimal a sa virgule, le pavé entier non", () => {
    const { unmount } = renderShort({ payload: { inputMode: "decimal" } });
    fireEvent.click(key("Chiffre 2"));
    fireEvent.click(key("Virgule"));
    fireEvent.click(key("Chiffre 5"));
    expect(field().value).toBe("2,5");
    unmount();
    renderShort();
    expect(screen.queryByRole("button", { name: "Virgule" })).toBeNull();
  });

  it("un mot se tape au clavier des lettres, sans pavé", () => {
    const { onSubmit, container } = renderShort({ payload: { inputMode: "text" } });
    expect(container.querySelector('[data-pave="chiffres"]')).toBeNull();
    expect(field().readOnly).toBe(false);
    expect(field().getAttribute("inputmode")).toBe("text");
    fireEvent.change(field(), { target: { value: "chat" } });
    expect(valider().disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Tout effacer" }));
    expect(field().value).toBe("");
    fireEvent.change(field(), { target: { value: "chien" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("chien");
  });

  it("une phrase entière arrive au serveur, sans être coupée", () => {
    // La plus longue réponse attendue du contenu réel (53 caractères) : une
    // borne sur le champ la tronquait, et la vérification littérale échouait.
    const sentence = "Organisation pour la mise en valeur du fleuve Sénégal";
    const { onSubmit } = renderShort({ payload: { inputMode: "text" } });
    fireEvent.change(field(), { target: { value: sentence } });
    expect(field().value).toBe(sentence);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(sentence);
  });

  it("le pavé de chiffres s'arrête à 24 chiffres ; la croix qui efface fait 56 px", () => {
    renderShort();
    for (let i = 0; i < 30; i++) fireEvent.click(key("Chiffre 1"));
    expect(field().value).toHaveLength(24);
    const clear = screen.getByRole("button", { name: "Tout effacer" });
    expect(clear.className).toMatch(/\bh-14\b/);
    expect(clear.className).toMatch(/\bw-14\b/);
  });

  it("une réponse de la galerie, posée dans le champ, arrive bien", () => {
    // `armSpecimen` écrit par le setter natif puis un événement `input`.
    const { onSubmit } = renderShort();
    const input = field();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "16");
    fireEvent.input(input);
    expect(input.value).toBe("16");
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith("16");
  });

  it("juste : l'ardoise gonfle en vert ; fausse : elle dit non en ambre, sans rouge", () => {
    const { container, rerender, props } = renderShort();
    fireEvent.click(key("Chiffre 9"));
    rerender(<ShortAnswerExercise {...props} disabled isCorrect />);
    expect(container.innerHTML).toContain("gk-pop");
    expect(field().disabled).toBe(true);
    rerender(<ShortAnswerExercise {...props} disabled isCorrect={false} />);
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/red-\d|#dc2626/);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », sous le pavé", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ShortAnswerExercise prompt="Combien ?" payload={{ inputMode: "numeric" }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // Le pavé de chiffres vient avant la barre, dernier bloc de la carte.
    expect(bar!.previousElementSibling?.getAttribute("data-pave")).toBe("chiffres");
    expect(bar!.nextElementSibling).toBeNull();
    // Sous le pavé, la barre tient sur une ligne à toute hauteur ; au clavier des lettres, deux rangées.
    expect(bar!.getAttribute("data-row")).toBe("1");
    cleanup();
    const letters = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ShortAnswerExercise prompt="Quel animal ?" payload={{ inputMode: "text" }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    expect(letters.container.querySelector("[data-scene-actions]")?.getAttribute("data-row")).toBeNull();
  });
});
