"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AlertTriangle, Download, Hourglass, Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";

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

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement de la liste...</span>
      </div>
    );
  }

  const { entries, truncated } = data;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Liste d&apos;attente
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Les visiteurs à prévenir de l&apos;ouverture des ventes, à la
            rentrée 2027-2028.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => downloadCsv(entries)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exporter en CSV
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Hourglass className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Personne pour l&apos;instant
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Les inscriptions faites depuis la page d&apos;accueil apparaîtront
            ici.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {entries.length} inscription{entries.length > 1 ? "s" : ""}
          </p>

          {truncated && (
            <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                La liste dépasse ce que cet écran affiche : seules les
                inscriptions les plus récentes sont visibles et exportées.
              </span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Adresse
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Profil
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="break-all px-4 py-3 font-medium text-gray-900">
                      {entry.email}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {AUDIENCE_LABEL[entry.audience]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDay(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
