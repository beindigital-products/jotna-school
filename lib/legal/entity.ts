/**
 * QUI ÉDITE JOTNA — les seules informations que le code ne peut pas connaître.
 *
 * Les mentions légales doivent nommer l'éditeur : raison sociale, forme,
 * capital, siège, numéros d'immatriculation, directeur de la publication,
 * hébergeur. Le dépôt n'en contient aucune, et en inventer une dans un texte
 * légal serait pire que de laisser un trou. Chaque champ vaut donc `PENDING`
 * tant que le propriétaire ne l'a pas rempli, et la page l'affiche surligné
 * (`isPending`), de sorte qu'un champ oublié se voit avant la mise en ligne.
 *
 * `lib/legal/__tests__/docs.test.ts` liste les champs encore vides : il ne
 * casse pas la suite, il les nomme.
 */

export const PENDING = "[à renseigner]";

export const CONTACT_EMAIL = "contact@jotnaschool.com";

/** Date de la dernière révision des textes, écrite en toutes lettres. */
export const LEGAL_UPDATED = "22 octobre 2026";

export const LEGAL_ENTITY = {
  /** Raison sociale exacte, telle qu'au registre du commerce. */
  name: PENDING,
  /** Forme juridique : SARL, SAS, SUARL… */
  form: PENDING,
  capital: PENDING,
  /** Adresse du siège social. */
  address: PENDING,
  /** Numéro RCCM. */
  rccm: PENDING,
  /** Identifiant fiscal sénégalais. */
  ninea: PENDING,
  /** Personne physique qui répond du contenu publié. */
  publicationDirector: PENDING,
  /** Hébergeur du site web (celui qui sert les pages). */
  siteHost: PENDING,
} as const;

export function isPending(value: string): boolean {
  return value === PENDING;
}

/** Les champs de l'éditeur qui attendent encore une valeur. */
export function pendingEntityFields(): string[] {
  return Object.entries(LEGAL_ENTITY)
    .filter(([, value]) => isPending(value))
    .map(([key]) => key);
}
