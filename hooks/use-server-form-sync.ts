"use client";

import { useState } from "react";

/**
 * Recopie un document Convex dans l'état d'un formulaire, pendant le rendu.
 *
 * Remplace le `useEffect(() => { if (data) setNom(data.nom) }, [data])` que
 * plusieurs pages recopiaient : l'effet affichait un rendu de trop avec le
 * formulaire vide (règle `react-hooks/set-state-in-effect`).
 *
 * `apply` est appelé une fois par nouvelle valeur de `key(data)`, ce qui dit
 * quand le formulaire doit reprendre le serveur :
 * - une clé faite des valeurs affichées (`JSON.stringify([...])`) suit le
 *   serveur à chaque changement réel. Une nouvelle référence aux mêmes valeurs
 *   ne relance rien : comparer les objets ferait boucler le rendu, ou écraserait
 *   une saisie en cours dès qu'un autre champ du document change ;
 * - l'identifiant du document (`data._id`) remplit le formulaire une fois, puis
 *   de nouveau seulement si la page passe à un autre document.
 *
 * La clé déjà appliquée part de `undefined` : des données en cache dès le
 * premier rendu remplissent aussi le formulaire.
 */
export function useServerFormSync<T>(
  data: T | null | undefined,
  key: (data: T) => string,
  apply: (data: T) => void,
): void {
  const [appliedKey, setAppliedKey] = useState<string | undefined>(undefined);
  if (data) {
    const nextKey = key(data);
    if (nextKey !== appliedKey) {
      setAppliedKey(nextKey);
      apply(data);
    }
  }
}
