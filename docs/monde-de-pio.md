# Le Monde de Pio : l'espace élève est un jeu

L'espace élève ne ressemble plus à un catalogue de cours. C'est un jeu : un
camp dans la savane où vit Pio, une carte du monde dont chaque zone est une
matière, un sentier d'étapes par monde, des missions du jour, une salle des
trophées et un carnet d'explorateur. La séance d'exercices, elle, reste sobre.
Le jeu motive entre les exercices, jamais pendant.

Ce document dit ce qui a été construit, pourquoi, et comment l'étendre sans
casser ce qui tient.

## D'où vient la conception

Le monde de jeu avait déjà été conçu et livré en juillet 2026 sur la branche
`doums85/student-pages`, jamais fusionnée. Le propriétaire a demandé une
conception neuve sur `main` plutôt qu'une fusion. Le code est donc nouveau.
Deux choses ont été reprises telles quelles, parce qu'elles lui appartiennent :

- les huit poses de Pio v4, l'explorateur à la loupe, dans `public/images/pio/` ;
- les décors de savane et les quatre biomes, dans `public/images/world/`.

Les décisions de conception de juillet, consignées dans `tasks/redesign-gaming.md`
sur cette branche, ont servi de grammaire : hub, carte, quêtes, tiers
d'appareil, séance intacte. Elles sont citées ci-dessous par leur numéro
(G1, G3, G5, G7, G9, G10, D8, D12, D15).

## Les quatre lieux

La navigation nomme quatre lieux, pas des écrans : Camp, Carte, Trophées,
Carnet. Un enfant n'ouvre pas un profil, il ouvre son carnet.

**Le Camp** (`/student/home`). La savane peinte, Pio grandeur nature, une
bulle qui parle, un seul gros bouton qui reprend l'aventure là où elle s'est
arrêtée. Dessous : les missions du jour, la série si elle vit, puis les
mondes en médaillons. Toucher Pio change sa pose et sa réplique, joue le son
de réussite si les sons sont acceptés, fait vibrer le téléphone. Cinq touches
en deux secondes déclenchent la réaction secrète.

**La Carte** (`/student/map`). Chaque matière est une zone sur un sentier
serpentin, dans une carte qu'on pince pour zoomer et qu'on fait glisser.
Toucher un monde ne l'ouvre pas tout de suite : Pio marche sur le sentier
jusqu'à lui, le salue, puis la page s'ouvre. Pendant la session, il se
souvient du dernier monde atteint. Aucun monde ne se verrouille : l'ordre est
une suggestion, pas une barrière.

**Le Sentier d'un monde** (`/student/subjects?id=`). Même carte, mêmes gestes.
Une étape est un palier de dix exercices ; le nom de la thématique est une
plaque sur son premier palier, et le nombre de paliers dépend de la thématique
(voir `docs/paliers-et-exercices.md`). Franchie, en cours, ouverte, fermée se
lisent à la couleur. Toucher une étape envoie Pio jusqu'à elle ; à l'arrivée,
sa carte se lève en bas du cadre avec la thématique, le palier, son niveau de
difficulté et le bouton d'action. Une étape fermée secoue la tête et explique
comment l'ouvrir. Un doigt qui dérape ne lance jamais une séance. L'élève ne
voit que les thématiques de son niveau.

**La Salle des trophées** (`/student/badges`). Les badges rangés par étagères,
du plus rare au plus commun, avec une jauge de collection.

**Le Carnet** (`/student/profil`). Une page crème avec des tampons : niveau,
étoiles, exercices, trophées, série. Un tampon à zéro reste en pointillé.

**La fin d'un palier** (dans la séance,
`components/student/game/palier-result.tsx`). Pio parle dans sa bulle, la
récolte d'étoiles se compte sous ses yeux avec le drapeau du seuil, le
sentier de la thématique s'allume d'un cran et le bouton ouvre le palier
suivant, ou le trésor quand la thématique est finie. Palier manqué : Pio
encourage, la jauge dit combien d'étoiles manquent, et le bouton propose de
refaire les exercices ratés. Le trophée débloqué, l'écran de niveau et la
question du son s'y enchaînent, comme sur l'ancien écran de victoire, qui
n'existe plus.

## La carte de jeu

La carte du monde et le sentier d'une matière partagent un même cadre,
`GameMap` (`components/student/world/game-map.tsx`). Le monde est un plan de
420 pixels de large dont la hauteur suit le nombre d'étapes ; tout ce qui s'y
pose parle en coordonnées de ce monde. La caméra (`map-viewport.tsx`) le
déplace et l'agrandit d'une seule transformation : un doigt déplace, deux
doigts pincent, la molette avec Ctrl zoome, et quatre boutons font la même
chose sans geste (zoomer, dézoomer, retrouver Pio, voir toute la carte). Un
doigt qui glisse avale le clic qui suivrait : un défilement n'ouvre jamais un
monde.

Le sentier est calculé, pas dessiné (`trail-geometry.ts`) : des courbes de
Bézier échantillonnées en JavaScript, avec la longueur cumulée à chaque étape
et un point pour n'importe quelle distance. C'est ce qui fait marcher Pio
(`pio-walker.tsx`). Sa position est une seule abscisse sur le sentier, animée
d'une étape à l'autre à vitesse constante, entre 0,45 et 2,4 secondes. Le
corps ne se déforme jamais : la marche est un rebond du sprite entier, un
retournement quand il change de sens, une ombre qui respire et de la
poussière derrière les pattes. La caméra le suit. Sous
`prefers-reduced-motion`, Pio est déjà arrivé.

Sur un appareil « full », le sol est la savane peinte, répétée en miroir vers
le bas pour ne pas montrer de couture ; sur « lite », un dégradé et quelques
buissons en CSS. La géométrie a ses tests dans
`lib/__tests__/trailGeometry.test.ts`.

## Le HUD

En haut de chaque lieu : le niveau et la barre qui mène au suivant, les
étoiles, la série. Étoiles et série n'apparaissent qu'une fois gagnées (D8,
cold start sans zéros). Le niveau s'affiche toujours : « Niveau 1 » est un
départ, pas un zéro.

Le HUD lit `students.getMyStats`, que l'accueil et le carnet lisent aussi.
Convex partage une même souscription entre ses lecteurs : le HUD ne coûte
aucune lecture de plus.

## Les missions du jour

Trois missions par jour, toujours une facile (G7). Elles vivent dans la table
`dailyMissions`, une ligne par élève et par jour, les trois missions embarquées.

La sélection est déterministe, semée par l'identifiant de l'élève et la clé du
jour : deux appareils tirent les mêmes missions, et un test peut affirmer ce
qu'un jour donné produit. Les règles sont pures dans `convex/questRules.ts`,
testées dans `convex/__tests__/questRules.test.ts`.

La ligne du jour naît au premier passage au camp (`quests.ensureDaily`) ou à
la première fin de palier de la journée (`quests.recordActivity`), les deux se
rejoignant sur la même clé. L'accroche est dans `palierAttempts.submitPalier`,
au même endroit que la série.

Récompense : une étoile par mission, deux de plus quand les trois sont faites,
cinq au plus par jour. Le total de vie est sur
`profiles.preferences.questBonusStars`, borné, et `getMyStats.totalStars`
l'ajoute.

Un parent peut couper les missions : `parentSettings.dailyMissionEnabled` à
`false` chez un seul parent suffit (G10). Le panneau disparaît alors, sans
message.

## Deux requêtes nouvelles

`students.getMyWorldMap` rend les matières comme des mondes, avec le nombre
d'étapes visibles et la part franchie. Une matière sans étape jouable pour le
niveau de l'élève n'apparaît pas.

`students.getMyNextStep` dit où reprendre : le palier en cours le plus récent,
sinon la première étape ouverte en parcourant les mondes dans l'ordre, sinon
la carte. C'est ce que le bouton du camp suit ; la fin d'un palier, elle,
ouvre le palier suivant de la même thématique.

## Les appareils modestes

Le terrain, c'est Dakar : des Android d'entrée de gamme, une donnée chère.
`hooks/use-device-tier.ts` classe l'appareil en `lite` ou `full` (G5) :
`saveData`, mémoire de 2 Go ou moins, trois cœurs ou moins, réseau 2G annoncé.

Sur `lite`, le décor est en CSS et en SVG minuscule : ciel, soleil, collines,
deux acacias. Sur `full`, c'est la scène peinte. Le HTML pré-rendu est toujours
la version légère : c'est elle qui peint en premier sur un réseau lent, et
l'enrichissement vient après l'hydratation.

Le décor du camp est un `<picture>` avec une image portrait sur téléphone et
une image paysage dès la tablette. `<picture>` ne charge que la source qui
correspond à l'écran ; deux images masquées par CSS se chargeraient toutes
les deux.

Tous les mouvements d'ambiance s'arrêtent sous `prefers-reduced-motion` (D12).
Chaque cible tactile fait au moins 44 pixels (D15).

## Ce qui a été réparé en passant

La classe `font-display` n'existait pas dans le CSS construit. Fredoka était
chargée par `app/layout.tsx` sous la variable `--font-display`, et des dizaines
de titres portaient la classe, mais Tailwind v4 n'engendre une classe que pour
un jeton déclaré dans `@theme`. Tous les titres de l'espace élève tombaient en
Poppins. Le jeton est maintenant déclaré dans `app/globals.css`.

Pio était un « petit oiseau rond » dessiné en SVG, un bouche-trou de MVP. Le
composant `components/student/pio.tsx` rend désormais l'avatar officiel, avec
la même interface pour ses appelants et quatre poses de plus. Depuis
septembre 2026, chaque pose est un clip vidéo en boucle, sans arrière-plan,
généré sur OpenArt ; plus aucune animation du personnage n'est codée. La marche
sur la carte est elle aussi un clip (`walk`) : le code ne fait que déplacer le
sprite le long du sentier. Voir `docs/pio-animations.md`.

## Étendre le jeu

**Ajouter une matière** : rien à faire côté jeu. La carte et le camp sont
pilotés par les données ; les biomes cyclent selon l'index.

**Changer le nombre d'étapes d'une thématique** : dans l'administration, le
champ « Nombre de paliers » de la thématique. Les défauts par niveau sont dans
`convex/palierRules.ts`.

**Ajouter un type de mission** : trois endroits. Le type et sa règle de
progression dans `convex/questRules.ts`, la valeur dans l'union du schéma
`dailyMissions.quests[].type`, l'icône dans `components/student/game/quest-board.tsx`.
Ajouter un test.

**Changer la forme du sentier** : `WORLD_TRAIL` et `SUBJECT_TRAIL` dans
`components/student/world/trail-geometry.ts` (largeur du monde, hauteur de
rang, marges, amplitude du zigzag). La vitesse de marche et ses bornes sont
au même endroit.

**Ajouter une pose de Pio** : déposer l'image dans `public/images/pio/`,
générer et encoder son clip (`docs/pio-animations.md`), puis l'ajouter à
`PioState`, `POSES`, `POSTERS` et `LABELS` dans `pio.tsx`.

**Changer une réplique** : `lib/pioCopy.ts`. Pio tutoie, ne gronde jamais,
parle court.

## Ce qui n'est pas fait

La séance d'exercices garde son mode focus (G3) ; seules la réaction à une
réponse (`components/student/game/answer-feedback.tsx`) et la fin du palier
sont passées au jeu. Pendant l'explication « Je veux comprendre », l'alerte
de réponse s'efface, et revient quand le panneau se ferme. La boutique et la monnaie n'existent
pas (G7 les écartait). Pio n'est pas en 3D. Les tests Playwright de l'espace
élève ont été mis à jour pour les nouveaux noms de lieux, mais ne sont pas
joués par la CI.
