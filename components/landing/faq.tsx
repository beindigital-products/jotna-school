"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";

import { Section } from "./section";

const ITEMS = [
  {
    q: "Combien coûte Jotna ?",
    a: "Rien pour le moment. Écoles, professeurs et parents créent leur compte librement, et les élèves accèdent à tous les exercices de leur classe.",
  },
  {
    q: "Qui crée le compte de l'enfant ?",
    a: "Son parent, depuis son espace parent, ou son professeur, depuis l'une de ses classes. L'enfant reçoit un code de connexion qu'il saisit sur le site pour se connecter.",
  },
  {
    q: "Comment mon enfant rejoint-il la classe de son professeur ?",
    a: "Dans votre espace parent, chaque enfant a un code élève (il commence par ELV-). Donnez-le au professeur : il le saisit, et votre enfant apparaît dans sa classe. Vous gardez l'accès à son suivi.",
  },
  {
    q: "À quel âge s'adresse Jotna ?",
    a: "Les contenus sont calibrés pour les enfants du CP au CM2, mais certains chapitres conviennent aussi aux élèves de 6e en révision.",
  },
  {
    q: "Mon enfant a besoin d'une adresse email ?",
    a: "Non. L'adulte qui crée son compte reçoit un code de connexion personnel, et ce code suffit pour se connecter.",
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
    a: "Oui, le site s'adapte à l'ordinateur, à la tablette et au téléphone. Une application iOS et Android est à venir.",
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
