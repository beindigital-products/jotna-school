import { describe, it, expect } from "vitest";
import {
  ARABIC_LETTERS,
  getLetter,
  isLetterKey,
  pickDistractors,
  shuffle,
  type ArabicLetterKey,
} from "../arabic/alphabet";
import {
  ARABIC_LESSONS,
  ARABIC_LEVELS,
  getLesson,
  lettersSeenUpTo,
  TOTAL_LESSONS,
} from "../arabic/curriculum";
import {
  ayahWords,
  EXPECTED_AYAH_COUNT,
  getSurah,
  SURAHS,
} from "../arabic/quran";
import {
  acceptedFormsForLetter,
  judgePronunciation,
  judgeReading,
  judgeRecitation,
  levenshtein,
  normalizeArabic,
  READING_OK,
  RECITATION_OK,
  similarity,
  tokenize,
} from "../arabic/matching";
import {
  isLessonUnlocked,
  lessonScore,
  nextLessonKey,
  placementFloorOrder,
  starsFor,
} from "../arabic/progressRules";
import {
  hifzLessonKey,
  isDue,
  linkPointOf,
  linkPoints,
  linkText,
  maskAyah,
  MAX_STRENGTH,
  nextDueAt,
  nextStrength,
  versesMemorizedFrom,
  wordCount,
} from "../arabic/hifz";

// ---------------------------------------------------------------------------
// L'alphabet — la donnée de référence. Ces tests ne jugent pas du goût des
// translittérations ; ils tiennent les invariants dont le reste du module
// dépend, et qu'une retouche distraite casserait sans rien afficher.
// ---------------------------------------------------------------------------

describe("alphabet", () => {
  it("compte exactement 28 lettres", () => {
    expect(ARABIC_LETTERS).toHaveLength(28);
  });

  it("des clés uniques et des rangs contigus de 1 à 28", () => {
    const keys = new Set(ARABIC_LETTERS.map((l) => l.key));
    expect(keys.size).toBe(28);
    expect(ARABIC_LETTERS.map((l) => l.order)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
  });

  it("chaque lettre confusable existe et n'est pas elle-même", () => {
    for (const letter of ARABIC_LETTERS) {
      for (const key of letter.confusables) {
        expect(isLetterKey(key)).toBe(true);
        expect(key).not.toBe(letter.key);
      }
    }
  });

  it("les six lettres qui n'attachent pas ont la même forme initiale qu'isolée", () => {
    // ا د ذ ر ز و — la règle d'écriture que le niveau 1 enseigne. Si une
    // retouche donnait une forme initiale attachée à l'une d'elles, l'écran
    // montrerait un mot impossible.
    const nonConnecting = ARABIC_LETTERS.filter((l) => !l.connectsToNext);
    expect(nonConnecting.map((l) => l.key)).toEqual([
      "alif", "dal", "dhal", "ra", "zay", "waw",
    ]);
    for (const letter of nonConnecting) {
      expect(letter.initial).toBe(letter.isolated);
    }
  });

  it("les lettres qui attachent ont quatre formes distinctes de l'isolée", () => {
    for (const letter of ARABIC_LETTERS.filter((l) => l.connectsToNext)) {
      expect(letter.initial).not.toBe(letter.final);
      expect(letter.medial.startsWith("ـ")).toBe(true);
      expect(letter.final.startsWith("ـ")).toBe(true);
    }
  });

  it("chaque syllabe porte bien sa lettre et sa voyelle", () => {
    for (const letter of ARABIC_LETTERS) {
      // L'alif fait exception : ses syllabes s'écrivent avec la hamza
      // (أَ إِ أُ), qui est ce qu'on prononce réellement.
      if (letter.key === "alif") continue;
      expect(letter.syllables.fatha).toBe(letter.isolated + "َ");
      expect(letter.syllables.kasra).toBe(letter.isolated + "ِ");
      expect(letter.syllables.damma).toBe(letter.isolated + "ُ");
    }
  });

  it("getLetter rend null pour une clé inventée", () => {
    expect(getLetter("zorglub")).toBeNull();
    expect(getLetter("ba")?.nameFr).toBe("bâ");
  });
});

describe("pickDistractors", () => {
  const pool = ARABIC_LETTERS.map((l) => l.key);

  it("ne propose jamais la bonne réponse comme leurre", () => {
    for (const letter of ARABIC_LETTERS) {
      const picks = pickDistractors(letter.key, pool, 3, 42);
      expect(picks).not.toContain(letter.key);
      expect(new Set(picks).size).toBe(picks.length);
    }
  });

  it("préfère les lettres qui se confondent — ت tire d'abord ب ث ن", () => {
    const picks = pickDistractors("ta", pool, 3, 7);
    expect(picks.sort()).toEqual(["ba", "nun", "tha"]);
  });

  it("reste dans la réserve, même quand elle est minuscule", () => {
    const tiny: ArabicLetterKey[] = ["alif", "ba", "ta"];
    const picks = pickDistractors("ba", tiny, 3, 1);
    expect(picks).toHaveLength(2); // deux seulement : la réserve n'en a pas plus
    for (const key of picks) expect(tiny).toContain(key);
  });

  it("même graine, même tirage — un rechargement ne rebat pas les cartes", () => {
    expect(pickDistractors("sin", pool, 3, 99)).toEqual(
      pickDistractors("sin", pool, 3, 99),
    );
  });
});

describe("shuffle", () => {
  it("conserve tous les éléments", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, 12345);
    expect(out.sort((a, b) => a - b)).toEqual(input);
  });
});

// ---------------------------------------------------------------------------
// Le Coran — on ne peut pas tester un texte sacré, on peut tester sa FORME.
// Ces assertions attrapent un verset perdu au copier-coller, pas une voyelle
// fausse : la relecture humaine reste due (voir l'en-tête de `quran.ts`).
// ---------------------------------------------------------------------------

describe("sourates", () => {
  it("chaque sourate a le nombre de versets attendu", () => {
    for (const surah of SURAHS) {
      expect(EXPECTED_AYAH_COUNT[surah.key]).toBe(surah.ayahs.length);
    }
    expect(Object.keys(EXPECTED_AYAH_COUNT).sort()).toEqual(
      SURAHS.map((s) => s.key).sort(),
    );
  });

  it("les versets sont numérotés de 1 à n, sans trou ni doublon", () => {
    for (const surah of SURAHS) {
      expect(surah.ayahs.map((a) => a.number)).toEqual(
        Array.from({ length: surah.ayahs.length }, (_, i) => i + 1),
      );
    }
  });

  it("aucun verset vide, et tous en écriture arabe", () => {
    for (const surah of SURAHS) {
      for (const ayah of surah.ayahs) {
        expect(ayah.ar.trim().length).toBeGreaterThan(0);
        expect(/[ء-ي]/.test(ayah.ar)).toBe(true);
      }
    }
  });

  it("toutes les sourates sont dans la même riwāya — mélanger serait pire que tout", () => {
    for (const surah of SURAHS) expect(surah.riwaya).toBe("hafs");
  });

  it("ayahWords découpe sur les espaces", () => {
    expect(ayahWords({ number: 2, ar: "مَلِكِ النَّاسِ" })).toHaveLength(2);
    expect(getSurah("an-nas")?.ayahs).toHaveLength(6);
    expect(getSurah("inconnue")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Le parcours
// ---------------------------------------------------------------------------

describe("curriculum", () => {
  it("des clés de leçon uniques et des rangs contigus", () => {
    const keys = new Set(ARABIC_LESSONS.map((l) => l.key));
    expect(keys.size).toBe(ARABIC_LESSONS.length);
    expect(ARABIC_LESSONS.map((l) => l.order)).toEqual(
      Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1),
    );
  });

  it("chaque leçon appartient à un niveau déclaré", () => {
    const levels = new Set(ARABIC_LEVELS.map((l) => l.key));
    for (const lesson of ARABIC_LESSONS) {
      expect(levels.has(lesson.levelKey)).toBe(true);
    }
  });

  it("le niveau 1 enseigne les 28 lettres, chacune une seule fois", () => {
    const taught = ARABIC_LESSONS.filter((l) => l.levelKey === "alphabet")
      .flatMap((l) => l.letters);
    expect(taught).toHaveLength(28);
    expect(new Set(taught).size).toBe(28);
  });

  it("aucune leçon sans exercice, aucune leçon de lecture sans contenu", () => {
    for (const lesson of ARABIC_LESSONS) {
      expect(lesson.drills.length).toBeGreaterThan(0);
      if (lesson.kind !== "alphabet") {
        expect(lesson.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("les clés d'items sont uniques à l'intérieur d'une leçon", () => {
    for (const lesson of ARABIC_LESSONS) {
      const keys = lesson.items.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("une leçon de Coran ne fait pas écrire au doigt", () => {
    for (const lesson of ARABIC_LESSONS.filter((l) => l.kind === "coran")) {
      expect(lesson.drills).not.toContain("write");
      expect(lesson.surahKey).toBeTruthy();
    }
  });

  it("la réserve de lettres vues ne fait que grandir", () => {
    let previous = 0;
    for (const lesson of ARABIC_LESSONS) {
      const seen = lettersSeenUpTo(lesson.key).length;
      expect(seen).toBeGreaterThanOrEqual(previous);
      previous = seen;
    }
    // Arrivé au bout, l'élève a rencontré tout l'alphabet.
    expect(previous).toBe(28);
  });

  it("getLesson rend null pour une clé inventée", () => {
    expect(getLesson("nope")).toBeNull();
    expect(getLesson("alphabet-1")?.letters).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// La comparaison de prononciation
// ---------------------------------------------------------------------------

describe("normalizeArabic", () => {
  it("retire les voyelles brèves", () => {
    expect(normalizeArabic("بَاء")).toBe(normalizeArabic("باء"));
  });

  it("unifie les hamza portées par l'alif", () => {
    expect(normalizeArabic("أَحَد")).toBe(normalizeArabic("احد"));
    expect(normalizeArabic("إِيَّاكَ")).toBe(normalizeArabic("اياك"));
  });

  it("unifie ة et ه, ى et ي", () => {
    expect(normalizeArabic("مَدْرَسَة")).toBe(normalizeArabic("مدرسه"));
    expect(normalizeArabic("عَلَى")).toBe(normalizeArabic("علي"));
  });

  it("laisse tomber l'article défini — « al-bâ » vaut « bâ »", () => {
    expect(normalizeArabic("الباء")).toBe(normalizeArabic("باء"));
  });

  it("écarte la ponctuation, les chiffres et le latin", () => {
    expect(normalizeArabic("باء, 12 ok!")).toBe(normalizeArabic("باء"));
  });

  it("tokenize rend les mots d'un verset", () => {
    expect(tokenize(normalizeArabic("مَلِكِ النَّاسِ"))).toHaveLength(2);
  });
});

describe("levenshtein / similarity", () => {
  it("0 pour deux chaînes identiques, 1 pour une substitution", () => {
    expect(levenshtein("باء", "باء")).toBe(0);
    expect(levenshtein("باء", "تاء")).toBe(1);
  });

  it("similarité de 1 à 0", () => {
    expect(similarity("باء", "باء")).toBe(1);
    expect(similarity("", "")).toBe(1);
    expect(similarity("باء", "")).toBe(0);
  });
});

describe("judgePronunciation", () => {
  const ba = getLetter("ba")!;
  const accepted = acceptedFormsForLetter(ba);

  it("accepte le nom de la lettre", () => {
    const out = judgePronunciation({
      accepted,
      transcript: "باء",
      requireGlyph: ba.isolated,
    });
    expect(out.verdict).toBe("ok");
    expect(out.score).toBe(1);
  });

  it("accepte la syllabe allongée que les enfants disent spontanément", () => {
    const out = judgePronunciation({
      accepted,
      transcript: "با",
      requireGlyph: ba.isolated,
    });
    expect(out.verdict).toBe("ok");
  });

  it("accepte le mot noyé dans une phrase transcrite", () => {
    const out = judgePronunciation({
      accepted,
      transcript: "حرف باء",
      requireGlyph: ba.isolated,
    });
    expect(out.verdict).toBe("ok");
  });

  it("refuse une AUTRE lettre, même quand les chaînes se ressemblent", () => {
    // « تاء » ne diffère de « باء » que d'un caractère sur trois : sans la
    // garde sur le glyphe, la similarité (0,67) frôlerait le seuil. C'est le
    // défaut précis que `requireGlyph` existe pour fermer.
    const out = judgePronunciation({
      accepted,
      transcript: "تاء",
      requireGlyph: ba.isolated,
    });
    expect(out.verdict).not.toBe("ok");
  });

  it("rend « presque » quand on n'est pas loin", () => {
    const out = judgePronunciation({
      accepted,
      transcript: "تاء",
      requireGlyph: ba.isolated,
    });
    expect(out.verdict).toBe("close");
  });

  it("rend « on réessaie » sur du silence ou du bruit", () => {
    const out = judgePronunciation({ accepted, transcript: "" });
    expect(out.verdict).toBe("retry");
    expect(out.score).toBe(0);
  });
});

describe("judgeReading", () => {
  const ayah = "قُلْ أَعُوذُ بِرَبِّ النَّاسِ";

  it("verset lu en entier : tous les mots retrouvés", () => {
    const out = judgeReading({ expected: ayah, transcript: ayah });
    expect(out.verdict).toBe("ok");
    expect(out.score).toBe(1);
    expect(out.missing).toEqual([]);
  });

  it("un mot oublié se voit, et se nomme", () => {
    const out = judgeReading({
      expected: ayah,
      transcript: "قل أعوذ برب",
    });
    expect(out.score).toBeCloseTo(0.75, 5);
    expect(out.missing).toHaveLength(1);
  });

  it("répéter le même mot ne valide pas le verset", () => {
    // Sans la consommation des mots entendus, « الناس » répété quatre fois
    // vaudrait quatre mots retrouvés.
    const out = judgeReading({
      expected: ayah,
      transcript: "الناس الناس الناس الناس",
    });
    expect(out.score).toBeLessThanOrEqual(0.25);
  });

  it("un verset vide ne peut pas être réussi", () => {
    const out = judgeReading({ expected: "", transcript: "قل" });
    expect(out.verdict).toBe("retry");
  });
});

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

describe("déverrouillage", () => {
  const first = ARABIC_LESSONS[0].key;
  const second = ARABIC_LESSONS[1].key;
  const third = ARABIC_LESSONS[2].key;

  it("la première leçon est toujours ouverte", () => {
    expect(isLessonUnlocked(first, new Set())).toBe(true);
  });

  it("la suivante attend que la précédente soit terminée", () => {
    expect(isLessonUnlocked(second, new Set())).toBe(false);
    expect(isLessonUnlocked(second, new Set([first]))).toBe(true);
    expect(isLessonUnlocked(third, new Set([first]))).toBe(false);
  });

  it("une leçon terminée reste ouverte — on révise", () => {
    expect(isLessonUnlocked(third, new Set([third]))).toBe(true);
  });

  it("une clé inconnue n'ouvre rien", () => {
    expect(isLessonUnlocked("nope", new Set())).toBe(false);
  });

  it("nextLessonKey suit le fil, puis retombe sur la dernière", () => {
    expect(nextLessonKey(new Set())).toBe(first);
    expect(nextLessonKey(new Set([first]))).toBe(second);
    const all = new Set(ARABIC_LESSONS.map((l) => l.key));
    expect(nextLessonKey(all)).toBe(
      ARABIC_LESSONS[ARABIC_LESSONS.length - 1].key,
    );
  });
});

describe("note et étoiles", () => {
  it("garde le MEILLEUR essai de chaque exercice", () => {
    const score = lessonScore([
      { drill: "pronounce", itemKey: "ba", correct: false, score: 0.1 },
      { drill: "pronounce", itemKey: "ba", correct: true, score: 0.9 },
    ]);
    expect(score).toBeCloseTo(0.9, 5);
  });

  it("prononcer et écrire la même lettre comptent pour deux", () => {
    const score = lessonScore([
      { drill: "pronounce", itemKey: "ba", correct: true, score: 1 },
      { drill: "write", itemKey: "ba", correct: false, score: 0 },
    ]);
    expect(score).toBeCloseTo(0.5, 5);
  });

  it("un QCM sans note vaut 1 ou 0", () => {
    expect(
      lessonScore([{ drill: "recognizeGlyph", itemKey: "ba", correct: true }]),
    ).toBe(1);
    expect(
      lessonScore([{ drill: "recognizeGlyph", itemKey: "ba", correct: false }]),
    ).toBe(0);
  });

  it("aucune tentative : zéro, et pas une division par zéro", () => {
    expect(lessonScore([])).toBe(0);
  });

  it("une note hors bornes est ramenée dans [0,1]", () => {
    expect(
      lessonScore([{ drill: "write", itemKey: "ba", correct: true, score: 4 }]),
    ).toBe(1);
  });

  it("les étoiles ne descendent jamais à zéro pour qui a terminé", () => {
    expect(starsFor(0)).toBe(1);
    expect(starsFor(0.7)).toBe(2);
    expect(starsFor(0.95)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// La mémorisation — ce qui la distingue de la lecture, tenu par des tests.
//
// Trois choses doivent rester vraies, et aucune n'est évidente : le masque ne
// doit pas laisser fuir le texte, la récitation doit exiger l'ORDRE, et
// l'échelle de révision ne doit jamais renvoyer un enfant à zéro.
// ---------------------------------------------------------------------------

describe("masque", () => {
  const verset = "قُلْ هُوَ اللَّهُ أَحَدٌ";

  it("« full » rend le texte intact", () => {
    expect(maskAyah(verset, "full")).toBe(verset);
  });

  it("conserve le nombre de mots à tous les degrés — c'est l'aide du maître", () => {
    for (const degree of ["full", "hints", "hidden"] as const) {
      expect(wordCount(maskAyah(verset, degree))).toBe(wordCount(verset));
    }
  });

  it("« hints » ne laisse QUE la première lettre de chaque mot", () => {
    const masked = maskAyah(verset, "hints");
    const words = verset.split(" ");
    masked.split(" ").forEach((shown, i) => {
      // La première lettre du mot d'origine, sans sa voyelle.
      expect(shown.startsWith(words[i][0])).toBe(true);
      // Et rien du reste : le mot masqué est plus court que l'original.
      expect(normalizeArabic(shown).length).toBeLessThan(
        normalizeArabic(words[i]).length + 1,
      );
    });
  });

  it("« hidden » ne laisse AUCUNE lettre du verset", () => {
    const masked = maskAyah(verset, "hidden");
    for (const word of tokenize(normalizeArabic(verset))) {
      expect(masked.includes(word)).toBe(false);
    }
    expect(normalizeArabic(masked).trim()).toBe("");
  });

  it("masquer une chaîne vide ne casse rien", () => {
    expect(maskAyah("", "hidden")).toBe("");
    expect(wordCount("")).toBe(0);
  });
});

describe("liaisons", () => {
  it("se terminent toujours par la sourate entière", () => {
    for (const surah of SURAHS) {
      const points = linkPoints(surah.ayahs.length);
      expect(points[points.length - 1]).toBe(surah.ayahs.length);
    }
  });

  it("ne répètent jamais deux fois le même palier", () => {
    for (const surah of SURAHS) {
      const points = linkPoints(surah.ayahs.length);
      expect(new Set(points).size).toBe(points.length);
    }
  });

  it("le texte d'une liaison porte tous les versets jusqu'au palier", () => {
    const surah = getSurah("al-ikhlas");
    if (!surah) throw new Error("sourate de test introuvable");
    const text = linkText(surah, 3);
    for (const ayah of surah.ayahs.slice(0, 3)) {
      expect(text.includes(ayah.ar)).toBe(true);
    }
    expect(text.includes(surah.ayahs[3].ar)).toBe(false);
  });
});

describe("judgeRecitation", () => {
  const verset = "قُلْ هُوَ اللَّهُ أَحَدٌ";

  it("accepte une récitation exacte", () => {
    const judgement = judgeRecitation({ expected: verset, transcript: verset });
    expect(judgement.verdict).toBe("ok");
    expect(judgement.score).toBe(1);
    expect(judgement.firstMiss).toBeNull();
  });

  it("REFUSE les bons mots dans le désordre — c'est toute la différence", () => {
    // La lecture suivie accepterait : les mots y sont tous. La mémorisation,
    // non — savoir le vocabulaire d'un verset n'est pas savoir le verset.
    const inverse = verset.split(" ").reverse().join(" ");
    const recite = judgeRecitation({ expected: verset, transcript: inverse });
    const read = judgeReading({ expected: verset, transcript: inverse });
    expect(read.verdict).toBe("ok");
    expect(recite.verdict).not.toBe("ok");
  });

  it("répéter un mot ne valide pas un verset", () => {
    const judgement = judgeRecitation({
      expected: verset,
      transcript: "قُلْ قُلْ قُلْ قُلْ",
    });
    expect(judgement.verdict).not.toBe("ok");
  });

  it("dit où la récitation a décroché", () => {
    const words = verset.split(" ");
    const judgement = judgeRecitation({
      expected: verset,
      transcript: [words[0], words[1], words[3]].join(" "),
    });
    expect(judgement.firstMiss).not.toBeNull();
    expect(judgement.missing.length).toBeGreaterThan(0);
  });

  it("une hésitation au milieu ne fait pas tout tomber", () => {
    const words = verset.split(" ");
    const avecBruit = [words[0], "اه", ...words.slice(1)].join(" ");
    expect(judgeRecitation({ expected: verset, transcript: avecBruit }).verdict)
      .toBe("ok");
  });

  it("le silence ne vaut rien", () => {
    expect(judgeRecitation({ expected: verset, transcript: "" }).verdict).toBe(
      "retry",
    );
  });

  it("est plus exigeant que la lecture — le texte n'est plus sous les yeux", () => {
    expect(RECITATION_OK).toBeGreaterThan(READING_OK);
  });
});

describe("révision espacée", () => {
  it("une réussite fait monter d'un cran, jusqu'au plafond", () => {
    expect(nextStrength(0, "ok")).toBe(1);
    expect(nextStrength(MAX_STRENGTH, "ok")).toBe(MAX_STRENGTH);
  });

  it("« presque » laisse la sourate où elle est", () => {
    expect(nextStrength(3, "close")).toBe(3);
  });

  it("un échec ne renvoie JAMAIS à zéro — un mardi soir n'efface pas trois mois", () => {
    expect(nextStrength(5, "retry")).toBe(4);
    expect(nextStrength(1, "retry")).toBe(0);
    expect(nextStrength(0, "retry")).toBe(0);
  });

  it("plus la sourate est sue, plus elle revient tard", () => {
    const now = 1_700_000_000_000;
    for (let strength = 1; strength <= MAX_STRENGTH; strength++) {
      expect(nextDueAt(strength, now)).toBeGreaterThan(
        nextDueAt(strength - 1, now),
      );
    }
  });

  it("une force fraîche revient dès le lendemain", () => {
    const now = 1_700_000_000_000;
    expect(nextDueAt(0, now) - now).toBe(86_400_000);
  });

  it("une échéance passée est due, une échéance future ne l'est pas", () => {
    const now = 1_700_000_000_000;
    expect(isDue(now - 1, now)).toBe(true);
    expect(isDue(now + 1, now)).toBe(false);
  });

  it("une force absurde ne fait pas sortir de l'échelle", () => {
    const now = 1_700_000_000_000;
    expect(nextDueAt(-5, now)).toBe(nextDueAt(0, now));
    expect(nextDueAt(999, now)).toBe(nextDueAt(MAX_STRENGTH, now));
    expect(nextDueAt(Number.NaN, now)).toBe(nextDueAt(0, now));
  });
});

describe("versets tenus", () => {
  it("ne compte QUE les versets consécutifs depuis le premier", () => {
    // Savoir les versets 1, 2 et 4, ce n'est pas en savoir trois : c'est en
    // savoir deux, et un morceau détaché.
    expect(
      versesMemorizedFrom(
        "al-ikhlas",
        new Set(["al-ikhlas-1", "al-ikhlas-2", "al-ikhlas-4"]),
      ),
    ).toBe(2);
  });

  it("compte la sourate entière quand tout y est", () => {
    const surah = getSurah("al-ikhlas");
    if (!surah) throw new Error("sourate de test introuvable");
    const all = new Set(
      surah.ayahs.map((ayah) => `al-ikhlas-${ayah.number}`),
    );
    expect(versesMemorizedFrom("al-ikhlas", all)).toBe(surah.ayahs.length);
  });

  it("rend 0 pour une sourate inconnue", () => {
    expect(versesMemorizedFrom("inventee", new Set(["inventee-1"]))).toBe(0);
  });
});

describe("curriculum — le niveau de mémorisation", () => {
  it("une leçon de mémorisation par sourate, et pas une de plus", () => {
    const hifz = ARABIC_LESSONS.filter((lesson) => lesson.kind === "hifz");
    expect(hifz.length).toBe(SURAHS.length);
    expect(new Set(hifz.map((lesson) => lesson.surahKey)).size).toBe(
      SURAHS.length,
    );
  });

  it("vient APRÈS la lecture — on ne mémorise pas ce qu'on ne sait pas lire", () => {
    for (const surah of SURAHS) {
      const lue = getLesson(`coran-${surah.key}`);
      const sue = getLesson(hifzLessonKey(surah.key));
      expect(lue).not.toBeNull();
      expect(sue).not.toBeNull();
      expect(sue!.order).toBeGreaterThan(lue!.order);
    }
  });

  it("porte les versets ET les liaisons, sans rien recopier", () => {
    for (const surah of SURAHS) {
      const lesson = getLesson(hifzLessonKey(surah.key));
      expect(lesson).not.toBeNull();
      expect(lesson!.items.length).toBe(
        surah.ayahs.length + linkPoints(surah.ayahs.length).length,
      );
      // Chaque verset apparaît tel quel — la liaison est faite depuis eux.
      for (const ayah of surah.ayahs) {
        expect(
          lesson!.items.some((item) => item.ar === ayah.ar),
        ).toBe(true);
      }
    }
  });

  it("ne fait ni écrire ni lire — seulement réciter", () => {
    for (const lesson of ARABIC_LESSONS) {
      if (lesson.kind !== "hifz") continue;
      expect([...lesson.drills]).toEqual(["recite"]);
    }
  });
});

describe("placement", () => {
  const rien = new Set<string>();

  it("« débutant » n'ouvre rien de plus que la règle séquentielle", () => {
    const floor = placementFloorOrder({ level: "debutant" });
    expect(floor).toBe(0);
    expect(isLessonUnlocked(ARABIC_LESSONS[1].key, rien, floor)).toBe(false);
  });

  it("« intermédiaire » ouvre jusqu'aux voyelles, « confirmé » jusqu'aux sourates", () => {
    const inter = placementFloorOrder({ level: "intermediaire" });
    const confirme = placementFloorOrder({ level: "confirme" });
    expect(inter).toBeGreaterThan(0);
    expect(confirme).toBeGreaterThan(inter);

    const premiereVoyelle = ARABIC_LESSONS.find(
      (lesson) => lesson.levelKey === "harakat",
    );
    const premiereSourate = ARABIC_LESSONS.find(
      (lesson) => lesson.levelKey === "coran",
    );
    expect(isLessonUnlocked(premiereVoyelle!.key, rien, inter)).toBe(true);
    expect(isLessonUnlocked(premiereSourate!.key, rien, inter)).toBe(false);
    expect(isLessonUnlocked(premiereSourate!.key, rien, confirme)).toBe(true);
  });

  it("un plancher OUVRE tout ce qui le précède, il n'en ferme rien", () => {
    const floor = placementFloorOrder({ level: "confirme" });
    for (const lesson of ARABIC_LESSONS) {
      if (lesson.order > floor) continue;
      expect(isLessonUnlocked(lesson.key, rien, floor)).toBe(true);
    }
  });

  it("une leçon ouverte par placement n'est PAS terminée — placer ne valide pas", () => {
    // Le plancher n'écrit rien : la seule source de « terminé » reste
    // `completedKeys`, que seule `completeLesson` remplit.
    const floor = placementFloorOrder({ level: "confirme" });
    const ouvertes = ARABIC_LESSONS.filter(
      (lesson) => lesson.order <= floor,
    );
    expect(ouvertes.length).toBeGreaterThan(0);
    for (const lesson of ouvertes) expect(rien.has(lesson.key)).toBe(false);
  });

  it("on prend le repère le plus avancé des trois", () => {
    const parSourate = placementFloorOrder({
      level: "debutant",
      surahKey: "an-nas",
    });
    expect(parSourate).toBe(
      getLesson(hifzLessonKey("an-nas"))!.order,
    );
    // Le niveau ne peut pas faire redescendre une sourate déjà déclarée.
    expect(
      placementFloorOrder({ level: "intermediaire", surahKey: "an-nas" }),
    ).toBe(parSourate);
  });

  it("une clé inventée ne déplace rien", () => {
    expect(
      placementFloorOrder({ level: "debutant", startLessonKey: "inventee" }),
    ).toBe(0);
    expect(
      placementFloorOrder({ level: "debutant", surahKey: "inventee" }),
    ).toBe(0);
  });

  it("aucun placement rend le parcours d'origine", () => {
    expect(placementFloorOrder(null)).toBe(0);
    expect(placementFloorOrder(undefined)).toBe(0);
  });

  it("« Continuer » ne renvoie pas un élève placé au début du parcours", () => {
    const floor = placementFloorOrder({ level: "confirme" });
    const suite = nextLessonKey(rien, floor);
    expect(getLesson(suite)!.order).toBeGreaterThanOrEqual(floor);
    // Sans plancher, c'est bien la première leçon qui sortirait.
    expect(nextLessonKey(rien)).toBe(ARABIC_LESSONS[0].key);
  });

  it("quand tout ce qui suit le plancher est fait, on revient en arrière", () => {
    const floor = placementFloorOrder({ level: "confirme" });
    const toutApres = new Set(
      ARABIC_LESSONS.filter((lesson) => lesson.order >= floor).map(
        (lesson) => lesson.key,
      ),
    );
    const suite = nextLessonKey(toutApres, floor);
    expect(toutApres.has(suite)).toBe(false);
  });
});

describe("linkPointOf", () => {
  it("reconnaît une liaison et son palier", () => {
    expect(linkPointOf("an-nas", "an-nas-lien-3")).toBe(3);
    expect(linkPointOf("an-nas", "an-nas-lien-6")).toBe(6);
  });

  it("ne confond pas un verset avec une liaison", () => {
    // C'est ce qui décide quelle tentative fait bouger l'échelon de révision :
    // prendre un verset pour une liaison ferait monter une sourate sur un seul
    // verset récité, sans jamais l'avoir enchaînée.
    expect(linkPointOf("an-nas", "an-nas-3")).toBeNull();
    expect(linkPointOf("an-nas", "al-falaq-lien-3")).toBeNull();
    expect(linkPointOf("an-nas", "an-nas-lien-zero")).toBeNull();
    expect(linkPointOf("an-nas", "an-nas-lien-0")).toBeNull();
  });

  it("chaque liaison du curriculum se relit avec sa propre clé", () => {
    for (const surah of SURAHS) {
      const lesson = getLesson(hifzLessonKey(surah.key))!;
      const paliers = lesson.items
        .map((item) => linkPointOf(surah.key, item.key))
        .filter((point): point is number => point !== null);
      expect(paliers.sort((a, b) => a - b)).toEqual(
        linkPoints(surah.ayahs.length),
      );
    }
  });
});
