"use client";

/**
 * LES DONNÉES DE L'ESPACE ÉLÈVE, LUES SUR L'APPAREIL.
 *
 * Chaque hook remplace une requête du serveur et rend la même forme :
 *
 *   useStudentStats       students.getMyStats
 *   useWorldMap           students.getMyWorldMap
 *   useNextStep           students.getMyNextStep
 *   useSubjectMap         students.getStudentSubjectMap
 *   useDailyQuests        quests.getMyDaily
 *   useStudentModules     modules.getMine
 *   useSoundPreference    students.getMySoundEnabled
 *   useBadgeShowcase      badges.list + listMyEarned + getMyBadgeProgress
 *   useArabicPath         arabic.lessons.getPath
 *   useHifzState          arabic.memorization.getState
 *   useArabicLessonState  arabic.lessons.getLessonState
 *
 * Elles se calculent sur le moteur hors ligne (`lib/offline/model.ts`) : le
 * paquet du dernier passage du réseau, plus ce que l'enfant a fait depuis.
 * Avec ou sans réseau, l'écran lit la même chose. `undefined` veut dire
 * « l'appareil se relit », comme une requête qui charge.
 *
 * Les écritures passent par `useStudentActions` : elles s'inscrivent au
 * journal, et partent au serveur quand il est joignable.
 */
import { useCallback, useMemo } from "react";
import { useOffline, useOfflineModel } from "@/components/offline/context";
import type { OutboxEntry } from "@/lib/offline/types";

export function useStudentStats() {
  const model = useOfflineModel();
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
  const model = useContentModel();
  return model === undefined ? undefined : (model?.worldMap ?? null);
}

export function useNextStep() {
  const model = useContentModel();
  return model === undefined ? undefined : (model?.nextStep ?? null);
}

export function useSubjectMap(subjectId: string) {
  const model = useContentModel();
  if (model === undefined) return undefined;
  return model?.subjectMaps.get(subjectId) ?? null;
}

export function useDailyQuests() {
  const model = useOfflineModel();
  return model === undefined ? undefined : (model?.daily ?? null);
}

export function useStudentModules() {
  const model = useOfflineModel();
  return model === undefined ? undefined : (model?.modules ?? []);
}

export function useSoundPreference() {
  const model = useOfflineModel();
  if (model === undefined) return undefined;
  if (!model || !model.stats) return null;
  return { soundEnabled: model.soundEnabled === true, decided: model.soundEnabled !== null };
}

/** La vitrine des trophées : le catalogue, ce qui est gagné, où en est l'enfant. */
export function useBadgeShowcase() {
  const model = useOfflineModel();
  return useMemo(() => {
    if (model === undefined) return undefined;
    if (!model) return null;
    return {
      catalog: model.badgeCatalog,
      earned: model.earned.map((e) => ({ badgeId: e.badgeId, earnedAt: e.earnedAt, badge: e.badge })),
      progress: model.badgeProgress,
    };
  }, [model]);
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
  const arabic = useArabicModel();
  return arabic === undefined ? undefined : (arabic?.path ?? null);
}

export function useHifzState() {
  const arabic = useArabicModel();
  return arabic === undefined ? undefined : (arabic?.hifz ?? null);
}

export function useArabicLessonState(lessonKey: string) {
  const arabic = useArabicModel();
  return arabic === undefined ? undefined : (arabic?.lessonState(lessonKey) ?? null);
}

type ArabicAttempt = Extract<OutboxEntry["event"], { kind: "arabicAttempt" }>;

/** Les gestes qui s'écrivent : au journal d'abord, au serveur ensuite. */
export function useStudentActions() {
  const { engine, requestSync } = useOffline();

  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      engine?.enqueue({ kind: "soundEnabled", enabled });
      requestSync();
    },
    [engine, requestSync],
  );

  const markLevelSeen = useCallback(
    (level: number) => {
      engine?.enqueue({ kind: "levelSeen", level });
      requestSync();
    },
    [engine, requestSync],
  );

  const markBadgesSeen = useCallback(
    (badgeIds: readonly string[]) => {
      if (badgeIds.length === 0) return;
      engine?.enqueue({ kind: "badgesSeen", badgeIds: [...badgeIds] });
      requestSync();
    },
    [engine, requestSync],
  );

  const recordArabicAttempt = useCallback(
    (attempt: Omit<ArabicAttempt, "kind" | "id" | "at">) => {
      engine?.enqueue({ kind: "arabicAttempt", ...attempt });
      requestSync();
    },
    [engine, requestSync],
  );

  const completeArabicLesson = useCallback(
    (lessonKey: string) => {
      engine?.enqueue({ kind: "arabicLessonComplete", lessonKey });
      requestSync();
    },
    [engine, requestSync],
  );

  return useMemo(
    () => ({ setSoundEnabled, markLevelSeen, markBadgesSeen, recordArabicAttempt, completeArabicLesson }),
    [setSoundEnabled, markLevelSeen, markBadgesSeen, recordArabicAttempt, completeArabicLesson],
  );
}
