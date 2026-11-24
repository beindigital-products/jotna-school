"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { CauriIcon, caurisLabel } from "@/components/student/game/cauri";
import { Pio, type PioState } from "@/components/student/pio";
import { cardImageSrc } from "@/lib/game-assets";

import { BTN_LEAF, BTN_PAPER, SHEET, WOOD } from "./landing-style";

/**
 * TROIS QUESTIONS, TOUT DE SUITE : le visiteur joue une petite séance dès le
 * deuxième écran, sans choisir de matière ni de classe. Il vit ce que vit
 * l'élève : Pio encourage, un indice s'ouvre après une erreur, la bonne
 * réponse s'affiche au troisième essai raté, puis viennent les étoiles, les
 * cauris et le coffre.
 *
 * CE N'EST PAS LE MOTEUR DES EXERCICES. La vraie démo, avec la correction du
 * serveur, par matière et par classe, est `exercise-types.tsx`, repliée juste
 * dessous (`full-demo.tsx`). Ici, trois questions écrites à la main et rien
 * d'enregistré.
 *
 * LES GAINS SUIVENT LES RÈGLES DU JEU (`docs/economie-du-jeu.md`) : un cauri par
 * étoile, plus cinq pour un palier validé ; un coffre du jour donne de 15 à 35
 * cauris et une carte.
 */
type Question = { tag: string; prompt: string; options: string[]; answer: number; hint: string };

const QUESTIONS: Question[] = [
  {
    tag: "Mathématiques · CE2",
    prompt: "Combien fait ½ + ¼ ?",
    options: ["¾", "⅔", "⅛", "1"],
    answer: 0,
    hint: "Un demi, c'est deux quarts. Ajoute un quart.",
  },
  {
    tag: "Français · CE2",
    prompt: "Demain, Awa ___ au marché.",
    options: ["allait", "ira", "est allée", "allions"],
    answer: 1,
    hint: "« Demain » : l'action n'a pas encore eu lieu. Cherche le futur.",
  },
  {
    tag: "Géographie · CE2",
    prompt: "Quelle est la capitale du Sénégal ?",
    options: ["Thiès", "Saint-Louis", "Dakar", "Ziguinchor"],
    answer: 2,
    hint: "Elle se trouve sur la presqu'île du Cap-Vert.",
  },
];

const MAX_TRIES = 3;
const CHEST_CAURIS = 20;
const CHEST_CARD = { id: "girafe", name: "La girafe" };

type Phase = "question" | "result" | "chest";

export function QuickPlay() {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");

  const question = QUESTIONS[index];
  const revealed = !solved && wrong.length >= MAX_TRIES;
  const over = solved || revealed;
  const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
  const earned = stars + 5;
  const done = phase === "question" ? index + (over ? 1 : 0) : QUESTIONS.length;

  function pick(option: number) {
    if (over || wrong.includes(option)) return;
    if (option === question.answer) {
      setSolved(true);
      setStreak((s) => (wrong.length === 0 ? s + 1 : 0));
    } else {
      setWrong((w) => [...w, option]);
      setErrors((e) => e + 1);
      setStreak(0);
    }
  }

  function next() {
    if (index + 1 < QUESTIONS.length) {
      setIndex(index + 1);
      setWrong([]);
      setSolved(false);
    } else {
      setPhase("result");
    }
  }

  function replay() {
    setIndex(0);
    setWrong([]);
    setSolved(false);
    setErrors(0);
    setStreak(0);
    setPhase("question");
  }

  let pose: PioState = "think";
  let say = "Choisis une réponse.";
  if (solved) {
    pose = "cheer";
    say = wrong.length === 0 ? "Bonne réponse, du premier coup !" : "Bonne réponse ! Tu as bien fait de réessayer.";
  } else if (revealed) {
    pose = "encourage";
    say = "Ce n'est pas grave. La bonne réponse est en vert : on la reverra ensemble.";
  } else if (wrong.length > 0) {
    pose = "encourage";
    say = `Presque. Un indice : ${question.hint}`;
  }

  return (
    <section
      id="jouer"
      className="relative isolate overflow-hidden bg-savanna-sand px-5 py-16 sm:px-8 sm:py-20"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/world/decors/maths-wide.webp)" }}
      />

      <div className="mx-auto max-w-2xl rounded-3xl bg-[#fffdf7]/92 px-5 py-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">À vous de jouer</p>
        <h2 className="mt-2 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
          Trois questions, comme un élève.
        </h2>
        <p className="mt-3 text-base leading-7 text-[#6b563f]">
          Trompez-vous exprès : un indice s&apos;ouvre après chaque erreur, et la bonne réponse
          s&apos;affiche au troisième essai raté.
        </p>
      </div>

      <div className={`mx-auto mt-8 max-w-3xl ${WOOD}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-3 pt-1 font-display font-semibold text-[#fff8e7]">
          <div className="mr-auto flex gap-1.5" role="img" aria-label={`Question ${Math.min(index + 1, QUESTIONS.length)} sur ${QUESTIONS.length}`}>
            {QUESTIONS.map((q, i) => (
              <span
                key={q.prompt}
                className={`h-2.5 w-9 rounded-full ${i < done ? "bg-savanna-sun" : "bg-[#fff8e7]/30"}`}
              />
            ))}
          </div>
          <span className="tabular-nums">Série : {streak}</span>
        </div>

        <div className={SHEET}>
          {phase === "question" ? (
            <div className="grid items-center gap-5 sm:grid-cols-[1fr_150px]">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#a5602c]">{question.tag}</p>
                <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-[#2b1d0e] sm:text-3xl">
                  {question.prompt}
                </p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {question.options.map((option, i) => {
                    const isAnswer = i === question.answer;
                    const isWrong = wrong.includes(i);
                    const tone =
                      over && isAnswer
                        ? "border-[#2f8f3a] bg-[#dff3dc] shadow-[0_4px_0_#2f8f3a]"
                        : isWrong
                          ? "border-[#c8452c] bg-[#fbe1da] opacity-70 shadow-[0_4px_0_#c8452c]"
                          : "border-[#ecd9ac] bg-[#fffdf7] shadow-[0_4px_0_#ecd9ac] hover:border-savanna-sun";
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={over || isWrong}
                        onClick={() => pick(i)}
                        className={`rounded-2xl border-2 px-4 py-3.5 text-center font-display text-xl font-semibold text-[#2b1d0e] outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60 enabled:cursor-pointer ${tone}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <p role="status" className="mt-4 min-h-[3.5rem] rounded-2xl bg-[#fdeecb] px-4 py-2.5 text-[15px] leading-6 text-[#2b1d0e]">
                  {say}
                </p>
                {over ? (
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={next} className={`cursor-pointer ${BTN_LEAF}`}>
                      {index + 1 < QUESTIONS.length ? "Question suivante" : "Voir mon résultat"}
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="order-first flex justify-center sm:order-none">
                <Pio state={pose} size={150} lite animated={false} />
              </div>
            </div>
          ) : null}

          {phase === "result" ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="font-display text-2xl font-bold text-[#2b1d0e] sm:text-3xl">Palier validé !</h3>
              <div className="flex gap-1.5" role="img" aria-label={`${stars} étoile${stars > 1 ? "s" : ""} sur 3`}>
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    aria-hidden
                    className={`size-10 ${n <= stars ? "fill-savanna-sun text-[#c97f00]" : "fill-[#ecd9ac] text-[#ecd9ac]"}`}
                  />
                ))}
              </div>
              <p className="flex items-center gap-2 font-display text-xl font-semibold text-[#2b1d0e]">
                <CauriIcon className="h-9 w-9" />+{caurisLabel(earned)}
              </p>
              <p className="max-w-md text-[15px] leading-6 text-[#6b563f]">
                Un cauri par étoile, plus cinq pour le palier validé. Et aujourd&apos;hui, un coffre attend.
              </p>
              <button
                type="button"
                onClick={() => setPhase("chest")}
                aria-label="Ouvrir le coffre du jour"
                className="cursor-pointer rounded-3xl outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- image du jeu ; `next/image` n'apporte rien sous export statique */}
                <img src="/images/coffre/ferme.webp" alt="" width={608} height={592} className="h-auto w-44" />
              </button>
              <p className="font-display text-lg font-semibold text-[#2b1d0e]">Touchez le coffre pour l&apos;ouvrir.</p>
            </div>
          ) : null}

          {phase === "chest" ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex flex-wrap items-end justify-center gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- image du jeu ; `next/image` n'apporte rien sous export statique */}
                <img src="/images/coffre/ouvert.webp" alt="" className="h-auto w-36" />
                <figure className="w-36 -rotate-3 rounded-2xl bg-[#fffdf7] p-2 shadow-[0_6px_0_rgba(94,49,18,0.22),0_18px_30px_-14px_rgba(43,29,14,0.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignette de carte ; `next/image` n'apporte rien sous export statique */}
                  <img src={cardImageSrc(CHEST_CARD.id, "lite")} alt="" className="aspect-square w-full rounded-xl object-cover" />
                  <figcaption className="pt-1.5 font-display font-semibold text-[#2b1d0e]">{CHEST_CARD.name}</figcaption>
                </figure>
              </div>
              <p className="flex items-center gap-2 font-display text-xl font-semibold text-[#2b1d0e]">
                <CauriIcon className="h-9 w-9" />+{caurisLabel(CHEST_CAURIS)} et une carte pour l&apos;album
              </p>
              <p className="max-w-md text-[15px] leading-6 text-[#6b563f]">
                Dans le jeu, l&apos;élève retrouve un coffre chaque jour. Avec ses cauris, il achète des
                objets pour son camp.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={replay} className={`cursor-pointer ${BTN_PAPER}`}>
                  Rejouer
                </button>
                <a href="#exercices" className={BTN_LEAF}>
                  Voir tous les exercices
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mx-auto mt-4 w-fit rounded-full bg-[#fffdf7]/92 px-4 py-1 text-center text-sm text-[#2b1d0e]">
        Démonstration : rien n&apos;est enregistré.
      </p>
    </section>
  );
}
