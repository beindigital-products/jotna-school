/**
 * UNE TUILE SE SUIT PAR SA POSITION, UNE RÉPONSE S'ENVOIE PAR SES VALEURS.
 *
 * Deux tuiles peuvent porter le même texte : « a » deux fois quand on relie
 * mangue et yassa à leur son, « n » deux fois dans les lettres de « banane ».
 * Les écrans suivaient chaque tuile par son texte : relier un « a » colorait
 * les deux, et le second mot ne pouvait plus être relié à rien. Ici, une tuile
 * est son INDICE dans la liste ; le texte ne sert qu'à l'affichage et à la
 * réponse envoyée, que le serveur compare en multi-ensemble
 * (`convex/paliers/answerCheck.ts`).
 *
 * Fonctions pures : les écrans (`components/exercises/*Exercise.tsx`) gardent
 * l'état, ces fonctions le transforment et le traduisent.
 */

/** Un lien d'appariement : la tuile de gauche n° `left` reliée à celle de droite n° `right`. */
export type MatchLink = { left: number; right: number };

/**
 * Relie deux tuiles. Chacune ne porte qu'un lien : on défait d'abord ceux
 * qu'elles avaient, puis on ajoute le nouveau à la fin (sa couleur suit son
 * rang dans la liste).
 */
export function linkTiles(
  links: readonly MatchLink[],
  left: number,
  right: number,
): MatchLink[] {
  return [
    ...links.filter((link) => link.left !== left && link.right !== right),
    { left, right },
  ];
}

/** Défait le lien de la tuile de gauche n° `left`, s'il existe. */
export function unlinkLeft(links: readonly MatchLink[], left: number): MatchLink[] {
  return links.filter((link) => link.left !== left);
}

/** La réponse d'appariement attendue par le serveur : `[{ left, right }, …]`. */
export function matchAnswer(
  left: readonly string[],
  right: readonly string[],
  links: readonly MatchLink[],
): string {
  return JSON.stringify(
    links.map((link) => ({ left: left[link.left], right: right[link.right] })),
  );
}

/**
 * La réponse de glisser-déposer : `zones[i]` est la zone de l'étiquette
 * `texts[i]` (ou `null`, pas encore posée — on ne l'envoie pas).
 *
 * L'OBJET `{ étiquette: zone }` TANT QU'IL SUFFIT : c'est la forme que tout
 * serveur déployé comprend. Il ne sait pas dire deux copies d'une même
 * étiquette posées dans deux zones différentes ; dans ce cas seulement, on
 * envoie une entrée par tuile, `[{ text, zone }, …]`. Un serveur plus ancien
 * lit ce tableau comme une réponse fausse, ce qu'elle est presque toujours
 * (deux copies d'une même étiquette vont d'ordinaire au même endroit).
 */
export function dragDropAnswer(
  texts: readonly string[],
  zones: readonly (string | null)[],
): string {
  // Sans prototype : une étiquette « constructor » reste une étiquette.
  const zoneOf = Object.create(null) as Record<string, string>;
  let scattered = false;
  texts.forEach((text, index) => {
    const zone = zones[index];
    if (!zone) return;
    if (Object.prototype.hasOwnProperty.call(zoneOf, text) && zoneOf[text] !== zone) {
      scattered = true;
    }
    zoneOf[text] = zone;
  });

  if (!scattered) return JSON.stringify(zoneOf);
  return JSON.stringify(
    texts.flatMap((text, index) => {
      const zone = zones[index];
      return zone ? [{ text, zone }] : [];
    }),
  );
}
