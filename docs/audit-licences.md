# Audit des licences de Jotna School

Audit du 22 octobre 2026. Il couvre les dépendances du code, les polices, les sons, la
musique, le texte coranique, les images, les clips, la voix et les outils de fabrication.
Ce n'est pas un avis juridique : fais relire les points marqués « à trancher » par un conseil.

## Résumé

| Zone | Verdict | Action |
| --- | --- | --- |
| Dépendances npm du site et de l'application | Sans risque | Aucune |
| Dépendances natives (Android, iOS) | Sans risque apparent | Lister les transitives avant les boutiques |
| Polices | Sans risque | Aucune |
| Sons de l'application (Mixkit) | Sans risque | Aucune |
| Musique de la vidéo (Mixkit) | Sans risque | Aucune |
| Remotion (vidéos de présentation) | À surveiller | Licence entreprise si l'équipe passe à 4 personnes |
| Texte des six sourates | Pas un problème de licence, un problème d'exactitude | Relecture par un maître d'arabe |
| Voix de Pio (ElevenLabs) | À trancher | Abonnement payant et conditions de la voix « Steve » |
| Images, personnage Pio, clips (OpenArt, gpt-image-2, Kling) | À trancher | Plan avec droits commerciaux et conditions des modèles |

## 1. Dépendances npm

Commande : `pnpm licenses list --prod --json`, puis la même sans `--prod`.

- 112 paquets en production. MIT 83, ISC 16, Apache-2.0 6, BSD-3-Clause 2, et 5 autres
  paquets sous licence permissive : CC-BY-4.0 (1), Unlicense, MIT-0, 0BSD, MIT AND ISC.
- Un seul paquet de production sous une licence qui demande une attribution : `caniuse-lite`
  (CC-BY-4.0). Ce sont des données de compatibilité des navigateurs, lues au moment du build,
  pas livrées dans l'application.
- Hors production, trois paquets à copyleft faible : `@img/sharp-libvips-darwin-arm64`
  (LGPL-3.0-or-later), `axe-core` et `lightningcss` (MPL-2.0).
  - `sharp-libvips` est un binaire optionnel du poste de travail. Le site est exporté sans
    optimisation d'image (`images: { unoptimized: true }`) : il n'est pas livré.
  - `axe-core` est un outil de test, `lightningcss` un outil de build.
- Aucune licence interdisant l'usage commercial (GPL, AGPL, SSPL) n'est présente.

## 2. Dépendances natives

- Android : `androidx` (Apache-2.0), Capacitor (MIT), plugin `google-services` (Apache-2.0).
- iOS : Capacitor via Swift Package Manager (MIT).
- Non vérifié : les dépendances transitives de Gradle et de Swift Package Manager. Elles se
  listent avec `./gradlew app:dependencies` et dans Xcode. À faire avant la publication dans les boutiques.

## 3. Polices

`app/layout.tsx` charge Poppins, Geist Mono, Fredoka et Amiri avec `next/font/google`. Ces
quatre familles sont sous SIL Open Font License : usage commercial permis, redistribution
dans l'application permise. Next les sert depuis nos propres fichiers, sans appel à Google.
Il n'y a aucun fichier de police propriétaire dans le dépôt.
Cette licence est donnée de mémoire, je ne l'ai pas relue sur le site de chaque police.

## 4. Sons et musique

- `public/sounds/` : `correct.mp3`, `badge.mp3`, `level-up.mp3`. Source Mixkit, licence Mixkit :
  usage commercial sans attribution, mais pas de revente du fichier seul. Le fichier
  `public/sounds/LICENSES.md` le documente.
- `motion/` : « Let's Play Africa » (Michael Ramir C., Mixkit), même licence. Le morceau n'est
  pas dans le dépôt, un script le télécharge.
- Les sons du jeu qui viennent de la voix de Pio sont des sorties d'ElevenLabs (voir §7).

## 5. Remotion

Remotion (`motion/`, version 4.0.532) est gratuit pour les particuliers et les entreprises de
trois personnes au plus. À partir de quatre personnes, une licence entreprise est exigée. Le
compte inclut les équipes d'une collaboration. Les vidéos de présentation et de campagne
sociale sont les seuls usages : le produit ne dépend pas de Remotion.
Source : [Remotion, licence](https://remotion.dev/license).
À trancher : combien de personnes, toutes sociétés confondues, travaillent sur Jotna ?

## 6. Texte du Coran

- Six sourates (Al-Ikhlāṣ, Al-Kawthar, Al-ʿAṣr, Al-Falaq, An-Nās, Al-Fātiḥa) dans
  `convex/arabic/quran.ts`, en lecture Ḥafṣ.
- Le texte coranique lui-même n'est pas protégé par un droit d'auteur. Ce texte a été saisi à la
  main, sans copie d'une édition : il n'y a donc pas de licence d'édition à respecter.
- Le vrai risque est l'exactitude : une voyelle fausse enseigne un mot faux. Le dossier
  `docs/module-arabe-coran.md` demande déjà la relecture par un maître d'arabe ou un imam.
  Cette relecture n'est pas faite.
- Le Sénégal lit surtout en Warsh. Le module est en Ḥafṣ. C'est un choix de contenu à valider
  avec les écoles.
- Aucun enregistrement d'un récitant n'est utilisé : les versets sont dits par la voix de
  synthèse. Pas de droit de récitant à acquitter. À valider avec les écoles : faire réciter le
  Coran par une voix de synthèse est une question religieuse, pas juridique.

## 7. Voix (ElevenLabs)

- La voix de Pio est « Steve – Soft and Calm » (`jfEwztGDkpbpy89xeku6`), choisie dans la
  bibliothèque de voix. La transcription de la voix des enfants utilise Scribe.
- Le plan gratuit n'a pas de licence commerciale. Les plans payants en ont une. La licence
  vaut pour les audios fabriqués pendant l'abonnement : après une résiliation, les sons
  fabriqués hors abonnement ne seraient pas utilisables commercialement. Source secondaire,
  à confirmer sur les conditions d'ElevenLabs.
- Une voix de la bibliothèque peut porter des conditions de son créateur en plus.
- Le cache de sons est stocké dans notre base. Si le compte ElevenLabs change de plan ou ferme,
  vérifier le droit de continuer à servir les sons déjà fabriqués.
- À trancher : quel plan paie-t-on, et qui a lu les conditions de la voix « Steve » ?
- Sources : [guide des voix](https://elevenlabs.io/voice-guide),
  [conditions résumées](https://terms.law/ai-output-rights/elevenlabs/).

## 8. Images, Pio et clips générés par IA

- Origine : images de lieux et de Pio sur OpenArt (Nano Banana Pro), clips de Pio sur OpenArt
  avec Kling 3 Omni, images et clips récents par le studio (`gpt-image-2`, `klingai/kling-v3.0-i2v`),
  images d'objets de `public/objets/` fabriquées par le studio.
- OpenArt autorise l'usage commercial des créations, mais selon le plan : les sources récentes
  indiquent le plan Plus et au-dessus. Plan inconnu ici. Source :
  [OpenArt, droits commerciaux](https://openart.serif.ai/wiki/after-image-creation/commercial-use--copyrights).
- Les conditions propres à Kling et à Nano Banana, vues à travers OpenArt, ne sont pas
  publiées dans les sources que j'ai trouvées.
- Statut du droit d'auteur : une création entièrement générée par IA n'est en général pas
  protégée par le droit d'auteur dans plusieurs pays. Conséquence : quelqu'un pourrait copier
  l'image de Pio sans que le droit d'auteur permette de l'en empêcher. La marque (dépôt OAPI du
  nom et du logo) et les contrats protègent mieux que le droit d'auteur.
- À trancher : un plan OpenArt avec droits commerciaux était-il actif à la date de chaque
  génération ? Garder la preuve (facture, capture des conditions datée).
- Évite de demander à un modèle un personnage proche d'un personnage protégé. Pio doit rester
  une création propre.

## 9. Ce qu'il faut faire, par ordre

1. Garder la preuve de plan : facture ElevenLabs et OpenArt avec la date, et la capture des
   conditions commerciales du jour.
2. Faire relire les six sourates par un maître d'arabe, puis noter la date et le nom dans
   `docs/module-arabe-coran.md`.
3. Compter l'équipe pour Remotion. À quatre personnes, prendre la licence.
4. Lancer `./gradlew app:dependencies` et lister les paquets Swift avant la publication
   dans les boutiques.
5. Garder `pnpm licenses list --prod` dans la liste de contrôle d'une version : un paquet GPL
   ou AGPL ajouté plus tard doit se voir.
