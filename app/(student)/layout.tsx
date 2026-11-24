"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Map as MapIcon, NotebookPen, Store, Tent } from "lucide-react";
import { Brand } from "@/components/landing/brand";
import { StudentGate } from "@/components/offline/student-gate";
import { OfflineBadge } from "@/components/offline/offline-badge";
import { CauriIcon, caurisLabel } from "@/components/student/game/cauri";
import { useStudentStats, useWallet } from "@/hooks/use-student-data";
import { MotionConfig } from "framer-motion";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";

/**
 * LA COQUILLE DU JEU — ce qui entoure chaque écran de l'espace élève.
 *
 * Cinq lieux, comme dans un jeu : le Camp (accueil, Pio, missions, coffre du
 * jour), la Carte (les mondes = les matières), le Marché (où les cauris se
 * dépensent), les Trésors (l'album de cartes et la Salle des trophées), le
 * Carnet. La navigation les nomme ainsi, pas « Accueil / Boutique / Profil » :
 * un enfant n'ouvre pas un profil, il ouvre son carnet.
 *
 * LE HUD EN HAUT dit le niveau et la barre qui mène au suivant, toujours au
 * même endroit : un jeu montre l'état du joueur sans qu'il ait à le chercher.
 * Les étoiles ont quitté l'en-tête pour le carnet (`LevelPill`, plus bas). Les
 * cauris, eux, y sont (`CauriPill`) : c'est ce que l'enfant dépense, il doit
 * voir ce qu'il a.
 *
 * COLD START SANS ZÉROS (D8) : le niveau s'affiche toujours — « Niveau 1 »
 * n'est pas un zéro, c'est un départ, et la barre vide dessous dit
 * « remplis-moi ». La série, au camp, n'apparaît qu'une fois gagnée.
 *
 * LE MODE FOCUS EST INTACT (D5, D90, G3) : pendant un palier et sur l'écran
 * de fin, ni HUD ni navigation. La pédagogie prime ; le jeu motive ENTRE les
 * exercices, pas pendant. Une leçon du module « Arabe & Coran » y entre aussi :
 * elle fait écouter, parler et écrire au doigt.
 *
 * SANS RÉSEAU, TOUT RESTE OUVERT (`docs/hors-ligne.md`). Les écrans lisent
 * l'appareil (`hooks/use-student-data.ts`), et la garde (`StudentGate`) laisse
 * entrer un enfant déjà connecté une fois, même en mode avion. La pastille du
 * réseau (`OfflineBadge`) dit « Sans internet » sans jamais parler d'erreur.
 *
 * CINQ LIEUX, PAS SIX (24 novembre 2026). Le Marché est entré dans la barre et
 * la Salle des trophées a rejoint les Trésors, à la demande du propriétaire.
 * La barre du bas donne 3,75 rem à chaque lieu : cinq tiennent sur un écran de
 * 320 px, un sixième déborderait. Le module optionnel « Arabe & Coran »
 * n'ajoute donc toujours PAS d'onglet : son entrée est un médaillon du Camp
 * (`app/(student)/student/home/page.tsx`), affichée seulement si l'école a
 * allumé le module.
 *
 * SUR GRAND ÉCRAN, les lieux sont des pastilles dans l'en-tête. Entre 640 et
 * 1024 px, elles ne gardent que leur image (le nom reste lu par un lecteur
 * d'écran) : cinq noms ne tiendraient pas à côté du niveau et des cauris.
 */
const NAV = [
  { href: "/student/home", label: "Camp", icon: Tent },
  { href: "/student/map", label: "Carte", icon: MapIcon },
  { href: "/student/marche", label: "Marché", icon: Store },
  { href: "/student/tresors", label: "Trésors", icon: Gem },
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
  // L'ancienne adresse de la Salle des trophées renvoie aux Trésors.
  if (href === "/student/tresors" && pathname.startsWith("/student/badges")) {
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
      {/* `overflow-x-clip` : la coque de la séance s'étend d'un bord à l'autre
          de la fenêtre (`session-stage.tsx`) ; sous une barre de défilement
          classique, elle dépasserait de sa largeur. `clip`, pas `hidden` : pas
          de conteneur de défilement, les en-têtes collants restent collants. */}
      <div className="flex min-h-screen flex-col overflow-x-clip bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)]">
        {!focusMode && (
          <header className="sticky top-0 z-20 border-b border-amber-200/60 bg-[#fff7e0]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
            {/* Une seule ligne : logo + état du joueur à gauche (l'avatar est
                descendu dans la barre du bas sur téléphone), les lieux au centre
                et l'avatar à droite sur grand écran. */}
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:h-20 [@media(max-height:500px)]:h-12">
              {/* À gauche : le logo. */}
              <Brand href="/student/home" size="md" />

              {/* À droite : le niveau (et, sur grand écran, la navigation puis
                  l'avatar). */}
              <div className="flex items-center gap-2 sm:gap-3">
                <nav className="hidden items-center gap-1.5 sm:flex">
                {NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-tour={`nav-${item.href.split("/").pop()}`}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      className={`flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 py-2 font-display text-base font-bold transition-all lg:px-4 ${
                        active
                          ? "bg-orange-500 text-white shadow-md shadow-orange-300/60"
                          : "text-amber-900/80 hover:bg-amber-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
                </nav>

                <OfflineBadge />

                <CauriPill />

                <LevelPill />

                <ProfileAvatarLink className="hidden sm:flex" />
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
              : "px-0 pb-32 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] sm:pb-8 [@media(max-height:500px)]:pb-2"
          }`}
        >
          <StudentGate>{children}</StudentGate>
        </main>

        {!focusMode && <BottomNav pathname={pathname} />}
        {!focusMode && <DashboardTour role="student" />}
      </div>
    </MotionConfig>
  );
}

/**
 * L'avatar de l'en-tête. Il ne déroule plus un menu : il mène droit à la page
 * « Modifier mon profil » (`/student/profil/edit`), où l'enfant change son nom
 * et le son, et se déconnecte. Nom et avatar viennent du carnet, calculé sur
 * l'appareil (`useStudentStats`) comme le HUD. Son allure ne change pas —
 * c'est le geste, plus le clic, qui change.
 */
function ProfileAvatarLink({ className = "" }: { className?: string }) {
  const stats = useStudentStats();
  const name = stats?.student.name ?? "";
  const avatar = stats?.student.avatar ?? null;
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <Link
      href="/student/profil/edit"
      aria-label="Modifier mon profil"
      className={`h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md ring-2 ring-white transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 ${className || "flex"}`}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-teal-400 font-display text-base font-bold text-white">
          {initials}
        </span>
      )}
    </Link>
  );
}

/**
 * LE NIVEAU DU JOUEUR, à droite de l'en-tête (le logo est à gauche). Les
 * étoiles ne sont plus dans l'en-tête ; leur total vit dans le carnet.
 *
 * Le niveau se lit sur l'appareil (`useStudentStats`), comme l'accueil et le
 * carnet : il monte dès la fin d'un palier, réseau ou pas.
 */
function LevelPill() {
  const stats = useStudentStats();
  if (!stats) return null;

  const level = stats.level ?? 1;
  const remaining = stats.exosToNextLevel ?? EXOS_PER_LEVEL;
  const gained = Math.max(0, Math.min(EXOS_PER_LEVEL, EXOS_PER_LEVEL - remaining));
  const pct = Math.round((gained / EXOS_PER_LEVEL) * 100);

  return (
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
  );
}

/**
 * LES CAURIS DU JOUEUR, à côté du niveau. La pastille mène au marché : c'est
 * là qu'ils se dépensent.
 *
 * Elle lit la bourse (`useWallet`), en ligne seulement pour l'instant : tant
 * qu'elle n'est pas arrivée, ou sans réseau dans l'application, la pastille
 * ne s'affiche pas (jamais de zéro trompeur, jamais d'attente dans l'en-tête).
 * Sous 360 px de large, elle laisse la place au niveau : le camp et le marché
 * montrent le solde eux aussi.
 */
function CauriPill() {
  const wallet = useWallet();
  if (!wallet) return null;
  return (
    <Link
      href="/student/marche"
      aria-label={`${caurisLabel(wallet.cauris)}. Ouvrir le marché`}
      className="hidden h-10 items-center gap-1 rounded-full border-2 border-white bg-amber-950/85 pl-1 pr-3 font-display text-base font-extrabold text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 min-[360px]:flex"
    >
      <CauriIcon className="h-7 w-7" />
      {wallet.cauris}
    </Link>
  );
}

/**
 * La barre du bas, sur téléphone : cinq lieux illustrés.
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
      <div className="mx-auto flex max-w-md items-end justify-around px-1 pb-1.5 pt-2">
        {NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={`nav-${item.href.split("/").pop()}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-[3.75rem] flex-col items-center justify-end gap-0.5 rounded-2xl px-1 pb-1 font-display text-xs font-extrabold transition-all ${
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
