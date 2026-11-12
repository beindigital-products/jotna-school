import type { RegisterParams } from "@/lib/auth";

/** Les types de compte qu'un adulte peut créer : parent, professeur, école. */
export type SignupRole = RegisterParams["role"];

export function isSignupRole(value: string | null): value is SignupRole {
  return value === "parent" || value === "professeur" || value === "directeur";
}

/**
 * Le chemin de la page d'inscription, avec ce qu'on sait déjà de la personne.
 *
 * `code` est son code d'invitation : tant que le lancement n'est pas fait,
 * `/register` n'ouvre son formulaire que sur un code valide, lu dans cette
 * adresse. C'est aussi le lien que l'équipe copie depuis `/admin/invitations`
 * pour l'envoyer à une personne invitée. `role` présélectionne le type de
 * compte, pour les boutons de la page d'accueil.
 */
export function registerPath(
  options: { code?: string; role?: SignupRole | null } = {},
): string {
  const query = new URLSearchParams();
  if (options.code) query.set("code", options.code);
  if (options.role) query.set("role", options.role);
  const search = query.toString();
  return search ? `/register?${search}` : "/register";
}

/**
 * Le lien d'invitation complet, à envoyer tel quel à la personne invitée :
 * elle arrive sur le formulaire, code déjà reconnu, sans rien avoir à taper.
 *
 * AVEC LA BARRE FINALE (`/register/?code=…`). Le site est un export statique
 * réglé sur `trailingSlash` (`next.config.ts`) : la page est le fichier
 * `register/index.html`. Sans la barre, c'est à l'hébergeur de rediriger, et
 * un lien collé dans une messagerie ne doit pas dépendre de ce qu'il fait des
 * paramètres en chemin.
 */
export function invitationLink(origin: string, code: string): string {
  return `${origin}/register/?${new URLSearchParams({ code })}`;
}
