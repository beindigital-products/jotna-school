"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayoutDashboard } from "lucide-react";

import { Brand } from "@/components/landing/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { roleHomePath, type Role } from "@/lib/auth";

const sidebarLinks = [
  { href: "/school/dashboard", label: "Mon école", icon: LayoutDashboard },
];

/**
 * L'ESPACE ÉCOLE — le compte `directeur` (accès libre). Une seule page
 * principale : le code école, les professeurs, les classes.
 */
export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useQuery(api.profiles.getCurrentProfile);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "directeur" && profile.role !== "admin") {
      router.replace(roleHomePath(profile.role as Role));
    }
  }, [profile, router]);

  return (
    <RoleGate allow={["directeur", "admin"]}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <Brand size="sm" />
              <span className="ml-auto rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                École
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith("/school/");
                    const Icon = link.icon;
                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          render={<Link href={link.href} />}
                          className={isActive ? "bg-sky-50 text-sky-800 font-semibold border-r-2 border-sky-600 rounded-none transition-all duration-200" : ""}
                        >
                          <Icon className={isActive ? "text-sky-600" : ""} />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <UserMenu
              profileHref="/school/dashboard"
              settingsHref="/school/dashboard"
              fallbackLabel="École"
            />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="text-sm font-medium text-gray-500">Espace école</div>
          </header>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </RoleGate>
  );
}
