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
  match      -> { "pairs": [ { "left": string, "right": string } ] }
  order      -> { "correctSequence": string[] }
  drag-drop  -> { "zones": string[], "items": [ { "text": string, "correctZone": string } ] }
  short-answer -> { "acceptedAnswers": string[], "tolerance"?: string }
  fill-blank -> { "text": "phrase où chaque trou s'écrit ___", "blanks": [ { "options": string[], "answer": string } ] }

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
- Pas de notions hors programme ${input.class} (ex: pas de fractions en CE1).
- Texte adapté à l'âge (${age}), phrases courtes, vocabulaire concret.
- Pas de question à pièges méchants ; bienveillance toujours.
- Au moins 3 types d'exos différents dans le palier (Decision 63).
${HINTS_RULE}
${readingLearnerRules(input.class)}
${isMaths ? MATH_MIX_RULES + MATH_OUTPUT_RULES : subjectRules(input.subject)}`;
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
${readingLearnerRules(input.class)}
${isMathSubject(input.subject) ? MATH_MIX_RULES + MATH_OUTPUT_RULES : subjectRules(input.subject)}`;
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
