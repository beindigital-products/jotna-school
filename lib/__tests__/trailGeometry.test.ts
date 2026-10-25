import { describe, expect, it } from "vitest";
import {
  QURAN_TRAIL,
  WORLD_TRAIL,
  buildTrail,
  trailNodePoints,
  trailWorldHeight,
  walkDuration,
  isCompactWorldFrame,
  trailPathD,
  worldLayoutFor,
  worldTrailFor,
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

describe("route couchée de la carte du monde (cadre large)", () => {
  it("debout, c'est la route de toujours", () => {
    expect(worldTrailFor(false, false, 8)).toBe(WORLD_TRAIL);
  });

  it("avance de gauche à droite et zigzague en haut et en bas", () => {
    const layout = worldTrailFor(true, false, 8);
    const pts = trailNodePoints(8, layout);
    for (let i = 1; i < 8; i++) expect(pts[i].x).toBeGreaterThan(pts[i - 1].x);
    const mid = layout.topPad + layout.swing;
    // Même alternance que la route debout : première étape en haut, la suivante en bas.
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) expect(pts[i].y).toBeLessThan(mid);
      else expect(pts[i].y).toBeGreaterThan(mid);
    }
  });

  it("tient dans le monde : largeur selon les étapes, hauteur selon le zigzag", () => {
    const layout = worldTrailFor(true, false, 8);
    const pts = trailNodePoints(8, layout);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(layout.sidePad ?? 0);
      expect(p.x).toBeLessThanOrEqual(layout.worldWidth - (layout.sidePad ?? 0));
      expect(p.y).toBeGreaterThan(layout.topPad);
      expect(p.y).toBeLessThan(trailWorldHeight(8, layout));
    }
    // Couchée, la hauteur ne dépend pas du nombre d'étapes.
    expect(trailWorldHeight(8, layout)).toBe(trailWorldHeight(3, layout));
  });

  it("laisse la place d'une plaque sous le monde le plus bas", () => {
    for (const compact of [false, true]) {
      const layout = worldTrailFor(true, compact, 8);
      const lowest = Math.max(...trailNodePoints(8, layout).map((p) => p.y));
      const half = compact ? 72 : 80;
      expect(trailWorldHeight(8, layout) - lowest).toBeGreaterThanOrEqual(half + 16 + 55);
    }
  });

  it("sort et entre dans chaque étape à l'horizontale (axe x)", () => {
    const pts = trailNodePoints(3, worldTrailFor(true, false, 3));
    const d = trailPathD(pts, "x");
    // Les points de contrôle partagent l'ordonnée de l'étape qu'ils touchent.
    const m = d.match(/C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/);
    expect(m).not.toBeNull();
    expect(Number(m![2])).toBeCloseTo(pts[0].y, 1);
    expect(Number(m![4])).toBeCloseTo(pts[1].y, 1);
    expect(trailPathD(pts, "y")).not.toBe(d);
  });

  it("Pio peut marcher d'un bout à l'autre : le sentier est continu", () => {
    const pts = trailNodePoints(8, worldTrailFor(true, false, 8));
    const trail = buildTrail(pts, "x");
    expect(trail.nodeLength).toHaveLength(8);
    for (let i = 1; i < 8; i++) {
      expect(trail.nodeLength[i]).toBeGreaterThan(trail.nodeLength[i - 1]);
      const p = trail.pointAt(trail.nodeLength[i]);
      expect(p.x).toBeCloseTo(pts[i].x, 3);
      expect(p.y).toBeCloseTo(pts[i].y, 3);
    }
  });

  it("ondule plus fort quand le cadre est haut, jamais au-delà du plafond", () => {
    const flat = worldTrailFor(true, false, 8);
    const tall = worldTrailFor(true, false, 8, { w: 1280, h: 768 });
    expect(tall.swing).toBeGreaterThan(flat.swing);
    expect(tall.swing).toBeLessThanOrEqual(200);
    expect(tall.swing % 20).toBe(0);
    // Un cadre un peu plus haut d'un pixel ne déplace pas les mondes.
    expect(worldTrailFor(true, false, 8, { w: 1280, h: 769 }).swing).toBe(tall.swing);
  });
});

describe("worldLayoutFor : debout ou couchée", () => {
  it("garde la route debout sur un téléphone", () => {
    expect(worldLayoutFor(375, 700, 8).horizontal).toBe(false);
    expect(worldLayoutFor(639, 900, 8).horizontal).toBe(false);
  });

  it("garde la route debout quand il y a peu de mondes", () => {
    expect(worldLayoutFor(1280, 700, 4).horizontal).toBe(false);
  });

  it("couche la route sur un cadre large", () => {
    expect(worldLayoutFor(1280, 700, 8).horizontal).toBe(true);
    expect(worldLayoutFor(1024, 640, 8).horizontal).toBe(true);
  });

  it("garde la route debout sur une tablette en portrait", () => {
    expect(worldLayoutFor(700, 1100, 8).horizontal).toBe(false);
  });

  it("ne plante pas sur un cadre pas encore mesuré", () => {
    expect(worldLayoutFor(0, 0, 8)).toEqual({ horizontal: false, compact: false });
  });
});

describe("cadre bas (téléphone à l'horizontale)", () => {
  it("reconnaît un cadre bas, pas un cadre pas encore mesuré", () => {
    expect(isCompactWorldFrame(300)).toBe(true);
    expect(isCompactWorldFrame(459)).toBe(true);
    expect(isCompactWorldFrame(460)).toBe(false);
    expect(isCompactWorldFrame(0)).toBe(false);
  });

  it("resserre la route : moins haute, moins large, mêmes mondes", () => {
    const wide = worldTrailFor(true, false, 8);
    const low = worldTrailFor(true, true, 8);
    expect(trailWorldHeight(8, low)).toBeLessThan(trailWorldHeight(8, wide));
    expect(low.worldWidth).toBeLessThan(wide.worldWidth);
    expect(trailNodePoints(8, low)).toHaveLength(8);
  });

  it("un téléphone à l'horizontale couche la route", () => {
    expect(worldLayoutFor(812, 300, 8)).toEqual({ horizontal: true, compact: true });
  });
});
