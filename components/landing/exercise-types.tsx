"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { ArrowRight, Volume2 } from "lucide-react";

import { Section } from "./section";
import { SUBJECT_PRACTICE } from "./exercise-catalog";
import { LANDING_SUBJECTS, type LandingSubject } from "./landing-subjects";
import { useNearViewport } from "./use-near-viewport";
import { CardShells, LoadFailure } from "./demo/card-frame";
import { classicTypesFor, gamesFor } from "./demo/demo-matrix";
import { CLASS_AGES, DEMO_CLASSES, type DemoClass, type DemoSubject } from "./demo/demo-types";
import { cn } from "@/lib/utils";

/**
 * LES EXERCICES, À ESSAYER : une matière, une classe, et des cartes qu'on joue.
 *
 * Un parent, un professeur ou une école voit ici ce que son enfant ou son élève
 * fera, SANS COMPTE : le visiteur choisit une matière et la classe de l'enfant,
 * et chaque carte est un vrai exercice de cette classe, joué avec les écrans de
 * l'application et corrigé par la même règle (`demo/demo-player.tsx`).
 *
 * CE QUI SE VOIT TOUT DE SUITE, CE QUI SE CHARGE ENSUITE. Le pré-rendu contient
 * les onglets, le sélecteur de classe et les cartes de la classe, vides
 * (`CardShells`) : de quoi lire ce que la classe propose. Les écrans des
 * exercices, la règle de correction et les générateurs de jeux forment un lot à
 * part (`demo/demo-cards.tsx`), que la page ne télécharge que quand le visiteur
 * approche de la section ; la banque d'exercices de la matière regardée en est
 * un autre (`demo/bank/`), que le premier va chercher.
 */

const PANEL_ID = "exercices-panneau";
const tabId = (key: DemoSubject) => `exercices-onglet-${key}`;

/** La classe qu'on montre d'abord : au milieu du primaire, là où chaque matière a le plus à montrer. */
const DEFAULT_CLASS: DemoClass = "CE2";

/** Combien avant la section on commence à charger les exercices, pour qu'ils soient prêts à l'arrivée. */
const LOAD_MARGIN = "900px 0px";

/**
 * La case où va le clavier après une flèche, Début ou Fin, dans une rangée
 * d'onglets ou de boutons radio (WAI-ARIA) ; `null` pour une autre touche.
 */
function rovingTarget(key: string, current: number, total: number): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % total;
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + total) % total;
    case "Home":
      return 0;
    case "End":
      return total - 1;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Les cartes jouables : un lot chargé à la demande
// ---------------------------------------------------------------------------

type CardsModule = typeof import("./demo/demo-cards");

let cardsRequest: Promise<CardsModule> | undefined;
let cardsReady: CardsModule | undefined;

/** Le lot des cartes jouables, demandé une fois ; un échec se redemande au « Réessayer ». */
function loadCards(): Promise<CardsModule> {
  if (!cardsRequest) {
    const pending = import("./demo/demo-cards");
    cardsRequest = pending;
    pending.then(
      (module) => {
        cardsReady = module;
      },
      () => {
        if (cardsRequest === pending) cardsRequest = undefined;
      },
    );
  }
  return cardsRequest;
}

/**
 * Le lot des cartes jouables, une fois `enabled` : tout de suite s'il est déjà
 * arrivé (revenir à une matière ne montre pas de cartes vides), sinon à
 * l'arrivée du fichier. Un échec se dit (`failed`) et se retente (`retry`).
 */
function useCards(enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<{ attempt: number; module: CardsModule | null } | null>(null);

  useEffect(() => {
    if (!enabled || cardsReady) return;
    let cancelled = false;
    loadCards().then(
      (module) => {
        if (!cancelled) setOutcome({ attempt, module });
      },
      () => {
        if (!cancelled) setOutcome({ attempt, module: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const mine = outcome?.attempt === attempt ? outcome : null;
  return {
    Cards: enabled ? (cardsReady ?? mine?.module ?? null)?.default ?? null : null,
    failed: enabled && !cardsReady && mine !== null && mine.module === null,
    retry: () => setAttempt((current) => current + 1),
  };
}

// ---------------------------------------------------------------------------
// Le panneau d'une matière
// ---------------------------------------------------------------------------

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function SubjectPanel({
  subject,
  klass,
  animate,
  Cards,
  failed,
  onRetry,
}: {
  subject: LandingSubject;
  klass: DemoClass;
  animate: boolean;
  /** Le lot des exercices jouables, une fois arrivé : il remplace les cartes vides. */
  Cards: CardsModule["default"] | null;
  failed: boolean;
  onRetry: () => void;
}) {
  const { icon: Icon } = subject;
  const classic = classicTypesFor(subject.key, klass);
  const games = gamesFor(subject.key, klass);
  const count = [
    plural(classic.length, "type d'exercice", "types d'exercices"),
    games.length > 0 ? plural(games.length, "type de jeu", "types de jeux") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      role="tabpanel"
      id={PANEL_ID}
      aria-labelledby={tabId(subject.key)}
      // Le premier affichage est celui du pré-rendu : pas de fondu, pas de
      // saut. Seul le changement de matière anime le panneau.
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mt-8"
    >
      {/* L'icône et le texte côte à côte, y compris sur téléphone ; le compte
          passe dessous, puis à droite dès `sm`. */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-3xl bg-gray-50/80 p-5 ring-1 ring-gray-100 sm:grid-cols-[auto_1fr_auto] sm:gap-x-5 sm:p-6">
        <span
          aria-hidden
          className={`flex size-12 items-center justify-center rounded-2xl text-white sm:size-14 ${subject.gradient}`}
        >
          <Icon className="size-6 sm:size-7" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold text-gray-900">{subject.title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">{SUBJECT_PRACTICE[subject.key]}</p>
        </div>
        <p
          role="status"
          className="col-span-2 w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 sm:col-span-1"
        >
          En {klass} : {count}
        </p>
      </div>

      <ClassNotes klass={klass} />

      <p className="mt-4 text-center text-sm leading-6 text-gray-500">
        Essayez de répondre, et même de vous tromper : Pio encourage, un indice s&apos;ouvre après chaque erreur, et la
        bonne réponse s&apos;affiche au troisième essai raté.
      </p>

      <div className="mt-8">
        {failed ? (
          <LoadFailure onRetry={onRetry} />
        ) : Cards ? (
          <Cards subject={subject.key} klass={klass} />
        ) : (
          <CardShells subject={subject.key} klass={klass} />
        )}
      </div>
    </motion.div>
  );
}

/** Ce qui change pour les plus petits : la voix de Pio dans l'application, et pas de réponse à écrire au CI. */
function ClassNotes({ klass }: { klass: DemoClass }) {
  if (klass !== "CI" && klass !== "CP") return null;
  return (
    <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950 ring-1 ring-sky-100">
      <Volume2 className="mt-0.5 size-4 flex-none text-sky-600" aria-hidden />
      <span>
        Au {klass}, l&apos;enfant apprend à lire :{" "}
        <strong className="font-semibold">dans l&apos;application, Pio lit chaque consigne à voix haute</strong>
        {klass === "CI" ? ", et aucune réponse n'est à taper au clavier" : ""}. Ici, c&apos;est à vous de la lire.
      </span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Les onglets des matières et le sélecteur de classe
// ---------------------------------------------------------------------------

function SubjectTabs({
  active,
  onChange,
}: {
  active: DemoSubject;
  onChange: (key: DemoSubject) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = LANDING_SUBJECTS.length;

  function select(index: number) {
    onChange(LANDING_SUBJECTS[index].key);
    refs.current[index]?.focus();
  }

  // Les flèches changent de matière, Début et Fin vont aux extrémités : le
  // clavier se comporte comme celui d'un jeu d'onglets (WAI-ARIA).
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = LANDING_SUBJECTS.findIndex((subject) => subject.key === active);
    const target = rovingTarget(event.key, current, total);
    if (target === null) return;
    event.preventDefault();
    select(target);
  }

  return (
    <div
      role="tablist"
      aria-label="Matières"
      onKeyDown={onKeyDown}
      // Sur téléphone, une rangée qui défile de côté jusqu'au bord de l'écran ;
      // dès `sm`, les huit matières passent à la ligne, centrées.
      className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {LANDING_SUBJECTS.map(({ key, icon: Icon, title, gradient }, i) => {
        const selected = key === active;
        return (
          <button
            key={key}
            ref={(element) => {
              refs.current[i] = element;
            }}
            type="button"
            role="tab"
            id={tabId(key)}
            aria-selected={selected}
            aria-controls={PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={(event) => {
              onChange(key);
              event.currentTarget.scrollIntoView?.({ block: "nearest", inline: "center" });
            }}
            className={cn(
              "inline-flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              selected
                ? "border-gray-900 bg-gray-900 text-white shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <span
              aria-hidden
              className={cn("flex size-5 items-center justify-center rounded-full text-white", gradient)}
            >
              <Icon className="size-3" />
            </span>
            {title}
          </button>
        );
      })}
    </div>
  );
}

function ClassPicker({
  active,
  onChange,
}: {
  active: DemoClass;
  onChange: (klass: DemoClass) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = DEMO_CLASSES.length;

  function select(index: number) {
    onChange(DEMO_CLASSES[index]);
    refs.current[index]?.focus();
  }

  // Comme un groupe de boutons radio : les flèches choisissent la classe voisine.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = rovingTarget(event.key, DEMO_CLASSES.indexOf(active), total);
    if (target === null) return;
    event.preventDefault();
    select(target);
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p id="exercices-classe" className="text-sm font-bold text-gray-900">
        Classe de votre enfant
      </p>
      <div
        role="radiogroup"
        aria-labelledby="exercices-classe"
        onKeyDown={onKeyDown}
        // Trois par rangée sur téléphone, les six d'un trait dès `sm`.
        className="grid w-full max-w-sm grid-cols-3 gap-2 sm:flex sm:max-w-none sm:justify-center"
      >
        {DEMO_CLASSES.map((klass, i) => {
          const selected = klass === active;
          return (
            <button
              key={klass}
              ref={(element) => {
                refs.current[i] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(klass)}
              className={cn(
                "flex flex-col items-center rounded-2xl border px-4 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:min-w-[5.5rem]",
                selected
                  ? "border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-500/25"
                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50",
              )}
            >
              <span className="text-base font-extrabold leading-tight">{klass}</span>
              <span className={cn("text-[11px] font-medium", selected ? "text-amber-900/80" : "text-gray-500")}>
                {CLASS_AGES[klass]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// La section
// ---------------------------------------------------------------------------

export function ExerciseTypes() {
  const [active, setActive] = useState<DemoSubject>(LANDING_SUBJECTS[0].key);
  const [klass, setKlass] = useState<DemoClass>(DEFAULT_CLASS);
  // Vrai dès le premier choix du visiteur : voir `SubjectPanel`.
  const [changed, setChanged] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(rootRef, LOAD_MARGIN);
  // Le visiteur qui touche à un choix a déjà approché : on charge sans attendre l'observateur.
  const { Cards, failed, retry } = useCards(near || changed);
  const subject = LANDING_SUBJECTS.find((entry) => entry.key === active) ?? LANDING_SUBJECTS[0];

  return (
    <Section
      id="exercices"
      eyebrow="Exercices par matière"
      title="Essayez comme un élève."
      description="Choisissez une matière et la classe de votre enfant : chaque carte est un vrai exercice, à jouer ici, sans créer de compte. Même écran, même correction que dans l'application."
    >
      <MotionConfig reducedMotion="user">
        <div ref={rootRef}>
          <SubjectTabs
            active={active}
            onChange={(key) => {
              setActive(key);
              setChanged(true);
            }}
          />
          <ClassPicker
            active={klass}
            onChange={(next) => {
              setKlass(next);
              setChanged(true);
            }}
          />
          <SubjectPanel
            key={subject.key}
            subject={subject}
            klass={klass}
            animate={changed}
            Cards={Cards}
            failed={failed}
            onRetry={retry}
          />
        </div>

        <div className="mt-12 rounded-3xl bg-gray-50/80 p-6 text-center ring-1 ring-gray-100 sm:p-8">
          <p className="text-lg font-extrabold text-gray-900">Ce n&apos;est qu&apos;un aperçu.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            Dans l&apos;application, chaque matière se découpe en thématiques et chaque thématique en paliers de
            difficulté croissante, de la découverte à la maîtrise. Rien n&apos;est enregistré ici : créez un compte
            pour suivre les progrès de votre enfant.
          </p>
          <Link
            href="/register"
            className="group mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
          >
            S&apos;inscrire
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </MotionConfig>
    </Section>
  );
}
