"use client";

/**
 * TOUS LES COMPTES DE LA PLATEFORME, par rôle : parents, professeurs, écoles,
 * élèves et équipe. Recherche par nom ou adresse, dans ce qui est chargé.
 *
 * Données : `adminConsole.listAccounts`, gardée côté serveur (`admin` seul).
 * Un élève n'affiche jamais son code de connexion, qui est aussi son mot de
 * passe.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ChevronRight, Download, Search, UserCog } from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  Avatar,
  Button,
  Card,
  ChoiceTabs,
  EmptyState,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  formatDay,
  usePagination,
} from "@/components/dashboard/ui";
import { downloadCsv } from "@/components/admin/console-ui";

type Role = "parent" | "professeur" | "directeur" | "student" | "admin";

const TABS: { value: Role; label: string }[] = [
  { value: "parent", label: "Parents" },
  { value: "professeur", label: "Professeurs" },
  { value: "directeur", label: "Écoles" },
  { value: "student", label: "Élèves" },
  { value: "admin", label: "Équipe" },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function AccountList({ role }: { role: Role }) {
  const data = useQuery(api.adminConsole.listAccounts, { role });
  const [search, setSearch] = useState("");

  const needle = normalize(search.trim());
  const accounts = data?.accounts ?? [];
  const rows = needle
    ? accounts.filter((row) =>
        normalize(`${row.name} ${row.email ?? ""} ${row.details.join(" ")}`).includes(
          needle,
        ),
      )
    : accounts;
  const pagination = usePagination(rows, needle);

  if (data === undefined) return <LoadingBlock label="Chargement des comptes" />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <Input
          aria-label="Rechercher un compte"
          placeholder="Rechercher par nom, adresse ou école"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600">
          {rows.length} compte{rows.length > 1 ? "s" : ""}
          {needle ? ` sur ${data.accounts.length}` : ""}
        </p>
        {rows.length > 0 && (
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `comptes-${role}.csv`,
                ["Nom", "E-mail", "Détails", "Inscrit le"],
                rows.map((row) => [
                  row.name,
                  row.email ?? "",
                  row.details.join(", "),
                  formatDay(row.createdAt),
                ]),
              )
            }
          >
            <Download className="h-4 w-4" aria-hidden />
            Exporter en CSV
          </Button>
        )}
      </div>

      {data.truncated && (
        <Notice tone="warning">
          Seuls les comptes les plus récents sont chargés. La recherche ne porte
          que sur eux.
        </Notice>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={needle ? "Aucun compte ne correspond" : "Aucun compte pour l'instant"}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {pagination.pageItems.map((row) => {
              const content = (
                <>
                  <Avatar name={row.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{row.name}</p>
                    <p className="truncate text-sm text-stone-600">
                      {[row.email, ...row.details].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="hidden shrink-0 text-xs text-stone-500 sm:block">
                    Inscrit le {formatDay(row.createdAt)}
                  </p>
                  {row.href && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                  )}
                </>
              );
              return (
                <li key={row.id}>
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="flex min-h-14 items-center gap-3 px-4 py-2 outline-none hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong)"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <Pagination pagination={pagination} label="comptes" />
    </div>
  );
}

export default function AdminAccountsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Comptes"
        description="Tous les comptes de la plateforme, du plus récent au plus ancien."
      />
      <ChoiceTabs
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          content: <AccountList role={tab.value} />,
        }))}
      />
    </div>
  );
}
