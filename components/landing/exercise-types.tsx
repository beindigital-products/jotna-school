"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { MotionConfig, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Section } from "./section";
import { CATALOG, TYPE_INFO, type CatalogEntry } from "./exercise-catalog";
import { LandingPreview } from "./exercise-previews";
import { LANDING_SUBJECTS, type LandingSubject } from "./landing-subjects";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { cn } from "@/lib/utils";
import type { ExerciseType } from "@/convex/exerciseTypes";
import type { ProgrammeSubjectKey } from "@/convex/programme/types";

/**
 * LES EXERCICES, MATIÈRE PAR MATIÈRE.
 *
 * Le visiteur choisit une matière ; la section lui montre les types d'exercice
 * qu'on y trouve, chacun joué sur un exemple de cette matière. Le contenu est
 * dans `exercise-catalog.ts`, vérifié contre le programme et contre les types
 * que le modèle a le droit d'écrire ; les aperçus animés sont dans
 * `exercise-previews.tsx`.
 */

// Des classes écrites en toutes lettres, pour que Tailwind les trouve.
const TYPE_STYLE: Record<ExerciseType, { tint: string; accent: string }> = {
  qcm: { tint: "from-amber-50 to-amber-100/60", accent: "text-amber-700" },
  "drag-drop": { tint: "from-orange-50 to-orange-100/60", accent: "text-orange-700" },
  match: { tint: "from-sky-50 to-sky-100/60", accent: "text-sky-700" },
  order: { tint: "from-lime-50 to-lime-100/60", accent: "text-lime-700" },
  "short-answer": { tint: "from-yellow-50 to-yellow-100/60", accent: "text-yellow-700" },
  "fill-blank": { tint: "from-violet-50 to-violet-100/60", accent: "text-violet-700" },
  pattern: { tint: "from-rose-50 to-rose-100/60", accent: "text-rose-700" },
  "pixel-art": { tint: "from-fuchsia-50 to-fuchsia-100/60", accent: "text-fuchsia-700" },
  listen: { tint: "from-cyan-50 to-cyan-100/60", accent: "text-cyan-700" },
  "color-mix": { tint: "from-emerald-50 to-emerald-100/60", accent: "text-emerald-700" },
};

const PANEL_ID = "exercices-panneau";
const tabId = (key: ProgrammeSubjectKey) => `exercices-onglet-${key}`;

function ExerciseCardView({ entry }: { entry: CatalogEntry }) {
  const [hovered, setHovered] = useState(false);
  const { kind } = entry.example;
  const info = TYPE_INFO[kind];
  const style = TYPE_STYLE[kind];

  return (
    <StaggerItem
      // Deux colonnes dès `sm`, trois dès `lg`, et la dernière rangée CENTRÉE :
      // cinq cartes ou une seule ne laissent pas un trou à droite.
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTap={() => setHovered((current) => !current)}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        <span className={`size-1.5 rounded-full bg-current ${style.accent}`} />
        {info.label}
      </span>
      <h4 className="mt-4 text-lg font-extrabold text-gray-900">{info.title}</h4>
      <p className="mt-1.5 text-sm leading-6 text-gray-600">
        {entry.description ?? info.description}
      </p>
      <div className="mt-auto pt-5">
        <div
          // Décoratif : le type est dit en toutes lettres juste au-dessus.
          aria-hidden="true"
          className={`flex min-h-[140px] items-center justify-center rounded-2xl bg-gradient-to-br ${style.tint} p-4 ring-1 ring-inset ring-white/60 transition-shadow group-hover:shadow-inner`}
        >
          <div className="w-full">
            <LandingPreview example={entry.example} hovered={hovered} />
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}

function CardGrid({ entries }: { entries: CatalogEntry[] }) {
  return (
    <StaggerContainer className="flex flex-wrap justify-center gap-4">
      {entries.map((entry) => (
        <ExerciseCardView key={entry.example.kind} entry={entry} />
      ))}
    </StaggerContainer>
  );
}

function GroupLabel({ children, sparkles = false }: { children: string; sparkles?: boolean }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
      {sparkles && <Sparkles className="size-4 text-fuchsia-500" aria-hidden />}
      {children}
    </p>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function SubjectPanel({ subject, animate }: { subject: LandingSubject; animate: boolean }) {
  const { icon: Icon } = subject;
  const catalog = CATALOG[subject.key];
  const hasGames = catalog.games.length > 0;
  const count = [
    plural(catalog.exercises.length, "type d'exercice", "types d'exercices"),
    hasGames ? plural(catalog.games.length, "type de jeu", "types de jeux") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      role="tabpanel"
      id={PANEL_ID}
      aria-labelledby={tabId(subject.key)}
      tabIndex={0}
      // Le premier affichage est celui du pré-rendu : pas de fondu, pas de
      // saut. Seul le changement de matière anime le panneau.
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mt-8 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-4"
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
          <p className="mt-1 text-sm leading-6 text-gray-600">{catalog.practice}</p>
        </div>
        <p className="col-span-2 w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 sm:col-span-1">
          {count}
        </p>
      </div>

      <div className="mt-8">
        {hasGames && <GroupLabel>Les exercices</GroupLabel>}
        <CardGrid entries={catalog.exercises} />
      </div>

      {hasGames && (
        <div className="mt-10">
          <GroupLabel sparkles>Les jeux</GroupLabel>
          <CardGrid entries={catalog.games} />
        </div>
      )}
    </motion.div>
  );
}

function SubjectTabs({
  active,
  onChange,
}: {
  active: ProgrammeSubjectKey;
  onChange: (key: ProgrammeSubjectKey) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = LANDING_SUBJECTS.length;

  function select(index: number) {
    const next = (index + total) % total;
    onChange(LANDING_SUBJECTS[next].key);
    refs.current[next]?.focus();
  }

  // Les flèches changent de matière, Début et Fin vont aux extrémités : le
  // clavier se comporte comme celui d'un jeu d'onglets (WAI-ARIA).
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = LANDING_SUBJECTS.findIndex((subject) => subject.key === active);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(current - 1);
        break;
      case "Home":
        event.preventDefault();
        select(0);
        break;
      case "End":
        event.preventDefault();
        select(total - 1);
        break;
    }
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

export function ExerciseTypes() {
  const [active, setActive] = useState<ProgrammeSubjectKey>(LANDING_SUBJECTS[0].key);
  // Vrai dès le premier changement de matière : voir `SubjectPanel`.
  const [changed, setChanged] = useState(false);
  const subject = LANDING_SUBJECTS.find((entry) => entry.key === active) ?? LANDING_SUBJECTS[0];

  return (
    <Section
      id="exercices"
      eyebrow="Exercices par matière"
      title="Chaque matière a ses exercices."
      description="Choisissez une matière pour voir les types d'exercices qu'on y trouve. Survolez ou touchez une carte pour la voir en action."
    >
      <MotionConfig reducedMotion="user">
        <SubjectTabs
          active={active}
          onChange={(key) => {
            setActive(key);
            setChanged(true);
          }}
        />
        <SubjectPanel key={subject.key} subject={subject} animate={changed} />
      </MotionConfig>
    </Section>
  );
}
