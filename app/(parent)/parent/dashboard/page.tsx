"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  ListChecks,
  Plus,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Avatar,
  ButtonLink,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SectionTitle,
} from "@/components/dashboard/ui";
import { ReportList } from "@/components/dashboard/report-views";
import { formatDuration } from "@/components/dashboard/student-overview";

/**
 * TABLEAU DE BORD DU PARENT : chaque enfant avec ses chiffres, puis les
 * derniers rapports. Sans enfant, la page donne la première étape.
 */
export default function ParentDashboardPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const children = useQuery(api.family.myChildren);
  const reports = useQuery(api.reports.listByParent);

  if (!profile || children === undefined) return <LoadingBlock />;

  const kids = children ?? [];
  const firstName = profile.name.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Bonjour, ${firstName}` : "Bonjour"}
        description="Où en sont vos enfants cette semaine."
        actions={
          kids.length > 0 ? (
            <ButtonLink href="/parent/children" variant="secondary">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un enfant
            </ButtonLink>
          ) : undefined
        }
      />

      {kids.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Commencez par créer le compte de votre enfant"
          description="Il reçoit un code pour se connecter dans l'application Jotna School. Ses progrès s'affichent ensuite ici."
          action={
            <ButtonLink href="/parent/children">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un enfant
            </ButtonLink>
          }
        />
      ) : (
        <section className="space-y-3">
          <SectionTitle>Mes enfants</SectionTitle>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kids.map((child) => (
              <ChildSummary key={child._id} child={child} />
            ))}
          </ul>
        </section>
      )}

      {kids.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            action={
              reports && reports.length > 3 ? (
                <Link
                  href="/parent/reports"
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-(--dash-strong) outline-none hover:underline focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                >
                  Tous les rapports
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : undefined
            }
          >
            Derniers rapports
          </SectionTitle>
          {reports === undefined ? (
            <LoadingBlock />
          ) : (
            <ReportList
              reports={reports.slice(0, 3)}
              hrefFor={(report) =>
                `/parent/children/reports?id=${report.studentId}&topicId=${report.topicId}`
              }
              emptyHint="Un rapport est créé chaque fois qu'un de vos enfants termine une thématique."
            />
          )}
        </section>
      )}
    </div>
  );
}

function ChildSummary({
  child,
}: {
  child: {
    _id: Id<"profiles">;
    name: string;
    avatar: string | null;
    level: string | null;
    classroom: { name: string; schoolName: string | null } | null;
  };
}) {
  const stats = useQuery(api.students.getStudentStats, { studentId: child._id });

  const figures = [
    { icon: BookOpen, label: "Exercices", value: stats?.totalExercises },
    { icon: ListChecks, label: "Thématiques", value: stats?.completedTopics },
    { icon: Award, label: "Badges", value: stats?.badgeCount },
    {
      icon: Clock,
      label: "Temps",
      value: stats ? formatDuration(stats.totalTimeMs) : undefined,
    },
  ];

  return (
    <Card as="li" className="flex flex-col p-5">
      <div className="flex items-center gap-3">
        <Avatar name={child.name} src={child.avatar} />
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-stone-900">{child.name}</h3>
          <p className="text-sm text-stone-600">
            {child.classroom
              ? [child.classroom.name, child.classroom.schoolName]
                  .filter(Boolean)
                  .join(" · ")
              : (child.level ?? "Classe à choisir")}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        {figures.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-stone-50 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-stone-600">
              <Icon className="h-3.5 w-3.5 text-(--dash-strong)" aria-hidden />
              {label}
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-stone-900">
              {value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>

      <ButtonLink
        href={`/parent/children/progress?id=${child._id}`}
        variant="secondary"
        className="mt-4 w-full"
      >
        Voir la progression
        <ArrowRight className="h-4 w-4" aria-hidden />
      </ButtonLink>
    </Card>
  );
}
