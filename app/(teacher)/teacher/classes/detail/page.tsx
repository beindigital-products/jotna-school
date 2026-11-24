"use client";

import { Suspense } from "react";
import { ClassDetail } from "@/components/classroom/class-detail";
import { LoadingBlock } from "@/components/dashboard/ui";
import { useIdParam } from "@/components/dashboard/use-id-param";

// `?id=` et non `[id]` : le site s'exporte aussi en statique pour
// l'application, qui n'a pas de routes dynamiques.
export default function TeacherClassDetailPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const id = useIdParam("id");
  return (
    <ClassDetail
      schoolClassId={id}
      backHref="/teacher/classes"
      studentHref={(studentId) => `/teacher/students/detail?id=${studentId}`}
    />
  );
}
