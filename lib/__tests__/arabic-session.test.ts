import { describe, it, expect } from "vitest";
import {
  buildSession,
  CHOICES_PER_QUESTION,
  drillOf,
  isScored,
  seedFromKey,
  SYLLABLES_PER_SESSION,
  VERSES_PER_HIFZ_SESSION,
  type SessionStep,
} from "../arabic/session";
import { ARABIC_LESSONS, getLesson } from "@/convex/arabic/curriculum";
import { hifzLessonKey, linkItemKey } from "@/convex/arabic/hifz";
import { getSurah } from "@/convex/arabic/quran";

const alphabetLesson = getLesson("alphabet-1")!;
const coranLesson = getLesson("coran-an-nas")!;
const mixedHarakat = getLesson("harakat-melange")!;
// An-Nās fait six versets : assez pour que la séance ait à en laisser.
const hifzLesson = getLesson(hifzLessonKey("an-nas"))!;
const hifzSurah = getSurah("an-nas")!;

describe("seedFromKey", () => {
  it("stable et non nul", () => {
    expect(seedFromKey("alphabet-1")).toBe(seedFromKey("alphabet-1"));
    expect(seedFromKey("alphabet-1")).not.toBe(seedFromKey("alphabet-2"));
    expect(seedFromKey("")).toBeGreaterThan(0);
  });
});

describe("buildSession — leçon d'alphabet", () => {
  const steps = buildSession(alphabetLesson);

  it("une lettre à la fois : rencontre, répétition, ballons — puis la suivante", () => {
    const opening = steps.slice(0, alphabetLesson.letters.length * 3);
    expect(opening.map((s) => [s.kind, s.itemKey])).toEqual(
      alphabetLesson.letters.flatMap((letterKey) => [
        ["discoverLetter", letterKey],
        ["pronounce", letterKey],
        ["recognizeGlyph", letterKey],
      ]),
    );
  });

  it("relie chaque lettre de la leçon à son image, en une seule étape", () => {
    const match = steps.filter((s) => s.kind === "matchPictures");
    expect(match).toHaveLength(1);
    expect(match[0].kind === "matchPictures" && match[0].letters).toEqual([
      ...alphabetLesson.letters,
    ]);
  });

  it("aucune étape ne demande les formes attachées à un débutant", () => {
    expect(steps.some((s) => (s.kind as string) === "forms")).toBe(false);
  });

  it("finit TOUJOURS par l'écriture — le geste qui fixe le reste", () => {
    const last = steps[steps.length - 1];
    expect(last.kind).toBe("write");
  });

  it("prononce avant d'écrire : on n'écrit pas ce qu'on ne sait pas dire", () => {
    const firstWrite = steps.findIndex((s) => s.kind === "write");
    const lastPronounce = steps.map((s) => s.kind).lastIndexOf("pronounce");
    expect(lastPronounce).toBeLessThan(firstWrite);
  });

  it("chaque lettre est prononcée et écrite", () => {
    for (const letterKey of alphabetLesson.letters) {
      expect(
        steps.some((s) => s.kind === "pronounce" && s.itemKey === letterKey),
      ).toBe(true);
      expect(
        steps.some((s) => s.kind === "write" && s.itemKey === letterKey),
      ).toBe(true);
    }
  });

  it("les ballons contiennent la bonne réponse, trois au plus, sans doublon", () => {
    for (const step of steps) {
      if (step.kind !== "recognizeGlyph") continue;
      expect(step.options).toContain(step.itemKey);
      expect(step.options.length).toBeGreaterThanOrEqual(2);
      expect(step.options.length).toBeLessThanOrEqual(CHOICES_PER_QUESTION);
      expect(new Set(step.options).size).toBe(step.options.length);
    }
  });

  it("le QCM des points propose toujours les quatre comptes possibles", () => {
    for (const step of steps) {
      if (step.kind !== "dots") continue;
      expect([...step.options].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it("la même leçon rend la même séance — un rechargement ne rebat rien", () => {
    expect(buildSession(alphabetLesson)).toEqual(steps);
  });
});

describe("buildSession — leçon de lecture", () => {
  it("chaque verset est écouté, puis lu aussitôt — le talqīn du maître", () => {
    const steps = buildSession(coranLesson);
    const discovered = steps.filter((s) => s.kind === "discoverItem");
    const read = steps.filter((s) => s.kind === "read");
    expect(discovered).toHaveLength(coranLesson.items.length);
    expect(read).toHaveLength(coranLesson.items.length);
    // Chaque lecture suit IMMÉDIATEMENT l'écoute du même verset.
    steps.forEach((step, i) => {
      if (step.kind !== "read") return;
      expect(steps[i - 1]).toEqual({ kind: "discoverItem", itemKey: step.itemKey });
    });
  });

  it("les voyelles se vérifient à l'oreille : un jeu « quel son ? » par séance", () => {
    const steps = buildSession(mixedHarakat);
    const picks = steps.filter((s) => s.kind === "pickSyllable");
    expect(picks.length).toBeGreaterThan(0);
    for (const pick of picks) {
      if (pick.kind !== "pickSyllable") continue;
      expect(pick.options).toContain(pick.itemKey);
      // Dans la leçon « mélange », les ballons ne diffèrent que par la voyelle.
      const letterOf = (key: string) => key.slice(0, key.lastIndexOf("-"));
      expect(new Set(pick.options.map(letterOf)).size).toBe(1);
    }
    const fatha = buildSession(getLesson("harakat-fatha")!);
    for (const pick of fatha) {
      if (pick.kind !== "pickSyllable") continue;
      // Dans une leçon d'une seule voyelle, les ballons ne diffèrent que par la lettre.
      expect(pick.options.every((key) => key.endsWith("-fatha"))).toBe(true);
    }
  });

  it("aucune écriture au doigt sur un verset", () => {
    expect(buildSession(coranLesson).some((s) => s.kind === "write")).toBe(
      false,
    );
  });

  it("une leçon trop longue est échantillonnée, sans casser l'ordre", () => {
    // 12 lettres × 3 voyelles = 36 items : on n'en impose pas 36 à un enfant.
    expect(mixedHarakat.items.length).toBeGreaterThan(SYLLABLES_PER_SESSION);
    const steps = buildSession(mixedHarakat);
    const picked = steps
      .filter((s) => s.kind === "discoverItem")
      .map((s) => s.itemKey);
    expect(picked).toHaveLength(SYLLABLES_PER_SESSION);

    const order = mixedHarakat.items.map((item) => item.key);
    const positions = picked.map((key) => order.indexOf(key));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe("toutes les leçons du parcours", () => {
  it("produisent une séance jouable et bornée", () => {
    for (const lesson of ARABIC_LESSONS) {
      const steps = buildSession(lesson);
      expect(steps.length).toBeGreaterThan(0);
      // Au-delà d'une trentaine d'étapes, une séance devient une corvée.
      expect(steps.length).toBeLessThanOrEqual(30);
    }
  });

  it("chaque étape notée porte une famille que le serveur accepte", () => {
    // Recopiée à la main depuis les validateurs de `arabic/lessons.ts` et
    // `arabic/db.ts` : c'est le but. Une famille que la séance joue sans que
    // le serveur l'accepte perdrait silencieusement toutes ses tentatives.
    const accepted = new Set([
      "recognizeGlyph", "recognizeName", "dots", "forms", "pronounce",
      "write", "read", "recite",
    ]);
    for (const lesson of ARABIC_LESSONS) {
      for (const step of buildSession(lesson)) {
        const drill = drillOf(step);
        if (isScored(step)) {
          expect(drill).not.toBeNull();
          expect(accepted.has(drill as string)).toBe(true);
        } else {
          expect(drill).toBeNull();
        }
      }
    }
  });

  it("joue EXACTEMENT les familles que la leçon déclare — ni plus, ni moins", () => {
    // L'invariant qui empêche la dérive : `curriculum.drills` sert de
    // spécification lisible (« cette leçon fait écrire »), et une famille
    // déclarée que la séance ne construit jamais est un mensonge silencieux.
    for (const lesson of ARABIC_LESSONS) {
      const played = new Set(
        buildSession(lesson)
          .map((step) => drillOf(step))
          .filter((drill): drill is NonNullable<typeof drill> => drill !== null),
      );
      expect([...played].sort()).toEqual([...lesson.drills].sort());
    }
  });

  it("chaque item visé appartient bien à sa leçon — le serveur le refuserait sinon", () => {
    for (const lesson of ARABIC_LESSONS) {
      const known = new Set<string>([
        ...lesson.letters,
        ...lesson.items.map((item) => item.key),
      ]);
      for (const step of buildSession(lesson) as SessionStep[]) {
        expect(known.has(step.itemKey)).toBe(true);
      }
    }
  });
});

describe("buildSession — séance de mémorisation", () => {
  it("donne au plus trois versets neufs, jamais toute la sourate d'un coup", () => {
    const steps = buildSession(hifzLesson, { versesMemorized: 0 });
    const recited = steps.filter((step) => step.kind === "recite");
    const versets = recited.filter((step) =>
      hifzSurah.ayahs.some(
        (ayah) => step.itemKey === `an-nas-${ayah.number}`,
      ),
    );
    expect(versets.length).toBe(VERSES_PER_HIFZ_SESSION);
    expect(versets.length).toBeLessThan(hifzSurah.ayahs.length);
  });

  it("fait ÉCOUTER avant de faire réciter, verset par verset", () => {
    const steps = buildSession(hifzLesson, { versesMemorized: 0 });
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].kind).toBe("discoverItem");
      expect(steps[i + 1].kind).toBe("recite");
      expect(steps[i + 1].itemKey).toBe(steps[i].itemKey);
    }
  });

  it("les versets neufs se récitent avec les amorces, la liaison sans rien", () => {
    const steps = buildSession(hifzLesson, { versesMemorized: 0 });
    const recited = steps.filter(
      (step): step is Extract<SessionStep, { kind: "recite" }> =>
        step.kind === "recite",
    );
    const last = recited[recited.length - 1];
    expect(last.mask).toBe("hidden");
    expect(last.itemKey).toBe(linkItemKey("an-nas", 3));
    for (const step of recited.slice(0, -1)) expect(step.mask).toBe("hints");
  });

  it("reprend là où l'enfant s'est arrêté", () => {
    const steps = buildSession(hifzLesson, { versesMemorized: 3 });
    const premier = steps[0];
    expect(premier.itemKey).toBe("an-nas-4");
    // Et ne redonne aucun des versets déjà tenus.
    for (const step of steps) {
      expect(["an-nas-1", "an-nas-2", "an-nas-3"]).not.toContain(step.itemKey);
    }
  });

  it("la liaison couvre TOUT ce qui est su, pas seulement les versets du jour", () => {
    const steps = buildSession(hifzLesson, { versesMemorized: 3 });
    const recited = steps.filter((step) => step.kind === "recite");
    const last = recited[recited.length - 1];
    expect(last.itemKey).toBe(linkItemKey("an-nas", 6));
  });

  it("tout su : la séance devient une révision, courte et à texte caché", () => {
    const steps = buildSession(hifzLesson, {
      versesMemorized: hifzSurah.ayahs.length,
    });
    expect(steps.length).toBe(2);
    expect(steps[0].kind).toBe("discoverItem");
    expect(steps[1]).toEqual({
      kind: "recite",
      itemKey: linkItemKey("an-nas", hifzSurah.ayahs.length),
      mask: "hidden",
    });
  });

  it("un compteur absurde ne casse pas la séance", () => {
    for (const versesMemorized of [-3, 1.7, 999, Number.NaN]) {
      const steps = buildSession(hifzLesson, { versesMemorized });
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.length).toBeLessThanOrEqual(30);
    }
  });

  it("chaque sourate se mémorise en un nombre fini de séances", () => {
    // La garde qui compte vraiment : une séance qui n'avancerait pas ferait
    // tourner un enfant en rond sur le même verset, indéfiniment.
    for (const surah of ["al-ikhlas", "al-asr", "al-fatiha", "an-nas"]) {
      const lesson = getLesson(hifzLessonKey(surah))!;
      const total = getSurah(surah)!.ayahs.length;
      let known = 0;
      let seances = 0;
      while (known < total && seances < 20) {
        const steps = buildSession(lesson, { versesMemorized: known });
        expect(steps.length).toBeGreaterThan(0);
        known += VERSES_PER_HIFZ_SESSION;
        seances += 1;
      }
      expect(known).toBeGreaterThanOrEqual(total);
      expect(seances).toBeLessThanOrEqual(
        Math.ceil(total / VERSES_PER_HIFZ_SESSION),
      );
    }
  });

  it("chaque item récité appartient bien à la leçon — le serveur le refuserait sinon", () => {
    for (const lesson of ARABIC_LESSONS) {
      if (lesson.kind !== "hifz") continue;
      const known = new Set(lesson.items.map((item) => item.key));
      for (let v = 0; v <= lesson.items.length; v++) {
        for (const step of buildSession(lesson, { versesMemorized: v })) {
          expect(known.has(step.itemKey)).toBe(true);
        }
      }
    }
  });
});
