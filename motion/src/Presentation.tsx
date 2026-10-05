import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, interpolate, staticFile } from "remotion";
import { BrandWipe, WIPE_CUT, WIPE_FRAMES } from "./components/wipe";
import { Intro } from "./scenes/Intro";
import { Landing } from "./scenes/Landing";
import { SchoolScene } from "./scenes/School";
import { ParentsScene } from "./scenes/Parents";
import { TeachersScene } from "./scenes/Teachers";
import { StudentsScene, STUDENTS_FRAMES } from "./scenes/Students";
import { Outro, OUTRO_FRAMES } from "./scenes/Outro";
import { type SceneId, voiceIntervals } from "./voice";

// L'ordre suit la demande : le site, l'école, les parents, les profs, puis
// le parcours des élèves dans l'application, et la signature.
export const SCENES: { id: SceneId; component: React.FC; frames: number }[] = [
  { id: "intro", component: Intro, frames: 180 },
  { id: "landing", component: Landing, frames: 360 },
  { id: "school", component: SchoolScene, frames: 480 },
  { id: "parents", component: ParentsScene, frames: 390 },
  { id: "teachers", component: TeachersScene, frames: 420 },
  { id: "students", component: StudentsScene, frames: STUDENTS_FRAMES },
  { id: "outro", component: Outro, frames: OUTRO_FRAMES },
];

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + s.frames, 0);

const starts = SCENES.reduce<Record<SceneId, number>>(
  (acc, s, i) => ({ ...acc, [s.id]: i === 0 ? 0 : acc[SCENES[i - 1].id] + SCENES[i - 1].frames }),
  {} as Record<SceneId, number>,
);

const boundaries = SCENES.slice(1).map((s) => starts[s.id]);

// Musique de fond très basse (Mixkit, « Let's Play Africa »), normalisée à
// -16 LUFS par scripts/prepare-audio.sh : 0,16 la place vers -32 LUFS, et
// elle descend encore (0,07, vers -39 LUFS) dès qu'une voix parle.
const MUSIC_BASE = 0.16;
const MUSIC_UNDER_VOICE = 0.07;
const VOICES = voiceIntervals(starts);

const musicVolume = (f: number) => {
  let duck = 0;
  for (const [a, b] of VOICES) {
    const d = interpolate(f, [a - 8, a, b, b + 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    duck = Math.max(duck, d);
  }
  return MUSIC_BASE + (MUSIC_UNDER_VOICE - MUSIC_BASE) * duck;
};

export const Presentation: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
    <Series>
      {SCENES.map((s) => {
        const Scene = s.component;
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <Scene />
          </Series.Sequence>
        );
      })}
    </Series>
    {boundaries.map((b) => (
      <Sequence key={b} from={b - WIPE_CUT} durationInFrames={WIPE_FRAMES}>
        <BrandWipe />
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.8} />
      </Sequence>
    ))}
    <Audio src={staticFile("audio/music/lets-play-africa.mp3")} volume={musicVolume} />
  </AbsoluteFill>
);
