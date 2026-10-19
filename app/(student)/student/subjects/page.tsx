"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RotateCcw, Star, Lock, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { difficultyStage } from "@/convex/palierRules";
import { Pio } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";
import { LostTrail } from "@/components/student/game/lost-trail";
import { GameMap, type MapNodeContext } from "@/components/student/world/game-map";
import { TrailNode, type TrailNodeStatus } from "@/components/student/world/trail";
import { SUBJECT_TRAIL, trailNodePoint } from "@/components/student/world/trail-geometry";
import { subjectEmoji } from "@/lib/subjectIcons";
import { pioSays } from "@/lib/pioCopy";
import { useSubjectMap } from "@/hooks/use-student-data";

/**
 * LE SENTIER D'UN MONDE — les étapes d'une matière, façon niveaux de jeu,
 * sur la même carte zoomable que la carte du monde.
 *
 * UNE ÉTAPE EST UN PALIER, PAS UNE THÉMATIQUE. Une thématique compte de un à
 * dix paliers de dix exercices (`convex/palierRules.ts`), et c'est ce nombre
 * qui fait la longueur du sentier : le nom de la thématique est une plaque
 * posée sur son premier palier, ses paliers sont les nœuds qui suivent. Le
 * sentier est donc aussi long que le programme de l'enfant, pas plus.
 *
 * Franchi, en cours, ouvert, fermé se lisent à la couleur avant de lire le
 * nom. Pio se tient sur le palier en cours.
 *
 * TOUCHER UNE ÉTAPE NE LANCE PAS LA SÉANCE. Pio y marche, et à l'arrivée la
 * carte de l'étape se lève en bas du cadre, avec la thématique, le palier,
 * son niveau de difficulté et LE bouton d'action. Un doigt qui dérape sur le
 * sentier ne doit pas envoyer l'enfant dans un palier ; on confirme par un
 * second geste. Une étape fermée se contente de dire non de la tête : Pio
 * n'y va pas, mais sa carte explique comment l'ouvrir.
 *
 * La séance (`/student/topics/session`) reste inchangée : mode focus, sans
 * décor (G3). Le jeu s'arrête à la porte de l'exercice.
 */
type PalierNode = {
  key: string;
  topicId: string;
  topicName: string;
  topicDescription: string;
  /** Rang de la thématique dans la matière, à partir de 1. */
  topicPosition: number;
  topicStatus: TrailNodeStatus;
  palierIndex: number;
  palierCount: number;
  status: TrailNodeStatus;
  stars: number;
  firstOfTopic: boolean;
};

const SHAKE_MS = 480;

function SubjectTrailPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  // Calculé sur l'appareil : une étape validée sans réseau s'allume aussitôt.
  const map = useSubjectMap(id);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [shakingKey, setShakingKey] = useState<string | null>(null);

  if (map === undefined) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Pio state="think" size={160} />
        <p className="font-display text-lg font-bold text-amber-900/70">
          Je déroule le sentier...
        </p>
      </div>
    );
  }

  if (map === null) {
    return <LostTrail kind="world" />;
  }

  const { subject, topics, totalStars, totalPaliers, completedPaliers } = map;

  // Le sentier à plat : un nœud par palier, thématique après thématique.
  const nodes: PalierNode[] = topics.flatMap((topic, topicIdx) =>
    topic.paliers.map((palier, palierIdx) => ({
      key: `${topic._id}:${palier.index}`,
      topicId: topic._id,
      topicName: topic.name,
      topicDescription: topic.description,
      topicPosition: topicIdx + 1,
      topicStatus: topic.status,
      palierIndex: palier.index,
      palierCount: topic.palierCount,
      status: palier.status,
      stars: palier.stars,
      firstOfTopic: palierIdx === 0,
    })),
  );
  const count = nodes.length;
  const allDone = count > 0 && completedPaliers >= totalPaliers;
  const currentIndex = nodes.findIndex(
    (n) => n.status === "in_progress" || n.status === "available",
  );
  // Tout est franchi : Pio fête ça devant le trésor, au bout du sentier.
  const pioStart = allDone ? count : currentIndex === -1 ? Math.max(0, count - 1) : currentIndex;

  // Par défaut, l'étape en cours est sélectionnée : sa carte est celle que
  // l'enfant veut voir en arrivant. DÉRIVÉE, pas posée dans un effet : tant
  // qu'il n'a rien touché, la sélection suit l'étape courante ; dès qu'il
  // touche, c'est lui qui choisit. Aucun rendu en cascade.
  const currentKey = currentIndex >= 0 ? nodes[currentIndex].key : null;
  const effectiveSelectedKey = selectedKey ?? currentKey;
  const selected = nodes.find((n) => n.key === effectiveSelectedKey) ?? null;

  function onArrive(index: number) {
    const node = nodes[index];
    if (node) setSelectedKey(node.key);
  }

  function poseAt(index: number) {
    if (index >= count) return "cheer" as const;
    return nodes[index]?.status === "completed" ? ("cheer" as const) : ("hello" as const);
  }

  function renderNode(ctx: MapNodeContext) {
    const node = nodes[ctx.index];
    const locked = node.status === "locked";
    return (
      <div key={node.key}>
        {node.firstOfTopic && (
          <TopicPlate x={ctx.x} y={ctx.y} position={node.topicPosition} name={node.topicName} />
        )}
        <TrailNode
          x={ctx.x}
          y={ctx.y}
          index={node.palierIndex - 1}
          status={node.status}
          stars={node.stars}
          label={`${node.topicName}, palier ${node.palierIndex} sur ${node.palierCount}`}
          selected={node.key === effectiveSelectedKey}
          shaking={shakingKey === node.key}
          onSelect={() => {
            if (locked) {
              setSelectedKey(node.key);
              setShakingKey(node.key);
              window.setTimeout(() => setShakingKey(null), SHAKE_MS);
              return;
            }
            ctx.walkTo();
          }}
        />
      </div>
    );
  }

  const controlDepth = { "--btn-depth": "#c9a35a" } as React.CSSProperties;

  return (
    <div>
      {count === 0 ? (
        <div className="space-y-4 px-4 pt-2 sm:px-0">
          <SubjectBanner
            name={subject.name}
            icon={subject.icon}
            color={subject.color}
            done={completedPaliers}
            count={totalPaliers}
            stars={totalStars}
          />
          <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/60 p-10 text-center">
            <p className="font-display text-lg font-bold text-amber-900">
              Aucune étape pour le moment.
            </p>
          </div>
        </div>
      ) : (
        <GameMap
          layout={SUBJECT_TRAIL}
          count={count}
          tailPoints={1}
          initialPioIndex={pioStart}
          currentIndex={currentIndex === -1 ? (allDone ? count : null) : currentIndex}
          onArrive={onArrive}
          poseAt={poseAt}
          renderNode={renderNode}
          pioSize={94}
          className="h-[calc(100dvh-16rem)] min-h-[460px] sm:mt-1 sm:h-[calc(100dvh-11rem)] sm:max-h-[880px] sm:rounded-[2rem] sm:shadow-2xl"
          worldExtras={<TreasureMark index={count} unlocked={allDone} />}
          hud={
            <>
              {/* ── En-tête du monde, collé au cadre ─────────────────────── */}
              <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-5rem)] items-center gap-2">
                <Link
                  href="/student/map"
                  aria-label="Retour à la carte du monde"
                  className="btn-chunky pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-50 to-amber-200 text-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
                  style={controlDepth}
                >
                  <ArrowLeft className="h-6 w-6" strokeWidth={3} aria-hidden />
                </Link>
                <SubjectBanner
                  name={subject.name}
                  icon={subject.icon}
                  color={subject.color}
                  done={completedPaliers}
                  count={totalPaliers}
                  stars={totalStars}
                  compact
                />
              </div>

              {/* ── La carte de l'étape où Pio vient d'arriver ───────────── */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
                <AnimatePresence mode="wait">
                  {selected && (
                    <motion.div
                      key={selected.key}
                      className="pointer-events-auto mx-auto max-w-lg"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 40 }}
                      transition={{ duration: 0.22 }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <StepCard node={selected} subjectColor={subject.color} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}

/** Le nom de la thématique, sur une plaque au-dessus de son premier palier. */
function TopicPlate({ x, y, position, name }: { x: number; y: number; position: number; name: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 -translate-x-1/2"
      style={{ left: x, top: y - 96 }}
    >
      <span className="flex max-w-[250px] items-center gap-2 rounded-full border-[3px] border-white bg-amber-950 py-1.5 pl-1.5 pr-4 font-display text-sm font-extrabold text-white shadow-lg">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
          {position}
        </span>
        <span className="truncate">{name}</span>
      </span>
    </div>
  );
}

function SubjectBanner({
  name,
  icon,
  color,
  done,
  count,
  stars,
  compact = false,
}: {
  name: string;
  icon: string;
  color: string;
  done: number;
  count: number;
  stars: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`pointer-events-auto flex min-w-0 items-center gap-2.5 border-[3px] border-white text-white shadow-lg ${
        compact ? "rounded-full py-1 pl-1.5 pr-4" : "rounded-3xl p-4"
      }`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-white/25 shadow-inner ${
          compact ? "h-9 w-9 text-xl" : "h-14 w-14 text-3xl"
        }`}
      >
        {subjectEmoji(icon)}
      </span>
      <div className="min-w-0">
        <h1 className={`text-outline truncate font-display font-extrabold leading-tight ${compact ? "text-lg" : "text-2xl"}`}>
          {name}
        </h1>
        <p className="font-display text-xs font-bold opacity-95">
          {done}/{count} étape{count > 1 ? "s" : ""}
          {stars > 0 && (
            <>
              {" · "}
              <Star className="-mt-0.5 inline h-3.5 w-3.5 fill-yellow-300 text-yellow-300" aria-hidden />{" "}
              {stars}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function TreasureMark({ index, unlocked }: { index: number; unlocked: boolean }) {
  const { x, y } = trailNodePoint(index, SUBJECT_TRAIL);
  return (
    <div
      aria-hidden
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <div
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-white shadow-lg ${
          unlocked
            ? "bg-gradient-to-b from-yellow-300 to-amber-500 animate-[float-slow_2.4s_ease-in-out_infinite]"
            : "bg-gradient-to-b from-amber-700 to-amber-900 opacity-90"
        }`}
      >
        <Trophy className={`h-9 w-9 ${unlocked ? "text-white" : "text-amber-300"}`} />
      </div>
    </div>
  );
}

function StepCard({ node, subjectColor }: { node: PalierNode; subjectColor: string }) {
  const isLocked = node.status === "locked";
  const isDone = node.status === "completed";
  const isCurrent = node.status === "in_progress";
  const stage = pioSays.stage[difficultyStage(node.palierIndex, node.palierCount)];
  const sessionHref = `/student/topics/session?id=${node.topicId}&palier=${node.palierIndex}`;
  const lockedHint =
    node.topicStatus === "locked" ? pioSays.trailLockedHint : pioSays.palierLockedHint;

  return (
    <div
      className="rounded-3xl border-[3px] bg-white/95 p-4 shadow-xl backdrop-blur"
      style={{ borderColor: isLocked ? "#e5e7eb" : subjectColor }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold text-white"
          style={{ backgroundColor: isLocked ? "#9ca3af" : subjectColor }}
        >
          {isLocked ? <Lock className="h-5 w-5" aria-hidden /> : isDone ? "✓" : node.palierIndex}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-display text-xs font-extrabold uppercase tracking-wide"
            style={{ color: isLocked ? "#6b7280" : subjectColor }}
          >
            {node.topicName}
          </p>
          <h2 className="font-display text-lg font-extrabold leading-tight text-amber-950">
            Palier {node.palierIndex}/{node.palierCount} · {stage}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-amber-900/80">{node.topicDescription}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 font-display text-xs font-bold">
            {isDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-800">
                Franchi
                {node.stars > 0 && (
                  <>
                    {" · "}
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden /> {node.stars}
                  </>
                )}
              </span>
            )}
            {isCurrent && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">
                En cours
              </span>
            )}
            {node.status === "available" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
                {pioSays.trailCurrent}
              </span>
            )}
            {isLocked && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                {lockedHint}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isLocked && (
        <div className="mt-3">
          <GameButton
            href={sessionHref}
            tone={isDone ? "white" : "green"}
            size="lg"
            className="w-full"
            icon={isDone ? <RotateCcw className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5 fill-current" aria-hidden />}
            ariaLabel={
              isDone
                ? `Revoir ${node.topicName}, palier ${node.palierIndex}`
                : isCurrent
                  ? `Continuer ${node.topicName}, palier ${node.palierIndex}`
                  : `Commencer ${node.topicName}, palier ${node.palierIndex}`
            }
          >
            {isDone ? "Revoir l'étape" : isCurrent ? "Continuer" : "C'est parti !"}
          </GameButton>
        </div>
      )}
    </div>
  );
}

export default function SubjectTrailPage() {
  return (
    <Suspense fallback={null}>
      <SubjectTrailPageInner />
    </Suspense>
  );
}
