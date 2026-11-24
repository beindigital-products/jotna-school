"use client";

import { FileBarChart, LayoutDashboard, Settings, Users } from "lucide-react";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/shell";

const NAV: DashboardNavItem[] = [
  {
    href: "/parent/dashboard",
    label: "Tableau de bord",
    shortLabel: "Accueil",
    icon: LayoutDashboard,
  },
  {
    href: "/parent/children",
    label: "Mes enfants",
    shortLabel: "Enfants",
    icon: Users,
  },
  { href: "/parent/reports", label: "Rapports", icon: FileBarChart },
  {
    href: "/parent/settings",
    label: "Paramètres",
    shortLabel: "Réglages",
    icon: Settings,
  },
];

const ALLOW = ["parent", "admin"] as const;
const ACCENT = { strong: "#2f7a23", soft: "#edf7e9" };

/**
 * L'espace parent. `tuteur` n'est pas un rôle mais une RELATION
 * (`studentGuardians.relation`) : un tuteur légal porte le rôle `parent`.
 */
export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      allow={ALLOW}
      tourRole="parent"
      roleLabel="Parent"
      accent={ACCENT}
      nav={NAV}
      settingsHref="/parent/settings"
    >
      {children}
    </DashboardShell>
  );
}
