import { getFunctionName } from "convex/server";
import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { auditExercise } from "../paliers/exerciseAudit";
import { verifyAnswer } from "../paliers/exerciseRules";
import { GAME_KINDS, gameOriginOf, regenerateGame, type GameKind } from "../paliers/games";
import { PALIER_SIZE } from "../paliers/scoring";
import { generateBucketCore } from "../paliers";
import { programmeTopic } from "../programme";

/**
 * UN PALIER DE DIX GABARITS N'APPELLE PAS LE MODÈLE. On joue la génération
 * complète d'un palier (`generateBucketCore`) contre une base factice, avec un
 * « modèle » qui lève une exception dès qu'on le sollicite : si la génération
 * le touche, le test échoue. Le même faux modèle, sur un palier qui en a besoin,
 * prouve que la preuve n'est pas vide.
 */

const WITHOUT_MODEL = [
  "fr-ci-sons-1",
  "fr-ci-sons-2",
  "fr-ci-sons-3",
  "fr-ci-sons-4",
  "fr-ci-alphabet",
  "fr-ci-phrases",
  "fr-ci-politesse",
  "ma-ci-nombres-10",
  "ma-ci-calcul-10",
  "ma-ci-nombres-20",
  "ma-ci-trier",
  "ma-ci-espace",
  "ma-ci-formes",
  "ma-ci-mesures",
  "ma-ci-problemes",
  "hi-ci-journee",
  "hi-ci-ordre",
  "hi-ci-hier-demain",
  "hi-ci-semaine",
  "ge-ci-position",
  "ge-ci-lateralite",
  "ge-ci-reperes",
  "ge-ci-quadrillage",
  // L'histoire et la géographie du CP : calendrier, durées, fréquences, emploi du temps ; itinéraire, distances, plan, quartier.
  "hi-cp-calendrier",
  "hi-cp-durees",
  "hi-cp-frequences",
  "hi-cp-emploi-du-temps",
  "ge-cp-itineraire",
  "ge-cp-distances",
  "ge-cp-plan",
  "ge-cp-quartier",
  // L'anglais du CP (la famille, le corps, la classe, les nombres de 11 à 20, les aliments), la lecture et l'écriture.
  "an-cp-family",
  "an-cp-body",
  "an-cp-classroom",
  "an-cp-numbers-20",
  "an-cp-food",
  "fr-cp-lecture",
  "fr-cp-ecrire",
  // Le français du CP (consignes, décrire, raconter, inviter) et les arts du CP (mélanger, traits, décorer, rythmes).
  "fr-cp-consignes",
  "fr-cp-decrire",
  "fr-cp-raconter",
  "fr-cp-inviter",
  "ar-cp-melanges",
  "ar-cp-traits",
  "ar-cp-decorer",
  "ar-cp-rythmes",
  // L'anglais du CI : les salutations, les couleurs, les nombres de 0 à 10, les animaux, les fruits.
  "an-ci-hello",
  "an-ci-colours",
  "an-ci-numbers",
  "an-ci-animals",
  "an-ci-fruits",
  // L'instruction civique du CI : le respect des autres, l'école, l'entraide, la route.
  "ci-ci-politesse",
  "ci-ci-ecole",
  "ci-ci-entraide",
  "ci-ci-route",
] as const;
const MODEL_CALLED = "LE MODÈLE A ÉTÉ APPELÉ";

type Written = {
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  answerKey: string;
  hints: string[];
  order: number;
  mathExpression?: string | null;
  needsManualReview?: boolean;
};

type Upsert = { status: string; qaStatus?: string; generationTraceId?: string; factCheckResults?: Record<string, number> };

/** Une base factice : ce que `generateBucketCore` lit et écrit, et un modèle qui refuse de répondre. */
function fakeConvex(programmeKey: string) {
  const entry = programmeTopic(programmeKey)!;
  const upserts: Upsert[] = [];
  const written: Written[][] = [];
  const modelCalls: string[] = [];
  const ctx = {
    runQuery: async (ref: never) => {
      switch (getFunctionName(ref)) {
        case "paliers/index:findBucket":
          return null;
        case "paliers/index:getSubjectAndTopic":
          return {
            subjectName: entry.subject.name,
            topic: {
              _id: "topic-1",
              name: entry.topic.name,
              description: entry.topic.description,
              class: entry.klass,
              palierCount: null,
              programmeKey,
            },
          };
        default:
          throw new Error(`lecture inattendue : ${getFunctionName(ref)}`);
      }
    },
    runMutation: async (ref: never, args: Record<string, unknown>) => {
      switch (getFunctionName(ref)) {
        case "paliers/index:upsertBucket":
          upserts.push(args as Upsert);
          return "palier-1";
        case "paliers/index:insertGeneratedExercises":
          written.push(args.exercises as Written[]);
          return [];
        default:
          throw new Error(`écriture inattendue : ${getFunctionName(ref)}`);
      }
    },
    runAction: async (ref: never) => {
      modelCalls.push(getFunctionName(ref));
      throw new Error(MODEL_CALLED);
    },
  } as unknown as ActionCtx;
  return { ctx, upserts, written, modelCalls, entry };
}

const bucket = (palierIndex: number, klass: "CI" | "CP" = "CI") => ({
  subjectId: "subject-1" as Id<"subjects">,
  class: klass,
  topicId: "topic-1" as Id<"topics">,
  palierIndex,
});

/** La réponse juste d'un exercice fabriqué, dans la forme que l'écran envoie. */
function rightAnswer(exo: Written): string {
  const p = exo.payload;
  switch (exo.type) {
    case "qcm":
      return String(p.correctIndex);
    case "order":
      return JSON.stringify(p.correctSequence);
    case "match":
      return JSON.stringify(p.pairs);
    case "pattern":
      return JSON.stringify(p.answers);
    case "pixel-art":
      return JSON.stringify(p.target);
    case "drag-drop":
      return JSON.stringify(Object.fromEntries((p.items as { text: string; correctZone: string }[]).map((item) => [item.text, item.correctZone])));
    case "short-answer":
      return String((p.acceptedAnswers as string[])[0]);
    // Les arts du CP mêlent des jeux d'écoute et de couleurs aux gabarits : leur réponse est celle de `games.test.ts`.
    case "listen":
      return String(p.correctIndex);
    case "color-mix":
      return JSON.stringify(p.answer);
    default:
      return JSON.stringify((p.blanks as { answer: string }[]).map((b) => b.answer));
  }
}

describe.each(WITHOUT_MODEL)("la génération d'un palier de « %s »", (key) => {
  it.each([1, 2, 3])("n'appelle jamais le modèle, garde ses dix exercices et se met en cache (palier %i)", async (palierIndex) => {
    const { ctx, upserts, written, modelCalls, entry } = fakeConvex(key);
    const result = await generateBucketCore(ctx, bucket(palierIndex, entry.klass as "CI" | "CP"));

    expect(modelCalls).toEqual([]);
    expect(result).toEqual({ palierId: "palier-1", cacheHit: false, qaStatus: "auto_ok" });

    // Un seul lot écrit, de dix exercices numérotés de 1 à 10.
    expect(written).toHaveLength(1);
    const exercises = written[0];
    expect(exercises).toHaveLength(PALIER_SIZE);
    expect(exercises.map((e) => e.order)).toEqual(Array.from({ length: PALIER_SIZE }, (_, i) => i + 1));

    // « generating », puis « cached » : jamais « stale » (TOO_FEW_VALID_EXERCISES), aucune trace de modèle.
    expect(upserts.map((u) => u.status)).toEqual(["generating", "cached"]);
    expect(upserts[1].qaStatus).toBe("auto_ok");
    expect(upserts[1].generationTraceId).toBeUndefined();
    expect(upserts[1].factCheckResults).toEqual({
      totalChecked: 0,
      divergences: 0,
      repaired: 0,
      auditRejected: 0,
      auditWarnings: 0,
    });

    // Les gabarits que la fiche demande, ni plus ni moins, dix en tout.
    const wanted: Record<string, number> = {};
    for (const spec of entry.topic.games ?? []) wanted[spec.kind] = (wanted[spec.kind] ?? 0) + spec.count;
    const made: Record<string, number> = {};
    for (const exo of exercises) {
      const origin = gameOriginOf(exo.payload);
      // L'origine reste dans le payload : sans elle, un exercice raté irait au modèle (`regenerateFailedExercises`).
      expect(origin, exo.prompt).not.toBeNull();
      made[origin!.kind] = (made[origin!.kind] ?? 0) + 1;
    }
    expect(made).toEqual(wanted);
    if (["fr-ci-sons-2", "fr-ci-sons-3", "fr-ci-sons-4"].includes(key)) expect(made["mot-syllabe"]).toBe(1);

    // Aucun défaut, et la bonne réponse est juste, la fausse ne l'est pas.
    for (const exo of exercises) {
      expect(
        auditExercise({ ...exo, class: entry.klass, subject: entry.subject.name }),
        `${key} palier ${palierIndex} : ${exo.prompt}`,
      ).toEqual([]);
      expect(verifyAnswer(exo, rightAnswer(exo)), exo.prompt).toBe(true);
    }
  });

  it("refait chaque exercice raté par le code, sans le modèle", () => {
    const entry = programmeTopic(key)!;
    for (const spec of entry.topic.games ?? []) {
      const kind = spec.kind as GameKind;
      const origin = { kind, level: 2, vocabulary: spec.vocabulary };
      const again = regenerateGame(origin, entry.klass, `reprise:${key}:${kind}`);
      expect(again, kind).not.toBeNull();
      expect(again!.type, kind).toBe(GAME_KINDS[kind].type);
      expect(gameOriginOf(again!.payload), kind).toEqual(origin);
    }
  });
});

describe("le faux modèle ne laisse rien passer", () => {
  it("fait échouer un palier qui a besoin du modèle (sc-ci-milieu : dix exercices à écrire)", async () => {
    const { ctx, modelCalls, upserts } = fakeConvex("sc-ci-milieu");
    await expect(generateBucketCore(ctx, bucket(1))).rejects.toThrow(MODEL_CALLED);
    expect(modelCalls).toEqual(["aiGateway/index:generate"]);
    // Rien n'est écrit : le palier reste « generating », sans exercice.
    expect(upserts.map((u) => u.status)).toEqual(["generating"]);
  });
});
