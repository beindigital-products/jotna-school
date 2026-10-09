/**
 * LE MOTEUR HORS LIGNE D'UN ÉLÈVE — ce que l'appareil sait de lui, ce qu'il a
 * fait depuis le dernier passage du réseau, et l'écriture de tout cela dans
 * des fichiers qui survivent à la fermeture de l'application.
 *
 * Ni React, ni réseau : l'écran s'y abonne (`components/offline/`), la
 * synchronisation le lit et lui rend compte (`lib/offline/sync.ts`). Les vues
 * se calculent dans `model.ts`.
 *
 * LES FICHIERS, PAR ÉLÈVE (`p/<id>/`) :
 *   - `pack/*.json` : le paquet du serveur (progression, contenu, trophées,
 *     arabe) ;
 *   - `sessions/<id>.json` : une séance de palier jouée sur l'appareil, de sa
 *     première réponse jusqu'à ce que le serveur la reflète finie ;
 *   - `outbox/<n>.json` : une autre entrée du journal (arabe, réglages) ;
 *   - `local.json` : le compteur du journal, les trophées mérités sur
 *     l'appareil, les explications obtenues, les refus du serveur.
 *
 * CHAQUE GESTE EST ÉCRIT AVANT D'ÊTRE MONTRÉ COMME ACQUIS. Une réponse est
 * rangée dans le fichier de la séance au moment où elle est donnée : un
 * téléphone qui s'éteint au milieu d'un palier le reprend où il était.
 */
import { listFiles, readJson, removeFile, writeJson } from "./files";
import { ACK_GRACE_MS, buildModel, sessionIsDirty, type OfflineModel } from "./model";
import { gradeSession, type LocalLogEntry, type SessionGrade } from "./session-rules";
import type {
  ArabicSnapshot,
  BadgeInputs,
  ContentPack,
  LocalBadge,
  LocalSession,
  OfflineData,
  OutboxEntry,
  OutboxEvent,
  PackExercise,
  PackPalier,
  PackTopic,
  RejectedEntry,
  Snapshot,
} from "./types";


/** Une séance finie reste sur l'appareil au moins ce temps (écran de fin, nouvelle chance). */
export const FINISHED_SESSION_KEEP_MS = 30 * 60_000;

// ===========================================================================
// L'APPAREIL — qui joue ici
// ===========================================================================

const DEVICE_PATH = "device.json";

export type DeviceState = {
  /** L'élève qui s'est connecté en dernier, et que l'application rouvre sans réseau. */
  current: string | null;
  profiles: Record<string, { name: string; class: string | null; lastOnlineAt: number }>;
};

export async function readDevice(): Promise<DeviceState> {
  return (await readJson<DeviceState>(DEVICE_PATH)) ?? { current: null, profiles: {} };
}

export async function writeDevice(state: DeviceState): Promise<void> {
  await writeJson(DEVICE_PATH, state);
}

// ===========================================================================
// LE MOTEUR
// ===========================================================================

type LocalMeta = {
  seq: number;
  snapshotReceivedAt: number;
  arabicReceivedAt: number;
  localBadges: LocalBadge[];
  explanations: OfflineData["explanations"];
  rejected: RejectedEntry[];
  lastSyncAt: number | null;
};

const EMPTY_META: LocalMeta = {
  seq: 0,
  snapshotReceivedAt: 0,
  arabicReceivedAt: 0,
  localBadges: [],
  explanations: {},
  rejected: [],
  lastSyncAt: null,
};

/** Un identifiant de séance, tiré avant même la première réponse (graine du mélange des tuiles). */
export function newSessionId(): string {
  return newId("s");
}

/**
 * `getRandomValues` existe partout où le moteur tourne (WebKit depuis iOS 11,
 * WebView Android, Node pour les tests) ; `randomUUID` manque avant iOS 15.4.
 * Pas de repli sur `Math.random` : l'identifiant sert de clé d'idempotence au
 * serveur (`palierAttempts.clientSessionId`, `clientEventId`).
 */
function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export class OfflineEngine {
  readonly profileId: string;
  private data: OfflineData;
  private meta: LocalMeta;
  private version = 0;
  private listeners = new Set<() => void>();
  private cache: { version: number; minute: number; model: OfflineModel } | null = null;
  private writes: Promise<void> = Promise.resolve();

  private constructor(profileId: string, data: OfflineData, meta: LocalMeta) {
    this.profileId = profileId;
    this.data = data;
    this.meta = meta;
  }

  private get base(): string {
    return `p/${this.profileId}`;
  }

  /** Relit tout ce que l'appareil garde pour cet élève. */
  static async open(profileId: string): Promise<OfflineEngine> {
    const base = `p/${profileId}`;
    const [snapshot, content, badgeInputs, arabic, meta] = await Promise.all([
      readJson<Snapshot>(`${base}/pack/snapshot.json`),
      readJson<ContentPack>(`${base}/pack/content.json`),
      readJson<BadgeInputs>(`${base}/pack/badgeInputs.json`),
      readJson<ArabicSnapshot>(`${base}/pack/arabic.json`),
      readJson<LocalMeta>(`${base}/local.json`),
    ]);
    const sessionFiles = (await listFiles(`${base}/sessions`)).filter((n) => n.endsWith(".json"));
    const sessions = (
      await Promise.all(sessionFiles.map((n) => readJson<LocalSession>(`${base}/sessions/${n}`)))
    ).filter((s): s is LocalSession => s !== null);
    const outboxFiles = (await listFiles(`${base}/outbox`)).filter((n) => n.endsWith(".json"));
    const outbox = (
      await Promise.all(outboxFiles.map((n) => readJson<OutboxEntry>(`${base}/outbox/${n}`)))
    )
      .filter((e): e is OutboxEntry => e !== null)
      .sort((a, b) => a.seq - b.seq);

    const m: LocalMeta = { ...EMPTY_META, ...(meta ?? {}) };
    // Le compteur ne recule jamais, même si `local.json` a été perdu.
    m.seq = Math.max(m.seq, ...outbox.map((e) => e.seq), 0);
    return new OfflineEngine(
      profileId,
      {
        profileId,
        snapshot,
        snapshotReceivedAt: m.snapshotReceivedAt,
        content,
        badgeInputs,
        arabic,
        arabicReceivedAt: m.arabicReceivedAt,
        sessions,
        outbox,
        localBadges: m.localBadges,
        explanations: m.explanations,
      },
      m,
    );
  }

  // --- Abonnement (`useSyncExternalStore`) -----------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getVersion = (): number => this.version;

  private changed(): void {
    this.version += 1;
    this.cache = null;
    for (const listener of this.listeners) listener();
  }

  /** Les vues, recalculées quand le moteur change ou que la minute tourne. */
  model(): OfflineModel {
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    if (this.cache && this.cache.version === this.version && this.cache.minute === minute) {
      return this.cache.model;
    }
    const model = buildModel(this.data, now);
    this.cache = { version: this.version, minute, model };
    return model;
  }

  get snapshot(): Snapshot | null {
    return this.data.snapshot;
  }

  get content(): ContentPack | null {
    return this.data.content;
  }

  get arabic(): ArabicSnapshot | null {
    return this.data.arabic;
  }

  get badgeInputs(): BadgeInputs | null {
    return this.data.badgeInputs;
  }

  get lastSyncAt(): number | null {
    return this.meta.lastSyncAt;
  }

  get rejected(): readonly RejectedEntry[] {
    return this.meta.rejected;
  }

  // --- Écritures ---------------------------------------------------------------

  private persist(task: () => Promise<void>): Promise<void> {
    this.writes = this.writes.then(task).catch((error) => {
      console.error("[hors-ligne] écriture impossible", error);
    });
    return this.writes;
  }

  /** Attend que tout ce qui a été demandé soit écrit. */
  flushWrites(): Promise<void> {
    return this.writes;
  }

  private saveMeta(): Promise<void> {
    this.meta.snapshotReceivedAt = this.data.snapshotReceivedAt;
    this.meta.arabicReceivedAt = this.data.arabicReceivedAt;
    this.meta.localBadges = this.data.localBadges;
    this.meta.explanations = this.data.explanations;
    const meta = { ...this.meta };
    return this.persist(() => writeJson(`${this.base}/local.json`, meta));
  }

  private saveSession(session: LocalSession): Promise<void> {
    const copy = structuredClone(session);
    return this.persist(() => writeJson(`${this.base}/sessions/${session.sessionId}.json`, copy));
  }

  private saveEntry(entry: OutboxEntry): Promise<void> {
    const copy = structuredClone(entry);
    const name = String(entry.seq).padStart(8, "0");
    return this.persist(() => writeJson(`${this.base}/outbox/${name}.json`, copy));
  }

  private dropEntry(entry: OutboxEntry): void {
    const name = String(entry.seq).padStart(8, "0");
    void this.persist(() => removeFile(`${this.base}/outbox/${name}.json`));
  }

  // --- Ce qui arrive du serveur ----------------------------------------------------

  setSnapshot(snapshot: Snapshot): void {
    if (snapshot.profile._id !== this.profileId) return;
    this.data.snapshot = snapshot;
    this.data.snapshotReceivedAt = Date.now();
    this.prune();
    void this.persist(() => writeJson(`${this.base}/pack/snapshot.json`, snapshot));
    void this.saveMeta();
    this.changed();
  }

  setContent(content: ContentPack): void {
    this.data.content = content;
    void this.persist(() => writeJson(`${this.base}/pack/content.json`, content));
    this.changed();
  }

  setBadgeInputs(inputs: BadgeInputs): void {
    this.data.badgeInputs = inputs;
    void this.persist(() => writeJson(`${this.base}/pack/badgeInputs.json`, inputs));
    this.changed();
  }

  setArabic(arabic: ArabicSnapshot): void {
    this.data.arabic = arabic;
    this.data.arabicReceivedAt = Date.now();
    this.prune();
    void this.persist(() => writeJson(`${this.base}/pack/arabic.json`, arabic));
    void this.saveMeta();
    this.changed();
  }

  /**
   * Oublie ce que le paquet reflète désormais : les entrées accusées, les
   * séances finies que le serveur montre, les trophées qu'il a attribués.
   */
  private prune(): void {
    const now = Date.now();
    const reflected = (ackedAt: number | undefined | null, receivedAt: number) =>
      ackedAt !== undefined && ackedAt !== null && (receivedAt > ackedAt || now - ackedAt > ACK_GRACE_MS);

    const keep: OutboxEntry[] = [];
    for (const entry of this.data.outbox) {
      const arabicKind = entry.event.kind === "arabicAttempt" || entry.event.kind === "arabicLessonComplete";
      const receivedAt = arabicKind ? this.data.arabicReceivedAt : this.data.snapshotReceivedAt;
      if (reflected(entry.ackedAt, receivedAt)) this.dropEntry(entry);
      else keep.push(entry);
    }
    this.data.outbox = keep;

    const serverRows = new Map(
      (this.data.snapshot?.palierAttempts ?? [])
        .filter((row) => row.clientSessionId)
        .map((row) => [row.clientSessionId as string, row] as const),
    );
    this.data.sessions = this.data.sessions.filter((session) => {
      if (session.finishedAt === undefined || sessionIsDirty(session)) return true;
      // L'écran de fin la montre encore, et la nouvelle chance en a besoin :
      // une séance finie reste une demi-heure, même reflétée.
      if (now - session.finishedAt < FINISHED_SESSION_KEEP_MS) return true;
      const row = serverRows.get(session.sessionId);
      if (!row || row.status === "in_progress") return true;
      if (!reflected(session.sync.ackedAt, this.data.snapshotReceivedAt)) return true;
      void this.persist(() => removeFile(`${this.base}/sessions/${session.sessionId}.json`));
      return false;
    });

    const serverBadges = new Set((this.data.snapshot?.earnedBadges ?? []).map((b) => b.badgeId as string));
    this.data.localBadges = this.data.localBadges.filter((b) => !serverBadges.has(b.badgeId));
  }

  // --- Les séances de palier ----------------------------------------------------

  /** La séance ouverte (pas finie) de ce palier, la plus récente. */
  openSessionFor(palierId: string): LocalSession | null {
    const open = this.data.sessions
      .filter((s) => s.palierId === palierId && s.finishedAt === undefined)
      .sort((a, b) => b.startedAt - a.startedAt);
    return open[0] ?? null;
  }

  getSession(sessionId: string): LocalSession | null {
    return this.data.sessions.find((s) => s.sessionId === sessionId) ?? null;
  }

  startSession(
    palier: PackPalier,
    topic: PackTopic,
    exercises: PackExercise[],
    sessionId: string = newSessionId(),
  ): LocalSession {
    // Un identifiant ne sert qu'une fois : une seconde séance sous le même
    // nom écraserait le fichier de la première.
    const existing = this.getSession(sessionId);
    if (existing) return existing;
    const session: LocalSession = {
      sessionId,
      palierId: palier._id as string,
      topicId: topic._id as string,
      subjectId: topic.subjectId as string,
      palierIndex: palier.palierIndex,
      startedAt: Date.now(),
      exerciseIds: exercises.map((ex) => ex._id),
      exercises: structuredClone(exercises),
      log: [],
      sync: {
        pushedLogLength: 0,
        pushedExercises: "",
        pushedFinishedAt: null,
        serverAttemptId: null,
        ackedAt: null,
      },
    };
    this.data.sessions = [...this.data.sessions, session];
    void this.saveSession(session);
    this.changed();
    return session;
  }

  private updateSession(sessionId: string, update: (session: LocalSession) => LocalSession): LocalSession | null {
    let updated: LocalSession | null = null;
    this.data.sessions = this.data.sessions.map((s) => {
      if (s.sessionId !== sessionId) return s;
      updated = update(s);
      return updated;
    });
    if (updated) {
      void this.saveSession(updated);
      this.changed();
    }
    return updated;
  }

  recordAnswer(
    sessionId: string,
    entry: { exerciseId: string; answer: string; correct: boolean; timeSpentMs: number },
  ): void {
    const logEntry: LocalLogEntry = { kind: "answer", ...entry, at: Date.now() };
    this.updateSession(sessionId, (s) => ({ ...s, log: [...s.log, logEntry] }));
  }

  recordHint(sessionId: string, exerciseId: string, hintIndex: number): void {
    const logEntry: LocalLogEntry = { kind: "hint", exerciseId, hintIndex, at: Date.now() };
    this.updateSession(sessionId, (s) => ({ ...s, log: [...s.log, logEntry] }));
  }

  /** Note le palier, comme le serveur le notera. */
  finishSession(sessionId: string): SessionGrade | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    if (session.finishedAt !== undefined && session.grade) return session.grade;
    const grade = gradeSession(session.exerciseIds, session.log);
    this.updateSession(sessionId, (s) => ({ ...s, finishedAt: Date.now(), grade }));
    return grade;
  }

  /**
   * Une nouvelle chance accordée par le serveur : les exercices ratés sont
   * remplacés par des variations, et la séance reprend sur la même tentative.
   */
  reopenWithVariations(sessionId: string, exercises: PackExercise[], exerciseIds: string[]): void {
    this.updateSession(sessionId, (s) => {
      const known = new Map(s.exercises.map((ex) => [ex._id, ex] as const));
      for (const ex of exercises) known.set(ex._id, ex);
      return {
        ...s,
        exerciseIds,
        exercises: [...known.values()],
        finishedAt: undefined,
        grade: undefined,
        serverCanRegen: undefined,
      };
    });
  }

  /** Ce que le serveur a répondu à la fin d'une séance (la nouvelle chance). */
  noteServerGrade(sessionId: string, canRegen: boolean): void {
    const session = this.getSession(sessionId);
    if (!session || session.serverCanRegen === canRegen) return;
    this.updateSession(sessionId, (s) => ({ ...s, serverCanRegen: canRegen }));
  }

  /** Abandonne une séance jamais commencée (aucune réponse) : rien à envoyer. */
  discardEmptySession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session || session.log.length > 0 || session.sync.serverAttemptId) return;
    this.data.sessions = this.data.sessions.filter((s) => s.sessionId !== sessionId);
    void this.persist(() => removeFile(`${this.base}/sessions/${sessionId}.json`));
    this.changed();
  }

  // --- Le journal des autres gestes ----------------------------------------------

  enqueue(event: DistributiveOmit<OutboxEvent, "id" | "at">): void {
    this.meta.seq += 1;
    const entry: OutboxEntry = {
      seq: this.meta.seq,
      event: { ...event, id: newId("e"), at: Date.now() } as OutboxEvent,
    };
    this.data.outbox = [...this.data.outbox, entry];
    void this.saveEntry(entry);
    void this.saveMeta();
    this.changed();
  }

  // --- Ce que la synchronisation demande et rapporte ------------------------------

  dirtySessions(): LocalSession[] {
    return this.data.sessions.filter(sessionIsDirty).sort((a, b) => a.startedAt - b.startedAt);
  }

  pendingEntries(): OutboxEntry[] {
    return this.data.outbox.filter((e) => e.ackedAt === undefined);
  }

  /** Le nombre de gestes que le serveur n'a pas encore reçus. */
  pendingCount(): number {
    return this.dirtySessions().length + this.pendingEntries().length;
  }

  markSessionPushed(
    sessionId: string,
    pushed: { logLength: number; exercises: string; finishedAt: number | null },
    serverAttemptId: string | null,
  ): void {
    this.updateSession(sessionId, (s) => ({
      ...s,
      sync: {
        pushedLogLength: Math.max(s.sync.pushedLogLength, pushed.logLength),
        pushedExercises: pushed.exercises,
        pushedFinishedAt: pushed.finishedAt,
        serverAttemptId: serverAttemptId ?? s.sync.serverAttemptId,
        ackedAt: Date.now(),
      },
    }));
    this.meta.lastSyncAt = Date.now();
    void this.saveMeta();
  }

  /** Une séance que le serveur refuse pour de bon : on la retire, et on garde la trace. */
  rejectSession(sessionId: string, reason: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.sessionId !== sessionId);
    void this.persist(() => removeFile(`${this.base}/sessions/${sessionId}.json`));
    this.meta.rejected = [
      ...this.meta.rejected,
      { at: Date.now(), reason, kind: "palierSession", id: sessionId },
    ].slice(-50);
    void this.saveMeta();
    this.changed();
  }

  markEntryAcked(seq: number): void {
    const now = Date.now();
    this.data.outbox = this.data.outbox.map((e) => {
      if (e.seq !== seq) return e;
      const acked = { ...e, ackedAt: now };
      void this.saveEntry(acked);
      return acked;
    });
    this.meta.lastSyncAt = now;
    void this.saveMeta();
    this.changed();
  }

  rejectEntry(seq: number, reason: string): void {
    const entry = this.data.outbox.find((e) => e.seq === seq);
    if (!entry) return;
    this.data.outbox = this.data.outbox.filter((e) => e.seq !== seq);
    this.dropEntry(entry);
    this.meta.rejected = [
      ...this.meta.rejected,
      { at: Date.now(), reason, kind: entry.event.kind, id: entry.event.id },
    ].slice(-50);
    void this.saveMeta();
    this.changed();
  }

  // --- Trophées et explications ----------------------------------------------------

  /** Range les trophées mérités sur l'appareil, datés du moment où on les voit. */
  recordLocalBadges(badgeIds: readonly string[]): void {
    const known = new Set(this.data.localBadges.map((b) => b.badgeId));
    const fresh = badgeIds.filter((id) => !known.has(id));
    if (fresh.length === 0) return;
    const now = Date.now();
    this.data.localBadges = [...this.data.localBadges, ...fresh.map((badgeId) => ({ badgeId, earnedAt: now }))];
    void this.saveMeta();
    this.changed();
  }

  explanationFor(exerciseId: string): { intro: string; steps: string[]; conclusion: string } | null {
    const fromPack = this.data.content?.exercises.find((ex) => ex._id === exerciseId)?.explanation;
    if (fromPack) return fromPack;
    return this.data.explanations[exerciseId] ?? null;
  }

  saveExplanation(exerciseId: string, explanation: { intro: string; steps: string[]; conclusion: string }): void {
    this.data.explanations = { ...this.data.explanations, [exerciseId]: explanation };
    void this.saveMeta();
    this.changed();
  }
}

/** `Omit` qui garde l'union : chaque membre perd ses champs. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
