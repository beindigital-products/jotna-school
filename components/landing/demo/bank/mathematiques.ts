import { dragDrop, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * LES MATHÉMATIQUES, du CI au CM2 : un exercice par type et par classe, à la
 * difficulté et dans la thématique que le programme (`convex/programme`)
 * donne à la classe. Pas de phrase à trous (un calcul à trou s'écrit en
 * réponse courte), pas de réponse à écrire au CI.
 *
 * Chaque réponse numérique porte son `expression`, comme le `mathExpression`
 * du modèle : un test la recalcule. Les jeux de la matière (frises, suites de
 * nombres, dessin sur quadrillage) sont fabriqués par le code, pas écrits ici.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Ajouter et enlever jusqu'à 10",
      stage: 2,
      prompt: "Aïssatou a 3 mangues 🥭🥭🥭. On lui en donne 2 de plus 🥭🥭. Combien en a-t-elle maintenant ?",
      options: ["4", "6", "5", "1"],
      answer: "5",
      expression: "3 + 2",
      explanation: "3 + 2 = 5 : Aïssatou a 5 mangues.",
      hints: [
        "Compte d'abord les 3 mangues d'Aïssatou, puis celles qu'on lui donne.",
        "Ajouter, c'est avoir plus : compte sur tes doigts à partir de 3.",
      ],
    }),
    dragDrop({
      topic: "Les formes et les solides",
      stage: 1,
      prompt: "Glisse chaque forme dans la bonne case.",
      zones: ["Ronds", "Carrés", "Triangles"],
      items: { Ronds: ["🔴", "🔵"], Carrés: ["⬛", "🔲"], Triangles: ["🔺"] },
      hints: [
        "Regarde le contour de chaque forme.",
        "Le rond n'a aucun coin. Le triangle en a 3 et le carré en a 4.",
      ],
    }),
    match({
      topic: "Les nombres jusqu'à 10",
      stage: 2,
      prompt: "Relie chaque nombre au bon groupe de mangues.",
      pairs: [
        ["2", "🥭🥭"],
        ["3", "🥭🥭🥭"],
        ["4", "🥭🥭🥭🥭"],
        ["5", "🥭🥭🥭🥭🥭"],
      ],
      hints: [
        "Compte les mangues de chaque groupe, une par une.",
        "Touche un nombre, puis le groupe qui a autant de mangues.",
      ],
    }),
    order({
      topic: "Les nombres de 11 à 20",
      stage: 3,
      prompt: "Mets les nombres dans l'ordre, du plus petit au plus grand.",
      sequence: ["11", "14", "16", "19"],
      hints: [
        "Tous ces nombres ont 1 dizaine : compare leurs unités.",
        "Récite les nombres : 11, 12, 13... Celui que tu dis en premier est le plus petit.",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Additions et soustractions",
      stage: 2,
      prompt: "Modou a 35 F. Sa maman lui donne 25 F. Combien a-t-il maintenant ?",
      options: ["60", "50", "10", "70"],
      answer: "60",
      expression: "35 + 25",
      explanation: "35 + 25 = 60 : 5 + 5 = 10, on écrit 0 et on retient 1 dizaine.",
      hints: [
        "Pose l'addition : les unités avec les unités, les dizaines avec les dizaines.",
        "5 unités + 5 unités = 10 unités : écris 0 et retiens 1 dizaine.",
      ],
    }),
    dragDrop({
      topic: "L'heure, le calendrier, la monnaie",
      stage: 1,
      prompt: "Un jour ou un mois ? Glisse chaque mot dans la bonne case.",
      zones: ["Jours", "Mois"],
      items: { Jours: ["lundi", "jeudi", "dimanche"], Mois: ["mars", "juillet"] },
      hints: [
        "Un jour, c'est l'un des 7 jours de la semaine : récite-les dans ta tête.",
        "Un mois, c'est l'un des 12 mois de l'année : janvier, février...",
      ],
    }),
    match({
      topic: "Multiplier et partager",
      stage: 2,
      prompt: "Relie chaque multiplication à son résultat.",
      pairs: [
        ["2 × 3", "6"],
        ["3 × 3", "9"],
        ["5 × 2", "10"],
        ["4 × 3", "12"],
      ],
      hints: [
        "Une multiplication, ce sont des paquets pareils : 2 × 3, c'est 2 paquets de 3.",
        "Pour 4 × 3, compte 4 fois de 3 en 3 : 3, 6, 9...",
      ],
    }),
    order({
      topic: "Les nombres jusqu'à 50",
      stage: 3,
      prompt: "Range ces nombres du plus petit au plus grand.",
      sequence: ["9", "23", "38", "46"],
      hints: [
        "Compare d'abord les dizaines de chaque nombre.",
        "Un nombre à un seul chiffre est plus petit qu'un nombre à deux chiffres.",
      ],
    }),
    shortAnswer({
      topic: "Résoudre un problème",
      stage: 3,
      prompt: "Awa a 18 billes. Elle en perd 7, puis elle en gagne 5. Combien a-t-elle de billes ?",
      accepted: ["16"],
      expression: "18 - 7 + 5",
      hints: [
        "Lis l'histoire dans l'ordre : Awa perd des billes, puis elle en gagne.",
        "Perdre, c'est enlever. Gagner, c'est ajouter. Fais d'abord 18 − 7.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Additions et soustractions",
      stage: 2,
      prompt: "Cheikh a 275 F. Awa a 145 F. Combien ont-ils d'argent ensemble ?",
      options: ["410", "420", "430", "130"],
      answer: "420",
      expression: "275 + 145",
      explanation: "275 + 145 = 420. Il faut penser aux deux retenues : 5 + 5 = 10, puis 7 + 4 + 1 = 12.",
      hints: [
        "Pose l'addition en colonnes : les unités, les dizaines, puis les centaines.",
        "Unités : 5 + 5 = 10, tu écris 0 et tu retiens 1. N'oublie pas la retenue !",
      ],
    }),
    dragDrop({
      topic: "Droites, angles et figures",
      stage: 1,
      prompt: "Quelle est la forme de chaque objet ? Glisse-le dans la bonne case.",
      zones: ["Cercle", "Carré", "Rectangle"],
      items: {
        Cercle: ["Roue", "Pièce de 100 F"],
        Carré: ["Case du damier", "Mouchoir"],
        Rectangle: ["Ardoise", "Porte"],
      },
      hints: [
        "Imagine chaque objet vu de face et pense à sa forme.",
        "Le carré et le rectangle ont 4 angles droits. Le carré a ses 4 côtés égaux, le rectangle a 2 longueurs et 2 largeurs. Le cercle est tout rond.",
      ],
    }),
    match({
      topic: "La multiplication et ses tables",
      stage: 2,
      prompt: "Associe chaque calcul à son résultat.",
      pairs: [
        ["4 × 5", "20"],
        ["3 × 4", "12"],
        ["5 × 5", "25"],
        ["2 × 8", "16"],
      ],
      hints: [
        "Pense à tes tables : 5 × 5, c'est 5 paquets de 5.",
        "Pour 4 × 5, compte de 5 en 5 : 5, 10, 15...",
      ],
    }),
    order({
      topic: "Les nombres jusqu'à 10 000",
      stage: 3,
      prompt: "Range ces nombres à quatre chiffres, du plus petit au plus grand.",
      sequence: ["1 250", "1 502", "2 048", "2 408"],
      hints: [
        "Compare d'abord le chiffre des milliers.",
        "Quand les milliers sont les mêmes, compare les centaines.",
      ],
    }),
    shortAnswer({
      topic: "Résoudre des problèmes",
      stage: 4,
      prompt: "Une mangue coûte 150 F. Awa en achète 3 et paie avec 500 F. Combien lui rend-on ?",
      accepted: ["50"],
      expression: "500 - 3 × 150",
      hints: [
        "Cherche d'abord combien coûtent les 3 mangues en tout.",
        "Ensuite, enlève cette somme des 500 F payés : c'est la monnaie rendue.",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "La division",
      stage: 1,
      prompt: "Ousmane partage 56 mangues en 7 tas égaux. Combien de mangues y a-t-il dans chaque tas ?",
      options: ["7", "49", "9", "8"],
      answer: "8",
      expression: "56 ÷ 7",
      explanation: "56 ÷ 7 = 8, car 7 × 8 = 56.",
      hints: [
        "Partager en parts égales, c'est diviser.",
        "Cherche dans la table de 7 : 7 × ? = 56.",
      ],
    }),
    dragDrop({
      topic: "La symétrie et les solides",
      stage: 2,
      prompt: "Cube, pavé droit ou cylindre ? Glisse chaque objet dans la bonne case.",
      zones: ["Cube", "Pavé droit", "Cylindre"],
      items: {
        Cube: ["Dé"],
        "Pavé droit": ["Brique", "Boîte à chaussures"],
        Cylindre: ["Boîte de tomate", "Bougie"],
      },
      hints: [
        "Regarde les faces de chaque objet : sont-elles carrées, rectangulaires ou rondes ?",
        "Le cube a 6 faces carrées toutes pareilles ; le pavé droit a des faces rectangulaires ; le cylindre a 2 faces rondes et il peut rouler.",
      ],
    }),
    match({
      topic: "Mesures et conversions",
      stage: 2,
      prompt: "Associe chaque mesure à son équivalent.",
      pairs: [
        ["1 km", "1 000 m"],
        ["1 kg", "1 000 g"],
        ["1 m", "100 cm"],
        ["1 h", "60 min"],
        ["1 L", "10 dL"],
      ],
      hints: [
        "« Kilo » veut dire 1 000 : un kilomètre, un kilogramme...",
        "Relie d'abord les mesures de même sorte : les longueurs, les masses, les durées et les contenances.",
      ],
    }),
    order({
      topic: "Les nombres jusqu'à 100 000",
      stage: 3,
      prompt: "Range ces nombres du plus grand au plus petit.",
      sequence: ["64 250", "60 425", "46 520", "40 625"],
      hints: [
        "Ici, on commence par le plus grand nombre.",
        "Compare d'abord les dizaines de mille, puis les unités de mille.",
      ],
    }),
    shortAnswer({
      topic: "Problèmes en plusieurs étapes",
      stage: 4,
      prompt: "Mariama achète 4 cahiers à 250 F et un stylo à 150 F. Combien paie-t-elle en tout ?",
      accepted: ["1150"],
      expression: "4 × 250 + 150",
      hints: [
        "Il y a deux étapes : d'abord les cahiers, ensuite le stylo.",
        "Calcule 4 × 250, puis ajoute le prix du stylo.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Les fractions",
      stage: 2,
      prompt: "Un gâteau est coupé en 8 parts égales. Aïssatou en mange 3. Quelle fraction du gâteau a-t-elle mangée ?",
      options: ["8/3", "5/8", "3/8", "3/5"],
      answer: "3/8",
      explanation: "Le gâteau a 8 parts (le dénominateur) et Aïssatou en mange 3 (le numérateur) : 3/8.",
      hints: [
        "Le dénominateur, écrit après la barre « / », dit en combien de parts égales on a coupé le gâteau.",
        "Le numérateur, écrit avant la barre, dit combien de parts Aïssatou a mangées.",
      ],
    }),
    dragDrop({
      topic: "Divisibilité et calcul mental",
      stage: 3,
      prompt: "Divisible par 2, par 5 ou par les deux ? Glisse chaque nombre dans la bonne case.",
      zones: ["Par 2, pas par 5", "Par 5, pas par 2", "Par 2 et par 5"],
      items: {
        "Par 2, pas par 5": ["124", "318"],
        "Par 5, pas par 2": ["135", "245"],
        "Par 2 et par 5": ["370", "500"],
      },
      hints: [
        "Un nombre est divisible par 2 s'il finit par 0, 2, 4, 6 ou 8.",
        "Un nombre est divisible par 5 s'il finit par 0 ou 5.",
      ],
    }),
    match({
      topic: "Les nombres décimaux",
      stage: 2,
      prompt: "Associe chaque écriture à son nombre décimal.",
      pairs: [
        ["3 dixièmes", "0,3"],
        ["5 centièmes", "0,05"],
        ["12 centièmes", "0,12"],
        ["2 unités et 5 dixièmes", "2,5"],
      ],
      hints: [
        "1 dixième s'écrit 0,1 et 1 centième s'écrit 0,01.",
        "Le chiffre juste après la virgule est celui des dixièmes.",
      ],
    }),
    order({
      topic: "Les grands nombres",
      stage: 3,
      prompt: "Classe ces nombres par ordre croissant.",
      sequence: ["95 600", "406 000", "1 250 000", "3 000 000"],
      hints: [
        "Plus un nombre a de chiffres, plus il est grand.",
        "Si deux nombres ont autant de chiffres, compare-les chiffre par chiffre, en partant de la gauche.",
      ],
    }),
    shortAnswer({
      topic: "La division posée",
      stage: 4,
      prompt: "Une école reçoit 1 440 cahiers. Elle les partage en parts égales entre ses 24 classes. Combien de cahiers reçoit chaque classe ?",
      accepted: ["60"],
      expression: "1440 ÷ 24",
      hints: [
        "Partager en parts égales, c'est faire une division.",
        "Pose la division : cherche d'abord combien de fois 24 va dans 144. Aide-toi de 24 × 5 = 120.",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Acheter, vendre, gagner",
      stage: 2,
      prompt: "Un commerçant achète un sac de riz 18 000 F et le revend 21 500 F. Quel est son bénéfice ?",
      options: ["39 500", "3 500", "3 000", "4 500"],
      answer: "3 500",
      expression: "21500 - 18000",
      explanation: "Sans frais, le prix de revient est le prix d'achat : bénéfice = 21 500 − 18 000 = 3 500 F.",
      hints: [
        "Le bénéfice, c'est ce que le commerçant gagne en plus de ce qu'il a payé.",
        "Ici, il n'y a pas de frais : bénéfice = prix de vente − prix d'achat.",
      ],
    }),
    dragDrop({
      topic: "Solides et volumes",
      stage: 1,
      prompt: "Longueur, aire ou volume ? Glisse chaque unité dans la bonne case.",
      zones: ["Longueur", "Aire", "Volume"],
      items: { Longueur: ["cm", "m"], Aire: ["cm²", "m²"], Volume: ["cm³", "m³"] },
      hints: [
        "Regarde le petit chiffre en haut de l'unité : ² ou ³ ?",
        "m² se lit « mètre carré » : c'est l'unité d'une surface, comme le sol de ta classe.",
      ],
    }),
    match({
      topic: "Opérations sur les décimaux",
      stage: 2,
      prompt: "Sans poser l'opération, relie chaque calcul à son résultat.",
      pairs: [
        ["3,5 × 10", "35"],
        ["0,48 × 100", "48"],
        ["7,2 ÷ 10", "0,72"],
        ["250 ÷ 1 000", "0,25"],
      ],
      hints: [
        "Multiplier par 10, c'est décaler la virgule d'un rang vers la droite.",
        "Diviser par 10, c'est la décaler d'un rang vers la gauche.",
      ],
    }),
    order({
      topic: "Millions et milliards",
      stage: 3,
      prompt: "Remets ces nombres dans l'ordre croissant.",
      sequence: ["8 500 000", "12 000 000", "750 000 000", "1 200 000 000"],
      hints: [
        "Un milliard, c'est 1 000 millions.",
        "Compte les chiffres de chaque nombre, par tranches de trois.",
      ],
    }),
    shortAnswer({
      topic: "Vitesse, distance et durée",
      stage: 4,
      prompt: "Un car roule à 60 km/h. Il part à 8 h et arrive à 11 h 30. Quelle distance parcourt-il, en km ?",
      accepted: ["210"],
      expression: "3.5 × 60",
      hints: [
        "Entre 8 h et 11 h 30, combien d'heures passent ? 30 min, c'est une demi-heure.",
        "Distance = vitesse × durée. Ici, la durée est 3,5 h.",
      ],
    }),
  ],
};
