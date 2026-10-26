# Relecture « enseignant » par huit agents, 26 octobre 2026

Huit agents ont relu `docs/fiche-relecture-enseignant-2026-10-26.md` (79 thématiques, 553 exercices) en jouant le rôle d'un enseignant de primaire au Sénégal. Ce n'est pas la relecture d'un vrai enseignant, qui reste à faire. Les défauts ci-dessous sont des constats à vérifier avant de corriger : aucun n'a été corrigé, rien n'est commité ni déployé.

Limites : les exercices d'écoute et les grilles de pixels n'ont pas pu être jugés (ni son ni image dans la fiche). Chaque tranche a été relue par un seul agent, sans second avis.

Bilan : environ 530 exercices relus, 48 défauts nets, plus quelques réserves mineures. La plupart sont des réponses défendables refusées ou des indices faux, deux familles que le contrôleur ne détecte pas aujourd'hui.

## CI et CP (4)

1. CP, `ar-cp-roles` 1.3 : « Quel objet sert au boulanger ? » (Four / Balance / Thermomètre). La balance est défendable. Remplacer par un objet que le boulanger n'utilise pas, ou demander « à cuire le pain ».
2. CP, `ar-cp-roles` 1.8 : « tu prends la température d'un malade et tu le soignes » accepte seulement infirmière ou infirmier. Médecin et docteur conviennent. Mettre le lieu dans la consigne ou accepter ces mots.
3. CP, `ci-cp-route` 1.3 : « Il n'entre pas dans la rue » et « Il roule plus vite au panneau STOP » n'ont pas de sujet. Donner un sujet.
4. CI, `ge-ci-reperes` 1.3 : l'indice 3 dit que les deux autres dessins ne sont pas de la même sorte, alors que la charrette et le bus bougent tous deux.

## CE1 (5)

1. `ar-ce1-pliage` 1.6 : l'indice 2 parle d'un « trait » absent des choix (Ciseaux, Colle, Argile).
2. `hi-ce1-temps` 1.9 : la charrette est classée « Autrefois », mais elle est courante aujourd'hui au Sénégal. Choisir une chose réellement disparue.
3. `sc-ce1-eau` 1.6 : l'indice 3 dit « Trois gestes » alors que la case n'en contient que deux.
4. `sc-ce1-respiration` 1.7 : l'indice 2 est faux (les trois mots sont des parties du corps), et « Nez ~ L'air y entre » vaut aussi pour les poumons.
5. `sc-ce1-paludisme` 1.7 : l'indice 2 cite l'eau, absente des trois mots.

Réserves mineures : indice 3 de `sc-ce1-paludisme` 1.2 (« On le règle »), libellé « Abîme » de `ci-ce1-civisme` 1.5, « cet animal » dans `sc-ce1-respiration` 1.1, « 1 026 » avec espace dans `ma-ce1-nombres-10000` 1.10 à vérifier.

## CE2, première moitié (7)

1. `ar-ce2-hymne` 1.10 : « Que fait-on ensemble au lever des couleurs ? » n'accepte que « chanter ». Saluer et se lever sont défendables.
2. `ar-ce2-theatre` 1.9 : « répliques » seul. Dialogue, paroles sont défendables. « texte » est accepté mais l'indice 3 dit « commence par r ».
3. `ar-ce2-theatre` 1.5 : « Parodie » est probablement hors niveau CE2.
4. `ci-ce2-communaute` 1.1 : « Lequel de ces lieux » alors que deux choix sont des objets (natte, ballon).
5. `ci-ce2-communaute` 1.9 : « respecter » seul. Suivre, obéir, appliquer sont défendables.
6. `fr-ce2-determinants` 1.8 : l'indice 3 est trompeur (« votre » ne change pas de fin).
7. `fr-ce2-imparfait` 1.5 : « forme finie » est ambigu. Dire « conjugué » et « participe passé ».

## CE2, seconde moitié (6)

1. `ge-ce2-regions` 1.7 : l'indice 2 parle de gauche et de droite alors que les cases sont Nord et Sud.
2. `sc-ce2-environnement` 1.4 : « Manque d'eau » rangé en « Population » est contestable (c'est aussi un problème d'environnement).
3. `sc-ce2-plantes` 1.8 : l'indice 2 annonce trois choses, l'exercice n'en montre que deux.
4. `sc-ce2-sante` 1.9 : « la maladie transmise par les moustiques » admet aussi dengue et fièvre jaune. « malaria » n'est pas accepté.
5. `sc-ce2-animaux` 1.7 : « La tortue est un animal aquatique » est défendable.
6. `hi-ce2-progres` 1.9 : « mobile » n'est pas accepté pour « téléphone ___ ».

Réserves mineures : indice « seulement par le sang » de `sc-ce2-sante` 1.5 (VIH), listes acceptées courtes dans `sc-ce2-animaux` 1.9 et `sc-ce2-environnement` 1.9.

## CM1, première moitié (6)

1. `ar-cm1-comedie` 1.4 : l'indice 3 dit « commence par E » pour « des épaules basses ». De plus, « Le rôle » et « Un rôle » ne sont pas listés en 1.6.
2. `ar-cm1-memoire` 1.1 et 1.7 : « Le dessin de le papillon », « de le masque ». Contracter en « du ».
3. `ci-cm1-associations` 1.6 : seul « Comité de quartier » est accepté. « Le comité de quartier » et « Association de quartier » sont défendables.
4. `fr-cm1-recit` 1.10 : « la brume flotte » est rangé en Description, mais « flotte » est un verbe d'action.
5. `ge-cm1-climats` 1.4 : « Au sud du Sénégal » est ambigu (sud-est soudanien). Le climat de la Basse Casamance s'appelle plutôt subguinéen.
6. `ge-cm1-climats` 1.6 : « Au nord » seul. « Nord », « Le nord », « Dans le nord » sont justes.

## CM1, seconde moitié (8)

1. `hi-cm1-prehistoire` 1.6 : « sans cultiver ni élever » : la pêche répond aussi, et l'ordre inverse est refusé.
2. `hi-cm1-resistants` 1.4 : l'indice 2 oriente vers 1895 pour une date de 1886.
3. `hi-cm1-resistants` 1.8 : « son royaume » mais « El Hadji Oumar Tall ~ Fouta » n'est pas un royaume.
4. `sc-cm1-hygiene` 1.6 : « insalubre » (adjectif) est défendable et refusé.
5. `sc-cm1-hygiene` 1.8 : « Insalubrité ~ Ordures et eaux usées » donne une cause, pas un sens.
6. `sc-cm1-objets` 1.6 : « Remplacer le joint », « Réparer le joint » refusés.
7. `sc-cm1-respiration` 1.6 : « La fumée » refusée (seul « Éviter la fumée » est accepté), indice 3 « commence par E » étrange.
8. `sc-cm1-phenomenes` 1.6 : « la fusion » et « la fonte » refusées.

## CM2, première moitié (4)

1. `ci-cm2-institutions` 1.6 : « Voter les lois » seul. « Faire les lois », « Adopter les lois », « Légiférer » sont défendables.
2. `ar-cm2-observer` 1.1 : « Le dessin de le papillon » (même défaut de contraction que le CM1).
3. `fr-cm2-cfee` 1.9 : l'indice 2 est faux pour « avoir » (le radical change).
4. `fr-cm2-cfee` 1.10 : la consigne dit « de je à ils » alors que les étiquettes sont « il, nous, vous, ils ».

## CM2, seconde moitié (8)

1. `sc-cm2-appareils` 1.6 : « Dans quel état doivent être les mains » attend « Sécher ses mains » : « sèches » est refusé.
2. `fr-cm2-informer` 1.8 : « Nous transpirons » et « Nous ne buvons pas » rangés en Conséquence et Cause sont discutables.
3. `sc-cm2-appareils` 1.9 : « Débrancher le chargeur » classé Économie est aussi un geste de sécurité.
4. `sc-cm2-nutrition` 1.6 : « Construction » et « Aliments de construction » refusés.
5. `hi-cm2-progres` 1.6 : « l'ampoule » et « la lampe » refusées.
6. `fr-cm2-informer` 1.10 : « par conséquent » et « de ce fait » refusés.
7. `hi-cm2-independance` 1.4 : l'indice 2 (« jour de printemps ») ne départage pas du 1er mai et le printemps n'est pas une saison sénégalaise.
8. `fr-cm2-informer` 1.6 : l'indice 1 cherche une phrase qui n'est pas dans la liste.

## Correctifs préparés (non commités)

Sur ordre du propriétaire, quatre agents (français, sciences, histoire-géographie-civique, arts) ont revérifié chaque constat contre le code et la fiche officielle, puis corrigé à la source avec un test qui échoue sur l'ancien code. Les quatre patchs s'appliquent sans conflit dans le worktree ; rien n'est commité.

- **Corrigés : 43 sur 48 environ.** Arts 9 sur 10, français 7 sur 8, sciences 14 corrigés et 1 en partie, histoire-géographie-civique 14 sur 17.
- **Rejetés après second avis :** « Parodie » au CE2 (la fiche arts nomme la parodie en CE2) ; `fr-cm2-informer` 1.8 (cause et conséquence : discutable, pas faux) ; `ge-cm1-climats` 1.4 (« guinéen au sud » suit la fiche officielle ; « subguinéen » est un point plus fin). Deux autres ont été traités en partie : `hi-ce1-temps` 1.9 (la consigne précise le critère au lieu de changer la charrette) et `hi-cm1-resistants` 1.8 (« royaume ou région »).
- **Vérifié ensemble :** `tsc` propre à la racine et dans `convex` ; suite complète 222 fichiers, 11 256 tests, 6 ignorés ; les 267 thématiques fabriquées avec le contrôleur de la production, 15 tirages par palier : 15 420 paliers, 154 200 exercices, 0 défaut.
- **Hors liste, vu par les agents, corrigé ensuite :** `cm2Modes.ts` : la consigne « de je à ils » (tuiles qui sautent des personnes) devient « selon la personne (je, tu, il, nous, vous, ils) » ; `ci-cp-genre` : « Ils lisent le livre ensemble. » devient « La fille et le garçon lisent le livre ensemble. » (et « Ils se battent » de même). Tests ciblés (707), `tsc` et les 267 thématiques relancés : propres. La suite complète n'a pas été relancée après ces deux retouches.
- **Hors liste, non corrigé :** réserves mineures du VIH (`sc-ce2-sante` 1.5) et listes acceptées courtes (`sc-ce2-animaux` 1.9, `sc-ce2-environnement` 1.9).
- **Pas vérifié :** aucun rendu à l'écran, aucun enseignant. Les choix d'enseignement restent ceux des agents : balance ou four, médecin ou infirmière, charrette, « quinzaine d'années », « royaume ou région ».
- **Après la fusion :** déployer, régénérer les thématiques touchées (`pregen:invalidate` puis `run`, 0 $), relire les lignes neuves, relancer le réchauffement de la voix des tuiles du CI.
