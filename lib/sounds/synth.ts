/**
 * LE SYNTHÉTISEUR DES EXERCICES D'ÉCOUTE — des notes et des coups de tam-tam
 * fabriqués par le navigateur (Web Audio), sans aucun fichier son.
 *
 * Un exercice d'écoute (`convex/paliers/games/listen.ts`) décrit ses sons
 * note par note : fréquence, durée, volume. On les joue ici, à la demande de
 * l'enfant (un toucher, ce qu'exigent iOS et Android pour ouvrir l'audio).
 *
 * La préférence « sons » de l'élève ne coupe PAS ces sons : comme la voix
 * qui lit la consigne, ils sont l'exercice lui-même, pas une récompense.
 */
import type { ListenNote } from "@/convex/paliers/games/types";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let playing: { stop: () => void } | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** Vrai quand l'appareil sait jouer les sons (presque toujours). */
export function canSynthesize(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.AudioContext ?? (window as WebkitWindow).webkitAudioContext);
}

/** La durée totale d'une suite de notes, en millisecondes. */
export function clipDuration(notes: readonly ListenNote[]): number {
  return notes.reduce((sum, note) => sum + Math.max(0, note.d), 0);
}

/** Arrête le son en cours, s'il y en a un. */
export function stopClip(): void {
  playing?.stop();
  playing = null;
}

/**
 * Joue une suite de notes ; rend une promesse tenue quand le son est fini
 * (ou coupé par un autre). Ne lève jamais : un appareil sans audio ne joue
 * rien.
 */
export async function playClip(notes: readonly ListenNote[]): Promise<void> {
  stopClip();
  const ctx = audioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    return;
  }

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const nodes: AudioScheduledSourceNode[] = [];
  let t = ctx.currentTime + 0.05;
  for (const note of notes) {
    const seconds = Math.max(0, note.d) / 1000;
    if (note.f > 0 && seconds > 0) {
      if (note.k === "drum") nodes.push(...scheduleDrum(ctx, master, t, seconds, note.v ?? 0.9, note.f));
      else nodes.push(scheduleTone(ctx, master, t, seconds, note.v ?? 0.8, note.f));
    }
    t += seconds;
  }

  const total = Math.max(0, t - ctx.currentTime);
  await new Promise<void>((resolve) => {
    let done = false;
    const handle = {
      stop: () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        for (const node of nodes) {
          try {
            node.stop();
          } catch {
            // déjà arrêtée
          }
        }
        try {
          master.disconnect();
        } catch {
          // déjà débranché
        }
        if (playing === handle) playing = null;
        resolve();
      },
    };
    playing = handle;
    const timer = setTimeout(handle.stop, total * 1000 + 80);
  });
}

/**
 * Une note tenue : un son doux (triangle), avec une attaque et une fin
 * arrondies pour ne pas claquer. Le volume demandé est respecté à
 * l'identique d'une note à l'autre : c'est lui qu'on compare dans « fort ou
 * doux ».
 */
function scheduleTone(
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  seconds: number,
  volume: number,
  frequency: number,
): AudioScheduledSourceNode {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, start);
  const gain = ctx.createGain();
  const attack = Math.min(0.03, seconds / 4);
  const release = Math.min(0.08, seconds / 3);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.setValueAtTime(volume, start + seconds - release);
  gain.gain.linearRampToValueAtTime(0, start + seconds);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
  return osc;
}

/**
 * Un coup de tam-tam : une note grave qui tombe vite (la peau) et un souffle
 * bref (la main qui frappe).
 */
function scheduleDrum(
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  seconds: number,
  volume: number,
  frequency: number,
): AudioScheduledSourceNode[] {
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(frequency * 1.6, start);
  body.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.6), start + seconds);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(volume, start);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  body.connect(bodyGain);
  bodyGain.connect(out);
  body.start(start);
  body.stop(start + seconds + 0.02);

  const length = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.35, start);
  noise.connect(noiseGain);
  noiseGain.connect(out);
  noise.start(start);
  return [body, noise];
}
