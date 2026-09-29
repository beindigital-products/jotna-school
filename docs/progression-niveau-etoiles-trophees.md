# Niveau, étoiles, série, missions, trophées : d'où vient ce qui monte

L'enfant voit cinq choses monter : sa jauge de niveau, ses étoiles, sa série
de jours, ses missions du jour et ses trophées. Les parents et les
professeurs voient en plus la maîtrise des thématiques et les bulletins. Ce
document dit où chacune se calcule dans le code (29 septembre 2026).

## Un moteur retiré, puis remis en place

Un moteur de progression a été écrit le 27 septembre 2026 sur la branche de
l'application iOS (commit `2d0652a`) : `convex/progressionRules.ts` et
`badgeRules.ts` pour les règles, `progression.ts` pour la base, et un
rattrapage `progression:rebuild`. Le soir même, la fusion avec `main`
(commit `e4e8cea`) a pris tout `convex/` de `main` pour éviter les conflits,
et ces modules sont partis avec. Jusqu'au 29 septembre, les paliers ne
faisaient monter ni le niveau ni les trophées.

Le moteur est revenu le 29 septembre, adapté au code de `main`, avec quatre
ajouts : une tentative ne se note qu'une fois, le bulletin naît quand une
thématique est franchie, les étoiles d'une thématique sont rangées avec
elle, et une thématique « sans faute » l'est vraiment.

## Tout part de la fin d'un palier

Chaque réponse passe par `palierAttempts.verifyAttempt`, qui écrit une ligne
`attempts` avec le temps mesuré par l'écran depuis l'apparition de
l'exercice, borné à dix minutes. Un indice passe par `requestHint`, qui
écrit une ligne sentinelle (`attemptNumber: 0`) : ce n'est pas une réponse.
Une tentative déjà notée refuse toute nouvelle réponse (« Tentative
terminée »).

`palierAttempts.submitPalier` note chaque exercice (`paliers/scoring.ts`) :
10 au premier essai, 7 au deuxième, 4 au troisième, 1 au quatrième ou au
cinquième, moins 1 par indice, jamais sous zéro. Le palier est validé quand
la moyenne atteint 7. Puis, dans l'ordre :

1. il range sur la tentative son statut, sa moyenne, ses exercices ratés et
   son résumé (`progressionRules.summarizePalier`) : exercices joués et
   résolus, résolus du premier coup, résolus sans indice, indices, étoiles,
   temps ;
2. il recalcule la thématique (`progression.syncTopicProgress`) depuis
   toutes les tentatives finies de l'élève sur ses paliers : exercices faits
   et résolus, indices, maîtrise, étoiles, et `completedAt` quand tous les
   paliers sont validés ;
3. si la thématique vient d'être franchie, il planifie son bulletin
   (`reports.generate`) ;
4. il planifie l'examen des trophées (`badges.checkAndAward`) ;
5. il fait avancer la série (`streak.recordKidActivity`) et les missions
   (`quests.recordActivity`).

Rien ne s'incrémente à l'aveugle : la thématique se recompte depuis ses
tentatives, si bien qu'un rejeu ou une reprise ne font pas dériver les
compteurs.

Une tentative ne se note qu'une fois. Un second envoi (double appui, réseau
qui rejoue) trouve la tentative déjà notée : il rend le même résultat et
n'écrit rien, ni série ni missions. Après un échec, la nouvelle chance
(`paliers/index.regenerateFailedExercises`) remplace les exercices ratés et
remet la tentative en cours : elle se note alors de nouveau.

## Le niveau

Cinquante bonnes réponses font un niveau (`progressionRules.computeLevel`).
Une bonne réponse est un exercice résolu en cinq essais au plus, dans une
tentative finie, validée ou non ; les rejeux comptent. Le total est la somme
de `studentTopicProgress.correctExercises` sur les thématiques, que lit
`students.getMyStats`. L'écran de fin importe la constante 50 de
`progressionRules` ; l'en-tête et le carnet la recopient.

## Les étoiles

Un exercice rapporte jusqu'à trois étoiles selon sa note : trois à partir de
9, deux à partir de 6, une à partir de 3. Les étoiles d'un palier sont celles
de sa meilleure tentative finie, jamais la somme des rejeux. Celles d'une
thématique, la somme de ses paliers, sont rangées dans
`studentTopicProgress.starsEarned`.

- L'écran de fin montre les étoiles exactes de la tentative.
- Le carnet (`getMyStats.totalStars`) additionne les thématiques, plus les
  étoiles de mission.
- Le bandeau d'une matière (`getStudentSubjectMap.totalStars`) additionne
  ses thématiques visibles.

Un palier a aussi une note, d'une à trois étoiles
(`progressionRules.palierStarRating`) : trois à 90 % des étoiles, deux dès le
seuil de 70 % arrondi au-dessus, une sinon. L'écran de fin et l'étape du
sentier montrent la même ; le sentier prend la meilleure tentative validée.
La validation et ce seuil ne coïncident pas : un palier réussi entièrement au
deuxième essai a une moyenne de 7, donc il est validé, mais il gagne 20
étoiles sur 30, sous le seuil de 21, et reçoit une seule étoile de note.

Une tentative d'avant, sans résumé, compte des étoiles approchées depuis sa
moyenne jusqu'au rattrapage.

## Les missions du jour

Trois missions par jour, dans la table `dailyMissions` (une ligne par élève
et par jour), tirées de façon déterministe (`questRules.ts`). La ligne naît au
passage au camp (`quests.ensureDaily`) ou à la première fin de palier du jour
(`quests.recordActivity`). Une mission faite vaut une étoile, les trois en
valent deux de plus (`ALL_DONE_BONUS`) ; le cumul de vie vit dans
`profiles.preferences.questBonusStars`, borné à 10 000. La mission « gagner
des étoiles » compte les étoiles exactes de l'écran de fin. Après une
nouvelle chance, la tentative notée de nouveau fait avancer les missions de
tous ses exercices, pas seulement de ceux qui ont été rejoués. Un parent peut
couper les missions (`dailyMissionEnabled`).

## La série

La série vit dans `profiles.preferences.streak` (jours d'affilée, record,
dernier jour actif, gel disponible). `streak.recordKidActivity` l'avance à
chaque tentative notée. Le jour est la date UTC, qui est l'heure de Dakar ;
un gel est offert tous les sept jours. Chaque nuit à 00 h 05, une tâche
planifiée (`crons.ts`) remet à zéro la série des élèves qui ont sauté un jour
sans gel disponible. Un parent peut couper la série (`streaksEnabled`).

## La maîtrise d'une thématique

`studentTopicProgress.masteryLevel` vaut la meilleure moyenne d'un palier
validé de la thématique, sur 100. Les trophées « Maître de… »
(`subject_avg_mastery`) en font la moyenne par matière.
`progress.getSubjectProgress` la lit aussi, mais n'a pas d'appelant.

## Les bulletins

Un bulletin est une ligne de `topicReports`, lue par
`reports.listByStudent`, `listByTeacher` et `listByParent`.
`reports.generate` le produit quand l'élève franchit une thématique, une
fois par élève et par thématique. Il lit les réponses des tentatives finies
sur les paliers de la thématique, sans les indices
(`reportRules.buildTopicReport`) :

- le score est la part des bonnes réponses parmi les réponses données ;
- les forces et les faiblesses sont des types d'exercice : plus de 80 % de
  bonnes réponses, moins de 50 % ;
- une erreur fréquente est un exercice tenté au moins trois fois, avec une
  majorité de mauvaises réponses.

Le bulletin part ensuite par e-mail (`reportsEmail.sendEmail`, par Resend) à
chaque tuteur qui a une adresse et n'a pas décoché « Recevoir les rapports
par e-mail ». Le rattrapage ne produit aucun bulletin : une thématique
franchie avant lui n'écrit pas aux parents.

Les fiches élève des professeurs et de l'administration
(`students.getStudentDetail`) montrent les bonnes réponses sur le total, par
matière.

## Les trophées

Un trophée est une ligne de `badges` : un nom, une description, une icône,
une rareté, une condition et ses paramètres (`conditionParams` : un seuil,
une durée, une heure, une matière). `badgeRules.ts` sait juger 28
conditions : thématiques terminées ou sans faute, exercices résolus,
réponses données, réussites du premier coup ou sans indice, réussites après
plusieurs essais, réponses rapides, séances, week-ends, heures matinales ou
tardives, paliers validés, matières commencées ou terminées, maîtrise d'une
matière, série, missions, et les trois clés de l'ancien moteur. Il ne juge
pas `teacher_kudos` : la salle des trophées ne le montre pas, et
l'administration le signale.

`badges.checkAndAward` juge chaque trophée pas encore gagné sur un
instantané de l'élève (`buildStudentSnapshot`) : ses 4 000 lignes d'essai et
ses 500 tentatives les plus récentes, les thématiques visibles pour sa
classe, ses missions et sa série. Il tourne à chaque fin de palier et après
le rattrapage. Une thématique est sans faute quand chacun de ses paliers a
été validé au moins une fois sans erreur, chaque exercice réussi à la
première réponse.

La salle des trophées (`/student/badges`) montre une jauge de collection et,
sous chaque trophée fermé, une barre qui dit où l'enfant en est
(`badges.getMyBadgeProgress`). Un trophée gagné s'annonce à la fin d'un
palier (`getMyStats.unseenBadges`), puis l'écran de niveau s'ouvre s'il y a
lieu. Dans l'administration, un trophée se crée avec l'une des conditions,
un seuil facultatif et une matière facultative.

Deux commandes d'entretien :

    npx convex run badges:normalizeCatalog '{"confirmDeployment":"<nom>","dryRun":true}'
    npx convex run badges:normalizeRarities

La première complète, par clé de catalogue, les paramètres manquants ; sur
le déploiement de développement, ils sont déjà posés. La seconde convertit
une fois les anciennes raretés vers les quatre d'aujourd'hui (commun, rare,
épique, légendaire) ; elle n'a ni `confirmDeployment` ni mode d'essai.

## Le temps

L'écran des paliers envoie le temps de chaque réponse, que `verifyAttempt`
borne à dix minutes. Le carnet l'additionne dans sa case « Temps », visible
quand la série est coupée, sur les 1 000 premières lignes d'essai de
l'élève : au-delà, le total ne bouge plus. Les réponses données avant la
remise en place du moteur valent zéro.

## Rattraper l'existant

Après le déploiement de ce code, une fois sur chaque déploiement :

    npx convex run progression:rebuild '{"confirmDeployment":"<nom>","dryRun":true}'
    npx convex run progression:rebuild '{"confirmDeployment":"<nom>"}'

Le rattrapage parcourt toutes les tentatives par pages de 50 et planifie
seul la page suivante. Il résume les tentatives finies qui n'ont pas de
résumé, recalcule chaque thématique où l'élève a fini un palier, et
réexamine les trophées de chaque élève. Sans lui, les élèves d'avant gardent
une jauge à zéro, et le carnet ne compte que leurs étoiles de mission. Il a
tourné sur le déploiement de développement le 29 septembre 2026.

## Ce qui reste

- L'ancien flux d'exercices (`attempts.submit`, avec
  `components/exercises/ExercisePlayer.tsx`) n'est monté nulle part, mais il
  écrit encore `correctExercises` à sa façon. Le recalcul de la thématique
  l'écrase à la fin du palier suivant.
- La validation et le seuil d'étoiles ne coïncident pas (voir « Les
  étoiles »).
- Le temps du carnet s'arrête à 1 000 lignes d'essai.
- L'en-tête et le carnet recopient la constante 50.
- `badges.test.ts`, `attempts.test.ts` et `reports.test.ts` réécrivent la
  logique sur une fausse base au lieu d'importer le code.

## Les tests

Les règles sont testées par `convex/__tests__/progressionRules.test.ts`
(résumé, niveau, étoiles, note, maîtrise), `badgeRules.test.ts` (conditions,
instantané, attribution), `reportRules.test.ts` (bulletin),
`scoring.test.ts` (notes et étoiles d'un palier), `streak.test.ts`,
`questRules.test.ts`, `palierRules.test.ts` et `subjectMap.test.ts`. Côté
parcours : `e2e/palier-progression-guard.spec.ts` et
`e2e/mvp1-play-palier.spec.ts`. La fin de palier elle-même (écritures,
idempotence, bulletin) a été vérifiée sur le déploiement de développement,
pas par un test automatique.
