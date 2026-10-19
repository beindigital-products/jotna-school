"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Reward } from "./reward";
import { useGameFeel } from "./use-game-feel";

/**
 * LE COFFRE AU TRÉSOR — la récompense d'un palier, en vidéo.
 *
 * À la fin d'un palier validé, un vrai coffre de bois cerclé d'or s'ouvre
 * devant Pio : le couvercle se lève sur sa charnière, les pièces et les gemmes
 * apparaissent, une lumière dorée monte, puis l'éclat de la boîte à outils
 * (`Reward` : anneau, étoiles en roue, pièces, confettis plafonnés). Quand le
 * palier est manqué, le coffre reste fermé : « il te manque 3 étoiles » montre
 * un but, pas une note (D81).
 *
 * C'EST UN CLIP, COMME PIO. Le coffre a d'abord été fait en faces de CSS 3D :
 * du carton à côté du lionceau (retour du propriétaire, 19 octobre 2026 : il
 * le voulait « vraiment réaliste »). Le rendu vient du studio : l'image du
 * coffre fermé de gpt-image-2 (même univers que Pio, 3D soignée, bois chaud et
 * or épais), puis un clip d'ouverture de Kling v3.0 en image vers vidéo, la
 * caméra fixe, sur un fond bleu pur que `scripts/coffre-encode.sh` rend
 * transparent. Il existe en deux formats, comme ceux de Pio (`docs/pio-animations.md`) :
 *
 *   - `public/videos/coffre/ouverture.mov`  HEVC avec alpha, pour iOS et Safari ;
 *   - `public/videos/coffre/ouverture.webm` VP9 avec alpha, pour Android, Chrome et Firefox.
 *
 * Le clip dure 2,5 s : un instant de coffre fermé, le couvercle qui monte (la
 * charnière est derrière, on voit le dedans du couvercle), le trésor, un
 * instant de repos. Il ne tourne PAS en boucle : à la fin, le coffre reste
 * ouvert. Deux images fixes, qui sont les bornes exactes du clip (même coupe,
 * même détourage, même cadre), le prolongent :
 *
 *   - `public/images/coffre/ferme.webp`, la première : l'affiche de la vidéo
 *     (rien ne saute quand elle démarre), et le coffre du palier manqué ;
 *   - `public/images/coffre/ouvert.webp`, la dernière : l'état final, qui
 *     prend le relais DANS LA MÊME IMAGE que la fin du clip.
 *
 * AU REPOS, PAS DE VIDÉO. Une fois le clip fini, la `<video>` est retirée du
 * DOM et l'image « ouvert » reste seule : le décodeur est libéré (Pio joue son
 * propre clip sur le même écran), et sur iOS un son qui part ne peut plus faire
 * disparaître la couche vidéo du coffre (voir `pio.tsx`). Deux filets pour que
 * le coffre finisse TOUJOURS ouvert : si la lecture ne démarre pas (lecture
 * automatique refusée, économie d'énergie), le coffre s'ouvre sur l'image fixe ;
 * et un minuteur de sécurité ferme la scène de toute façon.
 *
 * LE CLIP NE JOUE PAS SUR UN APPAREIL « SOBRE » (`useGameFeel`, mêmes seuils que
 * le reste du jeu) : deux vidéos alpha sur un petit téléphone, c'est trop. Le
 * coffre passe alors du fermé à l'ouvert par un fondu, la lueur et l'éclat
 * restent. Sous `prefers-reduced-motion`, le coffre est ouvert d'emblée.
 *
 * LA LUEUR ET LES SCINTILLEMENTS SONT PEINTS (`transform` et `opacity` seulement),
 * pas dans la vidéo : un halo transparent se détoure mal sur du bleu, et le CSS
 * les cale sur le moment où le couvercle monte. Les scintillements ne tournent
 * qu'au niveau « riche ».
 *
 * `open` ouvre ; `burst` joue l'éclat une fois le couvercle levé ; `size` est la
 * largeur de la CAISSE fermée en pixels (le cadre en fait 1,35 fois la largeur
 * et 1,32 fois la hauteur : le couvercle ouvert déborde vers le haut et la
 * droite) ; `startDelayMs` retarde le départ du clip (le temps que le coffre ait
 * fini d'entrer). Le bas de la caisse est ramené au bas de l'élément par une
 * marge négative : à côté de Pio, les deux se posent sur la même ligne.
 */

export const COFFRE_FERME = "/images/coffre/ferme.webp";
export const COFFRE_OUVERT = "/images/coffre/ouvert.webp";
export const COFFRE_CLIP = {
  mov: "/videos/coffre/ouverture.mov",
  webm: "/videos/coffre/ouverture.webm",
} as const;

/**
 * La géométrie du cadre, fixée par `scripts/coffre-encode.sh` : 608 × 592 pixels,
 * la caisse fermée y fait 450 de large et son bas est à 34 pixels du bas. Ne
 * retoucher l'un sans l'autre.
 */
export const CADRE = { width: 608, height: 592, caisse: 450, pied: 34 } as const;

/** La durée du clip, en millisecondes. */
export const OUVERTURE_MS = 2500;
/** Depuis la première image jouée : la lueur monte avec le couvercle... */
export const LUEUR_MS = 450;
/** ... et l'éclat part quand le couvercle est levé et le trésor visible. */
export const ECLAT_MS = 1100;
/** Si la première image n'est pas jouée dans ce délai, on se passe du clip. */
const DEMARRAGE_MAX_MS = 1500;
/**
 * L'image « ouvert » prend la place à l'heure nominale de la fin du clip, plus
 * cette marge, SANS attendre l'événement `ended` : sur iOS, un son qui part
 * pendant le clip peut éteindre sa couche vidéo (voir `pio.tsx`) et rien ne dit
 * alors qu'il est fini. L'image est le dernier cadre du clip : le raccord ne se
 * voit pas.
 */
const FIN_MARGE_MS = 80;
/** Le fondu du fermé à l'ouvert, sans clip. */
const FONDU_MS = 450;

let coffreWarmed = false;

/**
 * PRÉPARE L'ARRIVÉE DU COFFRE : ses deux images et son clip (235 Ko) se chargent
 * pendant les dernières questions du palier, pas au moment où l'écran de fin
 * les demande. Sur le web, une donnée chère et un réseau lent feraient attendre
 * le couvercle ; dans l'application, les fichiers sont déjà dans le téléphone.
 * Le clip est demandé dans le format que ce navigateur lira (HEVC alpha d'abord,
 * VP9 sinon), comme la `<video>` ; `fetch` remplit le cache HTTP, qui servira la
 * lecture. Une seule fois par page. Rend les adresses demandées cette fois-ci
 * (vide quand tout l'était déjà) : le test les lit.
 */
export function preloadCoffre(): string[] {
  if (coffreWarmed || typeof window === "undefined") return [];
  coffreWarmed = true;
  const requested: string[] = [];
  for (const src of [COFFRE_FERME, COFFRE_OUVERT]) {
    const image = new window.Image();
    image.src = src;
    // Décodée tout de suite aussi : le bitmap attend dans le cache du moteur.
    if (typeof image.decode === "function") image.decode().catch(() => {});
    requested.push(src);
  }
  if (typeof fetch === "function") {
    const clip = document.createElement("video").canPlayType('video/quicktime; codecs="hvc1"') ? COFFRE_CLIP.mov : COFFRE_CLIP.webm;
    // `priority` n'est pas encore dans les types du DOM ; les navigateurs qui l'ignorent chargent en priorité normale.
    void fetch(clip, { priority: "low" } as RequestInit).catch(() => {});
    requested.push(clip);
  }
  return requested;
}

/** Les dimensions de l'élément pour une largeur de caisse donnée. */
export function coffreGeometry(size: number) {
  const k = size / CADRE.caisse;
  return {
    width: Math.round(CADRE.width * k),
    height: Math.round(CADRE.height * k),
    /** Le vide sous la caisse, ramené par une marge négative. */
    pied: Math.round(CADRE.pied * k),
  };
}

/** Où brillent les scintillements, en pourcentage du cadre : sur le tas d'or. */
const SCINTILLEMENTS = [
  { left: 36, top: 47, taille: 16, retard: 0 },
  { left: 58, top: 38, taille: 12, retard: 0.55 },
  { left: 48, top: 52, taille: 14, retard: 1.1 },
  { left: 66, top: 48, taille: 11, retard: 0.8 },
  { left: 42, top: 36, taille: 10, retard: 1.6 },
] as const;

export function Coffre({
  open,
  burst = true,
  size = 150,
  label,
  className = "",
  startDelayMs = 600,
}: {
  /** Le palier est validé : le couvercle se lève et le trésor brille. */
  open: boolean;
  /** Jouer l'éclat (`Reward`) une fois le coffre ouvert. */
  burst?: boolean;
  /** La largeur de la caisse fermée, en pixels. */
  size?: number;
  /** Ce qu'un lecteur d'écran annonce. */
  label?: string;
  className?: string;
  /** Le retard du clip : le temps que le coffre ait fini d'entrer. */
  startDelayMs?: number;
}) {
  const feel = useGameFeel();
  const geo = coffreGeometry(size);
  const withClip = open && feel.rich && !feel.reducedMotion;

  // `ended` : le clip est fini (ou on s'en passe) : l'image « ouvert » prend la place.
  const [ended, setEnded] = useState(false);
  // `fade` : sans clip, le fondu du fermé à l'ouvert a commencé.
  const [fade, setFade] = useState(false);
  const [glow, setGlow] = useState(false);
  const [fire, setFire] = useState<number | null>(null);
  // Le temps zéro : la première image jouée (avec clip) ou l'arrivée (sans).
  const [t0, setT0] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    },
    [],
  );

  // SANS CLIP : le temps zéro est l'arrivée ; le fondu part aussitôt (sous
  // `prefers-reduced-motion`, il n'a pas de durée : l'image « ouvert » est là).
  useEffect(() => {
    if (!open || withClip) return;
    const timer = setTimeout(() => {
      setT0(Date.now());
      setFade(true);
    }, feel.reducedMotion ? 0 : 150);
    return () => clearTimeout(timer);
  }, [open, withClip, feel.reducedMotion]);

  // AVEC CLIP : on le lance après `startDelayMs`. Un refus de lecture, ou une
  // première image qui tarde trop, ouvre le coffre sur l'image fixe. Le
  // minuteur de sécurité ferme la scène même si aucun événement ne vient.
  useEffect(() => {
    if (!withClip) return;
    const video = videoRef.current;
    const starter = setTimeout(() => {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      const play = video.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {
          setEnded(true);
          setT0((t) => t ?? Date.now());
        });
      }
    }, startDelayMs);
    const giveUp = setTimeout(() => {
      if (startedRef.current) return;
      setEnded(true);
      setT0((t) => t ?? Date.now());
    }, startDelayMs + DEMARRAGE_MAX_MS);
    const safety = setTimeout(() => setEnded(true), startDelayMs + DEMARRAGE_MAX_MS + OUVERTURE_MS + 700);
    return () => {
      clearTimeout(starter);
      clearTimeout(giveUp);
      clearTimeout(safety);
    };
  }, [withClip, startDelayMs]);

  // La lueur monte avec le couvercle, l'éclat part quand il est levé.
  useEffect(() => {
    if (t0 === null) return;
    const since = Date.now() - t0;
    const glowTimer = setTimeout(() => setGlow(true), feel.reducedMotion ? 0 : Math.max(0, LUEUR_MS - since));
    const burstTimer = burst
      ? setTimeout(() => setFire(Date.now()), feel.reducedMotion ? 0 : Math.max(0, ECLAT_MS - since))
      : null;
    return () => {
      clearTimeout(glowTimer);
      if (burstTimer) clearTimeout(burstTimer);
    };
  }, [t0, burst, feel.reducedMotion]);

  // Quelle image est peinte : le fermé tant que rien ne s'ouvre, l'ouvert quand
  // le clip est fini ou fondu. Pendant le clip, aucune des deux : la vidéo
  // dessine, et le fermé dessous ferait un couvercle fantôme là où il vient de
  // partir (même leçon que l'affiche de Pio sous un clip qui bouge).
  const showClip = withClip && !ended;
  const openStill = open && (feel.reducedMotion || (withClip ? ended : fade));
  const closedStill = !showClip && !openStill;
  const phase = !open ? "ferme" : openStill ? "ouvert" : "ouverture";

  const wobble = !open && !feel.reducedMotion;

  return (
    <motion.div
      role="img"
      aria-label={label ?? (open ? "Le coffre au trésor est ouvert" : "Le coffre au trésor est fermé")}
      className={`gk-chest relative inline-block shrink-0 select-none overflow-visible ${className}`}
      style={{ width: geo.width, height: geo.height, marginBottom: -geo.pied }}
      data-open={open}
      data-phase={phase}
      initial={false}
      animate={wobble ? { rotate: [0, -2.2, 2.2, -1.4, 1.4, 0] } : { rotate: 0 }}
      transition={wobble ? { duration: 0.7, delay: 0.9, ease: "easeInOut" } : { duration: 0 }}
    >
      {/* L'ombre au sol, peinte : le coffre est détouré, il n'a pas la sienne. */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(60,30,0,0.4)_0%,rgba(60,30,0,0)_70%)]"
        style={{ bottom: Math.round(geo.pied - size * 0.07), width: Math.round(size * 1.05), height: Math.round(size * 0.16) }}
      />

      {/* La lueur dorée qui monte du trésor : derrière le coffre, dans le cadre. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,247,194,0.95)_0%,rgba(255,210,63,0.55)_38%,rgba(255,176,32,0)_70%)]"
        initial={false}
        animate={{ opacity: open && glow ? 0.95 : 0, scale: open && glow ? 1 : 0.6 }}
        transition={{ duration: feel.reducedMotion ? 0 : 0.7, ease: "easeOut" }}
      />

      {/* Le coffre fermé : l'affiche de la vidéo, et le coffre du palier manqué. */}
      <Image
        src={COFFRE_FERME}
        alt=""
        width={CADRE.width}
        height={CADRE.height}
        priority
        unoptimized
        draggable={false}
        decoding="sync"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        style={{ opacity: closedStill ? 1 : 0, transition: feel.reducedMotion ? "none" : `opacity ${FONDU_MS}ms ease` }}
      />

      {/* Le coffre ouvert : le dernier cadre du clip, posé quand le clip finit. */}
      <Image
        src={COFFRE_OUVERT}
        alt=""
        width={CADRE.width}
        height={CADRE.height}
        priority
        unoptimized
        draggable={false}
        decoding="sync"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        style={{ opacity: openStill ? 1 : 0, transition: feel.reducedMotion || withClip ? "none" : `opacity ${FONDU_MS}ms ease` }}
      />

      {/* Le clip : une seule lecture, sans boucle, retiré à la fin. */}
      {showClip && (
        <video
          ref={videoRef}
          className="pointer-events-none absolute inset-0 h-full w-full max-w-none object-contain"
          width={CADRE.width}
          height={CADRE.height}
          poster={COFFRE_FERME}
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          aria-hidden
          tabIndex={-1}
          onPlaying={() => {
            // `playing` revient après chaque mise en mémoire tampon : une seule fois.
            if (startedRef.current) return;
            startedRef.current = true;
            setT0((t) => t ?? Date.now());
            endTimerRef.current = setTimeout(() => setEnded(true), OUVERTURE_MS + FIN_MARGE_MS);
          }}
          onEnded={() => setEnded(true)}
        >
          {/* Safari et iOS lisent la première ; Chrome, Android et Firefox passent à la seconde. */}
          <source src={COFFRE_CLIP.mov} type='video/quicktime; codecs="hvc1"' />
          <source
            src={COFFRE_CLIP.webm}
            type='video/webm; codecs="vp9"'
            onError={() => {
              // Aucune des deux sources n'a pu être lue : le coffre s'ouvre sur l'image fixe.
              setEnded(true);
              setT0((t) => t ?? Date.now());
            }}
          />
        </video>
      )}

      {/* Les scintillements sur le tas d'or : au niveau « riche » seulement. */}
      {open && glow && feel.rich && !feel.reducedMotion &&
        SCINTILLEMENTS.map((spark, index) => (
          <motion.svg
            key={index}
            aria-hidden
            data-scintillement
            viewBox="0 0 24 24"
            className="pointer-events-none absolute"
            style={{ left: `${spark.left}%`, top: `${spark.top}%`, width: spark.taille, height: spark.taille, marginLeft: -spark.taille / 2, marginTop: -spark.taille / 2 }}
            initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 0.2], rotate: [0, 45, 90] }}
            transition={{ duration: 1.8, delay: spark.retard, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
          >
            <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill="#fff7c2" />
          </motion.svg>
        ))}

      {/* L'éclat, au-dessus de l'ouverture. */}
      <div aria-hidden className="absolute left-1/2 top-[36%] h-0 w-0">
        <Reward fire={fire} />
      </div>
    </motion.div>
  );
}
