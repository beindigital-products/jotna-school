/**
 * LES MISSIONS DU JOUR — les règles, pures.
 *
 * Fonctions sans aucun import, comme `roleRules.ts`, `linkRules.ts` et
 * `profileRules.ts` : c'est ce qui les rend testables dans un dépôt sans
 * `convex-test`. `convex/quests.ts` ne fait que lire, appeler ici, écrire.
 *
 * TROIS MISSIONS PAR JOUR, TOUJOURS UNE FACILE. La conception de juillet (§6)
 * l'exige, et c'est la mécanique de retour la plus éprouvée : une mission
 * qu'on peut finir en cinq minutes ramène l'enfant demain. Les deux autres
 * demandent un peu plus.
 *
 * LA SÉLECTION EST DÉTERMINISTE, semée par (élève, jour). Deux appareils, ou
 * un rechargement, tirent les mêmes missions ; et un test peut affirmer ce
 * qu'un jour donné produit. Le générateur est `mulberry32` sur un hachage
 * FNV-1a de la graine — quelques lignes, aucune dépendance.
 *
 * LA RÉCOMPENSE EST MODESTE ET PLAFONNÉE : une étoile par mission, deux de
 * plus quand les trois sont faites — cinq étoiles au plus par jour. Les
 * étoiles se gagnent en jouant ; les missions les saupoudrent, elles ne les
 * remplacent pas.
 */
export type QuestType =
  | "do_exercises"
  | "earn_stars"
  | "validate_palier"
  | "play_subject";

export type Quest = {
  key: string;
  type: QuestType;
  label: string;
  target: number;
  progress: number;
  completedAt?: number;
  subjectId?: string;
  subjectName?: string;
};

/** Ce qu'une fin de palier rapporte, tel que `submitPalier` le connaît. */
export type ActivityEvent = {
  exercises: number;
  stars: number;
  palierValidated: boolean;
  subjectId?: string;
};

export type SubjectOption = { id: string; name: string };

export const QUESTS_PER_DAY = 3;
export const STAR_PER_QUEST = 1;
export const ALL_DONE_BONUS = 2;
/** Plafond de vie des étoiles de mission, pour que le champ reste borné. */
export const QUEST_BONUS_CAP = 10_000;

// ---------------------------------------------------------------------------
// Hasard reproductible
// ---------------------------------------------------------------------------

/** FNV-1a 32 bits : une graine numérique depuis une chaîne. */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 : rapide, suffisant pour tirer trois missions. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

// ---------------------------------------------------------------------------
// Sélection
// ---------------------------------------------------------------------------

const EASY_TARGETS = [3, 4, 5] as const;
const STAR_TARGETS = [6, 8, 10] as const;
const SUBJECT_TARGETS = [3, 4] as const;

export function labelFor(quest: Pick<Quest, "type" | "target" | "subjectName">): string {
  switch (quest.type) {
    case "do_exercises":
      return `Fais ${quest.target} exercices`;
    case "earn_stars":
      return `Gagne ${quest.target} étoiles`;
    case "validate_palier":
      return "Réussis un palier";
    case "play_subject":
      return `Fais ${quest.target} exercices en ${quest.subjectName ?? "une matière"}`;
  }
}

/**
 * Les trois missions d'un jour donné.
 *
 *   1. la facile : quelques exercices, toujours ;
 *   2. la moyenne : des étoiles, ou un palier réussi ;
 *   3. la couleur : des exercices dans une matière tirée au sort — ou des
 *      étoiles si aucune matière n'est jouable.
 */
export function pickDailyQuests(input: {
  seed: string;
  subjects: readonly SubjectOption[];
}): Quest[] {
  const random = rng(seedFrom(input.seed));

  const easy: Quest = {
    key: "q1",
    type: "do_exercises",
    target: pick(random, EASY_TARGETS),
    progress: 0,
    label: "",
  };
  easy.label = labelFor(easy);

  const medium: Quest =
    random() < 0.5
      ? { key: "q2", type: "earn_stars", target: pick(random, STAR_TARGETS), progress: 0, label: "" }
      : { key: "q2", type: "validate_palier", target: 1, progress: 0, label: "" };
  medium.label = labelFor(medium);

  let flavor: Quest;
  if (input.subjects.length > 0) {
    const subject = pick(random, input.subjects);
    flavor = {
      key: "q3",
      type: "play_subject",
      target: pick(random, SUBJECT_TARGETS),
      progress: 0,
      label: "",
      subjectId: subject.id,
      subjectName: subject.name,
    };
  } else {
    flavor = { key: "q3", type: "earn_stars", target: pick(random, STAR_TARGETS), progress: 0, label: "" };
  }
  flavor.label = labelFor(flavor);

  return [easy, medium, flavor];
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

function gainFor(quest: Quest, event: ActivityEvent): number {
  switch (quest.type) {
    case "do_exercises":
      return event.exercises;
    case "earn_stars":
      return event.stars;
    case "validate_palier":
      return event.palierValidated ? 1 : 0;
    case "play_subject":
      return quest.subjectId && event.subjectId === quest.subjectId ? event.exercises : 0;
  }
}

/**
 * Applique une fin de palier aux missions. Une mission finie ne bouge plus ;
 * la progression est bornée à la cible ; `completedAt` se pose une seule fois.
 */
export function applyActivity(
  quests: readonly Quest[],
  event: ActivityEvent,
  now: number,
): { quests: Quest[]; newlyCompleted: Quest[] } {
  const newlyCompleted: Quest[] = [];
  const next = quests.map((quest) => {
    if (quest.completedAt !== undefined) return quest;
    const gain = gainFor(quest, event);
    if (gain <= 0) return quest;
    const progress = Math.min(quest.target, quest.progress + gain);
    const done = progress >= quest.target;
    const updated: Quest = done
      ? { ...quest, progress, completedAt: now }
      : { ...quest, progress };
    if (done) newlyCompleted.push(updated);
    return updated;
  });
  return { quests: next, newlyCompleted };
}

export function completedCount(quests: readonly Quest[]): number {
  return quests.filter((q) => q.completedAt !== undefined).length;
}

export function allDone(quests: readonly Quest[]): boolean {
  return quests.length > 0 && completedCount(quests) === quests.length;
}

/** Les étoiles dues pour `completed` missions faites sur `total`. */
export function bonusStarsFor(completed: number, total: number): number {
  if (completed <= 0) return 0;
  const base = completed * STAR_PER_QUEST;
  return total > 0 && completed >= total ? base + ALL_DONE_BONUS : base;
}
