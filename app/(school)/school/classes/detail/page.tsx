"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { ClassDetail } from "@/components/classroom/class-detail";

// `?id=` et non `[id]` : le site s'exporte aussi en statique pour
// l'application, qui n'a pas de routes dynamiques.
export default function SchoolClassDetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const id = useSearchParams().get("id");
  if (!id) return null;
  return (
    <ClassDetail
      schoolClassId={id as Id<"schoolClasses">}
      backHref="/school/dashboard"
    />
  );
}
