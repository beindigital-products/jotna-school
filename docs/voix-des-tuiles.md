# La voix des tuiles (CI et CP)

Au CI, l'enfant ne lit pas encore les réponses. Le lecteur de consignes lui dit
déjà l'énoncé (`docs/paliers-et-exercices.md`, « Le lecteur de consignes »),
mais « le chat », « la girafe » ou « je dis bonjour » restent écrits. Le
20 octobre 2026, le propriétaire a demandé que Pio lise aussi les propositions,
et qu'il les relise quand l'enfant en touche une. Cette page dit ce que
l'enfant entend, ce que Pio ne dit jamais, et où se trouve chaque pièce.

## Ce que l'enfant entend

- **Tous les écrans disent leurs propositions** (depuis le 26 octobre 2026) :
  QCM, association, mise en ordre, glisser-déposer, phrase à trous. Après la
  consigne, Pio dit les propositions une à une, dans l'ordre de l'écran. La
  tuile qui parle s'entoure d'un anneau ciel qui respire, pour que l'enfant
  relie ce qu'il entend à ce qu'il voit. À la phrase à trous, Pio dit d'abord
  la phrase (le trou est une pause), puis les mots du trou actif.
- **Toucher une tuile la dit.** Au QCM, à l'association, à la mise en ordre, au
  glisser-déposer et à la phrase à trous, toucher une tuile la choisit ET la
  dit. Un second toucher sur la même tuile la redit. Au glisser-déposer,
  saisir une étiquette la dit aussi, et toucher une case quand aucune étiquette
  n'est en main dit son nom. À la mise en ordre, saisir une étiquette par sa
  poignée la dit. À la phrase à trous, toucher la carte de la phrase la redit.
- **L'anglais se dit aussi** (CI et CP). Chaque tuile est dite dans SA langue
  (`tileLanguage`, `convex/voice/tiles.ts`) : un mot anglais avec la voix
  anglaise (`voiceFor(config, "en")`), l'étiquette française d'une case ou la
  colonne française d'une association avec la voix française. Un signe de calcul
  se dit en anglais pour une tuile anglaise (« eight equals », pas « eight
  égale »). La voix anglaise est, par défaut, celle des consignes avec le modèle
  multilingue ; `ELEVENLABS_EN_VOICE_ID` et `ELEVENLABS_EN_MODEL_ID` la changent.
  **Elle n'a pas été écoutée** : à auditionner avant de s'y fier.
- **Un toucher coupe la file.** L'enfant n'attend jamais la fin de la lecture
  pour répondre. Elle se tait dès qu'il a répondu, ou quand une fenêtre s'ouvre.
- **« Écouter » et Pio redisent tout**, la consigne puis les propositions ; un
  second toucher arrête. Pendant un mot dit au toucher, « Écouter » relit tout
  au lieu de couper ce mot : l'enfant qui touche le bouton veut entendre.
- **Une scène du CI : la consigne, le clip, puis les propositions.** Le clip ne
  part jamais pendant une voix (sur iOS, un son coupe une vidéo muette). Sans
  règle, il partirait après les propositions, quand l'enfant a déjà choisi. La
  file lui laisse donc la parole entre la consigne et les propositions : l'enfant
  voit la situation que Pio vient de dire, puis entend ses choix. Une seule fois :
  « Écouter » ne rejoue pas le clip. Un clip qui ne part pas seul (appareil
  sobre, mouvement réduit), qui est refusé par le navigateur ou cassé ne retient
  pas la voix, et la file n'attend jamais plus de neuf secondes.
- **La tuile qui parle vient dans l'écran.** Sur un téléphone, les dernières
  tuiles d'un QCM passent sous le dock quand un clip de scène prend leur place.
  La tuile dite défile du minimum, entre l'en-tête collant et le dock.

## Ce que Pio ne dit jamais

| Cas | Pourquoi |
| --- | --- |
| Un énoncé qui demande de lire ou de décoder (`READING_PROMPT`, `DECODING_PROMPT`, `lib/item-pictures.ts`) | Dire la tuile, c'est lire à la place de l'enfant. |
| Un énoncé qui demande une traduction, HORS d'une thématique d'anglais | Les tuiles seraient des mots anglais, et la voix française les dirait faux. Dans une thématique d'anglais, elles se disent avec la voix anglaise. |
| Une tuile d'une seule lettre | C'est du déchiffrage, même quand l'énoncé ne le dit pas (« Complète le mot : ba_ane »). |
| Un exercice qui fait compléter un mot : un trou collé à des lettres (« ba___ne », « ___ngue »), dans l'énoncé ou dans la phrase à trous | Les tuiles sont des lettres, des syllabes ou des sons : les dire, c'est déchiffrer à la place de l'enfant. Un trou entre deux espaces (« Le ___ miaule ») complète une phrase : il se dit. |
| Une tuile qui n'est que des émojis ou des signes | Il n'y a rien à dire. |
| Une autre classe que le CI et le CP | `TILE_VOICE_CLASSES`. |

Les images de tuile ont la même porte (`PICTURE_TILE_CLASSES`). Les trois
listes, avec celle de la voix des consignes (`READING_LEARNER_CLASSES`), sont
indépendantes : changer l'une ne change pas les autres.

## Comment c'est fait

- **`convex/voice/tiles.ts`** est un module pur, partagé par le serveur et
  l'écran. Il porte la porte (`isTileVoiceClass`, `isEnglishTopic`,
  `promptForbidsTileVoice`), la liste des tuiles de chaque type (`tileTextsOf`,
  `sentenceOf`), le texte dit (`speakableTile`) et la décision du serveur
  (`tileClipVerdict`).
- **Le serveur ne synthétise que ce que l'exercice contient.** La requête
  `{ kind: "tile", exerciseId, text }` (`convex/offline/contract.ts`) porte
  l'exercice ET le texte. `offline/voice:prepareClips` vérifie que l'élève a
  droit à l'exercice (la garde de la consigne) puis que `text` est une tuile,
  ou la phrase, de CET exercice. Sans cela, « dis ce que je te donne » ferait
  du dépôt un générateur de voix gratuit.
- **Le son est celui de la consigne** : même voix, même cache
  (`arabicAudioClips`), mêmes caractères comptés. Le texte dit est celui de
  `speakablePrompt` (émojis retirés, trou en pause, signes de calcul en
  français), et c'est aussi la clé du cache : « le chat » est synthétisé une
  fois pour tous les exercices et tous les enfants.
- **L'écran** : `PromptReaderProvider` reçoit `tileVoice` (la séance le pose
  pour le CI, hors anglais). Chaque écran range ses tuiles avec
  `useTileVoice(tuiles, énoncé, options)` et lit `speaking` pour allumer la
  tuile (`Tile3D`, `DropBox`). L'option `autoRead` allume la file : le QCM et
  la phrase à trous la veulent, les écrans de manipulation non. Les rangs sont
  ceux de l'écran : à l'association, la gauche puis la droite ; au
  glisser-déposer, les étiquettes puis les cases ; à la mise en ordre, l'ordre
  de l'énoncé, pas celui de l'escalier.
- **Le clip d'une scène** (`SceneClip`) se range dans le lecteur
  (`registerMedia`) et lui demande de l'attendre (`turn: "media"`). `SceneClip`
  garde sa règle : il ne joue jamais pendant une voix, sauf pendant ce tour.
- **Une tuile sans son reste au repos.** L'URL de chaque tuile se garde par
  texte pour la durée de la page. Sans réseau et sans le son dans l'appareil,
  la tuile ne s'allume pas et se choisit quand même. L'écran ne demande jamais
  un son que le serveur refuserait (émojis, lettre seule).

## Hors ligne

L'application télécharge les tuiles avec les consignes
(`OfflineSync.neededClips`). Un son par texte : la clé de l'appareil est
`tile:<texte>`, et deux exercices qui proposent le même mot partagent le
fichier. L'appareil et le serveur décident avec la même fonction
(`tileClipVerdict`). Le paquet de contenu porte pour cela la fiche du programme
de chaque thématique (`programmeKey`), qui dit si elle est d'anglais.

Le recensement des gabarits du CI (27 000 tirages, le 20 octobre 2026) trouve
877 textes de tuile différents, environ 16 400 caractères, soit environ 20 Mo
de mp3. Les exercices écrits par le modèle en ajoutent.

## Mettre en service

1. Pousser Convex avant le site. `prepareClips` accepte un nouveau type de
   requête : un site neuf contre un serveur ancien ferait échouer l'appel
   entier, consignes comprises.
2. Publier le site, puis reconstruire l'application (`pnpm ios:sync`,
   `pnpm android:sync`).
3. Rien à régénérer : la voix lit les paliers qui existent. Le premier son de
   chaque mot est synthétisé à la demande (une à deux secondes, douze au plus
   par appel de téléchargement) ; ensuite le cache le sert.
4. Facultatif : préchauffer le cache, voir la section suivante.

## Préchauffer le cache

Le premier enfant qui rencontre un mot attend sa synthèse. L'action interne
`voice/warm:warmTileVoice` (`convex/voice/warm.ts`) la fait d'avance. Elle
parcourt les paliers prêts du CI, relève ce que la voix dirait pour chaque
exercice publié, par la même décision que le serveur
(`convex/voice/warmTexts.ts`), puis synthétise les sons que le cache n'a pas
encore. Même voix, même modèle, même cache que la voix à la demande : un son
préchauffé est servi tel quel.

Elle se lance depuis un terminal, sur la production, comme `paliers/pregen` :

```
npx convex run --prod voice/warm:warmTileVoice '{"confirmDeployment":"<nom>","dryRun":true}'
```

Le premier appel, à blanc, compte les textes, ceux qui manquent au cache, leurs
caractères et le coût estimé, sans rien synthétiser. `programmeKeys` borne aux
thématiques d'un lot (`["sc-ci-milieu", "sc-ci-animaux"]`), `withPrompts` dit
aussi les consignes. Sans `dryRun`, l'action synthétise soixante sons neufs au
plus par exécution (`limit` règle ce nombre, quatre cents au plus) : essayer
d'abord avec `"limit":10`, puis relancer jusqu'à `remaining: 0`. Un son qui
échoue est listé dans `failed` et se refait au passage suivant.

La dépense est réelle (ElevenLabs) et n'est imputée à aucun élève. L'estimation
compte 0,30 $ pour mille caractères, arrondi au-dessus. D'après un tirage fait
en local, les quinze paliers des sciences du CI font dire environ 180 textes de
tuile (3 400 caractères, un dollar) et environ 230 avec les consignes. À
relancer après chaque régénération de paliers du CI : de nouveaux exercices
apportent de nouveaux mots.

## Vérifier

- `pnpm test` : `convex/__tests__/tileVoice.test.ts` (la porte, les
  garde-fous, les tuiles de chaque type, la décision du serveur),
  `components/exercises/__tests__/TileVoice.test.tsx` (le QCM : la file,
  l'anneau, le toucher, le silence), `TileVoiceScreens.test.tsx` (les quatre
  autres écrans, début de glissé compris), `TileVoiceScene.test.tsx` (le clip entre
  la consigne et les propositions), `lib/offline/__tests__/sync-clips.test.ts` (ce
  que l'appareil télécharge), les deux tests de séance (la porte : CI, CP,
  anglais) et `convex/__tests__/warmTexts.test.ts` (les textes préchauffés sont
  ceux que le serveur accepte de dire, pour les gabarits des sciences du CI).
- Dans le navigateur : `/dev/seance/?exo=qcm-mots-seuls&voix=1`. Le même son
  joue pour chaque proposition, de quoi voir la file et l'anneau. Un volet de
  navigateur caché freine le rendu : ses captures retardent d'environ deux
  secondes sur la page.
- Pas encore vérifié : la prononciation de mots isolés à l'oreille sur un
  iPhone, la coque Capacitor, Android.

## Décisions ouvertes

- **Des tuiles-syllabes sans trou collé.** Un énoncé comme « Le mot est ___ (pa,
  ra, ni) » n'a ni lettre ni syllabe dans ses mots, et son trou est entre deux
  espaces : ses tuiles se disent. Si cela donne trop d'aide, la règle des trous
  collés peut s'étendre aux tuiles de moins de trois lettres.
- **Quand préchauffer.** L'outil existe (section « Préchauffer le cache »).
  Reste à choisir : après chaque régénération de paliers du CI, ou seulement
  quand la première lecture se fait attendre.
- **Une phrase à plusieurs trous** ne relit pas toute seule les mots du trou
  suivant, quand il s'ouvre.
