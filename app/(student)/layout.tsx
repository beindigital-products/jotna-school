"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Home, Award, UserCircle } from "lucide-react";
import { Brand } from "@/components/landing/brand";
import { AccessGate } from "@/components/AccessGate";
import { MotionConfig } from "framer-motion";

const PROFILE_HREF = "/student/profil";

// Le profil n'est pas dans la barre du haut : l'avatar, à droite, y mène déjà.
// Il reste dans la barre du bas, où il n'y a pas d'avatar.
const topNavLinks = [
  { href: "/student/home", label: "Accueil", icon: Home },
  { href: "/student/badges", label: "Coffre", icon: Award },
];

const bottomNavLinks = [
  ...topNavLinks,
  { href: PROFILE_HREF, label: "Profil", icon: UserCircle },
];

// Routes where the student should be fully focused on the exercise —
// the top nav + bottom tab are hidden to avoid distraction (Decision 90 +
// driving-test app pattern). Decision D5 extends focus to the bottom tab.
function isFocusRoute(pathname: string): boolean {
  return (
    /^\/student\/topics\/[^/]+\/session/.test(pathname) ||
    /^\/student\/topics\/[^/]+\/complete/.test(pathname)
  );
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const focusMode = isFocusRoute(pathname);

  return (
    // D12 — honors prefers-reduced-motion globally for all motion inside
    // /student/* routes (badges, session, complete, Pio, etc.).
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-yellow-50 to-lime-50">
        {!focusMode && (
          <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/80 backdrop-blur-sm">
            {/* Une barre courte : la marque, deux liens, l'avatar. Les
                compteurs (série, étoiles) vivent sur l'accueil et le profil,
                pas au-dessus de chaque écran. */}
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[4.5rem]">
              <Brand href="/student/home" size="sm" />

              {/* D5 — top nav links: tablet/desktop only. Mobile uses bottom tab. */}
              <nav
                aria-label="Navigation principale"
                className="hidden items-center gap-1 sm:flex"
              >
                {topNavLinks.map((link) => {
                  const isActive = isActivePath(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition-all ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                          : "text-gray-700 hover:bg-amber-100 hover:text-amber-800"
                      }`}
                    >
                      <link.icon className="h-5 w-5" aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <ProfileAvatarLink active={isActivePath(pathname, PROFILE_HREF)} />
            </div>
          </header>
        )}

        <main
          className={`mx-auto w-full max-w-5xl flex-1 px-4 py-6 ${
            !focusMode ? "pb-24 sm:pb-6" : ""
          }`}
        >
          <AccessGate>{children}</AccessGate>
        </main>

        {/* D5 — bottom tab nav: mobile only. Hidden during focus mode. */}
        {!focusMode && <BottomTabNav pathname={pathname} />}
      </div>
    </MotionConfig>
  );
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * L'avatar, à droite de la barre : un lien vers la page de profil, et rien
 * d'autre. Plus de menu déroulant — il ne portait que « Mon profil » et
 * « Se déconnecter », et la page de profil tient les deux.
 *
 * Sur tablette et plus, le prénom et le niveau (« CM1 ») s'affichent à côté
 * de l'avatar : l'enfant voit d'un coup d'œil pour quelle classe ses
 * exercices sont prévus.
 */
function ProfileAvatarLink({ active }: { active: boolean }) {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const name = profile?.name ?? "";
  const firstName = name.split(" ")[0] || "Élève";
  const studentClass = profile?.class ?? null;

  return (
    <Link
      href={PROFILE_HREF}
      aria-label="Mon profil"
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-all hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 sm:pr-3 ${
        active ? "bg-amber-100" : ""
      }`}
    >
      {profile?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar}
          alt=""
          className="h-10 w-10 rounded-full object-cover shadow-sm"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-sm font-bold text-white shadow-sm"
        >
          {initialsOf(name)}
        </span>
      )}
      <span className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate text-sm font-bold text-gray-900">
          {firstName}
        </span>
        {studentClass && (
          <span className="text-xs font-semibold text-orange-700">
            {studentClass}
          </span>
        )}
      </span>
    </Link>
  );
}

function BottomTabNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-amber-100 bg-white/95 backdrop-blur-md sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {bottomNavLinks.map((link) => {
          const isActive = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              // D15 — 56px tap target (>44px WCAG 2.5.5 AA).
              className={`flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-orange-600"
                  : "text-gray-500 active:text-orange-600"
              }`}
            >
              <link.icon
                className={`h-6 w-6 ${isActive ? "fill-orange-100" : ""}`}
                aria-hidden
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
