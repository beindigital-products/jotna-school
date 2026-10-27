/**
 * LES SONS QUE L'ON EMBARQUE : la liste, calculée, jamais écrite à la main.
 *
 * Les six thématiques d'alphabet de l'anglais (le CI, le CP) ne disent qu'un petit nombre de textes : le nom d'une
 * lettre, une suite de lettres, un prénom épelé, un des 25 mots-images. Quelle que soit la graine d'un palier, on retombe
 * sur les mêmes quelques centaines de textes (312 après 200 graines : la courbe est plate dès 60). Plutôt que de les payer
 * à ElevenLabs puis de les télécharger un par un depuis le serveur, on les met dans l'application (`public/voix/`).
 *
 * BUILD SEULEMENT : ce module tire tous les gabarits d'exercices. Il ne doit JAMAIS être importé par un écran ; l'écran
 * lit `lib/voice-static/index.ts`, qui ne contient que la table texte -> fichier.
 *
 * Le texte d'un son est EXACTEMENT celui que le serveur ferait synthétiser (`spokenClipsOf` : la même décision que
 * `voice/warm`) : un son embarqué et un son du cache disent la même chose.
 */
import { allProgrammeEntries } from "@/convex/programme";
import { generateGames } from "@/convex/paliers/games";
import { spokenClipsOf } from "@/convex/voice/warmTexts";

/** Les thématiques dont tous les sons tiennent dans l'application. */
export const STATIC_VOICE_TOPICS: readonly string[] = [
  "an-ci-abc-1",
  "an-ci-abc-2",
  "an-ci-abc-3",
  "an-cp-abc",
  "an-cp-sounds",
  "an-cp-name",
];

/** Les graines essayées pour relever les textes : au-delà de 60, la liste ne bouge presque plus. */
export const STATIC_VOICE_SEEDS = 300;

/**
 * Les textes anglais distincts des thématiques d'alphabet, triés, tels que la voix les dirait. `seedPrefix` change les
 * graines : un test relève ainsi des tirages que la liste n'a jamais vus.
 */
export function staticVoiceTexts(seeds: number = STATIC_VOICE_SEEDS, seedPrefix: string = "static-voice"): string[] {
  const texts = new Set<string>();
  for (const entry of allProgrammeEntries().filter((candidate) => STATIC_VOICE_TOPICS.includes(candidate.topic.key))) {
    const count = entry.topic.palierCount ?? 3;
    for (let seed = 0; seed < seeds; seed++) {
      for (let palier = 1; palier <= count; palier++) {
        const games = generateGames(entry.topic.games ?? [], {
          klass: entry.klass,
          palierIndex: palier,
          palierCount: count,
          seed: `${seedPrefix}:${entry.topic.key}:${seed}:${palier}`,
          windowed: entry.topic.byLevel,
        });
        for (const game of games) {
          const clips = spokenClipsOf({
            learnerClass: entry.klass,
            topic: { programmeKey: entry.topic.key },
            exercise: { type: game.type, prompt: game.prompt, payload: game.payload },
            withPrompt: false,
          });
          for (const clip of clips) if (clip.lang === "en") texts.add(clip.text);
        }
      }
    }
  }
  return [...texts].sort((a, b) => a.localeCompare(b));
}
