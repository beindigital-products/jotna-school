// Copie les médias de l'application (../public) dans motion/public/app.
// Remotion ne suit pas les liens symboliques de son dossier public, d'où la copie.
// Le dossier de destination est ignoré par git : on le régénère avant chaque rendu.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appPublic = join(here, "..", "..", "public");
const target = join(here, "..", "public", "app");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const entry of ["images", "videos", "sounds", "jotna-logo.png"]) {
  // Les .mov (HEVC pour iOS) ne servent pas : la vidéo lit les .webm à canal alpha.
  cpSync(join(appPublic, entry), join(target, entry), { recursive: true, dereference: true, filter: (src) => !src.endsWith(".mov") });
}
console.log(`Médias copiés dans ${target}`);
