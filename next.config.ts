import type { NextConfig } from "next";

// Deux cibles, un seul code (`lib/build-target.ts`) : `JOTNA_TARGET=app`
// construit l'application iOS/Android, avec l'espace eleve ; sans elle,
// `next build` construit le site web, qui n'en contient rien. Les pages
// eleve portent l'extension `.app.tsx` : seule la cible `app` les lit.
const target = process.env.JOTNA_TARGET === "app" ? "app" : "web";

const nextConfig: NextConfig = {
  // Export statique : le bundle est embarque dans l'app Capacitor.
  // Aucune route dynamique [id] ne survit a ce mode, d'ou les query params.
  output: "export",
  // Le webview Capacitor sert des fichiers : /student/home doit resoudre
  // vers student/home/index.html, pas student/home.html.
  trailingSlash: true,
  // Pas de serveur pour optimiser les images a la volee.
  images: { unoptimized: true },
  pageExtensions:
    target === "app"
      ? ["app.tsx", "app.ts", "tsx", "ts", "jsx", "js"]
      : ["tsx", "ts", "jsx", "js"],
  // Meme regle pour les modules : dans l'application, `x.app.tsx` remplace
  // `x.tsx` a l'import. Le hors-ligne s'en sert (`docs/hors-ligne.md`) : le
  // site importe une version vide, et n'embarque pas le moteur.
  turbopack:
    target === "app"
      ? { resolveExtensions: [".app.tsx", ".app.ts", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"] }
      : undefined,
  env: { NEXT_PUBLIC_JOTNA_TARGET: target },
};

export default nextConfig;
