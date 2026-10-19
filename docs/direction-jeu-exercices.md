# Les exercices rejoignent le Monde de Pio : direction de jeu

Le propriétaire veut que les exercices soient un vrai jeu : une allure de jeu
vidéo, de la 3D, des animations, dans l'application iOS et Android comme sur
le web. Et il a fixé la règle : « garde la même DA ». Ce document fait donc
deux choses. Il extrait la direction artistique qui existe déjà dans
l'espace élève (le Monde de Pio), avec ses valeurs exactes, pour qu'on ne la
réinvente pas. Puis il dit comment la pousser au niveau d'un jeu dans la
séance d'exercices, et il décrit la boîte à outils construite pour cela
(`components/student/game-kit/`, montre dans `app/dev/kit`).

Le test de réussite : un enfant ou un parent qui connaît l'application
reconnaît la même marque au premier coup d'œil, en plus riche et plus
vivante. Rien ne doit ressembler à une autre application.

Les contraintes techniques (un seul code web, iOS et Android ; transform et
opacity seulement ; pas de WebGL ; Pio jamais animé par du code ; props des
écrans d'exercice inchangées) sont rappelées à la fin, elles ne se discutent
pas.

## 1. La DA qu'on garde

Tout ce qui suit est relevé dans le code de `main` au 18 octobre 2026 et vu
dans un vrai navigateur (vitrine, téléphone 390 × 844). Ce sont des faits,
pas des souhaits.

### Les couleurs

**La savane** (`app/globals.css`, jetons `--color-savanna-*`, utilisables en
classes `bg-savanna-sky`, etc.) :

| Jeton | Valeur | Emploi |
| --- | --- | --- |
| `savanna-sky` | `#7ec8f5` | le ciel, le haut des scènes |
| `savanna-sky-deep` | `#3aa0e8` | le ciel profond, les reflets d'eau |
| `savanna-sand` | `#f6c452` | le sable, le sol de la fin de palier validée |
| `savanna-sand-deep` | `#e9a83a` | le sable à l'ombre, les sentiers foulés |
| `savanna-sun` | `#ffb020` | le soleil, l'or |
| `savanna-leaf` | `#6ab04c` | l'herbe, les acacias, un confetti |
| `savanna-leaf-deep` | `#3f8a2f` | les feuillages lointains |
| `savanna-earth` | `#a5602c` | la terre, la planche des missions |
| `savanna-night` | `#1e2a4a` | la nuit (réservé) |

**La crème des cartes** : `#fff8e6` (Sentier perdu, missions), `#fff7e0`
(en-tête, barres, zone de l'encoche), `#fff1cc`. Les bordures des cartes
sont `amber-200` (`#fde68a`) en 2 px, `amber-200` en 4 px pour une grande
scène (`LostTrail`), `amber-300` pour un cadre d'alerte. Le texte des écrans
d'enfant est `amber-950` (`#451a03`) et `amber-900` (`#78350f`) ; les
sous-titres sont `amber-900/80` ou `/75`.

**Le fond de l'espace élève** (`app/(student)/layout.tsx`) :
`linear-gradient(180deg, #bfe6fb 0%, #f9efd2 45%, #f6dfa4 100%)`. Le ciel CSS
du camp (`savanna-backdrop.tsx`, `CssScene`) :
`linear-gradient(180deg, #5db9f2 0%, #9ddcfb 55%, #f7e2a6 100%)`, le soleil
`radial-gradient(circle, #fff7c2 0%, #ffd23f 45%, rgba(255,176,32,0) 72%)`,
le sol `linear-gradient(180deg, #f2c95e 0%, #e0a63d 100%)`, les collines
`#c78b4a/70` et `#b5773b/60`, les acacias `#3f8a2f` et `#4c9a3b` sur un tronc
`#7a4a23`, l'herbe `#6ab04c` et `#5da040`.

**Les boutons de jeu** (`game-button.tsx`, utilitaire `btn-chunky`) : cinq
teintes, chacune une face en dégradé vertical et une couleur de flanc.

| Teinte | Face (haut vers bas) | Flanc `--btn-depth` | Texte |
| --- | --- | --- | --- |
| orange (l'action) | `amber-400 #fbbf24` vers `orange-500 #f97316` | `#b45309` | blanc |
| green (la suite, la réussite) | `lime-400 #a3e635` vers `green-600 #16a34a` | `#166534` | blanc |
| sky (le secondaire) | `sky-300 #7dd3fc` vers `sky-500 #0ea5e9` | `#0369a1` | blanc |
| white (le neutre) | blanc | `#d6c39a` | `amber-900` |
| red (quitter) | `rose-400 #fb7185` vers `red-600 #dc2626` | `#991b1b` | blanc |

Les boutons des alertes de réponse (`answer-feedback.tsx`) réemploient la
face orange (`#b45309`) et une face crème `amber-50` vers `amber-200` avec un
flanc `#c9a35a`.

**Les options des exercices** (`QcmExercise.tsx`, `optionColors`, repris par
`MatchExercise`, `OrderExercise`) : six couleurs, dans cet ordre, bleu, rose,
ambre, vert, violet, sarcelle, chacune en 100 (fond), 300 (bordure), 800
(texte), 500 (pastille). Les mêmes six servent de teintes d'identité dans la
boîte à outils (`tones.ts`, `OPTION_SCALES`).

**Les scènes de réponse** (`answer-feedback.tsx`) : juste = cadre `lime-300`
sur `lime-100` vers `green-200`, texte `green-950`, halo
`rgba(190,242,100,0.35)` ; pas tout à fait = cadre `amber-300` sur `amber-50`
vers `orange-200`, texte `orange-950` ; plus d'essai = cadre `sky-200` sur
`sky-50` vers `sky-100`, texte `sky-950`. Les confettis :
`#f97316, #fbbf24, #6ab04c, #38bdf8, #ec4899`.

### Les polices

- **Fredoka** (`--font-display`, classe `font-display`, graisses 400 à 700,
  employée en `font-extrabold`) : tous les titres, boutons, bulles, pastilles
  et compteurs de l'espace élève. C'est la voix de Pio.
- **Poppins** (`--font-sans`, 300 à 800) : le corps de texte et, aujourd'hui,
  les consignes et options des exercices (c'est l'un des symptômes du
  diagnostic plus bas).
- **Amiri** (`--font-arabic`) : le module Arabe et Coran seulement.
- Tailles en usage : titre de lieu `text-3xl` (30 px), titre de carte
  `text-2xl` ou `text-xl`, bouton `lg` 18 px, bouton `md` 16 px, bulle de Pio
  16 à 18 px, compteur de HUD 12 à 14 px, consigne d'exercice 20 px (`text-xl`
  gras), option 18 px.

### Les formes

- Rayons : `rounded-2xl` (1 rem) pour un bouton ou une tuile, `rounded-3xl`
  (1,5 rem) pour une carte, `rounded-[2rem]` pour une grande scène (alerte de
  réponse, Sentier perdu, planche des missions, héros de fin de palier),
  `rounded-full` pour les pastilles, les cœurs, les médaillons.
- Bordures : 2 px blanches ou `amber-200` sur les cartes, 4 px sur les
  grandes scènes, 3 px blanc autour d'un badge de matière.
- Tailles tactiles : 44 px au minimum sur la carte (D15), 48 px pour un
  bouton `md`, 56 px pour un bouton `lg`.

### La profondeur et les ombres

- `btn-chunky` : face surélevée de **6 px** (`0 6px 0 0 var(--btn-depth)`),
  ombre portée `0 12px 20px -10px rgb(0 0 0 / 0.45)`. À l'appui :
  `translateY(5px)`, flanc `0 1px 0`, ombre `0 4px 10px -8px`, transition
  **90 ms ease-out** sur `transform` et `box-shadow`.
- Bulle de Pio : `0 8px 24px -10px rgba(0,0,0,0.35)`, queue de 20 px tournée
  vers lui.
- Alerte de réponse : halo de 10 px dans la teinte de la scène plus
  `0 30px 60px -20px rgba(0,0,0,0.5)` ; Pio y porte `drop-shadow` statique
  `0 12px 14px rgba(60,30,0,0.35)` (150 px) ou `0 16px 20px rgba(60,30,0,0.45)`
  (200 px), `0 18px 22px` au camp (272 px).
- Texte sur décor : `text-outline`, soit `0 1px 0 rgb(0 0 0 / 0.35), 0 2px 8px
  rgb(0 0 0 / 0.35)`.
- Médaillon de monde : `inset 0 -8px 16px rgba(0,0,0,0.25)` dans le disque,
  anneau de 6 px.

### Comment le Monde de Pio habille un écran

Le camp (`student/home`) : la savane peinte (ou en CSS sur un appareil
« lite »), un voile `amber-900/35` en bas pour la lisibilité, la bulle, Pio
grandeur nature, UN gros bouton orange, puis la planche de bois des missions
(`#c98240` vers `#a5602c`, grain en `repeating-linear-gradient`), puis les
médaillons de biomes. La carte : un sentier calculé, Pio qui marche (clip
vidéo), des plaques. La fin de palier : un héros ciel vers sable qui monte
sous l'encoche, le soleil derrière Pio, les étoiles qui se comptent. Le
Sentier perdu : un bout de carte au trésor en SVG, Pio à la loupe.

Les mouvements d'ambiance existants, tous coupés sous `prefers-reduced-motion`
par la classe `savanna-motion` : `sun-pulse` 6 s, `cloud-drift` 14 s,
`twinkle`, `float-slow` 6 px, `pop-in` 0,45 s (de 0,6 à 1,08 à 1),
`shake` 0,5 s (±8 px, ±1°), `star-burst` 0,9 s (120 px), `head-shake`,
`trail-dash`. Les ressorts framer-motion en usage : alerte de réponse
`stiffness 340, damping 22` ; Pio dans l'alerte `300 / 16` ; Sentier perdu
`260 / 22` ; héros de fin de palier `240 / 18` ; niveau `220 / 22`.

### Le ton

`lib/pioCopy.ts` et `lib/kidCopy.ts` : un enfant de six à onze ans, au
Sénégal, tutoyé, jamais grondé, toujours une suite. Pio parle court : « Bravo
! », « Presque ! », « Pas tout à fait… », « Regarde bien et réessaie. »,
« Encore 2 essais ». Pas d'émoji dans les phrases de Pio : la mascotte est là,
elle n'a pas besoin de cotillons. Les exercices gardent leurs phrases
d'erreur douces (« Cet exercice est cassé, on te le saute. Pas de souci, ça
ne te coûte rien. »).

### Pio

L'avatar officiel v4, huit poses de tous les jours (`idle`, `hello`, `cheer`,
`sad`, `amazed`, `encourage`, `think`, `sleep`, plus `walk`) et sa tenue
boubou pour l'arabe. Un clip vidéo en boucle par pose (HEVC alpha pour iOS,
VP9 pour Android), l'image fixe sous `prefers-reduced-motion` ou avec
`animated={false}`. **Aucune animation codée** : on le place, on le
dimensionne, on change sa pose. Ses tailles en usage : 272 px au camp, 200 px
en fin de palier, 150 px dans l'alerte de réponse, 140 px au passage de
niveau, 108 px au Sentier perdu, 112 px dans la scène de la question d'un
téléphone couché (`--stage-pio`, `session-stage.tsx`). Il réagit à
une réponse en changeant de pose : `cheer` (juste), `encourage` (pas tout à
fait), `sad` (plus d'essai, pose douce), `think` (il attend).

## 2. Diagnostic : pourquoi les exercices se lisent comme un formulaire

Captures « avant » (vitrine, téléphone) : `scratchpad/shots/avant/`.

1. **Pas d'épaisseur.** Les options sont des rectangles blancs à bordure
   `gray-200`, à plat sur une carte blanche à plat. Le seul objet épais de
   l'application, `btn-chunky`, n'entre jamais dans la séance.
2. **Pas la voix de Pio.** Consignes et options sont en Poppins ; la carte
   d'exercice ne contient ni Fredoka, ni crème, ni bordure ambre. Le titre
   de la séance est en Fredoka, puis la carte redevient un formulaire.
3. **Des couleurs étrangères.** Le bouton Valider est un dégradé orange vers
   rose (`from-orange-400 to-pink-500`), horizontal, sans flanc ; la barre de
   progression aussi. Les étiquettes à glisser et les anneaux de cible sont
   indigo. Le rose vif et l'indigo n'existent nulle part ailleurs dans le
   Monde de Pio.
4. **Le rouge de l'erreur.** Une option fausse passe en `red-100` bordée de
   `red-400` avec une croix rouge, alors que l'alerte de Pio, au même
   instant, dit « Presque ! » en ambre.
5. **Pas de scène.** La séance se joue sur le dégradé plat du layout ; aucun
   ciel, aucun sol, aucun soleil, pas de Pio pendant que l'enfant cherche. La
   récompense vient dans une alerte posée par-dessus, et disparaît.
6. **Une progression abstraite.** « Question 3/10 » en texte et une barre :
   un enfant de CI ne lit pas « 3/10 ». Les essais restants ne sont visibles
   que dans l'alerte d'erreur.
7. **Des gris.** Pastilles `gray-300`, textes `gray-900`, bordures `gray-200`
   : la palette d'un formulaire d'administration.

Le Monde de Pio, lui, se lit comme un jeu parce qu'il a une épaisseur (les
boutons), une matière (le bois, le sable, la crème), une lumière (le soleil,
les voiles), un personnage qui parle, une récompense qu'on voit compter. Ce
sont les exercices qui doivent rejoindre ce monde ; le monde ne change pas.

## 3. Comment pousser la DA sans la changer

### L'ambiance

Strictement celle du camp : un ciel `#7ec8f5` qui descend vers la crème des
cartes (`#bfe6fb`, `#f9efd2`, `#f6dfa4`), un soleil qui respire, deux
nuages, des collines ocre, deux acacias, le sable `#f2c95e` vers `#e0a63d`
et son herbe. Chaud, franc, jamais pastel délavé, jamais sombre. L'exercice
est posé sur le sable, comme une carte au trésor sur une table.

### La teinte d'accent par famille de gestes

Choisies parmi les teintes existantes (`tones.ts`, `GESTURE_ACCENT`),
contrastes vérifiés par `__tests__/tones.test.ts`.

| Famille de gestes | Écrans | Accent (pastilles, cibles, poignées) | Bouton d'action |
| --- | --- | --- | --- |
| choisir (toucher une tuile) | QCM, association | bleu d'option `#3b82f6` | orange |
| glisser (poser, ranger) | glisser-déposer, mise en ordre | ambre d'option `#f59e0b` | orange |
| écrire (taper, trous) | réponse courte, phrase à trous | violet d'option `#a855f7` | orange |
| écouter, dire | écoute, lecture | sarcelle `#14b8a6` | ciel |
| dessiner, colorier | pixel art, couleurs | rose d'option `#ec4899` | orange |

Une tuile au repos reste crème (blanc vers `#fff8e6`, flanc `#d6c39a`) :
seule sa pastille porte la couleur de son option, comme aujourd'hui. Choisie,
elle prend la teinte de son option (100 vers 200, flanc 500, texte 900).
Juste : `lime-200` vers `green-200`, flanc `green-600`, texte `green-950`.
Fausse : `amber-100` vers `orange-200`, flanc `orange-600`, texte
`orange-950`, jamais rouge.

Trois nuances, justifiées par le contraste et seulement par lui : le bas du
bouton d'action orange descend à `orange-600 #ea580c` (texte blanc à 3,6:1 au
lieu de 2,8:1 sur `orange-500`) ; le bouton ciel descend à `sky-600 #0284c7`
(4,1:1) ; les pastilles ambre, verte et sarcelle portent une lettre sombre.

### La lumière

Une seule lampe, en haut à gauche, un peu devant : c'est ce que `btn-chunky`
dit déjà (face claire en haut, flanc sombre en bas). Elle se peint, elle ne
se calcule pas :

- la face d'un objet est un dégradé vertical, clair en haut, plus soutenu en
  bas ;
- un filet de lumière de 2 px en haut de la face (`gk-face-light` :
  `inset 0 2px 0 rgb(255 255 255 / 0.75)`) et une ligne d'ombre de 2 px en bas
  (`inset 0 -2px 0 rgb(0 0 0 / 0.08)`) ;
- un reflet en bande sur le tiers haut (`white/55` vers transparent) ;
- un flanc en couleur pleine, plus sombre que la face ;
- une ombre sur la table, couche séparée, `0 6px 14px rgb(60 30 0 / 0.55)` à
  l'opacité 0,30 au repos ;
- sur un solide, les faces sont éclairées par `shade(couleur, facteur)` :
  dessus 1,2, devant 1, gauche 0,9, droite 0,8, derrière 0,65, dessous 0,55.

### L'épaisseur et la profondeur

Quatre élévations, en pixels (`tile-3d.tsx`, `ELEVATIONS`) :

| Élévation | Flanc | L'objet | L'ombre | Quand |
| --- | --- | --- | --- | --- |
| à plat | 0 | posé, échelle 1 | 1 px, opacité 0,12 | une case cible vide, un conteneur |
| posée | 5 px | posé | 6 px, 0,30 | une tuile au repos, juste, fausse |
| soulevée | 5 px | monte de 4 px, échelle 1,01 | 12 px, échelle 1,01, 0,24 | la tuile choisie |
| saisie | 5 px | monte de 8 px, échelle 1,04 | 18 px, échelle 1,04, 0,18 | ce qu'on traîne (glisser-déposer, ordre) |

Le bouton d'action : flanc de 8 px en `lg`, 6 px en `md`, 3 px désactivé.
L'appui enfonce la face de `flanc - 1 px` en 90 ms ease-out, flanc immobile,
ombre qui se rapproche de 2 px. Une carte d'exercice est posée : bordure
blanche 2 px, `0 6px 0 #d6c39a` et `0 18px 30px -16px rgba(60,30,0,0.5)`.

Les tuiles s'inclinent sous le doigt jusqu'à 7° (`perspective: 700px`) et
avec l'appareil jusqu'à 4° (`--gk-dev-rx`, `--gk-dev-ry`, un seul écouteur
d'orientation, quinze fois par seconde, Android et web seulement : iOS exige
une permission qu'on ne demande pas). Niveau « riche » seulement. L'écoute
(`useDeviceTilt`, `use-game-feel.tsx`) ne vit que le temps qu'une tuile est
montée (pas sur l'écran de fin), ignore l'événement vide d'un navigateur sans
capteur (`beta` et `gamma` à `null` : les tuiles restent droites) et n'écrit
les variables que si le demi-degré a changé, parce que chaque écriture relance
la transition de 220 ms de toutes les tuiles.

### Les ressorts

- framer-motion : `type: "spring", stiffness: 340, damping: 22` pour une
  entrée (l'alerte de réponse l'utilise déjà), `300 / 16` pour quelque chose
  qui rebondit plus (Pio qui arrive), `220 / 22` pour une grande surface.
- CSS, même sensation : `cubic-bezier(0.34, 1.56, 0.64, 1)` (`gk-spring`),
  220 ms pour une tuile qui se soulève ou se repose, 600 ms pour le jeton qui
  avance d'une pierre, 90 ms ease-out pour un appui (sans rebond : un appui
  est sec), 200 ms ease-out pour une ombre qui s'éloigne.
- Durée maximale d'une animation ponctuelle : 1,3 s (la récompense) ; une
  tuile ne bouge jamais plus de 0,45 s.

### La grammaire d'une réponse

1. **Choisir** : la tuile monte de 4 px et prend sa couleur (220 ms, ressort) ;
   vibration `tap` (8 ms). Le bouton Valider, jusque-là pâle et plat (3 px),
   se redresse (8 px) et un reflet le balaie toutes les 2,4 s : il appelle.
2. **Valider** : la face du bouton s'enfonce (90 ms), vibration `select`
   (12 ms). Le bouton passe en `busy` (« … ») le temps du serveur.
3. **Juste** : la tuile passe au vert et gonfle (`gk-pop`, 0,45 s, de 0,96 à
   1,05 à 1), la récompense jaillit de la carte (anneau 0,6 s, étoiles en roue
   0,9 s, pièces 1,1 s, confettis plafonnés), vibration `[12, 40, 12]`, son
   `correct`. La pierre du sentier passe au vert et le jeton avance (600 ms).
   PUIS, 650 ms après la tuile (`REVEAL_MS`, `answer-feedback.tsx`), la scène
   de réponse : Pio en `cheer` et son « Bravo ! » ; elle arrivait dans la même
   image que la tuile, et son voile grisait l'éclat (relu le 18 octobre 2026).
   Pendant la scène, le grand Pio de la question et sa bulle s'effacent : un
   seul lion à l'écran. Puis la question suivante (2 450 ms après la réponse).
4. **Faux, avec des essais** : la tuile passe à l'ambre et dit non
   (`gk-shake-soft`, 0,45 s, ±5 px et ±0,6°, jamais plus), un cœur se vide
   (échelle 0,75, opacité 0,7, 300 ms), vibration `[40, 40, 40]`, aucun son
   (D9 : pas de son d'échec) ; 450 ms après, la scène de réponse (Pio
   `encourage`), le temps que l'enfant ait VU quelle tuile était fausse. Rien
   de rouge, rien qui claque : à six ans, l'erreur est une étape.
5. **Plus d'essai** : Pio `sad` (pose douce) dans la scène, 450 ms après la
   tuile, vibration 60 ms, les deux boutons de suite dans l'alerte, comme
   aujourd'hui.

### Les sons et les vibrations

- Sons : `lib/sounds` et rien d'autre. `correct`, `badge`, `levelUp` ;
  positifs seulement (D9) ; volume figé à 0,45 (D34) ; `preloadAll` tôt, au
  montage de la séance, parce que le premier son met environ 300 ms à partir
  sur iOS. `useGameFeel().sound("correct")` vérifie l'accord de l'enfant
  (`getSoundEnabledLocal`) avant de jouer.
- Vibrations : `navigator.vibrate`, jamais Capacitor Haptics (pas installé,
  ne pas l'installer). `HAPTICS` dans `game-feel.ts` : `tap` 8, `select` 12,
  `correct` `[12, 40, 12]`, `wrong` `[40, 40, 40]`, `out` 60. iOS ignore
  l'appel sans erreur. Une réponse ne vibre qu'une fois : `Reward` ne vibre
  pas par défaut (`celebrate` à faux) parce que `answer-feedback.tsx` vibre
  déjà.

### L'écran type

De haut en bas, dans la zone sûre (`pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+1.5rem)]`, déjà posés par le layout en
mode focus) :

1. **L'en-tête** (collant) : la piste de progression sur toute la largeur
   (dix pierres, le jeton), dessous les cœurs à gauche et les étoiles de la
   séance à droite ; à droite de la piste, les sons du jeu (une NOTE de
   musique, barrée quand ils sont coupés : le haut-parleur est le signe
   d'« Écouter l'énoncé ») et la sortie (48 px, en pixels : le texte agrandi
   ne les grandit pas). Fond `#fff7e0` OPAQUE (à 90 %, l'énoncé qui défilait
   dessous se lisait entre les cœurs), bordure blanche, ombre douce. Ses
   marges verticales suivent la hauteur de l'écran (8 px sur une tablette, 6
   sur un téléphone de 960 px ou moins, 4 sur un écran de 667 px ou moins ;
   le sentier et ses cœurs se serrent de même) : le même en-tête, moins de
   souffle. Ses quatre lignes restent (à 360 px de large, dix pierres et cinq
   cœurs ne tiennent pas sur une même ligne). Il se décolle quand le clavier
   recouvre la page (`data-keyboard-up`) ou sous 300 px de haut ; collé, il
   suit le viewport visuel (`--vv-top`) : avec un clavier matériel, iOS fait
   défiler le viewport visuel de la barre d'accessoires (68 px), et l'en-tête
   passait sous la barre d'état.
2. **La scène de la question** (demande du propriétaire du 18 octobre 2026,
   maquette « grand Pio ») : la savane (`StageBackdrop`, horizon à 72 % ; sur
   un appareil « full », LA SAVANE PEINTE DU CAMP, `hub-savanna-portrait.jpg`,
   statique sur le premier écran, le décor CSS en dessous et sur « lite » :
   collines opaques, lueurs à bord doux sous les acacias, soleil et nuages
   calés sous l'en-tête), un GRAND Pio en pose `ask` à gauche (il montre
   l'énoncé du doigt), son buste au-dessus de la carte, ses pattes derrière
   elle, sa bulle à sa droite (`SpeechBubble`, queue à gauche). Sa hauteur
   suit l'écran : `--stage-pio = clamp(120px, 28svh, 280px)` (hauteur utile,
   encoche déduite ; 30 % jusqu'à la relecture du premier écran, voir plus
   bas), 17 svh entre 104 et 124 px de 601 à 667 px de haut,
   18 svh entre 88 et 120 px de 481 à 600 px ; en PAYSAGE (480 px ou moins),
   112 px, et la scène passe en deux colonnes : Pio et sa bulle à gauche
   (10,5 rem), la carte à droite, la page à `max-w-4xl`. Il joue son clip
   quand l'appareil est « full » et que la carte est posée, vingt secondes au
   plus (`CLIP_PLAY_MS` : le décodage VP9 alpha est logiciel sur Android ; la
   bascule attend que le doigt soit levé), puis l'affiche, comme pendant la
   voix ; il se touche pour relire l'énoncé (« Écouter l'énoncé » ; sans son à
   jouer, le nom le dit). PENDANT LA SCÈNE DE RÉPONSE, IL S'EFFACE AVEC SA
   BULLE (opacité, puis `visibility`) : la scène porte le Pio de l'issue et
   son mot ; deux lions identiques l'un sous l'autre, avec le même « Bravo ! »,
   c'était la composition d'avant (`session-stage.tsx`, `CoachPio`).
3. **La carte** : crème `#fff8e6`, bordure blanche 2 px, posée (flanc
   `#d6c39a` 6 px), 24 px de marge sur une tablette, 20 par défaut, 16 sur un
   téléphone debout, 16 sur les côtés et 12 en haut et en bas sur un écran de
   667 px ou moins. La consigne en Fredoka extra-gras `amber-950`, sur TOUTE
   la largeur (plus de bouton devant elle), de 20 à 26 px selon la largeur de
   l'écran (`clamp`), 20 px au-delà de 60 graphèmes (18 sur un écran de
   667 px ou moins, où les socles d'émojis perdent aussi un cran et la moitié
   de leur marge verticale) ; l'image d'énoncé au-dessus.
4. **La zone de réponse** : des tuiles `Tile3D` (56 px au moins, 64 px en
   `lg`), en grille de deux pour des réponses courtes, en colonne pour des
   phrases. La récompense est posée dans la carte (`Reward`, parent
   `relative`).
5. **La barre d'action** (`ExerciseActions`, `components/exercises/game-parts.tsx`,
   sur `SceneActionBar` du kit) : pour le CI et le CP, le gros bouton bleu
   « Écouter » (icône d'abord, puis le mot ; barres qui battent pendant la
   voix, sert d'arrêt ; crème et barré sans voix) JUSTE AU-DESSUS de
   `ActionButton3D` orange `lg` « Valider » : sur UNE LIGNE SUR TOUS LES
   TÉLÉPHONES (960 px de haut ou moins, jusqu'au 440 × 956 d'un iPhone Pro
   Max ; une tablette couchée aussi) : Écouter sur 42 % de la largeur AVEC
   SON MOT, Valider qui prend le reste ; DEUX RANGÉES au-delà (une tablette
   debout), « Écouter l'énoncé » en pleine largeur au-dessus de Valider comme
   sur la maquette 1. Deux rangées sur les téléphones (170 px de dock)
   coupaient la seconde rangée du QCM 4 sur l'iPhone 17 (voir « Le premier
   écran »). Le carré bleu de 64 px sans le mot seulement sous 340 px de
   large, ou quand le bouton est trop étroit pour le mot (texte agrandi,
   `@container`). Sous le
   pavé de chiffres de la réponse courte, cette ligne à toute hauteur
   (`row`). Un exercice sans Valider pose « Écouter » seul. Valider
   désactivé pâlit en couleurs OPAQUES (`paleTone`), pas par une opacité. TOUS les écrans y passent : les cinq d'origine et la phrase à trous
   entourent leur Valider d'`ExerciseActions`, les quatre jeux fabriqués par
   le code y arrivent par `SubmitButton`. L'écoute garde ses tambours
   « Écouter : Son 1 » (le son à reconnaître) distincts du bouton « Écouter
   l'énoncé », et son Valider orange : un seul bouton bleu dans la barre.
6. **Le dock** (`SceneDockProvider`, `game-kit/scene-dock.tsx`, racine de la
   coque) : EN SÉANCE, LA BARRE EST COLLÉE AU BAS DE L'ÉCRAN (demande du
   propriétaire du 18 octobre 2026, après avoir vu « Valider » passer sous le
   pli sur l'association, la frise, la réponse courte et le glisser-déposer).
   Un panneau crème `fixed` dans le langage de l'en-tête (`#fff7e0` OPAQUE,
   liseré blanc, un trait `#d6c39a` et une ombre statique vers le haut, un
   dégradé qui fond le contenu qui passe dessous ; pas de `backdrop-filter` ;
   à 92 %, les chiffres des tuiles se lisaient dans Valider), marges en
   pixels qui suivent la hauteur de l'écran (12 px en haut et 16 en bas sur
   une tablette, 10 et 12 sur un téléphone de 960 px ou moins, 8 et 12 sur
   un écran de 700 px ou moins, 8 et 8 en paysage ; sa hauteur reste
   MESURÉE), avec la marge de la barre d'accueil (`env(safe-area-inset-bottom)`)
   et les marges de la carte. `ExerciseActions` s'y téléporte (`createPortal`)
   quand il existe ; sans dock (vitrine, aperçus des professeurs, galerie),
   la barre reste au bas de la carte. Le contenu réserve la hauteur MESURÉE
   du dock (`ResizeObserver`, `--dock-h`, aussi `scroll-padding-bottom` du
   document) : la dernière tuile se fait défiler au-dessus de lui, et
   Playwright, qui amène un bouton dans la vue, s'arrête au-dessus. Le dock
   reste en place d'une question à l'autre (même élément, seul son contenu
   change) ; vide (un exercice cassé, qui a son propre « Suivant »), il est
   invisible et ne réserve rien ; la scène de réponse passe par-dessus
   (portail, z-50) ; les écrans de fin ne le rendent pas. Le CLAVIER d'une
   réponse tapée en lettres : sur Android, la fenêtre se redimensionne et le
   dock suit ; sur iOS, le clavier recouvre la page sans la redimensionner,
   le dock lit `visualViewport` et monte d'autant par un `transform`
   (`useKeyboardInset`), en retirant la marge de la barre d'accueil ; le
   champ se replace au tiers de la bande visible au-dessus du dock
   (`ShortAnswerExercise`, `revealField`), pas au centre de la fenêtre
   entière. Mesuré dans Chromium avec un viewport visuel simulé, puis vérifié
   le 18 octobre 2026 dans le WKWebView de l'iPhone 17 et dans le WebView de
   l'émulateur Android (`docs/boucle-native-jeu.md`, § 1).

### Le premier écran

L'OBJECTIF : sur un QCM à quatre options (et à trois, à tuiles d'émojis)
avec un énoncé de quatre lignes et une rangée d'émojis, TOUTES les tuiles
sont entièrement visibles au-dessus du dock, sans défiler, sur tout
téléphone debout ; à 320 × 568 et en paysage, la première rangée entière et
le reste par défilement ; sur les autres types, au moins la première réponse
et Valider. Un enfant de six ans qui voit « 4 » et « 6 » ne sait pas qu'il y
a « 5 » et « 1 » plus bas.

CE QUI L'A CASSÉ, et comment il a été réglé (relecture du 18 octobre 2026) :
avec le dock sur deux rangées (170 px plus la barre d'accueil) et Pio à 30 %,
la seconde rangée du QCM 4 (« 5 » et « 1 », la bonne réponse comprise) était à
moitié sous le dock sur l'iPhone 17 (402 × 874, encoche de 62 px) ; à
360 × 640, le dock n'avait qu'une rangée et les coupait quand même (37 px de
trop). La mesure d'alors (« 1re réponse visible ») regardait le HAUT de la
première réponse, pas la visibilité de toutes. Les leviers, dans l'ordre :
le dock sur UNE ligne sur tous les téléphones (960 px de haut ou moins ;
Écouter avec son mot, 42 %) ; Pio de 30 à 28 % de la hauteur utile, et de
20 à 17 % sur un écran court (601 à 667 px : la mesure l'exigeait, Pio à
104 px au plus bas n'aurait rendu que 14 des 37 px) ; les marges de
l'en-tête (6 px sur un téléphone, 4 sur un écran court ; cœurs plus près
du sentier), de la carte (16 sur un téléphone, 12 en haut et en bas sur un
écran court), du dock (10 et 12, 8 et 12) et du QCM (16 px entre l'énoncé
et les tuiles sur un téléphone, 12 sur un écran court ; les grosses tuiles à
émoji perdent la moitié de leur souffle sur un téléphone, un cran et tout
leur souffle sur un écran court) ; l'énoncé long en 18 px et ses socles un
cran plus petits avec la moitié de leur marge sur un écran court. Un en-tête
à moins de lignes (cœurs et étoiles sur la ligne du titre ou du sentier) a
été écarté : à 360 px de large, dix pierres et cinq cœurs ne tiennent pas
sur une ligne, et la ligne du titre a la hauteur de ses boutons de 48 px.

LA MESURE, dans Chromium (`scripts/shoot-exercises.mjs --seance
--seance-seule --scenes exercice --seance-types tous --tous-appareils`, qui
imprime « toutes (N) : tient (marge M px) » ou « débordent de M px » par
type et par appareil, flanc des tuiles compris ; les appareils `iphone` et
`iphone17` simulent l'encoche, voir l'en-tête du script) : toutes les tuiles
du QCM 4 et du QCM 3 tiennent au-dessus du dock avec 19 et 32 px de marge à
360 × 640, 71 et 56 à 375 × 667, 108 et 111 à 390 × 844 sans encoche, 35 et
38 avec l'encoche de 47 px, 47 et 49 sur l'iPhone 17 simulé (402 × 874,
encoche 62), 132 et 105 dans la fenêtre du WebView Android (412 × 840), 195
et 168 à 412 × 915, 364 et 325 à 820 × 1180 (deux rangées de dock, 170 px).
Avec un énoncé allongé d'une phrase (cinq lignes sur le QCM 4, quatre sur le
QCM 3), il reste 7 et 8 px à 390 × 844 avec encoche, 20 et 18 sur l'iPhone 17,
4 px sur le QCM 3 à 360 × 640 (le QCM 4 à cinq lignes y déborde de 5 px). À
320 × 568, la première rangée est entière (38 px) ; en paysage à 667 × 375,
aussi (5 px sur le QCM 4, 16 sur le QCM 3 : en-tête de 80 px, dock de 74,
socles de 24 px, tuiles de 64). Sur les autres types, la première réponse
et Valider sont visibles sur tout téléphone debout ; toutes les réponses
tiennent aussi sauf l'association (huit tuiles : 125 px à défiler à
360 × 640, 42 à 390 × 844 avec encoche, 31 sur l'iPhone 17), la réponse
courte à pavé (12 touches : 82, 54 et 41 px), la frise à 360 × 640 et
375 × 667 (61 et 35 px), la phrase à trous à 360 × 640 (71). Ce qui reste :
à 320 × 568, la frise a sa première perle 16 px sous le dock ; en paysage,
l'association, le glisser-déposer, l'écoute et la réponse en lettres ont
leur première réponse de 3 à 24 px sous le dock (sept types sur douze
avant). La page défile et la barre reste atteignable. Vérifié ensuite dans
le WKWebView de l'iPhone 17 (`docs/boucle-native-jeu.md`, § 6) : sur
`/dev/seance/?exo=qcm4`, les quatre tuiles sont entières au-dessus du dock
(une cinquantaine de pixels de jour sous « 5 » et « 1 »), le clavier des
lettres laisse le champ et le dock visibles, et l'écran de fin n'a pas de
dock.

Le dessin sur quadrillage garde ses cases de 41 px à 360 × 640 (56 px
ailleurs dans le jeu) : `fitGrid` (`pixel-grid-fit.ts`) les borne à
`MAX_CELL` (44 px) et à la hauteur libre sous la consigne ; des cases de
56 px pousseraient la palette et le bas du quadrillage sous le dock, que la
mesure de la place libre (`screenHeight`, `PixelArtExercise`) ne déduit
pas. Défaut d'avant la refonte, non régressif, laissé tel quel.

Le glisser-déposer montre ses étiquettes au premier écran : le bac passe
AVANT les boîtes. Défilée en bas, chaque carte passe au-dessus du dock avec
24 px de marge. Les leviers déjà pris : les colonnes de l'association
suivent leur contenu (`matchColumns` : la colonne des signes courts se serre à
un tiers), les boîtes du glisser-déposer passent en deux colonnes dès le
téléphone quand noms et étiquettes sont courts (`boxesSideBySide`), les
perles de la frise se touchent presque (cinq par ligne à 390 px), les tambours
font 80 px et les réponses « Le son 1 / Le son 2 » tiennent sur une rangée.

Tablette et paysage : la carte garde `max-w-2xl` centré ; la scène s'élargit ;
rien ne se met en deux colonnes.

### La typographie

Fredoka extra-gras partout où l'enfant lit : consigne 20 px, option 18 px
(20 px en `lg`), bouton 20 px en `lg`, bulle 16 à 18 px, compteurs 14 px.
Poppins reste pour les paragraphes longs (une explication, une phrase à
analyser), en 16 à 18 px, `font-medium`. Texte sur le décor : `text-outline`.
Espaces insécables avant « : », « ! », « ? ».

### Les budgets de performance

- On anime `transform` et `opacity`, rien d'autre : pas de filtre
  (`blur`, `grayscale`, `drop-shadow`), pas de `backdrop-filter`, pas de
  couleur, pas de `box-shadow`, pas de `width`. Une ombre qui bouge est une
  couche à ombre fixe dont on déplace le transform.
- Au plus **30 couches animées** en même temps à l'écran
  (`MAX_ANIMATED_LAYERS`). La scène en consomme 5 au niveau riche avec le
  décor CSS (soleil, deux nuages, deux lueurs) et 0 avec la savane peinte
  (une image statique), la récompense 23 pendant 1,3 s (anneau, 10
  étoiles, 4 pièces de 3 couches), une tuile qui change d'état 2.
- Confettis : 50 particules au niveau riche, 16 au niveau sobre, 0 sous
  `prefers-reduced-motion`, un seul tir par réponse : celui de l'écran
  d'exercice, dans la carte. L'alerte de réponse (`answer-feedback.tsx`) n'en
  tire aucun. Les confettis partent 90 ms après l'anneau, les étoiles et les
  pièces (`Reward`) : leur toile plein écran ne se crée pas dans l'image qui
  pose déjà quinze couches.
- `will-change` : jamais en statique, sauf UNE exception mesurée : la couche
  d'ombre floue d'un objet qui se soulève (tuile, bouton, pastille, pot).
  Sans elle, le WKWebView promeut l'ombre au premier toucher et repeint son
  flou à l'échelle 3 : 90 ms d'image gelée par toucher (simulateur iPhone 17,
  18 octobre 2026). Promue au montage, elle est peinte une fois et ne fait que
  se déplacer.

### Ce que le WKWebView a appris (iPhone 17, simulateur, 18 octobre 2026)

Mesures par les écarts de `requestAnimationFrame` dans l'application
(`docs/boucle-native-jeu.md`, § 6). Ce qui coûte, ce n'est pas React
(2 à 9 ms par commit, `<Profiler>`), c'est la peinture et la composition :

- **Une ombre floue peinte dans une couche fraîche** : la grande dépense.
  Tout élément qui part en transition est promu en couche, et WebKit repeint
  alors son `box-shadow` flou à l'échelle 3 (un flou de 14 px vaut 42 px). Les
  ombres des objets qui bougent sont donc des couches permanentes (ci-dessus),
  et les ombres des surfaces qui ARRIVENT (carte de l'exercice, alerte de
  réponse) ont un flou court : 16 px et 22 px, pas 30 et 60. Un jeton qui vole
  n'a pas d'ombre floue du tout.
- **Un contexte 3D par brique** (`perspective` sur la racine d'une tuile)
  alourdit chaque changement d'état de la tuile. La perspective d'une
  inclinaison se met dans le transform de l'objet lui-même
  (`perspective(700px) rotateX() rotateY()`), même rendu, sans contexte. Les
  vrais espaces 3D (les solides) restent sur des briques qui ne changent
  pas d'état à chaque toucher.
- **Une opacité sur la racine** d'une brique qui contient une couche
  composée (l'ombre) oblige WebKit à recomposer toute la brique. Une tuile ou
  un bouton qui pâlit le fait par son objet ou sa face, jamais par sa racine.
- **Un `<video>` monté ou démonté dans l'image du verdict** gèle l'écran de
  300 à 600 ms, trois à quatre fois de suite. Le Pio de l'alerte est une
  affiche légère (`animated={false} lite`) ; le clip reste à la fin de palier,
  où rien d'autre ne bouge. Depuis la scène de la question (grand Pio « ask »),
  le clip de la coque joue entre deux gestes et se démonte au verdict : remesuré
  sur l'iPhone 17, ce démontage coûte 80 à 140 ms à lui seul (`docs/boucle-native-jeu.md`,
  § 6, « La scène de la question »).
- **L'encoche compte dans `svh`.** `env(safe-area-inset-top)` vaut 62 px sur
  l'iPhone 17 et 0 dans Chromium : une mesure « tient » à 390 × 844 dans
  Chromium débordait de 27 px sur le téléphone. Le grand Pio se taille sur
  `100svh - env(safe-area-inset-top)`, et la barre « Écouter + Valider » passe
  sur une ligne sur tous les téléphones, 960 px de haut ou moins
  (`scene-action-bar.tsx`). Chromium ne simule pas l'encoche : le script de
  captures ampute la fenêtre et recalcule `--stage-pio` (appareils `iphone`,
  `iphone17`).
- Résultat : un toucher sur une tuile est passé de 180–290 ms à 30–80 ms ;
  le verdict d'un QCM en galerie de 285 à environ 130 ms ; dans la séance, le
  verdict puis l'arrivée de la carte suivante coûtent encore 250 à 400 ms
  (voile, alerte, éclat, peinture de la nouvelle carte), en mode
  développement.
- Un ressort framer-motion sur une grande surface (carte, scène de réponse,
  voile) porte `will-change` le temps du mouvement, par
  `useMotionWillChange()` : peinte une fois, elle glisse au lieu d'être
  repeinte à chaque image (mesuré dans le WebView Android, ci-dessous).
- Durée : aucune animation ponctuelle au-delà de 1,3 s ; les boucles d'ambiance
  durent 6 s ou plus (rien ne clignote).
- Images : la scène est en CSS et en SVG, zéro bitmap. Les solides sont des
  faces HTML (6 pour un cube, 16 à 24 panneaux plus 2 disques pour un
  cylindre, 3 couches pour une boule).
- Aucune nouvelle dépendance : framer-motion, canvas-confetti, lucide-react,
  CSS.

### Ce que le WebView Android a appris (émulateur Pixel_Jotna, 18 octobre 2026)

Même méthode, dans l'application Android (`docs/boucle-native-jeu.md`, § 6 :
sonde et touchers par le protocole DevTools, trace Chromium, profil), sur
l'émulateur en GPU logiciel puis en GPU du Mac, aux niveaux sobre (ce que
l'AVD de 2 Go décide seul) et riche.

- **Le JavaScript n'est pas le coût.** Profil au verdict d'une bonne
  réponse : 318 ms de JavaScript sur 4,1 s, React en mode développement
  compris ; au premier toucher d'une tuile, 31 ms. Tout le reste est
  peinture et rastérisation.
- **Un ressort framer-motion repeint sa surface à chaque image.** Il écrit
  `transform` dans le style depuis JavaScript ; pour Chromium comme pour
  WebKit ce n'est pas une animation, c'est un style qui change, et sans
  couche propre l'élément est rastérisé à chaque pas. La trace de l'entrée
  de la scène de réponse montrait le fil GPU occupé sans discontinuer
  pendant 1,2 s ; au verdict juste, 265 tuiles rastérisées. RÈGLE AJOUTÉE :
  une grande surface qu'un ressort déplace (la carte de l'exercice, la
  scène de réponse et son voile, Pio dans la scène) porte `will-change` LE
  TEMPS DU MOUVEMENT, posé et retiré par `useMotionWillChange()`
  (`game-kit/use-motion-will-change.ts`) : la surface est peinte une fois et
  glisse. 183 tuiles au lieu de 265 au même verdict ; sur le GPU du Mac,
  plus un écart au-dessus de 100 ms sur toute la séance. Pas de
  `will-change` permanent : il ferait de la carte le bloc conteneur de
  l'`DragOverlay` de dnd-kit (`position: fixed`) et garderait une couche en
  mémoire pour rien ; `useWillChange` de framer-motion le pose à vie, d'où
  le crochet maison.
- **Le GPU logiciel n'est pas un téléphone.** Sur `swiftshader_indirect`,
  le verdict puis la carte suivante faisaient des trous de 250 à 400 ms et
  le niveau riche était deux à trois fois pire que le sobre (cinq couches
  d'ambiance qui dérivent, donc tout l'écran recomposé à chaque image, au
  processeur) ; sur le GPU du Mac, 17 ms d'écart moyen partout, 19 ms au
  niveau riche, pire écart 100 ms (le premier verdict : son, scène, éclat
  dans la même image). Un Android d'entrée de gamme est entre les deux,
  plus près de la droite ; la mesure sur un vrai téléphone reste à faire.
- **Les émojis, les polices, les dégradés, les ombres, le `clip-path` du
  tambour, la paroi `rotateX` des boîtes, les câbles SVG, les prises** :
  identiques à Chromium, aucune case vide (Noto Color Emoji). Les 55 écrans
  et les 6 scènes sont dans le scratchpad de la session, dossier
  `shots/android/`.
- **Le mouvement réduit** du système (« Supprimer les animations »,
  `animator_duration_scale 0`) est bien lu : plus d'éclat ni de confettis,
  la profondeur reste.
- **Le vibreur ne vibre pas** : l'application ne demande pas
  `android.permission.VIBRATE` (`navigator.vibrate` renvoie `true`, logcat
  dit le refus). À ajouter au manifeste Android ; rien à changer dans le jeu.
- **Le clavier** (`adjustResize`) raccourcit la fenêtre de 840 à 528 px ;
  le champ de la réponse courte reste visible, Entrée valide. Avec le dock
  (revu le 18 octobre 2026 sur `/dev/seance/?exo=short-answer-texte`) : le
  dock suit le bas de la fenêtre raccourcie et se pose juste au-dessus du
  clavier (`data-keyboard-inset` absent, rien à compenser), le champ reste
  visible au-dessus de lui (355–423 px pour un dock à 434), « Valider »
  touché dans le dock clavier levé juge la réponse, et un toucher hors du
  champ ferme le clavier : la fenêtre reprend ses 840 px, le dock redescend,
  sans saut. La page se recompose avec la hauteur (Pio passe de 252 à 106 px
  par la requête `max-height: 667px`, l'en-tête se resserre) : c'est le
  comportement de toute page Android, pas un défaut du dock.
- **La scène de réponse ne s'effaçait pas quand la carte suivante arrivait**
  (revu le 18 octobre 2026, dans le WebView Android puis dans Chromium, en
  lisant les opacités toutes les 25 ms après « Valider » juste) : rendue
  DANS la carte de l'exercice dans l'arbre React (portée dans le body, mais
  enfant de la carte), elle partait avec elle ; `AnimatePresence mode="wait"`
  gèle la carte sortante, scène comprise, le temps de sa sortie (180 ms),
  puis la retire d'un coup. Le « Bravo ! » restait à 100 % d'opacité pendant
  que le grand Pio revenait dessous (98 % au moment où la scène disparaissait)
  : deux lions dans la même image, puis une disparition sèche. Depuis, la
  scène est rendue À CÔTÉ de la carte (`session-stage.tsx`), sa propre
  `AnimatePresence` joue son fondu de 180 ms, et la rangée du grand Pio
  revient avec 200 ms de délai (`delay-200` au retour seulement) : scène à
  0 % avant que Pio ne dépasse 0 %, mesuré sur les deux moteurs. Aucun
  changement de DOM, de rôle ni de props.

### Le repli `prefers-reduced-motion`

Toutes les briques portent `gk-motion` : sous `prefers-reduced-motion:
reduce`, `app/globals.css` coupe leurs animations et met leurs transitions à
0 ms. La profondeur reste peinte (flancs, ombres, lumière), les états changent
d'un coup, le jeton saute à sa pierre, les solides sont posés de trois quarts.
`useGameFeel()` renvoie `reducedMotion: true` et un budget à zéro : pas de
particule, pas d'étoile, pas de pièce, pas d'inclinaison, pas de dérive. Pio
est l'image fixe de sa pose (`pio.tsx` le fait déjà).

### Les téléphones modestes : `useGameFeel`

`decideGameFeelLevel` (`game-feel.ts`) rend « sobre » si l'un de ces signaux
est vrai : `prefers-reduced-motion`, tier `lite` de `use-device-tier`
(`saveData`, réseau 2G, `prefers-reduced-data`), `deviceMemory ≤ 2`,
`hardwareConcurrency ≤ 3`. Sinon « riche ». L'instantané serveur est
« sobre » : le HTML pré-rendu est le plus léger.

| | riche | sobre | mouvement réduit |
| --- | --- | --- | --- |
| confettis | 50 | 16 | 0 |
| étoiles / pièces de la récompense | 10 / 4 | 6 / 2 | 0 / 0 |
| inclinaison des tuiles | oui | non | non |
| dérive du décor, soleil, jeton qui flotte | oui | non | non |
| ressorts | oui | oui | non |
| panneaux du cylindre | 24 | 16 | 16 |
| durée des animations | × 1 | × 0,8 | 0 |

La profondeur, la lumière, les couleurs et la scène sont identiques aux trois
niveaux : un enfant sur un téléphone modeste a le même jeu, moins de choses
qui bougent toutes seules.

## 4. La boîte à outils : `components/student/game-kit/`

Tout s'importe depuis `@/components/student/game-kit`. Montre :
`http://localhost:3000/dev/kit/?level=riche` (ou `sobre`, ou sans paramètre
pour laisser l'appareil décider), en développement ou avec
`NEXT_PUBLIC_EXERCISE_GALLERY=1`.

### `useGameFeel()` et `GameFeelProvider`

```tsx
const feel = useGameFeel();
feel.level;          // "riche" | "sobre"
feel.rich;           // raccourci
feel.reducedMotion;  // vrai si l'enfant a demandé moins de mouvement
feel.budget;         // { particles, stars, coins, tilt, drift, springs, durationScale }
feel.vibrate("correct"); // HAPTICS : tap, select, correct, wrong, out
feel.sound("correct");   // lib/sounds, si l'enfant a accepté les sons

<GameFeelProvider level="sobre">…</GameFeelProvider> // force un niveau
```

### `useMotionWillChange()`

Pour un `motion.div` qui déplace une grande surface (une carte, une scène,
un voile) : une couche le temps du mouvement, rien après.

```tsx
const { willChange, onAnimationStart, onAnimationComplete } = useMotionWillChange(); // ou "opacity"
<motion.div style={{ willChange }} onAnimationStart={onAnimationStart} onAnimationComplete={onAnimationComplete} … />
```

Posé sur la carte de l'exercice (`ExerciseStageCard`), la scène de réponse,
son voile et son Pio. Inutile sur une tuile ou un jeton (petits, déjà
composés par leur transform 3D ou leur ombre `will-change`).

### `Tile3D`

Une réponse qu'on touche. `state` : `repos`, `choisie`, `juste`, `fausse`.
`tone` : l'index de l'option (0 à 5) ou `neutre`. `elevation` (optionnel) :
`plat`, `posee`, `soulevee`, `saisie`. `badge` : la lettre ou le numéro ;
remplacée par la coche ou la croix (sans `badge`, l'icône d'état se pose en
médaillon sur le coin haut droit). `size` `md` (56 px) ou `lg` (64 px),
`align` `left` ou `center`, `disabled`, `onPress`, `tilt`. `as="div"` pour
une étiquette dont dnd-kit tient la sémantique (poser `listeners` et
`attributes` dessus, garder `touch-none` sur la poignée).

```tsx
{options.map((text, i) => (
  <Tile3D
    key={i}
    tone={i}
    badge={String.fromCharCode(65 + i)}
    state={verdict !== null && picked === i ? (verdict ? "juste" : "fausse") : picked === i ? "choisie" : "repos"}
    disabled={disabled}
    onPress={() => setPicked(i)}
  >
    {text}
  </Tile3D>
))}
```

### `ActionButton3D`

Le Valider et ses frères. `tone` : `orange` (défaut), `green`, `sky`,
`white`, `red`. `size` `lg` (défaut, 64 px, flanc 8 px) ou `md`. `shine`
(le reflet qui appelle), `busy` (« … »), `disabled` (plat et pâle, en
couleurs opaques : `paleTone`), `icon`, `href` (rend un lien), `onClick`.
Ses faces vont d'orange-500 à orange-600, de sky-500 à sky-600, de green-600
à green-700 : le libellé blanc est posé AU MILIEU de la face, et c'est là que
les 3:1 se mesurent (`tones.ts`, `midFace`), pas sur le bas du dégradé.

```tsx
<ActionButton3D shine={picked !== null} disabled={picked === null} busy={submitting} onClick={submit}>
  Valider
</ActionButton3D>
```

### `SceneActionBar` et `ListenButton`

« Écouter » juste au-dessus de « Valider ». `listen` : `{ status, onPress }`
(`idle`, `loading`, `playing`, `unavailable`, dont le nom accessible dit
« le son manque ») ou `null` ; l'enfant est le bouton principal (facultatif) ;
`row` met les deux sur une ligne à toute hauteur (Écouter avec son mot sur
42 %, puis Valider : sous un pavé de touches).
Les écrans d'exercice ne l'appellent pas directement : `ExerciseActions`
(`components/exercises/game-parts.tsx`) lit le lecteur de consignes
(`usePromptReader`) et la remplit ; `SubmitButton` le fait pour les jeux.

```tsx
<ExerciseActions>
  <ActionButton3D shine={picked !== null} disabled={picked === null} onClick={submit}>Valider</ActionButton3D>
</ExerciseActions>
<ExerciseActions row={numeric}>…</ExerciseActions>   // une ligne sous le pavé de chiffres
<ExerciseActions />   // sans Valider : Écouter seul, rien sans lecteur
```

### `SceneDockProvider` et `useSceneDock`

Le dock : la barre d'action collée au bas de l'écran pendant une séance. La
coque (`session-stage.tsx`) en fait sa racine ; il rend ses enfants, puis le
panneau `fixed` (`role="group"`, « Actions de l'exercice ») en dernier dans
le DOM, et pose `--dock-h` (sa hauteur mesurée, 0 quand il est vide) sur la
racine. `useSceneDock()` donne `{ slot, occupy }` aux barres qui veulent s'y
téléporter, ou `null` hors de la coque : `ExerciseActions` fait les deux cas.
`useKeyboardInset()` et `keyboardInset()` : de combien le clavier recouvre le
bas de la fenêtre sans la redimensionner (iOS).

```tsx
<SceneDockProvider data-session-stage className="relative isolate …">
  <div style={{ paddingBottom: "calc(max(var(--dock-h, 0px), env(safe-area-inset-bottom, 0px)) + 1.5rem)" }}>…</div>
</SceneDockProvider>

// Dans une barre : se téléporter si le dock existe, rester en ligne sinon.
const dock = useSceneDock();
useLayoutEffect(() => dock?.occupy(), [dock?.occupy]);
return dock ? (dock.slot ? createPortal(bar, dock.slot) : null) : bar;
```

### `StageBackdrop`

La savane derrière l'écran. `horizon` (défaut 76, en %), `horizonFrom`
(`scene`, le défaut : un pourcentage de la hauteur de la scène ; `screen` : le
même pourcentage de `100svh`, pour une scène qui a la hauteur de la page,
comme la coque de la séance, où l'horizon ne doit pas sauter quand la carte
suivante est plus haute), `className`, `contentClassName`, `children`. Rien
n'y bouge au niveau sobre.

### `ProgressTrack`

`total`, `current` (index base 0, `total` quand c'est fini), `missed`
(index des exercices passés sans réussite), `attemptsLeft` et `attemptsMax`
(les cœurs, 5 par défaut), `stars` (le compteur). Annonce « Question 3 sur
10. Encore 4 essais. 7 étoiles gagnées. » en texte.

```tsx
<ProgressTrack total={exercises.length} current={currentIndex} attemptsLeft={5 - failedAttemptsThisExo} stars={starsSoFar} />
```

### `Reward`

Se pose dans un parent `relative`. `fire` : une valeur qui change à chaque
bonne réponse (un compteur, l'identifiant de l'exercice), `null` sinon.
`celebrate` : joue aussi le son et la vibration (à ne pas faire si
`AnswerFeedback` les joue déjà). `onDone` après 1,3 s.

```tsx
<div className="relative">…les tuiles…<Reward fire={correct ? exo._id : null} /></div>
```

### `Solid3D`

`kind` : `cube`, `pave`, `cylindre`, `boule`. `size` (arête ou diamètre,
96 px par défaut ; l'élément fait 1,6 fois cette taille), `color`, `spin`
(force la rotation), `label` (ce qu'annonce un lecteur d'écran). Ne jamais
le mettre dans un parent `overflow: hidden` à coins arrondis : Safari
aplatirait la 3D.

```tsx
<Solid3D kind="cylindre" size={80} color="#6ab04c" label="un cylindre" />
```

### Les utilitaires CSS (`app/globals.css`)

`gk-spring` (la courbe du ressort), `gk-perspective` (700 px), `gk-3d`
(`preserve-3d`), `gk-face-light` (le filet de lumière), et les images clés
`gk-pop`, `gk-shake-soft`, `gk-shine`, `gk-turntable`, `gk-roll`,
`gk-star-fly`, `gk-ring`, `gk-coin-rise`, `gk-spin-y`, `gk-drift`, `gk-bob`.
Toutes en transform et opacity ; toutes coupées sous `.gk-motion` quand
l'enfant demande moins de mouvement. Les classes `animate-[gk-pop_0.45s_ease-out]`
s'écrivent en toutes lettres dans les composants pour que Tailwind les
génère.

### Les teintes (`tones.ts`)

`tileRestTone(i)`, `tileChosenTone(i)`, `TILE_CORRECT_TONE`,
`TILE_WRONG_TONE`, `TILE_NEUTRAL_TONE`, `ACTION_TONES`, `GESTURE_ACCENT`,
`gestureAccentColor(famille)`, `shade(hex, facteur)`, `contrastRatio(a, b)`.

## 5. Ce qui a été vérifié, ce qui ne l'est pas

Vérifié dans Chromium (Playwright, téléphone 390 × 844, échelle 3) : chaque
brique dans chaque état aux niveaux riche et sobre, et sous
`prefers-reduced-motion` ; l'écran type joué (choisir, valider, juste avec
l'éclat, faux avec la secousse). Captures : `scratchpad/shots/kit/`
(`v2-*` riche et sobre, `v3-reduced-*` mouvement réduit). Compté dans le DOM
de la montre entière : 14 couches animées en boucle au niveau riche (soleil,
nuages, lueurs, jeton, reflet, solides), 0 au niveau sobre, 0 sous mouvement
réduit ; aucune transition hors `transform` et `opacity` ; aucune erreur de
console. Tests : `components/student/game-kit/__tests__/` (niveau et budget,
teintes et contrastes, états et élévations de la tuile, icône d'état en coin,
contenu de l'éclat, sentier, solides).

Pas encore vérifié : le rendu dans le WKWebView d'iOS et le WebView Android
(un autre agent s'en charge), en particulier la 3D des solides dans Safari,
le coût des inclinaisons sur un Android d'entrée de gamme, et le son au
premier toucher. Les tuiles s'inclinent sous la souris dans Playwright ; au
doigt, l'inclinaison n'est visible que le temps de l'appui.

Ce qui reste fragile : le cylindre est un prisme à 24 faces (16 en sobre),
sans bord entre les lames, mais la lumière y passe par paliers d'une lame à
l'autre ; une tuile étroite avec une pastille ET un gros émoji est serrée
(sans `badge`, l'icône d'état se met en coin et le contenu garde sa place) ;
la lumière des solides tourne avec eux ; la boule est un disque peint, pas
une sphère, ses quartiers le disent quand elle roule.

## Rappel des contraintes

Un seul code (web, iOS, Android). Transform et opacity seulement, filtres
jamais animés, ombres statiques. Un émoji n'entre jamais depuis `scale(0)`.
Pio n'est jamais animé par du code. 3D en CSS, pas de WebGL, pas de nouvelle
dépendance. `prefers-reduced-motion` respecté, cibles de 56 px, sémantique et
`aria-live` conservés, zones sûres. Les props des composants d'exercice ne
changent pas ; `convex/` et les gabarits non plus ; aucun émoji à sélecteur
de variation dans les sources de l'interface.
