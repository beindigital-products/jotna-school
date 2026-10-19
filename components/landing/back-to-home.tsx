"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";

/**
 * « RETOUR À L'ACCUEIL » — la sortie des pages de connexion et d'inscription.
 *
 * Un visiteur arrivé de la vitrine ne doit pas rester enfermé dans un
 * formulaire. Le logo menait déjà à l'accueil, mais rien ne le disait : ce
 * bouton le dit. Il est posé dans la mise en page commune des pages d'accès
 * (`app/(auth)/layout.tsx`), donc il suit la connexion, l'inscription et la
 * réinitialisation du mot de passe.
 *
 * ABSENT DANS L'APPLICATION iOS/ANDROID. La vitrine n'y existe pas : `/`
 * renvoie vers `/post-auth` (`NativeAppGate`), qui renvoie vers `/login`. Le
 * bouton ferait tourner l'enfant en rond. `useIsNativeApp` vaut `false` au
 * pré-rendu : sur le web le bouton est dans le HTML dès le premier affichage,
 * sans saut de mise en page ; dans l'application il disparaît à l'hydratation.
 * C'est pourquoi la mise en page le POSE EN ABSOLU : son retrait ne déplace
 * rien.
 */
export function BackToHome({ className }: { className?: string }) {
  const native = useIsNativeApp();
  if (native) return null;

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Retour à l&apos;accueil
    </Link>
  );
}
