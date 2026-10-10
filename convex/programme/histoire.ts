/**
 * HISTOIRE — Domaine 3 du CEB (ESVS), sous-domaine Découverte du monde.
 *
 * Progression du guide : le temps vécu (CI-CP), le passé proche de la
 * famille, de l'école et du quartier puis les royaumes du Sénégal (CE1-CE2),
 * la préhistoire, les résistances, les empires, la colonisation et
 * l'indépendance (CM1-CM2). Mêmes niveaux 1 et 2 que les autres activités
 * d'ESVS, répartis de la même façon (voir `sciences.ts`).
 *
 * LES FAITS CITÉS ICI SONT LES SEULS QUE LE MODÈLE DOIT UTILISER. Une date
 * ou un nom inventé dans un exercice d'histoire s'apprend aussi bien qu'un
 * vrai : la consigne de génération le rappelle (`paliers/prompts.ts`).
 */
import type { ProgrammeSubject } from "./types";

export const HISTOIRE: ProgrammeSubject = {
  key: "histoire",
  name: "Histoire",
  aliases: ["Histoire-Géographie", "Histoire Géographie", "Histoire-Geographie"],
  icon: "History",
  color: "#b45309",
  order: 4,
  domain: "Éducation à la science et à la vie sociale",
  classes: {
    CI: [
      {
        key: "hi-ci-journee",
        name: "Le matin, le midi, le soir",
        description:
          "Histoire, étape 1 : repérer les moments de la journée (matin, midi, après-midi, soir, nuit) et ce qu'on y fait (se lever, aller à l'école, déjeuner, faire la sieste, dîner, dormir).",
      },
      {
        key: "hi-ci-ordre",
        name: "Avant, pendant, après",
        description:
          "Histoire, étape 1 : l'ordre des événements. Remettre dans l'ordre les moments d'une journée ou d'une petite histoire (se réveiller, se laver, s'habiller, prendre le petit-déjeuner, partir à l'école).",
      },
      {
        key: "hi-ci-hier-demain",
        name: "Hier, aujourd'hui, demain",
        description:
          "Histoire, étape 1 : les indicateurs temporels (hier, aujourd'hui, demain, avant, après, maintenant, bientôt, autrefois).",
      },
      {
        key: "hi-ci-semaine",
        name: "Les jours de la semaine",
        description:
          "Histoire, étape 1 : les sept jours de la semaine dans l'ordre (lundi à dimanche), le jour d'avant et le jour d'après, les jours d'école et les jours de repos.",
      },
    ],
    CP: [
      {
        key: "hi-cp-durees",
        name: "C'est long, c'est court",
        description:
          "Histoire, étape 1 : comparer des durées (une récréation, une journée, une semaine, une année), plus long, plus court, en même temps.",
      },
      {
        key: "hi-cp-frequences",
        name: "Souvent, parfois, jamais",
        description:
          "Histoire, étape 1 : les fréquences. Ce qui revient tous les jours (aller à l'école), chaque semaine (le jour de marché), chaque année (l'anniversaire, la Tabaski, la Korité, Noël, la fête de l'indépendance le 4 avril).",
      },
      {
        key: "hi-cp-calendrier",
        name: "Le calendrier",
        description:
          "Histoire, étape 1 : les douze mois dans l'ordre, lire une date, se repérer dans un calendrier ; au Sénégal, la saison sèche et la saison des pluies (l'hivernage).",
      },
      {
        key: "hi-cp-emploi-du-temps",
        name: "L'emploi du temps",
        description:
          "Histoire, étape 1 : lire l'emploi du temps de la classe, ce qui vient avant ou après la récréation, les jours d'école de la semaine.",
      },
    ],
    CE1: [
      {
        key: "hi-ce1-temps",
        name: "Le temps qui passe",
        description:
          "Histoire, étape 2, paliers 1-2 : la notion de temps. La ligne du temps, les générations (grands-parents, parents, enfants), autrefois et aujourd'hui.",
      },
      {
        key: "hi-ce1-famille",
        name: "L'histoire de ma famille",
        description:
          "Histoire, étape 2, paliers 1-2 : le passé de la famille. L'arbre généalogique (grand-père, grand-mère, oncle, tante, cousin), les objets et les souvenirs de famille.",
      },
      {
        key: "hi-ce1-ecole",
        name: "L'histoire de mon école",
        description:
          "Histoire, étape 2, paliers 1-2 : le passé de l'école. Comment on retrouve l'histoire d'une école (les anciens élèves, les photos, les registres), ce qui a changé depuis sa construction.",
      },
      {
        key: "hi-ce1-quartier",
        name: "Mon quartier, mon village, ma commune",
        description:
          "Histoire, étape 2, paliers 1-2 : l'histoire du quartier ou du village (son fondateur, l'origine de son nom, ses monuments) et de la commune (le maire, la mairie).",
      },
    ],
    CE2: [
      {
        key: "hi-ce2-progres",
        name: "Hier et aujourd'hui : le progrès",
        description:
          "Histoire, étape 2, paliers 3-4 : l'idée de progrès. Se déplacer (à pied, en charrette, en car rapide, en train), s'éclairer (lampe à pétrole, électricité), communiquer (lettre, téléphone, téléphone portable), cuisiner (feu de bois, gaz).",
      },
      {
        key: "hi-ce2-royaumes-1",
        name: "Les royaumes du Sénégal (1)",
        description:
          "Histoire, étape 2, paliers 3-4 : l'organisation du Sénégal avant l'indépendance. Le Djolof, fondé selon la tradition par Ndiadiane Ndiaye ; le Cayor, le Baol et le Walo, royaumes wolofs ; leur place sur la carte du Sénégal.",
      },
      {
        key: "hi-ce2-royaumes-2",
        name: "Les royaumes du Sénégal (2)",
        description:
          "Histoire, étape 2, paliers 3-4 : le Sine et le Saloum (royaumes sérères), le Tékrour et le Fouta (vallée du fleuve Sénégal), le Gabou et les royaumes de Casamance ; un roi, des conseillers, des villages.",
      },
      {
        key: "hi-ce2-rois",
        name: "Les rois et leurs titres",
        description:
          "Histoire, étape 2, paliers 3-4 : faits saillants et personnages marquants. Le titre du roi dans chaque royaume : le Bourba au Djolof, le Damel au Cayor, le Teigne au Baol, le Brak au Walo, le Bour au Sine et au Saloum, l'Almamy au Fouta, le Mansa au Gabou. Ne citer aucun autre roi ni aucune date.",
      },
    ],
    CM1: [
      {
        key: "hi-cm1-prehistoire",
        name: "La préhistoire",
        description:
          "Histoire, étape 3, paliers 1-2 : l'âge de la pierre taillée et de la pierre polie, les premiers outils, la découverte du feu, les débuts de l'agriculture ; au Sénégal, les cercles de pierres de Sénégambie (Sine Ngayène, Wanar) et les amas de coquillages du delta du Saloum.",
      },
      {
        key: "hi-cm1-royaumes",
        name: "Les royaumes avant les Européens",
        description:
          "Histoire, étape 3, paliers 1-2 : les royaumes du Sénégal avant l'arrivée des Européens (Djolof, Cayor, Baol, Walo, Sine, Saloum, Tékrour, Fouta, Gabou) : leur organisation (le roi, les notables, l'armée) et leurs activités (agriculture, élevage, commerce).",
      },
      {
        key: "hi-cm1-contacts",
        name: "Les premiers contacts",
        description:
          "Histoire, étape 3, paliers 1-2 : les premiers contacts avec les Arabes (le commerce à travers le Sahara, l'islam, les Almoravides au XIe siècle) puis avec les Européens (les Portugais au XVe siècle, les comptoirs de Gorée et de Saint-Louis).",
      },
      {
        key: "hi-cm1-resistants",
        name: "Les résistants",
        description:
          "Histoire, étape 3, paliers 1-2 : la résistance à la conquête coloniale : El Hadji Oumar Tall, Maba Diakhou Bâ, Lat Dior Diop (mort à Dékheulé en 1886), Alboury Ndiaye, Ahmadou Cheikhou, Fodé Kaba Doumbouya.",
      },
      {
        key: "hi-cm1-paix",
        name: "Résister sans les armes",
        description:
          "Histoire, étape 3, paliers 1-2 : la marche pacifique vers l'indépendance, avec Cheikh Ahmadou Bamba (exilé au Gabon en 1895) et Aline Sitoé Diatta (résistante de Casamance, arrêtée en 1943) ; l'indépendance du Sénégal, fêtée le 4 avril, et Léopold Sédar Senghor, premier président.",
      },
    ],
    CM2: [
      {
        key: "hi-cm2-empires",
        name: "Les grands empires",
        description:
          "Histoire, étape 3, paliers 3-4 : l'empire du Ghana (l'or, Koumbi Saleh), l'empire du Mali (Soundiata Keïta, la charte du Kouroukan Fouga, Mansa Moussa et son pèlerinage à La Mecque en 1324), l'empire songhaï de Gao (Sonni Ali Ber, Askia Mohammed).",
      },
      {
        key: "hi-cm2-traite",
        name: "Grandes découvertes et traite négrière",
        description:
          "Histoire, étape 3, paliers 3-4 : les inventions du XVe siècle (la boussole, la caravelle, l'imprimerie), l'expansion européenne, la traite des Noirs et le commerce triangulaire, l'île de Gorée et la Maison des Esclaves, l'abolition de l'esclavage dans les colonies françaises en 1848.",
      },
      {
        key: "hi-cm2-colonisation",
        name: "La conquête coloniale",
        description:
          "Histoire, étape 3, paliers 3-4 : la conquête coloniale (Faidherbe, gouverneur du Sénégal), l'Afrique-Occidentale française (AOF) créée en 1895, avec Saint-Louis puis Dakar (1902) pour capitale, les résistances armées et pacifiques.",
      },
      {
        key: "hi-cm2-independance",
        name: "La marche vers l'indépendance",
        description:
          "Histoire, étape 3, paliers 3-4 : Blaise Diagne, premier député africain élu à l'Assemblée française (1914), Lamine Guèye, Léopold Sédar Senghor ; la Fédération du Mali (1959-1960) ; le 4 avril 1960, date de la fête de l'indépendance du Sénégal.",
      },
      {
        key: "hi-cm2-progres",
        name: "Les progrès des sciences et des techniques",
        description:
          "Histoire, étape 3, paliers 3-4 : les progrès des XIXe et XXe siècles : la machine à vapeur, l'électricité, le téléphone, l'automobile, l'avion, la radio, les vaccins, l'ordinateur ; ce qu'ils ont changé dans la vie des gens.",
      },
    ],
  },
};
