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

## Les dix clips

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
| `ask` | montre l'énoncé du doigt, la loupe dans l'autre patte ; respire, cligne, regarde autour de lui, le bras reste tendu (10 s) | la question, dans la séance d'exercices |
| `walk` | marche sur place | trajet sur la carte |

**La pose `ask` (18 octobre 2026) a été faite avec le studio, pas sur OpenArt.**
L'image fixe vient de gpt-image-2, en image vers image depuis les poses `idle`
et `hello` (même personnage, même tenue, même rendu, le bras tendu vers la
droite). Le clip est un Kling 3.0 de 5 secondes ; cette voie ne permet pas de
donner la dernière image, donc la boucle est faite en aller-retour avec ffmpeg
(le clip, puis le clip à l'envers : 10 secondes, raccord invisible), puis
encodée par `scripts/pio-encode.sh` comme les autres. La première image du
clip est celle de l'affiche : passer de l'image au clip, ou l'inverse, ne se
voit pas. Au passage, `scripts/pio-still.sh` détoure désormais avec `bbox` et
non `cropdetect`, qui rognait le bout du doigt tendu. L'affiche légère
(`lite/ask.webp`) est faite par `node scripts/pio-lite.mjs ask`.

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
  PNG (`node scripts/pio-lite.mjs ask` : une seule pose ; sans libwebp dans
  ffmpeg, il passe par `cwebp`). Il reprend la couleur des bords opaques sous les pixels transparents avant
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
le temps d'un mot. La scène de la question (`components/student/game/session-stage.tsx`)
fait de même : pendant que Pio lit l'énoncé, et pendant la réaction à la
réponse (son, scène de réponse), le grand Pio « ask » est son affiche ; le clip
reprend quand la voix se tait, et seulement sur un appareil « full »
(`hooks/use-device-tier.ts`).

## L'affiche sous le clip : pour les poses quasi immobiles seulement

**Le trou au verdict (18 octobre 2026).** Au moment où la réponse est jugée,
la scène de la question passe du clip « ask » à l'affiche de la réaction, et
le son du verdict part dans la même tâche. Sur le simulateur iPhone 17, la
couche vidéo du clip HEVC s'éteignait avant que la page ait repeint : 200 à
300 ms de ciel vide à la place de Pio (film image par image). Ni précharger
l'affiche, ni retarder le démontage de la `<video>` n'y changeaient rien.
Depuis, l'affiche de la pose « ask » est montée SOUS la `<video>`, décodée sur
place (`decoding="sync"`) : elle prend le relais dans l'image même où la
vidéo s'éteint, sans passer par la page ; la scène demande en plus les
affiches des poses de la réaction dès que la carte est posée
(`preloadPioPosters`).

**Le Pio en double (même jour).** Ce correctif valait d'abord pour toutes
les poses, et l'écran de fin de palier a montré Pio EN DOUBLE sur l'iPhone :
le clip « cheer » saute, son affiche restait debout derrière lui. La règle
est donc : **l'affiche ne reste sous le clip que pour les poses déclarées
quasi immobiles** (`still` dans `OUTFITS`, `pio.tsx` ; `isPioStill()`),
aujourd'hui « ask » seule. Sous un clip qui bouge, rien : la `<video>` garde
son `poster` le temps du chargement, comme avant.

La mesure qui décide, pour chaque pose, est **la part de l'affiche que le
clip laisse à découvert** (alpha de l'affiche > 128 et alpha du clip ≤ 128),
image par image, en fraction de la silhouette : c'est ce que l'enfant verrait
en double. Avec ffmpeg, pour une pose :

```bash
ffmpeg -c:v libvpx-vp9 -i public/videos/pio/ask.webm -i public/images/pio/ask.png -filter_complex \
  "[0:v]alphaextract,format=gray,lut=y='if(gt(val,128),255,0)'[a];\
   [1:v]alphaextract,scale=572:800,pad=576:1024:2:128:black,format=gray,lut=y='if(gt(val,128),255,0)'[p];\
   [p][a]blend=all_mode=subtract,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null -
# YAVG / 255 par image, à diviser par la silhouette de l'affiche (même chaîne sur le PNG seul).
```

Au pire de chaque clip (18 octobre 2026) : `hello` 1,2 %, `sleep` 3,8 %,
`ask` 5,7 % (la tête qui tourne : un à deux pixels de bord à la taille de la
scène), `idle` 6 %, `sad` 8 %, `encourage` 8 %, `amazed` 13,5 %, `think` 14 %,
`walk` 17 %, `cheer` 37 % ; boubou : `encourage` 1,9 %, `recite` 1,7 %,
`idle` 2,9 %, `salam` 7,8 %, `bravo` 13,7 %, `listen` 13 %, les marches 13 %.
Une pose ne passe dans `still` que si cette mesure reste de l'ordre de celle
d'« ask » ET qu'un écran en a besoin (un son part pendant que son clip joue
dans une tâche lourde) ; « ask » est la seule aujourd'hui.

**Pourquoi pas masquer l'affiche pendant que le clip joue** (événement
`playing`) et la remontrer quand il s'arrête : parce que la vidéo ne dit rien.
Mesuré sur l'iPhone 17 avec la sonde (`/dev/seance/?scene=fin-validee&sonde=1&son=1`,
un son qui part 2,5 s après l'écran de fin, sous le clip « cheer » monté) :
`[son] joue`, puis aucun `pause`, `suspend`, `waiting`, `stalled` ni `ended`
sur la vidéo, et le film ne montre ni vide ni arrêt du clip. Il n'y a donc
rien à quoi accrocher un retour de l'affiche ; et au verdict, le fil principal
est pris 250 ms (`[raf] max=248` au toucher de Valider), un retour par la page
arriverait de toute façon après le trou. Le trou du verdict est lié au
démontage du clip dans une tâche lourde, pas au son seul.

Vérifié après la correction (films sur le simulateur iPhone 17, images
extraites à 10 et 20 i/s) : fin de palier, « cheer » saute sans double ;
verdict d'une bonne réponse avec la voix (`?voix=1`, Valider pendant que le
clip « ask » joue), aucune image vide entre le clip et la scène de réponse.

## Le coffre au trésor : la même méthode, pour un objet

Le coffre de la fin de palier (`components/student/game-kit/coffre.tsx`) est le
deuxième clip du jeu. Il avait d'abord été fait en faces de CSS 3D
(`coque-coffre-3d.tsx`, supprimé) : du carton à côté du lionceau. Le
propriétaire (19 octobre 2026) l'a voulu « vraiment réaliste », avec « une petite
animation » : il est refait avec le studio, comme la pose `ask`.

| Fichier | Ce que c'est |
| --- | --- |
| `public/videos/coffre/ouverture.webm` | VP9 + alpha, 608 × 592, 2,5 s, 235 Ko (Android, Chrome, Firefox) |
| `public/videos/coffre/ouverture.mov` | HEVC + alpha, même clip, 261 Ko (iOS, Safari) |
| `public/images/coffre/ferme.webp` | la première image du clip (32 Ko) : l'affiche, et le coffre du palier manqué |
| `public/images/coffre/ouvert.webp` | la dernière image du clip (44 Ko) : l'état final |

**Comment il a été fait (19 octobre 2026, 1,0 à 1,5 $ en tout).**

1. **L'image fixe.** gpt-image-2 (le prix n'est pas publié, `size 1024x1024`), la
   pose `cheer` de Pio donnée en image de référence pour le rendu (3D soignée,
   couleurs saturées, lumière douce), sans lionceau dans la consigne : « A closed
   wooden treasure chest, centered in the lower middle of a square frame with empty
   space above it, three-quarter view seen slightly from above. Rendered as a
   polished 3D game asset in the same soft glossy 3D cartoon style as the lion
   mascot in the reference image […] Pure flat solid blue background (#0000FF) […]
   No lion, no character, no coins, no text. » Une variante photoréaliste (« Photorealistic
   3D render of a pirate treasure chest with physically based materials: thick aged
   oak planks […] polished brass-gold bands ») a été faite aussi : bois sombre,
   très belle, mais elle jurait avec le lionceau et les tuiles du jeu. Elle n'est pas
   gardée ; si le propriétaire la préfère, il faut refaire le clip depuis elle.
2. **La planche.** `node scripts/coffre-plate.mjs image.png planche.png` ramène
   le coffre à 600 pixels de large dans un cadre carré de 1024, le bas de la caisse
   à 905 pixels du haut : le haut reste libre pour le couvercle levé.
3. **Le clip.** Kling v3.0 (`klingai/kling-v3.0-i2v`, 5 s, 0,84 $, la planche en
   `referenceImage`, `generateAudio: false`) : « Fixed tripod shot, locked camera:
   no zoom, no pan, no push-in […] the curved lid swings smoothly upward on its back
   hinge and opens wide, then settles fully open leaning back, revealing a big heap
   of shiny gold coins and a few colourful gems […] The chest body stays perfectly
   still […] no light rays, no sparkles, no particles […] The background stays pure
   flat blue (#0000FF) the whole time. » Réussi au premier essai. Mesuré image
   par image (6 i/s, 30 images) : la caisse ne bouge pas (son bas reste à y = 847 sur
   960, son bord gauche à 198-204), le bleu du fond reste à (5, ·, 251-254), le
   couvercle part à 1,2 s, atteint le haut à 3,2 s, puis le clip est immobile. La
   lumière et les étincelles sont volontairement absentes du clip : un halo
   transparent se détoure mal sur du bleu, le CSS les peint.
4. **Le détourage et l'encodage.** `scripts/coffre-encode.sh clip.mp4` coupe de
   0,95 s à 3,85 s (un instant de coffre fermé, l'ouverture, un instant de repos),
   accélère de 20 % (le couvercle monte en deux secondes), recadre sur le coffre
   (760 × 740), détoure comme Pio (`colorkey` puis `despill`), ramène le cadre à
   608 × 592 et écrit les deux vidéos et les deux images fixes. Les images fixes
   sont les BORNES du clip, au pixel près : passer de l'une à l'autre ne se voit
   pas. L'encodeur HEVC alpha est celui de VideoToolbox : le script tourne sur macOS.

**Ce que fait `Coffre`.** Fermé (`open={false}`, le palier manqué) : l'image
fermée, un petit tremblement de cadenas. Ouvert : le clip, une seule lecture, sans
boucle, lancée après `startDelayMs` (le temps que le coffre entre) ; la lueur dorée
monte à 0,45 s, l'éclat de `Reward` part à 1,1 s, des scintillements brillent sur
l'or. À l'heure nominale de la fin du clip, la `<video>` est RETIRÉE et l'image
« ouvert » reste seule, SANS attendre l'événement `ended` : sur iOS, un son qui part
pendant un clip peut éteindre sa couche vidéo (la leçon de « ask », plus haut). Les
filets : lecture refusée, première image absente après 1,5 s, source illisible,
minuteur de sécurité : le coffre finit toujours ouvert. Sur un appareil « sobre »
(`useGameFeel`), pas de vidéo : un fondu du fermé à l'ouvert ; sous
`prefers-reduced-motion`, ouvert d'emblée, sans éclat. Pendant le clip, AUCUNE image
fixe n'est peinte dessous (un coffre fermé dessous ferait un couvercle fantôme là où
le couvercle vient de partir). La géométrie du cadre (`CADRE`, `coffreGeometry`) est
fixée par `coffre-encode.sh` : la caisse y fait 450 pixels de large, son bas est à
34 pixels du bas ; `size` est la largeur de la caisse, et une marge négative ramène
son bas sur la ligne de pose de Pio.

**Vérifié :** la séance factice (`/dev/seance/?scene=fin-validee` et `fin-manquee`)
dans Chromium sans fenêtre, de 344 à 390 px de large : la phase du composant, la
lecture du `.webm` (démarrage à 0,64 s, fin à 3,1 s), l'éclat, aucun débordement
horizontal causé par le coffre, aucune erreur de console ; les deux vidéos portent
bien leur canal alpha (`ffprobe`, `alpha_mode`, et `ContainsAlphaChannel` d'AVFoundation
pour le `.mov`, comme les clips de Pio). **Pas encore vu sur un iPhone** (WKWebView :
HEVC alpha, son qui part pendant le clip : `&son=1` de la séance factice).

**Refaire le coffre** : générer l'image (étape 1), la planche (2), le clip (3),
lancer `scripts/coffre-encode.sh <clip.mp4>` (4) ; si le cadre ou la coupe changent,
mettre à jour `CADRE`, `OUVERTURE_MS`, `LUEUR_MS` et `ECLAT_MS` dans `coffre.tsx`
(le test `components/student/game-kit/__tests__/coffre.test.tsx` les lit).
