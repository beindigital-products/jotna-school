import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";

import { Brand } from "./brand";

type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
};

const COLUMNS: FooterColumn[] = [
  {
    title: "Produit",
    links: [
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Exercices", href: "/#exercices" },
      { label: "Gamification", href: "/#gamification" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "Activer un code école", href: "/register" },
      { label: "Espace parent", href: "/parent/dashboard" },
      { label: "Espace professeur", href: "/teacher/dashboard" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/legal/mentions" },
      { label: "Conditions générales", href: "/legal/cgu" },
      { label: "Politique de confidentialité", href: "/legal/confidentialite" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Protection des mineurs", href: "/legal/mineurs" },
      { label: "Accessibilité", href: "/legal/accessibilite" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Brand size="md" className="h-20 w-auto" />
            <p className="max-w-xs text-sm leading-6 text-gray-600">
              Apprendre en s&apos;amusant, du CP au CM2. Gratuit, sans pub,
              données protégées.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="size-3.5" aria-hidden />
                Conforme RGPD
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Sans pub · Sans tracking
              </span>
            </div>
            <a
              href="mailto:contact@jotnaschool.com"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              <Mail className="size-4" aria-hidden />
              contact@jotnaschool.com
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Jotna School. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-400">
            Fait avec soin pour les élèves du CP au CM2.
          </p>
        </div>
      </div>
    </footer>
  );
}
