/**
 * ÉVEIL SCIENTIFIQUE — Domaine 3 du CEB (ESVS), activités IST (initiation
 * scientifique et technologique) et « Vivre dans son milieu » (santé,
 * population, environnement).
 *
 * « Vivre dans son milieu » relève officiellement de l'Éducation au
 * développement durable ; il est rangé ici parce que ses contenus (hygiène,
 * paludisme, eau potable, nutrition) se travaillent en sciences à l'école.
 *
 * Les guides présentent l'ESVS par étape, en deux niveaux (paliers 1-2 puis
 * 3-4), sans dire quel niveau revient à quelle classe. Répartition proposée :
 * le niveau 1 en première année d'étape (CI, CE1, CM1), le niveau 2 en
 * seconde (CP, CE2, CM2) ; à l'étape 1, les repères communs sont partagés
 * entre le CI et le CP.
 */
import type { ProgrammeSubject } from "./types";

export const EVEIL_SCIENTIFIQUE: ProgrammeSubject = {
  key: "eveil-scientifique",
  name: "Éveil scientifique",
  aliases: ["Sciences", "Eveil scientifique", "Sciences d'observation", "IST"],
  icon: "Flask",
  color: "#10b981",
  order: 3,
  domain: "Éducation à la science et à la vie sociale",
  classes: {
    CI: [
      {
        key: "sc-ci-milieu",
        name: "Naturel ou fabriqué ?",
        description:
          "IST, étape 1 : les éléments naturels du milieu (arbre, eau, sable, pierre, animaux) et les éléments techniques fabriqués par l'homme (table, seau, vélo, pirogue) ; trier les uns et les autres.",
        // Dix gabarits (`milieuCi.ts`) : la chose fabriquée ou naturelle parmi trois, ranger sous « naturel » et « fabriqué », une phrase à trou.
        games: [
          { kind: "milieu-intrus", count: 3 },
          { kind: "milieu-glisser", count: 4 },
          { kind: "milieu-trou", count: 3 },
        ],
        byLevel: true,
      },
      {
        key: "sc-ci-animaux",
        name: "Les animaux autour de moi",
        description:
          "IST, étape 1 : classer les animaux du Sénégal : domestiques (mouton, chèvre, poule, âne, chat) et sauvages (lion, singe, hyène, crocodile) ; à poils, à plumes, à écailles ; où ils vivent (dans l'eau, sur terre, dans les airs).",
        // Dix gabarits (`milieuCi.ts`) : domestique ou sauvage (ranger, un parmi trois), poils, plumes ou écailles, l'eau, la terre ou les airs (ranger, un parmi trois, relier), une phrase à trou.
        games: [
          { kind: "faune-glisser", count: 2 },
          { kind: "faune-habitat", count: 1 },
          { kind: "faune-intrus", count: 2 },
          { kind: "faune-couvre", count: 2 },
          { kind: "faune-vit", count: 1 },
          { kind: "faune-relier", count: 1 },
          { kind: "faune-trou", count: 1 },
        ],
        byLevel: true,
      },
      {
        key: "sc-ci-plantes",
        name: "Les plantes autour de moi",
        description:
          "IST, étape 1 : reconnaître des plantes du milieu (baobab, manguier, fromager, mil, arachide), nommer les parties d'une plante (racine, tige, feuille, fleur, fruit).",
        // Dix gabarits (`milieuCi.ts`) : la partie de la plante qui répond, la plante qui donne un fruit, relier une plante et ce qu'elle donne, arbre ou plante du champ, les parties dans l'ordre, une phrase à trou.
        games: [
          { kind: "plante-partie", count: 2 },
          { kind: "plante-qui", count: 1 },
          { kind: "plante-donne", count: 2 },
          { kind: "plante-type", count: 2 },
          { kind: "plante-ordre", count: 1 },
          { kind: "plante-trou", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "sc-ci-hygiene",
        name: "Mon corps et la propreté",
        description:
          "Vivre dans son milieu, étape 1 : les parties du corps ; l'hygiène (se laver les mains avec du savon avant de manger et après les toilettes, se brosser les dents, se laver, couper ses ongles) ; les aliments qui rendent malade (fruits non lavés, nourriture laissée découverte).",
        // Dix gabarits (`soinsCi.ts`) : que fais-tu dans une situation, à faire ou à éviter, un geste bon ou mauvais parmi trois, les gestes dans l'ordre, avec quoi je vois ou j'entends, relier une partie du corps et son soin, une phrase à trou.
        games: [
          { kind: "hygiene-situation", count: 2 },
          { kind: "hygiene-glisser", count: 1 },
          { kind: "hygiene-intrus", count: 1 },
          { kind: "hygiene-soin", count: 1 },
          { kind: "hygiene-ordre", count: 2 },
          { kind: "hygiene-trou", count: 1 },
          { kind: "hygiene-sens", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "sc-ci-outils",
        name: "Les outils de la maison et de l'école",
        description:
          "IST, étape 1 : outils et objets techniques (ciseaux, marteau, pilon et mortier, balai, seau, arrosoir) : à quoi ils servent, comment s'en servir sans se blesser, ranger et entretenir son matériel.",
        // Dix gabarits (`soinsCi.ts`) : avec quel outil je fais cela, relier un outil et son usage, une phrase à trou, les gestes d'un outil dans l'ordre, que fais-tu avec l'outil, à faire ou à éviter.
        games: [
          { kind: "outil-qui", count: 2 },
          { kind: "outil-relier", count: 2 },
          { kind: "outil-trou", count: 2 },
          { kind: "outil-ordre", count: 1 },
          { kind: "outil-geste", count: 2 },
          { kind: "outil-glisser", count: 1 },
        ],
        byLevel: true,
      },
    ],
    CP: [
      {
        key: "sc-cp-matiere",
        name: "Solide, liquide ou gaz ?",
        description:
          "IST, étape 1 : les états de la matière. L'eau liquide, la glace solide, la vapeur ; le sable, la pierre, l'air ; ce qui coule et ce qui garde sa forme.",
        // Dix gabarits (`sciences.ts`) : l'état d'une chose, ranger, relier, ce que le chaud fait à l'eau, glace, eau, vapeur, trous, mot à écrire.
        games: [
          { kind: "etat-qcm", count: 2 },
          { kind: "etat-glisser", count: 1 },
          { kind: "etat-relier", count: 1 },
          { kind: "etat-change", count: 1 },
          { kind: "etat-ordre", count: 1 },
          { kind: "etat-trou", count: 2 },
          { kind: "etat-ecrire", count: 2 },
        ],
      },
      {
        key: "sc-cp-grandir",
        name: "Les êtres vivants grandissent",
        description:
          "IST, étape 1 : les étapes du développement. L'œuf, le poussin, la poule ; la graine, la jeune plante, la plante ; le bébé, l'enfant, l'adulte, le vieillard. Remettre les étapes dans l'ordre.",
        // Dix gabarits (`sciences.ts`) : ordre des étapes, l'étape juste avant ou après, le petit d'un animal, relier, ce qui grandit, trous.
        games: [
          { kind: "vie-ordre", count: 2 },
          { kind: "vie-suite", count: 2 },
          { kind: "vie-petit", count: 1 },
          { kind: "vie-relier", count: 1 },
          { kind: "vie-glisser", count: 2 },
          { kind: "vie-trou", count: 2 },
        ],
      },
      {
        key: "sc-cp-manger",
        name: "Bien manger",
        description:
          "Vivre dans son milieu, étape 1 : les aliments utiles (fruits, légumes, poisson, mil, lait caillé, niébé) et les aliments nuisibles (trop de sucre, aliments avariés ou mal conservés) ; manger propre.",
        // Dix gabarits (`sciences.ts`) : les scènes de la table « manger » (`vocabulary`), les aliments utiles ou nuisibles, fruit ou légume.
        games: [
          { kind: "habitude-situation", count: 2, vocabulary: "manger" },
          { kind: "habitude-glisser", count: 1, vocabulary: "manger" },
          { kind: "habitude-intrus", count: 1, vocabulary: "manger" },
          { kind: "habitude-relier", count: 1, vocabulary: "manger" },
          { kind: "habitude-ordre", count: 1, vocabulary: "manger" },
          { kind: "habitude-trou", count: 1, vocabulary: "manger" },
          { kind: "repas-qcm", count: 1 },
          { kind: "repas-glisser", count: 1 },
          { kind: "repas-fruit-legume", count: 1 },
        ],
      },
      {
        key: "sc-cp-maladies",
        name: "Les maladies du milieu",
        description:
          "Vivre dans son milieu, étape 1 : le paludisme (transmis par le moustique, dormir sous une moustiquaire), la diarrhée (eau sale, mains sales), comment s'en protéger, aller au dispensaire.",
        // Dix gabarits (`sciences.ts`) : les scènes de la table « maladies » (`vocabulary`), se protéger du paludisme et de la diarrhée.
        games: [
          { kind: "habitude-situation", count: 2, vocabulary: "maladies" },
          { kind: "habitude-glisser", count: 1, vocabulary: "maladies" },
          { kind: "habitude-intrus", count: 1, vocabulary: "maladies" },
          { kind: "habitude-relier", count: 1, vocabulary: "maladies" },
          { kind: "habitude-ordre", count: 1, vocabulary: "maladies" },
          { kind: "habitude-trou", count: 1, vocabulary: "maladies" },
          { kind: "maladie-glisser", count: 1 },
          { kind: "maladie-cause", count: 2 },
        ],
      },
      {
        key: "sc-cp-nature",
        name: "Protéger la nature",
        description:
          "Vivre dans son milieu, étape 1 : protéger les plantes et les animaux, ne pas jeter les sachets plastiques, garder la cour et le quartier propres, planter et arroser un arbre ; ce qui abîme l'environnement et comment le réparer.",
        // Dix gabarits (`sciences.ts`) : les scènes de la table « nature » (`vocabulary`), ce qui abîme et ce qui le répare.
        games: [
          { kind: "habitude-situation", count: 3, vocabulary: "nature" },
          { kind: "habitude-glisser", count: 1, vocabulary: "nature" },
          { kind: "habitude-intrus", count: 1, vocabulary: "nature" },
          { kind: "habitude-relier", count: 1, vocabulary: "nature" },
          { kind: "habitude-ordre", count: 1, vocabulary: "nature" },
          { kind: "habitude-trou", count: 1, vocabulary: "nature" },
          { kind: "nature-reparer", count: 2 },
        ],
      },
    ],
    CE1: [
      {
        key: "sc-ce1-nutrition",
        name: "Comment se nourrissent les êtres vivants",
        description:
          "IST, étape 2, paliers 1-2 : la nutrition. Herbivores, carnivores, omnivores ; une chaîne alimentaire simple (herbe → mouton → lion) ; les besoins des plantes (eau, lumière, sol).",
        // Dix gabarits (`ce1Vivant.ts`) : le régime d'un animal (trois façons de le demander, ranger, relier), la chaîne alimentaire (ranger, lire), les besoins d'une plante (un parmi trois, une phrase à trou, ranger).
        games: [
          { kind: "ce1-nutri-regime-qcm", count: 1 },
          { kind: "ce1-nutri-mot-qcm", count: 1 },
          { kind: "ce1-nutri-mange-qcm", count: 1 },
          { kind: "ce1-nutri-regime-glisser", count: 1 },
          { kind: "ce1-nutri-regime-relier", count: 1 },
          { kind: "ce1-nutri-chaine-ordre", count: 1 },
          { kind: "ce1-nutri-chaine-qcm", count: 1 },
          { kind: "ce1-nutri-plante-qcm", count: 1 },
          { kind: "ce1-nutri-plante-trou", count: 1 },
          { kind: "ce1-nutri-plante-glisser", count: 1 },
        ],
      },
      {
        key: "sc-ce1-respiration",
        name: "La respiration",
        description:
          "IST, étape 2, paliers 1-2 : la respiration. L'homme respire avec ses poumons (par le nez et la bouche), le poisson avec ses branchies ; air pur et air pollué (fumée, poussière).",
        // Dix gabarits (`ce1Vivant.ts`) : avec quoi un animal respire (un parmi trois, quel animal, ranger), le trajet de l'air, ce qui pollue l'air (un parmi trois, ranger), relier les mots, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce1-resp-organe-qcm", count: 1 },
          { kind: "ce1-resp-organe-nom", count: 1 },
          { kind: "ce1-resp-organe-glisser", count: 1 },
          { kind: "ce1-resp-voie-qcm", count: 1 },
          { kind: "ce1-resp-air-qcm", count: 1 },
          { kind: "ce1-resp-air-glisser", count: 1 },
          { kind: "ce1-resp-relier", count: 1 },
          { kind: "ce1-resp-trou", count: 2 },
          { kind: "ce1-resp-ecrire", count: 1 },
        ],
      },
      {
        key: "sc-ce1-substances",
        name: "Les substances autour de nous",
        description:
          "IST, étape 2, paliers 1-2 : substances physiques et chimiques. Le sel et le sucre se dissolvent dans l'eau, le sable non ; mélanger, filtrer, laisser reposer (décanter).",
        // Dix gabarits (`ce1Matiere.ts`) : ce qui se dissout dans l'eau (un parmi trois, ranger, compter), dissoudre, mélanger, filtrer, laisser reposer (un parmi trois, relier, ranger les gestes, une phrase à trou).
        games: [
          { kind: "ce1-subst-dissout-qcm", count: 2 },
          { kind: "ce1-subst-dissout-glisser", count: 1 },
          { kind: "ce1-subst-dissout-compte", count: 1 },
          { kind: "ce1-subst-devient-qcm", count: 2 },
          { kind: "ce1-subst-relier", count: 1 },
          { kind: "ce1-subst-ordre", count: 1 },
          { kind: "ce1-subst-trou", count: 2 },
        ],
      },
      {
        key: "sc-ce1-eau",
        name: "L'eau potable",
        description:
          "Vivre dans son milieu, étape 2, paliers 1-2 : d'où vient l'eau (robinet, puits, forage, fleuve), comment la rendre potable (la faire bouillir, la filtrer, quelques gouttes d'eau de javel), la conserver dans un récipient propre et couvert.",
        // Dix gabarits (`ce1Matiere.ts`) : d'où vient l'eau (un parmi trois, relier), comment la rendre potable (un parmi trois, ranger, ranger les gestes), comment la garder, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce1-pot-source", count: 1 },
          { kind: "ce1-pot-relier", count: 1 },
          { kind: "ce1-pot-geste", count: 2 },
          { kind: "ce1-pot-garde", count: 1 },
          { kind: "ce1-pot-glisser", count: 1 },
          { kind: "ce1-pot-ordre", count: 1 },
          { kind: "ce1-pot-trou", count: 2 },
          { kind: "ce1-pot-ecrire", count: 1 },
        ],
      },
      {
        key: "sc-ce1-paludisme",
        name: "Les parasites et le paludisme",
        description:
          "Vivre dans son milieu, étape 2, paliers 1-2 : les vers intestinaux (mains sales, aliments mal lavés) ; le paludisme, transmis par la piqûre du moustique anophèle ; se protéger (moustiquaire imprégnée, supprimer les eaux stagnantes) ; aller au dispensaire en cas de fièvre.",
        // Dix gabarits (`ce1Vivant.ts`) : la cause du paludisme, se protéger des moustiques, éviter les vers, que faire en cas de fièvre (un parmi trois), ranger ce qui protège et ce qui donne des vers, relier, ranger les gestes, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce1-palu-cause-qcm", count: 1 },
          { kind: "ce1-palu-proteger-qcm", count: 1 },
          { kind: "ce1-palu-vers-qcm", count: 1 },
          { kind: "ce1-palu-fievre-qcm", count: 1 },
          { kind: "ce1-palu-glisser", count: 1 },
          { kind: "ce1-palu-vers-glisser", count: 1 },
          { kind: "ce1-palu-relier", count: 1 },
          { kind: "ce1-palu-ordre", count: 1 },
          { kind: "ce1-palu-trou", count: 1 },
          { kind: "ce1-palu-ecrire", count: 1 },
        ],
      },
      {
        key: "sc-ce1-objets",
        name: "Les objets techniques simples",
        description:
          "IST, étape 2, paliers 1-2 : objets technologiques simples (lampe torche, ciseaux, robinet, cadenas) : à quoi ils servent, comment ils fonctionnent, comment les entretenir ; prendre soin de l'environnement de l'école.",
        // Dix gabarits (`ce1Matiere.ts`) : à quoi sert un objet (un parmi trois dans les deux sens, ranger, relier), comment il marche et s'entretient, prendre soin de l'école, ranger les gestes, une phrase à trou.
        games: [
          { kind: "ce1-objet-usage-qcm", count: 1 },
          { kind: "ce1-objet-qui-qcm", count: 1 },
          { kind: "ce1-objet-glisser", count: 1 },
          { kind: "ce1-objet-relier", count: 1 },
          { kind: "ce1-objet-marche-qcm", count: 2 },
          { kind: "ce1-ecole-qcm", count: 1 },
          { kind: "ce1-objet-ordre", count: 1 },
          { kind: "ce1-objet-trou", count: 2 },
        ],
      },
    ],
    CE2: [
      {
        key: "sc-ce2-corps",
        name: "Le corps humain",
        description:
          "IST, étape 2, paliers 3-4 : aspects biologiques de l'homme. Le squelette (crâne, colonne vertébrale, côtes), les muscles, les cinq sens et leurs organes.",
        // Neuf gabarits (`ce2Vivant.ts`) : quel sens une scène fait travailler, l'organe de chaque sens, relier organe et sens, le rôle du crâne, des côtes, de la colonne et des muscles, ranger os et organes, ranger des scènes par sens, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-sens-situation", count: 1 },
          { kind: "ce2-organe-qcm", count: 1 },
          { kind: "ce2-sens-relier", count: 1 },
          { kind: "ce2-os-qcm", count: 1 },
          { kind: "ce2-os-relier", count: 1 },
          { kind: "ce2-squelette-glisser", count: 1 },
          { kind: "ce2-scene-glisser", count: 1 },
          { kind: "ce2-corps-trou", count: 2 },
          { kind: "ce2-corps-ecrire", count: 1 },
        ],
      },
      {
        key: "sc-ce2-plantes",
        name: "La vie des plantes",
        description:
          "IST, étape 2, paliers 3-4 : la germination de la graine (eau, chaleur, air), la croissance, la fleur qui devient fruit, le fruit qui porte les graines (mangue, arachide, mil).",
        // Six gabarits (`ce2Vivant.ts`) : la germination (eau, chaleur, air), la fleur et le fruit, le noyau, la gousse et les grains, les étapes de la vie d'une plante, relier une partie à ce qu'elle fait, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-plante-qcm", count: 3 },
          { kind: "ce2-plante-trou", count: 2 },
          { kind: "ce2-plante-ecrire", count: 2 },
          { kind: "ce2-besoin-glisser", count: 1 },
          { kind: "ce2-plante-ordre", count: 1 },
          { kind: "ce2-plante-relier", count: 1 },
        ],
      },
      {
        key: "sc-ce2-animaux",
        name: "La vie des animaux",
        description:
          "IST, étape 2, paliers 3-4 : la reproduction des animaux, ovipares (poule, tortue, poisson) et vivipares (chèvre, chat, homme) ; le cycle de vie de la grenouille et du papillon.",
        // Huit gabarits (`ce2Vivant.ts`) : ovipares et vivipares, la définition et la naissance, ranger les animaux, relier un animal à son petit, la vie du papillon, de la grenouille, de la poule et du canard, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-ovipare-qcm", count: 1 },
          { kind: "ce2-animal-definition", count: 1 },
          { kind: "ce2-animal-glisser", count: 1 },
          { kind: "ce2-petit-relier", count: 1 },
          { kind: "ce2-cycle-ordre", count: 1 },
          { kind: "ce2-cycle-qcm", count: 1 },
          { kind: "ce2-animal-trou", count: 2 },
          { kind: "ce2-animal-ecrire", count: 2 },
        ],
      },
      {
        key: "sc-ce2-electricite",
        name: "Le circuit électrique",
        description:
          "IST, étape 2, paliers 3-4 : le circuit électrique simple (pile, ampoule, fils, interrupteur) ; circuit ouvert et fermé ; conducteurs (métaux) et isolants (plastique, bois) ; les dangers de l'électricité.",
        // Neuf gabarits (`ce2Milieu.ts`) : le rôle de chaque pièce du circuit, circuit ouvert et fermé, conducteurs et isolants, les dangers, l'ordre de ce qui se passe quand on ferme l'interrupteur, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-circuit-piece-qcm", count: 1 },
          { kind: "ce2-circuit-piece-relier", count: 1 },
          { kind: "ce2-circuit-etat-qcm", count: 1 },
          { kind: "ce2-conducteur-glisser", count: 1 },
          { kind: "ce2-matiere-qcm", count: 1 },
          { kind: "ce2-danger-glisser", count: 1 },
          { kind: "ce2-circuit-ordre", count: 1 },
          { kind: "ce2-circuit-trou", count: 2 },
          { kind: "ce2-circuit-ecrire", count: 1 },
        ],
      },
      {
        key: "sc-ce2-sante",
        name: "Se protéger des maladies",
        description:
          "Vivre dans son milieu, étape 2, paliers 3-4 : se protéger du paludisme ; le VIH/SIDA expliqué simplement à un enfant de 8 ans : ne pas toucher le sang d'une autre personne, ne pas partager une lame ou une seringue ; on ne l'attrape pas en jouant, en mangeant ou en se donnant la main.",
        // Sept gabarits (`ce2Milieu.ts`) : se protéger du paludisme, ce qui transmet le VIH et ce qui ne le transmet pas (jouer, manger, se donner la main), ranger les gestes, relier un geste à ce qu'il apporte, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-palu-qcm", count: 1 },
          { kind: "ce2-vih-qcm", count: 2 },
          { kind: "ce2-geste-glisser", count: 1 },
          { kind: "ce2-vih-glisser", count: 1 },
          { kind: "ce2-palu-relier", count: 1 },
          { kind: "ce2-sante-trou", count: 2 },
          { kind: "ce2-sante-ecrire", count: 2 },
        ],
      },
      {
        key: "sc-ce2-environnement",
        name: "L'environnement et la population",
        description:
          "Vivre dans son milieu, étape 2, paliers 3-4 : les problèmes d'environnement du milieu (déchets, sachets plastiques, coupe des arbres, feux de brousse) et ceux liés à la population (quartiers trop peuplés, manque d'eau) ; les solutions.",
        // Huit gabarits (`ce2Milieu.ts`) : ce que provoque un problème, la solution, relier problème et solution, ranger problèmes de l'environnement et de la population, bons et mauvais gestes, l'ordre des gestes, une phrase à trou, un mot à écrire.
        games: [
          { kind: "ce2-env-cause-qcm", count: 1 },
          { kind: "ce2-env-solution-qcm", count: 1 },
          { kind: "ce2-env-relier", count: 1 },
          { kind: "ce2-env-probleme-glisser", count: 1 },
          { kind: "ce2-env-geste-glisser", count: 1 },
          { kind: "ce2-env-ordre", count: 1 },
          { kind: "ce2-env-trou", count: 2 },
          { kind: "ce2-env-ecrire", count: 2 },
        ],
      },
    ],
    CM1: [
      {
        key: "sc-cm1-digestion",
        games: [
          { kind: "cm1-dig-qcm", count: 3 },
          { kind: "cm1-dig-trou", count: 2 },
          { kind: "cm1-dig-ecrire", count: 1 },
          { kind: "cm1-dig-ordre", count: 1 },
          { kind: "cm1-dig-relier", count: 1 },
          { kind: "cm1-dig-glisser", count: 2 },
        ],
        name: "La digestion",
        description:
          "IST, étape 3, paliers 1-2 : l'appareil digestif (bouche, œsophage, estomac, intestins), le trajet des aliments, bien mâcher, l'hygiène de la bouche.",
      },
      {
        key: "sc-cm1-respiration",
        games: [
          { kind: "cm1-rsp-qcm", count: 3 },
          { kind: "cm1-rsp-trou", count: 2 },
          { kind: "cm1-rsp-ecrire", count: 1 },
          { kind: "cm1-rsp-ordre", count: 1 },
          { kind: "cm1-rsp-relier", count: 1 },
          { kind: "cm1-rsp-glisser", count: 2 },
        ],
        name: "La respiration et ses maladies",
        description:
          "IST, étape 3, paliers 1-2 : le trajet de l'air (nez, trachée, bronches, poumons), l'inspiration et l'expiration ; les maladies respiratoires (rhume, toux, asthme, tuberculose) et leur prévention (fumée, poussière, aérer la maison).",
      },
      {
        key: "sc-cm1-circulation",
        games: [
          { kind: "cm1-cir-qcm", count: 3 },
          { kind: "cm1-cir-trou", count: 2 },
          { kind: "cm1-cir-ecrire", count: 1 },
          { kind: "cm1-cir-ordre", count: 1 },
          { kind: "cm1-cir-relier", count: 1 },
          { kind: "cm1-cir-glisser", count: 2 },
        ],
        name: "Le cœur et le sang",
        description:
          "IST, étape 3, paliers 1-2 : la circulation sanguine. Le cœur pompe le sang, les artères et les veines, le pouls ; le sang transporte l'oxygène et les aliments dans tout le corps.",
      },
      {
        key: "sc-cm1-phenomenes",
        games: [
          { kind: "cm1-phe-qcm", count: 3 },
          { kind: "cm1-phe-trou", count: 2 },
          { kind: "cm1-phe-ecrire", count: 1 },
          { kind: "cm1-phe-ordre", count: 1 },
          { kind: "cm1-phe-relier", count: 1 },
          { kind: "cm1-phe-glisser", count: 2 },
        ],
        name: "Phénomènes physiques et chimiques",
        description:
          "IST, étape 3, paliers 1-2 : l'évaporation, la condensation, la fusion et la solidification ; la combustion (le feu a besoin d'air) ; la rouille.",
      },
      {
        key: "sc-cm1-objets",
        games: [
          { kind: "cm1-obj-qcm", count: 3 },
          { kind: "cm1-obj-trou", count: 2 },
          { kind: "cm1-obj-ecrire", count: 1 },
          { kind: "cm1-obj-ordre", count: 1 },
          { kind: "cm1-obj-relier", count: 1 },
          { kind: "cm1-obj-glisser", count: 2 },
        ],
        name: "Démonter et assembler un objet",
        description:
          "IST, étape 3, paliers 1-2 : objets techniques (vélo, lampe torche, robinet) : leurs pièces, le rôle de chacune, l'ordre du démontage et du montage, l'entretien.",
      },
      {
        key: "sc-cm1-hygiene",
        games: [
          { kind: "cm1-hyg-qcm", count: 3 },
          { kind: "cm1-hyg-trou", count: 2 },
          { kind: "cm1-hyg-ecrire", count: 1 },
          { kind: "cm1-hyg-ordre", count: 1 },
          { kind: "cm1-hyg-relier", count: 1 },
          { kind: "cm1-hyg-glisser", count: 2 },
        ],
        name: "L'hygiène du milieu",
        description:
          "Vivre dans son milieu, étape 3, paliers 1-2 : l'insalubrité (ordures, eaux usées) et la promiscuité ; les maladies de la peau (gale, teigne) et des voies respiratoires ; l'hygiène individuelle et collective.",
      },
    ],
    CM2: [
      {
        key: "sc-cm2-milieux",
        name: "Vivre dans l'eau, vivre sur terre",
        description:
          "IST, étape 3, paliers 3-4 : les êtres du milieu aquatique (poisson, crevette, nénuphar) et du milieu terrestre (chèvre, baobab) ; leurs adaptations : nageoires, branchies, écailles, poils, plumes, racines profondes, feuilles épineuses en zone sèche.",
      },
      {
        key: "sc-cm2-appareils",
        name: "Les appareils de la maison",
        description:
          "IST, étape 3, paliers 3-4 : outils et appareils courants (réfrigérateur, ventilateur, téléphone portable, fer à repasser) : usage, entretien, sécurité électrique, économies d'énergie.",
      },
      {
        key: "sc-cm2-nutrition",
        name: "Bien se nourrir pour bien grandir",
        description:
          "Vivre dans son milieu, étape 3, paliers 3-4 : les groupes d'aliments (énergétiques, de construction, de protection), un repas équilibré avec des plats sénégalais, les troubles nutritionnels (carences, malnutrition, obésité).",
      },
      {
        key: "sc-cm2-ressources",
        name: "Gérer et restaurer les ressources",
        description:
          "Vivre dans son milieu, étape 3, paliers 3-4 : la dégradation des ressources (déforestation, surpêche, sols épuisés) et la pauvreté ; la gestion et la restauration : reboisement, jachère, pêche responsable, économiser l'eau.",
      },
      {
        key: "sc-cm2-sante",
        name: "La santé de la mère et de l'enfant",
        description:
          "Vivre dans son milieu, étape 3, paliers 3-4 : les consultations prénatales, la vaccination des enfants, l'allaitement, la taille de la famille et la santé de la mère et de l'enfant ; la prévention du VIH/SIDA. Ton adapté à des enfants de 10-11 ans, sans détail intime.",
      },
    ],
  },
};
