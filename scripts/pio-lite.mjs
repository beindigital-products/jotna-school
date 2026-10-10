#!/usr/bin/env node
// Les affiches de Pio pour la page d'accueil : des WebP légers, à partir des PNG d'origine.
//
// Usage : node scripts/pio-lite.mjs
//
// Les PNG de `public/images/pio/` pèsent 500 à 600 Ko chacun : trop pour une
// page d'accueil que l'on ouvre sur un téléphone, avec une donnée chère. Ce
// script en tire des WebP de 640 pixels de haut (le double du plus grand Pio
// de la page, pour les écrans à forte densité), avec leur fond transparent,
// dans `public/images/pio/lite/<pose>.webp` : 40 à 50 Ko chacun.
//
// Ce sont les images que `components/student/pio.tsx` sert avec `lite` : la
// pose affichée tant qu'aucun clip ne joue, et quand l'appareil est modeste
// (`hooks/use-device-tier.ts`) ou que l'enfant a demandé moins de mouvement.
// La largeur suit le PNG d'origine : les poses n'ont pas toutes le même ratio.
//
// LES COULEURS DES BORDS SONT REPRISES AVANT L'ENCODAGE. Détourées d'un fond bleu
// (`scripts/pio-still.sh`), les poses gardent du bleu sous leurs pixels
// transparents. Un WebP avec perte découpe l'image en blocs et partage la
// couleur entre voisins : le bleu coulait dans la crinière orange, et Pio
// avait un liseré violet sur un fond clair. Le script remplace donc la couleur
// de ces pixels par celle du bord opaque le plus proche (la forme, elle, ne
// bouge pas : le canal alpha est intact) avant de passer l'image à ffmpeg.
//
// Seule la tenue de tous les jours en a besoin : la page d'accueil ne montre
// pas le boubou. Il faut ffmpeg avec libwebp (celui de `scripts/pio-encode.sh`).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public/images/pio/lite");
const POSES = ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep"];
const HEIGHT = 640;

/** Ce qu'on croit d'un pixel : sa couleur est sûre à partir de cette opacité. */
const SOLID = 200;
/** Combien de pixels la couleur du bord déborde dans le vide complet (un bloc de WebP en fait 16). */
const REACH_VOID = 16;
/** Et dans le semi-transparent (une ombre au sol) : juste le liseré du contour. */
const REACH_SOFT = 3;

/**
 * Remplace la couleur des pixels non sûrs par celle des pixels sûrs les plus proches. L'alpha ne change pas.
 *
 * @param {Uint8Array} rgba les pixels, quatre octets chacun (rouge, vert, bleu, alpha), modifiés sur place
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array} le même tableau
 */
export function bleedEdges(rgba, width, height) {
  const known = new Uint8Array(width * height);
  for (let i = 0; i < known.length; i++) known[i] = rgba[i * 4 + 3] >= SOLID ? 1 : 0;

  for (let step = 1; step <= REACH_VOID; step++) {
    const next = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (known[i]) continue;
        const alpha = rgba[i * 4 + 3];
        if (alpha > 0 && step > REACH_SOFT) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if ((dx === 0 && dy === 0) || nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const j = ny * width + nx;
            if (!known[j]) continue;
            r += rgba[j * 4]; g += rgba[j * 4 + 1]; b += rgba[j * 4 + 2]; n++;
          }
        }
        if (n > 0) next.push(i, Math.round(r / n), Math.round(g / n), Math.round(b / n));
      }
    }
    if (next.length === 0) break;
    // Les pixels trouvés à ce tour ne servent qu'au tour suivant : le bord avance d'un pixel à la fois.
    for (let k = 0; k < next.length; k += 4) {
      const i = next[k];
      rgba[i * 4] = next[k + 1]; rgba[i * 4 + 1] = next[k + 2]; rgba[i * 4 + 2] = next[k + 3];
      known[i] = 1;
    }
  }
  return rgba;
}

function ffmpeg(args, input) {
  const run = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { input, maxBuffer: 1 << 28 });
  if (run.status !== 0) throw new Error(`ffmpeg a échoué : ${run.stderr?.toString() ?? run.error}`);
  return run.stdout;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(out, { recursive: true });
  for (const pose of POSES) {
    const source = path.join(root, `public/images/pio/${pose}.png`);
    const png = readFileSync(source);
    // L'en-tête d'un PNG dit sa taille : octets 16 à 23.
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const raw = ffmpeg(["-i", source, "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
    const cleaned = bleedEdges(Buffer.from(raw), width, height);
    const target = path.join(out, `${pose}.webp`);
    ffmpeg(
      [
        "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-i", "-",
        "-vf", `scale=-2:${HEIGHT}:flags=lanczos`,
        "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", "-pix_fmt", "yuva420p",
        target,
      ],
      cleaned,
    );
    console.log(`${pose} : ${statSync(target).size} octets`);
  }
}
