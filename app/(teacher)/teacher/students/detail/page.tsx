"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/dashboard/ui";
import { StudentOverview } from "@/components/dashboard/student-overview";
import { useIdParam } from "@/components/dashboard/use-id-param";

// `?id=` et non `[id]` : le site s'exporte aussi en statique pour
// l'application, qui n'a pas de routes dynamiques.
function StudentPage() {
  const studentId = useIdParam("id");
  return (
    <StudentOverview
      studentId={studentId}
      back={{ href: "/teacher/students", label: "Mes élèves" }}
      reportHref={(report) =>
        `/teacher/reports/detail?studentId=${report.studentId}&topicId=${report.topicId}`
      }
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <StudentPage />
    </Suspense>
  );
}
