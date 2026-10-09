/**
 * LE PROGRAMME DE L'ÉLÉMENTAIRE SÉNÉGALAIS, CI → CM2, CLASSÉ PAR MATIÈRE ET
 * PAR CLASSE.
 *
 * Source : « Guide pédagogique des matières du CI au CM2 au Sénégal »
 * (synthèse du Curriculum de l'Éducation de Base et des guides pédagogiques
 * par étape du MEN), établi le 9 octobre 2026. Sept matières, toutes hors
 * l'éducation physique et sportive :
 *
 *   Français                 Domaine 1 — Langue et communication
 *   Mathématiques            Domaine 2
 *   Éveil scientifique       Domaine 3 — ESVS (IST, Vivre dans son milieu)
 *   Histoire                 Domaine 3 — ESVS (Découverte du monde)
 *   Géographie               Domaine 3 — ESVS (Découverte du monde)
 *   Instruction civique      Domaine 3 — ESVS (Vivre ensemble)
 *   Éducation artistique     Domaine 4 — EPSA (arts plastiques, musique, arts scéniques)
 *
 * Ce module ne touche pas la base. Il sert à trois choses :
 *  - le chargement des matières et des thématiques (`programme/seed.ts`) ;
 *  - la génération d'un palier, qui retrouve ici les jeux d'une thématique
 *    grâce à `topics.programmeKey` (`paliers/index.ts`) ;
 *  - la documentation : `docs/programme-et-jeux.md` en est la lecture.
 */
import type { VisibleClassName } from "../curriculum";
import { VISIBLE_CLASSES } from "../curriculum";
import { EDUCATION_ARTISTIQUE } from "./arts";
import { INSTRUCTION_CIVIQUE } from "./civique";
import { FRANCAIS } from "./francais";
import { GEOGRAPHIE } from "./geographie";
import { HISTOIRE } from "./histoire";
import { MATHEMATIQUES } from "./mathematiques";
import { EVEIL_SCIENTIFIQUE } from "./sciences";
import type { ProgrammeSubject, ProgrammeSubjectKey, ProgrammeTopic } from "./types";

export type { ProgrammeSubject, ProgrammeSubjectKey, ProgrammeTopic } from "./types";

/** Les sept matières, dans l'ordre de l'emploi du temps. */
export const PROGRAMME: readonly ProgrammeSubject[] = [
  FRANCAIS,
  MATHEMATIQUES,
  EVEIL_SCIENTIFIQUE,
  HISTOIRE,
  GEOGRAPHIE,
  INSTRUCTION_CIVIQUE,
  EDUCATION_ARTISTIQUE,
];

export type ProgrammeEntry = {
  subject: ProgrammeSubject;
  klass: VisibleClassName;
  topic: ProgrammeTopic;
};

const BY_TOPIC_KEY: ReadonlyMap<string, ProgrammeEntry> = new Map(
  PROGRAMME.flatMap((subject) =>
    VISIBLE_CLASSES.flatMap((klass) =>
      subject.classes[klass].map((topic) => [topic.key, { subject, klass, topic }] as const),
    ),
  ),
);

/** La fiche d'une thématique du programme, ou `null` pour une clé inconnue. */
export function programmeTopic(key: string | null | undefined): ProgrammeEntry | null {
  if (!key) return null;
  return BY_TOPIC_KEY.get(key) ?? null;
}

export function programmeSubject(key: ProgrammeSubjectKey): ProgrammeSubject {
  const subject = PROGRAMME.find((s) => s.key === key);
  if (!subject) throw new Error(`Matière inconnue du programme : ${key}`);
  return subject;
}

/** Toutes les thématiques, à plat. */
export function allProgrammeEntries(): ProgrammeEntry[] {
  return Array.from(BY_TOPIC_KEY.values());
}

/**
 * Un nom de matière ramené à sa forme de comparaison : sans accents, sans
 * casse, sans ponctuation. « Éducation civique » et « education  civique »
 * désignent la même matière.
 */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
