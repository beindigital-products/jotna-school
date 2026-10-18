import { describe, expect, it } from "vitest";
import {
  ACTION_TONES,
  contrastRatio,
  GESTURE_ACCENT,
  gestureAccentColor,
  midFace,
  mix,
  OPTION_TONE_COUNT,
  paleTone,
  shade,
  TILE_CORRECT_TONE,
  TILE_NEUTRAL_TONE,
  TILE_WRONG_TONE,
  tileChosenTone,
  tileRestTone,
} from "../tones";

/** Le bas de la face est sa partie la plus sombre : c'est là que le texte doit tenir. */
const worstFace = (tone: { faceTop: string; faceBottom: string; text: string }) =>
  Math.min(contrastRatio(tone.text, tone.faceTop), contrastRatio(tone.text, tone.faceBottom));

describe("Les teintes des tuiles — le contenu reste lisible (WCAG AA, 4,5:1)", () => {
  it("au repos et choisie, pour les six options", () => {
    for (let i = 0; i < OPTION_TONE_COUNT; i++) {
      expect(worstFace(tileRestTone(i))).toBeGreaterThanOrEqual(4.5);
      expect(worstFace(tileChosenTone(i))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("juste, fausse, neutre", () => {
    expect(worstFace(TILE_CORRECT_TONE)).toBeGreaterThanOrEqual(4.5);
    expect(worstFace(TILE_WRONG_TONE)).toBeGreaterThanOrEqual(4.5);
    expect(worstFace(TILE_NEUTRAL_TONE)).toBeGreaterThanOrEqual(4.5);
  });

  it("la pastille porte sa lettre (gros texte gras, 3:1), au repos comme choisie", () => {
    for (let i = 0; i < OPTION_TONE_COUNT; i++) {
      expect(contrastRatio(tileRestTone(i).badgeText, tileRestTone(i).badge), `repos ${i}`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(tileChosenTone(i).badgeText, tileChosenTone(i).badge), `choisie ${i}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("une option hors bornes retombe sur le cycle", () => {
    expect(tileRestTone(6)).toEqual(tileRestTone(0));
    expect(tileChosenTone(-1)).toEqual(tileChosenTone(5));
  });

  it("la tuile fausse est ambre-orange, pas rouge", () => {
    const [r, g, b] = [TILE_WRONG_TONE.flank.slice(1, 3), TILE_WRONG_TONE.flank.slice(3, 5), TILE_WRONG_TONE.flank.slice(5, 7)].map((h) =>
      parseInt(h, 16),
    );
    expect(g).toBeGreaterThan(60);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });
});

describe("Les teintes du bouton d'action — gros texte (WCAG AA, 3:1)", () => {
  it("le libellé tient AU MILIEU de la face (là où il est posé) comme sur son bas, pour chaque teinte", () => {
    for (const [name, tone] of Object.entries(ACTION_TONES)) {
      expect(contrastRatio(tone.text, midFace(tone)), `${name} milieu`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(tone.text, tone.faceBottom), `${name} bas`).toBeGreaterThanOrEqual(3);
    }
  });

  it("désactivé : la même teinte, pâlie vers la crème en couleurs opaques, jamais une opacité", () => {
    const pale = paleTone(ACTION_TONES.orange);
    expect(pale.faceTop).toBe(mix(ACTION_TONES.orange.faceTop, "#fff7e0", 0.4));
    expect(pale.flank).toBe(mix(ACTION_TONES.orange.flank, "#fff7e0", 0.4));
    expect(contrastRatio("#ffffff", pale.faceBottom)).toBeLessThan(contrastRatio("#ffffff", ACTION_TONES.orange.faceBottom));
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(midFace({ faceTop: "#000000", faceBottom: "#ffffff" })).toBe("#808080");
  });

  it("le flanc est plus sombre que la face : la lumière vient d'en haut", () => {
    for (const tone of Object.values(ACTION_TONES)) {
      expect(contrastRatio("#ffffff", tone.flank)).toBeGreaterThan(contrastRatio("#ffffff", tone.faceTop));
    }
  });
});

describe("Les accents par famille de gestes", () => {
  it("chaque famille a un accent pris dans les six options", () => {
    for (const family of Object.keys(GESTURE_ACCENT) as (keyof typeof GESTURE_ACCENT)[]) {
      const { optionIndex } = GESTURE_ACCENT[family];
      expect(optionIndex).toBeGreaterThanOrEqual(0);
      expect(optionIndex).toBeLessThan(OPTION_TONE_COUNT);
      expect(gestureAccentColor(family)).toBe(tileRestTone(optionIndex).badge);
    }
  });

  it("deux familles qui se touchent dans une séance n'ont pas le même accent", () => {
    expect(gestureAccentColor("choisir")).not.toBe(gestureAccentColor("glisser"));
    expect(gestureAccentColor("ecrire")).not.toBe(gestureAccentColor("choisir"));
  });
});

describe("shade — la lumière peinte", () => {
  it("éclaircit vers le blanc, assombrit vers le noir, laisse 1 intact", () => {
    expect(shade("#f6c452", 1)).toBe("#f6c452");
    expect(shade("#000000", 2)).toBe("#ffffff");
    expect(shade("#ffffff", 0)).toBe("#000000");
    expect(contrastRatio(shade("#f6c452", 1.2), "#000000")).toBeGreaterThan(contrastRatio("#f6c452", "#000000"));
    expect(contrastRatio(shade("#f6c452", 0.6), "#000000")).toBeLessThan(contrastRatio("#f6c452", "#000000"));
  });

  it("contrastRatio : blanc sur noir vaut 21, une couleur sur elle-même vaut 1", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    expect(contrastRatio("#f6c452", "#f6c452")).toBe(1);
  });
});
