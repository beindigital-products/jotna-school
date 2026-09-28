/**
 * CE QU'ON DIT À L'ENFANT dans le module « Arabe & Coran ».
 *
 * Même doctrine que `lib/kidCopy.ts`, dont ce fichier est le pendant : ton
 * encourageant, jamais culpabilisant, et toujours une suite. Rassemblé ici
 * pour qu'un enseignant puisse relire les phrases du module sans ouvrir douze
 * composants — et pour qu'on n'écrive pas « raté » un soir de fatigue.
 *
 * DEUX RÈGLES PROPRES À CE MODULE :
 *
 *   1. ON NE DIT JAMAIS QU'UNE PRONONCIATION EST FAUSSE. On dit ce qu'on a
 *      entendu et on propose de réécouter. La transcription automatique se
 *      trompe — surtout sur une syllabe d'une seconde dite par un enfant de
 *      six ans — et lui affirmer « c'est faux » sur une erreur de machine
 *      serait à la fois injuste et décourageant ;
 *   2. LE CORAN N'EST PAS UN JEU. Les félicitations y sont sobres : pas de
 *      confettis ni de « champion » sur un verset. On dit « c'est lu », on
 *      avance.
 */

import type { PronunciationVerdict } from "@/convex/arabic/matching";

export const arabicCopy = {
  moduleTitle: "Arabe & Coran",
  moduleTagline: "Apprends à lire l'arabe, lettre après lettre.",

  notEnabled: {
    title: "Ce module n'est pas ouvert dans ton école",
    body: "Ton école peut l'activer quand elle le souhaite. Parles-en à ton maître ou à ta maîtresse !",
  },

  lockedLesson: "Termine la leçon d'avant pour ouvrir celle-ci 🔒",

  listen: {
    idle: "Écouter",
    loading: "Un instant…",
    replay: "Réécouter",
    unavailable: "Le son n'est pas disponible pour le moment.",
    notConfigured:
      "La voix n'est pas encore installée sur cette école. Tu peux quand même lire et écrire !",
  },

  record: {
    idle: "À toi ! Appuie et répète",
    recording: "Je t'écoute…",
    sending: "Je réfléchis…",
    again: "Réessayer",
    denied:
      "Je n'ai pas accès au micro. Demande à un adulte d'autoriser le micro pour cette page.",
    unsupported:
      "Ce navigateur ne sait pas enregistrer. Tu peux passer à la suite !",
    quota:
      "Tu as beaucoup répété aujourd'hui, bravo 🌙 Le micro revient demain — continue à lire et à écrire !",
    unavailable:
      "Je n'ai pas réussi à t'écouter cette fois. On passe à la suite, ce n'est rien.",
  },

  write: {
    instruction: "Écris la lettre avec ton doigt, en partant de la droite ➡️",
    clear: "Effacer",
    validate: "C'est écrit !",
    empty: "Trace la lettre avant de valider 🙂",
    wrongDirection:
      "Petit rappel : en arabe, on écrit de la DROITE vers la gauche.",
  },

  verdicts: {
    ok: ["Bravo ! C'est exactement ça 🌟", "Parfait ! Tu l'as bien dit 🌟"],
    close: [
      "Presque ! Réécoute et redis-le une fois.",
      "Tu y es presque — écoute bien la fin du son.",
    ],
    retry: [
      "Je n'ai pas bien entendu. Approche-toi du micro et réessaie !",
      "On réessaie ensemble : écoute d'abord, puis répète.",
    ],
  },

  heardPrefix: "J'ai entendu :",

  lessonDone: {
    title: (stars: number) => `Leçon terminée ! ${"⭐".repeat(stars)}`,
    body: "Tu peux la refaire quand tu veux pour gagner plus d'étoiles.",
    next: "Leçon suivante",
    back: "Retour au parcours",
  },

  quranNote:
    "On lit doucement, verset par verset. Écoute d'abord, puis lis à ton tour.",

  /**
   * LA MÉMORISATION SE DIT AUTREMENT. Ici l'enfant ne déchiffre pas : il donne
   * ce qu'il a gardé, et se tromper veut dire avoir oublié — ce qui pique
   * bien plus qu'une lettre mal lue. Deux règles en découlent :
   *
   *   - ON NE DIT JAMAIS « tu as oublié ». On dit où l'on s'est arrêté, et on
   *     propose de réécouter. C'est ce que fait un maître qui souffle le mot
   *     suivant, et c'est aussi la seule chose honnête : la transcription peut
   *     très bien avoir manqué un mot que l'enfant a dit ;
   *   - ON NE FÉLICITE PAS UNE SOURATE COMME UN NIVEAU PASSÉ. Pas de « tu as
   *     débloqué », pas de confettis. « C'est récité » suffit, et la révision
   *     prévue dit la suite.
   */
  memorize: {
    listenFirst: "Écoute bien, puis récite",
    hintsNote: "Je te laisse la première lettre de chaque mot.",
    hiddenNote: "À toi, de mémoire.",
    linkTitle: "Enchaîne, sans reprendre le départ",
    words: (count: number) =>
      count === 1 ? "1 mot à dire" : `${count} mots à dire`,
    stoppedAt: "On s'est arrêté ici :",
    due: "À réviser aujourd'hui",
    reviewOn: (days: number) =>
      days <= 0
        ? "À réviser aujourd'hui"
        : days === 1
          ? "À réviser demain"
          : `À réviser dans ${days} jours`,
    versesHeld: (held: number, total: number) =>
      held === 0
        ? `${total} versets à apprendre`
        : held >= total
          ? "Sourate entière sue"
          : `${held} versets sur ${total}`,
    readFirst:
      "Lis d'abord cette sourate dans « Mes premières sourates » — on ne mémorise pas ce qu'on ne sait pas lire.",
  },
} as const;

/**
 * La phrase de verdict, choisie sans hasard : la même tentative donne toujours
 * la même phrase, sinon un enfant qui réécoute croit que le verdict a changé.
 */
export function verdictMessage(
  verdict: PronunciationVerdict,
  attemptIndex: number,
): string {
  const choices = arabicCopy.verdicts[verdict];
  return choices[attemptIndex % choices.length];
}
