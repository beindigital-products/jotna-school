"use client";

import { useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { getSoundEnabledLocal, play, type SoundName } from "@/lib/sounds";
import {
  budgetFor,
  decideGameFeelLevel,
  HAPTICS,
  type GameFeelBudget,
  type GameFeelLevel,
  type HapticName,
} from "./game-feel";

/**
 * `useGameFeel` — ce que l'appareil permet, et les petits retours du jeu.
 *
 * Une brique du jeu ne lit ni `navigator` ni `matchMedia` : elle demande ici
 * son niveau (`riche` ou `sobre`), son budget (particules, inclinaison,
 * dérive, ressorts) et deux gestes prêts à l'emploi : `vibrate` (le corps du
 * téléphone, `navigator.vibrate`, jamais Capacitor Haptics) et `sound` (le
 * module `lib/sounds`, qui ne joue que si l'enfant a accepté les sons, et
 * qui a déjà préchargé : on ne contourne pas `preloadAll`).
 *
 * LE NIVEAU VIENT DE `use-device-tier` (mêmes seuils, même mémoire de
 * session) et de `prefers-reduced-motion` lu par framer-motion, donc du
 * `MotionConfig reducedMotion="user"` de l'espace élève. L'instantané serveur
 * est « sobre », comme le tier est « lite » : le HTML pré-rendu est le plus
 * léger, l'enrichissement vient après l'hydratation.
 *
 * `GameFeelProvider` force un niveau pour tout ce qu'il contient : la page de
 * montre (`app/dev/kit`) s'en sert pour poser riche et sobre côte à côte, et
 * une séance pourrait y forcer « sobre » pour un exercice chargé.
 */
export type GameFeel = {
  level: GameFeelLevel;
  /** Raccourci : `level === "riche"`. */
  rich: boolean;
  reducedMotion: boolean;
  budget: GameFeelBudget;
  /** Fait vibrer le téléphone, si possible. Ne lance jamais d'erreur. */
  vibrate: (name: HapticName) => void;
  /** Joue un son du jeu, si l'enfant a accepté les sons. */
  sound: (name: SoundName) => void;
};

const ForcedLevel = createContext<GameFeelLevel | null>(null);

export function GameFeelProvider({ level, children }: { level: GameFeelLevel; children: ReactNode }) {
  return <ForcedLevel.Provider value={level}>{children}</ForcedLevel.Provider>;
}

export function useGameFeel(): GameFeel {
  const tier = useDeviceTier();
  // `null` pendant le pré-rendu : on le lit comme « pas demandé ».
  const reducedMotion = useReducedMotion() ?? false;
  const forced = useContext(ForcedLevel);
  const level = forced ?? decideGameFeelLevel({ tier, reducedMotion });
  const budget = budgetFor(level, reducedMotion);

  const vibrate = useCallback((name: HapticName) => {
    if (typeof navigator === "undefined") return;
    try {
      navigator.vibrate?.(HAPTICS[name] as number | number[]);
    } catch {
      // Pas de vibreur, ou refusé : le jeu continue sans.
    }
  }, []);

  const sound = useCallback((name: SoundName) => {
    if (!getSoundEnabledLocal()) return;
    void play(name);
  }, []);

  return useMemo(
    () => ({ level, rich: level === "riche", reducedMotion, budget, vibrate, sound }),
    [level, reducedMotion, budget, vibrate, sound],
  );
}

/* ── L'inclinaison de l'appareil ─────────────────────────────────────────── */

/**
 * UNE SEULE ÉCOUTE POUR TOUTES LES TUILES. L'orientation de l'appareil est
 * écrite dans deux variables CSS à la racine (`--gk-dev-rx`, `--gk-dev-ry`),
 * et chaque tuile les ajoute à son inclinaison. Un écouteur par tuile aurait
 * recalculé N styles par événement ; ici un seul, limité à quinze fois par
 * seconde et arrondi au demi-degré, pour ne pas réveiller le moteur de style
 * pour rien.
 *
 * ELLE NE VIT QUE LE TEMPS DES TUILES. C'est `Tile3D` qui la demande
 * (`useDeviceTilt`), pas chaque brique du kit : la savane, le dock ou
 * l'écran de fin n'ont rien à incliner, et le capteur dormait auparavant
 * toute la séance, écran de fin compris. Chaque écriture relance la
 * transition de 220 ms de toutes les tuiles : on n'écrit que si le demi-degré
 * a changé (mesuré dans Chromium, CPU ralenti 4 fois, 8 tuiles : 45 écritures
 * en 3 s faisaient passer le recalcul de style de 65–89 ms à 261–553 ms), ET
 * AVEC UNE HYSTÉRÉSIS : un téléphone tenu immobile près d'un seuil d'arrondi
 * (47,5°, avec le bruit de ±0,15° du capteur) faisait basculer le demi-degré
 * quatorze fois en 3 s (relu le 18 octobre 2026) ; le cran ne change que si la
 * mesure s'écarte du cran écrit de plus de trois quarts de cran
 * (`TILT_HYSTERESIS_DEG`).
 *
 * UN NAVIGATEUR SANS CAPTEUR (Chrome de bureau, donc l'espace élève sur le
 * web) envoie un événement unique où `beta` et `gamma` sont `null`. Lu comme
 * 0, il valait un écart de 45° à la tenue supposée et laissait toutes les
 * tuiles penchées de 4° vers l'arrière : un événement sans mesure est ignoré.
 *
 * iOS exige une permission demandée par un geste de l'enfant
 * (`DeviceOrientationEvent.requestPermission`) : on ne la demande pas, et les
 * tuiles s'y inclinent seulement sous le doigt. Android et le web l'ont sans
 * rien demander.
 */
const TILT_MAX_DEG = 4;
const TILT_INTERVAL_MS = 66;
/** Le cran : un demi-degré. */
const TILT_STEP_DEG = 0.5;
/** L'écart au cran écrit qu'il faut dépasser pour en changer : trois quarts de cran. */
const TILT_HYSTERESIS_DEG = TILT_STEP_DEG * 0.75;
let tiltListeners = 0;
let tiltHandler: ((event: DeviceOrientationEvent) => void) | null = null;

function startDeviceTilt() {
  if (typeof window === "undefined" || tiltHandler) return;
  const DOE = (window as Window & { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
  if (!DOE || typeof DOE.requestPermission === "function") return;
  let last = 0;
  let lastRx: number | null = null;
  let lastRy: number | null = null;
  tiltHandler = (event) => {
    const beta = event.beta; // avant-arrière, -180..180
    const gamma = event.gamma; // gauche-droite, -90..90
    // Pas de capteur : rien à lire, les tuiles restent droites.
    if (typeof beta !== "number" || typeof gamma !== "number") return;
    const now = Date.now();
    if (now - last < TILT_INTERVAL_MS) return;
    last = now;
    // L'enfant tient le téléphone à 45° environ : on prend l'écart à cette tenue.
    const rx = stepDeg(-(beta - 45) / 10, lastRx);
    const ry = stepDeg(gamma / 10, lastRy);
    if (rx === lastRx && ry === lastRy) return;
    lastRx = rx;
    lastRy = ry;
    const root = document.documentElement.style;
    root.setProperty("--gk-dev-rx", `${rx}deg`);
    root.setProperty("--gk-dev-ry", `${ry}deg`);
  };
  window.addEventListener("deviceorientation", tiltHandler);
}

function stopDeviceTilt() {
  if (typeof window === "undefined" || !tiltHandler) return;
  window.removeEventListener("deviceorientation", tiltHandler);
  tiltHandler = null;
  const root = document.documentElement.style;
  root.removeProperty("--gk-dev-rx");
  root.removeProperty("--gk-dev-ry");
}

/**
 * Le cran (demi-degré, borné à ±4°) d'une mesure, avec l'hystérésis : tant que
 * la mesure reste à moins de trois quarts de cran du cran déjà écrit, c'est
 * lui qui reste. Sans cran écrit (`null`), l'arrondi simple.
 */
function stepDeg(v: number, current: number | null): number {
  const c = Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, v));
  if (current !== null && Math.abs(c - current) < TILT_HYSTERESIS_DEG) return current;
  return Math.round(c / TILT_STEP_DEG) * TILT_STEP_DEG;
}

/**
 * Tient l'écoute de l'appareil tant qu'au moins une brique inclinable est
 * montée avec `enabled` (compteur partagé : un seul écouteur, retiré et les
 * variables effacées quand la dernière se démonte).
 */
export function useDeviceTilt(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    tiltListeners += 1;
    startDeviceTilt();
    return () => {
      tiltListeners -= 1;
      if (tiltListeners <= 0) {
        tiltListeners = 0;
        stopDeviceTilt();
      }
    };
  }, [enabled]);
}
