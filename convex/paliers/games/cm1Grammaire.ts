/**
 * LES GABARITS DE GRAMMAIRE DU CM1 : nature et fonction des mots, types et formes de phrases (`fr-cm1-grammaire`).
 *
 * La fiche demande la nature des mots (nom, déterminant, adjectif, verbe, adverbe, pronom), leurs fonctions (sujet, COD, COI, attribut du sujet,
 * compléments circonstanciels), les types de phrases (déclarative, interrogative, exclamative, impérative) et leurs formes (affirmative, négative).
 * Ici chaque exercice est BÂTI à partir d'un corpus fermé de phrases analysées à la main (le sujet, le verbe, le COD, le COI, l'attribut, les
 * compléments circonstanciels et leur sens, la nature de chaque mot demandé), jamais écrit par le modèle. La phrase est TOUJOURS donnée : un mot
 * qui peut être un nom ou un verbe (« porte », « marche ») n'est demandé que dans une phrase qui ne laisse qu'une lecture.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Une phrase n'a qu'une analyse : aucune phrase du corpus n'a deux lectures (« Elle ferme la ferme »), et le groupe demandé n'a qu'une fonction.
 * - Un complément circonstanciel se déplace ou se supprime : on le demande par son sens (lieu, temps, manière), jamais par sa place.
 * - « jouer au ballon », « parler à Moussa » : un complément en à est un COI quand le verbe se construit avec à et que le complément est une personne ;
 *   « aller au marché » est un lieu. Les phrases sont choisies pour que la différence se lise.
 * - Le pronom qui remplace un COD est le, la ou les (selon le genre et le nombre du groupe remplacé), un COI de personne lui ou leur. La phrase à trou ne
 *   remplace qu'un complément, et jamais un verbe qui commence par une voyelle (« l'écoute », où le pronom s'élide).
 * - Une QCM n'a que trois choix : « affirmative ou négative » (deux seulement) se demande donc en glissé, ou en choisissant la phrase négative parmi trois.
 * - Le contrôleur voit une bonne option plus de deux fois plus longue que les autres : « Déterminant » (11 lettres) ne côtoie jamais deux mots courts,
 *   « Complément circonstanciel » ne côtoie jamais seulement « Sujet » et « COD ».
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot
 * de quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 30 lignes pour cinq paliers).
 *
 * HORS FICHE, À FAIRE RELIRE : les quarante phrases du corpus et leur analyse, les trente compléments circonstanciels, les trente attributs, les trente
 * phrases du pronom, les cinq cents mots des glissés, les phrases de la vie courante (le marché, le baobab, la pirogue).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

export type Nature = "Nom" | "Déterminant" | "Adjectif" | "Verbe" | "Adverbe" | "Pronom";
export type Kind = "déclarative" | "interrogative" | "exclamative" | "impérative";
export type CcKind = "lieu" | "temps" | "manière";
export type Sentence = {
  text: string;
  kind: Kind;
  negative: boolean;
  /** Absent d'une phrase impérative. */
  subject?: string;
  verb: string;
  cod?: string;
  coi?: string;
  attribute?: string;
  cc: readonly (readonly [string, CcKind])[];
  /** Les mots demandés avec leur nature (ceux qui n'ont qu'une lecture dans la phrase). */
  words: readonly (readonly [string, Nature])[];
};

const KIND_OF = { d: "déclarative", i: "interrogative", e: "exclamative", p: "impérative" } as const;
type Parts = { s?: string; v: string; cod?: string; coi?: string; att?: string; cc?: readonly (readonly [string, CcKind])[]; neg?: true };
function sent(text: string, kind: keyof typeof KIND_OF, parts: Parts, words: string): Sentence {
  return {
    text,
    kind: KIND_OF[kind],
    negative: parts.neg === true,
    subject: parts.s,
    verb: parts.v,
    cod: parts.cod,
    coi: parts.coi,
    attribute: parts.att,
    cc: parts.cc ?? [],
    words: words.split(" ").map((entry) => entry.split(":") as unknown as readonly [string, Nature]),
  };
}

// ===========================================================================
// LE CORPUS : quarante phrases, huit par palier, de plus en plus riches
// ===========================================================================

export const CORPUS: readonly Sentence[] = [
  // Palier 1 : sujet, verbe, COD.
  sent("Awa mange une mangue.", "d", { s: "Awa", v: "mange", cod: "une mangue" }, "Awa:Nom mange:Verbe une:Déterminant mangue:Nom"),
  sent("Moussa lance le filet.", "d", { s: "Moussa", v: "lance", cod: "le filet" }, "Moussa:Nom le:Déterminant filet:Nom"),
  sent("Les enfants chantent une chanson.", "d", { s: "Les enfants", v: "chantent", cod: "une chanson" }, "Les:Déterminant enfants:Nom chantent:Verbe une:Déterminant chanson:Nom"),
  sent("Le pêcheur porte un seau.", "d", { s: "Le pêcheur", v: "porte", cod: "un seau" }, "Le:Déterminant pêcheur:Nom un:Déterminant seau:Nom"),
  sent("Ma sœur prépare le repas.", "d", { s: "Ma sœur", v: "prépare", cod: "le repas" }, "Ma:Déterminant sœur:Nom prépare:Verbe le:Déterminant repas:Nom"),
  sent("Omar regarde la télévision.", "d", { s: "Omar", v: "regarde", cod: "la télévision" }, "Omar:Nom regarde:Verbe la:Déterminant télévision:Nom"),
  sent("Les femmes vendent des mangues.", "d", { s: "Les femmes", v: "vendent", cod: "des mangues" }, "Les:Déterminant femmes:Nom vendent:Verbe des:Déterminant mangues:Nom"),
  sent("Le chef donne du riz.", "d", { s: "Le chef", v: "donne", cod: "du riz" }, "Le:Déterminant chef:Nom donne:Verbe du:Déterminant riz:Nom"),
  // Palier 2 : des compléments de lieu, de temps, de manière.
  sent("Hier, Awa a lavé la vaisselle.", "d", { s: "Awa", v: "a lavé", cod: "la vaisselle", cc: [["Hier", "temps"]] }, "Hier:Adverbe Awa:Nom la:Déterminant vaisselle:Nom"),
  sent("Moussa dort sous le baobab.", "d", { s: "Moussa", v: "dort", cc: [["sous le baobab", "lieu"]] }, "Moussa:Nom dort:Verbe le:Déterminant baobab:Nom"),
  sent("Les enfants jouent dans la cour.", "d", { s: "Les enfants", v: "jouent", cc: [["dans la cour", "lieu"]] }, "Les:Déterminant enfants:Nom jouent:Verbe la:Déterminant cour:Nom"),
  sent("Le pêcheur lance son filet dans la mer.", "d", { s: "Le pêcheur", v: "lance", cod: "son filet", cc: [["dans la mer", "lieu"]] }, "Le:Déterminant pêcheur:Nom son:Déterminant filet:Nom la:Déterminant mer:Nom"),
  sent("Ce matin, Fatou vend des légumes.", "d", { s: "Fatou", v: "vend", cod: "des légumes", cc: [["Ce matin", "temps"]] }, "Ce:Déterminant Fatou:Nom vend:Verbe des:Déterminant légumes:Nom"),
  sent("Awa danse avec joie.", "d", { s: "Awa", v: "danse", cc: [["avec joie", "manière"]] }, "Awa:Nom joie:Nom"),
  sent("Omar marche doucement.", "d", { s: "Omar", v: "marche", cc: [["doucement", "manière"]] }, "Omar:Nom doucement:Adverbe"),
  sent("Demain, nous irons au marché.", "d", { s: "nous", v: "irons", cc: [["Demain", "temps"], ["au marché", "lieu"]] }, "Demain:Adverbe nous:Pronom irons:Verbe marché:Nom"),
  // Palier 3 : le COI, la forme négative, la question.
  sent("Awa parle à Moussa.", "d", { s: "Awa", v: "parle", coi: "à Moussa" }, "Awa:Nom parle:Verbe Moussa:Nom"),
  sent("Le maître répond aux élèves.", "d", { s: "Le maître", v: "répond", coi: "aux élèves" }, "Le:Déterminant maître:Nom répond:Verbe élèves:Nom"),
  sent("Fatou téléphone à sa tante.", "d", { s: "Fatou", v: "téléphone", coi: "à sa tante" }, "Fatou:Nom téléphone:Verbe sa:Déterminant tante:Nom"),
  sent("Les enfants obéissent à la maîtresse.", "d", { s: "Les enfants", v: "obéissent", coi: "à la maîtresse" }, "Les:Déterminant enfants:Nom obéissent:Verbe la:Déterminant maîtresse:Nom"),
  sent("Omar ne mange pas le riz.", "d", { s: "Omar", v: "mange", cod: "le riz", neg: true }, "Omar:Nom mange:Verbe le:Déterminant riz:Nom"),
  sent("Awa ne parle pas à Pape.", "d", { s: "Awa", v: "parle", coi: "à Pape", neg: true }, "Awa:Nom parle:Verbe Pape:Nom"),
  sent("Les enfants ne jouent plus dans la cour.", "d", { s: "Les enfants", v: "jouent", cc: [["dans la cour", "lieu"]], neg: true }, "Les:Déterminant enfants:Nom jouent:Verbe la:Déterminant cour:Nom"),
  sent("Moussa ne voit jamais le lion.", "d", { s: "Moussa", v: "voit", cod: "le lion", neg: true }, "Moussa:Nom voit:Verbe le:Déterminant lion:Nom"),
  // Palier 4 : l'attribut, l'ordre, l'exclamation.
  sent("Awa est contente.", "d", { s: "Awa", v: "est", att: "contente" }, "Awa:Nom est:Verbe contente:Adjectif"),
  sent("Le pêcheur est fatigué.", "d", { s: "Le pêcheur", v: "est", att: "fatigué" }, "Le:Déterminant pêcheur:Nom est:Verbe fatigué:Adjectif"),
  sent("Les mangues sont mûres.", "d", { s: "Les mangues", v: "sont", att: "mûres" }, "Les:Déterminant mangues:Nom sont:Verbe mûres:Adjectif"),
  sent("Mon frère devient grand.", "d", { s: "Mon frère", v: "devient", att: "grand" }, "Mon:Déterminant frère:Nom devient:Verbe grand:Adjectif"),
  sent("Prends ton cahier !", "p", { v: "Prends", cod: "ton cahier" }, "Prends:Verbe ton:Déterminant cahier:Nom"),
  sent("Viens dans la cour !", "p", { v: "Viens", cc: [["dans la cour", "lieu"]] }, "Viens:Verbe la:Déterminant cour:Nom"),
  sent("Comme ce paysage est beau !", "e", { s: "ce paysage", v: "est", att: "beau" }, "ce:Déterminant paysage:Nom est:Verbe beau:Adjectif"),
  sent("Comme Awa chante bien !", "e", { s: "Awa", v: "chante", cc: [["bien", "manière"]] }, "Awa:Nom bien:Adverbe"),
  // Palier 5 : des adjectifs, des adverbes, des pronoms.
  sent("Ma petite sœur chante joliment.", "d", { s: "Ma petite sœur", v: "chante", cc: [["joliment", "manière"]] }, "Ma:Déterminant petite:Adjectif sœur:Nom joliment:Adverbe"),
  sent("Elle regarde un grand film.", "d", { s: "Elle", v: "regarde", cod: "un grand film" }, "Elle:Pronom regarde:Verbe un:Déterminant grand:Adjectif film:Nom"),
  sent("Nous mangeons rapidement un bon repas.", "d", { s: "Nous", v: "mangeons", cod: "un bon repas", cc: [["rapidement", "manière"]] }, "Nous:Pronom mangeons:Verbe rapidement:Adverbe un:Déterminant bon:Adjectif repas:Nom"),
  sent("Les petits oiseaux chantent dans le grand baobab.", "d", { s: "Les petits oiseaux", v: "chantent", cc: [["dans le grand baobab", "lieu"]] }, "Les:Déterminant petits:Adjectif oiseaux:Nom chantent:Verbe grand:Adjectif baobab:Nom"),
  sent("Hier soir, ils ont préparé un délicieux repas.", "d", { s: "ils", v: "ont préparé", cod: "un délicieux repas", cc: [["Hier soir", "temps"]] }, "ils:Pronom un:Déterminant délicieux:Adjectif repas:Nom"),
  sent("Il parle gentiment à ses voisins.", "d", { s: "Il", v: "parle", coi: "à ses voisins", cc: [["gentiment", "manière"]] }, "Il:Pronom parle:Verbe gentiment:Adverbe ses:Déterminant voisins:Nom"),
  sent("Tu écoutes souvent la radio.", "d", { s: "Tu", v: "écoutes", cod: "la radio", cc: [["souvent", "temps"]] }, "Tu:Pronom écoutes:Verbe souvent:Adverbe la:Déterminant radio:Nom"),
  sent("Le vieux pêcheur répare lentement son filet.", "d", { s: "Le vieux pêcheur", v: "répare", cod: "son filet", cc: [["lentement", "manière"]] }, "Le:Déterminant vieux:Adjectif pêcheur:Nom répare:Verbe lentement:Adverbe son:Déterminant filet:Nom"),
];
const STAGE = 8;
const stageSentences = (stage: number) => CORPUS.slice(stage * STAGE, (stage + 1) * STAGE);
const NATURES: readonly Nature[] = ["Nom", "Déterminant", "Adjectif", "Verbe", "Adverbe", "Pronom"];
const FONCTIONS = { sujet: "Sujet", cod: "COD", coi: "COI", attribut: "Attribut du sujet", cc: "Complément circonstanciel" } as const;
type Fonction = keyof typeof FONCTIONS;
const CC_LABEL: Record<CcKind, string> = { lieu: "Complément de lieu", temps: "Complément de temps", manière: "Complément de manière" };
const CC_ORDER: readonly CcKind[] = ["lieu", "temps", "manière"];
const GRAMMAR = "reconnaître la nature et la fonction des mots, le type et la forme d'une phrase";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

// ---------------------------------------------------------------------------
// La nature d'un mot
// ---------------------------------------------------------------------------

const NATURE_HINTS = hints("Lis toute la phrase avant de répondre.", "Demande-toi ce que fait le mot dans la phrase.", "Essaie de mettre le mot au pluriel ou de changer le temps de la phrase.");
/** Deux natures autres que la bonne ; la bonne n'est jamais plus de deux fois plus longue que la plus longue des deux (« Déterminant » aime un mot long à côté). */
function wrongNatures(answer: Nature, seed: number): [string, string] {
  const others = NATURES.filter((nature) => nature !== answer);
  const first = cycle(others, seed);
  let second = cycle(others, seed * 2 + 1);
  if (second === first) second = cycle(others, seed * 2 + 2);
  if (answer.length > 2 * Math.max(first.length, second.length)) second = others.find((nature) => nature !== first && nature.length * 2 >= answer.length) as Nature;
  return [first, second];
}
function natureRows(): QuestionRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) =>
    Array.from({ length: 6 }, (_, k) => {
      const index = (k * 3 + stage) % STAGE;
      const sentence = stageSentences(stage)[index];
      const [word, nature] = cycle(sentence.words, k + stage);
      return qr(`Quelle est la nature du mot « ${word} » dans la phrase « ${sentence.text} » ?`, nature, wrongNatures(nature, k + stage), NATURE_HINTS, `gra:${stage * STAGE + index}`);
    }),
  );
}
export const NATURE_ROWS: readonly QuestionRow[] = natureRows();
export function makeCm1GraNature(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-nature", GRAMMAR, NATURE_ROWS);
}

// ---------------------------------------------------------------------------
// La fonction d'un groupe
// ---------------------------------------------------------------------------

// La question « quoi ? » se pose APRÈS le verbe : posée devant, elle trouve le groupe qui fait l'action (défaut relevé en production le 25 octobre 2026).
const FONCTION_HINTS = hints("Trouve d'abord le verbe de la phrase.", "Devant le verbe, demande « qui est-ce qui ? ». Après le verbe, demande « quoi ? » ou « à qui ? ».","Un groupe qui dit où, quand ou comment peut être supprimé de la phrase.");
/** Les groupes d'une phrase avec leur fonction. */
export function groupsOf(sentence: Sentence): (readonly [string, Fonction])[] {
  const out: (readonly [string, Fonction])[] = [];
  if (sentence.subject) out.push([sentence.subject, "sujet"]);
  if (sentence.cod) out.push([sentence.cod, "cod"]);
  if (sentence.coi) out.push([sentence.coi, "coi"]);
  if (sentence.attribute) out.push([sentence.attribute, "attribut"]);
  for (const [text] of sentence.cc) out.push([text, "cc"]);
  return out;
}
/** Deux fonctions autres que la bonne : les deux longues (« Attribut du sujet », « Complément circonstanciel ») se tiennent compagnie. */
function wrongFonctions(answer: Fonction, seed: number): [string, string] {
  const short: Fonction[] = ["sujet", "cod", "coi"];
  if (answer === "cc") return [FONCTIONS.attribut, FONCTIONS[cycle(short, seed)]];
  if (answer === "attribut") return [FONCTIONS.cc, FONCTIONS[cycle(short, seed)]];
  const others = (Object.keys(FONCTIONS) as Fonction[]).filter((fonction) => fonction !== answer);
  return [FONCTIONS[cycle(others, seed)], FONCTIONS[cycle(others, seed + 2)]];
}
function fonctionRows(): QuestionRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const rows: QuestionRow[] = [];
    for (let k = 0; rows.length < 6 && k < 40; k++) {
      const index = (k * 3 + stage + 1) % STAGE;
      const sentence = stageSentences(stage)[index];
      const groups = groupsOf(sentence);
      const [group, fonction] = cycle(groups, k + stage);
      const prompt = `Dans la phrase « ${sentence.text} », quelle est la fonction du groupe « ${group} » ?`;
      if (rows.some((row) => row.prompt === prompt)) continue;
      rows.push(qr(prompt, FONCTIONS[fonction], wrongFonctions(fonction, k + stage), FONCTION_HINTS, `gra:${stage * STAGE + index}`));
    }
    return rows;
  });
}
export const FONCTION_ROWS: readonly QuestionRow[] = fonctionRows();
export function makeCm1GraFunction(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-fonction", GRAMMAR, FONCTION_ROWS);
}

// ---------------------------------------------------------------------------
// Le sens d'un complément circonstanciel
// ---------------------------------------------------------------------------

const CC_HINTS = hints("Pose une question : où, quand ou comment ?", "Le groupe peut changer de place ou disparaître sans rendre la phrase fausse.", "Pense à ce que ce groupe apprend sur l'action.");
const cc = (text: string, group: string, kind: CcKind): { text: string; group: string; kind: CcKind } => ({ text, group, kind });
export const CC_LIST: readonly { text: string; group: string; kind: CcKind }[] = [
  // Palier 1.
  cc("Moussa dort sous le baobab.", "sous le baobab", "lieu"),
  cc("Hier, Moussa a vu un lion.", "Hier", "temps"),
  cc("Awa chante joliment.", "joliment", "manière"),
  cc("Les enfants jouent dans la cour.", "dans la cour", "lieu"),
  cc("Ce matin, Awa lave la vaisselle.", "Ce matin", "temps"),
  cc("Omar marche doucement.", "doucement", "manière"),
  // Palier 2.
  cc("Fatou lit sur la natte.", "sur la natte", "lieu"),
  cc("Le soir, grand-mère raconte une histoire.", "Le soir", "temps"),
  cc("Les enfants mangent rapidement.", "rapidement", "manière"),
  cc("Le pêcheur attend sur la plage.", "sur la plage", "lieu"),
  cc("Samedi, Fatou range sa chambre.", "Samedi", "temps"),
  cc("Fatou parle gentiment.", "gentiment", "manière"),
  // Palier 3.
  cc("Omar vend des mangues au marché.", "au marché", "lieu"),
  cc("Chaque matin, Omar prend le car.", "Chaque matin", "temps"),
  cc("Le vieux pêcheur travaille lentement.", "lentement", "manière"),
  cc("Les élèves chantent dans la classe.", "dans la classe", "lieu"),
  cc("Hier soir, nous avons mangé du riz.", "Hier soir", "temps"),
  cc("Pape répond poliment.", "poliment", "manière"),
  // Palier 4.
  cc("Pape travaille dans le champ.", "dans le champ", "lieu"),
  cc("Tous les jours, Khady lit un livre.", "Tous les jours", "temps"),
  cc("Khady danse avec joie.", "avec joie", "manière"),
  cc("Mariama dort chez sa tante.", "chez sa tante", "lieu"),
  cc("Ce soir, les pêcheurs rentrent.", "Ce soir", "temps"),
  cc("Moussa travaille avec courage.", "avec courage", "manière"),
  // Palier 5.
  cc("Awa range les livres dans le cartable.", "dans le cartable", "lieu"),
  cc("Plus tard, Awa écrit une lettre.", "Plus tard", "temps"),
  cc("Les élèves écoutent attentivement.", "attentivement", "manière"),
  cc("Le chef parle devant le village.", "devant le village", "lieu"),
  cc("Après-demain, la famille voyage.", "Après-demain", "temps"),
  cc("Mariama écrit avec soin.", "avec soin", "manière"),
];
export const CC_ROWS: readonly QuestionRow[] = CC_LIST.map((entry, index) =>
  qr(`Dans la phrase « ${entry.text} », de quel type est le complément circonstanciel « ${entry.group} » ?`, CC_LABEL[entry.kind], CC_ORDER.filter((kind) => kind !== entry.kind).map((kind) => CC_LABEL[kind]) as unknown as [string, string], CC_HINTS, `gra:cc${index}`),
);
export function makeCm1GraCc(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-cc", GRAMMAR, CC_ROWS);
}

// ---------------------------------------------------------------------------
// Le type et la forme d'une phrase : des phrases rangées par type
// ---------------------------------------------------------------------------

export const DECLARATIVE: readonly string[] = [
  "Les enfants jouent dans la cour.",
  "Awa range sa chambre.",
  "Le pêcheur lance son filet.",
  "Moussa lit un livre.",
  "Ma sœur prépare le repas.",
  "Les élèves écoutent le maître.",
  "Fatou vend des légumes.",
  "Le chef parle aux villageois.",
  "Omar marche vers la plage.",
  "La maîtresse écrit la date.",
  "Pape porte un seau.",
  "Khady lave la vaisselle.",
  "Les femmes chantent au marché.",
  "Mon frère répare la pirogue.",
  "Le soleil brille sur le village.",
];
export const INTERROGATIVE: readonly string[] = [
  "Est-ce que Moussa lit un livre ?",
  "Est-ce que tu viens au marché ?",
  "Est-ce que les enfants jouent dans la cour ?",
  "Qui prépare le repas ?",
  "Où va le pêcheur ?",
  "Quand partent les élèves ?",
  "Pourquoi Awa pleure-t-elle ?",
  "Comment vas-tu ce matin ?",
];
export const EXCLAMATIVE: readonly string[] = [
  "Comme ce paysage est beau !",
  "Que ce plat est délicieux !",
  "Comme Awa chante bien !",
  "Quelle belle journée !",
  "Comme les enfants sont contents !",
  "Que la mer est calme !",
  "Quel grand baobab !",
  "Comme ce pagne est joli !",
];
export const IMPERATIVE: readonly string[] = [
  "Prends ton cahier !",
  "Viens dans la cour !",
  "Ferme la porte.",
  "Range ta chambre !",
  "Écoute la maîtresse.",
  "Mange ton riz !",
  "Lave tes mains !",
  "Finis ton devoir !",
];
export const NEGATIVE: readonly string[] = [
  "Omar ne mange pas le riz.",
  "Awa ne parle pas à Pape.",
  "Les enfants ne jouent plus dans la cour.",
  "Moussa ne voit jamais le lion.",
  "Fatou ne lit pas son livre.",
  "Le chef ne répond pas aux villageois.",
  "Les élèves ne chantent pas dans la classe.",
  "Le pêcheur ne lance pas son filet.",
  "Pape ne porte jamais de seau.",
  "Khady ne lave pas la vaisselle.",
  "La maîtresse n'écrit plus la date.",
  "Mariama ne range pas sa chambre.",
  "Ma sœur ne prépare plus le repas.",
  "Mon frère ne répare pas la pirogue.",
  "Le soleil ne brille pas sur le village.",
];
const POOLS: Record<Kind, readonly string[]> = { déclarative: DECLARATIVE, interrogative: INTERROGATIVE, exclamative: EXCLAMATIVE, impérative: IMPERATIVE };
const KINDS: readonly Kind[] = ["déclarative", "interrogative", "exclamative", "impérative"];

/** La phrase du groupe la plus proche en longueur de `target`, parmi celles qui ne sont pas déjà prises. */
function nearest(pool: readonly string[], target: string, taken: readonly string[]): string {
  return [...pool].filter((text) => !taken.includes(text)).sort((a, b) => Math.abs(a.length - target.length) - Math.abs(b.length - target.length))[0];
}
const TYPE_HINTS = hints("Regarde le signe qui termine chaque phrase.", "Cherche celle qui pose une question, donne un ordre ou exprime une émotion.", "Une phrase qui donne simplement une information est la plus ordinaire.");
function typeRows(): QuestionRow[] {
  return Array.from({ length: 30 }, (_, r) => {
    const kind = KINDS[r % 4];
    const right = POOLS[kind][Math.floor(r / 4) % POOLS[kind].length];
    const others = KINDS.filter((candidate) => candidate !== kind);
    const first = cycle(others, r);
    const second = cycle(others, r + 1 + (r % 2));
    const wrong1 = nearest(POOLS[first], right, []);
    const wrong2 = nearest(POOLS[second === first ? cycle(others, r + 2) : second], right, [wrong1]);
    return qr(`Quelle phrase est ${kind} ?`, right, [wrong1, wrong2], TYPE_HINTS);
  });
}
export const TYPE_ROWS: readonly QuestionRow[] = typeRows();
export function makeCm1GraType(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-type", GRAMMAR, TYPE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

const FORM_HINTS = hints("Lis chaque phrase en cherchant ce qui nie l'action.", "Une phrase négative entoure son verbe de deux petits mots.", "Une phrase affirmative dit que l'action est faite.");
function formRows(): QuestionRow[] {
  return Array.from({ length: 30 }, (_, r) => {
    const negative = r % 2 === 0;
    const i = Math.floor(r / 2);
    const right = negative ? NEGATIVE[i % NEGATIVE.length] : DECLARATIVE[i % DECLARATIVE.length];
    const pool = negative ? DECLARATIVE : NEGATIVE;
    const wrong1 = nearest(pool, right, []);
    const wrong2 = nearest(pool, right, [wrong1]);
    return qr(`Quelle phrase est à la forme ${negative ? "négative" : "affirmative"} ?`, right, [wrong1, wrong2], FORM_HINTS);
  });
}
export const FORM_ROWS: readonly QuestionRow[] = formRows();
export function makeCm1GraForm(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-forme", GRAMMAR, FORM_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

// ---------------------------------------------------------------------------
// L'attribut du sujet
// ---------------------------------------------------------------------------

const ATTRIBUTE_HINTS = hints("Cherche d'abord le verbe de la phrase.", "Ce verbe relie le sujet à un mot qui le décrit.", "Le mot cherché dit comment est la personne ou la chose.");
const att = (text: string, subject: string, verb: string, attribute: string) => ({ text, subject, verb, attribute });
export const ATTRIBUTE_LIST: readonly { text: string; subject: string; verb: string; attribute: string }[] = [
  att("Ma sœur est contente.", "Ma sœur", "est", "contente"),
  att("Le pêcheur est fatigué.", "Le pêcheur", "est", "fatigué"),
  att("Les mangues sont mûres.", "Les mangues", "sont", "mûres"),
  att("Mon frère devient grand.", "Mon frère", "devient", "grand"),
  att("La mer semble calme.", "La mer", "semble", "calme"),
  att("Les enfants sont heureux.", "Les enfants", "sont", "heureux"),
  att("Le chef reste calme.", "Le chef", "reste", "calme"),
  att("Ta cousine paraît fatiguée.", "Ta cousine", "paraît", "fatiguée"),
  att("Le riz est délicieux.", "Le riz", "est", "délicieux"),
  att("Les élèves restent attentifs.", "Les élèves", "restent", "attentifs"),
  att("Cette chanson est belle.", "Cette chanson", "est", "belle"),
  att("Le baobab est immense.", "Le baobab", "est", "immense"),
  att("Les pirogues sont lourdes.", "Les pirogues", "sont", "lourdes"),
  att("Mon voisin devient vieux.", "Mon voisin", "devient", "vieux"),
  att("La maîtresse paraît pressée.", "La maîtresse", "paraît", "pressée"),
  att("Ces fruits sont frais.", "Ces fruits", "sont", "frais"),
  att("Notre village est tranquille.", "Notre village", "est", "tranquille"),
  att("Les nuits sont fraîches.", "Les nuits", "sont", "fraîches"),
  att("Le marché est bruyant.", "Le marché", "est", "bruyant"),
  att("Mes amies sont gentilles.", "Mes amies", "sont", "gentilles"),
  att("La soupe semble chaude.", "La soupe", "semble", "chaude"),
  att("Les poissons sont énormes.", "Les poissons", "sont", "énormes"),
  att("Ce tissu est magnifique.", "Ce tissu", "est", "magnifique"),
  att("Les enfants deviennent grands.", "Les enfants", "deviennent", "grands"),
  att("Mon père reste courageux.", "Mon père", "reste", "courageux"),
  att("La route est longue.", "La route", "est", "longue"),
  att("Le soleil devient brûlant.", "Le soleil", "devient", "brûlant"),
  att("Les fleurs sont jolies.", "Les fleurs", "sont", "jolies"),
  att("Ton cahier est propre.", "Ton cahier", "est", "propre"),
  att("Mes cousines sont fières.", "Mes cousines", "sont", "fières"),
];
export const ATTRIBUTE_ROWS: readonly QuestionRow[] = ATTRIBUTE_LIST.map((entry, index) =>
  qr(`Lis la phrase « ${entry.text} ». Quel est l'attribut du sujet ?`, entry.attribute, [entry.subject, entry.verb], ATTRIBUTE_HINTS, `gra:att${index}`),
);
export function makeCm1GraAttribute(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-gra-attribut", GRAMMAR, ATTRIBUTE_ROWS);
}

// ---------------------------------------------------------------------------
// Le pronom qui remplace un complément
// ---------------------------------------------------------------------------

const PRONOUN_HINTS = hints("Cherche quel groupe le pronom remplace.", "Regarde si ce groupe est masculin, féminin, singulier ou pluriel.", "Le pronom se place juste devant le verbe.");
type PronounEntry = { sentence: string; pronoun: string; verb: string; answer: "le" | "la" | "les" | "lui" | "leur" };
const pro = (sentence: string, pronoun: string, verb: string, answer: PronounEntry["answer"]): PronounEntry => ({ sentence, pronoun, verb, answer });
const COD_ENTRIES: readonly PronounEntry[] = [
  pro("Awa mange une mangue.", "Elle", "mange", "la"),
  pro("Moussa mange le riz.", "Il", "mange", "le"),
  pro("Fatou prépare le repas.", "Elle", "prépare", "le"),
  pro("Omar regarde la télévision.", "Il", "regarde", "la"),
  pro("Mon frère lave la voiture.", "Il", "lave", "la"),
  pro("Pape prend le car.", "Il", "prend", "le"),
  pro("Les femmes vendent des mangues.", "Elles", "vendent", "les"),
  pro("Les enfants chantent une chanson.", "Ils", "chantent", "la"),
  pro("Khady range ses livres.", "Elle", "range", "les"),
  pro("Le pêcheur lance son filet.", "Il", "lance", "le"),
  pro("Mariama porte un seau.", "Elle", "porte", "le"),
  pro("Les élèves lisent le conte.", "Ils", "lisent", "le"),
  pro("La maîtresse lit une histoire.", "Elle", "lit", "la"),
  pro("Les pêcheurs vendent leurs poissons.", "Ils", "vendent", "les"),
  pro("Awa cherche sa poupée.", "Elle", "cherche", "la"),
  pro("Moussa regarde les étoiles.", "Il", "regarde", "les"),
  pro("Fatou et Khady préparent la sauce.", "Elles", "préparent", "la"),
  pro("Pape et Omar lavent les assiettes.", "Ils", "lavent", "les"),
];
const COI_ENTRIES: readonly PronounEntry[] = [
  pro("Awa parle à Moussa.", "Elle", "parle", "lui"),
  pro("Le maître répond aux élèves.", "Il", "répond", "leur"),
  pro("Fatou téléphone à sa tante.", "Elle", "téléphone", "lui"),
  pro("Les enfants obéissent à la maîtresse.", "Ils", "obéissent", "lui"),
  pro("Omar écrit à ses cousins.", "Il", "écrit", "leur"),
  pro("La maîtresse parle aux parents.", "Elle", "parle", "leur"),
  pro("Pape sourit à sa sœur.", "Il", "sourit", "lui"),
  pro("Mariama répond à son père.", "Elle", "répond", "lui"),
  pro("Les élèves parlent au chef.", "Ils", "parlent", "lui"),
  pro("Khady téléphone à ses amies.", "Elle", "téléphone", "leur"),
  pro("Le chef parle aux pêcheurs.", "Il", "parle", "leur"),
  pro("Fatou obéit à sa mère.", "Elle", "obéit", "lui"),
];
/** Six par palier : le COD d'abord, le COI au troisième palier, un mélange à la fin. */
export const PRONOUN_ENTRIES: readonly PronounEntry[] = [
  ...COD_ENTRIES.slice(0, 6),
  ...COD_ENTRIES.slice(6, 12),
  ...COI_ENTRIES.slice(0, 6),
  ...COD_ENTRIES.slice(12, 18),
  ...COI_ENTRIES.slice(6, 12),
];
const PRONOUN_OPTIONS: Record<PronounEntry["answer"], [string, string]> = { le: ["la", "les"], la: ["le", "les"], les: ["le", "la"], lui: ["leur", "le"], leur: ["lui", "les"] };
export const PRONOUN_ROWS: readonly GapRow[] = PRONOUN_ENTRIES.map((entry, index) => gr(`${entry.sentence} ${entry.pronoun} ___ ${entry.verb}.`, entry.answer, PRONOUN_OPTIONS[entry.answer], PRONOUN_HINTS, `gra:pro${index}`));
export function makeCm1GraPronoun(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-gra-pronom", GRAMMAR, PRONOUN_ROWS, 1, 0, "Complète avec le bon pronom.");
}

// ---------------------------------------------------------------------------
// Écrire l'infinitif du verbe, ou le pronom qui remplace le sujet
// ---------------------------------------------------------------------------

// Une réponse à écrire n'est jamais lisible dans l'énoncé : on ne demande donc pas de recopier le verbe ou le sujet, mais son infinitif ou son pronom.
const WRITE_INFINITIVE_HINTS = hints("Cherche le verbe de la phrase.", "L'infinitif est la forme du verbe qu'on ne conjugue pas.", "Écris le verbe tel qu'on le trouve dans le dictionnaire.");
const WRITE_PRONOUN_HINTS = hints("Trouve d'abord le sujet de la phrase.", "Regarde si le sujet est masculin ou féminin, singulier ou pluriel.", "Le pronom cherché est un seul petit mot.");
export const INFINITIVE: Record<string, string> = {
  mange: "manger", lance: "lancer", chantent: "chanter", porte: "porter", prépare: "préparer", regarde: "regarder", vendent: "vendre", donne: "donner",
  "a lavé": "laver", dort: "dormir", jouent: "jouer", vend: "vendre", danse: "danser", marche: "marcher", irons: "aller", parle: "parler", répond: "répondre",
  téléphone: "téléphoner", obéissent: "obéir", voit: "voir", est: "être", sont: "être", devient: "devenir", Prends: "prendre", Viens: "venir", chante: "chanter",
  mangeons: "manger", "ont préparé": "préparer", écoutes: "écouter", répare: "réparer",
};
export const SUBJECT_PRONOUN: Record<string, string> = {
  Awa: "elle", Moussa: "il", Fatou: "elle", Omar: "il", "Les enfants": "ils", "Le pêcheur": "il", "Ma sœur": "elle", "Les femmes": "elles", "Le chef": "il", "Le maître": "il",
  "Mon frère": "il", "ce paysage": "il", "Ma petite sœur": "elle", "Les petits oiseaux": "ils", "Le vieux pêcheur": "il", "Les mangues": "elles",
};
function writeRows(): WriteRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const rows: WriteRow[] = [];
    for (let k = 0; rows.length < 6 && k < 60; k++) {
      const index = (k * 3 + stage + 2) % STAGE;
      const sentence = stageSentences(stage)[index];
      const pronoun = sentence.subject === undefined ? undefined : SUBJECT_PRONOUN[sentence.subject];
      const prompt = (k + stage) % 2 === 0 || pronoun === undefined ? `Écris l'infinitif du verbe de la phrase « ${sentence.text} ».` : `Quel pronom personnel remplace le sujet dans la phrase « ${sentence.text} » ? Écris-le.`;
      if (rows.some((row) => row.prompt === prompt)) continue;
      const fact = `gra:${stage * STAGE + index}`;
      rows.push(prompt.startsWith("Écris") ? wr(prompt, [INFINITIVE[sentence.verb]], WRITE_INFINITIVE_HINTS, fact) : wr(prompt, [pronoun as string, (pronoun as string).charAt(0).toUpperCase() + (pronoun as string).slice(1)], WRITE_PRONOUN_HINTS, fact));
    }
    return rows;
  });
}
export const WRITE_ROWS: readonly WriteRow[] = writeRows();
export function makeCm1GraWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-gra-ecrire", GRAMMAR, WRITE_ROWS);
}

// ---------------------------------------------------------------------------
// Relier trois mots à leur nature
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Commence par le mot dont tu es sûr.", "Un mot qui se place devant un autre peut l'annoncer.", "Un mot qui change avec le temps de la phrase exprime une action.");
function linkRows(): LinkRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const eligible = stageSentences(stage)
      .map((sentence, index) => ({ sentence, index }))
      .filter(({ sentence }) => new Set(sentence.words.map(([, nature]) => nature)).size >= 3);
    return Array.from({ length: 6 }, (_, k) => {
      const { sentence, index } = cycle(eligible, k + stage);
      const natures: Nature[] = [];
      const pairs: { left: string; right: string }[] = [];
      const rotated = [...sentence.words.slice(k % sentence.words.length), ...sentence.words.slice(0, k % sentence.words.length)];
      for (const [word, nature] of rotated) {
        if (natures.includes(nature) || pairs.some((pair) => pair.left === word)) continue;
        natures.push(nature);
        pairs.push({ left: word, right: nature });
        if (pairs.length === 3) break;
      }
      return { prompt: `Relie chaque mot de la phrase « ${sentence.text} » à sa nature.`, pairs, hints: LINK_HINTS, fact: `gra:${stage * STAGE + index}` };
    });
  });
}
export const LINK_ROWS: readonly LinkRow[] = linkRows();
export function makeCm1GraLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-gra-relier", GRAMMAR, LINK_ROWS);
}

// ---------------------------------------------------------------------------
// Glisser des mots dans deux natures, des phrases dans deux types ou deux formes
// ---------------------------------------------------------------------------

/** Des mots qui n'ont qu'une nature, hors de toute phrase : « porte », « marche », « le » (nom, verbe ou pronom) n'y sont pas. */
export const VOCABULARY: Record<Nature, readonly string[]> = {
  Nom: ["mangue", "filet", "enfant", "chanson", "seau", "repas", "télévision", "cahier", "lion", "baobab", "cour", "maison", "mer", "village", "poisson", "tante", "sœur", "frère", "voisin", "pirogue", "champ", "puits", "école", "pagne", "natte", "chef", "maître"],
  Verbe: ["mange", "chantent", "prépare", "regarde", "vendent", "répond", "obéissent", "voit", "irons", "lisent", "écoutent", "parle", "raconte", "rentre", "cherche", "prends", "viens", "sourit", "dort", "mangeons", "écoutes", "répare"],
  Adjectif: ["joli", "content", "délicieux", "beau", "gentil", "heureux", "courageux", "tranquille", "lent", "bruyant"],
  Déterminant: ["un", "une", "des", "mon", "ma", "mes", "ton", "sa", "ses", "cette", "ces", "notre"],
  Pronom: ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"],
  Adverbe: ["doucement", "rapidement", "lentement", "joliment", "gentiment", "souvent", "toujours", "vite", "rarement", "bientôt", "très", "hier", "demain"],
};
const WORD_SORT_HINTS = hints("Essaie de mettre chaque mot dans une phrase.", "Un mot qui désigne une personne ou une chose se met au pluriel.", "Un mot qui exprime une action change avec le temps.");
const SENTENCE_SORT_HINTS = hints("Lis chaque phrase en cherchant ce qui la distingue des autres.", "Regarde le signe qui la termine et les petits mots autour du verbe.", "Classe d'abord les phrases dont tu es sûr.");
/** Trois mots de chaque nature, pris de trois en trois dans leur liste, sans doublon. */
function wordSort(first: Nature, second: Nature, n: number, stride = 4): SortRow {
  const take = (nature: Nature, offset: number) => Array.from({ length: 3 }, (_, slot) => cycle(VOCABULARY[nature], offset + slot * 3 + n * stride));
  const a = take(first, 0);
  const b = take(second, 1);
  return { prompt: "Glisse chaque mot dans la bonne case.", zones: [first, second], items: [...a.map((text) => ({ text, zone: first })), ...b.map((text) => ({ text, zone: second }))], hints: WORD_SORT_HINTS };
}
function sentenceSort(zones: readonly [string, string], left: readonly string[], right: readonly string[], n: number): SortRow {
  const take = (pool: readonly string[], offset: number) => Array.from({ length: 3 }, (_, slot) => cycle(pool, offset + slot * 2 + n * 2));
  return { prompt: "Glisse chaque phrase dans la bonne case.", zones: [zones[0], zones[1]], items: [...take(left, 0).map((text) => ({ text, zone: zones[0] })), ...take(right, 1).map((text) => ({ text, zone: zones[1] }))], hints: SENTENCE_SORT_HINTS };
}
const SENTENCE_SORT_PAIRS: readonly (readonly [Kind, Kind])[] = [
  ["déclarative", "interrogative"],
  ["exclamative", "impérative"],
  ["interrogative", "exclamative"],
  ["déclarative", "impérative"],
  ["interrogative", "impérative"],
  ["déclarative", "exclamative"],
];
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
export const SORT_ROWS: readonly SortRow[] = [
  ...Array.from({ length: 6 }, (_, n) => wordSort("Nom", "Verbe", n)),
  ...Array.from({ length: 6 }, (_, n) => wordSort("Nom", "Déterminant", n)),
  ...Array.from({ length: 6 }, (_, n) => sentenceSort(["Affirmative", "Négative"], DECLARATIVE, NEGATIVE, n)),
  ...Array.from({ length: 6 }, (_, n) => {
    const [a, b] = SENTENCE_SORT_PAIRS[n];
    return sentenceSort([cap(a), cap(b)], POOLS[a], POOLS[b], n);
  }),
  ...Array.from({ length: 3 }, (_, n) => wordSort("Adjectif", "Adverbe", n, 3)),
  ...Array.from({ length: 3 }, (_, n) => wordSort("Pronom", "Déterminant", n, 3)),
];
export function makeCm1GraSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-gra-glisser", GRAMMAR, SORT_ROWS);
}
