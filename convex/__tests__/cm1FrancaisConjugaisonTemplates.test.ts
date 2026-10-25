import { describe, expect, it } from "vitest";
import { ERROR_ROWS, GAP_ROWS, GROUP_ROWS, LINK_ROWS, MARKER_ROWS, ORDER_ROWS, SIMPLE_ROWS, SORT_ROWS, TENSE_ROWS, VERBS, WRITE_ROWS, formOf } from "../paliers/games/cm1Conjugaison";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES TEMPS DE L'INDICATIF DU CM1 (`fr-cm1-indicatif`).
 *
 * Ce fichier a son propre tableau de conjugaison, écrit à part de `cm1Conjugaison.ts` : quarante-neuf verbes, le présent, l'imparfait et le futur de chaque
 * personne, le participe passé et la 3e personne du passé simple, tapés en toutes lettres (les verbes en -er et en -ir réguliers sont calculés par une règle
 * propre au test). Il RECALCULE chaque réponse :
 * - il lit le sujet d'une phrase et en tire la personne ; il lit un mot de temps (« demain », « hier ») et en tire le temps du verbe et ceux qu'il accepte ;
 * - il cherche le verbe d'une phrase dans son tableau, à la plus longue forme (« a eu » est un passé composé, pas « a » au présent), et en tire le TEMPS ;
 * - un mauvais choix ne doit être, pour la personne de la phrase, aucune forme d'un temps que le mot de temps accepte ; une forme lue à deux temps (« il finit »)
 *   ne sert pas à demander son temps.
 */

type Tense = "présent" | "imparfait" | "futur" | "passé composé" | "passé simple";
type V = { group: 1 | 2 | 3; aux: "avoir" | "être"; p: string[]; i: string[]; f: string[]; pp: string; ps: [string, string] };

const w = (text: string) => text.split(" ");
const lit = (group: 1 | 2 | 3, aux: "avoir" | "être", p: string, i: string, f: string, pp: string, ps: string): V => ({ group, aux, p: w(p), i: w(i), f: w(f), pp, ps: w(ps) as [string, string] });

function regularEr(inf: string): V {
  const r = inf.slice(0, -2);
  return {
    group: 1,
    aux: "avoir",
    p: [r + "e", r + "es", r + "e", r + "ons", r + "ez", r + "ent"],
    i: ["ais", "ais", "ait", "ions", "iez", "aient"].map((e) => r + e),
    f: ["erai", "eras", "era", "erons", "erez", "eront"].map((e) => r + e),
    pp: r + "é",
    ps: [r + "a", r + "èrent"],
  };
}
function regularIr(inf: string): V {
  const r = inf.slice(0, -1);
  return {
    group: 2,
    aux: "avoir",
    p: [r + "s", r + "s", r + "t", r + "ssons", r + "ssez", r + "ssent"],
    i: ["ssais", "ssais", "ssait", "ssions", "ssiez", "ssaient"].map((e) => r + e),
    f: ["ai", "as", "a", "ons", "ez", "ont"].map((e) => inf + e),
    pp: r,
    ps: [r + "t", r + "rent"],
  };
}

const TABLE: Record<string, V> = {
  ...Object.fromEntries(["chanter", "jouer", "regarder", "écouter", "danser", "travailler", "marcher", "laver", "porter", "parler", "aimer", "donner", "trouver", "pêcher", "cultiver", "cuisiner", "raconter"].map((inf) => [inf, regularEr(inf)])),
  ...Object.fromEntries(["finir", "choisir", "grandir", "réussir", "remplir"].map((inf) => [inf, regularIr(inf)])),
  manger: lit(1, "avoir", "mange manges mange mangeons mangez mangent", "mangeais mangeais mangeait mangions mangiez mangeaient", "mangerai mangeras mangera mangerons mangerez mangeront", "mangé", "mangea mangèrent"),
  nager: lit(1, "avoir", "nage nages nage nageons nagez nagent", "nageais nageais nageait nagions nagiez nageaient", "nagerai nageras nagera nagerons nagerez nageront", "nagé", "nagea nagèrent"),
  ranger: lit(1, "avoir", "range ranges range rangeons rangez rangent", "rangeais rangeais rangeait rangions rangiez rangeaient", "rangerai rangeras rangera rangerons rangerez rangeront", "rangé", "rangea rangèrent"),
  commencer: lit(1, "avoir", "commence commences commence commençons commencez commencent", "commençais commençais commençait commencions commenciez commençaient", "commencerai commenceras commencera commencerons commencerez commenceront", "commencé", "commença commencèrent"),
  lancer: lit(1, "avoir", "lance lances lance lançons lancez lancent", "lançais lançais lançait lancions lanciez lançaient", "lancerai lanceras lancera lancerons lancerez lanceront", "lancé", "lança lancèrent"),
  être: lit(3, "avoir", "suis es est sommes êtes sont", "étais étais était étions étiez étaient", "serai seras sera serons serez seront", "été", "fut furent"),
  avoir: lit(3, "avoir", "ai as a avons avez ont", "avais avais avait avions aviez avaient", "aurai auras aura aurons aurez auront", "eu", "eut eurent"),
  aller: lit(3, "être", "vais vas va allons allez vont", "allais allais allait allions alliez allaient", "irai iras ira irons irez iront", "allé", "alla allèrent"),
  faire: lit(3, "avoir", "fais fais fait faisons faites font", "faisais faisais faisait faisions faisiez faisaient", "ferai feras fera ferons ferez feront", "fait", "fit firent"),
  dire: lit(3, "avoir", "dis dis dit disons dites disent", "disais disais disait disions disiez disaient", "dirai diras dira dirons direz diront", "dit", "dit dirent"),
  voir: lit(3, "avoir", "vois vois voit voyons voyez voient", "voyais voyais voyait voyions voyiez voyaient", "verrai verras verra verrons verrez verront", "vu", "vit virent"),
  prendre: lit(3, "avoir", "prends prends prend prenons prenez prennent", "prenais prenais prenait prenions preniez prenaient", "prendrai prendras prendra prendrons prendrez prendront", "pris", "prit prirent"),
  venir: lit(3, "être", "viens viens vient venons venez viennent", "venais venais venait venions veniez venaient", "viendrai viendras viendra viendrons viendrez viendront", "venu", "vint vinrent"),
  partir: lit(3, "être", "pars pars part partons partez partent", "partais partais partait partions partiez partaient", "partirai partiras partira partirons partirez partiront", "parti", "partit partirent"),
  courir: lit(3, "avoir", "cours cours court courons courez courent", "courais courais courait courions couriez couraient", "courrai courras courra courrons courrez courront", "couru", "courut coururent"),
  dormir: lit(3, "avoir", "dors dors dort dormons dormez dorment", "dormais dormais dormait dormions dormiez dormaient", "dormirai dormiras dormira dormirons dormirez dormiront", "dormi", "dormit dormirent"),
  vendre: lit(3, "avoir", "vends vends vend vendons vendez vendent", "vendais vendais vendait vendions vendiez vendaient", "vendrai vendras vendra vendrons vendrez vendront", "vendu", "vendit vendirent"),
  attendre: lit(3, "avoir", "attends attends attend attendons attendez attendent", "attendais attendais attendait attendions attendiez attendaient", "attendrai attendras attendra attendrons attendrez attendront", "attendu", "attendit attendirent"),
  répondre: lit(3, "avoir", "réponds réponds répond répondons répondez répondent", "répondais répondais répondait répondions répondiez répondaient", "répondrai répondras répondra répondrons répondrez répondront", "répondu", "répondit répondirent"),
  mettre: lit(3, "avoir", "mets mets met mettons mettez mettent", "mettais mettais mettait mettions mettiez mettaient", "mettrai mettras mettra mettrons mettrez mettront", "mis", "mit mirent"),
  lire: lit(3, "avoir", "lis lis lit lisons lisez lisent", "lisais lisais lisait lisions lisiez lisaient", "lirai liras lira lirons lirez liront", "lu", "lut lurent"),
  écrire: lit(3, "avoir", "écris écris écrit écrivons écrivez écrivent", "écrivais écrivais écrivait écrivions écriviez écrivaient", "écrirai écriras écrira écrirons écrirez écriront", "écrit", "écrivit écrivirent"),
  boire: lit(3, "avoir", "bois bois boit buvons buvez boivent", "buvais buvais buvait buvions buviez buvaient", "boirai boiras boira boirons boirez boiront", "bu", "but burent"),
  ouvrir: lit(3, "avoir", "ouvre ouvres ouvre ouvrons ouvrez ouvrent", "ouvrais ouvrais ouvrait ouvrions ouvriez ouvraient", "ouvrirai ouvriras ouvrira ouvrirons ouvrirez ouvriront", "ouvert", "ouvrit ouvrirent"),
  pouvoir: lit(3, "avoir", "peux peux peut pouvons pouvez peuvent", "pouvais pouvais pouvait pouvions pouviez pouvaient", "pourrai pourras pourra pourrons pourrez pourront", "pu", "put purent"),
  vouloir: lit(3, "avoir", "veux veux veut voulons voulez veulent", "voulais voulais voulait voulions vouliez voulaient", "voudrai voudras voudra voudrons voudrez voudront", "voulu", "voulut voulurent"),
  savoir: lit(3, "avoir", "sais sais sait savons savez savent", "savais savais savait savions saviez savaient", "saurai sauras saura saurons saurez sauront", "su", "sut surent"),
};
const AUX = ["ai", "as", "a", "avons", "avez", "ont"];
/** Les formes d'un verbe, pour une personne (0 à 5) : le passé composé n'est écrit qu'avec « avoir », le passé simple qu'à la 3e personne. */
function formsOf(inf: string, tense: Tense, person: number): string | null {
  const verb = TABLE[inf];
  if (!verb) return null;
  if (tense === "présent") return verb.p[person];
  if (tense === "imparfait") return verb.i[person];
  if (tense === "futur") return verb.f[person];
  if (tense === "passé composé") return verb.aux === "avoir" ? `${AUX[person]} ${verb.pp}` : null;
  return person === 2 ? verb.ps[0] : person === 5 ? verb.ps[1] : null;
}
const TENSES: Tense[] = ["présent", "imparfait", "futur", "passé composé", "passé simple"];
const LABEL_TO_TENSE: Record<string, Tense> = { Présent: "présent", Imparfait: "imparfait", "Futur simple": "futur", "Passé composé": "passé composé", "Passé simple": "passé simple" };
const PHRASE_TO_TENSE: Record<string, Tense> = { "au présent": "présent", "à l'imparfait": "imparfait", "au futur simple": "futur", "au passé composé": "passé composé", "au passé simple": "passé simple" };

/** Toutes les (verbe, temps) dont la forme, pour cette personne, est le début de `rest` (suivi d'une espace ou de la fin), les formes les plus longues d'abord. */
function readVerb(rest: string, person: number, exact = false): { inf: string; tense: Tense; form: string }[] {
  const found: { inf: string; tense: Tense; form: string }[] = [];
  for (const inf of Object.keys(TABLE)) {
    for (const tense of TENSES) {
      const form = formsOf(inf, tense, person);
      if (form === null) continue;
      if (exact ? rest === form : rest === form || rest.startsWith(`${form} `)) found.push({ inf, tense, form });
    }
  }
  const longest = Math.max(0, ...found.map((f) => f.form.length));
  return found.filter((f) => f.form.length === longest);
}

// ---------------------------------------------------------------------------
// Les sujets et les mots de temps
// ---------------------------------------------------------------------------

const SINGULAR_NAMES = ["awa", "moussa", "fatou", "le pêcheur", "la maîtresse", "mon frère", "omar", "ma cousine", "khady", "le chef", "pape", "mariama"];
const PLURAL_NAMES = ["les enfants", "les pêcheurs", "awa et omar", "les élèves", "mes cousins", "fatou et khady", "moussa et pape", "les femmes"];
const PRONOUNS: Record<string, number> = { je: 0, "j'": 0, tu: 1, il: 2, elle: 2, nous: 3, vous: 4, ils: 5, elles: 5 };
const VOWEL = /^[aeiouyéèêâîôûh]/u;
const SUBJECTS = [...Object.keys(PRONOUNS), ...SINGULAR_NAMES, ...PLURAL_NAMES].sort((a, b) => b.length - a.length);
const personOfSubject = (subject: string): number | null => {
  const s = subject.trim().toLowerCase();
  if (s in PRONOUNS) return PRONOUNS[s];
  if (SINGULAR_NAMES.includes(s)) return 2;
  if (PLURAL_NAMES.includes(s)) return 5;
  return null;
};
/** « Awa et Omar jouent au ballon. » : le sujet, sa personne, et le reste de la phrase en minuscules. */
function splitSentence(sentence: string): { person: number; rest: string } | null {
  const lower = sentence.replace(/\.$/, "").toLowerCase();
  for (const subject of SUBJECTS) {
    const prefix = subject.endsWith("'") ? subject : `${subject} `;
    if (lower.startsWith(prefix)) {
      const rest = lower.slice(prefix.length);
      // « je » devant une consonne, « j' » devant une voyelle ou un h muet.
      if ((subject === "je" && VOWEL.test(rest)) || (subject === "j'" && !VOWEL.test(rest))) return null;
      return { person: personOfSubject(subject) as number, rest };
    }
  }
  return null;
}

type Marker = { primary: Tense; accepts: Tense[] };
const MARKERS: Record<string, Marker> = {
  maintenant: { primary: "présent", accepts: ["présent", "passé composé"] },
  "en ce moment": { primary: "présent", accepts: ["présent", "passé composé"] },
  "à présent": { primary: "présent", accepts: ["présent", "passé composé"] },
  autrefois: { primary: "imparfait", accepts: ["imparfait", "passé composé", "passé simple"] },
  "il y a longtemps": { primary: "imparfait", accepts: ["imparfait", "passé composé", "passé simple"] },
  "à cette époque": { primary: "imparfait", accepts: ["imparfait", "passé composé", "passé simple"] },
  demain: { primary: "futur", accepts: ["futur", "présent"] },
  bientôt: { primary: "futur", accepts: ["futur", "présent"] },
  "dans une semaine": { primary: "futur", accepts: ["futur", "présent"] },
  "samedi prochain": { primary: "futur", accepts: ["futur", "présent"] },
  "après-demain": { primary: "futur", accepts: ["futur", "présent"] },
  hier: { primary: "passé composé", accepts: ["passé composé", "imparfait", "passé simple"] },
  "hier soir": { primary: "passé composé", accepts: ["passé composé", "imparfait", "passé simple"] },
  "il y a deux jours": { primary: "passé composé", accepts: ["passé composé", "imparfait", "passé simple"] },
  "la semaine dernière": { primary: "passé composé", accepts: ["passé composé", "imparfait", "passé simple"] },
  "samedi dernier": { primary: "passé composé", accepts: ["passé composé", "imparfait", "passé simple"] },
};
const STORY_MARKERS = ["un jour", "soudain", "alors", "ce jour-là", "le lendemain", "peu après", "tout à coup", "aussitôt"];
const markerOf = (text: string): { marker: string; tail: string } | null => {
  const lower = text.toLowerCase();
  const names = [...Object.keys(MARKERS), ...STORY_MARKERS].sort((a, b) => b.length - a.length);
  const found = names.find((name) => lower.startsWith(`${name}, `));
  return found ? { marker: found, tail: text.slice(found.length + 2) } : null;
};

/** Les formes que la personne admet, à l'un des temps donnés. */
function validForms(inf: string, tenses: readonly Tense[], person: number): string[] {
  return tenses.map((tense) => formsOf(inf, tense, person)).filter((form): form is string => form !== null);
}

const quoted = (prompt: string) => prompt.match(/« ([^»]+) »/u)?.[1] ?? "";

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

/** « Demain, nous ___ du riz. (manger) » : le mot de temps, le sujet et l'infinitif. */
function parseGap(text: string): { marker: string; person: number; inf: string; subject: string } | string {
  const m = text.match(/^(.+?), (.*?)___ (.+)\. \((.+)\)$/u);
  if (!m) return `phrase à trou illisible : ${text}`;
  const found = markerOf(`${m[1]}, x`);
  if (!found || found.marker !== m[1].toLowerCase()) return `mot de temps inconnu : ${m[1]}`;
  const person = personOfSubject(m[2]);
  if (person === null) return `sujet inconnu : ${m[2]}`;
  if (!(m[4] in TABLE)) return `verbe inconnu : ${m[4]}`;
  return { marker: m[1].toLowerCase(), person, inf: m[4], subject: m[2] };
}

const checkGap: Check = (exo) => {
  const parsed = parseGap(textOf(exo));
  if (typeof parsed === "string") return parsed;
  const { marker, person, inf, subject } = parsed;
  const info = MARKERS[marker];
  if (!info) return `ce mot de temps n'est pas celui d'un temps : ${marker}`;
  const expected = formsOf(inf, info.primary, person);
  const { options, answer } = blankOf(exo);
  if (subject === "j'" && !VOWEL.test(answer)) return `« j' » devant une consonne : ${answer}`;
  if (subject === "je " && VOWEL.test(answer)) return `« je » devant une voyelle : ${answer}`;
  const accepted = validForms(inf, info.accepts, person);
  return all(
    ok(expected !== null && answer === expected, `la réponse ${answer} n'est pas ${expected} (${inf}, ${info.primary}, personne ${person})`),
    ok(options.filter((option) => option !== answer).every((option) => !accepted.includes(option)), `un mauvais choix est une forme admise : ${options.join(" | ")}`),
    // Au premier palier, des verbes du 1er groupe au présent ou au futur seulement.
    ok(levelOf(exo) !== 1 || (TABLE[inf].group === 1 && (info.primary === "présent" || info.primary === "futur")), `trop difficile pour le niveau 1 : ${textOf(exo)}`),
  );
};

const checkSimple: Check = (exo) => {
  const parsed = parseGap(textOf(exo));
  if (typeof parsed === "string") return parsed;
  const { marker, person, inf } = parsed;
  if (!STORY_MARKERS.includes(marker)) return `mot de conte inconnu : ${marker}`;
  const expected = formsOf(inf, "passé simple", person);
  const { options, answer } = blankOf(exo);
  const both = [TABLE[inf].ps[0], TABLE[inf].ps[1]];
  return all(
    ok(exo.prompt === "Complète ce conte avec le verbe au passé simple.", `énoncé inattendu : ${exo.prompt}`),
    ok(expected !== null && answer === expected, `la réponse ${answer} n'est pas ${expected}`),
    ok(options.filter((option) => option !== answer).every((option) => !both.includes(option)), `un mauvais choix est un passé simple : ${options.join(" | ")}`),
  );
};

const checkTense: Check = (exo) => {
  const sentence = quoted(exo.prompt);
  const split = splitSentence(sentence);
  if (!split) return `sujet illisible : ${sentence}`;
  const read = readVerb(split.rest, split.person);
  const tenses = new Set(read.map((f) => f.tense));
  const right = LABEL_TO_TENSE[rightOption(exo)];
  return all(
    ok(read.length > 0, `verbe introuvable : ${sentence}`),
    ok(tenses.size === 1, `une forme lue à plusieurs temps (${[...tenses].join(", ")}) : ${sentence}`),
    ok(tenses.has(right), `le temps ${rightOption(exo)} n'est pas celui de « ${sentence} » (${[...tenses].join(", ")})`),
    ok(wrongOf(exo).every((option) => !tenses.has(LABEL_TO_TENSE[option])), `un mauvais choix est le temps de la phrase : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkWrite: Check = (exo) => {
  const m = exo.prompt.match(/^Écris le verbe (\S+) (au présent|à l'imparfait|au futur simple|au passé composé|au passé simple) avec (je|tu|il|nous|vous|ils)\.$/u);
  if (!m) return `énoncé illisible : ${exo.prompt}`;
  const person = PRONOUNS[m[3]];
  const expected = formsOf(m[1], PHRASE_TO_TENSE[m[2]], person);
  return all(
    ok(expected !== null, `forme introuvable pour ${exo.prompt}`),
    ok(exo.answerKey === expected, `la réponse ${exo.answerKey} n'est pas ${expected}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === expected, `réponses admises : ${acceptedOf(exo).join(", ")}`),
  );
};

/** Une étiquette de verbe (« nous chantions », « j'ai fini ») : sa personne et son temps, qui doit être unique. */
function readTile(text: string): { tenses: Set<Tense>; person: number } | string {
  const apostrophe = text.startsWith("j'");
  const [pronoun, ...others] = apostrophe ? ["j'", text.slice(2)] : text.split(" ");
  const person = PRONOUNS[pronoun];
  if (person === undefined) return `pronom inconnu : ${text}`;
  const rest = apostrophe ? others[0] : others.join(" ");
  if ((pronoun === "je" && VOWEL.test(rest)) || (pronoun === "j'" && !VOWEL.test(rest))) return `élision : ${text}`;
  const read = readVerb(rest, person, true);
  if (read.length === 0) return `verbe introuvable : ${text}`;
  const tenses = new Set(read.map((f) => f.tense));
  // Des formes que le tableau ne conjugue pas se lisent aussi comme un autre verbe : « il vit » (vivre).
  if (rest === "vit") tenses.add("présent");
  return { tenses, person };
}

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  const rights = pairs.map((pair) => pair.right);
  for (const pair of pairs) {
    const tile = readTile(pair.left);
    if (typeof tile === "string") return tile;
    if (tile.tenses.size !== 1) return `forme lue à plusieurs temps : ${pair.left}`;
    if (!tile.tenses.has(LABEL_TO_TENSE[pair.right])) return `${pair.left} n'est pas ${pair.right}`;
  }
  return ok(new Set(rights).size === 3, `deux paires du même temps : ${rights.join(", ")}`);
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  for (const item of items) {
    const tile = readTile(item.text);
    if (typeof tile === "string") return tile;
    if (tile.tenses.size !== 1) return `forme lue à plusieurs temps : ${item.text}`;
    if (!tile.tenses.has(LABEL_TO_TENSE[item.correctZone])) return `${item.text} n'est pas ${item.correctZone}`;
  }
  return all(
    ok(zones.length === 2 && new Set(zones).size === 2, `cases : ${zones.join(", ")}`),
    ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois verbes par case"),
  );
};

const checkMarker: Check = (exo) => {
  const options = optionsOf(exo);
  const marked = options.map((option) => markerOf(option));
  if (marked.some((m) => m === null) || new Set(marked.map((m) => m?.marker)).size !== 1) return `les trois phrases n'ont pas le même mot de temps : ${options.join(" | ")}`;
  const info = MARKERS[marked[0]?.marker as string];
  if (!info) return `mot de temps inconnu : ${options[0]}`;
  const tensesOf = (option: string): Set<Tense> | string => {
    const split = splitSentence(markerOf(option)?.tail as string);
    if (!split) return `sujet illisible : ${option}`;
    return new Set(readVerb(split.rest, split.person).map((f) => f.tense));
  };
  const rightTenses = tensesOf(rightOption(exo));
  if (typeof rightTenses === "string") return rightTenses;
  for (const option of wrongOf(exo)) {
    const wrongTenses = tensesOf(option);
    if (typeof wrongTenses === "string") return wrongTenses;
    if (wrongTenses.size === 0) return `verbe introuvable : ${option}`;
    if ([...wrongTenses].some((tense) => info.accepts.includes(tense))) return `un mauvais choix est un temps accepté par « ${marked[0]?.marker} » : ${option}`;
  }
  return all(
    ok(rightTenses.has(info.primary) && rightTenses.size === 1, `la bonne phrase n'est pas au ${info.primary} : ${rightOption(exo)}`),
    ok(exo.prompt === "Quelle phrase est bien écrite ?", "énoncé inattendu"),
  );
};

const SECOND = ["finir", "choisir", "grandir", "réussir", "remplir"];
const checkGroup: Check = (exo) => {
  const inf = quoted(exo.prompt);
  if (!(inf in TABLE)) return `verbe inconnu : ${inf}`;
  const group = inf.endsWith("er") && inf !== "aller" ? 1 : SECOND.includes(inf) ? 2 : 3;
  return all(ok(TABLE[inf].group === group, `la table et la règle diffèrent pour ${inf}`), ok(rightOption(exo) === ["Premier groupe", "Deuxième groupe", "Troisième groupe"][group - 1], `${inf} est du groupe ${group}, pas ${rightOption(exo)}`));
};

const checkError: Check = (exo) => {
  const options = optionsOf(exo);
  const marked = options.map((option) => markerOf(option));
  if (marked.some((m) => m === null) || new Set(marked.map((m) => m?.marker)).size !== 1) return `les trois phrases n'ont pas le même mot de temps : ${options.join(" | ")}`;
  const info = MARKERS[marked[0]?.marker as string];
  if (!info) return `mot de temps inconnu : ${options[0]}`;
  const split = splitSentence(markerOf(rightOption(exo))?.tail as string);
  if (!split) return `sujet illisible : ${rightOption(exo)}`;
  const read = readVerb(split.rest, split.person).filter((f) => info.accepts.includes(f.tense));
  if (read.length === 0) return `la bonne phrase n'est pas conjuguée comme le mot de temps le veut : ${rightOption(exo)}`;
  const rightIndex = exo.payload.correctIndex as number;
  const forms = [...new Set(read.flatMap((f) => validForms(f.inf, info.accepts, split.person)))];
  const isValid = (rest: string) => forms.some((form) => rest === form || rest.startsWith(`${form} `));
  const rests = options.map((option) => splitSentence(markerOf(option)?.tail as string)?.rest ?? "");
  return all(
    ok(isValid(rests[rightIndex]), `la bonne forme n'est pas valide : ${rests[rightIndex]}`),
    ok(rests.every((rest, index) => index === rightIndex || (rest !== "" && !isValid(rest))), `un mauvais choix est une forme valide : ${options.join(" | ")}`),
    // L'énoncé demande « bien conjugué », pas « au bon temps » : un mauvais choix n'est une forme juste à AUCUN temps pour ce sujet (« vous écrivez » après « À cette époque »).
    // (« nous avons fais » se lit « avons » au présent : l'auxiliaire seul d'un passé composé raté ne compte pas.)
    ok(
      rests.every((rest, index) => index === rightIndex || readVerb(rest, split.person).filter((f) => !(read.some((r) => r.tense === "passé composé") && ["avoir", "être"].includes(f.inf) && f.tense === "présent")).length === 0),
      `un mauvais choix est bien conjugué à un autre temps : ${options.join(" | ")}`,
    ),
    ok(exo.prompt === "Dans quelle phrase le verbe est-il bien conjugué ?", "énoncé inattendu"),
  );
};

const PARTICIPLES = new Set(Object.values(TABLE).filter((verb) => verb.aux === "avoir").map((verb) => verb.pp));
const checkOrder: Check = (exo) => {
  const lines = sequenceOf(exo);
  const markers = ["D'abord, ", "Ensuite, ", "Puis, ", "Enfin, "];
  return all(
    ok(lines.length === 4 && lines.every((line, index) => line.startsWith(markers[index])), `l'ordre des mots de liaison : ${lines.join(" / ")}`),
    ok(exo.prompt === "Remets ces phrases dans l'ordre du récit.", "énoncé inattendu"),
    ...lines.map((line, index) => {
      const m = line.slice(markers[index]?.length ?? 0).match(/(?:^|\s)(?:j'|)(ai|as|a|avons|avez|ont) (\p{L}+)/u);
      return ok(m !== null && PARTICIPLES.has(m[2]), `un passé composé avec avoir attendu : ${line}`);
    }),
  );
};

/** Ce qu'un exercice demande, pour qu'un palier ne le demande pas deux fois : le verbe, le temps et la personne. */
const asked = (exo: Exo): string[] | null => {
  const kind = (exo.payload.game as { kind: string }).kind;
  if (kind === "cm1-ind-trou" || kind === "cm1-ind-simple") {
    const parsed = parseGap(textOf(exo));
    return typeof parsed === "string" ? null : [`${parsed.inf}|${blankOf(exo).answer}`];
  }
  if (kind === "cm1-ind-ecrire") return [`${exo.prompt}`];
  return null;
};

defineMathsTests({
  label: "du français du CM1 (les temps de l'indicatif)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm1-ind-trou": checkGap,
    "cm1-ind-simple": checkSimple,
    "cm1-ind-temps": checkTense,
    "cm1-ind-ecrire": checkWrite,
    "cm1-ind-relier": checkLink,
    "cm1-ind-glisser": checkSort,
    "cm1-ind-marqueur": checkMarker,
    "cm1-ind-groupe": checkGroup,
    "cm1-ind-erreur": checkError,
    "cm1-ind-ordre": checkOrder,
  },
  topicKinds: {
    "fr-cm1-indicatif": ["cm1-ind-trou", "cm1-ind-simple", "cm1-ind-temps", "cm1-ind-ecrire", "cm1-ind-relier", "cm1-ind-glisser", "cm1-ind-marqueur", "cm1-ind-groupe", "cm1-ind-erreur", "cm1-ind-ordre"],
  },
  asked,
});

describe("les vérifications de conjugaison voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level = 3) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level = 3, prompt = "x") =>
    ({ type: "fill-blank", prompt, answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("une forme lue à deux temps ne sert pas à demander son temps", () => {
    expect(checkTense(qcm("À quel temps est conjugué le verbe de la phrase « Awa chantait une chanson. » ?", ["Imparfait", "Présent", "Futur simple"], 0))).toBeNull();
    expect(checkTense(qcm("À quel temps est conjugué le verbe de la phrase « Awa finit le devoir. » ?", ["Présent", "Imparfait", "Futur simple"], 0))).not.toBeNull();
    expect(checkTense(qcm("À quel temps est conjugué le verbe de la phrase « Awa a eu un beau cadeau. » ?", ["Passé composé", "Imparfait", "Futur simple"], 0))).toBeNull();
    expect(checkTense(qcm("À quel temps est conjugué le verbe de la phrase « Awa chantait une chanson. » ?", ["Présent", "Imparfait", "Futur simple"], 0))).not.toBeNull();
  });

  it("un mauvais choix ne peut pas être un temps que le mot de temps accepte", () => {
    expect(checkGap(gap("Demain, nous ___ du riz. (manger)", ["mangerons", "mangeons", "mangiez"], "mangerons"))).not.toBeNull();
    expect(checkGap(gap("Demain, nous ___ du riz. (manger)", ["mangerons", "mangions", "mangerez"], "mangerons"))).toBeNull();
    expect(checkGap(gap("Hier, nous ___ du riz. (manger)", ["avons mangé", "mangions", "mangerons"], "avons mangé"))).not.toBeNull();
    expect(checkGap(gap("Hier, nous ___ du riz. (manger)", ["avons mangé", "mangeons", "mangerons"], "avons mangé"))).toBeNull();
  });

  it("une forme mal écrite est vue : « mangons », « commencait », « ils prendent »", () => {
    expect(checkError(qcm("Dans quelle phrase le verbe est-il bien conjugué ?", ["Autrefois, nous mangions du riz.", "Autrefois, nous mangeions du riz.", "Autrefois, nous mangons du riz."], 0))).toBeNull();
    expect(checkError(qcm("Dans quelle phrase le verbe est-il bien conjugué ?", ["Autrefois, nous mangions du riz.", "Autrefois, nous mangeions du riz.", "Autrefois, nous mangons du riz."], 1))).not.toBeNull();
    expect(checkError(qcm("Dans quelle phrase le verbe est-il bien conjugué ?", ["Autrefois, nous mangions du riz.", "Autrefois, nous mangeons du riz.", "Autrefois, nous mangions du riz."], 0))).not.toBeNull();
    // « nous mangeons » est bien conjugué (au présent) : l'énoncé « bien conjugué » aurait deux réponses.
    expect(checkError(qcm("Dans quelle phrase le verbe est-il bien conjugué ?", ["Autrefois, nous mangions du riz.", "Autrefois, nous mangeons du riz.", "Autrefois, nous mangons du riz."], 0))).not.toBeNull();
  });

  it("le groupe : aller est du troisième, finir du deuxième, nager du premier", () => {
    expect(checkGroup(qcm("À quel groupe appartient le verbe « aller » ?", ["Troisième groupe", "Premier groupe", "Deuxième groupe"], 0))).toBeNull();
    expect(checkGroup(qcm("À quel groupe appartient le verbe « aller » ?", ["Troisième groupe", "Premier groupe", "Deuxième groupe"], 1))).not.toBeNull();
    expect(checkGroup(qcm("À quel groupe appartient le verbe « finir » ?", ["Troisième groupe", "Premier groupe", "Deuxième groupe"], 2))).toBeNull();
  });

  it("le conjugué du passé simple s'écrit à la 3e personne", () => {
    expect(checkSimple(gap("Un jour, Awa ___ du riz. (donner)", ["donna", "donnait", "donne"], "donna", 3, "Complète ce conte avec le verbe au passé simple."))).toBeNull();
    expect(checkSimple(gap("Un jour, Awa ___ du riz. (donner)", ["donna", "donnait", "donne"], "donne", 3, "Complète ce conte avec le verbe au passé simple."))).not.toBeNull();
    expect(checkSimple(gap("Un jour, les enfants ___ du riz. (donner)", ["donna", "donnèrent", "donnaient"], "donnèrent", 3, "Complète ce conte avec le verbe au passé simple."))).not.toBeNull();
  });
});

describe("le tableau des verbes du gabarit s'accorde avec celui du test", () => {
  it("chaque forme de chaque verbe est la même dans les deux tableaux", () => {
    expect(VERBS.map((verb) => verb.inf).sort()).toEqual(Object.keys(TABLE).sort());
    for (const verb of VERBS) {
      const own = TABLE[verb.inf];
      expect(verb.group, verb.inf).toBe(own.group);
      expect(verb.aux, verb.inf).toBe(own.aux);
      for (const tense of TENSES) {
        for (let person = 0; person < 6; person++) {
          if (tense === "passé simple" && person !== 2 && person !== 5) continue;
          if (tense === "passé composé" && own.aux !== "avoir") continue;
          expect(formOf(verb, tense, person), `${verb.inf} ${tense} personne ${person}`).toBe(formsOf(verb.inf, tense, person));
        }
      }
    }
  });
});

describe("toutes les lignes des tableaux, pas seulement celles que les tirages ont rencontrées", () => {
  /** Les cinq paliers prennent six lignes chacun, aux niveaux 1, 2, 2, 3 et 4. */
  const levelAt = (index: number) => [1, 2, 2, 3, 4][Math.min(4, Math.floor(index / 6))];
  const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }, index: number) => {
    const options = [row.answer, ...row.wrong];
    return { prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options, correctIndex: 0, game: { kind: "x", level: levelAt(index) } } } as Exo;
  };
  const gapOf = (row: { text: string; answer: string; wrong: readonly string[] }, index: number) =>
    ({ prompt: "Complète ce conte avec le verbe au passé simple.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }], game: { kind: "x", level: levelAt(index) } } }) as Exo;

  it("les lignes de phrases à trou et de conte", () => {
    GAP_ROWS.forEach((row, index) => {
      expect(new Set([row.answer, ...row.wrong]).size, row.text).toBe(3);
      expect(checkGap(gapOf(row, index)), row.text).toBeNull();
    });
    SIMPLE_ROWS.forEach((row, index) => {
      expect(new Set([row.answer, ...row.wrong]).size, row.text).toBe(3);
      expect(checkSimple(gapOf(row, index)), row.text).toBeNull();
    });
  });

  it("les lignes de temps, de mot de temps, de groupe et de phrase bien conjuguée", () => {
    const rowsOf: [string, readonly { prompt: string; answer: string; wrong: readonly string[] }[], Check][] = [
      ["temps", TENSE_ROWS, checkTense],
      ["marqueur", MARKER_ROWS, checkMarker],
      ["groupe", GROUP_ROWS, checkGroup],
      ["erreur", ERROR_ROWS, checkError],
    ];
    for (const [name, rows, check] of rowsOf) {
      rows.forEach((row, index) => {
        expect(new Set([row.answer, ...row.wrong]).size, `${name} : ${row.prompt}`).toBe(3);
        expect(check(qcmOf(row, index)), `${name} : ${row.prompt} ${row.answer}`).toBeNull();
        expect(row.answer.length, `${name} : ${row.prompt}`).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
      });
    }
  });

  it("les lignes à écrire, à relier, à glisser et à remettre dans l'ordre", () => {
    for (const row of WRITE_ROWS) expect(checkWrite({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), JSON.stringify(row.pairs)).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
    for (const row of ORDER_ROWS) expect(checkOrder({ prompt: row.prompt, answerKey: "", hints: [], payload: { correctSequence: [...row.sequence] } } as Exo), row.sequence.join(" / ")).toBeNull();
  });

  it("chaque palier a trente lignes de six, et six personnes sont posées", () => {
    for (const rows of [GAP_ROWS, SIMPLE_ROWS, TENSE_ROWS, WRITE_ROWS, MARKER_ROWS]) expect(rows.length).toBe(30);
    expect(GROUP_ROWS.length).toBe(30);
    expect(ERROR_ROWS.length).toBe(30);
    expect(LINK_ROWS.length).toBe(30);
    expect(SORT_ROWS.length).toBe(30);
    expect(ORDER_ROWS.length).toBe(15);
    const persons = new Set(GAP_ROWS.map((row) => personOfSubject(row.text.match(/, (.*?)___/u)?.[1] ?? "")));
    expect(persons.size).toBe(6);
  });
});
