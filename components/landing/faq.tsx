"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";

import { Section } from "./section";

const ITEMS = [
  {
    q: "L'application est-elle vraiment gratuite ?",
    a: "Oui, l'accès à Jotna est 100 % gratuit. Aucune publicité, aucun abonnement caché.",
  },
  {
    q: "À quel âge s'adresse Jotna ?",
    a: "Les contenus sont calibrés pour les enfants du CP au CM2, mais certains chapitres conviennent aussi aux élèves de 6e en révision.",
  },
  {
    q: "Mon enfant a besoin d'une adresse email ?",
    a: "Non. Son école lui remet un billet avec un code personnel, et ce code suffit pour se connecter à l'application.",
  },
  {
    q: "Comment sont conçus les exercices ?",
    a: "Les exercices sont rédigés à partir de supports pédagogiques puis relus par un professeur avant publication. Aucun contenu n'est diffusé sans validation humaine.",
  },
  {
    q: "Quelles données sont collectées sur mon enfant ?",
    a: "Uniquement les informations nécessaires au suivi de progression : exercices réalisés, temps passé, score. Aucune donnée n'est vendue ou partagée.",
  },
  {
    q: "Peut-on utiliser Jotna sur tablette ou mobile ?",
    a: "Oui, et c'est même là que l'élève apprend : dans l'application Jotna School, sur tablette ou téléphone, iOS comme Android. Le site web, lui, sert aux parents et aux professeurs, qui y suivent ses progrès.",
  },
];

export function FAQ() {
  return (
    <Section
      id="faq"
      eyebrow="Questions fréquentes"
      title="Tout ce que vous vous demandez."
      description="Les réponses aux questions qui reviennent le plus souvent."
    >
      <Accordion.Root className="mx-auto max-w-3xl divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-100 bg-white">
        {ITEMS.map((item) => (
          <Accordion.Item key={item.q}>
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-gray-900 outline-none transition-colors hover:bg-gray-50 focus-visible:bg-gray-50">
                <span>{item.q}</span>
                <Plus
                  className="size-5 flex-none text-gray-400 transition-transform group-data-[panel-open]:rotate-45"
                  aria-hidden
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-7 text-gray-600 transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
              <div className="px-6 pb-5">{item.a}</div>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Section>
  );
}
