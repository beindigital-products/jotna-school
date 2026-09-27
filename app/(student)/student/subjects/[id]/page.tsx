"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Play,
  ChevronRight,
  Star,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Id } from "@/convex/_generated/dataModel";

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export default function SubjectTopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const map = useQuery(api.students.getStudentSubjectMap, {
    subjectId: id as Id<"subjects">,
  });

  if (map === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement de l&apos;aventure...</span>
      </div>
    );
  }

  if (map === null) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-display text-xl font-semibold text-gray-900">
          Matière introuvable
        </h2>
        <Link
          href="/student/home"
          className="mt-4 inline-flex items-center gap-2 text-orange-600 hover:text-orange-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const { subject, topics, totalStarsApprox, studentClass } = map;
  const completedTopics = topics.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/student/home"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour aux matières
      </Link>

      {/* Subject hero header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8"
        style={{ backgroundColor: subject.color }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            {subject.name}
          </h1>
          {/* D10 — le niveau qui a filtré ce parcours, fourni par l'école. */}
          {studentClass && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow-sm"
              style={{ color: subject.color }}
              aria-label={`Programme ${studentClass}`}
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              {studentClass}
            </span>
          )}
        </div>
        <p className="mt-1 text-base opacity-95 sm:text-lg">
          {topics.length} thématique{topics.length !== 1 ? "s" : ""} ·{" "}
          {completedTopics}/{topics.length} validée
          {completedTopics !== 1 ? "s" : ""}
        </p>

        {totalStarsApprox > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" aria-hidden />
            <span className="text-sm font-bold">{totalStarsApprox} étoiles</span>
          </div>
        )}
      </motion.div>

      {/* Sans classe renseignée, tout l'élémentaire s'affiche : on le dit. */}
      {!studentClass && topics.length > 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ta classe n&apos;est pas encore renseignée par ton école : voici
          toutes les thématiques. Dès qu&apos;elle le sera, tu ne verras que
          celles de ton niveau.
        </p>
      )}

      {/* Sentier — vertical path with connector */}
      {topics.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Aucune thématique disponible pour le moment.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 pl-0">
          {/* Vertical connector line behind the stations */}
          <div
            className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-200 via-orange-200 to-amber-100"
            aria-hidden
          />

          {topics.map((topic, idx) => (
            <Station
              key={topic._id}
              topic={topic}
              subjectColor={subject.color}
              index={idx}
              isLast={idx === topics.length - 1}
            />
          ))}

          {/* Treasure marker at the end of the path (motivational anchor) */}
          {completedTopics > 0 && completedTopics < topics.length && (
            <li className="relative ml-2 mt-6 flex items-center gap-4 text-sm font-semibold text-gray-500">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-amber-50">
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
              </div>
              <span>Termine toutes les thématiques pour gagner un trésor.</span>
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

function Station({
  topic,
  subjectColor,
  index,
  isLast,
}: {
  topic: {
    _id: string;
    name: string;
    description: string;
    status: TopicStatus;
    validatedPaliers: number;
    nextPalierIndex: number;
    starsApprox: number;
    completedExercises: number;
  };
  subjectColor: string;
  index: number;
  isLast: boolean;
}) {
  const status = topic.status;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="relative flex items-stretch gap-4"
    >
      {/* Status circle (also serves as visual on the path) */}
      <div
        className={`relative z-10 flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border-4 shadow-sm ${
          isCompleted
            ? "border-green-300 bg-green-500 text-white"
            : isInProgress
              ? "border-orange-300 bg-white text-orange-600"
              : isLocked
                ? "border-gray-200 bg-gray-100 text-gray-400"
                : "border-orange-200 bg-orange-400 text-white"
        }`}
        aria-hidden
      >
        {isCompleted ? (
          <Check className="h-7 w-7" strokeWidth={3} />
        ) : isInProgress ? (
          <span
            className="font-display text-xl font-extrabold"
            style={{ color: subjectColor }}
          >
            {index + 1}
          </span>
        ) : isLocked ? (
          <Lock className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 fill-white" />
        )}

        {/* In-progress ring overlay */}
        {isInProgress && topic.validatedPaliers > 0 && (
          <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
            {topic.starsApprox}
          </span>
        )}
      </div>

      {/* Card body. min-w-0 : sans lui, la carte refuse de rétrécir et pousse
          le bouton hors écran à 375 px. Sur mobile, le bouton passe sous le texte. */}
      <div
        className={`flex min-w-0 flex-1 flex-col items-stretch gap-3 rounded-2xl border-2 p-4 transition-all sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
          isLocked
            ? "border-gray-100 bg-white/60 opacity-70"
            : isCompleted
              ? "border-green-200 bg-white shadow-sm"
              : "border-orange-200 bg-white shadow-sm hover:shadow-md"
        }`}
      >
        <div className="min-w-0 flex-1">
          <h3
            className={`font-display text-lg font-extrabold sm:text-xl ${
              isLocked ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {topic.name}
          </h3>
          <p
            className={`mt-0.5 line-clamp-2 text-sm ${
              isLocked ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {topic.description}
          </p>

          {/* Status meta */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {isCompleted && topic.starsApprox > 0 && (
              <StarBadge count={topic.starsApprox} />
            )}
            {isInProgress && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                Palier {topic.nextPalierIndex} en cours
              </span>
            )}
            {!isLocked && !isInProgress && !isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                Palier 1
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-gray-400">
                Termine la thématique précédente pour débloquer
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {!isLocked && (
          <Link
            href={`/student/topics/${topic._id}/session?palier=${topic.nextPalierIndex}`}
            className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95 sm:text-base"
            aria-label={
              isCompleted
                ? `Revoir ${topic.name}`
                : isInProgress
                  ? `Continuer ${topic.name}, palier ${topic.nextPalierIndex}`
                  : `Commencer ${topic.name}`
            }
          >
            <span>
              {isCompleted ? "Revoir" : isInProgress ? "Continuer" : "Commencer"}
            </span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {/* Spacing under last station so the connector doesn't extend past */}
      {isLast && <span className="sr-only">Dernière thématique</span>}
    </motion.li>
  );
}

function StarBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800"
      aria-label={`${count} étoiles`}
    >
      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden />
      <span>{count}</span>
    </span>
  );
}
