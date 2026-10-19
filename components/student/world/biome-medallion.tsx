"use client";

import { useDeviceTier } from "@/hooks/use-device-tier";
import { subjectEmoji } from "@/lib/subjectIcons";

/**
 * LE MÉDAILLON D'UN MONDE — une matière vue comme une zone de la savane.
 *
 * Quatre biomes génériques (plaine, rivière, colline, forêt) cyclent selon
 * l'index de la matière : aucune illustration par matière, donc n'importe
 * quel nombre de matières tient sur la carte (G4/§5 de la conception de
 * juillet). La couleur de la matière teinte l'anneau et le badge, pour
 * qu'on la reconnaisse d'un écran à l'autre.
 *
 * L'anneau de progression fait le tour : plein quand toutes les étapes du
 * monde sont franchies. Sur un appareil « lite », le biome est un dégradé
 * au lieu d'une photo — même forme, même anneau, même lisibilité.
 */
const BIOMES = [
  { file: "/images/world/biome-plaine.jpg", fallback: "from-lime-300 to-amber-300" },
  { file: "/images/world/biome-riviere.jpg", fallback: "from-sky-300 to-teal-300" },
  { file: "/images/world/biome-colline.jpg", fallback: "from-amber-300 to-orange-300" },
  { file: "/images/world/biome-foret.jpg", fallback: "from-green-400 to-emerald-300" },
] as const;

export function biomeFor(index: number) {
  return BIOMES[((index % BIOMES.length) + BIOMES.length) % BIOMES.length];
}

type Props = {
  index: number;
  color: string;
  icon: string;
  label: string;
  /** 0..100 */
  progressPct: number;
  size?: number;
  /** Une matière sans étape jouable : grisée, sans anneau. */
  locked?: boolean;
  /** `false` quand l'appelant pose lui-même le nom (la carte, sur une plaque). */
  showLabel?: boolean;
  className?: string;
};

export function BiomeMedallion({
  index,
  color,
  icon,
  label,
  progressPct,
  size = 112,
  locked = false,
  showLabel = true,
  className = "",
}: Props) {
  const tier = useDeviceTier();
  const biome = biomeFor(index);
  const ring = 6;
  const r = (size - ring) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, progressPct));
  const dash = (pct / 100) * circumference;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      style={{ width: showLabel ? size + 24 : size }}
    >
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {/* Le biome, dans un disque */}
        <div
          className={`absolute inset-[6px] overflow-hidden rounded-full shadow-[inset_0_-8px_16px_rgba(0,0,0,0.25)] ${
            locked ? "grayscale" : ""
          }`}
        >
          {tier === "full" ? (
            // eslint-disable-next-line @next/next/no-img-element -- disque décoratif ; `next/image` n'apporte rien sous export statique
            <img
              src={biome.file}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${biome.fallback}`} />
          )}
        </div>

        {/* L'anneau de progression, teinté par la matière */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={ring}
          />
          {!locked && pct > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={ring}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              className="transition-[stroke-dasharray] duration-700"
            />
          )}
        </svg>

        {/* Le badge de la matière, en bas à droite */}
        <span
          className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-xl shadow-md"
          style={{ backgroundColor: locked ? "#9ca3af" : color }}
        >
          <span className="drop-shadow">{subjectEmoji(icon)}</span>
        </span>

        {/* Fini : une couronne */}
        {pct >= 100 && !locked && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl drop-shadow animate-[pop-in_0.5s_ease-out]">
            👑
          </span>
        )}
      </div>

      {showLabel && (
        <p className="max-w-full truncate text-center font-display text-base font-extrabold text-amber-950 text-balance">
          {label}
        </p>
      )}
    </div>
  );
}
