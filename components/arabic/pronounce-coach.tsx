"use client";

/**
 * « RÉPÈTE APRÈS PIO » — l'étape où l'enfant dit la lettre, et où Pio
 * l'accompagne jusqu'à ce qu'elle sorte.
 *
 * TOUT EST DIT, RIEN N'EST À LIRE. En arrivant, Pio dit la lettre (voix arabe)
 * puis « À toi ! Appuie sur le micro… » (voix française). Après chaque essai,
 * il DIT son retour. Le texte de la bulle est le même, pour l'adulte.
 *
 * PIO JOUE LE MAÎTRE, pas l'arbitre. Il montre, il écoute (pose `listen`
 * pendant le micro), il applaudit (`bravo`) ou il encourage (`encourage`) —
 * dans son boubou du module. La vérification est celle du serveur
 * (`arabic.voice.verifyPronunciation`).
 *
 * L'AIDE MONTE D'UN CRAN À CHAQUE ESSAI, comme le ferait un maître :
 *   1er essai manqué : « parle plus fort, près du micro », et Pio redit la
 *                      lettre ;
 *   2e essai manqué  : l'écoute LENTE, le conseil de bouche (où naît le son,
 *                      lettre « épaisse ») dit à voix haute, et la syllabe
 *                      seule à essayer ;
 *   3e essai         : « tu progresses, on la redira plus tard » — et le
 *                      bouton pour continuer. On ne bloque jamais un enfant.
 *
 * JAMAIS « C'EST FAUX » (`lib/arabic/copy.ts`, règle 1) : la machine peut
 * mal entendre un enfant de six ans, et c'est à Pio de porter le doute.
 *
 * PENDANT QUE LE MICRO ÉCOUTE, PIO SE TAIT (consigne vide) : sa voix serait
 * enregistrée avec celle de l'enfant.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { ArabicLetter } from "@/convex/arabic/alphabet";
import type { PronunciationVerdict } from "@/convex/arabic/matching";
import { bravo, CONSIGNES, type ConsigneKey } from "@/convex/arabic/consignes";
import { arabicCopy } from "@/lib/arabic/copy";
import { getSoundEnabledLocal, playCorrect } from "@/lib/sounds";
import type { PioState } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";
import { ArabicGlyph } from "./arabic-glyph";
import { CoachLine } from "./coach";
import { ListenButton } from "./listen-button";
import { RecordButton, type RecordPhase } from "./record-button";
import { speech, useSpeech, type SpeechRef } from "./speech";

export function PronounceCoach({
  lessonKey,
  letter,
  onOutcome,
  onNext,
}: {
  lessonKey: string;
  letter: ArabicLetter;
  /** Un essai a été jugé : l'étape compte comme faite pour la page. */
  onOutcome: () => void;
  /** Passer à la lettre suivante. */
  onNext: () => void;
}) {
  const { say } = useSpeech();
  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [verdict, setVerdict] = useState<PronunciationVerdict | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);

  const ok = verdict === "ok";
  const missed = verdict !== null && !ok;
  const exhausted = missed && attempts >= 3;
  const listening = phase === "recording" || phase === "sending";
  const tip: ConsigneKey = `tip_${letter.articulation}`;
  const name = speech.letter(letter.key);

  const { line, words } = ((): { line: string; words: SpeechRef[] } => {
    if (phase === "recording") return { line: "Je t'écoute…", words: [] };
    if (phase === "sending") return { line: arabicCopy.record.checking.pronounce, words: [] };
    if (ok) {
      const key = bravo(attempts);
      return { line: CONSIGNES[key], words: [speech.consigne(key)] };
    }
    if (exhausted) return { line: CONSIGNES.keep_going, words: [speech.consigne("keep_going")] };
    if (verdict === "close") {
      return { line: CONSIGNES.close, words: [speech.consigne("close"), name] };
    }
    if (missed && attempts >= 2) {
      return {
        line: `${CONSIGNES.retry_2} ${CONSIGNES[tip]}`,
        words: [
          speech.consigne("retry_2"),
          speech.consigne(tip),
          ...(letter.emphatic ? [speech.consigne("tip_emphatic")] : []),
          name,
        ],
      };
    }
    if (missed) return { line: CONSIGNES.retry_1, words: [speech.consigne("retry_1"), name] };
    // L'arrivée : Pio dit la lettre, puis « À toi ! ».
    return { line: CONSIGNES.repeat, words: [name, speech.consigne("repeat")] };
  })();

  const pose: PioState = listening ? "listen" : ok ? "bravo" : missed ? "encourage" : "recite";
  const showTip = missed && (attempts >= 2 || verdict === "close");

  return (
    <div className="space-y-4">
      <CoachLine pose={pose} line={line} say={words} animated={!listening} />

      <motion.button
        type="button"
        onClick={() => void say([name])}
        aria-label={`La lettre ${letter.nameFr}, touche pour l'entendre encore`}
        whileTap={{ scale: 0.96 }}
        className="btn-chunky mx-auto flex w-full max-w-xs items-center justify-center gap-4 rounded-[2rem] border-4 border-white bg-gradient-to-b from-teal-400 to-teal-600 px-5 py-3 text-white shadow-xl"
        style={{ "--btn-depth": "#115e59" } as React.CSSProperties}
      >
        {/* Centrée sur son encre et contenue dans sa case : la boucle d'un ج
            ne sort plus de la tuile (`arabic-glyph.tsx`). */}
        <ArabicGlyph text={letter.isolated} className="h-28 w-28 shrink-0 drop-shadow" />
        <span className="font-display text-2xl font-extrabold">{letter.nameFr}</span>
      </motion.button>

      {missed && !ok && (
        <div className="flex justify-center">
          <ListenButton
            variant="chip"
            rate={0.7}
            speechRef={name}
            label="🐢 Lentement"
          />
        </div>
      )}

      <RecordButton
        lessonKey={lessonKey}
        itemKey={letter.key}
        drill="pronounce"
        attemptIndex={attempts}
        coached
        onPhaseChange={setPhase}
        onOutcome={(outcome) => {
          setAttempts((n) => n + 1);
          setVerdict(outcome.verdict);
          setHeard(outcome.heard || null);
          if (outcome.verdict === "ok" && getSoundEnabledLocal()) void playCorrect();
          onOutcome();
        }}
      />

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-3xl border-[3px] border-amber-200 bg-amber-50 p-3"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
              <Lightbulb className="h-6 w-6" aria-hidden />
            </span>
            <p className="flex-1 text-left text-base font-bold text-amber-950">{CONSIGNES[tip]}</p>
            <ListenButton
              variant="chip"
              speechRef={{ kind: "letterSyllable", letterKey: letter.key, haraka: "fatha" }}
              label={letter.syllables.fatha}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {heard && missed && (
        <p className="text-center text-sm font-medium text-gray-500">
          J&apos;ai entendu :{" "}
          {/* `auto` : la transcription peut revenir en latin (« Jean »). */}
          <span dir="auto" className="font-arabic text-lg">
            {heard}
          </span>
        </p>
      )}

      {(ok || exhausted) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GameButton
            onClick={onNext}
            tone={ok ? "green" : "orange"}
            size="lg"
            className="w-full"
            icon={<ArrowRight className="h-6 w-6" aria-hidden />}
            ariaLabel="Lettre suivante"
          >
            On continue
          </GameButton>
        </motion.div>
      )}
    </div>
  );
}
