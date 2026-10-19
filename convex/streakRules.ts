/**
 * LA SÉRIE, EN RÈGLES PURES — le serveur et l'application les partagent.
 *
 * Déplacées de `streak.ts` (qui les réexporte) : l'application qui joue sans
 * réseau doit faire monter la série de l'enfant exactement comme le serveur,
 * et un module qui importe `_generated/server` n'a pas sa place dans le paquet
 * de l'écran.
 *
 * Le jour est celui de Dakar, UTC+0 sans heure d'été : la date UTC EST la date
 * locale. Il se range en « AAAA-MM-JJ ».
 */

/** L'état de la série, rangé sous `profiles.preferences.streak`. */
export type StudentStreakState = {
  current: number;
  longest: number;
  lastActivityYmd?: string;
  freezeAvailableUntilYmd?: string;
  /**
   * La série telle qu'elle était quand la tâche de nuit l'a remise à zéro
   * (`applyRollover`). Sans réseau, un enfant joue des jours dont le serveur
   * n'apprend l'existence qu'à la synchronisation : la tâche de nuit, qui ne
   * les voyait pas, a pu casser une série qui ne l'était pas. Ce champ permet
   * à l'activité rattrapée de la rétablir (`applyActivity`), et disparaît à
   * la première activité.
   */
  currentBeforeReset?: number;
};

// ---------------------------------------------------------------------------
// Dates — Africa/Dakar (UTC+0, sans heure d'été).
// ---------------------------------------------------------------------------

/** Convert a unix timestamp to a YYYY-MM-DD string in Africa/Dakar. */
export function timestampToYmd(ts: number): string {
  // Africa/Dakar is UTC+0 with no DST, so the UTC date IS the local date.
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayYmd(): string {
  return timestampToYmd(Date.now());
}

/** Days from `from` to `to` (both YYYY-MM-DD). Negative if `to` is before. */
export function daysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  const fromTs = Date.UTC(fy, fm - 1, fd);
  const toTs = Date.UTC(ty, tm - 1, td);
  return Math.round((toTs - fromTs) / (24 * 60 * 60 * 1000));
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const ts = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  return timestampToYmd(ts);
}

// ---------------------------------------------------------------------------
// Streak transition logic (pure function, exported for tests).
// ---------------------------------------------------------------------------

const FREEZE_INTERVAL_DAYS = 7;

export type StreakTransition = {
  prev: StudentStreakState | undefined;
  next: StudentStreakState;
  freezeUsed: boolean;
};

/**
 * Compute the next streak state given an activity on `todayYmd`.
 * - If today === lastActivityYmd: noop.
 * - If today === lastActivityYmd + 1: increment current.
 * - If a single day was skipped AND freeze is available: freeze, increment.
 * - Otherwise: reset to 1.
 *
 * UNE ACTIVITÉ RATTRAPÉE APRÈS UNE REMISE À ZÉRO DE NUIT. `todayYmd` peut être
 * un jour passé : celui d'un palier joué sans réseau, rejoué à la
 * synchronisation. Si la tâche de nuit avait remis la série à zéro faute de
 * connaître ce jour (`currentBeforeReset`), et que ce jour prolonge la série
 * d'avant, c'est cette série qui continue.
 */
export function applyActivity(
  prev: StudentStreakState | undefined,
  todayYmd: string,
): StreakTransition {
  if (!prev || prev.lastActivityYmd === undefined) {
    return {
      prev,
      next: {
        current: 1,
        longest: Math.max(1, prev?.longest ?? 0),
        lastActivityYmd: todayYmd,
        freezeAvailableUntilYmd: addDaysYmd(todayYmd, FREEZE_INTERVAL_DAYS),
      },
      freezeUsed: false,
    };
  }
  const gap = daysBetween(prev.lastActivityYmd, todayYmd);
  if (gap <= 0) {
    return { prev, next: prev, freezeUsed: false };
  }
  // La série d'où l'on repart : celle d'avant une remise à zéro de nuit
  // qu'une activité rattrapée vient démentir.
  const base =
    prev.current === 0 && prev.currentBeforeReset !== undefined
      ? prev.currentBeforeReset
      : prev.current;
  if (gap === 1) {
    const current = base + 1;
    return {
      prev,
      next: {
        current,
        longest: Math.max(prev.longest, current),
        lastActivityYmd: todayYmd,
        freezeAvailableUntilYmd:
          prev.freezeAvailableUntilYmd ??
          addDaysYmd(todayYmd, FREEZE_INTERVAL_DAYS),
      },
      freezeUsed: false,
    };
  }
  // gap >= 2 — at least one day was skipped.
  const freezeAvailable =
    prev.freezeAvailableUntilYmd !== undefined &&
    daysBetween(prev.freezeAvailableUntilYmd, todayYmd) <= 0;
  if (gap === 2 && freezeAvailable) {
    const current = base + 1;
    return {
      prev,
      next: {
        current,
        longest: Math.max(prev.longest, current),
        lastActivityYmd: todayYmd,
        // Freeze consumed; new freeze only available after FREEZE_INTERVAL_DAYS.
        freezeAvailableUntilYmd: addDaysYmd(todayYmd, FREEZE_INTERVAL_DAYS),
      },
      freezeUsed: true,
    };
  }
  // Streak broken — reset to 1.
  return {
    prev,
    next: {
      current: 1,
      longest: Math.max(prev.longest, 1),
      lastActivityYmd: todayYmd,
      freezeAvailableUntilYmd: addDaysYmd(todayYmd, FREEZE_INTERVAL_DAYS),
    },
    freezeUsed: false,
  };
}

/**
 * Compute the next streak state given that today is `todayYmd` and no
 * activity occurred (rollover check). Used by the daily cron.
 * - If lastActivityYmd is today or yesterday: noop (still alive).
 * - If 2-day gap and freeze available: freeze-protected, mark as active.
 *   (We can't actually mark today as "active" without activity; instead we
 *   leave lastActivityYmd intact and just don't reset.)
 * - Otherwise: reset to 0 (preserves longest), and remember the streak that
 *   was reset (`currentBeforeReset`).
 */
export function applyRollover(
  prev: StudentStreakState | undefined,
  todayYmd: string,
): StreakTransition {
  if (!prev || prev.lastActivityYmd === undefined) {
    return { prev, next: prev ?? { current: 0, longest: 0 }, freezeUsed: false };
  }
  const gap = daysBetween(prev.lastActivityYmd, todayYmd);
  if (gap <= 1) {
    return { prev, next: prev, freezeUsed: false };
  }
  // Streak is at risk. The cron is just a safeguard — actual freeze use only
  // happens on the next applyActivity. So here we only RESET if too much time
  // has passed (gap > 2 with freeze, or gap > 1 without freeze).
  const freezeAvailable =
    prev.freezeAvailableUntilYmd !== undefined &&
    daysBetween(prev.freezeAvailableUntilYmd, todayYmd) <= 0;
  const tolerance = freezeAvailable ? 2 : 1;
  if (gap <= tolerance) {
    return { prev, next: prev, freezeUsed: false };
  }
  // Déjà à zéro : rien à réécrire (la tâche repasse chaque nuit).
  if (prev.current === 0) {
    return { prev, next: prev, freezeUsed: false };
  }
  return {
    prev,
    next: {
      current: 0,
      longest: prev.longest,
      lastActivityYmd: prev.lastActivityYmd,
      freezeAvailableUntilYmd: prev.freezeAvailableUntilYmd,
      currentBeforeReset: prev.current,
    },
    freezeUsed: false,
  };
}
