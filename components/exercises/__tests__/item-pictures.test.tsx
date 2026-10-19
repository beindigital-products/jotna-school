import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { ITEM_IMAGES, type ItemImage } from "@/lib/item-images";
import { ItemPicture, ItemPicturesProvider, useItemPicturesEnabled, useTilePictures } from "../item-pictures";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const image = (id: string): ItemImage => {
  const found = ITEM_IMAGES.find((entry) => entry.id === id);
  if (!found) throw new Error(`image absente du catalogue : ${id}`);
  return found;
};

const on = ({ children }: { children: ReactNode }) => <ItemPicturesProvider enabled>{children}</ItemPicturesProvider>;
const off = ({ children }: { children: ReactNode }) => <ItemPicturesProvider enabled={false}>{children}</ItemPicturesProvider>;

const idsOf = (pictures: (ItemImage | null)[]) => pictures.map((picture) => picture?.id ?? null);
const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);

describe("ItemPicturesProvider : la porte", () => {
  it("est fermée hors fournisseur : le web des autres classes ne change pas", () => {
    const { result } = renderHook(() => useItemPicturesEnabled());
    expect(result.current).toBe(false);
  });

  it("s'ouvre avec enabled, se ferme sans", () => {
    expect(renderHook(() => useItemPicturesEnabled(), { wrapper: on }).result.current).toBe(true);
    expect(renderHook(() => useItemPicturesEnabled(), { wrapper: off }).result.current).toBe(false);
  });

  it("suit enabled quand la classe change", () => {
    function Probe() {
      return <p>{useItemPicturesEnabled() ? "ouverte" : "fermée"}</p>;
    }
    const { rerender } = render(
      <ItemPicturesProvider enabled={false}>
        <Probe />
      </ItemPicturesProvider>,
    );
    expect(screen.getByText("fermée")).toBeTruthy();
    rerender(
      <ItemPicturesProvider enabled>
        <Probe />
      </ItemPicturesProvider>,
    );
    expect(screen.getByText("ouverte")).toBeTruthy();
  });

  it("le fournisseur le plus proche décide", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ItemPicturesProvider enabled>
        <ItemPicturesProvider enabled={false}>{children}</ItemPicturesProvider>
      </ItemPicturesProvider>
    );
    expect(renderHook(() => useItemPicturesEnabled(), { wrapper }).result.current).toBe(false);
  });
});

describe("useTilePictures : la résolution", () => {
  const tiles = ["🐕 le chien", "Lion", "Fatou"];

  it("rend un tableau de null, de la même longueur, quand la porte est fermée", () => {
    const outside = renderHook(() => useTilePictures(tiles));
    expect(outside.result.current).toEqual([null, null, null]);
    const closed = renderHook(() => useTilePictures(tiles), { wrapper: off });
    expect(closed.result.current).toEqual([null, null, null]);
  });

  it("rend l'image de chaque tuile, ou null, quand la porte est ouverte", () => {
    const { result } = renderHook(() => useTilePictures(tiles), { wrapper: on });
    expect(idsOf(result.current)).toEqual(["chien", "lion", null]);
  });

  it("applique les garde-fous de l'énoncé et de l'autre côté d'une association", () => {
    const reading = renderHook(() => useTilePictures(["le chat", "le chien"], { prompt: "Lis le mot : chat" }), {
      wrapper: on,
    });
    expect(idsOf(reading.result.current)).toEqual([null, null]);

    const emoji = renderHook(() => useTilePictures(["l'éléphant", "le lion"], { prompt: "Quel animal est-ce ? 🐘" }), {
      wrapper: on,
    });
    expect(idsOf(emoji.result.current)).toEqual([null, null]);

    const match = renderHook(() => useTilePictures(["le chat", "le chien"], { glyphTiles: ["🐈", "🐕"] }), {
      wrapper: on,
    });
    expect(idsOf(match.result.current)).toEqual([null, null]);

    const free = renderHook(() => useTilePictures(["le chat", "le chien"], { prompt: "Quel animal miaule ?" }), {
      wrapper: on,
    });
    expect(idsOf(free.result.current)).toEqual(["chat", "chien"]);
  });

  it("passe au résolveur tout ce que l'écran sait : un QCM, l'autre groupe de tuiles, l'image d'énoncé", () => {
    // Un QCM (`choice`) : « Fatou » n'a pas d'image, le chien seul désignerait la réponse.
    const choice = renderHook(() => useTilePictures(["le chien", "Fatou"], { choice: true }), { wrapper: on });
    expect(idsOf(choice.result.current)).toEqual([null, null]);
    const free = renderHook(() => useTilePictures(["le chien", "Fatou"]), { wrapper: on });
    expect(idsOf(free.result.current)).toEqual(["chien", null]);

    // L'autre groupe montre la même image (« Arachide » face à « Cacahuète »).
    const counterpart = renderHook(() => useTilePictures(["Arachide"], { counterpart: ["Cacahuète"] }), { wrapper: on });
    expect(idsOf(counterpart.result.current)).toEqual([null]);

    // L'image de l'énoncé est celle d'une tuile.
    const exerciseImage = renderHook(() => useTilePictures(["le chat", "le chien"], { exerciseImage: "chat" }), { wrapper: on });
    expect(idsOf(exerciseImage.result.current)).toEqual([null, null]);
    const other = renderHook(() => useTilePictures(["le chat", "le chien"], { exerciseImage: "lion" }), { wrapper: on });
    expect(idsOf(other.result.current)).toEqual(["chat", "chien"]);
  });

  it("se recalcule quand seul un de ces éléments change", () => {
    const { result, rerender } = renderHook(
      ({ choice, counterpart, exerciseImage }: { choice: boolean; counterpart: string[]; exerciseImage?: string }) =>
        useTilePictures(["le chien", "Fatou"], { choice, counterpart, exerciseImage }),
      { wrapper: on, initialProps: { choice: false, counterpart: [] as string[], exerciseImage: undefined as string | undefined } },
    );
    expect(idsOf(result.current)).toEqual(["chien", null]);
    rerender({ choice: true, counterpart: [], exerciseImage: undefined });
    expect(idsOf(result.current)).toEqual([null, null]);
    rerender({ choice: false, counterpart: ["le chien"], exerciseImage: undefined });
    expect(idsOf(result.current)).toEqual([null, null]);
    rerender({ choice: false, counterpart: [], exerciseImage: "chien" });
    expect(idsOf(result.current)).toEqual([null, null]);
    rerender({ choice: false, counterpart: [], exerciseImage: undefined });
    expect(idsOf(result.current)).toEqual(["chien", null]);
  });

  it("reste le même objet tant que le CONTENU ne change pas, quelle que soit l'identité des arguments", () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: string[] }) => useTilePictures(list, { prompt: "Quel animal ?", glyphTiles: ["🍎"] }),
      { wrapper: on, initialProps: { list: ["le chat", "le lion"] } },
    );
    const first = result.current;
    expect(idsOf(first)).toEqual(["chat", "lion"]);

    rerender({ list: ["le chat", "le lion"] });
    expect(result.current).toBe(first);
  });

  it("se recalcule quand les tuiles ou l'énoncé changent", () => {
    const { result, rerender } = renderHook(
      ({ list, prompt }: { list: string[]; prompt: string }) => useTilePictures(list, { prompt }),
      { wrapper: on, initialProps: { list: ["le chat", "le lion"], prompt: "Quel animal ?" } },
    );
    expect(idsOf(result.current)).toEqual(["chat", "lion"]);

    rerender({ list: ["le chat", "le chien"], prompt: "Quel animal ?" });
    expect(idsOf(result.current)).toEqual(["chat", "chien"]);

    rerender({ list: ["le chat", "le chien"], prompt: "Lis le mot" });
    expect(idsOf(result.current)).toEqual([null, null]);
  });

  it("deux listes qui se ressemblent sans être les mêmes ne se confondent pas", () => {
    const { result, rerender } = renderHook(({ list }: { list: string[] }) => useTilePictures(list), {
      wrapper: on,
      initialProps: { list: ["le chat", "le lion"] },
    });
    expect(idsOf(result.current)).toEqual(["chat", "lion"]);
    rerender({ list: ["le chat le lion"] });
    expect(idsOf(result.current)).toEqual([null]);
  });

  it("suit la porte : fermée puis ouverte, les images apparaissent", () => {
    function Probe({ enabled }: { enabled: boolean }) {
      return (
        <ItemPicturesProvider enabled={enabled}>
          <Inner />
        </ItemPicturesProvider>
      );
    }
    function Inner() {
      const pictures = useTilePictures(["le chat", "le lion"]);
      return <p>{pictures.map((picture) => picture?.id ?? "-").join(",")}</p>;
    }
    const { rerender } = render(<Probe enabled={false} />);
    expect(screen.getByText("-,-")).toBeTruthy();
    rerender(<Probe enabled />);
    expect(screen.getByText("chat,lion")).toBeTruthy();
  });

  it("rend un tableau vide pour aucune tuile", () => {
    expect(renderHook(() => useTilePictures([]), { wrapper: on }).result.current).toEqual([]);
    expect(renderHook(() => useTilePictures([]), { wrapper: off }).result.current).toEqual([]);
  });
});

describe("ItemPicture : la pastille", () => {
  it("montre l'image du catalogue, depuis les fichiers du site", () => {
    const { container } = render(<ItemPicture image={image("chat")} />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/objets/chat.webp");
    expect(img?.getAttribute("width")).toBe("384");
    expect(img?.getAttribute("height")).toBe("384");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(img?.getAttribute("draggable")).toBe("false");
  });

  it("est décorative : le texte alternatif est vide, le nom écrit est à côté", () => {
    const { container } = render(<ItemPicture image={image("chat")} />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("ne reçoit ni le toucher ni la sélection : l'appui long d'iOS n'ouvre pas le menu de l'image", () => {
    const { container } = render(<ItemPicture image={image("chat")} />);
    const classes = classesOf(container.querySelector("img"));
    expect(classes).toContain("pointer-events-none");
    expect(classes).toContain("select-none");
    expect(classes).toContain("object-contain");
  });

  it("est un autocollant d'imagier : pastille blanche arrondie, qui ne rétrécit pas", () => {
    const { container } = render(<ItemPicture image={image("chat")} />);
    const sticker = container.firstElementChild;
    const classes = classesOf(sticker);
    for (const name of ["inline-flex", "shrink-0", "items-center", "justify-center", "rounded-xl", "bg-white", "p-0.5"]) {
      expect(classes, name).toContain(name);
    }
    expect(sticker?.getAttribute("data-item-picture")).toBe("chat");
  });

  it.each([
    ["xs", "size-9"],
    ["sm", "size-11"],
    ["md", "size-14"],
    ["lg", "size-18"],
  ] as const)("la taille %s met la classe %s", (size, className) => {
    const { container } = render(<ItemPicture image={image("lion")} size={size} />);
    expect(classesOf(container.firstElementChild)).toContain(className);
  });

  it("prend la taille md par défaut", () => {
    const { container } = render(<ItemPicture image={image("lion")} />);
    expect(classesOf(container.firstElementChild)).toContain("size-14");
  });

  it("ajoute className à la pastille", () => {
    const { container } = render(<ItemPicture image={image("lion")} className="ml-2 opacity-80" />);
    const classes = classesOf(container.firstElementChild);
    expect(classes).toContain("ml-2");
    expect(classes).toContain("opacity-80");
    expect(classes).toContain("size-14");
  });

  it("className peut surcharger la taille : la dernière classe de taille l'emporte", () => {
    const { container } = render(<ItemPicture image={image("lion")} size="lg" className="size-9" />);
    const classes = classesOf(container.firstElementChild);
    expect(classes).toContain("size-9");
    expect(classes).not.toContain("size-18");
  });

  it("className garde la taille de base quand il ne la change que sous une requête média", () => {
    const short = "[@media(max-height:667px)]:size-9";
    const medium = "[@media(max-height:960px)_and_(min-height:668px)]:size-11";
    const { container } = render(<ItemPicture image={image("lion")} className={`${medium} ${short}`} />);
    const classes = classesOf(container.firstElementChild);
    expect(classes).toContain("size-14");
    expect(classes).toContain(short);
    expect(classes).toContain(medium);
  });
});

describe("ItemPicture : quand le fichier ne charge pas", () => {
  it("montre l'émoji de la tuile, au même encombrement, sans icône cassée", () => {
    const { container } = render(<ItemPicture image={image("chien")} emoji="🐕" size="lg" className="ml-2" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("🐕")).toBeTruthy();
    const fallback = container.firstElementChild;
    const classes = classesOf(fallback);
    expect(classes).toContain("size-18");
    expect(classes).toContain("shrink-0");
    expect(classes).toContain("select-none");
    expect(classes).toContain("ml-2");
    expect(fallback?.getAttribute("aria-hidden")).toBe("true");
    // Plus de fond blanc : c'est l'émoji d'avant, pas un autocollant sans image.
    expect(classes).not.toContain("bg-white");
  });

  it("l'émoji de repli suit la taille de la pastille, même quand une requête média la réduit", () => {
    const { container } = render(<ItemPicture image={image("chien")} emoji="🐕" className="[@media(max-height:667px)]:size-9" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    const fallback = container.firstElementChild;
    expect(classesOf(fallback)).toContain("[container-type:inline-size]");
    expect(classesOf(fallback?.firstElementChild ?? null)).toContain("[font-size:72cqw]");
  });

  it("disparaît sans émoji : rien dans le DOM, pas d'icône cassée", () => {
    const { container } = render(<ItemPicture image={image("chien")} />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.firstChild).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("disparaît aussi avec un émoji vide", () => {
    const { container } = render(<ItemPicture image={image("chien")} emoji="" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.firstChild).toBeNull();
  });

  it("donne sa chance à une autre image : l'échec est celui d'UNE image, pas de la pastille", () => {
    const { container, rerender } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();

    rerender(<ItemPicture image={image("chat")} emoji="🐈" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/objets/chat.webp");
    expect(container.querySelector("[data-item-picture='chat']")).not.toBeNull();
  });

  describe("une image déjà en échec avant que React la saisisse (page pré-rendue)", () => {
    // Dans une page pré-rendue, l'événement `error` part avant l'hydratation : personne
    // ne l'entend. L'image se reconnaît alors à ses marques : terminée, sans largeur.
    it("montre l'émoji de repli tout de suite, sans attendre d'événement", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
      const { container } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
      expect(container.querySelector("img")).toBeNull();
      expect(screen.getByText("🐕")).toBeTruthy();
    });

    it("disparaît sans émoji", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
      const { container } = render(<ItemPicture image={image("chien")} />);
      expect(container.firstChild).toBeNull();
    });

    it("garde une image terminée qui a une largeur : elle est chargée", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(384);
      const { container } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
      expect(container.querySelector("img")?.getAttribute("src")).toBe("/objets/chien.webp");
      expect(screen.queryByText("🐕")).toBeNull();
    });

    it("garde une image qui charge encore : pas terminée, pas en échec", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(false);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
      const { container } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
      expect(container.querySelector("img")).not.toBeNull();
    });
  });

  it("ne détache ni ne rattache la vérification de l'image à chaque rendu : la fonction de rappel ne change qu'avec l'image", () => {
    // Une fonction neuve à chaque rendu, passée en `ref`, est rappelée par React (avec `null`, puis
    // avec l'élément) à CHAQUE rendu. Stable, elle n'est lue qu'au montage, et quand l'image change.
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(384);
    const { rerender } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
    const mounted = complete.mock.calls.length;
    expect(mounted).toBeGreaterThan(0);
    rerender(<ItemPicture image={image("chien")} emoji="🐕" size="sm" />);
    rerender(<ItemPicture image={image("chien")} emoji="🐕" size="lg" className="ml-2" />);
    expect(complete.mock.calls.length).toBe(mounted);
    // Une autre image : la vérification se refait.
    rerender(<ItemPicture image={image("chat")} emoji="🐈" />);
    expect(complete.mock.calls.length).toBeGreaterThan(mounted);
  });

  it("une image qui a échoué ne revient pas tant que la pastille reste montée sur elle", () => {
    const { container, rerender } = render(<ItemPicture image={image("chien")} emoji="🐕" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    rerender(<ItemPicture image={image("chien")} emoji="🐕" size="sm" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("🐕")).toBeTruthy();
  });
});

describe("une tuile avec son image", () => {
  it("garde le nom écrit à côté de l'image, qui ne le remplace pas", () => {
    function Tile({ text }: { text: string }) {
      const [picture] = useTilePictures([text]);
      return (
        <button type="button">
          {picture && <ItemPicture image={picture} />}
          <span>{text}</span>
        </button>
      );
    }
    const { container } = render(
      <ItemPicturesProvider enabled>
        <Tile text="Le baobab" />
      </ItemPicturesProvider>,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/objets/baobab.webp");
    expect(screen.getByRole("button", { name: "Le baobab" })).toBeTruthy();
  });

  it("ne montre aucune image quand la porte est fermée", () => {
    function Tile({ text }: { text: string }) {
      const [picture] = useTilePictures([text]);
      return <span>{picture ? <ItemPicture image={picture} /> : text}</span>;
    }
    const { container } = render(
      <ItemPicturesProvider enabled={false}>
        <Tile text="Le baobab" />
      </ItemPicturesProvider>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Le baobab")).toBeTruthy();
  });
});
