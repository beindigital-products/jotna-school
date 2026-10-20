# Les clips des scènes de l'instruction civique

Chaque scène de l'instruction civique du CI (`convex/paliers/games/civique.ts` : « Ta grand-mère te parle. », « Le feu est rouge pour toi. ») a un clip de cinq secondes. Il montre la situation, jamais le bon geste : un enfant de six ans ne lit pas encore la phrase, il voit ce qui arrive, et la voix de Pio lit l'énoncé. Les 41 clips ont été faits avec le studio le 20 octobre 2026, à la demande du propriétaire (« pour gérer tous ces cas-là »).

Ce document dit comment l'écran les joue, ce qui tient sur le premier écran d'un téléphone, comment ils ont été faits, ce qu'il faut regarder avant d'accepter une scène, et comment en ajouter ou en refaire une.

## Ce que voit l'enfant

Le QCM « Que fais-tu ? » (`civ-situation`) pose l'identifiant de la scène dans `payload.scene`. `ExercisePrompt` montre alors `SceneClip` au-dessus de l'énoncé, sur le même présentoir que l'image d'énoncé (un cadre blanc épais, une dalle de sable). Les autres gabarits civiques n'ont pas de scène à montrer : ils prennent des gestes de scènes différentes.

La règle est celle du grand Pio (`docs/pio-animations.md`) :

- **L'affiche est toujours là**, sous la vidéo : la première image du clip, décodée sur place. Si la couche vidéo s'éteint, l'enfant voit l'affiche, sans trou. Le clip est opaque : elle ne se montre jamais en double.
- **Le clip joue une fois, puis reste sur sa dernière image.** Rien ne raccorde sa fin à son début : une boucle ferait un saut toutes les cinq secondes pendant que l'enfant réfléchit.
- **Il attend la carte et la voix.** Il monte 700 ms après la carte (monter une vidéo pendant le ressort de la carte, c'est l'image qui coûte), et ne joue jamais pendant que la voix de l'énoncé charge ou parle : sur iOS, un son qui part coupe un clip muet. Si l'enfant relance la voix, le clip se met en pause. Mesuré avec une vraie voix dans Chromium : voix à 0,7 s, clip monté mais en pause à 1,2 s, lecture à 2,4 s quand la voix se tait, fin à 7,5 s. Au CI, la voix lit aussi les propositions (`docs/voix-des-tuiles.md`) : elle laisse la parole au clip entre l'énoncé et elles, pour que l'enfant voie la situation avant d'entendre ses choix. Une seule fois : « Écouter » ne rejoue pas le clip, et un clip refusé, cassé ou trop lent (plus de neuf secondes) ne retient pas la voix.
- **Il ne part seul que sur un appareil « full »** (`hooks/use-device-tier.ts`) et sans mouvement réduit. Sur un appareil modeste, ou pour un enfant qui a demandé moins de mouvement, l'écran montre l'affiche seule, rien n'est téléchargé, et un bouton rond orange (▶) lance la scène.
- **Le même bouton revoit la scène** (↻) une fois le clip fini. Un clip illisible laisse l'affiche, sans bouton ; une affiche absente cache tout le présentoir.
- **Il est décoratif pour un lecteur d'écran** : l'énoncé dit la même chose.

Vérifié le 20 octobre 2026 sur le simulateur iPhone 17 (Safari) : le clip joue, s'arrête sur sa dernière image avec le bouton ↻, et le toucher le relance depuis le début. Pas encore vu dans l'application native (WKWebView, WebView Android).

## Les fichiers

| Fichier | Ce que c'est |
| --- | --- |
| `public/videos/scenes/<id>.mp4` | H.264, 768 × 512, 24 images par seconde, 5,17 s, sans piste son, 112 à 310 Ko (6,95 Mo pour les 41) |
| `public/images/scenes/<id>.webp` | l'affiche : la première image du clip encodé, 768 × 512, 30 à 57 Ko (1,69 Mo pour les 41) |
| `lib/scene-clips.ts` | le catalogue fermé des 41 identifiants (`po1` à `po11`, `ec1` à `ec10`, `en1` à `en10`, `ro1` à `ro10`) et les chemins |
| `components/exercises/SceneClip.tsx` | le composant, et `payloadScene()` qui lit `payload.scene` |
| `convex/paliers/exerciseRules.ts` | `sanitizePayload` laisse passer `scene` vers l'écran (il n'y a pas de réponse à cacher) |
| `scripts/scene-clip-encode.sh` | encode un clip du studio et écrit l'affiche |
| `app/dev/exercices/specimens.ts` | le spécimen `qcm-scene` de la galerie (`/dev/exercices/?type=qcm-scene`, `/dev/seance/?exo=qcm-scene`) |

Les fichiers sont ceux du site : ils partent dans l'application et jouent hors ligne. Les originaux du studio (41 Mo en 1152 × 768 avec la piste son de H3, et les images fixes en 1536 × 1024) ne sont pas dans le dépôt.

Tests : `lib/__tests__/scene-clips.test.ts` (une scène a son clip et son affiche, aucun fichier orphelin, le catalogue est celui de `civique.ts`, chaque MP4 est du H.264 de 768 × 512 sans piste son avec son index au début), `components/exercises/__tests__/SceneClip.test.tsx` (le composant) et le bloc « le clip de la scène » de `convex/__tests__/ciCivicsTemplates.test.ts` (le clip est celui de la scène que l'énoncé raconte, sur les 240 tirages).

## Le premier écran

Le clip prend la place des tuiles. `session-stage.tsx` tient un budget pour le premier écran (Pio, sa bulle, l'énoncé, toutes les tuiles d'un QCM, le dock) : avec un clip, ce budget ne tient plus sur un téléphone. La hauteur du cadre suit donc l'écran :

| Écran (hauteur) | Cadre du clip |
| --- | --- |
| 961 px et plus, largeur 640 px et plus (tablette) | 14 rem (336 × 224) |
| 961 px et plus, plus étroit | 10 rem (240 × 160) |
| 668 à 960 px (la plupart des téléphones) | 9 rem (216 × 144) |
| 601 à 667 px (360 × 640, iPhone SE) | 6,5 rem (156 × 104) |
| 481 à 600 px (320 × 568) | aucun clip : la première tuile passerait sous le dock |
| 480 px et moins (téléphone couché) | 5 rem (120 × 80), à côté de l'énoncé |

Mesuré avec `node scripts/shoot-exercises.mjs --seance --seance-types qcm-scene --tous-appareils` (Chromium, encoches simulées), sur la plus longue des 41 situations (`ro8`, trois tuiles de deux lignes). Marge entre la tuile et le dock : la première réponse, puis la dernière.

| Écran | Première réponse | Dernière réponse |
| --- | --- | --- |
| 360 × 640 | 44 px | déborde de 135 px |
| 375 × 667 | 94 px | déborde de 85 px |
| 390 × 844, encoche 47 | 27 px | déborde de 152 px |
| 402 × 874, encoche 62 (iPhone 17) | 67 px | déborde de 112 px |
| 412 × 840 (WebView Android) | 124 px | déborde de 55 px |
| 412 × 915 | 187 px | tient, 8 px |
| 820 × 1180 (tablette) | 262 px | tient, 102 px |
| 667 × 375 (téléphone couché) | 7 px | déborde de 163 px |

**Ce qui est acquis :** la première réponse est visible partout, et sans clip les trois tuiles tiennent de 375 × 667 à 412 × 915. **Ce qui ne l'est pas :** avec le clip, les deux dernières tuiles se font défiler sur un téléphone (de 55 à 152 px), alors que le budget de `session-stage.tsx` demande que toutes les tuiles d'un QCM tiennent. Le levier qui reste est Pio : à 390 × 844, son buste prend 135 px, et la variante des petits téléphones (17 % de la hauteur, 124 px au plus) en rendrait 64. Il faudrait le décider dans la coque de la séance, pas dans le composant du clip.

## Comment les clips ont été faits

**1. L'image fixe de chaque scène.** `openai/gpt-image-2` (le prix n'est pas publié, l'estimation du studio rend `null`), `size 1536x1024`, `mode manual`. Jusqu'à quatre images de référence, des PNG de 1,4 Mo au plus (le studio refuse plus gros ; un `.jpg` est lu comme `image/jpg` et refusé par OpenAI ; un `.jpeg` est refusé par le studio) :

- `public/images/pio/cheer.png` pour le style seul (« Use the first reference for STYLE ONLY: do not draw the lion ») ;
- Awa et Moussa, en PNG de 1024 pixels, pour que leurs vêtements ne changent pas d'une scène à l'autre. Awa : tresses, robe jaune à liseré vert, sac vert en bandoulière. Moussa : cheveux courts bouclés, tee-shirt vert, short vert, tongs vertes ;
- pour une classe, une classe déjà réussie, donnée comme référence de la MISE EN PAGE seule.

Le texte commun : « Polished 3D cartoon game illustration, in the same soft glossy 3D style as the lion mascot in the first reference image (rounded friendly shapes, warm saturated colours, soft natural light). […] Sunny Senegal, friendly African people with brown skin, simple everyday clothes. Wide shot, whole scene readable at a glance, nothing cropped. No text, no letters, no numbers, no signs, no logos. » Puis la scène en quelques phrases, et pour les personnages : « Awa is identical to the second reference image (braided hair, yellow dress with green trim, green shoulder bag) ».

**2. Le clip.** `minimax/minimax-h3`, image vers vidéo, `mode manual`, `duration 5`, **`resolution "768p"`**, l'image fixe en JPEG de 300 à 400 Ko en `referenceImage`, `outputDir` dans le dossier de la scène. Le modèle rend du 1152 × 768 avec une piste son (`generateAudio` n'a aucun effet). Prix : 0,08 $ par seconde, soit 0,40 $ le clip. Sans `resolution`, ou avec « 720p » qui n'est pas un palier de H3, le studio facture le palier 2K à 0,13 $ par seconde (0,65 $) et rend du 2176 × 1440 : trois clips pilotes (`po1`, `ro1`, `ro6`) ont été faits ainsi, et sont rendus en 768 × 512 comme les autres.

Le prompt de mouvement tient en une phrase par personnage, précédée de « Fixed locked camera, no zoom, no pan, no push-in. » et suivie de « Calm, no sudden movement. » : sans cela, H3 invente un mouvement de caméra. Il décrit ce qui se passe AVANT le bon geste, jamais le geste.

**3. L'encodage.** `scripts/scene-clip-encode.sh <id> <clip.mp4>` : recadrage au centre en 3:2, 768 × 512, H.264 profil main, CRF 28, `-tune animation`, `+faststart`, sans piste son ; puis l'affiche, première image du clip ENCODÉ, en WebP. Un CRF 28 en 768 × 512 pèse 110 à 320 Ko par clip contre 0,6 à 1,3 Mo pour l'original, et à 100 % d'échelle (une moto, de la poussière) on ne voit pas la différence avec la source réduite. La piste son est retirée : la voix de Pio lit l'énoncé, et un son de plus la couvrirait.

**Le coût (20 octobre 2026) :** 17,95 $ de vidéo (40 clips à 0,40 $, dont deux refaits, `ec4` et `po11`, plus trois pilotes à 0,65 $) et 57 images fixes, facturées aux jetons : le total se lit sur le tableau de bord de la passerelle IA de Vercel. La passerelle refuse toute vidéo sous un solde de 10 $.

## Ce qu'il faut regarder avant d'accepter une scène

Le propriétaire a corrigé les images de classe deux fois (20 octobre 2026), et deux images montraient la réponse. Avant de payer un clip, regarder l'image fixe en pleine taille :

- **Une classe est logique.** Le tableau sur le mur de GAUCHE, TOUS les bureaux avec leur plateau vers la gauche et TOUS les élèves assis de profil face au tableau, y compris ceux du premier plan, un bureau devant chaque élève, la porte et les fenêtres sur les autres murs, la maîtresse devant le tableau. Un élève peut regarder dehors, ou se retourner exprès (`ec3`, `en10`). Le texte seul n'y suffit pas : le modèle dessinait les deux élèves du premier plan de face, derrière un bureau tourné vers l'objectif. Ce qui a marché : une bonne classe donnée en quatrième référence (« copy the room layout and the camera angle of the fourth reference ONLY »), les élèves de la scène posés dans une rangée de bureaux.
- **L'image ne montre pas le bon geste.** `ec4` (« Je me mets calmement en rang ») : la première image rangeait les enfants en file ; ils jouent maintenant dans toute la cour. `ro3` (« Je traverse sur les bandes blanches ») : la première image montrait le passage piéton ; la route est maintenant lisse.
- **La route est sûre.** Sous un feu vert pour le piéton (`ro2`), la voiture attend AVANT les bandes, pas dessus. Sous un feu rouge, elle peut passer.
- **Le décor est logique.** Chez elle (`po11`), Awa ne porte pas son sac en bandoulière.
- **Aucun texte, aucune écriture.** Même sur un tableau : un dessin à la craie (un arbre, un soleil), pas de lettres.

## Ajouter ou refaire une scène

1. Écrire la scène dans `SCENES` (`convex/paliers/games/civique.ts`), avec son identifiant : les lettres du thème (`po`, `ec`, `en`, `ro`) et un numéro.
2. Ajouter l'identifiant à `SCENE_CLIP_IDS` (`lib/scene-clips.ts`), dans l'ordre de la table. Le test refuse l'un sans l'autre, et refuse une scène sans fichier.
3. Faire l'image fixe (étape 1 plus haut), la regarder (liste précédente), faire le clip (étape 2), le regarder image par image.
4. `scripts/scene-clip-encode.sh <id> <clip.mp4>`. Il demande `ffmpeg` avec `libx264`, `ffprobe` et `cwebp` (`brew install webp`).
5. `npx vitest run lib/__tests__/scene-clips.test.ts components/exercises convex/__tests__/ciCivicsTemplates.test.ts`.

Pour refaire un clip, seules les étapes 3 et 4 comptent : le script remplace le MP4 et l'affiche, et le changement se voit tout de suite, parce que les exercices ne gardent que l'identifiant de la scène. Une scène ajoutée n'apparaît qu'après `pregen:invalidate` et `pregen:run` : un palier déjà généré garde ses exercices.

## Les prompts de mouvement

Écrits avec le texte commun en tête et en queue (voir plus haut). `po1`, `ro1` et `ro6` sont des pilotes en 2K : leur prompt n'a pas été gardé.

- `po2` : The elderly man walks slowly forward along the pavement, leaning on his cane, and comes a little closer. The boy stands still on the pavement and slowly turns his head to follow him with a curious look.
- `po3` : The elderly woman keeps walking slowly under the weight of the huge basket, sometimes shifting it on her hip and letting out a tired breath. The girl stands still on the pavement and watches her with a curious look.
- `po4` : The father and the neighbour keep talking, nodding and gesturing with their hands, taking turns to speak. The little girl stays beside her father, looks from one man to the other and shifts her weight, her mouth closed.
- `po5` : The school director smiles and waves his raised hand in a friendly greeting, then lowers it, still smiling. The boy stands still in front of him with his school bag, looking up at him. A light breeze moves the leaves of the baobab.
- `po6` : Steam rises gently from the big bowl of rice and fish. The boy looks at the food and smiles, licking his lips, his hands resting on his knees. The family around the bowl smiles and waits.
- `po7` : The girl stretches her arms up and yawns widely, then lowers her arms and rubs her eyes. Sunlight shines through the window, the curtains move gently, and outside the rooster crows.
- `po8` : The boy turns the crumpled candy wrapper between his fingers, looks at it, then glances around the courtyard. Children play far in the background.
- `po9` : The girl stands on the doorstep, adjusts the strap of her bag on her shoulder and looks around the room with a tired, happy smile. Sunlight and a few dust motes drift gently in the doorway.
- `po10` : The boy slowly opens the cover of the brand-new notebook, flips through its clean pages and smiles proudly.
- `po11` : The girl sets the doll down on the mat among the other toys, looks around the room and smiles, satisfied. A soft light moves slightly through the window.
- `ec1` : The boy stretches one arm up, smiles, and glances at the window where the rooster crows; sunlight moves slowly across the room.
- `ec2` : The girl keeps walking along the sandy path towards the school, her bag bouncing lightly on her back; the other children walk ahead of her; a light breeze moves the trees.
- `ec3` : The boy stays in the open doorway catching his breath, one hand on the door frame, looking into the classroom. Several pupils turn their heads back over their shoulders toward him, and the teacher lowers her pointer and turns her head toward the door.
- `ec4` : The teacher swings the brass bell, ringing it; the children playing in the yard pause and a few turn their heads toward the bell while the others keep playing.
- `ec5` : The teacher stands in front of the blackboard and gestures with one open hand, asking her question to the class. The girl at the front desk, in profile, leans forward eagerly with bright eyes, both hands flat on her desk, thinking hard. The other pupils stay seated in profile, looking at the teacher.
- `ec6` : The teacher draws one more chalk line on the tree on the blackboard, then turns her head and speaks to the class with a gentle gesture of her free hand. The pupils stay seated at their desks in profile, almost still.
- `ec7` : The girl stands still in the middle of the classroom, looking down at the open book lying on the floor, then blinks and glances up at the other pupils. The seated pupils in profile keep reading quietly at their desks.
- `ec8` : The boy holds the football against his hip with one hand, catches his breath after playing and wipes his forehead with the other hand, then glances down at the ball. In the doorway behind him the teacher stands watching calmly.
- `ec9` : The girl licks her lips happily, then looks at the empty candy wrapper in her hand and turns it over, curious. Other children chat and play in the background.
- `ec10` : The boy rests his chin on his hand and gazes through the window at the children playing football outside, sighs, and swings his feet under his chair. The teacher keeps drawing on the blackboard with her back to the class; the other pupils keep writing quietly in profile.
- `en1` : The boy sitting on the ground holds his scraped knee and winces, his eyes wet with tears. The girl standing nearby looks at him with wide worried eyes, one hand on her bag strap. In the background the other children keep playing.
- `en2` : The boy sits on the bench holding his bread in both hands and glances at his friend; the friend sits beside him with a sad face, looking down at his hands and sighing, his empty blue lunch box next to him. In the background children play.
- `en3` : The girl in the pink shirt searches inside her open bag on her desk with a worried frown, then looks up. The boy in the green shirt at the next desk lifts his head from his notebook, holding his pencil, and looks at her. The other pupils keep writing quietly in profile, facing the blackboard.
- `en4` : The three boys keep kicking the ball back and forth between them, running lightly. The girl stands at the left edge, watching the game with a hopeful look and shifting her weight from one foot to the other, hands on her bag strap.
- `en5` : The girl in the yellow dress jumps over the rope while her friend turns it, both laughing. The boy standing at the left watches them with a hopeful smile and a small shy sway.
- `en6` : The teacher gestures with both open hands and smiles, speaking to the class. The pupils sit at their desks, facing the teacher and the blackboard, and look at her with interest.
- `en7` : The boy scratches his head, sighs and frowns at his open notebook. The girl behind him leans forward a little and looks at his notebook with a worried face, her hand on her chin. The other pupils keep writing quietly in profile.
- `en8` : The boy sitting on the low wall rubs his eye with one hand, his shoulders shaking softly. The girl standing near him looks at him with a worried face, her hands clasped at her chest. A light breeze moves the leaves of the tree.
- `en9` : The boy keeps his foot on the single football while the other children crowd around him, smiling, hands out, waiting eagerly for the ball.
- `en10` : At the door, the teacher gently pats the shy new boy's shoulder; he fidgets with his bag strap and looks down. The pupils in the classroom, turned around on their chairs, look at him with curious smiles.
- `ro2` : The green pedestrian light glows steadily. The yellow taxi and the motorbike behind it wait, stopped before the crossing. The girl at the curb watches the road with her hands on her bag strap; the woman and the boy chat on the right sidewalk.
- `ro3` : The boy stands at the edge of the sidewalk with his arms at his sides and watches the road while the yellow taxi, a blue car and a minibus drive slowly past. A light breeze moves the trees.
- `ro4` : The girl stands still at the edge of the sidewalk, one hand on her bag strap, with a faint smile. The woman and the boy walk slowly along the opposite sidewalk on the right. A light breeze moves the palm leaves and the tree.
- `ro5` : The boy stands on the sidewalk with his backpack. A red car and a yellow taxi drive by on the road beside him; people walk along the sidewalk in the distance.
- `ro7` : The three boys kick the ball back and forth in the road, laughing. The girl stands on the sidewalk watching them, hands on her bag strap.
- `ro8` : The mother across the road waves with a smile; the girl stands by the school gate and lifts her hand in a small wave. A yellow taxi and a blue car drive past on the road.
- `ro9` : The motorcycle rides fast along the dirt road, raising a trail of dust; the boy standing on the sidewalk turns his head toward the noise. (La fin est « Smooth, natural motion. » à la place de « Calm, no sudden movement. »)
- `ro10` : The girl stands on the sandy verge beside the dirt road, looking down the road; far away the donkey cart and the yellow taxi move slowly, and light dust drifts in the sunlight.

## Ce qui n'est pas fait

- **Un seul gabarit montre un clip** : `civ-situation`. Les tris, l'intrus, l'association, les suites et les trous prennent des gestes de scènes différentes ; une scène à montrer n'y aurait pas de sens.
- **Pas de son.** La voix de Pio lit l'énoncé ; les clips sont muets.
- **Pas de boucle.** Les clips ne finissent pas comme ils commencent : ils jouent une fois.
- **Les exercices déjà fabriqués n'ont pas de scène.** Un exercice « Que fais-tu ? » généré avant cette version n'a pas de `payload.scene`, donc pas de clip, jusqu'à `pregen:invalidate` et `pregen:run`.
- **Pas vu dans l'application native**, seulement dans Safari sur le simulateur et dans Chromium.
