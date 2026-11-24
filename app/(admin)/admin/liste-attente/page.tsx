"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Download, Hourglass } from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  usePagination,
} from "@/components/dashboard/ui";
import { StatusPill } from "@/components/admin/console-ui";

type WaitlistRow = FunctionReturnType<
  typeof api.waitlist.list
>["entries"][number];

const AUDIENCE_LABEL: Record<WaitlistRow["audience"], string> = {
  ecole: "École",
  parent: "Parent",
  professeur: "Professeur",
};

/** « 5 octobre 2026 ». */
function formatDay(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(timestamp);
}

/**
 * Une cellule CSV : toujours entre guillemets, les guillemets intérieurs
 * doublés.
 *
 * LES ADRESSES VIENNENT D'UN FORMULAIRE PUBLIC, donc de n'importe qui. Une
 * valeur qui commence par = + - ou @ serait lue comme une formule par le
 * tableur qui ouvre le fichier ; l'apostrophe en tête la garde pour du texte.
 */
function csvCell(value: string): string {
  const inert = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${inert.replace(/"/g, '""')}"`;
}

/**
 * Télécharge la liste au format CSV.
 *
 * POINT-VIRGULE et non virgule : c'est le séparateur qu'attend un tableur
 * réglé en français, qui mettrait sinon chaque ligne dans une seule colonne.
 * La marque d'ordre des octets en tête fait lire l'UTF-8 à Excel, sans quoi
 * « École » s'afficherait mal.
 */
function downloadCsv(entries: WaitlistRow[]) {
  const rows = [
    ["Adresse", "Profil", "Inscription"],
    ...entries.map((entry) => [
      entry.email,
      AUDIENCE_LABEL[entry.audience],
      new Date(entry.createdAt).toISOString().slice(0, 10),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const byteOrderMark = String.fromCharCode(0xfeff);
  const blob = new Blob([byteOrderMark + csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "liste-attente-jotna.csv";
  link.click();
  // Révoquée plus tard, pas tout de suite : certains navigateurs lisent l'URL
  // après le clic, et un téléchargement dont la source a disparu échoue.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function AdminWaitlistPage() {
  const data = useQuery(api.waitlist.list);
  const pagination = usePagination(data?.entries ?? []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Liste d'attente"
        description="Les visiteurs à prévenir de l'ouverture des ventes, à la rentrée 2027-2028."
        actions={
          data !== undefined &&
          data.entries.length > 0 && (
            <Button variant="secondary" onClick={() => downloadCsv(data.entries)}>
              <Download className="h-4 w-4" aria-hidden />
              Exporter en CSV
            </Button>
          )
        }
      />

      {data === undefined ? (
        <LoadingBlock label="Chargement de la liste" />
      ) : data.entries.length === 0 ? (
        <EmptyState
          icon={Hourglass}
          title="Personne pour l'instant"
          description="Les inscriptions faites depuis la page d'accueil apparaîtront ici."
        />
      ) : (
        <>
          <p className="text-sm text-stone-600">
            {data.entries.length} inscription
            {data.entries.length > 1 ? "s" : ""}
          </p>

          {data.truncated && (
            <Notice tone="warning">
              La liste dépasse ce que cet écran affiche : seules les
              inscriptions les plus récentes sont visibles et exportées.
            </Notice>
          )}

          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-xs text-stone-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Adresse
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Profil
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {pagination.pageItems.map((entry) => (
                  <tr key={entry.id}>
                    <td className="break-all px-4 py-3 font-medium text-stone-900">
                      {entry.email}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill>{AUDIENCE_LABEL[entry.audience]}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                      {formatDay(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination pagination={pagination} label="adresses de la liste d'attente" />
        </>
      )}
    </div>
  );
}
