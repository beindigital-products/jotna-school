/**
 * Library de copy bienveillant kid-friendly (Decision 82).
 *
 * Tous les messages affichés à l'enfant (8-11 ans, contexte Sénégal) passent par ici.
 * Reste cohérent : ton encourageant, jamais culpabilisant, ouverture vers une suite.
 */

export const kidMessages = {
  // Régénération (Decision 87). Les phrases de fin de palier sont celles de
  // Pio (`lib/pioCopy.ts`).
  regenLoading: 'Aïssatou prépare tes nouveaux exos...',

  // Limites budget / quota (Decision 82)
  budgetExceeded:
    "Oh, on a beaucoup travaillé aujourd'hui ! 🌙 Reviens demain, des nouveaux exos t'attendent.",
  jenVeuxEncoreLimit:
    "Tu as déjà fait 3 séries d'exos en bonus aujourd'hui ! Reviens demain pour en faire d'autres 🌟",

  // Accès non ouvert par l'école (spec §5.8)
  accessNotOpen:
    "Ton espace n'est pas encore ouvert 🌱 Parle-en à ton maître ou à ta maîtresse, ils vont s'en occuper !",

  // 3 alternatives sur cap regen atteint (Decision 83)
  capRegenReached: {
    intro: "On t'a vu galérer 💪. Voici ce que tu peux faire :",
    options: [
      { icon: '📖', label: 'Voir un exo corrigé en détail', cta: 'Voir' },
      { icon: '🔄', label: 'Refaire le palier précédent', cta: 'Y aller' },
      { icon: '🆘', label: 'Demander de l\'aide à ton parent', cta: 'Prévenir' },
    ],
  },

  // Réseau / erreurs (Decisions 90, 64)
  networkLost:
    "On a perdu la connexion, mais ne t'inquiète pas, on garde tes réponses ! 💾",
  networkBack: 'On est de retour ! Tu peux continuer 🚀',
  genTimeout:
    'Ça prend un peu de temps... attends-moi ou réessaie dans quelques secondes.',
  genFailed: 'Petit souci ! On essaie autre chose 🔧',

  // Sans internet (`docs/hors-ligne.md`) : l'enfant joue sur son téléphone,
  // rien ne se perd, tout part quand le réseau revient. Jamais une erreur.
  offline: {
    badge: "Sans internet",
    saved: "Tout est gardé dans ton téléphone 💾",
    syncing: "Pio envoie ton travail…",
    backpack: (pct: number) => `Pio remplit ton sac : ${pct} %`,
    firstConnectionTitle: "Il faut internet une première fois",
    firstConnectionBody:
      "Connecte-toi une fois avec internet : Pio remplit ton sac, et après tu pourras jouer partout, même sans réseau.",
    reconnectTitle: "Connecte-toi à internet",
    reconnectBody:
      "Ça fait longtemps que ton téléphone n'a pas vu internet. Connecte-toi un moment pour que Pio vérifie ton sac, puis tu pourras continuer.",
    palierNotReadyTitle: "Ce palier n'est pas encore dans ton sac",
    palierNotReadyBody:
      "Pio le préparera la prochaine fois que tu auras internet. En attendant, tu peux jouer aux paliers déjà prêts !",
    packEmpty:
      "Pio prépare ton sac… Connecte-toi à internet un petit moment pour récupérer tes exercices.",
    explainOffline:
      "Sans internet, Pio ne peut pas t'expliquer pas à pas. Voici la bonne réponse et les indices :",
    retryOffline: "Sans internet, on rejoue le même palier.",
    profileOnline: "Ton prénom et ta photo se changent avec internet.",
    logoutPending:
      "Tes derniers exercices ne sont pas encore partis chez ton maître. Ils partiront quand tu te reconnecteras avec internet.",
  },

  // Hints (Decision 93)
  hintLevel: (i: number, total: number) =>
    `Indice ${i}/${total} utilisé — un peu moins d'étoiles cette fois 🌟`,

  // Loader rotating messages
  loaderMessages: [
    'Aïssatou prépare tes exos...',
    'On charge tes exercices...',
    'Modou écrit les questions...',
    'Encore quelques secondes...',
    'Tes exos arrivent !',
  ],

  // CTAs récurrents
  cta: {
    submit: 'Valider',
    next: 'Suivant',
    retry: 'Réessayer',
    quit: 'Sauvegarder et quitter',
    seeMore: "J'en veux encore !",
  },

  // Footer / mention programme officiel (Decision 91 — pour parent dashboard)
  inspiredByProgram: 'Inspiré du programme officiel sénégalais',
} as const;

export type KidMessages = typeof kidMessages;
