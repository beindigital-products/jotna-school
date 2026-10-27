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
import { staticVoiceUrl } from "../../lib/voice-static";
import { speakableExercise } from "./speakable";
import { readableTextsOf, tileClipVerdict, type TileLang } from "./tiles";

export type WarmExercise = { type: string; prompt: string; payload: unknown };
export type WarmTopic = { programmeKey?: string | null; subjectName?: string | null };

/** Un son à préchauffer : le texte et la voix qui le dit (la clé de cache porte la voix). */
export type WarmClip = { text: string; lang: TileLang };

/**
 * Écarte les sons que l'application embarque (`lib/voice-static`) : ils ne passent jamais par le cache du serveur, les
 * payer serait un crédit perdu. Seule la voix anglaise des tuiles est embarquée : le même texte en français est un
 * autre son et reste.
 */
export function withoutEmbedded(clips: readonly WarmClip[]): { kept: WarmClip[]; embedded: number } {
  const kept = clips.filter((clip) => !(clip.lang === "en" && staticVoiceUrl(clip.text) !== null));
  return { kept, embedded: clips.length - kept.length };
}

/**
 * Les sons dits pour cet exercice, sans doublon : chaque tuile (et la phrase à
 * trous) que le serveur accepte de dire, avec sa langue, et, si on le demande,
 * la consigne, que `offline/voice:prepareClips` dit à tout enfant qui apprend à lire.
 */
export function spokenClipsOf(args: {
  /** La classe du palier : l'enfant du CI y joue. */
  learnerClass: string;
  topic: WarmTopic;
  exercise: WarmExercise;
  withPrompt: boolean;
}): WarmClip[] {
  const spoken = new Map<string, WarmClip>();
  const add = (clip: WarmClip) => spoken.set(`${clip.lang}|${clip.text}`, clip);
  for (const text of readableTextsOf(args.exercise.type, args.exercise.payload)) {
    const verdict = tileClipVerdict({ learnerClass: args.learnerClass, topic: args.topic, exercise: args.exercise, text });
    if (verdict.ok) add({ text: verdict.text, lang: verdict.lang });
  }
  if (args.withPrompt && isReadingLearnerClass(args.learnerClass)) {
    const prompt = speakableExercise(args.exercise.type, args.exercise.prompt);
    if (prompt) add({ text: prompt, lang: "fr" });
  }
  return [...spoken.values()];
}

/** Les textes seuls de `spokenClipsOf`, sans doublon (la langue ne compte pas ici). */
export function spokenTextsOf(args: Parameters<typeof spokenClipsOf>[0]): string[] {
  return [...new Set(spokenClipsOf(args).map((clip) => clip.text))];
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
