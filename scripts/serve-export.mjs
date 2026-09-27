// Sert le dossier `out/` de l'export statique, avec `index.html` pour les
// chemins en `/` (trailingSlash) — assez pour regarder le site dans le
// navigateur intégré. Usage : node serve-out.mjs <port> <dossier>
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const port = Number(process.argv[2] ?? 4173);
const root = process.argv[3];
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, path);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
  } catch {
    // Route inconnue : la 404 de Next.
    file = join(root, "404.html");
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("introuvable");
  }
}).listen(port, () => console.log(`export statique servi sur http://localhost:${port}`));
