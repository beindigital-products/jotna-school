/**
 * LES SONS DE PIO SUR LE TÉLÉPHONE.
 *
 * Chaque son téléchargé est un fichier (`clips/<id>.mp3`) : `<id>` est celui du
 * fichier sur le serveur, donc deux références qui disent le même texte (le
 * nom d'une lettre, et cette lettre comme item de leçon) partagent le même
 * fichier. La table `clips/map.json` dit quelle référence joue quel fichier.
 *
 * Partagé par tous les élèves de l'appareil : la voix d'une consigne de CP
 * est la même pour deux frères.
 *
 * `clipUrl` est ce que les lecteurs appellent avant de jouer
 * (`components/exercises/prompt-reader.tsx`, `components/arabic/speech.ts`) :
 * un son déjà là se joue sans réseau.
 */
import { listFiles, playableUrl, readJson, writeBlob, writeJson } from "./files";

const MAP_PATH = "clips/map.json";

type ClipMap = Record<string, string>;

let mapPromise: Promise<ClipMap> | null = null;
let mapWrite: Promise<void> = Promise.resolve();

function loadMap(): Promise<ClipMap> {
  mapPromise ??= readJson<ClipMap>(MAP_PATH).then((map) => map ?? {});
  return mapPromise;
}

function fileOf(clipId: string): string {
  return `clips/${clipId}.mp3`;
}

/** L'adresse jouable d'un son téléchargé, ou `null` s'il n'est pas sur l'appareil. */
export async function clipUrl(key: string): Promise<string | null> {
  const map = await loadMap();
  const clipId = map[key];
  if (!clipId) return null;
  return await playableUrl(fileOf(clipId));
}

/** Les clés déjà téléchargées parmi `keys`. */
export async function knownClipKeys(keys: readonly string[]): Promise<Set<string>> {
  const map = await loadMap();
  return new Set(keys.filter((key) => map[key] !== undefined));
}

/** Les fichiers de sons présents (pour ne pas retélécharger un fichier partagé). */
export async function storedClipIds(): Promise<Set<string>> {
  const names = await listFiles("clips");
  return new Set(names.filter((n) => n.endsWith(".mp3")).map((n) => n.slice(0, -4)));
}

/** Range un son téléchargé et le relie à ses références. */
export async function saveClip(clipId: string, blob: Blob | null, keys: readonly string[]): Promise<void> {
  if (blob) await writeBlob(fileOf(clipId), blob);
  const map = await loadMap();
  for (const key of keys) map[key] = clipId;
  // Les écritures de la table s'enchaînent : deux téléchargements parallèles
  // ne s'écrasent pas l'un l'autre.
  mapWrite = mapWrite.then(() => writeJson(MAP_PATH, map)).catch(() => {});
  await mapWrite;
}

/** Relie des références à un fichier déjà présent, sans le retélécharger. */
export async function linkClip(clipId: string, keys: readonly string[]): Promise<void> {
  await saveClip(clipId, null, keys);
}
