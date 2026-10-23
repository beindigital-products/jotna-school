import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { makeContext } from "../paliers/games/shared";
import { FIGURES, PHRASES, makeCm1FigCount } from "../paliers/games/figuresCm1";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES FIGURES DU CM1 (`ma-cm1-figures`, avec un dessin à reproduire).
 *
 * Ce fichier a son propre tableau de géométrie, écrit à part de `figuresCm1.ts` : pour chaque figure, ce qui est VRAI, ce qui est FAUX et ce qui est INCERTAIN (un triangle isocèle
 * peut avoir un angle droit, un parallélogramme peut être un rectangle). Une question n'a qu'une bonne figure parmi ses trois choix, et chaque mauvais choix échoue à coup sûr
 * sur une propriété demandée : jamais sur une propriété incertaine, qui ferait une seconde bonne réponse possible. Le niveau 2 est celui des paliers 2 et 3.
 */

const KEYS = [
  "quatre côtés",
  "trois côtés",
  "quatre angles droits",
  "un seul angle droit",
  "quatre côtés de même longueur",
  "trois côtés de même longueur",
  "exactement deux côtés de même longueur",
  "ses côtés opposés parallèles",
  "trois sommets",
  "quatre sommets",
  "ses côtés opposés de même longueur",
  "aucun angle droit",
  "aucun sommet",
  "se trace avec un compas",
] as const;
type Key = (typeof KEYS)[number];
type Truth = "T" | "F" | "?";

/** Une figure : ce qui est vrai, ce qui est incertain, tout le reste est faux. */
function figure(isTrue: readonly Key[], unsure: readonly Key[] = []): Record<Key, Truth> {
  return Object.fromEntries(KEYS.map((key) => [key, isTrue.includes(key) ? "T" : unsure.includes(key) ? "?" : "F"])) as Record<Key, Truth>;
}

const TABLE: Record<string, Record<Key, Truth>> = {
  Carré: figure(["quatre côtés", "quatre angles droits", "quatre côtés de même longueur", "ses côtés opposés parallèles", "quatre sommets", "ses côtés opposés de même longueur"]),
  Rectangle: figure(["quatre côtés", "quatre angles droits", "ses côtés opposés parallèles", "quatre sommets", "ses côtés opposés de même longueur"], ["quatre côtés de même longueur"]),
  Parallélogramme: figure(["quatre côtés", "ses côtés opposés parallèles", "quatre sommets", "ses côtés opposés de même longueur"], ["quatre côtés de même longueur", "quatre angles droits", "un seul angle droit", "aucun angle droit"]),
  "Triangle équilatéral": figure(["trois côtés", "trois côtés de même longueur", "trois sommets", "aucun angle droit"]),
  "Triangle isocèle": figure(["trois côtés", "exactement deux côtés de même longueur", "trois sommets"], ["aucun angle droit", "un seul angle droit", "trois côtés de même longueur"]),
  "Triangle rectangle": figure(["trois côtés", "un seul angle droit", "trois sommets"], ["exactement deux côtés de même longueur"]),
  Cercle: figure(["aucun sommet", "se trace avec un compas", "aucun angle droit"]),
};
const NAME_OF_NOUN: Record<string, string> = Object.fromEntries(Object.keys(TABLE).map((name) => [name[0].toLowerCase() + name.slice(1), name]));

/** Les propriétés d'une phrase : « a quatre côtés et n'a aucun angle droit » donne [quatre côtés, aucun angle droit]. */
function keysOf(sentence: string): Key[] | null {
  const start = sentence.startsWith("n'a ") ? sentence.slice(4) : sentence.startsWith("a ") ? sentence.slice(2) : sentence;
  const parts = start.split(" et ").map((part) => (part.startsWith("n'a ") ? part.slice(4) : part));
  return parts.every((part) => (KEYS as readonly string[]).includes(part)) ? (parts as Key[]) : null;
}

const satisfies = (name: string, keys: readonly Key[]) => keys.every((key) => TABLE[name][key] === "T");
const failsSurely = (name: string, keys: readonly Key[]) => keys.some((key) => TABLE[name][key] === "F");

/** Une seule figure a toutes les propriétés ; chaque autre choix échoue à coup sûr sur l'une d'elles. */
function singleAnswer(names: string[], keys: Key[], answer: string): string | null {
  const matching = names.filter((name) => satisfies(name, keys));
  return all(
    ok(names.every((name) => name in TABLE) && new Set(names).size === 3, `des figures inconnues ou en double : ${names.join(", ")}`),
    ok(matching.length === 1 && matching[0] === answer, `${matching.length} figures ont toutes les propriétés (${keys.join(", ")}) parmi ${names.join(", ")} ; réponse ${answer}`),
    ok(names.filter((name) => name !== answer).every((name) => failsSurely(name, keys)), `un mauvais choix incertain ou juste : ${names.join(", ")}`),
  );
}

const checkFigure: Check = (exo) => {
  const m = /^Quelle figure (.+) \?$/.exec(exo.prompt);
  const keys = m ? keysOf(m[1]) : null;
  if (!keys) return `énoncé inconnu : ${exo.prompt}`;
  return all(singleAnswer(optionsOf(exo), keys, rightOption(exo)), ok(keys.length <= 2, "plus de deux propriétés"), ok(levelOf(exo) > 1 || keys.length === 1, "deux propriétés au premier palier"));
};

const checkGap: Check = (exo) => {
  const m = /^Un ___ (.+)\.$/.exec(textOf(exo));
  const keys = m ? keysOf(m[1]) : null;
  if (!keys) return `phrase inconnue : ${textOf(exo)}`;
  const names = blankOf(exo).options.map((noun) => NAME_OF_NOUN[noun]);
  return all(
    ok(names.every((name) => name !== undefined), `un nom inconnu : ${blankOf(exo).options.join(", ")}`),
    singleAnswer(names, keys, NAME_OF_NOUN[blankOf(exo).answer]),
    ok(levelOf(exo) > 1 || keys.length === 1, "deux propriétés au premier palier"),
  );
};

/** Les douze questions sur les droites, écrites à part. */
const LINES: Record<string, string> = {
  "Dans un carré, deux côtés qui se font face sont des droites comment ?": "Parallèles",
  "Dans un carré, deux côtés qui se suivent sont des droites comment ?": "Perpendiculaires",
  "Les lignes d'une page de cahier sont des droites comment ?": "Parallèles",
  "Dans un rectangle, deux côtés qui se suivent sont des droites comment ?": "Perpendiculaires",
  "Dans un rectangle, deux côtés qui se font face sont des droites comment ?": "Parallèles",
  "Deux rails d'une voie ferrée droite sont des droites comment ?": "Parallèles",
  "Dans un triangle rectangle, les deux côtés de l'angle droit sont des droites comment ?": "Perpendiculaires",
  "Le bord du haut et le bord de côté d'une feuille sont des droites comment ?": "Perpendiculaires",
  "Dans un parallélogramme, deux côtés qui se font face sont des droites comment ?": "Parallèles",
  "Dans un parallélogramme sans angle droit, deux côtés qui se suivent sont des droites comment ?": "Ni l'un ni l'autre",
  "Dans un triangle équilatéral, deux côtés qui se suivent sont des droites comment ?": "Ni l'un ni l'autre",
  "Le mur et le sol d'une pièce forment un coin droit. Ce sont des droites comment ?": "Perpendiculaires",
};

const checkLines: Check = (exo) => {
  const expected = LINES[exo.prompt];
  if (!expected) return `question inconnue : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok([...optionsOf(exo)].sort().join("|") === ["Parallèles", "Perpendiculaires", "Ni l'un ni l'autre"].sort().join("|"), `les trois choix ne sont pas les trois relations : ${optionsOf(exo).join(", ")}`),
  );
};

/** Les quinze tâches de l'instrument, écrites à part. */
const TOOLS: Record<string, string> = {
  "tracer un segment bien droit": "Règle",
  "tracer un cercle": "Compas",
  "vérifier qu'un angle est droit": "Équerre",
  "mesurer la longueur d'un côté": "Règle",
  "tracer deux droites perpendiculaires": "Équerre",
  "tracer un arc de cercle": "Compas",
  "relier deux points par une droite": "Règle",
  "construire un angle droit": "Équerre",
  "reporter une longueur sur une droite": "Compas",
  "tracer le rayon d'un cercle": "Règle",
  "contrôler les coins d'un carré": "Équerre",
  "placer des points à la même distance d'un point": "Compas",
  "mesurer le diamètre d'un cercle tracé": "Règle",
  "vérifier les angles d'un rectangle": "Équerre",
  "dessiner un cercle de centre donné": "Compas",
};

const checkTool: Check = (exo) => {
  const m = /^Quel instrument faut-il pour (.+) \?$/.exec(exo.prompt);
  const expected = m ? TOOLS[m[1]] : undefined;
  if (!expected) return `tâche inconnue : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok([...optionsOf(exo)].sort().join("|") === ["Règle", "Équerre", "Compas"].sort().join("|"), "les trois choix ne sont pas les trois instruments"),
  );
};

/** Ce qu'on compte, par figure : côtés, sommets, angles droits (`null` : incertain), paires de côtés parallèles. */
const COUNTS: Record<string, Record<string, number | null>> = {
  carré: { côtés: 4, sommets: 4, "angles droits": 4, "paires de côtés parallèles": 2 },
  rectangle: { côtés: 4, sommets: 4, "angles droits": 4, "paires de côtés parallèles": 2 },
  parallélogramme: { côtés: 4, sommets: 4, "angles droits": null, "paires de côtés parallèles": 2 },
  "triangle équilatéral": { côtés: 3, sommets: 3, "angles droits": 0, "paires de côtés parallèles": 0 },
  "triangle isocèle": { côtés: 3, sommets: 3, "angles droits": null, "paires de côtés parallèles": 0 },
  "triangle rectangle": { côtés: 3, sommets: 3, "angles droits": 1, "paires de côtés parallèles": 0 },
  cercle: { côtés: 0, sommets: 0, "angles droits": 0, "paires de côtés parallèles": 0 },
};
const COUNT_PROMPT = /^Combien (?:de |d')(côtés|sommets|angles droits|paires de côtés parallèles) a un (.+)$/;

const checkCount: Check = (exo) => {
  const m = COUNT_PROMPT.exec(exo.prompt.replace(/ \?$/, ""));
  const expected = m ? COUNTS[m[2]]?.[m[1]] : undefined;
  if (expected === undefined || expected === null) return `comptage inconnu ou incertain : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === String(expected), `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => /^\d$/.test(option) && Number(option) !== expected), "un mauvais choix égal à la réponse"),
  );
};

const RADIUS: Record<GameLevel, [number, number]> = { 1: [2, 9], 2: [3, 25], 3: [10, 50], 4: [12, 90] };
const within = (n: number, [lo, hi]: [number, number]) => n >= lo && n <= hi;

const checkRadius: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Un cercle a un rayon de (\d+) (cm|m)\. Son diamètre mesure ___ (cm|m)\.$/.exec(textOf(exo));
  let expected: number;
  let r: number;
  if (m) {
    r = Number(m[1]);
    expected = r + r;
  } else if ((m = /^Un cercle a un diamètre de ([\d ]+) (cm|m)\. Son rayon mesure ___ (cm|m)\.$/.exec(textOf(exo)))) {
    const d = num(m[1]);
    if (d % 2 !== 0) return `un diamètre impair : ${d}`;
    expected = d / 2;
    r = expected;
  } else return `phrase inconnue : ${textOf(exo)}`;
  return all(
    ok(num(blankOf(exo).answer) === expected, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${expected}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || num(option) !== expected), "un mauvais choix égal à la réponse"),
    ok(m[2] === m[3], "deux unités dans la même phrase"),
    ok(within(r, RADIUS[level]), `un rayon de ${r} hors du niveau ${level}`),
    ok(level >= 2 || m[2] === "cm", "des mètres au premier palier"),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Un cercle a un rayon de (\d+) (cm|m)\. Écris son diamètre en (cm|m)\.$/.exec(exo.prompt);
  let expected: number;
  if (m) {
    expected = Number(m[1]) * 2;
    if (!within(Number(m[1]), RADIUS[level]) || m[2] !== m[3]) return `rayon hors du niveau ${level} ou deux unités`;
  } else if ((m = /^Un cercle a un diamètre de ([\d ]+) (cm|m)\. Écris son rayon en (cm|m)\.$/.exec(exo.prompt))) {
    if (num(m[1]) % 2 !== 0) return `un diamètre impair : ${m[1]}`;
    expected = num(m[1]) / 2;
    if (!within(expected, RADIUS[level]) || m[2] !== m[3]) return `rayon hors du niveau ${level} ou deux unités`;
  } else if ((m = COUNT_PROMPT.exec(exo.prompt.replace(/ \? Écris le nombre\.$/, "")))) {
    const count = COUNTS[m[2]]?.[m[1]];
    if (count === undefined || count === null) return `comptage inconnu ou incertain : ${exo.prompt}`;
    expected = count;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return ok(exo.answerKey === String(expected) && acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, `${exo.prompt} : ${exo.answerKey}, pas ${expected}`);
};

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque figure à sa description.") return `énoncé inconnu : ${exo.prompt}`;
  const rows = pairsOf(exo).map((pair) => {
    const m = /^Il (.+)$/.exec(pair.right);
    return { name: pair.left, keys: m ? keysOf(m[1]) : null };
  });
  if (rows.some((row) => !(row.name in TABLE) || row.keys === null || row.keys.length !== 1)) return `une paire illisible : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`;
  const names = rows.map((row) => row.name);
  return all(
    ok(rows.length === 3 && new Set(names).size === 3 && new Set(pairsOf(exo).map((pair) => pair.right)).size === 3, "trois figures et trois descriptions différentes"),
    ok(rows.every((row) => satisfies(row.name, row.keys!)), `une description fausse : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(rows.every((row) => names.filter((name) => name !== row.name).every((other) => failsSurely(other, row.keys!))), "une description qui va aussi à une autre figure, ou peut-être"),
  );
};

/** Les trois classements, écrits à part. */
const CLASSES: Record<string, { yes: string[]; no: string[] }> = {
  "Quatre côtés|Trois côtés": { yes: ["Carré", "Rectangle", "Parallélogramme"], no: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle"] },
  "A des côtés parallèles|N'a pas de côtés parallèles": { yes: ["Carré", "Rectangle", "Parallélogramme"], no: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle", "Cercle"] },
  "Triangles|Quadrilatères": { yes: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle"], no: ["Carré", "Rectangle", "Parallélogramme"] },
};

const checkSort: Check = (exo) => {
  const [yesZone, noZone] = zonesOf(exo);
  const classification = CLASSES[`${yesZone}|${noZone}`];
  if (!classification) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const each = levelOf(exo) === 1 ? 2 : 3;
  const items = itemsOf(exo);
  const wrongPlace = items.find((item) => !(item.correctZone === yesZone ? classification.yes : classification.no).includes(item.text));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case`),
    ok(items.filter((item) => item.correctZone === yesZone).length === each && items.filter((item) => item.correctZone === noZone).length === each, `${each} figures par case`),
  );
};

/** Les comptages qu'un palier ne pose jamais deux fois. */
function asked(exo: Exo): string[] | null {
  const kind = (exo.payload.game as { kind: string }).kind;
  if (kind === "cm1-fig-compter") return [exo.prompt.replace(/ \?$/, "")];
  if (kind === "cm1-fig-ecrire" && exo.prompt.startsWith("Combien")) return [exo.prompt.replace(/ \? Écris le nombre\.$/, "")];
  return null;
}

const TOPIC_KINDS = {
  "ma-cm1-figures": ["pixel-copie", ...["figure", "droites", "outil", "compter", "rayon", "trou", "ecrire", "relier", "glisser"].map((k) => `cm1-fig-${k}`)],
};

defineMathsTests({
  label: "des figures du CM1",
  checks: {
    "cm1-fig-figure": checkFigure,
    "cm1-fig-droites": checkLines,
    "cm1-fig-outil": checkTool,
    "cm1-fig-compter": checkCount,
    "cm1-fig-rayon": checkRadius,
    "cm1-fig-trou": checkGap,
    "cm1-fig-ecrire": checkWrite,
    "cm1-fig-relier": checkLinks,
    "cm1-fig-glisser": checkSort,
  },
  topicKinds: TOPIC_KINDS,
  extraKinds: ["pixel-copie"],
  asked,
});

describe("les vérifications des figures voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("le carré et le rectangle ne se proposent jamais ensemble sous « quatre angles droits »", () => {
    expect(checkFigure(qcm("Quelle figure a quatre angles droits et quatre côtés de même longueur ?", ["Carré", "Triangle équilatéral", "Cercle"], 0, 3))).toBeNull();
    expect(checkFigure(qcm("Quelle figure a quatre angles droits ?", ["Carré", "Rectangle", "Cercle"], 0, 2))).not.toBeNull();
    // Un rectangle peut avoir quatre côtés égaux (c'est alors un carré) : il n'est jamais un mauvais choix pour « quatre côtés de même longueur ».
    expect(checkFigure(qcm("Quelle figure a quatre angles droits et quatre côtés de même longueur ?", ["Rectangle", "Carré", "Cercle"], 1, 3))).not.toBeNull();
  });

  it("une figure incertaine n'est pas un mauvais choix : un isocèle peut avoir un angle droit, un parallélogramme peut être un rectangle", () => {
    expect(checkFigure(qcm("Quelle figure a un seul angle droit ?", ["Triangle rectangle", "Carré", "Cercle"], 0, 2))).toBeNull();
    expect(checkFigure(qcm("Quelle figure a un seul angle droit ?", ["Triangle rectangle", "Triangle isocèle", "Cercle"], 0, 2))).not.toBeNull();
    expect(checkFigure(qcm("Quelle figure a trois côtés de même longueur ?", ["Triangle équilatéral", "Triangle isocèle", "Cercle"], 0, 2))).not.toBeNull();
    expect(checkGap(gap("Un ___ a trois côtés et exactement deux côtés de même longueur.", ["triangle isocèle", "carré", "cercle"], "triangle isocèle", 3))).toBeNull();
    expect(checkGap(gap("Un ___ a trois côtés et exactement deux côtés de même longueur.", ["triangle isocèle", "triangle rectangle", "cercle"], "triangle isocèle", 3))).not.toBeNull();
  });

  it("le diamètre est le double du rayon, pas le rayon", () => {
    expect(checkRadius(gap("Un cercle a un rayon de 6 cm. Son diamètre mesure ___ cm.", ["12", "6", "3"], "12", 1))).toBeNull();
    expect(checkRadius(gap("Un cercle a un rayon de 6 cm. Son diamètre mesure ___ cm.", ["12", "6", "3"], "6", 1))).not.toBeNull();
    expect(checkCount(qcm("Combien de sommets a un cercle ?", ["0", "1", "2"], 0, 1))).toBeNull();
    expect(checkCount(qcm("Combien de sommets a un cercle ?", ["0", "1", "2"], 1, 1))).not.toBeNull();
  });
});

describe("le tableau des figures du code s'accorde avec celui du test", () => {
  const keyOfId = (id: string) => keysOf(PHRASES[id as keyof typeof PHRASES])?.[0] as Key;

  it("chaque figure a exactement les propriétés vraies et incertaines du tableau écrit à part", () => {
    for (const figure of FIGURES) {
      const row = TABLE[figure.name];
      expect(row, figure.name).toBeDefined();
      const isTrue = KEYS.filter((key) => row[key] === "T").sort();
      const unsure = KEYS.filter((key) => row[key] === "?").sort();
      // Les propriétés « compas » et « aucun sommet » ne passent pas par une phrase en « a » : keysOf les lit aussi.
      expect(figure.has.map(keyOfId).sort(), `${figure.name} : propriétés vraies`).toEqual(isTrue);
      expect(figure.unsure.map(keyOfId).sort(), `${figure.name} : propriétés incertaines`).toEqual(unsure);
    }
  });

  it("les questions de comptage de deux paliers différents ne se recoupent pas", () => {
    const seen = new Map<number, Set<string>>();
    for (const palier of [1, 2, 3, 4, 5]) {
      const prompts = new Set<string>();
      for (let n = 0; n < 60; n++) {
        const game = makeCm1FigCount(makeContext("CM1", palier <= 1 ? 1 : palier <= 3 ? 2 : palier === 4 ? 3 : 4, `compte:${palier}:${n}`, new Set(), undefined, undefined, { index: palier, count: 5 })) as unknown as Exo;
        prompts.add(game.prompt);
      }
      seen.set(palier, prompts);
    }
    for (const a of [1, 2, 3, 4, 5]) {
      for (const b of [1, 2, 3, 4, 5]) {
        if (a >= b) continue;
        const shared = [...(seen.get(a) as Set<string>)].filter((prompt) => (seen.get(b) as Set<string>).has(prompt));
        expect(shared, `paliers ${a} et ${b}`).toEqual([]);
      }
    }
  });
});
