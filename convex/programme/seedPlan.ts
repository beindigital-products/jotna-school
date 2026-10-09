/**
 * CE QUE LE CHARGEMENT DU PROGRAMME VA FAIRE — calculé avant d'écrire.
 *
 * MODULE PUR : la mutation (`programme/seed.ts`) lit la base, demande le
 * plan ici, puis l'applique ; l'essai à blanc rend le même plan sans rien
 * écrire. Les tests jouent le plan sur des bases inventées.
 *
 * LES RÈGLES, PAR ORDRE DE PRUDENCE.
 *
 * 1. UNE MATIÈRE N'EST JAMAIS DOUBLÉE. On la cherche par son nom, puis par
 *    ses anciens noms (« Sciences » pour « Éveil scientifique », « EMC »
 *    pour « Instruction civique »). Trouvée sous un ancien nom ET vide, elle
 *    prend le nouveau nom ; trouvée sous un ancien nom avec des thématiques,
 *    elle garde son nom et reçoit les nôtres. Absente, elle est créée.
 * 2. UNE THÉMATIQUE DÉJÀ CHARGÉE N'EST PAS RECHARGÉE : elle porte sa clé
 *    (`programmeKey`), et l'on n'y touche plus, même renommée ou réécrite
 *    par un administrateur.
 * 3. UNE CLASSE GARNIE À LA MAIN EST LAISSÉE TELLE QUELLE (mode « fill »,
 *    le défaut) : si une matière a déjà des thématiques d'une classe et
 *    qu'aucune ne vient du programme, c'est que quelqu'un les a choisies.
 *    C'est le cas des mathématiques et du français sur la base de
 *    développement. Le mode « merge » ajoute quand même les thématiques du
 *    programme qui manquent, et ADOPTE celles qui portent déjà le même nom
 *    (elles reçoivent leur clé, donc leurs jeux) au lieu de les doubler.
 * 4. Rien n'est jamais supprimé ni réécrit, hors du nom d'une matière vide.
 */
import { VISIBLE_CLASSES, type VisibleClassName } from "../curriculum";
import { normalizeName, PROGRAMME } from "./index";
import type { ProgrammeSubject, ProgrammeSubjectKey, ProgrammeTopic } from "./types";

export type SeedMode = "fill" | "merge";

export type DbSubjectRow = { _id: string; name: string };

export type DbTopicRow = {
  _id: string;
  subjectId: string;
  name: string;
  order: number;
  class?: string | null;
  programmeKey?: string | null;
};

export type SubjectStep =
  | { kind: "use"; key: ProgrammeSubjectKey; subjectId: string; dbName: string }
  | {
      kind: "rename";
      key: ProgrammeSubjectKey;
      subjectId: string;
      from: string;
      to: string;
      icon: string;
      color: string;
      order: number;
    }
  | { kind: "create"; key: ProgrammeSubjectKey; name: string; icon: string; color: string; order: number };

export type TopicStep =
  | {
      kind: "create";
      subjectKey: ProgrammeSubjectKey;
      klass: VisibleClassName;
      topic: ProgrammeTopic;
      order: number;
    }
  | { kind: "adopt"; topicId: string; programmeKey: string; name: string };

export type SeedPlan = {
  subjects: SubjectStep[];
  topics: TopicStep[];
  report: {
    mode: SeedMode;
    subjects: string[];
    topicsToCreate: number;
    topicsToAdopt: number;
    topicsAlreadyLoaded: number;
    /** « Mathématiques CI : 6 thématiques existantes gardées » */
    classesKept: string[];
    /** Les matières vides que le programme a rendues inutiles, à supprimer depuis l'administration. */
    emptyLeftovers: string[];
    /** Quelques thématiques créées, pour se faire une idée. */
    sample: string[];
  };
};

function findSubject(
  subject: ProgrammeSubject,
  dbSubjects: readonly DbSubjectRow[],
  taken: ReadonlySet<string>,
): { row: DbSubjectRow; viaAlias: boolean } | null {
  const free = dbSubjects.filter((s) => !taken.has(s._id));
  const exact = free.find((s) => normalizeName(s.name) === normalizeName(subject.name));
  if (exact) return { row: exact, viaAlias: false };
  for (const alias of subject.aliases) {
    const found = free.find((s) => normalizeName(s.name) === normalizeName(alias));
    if (found) return { row: found, viaAlias: true };
  }
  return null;
}

export function planProgrammeSeed(input: {
  subjects: readonly DbSubjectRow[];
  topics: readonly DbTopicRow[];
  mode?: SeedMode;
  /** Les clés de matières à charger ; toutes par défaut. */
  only?: readonly string[];
  programme?: readonly ProgrammeSubject[];
}): SeedPlan {
  const mode = input.mode ?? "fill";
  const programme = (input.programme ?? PROGRAMME).filter(
    (s) => !input.only || input.only.length === 0 || input.only.includes(s.key),
  );
  const topicsBySubject = new Map<string, DbTopicRow[]>();
  for (const topic of input.topics) {
    const list = topicsBySubject.get(topic.subjectId) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subjectId, list);
  }
  const loadedKeys = new Set(
    input.topics.map((t) => t.programmeKey).filter((k): k is string => typeof k === "string"),
  );

  const subjectSteps: SubjectStep[] = [];
  const topicSteps: TopicStep[] = [];
  const report: SeedPlan["report"] = {
    mode,
    subjects: [],
    topicsToCreate: 0,
    topicsToAdopt: 0,
    topicsAlreadyLoaded: 0,
    classesKept: [],
    emptyLeftovers: [],
    sample: [],
  };
  const taken = new Set<string>();

  for (const subject of programme) {
    const found = findSubject(subject, input.subjects, taken);
    const existing = found ? (topicsBySubject.get(found.row._id) ?? []) : [];

    if (!found) {
      subjectSteps.push({
        kind: "create",
        key: subject.key,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
        order: subject.order,
      });
      report.subjects.push(`${subject.name} : créée`);
    } else {
      taken.add(found.row._id);
      if (found.viaAlias && existing.length === 0) {
        subjectSteps.push({
          kind: "rename",
          key: subject.key,
          subjectId: found.row._id,
          from: found.row.name,
          to: subject.name,
          icon: subject.icon,
          color: subject.color,
          order: subject.order,
        });
        report.subjects.push(`${subject.name} : « ${found.row.name} », vide, renommée`);
      } else {
        subjectSteps.push({ kind: "use", key: subject.key, subjectId: found.row._id, dbName: found.row.name });
        report.subjects.push(
          found.viaAlias
            ? `${subject.name} : chargée dans « ${found.row.name} », qui a déjà des thématiques`
            : `${subject.name} : existante`,
        );
      }
    }

    let nextOrder = existing.reduce((max, t) => Math.max(max, t.order), 0) + 1;

    for (const klass of VISIBLE_CLASSES) {
      const programmeTopics = subject.classes[klass];
      const inClass = existing.filter((t) => t.class === klass);
      const linked = inClass.filter((t) => t.programmeKey && programmeTopics.some((p) => p.key === t.programmeKey));
      const foreign = inClass.filter((t) => !t.programmeKey);

      if (mode === "fill" && foreign.length > 0 && linked.length === 0) {
        report.classesKept.push(
          `${found?.row.name ?? subject.name} ${klass} : ${foreign.length} thématique${foreign.length > 1 ? "s" : ""} existante${foreign.length > 1 ? "s" : ""} gardée${foreign.length > 1 ? "s" : ""}`,
        );
        continue;
      }

      for (const topic of programmeTopics) {
        if (loadedKeys.has(topic.key)) {
          report.topicsAlreadyLoaded += 1;
          continue;
        }
        const sameName = foreign.find((t) => normalizeName(t.name) === normalizeName(topic.name));
        if (mode === "merge" && sameName) {
          topicSteps.push({ kind: "adopt", topicId: sameName._id, programmeKey: topic.key, name: sameName.name });
          report.topicsToAdopt += 1;
          continue;
        }
        topicSteps.push({ kind: "create", subjectKey: subject.key, klass, topic, order: nextOrder++ });
        report.topicsToCreate += 1;
        if (report.sample.length < 12) report.sample.push(`${subject.name} ${klass} — ${topic.name}`);
      }
    }
  }

  // Les matières vides qui portent un ancien nom d'une matière du programme,
  // et que le chargement n'a pas reprises (« Éducation musicale » quand
  // « Arts plastiques » est devenue « Éducation artistique »).
  for (const row of input.subjects) {
    if (taken.has(row._id)) continue;
    if ((topicsBySubject.get(row._id) ?? []).length > 0) continue;
    const owner = programme.find((s) =>
      [s.name, ...s.aliases].some((name) => normalizeName(name) === normalizeName(row.name)),
    );
    if (owner) report.emptyLeftovers.push(`${row.name} (vide, remplacée par « ${owner.name} »)`);
  }

  return { subjects: subjectSteps, topics: topicSteps, report };
}
