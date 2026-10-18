import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DragDropExercise, { boxesSideBySide, itemTileState } from "../DragDropExercise";
import { PromptReaderProvider } from "../prompt-reader";

// Les confettis dessinent sur un canvas que jsdom n'a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

/**
 * TOUCHER L'ÉTIQUETTE, PUIS TOUCHER LA CASE : l'autre façon de jouer un
 * glisser-déposer.
 *
 * À 375×667, la moitié des cartes de la démonstration ont une étiquette et sa
 * case qui ne tiennent pas ensemble à l'écran ; un glissé qui approche du bord
 * fait défiler la page sous le doigt. Le toucher ne dépend pas de la taille de
 * l'écran. Le glissé lui-même se joue dans `e2e/demo-touch.spec.ts`.
 */

const payload = { zones: ["Jour", "Nuit"], items: [{ text: "soleil" }, { text: "lune" }, { text: "étoile" }] };

/** L'étiquette qui porte ce texte : le nœud que dnd-kit tient (`aria-roledescription="draggable"`). */
function draggable(text: string): HTMLElement {
  const found = Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="draggable"]')).find(
    (el) => el.textContent?.trim() === text,
  );
  if (!found) throw new Error(`étiquette « ${text} » introuvable`);
  return found;
}

function setup(onSubmit = vi.fn()) {
  const view = render(
    <DragDropExercise
      prompt="Classe chaque mot."
      payload={payload}
      onSubmit={onSubmit}
      disabled={false}
      isCorrect={null}
    />,
  );
  // La case est le parent direct de son titre : la galerie et la vitrine le lisent ainsi.
  const zone = (label: string) => screen.getByRole("heading", { name: label }).parentElement as HTMLElement;
  return { ...view, zone, item: draggable, onSubmit };
}

describe("glisser-déposer : toucher l'étiquette, puis la case", () => {
  it("pose l'étiquette choisie dans la case touchée", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).toContain("soleil");
  });

  it("dit quelle étiquette est choisie et où la poser, et allume les cases", () => {
    const { item, zone } = setup();
    expect(screen.queryByText(/Ou touche l.étiquette, puis la case/i)).not.toBeNull();
    expect(zone("Jour").getAttribute("data-armed")).toBeNull();
    fireEvent.click(item("lune"));
    expect(item("lune").getAttribute("aria-pressed")).toBe("true");
    expect(item("lune").getAttribute("data-state")).toBe("choisie");
    expect(screen.queryByText(/Touche la case où poser « lune »/)).not.toBeNull();
    expect(zone("Jour").getAttribute("data-armed")).toBe("true");
    expect(zone("Nuit").getAttribute("data-armed")).toBe("true");
  });

  it("toucher deux fois la même étiquette la relâche", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(item("soleil"));
    expect(item("soleil").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("toucher une autre étiquette change le choix", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(item("lune"));
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("lune");
    expect(zone("Nuit").textContent).not.toContain("soleil");
  });

  it("une case ne réagit pas au toucher quand aucune étiquette n'est choisie", () => {
    const { zone } = setup();
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("déplace une étiquette déjà posée vers une autre case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("soleil");
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("toucher une étiquette déjà posée ne la repose pas dans sa propre case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    expect(item("soleil").getAttribute("aria-pressed")).toBe("true");
    expect(zone("Jour").textContent).toContain("soleil");
  });

  it("toucher une étiquette déjà posée, alors qu'une autre est choisie, pose la choisie dans cette case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    // Le centre d'une case pleine tombe sur une étiquette : c'est toucher la case.
    fireEvent.click(item("lune"));
    fireEvent.click(item("soleil"));
    expect(zone("Jour").textContent).toContain("lune");
    expect(zone("Jour").textContent).toContain("soleil");
    expect(item("lune").getAttribute("aria-pressed")).toBe("false");
  });

  it("toucher une autre étiquette de la même case change le choix", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("lune"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    fireEvent.click(item("lune"));
    expect(item("lune").getAttribute("aria-pressed")).toBe("true");
    expect(item("soleil").getAttribute("aria-pressed")).toBe("false");
  });

  it("se joue au clavier : Entrée choisit l'étiquette, puis on touche la case", () => {
    const { zone, item } = setup();
    fireEvent.keyDown(item("étoile"), { key: "Enter" });
    expect(item("étoile").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("étoile");
  });

  it("envoie la réponse une fois toutes les étiquettes posées par toucher", () => {
    const { zone, item, onSubmit } = setup();
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
    for (const [text, where] of [
      ["soleil", "Jour"],
      ["lune", "Nuit"],
      ["étoile", "Nuit"],
    ]) {
      fireEvent.click(item(text));
      fireEvent.click(zone(where));
    }
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify({ soleil: "Jour", lune: "Nuit", étoile: "Nuit" }));
  });

  it("ne choisit rien une fois l'exercice corrigé", () => {
    render(
      <DragDropExercise prompt="Classe." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />,
    );
    const soleil = draggable("soleil");
    fireEvent.click(soleil);
    expect(soleil.getAttribute("aria-pressed")).toBe("false");
  });

  it("juste : les étiquettes posées gonflent en vert et les boîtes le disent ; faux : ambre, jamais rouge", () => {
    const { zone, item, rerender, container } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));

    rerender(<DragDropExercise prompt="Classe." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={true} />);
    expect(item("soleil").getAttribute("data-state")).toBe("juste");
    expect(zone("Jour").getAttribute("data-state")).toBe("juste");
    // Une étiquette encore dans le bac n'est ni juste ni fausse.
    expect(item("lune").getAttribute("data-state")).toBe("repos");

    rerender(<DragDropExercise prompt="Classe." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />);
    expect(item("soleil").getAttribute("data-state")).toBe("fausse");
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/#dc2626|#ef4444|red-/);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <DragDropExercise prompt="Classe." payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    expect(bar!.nextElementSibling).toBeNull();
    // Le bac aux étiquettes garde son repère (`border-dashed`), devant la barre.
    expect(container.querySelector(".border-dashed")).not.toBeNull();
  });
});

describe("boxesSideBySide — deux colonnes de boîtes dès le téléphone", () => {
  it("quand les noms et les étiquettes sont courts, d'un mot, quatre boîtes au plus", () => {
    expect(boxesSideBySide(["Jour", "Nuit"], ["soleil", "lune", "étoile"])).toBe(true);
    expect(boxesSideBySide(["Ronds", "Carrés", "Triangles"], ["\u{1F534}", "\u{1F7E6}"])).toBe(true);
    expect(boxesSideBySide(["a", "an"], ["pa", "man"])).toBe(true);
  });

  it("garde la colonne pour un nom long, une phrase, ou trop de boîtes", () => {
    expect(boxesSideBySide(["Aliments énergétiques", "Aliments de construction"], ["riz"])).toBe(false);
    expect(boxesSideBySide(["Ligne droite", "Zigzag"], ["trait"])).toBe(false);
    expect(boxesSideBySide(["Jour", "Nuit"], ["le soleil brille", "lune"])).toBe(false);
    expect(boxesSideBySide(["A", "B", "C", "D", "E"], ["x"])).toBe(false);
    expect(boxesSideBySide(["Seule"], ["x"])).toBe(false);
  });

  it("la grille le dit : `data-boxes`", () => {
    const { container } = setup();
    expect(container.querySelector("[data-boxes]")?.getAttribute("data-boxes")).toBe("deux-colonnes");
    const long = render(
      <DragDropExercise
        prompt="Classe."
        payload={{ zones: ["Aliments énergétiques", "Aliments de construction"], items: [{ text: "riz" }, { text: "poisson" }] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(long.container.querySelector("[data-boxes]")?.getAttribute("data-boxes")).toBe("une-colonne");
  });
});

describe("itemTileState — l'état d'une étiquette", () => {
  it("le verdict ne touche que les étiquettes posées ; le choix prime au repos", () => {
    expect(itemTileState(true, true, false)).toBe("juste");
    expect(itemTileState(false, true, false)).toBe("fausse");
    expect(itemTileState(true, false, false)).toBe("repos");
    expect(itemTileState(null, false, true)).toBe("choisie");
    expect(itemTileState(null, true, false)).toBe("repos");
  });
});
