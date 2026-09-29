"use client";

/**
 * LES JEUX DU MODULE — pour un enfant qui ne sait pas encore lire.
 *
 * AUCUN NE DEMANDE DE LIRE DU FRANÇAIS. Les anciens QCM proposaient des noms
 * de lettres écrits (« bâ », « tâ ») : un enfant de cinq ans ne peut pas y
 * répondre. Ici, on écoute (la consigne est dite, `coach.tsx`), on regarde, et
 * on touche de gros objets :
 *
 *   - `MeetLetter` — la lettre et son image (أ comme أَسَد 🦁). On touche la
 *     lettre, elle dit son nom ; on touche l'image, elle dit le mot. Ses deux
 *     tuiles (`LetterTile`, `WordTile`) servent aussi à l'album ;
 *   - `BalloonPick` — Pio dit un son, l'enfant éclate le bon ballon. Sert aux
 *     lettres (`recognizeGlyph`) et aux syllabes (`pickSyllable`) ;
 *   - `MatchPictures` — relier chaque lettre de la leçon à son image
 *     (`recognizeName` : voir la lettre, savoir ce qu'elle dit) ;
 *   - `DotsGame` — compter les points, dessinés, pas écrits en chiffres.
 *
 * ON FINIT TOUJOURS PAR RÉUSSIR. Un ballon faux se dégonfle et reste hors
 * jeu ; il ne reste bientôt que le bon. La NOTE, elle, est prise au premier
 * geste (`onFirstAnswer`) : l'enfant n'est jamais bloqué, et l'école voit
 * quand même ce qu'il savait du premier coup.
 *
 * LES LEURRES NE SONT PAS TIRÉS AU HASARD (`lib/arabic/session.ts`) : ce sont
 * des lettres qui se ressemblent et que l'enfant a déjà vues.
 */

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import { getLetter, shuffle, type ArabicLetterKey } from "@/convex/arabic/alphabet";
import { LETTER_WORDS } from "@/convex/arabic/letterWords";
import { bravo } from "@/convex/arabic/consignes";
import { getSoundEnabledLocal, playCorrect } from "@/lib/sounds";
import { ArabicGlyph } from "./arabic-glyph";
import { speech, useSpeech } from "./speech";

/** Le temps de la petite fête avant l'étape suivante. */
export const CELEBRATE_MS = 1400;

/** La fête (son + « MashaAllah ! ») ou l'encouragement (« Essaie encore »). */
function useCheer() {
  const { say } = useSpeech();
  return {
    good(round: number) {
      if (getSoundEnabledLocal()) void playCorrect();
      void say([speech.consigne(bravo(round))]);
    },
    bad() {
      void say([speech.consigne("try_again")]);
    },
  };
}

/** Une gerbe d'étoiles qui jaillit d'un point : la récompense visible. */
export function Burst({ show }: { show: boolean }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <AnimatePresence>
      {show && (
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {rays.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <motion.span
                key={angle}
                className="absolute text-2xl"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: Math.cos(rad) * 90, y: Math.sin(rad) * 90, opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {i % 2 === 0 ? "⭐" : "✨"}
              </motion.span>
            );
          })}
        </span>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Rencontrer une lettre
// ---------------------------------------------------------------------------

export function MeetLetter({ letterKey }: { letterKey: ArabicLetterKey }) {
  const { say } = useSpeech();
  return (
    <div className="grid grid-cols-2 gap-4">
      <LetterTile letterKey={letterKey} appear onPress={() => void say([speech.letter(letterKey)])} />
      <WordTile letterKey={letterKey} appear onPress={() => void say([speech.word(letterKey)])} />
    </div>
  );
}

/**
 * La lettre en grand, son nom dessous. Toucher la tuile la fait entendre.
 *
 * La lettre passe par `ArabicGlyph` : elle est centrée sur son encre et tient
 * dans le haut de la tuile, de sorte qu'aucune boucle (ج, ع…) ne recouvre son
 * nom. Sert à la rencontre d'une lettre et à la fiche de l'album.
 */
export function LetterTile({
  letterKey,
  onPress,
  appear = false,
}: {
  letterKey: ArabicLetterKey;
  onPress: () => void;
  /** L'entrée en rebond, pour la première rencontre. */
  appear?: boolean;
}) {
  const letter = getLetter(letterKey);
  if (!letter) return null;
  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-label={`La lettre ${letter.nameFr}, touche pour l'entendre`}
      initial={appear ? { scale: 0.5, rotate: -8, opacity: 0 } : false}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 14 }}
      whileTap={{ scale: 0.94 }}
      className="btn-chunky flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[2rem] border-4 border-white bg-gradient-to-b from-teal-400 to-teal-600 p-3 text-white shadow-xl"
      style={{ "--btn-depth": "#115e59" } as React.CSSProperties}
    >
      <ArabicGlyph text={letter.isolated} className="min-h-0 w-full flex-1 drop-shadow" />
      <span className="flex shrink-0 items-center gap-1.5 font-display text-lg font-extrabold leading-tight">
        <Volume2 className="h-5 w-5" aria-hidden />
        {letter.nameFr}
      </span>
    </motion.button>
  );
}

/**
 * Le mot-image : l'image, le mot en arabe, sa traduction. Toucher la tuile
 * fait entendre le mot.
 *
 * L'arabe est écrit GRAND et séparé du français par un vrai blanc : c'est lui
 * que l'enfant doit regarder, le français est là pour l'adulte. Un mot long
 * (صُنْدُوق) rétrécit pour tenir dans la largeur au lieu de déborder.
 */
export function WordTile({
  letterKey,
  onPress,
  appear = false,
}: {
  letterKey: ArabicLetterKey;
  onPress: () => void;
  appear?: boolean;
}) {
  const word = LETTER_WORDS[letterKey];
  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-label={`${word.fr}, touche pour entendre le mot`}
      initial={appear ? { scale: 0.5, rotate: 8, opacity: 0 } : false}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 14, delay: appear ? 0.15 : 0 }}
      whileTap={{ scale: 0.94 }}
      className="btn-chunky flex aspect-square w-full flex-col items-center justify-center rounded-[2rem] border-4 border-white bg-gradient-to-b from-amber-100 to-amber-300 p-2.5 shadow-xl"
      style={{ "--btn-depth": "#b45309" } as React.CSSProperties}
    >
      <motion.span
        className="text-[3.25rem] leading-none"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {word.emoji}
      </motion.span>
      <ArabicGlyph
        text={word.ar}
        aspect={2.4}
        fill={0.92}
        cap={0.8}
        className="mt-1 aspect-[2.4/1] w-full shrink-0 text-amber-950"
      />
      <span className="mt-1.5 text-base font-bold leading-tight text-amber-900/85">{word.fr}</span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Éclater le bon ballon
// ---------------------------------------------------------------------------

const BALLOON_COLORS = [
  "from-rose-400 to-rose-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-orange-500",
];

export function BalloonPick({
  options,
  target,
  renderLabel,
  ariaLabel,
  onFirstAnswer,
  onSolved,
  round = 0,
}: {
  options: string[];
  target: string;
  renderLabel: (key: string) => ReactNode;
  ariaLabel: (key: string) => string;
  onFirstAnswer: (correct: boolean) => void;
  onSolved: () => void;
  round?: number;
}) {
  const cheer = useCheer();
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [popped, setPopped] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);

  function tap(key: string) {
    if (popped || missed.has(key)) return;
    if (!answered) {
      setAnswered(true);
      onFirstAnswer(key === target);
    }
    if (key === target) {
      setPopped(true);
      cheer.good(round);
      window.setTimeout(onSolved, CELEBRATE_MS);
      return;
    }
    setMissed((previous) => new Set(previous).add(key));
    setShaking(key);
    window.setTimeout(() => setShaking(null), 450);
    cheer.bad();
  }

  return (
    <div className="flex items-end justify-center gap-4 pt-4 sm:gap-6">
      {options.map((key, i) => {
        const isTarget = key === target;
        const isMissed = missed.has(key);
        const isPopped = popped && isTarget;
        return (
          <div key={key} className="relative flex flex-col items-center">
            <motion.button
              type="button"
              onClick={() => tap(key)}
              aria-label={ariaLabel(key)}
              disabled={isMissed}
              animate={
                isPopped
                  ? { scale: [1, 1.35, 0], opacity: [1, 1, 0] }
                  : isMissed
                    ? { scale: 0.78, opacity: 0.35, y: 12 }
                    : { y: [0, -10, 0] }
              }
              transition={
                isPopped
                  ? { duration: 0.55 }
                  : isMissed
                    ? { duration: 0.3 }
                    : { duration: 2.4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }
              }
              whileTap={{ scale: 0.92 }}
              className={`relative flex h-32 w-28 items-center justify-center rounded-[50%_50%_46%_46%/55%_55%_45%_45%] border-[3px] border-white/70 bg-gradient-to-b text-white shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                BALLOON_COLORS[i % BALLOON_COLORS.length]
              } ${isMissed ? "grayscale" : ""} ${shaking === key ? "animate-[head-shake_0.45s_ease-in-out]" : ""}`}
            >
              {/* Le reflet du ballon */}
              <span aria-hidden className="absolute left-5 top-4 h-6 w-3 rotate-[25deg] rounded-full bg-white/45" />
              <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">{renderLabel(key)}</span>
            </motion.button>
            {/* La ficelle */}
            <span aria-hidden className={`h-10 w-0.5 bg-gray-400/70 ${isPopped ? "opacity-0" : ""}`} />
            <Burst show={isPopped} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relier chaque lettre à son image
// ---------------------------------------------------------------------------

export function MatchPictures({
  letters,
  seed,
  onPairAnswer,
  onSolved,
}: {
  letters: ArabicLetterKey[];
  seed: number;
  onPairAnswer: (letterKey: ArabicLetterKey, correct: boolean) => void;
  onSolved: () => void;
}) {
  const { say } = useSpeech();
  const cheer = useCheer();
  const pictures = useMemo(() => shuffle(letters, seed), [letters, seed]);
  const [selected, setSelected] = useState<ArabicLetterKey | null>(null);
  const [matched, setMatched] = useState<Set<ArabicLetterKey>>(new Set());
  const [tried, setTried] = useState<Set<ArabicLetterKey>>(new Set());
  const [shaking, setShaking] = useState<ArabicLetterKey | null>(null);

  function pickLetter(key: ArabicLetterKey) {
    if (matched.has(key)) return;
    setSelected(key);
    void say([speech.letter(key)]);
  }

  function pickPicture(key: ArabicLetterKey) {
    if (matched.has(key)) return;
    if (!selected) {
      // Pas encore de lettre choisie : l'image dit son mot, c'est un indice.
      void say([speech.word(key)]);
      return;
    }
    const correct = key === selected;
    if (!tried.has(selected)) {
      setTried((previous) => new Set(previous).add(selected));
      onPairAnswer(selected, correct);
    }
    if (correct) {
      const next = new Set(matched).add(key);
      setMatched(next);
      setSelected(null);
      cheer.good(next.size);
      if (next.size === letters.length) window.setTimeout(onSolved, CELEBRATE_MS);
      return;
    }
    setShaking(key);
    window.setTimeout(() => setShaking(null), 450);
    cheer.bad();
  }

  const tile =
    "btn-chunky relative flex h-24 w-full items-center justify-center rounded-3xl border-4 border-white shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300";

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
      {/* Les images à gauche, les lettres à droite : on lit l'arabe depuis la droite. */}
      <div className="flex flex-col gap-3">
        {pictures.map((key) => {
          const done = matched.has(key);
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => pickPicture(key)}
              aria-label={LETTER_WORDS[key].fr}
              whileTap={{ scale: 0.95 }}
              className={`${tile} ${
                done ? "bg-green-100" : "bg-gradient-to-b from-amber-50 to-amber-200"
              } ${shaking === key ? "animate-[head-shake_0.45s_ease-in-out]" : ""}`}
              style={{ "--btn-depth": done ? "#15803d" : "#b45309" } as React.CSSProperties}
            >
              <span className={`text-5xl ${done ? "opacity-60" : ""}`}>{LETTER_WORDS[key].emoji}</span>
              {done && <Check className="absolute right-2 top-2 h-6 w-6 text-green-600" strokeWidth={3.5} aria-hidden />}
            </motion.button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        {letters.map((key) => {
          const letter = getLetter(key);
          const done = matched.has(key);
          const isSelected = selected === key;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => pickLetter(key)}
              aria-label={`La lettre ${letter?.nameFr ?? key}`}
              aria-pressed={isSelected}
              animate={isSelected ? { scale: 1.06 } : { scale: 1 }}
              whileTap={{ scale: 0.95 }}
              className={`${tile} ${
                done
                  ? "bg-green-100 text-green-700"
                  : isSelected
                    ? "bg-gradient-to-b from-sky-300 to-sky-500 text-white ring-4 ring-sky-300"
                    : "bg-gradient-to-b from-teal-400 to-teal-600 text-white"
              }`}
              style={{ "--btn-depth": done ? "#15803d" : isSelected ? "#0369a1" : "#115e59" } as React.CSSProperties}
            >
              <ArabicGlyph text={letter?.isolated ?? ""} className="h-20 w-20" />
              {done && <Check className="absolute left-2 top-2 h-6 w-6 text-green-600" strokeWidth={3.5} aria-hidden />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compter les points
// ---------------------------------------------------------------------------

/** N points dessinés comme sur la lettre ; zéro = un rond vide pointillé. */
function DotCluster({ count }: { count: number }) {
  if (count === 0) {
    return <span aria-hidden className="block h-10 w-10 rounded-full border-4 border-dashed border-gray-400" />;
  }
  const dot = <span className="block h-5 w-5 rounded-full bg-gray-900" />;
  return (
    <span aria-hidden className="flex flex-col items-center gap-1">
      {count === 3 && <span className="flex">{dot}</span>}
      <span className="flex gap-1.5">
        {dot}
        {count >= 2 && dot}
      </span>
    </span>
  );
}

export function DotsGame({
  letterKey,
  options,
  onFirstAnswer,
  onSolved,
  round = 0,
}: {
  letterKey: ArabicLetterKey;
  options: number[];
  onFirstAnswer: (correct: boolean) => void;
  onSolved: () => void;
  round?: number;
}) {
  const cheer = useCheer();
  const letter = getLetter(letterKey);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const [shaking, setShaking] = useState<number | null>(null);
  if (!letter) return null;
  const correct = letter.dots.count;

  function tap(count: number) {
    if (solved || missed.has(count)) return;
    if (!answered) {
      setAnswered(true);
      onFirstAnswer(count === correct);
    }
    if (count === correct) {
      setSolved(true);
      cheer.good(round);
      window.setTimeout(onSolved, CELEBRATE_MS);
      return;
    }
    setMissed((previous) => new Set(previous).add(count));
    setShaking(count);
    window.setTimeout(() => setShaking(null), 450);
    cheer.bad();
  }

  return (
    <div className="space-y-5">
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-[2rem] border-4 border-white bg-gradient-to-b from-teal-50 to-teal-100 shadow-lg">
        <ArabicGlyph text={letter.isolated} fill={0.8} className="h-full w-full text-teal-900" />
        <Burst show={solved} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {options.map((count) => {
          const isMissed = missed.has(count);
          const isRight = solved && count === correct;
          return (
            <motion.button
              key={count}
              type="button"
              onClick={() => tap(count)}
              disabled={isMissed}
              aria-label={count === 0 ? "Aucun point" : `${count} point${count > 1 ? "s" : ""}`}
              whileTap={{ scale: 0.92 }}
              className={`btn-chunky flex h-24 items-center justify-center rounded-3xl border-4 border-white shadow-lg ${
                isRight ? "bg-green-200" : isMissed ? "bg-gray-100 opacity-40" : "bg-white"
              } ${shaking === count ? "animate-[head-shake_0.45s_ease-in-out]" : ""}`}
              style={{ "--btn-depth": isRight ? "#15803d" : "#9ca3af" } as React.CSSProperties}
            >
              <DotCluster count={count} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
