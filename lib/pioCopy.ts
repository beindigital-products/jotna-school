/**
 * CE QUE DIT PIO — les répliques de la mascotte dans le monde de jeu.
 *
 * Même règle que `lib/kidCopy.ts` : un enfant de huit à onze ans, au Sénégal,
 * tutoyé, jamais grondé, toujours une suite. Pio parle court : une bulle se
 * lit d'un coup d'œil ou ne se lit pas.
 *
 * Les listes servent au hasard : une réplique tirée à chaque passage, pour
 * que le camp ne dise pas la même phrase trois fois par jour. `pickLine`
 * tire dans une liste ; les fonctions à argument composent avec le prénom
 * ou un compteur.
 */

/** Tire une réplique. Déterministe si on lui passe une graine. */
export function pickLine(lines: readonly string[], seed?: number): string {
  if (lines.length === 0) return "";
  const index =
    seed === undefined
      ? Math.floor(Math.random() * lines.length)
      : Math.abs(Math.floor(seed)) % lines.length;
  return lines[index];
}

export const pioSays = {
  /** Premier jour : rien n'est encore fait, et c'est très bien. */
  coldStart: (firstName: string) =>
    firstName
      ? `Bienvenue au camp, ${firstName} ! Choisis un monde, on part explorer.`
      : "Bienvenue au camp ! Choisis un monde, on part explorer.",

  /** Retour avec une série vivante. */
  streakAlive: (days: number) =>
    days === 1
      ? "Premier jour de série ! Reviens demain pour la faire grandir."
      : `${days} jours de série. Tu es un vrai explorateur !`,

  /** Retour sans activité aujourd'hui : on invite, on ne gronde pas. */
  comeBack: [
    "Content de te revoir ! On reprend là où tu t'es arrêté ?",
    "Le sentier t'attend. Un petit palier pour commencer ?",
    "J'ai gardé ta place. On y va ?",
  ] as const,

  /** Une thématique est en cours. */
  continueTopic: (topicName: string) =>
    `On continue « ${topicName} » ? Tu étais bien parti.`,

  /** Toutes les thématiques visibles sont terminées. */
  allDone: [
    "Tu as tout exploré ! Je cherche de nouveaux sentiers.",
    "Incroyable, la carte est complète. Reviens vite pour la suite.",
  ] as const,

  /** Quand l'enfant touche Pio au camp. */
  tapReactions: [
    "Coucou !",
    "Tu as vu ma loupe ? Elle trouve tout.",
    "Prêt pour l'aventure ?",
    "J'adore ce camp.",
    "Chut, je cherche un indice...",
    "On y va ensemble !",
  ] as const,

  /** Cinq touches rapides : la réaction secrète. */
  secret: "Tu as trouvé mon secret ! Rugissement d'explorateur : RAAAH !",

  /** Panneau des quêtes. */
  questsIntro: "Mes missions du jour",
  questDone: "Mission accomplie !",
  questsAllDone: "Toutes les missions sont faites. Quel explorateur !",

  /** Carte-monde. */
  mapTitle: "La carte du monde",
  mapSubtitle: "Chaque monde est une matière. Suis le sentier.",
  mapTap: "Touche un monde, Pio y va !",
  zoneLocked: "Bientôt ouvert",
  zoneNew: "Nouveau monde",

  /** Sentier d'une matière. */
  stage: {
    decouverte: "Découverte",
    consolidation: "Consolidation",
    approfondissement: "Approfondissement",
    maitrise: "Maîtrise",
  } as const,
  trailCurrent: "C'est ici !",
  trailLockedHint: "Termine l'étape d'avant pour ouvrir celle-ci.",
  palierLockedHint: "Valide le palier d'avant pour ouvrir celui-ci.",
  trailTreasure: "Un trésor t'attend au bout du sentier.",

  /** Réponse à un exercice : ce que Pio dit sur le moment. */
  answerRight: ["Bravo !", "Super !", "Exact !", "Bien joué !", "Oui !"] as const,
  answerRightSub: [
    "Tu as tout compris.",
    "Continue comme ça !",
    "Quelle rapidité !",
    "Un vrai explorateur !",
  ] as const,
  answerWrong: ["Pas tout à fait…", "Presque !", "Hmm, pas celle-là."] as const,
  answerWrongSub: [
    "Regarde bien et réessaie.",
    "Tu y es presque !",
    "Prends ton temps, tu vas trouver.",
  ] as const,
  answerOut: "Tu peux passer à la suite.",
  answerOutSub: "Pas grave, on va comprendre ensemble.",
  attemptsLeft: (n: number) => (n === 1 ? "Encore 1 essai" : `Encore ${n} essais`),
  /** La série : des bonnes réponses du premier coup, d'affilée (`session-juice.tsx`). */
  comboLine: (n: number) => `${n} d'affilée !`,

  /** Fin de palier. */
  palierWon: ["Palier validé !", "Tu l'as fait !", "Quel explorateur !"] as const,
  palierWonSub: (nextIndex: number) => `Le palier ${nextIndex} vient de s'ouvrir.`,
  palierLost: "Pas encore, mais tu y es presque !",
  palierLostSub: (missing: number) =>
    missing <= 1
      ? "Il te manque 1 étoile pour valider."
      : `Il te manque ${missing} étoiles pour valider.`,
  starsWon: (n: number) => (n === 1 ? "1 étoile gagnée" : `${n} étoiles gagnées`),
  validatedFrom: (threshold: number) => `Validé à partir de ${threshold}`,
  nextStep: "Prochaine étape",
  topicDone: (name: string) => `« ${name} » est terminée !`,
  lockedNext: "Valide ce palier pour ouvrir le suivant.",
  regenInvite: "On refait les exercices ratés ensemble ?",
  regenCta: "Allez, on réessaie !",
  victoryStars: (stars: number) =>
    stars >= 3
      ? "Trois étoiles ! Tu as tout compris."
      : stars === 2
        ? "Deux étoiles. Encore un effort et c'est parfait."
        : "Une étoile gagnée. Chaque étoile compte !",

  /** Salle des trophées. */
  trophiesTitle: "Salle des trophées",
  trophiesEmpty: "Ta première vitrine est vide. Une aventure et elle se remplit.",

  /** Trésors : l'album de cartes et la salle des trophées, sous le même toit. */
  treasuresTitle: "Mes trésors",
  cardsTab: "Cartes",
  trophiesTab: "Trophées",
  albumEmpty: "Ton album attend sa première carte. Elle est dans le coffre du jour.",
  albumDone: "Série complète ! Quel collectionneur !",
  cardMystery: "Carte mystère",
  cardMysteryBody: "Elle se cache dans un coffre. Joue un palier, puis ouvre le coffre du jour.",
  cardFactTitle: "Le savais-tu ?",

  /** Le coffre du jour. */
  chestTitle: "Coffre du jour",
  chestReady: "Touche le coffre !",
  chestLocked: "Finis un palier aujourd'hui, et le coffre est à toi.",
  chestOpening: "Il s'ouvre...",
  chestOpened: "Des trésors pour toi !",
  chestNewCard: "Nouvelle carte",
  chestDuplicate: (cauris: number) => `Tu l'avais déjà : elle devient ${cauris} cauris.`,
  chestToTreasures: "Ranger dans mes trésors",
  chestBack: "Retour au camp",
  chestFailed: "Le coffre est coincé. Réessaie dans un instant.",

  /** Le marché. */
  marketTitle: "Le Marché de Pio",
  marketIntro: "Les cauris se gagnent en jouant. Choisis un objet pour ton camp.",
  marketBuy: "Acheter",
  marketOwned: "Posé au camp",
  marketMissing: (missing: number) => `Encore ${missing} cauri${missing > 1 ? "s" : ""}`,
  marketBought: (name: string) => `${name} : posé au camp !`,
  marketSeeCamp: "Voir mon camp",
  marketFailed: "L'achat n'est pas passé. Réessaie dans un instant.",

  /** Les cauris gagnés à la fin d'un palier. */
  caurisWon: (cauris: number) => `Tu gagnes ${cauris} cauri${cauris > 1 ? "s" : ""}`,

  /** Le camp, la nuit (de 19 heures à 6 heures, heure de Dakar). */
  campNight: [
    "Il fait nuit au camp. Encore une étoile avant de dormir ?",
    "Les lucioles sont sorties. On joue un dernier palier ?",
    "La lune éclaire le camp. Une petite aventure avant le lit ?",
  ],

  /** Carnet. */
  notebookTitle: "Carnet d'explorateur",


  /**
   * Sentier perdu : un monde ou une thématique qui ne s'ouvre pas. Pio ne dit
   * pas pourquoi (absente, ou d'une autre classe) : l'enfant n'a rien à y
   * corriger, il lui faut une sortie.
   */
  lostTrail: {
    world: {
      bubble: "Hmm… ce monde n'est pas sur ma carte.",
      title: "Monde introuvable",
    },
    topic: {
      bubble: "Hmm… ce sentier n'est pas sur ma carte.",
      title: "Sentier introuvable",
    },
    // Espaces insécables avant « : » et « ! » : sans elles, la ponctuation
    // passe seule en début de ligne sur un téléphone étroit.
    body: "Il n'existe pas, ou il n'est pas au programme de ta classe. Pas grave\u00a0: d'autres aventures t'attendent\u00a0!",
    toMap: "Ouvrir ma carte",
    toCamp: "Retour au camp",
  },
} as const;
