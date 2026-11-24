"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/dashboard/ui";
import { ReportDetail } from "@/components/dashboard/report-views";
import { useIdParam } from "@/components/dashboard/use-id-param";

function ReportPage() {
  const studentId = useIdParam("studentId");
  const topicId = useIdParam("topicId");
  return (
    <ReportDetail
      studentId={studentId}
      topicId={topicId}
      back={{
        href: studentId ? `/teacher/students/detail?id=${studentId}` : "/teacher/reports",
        label: studentId ? "Fiche de l'élève" : "Rapports",
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ReportPage />
    </Suspense>
  );
}
