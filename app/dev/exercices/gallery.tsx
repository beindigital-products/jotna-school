"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import DragDropExercise from "@/components/exercises/DragDropExercise";
import GameExercise, { isGameScreenType } from "@/components/exercises/GameExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import { PromptReaderProvider } from "@/components/exercises/prompt-reader";
import { isReadingLearnerClass } from "@/convex/curriculum";
import { verifyAnswer } from "@/convex/paliers/exerciseRules";
import { DevBar, DevButton, DevSelect, DevToggle, ExerciseCard, SessionBar, SessionShell } from "../session-shell";
import {
  KINDS,
  KIND_LABELS,
  STATES,
  STATE_LABELS,
  armSpecimen,
  buildSpecimens,
  isKind,
  isState,
  needsArming,
  type Kind,
  type Specimen,
  type StageState,
} from "./specimens";

/**
 * LA GALERIE DES EXERCICES — chaque écran de `components/exercises`, dans
 * chacun de ses états, rendu DANS la coque de la séance (`../session-shell`).
 *
 * Ce sont les vrais composants, avec les vrais payloads de la vitrine et des
 * gabarits (`./specimens.ts`) : ce qu'on voit ici est ce que l'enfant voit.
 * Les états qui demandent un geste (une option choisie, bonne ou mauvaise
 * réponse) sont joués par des touchers sur le DOM, puis `disabled` et
 * `isCorrect` sont posés, comme la séance le fait après la vérification.
 *
 * TOUT SE PILOTE PAR L'URL, pour que `scripts/shoot-exercises.mjs` ouvre un
 * écran précis :
 *   ?type=qcm4&etat=bonne          un écran, un état (défaut : qcm4, repos)
 *   &tout=1                        tous les états du type (type=tous : tout)
 *   &rm=1                          mouvement réduit simulé
 *   &tablette=1                    la largeur d'une tablette, dans un grand écran
 *   &ci=0                          sans le lecteur de consigne (il est là par
 *                                  défaut : les spécimens sont de CI et de CP)
 *   &barre=0                       sans la barre de commande (les captures)
 *
 * L'attribut `data-stage-ready="1"` sur chaque carte dit que les gestes sont
 * joués et l'état posé : le script attend ce signal avant de photographier.
 */
export function ExerciseGallery() {
  return (
    <Suspense fallback={null}>
      <GalleryInner />
    </Suspense>
  );
}

type Params = {
  type: Kind | "tous";
  state: StageState | "tous";
  all: boolean;
  reduced: boolean;
  tablet: boolean;
  reader: boolean;
  bar: boolean;
};

function readParams(search: URLSearchParams): Params {
  const type = search.get("type");
  const state = search.get("etat");
  return {
    type: type === "tous" ? "tous" : isKind(type) ? type : "qcm4",
    state: state === "tous" ? "tous" : isState(state) ? state : "repos",
    all: search.get("tout") === "1",
    reduced: search.get("rm") === "1",
    tablet: search.get("tablette") === "1",
    reader: search.get("ci") !== "0",
    bar: search.get("barre") !== "0",
  };
}

function writeParams(params: Params): string {
  const search = new URLSearchParams();
  if (params.type !== "qcm4") search.set("type", params.type);
  if (params.state !== "repos") search.set("etat", params.state);
  if (params.all) search.set("tout", "1");
  if (params.reduced) search.set("rm", "1");
  if (params.tablet) search.set("tablette", "1");
  if (!params.reader) search.set("ci", "0");
  if (!params.bar) search.set("barre", "0");
  const text = search.toString();
  return text ? `?${text}` : "";
}

function GalleryInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => readParams(searchParams), [searchParams]);
  const specimens = useMemo(() => buildSpecimens(), []);
  // « Rejouer » remonte la carte : les gestes se rejouent, l'état se repose.
  const [round, setRound] = useState(0);

  const update = useCallback(
    (patch: Partial<Params>) => {
      router.replace(`${pathname}${writeParams({ ...params, ...patch })}`, { scroll: false });
    },
    [router, pathname, params],
  );

  const kinds: Kind[] = params.type === "tous" ? [...KINDS] : [params.type];
  const states: StageState[] = params.state === "tous" ? [...STATES] : [params.state];
  const single = !params.all && params.type !== "tous" && params.state !== "tous";

  return (
    <SessionShell reduced={params.reduced}>
      {params.bar && (
        <DevBar title="Galerie des exercices">
          <DevSelect
            label="Type"
            value={params.type}
            onChange={(type) => update({ type, all: type === "tous" ? true : params.all })}
            options={[
              { value: "tous" as const, label: "Tous les types" },
              ...KINDS.map((kind) => ({ value: kind, label: KIND_LABELS[kind] })),
            ]}
          />
          <DevSelect
            label="État"
            value={params.state}
            onChange={(state) => update({ state, all: state === "tous" ? true : params.all })}
            options={[
              { value: "tous" as const, label: "Tous les états" },
              ...STATES.map((state) => ({ value: state, label: STATE_LABELS[state] })),
            ]}
          />
          <DevToggle
            label="Tout afficher"
            checked={params.all}
            onChange={(all) => update({ all, type: all ? "tous" : params.type === "tous" ? "qcm4" : params.type, state: all ? "tous" : params.state === "tous" ? "repos" : params.state })}
          />
          <DevToggle
            label="Mouvement réduit"
            checked={params.reduced}
            onChange={(reduced) => update({ reduced })}
            title="Simulation depuis la page : framer-motion et animations CSS coupés. La vraie requête média est émulée par le script de captures."
          />
          <DevToggle label="Tablette" checked={params.tablet} onChange={(tablet) => update({ tablet })} title="La largeur d'une tablette (820 px), sans changer la fenêtre." />
          <DevToggle label="Lecteur CI" checked={params.reader} onChange={(reader) => update({ reader })} title="Le bouton qui lit la consigne, comme au CI et au CP (muet ici : rien n'est demandé au serveur)." />
          <DevToggle label="Barre" checked={params.bar} onChange={(bar) => update({ bar })} title="?barre=0 la cache pour les captures." />
          <DevButton onClick={() => setRound((current) => current + 1)}>Rejouer</DevButton>
          <Link href="/dev/seance/" className="min-h-9 rounded-md px-2 py-1.5 text-sm font-semibold text-amber-300 underline-offset-2 hover:underline">
            Séance factice
          </Link>
        </DevBar>
      )}

      <div className={params.tablet ? "mx-auto w-[820px] max-w-full" : undefined}>
        {single ? (
          <div className="relative mx-auto max-w-2xl pb-4">
            <SessionBar topic={specimens[params.type as Kind].exercise.topic} palierIndex={1} questionIndex={2} total={10} answered={params.state === "bonne"} />
            <StageCard
              key={`${params.type}-${params.state}-${params.reader}-${round}`}
              specimen={specimens[params.type as Kind]}
              state={params.state as StageState}
              reader={params.reader}
              fitScreen
            />
          </div>
        ) : (
          <div className="grid gap-6 pb-8 lg:grid-cols-2 2xl:grid-cols-3">
            {kinds.flatMap((kind) =>
              states.map((state) => (
                <section key={`${kind}-${state}`} className="min-w-0">
                  <p className="mb-2 truncate font-mono text-xs font-bold text-amber-950/70">
                    {kind} · {state}
                  </p>
                  <StageCard
                    key={`${kind}-${state}-${params.reader}-${round}`}
                    specimen={specimens[kind]}
                    state={state}
                    reader={params.reader}
                    fitScreen={false}
                  />
                </section>
              )),
            )}
          </div>
        )}
      </div>
    </SessionShell>
  );
}

const noop = () => {};
const tick = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Une carte d'exercice dans un état. Les états à geste naissent au repos, le
 * temps que l'écran soit rendu ; les touchers se jouent, puis l'état final se
 * pose. « Valider » reste vivant : la réponse est jugée par la règle du
 * serveur (`verifyAnswer`) et la carte passe en bonne ou en mauvaise réponse.
 */
function StageCard({
  specimen,
  state,
  reader,
  fitScreen,
}: {
  specimen: Specimen;
  state: StageState;
  reader: boolean;
  fitScreen: boolean;
}) {
  const arming = needsArming(state);
  const [live, setLive] = useState<StageState>(arming ? "repos" : state);
  const [ready, setReady] = useState(!arming);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!arming) return;
    let cancelled = false;
    (async () => {
      // L'écran doit être peint (le dessin sur quadrillage mesure sa place).
      await tick(120);
      if (cancelled || !rootRef.current) return;
      try {
        await armSpecimen(rootRef.current, specimen, state);
      } catch (error) {
        console.warn(`[galerie] geste impossible pour ${specimen.kind} / ${state}`, error);
      }
      await tick(80);
      if (cancelled) return;
      setLive(state);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [arming, specimen, state]);

  const disabled = live === "desactive" || live === "bonne" || live === "mauvaise";
  const isCorrect = live === "bonne" ? true : live === "mauvaise" ? false : null;
  const onSubmit = (answer: string) => setLive(verifyAnswer(specimen.exercise, answer) ? "bonne" : "mauvaise");

  const screen = (
    <Screen specimen={specimen} disabled={disabled} isCorrect={isCorrect} onSubmit={onSubmit} fitScreen={fitScreen} />
  );
  // Comme la séance : le lecteur de consigne entoure l'exercice d'un enfant
  // qui apprend à lire. Muet (`silenced`) : le bouton est là, rien ne part.
  const readsAloud = reader && isReadingLearnerClass(specimen.klass);

  return (
    <div ref={rootRef} data-specimen={specimen.kind} data-state={state} data-live={live} data-stage-ready={ready ? "1" : "0"}>
      <ExerciseCard cardKey={specimen.exercise.id}>
        {readsAloud ? (
          <PromptReaderProvider exerciseId={specimen.exercise.id} silenced>
            {screen}
          </PromptReaderProvider>
        ) : (
          screen
        )}
      </ExerciseCard>
    </div>
  );
}

/** L'aiguillage de la séance (`online-session.tsx`, `ExerciseRenderer`). */
function Screen({
  specimen,
  disabled,
  isCorrect,
  onSubmit,
  fitScreen,
}: {
  specimen: Specimen;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
  fitScreen: boolean;
}) {
  const { exercise, view } = specimen;
  const common = { prompt: exercise.prompt, disabled, isCorrect, onSubmit, onSkip: noop };
  switch (exercise.type) {
    case "qcm":
      return <QcmExercise {...common} payload={view as ComponentProps<typeof QcmExercise>["payload"]} />;
    case "short-answer":
      return <ShortAnswerExercise {...common} payload={view as ComponentProps<typeof ShortAnswerExercise>["payload"]} />;
    case "match":
      return <MatchExercise {...common} payload={view as ComponentProps<typeof MatchExercise>["payload"]} />;
    case "order":
      return <OrderExercise {...common} payload={view as ComponentProps<typeof OrderExercise>["payload"]} />;
    case "drag-drop":
      return <DragDropExercise {...common} payload={view as ComponentProps<typeof DragDropExercise>["payload"]} />;
    default:
      if (isGameScreenType(exercise.type)) {
        return <GameExercise {...common} type={exercise.type} payload={view} fitScreen={fitScreen} />;
      }
      return <p>Type d&apos;exercice non supporté</p>;
  }
}
