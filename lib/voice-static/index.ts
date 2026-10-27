/**
 * LES SONS DANS L'APPLICATION : des mp3 livrés avec elle (`public/voix/`), que le lecteur essaie AVANT le serveur.
 *
 * Pourquoi : un son embarqué ne coûte aucun appel à ElevenLabs, ne demande aucun réseau (ni en ligne, ni hors ligne, ni
 * au premier lancement) et se joue plus vite que le son téléchargé. C'est fait pour un ensemble FERMÉ et stable : les six
 * thématiques d'alphabet (`lib/voice-static/set.ts`, 300 textes environ). Tout le reste passe par le cache du serveur
 * (`offline/voice.prepareClips`), inchangé.
 *
 * La table `manifest.ts` est écrite par `scripts/build-voix-statique.mjs`, jamais à la main : elle dit quel fichier dit
 * quel texte, avec quelle voix et quel modèle. La clé est le texte DIT (`speakableTile`), celui que le serveur
 * synthétiserait : « bee », « eff, ei, tee, oh, you ».
 *
 * CE MODULE EST CELUI DES ÉCRANS ET DU SERVEUR : il ne tire que la table et `speakableTile`, jamais les gabarits
 * d'exercices. Ses imports sont RELATIFS (pas d'alias `@/`) et la table est du TypeScript, pas du JSON : Convex le
 * regroupe avec `voice/warm.ts`, qui saute les sons que l'application embarque déjà.
 */
import { speakableTile } from "../../convex/voice/tiles";
import { STATIC_VOICE_MANIFEST } from "./manifest";

/** Là où `next build` copie `public/voix/` (le web comme l'application Capacitor servent la racine). */
export const STATIC_VOICE_DIR = "/voix/";

export type StaticVoiceManifest = {
  /** La voix et le modèle qui ont dit ces sons : ceux du serveur, sinon la voix change d'un mot à l'autre. */
  voiceId: string;
  modelId: string;
  /** Le texte dit -> le nom du fichier dans `public/voix/`. */
  clips: Record<string, string>;
};

const table: StaticVoiceManifest = STATIC_VOICE_MANIFEST;

/** Les sons embarqués qui n'ont pas pu se jouer : on n'insiste pas, le serveur prend le relais. */
const failed = new Set<string>();

/** L'adresse du son embarqué qui dit ce texte, ou `null` s'il n'y en a pas (ou s'il ne se joue pas). */
export function staticVoiceUrl(spoken: string | null): string | null {
  if (spoken === null || failed.has(spoken)) return null;
  const file = Object.hasOwn(table.clips, spoken) ? table.clips[spoken] : undefined;
  return file ? `${STATIC_VOICE_DIR}${file}` : null;
}

/**
 * Le son embarqué d'une tuile de l'écran, ou `null`. Seule une thématique d'anglais (`englishTopic`) a ces sons : ailleurs,
 * le même texte se dirait en français, avec une autre voix.
 */
export function staticTileUrl(text: string, englishTopic: boolean): string | null {
  if (!englishTopic) return null;
  return staticVoiceUrl(speakableTile(text, "en", true));
}

/** Ce son embarqué ne s'est pas joué (fichier absent, abîmé) : les demandes suivantes vont au serveur. */
export function staticTileFailed(text: string, englishTopic: boolean): void {
  if (!englishTopic) return;
  const spoken = speakableTile(text, "en", true);
  if (spoken !== null) failed.add(spoken);
}

/** Pour les tests : oublie les échecs. */
export function resetStaticVoiceFailures(): void {
  failed.clear();
}

export function staticVoiceManifest(): StaticVoiceManifest {
  return table;
}
