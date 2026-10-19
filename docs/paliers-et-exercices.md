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

Une thématique est franchie quand tous ses paliers le sont. La fin d'un
palier passe par `finishPalierAttempt` (`convex/palierAttempts.ts`), que la
séance arrive de l'appareil (`offline/sync:apply`, voir `docs/hors-ligne.md`)
ou de `submitPalier`, que les versions précédentes de l'application appellent
encore. Elle pose alors `studentTopicProgress.completedAt`, que la carte, le
camp et les bulletins lisent. Les requêtes recalculent aussi
ce franchissement depuis les tentatives, pour les données d'avant.

## Des tuiles qui portent le même texte

Deux tuiles d'un exercice peuvent se ressembler : « a » deux fois quand on
relie mangue et yassa à leur son, les deux « n » de « banane » dans un
glisser-déposer, les deux « a » de « papa » dans un ordre à reconstituer.
Les écrans suivaient chaque tuile par son texte. Relier un « a » colorait
les deux, et le second mot restait sans partenaire.

Chaque tuile se suit maintenant par sa position (`lib/exerciseAnswers.ts`),
et l'écran envoie des valeurs. Le serveur les compare comme des
multi-ensembles (`convex/paliers/answerCheck.ts`) : une paire attendue deux
fois doit revenir deux fois, ni plus, ni moins. L'ancienne comparaison, par
ensemble, acceptait une paire répétée à la place d'une autre.

Un glisser-déposer garde sa réponse `{ étiquette: zone }`. Il n'envoie une
entrée par tuile (`[{ text, zone }]`) que si deux copies d'une même étiquette
sont posées dans deux zones différentes. Un serveur pas encore déployé lit ce
tableau comme une réponse fausse, et c'en est presque toujours une.

## Le lecteur de consignes (CI, CP)

Au CI et au CP, l'enfant apprend à lire : il ne lit pas encore la consigne,
alors Pio la lui dit. À l'arrivée de chaque exercice, la consigne se dit
toute seule. Le bouton bleu devant le texte la redit à la demande. Elle se
tait dès que l'enfant répond, ou quand une fenêtre s'ouvre par-dessus.

Les classes concernées sont dans `READING_LEARNER_CLASSES`
(`convex/curriculum.ts`). La classe lue est celle de l'enfant
(`profiles.class`), à défaut celle de la thématique.

La voix est celle du module d'arabe (`convex/voice/elevenlabs.ts`), avec le
même cache : une consigne n'est synthétisée qu'une fois pour tous les
enfants, et ses caractères comptent dans `arabicVoiceUsage`. L'application
télécharge à l'avance la consigne de chaque exercice de la classe, et la dit
ensuite sans réseau (`docs/hors-ligne.md`). Elle n'envoie que des références
d'exercices à `offline/voice:prepareClips`. Le serveur vérifie que
l'exercice appartient à un palier de la classe de l'élève, ou à une
variation de sa tentative, et lit lui-même le texte. `voice/exercisePrompt:speak`
reste en place pour les versions précédentes de l'application. Avant la
synthèse, `convex/voice/speakable.ts` retire les émojis, fait d'un trou
(« ma_an », « 3 + ? = 7 ») une pause et dit les signes de calcul en français.

Sans `ELEVENLABS_API_KEY`, ou sans réseau pour une consigne jamais
téléchargée, le bouton devient gris et l'exercice se joue sans le son. Le lecteur ignore le réglage « sons » de l'élève : ce réglage coupe
les bruitages de récompense, alors que la voix est la consigne elle-même.

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
(thématiques ignorées faute de niveau). `withoutModel` compte, parmi les paliers
à faire, ceux que le code fabrique seul (dix gabarits ou jeux, voir « Les gabarits ») :
ils ne coûtent rien et sont retirés de `estimatedCostUsd`.

Les paliers expirent après un trimestre (`PALIER_TTL_MS`) et se régénèrent à
la demande ; relancer la pré-génération avant la rentrée suffit.

Quand la consigne de génération change (`convex/paliers/prompts.ts`), le
contenu en cache ne la reflète pas. `paliers/pregen:invalidate` passe les
paliers visés en `stale` (par matière, par niveau), et `run` les refait en
remplaçant leurs exercices :

```bash
npx convex run paliers/pregen:invalidate '{"confirmDeployment":"impartial-ermine-150","subjectIds":["<id de la matière>"],"classes":["CM1"]}'
```

`programmeKeys` vise des thématiques précises, par la clé de leur fiche du
programme : quand une fiche gagne des gabarits (voir plus bas), seuls ses
paliers sont à refaire. `dryRun` compte et nomme les thématiques (et dit
`truncated: true` si la base compte plus de paliers que la lecture) :

```bash
npx convex run paliers/pregen:invalidate '{"confirmDeployment":"impartial-ermine-150","programmeKeys":["fr-ci-sons-1","fr-ci-sons-2","fr-ci-sons-3","fr-ci-sons-4","fr-ci-alphabet","ma-ci-nombres-10","ma-ci-calcul-10","ma-ci-nombres-20","ma-ci-trier","ma-ci-espace","ma-ci-formes","ma-ci-mesures","ma-ci-problemes"],"dryRun":true}'
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
valides, et l'écart n'est pas comblé. Sous sept exercices valides sur dix
(`hasEnoughValidExercises`, le seuil de validation), le lot n'est pas servi : le
palier reste `stale`, la génération échoue avec `TOO_FEW_VALID_EXERCISES` et
`pregen:run` le liste dans `failed`. L'écran de fin compte alors ses
étoiles sur le nombre d'exercices joués (`exerciseCount` rendu par
`submitPalier`), trois par exercice, avec le seuil à 7 sur 10 ramené à ce
nombre.

## Une question qui a sa scène à l'écran

Le 12 octobre 2026, un palier de CI demandait « Combien de billes as-tu ? »,
avec pour seul indice « Regarde tes billes. » Il n'y avait aucune bille : le
modèle écrivait pour un manuel illustré, et l'écran de l'enfant n'affiche que
le texte de l'énoncé et les options. L'enfant ne comprenait pas la question,
et à six ans il ne sait pas que la faute est à l'exercice.

Trois protections, dans `convex/paliers/missingVisual.ts` (module pur, tests
dans `convex/__tests__/missingVisual.test.ts`) et `paliers/prompts.ts` :

- **La consigne de génération** dit au modèle que l'enfant ne voit que le
  texte (`SELF_CONTAINED_RULE`) et lui donne les deux façons de faire compter :
  dessiner la collection en émojis dans l'énoncé, la question d'abord
  (« Combien de billes vois-tu ? 🔵🔵🔵🔵🔵 »), ou écrire les données
  (« Awa a 5 billes… »). La voix de Pio retire les émojis : la question doit se
  comprendre sans eux, d'où la rangée après la question. Le premier indice ne
  demande plus d'« observer » : il ne renvoie qu'à ce que l'énoncé écrit ou
  dessine. La règle vaut pour les paliers, « J'en veux encore » et les
  variations.
- **Un filtre à la génération** écarte l'exercice dont l'énoncé renvoie à ce
  qui n'est pas là : « combien de billes as-tu / vois-tu » sans émoji ni
  donnée écrite, « regarde l'image », « ci-dessous », « observe tes billes ».
  Il ne touche ni un fait qu'on sait sans rien voir (« Combien de jours dans une
  semaine ? »), ni le corps de l'enfant (« Regarde ta main »), ni une histoire
  (« Fatou compte ses mangues… »). Les indices pendants d'un exercice par
  ailleurs valable sont retirés. Un palier peut donc compter neuf exercices.
- **Un compte des émojis.** Un modèle de langage compte mal ses émojis : quand
  l'énoncé demande « combien » devant une seule rangée d'objets identiques, sans
  chiffre, la réponse attendue est le nombre d'émojis réellement écrits (QCM :
  l'option qui le vaut ; sinon l'exercice est écarté). Deux sortes d'objets, deux
  rangées ou un chiffre dans l'énoncé : le compte est ambigu, il n'est pas
  vérifié.

Ce que l'écran montre en plus de l'énoncé compte comme scène : des tuiles ou
des options en émojis (« Glisse chaque image dans la bonne case » avec 🍎 et 🐟
en étiquettes) lèvent un renvoi à « l'image » et gardent les indices qui s'y
réfèrent (`displayedText`, `findMissingVisualOnScreen`). Des options qui sont
des chiffres ne sont pas des billes : « Combien de billes as-tu ? » reste
écarté.

**Deux mécanismes, dans cet ordre.** À la génération, `toPersistedShape` passe
d'abord par `visualRepair.ts` : un énoncé de comptage sans émojis reçoit autant
d'émojis que la réponse, une rangée au mauvais compte est refaite, un
appariement mot ↔ image dont l'« image » est un texte-substitut (« image_mangue »)
reçoit son émoji. Ce qu'il ne sait pas réparer est écarté. Puis le garde-fou
ci-dessus écarte ce qui reste (« Combien de billes as-tu ? », « Regarde tes
billes ») et revérifie le compte. Écarter après avoir essayé de réparer : le
garde-fou seul aurait perdu des exercices que la réparation sauve.

Les paliers déjà en base se passent à ces deux mécanismes, sans appel au modèle :
`pregen:repairVisual` répare sur place ce qui se répare (et signale le reste, son
palier repasse en `stale`), puis `pregen:auditExercises` (voir plus bas) signale
ce qui reste sans scène (`visual_missing`).

```bash
npx convex run paliers/pregen:repairVisual '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
npx convex run paliers/pregen:repairVisual '{"confirmDeployment":"impartial-ermine-150"}'
npx convex run paliers/pregen:run '{"confirmDeployment":"impartial-ermine-150","classes":["CI","CP"],"limit":20}'
```

Un enfant qui a une tentative ouverte sur un palier invalidé la reprend sur les
nouveaux exercices : à réserver au développement ou à une rentrée.

La description de la thématique « Les nombres jusqu'à 10 » (CI) dit désormais
que la collection est dessinée en émojis. Une thématique déjà chargée garde sa
description en base (`programme/seed` ne recharge pas) : la règle de la
consigne de génération suffit, elle ne dépend pas de la description.

## Le contrôleur structurel de chaque exercice

Un parent a signalé, outre les billes absentes, « beaucoup d'erreurs » : des
images qui manquent, des phrases incomplètes, des options incorrectes. Les
gardes précédentes (`missingVisual`, `mathRepair`, `dragDropRepair`) répondent
chacune à un défaut déjà vu ; `convex/paliers/exerciseAudit.ts` les range
derrière une seule question : cet exercice est-il jouable et sensé ? Module
pur, sans Convex et sans appel au modèle ; tests dans
`convex/__tests__/exerciseAudit.test.ts`.

`auditExercise({ type, prompt, payload, answerKey, hints, class, subject })`
rend une liste de défauts `{ code, severity, detail }`, au plus un par code,
les `blocking` d'abord :

- **`blocking`** : l'exercice est injouable ou faux à coup sûr. À la
  génération, il est écarté du lot ; en base, il est signalé.
- **`warning`** : il se joue, mais il est maladroit. Rien n'est écarté ; la
  génération les compte.

| Domaine | `blocking` | `warning` |
| --- | --- | --- |
| Énoncé | `prompt_empty`, `prompt_truncated` (finit sur « de », « pour », une virgule, une élision), `prompt_dangling_colon` (réponse courte qui finit par « : »), `visual_missing` (scène absente, voir plus haut ; y compris un démonstratif sans chose montrée : « Quel est le nom de cette forme ? » sans émoji, ni chiffre, ni mot écrit), `payload_malformed`, `short_answer_in_ci` (réponse tapée au CI) | `prompt_too_short`, `prompt_ends_midphrase` (finit sur « le », « et »…), `prompt_unclosed_pair` (parenthèse ou guillemet jamais fermé), `prompt_too_long_for_class`, `hole_without_hole` (« Complète » sans `___` ni `?`) |
| QCM | `qcm_options_few` (moins de 2), `qcm_correct_index_out_of_range`, `qcm_correct_option_empty`, `qcm_correct_option_duplicated`, `qcm_equivalent_options_with_correct` (« 5 » et « cinq », « 0,5 » et « 1/2 »), `qcm_answer_key_mismatch` (la réponse écrite est une autre option que celle désignée), `qcm_emoji_sum_mismatch` (« 🥭🥭 + 🥭 » avec « 2 » pour option juste ; émojis tous identiques seulement), `qcm_sound_ambiguous` (« Quel mot a le son [é] ? » avec « été » et « fumée » ; « le son du mot « fumée » » ou « Quel son entends-tu dans 'fumée' ? » avec « f » et « u » ; « Associe les mots avec le bon son » où un mot a le son d'une autre paire (fumée-f et fumée-é) ; entre crochets, [u] se lit comme la lettre « u » et comme le son « ou » (alphabet phonétique des fiches), [y] est le « u », [e] le « é », [ɛ] le « è », et la question est signalée si l'une des lectures a deux bonnes réponses ; seuls [é], [è], [ou], [u], [f], [ch] sont connus, `convex/paliers/sounds.ts` ; les questions sur la place du son sont laissées de côté), `shape_emoji_mismatch` (🟦 est un carré : « rectangle » pour « Quel est le nom de cette forme ? 🟦 », ou `🟦~rectangle` dans un appariement ; QCM et appariement) | `qcm_options_many` (plus de 6), `qcm_option_empty`, `qcm_option_duplicated`, `qcm_option_case_twin` (casse ou accents, sauf en français), `qcm_equivalent_options`, `qcm_answer_key_unrelated`, `qcm_catch_all_option` (« Toutes les réponses », « Aucune de ces réponses », « Les deux »), `qcm_correct_option_stands_out` (la bonne option est bien plus longue) |
| Association | `match_pairs_invalid` (moins de 2), `match_side_empty`, `match_pair_identical` (« Relie chaque mot à son image » avec `moto ~ moto` ; seulement quand l'énoncé parle d'image, jamais en Anglais : la région « Dakar » et la ville « Dakar » sont une vraie paire) | `match_pairs_count` (hors de 3 à 6), `match_pair_duplicated`, `match_left_repeated`, `match_right_repeated` (deux sons identiques se relient pourtant à la même tuile : jamais bloquant) |
| Ordre | `order_too_few` (moins de 2), `order_item_empty`, `order_spells_other_word` (« pour écrire 'poule' » avec les lettres e-l-o-p-u : la suite doit écrire le mot cité), `order_syllable_without_vowel` (« ng », « ss », « p » donnés comme syllabes), `order_without_criterion` (« Mets ces animaux dans l'ordre » : des animaux, fruits, couleurs, formes, villes, objets, lieux n'ont pas d'ordre naturel ; il faut un critère : « alphabétique », « du plus petit au plus grand », « de l'ouest à l'est »), `order_words_without_criterion` (« Mets ces mots dans l'ordre : ear, hand, eye » : une liste de mots sans phrase à former ni critère), `order_spatial_without_scene` (« Range ces objets de gauche à droite : Livre, Crayon, Cahier » sans scène à l'écran), `order_shapes_by_size` (des formes rangées par taille : un cercle ou un carré n'ont pas de taille), `order_proximity_without_reference` (« du plus proche au plus loin » sans dire de quoi), `order_syllables_without_word` (« Mets ces syllabes dans l'ordre : ma, pa, na » : aucun mot à former ; levé par « pour former un mot », « pour écrire », une image ou un critère), `order_prompt_mentions_zones` (« Place chaque syllabe dans la bonne zone » pour un ordre : l'écran n'a pas de zones) | `order_few` (2), `order_item_duplicated`, `order_already_sorted` (suite déjà rangée alphabétiquement ou par ordre croissant, sans que l'énoncé dise quel ordre) |
| Glisser-déposer | `dragdrop_zones_few`, `dragdrop_items_few`, `dragdrop_generic_zone` (« Zone A »), `dragdrop_zone_duplicated`, `dragdrop_zone_missing`, `dragdrop_label_without_zone` | `dragdrop_empty_zone`, `dragdrop_item_empty` |
| Réponse courte | `short_answer_no_answer` | `short_answer_empty_accepted`, `short_answer_answer_in_prompt` (hors nombres : « 10 − 3 + 3 » a pour réponse 10) |
| Phrase à trous | `fill_blank_invalid` (`validateFillBlank` refuse : trous et jeux de mots en nombre différent, bonne réponse absente des mots), `fill_blank_word_unknown` (CI et CP : le trou d'une lettre ou d'une syllabe écrit un mot absent de `paliers/knownWords.ts`, « ___ngue » avec « m »), `fill_blank_word_unreadable` (« Le mot est ___ (pa, ra, ni) » : le mot n'est écrit nulle part), `fill_blank_article_gender` (« Le ___ » avec « poule », « Un ___ » avec « mangue » : l'article collé au trou n'est pas du genre du mot ; seuls les noms de `paliers/genders.ts`, dont le genre est sûr, sont jugés ; « mon, ton, son » devant une voyelle sont laissés) | `fill_blank_off_limits` (plus de 4 trous, moins de 2 ou plus de 5 mots) |
| Indices | | `hints_few` (moins de 2), `hint_empty`, `hints_duplicated`, `hint_gives_answer` (le 1er écrit le bon choix sans parler des autres), `hint_dangling_visual` |
| Texte | `text_placeholder` (« undefined », « null », « NaN »), `text_replacement_char` (�) | `text_double_space`, `text_markup` (`**`, `#`, backtick, balise), `text_english_in_young_class` (anglais dans un énoncé de CI ou de CP hors Anglais), `text_foreign_currency` (euros, dollars : FCFA seul) |
| Images (CI) | | `ci_tile_without_picture` (en CI, une tuile « article + un nom » dont la chose n'a pas d'image au catalogue ; voir « Des images sur les tuiles (CI) » : jamais bloquant, et l'écran retire lui-même les images quand l'énoncé demande de lire, de décoder ou de nommer) |

**La prudence est la règle.** Un faux positif écarte un bon exercice et le
palier se refait pour rien : un défaut n'est `blocking` que si aucun exercice
correct ne peut l'avoir. Le test fait respecter deux barrières : la banque
écrite à la main de la vitrine (`components/landing/demo/bank`, 274 exercices)
ne produit aucun défaut, et une trentaine d'exercices corrects, de toutes les
matières et du CI au CM2, non plus. Les homophones (« a » et « à », « un » et
« une ») ne sont pas des doublons en français. Le plafond de longueur d'énoncé
(`PROMPT_WORD_CEILING`) est environ le double de celui de la consigne au CI et
au CP : la banque écrite à la main atteint déjà 16 et 21 mots, et à partir du
CE1 l'énoncé porte parfois un texte à lire.

**À la génération** (`toPersistedShape`, dans `paliers/index.ts`), le
contrôleur est la dernière porte : un exercice du modèle avec un défaut
`blocking` est écarté du lot, comme celui qui n'a pas sa scène. En
mathématiques, le calcul répare d'abord (`mathRepair`), puis le contrôleur
juge : une réponse que le calcul corrige ne coûte pas l'exercice. Les
avertissements ne retirent rien. Le palier garde deux totaux dans
`factCheckResults` : `auditRejected` (exercices écartés) et `auditWarnings`
(exercices gardés avec un avertissement), deux champs optionnels, absents des paliers déjà écrits. Le détail par code est dans les
journaux (`[audit] exercice écarté : …`). Un lot peut donc compter moins de dix
exercices du modèle. La consigne de génération (`QUALITY_RULE`, dans
`paliers/prompts.ts`) nomme les défauts les plus fréquents pour que le modèle
ne les écrive pas.

**Sur l'existant**, `pregen:auditExercises` passe CHAQUE exercice de CHAQUE
palier au contrôleur, un par un, sans appel au modèle :

```bash
npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"impartial-ermine-150","dryRun":true}'
npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"impartial-ermine-150","dryRun":true,"limitSamples":2000}'
npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"impartial-ermine-150"}'
```

Le résumé donne `checked` (exercices vérifiés), `exercisesWithDefects`,
`blockingExercises`, `warningOnlyExercises`, `byCode` (le nombre d'exercices
touchés par chaque code, du plus fréquent au plus rare), `paliersTouched`
(paliers qui ont au moins un exercice bloquant), `paliersInvalidated` et
`samples` : 30 exemples par défaut, `limitSamples` jusqu'à 2 000 pour sortir
TOUS les exercices défectueux. Chaque exemple porte `exerciseId`, `palierId`,
`class`, `subject`, `type`, `prompt`, `codes` et `blockingCodes`, les
exercices bloquants d'abord. `dryRun` ne touche à rien. Sans `dryRun`, un
exercice bloquant est marqué `needsManualReview` et son palier repasse en
`stale`, refait à la prochaine ouverture ou par `pregen:run`. Les avertissements
ne modifient rien. Un enfant qui a une tentative ouverte sur un palier
invalidé la reprend sur les nouveaux exercices : à réserver au développement ou
à une rentrée. Lancer `repairMath`, `repairDragDrop` et `repairVisual` avant :
ils réparent sur place ce que l'audit ne ferait que signaler. Seuls les
exercices rattachés à un palier sont audités (200 au plus par palier), c'est-à-dire
tout ce que l'élève joue.

**Ce que le contrôleur ne voit pas.** Il juge la forme, pas le fond : une
erreur de fait (« la capitale du Sénégal est Thiès » dans un QCM bien formé),
une faute d'orthographe ou de grammaire, un énoncé fluide mais absurde, une
bonne réponse fausse dont l'option désignée est cohérente avec la réponse
écrite, une question ambiguë dont deux options se défendent, un niveau trop
facile ou trop difficile, un texte qui blesse. Seul le calcul est vérifié sur le
fond, en mathématiques (`mathRepair`). Le reste se relit : c'est le rôle de
`needsManualReview` et de `qaStatus`.

## Des images dans l'énoncé

Certaines questions demandent une image (« Quel animal vois-tu ? »). L'écran
n'affiche que le texte : sans image, la question est incompréhensible. Le
modèle qui écrit les exercices ne crée pas d'image, car le serveur de
production n'a pas accès au studio d'images. Il **choisit** dans un catalogue
fermé (`lib/exercise-images.ts`), par identifiant, dans `payload.image`.

- L'écran affiche `public/exercices/<id>.webp` au-dessus de l'énoncé
  (`components/exercises/ExerciseImage.tsx`, passée par `ExercisePrompt` à tous
  les types d'exercice). La hauteur est bornée (10 rem sur téléphone) pour ne
  pas repousser les options. Les fichiers sont ceux du site : ils partent dans
  l'application, donc s'affichent aussi hors ligne.
- Un identifiant hors catalogue tombe (`validatePayload`, `sanitizePayload`). Une
  image du catalogue compte comme une scène dessinée pour tous les gardes
  (`displayedText`) : « Regarde l'image » n'est plus refusé quand l'image est
  là, et l'est toujours quand elle manque. Elle ne lève pas le refus de
  « Combien de billes as-tu ? » : **les images ne servent pas à compter**, un
  générateur d'images ne sait pas dessiner « exactement 7 billes ». Le comptage
  reste en émojis, vérifiés par le code.
- La consigne de génération (`imagesRule`, `paliers/prompts.ts`) liste le
  catalogue, au plus trois exercices avec image par palier. Tant que le
  catalogue est vide, elle n'en dit rien : elle ne promet pas ce qui n'existe
  pas.

**Ajouter une image**

1. La fabriquer avec le serveur MCP « studio » (`generate_image`). Modèle
   conseillé : `recraft/recraft-v4.1` (0,035 $ par image), `mode: "manual"`,
   `aspectRatio: "1:1"`. Demander l'estimation avant (`estimate_cost`). Gabarit :
   *Children's picture-book illustration of a single <sujet>, flat vector style,
   simple rounded shapes, thick soft outline, bright warm colors, centered, the
   whole subject fully visible, plain pure white background, no text, no
   letters, no shadow, no other objects.* Un seul sujet, jamais de texte dans
   l'image, jamais plusieurs objets à compter. **La regarder** avant de la garder :
   un modèle d'images se trompe (patte en trop, sujet coupé).
2. La convertir : `node scripts/add-exercise-image.mjs <fichier> <identifiant>`
   écrit `public/exercices/<identifiant>.webp` (512 × 512, fond blanc) et
   affiche l'entrée à coller dans `EXERCISE_IMAGES`.
3. Rédiger l'entrée : `alt` (ce que lit un lecteur d'écran, sans « image de »)
   et `about` (le sujet, ce que le modèle lit pour choisir).
4. `pnpm exec vitest run lib/__tests__/exercise-images.test.ts` : chaque entrée
   a son fichier, chaque fichier son entrée.

Les paliers déjà en base ne changent pas : pour qu'un palier utilise les
nouvelles images, il faut le régénérer (`pregen:invalidate` puis `pregen:run`).

**État** : 20 images, fabriquées le 13 octobre 2026 avec le serveur « studio »
(`recraft/recraft-v4.1`, 0,035 $ pièce, 0,81 $ en tout avec trois images refaites) :
des animaux (chat, chien, poisson, poule, vache, mouton, éléphant, lion), des
fruits (mangue, banane, orange, pastèque) et des objets ou lieux du quotidien
(ballon, livre, crayon, maison, baobab, soleil, pirogue, voiture). Le chien,
l'éléphant et la mangue ont été refaits : un chien pris pour un ourson, un
éléphant pris pour un tapir, une mangue prise pour un piment. La pirogue se lit
comme un bateau : ne pas lui demander de se distinguer d'une barque.

Le script `scripts/add-exercise-image.mjs` met aussi à blanc pur les formes
fantômes quasi blanches que laissent les générateurs dans le fond (de 246 à 254
sur 255). Elles sont invisibles sur une page blanche et visibles sur une carte
colorée. `e2e/exercise-images.spec.ts` vérifie que le site sert chaque image.

**Ce qui reste à faire** : régénérer les paliers pour que le modèle utilise ces
images (`pregen:invalidate` puis `pregen:run`), et regarder un échantillon : le
modèle peut ne pas choisir d'image, ou en choisir une qui ne va pas avec la
question. Rien ne vérifie que l'image choisie correspond à l'énoncé et à la bonne
réponse : un QCM « Quel animal vois-tu ? » avec l'image du chat et la bonne
réponse « Chien » est bien formé pour le contrôleur. C'est à relire.

Les tuiles des exercices ont leur propre catalogue d'images, distinct de
celui-ci : voir la section suivante, « Des images sur les tuiles (CI) ».

## Des images sur les tuiles (CI)

Un enfant de CI a six ans et ne sait pas encore lire. Une tuile « Lion »,
« La table » ou « midi » ne lui dit rien, et une tuile « 🐁 la souris » ne lui
montre qu'un émoji minuscule collé au mot. L'émoji est écrit dans le texte de
l'option par le gabarit ou par le modèle, et beaucoup de tuiles n'ont que le
mot. Le propriétaire a joué une séance de CI en production et l'a dit
(19 octobre 2026) : pour ranger des animaux du plus grand au plus petit,
l'élève doit voir de quel animal on parle, et pour les classes de CI il faut
toujours mettre l'image de référence.

**La règle.** En CI, toute tuile qui nomme une chose (animal, aliment, plante,
partie du corps, objet, véhicule, signal de route, lieu, solide, moment du
jour, forme) montre une vraie image de référence, un dessin propre, et garde
son nom écrit. L'image ne remplace pas le mot : l'enfant reconnaît la chose, et
le mot reste là pour qu'il apprenne à le lire.

**Une règle permanente.** Le propriétaire a demandé (19 octobre 2026) que la
règle ne dépende de la mémoire de personne : elle est écrite dans les
instructions de génération et tenue à quatre endroits, du plus tôt au plus
tard. À ne pas affaiblir pour faire passer un contenu.

1. Les instructions de génération. `tilePicturesRule()`
   (`convex/paliers/prompts.ts`) lit le catalogue (`ITEM_IMAGES`) et écrit au
   modèle, pour la classe CI seulement, la liste fermée des mots qu'il peut
   mettre sur une tuile, groupe par groupe, et ce qu'il doit en faire : nommer
   une chose avec ces mots exactement, au singulier ; ne nommer aucune chose
   qui n'y est pas ; ne pas mêler, dans un même exercice, des choses de la liste
   et d'autres (l'écran retirerait toutes les images) ; garder les catégories
   (« Fruits », « Naturel ») en mots, sans image ; garder l'émoji devant un mot
   anglais ; et les exceptions où l'écran retire lui-même l'image. Elle est
   ajoutée à `readingLearnerRules("CI")`, donc aux trois consignes système (base,
   personnalisée, variation). La liste suit le catalogue toute seule : une image
   ajoutée est annoncée au modèle à la génération suivante, rien n'est à
   recopier.
2. Le contrôleur. `ci_tile_without_picture` (`convex/paliers/exerciseAudit.ts`)
   est un avertissement : en CI, une tuile de QCM, de mise en ordre,
   d'association ou de glisser-déposer qui a la forme « article + un nom »
   (« le diplodocus ») sans image au catalogue. Il ne bloque jamais (l'exercice
   reste jouable), il se lit dans le rapport d'audit et dit quel mot manque. Il se
   tait quand l'énoncé demande de lire, de décoder ou de nommer, parce que
   l'écran retire alors les images lui-même, et il ne juge ni un mot seul (un
   prénom, une syllabe), ni un groupe de plusieurs mots, ni un verbe à
   l'infinitif (« le cacher »). Sur l'export de production du 19 octobre 2026,
   il signalait 4 exercices avant la vague 2 (de vrais manques), et aucun après.
3. Les tests des gabarits. `convex/__tests__/templatePictures.test.ts` casse si
   un gabarit du code (les listes de choses de `convex/paliers/games/things.ts`,
   les moments de la journée, les noms des formes et des solides) nomme une
   chose sans image, et fait passer plus de mille exercices fabriqués dans le
   contrôleur. Un gabarit qui ajoute une chose à sa liste doit d'abord lui
   fabriquer son image.
4. Le catalogue lui-même. `lib/__tests__/item-images.test.ts` : chaque entrée a
   son fichier, chaque fichier son entrée, un mot ou un émoji ne va qu'à une
   seule image. `AGENTS.md` porte la règle pour tout agent qui touche au contenu.

Quand une chose n'a pas d'image : la fabriquer d'abord (« Ajouter une image »,
plus bas), l'ajouter au catalogue, PUIS écrire le contenu qui la nomme. Jamais de
tuile sans image en CI, jamais de nom hors catalogue « pour l'instant ».

**Le principe : l'image se résout à l'affichage.** Aucune donnée ne change. Le
texte d'une tuile reste la chaîne que le serveur a envoyée, et la réponse qui
part à `onSubmit` ne change jamais d'un caractère. Rien n'est écrit dans
`convex/` et aucun palier n'est régénéré : l'écran lit le texte de la tuile,
reconnaît la chose nommée et va chercher son image dans un catalogue fermé. Le
catalogue est fermé pour deux raisons. Le serveur de production n'a pas accès
au studio d'images : une image se fabrique à l'avance, et on la regarde avant
de la garder. Et une image posée sur une tuile qui ne dit pas ce qu'elle
montre est pire que pas d'image : une tuile n'est reconnue que si toute sa
chaîne est un nom du catalogue.

**Où ça vit**

- Le catalogue est `lib/item-images.ts` (`ITEM_IMAGES`, un module pur). Il
  compte 168 entrées : 162 images fabriquées au studio et six formes dessinées
  par le code (carré, rond, triangle, rectangle, cœur, étoile), soit 25
  animaux, 33 aliments et plats, 9 plantes et parties de plante, 14 parties du
  corps, 34 objets, 6 vêtements, 7 transports, 4 signaux de route, 21 lieux et
  éléments de la nature, 4 solides, 5 moments du jour et 6 formes. Chaque
  entrée a son fichier `public/objets/<id>.webp` (384 × 384, fond blanc). Les
  noms FRANÇAIS sont dans `words`, les noms ANGLAIS à part dans `english` (un
  mot anglais seul n'est pas fiable : voir plus bas) ; `emoji` est la liste
  prudente des glyphes de la chose (le repli d'une tuile « [chien] Rex »),
  `guardEmoji` la liste large que seuls les garde-fous lisent (les ronds, les
  carrés, le dé, la brique, la boîte de conserve, la goutte). Ce n'est pas le
  catalogue des images d'énoncé (`lib/exercise-images.ts`, `public/exercices/`,
  `ExerciseImage`) : celles-là illustrent une question et c'est le modèle qui les
  choisit, celles-ci nomment une tuile et le modèle n'en choisit aucune.
- Le résolveur est `lib/item-pictures.ts`, un module pur sans React.
  `pictureForTile` reconnaît la chose nommée par le texte d'une tuile seule ;
  `recognizeTiles` y ajoute ce qu'un GROUPE de tuiles apprend ; 
  `explainTilePictures` y ajoute les garde-fous et dit lequel a joué ;
  `resolveTilePictures` en rend les images, toujours dans un tableau de la même
  longueur que les tuiles, avec `null` pour une tuile sans image.
- La porte est `PICTURE_TILE_CLASSES` (`["CI"]`, même fichier) : seules ces
  classes voient les images. Les deux séances (`online-session.tsx` et
  `offline-session.tsx`) entourent l'exercice d'un `ItemPicturesProvider`
  (`components/exercises/item-pictures.tsx`) réglé par `isPictureTileClass`,
  comme `PromptReaderProvider` l'est par `isReadingLearnerClass`. Les deux
  lisent la même classe : celle de l'enfant, à défaut celle de la thématique.
  Hors CI, `enabled` est faux : le DOM est celui d'avant, sans état de plus.
- Les écrans câblés sont le QCM (`QcmExercise`), la mise en ordre
  (`OrderExercise`), l'association (`MatchExercise`) et le glisser-déposer
  (`DragDropExercise`, pour les étiquettes et pour les cases qui nomment une
  chose). Chacun résout les images de ses tuiles avant de dessiner, par
  `useTilePictures(tuiles, contexte)`, un appel par groupe de tuiles : les
  options, les étiquettes, chaque côté d'une association, les cases. Le
  contexte (`TileContext`) est ce que l'écran sait de l'exercice et que les
  garde-fous lisent : l'énoncé, l'image d'énoncé (`payloadImage`), les tuiles
  « que des émojis » de l'autre côté, les textes de l'autre groupe, et `choice`
  pour un QCM. L'image est dessinée par `ItemPicture`, la pastille ;
  l'association et le glisser-déposer la posent par
  `components/exercises/tile-picture.tsx`.
- Ce qui n'est pas touché : l'écoute (`ListenExercise`), le texte à trous, la
  réponse courte, les motifs, le pixel-art, le mélange de couleurs, les tuiles
  d'émojis (comptage, frises, motifs) et les images d'énoncé. La vitrine et
  les aperçus des professeurs n'ont pas de fournisseur : ils ne changent pas.

**Comment une tuile est reconnue** (`pictureForTile`, sur le texte seul)

1. On retire l'émoji de tête, l'article (le, la, l', les, un, une, des, du, de
   la, de l') et la ponctuation finale, puis on normalise (minuscules, sans
   accents, « œ » devenu « oe », apostrophe droite, trait d'union
   typographique ramené au trait d'union, caractères invisibles ôtés) et on
   cherche le mot dans les `words` du catalogue, le singulier français d'abord,
   l'anglais (`english`) ensuite. La correspondance porte sur toute la tuile,
   jamais sur un morceau : « Le baobab », « L'éléphant » et « Âne » reçoivent
   leur image ; « Fruits du baobab », « les chats » et « 3 pommes » ne
   reçoivent rien.
2. Un mot ambigu (`ambiguousBare`) n'a son image qu'avec un article (« une
   orange ») ou avec l'émoji de la chose en tête (« 🍊 orange »). Seul,
   « orange » peut être la couleur, « Pierre » le prénom, « ferme » et « marche »
   (le marché, sans son accent) des verbes, « tente » aussi.
3. Repli : une tuile « 🐕 Rex » ou « 🍎 une belle pomme », dont le mot n'est pas
   au catalogue, reçoit l'image de son émoji de tête. Il faut un seul émoji en
   tête, aucun chiffre ni nombre écrit en lettres dans le reste (« 🍎 trois
   pommes » ne reçoit rien : une seule pomme dessinée mentirait) et trois mots
   au plus.
4. Une tuile qui n'est que des émojis, des chiffres ou des signes n'est jamais
   changée : le comptage, les frises et les motifs restent en émojis.

**Ce que le groupe de tuiles ajoute** (`recognizeTiles`)

Une tuile seule ne sait pas toujours ce qu'elle est ; ses voisines le lui disent.

- Un NOM ANGLAIS demande un témoin. « pen » est le stylo des leçons d'anglais
  et la première syllabe de « Penda » : quatre exercices de syllabes du CI de
  production montraient un stylo sur « pen ». Un nom anglais reçoit son image si
  l'émoji de la chose le précède, ou si un autre nom anglais du MÊME groupe
  l'accompagne (« cat, dog, fish » est une leçon d'anglais). Seul entre « lo » et
  « lou », il se tait. « pen » a de plus quitté le catalogue (le stylo se dit
  « stylo »), comme « rock » et « football », et « moto » n'est plus le scooter :
  la moto a sa propre image.
- Un mot ambigu que son groupe éclaire (`bareInGroup`) prend son image. L'orange
  seule parmi des aliments (« pomme, orange, banane » : « Mets ces fruits dans
  l'ordre alphabétique ») est le fruit ; parmi des couleurs elle ne reçoit rien.
  « Pierre » parmi des lieux et de la nature (« Pierre, Seau, Pirogue, Sable ») est
  la pierre ; parmi des prénoms elle ne reçoit rien. « Ferme » ou « Marche »
  parmi d'autres lieux (« la maison », « l'arbre ») sont la ferme et le marché ;
  seuls au milieu de verbes, ils ne reçoivent rien. Sans cela, la seule tuile
  sans image au milieu des fruits de la liste désignait celle-là.

**Les garde-fous** (`explainTilePictures`, titres dans `TILE_GUARDS`)

Une image ne doit jamais donner la réponse d'un exercice qui demande de relier
un mot à une image, ou de lire. Chaque garde-fou retire toutes les images de
l'exercice d'un coup, jamais une seule : épargner la bonne tuile et montrer les
autres la désignerait par élimination. Dans l'ordre :

- **a.** L'énoncé demande de lire (`READING_PROMPT` : lis, lisez, relis,
  épelle, lecture, écrit), de décoder (`DECODING_PROMPT` : la syllabe, la lettre,
  la majuscule, « commence par », « finit par »), de ranger les mots d'une phrase
  (`SENTENCE_PROMPT` : « Remets les mots dans l'ordre », « Place les mots dans la
  bonne phrase »), de nommer ce qu'il montre (`NAMING_PROMPT` : « Quel est le nom
  de cette forme ? », « Comment s'appelle… ») ou de traduire (`TRANSLATION_PROMPT` :
  « en anglais », « comment dit-on », « que veut dire »). Les consignes de lecture
  du CI ne disent presque jamais « lis » : elles disent « syllabe » et « commence
  par ». L'ordre alphabétique de mots n'est pas une phrase à ranger (l'image ne dit
  rien de l'ordre des lettres).
- **b.** L'énoncé contient l'émoji d'une chose du catalogue et une tuile nomme
  cette même chose (l'énoncé montre un éléphant, une option dit « l'éléphant ») :
  aucune tuile n'a d'image. L'émoji se lit LARGE (`guardEmoji`) : le carré noir,
  le rond rouge, le triangle, le dé, la brique, la boîte de conserve ne sont pas
  des émojis de tête (« 🔴 rouge » est la couleur), mais ils trahissent la forme
  ou le solide dont l'énoncé demande le nom.
- **c.** Association : un côté n'est fait que d'émojis (une tuile « que des
  émojis »), et le mot de l'autre côté nomme la même chose que l'un d'eux. Le
  côté des mots n'a pas d'image, le côté des émojis reste tel quel. Mettre
  l'image sur le mot donnerait la paire.
- **d.** QCM (`choice`) : une tuile qui porte des lettres n'a pas d'image alors
  qu'une autre en a une. Un QCM n'a qu'une bonne tuile, et celle qui se détache du
  lot, la seule illustrée ou la seule nue, la désigne par élimination. Sur
  l'export de production, 43 QCM sur 452 avaient des images partielles, et dans 15
  la bonne réponse était la seule tuile illustrée (8) ou la seule tuile nue (7) :
  les images d'un QCM sont toutes ou aucune. Une tuile sans lettre (un nombre, des
  émojis) ne compte pas. L'association, le glisser-déposer et la mise en ordre n'ont
  pas de bonne tuile à désigner : leurs images partielles restent.
- **e.** L'énoncé a sa propre image (`payload.image`, le catalogue des images
  d'énoncé) et c'est celle d'une tuile : dix-neuf des vingt identifiants de
  `lib/exercise-images.ts` sont aussi des identifiants de tuile (chat, chien,
  lion, banane…). Le chat sur l'énoncé et « le chat » parmi les options, c'est la
  réponse sur la bonne tuile. Aucun exercice de production n'a encore d'image
  d'énoncé ; le garde-fou attend le jour où le modèle en choisira.
- **f.** Association et glisser-déposer : une même image des deux côtés (sur les
  étiquettes et sur les cases). « Arachide » en face de « Cacahuète » se relient
  par leur dessin identique, sans savoir ce que c'est.

Sur l'export de production (850 exercices jouables dans les quatre types), les
garde-fous retirent les images de 91 exercices : 35 par a (dont 18 de syllabes,
12 de « Quel est le nom… », 5 de phrases à ranger), 24 par b, 17 par c, 12 par d
et 3 par f ; plus aucun QCM n'a d'images partielles, et les 36 exercices où
l'image donnait la réponse sont tous coupés. Le garde-fou b coupe aussi 24
exercices de position (« Regarde la rangée… Lequel est le premier ? ») où l'image
n'aurait rien donné, puisque toutes les options sont dans la rangée : c'est la
décision de départ (aucune tuile n'a d'image quand l'énoncé montre l'émoji d'une
option), que le propriétaire peut assouplir. Le script
`scripts/item-pictures-coverage.mjs` le calcule, avec une proposition
d'assouplissement (S1) qu'il ne fait pas lui-même.

**Ce que l'enfant voit**

L'image est posée dans une pastille blanche arrondie, comme l'autocollant d'un
imagier (`ItemPicture`), avec une ombre basse et un flanc crème : elle se
détache des tuiles crème comme des tuiles teintées. La pastille suit l'écran,
parce que le budget de hauteur du jeu ne bouge pas : un QCM à quatre tuiles
reste entièrement au-dessus du dock de 360 × 640 à 820 × 1180, une mise en
ordre de quatre tuiles tient à 390 × 844, et une association ou un
glisser-déposer qui tenait au-dessus du dock sans image y tient avec.

- QCM : 72 px sur une tablette (plus de 960 px de haut), 56 px de 820 à 960 px,
  44 px de 668 à 819 px, 36 px de 481 à 667 px, 32 px en paysage (480 px de
  haut ou moins). La tuile d'émoji, elle, ne change pas, en paysage non plus.
- Mise en ordre : 44 px jusqu'à quatre tuiles (36 px sur un écran court,
  667 px ou moins), 36 px au-delà.
- Association et glisser-déposer : en pile sous 640 px de large (36 px, 32 px
  dès quatre paires ou quatre étiquettes), à côté du mot à partir de 640 px
  (44 px, 56 px au-delà de 960 px de haut, 36 px sur un téléphone couché).
  Une colonne d'association qui montre des images serre ses tuiles de 12 px à
  8 px. `components/exercises/tile-picture.tsx` dit pourquoi.

Ce que cela coûte, mesuré dans Chromium le 19 octobre 2026 dans la séance
factice (dock compris) : la marge entre la dernière tuile et le dock, en pixels,
avec images puis sans (négative : la tuile passe sous le dock, la page défile).

| Écran | Association, 4 paires | Glisser-déposer, 4 étiquettes |
| --- | --- | --- |
| 360 × 640 | -85 / -47 | -66 / -41 |
| 375 × 667 | -42 / -4 | -43 / -18 |
| 375 × 812 | 15 / 53 | 6 / 31 |
| 390 × 844 | 41 / 79 | 32 / 57 |
| 412 × 915 | 99 / 137 | 90 / 115 |
| 768 × 1024 | 113 / 149 | 84 / 164 |
| 1024 × 768 | 20 / 20 | 35 / 35 |
| 844 × 390 (couché) | -145 / -145 | -122 / -122 |
| 820 × 1180 | 269 / 305 | 240 / 320 |
| 390 × 844 avec encoche (l'app iPhone) | -33 / 5 | -42 / -17 |

Sur un téléphone debout, les images ajoutent au plus 38 px de défilement à
l'association et 25 px au glisser-déposer ; à côté du mot, elles n'ajoutent aucun
défilement. Tout ce qui tenait au-dessus du dock sans image y tient avec, sauf
l'association dans l'app iPhone à encoche (390 × 844 : 5 px de marge sans
image, 33 px de défilement avec ; 402 × 874 : 17 px sans, 21 px de
défilement avec). Avant la relecture, l'association de quatre paires défilait
de 82 à 114 px de plus avec les images sur la plupart des téléphones et des
tablettes, y compris à 390 × 844, à 375 × 812, à 768 × 1024 et à 1024 × 768, où
elle tenait sans image. Un QCM à quatre tuiles garde de 74 px
(360 × 640) à 315 px (820 × 1180) de marge, 21 px à 844 × 390 et 0 px à 844 × 390
avec l'encoche. À 320 × 568 (un iPhone SE de première génération), tout est hors
budget avec comme sans image ; la mise en ordre de quatre tuiles, dont la poignée
passe à 44 px et la pastille à 32 px sous 340 px de large, finit à 140 px sous le
dock (161 px sans image). Ces mesures sont celles de Chromium, pas de Safari ni du
WebView Android.

L'image est décorative : le nom est écrit à côté, donc son `alt` est vide, et
elle ne reçoit ni le toucher ni la sélection (`pointer-events-none`,
`select-none`, `draggable={false}`). Sans cela, iOS ouvre le menu de l'image
sur un appui long, en pleine zone de glisser. Les fichiers sont ceux du site
(une balise `img`, pas `next/image` : l'export est statique) et partent dans
l'application, donc elles s'affichent aussi hors ligne. Si un fichier ne charge
pas, il n'y a jamais d'icône cassée : la pastille cède la place à l'émoji de
tête de la tuile, s'il y en a un, sinon elle disparaît.

**Le voir**

La galerie (`/dev/exercices/`) et la séance factice (`/dev/seance/`) posent le
même fournisseur que la séance, selon la classe du spécimen : un spécimen de CI
montre ses images, un spécimen de CP non. Le paramètre `images` règle la
comparaison : `images=0` les coupe partout, `images=1` les montre aussi au CP.
Six types de la galerie sont faits pour elles : `order-animaux`,
`order-animaux-4`, `qcm-intrus`, `qcm-mots-seuls`, `match-mots` et
`drag-drop-savane`. `scripts/shoot-exercises.mjs --images 0|1` en fait des
captures avant et après. Le détail est dans `docs/boucle-native-jeu.md`.

**La couverture sur le contenu réel**

`node scripts/item-pictures-coverage.mjs <dossier de l'export>` passe les
exercices de la production dans la même chaîne que l'écran (`sanitizePayload`,
`explainTilePictures`, avec ce que chaque écran passe : `groupsOf` doit suivre
les écrans) et rend, par type et par thème, les tuiles avec image, les
exercices coupés et par quel garde-fou, les mots les plus fréquents sans image,
et les règles proposées (R1 à R6, adoptées, coupent 0 de plus). Sur l'export
du 19 octobre 2026 : 573 tuiles avec image, soit 78,3 % des tuiles qui nomment
une chose (71,2 % avant la relecture) ; en comptant aussi les tuiles que les
garde-fous retirent, 59,2 % (62,2 % avant). Avec la vague 2 : 681 tuiles avec
image, soit 93,7 % des tuiles qui nomment une chose, et 196 exercices sur 850 ont
au moins une image (183 avant) ; en comptant celles que les garde-fous retirent,
69,7 %. Quatre tuiles qui nomment une chose restent sans image : « marché » (un
verbe, à raison), « milier » (qui n'est pas du français), « Soleils » (un pluriel)
et « Tente » (un mot ambigu, seul parmi des formes).

**Ajouter une image**

1. Écrire l'entrée dans `ITEM_IMAGES` (`lib/item-images.ts`), au bon groupe :
   `id` (minuscules, chiffres et tirets : c'est le nom du fichier), `alt` (ce
   que lit un lecteur d'écran, court, sans « image de »), `group`, `words` (les
   noms FRANÇAIS au singulier, sans article ; accents et casse libres),
   `english` (les noms anglais, à part), `emoji` (les glyphes qui désignent la
   chose, avec leur sélecteur U+FE0F quand ils en portent un : ne pas les
   « nettoyer » ; prudents : un glyphe qui dirait aussi autre chose, comme le
   rond rouge, n'y va pas), `guardEmoji` (les glyphes en plus que seuls les
   garde-fous lisent), `ambiguousBare` si le mot seul peut dire autre chose (et
   `bareInGroup` si un groupe d'images peut lever le doute), et `about` (ce
   qu'on demande au générateur, en anglais). Un mot ou un émoji ne va qu'à une
   seule image : le test refuse un doublon, français ou anglais.
2. La fabriquer avec le serveur MCP « studio » (`generate_image`). Modèle
   `bfl/flux-3-image` (0,048 $ l'image), `mode: "manual"`, `aspectRatio: "1:1"`,
   et deux images déjà retenues en `referenceImages`, un animal et un objet,
   pour garder l'unité de style (la première vague a pris une girafe et une
   table ; en PNG, `ffmpeg -i public/objets/girafe.webp girafe.png`). Demander
   l'estimation avant (`estimate_cost`). Prompt-type, où `<about>` est le champ
   `about` de l'entrée : *Children's picture-book illustration of <about>. Flat
   vector style, simple rounded shapes, thick soft dark-brown outline, bright
   warm colors, centered, the whole subject fully visible with a margin around
   it, plain pure white background, no text, no letters, no numbers, no shadow,
   no other objects. Same drawing style as the reference images.* Un seul
   sujet, jamais de texte dans l'image. **Regarder chaque image** avant de la
   garder, et la regarder petite : une tuile la montre à 32 px de côté.
3. La convertir : `node scripts/build-item-images.mjs --raw <dossier de png>
   --ids <id>` écrit `public/objets/<id>.webp` (384 × 384, fond blanc, webp
   qualité 85, la scène entière visible). Le script ramène à blanc pur les
   quasi-blancs que laissent les générateurs (les trois canaux à 246 sur 255
   au moins), et tout fond clair relié au bord de l'image (les trois canaux à
   236 au moins) : la souris avait un fond rose pâle, à peine visible seul, qui
   se devine comme un carré sur l'autocollant blanc. Les scènes carrées (la
   liste `SCENES` du script : le moment du jour, le ciel, la savane, la ferme, le
   jardin, le marché, la salle de classe…) gardent leurs couleurs intactes : une
   scène nouvelle s'ajoute à cette liste, sinon son ciel pâle est pris pour un
   fond. Un sujet qui occupe moins de la moitié du carré (la balle, à 35 %) est
   agrandi jusqu'à 60 %, depuis le PNG d'origine. Un fichier de plus de 40 Ko (le
   jardin, 45 Ko) est ré-encodé à une qualité plus basse, par pas de 5. Le script
   signale une image sans entrée. Les six formes ne passent pas par le studio : un générateur
   dessine mal un carré parfait. `node scripts/build-item-images.mjs` sans
   argument les redessine en SVG (couleur franche, contour brun épais, reflet
   doux).
4. Tester : `npx vitest run lib/__tests__/item-images.test.ts`. Chaque entrée
   a son fichier, chaque fichier son entrée, chaque fichier fait 384 × 384 et
   pèse de 1 à 40 Ko, et aucun mot ni émoji n'est donné à deux images. Puis
   regarder la tuile dans la galerie. Les règles de reconnaissance et les
   garde-fous ont leurs tests dans `lib/__tests__/item-pictures.test.ts`, les
   écrans dans `components/exercises/__tests__/`.

**Le coût.** 192 générations en tout, environ 9,22 $ à 0,048 $ pièce : 104 pour
la première vague (essais pilotes et images refaites comprises, environ
4,99 $), 10 pour la reprise qui a suivi (le cylindre, le matin et le pilon
refaits, puis l'eau, la fleur, la feuille, le lit, le bissap, le fromager et la
moto, une génération chacun, 0,48 $) et 78 pour la vague 2 (70 images et 8
reprises, environ 3,74 $). Les six formes ne coûtent rien. Les 168 fichiers
pèsent ensemble environ 1,4 Mo.

**Les images refusées, puis refaites.** À la première vague, trois images
avaient été refusées après trois tours de studio : le cylindre (un corps bleu
glacé presque blanc, qui se lisait comme un verre), le matin (une palette
pastel terne, un demi-soleil qu'on confond avec le soir) et le pilon (un bâton
fin en deux tronçons, qui se lisait comme un os). Leurs tuiles gardaient leur
émoji ou leur seul mot, et une tuile sans image au milieu de tuiles illustrées
désignait la bonne réponse : six tuiles « cylindre » et dix-neuf « matin » en
production. Elles sont refaites, au quatrième tour, avec les consignes que cette
section avait écrites : un cylindre d'un bleu vif et opaque, un matin au coq qui
chante sur une barrière devant un grand soleil orange, un pilon d'une pièce.
Sept images se sont ajoutées pour les mots les plus fréquents des paliers de
CI qui n'en avaient pas (l'eau 13 tuiles, la fleur 11, la feuille 10, le lit, le bissap
et le fromager 7 chacun) et la moto, qui empruntait l'image du scooter.

**La vague 2 (19 octobre 2026).** Soixante-dix images de plus, pour tout ce que
les paliers de CI en production nommaient encore sans image. La liste vient de la
lecture des 1 205 exercices de CI de l'export et des gabarits du code : 58 noms de
choses (la tige, le fruit, la racine, le yassa, l'après-midi, la fenêtre, le mafé,
le rat…), trois choses que des gabarits nomment sans image (le pantalon, la
chaussette, le cartable) et neuf parties du corps du programme de CI (le nez, la
langue, la tête, les cheveux, le bras, les jambes, les pieds, les doigts,
l'oreille), sans lesquelles la règle ne tient pas sur un thème « mon corps » ou
« les cinq sens ». Trois groupes sont nouveaux : `plantes`, `corps` et
`signalisation` (les trois feux et le passage piéton). Neuf images sont des
scènes carrées pleines (le ciel, la savane, la montagne, la ferme, le jardin, le
marché, la salle de classe, le passage piéton, l'après-midi) : une case de
glisser-déposer « Savane » ou « Ferme » montre désormais sa scène, et l'élève
joue sans lire. Quatre mots ne sont pas des images mais des mots de plus pour une
image qui existe : « auto » (la voiture), « feuilles » (la feuille), « fleurs »
(la fleur) et « livres » (le livre, que le gabarit « les livres » nomme au
pluriel). Restent volontairement sans image : les pluriels (« Ronds », « Fruits »)
et les groupes à préposition, qu'une image au singulier trahirait ; « main droite »
et « main gauche », qu'une main dessinée trancherait ; les personnes et les
prénoms ; « milier », que le modèle a écrit pour le plant de mil et qui n'est pas
du français (la tuile reste signalée par le contrôleur). Huit images ont été
refaites après relecture (un doigt manquant, un short coupé par le bord, une
peau trop claire…). `ferme`, `marché` (« marche » sans son accent) et `tente`
sont des mots ambigus : seuls, ils pourraient être des verbes.

**Élargir au CP.** Une ligne : dans `lib/item-pictures.ts`,
`PICTURE_TILE_CLASSES = ["CI", "CP"]`. `READING_LEARNER_CLASSES`
(`convex/curriculum.ts`) règle la voix de Pio et reste une autre liste : les
deux sont indépendantes. Pour voir l'effet avant de décider, `images=1` dans la
galerie et la séance factice montre les images à un spécimen de CP. Le budget
de hauteur a été mesuré sur des spécimens de CI : le mesurer de nouveau sur des
exercices de CP.

**Ordre de déploiement.** Pour que l'élève voie les images, le web seulement : un
déploiement du site, sans Convex et sans régénérer de palier. Les élèves du web
voient les images dès que le site est en ligne. Les images sont des fichiers
statiques de l'export : les applications iOS et Android les reçoivent avec une
reconstruction ou une mise à jour à distance, comme tout fichier statique
(`docs/capacitor-ios.md`), et gardent les écrans d'avant en attendant. La
consigne de génération (`tilePicturesRule`) et le contrôleur
(`ci_tile_without_picture`) vivent dans `convex/` : ils n'agissent qu'après un
déploiement Convex, et la consigne ne change que les exercices générés ensuite,
ceux qui sont déjà en base gardent leurs tuiles et reçoivent leurs images à
l'écran.

**Ce qui reste à faire.** Regarder une séance de CI sur le web après le
déploiement, puis sur un téléphone ; les mesures de hauteur sont celles de
Chromium, pas de Safari ni du WebView Android (l'appui long sur une pastille,
la césure des mots, les unités `cqw` du repli sont à voir sur le simulateur
iPhone 17 avec `scripts/native-loop-ios.sh`). Sur l'export de production, plus
aucune tuile qui nomme une chose n'est sans image, sauf quatre (voir « La
couverture sur le contenu réel »). Les choses que le contenu à venir nommera sans
image seront signalées par le contrôleur, et se règlent par une image au
catalogue. Deux décisions attendent le propriétaire : les 12 exercices « Quel est le nom de
cette forme ? » (6) et « Quel est le nom du solide… ? » (6), où l'enfant ne peut
pas lire les noms des options et où l'image donnerait la réponse, restent sans
image ; et les 24 exercices de position, coupés par le garde-fou b sans fuite
réelle.

## Essais et indices

Un exercice se joue en cinq essais au plus (`MAX_ATTEMPTS_PER_EXERCISE`).
Un indice demandé s'enregistre comme une ligne d'essai sentinelle
(`attemptNumber: 0`) pour que le score le déduise ; ce n'est pas un essai.
`countRealAttempts`, dans `convex/paliers/scoring.ts`, ne compte que les
lignes numérotées, et c'est ce que lisent le numéro du prochain essai, les
essais restants annoncés à l'enfant et la reprise d'une séance. Avant cette
règle, un indice faisait passer l'enfant de « encore 4 essais » à
« encore 2 », et gonflait le numéro d'essai que la grille de score punit.

La séance se joue sur l'appareil : `lib/offline/session-rules.ts` y applique
les mêmes règles (cinq essais, indice sentinelle, même note), et le serveur
les réapplique quand la séance lui arrive.

## Ce que la base de développement contient

Au 27 septembre 2026, seuls Mathématiques et Français portent des thématiques
d'élémentaire : cinq à sept par niveau. Deux thématiques viennent du premier
jeu de données et doublonnent le programme (« Fractions » en CE2, à côté de
« Les fractions simples » ; « Multiplication » en CM1, à côté de « La
multiplication à 2 chiffres »), et « Conjugaison des verbes » en Français n'a
pas de niveau : personne ne la voit. Les trois relèvent d'une décision
d'administration, pas d'un script.

Le programme des huit matières (les sept du guide officiel et l'anglais), du
CI au CM2, se charge en base par `programme/seed:run`, et certaines
thématiques mêlent des jeux fabriqués par le code à leurs paliers : voir
`docs/programme-et-jeux.md`.


## Réponse courte : types par classe et orthographe

- **Des gabarits de réponse courte, dès le CP.** `mois-ecart` et `pas-difference` fabriquent une réponse courte : un nombre, jamais
  un mot. Leur seule réponse admise tient en chiffres collés (le pavé numérique s'ouvre), la consigne finit par « Écris le nombre. »
  et le contrôleur les juge comme celles du modèle. `short-answer` figure donc parmi les types de gabarits
  (`GameExerciseType`, `TEMPLATE_TYPES`).
- **CI : aucune réponse tapée.** `short-answer` sort des types autorisés et du
  format JSON demandé au modèle (`prompts.typesFor`), en maths comme ailleurs :
  un calcul à trou se pose en QCM. `short_answer_in_ci` est `blocking` : le
  contrôleur écarte ce qui passe quand même, et `pregen:auditExercises` le
  signale en base. La consigne du CI décrit les exercices des manuels (relier,
  classer, remettre des syllabes dans l'ordre, lettre qui manque, compter).
- **Dès le CP, la réponse courte ne punit pas l'orthographe**
  (`exerciseRules.judgeShortAnswer`) : réponse identique, ou sans accents ni
  ponctuation, ou à une faute de frappe près (deux à partir de 8 lettres) est
  validée. L'écran affiche « Attention, tu as mal écrit » et la bonne graphie
  (`verifyAttempt` renvoie `spelling`, l'application hors ligne le calcule avec
  `spellingNote`). Un mot de moins de 4 lettres et un nombre se jugent à
  l'identique ; `exactSpelling: true` dans le payload (conjugaison, accord,
  homophone) refuse la faute. Le modèle liste toutes les réponses admises
  (singulier, pluriel, avec ou sans article, synonymes).

**Le vocabulaire fermé du CI et du CP** (`paliers/knownWords.ts`) : un trou de
lettre ou de syllabe doit écrire un mot de cette liste (pluriel et féminin
admis). Elle vient de la banque écrite à la main de la vitrine et de mots
courants de l'école, de la maison, de la cuisine, des animaux et des lieux du
Sénégal. Elle est fermée : un bon mot qui lui manque écarte un bon exercice et
le palier se refait ; ajoute le mot dans le fichier (sans accent, en
minuscules). Les phrases (« Awa a ___ biscuits »), les autres classes et
l'anglais ne sont pas jugés.

## Les gabarits : des exercices classiques écrits par le code

Le modèle de langue se trompait de découpe en syllabes (`ma / ng / ue`), de
somme (« 🥭🥭 + 🥭 » égal 2) et de mot à compléter (`___ngue` avec « m »), et
le contrôleur ne voit que la forme. Pour le CI, une partie de chaque palier est
donc FABRIQUÉE PAR LE CODE, comme les jeux (`paliers/games`), mais en types
classiques : l'écran, la correction et l'audit sont ceux de toujours.

| Gabarit | Type | Exemple |
| --- | --- | --- |
| `syllabes-ordre` | ordre | « Remets les syllabes dans l'ordre pour former un mot. 🍅 » : `to / ma / te` |
| `lettres-ordre` | ordre | les lettres de « rat 🐀 » |
| `syllabe-initiale` | QCM | « Par quelle syllabe commence « penda » ? » : `pen` |
| `syllabe-finale` | QCM | « Par quelle syllabe finit « tomate » ? 🍅 » : `te` (aucun mauvais choix ne finit le mot) |
| `lettres-compter` | QCM | « Combien de lettres compte « olive » ? » : 5 |
| `mot-syllabe` | QCM | « Quel mot commence par la syllabe « pa » ? » : `papa`, avec `lit` et `midi` (le sens inverse de `syllabe-initiale`, à ne pas confondre avec `syllabe-mot`, qui relie) |
| `lettre-initiale` | QCM | « Par quelle lettre commence « lit » ? 🛏️ » |
| `syllabes-compter` | QCM | « Combien de syllabes entends-tu dans « mère » ? » : 2 |
| `syllabe-manquante` | phrase à trous | `to___te` : `ma` |
| `lettre-manquante` | phrase à trous | `m___to` : `o` |
| `phrase-trou` | phrase à trous | « Complète la phrase. » : `La ___ pond un œuf.` : `poule` |
| `syllabe-mot` | association | `ba~bateau ; sa~savon…` |
| `mot-image` | association | `poule~🐔…` |
| `majuscule-minuscule` | association | « Relie chaque lettre minuscule à sa majuscule. » : `a~A ; m~M…` (quatre lettres du vocabulaire, sans accent ; « i » et « l » jamais ensemble : « I » ressemble à « l ») |
| `compter-emojis`, `ajouter-emojis`, `enlever-emojis` | QCM | « Combien de mangues en tout ? 🥭🥭 + 🥭 » : 3 |
| `rangee-plus-moins` | QCM | « Quelle rangée a le plus de fleurs ? » : trois rangées de dessins, de nombres différents |
| `nombre-groupe` | association | `3~🌸🌸🌸 ; 5~🌸🌸🌸🌸🌸…` |
| `nombre-voisin` | QCM | « Quel nombre vient juste après 7 ? » : 8 |
| `nombre-plus-grand` | QCM | « Quel est le plus grand de ces nombres ? » : trois nombres différents |
| `nombre-en-lettres` | QCM | « Quel nombre s'écrit « sept » ? » : 7 |
| `nombres-ordre` | ordre | « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents |
| `double-moitie` | QCM | « Quel est le double de 3 ? » : 6 ; « Quelle est la moitié de 8 ? » : 4 |
| `complement` | QCM | « Combien faut-il ajouter à 6 pour faire 10 ? » : 4 |
| `calcul-ecrit` | QCM | « Combien font 4 + 3 ? » : 7 ; « Combien font 8 − 5 ? » : 3 |
| `dizaine-unites` | QCM | « Dans 14, il y a une dizaine et combien d'unités ? » : 4 (de 11 à 19) |
| `forme-nom` | QCM | « Quel est le nom de cette forme ? ⬛ » : `le carré` (jamais « le rectangle » pour un carré) |
| `forme-coins` | QCM | « Combien de coins a un triangle ? » : 3 (carré et rectangle 4, rond 0) |
| `solide-nom` | QCM | « Quel est le nom du solide qui ressemble à cet objet ? 🎲 » : `le cube` (jamais « le pavé » pour le dé) |
| `classer-formes` | glisser-déposer | « Glisse chaque forme dans la bonne case. » : `⬛🔲` dans Carrés, `🔴` dans Ronds |
| `rangee-position` | QCM | « Regarde la rangée 🐔 🍌 🐄. Qui est à gauche ? » : `🐔 la poule` |
| `rangee-ordinal` | QCM | « …Qui est le troisième, en lisant de gauche à droite ? » |
| `sur-sous` | QCM | « Regarde le dessin. » puis `🐈`, `📦` et `🐔` sur trois lignes, « Qui est sur la boîte ? » : `🐈 le chat` (« sous » dès le deuxième palier) |
| `devant-derriere` | QCM | « Le chat est devant le chien. Qui est derrière ? » : `🐕 le chien` ; trois animaux à la queue leu leu au dernier palier |
| `position-glisser` | glisser-déposer | « Le mouton est devant la maison. La vache est derrière la maison. Glisse chaque animal dans sa case. » |
| `file-ordre` | ordre | « Le chat est devant le chien. Le chien est devant la poule. Mets-les dans l'ordre de la file. » : `🐈 le chat, 🐕 le chien, 🐔 la poule` (chaque phrase lie deux voisins : un seul ordre les respecte toutes ; « derrière » dès le deuxième palier, phrases mêlées au dernier) |
| `a-cote` | QCM | « Regarde la rangée 🐔 🍌 🐄 🍎. Lequel est à côté de la poule ? » : `🍌 la banane` (le dessin de la question est au bout de la rangée : il n'a qu'un voisin) |
| `entre` | QCM | « Lequel est entre le citron et le chien ? » : trois dessins puis cinq ; les deux dessins nommés ne se proposent jamais |
| `pres-loin` | QCM | « Lequel est le plus près de la vache ? » ou « le plus loin » : le dessin de la question est au bout, le plus près est son voisin, le plus loin l'autre bout |
| `rangee-voisin` | QCM | « Lequel est juste à droite du chat ? » ou « juste à gauche » |
| `doigt-direction` | QCM | « Quel doigt montre la droite ? » : `👉`, parmi trois doigts, sans mot à lire |
| `doigt-relier` | association | « Relie chaque doigt à la direction qu'il montre. » : `👉~à droite ; 👆~en haut…` (« à droite », pas « la droite » : un article et un nom ressembleraient à une chose sans image) |
| `gauche-droite-glisser` | glisser-déposer | « Glisse chaque dessin à gauche ou à droite de la mangue. » (un dessin au moins de chaque côté) |
| `rangee-copie` | ordre | « Regarde la rangée 🐟 🍉 🦒. Mets ces dessins dans le même ordre, de gauche à droite. » |
| `repere-glisser` | glisser-déposer | « Glisse chaque dessin dans la bonne case, repère fixe ou repère mobile. » : `le baobab` est fixe, `la charrette` est mobile |
| `repere-qcm` | QCM | « Lequel ne bouge pas ? » : `la mosquée` ; « Lequel peut bouger ? » dès le deuxième palier |
| `repere-intrus` | QCM | « Lequel n'est pas comme les autres ? » : trois repères fixes et une voiture ; deux intrus d'un même palier ne sont jamais le même |
| `repere-trajet` | ordre | « Awa part du portail, passe devant le baobab et arrive au marché. Mets-les dans l'ordre du trajet. » |
| `grille-position` | QCM | « Regarde le quadrillage. » puis deux lignes de deux dessins (trois de trois ensuite), « Lequel est en bas à gauche ? » |
| `grille-ligne-colonne` | QCM | « Lequel est dans la deuxième ligne et la première colonne ? » |
| `grille-trou` | phrase à trous | le quadrillage, « Complète la phrase. » : `En bas à droite, il y a ___.` : `🐄 la vache` |
| `pion-deplacement` | QCM | « Le pion est sur la mangue. Il descend d'une case. Où arrive-t-il ? » : le pion ne sort jamais du quadrillage ; deux cases dès le dernier palier |
| `grille-glisser` | glisser-déposer | « Glisse chaque dessin en haut ou en bas. » (ou à gauche ou à droite) : deux dessins dans chaque case |
| `intrus` | QCM | « Lequel n'est pas comme les autres ? » : trois fruits et un animal |
| `appartient` | QCM | « Est-ce un fruit ? 🐔 » : Non |
| `couleur-objet` | QCM | « Qu'est-ce qui est jaune ? » : `🍌 la banane`, parmi trois couleurs |
| `comparer-mesure` | QCM | « Quel animal est le plus lourd ? » : trois animaux espacés d'au moins deux crans |
| `animaux-ordre` | ordre | « Mets ces animaux dans l'ordre, du plus léger au plus lourd. » |
| `moment-journee` | QCM | « Le soleil se couche. Quel moment de la journée est-ce ? » : `le soir` |
| `jour-voisin` | QCM | « Quel jour vient juste après mardi ? » : mercredi |
| `jours-ordre` | ordre | « Mets ces jours dans l'ordre de la semaine. » : `lundi, mardi, mercredi` (trois jours qui se suivent, puis quatre, puis quatre qui sautent un jour) |
| `jour-manquant` | phrase à trous | « Complète les jours de la semaine. » : `lundi, mardi, ___, jeudi.` : `mercredi` (aucun mauvais choix ne complète la suite) |
| `jour-ecole-repos` | glisser-déposer | « Glisse chaque jour dans sa case, jour d'école ou jour de repos. » : `dimanche` au repos, les autres à l'école ; jamais jeudi ni samedi, qui dépendent de l'école |
| `jour-rang` | QCM | « Quel est le troisième jour de la semaine ? » : `mercredi` (la semaine commence le lundi ; aucun indice ne nomme un jour) |
| `jours-relier` | association | « Relie chaque jour au jour qui vient juste après. » : `lundi~mardi ; mercredi~jeudi…` (trois paires, aucun jour des deux côtés) |
| `jour-relatif` | QCM | « Nous sommes mardi. Quel jour sera demain ? » : `mercredi` ; hier dès le deuxième palier ; au dernier « Hier, c'était jeudi. Quel jour sommes-nous ? » (le jour cité n'est jamais un mauvais choix) |
| `jour-hier-demain` | glisser-déposer | « Nous sommes mardi. Glisse chaque jour dans la bonne case. » : `lundi` dans Hier, `mardi` dans Aujourd'hui, `mercredi` dans Demain |
| `jour-trou` | phrase à trous | « Nous sommes mardi. Hier, c'était ___. » : `lundi` |
| `temps-ordre` | ordre | « Mets ces mots dans l'ordre du temps. » : `hier, aujourd'hui, demain` ou `avant, maintenant, après` |
| `activite-moment` | QCM | « Quand déjeune-t-on ? » : `midi` (« le soir » et « la nuit » ne se proposent jamais ensemble) |
| `moment-ordre` | ordre | « Mets ces moments dans l'ordre de la journée. » : `le matin, midi, le soir` |
| `activite-ordre` | ordre | « Mets ce que fait Awa dans l'ordre de la journée. » : `⏰ se réveiller, 🍞 prendre le petit-déjeuner, 🍚 déjeuner` (jamais « se laver », qui dépend de la maison) |
| `moment-voisin` | QCM | « Quel moment vient juste après midi ? » : `l'après-midi` (l'après-midi n'est jamais le repère de la question, et rien ne vient après la nuit) |
| `activite-moments` | glisser-déposer | « Glisse chaque activité dans le bon moment de la journée. » : `🍞 prendre le petit-déjeuner` dans Le matin, `🍚 déjeuner` dans Midi (deux cases puis trois, chacune reçoit une activité) |
| `cycle-ordre` | ordre | « Mets ces dessins dans l'ordre où ils grandissent. » : `la graine, la plante, le fruit` ou `l'œuf, le poussin, la poule` |
| `avant-apres` | QCM | « Que devient l'œuf ? » : `le poussin` ; « Qu'est-ce qui vient avant la plante ? » : `la graine` (les mauvais choix viennent d'une autre famille) |
| `avant-apres-glisser` | glisser-déposer | « Glisse chaque moment avant ou après midi. » : `le matin` dans Avant midi, `le soir` dans Après midi |
| `grandir-relier` | association | « Relie chaque petit à l'animal adulte. » : `le poussin~la poule ; le chaton~le chat…` |
| `image-compter` | QCM | « Combien de poules vois-tu dans la cour ? 🐔 🐑 🐔 🐔 🐑 » : 3 (deux sortes, puis trois) |
| `image-qui` | QCM | « Voici les billes de Moussa 🔵🔵, de Fatou 🔵🔵🔵🔵🔵 et de Cheikh 🔵. Qui a le plus de billes ? » : `Fatou` ; au dernier palier « Qui a autant de billes que Moussa ? » avec quatre enfants |
| `tableau-case` | QCM | « Regarde le tableau. » puis la grille `💚 💙 🧡` / `📗 ❔ 📙` sur deux lignes, « Quel dessin manque dans le tableau ? » : `📘` |
| `tableau-nombre` | QCM | « Awa a 3 mangues 🥭🥭🥭 et 1 banane 🍌, » / « Moussa a 2 mangues 🥭🥭 et 4 bananes 🍌🍌🍌🍌. Combien de bananes a Moussa ? » : 4 (chiffres seuls au dernier palier) |
| `image-donnee` | QCM | « Awa cueille ces mangues 🥭🥭🥭🥭 et en mange 1. Combien lui en reste-t-il ? » : 3 (le premier nombre se compte dans l'image) |
| `probleme-donnee` | QCM | « Fatou a 4 bananes, elle en donne 1 à Moussa. Combien de bananes Fatou a-t-elle au début ? » : 4 (le résultat du calcul est le mauvais choix) |
| `donnee-ou-question` | glisser-déposer | « Glisse chaque phrase du problème dans la bonne case, ce que je sais ou ce que je cherche. » : `Awa a 3 mangues 🥭🥭🥭.` et `Awa mange 1 mangue 🥭.` dans Ce que je sais, `Combien de mangues reste-t-il à Awa ?` dans Ce que je cherche ; au dernier palier, les cases deviennent « Ce qui sert », « Ce qui ne sert pas » (qui reçoit `Awa a 7 ans.`) et « Ce que je cherche » : l'âge est aussi « ce que je sais », les cases ne doivent pas se recouvrir |
| `probleme-question` | phrase à trous | « Awa a 4 mangues 🥭🥭🥭🥭 et elle en mange 1. Complète la question du problème. » : `Combien de ___ lui reste-t-il ?` avec `mangues 🥭`, `poules 🐔`, `ballons ⚽` |
| `donnee-inutile` | QCM | « Awa, 7 ans, a 3 mangues et en mange 1. Quel nombre est inutile pour les mangues qui restent ? » : 7 (les trois options sont les trois nombres) |
| `probleme-inutile` | QCM | « Cheikh a 17 moutons et 3 poules, il vend 5 moutons. Combien de moutons lui reste-t-il ? » : 12 (14 et 17 sont les calculs faits avec la donnée inutile, ou sans calcul) |
| `mois-ordre` | ordre | « Mets ces mois dans l'ordre du calendrier. » : `mars, avril, mai` (trois mois qui se suivent, quatre ensuite, espacés au dernier palier) |
| `mois-voisin` | QCM | « Quel mois vient juste après mars ? » : `avril` (le mois cité n'est jamais un choix) |
| `mois-rang` | QCM | « Quel est le troisième mois de l'année ? » : `mars` (du premier au dernier, aucun indice ne nomme un mois) |
| `mois-trou` | phrase à trous | « Complète les mois de l'année. » : `janvier, février, ___, avril.` : `mars` (aucun mauvais choix ne complète la suite) |
| `mois-ecart` | réponse courte | « Nous sommes en mars. Dans combien de mois sera juillet ? Écris le nombre. » : `4` |
| `date-lire` | QCM | « Voici une date, le 14 mai 2026. Quel est le mois ? » : `mai` (puis le jour du mois, puis l'année) |
| `calendrier-jour` | QCM | « Le 3 mars est un mardi. Quel jour est le 4 mars ? » : `mercredi` (sept jours plus tard, c'est le même jour) |
| `mois-relier` | association | « Relie chaque mois au mois qui vient juste après. » : `mars~avril ; juin~juillet…` |
| `mois-avant-apres` | glisser-déposer | « Glisse chaque mois avant ou après avril. » : `février` dans Avant avril, `juillet` dans Après avril |
| `duree-plus-long` | QCM | « Lequel dure le plus longtemps ? » : `année`, parmi `récréation`, `semaine` et `année` ; ou « …plus longtemps qu'une semaine ? » |
| `duree-ordre` | ordre | « Mets ces durées du plus court au plus long. » : `journée, semaine, mois` |
| `duree-relier` | association | « Relie chaque durée au bon nombre. » : `semaine~7 jours ; année~12 mois…` |
| `duree-glisser` | glisser-déposer | « Glisse chaque durée dans sa case, plus court ou plus long qu'une semaine. » |
| `duree-unites` | phrase à trous | « Complète la phrase. » : `Une semaine dure 7 ___.` : `jours` |
| `frequence-glisser` | glisser-déposer | « Glisse chaque moment dans sa case, tous les jours, chaque semaine ou chaque année. » : `Aller à l'école` dans Tous les jours, `Tabaski` dans Chaque année |
| `frequence-qcm` | QCM | « Quand revient la Tabaski ? » : `Chaque année` (parmi les trois rythmes de la fiche) |
| `frequence-trou` | phrase à trous | `La Tabaski revient chaque ___.` : `année` |
| `frequence-relier` | association | « Relie chaque moment à sa fréquence. » : `Jour de marché~Chaque semaine…` |
| `frequence-ordre` | ordre | « Mets ces moments du plus souvent au moins souvent. » : `Aller à l'école, Jour de marché, Noël` |
| `edt-apres` | QCM | l'emploi du temps sur plusieurs lignes (`8 h Lecture`, `9 h Maths`, `10 h Récréation`…), « Quel cours vient juste après la récréation ? » : `dessin` |
| `edt-quand` | QCM | « À quelle heure commence la récréation ? » : `10 h` |
| `edt-ordre` | ordre | « Mets ces cours du premier au dernier. » (ou du dernier au premier) |
| `edt-trou` | phrase à trous | `Après la récréation, il y a le cours de ___.` : `dessin` |
| `edt-semaine` | QCM | « Voici l'emploi du temps de la semaine. » puis `Lundi Sport`, `Mardi Chant`…, « Quel cours a-t-on le mardi ? » : `chant` |
| `trajet-case` | QCM | un quadrillage de 3 sur 3, « Le pion est sur le chat. Il monte de 1 case puis va de 1 case vers la droite. Où arrive-t-il ? » |
| `trajet-tourne` | QCM | « Le pion est sur le chat et regarde en haut. Il avance de 1 case, tourne à droite et avance de 1 case. Où arrive-t-il ? » (la droite du pion, pas celle de l'écran) |
| `itineraire-ordre` | ordre | « Awa part de la maison, passe devant la boutique et arrive au marché. Mets les lieux dans l'ordre du trajet. » : `maison, boutique, marché` |
| `itineraire-passe` | QCM | « …Devant quel lieu passe Awa ? » : `boutique` (le départ et l'arrivée ne se proposent jamais) |
| `itineraire-trou` | phrase à trous | « Awa part du marché, passe devant le puits et arrive au jardin. » puis `Awa passe devant le ___.` : `puits` (lieux masculins) |
| `itineraire-glisser` | glisser-déposer | « …Glisse chaque lieu avant ou après la boutique. » |
| `distance-pas` | QCM | « Pour aller à la boutique, Awa fait 12 pas, Moussa 8 pas et Fatou 15 pas. Qui habite le plus près ? » : `Moussa` |
| `distance-ordre` | ordre | « …Mets-les du plus près au plus loin de la boutique. » : `Moussa, Awa, Fatou` |
| `mesure-comparer` | QCM | « Awa mesure avec ses empans. Le cahier fait 2 empans, la table 6 empans et le tableau 11 empans. Qu'est-ce qui est le plus long ? » : `tableau` |
| `chemin-court` | QCM | « Trois chemins mènent à l'école. Par le marché, 15 pas. Par la mosquée, 11 pas. Par le puits, 18 pas. Quel chemin est le plus court ? » |
| `pas-difference` | réponse courte | « Pour aller à la boutique, Awa fait 12 pas et Moussa 8 pas. Combien de pas de plus fait Awa ? Écris le nombre. » : `4` |
| `distance-trou` | phrase à trous | « De chez Awa, le marché est à 9 pas, le puits à 4 pas et le dispensaire à 15 pas. » puis `Le lieu le plus près de chez Awa est le ___.` : `puits` |
| `distance-glisser` | glisser-déposer | « La boutique est à 10 pas de chez Awa. Glisse chaque lieu plus près ou plus loin que la boutique. » : `Marché 4 pas` dans Plus près |
| `plan-ou` | QCM | « Regarde la table vue de dessus. » puis le plan, « Où est la règle ? » : `en haut à gauche` |
| `plan-objet` | QCM | « Qu'est-ce qui est en bas à droite ? » : le dessin de cette place |
| `plan-compter` | QCM | « Combien de bananes y a-t-il ? » : le nombre de fois que le dessin revient |
| `plan-glisser` | glisser-déposer | « Glisse chaque dessin en haut ou en bas. » (ou à gauche ou à droite) |
| `plan-relier` | association | « Relie chaque dessin à sa place. » : `📏 la règle~en haut à gauche…` |
| `plan-trou` | phrase à trous | « Complète la phrase. » : `En bas à droite, il y a ___.` |
| `quartier-rue` | QCM | « Dans la rue, il y a la mosquée, puis la boutique, puis le marché. Quel lieu est à côté de la mosquée ? » : `boutique` (puis juste avant, juste après, entre) |
| `quartier-ordre` | ordre | « …Mets les lieux dans le même ordre. » |
| `quartier-glisser` | glisser-déposer | « …Glisse chaque lieu avant ou après la boutique. » |
| `quartier-trou` | phrase à trous | « Dans la rue, il y a le marché, puis le puits, puis le dispensaire. » puis `Le puits est entre le marché et le ___.` : `dispensaire` |
| `lieu-fonction` | association | « Relie chaque lieu à ce qu'on y fait. » : `école~apprendre ; marché~acheter…` |

- **Le vocabulaire** (`paliers/games/words.ts`, `LEXICON`) reprend les mots des
  thématiques « Les sons… » du CI, chacun avec sa découpe en syllabes relue à la
  main. `vocabulary: "mots-2"` dans la fiche du programme limite les mots à ceux
  des deux premiers paliers de lecture (les mauvais choix aussi). Un mot ajouté
  doit aussi figurer dans `paliers/knownWords.ts` : un test le vérifie.
- **Les mauvais choix d'un trou ne forment aucun mot** (`KNOWN_WORDS`), sinon
  l'exercice aurait deux bonnes réponses. Une syllabe donnée comme mauvais choix
  ne commence jamais le mot (« ba » pour « ballon »).
- **La phrase à trou** (`SENTENCES` dans `words.ts`) : chaque phrase est écrite à la
  main pour qu'UN SEUL mot du vocabulaire la complète. Les mots qui iraient aussi
  vont dans `also` et ne sont jamais proposés ; un mot déjà écrit dans la phrase non
  plus. Le modèle écrivait « Mon ___ est dans le jardin » avec « père » : « mère »,
  « ami » ou « bébé » allaient aussi. Pour ajouter une phrase : le mot est dans
  `LEXICON`, une propriété à lui seul le désigne, et tout autre mot qui irait aussi
  est dans `also`, des DEUX côtés (« Je dors dans mon ___ » liste « salon » et « sac »,
  et leurs phrases listent « lit »). Au premier palier de lecture, quatre phrases
  (lit, olive, tomate, tata) pour que les trois paliers de `fr-ci-sons-1` ne
  rejouent pas la même.
- **Le mot qui commence par une syllabe** (`mot-syllabe`) n'a qu'une bonne
  réponse par construction : les deux mauvais mots ne commencent par la syllabe ni
  à l'écrit, sans accents (« ballon » pour « ba », « loupe » pour « lo », « penda »
  pour « pè »), ni à l'oreille (« au » et « eau » disent « o » : « auto » et « eau »
  ne sont jamais proposés pour « olive »). On écarte trop plutôt que pas assez : il
  reste toujours deux mots vus à proposer. L'énoncé n'a pas d'émoji (le dessin
  donnerait le mot) et aucun des trois indices n'écrit un des choix. Le test rejoue
  chacun des mots du vocabulaire, à chaque palier de lecture, avec 25 graines.
- **Le dénombrement** (`paliers/games/counting.ts`) compte les émojis qu'il
  écrit : jamais plus de 5 au premier palier, 10 au dernier.
- **Les choses du monde de l'enfant** (`paliers/games/things.ts`) : chaque animal, fruit,
  vêtement, véhicule ou objet d'école est écrit UNE fois, avec son émoji ancien (Unicode 11
  au plus, sans sélecteur de variation), sa famille, sa couleur et son rang de taille et de
  poids. `geometry.ts` (formes, coins, solides, classement, rangées) et `sorting.ts` (intrus,
  famille, couleur, comparaisons, rangement, moments, jours) n'inventent rien. Une comparaison
  espace toujours les choses d'au moins deux crans de l'échelle (un chien et un mouton, une
  poule et un chien, se discutent) ; l'éléphant n'est pas dans l'échelle de taille (la girafe est
  plus haute) ; un carré est un rectangle particulier et un cube un pavé particulier, donc
  jamais « rectangle » pour un carré ni « pavé » pour le dé. Ajouter une chose : un émoji ancien,
  une seule famille et une seule couleur sans doute possible. Les énoncés des jeux ne contiennent
  aucun « : » (l'écran, `ExercisePrompt`, coupe une consigne sur le deux-points) ni plus d'une
  apostrophe droite (précaution du test des jeux : l'apostrophe droite ne coupe rien, seules les
  guillemets le font). La voix de Pio ne dit pas les émojis : un énoncé ne doit jamais nommer un
  dessin par son seul émoji (« Qui est entre 🐟 et 🐕 ? » devenait « Qui est entre et ? »), d'où
  l'absence de « entre ». Un mot de la question n'est jamais celui de la réponse (« l'orange »
  pour la couleur orange, le jour cité pour le jour d'avant). Le soir et la nuit ne se proposent
  jamais ensemble. La difficulté monte avec le palier : rangées de trois puis de quatre dessins,
  quatre puis cinq choix à l'intrus, quatre couleurs, deux animaux très différents puis trois.
- **Les nombres** (`paliers/games/numbers.ts`) CALCULENT leur réponse, jamais
  écrite : une seule option juste, les mauvais choix sont des erreurs d'enfant (le
  nombre lui-même, un de plus, un de moins, l'autre opération) et ne valent jamais
  la bonne réponse. Le plus grand nombre vient du champ `vocabulary` de la fiche :
  « nombres-10 » ou « nombres-20 » (aussi pour `suite-nombres`, dont les mauvais
  choix ne dépassent plus ce plafond). Aucun indice n'écrit un chiffre : un test
  recalcule chaque réponse depuis l'énoncé.
- **Les petits problèmes** (`paliers/games/problems.ts`, lexique dans `stories.ts`) : dix gabarits
  pour « Petits problèmes » (`ma-ci-problemes`), trois sur l'image, deux sur le tableau à double
  entrée, trois sur la donnée et la question, deux sur la donnée inutile. Les prénoms (vingt, avec
  leur genre et leur voyelle initiale), les objets (avec genre, pluriel, famille, émoji et verbes
  qui leur vont : on ne mange pas une bille) et chaque forme interrogative (« vend-il », « mange-t-elle »)
  sont écrits une fois. La réponse se calcule ou se lit dans ce que l'énoncé montre ; les mauvais
  choix sont les erreurs d'enfant (tout compter, oublier de calculer, prendre la donnée inutile).
  Le plafond monte avec le palier (5, 10, puis 20), une rangée d'émojis ne dépasse jamais dix,
  aucun calcul ne passe la dizaine (10 + 6 et 17 − 4, jamais 8 + 5), et l'énoncé tient en deux
  phrases et vingt mots, avec une apostrophe au plus. Le tableau à double entrée n'a pas de rendu
  de grille : `tableau-case` écrit la grille d'émojis sur plusieurs lignes de l'énoncé (un `\n`
  devient un vrai retour à la ligne sur l'écran de l'élève, `ExercisePrompt` est en
  `whitespace-pre-line` ; les aperçus enseignants et la voix l'aplatissent), chaque ligne n'a
  qu'une sorte de dessin et chaque colonne qu'une couleur, et une case manque (❔) : la question
  ne nomme ni la ligne ni la colonne, il faut lire les deux. `tableau-nombre` dit un tableau de
  deux enfants et deux objets en deux lignes. Ce que cela ne couvre pas : les en-têtes écrits, la
  lecture inverse (de la case vers son en-tête), le remplissage d'un tableau d'effectifs ; il
  faudrait un champ de tableau dans le payload, rendu par l'écran et lu par la voix.
  `probleme-question` est la première phrase à trous des mathématiques : le modèle n'y a pas droit
  (`demo-matrix.ts`, « un calcul à trou s'y écrit en réponse courte »), mais un gabarit n'est pas
  le modèle, et le trou est un mot, pas un nombre. Le glisser-déposer `donnee-ou-question` écrit
  des étiquettes qui se comprennent seules (l'écran les mélange : ni pronom, ni « en ») ; la voix
  ne les lit pas, lire est l'exercice, les émojis des deux premiers paliers aident.
  Les paliers déjà générés de cette thématique gardent les exercices du modèle jusqu'à leur
  invalidation (`pregen:invalidate`, voir plus haut).
- **Le temps et l'espace** (`paliers/games/temps.ts`, `paliers/games/espace.ts`) : trente-neuf gabarits pour
  l'histoire et la géographie du CI (`hi-ci-semaine`, `hi-ci-hier-demain`, `hi-ci-journee`, `hi-ci-ordre`,
  `ge-ci-position`, `ge-ci-lateralite`, `ge-ci-reperes`, `ge-ci-quadrillage`). Le modèle y écrivait des exercices
  faux ou injouables : un ordre sans critère (« Mets ces repères en ordre d'apparition »), une scène que rien ne
  montre (« Place le chien à droite et le chat à gauche »), deux réponses qui vont (« Aujourd'hui, je vais ___ à
  l'école »). Sur l'échantillon lu le 19 octobre 2026, 15 exercices de géographie sur 19 et 5 d'histoire sur 19
  étaient faux. Ici la réponse se lit dans ce que l'énoncé montre ou dit.
  - **Le temps** repose sur trois ordres que personne ne discute : les sept jours dans l'ordre de la semaine (elle
    commence le lundi), les cinq moments dans l'ordre de la journée, deux cycles de croissance (la graine, la
    plante, la fleur, le fruit ; l'œuf, le poussin, la poule). Jeudi et samedi ne sont jamais « jour d'école » ni
    « jour de repos » (cela dépend de l'école), et « se laver » n'est jamais une activité du matin (cela dépend de
    la maison). Le jour cité par la question n'est jamais un mauvais choix, et aucun indice ne nomme la réponse.
  - **L'espace** DESSINE sa scène avec des émojis sur plusieurs lignes de l'énoncé (une pile, une rangée, un
    quadrillage : `ExercisePrompt` garde les retours à la ligne ; la voix de Pio les aplatit et ne dit pas les
    émojis, donc un énoncé nomme toujours le dessin par son nom), ou la dit en mots (« Le chat est devant le chien »).
    Les mauvais choix ne peuvent pas être une deuxième bonne réponse : on ne demande « à côté de » ou « le plus près
    de » que du dessin au bout d'une rangée, qui n'a qu'un voisin. La gauche est du côté où l'on commence à lire, le
    haut est en haut de l'écran. Un repère FIXE ne bouge jamais (un baobab, une mosquée, un portail), un repère MOBILE
    se déplace (une voiture, un âne, une charrette). Les dessins d'une scène n'ont pas d'élision (« l'éléphant » ferait
    deux apostrophes dans l'énoncé). Les doigts `👉👈👆👇` restent des tuiles sans nom : ce ne sont pas des choses.
  - Deux exercices d'un même palier ne se répètent pas (`pickFresh` sur les rangs, les cycles, les mots du temps, les
    supports, les places du quadrillage et les intrus).
  - `convex/__tests__/historyGeographyTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé, avec ses propres
    tables (les jours, les moments, les cycles, les repères, le quadrillage) : un gabarit dont la réponse contredit sa
    table échoue. Il vérifie aussi les règles communes (aucun « : », une apostrophe au plus, vingt mots,
    aucun sélecteur de variation, un choix juste parmi des choix tous différents, aucun indice qui écrit la réponse,
    une image pour chaque tuile qui nomme une chose) et fabrique 40 paliers de chacune des huit thématiques.
    `templatesWithoutModel.test.ts` joue leur génération complète contre un faux modèle.
- **Le calendrier, les durées, les fréquences et l'emploi du temps du CP** (`paliers/games/calendrier.ts`) : vingt-quatre gabarits
  pour `hi-cp-calendrier`, `hi-cp-durees`, `hi-cp-frequences` et `hi-cp-emploi-du-temps`. Sur l'échantillon de CP lu le 19 octobre 2026,
  sept exercices d'histoire sur vingt et un étaient faux : deux mois de la saison sèche qui n'en font pas partie, un emploi du temps
  cité mais absent de l'écran, un ordre de durées sans critère, une réponse libre qui refusait des mois justes. Ici la réponse se
  calcule ou se lit dans ce que l'énoncé montre.
  - **Les mois et les jours** sont des ordres que personne ne discute : les douze mois de janvier à décembre, les sept jours de lundi à
    dimanche. `calendrier-jour` avance ou recule dans la semaine d'un écart de 1, 2, 3, 7 ou 8 jours, et retrouve le même jour quand
    l'écart est de sept. Les saisons (saison sèche, hivernage) n'ont aucun gabarit : la fiche du CP ne dit pas quels mois en font
    partie. Seule la fiche du CE1 (`ge-ce1-saisons`) donne ces mois, de novembre à juin puis de juillet à octobre ; une fiche du CP
    qui les donnerait permettrait d'ajouter les saisons.
  - **Les durées** forment une chaîne que personne ne discute : la récréation, la journée, la semaine, le mois, l'année. Les
    équivalences viennent du calendrier (une semaine, sept jours ; une année, douze mois ; un jour, vingt-quatre heures ; une
    heure, soixante minutes). La fiche demande aussi « en même temps » : aucun gabarit ne le couvre pour l'instant.
  - **Les fréquences** sont celles de la fiche, rien de plus : aller à l'école tous les jours, le jour de marché chaque semaine,
    l'anniversaire, la Tabaski, la Korité, Noël et la fête de l'indépendance chaque année. Sept moments seulement, donc la variété
    d'un palier est mince. « Souvent, parfois, jamais » reste hors des gabarits : c'est un jugement, pas un fait.
  - **L'emploi du temps** est inventé par le gabarit et écrit dans l'énoncé, une ligne par heure (`8 h Lecture`, `9 h Maths`,
    `10 h Récréation`). La récréation n'est ni la première ni la dernière, les cours sont tous différents, et seuls lundi, mardi,
    mercredi et vendredi figurent dans l'emploi du temps de la semaine.
  - **Une étiquette est un mot seul, sans article** (`mars`, `semaine`, `Tabaski`). Au CI, une tuile « article + un nom » demande une
    image du catalogue, et ces noms n'en ont pas. Ces gabarits ne servent qu'au CP, mais `templatePictures.test.ts` les joue aussi au CI.
  - **Deux gabarits demandent un nombre à écrire** (type `short-answer`, dès le CP) : `mois-ecart` (« Dans combien de mois sera
    juillet ? Écris le nombre. ») et `pas-difference` (voir plus bas). La réponse tient en chiffres collés, donc l'écran ouvre le
    pavé numérique. Sans eux, la vitrine ne pourrait plus montrer de réponse courte au CP en histoire ni en géographie.
- **Le quartier du CP** (`paliers/games/quartier.ts`) : vingt-quatre gabarits pour `ge-cp-itineraire`, `ge-cp-distances`, `ge-cp-plan`
  et `ge-cp-quartier`. Sur l'échantillon de CP, seize exercices de géographie sur vingt-trois étaient faux ou injouables : des
  villes classées par distance (Thiès est plus près de Dakar que Mbour), un plan cité mais absent, une chaise posée sur la table.
  Ici la scène est écrite dans l'énoncé ou dessinée par des émojis, et la réponse s'y lit. Aucune ville, aucune région, aucune
  distance réelle.
  - **Le trajet** s'écrit en mots (« Awa part de la maison, passe devant la boutique et arrive à l'école ») ou se joue sur un
    quadrillage de trois sur trois. `trajet-tourne` fait tourner le pion vers SA droite ou SA gauche, pas celles de l'écran : quand
    il regarde en bas, sa droite est à gauche de l'écran. Aux deux premiers paliers, le pion regarde toujours en haut.
  - **Les distances** sont des nombres de pas écrits dans l'énoncé. Un seul enfant mesure avec ses empans ou ses pas (celui d'un
    enfant n'est pas celui d'un autre), et les objets suivent l'ordre réel des tailles (un cahier, une table, un tableau) : le
    plus grand nombre est toujours le plus long. `distance-ordre` dit proche DE QUOI (« du plus près au plus loin de la boutique »),
    sans quoi le contrôleur le refuse. `pas-difference` demande un nombre à écrire.
  - **Le plan vu de dessus** est une table ou une cour dessinée en émojis, sur deux lignes au premier palier et trois ensuite. Les
    dessins ont leur image au catalogue du CI (`optionOf`), comme dans `espace.ts`.
  - **Le quartier** est une rue écrite en mots (« Dans la rue, il y a la mosquée, puis la boutique, puis le marché »). Les lieux
    sont ceux de la fiche, plus le puits, le dispensaire et le jardin. Ce qu'on fait dans un lieu (`lieu-fonction`) est sa définition :
    on apprend à l'école, on achète au marché, on prie à la mosquée, on se soigne au dispensaire, on joue sur le terrain de football.
    Les trous (`itineraire-trou`, `quartier-trou`, `distance-trou`) n'emploient que des lieux masculins, pour que l'article écrit
    dans la phrase ne donne pas la réponse.
  - **Les gabarits repris du CI** (`jour-ecole-repos`, `jours-ordre`, `pres-loin`, `repere-glisser`, `repere-qcm`, `repere-intrus`)
    jouent à la difficulté du CI : le CP et le CI partagent la même tranche d'âge (`ageBand` vaut 0). Un palier du CP n'en reçoit
    qu'un ou deux par thématique.
  - `convex/__tests__/cpHistoryGeographyTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé, avec ses propres tables (les
    mois, les durées, les fréquences de la fiche, les cours, les lieux, les dessins), et fabrique 40 paliers de chacune des huit
    thématiques, au CP, contre le contrôleur.
- **Le contrôleur juge aussi les gabarits.** Les tests n'en trouvent aucun en
  défaut, mais une thématique sans exercice du modèle n'a plus personne pour
  relire son palier. `generateBucketCore` passe donc chaque gabarit à
  `auditExercise` (`gameAcceptor`) : sur un défaut `blocking`, il est refait avec
  une autre graine (4 fois au plus, `TEMPLATE_RETRIES`), puis abandonné ; le modèle
  écrirait alors la place laissée vide, comme pour un exercice écarté. Les refus
  s'ajoutent à `auditRejected`. Ce n'est PAS `toPersistedShape` : celui-ci reconstruit
  le payload et en retire `game`, l'origine qui permet de refaire un gabarit raté
  sans le modèle. Les quatre jeux (frise, dessin, écoute, couleurs) ne passent pas
  par là, le contrôleur n'est pas fait pour eux. Un gabarit raté par l'enfant se
  refait de la même façon (`regenerateGame`).
- **Où ils sont demandés** : le champ `games` des fiches `fr-ci-sons-1` à
  `fr-ci-sons-4`, `fr-ci-alphabet`, `ma-ci-nombres-10`, `ma-ci-calcul-10` et
  `ma-ci-nombres-20`, `ma-ci-trier`, `ma-ci-espace`, `ma-ci-formes`, `ma-ci-mesures` et
  `ma-ci-problemes`, puis `hi-ci-journee`, `hi-ci-ordre`, `hi-ci-hier-demain`, `hi-ci-semaine`, `ge-ci-position`,
  `ge-ci-lateralite`, `ge-ci-reperes` et `ge-ci-quadrillage` au CI, puis `hi-cp-calendrier`, `hi-cp-durees`,
  `hi-cp-frequences`, `hi-cp-emploi-du-temps`, `ge-cp-itineraire`, `ge-cp-distances`, `ge-cp-plan` et `ge-cp-quartier` au CP
  (`convex/programme`), dix exercices par palier, voir plus bas ; le modèle n'écrit plus rien. (Quand une fiche garde des exercices du
  modèle, le seuil de validation exige tous les exercices écrits : le modèle en
  écrit deux de plus et on garde les premiers valides, `scoring.exercisesToRequest`.)
  Un palier déjà généré garde ses exercices : il faut l'invalider
  (`pregen:auditExercises` ou une régénération) pour qu'il reçoive les gabarits.
- **Dix gabarits, plus aucun appel au modèle en lecture et en nombres du CI**
  (`ma-ci-nombres-10`, `ma-ci-calcul-10` et `ma-ci-nombres-20`, en plus de la
  lecture ci-dessous). **Lecture :** (`fr-ci-sons-1` à
  `fr-ci-sons-4` et `fr-ci-alphabet`). `fr-ci-sons-2` à `sons-4` portent les neuf
  d'avant et `mot-syllabe` ; `fr-ci-sons-1` ajoute `phrase-trou`, `syllabe-finale`
  et `lettres-compter` aux sept d'avant ; `fr-ci-alphabet` ajoute
  `majuscule-minuscule`, `phrase-trou` et `lettres-compter`. Le modèle n'écrit plus
  rien, le palier est un « palier tout en jeux ». Au premier palier de lecture
  (`fr-ci-sons-1`) le vocabulaire n'a que 7 mots pour 10 gabarits : au moins trois
  mots reviennent, dans des exercices différents (le test de variété borne ce
  nombre à ce minimum). **Nombres :** `ma-ci-nombres-10` = 2 suites, 3 dénombrements,
  un nombre relié à son groupe, une rangée comparée, un voisin, le plus grand, un
  nombre en lettres ; `ma-ci-calcul-10` = 3 additions et 2 soustractions
  d'émojis, 2 calculs écrits, 2 doubles ou moitiés (tirés au hasard), un complément ;
  `ma-ci-nombres-20` = 2 suites, 2 dizaines et unités, 2 voisins, le plus grand,
  un nombre en lettres, un rangement, un calcul de composition (« 10 + 4 »,
  « 14 − 10 » : jamais un passage de la dizaine). Les suites de nombres suivent la
  plage de leur fiche (de 0 à 10, puis de 10 à 20, qui monte avec le palier), ne
  servent jamais deux fois la même dans un palier et gardent toujours au moins deux
  mauvais choix, jamais au-dessus du plafond. **Géométrie et mesures :**
  `ma-ci-trier` = 2 frises de formes, 2 frises de couleurs, 2 intrus, un « est-ce un
  fruit ? », une couleur, 2 rangements d'animaux ; `ma-ci-espace` = 2 dessins à copier, 4
  repérages dans une rangée, 4 rangs ; `ma-ci-formes` = 2 frises de formes, 2 noms de forme,
  2 coins, 2 solides, 2 classements de formes ; `ma-ci-mesures` = 4 comparaisons d'animaux,
  3 moments de la journée, 3 jours voisins. **Problèmes :** `ma-ci-problemes` = les dix gabarits
  de petits problèmes, un de chaque, dans l'ordre de la fiche (l'image, le tableau, la donnée et
  la question, la donnée inutile) ; la difficulté vient du palier, pas du nombre d'exemplaires.
  **Histoire et géographie :** `hi-ci-journee` = 2 moments du soleil (`moment-journee`), 2 activités et leur
  moment, 2 moments rangés, une journée rangée, un moment voisin, 2 activités glissées dans leur moment ;
  `hi-ci-ordre` = 2 cycles de croissance, un moment et une journée rangés, 3 « que devient », 2 moments avant
  ou après un repère, un petit relié à l'adulte ; `hi-ci-hier-demain` = 3 hier ou demain, 2 jours glissés dans
  Hier, Aujourd'hui, Demain, 2 phrases à trous, 2 mots du temps rangés, un jour voisin ; `hi-ci-semaine` = 2 jours
  voisins, 2 jours rangés, 2 jours qui manquent, jour d'école ou de repos, 2 rangs, un relier ;
  `ge-ci-position` = 2 sur ou sous, un devant ou derrière, 2 files rangées, 2 à côté, un entre, un plus près ou
  plus loin, un devant ou derrière glissé ; `ge-ci-lateralite` = 2 places dans une rangée, 2 voisins, un doigt, un
  doigt relié, 2 à gauche ou à droite glissés, 2 rangées copiées ; `ge-ci-reperes` = 2 repères glissés, 3 « lequel
  ne bouge pas », 2 intrus, 3 trajets ; `ge-ci-quadrillage` = 3 dessins à copier (le jeu `pixel-copie`, qui reste
  un jeu), 2 places, un texte à trous, 2 déplacements d'un pion, une ligne et une colonne, un dessin glissé en
  haut ou en bas.
  `generateBucketCore` saute alors le modèle (`aiCount` vaut 0,
  `exercisesToRequest(0)` aussi), ne demande aucune réserve, n'échoue pas en
  `TOO_FEW_VALID_EXERCISES` et garde ses dix exercices, tant que le contrôleur
  n'abandonne aucun gabarit (un gabarit refusé après les essais rouvre une place
  au modèle ; aucun refus sur 24 000 paliers simulés). La pré-génération le
  sait (`pregen:run` annonce ces paliers dans `withoutModel`, hors du coût estimé :
  `topicUsesModel`). Un exercice raté par l'enfant se refait par le code
  (`regenerateGame`) : le modèle n'est appelé que pour un exercice qu'il a écrit.
  `convex/__tests__/templatesWithoutModel.test.ts` joue la génération complète de
  chaque palier de ces vingt-neuf thématiques contre un faux modèle qui lève une
  exception au moindre appel. Il reste un appel au modèle pour ces paliers :
  l'explication pas à pas qu'un enfant demande après cinq essais ratés
  (`explainExercise`, `convex/explainMistake.ts`), mise en cache par exercice.
  Les autres thématiques gardent des exercices du modèle, avec leurs défauts connus (voir plus
  haut) : en CI, les premières phrases, les salutations, l'éveil, l'instruction civique,
  l'anglais et l'éducation artistique ; toutes les autres classes, sauf l'histoire et la géographie du CP. L'histoire et la géographie du CI et du CP
  n'appellent plus le modèle.
  Les fiches de géométrie et de mesure du CI ne couvrent pas tout leur programme : ni « dessus,
  dessous » (il faudrait une mise en page verticale), ni « plus long » ni « plus plein », et le
  rectangle n'est jamais la bonne réponse d'un nom de forme (aucun émoji sûr) ; ils restent à
  ajouter.
- **La vitrine** ne leur donne pas de carte : ce sont des QCM, des ordres, des
  associations et des phrases à trous, déjà montrés. Son test n'admet un exercice
  dans une thématique tout en jeux que si l'un de ses gabarits fabrique ce type
  (l'histoire du CI montre sa phrase à trous dans « Les jours de la semaine », que `jour-manquant` fabrique, et la
  géographie son relier dans « Ma droite et ma gauche », que `doigt-relier` fabrique)
  (le glisser-déposer du français du CI est rattaché à « Bonjour, merci, s'il te plaît », où le
  modèle l'écrit ; celui des mathématiques à « Les formes et les solides », que `classer-formes`
  fabrique). Au CP, l'histoire et la géographie sont tout en gabarits : la réponse courte de la vitrine est rattachée à « Le
  calendrier » (`mois-ecart`) et à « Près ou loin ? » (`pas-difference`), les deux gabarits qui demandent un nombre à écrire.
