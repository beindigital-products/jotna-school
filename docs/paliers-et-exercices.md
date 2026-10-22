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

Au CI, Pio dit aussi les propositions (les tuiles) après la consigne, et les
redit quand l'enfant en touche une. Il ne les dit ni quand l'énoncé demande de
lire ou de décoder, ni en anglais : voir `docs/voix-des-tuiles.md`.

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

- **Des gabarits de réponse courte, dès le CP.** `short-answer` figure parmi les types de gabarits (`GameExerciseType`,
  `TEMPLATE_TYPES`), et le contrôleur les juge comme ceux du modèle. Deux sortes de réponse :
  - **un nombre** (`mois-ecart`, `pas-difference`) : une seule réponse admise, en chiffres collés (le pavé numérique s'ouvre), et la
    consigne finit par « Écris le nombre. » ;
  - **un mot de la liste fermée du gabarit** (`nombre-ecrire`, `lire-assembler`) : une seule réponse admise, en lettres, donc le clavier
    des lettres s'ouvre. Le mot n'est jamais écrit dans l'énoncé : `nombre-ecrire` donne le nombre en chiffres, `lire-assembler` donne
    les syllabes mélangées et un dessin.
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
| `phrase-ordre` | ordre | « Remets les mots dans l'ordre pour faire une phrase. » : `Lola > a > une > robe.` (le mot à majuscule ouvre, le mot qui porte le point ferme, un seul ordre fait une phrase) |
| `phrase-ecrite` | QCM | « Quelle phrase est bien écrite ? » : `Lola a une robe.` parmi `lola a une robe.` et `Lola a une robe` (au premier palier on ne regarde qu'une chose : « commence par une majuscule » ou « finit par un point ») |
| `phrase-mots-compter` | QCM | « Combien de mots dans la phrase « Lola a une robe. » ? » : 4 |
| `phrase-mot-place` | QCM | « Quel est le premier mot de la phrase « … » ? » ou « le dernier » : `Lola`, parmi trois mots de la phrase |
| `politesse-situation` | QCM | « Tu arrives à l'école le matin. Que dis-tu ? » : `😊 Bonjour`, parmi trois formules |
| `politesse-besoin` | QCM | « Il fait très chaud et tu veux boire. Que dis-tu ? » : `🥛 J'ai soif`, parmi trois sentiments |
| `politesse-relier` | association | « Relie chaque formule à la situation qui lui va. » : `🙏 Merci ~ 🎁 On me donne un cadeau…` |
| `politesse-glisser` | glisser-déposer | « Glisse chaque situation sous ce que l'on dit. » : une ou deux situations sous chaque formule |
| `politesse-trou` | phrase à trous | « Complète la phrase. » : `On te donne un cadeau. Tu dis ___ !` : `🙏 Merci` |
| `politesse-rencontre` | ordre | « Mets les paroles dans l'ordre de la rencontre. » : `😊 Bonjour`, `🙋 Je m'appelle Awa`, `👋 Au revoir` |
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
| `famille-mot` | QCM | « Quel mot va avec ce dessin ? » puis 👦 : `brother`, parmi trois mots de la liste |
| `famille-lien` | QCM | « Quel mot anglais dit « la maman de ta maman » ? » : `grandmother` |
| `famille-relier` | association | « Relie chaque dessin à son mot. » : `👩~mother ; 👶~baby…` |
| `famille-glisser` | glisser-déposer | « Glisse chaque mot dans la bonne case. » : `mother` dans Femme ou fille, `father` dans Homme ou garçon (le bébé et l'ami n'y sont pas) |
| `famille-trou` | phrase à trous | `👴 This is my ___.` : `grandfather` |
| `famille-phrase` | ordre | « Remets les mots dans l'ordre pour écrire une phrase. » : `This > is > my > mother.` |
| `corps-mot` | QCM | « Quel mot va avec ce dessin ? » puis 🦶 : `foot` (sept dessins sûrs) |
| `corps-consigne` | QCM | « Comment dit-on « touche ton nez » en anglais ? » : `Touch your nose.` parmi trois phrases du même verbe |
| `corps-relier` | association | un dessin et son mot au premier palier, ensuite un mot français et son mot anglais (`oreille~ear`) |
| `corps-glisser` | glisser-déposer | `eye` dans Visage, `arm` dans Bras et jambes |
| `corps-trou` | phrase à trous | « Complète la phrase pour toucher ton bras. » puis `Touch your ___.` : `arm` |
| `corps-phrase` | ordre | `Touch > your > ear.` |
| `classe-mot` | QCM | « Quel mot va avec ce dessin ? » puis 📖 : `book` (quatre dessins sûrs : livre, cartable, règle, porte) |
| `classe-francais` | QCM | « Comment dit-on « la chaise » en anglais ? » : `chair` |
| `classe-relier` | association | un dessin et son mot, ou un mot français et son mot anglais (`livre~book`) |
| `classe-glisser` | glisser-déposer | `pen` dans Petit objet, `desk` dans Grand objet (le cartable n'y est pas) |
| `classe-trou` | phrase à trous | `🎒 It is a ___.` : `bag` (tous les choix commencent par une consonne, donc « a ») |
| `classe-question` | phrase à trous | `What is it? 🚪 It is a ___.` : `door` |
| `classe-phrase` | ordre | `It > is > a > book.` |
| `nombre-mot` | QCM | « Comment écrit-on le nombre 14 en anglais ? » : `fourteen` |
| `nombre-chiffre` | phrase à trous | `sixteen = ___` : `16` parmi trois nombres en chiffres |
| `nombre-relier` | association | « Relie chaque nombre à son mot anglais. » : `14~fourteen…` |
| `nombre-ordre` | ordre | « Remets ces nombres dans l'ordre, du plus petit au plus grand. » : `thirteen > fifteen > nineteen` |
| `nombre-suivant` | QCM | « Quel est le mot anglais du nombre qui vient juste après 18 ? » : `nineteen` |
| `nombre-age` | phrase à trous | « Tu as 7 ans. Complète la réponse. » puis `How old are you? I am ___.` : `seven` |
| `nombre-ecrire` | réponse courte | « Écris en lettres, en anglais, le nombre 16. » : `sixteen` |
| `nombre-glisser` | glisser-déposer | cases « Moins de 14 » et « Plus de 14 » : `twelve` à gauche, `sixteen` à droite (le repère n'est jamais une étiquette) |
| `nombre-compter` | QCM | deux rangées de dessins, dix puis cinq : `fifteen` |
| `aliment-mot` | QCM | « Quel mot va avec ce dessin ? » puis 🥛 : `milk` (huit dessins sûrs) |
| `aliment-francais` | QCM | « Comment dit-on « le poulet » en anglais ? » : `chicken` |
| `aliment-relier` | association | un dessin et son mot, ou un mot français et son mot anglais (`riz~rice`) |
| `aliment-glisser` | glisser-déposer | `bread` dans Je mange, `tea` dans Je bois |
| `aliment-trou` | phrase à trous | `🍚 I like ___.` : `rice` (jamais `egg` : « I like egg. » est faux) |
| `aliment-trou-francais` | phrase à trous | « Complète la phrase pour dire que tu aimes le jus. » puis `I like ___.` : `juice` |
| `aliment-phrase` | ordre | `I > like > rice.` |
| `animal-mot` | QCM | « Quel mot va avec ce dessin ? » puis 🐘 : `elephant`, parmi trois animaux |
| `animal-francais` | QCM | « Comment dit-on « la vache » en anglais ? » : `cow` |
| `animal-relier` | association | un dessin et son mot (`🐶~dog`), ou, aux deux derniers niveaux et une fois sur deux, un mot français et son mot anglais (`chèvre~goat`) |
| `animal-glisser` | glisser-déposer | `🐄 cow` dans Animaux de la ferme, `🐘 elephant` dans Animaux sauvages (le chien, le chat, l'oiseau et le poisson ne sont jamais rangés) |
| `animal-intrus` | QCM | « Lequel ne vit pas à la ferme ? » : `🦁 lion`, parmi `🐄 cow` et `🐐 goat` |
| `fruit-mot` | QCM | « Quel mot va avec ce dessin ? » puis 🍍 : `pineapple` |
| `fruit-francais` | QCM | « Comment dit-on « la mangue » en anglais ? » : `mango` |
| `fruit-relier` | association | un dessin et son mot (`🍋~lemon`), ou un mot français et son mot anglais (`pomme~apple`) |
| `fruit-glisser` | glisser-déposer | `🥭 mango` dans Fruits, `🐒 monkey` dans Animaux |
| `fruit-intrus` | QCM | « Lequel n'est pas un fruit ? » : `🐘 elephant`, parmi `🍌 banana` et `🍎 apple` |
| `couleur-mot` | QCM | « De quelle couleur est ce dessin ? » puis 💛 : `yellow` (jamais une couleur voisine en mauvais choix) |
| `couleur-chose` | QCM | « De quelle couleur est la banane ? » puis 🍌 : `yellow` |
| `couleur-francais` | QCM | « Comment dit-on « la couleur verte » en anglais ? » : `green` |
| `couleur-relier` | association | `💚~green ; 🔴~red ; 🔵~blue` |
| `couleur-glisser` | glisser-déposer | `🍅` et `🍓` sous `red`, `🍌` et `🍋` sous `yellow` |
| `couleur-phrase` | phrase à trous | `🧡 It is ___.` : `orange` |
| `compte-mot` | QCM | « Quel mot va avec le chiffre 7 ? » : `seven` |
| `compte-chiffre` | phrase à trous | « Complète avec le bon chiffre. » puis `three = ___` : `3` |
| `compte-dessins` | QCM | « Combien vois-tu de dessins ? Choisis le mot anglais. » puis deux rangées de cinq et de deux 🍎 : `seven` |
| `compte-relier` | association | `4~four ; 9~nine ; 0~zero` |
| `compte-relier-dessins` | association | `⭐⭐⭐~three ; 🍎🍎~two` (un dessin différent par groupe, des nombres différents) |
| `compte-ordre` | ordre | `two > five > eight > ten` |
| `compte-suivant` | QCM | « Quel est le mot anglais du nombre qui vient juste après 4 ? » : `five` |
| `compte-suite` | phrase à trous | « Complète la suite des nombres. » puis `one, two, ___` : `three` (trois nombres montrés dès le deuxième palier, une suite qui descend dès le troisième niveau) |
| `compte-glisser` | glisser-déposer | `two` dans Moins de 5, `nine` dans Plus de 5 (jamais le repère) |
| `salut-francais` | QCM | « Comment dit-on « merci » en anglais ? » : `thank you` |
| `salut-dessin` | QCM | « Quel mot va avec ce dessin ? » puis 🌙 : `good night` (le lever du soleil, la lune, un pouce levé, un pouce baissé, un visage triste) |
| `salut-situation` | QCM | « Tu arrives à l'école. Que dis-tu en anglais ? » : `hello` |
| `salut-relier` | association | un dessin et son mot (`🌅~good morning`), ou un mot français et son mot anglais (`oui~yes`) |
| `salut-glisser` | glisser-déposer | `hello`, `hi`, `good morning` dans Pour dire bonjour ; `goodbye`, `bye` dans Pour dire au revoir |
| `salut-prenom` | ordre | `I > am > Awa.` ou `My > name > is > Modou.` |
| `salut-trou` | phrase à trous | `My ___ is Awa.` : `name` |
| `salut-trou-dessin` | phrase à trous | `🌙 Good ___!` : `night` |
| `salut-rencontre` | ordre | `Hello! > I am Awa. > Goodbye!` |
| `civ-situation` | QCM | « Ta grand-mère te parle. Que fais-tu ? » : `👂 J'écoute ma grand-mère calmement`, parmi deux gestes à éviter de la même scène, sous le clip de la scène (`payload.scene`) |
| `civ-glisser` | glisser-déposer | cases `✅ À faire` et `❌ À éviter` : `🧼 Je me lave les mains avec du savon` à gauche, `🚯 Je jette le papier par terre` à droite (quatre ou cinq gestes de scènes différentes) |
| `civ-intrus` | QCM | « Quel geste n'est pas bien ? » : `🚯 Je jette le papier par terre`, parmi deux bons gestes ; ou « Quel geste est bien ? » avec un seul bon geste parmi deux gestes à éviter |
| `civ-relier` | association | `🔴 le feu rouge~🛑 Je m'arrête et j'attends au feu rouge ; 🚸 le passage piéton~🦓 Je traverse sur les bandes blanches` (jamais deux scènes d'un même groupe) |
| `civ-ordre` | ordre | « Mets ces gestes dans l'ordre de la traversée. » : `Je m'arrête au bord du trottoir > Je regarde à gauche > Je regarde à droite > Je traverse sur le passage piéton` |
| `civ-trou` | phrase à trous | `Au feu ___, je m'arrête.` : `rouge`, parmi `vert` et `bleu` |
| `milieu-intrus` | QCM | « Quelle chose est fabriquée par l'homme ? » : `la table`, parmi deux choses de la nature ; ou « Quelle chose existe dans la nature, sans l'homme ? » avec une seule chose de la nature parmi deux objets fabriqués |
| `milieu-glisser` | glisser-déposer | cases `Naturel` et `Fabriqué` : `le soleil` et `l'eau` à gauche, `le vélo` et `le ballon` à droite (quatre choses, cinq aux deux derniers niveaux) |
| `milieu-trou` | phrase à trous | `Le sable, la pierre et ___ sont dans la nature.` : `l'arbre`, parmi `la table` et `le seau` |
| `faune-glisser` | glisser-déposer | cases `Domestiques` et `Sauvages` : `le mouton` et `le chat` à gauche, `le lion` et `le crocodile` à droite |
| `faune-habitat` | glisser-déposer | cases `Dans l'eau`, `Sur la terre` et `Dans les airs` : `le poisson`, `l'âne`, `l'oiseau` (au moins un animal dans chaque case, jamais le crocodile) |
| `faune-intrus` | QCM | « Quel animal est sauvage ? » : `le lion`, parmi deux animaux domestiques ; ou « Quel animal est domestique ? » avec un seul animal domestique parmi deux sauvages |
| `faune-couvre` | QCM | « Quel animal a des plumes ? » : `la poule`, parmi deux animaux qui ont des poils ou des écailles (jamais le mouton, la chèvre ni l'éléphant) |
| `faune-vit` | QCM | « Quel animal vit dans l'eau ? » : `le poisson`, parmi deux animaux qui marchent ; ou « Quel animal vole dans le ciel ? » : `l'oiseau` |
| `faune-relier` | association | `le poisson~Dans l'eau ; l'oiseau~Dans les airs ; le mouton~Sur la terre` |
| `faune-trou` | phrase à trous | `Le poisson a des ___.` : `écailles`, parmi `plumes` et `poils` ; `La vache donne ___.` : `du lait` |
| `plante-partie` | QCM | « Quelle partie de la plante est sous la terre ? » : `la racine`, parmi deux autres parties |
| `plante-qui` | QCM | « Quelle plante donne des mangues ? » puis 🥭 : `le manguier`, parmi deux autres plantes |
| `plante-donne` | association | `le manguier~la mangue ; l'arachidier~l'arachide ; le mil~les grains de mil` (trois paires parmi cinq) |
| `plante-type` | glisser-déposer | cases `Un arbre` et `Une plante du champ` : `le baobab` et `le manguier` à gauche, `le mil` et `l'arachidier` à droite |
| `plante-ordre` | ordre | « Mets les parties de la plante dans l'ordre du bas vers le haut. » : `la racine > la tige > la feuille` |
| `plante-trou` | phrase à trous | `La mangue est ___ du manguier.` : `le fruit`, parmi `la racine` et `la feuille` |
| `hygiene-situation` | QCM | « Tu vas manger ton repas. Que fais-tu ? » : `🧼 Je me lave les mains avant de manger`, parmi deux gestes à éviter de la même scène |
| `hygiene-glisser` | glisser-déposer | cases `✅ À faire` et `❌ À éviter` : `🦷 Je me brosse bien les dents` à gauche, `🤢 Je mange avec les mains sales` à droite |
| `hygiene-intrus` | QCM | « Quel geste est mauvais pour la santé ? » : un geste à éviter parmi deux bons gestes ; ou « Quel geste est bon pour la santé ? » |
| `hygiene-ordre` | ordre | « Mets les gestes dans l'ordre pour te laver les mains. » : `Je mouille mes mains > Je mets du savon > Je frotte mes mains > Je rince mes mains` |
| `hygiene-sens` | QCM | « Avec quoi je vois ? » : `les yeux`, parmi deux autres parties du corps |
| `hygiene-soin` | association | `les mains~Les laver avec du savon ; les dents~Les brosser ; les ongles~Les couper` |
| `hygiene-trou` | phrase à trous | `Je me lave les mains avec du ___.` : `savon`, parmi `lait` et `riz` |
| `outil-qui` | QCM | « Avec quoi je coupe le papier ? » : `les ciseaux`, parmi deux outils qui ne le font sûrement pas |
| `outil-relier` | association | `les ciseaux~Couper du papier ; le balai~Balayer la cour ; l'arrosoir~Arroser les plantes` (jamais deux outils d'un même groupe : le seau et l'arrosoir, le marteau et le pilon) |
| `outil-trou` | phrase à trous | `Je coupe le papier avec ___.` : `les ciseaux`, parmi `le marteau` et `le balai` |
| `outil-ordre` | ordre | « Mets les gestes dans l'ordre pour utiliser le balai. » : `Je prends le balai > Je balaie la cour > Je range le balai` |
| `outil-geste` | QCM | « Tu vas enfoncer un clou avec le marteau. Que fais-tu ? » : `👀 Je regarde bien le clou en frappant`, parmi deux gestes à éviter |
| `outil-glisser` | glisser-déposer | cases `✅ À faire` et `❌ À éviter` : `🧺 Je range les ciseaux à leur place` à gauche, `🤾 Je lance le marteau à mon ami` à droite |
| `teinte-chose` | QCM | « Quelle chose est jaune ? » : `la banane`, parmi deux choses d'une autre couleur (rouge ou jaune au premier palier, vert ou bleu au deuxième, orange, violet ou blanc au troisième) |
| `teinte-relier` | association | `la fraise~🔴 rouge ; la feuille~💚 vert ; le poussin~💛 jaune` (trois couleurs différentes) |
| `teinte-glisser` | glisser-déposer | cases `🔴 rouge` et `💛 jaune` : `la tomate` et `la fraise` d'un côté, `le soleil` et `la banane` de l'autre (jaune et vert au deuxième palier, vert et blanc au troisième, avec cinq tuiles) |
| `teinte-ordre` | ordre | « Mets les couleurs du drapeau du Sénégal dans l'ordre, de gauche à droite. » : `💚 vert > 💛 jaune > 🔴 rouge` ; au deuxième palier les lumières du feu de haut en bas, au troisième les quatre premières couleurs de l'arc-en-ciel |
| `contour-chose` | QCM | « Quelle forme a le drapeau ? » : `le rectangle`, parmi deux autres formes |
| `contour-relier` | association | `le toit~le triangle ; la fenêtre~le carré ; la pizza~le rond` (trois formes différentes) |
| `contour-glisser` | glisser-déposer | cases `le rectangle` et `le rond` : `le cahier` et `la règle` d'un côté, `l'assiette` et `la pizza` de l'autre |
| `contour-trou` | phrase à trous | `Le triangle a ___ coins.` : `trois`, parmi `quatre` et `cinq` ; `Le drapeau a la forme d'un ___.` : `rectangle`, parmi `triangle` et `rond` |
| `guirlande-suite` | QCM | « Quel dessin continue la frise ? » puis `🥁 🐟 🥁 🐟 🥁 ❓` : `🐟`, parmi l'autre dessin de la frise et un dessin qui n'y est pas (le motif répété est `AB` au premier palier, `AAB` au deuxième, `ABC` au troisième) |
| `guirlande-intrus` | QCM | « Quel dessin n'est pas à sa place dans la frise ? » puis `🏠 🍌 🏠 🍌 🏠 🍌 ⛵ 🍌` : `⛵`, parmi les deux dessins de la frise |
| `visage-glisser` | glisser-déposer | cases `Joie` et `Tristesse` : `😀 😊` et `😢 😭` (trois cases aux paliers suivants ; au dernier, `Tristesse`, `Peur` et `Joie` pour l'un des deux rangements du palier, `Colère`, `Surprise` et `Joie` pour l'autre, jamais la peur avec la surprise) |
| `visage-quel` | QCM | « Quel visage montre la tristesse ? » : `😢`, parmi deux visages d'autres émotions |
| `visage-emotion` | QCM | « Quelle émotion montre ce visage ? » puis 😀 : `Joie`, parmi `Colère` et `Tristesse` |
| `visage-relier` | association | `😀~Joie ; 😡~Colère ; 😢~Tristesse` |
| `emotion-situation` | QCM | « Tu reçois un beau cadeau. Que ressens-tu ? » : `😀 Joie`, parmi `😨 Peur` et `😢 Tristesse` (jamais la tristesse avec la colère) |
| `emotion-geste` | QCM | « Que fais-tu quand tu ressens de la peur ? » : `🙈 Je me cache et je tremble`, parmi deux gestes d'autres émotions |
| `cri-animal` | QCM | « Quel animal fait miaou ? » : `le chat`, parmi deux autres animaux |
| `cri-relier` | association | `la vache~meuh ; le chat~miaou ; le chien~ouaf ouaf` |
| `emotion-trou` | phrase à trous | `Quand je suis triste, je ___.` : `pleure`, parmi `danse` et `saute` |
| `lire-dessin` | QCM | « Quel mot va avec ce dessin ? » puis 🐇 : `lapin`, parmi trois mots à lire (aux paliers suivants, trois mots qui commencent pareil) |
| `lire-relier` | association | « Relie chaque mot à son dessin. » : `tomate~🍅 ; banane~🍌…` |
| `lire-syllabes` | ordre | « Remets les syllabes dans l'ordre pour écrire le mot de ce dessin. » puis 🍅 : `to > ma > te` (trois syllabes au moins) |
| `lire-assembler` | réponse courte | « Assemble les syllabes to - te - ma pour écrire le mot de ce dessin. » puis 🍅 : `tomate` |
| `lire-son` | QCM | « Quel mot a le son ou ? » : `mouton`, parmi un mot qui a le son u et un mot qui n'a aucun des deux |
| `lire-son-glisser` | glisser-déposer | cases « Le son ou » et « Le son u », ou « Le son on » et « Le son o », ou « Le son é » et « Le son è » |
| `lire-lettre` | QCM | « Quel mot commence par la lettre b ? » : `ballon`, parmi un mot en d et un mot en p |
| `lire-trou` | phrase à trous | `🍬 Voici un ___.` : `bonbon` (les trois choix ont le même genre) |
| `lire-phrase` | QCM | « Awa mange une mangue. Modou boit du lait. » puis « Qui boit du lait ? » : `Modou` (ou « Que fait Awa ? ») |
| `ecrire-ordre` | ordre | `Awa > lit > un > livre.` ou `Le > chat > dort.` : un seul rangement est une phrase |
| `ecrire-bien-ecrite` | QCM | « Quelle phrase est bien écrite ? » : `Awa lit un livre.`, contre la même phrase sans majuscule et sans point |
| `ecrire-un-des` | phrase à trous | `Cheikh a ___ chat.` : `un` ; `Voici ___ vaches.` : `les` |
| `ecrire-groupe` | phrase à trous | trois pommes dessinées, `Il y a ___ pommes.` : `des` (un seul dessin : `une`) |
| `ecrire-pluriel` | association | « Relie chaque nom au singulier à son pluriel. » : `pomme~pommes…` |
| `ecrire-nombre` | glisser-déposer | cases Singulier et Pluriel : `chat` et `chats` |
| `ecrire-texte` | ordre | `Fatou va au marché. > Elle achète du riz. > Elle rentre à la maison.` |
| `ecrire-mot` | phrase à trous | `On mange une ___.` : `mangue`, parmi deux mots du même genre qui ne se mangent pas |
| `consigne-sens` | QCM | « La consigne dit « Découpe ». Que fais-tu ? » : `Je coupe avec des ciseaux.` |
| `consigne-verbe` | QCM | « Quel mot de consigne veut dire « écrire une deuxième fois » ? » : `Recopie` |
| `consigne-relier` | association | « Relie chaque consigne à ce qu'elle veut dire. » : `Souligne~tracer un trait sous le mot…` |
| `consigne-trou` | phrase à trous | `___ la phrase en l'écrivant une deuxième fois.` : `Recopie` |
| `consigne-intrus` | QCM | « Quel mot n'est pas une consigne de classe ? » : `Mange`, parmi `Relie` et `Entoure` |
| `consigne-etapes` | ordre | « Mets ces étapes dans le bon ordre pour planter une graine. » : `Fais un trou… > Mets la graine… > Recouvre… > Arrose…` |
| `contraire-qcm` | QCM | « Quel mot est le contraire de « petit » ? » : `grand` (jamais deux mots de taille parmi les choix) |
| `contraire-relier` | association | `léger~lourd ; chaud~froid ; plein~vide ; court~long` |
| `contraire-trou` | phrase à trous | `Le verre n'est pas plein, il est ___.` : `vide` |
| `comparer-trou` | phrase à trous | deux bêtes dessinées, `Le chien est plus ___ que la girafe.` : `petit` (jamais un deuxième mot vrai parmi les choix) |
| `adjectif-ordre` | ordre | `Moussa > voit > une > jolie > vache.` (un seul rangement est une phrase) |
| `recit-ordre` | ordre | `D'abord, Cheikh sort de la classe. > Ensuite, il joue au ballon dans la cour. > Enfin, il retourne en classe.` |
| `recit-qui` | QCM | deux phrases dans l'énoncé, puis « Qui joue au ballon dans la cour ? » : `Awa` |
| `recit-ou` | QCM | « Moussa sort de la classe. Il joue au ballon dans la cour. » puis « Où joue Moussa ? » : `dans la cour` (l'endroit est écrit dans le texte) |
| `recit-quoi` | QCM | « Cheikh achète des mangues au marché. » puis « Que fait Cheikh ? » : `Il achète des mangues.` |
| `recit-quand` | QCM | « Le soir, Fatou va au marché… » puis « Quel moment de la journée est écrit dans l'histoire ? » : `le soir` |
| `recit-trou` | phrase à trous | `D'abord, … ___, elle attrape un poisson… Enfin, …` : `Ensuite` |
| `recit-relier` | association | trois phrases dans l'énoncé, puis `Moussa~achète des mangues…` |
| `invitation-glisser` | glisser-déposer | cases Invitation et Conseil : `Viens à mon baptême samedi !` et `Lave-toi les mains avant de manger.` |
| `invitation-choisir` | QCM | « Quelle phrase est un conseil ? » : `Regarde des deux côtés avant de traverser.` |
| `invitation-reponse` | QCM | « Modou t'invite à chanter. Tu veux venir. Que réponds-tu poliment ? » : `Oui, merci beaucoup !` (un palier accepte une fois et refuse une fois) |
| `invitation-qui` | QCM | « Awa invite Aminata à son baptême samedi. » puis « Quel jour a lieu l'invitation ? » : `samedi` (ou qui invite, qui est invité) |
| `invitation-trou` | phrase à trous | `Awa invite Modou. Elle lui dit « ___ jouer au ballon avec moi ! »` : `Viens` (jamais `Venez`) |
| `invitation-ordre` | ordre | `Salut Cheikh ! > Je t'invite à mon anniversaire. > À dimanche !` |
| `peinture-outil` | QCM | « À quoi sert la palette ? » : `mélanger les couleurs` (ou « Quel outil sert à laver le pinceau ? ») |
| `peinture-relier` | association | `palette~mélanger les couleurs ; pinceau~étaler la peinture ; gobelet d'eau~laver le pinceau` |
| `ligne-qcm` | QCM | « Quelle ligne est arrondie, comme un arc-en-ciel ? » : `courbe` (la ligne est décrite par ce qu'on voit, jamais dessinée avec des signes) |
| `ligne-relier` | association | `droite~ne tourne jamais ; spirale~tourne en s'enroulant sur elle-même, comme un escargot…` |
| `ligne-glisser` | glisser-déposer | cases Ligne droite et Ligne courbe : `le bord d'une règle` et `le bord d'une roue` |
| `trait-qcm` | QCM | « Quel trait est très fin ? » : `délié` |
| `technique-qcm` | QCM | « Que prends-tu pour dessiner une maison ? » : `crayon` |
| `technique-relier` | association | `peindre~pinceau ; dessiner~crayon ; modeler~argile` |
| `voix-ordre` | ordre | `chuchoter > parler doucement > parler fort > crier` (trois voix au premier palier) |
| `voix-qcm` | QCM | « Quelle façon de parler est la plus forte ? » : `crier`, parmi trois des quatre voix |
| `voix-trou` | phrase à trous | `Pour dire un secret à l'oreille, on parle ___.` : `doucement` (les mauvais choix sont tous des voix fortes) |
| `geste-situation` | QCM | « Tu veux traverser la route. Que faut-il faire ? » : `Je regarde à gauche et à droite avant de traverser.`, contre deux mauvais gestes de la même scène |
| `geste-glisser` | glisser-déposer | cases À faire et À éviter : `Je mets un casque sur ma tête.` et `Je monte sans casque.` |
| `geste-intrus` | QCM | « Quel geste est bien ? » ou « Quel geste n'est pas bien ? » : un geste d'un côté, deux de l'autre, de trois scènes différentes |
| `geste-relier` | association | « Relie chaque situation au bon geste. » : `Tu descends du car~Je descends doucement et je regarde la route.` |
| `geste-ordre` | ordre | `Je m'arrête au bord de la route. > Je regarde à gauche et à droite. > Je traverse quand la route est libre.` |
| `geste-trou` | phrase à trous | `Au panneau STOP, la voiture ___.` : `s'arrête` |
| `droit-devoir` | glisser-déposer | cases Droits et Devoirs : `Je peux jouer à la récréation.` et `Je dois ranger mes affaires.` |
| `role-qui` | QCM | « Qui balaie la classe ? » : `le responsable de la propreté` |
| `role-relier` | association | `chef de classe~garde le calme ; propreté~balaie la classe…` (étiquettes courtes : l'écran coupe les longues en syllabes) |
| `panneau-qcm` | QCM | « Que veut dire le panneau STOP ? » : `Il faut s'arrêter.` |
| `route-ecrire` | réponse courte | « À moto, que dois-tu mettre sur la tête pour te protéger ? Écris le mot. » : `casque` |
| `etat-qcm` | QCM | « Dans quel état est la pierre ? » : `solide`, parmi les trois états |
| `etat-glisser` | glisser-déposer | deux états sur trois en cases : `Pierre` et `Bois` sous Solide, `Eau` et `Lait` sous Liquide |
| `etat-relier` | association | `Solide~Bois ; Liquide~Lait ; Gaz~Air` |
| `etat-change` | QCM | « Que devient un glaçon posé au soleil ? » : `Eau`, contre `Pierre` et `Bois` |
| `etat-ordre` | ordre | `Glace > Eau > Vapeur` (un glaçon qu'on chauffe) ou `Vapeur > Eau > Glace` (la vapeur qu'on refroidit) |
| `etat-trou` | phrase à trous | `Un ___ garde sa forme.` : `solide` |
| `etat-ecrire` | réponse courte | « Une pierre garde sa forme. Écris le mot qui dit son état. » : `solide` (ou `un solide`) |
| `vie-ordre` | ordre | `Œuf > Poussin > Poule` ; la plante, la personne (quatre étapes), la grenouille |
| `vie-suite` | QCM | « Dans la vie de la poule, quelle étape vient juste après l'œuf ? » : `Poussin`, contre deux étapes d'une autre vie |
| `vie-petit` | QCM | « Comment s'appelle le petit du mouton ? » : `Agneau` (ou « Le chiot est le petit de quel animal ? » : `Chien`) |
| `vie-relier` | association | `Vache~Veau ; Chat~Chaton ; Poule~Poussin` |
| `vie-glisser` | glisser-déposer | cases Ça grandit et Ça ne grandit pas : `Poussin` et `Pierre` |
| `vie-trou` | phrase à trous | `Le têtard devient une ___.` : `grenouille` |
| `habitude-situation` | QCM | « Tu as très soif. Que faut-il faire ? » : `Je bois de l'eau propre.`, contre deux mauvais gestes de la même scène |
| `habitude-glisser` | glisser-déposer | cases À faire et À éviter : `Je vide l'eau des vieux seaux.` et `Je jette le sachet vide par terre.` |
| `habitude-intrus` | QCM | « Quel geste est bien ? » ou « Quel geste n'est pas bien ? » : un geste d'un côté, deux de l'autre, de trois scènes différentes |
| `habitude-relier` | association | « Relie chaque situation au bon geste. » : `Tu sors des toilettes~Je me lave les mains avec du savon après les toilettes.` |
| `habitude-ordre` | ordre | `Je fais un trou dans la terre. > Je plante le petit arbre. > J'arrose le petit arbre.` |
| `habitude-trou` | phrase à trous | `Le paludisme se prend par la piqûre d'un ___.` : `moustique` |
| `repas-qcm` | QCM | « Quel aliment faut-il éviter ? » : `Pain moisi`, contre deux aliments utiles (ou « Quel aliment fait du bien au corps ? ») |
| `repas-glisser` | glisser-déposer | cases Bon pour le corps et À éviter : `Mangue` et `Trop de bonbons` |
| `repas-fruit-legume` | glisser-déposer | cases Fruits et Légumes : `Papaye` et `Carotte` |
| `maladie-glisser` | glisser-déposer | cases Contre le paludisme et Contre la diarrhée : `Dormir sous une moustiquaire` et `Boire de l'eau propre` |
| `maladie-cause` | QCM | « Qu'est-ce qui peut donner la diarrhée ? » : `Boire de l'eau sale`, contre deux gestes qui ne la donnent pas |
| `nature-reparer` | association | `Une cour sale~La balayer ; Un arbre coupé~Planter un arbre ; Un sachet par terre~À la poubelle` |
| `metier-qui` | QCM | « Qui soigne les malades ? » : `Infirmière`, parmi trois métiers |
| `metier-outil` | QCM | « Quel objet sert au pêcheur ? » : `Filet`, parmi les objets de trois métiers |
| `metier-relier` | association | « Relie chaque métier à son travail. » (`pêcheur~attrape des poissons`) ou « …à son objet. » (`boulanger~Four`) |
| `metier-glisser` | glisser-déposer | un métier par case, ses deux gestes : `Attrape des poissons` et `Répare ses filets` sous Pêcheur |
| `metier-trou` | phrase à trous | `Le chauffeur conduit le ___.` : `car` |
| `metier-ordre` | ordre | `Il lance son filet. > Il tire son filet. > Il apporte les poissons au marché.` |
| `metier-ecrire` | réponse courte | « Dans un jeu de rôles, tu lances un filet à la mer pour attraper des poissons. Quel métier joues-tu ? Écris le mot. » : `pêcheur` |
| `imiter-qcm` | QCM | « Quel animal fait « miaou » ? » : `Chat` (ou « Que dit le chat ? » : `miaou`) |
| `imiter-relier` | association | `Chat~miaou ; Vache~meuh ; Coq~cocorico` |
| `nb-voisin` | QCM | « Quel nombre vient juste après 69 ? » : `70`, le plafond de la fiche jamais dépassé |
| `nb-comparer` | QCM | « Quel est le plus grand de ces nombres ? » : trois nombres, dont deux de la même dizaine dès le deuxième palier |
| `nb-ordre` | ordre | `52 > 54 > 56 > 70` |
| `nb-dizaines` | QCM | « Dans 53, combien y a-t-il de dizaines ? » : `5` (ou « d'unités », ou « dans une centaine » : `10`) |
| `nb-decomposer` | phrase à trous | `37 = 30 + ___` : `7` ; `3 dizaines et 7 unités, c'est le nombre ___.` ; `5 × 10 + 2 = ___` (fiche de 100) |
| `nb-glisser` | glisser-déposer | cases Moins de 60 et Plus de 60 : `54` et `63` |
| `nb-lettres` | QCM | « Quel nombre s'écrit « quatre-vingts » ? » : `80` |
| `nb-relier` | association | `53~cinquante-trois ; 69~soixante-neuf ; 90~quatre-vingt-dix` |
| `nb-ecrire` | réponse courte | « Écris en chiffres le nombre « soixante-quinze ». » : `75` |
| `calc-ajouter` | QCM | « Combien font 47 + 38 ? » : `85` (les unités passent dix) |
| `calc-enlever` | QCM | « Combien font 62 − 38 ? » : `24`, contre `36` (l'erreur de qui n'emprunte pas) |
| `calc-retenue` | QCM | « Dans 47 + 38, les unités font 15. On écrit 5. Combien retient-on ? » : `1` |
| `calc-trou` | phrase à trous | `66 − ___ = 59` : `7` ; `27 + ___ = 45` |
| `calc-ordre` | ordre | `J'additionne les unités. > J'écris les unités et je retiens une dizaine. > J'additionne les dizaines avec la retenue.` |
| `calc-relier` | association | `70 − 64~6 ; 47 − 19~28 ; 38 + 26~64` |
| `calc-glisser` | glisser-déposer | cases Avec retenue et Sans retenue : `32 + 18` et `12 + 16` |
| `monnaie-somme` | QCM | « Cheikh a 1 pièce de 50 F et 1 pièce de 10 F. Combien a-t-il en tout ? » : `60` |
| `monnaie-rendre` | QCM | « Lamine achète une orange à 10 F. Il paie avec une pièce de 50 F. Combien lui rend-on ? » : `40` |
| `monnaie-achat` | réponse courte | « Cheikh a 40 F. Il achète un ballon à 30 F. Combien lui reste-t-il ? Écris le nombre. » : `10` |
| `mult-paquets` | QCM | « Modou a 3 paquets de 4 pains. Combien de pains a-t-il en tout ? » : `12` |
| `mult-ecrire` | réponse courte | la même histoire, suivie de « Écris le nombre. » : `12` |
| `mult-addition` | QCM | « Quelle multiplication donne le même résultat que 2 + 2 + 2 + 2 ? » : `4 × 2` |
| `mult-table` | QCM | « Combien font 3 × 5 ? » : `15` (ou « Quel est le double de 8 ? ») |
| `mult-trou` | phrase à trous | `3 × ___ = 15` : `5` |
| `mult-relier` | association | `3 × 3~9 ; 4 × 2~8 ; 5 × 2~10` |
| `mult-suite` | ordre | « …les résultats de la table de 2. » : `2 > 12 > 16 > 18` |
| `mult-glisser` | glisser-déposer | cases Table de 2 et Table de 3 : `16` et `15` (jamais un multiple de six) |
| `part-qcm` | QCM | « Fatou partage 15 mangues entre 3 enfants. Combien de mangues chaque enfant reçoit-il ? » : `5` |
| `part-trou` | phrase à trous | `Je partage 6 billes entre 3 enfants. Chaque enfant reçoit ___ billes.` : `2` |
| `mesure-unite` | QCM | « Quelle unité sert à mesurer la quantité d'eau dans un seau ? » : `Litre` |
| `mesure-glisser` | glisser-déposer | cases « Se mesure en mètres » et « Se mesure en litres » : `la longueur d'une corde`, `la quantité de lait dans une bouteille` |
| `mesure-relier` | association | `la longueur de la cour~Mètre ; la quantité d'eau dans un seau~Litre ; le poids d'un sac de riz~Kilogramme` |
| `mesure-corps` | QCM | « Avec quelle partie du corps mesure-t-on en empans ? » : `Main` (ou « Quelle mesure est la même pour tous les enfants ? » : `Mètre`) |
| `mesure-calcul` | QCM | « Un sac de riz pèse 16 kilogrammes. Lamine en vend 3 kilogrammes. Combien de kilogrammes reste-t-il dans le sac ? » : `13` |
| `mesure-repete` | réponse courte | « Chaque corde mesure 10 mètres. Combien de mètres y a-t-il dans 2 cordes ? Écris le nombre. » : `20` |
| `mesure-ordre` | ordre | « Range ces poids du plus lourd au plus léger. » : `Kilogramme > Demi-kilogramme > Quart de kilogramme` |
| `mesure-plus` | QCM | « Quelle corde est la plus courte ? » : `26 mètres` (parmi trois longueurs) |
| `mesure-kilo` | QCM | « Deux quarts de kilogramme pèsent autant que quoi ? » : `Demi-kilogramme` |
| `mesure-kilo-trou` | phrase à trous | `Un quart de kilogramme est ___ qu'un demi-kilogramme.` : `plus léger` |
| `heure-lire` | QCM | « Quelle heure est-il ? 🕓 » : `4 heures` |
| `heure-relier` | association | `🕝~2 heures et demie ; 🕒~3 heures ; 🕔~5 heures` |
| `heure-ordre` | ordre | « Range ces heures du matin, du plus tôt au plus tard. » : `🕕 > 🕢 > 🕚` |
| `heure-trou` | phrase à trous | `Il est 12 heures. Une heure plus tard, il sera ___.` : `1 heure` |
| `calendrier-combien` | QCM | « Combien de jours y a-t-il dans deux semaines ? » : `14` |
| `calendrier-glisser` | glisser-déposer | cases Jours et Mois : `dimanche` et `décembre` |
| `monnaie-payer` | QCM | « Rama doit payer 30 F. Quelles pièces donne-t-elle ? » : `25 F + 5 F` |
| `monnaie-pieces` | QCM | « Combien de pièces de 25 F faut-il pour payer 50 F ? » : `2` |
| `monnaie-relier` | association | `3 pièces de 10 F~30 F ; 4 pièces de 5 F~20 F ; 4 pièces de 10 F~40 F` |
| `pb-operation` | QCM | « Abdou a 14 ballons. Il en reçoit 12. Combien de ballons a-t-il maintenant ? Quelle opération faut-il faire ? » : `14 + 12` |
| `pb-resoudre` | QCM | « Samba a 54 cahiers. Il en perd 6. Combien de cahiers lui reste-t-il ? » : `48` |
| `pb-ecrire` | réponse courte | « Ndèye a 30 bonbons. Elle en mange 21. Combien de bonbons lui reste-t-il ? Écris le nombre. » : `9` |
| `pb-trou` | phrase à trous | `Mamadou a 40 mangues. Il en mange 19. Il lui reste ___ mangues.` : `21` |
| `pb-manquante` | QCM | « Abdou a 40 bonbons. Il en perd quelques-uns. Combien de bonbons lui reste-t-il ? Que manque-t-il pour répondre ? » : `Le nombre enlevé` |
| `pb-inutile` | QCM | « Coumba a 11 cahiers. On lui en donne 39. Sa classe a 29 élèves. Combien de cahiers a-t-elle maintenant ? Quel nombre ne sert à rien ? » : `29` |
| `pb-question` | QCM | « Penda a 24 mangues. Elle en vend 9. Quelle question va avec cette histoire ? » : `Combien de mangues lui reste-t-il ?` |
| `pb-etapes` | ordre | `Je lis le problème. > Je cherche les nombres de l'histoire. > Je choisis l'opération. > Je fais le calcul.` |
| `pb-relier` | association | `2 paquets de 6 ballons~2 × 6 ; 60 bonbons, puis 26 de moins~60 − 26 ; 35 billes, puis 9 de plus~35 + 9` |
| `pb-glisser` | glisser-déposer | cases « On ajoute » et « On enlève » : `Ousmane reçoit 2 mangues` et `Sokhna donne 7 règles` |
| `outil-geometrie` | QCM | « Avec quoi mesure-t-on la longueur d'un trait ? » : `Double décimètre` |
| `figure-etapes` | ordre | « …les étapes pour découper une figure. » : `Je dessine la figure sur la feuille. > Je découpe en suivant le trait. > Je colle la figure sur le cahier.` |

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
- **L'anglais du CP** (`paliers/games/anglais.ts`) : trente-cinq gabarits pour `an-cp-family`, `an-cp-body`, `an-cp-classroom`,
  `an-cp-numbers-20` et `an-cp-food`. Sur l'échantillon de CP lu le 19 octobre 2026, le modèle écrivait « Which part is used to walk? »
  avec le pied pour réponse mais « arm » et « hand » parmi les choix, des cases vides en « Fruits, Viandes, Boissons », des consignes
  en anglais qu'un enfant de six ans ne lit pas. Ici le vocabulaire est la liste fermée de chaque fiche.
  - **Un mot, son sens, éventuellement son dessin.** Chaque mot a son sens en français et, quand un émoji sûr le montre, son dessin.
    Les mots sans dessin sûr (l'œil, le crayon, le stylo, le doigt, la chaise, la fenêtre, le jus) passent par leur sens en français :
    un émoji dont l'écriture demande U+FE0F, ou né après Unicode 11, se montre en case vide sur un téléphone ancien.
  - **La consigne est en français.** L'anglais n'est que dans les choix, les cases, les tuiles, la phrase à trous et la phrase à
    remettre dans l'ordre. Le test relit chaque consigne pour y chercher un mot anglais. Aucune écoute : l'application ne lit pas l'anglais.
  - **La phrase de la fiche, et pas une de plus.** « This is my mother. », « Touch your nose. », « It is a book. », « I like rice. »,
    « How old are you? I am seven. » Pas de forme négative, pas de question à construire, pas de pluriel. « I like egg. » est exclu
    parce que « egg » se compte ; « Point to your head. » n'est pas un ordre à remettre en place, parce que l'indice « finit par un point »
    écrirait un mot de la réponse (il reste en QCM et en phrase à trous).
  - **Une phrase à remettre dans l'ordre n'a qu'un rangement**, parce que le premier mot a sa majuscule et le dernier son point.
  - **Les nombres de 11 à 20** restent sur 11 à 15, puis 11 à 18, puis 11 à 20 ; au dernier palier, un nombre de 1 à 10 est revu dans
    les ordres, les paires et les mauvais choix. Les mauvais choix sont des nombres voisins. Les dessins à compter se rangent sur deux
    rangées de dix au plus.
  - **Une étiquette est un mot seul, sans article** (`nez`, `chaise`). Les tests jouent aussi ces gabarits au CI.
- **La lecture du CP** (`paliers/games/lecture.ts`) : neuf gabarits pour `fr-cp-lecture`. Sur l'échantillon de CP, le modèle écrivait
  « Quel mot a le son 'ou' ? » avec « bateau » pour réponse, « Écris le mot 'mouton' » (le mot est dans l'énoncé), « Associe chaque
  aliment à sa couleur » avec deux fois « rouge ». Ici chaque mot vient d'un tableau fermé (le mot, ses syllabes, son dessin).
  - **Les mots** sont les mots du quotidien de la fiche (mouton, bateau, tomate, savon, poulet, marmite, malade) et d'autres mots de
    deux ou trois syllabes. « poule » et « poulet » ne sont jamais ensemble : leurs dessins se ressemblent.
  - **Les syllabes** : « Remets les syllabes dans l'ordre » demande trois syllabes au moins (avec deux tuiles, l'enfant a une chance
    sur deux, et le contrôleur le signale) ; « Assemble les syllabes » fait écrire le mot avec les syllabes mélangées dans la phrase.
    Un mot dont une syllabe se répète (bonbon, bébé) n'entre dans aucun des deux.
  - **Les sons proches** (ou et u, on et o, é et è) se jugent sur l'orthographe : `sounds.ts` pour é, è, ou et u, deux fonctions du
    gabarit pour on et o. Un mot que l'oreille entend sans que l'orthographe l'écrive n'est jamais offert : « poulet » et « pain » se
    terminent par le son è sans l'écrire, « bateau » fait entendre le son o sans la lettre o.
  - **Les lettres qu'on confond** (b, d, p) : le bon mot commence par la lettre, un mauvais choix par chacune des deux autres.
  - **Lire deux phrases** : chaque action n'est faite que par une personne du texte, donc « Qui boit du lait ? » et « Que fait Awa ? »
    n'ont qu'une réponse.
- **L'écriture du CP** (`paliers/games/ecriture.ts`) : huit gabarits pour `fr-cp-ecrire`. Sur l'échantillon de CP, le modèle écrivait
  « Associe les mots à leur catégorie » avec « Kaolack » parmi des fruits, « Écris une phrase avec Mariama et le lait caillé »
  (plusieurs phrases justes, une seule acceptée), des phrases à remettre dans l'ordre sans rien qui dise laquelle vient d'abord.
  - **La phrase simple** (un sujet, un verbe, un article, un nom) vient d'un tableau : chaque verbe n'accepte que ses objets
    (on mange une mangue, on porte une robe), et l'article suit le genre de `genders.ts`. Le test cherche tous les rangements des
    tuiles et exige qu'un seul soit une phrase.
  - **Un, une, des, le, la, les** : l'article se déduit du genre et du nombre du nom. Les articles définis ne se posent jamais devant
    un nom qui commence par une voyelle (« l'orange » ne se complète pas). Les noms de la liste font tous leur pluriel avec un « s ».
  - **Le pluriel avec le dessin** : `ecrire-groupe` montre un à cinq dessins, et le nom de la phrase suit ce nombre.
  - **Une petite histoire en trois phrases** (`ecrire-texte`) : on arrive, on fait ce qu'on est venu faire, on rentre. La phrase qui
    commence par « Il » ou « Elle » reprend un prénom déjà dit ; elle ne peut pas ouvrir l'histoire. Deux phrases seulement donneraient
    une chance sur deux, et le contrôleur le signale.
  - **Le bon mot dans une phrase** (`ecrire-mot`) : quatre cadres (on mange, on met, un animal crie, on s'assoit). Un seul des trois mots
    va avec la phrase, et les trois ont le même genre : l'article ne donne pas la réponse.
  - **Les tuiles ne sont jamais « article + un nom »** : au CI, elles demanderaient une image que le catalogue n'a pas, surtout au
    pluriel. Les trous (`fill-blank`) n'ont pas cette règle, les QCM, les ordres, les paires et les glissés l'ont.
  - `convex/__tests__/cpEnglishReadingWritingTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec ses propres tables (les
    mots de la fiche et leur dessin, les syllabes, les sons que chaque mot fait entendre, le genre de chaque nom), abîme volontairement
    la bonne réponse de chaque gabarit pour vérifier que le test le voit, et fabrique 40 paliers de chacune des sept thématiques contre
    le contrôleur.
- **Les consignes du CP** (`paliers/games/consignes.ts`) : six gabarits pour `fr-cp-consignes`. Sur l'échantillon de CP, le modèle écrivait
  « Entoure le dessin qui... » sans rien à entourer, des trous où deux verbes de consigne allaient, des étapes à ranger sans qu'aucune ne
  vienne avant l'autre. Ici six verbes de consigne (Entoure, Colorie, Découpe, Relie, Souligne, Recopie) ont chacun un sens écrit en
  une expression, une phrase à la première personne et un cadre de phrase où ce verbe seul va. Aucun sens ne ressemble à un autre : le test
  vérifie que les six sens sont distincts. Les étapes à ranger viennent de quatre petites routines (se laver les mains, planter une
  graine, faire un dessin, boire un verre d'eau) dont chaque étape vient avant la suivante : trois étapes au premier palier, quatre ensuite.
  « Mange » et « Dors » sont les intrus : ils ne sont jamais une consigne de classe.
- **Décrire et comparer au CP** (`paliers/games/decrire.ts`) : cinq gabarits pour `fr-cp-decrire`, qui complètent `couleur-objet`,
  `comparer-mesure` et `forme-nom`. Les contraires viennent d'un tableau de cinq paires (grand et petit, chaud et froid, lourd et léger,
  plein et vide, long et court). Les mots de taille (grand, petit, long, court) ne sont jamais deux dans les choix d'une même question :
  « long » et « court » diraient tous les deux « pas grand ». Pour comparer deux bêtes, une seule échelle (de la fourmi à l'éléphant) juge à la
  fois « plus grand » et « plus lourd », les deux bêtes sont toujours éloignées d'au moins deux rangs, l'adjectif s'accorde avec la première
  bête, et le troisième choix est choisi pour que UNE SEULE option soit vraie. Les phrases de `adjectif-ordre` n'ont qu'un rangement :
  « grand », « petit », « joli » et « gros » se placent avant le nom, les couleurs après.
- **Raconter au CP** (`paliers/games/recit.ts`) : sept gabarits pour `fr-cp-raconter`. Sur l'échantillon de CP, le modèle écrivait
  « Qui va au marché ? » sans aucune histoire à l'écran, « Associe les personnages à leurs actions » (des paires arbitraires). Ici le TEXTE est
  dans l'énoncé : la réponse s'y lit. Trois histoires de la vie de l'enfant (le marché, la récréation, la pêche avec le grand-père) ont
  chacune trois étapes : on part, on fait, on rentre. « D'abord », « Ensuite » et « Enfin » sont écrits dans les phrases à remettre dans
  l'ordre, donc l'enfant lit la clé. Pour « Où ? », l'endroit est écrit dans le texte (sinon l'enfant devinerait). « Il » et « Elle » suivent le prénom. Dans un palier, les trois ordres de phrases racontent trois histoires différentes
  et les deux trous deux histoires différentes : le même texte avec un autre prénom ne revient pas.
- **Inviter et conseiller au CP** (`paliers/games/invitation.ts`) : six gabarits pour `fr-cp-inviter`. Le modèle acceptait « Viens » ET « Venez »
  pour inviter un seul ami, et écrivait des associations où rien ne disait qui invite qui. Les invitations (six) et les conseils (six) viennent
  d'un tableau fermé : aucune phrase n'est les deux. Une réponse polie remercie, une réponse impolie commande, se moque ou refuse sèchement ;
  les mauvaises réponses sont aussi longues que la bonne (une réponse qui se devine à sa longueur n'apprend rien). Un palier répond
  une fois « oui » et une fois « non », pas deux fois la même.
- **Les arts du CP** (`paliers/games/arts.ts`) : onze gabarits pour `ar-cp-melanges`, `ar-cp-traits`, `ar-cp-decorer` et `ar-cp-rythmes`, qui
  mêlent ces gabarits aux jeux de couleurs, de dessin, de frises et d'écoute déjà existants. Sur l'échantillon de CP, le modèle écrivait des
  lignes dessinées avec des signes (« ~~~ » pour un zigzag), « Trait délié ~~~~ » (un trait délié est un trait fin, pas une vague) et des
  motifs attachés à un objet sans que la fiche le dise. Ici on ne dessine jamais une ligne : on la DÉCRIT par ce qu'on voit, ou on la reconnaît
  dans une chose de tous les jours. Les « lignes brisées » de la fiche ne sont pas posées : un zigzag en est déjà une. Les voix vont de la plus
  douce à la plus forte (chuchoter, parler doucement, parler fort, crier). Les jeux d'écoute (`listen.ts`) ne refont pas un tirage déjà servi dans le
  palier (voir `programme-et-jeux.md`) ; une thématique faite tout entière par le code les sert une fois chacun.
  - `convex/__tests__/cpFrancaisArtsTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec ses propres tables (le sens de chaque
    verbe de consigne, les contraires, l'ordre des bêtes de la fourmi à l'éléphant, les histoires, les invitations et les conseils, les lignes,
    les traits, les voix), abîme volontairement la bonne réponse de chaque gabarit pour vérifier que le test le voit, et fabrique 40 paliers de
    chacune des huit thématiques contre le contrôleur.
- **L'instruction civique du CP** (`paliers/games/gestes.ts`) : onze gabarits pour `ci-cp-route`, `ci-cp-reglement`, `ci-cp-responsabilites`,
  `ci-cp-genre` et `ci-cp-paix`. Sur l'échantillon de CP, le modèle écrivait 8 exercices faux sur 27 : « Les garçons jouent et les filles
  aident » donné pour bonne réponse, « Faire la vaisselle » rangé chez les filles, des paires que rien ne relie (« droit d'aller à l'école » et
  « droit de jouer »), « Mets dans l'ordre : 1. Regarde. 2. Traverse. 3. Attends. » avec des numéros qui contredisent l'ordre, un feu rouge pour
  dire le passage piéton. Ici tout vient d'une SCÈNE : une situation de la vie d'un enfant, UN geste qui convient et trois gestes qui ne
  conviennent pas. Le QCM, la case « À faire » et « À éviter », l'intrus et l'association la lisent chacun à sa manière.
  - **Un geste se comprend seul.** Il est bon ou mauvais hors de sa scène : « Je m'arrête au panneau STOP » est bon partout, « Seules les filles
    balaient la cour » est mauvais partout. Pas de « Je la mets à la poubelle » sans dire quoi, pas de « Je m'enfuis » (qui peut être juste).
    Tous les gestes de la table sont différents, et deux scènes qui se ressemblent ont le même `group` : jamais reliées ensemble.
  - **Le genre.** Aucun geste n'est rangé « chez les filles » ou « chez les garçons », et aucun bon geste ne contient « seul » ou « seules ».
    Les scènes montrent qu'une fille joue au foot, qu'un garçon saute à la corde ou pleure, que le frère et la sœur balaient et mettent la table.
  - **Les droits et les devoirs** se disent avec « je peux » et « je dois » : « Apprendre » est à la fois un droit et un devoir, donc il n'y est pas.
  - **Les responsables** (chef de classe, propreté, matériel, lever des couleurs) ont chacun une seule tâche, la plus simple : la fiche ne dit pas
    ce qu'ils font, ce fichier ne leur en invente pas d'autre.
  - **La route** pose trois panneaux (STOP, sens interdit, passage pour piétons), la ceinture, le casque à moto, monter et descendre du car, et un
    mot à écrire (casque, ceinture, stop) dont la bonne réponse n'est jamais dans l'énoncé.
  - **Un bon geste ne se devine pas à sa longueur** : les mauvais choix d'un QCM sont ceux dont la longueur est la plus proche du bon geste.
  - `convex/__tests__/cpCiviqueTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec ses propres tables (chaque scène, ses gestes, les
    suites, les trous, les droits et les devoirs, les responsables, les panneaux), abîme volontairement la bonne réponse de chaque gabarit pour
    vérifier que le test le voit, et fabrique 40 paliers de chacune des cinq thématiques contre le contrôleur.
- **Les sciences du CP** (`paliers/games/sciences.ts`) : vingt-cinq gabarits pour `sc-cp-matiere`, `sc-cp-grandir`, `sc-cp-manger`,
  `sc-cp-maladies` et `sc-cp-nature`. Sur l'échantillon de CP, le modèle écrivait 3 exercices faux sur 25 : « Mafé » rangé dans « Liquide », des
  paires qui se suivent (Bébé~Enfant, Enfant~Adulte), « Plat » relié deux fois, un ordre « faire du yassa » sous une thématique sur les états de
  la matière. Ici tout vient de tableaux fermés, écrits à la main, que le test recalcule à part.
  - **La matière** (sept gabarits) : quinze choses dont l'état ne se discute pas (le bois, la pierre, la glace, l'eau, le lait, l'air, la vapeur d'eau),
    ce que le chaud et le froid font à l'eau, un mot à écrire. Ni fumée, ni nuage, ni pâte, ni miel : leur état se discute.
  - **Grandir** (six gabarits) : l'œuf, le poussin, la poule ; la graine, la jeune plante, la plante ; le bébé, l'enfant, l'adulte, le vieillard ;
    la grenouille ; le petit de sept animaux de la ferme. Les mauvais choix de « juste avant » et « juste après » viennent toujours d'une autre vie.
  - **Les habitudes** (six gabarits communs à `sc-cp-manger`, `sc-cp-maladies` et `sc-cp-nature`) lisent des scènes, comme le civique du CP : une
    situation, UN geste qui convient, trois gestes qui ne conviennent pas, tous compris hors de leur scène. La clé `vocabulary` du jeu (`manger`,
    `maladies`, `nature`) choisit les scènes. Six autres gabarits portent ce que chaque thématique a de propre : les aliments utiles et nuisibles,
    fruit ou légume, se protéger du paludisme ou de la diarrhée, les causes et les protections, ce qui répare un problème de la nature.
  - **Les tuiles sont des noms sans article** (« Pierre », « Poussin », « Vendeur »). `templatePictures.test.ts` applique la règle des images du CI à
    tous les gabarits enregistrés : une tuile « article + nom » absente du catalogue y serait signalée. L'énoncé, lui, garde ses articles.
  - **La démo du site** attend une réponse courte sur « Solide, liquide ou gaz ? » et sur « Jouer un rôle » : `etat-ecrire` et `metier-ecrire`.
  - `convex/__tests__/cpSciencesRolesTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec ses propres tables (l'état de chaque chose, les
    étapes de chaque vie, chaque scène et ses gestes, les aliments, les métiers avec leurs gestes et leur objet, les cris), abîme volontairement la
    bonne réponse de chaque gabarit pour vérifier que le test le voit, et fabrique 40 paliers de chacune des six thématiques contre le contrôleur.
- **Jouer un rôle au CP** (`paliers/games/metiers.ts`) : neuf gabarits pour `ar-cp-roles`. Le modèle écrivait « Le pêcheur a besoin d'un chapeau »,
  « Qui est le vendeur au marché ? » avec « le marchand » pour bonne réponse, un ordre « Choisir un costume, Imiter le rôle, Jouer avec des amis »
  sans rien de vrai ni de faux. Ici huit métiers ont chacun UN objet et DEUX gestes qui ne sont à aucun autre métier de la table, et huit animaux
  ont leur cri. Le métier à écrire est désigné par ses gestes, jamais nommé ; les réponses admises sont les noms du même métier (marchand,
  couturier, conducteur, paysan, instituteur).
- **Les mathématiques du CP, première partie** (`paliers/games/nombresCp.ts`, `calculCp.ts`, `tablesCp.ts`) : vingt-neuf gabarits pour
  `ma-cp-nombres-50`, `ma-cp-nombres-100`, `ma-cp-retenue` et `ma-cp-multiplier`. Sur l'échantillon lu le 19 octobre, les huit thématiques de
  mathématiques du CP avaient 6 exercices faux et 8 douteux sur 42 lus : « huitante » pour 80, un nombre de mangues sans mangues, des trous où
  toute valeur convient, une tuile qui contient la réponse, une table de 9 hors programme, un produit hors sujet sous « Les nombres jusqu'à 50 ».
  Ici la réponse est CALCULÉE, jamais écrite.
  - **Le plafond de la fiche** voyage par `vocabulary` (`nombres-50`, `nombres-100`) : aucun nombre n'est écrit au-delà, ni dans l'énoncé ni dans
    un choix. Le jeu `suite-nombres` y est soumis lui aussi. Avant, un palier « jusqu'à 50 » pouvait recevoir une suite qui montait à 100, et la
    vitrine du site montrait la même suite.
  - **Les nombres en lettres** viennent d'UNE fonction, `inWords` : « vingt et un », « soixante et onze », « quatre-vingts », « quatre-vingt-un »,
    « quatre-vingt-onze », « cent ». Le test les recalcule avec sa propre table et une liste codée en dur de vingt-huit nombres difficiles ;
    « huitante », « septante » et « nonante » sont refusés.
  - **Une addition de ces gabarits a toujours une retenue, une soustraction toujours un emprunt**, et le résultat ne passe jamais cent. Les mauvais
    choix sont les erreurs d'un enfant : oublier la retenue, la compter deux fois, enlever le petit chiffre du grand sans emprunter (62 − 38 donne
    alors 36). Dans la case « Sans retenue », aucun total ne fait cent, car les dizaines retiendraient une centaine.
  - **L'argent** : des pièces de 5, 10, 25, 50 et 100 F, des prix multiples de cinq, jamais plus de cent francs ; une monnaie rendue n'est jamais nulle.
  - **Multiplier** : toute multiplication a un facteur égal à 2 ou à 3 (l'autre va de 2 à 10), le résultat ne passe jamais 30, le partage se fait entre
    2 ou 3 enfants sans reste, et aucun signe de division n'est écrit. Cela vaut aussi pour les mauvais choix : le test a trouvé « 5 × 4 » parmi
    eux, le gabarit a été corrigé. Sous « Table de 2 » et « Table de 3 », aucun résultat n'est un multiple de six, qui est dans les deux tables.
  - **Aucun indice n'écrit un chiffre** : un résultat se lirait dedans.
  - `convex/__tests__/cpMathsNumbersTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec sa propre arithmétique, abîme volontairement la
    bonne réponse de chaque gabarit pour vérifier que le test le voit, vérifie les règles de la fiche (retenue, emprunt, plafonds, tables) et fabrique
    40 paliers de chacune des quatre thématiques contre le contrôleur.
- **Les mathématiques du CP, seconde partie** (`paliers/games/mesuresCp.ts`, `heureCp.ts`, `problemesCp.ts`, `figuresCp.ts`) : trente et un gabarits
  pour `ma-cp-mesures`, `ma-cp-heure-monnaie`, `ma-cp-problemes` et `ma-cp-figures`. Avec elle, les quarante-deux thématiques du CP sont faites par
  le code. La thématique de l'heure n'avait ni horloge ni pièces ; ses « Il y a ___ jours dans une semaine » renvoyaient à un calendrier que l'écran
  ne montrait pas. Ici la réponse est CALCULÉE et les mauvais choix sont des erreurs d'enfant.
  - **L'horloge est un émoji de Unicode** : une horloge pour chaque heure juste (🕐 à 🕛, U+1F550 à U+1F55B) et pour chaque demi-heure (🕜 à 🕧,
    U+1F55C à U+1F567), toutes en affichage émoji par défaut. Aucun composant d'horloge n'a été écrit, mais la TAILLE compte : relu sur l'iPhone 17 le
    21 octobre 2026, un cadran de la taille d'un mot (36 px) n'a plus d'aiguilles lisibles. `segmentPrompt` (`choix-texte.ts`) donne donc un segment
    « horloge » à un cadran seul, que `ExercisePrompt` pose en grand (80 px) sur son socle, centré sous la phrase ; une tuile qui ne porte qu'un cadran
    (`TileGlyphs`) le dessine à 48 px au lieu de 28. Quatre tuiles de cette taille ne tiennent pas sur le premier écran d'un petit téléphone : on relie
    trois horloges, jamais quatre. La voix de Pio ne lit que l'énoncé, sans l'émoji. L'heure s'écrit « 3 heures » ou « 3 heures et demie », jamais « midi » ni « 15 h » :
    une horloge de douze heures ne dit pas le matin ou le soir, donc un rangement d'horloges se fait sur les heures du MATIN et l'énoncé le dit.
    Pas de quart d'heure, pas de minute. Le test écrit les vingt-quatre horloges une à une et les compare à `clockOf`.
  - **Les mesures** : trois sortes de mesure, chacune avec UNE unité (le mètre, le litre, le kilogramme). Une chose se dit par ce qu'on veut en
    savoir (« la longueur de… », « la quantité d'eau dans… », « le poids de… ») : l'eau d'un seau se pèse aussi, mais l'énoncé dit qu'on en mesure
    la quantité. Le demi-kilogramme et le quart de kilogramme (deux demis ou quatre quarts font un kilogramme) ; ni gramme, ni centimètre, ni
    demi-litre. Le pas, le pied, l'empan et la coudée changent d'une personne à l'autre, seul le mètre est le même pour tous ; « Pied » n'est jamais
    proposé pour mesurer en pas.
  - **La monnaie** : des pièces de 5, 10, 25, 50 et 100 F, des sommes multiples de cinq, jamais plus de cent francs, une seule paire de pièces qui
    fait la somme à payer. La monnaie rendue est celle de `ma-cp-retenue` (`monnaie-rendre`).
  - **Les problèmes** : l'histoire est tirée du lexique fermé de `stories.ts` (un prénom, une chose avec son genre, son pluriel et ses verbes), avec UNE
    opération, choisie par le code puis écrite : ajouter (« reçoit », « trouve », « ramasse »), enlever (« mange », « donne », « perd », « vend ») et,
    dès le deuxième palier, des paquets pareils (un facteur de 2 ou de 3, le résultat sous trente). Dès le deuxième palier aussi, une addition a une
    retenue et une soustraction un emprunt. Les deux nombres d'une histoire sont différents (« 3 paquets de 3 » ferait deux choix identiques). Une
    donnée « inutile » est un nombre sans lien avec la question (l'âge de l'enfant, les élèves de sa classe) ; la donnée « manquante » est celle que
    l'énoncé ne donne pas ; les mauvais choix sont des détails sans aucun lien avec le calcul.
  - **Les figures** : la thématique avait déjà le dessin à reproduire et la frise de formes. Les lignes droites et courbes viennent des gabarits des arts
    (`ligne-glisser`, `ligne-relier`, `ligne-qcm`), les coins d'une forme de la géométrie du CI (`forme-coins`). Les deux gabarits neufs sont le matériel
    du géomètre et les étapes pour reproduire, tracer ou découper une figure. La règle et le double décimètre ne se proposent jamais ensemble : le
    double décimètre EST une règle graduée.
  - **Les gabarits à peu de variantes les répartissent par palier** (`variantsForLevel`, `paliers/games/tableaux.ts`) : le premier tiers de leurs variantes
    au premier palier, le deuxième au deuxième, le dernier ensuite (le CP a trois paliers, joués aux niveaux 1, 2 et 4). Sans cela, un enfant revoyait
    « Deux ___ font un kilogramme » aux trois paliers de la thématique, et la même question de ligne ou d'outil à deux paliers sur trois : en production,
    6 questions sur 120 se répétaient. Cela vaut pour `mesure-corps`, `mesure-kilo` (une sorte de question par palier), `mesure-kilo-trou`,
    `calendrier-combien`, `outil-geometrie`, `figure-etapes`, `pb-etapes` et, dans `arts.ts`, `ligne-qcm` et `ligne-relier`, que « Les traits et les lignes »
    emploie aussi. Le test fabrique les trois paliers sur 80 graines et exige trois questions différentes. Les gabarits à tirage libre (nombres, prénoms,
    sommes) ne sont pas concernés.
  - **Les dessins sur quadrillage se répartissent aussi par palier** (`pickMotif`, `paliers/games/pixel.ts`, pour `pixel-copie`, `pixel-memoire`,
    `coloriage-magique` et, quand il prend un motif du catalogue, `pixel-symetrie`). Le n-ième motif du catalogue appartient au groupe n modulo 3, le
    même partage que `variantsForLevel` (`levelGroup`, `tableaux.ts`) ; un palier prend d'abord les motifs de son groupe qui n'ont pas encore servi,
    puis les autres. En production, trois paliers de quatre `pixel-copie` tirés dans onze motifs reprenaient trois dessins (« l'escalier », « la petite
    fleur », « la croix »). Mesuré sur 200 graines, toutes les thématiques de CI et de CP (qui tirent jusqu'à quatre dessins par palier) ne répètent plus
    un dessin d'un palier à l'autre, alors qu'elles le faisaient dans 128 à 199 graines sur 200. Chaque palier a quatre motifs à lui à CI et à CP, cinq à
    partir du CE1 : au-delà (« Le dessin de mémoire » du CM1 en tire sept), il en prend d'autres et un dessin peut revenir. Le catalogue des motifs
    symétriques est trop petit (trois par groupe) pour garantir quoi que ce soit à `pixel-symetrie`. Prix de la règle : le premier palier de chaque
    thématique de CI et de CP tire toujours dans les mêmes quatre motifs (la croix, le petit cœur, la petite maison, le bateau) ; le djembé et la lune
    ne se montrent plus au dernier palier qu'au-delà de quatre dessins.
  - **Trois autres gabarits répartis par palier**, relevés en lisant les 90 exercices régénérés après la PR #115 (`cpRepetitionsParPalier.test.ts`) :
    `technique-qcm` (neuf questions, trois par palier : « modeler un pot, un bol, un animal », « peindre un mur, une porte, un tableau », « dessiner une
    maison, un arbre, un bonhomme », deux tirées par palier), `technique-relier` (cinq gestes au lieu de trois, `découper ~ ciseaux` et `coller ~ colle`
    s'ajoutant aux trois de la fiche ; chaque palier relie trois gestes, un jeu différent par palier : avec les trois seuls gestes, les trois paliers reliaient
    les mêmes trois paires) et `forme-coins` (le carré et le triangle au premier palier, le rectangle au deuxième, le rond au dernier ; un palier qui en
    pose plus qu'il n'en a prend d'autres formes). `frise-objets` n'en fait pas partie : deux frises qui se ressemblent par la structure (ABAB) mais pas par
    les images ne sont pas la même question. Mesuré sur 200 graines, `ar-cp-decorer` et `ma-cp-figures` ne reprennent plus aucune question d'un palier à
    l'autre ; `ma-ci-formes`, qui pose six fois `forme-coins` pour quatre formes, en reprend encore (405 questions avant, 358 après). Prix de la règle : à
    chaque palier, le choix des formes est presque fixé (un seul rectangle au deuxième palier).
  - **`forme-nom` et `solide-nom` répartis par palier** (`SHAPE_DRAWINGS` et `SOLID_OBJECTS`, `geometry.ts`, `variantsForLevel`), relevés en lisant les 30
    exercices régénérés de « Les formes et les solides » (CI) : le même rond 🔵 au premier et au deuxième palier, la boule 🏀 aux paliers 2 et 3, le pavé
    🧱 aux paliers 1 et 3. Les dix dessins de forme et les neuf objets de solide sont rangés pour que chaque tiers mêle les formes, et un palier en
    prend un tiers (trois dessins aux niveaux 1 et 2, quatre au dernier ; trois objets par palier). La forme d'un dessin se lit toujours dans `SHAPES`,
    le solide d'un objet dans `SOLIDS`. Mesuré sur 200 graines : `forme-nom` reprenait 205 questions et `solide-nom` 279 dans `ma-ci-formes`, `forme-nom` 52 dans
    `fr-cp-decrire` ; ils n'en reprennent plus aucune. `forme-coins` n'est pas concerné : quatre formes seulement pour six tirages, `ma-ci-formes` en reprend
    encore (358). La réponse peut se répéter d'un palier à l'autre (« le rond ») : c'est un autre dessin.
  - **« Décrire et comparer » (`fr-cp-decrire`) et `monnaie-payer` répartis par palier**, relevés en lisant les 90 exercices régénérés après la PR #117 :
    « Quel mot est le contraire de « lourd » ? » aux trois paliers, « Qu'est-ce qui est rouge ? » (la fraise) aux paliers 1 et 3, « doit payer 15 F » aux
    paliers 1 et 2. Deux aides dans `tableaux.ts` : `pickPreferred` tire d'abord parmi les variantes que le palier préfère et qui n'ont pas servi dans ce
    palier, puis parmi les autres, puis n'importe laquelle ; `pickForLevel` lui donne pour variantes préférées un tiers de la liste (`variantsForLevel`) ou une
    place sur trois (`spreadForLevel`, pour les longues listes sans ordre). `contraire-qcm` : dix mots, le premier de chaque paire puis le second, trois ou
    quatre par palier ; `contraire-trou` : une, deux puis deux phrases ; `couleur-objet` : la couleur demandée est le rouge, puis le jaune ou le vert, puis
    l'orange ou le violet ; `comparer-trou` : les 50 comparaisons (une échelle, deux bêtes, l'ordre), une sur trois par palier ; `comparer-mesure` : le mot
    « lourd », puis « léger », puis « grand » ou « petit » (au CI, qui en pose quatre par palier, les quatre mots changent à chaque fois) ; `monnaie-payer` :
    des sommes jusqu'à 35 F, puis de 50 à 60 F, puis 75 F et plus. Mesuré sur 200 graines : `fr-cp-decrire` reprenait 204 questions de `contraire-qcm`, 102 de
    `contraire-trou`, 77 de `couleur-objet`, 58 de `comparer-trou` et 57 de `comparer-mesure` ; plus aucune. `adjectif-ordre` (3 sur 200) et `contraire-relier`
    (2) n'ont pas été touchés. `ma-cp-heure-monnaie` reprend encore `heure-lire` (30), `heure-trou` (28), `monnaie-pieces` (32) et `monnaie-relier` (11).
  - **`heure-lire`, `heure-trou`, `monnaie-pieces` et `monnaie-relier` répartis par palier** (`heureCp.ts`, avec `pickPreferred` de `tableaux.ts`), relevés dans la
    thématique « L'heure, le calendrier, la monnaie » après la PR #119 : « 25 F pour payer 50 F » aux paliers 1 et 2, et la même heure ou le même départ d'un
    palier à l'autre. Les heures se partagent en trois (la 1re, la 4e, la 7e et la 10e au premier palier ; la 2e, la 5e, la 8e et la 11e au deuxième ; la 3e, la 6e, la 9e
    et la 12e au dernier : `ownHour`), si bien que deux paliers ne lisent ni ne complètent jamais la même heure ; le premier palier garde les heures justes.
    Les sommes se rangent en trois tranches (`moneyBand` : jusqu'à 35 F, de 36 à 60 F, au-delà, la même que `monnaie-payer`). `monnaie-pieces` prend une somme de la
    tranche du palier ; `monnaie-relier` prend trois groupes de sommes différentes, de préférence de la tranche (le premier palier n'a que de petites sommes, les suivants
    en ont deux de la leur : deux paliers ne relient jamais les mêmes trois groupes). Mesuré sur 200 graines, en comparant la phrase des textes à trou : `heure-lire`
    reprenait 30 questions, `monnaie-pieces` 32, `monnaie-relier` 11, `heure-trou` 15 ; plus aucune. `heure-relier` (1) n'a pas été touché. `heure-ordre` (2 reprises sur 200) et `monnaie-rendre` (2) ont reçu le même traitement ensuite : `heure-ordre` tire
    ses trois ou quatre horloges dans le groupe d'heures du palier (`ownHour` : 7 et 10, puis 8 et 11, puis 6 et 9, justes et et demie), si bien que deux paliers ne rangent jamais les
    mêmes horloges ; `monnaie-rendre` (`calculCp.ts`, aussi dans `ma-cp-retenue`) prend un prix de la tranche du palier (jusqu'à 30 F, de 35 à 60 F, 65 F et plus, `priceBand`), et le
    premier palier ne paie qu'avec une pièce de 50 F. Mesuré sur 200 graines : plus aucune reprise. `calc-ordre` de `ma-cp-retenue` se répète en revanche à chaque graine (il n'a que
    deux jeux d'étapes) : il n'est pas traité.
  - **Aucun nombre n'est écrit au-delà de cent**, ni dans l'énoncé ni dans un choix. Une étiquette qui se glisse ou se relie est un mot seul ou un
    groupe de mots, jamais « article + nom » (au CI, il demanderait une image du catalogue). Aucun indice n'écrit un chiffre.
  - `convex/__tests__/cpMathsMeasuresTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé avec ses propres tables (les unités par mot-clé, les
    vingt-quatre horloges, les faits du calendrier, les étapes), abîme volontairement la bonne réponse de chaque gabarit pour vérifier que le test le
    voit, et fabrique 40 paliers de chacune des quatre thématiques contre le contrôleur. Écrire ce test a fait trouver des défauts que le contrôleur
    ne voyait pas : deux nombres égaux dans une histoire (« 6 mangues et 6 de plus »), des mauvais choix qui sortaient de cent et ne laissaient que
    deux options, des indices qui citaient un mot de la réponse.
- **Les premières phrases et la politesse** (`paliers/games/phrases.ts`, `paliers/games/politesse.ts`) : dix
  gabarits pour le français du CI (`fr-ci-phrases`, `fr-ci-politesse`). Sur l'échantillon lu le 19 octobre 2026,
  16 exercices sur 30 étaient faux en « Mes premières phrases » (onze quiz sur les aliments sans scène, des trous où
  plusieurs mots vont, une case nommée comme la réponse, « Ousmane lis un livre »), et 7 sur 29 en politesse
  (« s'il te plaît » écrit deux fois dans la même phrase à trous, « S'il te plaît » rangé dans « Remerciements »).
  - **Les phrases** viennent d'une table fermée, relue à la main (`SHORT_SENTENCES`, `MEDIUM_SENTENCES`,
    `LONG_SENTENCES`) : des mots du vocabulaire du CI (`LEXICON`) et quelques mots-outils, sans apostrophe, sans mot
    répété, une seule majuscule. Surtout, UNE SEULE MANIÈRE de les ranger : le mot à majuscule ouvre, le mot qui porte
    le point ferme, un déterminant précède son nom. Une phrase où l'on peut échanger deux noms de même genre (« Le
    bébé dort dans un lit ») est interdite. Les phrases à trous de la thématique sont celles de `phrase-trou`
    (`SENTENCES`, vocabulaire `mots-4`).
  - **La politesse** repose sur une table fermée de situations, chacune avec LA formule qui lui va (bonjour, au revoir,
    merci, s'il te plaît, pardon, est-ce que je peux ?) et, quand une deuxième irait aussi, dans `also` : « Tu veux de
    l'eau » va à « s'il te plaît » et à « est-ce que je peux ? », qui ne sont jamais proposés ensemble. La situation ne dit
    jamais la formule. Chaque formule, situation et sentiment a son propre émoji ancien : le modèle mettait 🙏 sur « Merci »
    et sur « S'il te plaît ». Trois formules au premier palier, « s'il te plaît » au deuxième, les six ensuite.
  - `convex/__tests__/frenchCiTemplates.test.ts` RECALCULE chaque réponse avec ses propres tables : une petite
    grammaire (genres des noms, accord des déterminants) qui prouve qu'une phrase n'a qu'un seul ordre, la formule de
    chaque situation, ce que dit un enfant qui a soif. Il vérifie aussi les règles communes et fabrique 40 paliers de
    chacune des deux thématiques. `templatesWithoutModel.test.ts` joue leur génération contre un faux modèle.
- **L'anglais du CI** (`paliers/games/anglaisCi.ts`) : trente-quatre gabarits pour `an-ci-hello`, `an-ci-colours`, `an-ci-numbers`,
  `an-ci-animals` et `an-ci-fruits`, qui empruntent leurs outils à `anglais.ts` (l'anglais du CP). Sur les cent dix-huit exercices que le
  modèle avait écrits pour ces cinq thématiques, relus en prod le 20 octobre 2026, un sur trois était faux, ambigu ou hors niveau : six
  étoiles pour « seven », un cheval rangé dans « Autres animaux », « hello » et « hi » tous deux justes dans un même choix, des
  consignes en anglais qu'un enfant de six ans ne lit pas, « I see a ___ (lion, cow, monkey) » où les trois mots vont, un rose écrit avec
  un émoji d'Unicode 15. Ici chaque réponse se lit dans un tableau (un mot, son dessin, son sens en français).
  - **La consigne est en français, sans mot anglais**, comme au CP. L'anglais n'est que dans les choix, les cases, les tuiles, les phrases
    à trous et les phrases à remettre dans l'ordre. Une étiquette est un mot seul avec son dessin devant (`🐶 dog`), sans article.
  - **Les animaux et les fruits sont des mots isolés**, comme le dit leur fiche : aucun trou, aucun ordre. Les animaux se rangent en
    « de la ferme » (vache, chèvre, mouton, cheval, poule) et « sauvages » (singe, lion, éléphant) ; le chien, le chat, l'oiseau et le
    poisson n'entrent dans aucune case. Les fruits se rangent avec les animaux déjà vus.
  - **Les couleurs** passent par les ronds 🔴 🔵 ⚪, les cœurs 💛 💚 🧡 💜 🖤 💗 et le chocolat 🍫 : les pastilles 🟠 🟡 🟢 🟣 🟤 et les
    cœurs blanc et marron sont d'Unicode 12, un téléphone ancien les montre en case vide. Une couleur n'est jamais proposée à côté d'une
    couleur voisine (orange et rouge, rose et violet) : une banane peut être brune, une tomate verte. Le premier palier n'a que six
    couleurs (red, blue, yellow, green, black, white), le dernier les dix de la fiche.
  - **Les nombres de 0 à 10** restent de 1 à 5 au premier niveau, de 0 à 8 au deuxième, de 0 à 10 ensuite ; jamais au-delà de dix. Les
    dessins à compter se rangent sur deux rangées de cinq au plus. La suite à compléter montre deux nombres au premier niveau (avec
    trois, il ne resterait qu'un mauvais choix parmi cinq nombres), trois ensuite, et descend à partir du troisième niveau.
  - **Les jumeaux** : « hello » et « hi » disent la même chose, « goodbye » et « bye » aussi. Jamais l'un en bonne réponse et l'autre en
    mauvais choix ; « hi » et « bye » ne servent que rangés (« pour dire bonjour », « pour dire au revoir »), où ils ont une seule bonne
    case. « yes » et « no » ne sont jamais proposés avec « please » ou « thank you », qui sont polis (« no, thank you »).
  - **`convex/__tests__/ciEnglishTemplates.test.ts`** a un VÉRIFICATEUR par gabarit, écrit avec ses propres tables (un mot, son dessin, son
    sens en français, les couleurs qu'on confond, ce qu'on dit dans chaque situation). Il abîme ensuite chaque gabarit (la bonne réponse
    déplacée, une paire croisée, une case changée, un jumeau ou une couleur voisine parmi les choix) et exige que son vérificateur le
    voie. Il a trouvé un défaut : au premier niveau, « one, two, three, ___ » n'avait que deux choix.
- **L'instruction civique du CI** (`paliers/games/civique.ts`) : six gabarits pour `ci-ci-politesse`, `ci-ci-ecole`, `ci-ci-entraide` et
  `ci-ci-route`. Le modèle avait écrit cent cinq exercices pour ces quatre thématiques (relus en prod le 20 octobre 2026) et près de
  quarante étaient à refaire : des ordres sans ordre (« Bonjour, Merci, Pardon »), une traversée qui regarde le feu après la route, le
  même exercice rangé dans deux ordres contraires d'un palier à l'autre (« Se réveiller, S'habiller, Petit déjeuner » puis « Se
  réveiller, Petit déjeuner, S'habiller »), « Marcher vite » sous « Quand je traverse », « Sur la route, je ___ » avec « marche » pour
  réponse, des cases abstraites (« Assiduité », « Non aide »), un QCM de deux options, une phrase à deux trous.
  - **Tout part de la scène.** Une scène est une situation de la vie d'un enfant (« Ta grand-mère te parle. »), son seul bon geste
    (« J'écoute ma grand-mère calmement ») et trois gestes à éviter. Le QCM pose la scène. Les cases « À faire » et « À éviter » reçoivent
    les bons gestes et les mauvais gestes de plusieurs scènes. L'intrus en prend deux d'un côté et un de l'autre. L'association relie
    l'étiquette de la scène à son bon geste. Un geste se comprend donc hors de sa scène : « Je m'arrête et j'attends au feu rouge » est bon
    partout, « Je traverse quand le feu est rouge » est mauvais partout. Quarante et une scènes en tout : onze pour le respect, la propreté et les
    affaires (`ci-ci-politesse`), dix pour l'école, dix pour l'entraide, dix pour la route.
  - **Des groupes pour lever l'ambiguïté.** Deux scènes dont les bons gestes se ressemblent (le feu vert, le passage piéton et le bord du
    trottoir mènent tous à « traverser ») ne sont jamais reliées dans le même exercice. Chaque thématique a au moins quatre groupes, pour
    les quatre paires du dernier niveau. Les phrases entières font des tuiles hautes : cinq gestes à ranger et quatre paires au plus, sans quoi
    l'écran d'un téléphone devient trop long.
  - **La bonne réponse ne se devine pas à sa longueur.** Le bon geste est plus court que les mauvais, qui portent leur contexte. Le QCM
    choisit donc les deux mauvais gestes les plus proches du bon par la longueur : sur 2 560 tirages, le bon geste est la plus courte des
    trois options une fois sur cinq, la plus longue une fois sur cinq. L'intrus écarte les trios dont le plus long fait presque le double
    du plus court.
  - **Les ordres n'ont qu'un ordre.** La traversée suit la fiche : s'arrêter au bord du trottoir, regarder à gauche, regarder à droite,
    traverser. « Le feu devient vert » vient après « Le feu est rouge » (avec « est » seul, les deux ordres seraient possibles). Les
    trous ne proposent que des mots qui ne vont pas dans la phrase : jamais « puis à gauche », que certains programmes enseignent.
  - **Saluer, remercier, s'excuser** ne sont pas refaits : `ci-ci-politesse` emprunte `politesse-situation`, `politesse-relier` et
    `politesse-trou` au français du CI, que le test juge ici avec la matière « Instruction civique ».
  - **Chaque scène a son clip** (`public/videos/scenes/<id>.mp4`, `lib/scene-clips.ts`) : cinq secondes qui montrent la situation et jamais le bon geste, jouées au-dessus de l'énoncé du QCM `civ-situation` (`payload.scene`), muettes, une seule fois, une fois la voix de Pio finie. `docs/scenes-civiques-clips.md` dit comment ils ont été faits, ce qui tient sur le premier écran d'un téléphone et comment en refaire un.
  - **`convex/__tests__/ciCivicsTemplates.test.ts`** a un VÉRIFICATEUR par gabarit, écrit avec une copie figée des tables (scènes, suites,
    phrases à trou) qu'un test compare au module : changer une scène oblige à relire le test. Il abîme ensuite chaque gabarit (le bon
    choix déplacé, un geste dans la mauvaise case, deux paires croisées, deux pas échangés, un mot faux dans le trou) et exige que son
    vérificateur le voie 240 fois sur 240. Il essaie aussi les ambiguïtés ciblées (le feu vert relié au passage piéton, l'ordre que le
    modèle avait écrit pour la traversée, « gauche » pour « puis à ___ »), vérifie les 127 émojis un à un contre une liste d'Unicode 11
    au plus, et fabrique 40 paliers de chacune des quatre thématiques pour trois paliers, jugés par le contrôleur avec la matière
    « Instruction civique ».
- **Les sciences du CI** (`paliers/games/milieuCi.ts` et `paliers/games/soinsCi.ts`) : vingt-neuf gabarits pour `sc-ci-milieu`,
  `sc-ci-animaux`, `sc-ci-plantes`, `sc-ci-hygiene` et `sc-ci-outils`. Sur les vingt-cinq exercices de sciences du CI relus le 19 octobre
  2026, six étaient faux. Ceux que le modèle avait écrits montraient, entre autres : un ordre « par habitat » sans critère (Lion,
  Crocodile, Poule), l'arachide rangée parmi les céréales, le bissap « fabriqué » dans un exercice et « naturel » dans le suivant,
  « Naturel » écrit deux fois dans une association, de longues descriptions en guise de tuiles, « Le baobab a des ___ très nutritifs »
  où les feuilles et les fruits vont, « Frapper doucement » jugé faux alors qu'il va aussi.
  - **Dix gabarits par palier, sans le modèle.** Le naturel ou fabriqué compte trois gabarits (un QCM, un glisser-déposer, une phrase à
    trous), les animaux sept, les plantes six, l'hygiène sept, les outils six. Chaque thématique a le type que la démonstration de la page
    d'accueil lui donne : un QCM pour « Naturel ou fabriqué ? », un glisser-déposer pour les animaux, une association pour les outils, un
    ordre pour l'hygiène, une phrase à trous pour les plantes.
  - **Les choses viennent du catalogue des images.** Une tuile qui nomme une chose s'écrit « article + nom », un mot de
    `lib/item-images.ts` : au CI l'écran y met le dessin et garde le nom écrit. Ces tuiles n'ont donc pas d'émoji de tête, car plusieurs
    émojis de la chose sont trop récents pour un appareil ancien. Dans un même exercice, toutes les tuiles sont des mots du catalogue, ou
    aucune ne l'est : une seule tuile sans image désignerait la bonne réponse par élimination, et l'écran retirerait alors toutes les
    images. Un test fait passer chaque tuile par `explainTilePictures`, la fonction de l'écran.
  - **Ce que les tableaux ne disent pas, on ne le demande pas.** Le crocodile vit dans l'eau et sur la terre : il n'est jamais rangé selon
    son habitat. La poule vole un peu : elle n'est jamais le mauvais choix de « Quel animal vole ? ». Le mouton a de la laine, la chèvre
    des poils longs, l'éléphant une peau presque nue : aucune question sur ce qui couvre leur corps. Aucun aliment préparé n'entre dans
    « naturel ou fabriqué ». La plante de l'arachide est « l'arachidier », son fruit « l'arachide ». Le seau et l'arrosoir portent de l'eau
    tous les deux, le marteau et le pilon frappent tous les deux : jamais ensemble dans une association. Les soins laissent de côté les
    cheveux et la brosse, car on brosse aussi les cheveux.
  - **Les gestes se lisent comme ceux de l'instruction civique.** L'hygiène (huit scènes) et les outils (six) reprennent l'idée de
    `civique.ts` : une situation, un bon geste, trois gestes à éviter, mauvais même hors de leur scène. Chaque geste a quatre mots au
    moins après son émoji, sinon l'écran lui donnerait le dessin de l'émoji de tête quand c'est une chose du catalogue. Les ordres ne
    portent que des suites qui n'ont qu'un ordre : on mouille avant de savonner, on prend avant de se servir, on range à la fin. Elles ont
    trois ou quatre gestes, les associations trois paires et les gestes à ranger quatre tuiles : mesurés dans la séance de la galerie,
    sur un écran de 375 × 812, cinq gestes à ranger font une page de 1 254 px (440 px de défilement), une quatrième paire fait passer une
    tuile 60 px sous le dock et un cinquième geste à ordonner y laisse le dernier 90 px plus bas.
  - **Jamais deux fois le même exercice dans un palier.** Les plantes ne sont que cinq : le glisser-déposer des plantes en montre
    toujours quatre, sinon deux exercices du même palier seraient les mêmes. La phrase à trous du naturel ou fabriqué a pour identité la
    phrase qu'on lit, pas la réponse. Les choses, les animaux, les scènes et les outils se répartissent sur le palier : un gabarit prend
    d'abord ce que les autres n'ont pas encore montré (`takeFresh`, avec une clé partagée par toute la thématique), puis reprend.
  - **`convex/__tests__/ciSciencesTemplates.test.ts`** (224 tests) a un VÉRIFICATEUR par gabarit, écrit avec une copie figée des tableaux
    (choses, animaux, scènes, suites, phrases à trous) qu'un test compare au module : changer une chose ou une scène oblige à relire le
    test. Il abîme ensuite chaque gabarit (le bon choix déplacé, une tuile dans la mauvaise case, deux paires croisées, deux pas échangés,
    un mot faux dans le trou) et exige que son vérificateur le voie 120 fois sur 120. Il vérifie les émojis contre une liste d'Unicode 11
    au plus, fait passer chaque tuile par la résolution des images du CI, et fabrique 40 paliers de chacune des cinq thématiques pour
    trois paliers, jugés par le contrôleur avec la matière « Éveil scientifique ». Il a trouvé trois défauts en route : deux phrases à
    trous identiques dans un même palier, et, parce qu'il n'y a que cinq plantes, deux associations et deux rangements de plantes qui
    étaient les mêmes.
- **Les arts du CI** (`paliers/games/plastiqueCi.ts` et `paliers/games/mimesCi.ts`, leurs outils dans `paliers/games/ciTiles.ts`) :
  dix-neuf gabarits pour `ar-ci-couleurs`, `ar-ci-formes`, `ar-ci-frises` et `ar-ci-mimes`. Les trois premières thématiques laissaient au
  modèle quatre, quatre et deux exercices par palier, à côté des jeux (pots de couleur, frises à compléter, dessins à copier) ; la
  quatrième lui laissait les dix. Sur les seize exercices d'arts du CI relus le 19 octobre 2026, cinq étaient faux. Dans l'export de la
  production, le modèle avait écrit, entre autres : la mangue, la goyave et la pomme rangées sous trois couleurs (elles en ont
  plusieurs), la table comptée parmi les rectangles (il y en a de rondes), un ballon pris pour un rond (c'est une boule), « Quelle
  couleur est souvent utilisée pour décorer les guirlandes ? », des émotions à mettre « dans l'ordre de l'histoire » (il n'y a pas
  d'histoire) et « Colère » reliée à « Quand on perd un jeu » (on peut y être triste).
  - **Dix gabarits par palier, sans le modèle.** Les couleurs en ajoutent quatre (choisir, relier, ranger, ordonner), les formes quatre
    (choisir, relier, ranger, compléter), les frises deux (continuer la frise, trouver l'intrus) et les mimes neuf (des visages, des
    situations, des gestes, des cris, une phrase à trous). Chaque thématique garde les types que la démonstration de la page d'accueil lui
    donne : une association et un ordre pour les couleurs, une phrase à trous pour les formes, un QCM pour les frises, un glisser-déposer
    pour les mimes.
  - **Les tuiles.** Une tuile qui nomme une chose, un objet, une forme ou un animal s'écrit « article + nom », un mot du catalogue des
    images : l'écran y met le dessin. Une couleur n'est pas une chose : sa tuile est un rond ou un cœur de sa couleur suivi de son nom
    (`💛 jaune`), comme au CI en anglais, et la voix dit le nom seul. Un visage est un émoji seul. Une émotion est un nom sans article
    (`Joie`, comme à la démonstration), seul ou après son visage (`😀 Joie`) : « la joie » aurait la forme d'une chose sans dessin, et le
    contrôleur le signalerait. Un geste est un émoji puis quatre mots au moins, et son émoji n'est pas le visage de l'émotion qu'il
    désigne. Une frise est faite d'émojis seuls. Aucun émoji n'est d'Unicode 12 ou plus, aucun n'est suivi d'un sélecteur de variation.
  - **Ce que les tableaux ne disent pas, on ne le demande pas.** Les fruits qui changent de couleur en mûrissant (la mangue, la pomme, la
    goyave, le citron, le bissap) ne sont jamais demandés : les choses sont celles dont le dessin du catalogue ne laisse aucun doute. Les
    formes sont celles que montre le dessin de l'objet : l'assiette et la pizza rondes, la fenêtre carrée, le drapeau, le livre, le cahier
    et la règle rectangles, le toit et la tente triangles, l'étoile de mer. Pas de ballon (une boule), pas de table (rectangle ou ronde
    selon la table). Un seul ordre juste : les couleurs du drapeau du Sénégal de gauche à droite, celles d'un feu de haut en bas, les
    quatre premières de l'arc-en-ciel. Sur un visage, les yeux grands ouverts disent la peur comme la surprise : elles ne se côtoient
    jamais. La tristesse et la colère ne se côtoient pas dans les choix d'une situation, car perdre un jeu, c'est l'une ou l'autre. Aucune
    situation de surprise (elle est presque toujours aussi de la joie ou de la peur), aucun métier à deviner (le catalogue n'a pas de
    dessin de métier) et aucun mauvais choix qui puisse être bon : « pleurer de joie » existe, on ne le propose pas.
  - **Trois paliers, jamais la même question.** Un gabarit qui a peu de variantes donne à chaque niveau sa part (`variantsForLevel`) :
    rouge ou jaune au premier palier, vert ou bleu au deuxième, orange, violet ou blanc au troisième ; un tiers des objets, des visages,
    des situations et des cris. Les associations vont plus loin, car trois paires reconnues d'un palier à l'autre se remarquent : chaque
    niveau a ses propres choses, objets, visages et animaux (`LINK_THINGS`, `LINK_OBJECTS`, `LINK_FACES`, `CRY_WINDOWS`). Deux paliers ne
    relient jamais la même paire de couleurs ou de formes, jamais plus d'une paire de visages ou de cris, et aucune paire n'est aux trois
    paliers. Mesuré sur 300 tirages, deux paliers partageaient avant presque toujours une paire, et deux paires ou plus dans plus d'un
    tirage sur deux. Aux rangements de couleurs, deux paliers voisins ne partagent qu'une chose (`SORT_ZONES`) ; le catalogue n'a que deux
    objets ronds et deux triangulaires, donc les rangements de formes en partagent deux.
  - **Les émotions se répartissent dans un palier de mimes.** Cinq exercices ne disent qu'une émotion : le visage à trouver, l'émotion d'un
    visage, celle d'une situation, le geste, la phrase à trous. Chacun prend l'une des émotions les moins prises dans le palier
    (`lightestEmotion`) : aucune n'y revient plus de deux fois et au moins trois s'y montrent. Avant, le premier palier n'en montrait que
    deux dans près de deux tirages sur trois, et une même émotion revenait quatre fois dans un tirage sur sept. La phrase à trous passe
    pour cela avant les autres dans le programme, car au premier niveau elle n'a qu'une phrase (la tristesse) et les autres se répartissent
    autour d'elle.
  - **Les deux rangements de visages d'un palier se partagent les visages.** Il n'y a que onze visages : trois pour la joie, deux pour
    chacune des quatre autres émotions. Les deux rangements ont le moins de visages possible en commun : un seul aux deux premiers
    niveaux (sept visages pour huit tuiles), aucun au dernier. Au premier niveau, leurs deux paires de cases partagent la joie, qui a trois
    visages. Au dernier, chacun a ses propres cases (`HARD_TRIPLES`) : la tristesse et la peur pour l'un, la colère et la surprise pour
    l'autre, avec la joie pour les deux, jamais la peur avec la surprise. Les visages en plus vont aux cases qui ont encore le plus de
    visages que le palier n'a pas montrés (`faceCounts`, deux au plus par case). Avant, les deux rangements du dernier niveau avaient les
    mêmes cases, qui n'ont que deux visages : sur 300 tirages ils en partageaient quatre sur cinq dans 55 % des cas, deux au moins
    toujours, et ceux du deuxième niveau un ou deux.
  - **Ce que l'écran montre.** Mesurés dans la séance de la galerie, sur un écran de 375 × 812 : un QCM, une association et un ordre
    tiennent au-dessus du dock, frises et gestes comprises. Un glisser-déposer laisse sa seconde case sous le dock tant que l'écran n'a
    pas défilé, comme ceux des sciences ; avec trois cases de visages, rangées sur deux colonnes, la troisième dépasse un peu.
  - **`convex/__tests__/ciArtsTemplates.test.ts`** (177 tests) a un VÉRIFICATEUR par gabarit, écrit avec une copie figée des tableaux
    (choses et couleurs, objets et formes, visages, situations, gestes, cris, phrases à trous) qu'un test compare au module : changer une
    chose ou un visage oblige à relire le test. Il abîme ensuite chaque gabarit (le bon choix déplacé, une tuile dans la mauvaise case, deux
    paires croisées, deux pas échangés, un mot faux dans le trou) et exige que son vérificateur le voie 120 fois sur 120. Il vérifie les
    émojis contre une liste d'Unicode 11 au plus, fait passer chaque tuile par la résolution des images du CI, et fabrique 40 paliers de
    chacune des quatre thématiques pour trois paliers, jugés par le contrôleur avec la matière « Éducation artistique », en comptant les
    questions de chaque palier. Il a trouvé cinq défauts en route : le contrôleur ne reconnaît pas « de haut en bas » comme le critère d'un
    ordre de couleurs (le feu s'énonce donc « Mets dans l'ordre les lumières du feu, de haut en bas »), une consigne avait deux apostrophes
    droites, entre lesquelles l'écran coupe, le verbe « souris » est aussi un mot du catalogue (la souris), les deux glisser-déposer de
    visages du premier palier se ressemblaient, et la même question de couleur revenait à deux paliers. Il garde aussi la variété, sur
    40 tirages : aucune paire commune à deux paliers pour les couleurs et les formes, une au plus pour les cris et les visages, une chose
    au plus au rangement des couleurs, trois émotions au moins et deux exercices au plus sur la même dans un palier de mimes, un visage
    commun aux deux rangements de visages aux deux premiers niveaux et aucun au dernier. Seize mutations de ces règles (une chose passée
    d'un niveau à l'autre, une fenêtre de cris décalée, l'émotion tirée au hasard, la phrase à trous remise en dernier, les anciennes cases
    du dernier niveau, des visages en plus répartis au hasard, la peur avec la surprise, trois visages dans une case) sont toutes vues. Le correctif a trouvé un piège : `fresh` refait un tirage jusqu'à huit fois quand sa clé est
    déjà prise, et pour la phrase à trous elle l'est toujours, car `pickFresh` la pose lui-même. Le choix de l'émotion, fait dans le tirage,
    comptait donc neuf fois la tristesse. Il se fait avant `fresh`.
- **L'histoire et la géographie du CE1** (`paliers/games/ce1Histoire.ts`, `ce1Geographie.ts`, leurs outils dans `ce1Outils.ts`) :
  soixante-trois gabarits pour `hi-ce1-temps`, `hi-ce1-famille`, `hi-ce1-ecole`, `hi-ce1-quartier`, `ge-ce1-orientation`, `ge-ce1-saisons`,
  `ge-ce1-eau-relief` et `ge-ce1-plan`, les huit premières thématiques du CE1 que le modèle n'écrit plus. Sur l'échantillon de CE1 lu le
  21 octobre 2026, 18 exercices sur 48 étaient faux en histoire et en géographie : « Quel est le nom de ton quartier ? », un ordre
  « d'importance », « Bakel - fleuve Gambie », « Dakar - fleuve Sénégal », « Quel fleuve se jette dans l'Atlantique ? » (le Sénégal, le Niger
  et le Congo y arrivent), une clé « Est » pour un « centre » entre le nord et le sud. Ici la réponse se calcule ou se lit dans l'énoncé.
  Les noms des gabarits commencent par `ce1-`, pour ne heurter aucun nom du CI ni du CP.
  - **Le CE1 a quatre paliers, joués aux niveaux 1, 2, 3 et 4** (le CP en a trois, joués aux niveaux 1, 2 et 4) : `levelGroup` et
    `variantsForLevel` donnent le même groupe aux niveaux 3 et 4. `ce1Outils.ts` ajoute `windowOf` et `windowFor` : chaque niveau reçoit sa
    fenêtre de variantes, un quart de la liste quand elle est assez longue, et au moins le nombre de fois que le palier demande le gabarit.
    Mesuré sur 200 graines par thématique, les questions revues dans un autre palier sont passées de 12,2 % à 0,2 %. Une liste de moins de
    quatre fois ce nombre oblige deux paliers voisins à se partager des variantes : il faut l'allonger plutôt que d'accepter la répétition.
  - **Le temps qui passe** : les dates des chronologies sont inventées par le gabarit et écrites dans l'énoncé (« Le marché ouvre en 1980,
    la mairie est bâtie en 1950… Mets-les du plus ancien au plus récent »), jamais tirées de l'histoire d'un village. Elles se resserrent
    aux paliers suivants : des siècles, des décennies, des demi-décennies, puis des années. Trois gabarits (`ce1-ligne-ecart`,
    `ce1-ecole-ecart`, `ce1-village-ecart`) demandent le nombre d'années entre deux dates, à écrire. « Autrefois » ne range que des couples
    d'un même besoin (la lampe à pétrole et la lampe électrique, la lettre et le téléphone portable, la charrette et la voiture, le feu de
    bois et la cuisinière à gaz, le puits et le robinet) : la fiche n'en donne aucun, ce sont des exemples d'école, à faire relire.
  - **La famille** : les liens ne se discutent pas (le frère de ma mère est mon oncle) et `ce1-lien-trou` accorde « mon » ou « ma » avec le
    nom, en ne proposant que des noms du même genre. Les souvenirs (l'arbre généalogique, la photo, le récit d'un grand-parent, l'acte de
    naissance, le livret de famille) sont des définitions, pas des faits propres à une famille.
  - **L'école et le quartier** : les sources (l'ancien élève, l'ancien instituteur, la photo, le registre, le vieux cahier) et les mots
    (maire, fondateur, mairie, monument, commune) sont définis comme la fiche les donne. Aucun gabarit ne parle de « l'origine du nom » d'un
    village : c'est un fait propre à chaque village. Une question « Qui… ? » n'a jamais une autre personne parmi ses mauvais choix.
  - **Les points cardinaux** se calculent : un quart de tour vers la droite fait passer le nord à l'est, le test le vérifie avec des
    vecteurs. `ce1-face` et `ce1-tourne` font tourner l'enfant sur lui-même ; `ce1-lieux-direction` place un lieu au nord ou à l'est d'un
    autre (deux lieux aux deux premiers paliers, trois lieux alignés du nord au sud ensuite).
  - **Les saisons** s'en tiennent au milieu de chaque saison. La fiche dit « à peu près » de novembre à juin et de juillet à octobre : les
    mois de bord (novembre, juin, juillet, octobre) ne sont jamais posés. Restent décembre à mai pour la saison sèche, août et septembre
    pour l'hivernage. L'harmattan est un vent chaud et sec, et il pleut plus au sud qu'au nord.
  - **L'eau et le relief** : les fleuves sont ceux de la fiche (Gambie, Casamance, Sénégal), les lacs aussi (Rose, de Guiers) ; le Saloum
    n'est pas posé, la fiche ne dit pas s'il est un fleuve ou un bras de mer. HORS FICHE, À FAIRE RELIRE : les villes d'un fleuve (Saint-Louis,
    Podor et Bakel sur le Sénégal ; Ziguinchor, Kolda et Sédhiou sur la Casamance), les définitions de la mare et du puits, et l'océan.
  - **Le plan** est un quadrillage de carrés de couleur (rouge, bleu, vert, jaune, violet, orange) et de cases vides (⬜), avec sa légende
    écrite dans l'énoncé (« le carré rouge est la porte »), pour la classe, l'école ou la maison. Deux lignes au premier palier, trois ensuite.
    Les cases sont dites « en haut à gauche », « au centre », « en bas à droite ». Le seul émoji que ces gabarits écrivent est dans l'énoncé
    d'un plan, jamais sur une tuile ni dans un indice. Une étiquette est un nom seul, sans article, et une case de glissé n'a pas d'article
    non plus (« Personne », « Lieu », « Document ») : `templatePictures.test.ts` les joue au CI.
- **Les sciences du CE1** (`paliers/games/ce1Vivant.ts`, `ce1Matiere.ts`, leurs aides dans `ce1SciencesOutils.ts`) : cinquante-deux
  gabarits pour les six thématiques `sc-ce1-nutrition`, `sc-ce1-respiration`, `sc-ce1-paludisme` (29 gabarits, `ce1Vivant.ts`),
  `sc-ce1-substances`, `sc-ce1-eau` et `sc-ce1-objets` (23, `ce1Matiere.ts`), que le modèle n'écrit plus. Sur l'échantillon de CE1 lu le
  21 octobre 2026, 6 exercices sur 36 étaient faux en sciences : un ordre arbitraire de la prévention du paludisme, des aliments sans
  rapport avec le paludisme, « Quel aliment aide les poumons ? » (le bissap), la farine qui se dissout, un ordre « bouillir puis filtrer »
  à l'envers de l'usage, une question ouverte sur un robinet. Ici chaque exercice lit une ligne d'un tableau fermé, écrite à la main, dont
  la bonne réponse est dans la ligne et dont les mauvais choix ne peuvent pas être une deuxième bonne réponse. Les noms des gabarits
  commencent par `ce1-` ; ceux de l'eau potable par `ce1-pot-`, parce que `ce1-eau-*` est déjà la géographie du CE1. Les fonctions sont des
  `makeCe1…` (le CI et le CP ont leurs `makeTool…`, `makeBody…` et d'autres noms voisins : `index.ts` les importe tous).
  - **`ce1SciencesOutils.ts`** porte la forme commune : `factChoice` (un QCM de trois choix), `factGap` (une phrase à trou), `factWrite` (une
    réponse courte d'un mot de la liste), `binSort` (un glissé entre deux cases), `pickPairs` (trois paires prises parmi tous les trios
    possibles d'un tableau), `stepsOrder` (un ordre). `pickLine` préfère, quand un palier lit deux fois le même gabarit, deux lignes dont la
    bonne réponse diffère.
  - **Quatre parts qui couvrent tout le tableau.** `windowFor` (lot 1) fait glisser une fenêtre sur la liste et laisse hors fenêtre des lignes
    qu'aucun niveau ne sert jamais : en comptant, quatre lignes sur six, quatre sur huit, une sur neuf ou dix n'étaient jamais posées, et l'une
    d'elles avait deux apostrophes dans son énoncé, sans qu'aucun test puisse la voir. `partOf(items, index, parts)` et `quarter(items, level, uses)`
    coupent la liste en parts égales à une près : chaque ligne appartient à un niveau, aucune à deux. Les ordres et les chaînes alimentaires
    prennent la moitié de la liste courte aux niveaux 1 et 2, la moitié de la liste longue aux niveaux 3 et 4. Mesuré sur 200 graines par
    thématique, aucune question n'est revue d'un palier à l'autre (0,0 %), et le test relit 40 tirages par thématique.
  - **Ce que les tables écrivent.** Nutrition : le régime de chaque animal (herbivore, carnivore, omnivore), qui mange quoi dans une chaîne
    (l'herbe, le mouton, le lion), ce dont une plante a besoin (l'eau, la lumière, le sol). Un herbivore se cherche parmi des carnivores, un
    carnivore parmi des herbivores : la poule et l'homme, omnivores, ne sont jamais un mauvais choix discutable. Respiration : les poumons et les
    branchies, par où l'air entre, ce qui pollue l'air. Substances : seuls le sel et le sucre se dissolvent, le sable, le caillou, le riz et
    d'autres non. Eau potable : le puits, le forage, le robinet et le fleuve ; bouillir, filtrer, quelques gouttes de javel ; un récipient propre
    et couvert. Paludisme : le moustique, la moustiquaire, les eaux stagnantes, les mains lavées contre les vers, le dispensaire en cas de
    fièvre. Objets : lampe torche, ciseaux, robinet, cadenas, avec comment ils marchent et s'entretiennent. HORS FICHE, À FAIRE RELIRE : les
    animaux au-delà du mouton, du lion et de l'homme, les chaînes qui ne sont pas « herbe, mouton, lion », les trois polluants de l'air
    (fumée, poussière, déchets brûlés), « les poumons sont dans la poitrine », les produits qui ne se dissolvent pas hors du sable, « laisser
    refroidir » après avoir fait bouillir, les moustiques qui se développent dans l'eau stagnante, l'infirmier du dispensaire, les objets
    usuels (règle, balai, seau, craie, cartable) et les gestes de l'école (poubelle, trousse, adulte prévenu).
  - **Les ordres suivent la logique des choses.** Chaque suite est celle qu'on fait vraiment (ouvrir la lampe, retirer les piles, mettre des
    piles neuves) ou la chaîne des causes (une eau qui reste, des moustiques, une piqûre, la fièvre), jamais un classement d'importance. Aux
    niveaux 1 et 2, trois étapes ; aux niveaux 3 et 4, quatre. Les indices d'un ordre ne nomment aucune étape : ils disent comment chercher.
  - **Pièges rencontrés.** (1) `templatePictures.test.ts` joue tous les gabarits au CI : un choix « Le puits », « La fumée », « Du sucre » ou
    « Les agrandir » (un verbe précédé de « les » se lit comme un nom) est refusé. Les choix qui nomment une chose sont des noms seuls avec
    leur majuscule (« Puits », « Fumée », « Sucre »). (2) Un énoncé a une apostrophe droite au plus : « Qu'est-ce qui pollue l'air ? » en a deux,
    il devient « Quelle chose pollue l'air ? ». (3) Le test des indices compte les mots de quatre lettres ou plus de toutes les étiquettes,
    « pour », « dans » et « avec » compris. (4) Un appariement de trois paires veut trois valeurs différentes à droite : « animal relié à son
    organe » n'en a que deux, il devient « mot relié à ce qu'il veut dire ». (5) Deux QCM d'objets d'un même palier ne parlent pas du même
    objet, et le robinet et le seau ne sont jamais mêlés dans une question sur l'eau.
  - **Mesuré** : 127 tests (`convex/__tests__/ce1SciencesTemplates.test.ts`), dont une vérification par gabarit contre des tables écrites à
    part ; 29 pannes provoquées dans le code (le lion herbivore, le sucre qui rend l'eau potable, le cadenas qui coupe du papier, les deux
    trous complétés par le même mot…) toutes vues ; le contrôleur ne signale aucun défaut sur 4 800 paliers fabriqués (48 000 exercices) ; les
    paliers lus à la main ; l'ordre, le glissé, l'appariement et le QCM vus sur l'iPhone 17 (Safari du simulateur, galerie `/dev/exercices`
    avec des spécimens détournés provisoirement). L'appariement coupe les mots dans ses colonnes étroites (« stag-nantes »), comme au CP.
  - **La vitrine** veut, sur une thématique tout en gabarits, un gabarit du type de chacun de ses exercices : un ordre sur « L'histoire de ma
    famille » (`ce1-famille-ordre`) et une réponse courte sur « Le plan de la classe et de l'école » (`ce1-plan-ecrire`).
  - `convex/__tests__/ce1HistoryGeographyTemplates.test.ts` RECALCULE chaque réponse depuis l'énoncé, avec ses propres tables (des années lues
    et rangées par le test, des quarts de tour calculés avec des vecteurs, les liens de famille, les mois de chaque saison, les carrés d'un plan
    lus un à un), contre 4 niveaux et 60 graines de chacun des soixante-trois gabarits, puis fabrique 30 paliers de chaque thématique, aux
    quatre paliers, contre le contrôleur. Vingt-six pannes provoquées dans le code (une somme au lieu d'une différence, un sens de tour inversé,
    juillet posé en saison des pluies, gauche et droite échangées sur le plan…) sont toutes attrapées. Sur 8 000 paliers fabriqués, le
    contrôleur ne signale aucun défaut.
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
  `ge-ci-lateralite`, `ge-ci-reperes`, `ge-ci-quadrillage`, `fr-ci-phrases`, `fr-ci-politesse`, `an-ci-hello`, `an-ci-colours`, `an-ci-numbers`, `an-ci-animals`, `an-ci-fruits`, `ci-ci-politesse`, `ci-ci-ecole`, `ci-ci-entraide`,
  `ci-ci-route`, `sc-ci-milieu`, `sc-ci-animaux`, `sc-ci-plantes`, `sc-ci-hygiene`, `sc-ci-outils`, `ar-ci-couleurs`, `ar-ci-formes`, `ar-ci-frises` et `ar-ci-mimes` au CI, puis `hi-cp-calendrier`, `hi-cp-durees`,
  `hi-cp-frequences`, `hi-cp-emploi-du-temps`, `ge-cp-itineraire`, `ge-cp-distances`, `ge-cp-plan`, `ge-cp-quartier`, `an-cp-family`, `an-cp-body`, `an-cp-classroom`, `an-cp-numbers-20`, `an-cp-food`, `fr-cp-lecture` et
  `fr-cp-ecrire` au CP (`convex/programme`), dix exercices par palier, voir plus bas ; le modèle n'écrit plus rien. (Quand une fiche garde des exercices du
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
  chaque palier de ces soixante-dix-neuf thématiques contre un faux modèle qui lève une
  exception au moindre appel. Il reste un appel au modèle pour ces paliers :
  l'explication pas à pas qu'un enfant demande après cinq essais ratés
  (`explainExercise`, `convex/explainMistake.ts`), mise en cache par exercice.
  Les autres thématiques gardent des exercices du modèle, avec leurs défauts connus (voir plus
  haut) : en CI, l'éducation artistique (couleurs, formes, frises, mimes) ; toutes les autres classes, sauf le CP, dont aucune des quarante-deux thématiques n'appelle plus le modèle. Le français (phrases, politesse), l'histoire, la géographie, l'anglais, les sciences et l'instruction civique du CI, puis
  tout le CP (l'histoire, la géographie, l'anglais, le français, les arts, l'instruction civique, les sciences et toutes les mathématiques), n'appellent plus le modèle.
  Les fiches de géométrie et de mesure du CI ne couvrent pas tout leur programme : ni « dessus,
  dessous » (il faudrait une mise en page verticale), ni « plus long » ni « plus plein », et le
  rectangle n'est jamais la bonne réponse d'un nom de forme (aucun émoji sûr) ; ils restent à
  ajouter.
- **La vitrine** ne leur donne pas de carte : ce sont des QCM, des ordres, des
  associations et des phrases à trous, déjà montrés. Son test n'admet un exercice
  dans une thématique tout en jeux que si l'un de ses gabarits fabrique ce type
  (l'histoire du CI montre sa phrase à trous dans « Les jours de la semaine », que `jour-manquant` fabrique, et la
  géographie son relier dans « Ma droite et ma gauche », que `doigt-relier` fabrique)
  (le glisser-déposer du français du CI est rattaché à « Bonjour, merci, s'il te plaît », que `politesse-glisser`
  fabrique ; celui des mathématiques à « Les formes et les solides », que `classer-formes`
  fabrique). Au CP, l'histoire et la géographie sont tout en gabarits : la réponse courte de la vitrine est rattachée à « Le
  calendrier » (`mois-ecart`) et à « Près ou loin ? » (`pas-difference`), les deux gabarits qui demandent un nombre à écrire. L'anglais du CI est tout en gabarits : ses cinq types de la vitrine sont ceux d'un
  gabarit de leur thématique (le QCM des couleurs, le glisser-déposer des fruits, le relier des animaux, l'ordre des nombres, la phrase à
  trous des salutations). L'instruction civique du CI l'est aussi : le QCM de « Traverser la rue » est un `civ-situation`, le glisser-déposer de « À l'école chaque jour » un `civ-glisser`,
  l'association et la phrase à trous de « Bonjour, merci, pardon » un `civ-relier` ou un `politesse-relier` et un `politesse-trou`, l'ordre de « On s'entraide » un `civ-ordre`. Les sciences du CI le sont aussi : le QCM de « Naturel ou fabriqué ? » est un `milieu-intrus`, le glisser-déposer de « Les animaux autour de moi » un `faune-glisser`, l'association de « Les outils de la maison et de l'école » un `outil-relier`, l'ordre de « Mon corps et la propreté » un `hygiene-ordre` (le lavage des mains) et la phrase à trous de « Les plantes autour de moi » un `plante-trou`. Les arts du CI le sont aussi : l'association et l'ordre de « Les couleurs » sont un `teinte-relier` et un `teinte-ordre`, la phrase à trous de « Les formes » un `contour-trou`, le QCM de « Frises et guirlandes » un `guirlande-suite` ou un `guirlande-intrus`, le glisser-déposer de « Mimes et émotions » un `visage-glisser`.
