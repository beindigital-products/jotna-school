# Paliers et exercices : combien par thématique, et d'où ils viennent

Une thématique se joue en paliers de dix exercices, validés à 7/10. Ce
document dit combien de paliers une thématique compte, pourquoi, où la règle
vit, et comment remplir les paliers avant que les élèves n'arrivent.

## La règle

Le nombre de paliers d'une thématique est dynamique. Chaque thématique peut
porter le sien (`topics.palierCount`, de 1 à 10) ; sans valeur posée, c'est le
défaut de son niveau qui s'applique :

| Niveau   | Paliers | Exercices par thématique |
| -------- | ------- | ------------------------ |
| CI, CP   | 3       | 30                       |
| CE1, CE2 | 4       | 40                       |
| CM1, CM2 | 5       | 50                       |

Un palier est une séance d'une dizaine de minutes. Trois à cinq séances par
thématique font une thématique par semaine ou deux ; avec six thématiques par
matière et par niveau, l'année compte vingt à trente séances par matière.
C'est assez pour installer une notion sans lasser un enfant de six ans, à qui
l'ancienne règle imposait cent exercices sur les lettres de l'alphabet.

La difficulté d'un palier se lit par rapport au nombre de paliers de sa
thématique, plus par rapport à dix. Le premier est toujours une découverte,
le dernier toujours la maîtrise ; entre les deux, la position décide
(consolidation, puis approfondissement). Avec dix paliers, on retrouve
exactement l'ancienne grille : 1 à 3 découverte, 4 à 6 consolidation, 7 à 9
approfondissement, 10 maîtrise.

La règle vit dans `convex/palierRules.ts`, module pur sans Convex, et ses tests
dans `convex/__tests__/palierRules.test.ts`. Tout le monde la lit : les
requêtes élève, la validation d'un palier, les consignes de génération,
l'administration et l'écran du sentier.

## Ce que l'élève voit

Le sentier d'une matière montre un nœud par palier, thématique après
thématique ; le nom de la thématique est une plaque sur son premier palier.
La longueur du sentier est donc celle du programme de l'enfant : six
thématiques de CM1 à cinq paliers font trente étapes.

Un élève ne voit que les thématiques de son niveau (`profiles.class`, posé à
l'inscription en classe). Sans niveau sur le profil, il voit tout
l'élémentaire, comme avant. Une thématique sans niveau n'est montrée à aucun
élève qui en a un : la séance la refuserait de toute façon.

Une thématique est franchie quand tous ses paliers le sont.
`palierAttempts.submitPalier` pose alors `studentTopicProgress.completedAt`,
que la carte, le camp et les bulletins lisent. Les requêtes recalculent aussi
ce franchissement depuis les tentatives, pour les données d'avant.

## Changer le nombre de paliers d'une thématique

Dans l'administration, sur la matière puis la thématique : le champ
« Nombre de paliers » propose le défaut du niveau et les valeurs de 1 à 10, et
le champ « Niveau » dit à quels élèves la thématique s'adresse. Une thématique
large (les trois temps de l'indicatif) monte à sept ou huit ; une thématique
étroite descend à deux.

Baisser le nombre après génération ne supprime rien : les paliers au-delà
restent en base mais ne s'ouvrent plus (`startPalierAttempt` les refuse), et
`getBucket` refuse un index au-delà du nombre. Monter le nombre crée des
paliers à générer.

Pour changer les défauts par niveau : `DEFAULT_PALIERS_BY_CLASS` dans
`convex/palierRules.ts`, et le test qui les verrouille.

## Générer les exercices à l'avance

Sans rien faire, chaque palier se génère à sa première ouverture par un élève :
une vingtaine de secondes d'attente, et une école qui découvre le contenu avec
l'enfant. `convex/paliers/pregen.ts` remplit les paliers manquants ou périmés
par le même chemin que l'élève (`generateBucketCore`) : même consigne, même
vérification arithmétique, même table. Le contenu est marqué `preGenerated`.

Compter ce qui manque, sans rien générer :

```bash
npx convex run paliers/pregen:run '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
```

Générer, par lots (une action Convex vit dix minutes au plus ; relancer
jusqu'à `remaining: 0`) :

```bash
npx convex run paliers/pregen:run '{"confirmDeployment":"impartial-ermine-150","classes":["CM1","CM2"],"limit":20,"concurrency":4}'
```

`confirmDeployment` est la même garde que les jeux de données de test : la
dépense est réelle. Avec le modèle par défaut (`gpt-4o-mini`), un palier
coûte de l'ordre d'un millième de dollar (858 jetons en entrée, 1 354 en
sortie, 13 secondes lors du premier essai du 27 septembre 2026) ; tout
l'élémentaire, environ 230 paliers, revient à moins d'un dollar. La dépense
est comptée dans le budget mensuel de la passerelle IA, imputée à personne.

Le résumé rendu liste `failed` (à relancer), `pendingHuman` (un exercice de
mathématiques dont la réponse diverge de l'expression vérifiée ; le palier est
servi, mais mérite un regard dans l'administration) et `topicsWithoutClass`
(thématiques ignorées faute de niveau).

Les paliers expirent après un trimestre (`PALIER_TTL_MS`) et se régénèrent à
la demande ; relancer la pré-génération avant la rentrée suffit.

Quand la consigne de génération change (`convex/paliers/prompts.ts`), le
contenu en cache ne la reflète pas. `paliers/pregen:invalidate` passe les
paliers visés en `stale` (par matière, par niveau), et `run` les refait en
remplaçant leurs exercices :

```bash
npx convex run paliers/pregen:invalidate '{"confirmDeployment":"impartial-ermine-150","subjectIds":["<id de la matière>"],"classes":["CM1"]}'
```

Les élèves qui ont une tentative ouverte sur un palier invalidé la
reprennent sur les nouveaux exercices : à réserver au développement ou à une
rentrée.

## Ce que les consignes demandent en mathématiques

Sur les dix exercices d'un palier de mathématiques, la consigne impose des
quotas : au moins trois calculs écrits en symboles (× − ÷ =), trois en mots
ou en petit problème concret, deux à trou (« ? × 4 = 12 ») et deux qui font
intervenir une autre opération connue à ce niveau, seule ou combinée. Chaque
QCM propose comme distracteur le résultat d'une autre opération sur les
mêmes nombres. Le but est le même partout : l'enfant lit le signe, il ne le
devine pas.

Une réponse courte attendue en nombre ouvre le pavé numérique sur le
téléphone : le serveur déduit le clavier des réponses acceptées sans les
révéler (`inputMode` dans le payload nettoyé). La vérification accepte une
réponse identique à une forme attendue une fois canonisée (« 2,5 » et
« 2.5 », « 1 000 » et « 1000 »), ou qui dit le même nombre (« 18 m » et
« 18 », « 60% » et « 0,6 », `numericallyEqual`). Une fraction se compare à
l'identique : « 1/2 » n'accepte pas « 0,5 ».

## Les réponses attendues sont vérifiées par le calcul

Le modèle se trompe sur ses propres réponses. « Combien font 3 fois 5
plus 2 ? » attendait 15, et sur un QCM l'index de la bonne option pointe
souvent à côté de la réponse écrite (« 5 × 6 » : réponse 30, index sur 36).
Un élève qui répondait juste était compté faux, et le palier était marqué
« à relire » dans une table que personne n'ouvre.

`convex/paliers/mathRepair.ts` calcule chaque exercice numérique et corrige
ce qui diverge, à la génération comme en base. La valeur vient d'abord de
l'égalité à trou écrite dans l'énoncé (« Complète : ? × 6 = 24 »), sinon de
`mathExpression`, évaluée avec les priorités usuelles. Un QCM pointe l'option
qui vaut le résultat, ou reçoit le résultat à la place de l'option fausse ;
une réponse courte accepte le résultat et sa forme à virgule. Deux lectures
prudentes évitent de casser un exercice juste : une expression où la réponse
figure comme opérande est l'énoncé rempli par le modèle, on vérifie seulement
sa cohérence ; dans un problème en mots, une expression lue de gauche à
droite compte aussi. Les fractions ne deviennent jamais des décimaux, et
l'algèbre, π ou les logarithmes restent tels quels. Ce qu'on ne sait pas
corriger garde `needsManualReview`, et son palier reste `pending_human` ; le
reste passe `auto_ok`. Les tests de `convex/__tests__/mathRepair.test.ts`
rejouent les cas vus en base.

Pour repasser sur ce qui est déjà généré, sans appel au modèle :

```bash
npx convex run paliers/pregen:repairMath '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
```

Le résumé compte `repaired`, `unrepairable`, `cleared` (des signalements
levés) et `paliersRequalified`, avec vingt exemples. Le 27 septembre 2026,
sur la base de développement : 126 exercices corrigés sur 1 398 vérifiés,
53 laissés à relire, et 44 paliers `pending_human` au lieu de 152.

## Les glisser-déposer que l'enfant peut comprendre

Le modèle rend trois formes de glisser-déposer sans queue ni tête : des zones
nommées « Zone A », « Zone B » (« Associe chaque produit avec son résultat »
sans aucun résultat à l'écran), une étiquette identique à sa zone (« a » à
poser sur « a », pour choisir un homophone dans une phrase), et une zone
cible qui n'existe pas. Sur la base de développement, 513 glisser-déposer en
comptaient une cinquantaine.

`convex/paliers/dragDropRepair.ts` répare ce qu'il sait réparer, sans rien
inventer : un ordre à reconstituer (mots d'une phrase, syllabes, étapes)
devient un exercice `order` ; des calculs sous des zones génériques
(« Zone A », « Résultat 2 ») donnent aux zones leur résultat ; des calculs et
leurs résultats à trier dans deux boîtes « Opérations » et « Résultats »
deviennent un appariement (`match`, chaque calcul face à sa valeur
calculée) ; un mot à choisir dans une phrase devient un QCM dont les options
sont les zones ; une zone cible qui ne diffère que par la casse ou les
espaces est remise d'aplomb. Le reste est irréparable, y compris un
appariement où deux calculs ont la même valeur, qui serait ambigu : à la
génération, l'exercice est écarté du lot ; en base, il est signalé et son
palier repasse en `stale`, régénéré à la prochaine ouverture ou par
`pregen:run`. La consigne de génération dit désormais au modèle ce qu'est une
zone. Les tests sont dans `convex/__tests__/dragDropRepair.test.ts`.

Pour repasser sur l'existant, sans appel au modèle :

```bash
npx convex run paliers/pregen:repairDragDrop '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
```

Le résumé compte `toOrder`, `toQcm`, `toMatch`, `relabeled`, `cleaned`,
`unrepairable` et `paliersInvalidated`, avec vingt exemples.
Le 27 septembre 2026, sur la base de développement, en deux passes : 17
exercices passés en `order`, 10 en QCM, 7 en appariement, 9 relabellisés, 8
irréparables (tous de collège ou de lycée, niveaux masqués) et 21 paliers
renvoyés en génération.

Un palier n'a pas toujours dix exercices : le modèle en rend parfois neuf de
valides, et l'écart n'est pas comblé. L'écran de fin compte alors ses
étoiles sur le nombre d'exercices joués (`exerciseCount` rendu par
`submitPalier`), trois par exercice, avec le seuil à 7 sur 10 ramené à ce
nombre.

## Essais et indices

Un exercice se joue en cinq essais au plus (`MAX_ATTEMPTS_PER_EXERCISE`).
Un indice demandé s'enregistre comme une ligne d'essai sentinelle
(`attemptNumber: 0`) pour que le score le déduise ; ce n'est pas un essai.
`countRealAttempts`, dans `convex/paliers/scoring.ts`, ne compte que les
lignes numérotées, et c'est ce que lisent le numéro du prochain essai, les
essais restants annoncés à l'enfant et la reprise d'une séance. Avant cette
règle, un indice faisait passer l'enfant de « encore 4 essais » à
« encore 2 », et gonflait le numéro d'essai que la grille de score punit.

## Ce que la base de développement contient

Au 27 septembre 2026, seuls Mathématiques et Français portent des thématiques
d'élémentaire : cinq à sept par niveau. Deux thématiques viennent du premier
jeu de données et doublonnent le programme (« Fractions » en CE2, à côté de
« Les fractions simples » ; « Multiplication » en CM1, à côté de « La
multiplication à 2 chiffres »), et « Conjugaison des verbes » en Français n'a
pas de niveau : personne ne la voit. Les trois relèvent d'une décision
d'administration, pas d'un script.
