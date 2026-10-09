/**
 * LE PROGRAMME OFFICIEL, CLASSÉ PAR MATIÈRE ET PAR CLASSE — les formes.
 *
 * MODULE PUR : le chargement en base (`programme/seed.ts`), la génération
 * des paliers (`paliers/index.ts`) et les tests le lisent.
 */
import type { VisibleClassName } from "../curriculum";
import type { GameSpec } from "../paliers/games";

export type ProgrammeTopic = {
  /**
   * La clé stable de la thématique, posée en base (`topics.programmeKey`) :
   * elle relie la ligne à cette fiche même quand un administrateur renomme
   * la thématique. Ne jamais la changer une fois chargée.
   */
  key: string;
  /** Le nom montré sur le sentier de l'enfant : court, parlant. */
  name: string;
  /**
   * Le contenu officiel visé, tel que le modèle le lira pour fabriquer les
   * exercices : notions, limites (« pas au-delà de 20 »), exemples. Écrit
   * pour un professeur, pas pour l'enfant.
   */
  description: string;
  /** Le nombre de paliers, quand il diffère du défaut du niveau (`palierRules`). */
  palierCount?: number;
  /** Les jeux fabriqués par le code à mêler à chaque palier (`paliers/games`). */
  games?: GameSpec[];
};

export type ProgrammeSubjectKey =
  | "francais"
  | "mathematiques"
  | "eveil-scientifique"
  | "histoire"
  | "geographie"
  | "instruction-civique"
  | "education-artistique";

export type ProgrammeSubject = {
  key: ProgrammeSubjectKey;
  /** Le nom de la matière en base et à l'écran. */
  name: string;
  /**
   * Les noms sous lesquels la matière existe peut-être déjà en base (le
   * premier jeu de données disait « Sciences », « EMC »…). Le chargement les
   * reconnaît au lieu de créer un doublon.
   */
  aliases: string[];
  /** La clé d'icône du catalogue (`lib/subjectIcons.ts`). */
  icon: string;
  color: string;
  order: number;
  /** Le domaine du Curriculum de l'Éducation de Base. */
  domain: string;
  classes: Record<VisibleClassName, ProgrammeTopic[]>;
};
