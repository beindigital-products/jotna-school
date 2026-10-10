# Les animations de Pio : des vidéos, pas du code

Depuis septembre 2026, Pio ne bouge plus par framer-motion. Dans
l'application mobile (iOS et Android, Capacitor), chaque pose est un clip
vidéo de cinq secondes, en boucle, sans arrière-plan, généré sur OpenArt à
partir de la pose PNG officielle. Le composant `components/student/pio.tsx`
lit le clip de la pose demandée ; la carte
(`components/student/world/pio-walker.tsx`) le déplace le long du sentier
pendant que le clip `walk` marche sur place.

Depuis le 9 octobre 2026, l'espace élève est le même sur le web et dans
l'application : Pio y joue ses clips partout. L'image fixe de la pose reste son
repli (mouvement réduit, `animated={false}`). La page d'accueil, elle, est une
page que l'on ouvre sur un téléphone avec une donnée chère : voir plus bas.

Ce document dit comment les clips ont été faits et comment en refaire un.

## Les neuf clips

| Pose | Ce que fait Pio | Où on le voit |
| --- | --- | --- |
| `idle` | respire, cligne, penche la tête | camp, retour sans série |
| `hello` | fait coucou de la patte | camp le premier jour, carte à l'arrivée, explications |
| `cheer` | saute de joie | bonne réponse, palier validé, passage de niveau, série vivante |
| `sad` | serre ses livres, réconforte | plus d'essais, page vide |
| `amazed` | s'émerveille, bouche ouverte | touche au camp |
| `encourage` | pouce levé, hoche la tête | mauvaise réponse, palier manqué |
| `think` | réfléchit, regarde en l'air | chargement |
| `sleep` | dort, respire lentement | disponible |
| `walk` | marche sur place | trajet sur la carte |

Chaque clip existe en deux formats dans `public/videos/pio/` :

- `<pose>.mov`, HEVC avec canal alpha : iOS (WKWebView de l'app Capacitor)
  et Safari ;
- `<pose>.webm`, VP9 avec canal alpha : Android (vue web Chromium de
  l'app Capacitor), Chrome, Firefox.

Le navigateur prend la première source qu'il sait lire. Le PNG de la pose
sert d'affiche pendant le chargement, et d'image fixe quand l'enfant a
demandé moins de mouvement ou quand un dialog passe `animated={false}`.

## Comment un clip est fait

1. **La planche.** La pose PNG (572 × 800, `public/images/pio/`) est posée
   sur un fond bleu pur (#0000FF) dans un cadre 720 × 1280, à 1000 pixels de
   haut, les pattes à 120 pixels du bas. Bleu et pas vert : Pio porte du vert
   (short, livre, écharpe) et du orange, jamais de bleu.

   ```bash
   ffmpeg -f lavfi -i "color=c=0x0000FF:s=720x1280" -i public/images/pio/idle.png \
     -filter_complex "[1:v]scale=-1:1000[pio];[0:v][pio]overlay=(W-w)/2:H-h-120,format=rgb24" \
     -frames:v 1 idle-plate.png
   ```

2. **La génération.** Sur OpenArt, modèle **Kling 3 Omni**, mode image vers
   vidéo, résolution standard, 5 secondes, sans son, avec la planche en
   **première ET dernière image** : la boucle revient exactement à la pose,
   sans raccord visible. Le prompt décrit un mouvement du personnage et
   interdit tout mouvement de caméra (« fixed tripod shot, no zoom, no
   push-in »), tout objet ajouté et toute ombre sur le fond.

   PixVerse V6, moins cher, a été essayé d'abord : sur les poses calmes il
   invente un zoom avant, ce qui ruine un sprite fixe. Kling tient la caméra.

3. **Le détourage et l'encodage.** `scripts/pio-encode.sh <pose> <clip.mp4>`
   rend le bleu transparent, retire son reflet sur les bords, ramène le cadre
   à 576 × 1024 (Pio debout y fait 800 pixels, les pattes à 96 pixels du bas)
   et écrit les deux fichiers dans `public/videos/pio/`. L'encodeur HEVC
   alpha est celui de VideoToolbox : le script tourne sur macOS.

Le composant compte sur cette géométrie (constante `CLIP` dans `pio.tsx`) :
`size` reste la hauteur de Pio debout, et le clip déborde vers le haut pour
laisser la place au saut.

## Refaire ou ajouter une pose

1. Déposer la pose PNG dans `public/images/pio/` (même cadrage que les autres).
2. Faire la planche, la générer sur OpenArt comme ci-dessus, télécharger le mp4.
3. Lancer `scripts/pio-encode.sh <pose> <clip.mp4>`.
4. Ajouter la pose à `PioState`, `POSES` et `LABELS`, et à la liste `poses` de
   sa tenue dans `OUTFITS`, dans `pio.tsx`.

Pour un nouveau mouvement d'une pose existante, seules les étapes 2 et 3
comptent.

## Sur la page d'accueil

La page d'accueil montre Pio avant qu'un enfant ait joué : en haut de la page
(`components/landing/hero-pio.tsx`), dans la section « Faites connaissance avec
Pio » (`meet-pio.tsx`), et dans la note « Et l'élève ? » de « Créez votre
compte ». Il réagit au toucher comme au camp de l'élève (`pio-reactions.ts` :
pose et réplique à chaque toucher, cinq touchers en deux secondes pour la
réaction secrète), avec les phrases de `lib/pioCopy.ts` : le visiteur entend ce
que l'enfant entendra. Quatre « moments » (`pio-moments.ts`) le font prendre
la pose et dire la phrase de l'application : il accueille, fête une réussite,
encourage après une erreur, rassure quand il n'y a plus d'essais.

**Elle ne charge pas 17 Mo de clips.** C'est la règle de cette page :

- **Une affiche légère d'abord.** `<Pio lite />` sert les WebP de
  `public/images/pio/lite/` (640 pixels de haut, 40 à 47 Ko) au lieu des PNG
  d'origine (500 à 600 Ko). `node scripts/pio-lite.mjs` les refait à partir des
  PNG. Il reprend la couleur des bords opaques sous les pixels transparents avant
  l'encodage : détourées d'un fond bleu, les poses gardaient du bleu sous leur
  contour, et le WebP avec perte le faisait couler dans la crinière (un liseré
  violet sur fond clair). Seule la tenue de tous les jours en a : le boubou garde
  ses PNG.
- **Le clip seulement si l'appareil le permet.** `hooks/use-device-tier.ts` : ni
  économiseur de données, ni 2G, ni petite machine, ni mouvement réduit.
  Sur un appareil modeste, Pio reste l'affiche et la savane est en CSS.
- **Pas avant la fin du chargement** (`use-after-load.ts`) en haut de la page ;
  **pas avant d'approcher** (`use-near-viewport.ts`) dans la section, dont la
  savane peinte (250 à 380 Ko) attend aussi (`SavannaBackdrop painted`).
- **Pas pour une réaction.** Un toucher dure deux secondes et demie, moins que
  le temps de charger un clip d'un mégaoctet : Pio y prend l'affiche de la pose,
  instantanée. Le clip est pour les poses qui durent (« hello » en haut de la
  page, un moment choisi dans la section) ; `hello` est chargé une fois pour les
  deux endroits.
- **Une seule place à l'écran.** En haut de page, Pio a deux places : à côté de
  la carte sur un grand écran, au-dessus du titre sur un téléphone, où la
  carte est sous le premier écran. Le CSS cache l'autre et seul le Pio visible
  lance son clip (`use-media-query.ts`).

Au total : ne rien toucher charge le clip « hello » (330 Ko, 660 Ko avec le
.mov de Safari), après le texte, sur un appareil capable ; jouer avec les quatre
moments en charge trois de plus (« cheer », « encourage », « sad »), 3,3 Mo en
tout (4,6 Mo avec les .mov), chacun une seule fois.

## Les tenues : le boubou du module Arabe & Coran

Depuis le 28 septembre 2026, Pio a une deuxième tenue. Dans le module
« Arabe & Coran », il porte un grand boubou vert émeraude brodé d'or et le
kufi assorti. Le vert a été préféré au blanc : sa tunique de tous les jours est
crème, et un boubou blanc se serait confondu avec elle à petite taille.

Le composant prend la tenue en prop : `<Pio state="salam" outfit="boubou" />`.
Chaque tenue déclare ses poses dans `OUTFITS` (`pio.tsx`). Une pose absente
retombe sur la plus proche **de la même tenue** : `cheer` devient `bravo`,
`hello` devient `salam`. Pio ne change jamais d'habits au milieu d'un écran.
La carte (`GameMap`, prop `outfit`) le fait marcher en boubou.

| Pose | Ce que fait Pio | Où on le voit |
| --- | --- | --- |
| `idle` | respire, penche la tête | module fermé, repli |
| `salam` | main sur le cœur, s'incline doucement | arrivée sur le chemin, fin d'une leçon de Coran |
| `listen` | patte à l'oreille, hoche la tête | pendant que l'enfant parle au micro |
| `recite` | ouvre la bouche en « aaa », patte tendue | quand la voix joue, « écoute, puis à toi » |
| `bravo` | applaudit, petit saut | lettre bien dite, leçon d'alphabet finie |
| `encourage` | pouce levé, hoche la tête | essai manqué |
| `walkAway` | marche sur place, vu de dos, vers la droite | trajet qui monte le chemin |
| `walkToward` | marche sur place, vu de face, vers la droite | trajet qui redescend le chemin |

Les fichiers : `public/images/pio/boubou/<pose>.png` et
`public/videos/pio/boubou/<pose>.{mov,webm}`.

## La marche dans les deux sens

Le 29 septembre 2026, le propriétaire a vu Pio revenir à une étape d'avant
sans vraiment marcher. Le boubou n'avait qu'un clip `walk`, de face, où Pio
se dandinait : en montant le chemin, il avait l'air de reculer. Deux clips le
remplacent, faits comme les autres (images fixes sur Nano Banana Pro, clips
de 3 secondes sur Kling 3 Omni, 75 crédits chacun) :

- `walkAway`, vu de dos : Pio monte le chemin, vers la Kaaba ;
- `walkToward`, vu de face : Pio redescend vers une étape d'avant.

La carte choisit le clip au départ de chaque marche, d'après le sens vertical
du trajet (`heading` dans `pio-walker.tsx`), puis retourne Pio à gauche ou à
droite d'après le sentier. Pour savoir dans quel sens le retourner, chaque
tenue déclare le côté où regardent ses clips de marche (`walkFacing` dans
`OUTFITS`) : à droite pour le boubou, à gauche pour le Pio de tous les jours.
Ce réglage corrige aussi la carte du monde, où le clip `walk` du Pio de tous
les jours, qui regarde à gauche, marchait à reculons dans les deux sens. Une
tenue sans `walkAway` ni `walkToward` retombe sur son clip `walk`.

La carte fait avancer Pio à la vitesse de ses pas : 90 pixels-monde par
seconde (`WALK_SPEED`, `trail-geometry.ts`), soit deux à trois secondes par
étape. Les clips font environ trois pas par seconde. Plus vite, Pio glisse
sur le sentier ; à 240 pixels par seconde, le propriétaire le trouvait
« beaucoup trop rapide ».

**Le détourage garde les verts.** Rendu sur fond bleu, un personnage en reçoit
le reflet. `despill=type=blue` retirait ce reflet au canal VERT, son réglage
par défaut pensé pour un fond vert, et le boubou émeraude virait au bleu
canard. `scripts/pio-still.sh` et `scripts/pio-encode.sh` passent désormais
`green=0:blue=-1`. Les clips faits avant gardent leur réglage d'origine.

**Comment elles ont été faites.** Les images fixes viennent de Nano Banana Pro
sur OpenArt, en image vers image, avec la pose `idle` d'origine comme
référence : « même personnage, nouvelle tenue », fond bleu pur, aucun texte.
La pose de base en boubou a ensuite servi de référence aux six autres, pour
que le visage et les broderies restent les mêmes. Pour une nouvelle pose :

1. générer l'image sur fond #0000FF, Pio en pied, sans lettre ni écriture ;
2. `scripts/pio-still.sh boubou <pose> <image.png> <dossier>` détoure l'image,
   écrit le PNG 572 × 800 dans `public/images/pio/boubou/` et la planche
   720 × 1280 dans le dossier donné ;
3. générer le clip sur Kling 3 Omni comme plus haut (sans son : 125 crédits
   au lieu de 175), avec cette planche en première et en dernière image ;
4. `scripts/pio-encode.sh <pose> <clip.mp4> boubou` ;
5. ajouter la pose à la liste `poses` de `boubou` dans `OUTFITS`.

**Pendant qu'un son joue ou que le micro écoute, le coach montre la pose en
image fixe** (`animated={false}`, `components/arabic/pronounce-coach.tsx`). Sur
iOS, la voix et le micro interrompent la vidéo muette de Pio, qui disparaissait
le temps d'un mot.
