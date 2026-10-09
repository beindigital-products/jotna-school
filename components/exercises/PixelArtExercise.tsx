"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Eraser, Eye, RotateCcw } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import { FRAME, fitGrid } from "./pixel-grid-fit";
import { EMPTY_CELL, type PixelArtView, type PixelPaint } from "@/convex/paliers/games/types";

/** L'air laissé sous « Valider », pour qu'il ne colle pas au bas de l'écran. */
const BOTTOM_SLACK = 12;

/**
 * LE DESSIN SUR QUADRILLAGE — reproduire un modèle, le redessiner de
 * mémoire, compléter une symétrie, faire un coloriage magique.
 *
 * L'enfant choisit une couleur, puis touche les cases — ou glisse le doigt
 * pour en peindre plusieurs. Toucher une case déjà de cette couleur l'efface,
 * comme la gomme. En symétrie, la moitié donnée est verrouillée, un peu
 * pâlie tant que l'enfant dessine, et le miroir est tracé en rouge.
 *
 * TOUT TIENT DANS L'ÉCRAN, « Valider » compris : la taille des cases se
 * calcule sur la place libre (`pixel-grid-fit.ts`), mesurée avant le premier
 * affichage.
 */
export default function PixelArtExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<PixelArtView>>) {
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
  const [grid, setGrid] = useState<string[][]>(initial);
  const [selected, setSelected] = useState<string>(palette[0]?.key ?? EMPTY_CELL);
  const showSeconds = Math.max(2, Math.min(15, payload?.showSeconds ?? 5));
  const [phase, setPhase] = useState<"show" | "draw">(mode === "memory" ? "show" : "draw");
  const [remaining, setRemaining] = useState(showSeconds);
  const [peeking, setPeeking] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(1);
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
        height: Math.floor(
          screenHeight() - (zoneBox.top + window.scrollY) - (box.bottom - zoneBox.bottom) - BOTTOM_SLACK,
        ),
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
  }, [valid]);

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
    setGrid((prev) => {
      if (prev[r][c] === value) return prev;
      const next = prev.map((row) => [...row]);
      next[r][c] = value;
      return next;
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

  return (
    <div ref={rootRef} className="space-y-4 sm:space-y-5">
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
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-3 border-dashed border-gray-300 bg-gray-50 text-center"
                  style={{ width: modelCell * width + FRAME, height: modelCell * height + FRAME }}
                >
                  <span className="text-3xl" aria-hidden>
                    🙈
                  </span>
                  <span className="px-2 text-xs font-bold text-gray-500">Caché !</span>
                </div>
              )}
              {mode === "memory" && phase === "show" && (
                <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg font-extrabold text-white shadow-lg">
                  {remaining}
                </span>
              )}
            </div>
            {mode === "memory" && (
              // Une colonne de largeur fixe, même vide : le modèle ne bouge
              // pas d'une phase à l'autre.
              <div className="flex w-28 flex-col items-center gap-2 text-center">
                {phase === "show" && (
                  <button
                    type="button"
                    onClick={() => setPhase("draw")}
                    className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-bold leading-tight text-orange-800 hover:bg-orange-200"
                  >
                    J&apos;ai retenu !
                  </button>
                )}
                {phase === "draw" && peeksLeft > 0 && !disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setPeeksLeft((n) => n - 1);
                      setPeeking(true);
                    }}
                    className="inline-flex flex-col items-center gap-0.5 rounded-xl bg-sky-100 px-3 py-2 text-sm font-bold leading-tight text-sky-800 hover:bg-sky-200"
                  >
                    <Eye className="h-4 w-4" aria-hidden /> Revoir 3 secondes
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {model && <FrameLabel>Ton dessin</FrameLabel>}
          <div
            className={`relative rounded-xl border-3 p-1 ${
              solved
                ? "border-green-400 animate-[pop-in_0.45s_ease-out]"
                : isCorrect === false
                  ? "border-red-400 animate-[shake_0.5s_ease-in-out]"
                  : "border-gray-300"
            } ${canPaint || solved ? "" : "opacity-80"}`}
          >
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
                  return (
                    <div
                      key={`${r}-${c}`}
                      role="gridcell"
                      aria-label={`Ligne ${r + 1}, colonne ${c + 1}${color ? `, ${palette.find((p) => p.key === cell)?.name}` : ", vide"}`}
                      className={`relative flex items-center justify-center border border-gray-200 text-[11px] font-bold ${
                        pale ? "after:absolute after:inset-0 after:bg-white/25" : ""
                      }`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: color ?? (pale ? "#f3f4f6" : "#ffffff"),
                      }}
                    >
                      {digit && digit !== "0" && (
                        <span className={color ? "text-white/90 drop-shadow" : "text-gray-400"}>{digit}</span>
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
          </div>
        </div>
      </div>

      {/* Une seule rangée sur téléphone : quatre couleurs au plus, la gomme
          et « Tout effacer » en icônes, nommés sur grand écran. Les numéros
          du coloriage magique sont sur les pastilles : elles font légende. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {palette.map((paint, i) => (
          <button
            key={paint.key}
            type="button"
            onClick={() => setSelected(paint.key)}
            disabled={!canPaint}
            aria-pressed={selected === paint.key}
            aria-label={numbers ? `${i + 1} : ${paint.name}` : paint.name}
            title={numbers ? `${i + 1} : ${paint.name}` : paint.name}
            className={`flex h-10 min-w-10 items-center justify-center rounded-full border-3 px-0.5 transition-all ${
              selected === paint.key ? "scale-110 border-gray-900 shadow-lg" : "border-white shadow"
            } disabled:opacity-60`}
            style={{ backgroundColor: paint.color }}
          >
            {numbers && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[11px] font-extrabold text-gray-900">
                {i + 1}
              </span>
            )}
          </button>
        ))}
        <ToolButton
          label="Gomme"
          icon={<Eraser className="h-4 w-4 shrink-0" aria-hidden />}
          onClick={() => setSelected(EMPTY_CELL)}
          disabled={!canPaint}
          pressed={selected === EMPTY_CELL}
        />
        <ToolButton
          label="Tout effacer"
          icon={<RotateCcw className="h-4 w-4 shrink-0" aria-hidden />}
          onClick={() => setGrid(initial())}
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
    <span className="pointer-events-none absolute -top-3 left-2.5 z-10 rounded-full bg-white px-1.5 text-[11px] font-bold leading-[18px] text-gray-500">
      {children}
    </span>
  );
}

/** Gomme, « Tout effacer » : une icône sur téléphone, l'icône et son nom sur grand écran. */
function ToolButton({
  label,
  icon,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border-3 bg-white px-2 text-sm font-bold text-gray-700 transition-all sm:px-4 ${
        pressed ? "scale-105 border-gray-900 shadow-lg" : "border-gray-200 shadow"
      } disabled:opacity-50`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Le modèle, petit et en lecture seule. */
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
      className="grid rounded-xl border-3 border-amber-300 bg-white p-1"
      style={{ gridTemplateColumns: `repeat(${width}, ${cell}px)` }}
      aria-label="Le modèle à reproduire"
    >
      {rows.flatMap((row, r) =>
        Array.from({ length: width }, (_, c) => {
          const key = row[c] ?? EMPTY_CELL;
          return (
            <div
              key={`${r}-${c}`}
              className="border border-gray-100"
              style={{ width: cell, height: cell, backgroundColor: key === EMPTY_CELL ? "#ffffff" : (colorOf(key) ?? "#ffffff") }}
            />
          );
        }),
      )}
    </div>
  );
}
