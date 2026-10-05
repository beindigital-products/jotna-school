"use client";

import { motion } from "framer-motion";
import { Target, Trophy, UserRound, type LucideIcon } from "lucide-react";

import { Section } from "./section";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

type Step = {
  number: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  accent: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: UserRound,
    iconColor: "bg-amber-100 text-amber-700",
    title: "Connecte-toi avec ton code",
    description:
      "L'école remet à chaque élève son code de connexion. Un seul compte parent suffit pour suivre plusieurs enfants.",
    accent: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    number: "02",
    icon: Target,
    iconColor: "bg-lime-100 text-lime-700",
    title: "Choisis une matière",
    description:
      "Maths, français, sciences… chaque matière contient des chapitres adaptés au niveau scolaire.",
    accent: "bg-lime-50 text-lime-800 ring-lime-200",
  },
  {
    number: "03",
    icon: Trophy,
    iconColor: "bg-orange-100 text-orange-700",
    title: "Progresse et gagne des badges",
    description:
      "Chaque exercice réussi fait grimper la jauge de maîtrise et débloque des récompenses.",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="comment"
      eyebrow="Comment ça marche"
      title="Trois étapes, zéro friction."
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
                  className={`flex size-11 items-center justify-center rounded-2xl ${step.iconColor}`}
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
