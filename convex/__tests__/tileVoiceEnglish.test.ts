import { describe, expect, it } from "vitest";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { allProgrammeEntries } from "../programme";
import { isEnglishTopic, promptForbidsTileVoice, readableTextsOf, tileClipVerdict, tileLanguage } from "../voice/tiles";

/**
 * L'ANGLAIS DU CI ET DU CP SE DIT, CHAQUE TUILE DANS SA LANGUE.
 *
 * Le 26 octobre 2026, le propriétaire a testé l'anglais : la voix lisait l'énoncé
 * et s'arrêtait devant les propositions. `tileLanguage` choisit la voix (anglaise
 * ou française) pour chaque tuile ; ce fichier passe tous les gabarits d'anglais
 * du CI et du CP pour que la langue reste juste quand un gabarit change.
 */

/** Les étiquettes de case en français que les gabarits d'anglais posent (zones d'un glisser-déposer). */
const FRENCH_LABELS = new Set([
  "Femme ou fille",
  "Homme ou garçon",
  "Visage",
  "Bras et jambes",
  "Petit objet",
  "Grand objet",
  "Je mange",
  "Je bois",
  "Animaux de la ferme",
  "Animaux sauvages",
  "Animaux",
  "Pour dire bonjour",
  "Pour dire au revoir",
  "Voyelles",
  "Consonnes",
]);
const FRENCH_LABEL = (text: string) => FRENCH_LABELS.has(text) || /^(Moins|Plus) de \d+$/.test(text);

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7];

const ENTRIES = allProgrammeEntries().filter(
  (entry) => (entry.klass === "CI" || entry.klass === "CP") && /^an-/.test(entry.topic.key),
);

describe("promptForbidsTileVoice en anglais", () => {
  it("laisse dire les propositions d'une traduction quand la thématique est d'anglais", () => {
    const prompt = "Comment dit-on « la chaise » en anglais ?";
    expect(promptForbidsTileVoice(prompt)).toBe(true);
    expect(promptForbidsTileVoice(prompt, true)).toBe(false);
  });

  it("garde l'interdiction de lire et de décoder, anglais ou non", () => {
    expect(promptForbidsTileVoice("Lis le mot.", true)).toBe(true);
    expect(promptForbidsTileVoice("Quel mot commence par la syllabe « pou » ?", true)).toBe(true);
  });
});

describe("tileLanguage", () => {
  const topic = { programmeKey: "an-cp-family" };
  const qcm = { type: "qcm", prompt: "Quel mot va avec ce dessin ?", payload: { options: ["mother", "father"] } };

  it("dit tout en français hors d'une thématique d'anglais", () => {
    expect(tileLanguage({ topic: { programmeKey: "fr-cp-lire" }, exercise: qcm, text: "mother" })).toBe("fr");
  });

  it("dit un mot d'anglais en anglais, avec ou sans dessin devant", () => {
    expect(tileLanguage({ topic, exercise: qcm, text: "mother" })).toBe("en");
    expect(tileLanguage({ topic, exercise: qcm, text: `${String.fromCodePoint(0x1f436)} dog` })).toBe("en");
    expect(tileLanguage({ topic, exercise: qcm, text: "I have a dog." })).toBe("en");
    expect(tileLanguage({ topic, exercise: qcm, text: "7" })).toBe("en");
  });

  it("dit en français la colonne de gauche de « Relie chaque mot français à son mot anglais »", () => {
    const exercise = {
      type: "match",
      prompt: "Relie chaque mot français à son mot anglais.",
      payload: { pairs: [{ left: "chien", right: "dog" }, { left: "chat", right: "cat" }] },
    };
    expect(tileLanguage({ topic, exercise, text: "chien" })).toBe("fr");
    expect(tileLanguage({ topic, exercise, text: "dog" })).toBe("en");
  });

  it("dit un signe de calcul d'une tuile d'anglais en anglais (« eight equals », pas « eight égale »)", () => {
    const base = { topic, exercise: qcm };
    const verdict = (text: string) =>
      tileClipVerdict({
        learnerClass: "CI",
        topic,
        exercise: { type: "qcm", prompt: "Choisis.", payload: { options: [text] } },
        text,
      });
    expect(verdict("eight = ___")).toEqual({ ok: true, text: "eight equals …", lang: "en" });
    expect(base.topic).toBe(topic);
  });

  it("dit en français un mot accentué, même hors des listes", () => {
    expect(tileLanguage({ topic, exercise: qcm, text: "maîtresse" })).toBe("fr");
    expect(tileLanguage({ topic, exercise: qcm, text: "Où est l'école" })).toBe("fr");
  });

  it("dit en français une étiquette de case", () => {
    const exercise = { type: "drag-drop", prompt: "Glisse chaque mot dans la bonne case.", payload: {} };
    for (const text of ["Femme ou fille", "Homme ou garçon", "Je mange", "Moins de 5", "Plus de 12"]) {
      expect(tileLanguage({ topic, exercise, text }), text).toBe("fr");
    }
  });
});

describe("les gabarits d'anglais du CI et du CP", () => {
  it("ont des gabarits à passer en revue", () => {
    expect(ENTRIES.length).toBeGreaterThanOrEqual(10);
    expect(ENTRIES.every((entry) => isEnglishTopic({ programmeKey: entry.topic.key }))).toBe(true);
  });

  it("disent chaque proposition dans la bonne langue : du français seulement là où le gabarit en pose", () => {
    const wrong: string[] = [];
    let spoken = 0;
    let english = 0;
    let french = 0;
    const kinds = new Set<string>();
    for (const entry of ENTRIES) {
      for (const game of entry.topic.games ?? []) {
        const kind = game.kind as GameKind;
        if (!GAME_KINDS[kind]) continue;
        for (const level of LEVELS) {
          for (const n of SEEDS) {
            const exo = GAME_KINDS[kind].make(makeContext(entry.klass, level, `voix-an:${kind}:${level}:${n}`));
            const exercise = { type: exo.type, prompt: exo.prompt, payload: exo.payload };
            const leftOfFrenchMatch =
              exo.type === "match" && /mot fran[cç]ais/i.test(exo.prompt)
                ? new Set(
                    ((exo.payload as { pairs?: { left: string }[] }).pairs ?? []).map((pair) => pair.left),
                  )
                : new Set<string>();
            for (const text of readableTextsOf(exo.type, exo.payload)) {
              const verdict = tileClipVerdict({
                learnerClass: entry.klass,
                topic: { programmeKey: entry.topic.key },
                exercise,
                text,
              });
              if (!verdict.ok) continue;
              spoken += 1;
              kinds.add(kind);
              const expected = leftOfFrenchMatch.has(text) || FRENCH_LABEL(text) ? "fr" : "en";
              if (verdict.lang === "fr") french += 1;
              else english += 1;
              if (verdict.lang !== expected) wrong.push(`${kind} : « ${text} » dit en ${verdict.lang}, attendu ${expected}`);
            }
          }
        }
      }
    }
    expect([...new Set(wrong)].slice(0, 15)).toEqual([]);
    // Le test voit passer des mots anglais ET du français : il ne vérifie pas dans le vide.
    expect(spoken).toBeGreaterThan(2000);
    expect(english).toBeGreaterThan(1000);
    expect(french).toBeGreaterThan(50);
    expect(kinds.size).toBeGreaterThan(30);
  });
});
