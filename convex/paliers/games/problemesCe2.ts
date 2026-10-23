/**
 * LES PROBLÈMES DU CE2 : des problèmes à deux ou trois opérations, la question intermédiaire, le calcul qui résout, la donnée inutile, vérifier sa réponse
 * (`ma-ce2-problemes`).
 *
 * La thématique n'avait aucun jeu de code. Le modèle écrivait des problèmes dont la réponse était fausse (le prix d'un lot, la monnaie rendue, un reste de
 * partage) ou dont l'énoncé donnait deux fois la réponse. Ici chaque problème est un SCÉNARIO fermé : le code tire des entiers, GARDE les étapes
 * intermédiaires et le calcul écrit, et en déduit la bonne réponse. Les mauvais choix sont les erreurs d'enfant (oublier le premier calcul, additionner au lieu de
 * multiplier, retirer au lieu d'ajouter, partager trop tôt). Une seule bonne réponse, jamais écrite à la main.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Huit scénarios : l'achat et la monnaie rendue, des paquets et des objets isolés, des billes perdues puis gagnées (en deux ou trois étapes), un partage puis
 *   un reste, un rangement par paniers, un trajet en car, les roues d'un garage. Les additions, soustractions, multiplications et divisions n'utilisent que des
 *   nombres entiers : une division tombe toujours juste, un reste ou une monnaie n'est jamais négatif.
 * - Les prix sont des multiples de vingt-cinq FCFA ; la monnaie se rend sur un billet de cinq cents, mille, deux mille, cinq mille ou dix mille FCFA.
 * - La question intermédiaire n'est demandée que pour des scénarios dont l'ordre des calculs est imposé par l'histoire : jamais pour les roues d'un garage, où
 *   les voitures et les motos peuvent se compter dans n'importe quel ordre. Pour la même raison, l'ordre des étapes ne se demande pas pour les roues.
 * - Une donnée inutile est un âge ou le temps qu'il fait : elle ne change jamais la réponse.
 * - Un calcul de vérification retrouve toujours un des nombres de départ ; aucun mauvais choix ne vaut un des nombres du calcul.
 * - Un énoncé n'a pas plus d'une apostrophe droite et ne dépasse pas vingt-huit mots. Aucun indice n'écrit un chiffre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, pronoun, type Child } from "./stories";
import { choiceGame, linkGame, sequenceGame, sortGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";

const show = (n: number) => formatNumber(n);
const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const rnd = (ctx: GameContext, [lo, hi]: readonly [number, number]) => randomInt(ctx.rng, lo, hi);

// ===========================================================================
// UN PROBLÈME
// ===========================================================================

export type ScenarioKey = "achat" | "paquets" | "billes" | "billes3" | "partage" | "rangement" | "route" | "roues";

/** Un mauvais calcul : son écriture et sa valeur (jamais celle du bon calcul). */
export type WrongCalc = { text: string; value: number };

export type Problem = {
  scenario: ScenarioKey;
  /** L'histoire, sans la question. */
  story: string;
  /** La question finale. */
  question: string;
  /** Ce qu'on cherche, en peu de mots : « la monnaie ». */
  goal: string;
  value: number;
  /** « FCFA », « billes », « km » : ce que le résultat compte. */
  unit: string;
  /** Le bon calcul, écrit : « 1 000 − 3 × 250 ». */
  calc: string;
  wrongCalcs: WrongCalc[];
  /** Les calculs intermédiaires, dans l'ordre : la question qu'ils posent, le geste qui les fait, leur résultat. La dernière est la question finale. */
  steps: { question: string; text: string; value: number }[];
  /** Des données qui servent. */
  useful: string[];
  /** Une donnée qui ne sert pas : la phrase qui l'écrit, et la tuile qui la nomme. */
  extra: { sentence: string; tile: string };
  /** Les erreurs d'enfant : des nombres qui ne valent pas le résultat. */
  pool: number[];
};

/** Le nombre d'opérations de chaque scénario, et si l'histoire impose l'ordre des calculs. */
export const OPERATIONS: Record<ScenarioKey, 2 | 3> = { achat: 2, paquets: 2, billes: 2, billes3: 3, partage: 2, rangement: 2, route: 2, roues: 3 };
export const ORDERED: Record<ScenarioKey, boolean> = { achat: true, paquets: true, billes: true, billes3: true, partage: true, rangement: true, route: true, roues: false };

export const SCENARIOS_BY_LEVEL: Record<GameLevel, readonly ScenarioKey[]> = {
  1: ["billes", "route", "paquets", "billes3", "roues"],
  2: ["achat", "paquets", "partage", "route", "billes3", "roues"],
  3: ["achat", "partage", "rangement", "route", "billes3", "roues"],
  4: ["achat", "paquets", "partage", "rangement", "route", "billes3", "roues"],
};

/** « Combien de billes », « Combien d'images » : « de » s'élide devant une voyelle ou un h muet (aucun nom des tableaux n'a de h aspiré). */
const combienDe = (noun: string): string => (/^[aeiouyàâéèêëîïôûùœh]/iu.test(noun) ? `Combien d'${noun}` : `Combien de ${noun}`);
const pickChild = (ctx: GameContext): Child => pickFresh(ctx, CHILDREN, (candidate) => `ce2-pb:enfant:${candidate.name}`);

const ageExtra = (ctx: GameContext, child: Child) => {
  const age = randomInt(ctx.rng, 7, 11);
  return { sentence: `${capital(pronoun(child))} a ${age} ans.`, tile: `${age} ans` };
};
const WEATHER_EXTRA = { sentence: "Il fait chaud.", tile: "Il fait chaud" };

/** Les mauvais calculs d'un tirage : ceux dont la valeur n'est pas celle du bon calcul. */
const wrongs = (result: number, list: readonly (readonly [string, number])[]): WrongCalc[] =>
  list.filter(([, value]) => Math.abs(value - result) > 1e-9).map(([text, value]) => ({ text, value }));

const BANKNOTES = [500, 1000, 2000, 5000, 10000] as const;
const GOODS = ["cahiers", "pains", "ballons", "règles", "mangues", "stylos"] as const;
const THINGS = ["billes", "images", "timbres", "jetons"] as const;
const BUNDLED = ["billes", "bonbons", "crayons", "mangues"] as const;
const EDIBLE = ["bonbons", "biscuits", "gâteaux", "beignets"] as const;
const CONTAINERS = [
  { many: "sacs", one: "sac" },
  { many: "boîtes", one: "boîte" },
  { many: "paniers", one: "panier" },
] as const;
const STOCKS = [
  { thing: "mangues", many: "paniers", one: "panier" },
  { thing: "oranges", many: "cageots", one: "cageot" },
  { thing: "œufs", many: "boîtes", one: "boîte" },
] as const;

const BUY_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [2, 3], 2: [2, 4], 3: [3, 6], 4: [3, 9] };
const BUY_PRICES: Record<GameLevel, readonly number[]> = { 1: [50, 100, 150, 200], 2: [100, 150, 200, 250], 3: [125, 175, 225, 350], 4: [175, 225, 275, 325, 425] };

function drawPurchase(ctx: GameContext): Problem {
  const child = pickChild(ctx);
  const good = pick(ctx.rng, GOODS);
  let n = 2;
  let p = 50;
  let pay = 500;
  for (let attempt = 0; attempt < 60; attempt++) {
    n = rnd(ctx, BUY_COUNT[ctx.level]);
    p = pick(ctx.rng, BUY_PRICES[ctx.level]);
    const larger = BANKNOTES.find((note) => note > n * p);
    if (larger !== undefined && larger - n * p >= 25 && !ctx.used.has(`ce2-pb:achat:${n}x${p}`)) {
      pay = larger;
      break;
    }
  }
  ctx.used.add(`ce2-pb:achat:${n}x${p}`);
  const total = n * p;
  const change = pay - total;
  const question = "Combien lui rend-on ?";
  return {
    scenario: "achat",
    story: `${child.name} achète ${n} ${good} à ${show(p)} FCFA pièce et paie ${show(pay)} FCFA.`,
    question,
    goal: "la monnaie",
    value: change,
    unit: "FCFA",
    calc: `${show(pay)} − ${n} × ${show(p)}`,
    wrongCalcs: wrongs(change, [
      [`${n} × ${show(p)} − ${show(pay)}`, total - pay],
      [`${show(pay)} − ${show(p)}`, pay - p],
      [`${show(pay)} + ${n} × ${show(p)}`, pay + total],
    ]),
    steps: [
      { question: `Combien coûtent les ${good} ?`, text: `Calcule le prix des ${good}`, value: total },
      { question, text: "Calcule la monnaie rendue", value: change },
    ],
    useful: [`${n} ${good}`, `${show(p)} FCFA la pièce`, `${show(pay)} FCFA donnés`],
    extra: ageExtra(ctx, child),
    pool: [total, pay - p, pay + total, change + 100, change - 100].filter((value) => value % 25 === 0),
  };
}

const BUNDLE_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 5], 3: [4, 8], 4: [5, 9] };
const BUNDLE_SIZE: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [4, 8], 3: [5, 9], 4: [6, 12] };
const BUNDLE_LOOSE: Record<GameLevel, readonly [number, number]> = { 1: [2, 9], 2: [3, 12], 3: [4, 20], 4: [7, 25] };

function drawBundles(ctx: GameContext): Problem {
  const thing = pick(ctx.rng, BUNDLED);
  const container = pick(ctx.rng, CONTAINERS);
  const n = rnd(ctx, BUNDLE_COUNT[ctx.level]);
  const m = rnd(ctx, BUNDLE_SIZE[ctx.level]);
  const x = rnd(ctx, BUNDLE_LOOSE[ctx.level]);
  const question = `${combienDe(thing)} en tout ?`;
  const value = n * m + x;
  return {
    scenario: "paquets",
    story: `Il y a ${n} ${container.many} de ${m} ${thing} et ${x} ${thing} à côté.`,
    question,
    goal: "le total",
    value,
    unit: thing,
    calc: `${n} × ${m} + ${x}`,
    wrongCalcs: wrongs(value, [
      [`${n} + ${m} + ${x}`, n + m + x],
      [`${n} × (${m} + ${x})`, n * (m + x)],
      [`${n} × ${m} × ${x}`, n * m * x],
    ]),
    steps: [
      { question: `${combienDe(thing)} y a-t-il dans les ${container.many} ?`, text: `Calcule les ${thing} des ${container.many}`, value: n * m },
      { question, text: `Ajoute les ${thing} à côté`, value },
    ],
    useful: [`${n} ${container.many}`, `${m} ${thing} par ${container.one}`, `${x} ${thing} à côté`],
    extra: WEATHER_EXTRA,
    pool: [n + m + x, n * (m + x), n * m, n * m - x, n * m + m],
  };
}

const START_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [15, 30], 2: [25, 60], 3: [40, 120], 4: [80, 250] };

function drawMarbles(ctx: GameContext): Problem {
  const child = pickChild(ctx);
  const thing = pick(ctx.rng, THINGS);
  const a = rnd(ctx, START_COUNT[ctx.level]);
  const b = randomInt(ctx.rng, 3, Math.floor(a / 3));
  const c = randomInt(ctx.rng, 3, Math.floor(a / 3));
  const pron = pronoun(child);
  const question = `Combien en a-t-${pron} maintenant ?`;
  const value = a - b + c;
  return {
    scenario: "billes",
    story: `${child.name} a ${a} ${thing}. ${capital(pron)} en perd ${b}, puis en gagne ${c}.`,
    question,
    goal: "le nombre final",
    value,
    unit: thing,
    calc: `${a} − ${b} + ${c}`,
    wrongCalcs: wrongs(value, [
      [`${a} + ${b} + ${c}`, a + b + c],
      [`${a} − ${b} − ${c}`, a - b - c],
      [`${a} + ${b} − ${c}`, a + b - c],
    ]),
    steps: [
      { question: `${combienDe(thing)} reste-t-il après la perte ?`, text: "Calcule ce qui reste après la perte", value: a - b },
      { question, text: "Ajoute ce qui est gagné", value },
    ],
    useful: [`${a} ${thing} au début`, `${b} ${thing} en moins`, `${c} ${thing} en plus`],
    extra: ageExtra(ctx, child),
    pool: [a + b + c, a - b - c, a + b - c, a - b, a + c],
  };
}

function drawMarblesThree(ctx: GameContext): Problem {
  const child = pickChild(ctx);
  const thing = pick(ctx.rng, THINGS);
  const a = rnd(ctx, START_COUNT[ctx.level]);
  const step = Math.max(3, Math.floor(a / 5));
  const b = randomInt(ctx.rng, 2, step);
  const c = randomInt(ctx.rng, 2, step);
  const d = randomInt(ctx.rng, 2, Math.min(step, a - b + c - 1));
  const pron = pronoun(child);
  const question = `Combien en a-t-${pron} maintenant ?`;
  const value = a - b + c - d;
  return {
    scenario: "billes3",
    story: `${child.name} a ${a} ${thing}. ${capital(pron)} en perd ${b}, en gagne ${c}, puis en donne ${d}.`,
    question,
    goal: "le nombre final",
    value,
    unit: thing,
    calc: `${a} − ${b} + ${c} − ${d}`,
    wrongCalcs: wrongs(value, [
      [`${a} + ${b} + ${c} + ${d}`, a + b + c + d],
      [`${a} − ${b} − ${c} − ${d}`, a - b - c - d],
      [`${a} − ${b} + ${c} + ${d}`, a - b + c + d],
    ]),
    steps: [
      { question: `${combienDe(thing)} reste-t-il après la perte ?`, text: "Calcule ce qui reste après la perte", value: a - b },
      { question: `${combienDe(thing)} y a-t-il après le gain ?`, text: "Ajoute ce qui est gagné", value: a - b + c },
      { question, text: "Retire ce qui est donné", value },
    ],
    useful: [`${a} ${thing} au début`, `${b} ${thing} en moins`, `${c} ${thing} en plus`, `${d} ${thing} donnés`],
    extra: ageExtra(ctx, child),
    pool: [a + b + c + d, a - b - c - d, a - b + c + d, a - b + c, a - b - d],
  };
}

const SHARE_KIDS: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 5], 3: [4, 8], 4: [6, 9] };
const SHARE_EACH: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [4, 8], 3: [6, 12], 4: [8, 15] };

function drawShare(ctx: GameContext): Problem {
  const thing = pick(ctx.rng, EDIBLE);
  const k = rnd(ctx, SHARE_KIDS[ctx.level]);
  const q = rnd(ctx, SHARE_EACH[ctx.level]);
  const e = randomInt(ctx.rng, 1, q - 2);
  const total = k * q;
  const question = "Combien en reste-t-il à chacun ?";
  const value = q - e;
  return {
    scenario: "partage",
    story: `${total} ${thing} sont partagés entre ${k} enfants. Chacun en mange ${e}.`,
    question,
    goal: "ce qui reste",
    value,
    unit: thing,
    calc: `${total} ÷ ${k} − ${e}`,
    wrongCalcs: wrongs(value, [
      [`${total} − ${k} − ${e}`, total - k - e],
      [`${total} − ${e} ÷ ${k}`, total - e / k],
      [`${total} × ${k} − ${e}`, total * k - e],
    ]),
    steps: [
      { question: `${combienDe(thing)} chacun reçoit-il ?`, text: `Partage les ${thing} entre les enfants`, value: q },
      { question, text: "Retire ce que chacun mange", value },
    ],
    useful: [`${total} ${thing}`, `${k} enfants`, `${e} ${thing} mangés`],
    extra: WEATHER_EXTRA,
    pool: [q, total - e, total - k - e, q + e, k + e],
  };
}

const BOX_SIZES = [4, 5, 6, 8, 10] as const;
const BOX_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [3, 5], 2: [4, 7], 3: [5, 9], 4: [8, 20] };

function drawStock(ctx: GameContext): Problem {
  const stock = pick(ctx.rng, STOCKS);
  const k = pick(ctx.rng, BOX_SIZES);
  const z = rnd(ctx, BOX_COUNT[ctx.level]);
  const total = z * k;
  const a = randomInt(ctx.rng, Math.floor(total / 3), Math.floor((2 * total) / 3));
  const b = total - a;
  const question = `${combienDe(stock.many)} remplit-il ?`;
  return {
    scenario: "rangement",
    story: `Un vendeur a ${a} ${stock.thing}, puis en reçoit ${b}. Il les range par ${stock.many} de ${k}.`,
    question,
    goal: `les ${stock.many}`,
    value: z,
    unit: stock.many,
    calc: `(${a} + ${b}) ÷ ${k}`,
    wrongCalcs: wrongs(z, [
      [`${a} + ${b} ÷ ${k}`, a + b / k],
      [`${a} + ${b} × ${k}`, a + b * k],
      [`(${a} + ${b}) × ${k}`, total * k],
    ]),
    steps: [
      { question: `${combienDe(stock.thing)} le vendeur a-t-il en tout ?`, text: `Additionne tous les ${stock.thing}`, value: total },
      { question, text: `Partage le total en ${stock.many}`, value: z },
    ],
    useful: [`${a} ${stock.thing} au début`, `${b} ${stock.thing} en plus`, `${k} ${stock.thing} par ${stock.one}`],
    extra: WEATHER_EXTRA,
    pool: [total, a, b, z + 1, z - 1],
  };
}

const TRIP_TOTAL: Record<GameLevel, readonly [number, number]> = { 1: [60, 100], 2: [120, 300], 3: [200, 500], 4: [300, 900] };

function drawTrip(ctx: GameContext): Problem {
  const t = rnd(ctx, TRIP_TOTAL[ctx.level]);
  const a = randomInt(ctx.rng, Math.ceil(t * 0.2), Math.floor(t * 0.4));
  const b = randomInt(ctx.rng, Math.ceil(t * 0.15), Math.floor(t * 0.3));
  const question = "Combien de kilomètres lui reste-t-il ?";
  const value = t - (a + b);
  return {
    scenario: "route",
    story: `Un car doit faire ${t} km. Il roule ${a} km, puis ${b} km.`,
    question,
    goal: "les kilomètres restants",
    value,
    unit: "km",
    calc: `${t} − (${a} + ${b})`,
    wrongCalcs: wrongs(value, [
      [`${t} − ${a} + ${b}`, t - a + b],
      [`${t} + ${a} + ${b}`, t + a + b],
      [`${a} + ${b} − ${t}`, a + b - t],
    ]),
    steps: [
      { question: "Combien de kilomètres a-t-il déjà faits ?", text: "Additionne les kilomètres déjà faits", value: a + b },
      { question, text: "Retire-les du trajet total", value },
    ],
    useful: [`${t} km à faire`, `${a} km d'abord`, `${b} km ensuite`],
    extra: WEATHER_EXTRA,
    pool: [t - a, t + a + b, a + b, t - a + b, t - b],
  };
}

const CARS: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 6], 3: [5, 9], 4: [8, 14] };
const BIKES: Record<GameLevel, readonly [number, number]> = { 1: [1, 3], 2: [2, 5], 3: [3, 8], 4: [5, 12] };

function drawWheels(ctx: GameContext): Problem {
  const n = rnd(ctx, CARS[ctx.level]);
  const m = rnd(ctx, BIKES[ctx.level]);
  const question = "Combien de roues en tout ?";
  const value = 4 * n + 2 * m;
  return {
    scenario: "roues",
    story: `Un garage a ${n} voitures et ${m} motos. Une voiture a 4 roues et une moto 2 roues.`,
    question,
    goal: "le nombre de roues",
    value,
    unit: "roues",
    calc: `${n} × 4 + ${m} × 2`,
    wrongCalcs: wrongs(value, [
      [`(${n} + ${m}) × 4`, (n + m) * 4],
      [`${n} × 4 + ${m}`, 4 * n + m],
      [`(${n} + ${m}) × 2`, (n + m) * 2],
      [`${n} + ${m} + 4 + 2`, n + m + 6],
    ]),
    steps: [
      { question: "Combien de roues ont les voitures ?", text: "Calcule les roues des voitures", value: 4 * n },
      { question: "Combien de roues ont les motos ?", text: "Calcule les roues des motos", value: 2 * m },
      { question, text: "Additionne les roues", value },
    ],
    useful: [`${n} voitures`, `${m} motos`, "4 roues par voiture", "2 roues par moto"],
    extra: WEATHER_EXTRA,
    pool: [(n + m) * 4, 4 * n + m, (n + m) * 2, 4 * n, 2 * m],
  };
}

const DRAW: Record<ScenarioKey, (ctx: GameContext) => Problem> = {
  achat: drawPurchase,
  paquets: drawBundles,
  billes: drawMarbles,
  billes3: drawMarblesThree,
  partage: drawShare,
  rangement: drawStock,
  route: drawTrip,
  roues: drawWheels,
};

/** Un scénario du palier qui va avec `keep`, pas encore posé dans ce palier. */
export function drawProblem(ctx: GameContext, keep: (scenario: ScenarioKey) => boolean = () => true, avoid: readonly ScenarioKey[] = []): Problem {
  const all = SCENARIOS_BY_LEVEL[ctx.level].filter(keep);
  const some = all.filter((scenario) => !avoid.includes(scenario));
  // Le scénario le moins posé dans ce palier : sans cela, trois scénarios à deux opérations se répartiraient mal entre sept gabarits.
  const posed = (scenario: ScenarioKey) => {
    let count = 0;
    while (ctx.used.has(`ce2-pb:scenario:${scenario}:${count}`)) count++;
    return count;
  };
  const candidates = some.length > 0 ? some : all;
  const fewest = Math.min(...candidates.map(posed));
  const scenario = pick(
    ctx.rng,
    candidates.filter((candidate) => posed(candidate) === fewest),
  );
  ctx.used.add(`ce2-pb:scenario:${scenario}:${posed(scenario)}`);
  // Une histoire (le scénario et ses nombres) ne se pose qu'une fois dans un palier, même sous deux jeux différents.
  let problem = DRAW[scenario](ctx);
  for (let attempt = 0; attempt < 30 && ctx.used.has(`ce2-pb:histoire:${problem.scenario}|${problem.calc}`); attempt++) problem = DRAW[scenario](ctx);
  ctx.used.add(`ce2-pb:histoire:${problem.scenario}|${problem.calc}`);
  return problem;
}

const answerOf = (problem: Problem) => `${show(problem.value)} ${problem.unit}`;

/** Les deux mauvais résultats : des nombres du même genre que la réponse (des multiples de vingt-cinq pour les prix). */
function wrongResults(ctx: GameContext, problem: Problem): string[] {
  const money = problem.unit === "FCFA";
  return wrongNumbersCe1(ctx, problem.value, problem.pool, money ? 25 : 1, money ? 20000 : 5000).map((value) => `${value} ${problem.unit}`);
}

const TWO_HINTS: Hints = [
  "Lis l'énoncé en entier et repère la question.",
  "Il faut deux calculs : le premier prépare le second.",
  "Écris le résultat du premier calcul avant de passer au second.",
];
const THREE_HINTS: Hints = [
  "Lis l'énoncé en entier et repère la question.",
  "Il faut trois calculs, l'un après l'autre.",
  "Écris chaque résultat avant de passer au calcul suivant.",
];
const hintsFor = (problem: Problem): Hints => (OPERATIONS[problem.scenario] === 3 ? THREE_HINTS : TWO_HINTS);

// ===========================================================================
// LE RÉSULTAT
// ===========================================================================

/** Un problème à deux opérations, le résultat parmi trois. */
export function makeCe2PbTwo(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-deux", "résoudre un problème à deux opérations", () => {
    const problem = drawProblem(ctx, (scenario) => OPERATIONS[scenario] === 2);
    return { prompt: `${problem.story} ${problem.question}`, answer: answerOf(problem), wrong: wrongResults(ctx, problem), hints: TWO_HINTS };
  });
}

/** Un problème à trois opérations (des billes perdues, gagnées, données ; les roues d'un garage), le résultat parmi trois. */
export function makeCe2PbThree(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-trois", "résoudre un problème à trois opérations", () => {
    const problem = drawProblem(ctx, (scenario) => OPERATIONS[scenario] === 3);
    return { prompt: `${problem.story} ${problem.question}`, answer: answerOf(problem), wrong: wrongResults(ctx, problem), hints: THREE_HINTS };
  });
}

/** Le même problème, une réponse courte : « Écris le nombre. ». */
export function makeCe2PbWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-pb-ecrire", () => {
    const problem = drawProblem(ctx);
    return {
      type: "short-answer",
      prompt: `${problem.story} ${problem.question} Écris le nombre.`,
      payload: { acceptedAnswers: [String(problem.value)], game: originOf("ce2-pb-ecrire", ctx), concept: "résoudre un problème en plusieurs étapes et écrire le résultat" },
      answerKey: String(problem.value),
      hints: [...hintsFor(problem)],
    };
  });
}

// ===========================================================================
// LA QUESTION INTERMÉDIAIRE, LE CALCUL, LA DONNÉE INUTILE
// ===========================================================================

const IRRELEVANT = ["Quelle heure est-il ?", "Quel temps fait-il ?"] as const;

/** « Pour trouver la monnaie, que faut-il chercher en premier ? » : la question intermédiaire, jamais la question finale. */
export function makeCe2PbFirst(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-question", "trouver la question intermédiaire d'un problème", () => {
    const problem = drawProblem(ctx, (scenario) => ORDERED[scenario]);
    return {
      prompt: `${problem.story} Pour trouver ${problem.goal}, que faut-il chercher en premier ?`,
      answer: problem.steps[0].question,
      wrong: [problem.question, pick(ctx.rng, IRRELEVANT)],
      hints: [
        "Lis l'énoncé en entier.",
        "La question finale ne peut pas se résoudre tout de suite.",
        "Cherche d'abord ce que l'énoncé ne donne pas et qui sert au calcul suivant.",
      ],
    };
  });
}

/** « Quel calcul donne la monnaie ? » : le bon calcul écrit en une ligne, et deux calculs qui n'ont pas la même valeur. */
export function makeCe2PbCalc(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-operation", "choisir le calcul qui résout un problème", () => {
    const problem = drawProblem(ctx, (scenario) => OPERATIONS[scenario] === 2 || scenario === "billes3");
    return {
      prompt: `${problem.story} Quel calcul donne ${problem.goal} ?`,
      answer: problem.calc,
      wrong: shuffle(ctx.rng, problem.wrongCalcs).map((wrong) => wrong.text),
      hints: [
        "Fais d'abord le calcul qui est entre parenthèses ou le premier de l'histoire.",
        "Une multiplication ou une division se fait avant une addition ou une soustraction.",
        "Essaie chaque calcul avec les nombres de l'énoncé.",
      ],
    };
  });
}

/** « Quelle donnée est inutile ? » : l'âge de l'enfant ou le temps qu'il fait, parmi deux données qui servent. */
export function makeCe2PbUseless(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-utile", "repérer la donnée qui ne sert pas", () => {
    const problem = drawProblem(ctx, (scenario) => scenario !== "roues");
    return {
      prompt: `${problem.story} ${problem.extra.sentence} ${problem.question} Quelle donnée est inutile ?`,
      answer: problem.extra.tile,
      wrong: shuffle(ctx.rng, problem.useful).slice(0, 2),
      hints: [
        "Relis la question, puis cherche ce dont tu as besoin pour y répondre.",
        "Une donnée utile entre dans un calcul.",
        "Une donnée inutile ne change pas la réponse.",
      ],
    };
  });
}

// ===========================================================================
// L'ORDRE DES ÉTAPES ET LES CALCULS À RELIER
// ===========================================================================

/** « Mets les étapes dans l'ordre. » : lire l'énoncé, les calculs dans l'ordre de l'histoire, vérifier. */
export function makeCe2PbOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce2-pb-ordre", "ranger les étapes pour résoudre un problème", () => {
    const problem = drawProblem(ctx, (scenario) => ORDERED[scenario]);
    return {
      prompt: `${problem.story} Mets les étapes dans l'ordre.`,
      sequence: ["Lis l'énoncé", ...problem.steps.map((step) => step.text), "Vérifie la réponse"],
      hints: ["Commence par lire, finis par vérifier.", "Le premier calcul prépare le deuxième.", "Chaque calcul se fait dans l'ordre de l'histoire."],
    };
  });
}

/** « Relie chaque problème à son calcul. » : trois scénarios différents du palier, tous les calculs différents. */
export function makeCe2PbLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-pb-relier", "relier un problème à son calcul", () => {
    const problems: Problem[] = [];
    for (let attempt = 0; attempt < 60 && problems.length < 3; attempt++) {
      const problem = drawProblem(ctx, (scenario) => OPERATIONS[scenario] === 2, problems.map((other) => other.scenario));
      if (problems.some((other) => other.scenario === problem.scenario || other.calc === problem.calc)) continue;
      problems.push(problem);
    }
    return {
      prompt: "Relie chaque problème à son calcul.",
      pairs: problems.map((problem) => ({ left: `${problem.story} ${problem.question}`, right: problem.calc })),
      hints: ["Repère les nombres de chaque problème.", "Pense à ce que l'histoire fait : ajouter, retirer, répéter ou partager.", "Chaque calcul va avec un seul problème."],
    };
  });
}

// ===========================================================================
// UNE OU DEUX OPÉRATIONS
// ===========================================================================

const ONE_FORMS = ["add", "sub", "mul", "div"] as const;
type OneForm = (typeof ONE_FORMS)[number];

const ONE_RANGE: Record<GameLevel, readonly [number, number]> = { 1: [12, 40], 2: [30, 90], 3: [60, 200], 4: [120, 400] };

/** Un problème à UNE seule opération, court, d'une des quatre formes. */
function oneStepTile(ctx: GameContext, form: OneForm): string {
  const child = pickChild(ctx);
  const a = rnd(ctx, ONE_RANGE[ctx.level]);
  const b = randomInt(ctx.rng, 3, Math.max(4, Math.floor(a / 3)));
  const small = randomInt(ctx.rng, 3, 9);
  const other = randomInt(ctx.rng, 3, 9);
  switch (form) {
    case "add":
      return `${child.name} a ${a} billes et en gagne ${b}. Combien en a-t-${pronoun(child)} ?`;
    case "sub":
      return `Il y a ${a} mangues. On en vend ${b}. Combien en reste-t-il ?`;
    case "mul":
      return `${small} paniers contiennent ${other} oranges chacun. Combien d'oranges en tout ?`;
    case "div":
      return `${small * other} crayons sont rangés dans ${small} boîtes égales. Combien de crayons dans chaque boîte ?`;
  }
}

/** « Glisse chaque problème dans la bonne case. » : une seule opération, ou deux (un des six scénarios à deux opérations). */
export function makeCe2PbSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce2-pb-glisser", "reconnaître un problème à une ou à deux opérations", () => {
    const wanted = ctx.level <= 2 ? { one: 2, two: 2 } : ctx.rng() < 0.5 ? { one: 2, two: 3 } : { one: 3, two: 2 };
    const forms = shuffle(ctx.rng, ONE_FORMS).slice(0, wanted.one);
    const ones = forms.map((form) => oneStepTile(ctx, form));
    const twos: Problem[] = [];
    for (let attempt = 0; attempt < 60 && twos.length < wanted.two; attempt++) {
      const problem = drawProblem(ctx, (scenario) => OPERATIONS[scenario] === 2, twos.map((other) => other.scenario));
      if (twos.some((other) => other.scenario === problem.scenario)) continue;
      twos.push(problem);
    }
    return {
      prompt: "Glisse chaque problème dans la bonne case.",
      zones: ["Un seul calcul", "Deux calculs"],
      items: [...ones.map((text) => ({ text, zone: "Un seul calcul" })), ...twos.map((problem) => ({ text: `${problem.story} ${problem.question}`, zone: "Deux calculs" }))],
      hints: ["Compte les calculs qu'il faut faire pour répondre.", "Si le résultat d'un calcul sert à un deuxième calcul, il y en a deux.", "Commence par le problème le plus court."],
    };
  });
}

// ===========================================================================
// VÉRIFIER SA RÉPONSE
// ===========================================================================

type Equation = { text: string; numbers: number[]; right: string; rightValue: number; wrong: [string, number][] };

const CHECK_FORMS: Record<GameLevel, readonly ("add" | "sub" | "mul" | "div")[]> = {
  1: ["add", "sub"],
  2: ["add", "sub"],
  3: ["mul", "sub"],
  4: ["mul", "div", "sub"],
};
const CHECK_A: Record<GameLevel, readonly [number, number]> = { 1: [20, 80], 2: [120, 450], 3: [150, 600], 4: [400, 900] };
const CHECK_B: Record<GameLevel, readonly [number, number]> = { 1: [10, 60], 2: [80, 380], 3: [60, 400], 4: [120, 380] };
const CHECK_FACTOR: Record<GameLevel, readonly [number, number]> = { 1: [2, 5], 2: [2, 6], 3: [12, 49], 4: [25, 99] };

function drawEquation(ctx: GameContext): Equation {
  const form = pick(ctx.rng, CHECK_FORMS[ctx.level]);
  if (form === "add") {
    const a = rnd(ctx, CHECK_A[ctx.level]);
    const b = rnd(ctx, CHECK_B[ctx.level]);
    const s = a + b;
    return {
      text: `${show(a)} + ${show(b)} = ${show(s)}`,
      numbers: [a, b, s],
      right: `${show(s)} − ${show(b)}`,
      rightValue: a,
      wrong: [[`${show(s)} + ${show(b)}`, s + b], [`${show(a)} − ${show(b)}`, a - b], [`${show(a)} + ${show(s)}`, a + s]],
    };
  }
  if (form === "sub") {
    const y = rnd(ctx, CHECK_B[ctx.level]);
    const x = y + rnd(ctx, CHECK_A[ctx.level]);
    const z = x - y;
    return {
      text: `${show(x)} − ${show(y)} = ${show(z)}`,
      numbers: [x, y, z],
      right: `${show(z)} + ${show(y)}`,
      rightValue: x,
      wrong: [[`${show(x)} + ${show(y)}`, x + y], [`${show(z)} − ${show(y)}`, z - y], [`${show(x)} + ${show(z)}`, x + z]],
    };
  }
  if (form === "mul") {
    const p = rnd(ctx, CHECK_FACTOR[ctx.level]);
    const q = randomInt(ctx.rng, 3, 9);
    const r = p * q;
    return {
      text: `${show(p)} × ${q} = ${show(r)}`,
      numbers: [p, q, r],
      right: `${show(r)} ÷ ${q}`,
      rightValue: p,
      wrong: [[`${show(r)} × ${q}`, r * q], [`${show(r)} − ${q}`, r - q], [`${show(p)} + ${q}`, p + q]],
    };
  }
  const p = rnd(ctx, CHECK_FACTOR[ctx.level]);
  const q = randomInt(ctx.rng, 3, 9);
  const x = p * q;
  return {
    text: `${show(x)} ÷ ${q} = ${show(p)}`,
    numbers: [x, q, p],
    right: `${show(p)} × ${q}`,
    rightValue: x,
    wrong: [[`${show(p)} + ${q}`, p + q], [`${show(x)} − ${q}`, x - q], [`${show(x)} × ${q}`, x * q]],
  };
}

/** « Awa calcule 134 + 58 = 192. Quel calcul permet de vérifier son résultat ? » : l'opération inverse, qui retrouve un des nombres de départ. */
export function makeCe2PbCheck(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-pb-verifier", "vérifier un résultat avec l'opération inverse", () => {
    const child = pickChild(ctx);
    let equation = drawEquation(ctx);
    // Aucun mauvais choix ne retrouve un des nombres de l'égalité (la soustraction « 192 − 134 » vérifierait aussi) : on retire ceux qui y tombent.
    for (let attempt = 0; attempt < 30 && equation.wrong.filter(([, value]) => !equation.numbers.includes(value)).length < 2; attempt++) equation = drawEquation(ctx);
    return {
      prompt: `${child.name} calcule ${equation.text}. Quel calcul permet de vérifier son résultat ?`,
      answer: equation.right,
      wrong: equation.wrong.filter(([, value]) => !equation.numbers.includes(value)).map(([text]) => text),
      hints: [
        "Vérifier, c'est refaire le calcul à l'envers.",
        "L'inverse d'une addition est une soustraction, et l'inverse d'une multiplication est une division.",
        "Le bon calcul retrouve un des nombres du début.",
      ],
    };
  });
}
