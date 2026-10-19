"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Play, Volume2 } from "lucide-react";
import { Reward, Tile3D, useGameFeel, type TileState } from "@/components/student/game-kit";
import { graphemeCount, qcmLayout } from "@/components/student/game-kit/choix-texte";
import { SandTable } from "@/components/student/game-kit/ecrans-decor";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { ListenClip, ListenView } from "@/convex/paliers/games/types";
import { canSynthesize, playClip, stopClip } from "@/lib/sounds/synth";

/** Le temps que met le synthétiseur avant la première note (`playClip` : 50 ms). */
const CLIP_LEAD_MS = 50;
/** Au plus tant de coups par son : au-delà, le tambour ne suivrait plus l'oreille. */
const MAX_BEATS = 32;

/**
 * Les instants où la peau du tambour doit battre : le début de chaque note
 * jouée (pas les silences), avec la durée pendant laquelle elle reste tendue.
 */
export function beatSchedule(clip: ListenClip): { at: number; hold: number }[] {
  const beats: { at: number; hold: number }[] = [];
  let t = 0;
  for (const note of clip.notes) {
    const d = Math.max(0, note.d);
    if (note.f > 0 && d > 0) beats.push({ at: t, hold: d });
    t += d;
  }
  return beats.slice(0, MAX_BEATS);
}

/**
 * L'ÉCOUTE — des tam-tams sur le sable.
 *
 * Chaque son est un tambour : une peau crème tendue sur un fût de bois lacé,
 * un disque sarcelle (l'accent « écouter ») au milieu pour le jouer. Quand il
 * joue, le tambour se soulève, et sa peau bat AU RYTHME du son : à chaque
 * note, elle gonfle (`gk-pop`) et une onde part de son bord (`gk-ring`) ; elle
 * reste tendue le temps de la note, pour qu'un son long se voie long. Les
 * coups sont calés sur la partition du son (`beatSchedule`), celle que le
 * synthétiseur joue (`lib/sounds/synth.ts`) : rien à télécharger, cela marche
 * sans réseau.
 *
 * Les réponses sont des tuiles épaisses (`Tile3D`), comme au QCM : deux
 * colonnes de grosses tuiles pour « Le son 1 / Le son 2 », une colonne à
 * pastille lettrée pour des phrases. Juste, la tuile passe au vert et la
 * récompense jaillit ; fausse, elle passe à l'ambre et dit non.
 *
 * Le contrat ne change pas : mêmes props, la réponse part en `String(index)`,
 * les tambours s'appellent toujours « Écouter : Son 1 ».
 *
 * DEUX « ÉCOUTER », BIEN DISTINCTS. Les tambours jouent le SON À RECONNAÎTRE
 * (« Écouter : Son 1 », disque sarcelle sur la peau) ; le gros bouton bleu de
 * la barre d'action (`SubmitButton` → `ExerciseActions`) relit L'ÉNONCÉ
 * (« Écouter l'énoncé »). Pour que l'enfant n'ait pas deux briques bleues
 * l'une sur l'autre, « Valider » garde ici l'orange de tous les écrans : le
 * bleu ciel de la barre est celui d'« Écouter ».
 */
export default function ListenExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<ListenView>>) {
  const clips = Array.isArray(payload?.clips) ? payload.clips : [];
  const options = Array.isArray(payload?.options)
    ? payload.options.filter((o): o is string => typeof o === "string")
    : [];
  const [playing, setPlaying] = useState<number | null>(null);
  const [heard, setHeard] = useState<Set<number>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  // Le coup en cours (quel tambour, quel coup) et la peau tendue.
  const [beat, setBeat] = useState<{ clip: number; n: number } | null>(null);
  const [holding, setHolding] = useState(false);
  // Vérifié au premier toucher, pas au rendu : le rendu serveur ne connaît
  // pas l'audio de l'appareil, et l'écran ne doit pas changer à l'hydratation.
  const [unsupported, setUnsupported] = useState(false);
  const feel = useGameFeel();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const run = useRef(0);

  const clearBeats = useCallback(() => {
    for (const id of timers.current) clearTimeout(id);
    timers.current = [];
  }, []);

  // Un son qui joue encore quand l'exercice change se tait, et son tambour aussi.
  useEffect(
    () => () => {
      clearBeats();
      stopClip();
    },
    [clearBeats],
  );

  if (clips.length === 0 || options.length < 2) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }
  if (unsupported) {
    return (
      <BrokenExercise
        prompt={prompt}
        onSkip={onSkip}
        disabled={disabled}
        message="Cet appareil ne sait pas jouer les sons de l'exercice : on le saute."
      />
    );
  }

  const listen = async (index: number) => {
    if (!canSynthesize()) {
      setUnsupported(true);
      return;
    }
    feel.vibrate("tap");
    const mine = ++run.current;
    clearBeats();
    setHolding(false);
    setPlaying(index);
    // Le tambour bat au rythme de ce qu'il joue : un coup par note, la peau
    // tendue le temps de la note (relâchée juste avant la suivante).
    for (const [n, { at, hold }] of beatSchedule(clips[index]).entries()) {
      timers.current.push(
        setTimeout(() => {
          setBeat({ clip: index, n });
          setHolding(true);
        }, CLIP_LEAD_MS + at),
      );
      timers.current.push(setTimeout(() => setHolding(false), CLIP_LEAD_MS + at + Math.max(60, hold - 40)));
    }
    await playClip(clips[index].notes);
    setHeard((prev) => new Set(prev).add(index));
    // Un autre son a pris la suite : c'est lui qui tient les minuteurs.
    if (run.current !== mine) return;
    clearBeats();
    setHolding(false);
    setBeat(null);
    setPlaying((current) => (current === index ? null : current));
  };

  const layout = qcmLayout(options);
  // « Le son 1 / Le son 2 » : trois mots, mais courts. Deux colonnes dès que
  // chaque réponse tient en dix graphèmes : une rangée de tuiles au lieu de
  // deux, et la barre d'action reste sur le premier écran d'un téléphone.
  const twoColumns = layout.columns === 2 || (options.length <= 4 && options.every((o) => graphemeCount(o.trim()) <= 10));
  const odd = twoColumns && options.length % 2 === 1;

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div className="gk-motion relative space-y-6 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} />

      {/* Les tambours, sur le sable. */}
      <SandTable className="px-3 pb-2 pt-4">
        <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3">
          {clips.map((clip, i) => (
            <Drum
              key={i}
              clip={clip}
              playing={playing === i}
              heard={heard.has(i)}
              beat={beat?.clip === i ? beat.n : null}
              holding={holding && playing === i}
              onPlay={() => void listen(i)}
            />
          ))}
        </div>
      </SandTable>
      {/* `amber-900/85` sur la crème : 5,7:1 (à 70 %, 4,07:1, sous les 4,5:1 d'un petit texte). */}
      <p className="text-center font-display text-sm font-bold text-amber-900/85">Monte le son, puis touche un tambour.</p>

      {/* Les réponses, et la récompense qui jaillit de leur milieu. */}
      <div className={`relative ${twoColumns ? "grid grid-cols-2 gap-3 sm:gap-4" : "space-y-3"}`} data-layout={twoColumns ? "deux-colonnes" : "une-colonne"}>
        {options.map((option, index) => {
          const isSelected = selected === index;
          const state: TileState =
            isCorrect !== null && isSelected ? (isCorrect ? "juste" : "fausse") : isSelected ? "choisie" : "repos";
          const letter = String.fromCharCode(65 + index);
          const tile = (
            <Tile3D
              key={index}
              tone={index}
              state={state}
              badge={twoColumns ? undefined : letter}
              size={layout.size}
              align={twoColumns ? "center" : "left"}
              disabled={disabled}
              onPress={() => setSelected(index)}
              data-option={index}
            >
              <span className="sr-only">{letter}</span>
              {option}
            </Tile3D>
          );
          // Une option seule sur la dernière ligne se centre, à la largeur des autres.
          if (odd && index === options.length - 1) {
            return (
              <div key={index} className="col-span-2 flex justify-center">
                <div className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)]">{tile}</div>
              </div>
            );
          }
          return tile;
        })}
        <Reward fire={isCorrect === true ? "juste" : null} />
      </div>

      <SubmitButton onClick={() => selected !== null && onSubmit(String(selected))} disabled={disabled || selected === null} />
    </div>
  );
}

/* ── Le tambour ──────────────────────────────────────────────────────────── */

/** Le fût : du bois en dégradé, et les lacets en travers. */
const DRUM_BODY =
  "repeating-linear-gradient(104deg, rgba(255,247,224,0) 0 9px, rgba(255,247,224,0.35) 9px 11px), linear-gradient(90deg, #d08a46 0%, #c98240 30%, #a5602c 62%, #7a4a23 100%)";

/**
 * Un tam-tam qu'on joue en le touchant. `beat` change à chaque coup : la peau
 * est remontée (sa clé change) pour rejouer son gonflement, et une onde part
 * de son bord. `holding` la garde tendue le temps de la note.
 */
function Drum({
  clip,
  playing,
  heard,
  beat,
  holding,
  onPlay,
}: {
  clip: ListenClip;
  playing: boolean;
  heard: boolean;
  beat: number | null;
  holding: boolean;
  onPlay: () => void;
}) {
  const striking = playing && beat !== null;
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Écouter : ${clip.label}`}
      data-playing={playing ? "1" : "0"}
      data-beat={striking ? beat : undefined}
      className="group relative flex min-w-[6.5rem] flex-col items-center gap-1.5 rounded-3xl px-2 pb-1 pt-2 gk-focus"
    >
      {/* 80 px de tambour (le bouton entier, étiquette comprise, dépasse les 56 px d'une cible). */}
      <span
        aria-hidden
        className={`gk-spring relative block h-20 w-20 transition-transform duration-[220ms] ${
          playing ? "-translate-y-1" : "group-active:translate-y-[2px]"
        }`}
      >
        {/* L'ombre sur le sable. */}
        <span className="absolute inset-x-2 bottom-0 h-4 translate-y-[3px] rounded-full opacity-40 shadow-[0_8px_14px_rgb(60_30_0_/_0.55)]" />
        {/* Le fût, et ses cerclages de corde. */}
        <span
          className="absolute inset-x-[5%] bottom-0 top-[24%] [clip-path:polygon(0_0,100%_0,80%_100%,20%_100%)]"
          style={{ backgroundImage: DRUM_BODY }}
        />
        <span className="absolute inset-x-[9%] top-[46%] h-1.5 rounded-full bg-[#7a4a23]/70" />
        <span className="absolute inset-x-[19%] bottom-[10%] h-1.5 rounded-full bg-[#7a4a23]/60" />
        {/* L'onde qui part de la peau à chaque coup. */}
        {striking && (
          <span
            key={beat}
            className="absolute inset-x-0 top-0 h-[54%] rounded-full border-4 border-[#14b8a6] animate-[gk-ring_0.6s_ease-out_forwards]"
          />
        )}
        {/* La peau : elle bat à chaque coup et reste tendue le temps de la note. */}
        <span
          key={striking ? `coup-${beat}` : "repos"}
          className={`absolute inset-x-0 top-0 flex h-[54%] items-center justify-center rounded-full border-4 border-[#d6c39a] bg-[radial-gradient(ellipse_at_40%_35%,#fff8e6_0%,#f6dfa4_70%,#e9a83a_100%)] shadow-[inset_0_-4px_0_rgb(60_30_0_/_0.15),0_2px_0_#b5773b] transition-transform duration-150 ease-out ${
            holding ? "scale-[1.06]" : ""
          } ${striking ? "animate-[gk-pop_0.3s_ease-out]" : ""}`}
        >
          {/* Le disque de lecture, sarcelle. */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[linear-gradient(180deg,#5eead4_0%,#14b8a6_100%)] text-white shadow-[0_3px_0_#0f766e]">
            {playing ? <Volume2 className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </span>
        </span>
        {/* Déjà écouté : une coche verte sur le coin. */}
        {heard && !playing && (
          <span className="absolute -right-1 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#22c55e] text-white shadow-[0_2px_0_rgb(0_0_0_/_0.18)]">
            <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
          </span>
        )}
      </span>
      <span className="font-display text-base font-extrabold text-amber-950">{clip.label}</span>
      {heard && <span className="sr-only">Écouté</span>}
    </button>
  );
}
