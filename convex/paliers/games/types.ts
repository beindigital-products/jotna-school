/**
 * LES FORMES DES NOUVEAUX EXERCICES — ce que la base garde, ce que l'écran
 * reçoit, ce que l'enfant renvoie.
 *
 * MODULE PUR, partagé par le serveur (génération, correction), l'application
 * (jeu hors ligne) et les écrans. Ni base, ni `ctx`, ni import de Convex.
 *
 * Chaque réponse d'enfant voyage en CHAÎNE, comme pour les types classiques :
 * un tableau JSON pour la phrase à trous, la frise, le dessin et les
 * couleurs ; l'index de l'option pour l'écoute.
 */

// ===========================================================================
// PHRASE À TROUS — « Hier, Modou ___ au marché. »
// ===========================================================================

/** Le trou d'une phrase : les mots proposés et le bon. */
export type FillBlankSlot = { options: string[]; answer: string };

export type FillBlankPayload = {
  /** La phrase ; chaque trou s'écrit `___`. */
  text: string;
  blanks: FillBlankSlot[];
};

/** Ce que l'écran reçoit : les options mélangées, sans la bonne. */
export type FillBlankView = {
  text: string;
  blanks: { options: string[] }[];
};

/** Le repère d'un trou dans la phrase. */
export const BLANK_MARK = "___";

/** Découpe une phrase à trous en morceaux de texte : `parts.length === trous + 1`. */
export function splitBlanks(text: string): string[] {
  return text.split(/_{2,}/);
}

// ===========================================================================
// FRISE À COMPLÉTER — 🔴🟡🔴🟡🔴 ?
// ===========================================================================

export type PatternPayload = {
  /** La frise ; `null` marque une case à remplir. */
  sequence: (string | null)[];
  /** Les jetons proposés à l'enfant. */
  options: string[];
  /** Le jeton attendu dans chaque case vide, de gauche à droite. */
  answers: string[];
};

export type PatternView = {
  sequence: (string | null)[];
  options: string[];
};

// ===========================================================================
// DESSIN SUR QUADRILLAGE — reproduire, de mémoire, symétrie, coloriage magique
// ===========================================================================

/**
 * Une couleur de la palette. `key` est UNE lettre majuscule : c'est elle qui
 * s'écrit dans les lignes du dessin. `.` est réservé à la case vide.
 */
export type PixelPaint = { key: string; color: string; name: string };

export type PixelMode =
  /** Le modèle reste à côté ; l'enfant le reproduit. */
  | "copy"
  /** Le modèle se montre quelques secondes, puis se cache. */
  | "memory"
  /** Une moitié est dessinée ; l'enfant complète de l'autre côté du miroir. */
  | "symmetry"
  /** Chaque case porte un numéro ; la légende dit sa couleur. */
  | "number";

export const EMPTY_CELL = ".";

export type PixelArtPayload = {
  mode: PixelMode;
  width: number;
  height: number;
  palette: PixelPaint[];
  /** Le dessin complet attendu, une chaîne par ligne. */
  target: string[];
  /** Symétrie : les cases déjà posées, que l'enfant ne peut pas changer. */
  given?: string[] | null;
  /** Coloriage magique : un chiffre par case (`0` = vide, `1` = 1re couleur…). */
  numbers?: string[] | null;
  /** De mémoire : combien de secondes le modèle reste visible. */
  showSeconds?: number | null;
  /** Symétrie : l'axe du miroir. */
  axis?: "vertical" | "horizontal" | null;
};

export type PixelArtView = {
  mode: PixelMode;
  width: number;
  height: number;
  palette: PixelPaint[];
  /** Reproduire, de mémoire : le modèle à regarder. */
  model?: string[];
  given?: string[];
  numbers?: string[];
  showSeconds?: number;
  axis?: "vertical" | "horizontal";
};

// ===========================================================================
// ÉCOUTE — grave ou aigu, long ou court, fort ou doux, rythmes, mélodies
// ===========================================================================

/**
 * Une note synthétisée par l'écran (Web Audio) : aucun fichier son, donc rien
 * à télécharger et tout fonctionne sans réseau.
 *
 * `f` : fréquence en hertz, 0 pour un silence. `d` : durée en millisecondes.
 * `v` : volume de 0 à 1 (défaut 0,8). `k` : `tone` (note tenue) ou `drum`
 * (coup de tam-tam, court et sourd).
 */
export type ListenNote = { f: number; d: number; v?: number; k?: "tone" | "drum" };

export type ListenClip = { label: string; notes: ListenNote[] };

export type ListenPayload = {
  clips: ListenClip[];
  options: string[];
  correctIndex: number;
};

export type ListenView = { clips: ListenClip[]; options: string[] };

// ===========================================================================
// ATELIER DES COULEURS — reconnaître, mélanger, retrouver le mélange
// ===========================================================================

export type Paint = { name: string; color: string };

export type ColorMixMode =
  /** « Touche le vert » : une couleur à choisir parmi des pots. */
  | "pick"
  /** « Rouge + jaune = ? » : le résultat d'un mélange. */
  | "result"
  /** « Quelles couleurs donnent le vert ? » : deux pots à choisir. */
  | "pair";

export type ColorMixPayload = {
  mode: ColorMixMode;
  /** Les pots proposés à l'enfant. */
  choices: Paint[];
  /** Résultat : les deux couleurs mélangées sous ses yeux. */
  given?: Paint[] | null;
  /** Mélange inverse : la couleur à obtenir. */
  target?: Paint | null;
  /** Le nom attendu (un seul, ou deux pour un mélange, dans n'importe quel ordre). */
  answer: string[];
};

export type ColorMixView = {
  mode: ColorMixMode;
  choices: Paint[];
  given?: Paint[];
  target?: Paint;
};

// ===========================================================================
// LE JEU D'ORIGINE — rangé dans le payload, jamais montré à l'enfant
// ===========================================================================

/**
 * Le jeu qui a fabriqué l'exercice et sa difficulté. Sert à fabriquer une
 * variation du même jeu quand l'enfant échoue (`paliers/index.ts`), sans
 * appeler le modèle.
 */
export type GameOrigin = { kind: string; level: number };
