"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Eraser, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Reward, useGameFeel } from "@/components/student/game-kit";
import { PaintBlob, PillButton3D } from "@/components/student/game-kit/ecrans-decor";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import { FRAME, fitGrid } from "./pixel-grid-fit";
import { EMPTY_CELL, type PixelArtView, type PixelPaint } from "@/convex/paliers/games/types";

/** L'air laissé sous « Valider », pour qu'il ne colle pas au bas de l'écran. */
const BOTTOM_SLACK = 12;

/** Le sable d'une case vide, et le même à l'ombre pour la moitié verrouillée d'une symétrie. */
const CELL_EMPTY = "#fffdf7";
const CELL_LOCKED = "#f3ead3";

/**
 * LE DESSIN SUR QUADRILLAGE — une table de pixels et des pastilles de
 * peinture épaisses. Reproduire un modèle, le redessiner de mémoire, compléter
 * une symétrie, faire un coloriage magique.
 *
 * L'enfant choisit une pastille (elle se soulève, cerclée de rose, l'accent
 * « dessiner »), puis touche les cases — ou glisse le doigt pour en peindre
 * plusieurs. Chaque case peinte reçoit une touche de peinture en relief qui
 * se pose d'un petit rebond (`gk-pop`, seulement pour les cases que l'enfant
 * vient de peindre : la moitié donnée d'une symétrie ne saute pas à l'écran).
 * Toucher une case déjà de cette couleur l'efface, comme la gomme. En
 * symétrie, la moitié donnée est verrouillée, un peu pâlie tant que l'enfant
 * dessine, et le miroir est tracé en rouge (la consigne le nomme ainsi).
 *
 * Juste : la table passe au vert et gonfle, la récompense jaillit du dessin.
 * Faux : elle passe à l'ambre et dit non, sans rouge.
 *
 * TOUT TIENT DANS L'ÉCRAN, « Valider » compris : la taille des cases se
 * calcule sur la place libre (`pixel-grid-fit.ts`), mesurée avant le premier
 * affichage. L'épaisseur des cadres est peinte en ombre, pas en marge : les
 * mesures de `pixel-grid-fit.ts` (bordure de 3 px, marge de 4 px) sont les
 * mêmes qu'avant. La barre d'action (« Écouter » puis « Valider », par
 * `SubmitButton`) fait partie de ce qui suit les quadrillages : la mesure la
 * compte, les cases rétrécissent d'autant pour un enfant qui apprend à lire.
 */
export default function PixelArtExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
  fitScreen = true,
}: ExerciseScreenProps<Partial<PixelArtView>> & {
  /**
   * Caler les cases sur la hauteur de l'écran, « Valider » compris (la séance :
   * l'exercice y est en haut de la page). Faux pour une carte posée bien plus
   * bas dans une page qui défile (la démonstration de la vitrine) : la mesure
   * y part du haut de la PAGE, trouve une hauteur négative et réduit toujours
   * les cases à 26 px, quel que soit l'écran.
   */
  fitScreen?: boolean;
}) {
  const width = typeof payload?.width === "number" ? payload.width : 0;
  const height = typeof payload?.height === "number" ? payload.height : 0;
  const palette: PixelPaint[] = Array.isArray(payload?.palette) ? payload.palette : [];
  const mode = payload?.mode ?? "copy";
  const given = mode === "symmetry" && Array.isArray(payload?.given) ? payload.given : null;
  const model = Array.isArray(payload?.model) ? payload.model : null;
  const numbers = mode === "number" && Array.isArray(payload?.numbers) ? payload.numbers : null;
  const axis = payload?.axis ?? "vertical";

  const valid =
    width >= 2 &&
    height >= 2 &&
    width <= 12 &&
    height <= 12 &&
    palette.length > 0 &&
    (mode !== "symmetry" || (given?.length === height && width % 2 === 0)) &&
    ((mode !== "copy" && mode !== "memory") || model?.length === height) &&
    (mode !== "number" || numbers?.length === height);

  const initial = () =>
    Array.from({ length: height }, (_, r) =>
      Array.from({ length: width }, (_, c) => (given ? (given[r]?.[c] ?? EMPTY_CELL) : EMPTY_CELL)),
    );
  // Le dessin, et les touches de peinture posées par l'enfant
  // (« ligne-colonne:couleur ») : elles seules rebondissent en apparaissant,
  // pas la moitié donnée au départ. Les deux changent d'un seul coup.
  const [board, setBoard] = useState<{ grid: string[][]; fresh: ReadonlySet<string> }>(() => ({
    grid: initial(),
    fresh: new Set(),
  }));
  const grid = board.grid;
  const [selected, setSelected] = useState<string>(palette[0]?.key ?? EMPTY_CELL);
  const showSeconds = Math.max(2, Math.min(15, payload?.showSeconds ?? 5));
  const [phase, setPhase] = useState<"show" | "draw">(mode === "memory" ? "show" : "draw");
  const [remaining, setRemaining] = useState(showSeconds);
  const [peeking, setPeeking] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(1);
  const feel = useGameFeel();
  const gridRef = useRef<HTMLDivElement>(null);
  const stroke = useRef<"paint" | "erase" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ width: number; height: number } | null>(null);

  // LA PLACE LIBRE pour les quadrillages : du haut de leur zone au bas de
  // l'écran, moins ce qui les suit (palette, « Valider »). Rien de cela ne
  // dépend de la taille des cases, la mesure ne boucle donc pas. On la
  // reprend quand l'écran tourne ou que la consigne change de hauteur (la
  // police arrive après coup).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!valid || !root) return;
    const measure = () => {
      const zone = zoneRef.current;
      // Pas encore mis en page (ou rendu hors navigateur, dans les tests).
      if (!zone || root.clientWidth === 0) return;
      const box = root.getBoundingClientRect();
      const zoneBox = zone.getBoundingClientRect();
      const free = {
        width: root.clientWidth,
        height: fitScreen
          ? Math.floor(screenHeight() - (zoneBox.top + window.scrollY) - (box.bottom - zoneBox.bottom) - BOTTOM_SLACK)
          : Infinity,
      };
      setRoom((prev) => (prev?.width === free.width && prev.height === free.height ? prev : free));
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [valid, fitScreen]);

  // Le modèle de mémoire se cache tout seul au bout du compte à rebours.
  useEffect(() => {
    if (mode !== "memory" || phase !== "show") return;
    const timer = setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(0);
        setPhase("draw");
      } else {
        setRemaining(remaining - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [mode, phase, remaining]);

  // Revoir le modèle : trois secondes, une fois.
  useEffect(() => {
    if (!peeking) return;
    const timer = setTimeout(() => setPeeking(false), 3000);
    return () => clearTimeout(timer);
  }, [peeking]);

  if (!valid) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const half = axis === "vertical" ? width / 2 : height / 2;
  const isLocked = (r: number, c: number) =>
    given !== null && (axis === "vertical" ? c < half : r < half);
  const canPaint = !disabled && phase === "draw" && !peeking;
  // Réussi, le dessin se montre entier : plus de moitié pâlie, plus de voile.
  const solved = isCorrect === true;
  const colorOf = (key: string) => palette.find((p) => p.key === key)?.color;

  const { cell: cellSize, modelCell, sideBySide } = fitGrid({
    cols: width,
    rows: height,
    model: model !== null,
    controls: mode === "memory",
    // Avant la mesure : la largeur du plus étroit des téléphones courants.
    width: room?.width ?? 280,
    height: room?.height ?? Infinity,
  });

  const cellAt = (clientX: number, clientY: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const c = Math.floor(((clientX - rect.left) / rect.width) * width);
    const r = Math.floor(((clientY - rect.top) / rect.height) * height);
    if (r < 0 || c < 0 || r >= height || c >= width) return null;
    return [r, c];
  };

  const apply = (r: number, c: number, action: "paint" | "erase") => {
    if (isLocked(r, c)) return;
    const value = action === "erase" ? EMPTY_CELL : selected;
    setBoard((prev) => {
      if (prev.grid[r][c] === value) return prev;
      const next = prev.grid.map((row) => [...row]);
      next[r][c] = value;
      const fresh = value === EMPTY_CELL ? prev.fresh : new Set(prev.fresh).add(`${r}-${c}:${value}`);
      return { grid: next, fresh };
    });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPaint) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    const [r, c] = cell;
    if (isLocked(r, c)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    feel.vibrate("tap");
    // Toucher une case déjà de la couleur choisie l'efface : le trait
    // entier devient alors un coup de gomme.
    stroke.current = selected === EMPTY_CELL || grid[r][c] === selected ? "erase" : "paint";
    apply(r, c, stroke.current);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!stroke.current || !canPaint) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell) apply(cell[0], cell[1], stroke.current);
  };

  const endStroke = () => {
    stroke.current = null;
  };

  const showModel = model && (mode === "copy" || phase === "show" || peeking);
  const painted = grid.some((row, r) => row.some((cell, c) => cell !== EMPTY_CELL && !isLocked(r, c)));

  const frame = solved
    ? "border-lime-300 bg-[#f7fee7] shadow-[0_5px_0_#16a34a,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-pop_0.45s_ease-out]"
    : isCorrect === false
      ? "border-amber-300 bg-[#fffbeb] shadow-[0_5px_0_#ea580c,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-shake-soft_0.45s_ease-in-out]"
      : "border-white bg-[#fff8e6] shadow-[0_5px_0_#d6c39a,0_14px_24px_-14px_rgba(60,30,0,0.5)]";

  return (
    <div ref={rootRef} className="gk-motion space-y-4 sm:space-y-5">
      <ExercisePrompt prompt={prompt} />

      <div
        ref={zoneRef}
        className={`flex justify-center gap-4 ${sideBySide ? "flex-row items-start" : "flex-col items-center"}`}
      >
        {model && (
          <div className={`flex gap-3 ${sideBySide ? "flex-col items-center" : "flex-row items-center"}`}>
            <div className="relative">
              <FrameLabel>Le modèle</FrameLabel>
              {showModel ? (
                <MiniGrid rows={model} width={width} cell={modelCell} colorOf={colorOf} />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-3 border-dashed border-[#e9a83a] bg-[#fff7e0] text-center"
                  style={{ width: modelCell * width + FRAME, height: modelCell * height + FRAME }}
                >
                  <EyeOff className="h-7 w-7 text-[#e9a83a]" aria-hidden />
                  <span className="px-2 font-display text-xs font-extrabold text-amber-900">Caché&nbsp;!</span>
                </div>
              )}
              {mode === "memory" && phase === "show" && (
                <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(180deg,#fbbf24_0%,#ea580c_100%)] font-display text-lg font-extrabold text-white shadow-[0_3px_0_#b45309,0_6px_10px_-4px_rgba(60,30,0,0.5)]">
                  {remaining}
                </span>
              )}
            </div>
            {mode === "memory" && (
              // Une colonne de largeur fixe, même vide : le modèle ne bouge
              // pas d'une phase à l'autre.
              <div className="flex w-28 flex-col items-center gap-2 text-center">
                {phase === "show" && (
                  <PillButton3D tone="orange" onClick={() => setPhase("draw")} className="w-full">
                    J&apos;ai retenu&nbsp;!
                  </PillButton3D>
                )}
                {phase === "draw" && peeksLeft > 0 && !disabled && (
                  <PillButton3D
                    tone="sky"
                    icon={<Eye className="h-4 w-4 shrink-0" aria-hidden />}
                    onClick={() => {
                      setPeeksLeft((n) => n - 1);
                      setPeeking(true);
                    }}
                    className="w-full"
                  >
                    Revoir 3&nbsp;secondes
                  </PillButton3D>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {model && <FrameLabel>Ton dessin</FrameLabel>}
          <div className={`relative rounded-xl border-3 p-1 ${frame} ${canPaint || solved ? "" : "opacity-80"}`}>
            <div
              ref={gridRef}
              role="grid"
              aria-label="Quadrillage à colorier"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onLostPointerCapture={endStroke}
              className="grid select-none"
              style={{
                gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                touchAction: "none",
                cursor: canPaint ? "pointer" : "default",
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const pale = isLocked(r, c) && !solved;
                  const color = cell === EMPTY_CELL ? undefined : colorOf(cell);
                  const digit = numbers?.[r]?.[c];
                  const bounce = board.fresh.has(`${r}-${c}:${cell}`);
                  return (
                    <div
                      key={`${r}-${c}`}
                      role="gridcell"
                      aria-label={`Ligne ${r + 1}, colonne ${c + 1}${color ? `, ${palette.find((p) => p.key === cell)?.name}` : ", vide"}`}
                      className={`relative flex items-center justify-center border border-[#efe3c3] text-[11px] font-bold ${
                        pale ? "after:absolute after:inset-0 after:z-10 after:bg-white/25" : ""
                      }`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: pale ? CELL_LOCKED : CELL_EMPTY,
                      }}
                    >
                      {/* La touche de peinture : en relief, posée d'un rebond quand l'enfant vient de la mettre. */}
                      {color && (
                        <span
                          key={cell}
                          aria-hidden
                          data-paint={cell}
                          className={`absolute inset-px rounded-[3px] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.4),inset_0_-2px_0_rgb(0_0_0_/_0.14)] ${
                            bounce ? "animate-[gk-pop_0.3s_ease-out]" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )}
                      {digit && digit !== "0" && (
                        <span className={`relative ${color ? "text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.35)]" : "text-amber-900/50"}`}>{digit}</span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
            {given && (
              <div
                aria-hidden
                className="pointer-events-none absolute border-red-500"
                style={
                  axis === "vertical"
                    ? { top: 0, bottom: 0, left: 4 + half * cellSize - 1.5, borderLeftWidth: 3, borderLeftStyle: "dashed" }
                    : { left: 0, right: 0, top: 4 + half * cellSize - 1.5, borderTopWidth: 3, borderTopStyle: "dashed" }
                }
              />
            )}
            <Reward fire={solved ? "juste" : null} />
          </div>
        </div>
      </div>

      {/* Les pastilles de peinture, la gomme et « Tout effacer », en disques
          épais de 56 px. Les numéros du coloriage magique sont sur les
          pastilles : elles font légende. */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {palette.map((paint, i) => (
          <button
            key={paint.key}
            type="button"
            onClick={() => {
              feel.vibrate("tap");
              setSelected(paint.key);
            }}
            disabled={!canPaint}
            aria-pressed={selected === paint.key}
            aria-label={numbers ? `${i + 1} : ${paint.name}` : paint.name}
            title={numbers ? `${i + 1} : ${paint.name}` : paint.name}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full gk-focus disabled:opacity-60"
          >
            <PaintBlob color={paint.color} size={44} selected={selected === paint.key}>
              {numbers && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 font-display text-[11px] font-extrabold text-gray-900 shadow-[0_1px_0_rgb(0_0_0_/_0.2)]">
                  {i + 1}
                </span>
              )}
            </PaintBlob>
          </button>
        ))}
        <PillButton3D
          round
          ariaLabel="Gomme"
          title="Gomme"
          icon={<Eraser className="h-5 w-5 shrink-0" aria-hidden />}
          onClick={() => setSelected(EMPTY_CELL)}
          disabled={!canPaint}
          pressed={selected === EMPTY_CELL}
        />
        <PillButton3D
          round
          ariaLabel="Tout effacer"
          title="Tout effacer"
          icon={<RotateCcw className="h-5 w-5 shrink-0" aria-hidden />}
          onClick={() => setBoard({ grid: initial(), fresh: new Set() })}
          disabled={!canPaint || !painted}
        />
      </div>

      <SubmitButton
        onClick={() => onSubmit(JSON.stringify(grid.map((row) => row.join(""))))}
        disabled={disabled || phase !== "draw" || !painted}
      />
    </div>
  );
}

/**
 * La hauteur de l'écran barres du navigateur dépliées (`100svh`), moins la
 * barre d'accueil des iPhone. `innerHeight` grandit quand la barre d'adresse
 * se replie : calées dessus, les cases changeraient de taille au défilement,
 * et « Valider » passerait sous la barre à son retour.
 */
function screenHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;" +
    "height:calc(100svh - env(safe-area-inset-bottom, 0px))";
  document.body.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  // Un navigateur sans `svh` ignore la déclaration : la sonde n'a pas de hauteur.
  return height > 0 ? Math.min(height, window.innerHeight) : window.innerHeight;
}

/** Le nom d'un cadre, posé sur sa bordure comme une étiquette : il ne prend pas de hauteur. */
function FrameLabel({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute -top-3 left-2.5 z-10 rounded-full border border-[#d6c39a] bg-[#fff8e6] px-2 font-display text-[11px] font-extrabold leading-[18px] text-amber-900">
      {children}
    </span>
  );
}

/** Le modèle, petit et en lecture seule, sur sa carte crème. */
function MiniGrid({
  rows,
  width,
  cell,
  colorOf,
}: {
  rows: string[];
  width: number;
  cell: number;
  colorOf: (key: string) => string | undefined;
}) {
  return (
    <div
      className="grid rounded-xl border-3 border-white bg-[#fff8e6] p-1 shadow-[0_4px_0_#d6c39a,0_10px_16px_-12px_rgba(60,30,0,0.45)]"
      style={{ gridTemplateColumns: `repeat(${width}, ${cell}px)` }}
      aria-label="Le modèle à reproduire"
    >
      {rows.flatMap((row, r) =>
        Array.from({ length: width }, (_, c) => {
          const key = row[c] ?? EMPTY_CELL;
          return (
            <div
              key={`${r}-${c}`}
              className="border border-[#f3e7c6]"
              style={{ width: cell, height: cell, backgroundColor: key === EMPTY_CELL ? CELL_EMPTY : (colorOf(key) ?? CELL_EMPTY) }}
            />
          );
        }),
      )}
    </div>
  );
}
