"use client";

import { useState } from "react";
import { AlertTriangle, GripVertical } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrderPayload {
  correctSequence?: string[];
  items?: string[];
}

interface OrderExerciseProps {
  prompt: string;
  payload: OrderPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const itemColors = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-green-50 border-green-200 text-green-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-teal-50 border-teal-200 text-teal-800",
];

function SortableItem({
  id,
  index,
  disabled,
}: {
  id: string;
  index: number;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const color = itemColors[index % itemColors.length];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 rounded-2xl border-3 px-5 py-4 text-lg font-bold transition-shadow
        ${color}
        ${isDragging ? "shadow-xl z-10 opacity-90 scale-[1.02]" : "shadow-sm"}
        ${disabled ? "opacity-70" : ""}
      `}
    >
      <span
        {...attributes}
        {...listeners}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 ${
          disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <GripVertical className="h-5 w-5" />
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-sm font-bold">
        {index + 1}
      </span>
      <span>{id}</span>
    </div>
  );
}

export default function OrderExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
}: OrderExerciseProps) {
  const source = Array.isArray(payload?.items)
    ? payload.items.filter((s): s is string => typeof s === "string")
    : Array.isArray(payload?.correctSequence)
      ? payload.correctSequence.filter((s): s is string => typeof s === "string")
      : [];

  const [items, setItems] = useState<string[]>(() => {
    const shuffled = [...source];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  if (source.length < 2) {
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="font-bold text-amber-900">Cet exercice est cassé, on te le saute.</p>
          <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
          <button onClick={() => onSkip?.()} disabled={disabled} className="mt-1 rounded-2xl bg-amber-500 px-6 py-2.5 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50">Suivant</button>
        </div>
      </div>
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.indexOf(active.id as string);
        const newIndex = prevItems.indexOf(over.id as string);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(items));
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <SortableItem
                key={item}
                id={item}
                index={index}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
