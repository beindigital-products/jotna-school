import { describe, expect, it } from "vitest";
import {
  QURAN_TRAIL,
  WORLD_TRAIL,
  buildTrail,
  trailNodePoints,
  trailWorldHeight,
  walkDuration,
} from "@/components/student/world/trail-geometry";

describe("géométrie du sentier", () => {
  it("alterne les étapes de part et d'autre du milieu", () => {
    const pts = trailNodePoints(4, WORLD_TRAIL);
    const mid = WORLD_TRAIL.worldWidth / 2;
    expect(pts[0].x).toBeLessThan(mid);
    expect(pts[1].x).toBeGreaterThan(mid);
    expect(pts[2].x).toBeLessThan(mid);
    expect(pts[3].x).toBeGreaterThan(mid);
  });

  it("donne une hauteur qui grandit d'un rang par étape", () => {
    expect(trailWorldHeight(0, WORLD_TRAIL)).toBe(WORLD_TRAIL.topPad + WORLD_TRAIL.bottomPad);
    expect(trailWorldHeight(3, WORLD_TRAIL) - trailWorldHeight(2, WORLD_TRAIL)).toBe(
      WORLD_TRAIL.rowHeight,
    );
  });

  it("place chaque étape à sa longueur cumulée, et les longueurs croissent", () => {
    const pts = trailNodePoints(5, WORLD_TRAIL);
    const trail = buildTrail(pts);
    expect(trail.nodeLength).toHaveLength(5);
    expect(trail.nodeLength[0]).toBe(0);
    for (let i = 1; i < 5; i++) {
      expect(trail.nodeLength[i]).toBeGreaterThan(trail.nodeLength[i - 1]);
      const p = trail.pointAt(trail.nodeLength[i]);
      expect(p.x).toBeCloseTo(pts[i].x, 3);
      expect(p.y).toBeCloseTo(pts[i].y, 3);
    }
    expect(trail.total).toBe(trail.nodeLength[4]);
  });

  it("borne pointAt aux deux bouts du sentier", () => {
    const pts = trailNodePoints(2, WORLD_TRAIL);
    const trail = buildTrail(pts);
    expect(trail.pointAt(-50)).toMatchObject({ x: pts[0].x, y: pts[0].y });
    expect(trail.pointAt(trail.total + 50)).toMatchObject({ x: pts[1].x, y: pts[1].y });
  });

  it("garde une direction de marche cohérente à mi-segment", () => {
    const pts = trailNodePoints(2, WORLD_TRAIL);
    const trail = buildTrail(pts);
    const mid = trail.pointAt(trail.total / 2);
    // Du point de gauche vers le point de droite : dx positif, et on descend.
    expect(mid.dx).toBeGreaterThan(0);
    expect(mid.dy).toBeGreaterThan(0);
  });

  it("borne la durée d'une marche", () => {
    expect(walkDuration(10)).toBe(1);
    expect(walkDuration(225)).toBeCloseTo(2.5, 5);
    expect(walkDuration(100000)).toBe(6);
  });

  it("produit un tracé SVG vide sans étape", () => {
    const trail = buildTrail([]);
    expect(trail.d).toBe("");
    expect(trail.total).toBe(0);
    expect(trail.pointAt(10)).toEqual({ x: 0, y: 0, dx: 0, dy: 1 });
  });
});

describe("sentier qui monte (chemin du Coran)", () => {
  const count = 31;
  const pts = trailNodePoints(count, QURAN_TRAIL);

  it("part d'en bas et finit en haut, au but", () => {
    for (let i = 1; i < count; i++) expect(pts[i].y).toBeLessThan(pts[i - 1].y);
    expect(pts[count - 1].y).toBe(QURAN_TRAIL.topPad);
    expect(pts[0].y).toBe(trailWorldHeight(count, QURAN_TRAIL) - QURAN_TRAIL.bottomPad);
  });

  it("garde le même zigzag qu'un sentier qui descend", () => {
    const down = trailNodePoints(count, { ...QURAN_TRAIL, direction: "down" });
    expect(pts.map((p) => p.x)).toEqual(down.map((p) => p.x));
  });
});
