import { ArrowRight } from "lucide-react";

import { LAUNCH_TITLE } from "@/components/launch/launch-copy";
import { SignupLink } from "@/components/launch/signup-gate";
import { Pio } from "@/components/student/pio";
import { CAMP_NIGHT_WIDE } from "@/lib/game-assets";
import type { SignupRole } from "@/lib/signup";

import { BTN_SUN } from "./landing-style";

/**
 * LA FIN DE LA PAGE, AU CAMP, À LA NUIT TOMBÉE. Un bouton par rôle : chacun
 * emporte son rôle jusqu'à l'inscription (`SignupLink`, qui ouvre la pop-up
 * « Lancement prochainement » tant que le site n'est pas lancé, voir
 * `docs/comptes-et-acces.md`). Sous chaque bouton, la suite en une phrase.
 *
 * L'ordre des trois liens (parent, professeur, directeur) est tenu par
 * `__tests__/get-started-pio.test.tsx`.
 */
const PATHS: Array<{ role: SignupRole; cta: string; next: string }> = [
  {
    role: "parent",
    cta: "Je suis parent",
    next: "Je crée mon compte, puis celui de chaque enfant : il reçoit son code de connexion.",
  },
  {
    role: "professeur",
    cta: "Je suis professeur",
    next: "Je crée mes classes et les comptes de mes élèves, ou je les ajoute avec leur code élève.",
  },
  {
    role: "directeur",
    cta: "Je représente une école",
    next: "J'inscris mon école, je partage le code école et je confie chaque classe à un professeur.",
  },
];

export function GetStarted() {
  return (
    <section id="commencer" className="relative isolate overflow-hidden bg-savanna-night text-[#fff8e7]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: `url(${CAMP_NIGHT_WIDE})` }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-savanna-night/45" />

      <div className="mx-auto w-full max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-savanna-sand">{LAUNCH_TITLE}</p>
        <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-outline sm:text-[46px]">
          Jotna School ouvre bientôt.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-outline sm:text-lg">
          Les inscriptions ouvriront au lancement, pour les écoles, les professeurs et les parents. Vous
          avez reçu un code d&apos;invitation ? Créez votre compte dès maintenant.
        </p>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {PATHS.map((path) => (
            <li key={path.role} className="flex flex-col items-center rounded-3xl bg-savanna-night/70 p-5">
              <SignupLink signupRole={path.role} className={`group w-full ${BTN_SUN}`}>
                {path.cta}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </SignupLink>
              <p className="mt-4 text-sm leading-6 text-[#fff8e7]">{path.next}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-8 flex max-w-3xl items-center gap-4 rounded-3xl bg-[#fff8e7] p-5 text-left sm:p-6">
          {/* Pio, en affiche légère et sans clip : un clin d'œil, pas un poids de plus. */}
          <Pio
            state="hello"
            size={112}
            lite
            animated={false}
            className="drop-shadow-[0_8px_10px_rgba(60,30,0,0.2)]"
          />
          <p className="text-sm leading-6 text-[#2b1d0e]">
            <strong className="font-semibold">Et l&apos;élève ?</strong> Son
            parent ou son professeur crée son compte et lui donne un code. Il le
            saisit sur le site Jotna School, depuis un ordinateur, une tablette
            ou un téléphone, et commence à jouer. Pio l&apos;attend déjà&nbsp;!
          </p>
        </div>
      </div>
    </section>
  );
}
