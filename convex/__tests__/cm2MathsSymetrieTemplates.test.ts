import { all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * SYMÉTRIE ET TRANSLATION AU CM2 (`ma-cm2-symetrie`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique et ses propres tableaux, écrits à part : le symétrique de la colonne `p` par rapport à la colonne `a`
 * est `2a - p` (et inversement), une translation ajoute ses déplacements aux coordonnées, la somme des arêtes d'un cube est douze fois son arête et celle d'un
 * pavé droit quatre fois la somme de ses dimensions. Les axes des figures se lisent dans un tableau fermé. Le niveau 2 réunit les paliers 2 et 3, le niveau 3 est le
 * palier 4, le niveau 4 le palier 5. Les trois dessins `pixel-symetrie` de la thématique ne sont pas des gabarits : ils passent par `extraKinds`.
 */

const WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six"];
const PHRASES = ["aucun axe", "1 axe", "2 axes", "3 axes", "4 axes", "5 axes", "6 axes"];

/** Les figures de l'énoncé (« un carré ») et leur nombre d'axes, écrits à part des sources. */
const BY_PROMPT: Record<string, number> = {
  "un carré": 4,
  "un rectangle de 6 cm sur 4 cm": 2,
  "un triangle équilatéral": 3,
  "un losange sans angle droit": 2,
  "un triangle qui a deux côtés égaux et un troisième plus long": 1,
  "un parallélogramme sans angle droit": 0,
  "un triangle aux trois côtés inégaux": 0,
  "un pentagone régulier": 5,
  "un hexagone régulier": 6,
  "la lettre H": 2,
  "la lettre X": 2,
  "la lettre A": 1,
  "la lettre T": 1,
  "la lettre M": 1,
  "la lettre F": 0,
  "la lettre R": 0,
  "la lettre Z": 0,
  "la lettre N": 0,
};
/** Les mêmes figures sur une tuile (« Un carré »). */
const BY_TILE: Record<string, number> = {
  "Un carré": 4,
  "Un rectangle de 6 cm sur 4 cm": 2,
  "Un triangle équilatéral": 3,
  "Un losange sans angle droit": 2,
  "Un triangle à deux côtés égaux": 1,
  "Un parallélogramme sans angle droit": 0,
  "Un triangle aux trois côtés inégaux": 0,
  "Un pentagone régulier": 5,
  "Un hexagone régulier": 6,
  "La lettre H": 2,
  "La lettre X": 2,
  "La lettre A": 1,
  "La lettre T": 1,
  "La lettre M": 1,
  "La lettre F": 0,
  "La lettre R": 0,
  "La lettre Z": 0,
  "La lettre N": 0,
};
const LETTERS = ["La lettre H", "La lettre X", "La lettre A", "La lettre T", "La lettre M", "La lettre F", "La lettre R", "La lettre Z", "La lettre N"];
const SIMPLE = ["Un carré", "Un rectangle de 6 cm sur 4 cm", "Un triangle équilatéral", "Un parallélogramme sans angle droit", "Un triangle aux trois côtés inégaux"];
const MORE = [...SIMPLE, "Un losange sans angle droit", "Un triangle à deux côtés égaux"];
/** Les figures de chaque niveau (tuiles) : le niveau 2 réunit les paliers 2 et 3, qui servent les lettres au palier 3. */
const TILES_BY_LEVEL: Record<GameLevel, readonly string[]> = {
  1: SIMPLE,
  2: [...MORE, ...LETTERS],
  3: [...MORE, ...LETTERS, "Un pentagone régulier", "Un hexagone régulier"],
  4: [...MORE, ...LETTERS, "Un pentagone régulier", "Un hexagone régulier"],
};
const tileOfPrompt = (phrase: string) => (phrase === "un triangle qui a deux côtés égaux et un troisième plus long" ? "Un triangle à deux côtés égaux" : phrase.replace(/^un /, "Un ").replace(/^la /, "La "));

const checkAxis: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Combien d'axes de symétrie a (.+) \?$/.exec(exo.prompt);
  if (!m || !(m[1] in BY_PROMPT)) return `énoncé inconnu : ${exo.prompt}`;
  const axes = BY_PROMPT[m[1]];
  const written = WORDS.filter((word) => word !== "un" && new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "u").test(exo.prompt));
  return all(
    ok(TILES_BY_LEVEL[level].includes(tileOfPrompt(m[1])), `${m[1]} au niveau ${level}`),
    ok(rightOption(exo) === WORDS[axes], `${exo.prompt} : ${rightOption(exo)}, pas ${WORDS[axes]}`),
    ok(wrongOf(exo).every((option) => WORDS.includes(option) && option !== WORDS[axes] && !written.includes(option)), `un mauvais choix égal à la bonne réponse ou écrit dans l'énoncé : ${wrongOf(exo).join(" ; ")}`),
  );
};

const MIRROR: Record<GameLevel, { axis: [number, number]; far: number }> = { 1: { axis: [3, 8], far: 4 }, 2: { axis: [4, 15], far: 8 }, 3: { axis: [7, 18], far: 10 }, 4: { axis: [8, 20], far: 12 } };

const checkMirror: Check = (exo) => {
  const level = levelOf(exo);
  const forward = /^Sur un quadrillage, A est dans la (colonne|ligne) (\d+) et l'axe de symétrie est la \1 (\d+)\. Dans quelle \1 est son symétrique B \?$/.exec(exo.prompt);
  const inverse = /^Sur un quadrillage, B est dans la (colonne|ligne) (\d+)\. Il est le symétrique de A par rapport à la \1 (\d+)\. Dans quelle \1 est A \?$/.exec(exo.prompt);
  const m = forward ?? inverse;
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const given = Number(m[2]);
  const axis = Number(m[3]);
  // Le symétrique d'un nombre `p` par rapport à `a` est `2a - p`, dans un sens comme dans l'autre.
  const answer = 2 * axis - given;
  const distance = Math.abs(axis - given);
  const range = MIRROR[level];
  return all(
    ok(axis >= range.axis[0] && axis <= range.axis[1] && distance >= 1 && distance <= range.far, `l'axe ${axis} et la distance ${distance} au niveau ${level}`),
    ok(answer >= 1 && answer <= 30 && given >= 1 && given <= 30, "un nombre hors du quadrillage"),
    ok(level > 1 || (m[1] === "colonne" && !inverse && given < axis), "le premier palier ne sert que des colonnes, le point à gauche de l'axe, sans question inverse"),
    ok(level >= 3 || !inverse, "la question inverse avant le palier 4"),
    ok(rightOption(exo) === String(answer), `${exo.prompt} : ${rightOption(exo)}, pas ${answer}`),
    ok(wrongOf(exo).every((option) => num(option) >= 1 && num(option) <= 40 && num(option) !== answer && num(option) !== given && num(option) !== axis), `un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé : ${wrongOf(exo).join(" ; ")}`),
  );
};

const MOVES: Record<GameLevel, { start: [number, number]; move: [number, number] }> = {
  1: { start: [1, 8], move: [1, 6] },
  2: { start: [1, 9], move: [1, 8] },
  3: { start: [3, 14], move: [1, 9] },
  4: { start: [4, 20], move: [1, 12] },
};
const POINT = /^\((\d+) ; (\d+)\)$/;

const checkShift: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Le point A\((\d+) ; (\d+)\) est translaté (.+)\. Quelles sont ses nouvelles coordonnées \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [x, y] = [Number(m[1]), Number(m[2])];
  const moves = /^de (\d+) (?:carreaux )?vers (la droite|la gauche|le haut|le bas)(?: et de (\d+) vers (le haut|le bas))?$/.exec(m[3]);
  if (!moves) return `déplacements inconnus : ${m[3]}`;
  const sign = (word: string) => (word === "la droite" || word === "le haut" ? 1 : -1);
  const first = Number(moves[1]) * sign(moves[2]);
  const horizontal = moves[2] === "la droite" || moves[2] === "la gauche";
  const dx = horizontal ? first : 0;
  const dy = horizontal ? (moves[3] ? Number(moves[3]) * sign(moves[4]) : 0) : first;
  const [nx, ny] = [x + dx, y + dy];
  const range = MOVES[level];
  const size = [Math.abs(dx), Math.abs(dy)].filter((n) => n > 0);
  const wrongs = wrongOf(exo);
  return all(
    ok(x >= range.start[0] && x <= range.start[1] && y >= range.start[0] && y <= range.start[1], `le départ (${x} ; ${y}) au niveau ${level}`),
    ok(size.length >= 1 && size.every((n) => n >= range.move[0] && n <= range.move[1]), `un déplacement hors de la plage du niveau ${level}`),
    ok(level !== 1 || (dx > 0 && dy === 0), "le premier palier ne sert qu'un déplacement vers la droite"),
    ok(level > 2 || (dx >= 0 && dy >= 0), "un déplacement vers la gauche ou vers le bas avant le palier 4"),
    ok(!moves[3] || horizontal, "un second déplacement après un déplacement vertical"),
    ok(nx >= 0 && ny >= 0, "des coordonnées négatives"),
    ok(rightOption(exo) === `(${nx} ; ${ny})`, `${exo.prompt} : ${rightOption(exo)}, pas (${nx} ; ${ny})`),
    ok(wrongs.every((option) => POINT.test(option) && option !== `(${nx} ; ${ny})` && option !== `(${x} ; ${y})`), `un mauvais choix égal à la bonne réponse ou au point de départ : ${wrongs.join(" ; ")}`),
  );
};

const COUNTS: Record<string, number> = { "un cube|faces": 6, "un cube|arêtes": 12, "un cube|sommets": 8, "un pavé droit|faces": 6, "un pavé droit|arêtes": 12, "un pavé droit|sommets": 8, "un cylindre|sommets": 0 };

const checkSolid: Check = (exo) => {
  const level = levelOf(exo);
  const count = /^Combien (d'arêtes|de faces|de sommets) a (un cube|un pavé droit|un cylindre) \?$/.exec(exo.prompt);
  if (count) {
    const part = count[1] === "d'arêtes" ? "arêtes" : count[1].replace("de ", "");
    const key = `${count[2]}|${part}`;
    if (!(key in COUNTS)) return `un solide et une partie qu'on ne compte pas : ${key}`;
    return all(
      ok(level > 1 || count[2] !== "un cylindre", "le cylindre au premier palier"),
      ok(rightOption(exo) === String(COUNTS[key]), `${exo.prompt} : ${rightOption(exo)}, pas ${COUNTS[key]}`),
      ok(wrongOf(exo).every((option) => /^\d+$/.test(option) && Number(option) !== COUNTS[key]), `un mauvais choix égal à la bonne réponse : ${wrongOf(exo).join(" ; ")}`),
    );
  }
  const cube = /^Un cube a une arête de (\d+) cm\. Quelle est la somme des longueurs de toutes ses arêtes \?$/.exec(exo.prompt);
  const box = /^Un pavé droit mesure (\d+) cm sur (\d+) cm sur (\d+) cm\. Quelle est la somme des longueurs de toutes ses arêtes \?$/.exec(exo.prompt);
  if (!cube && !box) return `énoncé inconnu : ${exo.prompt}`;
  const dims = cube ? [Number(cube[1])] : [Number(box![1]), Number(box![2]), Number(box![3])];
  const total = cube ? 12 * dims[0] : 4 * (dims[0] + dims[1] + dims[2]);
  return all(
    ok(level >= 2, "une somme d'arêtes au premier palier"),
    ok(cube ? dims[0] >= 2 && dims[0] <= (level === 2 ? 9 : 15) : level >= 3 && dims.every((d) => d >= 2 && d <= 13) && dims[0] >= dims[1] && dims[1] >= dims[2] && dims[0] !== dims[2], `${dims.join(" sur ")} au niveau ${level}`),
    ok(rightOption(exo) === `${total} cm`.replace(/\B(?=(\d{3})+(?!\d))/g, " "), `${exo.prompt} : ${rightOption(exo)}, pas ${total} cm`),
    ok(wrongOf(exo).every((option) => /^\d+(?: \d{3})* cm$/.test(option) && num(option.replace(" cm", "")) !== total && !dims.includes(num(option.replace(" cm", ""))) && num(option.replace(" cm", "")) <= total * 3), `un mauvais choix égal à la bonne réponse, à une dimension ou trop grand : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkGap: Check = (exo) => {
  const level = levelOf(exo);
  const text = textOf(exo);
  const { answer, options } = blankOf(exo);
  const axis = /^Sur un quadrillage, A est dans la colonne (\d+) et son symétrique B dans la colonne (\d+)\. L'axe de symétrie est la colonne ___\.$/.exec(text);
  const near = /^Un point est à (\d+) carreaux de la ligne de symétrie\. Son symétrique est à ___ carreaux de cette ligne\.$/.exec(text);
  const wrongNums = options.filter((option) => option !== answer).map(num);
  if (axis) {
    const [a, b] = [Number(axis[1]), Number(axis[2])];
    return all(
      ok(a < b && (a + b) % 2 === 0, "deux colonnes qui n'ont pas d'axe entier"),
      ok(b <= 30, "une colonne hors du quadrillage"),
      ok(num(answer) === (a + b) / 2, `${text} : ${answer}, pas ${(a + b) / 2}`),
      ok(!wrongNums.some((n) => n === num(answer) || n === a || n === b), `un mauvais choix égal à la bonne réponse ou à un nombre du texte : ${options.join(" ; ")}`),
    );
  }
  if (near) {
    const distance = Number(near[1]);
    return all(
      ok(level <= 2 && distance >= 2, `la distance ${distance} au niveau ${level}`),
      ok(num(answer) === distance, `${text} : ${answer}, pas ${distance}`),
      ok(!wrongNums.some((n) => n === distance), `un mauvais choix égal à la bonne réponse : ${options.join(" ; ")}`),
    );
  }
  return `phrase à trou inconnue : ${text}`;
};

const checkLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => ok(pair.left in BY_TILE && PHRASES[BY_TILE[pair.left]] === pair.right && TILES_BY_LEVEL[level].includes(pair.left), `${pair.left} est relié à « ${pair.right} » au niveau ${level}`)),
    ok(new Set(pairs.map((pair) => pair.right)).size === 3, "deux figures du même nombre d'axes"),
  );
};

const checkSort: Check = (exo) => {
  const level = levelOf(exo);
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Au moins un axe" && zones[1] === "Aucun axe", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux figures par case"),
    ...items.map((item) => ok(item.text in BY_TILE && TILES_BY_LEVEL[level].includes(item.text) && item.correctZone === (BY_TILE[item.text] > 0 ? zones[0] : zones[1]), `${item.text} est rangé dans « ${item.correctZone} » au niveau ${level}`)),
  );
};

defineMathsTests({
  label: "de la symétrie et de la translation du CM2",
  klass: "CM2",
  checks: {
    "cm2-sym-axe": checkAxis,
    "cm2-sym-miroir": checkMirror,
    "cm2-sym-translation": checkShift,
    "cm2-sym-solide": checkSolid,
    "cm2-sym-trou": checkGap,
    "cm2-sym-relier": checkLinks,
    "cm2-sym-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-symetrie": ["pixel-symetrie", "cm2-sym-axe", "cm2-sym-miroir", "cm2-sym-translation", "cm2-sym-solide", "cm2-sym-trou", "cm2-sym-relier", "cm2-sym-glisser"],
  },
  extraKinds: ["pixel-symetrie"],
});
