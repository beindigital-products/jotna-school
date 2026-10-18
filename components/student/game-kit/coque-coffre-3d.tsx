"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { Reward } from "./reward";
import { shade } from "./tones";
import { useGameFeel } from "./use-game-feel";

/**
 * LE COFFRE AU TRÉSOR — la récompense d'un palier, en CSS 3D.
 *
 * À la fin d'un palier validé, Pio ne reçoit plus une barre qui se remplit :
 * un coffre de bois cerclé d'or s'ouvre devant lui, une lumière dorée en
 * sort, puis l'éclat de la boîte à outils (`Reward` : anneau, étoiles en
 * roue, pièces, confettis plafonnés). Quand le palier est manqué, le coffre
 * reste fermé, cadenassé : « il te manque 3 étoiles » montre un but, pas une
 * note (D81). Même matière que la planche des missions du camp
 * (`quest-board.tsx` : bois `#c98240` vers `#a5602c`, grain en bandes), même
 * or que le soleil de la savane (`#ffb020`).
 *
 * CONSTRUIT COMME `Solid3D` : des faces HTML dans un espace `preserve-3d`,
 * chacune peinte de sa teinte éclairée (`shade`, lampe en haut à gauche).
 * Deux boîtes : le corps (six faces) et le couvercle (six faces) accroché à
 * la charnière arrière, qui pivote de 0 à +108° (`rotateX`) par un ressort
 * framer-motion. Tout ce qui bouge bouge en `transform` et en `opacity` :
 * le couvercle, la lueur du dedans, le tas d'or qui monte, le faisceau. CE
 * QUI BOUGE EST PLACÉ EN VALEURS DE MOUVEMENT (`y`, `z` dans `style`), jamais
 * par un `transform` écrit à la main : framer-motion recompose le `transform`
 * d'un `motion.*` à partir de ses seules valeurs de mouvement et écrase celui
 * du `style` (`motion-dom`, `build-styles`).
 * Quinze couches peintes, trois animées ; l'éclat en ajoute une vingtaine
 * pendant 1,3 s. Sous `prefers-reduced-motion`, le couvercle est déjà
 * ouvert, rien ne jaillit (le budget de `Reward` est à zéro).
 *
 * SAFARI : ni `overflow: hidden` ni `border-radius` sur les parents 3D ; le
 * conteneur est `overflow-visible` et l'appelant le pose hors de toute boîte
 * rognée (`palier-result.tsx` garde son décor rogné dans une couche à part).
 *
 * `open` ouvre ; `burst` joue l'éclat une fois le couvercle levé ; `size`
 * est la largeur du coffre en pixels (l'élément fait 1,3 fois cette largeur
 * et 1,05 fois en hauteur).
 */
const WOOD = "#a5602c";
const WOOD_LIGHT = "#c98240";
const GOLD = "#ffb020";
const GOLD_DEEP = "#b45309";

/** La lumière cuite dans les faces, comme `Solid3D`. */
const LIGHT = { top: 1.18, front: 1, left: 0.9, right: 0.8, back: 0.65, bottom: 0.55 } as const;

/**
 * Le couvercle ouvert : au-delà de 90°, on voit son dessous et le dedans du
 * coffre. LE SIGNE EST POSITIF : la charnière est l'arête arrière, et un
 * `rotateX` positif LÈVE le bord avant du couvercle (un point à l'avant,
 * `(0, 0, d)`, part en `y = -d·sin θ`, vers le haut de l'écran). À -108°, le
 * bord avant descendait derrière la caisse : à la fin du palier, on voyait un
 * coffre sans couvercle et une planche qui pendait sur son flanc droit (relu
 * le 18 octobre 2026, captures à 390 × 844 et dans le WKWebView).
 */
export const LID_OPEN_DEG = 108;

/** Le temps que le couvercle se lève avant que l'éclat parte. */
const BURST_DELAY_MS = 900;

/** Les dimensions des deux boîtes pour une largeur donnée. */
export function chestGeometry(size: number) {
  const w = Math.round(size);
  return {
    w,
    h: Math.round(size * 0.55),
    d: Math.round(size * 0.6),
    lidH: Math.round(size * 0.22),
    box: { width: Math.round(size * 1.3), height: Math.round(size * 1.05) },
  };
}

export function Coffre3D({
  open,
  burst = true,
  size = 150,
  label,
  className = "",
}: {
  /** Le palier est validé : le couvercle se lève et le trésor brille. */
  open: boolean;
  /** Jouer l'éclat (`Reward`) une fois le coffre ouvert. */
  burst?: boolean;
  /** La largeur du coffre, en pixels. */
  size?: number;
  /** Ce qu'un lecteur d'écran annonce. */
  label?: string;
  className?: string;
}) {
  const feel = useGameFeel();
  const { w, h, d, lidH, box } = chestGeometry(size);

  // L'éclat part quand le couvercle est levé : une valeur qui change après le
  // montage, parce que `Reward` ne rejoue que sur un changement de `fire`.
  const [fire, setFire] = useState<number | null>(null);
  useEffect(() => {
    if (!open || !burst) return;
    const timer = setTimeout(() => setFire(Date.now()), feel.reducedMotion ? 0 : BURST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, burst, feel.reducedMotion]);

  const group: CSSProperties = { transform: "rotateX(-16deg) rotateY(-26deg)" };
  const lidSpring = { type: "spring" as const, stiffness: 110, damping: 14, delay: 0.55 };

  return (
    <div
      role="img"
      aria-label={label ?? (open ? "Le coffre au trésor est ouvert" : "Le coffre au trésor est fermé")}
      className={`gk-chest gk-motion gk-perspective relative inline-block overflow-visible ${className}`}
      style={{ width: box.width, height: box.height }}
      data-open={open}
    >
      {/* L'ombre au sol, peinte. */}
      <span
        aria-hidden
        className="absolute bottom-[4%] left-1/2 h-[14%] w-[82%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(60,30,0,0.4)_0%,rgba(60,30,0,0)_70%)]"
      />

      <div aria-hidden className="gk-3d absolute left-1/2 top-[64%] h-0 w-0" style={group}>
        {/* Le corps du coffre. */}
        <BodyFaces w={w} h={h} d={d} locked={!open} />

        {/* La lueur du dedans : un disque d'or posé sur l'ouverture. */}
        <motion.span
          className="absolute left-0 top-0"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            ...face(w - 10, d - 10, `rotateX(90deg) translateZ(${h / 2 + 1}px)`),
            backgroundImage: "radial-gradient(ellipse at 50% 50%, #fff7c2 0%, #ffd23f 40%, rgba(255,176,32,0) 80%)",
          }}
        />

        {/* Le tas d'or qui monte au bord du coffre. SON PLACEMENT EST EN
            VALEURS DE MOUVEMENT (`y`, `z`), comme le couvercle : un
            `transform` écrit dans `style` est écrasé par celui que
            framer-motion compose à partir de `scaleY` (vu sur l'écran de fin :
            le tas restait au centre du coffre, à z = 0, caché dans la caisse).
            `translateY` puis `translateZ` puis `scaleY`, depuis le bas. */}
        <motion.span
          className="absolute left-0 top-0 origin-bottom rounded-t-[100%]"
          initial={false}
          animate={{ scaleY: open ? 1 : 0.2, opacity: open ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.85 }}
          style={{
            ...faceBox(w * 0.7, lidH * 0.9),
            y: -h / 2 - lidH * 0.45,
            z: d / 2 - 2,
            backgroundImage: "radial-gradient(ellipse at 50% 100%, #ffe27a 0%, #ffb020 55%, #e9a83a 100%)",
            boxShadow: "inset 0 -3px 0 rgb(0 0 0 / 0.12)",
          }}
        />

        {/* Le faisceau de lumière qui monte du coffre (même placement : `y`, `z`). */}
        <motion.span
          className="absolute left-0 top-0 origin-bottom"
          initial={false}
          animate={{ scaleY: open ? 1 : 0, opacity: open ? 0.85 : 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: "easeOut" }}
          style={{
            ...faceBox(w * 0.8, h * 1.6),
            y: -h / 2 - h * 0.8,
            z: d / 2 - 6,
            backgroundImage: "linear-gradient(180deg, rgba(255,247,194,0) 0%, rgba(255,210,63,0.55) 70%, rgba(255,176,32,0.9) 100%)",
          }}
        />

        {/* Le couvercle, accroché à la charnière arrière. */}
        <motion.div
          className="gk-3d absolute left-0 top-0 h-0 w-0"
          initial={false}
          animate={{ rotateX: open ? LID_OPEN_DEG : 0 }}
          transition={lidSpring}
          style={{ y: -h / 2, z: -d / 2 }}
          data-lid={open ? "ouvert" : "ferme"}
        >
          <span className="gk-3d absolute left-0 top-0 h-0 w-0" style={{ transform: `translateY(${-lidH / 2}px) translateZ(${d / 2}px)` }}>
            <LidFaces w={w} h={lidH} d={d} />
          </span>
        </motion.div>
      </div>

      {/* L'éclat, au-dessus de l'ouverture. */}
      <div aria-hidden className="absolute left-1/2 top-[30%] h-0 w-0">
        <Reward fire={fire} />
      </div>
    </div>
  );
}

/* ── Les faces ───────────────────────────────────────────────────────────── */

const FACE = "absolute left-0 top-0 border border-black/10 [backface-visibility:hidden]";

/** La boîte d'une face de `w` × `h`, centrée sur l'origine du groupe ; le placement vient à part. */
function faceBox(w: number, h: number): CSSProperties {
  return { width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 };
}

/** Une face de `w` × `h`, centrée sur l'origine du groupe, posée par `transform` (faces statiques). */
function face(w: number, h: number, transform: string): CSSProperties {
  return { ...faceBox(w, h), transform };
}

/** Le grain du bois, comme la planche des missions. */
const GRAIN = "repeating-linear-gradient(0deg, transparent 0 7px, rgba(0,0,0,0.14) 7px 8px)";

/** Le bois d'une face, dans sa lumière, avec deux cercles d'or. */
function wood(factor: number, bands = true): string {
  const base = shade(WOOD, factor);
  const light = shade(WOOD_LIGHT, factor);
  const gold = shade(GOLD, Math.min(1.1, factor + 0.05));
  const planks = `linear-gradient(180deg, ${light} 0%, ${base} 100%)`;
  if (!bands) return `${GRAIN}, ${planks}`;
  const rings = `linear-gradient(90deg, transparent 0 15%, ${gold} 15% 23%, transparent 23% 77%, ${gold} 77% 85%, transparent 85% 100%)`;
  return `${rings}, ${GRAIN}, ${planks}`;
}

/**
 * Le corps n'a pas de dessus : c'est l'ouverture. Ses faces gardent leur dos
 * visible, pour qu'on voie le dedans (le fond, le mur arrière) quand le
 * couvercle est levé.
 */
const BODY_FACE = "absolute left-0 top-0 border border-black/10";

function BodyFaces({ w, h, d, locked }: { w: number; h: number; d: number; locked: boolean }) {
  return (
    <>
      {/* Devant, avec la serrure. */}
      <span className={BODY_FACE} style={{ ...face(w, h, `translateZ(${d / 2}px)`), backgroundImage: wood(LIGHT.front) }}>
        <span
          className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center justify-center rounded-b-xl border-2 border-[#b45309]/60"
          style={{
            width: Math.round(w * 0.26),
            height: Math.round(h * 0.42),
            backgroundImage: `linear-gradient(180deg, #ffe27a 0%, ${GOLD} 55%, #e9a83a 100%)`,
            boxShadow: "inset 0 2px 0 rgb(255 255 255 / 0.6), 0 2px 0 rgb(0 0 0 / 0.2)",
          }}
        >
          {locked ? (
            <Lock className="h-[55%] w-[55%] text-[#78350f]" strokeWidth={3} aria-hidden />
          ) : (
            <span className="block h-[38%] w-[22%] rounded-full bg-[#78350f]/70" />
          )}
        </span>
      </span>
      <span className={BODY_FACE} style={{ ...face(w, h, `rotateY(180deg) translateZ(${d / 2}px)`), backgroundImage: wood(LIGHT.back) }} />
      <span className={BODY_FACE} style={{ ...face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`), backgroundImage: wood(LIGHT.right, false) }} />
      <span className={BODY_FACE} style={{ ...face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`), backgroundImage: wood(LIGHT.left, false) }} />
      {/* Le fond : sombre, l'or s'y voit mieux. */}
      <span className={BODY_FACE} style={{ ...face(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`), backgroundColor: shade(WOOD, 0.45) }} />
    </>
  );
}

/** Le couvercle : une boîte plate dont la charnière est l'arête arrière du bas. */
function LidFaces({ w, h, d }: { w: number; h: number; d: number }) {
  const inner = shade(WOOD, 0.55);
  return (
    <>
      <span className={FACE} style={{ ...face(w, h, `translateZ(${d / 2}px)`), backgroundImage: wood(LIGHT.front) }} />
      <span className={FACE} style={{ ...face(w, h, `rotateY(180deg) translateZ(${d / 2}px)`), backgroundImage: wood(LIGHT.back) }} />
      <span className={FACE} style={{ ...face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`), backgroundImage: wood(LIGHT.right, false) }} />
      <span className={FACE} style={{ ...face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`), backgroundImage: wood(LIGHT.left, false) }} />
      {/* Le dessus : des cercles d'or, un peu plus clair. */}
      <span className={FACE} style={{ ...face(w, d, `rotateX(90deg) translateZ(${h / 2}px)`), backgroundImage: wood(LIGHT.top) }} />
      {/* Le dessous, qu'on voit quand le couvercle est levé. */}
      <span
        className={FACE}
        style={{
          ...face(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`),
          backgroundImage: `linear-gradient(90deg, transparent 0 15%, ${GOLD_DEEP} 15% 23%, transparent 23% 77%, ${GOLD_DEEP} 77% 85%, transparent 85% 100%), linear-gradient(180deg, ${inner} 0%, ${shade(WOOD, 0.5)} 100%)`,
        }}
      />
    </>
  );
}
