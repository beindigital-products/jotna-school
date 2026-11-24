/**
 * Console du super admin — calculs PURS, sans aucun import Convex.
 *
 * `adminConsole.ts` lit les tables et passe les lignes ici : séries par jour
 * et par mois, sommes, bornes de comptage. Même découpage que le reste du
 * dépôt (vitest en `jsdom`, pas de `convex-test`).
 *
 * LES DATES SONT CELLES DE DAKAR : UTC+0 sans heure d'été, donc la date UTC
 * EST la date de Dakar (même raisonnement que `streakRules.ts`).
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** « 2026-11-24 ». */
export function dayKeyOf(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** « 2026-11 ». */
export function monthKeyOf(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 7);
}

/** Minuit (Dakar) du jour de `timestamp`. */
export function startOfDay(timestamp: number): number {
  return Math.floor(timestamp / DAY_MS) * DAY_MS;
}

/** Le premier jour du mois de `timestamp`, à minuit. */
export function startOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

/** Les `count` derniers jours, du plus ancien à aujourd'hui inclus. */
export function lastDayKeys(now: number, count: number): string[] {
  const today = startOfDay(now);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(dayKeyOf(today - i * DAY_MS));
  return keys;
}

/** Les `count` derniers mois, du plus ancien au mois courant inclus. */
export function lastMonthKeys(now: number, count: number): string[] {
  const date = new Date(now);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - i, 1);
    keys.push(monthKeyOf(month));
  }
  return keys;
}

export type SeriesPoint = { key: string; value: number };

/**
 * Range des valeurs datées dans des cases (jours ou mois). Les dates hors des
 * cases sont ignorées ; une case sans valeur vaut 0.
 */
export function bucketSeries(
  keys: string[],
  items: readonly { at: number; value: number }[],
  keyOf: (timestamp: number) => string,
): SeriesPoint[] {
  const totals = new Map<string, number>(keys.map((key) => [key, 0]));
  for (const item of items) {
    const key = keyOf(item.at);
    const current = totals.get(key);
    if (current !== undefined) totals.set(key, current + item.value);
  }
  return keys.map((key) => ({ key, value: totals.get(key) ?? 0 }));
}

/**
 * Un comptage borné : `count` lignes lues, `capped` vrai si la lecture s'est
 * arrêtée à la borne (l'écran affiche alors « 1 000+ »). La console lit les
 * tables par paquets bornés ; elle ne compte pas au-delà.
 */
export type BoundedCount = { count: number; capped: boolean };

export function boundedCount(rowsRead: number, cap: number): BoundedCount {
  return rowsRead > cap
    ? { count: cap, capped: true }
    : { count: rowsRead, capped: false };
}

/** Combien de dates tombent à partir de `since`. */
export function countSince(timestamps: readonly number[], since: number): number {
  let total = 0;
  for (const at of timestamps) if (at >= since) total += 1;
  return total;
}

/** La somme d'un champ numérique. */
export function sumOf<T>(rows: readonly T[], pick: (row: T) => number): number {
  let total = 0;
  for (const row of rows) total += pick(row);
  return total;
}

/**
 * La variation entre deux périodes, en pourcentage arrondi, ou `null` quand
 * la période de référence est vide (une hausse depuis zéro n'a pas de %).
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Périodes, variations, entonnoirs (tableau de bord) ──────────────────────

/** Les périodes que le tableau de bord sait afficher, en jours. */
export const PULSE_PERIODS = [7, 30, 90] as const;
export type PulsePeriod = (typeof PULSE_PERIODS)[number];

/**
 * Une mesure sur la période et sur la période d'avant, de même durée.
 * `change` : variation en %, ou `null` quand la période d'avant est vide.
 */
export type Delta = { current: number; previous: number; change: number | null };

export function deltaOf(current: number, previous: number): Delta {
  return { current, previous, change: percentChange(current, previous) };
}

/** Le début de la période, et le début de la période d'avant. */
export function periodWindow(
  now: number,
  days: number,
): { since: number; previousSince: number } {
  return { since: now - days * DAY_MS, previousSince: now - 2 * days * DAY_MS };
}

/** Répartit des éléments datés entre la période et la période d'avant. */
export function splitPeriods<T extends { at: number }>(
  items: readonly T[],
  now: number,
  days: number,
): { current: T[]; previous: T[] } {
  const { since, previousSince } = periodWindow(now, days);
  const current: T[] = [];
  const previous: T[] = [];
  for (const item of items) {
    if (item.at >= since && item.at <= now) current.push(item);
    else if (item.at >= previousSince && item.at < since) previous.push(item);
  }
  return { current, previous };
}

/** Combien d'identifiants différents. */
export function distinctCount(items: readonly { id: string }[]): number {
  return new Set(items.map((item) => item.id)).size;
}

/** Par jour, combien d'identifiants DIFFÉRENTS (élèves actifs par jour). */
export function distinctPerDay(
  keys: string[],
  items: readonly { at: number; id: string }[],
): SeriesPoint[] {
  const sets = new Map<string, Set<string>>(keys.map((key) => [key, new Set()]));
  for (const item of items) sets.get(dayKeyOf(item.at))?.add(item.id);
  return keys.map((key) => ({ key, value: sets.get(key)?.size ?? 0 }));
}

/** Un taux en %, arrondi, ou `null` sans dénominateur. */
export function rateOf(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export type FunnelStep = {
  label: string;
  value: number;
  /** Part de l'étape précédente qui arrive ici, en %, ou `null` (première étape, ou précédente vide). */
  conversion: number | null;
  /** Largeur de la barre, en % de l'étape la plus haute. */
  share: number;
};

/** Un entonnoir : chaque étape avec sa conversion depuis la précédente. */
export function funnelSteps(steps: readonly { label: string; value: number }[]): FunnelStep[] {
  const max = Math.max(0, ...steps.map((step) => step.value));
  return steps.map((step, index) => ({
    label: step.label,
    value: step.value,
    conversion: index === 0 ? null : rateOf(step.value, steps[index - 1].value),
    share: max > 0 ? Math.round((step.value / max) * 100) : 0,
  }));
}

/** Les `limit` plus grands, du plus grand au plus petit ; à égalité, par nom. */
export function topBy<T extends { name: string }>(
  rows: readonly T[],
  pick: (row: T) => number,
  limit: number,
): T[] {
  return [...rows]
    .sort((a, b) => pick(b) - pick(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}
