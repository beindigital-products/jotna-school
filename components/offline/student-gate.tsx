"use client";

/**
 * QUI PEUT ENTRER DANS L'ESPACE ÉLÈVE, AVEC OU SANS RÉSEAU.
 *
 * Remplace `AccessGate` pour l'espace élève : la question n'est plus posée au
 * serveur à chaque écran, elle se lit sur l'appareil (`lib/offline/`).
 *
 *   - Hors de l'application iOS/Android, l'espace élève n'existe pas : un
 *     navigateur, même en développement, part sur `/eleve`, qui renvoie vers
 *     l'application. Les élèves n'apprennent que dans l'application.
 *   - L'appareil se relit : on attend.
 *   - Personne à rouvrir : sans réseau, on explique qu'il faut une première
 *     connexion ; avec le réseau mais sans session, on renvoie à la connexion.
 *   - Un adulte est connecté : l'espace élève ne lui est pas destiné.
 *   - L'accès de l'élève est fermé (école sans abonnement) : le message de
 *     `AccessGate`, aux mêmes mots.
 *   - L'accès était ouvert, mais l'appareil n'a pas vu le serveur depuis plus
 *     de trente jours (`OFFLINE_ACCESS_GRACE_MS`, `lib/offline/model.ts`) :
 *     il faut se reconnecter un moment. Sans cette borne, une école qui ne
 *     paie plus garderait ses élèves sans fin tant qu'ils restent hors ligne.
 *
 * DU CONFORT, PAS UNE SÉCURITÉ, comme `AccessGate` : le serveur garde ses
 * propres gardes, et ne sert le paquet qu'à un accès ouvert.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Sprout, WifiOff } from "lucide-react";
import { useOffline, useOfflineModel } from "@/components/offline/context";
import { JotnaLoader } from "@/components/jotna-loader";
import { Pio } from "@/components/student/pio";
import { useNativeAppOrUnknown } from "@/hooks/use-native-app";
import { STUDENT_APP_ONLY_PATH } from "@/lib/build-target";
import { kidMessages } from "@/lib/kidCopy";
import { accessMessageForAdult } from "@/lib/accessCopy";

export function StudentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const native = useNativeAppOrUnknown();
  const { status, connected, signedOut, confirmed } = useOffline();
  const model = useOfflineModel();

  const outsideApp = native === false;
  const mustLogIn = !outsideApp && status === "none" && connected && signedOut;
  useEffect(() => {
    if (outsideApp) router.replace(STUDENT_APP_ONLY_PATH);
    else if (mustLogIn) router.replace("/login");
  }, [outsideApp, mustLogIn, router]);

  if (native !== true || status === "booting" || mustLogIn) {
    return <JotnaLoader className="min-h-[60vh]" />;
  }

  if (status === "none") {
    if (!connected) {
      return (
        <GateCard icon={<WifiOff className="h-10 w-10 text-sky-600" aria-hidden />}>
          <h2 className="font-display text-xl font-extrabold text-slate-900">
            {kidMessages.offline.firstConnectionTitle}
          </h2>
          <p className="mt-2 text-base text-slate-600">{kidMessages.offline.firstConnectionBody}</p>
        </GateCard>
      );
    }
    const { title, body } = accessMessageForAdult("not_student");
    return (
      <GateCard icon={<ShieldAlert className="h-10 w-10 text-gray-400" aria-hidden />}>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
      </GateCard>
    );
  }

  const access = model?.access ?? null;
  if (access && !access.ok) {
    return (
      <GateCard icon={<Sprout className="h-12 w-12 text-emerald-500" aria-hidden />}>
        <p className="text-lg font-medium text-gray-900">{kidMessages.accessNotOpen}</p>
      </GateCard>
    );
  }

  // L'accès se vérifie au moins une fois par mois : un enfant qui joue tous
  // les jours sans réseau doit revoir le serveur de temps en temps.
  if (!confirmed && model?.accessNeedsCheck) {
    return (
      <GateCard icon={<WifiOff className="h-10 w-10 text-sky-600" aria-hidden />}>
        <h2 className="font-display text-xl font-extrabold text-slate-900">
          {kidMessages.offline.reconnectTitle}
        </h2>
        <p className="mt-2 text-base text-slate-600">{kidMessages.offline.reconnectBody}</p>
      </GateCard>
    );
  }

  return <>{children}</>;
}

function GateCard({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-amber-200 bg-white/95 p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex justify-center">
          <Pio state="think" size={110} />
        </div>
        <div className="mx-auto mb-2 flex justify-center">{icon}</div>
        {children}
      </div>
    </div>
  );
}
