import type { ComponentType, SVGProps } from "react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  HeartHandshake,
  Landmark,
  Languages,
  MapPinned,
  Palette,
} from "lucide-react";

import type { ProgrammeSubjectKey } from "@/convex/programme/types";

export type LandingIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type LandingSubject = {
  /** La clé de la matière dans `convex/programme` : le catalogue des exercices la lit. */
  key: ProgrammeSubjectKey;
  icon: LandingIcon;
  title: string;
  description: string;
  gradient: string;
};

// Les sept matières du programme officiel, puis l'anglais, que le guide ne
// contient pas (`convex/programme`) : résumées pour la vitrine, la liste
// complète des thématiques, classe par classe, est dans
// `docs/programme-et-jeux.md`. L'anglais est une matière, pas un module : comme
// les autres, toute école abonnée l'a (`convex/moduleCatalog.ts`).
//
// UNE SEULE LISTE pour la section « Exercices » et la section « Matières » :
// le même nom, la même icône et la même couleur d'une section à l'autre.
// L'ordre est celui de `PROGRAMME` ; un test le verrouille
// (`__tests__/exercise-catalog.test.ts`).
export const LANDING_SUBJECTS: LandingSubject[] = [
  {
    key: "francais",
    icon: BookOpen,
    title: "Français",
    description: "Des premiers sons du CI aux textes du CM2 : lire, écrire, conjuguer, accorder.",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
  },
  {
    key: "mathematiques",
    icon: Calculator,
    title: "Mathématiques",
    description: "Nombres, calcul, géométrie, mesures et problèmes, du CI au CM2.",
    gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700",
  },
  {
    key: "eveil-scientifique",
    icon: FlaskConical,
    title: "Éveil scientifique",
    description: "Le corps, les plantes, les animaux, l'eau, l'électricité, la santé et l'environnement.",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    key: "histoire",
    icon: Landmark,
    title: "Histoire",
    description: "Du temps qui passe aux royaumes du Sénégal, aux grands empires et à l'indépendance.",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-700",
  },
  {
    key: "geographie",
    icon: MapPinned,
    title: "Géographie",
    description: "Se repérer, lire une carte, découvrir les régions, les saisons et les ressources du Sénégal.",
    gradient: "bg-gradient-to-br from-sky-500 to-cyan-600",
  },
  {
    key: "instruction-civique",
    icon: HeartHandshake,
    title: "Instruction civique",
    description: "Vivre ensemble : politesse, code de la route, symboles de la Nation, institutions.",
    gradient: "bg-gradient-to-br from-violet-500 to-indigo-600",
  },
  {
    key: "education-artistique",
    icon: Palette,
    title: "Éducation artistique",
    description: "Couleurs, dessin, symétrie, sons et rythmes : des jeux pour s'exercer chaque jour.",
    gradient: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
  },
  {
    key: "anglais",
    icon: Languages,
    title: "Anglais",
    description: "Des premiers mots du CI aux petits textes du CM2 : se présenter, parler de sa journée, raconter hier.",
    gradient: "bg-gradient-to-br from-teal-500 to-cyan-700",
  },
];
