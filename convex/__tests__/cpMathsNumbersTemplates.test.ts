import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { inWords } from "../paliers/games/nombresCp";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 30_000 });

/**
 * LES MATHÉMATIQUES DU CP, PREMIÈRE PARTIE : les nombres jusqu'à 50 et jusqu'à 100, l'addition avec retenue, la soustraction avec
 * emprunt et la monnaie, la multiplication (tables de 2 et de 3) et le partage.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé, avec sa propre arithmétique et sa propre table des nombres en lettres
 * (écrite autrement que `inWords`, puis comparée à une liste codée en dur des nombres difficiles). Un gabarit dont la réponse
 * contredit le calcul échoue. Les règles de la fiche sont des tests à part : une addition a toujours une retenue, une soustraction
 * toujours un emprunt, aucune table hors de 2 et de 3, jamais un nombre au-delà du plafond de la fiche. À la fin, des MUTATIONS : on
 * abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir. L'échantillon du modèle comptait six exercices faux
 * sur quarante-deux en mathématiques (« huitante », « ___ fois 9 égal 72 » sous les nombres, une tuile qui contient la réponse).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `mth:${level}:${n}` })));
const make = (kind: GameKind, vocabulary: string | undefined, d: (typeof draws)[number]) =>
  GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`, undefined, vocabulary));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

type Check = (exo: Exo, vocab?: string) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

/** Le plafond de la fiche et le plus petit nombre qu'elle sert. */
const capOf = (vocab?: string) => (vocab === "nombres-100" ? 100 : 50);
const lowOf = (vocab?: string) => (vocab === "nombres-100" ? 51 : 1);

/** Les nombres en lettres, écrits AUTREMENT que `inWords` : une liste de 0 à 19, puis la règle des dizaines. */
const BELOW_20 = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
function wordsOf(n: number): string {
  if (n < 20) return BELOW_20[n];
  if (n === 100) return "cent";
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t < 7) return u === 0 ? TENS[t] : u === 1 ? `${TENS[t]} et un` : `${TENS[t]}-${BELOW_20[u]}`;
  if (t === 7) return u === 1 ? "soixante et onze" : `soixante-${BELOW_20[10 + u]}`;
  if (t === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${BELOW_20[u]}`;
  return `quatre-vingt-${BELOW_20[10 + u]}`;
}

/** Les nombres difficiles, codés en dur : ce que l'école écrit, et que ni « huitante » ni « septante » ne remplacent. */
const HARD_WORDS: [number, string][] = [
  [0, "zéro"], [11, "onze"], [16, "seize"], [17, "dix-sept"], [19, "dix-neuf"], [20, "vingt"], [21, "vingt et un"], [22, "vingt-deux"],
  [31, "trente et un"], [41, "quarante et un"], [51, "cinquante et un"], [60, "soixante"], [61, "soixante et un"], [62, "soixante-deux"],
  [70, "soixante-dix"], [71, "soixante et onze"], [72, "soixante-douze"], [77, "soixante-dix-sept"], [79, "soixante-dix-neuf"],
  [80, "quatre-vingts"], [81, "quatre-vingt-un"], [85, "quatre-vingt-cinq"], [90, "quatre-vingt-dix"], [91, "quatre-vingt-onze"],
  [92, "quatre-vingt-douze"], [97, "quatre-vingt-dix-sept"], [99, "quatre-vingt-dix-neuf"], [100, "cent"],
];

/** Les prénoms des histoires et leur genre : « il » ou « elle ». */
const GENDER: Record<string, "m" | "f"> = {
  Awa: "f", Fatou: "f", Mariama: "f", Aïssatou: "f", Penda: "f", Khady: "f", Sokhna: "f", Coumba: "f", Ndèye: "f", Rama: "f",
  Moussa: "m", Modou: "m", Ibrahima: "m", Ousmane: "m", Cheikh: "m", Mamadou: "m", Abdou: "m", Lamine: "m", Samba: "m", Malick: "m",
};
const pronounOf = (name: string) => (GENDER[name] === "f" ? "elle" : "il");

/** Les choses des histoires : leur pluriel (« mangues ») et si l'on écrit « d'… » devant. */
const PACKED = ["mangues", "bananes", "oranges", "pains", "bonbons", "billes", "ballons", "cahiers", "règles"];
const SHARED = ["mangues", "bananes", "oranges", "pains", "bonbons", "billes"];
const GOODS = ["une mangue", "un pain", "un cahier", "une banane", "une orange", "un crayon", "une règle", "un ballon"];
const ofNoun = (noun: string) => (/^[aeiouyéè]/i.test(noun) ? `d'${noun}` : `de ${noun}`);

/** Les étapes d'un calcul posé, chacune dans un seul ordre. */
const STEPS: [string, string[]][] = [
  ["Mets dans le bon ordre les étapes d'une addition avec retenue.", ["J'additionne les unités.", "J'écris les unités et je retiens une dizaine.", "J'additionne les dizaines avec la retenue."]],
  ["Mets dans le bon ordre les étapes d'une soustraction avec emprunt.", ["Je regarde les unités.", "J'emprunte une dizaine pour avoir plus d'unités.", "J'enlève les unités.", "J'enlève les dizaines qui restent."]],
];

const units = (n: number) => n % 10;
const hasCarry = (a: number, b: number) => units(a) + units(b) >= 10;
const hasBorrow = (a: number, b: number) => units(a) < units(b);
const isInteger = (text: string) => /^\d+$/.test(text);

/** Un calcul « a + b » ou « a − b » : (a, b, résultat, signe), ou null. */
function parseOperation(text: string): { a: number; b: number; sign: "+" | "−"; result: number } | null {
  const m = /^(\d+) ([+−]) (\d+)$/u.exec(text);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return { a, b, sign: m[2] as "+" | "−", result: m[2] === "+" ? a + b : a - b };
}

/** Une écriture « a × b » ou « a + b » : sa valeur, ou null. */
function valueOf(text: string): number | null {
  const m = /^(\d+) ([×+]) (\d+)$/u.exec(text);
  if (!m) return null;
  return m[2] === "×" ? Number(m[1]) * Number(m[3]) : Number(m[1]) + Number(m[3]);
}

const distinctNumbers = (list: readonly string[]) => list.every(isInteger) && new Set(list).size === list.length;

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const KINDS = [
  "nb-voisin",
  "nb-comparer",
  "nb-ordre",
  "nb-dizaines",
  "nb-decomposer",
  "nb-glisser",
  "nb-lettres",
  "nb-relier",
  "nb-ecrire",
  "calc-ajouter",
  "calc-enlever",
  "calc-retenue",
  "calc-trou",
  "calc-ordre",
  "calc-relier",
  "calc-glisser",
  "monnaie-somme",
  "monnaie-rendre",
  "monnaie-achat",
  "mult-paquets",
  "mult-ecrire",
  "mult-addition",
  "mult-table",
  "mult-trou",
  "mult-relier",
  "mult-suite",
  "mult-glisser",
  "part-qcm",
  "part-trou",
] as const satisfies readonly GameKind[];

/** Les gabarits des nombres se jouent avec le plafond de leur fiche ; les autres n'en ont pas. */
const NUMBER_KINDS: readonly string[] = KINDS.filter((kind) => kind.startsWith("nb-"));
const VOCABULARIES = ["nombres-50", "nombres-100"];
const variants = (kind: string): (string | undefined)[] => (NUMBER_KINDS.includes(kind) ? VOCABULARIES : [undefined]);

const countsByZone = (exo: Exo) => zonesOf(exo).map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);

const CHECKS: Record<string, Check> = {
  // ----- Les nombres
  "nb-voisin": (exo, vocab) => {
    const m = /^Quel nombre vient juste (après|avant) (\d+) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const n = Number(m[2]);
    const expected = m[1] === "après" ? n + 1 : n - 1;
    const options = optionsOf(exo);
    const floor = vocab === "nombres-100" ? 50 : 0;
    return (
      ok(n >= lowOf(vocab) && n <= capOf(vocab), `${n} est hors de la fiche`) ??
      ok(Number(rightOption(exo)) === expected, `${m[1]} ${n} vient ${expected}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(options) && options.every((o) => Number(o) >= floor && Number(o) <= capOf(vocab)), `choix ${options.join(" | ")}`)
    );
  },
  "nb-comparer": (exo, vocab) => {
    const m = /^Quel est le (plus grand|plus petit) de ces nombres \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const options = optionsOf(exo).map(Number);
    const expected = m[1] === "plus grand" ? Math.max(...options) : Math.min(...options);
    return (
      ok(distinctNumbers(optionsOf(exo)) && options.length === 3, "trois nombres différents") ??
      ok(options.every((o) => o >= lowOf(vocab) && o <= capOf(vocab)), `un nombre hors de la fiche : ${options.join(" | ")}`) ??
      ok(Number(rightOption(exo)) === expected, `${m[1]} est ${expected}, la bonne option est ${rightOption(exo)}`)
    );
  },
  "nb-ordre": (exo, vocab) => {
    const ascending = exo.prompt === "Mets ces nombres dans l'ordre, du plus petit au plus grand.";
    const descending = exo.prompt === "Mets ces nombres dans l'ordre, du plus grand au plus petit.";
    if (ascending === descending) return `énoncé ${exo.prompt}`;
    const sequence = sequenceOf(exo);
    const values = sequence.map(Number);
    const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
    return (
      ok(distinctNumbers(sequence) && sequence.length === 4, "quatre nombres différents") ??
      ok(values.every((o) => o >= lowOf(vocab) && o <= capOf(vocab)), `un nombre hors de la fiche : ${sequence.join(" ")}`) ??
      ok(JSON.stringify(values) === JSON.stringify(sorted), `la suite ${sequence.join(" > ")} n'est pas rangée`)
    );
  },
  "nb-dizaines": (exo, vocab) => {
    if (exo.prompt === "Combien de dizaines y a-t-il dans une centaine ?") {
      return ok(vocab === "nombres-100", "la centaine n'est que dans la fiche de 100") ?? ok(rightOption(exo) === "10" && [...optionsOf(exo)].sort().join() === ["1", "10", "100"].sort().join(), `options ${optionsOf(exo).join(" | ")}`);
    }
    const m = /^Dans (\d+), combien y a-t-il (de dizaines|d'unités) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const n = Number(m[1]);
    const expected = m[2] === "de dizaines" ? Math.floor(n / 10) : n % 10;
    return (
      ok(n >= lowOf(vocab) && n <= capOf(vocab), `${n} est hors de la fiche`) ??
      ok(Number(rightOption(exo)) === expected, `${m[2]} dans ${n} : ${expected}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "nb-decomposer": (exo, vocab) => {
    const text = textOf(exo);
    const answer = blankOf(exo).answer;
    const options = blankOf(exo).options;
    let expected: number | null = null;
    let n = 0;
    let m = /^(\d+) = (\d+) \+ ___$/u.exec(text);
    if (m) {
      n = Number(m[1]);
      if (Number(m[2]) !== Math.floor(n / 10) * 10) return `${m[2]} n'est pas les dizaines de ${n}`;
      expected = n - Number(m[2]);
    }
    m = /^(\d+) dizaines? et (\d+) unités?, c'est le nombre ___\.$/u.exec(text);
    if (m) {
      const t = Number(m[1]);
      const u = Number(m[2]);
      const wordT = t > 1 ? "dizaines" : "dizaine";
      const wordU = u > 1 ? "unités" : "unité";
      if (!text.startsWith(`${t} ${wordT} et ${u} ${wordU}`)) return `accord faux : ${text}`;
      n = 10 * t + u;
      expected = n;
    }
    m = /^(\d+) × 10 \+ (\d+) = ___$/u.exec(text);
    if (m) {
      if (vocab !== "nombres-100") return "l'écriture multiplicative n'est que dans la fiche de 100";
      n = 10 * Number(m[1]) + Number(m[2]);
      expected = n;
    }
    m = /^(\d+) \+ (\d+) = ___$/u.exec(text);
    if (m) {
      if (vocab !== "nombres-100") return "cette écriture n'est que dans la fiche de 100";
      if (Number(m[1]) % 10 !== 0 || Number(m[2]) > 9) return `${text} n'est pas dizaines + unités`;
      n = Number(m[1]) + Number(m[2]);
      expected = n;
    }
    if (expected === null) return `phrase inconnue : ${text}`;
    return (
      ok(n >= lowOf(vocab) && n <= capOf(vocab), `${n} est hors de la fiche`) ??
      ok(Number(answer) === expected, `la phrase veut ${expected}, le trou dit ${answer}`) ??
      ok(distinctNumbers(options) && options.includes(answer), `choix ${options.join(" | ")}`)
    );
  },
  "nb-glisser": (exo, vocab) => {
    const m = /^Moins de (\d+)$/u.exec(zonesOf(exo)[0] ?? "");
    const k = /^Plus de (\d+)$/u.exec(zonesOf(exo)[1] ?? "");
    if (!m || !k || m[1] !== k[1]) return `cases ${zonesOf(exo).join(" / ")}`;
    const threshold = Number(m[1]);
    for (const item of itemsOf(exo)) {
      const n = Number(item.text);
      const zone = n < threshold ? zonesOf(exo)[0] : n > threshold ? zonesOf(exo)[1] : null;
      if (zone !== item.correctZone) return `${n} va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
      if (n < lowOf(vocab) || n > capOf(vocab)) return `${n} est hors de la fiche`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de nombres");
  },
  "nb-lettres": (exo, vocab) => {
    const m = /^Quel nombre s'écrit « (.+) » \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const found = Array.from({ length: 101 }, (_, n) => n).filter((n) => wordsOf(n) === m[1]);
    const floor = vocab === "nombres-100" ? 50 : 0;
    return (
      ok(found.length === 1, `« ${m[1]} » n'est le nom d'aucun nombre`) ??
      ok(found[0] >= lowOf(vocab) && found[0] <= capOf(vocab), `${found[0]} est hors de la fiche`) ??
      ok(Number(rightOption(exo)) === found[0], `« ${m[1]} » est ${found[0]}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) >= floor && Number(o) <= capOf(vocab)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "nb-relier": (exo, vocab) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const n = Number(pair.left);
      if (!isInteger(pair.left) || wordsOf(n) !== pair.right) return `${pair.left} est relié à « ${pair.right} », la table dit « ${wordsOf(n)} »`;
      if (n < lowOf(vocab) || n > capOf(vocab)) return `${n} est hors de la fiche`;
    }
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "nb-ecrire": (exo, vocab) => {
    const m = /^Écris en chiffres le nombre « (.+) »\.$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const found = Array.from({ length: 101 }, (_, n) => n).filter((n) => wordsOf(n) === m[1]);
    return (
      ok(found.length === 1, `« ${m[1]} » n'est le nom d'aucun nombre`) ??
      ok(found[0] >= lowOf(vocab) && found[0] <= capOf(vocab), `${found[0]} est hors de la fiche`) ??
      ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify([String(found[0])]), `réponses admises ${acceptedOf(exo).join(" | ")}`) ??
      ok(exo.answerKey === String(found[0]), `clé ${exo.answerKey}`)
    );
  },
  // ----- Le calcul
  "calc-ajouter": (exo) => {
    const m = /^Combien font (\d+) \+ (\d+) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const a = Number(m[1]);
    const b = Number(m[2]);
    return (
      ok(hasCarry(a, b), `${a} + ${b} n'a pas de retenue`) ??
      ok(a + b <= 100, `${a} + ${b} passe cent`) ??
      ok(Number(rightOption(exo)) === a + b, `${a} + ${b} = ${a + b}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) <= 100), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "calc-enlever": (exo) => {
    const m = /^Combien font (\d+) − (\d+) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const a = Number(m[1]);
    const b = Number(m[2]);
    return (
      ok(hasBorrow(a, b), `${a} − ${b} n'a pas d'emprunt`) ??
      ok(a > b && a <= 99, `${a} − ${b} hors des limites`) ??
      ok(Number(rightOption(exo)) === a - b, `${a} − ${b} = ${a - b}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "calc-retenue": (exo) => {
    let m = /^Dans (\d+) \+ (\d+), les unités font (\d+)\. On écrit (\d+)\. Combien retient-on \?$/u.exec(exo.prompt);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      return (
        ok(hasCarry(a, b) && a + b <= 100, `${a} + ${b} sans retenue`) ??
        ok(Number(m[3]) === units(a) + units(b), `les unités font ${units(a) + units(b)}, pas ${m[3]}`) ??
        ok(Number(m[4]) === Number(m[3]) - 10, `on écrit ${Number(m[3]) - 10}, pas ${m[4]}`) ??
        ok(rightOption(exo) === "1", `on retient une dizaine, la bonne option est ${rightOption(exo)}`)
      );
    }
    m = /^Dans (\d+) \+ (\d+), les unités font (\d+)\. Quel chiffre écrit-on sous les unités \?$/u.exec(exo.prompt);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      return (
        ok(hasCarry(a, b) && a + b <= 100, `${a} + ${b} sans retenue`) ??
        ok(Number(m[3]) === units(a) + units(b), `les unités font ${units(a) + units(b)}, pas ${m[3]}`) ??
        ok(Number(rightOption(exo)) === Number(m[3]) - 10, `on écrit ${Number(m[3]) - 10}, la bonne option est ${rightOption(exo)}`)
      );
    }
    m = /^Dans (\d+) − (\d+), on ne peut pas enlever (\d+) de (\d+)\. On emprunte une dizaine, et (\d+) devient combien \?$/u.exec(exo.prompt);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      return (
        ok(hasBorrow(a, b) && a > b, `${a} − ${b} sans emprunt`) ??
        ok(Number(m[3]) === units(b) && Number(m[4]) === units(a) && Number(m[5]) === units(a), "les chiffres de l'énoncé ne sont pas ceux des unités") ??
        ok(Number(rightOption(exo)) === units(a) + 10, `${units(a)} devient ${units(a) + 10}, la bonne option est ${rightOption(exo)}`)
      );
    }
    return `énoncé ${exo.prompt}`;
  },
  "calc-trou": (exo) => {
    const text = textOf(exo);
    const answer = Number(blankOf(exo).answer);
    let m = /^(\d+) \+ ___ = (\d+)$/u.exec(text);
    if (m) {
      const a = Number(m[1]);
      const total = Number(m[2]);
      return ok(total - a === answer, `${total} − ${a} = ${total - a}, le trou dit ${answer}`) ?? ok(hasCarry(a, answer) && total <= 100, "pas de retenue") ?? ok(distinctNumbers(blankOf(exo).options), "choix identiques");
    }
    m = /^(\d+) − ___ = (\d+)$/u.exec(text);
    if (m) {
      const a = Number(m[1]);
      const rest = Number(m[2]);
      return ok(a - rest === answer, `${a} − ${rest} = ${a - rest}, le trou dit ${answer}`) ?? ok(hasBorrow(a, answer) && a <= 99, "pas d'emprunt") ?? ok(distinctNumbers(blankOf(exo).options), "choix identiques");
    }
    return `phrase inconnue : ${text}`;
  },
  "calc-ordre": (exo) => {
    const row = STEPS.find((entry) => entry[0] === exo.prompt);
    return ok(row !== undefined, `suite inconnue : ${exo.prompt}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(row![1]), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "calc-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const operation = parseOperation(pair.left);
      if (!operation) return `calcul illisible : ${pair.left}`;
      if (String(operation.result) !== pair.right) return `${pair.left} = ${operation.result}, relié à ${pair.right}`;
      if (operation.sign === "+" ? !hasCarry(operation.a, operation.b) || operation.result > 100 : !hasBorrow(operation.a, operation.b) || operation.a > 99) return `${pair.left} sans retenue ni emprunt`;
    }
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((pair) => pair.right)).size === pairs.length && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "paires ou résultats répétés");
  },
  "calc-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Avec retenue", "Sans retenue"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const operation = parseOperation(item.text);
      if (!operation || operation.sign !== "+") return `addition illisible : ${item.text}`;
      const carry = hasCarry(operation.a, operation.b);
      if (carry && operation.result > 100) return `${item.text} passe cent`;
      if (!carry && operation.result > 99) return `${item.text} fait cent, les dizaines retiennent`;
      if ((carry ? "Avec retenue" : "Sans retenue") !== item.correctZone) return `${item.text} va dans « ${carry ? "Avec retenue" : "Sans retenue"} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre d'additions");
  },
  // ----- La monnaie
  "monnaie-somme": (exo) => {
    const m = /^(\p{L}+) a (.+)\. Combien a-t-(il|elle) en tout \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    if (pronounOf(m[1]) !== m[3]) return `${m[1]} se dit « ${pronounOf(m[1])} », pas « ${m[3]} »`;
    const parts = m[2].split(/, | et /);
    let total = 0;
    const values: number[] = [];
    for (const part of parts) {
      const p = /^(\d+) (pièces?) de (\d+) F$/u.exec(part);
      if (!p) return `pièces illisibles : ${part}`;
      const count = Number(p[1]);
      const value = Number(p[3]);
      if (p[2] !== (count > 1 ? "pièces" : "pièce")) return `accord faux : ${part}`;
      if (![5, 10, 25, 50, 100].includes(value)) return `${value} F n'est pas une pièce`;
      total += count * value;
      values.push(value);
    }
    return (
      ok(new Set(values).size === values.length, "deux fois la même sorte de pièce") ??
      ok(total <= 100, `${total} F passe cent`) ??
      ok(Number(rightOption(exo)) === total, `${total} F, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) % 5 === 0 && Number(o) >= 5 && Number(o) <= 100), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "monnaie-rendre": (exo) => {
    const m = /^(\p{L}+) achète (.+) à (\d+) F\. (Il|Elle) paie avec une pièce de (\d+) F\. Combien lui rend-on \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const price = Number(m[3]);
    const paid = Number(m[5]);
    return (
      ok(pronounOf(m[1]) === m[4].toLowerCase(), `${m[1]} se dit « ${pronounOf(m[1])} »`) ??
      ok(GOODS.includes(m[2]), `chose inconnue : ${m[2]}`) ??
      ok([50, 100].includes(paid) && price % 5 === 0 && price >= 5 && price < paid, `prix ${price} F payé ${paid} F`) ??
      ok(Number(rightOption(exo)) === paid - price, `${paid} − ${price} = ${paid - price}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) % 5 === 0 && Number(o) >= 5 && Number(o) <= 100), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "monnaie-achat": (exo) => {
    const m = /^(\p{L}+) a (\d+) F\. (Il|Elle) achète (.+) à (\d+) F\. Combien lui reste-t-il \? Écris le nombre\.$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const start = Number(m[2]);
    const price = Number(m[5]);
    return (
      ok(pronounOf(m[1]) === m[3].toLowerCase(), `${m[1]} se dit « ${pronounOf(m[1])} »`) ??
      ok(GOODS.includes(m[4]), `chose inconnue : ${m[4]}`) ??
      ok(start <= 100 && start % 5 === 0 && price % 5 === 0 && price >= 5 && price < start, `départ ${start} F, prix ${price} F`) ??
      ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify([String(start - price)]), `réponses admises ${acceptedOf(exo).join(" | ")}, il reste ${start - price}`) ??
      ok(exo.answerKey === String(start - price), `clé ${exo.answerKey}`)
    );
  },
  // ----- Multiplier et partager
  "mult-paquets": (exo) => {
    const m = /^(\p{L}+) a (\d+) paquets de (\d+) (\S+)\. Combien (de |d')(\S+) a-t-(il|elle) en tout \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const packs = Number(m[2]);
    const each = Number(m[3]);
    return (
      ok(pronounOf(m[1]) === m[7], `${m[1]} se dit « ${pronounOf(m[1])} »`) ??
      ok(PACKED.includes(m[4]) && m[4] === m[6], `chose ${m[4]} / ${m[6]}`) ??
      ok(`${m[5]}${m[6]}` === ofNoun(m[4]), `« ${m[5]}${m[6]} » au lieu de « ${ofNoun(m[4])} »`) ??
      ok(packs >= 2 && each >= 2 && packs <= 10 && each <= 10 && (packs === 2 || packs === 3 || each === 2 || each === 3), `${packs} × ${each} est hors des tables de 2 et de 3`) ??
      ok(packs * each <= 30, "le résultat passe trente") ??
      ok(Number(rightOption(exo)) === packs * each, `${packs} × ${each} = ${packs * each}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) <= 30), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "mult-ecrire": (exo) => {
    const m = /^(\p{L}+) a (\d+) paquets de (\d+) (\S+)\. Combien (de |d')(\S+) a-t-(il|elle) en tout \? Écris le nombre\.$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const packs = Number(m[2]);
    const each = Number(m[3]);
    return (
      ok(pronounOf(m[1]) === m[7], `${m[1]} se dit « ${pronounOf(m[1])} »`) ??
      ok(PACKED.includes(m[4]) && m[4] === m[6], `chose ${m[4]} / ${m[6]}`) ??
      ok(`${m[5]}${m[6]}` === ofNoun(m[4]), `« ${m[5]}${m[6]} » au lieu de « ${ofNoun(m[4])} »`) ??
      ok(packs >= 2 && each >= 2 && packs <= 10 && each <= 10 && (packs === 2 || packs === 3 || each === 2 || each === 3), `${packs} × ${each} est hors des tables de 2 et de 3`) ??
      ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify([String(packs * each)]), `réponses admises ${acceptedOf(exo).join(" | ")}, le total est ${packs * each}`) ??
      ok(exo.answerKey === String(packs * each), `clé ${exo.answerKey}`)
    );
  },
  "mult-addition": (exo) => {
    const m = /^Quelle multiplication donne le même résultat que (\d+(?: \+ \d+)+) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const terms = m[1].split(" + ").map(Number);
    const sum = terms.reduce((a, b) => a + b, 0);
    const right = valueOf(rightOption(exo));
    const options = optionsOf(exo);
    const values = options.map(valueOf);
    return (
      ok(terms.every((t) => t === terms[0]) && (terms[0] === 2 || terms[0] === 3) && terms.length >= 3, `addition répétée illisible : ${m[1]}`) ??
      ok(right === sum && /^\d+ × \d+$/u.test(rightOption(exo)), `${m[1]} = ${sum}, la bonne option est ${rightOption(exo)}`) ??
      ok(rightOption(exo) === `${terms.length} × ${terms[0]}`, `la bonne option doit dire ${terms.length} × ${terms[0]}`) ??
      ok(options.every((option) => /^\d+ × \d+$/u.test(option)), `un choix n'est pas une multiplication : ${options.join(" | ")}`) ??
      ok(values.every((v) => v !== null) && new Set(values).size === 3 && values.filter((v) => v === sum).length === 1, `valeurs des choix ${values.join(" | ")}`)
    );
  },
  "mult-table": (exo) => {
    let m = /^Combien font (\d+) × (\d+) \?$/u.exec(exo.prompt);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      return (
        ok(a >= 1 && b >= 1 && a <= 10 && b <= 10 && (a === 2 || a === 3 || b === 2 || b === 3), `${a} × ${b} est hors des tables de 2 et de 3`) ??
        ok(Number(rightOption(exo)) === a * b, `${a} × ${b} = ${a * b}, la bonne option est ${rightOption(exo)}`) ??
        ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) <= 30), `choix ${optionsOf(exo).join(" | ")}`)
      );
    }
    m = /^Quel est le double de (\d+) \?$/u.exec(exo.prompt);
    if (m) {
      const n = Number(m[1]);
      return ok(n >= 1 && n <= 10, `double de ${n}`) ?? ok(Number(rightOption(exo)) === 2 * n, `le double de ${n} est ${2 * n}, la bonne option est ${rightOption(exo)}`) ?? ok(distinctNumbers(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`);
    }
    return `énoncé ${exo.prompt}`;
  },
  "mult-trou": (exo) => {
    const text = textOf(exo);
    const answer = Number(blankOf(exo).answer);
    let m = /^(\d+) × ___ = (\d+)$/u.exec(text);
    let known = 0;
    let product = 0;
    if (m) {
      known = Number(m[1]);
      product = Number(m[2]);
    } else {
      m = /^___ × (\d+) = (\d+)$/u.exec(text);
      if (!m) return `phrase inconnue : ${text}`;
      known = Number(m[1]);
      product = Number(m[2]);
    }
    return (
      ok(known === 2 || known === 3, `${known} n'est pas une table de la fiche`) ??
      ok(known * answer === product, `${known} × ${answer} = ${known * answer}, pas ${product}`) ??
      ok(answer >= 2 && answer <= 10 && product <= 30, `facteur ${answer} ou résultat ${product} hors des tables`) ??
      ok(distinctNumbers(blankOf(exo).options) && blankOf(exo).options.every((o) => Number(o) <= 10), `choix ${blankOf(exo).options.join(" | ")}`)
    );
  },
  "mult-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const m = /^(\d+) × (\d+)$/u.exec(pair.left);
      if (!m) return `multiplication illisible : ${pair.left}`;
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (!(a === 2 || a === 3 || b === 2 || b === 3) || a > 10 || b > 10) return `${pair.left} est hors des tables de 2 et de 3`;
      if (String(a * b) !== pair.right) return `${pair.left} = ${a * b}, relié à ${pair.right}`;
    }
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((pair) => pair.right)).size === pairs.length && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "paires ou résultats répétés");
  },
  "mult-suite": (exo) => {
    const m = /^Mets dans l'ordre, (du plus petit au plus grand|du plus grand au plus petit), les résultats de la table de (\d+)\.$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const table = Number(m[2]);
    const values = sequenceOf(exo).map(Number);
    const sorted = [...values].sort((a, b) => (m[1] === "du plus petit au plus grand" ? a - b : b - a));
    return (
      ok(table === 2 || table === 3, `table de ${table}`) ??
      ok(values.length === 4 && new Set(values).size === 4 && values.every((v) => v % table === 0 && v / table >= 1 && v / table <= 10), `un résultat n'est pas de la table de ${table} : ${values.join(" ")}`) ??
      ok(JSON.stringify(values) === JSON.stringify(sorted), `la suite ${values.join(" > ")} n'est pas rangée`)
    );
  },
  "mult-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Table de 2", "Table de 3"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const n = Number(item.text);
      if (n % 6 === 0) return `${n} est dans les deux tables`;
      const zone = n % 2 === 0 ? "Table de 2" : n % 3 === 0 ? "Table de 3" : null;
      if (zone !== item.correctZone) return `${n} va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
      if (n > 30) return `${n} passe trente`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de résultats");
  },
  "part-qcm": (exo) => {
    const m = /^(\p{L}+) partage (\d+) (\S+) entre (\d+) enfants\. Combien (de |d')(\S+) chaque enfant reçoit-il \?$/u.exec(exo.prompt);
    if (!m) return `énoncé ${exo.prompt}`;
    const total = Number(m[2]);
    const children = Number(m[4]);
    return (
      ok(SHARED.includes(m[3]) && m[3] === m[6], `chose ${m[3]} / ${m[6]}`) ??
      ok(`${m[5]}${m[6]}` === ofNoun(m[3]), `« ${m[5]}${m[6]} » au lieu de « ${ofNoun(m[3])} »`) ??
      ok((children === 2 || children === 3) && total % children === 0 && total / children >= 2 && total / children <= 10, `${total} entre ${children} : pas un partage de la fiche`) ??
      ok(Number(rightOption(exo)) === total / children, `${total} entre ${children} : ${total / children}, la bonne option est ${rightOption(exo)}`) ??
      ok(distinctNumbers(optionsOf(exo)) && optionsOf(exo).every((o) => Number(o) >= 1), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "part-trou": (exo) => {
    const m = /^Je partage (\d+) (\S+) entre (\d+) enfants\. Chaque enfant reçoit ___ (\S+)\.$/u.exec(textOf(exo));
    if (!m) return `phrase inconnue : ${textOf(exo)}`;
    const total = Number(m[1]);
    const children = Number(m[3]);
    return (
      ok(SHARED.includes(m[2]) && m[2] === m[4], `chose ${m[2]} / ${m[4]}`) ??
      ok((children === 2 || children === 3) && total % children === 0 && total / children >= 2 && total / children <= 10, `${total} entre ${children} : pas un partage de la fiche`) ??
      ok(Number(blankOf(exo).answer) === total / children, `${total} entre ${children} : ${total / children}, le trou dit ${blankOf(exo).answer}`) ??
      ok(distinctNumbers(blankOf(exo).options), `choix ${blankOf(exo).options.join(" | ")}`)
    );
  },
};

describe("chaque gabarit des nombres, du calcul et des tables du CP a sa vérification", () => {
  it("couvre exactement les vingt-neuf gabarits", () => {
    expect(KINDS).toHaveLength(29);
    expect(Object.keys(CHECKS).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les nombres en lettres sont ceux de l'école", () => {
  it("la table de ce test connaît les nombres difficiles, du zéro au cent", () => {
    for (const [n, words] of HARD_WORDS) expect(wordsOf(n), String(n)).toBe(words);
  });

  it("`inWords` écrit les mêmes mots que la table, de 0 à 100", () => {
    for (let n = 0; n <= 100; n++) expect(inWords(n), String(n)).toBe(wordsOf(n));
  });

  it("n'écrit jamais « huitante », « septante » ni « nonante » : ce n'est pas le français de l'école", () => {
    for (let n = 0; n <= 100; n++) expect(inWords(n), String(n)).not.toMatch(/huitante|septante|nonante/u);
  });

  it("donne à chaque nombre un nom différent", () => {
    const names = Array.from({ length: 101 }, (_, n) => inWords(n));
    expect(new Set(names).size).toBe(101);
  });
});

describe("les gabarits des nombres, du calcul et des tables du CP recalculent juste, depuis leur propre arithmétique", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se recalcule, à tous les niveaux`, () => {
      for (const vocab of variants(kind)) {
        for (const d of draws.filter((_, i) => i % 2 === 0)) {
          const exo = make(kind, vocab, d) as unknown as Exo;
          expect(CHECKS[kind](exo, vocab), `${kind} ${vocab ?? ""} niveau ${d.level} : ${exo.prompt}`).toBeNull();
        }
      }
    });
  }

  it("sans plafond précis (vocabulary absent), les nombres restent ceux de la fiche de 50", () => {
    for (const kind of NUMBER_KINDS) {
      for (const d of draws.filter((_, i) => i % 6 === 0)) {
        const exo = make(kind as GameKind, undefined, d) as unknown as Exo;
        expect(CHECKS[kind](exo, undefined), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    }
  });
});

describe("les règles de la fiche tiennent partout", () => {
  const every = KINDS.flatMap((kind) => variants(kind).flatMap((vocab) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, vocab, exo: make(kind, vocab, d) as unknown as Exo }))));

  const numbersIn = (exo: Exo): number[] => {
    const texts: string[] = [exo.prompt];
    if (exo.payload.options) texts.push(...optionsOf(exo));
    if (exo.payload.blanks) texts.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) texts.push(...sequenceOf(exo));
    if (exo.payload.pairs) texts.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) texts.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return texts.flatMap((text) => (text.match(/\d+/g) ?? []).map(Number));
  };

  it("aucun nombre n'est écrit au-delà du plafond de la fiche, ni dans l'énoncé ni dans un choix", () => {
    for (const { kind, vocab, exo } of every) {
      if (!NUMBER_KINDS.includes(kind)) continue;
      for (const n of numbersIn(exo)) expect(n, `${kind} ${vocab} : ${exo.prompt}`).toBeLessThanOrEqual(capOf(vocab));
    }
  });

  it("aucun nombre n'est écrit au-delà de cent dans le calcul et la monnaie, ni au-delà de trente dans les tables", () => {
    for (const { kind, exo } of every) {
      if (kind.startsWith("calc-") || kind.startsWith("monnaie-")) for (const n of numbersIn(exo)) expect(n, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(100);
      if (kind.startsWith("mult-") || kind.startsWith("part-")) for (const n of numbersIn(exo)) expect(n, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(30);
    }
  });

  it("les tables : aucun signe de division, jamais une multiplication hors des tables de 2 et de 3, même dans un mauvais choix", () => {
    for (const { kind, exo } of every) {
      if (!(kind.startsWith("mult-") || kind.startsWith("part-"))) continue;
      const shown = [exo.prompt, ...(exo.payload.pairs ? pairsOf(exo).map((pair) => pair.left) : []), ...(exo.payload.blanks ? [textOf(exo)] : []), ...(exo.payload.options ? optionsOf(exo) : [])];
      for (const text of shown) {
        expect(text, kind).not.toMatch(/÷/u);
        for (const product of text.matchAll(/(\d+) × (\d+)/gu)) {
          const [a, b] = [Number(product[1]), Number(product[2])];
          expect(a === 2 || a === 3 || b === 2 || b === 3, `${kind} : ${product[0]}`).toBe(true);
        }
      }
    }
  });
});

describe("le jeu des suites de nombres respecte le plafond des fiches du CP", () => {
  it("« Les nombres jusqu'à 50 » ne passe jamais cinquante, « jusqu'à 100 » ne passe jamais cent, et la suite est bien arithmétique", () => {
    for (const vocab of VOCABULARIES) {
      for (const d of draws.filter((_, i) => i % 2 === 0)) {
        const exo = make("suite-nombres", vocab, d) as unknown as Exo;
        const sequence = exo.payload.sequence as (string | null)[];
        const answers = exo.payload.answers as string[];
        const options = exo.payload.options as string[];
        const numberOf = (text: string) => Number(text.replace(/\s/g, ""));
        let next = 0;
        const values = sequence.map((cell) => (cell === null ? numberOf(answers[next++]) : numberOf(cell)));
        const step = values[1] - values[0];
        for (let i = 1; i < values.length; i++) expect(values[i] - values[i - 1], `${vocab} : ${values.join(", ")}`).toBe(step);
        for (const n of [...values, ...options.map(numberOf)]) {
          expect(n, `${vocab} : ${values.join(", ")} / ${options.join(", ")}`).toBeLessThanOrEqual(capOf(vocab));
          expect(n).toBeGreaterThanOrEqual(0);
        }
        expect(options.map(numberOf).filter((n) => answers.map(numberOf).includes(n)).length, "la bonne réponse manque").toBe(answers.length);
      }
    }
  });
});

// ===========================================================================
// LES MUTATIONS : une vérification qui ne voit pas une réponse abîmée ne prouve rien
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. `null` si rien ne peut être abîmé. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      payload.acceptedAnswers = ["xxxx"];
      return copy();
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const vocab of variants(kind)) {
        for (const d of draws.filter((_, i) => i % 6 === 0)) {
          const exo = make(kind, vocab, d) as unknown as Exo;
          const broken = mutate(kind, exo);
          if (!broken) continue;
          mutated += 1;
          expect(CHECKS[kind](broken, vocab), `${kind} ${vocab ?? ""} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
        }
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des nombres, du calcul et des tables du CP", () => {
  const exos = KINDS.flatMap((kind) => variants(kind).flatMap((vocab) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, vocab, exo: make(kind, vocab, d) as unknown as Exo }))));

  const texts = (exo: Exo): string[] => {
    const out = [exo.prompt, ...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    if (exo.payload.acceptedAnswers) out.push(...acceptedOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent aucun émoji ni U+FE0F : les appareils anciens montrent les récents en carré", () => {
    for (const { kind, exo } of exos) {
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(/\d/.test(hint), `${kind} : « ${hint} » écrit un chiffre`).toBe(false);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      for (const vocab of variants(kind)) {
        const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, vocab));
        const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, vocab));
        expect(a).toEqual(b);
        expect(a.hints).toHaveLength(3);
        expect(new Set(a.hints).size, kind).toBe(3);
      }
    }
  });

  it("passent le contrôleur de mathématiques au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject: "Mathématiques",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les quatre thématiques de mathématiques du CP : nombres, retenue, multiplier", () => {
  const KEYS = ["ma-cp-nombres-50", "ma-cp-nombres-100", "ma-cp-retenue", "ma-cp-multiplier"];
  const VOCAB_OF: Record<string, string | undefined> = { "ma-cp-nombres-50": "nombres-50", "ma-cp-nombres-100": "nombres-100" };
  const EARLIER_KEYS = [
    "hi-cp-calendrier", "hi-cp-durees", "hi-cp-frequences", "hi-cp-emploi-du-temps", "ge-cp-itineraire", "ge-cp-distances", "ge-cp-plan", "ge-cp-quartier",
    "an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food", "fr-cp-lecture", "fr-cp-ecrire",
    "fr-cp-consignes", "fr-cp-decrire", "fr-cp-raconter", "fr-cp-inviter", "ar-cp-melanges", "ar-cp-traits", "ar-cp-decorer", "ar-cp-rythmes",
    "ci-cp-route", "ci-cp-reglement", "ci-cp-responsabilites", "ci-cp-genre", "ci-cp-paix",
    "sc-cp-matiere", "sc-cp-grandir", "sc-cp-manger", "sc-cp-maladies", "sc-cp-nature", "ar-cp-roles",
  ];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        // Chaque jeu de nombres, et la suite de nombres, porte le plafond de sa fiche.
        if (VOCAB_OF[key]) expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(VOCAB_OF[key]);
        else expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("n'emploient chaque gabarit que dans la thématique qui le concerne", () => {
    const kindsOf = (key: string) => (topicOf(key).games ?? []).map((spec) => spec.kind as string);
    for (const key of ["ma-cp-nombres-50", "ma-cp-nombres-100"]) for (const kind of kindsOf(key)) expect(kind, `${key} : ${kind}`).toMatch(/^(nb-|suite-nombres$)/);
    for (const kind of kindsOf("ma-cp-retenue")) expect(kind, kind).toMatch(/^(calc-|monnaie-)/);
    for (const kind of kindsOf("ma-cp-multiplier")) expect(kind, kind).toMatch(/^(mult-|part-)/);
  });

  it("sont, avec les trente-quatre des cinq premiers lots, parmi les thématiques du CP entièrement faites par le code", () => {
    const allCode = allProgrammeEntries()
      .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((e) => e.topic.key);
    for (const key of [...EARLIER_KEYS, ...KEYS]) expect(allCode, key).toContain(key);
    expect(allCode.length).toBeGreaterThanOrEqual(EARLIER_KEYS.length + KEYS.length);
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et le calcul", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CP",
              subject: "Mathématiques",
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const origin = game.payload.game as { kind: string; vocabulary?: string };
            if (CHECKS[origin.kind]) expect(CHECKS[origin.kind](game as unknown as Exo, origin.vocabulary), `${key} palier ${palierIndex} ${origin.kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un exercice de chaque type que la banque attend sur ces thématiques", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of KEYS) {
      for (const type of ["qcm", "drag-drop", "match", "order", "fill-blank"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle, avec le même plafond", () => {
    for (const key of KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 2, vocabulary: spec.vocabulary };
        const again = regenerateGame(origin, "CP", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
