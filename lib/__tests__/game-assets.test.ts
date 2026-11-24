import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARDS, SHOP_ITEMS } from "@/convex/gameCatalog";
import { CAMP_NIGHT_PORTRAIT, CAMP_NIGHT_WIDE, campItemImageSrc, cardImageSrc } from "../game-assets";

const PUBLIC_DIR = join(process.cwd(), "public");
const onDisk = (src: string) => existsSync(join(PUBLIC_DIR, src));

describe("les images du jeu", () => {
  it("donne le chemin d'une carte, en grand et en léger", () => {
    expect(cardImageSrc("girafe")).toBe("/images/cartes/girafe.webp");
    expect(cardImageSrc("girafe", "lite")).toBe("/images/cartes/girafe-s.webp");
  });

  it("donne le chemin d'un objet du camp", () => {
    expect(campItemImageSrc("djembe")).toBe("/images/camp/djembe.webp");
  });

  it.each(CARDS.map((card) => card.id))("la carte %s a ses deux fichiers", (cardId) => {
    expect(onDisk(cardImageSrc(cardId, "full"))).toBe(true);
    expect(onDisk(cardImageSrc(cardId, "lite"))).toBe(true);
  });

  it.each(SHOP_ITEMS.map((item) => item.id))("l'objet %s a son fichier", (itemId) => {
    expect(onDisk(campItemImageSrc(itemId))).toBe(true);
  });

  it("le camp de nuit a ses deux cadrages", () => {
    expect(onDisk(CAMP_NIGHT_PORTRAIT)).toBe(true);
    expect(onDisk(CAMP_NIGHT_WIDE)).toBe(true);
  });
});
