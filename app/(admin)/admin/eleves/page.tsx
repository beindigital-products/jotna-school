"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Users, Award, BookCheck, ChevronRight, Search } from "lucide-react";

import {
  Avatar,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  PageHeader,
  Pagination,
  usePagination,
} from "@/components/dashboard/ui";

/** Minuscules, sans accents : pour chercher « awa » dans « Àwa ». */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AdminStudentsPage() {
  const students = useQuery(api.students.listStudents);
  const [search, setSearch] = useState("");
  const needle = normalize(search.trim());
  const shown = (students ?? []).filter(
    (student) => !needle || normalize(student.name).includes(needle),
  );
  const pagination = usePagination(shown, needle);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Élèves"
        description="Suivez la progression de vos élèves"
      />

      {students === undefined ? (
        <LoadingBlock label="Chargement des élèves" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun élève"
          description="Les élèves apparaîtront ici une fois inscrits."
        />
      ) : (
        <>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <Input
            aria-label="Rechercher un élève"
            placeholder="Rechercher par nom"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-stone-600">
          {shown.length} élève{shown.length > 1 ? "s" : ""}
          {needle ? ` sur ${students.length}` : ""}
        </p>
        <ul className="space-y-3">
          {pagination.pageItems.map((student) => (
            <Card
              as="li"
              key={student._id}
              className="transition-colors hover:border-stone-300"
            >
              <Link
                href={`/admin/eleves/detail?id=${student._id}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-(--dash-strong) sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar name={student.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">
                      {student.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                      <span className="flex items-center gap-1">
                        <BookCheck className="h-3.5 w-3.5" aria-hidden />
                        {student.completedTopics} thème
                        {student.completedTopics !== 1 ? "s" : ""} complété
                        {student.completedTopics !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" aria-hidden />
                        {student.badgeCount} badge
                        {student.badgeCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-stone-400"
                  aria-hidden
                />
              </Link>
            </Card>
          ))}
        </ul>
        <Pagination pagination={pagination} label="élèves" />
        </>
      )}
    </div>
  );
}
