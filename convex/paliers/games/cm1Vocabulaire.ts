/**
 * LES GABARITS DE VOCABULAIRE DU CM1 : préfixes et suffixes, synonymes et contraires, sens propre et sens figuré, champ lexical (`fr-cm1-vocabulaire`).
 *
 * Sur l'échantillon de CM1 lu le 23 octobre 2026, le modèle écrivait ici des « contraires » qui ne l'étaient pas (« le contraire de grand est gros »), des synonymes
 * douteux, des mots « formés » qui n'existent pas (« chantage » pour celui qui chante) et des champs lexicaux flous. Ici chaque exercice est BÂTI à partir de
 * tableaux fermés : trente mots avec leur préfixe, trente verbes avec leur suffixe, vingt-cinq groupes de synonymes, trente couples de contraires, trente expressions avec leur
 * sens, cinq thèmes de huit mots. Un mauvais choix est un mot qu'aucun de ces tableaux ne relie au mot de l'énoncé.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - Devant b, m, p, le préfixe in- devient im- (impossible, immobile, imbuvable) ; avec un verbe, le contraire se forme avec dé- (défaire, découvrir). Un adjectif ou un verbe
 *   qui s'écarte de la règle (« illisible », « irréel ») n'est pas dans la fiche et n'est pas dans le tableau.
 * - Un mot a souvent plusieurs contraires ou synonymes : le tableau ne garde que des couples qu'un élève de CM1 donne tous seuls, et les mauvais choix sont pris dans
 *   d'autres groupes (jamais un synonyme du mot, jamais un synonyme de la réponse).
 * - Un nom en -eur (celui qui), -age (l'action), -ment (le résultat) : les mots du tableau sont de vrais mots, les fautes sont des mots qui n'existent pas.
 * - Une expression imagée (« donner sa langue au chat ») a un sens figuré et un sens propre : les mauvais choix sont le sens propre et un autre sens plausible, jamais le sens juste.
 * - Un mot de champ lexical n'appartient qu'à un thème du tableau (« champ » est à l'hivernage, pas à la pêche).
 * - Le contrôleur voit une bonne option plus de deux fois plus longue que les autres : les mauvais choix ont une longueur proche de celle de la bonne réponse.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot de quatre lettres
 * ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 30 lignes pour cinq paliers).
 *
 * HORS FICHE, À FAIRE RELIRE : les trente expressions et leur sens, les cinq thèmes (la pêche, l'hivernage, la fête, l'école, le marché) et leurs quarante mots, les vingt-cinq groupes
 * de synonymes, les trente couples de contraires, les mots formés avec -eur, -age, -ment au-delà de ceux de la fiche.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "former des mots, trouver des synonymes et des contraires, comprendre une expression, reconnaître un champ lexical";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

// ===========================================================================
// LES TABLEAUX
// ===========================================================================

/** Les groupes de synonymes : chaque mot ne figure que dans un groupe. */
export const SYNONYMS: readonly (readonly string[])[] = [
  ["beau", "joli", "magnifique"],
  ["content", "heureux", "ravi"],
  ["triste", "malheureux", "chagriné"],
  ["fatigué", "épuisé", "las"],
  ["grand", "immense", "géant"],
  ["petit", "minuscule", "menu"],
  ["difficile", "dur", "ardu"],
  ["facile", "simple", "aisé"],
  ["commencer", "débuter", "entamer"],
  ["finir", "terminer", "achever"],
  ["regarder", "observer", "contempler"],
  ["interroger", "questionner"],
  ["aider", "secourir", "assister"],
  ["parler", "discuter", "bavarder"],
  ["cacher", "dissimuler", "masquer"],
  ["choisir", "sélectionner", "élire"],
  ["casser", "briser", "fracasser"],
  ["fabriquer", "construire", "bâtir"],
  ["maison", "demeure", "habitation"],
  ["voiture", "auto", "véhicule"],
  ["peur", "frayeur", "crainte"],
  ["colère", "fureur", "rage"],
  ["ami", "camarade", "copain"],
  ["bateau", "navire", "embarcation"],
  ["enfant", "gamin", "bambin"],
];
const clusterOf = (word: string) => SYNONYMS.findIndex((group) => group.includes(word));

/** Les couples de contraires, rangés du plus facile au plus difficile. */
export const ANTONYMS: readonly (readonly [string, string])[] = [
  ["grand", "petit"], ["chaud", "froid"], ["haut", "bas"], ["lourd", "léger"], ["plein", "vide"], ["propre", "sale"],
  ["rapide", "lent"], ["clair", "sombre"], ["riche", "pauvre"], ["fort", "faible"], ["vrai", "faux"], ["jeune", "vieux"],
  ["ouvrir", "fermer"], ["monter", "descendre"], ["arriver", "partir"], ["commencer", "finir"], ["acheter", "vendre"], ["entrer", "sortir"],
  ["jour", "nuit"], ["début", "fin"], ["victoire", "défaite"], ["paix", "guerre"], ["joie", "tristesse"], ["ami", "ennemi"],
  ["aimer", "détester"], ["gagner", "perdre"], ["courage", "peur"], ["avant", "après"], ["facile", "difficile"], ["présent", "absent"],
];

// ---------------------------------------------------------------------------
// Les préfixes : in-, im-, dé-
// ---------------------------------------------------------------------------

const PREFIX_OPTIONS = ["in-", "im-", "dé-"] as const;
const PREFIX_HINTS = hints("Un préfixe se place devant le mot et change son sens.", "Devant b, m ou p, on écrit im- à la place de in-.", "Pour un verbe, le préfixe qui défait l'action est dé-.");
export type PrefixEntry = { base: string; prefix: (typeof PREFIX_OPTIONS)[number]; word: string };
const pre = (base: string, prefix: PrefixEntry["prefix"]): PrefixEntry => ({ base, prefix, word: `${prefix.slice(0, -1)}${base}` });
export const PREFIXES: readonly PrefixEntry[] = [
  pre("possible", "im-"), pre("poli", "im-"), pre("mobile", "im-"), pre("patient", "im-"), pre("parfait", "im-"), pre("probable", "im-"),
  pre("utile", "in-"), pre("visible", "in-"), pre("juste", "in-"), pre("connu", "in-"), pre("actif", "in-"), pre("habile", "in-"),
  pre("faire", "dé-"), pre("coller", "dé-"), pre("couvrir", "dé-"), pre("plier", "dé-"), pre("monter", "dé-"), pre("brancher", "dé-"),
  pre("capable", "in-"), pre("complet", "in-"), pre("direct", "in-"), pre("charger", "dé-"), pre("boucher", "dé-"), pre("nouer", "dé-"),
  pre("mortel", "im-"), pre("moral", "im-"), pre("précis", "im-"), pre("buvable", "im-"), pre("attentif", "in-"), pre("égal", "in-"),
];
export const PREFIX_ROWS: readonly QuestionRow[] = PREFIXES.map((entry) =>
  qr(`Quel préfixe faut-il ajouter à « ${entry.base} » pour former son contraire ?`, entry.prefix, PREFIX_OPTIONS.filter((option) => option !== entry.prefix) as unknown as [string, string], PREFIX_HINTS, `voc:p${entry.base}`),
);
export function makeCm1VocPrefix(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-prefixe", CONCEPT, PREFIX_ROWS);
}

// ---------------------------------------------------------------------------
// Les suffixes : -eur, -age, -ment
// ---------------------------------------------------------------------------

const SUFFIX_HINTS = hints("Un suffixe se place à la fin du mot.", "Pense au verbe sans sa terminaison.", "Dis le mot à voix haute pour entendre sa fin.");
export type SuffixEntry = { verb: string; suffix: "eur" | "age" | "ment"; word: string; faults: readonly [string, string] };
const suf = (verb: string, suffix: SuffixEntry["suffix"], word: string, f1: string, f2: string): SuffixEntry => ({ verb, suffix, word, faults: [f1, f2] });
export const SUFFIXES: readonly SuffixEntry[] = [
  suf("chanter", "eur", "chanteur", "chantheur", "chanteure"),
  suf("nager", "eur", "nageur", "nagueur", "nageure"),
  suf("danser", "eur", "danseur", "dansseur", "danseure"),
  suf("pêcher", "eur", "pêcheur", "pêchaur", "pêcheure"),
  suf("vendre", "eur", "vendeur", "vendreur", "vendeure"),
  suf("porter", "eur", "porteur", "porteure", "portaur"),
  suf("voler", "eur", "voleur", "voleure", "volleur"),
  suf("jouer", "eur", "joueur", "jouaur", "joueure"),
  suf("coiffer", "eur", "coiffeur", "coifeur", "coiffeure"),
  suf("travailler", "eur", "travailleur", "travailleure", "travaileur"),
  suf("tricher", "eur", "tricheur", "tricheure", "trichaur"),
  suf("rêver", "eur", "rêveur", "rêveure", "rèveur"),
  suf("laver", "age", "lavage", "lavège", "lavaje"),
  suf("nettoyer", "age", "nettoyage", "netoyage", "nettoyaje"),
  suf("jardiner", "age", "jardinage", "jardinaje", "jardinnage"),
  suf("bricoler", "age", "bricolage", "bricollage", "bricolaje"),
  suf("arroser", "age", "arrosage", "arosage", "arrosaje"),
  suf("tisser", "age", "tissage", "tisage", "tissaje"),
  suf("trier", "age", "triage", "triaje", "triège"),
  suf("labourer", "age", "labourage", "labourraje", "laboureage"),
  suf("changer", "ment", "changement", "changeement", "changemant"),
  suf("ranger", "ment", "rangement", "rangeement", "rangemant"),
  suf("loger", "ment", "logement", "logeement", "logemant"),
  suf("vêtir", "ment", "vêtement", "vêtiment", "vêtemant"),
  suf("classer", "ment", "classement", "clasement", "classemant"),
  suf("déplacer", "ment", "déplacement", "déplassement", "déplacemant"),
  suf("remplacer", "ment", "remplacement", "remplassement", "remplacemant"),
  suf("rassembler", "ment", "rassemblement", "rassemblemant", "rassemblment"),
  suf("encourager", "ment", "encouragement", "encourageement", "encouragemant"),
  suf("développer", "ment", "développement", "dévelopement", "développemant"),
];
export const SUFFIX_ROWS: readonly QuestionRow[] = SUFFIXES.map((entry) =>
  qr(`Quel nom se forme à partir du verbe « ${entry.verb} » avec le suffixe « -${entry.suffix} » ?`, entry.word, entry.faults, SUFFIX_HINTS, `voc:s${entry.verb}`),
);
export function makeCm1VocSuffix(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-suffixe", CONCEPT, SUFFIX_ROWS);
}

// ---------------------------------------------------------------------------
// Les synonymes et les contraires
// ---------------------------------------------------------------------------

/** La nature de chaque mot des tableaux : les mauvais choix sont de la même nature que la bonne réponse. */
const POS = new Map<string, string>();
SYNONYMS.forEach((group, index) => group.forEach((word) => POS.set(word, index < 8 ? "adjectif" : index < 18 ? "verbe" : "nom")));
ANTONYMS.forEach(([a, b], index) => {
  const pos = index < 12 ? "adjectif" : index < 18 ? "verbe" : index < 24 ? "nom" : ["verbe", "verbe", "nom", "adverbe", "adjectif", "adjectif"][index - 24];
  if (!POS.has(a)) POS.set(a, pos);
  if (!POS.has(b)) POS.set(b, pos);
});

/** Deux mots pris dans des groupes (de synonymes) et des couples (de contraires) étrangers à `word` et à `answer`, de même nature et de longueur proche de `answer`. */
function unrelated(pool: readonly string[], word: string, answer: string, seed: number): [string, string] {
  const banned = new Set<number>([clusterOf(word), clusterOf(answer)].filter((index) => index >= 0));
  const opposed = new Set(ANTONYMS.flatMap(([a, b]) => (a === word || b === word || a === answer || b === answer ? [a, b] : [])));
  const eligible = pool.filter((candidate) => candidate !== word && candidate !== answer && !opposed.has(candidate) && !banned.has(clusterOf(candidate)));
  const samePos = eligible.filter((candidate) => POS.get(candidate) === POS.get(answer));
  const candidates = (samePos.length >= 3 ? samePos : eligible)
    .sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length) || a.localeCompare(b));
  const near = candidates.slice(0, 8);
  const first = cycle(near, seed);
  const second = cycle(near.filter((candidate) => candidate !== first), seed * 3 + 1);
  return [first, second];
}

const SYNONYM_PAIRS: readonly (readonly [string, string])[] = [
  ["joli", "beau"], ["content", "heureux"], ["triste", "malheureux"], ["fatigué", "épuisé"], ["grand", "immense"], ["petit", "minuscule"],
  ["difficile", "dur"], ["facile", "simple"], ["commencer", "débuter"], ["finir", "terminer"], ["regarder", "observer"], ["interroger", "questionner"],
  ["aider", "secourir"], ["parler", "discuter"], ["cacher", "dissimuler"], ["choisir", "sélectionner"], ["casser", "briser"], ["fabriquer", "construire"],
  ["maison", "demeure"], ["voiture", "auto"], ["peur", "frayeur"], ["colère", "fureur"], ["ami", "camarade"], ["bateau", "navire"],
  ["enfant", "gamin"], ["ravi", "content"], ["las", "fatigué"], ["géant", "grand"], ["entamer", "commencer"], ["achever", "finir"],
];
const SYNONYM_HINTS = hints("Un synonyme veut presque dire la même chose.", "Essaie de remplacer le mot dans une phrase.", "Élimine le mot qui change le sens de la phrase.");
const WORDS = SYNONYMS.flat();
export const SYNONYM_ROWS: readonly QuestionRow[] = SYNONYM_PAIRS.map(([word, answer], index) =>
  qr(`Quel mot a presque le même sens que « ${word} » ?`, answer, unrelated(WORDS, word, answer, index), SYNONYM_HINTS, `voc:y${word}`),
);
export function makeCm1VocSynonym(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-synonyme", CONCEPT, SYNONYM_ROWS);
}

const ANTONYM_HINTS = hints("Un contraire dit l'opposé.", "Imagine les deux mots dans une phrase.", "Élimine ce qui n'a aucun rapport avec le mot.");
const ANTONYM_WORDS = ANTONYMS.flat();
export const ANTONYM_ROWS: readonly QuestionRow[] = ANTONYMS.map(([a, b], index) => {
  const [word, answer] = index % 2 === 0 ? [a, b] : [b, a];
  return qr(`Quel est le contraire de « ${word} » ?`, answer, unrelated(ANTONYM_WORDS.concat(WORDS), word, answer, index), ANTONYM_HINTS, `voc:c${word}`);
});
export function makeCm1VocAntonym(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-contraire", CONCEPT, ANTONYM_ROWS);
}

// ---------------------------------------------------------------------------
// Le sens figuré des expressions
// ---------------------------------------------------------------------------

export type Expression = { text: string; meaning: string; wrong: readonly [string, string] };
const idiom = (text: string, meaning: string, w1: string, w2: string): Expression => ({ text, meaning, wrong: [w1, w2] });
export const EXPRESSIONS: readonly Expression[] = [
  idiom("avoir la tête dans les nuages", "être distrait", "voler dans le ciel", "avoir mal à la tête"),
  idiom("coûter les yeux de la tête", "coûter très cher", "perdre la vue", "coûter peu d'argent"),
  idiom("avoir un cœur d'or", "être très généreux", "porter un bijou en or", "être très riche"),
  idiom("tomber dans les pommes", "s'évanouir", "cueillir des fruits", "glisser sur un fruit"),
  idiom("poser un lapin", "ne pas venir à un rendez-vous", "offrir un animal", "jouer avec un lapin"),
  idiom("avoir le cafard", "se sentir triste", "avoir un insecte dans la maison", "être très content"),
  idiom("mettre son grain de sel", "donner son avis sans qu'on le demande", "ajouter du sel au riz", "goûter la soupe"),
  idiom("casser les pieds", "ennuyer quelqu'un", "blesser les pieds", "marcher très vite"),
  idiom("être sur son trente-et-un", "être très bien habillé", "avoir trente ans", "arriver en retard"),
  idiom("avoir un chat dans la gorge", "avoir la voix enrouée", "cacher un animal", "aimer les chats"),
  idiom("donner sa langue au chat", "renoncer à deviner", "nourrir un chat", "parler à un chat"),
  idiom("avoir la main verte", "réussir ses plantations", "avoir la peau verte", "se salir les mains"),
  idiom("avoir un froid de canard", "avoir très froid", "avoir un animal qui a froid", "sentir un petit vent"),
  idiom("avoir un appétit d'oiseau", "manger très peu", "manger des graines", "avoir très faim"),
  idiom("mener quelqu'un en bateau", "le tromper", "le conduire en pirogue", "l'inviter à pêcher"),
  idiom("être comme un poisson dans l'eau", "se sentir très à l'aise", "savoir nager", "vivre dans la mer"),
  idiom("avoir un trou de mémoire", "oublier un instant", "creuser la terre", "se souvenir de tout"),
  idiom("mettre la main à la pâte", "aider à faire un travail", "toucher la pâte", "préparer le pain seul"),
  idiom("avoir les dents longues", "être très ambitieux", "avoir de grandes dents", "avoir mal aux dents"),
  idiom("prendre ses jambes à son cou", "s'enfuir en courant", "se casser la jambe", "porter ses jambes"),
  idiom("revenir bredouille", "revenir sans rien avoir attrapé", "revenir en parlant mal", "revenir très content"),
  idiom("être fier comme un paon", "être très orgueilleux", "avoir des plumes", "regarder un paon"),
  idiom("se mettre en quatre", "faire tout son possible", "se couper en quatre", "compter jusqu'à quatre"),
  idiom("en faire tout un plat", "exagérer l'importance d'une chose", "préparer un grand repas", "cuisiner un plat"),
  idiom("avoir du pain sur la planche", "avoir beaucoup de travail", "manquer de pain", "ranger une planche"),
  idiom("tourner autour du pot", "ne pas dire clairement ce qu'on veut", "marcher autour d'un pot", "cuisiner dans un pot"),
  idiom("faire la tête", "bouder", "avoir mal à la tête", "se couper la tête"),
  idiom("être dans de beaux draps", "se trouver dans une situation difficile", "dormir sous de beaux draps", "acheter du tissu"),
  idiom("avoir une faim de loup", "avoir très faim", "avoir peur d'un loup", "manger un loup"),
  idiom("tirer le diable par la queue", "avoir du mal à gagner sa vie", "attraper un animal", "jouer avec un diable"),
];
const SENSE_HINTS = hints("Une expression ne se comprend pas toujours mot à mot.", "Imagine une personne qui parle, pas un objet.", "Élimine ce qui parle seulement d'objets.");
export const SENSE_ROWS: readonly QuestionRow[] = EXPRESSIONS.map((entry, index) => qr(`Que veut dire « ${entry.text} » ?`, entry.meaning, entry.wrong, SENSE_HINTS, `voc:e${index}`));
export function makeCm1VocSense(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-sens", CONCEPT, SENSE_ROWS);
}

// ---------------------------------------------------------------------------
// Le champ lexical d'un thème
// ---------------------------------------------------------------------------

export const THEMES: Record<string, readonly string[]> = {
  pêche: ["filet", "pirogue", "poisson", "hameçon", "canne", "barque", "appât", "sardine"],
  hivernage: ["pluie", "semis", "champ", "orage", "mil", "houe", "boue", "graine"],
  fête: ["musique", "danse", "tambour", "invités", "cadeau", "gâteau", "joie", "chant"],
  école: ["cahier", "maîtresse", "classe", "leçon", "tableau", "craie", "cartable", "stylo"],
  marché: ["vendeur", "client", "prix", "étal", "panier", "balance", "monnaie", "caisse"],
};
/** Les mots qu'on est sûr de ne pas entendre dans un thème : jamais « gâteau » au marché, « poisson » à la fête. */
export const INTRUDERS: Record<string, readonly string[]> = {
  pêche: ["leçon", "maîtresse", "tableau", "craie", "musique", "danse", "tambour", "invités"],
  hivernage: ["leçon", "classe", "maîtresse", "tableau", "tambour", "musique", "danse", "invités"],
  fête: ["leçon", "classe", "maîtresse", "tableau", "pluie", "orage", "boue", "semis"],
  école: ["filet", "pirogue", "hameçon", "appât", "orage", "boue", "semis", "houe"],
  marché: ["pluie", "orage", "boue", "semis", "leçon", "maîtresse", "tableau", "craie"],
};
const STAGE_THEMES: readonly (readonly [string, string])[] = [
  ["pêche", "fête"],
  ["école", "marché"],
  ["hivernage", "pêche"],
  ["fête", "école"],
  ["marché", "hivernage"],
];
const THEME_HINTS = hints("Cherche le thème que deux mots partagent.", "Le mot qui ne va pas appartient à un autre thème.", "Imagine où tu verrais chaque mot.");
function themeRows(): QuestionRow[] {
  // Chaque thème est posé six fois : six intrus différents, un de plus à chaque fois.
  const used = new Map<string, number>();
  return STAGE_THEMES.flatMap((pair, stage) =>
    Array.from({ length: 6 }, (_, j) => {
      const theme = pair[j % 2];
      const turn = used.get(theme) ?? 0;
      used.set(theme, turn + 1);
      const intruder = INTRUDERS[theme][turn];
      // Deux mots du thème, de longueur proche de l'intrus : la bonne réponse (l'intrus) ne se détache pas.
      const fitting = THEMES[theme].filter((word) => word.length * 2 >= intruder.length);
      const pool = fitting.length >= 2 ? fitting : THEMES[theme];
      const first = cycle(pool, stage + j * 2);
      const second = cycle(pool.filter((word) => word !== first), stage * 2 + j);
      return qr(`Quel mot ne va pas avec le thème « ${theme} » ?`, intruder, [first, second], THEME_HINTS, `voc:t${theme}${j}${stage}`);
    }),
  );
}
export const THEME_ROWS: readonly QuestionRow[] = themeRows();
export function makeCm1VocTheme(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-voc-champ", CONCEPT, THEME_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

// ---------------------------------------------------------------------------
// Compléter avec un synonyme
// ---------------------------------------------------------------------------

const GAP_HINTS = hints("Cherche le mot de même sens que celui entre parenthèses.", "Essaie chaque choix dans la phrase.", "Un mot de sens contraire ou sans rapport ne convient pas.");
const FRAMES: Record<string, string> = {
  commencer: "Les enfants vont ___ la leçon.",
  finir: "Awa doit ___ son devoir.",
  regarder: "Nous allons ___ le ciel.",
  interroger: "Le maître va ___ les élèves.",
  aider: "Les voisins vont ___ le pêcheur.",
  parler: "Awa aime ___ avec Fatou.",
  cacher: "Moussa veut ___ le cadeau.",
  choisir: "Il faut ___ un fruit.",
  casser: "Omar va ___ la branche.",
  fabriquer: "Nous allons ___ une cabane.",
};
const VERB_GROUPS = SYNONYMS.filter((group) => group[0] in FRAMES);
const VERB_POOL = VERB_GROUPS.flat();
export const GAP_ROWS: readonly GapRow[] = (() => {
  const rows: GapRow[] = [];
  VERB_GROUPS.forEach((group, groupIndex) => {
    group.forEach((word, position) => {
      const answer = cycle(group, position + 1);
      rows.push(gr(`${FRAMES[group[0]]} (${word})`, answer, unrelated(VERB_POOL, word, answer, groupIndex * 3 + position), GAP_HINTS, `voc:g${groupIndex}${position}`));
    });
  });
  // Un deuxième cadre pour le groupe de « commencer », et une ligne de plus pour atteindre trente.
  rows.push(gr("Nous allons ___ le repas. (entamer)", "débuter", unrelated(VERB_POOL, "entamer", "débuter", 7), GAP_HINTS, "voc:g-extra"));
  return rows;
})();
export function makeCm1VocGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-voc-trou", CONCEPT, GAP_ROWS, 1, 0, "Complète avec le mot de même sens que celui entre parenthèses.");
}

// ---------------------------------------------------------------------------
// Glisser des mots dans deux thèmes, relier des mots, écrire un mot formé
// ---------------------------------------------------------------------------

const SORT_HINTS = hints("Pense à l'endroit où tu verrais chaque mot.", "Commence par les mots dont tu es sûr.", "Un même thème réunit des mots qui vont ensemble.");
export const SORT_ROWS: readonly SortRow[] = STAGE_THEMES.flatMap(([left, right], stage) =>
  Array.from({ length: 6 }, (_, n) => {
    const pick = (theme: string, offset: number) => Array.from({ length: 3 }, (__, slot) => cycle(THEMES[theme], offset + slot * 3 + n + stage));
    return {
      prompt: "Glisse chaque mot dans le bon thème.",
      zones: [left, right] as const,
      items: [...pick(left, 0).map((text) => ({ text, zone: left })), ...pick(right, 1).map((text) => ({ text, zone: right }))],
      hints: SORT_HINTS,
    };
  }),
);
export function makeCm1VocSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-voc-glisser", CONCEPT, SORT_ROWS);
}

const LINK_HINTS = hints("Débute par le mot dont tu es sûr.", "Essaie chaque mot dans une phrase.", "Élimine les mots déjà reliés.");
type Pairs = readonly (readonly [string, string])[];
/** Six triples de couples tirés des six couples d'un palier. */
function triples(pairs: Pairs): Pairs[] {
  const all: [number, number, number][] = [];
  for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) for (let k = j + 1; k < pairs.length; k++) all.push([i, j, k]);
  return Array.from({ length: 6 }, (_, n) => all[Math.floor((n * all.length) / 6)]).map((indexes) => indexes.map((index) => pairs[index]));
}
function linkRows(): LinkRow[] {
  const sets: { prompt: string; pairs: Pairs }[] = [
    { prompt: "Relie chaque mot à un mot de même sens.", pairs: SYNONYM_PAIRS.slice(0, 6) },
    { prompt: "Relie chaque mot à son contraire.", pairs: ANTONYMS.slice(6, 12) },
    { prompt: "Relie chaque mot à son contraire formé avec un préfixe.", pairs: PREFIXES.slice(12, 18).map((entry) => [entry.base, entry.word] as const) },
    { prompt: "Relie chaque verbe au nom formé avec un suffixe.", pairs: SUFFIXES.slice(18, 24).map((entry) => [entry.verb, entry.word] as const) },
    { prompt: "Relie chaque mot à son contraire.", pairs: ANTONYMS.slice(24, 30) },
  ];
  return sets.flatMap(({ prompt, pairs }) => triples(pairs).map((triple) => ({ prompt, pairs: triple.map(([left, right]) => ({ left, right })), hints: LINK_HINTS })));
}
export const LINK_ROWS: readonly LinkRow[] = linkRows();
export function makeCm1VocLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-voc-relier", CONCEPT, LINK_ROWS);
}

const WRITE_HINTS = hints("Pense au sens du mot demandé.", "Écris le mot en entier, sans oublier de lettre.", "Relis ton mot à voix haute.");
const RE_WORDS: readonly (readonly [string, string])[] = [["faire", "refaire"], ["lire", "relire"], ["voir", "revoir"], ["commencer", "recommencer"], ["monter", "remonter"], ["dire", "redire"]];
const ANTONYM_WRITE: readonly (readonly [string, string])[] = [["vrai", "faux"], ["plein", "vide"], ["ouvrir", "fermer"], ["monter", "descendre"], ["arriver", "partir"], ["jour", "nuit"], ["début", "fin"], ["présent", "absent"], ["acheter", "vendre"], ["riche", "pauvre"], ["victoire", "défaite"], ["joie", "tristesse"]];
function writeRows(): WriteRow[] {
  const prefix = (entry: PrefixEntry) => wr(`Écris le mot formé avec le préfixe « ${entry.prefix} » et le mot « ${entry.base} ».`, [entry.word], WRITE_HINTS, `voc:p${entry.base}`);
  const suffix = (entry: SuffixEntry) => wr(`Écris le nom formé à partir du verbe « ${entry.verb} » avec le suffixe « -${entry.suffix} ».`, [entry.word], WRITE_HINTS, `voc:s${entry.verb}`);
  const re = ([base, word]: readonly [string, string]) => wr(`Écris le mot formé avec le préfixe « re- » et le mot « ${base} ».`, [word], WRITE_HINTS, `voc:r${base}`);
  const contrary = ([word, answer]: readonly [string, string]) => wr(`Écris le contraire de « ${word} ».`, [answer], WRITE_HINTS, `voc:c${word}`);
  return [
    ...RE_WORDS.slice(0, 3).map(re), ...ANTONYM_WRITE.slice(0, 3).map(contrary),
    ...PREFIXES.slice(0, 3).map(prefix), ...SUFFIXES.slice(0, 3).map(suffix),
    ...PREFIXES.slice(12, 15).map(prefix), ...ANTONYM_WRITE.slice(3, 6).map(contrary),
    ...SUFFIXES.slice(12, 15).map(suffix), ...SUFFIXES.slice(20, 23).map(suffix),
    ...ANTONYM_WRITE.slice(6, 9).map(contrary), ...SUFFIXES.slice(24, 27).map(suffix),
  ];
}
export const WRITE_ROWS: readonly WriteRow[] = writeRows();
export function makeCm1VocWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-voc-ecrire", CONCEPT, WRITE_ROWS);
}
