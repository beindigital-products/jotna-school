"use client";

import { forwardRef, useCallback, useRef, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import {
  ActionButton3D,
  GESTURE_ACCENT,
  Reward,
  Tile3D,
  tileChosenTone,
  type TileState,
} from "@/components/student/game-kit";
import { FlyingToken, useTokenFlight } from "@/components/student/game-kit/choix-vol-jeton";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { BrokenExercise, ExerciseActions, type ExerciseScreenProps } from "./game-parts";
import { splitBlanks, type FillBlankView } from "@/convex/paliers/games/types";

/**
 * LA PHRASE À TROUS — des jetons qu'on saisit et qui viennent se poser.
 *
 * La phrase est posée sur une carte crème, en Fredoka. Chaque trou est une
 * case : vide, un pointillé crème ; en attente (le trou actif), une case
 * violette cerclée qui appelle le mot ; remplie, un jeton
 * violet avec son flanc, qui a l'air posé dedans. Les mots proposés sont des
 * tuiles épaisses (`Tile3D`, teinte « écrire », violet) : quand l'enfant en
 * touche une, un jeton part de la tuile, vole jusqu'au trou avec un ressort
 * (`useTokenFlight`) et le trou se remplit d'un `gk-pop` à l'arrivée. Sans
 * mouvement (`prefers-reduced-motion`, téléphone en mode sobre sans ressort),
 * le trou se remplit d'un coup.
 *
 * LE TROU SUIVANT S'OUVRE TOUT SEUL ; toucher un trou rempli permet de
 * changer d'avis. Juste : les cases passent au vert et la carte gonfle ;
 * fausse : à l'ambre, et la carte dit non doucement. La réponse part en
 * tableau, un mot par trou, comme avant ; les noms accessibles des trous
 * (« Trou 1 : une », « Trou 2, vide ») et des mots (le mot seul) ne changent
 * pas.
 *
 * « Valider » est posé dans la barre d'action (`ExerciseActions`,
 * `game-parts.tsx`) : pour un enfant qui apprend à lire, « Écouter » vient
 * juste au-dessus, comme au QCM. Le jeton en vol, absolu, reste après elle
 * dans le DOM : il ne prend pas de place.
 */
/** La teinte « écrire » : le violet d'option, face claire et flanc `#a855f7`. */
const ACCENT = tileChosenTone(GESTURE_ACCENT.ecrire.optionIndex);

export default function FillBlankExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<FillBlankView>>) {
  const text = typeof payload?.text === "string" ? payload.text : "";
  const blanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
  const parts = splitBlanks(text);
  const [chosen, setChosen] = useState<(string | null)[]>(() => blanks.map(() => null));
  const [active, setActive] = useState(0);
  // Le trou dont le mot est en vol : il ne le montre qu'à l'arrivée.
  const [landing, setLanding] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const holeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tileRefs = useRef<Record<string, HTMLElement | null>>({});

  const onLand = useCallback(() => setLanding(null), []);
  const { flight, fly, land } = useTokenFlight(rootRef, onLand);

  if (!text || blanks.length === 0 || parts.length !== blanks.length + 1) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const choose = (word: string) => {
    if (disabled) return;
    const next = [...chosen];
    next[active] = word;
    setChosen(next);
    setLanding(active);
    fly(word, tileRefs.current[word] ?? null, holeRefs.current[active] ?? null);
    // Le prochain trou encore vide, sinon on reste où l'on est.
    const following = next.findIndex((value, i) => value === null && i !== active);
    if (following !== -1) setActive(following);
  };

  const complete = chosen.every((value) => value !== null);
  const options = blanks[active]?.options ?? [];

  const frame =
    isCorrect === true
      ? "border-lime-300 bg-[linear-gradient(180deg,#f7fee7_0%,#dcfce7_100%)] shadow-[0_5px_0_#16a34a,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-pop_0.45s_ease-out]"
      : isCorrect === false
        ? "border-amber-300 bg-[linear-gradient(180deg,#fffbeb_0%,#ffedd5_100%)] shadow-[0_5px_0_#ea580c,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-shake-soft_0.45s_ease-in-out]"
        : "border-white bg-[#fff8e6] shadow-[0_5px_0_#d6c39a,0_14px_24px_-14px_rgba(60,30,0,0.5)]";

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div ref={rootRef} className="relative space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      {/* La phrase, posée sur sa carte. */}
      <div
        className={`gk-motion relative rounded-2xl border-2 px-4 py-3 font-display text-xl font-bold leading-[4.25rem] text-amber-950 ${frame}`}
      >
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <Hole
                ref={(el) => {
                  holeRefs.current[i] = el;
                }}
                index={i}
                word={chosen[i]}
                active={i === active && !disabled}
                hidden={landing === i}
                verdict={isCorrect}
                disabled={disabled}
                onPress={() => setActive(i)}
              />
            )}
          </span>
        ))}
        <Reward fire={isCorrect === true ? "juste" : null} />
      </div>

      {/* Les mots : des tuiles qu'on saisit. */}
      <div>
        <p className="mb-2 font-display text-sm font-bold text-amber-900/80">
          {blanks.length > 1 ? `Trou ${active + 1} : choisis le bon mot` : "Choisis le bon mot"}
        </p>
        <div className={`grid grid-cols-2 gap-3 ${options.length > 4 ? "sm:grid-cols-3" : ""}`}>
          {options.map((word) => {
            const picked = chosen[active] === word;
            const state: TileState =
              picked && isCorrect !== null ? (isCorrect ? "juste" : "fausse") : picked ? "choisie" : "repos";
            return (
              <Tile3D
                key={word}
                ref={(el) => {
                  tileRefs.current[word] = el;
                }}
                tone={GESTURE_ACCENT.ecrire.optionIndex}
                state={state}
                align="center"
                size="lg"
                disabled={disabled}
                onPress={() => choose(word)}
              >
                {word}
              </Tile3D>
            );
          })}
        </div>
      </div>

      <ExerciseActions>
        {/* La coche : le même « Valider » que le QCM, pour que le dock ne change pas de visage d'une question à l'autre. */}
        <ActionButton3D
          onClick={() => complete && onSubmit(JSON.stringify(chosen))}
          disabled={disabled || !complete}
          shine={!disabled && complete}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>

      {/* Le jeton en vol, par-dessus tout, dans la racine. */}
      {/* Le jeton n'a que son flanc, pas d'ombre floue : une ombre à flou de
          18 px peinte dans une couche fraîche au départ du vol coûtait au
          WKWebView la première moitié du trajet (filmé sur le simulateur). */}
      <FlyingToken flight={flight} onLand={land} className="border-2 border-white shadow-[0_3px_0_#a855f7]">
        {flight && (
          <span
            className="flex h-full w-full items-center justify-center rounded-xl"
            style={{
              backgroundImage: `linear-gradient(180deg, ${ACCENT.faceTop} 0%, ${ACCENT.faceBottom} 100%)`,
              color: ACCENT.text,
            }}
          >
            {flight.text}
          </span>
        )}
      </FlyingToken>
    </div>
  );
}

/**
 * Un trou de la phrase : une case en ligne, 56 px de haut. Vide : un
 * pointillé crème. Active : violette, cerclée, soulevée d'un cheveu pour
 * appeler le mot ; elle ne bouge pas en continu (une cible qui flotte n'est
 * jamais « stable » pour un doigt ni pour Playwright). Remplie : un jeton
 * posé, avec son flanc, qui gonfle quand le mot arrive. Le verdict la colore
 * en vert ou en ambre. Les ombres sont écrites en clair (`#a855f7` est le
 * flanc de `ACCENT`) : Tailwind ne génère pas une classe calculée.
 */
const Hole = forwardRef<
  HTMLButtonElement,
  {
    index: number;
    word: string | null;
    active: boolean;
    /** Le mot est en vol : la case le garde invisible jusqu'à l'arrivée. */
    hidden: boolean;
    verdict: boolean | null;
    disabled: boolean;
    onPress: () => void;
  }
>(function Hole({ index, word, active, hidden, verdict, disabled, onPress }, ref) {
  const filled = word !== null;
  let look: string;
  let style: CSSProperties | undefined;
  if (filled && verdict === true) {
    look = "border-white text-green-950 shadow-[0_3px_0_#16a34a,inset_0_2px_0_rgb(255_255_255_/_0.7)]";
    style = { backgroundImage: "linear-gradient(180deg, #d9f99d 0%, #bbf7d0 100%)" };
  } else if (filled && verdict === false) {
    look = "border-white text-orange-950 shadow-[0_3px_0_#ea580c,inset_0_2px_0_rgb(255_255_255_/_0.7)]";
    style = { backgroundImage: "linear-gradient(180deg, #fef3c7 0%, #fed7aa 100%)" };
  } else if (filled) {
    look = active
      ? "border-white shadow-[0_3px_0_#a855f7,inset_0_2px_0_rgb(255_255_255_/_0.7),0_0_0_4px_rgb(168_85_247_/_0.3)]"
      : "border-white shadow-[0_3px_0_#a855f7,inset_0_2px_0_rgb(255_255_255_/_0.7)]";
    style = {
      backgroundImage: `linear-gradient(180deg, ${ACCENT.faceTop} 0%, ${ACCENT.faceBottom} 100%)`,
      color: ACCENT.text,
    };
  } else if (active) {
    look = "border-dashed border-[#a855f7] bg-[#f3e8ff] text-[#7e22ce] shadow-[0_0_0_4px_rgb(168_85_247_/_0.3)]";
  } else {
    look = "border-dashed border-[#d6c39a] bg-[#fff1cc]/70 text-amber-900/50";
  }
  const lift = active ? "-translate-y-0.5" : "";

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => !disabled && onPress()}
      disabled={disabled}
      aria-label={word ? `Trou ${index + 1} : ${word}` : `Trou ${index + 1}, vide`}
      className={`gk-motion gk-spring relative mx-1 inline-flex min-h-14 min-w-[4.75rem] items-center justify-center rounded-xl border-2 px-3 align-middle font-display text-lg font-extrabold leading-none transition-transform duration-[220ms] ${look} ${lift} ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      style={style}
    >
      <span key={word ?? "vide"} className={`${filled ? "animate-[gk-pop_0.45s_ease-out]" : ""} ${hidden ? "invisible" : ""}`}>
        {word ?? "?"}
      </span>
    </button>
  );
});
