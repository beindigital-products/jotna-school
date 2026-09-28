"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tent, Map as MapIcon, Trophy, NotebookPen, Star, Flame } from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { Brand } from "@/components/landing/brand";
import { AccessGate } from "@/components/AccessGate";
import { MotionConfig } from "framer-motion";

/**
 * LA COQUILLE DU JEU — ce qui entoure chaque écran de l'espace élève.
 *
 * Quatre lieux, comme dans un jeu : le Camp (accueil, Pio, missions), la
 * Carte (les mondes = les matières), la Salle des trophées, le Carnet. La
 * navigation les nomme ainsi, pas « Accueil / Coffre / Profil » : un enfant
 * n'ouvre pas un profil, il ouvre son carnet.
 *
 * LE HUD EN HAUT dit trois choses, toujours au même endroit : le niveau et la
 * barre qui mène au suivant, les étoiles, la série. Un jeu montre l'état du
 * joueur sans qu'il ait à le chercher.
 *
 * COLD START SANS ZÉROS (D8) : étoiles et série n'apparaissent qu'une fois
 * gagnées. Le niveau, lui, s'affiche toujours — « Niveau 1 » n'est pas un
 * zéro, c'est un départ, et la barre vide dessous dit « remplis-moi ».
 *
 * LE MODE FOCUS EST INTACT (D5, D90, G3) : pendant un palier et sur l'écran
 * de fin, ni HUD ni navigation. La pédagogie prime ; le jeu motive ENTRE les
 * exercices, pas pendant. Une leçon du module « Arabe & Coran » y entre aussi :
 * elle fait écouter, parler et écrire au doigt.
 *
 * QUATRE LIEUX, PAS CINQ. Le module optionnel « Arabe & Coran » n'ajoute PAS
 * d'onglet : la barre du bas donne 4,5 rem à chaque lieu, un cinquième
 * déborderait sur un écran de 320 px, et la métaphore des quatre lieux y
 * perdrait sa lisibilité. Son entrée est une carte du Camp
 * (`app/(student)/student/home/page.tsx`), affichée seulement si l'école a
 * allumé le module.
 */
const NAV = [
  { href: "/student/home", label: "Camp", icon: Tent },
  { href: "/student/map", label: "Carte", icon: MapIcon },
  { href: "/student/badges", label: "Trophées", icon: Trophy },
  { href: "/student/profil", label: "Carnet", icon: NotebookPen },
] as const;

/** Reflète `students.EXOS_PER_LEVEL` — même valeur que dans le carnet. */
const EXOS_PER_LEVEL = 50;

function isFocusRoute(pathname: string): boolean {
  return (
    // L'écran de fin de palier vit dans la séance : même mode.
    /^\/student\/topics\/session/.test(pathname) ||
    // Une leçon d'arabe demande la même concentration qu'un palier : elle fait
    // écouter, répéter au micro et écrire au doigt, et la barre du bas
    // passerait sous le carré d'écriture sur un téléphone.
    /^\/student\/arabe\/lecon/.test(pathname)
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  // Le sentier d'une matière appartient à la Carte.
  if (href === "/student/map" && pathname.startsWith("/student/subjects")) {
    return true;
  }
  return false;
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const focusMode = isFocusRoute(pathname);

  return (
    // D12 — `prefers-reduced-motion` honoré pour tout mouvement sous /student.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)]">
        {!focusMode && (
          <header className="sticky top-0 z-20 border-b border-amber-200/60 bg-[#fff7e0]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-4">
              <Brand href="/student/home" size="sm" />

              {/* Tablette et bureau : les quatre lieux en haut. */}
              <nav className="hidden items-center gap-1.5 sm:flex">
                {NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 font-display text-base font-bold transition-all ${
                        active
                          ? "bg-orange-500 text-white shadow-md shadow-orange-300/60"
                          : "text-amber-900/80 hover:bg-amber-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2">
                <PlayerHud />
                <UserMenu
                  profileHref="/student/profil"
                  variant="compact"
                  fallbackLabel="Élève"
                />
              </div>
            </div>
          </header>
        )}

        {/* EN MODE FOCUS, PAS D'EN-TÊTE : c'est donc `main` qui doit écarter
            l'encoche et la barre d'accueil du téléphone (`viewportFit: cover`
            dans `app/layout.tsx` fait remonter le contenu sous l'écran entier).
            Chargement, démarrage et affichage d'un exercice passent tous ici. */}
        {focusMode && (
          // Le fond crème derrière la barre d'état et l'encoche, comme sous
          // l'en-tête des autres écrans : la zone n'est plus un bout de décor
          // qui flotte au-dessus de la séance. Hauteur nulle sur le web.
          // Un écran qui veut passer dessous (la fin d'un palier, dont le
          // ciel monte jusqu'en haut) pose `--focus-top-bg: transparent` sur
          // la racine du document, le temps qu'il est affiché.
          <div
            aria-hidden
            className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)]"
            style={{
              background: "var(--focus-top-bg, rgb(255 247 224 / 0.9))",
              backdropFilter: "var(--focus-top-blur, blur(12px))",
            }}
          />
        )}
        <main
          className={`mx-auto w-full max-w-5xl flex-1 ${
            focusMode
              ? "px-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              : "px-0 pb-28 sm:px-4 sm:pb-8"
          }`}
        >
          <AccessGate>{children}</AccessGate>
        </main>

        {!focusMode && <BottomNav pathname={pathname} />}
      </div>
    </MotionConfig>
  );
}

/**
 * Le HUD du joueur : niveau + barre d'expérience, étoiles, série.
 *
 * `getMyStats` est déjà lu par l'accueil et le carnet : Convex partage une
 * même souscription entre ses lecteurs, ce HUD ne coûte donc aucune lecture
 * de plus.
 */
function PlayerHud() {
  const stats = useQuery(api.students.getMyStats);
  if (!stats) return null;

  const level = stats.level ?? 1;
  const remaining = stats.exosToNextLevel ?? EXOS_PER_LEVEL;
  const gained = Math.max(0, Math.min(EXOS_PER_LEVEL, EXOS_PER_LEVEL - remaining));
  const pct = Math.round((gained / EXOS_PER_LEVEL) * 100);

  const showStreak = stats.streaksEnabled && stats.currentStreak > 0;
  const showStars = stats.totalStars > 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* LE NIVEAU : une pastille ORANGE à texte blanc, pas un pilule blanc
          sur un en-tête blanc. La barre a une piste sombre pour se lire même
          vide, et le compteur dit ce qu'elle mesure. */}
      <div
        className="flex items-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-amber-400 to-orange-500 py-1 pl-1.5 pr-3 shadow-md shadow-orange-300/60"
        aria-label={`Niveau ${level}, ${gained} bonnes réponses sur ${EXOS_PER_LEVEL} vers le niveau ${level + 1}`}
      >
        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-1.5 font-display text-base font-extrabold leading-none text-orange-600 shadow-inner">
          {level}
        </span>
        <div className="flex flex-col">
          <span className="text-outline font-display text-[11px] font-extrabold uppercase leading-none tracking-wider text-white">
            Niveau
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-2.5 w-14 overflow-hidden rounded-full bg-black/25 sm:w-20" aria-hidden>
              <div
                className="h-full rounded-full bg-lime-300 transition-[width] duration-700"
                style={{ width: `${Math.max(pct, 3)}%` }}
              />
            </div>
            <span className="text-outline font-display text-[11px] font-extrabold leading-none text-white">
              {gained}/{EXOS_PER_LEVEL}
            </span>
          </div>
        </div>
      </div>

      {showStars && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-yellow-300 px-2.5 py-1.5 font-display text-sm font-extrabold text-yellow-950 shadow-md shadow-yellow-300/60"
          aria-label={`${stats.totalStars} étoiles gagnées`}
        >
          <Star className="h-4 w-4 fill-yellow-600 text-yellow-700" aria-hidden />
          <span>{stats.totalStars}</span>
        </span>
      )}

      {showStreak && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-orange-200 px-2.5 py-1.5 font-display text-sm font-extrabold text-orange-950 shadow-md shadow-orange-300/60"
          aria-label={`Série de ${stats.currentStreak} jour${stats.currentStreak > 1 ? "s" : ""}`}
        >
          <Flame className="h-4 w-4 fill-orange-500 text-orange-600" aria-hidden />
          <span>{stats.currentStreak}</span>
        </span>
      )}
    </div>
  );
}

/**
 * La barre du bas, sur téléphone : quatre lieux illustrés.
 *
 * L'onglet actif est un bouton surélevé, comme dans les jeux mobiles : on
 * voit où l'on est sans lire. D15 — chaque cible fait 56 px de haut.
 */
function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-amber-300/70 bg-[#fff7e0]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-1.5 pt-2">
        {NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-[4.5rem] flex-col items-center justify-end gap-0.5 rounded-2xl px-2 pb-1 font-display text-xs font-extrabold transition-all ${
                active ? "text-orange-700" : "text-amber-900/60 active:text-orange-700"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-2xl transition-all ${
                  active
                    ? "-translate-y-2 bg-gradient-to-br from-amber-300 to-orange-500 p-2.5 text-white shadow-lg shadow-orange-400/50 ring-4 ring-white"
                    : "p-2"
                }`}
              >
                <item.icon className="h-6 w-6" aria-hidden />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
