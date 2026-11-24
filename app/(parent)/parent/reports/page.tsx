"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoadingBlock, PageHeader } from "@/components/dashboard/ui";
import { ReportList } from "@/components/dashboard/report-views";

export default function ReportsPage() {
  const reports = useQuery(api.reports.listByParent);

  return (
    <div className="space-y-6">
      <PageHeader title="Rapports" description="Un rapport par thématique terminée : la note, les points forts et ce qu'il reste à revoir." />
      {reports === undefined ? (
        <LoadingBlock />
      ) : (
        <ReportList
          reports={reports}
          hrefFor={(report) =>
            `/parent/children/reports?id=${report.studentId}&topicId=${report.topicId}`
          }
          emptyHint="Un rapport est créé chaque fois qu'un de vos enfants termine une thématique."
        />
      )}
    </div>
  );
}
