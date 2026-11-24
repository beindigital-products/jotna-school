"use client";

/**
 * LA COQUE DES ESPACES ADULTES : parent, professeur, école.
 *
 * Un seul composant pour les trois, là où chaque layout recopiait le sien.
 *
 * - Ordinateur et tablette (768 px et plus) : menu latéral fixe.
 * - Téléphone : barre du haut (logo, compte) et barre d'onglets en bas, sous
 *   le pouce. Plus de menu caché derrière un bouton : les pages sont peu
 *   nombreuses, elles tiennent toutes dans la barre.
 *
 * Les deux menus portent les clés `data-tour` de la visite guidée
 * (`components/onboarding/tour-steps.ts`) ; la visite éclaire celui qui est
 * affiché.
 *
 * La garde de rôle reste du confort (`components/RoleGate.tsx`) : chaque
 * fonction Convex vérifie le rôle de son côté.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Brand } from "@/components/landing/brand";
import { UserMenu } from "@/components/ui/user-menu";
import { RoleGate } from "@/components/RoleGate";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import type { TourRole } from "@/components/onboarding/tour-steps";
import { roleHomePath, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  /** Le nom complet, dans le menu latéral. */
  label: string;
  /** Le nom court, sous l'icône de la barre d'onglets. */
  shortLabel?: string;
  icon: LucideIcon;
  /** Autres débuts d'adresse qui allument cet onglet. */
  alsoActiveOn?: string[];
  /** Faux : absent de la barre d'onglets du téléphone (reste dans le menu du compte). */
  inTabBar?: boolean;
};

export type DashboardAccent = {
  /** Texte et boutons : au moins 4,5:1 sur blanc. */
  strong: string;
  /** Fond des pastilles et de l'onglet actif. */
  soft: string;
};

function isActive(pathname: string, item: DashboardNavItem): boolean {
  const roots = [item.href, ...(item.alsoActiveOn ?? [])];
  return roots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

/** Le dernier segment de l'adresse : `/parent/children` donne `nav-children`. */
function tourKey(href: string): string {
  return `nav-${href.split("/").pop()}`;
}

export function DashboardShell({
  allow,
  tourRole,
  roleLabel,
  accent,
  nav,
  settingsHref,
  headerExtra,
  children,
}: {
  /** Les rôles admis. Les autres sont renvoyés vers leur propre espace. */
  allow: readonly Role[];
  tourRole: TourRole;
  roleLabel: string;
  accent: DashboardAccent;
  nav: DashboardNavItem[];
  settingsHref: string;
  /** Un élément propre à l'espace, à droite de la barre du haut. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const profile = useQuery(api.profiles.getCurrentProfile);

  // Un compte connecté dans le mauvais espace repart vers le sien.
  useEffect(() => {
    if (!profile) return;
    const role = profile.role as Role;
    if (!allow.includes(role)) router.replace(roleHomePath(role));
  }, [profile, allow, router]);

  // Les boîtes de dialogue et les listes shadcn s'ouvrent dans un portail,
  // hors de la coque : l'accent est donc posé aussi sur `body`, sans quoi
  // leurs boutons perdaient leur couleur.
  useEffect(() => {
    const { style } = document.body;
    style.setProperty("--dash-strong", accent.strong);
    style.setProperty("--dash-soft", accent.soft);
    return () => {
      style.removeProperty("--dash-strong");
      style.removeProperty("--dash-soft");
    };
  }, [accent.strong, accent.soft]);

  const tabs = nav.filter((item) => item.inTabBar !== false);

  return (
    <RoleGate allow={allow}>
      <div
        className="min-h-dvh bg-stone-50 text-stone-900 print:bg-white"
        style={
          {
            "--dash-strong": accent.strong,
            "--dash-soft": accent.soft,
          } as React.CSSProperties
        }
      >
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Aller au contenu
        </a>

        {/* Menu latéral : tablette et ordinateur */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex print:hidden">
          <div className="flex h-16 items-center gap-2 px-4">
            <Brand size="sm" />
            <span className="ml-auto rounded-full bg-(--dash-soft) px-2.5 py-1 text-xs font-semibold text-(--dash-strong)">
              {roleLabel}
            </span>
          </div>
          <nav aria-label={`Menu ${roleLabel.toLowerCase()}`} className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="space-y-1">
              {nav.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-tour={tourKey(item.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-(--dash-strong)",
                        active
                          ? "bg-(--dash-soft) font-semibold text-(--dash-strong)"
                          : "text-stone-700 hover:bg-stone-100",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-stone-200 p-3" data-tour="user-menu">
            <UserMenu profileHref={settingsHref} fallbackLabel={roleLabel} />
          </div>
        </aside>

        {/* Barre du haut : téléphone */}
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden print:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Brand size="sm" />
            <span className="rounded-full bg-(--dash-soft) px-2.5 py-1 text-xs font-semibold text-(--dash-strong)">
              {roleLabel}
            </span>
            <div className="ml-auto flex min-w-0 items-center gap-2">
              {headerExtra}
              <div data-tour="user-menu">
                <UserMenu
                  profileHref={settingsHref}
                  variant="compact"
                  fallbackLabel={roleLabel}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="md:pl-64 print:pl-0">
          {headerExtra && (
            <div className="hidden h-16 items-center justify-end border-b border-stone-200 bg-white px-8 md:flex print:hidden">
              {headerExtra}
            </div>
          )}
          <main
            id="contenu"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-6 md:pb-12 lg:px-8 lg:pt-8 print:p-0"
          >
            {children}
          </main>
        </div>

        {/* Barre d'onglets : téléphone */}
        <nav
          aria-label={`Menu ${roleLabel.toLowerCase()}`}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
        >
          <ul className="mx-auto flex max-w-lg">
            {tabs.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    data-tour={tourKey(item.href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong)",
                      active ? "text-(--dash-strong)" : "text-stone-600",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        active && "bg-(--dash-soft)",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="max-w-full truncate">
                      {item.shortLabel ?? item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <DashboardTour role={tourRole} />
      </div>
    </RoleGate>
  );
}
