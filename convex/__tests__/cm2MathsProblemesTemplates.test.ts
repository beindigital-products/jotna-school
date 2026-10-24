import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * LES PROBLÈMES DU CFEE AU CM2 (`ma-cm2-problemes`).
 *
 * Chaque test RELIT l'énoncé avec ses propres expressions régulières et RECALCULE la réponse avec sa propre arithmétique : un achat de deux sortes d'objets rend
 * la monnaie d'un billet, une récolte retire ce qui est vendu et donné, un partage divise puis dépense, un trajet retire deux distances, un achat revendu retire le
 * prix de revient du prix de vente ; en démarche régressive, on remonte l'histoire (ce qui a été retiré se rajoute, la moitié vendue se double). Le calcul écrit sur
 * une tuile est évalué par le test lui-même. Le niveau 2 réunit les paliers 2 et 3, le niveau 3 est le palier 4, le niveau 4 le palier 5.
 */

const N = String.raw`\d+(?: \d{3})*`;
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const numbersIn = (text: string) => (text.match(new RegExp(N, "g")) ?? []).map(num);
const SUBJECTS: Record<string, string> = { Moussa: "Il", Fatou: "Elle", Modou: "Il", Binta: "Elle", Sidy: "Il", Khady: "Elle", Cheikh: "Il", Mariama: "Elle" };

type Solved = { scenario: string; value: number; unit: string; calc: string; numbers: number[]; story: string; question: string; goals: string; reply: string; person?: string; feasible?: boolean };

/** Évalue un calcul écrit à l'école : « 10 500 − (3 × 3 000 + 500) ». */
function evaluate(expression: string): number {
  const js = expression.replace(new RegExp(N, "g"), (token) => token.replace(/ /g, "")).replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[\d+\-*/() ]+$/.test(js)) throw new Error(`calcul illisible : ${expression}`);
  return Function(`"use strict"; return (${js});`)() as number;
}

/** Relit un énoncé (l'histoire et la question) et rend la réponse recalculée, ou `null` si aucun scénario ne le reconnaît. */
function solve(text: string): Solved | null {
  let m = new RegExp(`^(\\p{L}+) achète (\\d+) ([\\p{L}]+) à (${N}) FCFA pièce et (\\d+) ([\\p{L}]+) à (${N}) FCFA pièce\\. (Il|Elle) paie avec (${N}) FCFA\\. Combien lui rend-on \\?$`, "u").exec(text);
  if (m) {
    const [n, pa, k, pb, note] = [Number(m[2]), num(m[4]), Number(m[5]), num(m[7]), num(m[9])];
    const total = n * pa + k * pb;
    return { scenario: "achat", value: note - total, unit: "FCFA", calc: `${fmt(note)} − (${n} × ${fmt(pa)} + ${k} × ${fmt(pb)})`, numbers: [n, pa, k, pb, note], story: text.replace(" Combien lui rend-on ?", ""), question: "Combien lui rend-on ?", goals: "la monnaie rendue", reply: "On lui rend ___ FCFA.", person: `${m[1]}|${m[8]}` };
  }
  m = new RegExp(`^Un paysan récolte (${N}) kg d'arachide par jour pendant (\\d+) jours\\. Il en vend (${N}) kg, puis en donne (${N}) kg à son frère\\. Combien de kilogrammes lui reste-t-il \\?$`).exec(text);
  if (m) {
    const [a, d, s, g] = [num(m[1]), Number(m[2]), num(m[3]), num(m[4])];
    return { scenario: "recolte", value: a * d - s - g, unit: "kg", calc: `${fmt(a)} × ${d} − ${fmt(s)} − ${fmt(g)}`, numbers: [a, d, s, g], story: text.replace(" Combien de kilogrammes lui reste-t-il ?", ""), question: "Combien de kilogrammes lui reste-t-il ?", goals: "la quantité qui lui reste", reply: "Il lui reste ___ kg." };
  }
  m = new RegExp(`^On partage (${N}) FCFA également entre (\\d+) enfants\\. Chaque enfant achète (\\d+) ([\\p{L}]+) à (${N}) FCFA pièce\\. Combien reste-t-il à chaque enfant \\?$`, "u").exec(text);
  if (m) {
    const [total, c, k, p] = [num(m[1]), Number(m[2]), Number(m[3]), num(m[5])];
    return { scenario: "partage", value: total / c - k * p, unit: "FCFA", calc: `${fmt(total)} ÷ ${c} − ${k} × ${fmt(p)}`, numbers: [total, c, k, p, total / c], story: text.replace(" Combien reste-t-il à chaque enfant ?", ""), question: "Combien reste-t-il à chaque enfant ?", goals: "ce qui reste à chaque enfant", reply: "Il reste ___ FCFA à chaque enfant." };
  }
  m = new RegExp(`^Un car doit parcourir (${N}) km\\. Il roule (\\d+) heures à (\\d+) km/h, puis (\\d+) heures à (\\d+) km/h\\. Combien de kilomètres lui reste-t-il à parcourir \\?$`).exec(text);
  if (m) {
    const [total, h1, v1, h2, v2] = [num(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
    return { scenario: "route", value: total - (v1 * h1 + v2 * h2), unit: "km", calc: `${fmt(total)} − (${v1} × ${h1} + ${v2} × ${h2})`, numbers: [total, h1, v1, h2, v2], story: text.replace(" Combien de kilomètres lui reste-t-il à parcourir ?", ""), question: "Combien de kilomètres lui reste-t-il à parcourir ?", goals: "la distance qui reste", reply: "Il lui reste ___ km à parcourir." };
  }
  m = new RegExp(`^(\\p{L}+) achète (\\d+) ([\\p{L} ]+) à (${N}) FCFA pièce\\. (Il|Elle) paie (${N}) FCFA de transport, puis revend le tout (${N}) FCFA\\. Quel est son bénéfice \\?$`, "u").exec(text);
  if (m) {
    const [n, p, f, v] = [Number(m[2]), num(m[4]), num(m[6]), num(m[7])];
    return { scenario: "commerce", value: v - (n * p + f), unit: "FCFA", calc: `${fmt(v)} − (${n} × ${fmt(p)} + ${fmt(f)})`, numbers: [n, p, f, v], story: text.replace(" Quel est son bénéfice ?", ""), question: "Quel est son bénéfice ?", goals: "le bénéfice", reply: "Le bénéfice est de ___ FCFA.", person: m[1] + "|" + m[5] };
  }
  m = new RegExp(`^(\\p{L}+) avait de l'argent\\. (Il|Elle) dépense (${N}) FCFA, puis reçoit (${N}) FCFA de sa tante\\. \\2 a maintenant (${N}) FCFA\\. Combien avait-(il|elle) au début \\?$`, "u").exec(text);
  if (m) {
    const [spent, received, end] = [num(m[3]), num(m[4]), num(m[5])];
    return { scenario: "argent", value: end - received + spent, unit: "FCFA", calc: `${fmt(end)} − ${fmt(received)} + ${fmt(spent)}`, numbers: [spent, received, end], story: text, question: "", goals: "l'argent du début", reply: `${m[2]} avait ___ FCFA au début.`, person: m[1] + "|" + m[2] + "|" + m[6], feasible: end > received };
  }
  m = new RegExp(`^Un commerçant a des sacs de riz\\. Le matin il en vend (${N}), l'après-midi il en reçoit (${N})\\. Il en a maintenant (${N})\\. Combien en avait-il au début \\?$`).exec(text);
  if (m) {
    const [sold, received, end] = [num(m[1]), num(m[2]), num(m[3])];
    return { scenario: "stock", value: end - received + sold, unit: "", calc: `${fmt(end)} − ${fmt(received)} + ${fmt(sold)}`, numbers: [sold, received, end], story: text, question: "", goals: "le nombre de sacs du début", reply: "Il en avait ___ au début.", feasible: end > received };
  }
  m = new RegExp(`^Un marchand vend la moitié de ses mangues le matin, puis (${N}) mangues l'après-midi\\. Il lui en reste (${N})\\. Combien de mangues avait-il au début \\?$`).exec(text);
  if (m) {
    const [sold, left] = [num(m[1]), num(m[2])];
    return { scenario: "mangues", value: 2 * (left + sold), unit: "", calc: `(${fmt(left)} + ${fmt(sold)}) × 2`, numbers: [sold, left], story: text, question: "", goals: "le nombre de mangues du début", reply: "Il avait ___ mangues au début." };
  }
  return null;
}

const PROGRESSIVE = ["achat", "recolte", "partage", "route", "commerce"];
const REGRESSIVE = ["argent", "stock", "mangues"];
const LEVEL1_FORWARD = ["recolte", "partage", "commerce"];
const LEVEL1_BACKWARD = ["argent", "stock"];
const ORDERED = ["recolte", "partage", "commerce"];
/** Le plus grand nombre écrit dans un énoncé de chaque niveau. */
const MAX_NUMBER: Record<GameLevel, number> = { 1: 40000, 2: 150000, 3: 400000, 4: 600000 };
const PERSON_OK = (person: string | undefined) => {
  if (!person) return true;
  const [name, pronoun, asked] = person.split("|");
  return name in SUBJECTS && SUBJECTS[name] === pronoun && (asked === undefined || asked === pronoun.toLowerCase());
};

const SEMANTIC = (solved: Solved, level: GameLevel, backward: boolean) =>
  all(
    ok(backward ? REGRESSIVE.includes(solved.scenario) : PROGRESSIVE.includes(solved.scenario), `le scénario ${solved.scenario} ne va pas à cette consigne`),
    ok(level > 1 || (backward ? LEVEL1_BACKWARD : LEVEL1_FORWARD).includes(solved.scenario), `${solved.scenario} au premier palier`),
    ok(Number.isInteger(solved.value) && solved.value > 0, `une réponse qui n'est pas un entier positif : ${solved.value}`),
    ok(evaluate(solved.calc) === solved.value, `le calcul ${solved.calc} ne vaut pas ${solved.value}`),
    ok(solved.numbers.every((n) => Number.isInteger(n) && n > 0 && n <= MAX_NUMBER[level]), `un nombre hors de la plage du niveau ${level} : ${solved.numbers.join(", ")}`),
    ok(!solved.numbers.includes(solved.value), "la réponse est écrite dans l'énoncé"),
    ok(PERSON_OK(solved.person), `un prénom et un pronom qui ne vont pas ensemble : ${solved.person}`),
    // En démarche régressive, ce qui reste avant de recevoir couvre ce qui a été dépensé ou vendu : le début est au moins égal à la dépense.
    ok(solved.feasible !== false, `l'histoire dépense ou vend plus qu'il n'y avait : ${solved.story}`),
  );

const answerText = (solved: Solved) => `${fmt(solved.value)}${solved.unit ? ` ${solved.unit}` : ""}`;
const wrongsFit = (exo: Exo, solved: Solved, own: number[]) =>
  ok(
    wrongOf(exo).every((option) => {
      const m = new RegExp(`^(${N})${solved.unit ? ` ${solved.unit}` : ""}$`).exec(option);
      return !!m && num(m[1]) !== solved.value && !own.includes(num(m[1])) && num(m[1]) > 0;
    }),
    `un mauvais choix égal à la bonne réponse, à un nombre de l'énoncé ou mal écrit : ${wrongOf(exo).join(" ; ")}`,
  );

const checkForward: Check = (exo) => {
  const solved = solve(exo.prompt);
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  return all(SEMANTIC(solved, levelOf(exo), false), ok(rightOption(exo) === answerText(solved), `${exo.prompt} : ${rightOption(exo)}, pas ${answerText(solved)}`), wrongsFit(exo, solved, numbersIn(exo.prompt)));
};

const checkBackward: Check = (exo) => {
  const solved = solve(exo.prompt);
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  return all(SEMANTIC(solved, levelOf(exo), true), ok(rightOption(exo) === answerText(solved), `${exo.prompt} : ${rightOption(exo)}, pas ${answerText(solved)}`), wrongsFit(exo, solved, numbersIn(exo.prompt)));
};

const checkWrite: Check = (exo) => {
  const suffix = " Écris le nombre.";
  if (!exo.prompt.endsWith(suffix)) return `énoncé inconnu : ${exo.prompt}`;
  const solved = solve(exo.prompt.slice(0, -suffix.length));
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    SEMANTIC(solved, levelOf(exo), REGRESSIVE.includes(solved.scenario)),
    ok(exo.answerKey === fmt(solved.value), `${exo.prompt} : ${exo.answerKey}, pas ${fmt(solved.value)}`),
    ok(acceptedOf(exo).includes(fmt(solved.value)) && acceptedOf(exo).includes(String(solved.value)) && new Set(acceptedOf(exo)).size === acceptedOf(exo).length, `les réponses acceptées : ${acceptedOf(exo).join(" ; ")}`),
  );
};

const checkReply: Check = (exo) => {
  const text = textOf(exo);
  const marker = " Phrase réponse. ";
  const cut = text.indexOf(marker);
  if (cut < 0) return `phrase à trou inconnue : ${text}`;
  const solved = solve(text.slice(0, cut));
  if (!solved) return `énoncé inconnu : ${text}`;
  const { answer, options } = blankOf(exo);
  const own = numbersIn(text.slice(0, cut));
  return all(
    SEMANTIC(solved, levelOf(exo), REGRESSIVE.includes(solved.scenario)),
    ok(text.slice(cut + marker.length) === solved.reply, `la phrase réponse : « ${text.slice(cut + marker.length)} », pas « ${solved.reply} »`),
    ok(answer === fmt(solved.value), `${text} : ${answer}, pas ${fmt(solved.value)}`),
    ok(options.filter((option) => option !== answer).every((option) => /^\d+(?: \d{3})*$/.test(option) && num(option) !== solved.value && !own.includes(num(option))), `un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé : ${options.join(" ; ")}`),
  );
};

const checkFirst: Check = (exo) => {
  const m = /^(.*) Pour trouver (.+), que faut-il chercher en premier \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const goalPart = m[2];
  const candidates = ORDERED.map((scenario) => ({ scenario })).map(({ scenario }) => scenario);
  const probes: Record<string, string> = { recolte: "Combien de kilogrammes lui reste-t-il ?", partage: "Combien reste-t-il à chaque enfant ?", commerce: "Quel est son bénéfice ?" };
  const solved = candidates.map((scenario) => solve(`${m[1]} ${probes[scenario]}`)).find((result): result is Solved => result !== null);
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  const goodsMatch = /^\p{L}+ achète \d+ ([\p{L} ]+) à /u.exec(m[1]);
  const firstQuestion = solved.scenario === "recolte" ? "Combien de kilogrammes récolte-t-il en tout ?" : solved.scenario === "partage" ? "Combien reçoit chaque enfant ?" : `Combien coûtent les ${goodsMatch?.[1]} ?`;
  return all(
    SEMANTIC(solved, levelOf(exo), false),
    ok(ORDERED.includes(solved.scenario), `${solved.scenario} n'impose pas son premier calcul`),
    ok(goalPart === solved.goals, `« ${goalPart} », pas « ${solved.goals} »`),
    ok(rightOption(exo) === firstQuestion, `${exo.prompt} : ${rightOption(exo)}, pas ${firstQuestion}`),
    ok(wrongOf(exo).includes(solved.question) && wrongOf(exo).some((option) => option === "Quelle heure est-il ?" || option === "Quel temps fait-il ?"), `les mauvais choix : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkUseless: Check = (exo) => {
  const suffix = " Quelle donnée est inutile ?";
  if (!exo.prompt.endsWith(suffix)) return `énoncé inconnu : ${exo.prompt}`;
  const body = exo.prompt.slice(0, -suffix.length);
  // Une phrase en trop se trouve entre l'histoire et la question : on la retire pour relire le problème.
  const extras = [/ (\p{L}+|Le paysan|Le car) a (\d+) (ans|places)\./u, / Il fait chaud\./];
  let rebuilt = "";
  let tile = "";
  for (const pattern of extras) {
    const found = pattern.exec(body);
    if (found) {
      rebuilt = body.replace(found[0], "");
      tile = found[2] ? `${found[2]} ${found[3]}` : "Il fait chaud";
      break;
    }
  }
  const solved = rebuilt ? solve(rebuilt) : null;
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  const story = new Set(solved.numbers);
  return all(
    SEMANTIC(solved, levelOf(exo), false),
    ok(rightOption(exo) === tile, `${exo.prompt} : ${rightOption(exo)}, pas ${tile}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== tile && numbersIn(option).length > 0 && numbersIn(option).every((n) => story.has(n))), `les données utiles : ${wrongOf(exo).join(" ; ")}`),
    ok(!tile.match(/^\d+/) || !story.has(Number(tile.split(" ")[0])), "la donnée inutile est aussi un nombre du problème"),
  );
};

const STEPS: Record<string, string[]> = {
  recolte: ["Calcule la récolte totale", "Retire la quantité vendue", "Retire la quantité donnée"],
  partage: ["Partage la somme également", "Calcule la dépense de chaque enfant", "Retire la dépense à la part"],
  commerce: ["Calcule le prix d'achat", "Ajoute les frais de transport", "Retire le prix de revient au prix de vente"],
};

const checkOrder: Check = (exo) => {
  const suffix = " Mets les étapes dans le bon ordre.";
  if (!exo.prompt.endsWith(suffix)) return `énoncé inconnu : ${exo.prompt}`;
  const solved = solve(exo.prompt.slice(0, -suffix.length));
  if (!solved) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    SEMANTIC(solved, levelOf(exo), false),
    ok(ORDERED.includes(solved.scenario), `${solved.scenario} n'impose pas l'ordre de ses calculs`),
    ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(["Lis l'énoncé", ...STEPS[solved.scenario], "Vérifie la réponse"]), `les étapes : ${sequenceOf(exo).join(" ; ")}`),
  );
};

const checkLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  const scenarios = new Set<string>();
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const solved = solve(pair.left);
      if (!solved) return `énoncé inconnu : ${pair.left}`;
      scenarios.add(solved.scenario);
      return all(
        SEMANTIC(solved, levelOf(exo), false),
        ok(pair.right === solved.calc, `${pair.right} n'est pas le calcul de « ${pair.left} » (${solved.calc})`),
        ok(evaluate(pair.right) === solved.value, `${pair.right} ne vaut pas ${solved.value}`),
      );
    }),
    ok(scenarios.size === 3, "deux problèmes du même scénario"),
    ok(new Set(pairs.map((pair) => pair.right)).size === 3, "deux calculs égaux"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const forward = new Set<string>();
  const backward = new Set<string>();
  return all(
    ok(zones[0] === "Démarche progressive" && zones[1] === "Démarche régressive", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux problèmes par case"),
    ...items.map((item) => {
      const solved = solve(item.text);
      if (!solved) return `énoncé inconnu : ${item.text}`;
      (item.correctZone === zones[0] ? forward : backward).add(solved.scenario);
      const isBackward = REGRESSIVE.includes(solved.scenario);
      return all(SEMANTIC(solved, levelOf(exo), isBackward), ok(item.correctZone === (isBackward ? zones[1] : zones[0]), `${item.text} est rangé dans « ${item.correctZone} »`));
    }),
    ok(forward.size === 2 && backward.size === 2, "deux scénarios différents par case"),
  );
};

const checkVerify: Check = (exo) => {
  const m = /^(\p{L}+) calcule (.+) = (.+)\. Quel calcul permet de vérifier son résultat \?$/u.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  if (!(m[1] in SUBJECTS)) return `un prénom inconnu : ${m[1]}`;
  const left = m[2];
  const result = num(m[3]);
  const equation = left.match(new RegExp(`^(${N}) ([+−×÷]) (${N})$`));
  if (!equation) return `égalité inconnue : ${left}`;
  const [a, sign, b] = [num(equation[1]), equation[2], num(equation[3])];
  const value = sign === "+" ? a + b : sign === "−" ? a - b : sign === "×" ? a * b : a / b;
  const numbers = [a, b, result];
  // L'opération inverse retrouve un des nombres de départ : le test l'évalue.
  const finds = (option: string) => {
    try {
      return numbers.includes(evaluate(option));
    } catch {
      return false;
    }
  };
  return all(
    ok(value === result && Number.isInteger(result), `${left} ne vaut pas ${m[3]}`),
    ok(finds(rightOption(exo)), `${rightOption(exo)} ne retrouve aucun nombre de ${left}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !finds(option)), `un mauvais choix qui vérifie aussi : ${wrongOf(exo).join(" ; ")}`),
    ok(!numbers.some((n) => n <= 0), "un nombre nul ou négatif"),
  );
};

defineMathsTests({
  label: "des problèmes du CFEE au CM2",
  klass: "CM2",
  promptWords: 55,
  checks: {
    "cm2-pb-direct": checkForward,
    "cm2-pb-inverse": checkBackward,
    "cm2-pb-ecrire": checkWrite,
    "cm2-pb-question": checkFirst,
    "cm2-pb-utile": checkUseless,
    "cm2-pb-ordre": checkOrder,
    "cm2-pb-relier": checkLinks,
    "cm2-pb-glisser": checkSort,
    "cm2-pb-verifier": checkVerify,
    "cm2-pb-reponse": checkReply,
  },
  topicKinds: {
    "ma-cm2-problemes": ["cm2-pb-direct", "cm2-pb-inverse", "cm2-pb-ecrire", "cm2-pb-question", "cm2-pb-utile", "cm2-pb-ordre", "cm2-pb-relier", "cm2-pb-glisser", "cm2-pb-verifier", "cm2-pb-reponse"],
  },
});
