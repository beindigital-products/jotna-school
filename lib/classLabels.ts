import type { ClassName } from "@/convex/curriculum";

/**
 * Le nom complet de chaque niveau, tel que l'école le dit à l'enfant.
 *
 * Le sigle (« CM1 ») reste l'étiquette courte partout ; le nom complet sert
 * là où l'on a la place d'expliquer — la page de profil, pour l'essentiel.
 * Les niveaux de collège et de lycée figurent pour que le type reste complet,
 * mais aucun écran élève ne les atteint tant que `convex/curriculum.ts` les
 * masque.
 */
const CLASS_LONG_NAMES: Record<ClassName, string> = {
  CI: "Cours d'initiation",
  CP: "Cours préparatoire",
  CE1: "Cours élémentaire 1re année",
  CE2: "Cours élémentaire 2e année",
  CM1: "Cours moyen 1re année",
  CM2: "Cours moyen 2e année",
  "6e": "Sixième",
  "5e": "Cinquième",
  "4e": "Quatrième",
  "3e": "Troisième",
  "2nde": "Seconde",
  "1ere": "Première",
  Tle: "Terminale",
};

export function classLongName(klass: ClassName): string {
  return CLASS_LONG_NAMES[klass];
}

/**
 * « CM1 A » quand l'école distingue plusieurs classes d'un même niveau,
 * « CM1 » quand la classe s'appelle « unique » ou n'a pas de lettre.
 */
export function schoolClassDisplay(
  klass: ClassName,
  label: string | null | undefined,
): string {
  const trimmed = label?.trim() ?? "";
  if (!trimmed || trimmed.toLowerCase() === "unique") return klass;
  return `${klass} ${trimmed}`;
}
