/**
 * LES AIDES COMMUNES DES MATHÉMATIQUES DU CM1 (`nombresCm1.ts`, `divisibiliteCm1.ts`, `divisionCm1.ts`, `fractionsCm1.ts`,
 * `decimauxCm1.ts`) : la place du palier parmi cinq, l'écriture d'un nombre, le chiffre d'un rang, un nombre aux chiffres tous différents.
 *
 * Le CM1 a CINQ paliers, joués aux niveaux 1, 2, 2, 3 et 4 (`GameContext.palier`) : le niveau seul donnerait la même plage aux paliers
 * 2 et 3. `stepOf` rend la place du palier (1 à 5). Sans `palier` (une variation refaite par `regenerateGame`, un test qui ne joue qu'un
 * niveau), la place se déduit du niveau : 1, 2, 4 et 5.
 *
 * Ces gabarits CALCULENT leur réponse : aucun tableau de faits, une arithmétique que le test refait avec ses propres règles.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { randomInt, shuffle, type GameContext } from "./shared";
import { formatNumber } from "./patterns";

export type Step = 1 | 2 | 3 | 4 | 5;

/** La place du palier dans sa thématique, de 1 à 5. */
export function stepOf(ctx: GameContext): Step {
  if (ctx.palier) {
    const place = Math.round((ctx.palier.index * 5) / Math.max(1, ctx.palier.count));
    return Math.min(5, Math.max(1, place)) as Step;
  }
  return ([1, 2, 4, 5] as const)[ctx.level - 1];
}

/** Un nombre écrit comme à l'école : les milliers séparés par une espace. */
export const show = (n: number) => formatNumber(n);

/** Le plus grand nombre des grands nombres du CM1 : les millions, pas les milliards (ils sont au CM2). */
export const CAP_CM1 = 9999999;

/** Le chiffre d'un rang : 0 les unités, 1 les dizaines, 2 les centaines, 3 les milliers… */
export const digitAt = (n: number, rank: number) => Math.floor(n / 10 ** rank) % 10;

/** Le nombre de chiffres d'un entier positif. */
export const lengthOf = (n: number) => String(n).length;

/** Les chiffres d'un nombre, du plus fort rang au plus faible. */
export const digitsOf = (n: number) => String(n).split("").map(Number);

/** Le nombre dont on lit les chiffres à l'envers (« 45 678 » → « 87 654 »). */
export const reversed = (n: number) => Number(String(n).split("").reverse().join(""));

/** Un nombre de `count` chiffres, tous différents et aucun zéro : chaque chiffre a une seule place et une seule valeur. */
export function plainDigits(ctx: GameContext, count: number): number {
  const digits = shuffle(ctx.rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count);
  return Number(digits.join(""));
}

/** Un nombre de `count` chiffres tiré entre `lo` et `top`, tous différents et aucun zéro quand c'est possible dans la plage. */
export function plainNumber(ctx: GameContext, lo: number, top: number): number {
  const count = lengthOf(lo);
  for (let attempt = 0; attempt < 200; attempt++) {
    const n = plainDigits(ctx, count);
    if (n >= lo && n <= top) return n;
  }
  return randomInt(ctx.rng, lo, top);
}

/** `count` nombres différents de [lo, top], dont deux du même millier quand `shareBlock` : la comparaison devient moins évidente. */
export function distinctNumbers(ctx: GameContext, count: number, lo: number, top: number, shareBlock: boolean): number[] {
  const out: number[] = [];
  if (shareBlock) {
    const start = randomInt(ctx.rng, Math.ceil(lo / 1000), Math.floor((top - 999) / 1000));
    const same = new Set<number>();
    while (same.size < 2) same.add(start * 1000 + randomInt(ctx.rng, 0, 999));
    out.push(...same);
  }
  while (out.length < count) {
    const n = randomInt(ctx.rng, lo, top);
    if (!out.includes(n)) out.push(n);
  }
  return shuffle(ctx.rng, out);
}

/**
 * Les deux mauvais choix d'un nombre : les erreurs d'enfant de `pool` d'abord, les voisins ensuite (un, dix, cent, mille, dix mille de plus ou de
 * moins, sans dépasser la bonne réponse elle-même en taille). Jamais la bonne réponse, jamais un nombre de `avoid` (ceux que l'énoncé écrit déjà : un terme de la suite, une partie de la somme).
 */
export function wrongNumbers(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number, avoid: readonly number[] = []): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer && !avoid.includes(n);
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const around = [1, 10, 100, 1000, 10000].filter((d) => d <= answer).flatMap((d) => [answer - d, answer + d]);
  const near = shuffle(ctx.rng, Array.from(new Set(around.filter(fits))).filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let n = min; out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [show(out[0]), show(out[1])];
}

/**
 * Un nombre décimal écrit à l'école, d'après son nombre de centièmes : 645 devient « 6,45 », 640 « 6,4 », 600 « 6 ». La virgule est française, jamais un point,
 * et un zéro inutile à droite n'est jamais écrit.
 */
export function dec(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const rest = hundredths % 100;
  if (rest === 0) return show(whole);
  return rest % 10 === 0 ? `${show(whole)},${rest / 10}` : `${show(whole)},${String(rest).padStart(2, "0")}`;
}

/** Les deux mauvais choix d'un décimal, comptés en centièmes : comme `wrongNumbers`, mais écrits avec `dec`. */
export function wrongDecimals(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number, avoid: readonly number[] = []): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer && !avoid.includes(n);
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const around = [1, 10, 100].flatMap((d) => [answer - d, answer + d]);
  const near = shuffle(ctx.rng, Array.from(new Set(around.filter(fits))).filter((n) => !typical.includes(n)));
  const out = [...typical, ...near].slice(0, 2);
  for (let n = min; out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [dec(out[0]), dec(out[1])];
}

/** `count` entiers différents de [from, to]. */
export function distinctInRange(ctx: GameContext, from: number, to: number, count: number): number[] {
  const out = new Set<number>();
  while (out.size < count) out.add(randomInt(ctx.rng, from, to));
  return [...out];
}
