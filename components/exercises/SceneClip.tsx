"use client";

import { useReducedMotion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/components/landing/use-media-query";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { sceneClipIdOf, sceneClipPoster, sceneClipSrc, type SceneClipId } from "@/lib/scene-clips";
import { usePromptReader } from "./prompt-reader";

/** Le temps que la carte se pose (ressort 260 / 24) avant de monter la vidéo : celui du clip de Pio (`session-stage.tsx`). */
const CLIP_AFTER_CARD_MS = 700;

/**
 * LE CLIP D'UNE SCÈNE DU CI (« Ta grand-mère te parle. Que fais-tu ? »), choisi
 * dans le catalogue fermé de `lib/scene-clips.ts`. Cinq secondes qui montrent
 * la SITUATION, jamais le bon geste : l'enfant qui ne lit pas encore voit ce qui
 * arrive, la voix de Pio lit l'énoncé. Il est posé sur le même présentoir que
 * l'image d'énoncé (`ExerciseImage`) : un cadre blanc épais, une dalle de sable.
 *
 * LA RÈGLE EST CELLE DU GRAND PIO (`session-stage.tsx`, `docs/pio-animations.md`) :
 * - L'AFFICHE EST TOUJOURS LÀ, sous la vidéo : la première image du clip, décodée
 *   sur place. Si la couche vidéo s'éteint (sur iOS, un son qui part coupe un clip
 *   muet), c'est elle qu'on voit, sans trou. Le clip est opaque, elle ne se montre
 *   jamais en double.
 * - LE CLIP JOUE UNE FOIS, puis reste sur sa dernière image : il ne boucle pas
 *   (rien ne raccorde sa fin à son début, une boucle ferait un saut toutes les
 *   cinq secondes pendant que l'enfant réfléchit).
 * - IL ATTEND que la carte soit posée (`CLIP_AFTER_CARD_MS` : monter une vidéo
 *   pendant le ressort de la carte, c'est l'image qui coûte) et que la voix ait
 *   fini de lire l'énoncé : jamais pendant qu'elle charge ou parle, et il se met
 *   en pause si l'enfant la relance. Au CI, la voix lit ensuite les propositions
 *   (`useTileVoice`) : elle ATTEND le clip entre l'énoncé et elles (`turn: "media"`,
 *   `registerMedia`), pour que l'enfant voie la situation avant d'entendre ses choix.
 * - IL NE PART SEUL que sur un appareil « full » (`use-device-tier` : ni économiseur
 *   de données, ni 2G, ni petite machine) et sans mouvement réduit. Ailleurs, l'affiche
 *   seule, et rien n'est téléchargé tant que l'enfant n'a pas touché la scène : un
 *   bouton rond la lance. Un clip fait de 110 à 310 Ko.
 * - LE MÊME BOUTON REVOIT LA SCÈNE une fois le clip fini, et il apparaît aussi quand le
 *   navigateur refuse la lecture automatique (le mode économie d'énergie d'iOS) : le
 *   toucher lance la vidéo dans le geste, là où elle est acceptée.
 *
 * Le clip n'a pas de piste son (`scripts/scene-clip-encode.sh`). Il est décoratif
 * pour un lecteur d'écran : l'énoncé dit la même chose, et le bouton a son nom.
 *
 * LA HAUTEUR SUIT L'ÉCRAN, parce que le clip prend la place des tuiles du premier
 * écran (`session-stage.tsx`, « le budget du premier écran ») : 9 rem sur un
 * téléphone de 668 à 960 px de haut, 6,5 rem de 601 à 667 px (360 × 640, iPhone SE),
 * 10 rem plus haut, 14 rem sur une tablette. Sur un écran de 481 à 600 px (320 × 568),
 * où la première tuile passait sous le dock, il n'y a PAS de clip. Un téléphone couché
 * (480 px ou moins) le pose À CÔTÉ de l'énoncé (`ExercisePrompt`), sur 5 rem de haut :
 * la largeur de la carte, pas sa hauteur. Les paliers s'excluent (Tailwind ne garantit
 * pas l'ordre de deux requêtes média arbitraires). Un fichier absent cache tout le
 * présentoir au lieu d'afficher une icône cassée ; une vidéo illisible laisse l'affiche.
 */
export function SceneClip({ id }: { id: SceneClipId }) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const reader = usePromptReader();
  // 481 à 600 px de haut : la carte n'a pas la place d'un clip (voir plus haut).
  const tooShort = useMediaQuery("(min-height: 481px) and (max-height: 600px)");
  // La voix charge ou parle : la vidéo attend (ou se met en pause). Entre la consigne et les
  // propositions, le lecteur lui laisse la parole (`turn: "media"`) : le clip joue alors.
  const voice = (reader?.status === "loading" || reader?.status === "playing") && reader?.turn !== "media";
  const auto = tier === "full" && !reducedMotion;

  const [settled, setSettled] = useState(false);
  const [asked, setAsked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [broken, setBroken] = useState(false);
  // Le navigateur a refusé la lecture automatique (le mode économie d'énergie d'iOS, par exemple) : seul un toucher la lance.
  const [blocked, setBlocked] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), CLIP_AFTER_CARD_MS);
    return () => clearTimeout(timer);
  }, []);

  const mounted = settled && (auto || asked) && !broken && !tooShort;

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    // React n'écrit pas l'attribut `muted` dans le HTML rendu ; iOS refuse alors la
    // lecture automatique. On le pose ici, puis on lance (ou on suspend) la lecture.
    element.muted = true;
    element.defaultMuted = true;
    if (voice || ended) {
      element.pause();
      return;
    }
    const play = element.play();
    if (play && typeof play.catch === "function") play.catch(() => setBlocked(true));
  }, [mounted, voice, ended]);

  // LE LECTEUR ATTEND LE CLIP entre la consigne et les propositions (`prompt-reader.tsx`, `turn`) :
  // il le fait pour un clip qui va partir seul, et seulement jusqu'à sa PREMIÈRE fin (finie, cassée
  // ou refusée par le navigateur). Rejoué au bouton, il ne retient plus la voix.
  const doneOnce = useRef(false);
  const waiters = useRef<(() => void)[]>([]);
  const release = useCallback(() => {
    for (const resolve of waiters.current.splice(0)) resolve();
  }, []);
  useEffect(() => {
    if (ended || broken || blocked) {
      doneOnce.current = true;
      release();
    }
  }, [ended, broken, blocked, release]);
  const registerMedia = reader?.registerMedia;
  const playsAlone = auto && !tooShort && !posterBroken && !broken;
  useEffect(() => {
    if (!registerMedia || !playsAlone) return;
    registerMedia({
      pending: () => !doneOnce.current,
      wait: () =>
        doneOnce.current
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              waiters.current.push(resolve);
            }),
    });
    return () => {
      registerMedia(null);
      release();
    };
  }, [registerMedia, playsAlone, release]);

  if (posterBroken || tooShort) return null;

  const canTap = !broken && (ended || blocked || (!auto && !asked));
  const label = ended ? "Revoir la scène" : "Voir la scène";
  // Le toucher lance la lecture LUI-MÊME, dans le geste : un navigateur qui refusait la lecture
  // automatique l'accepte ici. Pas pendant que la voix parle : le clip reprend à son silence.
  const replay = () => {
    const element = video.current;
    if (element) {
      if (ended) element.currentTime = 0;
      if (!voice) {
        element.muted = true;
        const play = element.play();
        if (play && typeof play.catch === "function") play.catch(() => setBlocked(true));
      }
    }
    setEnded(false);
    setBlocked(false);
    setAsked(true);
  };

  return (
    <figure className="flex justify-center [@media(max-height:480px)]:shrink-0" data-scene-clip={id} data-scene-state={ended ? "fini" : !mounted ? "affiche" : voice ? "attend" : "joue"}>
      <span className="relative inline-flex flex-col items-center">
        {/* Le cadre : une face blanche épaisse, le flanc crème des tuiles. */}
        <span className="relative z-[1] rounded-2xl border-[3px] border-white bg-white p-1 shadow-[0_5px_0_#d6c39a,0_12px_18px_-12px_rgba(60,30,0,0.5)]">
          <span className="relative block aspect-[3/2] h-40 overflow-hidden rounded-xl bg-white [@media(min-width:640px)_and_(min-height:961px)]:h-56 [@media(max-height:960px)_and_(min-height:668px)]:h-36 [@media(max-height:667px)_and_(min-height:601px)]:h-[6.5rem] [@media(max-height:480px)]:h-20">
            {/* L'affiche, sous la vidéo. Pas `next/image` : export statique, sans serveur d'optimisation. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sceneClipPoster(id)}
              alt=""
              aria-hidden
              width={768}
              height={512}
              decoding="sync"
              draggable={false}
              onError={() => setPosterBroken(true)}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
            {mounted && (
              <video
                ref={video}
                src={sceneClipSrc(id)}
                poster={sceneClipPoster(id)}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                aria-hidden
                tabIndex={-1}
                onEnded={() => setEnded(true)}
                onError={() => setBroken(true)}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
            {canTap && (
              <button
                type="button"
                onClick={replay}
                aria-label={label}
                data-scene-tap
                className="gk-focus absolute bottom-1.5 right-1.5 grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-orange-500 text-white shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-[0_1px_0_#c2410c]"
              >
                {ended ? <RotateCcw className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5 fill-current" aria-hidden />}
              </button>
            )}
          </span>
        </span>
        {/* La dalle de sable : l'ombre au sol, peinte. */}
        <span
          aria-hidden
          className="-mt-2 h-4 w-[82%] rounded-[50%] bg-[linear-gradient(180deg,#f2c95e_0%,#e0a63d_100%)] shadow-[0_3px_0_#c9a35a]"
        />
      </span>
    </figure>
  );
}

/** L'identifiant de scène d'un payload d'exercice, s'il est dans le catalogue. */
export function payloadScene(payload: unknown): SceneClipId | undefined {
  return sceneClipIdOf(payload) ?? undefined;
}
