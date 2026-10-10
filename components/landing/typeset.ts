/**
 * LA TYPOGRAPHIE FRANÇAISE DE LA VITRINE : des espaces INSÉCABLES, dans un module
 * sans dépendance, pour que la page d'accueil l'utilise sans embarquer le code
 * du serveur que `demo/playable.ts` importe.
 */
const NBSP = "\u00a0";

/** Les unités qui ne se séparent pas de leur nombre : « 60 km », « 8 h », « 500 F ». */
const UNITS = "km|m|cm|mm|dm|kg|g|L|dL|cL|mL|h|min|F|FCFA|%";

/**
 * LA TYPOGRAPHIE FRANÇAISE des textes de la banque : des espaces INSÉCABLES.
 *
 * Un nombre à plusieurs tranches (« 1 200 000 000 ») ne doit pas se couper en
 * deux sur la ligne d'un téléphone : l'enfant lirait « 1 200 000 », puis
 * « 000 » à la ligne. Il en va de même d'un nombre et de son unité (« 60 km »),
 * d'un guillemet français et de son mot, d'un point d'interrogation, d'un
 * point d'exclamation, d'un deux-points ou d'un point-virgule, qui ne doivent
 * jamais commencer une ligne.
 *
 * La banque s'écrit avec des espaces ordinaires (lisibles dans le code, et le
 * QCM retrouve sa bonne réponse par son texte) ; cette passe les remplace à
 * l'arrivée, PARTOUT À LA FOIS : la consigne, les propositions, les étiquettes
 * et les mots à trous restent identiques entre eux, la correction compare des
 * textes qui ont tous reçu le même traitement.
 */
export function typeset(text: string): string {
  return text
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(new RegExp(`(\\d) (?=(?:${UNITS})(?![\\p{L}\\d]))`, "gu"), `$1${NBSP}`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ ([»?!:;])/g, `${NBSP}$1`);
}
