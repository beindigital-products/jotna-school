import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, NUMBER, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES PÉRIMÈTRES ET LES AIRES DU CM1 (`ma-cm1-perimetres-aires`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique : le périmètre est le double de la somme des deux côtés (additionnés un à un), l'aire un produit
 * compté en rangées, un côté retrouvé par essai, les unités d'aire par leur poids en centimètres carrés. Une aire s'écrit toujours avec son unité au carré. Le niveau
 * 2 est celui des paliers 2 et 3, le niveau 3 celui du palier 4, le niveau 4 celui du palier 5.
 */

const SIDE: Record<GameLevel, [number, number]> = { 1: [2, 9], 2: [5, 25], 3: [10, 40], 4: [12, 60] };
const LONG: Record<GameLevel, [number, number]> = { 1: [4, 9], 2: [6, 25], 3: [15, 40], 4: [20, 60] };
const WIDE: Record<GameLevel, [number, number]> = { 1: [2, 6], 2: [3, 18], 3: [8, 30], 4: [10, 45] };
const UNITS: Record<GameLevel, string[]> = { 1: ["cm"], 2: ["cm", "m"], 3: ["cm", "m"], 4: ["cm", "m"] };
const within = (n: number, [lo, hi]: [number, number]) => n >= lo && n <= hi;

/** Le périmètre compté côté par côté : longueur, largeur, longueur, largeur. */
const perimeter = (l: number, w: number) => l + w + l + w;
/** L'aire comptée en rangées : `w` rangées de `l` carrés. */
const area = (l: number, w: number) => {
  let total = 0;
  for (let row = 0; row < w; row++) total += l;
  return total;
};
const sq = (u: string) => `${u}²`;

const checkPerimeter: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Un carré mesure (\\d+) (cm|m) de côté\\. Quel est son périmètre \\?$`).exec(exo.prompt);
  let expected: number;
  let u: string;
  if (m) {
    const s = Number(m[1]);
    [u, expected] = [m[2], perimeter(s, s)];
    if (!within(s, SIDE[level])) return `côté ${s} hors du niveau ${level}`;
  } else if ((m = new RegExp(`^Un rectangle mesure (\\d+) (cm|m) de long et (\\d+) (cm|m) de large\\. Quel est son périmètre \\?$`).exec(exo.prompt))) {
    const [l, w] = [Number(m[1]), Number(m[3])];
    if (m[2] !== m[4]) return "deux unités dans le même énoncé";
    [u, expected] = [m[2], perimeter(l, w)];
    if (!(l > w && within(l, LONG[level]) && within(w, WIDE[level]))) return `${l} sur ${w} hors du niveau ${level}`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === `${fmtNum(expected)} ${u}`, `${exo.prompt} : ${rightOption(exo)}, pas ${expected} ${u}`),
    ok(wrongOf(exo).every((option) => option.endsWith(` ${u}`) && num(option.replace(` ${u}`, "")) !== expected), "un mauvais choix égal au périmètre ou sans la même unité"),
    ok(UNITS[level].includes(u), `l'unité ${u} au niveau ${level}`),
  );
};

const fmtNum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const checkArea: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Un carré mesure (\\d+) (cm|m) de côté\\. Quelle est son aire \\?$`).exec(exo.prompt);
  let expected: number;
  let u: string;
  if (m) {
    const s = Number(m[1]);
    [u, expected] = [m[2], area(s, s)];
    if (!within(s, SIDE[level])) return `côté ${s} hors du niveau ${level}`;
  } else if ((m = new RegExp(`^Un rectangle mesure (\\d+) (cm|m) de long et (\\d+) (cm|m) de large\\. Quelle est son aire \\?$`).exec(exo.prompt))) {
    const [l, w] = [Number(m[1]), Number(m[3])];
    if (m[2] !== m[4]) return "deux unités dans le même énoncé";
    [u, expected] = [m[2], area(l, w)];
    if (!(l > w && within(l, LONG[level]) && within(w, WIDE[level]))) return `${l} sur ${w} hors du niveau ${level}`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  const right = `${fmtNum(expected)} ${sq(u)}`;
  return all(
    ok(rightOption(exo) === right, `${exo.prompt} : ${rightOption(exo)}, pas ${right}`),
    ok(optionsOf(exo).filter((option) => option === right).length === 1, "deux fois la bonne réponse"),
    ok(wrongOf(exo).every((option) => option.endsWith(` ${u}`) || option.endsWith(` ${sq(u)}`)), "une autre unité que celle de l'énoncé"),
    ok(UNITS[level].includes(u), `l'unité ${u} au niveau ${level}`),
  );
};

const checkSide: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const answer = num(blankOf(exo).answer);
  const options = blankOf(exo).options.map(num);
  let m = new RegExp(`^Un carré a un périmètre de (${NUMBER}) (cm|m)\\. Son côté mesure ___ (cm|m)\\.$`).exec(text);
  let consistent: (candidate: number) => boolean;
  let form: string;
  if (m) {
    form = "carre-perimetre";
    consistent = (c) => perimeter(c, c) === num(m![1]);
  } else if ((m = new RegExp(`^Un carré a une aire de (${NUMBER}) (cm|m)²\\. Son côté mesure ___ (cm|m)\\.$`).exec(text))) {
    form = "carre-aire";
    consistent = (c) => area(c, c) === num(m![1]);
  } else if ((m = new RegExp(`^Un rectangle a un périmètre de (${NUMBER}) (cm|m) et une longueur de (\\d+) (cm|m)\\. Sa largeur mesure ___ (cm|m)\\.$`).exec(text))) {
    form = "rectangle-perimetre";
    const [p, l] = [num(m[1]), Number(m[3])];
    consistent = (c) => perimeter(l, c) === p && l > c;
  } else if ((m = new RegExp(`^Un rectangle a une aire de (${NUMBER}) (cm|m)² et une longueur de (\\d+) (cm|m)\\. Sa largeur mesure ___ (cm|m)\\.$`).exec(text))) {
    form = "rectangle-aire";
    const [a, l] = [num(m[1]), Number(m[3])];
    consistent = (c) => area(l, c) === a && l > c;
  } else return `phrase inconnue : ${text}`;
  const unit = m[2];
  const forms: Record<GameLevel, string[]> = {
    1: ["carre-perimetre"],
    2: ["carre-perimetre", "rectangle-perimetre", "rectangle-aire"],
    3: ["rectangle-perimetre", "rectangle-aire", "carre-aire"],
    4: ["rectangle-aire", "carre-aire", "rectangle-perimetre"],
  };
  return all(
    ok(consistent(answer), `${text} : ${answer} ne convient pas`),
    ok(options.filter(consistent).length === 1, `plusieurs choix conviennent : ${blankOf(exo).options.join(", ")}`),
    ok(forms[level].includes(form), `la forme ${form} au niveau ${level}`),
    ok(m[m.length - 1] === unit, "l'unité de la réponse n'est pas celle de l'énoncé"),
  );
};

const parseRect = (text: string) => {
  const m = /^(\d+) (cm|m) sur (\d+) (cm|m)$/.exec(text);
  return m && m[2] === m[4] ? { l: Number(m[1]), w: Number(m[3]), u: m[2] } : null;
};

const checkCompare: Check = (exo) => {
  const mp = /^Lequel de ces rectangles a (le plus grand|le plus petit) périmètre \?$/.exec(exo.prompt);
  const ma = /^Lequel de ces rectangles a (la plus grande|la plus petite) aire \?$/.exec(exo.prompt);
  if (!mp && !ma) return `énoncé inconnu : ${exo.prompt}`;
  const rects = optionsOf(exo).map(parseRect);
  if (rects.some((r) => r === null)) return `un rectangle illisible : ${optionsOf(exo).join(" / ")}`;
  const list = rects as { l: number; w: number; u: string }[];
  const value = (r: { l: number; w: number }) => (mp ? perimeter(r.l, r.w) : area(r.l, r.w));
  const values = list.map(value);
  const biggest = (mp ?? ma)![1].includes("grand");
  const expected = biggest ? Math.max(...values) : Math.min(...values);
  return all(
    ok(new Set(values).size === 3, "deux rectangles à égalité sur la grandeur demandée"),
    ok(value(parseRect(rightOption(exo))!) === expected, `${exo.prompt} ${optionsOf(exo).join(" / ")} : ${rightOption(exo)}`),
    ok(list.every((r) => r.l > r.w && r.w >= 2 && r.l <= 60 && r.u === list[0].u), "un rectangle hors de la plage"),
    ok(UNITS[levelOf(exo)].includes(list[0].u), `l'unité ${list[0].u} au niveau ${levelOf(exo)}`),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Un rectangle mesure (\d+) (cm|m) sur (\d+) (cm|m)\. Écris (son aire en (?:cm|m)²|son périmètre en (?:cm|m))\.$/.exec(exo.prompt);
  let l: number;
  let w: number;
  let what: string;
  let u: string;
  if (m) {
    [l, w, u, what] = [Number(m[1]), Number(m[3]), m[2], m[5]];
    if (!(l > w && within(l, LONG[level]) && within(w, WIDE[level]))) return `${l} sur ${w} hors du niveau ${level}`;
  } else if ((m = /^Un carré mesure (\d+) (cm|m) de côté\. Écris (son aire en (?:cm|m)²|son périmètre en (?:cm|m))\.$/.exec(exo.prompt))) {
    [l, w, u, what] = [Number(m[1]), Number(m[1]), m[2], m[3]];
    if (!within(l, SIDE[level])) return `côté ${l} hors du niveau ${level}`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  const wantsArea = what.includes("aire");
  const expected = wantsArea ? area(l, w) : perimeter(l, w);
  return all(
    ok(exo.answerKey === String(expected) && acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, `${exo.prompt} : ${exo.answerKey}, pas ${expected}`),
    ok(what.endsWith(wantsArea ? sq(u) : u), "l'unité demandée n'est pas celle de l'énoncé"),
  );
};

/** Les douze choses de l'unité d'aire, écrites à part : six petites en cm², six grandes en m². */
const SMALL = ["Un timbre", "Une carte postale", "Une page de cahier", "Un carreau de carrelage", "Une photo d'identité", "Une pièce de monnaie"];
const BIG = ["Une salle de classe", "Une cour de récréation", "Un terrain de basket", "Un jardin", "Un tapis de salon", "Un champ de mil"];

const checkUnit: Check = (exo) => {
  const m = /^(.+) a une aire qui se mesure en ___\.$/.exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const expected = SMALL.includes(m[1]) ? "cm²" : BIG.includes(m[1]) ? "m²" : null;
  if (!expected) return `une chose inconnue : ${m[1]}`;
  const options = blankOf(exo).options;
  const length = expected === "cm²" ? "cm" : "m";
  const other = expected === "cm²" ? "m²" : "cm²";
  return all(
    ok(blankOf(exo).answer === expected, `${m[1]} : ${blankOf(exo).answer}, pas ${expected}`),
    ok([...options].sort().join("|") === [expected, other, length].sort().join("|"), `les choix ne sont pas {${expected}, ${other}, ${length}} : ${options.join(", ")}`),
  );
};

const WEIGHT: Record<string, number> = { "m²": 10000, "dm²": 100, "cm²": 1 };
const PAIRS: Record<GameLevel, string[]> = {
  1: ["dm²>cm²"],
  2: ["m²>dm²", "dm²>cm²", "m²>cm²"],
  3: ["cm²>dm²", "dm²>m²", "m²>cm²"],
  4: ["cm²>m²", "m²>cm²", "dm²>cm²", "cm²>dm²"],
};

const checkConversion: Check = (exo) => {
  const m = new RegExp(`^(${NUMBER}) (m²|dm²|cm²) = ___ (m²|dm²|cm²)$`).exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const shown = num(m[1]);
  const total = shown * WEIGHT[m[2]];
  const answer = total / WEIGHT[m[3]];
  return all(
    ok(Number.isInteger(answer) && num(blankOf(exo).answer) === answer, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${answer}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || num(option) !== answer), "un mauvais choix égal à la réponse"),
    ok(PAIRS[levelOf(exo)].includes(`${m[2]}>${m[3]}`), `le passage ${m[2]} vers ${m[3]} au niveau ${levelOf(exo)}`),
    ok(shown >= 2, "un seul à convertir"),
  );
};

const checkLinks: Check = (exo) => {
  const m = /^Relie chaque rectangle à (son aire|son périmètre)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const wantsArea = m[1] === "son aire";
  const rows = pairsOf(exo).map((pair) => ({ rect: parseRect(pair.left), right: pair.right }));
  if (rows.some((row) => row.rect === null)) return "un rectangle illisible";
  return all(
    ok(rows.length === 3, "trois rectangles"),
    ok(rows.every((row) => row.right === (wantsArea ? `${fmtNum(area(row.rect!.l, row.rect!.w))} ${sq(row.rect!.u)}` : `${fmtNum(perimeter(row.rect!.l, row.rect!.w))} ${row.rect!.u}`)), `une valeur fausse : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(rows.map((row) => row.right)).size === 3, "deux rectangles de même valeur"),
    ok(rows.every((row) => row.rect!.l > row.rect!.w && within(row.rect!.l, LONG[levelOf(exo)]) && within(row.rect!.w, WIDE[levelOf(exo)])), "un rectangle hors du niveau"),
  );
};

const AROUND = ["Clôturer un jardin", "Border un parterre de fleurs", "Faire le tour d'un terrain", "Tendre une corde autour d'une piste", "Poser une plinthe autour d'une pièce", "Entourer une photo d'un cadre"];
const COVER = ["Carreler le sol d'une salle", "Peindre un mur", "Semer du gazon sur un terrain", "Couvrir un toit de tôle", "Recouvrir une table d'une nappe", "Cultiver un champ de maïs"];

const checkSort: Check = (exo) => {
  const [perimetre, aire] = zonesOf(exo);
  if (perimetre !== "Périmètre" || aire !== "Aire") return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const each = levelOf(exo) === 1 ? 2 : 3;
  const items = itemsOf(exo);
  const wrongPlace = items.find((item) => (AROUND.includes(item.text) ? perimetre : COVER.includes(item.text) ? aire : "?") !== item.correctZone);
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case`),
    ok(items.filter((item) => item.correctZone === perimetre).length === each && items.filter((item) => item.correctZone === aire).length === each, `${each} situations par case`),
  );
};

const checkProblem: Check = (exo) => {
  const level = levelOf(exo);
  const forms: Record<GameLevel, string[]> = {
    1: ["carre-tour"],
    2: ["carre-tour", "rectangle-tour", "salle"],
    3: ["grillage", "salle", "rectangle-tour"],
    4: ["grillage", "peinture", "salle"],
  };
  let m = /^Un jardin carré mesure (\d+) m de côté\. On pose une clôture tout autour\. Quelle longueur de clôture faut-il \?$/.exec(exo.prompt);
  let form: string;
  let expected: string;
  if (m) {
    form = "carre-tour";
    expected = `${fmtNum(perimeter(Number(m[1]), Number(m[1])))} m`;
    if (!within(Number(m[1]), SIDE[level])) return `côté ${m[1]} hors du niveau ${level}`;
  } else if ((m = /^Un champ rectangulaire mesure (\d+) m de long et (\d+) m de large\. Un enfant en fait le tour à pied\. Combien de mètres parcourt-il \?$/.exec(exo.prompt))) {
    form = "rectangle-tour";
    expected = `${fmtNum(perimeter(Number(m[1]), Number(m[2])))} m`;
  } else if ((m = /^Une salle rectangulaire mesure (\d+) m sur (\d+) m\. Quelle est la surface du sol à carreler \?$/.exec(exo.prompt))) {
    form = "salle";
    expected = `${fmtNum(area(Number(m[1]), Number(m[2])))} m²`;
  } else if ((m = new RegExp(`^Un jardin rectangulaire mesure (\\d+) m sur (\\d+) m\\. Le grillage coûte (${NUMBER}) FCFA le mètre\\. Combien coûte la clôture complète \\?$`).exec(exo.prompt))) {
    form = "grillage";
    expected = `${fmtNum(perimeter(Number(m[1]), Number(m[2])) * num(m[3]))} FCFA`;
    if (![250, 500, 750].includes(num(m[3]))) return `un prix inattendu : ${m[3]}`;
  } else if ((m = new RegExp(`^Un mur rectangulaire mesure (\\d+) m sur (\\d+) m\\. La peinture coûte (${NUMBER}) FCFA le mètre carré\\. Combien coûte la peinture du mur \\?$`).exec(exo.prompt))) {
    form = "peinture";
    expected = `${fmtNum(area(Number(m[1]), Number(m[2])) * num(m[3]))} FCFA`;
    if (![250, 500, 750].includes(num(m[3]))) return `un prix inattendu : ${m[3]}`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  if (m.length >= 3 && form !== "carre-tour" && !(Number(m[1]) > Number(m[2]))) return `${m[1]} sur ${m[2]} : la longueur n'est pas la plus grande`;
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(optionsOf(exo).filter((option) => option === expected).length === 1, "deux fois la bonne réponse"),
    ok(forms[level].includes(form), `la forme ${form} au niveau ${level}`),
  );
};

const TOPIC_KINDS = {
  "ma-cm1-perimetres-aires": ["perimetre", "aire", "cote", "comparer", "ecrire", "unite", "conversion", "relier", "glisser", "probleme"].map((k) => `cm1-per-${k}`),
};

defineMathsTests({
  label: "des périmètres et des aires du CM1",
  checks: {
    "cm1-per-perimetre": checkPerimeter,
    "cm1-per-aire": checkArea,
    "cm1-per-cote": checkSide,
    "cm1-per-comparer": checkCompare,
    "cm1-per-ecrire": checkWrite,
    "cm1-per-unite": checkUnit,
    "cm1-per-conversion": checkConversion,
    "cm1-per-relier": checkLinks,
    "cm1-per-glisser": checkSort,
    "cm1-per-probleme": checkProblem,
  },
  topicKinds: TOPIC_KINDS,
});

describe("les vérifications des périmètres et des aires voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("une aire sans son carré est refusée, le périmètre n'est pas la somme de deux côtés", () => {
    expect(checkArea(qcm("Un carré mesure 7 cm de côté. Quelle est son aire ?", ["49 cm²", "28 cm²", "49 cm"], 0, 1))).toBeNull();
    expect(checkArea(qcm("Un carré mesure 7 cm de côté. Quelle est son aire ?", ["49 cm²", "28 cm²", "49 cm"], 2, 1))).not.toBeNull();
    expect(checkPerimeter(qcm("Un rectangle mesure 12 cm de long et 5 cm de large. Quel est son périmètre ?", ["34 cm", "17 cm", "60 cm"], 0, 2))).toBeNull();
    expect(checkPerimeter(qcm("Un rectangle mesure 12 cm de long et 5 cm de large. Quel est son périmètre ?", ["34 cm", "17 cm", "60 cm"], 1, 2))).not.toBeNull();
  });

  it("deux rectangles de même aire n'ont pas le même périmètre : l'égalité sur la grandeur demandée est refusée", () => {
    expect(checkCompare(qcm("Lequel de ces rectangles a le plus grand périmètre ?", ["12 cm sur 2 cm", "8 cm sur 3 cm", "6 cm sur 4 cm"], 0, 3))).toBeNull();
    expect(checkCompare(qcm("Lequel de ces rectangles a le plus grand périmètre ?", ["12 cm sur 2 cm", "8 cm sur 3 cm", "6 cm sur 4 cm"], 2, 3))).not.toBeNull();
    expect(checkCompare(qcm("Lequel de ces rectangles a la plus grande aire ?", ["12 cm sur 2 cm", "8 cm sur 3 cm", "6 cm sur 4 cm"], 0, 3))).not.toBeNull();
  });

  it("un mètre carré vaut dix mille centimètres carrés, pas cent", () => {
    expect(checkConversion(gap("3 m² = ___ cm²", ["30 000", "300", "3 000"], "30 000", 3))).toBeNull();
    expect(checkConversion(gap("3 m² = ___ cm²", ["30 000", "300", "3 000"], "300", 3))).not.toBeNull();
    expect(checkConversion(gap("3 dm² = ___ cm²", ["300", "30", "3 000"], "300", 1))).toBeNull();
  });

  it("la largeur d'après l'aire : un seul choix convient", () => {
    expect(checkSide(gap("Un rectangle a une aire de 48 cm² et une longueur de 8 cm. Sa largeur mesure ___ cm.", ["6", "40", "7"], "6", 2))).toBeNull();
    expect(checkSide(gap("Un rectangle a une aire de 48 cm² et une longueur de 8 cm. Sa largeur mesure ___ cm.", ["6", "40", "7"], "7", 2))).not.toBeNull();
  });
});
