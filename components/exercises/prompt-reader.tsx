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
 * UN SON TROUVÉ MAIS QUI NE SE JOUE PAS NE RESTE PAS EN CACHE. L'adresse d'une
 * consigne est gardée pour la page ; si elle est morte (fichier du téléphone
 * abîmé, lien périmé, son qui ne démarre jamais : `playUrl` le dit par
 * `onFail`), chaque toucher sur « Écouter » rejouait le même silence, et la
 * consigne restait muette pour tout l'exercice. Le lecteur oublie alors cette
 * adresse, redemande un son neuf au serveur (`fresh`, qui saute le sac du
 * téléphone et le répare) et rejoue UNE fois, tout seul. Si cela échoue encore,
 * le bouton passe en « muet » : il le dit, et un toucher réessaie.
 *
 * LA VOIX DES TUILES (CI ET CP, ANGLAIS COMPRIS, `convex/voice/tiles.ts`). Une consigne
 * entendue ne sert à rien si les réponses restent écrites : « le chat », « la
 * girafe » sont des tuiles que l'enfant de six ans regarde sans les lire. Avec
 * `tileVoice`, le lecteur dit donc AUSSI les propositions :
 *   - APRÈS la consigne, une à une, dans l'ordre de l'écran ; la tuile qui parle
 *     s'allume (`speaking`, un anneau ciel autour d'elle : `Tile3D`), pour que
 *     l'enfant relie ce qu'il entend à ce qu'il voit ;
 *   - QUAND L'ENFANT TOUCHE UNE TUILE, Pio la dit (`hearTile`), qu'il la choisisse,
 *     la rechoisisse ou la saisisse pour la ranger : entendre ce qu'on tient est le
 *     seul moyen de savoir ce qu'on a choisi ; un second toucher sur la même
 *     tuile la redit ;
 *   - « Écouter » (et Pio) redit TOUT, consigne puis propositions ; sur un mot
 *     dit au toucher, il relit tout au lieu d'arrêter un son d'une seconde.
 * Les écrans rangent leurs tuiles avec `useTileVoice` (l'ordre est celui de
 * l'écran) ; le lecteur ne sait rien d'un QCM ou d'une association. Un toucher
 * coupe la file en cours : l'enfant n'attend jamais la fin de la lecture pour
 * répondre.
 *
 * QUAND L'EXERCICE A UN CLIP DE SCÈNE (`SceneClip`, civique du CI), la file lui
 * laisse la parole entre la consigne et les propositions (`turn: "media"`,
 * `registerMedia`) : l'enfant voit la situation que Pio vient de dire, puis
 * entend ses choix. Une fois : « Écouter » ne rejoue pas le clip.
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
import { completesAWord, promptForbidsTileVoice, speakableTile } from "@/convex/voice/tiles";
import { newVoiceOwner, playUrl, stopPlaying } from "@/lib/voice-player";
import { staticTileFailed, staticTileUrl } from "@/lib/voice-static";

type ReaderStatus = "idle" | "loading" | "playing" | "unavailable";

/** Le rang qui désigne la phrase à trous (et non une tuile) dans `speaking` et `hearTile`. */
export const SENTENCE_INDEX = -1;

/** Le silence entre la consigne et la première proposition, puis entre deux propositions. */
const AFTER_PROMPT_MS = 450;
const BETWEEN_TILES_MS = 300;
/** Le plus long qu'on attende le clip d'une scène (cinq secondes, plus son chargement) avant les propositions. */
const MEDIA_WAIT_MS = 9000;

/**
 * Un média qui joue EN SILENCE entre la consigne et les propositions : le clip
 * d'une scène (`SceneClip`). Il se range dans le lecteur pour que la file l'attende.
 */
export type ReaderMedia = {
  /** Vrai tant que le média n'a pas fini sa première lecture (fini, cassé ou refusé). */
  pending: () => boolean;
  /** Rend la main quand il a fini sa première lecture. */
  wait: () => Promise<void>;
};

/**
 * Ce qu'un écran range dans le lecteur : ses tuiles, dans l'ordre de l'écran, sa
 * phrase à trous, et si la file les dit toute seule après la consigne (`autoRead`).
 */
export type ReaderTiles = { tiles: readonly string[]; sentence: string | null; autoRead: boolean };

export type PromptReader = {
  status: ReaderStatus;
  /** Dit la consigne depuis le début (puis les propositions), en coupant ce qui joue. */
  read: () => void;
  /** Coupe la lecture en cours (ou celle qui attendait son son) et se repose. */
  stop: () => void;
  /** Vrai quand les propositions se disent aussi (CI et CP). Absent : non. */
  tileVoice?: boolean;
  /**
   * Vrai dans une thématique d'anglais : les propositions se disent dans leur langue
   * (le serveur choisit la voix), et un énoncé de traduction ne les interdit plus.
   */
  englishTopic?: boolean;
  /** Le rang de la tuile (ou `SENTENCE_INDEX`) que Pio dit maintenant, ou `null`. */
  speaking?: number | null;
  /** Vrai pendant la consigne seule : le halo derrière l'énoncé ne brille pas pour une proposition. */
  promptPlaying?: boolean;
  /** Vrai quand une tuile se dit parce que l'enfant l'a touchée (et non dans la file). */
  playingTile?: boolean;
  /** Dit la tuile de ce rang, en coupant ce qui joue. */
  hearTile?: (index: number) => void;
  /** Range les tuiles de l'écran (`useTileVoice`) ; `null` quand elles partent. */
  registerTiles?: (tiles: ReaderTiles | null) => void;
  /**
   * `"media"` pendant que la file laisse la parole au clip de la scène, entre la
   * consigne et les propositions : le lecteur est « en train de lire », mais aucun
   * son ne part, le clip peut jouer (`SceneClip`).
   */
  turn?: "media" | null;
  /** Range le média que la file attend entre la consigne et les propositions ; `null` quand il part. */
  registerMedia?: (media: ReaderMedia | null) => void;
};

const PromptReaderContext = createContext<PromptReader | null>(null);

/** Le lecteur de l'exercice affiché, ou `null` si la consigne ne se lit pas. */
export function usePromptReader(): PromptReader | null {
  return useContext(PromptReaderContext);
}

export type TileVoice = {
  /** Le rang (dans les tuiles données, ou `SENTENCE_INDEX`) que Pio dit maintenant, ou `null`. */
  speaking: number | null;
  /** Dit la tuile de ce rang : le toucher de l'enfant. */
  hear: (index: number) => void;
};

/**
 * LES TUILES D'UN ÉCRAN, RANGÉES DANS LE LECTEUR. Rend `null` quand rien ne doit
 * se dire : pas de lecteur, voix des tuiles éteinte (autre classe, anglais),
 * ou un énoncé qui demande de lire, de décoder ou de traduire
 * (`promptForbidsTileVoice` : la tuile dite serait la réponse). L'écran garde alors
 * son comportement d'avant, au caractère près.
 *
 * `tiles` est dans l'ordre de l'écran. Options :
 *   - `sentence` : la phrase à trous d'une phrase à compléter ;
 *   - `autoRead` : la file dit les tuiles (et la phrase) toute seule après la
 *     consigne. Tous les écrans le demandent depuis le 26 octobre 2026 : la
 *     lecture de l'énoncé prend en compte les propositions, à chaque exercice.
 *     Un enfant qui n'attend pas touche une tuile ou répond : un toucher coupe la file.
 * À appeler AVANT tout retour anticipé (l'ordre des hooks).
 */
export function useTileVoice(
  tiles: readonly string[],
  prompt: string,
  options: { sentence?: string | null; autoRead?: boolean } = {},
): TileVoice | null {
  const reader = usePromptReader();
  // Éteinte aussi quand la phrase à trous fait compléter un mot (« ba___ne ») : les tuiles
  // sont des lettres ou des syllabes, les dire serait déchiffrer à la place de l'enfant.
  const enabled =
    reader?.tileVoice === true &&
    !promptForbidsTileVoice(prompt, reader.englishTopic === true) &&
    !completesAWord(options.sentence);
  const register = reader?.registerTiles;
  // La clé est le contenu : les écrans passent un tableau neuf à chaque rendu.
  const key = JSON.stringify([tiles, options.sentence ?? null, options.autoRead === true]);
  // Avant la peinture, et avant l'effet du fournisseur qui lance la lecture :
  // la file connaît les tuiles dès la première consigne.
  useLayoutEffect(() => {
    if (!enabled || !register) return;
    const [list, text, autoRead] = JSON.parse(key) as [string[], string | null, boolean];
    register({ tiles: list, sentence: text, autoRead });
    return () => register(null);
  }, [enabled, register, key]);
  if (!enabled || !reader) return null;
  return {
    speaking: reader.speaking ?? null,
    hear: (index) => reader.hearTile?.(index),
  };
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

/**
 * L'URL de chaque tuile, PAR SON TEXTE : « le chat » est le même son dans vingt
 * exercices (le serveur le range une fois, l'appareil aussi). Même règle que
 * `urlByExercise` : on garde la promesse, un échec ne se garde pas.
 */
const urlByTile = new Map<string, Promise<string | null>>();

/** Une pause qui se lit comme un silence entre deux sons. */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PromptReaderProvider({
  exerciseId,
  silenced = false,
  clipUrl,
  tileVoice = false,
  englishTopic = false,
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
   * passe jamais. Les tuiles jouent le même son : la file et l'anneau se voient.
   */
  clipUrl?: string;
  /**
   * Les propositions se disent aussi (`isTileVoiceClass`, `convex/voice/tiles.ts` :
   * le CI et le CP, anglais compris). Faux : le lecteur ne dit que la consigne, comme avant.
   */
  tileVoice?: boolean;
  /** La thématique est d'anglais : voir `PromptReader.englishTopic`. */
  englishTopic?: boolean;
  children: ReactNode;
}) {
  const findClip = useClipSource();
  const [status, setStatus] = useState<ReaderStatus>("idle");
  // La tuile qui parle (son rang), la consigne qui parle, un mot dit au toucher.
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [promptPlaying, setPromptPlaying] = useState(false);
  const [playingTile, setPlayingTile] = useState(false);
  // Le tour du clip de la scène, entre la consigne et les propositions.
  const [turn, setTurn] = useState<"media" | null>(null);
  // L'identifiant de CE lecteur : c'est lui qui dit à qui appartient le son.
  const [owner] = useState(newVoiceOwner);
  const tokenRef = useRef(0);
  // Les tuiles de l'écran, rangées par `useTileVoice`.
  const tilesRef = useRef<ReaderTiles | null>(null);

  const urlFor = useCallback(
    (fresh = false): Promise<string | null> => {
      if (clipUrl) return Promise.resolve(clipUrl);
      if (fresh) urlByExercise.delete(exerciseId);
      const cached = urlByExercise.get(exerciseId);
      if (cached) return cached;
      const request = { kind: "prompt", exerciseId: exerciseId as Id<"exercises"> } as const;
      const pending = (fresh ? findClip(request, { fresh }) : findClip(request))
        .then((url) => (url && url !== "not_configured" ? url : null))
        .catch(() => null);
      urlByExercise.set(exerciseId, pending);
      void pending.then((url) => {
        if (!url && urlByExercise.get(exerciseId) === pending) urlByExercise.delete(exerciseId);
      });
      return pending;
    },
    [exerciseId, findClip, clipUrl],
  );

  const urlForTile = useCallback(
    (text: string, fresh = false): Promise<string | null> => {
      if (clipUrl) return Promise.resolve(clipUrl);
      // Un son embarqué dans l'application passe avant le serveur (`lib/voice-static`) : pas de réseau, pas de crédit.
      // `fresh` dit que le dernier essai a échoué : le serveur reprend.
      if (!fresh) {
        const embedded = staticTileUrl(text, englishTopic);
        if (embedded) return Promise.resolve(embedded);
      }
      if (fresh) urlByTile.delete(text);
      const cached = urlByTile.get(text);
      if (cached) return cached;
      const request = { kind: "tile", exerciseId: exerciseId as Id<"exercises">, text } as const;
      const pending = (fresh ? findClip(request, { fresh }) : findClip(request))
        .then((url) => (url && url !== "not_configured" ? url : null))
        .catch(() => null);
      urlByTile.set(text, pending);
      void pending.then((url) => {
        if (!url && urlByTile.get(text) === pending) urlByTile.delete(text);
      });
      return pending;
    },
    [exerciseId, findClip, clipUrl, englishTopic],
  );

  const registerTiles = useCallback((next: ReaderTiles | null) => {
    tilesRef.current = next;
  }, []);

  // Le média (le clip d'une scène) que la file attend entre la consigne et les propositions.
  const mediaRef = useRef<ReaderMedia | null>(null);
  const registerMedia = useCallback((next: ReaderMedia | null) => {
    mediaRef.current = next;
  }, []);

  // Le silence demandé, lu par une lecture qui attendait son URL.
  const silencedRef = useRef(silenced);
  // Vrai quand la lecture automatique n'a plus rien à faire : la consigne est
  // partie, ou l'exercice s'affiche sous une fenêtre et se tait.
  const autoDone = useRef(silenced);

  /** Tout remettre au repos, pour la lecture qui tient encore le jeton. */
  const rest = useCallback(() => {
    setSpeaking(null);
    setPromptPlaying(false);
    setPlayingTile(false);
    setTurn(null);
    setStatus("idle");
  }, []);

  /** Tout au repos, et le bouton dit que le son manque : un toucher réessaie. */
  const muted = useCallback(() => {
    setSpeaking(null);
    setPromptPlaying(false);
    setPlayingTile(false);
    setTurn(null);
    setStatus("unavailable");
  }, []);

  const read = useCallback(async () => {
    const token = ++tokenRef.current;
    stopPlaying();
    setSpeaking(null);
    setPromptPlaying(false);
    setPlayingTile(false);
    setTurn(null);
    setStatus("loading");
    const pending = urlFor();
    // Les propositions se préparent pendant que la consigne se charge : sans
    // cela, chaque mot attendrait son tour sur le réseau, après la consigne.
    const queue: { index: number; text: string }[] = [];
    const registered = tileVoice ? tilesRef.current : null;
    if (registered?.autoRead) {
      // Une tuile sans rien à dire (que des émojis, une lettre seule) n'entre pas
      // dans la file : le serveur la refuserait (`speakableTile`).
      if (registered.sentence && speakableTile(registered.sentence, englishTopic ? "en" : "fr", englishTopic)) {
        queue.push({ index: SENTENCE_INDEX, text: registered.sentence });
      }
      registered.tiles.forEach((text, index) => {
        if (speakableTile(text, englishTopic ? "en" : "fr", englishTopic)) queue.push({ index, text });
      });
      for (const item of queue) void urlForTile(item.text);
    }
    const url = await pending;
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
    setPromptPlaying(true);
    // Rend la main quand le son finit OU qu'on le coupe (`stopPlaying`).
    let failed = false;
    let spoken = await playUrl(url, owner, 1, () => {
      failed = true;
    });
    if (tokenRef.current !== token) return;
    if (!spoken && failed && !silencedRef.current) {
      // Le son trouvé ne se joue pas : on oublie son adresse, on en demande un
      // neuf, et on rejoue une fois.
      setPromptPlaying(false);
      setStatus("loading");
      const fresh = await urlFor(true);
      if (tokenRef.current !== token) return;
      if (!fresh || silencedRef.current) {
        if (fresh) rest();
        else muted();
        return;
      }
      setStatus("playing");
      setPromptPlaying(true);
      failed = false;
      spoken = await playUrl(fresh, owner, 1, () => {
        failed = true;
      });
      if (tokenRef.current !== token) return;
    }
    setPromptPlaying(false);
    // Coupée (le silence, ou une autre voix qui prend la place) : la file ne
    // reprend pas la parole par-dessus. Un son qui ne se joue pas deux fois de
    // suite, lui, se dit : le bouton passe en « muet ».
    if (!spoken) {
      if (failed) muted();
      else rest();
      return;
    }

    // LE CLIP DE LA SCÈNE JOUE ICI, entre la consigne et les propositions : l'enfant
    // voit la situation que la voix vient de dire, puis entend ses choix. Sans cette
    // attente, le clip (qui ne part jamais pendant une voix : sur iOS un son coupe
    // une vidéo muette) ne partirait qu'APRÈS les propositions, quand l'enfant a déjà
    // choisi. Une première fois seulement : il ne se rejoue pas à chaque « Écouter ».
    // Neuf secondes au plus, pour qu'un clip qui n'arrive pas ne taise pas la voix.
    const media = queue.length > 0 ? mediaRef.current : null;
    if (media?.pending()) {
      setTurn("media");
      await Promise.race([media.wait(), pause(MEDIA_WAIT_MS)]);
      if (tokenRef.current !== token) return;
      setTurn(null);
      if (silencedRef.current) {
        rest();
        return;
      }
    }

    // Les propositions, une à une. Une tuile sans son (que des émojis, ou un son
    // qui manque) est passée en silence : la file ne bloque jamais sur elle.
    for (const [position, item] of queue.entries()) {
      if (silencedRef.current) break;
      await pause(position === 0 ? AFTER_PROMPT_MS : BETWEEN_TILES_MS);
      if (tokenRef.current !== token) return;
      const tileUrl = await urlForTile(item.text);
      if (tokenRef.current !== token) return;
      if (silencedRef.current) break;
      if (!tileUrl) continue;
      setSpeaking(item.index);
      let tileFailed = false;
      const finished = await playUrl(tileUrl, owner, 1, () => {
        tileFailed = true;
      });
      if (tokenRef.current !== token) return;
      setSpeaking(null);
      // Un son de tuile mort est oublié (le toucher suivant en redemande un) et
      // la file passe à la suivante ; seule une coupure l'arrête.
      if (tileFailed) {
        urlByTile.delete(item.text);
        staticTileFailed(item.text, englishTopic);
        continue;
      }
      if (!finished) break;
    }
    rest();
  }, [owner, urlFor, urlForTile, tileVoice, englishTopic, rest, muted]);

  // L'enfant touche une tuile : Pio la dit, et coupe ce qui jouait (la consigne,
  // la file). Le rang s'allume tout de suite : le toucher est pris, même si le
  // son met un instant. Un son qui manque laisse la tuile au repos, sans bruit.
  const hearTile = useCallback(
    (index: number) => {
      if (!tileVoice) return;
      const registered = tilesRef.current;
      const text = index === SENTENCE_INDEX ? registered?.sentence : registered?.tiles[index];
      // Rien à dire (que des émojis, une lettre seule) : le toucher ne coupe rien et ne s'allume pas.
      if (typeof text !== "string" || !speakableTile(text, englishTopic ? "en" : "fr", englishTopic)) return;
      const token = ++tokenRef.current;
      stopPlaying();
      // Un toucher vaut mieux que la lecture automatique : elle n'a plus à repartir.
      autoDone.current = true;
      setPromptPlaying(false);
      setTurn(null);
      setSpeaking(index);
      setPlayingTile(true);
      void (async () => {
        const url = await urlForTile(text);
        if (tokenRef.current !== token) return;
        if (!url || silencedRef.current) {
          rest();
          return;
        }
        setStatus("playing");
        let failed = false;
        await playUrl(url, owner, 1, () => {
          failed = true;
        });
        // Le son de la tuile est mort : on l'oublie, le toucher suivant en redemande un.
        if (failed) {
          urlByTile.delete(text);
          staticTileFailed(text, englishTopic);
        }
        if (tokenRef.current === token) rest();
      })();
    },
    [owner, tileVoice, englishTopic, urlForTile, rest],
  );

  // Un toucher pendant la lecture l'arrête : le jeton change, pour qu'une
  // lecture qui attendait encore son son ne parte pas après coup.
  const stop = useCallback(() => {
    tokenRef.current++;
    stopPlaying(owner);
    rest();
  }, [owner, rest]);

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
    () => ({
      status,
      read: () => void read(),
      stop,
      tileVoice,
      englishTopic,
      speaking,
      promptPlaying,
      playingTile,
      hearTile,
      registerTiles,
      turn,
      registerMedia,
    }),
    [status, read, stop, tileVoice, englishTopic, speaking, promptPlaying, playingTile, hearTile, registerTiles, turn, registerMedia],
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

/**
 * Ce que fait un toucher sur « Écouter » ou sur Pio : relire, ou arrêter si la
 * voix parle. Un mot dit parce que l'enfant a touché une tuile dure une seconde :
 * « Écouter » relit alors tout, il ne coupe pas ce mot (l'enfant qui touche le
 * bouton veut entendre, pas se taire).
 */
export function toggleReader(reader: PromptReader) {
  if (reader.status === "playing" && !reader.playingTile) reader.stop();
  else reader.read();
}
