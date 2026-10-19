/**
 * LA SÉANCE — ce qu'une leçon fait faire, dans l'ordre, et combien de fois.
 *
 * PUR, ET C'EST LE POINT : la page de leçon ne décide de rien, elle déroule
 * une liste d'étapes fabriquée ici. On peut donc vérifier par des tests
 * qu'une séance d'alphabet finit toujours par le tracé, qu'aucune séance ne
 * dépasse la patience d'un enfant de six ans, et qu'un rechargement de page
 * redonne EXACTEMENT la même séance — c'est ce que la graine garantit.
 *
 * LA GRAINE VIENT DE LA CLÉ DE LEÇON, jamais de l'horloge : un enfant qui
 * perd le réseau au milieu d'une séance et recharge doit retrouver ses
 * questions, pas une nouvelle série qui effacerait ce qu'il venait de
 * comprendre.
 *
 * LE PLAFOND D'ÉTAPES EST UNE DÉCISION PÉDAGOGIQUE, pas une optimisation :
 * au-delà d'une vingtaine d'exercices, une séance devient une corvée, et le
 * niveau 2 en compte trente-six à lui seul (douze lettres × trois voyelles).
 * On en tire un échantillon stable plutôt que de tout imposer — le reste
 * revient à la révision suivante, avec la même graine, donc le même
 * échantillon. Pour les élargir : `ITEMS_PER_SESSION`.
 */

import {
  HARAKAT,
  getLetter,
  pickDistractors,
  shuffle,
  type ArabicLetterKey,
} from "@/convex/arabic/alphabet";
import type { ArabicLesson, DrillKind } from "@/convex/arabic/curriculum";
import { lettersSeenUpTo } from "@/convex/arabic/curriculum";
import { linkItemKey, linkPoints, type MaskDegree } from "@/convex/arabic/hifz";

/** Items de lecture retenus par séance — au-delà, on échantillonne. */
export const ITEMS_PER_SESSION = 8;

/**
 * Syllabes retenues par séance de voyelles : moins que pour une sourate,
 * parce que chacune s'écoute, se redit, puis revient dans le jeu d'écoute.
 */
export const SYLLABLES_PER_SESSION = 6;

/** Syllabes rejouées dans le jeu « quel son entends-tu ? ». */
export const SYLLABLE_PICKS_PER_SESSION = 4;

/**
 * Choix proposés dans un jeu de ballons, bonne réponse comprise. Trois, pas
 * quatre : un enfant de cinq ans compare trois dessins d'un coup d'œil, et
 * chaque ballon faux qui se dégonfle rapproche la bonne réponse.
 */
export const CHOICES_PER_QUESTION = 3;

/** Lettres dont on compte les points, par leçon. */
export const DOTS_PER_SESSION = 2;

export type SessionStep =
  /** On rencontre la lettre : son nom, son image (أ comme أَسَد). Non noté. */
  | { kind: "discoverLetter"; itemKey: ArabicLetterKey }
  /** On entend le nom, on éclate le ballon de la bonne lettre. */
  | { kind: "recognizeGlyph"; itemKey: ArabicLetterKey; options: ArabicLetterKey[] }
  /**
   * On relie chaque lettre de la leçon à son image. UNE étape pour toutes les
   * lettres ; chaque paire est notée à part, famille `recognizeName` (voir la
   * lettre, retrouver ce qu'elle dit). `itemKey` est la première lettre.
   */
  | { kind: "matchPictures"; itemKey: ArabicLetterKey; letters: ArabicLetterKey[] }
  /** Combien de points ? Le détail qui sépare ب de ت de ث. */
  | { kind: "dots"; itemKey: ArabicLetterKey; options: number[] }
  /** L'enfant répète au micro. */
  | { kind: "pronounce"; itemKey: ArabicLetterKey }
  /**
   * On entend une syllabe, on éclate le ballon qui l'écrit (بَ ? بِ ? بُ ?).
   * Famille `recognizeGlyph`, notée sur l'appareil : c'est l'exercice qui
   * vérifie vraiment la VOYELLE.
   */
  | { kind: "pickSyllable"; itemKey: string; options: string[] }
  /** L'enfant écrit la lettre au doigt. */
  | { kind: "write"; itemKey: ArabicLetterKey }
  /** On écoute la syllabe, le mot ou le verset. Non noté. */
  | { kind: "discoverItem"; itemKey: string }
  /** On le lit à voix haute. */
  | { kind: "read"; itemKey: string }
  /**
   * On le RÉCITE, texte masqué. `mask` dit ce qui reste visible — c'est
   * l'étape qui porte le degré, pas le composant, pour qu'un test puisse
   * vérifier qu'une révision se fait bien à texte caché.
   */
  | { kind: "recite"; itemKey: string; mask: MaskDegree };

/** Les étapes qui comptent pour la note — les autres sont de la découverte. */
export function isScored(step: SessionStep): boolean {
  return step.kind !== "discoverLetter" && step.kind !== "discoverItem";
}

/** La famille d'exercice enregistrée côté serveur, ou `null` si non notée. */
export function drillOf(step: SessionStep): DrillKind | null {
  switch (step.kind) {
    case "recognizeGlyph":
    case "dots":
    case "write":
    case "read":
    case "recite":
      return step.kind;
    case "pickSyllable":
      return "recognizeGlyph";
    case "matchPictures":
      return "recognizeName";
    case "pronounce":
      return "pronounce";
    default:
      return null;
  }
}

/** Graine stable, tirée du nom de la leçon (hachage FNV-1a 32 bits). */
export function seedFromKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 1;
}

/**
 * Fabrique la séance d'une leçon.
 *
 * POUR UN ENFANT QUI NE SAIT PAS ENCORE LIRE (décision du 28 septembre 2026).
 * L'ordre suit la manière dont un maître de daara enseigne, un élément à la
 * fois : on RENCONTRE la lettre (son nom, son image), on la RÉPÈTE aussitôt,
 * on la RETROUVE parmi des ballons — puis la lettre suivante. Les jeux qui
 * mélangent les lettres de la leçon viennent ensuite (relier à l'image,
 * compter les points), et on écrit en dernier : écrire une lettre qu'on ne
 * sait pas nommer n'apprend qu'un dessin. Aucune étape ne demande de lire du
 * français ; toutes les consignes sont dites.
 *
 * Seules les familles déclarées par la leçon (`lesson.drills`) sont retenues :
 * c'est le curriculum qui décide, pas cette fonction.
 */
export function buildSession(
  lesson: ArabicLesson,
  options?: { versesMemorized?: number },
): SessionStep[] {
  const seed = seedFromKey(lesson.key);
  const has = (drill: DrillKind) => lesson.drills.includes(drill);

  if (lesson.kind === "alphabet") {
    return buildLetterSession(lesson, seed, has);
  }
  if (lesson.kind === "hifz") {
    return buildHifzSession(lesson, options?.versesMemorized ?? 0);
  }
  return buildReadingSession(lesson, seed, has);
}

function buildLetterSession(
  lesson: ArabicLesson,
  seed: number,
  has: (drill: DrillKind) => boolean,
): SessionStep[] {
  const letters = lesson.letters as readonly ArabicLetterKey[];
  const pool = lettersSeenUpTo(lesson.key);
  const steps: SessionStep[] = [];

  const balloons = (letterKey: ArabicLetterKey, salt: number) =>
    shuffle(
      [
        letterKey,
        ...pickDistractors(letterKey, pool, CHOICES_PER_QUESTION - 1, seed + salt),
      ],
      seed + salt + 1,
    );

  // UNE LETTRE À LA FOIS, EN TROIS GESTES. L'enfant la rencontre, la redit
  // dans la foulée — tant que le son est encore dans l'oreille —, puis
  // l'éclate parmi des ballons. Seulement ensuite, la lettre suivante.
  letters.forEach((letterKey, i) => {
    steps.push({ kind: "discoverLetter", itemKey: letterKey });
    if (has("pronounce")) steps.push({ kind: "pronounce", itemKey: letterKey });
    if (has("recognizeGlyph")) {
      steps.push({
        kind: "recognizeGlyph",
        itemKey: letterKey,
        options: balloons(letterKey, i * 10),
      });
    }
  });

  // Les jeux qui mélangent les lettres de la leçon : chacune à son image...
  if (has("recognizeName") && letters.length > 0) {
    steps.push({ kind: "matchPictures", itemKey: letters[0], letters: [...letters] });
  }

  // ...et les points, sur les lettres qui en ont (c'est là qu'ils comptent).
  if (has("dots")) {
    const dotted = letters.filter((key) => (getLetter(key)?.dots.count ?? 0) > 0);
    const chosen = (dotted.length > 0 ? dotted : letters).slice(0, DOTS_PER_SESSION);
    chosen.forEach((letterKey, i) => {
      steps.push({
        kind: "dots",
        itemKey: letterKey,
        options: shuffle([0, 1, 2, 3], seed + i * 7),
      });
    });
  }

  // L'écriture EN DERNIER, toujours : c'est le geste qui fixe ce qui vient
  // d'être entendu, nommé et prononcé.
  if (has("write")) {
    for (const letterKey of letters) {
      steps.push({ kind: "write", itemKey: letterKey });
    }
  }

  return steps;
}

function buildReadingSession(
  lesson: ArabicLesson,
  seed: number,
  has: (drill: DrillKind) => boolean,
): SessionStep[] {
  // L'ÉCHANTILLON GARDE L'ORDRE DE LA LEÇON. Tirer au hasard puis lire dans
  // le désordre casserait la progression d'une sourate, dont les versets se
  // suivent. On choisit QUI est retenu, jamais dans quel ordre.
  const cap = lesson.kind === "harakat" ? SYLLABLES_PER_SESSION : ITEMS_PER_SESSION;
  const chosen =
    lesson.items.length <= cap
      ? [...lesson.items]
      : shuffle(lesson.items, seed)
          .slice(0, cap)
          .sort(
            (a, b) =>
              lesson.items.indexOf(a) - lesson.items.indexOf(b),
          );

  // ÉCOUTER, PUIS LIRE AUSSITÔT, un élément à la fois : c'est le talqīn du
  // maître de Coran — il dit, l'enfant redit. Écouter huit versets d'affilée
  // puis les relire tous demanderait une mémoire qu'un enfant de six ans n'a
  // pas. `read` SEUL, jamais `pronounce` : lire à voix haute EST l'exercice de
  // prononciation à ce niveau (voir l'en-tête de `curriculum.ts`).
  const steps: SessionStep[] = [];
  for (const item of chosen) {
    steps.push({ kind: "discoverItem", itemKey: item.key });
    if (has("read")) steps.push({ kind: "read", itemKey: item.key });
  }

  // Le jeu d'écoute des syllabes (leçons de voyelles) : « quel son entends-tu ? ».
  if (has("recognizeGlyph")) {
    shuffle(chosen, seed + 5)
      .slice(0, SYLLABLE_PICKS_PER_SESSION)
      .forEach((item, i) => {
        const options = syllableOptions(lesson, item.key, seed + i * 13);
        if (options.length >= 2) {
          steps.push({ kind: "pickSyllable", itemKey: item.key, options });
        }
      });
  }

  return steps;
}

/**
 * Les ballons d'un jeu de syllabes.
 *
 * DANS LA LEÇON « MÉLANGE », la même lettre avec ses trois voyelles (بَ بِ بُ) :
 * l'enfant doit entendre la VOYELLE. DANS UNE LEÇON D'UNE SEULE VOYELLE, la
 * même voyelle sur trois lettres qui se ressemblent (بَ تَ ثَ) : il doit
 * entendre la CONSONNE — il ne connaît pas encore les autres voyelles.
 */
function syllableOptions(lesson: ArabicLesson, itemKey: string, seed: number): string[] {
  const dash = itemKey.lastIndexOf("-");
  if (dash <= 0) return [];
  const letterKey = itemKey.slice(0, dash) as ArabicLetterKey;
  const haraka = itemKey.slice(dash + 1);
  const known = new Set(lesson.items.map((item) => item.key));

  const others =
    lesson.key === "harakat-melange"
      ? HARAKAT.map((entry) => `${letterKey}-${entry.key}`)
      : pickDistractors(
          letterKey,
          lesson.letters as ArabicLetterKey[],
          CHOICES_PER_QUESTION - 1,
          seed,
        ).map((key) => `${key}-${haraka}`);

  const distractors = others
    .filter((key) => key !== itemKey && known.has(key))
    .slice(0, CHOICES_PER_QUESTION - 1);
  return shuffle([itemKey, ...distractors], seed + 1);
}

/** Versets NEUFS par séance de mémorisation. Voir `buildHifzSession`. */
export const VERSES_PER_HIFZ_SESSION = 3;

/**
 * La séance de mémorisation — la seule qui dépende de ce que l'enfant sait
 * déjà.
 *
 * POURQUOI ELLE PREND UN ARGUMENT alors qu'aucune autre n'en prend. Les autres
 * séances RÉVISENT un contenu fixe : la leçon des quatre premières lettres est
 * la même au premier et au dixième passage. Une séance de ḥifẓ, non — on
 * reprend là où on s'est arrêté, et redonner les versets 1 à 3 à un enfant qui
 * en est au sixième serait lui faire perdre la seule chose qui compte ici, le
 * temps de mémorisation. `versesMemorized` vient du serveur
 * (`arabic.memorization.getState`), jamais d'un compteur local.
 *
 * TROIS VERSETS NEUFS AU PLUS. C'est le volume qu'un maître donne en une fois,
 * et ce n'est pas un hasard : au-delà, ce qu'on ajoute chasse ce qu'on venait
 * d'apprendre. Une sourate de sept versets se mémorise donc en trois séances,
 * ce qui est la vérité du geste plutôt qu'un plafond technique.
 *
 * ET CHAQUE SÉANCE FINIT PAR UNE LIAISON, à texte entièrement caché : c'est
 * elle qui vérifie qu'on est passé du verset 3 au verset 4 sans qu'on donne le
 * départ. Les versets neufs, eux, se récitent avec les AMORCES — première fois
 * qu'on les dit sans les lire, on laisse la première lettre de chaque mot.
 *
 * QUAND TOUT EST MÉMORISÉ, la séance devient une RÉVISION : la sourate
 * entière, cachée, et rien d'autre. Deux minutes, et l'échelon de révision
 * espacée bouge. C'est ce qui doit rester faisable tous les jours.
 */
function buildHifzSession(
  lesson: ArabicLesson,
  versesMemorized: number,
): SessionStep[] {
  const surahKey = lesson.surahKey;
  if (!surahKey) return [];

  // Les versets sont les items dont la clé n'est pas une liaison ; c'est la
  // leçon qui les a construits dans l'ordre (`curriculum.ts`).
  const linkKeys = new Set(
    linkPoints(lesson.items.length).map((upTo) => linkItemKey(surahKey, upTo)),
  );
  const verses = lesson.items.filter((item) => !linkKeys.has(item.key));
  const points = linkPoints(verses.length);
  // `Number.isFinite` D'ABORD, et ce n'est pas de la paranoïa : `Math.floor`,
  // `Math.max` et `Math.min` propagent tous NaN sans broncher, `slice(NaN, NaN)`
  // rend un tableau vide et `NaN >= length` est faux — une séance de zéro
  // étape, donc un écran bloqué sur lequel l'enfant ne peut rien faire. Un
  // test le tient (`lib/__tests__/arabic-session.test.ts`).
  const floored = Math.floor(versesMemorized);
  const known = Number.isFinite(floored)
    ? Math.min(Math.max(0, floored), verses.length)
    : 0;

  // Tout est su : on ne réapprend pas, on vérifie.
  if (known >= verses.length && verses.length > 0) {
    const whole = linkItemKey(surahKey, verses.length);
    const hasWhole = lesson.items.some((item) => item.key === whole);
    const target = hasWhole ? whole : verses[verses.length - 1].key;
    return [
      { kind: "discoverItem", itemKey: target },
      { kind: "recite", itemKey: target, mask: "hidden" },
    ];
  }

  const fresh = verses.slice(known, known + VERSES_PER_HIFZ_SESSION);
  const steps: SessionStep[] = [];
  for (const verse of fresh) {
    steps.push({ kind: "discoverItem", itemKey: verse.key });
    steps.push({ kind: "recite", itemKey: verse.key, mask: "hints" });
  }

  // La plus grande liaison désormais à portée — celle qui couvre tout ce que
  // l'enfant sait, pas seulement les versets du jour.
  const reach = known + fresh.length;
  const point = [...points].reverse().find((upTo) => upTo <= reach);
  if (point !== undefined) {
    const key = linkItemKey(surahKey, point);
    if (lesson.items.some((item) => item.key === key)) {
      steps.push({ kind: "discoverItem", itemKey: key });
      steps.push({ kind: "recite", itemKey: key, mask: "hidden" });
    }
  }

  return steps;
}
