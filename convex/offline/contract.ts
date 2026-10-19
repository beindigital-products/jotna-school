/**
 * LE CONTRAT DU HORS-LIGNE — ce que l'application envoie au serveur quand le
 * réseau revient, et la forme du paquet qu'elle télécharge.
 *
 * L'application joue d'abord sur l'appareil (`lib/offline/`) : elle range ce
 * que l'enfant fait dans un journal, et la synchronisation
 * (`offline/sync.ts`) le rejoue ici, une entrée à la fois. Ce module décrit
 * ces entrées une seule fois, pour les deux côtés : les validateurs pour le
 * serveur, les types pour l'écran. Le mode d'emploi : `docs/hors-ligne.md`.
 *
 * Module pur : `convex/values` seulement, que le paquet de l'écran embarque
 * déjà.
 */
import { v, type Infer } from "convex/values";

/**
 * La version du contrat. Une application plus ancienne que le serveur reste
 * servie tant que ce nombre ne bouge pas ; il bouge quand une entrée change de
 * forme, et le serveur garde alors la lecture de l'ancienne.
 */
export const OFFLINE_PROTOCOL = 1;

/**
 * Au-delà, une entrée du journal est trop vieille pour être rejouée : la
 * session de connexion de l'enfant aurait expiré bien avant (trente jours),
 * et une date aussi lointaine trahit plutôt une horloge de téléphone fausse.
 */
export const MAX_EVENT_AGE_MS = 120 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// UNE SÉANCE DE PALIER JOUÉE SUR L'APPAREIL
//
// La séance est UNE entrée du journal, qui grandit pendant qu'elle se joue :
// chaque réponse et chaque indice s'ajoutent à `log`, dans l'ordre. Le
// serveur l'applique en n'écrivant que la fin qu'il n'a pas encore
// (`offline/sync.ts`), donc l'envoyer dix fois ne l'écrit qu'une fois.
// `finishedAt` dit que l'enfant a fini le palier : le serveur le note alors.
// ---------------------------------------------------------------------------

export const sessionLogEntryValidator = v.union(
  v.object({
    kind: v.literal("answer"),
    exerciseId: v.id("exercises"),
    answer: v.string(),
    /**
     * Le verdict de l'appareil. Le serveur rejuge avec la même règle
     * (`paliers/exerciseRules.ts`) et garde le sien ; celui-ci ne sert que si
     * l'exercice a quitté la base entre la séance et l'envoi (un palier
     * régénéré).
     */
    correct: v.boolean(),
    at: v.number(),
    timeSpentMs: v.number(),
  }),
  v.object({
    kind: v.literal("hint"),
    exerciseId: v.id("exercises"),
    hintIndex: v.number(),
    at: v.number(),
  }),
);

export type SessionLogEntry = Infer<typeof sessionLogEntryValidator>;

export const palierSessionValidator = v.object({
  /** L'identifiant que l'appareil a donné à la séance (`palierAttempts.clientSessionId`). */
  sessionId: v.string(),
  palierId: v.id("paliers"),
  startedAt: v.number(),
  /** Les exercices de la séance, dans l'ordre où l'enfant les a joués. */
  exerciseIds: v.array(v.id("exercises")),
  log: v.array(sessionLogEntryValidator),
  /** Posé quand l'enfant a fini le palier. */
  finishedAt: v.optional(v.number()),
});

export type PalierSessionPayload = Infer<typeof palierSessionValidator>;

// ---------------------------------------------------------------------------
// LES ENTRÉES DU JOURNAL
// ---------------------------------------------------------------------------

const arabicDrillValidator = v.union(
  v.literal("recognizeGlyph"),
  v.literal("recognizeName"),
  v.literal("dots"),
  v.literal("forms"),
  v.literal("pronounce"),
  v.literal("write"),
  v.literal("read"),
  v.literal("recite"),
);

export const offlineEventValidator = v.union(
  v.object({
    kind: v.literal("palierSession"),
    id: v.string(),
    at: v.number(),
    session: palierSessionValidator,
  }),
  // Une tentative d'arabe jugée sur l'appareil (QCM, points, tracé...). La
  // prononciation, jugée par le serveur après transcription, ne passe jamais
  // par ici : sans réseau, elle ne se note pas.
  v.object({
    kind: v.literal("arabicAttempt"),
    id: v.string(),
    at: v.number(),
    lessonKey: v.string(),
    drill: arabicDrillValidator,
    itemKey: v.string(),
    correct: v.boolean(),
    score: v.optional(v.number()),
    verdict: v.optional(v.union(v.literal("ok"), v.literal("close"), v.literal("retry"))),
  }),
  v.object({
    kind: v.literal("arabicLessonComplete"),
    id: v.string(),
    at: v.number(),
    lessonKey: v.string(),
  }),
  v.object({
    kind: v.literal("soundEnabled"),
    id: v.string(),
    at: v.number(),
    enabled: v.boolean(),
  }),
  v.object({
    kind: v.literal("levelSeen"),
    id: v.string(),
    at: v.number(),
    level: v.number(),
  }),
  v.object({
    kind: v.literal("badgesSeen"),
    id: v.string(),
    at: v.number(),
    badgeIds: v.array(v.id("badges")),
  }),
);

export type OfflineEvent = Infer<typeof offlineEventValidator>;
export type OfflineEventKind = OfflineEvent["kind"];

/** Ce que le serveur répond pour une entrée. */
export type OfflineEventResult =
  | {
      status: "applied" | "duplicate";
      /** La tentative de palier créée ou complétée, pour une séance. */
      palierAttemptId?: string;
      /** La note du palier, quand la séance était finie. */
      palier?: {
        status: "validated" | "failed";
        starsTotal: number;
        exerciseCount: number;
        canRegen: boolean;
      };
    }
  | {
      /**
       * Refus définitif : l'entrée ne passera jamais (palier introuvable,
       * leçon inconnue). L'application la retire du journal et la garde de
       * côté, pour qu'un adulte puisse comprendre.
       */
      status: "rejected";
      reason: string;
    };

// ---------------------------------------------------------------------------
// LES SONS À TÉLÉCHARGER
// ---------------------------------------------------------------------------

/** Une référence du module d'arabe, la même que `arabic/voice.ts` accepte. */
export const arabicSpeechRefValidator = v.union(
  v.object({ kind: v.literal("letterName"), letterKey: v.string() }),
  v.object({
    kind: v.literal("letterSyllable"),
    letterKey: v.string(),
    haraka: v.union(v.literal("fatha"), v.literal("kasra"), v.literal("damma")),
  }),
  v.object({ kind: v.literal("lessonItem"), lessonKey: v.string(), itemKey: v.string() }),
  v.object({ kind: v.literal("instruction"), key: v.string() }),
  v.object({ kind: v.literal("letterWord"), letterKey: v.string() }),
);

export type ArabicSpeechRef = Infer<typeof arabicSpeechRefValidator>;

export const clipRequestValidator = v.union(
  // La consigne d'un exercice, pour les classes qui apprennent à lire.
  v.object({ kind: v.literal("prompt"), exerciseId: v.id("exercises") }),
  v.object({ kind: v.literal("arabic"), ref: arabicSpeechRefValidator }),
);

export type ClipRequest = Infer<typeof clipRequestValidator>;

/** La clé d'un son sur l'appareil : stable, lisible, la même des deux côtés. */
export function clipRequestKey(request: ClipRequest): string {
  if (request.kind === "prompt") return `prompt:${request.exerciseId}`;
  return `arabic:${arabicRefKey(request.ref)}`;
}

/** La clé d'une référence d'arabe, indépendante de l'ordre des champs. */
export function arabicRefKey(ref: ArabicSpeechRef): string {
  switch (ref.kind) {
    case "letterName":
      return `letterName|${ref.letterKey}`;
    case "letterSyllable":
      return `letterSyllable|${ref.letterKey}|${ref.haraka}`;
    case "lessonItem":
      return `lessonItem|${ref.lessonKey}|${ref.itemKey}`;
    case "instruction":
      return `instruction|${ref.key}`;
    case "letterWord":
      return `letterWord|${ref.letterKey}`;
  }
}

export type ClipResult =
  | {
      key: string;
      status: "ready";
      /** Le fichier sur le serveur : deux références qui disent le même texte partagent le même. */
      clipId: string;
      url: string;
    }
  | {
      key: string;
      status: "pending" | "unavailable";
      reason?: string;
    };
