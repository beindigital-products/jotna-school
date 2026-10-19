import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TileGlyphs } from "@/components/student/game-kit/gestes-glyphes";
import { ITEM_IMAGES, type ItemImage } from "@/lib/item-images";
import {
  DENSE_TILE_COUNT,
  PICTURE_TILE_LAYOUT,
  glyphTilesOf,
  isDenseTileCount,
  stickerSizeClass,
  TilePicture,
  TileSticker,
  tileName,
} from "../tile-picture";

afterEach(cleanup);

const image = (id: string): ItemImage => {
  const found = ITEM_IMAGES.find((entry) => entry.id === id);
  if (!found) throw new Error(`image absente du catalogue : ${id}`);
  return found;
};

const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);

describe("glyphTilesOf : les tuiles « que des glyphes » d'un côté", () => {
  it("garde les émojis, les nombres, les signes et les petits calculs, pas les mots", () => {
    expect(glyphTilesOf(["🐈", "le chat", "2", "🥭🥭🥭", "3 + 4", "pa", "Lion"])).toEqual(["🐈", "2", "🥭🥭🥭", "3 + 4"]);
  });

  it("garde une longue rangée d'émojis, que le kit ne tient plus pour un glyphe (plus de seize signes)", () => {
    const row = "🍎".repeat(18);
    expect(glyphTilesOf([row, "la pomme"])).toEqual([row]);
  });

  it("ne garde ni le texte vide ni les espaces, et ignore ce qui n'est pas du texte", () => {
    expect(glyphTilesOf(["", "   ", "🐈"])).toEqual(["🐈"]);
    expect(glyphTilesOf(["🐈", undefined as unknown as string, 3 as unknown as string, null as unknown as string])).toEqual(["🐈"]);
  });

  it("rend une liste vide quand rien n'est un glyphe", () => {
    expect(glyphTilesOf(["le chat", "le chien"])).toEqual([]);
    expect(glyphTilesOf([])).toEqual([]);
  });
});

describe("tileName : le nom écrit d'une tuile", () => {
  it("sans émoji de tête quand l'image le remplace", () => {
    expect(tileName("🐕 le chien", image("chien"))).toBe("le chien");
    expect(tileName("🐕 Rex", image("chien"))).toBe("Rex");
  });

  it("le texte entier quand il n'a pas d'émoji de tête", () => {
    expect(tileName("le chat", image("chat"))).toBe("le chat");
    expect(tileName("Lion", image("lion"))).toBe("Lion");
  });

  it("le texte entier quand il n'y a pas d'image : rien n'est retiré", () => {
    expect(tileName("🐕 le chien", null)).toBe("🐕 le chien");
    expect(tileName("🐕 le chien", undefined)).toBe("🐕 le chien");
  });

  it("le texte entier quand il ne resterait rien : une tuile ne se vide jamais", () => {
    expect(tileName("🐕", image("chien"))).toBe("🐕");
  });
});

describe("TilePicture : ce que montre une tuile", () => {
  it("sans image, le même nœud qu'avant : `TileGlyphs`, au caractère près", () => {
    const withoutPicture = render(<TilePicture text="le chat" image={null} />);
    const plain = render(<TileGlyphs text="le chat" />);
    expect(withoutPicture.container.innerHTML).toBe(plain.container.innerHTML);
    const glyphs = render(<TilePicture text="🥭🥭🥭" image={undefined} />);
    expect(glyphs.container.innerHTML).toBe(render(<TileGlyphs text="🥭🥭🥭" />).container.innerHTML);
  });

  it("avec une image : la pastille puis le nom, en pile centrée sur un téléphone, en rangée à 640 px et plus", () => {
    const { container } = render(<TilePicture text="le chat" image={image("chat")} />);
    const stack = container.firstElementChild as Element;
    expect(classesOf(stack)).toEqual(expect.arrayContaining(["flex", "flex-col", "items-center"]));
    // À 640 px de large et plus, la pastille passe à côté du mot : la tuile garde sa hauteur de 56 px.
    expect(classesOf(stack)).toEqual(
      expect.arrayContaining(["min-[640px]:flex-row", "min-[640px]:justify-center", "min-[640px]:gap-2.5"]),
    );
    expect(stack.children).toHaveLength(2);
    expect(stack.children[0].getAttribute("data-item-picture")).toBe("chat");
    expect(stack.children[1].textContent).toBe("le chat");
    expect(stack.getAttribute("class")).toBe(PICTURE_TILE_LAYOUT);
  });

  it("serre sa place : déborde dans le remplissage de la tuile (6 px en haut, 10 en bas, 8 de chaque côté ; 8 px en haut et en bas en rangée) et serre l'interligne", () => {
    const { container } = render(<TilePicture text="le chat" image={image("chat")} />);
    const classes = classesOf(container.firstElementChild);
    expect(classes).toContain("-mt-1.5");
    expect(classes).toContain("-mb-2.5");
    expect(classes).toContain("-mx-2");
    expect(classes).toContain("min-[640px]:-my-2");
    expect(classes).toContain("leading-tight");
  });

  it("le nom s'écrit sans l'émoji de tête, et l'image est décorative", () => {
    const { container } = render(<TilePicture text="🐕 le chien" image={image("chien")} />);
    expect(container.textContent).toBe("le chien");
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("si le fichier ne charge pas, l'émoji de tête revient dans la pastille, le nom reste", () => {
    const { container } = render(<TilePicture text="🐕 le chien" image={image("chien")} />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-item-picture='repli']")?.textContent).toBe("🐕");
    expect(container.querySelector("span.inline-block")?.textContent).toBe("le chien");
  });
});

describe("DENSE_TILE_COUNT : à partir de quatre tuiles, la pastille se serre", () => {
  it("quatre paires ou quatre étiquettes sont denses, trois non", () => {
    expect(DENSE_TILE_COUNT).toBe(4);
    expect(isDenseTileCount(3)).toBe(false);
    expect(isDenseTileCount(4)).toBe(true);
    expect(isDenseTileCount(8)).toBe(true);
    expect(isDenseTileCount(0)).toBe(false);
  });

  it("une tuile dense a une pastille de 32 px sur un téléphone debout, une autre de 36 px", () => {
    expect(classesOf(render(<TilePicture text="le chat" image={image("chat")} dense />).container.querySelector("[data-item-picture]"))).toEqual(
      expect.arrayContaining(["size-8"]),
    );
    cleanup();
    const sparse = classesOf(render(<TilePicture text="le chat" image={image("chat")} />).container.querySelector("[data-item-picture]"));
    expect(sparse).toContain("size-9");
    expect(sparse).not.toContain("size-8");
  });
});

describe("TileSticker : la pastille d'une tuile ou du nom d'une boîte", () => {
  it("prend 36 px sur un téléphone debout (32 px quand le groupe est dense), et 44, 56 ou 36 px à côté du mot à 640 px et plus", () => {
    const { container } = render(<TileSticker image={image("lion")} text="Lion" />);
    const classes = classesOf(container.firstElementChild);
    expect(classes).toContain("size-9");
    // À 640 px et plus : 44 px de 481 à 960 px de haut, 56 px au-delà, 36 px à 480 px ou moins. Les trois
    // paliers de hauteur s'excluent : Tailwind ne garantit pas l'ordre de deux requêtes média.
    expect(classes).toContain("min-[640px]:[@media(min-height:481px)_and_(max-height:960px)]:size-11");
    expect(classes).toContain("min-[640px]:[@media(min-height:961px)]:size-14");
    expect(classes).toContain("min-[640px]:[@media(max-height:480px)]:size-9");
    // La pile ne descend plus à 44 px entre 668 et 960 px : c'était 8 px par tuile de plus que le dock ne le permettait.
    expect(classes).not.toContain("[@media(max-height:960px)_and_(min-height:668px)]:size-11");
    expect(classesOf(render(<TileSticker image={image("lion")} text="Lion" dense />).container.firstElementChild)).toContain("size-8");
  });

  it("`stickerSizeClass` écrit les classes en entier, pour que Tailwind les voie", () => {
    for (const dense of [false, true]) {
      for (const name of stickerSizeClass(dense).split(" ")) expect(name).toMatch(/^(min-\[640px\]:.*:)?size-\d+$/);
    }
    expect(stickerSizeClass(true)).toContain("size-8");
    expect(stickerSizeClass(false)).toContain("size-9");
  });

  it("montre l'image du catalogue", () => {
    const { container } = render(<TileSticker image={image("lion")} text="Lion" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/objets/lion.webp");
  });

  it("repli : l'émoji de tête du texte, rien quand il n'y en a pas", () => {
    const withEmoji = render(<TileSticker image={image("lion")} text="🦁 Lion" />);
    fireEvent.error(withEmoji.container.querySelector("img") as HTMLImageElement);
    expect(withEmoji.container.textContent).toBe("🦁");
    cleanup();
    const without = render(<TileSticker image={image("lion")} text="Lion" />);
    fireEvent.error(without.container.querySelector("img") as HTMLImageElement);
    expect(without.container.firstChild).toBeNull();
  });
});
