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
  where: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: ParentHeartIcon,
    iconGradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    title: "Créez votre compte sur le site",
    description:
      "Inscrivez-vous gratuitement sur le site web, en tant que parent ou professeur. Un seul compte parent suffit pour suivre plusieurs enfants.",
    accent: "bg-amber-50 text-amber-800 ring-amber-200",
    audience: "Parent ou professeur",
    where: "Sur le site web",
  },
  {
    number: "02",
    icon: LoginTicketIcon,
    iconGradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(101,163,13,0.55)]",
    title: "Créez le compte de l'enfant",
    description:
      "Depuis votre espace, indiquez le nom et la classe de l'enfant. Jotna School génère son code de connexion : donnez-le-lui.",
    accent: "bg-lime-50 text-lime-800 ring-lime-200",
    audience: "Parent ou professeur",
    where: "Sur le site web",
  },
  {
    number: "03",
    icon: TrophyRibbonIcon,
    iconGradient: "bg-gradient-to-br from-orange-400 to-amber-600",
    iconShadow: "shadow-[0_8px_20px_-8px_rgba(249,115,22,0.55)]",
    title: "Connecte-toi et apprends",
    description:
      "Ouvre l'application Jotna School, saisis ton code et fais les exercices de ta classe. Chaque réussite fait grimper ta jauge et débloque des badges.",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    audience: "Élève",
    where: "Dans l'application",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="comment"
      eyebrow="Comment ça marche"
      title="Démarrer en 3 étapes."
      description="Les étapes 1 et 2 sont pour le parent ou le professeur, sur le site web. L'étape 3 est pour l'élève, dans l'application sur tablette ou téléphone."
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
                <span aria-hidden> · </span>
                {step.where}
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {step.description}
              </p>
            </StaggerItem>
          );
        })}
        </StaggerContainer>
        <p className="relative z-10 mt-6 text-center text-sm text-gray-600">
          Ensuite, le parent ou le professeur suit les progrès de l'élève
          depuis le site web.
        </p>
      </div>
    </Section>
  );
}
