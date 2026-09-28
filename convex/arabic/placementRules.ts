/**
 * QUI PEUT PLACER UN ÉLÈVE dans le module d'arabe — la décision, séparée de
 * sa collecte.
 *
 * FONCTION PURE, SANS AUCUN IMPORT, comme `roleRules.ts` et `linkRules.ts` :
 * le dépôt n'a pas `convex-test`, donc une garde écrite à l'intérieur d'un
 * `mutation` n'est vérifiable par aucun test. Séparer les FAITS (qui appelle,
 * quel lien a-t-il avec cet élève) de la DÉCISION rend celle-ci testable ligne
 * à ligne, et laisse au code Convex la seule chose qu'il sait faire : lire la
 * base.
 *
 * TROIS PORTES, ET ELLES NE SE RESSEMBLENT PAS :
 *
 *   - l'`admin` traverse, comme partout dans ce dépôt ;
 *   - le `directeur` place dans l'école où il est RATTACHÉ en personnel actif.
 *     C'est la même garde que l'allumage du module : décider qu'une école
 *     enseigne l'arabe et décider où en sont ses élèves relèvent de la même
 *     autorité ;
 *   - le `professeur` place LES ÉLÈVES QU'IL ENSEIGNE, et eux seuls. C'est lui
 *     qui les voit tous les jours et qui sait lire leur niveau — mais ses
 *     élèves, pas ceux de l'école d'à côté ni ceux de son collègue.
 *
 * LE LIEN DU PROFESSEUR EST `schoolClasses.teacherId`, PAS `schoolStaff`, et
 * ce n'est pas un détail : c'est l'arête que tout le dépôt utilise déjà
 * (`access.studentIdsTaughtBy`, quatrième branche de
 * `access.callerMayReadStudent`), et `schools.removeStaff` désaffecte les
 * classes en même temps qu'il retire le membre, précisément pour que retirer
 * quelqu'un coupe vraiment son accès. Poser ici une garde sur `schoolStaff`
 * ferait diverger le placement du reste : un professeur verrait un élève en
 * liste pour se faire refuser son placement, ou l'inverse.
 *
 * DEUX REFUS QU'IL FAUT DIRE À VOIX HAUTE, parce qu'ils ne tombent pas d'une
 * inattention :
 *
 *   - L'ÉLÈVE NE SE PLACE PAS LUI-MÊME. Un enfant qui se déclare « confirmé »
 *     saute sept leçons d'alphabet et se retrouve devant Al-Fātiḥa sans savoir
 *     lire — il n'aurait pas triché, il se serait puni. Son rôle tombe dans le
 *     refus final, et ce commentaire est là pour qu'on ne l'en sorte pas par
 *     mégarde ;
 *   - LE PARENT NON PLUS, même celui qui porte un lien `studentGuardians` et
 *     peut lire tous les bilans de son enfant. Placer, c'est décider d'un
 *     parcours scolaire à l'intérieur d'une école : cela appartient à l'école.
 *     Un parent qui juge son enfant mal placé en parle au maître, et c'est le
 *     maître qui corrige — ce qu'il peut désormais faire lui-même.
 *
 * ELLE NE DIT RIEN DU MODULE. Que l'école ait allumé « Arabe & Coran » est une
 * autre question, posée ailleurs (`modules.moduleAccessForProfile`) : celle-ci
 * répond « cette personne a-t-elle autorité sur cet élève ? », et une garde
 * qui répondrait à deux questions finirait par mal répondre aux deux.
 */

/** Le rôle de l'appelant, tel que `profiles.role` le porte. */
export type PlacementRole =
  | "admin"
  | "directeur"
  | "professeur"
  | "parent"
  | "student";

/** Les faits que le code Convex va chercher en base avant de décider. */
export interface PlacementClaim {
  role: PlacementRole;
  /**
   * L'appelant est-il rattaché à l'école visée en `schoolStaff` ACTIF ?
   * Ne concerne que le directeur — voir l'en-tête.
   */
  staffOfSchool: boolean;
  /**
   * L'appelant enseigne-t-il une classe DE CETTE ÉCOLE où l'élève est inscrit
   * en « active » ? Ne concerne que le professeur.
   */
  teachesStudent: boolean;
}

/** Cette personne peut-elle placer cet élève dans cette école ? */
export function mayPlaceStudent(claim: PlacementClaim): boolean {
  switch (claim.role) {
    case "admin":
      return true;
    case "directeur":
      return claim.staffOfSchool;
    case "professeur":
      return claim.teachesStudent;
    // `parent` et `student` : voir les deux refus de l'en-tête.
    default:
      return false;
  }
}
