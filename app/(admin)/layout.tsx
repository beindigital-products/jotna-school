"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  Zap,
  Hourglass,
  Ticket,
  Wallet,
  BadgePercent,
  UserCog,
  FileText,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

import { Brand } from "@/components/landing/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/ui/user-menu";
import { RoleGate } from "@/components/RoleGate";

type NavLink = { href: string; label: string; icon: LucideIcon };

/**
 * Le menu de la console, rangé par usage : piloter (chiffres, argent,
 * coupons), les personnes, puis le système.
 */
const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: "Pilotage",
    links: [
      { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/admin/revenus", label: "Revenus et abonnements", icon: Wallet },
      { href: "/admin/fidelisation", label: "Fidélisation", icon: HeartHandshake },
      { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
    ],
  },
  {
    label: "Personnes",
    links: [
      { href: "/admin/comptes", label: "Comptes", icon: UserCog },
      { href: "/admin/ecoles", label: "Écoles", icon: School },
      { href: "/admin/eleves", label: "Élèves", icon: Users },
      { href: "/admin/devis", label: "Demandes de devis", icon: FileText },
      // Avant le lancement : qui peut créer un compte (`convex/invitations.ts`).
      { href: "/admin/invitations", label: "Codes d'invitation", icon: Ticket },
      { href: "/admin/liste-attente", label: "Liste d'attente", icon: Hourglass },
    ],
  },
  // PAS DE GROUPE « CONTENU » POUR L'INSTANT (demande du propriétaire, 24
  // novembre 2026) : matières, manuels PDF et badges sortent du menu, le temps
  // de décider comment la console les présentera. Leurs pages existent
  // toujours (`/admin/subjects`, `/admin/pdf-uploads`, `/admin/badges`).
  {
    label: "Système",
    links: [
      { href: "/admin/ai-settings", label: "AI Gateway", icon: Zap },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

/**
 * L'accent de la console, lu par le kit des espaces adultes
 * (`components/dashboard/ui.tsx`) par `--dash-strong` et `--dash-soft`.
 * Orange 700 : plus de 4,5:1 sur blanc.
 */
const ACCENT = { strong: "#c2410c", soft: "#fff7ed" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Les boîtes de dialogue shadcn s'ouvrent dans un portail, hors de la
  // coque : l'accent est posé sur `body`, comme dans `DashboardShell`.
  useEffect(() => {
    const { style } = document.body;
    style.setProperty("--dash-strong", ACCENT.strong);
    style.setProperty("--dash-soft", ACCENT.soft);
    return () => {
      style.removeProperty("--dash-strong");
      style.removeProperty("--dash-soft");
    };
  }, []);

  // La console d'administration : `admin` seul. Le serveur garde déjà chacune
  // de ses fonctions ; ceci évite qu'un parent égaré y trouve des écrans vides.
  return (
    <RoleGate allow={["admin"]}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <Brand size="sm" />
              <span className="ml-auto rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                Super admin
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.links.map((link) => {
                      const isActive =
                        pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);
                      const Icon = link.icon;
                      return (
                        <SidebarMenuItem key={link.href}>
                          <SidebarMenuButton
                            isActive={isActive}
                            render={<Link href={link.href} />}
                            className={
                              isActive
                                ? "rounded-none border-r-2 border-orange-500 bg-orange-50 font-semibold text-orange-700 transition-all duration-200"
                                : ""
                            }
                          >
                            <Icon className={isActive ? "text-orange-600" : ""} />
                            <span>{link.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <UserMenu
              profileHref="/admin/settings"
              settingsHref="/admin/settings"
              fallbackLabel="Admin"
            />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="text-sm font-medium text-gray-500">
              Console du super admin
            </div>
          </header>
          {/* `SidebarInset` est déjà le `<main>` de la page : pas de second. */}
          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGate>
  );
}
