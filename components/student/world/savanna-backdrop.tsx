"use client";

import type { ReactNode } from "react";
import { useDeviceTier } from "@/hooks/use-device-tier";

/**
 * LE DÉCOR DE LA SAVANE — le fond du camp et de la carte.
 *
 * DEUX RENDUS, UN SEUL COMPOSANT. Sur un appareil « full », le décor est la
 * scène peinte (baobab, case, soleil) : `hub-savanna-portrait.jpg` sur
 * téléphone, `hub-savanna-wide.jpg` dès la tablette. C'est un `<picture>` et
 * non deux `<Image>` : `<picture>` ne charge QUE la source qui correspond à
 * l'écran, là où deux images masquées par CSS se chargeraient toutes les
 * deux. Sur un appareil « lite », le décor est en CSS et en SVG minuscule :
 * ciel, soleil, collines, deux acacias — quelques centaines d'octets, et
 * l'enfant a quand même sa savane.
 *
 * L'INSTANTANÉ SERVEUR EST « lite » (voir `use-device-tier`) : le HTML
 * pré-rendu peint donc le décor CSS immédiatement, et la scène bitmap le
 * remplace après hydratation si l'appareil le permet. Le premier rendu
 * n'attend jamais 370 Ko.
 *
 * `variant="map"` utilise le fond de sentier vertical, plus haut que large,
 * pour la carte-monde.
 *
 * `painted={false}` : le décor CSS même sur un appareil capable, tant que
 * l'appelant ne juge pas le moment venu de payer les 250 Ko de la scène peinte.
 * Pour un décor placé bas dans une page longue, comme sur la page d'accueil :
 * le visiteur qui s'arrête en haut ne les télécharge pas (`loading="lazy"` n'y
 * suffit pas : le navigateur charge une image paresseuse dès qu'elle est à
 * 1 250 pixels de l'écran).
 */
type Variant = "hub" | "map";

export function SavannaBackdrop({
  variant = "hub",
  children,
  className = "",
  minHeightClass = "min-h-[540px]",
  painted = true,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  minHeightClass?: string;
  painted?: boolean;
}) {
  const tier = useDeviceTier();

  return (
    <div
      className={`savanna-motion relative isolate overflow-hidden sm:rounded-[2rem] sm:shadow-2xl ${minHeightClass} ${className}`}
    >
      {tier === "full" && painted ? (
        <PaintedScene variant={variant} />
      ) : (
        <CssScene variant={variant} />
      )}

      {/* Un voile en bas, pour que le texte et les boutons restent lisibles
          quel que soit le décor derrière. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-40 bg-gradient-to-t from-amber-900/35 to-transparent"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PaintedScene({ variant }: { variant: Variant }) {
  if (variant === "map") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- direction artistique par `<picture>` ; `next/image` ne sait pas choisir une image selon l'écran
      <img
        src="/images/world/map-trail-bg.jpg"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
      />
    );
  }
  return (
    <picture>
      <source
        media="(min-width: 640px)"
        srcSet="/images/world/hub-savanna-wide.jpg"
      />
      <img
        src="/images/world/hub-savanna-portrait.jpg"
        alt=""
        aria-hidden
        draggable={false}
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-bottom"
      />
    </picture>
  );
}

/**
 * La savane en CSS : ce que voit un téléphone modeste, et ce que voit tout le
 * monde pendant le premier rendu. Elle doit être jolie, pas seulement
 * suffisante.
 */
function CssScene({ variant }: { variant: Variant }) {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Ciel */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#5db9f2_0%,#9ddcfb_55%,#f7e2a6_100%)]" />

      {/* Soleil */}
      <div className="absolute right-[12%] top-[7%] h-20 w-20 rounded-full bg-[radial-gradient(circle,#fff7c2_0%,#ffd23f_45%,rgba(255,176,32,0)_72%)] animate-[sun-pulse_6s_ease-in-out_infinite] sm:h-28 sm:w-28" />

      {/* Nuages */}
      <div className="absolute left-[8%] top-[10%] flex gap-1 opacity-90 animate-[cloud-drift_14s_ease-in-out_infinite_alternate]">
        <span className="h-6 w-10 rounded-full bg-white" />
        <span className="-ml-4 mt-2 h-5 w-8 rounded-full bg-white" />
      </div>

      {/* Collines lointaines */}
      <div className="absolute -left-[20%] bottom-[34%] h-40 w-[80%] rounded-[100%] bg-[#c78b4a]/70" />
      <div className="absolute -right-[25%] bottom-[36%] h-36 w-[80%] rounded-[100%] bg-[#b5773b]/60" />

      {/* Acacias : deux silhouettes SVG minuscules */}
      <svg
        viewBox="0 0 100 60"
        className="absolute bottom-[38%] left-[6%] h-16 w-24 text-[#3f8a2f]"
        fill="currentColor"
      >
        <rect x="46" y="30" width="6" height="30" fill="#7a4a23" />
        <ellipse cx="50" cy="26" rx="44" ry="12" />
        <ellipse cx="34" cy="18" rx="22" ry="8" />
      </svg>
      <svg
        viewBox="0 0 100 60"
        className="absolute bottom-[40%] right-[10%] h-12 w-20 text-[#4c9a3b]"
        fill="currentColor"
      >
        <rect x="47" y="32" width="5" height="28" fill="#7a4a23" />
        <ellipse cx="50" cy="28" rx="40" ry="10" />
      </svg>

      {/* Sol */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#f2c95e_0%,#e0a63d_100%)] ${
          variant === "map" ? "h-[42%]" : "h-[40%]"
        }`}
      />
      {/* Touffes d'herbe */}
      <div className="absolute bottom-[8%] left-[14%] h-6 w-10 rounded-[100%] bg-[#6ab04c]" />
      <div className="absolute bottom-[14%] right-[18%] h-5 w-8 rounded-[100%] bg-[#5da040]" />
      <div className="absolute bottom-[4%] right-[40%] h-4 w-7 rounded-[100%] bg-[#6ab04c]" />
    </div>
  );
}
