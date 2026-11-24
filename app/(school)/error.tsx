"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/dashboard/ui";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center"
    >
      <AlertTriangle className="h-12 w-12 text-red-600" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold text-stone-900">
        Cette page n&apos;a pas pu s&apos;afficher
      </h2>
      <p className="mt-1 max-w-sm text-sm text-stone-600">
        Vérifiez votre connexion, puis réessayez. Vos données ne sont pas
        perdues.
      </p>
      <Button className="mt-5" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
