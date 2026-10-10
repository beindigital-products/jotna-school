"use client";

import { useId, type ReactNode } from "react";
import { BookOpen, Sparkles } from "lucide-react";

import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import type { ExerciseType } from "@/convex/exerciseTypes";
import { TYPE_INFO } from "../exercise-catalog";
import { classicTypesFor, gamesFor } from "./demo-matrix";
import { STAGE_LABELS, type DemoClass, type DemoSubject, type Stage } from "./demo-types";
import { TYPE_STYLE } from "./type-style";

/**
 * LE CADRE D'UNE CARTE D'EXERCICE : le type, sa phrase, la thématique du
 * programme et le niveau de l'exemple, puis l'exercice lui-même (`children`).
 *
 * MODULE LÉGER, rendu dès le pré-rendu de la vitrine : les cartes qui attendent
 * leurs exercices (`CardShells`) montrent déjà ce que la classe propose.
 */

// Un exercice jouable a besoin de place : une colonne jusqu'à `lg` (les cartes
// restent lisibles sur tablette), deux dès `lg`, et la dernière rangée CENTRÉE :
// cinq cartes ou une seule ne laissent pas un trou à droite.
const CARD_WIDTH = "w-full max-w-2xl lg:w-[calc(50%-0.5rem)] lg:max-w-none";

/** Quatre points, autant de pleins que le niveau : « ●●○○ Consolidation ». */
function StageTag({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
      <span aria-hidden className="flex gap-0.5">
        {([1, 2, 3, 4] as const).map((dot) => (
          <span
            key={dot}
            className={`size-1.5 rounded-full ${dot <= stage ? "bg-amber-500" : "bg-gray-200"}`}
          />
        ))}
      </span>
      <span className="sr-only">Niveau de difficulté :</span>
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function CardFrame({
  kind,
  description,
  topic,
  stage,
  children,
}: {
  kind: ExerciseType;
  /** Remplace la phrase du type : un jeu dit sa variante (« Suite de nombres »). */
  description?: string;
  topic?: string;
  stage?: Stage;
  children: ReactNode;
}) {
  const info = TYPE_INFO[kind];
  const style = TYPE_STYLE[kind];
  const titleId = useId();

  return (
    <StaggerItem
      // Un groupe nommé par son titre : un lecteur d'écran annonce « Questions à
      // choix multiples » en entrant dans la carte, et les écrans d'exercice
      // qu'elle contient gardent leurs propres titres.
      role="group"
      aria-labelledby={titleId}
      className={`flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-lg sm:p-6 ${CARD_WIDTH}`}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        <span className={`size-1.5 rounded-full bg-current ${style.accent}`} />
        {info.label}
      </span>
      <h4 id={titleId} className="mt-4 text-lg font-extrabold text-gray-900">
        {info.title}
      </h4>
      <p className="mt-1.5 text-sm leading-6 text-gray-600">{description ?? info.description}</p>
      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
        {topic && (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
            <BookOpen className="size-3.5 flex-none text-gray-400" aria-hidden />
            <span className="sr-only">Thématique :</span>
            <span className="truncate">{topic}</span>
          </span>
        )}
        {stage && <StageTag stage={stage} />}
      </div>
      {/* `flex-1` : dans une rangée de deux cartes, la zone teintée descend jusqu'au bas de la carte. */}
      <div
        className={`mt-4 flex-1 rounded-2xl bg-gradient-to-br ${style.tint} p-1 ring-1 ring-inset ring-white/60 sm:p-4`}
      >
        {children}
      </div>
    </StaggerItem>
  );
}

/**
 * UN LOT QUI N'ARRIVE PAS (le réseau tombe) ne doit pas emporter la page
 * d'accueil avec lui : la section dit ce qui s'est passé et propose de
 * réessayer.
 */
export function LoadFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-md rounded-3xl bg-amber-50 p-6 text-center text-sm leading-6 text-amber-950 ring-1 ring-amber-200"
    >
      <p className="font-semibold">Les exercices n&apos;ont pas pu se charger.</p>
      <p className="mt-1">Vérifiez votre connexion, puis réessayez.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Réessayer
      </button>
    </div>
  );
}

/** La place d'un exercice qui se charge. */
export function CardSkeleton() {
  return (
    <div aria-hidden className="h-56 animate-pulse rounded-2xl bg-white/70" />
  );
}

export function CardGroup({
  label,
  sparkles = false,
  children,
}: {
  label?: string;
  sparkles?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 first:mt-0">
      {label && (
        <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
          {sparkles && <Sparkles className="size-4 text-fuchsia-500" aria-hidden />}
          {label}
        </p>
      )}
      <StaggerContainer className="flex flex-wrap justify-center gap-4">{children}</StaggerContainer>
    </div>
  );
}

/**
 * Les cartes d'une matière et d'une classe, sans leurs exercices : ce que la
 * classe PROPOSE (`demo-matrix.ts`), déjà dans le HTML pré-rendu, en attendant
 * que les écrans de l'élève se chargent.
 */
export function CardShells({ subject, klass }: { subject: DemoSubject; klass: DemoClass }) {
  const classic = classicTypesFor(subject, klass);
  const games = gamesFor(subject, klass);
  return (
    <>
      <CardGroup label={games.length > 0 ? "Les exercices" : undefined}>
        {classic.map((type) => (
          <CardFrame key={type} kind={type}>
            <CardSkeleton />
          </CardFrame>
        ))}
      </CardGroup>
      {games.length > 0 && (
        <CardGroup label="Les jeux" sparkles>
          {games.map((offer) => (
            <CardFrame key={offer.type} kind={offer.type}>
              <CardSkeleton />
            </CardFrame>
          ))}
        </CardGroup>
      )}
    </>
  );
}
