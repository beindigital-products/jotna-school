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
 */

let playing: { audio: HTMLAudioElement; owner: number; done: () => void } | null = null;
let nextOwner = 1;

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
    const audio = new Audio(url);
    audio.playbackRate = rate;
    let settled = false;
    const done = (finished = false) => {
      if (settled) return;
      settled = true;
      if (playing?.audio === audio) playing = null;
      resolve(finished);
    };
    playing = { audio, owner, done: () => done(false) };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    audio.play().catch(() => done(false));
  });
}
