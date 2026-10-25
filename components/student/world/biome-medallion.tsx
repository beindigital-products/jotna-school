"use client";

import { Crown } from "lucide-react";
import { shade } from "@/components/student/game-kit/tones";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { subjectEmoji } from "@/lib/subjectIcons";
import { worldSceneSrc } from "@/lib/world-scenes";

/**
 * LE MÉDAILLON D'UN MONDE — une matière vue comme un monde peint sur un socle.
 *
 * Même grammaire que la boîte à outils des exercices (`game-kit`) : un socle
 * crème à flanc épais, comme une tuile ou un bouton « chunky », dans lequel est
 * serti le MONDE de la matière (`lib/world-scenes.ts`) : un boulier géant dans
 * la savane, un livre et une plume, un phare… une peinture entière par matière,
 * dans la même lumière dorée que le camp. Autour, l'anneau de progression,
 * teinté par la couleur de la matière, qu'on reconnaît ainsi d'un écran à
 * l'autre.
 *
 * Une matière dont le nom n'a pas de monde peint retombe sur l'un des quatre
 * biomes génériques (plaine, rivière, colline, forêt, cyclés selon l'index) et
 * son pictogramme (`subjectIcons.ts`) : n'importe quel nombre de matières tient
 * sur la carte.
 *
 * L'anneau fait le tour : plein quand toutes les étapes du monde sont
 * franchies, et le monde brille alors sous une couronne. Sur un appareil
 * « lite », le monde peint est la version de 192 pixels et le biome un dégradé :
 * même forme, même anneau, même lisibilité.
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

/** La couleur d'une matière est du texte libre : on n'assombrit que de l'hexadécimal. */
export function sideColor(color: string, factor: number, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? shade(color, factor) : fallback;
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
  const scene = worldSceneSrc(label, tier);
  const ring = Math.max(6, Math.round(size * 0.065));
  const r = (size - ring) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, progressPct));
  const dash = (pct / 100) * circumference;
  const done = pct >= 100 && !locked;
  const depth = Math.max(5, Math.round(size * 0.055));

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      style={{ width: showLabel ? size + 24 : size }}
    >
      <div className="relative savanna-motion" style={{ width: size, height: size }} aria-hidden>
        {/* La lueur d'un monde terminé */}
        {done && (
          <span className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.85)_0%,rgba(251,191,36,0.35)_55%,rgba(251,191,36,0)_72%)] animate-[world-glow_2.6s_ease-in-out_infinite]" />
        )}

        {/* Le socle : crème, à flanc épais comme un bouton du jeu */}
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#fffaf0] to-[#fde9b4]"
          style={{
            boxShadow: `0 ${depth}px 0 0 ${locked ? "#9ca3af" : "#c9a35a"}, 0 ${depth * 2}px ${depth * 2.4}px -${depth}px rgba(60,30,0,0.55)`,
          }}
        />

        {/* Le sol : le biome, dans un disque en creux */}
        <div
          className={`absolute overflow-hidden rounded-full shadow-[inset_0_6px_14px_rgba(60,30,0,0.4),inset_0_-3px_6px_rgba(255,255,255,0.35)] ${
            locked ? "grayscale" : ""
          }`}
          style={{ inset: ring + 2 }}
        >
          {scene ? (
            // eslint-disable-next-line @next/next/no-img-element -- monde peint de 15 à 50 Ko ; `next/image` n'apporte rien sous export statique
            <img src={scene} alt="" draggable={false} className="h-full w-full scale-[1.04] object-cover" />
          ) : (
            <>
              {tier === "full" ? (
                // eslint-disable-next-line @next/next/no-img-element -- disque décoratif ; `next/image` n'apporte rien sous export statique
                <img src={biome.file} alt="" draggable={false} className="h-full w-full object-cover" />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${biome.fallback}`} />
              )}
              <span
                className="absolute inset-0 flex items-center justify-center leading-none drop-shadow-[0_4px_3px_rgba(60,30,0,0.4)]"
                style={{ fontSize: Math.round(size * 0.46) }}
              >
                {subjectEmoji(icon)}
              </span>
            </>
          )}
          {/* Un reflet de verre, en haut à gauche */}
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_46%)]" />
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
            stroke="rgba(120,53,15,0.16)"
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

        {/* Fini : une couronne d'or */}
        {done && (
          <span className="absolute -top-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_3px_0_0_#b45309] animate-[pop-in_0.5s_ease-out]">
            <Crown className="h-5 w-5 fill-white text-white" strokeWidth={2.5} />
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
