"use client";

import type { CSSProperties, ReactNode } from "react";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { useGameFeel } from "./use-game-feel";

/**
 * LA SCÈNE — le fond d'un écran d'exercice, dans la savane de Pio.
 *
 * La séance jouait sur un dégradé plat ; la carte d'exercice y flottait comme
 * un formulaire. Ici, l'exercice se joue DANS le Monde de Pio : le même ciel
 * que le camp (`savanna-backdrop.tsx`, `CssScene`), le soleil, deux nuages,
 * les collines lointaines, deux acacias, le sable et ses touffes d'herbe.
 * Tout est peint en CSS et en SVG minuscule : quelques centaines d'octets,
 * aucun bitmap, pour que la scène soit la même sur un Android d'entrée de
 * gamme et sur un iPhone.
 *
 * LA SAVANE PEINTE DU CAMP, QUAND L'APPAREIL LE PERMET (`painted`). Le camp
 * montre à tout appareil « full » la scène peinte en 3D
 * (`hub-savanna-portrait.jpg`, `hub-savanna-wide.jpg` dès 640 px de large,
 * `savanna-backdrop.tsx`) à côté d'un Pio rendu en 3D ; la séance, elle,
 * avait le décor de repli, et ses collines translucides se croisaient en
 * lentille (relu le 18 octobre 2026). Avec `painted`, le même `<picture>` que
 * le camp couvre le PREMIER ÉCRAN (`100svh`), posé en haut, STATIQUE : rien
 * n'y bouge, aucune couche animée, une image déjà dans le cache du camp. Le
 * sable CSS continue en dessous pour une page plus haute que l'écran, avec un
 * fondu sur le bas de l'image. L'instantané serveur est « lite » : le HTML
 * pré-rendu peint le décor CSS, l'image le remplace après l'hydratation.
 *
 * LE DÉCOR CSS (le repli, et le niveau « lite ») : TROIS PLANS, qui ne
 * bougent qu'en `transform` :
 *   - le lointain (ciel, soleil, collines OPAQUES, dans des teintes déjà
 *     mélangées : deux ellipses translucides faisaient une lentille là où
 *     elles se croisaient) ne bouge pas, sauf le soleil qui respire
 *     (`sun-pulse`, déjà dans `globals.css`) ;
 *   - le plan moyen : deux nuages qui dérivent de 3 % en 60 et 80 secondes,
 *     et deux lueurs de chaleur au-dessus du sable, en dégradé radial à bord
 *     doux et SOUS les acacias (à bord dur et par-dessus, elles coupaient la
 *     cime des arbres en deux couleurs) ;
 *   - le proche : le sable et l'herbe, immobiles, qui portent la carte.
 * Cinq couches animées au plus au niveau « riche » ; aucune au niveau
 * « sobre », où la scène reste peinte à l'identique. Le soleil et les nuages
 * sont calés SOUS l'en-tête collant de la séance (`--gk-sky-top`, que
 * l'appelant pose ; sans elle, en haut de la scène) : dans les premiers 17 %
 * de l'écran, l'en-tête de 140 px les cachait, il n'en restait qu'une tache.
 *
 * `horizon` dit à quelle hauteur (en %) commence le sable : haut pour un
 * écran où l'exercice est posé sur le sol, bas pour laisser le ciel à une
 * grande scène. `children` est posé par-dessus, dans un conteneur relatif.
 *
 * L'HORIZON SE MESURE DEPUIS LE HAUT (`--gk-horizon`), et `horizonFrom` dit
 * sur quoi : la scène elle-même (`scene`, le défaut : un pourcentage de sa
 * hauteur, pour une vitrine ou un décor de taille fixe) ou l'ÉCRAN
 * (`screen` : le même pourcentage de `100svh`, `vh` à défaut). La coque de la
 * séance prend `screen` : sa scène a la hauteur de la PAGE, et quand la
 * question suivante est plus haute (un QCM puis une association) ou qu'un
 * indice ajoute un bouton, un horizon en pourcentage de la page faisait
 * descendre d'un coup le sol, les collines et le soleil (44 px mesurés à
 * 390 × 844, décalage de mise en page de 0,034). Calé sur l'écran, il ne
 * bouge pas ; le sable s'étire seul jusqu'au bas de la page.
 */
/** Le style de la racine : les variables `--gk-*` de l'horizon, que `CSSProperties` ne connaît pas. */
type StageVars = CSSProperties & Record<`--gk-${string}`, string | undefined>;

export function StageBackdrop({
  children,
  horizon = 76,
  horizonFrom = "scene",
  painted = false,
  skyTop,
  className = "",
  contentClassName = "",
}: {
  children?: ReactNode;
  /** Hauteur de l'horizon, en pourcentage (le sable commence là). */
  horizon?: number;
  /** De quoi l'horizon est un pourcentage : la scène (défaut) ou l'écran (`svh`). */
  horizonFrom?: "scene" | "screen";
  /** La savane peinte du camp sur le premier écran, quand l'appareil est « full ». */
  painted?: boolean;
  /** Une longueur CSS : le haut du ciel utile (sous un en-tête collant), où le soleil et les nuages se posent. */
  skyTop?: string;
  className?: string;
  contentClassName?: string;
}) {
  const feel = useGameFeel();
  const tier = useDeviceTier();
  const drift = feel.budget.drift;
  const bitmap = painted && tier === "full";
  const h = Math.max(40, Math.min(92, horizon));
  // `screen` : la règle `.gk-stage[data-horizon="screen"]` de `globals.css`
  // choisit `svh` quand le moteur le sait, `vh` sinon.
  const horizonVars: StageVars =
    horizonFrom === "screen"
      ? { "--gk-horizon-vh": `${h}vh`, "--gk-horizon-svh": `${h}svh` }
      : { "--gk-horizon": `${h}%` };
  /** Le bord bas d'un élément posé à `rem` sous l'horizon (négatif : au-dessus). */
  const belowHorizon = (rem: number) => `calc(100% - var(--gk-horizon) - ${rem}rem)`;
  /**
   * Une hauteur depuis le haut, en pourcentage de la même base que l'horizon
   * (la scène, ou l'écran) : le soleil et les nuages ne descendent pas non
   * plus quand la page grandit.
   */
  const fromTop = (pct: number) => `calc(var(--gk-horizon) * ${(pct / h).toFixed(4)})`;
  /** Le haut du ciel utile : sous l'en-tête si l'appelant le dit, sinon le haut de la scène. */
  const sky = (rem: number) => (skyTop ? `calc(${skyTop} + ${rem}rem)` : `calc(${fromTop(4)} + ${rem}rem)`);

  return (
    <div className={`gk-stage gk-motion relative isolate overflow-hidden ${className}`} data-horizon={horizonFrom} data-painted={bitmap ? "1" : undefined} style={horizonVars}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Le ciel : du bleu de la savane au crème des cartes, comme sous l'espace élève. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#7ec8f5_0%,#bfe6fb_38%,#f9efd2_72%,#f6dfa4_100%)]" />

        {!bitmap && (
          <>
            {/* Le soleil, qui respire doucement, sous l'en-tête. */}
            <div
              className={`absolute right-[8%] h-24 w-24 rounded-full bg-[radial-gradient(circle,#fff7c2_0%,#ffd23f_42%,rgba(255,176,32,0)_72%)] sm:h-32 sm:w-32 ${
                drift ? "animate-[sun-pulse_6s_ease-in-out_infinite]" : ""
              }`}
              style={{ top: sky(0.25) }}
            />

            {/* Deux nuages, qui dérivent lentement, à droite de la bulle de Pio. */}
            <Cloud className="left-[40%]" top={sky(1.5)} scale={1} drift={drift} duration="60s" />
            <Cloud className="right-[6%]" top={sky(7.75)} scale={0.7} drift={drift} duration="80s" delay="-30s" />

            {/* Les collines lointaines, posées sur l'horizon (le sable, peint
                ensuite, couvre leur pied) : opaques, la plus lointaine plus
                claire (les teintes de `#c78b4a` et `#b5773b` mélangées à la
                crème du ciel). */}
            <div className="absolute -left-[20%] h-40 w-[80%] rounded-[100%] bg-[#dcb37b]" style={{ bottom: belowHorizon(2) }} />
            <div className="absolute -right-[25%] h-36 w-[80%] rounded-[100%] bg-[#cfa064]" style={{ bottom: belowHorizon(1.5) }} />

            {/* Les lueurs de chaleur au-dessus du sable : deux halos à bord doux, sous les arbres. */}
            {drift && (
              <>
                <div
                  className="absolute left-[10%] h-24 w-[55%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_70%)] animate-[gk-drift_40s_ease-in-out_infinite_alternate]"
                  style={{ bottom: belowHorizon(2.5) }}
                />
                <div
                  className="absolute right-[5%] h-16 w-[45%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%)] animate-[gk-drift_52s_ease-in-out_infinite_alternate-reverse]"
                  style={{ bottom: belowHorizon(0.75) }}
                />
              </>
            )}
          </>
        )}

        {/* Le sable, du jaune du soleil à l'ocre, et l'herbe : de l'horizon au bas de la scène. */}
        <div
          data-stage-ground
          className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#f2c95e_0%,#e0a63d_100%)]"
          style={{ top: "var(--gk-horizon)" }}
        />

        {bitmap ? (
          <PaintedSavanna />
        ) : (
          <>
            {/* Deux acacias : des silhouettes SVG minuscules, devant les lueurs. */}
            <Acacia className="left-[5%] h-16 w-24 text-[#3f8a2f]" bottom={belowHorizon(0.25)} trunk="#7a4a23" />
            <Acacia className="right-[8%] h-12 w-20 text-[#4c9a3b]" bottom={belowHorizon(-0.25)} trunk="#7a4a23" />

            {/* Les touffes restent près des bords et de l'horizon : le milieu du sable porte la carte et le bouton. */}
            <div className="absolute left-[4%] h-5 w-9 rounded-[100%] bg-[#6ab04c]" style={{ bottom: belowHorizon(0.9) }} />
            <div className="absolute right-[3%] h-4 w-7 rounded-[100%] bg-[#5da040]" style={{ bottom: belowHorizon(0.4) }} />
            {/* Les deux du bas : au bas du premier écran (de la scène, ou de l'écran), pas au bas de la page. */}
            <div className="absolute left-[2%] h-4 w-7 rounded-[100%] bg-[#5da040]" style={{ top: `calc(${fromTop(100)} - 1.25rem)` }} />
            <div className="absolute right-[6%] h-5 w-8 rounded-[100%] bg-[#6ab04c]" style={{ top: `calc(${fromTop(100)} - 1.75rem)` }} />
          </>
        )}
      </div>

      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}

/**
 * La savane peinte du camp sur le premier écran : le même `<picture>` que
 * `savanna-backdrop.tsx` (une seule source chargée), calée en haut, de la
 * hauteur de l'écran (`svh`, `vh` à défaut), le bas de l'image fondu dans le
 * sable CSS qui continue dessous. Statique : rien n'y bouge.
 */
function PaintedSavanna() {
  return (
    <div className="absolute inset-x-0 top-0 h-[100vh] supports-[height:1svh]:h-[100svh]">
      <picture>
        <source media="(min-width: 640px)" srcSet="/images/world/hub-savanna-wide.jpg" />
        <img
          src="/images/world/hub-savanna-portrait.jpg"
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
      </picture>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#e6b24a]" />
    </div>
  );
}

function Cloud({
  className,
  top,
  scale,
  drift,
  duration,
  delay,
}: {
  className: string;
  top: string;
  scale: number;
  drift: boolean;
  duration: string;
  delay?: string;
}) {
  const style: CSSProperties = drift
    ? { top, animation: `gk-drift ${duration} ease-in-out infinite alternate`, animationDelay: delay }
    : { top };
  return (
    <div className={`absolute ${className}`} style={style}>
      <div className="flex gap-1 opacity-90" style={{ transform: `scale(${scale})`, transformOrigin: "left top" }}>
        <span className="h-6 w-10 rounded-full bg-white" />
        <span className="-ml-4 mt-2 h-5 w-8 rounded-full bg-white" />
        <span className="-ml-5 h-7 w-9 rounded-full bg-white" />
      </div>
    </div>
  );
}

function Acacia({ className, bottom, trunk }: { className: string; bottom: string; trunk: string }) {
  return (
    <svg viewBox="0 0 100 60" className={`absolute ${className}`} fill="currentColor" style={{ bottom }}>
      <rect x="46" y="30" width="6" height="30" fill={trunk} />
      <ellipse cx="50" cy="26" rx="44" ry="12" />
      <ellipse cx="34" cy="18" rx="22" ry="8" />
    </svg>
  );
}
