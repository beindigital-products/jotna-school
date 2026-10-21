import { describe, expect, it } from "vitest";
import {
  emojiRowSizeClass,
  graphemeCount,
  isClockEmoji,
  isEmojiGrapheme,
  qcmLayout,
  segmentPrompt,
  splitLeadingEmoji,
} from "../choix-texte";

// Les émojis des tests sont ceux du contenu (présentation émoji par défaut,
// Unicode 11), construits par leur point de code : aucun sélecteur de
// variation dans la source.
const FISH = String.fromCodePoint(0x1f41f);
const ELEPHANT = String.fromCodePoint(0x1f418);
const BANANA = String.fromCodePoint(0x1f34c);
const MANGO = String.fromCodePoint(0x1f96d);
const DRESS = String.fromCodePoint(0x1f457);
const COPYRIGHT = String.fromCodePoint(0xa9);
const FLAG_SN = String.fromCodePoint(0x1f1f8, 0x1f1f3);
// Deux cadrans d'horloge : trois heures (U+1F552) et onze heures et demie (U+1F566).
const CLOCK_3 = String.fromCodePoint(0x1f552);
const CLOCK_1130 = String.fromCodePoint(0x1f566);

describe("isEmojiGrapheme — un émoji est un graphème qui se dessine en couleur", () => {
  it("reconnaît les émojis du contenu, pas les symboles de texte ni les chiffres", () => {
    expect(isEmojiGrapheme(FISH)).toBe(true);
    expect(isEmojiGrapheme(MANGO)).toBe(true);
    expect(isEmojiGrapheme(COPYRIGHT)).toBe(false);
    expect(isEmojiGrapheme("3")).toBe(false);
    expect(isEmojiGrapheme("a")).toBe(false);
  });

  it("compte un drapeau pour un seul graphème", () => {
    expect(graphemeCount(`${FLAG_SN} Dakar`)).toBe(7);
  });
});

describe("isClockEmoji — un cadran d'horloge d'Unicode", () => {
  it("reconnaît les vingt-quatre cadrans (les heures justes et les demi-heures), pas un autre émoji", () => {
    for (let code = 0x1f550; code <= 0x1f567; code++) expect(isClockEmoji(String.fromCodePoint(code)), code.toString(16)).toBe(true);
    expect(isClockEmoji(String.fromCodePoint(0x1f54f))).toBe(false);
    expect(isClockEmoji(String.fromCodePoint(0x1f568))).toBe(false);
    expect(isClockEmoji(FISH)).toBe(false);
    expect(isClockEmoji("")).toBe(false);
  });

  it("ne reconnaît qu'UN cadran : deux à la suite ne sont pas « un cadran »", () => {
    expect(isClockEmoji(`${CLOCK_3}${CLOCK_3}`)).toBe(false);
  });
});

describe("splitLeadingEmoji — l'émoji qui ouvre une option", () => {
  it("sépare l'émoji du mot", () => {
    expect(splitLeadingEmoji(`${FISH} le poisson`)).toEqual({ emoji: FISH, rest: "le poisson" });
  });

  it("garde plusieurs émojis de tête ensemble", () => {
    expect(splitLeadingEmoji(`${MANGO}${MANGO} deux mangues`)).toEqual({ emoji: `${MANGO}${MANGO}`, rest: "deux mangues" });
  });

  it("rend tout au mot quand rien n'ouvre, et rien au mot quand tout est émoji", () => {
    expect(splitLeadingEmoji("le poisson")).toEqual({ emoji: "", rest: "le poisson" });
    expect(splitLeadingEmoji("4")).toEqual({ emoji: "", rest: "4" });
    expect(splitLeadingEmoji(FISH)).toEqual({ emoji: FISH, rest: "" });
  });
});

describe("segmentPrompt — la consigne découpée sans perdre un caractère", () => {
  const row = `Regarde la rangée ${ELEPHANT} ${FISH} ${BANANA}. Lequel est au milieu ?`;

  it("pose une rangée d'au moins deux émojis sur un socle, les espaces entre eux avec", () => {
    const segments = segmentPrompt(row);
    expect(segments).toEqual([
      { kind: "texte", text: "Regarde la rangée " },
      { kind: "rangee", text: `${ELEPHANT} ${FISH} ${BANANA}`, count: 3 },
      { kind: "texte", text: ". Lequel est au milieu ?" },
    ]);
  });

  it("laisse un émoji seul en ligne", () => {
    expect(segmentPrompt(`Penda a une robe ${DRESS}.`)).toEqual([
      { kind: "texte", text: "Penda a une robe " },
      { kind: "emoji", text: DRESS },
      { kind: "texte", text: "." },
    ]);
  });

  it("pose un cadran d'horloge seul à part : c'est ce que l'enfant lit", () => {
    expect(segmentPrompt(`Quelle heure est-il ? ${CLOCK_1130}`)).toEqual([
      { kind: "texte", text: "Quelle heure est-il ? " },
      { kind: "horloge", text: CLOCK_1130 },
    ]);
  });

  it("garde deux cadrans à la suite dans une rangée, et un autre émoji seul en ligne", () => {
    expect(segmentPrompt(`${CLOCK_3} ${CLOCK_1130}`)).toEqual([{ kind: "rangee", text: `${CLOCK_3} ${CLOCK_1130}`, count: 2 }]);
    expect(segmentPrompt(`Une robe ${DRESS}`)).toEqual([
      { kind: "texte", text: "Une robe " },
      { kind: "emoji", text: DRESS },
    ]);
  });

  it("recompose exactement la consigne, quelle qu'elle soit", () => {
    const prompts = [
      row,
      `Aïssatou a 3 mangues ${MANGO}${MANGO}${MANGO}. On lui en donne 2 de plus ${MANGO}${MANGO}. Combien ?`,
      `${FISH}${FISH}${FISH}`,
      "Quel est le résultat de 3 + 4 ?",
      "",
      `  ${FISH}  `,
      `Quelle heure est-il ? ${CLOCK_1130}`,
      `${CLOCK_3}${CLOCK_1130} et ${CLOCK_3}.`,
    ];
    for (const prompt of prompts) {
      expect(segmentPrompt(prompt).map((segment) => segment.text).join(""), prompt).toBe(prompt);
    }
  });

  it("rend un seul segment de texte pour une consigne sans émoji", () => {
    expect(segmentPrompt("Relie chaque mot à son contraire.")).toEqual([
      { kind: "texte", text: "Relie chaque mot à son contraire." },
    ]);
  });
});

describe("qcmLayout — deux colonnes pour du court, une pour des phrases", () => {
  it("met des nombres et des mots à émoji en deux grandes colonnes", () => {
    expect(qcmLayout(["4", "6", "5", "1"])).toEqual({ columns: 2, size: "lg" });
    expect(qcmLayout([`${FISH} le poisson`, `${ELEPHANT} l'éléphant`, `${BANANA} la banane`])).toEqual({
      columns: 2,
      size: "lg",
    });
  });

  it("met des phrases en une colonne, plus serrée quand elles sont longues", () => {
    expect(qcmLayout(["Le chat dort sur le mur.", "Le chien court.", "La poule picore."])).toEqual({
      columns: 1,
      size: "lg",
    });
    expect(
      qcmLayout(["Parce que la lune tourne autour de la Terre.", "Parce que le soleil se couche.", "Non"]),
    ).toEqual({ columns: 1, size: "md" });
  });

  it("au-delà de six options, une colonne", () => {
    expect(qcmLayout(["1", "2", "3", "4", "5", "6", "7"]).columns).toBe(1);
  });
});

describe("emojiRowSizeClass — énorme à trois, plus serrée à dix", () => {
  it("descend par paliers, un cran de moins dans une consigne longue", () => {
    expect(emojiRowSizeClass(3)).toBe("text-4xl");
    expect(emojiRowSizeClass(6)).toBe("text-3xl");
    expect(emojiRowSizeClass(10)).toBe("text-2xl");
    expect(emojiRowSizeClass(3, true)).toBe("text-3xl");
    expect(emojiRowSizeClass(10, true)).toBe("text-xl");
    // Sur un écran court : la classe avec sa requête média, un cran de moins, jamais sous 20 px.
    expect(emojiRowSizeClass(3, false, true)).toBe("[@media(max-height:667px)_and_(min-height:481px)]:text-3xl");
    expect(emojiRowSizeClass(3, true, true)).toBe("[@media(max-height:667px)_and_(min-height:481px)]:text-2xl");
    expect(emojiRowSizeClass(10, true, true)).toBe("[@media(max-height:667px)_and_(min-height:481px)]:text-xl");
  });
});
