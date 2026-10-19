"use client";

/**
 * LE LECTEUR DE CONSIGNES — Pio lit la consigne de l'exercice à voix haute.
 *
 * POUR LES CLASSES OÙ L'ON APPREND À LIRE (CI, CP : `isReadingLearnerClass`,
 * `convex/curriculum.ts`). Un enfant de six ans ne lit pas encore « Fais
 * correspondre les mots avec leur son » : il l'entend. La séance entoure
 * l'exercice de `PromptReaderProvider` ; la barre d'action de l'exercice
 * (`ExerciseActions`, `game-parts.tsx`) y trouve le lecteur et pose le gros
 * bouton bleu « Écouter » juste au-dessus de « Valider », et la coque de la
 * séance (`session-stage.tsx`) fait de Pio lui-même un bouton qui relit
 * l'énoncé. Hors de ces classes, pas de fournisseur : la consigne s'affiche
 * sans bouton, et l'énoncé prend toute la largeur de la carte dans tous les cas.
 *
 * QUAND L'EXERCICE APPARAÎT, LA CONSIGNE SE DIT TOUTE SEULE ; le bouton la
 * redit autant de fois que l'enfant veut, et l'arrête d'un toucher pendant
 * qu'elle joue (`stop`). Elle se tait dès que l'enfant a répondu
 * (`silenced`), et quand l'exercice s'en va.
 *
 * LA VOIX EST CELLE DE PIO, ET ELLE EST DANS LE TÉLÉPHONE. L'application
 * télécharge à l'avance la consigne de chaque exercice de la classe
 * (`lib/offline/sync.ts`) : elle se dit sans réseau. Un son qui manque se
 * demande au serveur quand il est joignable (`components/offline/clip-source.ts`),
 * qui ne reçoit qu'une référence et lit lui-même le texte dans l'exercice. La
 * lecture automatique marche dans l'application (la vue web de Capacitor joue
 * un son sans geste préalable, voir `components/arabic/coach.tsx`). Sur le web
 * d'un téléphone, Safari et Chrome l'exigent : `lib/voice-player.ts` débloque
 * son élément audio au premier toucher de la page.
 *
 * IL IGNORE LE RÉGLAGE « SONS », comme `components/arabic/listen-button.tsx` :
 * ce réglage coupe les bruitages de récompense ; ici, la voix EST la
 * consigne.
 *
 * IL NE LÈVE JAMAIS. Sans clé, ou sans réseau pour un son jamais téléchargé,
 * le bouton passe en « muet » et l'exercice reste jouable ; un toucher réessaie.
 *
 * LE LECTEUR ACTIF EST AUSSI PUBLIÉ HORS DE L'ARBRE (`useActivePromptReader`) :
 * la coque de la séance est le PARENT du fournisseur (la carte porte la clé de
 * l'exercice, le lecteur naît et meurt avec elle) et ne peut pas lire son
 * contexte. Un petit magasin partagé, lu par `useSyncExternalStore`, lui dit
 * s'il y a une voix à relire et si elle parle en ce moment : Pio devient
 * touchable, et montre son affiche pendant la lecture (sur iOS, un son coupe
 * le clip muet de Pio). Les séances n'ont rien à brancher.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useClipSource } from "@/components/offline/clip-source";
import { newVoiceOwner, playUrl, stopPlaying } from "@/lib/voice-player";

type ReaderStatus = "idle" | "loading" | "playing" | "unavailable";

export type PromptReader = {
  status: ReaderStatus;
  /** Dit la consigne depuis le début, en coupant ce qui joue. */
  read: () => void;
  /** Coupe la lecture en cours (ou celle qui attendait son son) et se repose. */
  stop: () => void;
};

const PromptReaderContext = createContext<PromptReader | null>(null);

/** Le lecteur de l'exercice affiché, ou `null` si la consigne ne se lit pas. */
export function usePromptReader(): PromptReader | null {
  return useContext(PromptReaderContext);
}

/* ── Le lecteur actif, vu de dehors ──────────────────────────────────────── */

let activeReader: PromptReader | null = null;
const activeListeners = new Set<() => void>();

function publishReader(reader: PromptReader | null) {
  activeReader = reader;
  for (const listener of activeListeners) listener();
}

function subscribeReader(listener: () => void) {
  activeListeners.add(listener);
  return () => {
    activeListeners.delete(listener);
  };
}

const readActive = () => activeReader;
const readActiveOnServer = () => null;

/**
 * Le lecteur de l'exercice affiché, pour un composant qui n'est PAS sous le
 * fournisseur (la coque de la séance). `null` quand aucune consigne ne se lit.
 */
export function useActivePromptReader(): PromptReader | null {
  return useSyncExternalStore(subscribeReader, readActive, readActiveOnServer);
}

/**
 * L'URL de chaque consigne, obtenue ou en cours, pour la durée de la page.
 * Garder la PROMESSE évite deux appels quand l'écran demande deux fois de
 * suite ; un échec ne se garde pas, pour que le toucher suivant réessaie.
 */
const urlByExercise = new Map<string, Promise<string | null>>();

export function PromptReaderProvider({
  exerciseId,
  silenced = false,
  clipUrl,
  children,
}: {
  exerciseId: string;
  /** Vrai quand la consigne doit se taire : l'enfant a répondu, une fenêtre est ouverte. */
  silenced?: boolean;
  /**
   * POUR LES PAGES DE DÉVELOPPEMENT SEULEMENT : l'adresse d'un son à jouer à la
   * place de la consigne, sans serveur ni clé (`/dev/seance/?voix=1`). Les
   * spécimens de la galerie n'ont pas d'identifiant Convex : sans elle, le
   * lecteur y est toujours « muet », et le comportement de Pio pendant la voix
   * (l'affiche à la place du clip, sur iOS) ne se vérifie pas. La séance ne la
   * passe jamais.
   */
  clipUrl?: string;
  children: ReactNode;
}) {
  const findClip = useClipSource();
  const [status, setStatus] = useState<ReaderStatus>("idle");
  // L'identifiant de CE lecteur : c'est lui qui dit à qui appartient le son.
  const [owner] = useState(newVoiceOwner);
  const tokenRef = useRef(0);

  const urlFor = useCallback((): Promise<string | null> => {
    if (clipUrl) return Promise.resolve(clipUrl);
    const cached = urlByExercise.get(exerciseId);
    if (cached) return cached;
    const pending = findClip({ kind: "prompt", exerciseId: exerciseId as Id<"exercises"> })
      .then((url) => (url && url !== "not_configured" ? url : null))
      .catch(() => null);
    urlByExercise.set(exerciseId, pending);
    void pending.then((url) => {
      if (!url) urlByExercise.delete(exerciseId);
    });
    return pending;
  }, [exerciseId, findClip, clipUrl]);

  // Le silence demandé, lu par une lecture qui attendait son URL.
  const silencedRef = useRef(silenced);
  // Vrai quand la lecture automatique n'a plus rien à faire : la consigne est
  // partie, ou l'exercice s'affiche sous une fenêtre et se tait.
  const autoDone = useRef(silenced);

  const read = useCallback(async () => {
    const token = ++tokenRef.current;
    stopPlaying();
    setStatus("loading");
    const url = await urlFor();
    if (tokenRef.current !== token) return;
    if (!url) {
      setStatus("unavailable");
      return;
    }
    if (silencedRef.current) {
      setStatus("idle");
      return;
    }
    setStatus("playing");
    // La consigne est partie : la lecture automatique a fait son travail.
    autoDone.current = true;
    // Rend la main quand le son finit OU qu'on le coupe (`stopPlaying`).
    await playUrl(url, owner, 1);
    if (tokenRef.current === token) setStatus("idle");
  }, [owner, urlFor]);

  // Un toucher pendant la lecture l'arrête : le jeton change, pour qu'une
  // lecture qui attendait encore son son ne parte pas après coup.
  const stop = useCallback(() => {
    tokenRef.current++;
    stopPlaying(owner);
    setStatus("idle");
  }, [owner]);

  // UNE FOIS PAR EXERCICE : la carte de l'exercice porte sa clé, donc ce
  // lecteur naît avec lui et meurt avec lui. Un exercice qui s'affiche alors
  // que la séance se tait (une reprise sous une fenêtre) ne parle pas.
  //
  // `read` change quand la source des sons change (`useClipSource` dépend de
  // `connected`, qui bascule dans l'application quand la connexion temps réel
  // s'ouvre ou se rétablit). Deux cas :
  //   - la consigne n'est pas encore partie (le son manquait, faute de
  //     réseau) : on réessaie, c'est le but ;
  //   - la consigne PARLE déjà : `autoDone` l'empêche de repartir. Sans lui,
  //     chaque bascule coupait la voix en pleine phrase et la reprenait du début.
  useEffect(() => {
    if (!autoDone.current) void read();
  }, [read]);

  // En partant, le lecteur coupe SON son : seulement à la disparition de
  // l'exercice, jamais à un changement de `read`.
  useEffect(() => {
    const tokens = tokenRef;
    return () => {
      tokens.current++;
      stopPlaying(owner);
    };
  }, [owner]);

  // SE TAIRE, C'EST COUPER LE SON — rien d'autre. La lecture en cours s'en
  // aperçoit (`playUrl` rend la main, ou `silencedRef` après le chargement)
  // et remet elle-même le bouton au repos.
  useEffect(() => {
    silencedRef.current = silenced;
    if (silenced) {
      autoDone.current = true;
      stopPlaying(owner);
    }
  }, [silenced, owner]);

  const value = useMemo<PromptReader>(
    () => ({ status, read: () => void read(), stop }),
    [status, read, stop],
  );

  // Publié avant la peinture (`useLayoutEffect`) : la coque sait dès la
  // première image qu'une voix existe. En partant, on ne retire que soi.
  useLayoutEffect(() => {
    publishReader(value);
    return () => {
      if (activeReader === value) publishReader(null);
    };
  }, [value]);

  return (
    <PromptReaderContext.Provider value={value}>{children}</PromptReaderContext.Provider>
  );
}

/** Ce que fait un toucher sur « Écouter » ou sur Pio : relire, ou arrêter si la voix parle. */
export function toggleReader(reader: PromptReader) {
  if (reader.status === "playing") reader.stop();
  else reader.read();
}
