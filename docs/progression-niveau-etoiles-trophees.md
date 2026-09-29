# Niveau, étoiles, série, missions, trophées : d'où vient ce qui monte

L'enfant voit cinq choses monter : sa jauge de niveau, ses étoiles, sa série
de jours, ses missions du jour et ses trophées. Ce document dit où chacune se
calcule dans le code d'aujourd'hui (29 septembre 2026), et ce qui ne marche
pas encore.

## Un moteur écrit, puis retiré

Un moteur de progression plus complet a été écrit le 27 septembre 2026 sur la
branche de l'application iOS : `convex/progression.ts`, `progressionRules.ts`,
`badgeRules.ts`, leurs tests et un rattrapage `progression:rebuild`. Le soir
même, la fusion avec `main` (commit `e4e8cea`) a gardé le backend de `main`,
avec ses étoiles approximées, et a retiré ces modules. Ce document décrivait
le moteur retiré ; il décrit maintenant le code en place.

Les sept champs de résumé que ce moteur posait sur `palierAttempts`
(`correctCount`, `exerciseCount`, `firstTryCount`, `noHintCount`, `hintsUsed`,
`starsTotal`, `timeSpentMs`) restent dans le schéma, facultatifs, pour que les
tentatives déjà écrites en développement restent valides. Aucun code ne les
lit.

## La fin d'un palier

Chaque réponse passe par `palierAttempts.verifyAttempt`, qui écrit une ligne
`attempts` par essai ; un indice passe par `requestHint`.
`palierAttempts.submitPalier` est le seul endroit où un palier se valide ou
échoue. Il note chaque exercice (`paliers/scoring.ts`) : 10 au premier essai,
7 au deuxième, 4 au troisième, 1 au quatrième ou au cinquième, moins 1 par
indice, jamais sous zéro. Le palier est validé quand la moyenne atteint 7.

Sur la tentative, il n'enregistre que le statut, la moyenne, les exercices
ratés et la date. Si le palier est validé, `markTopicCompleteIfDone` pose
`studentTopicProgress.completedAt` quand tous les paliers de la thématique le
sont. Puis, validé ou non, la série (`streak.recordKidActivity`) et les
missions (`quests.recordActivity`) avancent. Le reste du résultat (étoiles,
seuil, nombre d'exercices) est rendu à l'écran de fin, pas enregistré.

## Le niveau

Cinquante bonnes réponses font un niveau (`students.EXOS_PER_LEVEL`,
`computeLevel`). Le total est la somme de `studentTopicProgress.correctExercises`
sur les thématiques. La jauge de l'en-tête, le carnet et l'écran de niveau
lisent tous `students.getMyStats` ; ils recopient la constante 50 chez eux.

**Les réponses des paliers ne comptent pas.** `correctExercises` n'est écrit
que par l'ancien flux d'exercices (`attempts.submit` et
`attempts.markAttemptCorrectByAI`), qu'aucun écran n'appelle plus :
`components/exercises/ExercisePlayer.tsx` n'est monté nulle part. Un élève qui
ne joue que des paliers reste « niveau 1, 0/50 », et son carnet compte zéro
exercice.

## Les étoiles : trois comptes différents

- **L'écran de fin de palier** compte juste. Trois étoiles par exercice au
  plus (note de 9 ou plus : 3 ; de 6 ou plus : 2 ; de 3 ou plus : 1), sur
  « nombre d'exercices × 3 », avec un seuil de 70 % arrondi au-dessus. Ce
  total (`starsTotal`) n'est pas enregistré.
- **Le carnet** (`getMyStats.totalStars`) donne à chaque tentative validée,
  rejeux compris, une note approximée de sa moyenne
  (`approxStarsForValidatedPalier` : 3 à partir de 9, 2 à partir de 7, sinon
  1), et ajoute les étoiles de mission (`preferences.questBonusStars`).
- **Le sentier** montre sur chaque étape la note approximée de la meilleure
  moyenne validée de ce palier, et le bandeau en fait la somme, sans étoiles
  de mission.

L'en-tête de l'espace élève n'affiche plus d'étoiles : il ne montre que le
niveau. Le camp ne s'en sert que pour reconnaître une première visite.

## Les missions du jour

Trois missions par jour, dans la table `dailyMissions` (une ligne par élève
et par jour), tirées de façon déterministe (`questRules.ts`). La ligne naît au
passage au camp (`quests.ensureDaily`) ou à la première fin de palier du jour
(`quests.recordActivity`). Une mission faite vaut une étoile, les trois en
valent deux de plus (`ALL_DONE_BONUS`) ; le cumul de vie vit dans
`profiles.preferences.questBonusStars`, borné à 10 000. La mission « gagner
des étoiles » compte les étoiles exactes de l'écran de fin. Un parent peut
couper les missions (`dailyMissionEnabled`).

## La série

La série vit dans `profiles.preferences.streak` (jours d'affilée, record,
dernier jour actif, gel disponible). `streak.recordKidActivity` l'avance à
chaque fin de palier. Le jour est la date UTC, qui est l'heure de Dakar ; un
gel est offert tous les sept jours. Chaque nuit à 00 h 05, une tâche
planifiée (`crons.ts`) remet à zéro la série des élèves qui ont sauté un jour
sans gel disponible. Un parent peut couper la série (`streaksEnabled`).

## La maîtrise d'une thématique

`studentTopicProgress.masteryLevel` est toujours à zéro : il n'est écrit qu'à
la création de la ligne. Son seul lecteur, `progress.getSubjectProgress`, n'a
pas d'appelant.

Les bulletins des parents et des professeurs sont des `topicReports`, lus par
`reports.listByStudent`, `listByTeacher` et `listByParent` ; leur score est le
rapport des bonnes réponses aux réponses. Mais `reports.generate`, seule
fonction à créer ces lignes, n'a pas d'appelant non plus. Les fiches élève
des professeurs et de l'administration (`students.getStudentDetail`) montrent
les bonnes réponses sur le total, par matière.

## Les trophées

Un trophée est une ligne de `badges` : un nom, une description, une icône,
une condition (une clé libre), une matière facultative et une rareté. Dix
autres champs du schéma (`catalogKey`, `conditionParams`, `tiers`…) ne sont lus
par aucun code.

`badges.checkAndAward` connaît trois clés : `complete_topic` (une thématique
terminée), `perfect_score` (une thématique terminée sans erreur) et `streak_3`
(trois thématiques terminées, pas trois jours de série). Il ignore toute autre
clé. `getConditionText` écrit le critère affiché.

**Aucun trophée n'est attribué aujourd'hui.** `checkAndAward` n'est lancé que
par `attempts.submit`, l'ancien flux qu'aucun écran n'appelle ; ni
`submitPalier` ni la correction par l'IA ne le lancent.

La salle des trophées (`/student/badges`) montre une jauge de collection et,
dans la fiche d'un trophée, son critère ; il n'y a pas de barre de progression
par trophée. Un trophée gagné s'annonce à la fin d'un palier
(`getMyStats.unseenBadges`). Dans l'administration, créer un trophée demande
un nom, une description, une icône, l'une des trois conditions et, au besoin,
une matière.

`npx convex run badges:normalizeRarities` convertit une fois les anciennes
raretés vers les quatre d'aujourd'hui (commun, rare, épique, légendaire). Il
n'a ni `confirmDeployment` ni mode d'essai.

## Le temps

`attempts.timeSpentMs` existe, mais l'écran des paliers ne l'envoie pas : ses
réponses valent zéro, et aucune borne n'est posée côté serveur. Le carnet
affiche le temps cumulé dans une case « Temps », visible quand la série est
coupée : pour un élève qui ne joue que des paliers, elle reste à zéro.

## Ce qui ne marche pas encore

1. Les paliers ne font pas monter le niveau (`correctExercises`).
2. Les paliers n'attribuent aucun trophée (`checkAndAward`).
3. La maîtrise reste à zéro, et rien ne produit les bulletins
   (`reports.generate` n'a pas d'appelant).
4. Le temps passé sur un exercice n'est pas envoyé.
5. `submitPalier` accepte qu'on soumette de nouveau une tentative déjà
   terminée : la série et les missions avancent alors une seconde fois.
6. Les étoiles se comptent de trois façons, dont deux approximées.

Aucun rattrapage n'existe pour la progression : `progression:rebuild` et
`badges:normalizeCatalog` sont partis avec le moteur retiré.

## Les tests

Les règles en place sont testées par `convex/__tests__/scoring.test.ts`
(notes et étoiles d'un palier), `streak.test.ts` (série, niveau et étoiles
approximées), `questRules.test.ts`, `palierRules.test.ts` et
`subjectMap.test.ts`. `badges.test.ts`, `attempts.test.ts` et `reports.test.ts`
réécrivent la logique sur une fausse base au lieu d'importer le code : ils ne
protègent pas les fonctions réelles. Côté parcours :
`e2e/palier-progression-guard.spec.ts` et `e2e/mvp1-play-palier.spec.ts`.
