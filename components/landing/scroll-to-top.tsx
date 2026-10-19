"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Au-delà de cette distance, la page est « longue » : le bouton a un sens. */
const SHOW_AFTER_PX = 400;
/** Sur téléphone, le bouton se retire après ce délai sans défilement. */
const PHONE_IDLE_MS = 2500;
/** Un défilement plus petit n'est pas un geste : on l'ignore. */
const JITTER_PX = 4;

/**
 * SUR TÉLÉPHONE, LE BOUTON NE RESTE PAS : il recouvrait l'extrémité droite de
 * « Valider » dans la démonstration des exercices (le bouton est fixe, en bas à
 * droite, et « Valider » prend toute la largeur) ; toucher cette zone remontait
 * la page au lieu de valider. Il n'apparaît donc que quand on REMONTE la page,
 * le geste qui veut un retour en haut, puis il se retire quand on redescend ou
 * après un court temps sans défilement. À partir de 640 px (`sm`), il y a de la
 * place à côté du contenu : il reste affiché, comme avant.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 639px)");
    let lastY = window.scrollY;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const handler = () => {
      const y = window.scrollY;
      clearTimeout(idle);
      if (y <= SHOW_AFTER_PX) {
        setVisible(false);
      } else if (!phone.matches) {
        setVisible(true);
      } else if (y < lastY - JITTER_PX) {
        setVisible(true);
        idle = setTimeout(() => setVisible(false), PHONE_IDLE_MS);
      } else if (y > lastY + JITTER_PX) {
        setVisible(false);
      }
      lastY = y;
    };
    // L'écran change de largeur (rotation) : on repart de l'état du moment.
    const onResize = () => {
      clearTimeout(idle);
      setVisible(!phone.matches && window.scrollY > SHOW_AFTER_PX);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    phone.addEventListener("change", onResize);
    return () => {
      clearTimeout(idle);
      window.removeEventListener("scroll", handler);
      phone.removeEventListener("change", onResize);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="Remonter en haut de la page"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow-lg ring-1 ring-black/5 transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:bottom-8 sm:right-8 sm:size-14"
        >
          <ArrowUp className="size-5 sm:size-6" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
