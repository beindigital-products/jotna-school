"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { DeviceTier } from "@/hooks/use-device-tier";
import { getLetter } from "@/convex/arabic/alphabet";
import {
  ARABIC_LESSONS,
  type ArabicLesson,
  type ArabicLevel,
} from "@/convex/arabic/curriculum";
import {
  QURAN_TRAIL,
  trailPointAt,
  trailWorldHeight,
} from "@/components/student/world/trail-geometry";

/**
 * LE CHEMIN DU CORAN — le décor et les repères de la carte du module.
 *
 * L'enfant part de son village du Sénégal, traverse le Sahara, arrive en
 * Arabie au crépuscule et monte jusqu'à la Kaaba : trente leçons, une par
 * étape, dans l'ordre du programme (`convex/arabic/curriculum.ts`). Le sentier
 * MONTE (`QURAN_TRAIL.direction = "up"`) : on grimpe vers le but, qu'on voit
 * briller en haut dès l'arrivée sur la carte.
 *
 * Les paysages sont des peintures OpenArt en vue du dessus, centre dégagé pour
 * le sentier tracé en code (`public/images/coran/`). Chaque zone suit un
 * groupe de niveaux : l'alphabet et les voyelles au village, l'assemblage et
 * les premiers mots dans le désert, les sourates en Arabie.
 *
 * AUCUN TEXTE ARABE N'EST PEINT dans ces images, et c'est une règle : un
 * générateur d'images invente de fausses lettres, et une fausse calligraphie
 * sur la Kaaba serait une faute dans un module qui apprend à lire le Coran.
 * L'arabe que voit l'enfant est toujours du vrai texte, dans la police Amiri.
 */

/** La Kaaba est le dernier point du sentier, après les trente leçons. */
export const KAABA_INDEX = ARABIC_LESSONS.length;
export const QURAN_POINTS = KAABA_INDEX + 1;

/** Le parvis de la Kaaba : Pio y arrive, au centre, devant l'illustration. */
export const KAABA_POINT = { x: QURAN_TRAIL.worldWidth / 2, y: QURAN_TRAIL.topPad };

export const QURAN_WORLD_HEIGHT = trailWorldHeight(QURAN_POINTS, QURAN_TRAIL);

/** 860 × 722 : l'illustration de la Kaaba, à la largeur du monde. */
const KAABA_HEIGHT = Math.round((QURAN_TRAIL.worldWidth * 722) / 860);
/**
 * Le parvis est à 330 px du haut de l'illustration : ce qui reste de
 * `topPad` au-dessus est du ciel, peint en code (dégradé et étoiles).
 */
const KAABA_TOP = QURAN_TRAIL.topPad - 330;
const SKY_STARS = [
  { x: 8, y: 22, s: 3 }, { x: 18, y: 58, s: 2 }, { x: 27, y: 12, s: 2 },
  { x: 36, y: 44, s: 3 }, { x: 47, y: 18, s: 2 }, { x: 58, y: 62, s: 2 },
  { x: 66, y: 28, s: 3 }, { x: 77, y: 50, s: 2 }, { x: 86, y: 16, s: 3 },
  { x: 93, y: 40, s: 2 }, { x: 12, y: 80, s: 2 }, { x: 72, y: 84, s: 2 },
] as const;
/** 860 × 1540 : une tuile de paysage, à la largeur du monde. */
const TILE_HEIGHT = Math.round((QURAN_TRAIL.worldWidth * 1540) / 860);
/** Deux tuiles voisines se chevauchent et se fondent sur cette hauteur. */
const TILE_OVERLAP = 110;

type Zone = {
  key: "arabie" | "sahara" | "senegal";
  images: readonly string[];
  /** Le dégradé du palier « lite », sans peinture. */
  lite: string;
};

const ZONES: Record<Zone["key"], Zone> = {
  arabie: {
    key: "arabie",
    images: ["/images/coran/zone-arabie.jpg", "/images/coran/zone-arabie-2.jpg"],
    lite: "linear-gradient(180deg,#f3c9a8 0%,#d9a5c4 55%,#8f7bc4 100%)",
  },
  sahara: {
    key: "sahara",
    images: ["/images/coran/zone-sahara.jpg"],
    lite: "linear-gradient(180deg,#f6d38a 0%,#eec26b 100%)",
  },
  senegal: {
    key: "senegal",
    images: ["/images/coran/zone-senegal.jpg", "/images/coran/zone-senegal-2.jpg"],
    lite: "linear-gradient(180deg,#e9b640 0%,#d9a52f 100%)",
  },
};

/** La hauteur-monde d'une étape du chemin. */
export function quranPointY(index: number): number {
  return trailPointAt(index, QURAN_POINTS, QURAN_TRAIL).y;
}

/** La zone d'une hauteur-monde : on change de paysage entre deux niveaux. */
function zoneAt(y: number): Zone {
  const firstOf = (kind: ArabicLesson["kind"]) =>
    ARABIC_LESSONS.findIndex((lesson) => lesson.kind === kind);
  const coran = firstOf("coran");
  const assemblage = firstOf("assemblage");
  const arabieEnd = (quranPointY(coran) + quranPointY(coran - 1)) / 2;
  const saharaEnd = (quranPointY(assemblage) + quranPointY(assemblage - 1)) / 2;
  if (y < arabieEnd) return ZONES.arabie;
  if (y < saharaEnd) return ZONES.sahara;
  return ZONES.senegal;
}

/**
 * Le sol du chemin : des tuiles peintes, empilées du haut vers le bas, chacune
 * fondue dans la précédente. Dans une zone, les tuiles alternent les
 * variantes, puis se retournent en miroir gauche-droite : les palmiers et les
 * maisons restent debout, seul le côté change. En haut, la Kaaba.
 */
export function QuranBackdrop({ tier }: { tier: DeviceTier }) {
  const step = TILE_HEIGHT - TILE_OVERLAP;
  const count = Math.max(1, Math.ceil((QURAN_WORLD_HEIGHT - TILE_OVERLAP) / step));
  const perZone = new Map<Zone["key"], number>();

  const tiles = Array.from({ length: count }, (_, k) => {
    const top = k * step;
    const zone = zoneAt(top + TILE_HEIGHT / 2);
    const j = perZone.get(zone.key) ?? 0;
    perZone.set(zone.key, j + 1);
    const n = zone.images.length;
    return {
      top,
      zone,
      image: zone.images[j % n],
      mirrored: Math.floor(j / n) % 2 === 1,
    };
  });

  const fade = `linear-gradient(to bottom, transparent 0px, black ${TILE_OVERLAP}px)`;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#e9c46a]">
      {tiles.map((tile, k) =>
        tier === "full" ? (
          // eslint-disable-next-line @next/next/no-img-element -- décor peint ; `next/image` n'apporte rien sous export statique
          <img
            key={k}
            src={tile.image}
            alt=""
            draggable={false}
            className="absolute left-0 w-full object-cover"
            style={{
              top: tile.top,
              height: TILE_HEIGHT,
              transform: tile.mirrored ? "scaleX(-1)" : undefined,
              ...(k > 0 ? { WebkitMaskImage: fade, maskImage: fade } : {}),
            }}
          />
        ) : (
          <div
            key={k}
            className="absolute left-0 w-full"
            style={{
              top: tile.top,
              height: TILE_HEIGHT,
              background: tile.zone.lite,
              ...(k > 0 ? { WebkitMaskImage: fade, maskImage: fade } : {}),
            }}
          />
        ),
      )}

      {/* Le ciel du soir au-dessus de La Mecque, jusqu'au haut de l'illustration. */}
      <div
        className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#0f0b2e] via-[#1c1650] to-[#2a2266]"
        style={{ height: KAABA_TOP + 60 }}
      >
        {SKY_STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-50 animate-[twinkle_2.4s_ease-in-out_infinite]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.s,
              height: star.s,
              animationDelay: `${(i % 5) * 0.45}s`,
            }}
          />
        ))}
      </div>

      {/* La Kaaba, au bout du chemin : le haut se fond dans le ciel, le pied dans le sable. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- illustration fixe du monde */}
      <img
        src="/images/coran/kaaba.jpg"
        alt=""
        draggable={false}
        className="absolute left-0 w-full object-cover"
        style={{
          top: KAABA_TOP,
          height: KAABA_HEIGHT,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 82%, transparent 100%)",
        }}
      />
    </div>
  );
}

/**
 * La lettre qu'une étape montre : la première lettre d'une leçon d'alphabet,
 * la première syllabe d'une leçon de voyelles. Rien pour les leçons de mots
 * et de sourates : un mot entier ne tient pas dans un bouton rond.
 */
export function lessonGlyph(lesson: ArabicLesson): string | undefined {
  if (lesson.kind === "alphabet") return getLetter(lesson.letters[0] ?? "")?.isolated;
  if (lesson.kind === "harakat") return lesson.items[0]?.ar;
  return undefined;
}

/**
 * Le nom du niveau, sur un ruban posé à côté de sa première étape, du côté
 * opposé : c'est là que le sentier laisse de la place.
 */
export function LevelRibbon({
  level,
  x,
  y,
}: {
  level: ArabicLevel;
  x: number;
  y: number;
}) {
  const center = QURAN_TRAIL.worldWidth / 2;
  const left = x < center ? center + 90 : center - 90;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top: y }}
    >
      <div
        className="flex w-[176px] items-center gap-2 rounded-2xl border-[3px] border-white px-2.5 py-1.5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${level.color}, ${level.color}d0)` }}
      >
        <span className="text-2xl leading-none">{level.emoji}</span>
        <span className="min-w-0">
          <span className="block font-display text-[11px] font-extrabold uppercase tracking-wide opacity-90">
            Niveau {level.order}
          </span>
          <span className="text-outline block truncate font-display text-sm font-extrabold leading-tight">
            {level.title}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Le départ, sous la première leçon : le village de l'enfant. */
export function StartMark({ y }: { y: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 -translate-x-1/2"
      style={{ left: QURAN_TRAIL.worldWidth / 2, top: y + 78 }}
    >
      <span className="flex items-center gap-2 rounded-full border-[3px] border-white bg-amber-950 px-4 py-1.5 font-display text-sm font-extrabold text-white shadow-lg">
        <span aria-hidden>🏁</span> Départ
      </span>
    </div>
  );
}

/**
 * La Kaaba, dernier point du sentier. On la touche comme une étape : si tout
 * le chemin est fait, Pio y monte ; sinon elle dit combien de leçons restent.
 * Jamais grisée, jamais « fermée » à l'image : c'est un but, pas une récompense
 * qu'on retire.
 */
export function KaabaNode({
  reached,
  remaining,
  selected,
  onSelect,
}: {
  reached: boolean;
  remaining: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <>
      {/* Le halo doré qui monte de la Kaaba quand le chemin est fait. */}
      {reached && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(253,230,138,0.7)_0%,rgba(253,230,138,0.25)_45%,rgba(253,230,138,0)_70%)] mix-blend-screen"
          style={{ left: KAABA_POINT.x, top: KAABA_POINT.y - 150, width: 300, height: 300 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-label={
          reached
            ? "La Kaaba : tu as fait tout le chemin"
            : `La Kaaba, au bout du chemin : encore ${remaining} leçon${remaining > 1 ? "s" : ""}`
        }
        aria-pressed={selected}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        style={{ left: KAABA_POINT.x, top: KAABA_POINT.y - 140, width: 200, height: 220 }}
      />

      {!reached && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2"
          style={{ left: KAABA_POINT.x, top: KAABA_POINT.y + 14 }}
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-[3px] border-amber-200 bg-indigo-950/85 px-3.5 py-1 font-display text-xs font-extrabold text-amber-100 shadow-lg">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Encore {remaining} leçon{remaining > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </>
  );
}
