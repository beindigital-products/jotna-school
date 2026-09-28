/**
 * LA MÉMORISATION (ḥifẓ) — ce qui la sépare de la lecture, et ce que ça coûte.
 *
 * LIRE ET MÉMORISER NE SONT PAS LE MÊME GESTE. En lecture, le texte est sous
 * les yeux : l'enfant déchiffre. En mémorisation, le texte S'EFFACE, et ce
 * qu'on mesure est ce qui reste quand il n'est plus là. Tout ce fichier découle
 * de cette différence :
 *
 *   1. LE MASQUE. On ne cache pas d'un coup. Le texte complet sert à écouter,
 *      les AMORCES (la première lettre de chaque mot) servent à réciter la
 *      première fois, et le texte entièrement masqué sert à vérifier. Entre
 *      les deux, on garde toujours le NOMBRE DE MOTS visible : savoir qu'il
 *      reste trois mots n'est pas tricher, c'est ce que fait un maître qui
 *      lève trois doigts.
 *
 *   2. LA LIAISON. Un enfant qui sait quatre versets séparément ne sait pas la
 *      sourate : il la sait quand il passe du verset 2 au verset 3 sans qu'on
 *      lui donne le départ. C'est le vrai point de rupture du ḥifẓ, et il
 *      mérite son propre exercice — d'où les items de liaison, qui récitent
 *      plusieurs versets d'affilée.
 *
 *   3. LA RÉVISION ESPACÉE, et c'est la raison d'être du fichier. Une sourate
 *      mémorisée et jamais revue est une sourate PERDUE — c'est le fait le
 *      mieux établi de tout l'apprentissage par cœur, et celui qu'un module
 *      qui se contenterait de « bravo, c'est mémorisé » ignorerait. Une
 *      sourate revue et redite remonte d'un cran et revient plus tard ; une
 *      sourate qui résiste redescend d'UN cran, jamais à zéro.
 *
 * PUR, COMME TOUT CE QUI TOUCHE AU CONTENU ICI : l'écran doit masquer le texte
 * qu'il affiche, le serveur doit savoir quel texte était attendu, et les deux
 * doivent répondre la même chose. Aucun `ctx`, aucun `fetch`, aucune horloge —
 * `now` est un argument, pour que les tests puissent avancer le temps.
 *
 * CE QUI N'EST PAS ICI, ET NE DOIT PAS Y VENIR : le tajwīd. Ce fichier sait
 * si les MOTS y sont et dans l'ORDRE. Il ne sait rien des allongements, des
 * nasalisations ni des points d'articulation, et une récitation juste au sens
 * de ce fichier peut être fautive au sens d'un maître. Le module fait
 * mémoriser, il ne certifie pas une récitation.
 */

import { SURAHS, type Surah } from "./quran";

// ---------------------------------------------------------------------------
// Les clés
// ---------------------------------------------------------------------------

/** Préfixe des leçons de mémorisation — `hifz-al-ikhlas`. */
const HIFZ_PREFIX = "hifz-";

/** La clé de leçon qui mémorise cette sourate. */
export function hifzLessonKey(surahKey: string): string {
  return `${HIFZ_PREFIX}${surahKey}`;
}

/** La sourate d'une leçon de mémorisation, ou `null` si ce n'en est pas une. */
export function surahKeyOfHifzLesson(lessonKey: string): string | null {
  if (!lessonKey.startsWith(HIFZ_PREFIX)) return null;
  return lessonKey.slice(HIFZ_PREFIX.length) || null;
}

/** L'item qui récite les versets 1 à `upTo` d'affilée. */
export function linkItemKey(surahKey: string, upTo: number): string {
  return `${surahKey}-lien-${upTo}`;
}

// ---------------------------------------------------------------------------
// Les liaisons
// ---------------------------------------------------------------------------

/**
 * Tous les combien on relie, en versets.
 *
 * TROIS, parce que deux ne fait qu'un couple (l'enfant l'a déjà enchaîné en
 * récitant le second) et que quatre laisse trop de terrain entre deux prises.
 * Les sourates du parcours font trois à sept versets : ce pas produit une ou
 * deux liaisons intermédiaires, jamais une liste à faire peur.
 */
const LINK_EVERY = 3;

/**
 * Les points de liaison d'une sourate : combien de versets on enchaîne, et
 * dans quel ordre on le demande.
 *
 * TOUJOURS TERMINÉ PAR LA SOURATE ENTIÈRE — c'est l'objectif, et il ne se
 * déduit pas du reste. Les paliers intermédiaires (3, 6, 9…) existent pour que
 * l'enfant ne saute pas de « je sais chaque verset » à « je récite les sept
 * d'un trait », qui est l'endroit exact où l'on abandonne.
 *
 * Une sourate de trois versets ne rend donc qu'un seul point (3), pas deux
 * identiques : le dédoublonnage est fait ici, une fois, plutôt que dans chaque
 * appelant.
 */
export function linkPoints(ayahCount: number): number[] {
  const points: number[] = [];
  for (let upTo = LINK_EVERY; upTo < ayahCount; upTo += LINK_EVERY) {
    points.push(upTo);
  }
  if (ayahCount > 1) points.push(ayahCount);
  return points;
}

/**
 * Le palier d'une liaison, ou `null` si la clé n'en est pas une.
 *
 * Sert à retrouver, parmi les tentatives d'une leçon, CELLE qui a vraiment
 * testé la mémorisation — voir `memorization.applyOutcome`.
 */
export function linkPointOf(surahKey: string, itemKey: string): number | null {
  const prefix = `${surahKey}-lien-`;
  if (!itemKey.startsWith(prefix)) return null;
  const upTo = Number.parseInt(itemKey.slice(prefix.length), 10);
  return Number.isInteger(upTo) && upTo > 0 ? upTo : null;
}

/** Le texte récité par une liaison : les versets 1 à `upTo`, séparés d'une espace. */
export function linkText(surah: Surah, upTo: number): string {
  return surah.ayahs
    .slice(0, upTo)
    .map((ayah) => ayah.ar)
    .join(" ");
}

// ---------------------------------------------------------------------------
// Le masque
// ---------------------------------------------------------------------------

/**
 * Ce que l'enfant voit du texte.
 *
 * - `full` : tout. Pour écouter et pour la première fois qu'on le lui montre.
 * - `hints` : la première lettre de chaque mot. C'est l'amorce que donne un
 *   maître quand l'élève cale — assez pour repartir, pas assez pour lire.
 * - `hidden` : rien, sauf le nombre de mots.
 */
export type MaskDegree = "full" | "hints" | "hidden";

/**
 * Le tiret qui remplace ce qu'on cache.
 *
 * C'est la TATWĪL (ـ), l'étirement typographique arabe — pas un tiret latin.
 * Elle se lit dans le bon sens, se compose avec la police du module, et dit
 * « il y a un mot ici » sans suggérer une lettre qui n'y est pas.
 */
const BLANK = "ـــ";

/** Les signes qui ne sont pas des lettres : voyelles, sukūn, chadda, tatwīl. */
const COMBINING = /[ً-ْٰۖ-ۭـ]/;

/**
 * La première LETTRE d'un mot — pas son premier caractère.
 *
 * Un mot coranique commence parfois par une lettre immédiatement suivie de sa
 * voyelle, et parfois par une alif portant une hamza (un seul point de code).
 * Prendre `word[0]` rendrait tantôt une lettre, tantôt une demi-lettre ; on
 * saute donc explicitement ce qui n'est pas une lettre. Et on rend l'amorce
 * SANS sa voyelle : la voyelle fait partie de ce qu'il faut se rappeler.
 */
function firstLetter(word: string): string {
  for (const char of word) {
    if (!COMBINING.test(char)) return char;
  }
  return "";
}

/**
 * Le texte tel qu'il s'affiche à ce degré de masque.
 *
 * Le NOMBRE DE MOTS est toujours conservé, à tous les degrés : c'est l'aide
 * qu'un maître donne en levant les doigts, et la retirer ne rendrait pas
 * l'exercice plus honnête — seulement plus décourageant.
 */
export function maskAyah(text: string, degree: MaskDegree): string {
  if (degree === "full") return text;

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (degree === "hidden") return words.map(() => BLANK).join(" ");

  return words
    .map((word) => {
      const letter = firstLetter(word);
      return letter ? `${letter}${BLANK}` : BLANK;
    })
    .join(" ");
}

/** Le nombre de mots à réciter — affiché à l'enfant comme repère. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

// ---------------------------------------------------------------------------
// La révision espacée
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

/**
 * L'ÉCHELLE DES REVISITES, en jours, indexée par la force acquise.
 *
 * Force 0 = « appris aujourd'hui » : on revoit DEMAIN, parce que c'est la nuit
 * qui décide de ce qui reste. Puis l'écart double à peu près à chaque réussite,
 * jusqu'à trois mois — au-delà, une sourate de quatre versets tenue trois mois
 * est acquise, et continuer à la programmer noierait les sourates fraîches
 * sous des révisions inutiles.
 *
 * Ce ne sont pas les intervalles d'un algorithme de mémorisation générique :
 * un verset coranique se révise en le récitant en entier, pas en retournant
 * une carte, et l'enfant en fait plusieurs par séance.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35, 90] as const;

/** La force maximale — au-delà, l'échelle ne dit plus rien de plus. */
export const MAX_STRENGTH = REVIEW_INTERVALS_DAYS.length - 1;

/**
 * La force après une révision.
 *
 * ON NE REDESCEND JAMAIS À ZÉRO. Un enfant qui bute sur Al-Kawthar un mardi
 * soir ne l'a pas oubliée : il est fatigué, ou le micro l'a mal entendu.
 * Remettre sa sourate au premier échelon lui ferait tout recommencer pour une
 * mauvaise minute, et c'est la façon la plus sûre de lui faire détester la
 * révision. On descend d'UN cran — elle revient plus tôt, c'est tout.
 *
 * « Presque » ne bouge pas : la sourate revient au même écart. Ni récompense
 * ni punition pour une récitation à moitié sûre — elle est exactement là où on
 * l'avait laissée.
 */
export function nextStrength(
  strength: number,
  verdict: "ok" | "close" | "retry",
): number {
  const current = clampStrength(strength);
  if (verdict === "ok") return Math.min(MAX_STRENGTH, current + 1);
  if (verdict === "close") return current;
  return Math.max(0, current - 1);
}

/** Quand cette sourate doit revenir, vu sa force. */
export function nextDueAt(strength: number, now: number): number {
  return now + REVIEW_INTERVALS_DAYS[clampStrength(strength)] * DAY_MS;
}

/** Cette sourate est-elle à revoir ? */
export function isDue(dueAt: number, now: number): boolean {
  return dueAt <= now;
}

function clampStrength(strength: number): number {
  if (!Number.isFinite(strength)) return 0;
  return Math.min(MAX_STRENGTH, Math.max(0, Math.floor(strength)));
}

// ---------------------------------------------------------------------------
// L'état d'une sourate, vu de l'écran
// ---------------------------------------------------------------------------

export interface HifzRow {
  surahKey: string;
  strength: number;
  versesMemorized: number;
  dueAt: number;
  lastReviewedAt: number;
}

export interface HifzSurahState {
  surahKey: string;
  nameFr: string;
  nameAr: string;
  ayahCount: number;
  /** 0 tant que la sourate n'a jamais été travaillée. */
  versesMemorized: number;
  /** `null` si jamais commencée. */
  dueAt: number | null;
  due: boolean;
  started: boolean;
}

/**
 * L'état de mémorisation de toutes les sourates, dans l'ordre du parcours.
 *
 * REND TOUTES LES SOURATES, y compris celles qu'on n'a jamais ouvertes : un
 * écran de mémorisation doit montrer ce qu'il reste à faire, pas seulement ce
 * qui est fait. Les lignes de base ne couvrent que les sourates commencées.
 *
 * PAS L'ÉCHELON. Il gouverne la révision espacée et n'apprend rien à un enfant
 * — « tu es au cran 3 » ne veut rien dire pour lui, alors que « à réviser dans
 * seize jours », si. Ce que l'échelon produit voyage (`dueAt`, `due`), lui
 * reste en base.
 */
export function hifzStates(
  rows: readonly HifzRow[],
  now: number,
): HifzSurahState[] {
  const byKey = new Map(rows.map((row) => [row.surahKey, row]));

  return SURAHS.map((surah) => {
    const row = byKey.get(surah.key);
    return {
      surahKey: surah.key,
      nameFr: surah.nameFr,
      nameAr: surah.nameAr,
      ayahCount: surah.ayahs.length,
      versesMemorized: row?.versesMemorized ?? 0,
      dueAt: row?.dueAt ?? null,
      due: row !== undefined && isDue(row.dueAt, now),
      started: row !== undefined,
    };
  });
}

/**
 * Combien de versets d'une sourate sont tenus pour mémorisés, vu les items
 * réussis.
 *
 * ON NE COMPTE QUE LES VERSETS, pas les liaisons : une liaison réussie dit que
 * l'enchaînement tient, ce que le compteur de versets dirait déjà deux fois.
 * Et on compte le PLUS HAUT VERSET CONSÉCUTIF depuis le premier, pas le total
 * des versets réussis — savoir les versets 1, 2 et 5 d'une sourate, ce n'est
 * pas en savoir trois sur cinq, c'est en savoir deux et un morceau détaché.
 */
export function versesMemorizedFrom(
  surahKey: string,
  passedItemKeys: ReadonlySet<string>,
): number {
  const surah = SURAHS.find((candidate) => candidate.key === surahKey);
  if (!surah) return 0;

  let count = 0;
  for (const ayah of surah.ayahs) {
    if (!passedItemKeys.has(`${surahKey}-${ayah.number}`)) break;
    count += 1;
  }
  return count;
}
