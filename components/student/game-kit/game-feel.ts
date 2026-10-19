/**
 * LE NIVEAU DE JEU — « riche » ou « sobre », et le budget qui va avec.
 *
 * Même terrain que `hooks/use-device-tier.ts` : des Android d'entrée de gamme
 * à Dakar, une donnée chère, et parfois un enfant (ou un parent) qui a demandé
 * moins de mouvement. La boîte à outils du jeu ne pose jamais la question
 * elle-même : chaque brique lit ce niveau et s'y tient. Les règles sont ici,
 * pures et testables ; le hook `useGameFeel` ne fait que les brancher sur
 * l'appareil.
 *
 * DEUX NIVEAUX, PAS TROIS. « riche » : inclinaison au toucher, formes qui
 * dérivent dans le décor, pluie de confettis plafonnée. « sobre » : la même
 * profondeur (les épaisseurs et les ombres sont peintes, elles ne coûtent
 * rien), mais rien ne bouge en continu et la récompense est plus courte.
 * `prefers-reduced-motion` est un cran de plus DANS « sobre » : aucune
 * particule, aucun ressort, les états changent sans transition (le CSS s'en
 * charge sous `.gk-motion`, et le budget ici tombe à zéro).
 *
 * LES SEUILS SONT CEUX DE JUILLET (G5), repris de `use-device-tier` :
 * `deviceMemory ≤ 2`, `hardwareConcurrency ≤ 3`, `saveData`. Un téléphone
 * qui passe l'un de ces seuils est « sobre ».
 */
export type GameFeelLevel = "riche" | "sobre";

/** Ce que l'appareil dit de lui. Tout est optionnel : un signal absent ne pénalise pas. */
export type GameFeelSignals = {
  /** Le tier déjà décidé par `use-device-tier`, quand l'appelant l'a. */
  tier?: "lite" | "full";
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
  reducedMotion?: boolean;
};

/** Ce qu'une brique a le droit de dépenser à ce niveau. */
export type GameFeelBudget = {
  /** Confettis `canvas-confetti` par bonne réponse. */
  particles: number;
  /** Étoiles de l'éclat de récompense. */
  stars: number;
  /** Pièces qui tournent dans la récompense. */
  coins: number;
  /** Les tuiles s'inclinent sous le doigt et avec l'appareil. */
  tilt: boolean;
  /** Le décor dérive lentement (nuages, lueurs). */
  drift: boolean;
  /** Les entrées et les appuis rebondissent (ressorts). Faux = changement sec. */
  springs: boolean;
  /** Facteur sur la durée des animations non boucles (1 = nominal). */
  durationScale: number;
};

export const MAX_ANIMATED_LAYERS = 30;

/** Cœurs et mémoire au-delà desquels on reste « sobre » : les seuils G5. */
const MAX_CORES_FOR_SOBRE = 3;
const MAX_MEMORY_GB_FOR_SOBRE = 2;

export function decideGameFeelLevel(signals: GameFeelSignals): GameFeelLevel {
  if (signals.reducedMotion) return "sobre";
  if (signals.tier === "lite") return "sobre";
  if (signals.saveData) return "sobre";
  if (
    typeof signals.hardwareConcurrency === "number" &&
    signals.hardwareConcurrency <= MAX_CORES_FOR_SOBRE
  ) {
    return "sobre";
  }
  if (typeof signals.deviceMemory === "number" && signals.deviceMemory <= MAX_MEMORY_GB_FOR_SOBRE) {
    return "sobre";
  }
  return "riche";
}

const BUDGETS: Record<GameFeelLevel, GameFeelBudget> = {
  riche: {
    particles: 50,
    stars: 10,
    coins: 4,
    tilt: true,
    drift: true,
    springs: true,
    durationScale: 1,
  },
  sobre: {
    particles: 16,
    stars: 6,
    coins: 2,
    tilt: false,
    drift: false,
    springs: true,
    durationScale: 0.8,
  },
};

/** Aucun mouvement décoratif : ce que reçoit un enfant qui a demandé moins de mouvement. */
const STILL: GameFeelBudget = {
  particles: 0,
  stars: 0,
  coins: 0,
  tilt: false,
  drift: false,
  springs: false,
  durationScale: 0,
};

export function budgetFor(level: GameFeelLevel, reducedMotion: boolean): GameFeelBudget {
  if (reducedMotion) return STILL;
  return BUDGETS[level];
}

/**
 * LES VIBRATIONS DU JEU, en millisecondes pour `navigator.vibrate`. Celles de
 * la réponse sont celles de `answer-feedback.tsx`, à l'identique : l'enfant
 * reconnaît déjà le « juste » dans sa main. Capacitor Haptics n'est pas
 * installé et ne doit pas l'être : `navigator.vibrate` marche dans le webview
 * Android, et iOS l'ignore sans erreur.
 */
export const HAPTICS = {
  /** Toucher une tuile. */
  tap: 8,
  /** Choisir, saisir, poser. */
  select: 12,
  /** Bonne réponse. */
  correct: [12, 40, 12],
  /** Mauvaise réponse, il reste des essais. */
  wrong: [40, 40, 40],
  /** Plus d'essai. */
  out: 60,
} as const satisfies Record<string, number | readonly number[]>;

export type HapticName = keyof typeof HAPTICS;
