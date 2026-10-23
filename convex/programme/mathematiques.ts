/**
 * MATHÉMATIQUES — Domaine 2 du CEB.
 *
 * Source : guides pédagogiques des étapes 1, 2 et 3 ; cahier d'intégration
 * officiel de CE1 (nombres jusqu'à 10 000). L'étape 1 est répartie par les
 * guides : paliers 1 à 3 au CI, 4 à 6 au CP. Aux étapes 2 et 3, les guides
 * donnent les contenus de l'étape sans les attribuer à une classe : la
 * répartition entre CE1 et CE2, puis entre CM1 et CM2, est PROPOSÉE ici
 * selon la règle du CEB (acquisition en première année, consolidation en
 * seconde), et le dit dans chaque description concernée.
 */
import type { ProgrammeSubject } from "./types";

export const MATHEMATIQUES: ProgrammeSubject = {
  key: "mathematiques",
  name: "Mathématiques",
  aliases: ["Maths", "Mathematiques"],
  icon: "Calculator",
  color: "#4f46e5",
  order: 1,
  domain: "Mathématiques",
  classes: {
    CI: [
      {
        key: "ma-ci-trier",
        name: "Trier et ranger",
        description:
          "Activités numériques, palier 1 du CI : notions ensemblistes (appartient, n'appartient pas), classer des objets selon la couleur, la forme ou la taille, ranger du plus petit au plus grand (sériation), continuer une suite logique. Aucun calcul.",
        games: [
          { kind: "frise-formes", count: 2 },
          { kind: "frise-couleurs", count: 2 },
          { kind: "intrus", count: 2 },
          { kind: "appartient", count: 1 },
          { kind: "couleur-objet", count: 1 },
          { kind: "animaux-ordre", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-nombres-10",
        name: "Les nombres jusqu'à 10",
        description:
          "Palier 2 du CI : dénombrer une collection dessinée en émojis dans l'énoncé (🥭🥭🥭, 🔵🔵, 🐟🐟🐟🐟) jusqu'à 10, lire et écrire les chiffres, associer un nombre et une quantité, comparer (plus que, moins que, autant que), ranger. Aucun nombre au-delà de 10.",
        games: [
          { kind: "suite-nombres", count: 2, vocabulary: "nombres-10" },
          { kind: "compter-emojis", count: 3 },
          { kind: "nombre-groupe", count: 1 },
          { kind: "rangee-plus-moins", count: 1 },
          { kind: "nombre-voisin", count: 1, vocabulary: "nombres-10" },
          { kind: "nombre-plus-grand", count: 1, vocabulary: "nombres-10" },
          { kind: "nombre-en-lettres", count: 1, vocabulary: "nombres-10" },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-calcul-10",
        name: "Ajouter et enlever jusqu'à 10",
        description:
          "Palier 2 du CI : additions et soustractions dont le résultat ne dépasse pas 10, en situation (« J'ai 3 mangues, on m'en donne 2 »), le double et la moitié des petits nombres (le double de 3, la moitié de 8).",
        games: [
          { kind: "ajouter-emojis", count: 3 },
          { kind: "enlever-emojis", count: 2 },
          { kind: "calcul-ecrit", count: 2, vocabulary: "nombres-10" },
          { kind: "double-moitie", count: 2, vocabulary: "nombres-10" },
          { kind: "complement", count: 1, vocabulary: "nombres-10" },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-nombres-20",
        name: "Les nombres de 11 à 20",
        description:
          "Palier 3 du CI : lire, écrire et dénombrer jusqu'à 20 ; une dizaine et des unités (14 = 10 + 4) ; composer et décomposer ; comparer et ranger. Aucun nombre au-delà de 20.",
        games: [
          { kind: "suite-nombres", count: 2, vocabulary: "nombres-20" },
          { kind: "dizaine-unites", count: 2, vocabulary: "nombres-20" },
          { kind: "nombre-voisin", count: 2, vocabulary: "nombres-20" },
          { kind: "nombre-plus-grand", count: 1, vocabulary: "nombres-20" },
          { kind: "nombre-en-lettres", count: 1, vocabulary: "nombres-20" },
          { kind: "nombres-ordre", count: 1, vocabulary: "nombres-20" },
          { kind: "calcul-ecrit", count: 1, vocabulary: "nombres-20" },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-espace",
        name: "Gauche, droite, dessus, dessous",
        description:
          "Activités géométriques, paliers 1 et 3 du CI : latéralisation (gauche, droite), topologie (dans, hors de, devant, derrière, sur, sous, entre, près, loin), lignes ouvertes et fermées, se repérer sur un quadrillage, suivre un itinéraire.",
        games: [
          { kind: "pixel-copie", count: 2 },
          { kind: "rangee-position", count: 4 },
          { kind: "rangee-ordinal", count: 4 },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-formes",
        name: "Les formes et les solides",
        description:
          "Activités géométriques, palier 2 du CI : reconnaître le carré, le rectangle, le triangle et le rond ; les solides familiers (le cube comme un dé, le pavé comme une boîte de sucre, le cylindre comme une boîte de tomate).",
        games: [
          { kind: "frise-formes", count: 2 },
          { kind: "forme-nom", count: 2 },
          { kind: "forme-coins", count: 2 },
          { kind: "solide-nom", count: 2 },
          { kind: "classer-formes", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-mesures",
        name: "Plus long, plus lourd, plus tard",
        description:
          "Activités de mesure, paliers 1 à 3 du CI : comparer des longueurs et des contenances sans instrument (plus long, plus court, plus plein), comparer des masses (plus lourd, plus léger), les moments de la journée (matin, midi, soir), les jours de la semaine.",
        games: [
          { kind: "comparer-mesure", count: 4 },
          { kind: "moment-journee", count: 3 },
          { kind: "jour-voisin", count: 3 },
        ],
        byLevel: true,
      },
      {
        key: "ma-ci-problemes",
        name: "Petits problèmes",
        description:
          "Résolution de problèmes, paliers 1 à 3 du CI : trouver un indice dans une image, lire un tableau à double entrée, repérer la donnée et la question d'un petit problème, les données utiles et inutiles. Énoncés de deux phrases au plus, nombres jusqu'à 20.",
        // Dix gabarits, dans l'ordre de la fiche : l'image, le tableau, la donnée et la question, la donnée inutile.
        // `vocabulary` donne le plafond de la fiche (20) ; le tableau de dessins n'écrit aucun nombre.
        games: [
          { kind: "image-compter", count: 1, vocabulary: "nombres-20" },
          { kind: "image-qui", count: 1, vocabulary: "nombres-20" },
          { kind: "tableau-case", count: 1 },
          { kind: "tableau-nombre", count: 1, vocabulary: "nombres-20" },
          { kind: "image-donnee", count: 1, vocabulary: "nombres-20" },
          { kind: "probleme-donnee", count: 1, vocabulary: "nombres-20" },
          { kind: "donnee-ou-question", count: 1, vocabulary: "nombres-20" },
          { kind: "probleme-question", count: 1, vocabulary: "nombres-20" },
          { kind: "donnee-inutile", count: 1, vocabulary: "nombres-20" },
          { kind: "probleme-inutile", count: 1, vocabulary: "nombres-20" },
        ],
        byLevel: true,
      },
    ],
    CP: [
      {
        key: "ma-cp-nombres-50",
        name: "Les nombres jusqu'à 50",
        description:
          "Activités numériques, palier 4 du CP : lire, écrire et dénombrer jusqu'à 50, dizaines et unités, comparer et ranger. Aucun nombre au-delà de 50.",
        // Dix gabarits (`nombresCp.ts`, `patterns.ts`) : `vocabulary` donne le plafond de la fiche (50), jamais dépassé.
        games: [
          { kind: "suite-nombres", count: 2, vocabulary: "nombres-50" },
          { kind: "nb-voisin", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-comparer", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-ordre", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-dizaines", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-decomposer", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-glisser", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-lettres", count: 1, vocabulary: "nombres-50" },
          { kind: "nb-relier", count: 1, vocabulary: "nombres-50" },
        ],
      },
      {
        key: "ma-cp-retenue",
        name: "Additions et soustractions",
        description:
          "Palier 4 du CP : l'addition avec retenue et la soustraction avec emprunt (nombres jusqu'à 100), en ligne et posées ; problèmes du marché en FCFA avec les pièces de 5 F à 100 F.",
        // Dix gabarits (`calculCp.ts`) : toute addition a une retenue, toute soustraction un emprunt, tout résultat reste sous cent.
        games: [
          { kind: "calc-ajouter", count: 1 },
          { kind: "calc-enlever", count: 1 },
          { kind: "calc-retenue", count: 1 },
          { kind: "calc-trou", count: 1 },
          { kind: "calc-ordre", count: 1 },
          { kind: "calc-relier", count: 1 },
          { kind: "calc-glisser", count: 1 },
          { kind: "monnaie-somme", count: 1 },
          { kind: "monnaie-rendre", count: 1 },
          { kind: "monnaie-achat", count: 1 },
        ],
      },
      {
        key: "ma-cp-nombres-100",
        name: "Les nombres jusqu'à 100",
        description:
          "Paliers 5 et 6 du CP : les nombres de 51 à 100 ; unités, dizaines et centaine ; écritures additives (70 + 8) et multiplicatives (7 × 10 + 8).",
        // Dix gabarits (`nombresCp.ts`, `patterns.ts`) : `vocabulary` donne le plafond de la fiche (100), les nombres en lettres vont jusqu'à « cent ».
        games: [
          { kind: "suite-nombres", count: 2, vocabulary: "nombres-100" },
          { kind: "nb-voisin", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-ordre", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-dizaines", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-decomposer", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-glisser", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-lettres", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-relier", count: 1, vocabulary: "nombres-100" },
          { kind: "nb-ecrire", count: 1, vocabulary: "nombres-100" },
        ],
      },
      {
        key: "ma-cp-multiplier",
        name: "Multiplier et partager",
        description:
          "Palier 5 du CP : le sens de la multiplication (3 paquets de 4 mangues), les tables de 2 et de 3, le sens de la division-partage (partager 12 bonbons entre 3 enfants). Aucune autre table que celles de 2 et de 3.",
        // Dix gabarits (`tablesCp.ts`) : toute multiplication a un facteur égal à 2 ou à 3, le résultat ne passe pas 30, le partage se fait entre 2 ou 3 enfants.
        games: [
          { kind: "mult-paquets", count: 1 },
          { kind: "mult-addition", count: 1 },
          { kind: "mult-table", count: 1 },
          { kind: "mult-trou", count: 1 },
          { kind: "mult-relier", count: 1 },
          { kind: "mult-suite", count: 1 },
          { kind: "mult-glisser", count: 1 },
          { kind: "part-qcm", count: 1 },
          { kind: "part-trou", count: 1 },
          { kind: "mult-ecrire", count: 1 },
        ],
      },
      {
        key: "ma-cp-figures",
        name: "Lignes, frises et figures",
        description:
          "Activités géométriques, palier 5 du CP : lignes droites et courbes, se servir de la règle et du double décimètre, reproduire et découper une figure, frises géométriques sur quadrillage.",
        // Dix gabarits : le dessin et la frise (déjà là), les lignes droites et courbes (`arts.ts`), le matériel et les étapes
        // (`figuresCp.ts`), les coins d'une forme (`geometry.ts`).
        games: [
          { kind: "pixel-copie", count: 2 },
          { kind: "frise-formes", count: 2 },
          { kind: "ligne-glisser", count: 1 },
          { kind: "ligne-relier", count: 1 },
          { kind: "ligne-qcm", count: 1 },
          { kind: "outil-geometrie", count: 1 },
          { kind: "figure-etapes", count: 1 },
          { kind: "forme-coins", count: 1 },
        ],
      },
      {
        key: "ma-cp-mesures",
        name: "Le mètre, le litre, le kilogramme",
        description:
          "Activités de mesure, paliers 4 et 5 du CP : mesurer avec le pas, le pied, l'empan, la coudée, puis le mètre ; le litre ; le kilogramme, le demi-kilogramme et le quart de kilogramme ; comparer et ranger des mesures.",
        // Dix gabarits (`mesuresCp.ts`) : une unité par sorte de mesure (mètre, litre, kilogramme), jamais de gramme ni de centimètre.
        games: [
          { kind: "mesure-unite", count: 1 },
          { kind: "mesure-glisser", count: 1 },
          { kind: "mesure-relier", count: 1 },
          { kind: "mesure-corps", count: 1 },
          { kind: "mesure-calcul", count: 1 },
          { kind: "mesure-repete", count: 1 },
          { kind: "mesure-ordre", count: 1 },
          { kind: "mesure-plus", count: 1 },
          { kind: "mesure-kilo", count: 1 },
          { kind: "mesure-kilo-trou", count: 1 },
        ],
      },
      {
        key: "ma-cp-heure-monnaie",
        name: "L'heure, le calendrier, la monnaie",
        description:
          "Palier 6 du CP : lire l'heure (heures justes et demi-heures), les jours, semaines et mois du calendrier, la monnaie de 5 F à 100 F (payer une somme, rendre la monnaie).",
        // Dix gabarits (`heureCp.ts`, `calculCp.ts`) : l'horloge est un émoji de Unicode, la monnaie rendue vient de `ma-cp-retenue`.
        games: [
          { kind: "heure-lire", count: 1 },
          { kind: "heure-relier", count: 1 },
          { kind: "heure-ordre", count: 1 },
          { kind: "heure-trou", count: 1 },
          { kind: "calendrier-combien", count: 1 },
          { kind: "calendrier-glisser", count: 1 },
          { kind: "monnaie-payer", count: 1 },
          { kind: "monnaie-pieces", count: 1 },
          { kind: "monnaie-relier", count: 1 },
          { kind: "monnaie-rendre", count: 1 },
        ],
      },
      {
        key: "ma-cp-problemes",
        name: "Résoudre un problème",
        description:
          "Résolution de problèmes, paliers 4 et 5 du CP : comprendre un énoncé, trouver les données utiles, inutiles ou manquantes, choisir l'opération, construire la question d'un problème. Nombres jusqu'à 100.",
        // Dix gabarits (`problemesCp.ts`) : l'histoire est tirée d'un lexique fermé, l'opération choisie puis écrite, le résultat calculé.
        games: [
          { kind: "pb-operation", count: 1 },
          { kind: "pb-resoudre", count: 1 },
          { kind: "pb-ecrire", count: 1 },
          { kind: "pb-trou", count: 1 },
          { kind: "pb-manquante", count: 1 },
          { kind: "pb-inutile", count: 1 },
          { kind: "pb-question", count: 1 },
          { kind: "pb-etapes", count: 1 },
          { kind: "pb-relier", count: 1 },
          { kind: "pb-glisser", count: 1 },
        ],
      },
    ],
    CE1: [
      {
        key: "ma-ce1-nombres-1000",
        name: "Les nombres jusqu'à 1 000",
        description:
          "Activités numériques de l'étape 2 (répartition proposée pour le CE1) : lire, écrire et décomposer les nombres jusqu'à 1 000 (centaines, dizaines, unités), comparer et ranger.",
        // Dix gabarits (`nombresCe1.ts`) : `vocabulary` donne le plafond de la fiche (1 000), jamais dépassé.
        games: [
          { kind: "ce1-nb-voisin", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-comparer", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-ordre", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-chiffres", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-decomposer", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-encadrer", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-suite", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-lettres", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-relier", count: 1, vocabulary: "nombres-1000" },
          { kind: "ce1-nb-ecrire", count: 1, vocabulary: "nombres-1000" },
        ],
      },
      {
        key: "ma-ce1-nombres-10000",
        name: "Les nombres jusqu'à 10 000",
        description:
          "Activités numériques du CE1 (le cahier officiel de CE1 travaille jusqu'à 10 000) : le millier ; lire, écrire, décomposer, comparer, ranger et encadrer les nombres jusqu'à 10 000 ; écrire un nombre en lettres.",
        // Dix gabarits (`nombresCe1.ts`) : `vocabulary` donne le plafond de la fiche (10 000), jamais dépassé.
        games: [
          { kind: "ce1-nb-voisin", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-comparer", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-ordre", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-chiffres", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-decomposer", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-encadrer", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-glisser", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-suite", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-lettres", count: 1, vocabulary: "nombres-10000" },
          { kind: "ce1-nb-ecrire", count: 1, vocabulary: "nombres-10000" },
        ],
      },
      {
        key: "ma-ce1-add-sous",
        name: "Additions et soustractions",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE1) : additions et soustractions posées avec retenue, calcul mental (ajouter ou retrancher 10, 100), problèmes en FCFA.",
        // Dix gabarits (`calculCe1.ts`) : le calcul est fait par le code, les nombres ne dépassent jamais 1 000.
        games: [
          { kind: "ce1-calc-ajouter", count: 1 },
          { kind: "ce1-calc-enlever", count: 1 },
          { kind: "ce1-calc-retenue", count: 1 },
          { kind: "ce1-calc-trou", count: 1 },
          { kind: "ce1-calc-mental", count: 1 },
          { kind: "ce1-calc-ordre", count: 1 },
          { kind: "ce1-calc-relier", count: 1 },
          { kind: "ce1-calc-glisser", count: 1 },
          { kind: "ce1-calc-ecrire", count: 1 },
          { kind: "ce1-calc-fcfa", count: 1 },
        ],
      },
      {
        key: "ma-ce1-multiplication",
        name: "La multiplication et ses tables",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE1) : tables de multiplication de 2 à 5, multiplication posée par un nombre à un chiffre, calcul mental (double, moitié, multiplier par 10).",
        // Dix gabarits (`tablesCe1.ts`) : les tables de 2 à 5, jamais plus (la 2 et la 5 d'abord, puis la 3, la 4, puis toutes).
        games: [
          { kind: "ce1-mult-table", count: 1 },
          { kind: "ce1-mult-trou", count: 1 },
          { kind: "ce1-mult-addition", count: 1 },
          { kind: "ce1-mult-poser", count: 1 },
          { kind: "ce1-mult-ecrire", count: 1 },
          { kind: "ce1-mult-double", count: 1 },
          { kind: "ce1-mult-dix", count: 1 },
          { kind: "ce1-mult-relier", count: 1 },
          { kind: "ce1-mult-glisser", count: 1 },
          { kind: "ce1-mult-probleme", count: 1 },
        ],
      },
      {
        key: "ma-ce1-geometrie",
        name: "Droites, angles et figures",
        description:
          "Activités géométriques de l'étape 2 : lignes, droites parallèles et perpendiculaires, l'angle droit et l'équerre, le carré, le rectangle, le triangle et le cercle ; construire avec les instruments.",
        // Dix exercices (`geometrieCe1.ts`) : le dessin à reproduire sur quadrillage, puis neuf gabarits de faits de géométrie (le carré, le rectangle, le triangle, le cercle).
        games: [
          { kind: "pixel-copie", count: 1 },
          { kind: "ce1-geo-figure", count: 1 },
          { kind: "ce1-geo-droites", count: 1 },
          { kind: "ce1-geo-outil", count: 1 },
          { kind: "ce1-geo-compter", count: 1 },
          { kind: "ce1-geo-trou", count: 1 },
          { kind: "ce1-geo-relier", count: 1 },
          { kind: "ce1-geo-glisser", count: 1 },
          { kind: "ce1-geo-etapes", count: 1 },
          { kind: "ce1-geo-ecrire", count: 1 },
        ],
      },
      {
        key: "ma-ce1-mesures",
        name: "Longueurs, masses, contenances",
        description:
          "Activités de mesure de l'étape 2 (répartition proposée pour le CE1) : le mètre, le centimètre, le kilomètre ; le kilogramme et le gramme ; le litre ; conversions simples entre unités voisines.",
        // Dix gabarits (`mesuresCe1.ts`) : le mètre et le centimètre, le kilogramme et le gramme, le kilomètre et le mètre, le litre ; les conversions sont faites par le code.
        games: [
          { kind: "ce1-mes-unite", count: 1 },
          { kind: "ce1-mes-convertir", count: 1 },
          { kind: "ce1-mes-trou", count: 1 },
          { kind: "ce1-mes-comparer", count: 1 },
          { kind: "ce1-mes-ranger", count: 1 },
          { kind: "ce1-mes-glisser", count: 1 },
          { kind: "ce1-mes-relier", count: 1 },
          { kind: "ce1-mes-ecrire", count: 1 },
          { kind: "ce1-mes-probleme", count: 1 },
          { kind: "ce1-mes-grandeur", count: 1 },
        ],
      },
      {
        key: "ma-ce1-monnaie-durees",
        name: "La monnaie et les durées",
        description:
          "Activités de mesure de l'étape 2 : la monnaie (pièces et billets jusqu'à 10 000 F), rendre la monnaie ; lire l'heure, durées en heures et minutes, le calendrier.",
        // Dix gabarits (`monnaieDureesCe1.ts`) : cinq de monnaie (les pièces et les billets jusqu'à 10 000 F) et cinq de durées (l'heure, la durée, le calendrier).
        games: [
          { kind: "ce1-mon-somme", count: 1 },
          { kind: "ce1-mon-pieces", count: 1 },
          { kind: "ce1-mon-rendre", count: 1 },
          { kind: "ce1-mon-relier", count: 1 },
          { kind: "ce1-mon-ecrire", count: 1 },
          { kind: "ce1-dur-lire", count: 1 },
          { kind: "ce1-dur-duree", count: 1 },
          { kind: "ce1-dur-trou", count: 1 },
          { kind: "ce1-dur-calendrier", count: 1 },
          { kind: "ce1-dur-ordre", count: 1 },
        ],
      },
      {
        key: "ma-ce1-problemes",
        name: "Résoudre des problèmes",
        description:
          "Résolution de problèmes de l'étape 2 : analyser un énoncé, données utiles, inutiles et manquantes, question intermédiaire, problèmes à une ou deux opérations.",
        // Dix gabarits (`problemesCe1.ts`) : l'histoire est tirée d'un lexique fermé, l'opération choisie puis la réponse calculée par le code.
        games: [
          { kind: "ce1-pb-resoudre", count: 1 },
          { kind: "ce1-pb-deux", count: 1 },
          { kind: "ce1-pb-operation", count: 1 },
          { kind: "ce1-pb-utile", count: 1 },
          { kind: "ce1-pb-manquante", count: 1 },
          { kind: "ce1-pb-question", count: 1 },
          { kind: "ce1-pb-ordre", count: 1 },
          { kind: "ce1-pb-relier", count: 1 },
          { kind: "ce1-pb-glisser", count: 1 },
          { kind: "ce1-pb-ecrire", count: 1 },
        ],
      },
    ],
    CE2: [
      {
        key: "ma-ce2-grands-nombres",
        name: "Les nombres jusqu'à 100 000",
        description:
          "Activités numériques de l'étape 2 (répartition proposée pour le CE2, prolongement des nombres jusqu'à 10 000 du CE1) : lire, écrire, décomposer, comparer, ranger et encadrer les nombres jusqu'à 100 000 ; écrire un nombre en lettres.",
        // Dix gabarits (`nombresCe2.ts`) : les nombres jusqu'à 100 000, jamais au-delà ; la suite de nombres du site (`suite-nombres`) n'y va pas.
        games: [
          { kind: "ce2-nb-voisin", count: 1 },
          { kind: "ce2-nb-comparer", count: 1 },
          { kind: "ce2-nb-ordre", count: 1 },
          { kind: "ce2-nb-chiffres", count: 1 },
          { kind: "ce2-nb-decomposer", count: 1 },
          { kind: "ce2-nb-encadrer", count: 1 },
          { kind: "ce2-nb-glisser", count: 1 },
          { kind: "ce2-nb-suite", count: 1 },
          { kind: "ce2-nb-lettres", count: 1 },
          { kind: "ce2-nb-ecrire", count: 1 },
        ],
      },
      {
        key: "ma-ce2-multiplication",
        name: "Multiplication et calcul mental",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE2) : tables de multiplication jusqu'à 9, multiplication posée par un nombre à deux chiffres, multiplier par 10 et par 100, calcul mental.",
        // Dix gabarits (`tablesCe2.ts`) : les tables de 2 à 9 (2 à 5, puis 6 et 7, puis 8 et 9, puis toutes), la multiplication posée par un puis par deux chiffres.
        games: [
          { kind: "ce2-mult-table", count: 1 },
          { kind: "ce2-mult-trou", count: 1 },
          { kind: "ce2-mult-poser", count: 1 },
          { kind: "ce2-mult-ecrire", count: 1 },
          { kind: "ce2-mult-dix", count: 1 },
          { kind: "ce2-mult-double", count: 1 },
          { kind: "ce2-mult-decomposer", count: 1 },
          { kind: "ce2-mult-relier", count: 1 },
          { kind: "ce2-mult-glisser", count: 1 },
          { kind: "ce2-mult-probleme", count: 1 },
        ],
      },
      {
        key: "ma-ce2-division",
        name: "La division",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE2) : le sens de la division (partage et groupement), la division posée par un nombre à un chiffre, le reste.",
        // Dix gabarits (`divisionCe2.ts`) : sans reste d'abord, puis avec un reste, la division posée, trois chiffres ; le reste est toujours plus petit que le diviseur.
        games: [
          { kind: "ce2-div-table", count: 1 },
          { kind: "ce2-div-partage", count: 1 },
          { kind: "ce2-div-groupement", count: 1 },
          { kind: "ce2-div-reste", count: 1 },
          { kind: "ce2-div-poser", count: 1 },
          { kind: "ce2-div-trou", count: 1 },
          { kind: "ce2-div-ecrire", count: 1 },
          { kind: "ce2-div-relier", count: 1 },
          { kind: "ce2-div-glisser", count: 1 },
          { kind: "ce2-div-probleme", count: 1 },
        ],
      },
      {
        key: "ma-ce2-symetrie",
        name: "La symétrie et les solides",
        description:
          "Activités géométriques de l'étape 2 : l'axe de symétrie d'une figure, compléter une figure par symétrie sur quadrillage ; le cube, le pavé droit et le cylindre (faces, arêtes, sommets).",
        // Huit gabarits (`symetrieCe2.ts`) et deux dessins à compléter par symétrie (`pixel-symetrie`) : le cube, le pavé droit et le cylindre, les axes de symétrie des figures simples.
        games: [
          { kind: "pixel-symetrie", count: 2 },
          { kind: "ce2-sym-axe", count: 1 },
          { kind: "ce2-sym-miroir", count: 1 },
          { kind: "ce2-sym-solide", count: 1 },
          { kind: "ce2-sym-trou", count: 1 },
          { kind: "ce2-sym-relier", count: 1 },
          { kind: "ce2-sym-glisser", count: 1 },
          { kind: "ce2-sym-etapes", count: 1 },
          { kind: "ce2-sym-ecrire", count: 1 },
        ],
      },
      {
        key: "ma-ce2-perimetre-aire",
        name: "Périmètres et aires",
        description:
          "Activités de mesure de l'étape 2 : le périmètre du carré et du rectangle, l'aire mesurée en carreaux, comparer des aires.",
        // Dix gabarits (`perimetreAireCe2.ts`) : le périmètre du carré et du rectangle, un côté qui manque, l'aire comptée en carreaux (jamais en cm²), comparer des aires.
        games: [
          { kind: "ce2-per-carre", count: 1 },
          { kind: "ce2-per-rectangle", count: 1 },
          { kind: "ce2-per-cote", count: 1 },
          { kind: "ce2-per-aire", count: 1 },
          { kind: "ce2-per-comparer", count: 1 },
          { kind: "ce2-per-trou", count: 1 },
          { kind: "ce2-per-ecrire", count: 1 },
          { kind: "ce2-per-relier", count: 1 },
          { kind: "ce2-per-glisser", count: 1 },
          { kind: "ce2-per-probleme", count: 1 },
        ],
      },
      {
        key: "ma-ce2-mesures",
        name: "Mesures et conversions",
        description:
          "Activités de mesure de l'étape 2 (répartition proposée pour le CE2) : longueurs (km, m, dm, cm, mm), masses (kg, g), contenances (L, dL, cL), durées (h, min, s) ; conversions.",
        // Dix gabarits (`mesuresCe2.ts`) : neuf couples d'unités voisines (m-cm, kg-g, km-m, puis m-dm, dm-cm, cm-mm, puis L-dL, L-cL, dL-cL), les durées en heures, minutes et secondes.
        games: [
          { kind: "ce2-mes-convertir", count: 1 },
          { kind: "ce2-mes-ecrire", count: 1 },
          { kind: "ce2-mes-trou", count: 1 },
          { kind: "ce2-mes-comparer", count: 1 },
          { kind: "ce2-mes-ranger", count: 1 },
          { kind: "ce2-mes-unite", count: 1 },
          { kind: "ce2-mes-relier", count: 1 },
          { kind: "ce2-mes-glisser", count: 1 },
          { kind: "ce2-mes-duree", count: 1 },
          { kind: "ce2-mes-probleme", count: 1 },
        ],
      },
      {
        key: "ma-ce2-problemes",
        name: "Problèmes en plusieurs étapes",
        description:
          "Résolution de problèmes de l'étape 2 : problèmes à deux ou trois opérations, questions intermédiaires, vérifier sa réponse.",
        // Dix gabarits (`problemesCe2.ts`) : huit scénarios fermés à deux ou trois opérations, la question intermédiaire, le calcul qui résout, la donnée inutile, vérifier.
        games: [
          { kind: "ce2-pb-deux", count: 1 },
          { kind: "ce2-pb-trois", count: 1 },
          { kind: "ce2-pb-ecrire", count: 1 },
          { kind: "ce2-pb-question", count: 1 },
          { kind: "ce2-pb-operation", count: 1 },
          { kind: "ce2-pb-utile", count: 1 },
          { kind: "ce2-pb-ordre", count: 1 },
          { kind: "ce2-pb-relier", count: 1 },
          { kind: "ce2-pb-glisser", count: 1 },
          { kind: "ce2-pb-verifier", count: 1 },
        ],
      },
    ],
    CM1: [
      {
        key: "ma-cm1-grands-nombres",
        name: "Les grands nombres",
        description:
          "Activités numériques de l'étape 3, paliers 1 à 3 (répartition proposée pour le CM1) : les nombres jusqu'aux millions ; lire, écrire, décomposer, comparer, ranger et arrondir.",
        // Dix gabarits (`nombresCm1.ts`) : jamais au-delà de 9 999 999 (le milliard est au CM2).
        games: [
          { kind: "cm1-gn-voisin", count: 1 },
          { kind: "cm1-gn-comparer", count: 1 },
          { kind: "cm1-gn-ordre", count: 1 },
          { kind: "cm1-gn-chiffres", count: 1 },
          { kind: "cm1-gn-decomposer", count: 1 },
          { kind: "cm1-gn-arrondir", count: 1 },
          { kind: "cm1-gn-glisser", count: 1 },
          { kind: "cm1-gn-suite", count: 1 },
          { kind: "cm1-gn-lettres", count: 1 },
          { kind: "cm1-gn-ecrire", count: 1 },
        ],
      },
      {
        key: "ma-cm1-divisibilite",
        name: "Divisibilité et calcul mental",
        description:
          "Étape 3, paliers 1 à 3 : les critères de divisibilité par 2, 5, 3 et 9, les multiples, les tables de multiplication et le calcul mental.",
        // Dix gabarits (`divisibiliteCm1.ts`) : critères de 2, 5, 10, 3 et 9, multiples, tables, multiplier par dix, cent, mille, double et moitié.
        games: [
          { kind: "cm1-dbl-critere", count: 1 },
          { kind: "cm1-dbl-glisser", count: 1 },
          { kind: "cm1-dbl-chiffre", count: 1 },
          { kind: "cm1-dbl-multiple", count: 1 },
          { kind: "cm1-dbl-suite", count: 1 },
          { kind: "cm1-dbl-fois", count: 1 },
          { kind: "cm1-dbl-dix", count: 1 },
          { kind: "cm1-dbl-ecrire", count: 1 },
          { kind: "cm1-dbl-relier", count: 1 },
          { kind: "cm1-dbl-ordre", count: 1 },
        ],
      },
      {
        key: "ma-cm1-division",
        name: "La division posée",
        description:
          "Étape 3, paliers 1 à 3 : la division posée par un nombre à un ou deux chiffres, le quotient et le reste, problèmes de partage.",
        // Dix gabarits (`divisionCm1.ts`) : un diviseur à un ou deux chiffres, un dividende de 99 999 au plus.
        games: [
          { kind: "cm1-div-poser", count: 1 },
          { kind: "cm1-div-reste", count: 1 },
          { kind: "cm1-div-verifier", count: 1 },
          { kind: "cm1-div-ecrire", count: 1 },
          { kind: "cm1-div-chiffres", count: 1 },
          { kind: "cm1-div-relier", count: 1 },
          { kind: "cm1-div-glisser", count: 1 },
          { kind: "cm1-div-ordre", count: 1 },
          { kind: "cm1-div-partage", count: 1 },
          { kind: "cm1-div-groupement", count: 1 },
        ],
      },
      {
        key: "ma-cm1-fractions",
        name: "Les fractions",
        description:
          "Étape 3, paliers 1 à 3 : les fractions ordinaires (lire, écrire, représenter, comparer à 1) et les fractions décimales (dixièmes, centièmes).",
        // Dix gabarits (`fractionsCm1.ts`) : lecture, écriture, part d'un tout, comparaison à 1, fractions égales, dixièmes et centièmes. Aucun dessin : les fractions s'écrivent « 3/8 ».
        games: [
          { kind: "cm1-frc-lire", count: 1 },
          { kind: "cm1-frc-ecrire", count: 1 },
          { kind: "cm1-frc-relier", count: 1 },
          { kind: "cm1-frc-part", count: 1 },
          { kind: "cm1-frc-comparer", count: 1 },
          { kind: "cm1-frc-ordre", count: 1 },
          { kind: "cm1-frc-un", count: 1 },
          { kind: "cm1-frc-glisser", count: 1 },
          { kind: "cm1-frc-egale", count: 1 },
          { kind: "cm1-frc-unites", count: 1 },
        ],
      },
      {
        key: "ma-cm1-decimaux",
        name: "Les nombres décimaux",
        description:
          "Étape 3, paliers 1 à 3 : découverte des nombres décimaux (partie entière, partie décimale), lire, écrire, comparer et ranger, additionner et soustraire des décimaux.",
        // Dix gabarits (`decimauxCm1.ts`) : jusqu'aux centièmes, jamais au-delà (les millièmes sont au CM2).
        games: [
          { kind: "cm1-dcm-parties", count: 1 },
          { kind: "cm1-dcm-chiffres", count: 1 },
          { kind: "cm1-dcm-ecrire", count: 1 },
          { kind: "cm1-dcm-relier", count: 1 },
          { kind: "cm1-dcm-comparer", count: 1 },
          { kind: "cm1-dcm-ordre", count: 1 },
          { kind: "cm1-dcm-glisser", count: 1 },
          { kind: "cm1-dcm-suite", count: 1 },
          { kind: "cm1-dcm-calcul", count: 1 },
          { kind: "cm1-dcm-complement", count: 1 },
        ],
      },
      {
        key: "ma-cm1-figures",
        name: "Figures planes et constructions",
        description:
          "Activités géométriques de l'étape 3 : positions relatives des droites, le carré, le rectangle, les triangles, le parallélogramme, le cercle (rayon, diamètre) ; constructions aux instruments.",
        games: [{ kind: "pixel-copie", count: 1 }],
      },
      {
        key: "ma-cm1-perimetres-aires",
        name: "Périmètres et aires",
        description:
          "Activités de mesure de l'étape 3 : périmètre et aire du carré et du rectangle, unités d'aire (m², cm²).",
      },
      {
        key: "ma-cm1-mesures",
        name: "Longueurs, masses, capacités, durées",
        description:
          "Activités de mesure de l'étape 3 (répartition proposée pour le CM1) : unités et conversions de longueur, de masse et de capacité, calculs sur les durées.",
      },
    ],
    CM2: [
      {
        key: "ma-cm2-milliards",
        name: "Millions et milliards",
        description:
          "Activités numériques de l'étape 3, palier 4 : la numération jusqu'aux millions et aux milliards, les opérations sur les grands nombres.",
      },
      {
        key: "ma-cm2-decimaux",
        name: "Opérations sur les décimaux",
        description:
          "Étape 3 (répartition proposée pour le CM2) : multiplier et diviser par 10, 100 et 1 000, la multiplication d'un nombre décimal, la division décimale.",
      },
      {
        key: "ma-cm2-commerce",
        name: "Acheter, vendre, gagner",
        description:
          "Activités de mesure de l'étape 3, palier 4 : le budget familial, le prix d'achat, les frais, le prix de revient, le prix de vente, le bénéfice et la perte, en FCFA.",
      },
      {
        key: "ma-cm2-partages-moyenne",
        name: "Partages et moyenne",
        description:
          "Étape 3, palier 4 : partages égaux et inégaux, calculer une moyenne (notes, températures, récoltes d'arachide).",
      },
      {
        key: "ma-cm2-symetrie",
        name: "Symétrie et translation",
        description:
          "Activités géométriques de l'étape 3, palier 4 : la symétrie par rapport à un axe, la translation sur quadrillage, le cube, le pavé droit et le cylindre.",
        games: [{ kind: "pixel-symetrie", count: 3 }],
      },
      {
        key: "ma-cm2-volumes",
        name: "Solides et volumes",
        description:
          "Activités de mesure de l'étape 3 : le volume du cube et du pavé droit, les unités de volume, les angles.",
      },
      {
        key: "ma-cm2-vitesse",
        name: "Vitesse, distance et durée",
        description:
          "Activités de mesure de l'étape 3 : les durées et les mouvements uniformes (distance = vitesse × durée), lire des horaires de car et de train.",
      },
      {
        key: "ma-cm2-problemes",
        name: "Problèmes du CFEE",
        description:
          "Résolution de problèmes de l'étape 3 : analyser et construire un énoncé, démarches progressive et régressive, vérifier et rédiger sa solution ; problèmes en plusieurs étapes comme au CFEE.",
      },
    ],
  },
};
