"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { TourStep } from "./tour-steps";

/**
 * LE PROJECTEUR — une visite guidée qui montre les vrais éléments de la page.
 *
 * Chaque étape pointe un élément par son attribut `data-tour="…"`. Le reste de
 * l'écran s'assombrit, l'élément reste éclairé et une bulle s'ouvre à côté.
 * Même principe que la librairie shadcn/tour, sans dépendance de plus.
 *
 * - Plusieurs éléments peuvent porter la même clé (la navigation de l'élève
 *   existe en barre du haut ET en barre du bas) : on prend le premier VISIBLE.
 * - Cible absente ou cachée (menu replié sur téléphone, liste vide) : la bulle
 *   s'affiche au centre, l'étape garde son sens.
 * - Flèches gauche et droite avancent et reculent, Échap passe la visite.
 */

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 250;
const GAP = 16;
const MARGIN = 12;

type Rect = { top: number; left: number; width: number; height: number };

function findTarget(key: string | undefined): HTMLElement | null {
  if (!key) return null;
  const candidates = document.querySelectorAll<HTMLElement>(
    `[data-tour="${key}"]`,
  );
  for (const el of candidates) {
    const box = el.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return el;
  }
  return null;
}

function measure(key: string | undefined): Rect | null {
  const el = findTarget(key);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function placePopover(
  rect: Rect | null,
  preferred: TourStep["position"],
  viewport: { w: number; h: number },
): { top: number; left: number } {
  if (!rect) {
    return {
      top: Math.max(MARGIN, (viewport.h - POPOVER_HEIGHT) / 2),
      left: Math.max(MARGIN, (viewport.w - POPOVER_WIDTH) / 2),
    };
  }
  const roomRight = viewport.w - (rect.left + rect.width) - GAP - MARGIN;
  const roomLeft = rect.left - GAP - MARGIN;
  let side = preferred ?? "right";
  if (side === "right" && roomRight < POPOVER_WIDTH) {
    side = roomLeft >= POPOVER_WIDTH ? "left" : "bottom";
  } else if (side === "left" && roomLeft < POPOVER_WIDTH) {
    side = roomRight >= POPOVER_WIDTH ? "right" : "bottom";
  }

  if (side === "right") {
    return {
      left: rect.left + rect.width + GAP,
      top: clamp(rect.top, MARGIN, viewport.h - POPOVER_HEIGHT - MARGIN),
    };
  }
  if (side === "left") {
    return {
      left: rect.left - GAP - POPOVER_WIDTH,
      top: clamp(rect.top, MARGIN, viewport.h - POPOVER_HEIGHT - MARGIN),
    };
  }
  const below = rect.top + rect.height + GAP;
  const top =
    side === "top" || below + POPOVER_HEIGHT > viewport.h - MARGIN
      ? rect.top - GAP - POPOVER_HEIGHT
      : below;
  return {
    top: clamp(top, MARGIN, viewport.h - POPOVER_HEIGHT - MARGIN),
    left: clamp(rect.left, MARGIN, viewport.w - POPOVER_WIDTH - MARGIN),
  };
}

export function SpotlightTour({
  steps,
  index,
  onIndexChange,
  onSkip,
  onFinish,
  finishLabel = "Terminer",
}: {
  steps: TourStep[];
  index: number;
  onIndexChange: (index: number) => void;
  onSkip: () => void;
  onFinish: () => void;
  finishLabel?: string;
}) {
  const step = steps[index];
  const last = index === steps.length - 1;
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 720 });
  const nextRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    setRect(measure(step.target));
  }, [step.target]);

  // Mesure après le rendu, puis à chaque changement de taille ou de défilement.
  // Deux relectures différées couvrent l'animation d'ouverture du menu latéral.
  useEffect(() => {
    findTarget(step.target)?.scrollIntoView({ block: "nearest" });
    const frame = requestAnimationFrame(refresh);
    const later = [setTimeout(refresh, 150), setTimeout(refresh, 450)];
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      cancelAnimationFrame(frame);
      later.forEach(clearTimeout);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [refresh, step.target]);

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (last) onFinish();
        else onIndexChange(index + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        onIndexChange(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, last, onFinish, onIndexChange, onSkip]);

  const pad = 8;
  const hole = rect
    ? {
        x: rect.left - pad,
        y: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : { x: viewport.w / 2, y: viewport.h / 2, width: 0, height: 0 };
  const popover = placePopover(rect, step.position, viewport);

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-slot="tour">
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden
        width={viewport.w}
        height={viewport.h}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              rx={12}
              fill="black"
              initial={false}
              animate={hole}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.62)"
          mask="url(#tour-mask)"
        />
        {rect && (
          <motion.rect
            rx={12}
            fill="none"
            stroke="#84cc16"
            strokeWidth={2}
            initial={false}
            animate={hole}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </svg>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="absolute w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-[top,left] duration-300"
        style={{ top: popover.top, left: popover.left }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Étape {index + 1} sur {steps.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-bold text-gray-900">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm text-gray-600">{step.body}</p>
        {step.points && (
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {step.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="text-lime-700">
                  •
                </span>
                {point}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
            Passer
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onIndexChange(index - 1)}
              >
                Précédent
              </Button>
            )}
            <Button
              ref={nextRef}
              type="button"
              size="sm"
              onClick={() => (last ? onFinish() : onIndexChange(index + 1))}
            >
              {last ? finishLabel : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
