"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";

import { Brand } from "./brand";
import { SignupLink } from "@/components/launch/signup-gate";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * LE MENU SUIT LA PAGE, de haut en bas : on essaie, on découvre les mondes, on
 * voit ce que les adultes suivent, puis le prix et les questions. Cinq liens,
 * pas plus : « Accueil » est le logo, et les étapes (« Comment ça marche ») se
 * lisent en descendant.
 *
 * Il porte le décor de la page : une barre de papier, des liens en pastilles,
 * le bouton d'inscription en bouton de jeu.
 */
const LINKS = [
  { href: "#jouer", id: "jouer", label: "Essayer" },
  { href: "#matieres", id: "matieres", label: "Les mondes" },
  { href: "#pour-qui", id: "pour-qui", label: "Pour qui" },
  { href: "#prix", id: "prix", label: "Prix" },
  { href: "#faq", id: "faq", label: "Questions" },
];

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          // Le haut de la page n'a pas de lien : rien n'est souligné.
          setActive(visible.target.id === "accueil" ? null : visible.target.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    ["accueil", ...LINKS.map((link) => link.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

const SIGNUP =
  "btn-chunky group items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-savanna-sun font-display font-semibold text-[#2b1d0e] outline-none [--btn-depth:#c97f00] focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60";

export function Navbar() {
  const active = useActiveSection();
  // Le menu mobile se ferme au clic sur une ancre : la page défile derrière
  // lui, et il resterait sinon ouvert devant la section demandée.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#ecd9ac] bg-[#fff8e7]/95 backdrop-blur-md">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-5 sm:px-8 lg:h-20"
      >
        <Brand size="lg" priority className="h-12 w-auto lg:h-16" />

        <ul className="mx-auto hidden items-center gap-1 rounded-full bg-[#fdeecb] p-1 font-display text-base font-semibold lg:flex">
          {LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-block whitespace-nowrap rounded-full px-4 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1e2a4a] ${
                    isActive
                      ? "bg-[#8a4b1f] text-[#fff8e7]"
                      : "text-[#2b1d0e] hover:bg-[#f6dfae]"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href="/login"
            className="hidden whitespace-nowrap rounded-2xl px-4 py-2.5 font-display text-base font-semibold text-[#2b1d0e] outline-none transition-colors hover:bg-[#fdeecb] focus-visible:ring-2 focus-visible:ring-[#1e2a4a] lg:inline-flex"
          >
            Se connecter
          </Link>
          <SignupLink className={`${SIGNUP} hidden px-5 py-2.5 text-base lg:inline-flex`}>
            S&apos;inscrire
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </SignupLink>

          {/* Mobile Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-2xl bg-[#fdeecb] text-[#2b1d0e] hover:bg-[#f6dfae] lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-[300px] bg-[#fff8e7] sm:w-[400px]">
              <SheetHeader className="border-b-2 border-[#ecd9ac] pb-4 text-left">
                <SheetTitle>
                  <Brand size="lg" className="h-14 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1.5 px-3">
                {LINKS.map((link) => {
                  const isActive = active === link.id;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex min-h-12 items-center rounded-2xl px-4 font-display text-lg font-semibold transition-colors ${
                        isActive
                          ? "bg-[#8a4b1f] text-[#fff8e7]"
                          : "text-[#2b1d0e] hover:bg-[#fdeecb]"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
                <hr className="my-4 border-[#ecd9ac]" />
                <div className="flex flex-col gap-3">
                  {/* Le menu se referme, puis la pop-up s'ouvre : elle est
                      posée au-dessus de la page, pas dans ce menu. */}
                  <SignupLink onClick={closeMenu} className={`${SIGNUP} flex h-12 text-lg`}>
                    S&apos;inscrire
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </SignupLink>
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#ecd9ac] bg-[#fffdf7] font-display text-lg font-semibold text-[#2b1d0e] transition-colors hover:bg-[#fdeecb]"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
