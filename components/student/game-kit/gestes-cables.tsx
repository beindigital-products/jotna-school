"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useGameFeel } from "./use-game-feel";

/**
 * LES CÂBLES DE L'ASSOCIATION — ce qui relie deux tuiles qu'un enfant a
 * appariées.
 *
 * Chaque tuile porte une PRISE sur son bord intérieur (un petit disque, à
 * droite des tuiles de gauche, à gauche des tuiles de droite). Un lien est un
 * CÂBLE tendu d'une prise à l'autre : une courbe en S qui pend un peu au
 * milieu, peinte en quatre traits superposés pour avoir du volume (une lueur
 * large et pâle, un contour sombre, le câble dans la couleur de la paire, un
 * reflet blanc sur le dessus). Tout est dans un seul SVG posé par-dessus la
 * grille, qui ne capte aucun toucher : les tuiles restent des boutons.
 *
 * LES POSITIONS VIENNENT DE L'ÉCRAN, pas d'ici : `MatchExercise` mesure ses
 * tuiles (`getBoundingClientRect`) relativement à la planche et passe des
 * points en pixels. Ce fichier ne fait que dessiner.
 *
 * CE QUI BOUGE : un câble apparaît en fondu (opacité), une prise qui change
 * d'état gonfle (`gk-pop`, transform), une prise qui APPELLE (l'autre colonne
 * attend le partenaire de la tuile choisie) flotte (`gk-bob`), au niveau
 * riche seulement. Rien d'autre : pas de tracé animé du trait
 * (`stroke-dashoffset` n'est ni un transform ni une opacité).
 */
export type Point = { x: number; y: number };

/** La couleur d'un câble ou d'une prise reliée : le trait et son contour. */
export type CableTone = { main: string; dark: string };

/**
 * L'état d'une prise : `libre` (rien), `appel` (l'autre colonne a une tuile
 * choisie : viens ici), `choisie` (la tuile en main), `relie` (un câble y est
 * branché, dans la couleur de la paire).
 */
export type SocketMode = "libre" | "appel" | "choisie" | "relie";

export type Cable = { id: string; from: Point; to: Point; tone: CableTone };
export type Socket = { id: string; at: Point; mode: SocketMode; tone?: CableTone };

export const CABLE_WIDTH = 6;
const SOCKET_RADIUS = 8;

/* Les prises au repos et en appel : la crème des cartes et l'ambre du sable. */
const SOCKET_FREE = { fill: "#fff1cc", stroke: "#d6c39a", hole: "#d6c39a" };
const SOCKET_CALL = { fill: "#fbbf24", stroke: "#b45309", hole: "#78350f", halo: "#fbbf24" };

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Une courbe en S entre deux prises, tangentes horizontales, avec un léger
 * creux (le câble pend de quelques pixels : la gravité est peinte). Le
 * renflement horizontal suit la distance pour qu'un câble court reste lisible
 * et qu'un câble en diagonale ne se tende pas en droite ligne.
 */
export function cablePath(from: Point, to: Point): string {
  const dx = Math.abs(to.x - from.x);
  const bulge = Math.max(18, dx * 0.5);
  const direction = to.x >= from.x ? 1 : -1;
  const sag = 6;
  return (
    `M ${round(from.x)} ${round(from.y)} ` +
    `C ${round(from.x + direction * bulge)} ${round(from.y + sag)}, ` +
    `${round(to.x - direction * bulge)} ${round(to.y + sag)}, ` +
    `${round(to.x)} ${round(to.y)}`
  );
}

export function CableOverlay({
  cables,
  sockets,
  className = "",
}: {
  cables: readonly Cable[];
  sockets: readonly Socket[];
  className?: string;
}) {
  const feel = useGameFeel();
  return (
    <svg
      aria-hidden
      className={`gk-cables gk-motion pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible ${className}`}
    >
      {cables.map((cable) => {
        const d = cablePath(cable.from, cable.to);
        return (
          <motion.g
            key={cable.id}
            data-cable={cable.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* La lueur : le câble éclaire un peu la table. */}
            <path d={d} fill="none" stroke={cable.tone.main} strokeOpacity={0.28} strokeWidth={CABLE_WIDTH + 8} strokeLinecap="round" />
            {/* Le contour sombre : l'ombre du tube. */}
            <path d={d} fill="none" stroke={cable.tone.dark} strokeWidth={CABLE_WIDTH + 3} strokeLinecap="round" />
            {/* Le câble. */}
            <path d={d} fill="none" stroke={cable.tone.main} strokeWidth={CABLE_WIDTH} strokeLinecap="round" />
            {/* Le reflet : la lumière vient d'en haut. */}
            <path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" transform="translate(0 -1.5)" />
          </motion.g>
        );
      })}
      {sockets.map((socket) => (
        <SocketMark key={socket.id} socket={socket} floats={feel.budget.drift} />
      ))}
    </svg>
  );
}

/* Un `<g>` qui tourne et gonfle autour de son propre centre, pas de l'origine du SVG. */
const AROUND_SELF: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

function SocketMark({ socket, floats }: { socket: Socket; floats: boolean }) {
  const { at, mode, tone } = socket;
  const motionClass =
    mode === "appel" && floats
      ? "animate-[gk-bob_1.2s_ease-in-out_infinite]"
      : mode === "libre"
        ? ""
        : "animate-[gk-pop_0.45s_ease-out]";
  return (
    // La translation est un attribut SVG ; le gonflement, une animation CSS sur
    // un groupe intérieur : l'une n'écrase pas l'autre.
    <g transform={`translate(${round(at.x)} ${round(at.y)})`} data-socket={mode}>
      <g key={mode} className={motionClass} style={AROUND_SELF}>
        {mode === "appel" && <circle r={SOCKET_RADIUS + 6} fill={SOCKET_CALL.halo} fillOpacity={0.32} />}
        {mode === "libre" && (
          <>
            <circle r={SOCKET_RADIUS} fill={SOCKET_FREE.fill} stroke={SOCKET_FREE.stroke} strokeWidth={3} />
            <circle r={3} fill={SOCKET_FREE.hole} />
          </>
        )}
        {mode === "appel" && (
          <>
            <circle r={SOCKET_RADIUS + 1} fill={SOCKET_CALL.fill} stroke={SOCKET_CALL.stroke} strokeWidth={3} />
            <circle r={3} fill={SOCKET_CALL.hole} />
          </>
        )}
        {(mode === "choisie" || mode === "relie") && tone && (
          <>
            <circle r={SOCKET_RADIUS + 1} fill={tone.main} stroke={tone.dark} strokeWidth={3} />
            {/* L'éclat en haut à gauche : la prise est une bille, pas un disque. */}
            <circle cx={-2.5} cy={-2.5} r={2.5} fill="#ffffff" fillOpacity={0.75} />
          </>
        )}
      </g>
    </g>
  );
}
