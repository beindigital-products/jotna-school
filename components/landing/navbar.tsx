"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { motion } from "framer-motion";

import { Brand } from "./brand";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#accueil", id: "accueil", label: "Accueil" },
  { href: "#comment", id: "comment", label: "Comment ça marche" },
  { href: "#exercices", id: "exercices", label: "Exercices" },
  { href: "#pour-qui", id: "pour-qui", label: "Pour qui" },
  { href: "#faq", id: "faq", label: "FAQ" },
];

function useActiveSection() {
  const [active, setActive] = useState<string>("accueil");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActive(visible.target.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

export function Navbar() {
  const active = useActiveSection();
  // Le menu mobile se ferme au clic sur une ancre : la page défile derrière
  // lui, et il resterait sinon ouvert devant la section demandée.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md"
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <Brand size="lg" priority className="h-20 w-auto" />

        <ul className="hidden items-center gap-8 text-base font-medium md:flex">
          {LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-block py-1.5 transition-colors ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      aria-hidden
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-amber-500"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-5 py-2.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
          >
            Se connecter
          </Link>
          <a
            href="#liste-attente"
            className="group hidden items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98] sm:inline-flex"
          >
            Liste d&apos;attente
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>

          {/* Mobile Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left border-b border-gray-100 pb-4">
                <SheetTitle>
                  <Brand size="lg" className="h-16 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2 px-2">
                {LINKS.map((link) => {
                  const isActive = active === link.id;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex items-center rounded-xl px-3 py-2.5 text-lg font-medium transition-colors ${
                        isActive
                          ? "bg-amber-50 text-amber-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute inset-y-2 left-0 w-1 rounded-full bg-amber-500"
                        />
                      )}
                      {link.label}
                    </a>
                  );
                })}
                <hr className="my-4 border-gray-100" />
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center rounded-xl border border-gray-200 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Se connecter
                  </Link>
                  <a
                    href="#liste-attente"
                    onClick={closeMenu}
                    className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-900 text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                  >
                    Rejoindre la liste d&apos;attente
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
