import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const poppins = Poppins({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// D16 — display font for kid surfaces (h1/h2 in /student/*).
// Variable axis = weight; only Latin subset (~40kb gzip).
const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// `viewportFit: "cover"` : dans l'application Capacitor, le webview dessine
// sous la barre d'état et l'îlot dynamique. Sans cette valeur,
// `env(safe-area-inset-top)` vaut zéro et rien ne peut s'en écarter — le HUD
// de l'espace élève passait sous l'horloge iOS. Sur le web, aucun effet.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Jotna School - Apprends en t'amusant",
  description:
    "Plateforme educative gamifiee pour apprendre les matieres scolaires avec des exercices interactifs, des badges et un suivi parental.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
