/**
 * Palier prompts — pure module.
 *
 * Three prompt families:
 *   - palier_base       : 10-exercise mega-prompt for a (subject, class, topic, palierIndex)
 *   - palier_personalized: "J'en veux encore" — focused on weaknesses
 *   - palier_variation  : regen of failed exercises — same concept, new context
 *
 * Senegalese cultural anchoring (Decision §6.2 — S2):
 *   prénoms locaux, FCFA, lieux SN, aliments locaux. NEVER €/$.
 *
 * Decision 71: for math, the model MUST emit a `mathExpression` field per
 * numeric exo so the gateway's factCheck.ts can verify the answer.
 */

import type { AiPurpose } from "../aiGateway/registry";
import { difficultyStage, type DifficultyStage } from "../palierRules";

export type ClassLevel = "CI" | "CP" | "CE1" | "CE2" | "CM1" | "CM2";

export interface PalierBasePromptInput {
  subject: string; // e.g. "Mathématiques"
  topic: string; // e.g. "Fractions"
  class: ClassLevel;
  palierIndex: number; // 1..palierCount
  /**
   * Le nombre de paliers de la thématique (`palierRules.effectivePalierCount`).
   * La difficulté d'un palier se lit par rapport à lui : le troisième palier
   * sur quatre est un approfondissement, le troisième sur dix une découverte.
   * Absent, dix — l'ancienne grille.
   */
  palierCount?: number;
  /**
   * Le contenu officiel visé par la thématique (`topics.description`, écrit
   * d'après le programme pour les thématiques chargées par `programme/seed`).
   * Le modèle n'en savait rien : il ne lisait que le nom, et « Les rois et
   * leurs titres » laissait tout inventer.
   */
  topicDescription?: string;
  /**
   * Combien d'exercices le modèle doit écrire. Dix d'ordinaire ; moins quand
   * des jeux fabriqués par le code complètent le palier (`paliers/games`).
   */
  exerciseCount?: number;
}

export interface PersonalizedPromptInput extends PalierBasePromptInput {
  weaknesses: string[];
  frequentMistakes: string[];
}

export interface VariationPromptInput {
  class: ClassLevel;
  failed: Array<{
    concept: string; // pedagogical concept tag
    statement: string;
    correctAnswer: string;
    studentAnswer: string;
  }>;
  subject: string;
  topic: string;
}

const SENEGAL_ANCHOR = `\nANCRAGE CULTUREL OBLIGATOIRE (impératif) :
- Prénoms sénégalais : Aïssatou, Modou, Fatou, Cheikh, Aminata, Ousmane, Mariama, Ibrahima, Awa, Penda, Mame, Khady.
- Monnaie : exclusivement FCFA. JAMAIS d'euros, dollars, centimes européens.
- Lieux : marché Sandaga, Dakar, Thiès, Saint-Louis, Casamance, Touba, Mbour, Kaolack, Ziguinchor.
- Aliments : mangue, mil, arachide, thiéboudienne, yassa, mafé, bissap, lait caillé, ngalakh, fonio.
- Mode de vie : famille élargie, école sénégalaise, marché, cour de récréation locale.
- Pas de neige, pas de châteaux européens, pas de dollars.`;

const TYPES_LIST = `qcm, drag-drop, match, order, short-answer, fill-blank`;

/**
 * En mathématiques, pas de phrase à trous : un calcul à trou s'écrit en
 * réponse courte, que `mathRepair` vérifie par le calcul. Une phrase à trous
 * échapperait à cette vérification.
 */
const MATH_TYPES_LIST = `qcm, drag-drop, match, order, short-answer`;

function typesFor(subject: string): string {
  return isMathSubject(subject) ? MATH_TYPES_LIST : TYPES_LIST;
}

const HINTS_RULE = `
- 3 indices progressifs : le 1er = relire l'énoncé / observer ;
  le 2e = méthode pédagogique ; le 3e = quasi-réponse mais sans la donner.`;

const STAGE_LABEL: Record<DifficultyStage, string> = {
  decouverte: "découverte (notions de base, peu d'étapes).",
  consolidation: "consolidation (combinaison de plusieurs notions vues).",
  approfondissement: "approfondissement (problèmes en plusieurs étapes).",
  maitrise: "challenge / maîtrise (exercices complets, ouverture).",
};

const DIFFICULTY_NOTE = (palierIndex: number, palierCount: number) =>
  `\nNiveau global du palier ${palierIndex}/${palierCount} : ${
    STAGE_LABEL[difficultyStage(palierIndex, palierCount)]
  }
Difficulté progressive INTRA-palier : exos 1-3 = facile, 4-7 = moyen, 8-10 = challenge.`;

const countOf = (input: { palierCount?: number }) => input.palierCount ?? 10;

const ageForClass = (cls: ClassLevel): string => {
  switch (cls) {
    case "CI":
      return "5-6 ans";
    case "CP":
      return "6-7 ans";
    case "CE1":
      return "7-8 ans";
    case "CE2":
      return "8-9 ans";
    case "CM1":
      return "9-10 ans";
    case "CM2":
      return "10-11 ans";
  }
};

/**
 * LE PLANCHER DE CHAQUE CLASSE. Les règles maths ci-dessous sont les mêmes de
 * CI à CM2 et leurs exemples (« 3 × 4 », « 12 + 7 ») sont des calculs de CI :
 * sans borne basse, le modèle servait des problèmes de CP (10 FCFA, 4 amis)
 * sur une thématique de CM2. Cette étendue dit, pour chaque classe, les
 * nombres et les opérations attendus ; elle passe APRÈS les règles de mélange
 * et l'emporte sur leurs exemples.
 */
const MATH_SCOPE: Record<ClassLevel, string> = {
  CI: "nombres jusqu'à 10 (20 au plus), additions et soustractions très simples, dénombrer, comparer, formes.",
  CP: "nombres jusqu'à 100, additions et soustractions, doubles et moitiés, premières tables (2, 5, 10).",
  CE1: "nombres jusqu'à 1 000, additions et soustractions avec retenue, tables de multiplication, premiers partages.",
  CE2: "nombres jusqu'à 10 000, multiplication à 2 chiffres, division simple, monnaie, mesures de longueur et de durée.",
  CM1: "nombres jusqu'à 1 000 000, multiplication et division posées, fractions simples, décimaux (dixièmes, centièmes), périmètres et aires, problèmes à 2 étapes.",
  CM2: "grands nombres (millions), 4 opérations avec décimaux, fractions (comparer, additionner, multiplier), pourcentages, proportionnalité, aires, volumes et conversions de mesures, problèmes à plusieurs étapes préparant la 6e.",
};

/**
 * LE NIVEAU DE LANGUE, POUR TOUTES LES MATIÈRES. Un énoncé de CM2 écrit en
 * phrases de CP est aussi faux qu'un calcul de CP en CM2.
 */
const LANGUAGE_LEVEL: Record<ClassLevel, string> = {
  CI: "énoncés de 8 mots au plus, un mot ou un émoji par option, aucun texte à lire seul.",
  CP: "énoncés d'une phrase courte (12 mots au plus), mots simples et connus, options de 1 à 3 mots.",
  CE1: "énoncés d'une ou deux phrases courtes, vocabulaire courant, petits textes de 2 à 3 phrases.",
  CE2: "énoncés de 2 à 3 phrases, vocabulaire plus riche, textes de 4 à 5 phrases, premiers connecteurs (car, mais, donc).",
  CM1: "énoncés de 2 à 4 phrases, vocabulaire précis, textes de 5 à 8 phrases, questions qui demandent de justifier.",
  CM2: "énoncés élaborés (3 à 5 phrases), vocabulaire précis, textes de 8 à 12 phrases, questions d'inférence, de justification et de synthèse qui préparent la 6e.",
};

const SUBJECT_SCOPE: { match: RegExp; scope: Record<ClassLevel, string> }[] = [
  {
    match: /anglais|english/i,
    scope: {
      CI: "reconnaître des mots isolés avec l'image : couleurs, animaux, nombres 1 à 10, salutations (hello, goodbye).",
      CP: "mots et très courtes expressions : famille, école, fruits, corps, « I am… », « It is a… ».",
      CE1: "phrases très simples sur soi : « I have… », « I like… », « I can… », la famille, la classe, les nombres jusqu'à 20.",
      CE2: "phrases simples A1 : décrire quelqu'un ou un objet, la maison, la nourriture, l'heure pleine, les jours, « There is/are ».",
      CM1: "A1+ : le présent continu (« She is eating »), la routine de la journée, les lieux de la ville, les prépositions de lieu.",
      CM2: "A2 : le passé simple des verbes courants (« yesterday I went »), le futur proche (« I am going to »), comparer, demander son chemin, lire un petit texte.",
    },
  },
  {
    match: /fran[cç]ais|langue/i,
    scope: {
      CI: "reconnaître les lettres, les sons, des syllabes, des mots d'images ; aucun texte.",
      CP: "lire et écrire des syllabes et des mots simples, des phrases de 4 à 6 mots, le son d'une lettre.",
      CE1: "lire de petites phrases, le nom et le verbe, la phrase et la majuscule, le pluriel simple, premiers verbes au présent.",
      CE2: "le groupe nominal, les accords sujet-verbe et en genre, le présent, le futur et l'imparfait des verbes courants, a/à et et/est.",
      CM1: "le passé composé, l'accord du participe, les compléments, les homophones, les types de phrases, comprendre un texte et en tirer des informations.",
      CM2: "les modes et temps usuels (conditionnel, subjonctif), l'accord du participe passé, les propositions, les expansions du nom, l'inférence dans un texte, l'expression écrite structurée.",
    },
  },
  {
    match: /histoire/i,
    scope: {
      CI: "le temps vécu : hier, aujourd'hui, demain, la journée, la famille.",
      CP: "le passé de la famille et de l'école, avant et après, les générations.",
      CE1: "le passé du quartier et du village, les traces et objets d'autrefois.",
      CE2: "les premiers royaumes du Sénégal et leurs chefs, la vie d'autrefois.",
      CM1: "la préhistoire, les grands empires (Ghana, Mali, Songhaï), les résistances à la conquête.",
      CM2: "la colonisation, les résistances, l'indépendance du Sénégal, les grandes dates et leurs causes et conséquences.",
    },
  },
  {
    match: /g[ée]ograph/i,
    scope: {
      CI: "se repérer dans la classe et l'école : devant/derrière, près/loin.",
      CP: "le quartier, le chemin de l'école, un plan simple.",
      CE1: "le village et la ville, les points cardinaux, la carte simple.",
      CE2: "les régions du Sénégal, les fleuves, le relief, les activités des habitants.",
      CM1: "le Sénégal en détail (régions, climats, ressources), la lecture de cartes, les pays voisins.",
      CM2: "l'Afrique de l'Ouest, les grands ensembles géographiques, les échanges, la population, lire cartes et tableaux.",
    },
  },
  {
    match: /scien|[ée]veil|ist\b/i,
    scope: {
      CI: "les cinq sens, les parties du corps, les animaux et plantes familiers.",
      CP: "le corps et l'hygiène, les besoins des plantes et des animaux, le jour et la nuit.",
      CE1: "les êtres vivants et leur croissance, l'eau, les états de la matière observables, la santé.",
      CE2: "le cycle de vie, les chaînes alimentaires simples, l'air, l'eau, les saisons, la nutrition.",
      CM1: "la digestion et la respiration, les mélanges, les circuits électriques simples, l'environnement.",
      CM2: "le corps humain et ses fonctions, la reproduction, l'énergie, les transformations de la matière, l'expérience en démarche scientifique.",
    },
  },
  {
    match: /civi|emc|vivre ensemble/i,
    scope: {
      CI: "les règles de la classe, dire bonjour, partager.",
      CP: "les règles de la vie en groupe, le respect, la propreté.",
      CE1: "les droits et devoirs de l'enfant, la famille, l'école.",
      CE2: "les symboles du Sénégal, le quartier, les règles de sécurité.",
      CM1: "les institutions du pays, le citoyen, la solidarité, la paix.",
      CM2: "la Constitution, les droits de l'enfant, la démocratie, les responsabilités du citoyen.",
    },
  },
  {
    match: /artisti|arts|musi|dessin/i,
    scope: {
      CI: "les couleurs, les formes, des sons forts et doux.",
      CP: "les couleurs primaires, les instruments connus, des chants simples.",
      CE1: "les couleurs secondaires, les familles d'instruments, le rythme.",
      CE2: "les techniques de dessin, les instruments traditionnels, le rythme et la mélodie.",
      CM1: "les techniques (collage, peinture), les formes d'art du Sénégal, la lecture de rythmes.",
      CM2: "l'analyse d'une œuvre, les arts du Sénégal, les émotions en musique, la création structurée.",
    },
  },
];

function classScopeRules(subject: string, cls: ClassLevel): string {
  const isMaths = isMathSubject(subject);
  const programme = isMaths
    ? MATH_SCOPE[cls]
    : SUBJECT_SCOPE.find((entry) => entry.match.test(subject))?.scope[cls];
  const lowerClass = cls !== "CI" && cls !== "CP" && cls !== "CE1";
  const mathFloor =
    isMaths && lowerClass
      ? `
- INTERDIT : un calcul ou un problème de CI-CP (sommes à un chiffre, "3 × 4", petites sommes de 10 ou 50 FCFA, partage entre 2 à 4 amis). Au moins 7 exercices sur 10 demandent un calcul à plusieurs chiffres ou plusieurs étapes.`
      : "";
  const mathExamples = isMaths
    ? `
- Les exemples de la section précédente montrent la FORME des exercices (symboles, mots, trou, mélange), jamais la taille des nombres : prends des nombres et des situations de ${cls}.
- Le FCFA n'a pas de centimes : un prix est un nombre ENTIER réaliste (un bissap 100 FCFA, une mangue 150 FCFA, un cahier 500 FCFA, un pagne 5 000 FCFA), jamais "4,50 FCFA" ni "20,00". Les décimaux se travaillent sur des longueurs, des masses, des capacités (2,5 kg, 1,75 m).`
    : "";
  const floor = lowerClass
    ? `
- Un exercice qu'un enfant de CP résout sans effort est un ÉCHEC : refais-le avec le niveau de ${cls}.`
    : "";
  return `
[Niveau ${cls} — étendue ${isMaths ? "des mathématiques" : "de la matière"}]${programme ? `\n- Programme ${cls} : ${programme}` : ""}
- Langue de l'exercice en ${cls} : ${LANGUAGE_LEVEL[cls]}${mathExamples}${mathFloor}${floor}
- Un exercice d'une classe inférieure ou supérieure est refusé : tout le palier vise ${cls}.`;
}

const MATH_MIX_RULES = `
[Mélange des écritures et des signes — Maths — QUOTAS OBLIGATOIRES sur les 10 exercices]
- Au moins 3 exercices écrits en SYMBOLES ("3 × 4 = ?", "12 + 7", "25 − 8", "20 ÷ 4").
- Au moins 3 exercices écrits en MOTS ou en petit PROBLÈME concret ("3 fois 4",
  "le produit de 3 et 4", "la somme de 12 et 7", "4 groupes de 3", mangues, FCFA, élèves).
- Au moins 2 exercices À TROU ("? × 4 = 12", "3 × ? = 12", "15 + ? = 20").
- Au moins 2 exercices qui font intervenir une AUTRE opération déjà connue à ce
  niveau, seule ou combinée ("3 × 4 + 2", "20 − 3 × 4", une addition dans un
  palier de multiplication, une soustraction dans un palier d'addition) : le
  mélange des signes oblige l'enfant à LIRE le signe au lieu de deviner.
- Dans chaque QCM, un distracteur est le résultat d'une AUTRE opération sur les
  mêmes nombres (pour "3 × 4", propose aussi 7 ; pour "12 + 7", propose aussi 5).
- Jamais deux exercices de suite avec la même formulation ; alterne symboles,
  mots, problème, trou.
- Utilise les vrais symboles : × pour multiplier (jamais x ni *), − pour
  soustraire, ÷ ou : pour diviser, = pour l'égalité.
- Une réponse courte attendue en nombre s'écrit en chiffres, sans unité ni
  texte, dans "acceptedAnswers" (ex. ["12"]) ; ajoute les variantes utiles
  (["2,5", "2.5"]).
- Avant de répondre, VÉRIFIE que les quotas ci-dessus sont tenus ; sinon,
  remplace des exercices jusqu'à ce qu'ils le soient.`;

const MATH_OUTPUT_RULES = `
[Output structuré pour les Maths]
Pour chaque exercice numérique, INCLUS un champ "mathExpression" qui contient
l'expression arithmétique parseable (exemples : "53 - 27", "(3/4) + (1/2)", "2 × 7").
Cette expression sert à vérifier ta réponse automatiquement : sa valeur DOIT être
la réponse attendue. Jamais de "?" ni de "=" dedans : pour un trou
("? × 6 = 24"), écris l'expression qui donne le trou ("24 ÷ 6").
Calcule le résultat toi-même avant d'écrire correctAnswer, et pour un QCM vérifie
que options[correctIndex] est exactement ce résultat.
Si l'exercice n'est pas réductible à une expression simple (problème verbal complexe),
écris "mathExpression": null — un humain validera.`;

const JSON_SHAPE = `
[Format JSON STRICT — réponds UNIQUEMENT avec ce JSON, sans texte avant/après]
{
  "exercises": [
    {
      "type": "qcm" | "drag-drop" | "match" | "order" | "short-answer" | "fill-blank",
      "statement": "énoncé clair, court, kid-friendly",
      "payload": { ... shape selon le type ... },
      "correctAnswer": "réponse canonique sous forme texte",
      "mathExpression": "53 - 27" | null,
      "concept": "tag pédagogique court (ex: 'soustraction avec retenue')",
      "hints": ["indice1", "indice2", "indice3"]
    }
    // ... 10 items au total
  ]
}

Schémas de payload :
  qcm        -> { "options": string[], "correctIndex": number, "explanation"?: string }
  match      -> { "pairs": [ { "left": string, "right": string } ], "accepted"?: [ { "left": string, "right": string } ] }
  order      -> { "correctSequence": string[] }
  drag-drop  -> { "zones": string[], "items": [ { "text": string, "correctZone": string } ] }
  short-answer -> { "acceptedAnswers": string[], "tolerance"?: string }
  fill-blank -> { "text": "phrase où chaque trou s'écrit ___", "blanks": [ { "options": string[], "answer": string } ] }

Règles du match (l'enfant relie chaque mot de gauche à un mot de droite) :
  - Un mot de gauche a UNE bonne réponse que l'enfant peut trouver sans hésiter.
    Évite les couples où deux propositions vont à deux éléments (une pomme est
    rouge, verte ou jaune ; une mangue verte ou jaune) : préfère des couples
    sans équivoque (rouge-tomate, vert-citron, jaune-banane).
  - Si une ambiguïté reste, écris l'association principale dans "pairs" et
    CHAQUE autre paire tout aussi juste dans "accepted" (même "left" et "right"
    que dans "pairs", jamais de mot nouveau). L'enfant qui choisit l'autre
    association doit être compté juste.
  - Autant de mots à gauche qu'à droite, chacun relié une seule fois.

Règles du drag-drop (l'enfant doit comprendre où poser chaque étiquette) :
  - Chaque zone porte sa VRAIE étiquette, lisible par l'enfant : le résultat
    ("12"), la catégorie ("Fruits"), le mot ("Le"). JAMAIS "Zone A", "Zone 1",
    "A", "B" : l'enfant ne peut pas savoir ce que c'est.
  - Une étiquette n'est jamais identique à sa zone ("a" à poser sur "a") : pour
    choisir un mot dans une phrase, utilise un fill-blank.
  - Pour remettre des mots, des syllabes ou des étapes dans l'ordre, utilise order.
  - Chaque "correctZone" est exactement l'une des "zones".
  - Pour trier des affirmations vraies et fausses, deux zones : "Vrai" et "Faux".

Règles du fill-blank (la phrase à trous) :
  - De 1 à 3 trous, chacun écrit ___ (trois tirets bas) dans "text", autant de
    trous que d'éléments dans "blanks", dans le même ordre.
  - Chaque trou propose 2 à 4 mots ; "answer" est EXACTEMENT l'un d'eux.
  - Idéal pour la conjugaison, les accords, les homophones (a/à, et/est, son/sont),
    les déterminants, et pour compléter une phrase de sciences ou d'histoire.
  - "correctAnswer" est la phrase complète, trous remplis.`;

/**
 * LES RÈGLES PROPRES À CHAQUE MATIÈRE. Le modèle écrivait un exercice
 * d'histoire comme un exercice de calcul : rien ne lui disait qu'une date
 * inventée s'apprend aussi bien qu'une vraie.
 */
const FACTS_RULE = `
[Exactitude — matière de connaissances]
- N'invente AUCUN fait, aucune date, aucun nom de personne ou de lieu : utilise
  ceux du « contenu officiel » ci-dessous, ou des faits très connus et sûrs.
- En cas de doute sur un fait, pose plutôt une question sur une notion sûre.
- Les distracteurs d'un QCM sont plausibles mais clairement faux pour qui sait.`;

const SUBJECT_RULES: { match: RegExp; rules: string }[] = [
  // L'anglais passe AVANT le français : « Langue anglaise » contient « langue ».
  {
    match: /anglais|english/i,
    rules: `
[Anglais — langue étrangère d'un enfant francophone]
- Les énoncés, les indices et les explications sont en FRANÇAIS simple. L'anglais
  n'apparaît que dans ce que l'enfant apprend : mots, phrases, réponses.
- Toute phrase anglaise de l'énoncé s'écrit entre guillemets français :
  Complète : « I like rice. ».
- Anglais correct et naturel, orthographe britannique (colour, grey, favourite),
  la même dans tout le palier. Aucun argot, aucune expression imagée, aucun mot
  qui ne figure pas dans le vocabulaire du « contenu officiel » ci-dessous.
- Au CI et au CP, une voix française lit l'énoncé à voix haute : AUCUN mot
  anglais dans l'énoncé (« Quel mot va avec l'image ? »). Les mots anglais sont
  dans les options, et un émoji accompagne chaque mot.
- L'application ne lit pas l'anglais : aucun exercice d'écoute, de rime ou de
  prononciation, aucune transcription phonétique.
- Une seule bonne réponse. Pas de traduction libre quand plusieurs
  traductions sont possibles : demande un mot, fais choisir dans une liste, fais
  compléter ou remettre dans l'ordre.
- Les mauvaises options sont les erreurs classiques d'un francophone : « I have
  8 years » pour « I am 8 », « He have », l'adjectif après le nom (« a dress
  red »), le s d'un adjectif (« two smalls dogs »), les faux amis. Jamais une
  phrase fausse présentée comme la bonne.
- order : les mots d'une phrase, ou les répliques d'un dialogue, avec une seule
  solution possible. fill-blank : le verbe, l'article a / an, la préposition.
  match : un mot et son émoji, ou un mot et sa traduction. drag-drop : classer
  (animaux et fruits, singulier et pluriel). short-answer : UN mot anglais à
  l'orthographe unique, sans tenir compte des majuscules.
- Les prénoms et les lieux sont ceux de l'enfant (Awa, Modou, Fatou, Dakar, le
  marché) ; l'argent est le franc (FCFA).`,
  },
  {
    match: /fran[cç]ais|langue/i,
    rules: `
[Français]
- Orthographe, accords et conjugaisons IRRÉPROCHABLES dans l'énoncé comme dans
  les options : un enfant apprend aussi ce qu'il lit.
- Une seule bonne réponse par question ; pas d'option « presque juste ».
- Varie : fill-blank pour la conjugaison et les accords, order pour remettre une
  phrase ou une histoire dans l'ordre, match pour associer, qcm pour comprendre.
- Les textes à lire sont courts et écrits pour l'exercice (jamais une citation
  attribuée à un auteur).`,
  },
  {
    match: /histoire/i,
    rules: `${FACTS_RULE}
[Histoire]
- order pour remettre des événements dans l'ordre chronologique ; match pour
  associer un personnage et ce qu'il a fait, un royaume et le titre de son roi.`,
  },
  {
    match: /g[ée]ograph/i,
    rules: `${FACTS_RULE}
[Géographie]
- Le Sénégal de l'enfant d'abord : sa région, ses fleuves, ses saisons, ses villes.
- drag-drop pour classer (régions, activités, saisons), match pour associer une
  ville et sa région, qcm pour se repérer.`,
  },
  {
    match: /scien|[ée]veil|ist\b/i,
    rules: `${FACTS_RULE}
[Éveil scientifique]
- Des faits scientifiques exacts, observables dans la vie de l'enfant.
- La santé (paludisme, hygiène, eau potable) se traite avec bienveillance, sans
  faire peur ; ce que l'enfant peut faire lui-même.
- drag-drop pour classer (animaux, aliments, états de la matière), order pour les
  étapes d'un cycle de vie ou d'une expérience.`,
  },
  {
    match: /civi|emc|vivre ensemble/i,
    rules: `${FACTS_RULE}
[Instruction civique]
- Des situations de la vie de l'enfant (la classe, la rue, le quartier) où il
  choisit le bon comportement ; jamais de morale culpabilisante.
- Les symboles et les institutions de la République sont exacts.`,
  },
  {
    match: /artisti|arts|musi|dessin/i,
    rules: `${FACTS_RULE}
[Éducation artistique]
- Les jeux de couleurs, de dessin et d'écoute sont fabriqués à part : écris des
  questions de connaissance et de sensibilité (le matériel, les instruments et la
  façon d'en jouer, les étapes d'une technique, les émotions d'un personnage).
- Les émojis aident beaucoup (🥁 🎨 😢 😀) ; les paroles d'une chanson ou de
  l'hymne ne se citent jamais.`,
  },
];

/**
 * AUCUNE IMAGE N'EST AFFICHÉE : l'énoncé est du texte. « Combien de mangues
 * vois-tu ? » sans mangue écrite laisse l'enfant devant une carte vide.
 */
const VISUAL_RULE = `
[Ce que l'enfant voit — AUCUNE image n'est affichée]
- L'enfant ne voit que le texte de l'énoncé et des options. Ne parle JAMAIS d'une
  image, d'un dessin, d'une photo ou d'un « ci-dessous » : il n'y en a pas.
- Pour faire COMPTER ou OBSERVER, dessine avec des émojis DANS "statement", en
  nombre exact (réponse 5 : "🥭🥭🥭🥭🥭 Combien de mangues vois-tu ?"). Le nombre
  d'émojis dessinés est exactement la réponse attendue.
- Sans émojis, écris la situation avec des nombres ("Aïssatou a 3 mangues, …").`;

/** Les règles de la matière, ou une chaîne vide (les mathématiques ont les leurs). */
export function subjectRules(subject: string): string {
  if (isMathSubject(subject)) return "";
  return SUBJECT_RULES.find((entry) => entry.match.test(subject))?.rules ?? "";
}

/** Au CI et au CP, l'enfant ne lit pas encore : seule la consigne lui est lue. */
function readingLearnerRules(cls: ClassLevel): string {
  if (cls !== "CI" && cls !== "CP") return "";
  return `
[Enfant qui apprend à lire — ${cls}]
- La consigne ("statement") est lue à voix haute par l'application : elle peut
  être une vraie phrase, mais courte.
- Les options, les étiquettes et les mots à relier, l'enfant doit les reconnaître
  SANS lire de phrase : un émoji, un nombre, une syllabe, un mot très court.
- Pas de short-answer au CI : l'enfant ne sait pas encore écrire au clavier.`;
}

function topicBlock(description: string | undefined): string {
  const text = description?.trim();
  if (!text) return "";
  return `
[Contenu officiel visé par la thématique — ne sors pas de ce cadre]
${text}
`;
}

function shapeFor(count: number): string {
  return JSON_SHAPE.replace("// ... 10 items au total", `// ... ${count} items au total`);
}

export function buildPalierBaseSystemPrompt(input: PalierBasePromptInput): string {
  const age = ageForClass(input.class);
  const isMaths = isMathSubject(input.subject);
  return `Tu es un professeur expérimenté du programme officiel élémentaire sénégalais.
Tu génères des exercices pour des enfants de classe ${input.class} (${age}).
Inspiré du programme officiel sénégalais (élémentaire).
${SENEGAL_ANCHOR}

[Contraintes pédagogiques]
- Pas de notions hors programme ${input.class} (ex: pas de fractions en CE1), et pas de notions d'une classe inférieure : le niveau visé est celui de ${input.class}, ni plus facile ni plus difficile.
- Texte adapté à l'âge (${age}), phrases courtes, vocabulaire concret.
- Pas de question à pièges méchants ; bienveillance toujours.
- Au moins 3 types d'exos différents dans le palier (Decision 63).
${HINTS_RULE}
${VISUAL_RULE}
${readingLearnerRules(input.class)}
${isMaths ? MATH_MIX_RULES + classScopeRules(input.subject, input.class) + MATH_OUTPUT_RULES : subjectRules(input.subject) + classScopeRules(input.subject, input.class)}`;
}

export function buildPalierBasePrompt(input: PalierBasePromptInput): string {
  const count = input.exerciseCount ?? 10;
  return `[Tâche]
Génère ${count} exercices pour la matière "${input.subject}", thème "${input.topic}",
palier ${input.palierIndex}/${countOf(input)}, classe ${input.class}.
${topicBlock(input.topicDescription)}
Types autorisés : ${typesFor(input.subject)}.
${DIFFICULTY_NOTE(input.palierIndex, countOf(input))}

${shapeFor(count)}`;
}

export function buildPersonalizedSystemPrompt(input: PersonalizedPromptInput): string {
  return buildPalierBaseSystemPrompt(input);
}

export function buildPersonalizedPrompt(input: PersonalizedPromptInput): string {
  const weaknessesBlock =
    input.weaknesses.length > 0
      ? `\n[Faiblesses identifiées]\n- ${input.weaknesses.join("\n- ")}`
      : "";
  const mistakesBlock =
    input.frequentMistakes.length > 0
      ? `\n[Erreurs fréquentes]\n- ${input.frequentMistakes.join("\n- ")}`
      : "";
  return `[Tâche — "J'en veux encore" personnalisé]
Cet enfant veut faire 10 exercices supplémentaires sur le thème "${input.topic}"
(matière "${input.subject}", classe ${input.class}, palier ${input.palierIndex}/${countOf(input)}).
Cible spécifiquement ce qui pose problème à cet enfant — il a déjà fait le palier de base.
${weaknessesBlock}${mistakesBlock}

Types autorisés : ${typesFor(input.subject)}.
${DIFFICULTY_NOTE(input.palierIndex, countOf(input))}

${JSON_SHAPE}`;
}

export function buildVariationSystemPrompt(input: VariationPromptInput): string {
  return `Tu es un professeur expérimenté du programme officiel élémentaire sénégalais.
Tu génères des VARIATIONS d'exercices que l'enfant a ratés, pour qu'il puisse réessayer.
Classe : ${input.class}.
Inspiré du programme officiel sénégalais.
${SENEGAL_ANCHOR}

[Règles VARIATION]
- Garde le MÊME concept pédagogique que l'original (addition à retenue, accord du verbe, etc.).
- Change : la formulation, les noms, les chiffres, le contexte (mais reste sénégalais).
- Reste au même niveau de difficulté.
- Évite spécifiquement le piège qui a fait rater l'enfant — voir ses erreurs.
${HINTS_RULE}
${VISUAL_RULE}
${readingLearnerRules(input.class)}
${isMathSubject(input.subject) ? MATH_MIX_RULES + classScopeRules(input.subject, input.class) + MATH_OUTPUT_RULES : subjectRules(input.subject) + classScopeRules(input.subject, input.class)}`;
}

export function buildVariationPrompt(input: VariationPromptInput): string {
  const failedBlock = input.failed
    .map(
      (f, i) =>
        `${i + 1}. Concept : "${f.concept}"\n   Énoncé : "${f.statement}"\n   Bonne réponse : "${f.correctAnswer}"\n   Réponse de l'enfant : "${f.studentAnswer}"`,
    )
    .join("\n\n");
  return `[Tâche]
Voici ${input.failed.length} exercice(s) que l'enfant a raté(s) sur le thème "${input.topic}".
Pour chacun, génère UNE VARIATION qui force la même technique mais change le contexte.

[Exercices ratés]
${failedBlock}

Types autorisés : ${typesFor(input.subject)}.

${JSON_SHAPE.replace(
  "// ... 10 items au total",
  `// EXACTEMENT ${input.failed.length} variations, dans le même ordre que les exos ratés.`,
)}`;
}

function isMathSubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return s.startsWith("math") || s.includes("calcul") || s.includes("arithm");
}

// Re-export for callers that pre-resolve purpose
export type { AiPurpose };
