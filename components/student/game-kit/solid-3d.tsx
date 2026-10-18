"use client";

import type { CSSProperties } from "react";
import { shade } from "./tones";
import { useGameFeel } from "./use-game-feel";
import type { GameFeelLevel } from "./game-feel";

/**
 * LE SOLIDE 3D — un cube, un pavé, un cylindre, une boule, en CSS seulement.
 *
 * Pour les exercices de formes et de solides du CI et du CP (« Quel solide
 * roule ? », « Combien de faces ? »), un dessin plat ne suffit pas : l'enfant
 * doit voir l'objet tourner pour compter ses faces. Pas de WebGL, pas de
 * three.js : des faces HTML dans un espace `preserve-3d`, chacune peinte de
 * sa teinte éclairée (`shade`), posées sur un tourne-disque
 * (`gk-turntable`, un tour en 14 s, incliné de 22° vers le regard).
 *
 * LA LUMIÈRE EST CUITE DANS LES FACES : elle vient d'en haut à gauche, comme
 * partout dans la boîte à outils (dessus 1,2, devant 1, gauche 0,9, droite
 * 0,8, derrière 0,65, dessous 0,55). Quand le solide tourne, sa lumière
 * tourne avec lui ; à cette vitesse l'œil n'y voit qu'un objet qui tourne.
 * Aucun filtre, aucune couleur animée.
 *
 * - cube : six faces ;
 * - pavé : six faces, largeur, hauteur 0,62, profondeur 0,7 ;
 * - cylindre : N panneaux autour de l'axe (24 riche, 16 sobre) et deux
 *   disques, la lumière passant de panneau en panneau ;
 * - boule : un disque peint (une vraie sphère n'existe pas en CSS) dont les
 *   quartiers roulent sous une lumière fixe : l'œil voit une balle qui roule.
 *
 * Au niveau « sobre », le solide est posé de trois quarts, immobile, avec
 * moins de panneaux. `spin` force dans un sens ou dans l'autre.
 *
 * SAFARI : le conteneur ne porte NI `overflow: hidden` NI `border-radius` : un
 * tel parent aplatit l'espace 3D de ses enfants.
 */
export type SolidKind = "cube" | "pave" | "cylindre" | "boule";

const LIGHT = { top: 1.2, front: 1, left: 0.9, right: 0.8, back: 0.65, bottom: 0.55 } as const;

/** Combien de panneaux au cylindre selon le niveau. */
export function cylinderPanels(level: GameFeelLevel): number {
  return level === "riche" ? 24 : 16;
}

/** La lumière d'un panneau de cylindre à l'angle `deg` : plus clair face à la lampe (à -40°). */
export function panelLight(deg: number): number {
  const rad = ((deg + 40) * Math.PI) / 180;
  return 0.72 + 0.45 * Math.max(0, Math.cos(rad));
}

export function Solid3D({
  kind,
  size = 96,
  color = "#f6c452",
  spin,
  label,
  className = "",
}: {
  kind: SolidKind;
  /** L'arête (ou le diamètre), en pixels. */
  size?: number;
  /** La couleur de base, éclairée face par face. */
  color?: string;
  /** Force la rotation (sinon : le niveau décide). */
  spin?: boolean;
  /** Ce qu'un lecteur d'écran annonce : « un cube ». */
  label?: string;
  className?: string;
}) {
  const feel = useGameFeel();
  const spinning = spin ?? feel.budget.drift;
  const box = Math.round(size * 1.6);

  const group: CSSProperties = spinning
    ? { animation: "gk-turntable 14s linear infinite" }
    : { transform: "rotateX(-22deg) rotateY(32deg)" };

  return (
    <div
      role="img"
      aria-label={label ?? LABELS[kind]}
      className={`gk-solid gk-motion gk-perspective relative inline-block ${className}`}
      style={{ width: box, height: box }}
    >
      {/* L'ombre au sol. */}
      <span
        aria-hidden
        className="absolute bottom-[6%] left-1/2 h-[12%] w-[70%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(60,30,0,0.35)_0%,rgba(60,30,0,0)_70%)]"
      />
      {kind === "boule" ? (
        <Ball size={size} color={color} spinning={spinning} />
      ) : (
        <div className="gk-3d absolute left-1/2 top-1/2 h-0 w-0" style={group}>
          {kind === "cube" && <Faces w={size} h={size} d={size} color={color} />}
          {kind === "pave" && <Faces w={size} h={size * 0.62} d={size * 0.7} color={color} />}
          {kind === "cylindre" && (
            <Cylinder radius={size * 0.4} height={size * 0.95} color={color} panels={cylinderPanels(feel.level)} />
          )}
        </div>
      )}
    </div>
  );
}

const LABELS: Record<SolidKind, string> = {
  cube: "un cube",
  pave: "un pavé droit",
  cylindre: "un cylindre",
  boule: "une boule",
};

function faceStyle(w: number, h: number, transform: string, fill: string): CSSProperties {
  return {
    width: w,
    height: h,
    marginLeft: -w / 2,
    marginTop: -h / 2,
    transform,
    backgroundColor: fill,
  };
}

const FACE = "absolute left-0 top-0 border border-black/10 [backface-visibility:hidden]";
/* Les lames du cylindre n'ont pas de bord : un bord par lame dessinait des rayures. */
const PANEL = "absolute left-0 top-0 [backface-visibility:hidden]";

/** Les six faces d'un cube ou d'un pavé, centrées sur l'origine du groupe. */
function Faces({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  return (
    <>
      <span className={FACE} style={faceStyle(w, h, `translateZ(${d / 2}px)`, shade(color, LIGHT.front))} />
      <span className={FACE} style={faceStyle(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, shade(color, LIGHT.back))} />
      <span className={FACE} style={faceStyle(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, shade(color, LIGHT.right))} />
      <span className={FACE} style={faceStyle(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, shade(color, LIGHT.left))} />
      <span className={FACE} style={faceStyle(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, shade(color, LIGHT.top))} />
      <span className={FACE} style={faceStyle(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, shade(color, LIGHT.bottom))} />
    </>
  );
}

/** Un cylindre : `panels` lames autour de l'axe vertical, un disque dessus, un dessous. */
function Cylinder({ radius, height, color, panels }: { radius: number; height: number; color: string; panels: number }) {
  const step = 360 / panels;
  // La largeur d'une lame pour fermer le tour, avec un rien de recouvrement.
  const width = 2 * radius * Math.tan(Math.PI / panels) + 0.8;
  return (
    <>
      {Array.from({ length: panels }, (_, i) => {
        const deg = i * step;
        return (
          <span
            key={i}
            className={PANEL}
            style={faceStyle(width, height, `rotateY(${deg}deg) translateZ(${radius}px)`, shade(color, panelLight(deg)))}
          />
        );
      })}
      <span
        className="absolute left-0 top-0 rounded-full border border-black/10"
        style={faceStyle(radius * 2, radius * 2, `rotateX(90deg) translateZ(${height / 2}px)`, shade(color, LIGHT.top))}
      />
      <span
        className="absolute left-0 top-0 rounded-full border border-black/10"
        style={faceStyle(radius * 2, radius * 2, `rotateX(-90deg) translateZ(${height / 2}px)`, shade(color, LIGHT.bottom))}
      />
    </>
  );
}

/** Une boule : des quartiers qui roulent sous une lumière fixe. */
function Ball({ size, color, spinning }: { size: number; color: string; spinning: boolean }) {
  const diameter = Math.round(size * 0.92);
  const dark = shade(color, 0.86);
  const wedges = `conic-gradient(${color} 0 60deg, ${dark} 60deg 120deg, ${color} 120deg 180deg, ${dark} 180deg 240deg, ${color} 240deg 300deg, ${dark} 300deg 360deg)`;
  return (
    <div
      className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
      style={{ width: diameter, height: diameter }}
    >
      <span
        className={`absolute inset-0 rounded-full ${spinning ? "animate-[gk-roll_12s_linear_infinite]" : ""}`}
        style={{ backgroundImage: wedges, transform: spinning ? undefined : "rotate(20deg)" }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 18%, rgba(255,255,255,0) 42%, rgba(60,30,0,0.08) 70%, rgba(60,30,0,0.42) 100%)",
        }}
      />
    </div>
  );
}
