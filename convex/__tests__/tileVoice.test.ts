import { describe, expect, it } from "vitest";
import {
  TILE_VOICE_CLASSES,
  completesAWord,
  isEnglishTopic,
  isTileVoiceClass,
  promptForbidsTileVoice,
  readableTextsOf,
  sentenceOf,
  speakableTile,
  tileClipVerdict,
  tileTextsOf,
} from "../voice/tiles";
import { clipRequestKey } from "../offline/contract";
import { sanitizePayload } from "../paliers/exerciseRules";

const QCM = { options: ["le chat", "le chien", "la girafe"], correctIndex: 1 };
const MATCH = {
  pairs: [
    { left: "la vache", right: "le lait" },
    { left: "la poule", right: "l'œuf" },
  ],
};
const ORDER = { correctSequence: ["le matin", "le midi", "le soir"] };
const DRAG = {
  zones: ["la ferme", "la forêt"],
  items: [
    { text: "la vache", correctZone: "la ferme" },
    { text: "le lion", correctZone: "la forêt" },
  ],
};
const FILL = {
  text: "Le ___ miaule.",
  blanks: [{ answer: "chat", options: ["chat", "chien", "cheval"] }],
};

const TOPIC = { programmeKey: "ci-civique", subjectName: "Français" };

describe("isTileVoiceClass — pour qui les tuiles se disent", () => {
  it("vaut pour le CI et le CP : la lecture de l'énoncé prend en compte les propositions", () => {
    expect(TILE_VOICE_CLASSES).toEqual(["CI", "CP"]);
    expect(isTileVoiceClass("CI")).toBe(true);
    expect(isTileVoiceClass("CP")).toBe(true);
    expect(isTileVoiceClass("CE1")).toBe(false);
    expect(isTileVoiceClass(undefined)).toBe(false);
    expect(isTileVoiceClass(null)).toBe(false);
  });
});

describe("isEnglishTopic — l'anglais ne se dit pas à la française", () => {
  it("reconnaît la fiche du programme", () => {
    expect(isEnglishTopic({ programmeKey: "an-ci-colours" })).toBe(true);
    expect(isEnglishTopic({ programmeKey: "an-cp-family" })).toBe(true);
    expect(isEnglishTopic({ programmeKey: "fr-ci-lettres" })).toBe(false);
    expect(isEnglishTopic({ programmeKey: "han-ci" })).toBe(false);
  });

  it("reconnaît la matière, avec ou sans accent et casse", () => {
    expect(isEnglishTopic({ subjectName: "Anglais" })).toBe(true);
    expect(isEnglishTopic({ subjectName: "  anglais " })).toBe(true);
    expect(isEnglishTopic({ subjectName: "English" })).toBe(true);
    expect(isEnglishTopic({ subjectName: "Français" })).toBe(false);
  });

  it("ne dit pas « anglais » d'une thématique sans fiche ni matière", () => {
    expect(isEnglishTopic({})).toBe(false);
    expect(isEnglishTopic({ programmeKey: null, subjectName: null })).toBe(false);
  });
});

describe("promptForbidsTileVoice — l'énoncé qui interdit de dire la réponse", () => {
  it("interdit de lire, de décoder et de traduire", () => {
    expect(promptForbidsTileVoice("Lis le mot et choisis la bonne image.")).toBe(true);
    expect(promptForbidsTileVoice("Quel mot commence par la syllabe « pou » ?")).toBe(true);
    expect(promptForbidsTileVoice("Par quelle lettre commence « midi » ?")).toBe(true);
    expect(promptForbidsTileVoice("Comment dit-on « chat » en anglais ?")).toBe(true);
    expect(promptForbidsTileVoice("Quel est le mot écrit ?")).toBe(true);
  });

  it("autorise les énoncés ordinaires, y compris nommer ou ranger des mots", () => {
    expect(promptForbidsTileVoice("Ta grand-mère te parle. Que fais-tu ?")).toBe(false);
    expect(promptForbidsTileVoice("Comment s'appelle cet animal ?")).toBe(false);
    expect(promptForbidsTileVoice("Remets les mots dans l'ordre.")).toBe(false);
    expect(promptForbidsTileVoice("Combien de mangues ?")).toBe(false);
  });

  it("lit l'apostrophe courbe et les accents décomposés comme les droits", () => {
    expect(promptForbidsTileVoice("Épelle le mot")).toBe(true);
    expect(promptForbidsTileVoice("Épelle le mot")).toBe(true);
    expect(promptForbidsTileVoice("Comment s’appelle cet animal ?")).toBe(false);
  });

  it("interdit un énoncé qui fait compléter un mot : un trou collé à des lettres", () => {
    expect(promptForbidsTileVoice("Complète : ___ngue")).toBe(true);
    expect(promptForbidsTileVoice("Complète le mot : m___to")).toBe(true);
    expect(promptForbidsTileVoice("Complète le mot : ba___ne")).toBe(true);
    // Un trou entre deux espaces, ou après une apostrophe, complète une phrase.
    expect(promptForbidsTileVoice("Complète la phrase : Le ___ miaule.")).toBe(false);
    expect(promptForbidsTileVoice("Complète : Il y a l'___ de Fatou.")).toBe(false);
  });

  it("n'interdit rien sans énoncé", () => {
    expect(promptForbidsTileVoice("")).toBe(false);
    expect(promptForbidsTileVoice(undefined)).toBe(false);
    expect(promptForbidsTileVoice(42)).toBe(false);
  });
});

describe("completesAWord — un trou collé à des lettres fait compléter un mot", () => {
  it("reconnaît le trou collé, à gauche ou à droite", () => {
    for (const text of ["ba___ne", "___ngue", "m___to", "to___te", "mar____"]) {
      expect(completesAWord(text), text).toBe(true);
    }
  });

  it("laisse passer un trou de phrase, et tout ce qui n'a pas de trou", () => {
    for (const text of ["Le ___ miaule.", "Penda a ___ robe.", "3 + ___ = 7", "l'___", "bonjour", ""]) {
      expect(completesAWord(text), text).toBe(false);
    }
    expect(completesAWord(undefined)).toBe(false);
    expect(completesAWord(12)).toBe(false);
  });

  it("lit une lettre accentuée écrite en deux points de code comme les autres", () => {
    expect(completesAWord("e\u0301___ole")).toBe(true);
  });
});

describe("tileTextsOf — les tuiles d'un exercice, dans l'ordre de l'écran", () => {
  it("lit les options d'un QCM", () => {
    expect(tileTextsOf("qcm", QCM)).toEqual(["le chat", "le chien", "la girafe"]);
  });

  it("lit les deux colonnes d'une association, côté serveur comme côté écran", () => {
    expect(tileTextsOf("match", MATCH)).toEqual(["la vache", "la poule", "le lait", "l'œuf"]);
    expect(tileTextsOf("match", { left: ["la vache", "la poule"], right: ["l'œuf", "le lait"] })).toEqual([
      "la vache",
      "la poule",
      "l'œuf",
      "le lait",
    ]);
  });

  it("lit les éléments d'une mise en ordre, côté serveur comme côté écran", () => {
    expect(tileTextsOf("order", ORDER)).toEqual(["le matin", "le midi", "le soir"]);
    expect(tileTextsOf("order", { items: ["le soir", "le matin", "le midi"] })).toEqual([
      "le soir",
      "le matin",
      "le midi",
    ]);
  });

  it("lit les étiquettes puis les cases d'un glisser-déposer", () => {
    expect(tileTextsOf("drag-drop", DRAG)).toEqual(["la vache", "le lion", "la ferme", "la forêt"]);
  });

  it("lit les mots proposés pour chaque trou d'une phrase à trous", () => {
    expect(tileTextsOf("fill-blank", FILL)).toEqual(["chat", "chien", "cheval"]);
    expect(
      tileTextsOf("fill-blank", {
        text: "Le ___ mange la ___.",
        blanks: [{ options: ["chat", "chien"] }, { options: ["souris", "pomme"] }],
      }),
    ).toEqual(["chat", "chien", "souris", "pomme"]);
  });

  it("ne dit rien des autres types", () => {
    for (const type of ["short-answer", "pattern", "pixel-art", "listen", "color-mix", "inconnu"]) {
      expect(tileTextsOf(type, { options: ["a", "b"], items: ["a"] })).toEqual([]);
    }
  });

  it("ne lève jamais sur un payload mal formé", () => {
    for (const payload of [null, undefined, "texte", 12, [], {}, { options: "pas un tableau" }, { pairs: [null, 3] }]) {
      for (const type of ["qcm", "match", "order", "drag-drop", "fill-blank"]) {
        expect(Array.isArray(tileTextsOf(type, payload))).toBe(true);
      }
    }
    expect(tileTextsOf("qcm", { options: ["a", 3, null, "b"] })).toEqual(["a", "b"]);
  });

  it("donne les mêmes tuiles sur le payload du serveur et sur celui de l'écran (mélangé, sans réponse)", () => {
    const cases: [string, unknown][] = [
      ["qcm", QCM],
      ["match", MATCH],
      ["order", ORDER],
      ["drag-drop", DRAG],
      ["fill-blank", FILL],
    ];
    for (const [type, payload] of cases) {
      const screen = sanitizePayload(type, payload, "exo1", "tentative1");
      expect([...tileTextsOf(type, screen)].sort()).toEqual([...tileTextsOf(type, payload)].sort());
      expect(sentenceOf(type, screen)).toBe(sentenceOf(type, payload));
    }
  });
});

describe("sentenceOf et readableTextsOf — la phrase à trous se dit aussi", () => {
  it("ne donne une phrase qu'à la phrase à trous", () => {
    expect(sentenceOf("fill-blank", FILL)).toBe("Le ___ miaule.");
    expect(sentenceOf("qcm", { ...QCM, text: "Un texte" })).toBeNull();
    expect(sentenceOf("fill-blank", { text: "   ", blanks: [] })).toBeNull();
    expect(sentenceOf("fill-blank", null)).toBeNull();
  });

  it("met la phrase avant les tuiles", () => {
    expect(readableTextsOf("fill-blank", FILL)).toEqual(["Le ___ miaule.", "chat", "chien", "cheval"]);
    expect(readableTextsOf("qcm", QCM)).toEqual(tileTextsOf("qcm", QCM));
  });
});

describe("speakableTile — ce que Pio dit d'une tuile", () => {
  it("dit un mot ou un groupe nominal tel quel", () => {
    expect(speakableTile("le chat")).toBe("le chat");
    expect(speakableTile("l'éléphant")).toBe("l'éléphant");
  });

  it("retire l'émoji d'une tuile et garde son nom", () => {
    expect(speakableTile(`${String.fromCodePoint(0x1f34e)} une pomme`)).toBe("une pomme");
  });

  it("dit un nombre et un calcul en français", () => {
    expect(speakableTile("12")).toBe("12");
    expect(speakableTile("3 + 4")).toBe("3 plus 4");
    expect(speakableTile("2 × 6")).toBe("2 fois 6");
  });

  it("fait d'un trou une pause dans la phrase", () => {
    expect(speakableTile("Le ___ miaule.")).toBe("Le … miaule.");
  });

  it("ne dit rien d'une tuile qui n'est que des émojis ou des signes", () => {
    const apple = String.fromCodePoint(0x1f34e);
    expect(speakableTile(`${apple}${apple}${apple}`)).toBeNull();
    expect(speakableTile("<")).toBeNull();
    expect(speakableTile("  ")).toBeNull();
  });

  it("ne dit pas une lettre seule : dire son nom, c'est la lire à la place de l'enfant", () => {
    for (const letter of ["a", "m", "É", "ç"]) expect(speakableTile(letter)).toBeNull();
    expect(speakableTile(" b ")).toBeNull();
    // Un chiffre, un mot de deux lettres et un mot court se disent.
    expect(speakableTile("5")).toBe("5");
    expect(speakableTile("ou")).toBe("ou");
    expect(speakableTile("le")).toBe("le");
  });

  it("est la clé du cache : deux tuiles qui se disent pareil partagent le son", () => {
    const apple = String.fromCodePoint(0x1f34e);
    expect(speakableTile(`${apple} une pomme`)).toBe(speakableTile("une pomme"));
  });
});

describe("tileClipVerdict — ce que le serveur accepte de dire", () => {
  const base = {
    learnerClass: "CI",
    topic: TOPIC,
    exercise: { type: "qcm", prompt: "Ta grand-mère te parle. Que fais-tu ?", payload: QCM },
    text: "le chat",
  };

  it("dit la tuile d'un exercice du CI", () => {
    expect(tileClipVerdict(base)).toEqual({ ok: true, text: "le chat", lang: "fr" });
  });

  it("dit aussi la bonne réponse, comme les autres : la voix ne désigne rien", () => {
    expect(tileClipVerdict({ ...base, text: "le chien" })).toEqual({ ok: true, text: "le chien", lang: "fr" });
  });

  it("dit la phrase à trous avec une pause, et un mot proposé", () => {
    const exercise = { type: "fill-blank", prompt: "Complète la phrase.", payload: FILL };
    expect(tileClipVerdict({ ...base, exercise, text: "Le ___ miaule." })).toEqual({
      ok: true,
      text: "Le … miaule.",
      lang: "fr",
    });
    expect(tileClipVerdict({ ...base, exercise, text: "cheval" })).toEqual({ ok: true, text: "cheval", lang: "fr" });
  });

  it("dit aussi les tuiles d'un enfant de CP", () => {
    expect(tileClipVerdict({ ...base, learnerClass: "CP" })).toEqual({ ok: true, text: "le chat", lang: "fr" });
  });

  it("refuse les classes plus grandes et l'enfant sans classe", () => {
    for (const learnerClass of ["CE1", "CM2", undefined, null]) {
      expect(tileClipVerdict({ ...base, learnerClass })).toEqual({ ok: false, reason: "not_allowed" });
    }
  });

  it("dit une thématique d'anglais, par la fiche du programme ou par la matière, dans la voix anglaise", () => {
    const english = { type: "qcm", prompt: "Quel mot va avec ce dessin ?", payload: { options: ["dog", "cat", "bird"] } };
    for (const topic of [{ programmeKey: "an-ci-animals" }, { subjectName: "Anglais" }]) {
      expect(tileClipVerdict({ ...base, topic, exercise: english, text: "dog" })).toEqual({
        ok: true,
        text: "dog",
        lang: "en",
      });
    }
  });

  it("refuse un énoncé qui demande de lire ou de décoder", () => {
    for (const prompt of ["Lis le mot.", "Quel mot commence par la syllabe « chat » ?"]) {
      expect(tileClipVerdict({ ...base, exercise: { ...base.exercise, prompt } })).toEqual({
        ok: false,
        reason: "not_allowed",
      });
    }
  });

  it("refuse un énoncé de traduction hors d'une thématique d'anglais, le dit dedans", () => {
    const prompt = "Comment dit-on « le chat » en anglais ?";
    const exercise = { type: "qcm", prompt, payload: { options: ["cat", "dog", "bird"] } };
    expect(tileClipVerdict({ ...base, exercise, text: "cat" })).toEqual({ ok: false, reason: "not_allowed" });
    expect(tileClipVerdict({ ...base, exercise, topic: { programmeKey: "an-ci-animals" }, text: "cat" })).toEqual({
      ok: true,
      text: "cat",
      lang: "en",
    });
  });

  it("refuse une phrase à trous qui fait compléter un mot, quel que soit l'énoncé", () => {
    const exercise = {
      type: "fill-blank",
      prompt: "Choisis la bonne réponse.",
      payload: { text: "ba___ne", blanks: [{ answer: "na", options: ["na", "ma", "ra"] }] },
    };
    expect(tileClipVerdict({ ...base, exercise, text: "na" })).toEqual({ ok: false, reason: "not_allowed" });
    expect(tileClipVerdict({ ...base, exercise, text: "ba___ne" })).toEqual({ ok: false, reason: "not_allowed" });
  });

  it("ne dit pas un texte libre : seulement ce que l'exercice contient", () => {
    expect(tileClipVerdict({ ...base, text: "bonjour le monde" })).toEqual({ ok: false, reason: "unknown_text" });
    expect(tileClipVerdict({ ...base, text: "le chat " })).toEqual({ ok: false, reason: "unknown_text" });
    expect(tileClipVerdict({ ...base, text: "" })).toEqual({ ok: false, reason: "unknown_text" });
    // Un texte qui est une tuile d'un AUTRE type d'exercice ne passe pas non plus.
    expect(tileClipVerdict({ ...base, exercise: { type: "short-answer", prompt: "Écris le nombre.", payload: QCM } })).toEqual({
      ok: false,
      reason: "unknown_text",
    });
  });

  it("refuse une tuile d'une seule lettre, même quand l'énoncé ne parle ni de lettre ni de syllabe", () => {
    const payload = { options: ["m", "n", "r"], correctIndex: 1 };
    const exercise = { type: "qcm", prompt: "Complète le mot : ba_ane", payload };
    expect(tileClipVerdict({ ...base, exercise, text: "n" })).toEqual({ ok: false, reason: "unknown_text" });
  });

  it("n'a rien à dire d'une tuile qui n'est que des émojis", () => {
    const apple = String.fromCodePoint(0x1f34e);
    const payload = { options: [`${apple}${apple}`, `${apple}${apple}${apple}`], correctIndex: 0 };
    expect(
      tileClipVerdict({ ...base, exercise: { ...base.exercise, payload }, text: `${apple}${apple}` }),
    ).toEqual({ ok: false, reason: "unknown_text" });
  });
});

describe("clipRequestKey — une tuile se classe par son texte", () => {
  it("donne la même clé à « le chat » dans deux exercices", () => {
    const a = clipRequestKey({ kind: "tile", exerciseId: "exercice1" as never, text: "le chat" });
    const b = clipRequestKey({ kind: "tile", exerciseId: "exercice2" as never, text: "le chat" });
    expect(a).toBe("tile:le chat");
    expect(a).toBe(b);
  });

  it("ne confond ni la tuile avec la consigne, ni deux tuiles", () => {
    const tile = clipRequestKey({ kind: "tile", exerciseId: "exercice1" as never, text: "le chat" });
    const prompt = clipRequestKey({ kind: "prompt", exerciseId: "exercice1" as never });
    expect(tile).not.toBe(prompt);
    expect(clipRequestKey({ kind: "tile", exerciseId: "exercice1" as never, text: "le chien" })).not.toBe(tile);
  });
});
