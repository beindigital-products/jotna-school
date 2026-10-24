/**
 * LES GABARITS DES ACCORDS DU CM1 : le verbe et son sujet (même éloigné, ou placé après le verbe), l'adjectif, le participe passé avec « être », le pluriel
 * des noms en -al, -eau, -ou, -eu et -au (`fr-cm1-accords`).
 *
 * Sur l'échantillon de CM1 lu le 23 octobre 2026, le modèle écrivait ici des phrases à accorder dont la réponse était fausse (« Les enfants du village joue »),
 * des pluriels inventés (« des chevals ») et des questions où le mot à accorder se lisait dans l'énoncé. Ici chaque exercice est BÂTI à partir de tableaux fermés :
 * quarante verbes à la 3e personne, quinze adjectifs à quatre formes, dix participes avec être à quatre formes, trente noms avec leur pluriel et deux fautes
 * typiques. La réponse est l'unique forme que le genre et le nombre du NOM CHEF du sujet permettent.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - L'accord se fait avec le nom chef du sujet, pas avec le mot le plus proche du verbe : « Les enfants du village ___ (chanter) » demande chantent, pas chante.
 *   Un mauvais choix est donc la forme que l'autre nombre donnerait, et une forme de la 2e personne, jamais une forme possible pour ce sujet.
 * - Un sujet placé après le verbe (« Dans la cour jouent les enfants ») fait aussi accorder le verbe ; l'énoncé ne dit jamais qui est le sujet.
 * - Le masculin l'emporte sur le féminin quand un sujet coordonne un garçon et une fille (« Awa et Omar sont partis »).
 * - « heureux », « vieux », « doux » et « frais » ont la même forme au masculin singulier et pluriel : une réponse à écrire n'en fait jamais le masculin pluriel (la réponse
 *   serait dans l'énoncé).
 * - Le pluriel en -x des noms en -eau, -al (-aux), -ou (sept noms) et -eu ; les autres noms en -ou, et « pneu », font -s. Aucun nom du tableau n'est une exception rare.
 * - Le contrôleur voit une bonne option plus de deux fois plus longue que les autres : les groupes du sujet à retrouver ont des longueurs voisines.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot de quatre lettres
 * ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 30 lignes pour cinq paliers).
 *
 * HORS FICHE, À FAIRE RELIRE : les verbes irréguliers (faire, aller, dire, lire, voir, boire), les trente noms et leurs pluriels (cailloux, joujoux, kangourous, neveux), le
 * participe de descendre, les trente groupes sujets à retrouver, les phrases de la vie courante (le baobab, la pirogue, le marché).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "accorder le verbe, l'adjectif, le participe passé et le pluriel des noms";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

// ===========================================================================
// LES TABLEAUX
// ===========================================================================

/** Les formes d'un verbe au présent : 3e du singulier, 3e du pluriel, 2e du singulier (la faute qu'aucun sujet de la 3e personne ne permet), et la fin de phrase. */
type VerbForms = { inf: string; one: string; many: string; you: string; tail: string };
const verb = (inf: string, one: string, many: string, you: string, tail: string): VerbForms => ({ inf, one, many, you, tail });
export const VERBS: Record<string, VerbForms> = Object.fromEntries(
  [
    verb("chanter", "chante", "chantent", "chantes", "une chanson"),
    verb("jouer", "joue", "jouent", "joues", "au ballon"),
    verb("parler", "parle", "parlent", "parles", "au chef"),
    verb("danser", "danse", "dansent", "danses", "sur la place"),
    verb("travailler", "travaille", "travaillent", "travailles", "dans le champ"),
    verb("marcher", "marche", "marchent", "marches", "sur le chemin"),
    verb("porter", "porte", "portent", "portes", "un seau"),
    verb("regarder", "regarde", "regardent", "regardes", "le match"),
    verb("écouter", "écoute", "écoutent", "écoutes", "la radio"),
    verb("manger", "mange", "mangent", "manges", "du riz"),
    verb("finir", "finit", "finissent", "finis", "le devoir"),
    verb("vendre", "vend", "vendent", "vends", "des mangues"),
    verb("prendre", "prend", "prennent", "prends", "le car"),
    verb("venir", "vient", "viennent", "viens", "chez nous"),
    verb("faire", "fait", "font", "fais", "un gâteau"),
    verb("aller", "va", "vont", "vas", "au marché"),
    verb("dire", "dit", "disent", "dis", "bonjour"),
    verb("lire", "lit", "lisent", "lis", "un livre"),
    verb("voir", "voit", "voient", "vois", "un oiseau"),
    verb("boire", "boit", "boivent", "bois", "du lait"),
  ].map((entry) => [entry.inf, entry]),
);

/** Un sujet avec son nombre : le nom chef donne l'accord. */
type Subject = { text: string; plural: boolean };
const subj = (text: string, plural: boolean): Subject => ({ text, plural });

// ---------------------------------------------------------------------------
// Le verbe s'accorde avec son sujet
// ---------------------------------------------------------------------------

const VERB_HINTS = hints("Trouve le sujet du verbe en demandant qui accomplit l'action.", "Le sujet n'est pas toujours le mot le plus proche du verbe.", "Écris la terminaison qui va avec le sujet.");
const SIMPLE_SUBJECTS: readonly Subject[] = [subj("Le pêcheur", false), subj("Les enfants", true), subj("La maîtresse", false), subj("Les élèves", true), subj("Awa", false), subj("Les femmes", true)];
/** Des sujets qui peuvent chanter, parler, venir : les verbes des paliers 2, 4 et 5 ne s'accordent qu'avec eux. */
const FAR_PEOPLE: readonly Subject[] = [
  subj("Le chef des pêcheurs", false),
  subj("Les enfants du village", true),
  subj("La fille des voisins", false),
  subj("Les pêcheurs de la côte", true),
  subj("Le frère des élèves", false),
  subj("Les femmes du quartier", true),
];
const INVERTED: readonly (readonly [string, string, boolean])[] = [
  ["Dans la cour", "les enfants", true],
  ["Sur la plage", "le pêcheur", false],
  ["Vers le puits", "les femmes", true],
  ["Au marché", "la mère", false],
  ["Dans la classe", "les élèves", true],
  ["Sous le baobab", "le chat", false],
];
const COORDINATED: readonly Subject[] = [subj("Awa et Moussa", true), subj("Omar et Pape", true), subj("Fatou et Khady", true)];

/** La phrase à trou d'un verbe : un sujet, ou une phrase où le sujet suit le verbe. */
function verbRow(sentence: { before: string; after?: string; plural: boolean }, inf: string, index: number): GapRow {
  const forms = VERBS[inf];
  const answer = sentence.plural ? forms.many : forms.one;
  const wrong = [sentence.plural ? forms.one : forms.many, forms.you] as [string, string];
  const text = sentence.after !== undefined ? `${sentence.before} ___ (${inf}) ${sentence.after}.` : `${sentence.before} ___ (${inf}) ${forms.tail}.`;
  return gr(text, answer, wrong, VERB_HINTS, `acc:v${index}`);
}
function verbRows(): GapRow[] {
  const easy = ["chanter", "jouer", "parler", "danser", "travailler", "marcher"];
  const rows: GapRow[] = [];
  // Palier 1 : le sujet est collé au verbe.
  easy.forEach((inf, k) => rows.push(verbRow({ before: SIMPLE_SUBJECTS[k].text, plural: SIMPLE_SUBJECTS[k].plural }, inf, rows.length)));
  // Palier 2 : un complément du nom, de l'autre nombre, s'intercale.
  ["porter", "regarder", "écouter", "manger", "chanter", "jouer"].forEach((inf, k) => rows.push(verbRow({ before: FAR_PEOPLE[k].text, plural: FAR_PEOPLE[k].plural }, inf, rows.length)));
  // Palier 3 : le sujet est après le verbe.
  ["jouer", "marcher", "danser", "vendre", "travailler", "chanter"].forEach((inf, k) => rows.push(verbRow({ before: INVERTED[k][0], after: INVERTED[k][1], plural: INVERTED[k][2] }, inf, rows.length)));
  // Palier 4 : des verbes dont le pluriel ne se devine pas.
  ["finir", "prendre", "venir", "faire", "aller", "dire"].forEach((inf, k) => rows.push(verbRow({ before: FAR_PEOPLE[(k + 1) % FAR_PEOPLE.length].text, plural: FAR_PEOPLE[(k + 1) % FAR_PEOPLE.length].plural }, inf, rows.length)));
  // Palier 5 : des sujets coordonnés, des verbes irréguliers, un complément éloigné.
  [
    ["lire", COORDINATED[0]],
    ["voir", FAR_PEOPLE[2]],
    ["boire", COORDINATED[1]],
    ["faire", FAR_PEOPLE[3]],
    ["aller", COORDINATED[2]],
    ["dire", FAR_PEOPLE[4]],
  ].forEach(([inf, subject]) => rows.push(verbRow({ before: (subject as Subject).text, plural: (subject as Subject).plural }, inf as string, rows.length)));
  return rows;
}
export const VERB_ROWS: readonly GapRow[] = verbRows();
export function makeCm1AccVerb(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-acc-verbe", CONCEPT, VERB_ROWS, 2);
}

// ---------------------------------------------------------------------------
// L'adjectif et le participe passé s'accordent avec le nom chef
// ---------------------------------------------------------------------------

/** Les quatre formes : masculin singulier, féminin singulier, masculin pluriel, féminin pluriel. */
type Forms = readonly [string, string, string, string];
export const ADJECTIVES: Record<string, Forms> = {
  joli: ["joli", "jolie", "jolis", "jolies"],
  grand: ["grand", "grande", "grands", "grandes"],
  petit: ["petit", "petite", "petits", "petites"],
  content: ["content", "contente", "contents", "contentes"],
  gentil: ["gentil", "gentille", "gentils", "gentilles"],
  lourd: ["lourd", "lourde", "lourds", "lourdes"],
  fatigué: ["fatigué", "fatiguée", "fatigués", "fatiguées"],
  mûr: ["mûr", "mûre", "mûrs", "mûres"],
  prêt: ["prêt", "prête", "prêts", "prêtes"],
  long: ["long", "longue", "longs", "longues"],
  blanc: ["blanc", "blanche", "blancs", "blanches"],
  beau: ["beau", "belle", "beaux", "belles"],
  nouveau: ["nouveau", "nouvelle", "nouveaux", "nouvelles"],
  heureux: ["heureux", "heureuse", "heureux", "heureuses"],
  vieux: ["vieux", "vieille", "vieux", "vieilles"],
  doux: ["doux", "douce", "doux", "douces"],
  frais: ["frais", "fraîche", "frais", "fraîches"],
};
export const PARTICIPLES: Record<string, Forms> = {
  arriver: ["arrivé", "arrivée", "arrivés", "arrivées"],
  partir: ["parti", "partie", "partis", "parties"],
  venir: ["venu", "venue", "venus", "venues"],
  tomber: ["tombé", "tombée", "tombés", "tombées"],
  sortir: ["sorti", "sortie", "sortis", "sorties"],
  rester: ["resté", "restée", "restés", "restées"],
  entrer: ["entré", "entrée", "entrés", "entrées"],
  monter: ["monté", "montée", "montés", "montées"],
  descendre: ["descendu", "descendue", "descendus", "descendues"],
  aller: ["allé", "allée", "allés", "allées"],
};
const PARTICIPLE_TAILS: Record<string, string> = {
  arriver: "hier",
  partir: "tôt",
  venir: "chez nous",
  tomber: "dans la mer",
  sortir: "de la classe",
  rester: "à la maison",
  entrer: "dans la cour",
  monter: "sur la natte",
  descendre: "du car",
  aller: "au marché",
};
/** Un sujet avec son genre et son nombre : l'index de la forme à écrire (0 à 3). */
type Agreeing = { text: string; at: 0 | 1 | 2 | 3; copula: "est" | "sont" };
const agree = (text: string, at: 0 | 1 | 2 | 3): Agreeing => ({ text, at, copula: at >= 2 ? "sont" : "est" });
const SIMPLE_AGREEING: readonly Agreeing[] = [
  agree("Le pagne", 0), agree("La robe", 1), agree("Les poissons", 2), agree("Les fleurs", 3), agree("Mon frère", 0), agree("Ma sœur", 1),
  agree("Mes cousins", 2), agree("Mes cousines", 3), agree("Le cahier", 0), agree("La maison", 1), agree("Les enfants", 2), agree("Les mangues", 3),
];
const NAME_AGREEING: readonly Agreeing[] = [agree("Awa", 1), agree("Moussa", 0), agree("Fatou", 1), agree("Omar", 0), agree("Khady", 1), agree("Pape", 0)];
const FAR_AGREEING: readonly Agreeing[] = [
  agree("Le pagne des filles", 0), agree("La robe des fillettes", 1), agree("Les fleurs du jardin", 3), agree("Les poissons de la mer", 2), agree("Le cahier des élèves", 0), agree("La maison des pêcheurs", 1),
  agree("Les mangues du marché", 3), agree("Les enfants du village", 2), agree("Le chat des voisins", 0), agree("La sœur des garçons", 1),
];
/** Des personnes, pour les verbes qui se conjuguent avec être (arriver, partir, venir…). */
const PEOPLE_AGREEING: readonly Agreeing[] = [
  agree("Mon frère", 0), agree("Ma sœur", 1), agree("Mes cousins", 2), agree("Mes cousines", 3), agree("Les garçons", 2), agree("Les filles", 3),
  agree("Mon voisin", 0), agree("Ma voisine", 1), agree("Les pêcheurs", 2), agree("Les femmes", 3), agree("Le chef", 0), agree("La maîtresse", 1),
];
const FAR_PEOPLE_AGREEING: readonly Agreeing[] = [
  agree("Le frère des voisins", 0), agree("La sœur des garçons", 1), agree("Les enfants du village", 2), agree("Les filles du quartier", 3), agree("Le chef des pêcheurs", 0), agree("La fille des voisins", 1),
];
const GROUP_AGREEING: readonly Agreeing[] = [
  agree("Awa et Fatou", 3), agree("Moussa et Pape", 2), agree("Awa et Omar", 2), agree("Khady et Mariama", 3), agree("Les filles et les garçons", 2), agree("Omar et Khady", 2),
];

const ADJECTIVE_HINTS = hints("Trouve le nom que l'adjectif décrit.", "Regarde si ce nom est masculin ou féminin, singulier ou pluriel.", "L'adjectif prend le genre et le nombre du nom.");
function adjectiveRow(subject: Agreeing, base: string, index: number, adverb = ""): GapRow {
  const forms = ADJECTIVES[base];
  const answer = forms[subject.at];
  const wrong = forms.filter((form, at) => at !== subject.at && form !== answer).filter((form, at, all) => all.indexOf(form) === at).slice(0, 2) as [string, string];
  const copula = subject.copula;
  return gr(`${subject.text} ${copula} ${adverb}___ (${base}).`, answer, wrong, ADJECTIVE_HINTS, `acc:a${index}`);
}
function adjectiveRows(): GapRow[] {
  const pick = (list: readonly Agreeing[], k: number) => cycle(list, k);
  const rows: GapRow[] = [];
  const make = (subject: Agreeing, base: string, adverb?: string) => rows.push(adjectiveRow(subject, base, rows.length, adverb));
  // Palier 1 : des adjectifs réguliers, un nom collé au verbe.
  ["joli", "grand", "petit", "content", "gentil", "lourd"].forEach((base, k) => make(pick(SIMPLE_AGREEING, k * 2 + 1), base));
  // Palier 2 : des accents et des consonnes muettes.
  ["fatigué", "mûr", "prêt", "long", "blanc", "joli"].forEach((base, k) => make(pick(SIMPLE_AGREEING, k * 2 + 4), base, "très "));
  // Palier 3 : le féminin ne se devine pas.
  ["beau", "nouveau", "heureux", "vieux", "doux", "frais"].forEach((base, k) => make(pick(NAME_AGREEING, k).at === 1 || k % 2 === 0 ? pick(SIMPLE_AGREEING, k * 3) : pick(NAME_AGREEING, k), base));
  // Palier 4 : un complément du nom, de l'autre nombre, s'intercale.
  ["petit", "joli", "grand", "lourd", "content", "gentil"].forEach((base, k) => make(pick(FAR_AGREEING, k * 2 + 1), base));
  // Palier 5 : des sujets coordonnés, des adjectifs difficiles.
  ["heureux", "beau", "fatigué", "nouveau", "vieux", "mûr"].forEach((base, k) => make(pick(GROUP_AGREEING, k), base));
  return rows;
}
export const ADJECTIVE_ROWS: readonly GapRow[] = adjectiveRows();
export function makeCm1AccAdjective(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-acc-adjectif", CONCEPT, ADJECTIVE_ROWS);
}

const PARTICIPLE_HINTS = hints("Trouve le sujet du verbe être.", "Le participe passé avec être s'accorde avec le sujet.", "Regarde si le sujet est masculin ou féminin, singulier ou pluriel.");
function participleRow(subject: Agreeing, inf: string, index: number): GapRow {
  const forms = PARTICIPLES[inf];
  const answer = forms[subject.at];
  const wrong = forms.filter((form, at) => at !== subject.at && form !== answer).filter((form, at, all) => all.indexOf(form) === at).slice(0, 2) as [string, string];
  return gr(`${subject.text} ${subject.copula} ___ (${inf}) ${PARTICIPLE_TAILS[inf]}.`, answer, wrong, PARTICIPLE_HINTS, `acc:p${index}`);
}
function participleRows(): GapRow[] {
  const rows: GapRow[] = [];
  const make = (subject: Agreeing, inf: string) => rows.push(participleRow(subject, inf, rows.length));
  // Palier 1 : un prénom, un nom au singulier.
  ["arriver", "partir", "venir", "tomber", "sortir", "rester"].forEach((inf, k) => make(cycle(NAME_AGREEING, k), inf));
  // Palier 2 : des noms au pluriel.
  ["entrer", "monter", "arriver", "partir", "aller", "venir"].forEach((inf, k) => make(cycle(PEOPLE_AGREEING, k * 2 + 2), inf));
  // Palier 3 : un nom au féminin ou au masculin, singulier ou pluriel.
  ["tomber", "sortir", "rester", "entrer", "descendre", "monter"].forEach((inf, k) => make(cycle(PEOPLE_AGREEING, k * 2 + 1), inf));
  // Palier 4 : des sujets coordonnés, le masculin l'emporte.
  ["arriver", "partir", "venir", "aller", "descendre", "tomber"].forEach((inf, k) => make(cycle(GROUP_AGREEING, k), inf));
  // Palier 5 : un complément du nom intercalé.
  ["sortir", "rester", "entrer", "monter", "descendre", "aller"].forEach((inf, k) => make(cycle(FAR_PEOPLE_AGREEING, k), inf));
  return rows;
}
export const PARTICIPLE_ROWS: readonly GapRow[] = participleRows();
export function makeCm1AccParticiple(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-acc-participe", CONCEPT, PARTICIPLE_ROWS);
}

// ---------------------------------------------------------------------------
// Le pluriel des noms
// ---------------------------------------------------------------------------

/** Un nom, son pluriel, et deux fautes typiques. */
type Plural = { one: string; many: string; faults: readonly [string, string] };
const noun = (one: string, many: string, f1: string, f2: string): Plural => ({ one, many, faults: [f1, f2] });
export const PLURALS: readonly Plural[] = [
  // Palier 1 : des noms réguliers et en -eau.
  noun("chat", "chats", "chatx", "chates"),
  noun("livre", "livres", "livrex", "livrs"),
  noun("bateau", "bateaux", "bateaus", "bateos"),
  noun("gâteau", "gâteaux", "gâteaus", "gâteos"),
  noun("oiseau", "oiseaux", "oiseaus", "oiseos"),
  noun("cadeau", "cadeaux", "cadeaus", "cadeos"),
  // Palier 2 : -al devient -aux.
  noun("cheval", "chevaux", "chevals", "chevaus"),
  noun("journal", "journaux", "journals", "journaus"),
  noun("animal", "animaux", "animals", "animaus"),
  noun("canal", "canaux", "canals", "canaus"),
  noun("hôpital", "hôpitaux", "hôpitals", "hôpitaus"),
  noun("métal", "métaux", "métals", "métaus"),
  // Palier 3 : les sept noms en -ou qui font -oux (six ici).
  noun("bijou", "bijoux", "bijous", "bijoues"),
  noun("caillou", "cailloux", "caillous", "cailloues"),
  noun("chou", "choux", "chous", "choues"),
  noun("genou", "genoux", "genous", "genoues"),
  noun("hibou", "hiboux", "hibous", "hiboues"),
  noun("joujou", "joujoux", "joujous", "joujoues"),
  // Palier 4 : les autres noms en -ou font -s.
  noun("trou", "trous", "troux", "troues"),
  noun("clou", "clous", "cloux", "cloues"),
  noun("sou", "sous", "soux", "soues"),
  noun("verrou", "verrous", "verroux", "verroues"),
  noun("cou", "cous", "coux", "coues"),
  noun("kangourou", "kangourous", "kangouroux", "kangouroues"),
  // Palier 5 : -eu et -au, et « pneu ».
  noun("jeu", "jeux", "jeus", "jeues"),
  noun("feu", "feux", "feus", "feues"),
  noun("neveu", "neveux", "neveus", "neveues"),
  noun("pneu", "pneus", "pneux", "pneues"),
  noun("tuyau", "tuyaux", "tuyaus", "tuyaues"),
  noun("noyau", "noyaux", "noyaus", "noyaues"),
];
const PLURAL_HINTS = hints("Pense à la fin du mot au singulier.", "Les mots en al, en eau ou en ou ont chacun leur règle.", "Dis le mot avec « des » devant pour entendre la fin.");
export const PLURAL_ROWS: readonly QuestionRow[] = PLURALS.map((entry) => qr(`Quel est le pluriel du mot « ${entry.one} » ?`, entry.many, entry.faults, PLURAL_HINTS, `acc:n${entry.one}`));
export function makeCm1AccPlural(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-acc-pluriel", CONCEPT, PLURAL_ROWS);
}

// ---------------------------------------------------------------------------
// Écrire un pluriel, relier un nom et son pluriel, glisser des noms en -s ou en -x
// ---------------------------------------------------------------------------

/** Quinze noms et quinze adjectifs à écrire : le nom au pluriel, l'adjectif au féminin ou au masculin pluriel (jamais quand le pluriel s'écrit comme le singulier). */
const ADJECTIVE_PLURAL: readonly (readonly [string, "féminin" | "masculin"])[] = [
  ["joli", "féminin"], ["grand", "féminin"], ["petit", "féminin"], ["content", "masculin"], ["gentil", "féminin"], ["lourd", "masculin"],
  ["fatigué", "féminin"], ["mûr", "masculin"], ["prêt", "féminin"], ["long", "masculin"], ["blanc", "féminin"], ["beau", "masculin"],
  ["nouveau", "masculin"], ["heureux", "féminin"], ["vieux", "féminin"], ["doux", "féminin"], ["frais", "féminin"], ["petit", "masculin"],
  ["gentil", "masculin"], ["fatigué", "masculin"], ["prêt", "masculin"], ["blanc", "masculin"], ["joli", "masculin"], ["grand", "masculin"],
  ["long", "féminin"], ["lourd", "féminin"], ["content", "féminin"], ["mûr", "féminin"], ["beau", "féminin"], ["nouveau", "féminin"],
];
const WRITE_HINTS = hints("Pense à la fin du mot au singulier.", "Dis le mot avec « des » ou « les » devant.", "Écris le mot en entier, sans oublier la marque du pluriel.");
function writeRows(): WriteRow[] {
  // Cinq paliers de six lignes : trois noms au pluriel, puis trois adjectifs.
  return [0, 1, 2, 3, 4].flatMap((stage) =>
    [0, 1, 2].flatMap((j) => {
      const entry = PLURALS[stage * 6 + j * 2];
      const [base, gender] = ADJECTIVE_PLURAL[stage * 3 + j];
      const forms = ADJECTIVES[base];
      return [
        wr(`Écris le pluriel du mot « ${entry.one} ».`, [entry.many], WRITE_HINTS, `acc:n${entry.one}`),
        wr(`Écris l'adjectif « ${base} » au ${gender} pluriel.`, [gender === "féminin" ? forms[3] : forms[2]], WRITE_HINTS, `acc:w${base}${gender}`),
      ];
    }),
  );
}
export const WRITE_ROWS: readonly WriteRow[] = writeRows();
export function makeCm1AccWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-acc-ecrire", CONCEPT, WRITE_ROWS, 2);
}

const LINK_HINTS = hints("Débute par le mot dont tu connais le pluriel.", "Pense à la fin de chaque mot.", "Un mot en eau ou en al garde sa règle.");
function linkRows(): LinkRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const group = PLURALS.slice(stage * 6, stage * 6 + 6);
    const triples: Plural[][] = [];
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let k = j + 1; k < 6; k++) triples.push([group[i], group[j], group[k]]);
    return Array.from({ length: 6 }, (_, n) => triples[Math.floor((n * triples.length) / 6)]).map((triple) => ({
      prompt: "Relie chaque nom à son pluriel.",
      pairs: triple.map((entry) => ({ left: entry.one, right: entry.many })),
      hints: LINK_HINTS,
    }));
  });
}
export const LINK_ROWS: readonly LinkRow[] = linkRows();
export function makeCm1AccLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-acc-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Imagine le mot avec « des » devant.", "Rappelle-toi les mots en eau, en al, en ou.", "Écris le mot en entier avant de décider.");
const SORT_ZONES = ["Prend un s", "Prend un x"] as const;
const takesS = (entry: Plural) => entry.many.endsWith("s");
function sortRows(): SortRow[] {
  const withS = PLURALS.filter(takesS);
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const group = PLURALS.slice(stage * 6, stage * 6 + 6);
    const withX = group.filter((entry) => !takesS(entry));
    const others = PLURALS.filter((entry) => !takesS(entry));
    return Array.from({ length: 6 }, (_, n) => {
      const xs = Array.from({ length: 3 }, (__, slot) => cycle(withX.length >= 3 ? withX : others, n * 2 + slot));
      const ss = Array.from({ length: 3 }, (__, slot) => cycle(withS, n + slot + stage));
      return {
        prompt: "Glisse chaque nom dans la bonne case.",
        zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
        items: [...ss.map((entry) => ({ text: entry.one, zone: SORT_ZONES[0] })), ...xs.map((entry) => ({ text: entry.one, zone: SORT_ZONES[1] }))],
        hints: SORT_HINTS,
      };
    });
  });
}
export const SORT_ROWS: readonly SortRow[] = sortRows();
export function makeCm1AccSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-acc-glisser", CONCEPT, SORT_ROWS);
}

// ---------------------------------------------------------------------------
// Retrouver le sujet d'un verbe
// ---------------------------------------------------------------------------

const SUBJECT_HINTS = hints("Trouve le verbe, puis demande qui accomplit l'action.", "Un complément du nom n'est pas le sujet.", "Le sujet peut se trouver après le verbe.");
export type SubjectEntry = { text: string; verb: string; subject: string; others: readonly [string, string] };
const sbj = (text: string, verbForm: string, subject: string, o1: string, o2: string): SubjectEntry => ({ text, verb: verbForm, subject, others: [o1, o2] });
export const SUBJECT_LIST: readonly SubjectEntry[] = [
  // Palier 1.
  sbj("Le chef des pêcheurs parle au village.", "parle", "Le chef", "les pêcheurs", "le village"),
  sbj("Les enfants du village chantent le soir.", "chantent", "Les enfants", "le village", "le soir"),
  sbj("La maîtresse des élèves lit un conte.", "lit", "La maîtresse", "les élèves", "un conte"),
  sbj("Les oiseaux du baobab chantent le matin.", "chantent", "Les oiseaux", "le baobab", "le matin"),
  sbj("Le chat des voisins dort sous la natte.", "dort", "Le chat", "les voisins", "la natte"),
  sbj("Les pêcheurs de la côte lancent leurs filets.", "lancent", "Les pêcheurs", "la côte", "leurs filets"),
  // Palier 2.
  sbj("La fille des voisins range sa chambre.", "range", "La fille", "les voisins", "sa chambre"),
  sbj("Les cahiers de la maîtresse sont sur la table.", "sont", "Les cahiers", "la maîtresse", "la table"),
  sbj("Le frère de mes cousins joue dans la cour.", "joue", "Le frère", "mes cousins", "la cour"),
  sbj("Les mangues du marché sont mûres.", "sont", "Les mangues", "le marché", "mûres"),
  sbj("Le cahier des élèves est neuf.", "est", "Le cahier", "les élèves", "neuf"),
  sbj("Les femmes du quartier vendent du riz.", "vendent", "Les femmes", "le quartier", "du riz"),
  // Palier 3 : le sujet est après le verbe.
  sbj("Dans la cour jouent les enfants du village.", "jouent", "les enfants", "la cour", "le village"),
  sbj("Sur la plage courent les enfants des pêcheurs.", "courent", "les enfants", "la plage", "les pêcheurs"),
  sbj("Vers le puits marchent les femmes du village.", "marchent", "les femmes", "le puits", "le village"),
  sbj("Au marché vend la mère des garçons.", "vend", "la mère", "le marché", "les garçons"),
  sbj("Dans la classe lisent les élèves de la maîtresse.", "lisent", "les élèves", "la classe", "la maîtresse"),
  sbj("Sous le baobab dorment les chats des voisins.", "dorment", "les chats", "le baobab", "les voisins"),
  // Palier 4 : une proposition ou une coordination.
  sbj("Les enfants que la maîtresse regarde chantent en classe.", "chantent", "Les enfants", "la maîtresse", "en classe"),
  sbj("La fille que mes frères aiment dort chez nous.", "dort", "La fille", "mes frères", "chez nous"),
  sbj("Moussa et son frère lancent le grand filet.", "lancent", "Moussa et son frère", "son frère", "le grand filet"),
  sbj("Awa et Fatou lavent la vaisselle du village.", "lavent", "Awa et Fatou", "la vaisselle", "le village"),
  sbj("Omar et Pape pêchent des poissons de la mer.", "pêchent", "Omar et Pape", "des poissons", "la mer"),
  sbj("Les villageois du quartier voisin organisent une fête.", "organisent", "Les villageois", "le quartier", "une fête"),
  // Palier 5.
  sbj("Le chant des oiseaux du baobab réveille les villageois.", "réveille", "Le chant", "les oiseaux", "le baobab"),
  sbj("Les fleurs du jardin de ma tante sentent bon.", "sentent", "Les fleurs", "le jardin", "ma tante"),
  sbj("Le bruit des vagues rassure les pêcheurs.", "rassure", "Le bruit", "les vagues", "les pêcheurs"),
  sbj("La porte des maisons du village reste ouverte.", "reste", "La porte", "les maisons", "le village"),
  sbj("Les enfants de la voisine de ma tante chantent.", "chantent", "Les enfants", "la voisine", "ma tante"),
  sbj("Le groupe des danseurs arrive à midi.", "arrive", "Le groupe", "les danseurs", "midi"),
];
export const SUBJECT_ROWS: readonly QuestionRow[] = SUBJECT_LIST.map((entry, index) =>
  qr(`Lis la phrase « ${entry.text} ». Quel est le sujet du verbe « ${entry.verb} » ?`, entry.subject, entry.others, SUBJECT_HINTS, `acc:s${index}`),
);
export function makeCm1AccSubject(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-acc-sujet", CONCEPT, SUBJECT_ROWS);
}
