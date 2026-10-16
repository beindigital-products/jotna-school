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

`programmeKeys` vise des thématiques précises, par la clé de leur fiche du
programme : quand une fiche gagne des gabarits (voir plus bas), seuls ses
paliers sont à refaire. `dryRun` compte et nomme les thématiques :

```bash
npx convex run paliers/pregen:invalidate '{"confirmDeployment":"impartial-ermine-150","programmeKeys":["fr-ci-sons-1","fr-ci-sons-2","fr-ci-sons-3","fr-ci-sons-4","fr-ci-alphabet","ma-ci-nombres-10","ma-ci-calcul-10"],"dryRun":true}'
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
| QCM | `qcm_options_few` (moins de 2), `qcm_correct_index_out_of_range`, `qcm_correct_option_empty`, `qcm_correct_option_duplicated`, `qcm_equivalent_options_with_correct` (« 5 » et « cinq », « 0,5 » et « 1/2 »), `qcm_answer_key_mismatch` (la réponse écrite est une autre option que celle désignée), `qcm_emoji_sum_mismatch` (« 🥭🥭 + 🥭 » avec « 2 » pour option juste ; émojis tous identiques seulement), `shape_emoji_mismatch` (🟦 est un carré : « rectangle » pour « Quel est le nom de cette forme ? 🟦 », ou `🟦~rectangle` dans un appariement ; QCM et appariement) | `qcm_options_many` (plus de 6), `qcm_option_empty`, `qcm_option_duplicated`, `qcm_option_case_twin` (casse ou accents, sauf en français), `qcm_equivalent_options`, `qcm_answer_key_unrelated`, `qcm_catch_all_option` (« Toutes les réponses », « Aucune de ces réponses », « Les deux »), `qcm_correct_option_stands_out` (la bonne option est bien plus longue) |
| Association | `match_pairs_invalid` (moins de 2), `match_side_empty`, `match_pair_identical` (« Relie chaque mot à son image » avec `moto ~ moto` ; seulement quand l'énoncé parle d'image, jamais en Anglais : la région « Dakar » et la ville « Dakar » sont une vraie paire) | `match_pairs_count` (hors de 3 à 6), `match_pair_duplicated`, `match_left_repeated`, `match_right_repeated` (deux sons identiques se relient pourtant à la même tuile : jamais bloquant) |
| Ordre | `order_too_few` (moins de 2), `order_item_empty`, `order_spells_other_word` (« pour écrire 'poule' » avec les lettres e-l-o-p-u : la suite doit écrire le mot cité), `order_syllable_without_vowel` (« ng », « ss », « p » donnés comme syllabes), `order_without_criterion` (« Mets ces animaux dans l'ordre » : des animaux, fruits, couleurs, formes, villes, objets, lieux n'ont pas d'ordre naturel ; il faut un critère : « alphabétique », « du plus petit au plus grand », « de l'ouest à l'est »), `order_words_without_criterion` (« Mets ces mots dans l'ordre : ear, hand, eye » : une liste de mots sans phrase à former ni critère), `order_spatial_without_scene` (« Range ces objets de gauche à droite : Livre, Crayon, Cahier » sans scène à l'écran), `order_shapes_by_size` (des formes rangées par taille : un cercle ou un carré n'ont pas de taille), `order_proximity_without_reference` (« du plus proche au plus loin » sans dire de quoi), `order_syllables_without_word` (« Mets ces syllabes dans l'ordre : ma, pa, na » : aucun mot à former ; levé par « pour former un mot », « pour écrire », une image ou un critère), `order_prompt_mentions_zones` (« Place chaque syllabe dans la bonne zone » pour un ordre : l'écran n'a pas de zones) | `order_few` (2), `order_item_duplicated`, `order_already_sorted` (suite déjà rangée alphabétiquement ou par ordre croissant, sans que l'énoncé dise quel ordre) |
| Glisser-déposer | `dragdrop_zones_few`, `dragdrop_items_few`, `dragdrop_generic_zone` (« Zone A »), `dragdrop_zone_duplicated`, `dragdrop_zone_missing`, `dragdrop_label_without_zone` | `dragdrop_empty_zone`, `dragdrop_item_empty` |
| Réponse courte | `short_answer_no_answer` | `short_answer_empty_accepted`, `short_answer_answer_in_prompt` (hors nombres : « 10 − 3 + 3 » a pour réponse 10) |
| Phrase à trous | `fill_blank_invalid` (`validateFillBlank` refuse : trous et jeux de mots en nombre différent, bonne réponse absente des mots), `fill_blank_word_unknown` (CI et CP : le trou d'une lettre ou d'une syllabe écrit un mot absent de `paliers/knownWords.ts`, « ___ngue » avec « m »), `fill_blank_word_unreadable` (« Le mot est ___ (pa, ra, ni) » : le mot n'est écrit nulle part) | `fill_blank_off_limits` (plus de 4 trous, moins de 2 ou plus de 5 mots) |
| Indices | | `hints_few` (moins de 2), `hint_empty`, `hints_duplicated`, `hint_gives_answer` (le 1er écrit le bon choix sans parler des autres), `hint_dangling_visual` |
| Texte | `text_placeholder` (« undefined », « null », « NaN »), `text_replacement_char` (�) | `text_double_space`, `text_markup` (`**`, `#`, backtick, balise), `text_english_in_young_class` (anglais dans un énoncé de CI ou de CP hors Anglais), `text_foreign_currency` (euros, dollars : FCFA seul) |

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
| `lettre-initiale` | QCM | « Par quelle lettre commence « lit » ? 🛏️ » |
| `syllabes-compter` | QCM | « Combien de syllabes entends-tu dans « mère » ? » : 2 |
| `syllabe-manquante` | phrase à trous | `to___te` : `ma` |
| `lettre-manquante` | phrase à trous | `m___to` : `o` |
| `syllabe-mot` | association | `ba~bateau ; sa~savon…` |
| `mot-image` | association | `poule~🐔…` |
| `compter-emojis`, `ajouter-emojis`, `enlever-emojis` | QCM | « Combien de mangues en tout ? 🥭🥭 + 🥭 » : 3 |

- **Le vocabulaire** (`paliers/games/words.ts`, `LEXICON`) reprend les mots des
  thématiques « Les sons… » du CI, chacun avec sa découpe en syllabes relue à la
  main. `vocabulary: "mots-2"` dans la fiche du programme limite les mots à ceux
  des deux premiers paliers de lecture (les mauvais choix aussi). Un mot ajouté
  doit aussi figurer dans `paliers/knownWords.ts` : un test le vérifie.
- **Les mauvais choix d'un trou ne forment aucun mot** (`KNOWN_WORDS`), sinon
  l'exercice aurait deux bonnes réponses. Une syllabe donnée comme mauvais choix
  ne commence jamais le mot (« ba » pour « ballon »).
- **Le dénombrement** (`paliers/games/counting.ts`) compte les émojis qu'il
  écrit : jamais plus de 5 au premier palier, 10 au dernier.
- **Où ils sont demandés** : le champ `games` des fiches `fr-ci-sons-1` à
  `fr-ci-sons-4`, `fr-ci-alphabet`, `ma-ci-nombres-10` et `ma-ci-calcul-10`
  (`convex/programme`), sept exercices par palier ; le modèle n'en écrit que trois.
  Pour que ces trois-là ne fassent pas échouer le palier (le seuil de validation
  exige 3 valides sur 3), le modèle en écrit deux de plus et on garde les premiers
  valides (`scoring.exercisesToRequest`). Un palier déjà généré garde ses exercices : il faut l'invalider
  (`pregen:auditExercises` ou une régénération) pour qu'il reçoive les gabarits.
- **La vitrine** ne leur donne pas de carte : ce sont des QCM, des ordres, des
  associations et des phrases à trous, déjà montrés.
