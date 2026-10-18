"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Lightbulb, Music, WifiOff, X } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
import { toggleReader, useActivePromptReader } from "@/components/exercises/prompt-reader";
import {
  ActionButton3D,
  LISTEN_LABEL,
  LISTEN_MUTED_LABEL,
  ProgressTrack,
  SceneDockProvider,
  StageBackdrop,
  useMotionWillChange,
} from "@/components/student/game-kit";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { Pio, preloadPioPosters, type PioState } from "@/components/student/pio";
import {
  computeExerciseScore,
  MAX_ATTEMPTS_PER_EXERCISE,
  scoreToStarsSingle,
} from "@/convex/paliers/scoring";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { kidMessages } from "@/lib/kidCopy";
import { pickLine, pioSays } from "@/lib/pioCopy";
import { preloadAll } from "@/lib/sounds";
import type { AnswerOutcome } from "./answer-feedback";

/**
 * LA COQUE D'UNE SÉANCE — l'écran de jeu autour de chaque exercice.
 *
 * La séance jouait une carte blanche sur le dégradé du layout, avec une barre
 * orange-rose et « Question 3/10 » en texte. Ici, l'exercice se joue DANS le
 * Monde de Pio : la savane de la boîte à outils (`StageBackdrop`) monte
 * jusque sous l'encoche, l'en-tête de niveau porte le sentier de la séance
 * (`ProgressTrack` : dix pierres, le jeton qui avance, les cœurs des essais,
 * les étoiles gagnées), PIO EST GRAND dans la scène de la question, la carte
 * crème est posée avec son épaisseur, et chaque question ARRIVE d'un ressort
 * comme un niveau qui se charge, puis SORT vers le haut.
 *
 * LA SCÈNE DE LA QUESTION (demande du propriétaire, maquette du 18 octobre
 * 2026) : un grand Pio en pose « ask » (il montre l'énoncé du doigt, la loupe
 * dans l'autre patte), son buste au-dessus de la carte, à gauche ; la carte
 * glisse devant ses pattes ; sa bulle à sa droite, vers laquelle son bras est
 * tendu. Sa taille suit la HAUTEUR UTILE de l'écran (`--stage-pio` : 28 % de
 * `100svh` moins l'encoche, entre 120 et 280 px ; 17 % entre 104 et 124 px de
 * 601 à 667 px de haut, 18 % entre 88 et 120 px de 481 à 600 ; 112 px en
 * paysage) : grand sur un téléphone de 844 px, plus petit sur 640, et un QCM
 * à quatre options (ou à trois, à tuiles d'émojis) avec un énoncé de quatre
 * lignes garde TOUTES ses tuiles au-dessus du dock sur le premier écran
 * (mesuré de 360 × 640 à 820 × 1180 dans Chromium, `scripts/shoot-exercises.mjs`
 * avec ses encoches simulées, et dans le WKWebView de l'iPhone 17 : l'encoche
 * y prend 62 px, que `svh` compte et que l'enfant ne voit pas).
 * PIO SE TOUCHE : quand une voix lit l'énoncé (CI, CP), il est un bouton
 * « Écouter l'énoncé », même geste que le bouton bleu de la barre d'action.
 * Il joue son CLIP (il respire, cligne, regarde autour de lui, le bras tendu)
 * quand l'appareil le permet (`use-device-tier` « full », pas de mouvement
 * réduit), une fois la carte posée et pendant vingt secondes au plus
 * (`CLIP_PLAY_MS` : le décodage VP9 alpha est logiciel sur Android), et
 * montre son AFFICHE ensuite, pendant que la voix
 * parle et pendant la réaction à la réponse : sur iOS, un son qui joue coupe
 * le clip HEVC muet (Pio disparaissait le temps d'un mot) ; comme la première
 * image du clip est l'affiche, la bascule ne se voit pas. PENDANT LA SCÈNE DE
 * RÉPONSE, LE GRAND PIO ET SA BULLE S'EFFACENT (opacité seule, 200 ms, puis
 * `visibility: hidden`) : c'est la scène (`answer-feedback.tsx`) qui porte le
 * Pio de l'issue (`cheer`, `encourage`, `sad`) et son « Bravo ! ». Le grand
 * Pio prenait la même pose derrière le voile, avec la même phrase dans sa
 * bulle : deux lions identiques l'un sous l'autre, le petit collé sur le corps
 * du grand, le message deux fois (relu le 18 octobre 2026, web, iOS et
 * Android). Un seul lion à l'écran, un seul message ; le grand garde son
 * affiche « ask » sous le voile, aucune image à échanger dans l'image du
 * verdict. Et quand la scène s'en va (bonne réponse : la carte suivante
 * arrive en même temps), elle s'efface d'abord (180 ms : la scène est rendue
 * à côté de la carte, pas dedans, pour que sa sortie joue quand la carte
 * change), le grand Pio revient 200 ms après : jamais les deux lions dans la
 * même image. Jamais animé par du code.
 *
 * EN PAYSAGE (un téléphone couché, 480 px de haut ou moins : `Info.plist`
 * autorise les deux orientations, le manifeste Android ne verrouille rien),
 * la scène se range EN DEUX COLONNES : Pio et sa bulle dans une colonne de
 * 10,5 rem à gauche, la carte à droite, et la largeur de la page monte à
 * `max-w-4xl`. En colonne, avec l'en-tête (86 px) et le dock (94 px), un Pio
 * de 96 px et sa bulle laissaient 195 px à la carte : la première réponse
 * était sous le dock pour les douze écrans (relu le 18 octobre 2026,
 * 667 × 375 et 874 × 402). Depuis, l'en-tête fait 80 px et le dock 74, et la
 * première rangée d'un QCM est entière à 667 × 375 (5 px de marge sur le
 * QCM 4, 16 sur le QCM 3).
 *
 * UNE SEULE COQUE POUR LES DEUX SÉANCES. `online-session.tsx` (le web, le
 * serveur juge) et `offline-session.tsx` (l'application, l'appareil juge)
 * passent ici le même état et rendent la même chose : la mécanique (essais,
 * indices, orthographe, voix, journal, synchronisation) reste chez elles,
 * l'habillage et le mouvement sont ici.
 *
 * CE QUI BOUGE, ET COMMENT : des `transform` et de l'`opacity`, rien d'autre
 * (`docs/direction-jeu-exercices.md`, budgets). L'en-tête n'a pas de
 * `backdrop-filter` : un flou sous lequel la carte défile se recalcule à
 * chaque image sur le WKWebView ; il est crème OPAQUE (il était à 92 %, et
 * l'énoncé qui défilait dessous se lisait entre les cœurs ; même leçon pour le
 * dock, `scene-dock.tsx`). Ses marges verticales suivent la hauteur de
 * l'écran (8 px sur une tablette, 6 sur un téléphone, 4 sur un écran court),
 * comme le sentier et ses cœurs : le même en-tête, moins de souffle, et ses
 * quatre lignes (titre, sous-titre, sentier, cœurs) restent : à 360 px de
 * large, dix pierres et cinq cœurs ne tiennent pas sur une même ligne (le
 * sentier veut toute la largeur). Les ressorts framer-motion suivent `MotionConfig
 * reducedMotion="user"` posé par le layout élève : sous
 * `prefers-reduced-motion`, les cartes apparaissent en fondu, sans
 * déplacement.
 *
 * LE TEXTE AGRANDI (la taille de police du système, que le WebView Android
 * suit par `textZoom` ; les `rem` de Tailwind suivent) : l'en-tête et le dock
 * grandissent avec le texte, mais leurs ICÔNES, leurs boutons ronds, leurs
 * cœurs et leurs marges sont en pixels, pas en `rem`. À 200 %, sur 360 × 640,
 * les deux prenaient 73 % de l'écran (relu le 18 octobre 2026) ; en pixels,
 * environ la moitié de cela. La rangée de Pio a une hauteur MINIMALE, pas
 * fixe : une bulle de trois lignes grandit la rangée au lieu de monter sous
 * l'en-tête.
 *
 * LES ZONES SÛRES : la scène passe sous la barre d'état (`useBareStatusBar`,
 * comme la fin de palier) ; dès qu'on fait défiler, une barre givrée crème
 * revient couvrir l'encoche (`FrostBar`). L'en-tête reste collé sous elle.
 *
 * LA BARRE D'ACTION EST COLLÉE EN BAS DE L'ÉCRAN (demande du propriétaire du
 * 18 octobre 2026 : « colle la barre en bas »). La racine de la coque est le
 * `SceneDockProvider` du kit (`game-kit/scene-dock.tsx`) : un panneau crème
 * `fixed` au bas de l'écran, dans le langage de l'en-tête (liseré blanc,
 * crème OPAQUE, ombre statique vers le haut), où la barre « Écouter +
 * Valider » de chaque exercice se téléporte (`ExerciseActions`), sur UNE
 * ligne sur tous les téléphones (960 px de haut ou moins, `scene-action-bar.tsx`). Le contenu
 * réserve en bas la hauteur MESURÉE du dock (`--dock-h`), barre d'accueil
 * comprise : la dernière tuile se fait défiler au-dessus de lui. Le dock
 * reste en place d'une question à l'autre, seul son contenu change ; la scène
 * de réponse passe par-dessus (portail, z-50) ; les écrans de fin ne le
 * rendent pas. Quand le clavier monte pour une réponse tapée en lettres, le
 * dock monte au-dessus de lui sur iOS (viewport visuel) et suit la fenêtre
 * sur Android ; le champ se recentre lui-même (`ShortAnswerExercise`).
 */
export type SessionHint = {
  /** L'enfant peut demander un indice maintenant (progressif : 1, 2 puis 4 essais ratés). */
  canAsk: boolean;
  onAsk: () => void;
  /** L'indice déjà montré pour cet exercice. */
  shown: { text: string; index: number } | null;
};

export type SessionSound = {
  enabled: boolean;
  onToggle: () => void;
};

export function SessionStage({
  topicName,
  palierIndex,
  questionIndex,
  total,
  missed,
  failedAttempts,
  stars,
  outcome,
  isVariation = false,
  sound,
  onQuit,
  networkLost = false,
  exerciseKey,
  hint,
  overlay,
  children,
}: {
  topicName: string;
  palierIndex: number;
  /** L'exercice affiché, base 0. */
  questionIndex: number;
  total: number;
  /** Les index des exercices passés sans réussite (pierres ambre). */
  missed?: readonly number[];
  /** Essais ratés sur l'exercice en cours : les cœurs se vident. */
  failedAttempts: number;
  /** Étoiles gagnées depuis le début de la séance ; absent = pas de compteur. */
  stars?: number;
  /** La réponse en cours de réaction, ou `null` pendant que l'enfant cherche. */
  outcome: AnswerOutcome | null;
  isVariation?: boolean;
  /** Le son : absent tant que l'enfant n'a pas décidé (pas de bouton). */
  sound?: SessionSound | null;
  onQuit: () => void;
  /** Le web a perdu le réseau : la bannière le dit sans alarmer (D90). */
  networkLost?: boolean;
  /** Change avec l'exercice : la carte sort et la suivante arrive. */
  exerciseKey: string;
  hint?: SessionHint;
  /** La scène de réponse (`AnswerFeedback` dans son `AnimatePresence`), portée dans le body. */
  overlay?: ReactNode;
  /** L'exercice rendu. */
  children: ReactNode;
}) {
  useBareStatusBar();

  // Le premier son met environ 300 ms à partir sur iOS : on précharge dès que
  // l'enfant a dit oui au son, pas au moment du premier « Bravo ».
  useEffect(() => {
    if (sound?.enabled) void preloadAll();
  }, [sound?.enabled]);

  // Une nouvelle question remonte en haut de la page : l'enfant qui avait fait
  // défiler une longue association pour atteindre « Valider » retrouverait
  // sinon la question suivante déjà à moitié passée sous l'en-tête, Pio et sa
  // bulle cachés (vu sur le simulateur iPhone 17). D'un coup (`instant`), pas
  // en douceur : `globals.css` pose `scroll-behavior: smooth` sur la page, et
  // sur le WKWebView ce défilement doux est annulé par la carte précédente qui
  // s'efface au même moment (la page change de hauteur) ; la carte qui arrive
  // porte déjà son propre mouvement.
  useEffect(() => {
    if (typeof window === "undefined" || window.scrollY === 0) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [exerciseKey]);

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS_PER_EXERCISE - failedAttempts);
  const coach = coachLine({
    questionIndex,
    total,
    failedAttempts,
    seed: questionIndex * 10 + failedAttempts,
  });
  // La réponse donnée : la scène de réponse parle, le grand Pio et sa bulle
  // s'effacent (voir l'en-tête du fichier). `inert` retire aussi le bouton
  // « Écouter l'énoncé » de Pio de l'ordre de tabulation le temps du fondu.
  const reacting = outcome !== null;

  return (
    // La racine porte le dock (`fixed` en bas, hors de la carte transformée)
    // et `--dock-h`, sa hauteur mesurée. Elle n'a ni `transform` ni `filter` :
    // le dock et la barre givrée s'y calent sur l'écran.
    <SceneDockProvider
      data-session-stage
      className="relative isolate -mx-4 -mt-[env(safe-area-inset-top)] -mb-[calc(env(safe-area-inset-bottom)+1.5rem)] min-h-[100dvh]"
    >
      {/* La savane, derrière tout : une couche à part, pour que l'en-tête
          collant et les éclats qui dépassent de la carte ne soient pas rognés.
          L'horizon est calé sur l'ÉCRAN (72 % de `100svh`), pas sur la page :
          la racine prend la hauteur du contenu, et une carte plus haute à la
          question suivante faisait descendre le sol de 44 px d'un coup. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <StageBackdrop
          className="h-full"
          horizon={72}
          horizonFrom="screen"
          painted
          // Le soleil et les nuages du décor CSS, sous l'en-tête collant (140 px sur un téléphone).
          skyTop="calc(env(safe-area-inset-top, 0px) + 9rem)"
        />
      </div>
      <FrostBar />

      {/* En bas : la place du dock (sa hauteur comprend la barre d'accueil) et
          un souffle, ou, sans dock (un exercice cassé), la marge du mode focus. */}
      <div
        className="relative z-10 pt-[env(safe-area-inset-top)]"
        style={{ paddingBottom: "calc(max(var(--dock-h, 0px), env(safe-area-inset-bottom, 0px)) + 1.5rem)" }}
      >
        <SessionHud
          topicName={topicName}
          palierIndex={palierIndex}
          questionIndex={questionIndex}
          total={total}
          missed={missed}
          attemptsLeft={attemptsLeft}
          stars={stars}
          advanced={outcome?.correct === true}
          isVariation={isVariation}
          sound={sound}
          onQuit={onQuit}
        />

        <div className="mx-auto max-w-2xl px-4 [@media(max-height:480px)]:max-w-4xl">
          {networkLost && (
            <div
              role="status"
              className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-white bg-[#fff8e6] px-4 py-2 font-display text-sm font-bold text-amber-900 shadow-[0_3px_0_#d6c39a]"
            >
              <WifiOff className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
              {kidMessages.networkLost}
            </div>
          )}

          {/* LA SCÈNE DE LA QUESTION : le grand Pio à gauche, sa bulle à droite,
              la carte qui glisse devant ses pattes. `--stage-pio` est sa
              hauteur debout : 28 % de la HAUTEUR UTILE de l'écran, entre 120
              et 280 px (`vh` d'abord, `svh` dès que le moteur le sait : la
              barre d'adresse d'un navigateur ne la fait pas sauter). La
              hauteur utile, c'est l'écran moins l'encoche
              (`env(safe-area-inset-top)`, 62 px sur un iPhone 17, 0 sur le
              web et sur Android) : `svh` la compte, l'en-tête la passe, et
              l'enfant ne la voit pas ; sans la retirer, le même énoncé
              poussait « Valider » sous le pli sur l'iPhone (mesuré le
              18 octobre 2026). Sur un écran de 601 à 667 px (iPhone SE,
              360 × 640), 17 %, entre 104 et 124 px ; de 481 à 600 px
              (320 × 568), 18 %, entre 88 et 120 px, la rangée à 52 % ; 112 px
              sur un téléphone en paysage, où Pio passe en colonne à gauche
              de la carte (voir l'en-tête du fichier). Les paliers s'excluent :
              Tailwind ne garantit pas l'ordre de deux requêtes média
              arbitraires. La rangée fait 57 % de cette hauteur
              (`--stage-pio-bust`, 56 % sur un écran court) : le buste, jusque
              sous la main tendue ; le reste passe derrière la carte.
              LE BUDGET DU PREMIER ÉCRAN (relu le 18 octobre 2026) : Pio, sa
              bulle, l'énoncé, TOUTES les tuiles d'un QCM et le dock. Avec
              30 % et un dock sur deux rangées, la seconde rangée du QCM 4
              (« 5 » et « 1 », la bonne réponse comprise) passait à moitié
              sous le dock sur l'iPhone 17 et à 360 × 640, et rien ne disait
              à un enfant de six ans de faire défiler. Les leviers pris, dans
              l'ordre : le dock sur UNE ligne sur tous les téléphones
              (`scene-action-bar.tsx`, 960 px), Pio de 30 à 28 % (et de 20 à
              17 % sur un écran court : la mesure l'exigeait, 37 px de trop à
              360 × 640 avec un dock déjà sur une ligne), les marges de
              l'en-tête, de la carte, du dock et du QCM, l'énoncé long en 18 px
              et ses socles d'un cran plus petits sur un écran court
              (`ExercisePrompt`). Mesuré dans Chromium
              (`scripts/shoot-exercises.mjs --seance-types tous --tous-appareils`,
              encoches simulées) : toutes les tuiles du QCM 4 et du QCM 3
              tiennent au-dessus du dock avec 19 et 32 px de marge à 360 × 640,
              71 et 56 à 375 × 667, 35 et 38 à 390 × 844 (encoche 47), 47 et
              49 à 402 × 874 (encoche 62, l'iPhone 17), 132 et 105 dans le
              WebView Android de 412 × 840, 195 et 168 à 412 × 915 ; à
              320 × 568 et en paysage, la première rangée est entière (38 px et
              5 px de marge) et le reste se fait défiler. */}
          <div
            data-question-scene
            className="relative mt-2 [@media(max-height:667px)]:[--bubble-k:0.03] [--stage-pio:clamp(120px,calc((100vh_-_env(safe-area-inset-top,0px))*0.28),280px)] [--stage-pio-bust:0.57] supports-[height:1svh]:[--stage-pio:clamp(120px,calc((100svh_-_env(safe-area-inset-top,0px))*0.28),280px)] [@media(max-height:667px)]:mt-1 [@media(max-height:667px)]:[--stage-pio-bust:0.56] [@media(max-height:667px)_and_(min-height:601px)]:[--stage-pio:clamp(104px,calc((100vh_-_env(safe-area-inset-top,0px))*0.17),124px)] [@media(max-height:667px)_and_(min-height:601px)]:supports-[height:1svh]:[--stage-pio:clamp(104px,calc((100svh_-_env(safe-area-inset-top,0px))*0.17),124px)] [@media(max-height:600px)_and_(min-height:481px)]:[--stage-pio:clamp(88px,calc((100vh_-_env(safe-area-inset-top,0px))*0.18),120px)] [@media(max-height:600px)_and_(min-height:481px)]:supports-[height:1svh]:[--stage-pio:clamp(88px,calc((100svh_-_env(safe-area-inset-top,0px))*0.18),120px)] [@media(max-height:600px)_and_(min-height:481px)]:[--stage-pio-bust:0.52] [@media(max-height:480px)]:[--stage-pio:112px] [@media(max-height:480px)]:flex [@media(max-height:480px)]:items-start [@media(max-height:480px)]:gap-3"
          >
            {/* La rangée de Pio : une hauteur MINIMALE (une bulle de trois
                lignes la grandit, elle ne monte pas sous l'en-tête). Elle
                s'efface pendant la scène de réponse : opacité, puis
                `visibility` (la transition la bascule à la fin du fondu, et
                la rend dès le début du retour). ELLE REVIENT APRÈS LA SCÈNE :
                200 ms de délai au retour seulement (la scène s'efface en
                180 ms, `answer-feedback.tsx`), sinon le grand Pio
                réapparaissait sous le voile pendant que le Pio de la scène
                était encore là, deux lions le temps du fondu (mesuré dans
                Chromium et dans le WebView Android le 18 octobre 2026 : Pio à
                98 % d'opacité, scène encore à 100 %). En paysage, une colonne. */}
            <div
              className={`relative z-0 flex items-end gap-2 pl-1 transition-[opacity,visibility] duration-200 ease-out [@media(max-height:480px)]:w-[10.5rem] [@media(max-height:480px)]:shrink-0 [@media(max-height:480px)]:flex-col [@media(max-height:480px)]:items-stretch [@media(max-height:480px)]:gap-2 [@media(max-height:480px)]:pl-0 [@media(max-height:480px)]:[&_[data-tail]]:hidden ${
                reacting ? "invisible opacity-0" : "opacity-100 delay-200"
              }`}
              style={{ minHeight: "calc(var(--stage-pio) * var(--stage-pio-bust))" }}
              data-coach-pose="ask"
              data-coach-hidden={reacting ? "1" : undefined}
              inert={reacting || undefined}
            >
              <CoachPio reacting={reacting} exerciseKey={exerciseKey} />
              <SpeechBubble
                bubbleKey={coach.text}
                tail="left"
                align="start"
                className="min-w-0 flex-1 mb-[var(--bubble-mb)] [@media(max-height:480px)]:mb-0 [@media(max-height:480px)]:flex-none"
                style={{ "--bubble-mb": "calc(var(--stage-pio) * var(--bubble-k, 0.12))" } as CSSProperties}
              >
                {coach.text}
              </SpeechBubble>
            </div>

            {/* La carte de l'exercice : elle arrive, elle repart ; au-dessus des pattes de Pio. */}
            <ExerciseStageCard cardKey={exerciseKey} className="z-10 [@media(max-height:480px)]:min-w-0 [@media(max-height:480px)]:flex-1">
              {children}
              {hint && <HintSlot hint={hint} disabled={reacting} />}
            </ExerciseStageCard>
            {/* LA SCÈNE DE RÉPONSE, À CÔTÉ DE LA CARTE, PAS DEDANS. Elle est
                portée dans le body (`createPortal`) : sa place dans le DOM ne
                change pas. Mais dans l'arbre React, dedans, elle partait avec
                la carte : à la bonne réponse, la carte suivante arrive (clé
                de l'exercice) dans le même rendu que `outcome` revient à
                `null`, et `AnimatePresence mode="wait"` gèle l'ancienne
                carte, scène comprise, le temps de sa sortie (180 ms), puis la
                retire d'un coup : le « Bravo ! » ne s'effaçait pas, il
                disparaissait, encore opaque, 180 ms après que le grand Pio
                avait commencé à revenir dessous (mesuré dans Chromium et dans
                le WebView Android le 18 octobre 2026). À côté de la carte, sa
                propre `AnimatePresence` joue sa sortie (fondu de 180 ms,
                `answer-feedback.tsx`), et le grand Pio revient 200 ms plus
                tard (voir la rangée de Pio). */}
            {overlay}
          </div>
        </div>
      </div>
    </SceneDockProvider>
  );
}

/* ── Le grand Pio de la question ─────────────────────────────────────────── */

/** Le temps que la carte se pose (ressort 260 / 24) avant de monter le clip. */
const CLIP_AFTER_CARD_MS = 700;

/**
 * COMBIEN DE TEMPS LE CLIP JOUE, puis Pio reste sur son affiche : deux boucles
 * d'`ask` (10 s chacune). Le clip VP9 alpha se décode en logiciel sur Android
 * (`docs/boucle-native-jeu.md`, § 6 : au GPU logiciel, la page au repos
 * passe de 16,7 à 38 ms par image) ; mesuré sur le Mac, il tient le moteur
 * de rendu à 18–21 % d'un cœur contre 9–12 % en pause, et le tier « full »
 * (plus de 2 Go, plus de 3 cœurs) laisse passer un Android d'entrée de gamme
 * à huit cœurs lents. Vingt secondes font vivre Pio pendant que l'enfant
 * découvre la question ; au-delà, l'affiche (première image du clip, à un ou
 * deux pixels près à cette taille) prend le relais, et un enfant qui cherche
 * longtemps ne paie plus le décodage. La bascule tombe à un moment de repos,
 * jamais sous le doigt : sur l'iPhone, démonter la vidéo coûte 80 à 140 ms.
 */
const CLIP_PLAY_MS = 20_000;

/** Les poses de la scène de réponse : leurs affiches sont demandées dès que la première carte est posée. */
const REACTION_POSES: readonly PioState[] = ["cheer", "encourage", "sad"];

/**
 * LE GRAND PIO, et ce qu'il joue. Toujours la pose « ask » : il montre la
 * question ; la pose de l'issue est celle de la scène de réponse, pendant
 * laquelle il s'efface. Le clip seulement si l'appareil est
 * « full », une fois la carte posée (monter un `<video>` HEVC alpha pendant
 * que la carte arrive, c'est l'image qui coûte) et le temps de `CLIP_PLAY_MS`,
 * jamais pendant que la voix de l'énoncé charge ou parle (sur iOS, le son
 * coupe le clip), ni pendant la réaction à la réponse (son « correct », scène
 * de réponse). Le repli est l'affiche légère de la pose (`lite`, 640 px de
 * haut, 47 Ko), première image du clip : la bascule ne se voit pas. `pio.tsx`
 * tient le mouvement réduit.
 *
 * TOUCHABLE quand une voix existe : un bouton « Écouter l'énoncé », relire
 * ou arrêter (`toggleReader`), comme le bouton bleu de la barre d'action ;
 * sans son à jouer (`unavailable`), son nom le dit (`LISTEN_MUTED_LABEL`), un
 * lecteur d'écran n'annonce pas le même bouton qu'avec une voix. Sans voix
 * du tout (les plus grands), c'est une image.
 *
 * EN PAYSAGE, Pio est statique dans sa colonne (plus de calage par `bottom`
 * derrière la carte) ; sa largeur passe par une variable, pour que la classe
 * du paysage puisse la remplacer (un style en ligne gagnerait toujours).
 */
function CoachPio({ reacting, exerciseKey }: { reacting: boolean; exerciseKey: string }) {
  const tier = useDeviceTier();
  const reader = useActivePromptReader();
  const voice = reader?.status === "loading" || reader?.status === "playing";
  const phase = useCardPhase(exerciseKey);
  const settled = phase !== "arrive";
  const clip = tier === "full" && phase === "posee" && !reacting && !voice;

  // Les affiches des poses de la scène de réponse, demandées une fois la
  // carte posée (pas pendant son ressort), une fois par page : au verdict, la
  // scène monte l'affiche « cheer » (ou « encourage », « sad ») sans que le
  // webview ait à la charger à cet instant (`preloadPioPosters`). Le grand
  // Pio, lui, garde « ask » : aucune image à échanger.
  useEffect(() => {
    if (settled) preloadPioPosters(REACTION_POSES, { lite: true });
  }, [settled]);

  const pio = <Pio state="ask" size="var(--stage-pio)" animated={clip} lite priority />;
  // Pio est calé au bas de la rangée (son buste), ses pattes plus bas, derrière la carte.
  const seat: CSSProperties = { bottom: "calc(var(--stage-pio) * (var(--stage-pio-bust) - 1))" };
  const column = "[@media(max-height:480px)]:static";

  return (
    <div
      className="relative h-full w-[var(--coach-w)] shrink-0 [@media(max-height:480px)]:h-auto [@media(max-height:480px)]:w-full"
      style={{ "--coach-w": "calc(var(--stage-pio) * 0.715)" } as CSSProperties}
      data-coach-clip={clip ? "1" : "0"}
      data-coach-phase={phase}
    >
      {reader ? (
        <button
          type="button"
          onClick={() => toggleReader(reader)}
          aria-label={reader.status === "unavailable" ? LISTEN_MUTED_LABEL : LISTEN_LABEL}
          aria-pressed={reader.status === "playing"}
          data-pio-listen
          className={`absolute left-0 block cursor-pointer rounded-[2rem] p-0 gk-focus ${column}`}
          style={seat}
        >
          {pio}
        </button>
      ) : (
        <div className={`absolute left-0 ${column}`} style={seat}>
          {pio}
        </div>
      )}
    </div>
  );
}

type CardPhase = "arrive" | "posee" | "calme";

/**
 * La phase de la carte : elle ARRIVE (`CLIP_AFTER_CARD_MS`), elle est POSÉE
 * (le clip peut jouer, `CLIP_PLAY_MS`), puis le CALME (l'affiche, jusqu'à la
 * carte suivante). Repart à « arrive » dès qu'une autre carte vient.
 *
 * LE CALME ATTEND UN MOMENT DE REPOS : démonter le `<video>` coûte 80 à
 * 140 ms sur l'iPhone (`docs/boucle-native-jeu.md`, § 6), et un minuteur
 * fixe pouvait tomber sous le doigt, au milieu d'un glissé (mise en ordre,
 * glisser-déposer, association). À l'échéance, si un pointeur est enfoncé, la
 * bascule attend le prochain `pointerup` (ou `pointercancel`). L'écoute ne
 * vit que le temps de la phase « posée ».
 */
function useCardPhase(key: string): CardPhase {
  const [state, setState] = useState<{ key: string; phase: CardPhase }>({ key, phase: "arrive" });
  useEffect(() => {
    let pressed = 0;
    let due = false;
    const calmNow = () => setState({ key, phase: "calme" });
    const onDown = () => {
      pressed += 1;
    };
    const onUp = () => {
      pressed = Math.max(0, pressed - 1);
      if (due && pressed === 0) {
        due = false;
        calmNow();
      }
    };
    const settle = setTimeout(() => {
      setState({ key, phase: "posee" });
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("pointercancel", onUp, true);
    }, CLIP_AFTER_CARD_MS);
    const calm = setTimeout(() => {
      if (pressed > 0) due = true;
      else calmNow();
    }, CLIP_AFTER_CARD_MS + CLIP_PLAY_MS);
    return () => {
      clearTimeout(settle);
      clearTimeout(calm);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onUp, true);
    };
  }, [key]);
  return state.key === key ? state.phase : "arrive";
}

/* ── L'en-tête de niveau ─────────────────────────────────────────────────── */

function SessionHud({
  topicName,
  palierIndex,
  questionIndex,
  total,
  missed,
  attemptsLeft,
  stars,
  advanced,
  isVariation,
  sound,
  onQuit,
}: {
  topicName: string;
  palierIndex: number;
  questionIndex: number;
  total: number;
  missed?: readonly number[];
  attemptsLeft: number;
  stars?: number;
  /** La réponse est juste : la pierre passe au vert, le jeton avance déjà. */
  advanced: boolean;
  isVariation: boolean;
  sound?: SessionSound | null;
  onQuit: () => void;
}) {
  return (
    <header
      data-session-hud
      // Décollé quand le clavier recouvre la page (`data-keyboard-up`, iOS et
      // Chrome Android en viewport visuel) ou quand la fenêtre est trop courte
      // (l'application Android redimensionne la fenêtre sous le clavier) : en
      // paysage, collé, il ne laissait rien entre lui et le dock remonté.
      // Collé, il suit le viewport VISUEL (`--vv-top`, `scene-dock.tsx`) : avec
      // un clavier matériel, iOS fait défiler le viewport visuel de la barre
      // d'accessoires (68 px) sans rien redimensionner, et l'en-tête passait
      // sous la barre d'état, Sons et Quitter sous l'heure et la batterie.
      className="sticky top-[calc(env(safe-area-inset-top,0px)+var(--vv-top,0px))] z-20 border-b-2 border-white/80 bg-[#fff7e0] px-4 pb-[8px] pt-[8px] shadow-[0_8px_16px_-12px_rgba(60,30,0,0.5)] [@media(max-height:960px)_and_(min-height:668px)]:pb-[6px] [@media(max-height:960px)_and_(min-height:668px)]:pt-[6px] [@media(max-height:667px)]:pb-[4px] [@media(max-height:667px)]:pt-[4px] [@media(max-height:300px)]:static [[data-keyboard-up]_&]:static"
    >
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 [@media(max-height:480px)]:justify-end">
          {/* Un téléphone en paysage n'a pas 480 px de haut : la ligne du
              titre s'efface, le sentier remonte à gauche des commandes. */}
          <div className="min-w-0 flex-1 [@media(max-height:480px)]:hidden">
            <p className="truncate font-display text-base font-extrabold leading-tight text-amber-950">{topicName}</p>
            <p className="mt-0.5 font-display text-xs font-bold text-amber-900/80">
              Palier {palierIndex} · Question {questionIndex + 1}/{total}
              {isVariation && (
                <span className="ml-2 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold text-sky-800">
                  Variation
                </span>
              )}
            </p>
          </div>
          {/* D22 — le son se coupe d'un toucher. Le bouton n'existe que si
              l'enfant a déjà décidé pour les sons. UNE NOTE DE MUSIQUE, pas un
              haut-parleur : le haut-parleur est le signe d'« Écouter
              l'énoncé » (le bouton bleu du dock, Pio lui-même), et un enfant
              de six ans voyait deux haut-parleurs aux effets opposés (relu
              le 18 octobre 2026). Ici, ce sont les bruitages du jeu qu'on
              coupe : la note, barrée quand ils sont coupés (une barre peinte,
              lucide n'a pas de note barrée). */}
          {sound && (
            <HudButton
              label={sound.enabled ? "Couper les sons du jeu" : "Activer les sons du jeu"}
              pressed={sound.enabled}
              onClick={sound.onToggle}
            >
              <span className="relative block h-[24px] w-[24px]" data-sound={sound.enabled ? "on" : "off"}>
                <Music className="h-[24px] w-[24px]" aria-hidden />
                {!sound.enabled && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-[3px] w-[32px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current shadow-[0_0_0_2px_#fff1cc]"
                  />
                )}
              </span>
            </HudButton>
          )}
          <HudButton label={kidMessages.cta.quit} onClick={onQuit}>
            <X className="h-[24px] w-[24px]" strokeWidth={3} aria-hidden />
          </HudButton>
        </div>
        <ProgressTrack
          className="mt-1.5 [@media(max-height:960px)_and_(min-height:481px)]:mt-1 [@media(max-height:960px)_and_(min-height:481px)]:gap-0.5 [@media(max-height:480px)]:-mt-11 [@media(max-height:480px)]:mr-28 [@media(max-height:480px)]:gap-0.5"
          total={total}
          current={Math.min(total, questionIndex + (advanced ? 1 : 0))}
          missed={missed}
          attemptsLeft={attemptsLeft}
          attemptsMax={MAX_ATTEMPTS_PER_EXERCISE}
          stars={stars}
        />
      </div>
    </header>
  );
}

/**
 * Un bouton rond de l'en-tête : 48 px visibles, posé (flanc crème), et une
 * zone de toucher de 56 px (`after:`) comme le reste du jeu. En PIXELS : le
 * texte agrandi grandit le titre, pas les boutons (à 200 %, deux ronds de
 * 96 px faisaient à eux seuls la hauteur de la ligne du titre).
 */
function HudButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="gk-face-light relative inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-white to-[#fff1cc] text-amber-900 shadow-[0_3px_0_#d6c39a,0_8px_14px_-10px_rgba(60,30,0,0.5)] transition-transform duration-[90ms] ease-out after:absolute after:-inset-1 after:content-[''] active:translate-y-[2px] gk-focus"
    >
      {children}
    </button>
  );
}

/* ── La carte de l'exercice ──────────────────────────────────────────────── */

/**
 * La carte crème posée sur le sable : bordure blanche, flanc `#d6c39a`,
 * ombre sur la table. Elle arrive d'un ressort (`stiffness 260, damping 24`,
 * la grande surface de la DA) et repart vers le haut en 180 ms ; la clé est
 * l'exercice, jamais la réponse : la réaction se joue DANS la carte, sans la
 * remonter. Pas d'`overflow: hidden` : les étoiles de la récompense
 * dépassent, et un solide 3D dedans resterait en relief sur Safari. Ses
 * marges suivent l'écran : 24 px sur une tablette, 20 par défaut, 16 sur un
 * téléphone debout (960 px de haut ou moins, 639 de large ou moins), et sur un
 * écran court ou couché (667 px ou moins) 16 sur les côtés, 12 en haut et en
 * bas : le budget du premier écran (voir `--stage-pio`).
 */
export function ExerciseStageCard({
  cardKey,
  children,
  className = "",
}: {
  cardKey: string;
  children: ReactNode;
  className?: string;
}) {
  // Une couche le temps de l'arrivée et du départ, pas une image de plus : la
  // carte est peinte une fois et glisse, au lieu d'être repeinte à chaque pas
  // du ressort (`use-motion-will-change.ts`, mesuré dans le WebView Android).
  const { willChange, onAnimationStart, onAnimationComplete } = useMotionWillChange();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={cardKey}
        data-exercise-card
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24, scale: 0.98, transition: { duration: 0.18, ease: "easeIn" } }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{ willChange }}
        onAnimationStart={onAnimationStart}
        onAnimationComplete={onAnimationComplete}
        className={`relative rounded-3xl border-2 border-white bg-[#fff8e6] p-5 shadow-[0_6px_0_#d6c39a,0_10px_16px_-10px_rgba(60,30,0,0.5)] sm:p-6 [@media(max-height:960px)_and_(min-height:668px)_and_(max-width:639px)]:p-4 [@media(max-height:667px)]:px-4 [@media(max-height:667px)]:py-3 ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── L'indice ────────────────────────────────────────────────────────────── */

/**
 * L'indice reste dans la carte, sous l'exercice, là où l'enfant vient
 * d'appuyer : un bouton crème posé, puis la note de Pio quand il l'a donné.
 */
function HintSlot({ hint, disabled }: { hint: SessionHint; disabled: boolean }) {
  if (!hint.canAsk && !hint.shown) return null;
  return (
    <div className="mt-4 space-y-3" data-hint-slot>
      {hint.canAsk && (
        <ActionButton3D
          tone="white"
          size="md"
          onClick={hint.onAsk}
          disabled={disabled}
          icon={<Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />}
        >
          Voir un indice
        </ActionButton3D>
      )}
      {hint.shown && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="status"
          className="flex items-start gap-3 rounded-2xl border-2 border-white bg-[linear-gradient(180deg,#fff7e0_0%,#fde68a_100%)] px-4 py-3 shadow-[0_4px_0_#d6c39a]"
        >
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p className="font-display text-base font-bold leading-snug text-amber-950">
            <span className="font-extrabold">Indice {hint.shown.index + 1}&nbsp;:</span> {hint.shown.text}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ── Ce que dit Pio ──────────────────────────────────────────────────────── */

/**
 * Les mots d'attente de Pio pendant que l'enfant cherche. Ils vivent ici, le
 * temps de la refonte menée en parallèle : `lib/pioCopy.ts` n'est pas à cet
 * atelier ; à y ranger ensuite, à côté de `answerRight`.
 */
const COACH_LINES = ["À toi de jouer !", "Regarde bien.", "Prends ton temps.", "Tu peux le faire !"] as const;

/**
 * La phrase de Pio pendant que l'enfant cherche. Pur : la séance factice et
 * les tests la lisent. `seed` tire la phrase sans hasard au rendu (même
 * exercice, même essai, même phrase). Entre deux essais, la phrase compte ce
 * qui reste. La réponse donnée, Pio et sa bulle s'effacent derrière la scène
 * de réponse, qui porte sa pose et son mot (`answer-feedback.tsx`) : rien à
 * dire ici, et la bulle ne change pas sous le fondu.
 */
export function coachLine({
  questionIndex,
  total,
  failedAttempts,
  seed,
}: {
  questionIndex: number;
  total: number;
  failedAttempts: number;
  seed: number;
}): { text: string } {
  if (failedAttempts > 0) {
    const left = Math.max(0, MAX_ATTEMPTS_PER_EXERCISE - failedAttempts);
    return { text: `${pioSays.attemptsLeft(left)}. ${pickLine(pioSays.answerWrongSub, seed)}` };
  }
  // Une espace insécable avant « ! » : dans la bulle étroite que laisse le grand Pio,
  // le point d'exclamation ne doit pas tomber seul sur la deuxième ligne.
  if (questionIndex === 0) return { text: "C'est parti !" };
  if (total > 1 && questionIndex === total - 1) return { text: "Dernière question !" };
  return { text: pickLine(COACH_LINES, questionIndex) };
}

/**
 * Les étoiles qu'une bonne réponse rapporte, avec la grille du serveur
 * (`convex/paliers/scoring.ts` : 10, 7, 4, 1, 1 selon l'essai, moins les
 * indices, puis 3, 2, 1 ou 0 étoiles). La séance en ligne tient ce compte
 * pour l'en-tête ; la séance sur l'appareil le relit dans son journal.
 */
export function starsEarned(failedAttempts: number, hintsUsed: number): number {
  return scoreToStarsSingle(
    computeExerciseScore({ isCorrect: true, correctOnAttempt: failedAttempts + 1, hintsUsedCount: hintsUsed }),
  );
}

/* ── La barre d'état ─────────────────────────────────────────────────────── */

/**
 * En mode focus, `(student)/layout` pose une barre crème sous la barre
 * d'état. Ici, elle couperait le ciel d'un trait. Le temps de cet écran,
 * elle devient transparente : la scène passe dessous. (Partagé avec la fin
 * de palier, `palier-result.tsx`.)
 */
export function useBareStatusBar() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--focus-top-bg", "transparent");
    root.style.setProperty("--focus-top-blur", "none");
    return () => {
      root.style.removeProperty("--focus-top-bg");
      root.style.removeProperty("--focus-top-blur");
    };
  }, []);
}

/**
 * LA BARRE GIVRÉE QUI VIENT AU DÉFILEMENT. Au repos, rien : le ciel monte
 * sous la barre d'état. Dès qu'on fait défiler, la barre crème des autres
 * écrans apparaît en fondu au-dessus de ce qui passe dessous, comme un
 * en-tête iOS qui se replie. Hauteur nulle sur le web. Son opacité est la
 * seule chose qui change ; pas de flou.
 */
export function FrostBar() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [24, 160], [0, 1]);
  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-[#fff7e0]/92"
    />
  );
}
