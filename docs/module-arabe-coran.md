# Module « Arabe & Coran » — mise en service

Ce module apprend à un enfant à lire l'arabe : l'alphabet d'abord (écouter,
reconnaître, prononcer, écrire au doigt), puis les voyelles, l'assemblage, les
premiers mots, six sourates courtes, et enfin leur **mémorisation** avec
révision espacée. Il est **éteint pour toutes les écoles** tant que personne ne
l'allume, et il **fonctionne sans aucune configuration** — seule la voix demande
une clé.

---

## 1. L'allumer pour une école

Fiche de l'école (`/admin/ecoles/<id>`) → section **Modules optionnels** →
« Activer pour cette école ».

Qui a le droit : un `admin`, ou le `directeur` rattaché à cette école en
personnel actif (`schoolStaff`). Un professeur ne peut pas — allumer un
enseignement religieux pour toute une école n'est pas une décision
d'enseignant. La garde est côté serveur (`convex/modules.ts`), l'écran ne fait
que l'exposer.

Ce que voient les élèves de l'école, une fois allumé :

- un médaillon rond « Arabe & Coran » posé à côté de Pio sur leur accueil :
  une image et un titre, sans phrase d'explication. C'est la seule porte
  d'entrée, il n'y a pas d'onglet dans la barre de navigation ;
- le chemin du Coran sur `/student/arabe` : une carte de jeu qui monte du
  village de l'enfant jusqu'à la Kaaba (voir §7).

**Éteindre n'efface rien.** Les progressions restent en base et reviennent si
l'école rallume. Aucun autre élève n'est touché : le réglage est par école.

### Placer les élèves (une fois le module allumé)

Sous l'interrupteur apparaît **Niveau des élèves en arabe** : la liste des
élèves inscrits, avec pour chacun trois indications facultatives.

| Ce qu'on indique | Ce que ça fait |
| --- | --- |
| **Niveau** — débutant / intermédiaire / confirmé | Ouvre le parcours jusqu'au début des voyelles (intermédiaire) ou des sourates (confirmé). Débutant n'ouvre rien de plus. |
| **Leçon où il s'est arrêté** | Ouvre le parcours jusqu'à cette leçon précise. |
| **Sourate en cours** | Ouvre jusqu'à sa leçon de mémorisation. |

On prend **le repère le plus avancé des trois** : une sourate déclarée ne se
fait pas annuler par un niveau plus bas.

**Placer OUVRE des leçons, ça n'en valide aucune.** Un élève placé « confirmé »
a l'alphabet ouvert et **non fait**, sans étoiles — il a tout à gagner s'il le
fait. Le placement est la déclaration d'un adulte, pas une mesure : personne
n'a testé cet enfant ici.

**C'est un plancher, jamais un plafond.** Tout ce qui précède reste ouvert, donc
un enfant placé trop haut redescend seul dans le parcours — c'est la seule façon
de rattraper un placement faux sans qu'un adulte reprenne la main.

En face de chaque élève, « Ce que l'élève a réellement fait » montre les leçons
terminées, la plus avancée, et les sourates en mémorisation. C'est la
comparaison entre les deux colonnes qui rend l'écran utile : un enfant déclaré
« confirmé » resté à la troisième leçon d'alphabet s'y voit d'un coup d'œil.

**Le placement appartient à l'école qui l'a posé.** Un élève transféré ailleurs
n'emporte pas le jugement de son ancienne école : la ligne reste en base mais ne
s'applique plus, et la nouvelle école le place elle-même.

### Qui place

| Rôle | Ce qu'il peut placer | Où |
| --- | --- | --- |
| `admin` | tout le monde | fiche de l'école |
| `directeur` | les élèves de **son** école (`schoolStaff` actif) | fiche de l'école |
| `professeur` | les élèves de **ses propres classes** | `/teacher/students` |

Le professeur est celui qui entend l'enfant lire ; lui refuser le placement
obligerait à faire remonter chaque élève à un directeur qui ne l'a jamais
entendu. Mais **ses** élèves, et eux seuls : le lien est
`schoolClasses.teacherId`, celui que tout le dépôt utilise déjà pour dire « les
élèves de ce professeur » — pas `schoolStaff`, qui ouvrirait toute l'école à
tout le corps enseignant.

**Ni l'élève ni son parent ne placent.** Un enfant qui se déclarerait
« confirmé » sauterait sept leçons d'alphabet et se retrouverait devant
Al-Fātiḥa sans savoir lire : il ne tricherait pas, il se punirait. Et placer,
c'est décider d'un parcours scolaire à l'intérieur d'une école — un parent qui
juge son enfant mal placé en parle au maître, qui peut désormais corriger
lui-même.

La décision vit dans `convex/arabic/placementRules.ts`, en fonction pure : le
dépôt n'a pas `convex-test`, donc une garde écrite à l'intérieur d'une mutation
ne serait vérifiée par aucun test.

---

## 2. La mémorisation (niveau 6)

Les **mêmes** six sourates que le niveau 5, mais le texte s'efface. Une leçon
par sourate, ouverte seulement après que les six ont été **lues** — on ne
mémorise pas ce qu'on ne sait pas lire.

**Une séance donne trois versets neufs au plus.** C'est ce qu'un maître donne en
une fois : au-delà, ce qu'on ajoute chasse ce qu'on venait d'apprendre. Une
sourate de sept versets se mémorise donc en trois séances, et la séance reprend
là où l'enfant s'est arrêté.

**Trois degrés de masque.** Texte complet pour écouter ; **amorces** (première
lettre de chaque mot) pour réciter la première fois ; **rien** pour la liaison
et les révisions. Le nombre de mots reste visible à tous les degrés — c'est
l'aide qu'un maître donne en levant les doigts. Un bouton « Montrer » existe :
un enfant bloqué doit pouvoir revoir le texte plutôt que fermer l'onglet, et ce
qu'il récite ensuite est jugé sur ce qu'il **dit**, pas sur ce qu'il voyait.

**Chaque séance finit par une liaison** — réciter les versets 1 à n d'affilée,
texte caché. C'est le vrai point de rupture du ḥifẓ : un enfant qui sait quatre
versets séparément ne sait pas la sourate tant qu'il a besoin qu'on lui donne
le départ du suivant.

**La récitation est jugée dans l'ORDRE**, contrairement à la lecture
(`judgeRecitation` vs `judgeReading`). Réciter les bons mots dans le désordre,
c'est se souvenir du vocabulaire, pas du verset. Le seuil est aussi plus haut
(0,80 contre 0,70) : en lecture le texte est sous les yeux, en mémorisation il
n'y est plus. Après un échec, l'écran dit **où l'on s'est arrêté** — ce qu'un
maître dit — plutôt que « réessaie », qui fait recommencer depuis le début.

### La révision espacée

C'est la raison d'être du niveau : **une sourate mémorisée et jamais revue est
perdue.** Chaque sourate porte un échelon, et l'échelon dit quand elle revient :

| Échelon | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| Revient dans | 1 j | 3 j | 7 j | 16 j | 35 j | 90 j |

Une récitation réussie monte d'un cran, « presque » ne bouge pas, un échec
descend d'**un** cran — **jamais à zéro**. Un enfant qui bute un mardi soir n'a
pas tout oublié ; le renvoyer au premier échelon serait la façon la plus sûre de
lui faire détester la révision.

Les sourates dues apparaissent en tête du parcours. Une séance de révision fait
deux étapes : écouter, réciter la sourate entière à texte caché. Deux minutes,
et c'est ce qui doit rester faisable tous les jours.

**Le nombre de versets tenus ne redescend jamais** : ils ont été récités un
jour, et l'effacer sur un micro qui a mal entendu serait effacer le travail de
l'enfant. Seul l'échelon bouge dans les deux sens — c'est son rôle.

---

## 3. La voix (ElevenLabs) — optionnelle, mais c'est elle qui enseigne

Sans clé, le module marche : l'enfant lit la translittération, fait les
exercices de reconnaissance et écrit au doigt. Il ne peut simplement ni
**entendre** la lettre ni **se faire écouter**, ce qui est la moitié du module.

```bash
npx convex env set ELEVENLABS_API_KEY <clé>
```

Optionnelles, avec leurs valeurs par défaut :

| Variable | Défaut | À quoi elle sert |
| --- | --- | --- |
| `ELEVENLABS_VOICE_ID` | `vY0W52tbYe3pDfogQWP7` (Omar) | La voix qui lit tout le parcours. Voir plus bas pourquoi celle-ci. |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` | Le modèle de synthèse. Il doit lire l'arabe **vocalisé** : un modèle qui ignore les voyelles brèves prononcerait بَ et بِ de la même façon, et le niveau 2 du parcours n'aurait plus d'objet. |
| `ELEVENLABS_STT_MODEL_ID` | `scribe_v2` | Le modèle de transcription qui écoute l'enfant. `scribe_v1`, déprécié par ElevenLabs, transcrivait nos essais de la même façon. |
| `ELEVENLABS_STT_LANGUAGE` | `ara` | Code ISO-639-3. `ar` fonctionne aussi. |
| `ELEVENLABS_SPEED` | — | Vitesse de diction, entre `0.7` et `1.2`. Une valeur hors de cet intervalle est ignorée. Ralentir aide les débutants. |
| `ELEVENLABS_FR_VOICE_ID` | la voix du parcours | Donne aux **consignes** françaises une voix à part. Sans elle, Pio n'a qu'une voix, en français comme en arabe (voir plus bas). `npx convex run arabic/voice:listVoices` liste les voix du compte. |

**Les deux voix ont changé le 28 septembre 2026, à la demande du
propriétaire.** Il voulait une voix française plus douce que Sami, qu'il
trouvait bizarre, et pour l'arabe une voix d'homme, « agréable, douce ».
Choisir la voix est une décision pédagogique : on veut une diction douce,
posée, articulée, pas une voix de présentateur.

Neuf voix françaises ont lu la même consigne, treize voix d'homme les mêmes
lettres, syllabes et versets. Trois mesures ont départagé les candidates :

- **La douceur.** On mesure l'énergie dans les aigus et entre 2 et 5 kHz, la
  zone où une voix sonne dure. Sami en avait le plus des neuf ; Alexandre FR en
  a 11 dB de moins.
- **Les voyelles.** بَ, بِ et بُ doivent porter trois voyelles nettement
  distinctes, sans quoi le niveau 2 n'a plus d'objet. Omar les sépare mieux
  qu'Ekram, la voix de femme d'avant ; seul Tariq, une voix bien plus dure,
  fait mieux.
- **La fidélité.** Chaque verset du module, transcrit par `scribe_v2`, doit
  rendre exactement son texte. Omar a lu les 27 sans une faute. Au même essai,
  Ekram avait ajouté des mots avant « الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ » :
  la synthèse peut inventer, il faut l'écouter.

Les deux voix retenues sonnent aussi au même volume, autour de −20 LUFS. Quand
la consigne française s'enchaîne avec l'arabe, l'enfant n'entend plus de saut ;
entre Sami et Ekram, il y avait près de sept décibels.

**Une mesure ne remplace pas l'oreille.** C'est l'écoute du propriétaire qui
confirme. Deux voix de rechange ont été notées : Anas (`R6nda3uM038xEEKi7GFl`),
plus douce encore mais aux voyelles moins séparées, et Loïc
(`ojsdYNTmnPdf7yAl8rI5`), une voix française chaleureuse à l'accent africain,
mais plus faible de 8 dB que la voix arabe. Pour changer, posez l'identifiant dans
`ELEVENLABS_VOICE_ID` ou `ELEVENLABS_FR_VOICE_ID`, et faites écouter la voix à
un enseignant. Une voix de la bibliothèque ElevenLabs s'utilise par son
identifiant, même quand elle n'a pas été ajoutée au compte. Une voix choisie
sans que personne ne l'ait entendue finira dans les oreilles de six cents
enfants.

**Depuis le 29 septembre 2026, Pio n'a plus qu'une voix.** En testant sur son
iPhone, le propriétaire a entendu deux voix dans la même consigne : « Touche
la lettre… » par Alexandre FR, puis « بَاء » par Omar. Il a demandé une seule
voix, ou au moins une voix française moins robotique. Les mesures lui donnent
raison : la hauteur d'Alexandre ne variait que sur 4 à 5 demi-tons, contre 8
à 11 pour Omar, et une voix qui ne monte ni ne descend sonne comme une
machine. Omar dit donc aussi les consignes. Transcrites par `scribe_v2` en
français, les 38 consignes rendent leur texte sans une faute. Plus de ralenti
non plus : Omar parle déjà posément (18 caractères par seconde en français,
contre 19 à 22 pour Alexandre ralenti à 0,92). `ELEVENLABS_FR_VOICE_ID`
permet encore de séparer les deux voix.

### Ce que ça coûte, et pourquoi c'est borné

- **La synthèse est mise en cache** (`arabicAudioClips` + stockage Convex). Le
  texte du module est fini — 28 noms de lettres, 84 syllabes, une trentaine de
  mots, 28 versets et leurs liaisons de mémorisation : chaque son n'est payé
  qu'une fois, pour toutes les écoles et tous les enfants. La dépense s'éteint d'elle-même une fois le cache chaud.
  Changer de voix ou de modèle crée de nouveaux clips (la clé de cache les
  porte) ; les anciens restent, inatteignables.
- **La transcription se paie à chaque « je répète »** — elle ne peut pas être
  mise en cache, l'audio étant différent à chaque fois. D'où un plafond de
  **80 transcriptions par enfant et par jour** (`STT_DAILY_LIMIT`,
  `convex/arabic/db.ts`) — une séance de mémorisation en consomme quatre au
  plus (trois versets et une liaison), une révision, une seule. Au-delà, l'enfant lit un message bienveillant et
  continue sa leçon sans micro. Le compteur est dans `arabicVoiceUsage`, une
  ligne par (élève, jour), en UTC.
- **Cette dépense n'entre pas dans le budget IA mensuel** d'OpenAI
  (`aiGateway/budget.ts`). C'est délibéré : réviser l'alphabet en classe ne doit
  pas pouvoir fermer la génération d'exercices de mathématiques.

### Sans réseau, dans l'application

L'application télécharge tous les sons du module dès que l'école l'a allumé,
puis les joue depuis l'appareil (`docs/hors-ligne.md`). Les leçons,
l'alphabet et les exercices de reconnaissance se font donc sans réseau, voix
comprise, et leurs résultats partent au serveur au retour du réseau.

Se faire écouter demande le réseau, puisque la transcription se fait chez
ElevenLabs. Sans réseau, « je répète » devient un entraînement : l'enfant
s'enregistre, réécoute sa voix (« Ma voix »), puis écoute Pio. Rien n'est
noté ni envoyé, et l'enregistrement disparaît avec l'écran. Garder la voix
pour la juger plus tard romprait la règle qui suit. La mémorisation des
sourates, qui avance sur ce verdict, n'avance donc qu'en ligne.

### La voix de l'enfant n'est conservée nulle part

Les octets arrivent en argument de l'action, partent en transcription, et
disparaissent avec elle : ni stockage, ni table. **La transcription elle-même
n'est pas écrite** : elle est rendue à l'écran pour que l'enfant voie ce qui a
été entendu, même quand elle est en latin, et s'efface avec la page. Le journal
Convex garde une seule ligne technique par essai : taille et format de l'audio,
crête de la jauge du micro, longueur de la transcription et son écriture
(arabe, latin, vide), verdict. Jamais son contenu. Elle suffit à trancher
quand un adulte signale que « l'appli n'entend pas ».

Un enregistrement silencieux n'est pas envoyé du tout. Si la jauge n'a jamais
dépassé 0,02, l'écran dit « Je n'entends rien du tout. Un adulte peut vérifier
que le micro est autorisé. », et aucune transcription n'est payée. C'est le
cas d'un micro refusé ou coupé, qui enregistre du silence sans erreur. Ce qui reste en base est ce
qu'un cahier garderait : la date, l'exercice, et si c'était juste.

L'enregistrement est borné à 8 secondes et 2 Mo, et le micro est relâché à
l'arrêt, à l'erreur et au démontage du composant.

### Pour un enfant qui ne sait pas encore lire

Le 28 septembre 2026, le propriétaire a tranché : un débutant qui apprend à
lire est presque toujours un jeune enfant, souvent incapable de lire la
consigne en français. Le module a donc été repensé pour lui. Une école peut
ainsi mener le français et le Coran de front, avec des enfants qui ne lisent
encore ni l'un ni l'autre.

**Chaque consigne est dite.** Chaque écran fait parler Pio tout seul (dans
l'application, la vue web n'exige pas de geste pour jouer un son), et un gros
bouton 🔊 redit la consigne. Les phrases viennent d'un catalogue fermé,
`convex/arabic/consignes.ts`, dites par la voix de Pio, celle qui lit aussi
l'arabe ; la bulle affiche le même texte pour l'adulte. Quand la consigne
nomme une lettre, le français s'enchaîne avec l'arabe, sans changer de voix :
« Touche la lettre… » puis « بَاء ».

**Quand l'enfant réussit, Pio dit « MashaAllah ».** C'est la demande du
propriétaire, le 29 septembre 2026, avec une consigne : varier. Six bravos
tournent d'une réussite à l'autre (`BRAVOS` et `bravo()`), sans hasard, pour
qu'une même tentative redise toujours le même : « MashaAllah ! »,
« MashaAllah, c'est ça ! », « Bravo, MashaAllah ! », « MashaAllah, très
bien ! », « Tabarakallah ! Continue comme ça. », « Barakallahou fik, c'est
parfait ! ». La bulle écrit ces formules en lettres latines, pour l'adulte ;
la voix les dit en arabe (`spokenConsigne`), et la transcription de contrôle
entend bien « masha'allah », « tabarakallah » et « barakallahu fik ». Les
jeux, la prononciation, la lecture, la récitation, le tracé et la fin de
leçon les emploient ; sur le Coran, « C'est lu, MashaAllah » reste sobre.

**L'attente montre le module.** Pendant un chargement, la carte, la leçon et
l'album affichent la Kaaba du médaillon de l'accueil, posée sur une étoile
dorée à huit branches, le ۞ des quarts de hizb, qui tourne lentement
(`components/arabic/quran-loader.tsx`). Le baobab du loader général reste
pour le reste de l'application.

**Une lettre, une image.** Chaque lettre a son mot-image, comme dans les
abécédaires arabes pour enfants : أ comme أَسَد (le lion, comme Pio), ب comme
بَطَّة (le canard)… (`convex/arabic/letterWords.ts`, une image emoji chacune).
**Ces 28 mots ont été saisis à la main : un maître d'arabe doit les relire,
comme le texte coranique (§4).**

**Une leçon d'alphabet se déroule lettre par lettre** (`lib/arabic/session.ts`),
à la manière de la première leçon de la Qaida des daaras :

1. rencontrer la lettre : son nom, son image ; on touche l'une ou l'autre pour
   les réentendre ;
2. la répéter aussitôt au micro (ci-dessous) ;
3. éclater le bon ballon quand Pio dit son nom (trois ballons, des lettres qui
   se ressemblent).

Après les quatre lettres : relier chaque lettre à son image, compter les
points (dessinés, pas écrits en chiffres), puis tracer chaque lettre au doigt.
Les **formes attachées** ne sont plus demandées au niveau 1 : un débutant
apprend d'abord la lettre seule, les formes viennent avec l'assemblage des
mots. Aucun jeu ne demande de lire du français, et l'enfant finit toujours
par réussir (un ballon faux se dégonfle) ; la note, elle, est celle du premier
geste.

**Un nom de lettre peut revenir en latin.** Sur un mot d'une syllabe, la
transcription ignore parfois la langue demandée et écrit « Jim » pour جِيم ou
« Cuff » pour كَاف. Le juge compare alors les consonnes du mot latin à celles
du nom de la lettre (`latinSkeleton`). Pour les lettres que le latin confond
avec une voisine (ح, ع, ط, ض, ص, ظ, ق), une réponse latine vaut seulement
« presque ». Autre piège corrigé le 29 septembre 2026 : « أليف », un alif dit
avec un i long, perdait son ال comme un article, et un alif juste était refusé.

**Les voyelles se vérifient à l'oreille.** La transcription de la voix ne
distingue pas بَ de بِ (`matching.ts` retire les voyelles). Les leçons de
voyelles ont donc un jeu d'écoute noté sur l'appareil, « touche le son » :
dans une leçon d'une seule voyelle, trois lettres avec cette voyelle (بَ تَ ثَ) ;
dans la leçon « mélange », la même lettre avec ses trois voyelles (بَ بِ بُ).

**Les versets s'écoutent puis se lisent aussitôt,** un à la fois : c'est le
talqīn du maître, qui dit et fait redire. Écouter huit versets d'affilée puis
les relire tous demandait trop de mémoire à un enfant de six ans.

**Répète après Pio : l'aide monte d'un cran à chaque essai**
(`components/arabic/pronounce-coach.tsx`). Pio, en boubou, dit la lettre puis
« À toi ! », écoute l'enfant (pose `listen`), l'applaudit (`bravo`) ou
l'encourage (`encourage`), et DIT son retour :

1. premier essai manqué : « parle un peu plus fort, près du micro », et il
   redit la lettre ;
2. deuxième essai manqué : l'écoute lente (le même clip joué à 0,7, sans
   nouvel appel au serveur), le conseil de bouche dit à voix haute (gorge,
   langue, dents, lèvres, lettre « épaisse ») et la syllabe seule à essayer ;
3. troisième essai : « tu progresses, on la redira plus tard », et le bouton
   pour continuer.

Pio se tait pendant que le micro écoute (sa voix serait enregistrée). Aucune
phrase ne dit que c'est faux (règle 1 de `lib/arabic/copy.ts`). Pendant
l'enregistrement, cinq barres montent avec la voix : l'enfant voit que le
micro l'entend.

**L'album.** La page « L'alphabet » est devenue « Mon album » : chaque lettre
d'une leçon terminée y devient un autocollant doré avec son image, gagné en
fin de leçon. Les quatre formes y restent, rangées « pour les grands ».

### Le micro dans l'application mobile

Capacitor accorde lui-même le micro à la vue web (`requestMediaCapturePermission`
répond « oui » dans `WebViewDelegationHandler.swift`). Il reste la permission
du système :

- iOS : `NSMicrophoneUsageDescription` dans `ios/App/App/Info.plist`. Sans
  cette clé, l'application s'arrête net au premier accès au micro ;
- Android : `RECORD_AUDIO` et `MODIFY_AUDIO_SETTINGS` dans
  `android/app/src/main/AndroidManifest.xml`.

À la première répétition, le système demande l'autorisation une seule fois.

**Le micro ne se teste pas dans le simulateur iOS.** Sa vue web ne reçoit pas
le micro du Mac : elle reçoit le signal de test de WebKit, une tonalité
continue et un bip par seconde. Le 29 septembre 2026, un enregistrement a été
gardé le temps de l'analyser : fichier valide (Opus, 48 kHz), mais aucune voix
dedans, d'où une transcription toujours vide. La jauge bouge et tout le reste
de la chaîne marche, ce qui trompe. Pour tester la prononciation, il faut un
vrai iPhone, ou le site dans un navigateur d'ordinateur.

> **Depuis Claude Code sur le web, `api.elevenlabs.io` est bloqué par le proxy
> de sortie**, comme `bictorys.com` et `developers.paydunya.com`. Le chemin
> voix n'a donc **jamais été exécuté contre l'API réelle** : il est écrit
> d'après leur documentation. Première mise en service = premier vrai test.
> Vérifiez d'abord une écoute (le clip doit apparaître dans
> `arabicAudioClips`), puis une répétition.

---

## 4. Le texte coranique — à faire relire avant toute mise en classe

`convex/arabic/quran.ts` porte six sourates (Al-Ikhlāṣ, Al-Kawthar, Al-ʿAṣr,
Al-Falaq, An-Nās, Al-Fātiḥa). **Ce texte a été saisi à la main et n'a pas été
copié depuis une édition faisant autorité.** Une voyelle déplacée n'est pas une
coquille : c'est un mot faux enseigné à un enfant.

Deux points à trancher par l'école :

1. **La relecture.** Faire relire les six sourates par un maître d'arabe ou un
   imam, sourate par sourate, et noter la relecture dans ce dossier. Le test
   `convex/__tests__/arabic.test.ts` vérifie le **nombre de versets** de chaque
   sourate — il attrape un verset perdu au copier-coller, jamais une voyelle
   fausse.
2. **La riwāya.** Le texte est en **Ḥafṣ**, la lecture des mushafs du Caire et
   de Médine. **Le Sénégal lit majoritairement en Warsh**, où l'orthographe et
   certaines voyelles diffèrent. Une école qui enseigne Warsh ne doit pas servir
   ces textes tels quels. Le champ `riwaya` existe pour rendre la différence
   visible ; une table Warsh peut être ajoutée à côté sans toucher au reste du
   module.

---

## 5. Où vit le code

| Fichier | Ce qu'il porte |
| --- | --- |
| `convex/arabic/alphabet.ts` | Les 28 lettres : quatre formes, points, confusions, syllabes, conseils de prononciation. |
| `convex/arabic/quran.ts` | Les six sourates (voir §4). |
| `convex/arabic/curriculum.ts` | Les 6 niveaux et 30 leçons, et ce que chaque leçon fait faire. |
| `convex/arabic/hifz.ts` | Masque du texte, liaisons, échelle de révision espacée. |
| `convex/arabic/matching.ts` | Normalisation de l'arabe, jugement d'une prononciation, d'une lecture et d'une récitation. |
| `convex/arabic/progressRules.ts` | Déverrouillage des leçons, plancher de placement, note, étoiles. |
| `convex/arabic/memorization.ts` | Ce qui est mémorisé et quand ça revient (requête, application du résultat). |
| `convex/arabic/placement.ts` | Le placement des élèves (lecture, écriture, listes école et professeur). |
| `convex/arabic/placementRules.ts` | Qui a le droit de placer qui — fonction pure, testée. |
| `convex/arabic/lessons.ts` | Parcours et progression de l'élève (requêtes et mutations). |
| `convex/arabic/voice.ts` | Synthèse et transcription (actions, `"use node"`). |
| `convex/voice/elevenlabs.ts` | La voix de Pio : fournisseur, variables `ELEVENLABS_*` et synthèse. Le lecteur de consignes des exercices (`convex/voice/exercisePrompt.ts`) s'en sert aussi, avec le même cache. |
| `convex/arabic/db.ts` | Ce que les actions ne peuvent pas faire elles-mêmes (cache, quota, écriture des tentatives). |
| `convex/modules.ts`, `convex/moduleCatalog.ts` | L'allumage par école. |
| `lib/arabic/tracing.ts` | La note du tracé au doigt. |
| `lib/arabic/session.ts` | L'enchaînement des exercices d'une leçon. |
| `components/arabic/*` | Écoute, micro, carré d'écriture, exercices, texte masqué, éditeur de placement (partagé par la fiche d'école et l'espace professeur). |
| `components/arabic/quran-journey.tsx` | Le décor du chemin : paysages par zone, Kaaba, rubans de niveau, départ. |
| `components/arabic/pronounce-coach.tsx` | « Répète après Pio » : Pio, sa bulle et l'aide qui monte à chaque essai (§3). |
| `convex/arabic/consignes.ts` | Les consignes dites en français : un catalogue fermé, le même texte à l'écran et à l'oreille. Les bravos « MashaAllah » (`bravo`) et leurs formules dites en arabe (`spokenConsigne`). |
| `components/arabic/quran-loader.tsx` | L'attente du module : la Kaaba du médaillon sur l'étoile ۞, à la place du baobab. |
| `convex/arabic/letterWords.ts` | Le mot-image de chaque lettre (أ comme أَسَد 🦁). À faire relire, comme le texte coranique. |
| `components/arabic/speech.ts`, `coach.tsx` | Le lecteur de voix partagé (un son à la fois, consigne française puis arabe) et Pio qui dit la consigne. |
| `components/arabic/drills.tsx` | Les jeux sans lecture : rencontre, ballons, images à relier, points à compter. Les tuiles lettre et mot-image (`LetterTile`, `WordTile`) servent aussi à l'album. |
| `components/arabic/arabic-glyph.tsx` | Une lettre ou un mot arabe centré sur son encre et contenu dans sa case. Amiri dessine ج ou ع loin sous la ligne : centrées sur la ligne, ces lettres débordaient et cachaient leur nom. Le carré d'écriture place son guide de la même façon. |
| `public/images/coran/` | Les paysages du chemin, la Kaaba et le médaillon de l'accueil. |
| `app/(student)/student/arabe/*` | Parcours, alphabet, séance. La séance est `/student/arabe/lecon?key=<leçon>` : le bundle est exporté en statique pour Capacitor (`output: "export"`), et aucune route `[segment]` n'y survit sans `generateStaticParams`. |

**Le contenu est du code, pas des lignes en base** : rien à ensemencer, rien à
migrer, et une faute de frappe se voit en revue. Seules la progression, le cache
audio et les compteurs vivent en base.

---

## 6. Ce que le module ne fait pas

- **Il ne juge pas une récitation.** Le tajwīd (allongements, nasalisations,
  points d'articulation) demande une oreille humaine ; une comparaison de texte
  n'en dit rien. Le module fait **lire**, il n'évalue pas une récitation.
- **Il ne note pas le tracé de façon opposable.** La note du carré d'écriture
  est calculée sur l'appareil (seul le navigateur a la police) : c'est une aide
  à l'apprentissage, pas une preuve. Les tentatives le disent
  (`arabicAttempts.source = "device"`).
- **Il ne certifie pas une mémorisation.** Le module sait si les mots y sont et
  dans l'ordre ; il ne sait rien du tajwīd. Une sourate « sue » au sens du
  module peut être fautive au sens d'un maître.
- **Il n'a pas encore de tableau de classe.** Le professeur place ses élèves et
  voit la progression de chacun en ouvrant sa ligne, mais aucun écran ne montre
  la classe d'un coup d'œil — qui bute sur quelle lettre, qui n'a pas révisé sa
  sourate cette semaine. Les données sont là (`arabicLessonProgress`,
  `arabicAttempts`, `arabicHifz`, indexées par élève) ; c'est la suite naturelle
  du chantier.
- **Il ne traduit pas le Coran verset par verset.** Traduire est un acte
  d'exégèse ; on donne le nom de la sourate et son sens, rien de plus.

---

## 7. Le chemin du Coran

`/student/arabe` est une carte de jeu, voulue ainsi par le propriétaire le
28 septembre 2026 : l'enfant part de son village et monte jusqu'à la Kaaba.
Les trente leçons sont trente étapes, dans l'ordre du programme, sur la même
mécanique que les sentiers des matières (`GameMap`, en sens montant :
`QURAN_TRAIL.direction = "up"`). Pio y marche en boubou ; toucher une étape le
fait marcher, puis la fiche de l'étape se lève avec le bouton qui ouvre la
leçon. Les règles d'ouverture ne changent pas (§1, placement).

Pio marche dans les deux sens : de dos quand il monte vers la Kaaba
(`walkAway`), de face quand l'enfant le renvoie à une étape d'avant
(`walkToward`), tourné à gauche ou à droite selon le sentier. Avant le 29
septembre 2026, il se dandinait de face dans les deux cas et semblait
reculer en montant (`docs/pio-animations.md`).

Le décor suit les niveaux :

| Zone | Niveaux | Image |
| --- | --- | --- |
| Village du Sénégal (cases, baobabs, petite mosquée) | 1-2, alphabet et voyelles | `zone-senegal*.jpg` |
| Sahara (dunes, oasis, tentes, chameaux) | 3-4, assembler et premiers mots | `zone-sahara.jpg` |
| Arabie au crépuscule (lanternes, coupoles) | 5-6, sourates et mémorisation | `zone-arabie*.jpg` |
| La Kaaba, sous un ciel étoilé | le but, après la trentième leçon | `kaaba.jpg` |

Les images sont des peintures OpenArt (Nano Banana Pro) en vue du dessus, avec
le centre laissé libre pour le sentier tracé en code. **Aucune ne porte de
texte**, et c'est une règle du module : un générateur d'images invente de
fausses lettres. La première Kaaba générée portait sur sa bande dorée des
formes qui imitaient une calligraphie ; elle a été retouchée pour ne garder que
des spirales et des entrelacs. Toute nouvelle image du module se relit à la
loupe avant d'entrer dans `public/images/coran/`.

La Kaaba n'est jamais grisée ni « fermée » : tant que le chemin n'est pas fini,
une étiquette dit combien de leçons restent. Arrivé au bout, l'enfant lit une
phrase sobre, sans trophée, comme tout ce qui touche au Coran dans ce module.
