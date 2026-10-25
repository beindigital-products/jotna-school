"use client";

import { useCallback, useLayoutEffect, useState } from "react";

/**
 * LA TAILLE D'UN CADRE — mesurée avant la première peinture.
 *
 * Rend une `ref` à poser sur l'élément, et sa taille (`null` tant que
 * l'élément n'est pas monté). La mesure se fait dans un effet de mise en page :
 * le premier rendu que l'enfant voit connaît déjà la taille, il n'y a pas de
 * saut d'une disposition à l'autre. La carte du monde s'en sert pour choisir
 * sa route debout ou couchée (`worldLayoutFor`) ; elle ne monte `GameMap` qu'une
 * fois la taille connue, parce que la caméra n'arrive qu'une seule fois par
 * montage.
 */
export function useFrameSize() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const ref = useCallback((el: HTMLElement | null) => setNode(el), []);

  useLayoutEffect(() => {
    if (!node) return;
    function measure() {
      const rect = node!.getBoundingClientRect();
      setSize((prev) =>
        prev && Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1
          ? prev
          : { w: rect.width, h: rect.height },
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [ref, size] as const;
}
