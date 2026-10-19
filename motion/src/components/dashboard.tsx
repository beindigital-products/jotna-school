import React from "react";
import { Img, staticFile } from "remotion";
import {
  Award,
  BookOpen,
  ChevronsUpDown,
  FileBarChart,
  LayoutDashboard,
  PanelLeft,
  School,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { C, FONT } from "../theme";
import { Avatar } from "./ui";

export type Role = "admin" | "teacher" | "parent";

type NavItem = { label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> };

// Libellés, icônes et couleurs des trois coques (app/(admin|teacher|parent)/layout.tsx).
const ROLES: Record<
  Role,
  {
    pill: string;
    pillBg: string;
    pillFg: string;
    activeBg: string;
    activeFg: string;
    activeBorder: string;
    activeIcon: string;
    header: string;
    nav: NavItem[];
  }
> = {
  admin: {
    pill: "Admin",
    pillBg: C.orange100,
    pillFg: C.orange700,
    activeBg: C.orange50,
    activeFg: C.orange700,
    activeBorder: C.orange500,
    activeIcon: C.orange600,
    header: "Administration",
    nav: [
      { label: "Tableau de bord", icon: LayoutDashboard },
      { label: "Matières", icon: BookOpen },
      { label: "AI Gateway", icon: Zap },
      { label: "Badges", icon: Award },
      { label: "Écoles", icon: School },
      { label: "Élèves", icon: Users },
      { label: "Paramètres", icon: Settings },
    ],
  },
  teacher: {
    pill: "Professeur",
    pillBg: C.amber100,
    pillFg: C.amber800,
    activeBg: C.amber50,
    activeFg: C.amber800,
    activeBorder: C.amber600,
    activeIcon: C.amber600,
    header: "Espace professeur",
    nav: [
      { label: "Tableau de bord", icon: LayoutDashboard },
      { label: "Mes élèves", icon: Users },
      { label: "Rapports", icon: FileBarChart },
      { label: "Paramètres", icon: Settings },
    ],
  },
  parent: {
    pill: "Parent",
    pillBg: C.lime100,
    pillFg: "#3c6300",
    activeBg: C.lime50,
    activeFg: "#3c6300",
    activeBorder: C.lime600,
    activeIcon: C.lime600,
    header: "Espace parent",
    nav: [
      { label: "Tableau de bord", icon: LayoutDashboard },
      { label: "Mes enfants", icon: Users },
      { label: "Rapports", icon: FileBarChart },
      { label: "Paramètres", icon: Settings },
    ],
  },
};

// Couleur d'accent des pages, distincte de celle de la barre latérale.
export const ACCENT: Record<Role, string> = {
  admin: "#4f39f6",
  teacher: C.emerald600,
  parent: "#009689",
};

type ShellProps = {
  role: Role;
  active: string;
  user: { name: string; email: string };
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  /** Défilement vertical du contenu principal, en px. */
  scroll?: number;
  width: number;
  height: number;
};

export const SIDEBAR_W = 256;
export const HEADER_H = 64;

/** Coque commune des espaces web : barre latérale shadcn, en-tête, zone principale. */
export const DashboardShell: React.FC<ShellProps> = ({
  role,
  active,
  user,
  children,
  headerRight,
  scroll = 0,
  width,
  height,
}) => {
  const r = ROLES[role];
  return (
    <div style={{ position: "relative", width, height, display: "flex", fontFamily: FONT, color: C.ink, background: C.bg }}>
      <div
        style={{
          width: SIDEBAR_W,
          height: "100%",
          background: "#fafafa",
          borderRight: "1px solid #e5e5e5",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "14px 14px 12px 16px", gap: 8 }}>
          <Img src={staticFile("app/jotna-logo.png")} style={{ height: 40, width: "auto" }} />
          <span
            style={{
              marginLeft: "auto",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 500,
              background: r.pillBg,
              color: r.pillFg,
            }}
          >
            {r.pill}
          </span>
        </div>
        <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {r.nav.map((item) => {
            const on = item.label === active;
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 16px",
                  margin: on ? "0 0 0 8px" : "0 8px",
                  borderRadius: on ? 0 : 8,
                  fontSize: 14,
                  fontWeight: on ? 600 : 400,
                  color: on ? r.activeFg : "#3f3f46",
                  background: on ? r.activeBg : "transparent",
                  borderRight: on ? `2px solid ${r.activeBorder}` : "2px solid transparent",
                }}
              >
                <Icon size={17} color={on ? r.activeIcon : "#52525b"} strokeWidth={2} />
                {item.label}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 8 }}>
            <Avatar name={user.name} size={32} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
            </div>
            <ChevronsUpDown size={16} color={C.faint} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            height: HEADER_H,
            borderBottom: `1px solid ${C.line2}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            background: C.bg,
            position: "relative",
            zIndex: 5,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PanelLeft size={17} color={C.slate} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.muted }}>{r.header}</span>
          <div style={{ marginLeft: "auto" }}>{headerRight}</div>
        </div>
        <div style={{ position: "absolute", top: HEADER_H, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <div style={{ padding: 32, transform: `translateY(${-scroll}px)` }}>{children}</div>
        </div>
      </div>
    </div>
  );
};

/** Titre de page des espaces web : H1 `text-2xl font-bold` + sous-titre gris. */
export const PageTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode; icon?: React.ReactNode }> = ({
  title,
  subtitle,
  right,
  icon,
}) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
    {icon}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{subtitle}</div> : null}
    </div>
    {right}
  </div>
);

/** Bouton plein ou contour des tableaux de bord. */
export const DashButton: React.FC<{
  children: React.ReactNode;
  color?: string;
  outline?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  pressed?: number;
}> = ({ children, color = ACCENT.admin, outline = false, icon, style, pressed = 0 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 38,
      padding: "0 16px",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      color: outline ? C.slate : "#fff",
      background: outline ? "#fff" : color,
      border: outline ? `1px solid ${C.line2}` : `1px solid ${color}`,
      boxShadow: "0 1px 2px rgba(17,24,39,0.06)",
      transform: `scale(${1 - pressed * 0.05})`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {icon}
    {children}
  </div>
);
