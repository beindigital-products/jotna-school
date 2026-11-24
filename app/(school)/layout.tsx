"use client";

import { GraduationCap, LayoutDashboard, Settings } from "lucide-react";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/shell";

const NAV: DashboardNavItem[] = [
  {
    href: "/school/dashboard",
    label: "Mon école",
    shortLabel: "École",
    icon: LayoutDashboard,
    alsoActiveOn: ["/school/classes"],
  },
  {
    href: "/school/teachers",
    label: "Professeurs",
    shortLabel: "Profs",
    icon: GraduationCap,
  },
  {
    href: "/school/settings",
    label: "Paramètres",
    shortLabel: "Réglages",
    icon: Settings,
  },
];

const ALLOW = ["directeur", "admin"] as const;
const ACCENT = { strong: "#0369a1", soft: "#e8f4fd" };

/**
 * L'ESPACE ÉCOLE : le compte `directeur`. « Mon école » porte le code école et les
 * classes ; « Professeurs » liste les professeurs et gère leurs accès.
 */
export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      allow={ALLOW}
      tourRole="school"
      roleLabel="École"
      accent={ACCENT}
      nav={NAV}
      settingsHref="/school/settings"
    >
      {children}
    </DashboardShell>
  );
}
