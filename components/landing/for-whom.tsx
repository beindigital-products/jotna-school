import type { ComponentType, SVGProps } from "react";
import { Sparkles } from "lucide-react";

import { KidIcon, ParentHeartIcon, TeacherIcon } from "./landing-icons";
import { Section } from "./section";

type Persona = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  tagline: string;
  gradient: string;
  iconShadow: string;
  bulletColor: string;
  points: string[];
  featured?: boolean;
};

const PERSONAS: Persona[] = [
  {
    icon: KidIcon,
    title: "Pour les enfants",
    tagline: "Apprendre en s'amusant",
    gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconShadow: "shadow-[0_10px_24px_-8px_rgba(245,158,11,0.55)]",
    bulletColor: "bg-amber-400",
    points: [
      "Des exercices courts et variés",
      "Des badges pour chaque étape",
      "Une jauge de progression visuelle",
    ],
  },
  {
    icon: ParentHeartIcon,
    title: "Pour les parents",
    tagline: "Suivre sans surveiller",
    gradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    iconShadow: "shadow-[0_10px_24px_-8px_rgba(101,163,13,0.55)]",
    bulletColor: "bg-lime-500",
    featured: true,
    points: [
      "Tableau de bord pour plusieurs enfants",
      "Rapports clairs par chapitre",
      "Notifications quand un badge est gagné",
      "Temps d'écran maîtrisé",
    ],
  },
  {
    icon: TeacherIcon,
    title: "Pour les professeurs",
    tagline: "Guider collectivement",
    gradient: "bg-gradient-to-br from-orange-400 to-amber-600",
    iconShadow: "shadow-[0_10px_24px_-8px_rgba(249,115,22,0.55)]",
    bulletColor: "bg-orange-400",
    points: [
      "Suivi individuel des élèves",
      "Détection des difficultés récurrentes",
      "Contenus validés avant publication",
    ],
  },
];

export function ForWhom() {
  return (
    <Section
      id="pour-qui"
      eyebrow="Pour qui"
      title="Un outil pensé pour toute la famille."
      description="Chaque rôle dispose de son espace. Les enfants apprennent, les adultes accompagnent."
    >
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isFeatured = p.featured;

          return (
            <div
              key={p.title}
              className={
                isFeatured
                  ? "group relative overflow-hidden rounded-3xl border-2 border-lime-400 bg-gradient-to-br from-lime-50 via-white to-emerald-50/50 p-7 shadow-[0_20px_60px_-20px_rgba(101,163,13,0.35)] transition-all md:-translate-y-3 hover:-translate-y-4 hover:shadow-[0_25px_70px_-20px_rgba(101,163,13,0.45)]"
                  : "group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg"
              }
            >
              {isFeatured && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-lime-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="size-3" aria-hidden />
                  Le + utilisé
                </span>
              )}

              <div className="flex items-center">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl text-white ${p.gradient} ${p.iconShadow} ${
                    isFeatured ? "ring-4 ring-lime-200" : ""
                  }`}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
              </div>

              <h3
                className={`mt-6 font-extrabold text-gray-900 ${
                  isFeatured ? "text-2xl" : "text-xl"
                }`}
              >
                {p.title}
              </h3>
              <p
                className={`mt-1 text-sm font-medium ${
                  isFeatured ? "text-lime-700" : "text-gray-500"
                }`}
              >
                {p.tagline}
              </p>

              <ul className="mt-5 space-y-2.5">
                {p.points.map((point) => (
                  <li
                    key={point}
                    className={`flex items-start gap-2.5 text-sm ${
                      isFeatured ? "text-gray-700" : "text-gray-600"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-[7px] size-1.5 flex-none rounded-full ${
                        isFeatured ? p.bulletColor : "bg-gray-300"
                      }`}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
