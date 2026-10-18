"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Reward, useGameFeel } from "@/components/student/game-kit";
import { FlyingToken, useTokenFlight } from "@/components/student/game-kit/choix-vol-jeton";
import { Caption, SandTable, VerdictMedal, WoodPlank } from "@/components/student/game-kit/ecrans-decor";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { PatternView } from "@/convex/paliers/games/types";

/**
 * LA FRISE À COMPLÉTER — un collier de perles sur une cordelette.
 *
 * La suite qui se répète est une guirlande posée sur le sable : une
 * cordelette de bois passe dans chaque perle, et les cases à remplir sont des
 * trous creusés dans le sable, cerclés de pointillés. Celui qui attend la
 * prochaine perle respire (un halo d'or qui bat). Les morceaux proposés sont
 * des perles épaisses rangées dans une boîte de bois : l'enfant en touche
 * une, elle vole jusqu'au trou (`useTokenFlight`, un ressort) et s'y pose
 * d'un petit gonflement ; le trou vide suivant s'allume. Toucher une perle
 * posée la rend à la boîte.
 *
 * Juste : les perles posées passent au vert et gonflent, la table aussi, la
 * récompense jaillit de la guirlande. Faux : elles passent à l'ambre et la
 * table dit non de la tête, sans rouge.
 *
 * Le contrat ne change pas : mêmes props, la réponse part toujours en
 * `JSON.stringify(filled)` (le jeton de chaque case vide, de gauche à droite),
 * et les noms accessibles sont ceux d'avant (« Placer 🔴 », « Case vide 1 »).
 * « Valider » (`SubmitButton`) est dans la barre d'action : « Écouter » vient
 * juste au-dessus pour un enfant qui apprend à lire.
 */
export default function PatternExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<PatternView>>) {
  const sequence = Array.isArray(payload?.sequence) ? payload.sequence : [];
  const options = Array.isArray(payload?.options)
    ? payload.options.filter((o): o is string => typeof o === "string")
    : [];
  const blankIndexes = sequence.flatMap((token, i) => (token === null ? [i] : []));
  const [filled, setFilled] = useState<(string | null)[]>(() => blankIndexes.map(() => null));
  const [active, setActive] = useState(0);
  // Le trou dont la perle est en vol : il ne la montre qu'à l'arrivée.
  const [landing, setLanding] = useState<number | null>(null);
  const feel = useGameFeel();
  const rootRef = useRef<HTMLDivElement>(null);
  const socketRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const beadRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onLand = useCallback(() => setLanding(null), []);
  const { flight, fly, land } = useTokenFlight(rootRef, onLand);

  if (sequence.length < 3 || blankIndexes.length === 0 || options.length < 2) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const place = (token: string) => {
    if (disabled) return;
    feel.vibrate("tap");
    const next = [...filled];
    next[active] = token;
    setFilled(next);
    setLanding(active);
    fly(token, beadRefs.current[token] ?? null, socketRefs.current[active] ?? null);
    const following = next.findIndex((value, i) => value === null && i !== active);
    if (following !== -1) setActive(following);
  };

  const clear = (blank: number) => {
    if (disabled) return;
    feel.vibrate("tap");
    const next = [...filled];
    next[blank] = null;
    setFilled(next);
    setActive(blank);
  };

  const complete = filled.every((token) => token !== null);
  // Un nombre se lit mieux en perle large ; un émoji, en perle ronde.
  const wide = sequence.some((token) => typeof token === "string" && token.length > 2) ||
    options.some((o) => o.length > 2);
  const verdict: BeadState = isCorrect === true ? "juste" : isCorrect === false ? "fausse" : "repos";

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div ref={rootRef} className="gk-motion relative space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} />

      {/* La guirlande : la cordelette passe dans chaque perle ; les cases vides
          sont des trous dans le sable. Les perles se touchent presque (4 px),
          comme sur un vrai collier : cinq perles de 56 px tiennent alors sur
          une ligne d'un téléphone de 390 px, et une frise de neuf fait deux
          rangées au lieu de trois (76 px de gagnés sur le premier écran). */}
      <SandTable verdict={isCorrect} className="px-1.5 py-4">
        <div className="relative flex flex-wrap items-center justify-center gap-x-1 gap-y-4">
          {sequence.map((token, i) => {
            const blank = blankIndexes.indexOf(i);
            // Chaque perle enfilée penche un peu, comme à la main.
            const lean = { transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2.5}deg)` } as CSSProperties;
            return (
              <span key={i} className="relative flex items-center justify-center">
                <Cord />
                {blank === -1 ? (
                  <Bead token={token as string} wide={wide} style={lean} />
                ) : (
                  <Socket
                    ref={(el) => {
                      socketRefs.current[blank] = el;
                    }}
                    blank={blank}
                    value={filled[blank]}
                    active={blank === active && filled[blank] === null && !disabled}
                    hidden={landing === blank}
                    wide={wide}
                    verdict={verdict}
                    disabled={disabled}
                    onPress={() => (filled[blank] ? clear(blank) : setActive(blank))}
                  />
                )}
              </span>
            );
          })}
        </div>
        <Reward fire={isCorrect === true ? "juste" : null} />
      </SandTable>

      {/* La boîte à perles : les morceaux à poser, sur une planche de bois. */}
      <WoodPlank contentClassName="px-3 pb-4 pt-3">
        <Caption onWood className="mb-2 text-center">
          Touche le bon morceau&nbsp;:
        </Caption>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((token) => (
            <button
              key={token}
              ref={(el) => {
                beadRefs.current[token] = el;
              }}
              type="button"
              onClick={() => place(token)}
              disabled={disabled}
              aria-label={`Placer ${token}`}
              className={`group relative block rounded-full gk-focus ${
                disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              }`}
            >
              <Bead token={token} wide={wide} size="lg" pressable />
            </button>
          ))}
        </div>
      </WoodPlank>

      <SubmitButton onClick={() => complete && onSubmit(JSON.stringify(filled))} disabled={disabled || !complete} />

      {/* La perle en vol, par-dessus tout, dans la racine. */}
      <FlyingToken flight={flight} onLand={land}>
        {flight && <BeadFace token={flight.text} wide={wide} className="h-full w-full text-3xl" />}
      </FlyingToken>
    </div>
  );
}

/* ── Les pièces ──────────────────────────────────────────────────────────── */

type BeadState = "repos" | "juste" | "fausse";

/** Les teintes d'une perle : la crème des cartes, le vert de « juste », l'ambre de « presque ». */
const BEAD_TONES: Record<BeadState, { top: string; bottom: string; flank: string; text: string }> = {
  repos: { top: "#ffffff", bottom: "#fff1cc", flank: "#d6c39a", text: "#451a03" },
  juste: { top: "#d9f99d", bottom: "#bbf7d0", flank: "#16a34a", text: "#052e16" },
  fausse: { top: "#fef3c7", bottom: "#fed7aa", flank: "#ea580c", text: "#431407" },
};

/** La cordelette qui traverse une perle : un bout par perle, bout à bout avec les voisins. */
function Cord() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -left-3 -right-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#d08a46_0%,#a5602c_55%,#7a4a23_100%)] shadow-[0_2px_0_rgba(60,30,0,0.2)]"
    />
  );
}

/** Le dessus d'une perle : la face bombée et son reflet. Sert aussi à la perle en vol. */
function BeadFace({
  token,
  wide,
  state = "repos",
  pressable = false,
  className = "",
}: {
  token: string;
  wide: boolean;
  state?: BeadState;
  pressable?: boolean;
  className?: string;
}) {
  const tone = BEAD_TONES[state];
  return (
    <span
      className={`gk-face-light relative flex items-center justify-center border-2 border-white/80 font-display font-extrabold leading-none transition-transform duration-[90ms] ease-out ${
        wide ? "rounded-2xl" : "rounded-full"
      } ${pressable ? "group-active:translate-y-[3px]" : ""} ${className}`}
      style={{ backgroundImage: `linear-gradient(180deg, ${tone.top} 0%, ${tone.bottom} 100%)`, color: tone.text }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-2 top-[3px] h-[38%] bg-gradient-to-b from-white/60 to-white/0 ${wide ? "rounded-xl" : "rounded-full"}`}
      />
      <span className="relative">{token}</span>
    </span>
  );
}

/**
 * Une perle épaisse : l'ombre sur le sable, le flanc de 4 px, la face. Elle
 * gonfle quand elle est juste, dit non quand elle est fausse, et apparaît
 * d'un petit gonflement quand elle vient de se poser (`popIn`).
 */
function Bead({
  token,
  wide,
  size = "md",
  state = "repos",
  pressable = false,
  popIn = false,
  style,
}: {
  token: string;
  wide: boolean;
  size?: "md" | "lg";
  state?: BeadState;
  pressable?: boolean;
  popIn?: boolean;
  style?: CSSProperties;
}) {
  const tone = BEAD_TONES[state];
  const box =
    size === "lg"
      ? wide
        ? "h-16 min-w-[5rem] px-3 text-3xl"
        : "h-16 w-16 text-4xl"
      : wide
        ? "h-14 min-w-[4.5rem] px-2 text-2xl"
        : "h-14 w-14 text-3xl";
  const shape = wide ? "rounded-2xl" : "rounded-full";
  const motion =
    state === "juste"
      ? "animate-[gk-pop_0.45s_ease-out]"
      : state === "fausse"
        ? "animate-[gk-shake-soft_0.45s_ease-in-out]"
        : popIn
          ? "animate-[gk-pop_0.3s_ease-out]"
          : "";
  return (
    <span className={`relative block ${box} ${motion}`} style={style} data-bead={state}>
      <span aria-hidden className={`absolute inset-0 translate-y-[5px] opacity-30 shadow-[0_5px_12px_rgb(60_30_0_/_0.5)] ${shape}`} />
      <span aria-hidden className={`absolute inset-0 ${shape}`} style={{ backgroundColor: tone.flank, transform: "translateY(4px)" }} />
      <BeadFace token={token} wide={wide} state={state} pressable={pressable} className="h-full w-full" />
      <VerdictMedal verdict={state === "juste" ? true : state === "fausse" ? false : null} />
    </span>
  );
}

/**
 * Un trou de la guirlande : vide, c'est un creux cerclé de pointillés (un
 * halo d'or bat sur celui qui attend) ; rempli, c'est la perle posée. Pendant
 * le vol de la perle (`hidden`), il reste creux : elle arrive.
 */
function Socket({
  ref,
  blank,
  value,
  active,
  hidden,
  wide,
  verdict,
  disabled,
  onPress,
}: {
  ref: (el: HTMLButtonElement | null) => void;
  blank: number;
  value: string | null;
  active: boolean;
  hidden: boolean;
  wide: boolean;
  verdict: BeadState;
  disabled: boolean;
  onPress: () => void;
}) {
  const shown = value !== null && !hidden;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={value ? `Case ${blank + 1} : ${value}, toucher pour la vider` : `Case vide ${blank + 1}`}
      data-blank={blank}
      data-filled={value !== null ? "1" : "0"}
      className={`group relative block gk-focus ${
        wide ? "h-14 min-w-[4.5rem] rounded-2xl" : "h-14 w-14 rounded-full"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Le halo d'or qui respire sur le trou qui attend (`twinkle` : opacité et échelle, rien d'autre). */}
      {active && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -inset-2 bg-[#ffb020]/50 animate-[twinkle_1.8s_ease-in-out_infinite] ${wide ? "rounded-3xl" : "rounded-full"}`}
        />
      )}
      {shown ? (
        <Bead key={value} token={value} wide={wide} state={verdict} popIn />
      ) : (
        <span
          className={`relative flex h-full w-full items-center justify-center border-[3px] border-dashed bg-[#fff1cc]/80 font-display text-2xl font-extrabold text-[#e9a83a] shadow-[inset_0_3px_6px_rgba(60,30,0,0.18)] ${
            wide ? "rounded-2xl px-2" : "rounded-full"
          } ${active ? "border-[#e9a83a]" : "border-[#d6c39a]"}`}
        >
          ?
        </span>
      )}
    </button>
  );
}
