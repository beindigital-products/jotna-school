/**
 * Accès libre — règles pures, sans aucun import Convex.
 *
 * Même découpage que `roleRules`, `importCodes` et `accessRules` : vitest
 * tourne en `jsdom` et ce dépôt n'utilise pas `convex-test`, donc ce qui
 * décide vit ici, testé, et les enveloppes Convex (`classrooms.ts`,
 * `family.ts`, `schoolSpace.ts`, `studentAccounts.ts`) lisent et écrivent.
 *
 * LE MODÈLE, EN UNE PHRASE PAR RÔLE :
 *
 * - une ÉCOLE (rôle `directeur`) crée son compte, puis son école ; elle
 *   partage un CODE ÉCOLE avec ses professeurs ;
 * - un PROFESSEUR crée son compte et ses classes, seul ou dans une école
 *   (code école) ; il crée des comptes élèves ou ajoute un enfant existant
 *   avec le CODE ÉLÈVE que lui donne la famille ;
 * - un PARENT crée son compte puis celui de ses enfants ; il lit le code
 *   élève de chaque enfant et le transmet au professeur ;
 * - un ÉLÈVE ne s'inscrit jamais : son compte est créé par un adulte, et il
 *   entre dans l'application avec un code de connexion.
 */

/** Les rôles qu'un formulaire public peut créer. Jamais `student`, jamais `admin`. */
export const SELF_SIGNUP_ROLES = ["parent", "professeur", "directeur"] as const;

export type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

/**
 * Le rôle demandé par le formulaire d'inscription, ou `null` s'il est refusé.
 *
 * L'ÉLÈVE EST REFUSÉ ICI, et c'est le cœur du modèle : un enfant n'a pas
 * d'adresse de courriel, et son compte doit toujours être rattaché à un
 * adulte (parent ou professeur) qui l'a créé. `admin` est refusé pour la
 * raison de toujours : aucun chemin applicatif ne le pose.
 *
 * Pas de repli silencieux sur `parent` : un formulaire mal formé qui
 * créerait un compte du mauvais type ne se rattraperait qu'à la main.
 */
export function decideSelfSignupRole(raw: unknown): SelfSignupRole | null {
  if (typeof raw !== "string") return null;
  return (SELF_SIGNUP_ROLES as readonly string[]).includes(raw)
    ? (raw as SelfSignupRole)
    : null;
}

/**
 * Alphabet des codes partagés entre adultes — le même que les codes parent de
 * l'import (`importCodes.buildParentCode`) : sans `0 O 1 I L 5 S 2 Z`, les
 * paires qu'une photocopie ou un message recopié confondent.
 */
const SHARE_CODE_ALPHABET = "34679ABCDEFGHJKMNPQRTUVWXY";

type RandomInt = (minInclusive: number, maxInclusive: number) => number;

function shareCode(prefix: string, randomInt: RandomInt): string {
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += SHARE_CODE_ALPHABET[randomInt(0, SHARE_CODE_ALPHABET.length - 1)];
  }
  return `${prefix}-${body}`;
}

/**
 * Le CODE ÉLÈVE — forme `ELV-7C4K2M`. La famille le donne au professeur, qui
 * le saisit pour ajouter l'enfant à sa classe.
 *
 * CE N'EST PAS LE CODE DE CONNEXION. Le code de connexion est aussi le mot de
 * passe de l'enfant : le partager avec un adulte de plus, c'est lui donner le
 * compte. Le code élève, lui, ne permet qu'une chose — inscrire l'enfant dans
 * une classe — et il se régénère.
 */
export function buildStudentShareCode(randomInt: RandomInt): string {
  return shareCode("ELV", randomInt);
}

/** Le CODE ÉCOLE — forme `ECO-7C4K2M`. Un professeur le saisit pour rejoindre l'école. */
export function buildSchoolJoinCode(randomInt: RandomInt): string {
  return shareCode("ECO", randomInt);
}

/**
 * Le code de connexion d'un élève créé par un parent ou un professeur —
 * forme `AWA-4821`.
 *
 * LE PRÉFIXE EST LE PRÉNOM, ET PLUS LA CLASSE. L'import d'une école préfixe
 * par la classe (`CM1A-4821`) parce que tous ses codes vivent dans une seule
 * école. Avec l'inscription libre, des milliers de professeurs auront un
 * « CM1 A », et les 9 000 valeurs de ce préfixe seraient partagées par toute
 * la plateforme. Le prénom se répartit beaucoup mieux, et un enfant le
 * reconnaît sur son billet.
 *
 * Le prénom perd ses accents et tout ce qui n'est pas une lettre, et se coupe
 * à six lettres. Sans lettre exploitable, le préfixe devient `ELEVE`.
 *
 * `digits` vaut 4 par défaut ; l'appelant passe à 6 quand les essais à quatre
 * chiffres sont épuisés, ce qui n'arrive que pour un prénom très porté.
 */
export function buildChildLoginCode(
  name: string,
  randomInt: RandomInt,
  digits: 4 | 6 = 4,
): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? "";
  const letters = firstWord
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const prefix = letters.length > 0 ? letters : "ELEVE";
  const min = digits === 4 ? 1000 : 100000;
  const max = digits === 4 ? 9999 : 999999;
  return `${prefix}-${randomInt(min, max)}`;
}

/**
 * Le code de connexion lisible d'un compte élève, à partir de `users.email`.
 *
 * Un compte élève n'a pas d'adresse : son `users.email` EST son code de
 * connexion, en minuscules (`importCodes.normalizeCode`). Le billet affiche
 * les majuscules, et c'est aussi la forme exacte du mot de passe initial.
 * Une vraie adresse (avec `@`) n'est pas un code : on ne l'affiche pas.
 */
export function printableLoginCode(email: string | undefined): string | null {
  if (!email || email.includes("@")) return null;
  return email.toUpperCase();
}

/** Longueur maximale d'un nom de personne ou d'école saisi dans un formulaire. */
export const NAME_MAX = 80;

/**
 * Nettoie un nom saisi : espaces réduits, bornes vérifiées. Rend `null` si le
 * nom est vide ou trop long, pour que l'appelant lève avec sa propre phrase.
 */
export function cleanName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length === 0 || name.length > NAME_MAX) return null;
  return name;
}

/**
 * Le libellé d'une classe : « A », « B », « Les lions »… Vide devient « A »,
 * pour qu'un professeur qui n'a qu'une classe par niveau n'ait rien à
 * inventer.
 */
export function cleanClassLabel(raw: string): string | null {
  const label = raw.replace(/\s+/g, " ").trim();
  if (label.length === 0) return "A";
  if (label.length > 30) return null;
  return label;
}
