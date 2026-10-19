"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Pencil, X } from "lucide-react";
import { ActionButton3D, Reward } from "@/components/student/game-kit";
import { NumPad } from "@/components/student/game-kit/choix-pave-numerique";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { ExerciseActions } from "./game-parts";

interface ShortAnswerPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
  acceptedAnswers?: string[];
  tolerance?: string | null;
  /** Posé par le serveur (`paliers.sanitizePayload`) : le clavier à ouvrir. */
  inputMode?: "numeric" | "decimal" | "text";
}

interface ShortAnswerExerciseProps {
  prompt: string;
  payload: ShortAnswerPayload;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

/**
 * Le pavé de chiffres n'empile pas au-delà : aucun nombre attendu n'en
 * approche. Un mot ou une phrase tapés au clavier n'ont PAS de borne : les
 * réponses attendues vont jusqu'à « Organisation pour la mise en valeur du
 * fleuve Sénégal » (53 caractères ; dans la production, 68 exercices sur
 * 1 262 ont toutes leurs réponses au-delà de 24), et une réponse coupée
 * serait jugée fausse, en ligne comme sur l'appareil.
 */
const MAX_DIGITS = 24;

/**
 * Remonte le champ dans ce qui reste VISIBLE au-dessus du clavier et du dock.
 * `scrollIntoView({ block: "center" })` centrait dans la fenêtre entière : sur
 * iOS, le clavier recouvre la page sans la redimensionner (`visualViewport`),
 * et le dock de la séance (`game-kit/scene-dock.tsx`) monte au-dessus de lui ;
 * le champ se retrouvait derrière l'un ou l'autre (mesuré dans Chromium avec un
 * viewport visuel simulé, puis dans le WKWebView de l'iPhone 17). Ici, la bande
 * visible va du BAS DE L'EN-TÊTE COLLANT (`[data-session-hud]`, qui reste en
 * haut quand le document défile : Chrome Android en « resizes-visual », à
 * 320 × 568 le champ montait 23 px sous lui ; relu le 18 octobre 2026) ou du
 * haut du viewport visuel, jusqu'au haut du dock (son rectangle, ou, sans
 * dock, le bas du viewport visuel) ; le champ se pose au tiers de cette bande,
 * et seulement s'il n'y est pas déjà. Quand l'en-tête et le dock remonté ne
 * laissent rien entre eux (un téléphone en paysage, clavier levé), il n'y a
 * rien à faire ici. Sans `visualViewport` (jsdom), l'ancien `scrollIntoView`.
 *
 * LE HAUT DU VIEWPORT VISUEL, dans les coordonnées des rectangles, n'est pas
 * `offsetTop` partout. Dans Safari, les rectangles sont relatifs au viewport
 * de mise en page et le viewport visuel en est décalé d'`offsetTop`. Dans le
 * WKWebView de l'application, quand le clavier monte, WebKit fait défiler le
 * viewport visuel dans un viewport de mise en page immobile : `pageTop`,
 * `offsetTop` et `scrollY` valent la même chose, et les rectangles suivent
 * `scrollY` (mesuré le 18 octobre 2026 : le champ à 514 px au repos se lit à
 * 202 px avec `scrollY` = 312). `pageTop - scrollY` donne le bon décalage dans
 * les deux moteurs : `offsetTop` dans Safari, 0 dans le WKWebView.
 */
function revealField(field: HTMLInputElement) {
  if (!field.isConnected) return;
  const viewport = window.visualViewport;
  if (!viewport) {
    // `?.` : jsdom (les tests) n'a pas `scrollIntoView`.
    field.scrollIntoView?.({ block: "center", behavior: "smooth" });
    return;
  }
  const shift = viewport.pageTop - window.scrollY;
  const dock = document.querySelector("[data-scene-dock]:not([data-dock-empty])");
  const floor = dock ? dock.getBoundingClientRect().top : shift + viewport.height;
  // Le plafond : le bas de l'en-tête collant quand il est dans la bande visible.
  const hud = document.querySelector("[data-session-hud]");
  const hudBottom = hud ? hud.getBoundingClientRect().bottom - shift : 0;
  const ceiling = Math.max(0, Math.min(hudBottom, floor - shift));
  const band = Math.max(160, floor - shift - ceiling);
  const rect = field.getBoundingClientRect();
  const top = rect.top - shift - ceiling;
  if (top >= 8 && top + rect.height <= band - 8) return;
  // Au tiers de la bande ; dans une bande courte (320 × 568, clavier levé :
  // 87 px pour un champ de 68), centré dedans.
  const target = Math.min(band / 3, Math.max(0, (band - rect.height) / 2));
  window.scrollBy({ top: top - target, behavior: "smooth" });
}

/**
 * LA RÉPONSE COURTE — un vrai champ de jeu, pas une ligne de formulaire.
 *
 * Le champ est une ardoise crème creusée (ombre interne, flanc de 4 px), en
 * Fredoka 24 px, avec le crayon violet de la famille « écrire » et une croix
 * pour tout effacer. Juste, elle passe au vert et gonfle, la récompense
 * jaillit ; fausse, à l'ambre et elle dit non doucement.
 *
 * LE CLAVIER SUIT LA RÉPONSE ATTENDUE. Un nombre (`inputMode` numérique ou
 * décimal, posé par le serveur sans révéler la réponse) se tape sur un pavé
 * de grosses touches DANS la carte (`NumPad`) : le clavier du téléphone ne
 * monte pas (`inputMode="none"`, champ en lecture seule), rien ne cache le
 * champ ni le bouton Valider, et une touche physique (un ordinateur, un
 * clavier Bluetooth) écrit quand même par `onKeyDown`. Un mot ouvre le clavier
 * des lettres ; le champ se remonte au milieu de l'écran quand il prend le
 * focus, pour rester visible au-dessus du clavier.
 *
 * « Valider » est posé dans la barre d'action (`ExerciseActions`,
 * `game-parts.tsx`) : pour un enfant qui apprend à lire, « Écouter » vient
 * avec lui. Sous le pavé de chiffres, la barre tient sur UNE ligne (`row` :
 * le carré bleu, puis Valider) : le pavé fait déjà quatre rangées de grosses
 * touches, et une barre de deux rangées prenait trop du premier écran d'un
 * téléphone de 844 px (mesuré, `scripts/shoot-exercises.mjs`). En séance, la
 * barre est collée au bas de l'écran (le dock de la coque,
 * `game-kit/scene-dock.tsx`) : quand le clavier des lettres monte, le dock
 * monte au-dessus de lui (iOS) ou suit la fenêtre (Android), et le champ se
 * recentre dans ce qui reste visible.
 *
 * La vérification reste côté serveur ; la réponse part comme avant, en texte.
 */
export default function ShortAnswerExercise({
  prompt,
  payload,
  onSubmit,
  disabled,
  isCorrect,
}: ShortAnswerExerciseProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const mode = payload?.inputMode ?? "text";
  const numeric = mode === "numeric" || mode === "decimal";
  const placeholder = numeric ? "Tape le nombre ici..." : "Tape ta réponse ici...";

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
    }
  };

  const append = (key: string) => {
    if (disabled) return;
    setAnswer((current) => (current.length >= MAX_DIGITS ? current : current + key));
  };
  const backspace = () => {
    if (disabled) return;
    setAnswer((current) => current.slice(0, -1));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!disabled && answer.trim()) handleSubmit();
      return;
    }
    if (!numeric || e.metaKey || e.ctrlKey || e.altKey) return;
    // Le champ est en lecture seule : les touches physiques passent par ici.
    if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      append(e.key);
    } else if ((e.key === "," || e.key === ".") && mode === "decimal") {
      e.preventDefault();
      append(",");
    } else if (e.key === "-" && answer === "") {
      e.preventDefault();
      append("-");
    }
  };

  const frame =
    isCorrect === true
      ? "border-lime-300 text-green-950 shadow-[inset_0_3px_0_rgb(22_163_74_/_0.25),0_4px_0_#16a34a] animate-[gk-pop_0.45s_ease-out]"
      : isCorrect === false
        ? "border-amber-300 text-orange-950 shadow-[inset_0_3px_0_rgb(234_88_12_/_0.25),0_4px_0_#ea580c] animate-[gk-shake-soft_0.45s_ease-in-out]"
        : "border-white text-amber-950 shadow-[inset_0_3px_0_rgb(214_195_154_/_0.55),0_4px_0_#d6c39a] focus:border-[#a855f7] focus:shadow-[inset_0_3px_0_rgb(214_195_154_/_0.55),0_4px_0_#a855f7,0_0_0_4px_rgb(168_85_247_/_0.25)]";
  const surface =
    isCorrect === true
      ? "linear-gradient(180deg, #f7fee7 0%, #dcfce7 100%)"
      : isCorrect === false
        ? "linear-gradient(180deg, #fffbeb 0%, #ffedd5 100%)"
        : "linear-gradient(180deg, #fff8e6 0%, #fffdf5 100%)";

  return (
    // Les blocs se resserrent avec la hauteur de l'écran : le pavé de chiffres
    // fait déjà quatre rangées, et chaque marge compte sur un téléphone. Les
    // deux paliers s'excluent : Tailwind ne garantit pas l'ordre de deux
    // requêtes média arbitraires, et la plus large gagnait sur l'écran court.
    <div className="space-y-6 [@media(min-height:668px)_and_(max-height:900px)]:space-y-5 [@media(max-height:667px)]:space-y-4">
      <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />

      {/* L'ardoise : le champ, le crayon, la croix qui efface, la récompense. */}
      <div className="relative">
        <label htmlFor={id} className="sr-only">
          Ta réponse
        </label>
        <Pencil className="pointer-events-none absolute left-4 top-1/2 z-[1] h-7 w-7 -translate-y-1/2 text-[#a855f7]" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={numeric ? "none" : "text"}
          readOnly={numeric}
          pattern={mode === "numeric" ? "-?[0-9]*" : undefined}
          autoComplete="off"
          autoCorrect={numeric ? "off" : "on"}
          autoCapitalize={numeric ? "off" : "sentences"}
          enterKeyHint="done"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            // Le clavier monte en 250 à 400 ms : le champ se replace une fois
            // qu'il est là, et une seconde fois si le premier passage l'a manqué
            // (`revealField` ne bouge rien quand le champ est déjà visible).
            if (numeric) return;
            const field = e.currentTarget;
            setTimeout(() => revealField(field), 300);
            setTimeout(() => revealField(field), 700);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`gk-motion w-full rounded-2xl border-2 py-4 pl-14 pr-16 font-display text-2xl font-extrabold tracking-wide caret-[#a855f7] outline-none placeholder:text-base placeholder:font-bold placeholder:text-amber-900/40 sm:placeholder:text-xl ${frame} ${
            disabled ? "cursor-not-allowed" : ""
          }`}
          style={{ backgroundImage: surface }}
        />
        {/* La croix fait 56 px, la cible tactile du jeu ; l'ardoise (68 px) la
            loge, et `pr-16` du champ lui garde sa place. À l'appui, elle
            s'enfonce d'un pixel EN GARDANT son centrage : `-translate-y-1/2` et
            `active:translate-y-[1px]` écrivent la même variable de Tailwind v4,
            et l'appui faisait sauter la croix de 29 px sous le doigt, hors de
            l'ardoise ; à la souris, le bouton avait quitté le pointeur au
            relâchement et le clic se perdait (relu le 18 octobre 2026). */}
        {answer && !disabled && (
          <button
            type="button"
            onClick={() => {
              setAnswer("");
              if (!numeric) inputRef.current?.focus();
            }}
            aria-label="Tout effacer"
            className="absolute right-2 top-1/2 flex h-14 w-14 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#fff1cc] text-amber-900 shadow-[0_2px_0_#d6c39a] transition-[transform,translate] duration-[90ms] active:translate-y-[calc(-50%+1px)]"
          >
            <X className="h-7 w-7" strokeWidth={3} aria-hidden />
          </button>
        )}
        <Reward fire={isCorrect === true ? "juste" : null} />
      </div>

      {numeric && <NumPad onKey={append} onBackspace={backspace} decimal={mode === "decimal"} disabled={disabled} />}

      <ExerciseActions row={numeric}>
        <ActionButton3D
          onClick={handleSubmit}
          disabled={disabled || !answer.trim()}
          shine={!disabled && answer.trim().length > 0}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>
    </div>
  );
}
