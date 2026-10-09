/**
 * LE DESSIN SUR QUADRILLAGE — reproduire, dessiner de mémoire, compléter une
 * symétrie, colorier un coloriage magique.
 *
 * Programme : « techniques de reproduction », « dessin de mémoire »,
 * « rosaces, embellissement avec motifs ornementaux », « coloriage » en arts
 * plastiques ; « symétrie par rapport à un axe », « quadrillage » en
 * mathématiques. Le pliage du CE1 est une symétrie : on plie, la peinture
 * se reporte de l'autre côté.
 *
 * Les motifs sont DESSINÉS ICI, à la main, et vérifiés par les tests
 * (`convex/__tests__/games.test.ts`) : lignes de même longueur, couleurs de
 * la palette, symétrie exacte pour ceux qui le prétendent. Le modèle de
 * langue n'en dessine aucun : un baobab tiré au hasard ne ressemble à rien.
 */
import { EMPTY_CELL, type PixelArtPayload, type PixelPaint } from "./types";
import { pick, pickFresh, type GameContext, type GeneratedGame } from "./shared";

/** Les couleurs des motifs. Une lettre par couleur, écrite dans les lignes. */
export const PAINTS: Record<string, PixelPaint> = {
  R: { key: "R", color: "#ef4444", name: "rouge" },
  O: { key: "O", color: "#f97316", name: "orange" },
  Y: { key: "Y", color: "#facc15", name: "jaune" },
  G: { key: "G", color: "#22c55e", name: "vert" },
  D: { key: "D", color: "#15803d", name: "vert foncé" },
  B: { key: "B", color: "#3b82f6", name: "bleu" },
  C: { key: "C", color: "#7dd3fc", name: "bleu ciel" },
  P: { key: "P", color: "#a855f7", name: "violet" },
  K: { key: "K", color: "#f472b6", name: "rose" },
  N: { key: "N", color: "#92400e", name: "marron" },
  Z: { key: "Z", color: "#1f2937", name: "noir" },
};

export type Motif = {
  key: string;
  /** Le nom dit à l'enfant, avec son article : « le baobab ». */
  name: string;
  rows: string[];
  /** Symétrique gauche-droite, avec une largeur paire : jouable en symétrie. */
  mirror?: boolean;
};

/** Les petits motifs du CI et du CP : 4 ou 5 cases de côté. */
export const SMALL_MOTIFS: Motif[] = [
  { key: "croix", name: "la croix", rows: ["..R..", "..R..", "RRRRR", "..R..", "..R.."] },
  { key: "escalier", name: "l'escalier", rows: ["B...", "BB..", "BBB.", "BBBB"] },
  { key: "cadre", name: "le cadre", rows: ["GGGG", "G..G", "G..G", "GGGG"], mirror: true },
  { key: "petit-coeur", name: "le petit cœur", rows: [".R.R.", "RRRRR", "RRRRR", ".RRR.", "..R.."] },
  { key: "visage", name: "le visage", rows: [".YYY.", "YZYZY", "YYYYY", "YZZZY", ".YYY."] },
  { key: "petite-fleur", name: "la petite fleur", rows: [".K.K.", "KKYKK", ".KKK.", "..G..", ".GG.."] },
  { key: "petite-maison", name: "la petite maison", rows: ["..R..", ".RRR.", "RRRRR", ".NZN.", ".NZN."] },
  { key: "petit-arbre", name: "le petit arbre", rows: [".GGG.", "GGGGG", ".GGG.", "..N..", "..N.."] },
  { key: "damier", name: "le damier", rows: ["RYRY", "YRYR", "RYRY", "YRYR"] },
  { key: "bateau", name: "le bateau", rows: ["..R..", "..RR.", "..R..", "NNNNN", ".NNN."] },
  { key: "tour", name: "la tour", rows: ["B.B.", "BBBB", "BBBB", "B..B"] },
];

/** Les grands motifs, du CE1 au CM2 : 6 à 9 cases de côté. */
export const LARGE_MOTIFS: Motif[] = [
  {
    key: "coeur",
    name: "le cœur",
    mirror: true,
    rows: [".RR..RR.", "RRRRRRRR", "RRRRRRRR", "RRRRRRRR", ".RRRRRR.", "..RRRR..", "...RR..."],
  },
  {
    key: "papillon",
    name: "le papillon",
    mirror: true,
    rows: ["PP....PP", "PKP..PKP", "PPPZZPPP", ".PPZZPP.", ".PKZZKP.", "PPPZZPPP", "PP....PP"],
  },
  {
    key: "case",
    name: "la case",
    mirror: true,
    rows: ["...YY...", "..YYYY..", ".YYYYYY.", "YYYYYYYY", ".NNNNNN.", ".NNNNNN.", ".NNZZNN.", ".NNZZNN."],
  },
  {
    key: "baobab",
    name: "le baobab",
    mirror: true,
    rows: [".GG..GG.", "GGGGGGGG", "GGGGGGGG", ".GGNNGG.", "...NN...", "...NN...", "..NNNN..", ".NNNNNN."],
  },
  {
    key: "djembe",
    name: "le djembé",
    mirror: true,
    rows: ["YYYYYY", "NNNNNN", "NRNNRN", ".NRRN.", "..NN..", ".NNNN.", "NNNNNN"],
  },
  {
    key: "rosace",
    name: "la rosace",
    mirror: true,
    rows: ["...RR...", "..RYYR..", ".RYBBYR.", "RYBBBBYR", "RYBBBBYR", ".RYBBYR.", "..RYYR..", "...RR..."],
  },
  {
    key: "masque",
    name: "le masque",
    mirror: true,
    rows: ["..NN..", ".NNNN.", "NZNNZN", "NNNNNN", "NNYYNN", ".NRRN.", ".NNNN.", "..NN.."],
  },
  {
    key: "maison",
    name: "la maison",
    mirror: true,
    rows: ["...RR...", "..RRRR..", ".RRRRRR.", "RRRRRRRR", ".NNNNNN.", ".NBNNBN.", ".NNZZNN.", ".NNZZNN."],
  },
  {
    key: "drapeau",
    name: "le drapeau du Sénégal",
    rows: ["GGGYYYRRR", "GGGYYYRRR", "GGGYGYRRR", "GGGYGYRRR", "GGGYYYRRR", "GGGYYYRRR"],
  },
  {
    key: "poisson",
    name: "le poisson",
    rows: ["..OOO...", ".OOOOO.O", "OZOOOOOO", "OOOOOOOO", ".OOOOO.O", "..OOO..."],
  },
  {
    key: "soleil",
    name: "le soleil",
    rows: ["Y..Y..Y", ".Y.Y.Y.", "..YYY..", "YYYYYYY", "..YYY..", ".Y.Y.Y.", "Y..Y..Y"],
  },
  {
    key: "etoile",
    name: "l'étoile",
    rows: ["...Y...", "...Y...", "YYYYYYY", ".YYYYY.", "..YYY..", ".YY.YY.", "YY...YY"],
  },
  {
    key: "palmier",
    name: "le palmier",
    rows: ["GG...GG", "..G.G..", "GGGNGGG", "..GNG..", "...N...", "...N...", "...N...", "..NNN.."],
  },
  {
    key: "fleur",
    name: "la fleur",
    rows: ["..K.K..", ".KKKKK.", "KKKYKKK", ".KKKKK.", "..KGK..", "...G...", "..GG...", "...G..."],
  },
  {
    key: "lune",
    name: "la lune",
    rows: ["..YYY.", ".YY...", "YY....", "YY....", ".YY...", "..YYY."],
  },
];

export const ALL_MOTIFS: Motif[] = [...SMALL_MOTIFS, ...LARGE_MOTIFS];

/** La palette d'un dessin : ses couleurs, dans l'ordre où elles apparaissent. */
export function paletteOf(rows: string[]): PixelPaint[] {
  const seen: string[] = [];
  for (const row of rows) {
    for (const cell of row) {
      if (cell !== EMPTY_CELL && PAINTS[cell] && !seen.includes(cell)) seen.push(cell);
    }
  }
  return seen.map((key) => PAINTS[key]);
}

export function mirrorRow(row: string): string {
  return row.split("").reverse().join("");
}

/** Vrai quand chaque ligne se lit pareil de gauche à droite et de droite à gauche. */
export function isMirrorSymmetric(rows: string[]): boolean {
  return rows.every((row) => row === mirrorRow(row));
}

function motifsFor(ctx: GameContext, needMirror: boolean): Motif[] {
  const pool =
    ctx.band === 0
      ? ctx.level >= 3
        ? [...SMALL_MOTIFS, ...LARGE_MOTIFS.filter((m) => m.rows[0].length <= 6)]
        : SMALL_MOTIFS
      : ctx.band === 1 && ctx.level <= 1
        ? [...SMALL_MOTIFS.filter((m) => m.rows[0].length === 5), ...LARGE_MOTIFS.filter((m) => m.rows[0].length <= 6)]
        : LARGE_MOTIFS;
  const filtered = needMirror ? pool.filter((m) => m.mirror && m.rows[0].length % 2 === 0) : pool;
  return filtered.length > 0 ? filtered : ALL_MOTIFS.filter((m) => !needMirror || m.mirror);
}

const COPY_HINTS = [
  "Commence par la ligne du haut, case par case.",
  "Compte les cases vides avant chaque case colorée.",
  "Compare chaque ligne avec le modèle avant de valider.",
];

const MEMORY_HINTS = [
  "Regarde d'abord la forme générale du dessin.",
  "Retiens les couleurs ligne par ligne, du haut vers le bas.",
  "Le dessin est fait de formes simples : retrouve-les une par une.",
];

const SYMMETRY_HINTS = [
  "Le trait rouge est un miroir : l'autre moitié est son reflet.",
  "Une case collée au miroir a sa jumelle collée au miroir, de l'autre côté.",
  "Compte les cases depuis le miroir : autant d'un côté que de l'autre.",
];

const NUMBER_HINTS = [
  "Regarde la légende : chaque numéro a sa couleur.",
  "Choisis une couleur, puis colorie toutes les cases de son numéro.",
  "Les cases sans numéro restent blanches.",
];

function finish(
  ctx: GameContext,
  payload: PixelArtPayload,
  prompt: string,
  hints: string[],
  kind: string,
  concept: string,
  answerKey: string,
): GeneratedGame {
  return {
    type: "pixel-art",
    prompt,
    payload: { ...payload, concept, game: { kind, level: ctx.level } },
    answerKey,
    hints,
  };
}

export function makePixelCopy(ctx: GameContext): GeneratedGame {
  const motif = pickFresh(ctx, motifsFor(ctx, false), (m) => `motif:${m.key}`);
  const rows = motif.rows;
  return finish(
    ctx,
    {
      mode: "copy",
      width: rows[0].length,
      height: rows.length,
      palette: paletteOf(rows),
      target: rows,
    },
    `Reproduis ${motif.name}. Colorie les cases comme sur le modèle.`,
    COPY_HINTS,
    "pixel-copie",
    "reproduire un modèle",
    `Le dessin de ${motif.name}, case par case, comme le modèle.`,
  );
}

/** Combien de secondes le modèle reste visible, selon l'âge et le palier. */
function memorySeconds(ctx: GameContext): number {
  const table: Record<number, number[]> = {
    0: [10, 9, 8, 7],
    1: [8, 7, 6, 5],
    2: [7, 6, 5, 4],
  };
  return table[ctx.band][ctx.level - 1];
}

export function makePixelMemory(ctx: GameContext): GeneratedGame {
  const motif = pickFresh(ctx, motifsFor(ctx, false), (m) => `motif:${m.key}`);
  const rows = motif.rows;
  const seconds = memorySeconds(ctx);
  return finish(
    ctx,
    {
      mode: "memory",
      width: rows[0].length,
      height: rows.length,
      palette: paletteOf(rows),
      target: rows,
      showSeconds: seconds,
    },
    `Regarde bien ${motif.name}. Le modèle se cache dans ${seconds} secondes, puis tu le redessines de mémoire.`,
    MEMORY_HINTS,
    "pixel-memoire",
    "dessin de mémoire",
    `Le dessin de ${motif.name}, de mémoire.`,
  );
}

/**
 * Un motif symétrique inventé : une moitié tirée au hasard, l'autre en est
 * le reflet. Toujours juste, puisque la réponse se calcule.
 */
function randomMirrorRows(ctx: GameContext): string[] {
  const width = ctx.band === 0 ? 4 : ctx.band === 1 ? 6 : 8;
  const height = ctx.band === 0 ? 4 : width - 1;
  const half = width / 2;
  const colors = ["R", "B", "Y", "G", "P", "O"];
  const nColors = Math.min(colors.length, 1 + Math.min(2, ctx.band + (ctx.level >= 3 ? 1 : 0)));
  const used = Array.from({ length: nColors }, () => pick(ctx.rng, colors));
  for (let attempt = 0; attempt < 20; attempt++) {
    const halves = Array.from({ length: height }, () =>
      Array.from({ length: half }, () => (ctx.rng() < 0.45 ? pick(ctx.rng, used) : EMPTY_CELL)).join(""),
    );
    const filled = halves.join("").replace(/\./g, "").length;
    const touchesMirror = halves.some((h) => h[half - 1] !== EMPTY_CELL);
    const reachesEdge = halves.some((h) => h[0] !== EMPTY_CELL);
    if (filled >= Math.ceil((half * height) / 3) && touchesMirror && reachesEdge) {
      return halves.map((h) => h + mirrorRow(h));
    }
  }
  // Repli, jamais vide : une diagonale qui touche le miroir.
  return Array.from({ length: height }, (_, r) => {
    const h = Array.from({ length: half }, (_, c) => (c === r % half ? used[0] : EMPTY_CELL)).join("");
    return h + mirrorRow(h);
  });
}

export function makePixelSymmetry(ctx: GameContext): GeneratedGame {
  // Un motif reconnaissable une fois sur deux, un motif inventé sinon : le
  // miroir se comprend mieux sur un papillon, il s'exerce mieux sur l'inconnu.
  const useMotif = ctx.band > 0 && ctx.rng() < 0.5;
  const motif = useMotif ? pickFresh(ctx, motifsFor(ctx, true), (m) => `motif:${m.key}`) : null;
  const rows = motif ? motif.rows : randomMirrorRows(ctx);
  const width = rows[0].length;
  const half = width / 2;
  const given = rows.map((row) => row.slice(0, half) + EMPTY_CELL.repeat(width - half));
  return finish(
    ctx,
    {
      mode: "symmetry",
      width,
      height: rows.length,
      palette: paletteOf(rows),
      target: rows,
      given,
      axis: "vertical",
    },
    motif
      ? `Le trait rouge est un miroir. Complète ${motif.name} de l'autre côté.`
      : "Le trait rouge est un miroir. Complète le dessin pour qu'il soit symétrique.",
    SYMMETRY_HINTS,
    "pixel-symetrie",
    "symétrie par rapport à un axe",
    "La moitié droite est le reflet exact de la moitié gauche.",
  );
}

export function makeColorByNumber(ctx: GameContext): GeneratedGame {
  const motif = pickFresh(ctx, motifsFor(ctx, false), (m) => `motif:${m.key}`);
  const rows = motif.rows;
  const palette = paletteOf(rows);
  const digitOf = new Map(palette.map((paint, i) => [paint.key, String(i + 1)]));
  const numbers = rows.map((row) =>
    row
      .split("")
      .map((cell) => digitOf.get(cell) ?? "0")
      .join(""),
  );
  return finish(
    ctx,
    {
      mode: "number",
      width: rows[0].length,
      height: rows.length,
      palette,
      target: rows,
      numbers,
    },
    "Coloriage magique ! Colorie chaque case avec la couleur de son numéro. Quel dessin apparaît ?",
    NUMBER_HINTS,
    "coloriage-magique",
    "coloriage en suivant une légende",
    `Le coloriage révèle ${motif.name}.`,
  );
}

/** Pour les tests et l'administration : le motif d'une clé. */
export function motifByKey(key: string): Motif | null {
  return ALL_MOTIFS.find((m) => m.key === key) ?? null;
}
