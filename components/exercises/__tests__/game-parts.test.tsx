import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SceneDockProvider } from "@/components/student/game-kit";
import { BrokenExercise, ExerciseActions, SubmitButton, verdictClasses } from "../game-parts";
import { PromptReaderProvider } from "../prompt-reader";

// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

afterEach(cleanup);

describe("les pièces communes des écrans de jeu", () => {
  it("« Valider » reste un bouton désactivable, qui appelle quand il est prêt", () => {
    const onClick = vi.fn();
    const { rerender } = render(<SubmitButton onClick={onClick} disabled />);
    const button = screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(<SubmitButton onClick={onClick} disabled={false} label="C'est fini" />);
    const ready = screen.getByRole("button", { name: "C'est fini" }) as HTMLButtonElement;
    expect(ready.disabled).toBe(false);
    fireEvent.click(ready);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("« Valider » vit dans la barre d'action : seul sans lecteur, précédé d'« Écouter » pour un enfant qui apprend à lire", () => {
    const alone = render(<SubmitButton onClick={vi.fn()} disabled={false} />);
    const bar = alone.container.querySelector("[data-scene-actions]");
    expect(bar).not.toBeNull();
    expect([...bar!.querySelectorAll("button")]).toHaveLength(1);
    cleanup();

    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <SubmitButton onClick={vi.fn()} disabled={false} />
      </PromptReaderProvider>,
    );
    const names = [...container.querySelector("[data-scene-actions]")!.querySelectorAll("button")].map(
      (b) => b.getAttribute("aria-label") ?? b.textContent,
    );
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
  });

  it("dans la coque de la séance, la barre se téléporte dans le dock collé en bas ; sans dock, elle reste dans la carte", () => {
    const inline = render(
      <div data-card>
        <SubmitButton onClick={vi.fn()} disabled={false} />
      </div>,
    );
    expect(inline.container.querySelector("[data-card] [data-scene-actions]")).not.toBeNull();
    cleanup();

    const { container, rerender } = render(
      <SceneDockProvider>
        <div data-card>
          <PromptReaderProvider exerciseId="exo" silenced>
            <SubmitButton onClick={vi.fn()} disabled={false} />
          </PromptReaderProvider>
        </div>
      </SceneDockProvider>,
    );
    expect(container.querySelector("[data-card] [data-scene-actions]")).toBeNull();
    const dock = screen.getByRole("group", { name: "Actions de l'exercice" });
    expect(dock.getAttribute("data-dock-empty")).toBeNull();
    const names = [...dock.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);

    // Rien à montrer (ni voix ni Valider) : rien n'occupe le dock, il se cache.
    rerender(
      <SceneDockProvider>
        <div data-card>
          <ExerciseActions />
        </div>
      </SceneDockProvider>,
    );
    expect(container.querySelector("[data-scene-dock]")?.getAttribute("data-dock-empty")).toBe("1");
    expect(container.querySelector("[data-scene-actions]")).toBeNull();
  });

  it("un exercice cassé se saute sans pénalité", () => {
    const onSkip = vi.fn();
    render(<BrokenExercise prompt="Une consigne" onSkip={onSkip} disabled={false} />);
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    expect(screen.getByText("Pas de souci, ça ne te coûte rien.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("le verdict n'est jamais rouge", () => {
    expect(verdictClasses(true)).toContain("gk-pop");
    expect(verdictClasses(false)).toContain("gk-shake-soft");
    expect(verdictClasses(false)).not.toMatch(/red/);
    expect(verdictClasses(null)).toContain("bg-[#fff8e6]");
  });
});
