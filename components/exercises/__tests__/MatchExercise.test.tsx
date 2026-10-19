import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MatchExercise, { cableToneFor, matchColumns, pairTone } from "../MatchExercise";
import { PromptReaderProvider } from "../prompt-reader";
import { TILE_CORRECT_TONE, TILE_WRONG_TONE } from "@/components/student/game-kit";

// Les confettis dessinent sur un canvas que jsdom n'a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

// L'exercice de la capture du 29 septembre 2026 : deux tuiles « a » à droite.
const payload = {
  left: ["mangue", "yassa", "bissap", "lait"],
  right: ["i", "a", "é", "a"],
};

function renderExercise(onSubmit = vi.fn(), isCorrect: boolean | null = null, disabled = false) {
  const view = render(
    <MatchExercise
      prompt="Fais correspondre les mots avec leur son."
      payload={payload}
      onSubmit={onSubmit}
      disabled={disabled}
      isCorrect={isCorrect}
    />,
  );
  return { onSubmit, ...view };
}

const tile = (name: string) => screen.getByRole("button", { name });
const aTiles = () => screen.getAllByRole("button", { name: "a" });
// Une tuile reliée le dit dans le DOM : les câbles, eux, sont un dessin.
const isLinked = (button: HTMLElement) => button.getAttribute("data-linked") === "true";
const cables = (container: HTMLElement) => container.querySelectorAll("svg [data-cable]");

describe("MatchExercise — deux tuiles au même texte", () => {
  it("relier le premier « a » laisse le second libre", () => {
    renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(true);
    expect(isLinked(second)).toBe(false);
  });

  it("relie chaque mot à l'une des deux tuiles « a » et envoie les quatre paires", () => {
    const { onSubmit, container } = renderExercise();
    fireEvent.click(tile("bissap"));
    fireEvent.click(tile("i"));
    fireEvent.click(tile("lait"));
    fireEvent.click(tile("é"));
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);
    fireEvent.click(tile("yassa"));
    fireEvent.click(aTiles()[1]);

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(true);
    expect(isLinked(second)).toBe(true);
    // Deux liens, deux rangs, donc deux couleurs : les tuiles ne se confondent plus.
    expect(first.getAttribute("data-rank")).not.toBe(second.getAttribute("data-rank"));
    // Un câble par paire.
    expect(cables(container)).toHaveLength(4);

    const submit = tile("Valider");
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);
    expect(JSON.parse(onSubmit.mock.calls[0][0])).toEqual([
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
    ]);
  });

  it("toucher un mot relié défait seulement son lien", () => {
    const { container } = renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);
    fireEvent.click(tile("yassa"));
    fireEvent.click(aTiles()[1]);

    fireEvent.click(tile("mangue"));

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(false);
    expect(isLinked(second)).toBe(true);
    expect(cables(container)).toHaveLength(1);
  });
});

describe("MatchExercise — dans les deux sens", () => {
  it("dit par où commencer sous la consigne", () => {
    renderExercise();
    expect(screen.getByText(/Tu peux commencer par la gauche ou par la droite/)).toBeTruthy();
  });

  it("relie en touchant d'abord la tuile de droite", () => {
    const { onSubmit } = renderExercise();
    fireEvent.click(tile("i"));
    fireEvent.click(tile("bissap"));
    fireEvent.click(tile("é"));
    fireEvent.click(tile("lait"));
    fireEvent.click(aTiles()[1]);
    fireEvent.click(tile("yassa"));
    fireEvent.click(aTiles()[0]);
    fireEvent.click(tile("mangue"));

    fireEvent.click(tile("Valider"));
    expect(JSON.parse(onSubmit.mock.calls[0][0])).toEqual([
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
      { left: "yassa", right: "a" },
      { left: "mangue", right: "a" },
    ]);
  });

  it("toucher une tuile reliée, de n'importe quelle colonne, défait son lien", () => {
    renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);
    expect(isLinked(aTiles()[0])).toBe(true);

    fireEvent.click(aTiles()[0]);
    expect(isLinked(aTiles()[0])).toBe(false);
    expect(isLinked(tile("mangue"))).toBe(false);
  });
});

describe("MatchExercise — ce que l'enfant voit", () => {
  it("la tuile en main est soulevée et pressée, les autres de l'autre colonne l'appellent", () => {
    const { container } = renderExercise();
    fireEvent.click(tile("mangue"));
    const held = tile("mangue");
    expect(held.getAttribute("aria-pressed")).toBe("true");
    expect(held.getAttribute("data-state")).toBe("choisie");
    expect(held.getAttribute("data-elevation")).toBe("soulevee");
    // Quatre prises de droite en appel, celle en main choisie, trois de gauche libres.
    expect(container.querySelectorAll('[data-socket="appel"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-socket="choisie"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-socket="libre"]')).toHaveLength(3);
  });

  it("une tuile reliée est posée, pas soulevée, et sa couleur suit son rang", () => {
    renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(tile("i"));
    expect(tile("mangue").getAttribute("data-elevation")).toBe("posee");
    expect(tile("mangue").getAttribute("data-rank")).toBe("0");
    expect(tile("i").getAttribute("data-rank")).toBe("0");
  });

  it("juste : les tuiles reliées gonflent en vert ; faux : elles disent non en ambre, jamais en rouge", () => {
    const { rerender, container } = renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(tile("i"));

    rerender(
      <MatchExercise prompt="Fais correspondre." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={true} />,
    );
    expect(tile("mangue").getAttribute("data-state")).toBe("juste");
    expect(tile("i").getAttribute("data-state")).toBe("juste");
    expect(tile("yassa").getAttribute("data-state")).toBe("repos");
    expect(container.innerHTML).toContain("gk-pop");

    rerender(
      <MatchExercise prompt="Fais correspondre." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />,
    );
    expect(tile("mangue").getAttribute("data-state")).toBe("fausse");
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/#dc2626|#ef4444|red-/);
  });

  it("« Valider » reste couché tant que toutes les paires ne sont pas faites", () => {
    renderExercise();
    const submit = tile("Valider") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(tile("mangue"));
    fireEvent.click(tile("i"));
    expect(submit.disabled).toBe(true);
  });

  it("une fois corrigé, aucun toucher ne change les liens", () => {
    const { container } = renderExercise(vi.fn(), false, true);
    fireEvent.click(tile("mangue"));
    expect(tile("mangue").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll('[data-socket="appel"]')).toHaveLength(0);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <MatchExercise prompt="Fais correspondre." payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // La barre est le dernier bloc de la carte ; les tuiles restent devant elle.
    expect(bar!.nextElementSibling).toBeNull();
    expect(screen.getAllByRole("button", { name: "a" })).toHaveLength(2);
  });
});

describe("matchColumns — la largeur des colonnes suit leur contenu", () => {
  it("serre la colonne des signes courts face aux rangées d'émojis ou aux mots", () => {
    const mangoes = ["\u{1F96D}\u{1F96D}", "\u{1F96D}\u{1F96D}\u{1F96D}"];
    expect(matchColumns(["2", "3"], mangoes)).toBe("gauche-etroite");
    expect(matchColumns(mangoes, ["2", "3"])).toBe("droite-etroite");
    expect(matchColumns(["a", "an"], ["papa", "maman"])).toBe("gauche-etroite");
  });

  it("moitié-moitié pour deux colonnes de mots, ou deux de signes", () => {
    expect(matchColumns(["mangue", "yassa"], ["mango", "rice"])).toBe("egales");
    expect(matchColumns(["2", "3"], ["a", "b"])).toBe("egales");
    // Les mots à gauche, leurs sons (« i », « a ») à droite : la droite se serre.
    expect(matchColumns(payload.left, payload.right)).toBe("droite-etroite");
    const { container } = renderExercise();
    expect(container.querySelector("[data-columns]")?.getAttribute("data-columns")).toBe("droite-etroite");
  });
});

describe("pairTone et cableToneFor — les couleurs des paires", () => {
  it("les paires sautent le bleu de la sélection et tournent sur six teintes", () => {
    expect(pairTone(0)).toBe(1);
    expect(pairTone(4)).toBe(5);
    expect(pairTone(5)).toBe(0);
    expect(pairTone(6)).toBe(1);
  });

  it("le câble suit le verdict : vert, ambre, sinon la couleur du rang", () => {
    expect(cableToneFor(0, true)).toEqual({ main: TILE_CORRECT_TONE.badge, dark: TILE_CORRECT_TONE.flank });
    expect(cableToneFor(0, false)).toEqual({ main: TILE_WRONG_TONE.badge, dark: TILE_WRONG_TONE.flank });
    expect(cableToneFor(0, null)).not.toEqual(cableToneFor(1, null));
  });
});
