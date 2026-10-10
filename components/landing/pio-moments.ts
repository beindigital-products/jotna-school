import type { PioState } from "@/components/student/pio";
import { pioSays } from "@/lib/pioCopy";
import { typeset } from "./typeset";

/**
 * LES QUATRE MOMENTS OÙ PIO PARLE À L'ENFANT, dits à l'adulte qui visite la
 * page : ce qu'il fait, et la phrase qu'il prononce.
 *
 * Les phrases sont celles de l'application (`lib/pioCopy.ts`) et les poses
 * celles de `docs/pio-animations.md` : accueil → `hello`, bonne réponse →
 * `cheer`, mauvaise réponse → `encourage`, plus d'essais → `sad` (il serre ses
 * livres, jamais moqueur). Ce que dit le texte d'un moment est vrai de
 * l'application : un indice s'ouvre après une erreur, et quand il n'y a plus
 * d'essais (cinq dans la séance, `MAX_ATTEMPTS_PER_EXERCISE` ; trois dans la
 * démonstration des exercices), la bonne réponse s'affiche et « Je veux
 * comprendre » l'explique pas à pas.
 */
export type MomentId = "accueil" | "reussite" | "erreur" | "difficulte";

export type PioStory = {
  id: MomentId;
  title: string;
  text: string;
  pose: PioState;
  line: string;
};

const STORIES: readonly PioStory[] = [
  {
    id: "accueil",
    title: "Il accueille l'enfant",
    text: "Chaque aventure commence par un coucou, et Pio propose où reprendre.",
    pose: "hello",
    line: pioSays.coldStart(""),
  },
  {
    id: "reussite",
    title: "Il fête chaque réussite",
    text: "Bonne réponse, palier validé, série qui continue : Pio saute de joie.",
    pose: "cheer",
    line: `${pioSays.answerRight[0]} ${pioSays.answerRightSub[0]}`,
  },
  {
    id: "erreur",
    title: "Il encourage après une erreur",
    text: "Jamais de reproche : un indice s'ouvre, et l'enfant peut réessayer.",
    pose: "encourage",
    line: `${pioSays.answerWrong[0]} ${pioSays.answerWrongSub[0]}`,
  },
  {
    id: "difficulte",
    title: "Il rassure quand c'est difficile",
    text: "Quand il n'y a plus d'essais, la bonne réponse s'affiche et Pio propose de l'expliquer pas à pas.",
    pose: "sad",
    line: pioSays.answerOutSub,
  },
];

/** Les moments, avec la typographie française : « ! », « ? » et « : » ne passent jamais seuls à la ligne. */
export const MOMENTS: readonly PioStory[] = STORIES.map((story) => ({
  ...story,
  title: typeset(story.title),
  text: typeset(story.text),
  line: typeset(story.line),
}));

/**
 * Pio avant qu'on touche à quoi que ce soit : il fait coucou, et invite. C'est la
 * pose de la page d'accueil, dont le clip est donc déjà chargé : la scène ne coûte
 * rien de plus au départ. (La pose `idle` a une ombre claire sous les pattes, qui
 * fait une tache pâle sur la savane.)
 */
export const MEET_BASE: { pose: PioState; line: string } = {
  pose: "hello",
  line: typeset("Moi, c'est Pio ! Touche-moi, ou choisis un moment."),
};

/** Pio tout en haut de la page, à côté de la carte d'exercice : il fait coucou. */
export const HERO_BASE: { pose: PioState; line: string } = {
  pose: "hello",
  line: typeset("Salut ! Moi, c'est Pio. Touche-moi !"),
};
