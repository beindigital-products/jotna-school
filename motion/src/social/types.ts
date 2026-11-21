/*
 * Le format d'une publication. `posts.json` (lu aussi par scripts/social-voices.mjs)
 * contient les 28 publications ; chaque vidéo est une suite de plans (`beats`),
 * dont la durée vient des voix qui y sont dites.
 */

export type Who = "rachel" | "steve";

export type VoiceLine = {
  text: string;
  /** Rachel : voix off des pubs, explications et tutoriels. Steve : la voix de Pio et de l'application (vidéos pour enfants). */
  who?: Who;
  /** "v2" : eleven_multilingual_v2, pour un mot arabe (eleven_v4 le dit mal). Sinon eleven_v4. */
  model?: "v2";
  /** Silence avant la réplique, en secondes (le temps de réfléchir, dans un quiz). */
  pause?: number;
};

export type Pose =
  | "amazed" | "cheer" | "encourage" | "hello" | "idle" | "sad" | "sleep" | "think" | "walk"
  | "bravo" | "listen" | "recite" | "salam" | "walkAway" | "walkToward";

export type Screen = "camp" | "trail" | "session" | "result" | "quran";

export type BeatBase = {
  voices?: VoiceLine[];
  /** Durée minimale du plan en secondes (s'il y a moins de voix). */
  min?: number;
  /** Respiration après la dernière voix, en secondes. */
  tail?: number;
  tone?: "warm" | "lime" | "sky" | "cream" | "night";
};

export type Beat = BeatBase &
  (
    | { kind: "hook"; title: string; marker?: string; pose?: Pose; outfit?: "classic" | "boubou"; kicker?: string }
    | { kind: "pio"; text?: string; pose: Pose; outfit?: "classic" | "boubou"; title?: string }
    | { kind: "phone"; screen: Screen; title?: string; caption?: string; os?: "ios" | "android" }
    | { kind: "bullets"; title: string; items: { icon?: string; text: string }[] }
    | { kind: "steps"; title: string; items: { text: string; sub?: string }[] }
    | { kind: "stat"; value: string; label: string; sub?: string }
    | { kind: "quiz"; question: string; options: string[]; answer: number; hint?: string; explain?: string }
    | { kind: "board"; title: string; lines: { text: string; big?: boolean }[] }
    | { kind: "letter"; glyph: string; name: string; sound?: string }
    | { kind: "free"; sub?: string[] }
    | { kind: "outro"; line?: string }
    | { kind: "cta"; line?: string; button?: string }
  );

export type Post = {
  id: string;
  day: number;
  slot: "midi" | "soir";
  /** pub | explicatif | tutoriel | enfants | visuel */
  type: "pub" | "explicatif" | "tutoriel" | "enfants" | "visuel";
  audience: "parents" | "ecoles" | "profs" | "enfants" | "tous";
  title: string;
  /** Pour un cours : « CM1 · Mathématiques », affiché en bandeau sur tous les plans. */
  level?: string;
  format: "video" | "carousel";
  music?: "africa" | "none";
  beats: Beat[];
  /** Pour un carrousel : la suite de visuels (1080 × 1350). */
  slides?: { title: string; body?: string; accent?: string }[];
  caption: { tiktok: string; instagram: string; facebook: string };
  hashtags: string[];
  /** Description du visuel de couverture / première image. */
  cover: string;
};
