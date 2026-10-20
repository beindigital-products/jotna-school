import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENES } from "../../convex/paliers/games/civique";
import {
  SCENE_CLIP_ID,
  SCENE_CLIP_IDS,
  isSceneClipId,
  sceneClipIdOf,
  sceneClipPoster,
  sceneClipSrc,
} from "../scene-clips";

const videoDir = join(process.cwd(), "public", "videos", "scenes");
const posterDir = join(process.cwd(), "public", "images", "scenes");
const names = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);

describe("les clips des scènes : les fonctions", () => {
  it("reconnaît une scène du catalogue, et seulement elle", () => {
    expect(isSceneClipId("po1")).toBe(true);
    expect(isSceneClipId("ro10")).toBe(true);
    for (const id of ["po12", "ro11", "xx1", "po0", "", 7, null, undefined, {}]) expect(isSceneClipId(id), String(id)).toBe(false);
  });

  it("refuse un identifiant qui n'est pas un nom de fichier sûr", () => {
    for (const id of ["../po1", "po1.mp4", "PO1", "po1 ", "po01", "po1/ro1", "-po1"]) {
      expect(SCENE_CLIP_ID.test(id), id).toBe(false);
      expect(isSceneClipId(id), id).toBe(false);
    }
  });

  it("sert le clip et l'affiche depuis les fichiers du site", () => {
    expect(sceneClipSrc("po1")).toBe("/videos/scenes/po1.mp4");
    expect(sceneClipPoster("ro10")).toBe("/images/scenes/ro10.webp");
  });

  it("lit la scène d'un payload, ou rien", () => {
    expect(sceneClipIdOf({ options: ["a", "b"], scene: "ec3" })).toBe("ec3");
    expect(sceneClipIdOf({ scene: "inconnue" })).toBeNull();
    expect(sceneClipIdOf({ scene: 3 })).toBeNull();
    expect(sceneClipIdOf({ options: [] })).toBeNull();
    expect(sceneClipIdOf(null)).toBeNull();
    expect(sceneClipIdOf("ec3")).toBeNull();
  });
});

/**
 * UNE SCÈNE, UN CLIP. Le catalogue promet à l'écran un clip par scène du CI ; un
 * identifiant de plus ne jouerait rien, un de moins laisserait une scène sans clip.
 */
describe("les clips des scènes : le catalogue et la table de scènes", () => {
  it("n'a aucun identifiant en double, et chacun est sûr", () => {
    expect(new Set(SCENE_CLIP_IDS).size).toBe(SCENE_CLIP_IDS.length);
    for (const id of SCENE_CLIP_IDS) expect(id, id).toMatch(SCENE_CLIP_ID);
  });

  it("compte les mêmes scènes que `games/civique.ts`, dans le même ordre", () => {
    expect([...SCENE_CLIP_IDS]).toEqual(SCENES.map((scene) => scene.id));
  });
});

describe("les clips des scènes : les fichiers", () => {
  const videos = names(videoDir);
  const posters = names(posterDir);

  it("chaque scène a son clip public/videos/scenes/<id>.mp4 et son affiche public/images/scenes/<id>.webp", () => {
    for (const id of SCENE_CLIP_IDS) {
      expect(videos, id).toContain(`${id}.mp4`);
      expect(posters, id).toContain(`${id}.webp`);
    }
  });

  it("chaque fichier a sa scène : pas de fichier orphelin", () => {
    expect(videos.filter((file) => !SCENE_CLIP_IDS.some((id) => file === `${id}.mp4`))).toEqual([]);
    expect(posters.filter((file) => !SCENE_CLIP_IDS.some((id) => file === `${id}.webp`))).toEqual([]);
  });

  it("reste léger : un clip sous 400 Ko, une affiche sous 100 Ko, le tout sous 10 Mo", () => {
    let total = 0;
    for (const id of SCENE_CLIP_IDS) {
      const video = statSync(join(videoDir, `${id}.mp4`)).size;
      const poster = statSync(join(posterDir, `${id}.webp`)).size;
      expect(video, `${id}.mp4`).toBeLessThan(400 * 1024);
      expect(poster, `${id}.webp`).toBeLessThan(100 * 1024);
      total += video + poster;
    }
    expect(total).toBeLessThan(10 * 1024 * 1024);
  });
});

/** Les boîtes de premier niveau d'un MP4 : leur type, où elles commencent, leur taille. */
function boxes(file: Buffer) {
  const found: { type: string; start: number; size: number }[] = [];
  let offset = 0;
  while (offset + 8 <= file.length) {
    const size = file.readUInt32BE(offset);
    if (size < 8) break;
    found.push({ type: file.toString("latin1", offset + 4, offset + 8), start: offset, size });
    offset += size;
  }
  return found;
}

/**
 * CE QUE `scripts/scene-clip-encode.sh` PROMET, relu dans chaque fichier : du H.264
 * de 768 × 512, SANS piste son (la voix de Pio lit l'énoncé), l'index au début du
 * fichier (`faststart` : la lecture démarre avant la fin du téléchargement).
 */
describe("les clips des scènes : ce que contient chaque MP4", () => {
  for (const id of SCENE_CLIP_IDS) {
    it(`${id} : H.264, 768 × 512, sans piste son, index au début`, () => {
      const file = readFileSync(join(videoDir, `${id}.mp4`));
      const top = boxes(file);
      const types = top.map((box) => box.type);
      expect(types[0], "ftyp en tête").toBe("ftyp");
      expect(types.indexOf("moov"), "moov avant mdat").toBeGreaterThan(-1);
      expect(types.indexOf("moov")).toBeLessThan(types.indexOf("mdat"));

      const moovBox = top.find((box) => box.type === "moov")!;
      const moov = file.subarray(moovBox.start, moovBox.start + moovBox.size);
      const text = moov.toString("latin1");
      expect(text, "une piste vidéo").toContain("vide");
      expect(text, "du H.264").toContain("avc1");
      expect(text, "aucune piste son").not.toContain("soun");

      const tkhd = moov.indexOf("tkhd") - 4;
      const size = moov.readUInt32BE(tkhd);
      expect(moov.readUInt32BE(tkhd + size - 8) >>> 16, "largeur").toBe(768);
      expect(moov.readUInt32BE(tkhd + size - 4) >>> 16, "hauteur").toBe(512);
    });
  }

  for (const id of SCENE_CLIP_IDS) {
    it(`${id} : l'affiche est un WebP de 768 × 512`, () => {
      const file = readFileSync(join(posterDir, `${id}.webp`));
      expect(file.toString("latin1", 0, 4)).toBe("RIFF");
      expect(file.toString("latin1", 8, 12)).toBe("WEBP");
      // Un WebP avec perte (`VP8 `) : la largeur et la hauteur sont sur 14 bits après le code de départ.
      expect(file.toString("latin1", 12, 16)).toBe("VP8 ");
      expect(file.readUInt16LE(26) & 0x3fff, "largeur").toBe(768);
      expect(file.readUInt16LE(28) & 0x3fff, "hauteur").toBe(512);
    });
  }
});
