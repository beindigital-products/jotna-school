/**
 * LES GABARITS DES RÉVISIONS DU CFEE DU CM2 (`fr-cm2-cfee`).
 *
 * La fiche demande cinq choses : l'accord du participe passé (avec être et avec avoir), les homophones grammaticaux, les pluriels difficiles, les terminaisons
 * -é/-er/-ez/-ait, la conjugaison des verbes usuels aux temps de l'indicatif. Ici chaque exercice est BÂTI à partir de tableaux fermés (des participes écrits sous
 * leurs quatre formes, des phrases à trou dont une seule réponse est possible, des pluriels rangés par famille), jamais écrit par le modèle.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Le participe passé avec « avoir » ne s'accorde avec le complément d'objet direct que s'il est placé AVANT le verbe. Les phrases sont donc de quatre sortes :
 *   « Voici les mangues que Fatou a cueillies » (le complément est avant), « Les mangues, Fatou les a cueillies » (le pronom « les » reprend un nom écrit),
 *   « Fatou a cueilli des mangues » (le complément est après : le participe ne change pas) et « Les filles ont couru » (pas de complément). Le pronom « l' » n'est
 *   jamais utilisé, car il cache le genre.
 * - Un mauvais choix n'est jamais une deuxième bonne réponse : « elles ont couru » ne s'accorde pas avec le sujet, donc « courues » est un mauvais choix.
 * - Les participes qui s'écrivent pareil au masculin singulier et pluriel (« pris ») donnent trois formes, pas quatre : un mauvais choix n'est jamais la bonne réponse.
 * - Les homophones : chaque phrase n'admet qu'un seul mot parmi les trois proposés. « ces/ses » et « leur/leurs » sont laissés de côté, parce que les deux mots y vont
 *   souvent dans la même phrase.
 * - Les pluriels : les mots qui ont deux pluriels admis (« travail », « ciel », « ail ») ne sont pas posés. Les mots qui ne changent pas (« nez », « souris »)
 *   ne sont jamais proposés en choix multiple, parce qu'un mauvais choix inventé comme « sourix » ne ressemble à aucune faute d'enfant.
 * - Une phrase n'a jamais plus d'une apostrophe, et les noms de personnes commencent par une consonne.
 *
 * HORS FICHE, À FAIRE RELIRE : les onze verbes conjugués avec « être » (arriver, partir, tomber, sortir, entrer, rester, venir, descendre, monter, aller, retourner), les
 * neuf verbes à l'objet direct (cueillir, acheter, manger, écrire, lire, prendre, perdre, voir, ouvrir) et leurs objets, les phrases d'appui des homophones, la
 * liste des pluriels (soixante-quinze noms, dont quatorze qui ne changent pas), la phrase « Autrefois, … » pour l'imparfait en -ait, les seize verbes en -er des terminaisons.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, sortRows, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import { VERBS, canUse, formOf, type Tense, type Verb } from "./cm1Conjugaison";
import type { GameContext, GeneratedGame } from "./shared";

const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const startsWithVowel = (text: string) => /^[aeiouyéèêâîôûh]/iu.test(text);

const CONCEPT_PARTICIPLE = "accorder le participe passé";
const CONCEPT_HOMOPHONES = "distinguer les homophones grammaticaux";
const CONCEPT_PLURALS = "écrire le pluriel des noms";
const CONCEPT_ENDINGS = "choisir entre -é, -er, -ez et -ait";
const CONCEPT_CONJUGATION = "conjuguer à l'indicatif";

// ===========================================================================
// LE PARTICIPE PASSÉ : quatre formes (masculin singulier, féminin singulier, masculin pluriel, féminin pluriel)
// ===========================================================================

type Four = readonly [string, string, string, string];
export const PARTICIPLES: Record<string, Four> = {
  arriver: ["arrivé", "arrivée", "arrivés", "arrivées"],
  partir: ["parti", "partie", "partis", "parties"],
  tomber: ["tombé", "tombée", "tombés", "tombées"],
  sortir: ["sorti", "sortie", "sortis", "sorties"],
  entrer: ["entré", "entrée", "entrés", "entrées"],
  rester: ["resté", "restée", "restés", "restées"],
  venir: ["venu", "venue", "venus", "venues"],
  descendre: ["descendu", "descendue", "descendus", "descendues"],
  monter: ["monté", "montée", "montés", "montées"],
  aller: ["allé", "allée", "allés", "allées"],
  retourner: ["retourné", "retournée", "retournés", "retournées"],
  cueillir: ["cueilli", "cueillie", "cueillis", "cueillies"],
  acheter: ["acheté", "achetée", "achetés", "achetées"],
  manger: ["mangé", "mangée", "mangés", "mangées"],
  écrire: ["écrit", "écrite", "écrits", "écrites"],
  lire: ["lu", "lue", "lus", "lues"],
  prendre: ["pris", "prise", "pris", "prises"],
  perdre: ["perdu", "perdue", "perdus", "perdues"],
  voir: ["vu", "vue", "vus", "vues"],
  ouvrir: ["ouvert", "ouverte", "ouverts", "ouvertes"],
  dormir: ["dormi", "dormie", "dormis", "dormies"],
  marcher: ["marché", "marchée", "marchés", "marchées"],
  courir: ["couru", "courue", "courus", "courues"],
  chanter: ["chanté", "chantée", "chantés", "chantées"],
  travailler: ["travaillé", "travaillée", "travaillés", "travaillées"],
  jouer: ["joué", "jouée", "joués", "jouées"],
};

/** Les deux mauvais choix : les formes différentes de la bonne réponse, dans l'ordre de préférence, puis dans l'ordre du tableau. */
function wrongForms(forms: Four, answer: string, preferred: readonly number[]): [string, string] {
  const out: string[] = [];
  for (const index of [...preferred, 0, 1, 2, 3]) {
    const form = forms[index];
    if (form !== answer && !out.includes(form)) out.push(form);
    if (out.length === 2) break;
  }
  return [out[0], out[1]];
}

/** Un accord : 0 = masculin singulier, 1 = féminin singulier, 2 = masculin pluriel, 3 = féminin pluriel. */
type Agreement = 0 | 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Avec « être » : le participe s'accorde avec le sujet
// ---------------------------------------------------------------------------

type Subject = { text: string; agreement: Agreement };
const SUBJECTS: readonly Subject[] = [
  { text: "Moussa", agreement: 0 },
  { text: "Le petit garçon", agreement: 0 },
  { text: "Mon frère", agreement: 0 },
  { text: "Le vieux pêcheur", agreement: 0 },
  { text: "Cheikh", agreement: 0 },
  { text: "Le maître", agreement: 0 },
  { text: "Fatou", agreement: 1 },
  { text: "La fillette", agreement: 1 },
  { text: "Ma tante", agreement: 1 },
  { text: "La maîtresse", agreement: 1 },
  { text: "Binta", agreement: 1 },
  { text: "Khady", agreement: 1 },
  { text: "Les pêcheurs", agreement: 2 },
  { text: "Mes cousins", agreement: 2 },
  { text: "Moussa et Sidy", agreement: 2 },
  { text: "Les garçons", agreement: 2 },
  { text: "Modou et Cheikh", agreement: 2 },
  { text: "Les voisins", agreement: 2 },
  { text: "Les fillettes", agreement: 3 },
  { text: "Mes cousines", agreement: 3 },
  { text: "Fatou et Binta", agreement: 3 },
  { text: "Les voisines", agreement: 3 },
  { text: "Khady et Mariama", agreement: 3 },
  { text: "Les filles", agreement: 3 },
];
const subjectsOf = (...agreements: Agreement[]) => SUBJECTS.filter((subject) => agreements.includes(subject.agreement));
const ETRE_VERBS: readonly { inf: string; comp: string }[] = [
  { inf: "arriver", comp: "ce matin" },
  { inf: "partir", comp: "au marché" },
  { inf: "tomber", comp: "dans la cour" },
  { inf: "sortir", comp: "de la case" },
  { inf: "entrer", comp: "dans la classe" },
  { inf: "rester", comp: "à la maison" },
  { inf: "venir", comp: "hier" },
  { inf: "descendre", comp: "du car" },
  { inf: "monter", comp: "sur le toit" },
  { inf: "aller", comp: "au puits" },
  { inf: "retourner", comp: "au village" },
];
const ETRE_STAGES: readonly (readonly Subject[])[] = [subjectsOf(0, 1), subjectsOf(0, 1, 2), subjectsOf(1, 2, 3), subjectsOf(0, 1, 2, 3), SUBJECTS];

type ParticipleCase = { sentence: (form: string) => string; infinitive: string; answer: string; wrong: [string, string]; fact: string };

function etreCase(stage: number, index: number): ParticipleCase {
  const verb = cycle(ETRE_VERBS, stage * 3 + index * 5);
  const subject = cycle(ETRE_STAGES[stage], stage * 7 + index * 5 + 2);
  const forms = PARTICIPLES[verb.inf];
  const answer = forms[subject.agreement];
  const aux = subject.agreement >= 2 ? "sont" : "est";
  const preferred = [0, 1 + ((stage + index) % 3), 2, 3, 1].filter((i) => i !== subject.agreement);
  return {
    sentence: (form) => `${subject.text} ${aux} ${form} ${verb.comp}.`,
    infinitive: verb.inf,
    answer,
    wrong: wrongForms(forms, answer, preferred),
    fact: `part:${verb.inf}`,
  };
}

// ---------------------------------------------------------------------------
// Avec « avoir » : le participe s'accorde avec le complément d'objet direct, s'il est placé avant
// ---------------------------------------------------------------------------

type Noun = { sing: string; plur: string; gender: "m" | "f" };
const NOUNS: Record<string, Noun> = {
  mangue: { sing: "mangue", plur: "mangues", gender: "f" },
  fleur: { sing: "fleur", plur: "fleurs", gender: "f" },
  banane: { sing: "banane", plur: "bananes", gender: "f" },
  orange: { sing: "orange", plur: "oranges", gender: "f" },
  poisson: { sing: "poisson", plur: "poissons", gender: "m" },
  panier: { sing: "panier", plur: "paniers", gender: "m" },
  pagne: { sing: "pagne", plur: "pagnes", gender: "m" },
  ballon: { sing: "ballon", plur: "ballons", gender: "m" },
  livre: { sing: "livre", plur: "livres", gender: "m" },
  cahier: { sing: "cahier", plur: "cahiers", gender: "m" },
  lettre: { sing: "lettre", plur: "lettres", gender: "f" },
  histoire: { sing: "histoire", plur: "histoires", gender: "f" },
  chanson: { sing: "chanson", plur: "chansons", gender: "f" },
  phrase: { sing: "phrase", plur: "phrases", gender: "f" },
};
/** Chaque verbe n'est posé qu'avec des objets qui vont avec lui. */
const OBJECTS: Record<string, readonly string[]> = {
  cueillir: ["mangue", "fleur", "banane", "orange"],
  acheter: ["mangue", "poisson", "panier", "pagne", "ballon", "livre", "cahier", "orange"],
  manger: ["mangue", "poisson", "banane", "orange"],
  écrire: ["lettre", "histoire", "chanson", "phrase", "livre"],
  lire: ["livre", "lettre", "histoire", "phrase"],
  prendre: ["panier", "ballon", "livre", "cahier", "pagne"],
  perdre: ["ballon", "cahier", "livre", "pagne", "panier"],
  voir: ["poisson", "fleur", "pagne", "ballon"],
  ouvrir: ["panier", "livre", "cahier", "lettre"],
};
const OBJECT_VERBS = Object.keys(OBJECTS);
const AVOIR_SUBJECTS = ["Fatou", "Moussa", "Binta", "Sidy", "Khady", "Cheikh", "Mariama", "Modou", "ma mère", "mon père", "ma tante", "mon oncle"] as const;
const INTRANSITIVE: readonly { inf: string; comp: string }[] = [
  { inf: "dormir", comp: "sous le baobab" },
  { inf: "marcher", comp: "sur le chemin" },
  { inf: "courir", comp: "vers la plage" },
  { inf: "chanter", comp: "sous le manguier" },
  { inf: "travailler", comp: "dans le champ" },
  { inf: "jouer", comp: "dans la cour" },
];
const INTRANSITIVE_SUBJECTS: readonly Subject[] = [
  { text: "Fatou", agreement: 1 },
  { text: "Les filles", agreement: 3 },
  { text: "Moussa", agreement: 0 },
  { text: "Mes cousines", agreement: 3 },
  { text: "Les garçons", agreement: 2 },
  { text: "Binta et Khady", agreement: 3 },
  { text: "La maîtresse", agreement: 1 },
  { text: "Mes cousins", agreement: 2 },
];

type AvoirShape = "avant" | "pronom" | "apres" | "sans";
/** Les formes de phrase de chaque palier, du plus simple au plus difficile. */
const AVOIR_SHAPES: readonly (readonly AvoirShape[])[] = [
  ["apres", "sans"],
  ["avant", "apres"],
  ["avant", "sans"],
  ["pronom", "avant"],
  ["avant", "pronom", "apres", "sans"],
];
/** Pour chaque palier : le nombre des objets (0 = singulier, 1 = pluriel, 2 = les deux). */
const AVOIR_NUMBER: readonly number[] = [2, 0, 1, 1, 2];

function avoirCase(stage: number, index: number): ParticipleCase {
  const shape = cycle(AVOIR_SHAPES[stage], index);
  if (shape === "sans") {
    const verb = cycle(INTRANSITIVE, stage * 2 + index * 3);
    const subject = cycle(INTRANSITIVE_SUBJECTS, stage * 3 + index * 5 + 1);
    const forms = PARTICIPLES[verb.inf];
    const aux = subject.agreement >= 2 ? "ont" : "a";
    return {
      sentence: (form) => `${subject.text} ${aux} ${form} ${verb.comp}.`,
      infinitive: verb.inf,
      answer: forms[0],
      wrong: wrongForms(forms, forms[0], [subject.agreement, 1, 3, 2]),
      fact: `part:${verb.inf}`,
    };
  }
  const verb = cycle(OBJECT_VERBS, stage * 4 + index * 5);
  const noun = NOUNS[cycle(OBJECTS[verb], stage * 2 + index * 3)];
  const owner = cycle(AVOIR_SUBJECTS, stage * 5 + index * 7);
  const forms = PARTICIPLES[verb];
  // Au singulier, « le » et « la » s'élident devant une voyelle ou un h (« l'histoire ») et cachent le genre : ces noms se posent au pluriel.
  const wantedPlural = AVOIR_NUMBER[stage] === 2 ? (index + stage) % 2 === 1 : AVOIR_NUMBER[stage] === 1;
  const plural = wantedPlural || (shape === "avant" && startsWithVowel(noun.sing));
  const agreement: Agreement = plural ? (noun.gender === "m" ? 2 : 3) : noun.gender === "m" ? 0 : 1;
  if (shape === "apres") {
    const indefinite = plural ? "des" : noun.gender === "m" ? "un" : "une";
    return {
      sentence: (form) => `${cap(owner)} a ${form} ${indefinite} ${plural ? noun.plur : noun.sing}.`,
      infinitive: verb,
      answer: forms[0],
      wrong: wrongForms(forms, forms[0], [agreement, 1, 3, 2]),
      fact: `part:${verb}`,
    };
  }
  const definite = plural ? "les" : noun.gender === "m" ? "le" : "la";
  const word = plural ? noun.plur : noun.sing;
  const answer = forms[agreement];
  const wrong = wrongForms(forms, answer, [0, 1 + ((stage + index) % 3), 2, 3]);
  if (shape === "pronom" && plural) {
    return { sentence: (form) => `${cap(definite)} ${word}, ${owner} les a ${form}.`, infinitive: verb, answer, wrong, fact: `part:${verb}` };
  }
  return { sentence: (form) => `Voici ${definite} ${word} que ${owner} a ${form}.`, infinitive: verb, answer, wrong, fact: `part:${verb}` };
}

const CASES_PER_STAGE = 8;
/** Les phrases d'une liste sont toutes différentes : une phrase déjà prise est sautée. */
const PARTICIPLE_CASES = (make: (stage: number, index: number) => ParticipleCase, offset: number): ParticipleCase[] => {
  const seen = new Set<string>();
  return ETRE_STAGES.flatMap((_, stage) => {
    const out: ParticipleCase[] = [];
    for (let index = offset; out.length < CASES_PER_STAGE && index < offset + 600; index++) {
      const made = make(stage, index);
      const key = `${made.sentence("___")}|${made.infinitive}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(made);
    }
    return out;
  });
};

// ---------------------------------------------------------------------------
// Compléter une phrase avec « être » (trou)
// ---------------------------------------------------------------------------

const ETRE_HINTS = hints("Cherche le sujet de la phrase.", "Avec être, le participe passé s'accorde avec le sujet.", "Demande-toi si le sujet est masculin ou féminin, singulier ou pluriel.");
const etreGapRow = (c: ParticipleCase): GapRow => gr(`${c.sentence("___")} (${c.infinitive})`, c.answer, c.wrong, ETRE_HINTS, c.fact);
export const ETRE_ROWS: readonly GapRow[] = PARTICIPLE_CASES(etreCase, 0).map(etreGapRow);
export function makeCm2CfeEtre(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-cfe-etre", CONCEPT_PARTICIPLE, ETRE_ROWS, 1, 0, "Complète la phrase avec le participe passé du verbe.");
}

// ---------------------------------------------------------------------------
// Avec « avoir » : quelle phrase est bien écrite ?
// ---------------------------------------------------------------------------

const AVOIR_HINTS = hints(
  "Cherche le verbe avoir et le participe passé qui le suit.",
  "Le participe passé s'accorde avec le complément d'objet direct, mais seulement s'il est placé avant.",
  "Pose la question « quoi ? » après le verbe pour trouver ce complément.",
);
function avoirQuestionRow(c: ParticipleCase): QuestionRow {
  return qr("Quelle phrase est bien écrite ?", c.sentence(c.answer), [c.sentence(c.wrong[0]), c.sentence(c.wrong[1])], AVOIR_HINTS, c.fact);
}
export const AVOIR_ROWS: readonly QuestionRow[] = PARTICIPLE_CASES(avoirCase, 0).map(avoirQuestionRow);
export function makeCm2CfeAvoir(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-cfe-avoir", CONCEPT_PARTICIPLE, AVOIR_ROWS, 1, (row) => row.answer);
}

// ---------------------------------------------------------------------------
// Écrire le participe passé (avec être ou avec avoir)
// ---------------------------------------------------------------------------

const WRITE_PARTICIPLE_HINTS = hints(
  "Cherche le verbe avoir ou le verbe être dans la phrase.",
  "Avec être, le participe passé s'accorde avec le sujet.",
  "Avec avoir, il s'accorde seulement avec le complément d'objet direct placé avant le verbe.",
);
const participleWriteRow = (c: ParticipleCase): WriteRow =>
  wr(`Dans la phrase « ${c.sentence("___")} », écris le participe passé du verbe ${c.infinitive}.`, [c.answer], WRITE_PARTICIPLE_HINTS, c.fact);
/** Un tiers de lignes avec « être », deux tiers avec « avoir » : la liste suit les paliers. */
export const PARTICIPLE_WRITE_ROWS: readonly WriteRow[] = PARTICIPLE_CASES((stage, index) => (index % 3 === 0 ? etreCase(stage, index) : avoirCase(stage, index)), 3).map(participleWriteRow);
export function makeCm2CfeParticipleWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-cfe-participe", CONCEPT_PARTICIPLE, PARTICIPLE_WRITE_ROWS);
}

// ===========================================================================
// LES HOMOPHONES GRAMMATICAUX
// ===========================================================================

type Homophone = { family: string; text: string; answer: string; wrong: [string, string] };
const H = (family: string, text: string, answer: string, wrong: [string, string]): Homophone => ({ family, text, answer, wrong });

export const HOMOPHONES: readonly Homophone[] = [
  // Palier 1 : a / à / as, et / est.
  H("a", "Fatou ___ un beau cahier.", "a", ["à", "as"]),
  H("a", "Nous allons ___ la plage.", "à", ["a", "as"]),
  H("a", "Tu ___ de la chance.", "as", ["a", "à"]),
  H("a", "Le chat ___ très faim.", "a", ["à", "as"]),
  H("a", "Moussa pense ___ son frère.", "à", ["a", "as"]),
  H("et", "Moussa ___ Binta jouent dans la cour.", "et", ["est", "es"]),
  H("et", "Le riz ___ chaud.", "est", ["et", "es"]),
  H("et", "Il mange du riz ___ du poisson.", "et", ["est", "es"]),
  H("et", "La mangue ___ mûre.", "est", ["et", "es"]),
  H("et", "Le ciel ___ bleu.", "est", ["et", "es"]),
  // Palier 2 : on / ont, son / sont.
  H("on", "Les enfants ___ faim.", "ont", ["on", "an"]),
  H("on", "Dans ce village, ___ parle wolof.", "on", ["ont", "an"]),
  H("on", "Les filles ___ chanté une chanson.", "ont", ["on", "an"]),
  H("on", "Demain, ___ part au marché.", "on", ["ont", "an"]),
  H("on", "Mes cousins ___ un grand champ.", "ont", ["on", "an"]),
  H("son", "Fatou range ___ cartable.", "son", ["sont", "ont"]),
  H("son", "Les mangues ___ mûres.", "sont", ["son", "ont"]),
  H("son", "Moussa aime ___ grand frère.", "son", ["sont", "ont"]),
  H("son", "Mes cousins ___ au marché.", "sont", ["son", "ont"]),
  H("son", "Binta cherche ___ cahier.", "son", ["sont", "ont"]),
  // Palier 3 : ou / où, ce / se.
  H("ou", "Veux-tu du riz ___ du mil ?", "ou", ["où", "on"]),
  H("ou", "Dis-moi ___ tu vas.", "où", ["ou", "on"]),
  H("ou", "Tu bois du thé ___ du lait ?", "ou", ["où", "on"]),
  H("ou", "Voici le champ ___ papa travaille.", "où", ["ou", "on"]),
  H("ou", "Je ne sais pas ___ est mon cahier.", "où", ["ou", "on"]),
  H("ce", "Fatou ___ lave les mains.", "se", ["ce", "sa"]),
  H("ce", "Je prends ___ livre.", "ce", ["se", "sa"]),
  H("ce", "Le soleil ___ lève tôt.", "se", ["ce", "sa"]),
  H("ce", "Regarde ___ beau poisson.", "ce", ["se", "sa"]),
  H("ce", "Le petit chat ___ cache sous le lit.", "se", ["ce", "sa"]),
  // Palier 4 : sa / ça, mais / mes / met.
  H("sa", "Binta lave ___ robe.", "sa", ["ça", "ce"]),
  H("sa", "Tu fais ___ très bien.", "ça", ["sa", "ce"]),
  H("sa", "Fatou range ___ chambre.", "sa", ["ça", "ce"]),
  H("sa", "Moussa aime ___ mangue.", "sa", ["ça", "ce"]),
  H("sa", "Ils disent que ___ va mieux.", "ça", ["sa", "ce"]),
  H("mais", "Il pleut, ___ nous sortons.", "mais", ["mes", "met"]),
  H("mais", "Fatou range ___ cahiers.", "mes", ["mais", "met"]),
  H("mais", "Maman ___ le riz dans le plat.", "met", ["mes", "mais"]),
  H("mais", "Je voulais venir, ___ je suis malade.", "mais", ["mes", "met"]),
  H("mais", "Binta prend ___ livres.", "mes", ["mais", "met"]),
  // Palier 5 : peu / peut / peux, et des mots des paliers précédents.
  H("peu", "Tu ___ venir avec nous.", "peux", ["peut", "peu"]),
  H("peu", "Le chat ___ sauter très haut.", "peut", ["peux", "peu"]),
  H("peu", "Il mange très ___ de riz.", "peu", ["peut", "peux"]),
  H("peu", "Moussa ___ nager longtemps.", "peut", ["peux", "peu"]),
  H("et", "Mon frère ___ allé au village.", "est", ["et", "es"]),
  H("mais", "Nous avons faim, ___ le riz est cuit.", "mais", ["mes", "met"]),
  H("ou", "Dis-moi ___ se trouve le marché.", "où", ["ou", "on"]),
  H("on", "Les filles ___ mis leurs sacs sur le dos.", "ont", ["on", "an"]),
  H("son", "Ils ___ partis très tôt.", "sont", ["son", "ont"]),
  H("a", "Tu ___ un beau cahier.", "as", ["a", "à"]),
];

const HOMOPHONE_HINTS: Record<string, readonly [string, string, string]> = {
  a: hints("Remplace le mot par « avait » pour voir si la phrase reste juste.", "Si « avait » convient, le mot est le verbe avoir, sans accent.", "Si « avait » ne convient pas, regarde si le sujet est « tu » : le verbe prend alors un « s »."),
  et: hints("Remplace le mot par « était » pour voir si la phrase reste juste.", "Si « était » convient, le mot est le verbe être.", "Sinon, le mot relie deux mots ou deux groupes de mots."),
  on: hints("Remplace le mot par « il » pour voir si la phrase reste juste.", "Si « il » convient, le mot s'écrit sans « t ».", "Sinon, essaie « avaient » : s'il convient, c'est le verbe avoir."),
  son: hints("Remplace le mot par « étaient » pour voir si la phrase reste juste.", "Si « étaient » convient, le mot est le verbe être et il finit par « t ».", "Sinon, essaie « mon » ou « ton » à la place."),
  ou: hints("Remplace le mot par « ou bien » pour voir si la phrase reste juste.", "Si « ou bien » convient, le mot s'écrit sans accent.", "Sinon, le mot indique un lieu et il porte un accent grave."),
  ce: hints("Regarde le mot qui suit. Est-ce un nom ou un verbe ?", "Devant un verbe, essaie « me » ou « te » à la place.", "Si la phrase reste juste avec « me » ou « te », le mot se met devant un verbe."),
  sa: hints("Remplace le mot par « cela » pour voir si la phrase reste juste.", "Si « cela » convient, le mot s'écrit avec une cédille.", "Sinon, essaie « ma » ou « ta » : le mot se met devant un nom féminin."),
  mais: hints("Remplace le mot par « pourtant » pour voir si la phrase reste juste.", "Essaie « tes » à la place : si la phrase reste juste, le mot se met devant un nom.", "Essaie « mettait » à la place : si la phrase reste juste, le mot est un verbe."),
  peu: hints("Remplace le mot par « beaucoup » pour voir si la phrase dit le contraire.", "Essaie « pouvait » à la place : si la phrase reste juste, le mot est le verbe pouvoir.", "Avec « tu » ou « je », ce verbe finit par « x » ; avec « il », il finit par « t »."),
};

export const HOMOPHONE_ROWS: readonly GapRow[] = HOMOPHONES.map((h, index) => gr(h.text, h.answer, h.wrong, HOMOPHONE_HINTS[h.family], `hom:${index}`));
export function makeCm2CfeHomophone(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-cfe-homophone", CONCEPT_HOMOPHONES, HOMOPHONE_ROWS, 1, 0, "Choisis le mot qui convient.");
}

// ===========================================================================
// LES PLURIELS DIFFICILES
// ===========================================================================

type PluralCategory = "al-aux" | "al-als" | "ail-aux" | "ail-ails" | "eau" | "au-aux" | "au-aus" | "eu-eux" | "eu-eus" | "ou-ous" | "ou-oux" | "inv" | "irr";
type Plural = { sing: string; plur: string; category: PluralCategory };
const P = (sing: string, plur: string, category: PluralCategory): Plural => ({ sing, plur, category });

export const PLURALS: Record<string, Plural> = Object.fromEntries(
  [
    P("cheval", "chevaux", "al-aux"), P("journal", "journaux", "al-aux"), P("animal", "animaux", "al-aux"), P("hôpital", "hôpitaux", "al-aux"), P("canal", "canaux", "al-aux"),
    P("signal", "signaux", "al-aux"), P("métal", "métaux", "al-aux"), P("général", "généraux", "al-aux"), P("local", "locaux", "al-aux"),
    P("bal", "bals", "al-als"), P("carnaval", "carnavals", "al-als"), P("festival", "festivals", "al-als"), P("récital", "récitals", "al-als"), P("chacal", "chacals", "al-als"), P("régal", "régals", "al-als"),
    P("corail", "coraux", "ail-aux"), P("vitrail", "vitraux", "ail-aux"), P("émail", "émaux", "ail-aux"),
    P("détail", "détails", "ail-ails"), P("chandail", "chandails", "ail-ails"), P("éventail", "éventails", "ail-ails"), P("épouvantail", "épouvantails", "ail-ails"),
    P("bateau", "bateaux", "eau"), P("gâteau", "gâteaux", "eau"), P("oiseau", "oiseaux", "eau"), P("chapeau", "chapeaux", "eau"), P("couteau", "couteaux", "eau"),
    P("rideau", "rideaux", "eau"), P("tableau", "tableaux", "eau"), P("morceau", "morceaux", "eau"), P("drapeau", "drapeaux", "eau"),
    P("tuyau", "tuyaux", "au-aux"), P("landau", "landaus", "au-aus"),
    P("feu", "feux", "eu-eux"), P("jeu", "jeux", "eu-eux"), P("neveu", "neveux", "eu-eux"), P("cheveu", "cheveux", "eu-eux"), P("vœu", "vœux", "eu-eux"),
    P("pneu", "pneus", "eu-eus"), P("bleu", "bleus", "eu-eus"),
    P("trou", "trous", "ou-ous"), P("clou", "clous", "ou-ous"), P("sou", "sous", "ou-ous"), P("fou", "fous", "ou-ous"), P("verrou", "verrous", "ou-ous"),
    P("écrou", "écrous", "ou-ous"), P("cou", "cous", "ou-ous"), P("kangourou", "kangourous", "ou-ous"),
    P("genou", "genoux", "ou-oux"), P("bijou", "bijoux", "ou-oux"), P("caillou", "cailloux", "ou-oux"), P("chou", "choux", "ou-oux"), P("hibou", "hiboux", "ou-oux"),
    P("joujou", "joujoux", "ou-oux"), P("pou", "poux", "ou-oux"),
    P("nez", "nez", "inv"), P("souris", "souris", "inv"), P("voix", "voix", "inv"), P("gaz", "gaz", "inv"), P("bras", "bras", "inv"), P("riz", "riz", "inv"), P("prix", "prix", "inv"),
    P("repas", "repas", "inv"), P("fois", "fois", "inv"), P("croix", "croix", "inv"), P("noix", "noix", "inv"), P("tapis", "tapis", "inv"), P("dos", "dos", "inv"), P("corps", "corps", "inv"),
    P("œil", "yeux", "irr"), P("monsieur", "messieurs", "irr"), P("madame", "mesdames", "irr"), P("mademoiselle", "mesdemoiselles", "irr"), P("bonhomme", "bonshommes", "irr"),
  ].map((plural) => [plural.sing, plural] as const),
);

/** Les noms de chaque palier, du plus facile au plus difficile. */
const PLURAL_STAGES: readonly (readonly string[])[] = [
  ["cheval", "journal", "animal", "bateau", "gâteau", "oiseau", "feu", "jeu", "trou", "clou", "nez", "souris", "voix"],
  ["hôpital", "canal", "chapeau", "tuyau", "cheveu", "neveu", "sou", "fou", "bijou", "chou", "riz", "prix"],
  ["genou", "caillou", "hibou", "pou", "signal", "métal", "rideau", "tableau", "corail", "vitrail", "bras", "gaz"],
  ["bal", "carnaval", "festival", "récital", "chacal", "régal", "pneu", "bleu", "landau", "détail", "éventail", "épouvantail", "repas", "fois"],
  ["émail", "œil", "monsieur", "madame", "mademoiselle", "bonhomme", "verrou", "écrou", "kangourou", "joujou", "général", "local", "croix", "noix", "tapis", "dos", "corps", "couteau", "drapeau", "morceau", "chandail", "cou", "vœu"],
];
const nounsOf = (keep: (plural: Plural) => boolean): readonly Plural[] => PLURAL_STAGES.flatMap((stage) => stage.map((sing) => PLURALS[sing]).filter(keep));

const PLURAL_HINTS: Record<PluralCategory, readonly [string, string, string]> = {
  "al-aux": hints("Regarde la fin du mot : il finit par -al.", "En général, un mot en -al change sa fin en -aux au pluriel.", "Dis le mot à plusieurs, à voix haute, et écoute la fin."),
  "al-als": hints("Regarde la fin du mot : il finit par -al.", "Presque tous les mots en -al ont un pluriel en -aux, mais celui-ci est une exception.", "Son pluriel prend un -s tout simple."),
  "ail-aux": hints("Regarde la fin du mot : il finit par -ail.", "Presque tous les mots en -ail ont un pluriel en -s tout simple.", "Celui-ci fait partie des rares mots en -ail qui prennent -aux."),
  "ail-ails": hints("Regarde la fin du mot : il finit par -ail.", "Presque tous les mots en -ail ont un pluriel en -s tout simple.", "Seuls quelques mots, comme corail ou vitrail, font -aux."),
  eau: hints("Regarde la fin du mot : il finit par -eau.", "Les mots en -eau prennent un -x au pluriel.", "Le -x ne se prononce pas, mais il s'écrit."),
  "au-aux": hints("Regarde la fin du mot : il finit par -au.", "Beaucoup de mots en -au prennent un -x au pluriel.", "Le -x ne se prononce pas, mais il s'écrit."),
  "au-aus": hints("Regarde la fin du mot : il finit par -au.", "Beaucoup de mots en -au prennent un -x, mais celui-ci est une exception.", "Son pluriel prend un -s tout simple."),
  "eu-eux": hints("Regarde la fin du mot : il finit par -eu.", "Presque tous les mots en -eu prennent un -x au pluriel.", "Seuls pneu et bleu prennent un -s."),
  "eu-eus": hints("Regarde la fin du mot : il finit par -eu.", "Presque tous les mots en -eu prennent un -x, mais celui-ci est une exception.", "Son pluriel prend un -s tout simple."),
  "ou-ous": hints("Regarde la fin du mot : il finit par -ou.", "Presque tous les mots en -ou prennent un -s au pluriel.", "Seuls sept mots, dont bijou et caillou, prennent un -x."),
  "ou-oux": hints("Regarde la fin du mot : il finit par -ou.", "Presque tous les mots en -ou prennent un -s au pluriel, mais celui-ci est une exception.", "Il fait partie des sept mots en -ou qui prennent un -x."),
  inv: hints("Regarde la fin du mot : il finit par s, x ou z.", "Un mot qui finit déjà par s, x ou z ne change pas au pluriel.", "Écris le mot comme au singulier."),
  irr: hints("Ce mot ne suit aucune règle habituelle.", "Il change de forme, pas seulement de fin.", "Apprends ce pluriel par cœur."),
};

/** Les deux mauvais choix d'un pluriel : une faute que fait vraiment un enfant, jamais un autre pluriel admis du mot. */
function wrongPlurals(plural: Plural): [string, string] {
  const { sing } = plural;
  switch (plural.category) {
    case "al-aux":
      return [`${sing}s`, `${sing.slice(0, -2)}aus`];
    case "al-als":
      return [`${sing.slice(0, -2)}aux`, `${sing}x`];
    case "ail-aux":
      return [`${sing}s`, `${sing.slice(0, -3)}aus`];
    case "ail-ails":
      return [`${sing.slice(0, -3)}aux`, `${sing}x`];
    case "eau":
    case "au-aux":
    case "eu-eux":
    case "ou-oux":
      return [`${sing}s`, sing];
    case "au-aus":
    case "eu-eus":
    case "ou-ous":
      return [`${sing}x`, sing];
    default:
      return [`${sing}s`, `${sing}x`];
  }
}

export const PLURAL_QUESTION_ROWS: readonly QuestionRow[] = nounsOf((plural) => plural.category !== "inv").map((plural) =>
  qr(`Quel est le pluriel du mot « ${plural.sing} » ?`, plural.plur, wrongPlurals(plural), PLURAL_HINTS[plural.category], `plu:${plural.sing}`),
);
export function makeCm2CfePlural(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-cfe-pluriel", CONCEPT_PLURALS, PLURAL_QUESTION_ROWS);
}

// ---------------------------------------------------------------------------
// Relier un nom à son pluriel
// ---------------------------------------------------------------------------

const PLURAL_LINK_HINTS = hints("Regarde la fin de chaque mot.", "Un mot en -al prend souvent -aux, mais pas toujours.", "Commence par le pluriel dont tu es sûr.");
function pluralLinkRow(rank: number, n: number): LinkRow {
  const pool = PLURAL_STAGES[rank].map((sing) => PLURALS[sing]).filter((plural) => plural.category !== "inv");
  const picked: Plural[] = [];
  for (let j = 0; picked.length < 4 && j < pool.length * 4; j++) {
    const candidate = pool[(n * 3 + j * 2 + rank) % pool.length];
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return {
    prompt: "Relie chaque mot à son pluriel.",
    pairs: picked.map((plural) => ({ left: plural.sing, right: plural.plur })),
    hints: PLURAL_LINK_HINTS,
    fact: `plu-relier:${picked.map((plural) => plural.sing).join(",")}`,
  };
}
/** Six lignes par palier, jamais deux fois les mêmes quatre mots. */
export const PLURAL_LINK_ROWS: readonly LinkRow[] = (() => {
  const seen = new Set<string>();
  return PLURAL_STAGES.flatMap((_, rank) => {
    const out: LinkRow[] = [];
    for (let n = 0; out.length < 6 && n < 600; n++) {
      const row = pluralLinkRow(rank, n);
      const key = [...row.pairs.map((pair) => pair.left)].sort().join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  });
})();
export function makeCm2CfePluralLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-cfe-relier", CONCEPT_PLURALS, PLURAL_LINK_ROWS);
}

// ---------------------------------------------------------------------------
// Glisser des noms dans « pluriel en -s » ou « pluriel en -x »
// ---------------------------------------------------------------------------

const ZONE_S = "Pluriel en -s";
const ZONE_X = "Pluriel en -x";
const SORT_HINTS = hints("Imagine plusieurs de ces choses et regarde la fin du mot écrit.", "Beaucoup de mots en -ou et en -eau se terminent par un x.", "Pour un mot en -al, essaie de le dire à plusieurs : on entend -aux.");
const SORT_S = ["trou", "clou", "sou", "fou", "verrou", "écrou", "cou", "kangourou", "bal", "carnaval", "festival", "récital", "chacal", "régal", "pneu", "bleu", "landau", "détail", "chandail", "éventail", "épouvantail"];
const SORT_X = ["cheval", "journal", "animal", "bateau", "gâteau", "oiseau", "feu", "jeu", "hôpital", "canal", "chapeau", "tuyau", "cheveu", "neveu", "bijou", "chou", "genou", "caillou", "hibou", "pou", "signal", "métal", "rideau", "tableau", "corail", "vitrail", "émail", "général", "local", "couteau", "drapeau", "morceau", "vœu", "joujou"];
export const PLURAL_SORT_ROWS: readonly SortRow[] = [0, 1, 2, 3, 4].flatMap((rank) => sortRows("Glisse chaque mot dans la bonne case.", [ZONE_S, ZONE_X], SORT_S.slice(rank * 4, rank * 4 + 5), SORT_X.slice(rank * 7, rank * 7 + 7), SORT_HINTS, 6));
export function makeCm2CfePluralSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-cfe-glisser", CONCEPT_PLURALS, PLURAL_SORT_ROWS);
}

// ===========================================================================
// LES TERMINAISONS -é / -er / -ez / -ait
// ===========================================================================

type EndingKind = "infinitif" | "participe" | "vous" | "imparfait";
const ENDING_VERBS: readonly { inf: string; comp: string }[] = [
  { inf: "chanter", comp: "une chanson" },
  { inf: "jouer", comp: "au ballon" },
  { inf: "regarder", comp: "le match" },
  { inf: "écouter", comp: "la radio" },
  { inf: "danser", comp: "sur la place" },
  { inf: "travailler", comp: "dans le champ" },
  { inf: "marcher", comp: "sur le chemin" },
  { inf: "laver", comp: "la vaisselle" },
  { inf: "porter", comp: "un seau" },
  { inf: "parler", comp: "au chef" },
  { inf: "donner", comp: "du riz" },
  { inf: "trouver", comp: "un coquillage" },
  { inf: "pêcher", comp: "des sardines" },
  { inf: "cultiver", comp: "du mil" },
  { inf: "cuisiner", comp: "le repas" },
  { inf: "raconter", comp: "une histoire" },
];
const ENDING_NAMES = ["Fatou", "Moussa", "Binta", "Sidy", "Khady", "Modou"] as const;
const INFINITIVE_FRAMES = [
  (name: string, verb: string) => `${name} va ___ (${verb})`,
  (name: string, verb: string) => `${name} veut ___ (${verb})`,
  (name: string, verb: string) => `${name} doit ___ (${verb})`,
  (name: string, verb: string) => `${name} part sans ___ (${verb})`,
  (name: string, verb: string) => `${name} commence à ___ (${verb})`,
] as const;
const IMPERFECT_OPENINGS = ["Chaque soir, ", "Autrefois, ", "Chaque matin, ", "Quand il faisait beau, "] as const;
const ENDING_KINDS: readonly (readonly EndingKind[])[] = [
  ["infinitif", "participe"],
  ["infinitif", "participe", "vous"],
  ["infinitif", "participe", "vous", "imparfait"],
  ["participe", "imparfait", "infinitif", "vous"],
  ["imparfait", "vous", "participe", "infinitif"],
];
const ENDING_HINTS = hints(
  "Remplace le verbe par « vendre » : si la phrase reste juste, tu écris l'infinitif.",
  "Remplace le verbe par « vendu » ou « pris » : si la phrase reste juste, tu écris le participe passé.",
  "Cherche le sujet. Avec « vous », la fin est -ez ; avec « il » ou « elle » au passé, la fin est -ait.",
);

function endingRow(stage: number, index: number): GapRow {
  const kind = cycle(ENDING_KINDS[stage], index);
  const verb = cycle(ENDING_VERBS, stage * 5 + index * 3 + (kind === "vous" ? 1 : 0));
  const name = cycle(ENDING_NAMES, stage * 2 + index * 5);
  const stem = verb.inf.slice(0, -2);
  const forms: Record<EndingKind, string> = { infinitif: verb.inf, participe: `${stem}é`, vous: `${stem}ez`, imparfait: `${stem}ait` };
  const texts: Record<EndingKind, string> = {
    infinitif: `${cycle(INFINITIVE_FRAMES, stage + index * 2)(name, verb.inf)} ${verb.comp}.`,
    participe: `${name} a ___ (${verb.inf}) ${verb.comp}.`,
    vous: `Maintenant, vous ___ (${verb.inf}) ${verb.comp}.`,
    imparfait: `${cycle(IMPERFECT_OPENINGS, stage + index)}${name} ___ (${verb.inf}) ${verb.comp}.`,
  };
  const wrong: Record<EndingKind, [string, string]> = {
    infinitif: [forms.participe, forms.vous],
    participe: [forms.infinitif, forms.vous],
    vous: [forms.infinitif, forms.participe],
    imparfait: [forms.infinitif, forms.participe],
  };
  return gr(texts[kind], forms[kind], wrong[kind], ENDING_HINTS, `ter:${verb.inf}:${kind}`);
}
export const ENDING_ROWS: readonly GapRow[] = (() => {
  const seen = new Set<string>();
  return ENDING_KINDS.flatMap((_, stage) => {
    const out: GapRow[] = [];
    for (let index = 0; out.length < 8 && index < 600; index++) {
      const row = endingRow(stage, index);
      if (seen.has(row.text)) continue;
      seen.add(row.text);
      out.push(row);
    }
    return out;
  });
})();
export function makeCm2CfeEnding(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-cfe-terminaison", CONCEPT_ENDINGS, ENDING_ROWS, 1, 0, "Écris le verbe de la parenthèse comme il faut.");
}

// ===========================================================================
// LA CONJUGAISON DES VERBES USUELS À L'INDICATIF
// ===========================================================================

const verbOf = (inf: string): Verb => VERBS.find((verb) => verb.inf === inf) as Verb;
const POOL_1 = ["chanter", "jouer", "être", "avoir", "finir"];
const POOL_2 = [...POOL_1, "manger", "choisir", "aller", "faire"];
const POOL_3 = [...POOL_2, "prendre", "venir", "voir", "dire"];
const POOL_4 = [...POOL_3, "pouvoir", "savoir"];
type Stage = { verbs: readonly string[]; tenses: readonly Tense[] };
const STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["présent"] },
  { verbs: POOL_2, tenses: ["présent", "futur"] },
  { verbs: POOL_3, tenses: ["présent", "futur", "imparfait"] },
  { verbs: POOL_4, tenses: ["imparfait", "passé composé", "futur", "présent"] },
  { verbs: POOL_4, tenses: ["passé composé", "imparfait", "futur", "présent"] },
];
const PRONOUN = ["je", "tu", "il", "nous", "vous", "ils"] as const;
const IN_TENSE: Partial<Record<Tense, string>> = { présent: "au présent", imparfait: "à l'imparfait", futur: "au futur simple", "passé composé": "au passé composé" };

type Cell = { verb: Verb; tense: Tense; person: number };
/** `count` cases différentes d'un palier, prises à partir de `seed` ; les cases refusées sont sautées. */
function conjugationCells(stage: Stage, count: number, seed: number): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>();
  for (let j = 0; out.length < count && j < 800; j++) {
    const verb = verbOf(stage.verbs[(seed * 3 + j * 7) % stage.verbs.length]);
    const tense = stage.tenses[(seed + j * 3) % stage.tenses.length];
    const wanted = (seed * 2 + j * 5) % 6;
    for (let shift = 0; shift < 6; shift++) {
      const person = (wanted + shift) % 6;
      const key = `${verb.inf}|${tense}|${person}`;
      if (seen.has(key) || !canUse(verb, tense, person)) continue;
      seen.add(key);
      out.push({ verb, tense, person });
      break;
    }
  }
  return out;
}
const conjugationLadder = (seed: number): Cell[] => STAGES.flatMap((stage, rank) => conjugationCells(stage, 6, seed + rank));
const conjugationFact = (cell: Cell, kind: string) => `cfe-conj:${kind}:${cell.verb.inf}:${cell.tense}:${cell.person}`;

const CONJUGATE_HINTS = hints("Pense à la personne de la phrase.", "Le début du verbe reste presque le même, la fin change.", "Écris seulement le verbe, sans le pronom.");
const conjugateRow = (cell: Cell): WriteRow =>
  wr(`Écris le verbe ${cell.verb.inf} ${IN_TENSE[cell.tense]} avec ${PRONOUN[cell.person]}.`, [formOf(cell.verb, cell.tense, cell.person)], CONJUGATE_HINTS, conjugationFact(cell, "ecrire"));
export const CONJUGATE_ROWS: readonly WriteRow[] = conjugationLadder(1).map(conjugateRow);
export function makeCm2CfeConjugate(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-cfe-conjuguer", CONCEPT_CONJUGATION, CONJUGATE_ROWS);
}

// ---------------------------------------------------------------------------
// Ranger les personnes d'un verbe
// ---------------------------------------------------------------------------

const ORDER_HINTS = hints("Les personnes se suivent toujours dans le même ordre.", "Commence par celui qui parle, puis celui à qui on parle.", "Les personnes du pluriel viennent après celles du singulier.");
const PERSON_SETS: readonly (readonly number[])[] = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [0, 2, 3, 5], [0, 1, 4, 5], [1, 2, 4, 5], [0, 3, 4, 5], [0, 1, 2, 5]];
/** Un pronom devant la forme : « tu chantes », « j'ai chanté ». */
const pronounTile = (person: number, form: string) => (person === 0 ? (startsWithVowel(form) ? `j'${form}` : `je ${form}`) : `${PRONOUN[person]} ${form}`);
function orderRow(cell: Cell, index: number): OrderRow {
  const set = cycle(PERSON_SETS, index);
  return ordr(
    `Range ces formes du verbe ${cell.verb.inf} ${IN_TENSE[cell.tense]} selon la personne, de je à ils.`,
    set.map((person) => pronounTile(person, formOf(cell.verb, cell.tense, person))),
    ORDER_HINTS,
    conjugationFact({ ...cell, person: set[0] }, "ranger"),
  );
}
/** Un verbe, un temps et un ensemble de personnes ne reviennent pas deux fois : l'ensemble change quand la ligne est déjà prise. */
export const ORDER_ROWS: readonly OrderRow[] = (() => {
  const seen = new Set<string>();
  return conjugationLadder(7).map((cell, index) => {
    for (let shift = 0; shift < PERSON_SETS.length; shift++) {
      const row = orderRow(cell, index + shift);
      const key = `${row.prompt}|${row.sequence.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      return row;
    }
    return orderRow(cell, index);
  });
})();
export function makeCm2CfeOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm2-cfe-ranger", CONCEPT_CONJUGATION, ORDER_ROWS);
}
