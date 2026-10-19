/**
 * LA SYNCHRONISATION, CÔTÉ APPAREIL — ce qui se passe quand le réseau est là.
 *
 *   1. `flush` : envoyer le journal (`convex/offline/sync.ts`), une entrée à la
 *      fois et dans l'ordre. Une erreur de réseau arrête l'envoi ; l'entrée
 *      reste, on réessaiera. Un refus définitif retire l'entrée et la note.
 *   2. `refreshContent` : relire le contenu de la classe quand son empreinte a
 *      changé, ou une fois par jour (les explications s'y ajoutent).
 *   3. `preparePaliers` : faire générer les paliers de la classe qui
 *      n'existent pas encore, pour qu'ils se jouent sans réseau.
 *   4. `downloadClips` : télécharger la voix de Pio — les consignes pour un
 *      enfant qui apprend à lire, tous les sons du module d'arabe.
 *
 * Rien ici n'est indispensable à l'enfant : il joue sur l'appareil, que tout
 * ceci ait réussi ou non. C'est le serveur, et le prochain voyage sans réseau,
 * qui en profitent.
 */
import type { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clipRequestKey, type ClipRequest, type ClipResult } from "@/convex/offline/contract";
import { allSpeechRefs } from "@/convex/arabic/speechText";
import { knownClipKeys, linkClip, saveClip, storedClipIds } from "./clips";
import type { OfflineEngine } from "./engine";
import { exercisesKey } from "./model";
import type { LocalSession } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Les références envoyées par appel à `prepareClips`. */
const CLIP_BATCH = 100;
/** Les téléchargements de sons menés de front. */
const CLIP_PARALLEL = 4;

export type DownloadProgress = { done: number; total: number };

function sessionEvent(session: LocalSession) {
  return {
    kind: "palierSession" as const,
    id: session.sessionId,
    at: session.startedAt,
    session: {
      sessionId: session.sessionId,
      palierId: session.palierId as Id<"paliers">,
      startedAt: session.startedAt,
      exerciseIds: session.exerciseIds as Id<"exercises">[],
      log: session.log.map((entry) =>
        entry.kind === "answer"
          ? { ...entry, exerciseId: entry.exerciseId as Id<"exercises"> }
          : { ...entry, exerciseId: entry.exerciseId as Id<"exercises"> },
      ),
      ...(session.finishedAt !== undefined ? { finishedAt: session.finishedAt } : {}),
    },
  };
}

/** Les paliers manquants se redemandent au plus toutes les trente minutes. */
const PREPARE_COOLDOWN_MS = 30 * 60 * 1000;

export class OfflineSync {
  private flushing: Promise<{ applied: number; ok: boolean }> | null = null;
  private lastPrepareAt = 0;

  constructor(
    private readonly convex: ConvexReactClient,
    private readonly engine: OfflineEngine,
  ) {}

  /** Envoie tout le journal. `ok: false` : une erreur de réseau a interrompu l'envoi. */
  flush(): Promise<{ applied: number; ok: boolean }> {
    this.flushing ??= this.doFlush().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async doFlush(): Promise<{ applied: number; ok: boolean }> {
    let applied = 0;
    // Les séances d'abord, de la plus ancienne à la plus récente : la fin du
    // palier 1 arrive avant celle du palier 2.
    for (const session of this.engine.dirtySessions()) {
      const pushed = {
        logLength: session.log.length,
        exercises: exercisesKey(session.exerciseIds),
        finishedAt: session.finishedAt ?? null,
      };
      let result;
      try {
        result = await this.convex.mutation(api.offline.sync.apply, { event: sessionEvent(session) });
      } catch (error) {
        console.warn("[hors-ligne] envoi d'une séance interrompu", error);
        return { applied, ok: false };
      }
      if (result.status === "rejected") {
        this.engine.rejectSession(session.sessionId, result.reason);
      } else {
        this.engine.markSessionPushed(session.sessionId, pushed, result.palierAttemptId ?? null);
        if (result.palier) this.engine.noteServerGrade(session.sessionId, result.palier.canRegen);
        if (result.status === "applied") applied += 1;
      }
    }

    for (const entry of this.engine.pendingEntries()) {
      let result;
      try {
        result = await this.convex.mutation(api.offline.sync.apply, {
          event:
            entry.event.kind === "badgesSeen"
              ? { ...entry.event, badgeIds: entry.event.badgeIds as Id<"badges">[] }
              : entry.event,
        });
      } catch (error) {
        console.warn("[hors-ligne] envoi du journal interrompu", error);
        return { applied, ok: false };
      }
      if (result.status === "rejected") {
        this.engine.rejectEntry(entry.seq, result.reason);
      } else {
        this.engine.markEntryAcked(entry.seq);
        if (result.status === "applied") applied += 1;
      }
    }
    return { applied, ok: true };
  }

  /** Envoie une séance tout de suite et rend l'identifiant de sa tentative serveur. */
  async pushSession(sessionId: string): Promise<string | null> {
    await this.flush();
    const session = this.engine.getSession(sessionId);
    if (session?.sync.serverAttemptId) return session.sync.serverAttemptId;
    await this.flush();
    return this.engine.getSession(sessionId)?.sync.serverAttemptId ?? null;
  }

  /** Relit le contenu de la classe s'il a changé (ou une fois par jour). */
  async refreshContent(force = false): Promise<boolean> {
    const snapshot = this.engine.snapshot;
    if (!snapshot || !snapshot.access.ok) return false;
    const content = this.engine.content;
    const stale =
      !content ||
      content.contentVersion !== snapshot.contentVersion ||
      Date.now() - content.fetchedAt > DAY_MS;
    if (!stale && !force) return false;
    const fresh = await this.convex.query(api.offline.pack.content, {});
    if (!fresh) return false;
    this.engine.setContent(fresh);
    return true;
  }

  async refreshBadgeInputs(): Promise<void> {
    const inputs = await this.convex.query(api.offline.pack.badgeInputs, {});
    if (inputs) this.engine.setBadgeInputs(inputs);
  }

  /**
   * Fait générer les paliers de la classe qui manquent, quelques-uns par
   * appel, puis relit le contenu. S'arrête dès qu'un appel ne génère rien
   * (budget, panne) : on reviendra au prochain passage du réseau.
   */
  async preparePaliers(maxRounds = 25): Promise<void> {
    if (Date.now() - this.lastPrepareAt < PREPARE_COOLDOWN_MS) return;
    this.lastPrepareAt = Date.now();
    let generatedSinceRefresh = 0;
    for (let round = 0; round < maxRounds; round++) {
      const result = await this.convex.action(api.offline.prefetch.preparePaliers, {});
      generatedSinceRefresh += result.generated;
      if (generatedSinceRefresh >= 6) {
        await this.refreshContent(true);
        generatedSinceRefresh = 0;
      }
      if (result.remaining === 0 || result.generated === 0) break;
    }
    if (generatedSinceRefresh > 0) await this.refreshContent(true);
  }

  /** Les sons dont l'enfant aura besoin sans réseau. */
  neededClips(): ClipRequest[] {
    const snapshot = this.engine.snapshot;
    const content = this.engine.content;
    const requests: ClipRequest[] = [];
    if (snapshot?.profile.readsAloud && content) {
      for (const exercise of content.exercises) {
        requests.push({ kind: "prompt", exerciseId: exercise._id });
      }
    }
    const arabicOn = snapshot?.modules.some((m) => m.key === "arabe_coran" && m.enabled) ?? false;
    if (arabicOn) {
      for (const ref of allSpeechRefs()) requests.push({ kind: "arabic", ref });
    }
    return requests;
  }

  /**
   * Télécharge les sons qui manquent. `onProgress` suit l'avancée. Les sons
   * encore à synthétiser côté serveur (`pending`) sont redemandés, quelques
   * tours au plus.
   */
  async downloadClips(onProgress?: (progress: DownloadProgress) => void): Promise<DownloadProgress> {
    const needed = this.neededClips();
    const keys = needed.map(clipRequestKey);
    const known = await knownClipKeys(keys);
    let missing = needed.filter((r) => !known.has(clipRequestKey(r)));
    const total = needed.length;
    let done = total - missing.length;
    onProgress?.({ done, total });
    if (missing.length === 0) return { done, total };

    const stored = await storedClipIds();
    for (let round = 0; round < 6 && missing.length > 0; round++) {
      const stillPending: ClipRequest[] = [];
      for (let i = 0; i < missing.length; i += CLIP_BATCH) {
        const chunk = missing.slice(i, i + CLIP_BATCH);
        const results: ClipResult[] = await this.convex.action(api.offline.voice.prepareClips, {
          requests: chunk,
        });
        const byKey = new Map(chunk.map((r) => [clipRequestKey(r), r] as const));
        const ready = new Map<string, { url: string; keys: string[] }>();
        for (const result of results) {
          if (result.status === "ready") {
            const entry = ready.get(result.clipId) ?? { url: result.url, keys: [] };
            entry.keys.push(result.key);
            ready.set(result.clipId, entry);
          } else if (result.status === "pending") {
            const request = byKey.get(result.key);
            if (request) stillPending.push(request);
          } else {
            // Indisponible (pas de clé de voix, texte inconnu) : ce son ne
            // viendra pas, on ne le compte plus.
            done += 1;
          }
        }
        const jobs = [...ready.entries()];
        for (let j = 0; j < jobs.length; j += CLIP_PARALLEL) {
          await Promise.all(
            jobs.slice(j, j + CLIP_PARALLEL).map(async ([clipId, { url, keys: clipKeys }]) => {
              try {
                if (stored.has(clipId)) {
                  await linkClip(clipId, clipKeys);
                } else {
                  const response = await fetch(url);
                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  await saveClip(clipId, await response.blob(), clipKeys);
                  stored.add(clipId);
                }
                done += clipKeys.length;
              } catch (error) {
                console.warn("[hors-ligne] son non téléchargé", error);
              }
            }),
          );
          onProgress?.({ done, total });
        }
      }
      missing = stillPending;
      if (missing.length > 0) await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    onProgress?.({ done, total });
    return { done, total };
  }
}
