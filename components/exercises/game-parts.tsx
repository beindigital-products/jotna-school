"use client";

import { AlertTriangle, Check } from "lucide-react";
import { useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ActionButton3D, SceneActionBar, useSceneDock, type ActionToneName } from "@/components/student/game-kit";
import ExercisePrompt from "./ExercisePrompt";
import { toggleReader, usePromptReader } from "./prompt-reader";

/**
 * Les pièces communes des écrans de jeu (frise, dessin, écoute, couleurs) :
 * la barre d'action (Écouter puis Valider), le bouton Valider et l'exercice
 * cassé, habillés comme le reste de la séance (`components/student/game-kit`).
 * Mêmes props qu'avant : les écrans qui les appellent n'ont rien à changer.
 *
 * TOUS LES ÉCRANS PASSENT PAR LA BARRE : les cinq d'origine (QCM, association,
 * mise en ordre, glisser-déposer, réponse courte) et la phrase à trous
 * entourent leur « Valider » d'`ExerciseActions` ; les quatre jeux fabriqués
 * par le code appellent `SubmitButton`, qui le fait pour eux. Dans la séance
 * (CI, CP), « Écouter » apparaît donc partout au même endroit ; dans les
 * aperçus des professeurs et sur la vitrine, sans lecteur, rien ne change.
 */

/**
 * LA BARRE D'ACTION D'UN EXERCICE : « Écouter » juste au-dessus de « Valider ».
 *
 * Dans un `PromptReaderProvider` (CI, CP), elle lit le lecteur de consignes et
 * pose le gros bouton bleu « Écouter l'énoncé » au-dessus du bouton principal
 * donné en enfant ; un toucher relit, un second arrête. Ailleurs, elle ne rend
 * que l'enfant : les plus grands et les aperçus des professeurs ne voient pas
 * de bouton Écouter. Sans enfant (un exercice qui se répond au toucher),
 * « Écouter » se pose seul au bas de la carte, et rien ne se rend sans lecteur.
 *
 * C'est la seule brique à brancher dans un écran d'exercice :
 *
 *   <ExerciseActions>
 *     <ActionButton3D onClick={submit} disabled={!ready} shine={ready}>Valider</ActionButton3D>
 *   </ExerciseActions>
 *
 * (`QcmExercise.tsx` est le modèle.) La mise en page vient de `SceneActionBar`
 * (`game-kit/scene-action-bar.tsx`) : une seule ligne (Écouter avec son mot
 * sur 42 % de la largeur, Valider sur le reste) sur un écran de 960 px de haut
 * ou moins, c'est-à-dire tous les téléphones debout ; deux rangées au-delà
 * (une tablette debout) ; `row` demande la ligne à toute hauteur, pour un
 * écran qui porte déjà un pavé de touches (la réponse courte en chiffres).
 *
 * EN SÉANCE, LA BARRE EST COLLÉE EN BAS DE L'ÉCRAN. La coque de la séance
 * (`session-stage.tsx`) offre un dock (`SceneDockProvider`,
 * `game-kit/scene-dock.tsx`) : quand il existe, la barre S'Y TÉLÉPORTE
 * (`createPortal`) au lieu de se poser au fond de la carte, et se déclare
 * occupante pour que le panneau se montre. Sans dock (la vitrine, les aperçus
 * des professeurs, la galerie), elle reste en ligne, comme ici. L'écran
 * d'exercice n'en sait rien : il écrit `<ExerciseActions>` dans les deux cas.
 */
export function ExerciseActions({ children, row, className }: { children?: ReactNode; row?: boolean; className?: string }) {
  const reader = usePromptReader();
  const dock = useSceneDock();
  const listen = reader ? { status: reader.status, onPress: () => toggleReader(reader) } : null;
  // Rien à montrer (ni voix, ni Valider) : rien n'occupe le dock, et la barre
  // en ligne ne rend rien non plus (`SceneActionBar`).
  const docked = dock !== null && (listen !== null || Boolean(children));
  const occupy = dock?.occupy;
  useLayoutEffect(() => {
    if (!docked || !occupy) return;
    return occupy();
  }, [docked, occupy]);
  const bar = (
    <SceneActionBar listen={listen} row={row} className={className}>
      {children}
    </SceneActionBar>
  );
  // L'emplacement n'existe pas encore le temps du tout premier rendu de la
  // coque : plutôt rien qu'une barre qui apparaîtrait dans la carte puis
  // sauterait en bas une image plus tard.
  if (docked) return dock.slot ? createPortal(bar, dock.slot) : null;
  return bar;
}

/**
 * « Valider », épais et orange (`ActionButton3D`), DANS LA BARRE D'ACTION :
 * les quatre écrans de jeu (frise, couleurs, écoute, dessin) l'appellent, et
 * reçoivent par lui le bouton « Écouter » au-dessus de Valider. Tant que la
 * réponse n'est pas prête il est plat et pâle ; dès qu'elle l'est, il se
 * redresse et son reflet appelle l'enfant. `tone` : orange partout ; une
 * autre teinte reste possible, mais le bleu ciel est celui d'« Écouter ».
 */
export function SubmitButton({
  onClick,
  disabled,
  label = "Valider",
  tone = "orange",
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
  tone?: ActionToneName;
  icon?: ReactNode;
}) {
  return (
    <ExerciseActions>
      <ActionButton3D
        onClick={onClick}
        disabled={disabled}
        tone={tone}
        shine={!disabled}
        icon={icon ?? <Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
      >
        {label}
      </ActionButton3D>
    </ExerciseActions>
  );
}

/** Un exercice illisible ne bloque jamais l'enfant : on le saute, sans pénalité. */
export function BrokenExercise({
  prompt,
  onSkip,
  disabled,
  message = "Cet exercice est cassé, on te le saute.",
}: {
  prompt: string;
  onSkip?: () => void;
  disabled: boolean;
  message?: string;
}) {
  return (
    <div className="space-y-4">
      <ExercisePrompt prompt={prompt} />
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
        <p className="font-display font-extrabold text-amber-900">{message}</p>
        <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
        <ActionButton3D tone="white" size="md" onClick={() => onSkip?.()} disabled={disabled} className="mt-1 max-w-xs">
          Suivant
        </ActionButton3D>
      </div>
    </div>
  );
}

/**
 * Le cadre d'une zone de réponse selon le verdict : citron vert et un
 * gonflement quand c'est juste, ambre et un « non » de la tête quand c'est
 * faux (jamais rouge : à six ans, l'erreur est une étape), crème sinon.
 */
export function verdictClasses(isCorrect: boolean | null): string {
  if (isCorrect === true) return "border-lime-300 bg-[#f7fee7] animate-[gk-pop_0.45s_ease-out]";
  if (isCorrect === false) return "border-amber-300 bg-[#fffbeb] animate-[gk-shake-soft_0.45s_ease-in-out]";
  return "border-white bg-[#fff8e6]";
}

/** Les props communes des écrans d'exercice. */
export type ExerciseScreenProps<P> = {
  prompt: string;
  payload: P;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
};
