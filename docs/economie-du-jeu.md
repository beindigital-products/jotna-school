# L'économie du jeu : cauris, coffre du jour, cartes, marché

Depuis le 24 novembre 2026, l'enfant gagne une monnaie en jouant, les cauris.
Il les dépense au marché pour décorer son camp. Chaque jour de jeu lui donne un
coffre, qui contient des cauris et une carte à collectionner. Ce document dit
où chaque chose se calcule, ce qui est fait et ce qui reste.

Le propriétaire a demandé cette économie le 24 novembre 2026. `docs/monde-de-pio.md`
l'écartait jusque-là (décision G7 de juillet 2026).

## Les règles tenues

Les cauris se gagnent en jouant. Ils ne s'achètent jamais avec de l'argent.
Aucun compte à rebours, aucune offre qui expire, aucun classement entre
enfants. Le coffre se mérite : il s'ouvre après un palier fini dans la journée.

## Les cauris

Quatre sources, toutes calculées par `convex/economyRules.ts` (module pur,
testé par `convex/__tests__/economyRules.test.ts`) :

| Source | Gain | Où |
| --- | --- | --- |
| Fin de palier | 1 cauri par étoile, plus 5 si le palier est validé | `caurisForPalier` |
| Missions du jour | 5 par mission, plus 10 quand les trois sont faites | `caurisForQuests` |
| Trophée | 10, 20, 40 ou 80 selon la rareté | `caurisForBadge` |
| Coffre du jour | de 15 à 35, par pas de 5 | `rollChest` |

Les paliers rapportent au plus 120 cauris par jour (`DAILY_PALIER_CAP`). Un
enfant qui rejoue vingt fois le même palier ne gagne rien de plus. Les
missions, les trophées et le coffre ne comptent pas dans ce plafond.

Ces chiffres sont un premier réglage. Ils se changent dans `economyRules.ts`,
et les prix dans `gameCatalog.ts`.

### Où ils sont versés

`convex/economy.ts` est appelé comme une fonction ordinaire, dans la
transaction qui existe déjà :

- `palierAttempts.finishPalierAttempt` appelle `rewardPalier`. Cette fonction
  sert au palier joué en ligne et au palier rejoué par la synchronisation de
  l'application : les deux chemins paient.
- `quests.recordQuestActivity` appelle `rewardQuests`.
- `badges.checkAndAward` appelle `rewardBadge`.

### Rien n'est payé deux fois

Chaque gain porte une clé (`refKey`) : `palier:<tentative>`, `quests:<jour>`,
`badge:<trophée>`, `chest:<jour>`. Le journal `cauriLedger` dit ce que cette
clé a déjà rapporté, et `creditCauris` ne verse que la différence. Une
tentative notée une seconde fois après une nouvelle chance rapporte seulement
les étoiles gagnées en plus. `convex/__tests__/economy.test.ts` le vérifie sur
le vrai code, avec une base en mémoire.

### Les tables

| Table | Contenu |
| --- | --- |
| `wallets` | le solde, une ligne par élève |
| `cauriLedger` | chaque gain et chaque achat, avec sa clé et son jour |
| `studentCards` | les cartes de l'album |
| `studentItems` | les objets achetés |
| `dailyChests` | le coffre ouvert d'un jour, avec ce qu'il contenait |

Le solde est à part du profil. Il bouge à chaque palier, et l'écrire dans
`profiles.preferences` réveillerait `students.getMyStats`, qui lit près de
1 800 documents.

## Le coffre du jour

`economy.getMyWallet` rend son état : `locked` tant qu'aucun palier n'est fini
aujourd'hui, `ready` ensuite, `opened` une fois ouvert. Le jour est celui de
Dakar, comme pour la série et les missions.

`economy.openDailyChest` tire le coffre avec `rollChest`. La graine est
l'identifiant de l'élève et le jour : le même coffre sort toujours pour le même
enfant le même jour. La rareté de la carte suit `CHEST_RARITY_ODDS` (70 %
commune, 25 % rare, 5 % épique). Dans la rareté tirée, le coffre prend d'abord
une carte que l'enfant n'a pas. S'il les a toutes, la carte est un double et se
change en cauris (10, 20 ou 40).

Sur le camp, le coffre est un médaillon à gauche de Pio
(`components/student/game/daily-chest.tsx`). Fermé à clé, il fait dire à Pio
comment l'ouvrir. Une fois ouvert, il disparaît jusqu'au lendemain.

## Les cartes

Le catalogue est fermé, dans `convex/gameCatalog.ts` : neuf cartes, une série,
« Les animaux du fleuve et de la savane ». Chaque carte porte une phrase vraie
sur l'animal. L'album (`components/student/game/card-album.tsx`) garde la place
des cartes manquantes sans dire lesquelles.

Pour ajouter une carte :

1. générer l'image avec le serveur `studio` (modèle `bfl/flux-3-image`,
   `hub-savanna-wide.jpg` en référence de style) et la regarder ;
2. la déposer dans un dossier `cartes/<id>.png` et lancer
   `node scripts/build-game-assets.mjs --raw <dossier>` ;
3. ajouter l'entrée à `CARDS`.

`lib/__tests__/game-assets.test.ts` casse si une carte n'a pas ses deux
fichiers.

## Le marché

Quatre objets pour le camp, dans `SHOP_ITEMS` : cerf-volant (45), djembé (60),
tente (90), longue-vue (150). `economy.buyItem` lit le prix dans le catalogue,
jamais dans ce que l'écran envoie. Un objet possédé ne se rachète pas.

Un objet acheté se pose autour de Pio (`components/student/game/camp-items.tsx`),
à la place que le catalogue lui donne (`spot`). Les objets du sol restent sous
30 % de la hauteur, ceux du ciel au-dessus de 75 % : la bande du milieu est
celle du coffre et des modules de l'école.

Les tenues de Pio ne sont pas au marché. Chaque tenue demande ses propres clips
vidéo, pour chaque pose (`docs/pio-animations.md`).

## Les écrans

- La barre des lieux a cinq entrées : Camp, Carte, Marché, Trésors, Carnet
  (`app/(student)/layout.tsx`). La pastille de cauris de l'en-tête mène au
  marché.
- `/student/tresors` réunit l'album de cartes et la Salle des trophées, en deux
  onglets. La salle est celle d'avant, déplacée telle quelle (`TrophyRoom`).
  `/student/badges` y renvoie.
- `/student/marche` est le marché.
- Le camp suit l'heure de Dakar : de 19 heures à 6 heures, le décor passe sous
  la lune (`hooks/use-dakar-night.ts`, `savanna-backdrop.tsx`).
- La fin d'un palier annonce les cauris que le serveur vient de verser.

`/dev/jeu` monte le camp, le marché, l'album et le coffre avec des données
factices, sans compte ni serveur.

## Sans réseau, dans l'application

Le moteur hors ligne ne connaît pas les cauris. La bourse et l'album se lisent
donc toujours sur le serveur (`useWallet`, `useCardAlbum`).

- Un palier joué sans réseau est payé à la synchronisation. L'écran de fin de
  l'application n'annonce pas de cauris.
- Le coffre et le marché demandent le réseau. Sans lui, Pio le dit, sans parler
  d'erreur.
- La pastille de cauris et le coffre ne s'affichent pas tant que la bourse
  n'est pas arrivée.

Une erreur du serveur ne casse pas l'écran. Si le site est mis en ligne avant
les fonctions `economy`, le jeu s'affiche sans cauris, comme avant
(`useOnlineOnlyQuery` dans `hooks/use-student-data.ts`).

## Mettre en ligne

Déployer les fonctions Convex avant le site (`npx convex deploy`). Le schéma
ajoute cinq tables et ne touche à aucune table existante : il n'y a pas de
migration. Un élève sans ligne dans `wallets` a zéro cauri.

## Ce qui reste

- Rien n'a été essayé sur un vrai déploiement Convex. Les règles et le
  versement sont testés ; `openDailyChest` et `buyItem` ne le sont que par
  leurs règles et par l'écran, avec des données factices.
- Un parent ne peut pas couper le marché ni le coffre, alors qu'il peut couper
  la série et les missions.
- Les cauris, le coffre et le marché ne marchent pas hors ligne.
- Le module Arabe et Coran ne rapporte pas de cauris et ne prépare pas le
  coffre.
- La visite guidée ne montre le Marché et les Trésors qu'aux nouveaux élèves :
  ceux qui l'ont déjà vue ne la revoient pas.
- Le Gardien de chaque monde, la saison, l'objectif de classe, la promesse de
  parent, le compagnon et les tenues de Pio sont dans la maquette et pas dans
  le code.
