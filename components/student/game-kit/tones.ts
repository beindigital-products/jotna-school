/**
 * LES TEINTES DE LA BOÎTE À OUTILS — toutes prises dans la DA existante.
 *
 * Rien de neuf ici : les faces des boutons sont celles de `btn-chunky`
 * (`game-button.tsx` : ambre vers orange, citron vert vers vert, ciel), les
 * couleurs d'option sont les six de `QcmExercise.tsx` (bleu, rose, ambre,
 * vert, violet, sarcelle), la crème est celle des cartes et des bulles de Pio
 * (`#fff8e6`, `#fff7e0`), la savane vient des jetons `--color-savanna-*` de
 * `app/globals.css`. Les valeurs sont écrites en hexadécimal, celles de la
 * palette Tailwind que le code voisin fige déjà (`#b45309`, `#166534`,
 * `#0369a1`), parce que les briques peignent leurs dégradés en style inline :
 * une tuile peut prendre n'importe quelle teinte sans qu'une classe Tailwind
 * soit « vue » dans les sources.
 *
 * TROIS NUANCES SONT JUSTIFIÉES, pas inventées :
 * - le bouton d'action va d'orange-500 (`#f97316`) à orange-600 (`#ea580c`),
 *   et non d'amber-400 à orange-600 : le texte blanc est posé AU MILIEU de la
 *   face, et c'est le fond sous le glyphe qui compte, pas le bas du dégradé.
 *   Entre amber-400 et orange-600, le milieu ne donnait que 2,5:1 (mesuré
 *   sous le mot, glyphe rendu transparent, le 18 octobre 2026) ; entre
 *   orange-500 et orange-600, 3,2:1 au milieu, 3,6:1 en bas (gros texte,
 *   WCAG AA : 3:1). Le reflet blanc peint en haut de la face
 *   (`ActionButton3D`) garde la lumière qui vient d'en haut ;
 * - le bouton ciel va de sky-500 (`#0ea5e9`) à sky-600 (`#0284c7`) pour la
 *   même raison : 3,4:1 au milieu, 4,1:1 en bas (l'icône blanche est un
 *   contraste non textuel, 3:1) ; le bouton vert (« Palier suivant ») de
 *   green-600 à green-700 (`#15803d`) : 3,9:1 au milieu (de lime-400 à
 *   green-600, 2,2:1) ;
 * - la tuile « fausse » est ambre vers orange, comme la scène « Pas tout à
 *   fait » de `answer-feedback.tsx`, et non rouge : à six ans, le rouge est
 *   une punition, l'orange est « presque ».
 *
 * `__tests__/tones.test.ts` vérifie les contrastes au milieu et au bas de la
 * face (`midFace`).
 */

/** Une surface épaisse : le dessus (plus clair, la lumière vient d'en haut à gauche), le bas de la face, le flanc. */
export type SurfaceTone = {
  faceTop: string;
  faceBottom: string;
  flank: string;
  text: string;
  /** La pastille (lettre, numéro) ou l'icône d'état. */
  badge: string;
  /** Le texte sur la pastille. */
  badgeText: string;
};

/* La palette Tailwind (v3, hex) telle que le code voisin la fige. */
const P = {
  cream: "#fff8e6",
  creamDeep: "#fff1cc",
  creamFlank: "#d6c39a",
  amber100: "#fef3c7",
  amber200: "#fde68a",
  amber500: "#f59e0b",
  amber700: "#b45309",
  amber900: "#78350f",
  amber950: "#451a03",
  orange200: "#fed7aa",
  orange500: "#f97316",
  orange600: "#ea580c",
  orange950: "#431407",
  lime200: "#d9f99d",
  green200: "#bbf7d0",
  green500: "#22c55e",
  green600: "#16a34a",
  green700: "#15803d",
  green800: "#166534",
  green950: "#052e16",
  sky500: "#0ea5e9",
  sky600: "#0284c7",
  sky700: "#0369a1",
  rose400: "#fb7185",
  red600: "#dc2626",
  red800: "#991b1b",
  white: "#ffffff",
} as const;

/**
 * Les six couleurs d'option de `QcmExercise` : 100 pour la face au repos de
 * la pastille, 200 et 300 pour la face choisie, 500 pour la pastille et le
 * flanc choisi, 900 pour le texte.
 */
type OptionScale = {
  c100: string;
  c200: string;
  c300: string;
  c500: string;
  c700: string;
  c900: string;
  /** Le texte sur la pastille 500 : blanc, sauf sur l'ambre, le vert et la sarcelle où il ne tiendrait pas (3:1). */
  onBadge: string;
};
const OPTION_SCALES: readonly OptionScale[] = [
  { c100: "#dbeafe", c200: "#bfdbfe", c300: "#93c5fd", c500: "#3b82f6", c700: "#1d4ed8", c900: "#1e3a8a", onBadge: P.white }, // bleu
  { c100: "#fce7f3", c200: "#fbcfe8", c300: "#f9a8d4", c500: "#ec4899", c700: "#be185d", c900: "#831843", onBadge: P.white }, // rose
  { c100: "#fef3c7", c200: "#fde68a", c300: "#fcd34d", c500: "#f59e0b", c700: "#b45309", c900: "#78350f", onBadge: P.amber950 }, // ambre
  { c100: "#dcfce7", c200: "#bbf7d0", c300: "#86efac", c500: "#22c55e", c700: "#15803d", c900: "#14532d", onBadge: P.green950 }, // vert
  { c100: "#f3e8ff", c200: "#e9d5ff", c300: "#d8b4fe", c500: "#a855f7", c700: "#7e22ce", c900: "#581c87", onBadge: P.white }, // violet
  { c100: "#ccfbf1", c200: "#99f6e4", c300: "#5eead4", c500: "#14b8a6", c700: "#0f766e", c900: "#134e4a", onBadge: "#134e4a" }, // sarcelle
];

export const OPTION_TONE_COUNT = OPTION_SCALES.length;

function optionScale(index: number): OptionScale {
  const n = OPTION_SCALES.length;
  return OPTION_SCALES[((index % n) + n) % n];
}

/** Une tuile au repos : crème, comme une carte du Monde de Pio ; seule la pastille porte la couleur de l'option. */
export function tileRestTone(index: number): SurfaceTone {
  const s = optionScale(index);
  return {
    faceTop: P.white,
    faceBottom: P.cream,
    flank: P.creamFlank,
    text: P.amber950,
    badge: s.c500,
    badgeText: s.onBadge,
  };
}

/** La tuile choisie : elle prend la couleur de son option, et se soulève. */
export function tileChosenTone(index: number): SurfaceTone {
  const s = optionScale(index);
  return {
    faceTop: s.c100,
    faceBottom: s.c200,
    flank: s.c500,
    text: s.c900,
    badge: s.c700,
    badgeText: P.white,
  };
}

/** Juste : le vert de `btn-chunky`, en clair pour que le contenu reste lisible. */
export const TILE_CORRECT_TONE: SurfaceTone = {
  faceTop: P.lime200,
  faceBottom: P.green200,
  flank: P.green600,
  text: P.green950,
  badge: P.green500,
  badgeText: P.white,
};

/** Fausse : « presque », en ambre vers orange, jamais en rouge. */
export const TILE_WRONG_TONE: SurfaceTone = {
  faceTop: P.amber100,
  faceBottom: P.orange200,
  flank: P.orange600,
  text: P.orange950,
  badge: P.orange500,
  badgeText: P.white,
};

/** Une tuile neutre sans option (une case cible, une étiquette à glisser). */
export const TILE_NEUTRAL_TONE: SurfaceTone = {
  faceTop: P.white,
  faceBottom: P.cream,
  flank: P.creamFlank,
  text: P.amber950,
  badge: P.amber500,
  badgeText: P.white,
};

/** Les teintes du bouton d'action : celles de `GameButton`, flanc compris. */
export type ActionToneName = "orange" | "green" | "sky" | "white" | "red";

export const ACTION_TONES: Record<ActionToneName, SurfaceTone> = {
  orange: {
    faceTop: P.orange500,
    faceBottom: P.orange600,
    flank: P.amber700,
    text: P.white,
    badge: P.white,
    badgeText: P.orange600,
  },
  green: {
    faceTop: P.green600,
    faceBottom: P.green700,
    flank: P.green800,
    text: P.white,
    badge: P.white,
    badgeText: P.green600,
  },
  sky: {
    faceTop: P.sky500,
    faceBottom: P.sky600,
    flank: P.sky700,
    text: P.white,
    badge: P.white,
    badgeText: P.sky700,
  },
  white: {
    faceTop: P.white,
    faceBottom: P.creamDeep,
    flank: P.creamFlank,
    text: P.amber900,
    badge: P.amber500,
    badgeText: P.white,
  },
  // Rouge doux : l'action qui sort du jeu, comme dans `GameButton`.
  red: {
    faceTop: P.rose400,
    faceBottom: P.red600,
    flank: P.red800,
    text: P.white,
    badge: P.white,
    badgeText: P.red600,
  },
};

/**
 * L'ACCENT D'UNE FAMILLE DE GESTES : la teinte des cibles, poignées, zones
 * et pastilles d'un écran d'exercice. Choisie parmi les teintes ci-dessus,
 * pas ailleurs.
 */
export type GestureFamily = "choisir" | "glisser" | "ecrire" | "ecouter" | "dessiner";

export const GESTURE_ACCENT: Record<GestureFamily, { name: string; optionIndex: number; action: ActionToneName }> = {
  /** Toucher une tuile pour la choisir (QCM, association) : le bleu d'option. */
  choisir: { name: "bleu", optionIndex: 0, action: "orange" },
  /** Glisser, déposer, ranger : l'ambre du sable. */
  glisser: { name: "ambre", optionIndex: 2, action: "orange" },
  /** Taper une réponse, remplir un trou : le violet. */
  ecrire: { name: "violet", optionIndex: 4, action: "orange" },
  /** Écouter, dire : la sarcelle. */
  ecouter: { name: "sarcelle", optionIndex: 5, action: "sky" },
  /** Dessiner, colorier : le rose. */
  dessiner: { name: "rose", optionIndex: 1, action: "orange" },
};

/** La couleur d'accent (500) d'une famille de gestes. */
export function gestureAccentColor(family: GestureFamily): string {
  return optionScale(GESTURE_ACCENT[family].optionIndex).c500;
}

/* ── Lumière ─────────────────────────────────────────────────────────────── */

/** `#rrggbb` vers trois composantes 0..255. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(v: number): string {
  return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
}

/**
 * Éclaircit (`factor` > 1) ou assombrit (`factor` < 1) une couleur, en
 * gardant la teinte : c'est ainsi que les solides et les flancs sont
 * « éclairés » sans filtre CSS. Au-delà de 1, on tire vers le blanc.
 */
export function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (factor <= 1) return `#${toHex(r * factor)}${toHex(g * factor)}${toHex(b * factor)}`;
  const t = Math.min(1, factor - 1);
  return `#${toHex(r + (255 - r) * t)}${toHex(g + (255 - g) * t)}${toHex(b + (255 - b) * t)}`;
}

/** Le mélange de deux couleurs : `t` = 0 donne `a`, 1 donne `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return `#${toHex(ar + (br - ar) * k)}${toHex(ag + (bg - ag) * k)}${toHex(ab + (bb - ab) * k)}`;
}

/** La couleur au MILIEU d'une face en dégradé : là où le libellé est posé. */
export function midFace(tone: Pick<SurfaceTone, "faceTop" | "faceBottom">): string {
  return mix(tone.faceTop, tone.faceBottom, 0.5);
}

/**
 * La teinte d'un bouton DÉSACTIVÉ : la même, pâlie de 40 % vers la crème du
 * dock (`#fff7e0`), en couleurs OPAQUES. Le bouton pâlissait par une opacité
 * de 0,6, et les tuiles qui défilaient sous le dock se lisaient DANS Valider
 * (un « 4 », un « 6 », « Glisse les étiquettes » ; relu le 18 octobre 2026).
 * Le même aspect, sans rien laisser passer.
 */
export function paleTone(tone: SurfaceTone): SurfaceTone {
  const cream = "#fff7e0";
  return {
    ...tone,
    faceTop: mix(tone.faceTop, cream, 0.4),
    faceBottom: mix(tone.faceBottom, cream, 0.4),
    flank: mix(tone.flank, cream, 0.4),
    text: mix(tone.text, cream, 0.4),
  };
}

/** Luminance relative WCAG d'une couleur `#rrggbb`. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
