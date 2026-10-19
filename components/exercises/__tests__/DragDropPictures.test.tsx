import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import DragDropExercise from "../DragDropExercise";
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
 * LE GLISSER-DÉPOSER EN CI : UNE ÉTIQUETTE OU UNE CASE QUI NOMME UNE CHOSE
 * MONTRE SON IMAGE.
 *
 * « Lion », « Poule » ou « La table » ne se lisent pas encore à six ans. Ces
 * tests tiennent ce que l'écran promet : l'image est là, avec le mot, sur
 * l'étiquette (au bac, dans une boîte, sous le doigt) et sur le nom d'une case
 * qui nomme une chose ; une catégorie (« Brousse ») reste telle quelle ; la
 * porte fermée ne change rien ; la prise (`touch-none`, le toucher en deux
 * temps) et la réponse restent celles d'avant. Les gestes au toucher sont ceux
 * de `DragDropTap.test.tsx`, que la suite existante garde verte.
 */

type Payload = { zones: string[]; items: { text: string }[] };

const PROMPT = "Où vit chaque animal ? Glisse-le dans sa case.";
const FARM: Payload = { zones: ["Brousse", "Basse-cour"], items: [{ text: "Lion" }, { text: "Poule" }, { text: "Girafe" }] };

type Gate = "ouverte" | "fermee" | "absente";

function renderDrag(payload: Payload, options: { gate?: Gate; prompt?: string; onSubmit?: (answer: string) => void } = {}) {
  const { gate = "ouverte", prompt = PROMPT, onSubmit = vi.fn() } = options;
  const exercise = (
    <DragDropExercise prompt={prompt} payload={payload} onSubmit={onSubmit} disabled={false} isCorrect={null} />
  );
  const wrap = (children: ReactNode) =>
    gate === "absente" ? children : <ItemPicturesProvider enabled={gate === "ouverte"}>{children}</ItemPicturesProvider>;
  const view = render(wrap(exercise));
  return { onSubmit, ...view };
}

/** Les étiquettes (le nœud que dnd-kit tient), par texte écrit. */
function draggable(text: string): HTMLElement {
  const found = Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="draggable"]')).find(
    (el) => el.textContent?.trim() === text,
  );
  if (!found) throw new Error(`étiquette « ${text} » introuvable`);
  return found;
}
/** La case est le parent direct de son titre : la galerie et la vitrine le lisent ainsi. */
const zone = (label: string) => screen.getByRole("heading", { name: label }).parentElement as HTMLElement;
const stickers = (root: ParentNode) => [...root.querySelectorAll("[data-item-picture]")].map((el) => el.getAttribute("data-item-picture"));
const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
/** dnd-kit numérote ses régions vocales : deux rendus de la même page n'ont pas les mêmes numéros. */
const withoutDndIds = (html: string) => html.replace(/(DndDescribedBy|DndLiveRegion)-\d+/g, "$1-N");

describe("glisser-déposer : la porte fermée ne change rien", () => {
  it("sans fournisseur, aucune étiquette ni aucune case n'a d'image", () => {
    const { container } = renderDrag(FARM, { gate: "absente" });
    expect(container.querySelector("img")).toBeNull();
    expect(stickers(container)).toEqual([]);
  });

  it("avec un fournisseur fermé (une autre classe que le CI), c'est pareil", () => {
    const { container } = renderDrag(FARM, { gate: "fermee" });
    expect(container.querySelector("img")).toBeNull();
    expect(stickers(container)).toEqual([]);
  });

  it("le DOM est le même sans fournisseur et avec un fournisseur fermé", () => {
    const absent = renderDrag(FARM, { gate: "absente" });
    const before = withoutDndIds(absent.container.innerHTML);
    absent.unmount();
    const closed = renderDrag(FARM, { gate: "fermee" });
    expect(withoutDndIds(closed.container.innerHTML)).toBe(before);
  });

  it("la plaque d'une case et le bac sont ceux d'avant : pas de `flex-wrap` sur le titre, la même rangée minimale", () => {
    const { container } = renderDrag(FARM, { gate: "fermee" });
    expect(classesOf(screen.getByRole("heading", { name: "Brousse" }))).not.toContain("flex-wrap");
    expect(container.querySelector("[data-tray] > div")?.className).toBe(
      "flex min-h-[4.5rem] flex-wrap items-start justify-center gap-4",
    );
  });

  it("un émoji de tête reste dans le texte de l'étiquette quand la porte est fermée", () => {
    renderDrag({ zones: ["Brousse", "Basse-cour"], items: [{ text: "🦁 Lion" }, { text: "🐔 Poule" }] }, { gate: "fermee" });
    expect(draggable("🦁 Lion")).toBeTruthy();
  });
});

describe("glisser-déposer : les étiquettes en CI", () => {
  it("une étiquette qui nomme une chose montre son image ET garde son nom écrit", () => {
    const { container } = renderDrag(FARM);
    expect(stickers(container)).toEqual(["lion", "poule", "girafe"]);
    const lion = draggable("Lion");
    expect(lion.querySelector("[data-item-picture='lion'] img")?.getAttribute("src")).toBe("/objets/lion.webp");
    expect(lion.textContent).toBe("Lion");
  });

  it("l'image est AU-DESSUS du mot sur un téléphone, À CÔTÉ à 640 px de large et plus, dans cet ordre", () => {
    renderDrag(FARM);
    const lion = draggable("Lion");
    const sticker = lion.querySelector("[data-item-picture]") as Element;
    const word = lion.querySelector("span.inline-block") as Element;
    expect(sticker.compareDocumentPosition(word) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(classesOf(sticker.parentElement)).toContain("flex-col");
    expect(classesOf(sticker.parentElement)).toContain("min-[640px]:flex-row");
  });

  it("l'émoji de tête cède la place à l'image, le mot s'écrit sans lui", () => {
    const { container } = renderDrag({ zones: ["Brousse", "Basse-cour"], items: [{ text: "🦁 Lion" }, { text: "🐔 Poule" }] });
    expect(stickers(container)).toEqual(["lion", "poule"]);
    expect(draggable("Lion")).toBeTruthy();
    expect(() => draggable("🦁 Lion")).toThrow();
  });

  it("une étiquette hors catalogue ou au pluriel reste un mot", () => {
    const { container } = renderDrag({ zones: ["Brousse", "Basse-cour"], items: [{ text: "Lion" }, { text: "Fatou" }, { text: "les chats" }] });
    expect(stickers(container)).toEqual(["lion"]);
    expect(draggable("Fatou").querySelector("img")).toBeNull();
  });

  it("les formes en émojis, les syllabes et les chiffres ne sont jamais changés", () => {
    const { container } = renderDrag({ zones: ["Ronds", "Carrés"], items: [{ text: "🔴" }, { text: "🟦" }, { text: "pa" }] });
    expect(container.querySelector("img")).toBeNull();
  });

  it("une catégorie (Brousse, Basse-cour, Naturel, Fixe) n'est pas au catalogue : la case n'a pas d'image", () => {
    const { container } = renderDrag({ zones: ["Naturel", "Fabriqué"], items: [{ text: "Le baobab" }, { text: "La table" }] });
    expect(zone("Naturel").querySelector("img")).toBeNull();
    expect(zone("Fabriqué").querySelector("img")).toBeNull();
    // Les étiquettes, elles, nomment des choses.
    expect(stickers(container)).toEqual(["baobab", "table"]);
  });

  it("un lieu du catalogue (la savane, la ferme) montre sa scène sur sa case : l'élève joue sans lire", () => {
    const { container } = renderDrag({ zones: ["Savane", "Ferme"], items: [{ text: "Lion" }, { text: "Poule" }] });
    expect(zone("Savane").querySelector("[data-item-picture='savane'] img")?.getAttribute("src")).toBe("/objets/savane.webp");
    expect(zone("Ferme").querySelector("[data-item-picture='ferme'] img")?.getAttribute("src")).toBe("/objets/ferme.webp");
    expect(stickers(container).sort()).toEqual(["ferme", "lion", "poule", "savane"]);
  });

  it("garde sa prise : `touch-none`, `select-none`, `draggable`, et une image qui ne reçoit ni le toucher ni la sélection", () => {
    renderDrag(FARM);
    const lion = draggable("Lion");
    const classes = classesOf(lion);
    expect(classes).toContain("touch-none");
    expect(classes).toContain("select-none");
    expect(lion.getAttribute("aria-roledescription")).toBe("draggable");
    expect(lion.getAttribute("aria-pressed")).toBe("false");
    const img = lion.querySelector("img") as HTMLImageElement;
    expect(classesOf(img)).toContain("pointer-events-none");
    expect(classesOf(img)).toContain("select-none");
    expect(img.getAttribute("draggable")).toBe("false");
  });

  it("un toucher sur l'image choisit l'étiquette, comme un toucher sur le mot", () => {
    renderDrag(FARM);
    fireEvent.click(draggable("Lion").querySelector("[data-item-picture]") as Element);
    expect(draggable("Lion").getAttribute("aria-pressed")).toBe("true");
    expect(zone("Brousse").getAttribute("data-armed")).toBe("true");
  });

  it("se joue au clavier comme avant : Entrée choisit l'étiquette à image", () => {
    renderDrag(FARM);
    fireEvent.keyDown(draggable("Poule"), { key: "Enter" });
    expect(draggable("Poule").getAttribute("aria-pressed")).toBe("true");
  });

  it("si le fichier ne charge pas, l'émoji de tête prend la place de l'image, le mot reste", () => {
    const { container } = renderDrag({ zones: ["Brousse", "Basse-cour"], items: [{ text: "🦁 Lion" }, { text: "🐔 Poule" }] });
    fireEvent.error(container.querySelector("[data-item-picture='lion'] img") as HTMLImageElement);
    // Le texte de l'étiquette est maintenant « 🦁Lion » (l'émoji de repli, puis le mot) : on la repère par son repli.
    const fallback = container.querySelector("[data-item-picture='repli']") as Element;
    const lion = fallback.closest('[aria-roledescription="draggable"]') as HTMLElement;
    expect(lion.querySelector("img")).toBeNull();
    expect(fallback.textContent).toBe("🦁");
    expect(lion.querySelector("span.inline-block")?.textContent).toBe("Lion");
  });

  it("la rangée du bac garde sa classe d'avant, avec ou sans image : une étiquette à pastille ne dépasse pas ses 72 px", () => {
    const { container } = renderDrag(FARM);
    expect(container.querySelector("[data-tray] > div")?.className).toBe("flex min-h-[4.5rem] flex-wrap items-start justify-center gap-4");
  });

  it("dès quatre étiquettes, la pastille se serre à 32 px", () => {
    const four: Payload = {
      zones: ["Brousse", "Basse-cour"],
      items: [{ text: "Lion" }, { text: "Poule" }, { text: "Girafe" }, { text: "Chèvre" }],
    };
    renderDrag(four);
    expect(classesOf(draggable("Lion").querySelector("[data-item-picture]"))).toContain("size-8");
    cleanup();
    // Trois étiquettes : 36 px.
    renderDrag(FARM);
    expect(classesOf(draggable("Lion").querySelector("[data-item-picture]"))).toContain("size-9");
  });

  it("garde-fou f : la même image sur les étiquettes et sur les cases la retire des deux", () => {
    const { container } = renderDrag(
      { zones: ["Arachide", "Manguier"], items: [{ text: "Cacahuète" }, { text: "Mangue" }] },
      { prompt: "Glisse chaque fruit sous sa plante." },
    );
    expect(stickers(container)).toEqual([]);
  });

  it("garde-fou a : une phrase à ranger n'a aucune image", () => {
    const { container } = renderDrag(
      { zones: ["Fatou a une mangue.", "Mots mélangés."], items: [{ text: "une" }, { text: "mangue" }] },
      { prompt: "Mets les mots dans l'ordre : une, Fatou, mangue, a." },
    );
    expect(stickers(container)).toEqual([]);
  });
});

describe("glisser-déposer : les cases qui nomment une chose", () => {
  const FEED: Payload = { zones: ["La poule", "La vache", "Le mouton"], items: [{ text: "Le mil" }, { text: "La carotte" }, { text: "Le riz" }] };

  it("la case pose son image dans sa plaque, devant son nom, et le titre reste le nom", () => {
    renderDrag(FEED);
    const heading = screen.getByRole("heading", { name: "La poule" });
    expect(heading.querySelector("[data-item-picture='poule'] img")?.getAttribute("src")).toBe("/objets/poule.webp");
    expect(heading.textContent).toBe("La poule");
    // Le titre est toujours l'enfant direct de la boîte (la galerie, la vitrine et les tests le lisent ainsi).
    expect(heading.parentElement?.className).toContain("gk-box");
    // L'image est avant le nom.
    expect(heading.firstElementChild?.getAttribute("data-item-picture")).toBe("poule");
  });

  it("la plaque passe en `flex-wrap` : l'image et le nom tiennent sur une ligne si la boîte est large, dessous sinon", () => {
    renderDrag(FEED);
    const classes = classesOf(screen.getByRole("heading", { name: "La vache" }));
    expect(classes).toContain("flex");
    expect(classes).toContain("flex-wrap");
    expect(classes).toContain("justify-center");
  });

  it("une case et ses étiquettes ont chacune leur image : les trois boîtes, les trois étiquettes", () => {
    const { container } = renderDrag(FEED);
    expect(stickers(container).sort()).toEqual(["carotte", "mil", "mouton", "poule", "riz", "vache"]);
  });

  it("une catégorie à côté d'une case qui nomme une chose reste telle quelle", () => {
    renderDrag({ zones: ["La poule", "Brousse"], items: [{ text: "Le mil" }, { text: "Lion" }] });
    expect(screen.getByRole("heading", { name: "La poule" }).querySelector("img")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Brousse" }).querySelector("img")).toBeNull();
  });

  it("une case dont l'émoji de tête remplace son image : le nom s'écrit sans l'émoji, et l'émoji revient si le fichier manque", () => {
    const { container } = renderDrag({ zones: ["🐔 Poule", "🐄 Vache"], items: [{ text: "Le mil" }, { text: "Le riz" }] });
    const heading = screen.getByRole("heading", { name: "Poule" });
    expect(heading.querySelector("[data-item-picture='poule']")).not.toBeNull();
    fireEvent.error(container.querySelector("[data-item-picture='poule'] img") as HTMLImageElement);
    expect(heading.querySelector("img")).toBeNull();
    expect(heading.querySelector("[data-item-picture='repli']")?.textContent).toBe("🐔");
    expect(heading.textContent).toContain("Poule");
  });
});

describe("glisser-déposer : l'étiquette garde son image où qu'elle aille", () => {
  it("posée dans une boîte, l'étiquette y montre toujours son image, et le bac ne la montre plus", () => {
    renderDrag(FARM);
    fireEvent.click(draggable("Lion"));
    fireEvent.click(zone("Brousse"));
    expect(stickers(zone("Brousse"))).toEqual(["lion"]);
    expect(zone("Brousse").textContent).toContain("Lion");
    const tray = document.querySelector("[data-tray]") as Element;
    expect(stickers(tray)).toEqual(["poule", "girafe"]);
  });

  it("le bac vidé garde la hauteur d'une rangée : les boîtes ne remontent pas à la dernière étiquette", () => {
    const { container } = renderDrag(FARM);
    for (const [text, where] of [
      ["Lion", "Brousse"],
      ["Poule", "Basse-cour"],
      ["Girafe", "Brousse"],
    ]) {
      fireEvent.click(draggable(text));
      fireEvent.click(zone(where));
    }
    expect(screen.getByText("Tout est rangé !")).toBeTruthy();
    const row = container.querySelector("[data-tray] > div") as Element;
    expect(row.children).toHaveLength(0);
    expect(classesOf(row)).toContain("min-h-[4.5rem]");
  });

  it("sous le doigt, l'étiquette portée par `DragOverlay` montre la même image et le même mot", async () => {
    const { container } = renderDrag(FARM);
    const lion = draggable("Lion");
    // Un glissé : le doigt se pose, puis dépasse les 8 px du capteur.
    act(() => {
      fireEvent.pointerDown(lion, { isPrimary: true, button: 0, pointerId: 1, clientX: 20, clientY: 20 });
    });
    try {
      act(() => {
        fireEvent.pointerMove(document, { isPrimary: true, pointerId: 1, clientX: 40, clientY: 50 });
      });
      // L'original laisse son creux ; l'étiquette en l'air porte son image.
      const pictures = [...container.querySelectorAll<HTMLElement>("[data-item-picture='lion']")];
      expect(pictures).toHaveLength(2);
      const inAir = pictures
        .map((el) => el.closest("[data-elevation]"))
        .find((el) => el?.getAttribute("data-elevation") === "saisie");
      expect(inAir).toBeTruthy();
      expect(inAir?.textContent).toBe("Lion");
    } finally {
      // Le doigt se lève. dnd-kit garde ses écouteurs sur le document (dont celui qui
      // avale le clic suivant) pendant 50 ms après la fin du glissé : on les attend,
      // sinon ils avalent les clics des tests d'après.
      act(() => {
        fireEvent.pointerUp(document, { isPrimary: true, pointerId: 1, clientX: 40, clientY: 50 });
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
      });
    }
  });
});

describe("glisser-déposer : les garde-fous (l'image ne donne jamais la réponse)", () => {
  it("des cases en émojis et des étiquettes en mots : les mots n'ont pas d'image, les émojis restent des émojis", () => {
    const { container } = renderDrag(
      { zones: ["🐈", "🐕"], items: [{ text: "le chat" }, { text: "le chien" }] },
      { prompt: "Range chaque mot sous son dessin." },
    );
    expect(stickers(container)).toEqual([]);
    expect(screen.getByRole("heading", { name: "🐈" })).toBeTruthy();
  });

  it("des cases en mots et des étiquettes en émojis : les noms des cases n'ont pas d'image non plus", () => {
    const { container } = renderDrag({ zones: ["le chat", "le chien"], items: [{ text: "🐈" }, { text: "🐕" }] });
    expect(stickers(container)).toEqual([]);
    expect(zone("le chat").querySelector("img")).toBeNull();
  });

  it("des émojis qui ne nomment pas ce que disent les mots ne retirent rien", () => {
    const { container } = renderDrag({ zones: ["🍎", "🍌"], items: [{ text: "le chat" }, { text: "le chien" }] });
    expect(stickers(container)).toEqual(["chat", "chien"]);
  });

  it("un énoncé qui demande de lire n'a aucune image, ni sur les étiquettes ni sur les cases", () => {
    const { container } = renderDrag(
      { zones: ["La poule", "La vache"], items: [{ text: "Le mil" }, { text: "Le riz" }] },
      { prompt: "Lis le mot, puis glisse-le dans sa case." },
    );
    expect(stickers(container)).toEqual([]);
  });

  it("un énoncé qui montre l'émoji d'une étiquette n'a aucune image sur les étiquettes", () => {
    const { container } = renderDrag(FARM, { prompt: "Où vit ce lion 🦁 ? Glisse les étiquettes." });
    expect(stickers(container)).toEqual([]);
  });
});

describe("glisser-déposer : la réponse ne change jamais d'un caractère", () => {
  const PAYLOAD: Payload = { zones: ["Brousse", "Basse-cour"], items: [{ text: "🦁 Lion" }, { text: "🐔 Poule" }, { text: "Girafe" }] };

  /** Pose chaque étiquette dans sa case par le toucher, valide, et rend ce qui part à `onSubmit`. */
  function play(gate: Gate): string {
    const onSubmit = vi.fn();
    const view = renderDrag(PAYLOAD, { gate, onSubmit });
    // Le texte écrit change avec l'image (sans l'émoji) : on repère les étiquettes par leur rang dans le bac.
    const chips = () => [...document.querySelectorAll<HTMLElement>("[data-tray] [aria-roledescription=draggable]")];
    const boxes = [...document.querySelectorAll<HTMLElement>(".gk-box")];
    const where = [0, 1, 0];
    for (const target of where) {
      fireEvent.click(chips()[0]);
      fireEvent.click(boxes[target]);
    }
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    const answer = onSubmit.mock.calls[0][0] as string;
    view.unmount();
    return answer;
  }

  it("part en JSON des textes d'origine, émoji de tête compris", () => {
    expect(JSON.parse(play("ouverte"))).toEqual({ "🦁 Lion": "Brousse", "🐔 Poule": "Basse-cour", Girafe: "Brousse" });
  });

  it("est la même chaîne, au caractère près, porte ouverte, fermée ou sans fournisseur", () => {
    const open = play("ouverte");
    expect(play("fermee")).toBe(open);
    expect(play("absente")).toBe(open);
  });

  it("le toucher en deux temps pose une étiquette à image dans une case à image", () => {
    renderDrag({ zones: ["La poule", "La vache"], items: [{ text: "Le mil" }, { text: "Le riz" }] });
    fireEvent.click(draggable("Le mil"));
    fireEvent.click(zone("La poule"));
    expect(zone("La poule").textContent).toContain("Le mil");
    expect(stickers(zone("La poule"))).toEqual(["poule", "mil"]);
  });
});
