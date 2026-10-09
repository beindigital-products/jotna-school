/**
 * INSTRUCTION CIVIQUE — Domaine 3 du CEB (ESVS), activité « Vivre ensemble »
 * de l'Éducation au développement durable (rubriques Genre ; Paix,
 * citoyenneté et droits humains).
 *
 * À l'étape 1, le guide programme « à la fois au CI et au CP les mêmes
 * objectifs et les mêmes contenus » : le CP les reprend en consolidation.
 * La rubrique Éducation religieuse du même schéma n'est pas traitée : elle
 * relève de chaque famille et de chaque école.
 */
import type { ProgrammeSubject } from "./types";

export const INSTRUCTION_CIVIQUE: ProgrammeSubject = {
  key: "instruction-civique",
  name: "Instruction civique",
  aliases: ["EMC", "Éducation civique", "Education civique", "Vivre ensemble", "Instruction civique et morale"],
  icon: "Users",
  color: "#6366f1",
  order: 6,
  domain: "Éducation à la science et à la vie sociale",
  classes: {
    CI: [
      {
        key: "ci-ci-politesse",
        name: "Bonjour, merci, pardon",
        description:
          "Vivre ensemble, étape 1 : le respect de soi et des autres. Saluer, remercier, s'excuser, respecter les grandes personnes, se tenir propre, prendre soin de ses affaires.",
      },
      {
        key: "ci-ci-ecole",
        name: "À l'école chaque jour",
        description:
          "Vivre ensemble, étape 1 : l'assiduité et la ponctualité, le règlement de l'école, prendre soin du matériel commun.",
      },
      {
        key: "ci-ci-entraide",
        name: "On s'entraide",
        description:
          "Vivre ensemble, étape 1 : l'entraide et le partage, aider un camarade, filles et garçons qui jouent et travaillent ensemble.",
      },
      {
        key: "ci-ci-route",
        name: "Traverser la rue",
        description:
          "Vivre ensemble, étape 1 : le code de la route. Le feu rouge et le feu vert, le passage pour piétons, regarder à gauche puis à droite, marcher sur le trottoir ou le bord de la route, ne pas jouer sur la route.",
      },
    ],
    CP: [
      {
        key: "ci-cp-reglement",
        name: "Le règlement de la classe",
        description:
          "Vivre ensemble, étape 1 (consolidation) : les règles de vie de la classe, les droits et les devoirs de l'élève, réparer une faute.",
      },
      {
        key: "ci-cp-responsabilites",
        name: "Mes responsabilités en classe",
        description:
          "Vivre ensemble, étape 1 : participer aux responsabilités de la classe et de l'école : chef de classe, responsable de la propreté, du matériel, du lever des couleurs.",
      },
      {
        key: "ci-cp-genre",
        name: "Filles et garçons, tous égaux",
        description:
          "Vivre ensemble, étape 1, rubrique Genre : filles et garçons ont les mêmes droits à l'école, au jeu et à la maison ; partager les tâches.",
      },
      {
        key: "ci-cp-route",
        name: "La sécurité sur la route",
        description:
          "Vivre ensemble, étape 1 : le code de la route en consolidation. Les panneaux simples (stop, passage pour piétons, sens interdit), la ceinture de sécurité, le casque à moto, monter et descendre d'un car sans danger.",
      },
      {
        key: "ci-cp-paix",
        name: "Régler un conflit sans se battre",
        description:
          "Vivre ensemble, étape 1, rubrique Paix : parler au lieu de frapper, demander l'aide d'un adulte, se réconcilier, ne pas se moquer.",
      },
    ],
    CE1: [
      {
        key: "ci-ce1-nation",
        name: "Les symboles de la Nation",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : les symboles de la Nation. Le drapeau vert, or et rouge, avec une étoile verte à cinq branches au centre ; la devise « Un Peuple – Un But – Une Foi » ; l'hymne national, « Le Lion rouge », dont les paroles sont de Léopold Sédar Senghor ; le lion et le baobab des armoiries. Ne citer aucune autre parole de l'hymne que son titre.",
      },
      {
        key: "ci-ce1-civisme",
        name: "Le civisme",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : respecter le bien public (l'école, la rue, les arbres, les bornes-fontaines), ne pas gaspiller l'eau ni l'électricité, garder la rue propre.",
      },
      {
        key: "ci-ce1-autorites",
        name: "Respecter les autorités",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : le maire, le chef de village, le directeur d'école ; les forces de l'ordre et de secours (policier, gendarme, sapeur-pompier) et ce qu'elles font pour nous.",
      },
      {
        key: "ci-ce1-diversite",
        name: "Nos différences, notre richesse",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : le respect des différences et de la diversité (langues, ethnies, religions, handicap) ; le cousinage à plaisanterie, qui rapproche les familles par le rire.",
      },
    ],
    CE2: [
      {
        key: "ci-ce2-droits",
        name: "Mes droits et mes devoirs",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : les droits de l'enfant (avoir un nom, aller à l'école, être soigné, être protégé, jouer) et ses devoirs (respecter les autres, travailler à l'école, aider à la maison).",
      },
      {
        key: "ci-ce2-paix",
        name: "Vivre en paix",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : les idéaux de paix : dialogue, tolérance, médiation ; refuser la violence et les moqueries.",
      },
      {
        key: "ci-ce2-valeurs",
        name: "Les bonnes valeurs",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : valeurs et comportements positifs : l'honnêteté, la solidarité, le courage, le respect de la parole donnée, l'hospitalité (la teranga), à l'école et à la maison.",
      },
      {
        key: "ci-ce2-communaute",
        name: "La vie en communauté",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : devoirs et droits dans la vie en commun : les règles du quartier, les biens communs (le puits, le marché, le terrain de sport), s'entraider entre voisins.",
      },
    ],
    CM1: [
      {
        key: "ci-cm1-dialogue",
        name: "Prévenir les conflits par le dialogue",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les différences et les problèmes d'appartenance (quartier, groupe, équipe), la prévention des conflits par le dialogue, la médiation et le compromis.",
      },
      {
        key: "ci-cm1-ecole",
        name: "La coopérative et le gouvernement scolaire",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les organisations scolaires et parascolaires : la coopérative scolaire, le parlement et le gouvernement scolaire, le comité de gestion de l'école ; leurs rôles, les élections, les réunions.",
      },
      {
        key: "ci-cm1-commune",
        name: "La commune et l'État",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les institutions décentralisées (la commune et le département, le maire, le conseil municipal, le conseil départemental) et déconcentrées (le gouverneur de région, le préfet de département, le sous-préfet d'arrondissement).",
      },
      {
        key: "ci-cm1-associations",
        name: "Les organisations de mon quartier",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les organisations locales : associations sportives et culturelles (ASC), groupements de femmes, comités de quartier, associations de parents d'élèves ; à quoi elles servent.",
      },
    ],
    CM2: [
      {
        key: "ci-cm2-republique",
        name: "La République du Sénégal",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : les attributs de la souveraineté : la République, la Constitution, le drapeau, le sceau, la devise « Un Peuple – Un But – Une Foi », l'hymne national.",
      },
      {
        key: "ci-cm2-institutions",
        name: "Les institutions de la République",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : le Président de la République, élu au suffrage universel ; le Gouvernement (le Premier ministre et les ministres) ; l'Assemblée nationale, dont les députés votent les lois ; les cours et tribunaux, qui rendent la justice.",
      },
      {
        key: "ci-cm2-afrique",
        name: "Les organisations africaines",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : la CEDEAO et l'UEMOA (coopération entre pays d'Afrique de l'Ouest), l'OMVS (fleuve Sénégal), l'OMVG (fleuve Gambie), le CILSS (lutte contre la sécheresse), la BCEAO (banque centrale, siège à Dakar), la BOAD, l'Union africaine (siège à Addis-Abeba), la BAD, la CAF (football) : à quoi elles servent.",
      },
      {
        key: "ci-cm2-monde",
        name: "Les organisations internationales",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : l'ONU et ses agences (UNICEF pour les enfants, UNESCO pour l'éducation et la culture, FAO pour l'alimentation, OMS pour la santé, HCR pour les réfugiés, OIT pour le travail, FNUAP pour la population, OMC pour le commerce) ; le CICR (Croix-Rouge), la FIFA, le CIO (Jeux olympiques ; Dakar accueille les Jeux olympiques de la jeunesse en 2026), la Fédération mondiale des villes jumelées.",
      },
    ],
  },
};
