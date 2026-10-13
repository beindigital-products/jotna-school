"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { dragDropAnswer } from "@/lib/exerciseAnswers";

interface DragDropPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
  zones?: string[];
  items?: { text: string }[];
}

interface DragDropExerciseProps {
  prompt: string;
  payload: DragDropPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const zoneColors = [
  { bg: "bg-blue-50", border: "border-blue-300", header: "bg-blue-200 text-blue-900", item: "bg-blue-100 border-blue-200 text-blue-800" },
  { bg: "bg-pink-50", border: "border-pink-300", header: "bg-pink-200 text-pink-900", item: "bg-pink-100 border-pink-200 text-pink-800" },
  { bg: "bg-amber-50", border: "border-amber-300", header: "bg-amber-200 text-amber-900", item: "bg-amber-100 border-amber-200 text-amber-800" },
  { bg: "bg-green-50", border: "border-green-300", header: "bg-green-200 text-green-900", item: "bg-green-100 border-green-200 text-green-800" },
  { bg: "bg-purple-50", border: "border-purple-300", header: "bg-purple-200 text-purple-900", item: "bg-purple-100 border-purple-200 text-purple-800" },
];

/*
 * UNE ÉTIQUETTE EST SA POSITION, PAS SON TEXTE. Deux étiquettes peuvent se
 * ressembler (les deux « a » de « banane ») : suivies par leur texte, poser
 * l'une déplaçait l'autre. Zones et étiquettes portent donc un identifiant
 * tiré de leur rang ; le texte ne sert qu'à l'affichage et à la réponse
 * (`lib/exerciseAnswers.ts`).
 */
const zoneId = (index: number) => `zone-${index}`;
const itemId = (index: number) => `etiquette-${index}`;

function DroppableZone({
  id,
  label,
  colorIndex,
  armed,
  onChoose,
  children,
}: {
  id: string;
  label: string;
  colorIndex: number;
  /** Une étiquette est choisie : toucher cette case l'y pose. */
  armed: boolean;
  onChoose: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const color = zoneColors[colorIndex % zoneColors.length];

  return (
    <div
      ref={setNodeRef}
      onClick={armed ? onChoose : undefined}
      className={`rounded-2xl border-3 ${color.border} ${color.bg} p-4 min-h-[120px] transition-all ${
        isOver ? "scale-[1.02] shadow-lg ring-2 ring-offset-2 ring-indigo-300" : ""
      } ${armed ? "cursor-pointer ring-2 ring-indigo-300 ring-offset-2" : ""}`}
    >
      <h4
        className={`mb-3 rounded-xl ${color.header} px-3 py-2 text-center text-base font-bold`}
      >
        {label}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DraggableItem({
  id,
  label,
  disabled,
  inZone,
  selected,
  onChoose,
}: {
  id: string;
  label: string;
  disabled: boolean;
  inZone: boolean;
  /** Choisie par un toucher : elle attend qu'on touche sa case. */
  selected: boolean;
  onChoose: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-pressed={selected}
      onClick={(event) => {
        // Toucher une étiquette ne touche pas la case qui la contient.
        event.stopPropagation();
        if (!disabled) onChoose();
      }}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onChoose();
      }}
      // `touch-none` : sans lui, au doigt, le glissé défile la page et le
      // navigateur annule le geste (voir `OrderExercise`). `select-none` et
      // `-webkit-touch-callout` : pas de loupe ni de sélection d'iOS sur un
      // appui long.
      className={`
        touch-none select-none rounded-xl border-2 px-4 py-3 text-center text-base font-bold transition-all [-webkit-touch-callout:none]
        ${isDragging ? "opacity-50" : ""}
        ${selected ? "scale-105 ring-4 ring-indigo-500 ring-offset-2" : ""}
        ${inZone
          ? "border-gray-200 bg-white text-gray-800 shadow-sm"
          : "border-indigo-200 bg-indigo-50 text-indigo-800 shadow-md hover:shadow-lg"
        }
        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}
      `}
    >
      {label}
    </div>
  );
}

export default function DragDropExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
}: DragDropExerciseProps) {
  const zones = Array.isArray(payload?.zones) ? payload.zones.filter((z): z is string => typeof z === "string") : [];
  const items = Array.isArray(payload?.items)
    ? payload.items.filter((it): it is { text: string } => !!it && typeof it === "object" && typeof (it as Record<string, unknown>).text === "string")
    : [];

  // La zone de chaque étiquette, PAR POSITION : `zoneOfItem[i]` est le rang
  // de la zone où est posée `items[i]` (null = pas encore posée).
  const [zoneOfItem, setZoneOfItem] = useState<(number | null)[]>(() =>
    items.map(() => null),
  );

  // Les hooks avant le retour anticipé : leur ordre ne doit pas dépendre
  // du payload.
  const [activeId, setActiveId] = useState<string | null>(null);
  // L'étiquette choisie par un toucher, par position. Glisser reste possible ;
  // toucher l'étiquette puis sa case est l'autre façon, et la seule qui ne
  // dépend pas de la taille de l'écran : sur un téléphone, l'étiquette et sa
  // case ne tiennent pas toujours ensemble à l'écran, et le glissé qui
  // approche du bord fait défiler la page sous le doigt.
  const [chosen, setChosen] = useState<number | null>(null);
  // 8 px avant de partir en glissé : sans cela, un simple toucher est déjà un
  // glissé et dnd-kit avale le clic qui le suit.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (zones.length < 2 || items.length < 2) {
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="font-bold text-amber-900">Cet exercice est cassé, on te le saute.</p>
          <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
          <button onClick={() => onSkip?.()} disabled={disabled} className="mt-1 rounded-2xl bg-amber-500 px-6 py-2.5 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50">Suivant</button>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const zoneIds = zones.map((_, index) => zoneId(index));
  const itemIds = items.map((_, index) => itemId(index));

  const place = (item: number, zone: number) =>
    setZoneOfItem((prev) => prev.map((current, index) => (index === item ? zone : current)));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const zone = zoneIds.indexOf(String(over.id));
    const item = itemIds.indexOf(String(active.id));
    if (zone < 0 || item < 0) return;
    place(item, zone);
    setChosen(null);
  };

  // Toucher une étiquette :
  //  - la choisie : on la relâche ;
  //  - une étiquette déjà POSÉE dans une case, alors qu'une autre est choisie :
  //    c'est toucher cette case (le centre d'une case pleine tombe sur une
  //    étiquette, pas sur le fond) ; la choisie y est posée ;
  //  - sinon : c'est la nouvelle étiquette choisie.
  const choose = (item: number) => {
    if (disabled) return;
    if (chosen === item) {
      setChosen(null);
      return;
    }
    const zone = zoneOfItem[item];
    if (chosen !== null && zone !== null && zoneOfItem[chosen] !== zone) {
      place(chosen, zone);
      setChosen(null);
      return;
    }
    setChosen(item);
  };
  const putChosenIn = (zone: number) => {
    if (chosen === null || disabled) return;
    place(chosen, zone);
    setChosen(null);
  };

  const handleSubmit = () => {
    onSubmit(
      dragDropAnswer(
        items.map((item) => item.text),
        zoneOfItem.map((zone) => (zone === null ? null : zones[zone])),
      ),
    );
  };

  const unplacedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => zoneOfItem[index] === null);
  const allPlaced = unplacedItems.length === 0;
  const activeLabel = activeId ? items[itemIds.indexOf(activeId)]?.text : undefined;

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Zones */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {zones.map((zone, zoneIndex) => (
            <DroppableZone
              key={zoneIds[zoneIndex]}
              id={zoneIds[zoneIndex]}
              label={zone}
              colorIndex={zoneIndex}
              armed={chosen !== null && zoneOfItem[chosen] !== zoneIndex}
              onChoose={() => putChosenIn(zoneIndex)}
            >
              {items.map((item, index) =>
                zoneOfItem[index] === zoneIndex ? (
                  <DraggableItem
                    key={itemIds[index]}
                    id={itemIds[index]}
                    label={item.text}
                    disabled={disabled}
                    inZone={true}
                    selected={chosen === index}
                    onChoose={() => choose(index)}
                  />
                ) : null,
              )}
            </DroppableZone>
          ))}
        </div>

        {/* Unplaced items */}
        {unplacedItems.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
            <p
              aria-live="polite"
              className="mb-3 text-center font-display text-sm font-extrabold uppercase tracking-wide text-gray-500"
            >
              {chosen !== null ? (
                `Touche la case où poser « ${items[chosen].text} »`
              ) : (
                <>
                  Glisse chaque étiquette dans la bonne case
                  <span className="mt-1 block text-xs font-semibold normal-case tracking-normal">
                    Ou touche l&apos;étiquette, puis la case.
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {unplacedItems.map(({ item, index }) => (
                <DraggableItem
                  key={itemIds[index]}
                  id={itemIds[index]}
                  label={item.text}
                  disabled={disabled}
                  inZone={false}
                  selected={chosen === index}
                  onChoose={() => choose(index)}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeLabel !== undefined ? (
            <div className="rounded-xl border-2 border-indigo-400 bg-indigo-100 px-4 py-3 text-center text-base font-bold text-indigo-800 shadow-xl">
              {activeLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={disabled || !allPlaced}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
