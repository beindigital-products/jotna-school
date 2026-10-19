# La boucle native du jeu : voir un écran dans le vrai webview

Le chantier « les exercices sont un vrai jeu » se juge sur un téléphone, pas
dans un navigateur de bureau : le WKWebView d'iOS aplatit certaines 3D CSS,
un filtre animé y coûte 100 ms par image, et Android d'entrée de gamme n'a
pas la fluidité du Mac. Cette page donne les trois outils pour regarder
chaque écran là où l'enfant le verra, sans rien commiter de temporaire :

1. la galerie des exercices et la séance factice (`/dev/exercices/`,
   `/dev/seance/`), des pages de développement qui rendent les vrais
   composants dans la coque de la séance ;
2. le script de captures Chromium (`scripts/shoot-exercises.mjs`) ;
3. les deux boucles natives (`scripts/native-loop-ios.sh`,
   `scripts/native-loop-android.sh`) qui pointent l'application sur le
   serveur de développement, avec rechargement à chaud.

Tout part de `pnpm dev` sur le port 3000. Ne lancez pas `next build` pendant
que le serveur tourne : cela casse `.next`.

## 0. Le budget de la machine

La machine du propriétaire a 10 cœurs et 16 Go ; d'autres travaux y tournent
(un rendu de film, d'autres sessions). Une première exécution l'a saturée
(charge 212, mémoire d'échange pleine). Les règles :

- `uptime` avant toute tâche lourde ; au-dessus de 30 de charge moyenne à
  une minute, on attend ;
- un seul navigateur Playwright, un seul simulateur iOS **ou** un seul
  émulateur Android, jamais les deux ensemble ; on éteint ce qu'on n'utilise
  plus (`xcrun simctl shutdown`, `--stop`) ;
- les compilations sont bornées : `xcodebuild -jobs 4` et
  `gradlew --max-workers=4` (option `--jobs` des deux scripts). Sans borne,
  `xcodebuild` seul a poussé la charge à 174 et la mémoire libre de 61 % à
  36 % ; le simulateur s'est éteint tout seul juste après (voir les pièges) ;
- ne jamais tuer un processus qu'on n'a pas lancé.

## 1. La galerie et la séance factice

`app/dev/exercices/` rend chaque type d'écran (`components/exercises/*`) dans
chacun de ses états, avec les payloads de la vitrine
(`components/landing/demo/bank/*.ts`, `make-game.ts`) et des gabarits du
serveur (une rangée d'émojis de CI, par exemple). Les états qui demandent un
geste (une option choisie, bonne ou mauvaise réponse) sont joués par des
touchers sur le DOM, puis `disabled` et `isCorrect` sont posés comme la
séance le fait après la vérification. Les composants ne sont pas modifiés.

Tout se pilote par l'URL :

| Paramètre | Valeurs | Effet |
| --- | --- | --- |
| `type` | `qcm3`, `qcm4`, `match`, `order`, `drag-drop`, `fill-blank`, `short-answer`, `short-answer-texte`, `pattern`, `color-mix`, `listen`, `pixel-art`, `order-animaux`, `order-animaux-4`, `qcm-intrus`, `qcm-mots-seuls`, `match-mots`, `drag-drop-savane`, `tous` | l'écran (défaut `qcm4`) ; les six derniers sont les tuiles qui nomment une chose (voir plus bas) |
| `etat` | `repos`, `choisie`, `bonne`, `mauvaise`, `desactive`, `tous` | l'état (défaut `repos`) |
| `tout=1` | | la grille de tous les états (et de tous les types avec `type=tous`) |
| `rm=1` | | mouvement réduit simulé depuis la page |
| `tablette=1` | | la largeur d'une tablette dans un grand écran |
| `ci=0` | | sans le bouton qui lit la consigne (présent par défaut : les spécimens sont de CI et de CP) |
| `images` | `0`, `1` | les images de tuile du CI : sans le paramètre, la classe du spécimen décide comme en séance (CI oui, CP et CE1 non) ; `0` les coupe partout, `1` les montre aussi au CP |
| `barre=0` | | sans la barre de commande, pour les captures |

Chaque carte porte `data-stage-ready="1"` quand ses gestes sont joués et
son état posé : c'est le signal qu'attend le script de captures. Vérifié
dans Chromium le 18 octobre 2026 : les 60 cartes (12 types × 5 états)
arrivent dans l'état demandé en moins de deux secondes.

LES TUILES QUI NOMMENT UNE CHOSE (19 octobre 2026). Un enfant de CI ne lit pas
encore « Lion » ni « la vache » : en séance, chaque tuile qui nomme une chose
montre son image et garde son nom écrit (`components/exercises/item-pictures.tsx`,
`lib/item-pictures.ts`). Six types de la galerie les montrent. Trois portent un
émoji devant le nom, comme les gabarits du serveur les écrivent : `order-animaux`
(trois animaux du plus petit au plus grand, le cas du propriétaire),
`order-animaux-4` (quatre animaux du plus léger au plus lourd, la plus longue
mise en ordre) et `qcm-intrus` (trois véhicules et un fruit). Trois n'ont que le
nom, comme le modèle l'écrit : `qcm-mots-seuls` (Lion, Poule, Chat, Âne),
`match-mots` (quatre animaux et leurs cris, soit huit tuiles dont quatre sans
image) et `drag-drop-savane` (quatre étiquettes à glisser vers la savane ou la
ferme).

Chaque page pose le fournisseur d'images comme la séance :
`<ItemPicturesProvider enabled={isPictureTileClass(classe)}>`, avec la classe du
spécimen affiché. Sans paramètre, un spécimen de CI montre ses images et un
spécimen de CP non. `?images=0` les coupe partout, c'est l'écran d'avant, pour
comparer. `?images=1` les montre aussi à un spécimen de CP, pour voir ce que
donnerait `PICTURE_TILE_CLASSES` élargi au CP. La carte de la galerie porte
`data-pictures="1"` quand les images sont ouvertes. Le palier de poche par défaut
de `/dev/seance/` n'a aucune tuile qui nomme une chose : pour les voir, ouvrir
`?exo=qcm-intrus` ou l'un des cinq autres types.

`app/dev/seance/` est la coque complète avec des données inventées : barre de
séance, progression, carte, « Valider », la scène de réponse
(`AnswerFeedback`) et l'écran de fin (`PalierResultScreen`). Elle se joue (un
palier de trois exercices, jugé par la règle du serveur) et se fige par
`?scene=` : `exercice`, `bonne`, `mauvaise`, `plus-d-essai`, `fin-validee`,
`fin-manquee`. `?exo=<type>` met un autre type de la galerie en première
question. `?images=0|1` règle les images de tuile, comme dans la galerie (voir
plus haut). `?voix=1` donne au lecteur de consignes un son local
(`/sounds/badge.mp3`, 1,5 s) à la place de la consigne, avec les silences de
la vraie séance (lecture automatique à l'arrivée de la carte, silence dès la
réponse) : les spécimens n'ont pas d'identifiant Convex, sans lui le lecteur
est muet. C'est ainsi qu'on vérifie dans le webview iOS que Pio montre son
affiche pendant la voix et reprend son clip après (§ 6). `?son=1`, sur un
écran de fin (`scene=fin-validee`), fait partir un son 2,5 s après l'arrivée,
PENDANT que le clip « cheer » de Pio joue (`[son] joue` dans la console) : la
seule page où un son part sous un clip monté, pour voir ce que la vidéo en
dit (`[video]` de la sonde) et ce que l'écran en montre (un film).

LE DOCK ET LE CLAVIER (18 octobre 2026). En séance, la barre « Écouter +
Valider » est collée au bas de l'écran (`game-kit/scene-dock.tsx`, racine de
`SessionStage`) ; `/dev/seance/` la montre comme la vraie séance. Ce qui ne
se vérifie QUE dans un webview, le clavier des lettres :
`/dev/seance/?exo=short-answer-texte&barre=0` ouvre la réponse courte en
lettres (« marmite », CP), la seule de la galerie qui fait monter le clavier
du téléphone (les chiffres ont leur pavé dans la carte). Toucher le champ,
puis photographier : le champ ET le dock doivent rester visibles au-dessus du
clavier. Sur iOS, le clavier recouvre la page sans la redimensionner : le dock
lit `visualViewport` et monte d'autant (`data-keyboard-inset` sur
`[data-scene-dock]` dit de combien), et la page gagne la place du clavier en
bas pour que le champ puisse remonter (`--dock-h`). Sur Android, la fenêtre
se redimensionne (`adjustResize`) : le dock suit le bas de la fenêtre,
`data-keyboard-inset` reste absent. Dans Chromium, un `visualViewport`
factice a validé le mécanisme (champ à 300 px du haut, dock juste au-dessus
d'un clavier simulé de 336 px).

Vu dans le WKWebView de l'iPhone 17 (18 octobre 2026, `?sonde=1`) : le
clavier des lettres recouvre 403 px (viewport visuel 471 sur 874) ; WebKit
fait défiler la page de 312 px, le dock monte de 91 px de plus
(`data-keyboard-inset="91"`) et se pose exactement au-dessus de la barre
d'accessoires du clavier (`dock=377-471`), le champ reste à 202-270 px du
haut ; « Valider » touché dans le dock, clavier levé, juge la réponse ; un
toucher hors du champ (l'en-tête) ferme le clavier, le dock revient en bas
sans saut. Piège : taper du texte avec l'outil du simulateur de Claude Code
passe par le clavier MATÉRIEL, qui range le clavier logiciel (il ne reste que
sa barre d'accessoires de 68 px : `vv=806`, `inset` 0, le dock juste
au-dessus) ; le clavier logiciel ne revient pas par le menu I/O depuis un
script. Avec cette barre seule, WebKit fait défiler le viewport visuel de
68 px sans rien redimensionner : l'en-tête collant, calé sur le viewport de
mise en page, passait sous la barre d'état (Sons et Quitter sous l'heure et
la batterie). Depuis, la racine publie ce décalage dans `--vv-top`
(`scene-dock.tsx`, `visualViewportTop`) et l'en-tête l'ajoute à son `top` :
revu sur l'iPhone 17 le 18 octobre 2026, clavier matériel, l'en-tête reste
sous la barre d'état, le champ et le dock visibles.

Vu dans le WebView de l'émulateur Pixel_Jotna (18 octobre 2026, Android 16,
`?sonde=1`, un script du scratchpad sur `scripts/lib/android-webview.mjs`) :
la fenêtre fait 412 × 840 au repos (barre d'état et barre de navigation
déduites de l'écran de 915 px : le WebView n'est pas bord à bord) ; le champ
touché, le clavier des lettres monte et la fenêtre se redimensionne
(`adjustResize` sans rien dans le manifeste : `innerHeight` 528,
`visualViewport.height` 528, `offsetTop` 0), `data-keyboard-inset` reste
absent, le dock suit le bas de la fenêtre (`dock=434-528`, juste au-dessus
de la barre de suggestions du clavier) et le champ reste visible au-dessus
de lui (355–423) ; `adb shell input text marmite` écrit dans le champ
clavier levé ; « Valider » touché dans le dock juge la réponse (« Bravo ! »,
le clavier se range) ; un toucher hors du champ (l'en-tête) ferme le
clavier, la fenêtre reprend 840 px et le dock redescend (`746-840`) sans
saut. La page se recompose avec la hauteur raccourcie (en dessous de 667 px,
Pio passe à 106 px et l'en-tête se resserre) : c'est la règle de toute page
Android redimensionnée, rien de propre au dock. Piège : `adb shell input
keyevent 4` (Retour) clavier déjà fermé envoie l'application à l'arrière-plan
(le WebSocket DevTools reste ouvert mais la page ne répond plus) :
`am start -n com.jotna.school/.MainActivity` la ramène.

Les deux pages n'existent qu'en développement, ou dans un export construit
avec `NEXT_PUBLIC_EXERCISE_GALLERY=1` (`app/dev/garde.ts`). Ailleurs, elles
rendent la 404. Elles se montent côté client seulement : la mise en ordre
mélange ses tuiles au hasard et dnd-kit numérote ses attributs, un HTML
pré-rendu ne pourrait pas coïncider.

## 2. Les captures Chromium

```bash
export PATH="$HOME/.local/share/fnm/aliases/default/bin:$PATH"
node scripts/shoot-exercises.mjs --label avant --full --seance --video \
  --out "$SCRATCHPAD/shots"
```

Une image par type, par état et par appareil (téléphone 390 × 844 à
l'échelle 3, tablette 820 × 1180 à l'échelle 2), en mode tactile, dans
`<out>/<label>/<type>-<état>-<appareil>.png`. `--full` ajoute la page
entière (`-pleine`), `--reduced` émule `prefers-reduced-motion: reduce`
(suffixe `-rm`), `--seance` photographie les six scènes de la séance
factice, `--video` filme une interaction (une option fausse, « Valider »,
puis la bonne), `--images 0|1` passe le paramètre `images` à toutes les pages
(l'écran sans images, puis celui avec : deux `--label`) et chaque capture attend
que les images de tuile soient chargées. Les captures ne vont jamais dans le
dépôt : visez le scratchpad de la session. Le passage complet (deux appareils,
pages entières, séance, vidéos) prend environ six minutes.

Le moteur est Blink. Ces images jugent la mise en page et les états, pas
Safari. Pour le mouvement, il faut le simulateur ou l'émulateur : le panneau
navigateur intégré étrangle `requestAnimationFrame` quand il est caché.

## 3. La boucle iOS

```bash
scripts/native-loop-ios.sh --build \
  --work "$SCRATCHPAD/native/ios" \
  --shot "$SCRATCHPAD/shots/avant/ios/galerie-qcm4-repos.png"
```

Ce que fait le script, dans l'ordre :

1. vérifie que `pnpm dev` répond sur l'URL demandée (depuis le simulateur,
   `localhost` est le Mac) ;
2. sauvegarde `capacitor.config.ts`, écrit à sa place une configuration
   temporaire (`server.url` vers le serveur de développement,
   `cleartext: true`, `webDir` sur une coquille `.ci-local/dev-shell/`
   d'un seul `index.html`), lance `npx cap sync ios`, puis remet
   l'original. Ce qui est généré (`ios/App/App/public`,
   `ios/App/App/capacitor.config.json`) est ignoré par git ;
   `CapApp-SPM/Package.swift` est réécrit à l'identique ;
3. allume le simulateur iPhone 17 (`3ABDFD18-0CC8-4648-BAF7-F8C5E16DAD8F`),
   jamais un second ;
4. avec `--build`, compile dans `--work` (`xcodebuild -scheme App -jobs 4`,
   `CODE_SIGNING_ALLOWED=NO`) : environ deux minutes la première fois ;
   sans lui, réutilise l'application déjà construite ;
5. installe, recopie `capacitor.config.json` et `public/` dans
   l'application installée (le bundle garde ceux de sa compilation : c'est
   ainsi qu'on change d'URL sans recompiler), lance ;
6. attend `--wait` secondes (12 est une bonne valeur : le serveur de
   développement compile la page à la première demande), photographie
   (`xcrun simctl io screenshot`) ou filme (`--record fichier.mov SECONDES`,
   `recordVideo`).

Une page web modifiée se recharge toute seule : le webview parle au serveur
de développement comme un navigateur (`[HMR] connected` dans sa console).
Pour ouvrir une autre page, relancez avec `--url` (sans `--build`). Les
capacités natives sont celles de l'application : `Capacitor.isNativePlatform()`
est vrai, Pio est son clip vidéo (une autre pose que l'image fixe du web :
c'est normal), le plugin Filesystem du hors-ligne est enregistré.

Pour enchaîner plusieurs écrans vite, sans `cap sync` ni réinstallation :
écrire le JSON directement dans l'application installée, puis relancer.

```bash
U=3ABDFD18-0CC8-4648-BAF7-F8C5E16DAD8F; B=com.jotna.school
C="$(xcrun simctl get_app_container "$U" "$B" app)"
printf '{"appId":"%s","appName":"Jotna School","webDir":".ci-local/dev-shell","server":{"url":"%s","cleartext":true},"packageClassList":["FilesystemPlugin"]}\n' \
  "$B" "http://localhost:3000/dev/seance/?scene=bonne&barre=0" > "$C/capacitor.config.json"
xcrun simctl terminate "$U" "$B"; xcrun simctl launch --console-pty "$U" "$B"
```

`--console-pty` affiche la console JavaScript du webview (Capacitor la
relaie en `⚡️  [log] - …`, `[error]`, `[warn]`) : c'est le seul endroit où
on la lit sans Safari ; `log stream` (os_log) ne la contient pas.

À la fin, `git status` ne doit rien montrer sous `capacitor.config.ts`,
`ios/` ni `android/` ; le script le dit sur sa dernière ligne. Si
`xcodebuild` a réécrit `Package.resolved`, le script le remet en place.
Éteignez le simulateur quand vous avez fini (`--shutdown` ou
`xcrun simctl shutdown <UDID>`).

## 4. La boucle Android

```bash
scripts/native-loop-android.sh \
  --work "$SCRATCHPAD/native/android" \
  --shot "$SCRATCHPAD/shots/avant/android/galerie-qcm4-repos.png"
```

Mêmes étapes, avec ces différences :

- l'émulateur `Pixel_Jotna` (Android 36, arm64, 2 Go) démarre sans fenêtre
  (`-no-window -gpu swiftshader_indirect -no-snapshot`), en arrière-plan,
  en une trentaine de secondes ; `--window` en montre une. `ANDROID_HOME` et
  `JAVA_HOME` sont posés par le script
  (`/opt/homebrew/share/android-commandlinetools`,
  `/opt/homebrew/opt/openjdk@21/...`) ;
- l'hôte se joint par `http://localhost:3000`, grâce à
  `adb reverse tcp:3000 tcp:3000` que le script pose après le démarrage.
  **Pas `10.0.2.2`** : Next refuse les requêtes de développement venues
  d'une autre origine que `localhost` (`allowedDevOrigins`), le WebSocket
  HMR échoue (`ERR_INVALID_HTTP_RESPONSE`) et la page reste blanche, sans
  aucune erreur JavaScript ;
- l'URL vit dans les assets de l'APK : chaque changement d'URL impose
  `gradle assembleDebug` (incrémental, environ une minute ; quatre à cinq
  la première fois). `--no-build` réinstalle l'APK existant. Pour enchaîner
  des écrans sans reconstruire, passez par le protocole DevTools du WebView
  (plus bas) ;
- si l'émulateur porte déjà l'application signée avec la clé de
  publication (l'APK du site), l'APK de débogage ne peut pas la remplacer
  (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`) : le script la désinstalle (ses
  données locales partent) puis installe ;
- `cleartext: true` fait écrire par Capacitor
  `android:usesCleartextTraffic="true"` dans le manifeste de son module de
  plugins (`android/capacitor-cordova-android-plugins/`, ignoré par git),
  que Gradle fusionne au manifeste de l'application. Sans lui, le WebView
  refuse `http://` et l'écran reste blanc ;
- `cap sync android` régénère `android/app/capacitor.build.gradle` et
  `android/capacitor.settings.gradle`, qui sont suivis par git ; le script
  les remet en place s'ils changent (ils n'ont pas changé le 18 octobre) ;
- capture par `adb exec-out screencap -p`, film par `adb shell
  screenrecord` (`--record fichier.mp4 SECONDES`) ;
- `--stop` éteint l'émulateur. Ne le laissez pas tourner pour rien : il
  pèse sur la machine et fausse les mesures de tout le monde.
- `--gpu host` rend par le GPU du Mac au lieu du GPU logiciel
  (`swiftshader_indirect`, le défaut). Les deux servent : le GPU logiciel
  rastérise tout au processeur et grossit chaque peinture (c'est le pire
  cas, utile pour voir CE QUI se repeint), le GPU du Mac est proche d'un
  téléphone à GPU pour juger la fluidité (§ 6). Changer de mode impose
  d'éteindre l'émulateur (`--stop`, ou `adb emu kill`) et de le relancer.

Le WebView de l'application de débogage accepte le protocole DevTools de
Chrome : c'est la console JavaScript d'Android, et le moyen de changer de
page sans reconstruire l'APK.

```bash
PID=$(adb shell pidof com.jotna.school | tr -d '\r')
adb forward tcp:9333 localabstract:webview_devtools_remote_$PID
curl -s http://localhost:9333/json          # la page, son URL, son webSocketDebuggerUrl
```

Ensuite, sur ce WebSocket, `Page.navigate` ouvre une autre URL,
`Runtime.evaluate` lit le DOM (`data-stage-ready`), `Runtime.enable` +
`Log.enable` donnent la console et les exceptions. Playwright ne sait pas
s'y attacher (`connectOverCDP` échoue : « Browser context management is not
supported ») ; un `WebSocket` nu de Node suffit (une trentaine de lignes).
`adb logcat -s Capacitor/Console` donne aussi les `console.*`, mais pas les
erreurs réseau du WebView.

Deux scripts du dépôt font ce travail (ils partagent
`scripts/lib/android-webview.mjs`, le WebSocket nu et les touchers
`Input.dispatchTouchEvent`) :

```bash
# 55 écrans de la galerie + 6 scènes de la séance, dans le webview, ~7 min
node scripts/android-webview-tour.mjs --out "$SCRATCHPAD/shots/android" \
  [--types qcm4,match] [--etats repos,bonne] [--galerie | --seance]
# la fluidité d'un geste (§ 6) : écarts d'images, trace Chromium, profil JS
node scripts/android-webview-mesure.mjs seance [--mode raf|trace|profil] \
  [--level riche|sobre] [--css "…"] [--record film.mp4]
```

Le tour écrit `galerie/<type>-<état>.png` et `seance/<scène>.png` et dit
les erreurs console qui ne sont pas le bruit connu de l'application
(hydratation du pont Capacitor, `Filesystem.readFile` du hors-ligne). Le
18 octobre 2026, les 55 écrans et les 6 scènes sont passés dans le webview
sans erreur propre à la galerie ; les captures sont identiques à celles de
Chromium au moteur d'émojis près (Noto Color Emoji au lieu d'Apple Color
Emoji : aucune case vide, les mangues sont des mangues).

## 5. Les pièges rencontrés

- **`cap copy` ne suffit pas, il faut `cap sync`.** Avec `copy` seul,
  `capacitor.config.json` n'a pas de `packageClassList` ; au lancement le
  pont natif dit « Error registering plugins: … packageClassList » et
  n'enregistre AUCUN plugin (le Filesystem du hors-ligne, par exemple). La
  page se charge quand même, ce qui rend le défaut silencieux. `sync`
  (`copy` + `update`) corrige ; vérifié : il laisse git propre sur les deux
  plateformes.
- **Le simulateur s'est éteint tout seul** après la compilation (charge
  174) : « Unable to lookup in current state: Shutdown ». Le script le
  rallume au prochain passage ; si une commande `simctl` répond
  « device is not booted », relancez simplement le script.
- **La console JavaScript du webview iOS n'est pas dans `log stream`.**
  Lancez l'application avec `xcrun simctl launch --console-pty` et lisez le
  flux (`⚡️  [log] - …`).
- **Une capture toute blanche** après `--wait 14` : le serveur de
  développement compilait encore la page (un premier passage après une
  modification). Rephotographiez sans relancer
  (`xcrun simctl io booted screenshot fichier.png`) ; la page est là.
- **Le serveur de développement peut manquer une modification de
  `app/globals.css`** quand elle tombe pendant une compilation lancée par un
  autre fichier (18 octobre 2026 : une règle ajoutée, absente du CSS servi
  pendant dix minutes, `touch` sans effet). Vérifiez dans le CSS servi
  (`curl` du `_next/static/chunks/…css` référencé par la page, ou
  `document.styleSheets` dans Playwright) ; un changement de contenu du
  fichier (un mot dans un commentaire) relance la compilation.
- **Un film commence par deux à trois secondes de blanc** : `recordVideo`
  démarre avant que l'application ait chargé la page. Comptez-les dans la
  durée, ou extrayez les images à partir de 3 s (`ffmpeg -ss 3.5 -i … `).
  Sur Android, `Page.navigate` par CDP pendant `screenrecord` évite le
  blanc : la page change sans relancer l'application.
- **Pio n'a pas la même tête d'une capture à l'autre** : image fixe sur le
  web, clip vidéo dans l'application (HEVC alpha sur iOS, VP9 WebM sur
  Android, `components/student/pio.tsx`). Une capture prise avant ou après
  le clip montre l'affiche (la pose fermée), une image du film montre la
  bouche ouverte : comparez des films, pas des captures, pour juger Pio.
- **Le badge « N » de Next** (outils de développement) est dans le webview
  comme dans Chromium ; le script de captures le cache (`nextjs-portal`),
  pas le simulateur ni l'émulateur. Sur Android il affiche « 1 Issue » :
  un avertissement d'hydratation, parce que le pont Capacitor écrit
  `--safe-area-inset-*` et `color-scheme` dans le `style` de `<html>` avant
  que React ne compare le HTML du serveur au client. Ce n'est pas la
  galerie : c'est l'application entière sur Android, sans effet visible
  (React ne corrige pas les attributs). Sur iOS le badge a montré
  « 1 Issue » au tout premier lancement seulement.
- **`navigator.vibrate` bloqué dans Chromium** (« Blocked call to
  navigator.vibrate because user hasn't tapped on the frame ») : les états
  `bonne` et `mauvaise` posés sans geste de l'utilisateur déclenchent le
  retour haptique de la scène de réponse, que Chrome refuse sans toucher
  préalable. Six lignes d'erreur par grille complète ; sans effet sur
  l'écran, et absentes du webview iOS.
- **Deux touchers dans la même tâche voient le même état React.** Les gestes
  de la galerie attendent un tour de boucle entre deux `click()` ; sinon une
  association sélectionnait au lieu de relier.
- **Le pointeur synthétique du dessin sur quadrillage.** L'écran appelle
  `setPointerCapture` ; un `PointerEvent` fabriqué n'a pas de pointeur
  actif et l'appel lèverait. La galerie neutralise la méthode sur le seul
  quadrillage, le temps du geste.
- **La charge de la machine fausse tout.** Vérifiez `uptime` avant une
  mesure ; `xcodebuild` et l'émulateur montent la charge bien au-dessus de
  40 même bornés. Ne lancez pas les captures Chromium pendant une
  compilation si vous jugez des animations.
- **Ne modifiez jamais `capacitor.config.ts` à la main pour pointer sur le
  serveur de développement** : les scripts le font et le remettent en place
  par un `trap`, même en cas d'erreur.
- **Le mouvement réduit d'Android** est le réglage d'accessibilité
  « Supprimer les animations », que l'émulateur imite par
  `adb shell settings put global animator_duration_scale 0` : le WebView
  répond alors vrai à `prefers-reduced-motion: reduce` (vérifié : plus
  d'éclat ni de confettis sur `qcm4 · bonne`). Le WebView lit ce réglage AU
  DÉMARRAGE de l'application : après `put … 0` comme après `put … 1`,
  faire `adb shell am force-stop com.jotna.school` puis relancer, sinon la
  mesure suivante se fait dans l'autre mode sans le dire (le script de
  mesure affiche `rm` pour cette raison).
- **Le tier forcé reste.** `--level` du script de mesure écrit
  `jotna.deviceTier` dans le `sessionStorage` du WebView, et cette session
  survit aux `Page.navigate` : la mesure suivante est au même niveau tant
  qu'on ne repasse pas `--level` ou qu'on ne relance pas l'application.
- **`navigator.vibrate` ne vibre pas dans l'application Android** :
  `AndroidManifest.xml` ne demande pas `android.permission.VIBRATE`, et le
  WebView l'écrit dans logcat (`cr_VibrationManager: Failed to use vibrate
  API, requires VIBRATE permission.`) sans rien lever côté JavaScript
  (`navigator.vibrate(80)` renvoie `true`). Une ligne
  `<uses-permission android:name="android.permission.VIBRATE" />` dans
  `android/app/src/main/AndroidManifest.xml` suffit ; elle est à l'agent de
  la coque (les scripts de la boucle ne touchent pas `android/`).
- **Le clavier Android redimensionne la fenêtre** (`adjustResize` :
  `innerHeight` passe de 840 à 528 px sur l'AVD quand le clavier monte).
  Le champ de la réponse courte reste visible, et la touche « OK » du
  clavier (`enterKeyHint="done"`, Entrée) valide. Avant le dock, « Valider »
  passait sous le clavier et revenait en défilant ; avec le dock, il suit le
  bas de la fenêtre et reste visible (§ 1, « Le dock et le clavier »).
- **Une trace Chromium avec la catégorie `devtools.timeline.picture`** (ou
  `cc.debug.picture`) sérialise chaque liste d'affichage pendant la trace
  et invente 800 ms de `RecordingSource::FinishDisplayItemListUpdate` sur
  le fil principal qui n'existent pas sans trace. Le script de mesure ne la
  demande pas ; ne pas l'ajouter.

## 6. Mesurer la fluidité dans le webview

Le panneau navigateur étrangle `requestAnimationFrame` quand il est caché et
Chromium n'a pas les coûts de WebKit : la fluidité se mesure dans
l'application, par les écarts entre deux images, lus dans sa console.

1. **La sonde.** `DevProbe` dans `app/dev/session-shell.tsx` (rendu par la
   galerie et la séance factice), activée par `?sonde=1` : une boucle
   `requestAnimationFrame` qui garde les écarts et, chaque seconde, écrit
   `[raf] t=12.0 n=60 mean=16.7 p95=17.0 max=18.0 >50=0 >100=0`, puis une
   ligne `[dock]` (viewport de mise en page et visuel, `--dock-h`, rectangle
   du dock, de Valider, du champ, de la carte, clip de Pio, voix, élément
   focalisé, défilement) ; à 2,5 s, `[fit]` dit si la première réponse est
   visible au-dessus du dock, et `&bas=1` défile tout en bas pour dire si la
   carte passe au-dessus du dock (`[bas]`). `&calme=1` coupe les lignes par
   événement du viewport pendant une mesure d'écarts (chaque ligne passe par
   le pont natif et force une mise en page). Chaque événement des clips de
   Pio (`[video] playing|pause|suspend|waiting|stalled|ended|emptied`, avec
   le nom du clip et `currentTime`) : les événements des médias ne remontent
   pas, la sonde les capte sur le document. Un `<Profiler>` de React autour
   de l'écran (`[prof] match update 3.0ms`) dirait la part de React dans
   chaque écart ; le reste est la peinture et la composition de WebKit.
2. **Une page par lancement, sans `cap sync`** : écrire l'URL dans le
   `capacitor.config.json` de l'application installée (§ 3), relancer avec
   `xcrun simctl launch --console-pty` vers un journal, attendre 12 à 14 s.
3. **Les gestes** : `simctl` ne sait pas toucher ; l'outil du simulateur de
   Claude Code (`tap`, `swipe`, en points : 402 × 874 sur l'iPhone 17, un
   pixel de capture sur trois) ou `idb`. Pas de capture d'écran pendant la
   mesure (`screenshot` coûte 50 à 100 ms à l'image), pas de film
   (`recordVideo` ajoute 30 à 60 ms par geste), et `uptime` en dessous de 30
   avant de commencer ; un `[Fast Refresh]` dans le journal au moment du geste
   invalide la mesure (le serveur a recompilé pour quelqu'un).
4. **Les critères** : moyenne sous 25 ms, aucun écart au-dessus de 100 ms.
   Les écarts du simulateur sont en mode développement (React rend deux fois,
   rien n'est minifié) : les valeurs absolues sont pessimistes, les écarts
   relatifs entre deux variantes sont fiables.

**Sur Android, rien à poser dans le code** : `scripts/android-webview-mesure.mjs`
injecte la même sonde par le protocole DevTools, touche par
`Input.dispatchTouchEvent` et lit les écarts ; `--mode trace` dit si le temps
part en JavaScript, en style, en peinture, en rastérisation (le fil
`Chrome_InProcGpuThread`) ou en composition (`RenderThread`), avec le nombre
de tuiles rastérisées, le chiffre à comparer entre deux variantes parce
qu'il ne dépend pas de la charge de la machine ; `--mode profil` donne la
fonction JavaScript. `--css` injecte une feuille de style pour juger une
variante sans toucher au code (un A/B en deux commandes).

Ce que l'émulateur a dit le 18 octobre 2026, en mode développement :

| geste (séance factice, niveau sobre) | GPU logiciel, moyenne / pire | GPU du Mac, moyenne / pire |
| --- | --- | --- |
| toucher une tuile | 22 ms / 67 ms | 17 ms / 33 ms |
| Valider une mauvaise réponse (scène qui arrive, dit non, part) | 21–26 ms / 117 ms | 17–20 ms / 67 ms |
| Valider la bonne (verdict, éclat, scène, carte suivante) | 66–133 ms / 383 ms | 17–23 ms / 100 ms |
| relier une paire | 31–33 ms / 83 ms | 17 ms / 33 ms |
| glisser une étiquette dans sa boîte (galerie) | 28 ms / 400 ms | 17 ms / 50 ms |
| poser une perle de la frise (galerie) | 60 ms / 217 ms | 17 ms / 50 ms |
| niveau riche, mêmes gestes | 2 à 3 fois pire partout | 17–19 ms / 67 ms |

Le JavaScript n'y est pour rien (profil : 30 à 400 ms sur 4 à 6 s, React
en mode développement compris) ; tout l'écart est la rastérisation, que le
GPU logiciel fait au processeur. Un vrai téléphone a un GPU : la colonne de
droite est la bonne pour juger la fluidité, celle de gauche pour voir ce qui
se repeint. Ce qu'elle a révélé, et ce qui a été corrigé (les couches
`will-change` le temps d'un ressort), est dans `docs/direction-jeu-exercices.md`
(« Ce que le WebView Android a appris »).

Ce que la mesure du 18 octobre 2026 a appris, et ce qui en a été corrigé,
est dans `docs/direction-jeu-exercices.md` (§ budgets, « Ce que le WKWebView
a appris »). En bref : les ombres floues peintes dans des couches fraîches,
les contextes 3D par tuile, les opacités de racine et les clips vidéo montés
au verdict ; pas React.

**La scène de la question (grand Pio « ask », Écouter puis Valider), mesurée
le 18 octobre 2026 sur l'iPhone 17, `/dev/seance/?voix=1&raf=1`.** Ce que
l'iPhone a dit, et que Chromium ne pouvait pas dire :

- **L'encoche compte dans `svh`, pas dans ce que voit l'enfant.**
  `env(safe-area-inset-top)` vaut 62 px sur l'iPhone 17 (0 dans Chromium, 0
  sur Android : le WebView n'est pas bord à bord). Un Pio à 30 % de `100svh`
  et deux rangées d'action (Écouter, Valider) poussaient « Valider » 27 px sous
  le pli sur le QCM aux mangues, alors que Chromium le donnait « tient » à
  390 × 844. Depuis : Pio se taille sur `100svh - env(safe-area-inset-top)`
  (244 px au lieu de 262 sur l'iPhone 17), et la barre d'action passait sur
  une ligne (carré bleu + Valider) à 880 px de haut ou moins
  (`scene-action-bar.tsx`). Depuis la relecture du 18 octobre 2026, Valider
  vit dans le dock collé en bas ; la barre a eu deux rangées à 700 px de haut
  et plus (avec le mot « Écouter »), ce qui coupait la seconde rangée du
  QCM 4 sur l'iPhone 17 : depuis le réglage du premier écran, UNE ligne sur
  tous les téléphones (960 px ou moins), Écouter avec son mot sur 42 %, Pio
  à 28 % de la hauteur utile (227 px sur l'iPhone 17), et toutes les tuiles
  d'un QCM tiennent au-dessus du dock (`docs/direction-jeu-exercices.md`,
  « Le premier écran »).
  Résultat d'alors sur l'iPhone 17 (402 × 874) : QCM 4
  options tient avec 59 px de marge ; QCM 3, frise, phrase à trous, écoute,
  couleurs, dessin, mise en ordre tiennent ; association à quatre paires
  déborde de 10 px, réponse courte à pavé de 18 px (le bas de Valider),
  glisser-déposer à trois boîtes de 159 px.
- **Le clip HEVC alpha « ask » joue** (pas de halo violet, la loupe et le
  doigt entiers, `pioLeft=20`, `pioRight=194`), monte 700 ms après la carte,
  et laisse la place à l'affiche dès que la voix part (`[pio] clip=0
  voix=playing`), puis revient quand elle se tait : sur le film
  (`recordVideo`, 10 images par seconde), aucune image vide ; le seul
  raccord visible est la tête qui revient de biais à droit si le clip était
  au milieu de son tour de regard au moment du toucher.
- **Les écarts d'images** (mode développement, `[raf]`, 60 Hz) : au repos
  16,7 ms ; toucher Pio ou Écouter (la voix part, le clip se démonte) : moyenne
  18–21 ms, pire 69–102 ms ; choisir une tuile : pire 38 ms ; Valider une
  mauvaise réponse : pire 140 ms ; Valider la bonne, puis la carte suivante,
  sa voix automatique et son clip : 309, 155 puis 363 ms de pire écart sur
  trois secondes. La moyenne reste sous 25 ms partout sauf la seconde du
  verdict juste (31 ms) ; les gels au-dessus de 100 ms sont tous au verdict et
  à l'arrivée de la carte suivante, comme avant la scène. Les leviers restants :
  le démontage du `<video>` dans l'image du verdict (80 à 140 ms à lui seul,
  mesuré par le remontage après la scène de réponse), et le départ de la voix
  automatique pendant le ressort de la carte (`new Audio().play()` bloque
  70 à 100 ms sur iOS), que l'on pourrait retarder de 350 ms.
- Le clavier des lettres (réponse courte en mode texte) a été vu ensuite,
  avec le dock (§ 1, « Le dock et le clavier »).

**Le dock collé en bas, mesuré le 18 octobre 2026 sur l'iPhone 17,
`/dev/seance/?exo=<type>&sonde=1&calme=1`.** Dock de 128 px (une ligne :
carré bleu + Valider, barre d'accueil comprise ; depuis le réglage du premier
écran, Écouter AVEC son mot et un dock de 122 px : 88 plus la barre
d'accueil), `dock=746-874`. Première
réponse visible au-dessus du dock sans défiler sur onze types (marge : QCM 4
108 px, QCM 3 125, association 166, mise en ordre 234, phrase à trous 215,
réponse courte 206, en lettres 164, frise, couleurs 167, écoute 151, dessin
248) ; le glisser-déposer à trois boîtes reste l'exception (première
étiquette 105 px SOUS le haut du dock : les boîtes prennent le premier écran,
décision du propriétaire en attente). Défilée en bas, la carte passe au-dessus
du dock sur tous les types (24 px de jour, 44 sur la mise en ordre). Faire
défiler l'association (120 px, aller et retour) avec le dock : 16,7 ms de
moyenne, 17 ms de pire écart, rien à repeindre. Au verdict, le dock ne change
ni de hauteur ni de contenu (`empty=0`, `dock=746-874` d'un bout à l'autre du
film) ; les gels sont ceux d'avant lui (250 ms au verdict, 349 ms à l'arrivée
de la carte suivante avec sa voix et son clip). Ce que le film a montré en
plus : au verdict, le ciel restait VIDE à la place de Pio pendant 200 à
300 ms, la bulle encore à « C'est parti ! ». Trois films l'ont cerné : ni
précharger et décoder l'affiche « cheer » d'avance, ni retarder le démontage
de la `<video>` d'une image calme n'y changeaient rien, la couche vidéo du
clip HEVC s'éteint d'elle-même dès que le son du verdict part, avant que la
page ait repeint. Depuis, `Pio` garde l'affiche de la pose PEINTE SOUS le
clip (`components/student/pio.tsx`, `decoding="sync"`), et `CoachPio`
demande les affiches de la réaction dès que la carte est posée
(`preloadPioPosters`) : quatrième film, plus aucune image vide (le poster
« ask » tient jusqu'à la scène, puis « cheer »). Ce qui dépasse de l'affiche
pendant que le clip bouge tient dans un à deux pixels de bord à la taille de
la scène (5,7 % de la silhouette à pleine résolution au pire, mesuré sur
`ask.webm`). Mais sous un clip qui BOUGE, la même affiche faisait un Pio en
double (écran de fin, « cheer » saute, l'affiche debout derrière lui) :
l'affiche ne reste plus sous le clip que des poses déclarées quasi immobiles
(`still`, « ask » seule) ; la mesure par pose et le film de contrôle sont
dans `docs/pio-animations.md` (« L'affiche sous le clip »).

**Le dock dans le WebView Android, mesuré le 18 octobre 2026 sur l'émulateur
Pixel_Jotna (412 × 840, `/dev/seance/?exo=<type>&sonde=1&calme=1`, puis
`&bas=1`).** Dock de 94 px sur une ligne (carré bleu + Valider : la fenêtre
fait 840 px, sous le seuil de 880 d'alors ; la relecture a mis deux rangées
avec le mot « Écouter » au-dessus de 700 px, puis le réglage du premier écran
a remis une ligne, avec le mot, sur tous les téléphones : 88 px de dock dans
cette fenêtre), `dock=746-840`,
collé au-dessus de la
barre de navigation du système. « Valider » visible sans défiler sur les
douze types ; première réponse au-dessus du dock sur onze (marge : QCM 4
165 px, QCM 3 179, association 219, mise en ordre 288, phrase à trous 270,
réponse courte 263, en lettres 221, frise 231, couleurs 221, écoute 205,
dessin 303) ; le glisser-déposer à trois boîtes garde sa première étiquette
51 px sous le haut du dock (même exception que sur l'iPhone). Défilée en bas,
la carte passe au-dessus du dock partout (23 à 199 px de jour). Aucune
erreur console propre à la galerie ; le badge « 1 Issue » de Next est le
`Filesystem.readFile` du hors-ligne (le cache n'existe pas dans cette coque).
Les émojis sont ceux de Noto, aucune case vide.

Les écarts d'images (mode développement) : faire défiler l'association
(180 px, deux allers-retours au doigt) avec le dock, au tier sobre (celui que
l'AVD de 2 Go choisit) : GPU logiciel 16,7 à 19,6 ms de moyenne, pire 50 ms ;
GPU du Mac 16,7 ms, pire 16,8. Au tier riche, le clip VP9 alpha « ask »
(`ask.webm`, 576 × 1024, ~25 images par seconde) joue dans le WebView, sans
halo ; la voix (`?voix=1`, toucher Pio) le rend à l'affiche puis il revient
1,4 s plus tard, comme sur l'iPhone. Son prix : au GPU logiciel, la page au
repos passe de 16,7 à 38 ms par image et le défilement à 43–70 ms (pire
533 ms) ; au GPU du Mac, tout reste à 16,7 ms (pire 50 ms au toucher de
Pio). Le décodage VP9 alpha est logiciel sur Android : le tier (`use-device-
tier`) est ce qui protège les téléphones modestes, pas le GPU ; et comme un
Android à huit cœurs lents et 4 Go passe ce tier, le clip ne joue que vingt
secondes par question (`CLIP_PLAY_MS`, `session-stage.tsx` ; mesuré sur le
Mac, il tenait le moteur de rendu à 18–21 % d'un cœur contre 9–12 % en
pause), puis Pio reste sur son affiche. Le verdict
(`scripts/android-webview-mesure.mjs seance --level sobre`, GPU du Mac) :
toucher une tuile 16,7 ms, Valider faux 18 ms de moyenne (pire 83 ms),
Valider juste 17,6 ms (pire 67 ms), relier une paire 16,7 ms ; aucun écart
au-dessus de 100 ms.

**Relecture du code final dans le WebView Android (18 octobre 2026, même
émulateur, fenêtre 412 × 840, GPU logiciel puis GPU du Mac ; captures dans
`<scratchpad>/shots/barre-android-v2/`).** Les douze types en première
question (`tour/fit-<type>.png`, puis `bas-<type>.png` défilé en bas) : dock
de 88 px sur une ligne, « Écouter » avec son mot, `752–840`, posé au-dessus
de la barre de navigation du système ; « Valider » visible sans défiler
partout ; TOUTES les réponses entières au-dessus du dock sur onze types
(QCM 4 : quatre tuiles, 111 px de marge sous la dernière ; QCM 3, mise en
ordre, phrase à trous, pavé de chiffres, frise, couleurs, écoute, dessin,
lettres, glisser-déposer à trois boîtes : cinq étiquettes et boîtes
entières) ; l'association à huit tuiles garde sa dernière tuile 2 px sous le
haut du dock (754 pour 752) et se finit en défilant ; défilée en bas, la carte
passe au-dessus du dock partout (24 à 251 px). Pas de défilement horizontal,
aucune erreur console propre à la galerie, émojis Noto sans case vide. Le
clavier des lettres (`clavier/`) : fenêtre 840 → 528, dock `442–528` au-dessus
de la barre de suggestions, champ `345–413` visible, « marmite » tapé clavier
levé, « Valider » dans le dock juge (« Bravo ! », clavier rangé), un toucher
sur l'en-tête range le clavier et le dock redescend (`752–840`) sans saut ;
rien à régler dans `capacitor.config.ts` ni dans le manifeste
(`adjustResize` est le défaut d'Android). Pio (`pio/`, niveau riche) : le clip
`ask.webm` joue (2 images perdues sur 37), Pio touché lance la voix et montre
l'affiche, le clip revient à la fin ; « Écouter » bat ses barres, un second
toucher l'arrête. D'une question à l'autre (`transition-apres/`), le dock
garde son rectangle (`752/88`), jamais vide. Les écarts d'images, défilement
de 180 px en deux allers-retours sur l'association et le glisser-déposé :
GPU logiciel, niveau sobre 17 à 20 ms de moyenne (un trou de 400 ms sur le
premier geste, aucun ensuite), niveau riche 37 ms (clip VP9 décodé au
processeur) ; GPU du Mac, 16,7 ms partout, pire 16,8, niveau riche compris,
et `android-webview-mesure.mjs seance --level sobre` 16,7 à 18 ms par geste,
pire 50 ms. Ce que cette relecture a corrigé : la scène de réponse qui ne
s'effaçait pas à l'arrivée de la carte suivante (deux Pio le temps du fondu,
`docs/direction-jeu-exercices.md`, « Ce que le WebView Android a appris »).

## 7. Où vont les images

Dans le scratchpad de la session, jamais dans le dépôt :
`<scratchpad>/shots/<étape>/` pour Chromium, `<scratchpad>/shots/<étape>/ios/`
et `<scratchpad>/shots/android/` (`galerie/`, `seance/`, `films/`) pour les
webviews. Regardez-les
avec l'outil de lecture d'images avant de conclure.
