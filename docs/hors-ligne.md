# Hors ligne : l'application joue sans réseau

L'espace élève de l'application iOS et Android marche sans connexion. Un
enfant qui s'est connecté une fois sur la tablette ou le téléphone retrouve
son camp en mode avion. Il y fait ses paliers et ses leçons d'arabe, entend
Pio, gagne ses étoiles. Le réseau ne sert plus qu'à remplir l'appareil et à
envoyer ce que l'enfant a fait.

Le web n'est pas concerné. Depuis le 9 octobre 2026, l'espace élève y est
ouvert, mais il lit Convex comme avant : le moteur décrit ici ne se charge
que dans la coque native iOS/Android. Dans un navigateur, rien ne se
télécharge pour jouer sans réseau, et rien ne s'écrit sur l'appareil.

## Ce que l'enfant fait sans réseau

- Ouvrir l'application et arriver au camp, sans attendre le serveur.
- Parcourir la carte, les matières et le sentier.
- Jouer tous les paliers de sa classe : réponses vérifiées, indices, essais,
  étoiles, palier validé ou manqué.
- Voir avancer son niveau, ses missions du jour, sa série et ses trophées.
- Entendre Pio lire les consignes (CI, CP) et toutes les voix du module
  Arabe & Coran.
- Suivre les leçons d'arabe et l'alphabet.
- Couper ou remettre les sons.

## Ce qui demande le réseau

| Besoin | Sans réseau |
| --- | --- |
| Première connexion de l'enfant sur l'appareil | L'écran de connexion prévient qu'il faut du réseau. |
| Nouvelle chance avec des exercices variés par l'IA | L'enfant rejoue le palier. |
| « Je veux comprendre » sans explication déjà calculée | L'écran montre la bonne réponse et les indices. |
| Vérification de la prononciation en arabe | L'enfant s'enregistre, s'écoute, puis écoute Pio. Pas de note, et sa voix n'est gardée nulle part. |
| Mémorisation des sourates (niveau 6) | Elle n'avance qu'en ligne. |
| Changer son prénom ou sa photo | Un message demande d'attendre le réseau. |

Après trente jours sans aucun contact avec le serveur
(`OFFLINE_ACCESS_GRACE_MS`), l'application demande de se reconnecter avant de
continuer. C'est le seul moyen de savoir que l'accès de l'école est toujours
ouvert.

## Comment ça marche

### Le sac de l'appareil

Quand le réseau est là, l'application remplit l'appareil
(`components/offline/native-offline-provider.tsx`, `lib/offline/sync.ts`) :

- l'état de l'enfant (`offline/pack:snapshot`) : profil, progression, essais,
  missions, série, trophées. La requête est réactive : elle suit le serveur ;
- le contenu de sa classe (`offline/pack:content`) : matières, thématiques,
  paliers, exercices avec réponses attendues et indices, explications déjà
  calculées. Il se recharge quand le serveur annonce un autre contenu, et au
  moins une fois par jour ;
- de quoi calculer les trophées (`offline/pack:badgeInputs`) et, quand l'école
  a allumé le module, le chemin d'arabe (`offline/pack:arabicSnapshot`) ;
- la voix de Pio (plus bas) ;
- les paliers que personne n'a encore ouverts. `offline/prefetch:preparePaliers`
  les génère, trois par appel, par le même chemin qu'une ouverture en ligne
  (`generateBucketCore`). Une génération ratée attend trente minutes avant un
  nouvel essai.

Tout s'écrit sous `jotna-offline/` par `@capacitor/filesystem`
(`lib/offline/files.ts`), dans un dossier que la sauvegarde iCloud ignore
(`Directory.LibraryNoCloud` : `Library/NoCloud` sur iOS, le dossier des
fichiers de l'application sur Android). Chaque écriture passe par un fichier
temporaire qui remplace ensuite l'ancien : un arrêt brutal ne laisse jamais
un fichier à moitié écrit.

### La séance se joue sur l'appareil

Le moteur local (`lib/offline/engine.ts`, `lib/offline/model.ts`) réunit le
sac et ce que l'enfant a fait depuis. Il calcule les écrans avec les mêmes
fonctions pures que le serveur :

| Règle | Fichier |
| --- | --- |
| Vérifier une réponse | `convex/paliers/exerciseRules.ts` |
| Note et étoiles d'un palier | `convex/paliers/scoring.ts` |
| Progression et carte | `convex/progressionRules.ts`, `convex/worldRules.ts` |
| Série | `convex/streakRules.ts` |
| Missions du jour | `convex/questRules.ts` |
| Trophées | `convex/badgeRules.ts`, `convex/badgeSnapshotRules.ts` |
| Arabe | `convex/arabic/progressRules.ts` |

Une règle changée l'est donc des deux côtés. Les pages lisent par
`hooks/use-student-data.ts`, jamais Convex directement : le hook prend le
moteur dans l'application, la requête Convex sur le web.

### Le journal et la synchronisation

Chaque geste est écrit dans un fichier de l'appareil : une séance de palier
(réponses, indices, fin), une tentative d'arabe, une leçon terminée, le
réglage des sons, un niveau ou des trophées déjà vus. Quand Convex répond et
reconnaît l'enfant, l'application envoie chaque entrée à
`offline/sync:apply`, la plus ancienne d'abord.

Le serveur rejoue tout :

- il revérifie chaque réponse avec sa propre copie de l'exercice. Le verdict
  de l'appareil ne compte que si l'exercice a été supprimé entre-temps ;
- il calcule étoiles, niveau, série et missions avec les fonctions du jeu en
  ligne, à la date où l'enfant a joué ;
- un envoi qui repart ne double rien. La séance se retrouve par
  `palierAttempts.clientSessionId` (et `syncedLogLength` pour ce qui en est
  déjà écrit), la tentative d'arabe par `arabicAttempts.clientEventId`, la
  fin de leçon par `offlineReceipts` ;
- une entrée de plus de 120 jours est refusée (`MAX_EVENT_AGE_MS`) ;
- le paywall ne bloque pas l'envoi. Ce qu'un enfant a fait pendant que son
  accès était ouvert s'écrit, même si l'abonnement de l'école a expiré depuis.

Professeurs, parents et bulletins lisent le serveur : le travail fait hors
ligne y apparaît une fois envoyé. Côté enfant, l'entrée locale l'emporte tant
qu'aucun état reçu du serveur ne la reflète (`sessionOverrides`,
`entryOverlays` dans `lib/offline/model.ts`) : l'écran ne recule pas entre
l'envoi et la réponse.

### La voix de Pio

L'application télécharge les sons une fois, puis les joue depuis l'appareil
(`lib/offline/clips.ts`, `components/offline/clip-source.ts`) :

- la consigne de chaque exercice de la classe, pour les enfants de CI et de
  CP (`readsAloud`) ;
- toutes les voix du module d'arabe, quand l'école l'a allumé.

`offline/voice:prepareClips` rend le son déjà prêt, ou le fait synthétiser
par ElevenLabs, douze nouveaux au plus par appel. Un son n'est payé qu'une
fois : le cache sert tous les enfants, et il est partagé avec le lecteur en
ligne (même voix, même modèle, même clé). Sans réseau, un son jamais
téléchargé ne se joue pas. Le bouton passe en gris et l'exercice reste
jouable. Sur le web, chaque écoute demande le son à `prepareClips`.

### Plusieurs enfants sur une tablette

L'appareil retient quel enfant rouvrir (`device.json`). Se déconnecter fait
oublier cet enfant à l'appareil. Son journal reste, et part quand il se
reconnecte.

## Ce que ça change

Les réponses attendues sont maintenant sur l'appareil, sans quoi aucune
réponse ne se corrige hors ligne. L'application ne suit donc plus la
décision 61 (la séance en ligne ne livre jamais la réponse, voir
`convex/paliers/index.ts`). Le serveur revérifie tout à l'envoi : une réponse
modifiée sur l'appareil ne change rien pour les professeurs, les parents et
les bulletins.

## Le web et l'application

Un seul build sert les deux. Ce qui ne doit tourner que dans l'application
se charge à la demande, quand `useNativeAppOrUnknown()`
(`hooks/use-native-app.ts`) reconnaît la coque iOS ou Android :

| Rôle | Application | Web |
| --- | --- | --- |
| Fournisseur (`components/offline/offline-provider.tsx`) | charge `native-offline-provider.tsx` et le moteur | ne charge rien : `useOffline()` rend la valeur éteinte |
| Données (`hooks/use-student-data.ts`) | le moteur | les requêtes et mutations Convex |
| Séance de palier (`app/(student)/student/topics/session/`) | `offline-session.tsx`, chargée à la demande | `online-session.tsx` |
| Garde (`components/offline/student-gate.tsx`) | lit l'appareil | `AccessGate`, comme le reste du site |
| Sons (`components/offline/clip-source.ts`) | l'appareil d'abord, puis le réseau | `offline/voice:prepareClips` |

Le contexte (`components/offline/context.ts`) n'importe du moteur que des
types : le web le lit sans télécharger le moteur. Pendant le pré-rendu et
l'hydratation, la plateforme n'est pas encore connue : le HTML reste celui
du web, et l'application attend avant d'ouvrir l'espace élève.

## Mettre en service

1. Pousser Convex. Le schéma gagne des champs et des index sur
   `palierAttempts` et `arabicAttempts`, et une table `offlineReceipts`. Les
   fonctions `offline/*` et la tâche `purgeOfflineReceipts` arrivent avec.
2. Publier le site ensuite, pas avant : sur le web, les voix passent par
   `offline/voice:prepareClips`.
3. Reconstruire les applications : `pnpm ios:sync` et `pnpm android:sync`,
   puis Xcode et Android Studio. L'application a gagné un plugin natif
   (`@capacitor/filesystem`). Une application construite avant ne l'a pas, et
   recopier `out/` ne suffit pas.

## Tester

- `pnpm test` : `lib/offline/__tests__/` (règles de séance, modèle),
  `convex/__tests__/exerciseRules.test.ts`, `convex/__tests__/streak.test.ts`.
- Sur le simulateur ou un téléphone : se connecter une fois avec du réseau,
  laisser le sac se remplir, passer en mode avion, fermer et rouvrir
  l'application, jouer un palier. Au retour du réseau, le palier apparaît
  chez le professeur.
- Aucun navigateur ne remplace ce test : hors de la coque native, le
  hors-ligne reste éteint (`docs/capacitor-ios.md`, « Tester sur le
  simulateur »).
- Sur le web, l'espace élève doit se comporter comme avant : `pnpm dev`,
  puis un parcours d'élève en ligne (carte, palier, trophées, arabe).
