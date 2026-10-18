"use client";

import { useState, type CSSProperties } from "react";
import { AlertTriangle, Check, GripVertical } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { ExerciseActions } from "./game-parts";
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
import { ActionButton3D, ELEVATIONS, Reward, Tile3D, useGameFeel, type TileState } from "@/components/student/game-kit";
import { StepNumber, StepSlot } from "@/components/student/game-kit/gestes-cases";
import { TileGlyphs } from "@/components/student/game-kit/gestes-glyphes";

/**
 * LA MISE EN ORDRE EST UN ESCALIER DE MARCHES NUMÉROTÉES
 * (`docs/direction-jeu-exercices.md`). Chaque marche porte sa pierre (1, 2,
 * 3…, `StepNumber`) et un creux (`StepSlot`) ; une tuile épaisse (`Tile3D`)
 * y est posée. Saisie par sa poignée, la tuile se soulève (8 px, un peu plus
 * grande, l'ombre s'éloigne, une légère inclinaison), les autres glissent
 * pour lui faire de la place et le creux de la marche visée apparaît. Lâchée,
 * elle se pose avec un ressort et le téléphone claque dans la main.
 *
 * LE GESTE NE CHANGE PAS : les capteurs dnd-kit (doigt, souris, clavier :
 * Espace prend, les flèches déplacent, Espace pose), la poignée en
 * `touch-action: none`, les transformations fournies par `useSortable`. La
 * poignée est un FRÈRE de la tuile, pas son enfant : un appui sur elle ne
 * doit pas enfoncer la face de la tuile (`group-active` de `Tile3D`) pendant
 * qu'elle se soulève. Le nœud trié est leur parent commun, dont le dernier
 * enfant est la tuile : la vitrine lit le libellé par là.
 *
 * « Valider » est posé dans la barre d'action (`ExerciseActions`,
 * `game-parts.tsx`) : pour un enfant qui apprend à lire, « Écouter » vient
 * juste au-dessus, comme au QCM.
 */
interface OrderPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
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

/**
 * Une étiquette à ranger. `id` est sa POSITION d'origine, `text` ce qu'elle
 * affiche : deux lettres « a » dans « papa » sont deux étiquettes, et
 * dnd-kit exige un identifiant unique par élément déplaçable.
 */
type OrderTile = { id: string; text: string };

/** La tuile saisie penche un peu, comme tenue par un coin. */
const GRAB_TILT_DEG = -1.5;

/** L'état d'une tuile selon le verdict et la prise. */
export function orderTileState(verdict: boolean | null, dragging: boolean): TileState {
  if (verdict === true) return "juste";
  if (verdict === false) return "fausse";
  return dragging ? "choisie" : "repos";
}

function SortableItem({
  id,
  label,
  index,
  disabled,
  verdict,
}: {
  id: string;
  label: string;
  index: number;
  disabled: boolean;
  verdict: boolean | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  // Le déplacement de dnd-kit sur le nœud trié ; l'inclinaison s'y ajoute le
  // temps de la prise, et repart avec la même transition quand on lâche.
  const moved = CSS.Transform.toString(transform);
  const style: CSSProperties = {
    transform: isDragging ? `${moved ?? ""} rotate(${GRAB_TILT_DEG}deg)` : (moved ?? undefined),
    transition,
    willChange: isDragging ? "transform" : undefined,
  };
  const state = orderTileState(verdict, isDragging);
  const caseState = verdict === true ? "juste" : verdict === false ? "fausse" : "repos";
  // La poignée monte avec la tuile saisie (même levée, même échelle).
  const lift = ELEVATIONS.saisie;

  return (
    <li className="flex items-center gap-3">
      <StepNumber n={index + 1} tone={index} state={caseState} />
      <div className="relative min-w-0 flex-1">
        <StepSlot />
        {/* `z-10` : une tuile qui glisse vers la marche du dessous passe DEVANT le
            creux de cette marche, qui vient après elle dans le DOM. */}
        <div ref={setNodeRef} style={style} className={`relative ${isDragging ? "z-20" : "z-10"}`}>
          {/* LA POIGNÉE SE GLISSE AU DOIGT : `touch-none` (touch-action: none) dit
              au navigateur de ne pas prendre ce geste pour un défilement. Sans lui,
              sur iPhone, iPad et Android, le doigt qui glisse fait défiler la page,
              le navigateur annule le geste (pointercancel) et la tuile ne bouge
              jamais ; la souris, elle, n'a pas ce problème. 56 px, la cible d'un
              doigt d'enfant ; `select-none` et `-webkit-touch-callout` coupent la
              loupe et le menu de sélection d'iOS sur un appui long. */}
          <span
            {...attributes}
            {...listeners}
            aria-label={`Déplacer « ${label} »`}
            className={`gk-spring absolute left-1.5 top-1/2 z-10 flex h-14 w-14 shrink-0 touch-none select-none items-center justify-center rounded-xl border-2 border-white/70 bg-[#fff1cc] text-amber-700 shadow-[inset_0_-2px_0_rgb(0_0_0_/_0.08),0_2px_0_#d6c39a] outline-none transition-transform duration-[220ms] gk-focus [-webkit-touch-callout:none] ${
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{
              transform: isDragging
                ? `translateY(calc(-50% + ${lift.lift}px)) scale(${lift.scale})`
                : "translateY(-50%)",
            }}
          >
            <GripVertical className="h-7 w-7" strokeWidth={2.5} aria-hidden />
          </span>
          <Tile3D
            as="div"
            tone={index}
            state={state}
            elevation={isDragging ? "saisie" : undefined}
            disabled={disabled}
            data-dragging={isDragging || undefined}
          >
            <span className="block pl-14">
              <TileGlyphs text={label} />
            </span>
          </Tile3D>
        </div>
      </div>
    </li>
  );
}

export default function OrderExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: OrderExerciseProps) {
  const source = Array.isArray(payload?.items)
    ? payload.items.filter((s): s is string => typeof s === "string")
    : Array.isArray(payload?.correctSequence)
      ? payload.correctSequence.filter((s): s is string => typeof s === "string")
      : [];

  const [items, setItems] = useState<OrderTile[]>(() => {
    const shuffled = source.map((text, index) => ({ id: `tuile-${index}`, text }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Les hooks avant le retour anticipé : leur ordre ne doit pas dépendre
  // du payload.
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const feel = useGameFeel();

  // Le bouton n'appelle (reflet) qu'une fois que l'enfant a déplacé une tuile.
  const [touched, setTouched] = useState(false);

  // La récompense rejoue à chaque passage à « juste ».
  const [fire, setFire] = useState(0);
  const [seenVerdict, setSeenVerdict] = useState(isCorrect);
  if (isCorrect !== seenVerdict) {
    setSeenVerdict(isCorrect);
    if (isCorrect === true) setFire((n) => n + 1);
  }

  if (source.length < 2) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((tile) => tile.id === active.id);
        const newIndex = prevItems.findIndex((tile) => tile.id === over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
    // La tuile se pose : un petit claquement dans la main, qu'elle ait bougé ou non.
    feel.vibrate("select");
    setTouched(true);
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(items.map((tile) => tile.text)));
  };

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div className="space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((tile) => tile.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* L'escalier : une marche par rang, la récompense au milieu. */}
          <div className="relative">
            <ol className="space-y-4">
              {items.map((tile, index) => (
                <SortableItem
                  key={tile.id}
                  id={tile.id}
                  label={tile.text}
                  index={index}
                  disabled={disabled}
                  verdict={isCorrect}
                />
              ))}
            </ol>
            <Reward fire={fire > 0 ? fire : null} />
          </div>
        </SortableContext>
      </DndContext>

      <ExerciseActions>
        {/* La coche : le même « Valider » que le QCM, pour que le dock ne change pas de visage d'une question à l'autre. */}
        <ActionButton3D
          shine={touched && !disabled}
          disabled={disabled}
          onClick={handleSubmit}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>
    </div>
  );
}
