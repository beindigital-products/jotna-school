/**
 * LES GABARITS DE CONJUGAISON DU CM1 : les temps de l'indicatif (`fr-cm1-indicatif`).
 *
 * La fiche demande le présent, l'imparfait, le futur simple, le passé composé et le passé simple (3e personne) des verbes usuels des trois groupes, et
 * « choisir le temps qui convient dans un récit ». Ici chaque exercice est BÂTI à partir d'un tableau de verbes fermé (quarante-neuf verbes, leurs
 * formes écrites ou calculées une fois), jamais écrit par le modèle : le verbe est donné, la personne est dite par le sujet, le temps par un mot
 * de temps (« demain », « autrefois ») ou par l'énoncé, et un mauvais choix est une forme que ce temps ou cette personne interdit.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Un mot de temps n'exclut pas tout autre temps : « hier » accepte le passé composé ET l'imparfait, « demain » accepte le futur ET le présent. Un mauvais
 *   choix n'est donc jamais un temps que le mot de temps accepte (après « demain », ni imparfait ni passé composé ; après « hier », ni présent ni futur ;
 *   après « autrefois », ni présent ni futur ; après « maintenant », ni imparfait ni futur).
 * - Une forme qui se lit à deux temps (« il finit », « il dit » : présent et passé simple ; « il vit » : voir au passé simple, vivre au présent) n'est jamais
 *   posée pour demander son temps, ni à relier, ni à glisser : seul un conte au passé simple, où l'énoncé dit le temps, emploie ces formes.
 * - Le passé composé n'emploie que l'auxiliaire « avoir » : les verbes qui se conjuguent avec « être » (aller, venir, partir) accordent leur participe, c'est
 *   la leçon des accords. Ils restent au présent, à l'imparfait, au futur et au passé simple.
 * - Les verbes en -ger et -cer gardent leur « e » ou leur « ç » devant a et o (mangeais, commençons, mangea) et les perdent devant i (mangions).
 * - Un sujet à la première personne devant une voyelle s'écrit « j' » (« j'écoutais », « j'ai chanté ») : le trou suit l'apostrophe, et l'énoncé n'a pas
 *   d'autre apostrophe.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot de
 * quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 30 lignes pour cinq paliers).
 *
 * HORS FICHE, À FAIRE RELIRE : les verbes au-delà de ceux de la fiche (pouvoir, vouloir, savoir, boire, lire, écrire, ouvrir, mettre, attendre, répondre), le
 * passé simple de tous les verbes du tableau, les quinze histoires à remettre dans l'ordre, les phrases de la vie courante (le marché, le baobab, la pirogue).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LE TABLEAU DES VERBES
// ===========================================================================

export type Tense = "présent" | "imparfait" | "futur" | "passé composé" | "passé simple";
type Simple = "présent" | "imparfait" | "futur";
export type Verb = {
  inf: string;
  group: 1 | 2 | 3;
  /** Ce qui suit le verbe dans une phrase : jamais d'accord (pas d'adjectif, pas de possessif), jamais de mot de temps. */
  comp: string;
  aux: "avoir" | "être";
  forms: Record<Simple, readonly string[]>;
  participle: string;
  /** La 3e personne du singulier puis du pluriel. */
  simple: readonly [string, string];
};

const AUX_AVOIR = ["ai", "as", "a", "avons", "avez", "ont"] as const;
const FUTURE_ENDINGS = ["ai", "as", "a", "ons", "ez", "ont"] as const;
const IMPARFAIT_ENDINGS = ["ais", "ais", "ait", "ions", "iez", "aient"] as const;

/** Un verbe du 1er groupe : le radical, ses terminaisons, et les cas -ger et -cer (un « e » ou un « ç » devant a, o). */
function er(inf: string, comp: string): Verb {
  const stem = inf.slice(0, -2);
  const soft = (ending: string) => {
    if (!/^[aoâ]/u.test(ending)) return stem + ending;
    if (inf.endsWith("ger")) return `${stem}e${ending}`;
    if (inf.endsWith("cer")) return `${stem.slice(0, -1)}ç${ending}`;
    return stem + ending;
  };
  return {
    inf,
    group: 1,
    comp,
    aux: "avoir",
    forms: {
      présent: [`${stem}e`, `${stem}es`, `${stem}e`, soft("ons"), `${stem}ez`, `${stem}ent`],
      imparfait: IMPARFAIT_ENDINGS.map(soft),
      futur: FUTURE_ENDINGS.map((ending) => `${stem}er${ending}`),
    },
    participle: `${stem}é`,
    simple: [soft("a"), soft("èrent")],
  };
}

/** Un verbe du 2e groupe (finir, choisir) : -is, -is, -it, -issons, -issez, -issent. */
function ir(inf: string, comp: string): Verb {
  const stem = inf.slice(0, -2);
  return {
    inf,
    group: 2,
    comp,
    aux: "avoir",
    forms: {
      présent: [`${stem}is`, `${stem}is`, `${stem}it`, `${stem}issons`, `${stem}issez`, `${stem}issent`],
      imparfait: ["issais", "issais", "issait", "issions", "issiez", "issaient"].map((ending) => stem + ending),
      futur: FUTURE_ENDINGS.map((ending) => `${stem}ir${ending}`),
    },
    participle: `${stem}i`,
    simple: [`${stem}it`, `${stem}irent`],
  };
}

/** Un verbe du 3e groupe : le présent est écrit, l'imparfait vient de « nous », le futur de son radical. */
function irregular(inf: string, comp: string, aux: "avoir" | "être", present: readonly string[], futureStem: string, participle: string, simple: readonly [string, string], imparfaitStem?: string): Verb {
  const stem = imparfaitStem ?? present[3].slice(0, -3);
  return {
    inf,
    group: 3,
    comp,
    aux,
    forms: { présent: present, imparfait: IMPARFAIT_ENDINGS.map((ending) => stem + ending), futur: FUTURE_ENDINGS.map((ending) => futureStem + ending) },
    participle,
    simple,
  };
}

export const VERBS: readonly Verb[] = [
  // Le 1er groupe.
  er("chanter", "une chanson"),
  er("jouer", "au ballon"),
  er("regarder", "le match"),
  er("écouter", "la radio"),
  er("danser", "sur la place"),
  er("travailler", "dans le champ"),
  er("marcher", "sur le chemin"),
  er("laver", "la vaisselle"),
  er("porter", "un seau"),
  er("parler", "au chef"),
  er("aimer", "les mangues"),
  er("donner", "du riz"),
  er("trouver", "un coquillage"),
  er("manger", "du riz"),
  er("nager", "dans la mer"),
  er("ranger", "la chambre"),
  er("commencer", "le travail"),
  er("lancer", "le filet"),
  er("pêcher", "des sardines"),
  er("cultiver", "du mil"),
  er("cuisiner", "le repas"),
  er("raconter", "une histoire"),
  // Le 2e groupe.
  ir("finir", "le devoir"),
  ir("choisir", "un cadeau"),
  ir("grandir", "vite"),
  ir("réussir", "la course"),
  ir("remplir", "le seau"),
  // Le 3e groupe.
  irregular("être", "au village", "avoir", ["suis", "es", "est", "sommes", "êtes", "sont"], "ser", "été", ["fut", "furent"], "ét"),
  irregular("avoir", "un beau cadeau", "avoir", ["ai", "as", "a", "avons", "avez", "ont"], "aur", "eu", ["eut", "eurent"]),
  irregular("aller", "au marché", "être", ["vais", "vas", "va", "allons", "allez", "vont"], "ir", "allé", ["alla", "allèrent"]),
  irregular("faire", "un gâteau", "avoir", ["fais", "fais", "fait", "faisons", "faites", "font"], "fer", "fait", ["fit", "firent"]),
  irregular("dire", "bonjour", "avoir", ["dis", "dis", "dit", "disons", "dites", "disent"], "dir", "dit", ["dit", "dirent"]),
  irregular("voir", "un oiseau", "avoir", ["vois", "vois", "voit", "voyons", "voyez", "voient"], "verr", "vu", ["vit", "virent"]),
  irregular("prendre", "le car", "avoir", ["prends", "prends", "prend", "prenons", "prenez", "prennent"], "prendr", "pris", ["prit", "prirent"]),
  irregular("venir", "chez nous", "être", ["viens", "viens", "vient", "venons", "venez", "viennent"], "viendr", "venu", ["vint", "vinrent"]),
  irregular("partir", "tôt", "être", ["pars", "pars", "part", "partons", "partez", "partent"], "partir", "parti", ["partit", "partirent"]),
  irregular("courir", "vers la plage", "avoir", ["cours", "cours", "court", "courons", "courez", "courent"], "courr", "couru", ["courut", "coururent"]),
  irregular("dormir", "sous le baobab", "avoir", ["dors", "dors", "dort", "dormons", "dormez", "dorment"], "dormir", "dormi", ["dormit", "dormirent"]),
  irregular("vendre", "des mangues", "avoir", ["vends", "vends", "vend", "vendons", "vendez", "vendent"], "vendr", "vendu", ["vendit", "vendirent"]),
  irregular("attendre", "le car", "avoir", ["attends", "attends", "attend", "attendons", "attendez", "attendent"], "attendr", "attendu", ["attendit", "attendirent"]),
  irregular("répondre", "à la maîtresse", "avoir", ["réponds", "réponds", "répond", "répondons", "répondez", "répondent"], "répondr", "répondu", ["répondit", "répondirent"]),
  irregular("mettre", "la table", "avoir", ["mets", "mets", "met", "mettons", "mettez", "mettent"], "mettr", "mis", ["mit", "mirent"]),
  irregular("lire", "un livre", "avoir", ["lis", "lis", "lit", "lisons", "lisez", "lisent"], "lir", "lu", ["lut", "lurent"]),
  irregular("écrire", "une lettre", "avoir", ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"], "écrir", "écrit", ["écrivit", "écrivirent"]),
  irregular("boire", "du lait", "avoir", ["bois", "bois", "boit", "buvons", "buvez", "boivent"], "boir", "bu", ["but", "burent"]),
  irregular("ouvrir", "la porte", "avoir", ["ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent"], "ouvrir", "ouvert", ["ouvrit", "ouvrirent"]),
  irregular("pouvoir", "nager dans la mer", "avoir", ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"], "pourr", "pu", ["put", "purent"]),
  irregular("vouloir", "jouer dehors", "avoir", ["veux", "veux", "veut", "voulons", "voulez", "veulent"], "voudr", "voulu", ["voulut", "voulurent"]),
  irregular("savoir", "nager", "avoir", ["sais", "sais", "sait", "savons", "savez", "savent"], "saur", "su", ["sut", "surent"]),
];

const verbOf = (inf: string): Verb => VERBS.find((verb) => verb.inf === inf) as Verb;

export function formOf(verb: Verb, tense: Tense, person: number): string {
  if (tense === "passé composé") return `${AUX_AVOIR[person]} ${verb.participle}`;
  if (tense === "passé simple") return verb.simple[person === 2 ? 0 : 1];
  return verb.forms[tense][person];
}

/** Chaque forme écrite, avec les temps où elle se lit : une forme lue à deux temps ne sert jamais à demander son temps. */
const SURFACE = new Map<string, Set<Tense>>();
function addSurface(form: string, tense: Tense) {
  SURFACE.set(form, (SURFACE.get(form) ?? new Set<Tense>()).add(tense));
}
for (const verb of VERBS) {
  for (const tense of ["présent", "imparfait", "futur"] as const) verb.forms[tense].forEach((form) => addSurface(form, tense));
  addSurface(verb.simple[0], "passé simple");
  addSurface(verb.simple[1], "passé simple");
}
// Un verbe que le tableau ne conjugue pas, dont une forme s'écrit comme un passé simple du tableau : « il vit » (vivre).
addSurface("vit", "présent");

const isUnambiguous = (verb: Verb, tense: Tense, person: number) => tense === "passé composé" || (SURFACE.get(formOf(verb, tense, person))?.size ?? 0) === 1;

/** Ce qu'une ligne peut demander : le passé composé seulement avec « avoir », le passé simple seulement à la 3e personne. */
export const canUse = (verb: Verb, tense: Tense, person: number) => (tense !== "passé composé" || verb.aux === "avoir") && (tense !== "passé simple" || person === 2 || person === 5);
const canIdentify = (verb: Verb, tense: Tense, person: number) => canUse(verb, tense, person) && isUnambiguous(verb, tense, person);
const canMark = (verb: Verb, tense: Tense, person: number) => canUse(verb, tense, person) && verb.aux === "avoir";

// ===========================================================================
// LES PHRASES : sujets, mots de temps, noms des temps
// ===========================================================================

const S3 = ["Awa", "Moussa", "Fatou", "le pêcheur", "la maîtresse", "mon frère", "Omar", "ma cousine", "Khady", "le chef", "Pape", "Mariama"] as const;
const P3 = ["les enfants", "les pêcheurs", "Awa et Omar", "les élèves", "mes cousins", "Fatou et Khady", "Moussa et Pape", "les femmes"] as const;
const PRONOUN = ["je", "tu", "il", "nous", "vous", "ils"] as const;
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const startsWithVowel = (text: string) => /^[aeiouyéèêâîôûh]/iu.test(text);

/** Le sujet qui précède un verbe, avec son espace ou son apostrophe : « nous », « Awa », « j' ». */
function lead(person: number, form: string, index: number): string {
  if (person === 0) return startsWithVowel(form) ? "j'" : "je ";
  if (person === 2) return `${cycle(S3, index)} `;
  if (person === 5) return `${cycle(P3, index)} `;
  return `${PRONOUN[person]} `;
}
/** Un pronom devant la forme, pour une étiquette : « il chantait », « j'ai fini ». */
const tile = (person: number, form: string) => (person === 0 && startsWithVowel(form) ? `j'${form}` : `${PRONOUN[person]} ${form}`);
/** Une phrase sans mot de temps : « Awa chantait une chanson. » */
const clause = (verb: Verb, tense: Tense, person: number, index: number) => {
  const form = formOf(verb, tense, person);
  return `${cap(lead(person, form, index))}${form} ${verb.comp}.`;
};

const MARKERS = {
  présent: ["Maintenant", "En ce moment", "À présent"],
  imparfait: ["Autrefois", "Il y a longtemps", "À cette époque"],
  futur: ["Demain", "Bientôt", "Dans une semaine", "Samedi prochain", "Après-demain"],
  "passé composé": ["Hier", "Hier soir", "Il y a deux jours", "La semaine dernière", "Samedi dernier"],
} as const;
/** Les temps qu'un mot de temps n'accepte à coup sûr pas : jamais un mauvais choix ne vient d'un temps que le mot accepte. */
const EXCLUDED = {
  présent: ["imparfait", "futur"],
  imparfait: ["présent", "futur"],
  futur: ["imparfait", "passé composé"],
  "passé composé": ["présent", "futur"],
} as const;
type Marked = keyof typeof MARKERS;
const STORY_MARKERS = ["Un jour", "Soudain", "Alors", "Ce jour-là", "Le lendemain", "Peu après", "Tout à coup", "Aussitôt"] as const;

const LABEL: Record<Tense, string> = { présent: "Présent", imparfait: "Imparfait", futur: "Futur simple", "passé composé": "Passé composé", "passé simple": "Passé simple" };
const IN_TENSE: Record<Tense, string> = { présent: "au présent", imparfait: "à l'imparfait", futur: "au futur simple", "passé composé": "au passé composé", "passé simple": "au passé simple" };
const ALL_TENSES: readonly Tense[] = ["présent", "imparfait", "futur", "passé composé", "passé simple"];

// ===========================================================================
// LES CINQ PALIERS : des cases (verbe, temps, personne), dans l'ordre du plus facile au plus difficile
// ===========================================================================

type Cell = { verb: Verb; tense: Tense; person: number };
const POOL_1 = ["chanter", "jouer", "regarder", "danser", "marcher", "laver", "porter", "parler", "donner", "trouver", "aimer", "écouter"];
const POOL_2 = ["manger", "nager", "ranger", "commencer", "lancer", "finir", "choisir", "grandir", "remplir", "réussir", "avoir", "être"];
const POOL_3 = ["aller", "faire", "dire", "voir", "prendre", "venir", "partir", "courir", "dormir", "vendre"];
const POOL_4 = ["attendre", "répondre", "mettre", "lire", "écrire", "boire", "ouvrir", "pouvoir", "vouloir", "savoir"];
const POOL_5 = [...POOL_3, ...POOL_4, "pêcher", "cultiver", "cuisiner", "raconter", "travailler"];

type Stage = { verbs: readonly string[]; tenses: readonly Tense[] };
type Usable = (verb: Verb, tense: Tense, person: number) => boolean;
/** `count` cases différentes d'une étape, prises dans ses verbes et ses temps à partir de `seed` ; les cases refusées par `usable` sont sautées. */
function cells(stage: Stage, count: number, seed: number, usable: Usable): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>();
  for (let j = 0; out.length < count && j < 600; j++) {
    const verb = verbOf(stage.verbs[(seed * 3 + j * 7) % stage.verbs.length]);
    const tense = stage.tenses[(seed + j) % stage.tenses.length];
    // La personne voulue d'abord ; si la case est refusée (le passé simple n'a que « il » et « ils »), la plus proche qui ne l'est pas.
    const wanted = (seed * 2 + j * 5) % 6;
    for (let shift = 0; shift < 6; shift++) {
      const person = (wanted + shift) % 6;
      const key = `${verb.inf}|${tense}|${person}`;
      if (seen.has(key) || !usable(verb, tense, person)) continue;
      seen.add(key);
      out.push({ verb, tense, person });
      break;
    }
  }
  return out;
}
/** Cinq étapes de six cases : la liste d'un gabarit, qui donne six lignes à chacun des cinq paliers. */
const ladder = (stages: readonly Stage[], seed: number, usable: Usable = canUse): Cell[] => stages.flatMap((stage, rank) => cells(stage, 6, seed + rank, usable));

const GAP_STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["présent", "futur"] },
  { verbs: [...POOL_1, ...POOL_2], tenses: ["imparfait", "futur", "présent"] },
  { verbs: [...POOL_2, ...POOL_1], tenses: ["passé composé", "imparfait"] },
  { verbs: [...POOL_3, ...POOL_4], tenses: ["présent", "futur", "imparfait", "passé composé"] },
  { verbs: POOL_5, tenses: ["passé composé", "futur", "imparfait", "présent"] },
];

// ---------------------------------------------------------------------------
// Compléter une phrase avec le verbe de la parenthèse
// ---------------------------------------------------------------------------

const CONJUGATION = "conjuguer un verbe au présent, à l'imparfait, au futur simple, au passé composé et au passé simple";
const GAP_HINTS = hints("Cherche le mot de temps au début de la phrase.", "Demande-toi qui fait l'action : la fin du verbe en dépend.", "Écris le verbe de la parenthèse au temps qui convient.");

/** Une forme d'une autre personne, au même temps : un mauvais choix que le sujet interdit. */
function otherPerson(verb: Verb, tense: Tense, person: number): string {
  for (let step = 3; step < 9; step++) {
    const candidate = formOf(verb, tense, (person + step) % 6);
    if (candidate !== formOf(verb, tense, person)) return candidate;
  }
  return formOf(verb, tense, (person + 3) % 6);
}
/** Une forme d'un temps que le mot de temps n'accepte pas, à la même personne. */
function otherTense(verb: Verb, tense: Marked, person: number, index: number, avoid: string): string {
  const options = EXCLUDED[tense].filter((excluded) => canUse(verb, excluded, person));
  for (let step = 0; step < options.length; step++) {
    const candidate = formOf(verb, cycle(options, index + step), person);
    if (candidate !== formOf(verb, tense, person) && candidate !== avoid) return candidate;
  }
  return formOf(verb, "imparfait", person);
}

function gapRow(cell: Cell, index: number): GapRow {
  const { verb, tense, person } = cell;
  const marked = tense as Marked;
  const form = formOf(verb, tense, person);
  const text = `${cycle(MARKERS[marked], index)}, ${lead(person, form, index)}___ ${verb.comp}. (${verb.inf})`;
  const wrongPerson = otherPerson(verb, tense, person);
  return gr(text, form, [wrongPerson, otherTense(verb, marked, person, index, wrongPerson)], GAP_HINTS, `ind:${verb.inf}:${tense}:${person}`);
}
export const GAP_ROWS: readonly GapRow[] = ladder(GAP_STAGES, 1).map(gapRow);
export function makeCm1IndGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-ind-trou", CONJUGATION, GAP_ROWS);
}

// ---------------------------------------------------------------------------
// Le passé simple d'un conte
// ---------------------------------------------------------------------------

const SIMPLE_HINTS = hints(
  "Un conte raconte ses actions à un temps de l'écrit.",
  "Au singulier, la fin du verbe est souvent a, it ou ut.",
  "Au pluriel, la fin du verbe est èrent, irent ou urent.",
);
const NOT_SECOND_GROUP = (inf: string) => verbOf(inf).group !== 2;
const SIMPLE_STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["passé simple"] },
  { verbs: [...POOL_2.filter(NOT_SECOND_GROUP), ...POOL_1], tenses: ["passé simple"] },
  { verbs: ["aller", "faire", "voir", "prendre", "venir", "partir", "courir", "dormir", "vendre", "pêcher", "cultiver"], tenses: ["passé simple"] },
  { verbs: [...POOL_4, "attendre"], tenses: ["passé simple"] },
  { verbs: POOL_5, tenses: ["passé simple"] },
];
function simpleRow(cell: Cell, index: number): GapRow {
  const { verb, person } = cell;
  const form = formOf(verb, "passé simple", person);
  const text = `${cycle(STORY_MARKERS, index)}, ${lead(person, form, index)}___ ${verb.comp}. (${verb.inf})`;
  const present = formOf(verb, "présent", person);
  // Un verbe dont le présent s'écrit comme le passé simple (« il dit ») n'a pas son présent pour mauvais choix : le futur le remplace.
  const second = present !== form ? present : formOf(verb, "futur", person);
  return gr(text, form, [formOf(verb, "imparfait", person), second], SIMPLE_HINTS, `ind:${verb.inf}:passé simple:${person}`);
}
export const SIMPLE_ROWS: readonly GapRow[] = ladder(SIMPLE_STAGES, 2).map(simpleRow);
export function makeCm1IndSimple(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-ind-simple", CONJUGATION, SIMPLE_ROWS, 1, 0, "Complète ce conte avec le verbe au passé simple.");
}

// ---------------------------------------------------------------------------
// À quel temps est la phrase ?
// ---------------------------------------------------------------------------

const TENSE_HINTS = hints("Regarde la fin du verbe.", "Compte les mots du verbe : un seul ou deux ?", "Remplace le début de la phrase par hier, demain ou maintenant.");
const TENSE_STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["présent", "futur", "imparfait"] },
  { verbs: [...POOL_1, ...POOL_2], tenses: ["imparfait", "passé composé", "présent"] },
  { verbs: [...POOL_2, ...POOL_3], tenses: ["passé composé", "futur", "imparfait"] },
  { verbs: [...POOL_3, ...POOL_4], tenses: ["présent", "imparfait", "futur", "passé composé"] },
  { verbs: POOL_5, tenses: ["passé simple", "passé composé", "imparfait", "futur", "présent"] },
];
function tenseRow(cell: Cell, index: number): QuestionRow {
  const { verb, tense, person } = cell;
  const others = ALL_TENSES.filter((candidate) => candidate !== tense);
  // Quatre autres temps, deux décalages (1 ou 2) : les deux mauvais choix sont toujours différents.
  const first = cycle(others, index);
  const second = cycle(others, index + 1 + (index % 2));
  return qr(`À quel temps est conjugué le verbe de la phrase « ${clause(verb, tense, person, index)} » ?`, LABEL[tense], [LABEL[first], LABEL[second]], TENSE_HINTS, `ind:${verb.inf}:${tense}:${person}`);
}
export const TENSE_ROWS: readonly QuestionRow[] = ladder(TENSE_STAGES, 3, canIdentify).map(tenseRow);
export function makeCm1IndTense(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-ind-temps", CONJUGATION, TENSE_ROWS, 1, (row) => row.prompt);
}

// ---------------------------------------------------------------------------
// Écrire le verbe conjugué
// ---------------------------------------------------------------------------

const WRITE_HINTS = hints("Pense à la personne de la phrase.", "Le début du verbe reste presque le même, la fin change.", "Écris seulement le verbe, sans le pronom.");
const WRITE_STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["présent", "futur", "imparfait"] },
  { verbs: [...POOL_2, ...POOL_1], tenses: ["imparfait", "futur", "passé composé"] },
  { verbs: [...POOL_2, ...POOL_3], tenses: ["passé composé", "présent", "imparfait"] },
  { verbs: [...POOL_3, ...POOL_4], tenses: ["futur", "présent", "passé composé", "imparfait"] },
  { verbs: POOL_5, tenses: ["passé simple", "futur", "passé composé", "imparfait", "présent"] },
];
function writeRow(cell: Cell): WriteRow {
  const { verb, tense, person } = cell;
  return wr(`Écris le verbe ${verb.inf} ${IN_TENSE[tense]} avec ${PRONOUN[person]}.`, [formOf(verb, tense, person)], WRITE_HINTS, `ind:${verb.inf}:${tense}:${person}`);
}
export const WRITE_ROWS: readonly WriteRow[] = ladder(WRITE_STAGES, 4).map(writeRow);
export function makeCm1IndWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-ind-ecrire", CONJUGATION, WRITE_ROWS);
}

// ---------------------------------------------------------------------------
// Relier un verbe à son temps, glisser des verbes dans deux temps
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Débute par le verbe que tu reconnais le mieux.", "Un verbe en deux mots est toujours à un seul de ces temps.", "Lis la fin de chaque verbe à voix haute.");
const LINK_TRIPLES: readonly (readonly [Tense, Tense, Tense])[] = [
  ["présent", "imparfait", "futur"],
  ["présent", "futur", "imparfait"],
  ["imparfait", "futur", "passé composé"],
  ["présent", "passé composé", "futur"],
  ["passé composé", "passé simple", "imparfait"],
];
const RANK_POOLS: readonly (readonly string[])[] = [POOL_1, [...POOL_1, ...POOL_2], [...POOL_2, ...POOL_3], [...POOL_3, ...POOL_4], POOL_5];
/** Trois verbes de trois temps, trois verbes différents. */
function linkRow(rank: number, n: number): LinkRow {
  const triple = LINK_TRIPLES[rank];
  const picked: Cell[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const verbs = RANK_POOLS[rank].filter((inf) => !picked.some((cell) => cell.verb.inf === inf));
    picked.push(cells({ verbs, tenses: [triple[slot]] }, 1, n * 3 + slot * 2 + rank, canIdentify)[0]);
  }
  return {
    prompt: "Relie chaque verbe conjugué à son temps.",
    pairs: picked.map((cell) => ({ left: tile(cell.person, formOf(cell.verb, cell.tense, cell.person)), right: LABEL[cell.tense] })),
    hints: LINK_HINTS,
  };
}
export const LINK_ROWS: readonly LinkRow[] = LINK_TRIPLES.flatMap((_, rank) => Array.from({ length: 6 }, (__, n) => linkRow(rank, n)));
export function makeCm1IndLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-ind-relier", CONJUGATION, LINK_ROWS);
}

const SORT_HINTS = hints("Dis hier ou demain devant chaque verbe.", "Lis la fin de chaque verbe à voix haute.", "Classe d'abord les verbes dont tu es sûr.");
const SORT_PAIRS: readonly (readonly [Tense, Tense])[] = [
  ["présent", "futur"],
  ["présent", "imparfait"],
  ["imparfait", "passé composé"],
  ["futur", "passé composé"],
  ["passé composé", "passé simple"],
];
function sortRow(rank: number, n: number): SortRow {
  const [first, second] = SORT_PAIRS[rank];
  const used: string[] = [];
  const take = (tense: Tense, seed: number): Cell[] =>
    [0, 1, 2].map((slot) => {
      const verbs = RANK_POOLS[rank].filter((inf) => !used.includes(inf));
      const found = cells({ verbs, tenses: [tense] }, 1, seed + slot * 2, canIdentify)[0];
      used.push(found.verb.inf);
      return found;
    });
  const left = take(first, n * 5 + rank);
  const right = take(second, n * 5 + rank + 1);
  const asItem = (cell: Cell) => ({ text: tile(cell.person, formOf(cell.verb, cell.tense, cell.person)), zone: LABEL[cell.tense] });
  return { prompt: "Glisse chaque verbe dans la bonne case.", zones: [LABEL[first], LABEL[second]], items: [...left.map(asItem), ...right.map(asItem)], hints: SORT_HINTS };
}
export const SORT_ROWS: readonly SortRow[] = SORT_PAIRS.flatMap((_, rank) => Array.from({ length: 6 }, (__, n) => sortRow(rank, n)));
export function makeCm1IndSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-ind-glisser", CONJUGATION, SORT_ROWS);
}

// ---------------------------------------------------------------------------
// Le mot de temps et le verbe vont ensemble
// ---------------------------------------------------------------------------

const MARKER_HINTS = hints("Lis le premier mot de chaque phrase.", "Ce mot dit quand l'action a lieu.", "Retiens la phrase dont le verbe va avec ce mot.");
const MARKER_STAGES: readonly Stage[] = [
  { verbs: POOL_1, tenses: ["futur", "passé composé", "imparfait", "présent"] },
  { verbs: [...POOL_1, ...POOL_2], tenses: ["passé composé", "futur", "imparfait"] },
  { verbs: [...POOL_2, ...POOL_3], tenses: ["imparfait", "passé composé", "futur", "présent"] },
  { verbs: [...POOL_3, ...POOL_4], tenses: ["futur", "passé composé", "présent", "imparfait"] },
  { verbs: POOL_5, tenses: ["passé composé", "imparfait", "futur", "présent"] },
];
function markerRow(cell: Cell, index: number): QuestionRow {
  const { verb, tense, person } = cell;
  const marked = tense as Marked;
  const marker = cycle(MARKERS[marked], index);
  const sentence = (given: Tense) => {
    const form = formOf(verb, given, person);
    return `${marker}, ${lead(person, form, index)}${form} ${verb.comp}.`;
  };
  const [first, second] = EXCLUDED[marked];
  return qr("Quelle phrase est bien écrite ?", sentence(tense), [sentence(first), sentence(second)], MARKER_HINTS, `ind:${verb.inf}:${tense}:${person}`);
}
export const MARKER_ROWS: readonly QuestionRow[] = ladder(MARKER_STAGES, 5, canMark).map(markerRow);
export function makeCm1IndMarker(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-ind-marqueur", CONJUGATION, MARKER_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

// ---------------------------------------------------------------------------
// Le groupe d'un verbe
// ---------------------------------------------------------------------------

const GROUP_LABEL = ["Premier groupe", "Deuxième groupe", "Troisième groupe"] as const;
const GROUP_HINTS = hints("Lis la fin de l'infinitif.", "Dis nous puis le verbe : la fin est-elle issons ?", "Pense aux verbes en er, aux verbes en ir qui font issons, et aux autres.");
const GROUP_STAGES: readonly (readonly string[])[] = [
  ["chanter", "finir", "jouer", "choisir", "regarder", "grandir"],
  ["manger", "remplir", "danser", "réussir", "commencer", "écouter"],
  ["aller", "faire", "prendre", "nager", "marcher", "venir"],
  ["partir", "dormir", "lancer", "courir", "vendre", "porter"],
  ["savoir", "pouvoir", "ouvrir", "être", "avoir", "mettre"],
];
export const GROUP_ROWS: readonly QuestionRow[] = GROUP_STAGES.flatMap((infinitives) =>
  infinitives.map((inf) => {
    const right = GROUP_LABEL[verbOf(inf).group - 1];
    return qr(`À quel groupe appartient le verbe « ${inf} » ?`, right, GROUP_LABEL.filter((label) => label !== right) as unknown as [string, string], GROUP_HINTS);
  }),
);
export function makeCm1IndGroup(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-ind-groupe", CONJUGATION, GROUP_ROWS);
}

// ---------------------------------------------------------------------------
// La phrase bien conjuguée
// ---------------------------------------------------------------------------

const ERROR_HINTS = hints("Dis la phrase à voix haute.", "Cherche la fin du verbe qui va avec le sujet.", "Compare la fin du verbe avec celle que le sujet demande.");
/**
 * Les deux mauvaises formes ne sont justes à AUCUN temps pour ce sujet : l'énoncé dit « bien conjugué », et « À cette époque, vous écrivez » est une forme juste du
 * présent que seul le mot de temps écarte (défaut relevé en production le 25 octobre 2026). Une faute de forme (« écrivaiez ») ou de personne (« vous serons »).
 */
type ErrorSpec = readonly [inf: string, tense: Marked, person: number, wrong: readonly [string, string]];
const ERROR_SPECS: readonly ErrorSpec[] = [
  ["manger", "imparfait", 3, ["mangeions", "mangons"]],
  ["manger", "présent", 3, ["mangons", "mangeont"]],
  ["finir", "imparfait", 5, ["finisaient", "finissait"]],
  ["commencer", "imparfait", 2, ["commencait", "commensait"]],
  ["aller", "présent", 1, ["vais", "allas"]],
  ["commencer", "présent", 3, ["commencons", "commençeons"]],
  ["faire", "présent", 4, ["faisez", "fais"]],
  ["prendre", "présent", 5, ["prendent", "prenent"]],
  ["dire", "présent", 4, ["disez", "disent"]],
  ["prendre", "présent", 2, ["prends", "prent"]],
  ["voir", "futur", 5, ["voiront", "voieront"]],
  ["venir", "futur", 1, ["venras", "viendra"]],
  ["avoir", "futur", 3, ["avrons", "aurrons"]],
  ["être", "futur", 4, ["êtrez", "serons"]],
  ["aller", "futur", 0, ["allerai", "aillerai"]],
  ["faire", "futur", 3, ["faiserons", "ferrons"]],
  ["courir", "futur", 2, ["courera", "courira"]],
  ["vendre", "imparfait", 3, ["vendaient", "vendiez"]],
  ["mettre", "présent", 5, ["mettont", "mettents"]],
  ["ouvrir", "présent", 1, ["ouvrez", "ouvre"]],
  ["écrire", "imparfait", 4, ["écrivaiez", "écrisiez"]],
  ["boire", "présent", 3, ["boivons", "buvont"]],
  ["lire", "imparfait", 5, ["lisait", "lisaint"]],
  ["faire", "passé composé", 3, ["avons fais", "avons faisé"]],
  ["prendre", "passé composé", 5, ["ont prit", "ont prendu"]],
  ["voir", "passé composé", 1, ["as voi", "as voyé"]],
  ["dire", "passé composé", 4, ["avez dis", "avez dité"]],
  ["mettre", "passé composé", 2, ["a mit", "a metté"]],
  ["écrire", "passé composé", 3, ["avons écris", "avons écrivé"]],
  ["ouvrir", "passé composé", 5, ["ont ouvri", "ont ouvré"]],
];
function errorRow(spec: ErrorSpec, index: number): QuestionRow {
  const [inf, tense, person, wrong] = spec;
  const verb = verbOf(inf);
  const marker = cycle(MARKERS[tense], index);
  const sentence = (form: string) => `${marker}, ${lead(person, form, index)}${form} ${verb.comp}.`;
  return qr("Dans quelle phrase le verbe est-il bien conjugué ?", sentence(formOf(verb, tense, person)), [sentence(wrong[0]), sentence(wrong[1])], ERROR_HINTS, `ind:${inf}:${tense}:${person}`);
}
export const ERROR_ROWS: readonly QuestionRow[] = ERROR_SPECS.map(errorRow);
export function makeCm1IndError(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-ind-erreur", CONJUGATION, ERROR_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

// ---------------------------------------------------------------------------
// Les phrases d'un récit au passé composé, à remettre dans l'ordre
// ---------------------------------------------------------------------------

const ORDER_HINTS = hints("Cherche le petit mot qui ouvre l'histoire.", "Chaque phrase s'ouvre par un mot qui dit sa place.", "Le mot de la dernière phrase annonce la fin.");
const story = (a: string, b: string, c: string, d: string): OrderRow => ordr("Remets ces phrases dans l'ordre du récit.", [`D'abord, ${a}`, `Ensuite, ${b}`, `Puis, ${c}`, `Enfin, ${d}`], ORDER_HINTS);
export const ORDER_ROWS: readonly OrderRow[] = [
  story("Awa a pris son panier.", "elle a couru au marché.", "elle a choisi des mangues.", "elle a rempli son panier."),
  story("Moussa a lancé son filet.", "il a attendu longtemps.", "il a pêché trois poissons.", "il a vendu ses poissons."),
  story("nous avons fait un feu.", "nous avons lavé le riz.", "nous avons cuisiné le repas.", "nous avons mangé ensemble."),
  story("Fatou a ouvert son cahier.", "elle a lu la leçon.", "elle a écrit son devoir.", "elle a rangé son cartable."),
  story("les enfants ont couru dans la cour.", "ils ont joué au ballon.", "ils ont bu du lait.", "ils ont dormi sous le baobab."),
  story("Omar a vu un nuage noir.", "il a couru à la maison.", "il a ouvert la porte.", "la pluie a commencé."),
  story("la maîtresse a écrit la date.", "elle a lu un conte.", "les élèves ont répondu aux questions.", "ils ont chanté une chanson."),
  story("Khady a cultivé son champ.", "elle a lavé les légumes.", "elle a porté un seau.", "elle a cuisiné le repas."),
  story("j'ai pris le car.", "j'ai dormi un peu.", "j'ai vu mon cousin.", "nous avons dansé."),
  story("Pape a écouté la radio.", "il a mis la table.", "il a parlé au chef.", "il a mangé du riz."),
  story("nous avons nagé dans la mer.", "nous avons marché sur le sable.", "nous avons trouvé un coquillage.", "nous avons dansé sur la plage."),
  story("Mariama a regardé les tissus.", "elle a choisi un beau pagne.", "elle a parlé au marchand.", "elle a porté son pagne à la maison."),
  story("le chef a écouté les villageois.", "il a répondu à chacun.", "il a dit un proverbe.", "tout le monde a dansé."),
  story("Cheikh a eu très faim.", "il a cuisiné du riz.", "il a bu du lait.", "il a dormi."),
  story("nous avons attendu le car.", "nous avons regardé le paysage.", "nous avons vu un troupeau.", "nous avons fini le voyage."),
];
export function makeCm1IndOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm1-ind-ordre", CONJUGATION, ORDER_ROWS);
}
