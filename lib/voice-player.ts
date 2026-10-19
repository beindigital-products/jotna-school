/**
 * LA VOIX DE PIO JOUE UN SON À LA FOIS, DANS TOUTE L'APPLICATION.
 *
 * Pio parle dans le module d'arabe (`components/arabic/speech.ts`) et lit les
 * consignes des exercices (`components/exercises/prompt-reader.tsx`). Deux
 * voix superposées, c'est du bruit pour un enfant : lancer un son coupe
 * celui qui joue. Le son en cours vit donc ici, au niveau de la page, pas
 * dans un composant.
 *
 * CE QU'UN COMPOSANT LANCE, IL L'ARRÊTE EN PARTANT — et seulement cela :
 * chaque lecture porte le jeton de celui qui l'a lancée (`newVoiceOwner`).
 *
 * UN SEUL ÉLÉMENT AUDIO, DÉBLOQUÉ AU PREMIER TOUCHER. La consigne se dit toute
 * seule quand l'exercice apparaît, donc APRÈS un détour par le réseau, pas
 * dans le geste de l'enfant. Safari (iPhone, iPad) et Chrome (Android) refusent
 * alors qu'un `new Audio(url).play()` joue : la promesse est rejetée, et la
 * consigne ne part pas — elle partait si le son arrivait assez vite pour
 * tenir dans la fenêtre du dernier toucher, d'où « une fois sur deux ». Ces
 * navigateurs lèvent la restriction pour un ÉLÉMENT dont on a lancé la lecture
 * dans un geste : on garde donc un élément unique, on lui fait « jouer » un
 * silence au premier toucher de la page, et toutes les lectures suivantes
 * (changer son `src`, rejouer) passent sans geste. L'application (Capacitor)
 * n'a pas cette restriction ; le déblocage y est sans effet.
 */

type Playing = {
  audio: HTMLAudioElement;
  owner: number;
  /** Numéro de CETTE lecture : l'élément est partagé, il ne dit pas laquelle finit. */
  id: number;
  done: () => void;
};

let playing: Playing | null = null;
let nextOwner = 1;
let nextPlay = 1;
let shared: HTMLAudioElement | null = null;
let unlocked = false;

/** Un wav de 0,05 s de silence : de quoi faire « jouer » l'élément dans un geste. */
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function sharedAudio(): HTMLAudioElement {
  if (!shared) {
    shared = new Audio();
    shared.preload = "auto";
  }
  return shared;
}

/**
 * Lancé dans un geste de l'enfant : l'élément partagé joue un silence, ce qui
 * lève la restriction de lecture automatique pour lui. Sans effet si un son
 * joue déjà (l'élément est alors débloqué de fait).
 */
function unlock() {
  if (unlocked) return;
  if (playing) {
    unlocked = true;
    return;
  }
  unlocked = true;
  try {
    const audio = sharedAudio();
    audio.src = SILENCE;
    // Rejetée (AbortError) à la coupure juste après : seul l'appel dans le
    // geste compte pour le navigateur.
    void audio.play().catch(() => {});
    audio.pause();
  } catch {
    // Pas d'élément audio (rendu serveur, test) : rien à débloquer.
  }
}

if (typeof document !== "undefined") {
  // `touchend`, `pointerup`, `click` et `keydown` sont les gestes que les
  // navigateurs acceptent pour lever la restriction (`touchstart` et
  // `pointerdown` ne comptent pas partout, sur iOS notamment).
  const events = ["touchend", "pointerup", "click", "keydown"] as const;
  const onGesture = () => {
    unlock();
    for (const name of events) document.removeEventListener(name, onGesture, true);
  };
  for (const name of events) {
    document.addEventListener(name, onGesture, { capture: true, passive: true });
  }
}

/** Un jeton de propriétaire, à tirer une fois par composant. */
export function newVoiceOwner(): number {
  return nextOwner++;
}

/** Arrête le son en cours ; avec `owner`, seulement s'il est à lui. */
export function stopPlaying(owner?: number) {
  if (!playing) return;
  if (owner !== undefined && playing.owner !== owner) return;
  const current = playing;
  playing = null;
  current.audio.pause();
  current.done();
}

/** Joue une URL après avoir coupé le son en cours. Vrai si le son est allé au bout. */
export function playUrl(url: string, owner: number, rate: number): Promise<boolean> {
  stopPlaying();
  return new Promise((resolve) => {
    const audio = sharedAudio();
    const id = nextPlay++;
    let settled = false;
    const done = (finished = false) => {
      if (settled) return;
      settled = true;
      audio.onended = null;
      audio.onerror = null;
      if (playing?.id === id) playing = null;
      resolve(finished);
    };
    playing = { audio, owner, id, done: () => done(false) };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    audio.src = url;
    // Après `src` : changer de source remet la vitesse à sa valeur par défaut.
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    audio.play().catch(() => done(false));
  });
}
