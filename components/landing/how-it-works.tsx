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
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: ParentHeartIcon,
    iconGradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    title: "Un adulte crée son compte",
    description:
      "École, professeur ou parent : l'inscription est libre et gratuite. Un seul compte parent suffit pour plusieurs enfants.",
    accent: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    number: "02",
    icon: LoginTicketIcon,
    iconGradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(101,163,13,0.55)]",
    title: "Il crée le compte de l'enfant",
    description:
      "Le parent ou le professeur crée le compte en deux champs : nom et classe. L'enfant reçoit son code de connexion.",
    accent: "bg-lime-50 text-lime-800 ring-lime-200",
  },
  {
    number: "03",
    icon: TrophyRibbonIcon,
    iconGradient: "bg-gradient-to-br from-orange-400 to-amber-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(249,115,22,0.55)]",
    title: "L'enfant apprend et progresse",
    description:
      "Il tape son code dans l'application et joue aux exercices de sa classe. Chaque réussite fait grimper sa jauge et débloque des badges.",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="comment"
      eyebrow="Comment ça marche"
      title="Trois étapes pour démarrer."
      description="L'élève apprend dans l'application Jotna School, sur tablette ou téléphone. Parents et professeurs suivent ses progrès depuis le site web."
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
              <h3 className="mt-5 text-xl font-extrabold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {step.description}
              </p>
            </StaggerItem>
          );
        })}
        </StaggerContainer>
      </div>
    </Section>
  );
}
