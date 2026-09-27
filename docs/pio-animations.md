# Les animations de Pio : des vidéos, pas du code

Depuis septembre 2026, Pio ne bouge plus par framer-motion. Dans
l'application mobile (iOS et Android, Capacitor), chaque pose est un clip
vidéo de cinq secondes, en boucle, sans arrière-plan, généré sur OpenArt à
partir de la pose PNG officielle. Le composant `components/student/pio.tsx`
lit le clip de la pose demandée ; la carte
(`components/student/world/pio-walker.tsx`) le déplace le long du sentier
pendant que le clip `walk` marche sur place.

Sur le web, Pio est l'image fixe de la pose : le propriétaire a tranché que
les animations sont pour l'application mobile, et le site n'a pas à charger
17 Mo de clips. La détection passe par `hooks/use-native-app.ts`.

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
4. Ajouter la pose à `PioState`, `POSES`, `POSTERS` et `LABELS` dans `pio.tsx`.

Pour un nouveau mouvement d'une pose existante, seules les étapes 2 et 3
comptent.
