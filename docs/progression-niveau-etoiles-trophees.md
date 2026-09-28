# Niveau, étoiles, série, missions, trophées : d'où vient ce qui monte

L'enfant voit cinq choses monter : sa jauge de niveau, ses étoiles, sa
série de jours, ses missions du jour et ses trophées. Ce document dit d'où
chacune vient, où elle se calcule, et ce qu'il faut lancer pour qu'un
élève d'avant ne reste pas à zéro.

## Une seule source : la fin d'un palier

Tout part de `palierAttempts.submitPalier`, seul endroit où un palier se
termine. Il résume la tentative (`progressionRules.summarizePalier`) et range
le résumé sur la tentative elle-même (`palierAttempts.exerciseCount`,
`correctCount`, `firstTryCount`, `noHintCount`, `hintsUsed`, `starsTotal`,
`timeSpentMs`). Puis il recalcule la progression de la thématique depuis
toutes les tentatives finies de l'élève dessus (`progression.syncTopicProgress`),
fait avancer la série et les missions, et demande un réexamen des trophées
(`badges.checkAndAward`, par le planificateur).

Rien n'est incrémenté à l'aveugle : on recompte toujours depuis la source.
Un rejeu, une réparation, une reprise ne peuvent pas faire dériver un
compteur.

## Le niveau : les points d'aventure

Une bonne réponse est un point d'aventure ; cinquante points font un niveau
(`progressionRules.EXOS_PER_LEVEL`). Le total vient de
`studentTopicProgress.correctExercises`, sommé sur les thématiques, que
`syncTopicProgress` écrit. Un exercice compte quand il est résolu, quel que
soit l'essai ; un palier rejoué compte à nouveau, c'est du travail.

Avant ce module, ces compteurs n'étaient écrits que par l'ancien flux
d'exercices (`attempts.submitAttempt`) ; un élève pouvait valider cinq
paliers et rester « niveau 1, 0/50 ». La jauge du camp, le carnet et l'écran
de niveau lisent tous `students.getMyStats`.

## Les étoiles : une seule unité

Trois étoiles par exercice au plus, dix exercices par palier : c'est ce que
l'écran de fin de palier compte (« 27 / 30 »). Le camp, le carnet et le
sentier comptent dans la même unité : pour chaque palier, la meilleure
tentative finie, jamais la somme des rejeux (`progressionRules.bestStarsByPalier`),
plus les étoiles de mission (une par mission, deux de bonus quand tout est
fait). Les nœuds du sentier gardent leur note de un à trois, qui est un
jugement de la moyenne, pas un compte.

Une tentative d'avant, sans résumé, vaut sa note moyenne convertie en étoile
par exercice sur un palier plein ; le rattrapage ci-dessous pose le vrai
résumé.

## La maîtrise d'une thématique

`studentTopicProgress.masteryLevel` est la meilleure moyenne d'un palier
validé, en pourcentage. Les bulletins des parents et des professeurs
(`progress.ts`) en font la moyenne par matière, et le trophée « Maître de »
la lit.

## Les trophées

Un trophée est une ligne de `badges` : une condition (une clé du catalogue de
`convex/badgeRules.ts`) et ses paramètres (`conditionParams`, un seuil, une
heure, une matière). `badgeRules.evaluateBadge` dit, pour un instantané de
l'élève (`badges.buildStudentSnapshot`), la valeur atteinte, la cible et si
le trophée est mérité. Le même calcul sert à l'attribution, à la barre de
progression sur les trophées fermés de la vitrine (`badges.getMyBadgeProgress`)
et au texte du critère (« Valide 10 paliers »).

L'ancien moteur ne connaissait que trois conditions ; le catalogue en base
en utilise une trentaine. Aucun trophée ne pouvait être gagné.

Les conditions jugées : paliers validés, exercices résolus, réponses données,
réussites du premier coup, sans indice, après plusieurs essais, réponses
rapides (total et d'affilée), bonnes réponses en une séance, le week-end,
tôt le matin, tard le soir (heure de Dakar), thématiques terminées ou sans
erreur, matières commencées ou terminées, maîtrise d'une matière, jours de
série, missions accomplies, journées de missions parfaites, plus les trois
clés de l'ancien moteur. `teacher_kudos` (les félicitations d'un professeur)
n'a pas de donnée derrière : la vitrine ne montre pas ce trophée, et
l'administration le signale.

Les seuils qui manquaient au premier catalogue (deux trophées partageant une
condition sans se distinguer) se posent une fois :

```bash
npx convex run badges:normalizeCatalog '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
```

Dans l'administration, créer un trophée demande une condition du catalogue
et, au besoin, un seuil ; les autres réglages gardent leurs défauts.

## La série et les missions

Inchangées : la série vit dans `profiles.preferences.streak` (`streak.ts`),
les missions du jour dans `dailyMissions` (`quests.ts`). Les deux avancent à
la fin d'un palier, et les trophées de série et de missions les lisent.

## Le temps

L'écran de séance envoie le temps passé sur chaque exercice
(`timeSpentMs`, borné à dix minutes côté serveur). Les trophées de rapidité
et le temps du carnet en vivent ; les réponses d'avant valent zéro.

## Rattraper les élèves d'avant

Une fois ce module déployé, sur chaque déploiement :

```bash
npx convex run progression:rebuild '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
npx convex run progression:rebuild '{"confirmDeployment":"impartial-ermine-150"}'
```

Les tentatives finies sans résumé en reçoivent un, les thématiques touchées
sont recalculées, et les trophées de chaque élève sont réexaminés. Par lots
de deux cents tentatives : relancer jusqu'à `remaining: 0`. Le 27 septembre
2026, sur la base de développement, l'élève de test est passée de « niveau 1,
0/50 » à « niveau 2, 6/50 » avec 135 étoiles et dix trophées, pour six
paliers validés.

Les règles sont testées dans `convex/__tests__/progressionRules.test.ts` et
`convex/__tests__/badgeRules.test.ts`.
