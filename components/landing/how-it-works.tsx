"use client";

import type { ComponentType, SVGProps } from "react";
import { motion } from "framer-motion";

import {
  LoginTicketIcon,
  ParentHeartIcon,
  TrophyRibbonIcon,
} from "./landing-icons";
import { Section } from "./section";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

type Step = {
  number: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconGradient: string;
  iconShadow: string;
  title: string;
  description: string;
  accent: string;
  audience: string;
  note?: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: ParentHeartIcon,
    iconGradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    title: "Créez votre compte",
    description:
      "L'inscription est gratuite. Une école inscrit son établissement et partage son code école avec ses professeurs. Un professeur crée ses classes. Un parent crée son espace : un seul compte suffit pour plusieurs enfants.",
    accent: "bg-amber-50 text-amber-800 ring-amber-200",
    audience: "École, professeur ou parent",
  },
  {
    number: "02",
    icon: LoginTicketIcon,
    iconGradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(101,163,13,0.55)]",
    title: "Créez le compte de l'enfant",
    description:
      "Indiquez son nom et sa classe : Jotna School génère son code de connexion, à lui remettre. Dans une école, le directeur confie chaque classe à un professeur.",
    accent: "bg-lime-50 text-lime-800 ring-lime-200",
    audience: "Professeur ou parent",
  },
  {
    number: "03",
    icon: TrophyRibbonIcon,
    iconGradient: "bg-gradient-to-br from-orange-400 to-amber-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(249,115,22,0.55)]",
    title: "Connecte-toi et apprends",
    description:
      "Rends-toi sur le site Jotna School, saisis ton code et fais les exercices de ta classe. Chaque réussite fait grimper ta jauge et débloque des badges.",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    audience: "Enfant",
    note: "Application iOS et Android : à venir.",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="comment"
      eyebrow="Comment ça marche"
      title="Démarrer en 3 étapes."
      description="Les étapes 1 et 2 s'adressent aux adultes : école, professeur ou parent. L'étape 3 s'adresse à l'enfant. Tout se fait sur le site web, depuis un ordinateur, une tablette ou un téléphone."
    >
      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[64px] z-0 hidden h-3 w-full sm:block"
          preserveAspectRatio="none"
          viewBox="0 0 100 3"
          fill="none"
        >
          <motion.path
            d="M 14 1.5 L 86 1.5"
            stroke="rgb(251, 191, 36)"
            strokeWidth="0.3"
            strokeLinecap="round"
            strokeDasharray="1.2 1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </svg>
        <StaggerContainer className="relative z-10 grid gap-5 sm:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <StaggerItem
              key={step.number}
              className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${step.accent}`}
                >
                  Étape {step.number}
                </span>
                <span
                  aria-hidden
                  className={`flex size-11 items-center justify-center rounded-2xl text-white ${step.iconGradient} ${step.iconShadow}`}
                >
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pour : <span className="text-gray-900">{step.audience}</span>
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {step.description}
              </p>
              {step.note ? (
                <p className="mt-3 text-xs font-medium text-gray-500">
                  {step.note}
                </p>
              ) : null}
            </StaggerItem>
          );
        })}
        </StaggerContainer>
        <p className="relative z-10 mt-6 text-center text-sm text-gray-600">
          Ensuite, l&apos;école, le professeur et le parent suivent les progrès de
          l&apos;enfant depuis leur espace.
        </p>
      </div>
    </Section>
  );
}
