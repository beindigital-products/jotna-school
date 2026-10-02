/**
 * LES CONSIGNES DITES À VOIX HAUTE — ce que Pio dit à l'enfant, en français.
 *
 * UN ENFANT DÉBUTANT NE SAIT PAS ENCORE LIRE. C'est la décision du
 * propriétaire (28 septembre 2026) : chaque écran du module dit sa consigne
 * tout seul, et un bouton 🔊 la redit. La bulle de Pio affiche le MÊME texte,
 * pour l'adulte qui accompagne — une seule source, donc jamais d'écart entre
 * ce qui est écrit et ce qui est entendu.
 *
 * UN CATALOGUE FERMÉ, PAS DU TEXTE LIBRE. La synthèse (`voice.ts`) ne dit que
 * ce qui est ici, désigné par sa clé : même règle que pour l'arabe du
 * parcours. Chaque phrase n'est donc synthétisée qu'une fois, pour toutes les
 * écoles, puis servie depuis le cache.
 *
 * COMMENT ELLES SONT ÉCRITES : des phrases courtes, au présent, qu'un enfant
 * de cinq ans comprend à la première écoute. Un verbe d'action par phrase
 * (« touche », « écoute », « répète »). Jamais « faux », jamais « raté »
 * (`lib/arabic/copy.ts`, règle 1). Sur le Coran, des mots sobres (règle 2).
 *
 * Les phrases qui nomment une lettre ne la nomment pas elles-mêmes : l'écran
 * enchaîne la consigne française puis le nom de la lettre dit en arabe, par
 * la même voix (« Touche la lettre… » puis « بَاء »). Le français reste la
 * langue des consignes, l'arabe celle de ce qu'on apprend.
 *
 * QUAND L'ENFANT RÉUSSIT, PIO DIT « MASHAALLAH », et il varie (demande du
 * propriétaire, 29 septembre 2026) : six bravos tournent (`bravo`). Leurs
 * formules arabes sont écrites en lettres latines pour l'adulte qui lit la
 * bulle, et dites en arabe par la voix (`spokenConsigne`) : ce sont les mêmes
 * mots, seule l'écriture change.
 */

export const CONSIGNES = {
  // --- La carte --------------------------------------------------------------
  map_welcome:
    "Salam ! Voici le chemin du Coran. Touche le bouton vert pour commencer ta leçon.",
  map_locked: "Cette leçon est encore fermée. Termine d'abord celle d'avant !",
  map_kaaba: "Au bout du chemin, la Kaaba t'attend. Avance, leçon après leçon !",
  map_kaaba_reached:
    "MashaAllah ! Tu as fait tout le chemin jusqu'à la Kaaba. Bravo pour ton courage !",

  // --- Rencontrer une lettre -------------------------------------------------
  meet: "Voici une nouvelle lettre ! Écoute bien son nom.",
  meet_like: "comme dans le mot",
  meet_tap: "Touche la lettre pour l'entendre encore. Touche l'image pour entendre le mot.",

  // --- La répéter -------------------------------------------------------------
  repeat: "À toi ! Appuie sur le micro, et dis-la bien fort.",
  close: "Tu y es presque ! Écoute encore une fois, puis répète.",
  retry_1: "Je n'ai pas bien entendu. Parle un peu plus fort, près du micro.",
  retry_2: "On essaie ensemble ? Écoute doucement, puis répète.",
  keep_going: "Tu progresses ! On la redira plus tard. On continue !",
  // Sans internet, Pio ne peut pas écouter : l'enfant compare lui-même
  // (`components/arabic/record-button.tsx`, `docs/hors-ligne.md`).
  listen_compare: "Bravo, tu as répété ! Écoute ta voix, puis écoute-moi encore.",
  tip_gorge: "Ce son vient du fond de ta gorge.",
  tip_langue: "Mets le bout de ta langue derrière tes dents du haut.",
  tip_dents: "Ta langue touche le bord de tes dents.",
  tip_levres: "Serre tes lèvres, puis ouvre-les.",
  tip_emphatic: "Ouvre grand la bouche, avec une grosse voix.",

  // --- Les bravos (`BRAVOS`) --------------------------------------------------
  bravo_1: "MashaAllah !",
  bravo_2: "MashaAllah, c'est ça !",
  bravo_3: "Bravo, MashaAllah !",
  bravo_4: "MashaAllah, très bien !",
  bravo_5: "Tabarakallah ! Continue comme ça.",
  bravo_6: "Barakallahou fik, c'est parfait !",

  // --- Les jeux ---------------------------------------------------------------
  find_letter: "Touche la lettre",
  find_syllable: "Touche le son",
  try_again: "Presque ! Essaie encore.",
  match: "Relie chaque lettre à son image. Touche une lettre, puis son image.",
  dots: "Combien de points a cette lettre ? Compte bien !",
  trace: "Avec ton doigt, trace la lettre par-dessus. En arabe, on commence à droite !",
  trace_done: "MashaAllah, bien tracé !",

  // --- Lire -------------------------------------------------------------------
  listen_item: "Écoute bien.",
  read_item: "À toi de lire ! Appuie sur le micro.",
  quran_listen: "On écoute doucement ce verset.",
  quran_read: "À toi, lis doucement. Appuie sur le micro.",
  recite: "Écoute bien, puis récite de mémoire.",

  // --- La fin -----------------------------------------------------------------
  lesson_done:
    "MashaAllah, tu as fini ta leçon ! Tu gagnes de nouvelles images pour ton album.",
  lesson_done_quran: "C'est lu, MashaAllah. Bravo pour tes efforts.",
  album: "Voici ton album des lettres. Touche une lettre pour l'écouter.",
} as const;

export type ConsigneKey = keyof typeof CONSIGNES;

export function isConsigneKey(key: string): key is ConsigneKey {
  return Object.prototype.hasOwnProperty.call(CONSIGNES, key);
}

/** Les bravos que Pio fait tourner, pour ne pas redire le même à chaque réussite. */
export const BRAVOS = [
  "bravo_1",
  "bravo_2",
  "bravo_3",
  "bravo_4",
  "bravo_5",
  "bravo_6",
] as const satisfies readonly ConsigneKey[];

/**
 * Le bravo de la n-ième réussite ou étape. Sans hasard : la même tentative
 * redonne le même bravo, comme `verdictMessage` (`lib/arabic/copy.ts`).
 */
export function bravo(n: number): ConsigneKey {
  const count = BRAVOS.length;
  return BRAVOS[((Math.trunc(n) % count) + count) % count];
}

/** Les formules arabes des consignes : en latin dans la bulle, en arabe dans la voix. */
const FORMULES: ReadonlyArray<readonly [latin: string, arabe: string]> = [
  ["MashaAllah", "مَا شَاءَ اللَّه"],
  ["Tabarakallah", "تَبَارَكَ اللَّه"],
  ["Barakallahou fik", "بَارَكَ اللَّهُ فِيك"],
];

/** Le texte que la voix lit pour une consigne : le même, formules dites en arabe. */
export function spokenConsigne(key: ConsigneKey): string {
  return FORMULES.reduce<string>(
    (text, [latin, arabe]) => text.split(latin).join(arabe),
    CONSIGNES[key],
  );
}
