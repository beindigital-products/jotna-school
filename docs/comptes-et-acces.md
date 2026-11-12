# Comment on obtient un compte

Jotna School n'est pas encore lancé. Le site annonce « Lancement
prochainement », et **personne ne crée de compte de sa propre initiative sans
un code d'invitation** remis par l'équipe. Les autres chemins partent tous de
quelqu'un qui a déjà un compte, et chacun fait son propre contrôle avant de
créer quoi que ce soit.

## Avant le lancement : l'inscription se fait sur invitation

Demande du propriétaire, 12 novembre 2026.

**Ce que voit un visiteur.** Les boutons d'inscription sont toujours là. Sur la
page d'accueil et sur l'écran de connexion, ils ouvrent la pop-up « Lancement
prochainement » (`components/launch/signup-gate.tsx`) : le projet n'est pas
encore en ligne, il est en cours de lancement. La page `/register` affiche la
même annonce à qui y arrive par son adresse. Les deux proposent de saisir un
code d'invitation ; avec un code reconnu, le formulaire habituel s'ouvre.

**Ce que fait l'équipe.** L'écran `/admin/invitations` émet un code
(`JOTNA-7C4K-2MQX`) pour une personne ou pour un groupe, donne le lien qui le
porte (`/register/?code=…`, la personne n'a alors rien à taper), le désactive,
et montre qui s'en est servi.

**Ce qui ferme vraiment la porte.** Un écran se contourne : les fonctions
Convex sont une API publique. Le refus est donc au serveur, à deux endroits de
`convex/auth.ts`.

1. `Password.profile()` refuse `flow: "signUp"` quand aucun code n'est joint.
   Il ne lit pas la base : le fournisseur l'appelle sans l'attendre.
2. `createOrUpdateUser` consomme le code (`invitations.redeemInvitation`) dans
   la mutation qui crée le compte. Code inconnu, désactivé ou épuisé : la
   mutation lève, et Convex n'écrit rien, ni compte ni place comptée. Deux
   inscriptions simultanées sur la dernière place n'entrent pas toutes les
   deux.

`createOrUpdateUser` est commun à tous les chemins, provisionnements compris.
Il reconnaît une inscription publique au champ que `profile()` joint au profil
(`SELF_SIGNUP_INVITATION_FIELD`) : `profile()` n'est appelé que par les flux du
fournisseur `Password`, jamais par `createAccount`, donc un provisionnement ne
porte pas ce champ et ne demande pas de code.

Les règles (forme du code, motifs de refus, phrases) sont dans
`convex/invitationRules.ts`, pures et testées ; les fonctions dans
`convex/invitations.ts`.

**Sur un déploiement neuf**, il n'y a pas encore d'administrateur, donc
personne pour ouvrir la console. Une mutation interne émet un code depuis la
ligne de commande :

```bash
npx convex run invitations:issue '{"label":"Équipe Jotna","maxUses":1}'
```

**Le jour du lancement**, pour rouvrir l'inscription à tous :

- au serveur, retirer le contrôle du code dans `Password.profile()` et l'appel
  à `redeemInvitation` dans `createOrUpdateUser` (`convex/auth.ts`) ;
- sur le site, retirer `SignupGateProvider` de `app/page.tsx` et de
  `app/(auth)/layout.tsx` (les boutons redeviennent de simples liens), retirer
  l'étape du code dans `app/(auth)/register/page.tsx`, et reprendre les textes
  qui annoncent le lancement (`components/launch/launch-copy.ts`, la section
  « Commencer », la première question de la FAQ).

Les codes et leur historique peuvent rester en base : ils ne gênent rien.

## Qui crée quel compte

| Rôle | Qui crée le compte | Ce qui autorise |
| --- | --- | --- |
| `parent`, `professeur`, `directeur` | La personne, sur `/register` | Un code d'invitation, avant le lancement. Le rôle est filtré (`decideSelfSignupRole`) : jamais `student`, jamais `admin` |
| `parent` | La famille, sur `/register/code` | Un billet émis par l'école pour son enfant (`PIO-…`) |
| `student` | Un parent, un professeur ou un directeur connecté | `studentAccounts.creationRights` : son enfant, ou une de ses classes |
| `student` | L'école, par import de sa liste d'élèves | Lien : le personnel n'importe que dans son école |
| `directeur`, `professeur` | L'équipe Jotna, depuis la fiche de l'école | `callerIsAdmin` |
| `admin` | Personne | Se pose sur le déploiement, hors de l'application |

Seule la première ligne demande un code d'invitation. Le billet d'une école en
tient lieu pour une famille : il a été imprimé par une école déjà admise, pour
un enfant nommé.

## Comment chacun se connecte

**Un élève** saisit le code imprimé sur son billet, comme identifiant **et**
comme mot de passe. Un enfant de huit ans ne retient pas deux choses. Le champ
de connexion accepte donc du texte libre, pas seulement une adresse : avec
`type="email"`, le navigateur refusait la saisie avant même d'appeler le
serveur, et aucun élève ne pouvait entrer.

Un élève à code ne peut pas se dépanner seul, et c'est voulu : il n'a pas
d'adresse, donc « mot de passe oublié » ne mène nulle part. Un adulte de son
école réinitialise son code.

**Un parent, un professeur ou une école** qui s'est inscrit sur `/register` se
connecte avec l'adresse et le mot de passe qu'il a choisis.

**Un parent qui tient un billet de l'école** active son espace sur
`/register/code`, puis se connecte de la même façon. Ce code désigne un enfant,
sert une fois et expire.

**Un directeur ou un professeur créé par l'équipe Jotna** reçoit d'elle son
adresse et son mot de passe initial, et le change ensuite par « mot de passe
oublié ».

## Ouvrir une nouvelle école

Une école invitée s'inscrit elle-même sur `/register`, avec son code
d'invitation. L'équipe peut aussi l'ouvrir pour elle, depuis la console :

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

## Ce qui a été retiré, et ce qui l'a remplacé

`profiles.createChildAccount` laissait n'importe quel compte authentifié
fabriquer un compte élève, à l'adresse et au mot de passe de son choix, puis
se déclarer son tuteur. Cette action et l'écran `/parent/children/add` ont
disparu ensemble.

`studentAccounts.createStudent` la remplace, avec une garde de LIEN
(`creationRights`) : un parent ne crée que le compte de son enfant, un
professeur ou un directeur que dans une de ses classes. Le compte n'a ni
adresse ni mot de passe choisi : son identifiant et son mot de passe sont le
code de connexion engendré pour l'enfant.

## Faiblesse connue

`parentLink.signUpWithCode` est publique et non authentifiée : elle ne peut
pas l'être autrement, son appelant n'a pas encore de compte. Rien ne limite
son débit. Un code deviné donne donc un compte, là où il ne donnait qu'un
rattachement auparavant.

L'écart reste mesuré : l'espace de codes se compte en centaines de millions,
chaque code meurt à la première consommation et expire seul. La limitation de
débit se traite au niveau du déploiement, pas dans le code applicatif.

`invitations.check` est dans le même cas : la pop-up l'appelle sans session,
pour dire tout de suite si un code d'invitation est bon. Les codes d'invitation
ont donc huit symboles tirés au sort et non six (209 milliards de valeurs,
`invitationRules.buildInvitationCode`), et un code compromis se désactive
depuis `/admin/invitations`.

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
