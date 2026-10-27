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
- **Les lettres se disent en anglais** (alphabet du CI et du CP, ajouté le 26 octobre 2026).
  Dans une thématique d'anglais, une majuscule seule (« B »), un prénom épelé
  (« F-A-T-O-U »), une suite de lettres (« A, B, ___, D ») et « B is for ___. » se
  disent avec le NOM anglais de chaque lettre (`englishLetters`, `LETTER_NAMES`,
  `convex/voice/tiles.ts`) : « bee », « eff, ei, tee, oh, you ». Le nom est écrit comme un
  mot (« bee » et non « B »), parce qu'une synthèse qui lit un « B » seul le dit parfois à la
  française. Seules les MAJUSCULES comptent : « a », sans majuscule, est l'article de
  « a dog ». Dans ces thématiques, « lettre », « majuscule », « épeler » et « commence par »
  ne coupent plus la voix (`ALPHABET_WORDS`) ; « Lis le mot » et « la syllabe » la coupent
  toujours.
  **Trois écritures ont été départagées par un essai de la vraie voix** (26 octobre 2026,
  `eleven_multilingual_v2`, voix « Cyp », relu par la reconnaissance vocale, 5 synthèses
  chacune) : A s'écrit « ei » (« ay » était dit comme la lettre I) ; H seul s'écrit
  « Aitch. » (« aitch » seul était relu « Aichi », mais passe dans une suite) ; le trou d'une
  suite de lettres se dit « blank » (la pause « … » est sautée par la voix).
  **Ces noms n'ont toujours pas été écoutés par une personne** : le R seul reste fragile
  (« ar » 1 sur 5, « are » 2 sur 5, aucune écriture au-dessus de 3 sur 5) et D, E, G, M, N,
  S, T seuls sont mal relus (0 à 1 sur 3), peut-être à cause de la relecture sur des clips
  très courts. À écouter avant de publier l'application : les sons sont dans `public/voix/` (le nom de fichier de chaque
  texte est dans `lib/voice-static/manifest.ts`). Un nom corrigé se refait avec `pnpm voix:build --redo "<texte>"`.
  Le texte est la clé du cache audio : le corriger APRÈS la fabrication laisse l'ancien son inutilisé
  (`pnpm voix:build --prune`) et coûte une seconde synthèse.
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
| Une tuile d'une seule lettre, hors d'une thématique d'anglais | C'est du déchiffrage, même quand l'énoncé ne le dit pas (« Complète le mot : ba_ane »). Dans une thématique d'anglais, une MAJUSCULE seule est un nom de lettre : elle se dit en anglais (voir plus bas). |
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

## Les sons embarqués dans l'application (alphabet de l'anglais)

Pour un ensemble FERMÉ et stable, le cache du serveur n'est pas nécessaire : les
mp3 sont livrés avec l'application (`public/voix/`) et le lecteur les joue
AVANT le serveur. Aucun appel à ElevenLabs à l'exécution, aucun réseau (ni en
ligne, ni hors ligne, ni au premier lancement), un son qui part plus vite. C'est
le cas des six thématiques d'alphabet de l'anglais (`an-ci-abc-1` à `3`,
`an-cp-abc`, `an-cp-sounds`, `an-cp-name`) : après 200 graines, elles ne disent
que 312 textes, 302 avec la voix anglaise des tuiles.

- **La table** : `lib/voice-static/manifest.ts` (le texte DIT, c'est-à-dire
  `speakableTile`, vers le fichier ; la voix et le modèle qui l'ont dit). Elle est
  écrite par l'outil, jamais à la main. `lib/voice-static/index.ts` la lit ;
  `components/exercises/prompt-reader.tsx` l'essaie avant `useClipSource`.
- **Seulement dans une thématique d'anglais** : le même texte se dirait en
  français ailleurs, avec une autre voix. Un texte absent de la table, ou un
  fichier qui ne se joue pas (`staticTileFailed`), passe par le serveur comme avant.
- **La liste est calculée** (`lib/voice-static/set.ts`), jamais écrite à la main :
  elle relève ce que `voice/warmTexts` ferait dire sur 300 graines. Un test
  (`lib/__tests__/voice-static.test.ts`) refuse une table qui ne couvre pas la
  liste, un fichier orphelin, un fichier qui n'est pas un mp3, et une voix
  différente de celle du serveur ; il vérifie que des tirages jamais vus sont
  couverts à 97 % au moins (le reste passe par le serveur).
- **Taille** : 302 fichiers, 6,3 Mo (21 Ko en moyenne). C'est ce que pèse l'alphabet
  dans l'application. Un ensemble plus grand (les 700 mots du CI) ferait 15 Mo ou
  plus et change à chaque régénération de paliers : il reste dans le cache du serveur.

Fabriquer ou refaire les sons (ils ne se refont pas tout seuls) :

```
ELEVENLABS_API_KEY=... pnpm voix:build --dry-run                       compte, ne synthétise rien
ELEVENLABS_API_KEY=... pnpm voix:build                                 synthétise ce qui manque
ELEVENLABS_API_KEY=... pnpm voix:build --redo "ei, bee, see"           refait un texte mal dit
pnpm voix:build --prune --dry-run                                      montre ce que la liste n'utilise plus
```

L'outil prend la voix et le modèle de `voiceConfig()`, comme le serveur : si la
production règle `ELEVENLABS_EN_VOICE_ID`, `ELEVENLABS_VOICE_ID` ou
`ELEVENLABS_EN_MODEL_ID` (`npx convex env list --prod`), donnez les mêmes à l'outil,
sinon l'application et le serveur parleraient avec deux voix. Un changement de voix
demande `--replace-all`. Relancer est sans danger : un texte déjà fabriqué ne coûte
rien. Premier tirage du 27 octobre 2026 : 302 sons, 5 105 caractères, environ 1,53 $.

**Changer le nom d'une lettre** (`LETTER_NAMES`, `convex/voice/tiles.ts`) change le
texte dit : l'ancien son reste dans `public/voix/` jusqu'à `pnpm voix:build --prune`,
et le nouveau se fabrique avec `pnpm voix:build`. Les deux, puis `pnpm test`.

L'application les prend au prochain `next build` / `cap sync` : un son embarqué
est dans l'application, il ne se met pas à jour par le serveur. Un changement de
voix demande donc une nouvelle version de l'application (ou la mise à jour à
distance, `docs/capacitor-ios.md`).

## Copier le cache d'un déploiement à l'autre

Le développement et la production ont chacun leur cache de sons
(`arabicAudioClips`). Préchauffer la production repaie donc ce que le
développement a déjà. Au lieu de resynthétiser, on recopie les fichiers :

```
pnpm voix:copier --from dev --to prod --confirm <nom de la production>           à blanc (le défaut)
pnpm voix:copier --from dev --to prod --confirm <nom de la production> --apply   copie pour de bon
```

Aucun appel à ElevenLabs, donc aucun crédit. `--from` et `--to` sont ce que
`npx convex run --deployment` accepte (`dev`, `prod`, un nom de déploiement) ;
`current` désigne le déploiement de `.env.local`. Le script lit la source
(`voice/cacheCopy:listClips`) puis envoie par lots de 100 à la cible
(`voice/cacheCopy:importClips`, garde `confirmDeployment`). Il passe toujours par
un essai à blanc d'abord.

Ce que la copie fait et ne fait pas (`convex/voice/cacheCopyPlan.ts`, testé sans
base dans `convex/__tests__/voiceCacheCopy.test.ts`) :

- elle ne copie que les voix et les modèles que la CIBLE lit (sa configuration) :
  un son d'une autre voix n'y serait jamais demandé ;
- elle ne remplace jamais un son que la cible a déjà, et se relance sans danger ;
- elle refuse une ligne dont la clé n'est pas « voix | modèle | texte », un fichier
  vide ou énorme, et toute adresse qui n'est pas en `https` sur `*.convex.cloud`
  (l'action fait un `fetch` sur des adresses qu'une autre base lui donne) ;
- la cible doit avoir `ELEVENLABS_API_KEY`, sans quoi on ne sait pas quelles voix
  elle lit.

Essai fait le 27 octobre 2026, sur un backend local, avec une vraie synthèse de 27
sons : lecture par pages, mauvais `confirmDeployment` refusé, 5 sons copiés à
l'identique (octet pour octet), rejeu sans effet, et les lignes pièges (clé
trafiquée, adresse refusée, autre voix) non rangées. **Pas encore essayé entre le
développement et la production réels** : à faire par le propriétaire, à blanc d'abord.

## Vérifier

- `pnpm test` : `convex/__tests__/tileVoice.test.ts` (la porte, les
  garde-fous, les tuiles de chaque type, la décision du serveur),
  `components/exercises/__tests__/TileVoice.test.tsx` (le QCM : la file,
  l'anneau, le toucher, le silence), `TileVoiceScreens.test.tsx` (les quatre
  autres écrans, début de glissé compris), `TileVoiceScene.test.tsx` (le clip entre
  la consigne et les propositions), `lib/offline/__tests__/sync-clips.test.ts` (ce
  que l'appareil télécharge), les deux tests de séance (la porte : CI, CP,
  anglais) et `convex/__tests__/warmTexts.test.ts` (les textes préchauffés sont
  ceux que le serveur accepte de dire, pour les gabarits des sciences du CI),
  `lib/__tests__/voice-static.test.ts` et
  `components/exercises/__tests__/TileVoiceEmbedded.test.tsx` (les sons
  embarqués : table, fichiers, liste, lecteur), `convex/__tests__/voiceCacheCopy.test.ts`
  (la copie du cache : lignes et adresses permises).
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
