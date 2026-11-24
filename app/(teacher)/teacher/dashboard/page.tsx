"use client";

import { useQuery } from "convex/react";
import {
  CheckCircle2,
  FileBarChart,
  FileText,
  PenTool,
  Plus,
  School,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SectionTitle,
  StatCard,
  formatDayTime,
} from "@/components/dashboard/ui";

/**
 * TABLEAU DE BORD DU PROFESSEUR : ses chiffres, ses raccourcis et les
 * dernières réponses de ses élèves. Sans classe, la page donne la première
 * étape.
 */
export default function TeacherDashboardPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const myClasses = useQuery(api.classrooms.myClasses);
  const students = useQuery(api.profiles.getTeacherStudents);
  const exercises = useQuery(api.exercises.listByTeacher);
  const reports = useQuery(api.reports.listByTeacher);
  const recentAttempts = useQuery(api.attempts.listByTeacherStudents, {
    limit: 8,
  });
  const invitations = useQuery(api.schoolInvitations.mine);

  if (!profile) return <LoadingBlock />;

  const classCount = myClasses?.classes.length;
  const firstName = profile.name.trim().split(/\s+/)[0] ?? "";
  const publishedCount = exercises?.filter((e) => e.status === "published").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Bonjour, ${firstName}` : "Bonjour"}
        description="Vos classes, vos élèves et leurs derniers résultats."
      />

      {invitations && invitations.length > 0 && (
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-900">
              {invitations.length > 1
                ? `${invitations.length} écoles vous invitent à les rejoindre`
                : `${invitations[0].schoolName} vous invite à la rejoindre`}
            </p>
            <p className="text-sm text-stone-600">
              Acceptez ou refusez depuis la page « Mes classes ».
            </p>
          </div>
          <ButtonLink href="/teacher/classes">Voir l&apos;invitation</ButtonLink>
        </Card>
      )}

      {classCount === 0 && (
        <Card className="p-5">
          <CardTitle
            icon={School}
            description="Ensuite, créez les comptes de vos élèves ou ajoutez-les avec le code élève que donnent leurs parents. Chaque élève se connecte dans l'application avec son code."
          >
            Première étape : créez votre classe
          </CardTitle>
          <ButtonLink href="/teacher/classes" className="mt-4">
            <Plus className="h-4 w-4" aria-hidden />
            Créer une classe
          </ButtonLink>
        </Card>
      )}

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={School} label="Classes" value={classCount ?? "—"} />
        <StatCard icon={Users} label="Élèves" value={students?.length ?? "—"} />
        <StatCard icon={FileBarChart} label="Rapports" value={reports?.length ?? "—"} />
        <StatCard
          icon={PenTool}
          label="Exercices"
          value={publishedCount ?? "—"}
        />
      </section>

      <section aria-label="Raccourcis" className="flex flex-wrap gap-2">
        <ButtonLink href="/teacher/classes">
          <Users className="h-4 w-4" aria-hidden />
          Gérer mes classes
        </ButtonLink>
        <ButtonLink href="/teacher/pdf-uploads" variant="secondary">
          <FileText className="h-4 w-4" aria-hidden />
          Importer une fiche PDF
        </ButtonLink>
        <ButtonLink href="/teacher/reports" variant="secondary">
          <FileBarChart className="h-4 w-4" aria-hidden />
          Voir les rapports
        </ButtonLink>
      </section>

      <section className="space-y-3">
        <SectionTitle>Dernières réponses de vos élèves</SectionTitle>
        {recentAttempts === undefined ? (
          <LoadingBlock />
        ) : recentAttempts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Aucune réponse pour le moment"
            description="Les réponses de vos élèves s'affichent ici dès qu'ils jouent dans l'application."
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-stone-100">
              {recentAttempts.map((attempt) => (
                <li key={attempt._id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  {attempt.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium text-stone-900">
                      <span className="sr-only">
                        {attempt.isCorrect ? "Bonne réponse de " : "Mauvaise réponse de "}
                      </span>
                      {attempt.studentName}
                    </p>
                    <p className="line-clamp-2 text-stone-600">
                      {[attempt.topicName, attempt.exercisePrompt]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDayTime(attempt.submittedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
