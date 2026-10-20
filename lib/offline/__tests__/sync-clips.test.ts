import { describe, expect, it } from "vitest";
import type { ConvexReactClient } from "convex/react";
import { clipRequestKey } from "@/convex/offline/contract";
import type { OfflineEngine } from "../engine";
import { OfflineSync } from "../sync";

/**
 * LES SONS QUE L'APPAREIL TÉLÉCHARGE : la consigne de chaque exercice, et, pour
 * un enfant de CI, ses propositions (`OfflineSync.neededClips`). Le moteur est
 * remplacé par deux lectures fixes (le profil, le paquet de la classe) : seul
 * ce que la synchronisation décide de demander au serveur se joue ici.
 */

type Exercise = { _id: string; palierId: string; type: string; prompt: string; payload: unknown };

function syncFor({
  profileClass = "CI",
  contentClass = "CI",
  readsAloud = true,
  programmeKey = null,
  subject = "Français",
  exercises,
}: {
  profileClass?: string | null;
  contentClass?: string;
  readsAloud?: boolean;
  programmeKey?: string | null;
  subject?: string;
  exercises: Exercise[];
}) {
  const engine = {
    snapshot: { profile: { class: profileClass, readsAloud }, modules: [] },
    content: {
      class: contentClass,
      subjects: [{ _id: "subject-1", name: subject }],
      topics: [{ _id: "topic-1", subjectId: "subject-1", programmeKey }],
      paliers: [{ _id: "palier-1", topicId: "topic-1" }],
      exercises,
    },
  } as unknown as OfflineEngine;
  return new OfflineSync({} as ConvexReactClient, engine);
}

const qcm = (id: string, options: string[], prompt = "Que fais-tu ?"): Exercise => ({
  _id: id,
  palierId: "palier-1",
  type: "qcm",
  prompt,
  payload: { options, correctIndex: 0 },
});

const tiles = (requests: ReturnType<OfflineSync["neededClips"]>) =>
  requests.flatMap((request) => (request.kind === "tile" ? [{ exerciseId: request.exerciseId as string, text: request.text }] : []));
const prompts = (requests: ReturnType<OfflineSync["neededClips"]>) =>
  requests.flatMap((request) => (request.kind === "prompt" ? [request.exerciseId as string] : []));

describe("neededClips : les propositions du CI se téléchargent avec les consignes", () => {
  it("demande la consigne de chaque exercice, puis chaque proposition", () => {
    const sync = syncFor({ exercises: [qcm("e1", ["le chat", "le chien"]), qcm("e2", ["la girafe", "le lion"])] });
    const needed = sync.neededClips();
    expect(prompts(needed)).toEqual(["e1", "e2"]);
    expect(tiles(needed)).toEqual([
      { exerciseId: "e1", text: "le chat" },
      { exerciseId: "e1", text: "le chien" },
      { exerciseId: "e2", text: "la girafe" },
      { exerciseId: "e2", text: "le lion" },
    ]);
  });

  it("ne demande qu'une fois un mot que plusieurs exercices proposent : un son par texte", () => {
    const sync = syncFor({ exercises: [qcm("e1", ["le chat", "le chien"]), qcm("e2", ["le chien", "le chat", "la vache"])] });
    const needed = sync.neededClips();
    expect(tiles(needed).map((tile) => tile.text)).toEqual(["le chat", "le chien", "la vache"]);
    // C'est le premier exercice qui sert de référence au serveur.
    expect(tiles(needed).find((tile) => tile.text === "le chien")?.exerciseId).toBe("e1");
    const keys = needed.map(clipRequestKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("demande la phrase d'une phrase à trous et les mots de ses trous", () => {
    const fill: Exercise = {
      _id: "e3",
      palierId: "palier-1",
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: { text: "Le ___ miaule.", blanks: [{ answer: "chat", options: ["chat", "chien"] }] },
    };
    expect(tiles(syncFor({ exercises: [fill] }).neededClips()).map((tile) => tile.text)).toEqual([
      "Le ___ miaule.",
      "chat",
      "chien",
    ]);
  });

  it("ne demande aucune proposition à un enfant de CP, qui a pourtant la voix des consignes", () => {
    const needed = syncFor({ profileClass: "CP", contentClass: "CP", exercises: [qcm("e1", ["le chat", "le chien"])] }).neededClips();
    expect(prompts(needed)).toEqual(["e1"]);
    expect(tiles(needed)).toEqual([]);
  });

  it("à défaut de classe sur le profil, lit celle du paquet", () => {
    const needed = syncFor({ profileClass: null, contentClass: "CI", exercises: [qcm("e1", ["le chat", "le chien"])] }).neededClips();
    expect(tiles(needed)).toHaveLength(2);
    const none = syncFor({ profileClass: null, contentClass: "CE1", exercises: [qcm("e1", ["le chat", "le chien"])] }).neededClips();
    expect(tiles(none)).toEqual([]);
  });

  it("ne demande rien d'une thématique d'anglais, par sa fiche ou par sa matière", () => {
    const exercises = [qcm("e1", ["cat", "dog"])];
    expect(tiles(syncFor({ programmeKey: "an-ci-animals", exercises }).neededClips())).toEqual([]);
    expect(tiles(syncFor({ subject: "Anglais", exercises }).neededClips())).toEqual([]);
    // La consigne, elle, se dit toujours.
    expect(prompts(syncFor({ programmeKey: "an-ci-animals", exercises }).neededClips())).toEqual(["e1"]);
  });

  it("ne demande rien quand l'énoncé demande de lire ou de décoder", () => {
    const needed = syncFor({
      exercises: [
        qcm("e1", ["chat", "chien"], "Lis le mot et choisis la bonne image."),
        qcm("e2", ["pa", "po"], "Quelle syllabe entends-tu ?"),
        qcm("e3", ["le chat", "le chien"]),
      ],
    }).neededClips();
    expect(tiles(needed).map((tile) => tile.exerciseId)).toEqual(["e3", "e3"]);
  });

  it("ne demande pas une tuile sans voix : émojis seuls, lettre seule", () => {
    const apples = String.fromCodePoint(0x1f34e).repeat(3);
    const needed = syncFor({ exercises: [qcm("e1", [apples, "m", "5", "le chat"])] }).neededClips();
    expect(tiles(needed).map((tile) => tile.text)).toEqual(["5", "le chat"]);
  });

  it("ne demande rien à un enfant qui n'apprend pas à lire", () => {
    const needed = syncFor({ readsAloud: false, profileClass: "CM1", contentClass: "CM1", exercises: [qcm("e1", ["a", "b"])] }).neededClips();
    expect(needed).toEqual([]);
  });

  it("sans paquet de contenu, ne demande rien", () => {
    const engine = { snapshot: { profile: { class: "CI", readsAloud: true }, modules: [] }, content: null } as unknown as OfflineEngine;
    expect(new OfflineSync({} as ConvexReactClient, engine).neededClips()).toEqual([]);
  });
});
