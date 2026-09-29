/**
 * LA GÉOMÉTRIE DU SENTIER — des mathématiques pures, sans DOM.
 *
 * La carte est un « monde » de largeur fixe en pixels, que la caméra
 * (`map-viewport.tsx`) déplace et agrandit. Tout ce qui se pose dessus —
 * étapes, Pio, décor — parle en coordonnées de ce monde, jamais en
 * pourcentage d'écran : c'est ce qui permet au zoom de tout garder aligné.
 *
 * Le sentier est une suite de courbes de Bézier cubiques d'un point au
 * suivant. Il est ÉCHANTILLONNÉ ici, en JavaScript, plutôt que mesuré par
 * `getPointAtLength` : le même calcul tourne côté serveur, dans les tests et
 * dans le navigateur, et Pio peut être placé à n'importe quelle abscisse
 * curviligne sans interroger le SVG à chaque image.
 */
export type WorldPoint = { x: number; y: number };

/** Un point du sentier avec la direction de marche à cet endroit. */
export type TrailSample = WorldPoint & { dx: number; dy: number };

export type TrailLayout = {
  worldWidth: number;
  rowHeight: number;
  topPad: number;
  bottomPad: number;
  /** Écart des étapes de part et d'autre du milieu, en pixels. */
  swing: number;
  /**
   * `down` (défaut) : la première étape en haut, le sentier descend.
   * `up` : la première étape en bas, le sentier MONTE vers son but — le
   * chemin du Coran, qui grimpe vers la Kaaba. Les marges gardent leur sens
   * d'écran : `topPad` est toujours au-dessus du point le plus haut.
   */
  direction?: "down" | "up";
};

/**
 * Les marges hautes laissent la première étape (et sa plaque de nom) sous
 * les commandes collées au cadre quand le monde est calé en haut.
 */
export const WORLD_TRAIL: TrailLayout = {
  worldWidth: 420,
  rowHeight: 205,
  topPad: 190,
  bottomPad: 160,
  swing: 88,
};

export const SUBJECT_TRAIL: TrailLayout = {
  worldWidth: 420,
  rowHeight: 160,
  // La plaque de la première thématique se pose 96 px au-dessus du premier
  // nœud : elle doit passer sous la bannière collée au cadre.
  topPad: 200,
  bottomPad: 150,
  swing: 92,
};

/**
 * Le chemin du module Arabe & Coran : trente leçons qui montent du village
 * vers la Kaaba. Le dernier point est le parvis de la Kaaba : `topPad` couvre
 * le ciel étoilé puis l'illustration jusqu'à ce parvis, pour que la Kaaba
 * passe sous l'en-tête collé au cadre. `bottomPad` laisse la place au départ
 * ET à la carte d'étape qui se lève en bas : sans elle, la première leçon et
 * Pio resteraient cachés sous cette carte, la caméra ne pouvant pas descendre
 * plus bas que le monde.
 */
export const QURAN_TRAIL: TrailLayout = {
  worldWidth: 420,
  rowHeight: 124,
  topPad: 510,
  bottomPad: 440,
  swing: 94,
  direction: "up",
};

/**
 * Position de la i-ème étape. Zigzag franc — une étape à gauche, la suivante
 * à droite — avec une légère respiration d'amplitude pour que les longs
 * sentiers ne soient pas tirés au cordeau.
 */
export function trailNodePoint(index: number, layout: TrailLayout): WorldPoint {
  const side = index % 2 === 0 ? -1 : 1;
  const breath = 0.82 + 0.18 * Math.abs(Math.sin(index * 1.3));
  return {
    x: layout.worldWidth / 2 + side * layout.swing * breath,
    y: layout.topPad + index * layout.rowHeight,
  };
}

export function trailWorldHeight(count: number, layout: TrailLayout): number {
  if (count === 0) return layout.topPad + layout.bottomPad;
  return layout.topPad + (count - 1) * layout.rowHeight + layout.bottomPad;
}

/**
 * Position du i-ème point d'un sentier de `count` points, dans le sens du
 * layout. En montée, le zigzag reste le même ; seule la hauteur s'inverse.
 */
export function trailPointAt(index: number, count: number, layout: TrailLayout): WorldPoint {
  const p = trailNodePoint(index, layout);
  if (layout.direction !== "up") return p;
  return { x: p.x, y: layout.topPad + (count - 1 - index) * layout.rowHeight };
}

export function trailNodePoints(count: number, layout: TrailLayout): WorldPoint[] {
  return Array.from({ length: count }, (_, i) => trailPointAt(i, count, layout));
}

/** Le `d` SVG qui relie les points par des courbes en S. */
export function trailPathD(points: WorldPoint[]): string {
  if (points.length === 0) return "";
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const midY = (a.y + b.y) / 2;
    d += ` C ${round(a.x)} ${round(midY)}, ${round(b.x)} ${round(midY)}, ${round(b.x)} ${round(b.y)}`;
  }
  return d;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export type Trail = {
  d: string;
  points: WorldPoint[];
  /** Abscisse curviligne de chaque étape, en pixels depuis le départ. */
  nodeLength: number[];
  total: number;
  /** Le point du sentier à `length` pixels du départ, borné aux extrémités. */
  pointAt: (length: number) => TrailSample;
};

const SAMPLES_PER_SEGMENT = 36;

/**
 * Construit le sentier : le tracé SVG, la longueur cumulée à chaque étape et
 * une fonction qui rend le point à une distance donnée. Les segments sont
 * échantillonnés une fois ; `pointAt` interpole ensuite linéairement entre
 * deux échantillons, ce qui suffit largement pour poser un personnage.
 */
export function buildTrail(points: WorldPoint[]): Trail {
  const samples: TrailSample[] = [];
  const cumulative: number[] = [];
  const nodeLength: number[] = [];
  let total = 0;

  if (points.length > 0) {
    samples.push({ ...points[0], dx: 0, dy: 1 });
    cumulative.push(0);
    nodeLength.push(0);
  }

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const midY = (a.y + b.y) / 2;
    let prev = a;
    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT;
      const p = cubic(a, { x: a.x, y: midY }, { x: b.x, y: midY }, b, t);
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      total += Math.hypot(dx, dy);
      samples.push({ x: p.x, y: p.y, dx, dy });
      cumulative.push(total);
      prev = p;
    }
    nodeLength.push(total);
  }

  function pointAt(length: number): TrailSample {
    if (samples.length === 0) return { x: 0, y: 0, dx: 0, dy: 1 };
    if (length <= 0) return samples[0];
    if (length >= total) return samples[samples.length - 1];
    // Recherche dichotomique de l'échantillon juste après `length`.
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < length) lo = mid + 1;
      else hi = mid;
    }
    const after = samples[lo];
    const before = samples[lo - 1];
    const span = cumulative[lo] - cumulative[lo - 1];
    const k = span > 0 ? (length - cumulative[lo - 1]) / span : 0;
    return {
      x: before.x + (after.x - before.x) * k,
      y: before.y + (after.y - before.y) * k,
      dx: after.dx,
      dy: after.dy,
    };
  }

  return { d: trailPathD(points), points, nodeLength, total, pointAt };
}

function cubic(p0: WorldPoint, p1: WorldPoint, p2: WorldPoint, p3: WorldPoint, t: number): WorldPoint {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * Vitesse de marche de Pio, en pixels-monde par seconde : celle de ses pas.
 *
 * Ses clips de marche font environ trois pas par seconde ; pour un Pio d'une
 * centaine de pixels, cela avance de 80 à 90 pixels par seconde. À 240 (la
 * valeur d'avant le 29 septembre 2026), la carte le déplaçait trois fois plus
 * vite que ses jambes : il glissait, et le propriétaire le trouvait « beaucoup,
 * beaucoup, beaucoup trop rapide ». Une étape du chemin prend désormais deux à
 * trois secondes ; un long trajet est borné à six secondes, quitte à presser
 * le pas.
 */
export const WALK_SPEED = 90;
export const WALK_MIN_SECONDS = 1;
export const WALK_MAX_SECONDS = 6;

/** Durée d'une marche : à vitesse constante, bornée pour rester jouable. */
export function walkDuration(distance: number): number {
  const raw = Math.abs(distance) / WALK_SPEED;
  return Math.min(WALK_MAX_SECONDS, Math.max(WALK_MIN_SECONDS, raw));
}
