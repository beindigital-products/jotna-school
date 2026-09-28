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

- une carte « Arabe & Coran » sur leur accueil ;
- un onglet « Arabe » dans la barre de navigation ;
- le parcours sur `/student/arabe`.

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

Qui a le droit : la même garde que l'allumage (admin, ou directeur de cette
école). Un professeur ne place pas.

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
npx convex env set ELEVENLABS_API_KEY  <clé>
npx convex env set ELEVENLABS_VOICE_ID <identifiant de voix>
```

Optionnelles, avec leurs valeurs par défaut :

| Variable | Défaut | À quoi elle sert |
| --- | --- | --- |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` | Le modèle de synthèse. Il doit lire l'arabe **vocalisé** : un modèle qui ignore les voyelles brèves prononcerait بَ et بِ de la même façon, et le niveau 2 du parcours n'aurait plus d'objet. |
| `ELEVENLABS_STT_MODEL_ID` | `scribe_v1` | Le modèle de transcription qui écoute l'enfant. |
| `ELEVENLABS_STT_LANGUAGE` | `ara` | Code ISO-639-3. `ar` fonctionne aussi. |
| `ELEVENLABS_SPEED` | — | Vitesse de diction, entre `0.7` et `1.2`. Une valeur hors de cet intervalle est ignorée. Ralentir aide les débutants. |

**`ELEVENLABS_VOICE_ID` n'a pas de valeur par défaut, et c'est voulu.** Choisir
la voix est une décision pédagogique : on veut une diction douce, posée,
articulée — pas une voix de présentateur. Elle dépend du compte qui la possède.
Écoutez plusieurs voix arabes dans la bibliothèque ElevenLabs, faites-en écouter
une à un enseignant, puis posez son identifiant. Une voix choisie sans que
personne ne l'ait entendue finira dans les oreilles de six cents enfants.

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

### La voix de l'enfant n'est conservée nulle part

Les octets arrivent en argument de l'action, partent en transcription, et
disparaissent avec elle : ni stockage, ni table, ni journal. **La transcription
elle-même n'est pas écrite** — elle est rendue à l'écran pour que l'enfant voie
ce qui a été entendu, et s'efface avec la page. Ce qui reste en base est ce
qu'un cahier garderait : la date, l'exercice, et si c'était juste.

L'enregistrement est borné à 8 secondes et 2 Mo, et le micro est relâché à
l'arrêt, à l'erreur et au démontage du composant.

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
| `convex/arabic/placement.ts` | Le placement des élèves par l'école. |
| `convex/arabic/lessons.ts` | Parcours et progression de l'élève (requêtes et mutations). |
| `convex/arabic/voice.ts` | Synthèse et transcription (actions, `"use node"`). |
| `convex/arabic/db.ts` | Ce que les actions ne peuvent pas faire elles-mêmes (cache, quota, écriture des tentatives). |
| `convex/modules.ts`, `convex/moduleCatalog.ts` | L'allumage par école. |
| `lib/arabic/tracing.ts` | La note du tracé au doigt. |
| `lib/arabic/session.ts` | L'enchaînement des exercices d'une leçon. |
| `components/arabic/*` | Écoute, micro, carré d'écriture, exercices, texte masqué. |
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
- **Il n'a pas encore d'écran enseignant.** Les progressions sont en base
  (`arabicLessonProgress`, `arabicAttempts`, `arabicHifz`, indexées par élève),
  et l'administration voit celle d'un élève à la fois depuis la fiche de son
  école. Un tableau de classe pour le professeur reste à faire.
- **Il ne traduit pas le Coran verset par verset.** Traduire est un acte
  d'exégèse ; on donne le nom de la sourate et son sens, rien de plus.
