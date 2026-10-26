/**
 * CE QUE LA REMISE EN ORDRE DU PROGRAMME VA FAIRE — calculé avant d'écrire.
 *
 * Pourquoi cet outil existe. Le chargement du programme (`seed.ts`) ne fait que CRÉER les thématiques qui manquent, à la suite
 * (`order = plus grand rang + 1`), et ne touche jamais à une thématique déjà chargée. Quand le programme d'anglais est passé à
 * la version 2 (`docs/programme-anglais-v2.md`, 26 octobre 2026), les treize thématiques nouvelles (l'alphabet d'abord) se
 * seraient donc placées APRÈS « Hello! Goodbye! » en production, et le CM2 serait resté dans l'ancien ordre : l'inverse de la
 * demande du propriétaire. L'ordre que voit un élève est `topics.order` (`students.ts`, `worldRules.ts`, `offline/pack.ts`).
 *
 * LA RÈGLE. Pour une matière du programme, on prend les thématiques déjà chargées (celles dont la clé `programmeKey` est dans
 * le programme), on RELÈVE LEURS RANGS ACTUELS, triés, et on les redistribue dans l'ordre du programme : les classes du CI au
 * CM2, puis les thématiques de chaque classe dans l'ordre du fichier. Ainsi :
 *   - aucun rang nouveau n'est inventé : on réutilise ceux des thématiques déplacées, donc l'intercalage avec une thématique
 *     ajoutée à la main (sans clé) ne bouge pas ;
 *   - une thématique déjà à sa place n'est pas écrite ;
 *   - rejouer l'outil ne change plus rien.
 * Une thématique du programme absente de la base est signalée (`missing`), pas créée : c'est le travail de `seed.ts`.
 *
 * MODULE PUR : la mutation (`reorder.ts`) lit la base, demande le plan ici, puis l'applique ; l'essai à blanc rend le même plan.
 */
import { VISIBLE_CLASSES } from "../curriculum";
import type { ProgrammeSubject } from "./types";

export type ReorderTopicRow = {
  _id: string;
  order: number;
  class?: string | null;
  programmeKey?: string | null;
};

export type ReorderMove = { topicId: string; programmeKey: string; klass: string; from: number; to: number };

export type ReorderPlan = {
  subject: string;
  /** Les thématiques du programme trouvées en base. */
  loaded: number;
  moves: ReorderMove[];
  /** Déjà à leur place. */
  unchanged: number;
  /** Les clés du programme qui ne sont pas en base : lancer `programme/seed:run` d'abord. */
  missing: string[];
  /** Les thématiques de la matière en base qui ne sont plus au programme (gardées telles quelles). */
  notInProgramme: string[];
};

/** Les clés d'une matière, dans l'ordre voulu : les classes du CI au CM2, puis l'ordre du fichier. */
export function programmeOrder(subject: ProgrammeSubject): { key: string; klass: string }[] {
  return VISIBLE_CLASSES.flatMap((klass) => subject.classes[klass].map((topic) => ({ key: topic.key, klass })));
}

export function planReorder(input: { subject: ProgrammeSubject; topics: readonly ReorderTopicRow[] }): ReorderPlan {
  const wanted = programmeOrder(input.subject);
  const wantedKeys = new Set(wanted.map((entry) => entry.key));
  // Les clés d'une matière commencent toutes par le même préfixe (« an- » pour l'anglais) : une clé d'une autre matière n'est pas « hors programme ».
  const prefixes = new Set(wanted.map((entry) => entry.key.split("-")[0]));
  const byKey = new Map<string, ReorderTopicRow>();
  const notInProgramme: string[] = [];
  for (const topic of input.topics) {
    if (!topic.programmeKey) continue;
    if (wantedKeys.has(topic.programmeKey)) byKey.set(topic.programmeKey, topic);
    else if (prefixes.has(topic.programmeKey.split("-")[0])) notInProgramme.push(topic.programmeKey);
  }

  const present = wanted.filter((entry) => byKey.has(entry.key));
  const missing = wanted.filter((entry) => !byKey.has(entry.key)).map((entry) => entry.key);
  const slots = present.map((entry) => (byKey.get(entry.key) as ReorderTopicRow).order).sort((a, b) => a - b);

  const moves: ReorderMove[] = [];
  present.forEach((entry, index) => {
    const topic = byKey.get(entry.key) as ReorderTopicRow;
    if (topic.order !== slots[index]) moves.push({ topicId: topic._id, programmeKey: entry.key, klass: entry.klass, from: topic.order, to: slots[index] });
  });

  return {
    subject: input.subject.key,
    loaded: present.length,
    moves,
    unchanged: present.length - moves.length,
    missing,
    notInProgramme,
  };
}
