import { VISIBLE_CLASSES, type VisibleClassName } from "@/convex/curriculum";
import type { SelectOption } from "./ui";

/** Les niveaux proposés dans une liste déroulante : CI, CP, CE1… */
export const CLASS_OPTIONS: SelectOption<VisibleClassName>[] = VISIBLE_CLASSES.map(
  (level) => ({ value: level, label: level }),
);
