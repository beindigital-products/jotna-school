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

## La publicité « Jotna, c'est gratuit »

Version courte (16:9, 1540 images, 51 s) à envoyer comme publicité : composition `JotnaAd`,
code dans `src/ad/Ad.tsx`, qui réutilise les écrans, Pio, le logo et les transitions de la
présentation.

| Scène | Durée | Ce qu'on voit | Voix |
|-------|-------|---------------|------|
| Accroche | 4 s | « Et si apprendre devenait un jeu ? », Pio qui salue | « Et si apprendre devenait un jeu ? » |
| Les téléphones | 12,7 s | Un iPhone et un Android côte à côte : le sentier des paliers, une question, le camp, le palier validé | « Voici Jotna School : une application pour les enfants, sur Android… et sur iPhone. » puis les étoiles et les trophées |
| Arabe & Coran | 9 s | Le chemin du Coran ; la voix de l'application dit « Salam ! » | « Elle leur parle, même en arabe. Écoutez. » |
| Tout le monde | 9 s | Parents, professeurs, école | Les trois rôles, une phrase chacun |
| Gratuit | 7,7 s | « GRATUIT » en grand, pour les écoles, les professeurs et les parents | « Et le meilleur ? C'est gratuit ! » |
| Fin | 9 s | Logo, « Apprendre devient un réflexe », « Créez votre compte gratuit », jotnaschool.com | « Jotna School. Apprendre devient un réflexe. Créez votre compte gratuit sur jotnaschool.com ! » |

- **Gratuité** : le texte reprend ce que dit la landing (« Gratuit, ouvert aux écoles, professeurs et
  parents », `components/landing/hero.tsx`) et l'interrupteur `FREE_ACCESS` de `convex/accessRules.ts`.
  Si l'accès redevient payant, retirer les scènes « Gratuit » et la fin « compte gratuit ».
- **Plateformes** : la fin et la pastille parlent d'Android et d'iPhone sans logo de boutique, car
  l'application n'est pas sur l'App Store (voir `docs/capacitor-ios.md`).
- **Voix** : les mêmes que la présentation (Rachel, `eleven_v4`, un tag de ton par phrase), textes
  dans `audio-src/voice-ad/textes.tsv`. La première phrase a été régénérée jusqu'à ce que
  Scribe transcrive « Jotna School » correctement. La réplique de l'application est celle de la
  présentation (`voice-app/map_welcome`).
- **Musique** : même morceau Mixkit, coupé à la durée de la pub (sans changer de tempo), à -32 LUFS et
  à -39 LUFS sous une voix.

```bash
bash scripts/prepare-audio-ad.sh 51.34   # voix normalisées et musique coupée
npm run render:ad                        # écrit out/jotna-pub-gratuit.mp4
```

## Campagne réseaux sociaux : 40 publications du 19 octobre au 7 novembre 2026, plus une banque

**Deux publications par jour, jamais plus** : une publicité à 12 h 30 (heure de Dakar) et un mini-cours pour enfants à
19 h 30. Les cours tournent sur les classes : CI, CP, CE1, CE2, CM1, CM2, puis Arabe & Coran, et on recommence.
43 vidéos verticales (1080 × 1920, **une minute au moins chacune**, de 60 à 115 s) et 4 carrousels (1080 × 1350).
Tout part d'un seul fichier de contenu.

| Classe | Cours (soir) | Publicité (midi, 1re semaine) |
|--------|--------------|-------------------------------|
| CI | Les nombres de 1 à 5 · Les couleurs · Les formes | Pas de clavier, Pio lit la consigne |
| CP | Grave ou aigu · Les voyelles · Les jours de la semaine | Pio lit la consigne |
| CE1 | L'addition avec retenue · Les saisons au Sénégal · Dizaines et unités | 4 paliers, réponses courtes |
| CE2 | La table de 7 · Le pluriel des noms · Les mammifères | 4 paliers, les 10 types d'exercices |
| CM1 | Les fractions · Le cycle de l'eau · Le présent des verbes en -er | 5 paliers par thématique |
| CM2 | Le Sénégal et ses voisins · Périmètre et aire · Les pourcentages | 5 paliers, aussi pour réviser en 6e |
| Arabe & Coran | La lettre jîm · Bâ, tâ, thâ | Lettre après lettre (module activé par l'école) |

Du 2e au 3e semaine, le créneau de midi alterne publicités, explicatifs et tutoriels (palier, étoiles, Pio ne gronde jamais,
inscription et suivi pour les parents, du PDF aux exercices pour les professeurs, pub écoles, pub professeurs, pub finale).
**Banque de contenus bonus** : 3 vidéos (les 10 types d'exercices, se repérer dans l'app, l'app qui écoute en Arabe & Coran)
et 4 carrousels, à publier de façon aléatoire et régulière **à la place** d'une publicité (une par semaine environ), jamais en plus.
Le planning (dates, heures, légendes des trois réseaux) est dans `out/social/calendrier.md` et `calendrier.csv`.

```bash
npm run social:build     # écrit src/social/posts.json (contenu, voix, légendes, planning) à partir de scripts/build-posts.mjs
ELEVENLABS_KEY_FILE=/chemin/cle npm run social:voices   # voix ElevenLabs, durées, musique (cache : une réplique faite n'est pas refaite ; sans voix manquante, la clé n'est pas lue)
npm run social:render    # écrit out/social/ : vidéos, cartes, calendrier.csv et calendrier.md
node scripts/render-social.mjs --only d03      # un seul jour
node scripts/render-social.mjs --still ID:120  # image de contrôle
node scripts/render-social.mjs --check         # durées : chaque vidéo doit faire au moins 60 s
node scripts/render-social.mjs --plan --start 2026-10-26   # recaler le planning
```

- **Contenu** : `scripts/build-posts.mjs`. Une publication = des plans (`hook`, `pio`, `phone`, `bullets`, `steps`,
  `stat`, `board`, `quiz`, `letter`, `free`, `cta`, `outro`) avec leurs répliques ; la durée de chaque plan vient de la voix.
  Le planning est la liste `SCHEDULE` (et la banque `BANK`) en fin de fichier. Les légendes sont composées à partir d'une accroche et d'un texte.
- **Voix** : Rachel (`eleven_v4`) pour les publicités, explicatifs et tutoriels ; Steve, la voix de Pio dans l'app, pour les
  cours d'enfants. Le nom de la lettre arabe est dit en `eleven_multilingual_v2` (la v4 le dit mal).
- **Pas de sous-titres de voix** (consigne du propriétaire) : un sous-titre qui apparaît 2 s puis disparaît gêne. Le texte
  à l'écran (titres, listes, tableaux, questions) porte l'information.
- **Fond sombre (vidéos du Coran)** : tous les textes posés sur le fond passent en clair (titres blancs, légendes claires,
  mauvaises réponses en verre dépoli) ; jamais de texte noir sur le fond nuit.
- **Cours pour enfants** : accroche avec la classe (« Salut les CM1 ! »), bandeau « CM1 · Mathématiques » sur tous les plans,
  objectif, une à trois leçons au tableau, trois questions avec le temps de réfléchir, récapitulatif, au revoir amusant
  (« à la prochaine vidéo, à bientôt »). **Aucune vidéo pour enfants ne parle d'inscription**, ni pour l'enfant ni pour ses
  parents (consigne du propriétaire, risque juridique) ; leurs légendes n'invitent pas non plus à créer un compte.
- **Règles de fond** (fiche vérifiée dans le dépôt, puis consignes du propriétaire) : l'offre se dit toujours
  « gratuit pendant le lancement pour l'année scolaire 2026-2027 », et jamais « pour toujours » (`FREE_ACCESS` est un
  interrupteur) ; l'application iOS/Android n'est pas annoncée comme disponible (la landing dit « à venir ») ;
  Arabe & Coran est présenté comme un module activé par l'école ; chiffres permis : 7 matières, CI au CM2, paliers de
  10 exercices, 7/10 pour valider, 50 bonnes réponses par niveau, plus de 20 badges, 10 formats d'exercices.
- **Zones de sécurité** : le texte important reste hors du haut (170 px), du bas (420 px) et du bord droit (130 px),
  que recouvrent les interfaces de TikTok, Reels et Facebook.

## Licence de Remotion

Remotion est gratuit pour les particuliers et pour les entreprises de trois personnes au plus.
Au-delà, il faut une licence entreprise : voir <https://www.remotion.dev/license>.
