/**
 * Le rôle qu'un PROVISIONNEMENT peut poser, et lui seul.
 *
 * Fonction pure, sans aucun import : c'est ce qui la rend testable, le dépôt
 * n'ayant pas `convex-test` et vitest tournant en `jsdom`. `convex/auth.ts`
 * l'appelle depuis `createOrUpdateUser`, qui n'est pas atteignable par un test.
 *
 * ELLE NE GARDE PLUS UNE INSCRIPTION, PARCE QU'IL N'Y EN A PLUS. Jotna est
 * vendu aux écoles : `Password.profile()` refuse `flow: "signUp"`, donc aucun
 * formulaire public ne crée de compte. Les seuls appelants restants de
 * `createOrUpdateUser` sont les trois chemins de provisionnement, qui passent
 * tous par `createAccount` APRÈS leur propre contrôle :
 *
 *   - `studentImportRun`        — l'école importe ses élèves    → `student`
 *   - `parentLink.signUpWithCode` — un code émis pour un enfant → `parent`
 *   - `schools.provisionStaffAccount` — un admin plateforme     → `professeur`, `directeur`
 *
 * L'AUTORISATION A DONC REMONTÉ D'UN CRAN, et c'est ce qui permet d'élargir
 * la liste. Tant que l'inscription était ouverte, interdire ici `professeur`
 * et `directeur` était la dernière barrière : n'importe qui postait le rôle
 * qu'il voulait. Maintenant que le seul chemin vers ces deux rôles exige
 * `callerIsAdmin`, la barrière est structurelle et se vérifie à l'appel, pas
 * sur une chaîne de caractères arrivée du réseau.
 *
 * `admin` RESTE REFUSÉ, LUI. Aucun chemin applicatif ne le pose, pas même
 * gardé par un admin : un administrateur qui en fabrique un autre transforme
 * une compromission de compte en compromission de plateforme. Ce rôle se pose
 * hors de l'application, sur le déploiement.
 *
 * ELLE LÈVE PLUTÔT QUE DE RETOMBER SUR UN REPLI. Le code d'origine ramenait
 * tout rôle inconnu à `student` : demander un compte professeur donnait
 * silencieusement un compte élève, et la personne ne l'apprenait que bien plus
 * tard. Seule l'ABSENCE de rôle retombe sur `student` — c'est un appelant qui
 * n'a rien précisé, pas une demande refusée.
 */
export type ProvisionableRole =
  | "parent"
  | "student"
  | "professeur"
  | "directeur";

const PROVISIONABLE: readonly string[] = [
  "parent",
  "student",
  "professeur",
  "directeur",
];

export function decideProvisionedRole(
  rawRole: string | undefined,
): ProvisionableRole {
  if (rawRole === undefined) return "student";
  if (!PROVISIONABLE.includes(rawRole)) {
    throw new Error("Rôle non autorisé");
  }
  return rawRole as ProvisionableRole;
}
