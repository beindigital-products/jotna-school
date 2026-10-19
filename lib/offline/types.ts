/**
 * LES FORMES DU HORS-LIGNE CÔTÉ ÉCRAN.
 *
 * Le paquet a la forme exacte de ce que rendent les requêtes du serveur
 * (`convex/offline/pack.ts`) : on la tire de leurs types, sans la recopier.
 */
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { LocalLogEntry, SessionGrade } from "./session-rules";
import type { ExerciseType } from "@/convex/exerciseTypes";

export type Snapshot = NonNullable<FunctionReturnType<typeof api.offline.pack.snapshot>>;
export type ContentPack = NonNullable<FunctionReturnType<typeof api.offline.pack.content>>;
export type BadgeInputs = NonNullable<FunctionReturnType<typeof api.offline.pack.badgeInputs>>;
export type ArabicSnapshot = NonNullable<FunctionReturnType<typeof api.offline.pack.arabicSnapshot>>;

export type PackSubject = ContentPack["subjects"][number];
export type PackTopic = ContentPack["topics"][number];
export type PackPalier = ContentPack["paliers"][number];
export type PackBadge = ContentPack["badges"][number];

/** Un exercice COMPLET, réponse et indices compris. */
export type PackExercise = {
  _id: string;
  palierId: string;
  order: number;
  type: ExerciseType;
  prompt: string;
  payload: unknown;
  hints: string[];
  isVariation?: boolean;
  explanation: { intro: string; steps: string[]; conclusion: string } | null;
};

/**
 * UNE SÉANCE DE PALIER SUR L'APPAREIL. Elle vit dans son propre fichier
 * (`sessions/<id>.json`) de son premier exercice jusqu'à ce que le serveur
 * l'ait reçue finie ; c'est elle qu'on reprend quand l'enfant revient.
 */
export type LocalSession = {
  sessionId: string;
  palierId: string;
  topicId: string;
  subjectId: string;
  palierIndex: number;
  startedAt: number;
  /** Les exercices joués, dans l'ordre. */
  exerciseIds: string[];
  log: LocalLogEntry[];
  finishedAt?: number;
  grade?: SessionGrade;
  /**
   * Les exercices de la séance, COMPLETS (réponses et indices), copiés au
   * départ : le contenu de la classe peut être rafraîchi pendant la séance
   * (palier régénéré), la séance garde ce qu'elle joue. Les variations d'une
   * nouvelle chance s'y ajoutent.
   */
  exercises: PackExercise[];
  /** Ce que le serveur a dit à la synchronisation de la fin : la nouvelle chance est-elle encore permise ? */
  serverCanRegen?: boolean;
  sync: {
    /** Entrées du journal déjà reçues par le serveur. */
    pushedLogLength: number;
    /** La liste d'exercices déjà reçue. */
    pushedExercises: string;
    /** La fin déjà reçue (`finishedAt`), ou `null`. */
    pushedFinishedAt: number | null;
    serverAttemptId: string | null;
    /** Le dernier accusé de réception, pour savoir si le paquet le reflète déjà. */
    ackedAt: number | null;
  };
};

/** Une entrée du journal autre qu'une séance (arabe, réglages). */
export type OutboxEntry = {
  seq: number;
  event:
    | {
        kind: "arabicAttempt";
        id: string;
        at: number;
        lessonKey: string;
        drill: "recognizeGlyph" | "recognizeName" | "dots" | "forms" | "pronounce" | "write" | "read" | "recite";
        itemKey: string;
        correct: boolean;
        score?: number;
        verdict?: "ok" | "close" | "retry";
      }
    | { kind: "arabicLessonComplete"; id: string; at: number; lessonKey: string }
    | { kind: "soundEnabled"; id: string; at: number; enabled: boolean }
    | { kind: "levelSeen"; id: string; at: number; level: number }
    | { kind: "badgesSeen"; id: string; at: number; badgeIds: string[] };
  /** L'accusé de réception du serveur ; l'entrée reste visible jusqu'au paquet suivant. */
  ackedAt?: number;
};

export type OutboxEvent = OutboxEntry["event"];

/** Une entrée refusée pour de bon par le serveur, gardée pour qu'un adulte comprenne. */
export type RejectedEntry = {
  at: number;
  reason: string;
  kind: string;
  id: string;
};

/** Un trophée mérité sur l'appareil, que le serveur attribuera à la synchronisation. */
export type LocalBadge = { badgeId: string; earnedAt: number };

/** Tout ce que l'appareil sait d'un élève. */
export type OfflineData = {
  profileId: string;
  snapshot: Snapshot | null;
  /** Quand ce paquet est arrivé, en temps de l'appareil. */
  snapshotReceivedAt: number;
  content: ContentPack | null;
  badgeInputs: BadgeInputs | null;
  arabic: ArabicSnapshot | null;
  arabicReceivedAt: number;
  sessions: LocalSession[];
  outbox: OutboxEntry[];
  localBadges: LocalBadge[];
  /** Les explications « Je veux comprendre » obtenues en ligne depuis le paquet. */
  explanations: Record<string, { intro: string; steps: string[]; conclusion: string }>;
};
