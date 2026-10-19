import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";

// Les trois polices de l'application (app/layout.tsx) : Poppins pour le site,
// Fredoka pour les titres de l'espace élève, Amiri pour l'arabe.
export const FONT = loadPoppins("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

export const DISPLAY = loadFredoka("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const ARABIC = loadAmiri("normal", {
  weights: ["400", "700"],
  subsets: ["arabic"],
}).fontFamily;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Couleurs Tailwind utilisées par la landing et les tableaux de bord.
export const C = {
  ink: "#101828",
  ink2: "#1e2939",
  slate: "#364153",
  muted: "#6a7282",
  body: "#4a5565",
  faint: "#99a1af",
  line: "#f3f4f6",
  line2: "#e5e7eb",
  bg: "#ffffff",
  paper: "#fffdf8",
  cream: "#fff8ec",
  amber50: "#fffbeb",
  amber100: "#fef3c6",
  amber200: "#fee685",
  amber300: "#ffd230",
  amber400: "#ffb900",
  amber500: "#fe9a00",
  amber600: "#e17100",
  amber700: "#bb4d00",
  amber800: "#973c00",
  orange50: "#fff7ed",
  orange100: "#ffedd4",
  orange200: "#ffd6a7",
  orange300: "#ffb86a",
  orange400: "#ff8904",
  orange500: "#ff6900",
  orange600: "#f54900",
  orange700: "#ca3500",
  yellow200: "#fff085",
  yellow300: "#fde047",
  lime50: "#f7fee7",
  lime100: "#ecfcca",
  lime200: "#d8f999",
  lime300: "#bbf451",
  lime400: "#9ae600",
  lime500: "#7ccf00",
  lime600: "#5ea500",
  lime700: "#497d00",
  emerald50: "#ecfdf5",
  emerald100: "#d1fae5",
  emerald400: "#00d492",
  emerald500: "#00bc7d",
  emerald600: "#009966",
  emerald700: "#007a55",
  sky50: "#f0f9ff",
  sky100: "#dff2fe",
  sky500: "#0ea5e9",
  sky600: "#0284c7",
  violet100: "#ede9fe",
  violet500: "#8b5cf6",
  violet600: "#7c3aed",
  rose100: "#ffe4e6",
  rose500: "#ff2056",
  red500: "#ef4444",
  // Palette « savane » du monde de Pio (app/globals.css).
  sky: "#7ec8f5",
  skyDeep: "#3aa0e8",
  sand: "#f6c452",
  sandDeep: "#e9a83a",
  sun: "#ffb020",
  leaf: "#6ab04c",
  leafDeep: "#3f8a2f",
  earth: "#a5602c",
  night: "#1e2a4a",
} as const;

export const SHADOW = {
  card: "0 1px 2px rgba(17,24,39,0.04), 0 12px 32px -12px rgba(17,24,39,0.12)",
  float: "0 30px 80px -24px rgba(17,24,39,0.28), 0 8px 24px -8px rgba(17,24,39,0.12)",
  glowAmber: "0 20px 60px -20px rgba(245,192,38,0.45)",
};
