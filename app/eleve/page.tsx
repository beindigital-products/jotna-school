"use client";

/**
 * L'ÉLÈVE SUR LE SITE WEB : son espace est dans l'application.
 *
 * Depuis le 29 septembre 2026, le site ne sert plus que l'école, les
 * professeurs et les parents (`lib/build-target.ts`). Un élève qui s'y
 * connecte arrive ici (`roleHomePath`) au lieu d'une page vide : on lui dit
 * où aller, et on lui laisse de quoi rendre l'ordinateur à un adulte.
 *
 * Dans l'application, son espace existe : la page le renvoie à son camp.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pio } from "@/components/student/pio";
import { useLogout } from "@/hooks/use-logout";
import { HAS_STUDENT_SPACE } from "@/lib/build-target";

export default function StudentAppOnlyPage() {
  const router = useRouter();
  const logout = useLogout();

  useEffect(() => {
    if (HAS_STUDENT_SPACE) router.replace("/student/home");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border-4 border-white bg-white/90 p-8 text-center shadow-xl">
        <Pio state="hello" size={150} className="mx-auto" priority />
        <h1 className="font-display mt-4 text-2xl font-extrabold text-amber-950">
          Jotna élève, c&apos;est dans l&apos;application
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          Sur ordinateur, Jotna sert l&apos;école, les professeurs et les parents. Pour
          apprendre avec Pio, ouvre l&apos;application Jotna School sur une tablette ou un
          téléphone, et connecte-toi avec le même code.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 w-full rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white shadow-md transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
