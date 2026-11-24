# Console du super admin

La console (`/admin/*`, rôle `admin` seul) sert à piloter toute la plateforme,
sauf le contenu éditorial.

## Pages

| Page | Ce qu'elle montre | Fonctions Convex |
|---|---|---|
| `/admin/dashboard` | Ce qui est à traiter, les indicateurs d'une période et leur variation, les entonnoirs, qui joue, l'argent, la fidélisation, les derniers événements, les totaux | `adminPulse.todo`, `pulse`, `funnel`, `engagement`, `feed`, `adminConsole.overview`, `retention` |
| `/admin/revenus` | Contrats d'école (payé, total, retard), échéances, versements | `adminConsole.revenue` |
| `/admin/fidelisation` | Abonnés, clients à risque, clients partis, accès gratuits qui finissent, taux de renouvellement par année scolaire | `adminConsole.retention` |
| `/admin/coupons` | Création, désactivation et utilisations des coupons | `coupons.create`, `list`, `setRevoked`, `listRedemptions` |
| `/admin/comptes` | Tous les comptes, par rôle, avec recherche | `adminConsole.listAccounts` |
| `/admin/devis` | Les demandes de devis des écoles et leur suivi (à traiter, contactée, gagnée, perdue, note) | `adminConsole.listQuoteRequests`, `setQuoteStatus` |
| `/admin/settings` | Le compte de l'administrateur connecté | `profiles.updateProfile` |

Les pages déjà là (écoles, élèves, invitations, liste d'attente, AI Gateway)
sont rangées dans le même menu.

Le contenu (matières, manuels PDF, badges, exercices) est sorti du menu et du
tableau de bord le 24 novembre 2026, à la demande du propriétaire, le temps de
décider comment la console le présentera. Ses pages existent toujours, par
leur adresse (`/admin/subjects`, `/admin/pdf-uploads`, `/admin/badges`).

Règles communes à toute la console :

- une liste montre 40 lignes par page (`usePagination` et `Pagination`, dans
  `components/dashboard/ui.tsx`) ;
- un numéro de téléphone se saisit avec `PhoneField` (liste des indicatifs,
  Sénégal par défaut) ;
- une date se choisit avec `DateField` (le calendrier shadcn), jamais avec le
  champ date du navigateur.

Comptes, fidélisation et devis s'exportent en CSV (point-virgule, lisible
dans Excel).

## Le tableau de bord, bloc par bloc

L'écran suit l'ordre des questions de qui pilote la plateforme. Chaque bloc a
sa requête et se charge seul.

1. **À traiter** (`adminPulse.todo`) : échéances en retard, contrats non
   payés, contrats qui finissent dans 60 jours, devis sans réponse, écoles
   prospects, budget IA au-delà de 80 %, accès gratuits
   qui finissent dans 14 jours. Le plus urgent d'abord ; « Rien à traiter »
   quand la liste est vide.
2. **La période** (`pulse`, 7, 30 ou 90 jours) : nouveaux comptes, élèves
   actifs, séances jouées, argent encaissé, chacun comparé à la période
   d'avant de même durée. Une séance est une ligne `palierAttempts` ; un élève
   est actif s'il a ouvert au moins une séance.
3. **Où l'on perd du monde** (`funnel`) : trois entonnoirs. Adultes : places
   d'invitation, comptes créés, comptes qui servent (le parent a un enfant, le
   professeur une classe, l'école son école). Élèves : comptes, ont joué une
   fois, actifs sur 30 jours, actifs sur 7 jours. Écoles : devis, écoles
   créées, contrat signé, contrat payé.
4. **Qui joue** (`engagement`) : élèves actifs par niveau avec la part de
   séances réussies, écoles les plus actives, et écoles silencieuses (des
   élèves inscrits, aucune séance sur la période).
5. **Argent et fidélisation** : revenus par mois, et le résumé de
   `/admin/fidelisation`.
6. **La plateforme aujourd'hui** : totaux des comptes, écoles et contrats,
   budget IA, invitations, coupons, cauris.
7. **Derniers événements** (`feed`) : inscriptions d'adultes, devis, coupons
   utilisés, versements, écoles créées.

## Créer le premier admin

Aucun formulaire ne donne le rôle `admin`. Sur un déploiement neuf :

1. créer un compte par l'inscription habituelle, avec un code d'invitation :
   `npx convex run invitations:issue '{"label":"Équipe","maxUses":1}'` ;
2. lui donner le rôle :
   `npx convex run profiles:promoteToAdmin '{"email":"prenom@exemple.sn"}'`.

## Coupons

Un coupon vise les parents, les professeurs, les écoles (comptes `directeur`)
ou tout le monde. Il donne un accès gratuit pendant N jours, une remise en
pourcentage ou une remise en FCFA. Le code est tiré au sort (`PROMO-XXXX-XXXX`)
ou choisi par l'équipe. Chaque compte l'utilise une fois, depuis la carte
« Code promo » de ses paramètres.

Ce que le coupon fait aujourd'hui : tant que `accessRules.FREE_ACCESS` vaut
`true`, tout est gratuit et il n'existe pas de paiement famille ou professeur.
L'utilisation est enregistrée dans `couponRedemptions`, avec l'avantage copié,
la fin de l'accès gratuit (`accessUntil`) et un champ `appliedAt` vide. Les
futurs paiements devront lire cette table : ouvrir l'accès jusqu'à
`accessUntil`, déduire la remise, puis poser `appliedAt`.

Règles pures et testées : `convex/couponRules.ts`.

## Fidélisation

Chaque client qui a signé un contrat (une école aujourd'hui, une famille ou
un professeur demain) reçoit un état, calculé par
`convex/retentionRules.ts` :

- **abonné** : un contrat court ;
- **à risque** : paiement en retard, ou contrat qui finit dans moins de
  60 jours sans contrat suivant ;
- **parti** : il a été abonné, son dernier contrat est fini, et aucun autre
  n'est prévu ;
- **signé, pas payé** : il n'a que des contrats en attente de paiement.

L'année scolaire commence le 1er septembre. Le taux de renouvellement d'une
année compte les clients abonnés cette année-là qui le sont aussi l'année
suivante. L'année en cours n'a pas encore de taux.

La page garde le contact de chaque client, ses années d'abonnement, ses
places, le montant signé et, pour une école, ses élèves encore inscrits.
L'onglet « Accès gratuits » liste les comptes dont l'accès offert par coupon
finit dans les 14 jours, ou a fini.

Rien n'est effacé quand un client part : les contrats restent dans
`subscriptions`, et c'est d'eux que la page tire l'historique.

## Limites connues

- Les chiffres sont des comptages bornés : chaque table est lue par un paquet
  de taille fixe, et l'écran affiche « 1 000+ » quand la borne est atteinte.
  Quand une borne sera atteinte pour de bon, il faudra un compteur dénormalisé
  tenu par les mutations, pas une borne plus haute.
- Les revenus ne couvrent que les contrats d'école. Les abonnements des
  familles et des professeurs, et les paiements Bictorys en ligne, restent à
  brancher.
- La table `exerciseReports` existe au schéma, mais rien n'y écrit : un élève
  ne peut pas encore signaler un exercice. Le tableau de bord ne l'affiche
  donc pas.
- Les écrans plus anciens de la console (écoles, élèves, invitations, liste
  d'attente, matières, badges) n'utilisent pas encore le kit
  `components/dashboard/ui.tsx`.
