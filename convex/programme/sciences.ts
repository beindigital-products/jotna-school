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
      },
      {
        key: "sc-ci-animaux",
        name: "Les animaux autour de moi",
        description:
          "IST, étape 1 : classer les animaux du Sénégal : domestiques (mouton, chèvre, poule, âne, chat) et sauvages (lion, singe, hyène, crocodile) ; à poils, à plumes, à écailles ; où ils vivent (dans l'eau, sur terre, dans les airs).",
      },
      {
        key: "sc-ci-plantes",
        name: "Les plantes autour de moi",
        description:
          "IST, étape 1 : reconnaître des plantes du milieu (baobab, manguier, fromager, mil, arachide), nommer les parties d'une plante (racine, tige, feuille, fleur, fruit).",
      },
      {
        key: "sc-ci-hygiene",
        name: "Mon corps et la propreté",
        description:
          "Vivre dans son milieu, étape 1 : les parties du corps ; l'hygiène (se laver les mains avec du savon avant de manger et après les toilettes, se brosser les dents, se laver, couper ses ongles) ; les aliments qui rendent malade (fruits non lavés, nourriture laissée découverte).",
      },
      {
        key: "sc-ci-outils",
        name: "Les outils de la maison et de l'école",
        description:
          "IST, étape 1 : outils et objets techniques (ciseaux, marteau, pilon et mortier, balai, seau, arrosoir) : à quoi ils servent, comment s'en servir sans se blesser, ranger et entretenir son matériel.",
      },
    ],
    CP: [
      {
        key: "sc-cp-matiere",
        name: "Solide, liquide ou gaz ?",
        description:
          "IST, étape 1 : les états de la matière. L'eau liquide, la glace solide, la vapeur ; le sable, la pierre, l'air ; ce qui coule et ce qui garde sa forme.",
      },
      {
        key: "sc-cp-grandir",
        name: "Les êtres vivants grandissent",
        description:
          "IST, étape 1 : les étapes du développement. L'œuf, le poussin, la poule ; la graine, la jeune plante, la plante ; le bébé, l'enfant, l'adulte, le vieillard. Remettre les étapes dans l'ordre.",
      },
      {
        key: "sc-cp-manger",
        name: "Bien manger",
        description:
          "Vivre dans son milieu, étape 1 : les aliments utiles (fruits, légumes, poisson, mil, lait caillé, niébé) et les aliments nuisibles (trop de sucre, aliments avariés ou mal conservés) ; manger propre.",
      },
      {
        key: "sc-cp-maladies",
        name: "Les maladies du milieu",
        description:
          "Vivre dans son milieu, étape 1 : le paludisme (transmis par le moustique, dormir sous une moustiquaire), la diarrhée (eau sale, mains sales), comment s'en protéger, aller au dispensaire.",
      },
      {
        key: "sc-cp-nature",
        name: "Protéger la nature",
        description:
          "Vivre dans son milieu, étape 1 : protéger les plantes et les animaux, ne pas jeter les sachets plastiques, garder la cour et le quartier propres, planter et arroser un arbre ; ce qui abîme l'environnement et comment le réparer.",
      },
    ],
    CE1: [
      {
        key: "sc-ce1-nutrition",
        name: "Comment se nourrissent les êtres vivants",
        description:
          "IST, étape 2, paliers 1-2 : la nutrition. Herbivores, carnivores, omnivores ; une chaîne alimentaire simple (herbe → mouton → lion) ; les besoins des plantes (eau, lumière, sol).",
      },
      {
        key: "sc-ce1-respiration",
        name: "La respiration",
        description:
          "IST, étape 2, paliers 1-2 : la respiration. L'homme respire avec ses poumons (par le nez et la bouche), le poisson avec ses branchies ; air pur et air pollué (fumée, poussière).",
      },
      {
        key: "sc-ce1-substances",
        name: "Les substances autour de nous",
        description:
          "IST, étape 2, paliers 1-2 : substances physiques et chimiques. Le sel et le sucre se dissolvent dans l'eau, le sable non ; mélanger, filtrer, laisser reposer (décanter).",
      },
      {
        key: "sc-ce1-eau",
        name: "L'eau potable",
        description:
          "Vivre dans son milieu, étape 2, paliers 1-2 : d'où vient l'eau (robinet, puits, forage, fleuve), comment la rendre potable (la faire bouillir, la filtrer, quelques gouttes d'eau de javel), la conserver dans un récipient propre et couvert.",
      },
      {
        key: "sc-ce1-paludisme",
        name: "Les parasites et le paludisme",
        description:
          "Vivre dans son milieu, étape 2, paliers 1-2 : les vers intestinaux (mains sales, aliments mal lavés) ; le paludisme, transmis par la piqûre du moustique anophèle ; se protéger (moustiquaire imprégnée, supprimer les eaux stagnantes) ; aller au dispensaire en cas de fièvre.",
      },
      {
        key: "sc-ce1-objets",
        name: "Les objets techniques simples",
        description:
          "IST, étape 2, paliers 1-2 : objets technologiques simples (lampe torche, ciseaux, robinet, cadenas) : à quoi ils servent, comment ils fonctionnent, comment les entretenir ; prendre soin de l'environnement de l'école.",
      },
    ],
    CE2: [
      {
        key: "sc-ce2-corps",
        name: "Le corps humain",
        description:
          "IST, étape 2, paliers 3-4 : aspects biologiques de l'homme. Le squelette (crâne, colonne vertébrale, côtes), les muscles, les cinq sens et leurs organes.",
      },
      {
        key: "sc-ce2-plantes",
        name: "La vie des plantes",
        description:
          "IST, étape 2, paliers 3-4 : la germination de la graine (eau, chaleur, air), la croissance, la fleur qui devient fruit, le fruit qui porte les graines (mangue, arachide, mil).",
      },
      {
        key: "sc-ce2-animaux",
        name: "La vie des animaux",
        description:
          "IST, étape 2, paliers 3-4 : la reproduction des animaux, ovipares (poule, tortue, poisson) et vivipares (chèvre, chat, homme) ; le cycle de vie de la grenouille et du papillon.",
      },
      {
        key: "sc-ce2-electricite",
        name: "Le circuit électrique",
        description:
          "IST, étape 2, paliers 3-4 : le circuit électrique simple (pile, ampoule, fils, interrupteur) ; circuit ouvert et fermé ; conducteurs (métaux) et isolants (plastique, bois) ; les dangers de l'électricité.",
      },
      {
        key: "sc-ce2-sante",
        name: "Se protéger des maladies",
        description:
          "Vivre dans son milieu, étape 2, paliers 3-4 : se protéger du paludisme ; le VIH/SIDA expliqué simplement à un enfant de 8 ans : ne pas toucher le sang d'une autre personne, ne pas partager une lame ou une seringue ; on ne l'attrape pas en jouant, en mangeant ou en se donnant la main.",
      },
      {
        key: "sc-ce2-environnement",
        name: "L'environnement et la population",
        description:
          "Vivre dans son milieu, étape 2, paliers 3-4 : les problèmes d'environnement du milieu (déchets, sachets plastiques, coupe des arbres, feux de brousse) et ceux liés à la population (quartiers trop peuplés, manque d'eau) ; les solutions.",
      },
    ],
    CM1: [
      {
        key: "sc-cm1-digestion",
        name: "La digestion",
        description:
          "IST, étape 3, paliers 1-2 : l'appareil digestif (bouche, œsophage, estomac, intestins), le trajet des aliments, bien mâcher, l'hygiène de la bouche.",
      },
      {
        key: "sc-cm1-respiration",
        name: "La respiration et ses maladies",
        description:
          "IST, étape 3, paliers 1-2 : le trajet de l'air (nez, trachée, bronches, poumons), l'inspiration et l'expiration ; les maladies respiratoires (rhume, toux, asthme, tuberculose) et leur prévention (fumée, poussière, aérer la maison).",
      },
      {
        key: "sc-cm1-circulation",
        name: "Le cœur et le sang",
        description:
          "IST, étape 3, paliers 1-2 : la circulation sanguine. Le cœur pompe le sang, les artères et les veines, le pouls ; le sang transporte l'oxygène et les aliments dans tout le corps.",
      },
      {
        key: "sc-cm1-phenomenes",
        name: "Phénomènes physiques et chimiques",
        description:
          "IST, étape 3, paliers 1-2 : l'évaporation, la condensation, la fusion et la solidification ; la combustion (le feu a besoin d'air) ; la rouille.",
      },
      {
        key: "sc-cm1-objets",
        name: "Démonter et assembler un objet",
        description:
          "IST, étape 3, paliers 1-2 : objets techniques (vélo, lampe torche, robinet) : leurs pièces, le rôle de chacune, l'ordre du démontage et du montage, l'entretien.",
      },
      {
        key: "sc-cm1-hygiene",
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
