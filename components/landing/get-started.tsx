import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { ArrowRight, School } from "lucide-react";

import { KidIcon, ParentHeartIcon, TeacherIcon } from "./landing-icons";
import { Section } from "./section";

/**
 * COMMENCER — la section qui remplace la liste d'attente pendant l'accès
 * libre. Le composant `waitlist.tsx` et son backend restent dans le dépôt
 * pour revenir plus tard.
 *
 * Un parcours par type de compte, chacun avec son bouton vers `/register`
 * déjà réglé sur le bon rôle. L'élève n'a pas de bouton : son compte est créé
 * par un adulte, et c'est écrit en bas.
 */

type Path = {
  role: "directeur" | "professeur" | "parent";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  gradient: string;
  title: string;
  steps: string[];
  cta: string;
};

const PATHS: Path[] = [
  {
    role: "parent",
    icon: ParentHeartIcon,
    gradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    title: "Je suis parent",
    steps: [
      "Je crée mon compte.",
      "Je crée le compte de chaque enfant : il reçoit son code de connexion.",
      "Je donne son code élève à son professeur, s'il utilise Jotna.",
    ],
    cta: "Créer mon compte parent",
  },
  {
    role: "professeur",
    icon: TeacherIcon,
    gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    title: "Je suis professeur",
    steps: [
      "Je crée mon compte, puis mes classes.",
      "Je crée les comptes de mes élèves, ou je les ajoute avec leur code élève.",
      "Mon école utilise Jotna ? Je la rejoins avec son code école.",
    ],
    cta: "Créer mon compte professeur",
  },
  {
    role: "directeur",
    icon: School,
    gradient: "bg-gradient-to-br from-sky-500 to-indigo-600",
    title: "Je représente une école",
    steps: [
      "J'inscris mon école.",
      "Je partage le code école avec mes professeurs.",
      "Je vois toutes les classes et confie chacune à un professeur.",
    ],
    cta: "Inscrire mon école",
  },
];

export function GetStarted() {
  return (
    <Section
      id="commencer"
      eyebrow="Commencer"
      title="Créez votre compte, c'est gratuit."
      description="Écoles, professeurs et parents s'inscrivent librement. Les enfants, eux, n'ont rien à remplir."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {PATHS.map((path) => {
          const Icon = path.icon;
          return (
            <div
              key={path.role}
              className="flex flex-col rounded-3xl border border-gray-100 bg-white p-7 transition-shadow hover:shadow-lg"
            >
              <span
                aria-hidden
                className={`flex size-12 items-center justify-center rounded-2xl text-white ${path.gradient}`}
              >
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-gray-900">
                {path.title}
              </h3>
              <ol className="mt-4 flex-1 space-y-3">
                {path.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-gray-600">
                    <span className="flex size-6 flex-none items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Link
                href={`/register?role=${path.role}`}
                className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
              >
                {path.cta}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-3xl bg-amber-50 p-6">
        <span
          aria-hidden
          className="flex size-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"
        >
          <KidIcon className="size-5" />
        </span>
        <p className="text-sm leading-6 text-amber-950">
          <strong className="font-semibold">Et l&apos;élève ?</strong> Son
          parent ou son professeur crée son compte et lui donne un code. Il le
          tape dans l&apos;application Jotna School, sur tablette ou téléphone,
          et commence à jouer.
        </p>
      </div>
    </Section>
  );
}
