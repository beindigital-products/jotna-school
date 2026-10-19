"use client";

import { useState } from "react";
import { Reward, shade, useGameFeel } from "@/components/student/game-kit";
import { Caption, PaintBlob, SandTable, Shelf, VerdictMedal } from "@/components/student/game-kit/ecrans-decor";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { ColorMixView, Paint } from "@/convex/paliers/games/types";

/**
 * L'ATELIER DES COULEURS — un laboratoire de peinture.
 *
 * Les pots sont de vrais pots : un cylindre éclairé à gauche et sombre à
 * droite, un bord crème, la peinture qui affleure, une coulure sur le devant,
 * une étiquette de papier avec le nom. Ils sont debout sur une étagère de
 * bois ; celui que l'enfant touche se soulève (son ombre s'éloigne). Le bol
 * est un bocal de verre : on y voit les deux peintures versées côte à côte,
 * et, quand la réponse est juste, elles tourbillonnent une fois et la
 * couleur trouvée prend toute la place, en fondu.
 *
 * - « pick » : toucher le pot de la couleur demandée ;
 * - « result » : deux pots penchés se versent dans le bocal, l'enfant choisit
 *   ce qui en sort ;
 * - « pair » : une couleur à obtenir, l'enfant choisit les deux pots à
 *   mélanger. Le bocal montre les deux peintures sans les mêler : le mélange
 *   se révèle quand la réponse est juste.
 *
 * Tout bouge en `transform` et en `opacity`. Le contrat ne change pas :
 * mêmes props, la réponse part en `JSON.stringify(picked)`, les boutons
 * s'appellent toujours « Pot rouge » et portent `aria-pressed`. « Valider »
 * (`SubmitButton`) est dans la barre d'action : « Écouter » vient juste
 * au-dessus pour un enfant qui apprend à lire.
 */
export default function ColorMixExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<ColorMixView>>) {
  const mode = payload?.mode;
  const choices = Array.isArray(payload?.choices) ? payload.choices.filter(isPaint) : [];
  const given = Array.isArray(payload?.given) ? payload.given.filter(isPaint) : [];
  const target = payload?.target && isPaint(payload.target) ? payload.target : null;
  const need = mode === "pair" ? 2 : 1;
  const [picked, setPicked] = useState<string[]>([]);
  const feel = useGameFeel();

  const valid =
    (mode === "pick" || mode === "result" || mode === "pair") &&
    choices.length >= 2 &&
    (mode !== "result" || given.length === 2) &&
    (mode !== "pair" || target !== null);
  if (!valid) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const toggle = (name: string) => {
    if (disabled) return;
    feel.vibrate("tap");
    setPicked((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (need === 1) return [name];
      return prev.length >= need ? [prev[1], name] : [...prev, name];
    });
  };

  const paintOf = (name: string) => choices.find((c) => c.name === name);
  const bowl: Paint[] =
    mode === "result" ? given : mode === "pair" ? picked.map(paintOf).filter(isPaint) : [];
  // Le mélange se montre quand il est juste : en mode « pair », c'est la
  // couleur visée ; en mode « result », la couleur choisie.
  const revealed =
    isCorrect === true ? (mode === "pair" ? target : mode === "result" ? paintOf(picked[0] ?? "") ?? null : null) : null;
  const lab = mode === "result" || mode === "pair";

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div className="gk-motion relative space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} />

      {mode === "pair" && target && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-white bg-[#fff8e6] px-4 py-3 shadow-[0_4px_0_#d6c39a,0_10px_16px_-12px_rgba(60,30,0,0.45)]">
          <Caption>À obtenir&nbsp;:</Caption>
          <PaintBlob color={target.color} size={48} />
          <span className="font-display text-xl font-extrabold text-amber-950">{target.name}</span>
        </div>
      )}

      {/* Le laboratoire : le bocal, et les pots qui s'y versent. */}
      {lab && (
        <SandTable verdict={isCorrect} className="px-3 pb-4 pt-5">
          <div className="flex items-end justify-center gap-1">
            {mode === "result" && <PouringPot paint={given[0]} side="left" />}
            <Jar paints={bowl} revealed={revealed} />
            {mode === "result" && <PouringPot paint={given[1]} side="right" />}
          </div>
          <Reward fire={isCorrect === true ? "juste" : null} />
        </SandTable>
      )}

      {/* L'étagère : les pots à toucher, debout sur une planche. */}
      <div className="relative">
        <Caption className="mb-3 text-center">
          {mode === "pair" ? "Touche deux pots :" : "Touche le bon pot :"}
        </Caption>
        <div className="relative z-10 flex flex-wrap items-end justify-center gap-x-3 gap-y-6 px-3">
          {choices.map((paint) => {
            const on = picked.includes(paint.name);
            return (
              <button
                key={paint.name}
                type="button"
                onClick={() => toggle(paint.name)}
                disabled={disabled}
                aria-pressed={on}
                aria-label={`Pot ${paint.name}`}
                data-picked={on ? "1" : "0"}
                className={`group relative block rounded-2xl px-1 pt-2 gk-focus ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                } ${disabled && !on ? "opacity-70" : ""}`}
              >
                <PaintPot paint={paint} lifted={on} verdict={on ? isCorrect : null} pressable={!disabled} />
              </button>
            );
          })}
        </div>
        <Shelf className="-mt-2" />
        {!lab && <Reward fire={isCorrect === true ? "juste" : null} />}
      </div>

      <SubmitButton
        onClick={() => picked.length === need && onSubmit(JSON.stringify(picked))}
        disabled={disabled || picked.length !== need}
      />
    </div>
  );
}

function isPaint(value: unknown): value is Paint {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Paint).name === "string" &&
    typeof (value as Paint).color === "string"
  );
}

/* ── Les pièces ──────────────────────────────────────────────────────────── */

/**
 * Un pot de peinture en volume : le corps (un cylindre, clair à gauche et
 * sombre à droite, peint en dégradé), le bord crème, la peinture qui affleure
 * avec son reflet, une coulure, l'étiquette. Il se soulève quand on le tient,
 * gonfle quand il est juste, dit non quand il est faux. Décoratif : le bouton
 * autour porte le nom.
 */
function PaintPot({
  paint,
  size = 72,
  lifted = false,
  verdict = null,
  pressable = false,
}: {
  paint: Paint;
  size?: number;
  lifted?: boolean;
  verdict?: boolean | null;
  pressable?: boolean;
}) {
  const color = paint.color;
  const light = shade(color, 1.3);
  const dark = shade(color, 0.7);
  const motion =
    verdict === true
      ? "animate-[gk-pop_0.45s_ease-out]"
      : verdict === false
        ? "animate-[gk-shake-soft_0.45s_ease-in-out]"
        : "";
  return (
    <span aria-hidden className="relative block" style={{ width: size, height: Math.round(size * 1.16) }} data-lifted={lifted ? "1" : "0"}>
      {/* L'ombre sur l'étagère, qui s'éloigne quand le pot se soulève. */}
      <span
        className={`absolute inset-x-1 bottom-0 h-4 rounded-full shadow-[0_6px_12px_rgb(60_30_0_/_0.55)] will-change-transform transition-[transform,translate,opacity] duration-200 ease-out ${
          lifted ? "translate-y-[8px] opacity-25" : "translate-y-[2px] opacity-40"
        }`}
      />
      {/* L'objet : il se soulève quand on le tient, s'enfonce sous le doigt. */}
      <span
        className={`gk-spring absolute inset-0 transition-transform duration-[220ms] ${
          lifted ? "-translate-y-[6px] scale-[1.05]" : ""
        } ${pressable ? "group-active:translate-y-[2px] group-active:scale-100" : ""} ${motion}`}
      >
        {/* Le corps du pot. */}
        <span
          className="absolute inset-x-0 bottom-0 top-[16%] rounded-b-[30%] rounded-t-[6px] border border-black/10"
          style={{ backgroundImage: `linear-gradient(90deg, ${light} 0%, ${shade(color, 1.08)} 28%, ${color} 55%, ${dark} 100%)` }}
        />
        {/* L'étiquette de papier, avec le nom de la couleur. */}
        <span className="absolute inset-x-[7%] top-[52%] flex h-[24%] items-center justify-center rounded-md border border-[#d6c39a] bg-[#fff8e6] px-0.5 font-display text-[11px] font-extrabold leading-none text-amber-950 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9)]">
          <span className="truncate">{paint.name}</span>
        </span>
        {/* Une coulure sur le devant. */}
        <span
          className="absolute left-[64%] top-[22%] h-[24%] w-[11%] rounded-b-full"
          style={{ backgroundColor: color, boxShadow: `inset -2px 0 0 ${dark}` }}
        />
        {/* Le bord du pot : une ellipse crème, et la peinture dedans. */}
        <span className="absolute inset-x-[-3%] top-0 h-[30%] rounded-full border-2 border-[#d6c39a] bg-[linear-gradient(180deg,#fff7e0_0%,#e9d9ad_100%)]" />
        <span
          className="absolute inset-x-[8%] top-[6%] h-[18%] rounded-full"
          style={{
            backgroundImage: `radial-gradient(ellipse at 40% 35%, ${light} 0%, ${color} 60%, ${dark} 100%)`,
            boxShadow: "inset 0 2px 3px rgba(0,0,0,0.25)",
          }}
        />
        <VerdictMedal verdict={verdict} />
      </span>
    </span>
  );
}

/** Un pot penché au-dessus du bocal, dont la peinture coule : « on mélange ». */
function PouringPot({ paint, side }: { paint: Paint; side: "left" | "right" }) {
  const sign = side === "left" ? 1 : -1;
  return (
    <span
      className="relative z-10 block"
      style={{
        transform: `translateY(-16px) rotate(${sign * 26}deg)`,
        transformOrigin: side === "left" ? "100% 100%" : "0% 100%",
      }}
    >
      <PaintPot paint={paint} size={60} />
      {/* Le filet de peinture qui coule du bord vers le bocal. */}
      <span
        aria-hidden
        className={`absolute top-[10%] h-12 w-2.5 rounded-full ${side === "left" ? "-right-1" : "-left-1"}`}
        style={{ backgroundColor: paint.color, boxShadow: `inset ${sign * -2}px 0 0 ${shade(paint.color, 0.75)}` }}
      />
    </span>
  );
}

/**
 * Le bocal de verre : les peintures versées, côte à côte ; quand le mélange
 * est trouvé, elles tourbillonnent une fois (`gk-roll`, dans le seul espace
 * de la peinture) pendant que la couleur trouvée prend la place en fondu.
 */
function Jar({ paints, revealed }: { paints: Paint[]; revealed: Paint | null }) {
  const halves =
    paints.length === 2
      ? `linear-gradient(90deg, ${paints[0].color} 50%, ${paints[1].color} 50%)`
      : paints.length === 1
        ? paints[0].color
        : "transparent";
  const empty = paints.length === 0 && !revealed;
  return (
    <span
      className="flex flex-col items-center gap-1.5"
      role="img"
      aria-label={revealed ? `Le mélange donne ${revealed.name}` : "Le bol de mélange"}
      data-revealed={revealed ? revealed.name : undefined}
    >
      <span className="relative block h-24 w-28">
        {/* L'ombre sur le sable. */}
        <span className="absolute inset-x-3 bottom-0 h-3 translate-y-[3px] rounded-full opacity-35 shadow-[0_6px_12px_rgb(60_30_0_/_0.55)]" />
        {/* Le verre, et la peinture dedans. */}
        <span className="absolute inset-x-0 bottom-0 top-2 overflow-hidden rounded-b-[2.75rem] rounded-t-md border-2 border-white/90 bg-white/45 shadow-[inset_0_-6px_12px_rgb(60_30_0_/_0.12)]">
          {/* Les peintures versées, côte à côte, pas encore mêlées. */}
          <span className="absolute inset-x-0 bottom-0 h-[72%]" style={{ background: halves }} />
          {/* Le tourbillon du mélange : les deux moitiés tournent une fois… */}
          {revealed && (
            <span className="absolute inset-x-0 bottom-0 h-[72%] overflow-hidden">
              <span className="absolute -inset-[40%] animate-[gk-roll_0.9s_ease-in-out]" style={{ background: halves }} />
            </span>
          )}
          {/* …et la couleur trouvée prend la place, en fondu. */}
          <span
            className={`absolute inset-x-0 bottom-0 h-[72%] transition-opacity duration-700 ease-out ${revealed ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundColor: revealed?.color ?? "transparent" }}
          />
          {/* La surface de la peinture, et le reflet du verre. */}
          {!empty && <span className="absolute inset-x-2 top-[26%] h-2 rounded-full bg-white/45" />}
          <span className="absolute bottom-3 left-2 top-3 w-1.5 rounded-full bg-white/60" />
          {empty && (
            <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold text-[#d6c39a]">?</span>
          )}
        </span>
        {/* Le col du bocal. */}
        <span className="absolute inset-x-[-2px] top-0 h-4 rounded-full border-2 border-[#d6c39a] bg-[linear-gradient(180deg,#fff7e0_0%,#e9d9ad_100%)]" />
      </span>
      <span className="font-display text-sm font-extrabold text-amber-900/80">{revealed ? revealed.name : "le bol"}</span>
    </span>
  );
}
