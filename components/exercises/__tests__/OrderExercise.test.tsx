import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import OrderExercise, { orderTileState } from "../OrderExercise";
import { ItemPicturesProvider } from "../item-pictures";
import { PromptReaderProvider } from "../prompt-reader";

// Les confettis dessinent sur un canvas que jsdom n'a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

/**
 * LA MISE EN ORDRE : des marches numérotées, une poignée par tuile, et une
 * réponse qui part comme avant (la liste des textes dans l'ordre affiché).
 * Le glissé lui-même se joue dans `e2e/demo-touch.spec.ts`.
 */
const payload = { items: ["to", "ma", "te"] };

function setup(onSubmit = vi.fn(), isCorrect: boolean | null = null, disabled = false) {
  const view = render(
    <OrderExercise prompt="Remets les syllabes dans l'ordre." payload={payload} onSubmit={onSubmit} disabled={disabled} isCorrect={isCorrect} />,
  );
  return { ...view, onSubmit };
}

const handles = () => Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="sortable"]'));
const tiles = () => Array.from(document.querySelectorAll<HTMLElement>(".gk-tile"));

describe("OrderExercise — l'escalier", () => {
  it("une marche numérotée et une poignée nommée par tuile", () => {
    const { container } = setup();
    expect(handles()).toHaveLength(3);
    for (const handle of handles()) {
      expect(handle.getAttribute("aria-label")).toMatch(/^Déplacer « (to|ma|te) »$/);
    }
    const numbers = Array.from(container.querySelectorAll(".gk-step")).map((step) => step.textContent?.trim());
    expect(numbers).toEqual(["1", "2", "3"]);
  });

  it("le libellé est le dernier enfant du nœud trié : la vitrine le lit par là", () => {
    setup();
    for (const handle of handles()) {
      const label = handle.parentElement?.lastElementChild?.textContent?.trim();
      expect(handle.getAttribute("aria-label")).toBe(`Déplacer « ${label} »`);
    }
  });

  it("envoie les textes dans l'ordre affiché", () => {
    const { onSubmit } = setup();
    const shown = handles().map((handle) => handle.parentElement?.lastElementChild?.textContent?.trim());
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(JSON.parse(onSubmit.mock.calls[0][0])).toEqual(shown);
    expect([...shown].sort()).toEqual(["ma", "te", "to"]);
  });

  it("juste : toutes les tuiles gonflent en vert ; faux : elles disent non en ambre, jamais en rouge", () => {
    const { rerender, container } = setup();
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "repos")).toBe(true);

    rerender(<OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={true} />);
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "juste")).toBe(true);
    expect(container.innerHTML).toContain("gk-pop");

    rerender(<OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />);
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "fausse")).toBe(true);
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/#dc2626|#ef4444|red-/);
  });

  it("corrigé, « Valider » est couché", () => {
    setup(vi.fn(), true, true);
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("un exercice à une seule tuile est cassé : on le saute", () => {
    const onSkip = vi.fn();
    render(<OrderExercise prompt="Remets." payload={{ items: ["seul"] }} onSubmit={vi.fn()} onSkip={onSkip} disabled={false} isCorrect={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    expect(bar!.nextElementSibling).toBeNull();
    // Les poignées restent trois, hors de la barre.
    expect(handles()).toHaveLength(3);
  });
});

describe("orderTileState — l'état d'une tuile", () => {
  it("le verdict prime, puis la prise", () => {
    expect(orderTileState(true, true)).toBe("juste");
    expect(orderTileState(false, false)).toBe("fausse");
    expect(orderTileState(null, true)).toBe("choisie");
    expect(orderTileState(null, false)).toBe("repos");
  });
});

/**
 * LA MISE EN ORDRE DU CI : une tuile qui NOMME une chose montre son image entre la
 * poignée et son mot (`item-pictures.tsx`). Le mot reste écrit, sans l'émoji de
 * tête que l'image remplace ; la réponse, elle, part toujours en JSON des textes
 * d'origine, émoji compris.
 */
describe("OrderExercise au CI — la tuile qui nomme une chose montre son image", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const MOUSE = String.fromCodePoint(0x1f401);
  const DOG = String.fromCodePoint(0x1f415);
  const ELEPHANT = String.fromCodePoint(0x1f418);
  const ANIMALS = [`${MOUSE} la souris`, `${DOG} le chien`, `${ELEPHANT} l'éléphant`];
  const PROMPT = "Range les animaux du plus petit au plus grand.";

  function setupCI(items: string[], { enabled = true, prompt = PROMPT }: { enabled?: boolean; prompt?: string } = {}) {
    const onSubmit = vi.fn();
    const view = render(
      <ItemPicturesProvider enabled={enabled}>
        <OrderExercise prompt={prompt} payload={{ items }} onSubmit={onSubmit} disabled={false} isCorrect={null} />
      </ItemPicturesProvider>,
    );
    return { ...view, onSubmit };
  }

  const stickers = () => Array.from(document.querySelectorAll<HTMLElement>("[data-item-picture]"));
  const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
  // dnd-kit numérote ses zones d'annonce à chaque nouveau contexte : on les remet à zéro avant de comparer deux rendus.
  const html = (container: HTMLElement) => container.innerHTML.replace(/(DndDescribedBy|DndLiveRegion)-\d+/g, "$1");
  const labelOf = (handle: HTMLElement) => handle.getAttribute("aria-label")!.replace(/^Déplacer « /, "").replace(/ »$/, "");
  // Un mélange fixe : les deux rendus qu'on compare rangent leurs tuiles de la même façon.
  const fixShuffle = () => vi.spyOn(Math, "random").mockReturnValue(0);

  it("pose l'image de chaque chose nommée, et garde son mot écrit sans l'émoji de tête", () => {
    setupCI(ANIMALS);
    expect(stickers().map((sticker) => sticker.dataset.itemPicture).sort()).toEqual(["chien", "elephant", "souris"]);
    expect(tiles().map((tile) => tile.textContent?.trim()).sort()).toEqual(["l'éléphant", "la souris", "le chien"]);
    for (const tile of tiles()) {
      expect(tile.querySelectorAll("img")).toHaveLength(1);
      expect(tile.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("met l'image à droite de la poignée, avant le mot, à la place que la poignée réserve", () => {
    setupCI(ANIMALS);
    for (const tile of tiles()) {
      const row = tile.querySelector("[data-item-picture]")!.parentElement!;
      expect(classesOf(row)).toContain("pl-14");
      expect(classesOf(row)).toContain("items-center");
      expect(row.firstElementChild?.hasAttribute("data-item-picture")).toBe(true);
      expect(row.lastElementChild?.textContent?.trim()).toBe(tile.textContent?.trim());
    }
    // La poignée reste un frère de la tuile, qui en est le dernier enfant.
    for (const handle of handles()) expect(handle.parentElement?.lastElementChild?.classList.contains("gk-tile")).toBe(true);
  });

  it("garde le nom de la poignée et la réponse : le JSON des textes d'origine, émoji compris", () => {
    fixShuffle();
    const withPictures = setupCI(ANIMALS);
    const shown = handles().map(labelOf);
    expect([...shown].sort()).toEqual([...ANIMALS].sort());
    for (const handle of handles()) expect(handle.getAttribute("aria-label")).toBe(`Déplacer « ${labelOf(handle)} »`);
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(withPictures.onSubmit).toHaveBeenCalledTimes(1);
    const sent = withPictures.onSubmit.mock.calls[0][0] as string;
    expect(JSON.parse(sent)).toEqual(shown);
    cleanup();

    const without = setupCI(ANIMALS, { enabled: false });
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(without.onSubmit.mock.calls[0][0]).toBe(sent);
  });

  it("sans fournisseur ou porte fermée, le DOM est celui d'avant : le libellé complet, en glyphes", () => {
    fixShuffle();
    const bare = render(<OrderExercise prompt={PROMPT} payload={{ items: ANIMALS }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />);
    const before = html(bare.container);
    cleanup();
    const closed = setupCI(ANIMALS, { enabled: false });
    expect(html(closed.container)).toBe(before);
    expect(before).not.toContain("<img");
    expect(before).not.toContain("data-item-picture");
    // Le texte de chaque tuile est le libellé entier, émoji compris.
    expect(tiles().map((tile) => tile.textContent?.trim()).sort()).toEqual([...ANIMALS].sort());
    // Et le contenant est celui d'avant, à la chaîne de classes près (le test ci-dessus compare du code neuf à du code neuf).
    for (const tile of tiles()) {
      const label = tile.querySelector(".gk-face-light span.relative > span") as Element;
      expect(label.getAttribute("class")).toBe("block pl-14");
      expect(label.querySelector("span.inline-block")?.className).toBe("inline-block [overflow-wrap:anywhere]");
    }
  });

  it("une tuile sans correspondance garde exactement son rendu d'avant, à côté d'une tuile à image", () => {
    fixShuffle();
    const items = [`${DOG} le chien`, "Fatou", "3 pommes"];
    const open = setupCI(items);
    expect(stickers().map((sticker) => sticker.dataset.itemPicture)).toEqual(["chien"]);
    const tileFor = (text: string) => tiles().find((tile) => tile.textContent?.includes(text))!;
    const mixed = { fatou: tileFor("Fatou").innerHTML, pommes: tileFor("3 pommes").innerHTML };
    open.unmount();
    setupCI(items, { enabled: false });
    expect(tileFor("Fatou").innerHTML).toBe(mixed.fatou);
    expect(tileFor("3 pommes").innerHTML).toBe(mixed.pommes);
  });

  it("la pastille se serre pour ne pas pousser le dock : 44 px jusqu'à quatre tuiles, 36 px au-delà, 32 px sous 340 px de large", () => {
    // Jusqu'à quatre tuiles : 44 px, et 36 px sur un écran court (667 px ou moins) d'au moins 340 px de large.
    for (const items of [ANIMALS, [...ANIMALS, "Lion"]]) {
      setupCI(items);
      expect(stickers()).toHaveLength(items.length);
      for (const sticker of stickers()) {
        expect(classesOf(sticker)).toContain("size-11");
        expect(classesOf(sticker)).toContain("min-[340px]:[@media(max-height:667px)]:size-9");
        // Sous 340 px, 32 px : les deux requêtes s'excluent, l'ordre n'a pas à compter.
        expect(classesOf(sticker)).toContain("max-[339px]:size-8");
        expect(classesOf(sticker)).not.toContain("[@media(max-height:667px)]:size-9");
      }
      cleanup();
    }

    // Cinq tuiles : 36 px partout, 32 px sous 340 px.
    setupCI([...ANIMALS, "Lion", "Poule"]);
    expect(stickers()).toHaveLength(5);
    for (const sticker of stickers()) {
      expect(classesOf(sticker)).toContain("size-9");
      expect(classesOf(sticker)).toContain("max-[339px]:size-8");
      expect(classesOf(sticker)).not.toContain("size-11");
    }
  });

  it("sous 340 px de large, la poignée d'une marche à image passe de 56 à 44 px et le texte lui laisse sa place ; une marche sans image garde ses 56 px", () => {
    setupCI([...ANIMALS, "Fatou"]);
    const handleOf = (text: string) => handles().find((handle) => handle.getAttribute("aria-label") === `Déplacer « ${text} »`)!;
    for (const text of ANIMALS) {
      expect(classesOf(handleOf(text))).toEqual(expect.arrayContaining(["h-14", "w-14", "max-[339px]:h-11", "max-[339px]:w-11"]));
    }
    // « Fatou » n'a pas d'image : sa poignée est celle d'avant, sans classe de plus.
    expect(classesOf(handleOf("Fatou"))).toEqual(expect.arrayContaining(["h-14", "w-14"]));
    expect(classesOf(handleOf("Fatou"))).not.toContain("max-[339px]:h-11");
    // Le texte d'une marche à image réserve 48 px à la poignée étroite. Les tuiles sont mélangées au
    // montage : on prend une tuile qui a sa pastille, pas la première venue.
    const pictured = tiles().find((tile) => tile.querySelector("[data-item-picture]"))!;
    const label = pictured.querySelector("[data-item-picture]")!.parentElement!;
    expect(classesOf(label)).toContain("max-[339px]:pl-12");
  });

  it("la marche ne grandit pas : la pastille déborde du remplissage de la tuile, par sa propre marge", () => {
    // 44 px : 8 px de chaque côté ; 36 px : 4 px. La marge est sur la pastille, pas sur la
    // rangée, pour qu'un mot sur deux lignes garde la hauteur de son texte.
    setupCI(ANIMALS);
    for (const sticker of stickers()) {
      expect(classesOf(sticker)).toContain("-my-2");
      expect(classesOf(sticker.parentElement)).not.toContain("-my-2");
    }
    cleanup();
    setupCI([...ANIMALS, "Lion", "Poule"]);
    for (const sticker of stickers()) expect(classesOf(sticker)).toContain("-my-1");
  });

  it("garde-fou a : un énoncé qui demande de lire n'a aucune image", () => {
    const { container } = setupCI(["le chat", "le chien", "le lion"], { prompt: "Lis les mots et range-les." });
    expect(container.querySelector("img")).toBeNull();
    expect(stickers()).toHaveLength(0);
    expect(tiles().map((tile) => tile.textContent?.trim()).sort()).toEqual(["le chat", "le chien", "le lion"]);
  });

  it("garde-fou a : les vraies consignes du CI (mots d'une phrase, syllabes) n'ont aucune image", () => {
    // La tuile « chat. » aurait eu son image, et les trois autres mots non : une place sur quatre donnée.
    const sentence = setupCI(["Cheikh", "a", "un", "chat"], { prompt: "Remets les mots dans l'ordre." });
    expect(sentence.container.querySelector("img")).toBeNull();
    sentence.unmount();
    const syllables = setupCI(["mo", "to", "pen"], { prompt: "Remets les syllabes dans l'ordre." });
    expect(syllables.container.querySelector("img")).toBeNull();
  });

  it("garde-fou e : l'image de l'énoncé est celle d'une tuile, aucune image sur les tuiles", () => {
    const view = render(
      <ItemPicturesProvider enabled>
        <OrderExercise
          prompt="Range ces animaux."
          payload={{ image: "chat", items: ["le chat", "le chien", "le lion"] }}
          onSubmit={vi.fn()}
          disabled={false}
          isCorrect={null}
        />
      </ItemPicturesProvider>,
    );
    expect(stickers()).toHaveLength(0);
    // L'image d'énoncé, elle, est là.
    expect(view.container.querySelectorAll("img")).toHaveLength(1);
  });

  it("si le fichier ne charge pas, l'émoji de tête reprend sa place ; sans émoji, la tuile garde son mot", () => {
    setupCI([`${DOG} le chien`, "Lion"]);
    const tileFor = (text: string) => tiles().find((tile) => tile.textContent?.includes(text))!;
    fireEvent.error(tileFor("le chien").querySelector("img") as HTMLImageElement);
    expect(tileFor("le chien").querySelector("img")).toBeNull();
    expect(tileFor("le chien").textContent).toContain(DOG);

    fireEvent.error(tileFor("Lion").querySelector("img") as HTMLImageElement);
    expect(tileFor("Lion").querySelector("img")).toBeNull();
    expect(tileFor("Lion").textContent?.trim()).toBe("Lion");
  });

  it("l'image est décorative : le nom est écrit à côté, rien à lire de plus", () => {
    setupCI(ANIMALS);
    expect(screen.queryByRole("img")).toBeNull();
    for (const image of document.querySelectorAll("img")) {
      expect(image.getAttribute("alt")).toBe("");
      expect(classesOf(image)).toContain("pointer-events-none");
    }
  });

  // Ce test ne prouve QUE l'ordre des hooks (React ne lève pas « Rendered more hooks ») : l'état des tuiles
  // (`items`) naît au premier rendu et n'est pas relu, c'est la séance qui remonte l'exercice (une clé par
  // exercice) quand le suivant arrive. Il ne dit rien de la liste affichée après la réparation.
  it("un exercice cassé puis réparé ne lève pas d'erreur de hooks : leur ordre ne dépend pas des tuiles", () => {
    const view = (payload: { items: string[] }) => (
      <ItemPicturesProvider enabled>
        <OrderExercise prompt={PROMPT} payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </ItemPicturesProvider>
    );
    const { rerender } = render(view({ items: ["seul"] }));
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    rerender(view({ items: ANIMALS }));
    expect(screen.queryByText("Cet exercice est cassé, on te le saute.")).toBeNull();
  });
});
