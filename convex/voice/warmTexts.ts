/**
 * LES SONS À PRÉCHAUFFER — ce que la voix dira pour un exercice, mot pour mot.
 *
 * Au CI, Pio dit la consigne puis chaque proposition (`voice/tiles.ts`). Un son
 * jamais entendu se synthétise à la demande : le premier enfant qui rencontre le
 * mot attend une à deux secondes. Ce module dit quels textes synthétiser
 * d'avance. Il passe par la MÊME décision que le serveur (`tileClipVerdict`),
 * donc par le même texte et la même clé de cache que la requête de l'enfant : un
 * son préchauffé que personne ne redemanderait coûterait pour rien.
 *
 * MODULE PUR (voir `tiles.ts`) : la lecture de la base, la voix et le stockage
 * sont dans `warm.ts`.
 */
import { isReadingLearnerClass } from "../curriculum";
import { speakableExercise } from "./speakable";
import { readableTextsOf, tileClipVerdict } from "./tiles";

export type WarmExercise = { type: string; prompt: string; payload: unknown };
export type WarmTopic = { programmeKey?: string | null; subjectName?: string | null };

/**
 * Les textes dits pour cet exercice, sans doublon : chaque tuile (et la phrase à
 * trous) que le serveur accepte de dire et, si on le demande, la consigne, que
 * `offline/voice:prepareClips` dit à tout enfant qui apprend à lire.
 */
export function spokenTextsOf(args: {
  /** La classe du palier : l'enfant du CI y joue. */
  learnerClass: string;
  topic: WarmTopic;
  exercise: WarmExercise;
  withPrompt: boolean;
}): string[] {
  const spoken = new Set<string>();
  for (const text of readableTextsOf(args.exercise.type, args.exercise.payload)) {
    const verdict = tileClipVerdict({ learnerClass: args.learnerClass, topic: args.topic, exercise: args.exercise, text });
    if (verdict.ok) spoken.add(verdict.text);
  }
  if (args.withPrompt && isReadingLearnerClass(args.learnerClass)) {
    const prompt = speakableExercise(args.exercise.type, args.exercise.prompt);
    if (prompt) spoken.add(prompt);
  }
  return [...spoken];
}

/**
 * Ce que coûte la synthèse, en dollars pour mille caractères : un ordre de
 * grandeur arrondi au-dessus. Le 20 octobre 2026, 877 textes de tuile
 * (16 400 caractères) étaient estimés à 3 à 5 dollars.
 */
export const COST_PER_1000_CHARS_USD = 0.3;

export function estimatedCostUsd(chars: number): number {
  return Math.round((Math.max(0, chars) / 1000) * COST_PER_1000_CHARS_USD * 100) / 100;
}
