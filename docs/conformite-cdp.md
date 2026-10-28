# Conformité à la CDP (Sénégal) : examen et dossier de déclaration

Examen du 22 octobre 2026. Il lit la loi n° 2008-12 du 25 janvier 2008 sur la protection des
données à caractère personnel, texte publié par l'AFAPDP
([PDF](https://www.afapdp.org/wp-content/uploads/2018/05/Senegal-texte-de-loi-2008.pdf)),
et le compare à ce que fait le code de Jotna.

Ce n'est pas un avis juridique. Fais valider le dossier par un avocat ou un conseil en
protection des données avant de l'envoyer à la CDP.

## Verdict

Jotna est soumis à la loi et doit déclarer ses traitements à la CDP avant de les mettre en
œuvre. Trois points demandent une décision avant la déclaration :

1. **Le module « Arabe & Coran » touche à une donnée que la loi interdit par défaut** : les
   convictions religieuses (articles 40 et 41).
2. **Les données partent à l'étranger** (Convex, ElevenLabs, OpenAI, Resend, Vercel) :
   l'article 49 les permet seulement vers un pays au niveau de protection suffisant, et exige
   d'en informer la CDP avant.
3. **Qui est responsable des données des élèves ?** Jotna ou l'école. La réponse change les
   contrats à signer.

Le code applique déjà plusieurs principes de la loi : peu de données, aucune voix conservée,
accès par rôle, pas de traceur. Ce dossier note ce qui manque encore.

## 1. La loi s'applique à Jotna

- Article 2 : la loi couvre tout traitement fait par une personne morale, y compris un
  traitement fait sur le territoire sénégalais par un responsable établi ailleurs, qui doit
  alors nommer un représentant au Sénégal.
- Une donnée sur un enfant (nom, niveau, résultats) est une donnée à caractère personnel
  (article 4.6).
- Exemptions (article 3, article 17) : usage domestique, copies techniques temporaires,
  registres publics, associations à but non lucratif. Aucune ne s'applique.

## 2. Obligations de la loi et état de Jotna

| Obligation | Article | État de Jotna |
| --- | --- | --- |
| Déclarer chaque traitement à la CDP et attendre le récépissé | 18 | À faire. Seul le récépissé autorise la mise en œuvre. |
| Autorisation de la CDP pour les cas listés (biométrie, interconnexion de fichiers, identifiant national, santé, données d'intérêt public) | 20 | Aucun cas apparent. Voir la voix au §4. |
| Consentement, ou une des exceptions (contrat, obligation légale) | 33 | Contrat avec l'école ou le parent pour le compte. Pour la religion : consentement écrit (voir §3.1). |
| Finalité précise, données adéquates et non excessives, durée limitée | 35 | Données minimales. Durée de conservation à fixer (voir §6). |
| Données exactes, corrigées sur demande | 36, 69 | Réponse à une demande de rectification ou de suppression sous un mois. |
| Informer la personne au moment de la collecte | 37, 58 | Politique de confidentialité en ligne. Voir les écarts au §5. |
| Contrat écrit avec chaque sous-traitant, qui n'agit que sur instruction | 39, 70 | À vérifier pour Convex, ElevenLabs, OpenAI, Resend, Vercel, PayDunya, Bictorys. |
| Interdiction de traiter les convictions religieuses sans exception | 40, 41 | Question ouverte (voir §3.1). |
| Prospection par message seulement avec consentement préalable | 47 | La liste d'attente annonce que l'adresse ne sert qu'à prévenir de l'ouverture. Rester dans ce cadre. |
| Pas de décision qui produit un effet juridique sur le seul fondement d'un profilage automatisé | 48 | Le parcours adaptatif ne produit pas d'effet juridique. |
| Transfert vers un pays tiers : niveau de protection suffisant, CDP informée avant | 49 à 51 | À faire (voir §3.2). |
| Droits d'accès, d'opposition, de rectification et de suppression | 62 à 69 | Politique de confidentialité : demande par courriel. |
| Information sur ce qui est enregistré dans l'appareil de l'utilisateur, sauf si strictement nécessaire | 61 | Seul le jeton de connexion est enregistré : strictement nécessaire, donc exempté. |
| Confidentialité, engagement écrit de ceux qui traitent les données | 70 | À faire : engagement écrit des personnes de l'équipe qui accèdent aux données. |
| Mesures de sécurité listées (accès par rôle, traçabilité des accès, sauvegardes, chiffrement du transport) | 71 | Accès par rôle : oui. Traçabilité des accès : non vérifiée. Sauvegardes : celles de Convex, non vérifiées. |
| Durée de conservation limitée | 35, 72 | Voir §6. |

Sanctions (articles 29 à 31) : avertissement, mise en demeure, retrait de l'autorisation,
amende de 1 à 100 millions de FCFA, interruption du traitement jusqu'à 3 mois, interdiction.
Les décisions de la CDP peuvent être contestées devant le Conseil d'État (article 32).

## 3. Les trois décisions

### 3.1 Le module « Arabe & Coran » et les convictions religieuses

L'article 40 interdit la collecte et le traitement de données qui révèlent les convictions
religieuses. L'article 41.2 lève l'interdiction si la personne a donné son consentement écrit,
sur tout support. La loi définit aussi comme sensibles les données relatives aux « opinions ou
activités religieuse » (article 4.8).

Un élève qui suit des leçons d'arabe et de lecture du Coran, dont la progression est
enregistrée, révèle peut-être une pratique religieuse. Je ne peux pas dire si la CDP le
juge ainsi. La prudence veut qu'on traite le cas comme sensible.

Ce que fait déjà le code : le module est éteint par défaut et c'est l'école qui l'allume
(`convex/moduleCatalog.ts`). Une école qui ne le demande pas n'a aucune donnée de cet ordre.

Décisions à prendre :
- Faire recueillir par l'école le consentement écrit du parent avant d'allumer le module pour
  ses élèves, et en garder la preuve. Le champ `aiDataConsentGranted` du schéma existe mais
  aucun écran ne l'utilise : il ne couvre pas ce cas.
- Ou demander à la CDP si ce traitement relève de l'article 40.
- Ajouter ce point à la politique de confidentialité une fois la procédure fixée.

### 3.2 Les transferts hors du Sénégal

L'article 49 : un transfert vers un pays tiers n'est permis que si ce pays assure un niveau de
protection suffisant, et le responsable doit informer la CDP avant. L'article 50 prévoit des
exceptions limitées (transfert ponctuel et non massif avec consentement exprès, ou nécessaire
à l'exécution d'un contrat). L'article 51 permet à la CDP d'autoriser un transfert ou un
ensemble de transferts avec des garanties suffisantes.

Les transferts de Jotna ne sont ni ponctuels ni limités : ils sont continus. L'exception de
l'article 50 ne les couvre pas bien. La voie propre est d'informer la CDP dans la déclaration
(article 22.11) et de demander l'autorisation de l'article 51 pour les pays que la CDP ne juge
pas suffisants.

Prestataires, d'après le code :
- Convex : base de données et fonctions.
- ElevenLabs : voix de synthèse et transcription de la voix des enfants.
- Vercel AI Gateway et OpenAI : intelligence artificielle (sans nom ni adresse électronique).
- Resend : envoi des courriels.
- Hébergeur du site : à nommer.
- PayDunya et Bictorys : paiement des écoles.

Je n'ai pas trouvé de liste officielle des pays que la CDP juge suffisants. À demander à la CDP.
Pour chaque prestataire : le pays où il traite les données, et le contrat écrit des articles 39 et 70.

### 3.3 Qui est responsable ?

Dans le modèle de Jotna, l'école crée les comptes et importe la liste de ses élèves. Deux
lectures sont possibles :
- L'école est responsable du traitement de ses élèves, et Jotna est son sous-traitant (articles
  39 et 70). Il faut alors un contrat écrit qui dit que Jotna n'agit que sur instruction de l'école.
- Jotna est responsable, ou coresponsable avec l'école.

La politique de confidentialité publiée dit aujourd'hui que Jotna est le responsable. À aligner
sur la décision et sur les contrats d'école. Un conseil doit trancher.

## 4. Contenu du dossier de déclaration (article 22)

L'article 22 liste ce que doit contenir une déclaration. La CDP fournit un modèle (article 18) :
je n'ai pas pu le consulter. Voici les réponses prêtes, par traitement, tirées du code. Une
déclaration par finalité est la pratique prudente.

Éléments communs :
- Responsable : à renseigner (voir `lib/legal/entity.ts`).
- Service d'accès aux données : l'équipe Jotna, courriel `contact@jotnaschool.com`.
- Droit d'accès : par courriel à la même adresse.
- Sous-traitants : oui (voir §3.2).
- Transferts vers un pays tiers : oui (voir §3.2).
- Interconnexion : aucune.
- Sécurité : chiffrement des communications, accès par rôle (parent, professeur, directeur,
  élève), mots de passe stockés sous forme protégée, clés des prestataires hors du dépôt.

### Traitement A : comptes et suivi pédagogique
- Finalité : fournir le compte, les exercices et le suivi de progression.
- Personnes : élèves, parents, professeurs, directeurs.
- Données : nom affiché, avatar, niveau, code élève, préférences ; pour les adultes, adresse
  électronique ; exercices tentés, réponses, scores, étoiles, badges.
- Origine : l'école, le parent, l'élève.
- Destinataires : le parent de l'élève, ses professeurs, son école.
- Durée de conservation : à fixer (voir §6).

### Traitement B : voix et module « Arabe & Coran »
- Finalité : faire entendre la voix de Pio, vérifier une prononciation, suivre la progression
  dans les leçons.
- Données : audio de huit secondes au plus, envoyé à la transcription, non conservé ; date,
  exercice et résultat de chaque tentative, conservés.
- Remarque : si la CDP considère la voix comme une donnée biométrique, ce traitement relève de
  l'autorisation (article 20.5). Le code ne s'en sert pas pour identifier une personne :
  il transcrit un texte. À préciser dans la déclaration.
- Sensibilité : voir §3.1.

### Traitement C : facturation des écoles
- Finalité : facturer et encaisser les abonnements.
- Données : nom de l'école, ville, contact, courriel, téléphone, NINEA, factures, état de paiement.
- Destinataires : PayDunya, Bictorys, Resend.
- Durée de conservation : la durée comptable légale, à confirmer avec un comptable.

### Traitement D : liste d'attente du site
- Finalité : prévenir de l'ouverture du service.
- Données : adresse électronique et profil (parent, professeur, école).
- Remarque : la liste est mise de côté dans le code. La déclarer seulement si elle est utilisée.

## 5. Écarts entre la loi et la politique de confidentialité du site

L'article 58 liste ce qu'il faut dire à la collecte. Comparé aux six pages de `/legal` :
- Dit : identité du responsable (à renseigner), finalités, catégories de données, destinataires,
  droits d'accès et de rectification, transferts à l'étranger.
- Manquait, corrigé dans cette révision : dire si la réponse est obligatoire ou facultative,
  le droit de demander à ne plus figurer dans le fichier, le délai d'un mois pour les demandes.
- Reste à ajouter : la durée de conservation chiffrée (§6), le consentement écrit pour le module
  d'arabe (§3.1), et le pays de chaque prestataire (§3.2).

## 6. À décider : la durée de conservation

L'article 35 limite la durée à la période nécessaire à la finalité. La politique publiée dit
« tant que le compte existe ». La déclaration doit donner une durée. Proposition à valider :
- compte actif : tant que l'école a un contrat actif ou que le parent garde le compte ;
- fin de contrat ou demande de suppression : suppression ou anonymisation sous un mois ;
- factures : durée comptable légale.

## 7. Procédure

1. Choisir le responsable et signer les contrats (§3.3 et §3.2).
2. Remplir le modèle de déclaration de la CDP pour chaque traitement (§4).
3. Envoyer la déclaration par voie électronique ou postale (article 24). La CDP accuse
   réception puis délivre un récépissé dans un délai d'un mois, prorogeable une fois
   sur décision motivée (article 18).
4. **Ne pas mettre en œuvre un traitement avant le récépissé.** L'article 18 dit que seul le
   récépissé donne droit à la mise en œuvre.
5. Demander l'autorisation de transfert (article 51) si la CDP le demande.
6. Tout changement d'un élément déclaré (nouveau prestataire, nouvelle donnée) demande une
   nouvelle déclaration (article 22, dernier alinéa).

Délai de réponse de la CDP pour un avis ou une autorisation : deux mois, prorogeables une fois.
Sans réponse dans ce délai, l'autorisation est réputée favorable (article 23).

Je n'ai pas trouvé d'adresse de portail de dépôt, de frais ni de formulaire en ligne. Demande à la
CDP : cdp.sn.

## 8. Ce que je n'ai pas pu vérifier

- Le décret d'application n° 2008-721 du 30 juin 2008 : non lu.
- Le modèle officiel de déclaration et les frais éventuels.
- La liste des pays jugés suffisants par la CDP.
- Si la CDP juge la voix d'un enfant biométrique, et la pratique de la CDP sur les données
  religieuses d'un élève.
- La réforme de la loi : les sources trouvées disent qu'elle est attendue depuis 2017, avec un
  projet ayant reçu un avis favorable de la Cour suprême en 2022. Aucune nouvelle loi sur les
  données personnelles n'est adoptée à ma connaissance. Le projet de loi 25/2026, adopté en août
  2026, porte sur la cybersécurité des infrastructures critiques : il prévoit une corégulation
  avec la CDP et le stockage des données de l'État au Sénégal. Il ne remplace pas la loi
  2008-12. Vérifier si Jotna entre dans son champ (par exemple si une école publique devient
  cliente).
- Les obligations de Côte d'Ivoire (autorité ARTCI), si le service s'y ouvre.

## 9. Ce qu'il faut faire, par ordre

1. Décider du rôle de Jotna et de l'école, puis écrire le contrat d'école (articles 39 et 70).
2. Décider de la procédure de consentement écrit pour le module d'arabe.
3. Demander à la CDP : formulaire, frais, pays jugés suffisants, position sur la voix et la religion.
4. Obtenir ou vérifier les contrats de traitement de chaque prestataire (§3.2).
5. Fixer la durée de conservation (§6).
6. Déposer les déclarations A, B et C, et attendre les récépissés.
7. Mettre à jour la politique de confidentialité avec le numéro de récépissé et les durées.
8. Faire signer un engagement de confidentialité à toute personne de l'équipe qui accède aux données.
