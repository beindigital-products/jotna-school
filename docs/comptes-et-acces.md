# Comment on obtient un compte

Jotna se vend aux écoles. Personne ne s'inscrit de sa propre initiative, sur
aucune plateforme. Tout compte naît d'un provisionnement, et chacun des quatre
chemins fait son propre contrôle avant de créer quoi que ce soit.

## Les quatre chemins, et rien d'autre

| Rôle | Qui crée le compte | Ce qui autorise |
| --- | --- | --- |
| `directeur` | L'équipe Jotna, depuis la fiche de l'école | `callerIsAdmin` |
| `professeur` | L'équipe Jotna, depuis la fiche de l'école | `callerIsAdmin` |
| `student` | L'école, par import de sa liste d'élèves | Lien : le personnel n'importe que dans son école |
| `parent` | La famille, sur `/register` | Un code émis par l'école pour son enfant |
| `admin` | Personne | Se pose sur le déploiement, hors de l'application |

## Ce qui ferme l'inscription libre

`Password.profile()` dans `convex/auth.ts` refuse `flow: "signUp"`. Ce refus
est placé là, et pas dans `createOrUpdateUser`, pour une raison précise : ce
second rappel est commun à tous les chemins, y compris aux provisionnements
légitimes, qui passent par `createAccount`. Un refus posé là les fermerait
tous. `profile()` n'est appelé que par les flux du fournisseur `Password`
lui-même, jamais par `createAccount`.

Le refus lit `params.flow` plutôt que de lever sans condition : la même
fonction sert aussi la connexion et la réinitialisation de mot de passe.

## Comment chacun se connecte

**Un élève** saisit le code imprimé sur son billet, comme identifiant **et**
comme mot de passe. Un enfant de huit ans ne retient pas deux choses. Le champ
de connexion accepte donc du texte libre, pas seulement une adresse : avec
`type="email"`, le navigateur refusait la saisie avant même d'appeler le
serveur, et aucun élève ne pouvait entrer.

Un élève à code ne peut pas se dépanner seul, et c'est voulu : il n'a pas
d'adresse, donc « mot de passe oublié » ne mène nulle part. Un adulte de son
école réinitialise son code.

**Un parent** active son espace sur `/register` avec le code remis par l'école,
puis se connecte avec l'adresse et le mot de passe qu'il vient de choisir. Ce
code désigne un enfant, sert une fois et expire.

**Un directeur ou un professeur** reçoit son adresse et son mot de passe
initial de l'équipe Jotna, et le change ensuite par « mot de passe oublié ».

## Ouvrir une nouvelle école

1. Créer l'école dans `/admin/ecoles`.
2. Enregistrer son contrat, sans quoi ses élèves seront bloqués par le
   contrôle d'accès.
3. Sur la fiche de l'école, section Personnel, créer le compte du directeur.
4. Le directeur crée ses classes, puis importe sa liste d'élèves.
5. L'import produit un billet par élève : un code de connexion pour l'enfant,
   un code de rattachement pour sa famille.

Le formulaire « Rattacher » de la même section sert un autre cas : une
personne qui a **déjà** un compte, par exemple un professeur qui enseigne dans
deux établissements. Lui créer un second compte lui donnerait deux identités.

## Ce qui a été retiré

`profiles.createChildAccount` laissait n'importe quel compte authentifié
fabriquer un compte élève, à l'adresse et au mot de passe de son choix, puis
se déclarer son tuteur. C'était cohérent avec un produit où un parent
inscrivait ses enfants. Les élèves appartiennent maintenant à l'école, donc
cette action et l'écran `/parent/children/add` ont disparu ensemble.

## Faiblesse connue

`parentLink.signUpWithCode` est publique et non authentifiée : elle ne peut
pas l'être autrement, son appelant n'a pas encore de compte. Rien ne limite
son débit. Un code deviné donne donc un compte, là où il ne donnait qu'un
rattachement auparavant.

L'écart reste mesuré : l'espace de codes se compte en centaines de millions,
chaque code meurt à la première consommation et expire seul. La limitation de
débit se traite au niveau du déploiement, pas dans le code applicatif.

## Jeu de données de test

`convex/testSeedsSchool.ts` crée une école complète sur le déploiement de
développement : contrat actif, directeur, deux professeurs, deux classes et
huit élèves. Il refuse de s'exécuter si l'appelant ne nomme pas le déploiement
visé.

```bash
npx convex run testSeedsSchool:seedTestSchool '{"confirmDeployment":"<nom-du-deploiement>"}'
```

Il passe par le vrai pipeline d'import pour les élèves, plutôt que de recréer
des comptes à la main : un jeu de test qui contourne le chemin de production
ne teste que lui-même. Il rend tous les identifiants en sortie.
