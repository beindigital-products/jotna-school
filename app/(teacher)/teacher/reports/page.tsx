"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoadingBlock, PageHeader } from "@/components/dashboard/ui";
import { ReportList } from "@/components/dashboard/report-views";

export default function ReportsPage() {
  const reports = useQuery(api.reports.listByTeacher);

  return (
    <div className="space-y-6">
      <PageHeader title="Rapports" description="Un rapport par élève et par thématique terminée." />
      {reports === undefined ? (
        <LoadingBlock />
      ) : (
        <ReportList
          reports={reports}
          hrefFor={(report) =>
            `/teacher/reports/detail?studentId=${report.studentId}&topicId=${report.topicId}`
          }
          emptyHint="Un rapport est créé chaque fois qu'un de vos élèves termine une thématique."
        />
      )}
    </div>
  );
}
