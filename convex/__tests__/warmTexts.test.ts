import { describe, expect, it } from "vitest";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { allProgrammeEntries } from "../programme";
import { speakableExercise } from "../voice/speakable";
import { readableTextsOf, speakableTile } from "../voice/tiles";
import {
  COST_PER_1000_CHARS_USD,
  estimatedCostUsd,
  spokenClipsOf,
  spokenTextsOf,
  withoutEmbedded,
  type WarmExercise,
  type WarmTopic,
} from "../voice/warmTexts";

const TOPIC: WarmTopic = { programmeKey: "sc-ci-milieu", subjectName: "Éveil scientifique" };

const spoken = (exercise: WarmExercise, over: { learnerClass?: string; topic?: WarmTopic; withPrompt?: boolean } = {}) =>
  spokenTextsOf({ learnerClass: "CI", topic: TOPIC, withPrompt: false, exercise, ...over });

const qcm = (options: string[], prompt = "Quel animal vit dans l'eau ?"): WarmExercise => ({
  type: "qcm",
  prompt,
  payload: { options, correctIndex: 0 },
});

describe("spokenTextsOf — ce que la voix préchauffe", () => {
  it("dit chaque proposition d'un QCM, dans l'ordre de l'écran", () => {
    expect(spoken(qcm(["l'étoile de mer", "l'âne", "le singe"]))).toEqual(["l'étoile de mer", "l'âne", "le singe"]);
  });

  it("dit la tuile comme le serveur : l'émoji de tête retiré", () => {
    const exercise = qcm(["🥭 Je lave la mangue avant de la manger", "🤢 Je mange avec les mains sales", "🚿 Je me lave"], "Que fais-tu ?");
    expect(spoken(exercise)).toEqual(["Je lave la mangue avant de la manger", "Je mange avec les mains sales", "Je me lave"]);
  });

  it("ne dit ni une tuile d'émojis seuls ni une lettre seule", () => {
    expect(spoken(qcm(["🙂", "a", "le chat"]))).toEqual(["le chat"]);
  });

  it("ne dit un mot qu'une fois, même s'il revient dans deux colonnes", () => {
    const exercise: WarmExercise = {
      type: "match",
      prompt: "Relie.",
      payload: {
        pairs: [
          { left: "la vache", right: "le lait" },
          { left: "le lait", right: "la crème" },
        ],
      },
    };
    expect(spoken(exercise).sort()).toEqual(["la crème", "la vache", "le lait"]);
  });

  it("dit la phrase à trous, le trou en pause, et ses mots", () => {
    const exercise: WarmExercise = {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: { text: "Le ___ miaule.", blanks: [{ answer: "chat", options: ["chat", "chien", "cheval"] }] },
    };
    expect(spoken(exercise)).toEqual([speakableTile("Le ___ miaule.")!, "chat", "chien", "cheval"]);
    expect(spoken(exercise)[0]).toContain("…");
  });

  it("ne dit rien d'un exercice qui fait compléter un mot", () => {
    const exercise: WarmExercise = {
      type: "fill-blank",
      prompt: "Complète le mot.",
      payload: { text: "ba___ne", blanks: [{ answer: "na", options: ["na", "ni", "no"] }] },
    };
    expect(spoken(exercise)).toEqual([]);
  });

  it("ne dit rien quand l'énoncé demande de lire", () => {
    expect(spoken(qcm(["chat", "chien", "cheval"], "Lis le mot."))).toEqual([]);
  });

  it("dit l'anglais avec la voix anglaise, le CP comme le CI, et rien hors d'eux", () => {
    const exercise = qcm(["dog", "cat", "bird"], "Quel mot va avec ce dessin ?");
    const english = { programmeKey: "an-ci-animals", subjectName: "Anglais" };
    expect(spoken(exercise, { topic: english })).toEqual(["dog", "cat", "bird"]);
    expect(spokenClipsOf({ learnerClass: "CI", topic: english, withPrompt: false, exercise })).toEqual([
      { text: "dog", lang: "en" },
      { text: "cat", lang: "en" },
      { text: "bird", lang: "en" },
    ]);
    expect(spoken(qcm(["le chat", "le chien", "la girafe"]), { learnerClass: "CP" })).toEqual([
      "le chat",
      "le chien",
      "la girafe",
    ]);
    expect(spoken(qcm(["le chat", "le chien", "la girafe"]), { learnerClass: "CE1" })).toEqual([]);
  });

  it("garde « six » dit en anglais et « six » dit en français comme deux sons", () => {
    const english = { programmeKey: "an-ci-numbers", subjectName: "Anglais" };
    const clips = (topic: WarmTopic) =>
      spokenClipsOf({ learnerClass: "CI", topic, withPrompt: false, exercise: qcm(["six", "ten"], "Choisis.") });
    expect(clips(english).map((clip) => clip.lang)).toEqual(["en", "en"]);
    expect(clips(TOPIC).map((clip) => clip.lang)).toEqual(["fr", "fr"]);
  });

  it("ajoute la consigne seulement si on le demande, et la dit même quand les tuiles se taisent", () => {
    const exercise = qcm(["le chat", "le chien", "la girafe"], "Quel animal miaule ?");
    expect(spoken(exercise)).toEqual(["le chat", "le chien", "la girafe"]);
    expect(spoken(exercise, { withPrompt: true })).toEqual(["le chat", "le chien", "la girafe", "Quel animal miaule ?"]);

    const reading = qcm(["chat", "chien", "cheval"], "Lis le mot.");
    expect(spoken(reading, { withPrompt: true })).toEqual(["Lis le mot."]);
    // Une consigne de lecture se lit, même en anglais (les propositions se taisent).
    expect(spoken(reading, { topic: { programmeKey: "an-ci-animals" }, withPrompt: true })).toEqual(["Lis le mot."]);
  });

  it("ne dit pas une consigne qui n'a rien à dire", () => {
    const exercise = qcm(["le chat", "le chien", "la girafe"], "🐱 🐶 🐮");
    expect(spoken(exercise, { withPrompt: true })).toEqual(["le chat", "le chien", "la girafe"]);
  });

  it("dit la consigne et les tuiles au CP, la consigne seule hors du CI et du CP : rien", () => {
    const exercise = qcm(["le chat", "le chien", "la girafe"], "Quel animal miaule ?");
    expect(spoken(exercise, { learnerClass: "CP", withPrompt: true })).toEqual([
      "le chat",
      "le chien",
      "la girafe",
      "Quel animal miaule ?",
    ]);
    expect(spoken(exercise, { learnerClass: "CE1", withPrompt: true })).toEqual([]);
  });

  it("dit pour un appariement la consigne avec son indication, comme le lecteur en ligne", () => {
    const exercise: WarmExercise = {
      type: "match",
      prompt: "Relie chaque animal à son cri.",
      payload: { pairs: [{ left: "le chat", right: "miaule" }, { left: "le chien", right: "aboie" }] },
    };
    expect(spoken(exercise, { withPrompt: true })).toContain(speakableExercise("match", "Relie chaque animal à son cri.")!);
  });
});

describe("spokenTextsOf sur les gabarits des sciences du CI", () => {
  // Les gabarits que les cinq fiches `sc-ci-*` demandent (et non un préfixe : `outil-geometrie` est une autre fiche).
  const SC_CI_KEYS = ["sc-ci-milieu", "sc-ci-animaux", "sc-ci-plantes", "sc-ci-hygiene", "sc-ci-outils"];
  const KINDS = [
    ...new Set(
      allProgrammeEntries()
        .filter((entry) => SC_CI_KEYS.includes(entry.topic.key))
        .flatMap((entry) => (entry.topic.games ?? []).map((spec) => spec.kind)),
    ),
  ] as GameKind[];
  const LEVELS: GameLevel[] = [1, 2, 3, 4];

  it("compte les vingt-neuf gabarits", () => {
    expect(KINDS).toHaveLength(29);
  });

  it("préchauffe exactement ce que le serveur accepte de dire, ni plus ni moins, sans émoji", () => {
    for (const kind of KINDS) {
      for (const level of LEVELS) {
        for (let n = 0; n < 5; n++) {
          const game = GAME_KINDS[kind].make(makeContext("CI", level, `${kind}:warm:${n}`));
          const exercise: WarmExercise = { type: game.type, prompt: game.prompt, payload: game.payload };
          const texts = spoken(exercise);

          const expected = new Set(
            readableTextsOf(game.type, game.payload)
              .map((text) => speakableTile(text))
              .filter((text): text is string => text !== null),
          );
          const label = `${kind} niveau ${level} graine ${n}`;
          expect(new Set(texts), label).toEqual(expected);
          expect(texts.length, label).toBeGreaterThan(0);
          for (const text of texts) {
            expect(text, label).not.toMatch(/\p{Extended_Pictographic}/u);
            expect(text, label).not.toContain("\n");
          }
        }
      }
    }
  });

  it("dit aussi la consigne de chaque gabarit quand on le demande", () => {
    for (const kind of KINDS) {
      const game = GAME_KINDS[kind].make(makeContext("CI", 2, `${kind}:warm:prompt`));
      const exercise: WarmExercise = { type: game.type, prompt: game.prompt, payload: game.payload };
      const prompt = speakableExercise(game.type, game.prompt);
      expect(prompt, kind).not.toBeNull();
      expect(spoken(exercise, { withPrompt: true }), kind).toContain(prompt);
    }
  });
});

describe("estimatedCostUsd — le coût d'une synthèse, arrondi au centime", () => {
  it("compte les caractères, mille par mille", () => {
    expect(estimatedCostUsd(0)).toBe(0);
    expect(estimatedCostUsd(1000)).toBe(COST_PER_1000_CHARS_USD);
    expect(estimatedCostUsd(16400)).toBeGreaterThanOrEqual(3);
    expect(estimatedCostUsd(16400)).toBeLessThanOrEqual(5);
  });

  it("ne rend jamais un coût négatif", () => {
    expect(estimatedCostUsd(-50)).toBe(0);
  });
});

describe("withoutEmbedded — les sons de l'application ne passent pas par le cache du serveur", () => {
  it("écarte les sons anglais que l'application embarque, et compte ce qu'elle écarte", () => {
    const { kept, embedded } = withoutEmbedded([
      { text: "bee", lang: "en" },
      { text: "ei, bee, blank, dee", lang: "en" },
      { text: "mot inconnu de la table", lang: "en" },
    ]);
    expect(kept).toEqual([{ text: "mot inconnu de la table", lang: "en" }]);
    expect(embedded).toBe(2);
  });

  it("garde un même texte dit en français : c'est un autre son, avec une autre voix", () => {
    const clips = [{ text: "banana", lang: "fr" as const }];
    expect(withoutEmbedded(clips)).toEqual({ kept: clips, embedded: 0 });
  });

  it("ne change rien quand rien n'est embarqué, et rend une liste vide pour une liste vide", () => {
    expect(withoutEmbedded([])).toEqual({ kept: [], embedded: 0 });
  });
});
