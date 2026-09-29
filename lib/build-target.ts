/**
 * LA CIBLE DE CETTE CONSTRUCTION : le site web, ou l'application iOS/Android.
 *
 * Le 29 septembre 2026, le propriétaire a retiré l'espace élève du web : sur
 * ordinateur, Jotna ne sert plus que l'école, les professeurs et les parents.
 * L'élève apprend dans l'application Capacitor, qui emballe CE MÊME code : on
 * ne pouvait donc pas supprimer ses pages sans vider aussi l'application.
 *
 * Elles portent l'extension `.app.tsx`, que `next.config.ts` ne lit qu'avec
 * `JOTNA_TARGET=app` (`pnpm dev:app`, `pnpm build:app`, `pnpm ios:sync`,
 * `pnpm android:sync`). Un `next build` nu construit le site, qui n'en
 * contient rien. La même config pose `NEXT_PUBLIC_JOTNA_TARGET`, lu ici.
 */
export const HAS_STUDENT_SPACE = process.env.NEXT_PUBLIC_JOTNA_TARGET === "app";

/** Où va un élève connecté quand cette construction n'a pas son espace. */
export const STUDENT_APP_ONLY_PATH = "/eleve";
