"use client";

/**
 * L'ATTENTE DU MODULE « ARABE & CORAN » : la Kaaba du médaillon, pas le baobab.
 *
 * Le propriétaire (29 septembre 2026) : pendant un chargement, le module doit
 * se montrer lui-même, pas l'arbre du loader général (`jotna-loader.tsx`). On
 * reprend donc le médaillon de l'accueil, la Kaaba que l'enfant vient de
 * toucher, posé sur une étoile dorée à huit branches : le ۞ qui marque les
 * quarts de hizb dans le Coran. L'étoile tourne lentement et le médaillon
 * respire, sauf si l'enfant a demandé moins de mouvement.
 */

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getModule } from "@/convex/moduleCatalog";
import { arabicCopy } from "@/lib/arabic/copy";

const MEDALLION = getModule("arabe_coran")?.medallion ?? "/images/coran/medallion.jpg";

export function QuranLoader({ message = arabicCopy.loading.path }: { message?: string }) {
  const reducedMotion = useReducedMotion();
  // `url(#…)` refuse les « : » et « « » » que `useId` peut contenir.
  const gold = `quran-gold-${useId().replace(/[^\w-]/g, "")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 py-10"
    >
      <div aria-hidden className="relative h-44 w-44">
        <motion.svg
          viewBox="-50 -50 100 100"
          className="absolute inset-0 h-full w-full drop-shadow-md"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* ۞ : deux carrés croisés. */}
          <g fill={`url(#${gold})`} stroke="#fffbeb" strokeWidth={1.5} strokeLinejoin="round">
            <rect x={-35} y={-35} width={70} height={70} rx={3} />
            <rect x={-35} y={-35} width={70} height={70} rx={3} transform="rotate(45)" />
          </g>
        </motion.svg>

        <motion.div
          className="absolute inset-[22px] overflow-hidden rounded-full border-4 border-white bg-white shadow-xl"
          animate={reducedMotion ? undefined : { scale: [0.97, 1.03, 0.97] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- vignette décorative ; `next/image` n'apporte rien sous export statique */}
          <img src={MEDALLION} alt="" draggable={false} className="h-full w-full object-cover" />
        </motion.div>
      </div>

      <p className="text-center font-display text-lg font-extrabold text-emerald-900">{message}</p>
    </div>
  );
}
