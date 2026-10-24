/**
 * LES PROBLÈMES DU CFEE AU CM2 (`ma-cm2-problemes`) : des problèmes de trois ou quatre calculs, une question intermédiaire, la démarche progressive (on suit
 * l'histoire) et la démarche régressive (on connaît la fin et on cherche le début), la donnée inutile, le calcul qui résout, la phrase réponse, la vérification.
 *
 * La thématique n'avait aucun jeu de code. Chaque problème est un SCÉNARIO fermé : le code tire des entiers, GARDE les étapes intermédiaires et le calcul écrit, et
 * en déduit la bonne réponse. Les mauvais choix sont les erreurs d'enfant (oublier un calcul, ajouter au lieu de retirer, partager trop tôt, ne pas remonter
 * l'histoire). Une seule bonne réponse, jamais écrite à la main.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Cinq scénarios de démarche progressive : un achat de deux sortes d'objets avec la monnaie rendue (quatre calculs), une récolte d'arachide vendue puis donnée
 *   (trois), une somme partagée puis dépensée (trois), un trajet en car en deux étapes (quatre), un achat revendu avec des frais de transport (trois).
 *   Trois scénarios de démarche régressive : de l'argent dépensé puis reçu, un stock de sacs vendu puis reçu, des mangues dont on vend la moitié puis quelques-unes.
 * - Les prix sont des multiples de vingt-cinq FCFA ; la monnaie se rend sur un billet de deux mille, cinq mille, dix mille ou vingt mille FCFA. Les prix unitaires
 *   restent plausibles (un pagne de deux mille à cinq mille FCFA) ; ce sont les quantités qui grandissent d'un palier à l'autre.
 * - Les calculs n'utilisent que des entiers : une division tombe toujours juste, un reste, une monnaie ou un stock n'est jamais négatif.
 * - La question intermédiaire ne se demande que pour les scénarios dont le premier calcul est imposé par l'histoire : jamais pour l'achat de deux sortes d'objets ni
 *   pour le trajet en deux étapes, où l'on peut commencer par l'un ou l'autre. Pour la même raison, l'ordre des étapes ne se demande pas pour eux.
 * - Une donnée inutile est un âge, une place ou le temps qu'il fait : elle ne change jamais la réponse. Un calcul de vérification retrouve toujours un des nombres.
 * - Un énoncé a au plus une apostrophe droite, aucun « : », et ses prénoms commencent par une consonne pour que « il » et « elle » s'accordent sans élision.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame, type Hints } from "./tableaux";
import { show, stepOf, type Step } from "./cm1MathsOutils";

// ===========================================================================
// UN PROBLÈME
// ===========================================================================

export type ScenarioKey = "achat" | "recolte" | "partage" | "route" | "commerce" | "argent" | "stock" | "mangues";

export const PROGRESSIVE: readonly ScenarioKey[] = ["achat", "recolte", "partage", "route", "commerce"];
export const REGRESSIVE: readonly ScenarioKey[] = ["argent", "stock", "mangues"];

export type Problem = {
  scenario: ScenarioKey;
  /** L'histoire, sans la question. */
  story: string;
  /** La question finale. */
  question: string;
  /** Ce qu'on cherche, en peu de mots : « la monnaie rendue ». */
  goal: string;
  value: number;
  /** « FCFA », « kg », « km » ou « » pour des sacs ou des mangues. */
  unit: string;
  /** Le bon calcul, écrit en une ligne. */
  calc: string;
  /** Les calculs intermédiaires dans l'ordre : la question qu'ils posent, le geste qui les fait, leur résultat. */
  steps: { question: string; text: string; value: number }[];
  /** Des données qui servent. */
  useful: string[];
  /** Une donnée qui ne sert pas : la phrase qui l'écrit et la tuile qui la nomme. */
  extra: { sentence: string; tile: string };
  /** Les erreurs d'enfant : des nombres qui ne valent pas le résultat. */
  pool: number[];
  /** La phrase réponse, avec un trou. */
  reply: string;
};

/** Le nombre de calculs de chaque scénario, et si l'histoire impose le premier calcul. */
export const OPERATIONS: Record<ScenarioKey, 3 | 4> = { achat: 4, recolte: 3, partage: 3, route: 4, commerce: 3, argent: 3, stock: 3, mangues: 3 };
export const ORDERED: Record<ScenarioKey, boolean> = { achat: false, recolte: true, partage: true, route: false, commerce: true, argent: false, stock: false, mangues: false };

const PROGRESSIVE_BY_STEP: Record<Step, readonly ScenarioKey[]> = {
  1: ["recolte", "partage", "commerce"],
  2: ["recolte", "partage", "commerce", "achat"],
  3: PROGRESSIVE,
  4: PROGRESSIVE,
  5: PROGRESSIVE,
};
const REGRESSIVE_BY_STEP: Record<Step, readonly ScenarioKey[]> = { 1: ["argent", "stock"], 2: REGRESSIVE, 3: REGRESSIVE, 4: REGRESSIVE, 5: REGRESSIVE };

type Person = { name: string; pronoun: "il" | "elle" };
const PEOPLE: readonly Person[] = [
  { name: "Moussa", pronoun: "il" },
  { name: "Fatou", pronoun: "elle" },
  { name: "Modou", pronoun: "il" },
  { name: "Binta", pronoun: "elle" },
  { name: "Sidy", pronoun: "il" },
  { name: "Khady", pronoun: "elle" },
  { name: "Cheikh", pronoun: "il" },
  { name: "Mariama", pronoun: "elle" },
];
const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const rnd = (ctx: GameContext, [lo, hi]: readonly [number, number]) => randomInt(ctx.rng, lo, hi);
const fcfa = (n: number) => `${show(n)} FCFA`;
const ageExtra = (ctx: GameContext, subject: string, lo: number, hi: number) => {
  const age = randomInt(ctx.rng, lo, hi);
  return { sentence: `${subject} a ${age} ans.`, tile: `${age} ans` };
};
/** Un problème de plus de cinq nombres écrits : on garde les tuiles d'un problème lisibles. */
const numbersIn = (text: string) => (text.match(/\d+(?: \d{3})*/g) ?? []).map((token) => Number(token.replace(/ /g, "")));

// ---------------------------------------------------------------------------
// L'achat de deux sortes d'objets (quatre calculs)
// ---------------------------------------------------------------------------

const BUY_ITEMS = [
  { many: "cahiers", prices: [100, 150, 200, 250, 300] },
  { many: "stylos", prices: [50, 100, 150, 200] },
  { many: "règles", prices: [100, 150, 200] },
  { many: "ballons", prices: [500, 750, 1000, 1500] },
  { many: "crayons", prices: [25, 50, 75, 100] },
] as const;
const BUY_COUNT: Record<Step, readonly [number, number]> = { 1: [2, 4], 2: [3, 6], 3: [4, 9], 4: [5, 12], 5: [6, 15] };
const NOTES = [2000, 5000, 10000, 20000, 50000] as const;

function drawPurchase(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  const person = pick(ctx.rng, PEOPLE);
  for (let attempt = 0; attempt < 200; attempt++) {
    const [a, b] = shuffle(ctx.rng, [...BUY_ITEMS]).slice(0, 2);
    const n = rnd(ctx, BUY_COUNT[step]);
    const m = rnd(ctx, BUY_COUNT[step]);
    const pa = pick(ctx.rng, a.prices);
    const pb = pick(ctx.rng, b.prices);
    const first = n * pa;
    const second = m * pb;
    const total = first + second;
    const note = NOTES.find((candidate) => candidate >= total + 100);
    if (note === undefined || note - total < 100 || total < 500) continue;
    const change = note - total;
    return {
      scenario: "achat",
      story: `${person.name} achète ${n} ${a.many} à ${fcfa(pa)} pièce et ${m} ${b.many} à ${fcfa(pb)} pièce. ${capital(person.pronoun)} paie avec ${fcfa(note)}.`,
      question: "Combien lui rend-on ?",
      goal: "la monnaie rendue",
      value: change,
      unit: "FCFA",
      calc: `${show(note)} − (${n} × ${show(pa)} + ${m} × ${show(pb)})`,
      steps: [
        { question: `Combien coûtent les ${a.many} ?`, text: `Calcule le prix des ${a.many}`, value: first },
        { question: `Combien coûtent les ${b.many} ?`, text: `Calcule le prix des ${b.many}`, value: second },
        { question: "Quel est le prix total ?", text: "Additionne les deux prix", value: total },
        { question: "Combien lui rend-on ?", text: "Calcule la monnaie rendue", value: change },
      ],
      useful: [`${n} ${a.many} à ${show(pa)} FCFA`, `${m} ${b.many} à ${show(pb)} FCFA`, `${show(note)} FCFA donnés`],
      extra: ageExtra(ctx, person.name, 9, 14),
      pool: [total, note - first, note - n * pb - second, note + total, change + 500, change - 500, first + pb, note - (n + m) * pa],
      reply: "On lui rend ___ FCFA.",
    };
  }
  throw new Error("achat : aucun tirage");
}

// ---------------------------------------------------------------------------
// La récolte d'arachide (trois calculs)
// ---------------------------------------------------------------------------

const HARVEST_DAILY: Record<Step, readonly number[]> = { 1: [20, 30, 40, 50], 2: [40, 60, 80, 120], 3: [60, 120, 150, 250], 4: [120, 250, 300, 450], 5: [250, 350, 500, 750] };
const HARVEST_DAYS: Record<Step, readonly [number, number]> = { 1: [3, 5], 2: [4, 6], 3: [5, 8], 4: [6, 10], 5: [8, 12] };

function drawHarvest(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  for (let attempt = 0; attempt < 200; attempt++) {
    const daily = pick(ctx.rng, HARVEST_DAILY[step]);
    const days = rnd(ctx, HARVEST_DAYS[step]);
    const total = daily * days;
    const sold = Math.round((total * (0.2 + ctx.rng() * 0.2)) / 10) * 10;
    const given = Math.round((total * (0.05 + ctx.rng() * 0.1)) / 10) * 10;
    const rest = total - sold - given;
    if (sold < 10 || given < 10 || rest < 10) continue;
    return {
      scenario: "recolte",
      story: `Un paysan récolte ${show(daily)} kg d'arachide par jour pendant ${days} jours. Il en vend ${show(sold)} kg, puis en donne ${show(given)} kg à son frère.`,
      question: "Combien de kilogrammes lui reste-t-il ?",
      goal: "la quantité qui lui reste",
      value: rest,
      unit: "kg",
      calc: `${show(daily)} × ${days} − ${show(sold)} − ${show(given)}`,
      steps: [
        { question: "Combien de kilogrammes récolte-t-il en tout ?", text: "Calcule la récolte totale", value: total },
        { question: "Combien lui en reste-t-il après la vente ?", text: "Retire la quantité vendue", value: total - sold },
        { question: "Combien de kilogrammes lui reste-t-il ?", text: "Retire la quantité donnée", value: rest },
      ],
      useful: [`${show(daily)} kg par jour`, `${days} jours`, `${show(sold)} kg vendus`, `${show(given)} kg donnés`],
      extra: ageExtra(ctx, "Le paysan", 30, 65),
      pool: [total - sold, total, daily * days + sold + given, daily + days - sold - given, total - sold + given, rest + 10, rest - 10],
      reply: "Il lui reste ___ kg.",
    };
  }
  throw new Error("récolte : aucun tirage");
}

// ---------------------------------------------------------------------------
// Une somme partagée puis dépensée (trois calculs)
// ---------------------------------------------------------------------------

const SHARE_EACH: Record<Step, readonly number[]> = { 1: [1000, 1500, 2000], 2: [2000, 2500, 3000, 4000], 3: [3000, 4000, 5000, 6000], 4: [5000, 7500, 10000], 5: [10000, 12500, 15000, 20000] };
const SHARE_COUNT: Record<Step, readonly [number, number]> = { 1: [2, 4], 2: [3, 5], 3: [3, 6], 4: [4, 8], 5: [5, 9] };
const SHARE_BUY_COUNT: Record<Step, readonly [number, number]> = { 1: [2, 3], 2: [2, 4], 3: [3, 6], 4: [3, 8], 5: [4, 10] };
const SHARE_PRICES = [100, 150, 200, 250, 300, 400, 500] as const;

function drawShare(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  const item = pick(ctx.rng, BUY_ITEMS.slice(0, 4));
  for (let attempt = 0; attempt < 200; attempt++) {
    const each = pick(ctx.rng, SHARE_EACH[step]);
    const children = rnd(ctx, SHARE_COUNT[step]);
    const k = rnd(ctx, SHARE_BUY_COUNT[step]);
    const price = pick(ctx.rng, SHARE_PRICES);
    const spent = k * price;
    if (spent >= each - 100) continue;
    const total = each * children;
    const rest = each - spent;
    return {
      scenario: "partage",
      story: `On partage ${fcfa(total)} également entre ${children} enfants. Chaque enfant achète ${k} ${item.many} à ${fcfa(price)} pièce.`,
      question: "Combien reste-t-il à chaque enfant ?",
      goal: "ce qui reste à chaque enfant",
      value: rest,
      unit: "FCFA",
      calc: `${show(total)} ÷ ${children} − ${k} × ${show(price)}`,
      steps: [
        { question: "Combien reçoit chaque enfant ?", text: "Partage la somme également", value: each },
        { question: `Combien dépense chaque enfant ?`, text: "Calcule la dépense de chaque enfant", value: spent },
        { question: "Combien reste-t-il à chaque enfant ?", text: "Retire la dépense à la part", value: rest },
      ],
      useful: [`${show(total)} FCFA partagés`, `${children} enfants`, `${k} ${item.many} à ${show(price)} FCFA`],
      extra: { sentence: "Il fait chaud.", tile: "Il fait chaud" },
      pool: [each, spent, total - spent, total / children + spent, rest + 100, rest - 100, total - children * spent],
      reply: "Il reste ___ FCFA à chaque enfant.",
    };
  }
  throw new Error("partage : aucun tirage");
}

// ---------------------------------------------------------------------------
// Un trajet en car en deux étapes (quatre calculs)
// ---------------------------------------------------------------------------

const ROUTE_HOURS: Record<Step, readonly [number, number]> = { 1: [1, 3], 2: [2, 4], 3: [2, 5], 4: [3, 6], 5: [3, 6] };
const ROUTE_LEFT: Record<Step, readonly [number, number]> = { 1: [2, 10], 2: [4, 20], 3: [5, 30], 4: [10, 50], 5: [10, 80] };

function drawRoute(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  for (let attempt = 0; attempt < 200; attempt++) {
    const v1 = pick(ctx.rng, [40, 50, 60, 70, 80, 90] as const);
    const v2 = pick(ctx.rng, [40, 50, 60, 70, 80, 90] as const);
    const h1 = rnd(ctx, ROUTE_HOURS[step]);
    const h2 = rnd(ctx, ROUTE_HOURS[step]);
    if (v1 === v2 && h1 === h2) continue;
    const first = v1 * h1;
    const second = v2 * h2;
    const done = first + second;
    const left = rnd(ctx, ROUTE_LEFT[step]) * 10;
    const total = done + left;
    return {
      scenario: "route",
      story: `Un car doit parcourir ${show(total)} km. Il roule ${h1} heures à ${v1} km/h, puis ${h2} heures à ${v2} km/h.`,
      question: "Combien de kilomètres lui reste-t-il à parcourir ?",
      goal: "la distance qui reste",
      value: left,
      unit: "km",
      calc: `${show(total)} − (${v1} × ${h1} + ${v2} × ${h2})`,
      steps: [
        { question: "Quelle distance parcourt-il pendant la première étape ?", text: "Calcule la première distance", value: first },
        { question: "Quelle distance parcourt-il pendant la seconde étape ?", text: "Calcule la seconde distance", value: second },
        { question: "Quelle distance a-t-il déjà parcourue ?", text: "Additionne les deux distances", value: done },
        { question: "Combien de kilomètres lui reste-t-il à parcourir ?", text: "Retire la distance parcourue", value: left },
      ],
      useful: [`${show(total)} km à parcourir`, `${h1} heures à ${v1} km/h`, `${h2} heures à ${v2} km/h`],
      extra: { sentence: `Le car a ${pick(ctx.rng, [30, 35, 45, 50, 60])} places.`, tile: "" },
      pool: [done, first, total - first, total - done + v1, left + 10, left - 10, total - (v1 + v2) * h1],
      reply: "Il lui reste ___ km à parcourir.",
    };
  }
  throw new Error("trajet : aucun tirage");
}

// ---------------------------------------------------------------------------
// Un achat revendu avec des frais (trois calculs)
// ---------------------------------------------------------------------------

const TRADE_GOODS = [
  { many: "pagnes", prices: [2000, 2500, 3000, 4000, 5000] },
  { many: "seaux", prices: [1000, 1500, 2000] },
  { many: "sacs de charbon", prices: [2500, 3000, 3500] },
  { many: "cartons de savon", prices: [4000, 5000, 6000] },
] as const;
const TRADE_COUNT: Record<Step, readonly [number, number]> = { 1: [3, 6], 2: [5, 10], 3: [8, 15], 4: [12, 25], 5: [20, 40] };
const TRADE_FEE: Record<Step, readonly number[]> = { 1: [500, 1000], 2: [1000, 2000], 3: [2000, 3000, 5000], 4: [5000, 7500, 10000], 5: [10000, 15000, 20000] };
const TRADE_PROFIT: Record<Step, readonly number[]> = { 1: [1000, 2000, 3000], 2: [2000, 5000, 8000], 3: [5000, 10000, 15000], 4: [10000, 20000, 30000], 5: [25000, 50000, 75000] };

function drawTrade(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  const person = pick(ctx.rng, PEOPLE);
  const goods = pick(ctx.rng, TRADE_GOODS);
  const n = rnd(ctx, TRADE_COUNT[step]);
  const price = pick(ctx.rng, goods.prices);
  const fee = pick(ctx.rng, TRADE_FEE[step]);
  const profit = pick(ctx.rng, TRADE_PROFIT[step]);
  const bought = n * price;
  const cost = bought + fee;
  const sale = cost + profit;
  return {
    scenario: "commerce",
    story: `${person.name} achète ${n} ${goods.many} à ${fcfa(price)} pièce. ${capital(person.pronoun)} paie ${fcfa(fee)} de transport, puis revend le tout ${fcfa(sale)}.`,
    question: "Quel est son bénéfice ?",
    goal: "le bénéfice",
    value: profit,
    unit: "FCFA",
    calc: `${show(sale)} − (${n} × ${show(price)} + ${show(fee)})`,
    steps: [
      { question: `Combien coûtent les ${goods.many} ?`, text: "Calcule le prix d'achat", value: bought },
      { question: "Quel est le prix de revient ?", text: "Ajoute les frais de transport", value: cost },
      { question: "Quel est son bénéfice ?", text: "Retire le prix de revient au prix de vente", value: profit },
    ],
    useful: [`${n} ${goods.many} à ${show(price)} FCFA`, `${show(fee)} FCFA de transport`, `${show(sale)} FCFA de vente`],
    extra: ageExtra(ctx, person.name, 25, 55),
    pool: [sale - bought, bought, sale - fee, sale, profit + 500, profit - 500, cost],
    reply: "Le bénéfice est de ___ FCFA.",
  };
}

// ---------------------------------------------------------------------------
// LES DÉMARCHES RÉGRESSIVES
// ---------------------------------------------------------------------------

const ARGENT_UNIT: Record<Step, number> = { 1: 100, 2: 500, 3: 1000, 4: 5000, 5: 5000 };

/** « Awa avait de l'argent. Elle dépense 1 500 FCFA, puis reçoit 500 FCFA de sa tante. Elle a maintenant 2 000 FCFA. Combien avait-elle au début ? » */
function drawMoney(ctx: GameContext): Problem {
  const step = stepOf(ctx);
  const unit = ARGENT_UNIT[step];
  const person = pick(ctx.rng, PEOPLE);
  for (let attempt = 0; attempt < 200; attempt++) {
    const spent = randomInt(ctx.rng, 3, 15) * unit;
    const received = randomInt(ctx.rng, 1, 9) * unit;
    const end = randomInt(ctx.rng, 2, 14) * unit;
    const start = end + spent - received;
    if (start < unit || [spent, received, end].includes(start) || end === received) continue;
    return {
      scenario: "argent",
      story: `${person.name} avait de l'argent. ${capital(person.pronoun)} dépense ${fcfa(spent)}, puis reçoit ${fcfa(received)} de sa tante. ${capital(person.pronoun)} a maintenant ${fcfa(end)}.`,
      question: `Combien avait-${person.pronoun} au début ?`,
      goal: "l'argent du début",
      value: start,
      unit: "FCFA",
      calc: `${show(end)} − ${show(received)} + ${show(spent)}`,
      steps: [
        { question: "Combien avait-il avant de recevoir l'argent ?", text: "Retire ce qui a été reçu", value: end - received },
        { question: "Combien avait-il au début ?", text: "Ajoute ce qui a été dépensé", value: start },
      ],
      useful: [`${show(spent)} FCFA dépensés`, `${show(received)} FCFA reçus`, `${show(end)} FCFA à la fin`],
      extra: ageExtra(ctx, person.name, 20, 60),
      pool: [end + received + spent, end - spent + received, end + spent, end - spent, end + received, start + unit, start - unit],
      reply: `${capital(person.pronoun)} avait ___ FCFA au début.`,
    };
  }
  throw new Error("argent : aucun tirage");
}

const STOCK_UNIT: Record<Step, number> = { 1: 5, 2: 10, 3: 25, 4: 50, 5: 100 };

/** « Un commerçant a des sacs de riz. Le matin il en vend 40, l'après-midi il en reçoit 25. Il en a maintenant 60. Combien en avait-il au début ? » */
function drawStock(ctx: GameContext): Problem {
  const unit = STOCK_UNIT[stepOf(ctx)];
  for (let attempt = 0; attempt < 200; attempt++) {
    const sold = randomInt(ctx.rng, 3, 14) * unit;
    const received = randomInt(ctx.rng, 1, 9) * unit;
    const end = randomInt(ctx.rng, 2, 12) * unit;
    const start = end + sold - received;
    if (start < unit || [sold, received, end].includes(start) || end === received) continue;
    return {
      scenario: "stock",
      story: `Un commerçant a des sacs de riz. Le matin il en vend ${show(sold)}, l'après-midi il en reçoit ${show(received)}. Il en a maintenant ${show(end)}.`,
      question: "Combien en avait-il au début ?",
      goal: "le nombre de sacs du début",
      value: start,
      unit: "",
      calc: `${show(end)} − ${show(received)} + ${show(sold)}`,
      steps: [
        { question: "Combien en avait-il avant la livraison ?", text: "Retire les sacs reçus", value: end - received },
        { question: "Combien en avait-il au début ?", text: "Ajoute les sacs vendus", value: start },
      ],
      useful: [`${show(sold)} sacs vendus`, `${show(received)} sacs reçus`, `${show(end)} sacs à la fin`],
      extra: { sentence: "Il fait chaud.", tile: "Il fait chaud" },
      pool: [end + received + sold, end - sold + received, end + sold, end - sold, end + received, start + unit, start - unit],
      reply: "Il en avait ___ au début.",
    };
  }
  throw new Error("stock : aucun tirage");
}

const MANGO_UNIT: Record<Step, number> = { 1: 2, 2: 5, 3: 10, 4: 25, 5: 50 };

/** « Un marchand vend la moitié de ses mangues le matin, puis 15 mangues l'après-midi. Il lui en reste 20. Combien de mangues avait-il au début ? » */
function drawMangoes(ctx: GameContext): Problem {
  const unit = MANGO_UNIT[stepOf(ctx)];
  const sold = randomInt(ctx.rng, 2, 12) * unit;
  let left = randomInt(ctx.rng, 2, 12) * unit;
  while (left === sold) left = randomInt(ctx.rng, 2, 12) * unit;
  const half = sold + left;
  const start = 2 * half;
  return {
    scenario: "mangues",
    story: `Un marchand vend la moitié de ses mangues le matin, puis ${show(sold)} mangues l'après-midi. Il lui en reste ${show(left)}.`,
    question: "Combien de mangues avait-il au début ?",
    goal: "le nombre de mangues du début",
    value: start,
    unit: "",
    calc: `(${show(left)} + ${show(sold)}) × 2`,
    steps: [
      { question: "Combien lui en restait-il le matin, après la moitié vendue ?", text: "Ajoute les mangues vendues l'après-midi", value: half },
      { question: "Combien en avait-il au début ?", text: "Double le nombre trouvé", value: start },
    ],
    useful: [`la moitié vendue`, `${show(sold)} mangues vendues`, `${show(left)} mangues restantes`],
    extra: { sentence: "Il fait chaud.", tile: "Il fait chaud" },
    pool: [left + sold, left * 2, left + sold * 2, start - sold, start + sold, half + left, start + unit, start - unit],
    reply: "Il avait ___ mangues au début.",
  };
}

const DRAW: Record<ScenarioKey, (ctx: GameContext) => Problem> = {
  achat: drawPurchase,
  recolte: drawHarvest,
  partage: drawShare,
  route: drawRoute,
  commerce: drawTrade,
  argent: drawMoney,
  stock: drawStock,
  mangues: drawMangoes,
};

/** Un scénario du palier qui va avec `keep`, le moins posé dans ce palier, avec une histoire encore jamais posée. */
export function drawProblem(ctx: GameContext, kind: "progressive" | "regressive", keep: (scenario: ScenarioKey) => boolean = () => true, avoid: readonly ScenarioKey[] = []): Problem {
  const step = stepOf(ctx);
  const all = (kind === "progressive" ? PROGRESSIVE_BY_STEP[step] : REGRESSIVE_BY_STEP[step]).filter(keep);
  const some = all.filter((scenario) => !avoid.includes(scenario));
  const posed = (scenario: ScenarioKey) => {
    let count = 0;
    while (ctx.used.has(`cm2-pb:scenario:${scenario}:${count}`)) count++;
    return count;
  };
  const candidates = some.length > 0 ? some : all;
  const fewest = Math.min(...candidates.map(posed));
  const scenario = pick(
    ctx.rng,
    candidates.filter((candidate) => posed(candidate) === fewest),
  );
  ctx.used.add(`cm2-pb:scenario:${scenario}:${posed(scenario)}`);
  let problem = DRAW[scenario](ctx);
  // Une histoire qui n'a pas déjà été posée, dont la réponse n'est écrite nulle part dans l'énoncé.
  // La donnée inutile n'est jamais un nombre de l'énoncé : un enfant la prendrait pour une donnée qui sert.
  const clash = (candidate: Problem) => {
    const extra = /\d+/.exec(candidate.extra.sentence);
    return extra !== null && numbersIn(promptOf(candidate)).includes(Number(extra[0]));
  };
  const repeats = (candidate: Problem) => ctx.used.has(`cm2-pb:histoire:${candidate.scenario}|${candidate.calc}`) || numbersIn(promptOf(candidate)).includes(candidate.value) || clash(candidate);
  for (let attempt = 0; attempt < 60 && repeats(problem); attempt++) problem = DRAW[scenario](ctx);
  ctx.used.add(`cm2-pb:histoire:${problem.scenario}|${problem.calc}`);
  // La donnée inutile d'un trajet est un nombre de places : sa tuile en découle.
  if (problem.extra.tile === "") problem = { ...problem, extra: { sentence: problem.extra.sentence, tile: problem.extra.sentence.replace(/^Le car a /, "").replace(/\.$/, "") } };
  return problem;
}

const answerOf = (problem: Problem) => `${show(problem.value)}${problem.unit ? ` ${problem.unit}` : ""}`;
const promptOf = (problem: Problem) => `${problem.story} ${problem.question}`;

/** Les deux mauvais résultats : des nombres du même genre que la réponse, jamais un nombre de l'énoncé. */
function wrongResults(ctx: GameContext, problem: Problem): string[] {
  const money = problem.unit === "FCFA";
  const step = money ? 100 : 10;
  const own = numbersIn(promptOf(problem));
  const fits = (n: number) => Number.isInteger(n) && n > 0 && n !== problem.value && !own.includes(n) && n <= problem.value * 3 + 100;
  const typical = shuffle(ctx.rng, [...new Set(problem.pool.filter(fits))]);
  const near = shuffle(ctx.rng, [...new Set([step, 2 * step, 5 * step, 10 * step].flatMap((d) => [problem.value - d, problem.value + d]).filter(fits))].filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let n = step; out.length < 2 && n <= problem.value * 3 + 100; n += step) if (fits(n) && !out.includes(n)) out.push(n);
  return out.map((n) => `${show(n)}${problem.unit ? ` ${problem.unit}` : ""}`);
}

const FORWARD_HINTS: Hints = [
  "Lis l'énoncé en entier et repère la question.",
  "Il faut plusieurs calculs : chaque résultat sert au calcul suivant.",
  "Écris chaque résultat avant de passer au calcul suivant.",
];
const BACKWARD_HINTS: Hints = [
  "Ici, l'histoire donne la fin et la question demande le début.",
  "Pour retrouver le début, défais les opérations dans l'ordre inverse.",
  "Ce qui a été retiré se rajoute, et ce qui a été ajouté se retire.",
];

// ===========================================================================
// LE RÉSULTAT
// ===========================================================================

/** Un problème de démarche progressive : trois ou quatre calculs, le résultat parmi trois. */
export function makeCm2PbForward(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-pb-direct", "résoudre un problème en plusieurs étapes", () => {
    const problem = drawProblem(ctx, "progressive");
    return { prompt: promptOf(problem), answer: answerOf(problem), wrong: wrongResults(ctx, problem), hints: FORWARD_HINTS };
  });
}

/** Un problème de démarche régressive : on connaît la fin, on cherche le début. */
export function makeCm2PbBackward(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-pb-inverse", "résoudre un problème en remontant l'histoire", () => {
    const problem = drawProblem(ctx, "regressive");
    const hints: Hints = problem.scenario === "mangues" ? [BACKWARD_HINTS[0], "Pour retrouver le début, défais les opérations dans l'ordre inverse.", "Ce qui a été vendu se rajoute, et la moitié vendue se double."] : BACKWARD_HINTS;
    return { prompt: promptOf(problem), answer: answerOf(problem), wrong: wrongResults(ctx, problem), hints };
  });
}

/** Le même problème, une réponse courte : « Écris le nombre. » */
export function makeCm2PbWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-pb-ecrire", () => {
    const problem = drawProblem(ctx, ctx.rng() < 0.7 ? "progressive" : "regressive");
    return {
      type: "short-answer",
      prompt: `${promptOf(problem)} Écris le nombre.`,
      payload: { acceptedAnswers: [...new Set([show(problem.value), String(problem.value)])], game: originOf("cm2-pb-ecrire", ctx), concept: "résoudre un problème et écrire le résultat" },
      answerKey: show(problem.value),
      hints: [...(REGRESSIVE.includes(problem.scenario) ? BACKWARD_HINTS : FORWARD_HINTS)],
    };
  });
}

/** Une phrase réponse à compléter : « On lui rend ___ FCFA. » */
export function makeCm2PbReply(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-pb-reponse", "écrire la phrase réponse d'un problème", () => {
    const problem = drawProblem(ctx, ctx.rng() < 0.7 ? "progressive" : "regressive");
    return {
      prompt: "Complète la phrase réponse.",
      text: `${promptOf(problem)} Phrase réponse. ${problem.reply}`,
      answer: show(problem.value),
      wrong: wrongResults(ctx, problem).map((text) => text.replace(/ (FCFA|kg|km)$/, "")),
      hints: [...(REGRESSIVE.includes(problem.scenario) ? BACKWARD_HINTS : FORWARD_HINTS)],
    };
  });
}

// ===========================================================================
// LA QUESTION INTERMÉDIAIRE, LA DONNÉE INUTILE, LES ÉTAPES
// ===========================================================================

const IRRELEVANT = ["Quelle heure est-il ?", "Quel temps fait-il ?"] as const;

/** « Pour trouver le bénéfice, que faut-il chercher en premier ? » : la question intermédiaire, jamais la question finale. */
export function makeCm2PbFirst(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-pb-question", "trouver la question intermédiaire d'un problème", () => {
    const problem = drawProblem(ctx, "progressive", (scenario) => ORDERED[scenario]);
    return {
      prompt: `${problem.story} Pour trouver ${problem.goal}, que faut-il chercher en premier ?`,
      answer: problem.steps[0].question,
      wrong: [problem.question, pick(ctx.rng, IRRELEVANT)],
      hints: [
        "Lis l'énoncé en entier.",
        "La question finale ne peut pas se résoudre immédiatement.",
        "Cherche d'abord ce que l'énoncé ne donne pas et qui sert au calcul suivant.",
      ],
    };
  });
}

/** « Quelle donnée est inutile ? » : un âge, une place ou le temps qu'il fait, parmi des données qui servent. */
export function makeCm2PbUseless(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-pb-utile", "repérer la donnée qui ne sert pas", () => {
    const problem = drawProblem(ctx, "progressive");
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

/** « Mets les étapes dans l'ordre. » : lire l'énoncé, les calculs dans l'ordre de l'histoire, vérifier. */
export function makeCm2PbOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-pb-ordre", "ranger les étapes pour résoudre un problème", () => {
    const problem = drawProblem(ctx, "progressive", (scenario) => ORDERED[scenario]);
    return {
      prompt: `${promptOf(problem)} Mets les étapes dans le bon ordre.`,
      sequence: ["Lis l'énoncé", ...problem.steps.map((step) => step.text), "Vérifie la réponse"],
      hints: ["Commence par lire, finis par vérifier.", "Le premier calcul prépare le suivant.", "Les calculs se font dans l'ordre de l'histoire."],
    };
  });
}

/** « Relie chaque problème à son calcul. » : trois scénarios différents, tous les calculs différents. */
export function makeCm2PbLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-pb-relier", "relier un problème à son calcul", () => {
    const problems: Problem[] = [];
    for (let attempt = 0; attempt < 60 && problems.length < 3; attempt++) {
      const problem = drawProblem(ctx, "progressive", () => true, problems.map((other) => other.scenario));
      if (problems.some((other) => other.scenario === problem.scenario || other.calc === problem.calc)) continue;
      problems.push(problem);
    }
    return {
      prompt: "Relie chaque problème à son calcul.",
      pairs: problems.map((problem) => ({ left: promptOf(problem), right: problem.calc })),
      hints: ["Repère les nombres de chaque problème.", "Pense à ce que l'histoire fait : ajouter, retirer, répéter ou partager.", "Chaque calcul va avec un seul problème."],
    };
  });
}

/** « Glisse chaque problème dans la bonne case. » : deux problèmes de démarche progressive, deux de démarche régressive. */
export function makeCm2PbSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-pb-glisser", "reconnaître une démarche progressive ou régressive", () => {
    const zones: readonly [string, string] = ["Démarche progressive", "Démarche régressive"];
    const forward: Problem[] = [];
    const backward: Problem[] = [];
    for (let attempt = 0; attempt < 60 && forward.length < 2; attempt++) {
      const problem = drawProblem(ctx, "progressive", () => true, forward.map((other) => other.scenario));
      if (forward.some((other) => other.scenario === problem.scenario)) continue;
      forward.push(problem);
    }
    for (let attempt = 0; attempt < 60 && backward.length < 2; attempt++) {
      const problem = drawProblem(ctx, "regressive", () => true, backward.map((other) => other.scenario));
      if (backward.some((other) => other.scenario === problem.scenario)) continue;
      backward.push(problem);
    }
    return {
      prompt: "Glisse chaque problème dans la bonne case.",
      zones,
      items: [...forward.map((problem) => ({ text: promptOf(problem), zone: zones[0] })), ...backward.map((problem) => ({ text: promptOf(problem), zone: zones[1] }))],
      hints: [
        "Cherche si la question demande la fin de l'histoire ou son début.",
        "Quand on suit l'histoire dans l'ordre, la démarche est progressive.",
        "Quand on connaît la fin et qu'on remonte, la démarche est régressive.",
      ],
    };
  });
}

// ===========================================================================
// VÉRIFIER SA RÉPONSE
// ===========================================================================

type Equation = { text: string; numbers: number[]; right: string; wrong: [string, number][] };

const CHECK_BIG: Record<Step, readonly [number, number]> = { 1: [120, 450], 2: [450, 1500], 3: [1500, 9000], 4: [9000, 45000], 5: [45000, 450000] };
const CHECK_SMALL: Record<Step, readonly [number, number]> = { 1: [80, 380], 2: [200, 900], 3: [600, 4000], 4: [4000, 25000], 5: [20000, 200000] };
const CHECK_FACTOR: Record<Step, readonly [number, number]> = { 1: [12, 49], 2: [25, 99], 3: [60, 400], 4: [120, 800], 5: [400, 2500] };

function drawEquation(ctx: GameContext): Equation {
  const step = stepOf(ctx);
  const form = pick(ctx.rng, ["add", "sub", "mul", "div"] as const);
  if (form === "add") {
    const a = rnd(ctx, CHECK_BIG[step]);
    const b = rnd(ctx, CHECK_SMALL[step]);
    const s = a + b;
    return { text: `${show(a)} + ${show(b)} = ${show(s)}`, numbers: [a, b, s], right: `${show(s)} − ${show(b)}`, wrong: [[`${show(s)} + ${show(b)}`, s + b], [`${show(a)} − ${show(b)}`, a - b], [`${show(a)} + ${show(s)}`, a + s]] };
  }
  if (form === "sub") {
    const y = rnd(ctx, CHECK_SMALL[step]);
    const x = y + rnd(ctx, CHECK_BIG[step]);
    const z = x - y;
    return { text: `${show(x)} − ${show(y)} = ${show(z)}`, numbers: [x, y, z], right: `${show(z)} + ${show(y)}`, wrong: [[`${show(x)} + ${show(y)}`, x + y], [`${show(z)} − ${show(y)}`, z - y], [`${show(x)} + ${show(z)}`, x + z]] };
  }
  const p = rnd(ctx, CHECK_FACTOR[step]);
  const q = randomInt(ctx.rng, 3, 9);
  if (form === "mul") {
    const r = p * q;
    return { text: `${show(p)} × ${q} = ${show(r)}`, numbers: [p, q, r], right: `${show(r)} ÷ ${q}`, wrong: [[`${show(r)} × ${q}`, r * q], [`${show(r)} − ${q}`, r - q], [`${show(p)} + ${q}`, p + q]] };
  }
  const x = p * q;
  return { text: `${show(x)} ÷ ${q} = ${show(p)}`, numbers: [x, q, p], right: `${show(p)} × ${q}`, wrong: [[`${show(p)} + ${q}`, p + q], [`${show(x)} − ${q}`, x - q], [`${show(x)} × ${q}`, x * q]] };
}

/** « Awa calcule 1 340 + 580 = 1 920. Quel calcul permet de vérifier son résultat ? » : l'opération inverse, qui retrouve un des nombres de départ. */
export function makeCm2PbCheck(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-pb-verifier", "vérifier un résultat avec l'opération inverse", () => {
    const person = pick(ctx.rng, PEOPLE);
    let equation = drawEquation(ctx);
    // Aucun mauvais choix ne retrouve un des nombres de l'égalité : on retire ceux qui y tombent.
    for (let attempt = 0; attempt < 30 && equation.wrong.filter(([, value]) => !equation.numbers.includes(value)).length < 2; attempt++) equation = drawEquation(ctx);
    return {
      prompt: `${person.name} calcule ${equation.text}. Quel calcul permet de vérifier son résultat ?`,
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
