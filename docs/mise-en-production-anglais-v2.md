# Mettre l'anglais v2 en production

Ce guide est pour la personne qui lance les commandes (le propriétaire). Claude ne lance aucune de ces commandes : le classifieur de permissions refuse les lectures et les écritures sur la production, et c'est voulu.

Le code de l'anglais v2 est dans `main` depuis la PR 182. Il n'est pas visible des élèves tant que les étapes ci-dessous ne sont pas faites. L'ordre compte.

## Ce qui ne marche pas tout seul

`programme/seed:run` crée les thématiques qui manquent, **à la suite** des autres (`order = plus grand rang + 1`), et ne touche plus aux thématiques déjà chargées. Sans l'étape 3, l'alphabet de la production viendrait donc **après** « Hello! Goodbye! », et le CM2 resterait dans l'ancien ordre. L'ordre vu par l'élève est `topics.order`. L'outil `programme/reorder:run` remet les rangs dans l'ordre du programme : il redistribue les rangs que les thématiques du programme occupent déjà, n'en invente aucun, et rejouer ne change rien.

## Les chiffres à retrouver

| | Attendu |
| --- | --- |
| Thématiques d'anglais déjà chargées | 38 |
| Thématiques à créer (étape 2) | 13 |
| Thématiques d'anglais après | 51 |
| Paliers à générer (étape 4) | 36, tous sans le modèle, coût 0 |
| Sons de voix des 6 thématiques d'alphabet (étape 5) | 127 textes, 1 166 caractères, 0,35 dollar (tuiles seules) ; 154 textes, 2 739 caractères, 0,82 dollar avec les consignes. Chiffres mesurés sur un backend local qui a joué toute la procédure. |

Les 36 paliers : CI alphabet 3 fois 2, CP alphabet, sons et prénom 3 fois 3, CE1 épeler, pluriel et possessifs 3 fois 3, CE2 nombres et école 2 fois 3, CM1 loisirs et « il y a » 2 fois 3. Si le premier essai à blanc de l'étape 4 annonce plus de 36, c'est qu'un palier existant a expiré : il sera refait lui aussi, sans le modèle.

## Étape 0. Avant tout déploiement

1. Chercher dans l'index de mémoire des lignes « DEPLOYED to prod » dont la branche n'est pas fusionnée (la production peut avoir du code qui n'est pas dans `main`).
2. Exporter les derniers exercices de la production et comparer leurs `payload.game.kind` au registre de l'arbre à déployer. Un `kind` en base qui n'est pas dans le registre veut dire que la production est en avance. Le déploiement remplace toutes les fonctions : il supprimerait ce code.

## Étape 1. Déployer Convex en production

Depuis un arbre à jour de `main`, qui contient la PR 182 et la PR de cet outil (`programme/reorder`). Ensuite, vérifier dans le tableau de bord que `programme/reorder:run` existe.

## Étape 2. Charger les 13 thématiques nouvelles

Les noms de déploiement : développement `impartial-ermine-150`, production `calculating-guineapig-512`.

```bash
npx convex run --prod programme/seed:run '{"confirmDeployment":"calculating-guineapig-512","subjects":["anglais"],"dryRun":true}'
```

Attendu : `topicsToCreate: 13`, `topicsAlreadyLoaded: 38`. Si `classesKept` cite une classe d'anglais, c'est qu'elle a été garnie à la main : s'arrêter et demander. Puis la même commande sans `"dryRun":true`.

## Étape 3. Remettre l'anglais dans l'ordre du programme

```bash
npx convex run --prod programme/reorder:run '{"confirmDeployment":"calculating-guineapig-512","subjects":["anglais"],"dryRun":true}'
```

Attendu : `loaded: 51`, `missing: []`, `toMove` supérieur à 0, et dans `moves` des lignes comme `CI an-ci-abc-1 : 40 -> 2`. **Garder cette sortie : elle sert de retour en arrière** (chaque ligne dit le rang d'avant). Puis la même commande sans `"dryRun":true`. Rejouer l'essai à blanc doit alors donner `toMove: 0`.

Seul `order` est écrit. Le nom, la description, les paliers et la progression des élèves ne changent pas.

## Étape 4. Générer les paliers

Trouver l'identifiant de la matière :

```bash
npx convex data subjects --prod
```

Puis :

```bash
npx convex run --prod paliers/pregen:run '{"confirmDeployment":"calculating-guineapig-512","subjectIds":["<id de la matière Anglais>"],"dryRun":true}'
```

Attendu : `toGenerate: 36`, `withoutModel: 36`, `estimatedCostUsd: 0`. Puis la commande sans `"dryRun":true` et avec `"limit":40` (le maximum par exécution). Répéter jusqu'à `remaining: 0`. Les tests de l'application ont déjà rejoué ces paliers des milliers de fois : un palier fabriqué par le code ne coûte rien et ne peut pas échouer sur une réponse fausse.

## Étape 5. Écouter, puis préchauffer la voix

La voix des lettres n'a jamais été écoutée. Avant de payer toute la synthèse :

1. Préchauffer une seule thématique, par exemple la première partie de l'alphabet du CI :

```bash
npx convex run --prod voice/warm:warmTileVoice '{"confirmDeployment":"calculating-guineapig-512","programmeKeys":["an-ci-abc-1"],"classes":["CI"],"dryRun":true}'
```

   puis avec `"limit":10`, puis sans `limit`.
2. Ouvrir un palier de cette thématique sur un iPhone et écouter chaque lettre (A à I) et chaque mot. Les noms les plus risqués : `ay`, `eye`, `ar`, `ell`, `double you`, et l'exercice « A, B, ___, D ».
3. Si un nom est mal dit, corriger `LETTER_NAMES` dans `convex/voice/tiles.ts` (par exemple une autre écriture du mot), refaire une PR, redéployer. Le texte du son est la clé du cache : un nouveau texte donne un nouveau son, l'ancien reste inutilisé.
4. Quand tout est bon, préchauffer les six thématiques d'alphabet :

```bash
npx convex run --prod voice/warm:warmTileVoice '{"confirmDeployment":"calculating-guineapig-512","programmeKeys":["an-ci-abc-1","an-ci-abc-2","an-ci-abc-3","an-cp-abc","an-cp-sounds","an-cp-name"],"classes":["CI","CP"],"dryRun":true}'
```

   **Piège : sans `"classes"`, l'outil ne traite que le CI.** Les trois thématiques du CP seraient ignorées sans le dire (l'essai à blanc annonce 6 paliers au lieu de 15). Attendu avec `"classes":["CI","CP"]` : 15 paliers, 150 exercices, 127 textes, 1 166 caractères, 0,35 dollar ; avec `"withPrompts":true`, 154 textes, 2 739 caractères, 0,82 dollar. Ces chiffres sont ceux d'un essai à blanc sur un backend local. L'outil est sans danger à rejouer : un texte déjà en cache ne coûte rien. Il faut `ELEVENLABS_API_KEY` sur le déploiement.

Les thématiques du CE1 et au-delà n'ont pas de voix des tuiles : rien à préchauffer pour elles.

## Ce qui a déjà été rejoué en local (26 octobre 2026)

La procédure des étapes 2 à 5 a été jouée sur un backend Convex local anonyme, de bout en bout, avec la base dans l'état d'avant la v2 (38 thématiques, les 13 nouvelles ajoutées à la suite) :

- `seed:run` : 51 thématiques créées en dix lignes d'essai à blanc, puis chargées.
- `reorder:run` : 51 thématiques déplacées (`CI an-ci-abc-1 : 39 -> 1`, `CI an-ci-hello : 1 -> 4`…), 51 rangs uniques ensuite, rejeu à `toMove: 0`.
- `pregen:run` : 145 paliers, 1 450 exercices, 0 échec, 0 dollar, aucun appel au modèle ; tous publiés, `auto_ok`, dix par palier, aucun à relire.
- `voice/warm:warmTileVoice` en essai à blanc : les chiffres de l'étape 5.
- Dans l'application, des élèves de chaque classe ont joué les paliers dans le navigateur (voir `docs/programme-anglais-v2.md`, section 15).

Ce qui n'a PAS été rejoué : la production elle-même. Onze textes ont été synthétisés avec la vraie voix puis relus par reconnaissance vocale, mais personne ne les a écoutés : `ay`, `ar`, `aitch` seuls et le trou `___` sont douteux (voir `docs/programme-anglais-v2.md`, section 15). Écouter avant l'étape 5.

## Étape 6. Vérifier

1. Dans l'administration, la matière Anglais compte 51 thématiques ; l'ordre du CI commence par l'alphabet, puis « Hello! Goodbye! ».
2. Ouvrir un palier de chaque classe sur un compte de test, sans élève réel : un palier du CI (alphabet), du CP (prénom épelé), du CE1 (épeler), du CE2 (nombres), du CM1 (loisirs).
3. Écouter une lettre sur l'iPhone, en mode avion après un téléchargement du contenu, pour vérifier l'application hors ligne : les sons sont téléchargés avec le contenu.

## Retour en arrière

- **Ordre :** rejouer `programme/reorder:run` ne remet pas l'ancien ordre (il applique l'ordre du programme). Pour revenir en arrière, il faudrait réécrire les rangs de la sortie gardée à l'étape 3 (colonne « d'avant »). Il n'y a pas de commande pour cela : la demander à Claude si besoin.
- **Thématiques :** aucun outil ne les supprime. Une thématique créée à tort se supprime depuis l'administration.
- **Paliers :** `paliers/pregen:invalidate` les marque périmés (il accepte `programmeKeys`), `paliers/pregen:run` les refait.
- **Voix :** un son en cache ne se supprime pas ; il reste inutilisé tant qu'aucun exercice ne le demande.

## Ce que cette mise en production ne fait pas

- Elle ne relit pas le contenu : faire relire par un professeur d'anglais avant d'ouvrir à des élèves.
- Elle ne change pas la voix du CE1 et au-delà (il n'y en a pas).
- Les images `queen` (👸) et `yam` (🍠) sont à revoir.
