"use client";

import { useEffect, useState } from "react";

/**
 * VRAI UNE FOIS LA PAGE CHARGÉE (polices, images, scripts), `delay` millisecondes
 * plus tard. Pour lancer ce qui est lourd sans rivaliser avec ce que le
 * visiteur attend : le clip de Pio démarre après le texte, jamais avant.
 */
export function useAfterLoad(delay = 600): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => setReady(true), delay);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", start);
    };
  }, [delay]);

  return ready;
}
