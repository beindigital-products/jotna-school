"use client";

import { useSearchParams } from "next/navigation";

/**
 * Lit un identifiant Convex dans l'adresse (`?id=…`).
 *
 * Rend `null` quand il manque ou n'a pas la forme d'un identifiant. Passer une
 * chaîne vide à une requête Convex la fait lever, et la page entière tombait
 * sur l'écran d'erreur : l'appelant passe `"skip"` à la place et affiche un
 * message.
 */
export function useIdParam(name = "id"): string | null {
  const value = useSearchParams().get(name);
  if (!value || !/^[a-z0-9]{16,64}$/i.test(value)) return null;
  return value;
}
