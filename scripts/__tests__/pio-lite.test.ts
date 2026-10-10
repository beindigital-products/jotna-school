import { describe, expect, it } from "vitest";

import { bleedEdges } from "../pio-lite.mjs";

const BLUE = [0, 0, 255] as const;
const ORANGE = [230, 110, 20] as const;

/** Une rangée de pixels : [rouge, vert, bleu, alpha] chacun. */
const row = (...pixels: Array<readonly [number, number, number, number]>) => Uint8Array.from(pixels.flat());
const pixel = (data: Uint8Array, index: number) => Array.from(data.slice(index * 4, index * 4 + 4));

describe("les couleurs de bord des affiches légères de Pio", () => {
  it("remplace le bleu du détourage par l'orange du bord opaque le plus proche, et laisse l'alpha intact", () => {
    // Un pixel opaque, un liseré à moitié transparent encore bleu, puis du vide bleu.
    const data = row([...ORANGE, 255], [...BLUE, 120], [...BLUE, 0], [...BLUE, 0]);
    bleedEdges(data, 4, 1);
    expect(pixel(data, 0)).toEqual([...ORANGE, 255]);
    expect(pixel(data, 1)).toEqual([...ORANGE, 120]);
    expect(pixel(data, 2)).toEqual([...ORANGE, 0]);
    expect(pixel(data, 3)).toEqual([...ORANGE, 0]);
  });

  it("ne touche jamais à un pixel opaque", () => {
    const green = [20, 120, 30] as const;
    const data = row([...ORANGE, 255], [...green, 230], [...BLUE, 0]);
    bleedEdges(data, 3, 1);
    expect(pixel(data, 0)).toEqual([...ORANGE, 255]);
    expect(pixel(data, 1)).toEqual([...green, 230]);
    // Le vide prend la couleur de son voisin opaque, pas celle de l'autre.
    expect(pixel(data, 2)).toEqual([...green, 0]);
  });

  it("porte la couleur du bord à 16 pixels dans le vide, pas plus loin", () => {
    const data = new Uint8Array(40 * 4);
    for (let x = 0; x < 40; x++) data.set([...BLUE, 0], x * 4);
    data.set([...ORANGE, 255], 0);
    bleedEdges(data, 40, 1);
    expect(pixel(data, 16)).toEqual([...ORANGE, 0]);
    expect(pixel(data, 17)).toEqual([...BLUE, 0]);
  });

  it("garde les ombres au sol : un pixel semi-transparent loin du contour garde sa couleur", () => {
    // Une ombre claire de dix pixels, collée à un pied opaque : seul son liseré reprend la couleur du pied.
    const shadow = [235, 235, 235] as const;
    const data = new Uint8Array(12 * 4);
    data.set([...ORANGE, 255], 0);
    for (let x = 1; x < 12; x++) data.set([...shadow, 90], x * 4);
    bleedEdges(data, 12, 1);
    expect(pixel(data, 1)).toEqual([...ORANGE, 90]);
    expect(pixel(data, 3)).toEqual([...ORANGE, 90]);
    expect(pixel(data, 4)).toEqual([...shadow, 90]);
    expect(pixel(data, 11)).toEqual([...shadow, 90]);
  });

  it("ne fait rien d'une image sans bord opaque", () => {
    const data = row([...BLUE, 0], [...BLUE, 40]);
    const before = Array.from(data);
    bleedEdges(data, 2, 1);
    expect(Array.from(data)).toEqual(before);
  });
});
