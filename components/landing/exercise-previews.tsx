"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, CheckCircle2, GripVertical, Volume2 } from "lucide-react";

import type { Example } from "./exercise-catalog";

/**
 * LES APERÇUS ANIMÉS des cartes d'exercice de la vitrine.
 *
 * Chaque aperçu joue un exemple court (`exercise-catalog.ts`) : au repos,
 * l'exercice tel que l'enfant le découvre ; `hovered` vrai, le geste qui le
 * résout et sa validation. La carte passe `hovered` au survol (souris) et au
 * toucher (téléphone). Les aperçus sont décoratifs : la carte les cache aux
 * lecteurs d'écran (`aria-hidden`) et dit le type en toutes lettres.
 *
 * Les cinq premiers sont les anciens aperçus de la vitrine, rendus
 * paramétrables ; les cinq derniers montrent la phrase à trous et les jeux.
 */

type PreviewProps<K extends Example["kind"]> = {
  hovered: boolean;
  example: Extract<Example, { kind: K }>;
};

// ===========================================================================
// LES CLASSIQUES
// ===========================================================================

function QcmPreview({ hovered, example }: PreviewProps<"qcm">) {
  return (
    <div className="space-y-2.5">
      <p className="text-center text-sm font-bold text-gray-800">{example.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {example.options.map((option, i) => {
          const ok = i === example.correct;
          return (
            <motion.div
              key={option}
              animate={
                ok
                  ? hovered
                    ? {
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(16,185,129,0)",
                          "0 0 0 6px rgba(16,185,129,0.18)",
                          "0 0 0 0 rgba(16,185,129,0)",
                        ],
                        transition: {
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        },
                      }
                    : { scale: 1, boxShadow: "0 0 0 0 rgba(16,185,129,0)" }
                  : hovered
                    ? {
                        opacity: 0.45,
                        transition: { duration: 0.3, delay: 0.1 + i * 0.05 },
                      }
                    : { opacity: 1 }
              }
              className={
                ok
                  ? "flex items-center justify-between gap-1 rounded-xl border-2 border-emerald-400 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700"
                  : "flex items-center justify-between gap-1 rounded-xl border-2 border-gray-100 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-gray-500"
              }
            >
              <span>{option}</span>
              {ok && (
                <motion.span
                  animate={hovered ? { rotate: [0, 15, -10, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="flex-none"
                >
                  <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DragDropPreview({ hovered, example }: PreviewProps<"drag-drop">) {
  const [first, second] = example.items;
  return (
    <div className="space-y-2.5">
      <motion.div
        animate={
          hovered
            ? {
                borderColor: "rgb(34,197,94)",
                backgroundColor: "rgba(220,252,231,0.9)",
              }
            : {
                borderColor: "rgb(253,186,116)",
                backgroundColor: "rgba(255,255,255,0.7)",
              }
        }
        transition={{ duration: 0.3, delay: hovered ? 0.45 : 0 }}
        className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-xs font-bold"
      >
        <span className="flex items-center gap-2 text-orange-700">
          <ArrowDownToLine className="size-4 flex-none" aria-hidden />
          Déposer ici : {example.zone}
        </span>
        <motion.span
          initial={false}
          animate={hovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.3, delay: hovered ? 0.55 : 0 }}
          className="flex-none"
        >
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
        </motion.span>
      </motion.div>
      <div className="flex gap-2">
        <motion.span
          animate={
            hovered
              ? { y: -40, x: 14, opacity: 0, scale: 0.85 }
              : { y: 0, x: 0, opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <GripVertical className="size-3 text-gray-400" aria-hidden />
          {first}
        </motion.span>
        <motion.span
          animate={hovered ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{
            duration: 1,
            repeat: hovered ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <GripVertical className="size-3 text-gray-400" aria-hidden />
          {second}
        </motion.span>
      </div>
    </div>
  );
}

function AssociationPreview({ hovered, example }: PreviewProps<"match">) {
  return (
    <div className="space-y-2">
      {example.pairs.map((pair, i) => (
        <div
          key={pair[0]}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 text-xs font-bold"
        >
          <motion.span
            animate={
              hovered
                ? {
                    backgroundColor: "rgb(224,242,254)",
                    scale: [1, 1.04, 1],
                  }
                : { backgroundColor: "rgb(255,255,255)", scale: 1 }
            }
            transition={{ duration: 0.4, delay: i * 0.2 }}
            className="rounded-lg px-2.5 py-1.5 text-center text-gray-700 shadow-sm ring-1 ring-sky-200"
          >
            {pair[0]}
          </motion.span>
          <motion.span
            animate={
              hovered
                ? { scale: [1, 1.4, 1], color: "#0284c7" }
                : { scale: 1, color: "#7dd3fc" }
            }
            transition={{
              duration: 0.6,
              delay: i * 0.2 + 0.1,
              repeat: hovered ? Number.POSITIVE_INFINITY : 0,
              repeatDelay: 0.8,
            }}
            aria-hidden
            className="font-black"
          >
            ←→
          </motion.span>
          <motion.span
            animate={
              hovered
                ? {
                    backgroundColor: "rgb(224,242,254)",
                    scale: [1, 1.04, 1],
                  }
                : { backgroundColor: "rgb(255,255,255)", scale: 1 }
            }
            transition={{ duration: 0.4, delay: i * 0.2 + 0.2 }}
            className="rounded-lg px-2.5 py-1.5 text-center text-gray-700 shadow-sm ring-1 ring-sky-200"
          >
            {pair[1]}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function OrderPreview({ hovered, example }: PreviewProps<"order">) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm font-extrabold">
      {example.items.map((item, i) => (
        <motion.span
          key={`${item}-${i}`}
          animate={
            hovered
              ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={{
            duration: 0.5,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
          className="relative flex h-9 min-w-9 items-center justify-center rounded-lg bg-white px-2.5 text-lime-800 shadow-sm ring-1 ring-lime-300"
        >
          <motion.span
            initial={false}
            animate={
              hovered
                ? { scale: [0.6, 1.3, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.35, delay: i * 0.08 + 0.05 }}
            className="absolute -top-1.5 -right-1 flex size-4 items-center justify-center rounded-full bg-lime-500 text-[9px] font-bold text-white"
          >
            {i + 1}
          </motion.span>
          {item}
        </motion.span>
      ))}
    </div>
  );
}

function FreeAnswerPreview({ hovered, example }: PreviewProps<"short-answer">) {
  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-bold text-gray-800">{example.question}</p>
      <motion.div
        animate={
          hovered
            ? { borderColor: "rgb(34,197,94)" }
            : { borderColor: "rgb(250,204,21)" }
        }
        transition={{ duration: 0.3, delay: hovered ? 0.3 : 0 }}
        className="rounded-xl border-2 bg-white px-3 py-2 shadow-sm"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Ta réponse
        </p>
        <p className="mt-0.5 flex items-center text-base font-extrabold text-gray-900">
          <motion.span
            animate={hovered ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block"
          >
            {example.answer}
          </motion.span>
          <motion.span
            aria-hidden
            animate={hovered ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-amber-500 align-middle"
          />
        </p>
        <div className="mt-0.5 h-4 overflow-hidden">
          <motion.div
            initial={false}
            animate={
              hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
            }
            transition={{ duration: 0.3, delay: hovered ? 0.35 : 0 }}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"
          >
            <CheckCircle2 className="size-3" aria-hidden />
            Validé !
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ===========================================================================
// LA PHRASE À TROUS ET LES JEUX
// ===========================================================================

function FillBlankPreview({ hovered, example }: PreviewProps<"fill-blank">) {
  const answer = example.options[example.correct];
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold leading-8 text-gray-800">
        {example.before}{" "}
        <motion.span
          animate={
            hovered
              ? { backgroundColor: "rgb(209,250,229)", borderColor: "rgb(52,211,153)" }
              : { backgroundColor: "rgba(255,255,255,0.8)", borderColor: "rgb(167,139,250)" }
          }
          transition={{ duration: 0.3, delay: hovered ? 0.4 : 0 }}
          className="inline-block min-w-20 rounded-md border-2 border-dashed px-2 text-center font-bold text-emerald-700"
        >
          <motion.span
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2, delay: hovered ? 0.5 : 0 }}
            className="inline-block"
          >
            {answer}
          </motion.span>
        </motion.span>{" "}
        {example.after}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {example.options.map((option, i) => (
          <motion.span
            key={option}
            animate={
              hovered
                ? { opacity: i === example.correct ? 0.5 : 0.35, y: i === example.correct ? -2 : 0 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.3, delay: hovered ? 0.2 : 0 }}
            className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
          >
            {option}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function PatternPreview({ hovered, example }: PreviewProps<"pattern">) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1.5">
        {example.sequence.map((token, i) =>
          token === null ? (
            <motion.span
              key={`blank-${i}`}
              animate={
                hovered
                  ? { borderColor: "rgb(52,211,153)", backgroundColor: "rgb(209,250,229)" }
                  : { borderColor: "rgb(251,113,133)", backgroundColor: "rgba(255,255,255,0.8)" }
              }
              transition={{ duration: 0.3, delay: hovered ? 0.35 : 0 }}
              className="relative flex size-9 items-center justify-center rounded-xl border-2 border-dashed text-base font-extrabold"
            >
              <motion.span
                animate={{ opacity: hovered ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="absolute text-rose-500"
              >
                ?
              </motion.span>
              <motion.span
                initial={false}
                animate={hovered ? { opacity: 1, scale: [0.5, 1.25, 1] } : { opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, delay: hovered ? 0.4 : 0 }}
                className="absolute text-emerald-700"
              >
                {example.answer}
              </motion.span>
            </motion.span>
          ) : (
            <span
              key={`${token}-${i}`}
              className="flex size-9 items-center justify-center rounded-xl bg-white text-base font-extrabold text-gray-800 shadow-sm ring-1 ring-rose-200"
            >
              {token}
            </span>
          ),
        )}
      </div>
      <div className="flex justify-center gap-2">
        {example.options.map((option) => (
          <motion.span
            key={option}
            animate={hovered && option === example.answer ? { opacity: 0.4, y: -3 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-sm font-bold text-gray-700 shadow-sm"
          >
            {option}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// Un cœur de 6 × 5 cases, le dessin que reproduisent et complètent les deux
// variantes de l'aperçu. `.` est une case vide ; son axe de symétrie passe entre
// la troisième et la quatrième colonne.
const HEART = [".R..R.", "RRRRRR", "RRRRRR", ".RRRR.", "..RR.."];
const HEART_COLS = 6;
const PAINT_ON = "#ef4444";
const PAINT_OFF = "#f3f4f6";

/** Une case est donnée d'emblée, à peindre (elle se colore au geste) ou toujours vide. */
type PixelKind = "given" | "paint";

function PixelGrid({
  cell,
  hovered,
  kindOf,
  mirror = false,
}: {
  cell: number;
  hovered: boolean;
  kindOf: (row: number, col: number) => PixelKind;
  /** L'axe du miroir, tireté, entre les deux moitiés. */
  mirror?: boolean;
}) {
  return (
    <div className="relative rounded-md bg-white p-1 shadow-sm ring-1 ring-fuchsia-200">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${HEART_COLS}, ${cell}px)` }}
      >
        {HEART.flatMap((line, r) =>
          [...line].map((ch, c) => {
            const color =
              ch === "." ? PAINT_OFF : kindOf(r, c) === "given" || hovered ? PAINT_ON : PAINT_OFF;
            return (
              <motion.span
                key={`${r}-${c}`}
                animate={{ backgroundColor: color }}
                transition={{ duration: 0.25, delay: hovered ? (r * HEART_COLS + c) * 0.03 : 0 }}
                style={{ width: cell, height: cell }}
                className="rounded-[3px]"
              />
            );
          }),
        )}
      </div>
      {mirror && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0.5 left-1/2 border-l-2 border-dashed border-fuchsia-400"
        />
      )}
    </div>
  );
}

function PixelArtPreview({ hovered, example }: PreviewProps<"pixel-art">) {
  if (example.variant === "symmetry") {
    return (
      <div className="flex flex-col items-center gap-2">
        <PixelGrid
          cell={20}
          hovered={hovered}
          kindOf={(_, c) => (c < HEART_COLS / 2 ? "given" : "paint")}
          mirror
        />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Complète l&apos;autre moitié
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-end justify-center gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <PixelGrid cell={9} hovered={hovered} kindOf={() => "given"} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Modèle</p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <PixelGrid cell={20} hovered={hovered} kindOf={() => "paint"} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ton dessin</p>
      </div>
    </div>
  );
}

const EQUALIZER = [0.4, 0.8, 0.55, 1, 0.6, 0.9, 0.45];

function ListenPreview({ hovered, example }: PreviewProps<"listen">) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3">
        <motion.span
          animate={hovered ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{
            duration: 0.8,
            repeat: hovered ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
          className="flex size-11 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md"
        >
          <Volume2 className="size-5" aria-hidden />
        </motion.span>
        <div className="flex h-9 items-center gap-1" aria-hidden>
          {EQUALIZER.map((height, i) => (
            <motion.span
              key={i}
              animate={hovered ? { scaleY: [1, 0.35, 1] } : { scaleY: 1 }}
              transition={{
                duration: 0.7,
                repeat: hovered ? Number.POSITIVE_INFINITY : 0,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
              style={{ height: `${height * 100}%` }}
              className="w-1.5 rounded-full bg-cyan-500"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {example.options.map((option, i) => {
          const ok = i === example.correct;
          return (
            <motion.span
              key={option}
              animate={
                hovered
                  ? ok
                    ? { borderColor: "rgb(52,211,153)", backgroundColor: "rgb(209,250,229)" }
                    : { borderColor: "rgb(243,244,246)", opacity: 0.45 }
                  : { borderColor: "rgb(165,243,252)", backgroundColor: "rgb(255,255,255)", opacity: 1 }
              }
              transition={{ duration: 0.3, delay: hovered ? 0.5 : 0 }}
              className="flex items-center justify-center gap-1 rounded-xl border-2 px-2 py-1.5 text-xs font-bold text-gray-700"
            >
              {option}
              {ok && hovered && <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden />}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function ColorMixPreview({ hovered, example }: PreviewProps<"color-mix">) {
  const { a, b, result } = example;
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex items-center gap-3">
        <span className="flex">
          <span
            className="size-11 rounded-full shadow-sm ring-2 ring-white"
            style={{ backgroundColor: a.color }}
          />
          <span
            className="-ml-3 size-11 rounded-full shadow-sm ring-2 ring-white"
            style={{ backgroundColor: b.color }}
          />
        </span>
        <span className="text-xl font-black text-gray-400" aria-hidden>
          =
        </span>
        <motion.span
          animate={
            hovered
              ? { backgroundColor: result.color, scale: [0.8, 1.15, 1], borderColor: result.color }
              : { backgroundColor: "rgb(255,255,255)", scale: 1, borderColor: "rgb(110,231,183)" }
          }
          transition={{ duration: 0.5, delay: hovered ? 0.2 : 0 }}
          className="flex size-11 items-center justify-center rounded-full border-2 border-dashed text-base font-extrabold text-emerald-600"
        >
          {!hovered && "?"}
        </motion.span>
      </div>
      <p className="text-xs font-bold text-gray-700">
        {a.name} + {b.name} ={" "}
        <motion.span
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3, delay: hovered ? 0.5 : 0 }}
          className="inline-block text-emerald-700"
        >
          {result.name}
        </motion.span>
      </p>
    </div>
  );
}

// ===========================================================================
// LE CHOIX DE L'APERÇU
// ===========================================================================

export function LandingPreview({ example, hovered }: { example: Example; hovered: boolean }) {
  switch (example.kind) {
    case "qcm":
      return <QcmPreview hovered={hovered} example={example} />;
    case "drag-drop":
      return <DragDropPreview hovered={hovered} example={example} />;
    case "match":
      return <AssociationPreview hovered={hovered} example={example} />;
    case "order":
      return <OrderPreview hovered={hovered} example={example} />;
    case "short-answer":
      return <FreeAnswerPreview hovered={hovered} example={example} />;
    case "fill-blank":
      return <FillBlankPreview hovered={hovered} example={example} />;
    case "pattern":
      return <PatternPreview hovered={hovered} example={example} />;
    case "pixel-art":
      return <PixelArtPreview hovered={hovered} example={example} />;
    case "listen":
      return <ListenPreview hovered={hovered} example={example} />;
    case "color-mix":
      return <ColorMixPreview hovered={hovered} example={example} />;
  }
}
