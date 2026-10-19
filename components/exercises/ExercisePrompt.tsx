"use client";

import { Quote } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import {
  DENSE_PROMPT_GRAPHEMES,
  emojiRowSizeClass,
  graphemeCount,
  segmentPrompt,
} from "@/components/student/game-kit/choix-texte";
import { ExerciseImage } from "./ExerciseImage";
import { usePromptReader } from "./prompt-reader";

/**
 * L'ÉNONCÉ D'UN EXERCICE, EN SCÈNE : la consigne dans la voix de Pio
 * (Fredoka extra-grasse, `amber-950`), sur TOUTE LA LARGEUR de la carte, la
 * rangée d'émojis posée sur un socle de sable, l'image d'énoncé sur son
 * présentoir.
 *
 * LE HAUT-PARLEUR N'EST PLUS ICI. Le propriétaire l'a demandé : toute la
 * partie réservée à l'énoncé sert à l'énoncé, le bouton « Écouter » est posé
 * juste au-dessus de « Valider » (`ExerciseActions`, `game-parts.tsx`), et Pio
 * lui-même se touche pour relire (`session-stage.tsx`). La consigne en profite
 * pour grandir : jusqu'à 26 px sur un téléphone large (`clamp`), 20 px sur le
 * plus étroit, et 20 px quand elle est longue (plus de 60 graphèmes), pour
 * qu'un énoncé de quatre lignes ne pousse pas les tuiles sous le premier écran.
 * SUR UN ÉCRAN COURT (667 px ou moins : iPhone SE, 360 × 640, un téléphone
 * couché), la consigne longue passe à 18 px et les socles d'émojis perdent la
 * moitié de leur marge verticale ; debout, ils perdent aussi un cran (couché,
 * ils ont déjà leurs 24 px) : c'est le budget du premier écran, où les quatre
 * tuiles d'un QCM doivent rester au-dessus du dock (`session-stage.tsx`,
 * `--stage-pio`). Les émojis y restent gros (30 px pour une rangée de CI).
 *
 * Quand la consigne contient une phrase citée (« Trouve le temps du verbe :
 * "Aujourd'hui, nous jouons." »), elle se coupe au premier « : » ou « — » et
 * la phrase passe dans une carte crème sous l'instruction.
 *
 * ON NE PERD JAMAIS UN MOT. Une citation ne devient une carte que si elle est
 * la SEULE et que la consigne FINIT par elle (à la ponctuation près). « Dans
 * « Le thé est chaud. », quelle est la fonction de « chaud » ? » a deux
 * citations et une question après la première : elle s'affiche entière, telle
 * quelle. L'apostrophe droite n'est pas un guillemet (« l'école » n'en ouvre
 * pas un). Les émojis sont mis en valeur SANS être déplacés : le texte rendu,
 * bout à bout, reste la consigne caractère pour caractère.
 *
 * LES LIGNES SE COUPENT OÙ UN ENFANT PEUT SUIVRE DU DOIGT. La ponctuation qui
 * suit un socle d'émojis reste collée à lui (un « . » partait seul en tête de
 * ligne : « mangues [socle] ⏎ . On lui en donne »), et un mot à trait d'union
 * ne se coupe pas au trait (« Combien en a- ⏎ t-elle », de 360 à 820 px de
 * large, relu le 18 octobre 2026) : `Words` le met en `white-space: nowrap`.
 * Le trait d'union-minus est une coupure permise par les navigateurs, et
 * aucune propriété CSS ne l'interdit seule ; un trait insécable changerait le
 * texte. Les mots sans trait restent des nœuds de texte nus.
 *
 * Dans un `PromptReaderProvider` (CI, CP), Pio lit la consigne ; un halo ciel
 * s'allume derrière le texte pendant qu'il parle (une couche dont seule
 * l'opacité change). Ailleurs (plus grands, aperçus des professeurs), la
 * consigne se rend telle quelle.
 */
export default function ExercisePrompt({ prompt, image }: { prompt: string; image?: string }) {
  const reader = usePromptReader();
  const text = <PromptText prompt={prompt} />;
  // L'image d'énoncé (`payload.image`) passe AU-DESSUS de la consigne ; sans
  // image, rien ne change dans le DOM.
  if (image) {
    return (
      <div className="space-y-4">
        <ExerciseImage id={image} />
        <ExercisePrompt prompt={prompt} />
      </div>
    );
  }
  if (!reader) return text;

  const playing = reader.status === "playing";
  return (
    <div className="relative" data-prompt-reading={playing ? "1" : "0"}>
      {/* Le halo de lecture : peint une fois, seule son opacité bouge. */}
      <span
        aria-hidden
        className={`gk-motion pointer-events-none absolute -inset-x-3 -inset-y-2 rounded-2xl bg-sky-100 transition-opacity duration-300 ${
          playing ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative">{text}</div>
    </div>
  );
}

/**
 * La taille de la consigne : fluide avec la largeur de l'écran pour une
 * consigne courte (20 px à 360 px de large, 26 px au plus), 20 px pour une
 * consigne longue (18 px sur un écran court).
 */
export function promptSizeClass(prompt: string): string {
  // Des classes ÉCRITES EN ENTIER : Tailwind ne voit pas une classe composée
  // d'un préfixe et d'un suffixe dans deux chaînes. L'écran court (667 px ou
  // moins) comprend ici le téléphone couché.
  return graphemeCount(prompt) > DENSE_PROMPT_GRAPHEMES ? "text-xl [@media(max-height:667px)]:text-lg" : "text-[clamp(1.25rem,5.6vw,1.625rem)]";
}

function PromptText({ prompt }: { prompt: string }) {
  const { instruction, quoted } = parsePrompt(prompt);
  const size = promptSizeClass(prompt);

  // `text-wrap: pretty` : pas de « ? » seul sur la dernière ligne, là où le
  // navigateur le sait faire ; ailleurs, rien ne change.
  if (!quoted) {
    return (
      <p className={`whitespace-pre-line font-display ${size} font-extrabold leading-snug text-amber-950 [text-wrap:pretty]`}>
        <RichText text={prompt} />
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className={`whitespace-pre-line font-display ${size} font-extrabold leading-snug text-amber-950 [text-wrap:pretty]`}>
        <RichText text={instruction} />
      </p>
      {/* La phrase à lire : une carte crème posée. COURTE (moins de 20
          graphèmes : des syllabes à lire au CP, « mi - te - mar »), c'est ce
          que l'enfant doit lire : Fredoka extra-grasse, droite, 24 px. Longue
          (une phrase à analyser), Poppins `font-medium`, droite aussi :
          l'italique fin n'est pas dans la DA (relu le 18 octobre 2026). */}
      <div className="flex items-start gap-3 rounded-2xl border-2 border-white bg-[#fff8e6] px-4 py-3 shadow-[0_4px_0_#d6c39a,0_10px_16px_-12px_rgba(60,30,0,0.45)]">
        <Quote className="mt-1 h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden />
        <p
          data-prompt-quote={graphemeCount(quoted) < SHORT_QUOTE_GRAPHEMES ? "courte" : "longue"}
          className={
            graphemeCount(quoted) < SHORT_QUOTE_GRAPHEMES
              ? "font-display text-2xl font-extrabold leading-snug tracking-wide text-amber-950"
              : "text-lg font-medium leading-relaxed text-amber-950"
          }
        >
          <RichText text={quoted} />
        </p>
      </div>
    </div>
  );
}

/** Une citation plus courte que cela est à LIRE (des syllabes), pas à analyser. */
const SHORT_QUOTE_GRAPHEMES = 20;

/** La ponctuation qui suit un socle, avec l'espace qui la précède en typographie française (« ? »). */
const GLUED_PUNCTUATION = /^(\s?)([.,;:!?…»)\]]+)/u;

/** Un mot à trait d'union : des lettres ou des chiffres de part et d'autre d'au moins un trait. */
const HYPHENATED = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;

/**
 * Le texte avec ses émojis mis en scène : une rangée d'au moins deux émojis
 * est posée sur un socle de sable (un `inline-block`, dans le fil de la
 * phrase), un émoji seul grandit un peu. Les segments mis bout à bout sont le
 * texte d'origine.
 *
 * LE TEXTE RESTE DES NŒUDS DE TEXTE DIRECTS du paragraphe : `getByText(consigne)`
 * (les tests de la vitrine, de la séance) ne lit que les nœuds de texte propres
 * d'un élément. Une consigne sans émoji ni mot à trait d'union est un seul
 * nœud ; seuls les émojis, la ponctuation collée à un socle et les mots à
 * trait d'union sont dans des `span`.
 */
function RichText({ text }: { text: string }) {
  const segments = segmentPrompt(text);
  if (segments.length === 1 && segments[0].kind === "texte") return <Words text={text} />;
  const dense = graphemeCount(text) > DENSE_PROMPT_GRAPHEMES;
  const out: ReactNode[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.kind === "texte") {
      out.push(<Words key={i} text={segment.text} />);
      continue;
    }
    const socle =
      segment.kind === "emoji" ? (
        <span className="inline-block align-[-0.12em] text-[1.4em] leading-none">{segment.text}</span>
      ) : (
        <span
          // En paysage (480 px de haut ou moins), un socle de 24 px : deux
          // rangées de 36 px poussaient les tuiles sous le dock. Sur un écran
          // court debout, un cran de moins ; sur tout écran court, la marge
          // verticale de moitié.
          className={`gk-socle mx-0.5 my-1 inline-block max-w-full rounded-2xl border-2 border-white bg-[linear-gradient(180deg,#fff7e0_0%,#f6dfa4_100%)] px-3 pb-1.5 pt-2 align-middle leading-none tracking-[0.12em] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.8),0_4px_0_#d6c39a,0_10px_14px_-10px_rgba(60,30,0,0.5)] [@media(max-height:480px)]:text-2xl [@media(max-height:667px)]:my-0.5 ${emojiRowSizeClass(segment.count, dense)} ${emojiRowSizeClass(segment.count, dense, true)} ${segment.text.includes("\n") ? "whitespace-pre" : ""}`}
        >
          {segment.text}
        </span>
      );
    // La ponctuation qui suit le socle reste collée à lui.
    const next = segments[i + 1];
    const glue = next && next.kind === "texte" ? GLUED_PUNCTUATION.exec(next.text)?.[0] : undefined;
    if (!glue) {
      out.push(<Fragment key={i}>{socle}</Fragment>);
      continue;
    }
    out.push(
      <span key={i} className="whitespace-nowrap">
        {socle}
        {glue}
      </span>,
    );
    const rest = next.text.slice(glue.length);
    if (rest) out.push(<Words key={`${i}-suite`} text={rest} />);
    i++;
  }
  return <>{out}</>;
}

/** Du texte nu, où seuls les mots à trait d'union sont tenus en `nowrap`. */
function Words({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(HYPHENATED)) {
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={start} className="whitespace-nowrap">
        {match[0]}
      </span>,
    );
    last = start + match[0].length;
  }
  if (parts.length === 0) return <>{text}</>;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function parsePrompt(prompt: string): {
  instruction: string;
  quoted: string | null;
} {
  // Strategy 1 — one quoted passage that ENDS the prompt. It uses the FIRST
  // opening quote and the LAST matching closing quote, which handles
  // apostrophes inside the quoted sentence (e.g. "Aujourd'hui, nous jouons.").
  // The straight apostrophe is NOT a candidate: it is a letter of the French
  // language, not a quotation mark.
  const quoteCandidates: Array<{ open: string; close: string }> = [
    { open: "«", close: "»" },
    { open: "“", close: "”" }, // “ ”
    { open: '"', close: '"' },
    { open: "‘", close: "’" }, // ‘ ’
  ];

  for (const { open, close } of quoteCandidates) {
    const first = prompt.indexOf(open);
    const last = prompt.lastIndexOf(close);
    if (first === -1 || last === -1 || last - first < 5) continue;
    if (open === close && first === last) continue;
    const inner = prompt.slice(first + open.length, last);
    // A second opening or closing quote means two quotations, not one: the
    // text between them is not a quotation at all.
    if (inner.includes(open) || inner.includes(close)) continue;
    // Anything but the final punctuation after the quotation would be thrown
    // away by the card: show the prompt whole instead.
    const after = prompt.slice(last + close.length).trim();
    if (after.length > 0 && !/^[.!?…]+$/u.test(after)) continue;
    const quoted = inner.trim();
    if (!quoted || quoted.length < 4) continue;
    const before = prompt.slice(0, first).trim();
    const cleaned = before.replace(/[:—-]+\s*$/u, "").trim();
    if (cleaned.length > 0) {
      return { instruction: cleaned, quoted };
    }
  }

  // Strategy 2 — split on the first colon if the part after looks like a
  // sentence ending with punctuation (. ! ?)
  const colonIndex = prompt.indexOf(":");
  if (colonIndex > 10 && colonIndex < prompt.length - 5) {
    const instruction = prompt.slice(0, colonIndex).trim();
    const rest = prompt.slice(colonIndex + 1).trim();
    if (/[.!?]$/.test(rest) && rest.length > 5) {
      return { instruction, quoted: rest };
    }
  }

  return { instruction: prompt, quoted: null };
}
