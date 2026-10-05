import type { SVGProps } from "react";

/**
 * Système d'icônes propre à la vitrine, dessiné pour remplacer les
 * pictogrammes génériques de lucide-react sur les emplacements qui
 * identifient une idée (persona, étape, statistique) plutôt qu'une action
 * d'interface (bouton, menu, champ — ceux-là restent lucide : ce sont des
 * conventions, pas une occasion créative).
 *
 * Un seul principe tient les huit icônes ensemble : chaque dessin est un
 * contour (`stroke`, 1.8, bouts et jonctions arrondis — le même grammage que
 * lucide, pour que les deux familles cohabitent sans heurt) PLUS une unique
 * forme pleine, qui marque le point qui compte (l'astre d'une réussite, le
 * battement d'un cœur, la matière choisie, le médaillon d'un trophée, le
 * pivot d'une jauge, la braise d'une flamme). Cette forme pleine est la
 * signature du jeu : elle ne varie jamais de principe, seulement de sens.
 */
type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Pour les enfants : un livre ouvert, et l'étincelle de ce qu'on y découvre. */
export function KidIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 7v12.5" />
      <path d="M12 7.4c-1.8-1.1-4.1-1.6-6.1-1.3-.9.1-1.4.9-1.4 1.8v8.3c0 1 .8 1.7 1.7 1.5 1.9-.4 4.1.1 5.8 1.2" />
      <path d="M12 7.4c1.8-1.1 4.1-1.6 6.1-1.3.9.1 1.4.9 1.4 1.8v8.3c0 1-.8 1.7-1.7 1.5-1.9-.4-4.1.1-5.8 1.2" />
      <path
        d="M12 2 12.56 3.43 14.09 3.52 12.9 4.49 13.29 5.98 12 5.15 10.71 5.98 11.1 4.49 9.91 3.52 11.44 3.43Z"
        fill="currentColor"
        stroke="none"
      />
    </IconBase>
  );
}

/** Pour les parents : suivre avec affection, pas avec surveillance. */
export function ParentHeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 19.3C9 16.9 4.5 13.5 4.5 8.9 4.5 6.3 6.6 4.5 9 4.5c1.3 0 2.5.6 3 1.7.5-1.1 1.7-1.7 3-1.7 2.4 0 4.5 1.8 4.5 4.4 0 4.6-4.5 8-7.5 10.4Z" />
      <circle cx="12" cy="12.6" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** Pour les professeurs : la planchette de suivi, et l'item vérifié. */
export function TeacherIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M8 11.3h9" />
      <path d="M11 15.3h5" />
      <circle cx="9" cy="15.3" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** Étape 1 : le billet qui porte le code de connexion. */
export function LoginTicketIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" />
      <path d="M15 6.5v11" strokeDasharray="2.2 2.2" />
      <circle cx="17.3" cy="9.6" r="0.9" />
      <circle cx="17.3" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.3" cy="14.4" r="0.9" />
    </IconBase>
  );
}

/** Étape 2 : la matière qu'on choisit parmi les autres. */
export function SubjectsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="7.5" height="7.5" rx="2" />
      <rect x="12.5" y="4" width="7.5" height="7.5" rx="2" />
      <rect x="4" y="12.5" width="7.5" height="7.5" rx="2" />
      <rect
        x="12.5"
        y="12.5"
        width="7.5"
        height="7.5"
        rx="2"
        fill="currentColor"
        stroke="none"
      />
    </IconBase>
  );
}

/** Étape 3, badges, et le trophée de la maîtrise partout ailleurs. */
export function TrophyRibbonIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 5h10v4a5 5 0 0 1-10 0V5Z" />
      <path d="M7 6.5H5.5a1.8 1.8 0 1 0 0 3.6H7" />
      <path d="M17 6.5h1.5a1.8 1.8 0 1 1 0 3.6H17" />
      <path d="M12 14v2.5" />
      <path d="M9.5 16.5h5l.8 3h-6.6Z" />
      <path d="M8.5 19.5h7" />
      <circle cx="12" cy="8.3" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** La jauge de maîtrise, pour la carte "Maîtrise" de la gamification. */
export function MasteryGaugeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 16.5a7.5 7.5 0 1 1 15 0" />
      <path d="M12 16.5 15.5 11" />
      <circle cx="12" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** La série quotidienne : une flamme, et sa braise. */
export function StreakFlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3C9 7 6 10 6 14a6 6 0 0 0 12 0c0-3-1.2-5.5-3-7.5.3 1.8-.4 3-1.5 3.5C14 7.5 13 5 12 3Z" />
      <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
