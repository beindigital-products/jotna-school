# Programme d'anglais du CI au CM2, version 2 (proposition)

État : proposition validée par le propriétaire le 26 octobre 2026, à faire relire
par un professeur d'anglais. **Les cinq lots sont faits** (alphabet du CI et du CP,
voix des lettres ; épellation, pluriel et possessifs du CE1 ; nombres de 20 à
100 et école du CE2 ; loisirs et « il y a » du CM1 ; ordre du CM2) : voir les
sections 9 à 13. Il reste à générer les paliers en production, à écouter la voix
des lettres et à faire relire le tout (section 14). Le programme est dans `convex/programme/anglais.ts`
(51 thématiques, 145 paliers depuis le lot 4 ; 38 et 109 au départ).

## 1. Ce qui ne va pas aujourd'hui

1. **Le programme commence par des formules, pas par les lettres.** La
   première thématique du CI est « Hello! Goodbye! » (hello, hi, goodbye,
   good morning, please, thank you, sorry). Le CP commence par la famille.
   L'alphabet n'est enseigné nulle part : aucune thématique ne contient le
   mot « alphabet » ni les noms des lettres.
2. **Sans les lettres, l'enfant ne peut ni lire une option ni épeler.** Le
   B-A-BA de l'anglais est absent, alors que tous les exercices suivants
   reposent sur des mots écrits.
3. **Des notions arrivent trop tôt ou sans préparation.** Le pluriel en -s
   apparaît pour la première fois au CE2 (dans « have got »). Les possessifs
   (my, your, his, her) ne sont jamais enseignés seuls. « There is / there
   are » manque, alors que le CM2 demande son chemin en ville. L'école et les
   loisirs n'existent pas.
4. **Le CM2 vise plus haut que la référence française.** Le programme
   officiel français fixe A1 en fin de CM2. Le nôtre vise A2 avec le passé
   irrégulier et les comparatifs, sans passerelle claire.

## 2. Sources consultées

- Programmes 2015 de langues vivantes (cycles 2 et 3, France), repères de
  progressivité de l'académie de Rennes :
  [PDF](https://pedagogie.ac-rennes.fr/sites/pedagogie.ac-rennes.fr/IMG/pdf/reperes_de_progressivite_lve_de_cycles_2_et_3_anglais_cls28fev2018.pdf).
  À retenir : au cycle 2 (CP à CE2) on travaille d'abord l'oral ; la
  prononciation des lettres de l'alphabet et « Can you spell it? » sont des
  attendus du cycle 2 ; l'écrit prend sa place au cycle 3 ; niveau visé en fin
  de CM2 : A1 au moins dans les cinq activités langagières.
- Cambridge English, listes de mots Pre A1 Starters, A1 Movers, A2 Flyers
  (enfants de 6 à 12 ans) :
  [liste Starters](https://www.cambridgeenglish.org/images/351849-pre-a1-starters-word-list-2018.pdf).
  Les thèmes Starters : animaux, corps, vêtements, couleurs, famille,
  nourriture, maison, nombres, lieux, école, sports, temps, jouets,
  transports, métiers.
- Ministère de l'Éducation d'Israël, niveau « pré-fondation » en anglais
  langue étrangère
  ([PDF](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/prefoundationcando.pdf)) :
  la priorité des premières années est la littératie de base (sons de la
  langue, lettres et sons, lecture de mots, orthographe), avec l'oral d'abord.
- Sénégal : l'anglais entre à l'école élémentaire depuis la phase pilote de
  2024-2025, en commençant par les CM1 et CM2
  ([allAfrica](https://fr.allafrica.com/stories/202409200332.html),
  [Le360](https://afrique.le360.ma/culture/good-morning-des-la-maternelle-lecole-senegalaise-booste-son-anglais_JTPDFYZZGNECVF6BDTMKRMUQAU/)).
  Je n'ai pas trouvé le texte officiel du programme sénégalais : il faut le
  demander à la Direction de l'enseignement élémentaire pour s'y aligner.

Limite honnête : aucune de ces sources ne dit « l'alphabet avant les
salutations ». Les programmes français placent les salutations très tôt, à
l'oral, avec un enseignant qui parle. Notre cas est différent : l'enfant est
seul devant un écran et doit lire des options. L'alphabet d'abord est donc
un choix pédagogique cohérent avec la demande du propriétaire, pas une règle
officielle.

## 3. Principes du programme

1. **Les lettres d'abord.** Noms des lettres, puis sons initiaux, puis mots,
   puis phrases, puis petits textes. Aucun exercice ne demande de lire un mot
   dont l'enfant n'a pas vu les lettres.
2. **L'oral avant l'écrit.** L'application a une voix anglaise pour les tuiles
   du CI et du CP (`docs/voix-des-tuiles.md`). Elle sert d'abord à entendre
   les noms des lettres. Au CI, rien ne se lit : voix et image.
3. **Des blocs mémorisés avant la grammaire.** « This is my mother », « I
   like rice » s'apprennent comme des blocs. Le mot « verbe » n'apparaît qu'à
   partir du CE2.
4. **Une seule nouveauté à la fois, et on recycle.** Chaque thématique
   réutilise les mots des précédentes. Les lettres reviennent sous forme de
   mots (CI), d'épellation (CP, CE1) et de dictée (CE2).
5. **Les images pour les petits.** En CI (6 ans), chaque tuile qui nomme une
   chose montre son image et garde son nom (règle permanente du projet,
   `AGENTS.md`). Les mots des lettres doivent être dans le catalogue
   `lib/item-images.ts`, sinon on fabrique l'image d'abord.
6. **Les erreurs des francophones sont les mauvaises options.** Voir la
   section 6.
7. **Des consignes en français,** de l'anglais seulement dans ce qu'on apprend
   (règle actuelle, inchangée).
8. **Un anglais britannique,** cohérent dans tout un palier (règle actuelle).

## 4. Niveaux visés

| Classe | Âge | CECRL | Ce que l'enfant sait faire à la fin de l'année |
| --- | --- | --- | --- |
| CI | 6 ans | pré-A1 | Reconnaître à l'oreille les lettres, 10 nombres, des couleurs, des animaux, des fruits. Dire bonjour et merci. |
| CP | 7 ans | pré-A1 | Nommer et reconnaître les 26 lettres, trouver la lettre d'un mot connu, épeler son prénom, comprendre « This is my … », « I like … ». |
| CE1 | 8 ans | pré-A1 vers A1 | Épeler des mots, se présenter, dire un pluriel, un possessif, ce qu'il aime, comprendre les ordres de la classe. |
| CE2 | 9 ans | A1 | Phrases avec be, have got, can ; nombres jusqu'à 100 ; maison, mois, météo, heure, école. |
| CM1 | 10 ans | A1 fin | Présent simple, présent continu, routine, métiers, prix, description, « there is / there are », loisirs. |
| CM2 | 11 ans | A1+ avec premiers pas en A2 | Poser des questions, demander son chemin, comparer, raconter hier, dire demain, lire un texte de 3 à 5 phrases. |

Le CM2 reste plus ambitieux que la France (A1 en fin de CM2). Je propose de
l'afficher « A1+ avec premiers pas en A2 » et de limiter le passé irrégulier
à la liste fermée de 10 verbes déjà prévue.

## 5. Le programme, classe par classe

« Existant » : la thématique existe déjà, son contenu reste. « Déplacé » :
elle change de rang ou de classe. « Nouveau » : à écrire. Les paliers
proposés suivent la règle actuelle (2 à 4 par thématique).

### CI (6 ans), 8 thématiques, pré-A1, tout à l'oral et à l'image

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | L'alphabet, de A à I | Noms des lettres A à I, entendus avec la voix anglaise. Majuscule et minuscule. Un mot-image par lettre (A apple, B banana, C cat, D dog, E egg, F fish, G goat, H hat, I ice cream). Pas de phrase. 2 paliers. | Nouveau |
| 2 | L'alphabet, de J à R | J juice, K kite, L lion, M mango, N nose, O orange, P pen, Q queen, R rice. Suite des lettres, lettre manquante dans la suite. 2 paliers. | Nouveau |
| 3 | L'alphabet, de S à Z | S sun, T tree, U umbrella, V van, W water, X box (le X se dit en fin de mot), Y yellow, Z zebra. Chanson de l'alphabet en entier (A à Z). 2 paliers. | Nouveau |
| 4 | Hello! Goodbye! | hello, hi, goodbye, bye, good morning, good night, please, thank you, sorry, yes, no. « I am Awa. » | Existant, déplacé du rang 1 au rang 4 |
| 5 | Les couleurs | red, blue, yellow, green, orange, black, white, pink, brown, purple. | Existant |
| 6 | Compter jusqu'à 10 | zero à ten. | Existant |
| 7 | Les animaux | dog, cat, bird, fish, cow, goat, sheep, horse, chicken, monkey, lion, elephant. | Existant |
| 8 | Les fruits | mango, banana, orange, apple, lemon, watermelon, pineapple. Dernier palier : la première lettre de chaque fruit et de chaque animal vu. | Existant, un palier de rappel des lettres ajouté |

### CP (7 ans), 8 thématiques, pré-A1, lettres puis mots lus

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | L'alphabet de A à Z | Les 26 noms de lettres, majuscule et minuscule, lettre avant et après, lettre manquante, ordre alphabétique de 3 mots. 3 paliers. | Nouveau |
| 2 | Les premiers sons | Première lettre d'un mot connu (les 26 mots-images du CI). Les voyelles a, e, i, o, u contre les autres lettres. Lire un mot de 3 lettres (cat, dog, sun, pen, hat) en choisissant son image. 3 paliers. | Nouveau |
| 3 | Je me présente | « Hello! I am Awa. », « My name is Awa. », « Can you spell it? / A-W-A. » (l'âge, « How old are you? », reste avec les nombres du rang 4) L'enfant épelle un prénom, choisit la bonne épellation. 3 paliers. | Nouveau |
| 4 | Les nombres de 0 à 20 | zero à twenty. « How old are you? » | Existant |
| 5 | Ma famille | mother, father, brother, sister, grandmother, grandfather, baby, friend. « This is my mother. » | Existant |
| 6 | Mon corps | head, hair, eye, ear, nose, mouth, hand, finger, arm, leg, foot. « Touch your nose. » | Existant |
| 7 | Dans ma classe | book, pen, pencil, bag, ruler, desk, chair, board, door, window. « It is a book. » « What is it? » Rappel de please et thank you. | Existant |
| 8 | Manger et boire | rice, fish, bread, milk, water, egg, chicken, tea, juice. « I like rice. » | Existant |

Dans le nouveau CP, rien de plus long qu'un mot n'est lu avant la
thématique 3. Les salutations du CI sont reprises avec la lecture, mais
jamais avant l'alphabet.

### CE1 (8 ans), 9 thématiques, du pré-A1 vers A1

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | Épeler des mots | Épeler 12 mots connus, sans lettre répétée (cat, dog, red, sun, rice, milk, blue, fish, mango, house, lemon, horse). Consonnes et voyelles. Remettre des lettres dans l'ordre. Écrire le mot qu'on entend épeler. 3 paliers. | Nouveau |
| 2 | Se présenter | « What is your name? », « How are you? », « How old are you? », « Where are you from? » Pays : Senegal, Mali, Guinea, Gambia, France. | Existant |
| 3 | Les jours de la semaine | Monday à Sunday, today, tomorrow. | Existant |
| 4 | A ou an ? | a devant une consonne, an devant une voyelle. | Existant |
| 5 | Un ou plusieurs ? | Pluriel en -s (cat, cats), de one à ten. Exceptions : fish, sheep, children, men, women. « Two books. » | Nouveau |
| 6 | Mon, ton, son | my, your, his, her. « This is my bag. », « That is her pen. », « Whose bag is it? » Avec la famille et la classe. | Nouveau |
| 7 | Les vêtements | T-shirt, shirt, trousers, skirt, dress, shoes, socks, hat, cap, boubou. Couleur avant le nom. | Existant |
| 8 | J'aime, je n'aime pas | I like, I do not like, Do you like … ? | Existant |
| 9 | Les ordres de la classe | stand up, sit down, open your book, close your book, look, listen, write, read, come here, be quiet, please. | Existant |

### CE2 (9 ans), 9 thématiques, A1

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | Les nombres de 20 à 100 | twenty à one hundred par dizaines, puis twenty-one à ninety-nine. Écrire en lettres. | Nouveau |
| 2 | Être : am, is, are | I am, you are, he is… Négation, question, réponse courte. | Existant |
| 3 | J'ai : have got, has got | Famille, animaux, objets de la classe. | Existant |
| 4 | Je peux, je sais : can | run, jump, swim, sing, dance, read, write, draw, cook, climb. | Existant |
| 5 | La maison et où c'est | house, kitchen, bedroom… in, on, under, next to, behind, in front of. « the » introduit. | Existant |
| 6 | Les mois de l'année | January à December, « My birthday is in May. » | Existant |
| 7 | Le temps qu'il fait | sunny, rainy, windy, cloudy, hot, cold, dry season, rainy season. | Existant |
| 8 | L'heure en anglais | o'clock, half past. | Existant |
| 9 | L'école et mon emploi du temps | French, Maths, English, Science, Art, Music, PE ; « I have Maths on Monday. », « What is your favourite subject? » Réutilise jours, heure, have. | Nouveau |

### CM1 (10 ans), 9 thématiques, A1 fin

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | Ce que je fais : le présent | I, you, we, they ; adverbes de fréquence. | Existant |
| 2 | He, she, it : le s du verbe | -s, -es, has ; does not. | Existant |
| 3 | Ma journée | Routine, at et in. | Existant |
| 4 | En ce moment : le -ing | am, is, are + verbe en -ing. | Existant |
| 5 | Mes loisirs | football, basketball, swimming, reading, drawing, dancing, music ; « I like playing football. », « What do you do on Saturday? » | Nouveau |
| 6 | Les métiers | teacher, doctor, nurse, farmer, fisherman, driver, tailor, trader, police officer, student. | Existant |
| 7 | Au marché | Nombres jusqu'à 1 000, prix en francs, pluriels. | Existant |
| 8 | Décrire une personne ou un objet | Adjectifs avant le nom, cheveux, yeux. | Existant |
| 9 | Il y a : there is, there are | « There is a market in my town. », « There are two mosques. », « Is there a bank? / Yes, there is. » Lieux : school, market, mosque, hospital, shop, bank, post office, bus station. Prépare les itinéraires du CM2. | Nouveau |

### CM2 (11 ans), 8 thématiques, A1+ avec premiers pas en A2

| # | Thématique | Contenu fermé | Statut |
| --- | --- | --- | --- |
| 1 | Poser des questions | what, where, who, when, why, how, how many, how much ; because. | Existant, déplacé du rang 7 au rang 1 |
| 2 | Demander son chemin | Go straight on, turn left, turn right, next to, opposite, between. | Existant, déplacé du rang 6 au rang 2 |
| 3 | Comparer | taller, the tallest, more beautiful, better, the best. | Existant, déplacé du rang 5 au rang 3 |
| 4 | Hier : was et were | Passé de be. | Existant, rang 4 |
| 5 | Raconter hier : verbes en -ed | Passé régulier, did not, Did you … ? | Existant |
| 6 | Raconter hier : verbes irréguliers | Liste fermée de 10 verbes. | Existant |
| 7 | Demain : être going to | going to + verbe. | Existant |
| 8 | Lire un petit texte | Textes de 3 à 5 phrases, vrai ou faux, dialogue à remettre dans l'ordre. Bilan de tout le programme. | Existant, reste en dernier |

Le CM2 passe donc du présent (questions, chemin, comparaison) au passé, puis
au futur, et finit par un bilan de lecture.

## 6. Pièges des francophones à garder dans les mauvaises options

| Piège | Où il apparaît |
| --- | --- |
| Les noms des lettres anglaises ne sont pas les noms français : A se dit « eï », E « i », G « djî », I « aï », J « djeï », K « keï », R « ar », U « you », W « double-you », Y « waï », Z « zèd ». | CI et CP, alphabet |
| Le h de hello, hat, house se prononce. | CI, CP, CE2 |
| Le s final de cats est un pluriel, mais le s de bus, yes, dress n'en est pas un. | CE1 |
| « I have 8 years » pour « I am 8 ». | CP, CE1 |
| L'adjectif avant le nom : « a red dress ». | CE1, CM1 |
| « He have », « She cans ». | CE2, CM1 |
| « Did you played », « more taller ». | CM2 |
| Faux amis : library (bibliothèque), actually, sensible. | À placer dans « Lire un petit texte » |

## 7. Ce que ça change dans le code

1. **Réordonner et ajouter** dans `convex/programme/anglais.ts`. Treize
   thématiques nouvelles (3 au CI, 3 au CP, 3 au CE1, 2 au CE2, 2 au CM1),
   ce qui porte le total à 51 thématiques. Déplacements : « Hello! Goodbye! »
   du rang 1 au rang 4 au CI ; trois thématiques du CM2.
2. **Fabriquer les exercices par le code,** comme pour les autres
   thématiques d'anglais : `paliers/games/anglaisCi.ts` (alphabet CI),
   `paliers/games/anglais.ts` (alphabet, sons, prénom au CP), et les fichiers
   du CE1, du CE2 et du CM1. Chaque lot suit le schéma habituel : tests avec
   leurs propres tables, mutations, relecture de chaque nouvelle ligne.
3. **Images du catalogue.** Vérifier que les 26 mots-images de l'alphabet sont
   dans `lib/item-images.ts`. Fabriquer d'abord les manquants (studio,
   `scripts/build-item-images.mjs`), puis écrire le contenu.
4. **Voix anglaise.** Elle couvre le CI et le CP. Les noms de lettres sont à
   préchauffer (26 lettres, un fichier de cache). À étendre au CE1 et au-delà
   pour les exercices d'écoute (« écoute et choisis ») qui manquent à tout le
   programme.
5. **Données en production.** Les thématiques existantes gardent leur clé
   (`an-ci-hello`…). Le rang change, pas le contenu. Avant tout déploiement,
   comparer le registre de la production avec l'arbre local.
6. **Ordre de livraison conseillé.** Lot 1 : alphabet du CI et du CP
   (6 thématiques, les plus urgentes). Lot 2 : épeler au CE1 et la reprise du
   rang des salutations. Lot 3 : pluriel, possessifs, nombres 20 à 100.
   Lot 4 : école, loisirs, there is. Lot 5 : réordonner le CM2.

## 8. Décisions à prendre

1. L'alphabet au CI : oui (oral, trois thématiques), ou seulement au CP ?
   Risque au CI : les enfants apprennent en même temps le nom des lettres en
   français, et les noms diffèrent. Mon avis : oui, à l'oral et avec la
   chanson, mais sans écriture.
2. Le CM2 affiché en A1+ au lieu de A2.
3. Treize thématiques nouvelles, soit environ 35 paliers de plus. Faut-il
   tout faire, ou commencer par le lot 1 seul ?
4. Qui relit : un professeur d'anglais, et la Direction de l'enseignement
   élémentaire pour le programme sénégalais.

## 9. Lot 1 : ce qui est fait (26 octobre 2026)

- **Programme.** `an-ci-abc-1`, `an-ci-abc-2`, `an-ci-abc-3` ouvrent le CI ;
  `an-cp-abc`, `an-cp-sounds`, `an-cp-name` ouvrent le CP. « Hello! Goodbye! »
  est le quatrième du CI. Rien d'une salutation n'est écrit dans une thématique
  d'alphabet (un test le tient).
- **Gabarits** (`convex/paliers/games/anglaisAlphabet.ts`, douze jeux `abc-*`,
  tous fabriqués par le code, aucun appel au modèle) : le mot d'un dessin, la
  lettre reliée à son mot, « B is for ___. », les lettres dans l'ordre, la
  lettre qui manque, grande et petite lettre, la première lettre d'un mot,
  voyelles et consonnes, mots de trois lettres, ordre alphabétique, prénom
  épelé (deux jeux). La plage de lettres vient de `vocabulary` dans la fiche.
- **Voix.** Les noms de lettres se disent en anglais (`englishLetters` dans
  `convex/voice/tiles.ts`, voir `docs/voix-des-tuiles.md`). Aucune lettre ne
  figure dans un énoncé : la voix française les dirait « à la française ».
- **Tests.** `convex/__tests__/alphabetEnglishTemplates.test.ts` : un
  vérificateur par jeu avec ses propres tables, des mutations, l'énoncé sans
  lettre ni mot anglais, les émojis d'Unicode 11 au plus, le contrôleur sans
  défaut, les 26 lettres couvertes au CI, la voix.
- **Choix à relire.** `queen` est montré par 👸 (la princesse : il n'existe pas
  d'émoji « reine » d'Unicode 11) ; `yam` par 🍠 (la patate douce) ; `jeans`
  pour J et `pig` pour P, faute d'émoji sûr pour le jus et le stylo. Le X n'a
  pas de mot (box le finit).
- **Reste à faire avant de montrer aux élèves.** Écouter les 26 noms de
  lettres avec la voix anglaise ; préchauffer les sons (`warmup` de la voix) ;
  régénérer les paliers des six thématiques en production (aucun palier
  n'existe encore pour elles) ; faire relire par un professeur d'anglais.

## 10. Lot 2 : ce qui est fait (26 octobre 2026)

- **Programme.** `an-ce1-spell` « Épeler des mots », trois paliers, ouvre les
  thématiques d'anglais du CE1. Les douze mots, vus au CI et au CP, n'ont aucune
  lettre répétée (une tuile en double serait ambiguë à remettre dans l'ordre) :
  trois lettres au premier palier, quatre au deuxième, cinq au troisième.
- **Gabarits** (`convex/paliers/games/ce1AnglaisEpeler.ts`, sept jeux
  `ce1-en-sp-*`) : lettres à remettre dans l'ordre, mot à écrire, lettre qui
  manque, bonne écriture, mot relié à son épellation (C-A-T), trois ou cinq
  lettres, nombre de lettres. Une faute écrite n'est jamais un autre mot
  anglais (« cat » n'a pas « act » pour faute).
- **Tests.** `convex/__tests__/ce1AnglaisEpeler.test.ts`, même méthode que le
  lot 1. Le mot « Ordre des salutations » du lot 2 était déjà fait au lot 1.
- **Écart avec le plan.** Les mots « one, two, three » et « book, school » du
  plan sont remplacés par sun, fish, house, lemon, horse : aucun n'a de lettre
  répétée, et chacun a un dessin sûr.

## 11. Lot 3 : ce qui est fait (26 octobre 2026)

- **Programme.** Au CE1, `an-ce1-plural` « Un ou plusieurs ? » et
  `an-ce1-possessives` « Mon, ton, son » viennent après « A ou an ? » et avant
  les vêtements. Au CE2, `an-ce2-numbers-100` « Les nombres de 20 à 100 » ouvre
  les thématiques d'anglais. Chacune a trois paliers, tous fabriqués par le code.
- **Gabarits.** `ce1AnglaisGrammaire.ts` (douze jeux `ce1-en-pl-*` et
  `ce1-en-poss-*`) et `ce2AnglaisNombres.ts` (sept jeux `ce2-en-num-*`).
- **Choix de contenu.**
  - Pluriel : douze mots, quatre par palier ; `fish` et `sheep` (qui ne changent
    pas) sont au troisième palier seulement. Le nombre s'écrit en lettres et le
    dessin est répété autant de fois. Pas de `-es` (mangoes est au CM1).
  - Possessifs : l'énoncé NOMME le sujet (« Le mot va avec « he ». »), sinon
    « He is Omar. ___ dog is brown. » accepterait aussi « my ». Le français
    « son » est ambigu (his ou her) : il n'y en a jamais dans un énoncé.
  - Nombres : trois parts de neuf nombres (les dizaines, de 21 à 59, de 62 à 99).
    Les mauvais choix sont ceux des francophones : thirteen contre thirty,
    fourteen contre forty, les chiffres échangés (37 et 73).
- **Tests.** `convex/__tests__/ceAnglaisLot3Templates.test.ts`, avec un
  convertisseur de nombres écrit à part de celui du gabarit.
- **Écart avec le plan.** Les cases du glisser du pluriel s'appellent
  « Singulier » et « Pluriel », pas « Un seul » et « Plusieurs » : le contrôleur
  du CI prenait « Un seul » pour une chose sans image. Le plan citait aussi
  `children`, `men`, `women` comme exceptions ; ils sont laissés de côté, car ce
  sont des mots que l'enfant n'a jamais vus.
- **Plafond de thématiques.** Le test du programme limitait une matière à huit
  thématiques par classe ; il en accepte neuf, pour le CE1, le CE2 et le CM1.

## 12. Lot 4 : ce qui est fait (26 octobre 2026)

- **Programme.** Au CE2, `an-ce2-school` « L'école et mon emploi du temps »
  ferme la liste. Au CM1, `an-cm1-hobbies` « Mes loisirs » vient après le
  présent continu, et `an-cm1-there-is` « Il y a : there is, there are » ferme
  la liste (elle prépare les itinéraires du CM2). Trois paliers chacune, tous
  fabriqués par le code.
- **Gabarits.** `ce2AnglaisEcole.ts` (huit jeux `ce2-en-sc-*`),
  `cm1AnglaisLoisirs.ts` (sept jeux `cm1-hb-*`) et `cm1AnglaisIlYa.ts` (sept
  jeux `cm1-th-*`). Le préfixe `cm1-en-` est celui des six gabarits des autres
  thématiques du CM1 : un test les compte un par un, d'où `cm1-hb-` et `cm1-th-`.
- **Choix de contenu.**
  - École : sept matières avec un dessin chacune (📚 🔢 💬 🔬 🎨 🎵 ⚽), un emploi
    du temps de trois jours écrit dans l'énoncé (« lundi 🔢 · mardi 🎨 · jeudi ⚽ »).
    Une mauvaise réponse est toujours fausse d'après la rangée.
  - Loisirs : neuf loisirs, trois par palier ; `dance`, `swim` et `run` (le e
    tombe, la lettre double) sont au troisième palier. Les fautes sont celles
    des francophones : « I like play football », « I likes playing », « swiming ».
  - Il y a : sept lieux avec un dessin, plus le marché sans dessin ; la rue de
    trois dessins répond à « Is there a bank? ». « Yes, there are. » n'est jamais
    juste. Les formes longues (« there is not ») sont exigées.
- **Tests.** `convex/__tests__/ceAnglaisLot4Templates.test.ts`.
- **Défauts trouvés par les tests et corrigés.** Un indice qui écrivait la
  réponse (« les maths » est aussi « Maths ») ; une consigne qui nommait la
  réponse (« Écris is ou are » pour « are ») ; deux exercices à trou qui avaient
  le même énoncé et la même réponse (le dessin est maintenant dans l'énoncé).

## 13. Lot 5 : ce qui est fait (26 octobre 2026)

- **Programme.** Les huit thématiques du CM2 sont dans l'ordre du plan : les
  questions, le chemin, la comparaison (le présent), puis was et were, le passé
  régulier, le passé irrégulier (le passé), puis going to (le futur), et le texte à
  lire en dernier. Aucune clé, aucun contenu ni aucun nombre de paliers ne
  change : seul le rang change.
- **Garde-fou.** `convex/__tests__/anglaisProgrammeOrdre.test.ts` fixe l'ordre des
  51 thématiques, classe par classe. Il tient aussi les règles de lecture de haut
  en bas : l'alphabet avant « hello » ; les nombres jusqu'à 100 avant le marché ;
  le pluriel avant « have got » et « j'aime » ; « there is » avant les itinéraires ;
  le passé avant le futur. Modifier le plan sans modifier ce test le fait casser.
- **Totaux vérifiés par ce test.** 51 thématiques d'anglais, 145 paliers, 1 450
  exercices quand tout est généré (38, 109 et 1 090 au départ).

## 14. Ce qui reste avant de montrer l'anglais aux élèves

Le pas à pas, avec les commandes, les chiffres attendus et le retour en arrière, est dans `docs/mise-en-production-anglais-v2.md`. Il contient une étape que la première version de ce plan avait oubliée : le chargement du programme ne fait que créer les thématiques à la suite des autres, donc sans la remise en ordre (`programme/reorder:run`) l'alphabet viendrait **après** « Hello! Goodbye! » en production.

1. **Générer les paliers en production** pour les 13 thématiques nouvelles. Les
   paliers des thématiques existantes sont déjà générés ; leur rang a changé, pas
   leur contenu. Avant tout déploiement, comparer le registre de la production
   avec l'arbre local (une production peut être en avance sur la branche).
2. **Écouter la voix des lettres** : les 26 noms (`ay`, `eye`, `ar`, `ell`,
   `double you` sont les plus risqués), les prénoms épelés, « B is for ___. ».
   Puis préchauffer les sons (`warmTexts`) pour le CI et le CP.
3. **Relecture par un professeur d'anglais**, et par la Direction de
   l'enseignement élémentaire pour s'aligner sur le programme sénégalais.
4. **Images à revoir** : `queen` montré par la princesse 👸, `yam` par la patate
   douce 🍠 ; `jeans`, `pig` et `key` choisis faute d'émoji sûr pour le jus, le
   stylo et le cerf-volant.
5. **Voix au CE1 et au-delà** : elle s'arrête au CP. Les exercices d'écoute
   (« écoute et choisis ») manquent à tout le programme.

## 15. Test en vrai, sur un backend local (26 octobre 2026)

Ce qui a été joué : un backend Convex local anonyme (jamais la production ni le développement partagé), avec la base remise dans l'état d'avant la v2, puis la procédure de `docs/mise-en-production-anglais-v2.md`, puis les paliers dans un vrai navigateur (Chromium sans écran, format téléphone, un élève par classe).

| Étape | Résultat |
| --- | --- |
| `programme/seed:run` | 51 thématiques créées |
| Ancien état simulé | 38 thématiques dans l'ancien ordre, les 13 nouvelles à la suite : l'alphabet est au rang 39 à 41, « Hello! » au rang 1 |
| `programme/reorder:run` | 51 thématiques déplacées (`CI an-ci-abc-1 : 39 -> 1`), 51 rangs uniques, rejeu à `toMove: 0` |
| `paliers/pregen:run` | 145 paliers en quatre exécutions de 40, 0 échec, 0 dollar, aucun appel au modèle |
| Base | 145 paliers `cached` / `auto_ok`, 1 450 exercices `published`, dix par palier, aucun à relire |
| Voix, essai à blanc | 6 thématiques d'alphabet, CI et CP : 127 textes, 1 166 caractères, 0,35 dollar (0,82 avec les consignes) |
| Application | L'accueil du CI propose « Anglais · L'alphabet, de A à I » en premier. Les 13 thématiques sont jouées jusqu'au dernier palier : chaque réponse juste est acceptée, chaque palier est validé, le suivant s'ouvre, le serveur refuse un palier dont le précédent n'est pas validé |

Les types d'exercices rejoués avec la bonne réponse : choix, association, phrase à trous, ordre (par poignée), glisser-déposer (deux touchers), réponse écrite.

Ce que l'application demande à la voix, vu dans les échanges avec le serveur : les lettres seules (`C`, `H`, `B`), les mots (`apple`, `🍌 banana`), les phrases (`H is for ___.`, `D, E, ___, G`), les cases françaises (`Voyelles`, `Consonnes`).

**Ce que ce test ne prouve pas.** La voix : aucune clé ElevenLabs en local, donc aucun son n'a été synthétisé ni écouté. La production. L'application native (iPhone), le hors-ligne. Les défauts de mon script ont coûté du temps (réponse trop courte, flèches du clavier approximatives) : aucun n'était un défaut de l'application.

**Deux détails de l'interface vus sur les captures.**
- Au-dessus des lettres d'un exercice « Quelle lettre manque ? », l'écran affiche « Choisis le bon mot. » : le libellé de la phrase à trous est le même pour des mots et des lettres.
- Rien d'autre à signaler : lettres et mots lisibles, dessins affichés, cases bien nommées.

### Essai de la vraie voix (26 octobre 2026, après le test local)

Le propriétaire a fourni une clé ElevenLabs. Onze textes ont été synthétisés avec la voix par défaut du code (« Cyp », `eleven_multilingual_v2`, réglages de l'anglais) et relus par la reconnaissance vocale d'ElevenLabs. **Personne n'a encore écouté ces sons** : la relecture automatique est un indice, pas une preuve (elle écrit « Gee » pour `G`, « Oh » pour `O`, qui sont justes).

| Texte envoyé | Relu | Lecture |
| --- | --- | --- |
| `ay, bee, see, dee, ee, eff, jee, aitch, eye` | « A, B, C, D, E, F, G, H, I » | bon : une suite se dit bien |
| `bee`, `ell`, `double you`, `eye` | « B », « L », « W », « I » | bon |
| `bee is for banana` | « B is for banana » | bon |
| `ay` | « I, uh » | douteux |
| `ar` | « Uh » | douteux |
| `aitch` | « Aichi » | douteux |
| `ay, bee, ___, dee` | « AP, no, it's D » | mauvais : le trou `___` est mal dit |
| `eff, ay, tee, oh, you` | « F-I-T-O-U » | douteux (`ay`) |

À faire avant de payer tout le préchauffage : écouter `a-single-ay`, `r-single-ar`, `h-single-aitch`, `gap-seq` et `name-fatou`. Si un nom est mal dit, corriger `LETTER_NAMES` (`convex/voice/tiles.ts`). Piste pour le trou : dire « blank » à la place de `___` (« A, B, blank, D » est relu juste). Une autre écriture change la clé de cache audio, donc il faut la fixer avant le préchauffage.
