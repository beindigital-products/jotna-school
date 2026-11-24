"use client";

/**
 * LES RAPPORTS, pour le parent comme pour le professeur : la liste et le
 * détail. Les deux espaces recopiaient les mêmes écrans.
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileBarChart,
  Mail,
  Star,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  ScorePill,
  formatDay,
  scoreTone,
} from "./ui";
import { cn } from "@/lib/utils";

export type ReportRow = {
  _id: string;
  _creationTime: number;
  studentId: string;
  topicId: string;
  score: number;
  topicName: string;
  subjectName: string;
  studentName?: string;
};

export function toPercent(score: number): number {
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}

export function ReportList({
  reports,
  hrefFor,
  emptyHint,
}: {
  reports: ReportRow[];
  hrefFor: (report: ReportRow) => string;
  emptyHint: string;
}) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="Aucun rapport pour le moment"
        description={emptyHint}
      />
    );
  }
  return (
    <Card as="div" className="overflow-hidden">
      <ul className="divide-y divide-stone-100">
        {reports.map((report) => (
          <li key={report._id}>
            <Link
              href={hrefFor(report)}
              className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong)"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-900">
                  {report.topicName}
                </p>
                <p className="truncate text-sm text-stone-600">
                  {[report.studentName, report.subjectName, formatDay(report._creationTime)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ScorePill percent={toPercent(report.score)} />
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PointList({
  title,
  icon: Icon,
  iconClass,
  items,
  empty,
  quoted = false,
}: {
  title: string;
  icon: typeof CheckCircle2;
  iconClass: string;
  items: string[];
  empty: string;
  quoted?: boolean;
}) {
  return (
    <Card as="section" className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-stone-900">
        <Icon className={cn("h-5 w-5", iconClass)} aria-hidden />
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-stone-800">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />
              <span className={cn("min-w-0 break-words", quoted && "italic")}>
                {quoted ? `« ${item} »` : item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">{empty}</p>
      )}
    </Card>
  );
}

export function ReportDetail({
  studentId,
  topicId,
  back,
}: {
  studentId: string | null;
  topicId: string | null;
  back: { href: string; label: string };
}) {
  const reports = useQuery(
    api.reports.listByStudent,
    studentId ? { studentId: studentId as Id<"profiles"> } : "skip",
  );

  if (studentId && reports === undefined) return <LoadingBlock />;

  const report = reports?.find((r) => r.topicId === topicId);

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport" back={back} />
        <EmptyState
          icon={FileBarChart}
          title="Rapport introuvable"
          description="Ce rapport n'existe pas, ou vous n'y avez pas accès."
        />
      </div>
    );
  }

  const percent = toPercent(report.score);
  const tone = scoreTone(percent);
  const stars = percent >= 80 ? 3 : percent >= 50 ? 2 : 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={report.topicName}
        description={report.subjectName}
        back={back}
      />

      <Card className="p-6 text-center">
        <p className="text-sm font-medium text-stone-600">Note</p>
        <p className={cn("mt-1 text-5xl font-bold tabular-nums", tone.text)}>
          {percent} %
        </p>
        <p className="mt-1 text-sm font-semibold text-stone-700">{tone.word}</p>
        <div
          className="mt-3 flex justify-center gap-1"
          role="img"
          aria-label={`${stars} étoile${stars > 1 ? "s" : ""} sur 3`}
        >
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              aria-hidden
              className={cn(
                "h-7 w-7",
                i < stars ? "fill-amber-400 text-amber-400" : "text-stone-200",
              )}
            />
          ))}
        </div>
      </Card>

      <PointList
        title="Points forts"
        icon={CheckCircle2}
        iconClass="text-emerald-600"
        items={report.strengths}
        empty="Aucun point fort relevé pour le moment."
      />
      <PointList
        title="Points à améliorer"
        icon={AlertTriangle}
        iconClass="text-amber-600"
        items={report.weaknesses}
        empty="Aucune difficulté relevée."
      />
      <PointList
        title="Erreurs fréquentes"
        icon={XCircle}
        iconClass="text-red-600"
        items={report.frequentMistakes}
        empty="Aucune erreur fréquente."
        quoted
      />

      <Card className="flex flex-wrap gap-x-6 gap-y-2 p-5 text-sm text-stone-700">
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-stone-500" aria-hidden />
          Rapport du {formatDay(report._creationTime)}
        </span>
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-stone-500" aria-hidden />
          {report.emailSentAt
            ? `Envoyé par e-mail le ${formatDay(report.emailSentAt)}`
            : "Non envoyé par e-mail"}
        </span>
      </Card>
    </div>
  );
}
