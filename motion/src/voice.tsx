import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/*
 * LES VOIX DE LA VIDÉO, et le minutage qui en dépend.
 *
 * Deux voix :
 * - la voix off, « Rachel – Clear and Engaging » de la bibliothèque ElevenLabs
 *   (identifiant or4EV8aZq78KWcXw48wd, français standard, modèle eleven_v4,
 *   stabilité 0,5). Le propriétaire veut une voix douce, comme une
 *   présentatrice de télévision, et pas robotique. La voix lui va, mais sur
 *   eleven_v3 il trouvait le ton robotique et voulait « un peu d'émotion » :
 *   chaque réplique porte donc une indication de ton entre crochets
 *   ([warmly], [enthusiastic]…), que le modèle joue sans la prononcer, et
 *   des points de suspension pour les respirations. Les indications les plus
 *   fortes ([excited], [delighted]) faisaient monter la voix de 8 à 10
 *   demi-tons : écartées, trop appuyées ;
 * - la voix de l'application, Steve, telle que l'élève l'entendra dans le
 *   module Arabe & Coran : synthétisée avec les réglages de
 *   `convex/voice/elevenlabs.ts` (français sur eleven_v4, nom de la lettre
 *   sur eleven_multilingual_v2), le cache de l'application n'ayant pas encore
 *   la nouvelle voix.
 * Les fichiers bruts sont dans `audio-src/`, leurs versions normalisées dans
 * `public/audio/` (`scripts/prepare-audio.sh`).
 *
 * Les durées sont en images à 30 i/s, arrondies au-dessus, mesurées sur les
 * fichiers. Si une réplique est régénérée, mettre sa durée à jour ici.
 */

export type SceneId = "intro" | "landing" | "school" | "parents" | "teachers" | "students" | "outro";

/** Découpage de la scène des élèves (images, dans la scène). */
export const STUDENT_TIMING = (() => {
  const quran = 656;
  const quranLength = 364;
  const lesson = quran + quranLength - 6;
  const lessonLength = 600;
  return {
    splash: [0, 46],
    camp: [40, 152],
    trail: [186, 170],
    session: [350, 172],
    result: [516, 146],
    quran: [quran, quranLength],
    lesson: [lesson, lessonLength],
    total: lesson + lessonLength,
    // Dans la séquence du chemin du Coran.
    path: { descendEnd: 112, walkAt: 160, cardAt: 232, tapAt: 352, welcomeAt: 166, narrationAt: 4 },
    // Dans la séquence de la leçon.
    lessonCues: { meetAt: 12, jimAt: 124, repeatAt: 170, micAt: 300, verifyAt: 410, successAt: 500, narrationAt: 302 },
  } as const;
})();

export type Cue = { scene: SceneId; at: number; file: string; frames: number; kind: "narration" | "app" };

const T = STUDENT_TIMING;
const Q = T.quran[0];
const L = T.lesson[0];

export const CUES: Cue[] = [
  { scene: "intro", at: 24, file: "voice-off/n01_intro", frames: 140, kind: "narration" },
  { scene: "landing", at: 22, file: "voice-off/n02_site", frames: 168, kind: "narration" },
  { scene: "school", at: 24, file: "voice-off/n03_ecole", frames: 372, kind: "narration" },
  { scene: "parents", at: 24, file: "voice-off/n04_parents", frames: 245, kind: "narration" },
  { scene: "teachers", at: 22, file: "voice-off/n05_profs", frames: 279, kind: "narration" },
  { scene: "students", at: 16, file: "voice-off/n06_app", frames: 144, kind: "narration" },
  { scene: "students", at: 196, file: "voice-off/n07_paliers", frames: 132, kind: "narration" },
  { scene: "students", at: 524, file: "voice-off/n08_recompenses", frames: 125, kind: "narration" },
  { scene: "students", at: Q + T.path.narrationAt, file: "voice-off/n09_arabe", frames: 144, kind: "narration" },
  { scene: "students", at: Q + T.path.welcomeAt, file: "voice-app/map_welcome", frames: 142, kind: "app" },
  { scene: "students", at: L + T.lessonCues.meetAt, file: "voice-app/meet", frames: 80, kind: "app" },
  { scene: "students", at: L + T.lessonCues.jimAt, file: "voice-app/jim", frames: 30, kind: "app" },
  { scene: "students", at: L + T.lessonCues.repeatAt, file: "voice-app/repeat", frames: 96, kind: "app" },
  { scene: "students", at: L + T.lessonCues.narrationAt, file: "voice-off/n10_consignes", frames: 176, kind: "narration" },
  { scene: "students", at: L + T.lessonCues.successAt + 2, file: "voice-app/bravo_2", frames: 60, kind: "app" },
  { scene: "outro", at: 92, file: "voice-off/n11_outro", frames: 166, kind: "narration" },
];

/** Joue les répliques d'une scène (à poser dans la scène, minutage local). */
export const VoiceCues: React.FC<{ scene: SceneId }> = ({ scene }) => (
  <>
    {CUES.filter((c) => c.scene === scene).map((c) => (
      <Sequence key={c.file} from={c.at} durationInFrames={c.frames + 4} layout="none">
        <Audio src={staticFile(`audio/${c.file}.mp3`)} volume={1} />
      </Sequence>
    ))}
  </>
);

/** Les intervalles (images globales) où une voix parle, pour baisser la musique. */
export const voiceIntervals = (sceneStart: Record<SceneId, number>) =>
  CUES.map((c) => [sceneStart[c.scene] + c.at, sceneStart[c.scene] + c.at + c.frames] as const);
