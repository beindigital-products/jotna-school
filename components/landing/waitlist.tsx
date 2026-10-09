"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { WaitlistAudience } from "@/convex/waitlistRules";
import { refusalMessage } from "@/lib/refusalMessage";

/**
 * La liste d'attente, à la place de l'ancien appel à créer un compte.
 *
 * Jotna School ouvre à la vente à la rentrée 2027-2028. D'ici là, la vitrine
 * ne vend rien : elle recueille l'adresse de qui veut être prévenu de
 * l'ouverture (`waitlist.join`). Le héros et la barre de navigation renvoient
 * ici par l'ancre `#liste-attente`.
 */
export function Waitlist() {
  return (
    <section
      id="liste-attente"
      className="scroll-mt-10 px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#fdfbf0] shadow-[0_20px_60px_-30px_rgba(60,50,20,0.25)] ring-1 ring-amber-200/50">
        <NotebookLines />
        <MarginLines />
        <Doodles />

        <div className="relative px-6 py-20 text-center sm:px-12">
          <div className="flex flex-col items-center">
            <div className="flex h-10 items-center">
              <PostItBadge />
            </div>

            <div className="flex min-h-20 items-end">
              <h2 className="relative inline-block font-sans text-3xl font-extrabold leading-none tracking-tight text-gray-900 sm:text-5xl">
                Rendez-vous à la{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">rentrée 2027</span>
                  <Highlight />
                </span>
                .
              </h2>
            </div>

            <p className="mx-auto max-w-xl text-base leading-10 text-gray-600 sm:text-lg">
              Jotna School sera officiellement disponible à la vente pour
              l&apos;année scolaire{" "}
              <span className="whitespace-nowrap">2027-2028</span>. Laissez
              votre adresse : nous vous écrirons dès l&apos;ouverture.
            </p>

            <div className="h-10" />

            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}

const AUDIENCES: Array<{ value: WaitlistAudience; label: string }> = [
  { value: "ecole", label: "Une école" },
  { value: "parent", label: "Un parent" },
  { value: "professeur", label: "Un professeur" },
];

/**
 * Le formulaire, puis la confirmation qui le remplace.
 *
 * LE PROFIL N'A PAS DE VALEUR PAR DÉFAUT : une case cochée d'avance remplirait
 * la liste de réponses que personne n'a données. Le navigateur vérifie la forme
 * de l'adresse (`type="email"`) ; le serveur la vérifie de nouveau, et c'est sa
 * réponse qui fait foi.
 */
function WaitlistForm() {
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState<WaitlistAudience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isDone) return <WaitlistDone />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (audience === null) {
      setError(
        "Indiquez d'abord si vous êtes une école, un parent ou un professeur.",
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await join({ email, audience });
      setIsDone(true);
    } catch (err) {
      setError(
        refusalMessage(
          err,
          "L'inscription n'a pas abouti. Réessayez dans un instant.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <fieldset>
        <legend className="mx-auto text-sm font-semibold text-gray-700">
          Vous êtes
        </legend>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {AUDIENCES.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="audience"
                value={option.value}
                checked={audience === option.value}
                onChange={() => {
                  setAudience(option.value);
                  setError(null);
                }}
                className="peer sr-only"
              />
              <span className="inline-flex h-10 items-center rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 peer-checked:border-gray-900 peer-checked:bg-gray-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 peer-focus-visible:ring-offset-2">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 w-full min-w-0 rounded-full border border-gray-300 bg-white px-6 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:flex-1"
        />
        <SubmitButton isSubmitting={isSubmitting} />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Votre adresse ne sert qu&apos;à vous prévenir de l&apos;ouverture.
      </p>
    </form>
  );
}

/**
 * La confirmation. Elle prend le focus : le bouton qui l'avait sur le
 * formulaire vient de disparaître, et un lecteur d'écran doit entendre que
 * l'inscription est faite.
 */
function WaitlistDone() {
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div role="status" className="flex flex-col items-center gap-2">
      <CheckCircle2 className="size-8 text-emerald-500" aria-hidden />
      <p
        ref={titleRef}
        tabIndex={-1}
        className="text-lg font-semibold text-gray-900 outline-none"
      >
        C&apos;est noté !
      </p>
      <p className="max-w-md text-base text-gray-600">
        Nous vous écrirons dès l&apos;ouverture des ventes, à la rentrée 2027.
      </p>
    </div>
  );
}

function NotebookLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(96, 130, 200, 0.3) 31px, rgba(96, 130, 200, 0.3) 32px, transparent 32px, transparent 40px)",
      }}
    />
  );
}

function MarginLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0">
      <div className="absolute inset-y-0 left-[58px] w-[1.5px] bg-rose-400/55" />
      <div className="absolute inset-y-0 left-[63px] w-[1.5px] bg-rose-400/55" />
    </div>
  );
}

function PostItBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, y: -8, rotate: -6 }}
      whileInView={{ opacity: 1, y: 0, rotate: -3 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="inline-flex items-center gap-2 rounded-md bg-amber-200/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow-[2px_3px_0_rgba(180,140,30,0.25)]"
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Liste d&apos;attente
    </motion.span>
  );
}

function Highlight() {
  return (
    <motion.span
      aria-hidden
      initial={{ scaleX: 0, originX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ transformOrigin: "left center" }}
      className="absolute inset-x-[-2px] bottom-[6%] -z-0 h-[55%] rounded-sm bg-amber-300/70"
    />
  );
}

function Doodles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden sm:block"
    >
      <motion.svg
        initial={{ opacity: 0, rotate: -20 }}
        whileInView={{ opacity: 1, rotate: -8 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute left-[8%] top-[18%] size-12 text-amber-500"
        viewBox="0 0 48 48"
        fill="none"
      >
        <motion.path
          d="M24 6 L27.5 19 L41 19 L30.5 27 L34 40 L24 32 L14 40 L17.5 27 L7 19 L20.5 19 Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute right-[10%] top-[14%] size-11 text-rose-500"
        viewBox="0 0 48 48"
        fill="none"
      >
        <motion.path
          d="M8 28 L22 40 L40 8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, rotate: 10 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-[14%] right-[18%] h-14 w-20 text-lime-600"
        viewBox="0 0 80 56"
        fill="none"
      >
        <motion.path
          d="M6 44 Q 30 10, 58 22 L 58 22"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, delay: 1, ease: "easeOut" }}
        />
        <motion.path
          d="M58 22 L50 16 M58 22 L52 30"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.4, delay: 1.7, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, rotate: 15 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="absolute bottom-[22%] left-[14%] size-9 text-orange-500"
        viewBox="0 0 36 36"
        fill="none"
      >
        <motion.circle
          cx="18"
          cy="18"
          r="12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 1.2, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{
        duration: 3.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      className="relative w-full sm:w-auto"
    >
      <motion.span
        aria-hidden
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-amber-300/50 blur-xl"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gray-900 px-6 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(30,30,30,0.6)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 sm:w-auto"
      >
        Prévenez-moi
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </button>
    </motion.div>
  );
}
