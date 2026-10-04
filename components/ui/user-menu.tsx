"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Menu } from "@base-ui/react/menu";
import { ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";

type Variant = "sidebar" | "compact";

interface UserMenuProps {
  profileHref: string;
  settingsHref?: string;
  variant?: Variant;
  className?: string;
  fallbackLabel?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu({
  profileHref,
  settingsHref,
  variant = "sidebar",
  className,
  fallbackLabel = "Compte",
}: UserMenuProps) {
  const profile = useQuery(api.profiles.getCurrentProfile);
  // Rechargement complet sur /login, voulu : voir `hooks/use-logout.ts`.
  const handleLogout = useLogout();

  const name = profile?.name ?? fallbackLabel;
  const email = profile?.email ?? "";
  const initials = getInitials(profile?.name);

  const triggerClass =
    variant === "sidebar"
      ? "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
      : "flex items-center gap-2 rounded-full p-1 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400";

  return (
    <Menu.Root>
      <Menu.Trigger className={cn(triggerClass, className)}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 font-bold text-white",
            variant === "sidebar" ? "h-8 w-8 text-xs" : "h-11 w-11 text-base",
          )}
        >
          {initials}
        </span>
        {variant === "sidebar" && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-gray-900">
                {name}
              </span>
              {email ? (
                <span className="truncate text-xs text-gray-500">{email}</span>
              ) : null}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side={variant === "sidebar" ? "top" : "bottom"}
          align={variant === "sidebar" ? "start" : "end"}
          sideOffset={8}
          className="z-50"
        >
          <Menu.Popup className="min-w-[16rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg outline-none">
            <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 text-xs font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-900">{name}</div>
                {email ? (
                  <div className="truncate text-xs text-gray-500">{email}</div>
                ) : null}
              </div>
            </div>
            <div className="py-1">
              <Menu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 outline-none data-[highlighted]:bg-gray-100"
                render={<Link href={profileHref} />}
              >
                <UserCircle className="h-4 w-4 text-gray-500" />
                <span>Mon profil</span>
              </Menu.Item>
              {settingsHref ? (
                <Menu.Item
                  className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 outline-none data-[highlighted]:bg-gray-100"
                  render={<Link href={settingsHref} />}
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span>Paramètres</span>
                </Menu.Item>
              ) : null}
            </div>
            <div className="border-t border-gray-100 py-1">
              <Menu.Item
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-red-600 outline-none data-[highlighted]:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
