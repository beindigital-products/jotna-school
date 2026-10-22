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
        games: [{ kind: "suite-nombres", count: 2 }],
      },
      {
        key: "ma-ce1-nombres-10000",
        name: "Les nombres jusqu'à 10 000",
        description:
          "Activités numériques du CE1 (le cahier officiel de CE1 travaille jusqu'à 10 000) : le millier ; lire, écrire, décomposer, comparer, ranger et encadrer les nombres jusqu'à 10 000 ; écrire un nombre en lettres.",
        games: [{ kind: "suite-nombres", count: 1 }],
      },
      {
        key: "ma-ce1-add-sous",
        name: "Additions et soustractions",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE1) : additions et soustractions posées avec retenue, calcul mental (ajouter ou retrancher 10, 100), problèmes en FCFA.",
      },
      {
        key: "ma-ce1-multiplication",
        name: "La multiplication et ses tables",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE1) : tables de multiplication de 2 à 5, multiplication posée par un nombre à un chiffre, calcul mental (double, moitié, multiplier par 10).",
      },
      {
        key: "ma-ce1-geometrie",
        name: "Droites, angles et figures",
        description:
          "Activités géométriques de l'étape 2 : lignes, droites parallèles et perpendiculaires, l'angle droit et l'équerre, le carré, le rectangle, le triangle et le cercle ; construire avec les instruments.",
        games: [{ kind: "pixel-copie", count: 1 }],
      },
      {
        key: "ma-ce1-mesures",
        name: "Longueurs, masses, contenances",
        description:
          "Activités de mesure de l'étape 2 (répartition proposée pour le CE1) : le mètre, le centimètre, le kilomètre ; le kilogramme et le gramme ; le litre ; conversions simples entre unités voisines.",
      },
      {
        key: "ma-ce1-monnaie-durees",
        name: "La monnaie et les durées",
        description:
          "Activités de mesure de l'étape 2 : la monnaie (pièces et billets jusqu'à 10 000 F), rendre la monnaie ; lire l'heure, durées en heures et minutes, le calendrier.",
      },
      {
        key: "ma-ce1-problemes",
        name: "Résoudre des problèmes",
        description:
          "Résolution de problèmes de l'étape 2 : analyser un énoncé, données utiles, inutiles et manquantes, question intermédiaire, problèmes à une ou deux opérations.",
      },
    ],
    CE2: [
      {
        key: "ma-ce2-grands-nombres",
        name: "Les nombres jusqu'à 100 000",
        description:
          "Activités numériques de l'étape 2 (répartition proposée pour le CE2, prolongement des nombres jusqu'à 10 000 du CE1) : lire, écrire, décomposer, comparer, ranger et encadrer les nombres jusqu'à 100 000 ; écrire un nombre en lettres.",
        games: [{ kind: "suite-nombres", count: 1 }],
      },
      {
        key: "ma-ce2-multiplication",
        name: "Multiplication et calcul mental",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE2) : tables de multiplication jusqu'à 9, multiplication posée par un nombre à deux chiffres, multiplier par 10 et par 100, calcul mental.",
      },
      {
        key: "ma-ce2-division",
        name: "La division",
        description:
          "Opérations de l'étape 2 (répartition proposée pour le CE2) : le sens de la division (partage et groupement), la division posée par un nombre à un chiffre, le reste.",
      },
      {
        key: "ma-ce2-symetrie",
        name: "La symétrie et les solides",
        description:
          "Activités géométriques de l'étape 2 : l'axe de symétrie d'une figure, compléter une figure par symétrie sur quadrillage ; le cube, le pavé droit et le cylindre (faces, arêtes, sommets).",
        games: [{ kind: "pixel-symetrie", count: 3 }],
      },
      {
        key: "ma-ce2-perimetre-aire",
        name: "Périmètres et aires",
        description:
          "Activités de mesure de l'étape 2 : le périmètre du carré et du rectangle, l'aire mesurée en carreaux, comparer des aires.",
      },
      {
        key: "ma-ce2-mesures",
        name: "Mesures et conversions",
        description:
          "Activités de mesure de l'étape 2 (répartition proposée pour le CE2) : longueurs (km, m, dm, cm, mm), masses (kg, g), contenances (L, dL, cL), durées (h, min, s) ; conversions.",
      },
      {
        key: "ma-ce2-problemes",
        name: "Problèmes en plusieurs étapes",
        description:
          "Résolution de problèmes de l'étape 2 : problèmes à deux ou trois opérations, questions intermédiaires, vérifier sa réponse.",
      },
    ],
    CM1: [
      {
        key: "ma-cm1-grands-nombres",
        name: "Les grands nombres",
        description:
          "Activités numériques de l'étape 3, paliers 1 à 3 (répartition proposée pour le CM1) : les nombres jusqu'aux millions ; lire, écrire, décomposer, comparer, ranger et arrondir.",
      },
      {
        key: "ma-cm1-divisibilite",
        name: "Divisibilité et calcul mental",
        description:
          "Étape 3, paliers 1 à 3 : les critères de divisibilité par 2, 5, 3 et 9, les multiples, les tables de multiplication et le calcul mental.",
      },
      {
        key: "ma-cm1-division",
        name: "La division posée",
        description:
          "Étape 3, paliers 1 à 3 : la division posée par un nombre à un ou deux chiffres, le quotient et le reste, problèmes de partage.",
      },
      {
        key: "ma-cm1-fractions",
        name: "Les fractions",
        description:
          "Étape 3, paliers 1 à 3 : les fractions ordinaires (lire, écrire, représenter, comparer à 1) et les fractions décimales (dixièmes, centièmes).",
      },
      {
        key: "ma-cm1-decimaux",
        name: "Les nombres décimaux",
        description:
          "Étape 3, paliers 1 à 3 : découverte des nombres décimaux (partie entière, partie décimale), lire, écrire, comparer et ranger, additionner et soustraire des décimaux.",
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
