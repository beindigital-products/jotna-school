import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MatchExercise from "../MatchExercise";
import { ItemPicturesProvider } from "../item-pictures";

// Les confettis dessinent sur un canvas que jsdom n'a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

/**
 * L'ASSOCIATION EN CI : UNE TUILE QUI NOMME UNE CHOSE MONTRE SON IMAGE.
 *
 * Un enfant de six ans ne lit pas « le crocodile » : la tuile lui montre le
 * crocodile et garde le mot. Ces tests tiennent les trois promesses de
 * l'écran : l'image est là (et le mot aussi) quand la porte est ouverte ; rien
 * ne change quand elle est fermée ; la réponse ne change jamais d'un caractère.
 * La résolution elle-même (quelle tuile, quel garde-fou) est testée dans
 * `lib/__tests__/item-pictures.test.ts` ; ici, on regarde ce que l'écran en fait.
 */

type Payload = { left: string[]; right: string[] };

const PROMPT = "Relie chaque animal à son cri.";

function renderMatch(
  payload: Payload,
  options: { gate?: "ouverte" | "fermee" | "absente"; prompt?: string; onSubmit?: (answer: string) => void } = {},
) {
  const { gate = "ouverte", prompt = PROMPT, onSubmit = vi.fn() } = options;
  const exercise = (
    <MatchExercise prompt={prompt} payload={payload} onSubmit={onSubmit} disabled={false} isCorrect={null} />
  );
  const wrap = (children: ReactNode) =>
    gate === "absente" ? children : <ItemPicturesProvider enabled={gate === "ouverte"}>{children}</ItemPicturesProvider>;
  return { onSubmit, ...render(wrap(exercise)) };
}

const tile = (name: string) => screen.getByRole("button", { name });
/** Les pastilles d'imagier posées sur les tuiles, par identifiant d'image. */
const stickers = (root: ParentNode) => [...root.querySelectorAll("[data-item-picture]")].map((el) => el.getAttribute("data-item-picture"));
const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);

const ANIMALS: Payload = { left: ["le chat", "le chien", "la vache"], right: ["miaou", "ouaf", "meuh"] };

describe("association : la porte fermée ne change rien", () => {
  it("sans fournisseur, aucune tuile n'a d'image, même celles qui nomment une chose", () => {
    const { container } = renderMatch(ANIMALS, { gate: "absente" });
    expect(container.querySelector("img")).toBeNull();
    expect(stickers(container)).toEqual([]);
    expect(tile("le chat")).toBeTruthy();
  });

  it("avec un fournisseur fermé (une autre classe que le CI), c'est pareil", () => {
    const { container } = renderMatch(ANIMALS, { gate: "fermee" });
    expect(container.querySelector("img")).toBeNull();
    expect(stickers(container)).toEqual([]);
  });

  it("le DOM est le même sans fournisseur et avec un fournisseur fermé : le mot seul, dans son `TileGlyphs`", () => {
    const absent = renderMatch(ANIMALS, { gate: "absente" });
    const before = absent.container.innerHTML;
    absent.unmount();
    const closed = renderMatch(ANIMALS, { gate: "fermee" });
    expect(closed.container.innerHTML).toBe(before);
    const word = tile("le chat").querySelector("span.inline-block");
    expect(word?.textContent).toBe("le chat");
    expect(word?.className).toBe("inline-block hyphens-auto [overflow-wrap:anywhere]");
  });

  it("un émoji de tête reste dans le texte de la tuile quand la porte est fermée", () => {
    renderMatch({ left: ["🐕 le chien", "🐈 le chat"], right: ["ouaf", "miaou"] }, { gate: "fermee" });
    expect(tile("🐕 le chien")).toBeTruthy();
    expect(tile("🐈 le chat")).toBeTruthy();
  });
});

describe("association : la porte ouverte (CI)", () => {
  it("une tuile qui nomme une chose montre son image ET garde son nom écrit", () => {
    const { container } = renderMatch(ANIMALS);
    expect(stickers(container)).toEqual(["chat", "chien", "vache"]);
    const chat = tile("le chat");
    expect(chat.querySelector("[data-item-picture='chat'] img")?.getAttribute("src")).toBe("/objets/chat.webp");
    expect(chat.textContent).toBe("le chat");
    // Les tuiles de l'autre colonne ne nomment pas une chose : elles restent des mots.
    for (const word of ["miaou", "ouaf", "meuh"]) expect(tile(word).querySelector("img")).toBeNull();
  });

  it("l'image est décorative : le nom accessible de la tuile est son mot, rien d'autre", () => {
    const { container } = renderMatch(ANIMALS);
    for (const img of container.querySelectorAll("img")) expect(img.getAttribute("alt")).toBe("");
    expect(screen.queryByRole("img")).toBeNull();
    expect(tile("le chien")).toBeTruthy();
  });

  it("l'image est AU-DESSUS du mot sur un téléphone, À CÔTÉ à 640 px de large et plus, dans cet ordre", () => {
    renderMatch(ANIMALS);
    const chat = tile("le chat");
    const sticker = chat.querySelector("[data-item-picture]") as Element;
    const word = chat.querySelector("span.inline-block") as Element;
    expect(sticker.compareDocumentPosition(word) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(classesOf(sticker.parentElement)).toContain("flex-col");
    expect(classesOf(sticker.parentElement)).toContain("min-[640px]:flex-row");
  });

  it("l'émoji de tête cède la place à l'image : le mot s'écrit sans lui", () => {
    const { container } = renderMatch({ left: ["🐕 le chien", "🐈 le chat"], right: ["ouaf", "miaou"] });
    expect(stickers(container)).toEqual(["chien", "chat"]);
    // Le nom accessible n'est plus « 🐕 le chien » : l'image remplace l'émoji.
    expect(tile("le chien").textContent).toBe("le chien");
    expect(screen.queryByRole("button", { name: "🐕 le chien" })).toBeNull();
  });

  it("les deux côtés montrent leur image quand les deux nomment une chose", () => {
    const { container } = renderMatch({
      left: ["le crocodile", "l'éléphant", "la girafe"],
      right: ["la banane", "la mangue", "l'ananas"],
    });
    expect(stickers(container)).toEqual(["crocodile", "elephant", "girafe", "banane", "mangue", "ananas"]);
    for (const name of ["le crocodile", "l'éléphant", "la girafe", "la banane", "la mangue", "l'ananas"]) {
      expect(tile(name).textContent).toBe(name);
    }
  });

  it("une tuile hors catalogue, un pluriel ou un prénom restent des mots, sans image", () => {
    const { container } = renderMatch({ left: ["le chat", "Fatou", "les chats"], right: ["miaou", "bonjour", "miaou miaou"] });
    expect(stickers(container)).toEqual(["chat"]);
    expect(tile("Fatou").querySelector("img")).toBeNull();
    expect(tile("les chats").querySelector("img")).toBeNull();
  });

  it("une tuile à nombre, à signes ou à émojis seuls n'est jamais changée", () => {
    const { container } = renderMatch({ left: ["2", "3"], right: ["🥭🥭", "🥭🥭🥭"] });
    expect(container.querySelector("img")).toBeNull();
    expect(tile("🥭🥭")).toBeTruthy();
  });

  it("la pastille suit la largeur puis le nombre de paires : 36 px, 32 px dès quatre paires, 44 ou 56 px à côté du mot à 640 px et plus", () => {
    renderMatch(ANIMALS);
    const three = classesOf(tile("le chat").querySelector("[data-item-picture]"));
    expect(three).toContain("size-9");
    expect(three).toContain("min-[640px]:[@media(min-height:481px)_and_(max-height:960px)]:size-11");
    expect(three).toContain("min-[640px]:[@media(min-height:961px)]:size-14");
    cleanup();
    // Quatre paires : le cas courant du CI, et celui que le dock ne pardonne pas. La pastille se serre.
    renderMatch({
      left: ["le chat", "le chien", "le mouton", "la poule"],
      right: ["miaou", "ouaf", "bêê", "cot cot"],
    });
    expect(classesOf(tile("le chat").querySelector("[data-item-picture]"))).toContain("size-8");
    expect(classesOf(tile("le chat").querySelector("[data-item-picture]"))).not.toContain("size-9");
  });

  it("une colonne qui montre des images serre ses tuiles (8 px), une colonne de mots garde ses 12 px", () => {
    const { container } = renderMatch(ANIMALS);
    const columns = [...container.querySelectorAll("[data-columns] > div")];
    expect(columns).toHaveLength(2);
    expect(classesOf(columns[0])).toContain("space-y-2");
    expect(classesOf(columns[0])).not.toContain("space-y-3");
    // Les cris n'ont pas d'image : leur colonne est celle d'avant.
    expect(classesOf(columns[1])).toContain("space-y-3");
    cleanup();
    const bare = renderMatch(ANIMALS, { gate: "fermee" });
    for (const column of bare.container.querySelectorAll("[data-columns] > div")) expect(classesOf(column)).toContain("space-y-3");
  });

  it("l'image ne reçoit ni le toucher ni la sélection, et un toucher dessus choisit la tuile", () => {
    renderMatch(ANIMALS);
    const chat = tile("le chat");
    const img = chat.querySelector("img") as HTMLImageElement;
    const classes = classesOf(img);
    expect(classes).toContain("pointer-events-none");
    expect(classes).toContain("select-none");
    expect(img.getAttribute("draggable")).toBe("false");
    expect(chat.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(chat.querySelector("[data-item-picture]") as Element);
    expect(chat.getAttribute("aria-pressed")).toBe("true");
  });

  it("si le fichier ne charge pas, l'émoji de tête prend la place de l'image, le mot reste", () => {
    const { container } = renderMatch({ left: ["🐕 le chien", "🐈 le chat"], right: ["ouaf", "miaou"] });
    fireEvent.error(container.querySelector("[data-item-picture='chien'] img") as HTMLImageElement);
    const chien = tile("le chien");
    expect(chien.querySelector("img")).toBeNull();
    expect(chien.querySelector("[data-item-picture='repli']")?.textContent).toBe("🐕");
    expect(chien.querySelector("span.inline-block")?.textContent).toBe("le chien");
    // L'autre tuile garde son image.
    expect(tile("le chat").querySelector("img")).not.toBeNull();
  });

  it("sans émoji de tête, une image qui ne charge pas disparaît, sans icône cassée", () => {
    const { container } = renderMatch(ANIMALS);
    fireEvent.error(container.querySelector("[data-item-picture='vache'] img") as HTMLImageElement);
    expect(tile("la vache").querySelector("img")).toBeNull();
    expect(tile("la vache").textContent).toBe("la vache");
  });
});

describe("association : les garde-fous (l'image ne donne jamais la réponse)", () => {
  it("un côté en émojis, l'autre en mots : les mots n'ont pas d'image, les émojis restent des émojis", () => {
    const { container } = renderMatch({ left: ["le chat", "le chien"], right: ["🐕", "🐈"] }, { prompt: "Relie chaque mot à son dessin." });
    expect(stickers(container)).toEqual([]);
    expect(container.querySelector("img")).toBeNull();
    // Le côté des émojis est laissé tel quel : le glyphe en grand, sans pastille.
    const dog = tile("🐕");
    expect(dog.querySelector("span.inline-block")?.className).toContain("text-[1.75rem]");
    expect(dog.querySelector("[data-item-picture]")).toBeNull();
    expect(tile("le chat").textContent).toBe("le chat");
  });

  it("c'est le même garde-fou quand les mots sont à droite et les émojis à gauche", () => {
    const { container } = renderMatch({ left: ["🐈", "🐕"], right: ["le chien", "le chat"] });
    expect(stickers(container)).toEqual([]);
  });

  it("un seul émoji de l'autre côté suffit à retirer les images de TOUS les mots, pas d'une seule", () => {
    // « le chat » est montré en émoji à gauche : épargner « le chien » désignerait
    // « le chat » par élimination.
    const { container } = renderMatch({ left: ["🐈", "2"], right: ["le chat", "le chien"] });
    expect(stickers(container)).toEqual([]);
  });

  it("des émojis qui ne nomment pas ce que disent les mots ne retirent rien", () => {
    // « 🍎 » n'est pas « le chat » : les mots gardent leurs images.
    const { container } = renderMatch({ left: ["le chat", "le chien"], right: ["🍎", "🍌"] });
    expect(stickers(container)).toEqual(["chat", "chien"]);
  });

  it("un nombre ou un son de l'autre côté ne retire rien non plus", () => {
    const { container } = renderMatch({ left: ["le chat", "la poule", "le poisson"], right: ["4", "2", "0"] });
    expect(stickers(container)).toEqual(["chat", "poule", "poisson"]);
  });

  it("un énoncé qui demande de lire n'a aucune image", () => {
    const { container } = renderMatch(ANIMALS, { prompt: "Lis chaque mot, puis relie-le à son cri." });
    expect(stickers(container)).toEqual([]);
  });

  it("un énoncé qui montre l'émoji d'une des tuiles n'a aucune image", () => {
    const { container } = renderMatch(ANIMALS, { prompt: "Relie ce chat 🐈 à son cri." });
    expect(stickers(container)).toEqual([]);
  });

  it("une consigne de syllabes, vraie consigne du CI, n'a aucune image : ni sur les syllabes, ni sur les mots", () => {
    const { container } = renderMatch(
      { left: ["pou", "mi"], right: ["poule", "midi"] },
      { prompt: "Relie chaque syllabe au mot qui commence par elle." },
    );
    expect(stickers(container)).toEqual([]);
  });

  it("la même image des deux côtés (Arachide, Cacahuète) la retire des deux côtés : on ne relie pas deux dessins identiques", () => {
    const { container } = renderMatch(
      { left: ["Arachide", "Manguier"], right: ["Cacahuète", "Mangue"] },
      { prompt: "Associe chaque plante à son fruit." },
    );
    expect(stickers(container)).toEqual([]);
    expect(container.querySelector("img")).toBeNull();
  });

  it("l'image de l'énoncé est celle d'une tuile : aucune image sur les tuiles", () => {
    const view = render(
      <ItemPicturesProvider enabled>
        <MatchExercise
          prompt="Relie l'animal à son cri."
          payload={{ image: "chat", ...ANIMALS }}
          onSubmit={vi.fn()}
          disabled={false}
          isCorrect={null}
        />
      </ItemPicturesProvider>,
    );
    expect(stickers(view.container)).toEqual([]);
  });
});

describe("association : la réponse ne change jamais d'un caractère", () => {
  const PAYLOAD: Payload = { left: ["🐕 le chien", "🐈 le chat", "la vache"], right: ["miaou", "meuh", "ouaf"] };

  /** Joue toutes les paires, dans l'ordre de la colonne de gauche, et rend ce qui part à `onSubmit`. */
  function play(gate: "ouverte" | "fermee" | "absente"): string {
    const onSubmit = vi.fn();
    const view = renderMatch(PAYLOAD, { gate, onSubmit });
    const press = (el: Element) => fireEvent.click(el);
    // Les tuiles par colonne : les boutons dans l'ordre du DOM, sans « Valider ».
    const buttons = [...view.container.querySelectorAll<HTMLElement>("[data-side]")];
    const lefts = buttons.filter((b) => b.dataset.side === "left");
    const rights = buttons.filter((b) => b.dataset.side === "right");
    const partner = ["ouaf", "miaou", "meuh"];
    lefts.forEach((left, index) => {
      press(left);
      press(rights[PAYLOAD.right.indexOf(partner[index])]);
    });
    press(screen.getByRole("button", { name: "Valider" }));
    const answer = onSubmit.mock.calls[0][0] as string;
    view.unmount();
    return answer;
  }

  it("part en JSON des textes d'origine, émoji de tête compris", () => {
    expect(JSON.parse(play("ouverte"))).toEqual([
      { left: "🐕 le chien", right: "ouaf" },
      { left: "🐈 le chat", right: "miaou" },
      { left: "la vache", right: "meuh" },
    ]);
  });

  it("est la même chaîne, au caractère près, porte ouverte, fermée ou sans fournisseur", () => {
    const open = play("ouverte");
    expect(play("fermee")).toBe(open);
    expect(play("absente")).toBe(open);
  });
});

describe("association : le contrat du DOM reste celui de la galerie, de la vitrine et des tests", () => {
  it("les tuiles de gauche sont les N premiers boutons, celles de droite les N suivants, puis « Valider »", () => {
    renderMatch(ANIMALS);
    const names = screen.getAllByRole("button").map((button) => button.textContent?.trim());
    expect(names).toEqual(["le chat", "le chien", "la vache", "miaou", "ouaf", "meuh", "Valider"]);
  });

  it("une tuile à image se relie, se défait et porte `data-linked` et `data-rank` comme avant", () => {
    renderMatch(ANIMALS);
    fireEvent.click(tile("le chat"));
    fireEvent.click(tile("ouaf"));
    expect(tile("le chat").getAttribute("data-linked")).toBe("true");
    expect(tile("le chat").getAttribute("data-rank")).toBe("0");
    expect(tile("ouaf").getAttribute("data-rank")).toBe("0");
    // Le câble relie les deux prises : la mesure des tuiles à image ne l'a pas cassé.
    fireEvent.click(tile("le chat"));
    expect(tile("le chat").getAttribute("data-linked")).toBe("false");
  });

  it("la largeur des colonnes suit le contenu comme avant : les mots à droite se serrent à un tiers", () => {
    const { container } = renderMatch({ left: ["le chat", "la poule"], right: ["4", "2"] });
    expect(container.querySelector("[data-columns]")?.getAttribute("data-columns")).toBe("droite-etroite");
  });
});
