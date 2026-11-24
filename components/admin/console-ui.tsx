"use client";

/**
 * Les briques propres à la console du super admin (`app/(admin)`), en plus du
 * kit des espaces adultes (`components/dashboard/ui.tsx`) : montants en FCFA,
 * comptages bornés, graphique en barres d'une série, badges d'état.
 *
 * Le graphique n'a qu'une série, donc pas de légende (le titre la nomme) ;
 * barres fines arrondies en haut ; grille discrète ; info-bulle au survol ; et
 * un tableau caché pour les lecteurs d'écran. La couleur est l'accent de la
 * console (`--dash-strong`, orange 700, contraste vérifié sur fond blanc).
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card as ShadCard } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const numberFormat = new Intl.NumberFormat("fr-FR");

/** Orange 700 : l'accent de la console, contraste vérifié sur fond blanc. */
const BAR_COLOR = "#c2410c";

/** « 12 500 FCFA ». */
export function fcfa(value: number): string {
  return `${numberFormat.format(value)} FCFA`;
}

/** « 1 250 ». */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Un comptage borné : « 1 000+ » quand la lecture s'est arrêtée à la borne. */
export function boundedLabel(value: { count: number; capped: boolean }): string {
  return `${numberFormat.format(value.count)}${value.capped ? "+" : ""}`;
}

/** « nov. 26 » pour une clé de mois, « 24 nov. » pour une clé de jour. */
export function seriesKeyLabel(key: string): string {
  if (key.length === 7) {
    const [year, month] = key.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export type Tone = "neutral" | "good" | "warning" | "critical" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  good: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  critical: "bg-red-50 text-red-800",
  info: "bg-sky-50 text-sky-900",
};

/** Un état en pastille. Toujours un mot : la couleur seule ne suffit pas. */
export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Un graphique en barres, une série, avec son tableau pour lecteur d'écran. */
export function SeriesBarChart({
  title,
  data,
  formatValue = formatNumber,
  height = 220,
}: {
  /** Le nom de la série : sert de légende et d'intitulé du tableau. */
  title: string;
  data: { key: string; value: number }[];
  formatValue?: (value: number) => string;
  height?: number;
}) {
  const points = data.map((point) => ({
    label: seriesKeyLabel(point.key),
    value: point.value,
  }));

  return (
    <figure className="w-full">
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height }}
        >
          <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e7e5e4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#d6d3d1" }}
              tick={{ fontSize: 11, fill: "#78716c" }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#78716c" }}
              width={48}
              allowDecimals={false}
              tickFormatter={(value: number) =>
                value >= 1000
                  ? `${numberFormat.format(Math.round(value / 1000))} k`
                  : String(value)
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(194, 65, 12, 0.08)" }}
              formatter={(value) => [formatValue(Number(value)), title]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e7e5e4",
                fontSize: 13,
                color: "#1c1917",
              }}
              labelStyle={{ color: "#57534e", fontWeight: 600 }}
            />
            <Bar
              dataKey="value"
              // Un attribut SVG ne résout pas `var(...)` : la couleur est
              // écrite en clair (orange 700, l'accent de la console).
              fill={BAR_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              // Sans animation : une carte voisine qui se charge recompose la
              // page, et l'animation repartait de zéro, barres invisibles.
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Période</th>
            <th scope="col">Valeur</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Un chiffre avec son libellé, pour les lignes de détail d'une carte. */
export function MetricRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm text-stone-700">{label}</p>
        {hint && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
      <p className="shrink-0 font-semibold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}

// ── Période ─────────────────────────────────────────────────────────────────

/** Le choix de la période du tableau de bord : 7, 30 ou 90 jours. */
export function PeriodSwitch<T extends number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(next) => {
        const found = options.find((option) => String(option.value) === next);
        if (found) onChange(found.value);
      }}
    >
      <TabsList
        aria-label="Période"
        className="h-auto rounded-xl bg-stone-100 p-1 group-data-horizontal/tabs:h-auto"
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={String(option.value)}
            className="min-h-9 rounded-lg px-3 text-sm text-stone-700 data-active:bg-white data-active:text-stone-900"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// ── Indicateur avec tendance ────────────────────────────────────────────────

const CARD =
  "block gap-0 rounded-2xl border border-stone-200 bg-white py-0 text-base text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ring-0";

/**
 * La variation par rapport à la période d'avant : une flèche, un pourcentage
 * et des mots. `goodWhenUp` faux inverse le jugement (un retard qui monte
 * n'est pas une bonne nouvelle).
 */
export function TrendPill({
  change,
  previous,
  goodWhenUp = true,
}: {
  change: number | null;
  previous: number;
  goodWhenUp?: boolean;
}) {
  if (change === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
        <Minus className="h-3 w-3" aria-hidden />
        {previous === 0 ? "Rien avant" : "Stable"}
      </span>
    );
  }
  const up = change > 0;
  const flat = change === 0;
  const good = flat ? null : up === goodWhenUp;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        good === null
          ? "bg-stone-100 text-stone-600"
          : good
            ? "bg-emerald-50 text-emerald-800"
            : "bg-red-50 text-red-800",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {flat ? "Stable" : `${up ? "+" : "−"}${Math.abs(change)} %`}
      <span className="sr-only">
        {flat ? "" : up ? " en hausse" : " en baisse"} par rapport à la période précédente
      </span>
    </span>
  );
}

/** Un indicateur de la période, avec sa variation et la valeur d'avant. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  previous,
  previousLabel,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  change: number | null;
  previous: number;
  /** La valeur d'avant, déjà mise en forme : « 12 », « 250 000 FCFA ». */
  previousLabel: string;
  hint?: string;
}) {
  return (
    <ShadCard className={cn(CARD, "p-4 sm:p-5")}>
      <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
        <Icon className="h-4 w-4 shrink-0 text-(--dash-strong)" aria-hidden />
        <span className="min-w-0">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-stone-900 sm:text-3xl">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <TrendPill change={change} previous={previous} />
        <span className="text-xs text-stone-500">avant : {previousLabel}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </ShadCard>
  );
}

// ── Entonnoir et barres ─────────────────────────────────────────────────────

/**
 * Un entonnoir : une barre par étape, sa valeur, et la part de l'étape
 * précédente qui y arrive. Une seule teinte, la longueur porte la mesure.
 */
export function FunnelBars({
  steps,
}: {
  steps: readonly { label: string; value: number; conversion: number | null; share: number }[];
}) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 text-stone-700">
              <span className="mr-1.5 text-xs tabular-nums text-stone-400">{index + 1}.</span>
              {step.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-stone-900">
              {formatNumber(step.value)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100" aria-hidden>
              <div
                className="h-full rounded-full bg-(--dash-strong)"
                style={{ width: `${step.value > 0 ? Math.max(step.share, 2) : 0}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs text-stone-500">
              {step.conversion === null
                ? index === 0
                  ? "Point de départ"
                  : "—"
                : `${step.conversion} % de l'étape ${index}`}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Une liste de barres horizontales : une ligne par catégorie. */
export function BarList({
  rows,
  valueLabel,
}: {
  rows: readonly { label: string; value: number; detail?: string }[];
  /** Ce que mesure la barre, pour le lecteur d'écran : « élèves actifs ». */
  valueLabel: string;
}) {
  const max = Math.max(0, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 text-sm">
          <span className="font-medium text-stone-800">{row.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden>
            <div
              className="h-full rounded-full bg-(--dash-strong)"
              style={{ width: `${max > 0 && row.value > 0 ? Math.max((row.value / max) * 100, 2) : 0}%` }}
            />
          </div>
          <span className="text-right tabular-nums text-stone-900">
            <span className="font-semibold">{formatNumber(row.value)}</span>
            <span className="sr-only"> {valueLabel}</span>
            {row.detail && <span className="ml-2 text-xs text-stone-500">{row.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Export CSV ──────────────────────────────────────────────────────────────

/** Une cellule CSV : guillemets doublés, et le tout entre guillemets. */
function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Une cellule qui commence par = + - @ serait lue comme une formule par un
  // tableur : une apostrophe la désarme.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Le texte d'un fichier CSV, séparateur point-virgule (Excel en français). */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
}

/** Télécharge un CSV, avec la marque d'ordre qui fait lire les accents à Excel. */
export function downloadCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): void {
  const blob = new Blob(["\uFEFF", toCsv(headers, rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
