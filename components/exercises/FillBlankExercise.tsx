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
import { typesetTile } from "@/components/student/game-kit/tile-typeset";
import type { ItemImage } from "@/lib/item-images";
import { splitTile } from "@/lib/item-pictures";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { BrokenExercise, ExerciseActions, type ExerciseScreenProps } from "./game-parts";
import { ItemPicture, useTileGroupPictures } from "./item-pictures";
import { SENTENCE_INDEX, useTileVoice } from "./prompt-reader";
import { isDenseTileCount, TilePicture, tileName } from "./tile-picture";
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
 * EN CI, UNE OPTION QUI NOMME UNE CHOSE MONTRE SON IMAGE (`item-pictures.tsx`,
 * règle permanente du dépôt) : « le balai », « les ciseaux », « l'arrosoir » ne se
 * lisent pas à six ans. Les options de CHAQUE trou se résolvent à part
 * (`useTileGroupPictures`), comme un QCM (`choice` : un trou n'a qu'une bonne
 * option, ses images sont toutes ou aucune), avec l'énoncé, l'image d'énoncé et la
 * phrase (`sentence` : un émoji de la chose dans la phrase la trahirait). L'écran
 * retire ainsi lui-même les images quand elles donneraient la réponse. La tuile
 * pose la pastille au-dessus du mot (`TilePicture`, comme l'association), et le
 * trou rempli la garde, petite, devant le mot. Sans `ItemPicturesProvider` (les
 * autres classes, la galerie), rien ne change. Le mot envoyé reste le texte
 * d'origine.
 *
 * LES TEXTES AFFICHÉS SONT COMPOSÉS (`typesetTile`) : la phrase, les mots des
 * tuiles, du trou et du jeton en vol. L'espace avant « ? ! : ; » est insécable, et
 * le signe qui suit un trou reste collé à lui (`GLUED_AFTER_HOLE`) : « Awa, ___
 * vite à la maison ! » ne laisse plus un « ! » seul en tête de ligne.
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
  // La voix des tuiles (CI) : Pio dit la phrase (le trou est une pause), puis les mots
  // du trou actif, la tuile qui parle s'allume ; toucher un mot le dit, toucher la
  // phrase la redit. Avant le retour anticipé : l'ordre des hooks.
  const wordsToHear = blanks[active]?.options ?? [];
  const tileVoice = useTileVoice(wordsToHear, prompt, { sentence: text || null, autoRead: true });
  // Les images des options (CI), trou par trou ; avant le retour anticipé, comme la voix.
  const pictures = useTileGroupPictures(
    blanks.map((blank) => (Array.isArray(blank?.options) ? blank.options.filter((o): o is string => typeof o === "string") : [])),
    { prompt, choice: true, exerciseImage: payloadImage(payload), sentence: text },
  );

  if (!text || blanks.length === 0 || parts.length !== blanks.length + 1) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const choose = (word: string) => {
    if (disabled) return;
    // Choisir un mot, c'est l'entendre.
    tileVoice?.hear(wordsToHear.indexOf(word));
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
  /** L'image d'un mot parmi les options d'un trou, ou `null`. */
  const pictureOf = (blank: number, word: string | null): ItemImage | null => {
    if (word === null) return null;
    const index = (blanks[blank]?.options ?? []).indexOf(word);
    return index === -1 ? null : (pictures[blank]?.[index] ?? null);
  };

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

      {/* La phrase, posée sur sa carte. Un toucher sur la carte (hors des trous, qui ont
          leur geste) la redit à voix haute ; un contour ciel l'entoure pendant qu'elle parle. */}
      <div
        className={`gk-motion relative rounded-2xl border-2 px-4 py-3 font-display text-xl font-bold leading-[4.25rem] text-amber-950 ${frame} ${
          tileVoice?.speaking === SENTENCE_INDEX ? "outline outline-4 outline-offset-2 outline-sky-500" : ""
        }`}
        data-sentence-speaking={tileVoice?.speaking === SENTENCE_INDEX || undefined}
        onClick={(event) => {
          if (disabled || (event.target as HTMLElement).closest("button")) return;
          tileVoice?.hear(SENTENCE_INDEX);
        }}
      >
        {parts.map((part, i) => {
          // Le signe qui suit un trou (« ___ ! ») part avec lui : il ne commence jamais une ligne.
          const lead = i > 0 ? (GLUED_AFTER_HOLE.exec(part)?.[0] ?? "") : "";
          const glue = i < blanks.length ? (GLUED_AFTER_HOLE.exec(parts[i + 1] ?? "")?.[0] ?? "") : "";
          const hole =
            i < blanks.length ? (
              <Hole
                ref={(el) => {
                  holeRefs.current[i] = el;
                }}
                index={i}
                word={chosen[i]}
                image={pictureOf(i, chosen[i])}
                active={i === active && !disabled}
                hidden={landing === i}
                verdict={isCorrect}
                disabled={disabled}
                onPress={() => setActive(i)}
              />
            ) : null;
          return (
            <span key={i}>
              {typesetTile(part.slice(lead.length))}
              {hole && glue ? (
                <span className="whitespace-nowrap">
                  {hole}
                  {typesetTile(glue)}
                </span>
              ) : (
                hole
              )}
            </span>
          );
        })}
        <Reward fire={isCorrect === true ? "juste" : null} />
      </div>

      {/* Les mots : des tuiles qu'on saisit. */}
      <div>
        <p className="mb-2 font-display text-sm font-bold text-amber-900/80">
          {blanks.length > 1 ? `Trou ${active + 1} : choisis le bon mot` : "Choisis le bon mot"}
        </p>
        <div className={`grid grid-cols-2 gap-3 ${options.length > 4 ? "sm:grid-cols-3" : ""}`}>
          {options.map((word, wordIndex) => {
            const picked = chosen[active] === word;
            const image = pictures[active]?.[wordIndex] ?? null;
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
                speaking={tileVoice?.speaking === wordIndex}
              >
                {image ? <TilePicture text={word} image={image} dense={isDenseTileCount(options.length)} /> : typesetTile(word)}
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
            {typesetTile(flight.text)}
          </span>
        )}
      </FlyingToken>
    </div>
  );
}

/**
 * Le début du morceau de phrase qui suit un trou, quand c'est un signe qui ne doit
 * pas commencer une ligne : l'espace éventuelle, puis « . , ; : ! ? … » ou un
 * guillemet ou une parenthèse fermante. Il est rendu collé au trou, dans un même
 * `nowrap`, et retiré du morceau suivant.
 */
const GLUED_AFTER_HOLE = /^\s?[.,;:!?…»)\]]+/u;

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
    /** L'image du mot posé (CI), ou `null` : une petite pastille devant le mot. */
    image: ItemImage | null;
    active: boolean;
    /** Le mot est en vol : la case le garde invisible jusqu'à l'arrivée. */
    hidden: boolean;
    verdict: boolean | null;
    disabled: boolean;
    onPress: () => void;
  }
>(function Hole({ index, word, image, active, hidden, verdict, disabled, onPress }, ref) {
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
      <span
        key={word ?? "vide"}
        className={`${filled ? "animate-[gk-pop_0.45s_ease-out]" : ""} ${hidden ? "invisible" : ""} ${
          image ? "inline-flex items-center gap-1.5" : ""
        }`}
      >
        {/* La pastille (32 px) tient dans la case de 56 px, devant le mot. */}
        {word !== null && image && <ItemPicture image={image} emoji={splitTile(word).emoji} size="xs" className="-my-1 size-8" />}
        {word === null ? "?" : typesetTile(tileName(word, image))}
      </span>
    </button>
  );
});
