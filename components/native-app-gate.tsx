"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

/** Rien à écouter : la plateforme ne change pas en cours de vie de la page. */
const noSubscribe = () => () => {};

/**
 * L'APPLICATION MOBILE N'A PAS DE VITRINE — elle ouvre sur la connexion.
 *
 * Jotna se vend aux écoles : la page d'accueil marchande s'adresse à un
 * prospect sur le web, jamais à un élève qui ouvre l'application.
 *
 * POURQUOI UNE REDIRECTION CLIENT, ET PAS UN FICHIER D'ENTRÉE REMPLACÉ.
 * Capacitor sert la MÊME racine `index.html` pour tout chemin sans extension
 * — c'est écrit noir sur blanc dans `CapacitorRouter.route(for:)`
 * (`node_modules/@capacitor/ios/Capacitor/Capacitor/Router.swift`) :
 *
 *     if pathUrl.pathExtension.isEmpty { return basePath + "/index.html" }
 *
 * L'application est donc servie comme une SPA : une navigation DE DOCUMENT
 * vers `/login/` recharge la racine, quoi qu'on y mette. Y placer une page de
 * redirection vers `/login/` boucle à l'infini, ce qui s'est produit —
 * plusieurs milliers de requêtes et un écran blanc.
 *
 * `router.replace` NE TRAVERSE PAS CE ROUTEUR : c'est une navigation interne
 * de Next, qui change l'URL et l'arbre rendu sans redemander de document. Elle
 * est donc le seul chemin qui fonctionne ici.
 *
 * `useSyncExternalStore` PLUTÔT QU'UN ÉTAT POSÉ DANS UN EFFET. La plateforme
 * n'est connue que du client ; la lire pendant le rendu désynchroniserait
 * l'hydratation, et la poser par `setState` dans un effet déclenche un second
 * rendu en cascade (`react-hooks/set-state-in-effect`). Ce hook existe pour ce
 * cas exact : l'instantané SERVEUR vaut `false`, donc le HTML pré-rendu reste
 * la vitrine et le web est strictement inchangé ; l'instantané CLIENT dit la
 * vérité, et React reprend le rendu après hydratation.
 */
export function NativeAppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const isNative = useSyncExternalStore(
    noSubscribe,
    () => Capacitor.isNativePlatform(),
    () => false,
  );

  // VERS `/post-auth`, PAS `/login` : un enfant qui rouvre l'application avec
  // une session encore valide doit retrouver son camp, pas retaper son code.
  // `post-auth` fait déjà le tri — sans session, il renvoie sur `/login`.
  useEffect(() => {
    if (isNative) router.replace("/post-auth");
  }, [isNative, router]);

  // Une fois la plateforme reconnue, on cesse de peindre la vitrine : sans
  // cela elle resterait affichée pendant toute la navigation.
  if (isNative) return null;

  return <>{children}</>;
}
