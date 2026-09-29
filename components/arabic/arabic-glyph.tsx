"use client";

/**
 * DE L'ARABE QUI TIENT DANS SA CASE, QUELLE QUE SOIT LA LETTRE.
 *
 * LE PROBLÈME. Amiri dessine loin de la ligne de base : la boucle de ج, ح, خ,
 * ع, غ descend d'un demi-corps, la hampe de ل ou de ك monte d'autant, et une
 * voyelle brève ajoute encore un étage. Avec une hauteur de ligne serrée
 * (`leading-none`), ces lettres sortaient de leur tuile et recouvraient leur
 * nom : le 28 septembre 2026, le propriétaire a vu « djîm » caché sous le ج.
 * Une hauteur de ligne large, elle, laisse la lettre flotter trop haut ou trop
 * bas selon qu'elle monte ou qu'elle descend.
 *
 * LA RÉPONSE : ON CENTRE L'ENCRE, PAS LA LIGNE. Le navigateur mesure la boîte
 * réellement encrée du texte (`measureText` sur un canevas, dans la police de
 * la page), puis on dessine le texte dans un SVG en plaçant la ligne de base à
 * la main : l'encre tombe au milieu de la case, et le corps s'ajuste pour y
 * tenir. Le SVG suit la taille de sa case, sans aucune mesure de l'écran.
 *
 * DEUX BORNES À LA TAILLE. L'encre occupe au plus `fill` de la hauteur et de
 * la largeur de la case, et le corps ne dépasse jamais `cap` fois sa hauteur :
 * sans ce plafond, une lettre ramassée comme ه gonflerait jusqu'à remplir la
 * case, et l'enfant ne verrait plus qu'elle est petite à côté de ل.
 *
 * AVANT QUE LA POLICE N'ARRIVE, on suppose une encre large (`FALLBACK`), qui
 * tient dans n'importe quelle case ; la vraie mesure suit dès que la police
 * est là.
 */

import { useEffect, useState } from "react";

/** La boîte encrée, en em, autour du point d'origine du texte. */
interface Ink {
  left: number;
  right: number;
  ascent: number;
  descent: number;
}

const FALLBACK: Ink = { left: 0.1, right: 0.9, ascent: 1, descent: 0.6 };

/** Une mesure par texte, pour toute la page : les lettres reviennent sans cesse. */
const inkCache = new Map<string, Ink>();

/** La police de `.font-arabic`, telle que `next/font` la déclare (app/layout.tsx). */
function fontSpec(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-arabic")
    .trim();
  return `100px ${family.length > 0 ? `${family}, ` : ""}serif`;
}

/** La boîte encrée de `text`, ou `null` si le navigateur ne sait pas la dire. */
function measureInk(text: string): Ink | null {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = fontSpec();
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const box = ctx.measureText(text);
  const ink = {
    left: box.actualBoundingBoxLeft / 100,
    right: box.actualBoundingBoxRight / 100,
    ascent: box.actualBoundingBoxAscent / 100,
    descent: box.actualBoundingBoxDescent / 100,
  };
  const valid =
    Object.values(ink).every(Number.isFinite) &&
    ink.left + ink.right > 0 &&
    ink.ascent + ink.descent > 0;
  return valid ? ink : null;
}

/** La mesure tout de suite, si la police est déjà chargée pour ce texte. */
function inkIfFontReady(text: string): Ink | null {
  if (typeof document === "undefined" || !document.fonts) return null;
  return document.fonts.check(fontSpec(), text) ? measureInk(text) : null;
}

/**
 * La boîte encrée de `text`. Le rendu ne fait que LIRE le cache : on
 * n'y écrit que dans l'effet, une fois la police chargée.
 */
function useInk(text: string): Ink {
  const [measured, setMeasured] = useState<{ text: string; ink: Ink } | null>(null);

  useEffect(() => {
    if (inkCache.has(text)) return;
    let cancelled = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    void (fonts ? fonts.load(fontSpec(), text) : Promise.resolve())
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const ink = measureInk(text);
        if (!ink) return;
        inkCache.set(text, ink);
        setMeasured({ text, ink });
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    inkCache.get(text) ??
    (measured?.text === text ? measured.ink : null) ??
    inkIfFontReady(text) ??
    FALLBACK
  );
}

export function ArabicGlyph({
  text,
  aspect = 1,
  fill = 0.86,
  cap = 0.9,
  className,
}: {
  /** Une lettre, une syllabe vocalisée ou un mot court. */
  text: string;
  /** Largeur sur hauteur de la case ; la classe doit donner la même proportion. */
  aspect?: number;
  /** La part de la case que l'encre peut occuper, en hauteur comme en largeur. */
  fill?: number;
  /** Le corps maximal, en fraction de la hauteur de la case. */
  cap?: number;
  className?: string;
}) {
  const ink = useInk(text);
  const width = 100 * aspect;
  const size = Math.min(
    (fill * 100) / (ink.ascent + ink.descent),
    (fill * width) / (ink.left + ink.right),
    cap * 100,
  );
  // L'origine du texte, placée pour que le CENTRE DE L'ENCRE tombe au centre.
  const x = width / 2 - ((ink.right - ink.left) / 2) * size;
  const y = 50 + ((ink.ascent - ink.descent) / 2) * size;

  return (
    <svg
      viewBox={`0 0 ${width} 100`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <text
        x={x}
        y={y}
        fontSize={size}
        fill="currentColor"
        direction="ltr"
        className="font-arabic"
      >
        {text}
      </text>
    </svg>
  );
}
