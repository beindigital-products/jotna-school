# Le programme du CI au CM2, et les jeux

Jotna School suit le programme officiel de l'élémentaire sénégalais, classé
matière par matière et classe par classe. Chaque thématique porte une
description du contenu officiel, que le modèle lit pour écrire les
exercices. Pour l'éducation artistique et une partie des mathématiques, des
jeux fabriqués par le code complètent les paliers : frises, dessin sur
quadrillage, écoute, atelier des couleurs.

Source : « Guide pédagogique des matières du CI au CM2 au Sénégal », la
synthèse du Curriculum de l'Éducation de Base (CEB) et des guides
pédagogiques par étape du MEN, établie le 9 octobre 2026.

## Les sept matières

L'éducation physique et sportive n'est pas servie : elle se pratique dans la
cour.

| Matière | Domaine du CEB | Thématiques |
| --- | --- | --- |
| Français | Langue et communication | 42 |
| Mathématiques | Mathématiques | 47 |
| Éveil scientifique | ESVS : IST et « Vivre dans son milieu » | 33 |
| Histoire | ESVS : Découverte du monde | 26 |
| Géographie | ESVS : Découverte du monde | 25 |
| Instruction civique | ESVS : « Vivre ensemble » | 25 |
| Éducation artistique | EPSA : arts plastiques, musique, arts scéniques | 31 |

229 thématiques, 919 paliers, 9 190 exercices quand tout est généré.

Le programme vit dans `convex/programme/`, un fichier par matière.
`convex/programme/index.ts` les rassemble ; les tests
(`convex/__tests__/programme.test.ts`) vérifient les clés, les classes, les
jeux et la longueur des descriptions. Le tableau complet est en fin de
document.

## Ce qui est proposé et non écrit dans le guide

Le guide attribue chaque palier à une classe pour le français seulement. Pour
le reste, il donne les contenus de l'étape (deux classes) en deux niveaux. La
répartition suivante est donc une proposition, à valider par un
pédagogue. Chaque description concernée le dit (« répartition proposée »).

- **Mathématiques** : l'étape 1 suit le guide (paliers 1 à 3 au CI, 4 à 6
  au CP). Aux étapes 2 et 3, les contenus sont répartis selon la règle du
  CEB : acquisition en première année, consolidation en seconde. Par
  exemple, les nombres jusqu'à 10 000 au CE1 (cahier officiel de CE1),
  jusqu'à 100 000 au CE2.
- **Éveil scientifique, histoire, géographie, instruction civique,
  éducation artistique** : le niveau 1 (paliers 1-2) va en première année
  d'étape (CI, CE1, CM1), le niveau 2 (paliers 3-4) en seconde (CP, CE2,
  CM2). À l'étape 1, les repères communs sont partagés entre le CI et le CP.
- **Français au CM** : le guide ne dit pas quelle notion de grammaire ou
  quel mode revient au CM1 ou au CM2. L'indicatif est placé au CM1, le
  conditionnel et le subjonctif au CM2.
- **« Vivre dans son milieu »** (santé, population, environnement) relève de
  l'Éducation au développement durable. Ses thématiques sont rangées en
  éveil scientifique, où elles se travaillent à l'école.
- **L'éducation religieuse**, rubrique de « Vivre ensemble », n'est pas
  traitée : elle relève de chaque famille et de chaque école. Le module
  « Arabe & Coran » reste un module que l'école active.

## Charger le programme en base

Le chargement est une mutation interne, lancée depuis un terminal, avec la
même garde que la pré-génération :

```bash
# Ce qui serait fait, sans rien écrire
npx convex run programme/seed:run '{"confirmDeployment":"<nom>","dryRun":true}'

# Le faire
npx convex run programme/seed:run '{"confirmDeployment":"<nom>"}'
```

Les règles (`convex/programme/seedPlan.ts`, testées dans
`convex/__tests__/programmeSeed.test.ts`) :

1. **Une matière n'est jamais doublée.** Elle est cherchée par son nom, puis
   par ses anciens noms. Trouvée sous un ancien nom et vide, elle prend le
   nouveau nom : « Sciences » devient « Éveil scientifique »,
   « Histoire-Géographie » devient « Histoire », « EMC » devient
   « Instruction civique », « Arts plastiques » devient « Éducation
   artistique ». « Géographie » est créée.
2. **Une thématique chargée n'est jamais rechargée** : elle porte sa clé
   (`topics.programmeKey`), même renommée par un administrateur. Relancer
   le chargement ne crée aucun doublon.
3. **Une classe garnie à la main est laissée telle quelle** (mode `fill`,
   le défaut). C'est le cas des mathématiques et du français sur la base
   de développement : leurs thématiques actuelles sont gardées. Le mode
   `merge` (`"mode":"merge"`) ajoute quand même les thématiques du
   programme qui manquent. Il adopte celles qui portent déjà le même nom :
   elles reçoivent leur clé, donc leurs jeux.
4. **Rien n'est supprimé.** Le rapport liste les matières vides devenues
   inutiles (`emptyLeftovers`, par exemple « Éducation musicale »). On les
   supprime depuis l'administration.

On peut charger une partie seulement :
`"subjects":["histoire","geographie"]`.

Ensuite, la pré-génération remplit les paliers avant l'arrivée des élèves
(`docs/paliers-et-exercices.md`). Pour les cinq matières nouvelles, cela fait
562 paliers. 556 appellent le modèle, soit moins d'un dollar au coût
mesuré. Les deux thématiques tout en jeux ne coûtent rien.

## La génération d'un palier

- **La description de la thématique** est transmise au modèle comme
  « contenu officiel visé » (`paliers/prompts.ts`). Avant, il ne lisait que
  le nom.
- **Des règles par matière.** Pour l'histoire, la géographie, l'éveil
  scientifique, l'instruction civique et l'éducation artistique, le modèle
  ne doit inventer aucun fait, aucune date, aucun nom. En français,
  l'orthographe doit être irréprochable. Au CI et au CP, les options
  doivent se reconnaître sans lire (émoji, nombre, syllabe), puisque seule
  la consigne est lue à voix haute. Les anciens noms de matières
  (« Sciences », « EMC »…) reçoivent les mêmes règles.
- **Les jeux de la thématique** sont fabriqués par le code
  (`paliers/games`) et mêlés aux exercices du modèle, qui n'en écrit que le
  reste. Une thématique tout en jeux n'appelle pas le modèle.
- **Un jeu raté se refait par le code** : même jeu, même niveau, autre
  graine. Le modèle ne reçoit que les exercices qu'il a écrits.

## Les nouveaux types d'exercices

La liste des types vit dans `convex/exerciseTypes.ts`. La correction et la
vue sans réponse, partagées par le serveur et l'application hors ligne, sont
dans `convex/paliers/exerciseRules.ts`. Les formes des payloads sont dans
`convex/paliers/games/types.ts`.

| Type | L'enfant… | Écrit par |
| --- | --- | --- |
| `fill-blank` (phrase à trous) | touche un trou, puis le mot qui va dedans (1 à 3 trous) | le modèle |
| `pattern` (frise) | complète une frise ou une suite avec les bons jetons | le code |
| `pixel-art` (dessin sur quadrillage) | peint des cases au doigt : reproduire, de mémoire, symétrie, coloriage magique | le code |
| `listen` (écoute) | écoute des sons synthétisés, puis choisit | le code |
| `color-mix` (atelier des couleurs) | touche un pot, prévoit un mélange, ou retrouve les deux pots d'un mélange | le code |

Les sons de l'écoute sont synthétisés par l'appareil (`lib/sounds/synth.ts`).
Il n'y a aucun fichier à télécharger, et tout fonctionne sans réseau. Les
motifs du dessin (baobab, case, djembé, drapeau du Sénégal, papillon,
rosace…) sont dessinés à la main dans `paliers/games/pixel.ts`. Les tests
vérifient leurs couleurs et leur symétrie. Sur un téléphone, l'écran du
dessin tient sans défiler, « Valider » compris : les cases prennent la place
libre, entre 26 et 44 px (`components/exercises/pixel-grid-fit.ts`).

Dans l'administration, ces types s'éditent par leur JSON, avec un exemple de
départ. L'aperçu montre l'écran de l'enfant, jouable, et dit si la réponse
donnée est juste.

## Les jeux

| Jeu (clé) | Type | Ce qu'il exerce |
| --- | --- | --- |
| `frise-couleurs`, `frise-formes`, `frise-objets` | frise | motifs, guirlandes, sériation |
| `frise-rythme` | frise | un rythme écrit (tam-tam, frappé, silence) |
| `suite-nombres` | frise | les suites de nombres, avec les nombres de la classe |
| `pixel-copie` | dessin | reproduire un modèle |
| `pixel-memoire` | dessin | dessin de mémoire, le modèle se cache |
| `pixel-symetrie` | dessin | symétrie par rapport à un axe, pliage |
| `coloriage-magique` | dessin | colorier en suivant une légende |
| `ecoute-hauteur`, `ecoute-duree`, `ecoute-intensite` | écoute | grave/aigu, long/court, fort/doux |
| `ecoute-rythme`, `ecoute-motif-rythmique` | écoute | compter les coups, reconnaître un rythme |
| `ecoute-melodie`, `ecoute-pareil` | écoute | mélodie qui monte ou descend, pareil ou différent |
| `couleurs-reconnaitre`, `couleurs-chaudes-froides` | couleurs | nommer et classer les couleurs |
| `couleurs-melange`, `couleurs-melange-inverse` | couleurs | les mélanges de couleurs |

La difficulté suit l'âge de la classe et la place du palier dans la
thématique (découverte, consolidation, approfondissement, maîtrise). Le
groupe d'une frise s'allonge. Le modèle de mémoire reste moins longtemps
visible. Les deux sons à comparer se rapprochent, et les mélanges au blanc
arrivent plus tard.

## Ajouter une thématique ou un jeu

- **Une thématique** : l'ajouter au fichier de sa matière dans
  `convex/programme/`, avec une clé neuve (`hi-cm2-…`), puis relancer le
  chargement. Une clé déjà chargée ne se change plus.
- **Des jeux dans une thématique** : son champ `games`
  (`{ kind, count }`, dix exercices au plus par palier). La génération lit
  la fiche par sa clé : aucun rechargement n'est nécessaire.
- **Un nouveau jeu** : une fonction dans `convex/paliers/games/`, déclarée
  dans `GAME_KINDS` (`games/index.ts`). Les tests de
  `convex/__tests__/games.test.ts` le jouent alors à tous les niveaux et dans
  toutes les classes.

## Le programme, classe par classe

🎮 : la thématique mêle des jeux à ses paliers (nombre par palier).

### Français

*Langue et communication*

| Classe | Thématiques |
| --- | --- |
| CI | Bonjour, merci, s'il te plaît · Les sons a, i, o, l, t · Les sons n, e, p, d, m, b · Les sons f, u, ou, é, è · Les sons s, r, au, eau, on, om · Les lettres et les mots · Mes premières phrases |
| CP | Je lis des syllabes et des mots · Inviter et conseiller · Raconter une histoire · Décrire et comparer · Les consignes · J'écris des phrases |
| CE1 | La phrase, le verbe et le sujet · Le nom, l'article et l'adjectif · Le présent et le passé composé · L'impératif et le futur · a/à, et/est, on/ont · Le dictionnaire et les mots de liaison · Lire et comprendre |
| CE2 | COD, COI et pronoms · Les compléments circonstanciels · Possessifs et démonstratifs · L'imparfait et le passé composé · L'impératif et le futur simple · Féminin, pluriel, ou/où, son/sont · Synonymes, familles, homonymes · Lire une lettre, une affiche, un poème |
| CM1 | Comprendre un récit et une description · Les textes qui expliquent et qui informent · Nature et fonction des mots · Les temps de l'indicatif · Les accords · Préfixes, suffixes et sens des mots · Les homophones grammaticaux |
| CM2 | Lire pour s'informer et comprendre · Donner son avis · Le dialogue · La poésie · Conditionnel et subjonctif · La phrase complexe · Révisions du CFEE |

### Mathématiques

*Mathématiques*

| Classe | Thématiques |
| --- | --- |
| CI | Trier et ranger 🎮 (2 × frise de formes, 2 × frise de couleurs) · Les nombres jusqu'à 10 🎮 (2 × suite de nombres) · Ajouter et enlever jusqu'à 10 · Les nombres de 11 à 20 🎮 (2 × suite de nombres) · Gauche, droite, dessus, dessous 🎮 (2 × reproduire un dessin) · Les formes et les solides 🎮 (2 × frise de formes) · Plus long, plus lourd, plus tard · Petits problèmes |
| CP | Les nombres jusqu'à 50 🎮 (2 × suite de nombres) · Additions et soustractions · Les nombres jusqu'à 100 🎮 (2 × suite de nombres) · Multiplier et partager · Lignes, frises et figures 🎮 (2 × reproduire un dessin, 2 × frise de formes) · Le mètre, le litre, le kilogramme · L'heure, le calendrier, la monnaie · Résoudre un problème |
| CE1 | Les nombres jusqu'à 1 000 🎮 (2 × suite de nombres) · Les nombres jusqu'à 10 000 🎮 (1 × suite de nombres) · Additions et soustractions · La multiplication et ses tables · Droites, angles et figures 🎮 (1 × reproduire un dessin) · Longueurs, masses, contenances · La monnaie et les durées · Résoudre des problèmes |
| CE2 | Les nombres jusqu'à 100 000 🎮 (1 × suite de nombres) · Multiplication et calcul mental · La division · La symétrie et les solides 🎮 (3 × symétrie) · Périmètres et aires · Mesures et conversions · Problèmes en plusieurs étapes |
| CM1 | Les grands nombres · Divisibilité et calcul mental · La division posée · Les fractions · Les nombres décimaux · Figures planes et constructions 🎮 (1 × reproduire un dessin) · Périmètres et aires · Longueurs, masses, capacités, durées |
| CM2 | Millions et milliards · Opérations sur les décimaux · Acheter, vendre, gagner · Partages et moyenne · Symétrie et translation 🎮 (3 × symétrie) · Solides et volumes · Vitesse, distance et durée · Problèmes du CFEE |

### Éveil scientifique

*Éducation à la science et à la vie sociale*

| Classe | Thématiques |
| --- | --- |
| CI | Naturel ou fabriqué ? · Les animaux autour de moi · Les plantes autour de moi · Mon corps et la propreté · Les outils de la maison et de l'école |
| CP | Solide, liquide ou gaz ? · Les êtres vivants grandissent · Bien manger · Les maladies du milieu · Protéger la nature |
| CE1 | Comment se nourrissent les êtres vivants · La respiration · Les substances autour de nous · L'eau potable · Les parasites et le paludisme · Les objets techniques simples |
| CE2 | Le corps humain · La vie des plantes · La vie des animaux · Le circuit électrique · Se protéger des maladies · L'environnement et la population |
| CM1 | La digestion · La respiration et ses maladies · Le cœur et le sang · Phénomènes physiques et chimiques · Démonter et assembler un objet · L'hygiène du milieu |
| CM2 | Vivre dans l'eau, vivre sur terre · Les appareils de la maison · Bien se nourrir pour bien grandir · Gérer et restaurer les ressources · La santé de la mère et de l'enfant |

### Histoire

*Éducation à la science et à la vie sociale*

| Classe | Thématiques |
| --- | --- |
| CI | Le matin, le midi, le soir · Avant, pendant, après · Hier, aujourd'hui, demain · Les jours de la semaine |
| CP | C'est long, c'est court · Souvent, parfois, jamais · Le calendrier · L'emploi du temps |
| CE1 | Le temps qui passe · L'histoire de ma famille · L'histoire de mon école · Mon quartier, mon village, ma commune |
| CE2 | Hier et aujourd'hui : le progrès · Les royaumes du Sénégal (1) · Les royaumes du Sénégal (2) · Les rois et leurs titres |
| CM1 | La préhistoire · Les royaumes avant les Européens · Les premiers contacts · Les résistants · Résister sans les armes |
| CM2 | Les grands empires · Grandes découvertes et traite négrière · La conquête coloniale · La marche vers l'indépendance · Les progrès des sciences et des techniques |

### Géographie

*Éducation à la science et à la vie sociale*

| Classe | Thématiques |
| --- | --- |
| CI | Devant, derrière, à côté · Ma droite et ma gauche · Les repères de mon école · Se repérer sur un quadrillage 🎮 (3 × reproduire un dessin) |
| CP | Le chemin de l'école · Près ou loin ? · Vu de dessus · Se repérer dans le quartier |
| CE1 | Les points cardinaux · Le climat et les saisons · Le relief et les cours d'eau · Le plan de la classe et de l'école |
| CE2 | Lire une carte · Ma région et les régions du Sénégal · Les activités des hommes · L'habitat et les déplacements |
| CM1 | Le Sénégal en Afrique de l'Ouest · Climats et végétation · Le découpage administratif · Ressources et activités économiques · Les voies de communication |
| CM2 | Le milieu et les activités · Protéger nos ressources · La population du Sénégal · Villes et campagnes |

### Instruction civique

*Éducation à la science et à la vie sociale*

| Classe | Thématiques |
| --- | --- |
| CI | Bonjour, merci, pardon · À l'école chaque jour · On s'entraide · Traverser la rue |
| CP | Le règlement de la classe · Mes responsabilités en classe · Filles et garçons, tous égaux · La sécurité sur la route · Régler un conflit sans se battre |
| CE1 | Les symboles de la Nation · Le civisme · Respecter les autorités · Nos différences, notre richesse |
| CE2 | Mes droits et mes devoirs · Vivre en paix · Les bonnes valeurs · La vie en communauté |
| CM1 | Prévenir les conflits par le dialogue · La coopérative et le gouvernement scolaire · La commune et l'État · Les organisations de mon quartier |
| CM2 | La République du Sénégal · Les institutions de la République · Les organisations africaines · Les organisations internationales |

### Éducation artistique

*Éducation physique, sportive et artistique*

| Classe | Thématiques |
| --- | --- |
| CI | Les couleurs 🎮 (4 × reconnaître une couleur, 2 × frise de couleurs) · Les formes 🎮 (3 × frise de formes, 3 × reproduire un dessin) · Frises et guirlandes 🎮 (3 × frise de couleurs, 3 × frise d'images, 2 × reproduire un dessin) · Grave ou aigu ? 🎮 (7 × grave ou aigu, 3 × la mélodie monte ou descend) · Long ou court, fort ou doux 🎮 (5 × long ou court, 5 × fort ou doux) · Mimes et émotions |
| CP | Mélanger les couleurs 🎮 (3 × mélanger deux couleurs, 3 × retrouver un mélange, 1 × reconnaître une couleur) · Les traits et les lignes 🎮 (4 × reproduire un dessin, 2 × frise de formes) · Décorer avec des motifs 🎮 (2 × frise d'images, 2 × frise de formes, 2 × dessin de mémoire, 1 × reproduire un dessin) · Comptines et rythmes 🎮 (4 × compter les coups, 3 × rythme écrit à compléter, 1 × grave ou aigu) · Jouer un rôle |
| CE1 | Dessiner et reproduire 🎮 (4 × reproduire un dessin, 2 × dessin de mémoire) · Plier, découper, coller 🎮 (4 × symétrie) · Les instruments du Sénégal · Écouter et comparer les sons 🎮 (3 × grave ou aigu, 3 × long ou court, 2 × fort ou doux) · Mimer les sentiments |
| CE2 | Le coloriage magique 🎮 (5 × coloriage magique, 3 × couleurs chaudes et froides) · Reproduire un modèle 🎮 (3 × reproduire un dessin, 2 × dessin de mémoire, 2 × symétrie) · Les mélodies 🎮 (4 × la mélodie monte ou descend, 4 × pareil ou différent) · L'hymne national et les chants 🎮 (2 × reconnaître un rythme) · Jouer une scène |
| CM1 | Le dessin de mémoire 🎮 (6 × dessin de mémoire, 1 × reproduire un dessin) · Frises et motifs 🎮 (2 × frise de formes, 2 × frise de couleurs, 1 × frise d'images, 2 × reproduire un dessin) · Percussions et cordes 🎮 (2 × compter les coups, 2 × reconnaître un rythme) · Les rythmes 🎮 (4 × reconnaître un rythme, 3 × rythme écrit à compléter, 1 × compter les coups) · Jouer la joie et la tristesse |
| CM2 | Rosaces et symétries 🎮 (5 × symétrie, 2 × coloriage magique) · Observer et illustrer 🎮 (2 × dessin de mémoire, 2 × reproduire un dessin) · Les instruments à vent 🎮 (2 × la mélodie monte ou descend, 2 × pareil ou différent) · Chanter et accompagner 🎮 (2 × fort ou doux, 2 × reconnaître un rythme, 2 × la mélodie monte ou descend) · La mise en scène |
