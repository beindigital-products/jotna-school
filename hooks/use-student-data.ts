"use client";

/**
 * LES DONNÉES DE L'ESPACE ÉLÈVE : LE MOTEUR DANS L'APPLICATION, CONVEX SUR LE WEB.
 *
 * Chaque hook rend la forme d'une requête du serveur :
 *
 *   useStudentStats       students.getMyStats
 *   useWorldMap           students.getMyWorldMap
 *   useNextStep           students.getMyNextStep
 *   useSubjectMap         students.getStudentSubjectMap
 *   useDailyQuests        quests.getMyDaily
 *   useStudentModules     modules.getMine
 *   useSoundPreference    students.getMySoundEnabled (application seulement)
 *   useBadgeShowcase      badges.list + listMyEarned + getMyBadgeProgress
 *   useArabicPath         arabic.lessons.getPath
 *   useHifzState          arabic.memorization.getState
 *   useArabicLessonState  arabic.lessons.getLessonState
 *
 * Dans l'application (`useOffline().enabled`), elles se calculent sur le
 * moteur hors ligne (`lib/offline/model.ts`) : le paquet du dernier passage
 * du réseau, plus ce que l'enfant a fait depuis. Avec ou sans réseau, l'écran
 * lit la même chose. Sur le web, elles lisent la requête elle-même : le web
 * n'a pas de hors-ligne (`docs/hors-ligne.md`). `undefined` veut dire « ça
 * charge », dans les deux cas.
 *
 * Les écritures passent par `useStudentActions`. Dans l'application, elles
 * s'inscrivent au journal et partent au serveur quand il est joignable ; sur
 * le web, elles appellent la mutation tout de suite.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useOffline, useOfflineModel } from "@/components/offline/context";
import type { OutboxEntry } from "@/lib/offline/types";

/** Les arguments d'une requête lue sur le web ; dans l'application, `"skip"`. */
function onWeb<Args>(enabled: boolean, args: Args): Args | "skip" {
  return enabled ? "skip" : args;
}

export function useStudentStats() {
  const { enabled } = useOffline();
  const model = useOfflineModel();
  const server = useQuery(api.students.getMyStats, onWeb(enabled, {}));
  if (!enabled) return server;
  return model === undefined ? undefined : (model?.stats ?? null);
}

/**
 * Le modèle, tant que le contenu de la classe est là — ou qu'il ne peut pas
 * arriver. À la toute première ouverture, le contenu se télécharge quelques
 * secondes après la progression : on attend s'il y a du réseau, plutôt que
 * de montrer une carte vide.
 */
function useContentModel() {
  const model = useOfflineModel();
  const { connected } = useOffline();
  if (model === undefined) return undefined;
  if (model && !model.hasContent && connected) return undefined;
  return model;
}

export function useWorldMap() {
  const { enabled } = useOffline();
  const model = useContentModel();
  const server = useQuery(api.students.getMyWorldMap, onWeb(enabled, {}));
  if (!enabled) return server;
  return model === undefined ? undefined : (model?.worldMap ?? null);
}

export function useNextStep() {
  const { enabled } = useOffline();
  const model = useContentModel();
  const server = useQuery(api.students.getMyNextStep, onWeb(enabled, {}));
  if (!enabled) return server;
  return model === undefined ? undefined : (model?.nextStep ?? null);
}

export function useSubjectMap(subjectId: string) {
  const { enabled } = useOffline();
  const model = useContentModel();
  const server = useQuery(
    api.students.getStudentSubjectMap,
    onWeb(enabled, { subjectId: subjectId as Id<"subjects"> }),
  );
  if (!enabled) return server;
  if (model === undefined) return undefined;
  return model?.subjectMaps.get(subjectId) ?? null;
}

/**
 * Les missions du jour. Sur le web, le serveur les tire au premier passage de
 * la journée (`quests.ensureDaily`) : tant qu'il ne l'a pas fait, ça charge.
 */
export function useDailyQuests() {
  const { enabled } = useOffline();
  const model = useOfflineModel();
  const server = useQuery(api.quests.getMyDaily, onWeb(enabled, {}));
  const ensureDaily = useMutation(api.quests.ensureDaily);
  const pending = !enabled && server?.pending === true;
  useEffect(() => {
    if (pending) void ensureDaily({});
  }, [pending, ensureDaily]);
  if (!enabled) return pending ? undefined : server;
  return model === undefined ? undefined : (model?.daily ?? null);
}

export function useStudentModules() {
  const { enabled } = useOffline();
  const model = useOfflineModel();
  const server = useQuery(api.modules.getMine, onWeb(enabled, {}));
  if (!enabled) return server;
  return model === undefined ? undefined : (model?.modules ?? []);
}

/**
 * Application seulement : la séance en ligne du web lit
 * `students.getMySoundEnabled` elle-même. Sur le web, `null`.
 */
export function useSoundPreference() {
  const model = useOfflineModel();
  if (model === undefined) return undefined;
  if (!model || !model.stats) return null;
  return { soundEnabled: model.soundEnabled === true, decided: model.soundEnabled !== null };
}

/** La vitrine des trophées : le catalogue, ce qui est gagné, où en est l'enfant. */
export function useBadgeShowcase() {
  const { enabled } = useOffline();
  const model = useOfflineModel();
  const catalog = useQuery(api.badges.list, onWeb(enabled, {}));
  const earned = useQuery(api.badges.listMyEarned, onWeb(enabled, {}));
  const progress = useQuery(api.badges.getMyBadgeProgress, onWeb(enabled, {}));
  return useMemo(() => {
    if (!enabled) {
      if (catalog === undefined || earned === undefined) return undefined;
      return { catalog, earned, progress };
    }
    if (model === undefined) return undefined;
    if (!model) return null;
    return {
      catalog: model.badgeCatalog,
      earned: model.earned.map((e) => ({ badgeId: e.badgeId, earnedAt: e.earnedAt, badge: e.badge })),
      progress: model.badgeProgress,
    };
  }, [enabled, catalog, earned, progress, model]);
}

/**
 * Le module d'arabe, tel que l'appareil le connaît. Allumé par l'école mais
 * pas encore téléchargé : on attend s'il y a du réseau (il arrive), on dit
 * « pas disponible » sinon.
 */
function useArabicModel() {
  const model = useOfflineModel();
  const { connected } = useOffline();
  if (model === undefined) return undefined;
  if (!model) return null;
  if (model.arabic) return model.arabic;
  const enabled = model.modules.some((m) => m.key === "arabe_coran" && m.enabled);
  return enabled && connected ? undefined : null;
}

export function useArabicPath() {
  const { enabled } = useOffline();
  const arabic = useArabicModel();
  const server = useQuery(api.arabic.lessons.getPath, onWeb(enabled, {}));
  if (!enabled) return server;
  return arabic === undefined ? undefined : (arabic?.path ?? null);
}

export function useHifzState() {
  const { enabled } = useOffline();
  const arabic = useArabicModel();
  const server = useQuery(api.arabic.memorization.getState, onWeb(enabled, {}));
  if (!enabled) return server;
  return arabic === undefined ? undefined : (arabic?.hifz ?? null);
}

export function useArabicLessonState(lessonKey: string) {
  const { enabled } = useOffline();
  const arabic = useArabicModel();
  const server = useQuery(api.arabic.lessons.getLessonState, onWeb(enabled, { lessonKey }));
  if (!enabled) return server;
  return arabic === undefined ? undefined : (arabic?.lessonState(lessonKey) ?? null);
}

type ArabicAttempt = Extract<OutboxEntry["event"], { kind: "arabicAttempt" }>;

/** Le résultat d'une leçon d'arabe : ses étoiles, son meilleur score. */
export type LessonOutcome = { stars: number; score: number };

/** Les gestes qui s'écrivent : au journal dans l'application, à Convex sur le web. */
export function useStudentActions() {
  const { enabled, engine, requestSync } = useOffline();
  const setSoundEnabledOnline = useMutation(api.streak.setSoundEnabled);
  const markLevelSeenOnline = useMutation(api.students.markLevelSeen);
  const markBadgesSeenOnline = useMutation(api.badges.markBadgesSeen);
  const recordAttemptOnline = useMutation(api.arabic.lessons.recordAttempt);
  const completeLessonOnline = useMutation(api.arabic.lessons.completeLesson);

  const setSoundEnabled = useCallback(
    (soundEnabled: boolean) => {
      if (!enabled) {
        void setSoundEnabledOnline({ enabled: soundEnabled }).catch(() => {});
        return;
      }
      engine?.enqueue({ kind: "soundEnabled", enabled: soundEnabled });
      requestSync();
    },
    [enabled, engine, requestSync, setSoundEnabledOnline],
  );

  const markLevelSeen = useCallback(
    (level: number) => {
      if (!enabled) {
        void markLevelSeenOnline({ level }).catch(() => {});
        return;
      }
      engine?.enqueue({ kind: "levelSeen", level });
      requestSync();
    },
    [enabled, engine, requestSync, markLevelSeenOnline],
  );

  const markBadgesSeen = useCallback(
    (badgeIds: readonly string[]) => {
      if (badgeIds.length === 0) return;
      if (!enabled) {
        // Sur le web, ces identifiants viennent du serveur (`badges.list`).
        void markBadgesSeenOnline({ badgeIds: badgeIds as Id<"badges">[] }).catch(() => {});
        return;
      }
      engine?.enqueue({ kind: "badgesSeen", badgeIds: [...badgeIds] });
      requestSync();
    },
    [enabled, engine, requestSync, markBadgesSeenOnline],
  );

  const recordArabicAttempt = useCallback(
    (attempt: Omit<ArabicAttempt, "kind" | "id" | "at">) => {
      if (!enabled) {
        void recordAttemptOnline(attempt).catch(() => {});
        return;
      }
      engine?.enqueue({ kind: "arabicAttempt", ...attempt });
      requestSync();
    },
    [enabled, engine, requestSync, recordAttemptOnline],
  );

  /**
   * Clôt une leçon et rend ses étoiles. Sur le web, le serveur les calcule ;
   * dans l'application, l'appareil les calcule avec la règle du serveur
   * (`progressRules.lessonScore`), qui les recalcule à la synchronisation.
   */
  const completeArabicLesson = useCallback(
    async (lessonKey: string): Promise<LessonOutcome> => {
      if (!enabled) {
        try {
          return await completeLessonOnline({ lessonKey });
        } catch {
          return { stars: 1, score: 0 };
        }
      }
      engine?.enqueue({ kind: "arabicLessonComplete", lessonKey });
      requestSync();
      await Promise.resolve();
      const state = engine?.model().arabic?.lessonState(lessonKey);
      return { stars: Math.max(1, state?.stars ?? 1), score: state?.bestScore ?? 0 };
    },
    [enabled, engine, requestSync, completeLessonOnline],
  );

  return useMemo(
    () => ({ setSoundEnabled, markLevelSeen, markBadgesSeen, recordArabicAttempt, completeArabicLesson }),
    [setSoundEnabled, markLevelSeen, markBadgesSeen, recordArabicAttempt, completeArabicLesson],
  );
}
