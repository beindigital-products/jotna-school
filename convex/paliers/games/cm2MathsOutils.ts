/**
 * LES AIDES COMMUNES DES MATHÉMATIQUES DU CM2 (`cm2Milliards.ts`, `cm2Decimaux.ts`, `cm2Commerce.ts`, `cm2Partages.ts`) : les nombres jusqu'aux
 * centaines de milliards et leur écriture en lettres, les décimaux comptés en MILLIÈMES, les mauvais choix d'un nombre.
 *
 * Le CM2 a CINQ paliers comme le CM1 : `stepOf` (`cm1MathsOutils.ts`) rend la place du palier (1 à 5). Ces gabarits CALCULENT leur réponse : aucun
 * tableau de faits, une arithmétique que le test refait avec ses propres règles.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { randomInt, shuffle, type GameContext } from "./shared";
import { inWords } from "./nombresCp";
import { show } from "./cm1MathsOutils";

/** Le plus grand nombre du CM2 : les centaines de milliards. Aucun nombre ne le passe, ni dans un énoncé ni dans un choix. */
export const CAP_CM2 = 999999999999;

/** Un groupe de trois chiffres (0 à 999) en lettres. `final` : rien ne suit dans le groupe, donc « cent » et « quatre-vingts » prennent leur s. */
function groupWords(n: number, final: boolean): string {
  const hundreds = Math.floor(n / 100);
  const under = n % 100;
  const parts: string[] = [];
  if (hundreds === 1) parts.push("cent");
  else if (hundreds > 1) parts.push(`${inWords(hundreds)} cent${under === 0 && final ? "s" : ""}`);
  if (under > 0 || parts.length === 0) parts.push(under === 80 && !final ? "quatre-vingt" : inWords(under));
  return parts.join(" ");
}

/**
 * Un nombre de 0 à 999 999 999 999 en lettres, comme à l'école de France et du Sénégal. Au-dessus de cent, aucun trait d'union entre les mots ;
 * « cent » et « vingt » prennent un s quand rien ne les suit dans leur groupe, sauf devant « mille » (« deux cent mille », « quatre-vingt mille ») ;
 * devant « million » et « milliard », qui sont des noms, ils le gardent (« deux cents millions », « quatre-vingts milliards »).
 */
export function wordsOfCm2(n: number): string {
  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const low = n % 1000;
  const parts: string[] = [];
  if (billions === 1) parts.push("un milliard");
  else if (billions > 1) parts.push(`${groupWords(billions, true)} milliards`);
  if (millions === 1) parts.push("un million");
  else if (millions > 1) parts.push(`${groupWords(millions, true)} millions`);
  if (thousands === 1) parts.push("mille");
  else if (thousands > 1) parts.push(`${groupWords(thousands, false)} mille`);
  if (low > 0 || parts.length === 0) parts.push(groupWords(low, true));
  return parts.join(" ");
}

/**
 * Les deux mauvais choix d'un grand nombre : les erreurs d'enfant de `pool` d'abord, les voisins ensuite (un, dix, cent… de plus ou de moins, à l'échelle
 * du nombre : ses cinq rangs de gauche). Jamais la bonne réponse, jamais un nombre de `avoid`.
 */
export function wrongBig(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number, avoid: readonly number[] = []): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer && !avoid.includes(n);
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const length = String(Math.max(1, answer)).length;
  const units = Array.from({ length: 5 }, (_, i) => 10 ** Math.max(0, length - 1 - i)).filter((d) => d <= answer);
  const around = Array.from(new Set(units)).flatMap((d) => [answer - d, answer + d]);
  const near = shuffle(ctx.rng, Array.from(new Set(around.filter(fits))).filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let n = Math.max(min, 0); out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [show(out[0]), show(out[1])];
}

/** Le nombre dont les chiffres de rang `a` et `b` (0 : les unités) sont échangés. */
export function swapRanks(n: number, a: number, b: number): number {
  const digits = String(n).split("");
  const length = digits.length;
  [digits[length - 1 - a], digits[length - 1 - b]] = [digits[length - 1 - b], digits[length - 1 - a]];
  return Number(digits.join(""));
}

/**
 * Des nombres de `count` valeurs différentes dans [lo, top], proches les uns des autres : ils partagent leurs premiers chiffres et ne se
 * distinguent qu'au milieu ou à la fin. Comparer ne se réduit alors pas à compter les chiffres.
 */
export function closeNumbers(ctx: GameContext, count: number, lo: number, top: number): number[] {
  const length = String(lo).length;
  for (let attempt = 0; attempt < 100; attempt++) {
    const base = randomInt(ctx.rng, lo, top);
    const out = new Set<number>([base]);
    for (let tries = 0; tries < 40 && out.size < count; tries++) {
      // Le chiffre qu'on change est l'un des rangs de droite : jamais le premier chiffre.
      const rank = randomInt(ctx.rng, 0, length - 2);
      const digits = String(base).split("");
      digits[length - 1 - rank] = String(randomInt(ctx.rng, 0, 9));
      const n = Number(digits.join(""));
      if (n >= lo && n <= top) out.add(n);
    }
    if (out.size === count) return shuffle(ctx.rng, [...out]);
  }
  const out = new Set<number>();
  while (out.size < count) out.add(randomInt(ctx.rng, lo, top));
  return [...out];
}

// ===========================================================================
// LES DÉCIMAUX, COMPTÉS EN MILLIÈMES
// ===========================================================================

/**
 * Un nombre décimal écrit à l'école d'après son nombre de MILLIÈMES : 6450 devient « 6,45 », 6400 « 6,4 », 6000 « 6 », 6005 « 6,005 ». La virgule est
 * française, jamais un point, les milliers de la partie entière sont séparés par une espace et un zéro inutile à droite n'est jamais écrit.
 */
export function dec3(thousandths: number): string {
  const whole = Math.floor(thousandths / 1000);
  const rest = thousandths % 1000;
  if (rest === 0) return show(whole);
  const digits = String(rest).padStart(3, "0").replace(/0+$/, "");
  return `${show(whole)},${digits}`;
}

/** Les deux mauvais choix d'un décimal compté en millièmes : comme `wrongBig`, mais écrits avec `dec3`. */
export function wrongDec3(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number, avoid: readonly number[] = []): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer && !avoid.includes(n);
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const around = [1, 10, 100, 1000].flatMap((d) => [answer - d, answer + d]);
  const near = shuffle(ctx.rng, Array.from(new Set(around.filter(fits))).filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let n = Math.max(min, 0); out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [dec3(out[0]), dec3(out[1])];
}

/** Une somme d'argent en francs CFA, comme à l'école : « 12 500 FCFA ». */
export const fcfa = (n: number) => `${show(n)} FCFA`;
