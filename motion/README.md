# Motion design de Jotna School

Vidéo de présentation de la solution, construite avec [Remotion](https://www.remotion.dev)
(des composants React rendus image par image). Format 1920 × 1080, 30 images par seconde,
environ 2 minutes, avec une voix off, la voix de l'application, une musique de fond et les sons
de l'application.

## Déroulé

| # | Scène | Durée | Ce qu'on voit |
|---|-------|-------|---------------|
| 1 | Ouverture | 6 s | Le logo, « Apprendre devient un jeu / une aventure / un réflexe », Pio qui salue, les quatre espaces |
| 2 | Le site | 12 s | La vraie landing de jotnaschool.com, parcourue section par section |
| 3 | L'école | 16 s | La fiche école : contrat, échéancier en 3 tranches, module Arabe & Coran, classes, import d'élèves et billets à codes |
| 4 | Les parents | 13 s | Le code de la famille, le tableau de bord, la progression, le rapport et l'e-mail envoyé au parent |
| 5 | Les professeurs | 14 s | Un PDF importé, les exercices générés par l'IA, la publication, la liste des élèves |
| 6 | Les élèves | 54 s | L'application iOS et Android : lancement, le Camp, le sentier des paliers, une question, le résultat, puis le module Arabe & Coran, où l'on entend la voix de l'application |
| 7 | Signature | 9 s | Les quatre espaces en récapitulatif, puis le logo, le slogan, jotnaschool.com |

Les scènes s'enchaînent par un balayage aux couleurs des formes de la landing.

## D'où viennent les images

- Les écrans des tableaux de bord et de l'application sont recréés en React à partir du code
  du dépôt : mêmes libellés, couleurs, icônes et mises en page. Ce ne sont pas des captures.
- La landing est une capture réelle du serveur de développement (`public/shots/landing-full.png`).
  Pour la refaire : lancer `pnpm dev` à la racine, puis `node scripts/capture-landing.mjs`.
  Si les sections changent de hauteur, reporter les valeurs affichées dans `src/scenes/Landing.tsx`.
- Pio est joué à partir des clips de l'application (`public/videos/pio/*.webm`, avec transparence).
  Aucun mouvement de Pio n'est codé en plus des clips.
- Les illustrations (savane, carte, chemin du Coran, Kaaba) et les sons `correct.mp3` et `badge.mp3`
  viennent du dossier `public` de l'application.
- Le souffle des transitions et le clic sont synthétisés (`public/sfx`).

Les noms, classes et chiffres sont des données de démonstration fictives, reprises de l'école de
démonstration du dépôt (`convex/testSeedsSchool.ts`).

Quelques écarts volontaires avec l'interface actuelle :

- la console d'administration sert d'« espace école », car il n'existe pas encore de console directeur ;
- la carte d'un enfant, côté parent, montre la moyenne (comme la page « Mes enfants ») plutôt que
  la case « Badges », qui affiche toujours « — » aujourd'hui ;
- l'icône de matière s'affiche en emoji, alors que la page Progression écrit encore le nom de l'icône.

## Le son

- **Voix off** : ElevenLabs, voix « Rachel – Clear and Engaging » de la bibliothèque
  (`or4EV8aZq78KWcXw48wd`), une voix de femme claire, calme et chaleureuse, en français
  standard. La voix convenait au propriétaire, mais sur `eleven_v3` il trouvait le ton robotique
  et voulait « un peu d'émotion ». Elle passe donc par `eleven_v4`, et chaque réplique porte une
  indication de ton entre crochets (`[warmly]`, `[cheerfully]`, `[softly]`…) que le modèle joue
  sans la prononcer. Les indications les plus appuyées (`[excited]`, `[delighted]`) faisaient
  monter la voix de 8 à 10 demi-tons : écartées. Onze répliques, chacune vérifiée par
  transcription (Scribe). Leur texte exact est dans `audio-src/voice-off/textes.tsv`, leur
  minutage dans `src/voice.tsx`.
- **Voix de l'application** : dans la partie Arabe & Coran, on entend Steve (« Soft and Calm »,
  `jfEwztGDkpbpy89xeku6`), la voix choisie le 5 octobre 2026 pour remplacer Omar, jugé trop
  robotique. Les répliques sont synthétisées avec les réglages de `convex/voice/elevenlabs.ts` :
  le français sur `eleven_v4`, le nom de la lettre sur `eleven_multilingual_v2`. Le cache de
  l'application n'a pas encore cette voix ; leur texte est dans `audio-src/voice-app/textes.tsv`.
  Les phrases dites sont sous-titrées à côté du téléphone.
- **Musique** : « Let's Play Africa » de Michael Ramir C., sur [Mixkit](https://mixkit.co/free-stock-music/tag/worldbeat/),
  sous la licence Mixkit pour la musique (usage commercial permis, sans attribution ; le fichier ne
  doit pas être redistribué seul). Elle est ralentie à 93 % pour durer exactement la vidéo, très
  basse (vers -32 LUFS), et baisse encore quand une voix parle. Le dépôt étant public, le morceau
  n'y est pas : `scripts/prepare-audio.sh` le télécharge depuis Mixkit au premier lancement.

Les voix brutes sont dans `audio-src/`. Sur un clone neuf, ou après un changement de durée de la
vidéo, ce script prépare les versions normalisées de `public/audio/` :

```bash
bash scripts/prepare-audio.sh 123.8   # durée de la vidéo en secondes (images / 30)
```

## Commandes

```bash
npm install
npm run studio    # aperçu interactif dans le navigateur
npm run render    # écrit out/jotna-school-presentation.mp4
```

`npm run studio` et `npm run render` copient d'abord les médias de l'application dans
`public/app` (dossier ignoré par git). Le dossier `motion/` a ses propres dépendances : il est
exclu du `tsconfig.json` et de l'ESLint du site.

## Licence de Remotion

Remotion est gratuit pour les particuliers et pour les entreprises de trois personnes au plus.
Au-delà, il faut une licence entreprise : voir <https://www.remotion.dev/license>.
