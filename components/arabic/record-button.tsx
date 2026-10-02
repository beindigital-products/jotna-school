"use client";

/**
 * « À TOI ! » — l'enfant appuie, répète, et le module lui répond.
 *
 * LE PARCOURS D'UNE RÉPÉTITION, en cinq temps :
 *   1. on demande le micro (`getUserMedia`) — la première fois seulement, le
 *      navigateur retient ensuite l'autorisation pour cette origine ;
 *   2. `MediaRecorder` enregistre, au plus `MAX_MS` ;
 *   3. les octets partent dans l'action `verifyPronunciation` ;
 *   4. le serveur transcrit, compare, note, et écrit la tentative ;
 *   5. l'enfant lit un verdict et ce qui a été entendu.
 *
 * LE MICRO SE COUPE TOUJOURS. `stream.getTracks().forEach(stop)` est appelé à
 * l'arrêt, à l'erreur ET au démontage : un onglet qui garde la pastille rouge
 * d'enregistrement après une leçon est un manquement, pas un détail —
 * a fortiori sur le téléphone d'un enfant.
 *
 * LA DURÉE EST BORNÉE À HUIT SECONDES. Personne ne met huit secondes à dire
 * « bâ » ; la borne existe pour le doigt resté appuyé et pour l'enfant qui
 * oublie le bouton. Elle protège aussi la facture (chaque envoi est un appel
 * facturé) et la vie privée : une conversation de classe n'a pas à partir en
 * transcription.
 *
 * RIEN N'EST CONSERVÉ. Le `Blob` vit le temps de l'envoi ; aucune trace n'est
 * écrite ni côté navigateur ni côté serveur (voir `convex/arabic/voice.ts`).
 *
 * SANS INTERNET, PAS DE VERDICT (`docs/hors-ligne.md`). La transcription
 * vit chez ElevenLabs : sans réseau, l'enregistrement ne part nulle part.
 * L'enfant réécoute sa voix (un bouton « Ma voix »), puis celle de Pio, et
 * compare lui-même — l'exercice du laboratoire de langues. Rien n'est noté,
 * et la voix reste en mémoire le temps de l'écran, jamais écrite : la
 * promesse de `convex/arabic/voice.ts` tient sans réseau aussi. L'appelant
 * l'apprend par `onPracticed`, et laisse l'enfant continuer.
 *
 * L'APPELANT DOIT LUI DONNER UNE `key` QUI CHANGE AVEC L'ITEM. Le verdict de
 * la lettre précédente ne doit pas rester affiché sous la suivante, et c'est
 * React qui remet l'état à neuf en remontant le composant — pas un effet qui
 * remettrait les états à zéro après coup, et ferait clignoter l'ancien verdict
 * sous la nouvelle lettre le temps d'un rendu.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Loader2, Mic, Play, Square } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { arabicCopy, verdictMessage } from "@/lib/arabic/copy";
import type { PronunciationVerdict } from "@/convex/arabic/matching";
import { useOffline } from "@/components/offline/context";
import { newVoiceOwner, playUrl } from "@/lib/voice-player";

/** Huit secondes : très au-delà d'une syllabe, très en deçà d'une discussion. */
const MAX_MS = 8000;

/**
 * En dessous de ce niveau de crête (jauge de 0 à 1), l'enregistrement est du
 * SILENCE : on ne l'envoie pas. Le 29 septembre 2026, un simulateur privé de
 * micro envoyait huit secondes de rien, la transcription rendait un texte
 * vide, et l'adulte lisait « parle plus fort » au lieu de « le micro
 * n'entend rien ». Une voix, même lointaine, monte bien au-dessus.
 */
const SILENCE_LEVEL = 0.02;

/** Par ordre de préférence — le premier que le navigateur sait produire gagne. */
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export interface RecordOutcome {
  verdict: PronunciationVerdict;
  score: number;
  heard: string;
  missing: string[];
  /** Le mot sur lequel une récitation a décroché. `null` hors mémorisation. */
  firstMiss: string | null;
}

export type RecordPhase = "idle" | "recording" | "sending" | "done" | "blocked";
type Phase = RecordPhase;

/** L'`AudioContext` du navigateur, préfixé sur les vieux Safari. */
function newAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  try {
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

export function RecordButton({
  lessonKey,
  itemKey,
  drill,
  onOutcome,
  attemptIndex,
  onPhaseChange,
  onPracticed,
  coached = false,
}: {
  lessonKey: string;
  itemKey: string;
  drill: "pronounce" | "read" | "recite";
  onOutcome: (outcome: RecordOutcome) => void;
  /** Sert à choisir la phrase de verdict sans hasard. */
  attemptIndex: number;
  /** Prévient l'appelant à chaque changement de phase (Pio écoute, réfléchit…). */
  onPhaseChange?: (phase: RecordPhase) => void;
  /** Sans internet : l'enfant s'est enregistré et peut se réécouter (pas de verdict). */
  onPracticed?: () => void;
  /**
   * `true` : le verdict d'un essai JUGÉ n'est pas affiché ici, c'est le coach
   * (`pronounce-coach.tsx`) qui le dit, avec son aide. Les messages de
   * blocage (micro refusé, quota, panne) restent affichés ici dans tous les cas.
   */
  coached?: boolean;
}) {
  const verify = useAction(api.arabic.voice.verifyPronunciation);
  const { enabled: offlineAware, connected } = useOffline();
  const offlineMode = offlineAware && !connected;
  // L'enregistrement de l'enfant, sans réseau : en mémoire, le temps de l'écran.
  const [practiceUrl, setPracticeUrl] = useState<string | null>(null);
  const [voiceOwner] = useState(newVoiceOwner);
  useEffect(
    () => () => {
      if (practiceUrl) URL.revokeObjectURL(practiceUrl);
    },
    [practiceUrl],
  );
  // Lus par `recorder.onstop`, qui vit plus longtemps que le rendu qui l'a armé.
  const offlineModeRef = useRef(offlineMode);
  const onPracticedRef = useRef(onPracticed);
  useEffect(() => {
    offlineModeRef.current = offlineMode;
    onPracticedRef.current = onPracticed;
  }, [offlineMode, onPracticed]);
  const [phase, setPhase] = useState<Phase>("idle");
  /** 0..1 : la force de la voix pendant l'enregistrement, pour la jauge. */
  const [level, setLevel] = useState(0);
  const meterRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);
  /** La crête de la jauge sur l'enregistrement en cours, et si la jauge a tourné. */
  const peakRef = useRef(0);
  const meterLiveRef = useRef(false);
  /**
   * Les silences d'affilée. La jauge peut se tromper (un analyseur que la vue
   * web n'alimente pas lit du silence) : au DEUXIÈME silence de suite, on
   * envoie quand même, pour qu'un enfant ne soit jamais bloqué par la jauge.
   */
  const silentStreakRef = useRef(0);
  const phaseChange = useRef(onPhaseChange);
  useEffect(() => {
    phaseChange.current = onPhaseChange;
  }, [onPhaseChange]);
  useEffect(() => {
    phaseChange.current?.(phase);
  }, [phase]);
  const [message, setMessage] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  /**
   * Le mot sur lequel une RÉCITATION a décroché.
   *
   * Affiché, jamais reproché : il ne remplace pas le verdict, il l'explique.
   * Un enfant qui voit « on s'est arrêté ici » sait où reprendre ; un enfant à
   * qui on dit seulement « réessaie » recommence tout depuis le début, et
   * bute au même endroit.
   */
  const [stopped, setStopped] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const stopMeter = useCallback(() => {
    const meter = meterRef.current;
    if (!meter) return;
    cancelAnimationFrame(meter.raf);
    void meter.ctx.close().catch(() => {});
    meterRef.current = null;
    setLevel(0);
  }, []);

  /**
   * La jauge de voix : un analyseur branché sur le même flux que
   * l'enregistreur. L'enfant VOIT que le micro l'entend — sans elle, un
   * enfant qui parle trop bas croit que c'est lui qui s'est trompé.
   * L'`AudioContext` est créé au toucher (voir `start`), sinon iOS le laisse
   * muet ; la jauge absente, l'enregistrement marche quand même.
   */
  const startMeter = useCallback((stream: MediaStream, ctx: AudioContext | null) => {
    if (!ctx) return;
    try {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      void ctx.resume().catch(() => {});
      // Rempli de SILENCE (128), pas de zéros : avant que l'analyseur n'ait
      // reçu du son, un tampon à zéro se lit comme un son maximal, et la
      // crête valait 1 sur des enregistrements muets.
      const data = new Uint8Array(analyser.fftSize).fill(128);
      let last = 0;
      let startedAt = -1;
      const meter = { ctx, raf: 0 };
      const tick = (t: number) => {
        if (startedAt < 0) startedAt = t;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const current = Math.min(1, Math.sqrt(sum / data.length) * 5);
        // La jauge ne compte que si le contexte tourne vraiment (suspendu, il
        // ne lit rien), et après 150 ms : le temps que le son arrive.
        if (ctx.state === "running" && t - startedAt > 150) {
          meterLiveRef.current = true;
          peakRef.current = Math.max(peakRef.current, current);
        }
        if (t - last > 70) {
          setLevel(current);
          last = t;
        }
        meter.raf = requestAnimationFrame(tick);
      };
      meter.raf = requestAnimationFrame(tick);
      meterRef.current = meter;
    } catch {
      void ctx.close().catch(() => {});
    }
  }, []);

  const releaseMic = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    stopMeter();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, [stopMeter]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseMic();
    };
  }, [releaseMic]);

  const send = useCallback(
    async (blob: Blob, mimeType: string, peakLevel?: number) => {
      setPhase("sending");
      try {
        const audio = await blob.arrayBuffer();
        const result = await verify({
          lessonKey,
          itemKey,
          drill,
          audio,
          mimeType,
          peakLevel,
        });
        if (!mountedRef.current) return;

        if (result.status === "judged") {
          setPhase("done");
          if (!coached) {
            setMessage(verdictMessage(result.verdict, attemptIndex));
            setHeard(result.heard || null);
            setStopped(result.verdict === "ok" ? null : result.firstMiss);
          }
          onOutcome({
            verdict: result.verdict,
            score: result.score,
            heard: result.heard,
            missing: result.missing,
            firstMiss: result.firstMiss,
          });
          return;
        }

        setPhase("blocked");
        setMessage(
          result.status === "quota_reached"
            ? arabicCopy.record.quota
            : arabicCopy.record.unavailable,
        );
      } catch {
        if (!mountedRef.current) return;
        setPhase("blocked");
        setMessage(arabicCopy.record.unavailable);
      }
    },
    [attemptIndex, coached, drill, itemKey, lessonKey, onOutcome, verify],
  );

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") recorder.stop();
  }, []);

  const start = useCallback(async () => {
    setMessage(null);
    setHeard(null);
    setPracticeUrl(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setPhase("blocked");
      setMessage(arabicCopy.record.unsupported);
      return;
    }

    const mimeType = MIME_CANDIDATES.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    );
    if (!mimeType) {
      setPhase("blocked");
      setMessage(arabicCopy.record.unsupported);
      return;
    }

    // Créé ICI, encore dans le geste de l'enfant : après l'`await` du micro,
    // iOS refuserait de démarrer le son de la jauge.
    const meterCtx = newAudioContext();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Le son BRUT. La suppression de bruit rogne les consonnes soufflées
        // (ح, ه, خ) que l'enfant doit justement apprendre ; et le traitement
        // de la voix d'iOS est suspect dans le simulateur, où des fichiers
        // valides arrivaient sans aucune voix (29 septembre 2026).
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      void meterCtx?.close().catch(() => {});
      setPhase("blocked");
      setMessage(arabicCopy.record.denied);
      return;
    }

    if (!mountedRef.current) {
      void meterCtx?.close().catch(() => {});
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    startMeter(stream, meterCtx);
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      // Lu AVANT `releaseMic`, qui arrête la jauge.
      const peak = peakRef.current;
      const silent = meterLiveRef.current && peak < SILENCE_LEVEL;
      releaseMic();
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) {
        setPhase("idle");
        return;
      }
      silentStreakRef.current = silent ? silentStreakRef.current + 1 : 0;
      if (silent && silentStreakRef.current < 2) {
        setPhase("blocked");
        setMessage(arabicCopy.record.silent);
        return;
      }
      if (offlineModeRef.current) {
        // Sans réseau : rien ne part, l'enfant se réécoute.
        setPracticeUrl(URL.createObjectURL(blob));
        setPhase("done");
        setMessage(arabicCopy.record.offlinePractice);
        onPracticedRef.current?.();
        return;
      }
      void send(blob, mimeType, meterLiveRef.current ? peak : undefined);
    };

    peakRef.current = 0;
    meterLiveRef.current = false;
    recorder.start();
    setPhase("recording");
    timerRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, MAX_MS);
  }, [releaseMic, send, startMeter]);

  const busy = phase === "sending";
  const showPractice = practiceUrl !== null && phase === "done";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={phase === "recording" ? stop : start}
        disabled={busy}
        className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-lg font-extrabold text-white shadow-lg transition-all disabled:opacity-70 ${
          phase === "recording"
            ? "animate-pulse bg-red-500 shadow-red-200"
            : "bg-orange-500 shadow-orange-200 hover:bg-orange-600"
        }`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : phase === "recording" ? (
          <Square className="h-6 w-6 fill-white" aria-hidden />
        ) : (
          <Mic className="h-6 w-6" aria-hidden />
        )}
        <span>
          {busy
            ? arabicCopy.record.checking[drill]
            : phase === "recording"
              ? arabicCopy.record.recording
              : phase === "done"
                ? arabicCopy.record.again
                : arabicCopy.record.idle}
        </span>
        {phase === "recording" && <VoiceLevel level={level} />}
      </button>

      {showPractice && (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-center">
          <p role="status" className="text-base font-semibold text-sky-900">
            {arabicCopy.record.offlinePractice}
          </p>
          <button
            type="button"
            onClick={() => practiceUrl && void playUrl(practiceUrl, voiceOwner, 1)}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-sky-300 bg-white px-4 py-2 font-bold text-sky-800"
          >
            <Play className="h-5 w-5" aria-hidden />
            {arabicCopy.record.playMine}
          </button>
        </div>
      )}

      {message && !showPractice && (phase === "blocked" || !coached) && (
        <p
          role="status"
          className="rounded-2xl bg-white px-4 py-3 text-center text-base font-semibold text-gray-800 shadow-sm"
        >
          {message}
          {stopped && (
            <span className="mt-1 block text-sm font-medium text-gray-500">
              {arabicCopy.memorize.stoppedAt}{" "}
              <span dir="rtl" lang="ar" className="font-arabic text-lg">
                {stopped}
              </span>
            </span>
          )}
          {heard && (
            <span className="mt-1 block text-sm font-medium text-gray-500">
              {arabicCopy.heardPrefix}{" "}
              <span dir="auto" className="font-arabic text-lg">
                {heard}
              </span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/** Cinq barres qui montent avec la voix — « le micro t'entend ». */
function VoiceLevel({ level }: { level: number }) {
  const shape = [0.55, 0.85, 1, 0.8, 0.6];
  return (
    <span aria-hidden className="flex h-7 items-end gap-1">
      {shape.map((k, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-white transition-[height] duration-75"
          style={{ height: `${Math.round(18 + Math.min(1, level * k) * 82)}%` }}
        />
      ))}
    </span>
  );
}
