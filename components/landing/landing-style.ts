/**
 * LE DÉCOR DE LA VITRINE : la page d'accueil se passe dans le monde du jeu.
 *
 * Trois matières reviennent d'une section à l'autre : le cadre de bois, la
 * feuille de papier posée dedans, et le bouton épais du jeu (`btn-chunky`,
 * `app/globals.css`). Leurs classes sont ici, pour que les sections portent le
 * même bois et le même papier.
 */

/** Le cadre de bois qui entoure un écran de jeu ou un aperçu. */
export const WOOD =
  "rounded-[28px] bg-gradient-to-b from-[#8a4b1f] to-[#5e3112] p-2.5 shadow-[0_6px_0_rgba(94,49,18,0.22),0_18px_30px_-14px_rgba(43,29,14,0.45)] sm:p-3";

/** La feuille de papier, dans le cadre. */
export const SHEET = "rounded-[18px] bg-[#fff8e7] p-4 sm:p-6";

/** Une carte de papier clair, bordée, hors cadre. */
export const CARD = "rounded-3xl border-2 border-[#ecd9ac] bg-[#fffdf7]";

const BTN_BASE =
  "btn-chunky inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display text-base font-semibold outline-none focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60 sm:text-lg";

/** Le bouton principal : soleil. */
export const BTN_SUN = `${BTN_BASE} bg-savanna-sun text-[#2b1d0e] [--btn-depth:#c97f00]`;
/** Le bouton secondaire : papier. */
export const BTN_PAPER = `${BTN_BASE} bg-[#fffdf7] text-[#2b1d0e] [--btn-depth:#ecd9ac]`;
/** Le bouton « continuer » du jeu : feuille. */
export const BTN_LEAF = `${BTN_BASE} bg-savanna-leaf-deep text-white [--btn-depth:#25591b]`;

/** Le sélecteur à pastilles (Parent / Professeur / École). */
export const SEGMENT = "inline-flex max-w-full rounded-full p-1";
export const SEGMENT_ITEM =
  "rounded-full px-3.5 py-1.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1e2a4a] sm:px-4";
