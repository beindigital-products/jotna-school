"use client";

import {
  FileBarChart,
  LayoutDashboard,
  PenTool,
  School,
  Settings,
  Users,
} from "lucide-react";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/shell";

const NAV: DashboardNavItem[] = [
  {
    href: "/teacher/dashboard",
    label: "Tableau de bord",
    shortLabel: "Accueil",
    icon: LayoutDashboard,
  },
  {
    href: "/teacher/classes",
    label: "Mes classes",
    shortLabel: "Classes",
    icon: School,
  },
  {
    href: "/teacher/students",
    label: "Mes élèves",
    shortLabel: "Élèves",
    icon: Users,
  },
  {
    href: "/teacher/exercises",
    label: "Exercices",
    icon: PenTool,
    alsoActiveOn: ["/teacher/pdf-uploads"],
  },
  { href: "/teacher/reports", label: "Rapports", icon: FileBarChart },
  // Sur téléphone, les paramètres s'ouvrent par le menu du compte, en haut.
  {
    href: "/teacher/settings",
    label: "Paramètres",
    icon: Settings,
    inTabBar: false,
  },
];

const ALLOW = ["professeur", "admin"] as const;
const ACCENT = { strong: "#b45309", soft: "#fff4e0" };

/** L'espace professeur, qu'un `admin` traverse pour dépanner. */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      allow={ALLOW}
      tourRole="teacher"
      roleLabel="Professeur"
      accent={ACCENT}
      nav={NAV}
      settingsHref="/teacher/settings"
    >
      {children}
    </DashboardShell>
  );
}
