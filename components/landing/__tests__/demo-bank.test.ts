import { describe, expect, it } from "vitest";

import { validateFillBlank } from "@/convex/paliers";
import { gameCount } from "@/convex/paliers/games";
import { PALIER_SIZE } from "@/convex/paliers/scoring";
import { isGenericZoneLabel, repairDragDrop } from "@/convex/paliers/dragDropRepair";
import { verifyAnswer } from "@/convex/paliers/exerciseRules";
import { numericallyEqual, solveOrEvaluate } from "@/convex/paliers/mathRepair";
import { PROGRAMME } from "@/convex/programme";
import { loadBank } from "../demo/bank";
import { BANK as anglais } from "../demo/bank/anglais";
import { BANK as educationArtistique } from "../demo/bank/education-artistique";
import { BANK as eveilScientifique } from "../demo/bank/eveil-scientifique";
import { BANK as francais } from "../demo/bank/francais";
import { BANK as geographie } from "../demo/bank/geographie";
import { BANK as histoire } from "../demo/bank/histoire";
import { BANK as instructionCivique } from "../demo/bank/instruction-civique";
import { BANK as mathematiques } from "../demo/bank/mathematiques";
import { classicTypesFor } from "../demo/demo-matrix";
import { DEMO_CLASSES, type ClassicItem, type DemoSubject, type SubjectBank } from "../demo/demo-types";
import { toPlayable, viewOf } from "../demo/playable";

/**
 * LA BANQUE DES EXERCICES DE LA VITRINE, JOUÉE COMME L'ENFANT LA JOUERAIT.
 *
 * Chaque exercice écrit à la main passe par les mêmes règles que ceux du
 * modèle : la forme du serveur, la réparation des glisser-déposer, la phrase à
 * trous, la règle de correction (`verifyAnswer`), le mélange des tuiles
 * (`sanitizePayload`). En mathématiques, chaque réponse est recalculée.
 *
 * Un test ne juge pas un fait d'histoire ni une règle de grammaire : ceux-là
 * se relisent. Il attrape tout le reste — une bonne réponse absente des
 * propositions, un trou en trop, des tuiles déjà rangées, un « € » égaré.
 */

const BANKS: Record<DemoSubject, SubjectBank> = {
  francais,
  mathematiques,
  "eveil-scientifique": eveilScientifique,
  histoire,
  geographie,
  "instruction-civique": instructionCivique,
  "education-artistique": educationArtistique,
  anglais,
};

type Payload = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const payloadOf = (item: ClassicItem) => item.payload as Payload;

/** Les petits textes que l'enfant voit sur des tuiles, des boutons et des cases. */
function labelsOf(item: ClassicItem): string[] {
  const p = payloadOf(item);
  switch (item.type) {
    case "qcm":
      return p.options;
    case "drag-drop":
      return [...p.zones, ...p.items.map((entry: { text: string }) => entry.text)];
    case "match":
      return p.pairs.flatMap((pair: { left: string; right: string }) => [pair.left, pair.right]);
    case "order":
      return p.correctSequence;
    case "fill-blank":
      return p.blanks.flatMap((blank: { options: string[] }) => blank.options);
    default:
      return [];
  }
}

/** Ce que l'enfant joue : le type et le payload, après la typographie (`toPlayable`). */
type Played = { type: ClassicItem["type"]; payload: Record<string, unknown> };

/** La réponse juste, telle que l'écran l'envoie. */
function rightAnswer(item: Played): string {
  const p = item.payload as Payload;
  switch (item.type) {
    case "qcm":
      return String(p.correctIndex);
    case "order":
      return JSON.stringify(p.correctSequence);
    case "match":
      return JSON.stringify(p.pairs);
    case "drag-drop":
      return JSON.stringify(Object.fromEntries(p.items.map((entry: { text: string; correctZone: string }) => [entry.text, entry.correctZone])));
    case "short-answer":
      return p.acceptedAnswers[0];
    case "fill-blank":
      return JSON.stringify(p.blanks.map((blank: { answer: string }) => blank.answer));
  }
}

/** Des réponses fausses, chacune à un seul geste de la bonne. */
function wrongAnswers(item: Played): string[] {
  const p = item.payload as Payload;
  switch (item.type) {
    case "qcm":
      return p.options.flatMap((_: string, index: number) => (index === p.correctIndex ? [] : [String(index)]));
    case "order": {
      const swapped = [...p.correctSequence];
      [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
      return [JSON.stringify(swapped), JSON.stringify([...p.correctSequence].reverse())].filter(
        (answer) => answer !== JSON.stringify(p.correctSequence),
      );
    }
    case "match": {
      const swapped = p.pairs.map((pair: { left: string; right: string }) => ({ ...pair }));
      [swapped[0].right, swapped[1].right] = [swapped[1].right, swapped[0].right];
      return [JSON.stringify(swapped)];
    }
    case "drag-drop": {
      const zones: string[] = p.zones;
      return p.items.map((moved: { text: string; correctZone: string }) =>
        JSON.stringify(
          Object.fromEntries(
            p.items.map((entry: { text: string; correctZone: string }) => [
              entry.text,
              entry === moved ? zones.find((zone) => zone !== entry.correctZone) : entry.correctZone,
            ]),
          ),
        ),
      );
    }
    case "short-answer":
      return ["zzz", ""];
    case "fill-blank":
      return p.blanks.map((_: unknown, wrongIndex: number) =>
        JSON.stringify(
          p.blanks.map((blank: { options: string[]; answer: string }, index: number) =>
            index === wrongIndex ? blank.options.find((option) => option !== blank.answer) : blank.answer,
          ),
        ),
      );
  }
}

/** La bonne réponse écrite, quand l'exercice en a une seule (QCM, réponse courte). */
function answerText(item: ClassicItem): string | null {
  const p = payloadOf(item);
  if (item.type === "qcm") return p.options[p.correctIndex] ?? null;
  if (item.type === "short-answer") return p.acceptedAnswers[0] ?? null;
  return null;
}

const programmeOf = (key: DemoSubject) => {
  const subject = PROGRAMME.find((entry) => entry.key === key);
  if (!subject) throw new Error(`Matière inconnue : ${key}`);
  return subject;
};

describe("la banque : le chargement à la demande", () => {
  for (const subject of PROGRAMME) {
    it(`${subject.name} : le chargeur rend la banque de la matière`, async () => {
      expect(await loadBank(subject.key)).toBe(BANKS[subject.key]);
      // Une seconde demande rend la même promesse : rien ne se recharge.
      expect(loadBank(subject.key)).toBe(loadBank(subject.key));
    });
  }
});

for (const subject of PROGRAMME) {
  const bank = BANKS[subject.key];
  const everyItem = DEMO_CLASSES.flatMap((klass) => bank[klass].map((item) => ({ klass, item })));

  describe(`la banque : ${subject.name}`, () => {
    it("a un exercice par type et par classe, ni plus ni moins", () => {
      for (const klass of DEMO_CLASSES) {
        const types = bank[klass].map((item) => item.type);
        expect([...types].sort(), klass).toEqual([...classicTypesFor(subject.key, klass)].sort());
      }
    });

    it("rattache chaque exercice à une thématique du programme de sa classe", () => {
      for (const { klass, item } of everyItem) {
        const topics = programmeOf(subject.key).classes[klass];
        expect(topics.map((topic) => topic.name), `${klass} / ${item.type} : « ${item.topic} »`).toContain(item.topic);
        // Une thématique tout en jeux (« Grave ou aigu ? ») n'appelle jamais le modèle : aucun exercice classique n'y naît.
        const topic = topics.find((entry) => entry.name === item.topic);
        expect(
          gameCount(topic?.games),
          `${klass} / ${item.type} : « ${item.topic} » est une thématique tout en jeux`,
        ).toBeLessThan(PALIER_SIZE);
      }
    });

    it("varie les thématiques et les niveaux dans une classe", () => {
      for (const klass of DEMO_CLASSES) {
        const items = bank[klass];
        const topicsOfClass = programmeOf(subject.key).classes[klass].length;
        expect(new Set(items.map((item) => item.topic)).size, `${klass} : thématiques`).toBeGreaterThanOrEqual(
          Math.min(4, topicsOfClass),
        );
        expect(new Set(items.map((item) => item.stage)).size, `${klass} : niveaux`).toBeGreaterThanOrEqual(2);
        for (const item of items) expect([1, 2, 3, 4]).toContain(item.stage);
      }
      expect(new Set(everyItem.map(({ item }) => item.stage)).size, "niveaux de la matière").toBeGreaterThanOrEqual(3);
    });

    it("n'écrit jamais deux fois la même consigne", () => {
      const prompts = everyItem.map(({ item }) => item.prompt);
      expect(new Set(prompts).size).toBe(prompts.length);
    });

    it("donne deux indices qui ne livrent pas la réponse", () => {
      for (const { klass, item } of everyItem) {
        const label = `${klass} / ${item.type}`;
        expect(item.hints, label).toHaveLength(2);
        for (const hint of item.hints) {
          expect(hint.trim(), label).not.toBe("");
          expect(hint.length, label).toBeLessThanOrEqual(170);
        }
        const answer = answerText(item);
        if (answer && answer.trim().length >= 5) {
          for (const hint of item.hints) expect(hint.toLowerCase(), `${label} : indice`).not.toContain(answer.toLowerCase());
        }
      }
    });

    it("écrit des consignes courtes, et des étiquettes courtes pour ceux qui apprennent à lire", () => {
      for (const { klass, item } of everyItem) {
        const label = `${klass} / ${item.type} : « ${item.prompt} »`;
        expect(item.prompt.trim(), label).not.toBe("");
        expect(item.prompt.length, label).toBeLessThanOrEqual(klass === "CI" || klass === "CP" ? 120 : 170);
        for (const text of labelsOf(item)) {
          expect(text.length, `${label} : « ${text} »`).toBeLessThanOrEqual(klass === "CI" || klass === "CP" ? 24 : 70);
          if (klass === "CI" || klass === "CP") {
            // Un enfant qui apprend à lire reconnaît un mot, un nombre ou un émoji, pas une phrase.
            expect(text.trim().split(/\s+/).length, `${label} : « ${text} »`).toBeLessThanOrEqual(3);
          }
        }
      }
    });

    it("écrit des libellés d'association courts : deux colonnes étroites sur un téléphone", () => {
      // À 360 px d'écran, une tuile n'a qu'une centaine de pixels de texte : une définition de 50
      // caractères s'y empile sur six lignes, et un mot de plus de seize lettres déborde.
      for (const { klass, item } of everyItem) {
        if (item.type !== "match") continue;
        for (const text of labelsOf(item)) {
          expect(text.length, `${klass} : « ${text} »`).toBeLessThanOrEqual(36);
          for (const word of text.split(/[\s-]+/)) expect(word.length, `${klass} : « ${text} »`).toBeLessThanOrEqual(16);
        }
      }
    });

    it("reste dans le décor de l'enfant : le franc CFA, pas d'euro ni de dollar, rien de laissé à l'abandon", () => {
      for (const { klass, item } of everyItem) {
        const text = JSON.stringify(item);
        const label = `${klass} / ${item.type}`;
        expect(text, label).not.toMatch(/€|\$|\beuros?\b|\bdollars?\b/i);
        expect(text, label).not.toMatch(/\bzone [a-z0-9]\b/i);
        expect(text, label).not.toMatch(/ {2,}|\\n|TODO|XXX/);
        expect(text, label).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/);
      }
    });

    it("n'ouvre le clavier des lettres que pour une réponse écrite en lettres", () => {
      for (const { klass, item } of everyItem) {
        if (item.type !== "short-answer") continue;
        const accepted: string[] = payloadOf(item).acceptedAnswers;
        const digits = accepted.filter((answer) => /^-?\d+$/.test(answer));
        // Une réponse numérique n'accepte que des chiffres collés : une seule écriture en lettres
        // (« dix-neuf », « 18 000 000 ») ferait ouvrir le clavier des lettres au lieu du pavé numérique.
        if (digits.length > 0) expect(digits.length, `${klass} : ${accepted.join(" | ")}`).toBe(accepted.length);
      }
    });

    it("ne confie jamais le sens à un émoji récent : sur un téléphone ancien, il s'affiche en case vide", () => {
      // Unicode 12 et après : pastilles et carrés de couleur (🟠 🟡 🟢 🟣 🟤 🟥 🟦…), cœurs blanc et marron, émojis étendus.
      const recent = /[\u{1F7E0}-\u{1F7EB}\u{1F90D}-\u{1F90F}\u{1FA70}-\u{1FAFF}]/u;
      for (const { klass, item } of everyItem) {
        for (const label of labelsOf(item)) {
          // Un mot à côté de l'émoji porte le sens (« 🟡 jaune ») ; seul, l'émoji ne se lirait pas.
          if (/[\p{L}\p{N}]/u.test(label)) continue;
          expect(label, `${klass} / ${item.type}`).not.toMatch(recent);
        }
      }
    });

    it("pèse peu : la banque d'une matière se charge à la demande", () => {
      expect(JSON.stringify(bank).length).toBeLessThanOrEqual(70_000);
    });

    describe("joué comme l'enfant le joue", () => {
      it("a des exercices à jouer", () => {
        expect(everyItem.length).toBeGreaterThan(0);
      });

      for (const klass of DEMO_CLASSES) {
        for (const item of bank[klass]) {
          it(`${klass} / ${item.type} : « ${item.prompt.slice(0, 48)} »`, () => {
            const p = payloadOf(item);
            const exercise = toPlayable(item, subject.key, klass);

            // La forme du serveur, type par type.
            switch (item.type) {
              case "qcm":
                expect(p.options, "quatre propositions").toHaveLength(4);
                expect(new Set(p.options).size, "propositions distinctes").toBe(4);
                expect(Number.isInteger(p.correctIndex) && p.correctIndex >= 0 && p.correctIndex < 4, "bonne réponse parmi les propositions").toBe(true);
                for (const option of p.options) expect(option.trim()).not.toBe("");
                break;
              case "drag-drop": {
                const zones: string[] = p.zones;
                const texts: string[] = p.items.map((entry: { text: string }) => entry.text);
                expect(zones.length).toBeGreaterThanOrEqual(2);
                expect(zones.length).toBeLessThanOrEqual(3);
                expect(new Set(zones).size, "zones distinctes").toBe(zones.length);
                expect(texts.length).toBeGreaterThanOrEqual(4);
                expect(texts.length).toBeLessThanOrEqual(6);
                expect(new Set(texts).size, "étiquettes distinctes").toBe(texts.length);
                for (const zone of zones) {
                  expect(isGenericZoneLabel(zone), `zone « ${zone} »`).toBe(false);
                  expect(texts, "une étiquette n'est pas sa zone").not.toContain(zone);
                  expect(
                    p.items.some((entry: { correctZone: string }) => entry.correctZone === zone),
                    `la zone « ${zone} » reçoit une étiquette`,
                  ).toBe(true);
                }
                for (const entry of p.items) expect(zones).toContain(entry.correctZone);
                expect(repairDragDrop({ prompt: item.prompt, payload: item.payload, answerKey: "" }).kind).toBe("ok");
                break;
              }
              case "match": {
                const lefts = p.pairs.map((pair: { left: string }) => pair.left);
                const rights = p.pairs.map((pair: { right: string }) => pair.right);
                expect(p.pairs.length).toBeGreaterThanOrEqual(3);
                expect(p.pairs.length).toBeLessThanOrEqual(5);
                expect(new Set(lefts).size, "colonne de gauche sans doublon").toBe(lefts.length);
                expect(new Set(rights).size, "colonne de droite sans doublon").toBe(rights.length);
                break;
              }
              case "order": {
                const sequence: string[] = p.correctSequence;
                expect(sequence.length).toBeGreaterThanOrEqual(3);
                expect(sequence.length).toBeLessThanOrEqual(5);
                expect(new Set(sequence).size, "étapes distinctes").toBe(sequence.length);
                break;
              }
              case "short-answer":
                expect(klass, "pas de réponse à taper au CI").not.toBe("CI");
                expect(p.acceptedAnswers.length).toBeGreaterThanOrEqual(1);
                for (const accepted of p.acceptedAnswers) expect(accepted.trim()).not.toBe("");
                break;
              case "fill-blank": {
                const checked = validateFillBlank(p);
                expect(checked.valid, "phrase à trous valide").toBe(true);
                expect(p.blanks.length).toBeLessThanOrEqual(2);
                for (const blank of p.blanks) {
                  expect(blank.options.length).toBeGreaterThanOrEqual(2);
                  expect(blank.options.length).toBeLessThanOrEqual(4);
                }
                expect(subject.key, "pas de phrase à trous en mathématiques").not.toBe("mathematiques");
                break;
              }
            }

            // Une explication, quand il y en a une, tient en une phrase.
            if (typeof p.explanation === "string") {
              expect(p.explanation.trim()).not.toBe("");
              expect(p.explanation.length).toBeLessThanOrEqual(220);
            }

            // La règle de correction : la bonne réponse passe, les autres non.
            const played = exercise as Played;
            expect(verifyAnswer(exercise, rightAnswer(played)), "la bonne réponse est reconnue").toBe(true);
            for (const wrong of wrongAnswers(played)) {
              expect(verifyAnswer(exercise, wrong), `la réponse fausse ${wrong} est refusée`).toBe(false);
            }

            // Les tuiles ne s'affichent jamais déjà rangées.
            const view = viewOf(exercise) as Payload;
            if (item.type === "order") expect(view.items, "tuiles mélangées").not.toEqual(p.correctSequence);
            if (item.type === "match") {
              expect(view.right, "colonne de droite mélangée").not.toEqual(p.pairs.map((pair: { right: string }) => pair.right));
            }
            // L'écran ne reçoit jamais la réponse.
            expect(JSON.stringify(view)).not.toContain("correctIndex");
            expect(JSON.stringify(view)).not.toContain("correctZone");
            expect(JSON.stringify(view)).not.toContain("acceptedAnswers");
          });
        }
      }
    });

    it("répartit les bonnes réponses des QCM : pas toujours la même place", () => {
      const places = DEMO_CLASSES.flatMap((klass) =>
        bank[klass].filter((item) => item.type === "qcm").map((item) => payloadOf(item).correctIndex as number),
      );
      expect(new Set(places).size, `places : ${places.join(",")}`).toBeGreaterThanOrEqual(3);
      for (const place of new Set(places)) {
        expect(places.filter((other) => other === place).length, `place ${place}`).toBeLessThanOrEqual(3);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Les mathématiques : chaque réponse est recalculée.
// ---------------------------------------------------------------------------

/** Le nombre au début d'une réponse (« 12 cm » → « 12 »), ou `null`. */
function leadingNumber(text: string): string | null {
  return /^-?\d[\d\s ]*(?:[.,]\d+)?/.exec(text.trim())?.[0].trim() ?? null;
}

describe("la banque : les mathématiques sont justes", () => {
  const items = DEMO_CLASSES.flatMap((klass) => mathematiques[klass].map((item) => ({ klass, item })));

  it("recalcule la réponse de chaque QCM et de chaque réponse courte numérique", () => {
    let checked = 0;
    for (const { klass, item } of items) {
      const answer = answerText(item);
      if (!answer) continue;
      const label = `${klass} / ${item.type} : « ${item.prompt} » → ${answer}`;
      const lead = leadingNumber(answer);
      const purelyNumeric = lead !== null && lead === answer.trim();
      // Un nombre sans unité se vérifie par un calcul : le modèle écrit le même `mathExpression`.
      if (purelyNumeric) expect(item.expression, `${label} : il manque l'expression`).toBeDefined();
      if (item.expression === undefined || lead === null) continue;
      const value = solveOrEvaluate(item.expression);
      expect(value, `${label} : expression « ${item.expression} » illisible`).not.toBeNull();
      expect(numericallyEqual(String(value), lead), `${label} : « ${item.expression} » vaut ${value}`).toBe(true);
      checked++;
    }
    // Toute expression écrite a été recalculée, et il y en a une par réponse numérique.
    expect(checked).toBe(items.filter(({ item }) => item.expression !== undefined).length);
    expect(checked).toBeGreaterThanOrEqual(10);
  });

  it("accepte, en réponse courte, l'écriture avec virgule et avec point", () => {
    for (const { klass, item } of items) {
      if (item.type !== "short-answer") continue;
      const accepted: string[] = payloadOf(item).acceptedAnswers;
      const decimals = accepted.filter((value) => /^\d+[.,]\d+$/.test(value));
      for (const value of decimals) {
        const other = value.includes(",") ? value.replace(",", ".") : value.replace(".", ",");
        expect(verifyAnswer(toPlayable(item, "mathematiques", klass), other), `${klass} : « ${other} »`).toBe(true);
      }
    }
  });

  it("relie chaque calcul à son résultat quand l'association en contient", () => {
    for (const { klass, item } of items) {
      if (item.type !== "match") continue;
      for (const pair of payloadOf(item).pairs as { left: string; right: string }[]) {
        // Seulement un vrai calcul (« 3,5 × 10 ») : « 1 km » ↔ « 1 000 m » est une conversion.
        if (!/^[\d\s.,+\-−×÷:()]+$/.test(pair.left) || !/[+\-−×÷:]/.test(pair.left)) continue;
        const left = solveOrEvaluate(pair.left);
        const right = leadingNumber(pair.right);
        expect(left, `${klass} : ${pair.left} illisible`).not.toBeNull();
        expect(right, `${klass} : ${pair.right} illisible`).not.toBeNull();
        expect(numericallyEqual(String(left), right ?? ""), `${klass} : ${pair.left} ↔ ${pair.right}`).toBe(true);
      }
    }
  });

  it("n'écrit jamais la multiplication avec une lettre", () => {
    for (const { klass, item } of items) {
      expect(JSON.stringify(item), klass).not.toMatch(/\d\s*[xX*]\s*\d/);
    }
  });
});
