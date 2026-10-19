// Types des faux contextes de base de données que les tests de ce dossier
// construisent à la main. Le double point du nom tient ce fichier hors du
// déploiement : la CLI Convex ignore les fichiers qui en ont plusieurs.

/** Une ligne d'une table simulée. */
export type Row = Record<string, unknown>;

/** Le `q` de `withIndex`, comme dans Convex : `q.eq(champ, valeur)`. */
export type IndexQuery = { eq: (field: string, value: unknown) => IndexQuery };
