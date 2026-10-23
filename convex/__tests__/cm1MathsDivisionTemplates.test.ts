import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, NUMBER, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LA DIVISION POSÉE DU CM1 (`ma-cm1-division`).
 *
 * Chaque test RECALCULE la division avec sa propre arithmétique : le quotient entier et le reste par soustractions de multiples (pas par `Math.floor`), le test
 * qu'un choix est vrai en chiffres (diviseur fois quotient plus reste égale dividende, reste plus petit que le diviseur), la règle de chaque palier. Un seul
 * choix d'une division posée est le résultat de l'école ; un reste n'est jamais plus grand que le diviseur. Le niveau 2 est celui des paliers 2 et 3.
 */

/** Le quotient entier et le reste de n ÷ d, comptés en retirant des multiples du diviseur, sans division. */
function divide(n: number, d: number): { q: number; r: number } {
  let q = 0;
  let rest = n;
  for (const step of [10000, 1000, 100, 10, 1]) {
    while (rest >= d * step) {
      rest -= d * step;
      q += step;
    }
  }
  return { q, r: rest };
}

/** Le résultat comme l'école l'écrit : « 652 reste 3 », ou « 652 » quand rien ne reste. */
const schoolAnswer = (n: number, d: number) => {
  const { q, r } = divide(n, d);
  return r === 0 ? fmtNumber(q) : `${fmtNumber(q)} reste ${fmtNumber(r)}`;
};
const fmtNumber = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Une division est du niveau : le diviseur et le quotient de chaque palier. */
function fitsPlan(n: number, d: number, level: GameLevel): boolean {
  const { q } = divide(n, d);
  const oneDigit = d >= 2 && d <= 9;
  switch (level) {
    case 1:
      return oneDigit && q >= 10 && q <= 99;
    case 2:
      return (oneDigit && q >= 100 && q <= 999) || ([10, 11, 12, 15, 20, 25].includes(d) && q >= 10 && q <= 99);
    case 3:
      return d >= 11 && d <= 30 && q >= 20 && q <= 300;
    case 4:
      return d >= 21 && d <= 99 && q >= 30 && q <= 999;
  }
}

/** Un choix « 652 reste 3 » ou « 652 » est vrai en chiffres : diviseur fois quotient plus reste égale le dividende, même si le reste est trop grand. */
function trueInDigits(option: string, n: number, d: number): boolean {
  const m = new RegExp(`^(${NUMBER})(?: reste (${NUMBER}))?$`).exec(option);
  if (!m) return false;
  return num(m[1]) * d + (m[2] ? num(m[2]) : 0) === n;
}

const checkPosed: Check = (exo) => {
  const m = new RegExp(`^Pose (${NUMBER}) ÷ (\\d+)\\. Quel est le résultat \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const level = levelOf(exo);
  return all(
    ok(rightOption(exo) === schoolAnswer(n, d), `${exo.prompt} : ${rightOption(exo)}, pas ${schoolAnswer(n, d)}`),
    ok(optionsOf(exo).filter((option) => trueInDigits(option, n, d)).length === 1, `plusieurs choix vrais en chiffres : ${optionsOf(exo).join(" / ")}`),
    ok(optionsOf(exo).every((option) => option === rightOption(exo) || option !== schoolAnswer(n, d)), "un mauvais choix égal à la bonne réponse"),
    ok(fitsPlan(n, d, level), `${n} ÷ ${d} n'est pas du niveau ${level}`),
    ok(n <= 99999, "un dividende de plus de cinq chiffres"),
  );
};

const checkRest: Check = (exo) => {
  const m = new RegExp(`^Quel est le reste de (${NUMBER}) ÷ (\\d+) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const { r } = divide(n, d);
  return all(
    ok(num(rightOption(exo)) === r && r > 0, `${exo.prompt} : ${rightOption(exo)}, pas ${r}`),
    ok(wrongOf(exo).every((option) => num(option) !== r), "un mauvais choix égal au reste"),
    ok(fitsPlan(n, d, levelOf(exo)), `${n} ÷ ${d} n'est pas du niveau ${levelOf(exo)}`),
  );
};

/** Les trois façons de vérifier et les paliers où elles servent : le niveau 2 réunit les paliers 2 et 3. */
const CHECK_FORMS: Record<GameLevel, string[]> = { 1: ["reste"], 2: ["reste", "quotient", "diviseur"], 3: ["reste", "quotient", "diviseur"], 4: ["reste", "quotient", "diviseur"] };

function readCheck(exo: Exo): { form: string; n: number; d: number; q: number; r: number } | string {
  const text = textOf(exo);
  let m = new RegExp(`^(${NUMBER}) = (\\d+) × (${NUMBER}) \\+ ___$`).exec(text);
  if (m) {
    const [n, d, q] = [num(m[1]), Number(m[2]), num(m[3])];
    return { form: "reste", n, d, q, r: n - d * q };
  }
  m = new RegExp(`^(${NUMBER}) = (\\d+) × ___ \\+ (\\d+)$`).exec(text);
  if (m) {
    const [n, d, r] = [num(m[1]), Number(m[2]), Number(m[3])];
    return { form: "quotient", n, d, q: (n - r) / d, r };
  }
  m = new RegExp(`^(${NUMBER}) = ___ × (${NUMBER}) \\+ (\\d+)$`).exec(text);
  if (m) {
    const [n, q, r] = [num(m[1]), num(m[2]), Number(m[3])];
    return { form: "diviseur", n, d: (n - r) / q, q, r };
  }
  return `phrase inconnue : ${text}`;
}

const checkVerify: Check = (exo) => {
  const read = readCheck(exo);
  if (typeof read === "string") return read;
  const { form, n, d, q, r } = read;
  const level = levelOf(exo);
  const answer = num(blankOf(exo).answer);
  const expected = form === "reste" ? r : form === "quotient" ? q : d;
  return all(
    ok(Number.isInteger(d) && Number.isInteger(q) && d * q + r === n, `${textOf(exo)} : ce n'est pas une division`),
    ok(r >= 1 && r < d, `le reste ${r} n'est pas plus petit que le diviseur ${d}`),
    ok(answer === expected, `${textOf(exo)} : ${answer}, pas ${expected}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || num(option) !== expected), "un mauvais choix égal à la réponse"),
    ok(CHECK_FORMS[level].includes(form), `la forme ${form} au niveau ${level}`),
    ok(fitsPlan(n, d, level), `${n} ÷ ${d} n'est pas du niveau ${level}`),
  );
};

const checkWrite: Check = (exo) => {
  let n: number;
  let d: number;
  let expected: number;
  let m = new RegExp(`^Écris le résultat de (${NUMBER}) ÷ (\\d+)\\.$`).exec(exo.prompt);
  if (m) {
    [n, d] = [num(m[1]), Number(m[2])];
    expected = divide(n, d).q;
    if (divide(n, d).r !== 0) return `${n} ÷ ${d} ne tombe pas juste`;
  } else if ((m = new RegExp(`^Pose (${NUMBER}) ÷ (\\d+)\\. Écris le (reste|quotient)\\.$`).exec(exo.prompt))) {
    [n, d] = [num(m[1]), Number(m[2])];
    expected = m[3] === "reste" ? divide(n, d).r : divide(n, d).q;
    if (divide(n, d).r === 0) return `${n} ÷ ${d} tombe juste : pas de reste à écrire`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  return all(
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey && exo.answerKey === String(expected), `${exo.prompt} : ${exo.answerKey}, pas ${expected}`),
    ok(fitsPlan(n, d, level), `${n} ÷ ${d} n'est pas du niveau ${level}`),
    ok(level < 3 || divide(n, d).r > 0, "une division qui tombe juste aux deux derniers paliers"),
  );
};

const checkDigits: Check = (exo) => {
  const m = new RegExp(`^Combien de chiffres a le quotient de (${NUMBER}) ÷ (\\d+) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const digits = String(divide(n, d).q).length;
  return all(
    ok(rightOption(exo) === String(digits), `${exo.prompt} : ${rightOption(exo)}, pas ${digits}`),
    ok(wrongOf(exo).every((option) => /^\d$/.test(option) && Number(option) >= 1 && Number(option) !== digits), "un mauvais choix égal à la réponse ou qui n'est pas un chiffre"),
    ok(fitsPlan(n, d, levelOf(exo)), `${n} ÷ ${d} n'est pas du niveau ${levelOf(exo)}`),
  );
};

function readDivision(text: string): { n: number; d: number } | null {
  const m = new RegExp(`^(${NUMBER}) ÷ (\\d+)$`).exec(text);
  return m ? { n: num(m[1]), d: Number(m[2]) } : null;
}

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque division à son résultat.") return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  const rows = pairsOf(exo).map((pair) => ({ division: readDivision(pair.left), right: pair.right }));
  if (rows.some((row) => row.division === null)) return `une division illisible : ${pairsOf(exo).map((pair) => pair.left).join(", ")}`;
  return all(
    ok(rows.length === 3, "trois divisions"),
    ok(rows.every((row) => row.right === schoolAnswer(row.division!.n, row.division!.d)), `un résultat faux : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(rows.map((row) => row.right)).size === 3, "deux divisions de même résultat"),
    ok(rows.every((row) => fitsPlan(row.division!.n, row.division!.d, level)), `une division hors du niveau ${level}`),
  );
};

const checkSort: Check = (exo) => {
  const [exact, rest] = zonesOf(exo);
  if (exact !== "Tombe juste" || rest !== "Il reste quelque chose") return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const level = levelOf(exo);
  const each = level === 1 ? 2 : 3;
  const items = itemsOf(exo).map((item) => ({ ...item, division: readDivision(item.text) }));
  if (items.some((item) => item.division === null)) return "une division illisible";
  const wrongPlace = items.find((item) => item.correctZone !== (divide(item.division!.n, item.division!.d).r === 0 ? exact : rest));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case`),
    ok(items.filter((item) => item.correctZone === exact).length === each && items.filter((item) => item.correctZone === rest).length === each, `${each} divisions par case`),
    ok(items.every((item) => fitsPlan(item.division!.n, item.division!.d, level)), `une division hors du niveau ${level}`),
  );
};

const checkOrder: Check = (exo) => {
  const ascending = exo.prompt === "Range ces divisions du plus petit au plus grand quotient.";
  const descending = exo.prompt === "Range ces divisions du plus grand au plus petit quotient.";
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  const rows = sequenceOf(exo).map(readDivision);
  if (rows.some((row) => row === null)) return `une division illisible : ${sequenceOf(exo).join(", ")}`;
  const quotients = rows.map((row) => divide(row!.n, row!.d).q);
  const sorted = [...quotients].sort((x, y) => (ascending ? x - y : y - x));
  return all(
    ok(new Set(quotients).size === 4, "quatre quotients différents"),
    ok(JSON.stringify(quotients) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(level >= 2 || ascending, "du plus grand au plus petit au premier palier"),
    ok(rows.every((row) => fitsPlan(row!.n, row!.d, level)), `une division hors du niveau ${level}`),
  );
};

const THINGS = "mangues|billes|cahiers|livres|crayons|bananes";
const GROUPS: Record<string, string> = { familles: "famille", classes: "classe", équipes: "équipe", villages: "village" };

const checkShare: Check = (exo) => {
  const m = new RegExp(`^On partage (${NUMBER}) (${THINGS}) entre (\\d+) (${Object.keys(GROUPS).join("|")})\\. Combien de (${THINGS}) reçoit chaque (\\S+) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[3])];
  const { q, r } = divide(n, d);
  return all(
    ok(r === 0, `${n} ÷ ${d} ne tombe pas juste : la part n'est pas une seule réponse`),
    ok(num(rightOption(exo)) === q, `${exo.prompt} : ${rightOption(exo)}, pas ${q}`),
    ok(m[2] === m[5], "la chose du début et de la question"),
    ok(GROUPS[m[4]] === m[6], `« ${m[4]} » et « ${m[6]} » ne vont pas ensemble`),
    ok(wrongOf(exo).every((option) => num(option) !== q), "un mauvais choix égal à la part"),
    ok(fitsPlan(n, d, levelOf(exo)), `${n} ÷ ${d} n'est pas du niveau ${levelOf(exo)}`),
  );
};

const GROUP_FORMS: Record<GameLevel, string[]> = { 1: ["paquets"], 2: ["paquets", "reste", "voyages"], 3: ["reste", "voyages", "paquets"], 4: ["reste", "voyages"] };

const checkGroup: Check = (exo) => {
  const level = levelOf(exo);
  let form: string;
  let n: number;
  let d: number;
  let expected: number;
  let m = new RegExp(`^On range (${NUMBER}) (${THINGS}) dans des boîtes de (\\d+)\\. Combien de boîtes pleines obtient-on \\?$`).exec(exo.prompt);
  if (m) {
    form = "paquets";
    [n, d] = [num(m[1]), Number(m[3])];
    expected = divide(n, d).q;
  } else if ((m = new RegExp(`^On range (${NUMBER}) (${THINGS}) dans des boîtes de (\\d+)\\. Combien de (${THINGS}) restent hors des boîtes pleines \\?$`).exec(exo.prompt))) {
    form = "reste";
    [n, d] = [num(m[1]), Number(m[3])];
    expected = divide(n, d).r;
    if (m[2] !== m[4]) return "la chose du début et de la question";
    if (expected === 0) return `${n} ÷ ${d} tombe juste : rien ne reste`;
  } else if ((m = new RegExp(`^Un camion porte (\\d+) sacs par voyage\\. Combien de voyages faut-il pour porter (${NUMBER}) sacs \\?$`).exec(exo.prompt))) {
    form = "voyages";
    [d, n] = [Number(m[1]), num(m[2])];
    const { q, r } = divide(n, d);
    expected = r === 0 ? q : q + 1;
    if (r === 0) return `${n} ÷ ${d} tombe juste : le dernier voyage n'existe pas`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => num(option) !== expected), "un mauvais choix égal à la bonne réponse"),
    ok(GROUP_FORMS[level].includes(form), `la forme ${form} au niveau ${level}`),
    ok(fitsPlan(n, d, level), `${n} ÷ ${d} n'est pas du niveau ${level}`),
  );
};

/** Les divisions qu'un exercice pose : un palier ne pose jamais deux fois la même (dividende et diviseur). */
function asked(exo: Exo): string[] | null {
  const kind = (exo.payload.game as { kind: string }).kind;
  const key = (n: number, d: number) => `${n}÷${d}`;
  let m: RegExpExecArray | null;
  if (["cm1-div-poser", "cm1-div-reste", "cm1-div-ecrire", "cm1-div-chiffres"].includes(kind)) {
    m = new RegExp(`(${NUMBER}) ÷ (\\d+)`).exec(exo.prompt);
    return m ? [key(num(m[1]), Number(m[2]))] : null;
  }
  if (kind === "cm1-div-verifier") {
    const read = readCheck(exo);
    return typeof read === "string" ? null : [key(read.n, read.d)];
  }
  if (kind === "cm1-div-relier") return pairsOf(exo).map((pair) => key(readDivision(pair.left)!.n, readDivision(pair.left)!.d));
  if (kind === "cm1-div-ordre") return sequenceOf(exo).map((tile) => key(readDivision(tile)!.n, readDivision(tile)!.d));
  if (kind === "cm1-div-glisser") return itemsOf(exo).map((item) => key(readDivision(item.text)!.n, readDivision(item.text)!.d));
  if (kind === "cm1-div-partage") {
    m = new RegExp(`^On partage (${NUMBER}) \\S+ entre (\\d+) `).exec(exo.prompt);
    return m ? [key(num(m[1]), Number(m[2]))] : null;
  }
  if (kind === "cm1-div-groupement") {
    m = new RegExp(`^On range (${NUMBER}) \\S+ dans des boîtes de (\\d+)`).exec(exo.prompt);
    if (m) return [key(num(m[1]), Number(m[2]))];
    m = new RegExp(`^Un camion porte (\\d+) sacs par voyage\\. Combien de voyages faut-il pour porter (${NUMBER}) sacs`).exec(exo.prompt);
    return m ? [key(num(m[2]), Number(m[1]))] : null;
  }
  return null;
}

const TOPIC_KINDS = {
  "ma-cm1-division": ["poser", "reste", "verifier", "ecrire", "chiffres", "relier", "glisser", "ordre", "partage", "groupement"].map((k) => `cm1-div-${k}`),
};

defineMathsTests({
  label: "de la division du CM1",
  checks: {
    "cm1-div-poser": checkPosed,
    "cm1-div-reste": checkRest,
    "cm1-div-verifier": checkVerify,
    "cm1-div-ecrire": checkWrite,
    "cm1-div-chiffres": checkDigits,
    "cm1-div-relier": checkLinks,
    "cm1-div-glisser": checkSort,
    "cm1-div-ordre": checkOrder,
    "cm1-div-partage": checkShare,
    "cm1-div-groupement": checkGroup,
  },
  topicKinds: TOPIC_KINDS,
  caps: [{ prefix: "cm1-div-", max: 99999 }],
  asked,
});

describe("les vérifications de la division voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;

  it("la division à la main : retirer des multiples donne le bon quotient et le bon reste", () => {
    expect(divide(4567, 7)).toEqual({ q: 652, r: 3 });
    expect(divide(47, 3)).toEqual({ q: 15, r: 2 });
    expect(divide(99999, 99)).toEqual({ q: 1010, r: 9 });
    expect(divide(1200, 20)).toEqual({ q: 60, r: 0 });
  });

  it("un reste plus grand que le diviseur est refusé, comme une division vraie en chiffres qui n'est pas la réponse de l'école", () => {
    expect(checkPosed(qcm("Pose 4 567 ÷ 7. Quel est le résultat ?", ["652 reste 3", "652 reste 10", "653 reste 3"], 0, 2))).toBeNull();
    expect(checkPosed(qcm("Pose 4 567 ÷ 7. Quel est le résultat ?", ["652 reste 3", "652 reste 10", "653 reste 3"], 1, 2))).not.toBeNull();
    // 651 reste 10 vaut aussi 4 567 en chiffres : une seconde bonne réponse pour un enfant qui compte bien, refusée.
    expect(checkPosed(qcm("Pose 4 567 ÷ 7. Quel est le résultat ?", ["652 reste 3", "651 reste 10", "653 reste 3"], 0, 2))).not.toBeNull();
    expect(checkPosed(qcm("Pose 47 ÷ 3. Quel est le résultat ?", ["15 reste 2", "14 reste 5", "16 reste 1"], 0, 1))).not.toBeNull();
    expect(checkPosed(qcm("Pose 47 ÷ 3. Quel est le résultat ?", ["15 reste 2", "15 reste 5", "16 reste 1"], 1, 1))).not.toBeNull();
  });

  it("un partage qui ne tombe pas juste, ou le dernier voyage oublié, sont refusés", () => {
    expect(checkShare(qcm("On partage 174 bananes entre 3 équipes. Combien de bananes reçoit chaque équipe ?", ["58", "57", "59"], 0, 1))).toBeNull();
    expect(checkShare(qcm("On partage 175 bananes entre 3 équipes. Combien de bananes reçoit chaque équipe ?", ["58", "57", "59"], 0, 1))).not.toBeNull();
    expect(checkGroup(qcm("Un camion porte 25 sacs par voyage. Combien de voyages faut-il pour porter 2 279 sacs ?", ["92", "91", "93"], 0, 2))).toBeNull();
    expect(checkGroup(qcm("Un camion porte 25 sacs par voyage. Combien de voyages faut-il pour porter 2 279 sacs ?", ["92", "91", "93"], 1, 2))).not.toBeNull();
  });
});
