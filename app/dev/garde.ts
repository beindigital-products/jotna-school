/**
 * LES PAGES DE DÉVELOPPEMENT (`app/dev/*`) : la galerie des exercices et la
 * séance factice. De quoi VOIR chaque écran d'exercice dans chacun de ses
 * états, sur le web comme dans le webview de l'application, sans compte et
 * sans rien demander au serveur. Le banc d'essai du chantier « les exercices
 * sont un vrai jeu » ; les captures en sortent (`scripts/shoot-exercises.mjs`).
 *
 * ELLES N'EXISTENT QU'EN DÉVELOPPEMENT (`pnpm dev`), ou dans un export
 * construit avec `NEXT_PUBLIC_EXERCISE_GALLERY=1`. Les deux valeurs sont
 * figées au moment du build : en production sans la variable, chaque page
 * appelle `notFound()` dès le pré-rendu et son HTML est celui de la 404.
 *
 * LEUR CODE, LUI, RESTE DANS L'EXPORT. Une route exportée garde ses morceaux
 * même quand elle rend la 404 : mesuré sur un build sans la variable (relu le
 * 18 octobre 2026, fermeture transitive des morceaux que seules ces pages
 * chargent), TREIZE morceaux propres au dev dans `out/_next/static/chunks`
 * (317 604 octets : les deux morceaux d'entrée en chargent d'autres, qui
 * portent des copies du kit, de Pio et du barème) et 104 388 octets de HTML et
 * de RSC sous `out/dev/`, soit environ 412 Ko sur 54 Mo d'export (une première
 * mesure, qui ne comptait que les six morceaux d'entrée, disait 114 Ko) ;
 * `capacitor.config.ts` embarque `out/`, donc l'application et ses mises à
 * jour à distance les portent aussi. Aucune page de l'élève ne les
 * référence : sur le web, l'enfant ne les télécharge pas ; dans
 * l'application, ils sont embarqués mais jamais chargés, sauf à ouvrir
 * `/dev/...` à la main (ce qui rend la 404). Les sortir tout à fait
 * demanderait d'importer ces écrans dynamiquement derrière la garde, ou un
 * `pageExtensions` propre au dev, et de le vérifier sur un build : à faire
 * quand le poids comptera.
 */
export const DEV_PAGES_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_EXERCISE_GALLERY === "1";
