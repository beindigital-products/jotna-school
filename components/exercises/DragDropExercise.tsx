"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { ExerciseActions } from "./game-parts";
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
import { ActionButton3D, GESTURE_ACCENT, Reward, Tile3D, useGameFeel, type TileState } from "@/components/student/game-kit";
import { graphemeCount } from "@/components/student/game-kit/choix-texte";
import { DropBox } from "@/components/student/game-kit/gestes-cases";
import { TileGlyphs } from "@/components/student/game-kit/gestes-glyphes";

/**
 * LE GLISSER-DÉPOSER SE JOUE AVEC DE VRAIES BOÎTES
 * (`docs/direction-jeu-exercices.md`). Les cases sont des boîtes épaisses,
 * vues de face et un peu de dessus (`DropBox`), avec leur nom sur une plaque ;
 * les étiquettes sont des tuiles épaisses (`Tile3D`) dans le bac de sable.
 * Saisie, une étiquette se soulève sous le doigt (l'`DragOverlay` la porte,
 * plus grande, l'ombre loin, un peu penchée) et laisse son creux dans le bac ;
 * la boîte survolée s'allume et s'enfonce ; lâchée, l'étiquette s'y pose avec
 * un ressort et le téléphone claque dans la main. Toucher l'étiquette puis la
 * boîte fait la même chose : les boîtes s'allument alors toutes pour dire
 * « ici ». L'accent de la famille « glisser » est l'ambre du sable.
 *
 * LE GESTE NE CHANGE PAS : capteur pointeur à 8 px, `touch-action: none` sur
 * l'étiquette, le toucher en deux temps, la correction au clavier (Entrée ou
 * Espace choisit l'étiquette). Le DOM garde ses repères : le bac porte
 * `border-dashed`, chaque case est le parent direct de son `h4` et contient
 * ses étiquettes, une étiquette porte `aria-roledescription="draggable"` et
 * `aria-pressed` quand elle est choisie.
 *
 * LE BAC VIENT AVANT LES BOÎTES. Avec les boîtes d'abord (trois boîtes
 * d'environ 140 px), les étiquettes étaient sous le dock sur un téléphone :
 * l'enfant lisait « Glisse les étiquettes » sans rien voir à glisser, et
 * devait défiler puis remonter vers les boîtes (relu le 18 octobre 2026,
 * 390 × 844 et 360 × 640, Android 412 × 840). Sous l'énoncé, les étiquettes
 * sont la première chose qu'on touche, et le geste va vers le bas, dans les
 * boîtes. Le bac reste en place quand il se vide (une hauteur minimale d'une
 * rangée, « Tout est rangé ! ») : les boîtes ne sautent pas sous le doigt au
 * moment où la dernière étiquette s'y pose.
 *
 * « Valider » est posé dans la barre d'action (`ExerciseActions`,
 * `game-parts.tsx`) : pour un enfant qui apprend à lire, « Écouter » vient
 * juste au-dessus, comme au QCM.
 */
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

/** L'ambre du sable : l'accent du geste « glisser ». */
const GRAB_TONE = GESTURE_ACCENT.glisser.optionIndex;

/** La tuile en l'air se pose avec le ressort de la boîte à outils. */
const DROP_SPRING = { duration: 280, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" };

/*
 * UNE ÉTIQUETTE EST SA POSITION, PAS SON TEXTE. Deux étiquettes peuvent se
 * ressembler (les deux « a » de « banane ») : suivies par leur texte, poser
 * l'une déplaçait l'autre. Zones et étiquettes portent donc un identifiant
 * tiré de leur rang ; le texte ne sert qu'à l'affichage et à la réponse
 * (`lib/exerciseAnswers.ts`).
 */
const zoneId = (index: number) => `zone-${index}`;
const itemId = (index: number) => `etiquette-${index}`;

/**
 * LES BOÎTES EN DEUX COLONNES DÈS LE TÉLÉPHONE quand tout est court : des noms
 * d'un mot de dix graphèmes au plus (« Ronds », « Jour », « an »), des
 * étiquettes aussi courtes (des formes, des syllabes, un mot), quatre boîtes
 * au plus. Trois boîtes empilées sur une colonne poussaient le bac et la barre
 * d'action bien sous le premier écran d'un téléphone (mesuré : 348 px à
 * 390 × 844, `scripts/shoot-exercises.mjs`). Un nom long (« Aliments de
 * construction ») ou une phrase à ranger garde la colonne sur un téléphone,
 * deux colonnes à partir de 640 px comme avant.
 */
export function boxesSideBySide(zones: readonly string[], items: readonly string[]): boolean {
  const short = (text: string) => graphemeCount(text.trim()) <= 10 && text.trim().split(/\s+/u).length === 1;
  return zones.length >= 2 && zones.length <= 4 && zones.every(short) && items.every(short);
}

/** L'état d'une étiquette posée selon le verdict, ou son choix. */
export function itemTileState(verdict: boolean | null, inZone: boolean, selected: boolean): TileState {
  if (inZone && verdict === true) return "juste";
  if (inZone && verdict === false) return "fausse";
  return selected ? "choisie" : "repos";
}

function DroppableZone({
  id,
  label,
  colorIndex,
  armed,
  verdict,
  onChoose,
  children,
}: {
  id: string;
  label: string;
  colorIndex: number;
  /** Une étiquette est choisie : toucher cette case l'y pose. */
  armed: boolean;
  verdict: boolean | null;
  onChoose: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <DropBox
      ref={setNodeRef}
      tone={colorIndex}
      label={label}
      armed={armed}
      over={isOver}
      state={verdict === true ? "juste" : verdict === false ? "fausse" : "repos"}
      onClick={armed ? onChoose : undefined}
    >
      {children}
    </DropBox>
  );
}

function DraggableItem({
  id,
  label,
  disabled,
  inZone,
  selected,
  verdict,
  onChoose,
}: {
  id: string;
  label: string;
  disabled: boolean;
  inZone: boolean;
  /** Choisie par un toucher : elle attend qu'on touche sa case. */
  selected: boolean;
  verdict: boolean | null;
  onChoose: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    // La largeur suit le contenu : une forme est une petite tuile, un mot une
    // plus longue. Le toucher est pris ici, sur l'enveloppe : `Tile3D` réserve
    // `onClick` à sa forme bouton, et le clic de l'étiquette remonte jusqu'ici.
    <div
      className={`min-w-[4rem] max-w-full ${inZone ? "" : "flex-none"}`}
      onClick={(event) => {
        // Toucher une étiquette ne touche pas la case qui la contient.
        event.stopPropagation();
        if (!disabled) onChoose();
      }}
    >
      <Tile3D
        as="div"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-pressed={selected}
        tone={GRAB_TONE}
        state={itemTileState(verdict, inZone, selected)}
        // En l'air, c'est l'`DragOverlay` qui la montre : ici reste son creux.
        elevation={isDragging ? "plat" : undefined}
        disabled={disabled}
        align="center"
        onKeyDown={(event) => {
          if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          onChoose();
        }}
        // `touch-none` : sans lui, au doigt, le glissé défile la page et le
        // navigateur annule le geste (voir `OrderExercise`). `select-none` et
        // `-webkit-touch-callout` : pas de loupe ni de sélection d'iOS sur un
        // appui long.
        className={`touch-none [-webkit-touch-callout:none] ${isDragging ? "opacity-40" : ""} ${
          disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
        }`}
        data-in-zone={inZone || undefined}
      >
        <TileGlyphs text={label} />
      </Tile3D>
    </div>
  );
}

export default function DragDropExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
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
  const feel = useGameFeel();

  // La récompense rejoue à chaque passage à « juste ».
  const [fire, setFire] = useState(0);
  const [seenVerdict, setSeenVerdict] = useState(isCorrect);
  if (isCorrect !== seenVerdict) {
    setSeenVerdict(isCorrect);
    if (isCorrect === true) setFire((n) => n + 1);
  }

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
    feel.vibrate("tap");
  };

  const zoneIds = zones.map((_, index) => zoneId(index));
  const itemIds = items.map((_, index) => itemId(index));

  /** Pose une étiquette dans une case : l'état change, et la main le sent. */
  const place = (item: number, zone: number) => {
    setZoneOfItem((prev) => prev.map((current, index) => (index === item ? zone : current)));
    feel.vibrate("select");
  };

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
    feel.vibrate("tap");
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
  const sideBySide = boxesSideBySide(zones, items.map((item) => item.text));

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div className="space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Le bac : les étiquettes qui attendent, sur le sable, AVANT les boîtes. */}
        <div
          data-tray
          className="rounded-3xl border-2 border-dashed border-[#d6c39a] bg-[#fff1cc]/80 px-4 pb-3 pt-3 shadow-[inset_0_2px_6px_rgb(60_30_0_/_0.08)]"
        >
          <p
            aria-live="polite"
            className="mb-3 text-center font-display text-base font-extrabold leading-snug text-amber-900/85"
          >
            {chosen !== null ? (
              `Touche la case où poser « ${items[chosen].text} »`
            ) : allPlaced ? (
              "Tout est rangé !"
            ) : (
              // Court : la consigne a déjà dit quoi ranger où ; sur un
              // téléphone, une ligne de moins garde le bac plus haut. La seconde
              // ligne, le geste au toucher, à 85 % : 5,7:1 sur le sable (à 65 %,
              // 3,5:1, sous les 4,5:1 d'un petit texte).
              <>
                Glisse les étiquettes
                <span className="mt-1 block text-sm font-bold text-amber-900/85">
                  Ou touche l&apos;étiquette, puis la case.
                </span>
              </>
            )}
          </p>
          <div className="flex min-h-[4.5rem] flex-wrap items-start justify-center gap-4">
            {unplacedItems.map(({ item, index }) => (
              <DraggableItem
                key={itemIds[index]}
                id={itemIds[index]}
                label={item.text}
                disabled={disabled}
                inZone={false}
                selected={chosen === index}
                verdict={isCorrect}
                onChoose={() => choose(index)}
              />
            ))}
          </div>
        </div>

        {/* Les boîtes, et la récompense au milieu d'elles. */}
        <div className="relative">
          <div className={`grid gap-4 ${sideBySide ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`} data-boxes={sideBySide ? "deux-colonnes" : "une-colonne"}>
            {zones.map((zone, zoneIndex) => (
              <DroppableZone
                key={zoneIds[zoneIndex]}
                id={zoneIds[zoneIndex]}
                label={zone}
                colorIndex={zoneIndex}
                armed={chosen !== null && zoneOfItem[chosen] !== zoneIndex}
                verdict={isCorrect}
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
                      verdict={isCorrect}
                      onChoose={() => choose(index)}
                    />
                  ) : null,
                )}
              </DroppableZone>
            ))}
          </div>
          <Reward fire={fire > 0 ? fire : null} />
        </div>

        {/* L'étiquette en l'air : soulevée, un peu penchée, elle se pose avec un ressort. */}
        <DragOverlay dropAnimation={feel.reducedMotion ? null : DROP_SPRING}>
          {activeLabel !== undefined ? (
            <Tile3D as="div" tone={GRAB_TONE} state="choisie" elevation="saisie" align="center" className="rotate-[-2deg] cursor-grabbing">
              <TileGlyphs text={activeLabel} />
            </Tile3D>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ExerciseActions>
        {/* La coche : le même « Valider » que le QCM, pour que le dock ne change pas de visage d'une question à l'autre. */}
        <ActionButton3D
          shine={allPlaced && !disabled}
          disabled={disabled || !allPlaced}
          onClick={handleSubmit}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>
    </div>
  );
}
