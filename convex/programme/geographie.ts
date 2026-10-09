/**
 * GÉOGRAPHIE — Domaine 3 du CEB (ESVS), sous-domaine Découverte du monde.
 *
 * Progression du guide : se repérer dans l'espace proche (CI-CP), orientation,
 * climat, relief et monographie régionale (CE1-CE2), le Sénégal, ses
 * ressources, ses activités et sa population (CM1-CM2). Niveaux 1 et 2
 * répartis comme pour les autres activités d'ESVS (voir `sciences.ts`).
 */
import type { ProgrammeSubject } from "./types";

export const GEOGRAPHIE: ProgrammeSubject = {
  key: "geographie",
  name: "Géographie",
  aliases: ["Geographie"],
  icon: "Globe",
  color: "#0ea5e9",
  order: 5,
  domain: "Éducation à la science et à la vie sociale",
  classes: {
    CI: [
      {
        key: "ge-ci-position",
        name: "Devant, derrière, à côté",
        description:
          "Géographie, étape 1 : la topologie. Devant, derrière, à côté de, entre, sur, sous, dans, près, loin, en se repérant par rapport à soi et aux objets de la classe.",
      },
      {
        key: "ge-ci-lateralite",
        name: "Ma droite et ma gauche",
        description:
          "Géographie, étape 1 : la latéralisation. La main droite, la main gauche, à droite de, à gauche de ; tourner à droite, tourner à gauche.",
      },
      {
        key: "ge-ci-reperes",
        name: "Les repères de mon école",
        description:
          "Géographie, étape 1 : les repères fixes (le baobab de la cour, le portail, la mosquée, le marché) et les repères mobiles (une voiture, un âne, une charrette) ; savoir lesquels permettent de retrouver son chemin.",
      },
      {
        key: "ge-ci-quadrillage",
        name: "Se repérer sur un quadrillage",
        description:
          "Géographie, étape 1 : repérer une case sur un quadrillage (ligne et colonne), déplacer un pion vers le haut, le bas, la gauche ou la droite, reproduire un dessin case par case.",
        games: [{ kind: "pixel-copie", count: 3 }],
      },
    ],
    CP: [
      {
        key: "ge-cp-itineraire",
        name: "Le chemin de l'école",
        description:
          "Géographie, étape 1 : les itinéraires. Décrire un trajet (je sors, je tourne à droite, je passe devant la boutique), suivre un itinéraire sur un dessin, remettre les étapes d'un trajet dans l'ordre.",
      },
      {
        key: "ge-cp-distances",
        name: "Près ou loin ?",
        description:
          "Géographie, étape 1 : les distances. Comparer des distances, mesurer avec des pas ou avec l'empan (mesures non conventionnelles), trouver le chemin le plus court.",
      },
      {
        key: "ge-cp-plan",
        name: "Vu de dessus",
        description:
          "Géographie, étape 1 : représenter un espace vu de dessus (une table, la classe), retrouver un objet sur un dessin vu de dessus.",
      },
      {
        key: "ge-cp-quartier",
        name: "Se repérer dans le quartier",
        description:
          "Géographie, étape 1 : repères fixes et mobiles du quartier ou du village ; dire où se trouve un lieu par rapport à un repère (la boutique est à côté de la mosquée, l'école est derrière le terrain de football).",
      },
    ],
    CE1: [
      {
        key: "ge-ce1-orientation",
        name: "Les points cardinaux",
        description:
          "Géographie, étape 2, paliers 1-2 : l'orientation. Le nord, le sud, l'est et l'ouest ; le soleil se lève à l'est et se couche à l'ouest ; la boussole ; l'orientation de la classe et de l'école.",
      },
      {
        key: "ge-ce1-saisons",
        name: "Le climat et les saisons",
        description:
          "Géographie, étape 2, paliers 1-2 : le climat et les saisons du Sénégal. La saison sèche (à peu près de novembre à juin) et la saison des pluies ou hivernage (à peu près de juillet à octobre) ; l'harmattan, vent chaud et sec ; il pleut plus au sud qu'au nord.",
      },
      {
        key: "ge-ce1-eau-relief",
        name: "Le relief et les cours d'eau",
        description:
          "Géographie, étape 2, paliers 1-2 : un pays surtout plat, avec des collines au sud-est (région de Kédougou) ; les fleuves Sénégal, Gambie et Casamance, le Saloum ; les lacs (lac de Guiers, lac Rose), les mares, les puits et les points d'eau du milieu.",
      },
      {
        key: "ge-ce1-plan",
        name: "Le plan de la classe et de l'école",
        description:
          "Géographie, étape 2, paliers 1-2 : représenter la classe, l'école ou la maison sur un plan, avec une légende simple ; retrouver un lieu sur un plan.",
      },
    ],
    CE2: [
      {
        key: "ge-ce2-carte",
        name: "Lire une carte",
        description:
          "Géographie, étape 2, paliers 3-4 : le plan et la carte, la légende, l'orientation (le nord en haut de la carte), l'échelle expliquée simplement.",
      },
      {
        key: "ge-ce2-regions",
        name: "Ma région et les régions du Sénégal",
        description:
          "Géographie, étape 2, paliers 3-4 : la monographie régionale. Les 14 régions du Sénégal et leurs chefs-lieux, qui portent le même nom (Dakar, Thiès, Diourbel, Fatick, Kaolack, Kaffrine, Kolda, Kédougou, Louga, Matam, Saint-Louis, Sédhiou, Tambacounda, Ziguinchor) ; les caractéristiques physiques et humaines de sa région.",
      },
      {
        key: "ge-ce2-activites",
        name: "Les activités des hommes",
        description:
          "Géographie, étape 2, paliers 3-4 : l'agriculture (arachide, mil, riz, maraîchage dans les Niayes), l'élevage (bœufs, moutons, chèvres), la pêche (les pirogues de Kayar, Joal, Mbour), le tourisme (Saly, le Cap Skirring, Saint-Louis).",
      },
      {
        key: "ge-ce2-habitat",
        name: "L'habitat et les déplacements",
        description:
          "Géographie, étape 2, paliers 3-4 : l'habitat rural et urbain, ses matériaux ; les voies et moyens de communication (routes, chemin de fer, ports, aéroports) ; les mouvements de population (exode rural, départs pendant la saison sèche).",
      },
    ],
    CM1: [
      {
        key: "ge-cm1-situation",
        name: "Le Sénégal en Afrique de l'Ouest",
        description:
          "Géographie, étape 3, paliers 1-2 : la situation du Sénégal, à l'ouest de l'Afrique, au bord de l'océan Atlantique ; ses voisins (Mauritanie, Mali, Guinée, Guinée-Bissau, et la Gambie enclavée dans le pays) ; la presqu'île du Cap-Vert, où se trouve Dakar ; un relief surtout plat.",
      },
      {
        key: "ge-cm1-climats",
        name: "Climats et végétation",
        description:
          "Géographie, étape 3, paliers 1-2 : les caractéristiques physiques du milieu. Climat sahélien au nord, soudanien au centre, guinéen au sud ; steppe, savane et forêt ; les pluies plus abondantes au sud.",
      },
      {
        key: "ge-cm1-decoupage",
        name: "Le découpage administratif",
        description:
          "Géographie, étape 3, paliers 1-2 : régions, départements, arrondissements et communes ; Dakar, la capitale ; qui dirige quoi (gouverneur de région, préfet de département, sous-préfet d'arrondissement, maire de commune).",
      },
      {
        key: "ge-cm1-economie",
        name: "Ressources et activités économiques",
        description:
          "Géographie, étape 3, paliers 1-2 : les ressources du milieu et les activités économiques : agriculture, élevage, pêche, mines (phosphates, or), industrie, commerce, artisanat.",
      },
      {
        key: "ge-cm1-communication",
        name: "Les voies de communication",
        description:
          "Géographie, étape 3, paliers 1-2 : routes et autoroutes, chemin de fer et TER, le port de Dakar, l'aéroport international Blaise-Diagne ; les moyens de communication (radio, télévision, téléphone, Internet).",
      },
    ],
    CM2: [
      {
        key: "ge-cm2-milieu-activites",
        name: "Le milieu et les activités",
        description:
          "Géographie, étape 3, paliers 3-4 : les liens entre le milieu, ses ressources et les activités : la vallée du fleuve Sénégal et le riz, le bassin arachidier (Kaolack, Kaffrine, Diourbel, Fatick), la côte et la pêche, le Ferlo et l'élevage, la Casamance et les fruits.",
      },
      {
        key: "ge-cm2-degradation",
        name: "Protéger nos ressources",
        description:
          "Géographie, étape 3, paliers 3-4 : la dégradation des ressources (déforestation, feux de brousse, surpêche, érosion côtière, avancée du désert) et les réponses (reboisement, Grande Muraille verte, aires marines protégées).",
      },
      {
        key: "ge-cm2-population",
        name: "La population du Sénégal",
        description:
          "Géographie, étape 3, paliers 3-4 : environ 18 millions d'habitants (recensement de 2023) ; une population jeune (pyramide des âges large à la base) ; une répartition inégale (forte densité à Dakar et sur la côte) ; la diversité des groupes et des langues nationales (wolof, pulaar, sérère, diola, mandingue, soninké…).",
      },
      {
        key: "ge-cm2-villes",
        name: "Villes et campagnes",
        description:
          "Géographie, étape 3, paliers 3-4 : les types d'habitat, la croissance des villes, l'exode rural et ses conséquences, la vie à la ville et à la campagne.",
      },
    ],
  },
};
