import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique : le bundle est embarque dans l'app Capacitor.
  // Aucune route dynamique [id] ne survit a ce mode, d'ou les query params.
  output: "export",
  // Le webview Capacitor sert des fichiers : /student/home doit resoudre
  // vers student/home/index.html, pas student/home.html.
  trailingSlash: true,
  // Pas de serveur pour optimiser les images a la volee.
  images: { unoptimized: true },
};

export default nextConfig;
