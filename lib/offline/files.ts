/**
 * LES FICHIERS DU HORS-LIGNE, SUR LE TÉLÉPHONE.
 *
 * Tout ce que l'application garde pour jouer sans réseau passe par ici : le
 * paquet (`pack/*.json`), le journal de ce que l'enfant a fait et que le
 * serveur n'a pas encore reçu (`outbox/*.json`), les sons de Pio
 * (`clips/*.mp3`).
 *
 * POURQUOI LE PLUGIN `@capacitor/filesystem` ET PAS `localStorage` OU
 * IndexedDB. La documentation de Capacitor le dit : iOS peut vider le stockage
 * d'une vue web quand le téléphone manque de place. Pour un cache, c'est un
 * désagrément ; pour le journal, c'est le travail d'un enfant qui disparaît
 * avant d'avoir atteint son maître. Le plugin écrit dans
 * `Library/NoCloud` (iOS) ou les fichiers de l'application (Android) : un
 * dossier qui n'est ni purgé ni sauvegardé dans iCloud — les sons se
 * retéléchargent, ils n'ont rien à faire dans une sauvegarde.
 *
 * Ce module ne tourne que dans la coque native (iOS, Android) : hors d'elle,
 * le hors-ligne reste éteint et le moteur ne se charge pas
 * (`components/offline/offline-provider.tsx`).
 *
 * UNE ÉCRITURE NE LAISSE JAMAIS UN FICHIER À MOITIÉ ÉCRIT. On écrit à côté
 * (`.tmp`), puis on remplace ; une lecture qui trouve le fichier absent ou
 * illisible reprend la copie d'à côté.
 */
import { Capacitor } from "@capacitor/core";
import type { Directory as DirectoryType } from "@capacitor/filesystem";

const ROOT = "jotna-offline";

type FilesystemModule = typeof import("@capacitor/filesystem");

let pluginPromise: Promise<FilesystemModule> | null = null;
function plugin(): Promise<FilesystemModule> {
  pluginPromise ??= import("@capacitor/filesystem");
  return pluginPromise;
}

async function directory(): Promise<DirectoryType> {
  const { Directory } = await plugin();
  return Directory.LibraryNoCloud;
}

function full(path: string): string {
  return `${ROOT}/${path}`;
}

async function readRaw(path: string): Promise<string | null> {
  const { Filesystem, Encoding } = await plugin();
  try {
    const result = await Filesystem.readFile({
      path: full(path),
      directory: await directory(),
      encoding: Encoding.UTF8,
    });
    return typeof result.data === "string" ? result.data : await result.data.text();
  } catch {
    return null;
  }
}

/** Le texte d'un fichier, ou `null` s'il n'existe pas. */
export async function readText(path: string): Promise<string | null> {
  const main = await readRaw(path);
  if (main !== null) return main;
  // Une écriture interrompue entre l'effacement et le renommage : la copie
  // d'à côté est complète.
  return await readRaw(`${path}.tmp`);
}

/** Le contenu JSON d'un fichier, ou `null` s'il n'existe pas ou ne se lit pas. */
export async function readJson<T>(path: string): Promise<T | null> {
  const text = await readText(path);
  if (text !== null) {
    try {
      return JSON.parse(text) as T;
    } catch {
      // Fichier principal abîmé : on tente la copie.
    }
  }
  const backup = await readRaw(`${path}.tmp`);
  if (backup === null) return null;
  try {
    return JSON.parse(backup) as T;
  } catch {
    return null;
  }
}

export async function writeText(path: string, text: string): Promise<void> {
  const { Filesystem, Encoding } = await plugin();
  const dir = await directory();
  const tmp = full(`${path}.tmp`);
  await Filesystem.writeFile({
    path: tmp,
    data: text,
    directory: dir,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  try {
    await Filesystem.deleteFile({ path: full(path), directory: dir });
  } catch {
    // Pas encore de fichier : rien à remplacer.
  }
  await Filesystem.rename({ from: tmp, to: full(path), directory: dir, toDirectory: dir });
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, JSON.stringify(value));
}

export async function removeFile(path: string): Promise<void> {
  const { Filesystem } = await plugin();
  const dir = await directory();
  for (const target of [full(path), full(`${path}.tmp`)]) {
    try {
      await Filesystem.deleteFile({ path: target, directory: dir });
    } catch {
      // Déjà parti.
    }
  }
}

/** Les noms des fichiers d'un dossier (sans les copies `.tmp` d'une écriture). */
export async function listFiles(dir: string): Promise<string[]> {
  const { Filesystem } = await plugin();
  try {
    const result = await Filesystem.readdir({ path: full(dir), directory: await directory() });
    const names = new Set<string>();
    for (const entry of result.files) {
      const name = typeof entry === "string" ? entry : entry.name;
      if (entry && typeof entry !== "string" && entry.type === "directory") continue;
      names.add(name.endsWith(".tmp") ? name.slice(0, -4) : name);
    }
    return [...names].sort();
  } catch {
    return [];
  }
}

export async function removeDir(dir: string): Promise<void> {
  const { Filesystem } = await plugin();
  try {
    await Filesystem.rmdir({ path: full(dir), directory: await directory(), recursive: true });
  } catch {
    // Déjà parti.
  }
}

export async function fileExists(path: string): Promise<boolean> {
  const { Filesystem } = await plugin();
  try {
    await Filesystem.stat({ path: full(path), directory: await directory() });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// LES SONS — des fichiers binaires, écrits en base64 (le seul format que le
// plugin accepte), relus par une adresse que la vue web sait jouer.
// ---------------------------------------------------------------------------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("lecture du son impossible"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

export async function writeBlob(path: string, blob: Blob): Promise<void> {
  const { Filesystem } = await plugin();
  await Filesystem.writeFile({
    path: full(path),
    data: await blobToBase64(blob),
    directory: await directory(),
    recursive: true,
  });
}

/** Les adresses déjà calculées : une par fichier, pour la durée de la page. */
const urlCache = new Map<string, string>();

/**
 * Une adresse que `new Audio(url)` sait jouer : le fichier est servi par la
 * vue web elle-même (`Capacitor.convertFileSrc`), sans le relire.
 */
export async function playableUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path);
  if (cached) return cached;
  const { Filesystem } = await plugin();
  const dir = await directory();
  try {
    const { uri } = await Filesystem.getUri({ path: full(path), directory: dir });
    const url = Capacitor.convertFileSrc(uri);
    urlCache.set(path, url);
    return url;
  } catch {
    return null;
  }
}
