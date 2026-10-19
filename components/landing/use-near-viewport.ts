"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * VRAI QUAND L'ÉLÉMENT EST À MOINS DE `margin` DE L'ÉCRAN : on peut commencer à
 * charger ce qui est lourd (les exercices, les clips de Pio), pour que ce soit
 * prêt à l'arrivée du visiteur, sans rien télécharger pour celui qui s'arrête
 * en haut de la page. Une fois vrai, il le reste.
 */
export function useNearViewport(ref: RefObject<HTMLElement | null>, margin: string): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const node = ref.current;
    // Sans observateur (très vieux navigateur), on charge dès que la page est prête.
    if (!node || typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, ref, margin]);

  return near;
}
