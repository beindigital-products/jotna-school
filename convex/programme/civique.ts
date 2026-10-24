/**
 * INSTRUCTION CIVIQUE — Domaine 3 du CEB (ESVS), activité « Vivre ensemble »
 * de l'Éducation au développement durable (rubriques Genre ; Paix,
 * citoyenneté et droits humains).
 *
 * À l'étape 1, le guide programme « à la fois au CI et au CP les mêmes
 * objectifs et les mêmes contenus » : le CP les reprend en consolidation.
 * La rubrique Éducation religieuse du même schéma n'est pas traitée : elle
 * relève de chaque famille et de chaque école.
 *
 * Au CI, les quatre thématiques sont fabriquées par le code, sans le modèle : `paliers/games/civique.ts` (une
 * situation, le bon geste et les gestes à éviter) et, pour saluer, remercier et s'excuser, les gabarits de la
 * politesse de `paliers/games/politesse.ts`. Le modèle écrivait des ordres sans ordre, des cases abstraites
 * (« Assiduité », « Non aide ») et un ordre de traversée qui regardait le feu après avoir regardé la route.
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
        games: [
          // Saluer, remercier, s'excuser : les gabarits de la politesse du français, déjà vérifiés pour le CI.
          { kind: "politesse-situation", count: 1 },
          { kind: "politesse-relier", count: 1 },
          { kind: "politesse-trou", count: 1 },
          { kind: "civ-situation", count: 2, vocabulary: "politesse" },
          { kind: "civ-glisser", count: 2, vocabulary: "politesse" },
          { kind: "civ-intrus", count: 1, vocabulary: "politesse" },
          { kind: "civ-relier", count: 1, vocabulary: "politesse" },
          { kind: "civ-ordre", count: 1, vocabulary: "politesse" },
        ],
        byLevel: true,
      },
      {
        key: "ci-ci-ecole",
        name: "À l'école chaque jour",
        description:
          "Vivre ensemble, étape 1 : l'assiduité et la ponctualité, le règlement de l'école, prendre soin du matériel commun.",
        games: [
          { kind: "civ-situation", count: 2, vocabulary: "ecole" },
          { kind: "civ-glisser", count: 3, vocabulary: "ecole" },
          { kind: "civ-intrus", count: 1, vocabulary: "ecole" },
          { kind: "civ-relier", count: 1, vocabulary: "ecole" },
          { kind: "civ-ordre", count: 1, vocabulary: "ecole" },
          { kind: "civ-trou", count: 2, vocabulary: "ecole" },
        ],
        byLevel: true,
      },
      {
        key: "ci-ci-entraide",
        name: "On s'entraide",
        description:
          "Vivre ensemble, étape 1 : l'entraide et le partage, aider un camarade, filles et garçons qui jouent et travaillent ensemble.",
        games: [
          { kind: "civ-situation", count: 3, vocabulary: "entraide" },
          { kind: "civ-glisser", count: 2, vocabulary: "entraide" },
          { kind: "civ-intrus", count: 1, vocabulary: "entraide" },
          { kind: "civ-relier", count: 1, vocabulary: "entraide" },
          { kind: "civ-ordre", count: 2, vocabulary: "entraide" },
          { kind: "civ-trou", count: 1, vocabulary: "entraide" },
        ],
        byLevel: true,
      },
      {
        key: "ci-ci-route",
        name: "Traverser la rue",
        description:
          "Vivre ensemble, étape 1 : le code de la route. Le feu rouge et le feu vert, le passage pour piétons, regarder à gauche puis à droite, marcher sur le trottoir ou le bord de la route, ne pas jouer sur la route.",
        games: [
          { kind: "civ-situation", count: 3, vocabulary: "route" },
          { kind: "civ-glisser", count: 2, vocabulary: "route" },
          { kind: "civ-intrus", count: 1, vocabulary: "route" },
          { kind: "civ-relier", count: 2, vocabulary: "route" },
          { kind: "civ-ordre", count: 1, vocabulary: "route" },
          { kind: "civ-trou", count: 1, vocabulary: "route" },
        ],
        byLevel: true,
      },
    ],
    CP: [
      {
        key: "ci-cp-reglement",
        name: "Le règlement de la classe",
        description:
          "Vivre ensemble, étape 1 (consolidation) : les règles de vie de la classe, les droits et les devoirs de l'élève, réparer une faute.",
        games: [
          { kind: "geste-situation", count: 2, vocabulary: "reglement" },
          { kind: "droit-devoir", count: 1, vocabulary: "reglement" },
          { kind: "geste-glisser", count: 1, vocabulary: "reglement" },
          { kind: "geste-intrus", count: 1, vocabulary: "reglement" },
          { kind: "geste-relier", count: 1, vocabulary: "reglement" },
          { kind: "geste-ordre", count: 2, vocabulary: "reglement" },
          { kind: "geste-trou", count: 2, vocabulary: "reglement" },
        ],
      },
      {
        key: "ci-cp-responsabilites",
        name: "Mes responsabilités en classe",
        description:
          "Vivre ensemble, étape 1 : participer aux responsabilités de la classe et de l'école : chef de classe, responsable de la propreté, du matériel, du lever des couleurs.",
        games: [
          { kind: "geste-situation", count: 2, vocabulary: "responsabilites" },
          { kind: "role-qui", count: 2, vocabulary: "responsabilites" },
          { kind: "role-relier", count: 1, vocabulary: "responsabilites" },
          { kind: "geste-glisser", count: 1, vocabulary: "responsabilites" },
          { kind: "geste-intrus", count: 1, vocabulary: "responsabilites" },
          { kind: "geste-ordre", count: 1, vocabulary: "responsabilites" },
          { kind: "geste-trou", count: 2, vocabulary: "responsabilites" },
        ],
      },
      {
        key: "ci-cp-genre",
        name: "Filles et garçons, tous égaux",
        description:
          "Vivre ensemble, étape 1, rubrique Genre : filles et garçons ont les mêmes droits à l'école, au jeu et à la maison ; partager les tâches.",
        games: [
          { kind: "geste-situation", count: 3, vocabulary: "genre" },
          { kind: "geste-glisser", count: 1, vocabulary: "genre" },
          { kind: "geste-intrus", count: 1, vocabulary: "genre" },
          { kind: "geste-relier", count: 1, vocabulary: "genre" },
          { kind: "geste-ordre", count: 2, vocabulary: "genre" },
          { kind: "geste-trou", count: 2, vocabulary: "genre" },
        ],
      },
      {
        key: "ci-cp-route",
        name: "La sécurité sur la route",
        description:
          "Vivre ensemble, étape 1 : le code de la route en consolidation. Les panneaux simples (stop, passage pour piétons, sens interdit), la ceinture de sécurité, le casque à moto, monter et descendre d'un car sans danger.",
        games: [
          { kind: "geste-situation", count: 2, vocabulary: "route" },
          { kind: "geste-glisser", count: 1, vocabulary: "route" },
          { kind: "geste-intrus", count: 1, vocabulary: "route" },
          { kind: "geste-relier", count: 1, vocabulary: "route" },
          { kind: "geste-ordre", count: 1, vocabulary: "route" },
          { kind: "geste-trou", count: 2, vocabulary: "route" },
          { kind: "panneau-qcm", count: 1, vocabulary: "route" },
          { kind: "route-ecrire", count: 1, vocabulary: "route" },
        ],
      },
      {
        key: "ci-cp-paix",
        name: "Régler un conflit sans se battre",
        description:
          "Vivre ensemble, étape 1, rubrique Paix : parler au lieu de frapper, demander l'aide d'un adulte, se réconcilier, ne pas se moquer.",
        games: [
          { kind: "geste-situation", count: 3, vocabulary: "paix" },
          { kind: "geste-glisser", count: 1, vocabulary: "paix" },
          { kind: "geste-intrus", count: 1, vocabulary: "paix" },
          { kind: "geste-relier", count: 1, vocabulary: "paix" },
          { kind: "geste-ordre", count: 2, vocabulary: "paix" },
          { kind: "geste-trou", count: 2, vocabulary: "paix" },
        ],
      },
    ],
    CE1: [
      {
        key: "ci-ce1-nation",
        name: "Les symboles de la Nation",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : les symboles de la Nation. Le drapeau vert, or et rouge, avec une étoile verte à cinq branches au centre ; la devise « Un Peuple – Un But – Une Foi » ; l'hymne national, « Le Lion rouge », dont les paroles sont de Léopold Sédar Senghor ; le lion et le baobab des armoiries. Ne citer aucune autre parole de l'hymne que son titre.",
        // Dix gabarits (`ce1Civique.ts`) : un fait sur le drapeau, la devise, l'hymne ou les armoiries (trois fois), quel symbole est décrit, ranger ce qui est sur le drapeau ou sur les armoiries, ranger les couleurs ou la devise, relier, une phrase à trou (deux fois), un mot ou un nombre à écrire.
        games: [
          { kind: "ce1-symbole-qcm", count: 3 },
          { kind: "ce1-symbole-nom", count: 1 },
          { kind: "ce1-symbole-glisser", count: 1 },
          { kind: "ce1-symbole-ordre", count: 1 },
          { kind: "ce1-symbole-relier", count: 1 },
          { kind: "ce1-symbole-trou", count: 2 },
          { kind: "ce1-symbole-ecrire", count: 1 },
        ],
      },
      {
        key: "ci-ce1-civisme",
        name: "Le civisme",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : respecter le bien public (l'école, la rue, les arbres, les bornes-fontaines), ne pas gaspiller l'eau ni l'électricité, garder la rue propre.",
        // Dix gabarits (`ce1Civique.ts`) : le bon geste d'élève devant une scène (trois fois), pourquoi prendre soin du bien commun, ranger les gestes qui protègent ou abîment, relier un bien commun à un bon geste, ranger les gestes d'un bon geste, une phrase à trou (deux fois), un mot à écrire.
        games: [
          { kind: "ce1-civisme-situation", count: 3 },
          { kind: "ce1-civisme-pourquoi", count: 1 },
          { kind: "ce1-civisme-glisser", count: 1 },
          { kind: "ce1-civisme-relier", count: 1 },
          { kind: "ce1-civisme-ordre", count: 1 },
          { kind: "ce1-civisme-trou", count: 2 },
          { kind: "ce1-civisme-ecrire", count: 1 },
        ],
      },
      {
        key: "ci-ce1-autorites",
        name: "Respecter les autorités",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : le maire, le chef de village, le directeur d'école ; les forces de l'ordre et de secours (policier, gendarme, sapeur-pompier) et ce qu'elles font pour nous.",
        // Dix gabarits (`ce1Civique.ts`) : qui a quel rôle (trois fois), ce que fait une autorité, ranger ceux qui dirigent et ceux qui protègent, relier, ranger ce qui se passe quand les secours viennent, une phrase à trou (deux fois), un mot à écrire.
        games: [
          { kind: "ce1-autorite-qui", count: 3 },
          { kind: "ce1-autorite-role", count: 1 },
          { kind: "ce1-autorite-glisser", count: 1 },
          { kind: "ce1-autorite-relier", count: 1 },
          { kind: "ce1-autorite-ordre", count: 1 },
          { kind: "ce1-autorite-trou", count: 2 },
          { kind: "ce1-autorite-ecrire", count: 1 },
        ],
      },
      {
        key: "ci-ce1-diversite",
        name: "Nos différences, notre richesse",
        description:
          "Vivre ensemble, étape 2, paliers 1-2 : le respect des différences et de la diversité (langues, ethnies, religions, handicap) ; le cousinage à plaisanterie, qui rapproche les familles par le rire.",
        // Dix gabarits (`ce1Civique.ts`) : le geste qui respecte les différences (trois fois), les mots des différences, ranger les gestes qui respectent ou non, relier, ranger les gestes d'un bon accueil, une phrase à trou (deux fois), un mot à écrire.
        games: [
          { kind: "ce1-diff-situation", count: 3 },
          { kind: "ce1-diff-mot", count: 1 },
          { kind: "ce1-diff-glisser", count: 1 },
          { kind: "ce1-diff-relier", count: 1 },
          { kind: "ce1-diff-ordre", count: 1 },
          { kind: "ce1-diff-trou", count: 2 },
          { kind: "ce1-diff-ecrire", count: 1 },
        ],
      },
    ],
    CE2: [
      {
        key: "ci-ce2-droits",
        name: "Mes droits et mes devoirs",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : les droits de l'enfant (avoir un nom, aller à l'école, être soigné, être protégé, jouer) et ses devoirs (respecter les autres, travailler à l'école, aider à la maison).",
        // Gabarits de `ce2Civique.ts`.
        games: [
          { kind: "ce2-droit-qcm", count: 2 },
          { kind: "ce2-devoir-qcm", count: 2 },
          { kind: "ce2-droit-glisser", count: 1 },
          { kind: "ce2-droit-relier", count: 1 },
          { kind: "ce2-droit-trou", count: 2 },
          { kind: "ce2-droit-ecrire", count: 2 },
        ],
      },
      {
        key: "ci-ce2-paix",
        name: "Vivre en paix",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : les idéaux de paix : dialogue, tolérance, médiation ; refuser la violence et les moqueries.",
        // Gabarits de `ce2Civique.ts`.
        games: [
          { kind: "ce2-paix-situation", count: 2 },
          { kind: "ce2-paix-mot", count: 1 },
          { kind: "ce2-paix-glisser", count: 1 },
          { kind: "ce2-paix-relier", count: 1 },
          { kind: "ce2-paix-ordre", count: 1 },
          { kind: "ce2-paix-trou", count: 2 },
          { kind: "ce2-paix-ecrire", count: 2 },
        ],
      },
      {
        key: "ci-ce2-valeurs",
        name: "Les bonnes valeurs",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : valeurs et comportements positifs : l'honnêteté, la solidarité, le courage, le respect de la parole donnée, l'hospitalité (la teranga), à l'école et à la maison.",
        // Gabarits de `ce2Civique.ts`.
        games: [
          { kind: "ce2-valeur-situation", count: 2 },
          { kind: "ce2-valeur-definition", count: 1 },
          { kind: "ce2-valeur-glisser", count: 1 },
          { kind: "ce2-valeur-relier", count: 1 },
          { kind: "ce2-valeur-ordre", count: 1 },
          { kind: "ce2-valeur-trou", count: 2 },
          { kind: "ce2-valeur-ecrire", count: 2 },
        ],
      },
      {
        key: "ci-ce2-communaute",
        name: "La vie en communauté",
        description:
          "Vivre ensemble, étape 2, paliers 3-4 : devoirs et droits dans la vie en commun : les règles du quartier, les biens communs (le puits, le marché, le terrain de sport), s'entraider entre voisins.",
        // Gabarits de `ce2Civique.ts`.
        games: [
          { kind: "ce2-commun-bien", count: 1 },
          { kind: "ce2-commun-regle", count: 1 },
          { kind: "ce2-commun-voisin", count: 1 },
          { kind: "ce2-commun-glisser", count: 1 },
          { kind: "ce2-commun-relier", count: 1 },
          { kind: "ce2-commun-ordre", count: 1 },
          { kind: "ce2-commun-trou", count: 2 },
          { kind: "ce2-commun-ecrire", count: 2 },
        ],
      },
    ],
    CM1: [
      {
        key: "ci-cm1-dialogue",
        games: [
          { kind: "cm1-dia-qcm", count: 3 },
          { kind: "cm1-dia-trou", count: 2 },
          { kind: "cm1-dia-ecrire", count: 1 },
          { kind: "cm1-dia-ordre", count: 1 },
          { kind: "cm1-dia-relier", count: 1 },
          { kind: "cm1-dia-glisser", count: 2 },
        ],
        name: "Prévenir les conflits par le dialogue",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les différences et les problèmes d'appartenance (quartier, groupe, équipe), la prévention des conflits par le dialogue, la médiation et le compromis.",
      },
      {
        key: "ci-cm1-ecole",
        games: [
          { kind: "cm1-sco-qcm", count: 3 },
          { kind: "cm1-sco-trou", count: 2 },
          { kind: "cm1-sco-ecrire", count: 1 },
          { kind: "cm1-sco-ordre", count: 1 },
          { kind: "cm1-sco-relier", count: 1 },
          { kind: "cm1-sco-glisser", count: 2 },
        ],
        name: "La coopérative et le gouvernement scolaire",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les organisations scolaires et parascolaires : la coopérative scolaire, le parlement et le gouvernement scolaire, le comité de gestion de l'école ; leurs rôles, les élections, les réunions.",
      },
      {
        key: "ci-cm1-commune",
        games: [
          { kind: "cm1-mun-qcm", count: 3 },
          { kind: "cm1-mun-trou", count: 2 },
          { kind: "cm1-mun-ecrire", count: 1 },
          { kind: "cm1-mun-ordre", count: 1 },
          { kind: "cm1-mun-relier", count: 1 },
          { kind: "cm1-mun-glisser", count: 2 },
        ],
        name: "La commune et l'État",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les institutions décentralisées (la commune et le département, le maire, le conseil municipal, le conseil départemental) et déconcentrées (le gouverneur de région, le préfet de département, le sous-préfet d'arrondissement).",
      },
      {
        key: "ci-cm1-associations",
        games: [
          { kind: "cm1-aso-qcm", count: 3 },
          { kind: "cm1-aso-trou", count: 2 },
          { kind: "cm1-aso-ecrire", count: 1 },
          { kind: "cm1-aso-ordre", count: 1 },
          { kind: "cm1-aso-relier", count: 1 },
          { kind: "cm1-aso-glisser", count: 2 },
        ],
        name: "Les organisations de mon quartier",
        description:
          "Vivre ensemble, étape 3, paliers 1-2 : les organisations locales : associations sportives et culturelles (ASC), groupements de femmes, comités de quartier, associations de parents d'élèves ; à quoi elles servent.",
      },
    ],
    CM2: [
      {
        key: "ci-cm2-republique",
        games: [
          { kind: "cm2-rep-qcm", count: 3 },
          { kind: "cm2-rep-trou", count: 2 },
          { kind: "cm2-rep-ecrire", count: 1 },
          { kind: "cm2-rep-ordre", count: 1 },
          { kind: "cm2-rep-relier", count: 1 },
          { kind: "cm2-rep-glisser", count: 2 },
        ],
        name: "La République du Sénégal",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : les attributs de la souveraineté : la République, la Constitution, le drapeau, le sceau, la devise « Un Peuple – Un But – Une Foi », l'hymne national.",
      },
      {
        key: "ci-cm2-institutions",
        games: [
          { kind: "cm2-ins-qcm", count: 3 },
          { kind: "cm2-ins-trou", count: 2 },
          { kind: "cm2-ins-ecrire", count: 1 },
          { kind: "cm2-ins-ordre", count: 1 },
          { kind: "cm2-ins-relier", count: 1 },
          { kind: "cm2-ins-glisser", count: 2 },
        ],
        name: "Les institutions de la République",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : le Président de la République, élu au suffrage universel ; le Gouvernement (le Premier ministre et les ministres) ; l'Assemblée nationale, dont les députés votent les lois ; les cours et tribunaux, qui rendent la justice.",
      },
      {
        key: "ci-cm2-afrique",
        games: [
          { kind: "cm2-afr-qcm", count: 3 },
          { kind: "cm2-afr-trou", count: 2 },
          { kind: "cm2-afr-ecrire", count: 1 },
          { kind: "cm2-afr-ordre", count: 1 },
          { kind: "cm2-afr-relier", count: 1 },
          { kind: "cm2-afr-glisser", count: 2 },
        ],
        name: "Les organisations africaines",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : la CEDEAO et l'UEMOA (coopération entre pays d'Afrique de l'Ouest), l'OMVS (fleuve Sénégal), l'OMVG (fleuve Gambie), le CILSS (lutte contre la sécheresse), la BCEAO (banque centrale, siège à Dakar), la BOAD, l'Union africaine (siège à Addis-Abeba), la BAD, la CAF (football) : à quoi elles servent.",
      },
      {
        key: "ci-cm2-monde",
        games: [
          { kind: "cm2-mon-qcm", count: 3 },
          { kind: "cm2-mon-trou", count: 2 },
          { kind: "cm2-mon-ecrire", count: 1 },
          { kind: "cm2-mon-ordre", count: 1 },
          { kind: "cm2-mon-relier", count: 1 },
          { kind: "cm2-mon-glisser", count: 2 },
        ],
        name: "Les organisations internationales",
        description:
          "Vivre ensemble, étape 3, paliers 3-4 : l'ONU et ses agences (UNICEF pour les enfants, UNESCO pour l'éducation et la culture, FAO pour l'alimentation, OMS pour la santé, HCR pour les réfugiés, OIT pour le travail, FNUAP pour la population, OMC pour le commerce) ; le CICR (Croix-Rouge), la FIFA, le CIO (Jeux olympiques ; Dakar accueille les Jeux olympiques de la jeunesse en 2026), la Fédération mondiale des villes jumelées.",
      },
    ],
  },
};
