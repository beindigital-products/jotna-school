/**
 * Phase A.5 — Student sound module (singleton).
 *
 * Decisions:
 *   D6   — Mute by default; preference persisted server-side via setSoundEnabled.
 *   D6b  — howler imported dynamically only after the kid opts in; bundle is
 *          ~3 kb gzip until then.
 *   D9   — Positive sounds only. No fail buzz.
 *   D27  — Preload after opt-in is best-effort. Offline at opt-in time =
 *          silent fail; retry on next online event.
 *   D28  — All localStorage access wrapped in try/catch (iOS Private Mode).
 *   D29  — Singleton, no React Context. Functions are imported directly.
 *   D30  — Sound names are typed: "correct" | "badge". Level-up dropped to
 *          Phase B (D24) where it ships alongside its visible overlay (Pio
 *          qui saute de joie, clip vidéo).
 *   D34  — Volume locked at 0.45. Do NOT add a slider without revisiting
 *          WCAG 1.4.2 + the design spec.
 */

export type SoundName = "correct" | "badge" | "levelUp";

const VOLUME = 0.45;
const SOUND_FILES: Record<SoundName, string> = {
  correct: "/sounds/correct.mp3",
  badge: "/sounds/badge.mp3",
  // D24 — level-up sound. Plays alongside the LevelUpOverlay (D2b) so the
  // sound never fires without a visible counterpart (WCAG 1.3.3 — see
  // Phase A.5 Guardian R1 for the rationale on this constraint).
  levelUp: "/sounds/level-up.mp3",
};

// `Howl` from howler — typed loosely so the dynamic import doesn't pull
// @types/howler into the client bundle pre-opt-in.
type HowlInstance = {
  play: () => void;
  state: () => "unloaded" | "loading" | "loaded";
};
type HowlConstructor = new (opts: {
  src: string[];
  volume: number;
  preload?: boolean;
  html5?: boolean;
}) => HowlInstance;

let howlerCtor: HowlConstructor | null = null;
let howlerLoading: Promise<HowlConstructor> | null = null;
const sounds: Partial<Record<SoundName, HowlInstance>> = {};

// In-memory mirror of the kid's preference, set by callers so play() can
// short-circuit without doing a Convex round-trip. Source of truth lives in
// profiles.preferences.soundEnabled (server) — this is a read-cache.
let soundEnabledMemo = false;

// ---------------------------------------------------------------------------
// Safe localStorage helpers (D28). iOS Safari Private Mode throws on write;
// quota errors throw on full storage; SSR has no `window`. Swallow all of it.
// ---------------------------------------------------------------------------

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // No-op — Private Mode, quota, etc.
  }
}

// ---------------------------------------------------------------------------
// Per-userId opt-in flag (D21). Decoupled from the server `soundEnabled`
// because we want to remember "we already asked this kid" even if they said
// no. The server only stores accept/decline outcomes, not the question state.
// ---------------------------------------------------------------------------

const OPT_IN_ASKED_KEY = (userId: string) => `sound:optInAsked:${userId}`;

export function hasOptInBeenAsked(userId: string): boolean {
  return safeGet(OPT_IN_ASKED_KEY(userId)) === "1";
}

export function markOptInAsked(userId: string): void {
  safeSet(OPT_IN_ASKED_KEY(userId), "1");
}

// ---------------------------------------------------------------------------
// Howler loader + sound cache.
// ---------------------------------------------------------------------------

async function ensureHowler(): Promise<HowlConstructor> {
  if (howlerCtor) return howlerCtor;
  if (!howlerLoading) {
    howlerLoading = import("howler").then((mod) => {
      howlerCtor = mod.Howl as unknown as HowlConstructor;
      return howlerCtor;
    });
  }
  return howlerLoading;
}

function ensureSound(Howl: HowlConstructor, name: SoundName): HowlInstance {
  const cached = sounds[name];
  if (cached) return cached;
  // html5: true plays via <audio> element which sidesteps some Web Audio
  // suspension quirks on iOS Safari background tabs (Skeptic L4 mitigation).
  const inst = new Howl({
    src: [SOUND_FILES[name]],
    volume: VOLUME,
    html5: true,
    preload: true,
  });
  sounds[name] = inst;
  return inst;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Update the in-memory enabled state. Call this whenever the server-side
 * `soundEnabled` changes (after a setSoundEnabled mutation, or when
 * getMyStats first resolves) so play() stays in sync without round-trips.
 */
export function setSoundEnabledLocal(enabled: boolean): void {
  soundEnabledMemo = enabled;
  if (enabled) attachOnlineRetry();
}

export function getSoundEnabledLocal(): boolean {
  return soundEnabledMemo;
}

/**
 * Best-effort preload of all sounds. Call after the kid opts in (or on
 * subsequent loads when soundEnabled is already true). If offline, the
 * fetches will fail silently — Howler will retry on next play() call.
 */
export async function preloadAll(): Promise<void> {
  try {
    const Howl = await ensureHowler();
    ensureSound(Howl, "correct");
    ensureSound(Howl, "badge");
    ensureSound(Howl, "levelUp");
  } catch {
    // Howler import failed (offline + first time) — nothing to do; play()
    // will silently no-op until next attempt.
  }
}

/**
 * Play a sound by name. No-op if:
 *   - sound is disabled in memo (server pref),
 *   - howler hasn't loaded yet (still importing),
 *   - the file failed to load (offline first session, etc.).
 *
 * Never throws. The kid never sees an error if a sound doesn't play.
 */
export async function play(name: SoundName): Promise<void> {
  if (!soundEnabledMemo) return;
  try {
    const Howl = await ensureHowler();
    const inst = ensureSound(Howl, name);
    if (inst.state() !== "loaded") return; // D27 — silent fail if not ready
    inst.play();
  } catch {
    // Swallow — never bubble audio failures to UI.
  }
}

// D27 — Retry preload when the device comes back online. The listener is
// registered at most once (module-level singleton). It only fires if the kid
// had previously opted in (soundEnabledMemo is true) so there's no wasted
// bandwidth for kids who haven't accepted sounds.
let onlineListenerAttached = false;
function attachOnlineRetry(): void {
  if (onlineListenerAttached || typeof window === "undefined") return;
  onlineListenerAttached = true;
  window.addEventListener("online", () => {
    if (soundEnabledMemo) void preloadAll();
  });
}

// Convenience typed shortcuts (D30 — encourage using these over play(name)).
export const playCorrect = (): Promise<void> => play("correct");
export const playBadge = (): Promise<void> => play("badge");
export const playLevelUp = (): Promise<void> => play("levelUp");
