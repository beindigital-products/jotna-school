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
  Sparkles,
} from "lucide-react";

import { Section } from "./section";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

// Les sept matières du programme officiel, puis l'anglais, que le guide ne
// contient pas (`convex/programme`) : résumées pour la vitrine, la liste
// complète des thématiques, classe par classe, est dans
// `docs/programme-et-jeux.md`. L'anglais est une matière, pas un module : comme
// les autres, toute école abonnée l'a (`convex/moduleCatalog.ts`).
const SUBJECTS: {
  icon: Icon;
  title: string;
  description: string;
  gradient: string;
}[] = [
  {
    icon: BookOpen,
    title: "Français",
    description: "Des premiers sons du CI aux textes du CM2 : lire, écrire, conjuguer, accorder.",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
  },
  {
    icon: Calculator,
    title: "Mathématiques",
    description: "Nombres, calcul, géométrie, mesures et problèmes, du CI au CM2.",
    gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700",
  },
  {
    icon: FlaskConical,
    title: "Éveil scientifique",
    description: "Le corps, les plantes, les animaux, l'eau, l'électricité, la santé et l'environnement.",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    icon: Landmark,
    title: "Histoire",
    description: "Du temps qui passe aux royaumes du Sénégal, aux grands empires et à l'indépendance.",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-700",
  },
  {
    icon: MapPinned,
    title: "Géographie",
    description: "Se repérer, lire une carte, découvrir les régions, les saisons et les ressources du Sénégal.",
    gradient: "bg-gradient-to-br from-sky-500 to-cyan-600",
  },
  {
    icon: HeartHandshake,
    title: "Instruction civique",
    description: "Vivre ensemble : politesse, code de la route, symboles de la Nation, institutions.",
    gradient: "bg-gradient-to-br from-violet-500 to-indigo-600",
  },
  {
    icon: Palette,
    title: "Éducation artistique",
    description: "Couleurs, dessin, symétrie, sons et rythmes : des jeux pour s'exercer chaque jour.",
    gradient: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
  },
  {
    icon: Languages,
    title: "Anglais",
    description: "Des premiers mots du CI aux petits textes du CM2 : se présenter, parler de sa journée, raconter hier.",
    gradient: "bg-gradient-to-br from-teal-500 to-cyan-700",
  },
];

const ARABIC_LEVELS = [
  "L'alphabet : écouter, reconnaître, prononcer, écrire du doigt",
  "Les voyelles : les premières syllabes",
  "Assembler les lettres pour lire un mot",
  "Mes premiers mots",
  "Mes premières sourates, verset par verset",
  "Mémoriser, avec des révisions espacées",
];

const UPCOMING_LANGUAGES = ["Espagnol", "Italien"];

export function Subjects() {
  return (
    <Section
      id="matieres"
      eyebrow="Matières et modules"
      title="Ce que l'élève peut apprendre."
      description="Les sept matières du programme officiel sénégalais, du CI au CM2, et l'anglais sont disponibles pour tous les élèves. Les modules sont des enseignements en plus, que l'école active selon ses besoins."
    >
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
        Les matières
      </h3>
      <StaggerContainer className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map(({ icon: Icon, title, description, gradient }) => (
          <StaggerItem
            key={title}
            className="flex gap-4 rounded-3xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-lg"
          >
            <span
              aria-hidden
              className={`flex size-12 flex-none items-center justify-center rounded-2xl text-white ${gradient}`}
            >
              <Icon className="size-6" />
            </span>
            <div>
              <h4 className="text-lg font-extrabold text-gray-900">{title}</h4>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <h3 className="mt-12 text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
        Les modules
      </h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-lime-50/50 p-7 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-2xl text-white"
            >
              🕌
            </span>
            <h4 className="text-xl font-extrabold text-gray-900">
              Arabe &amp; Coran
            </h4>
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Disponible
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Un parcours en six niveaux pour apprendre à lire l&apos;arabe, de
            l&apos;alphabet jusqu&apos;aux premières sourates. Chaque niveau
            prépare le suivant.
          </p>
          <ol className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {ARABIC_LEVELS.map((level, i) => (
              <li
                key={level}
                className="flex gap-3 text-sm leading-6 text-gray-700"
              >
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span>{level}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs font-medium text-gray-500">
            Ce module est activé par l&apos;école : les élèves d&apos;une école
            qui ne l&apos;a pas demandé ne le voient pas.
          </p>
        </div>

        <div className="flex flex-col rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
            >
              <Languages className="size-6" />
            </span>
            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              À venir
            </span>
          </div>
          <h4 className="mt-4 text-xl font-extrabold text-gray-900">
            Autres langues
          </h4>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            De nouveaux modules de langues arriveront au fur et à mesure.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {UPCOMING_LANGUAGES.map((lang) => (
              <li
                key={lang}
                className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700 ring-1 ring-gray-200"
              >
                {lang}
              </li>
            ))}
            <li className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-500 ring-1 ring-gray-200">
              <Sparkles className="size-3.5" aria-hidden />
              et d&apos;autres
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
