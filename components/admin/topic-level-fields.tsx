"use client";

import { VISIBLE_CLASSES, type ClassName } from "@/convex/curriculum";
import { MAX_PALIERS_PER_TOPIC, defaultPalierCount } from "@/convex/palierRules";
import { PALIER_SIZE } from "@/convex/paliers/scoring";

/**
 * Niveau et nombre de paliers d'une thématique — les deux champs qui font la
 * longueur de son sentier. Partagés par la création (détail d'une matière)
 * et la modification d'une thématique.
 *
 * Les valeurs voyagent en chaînes : `""` vaut « non défini » pour le niveau
 * et « défaut du niveau » pour le nombre de paliers, ce que `<select>` sait
 * porter sans état parallèle.
 */
const FIELD =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

export function TopicLevelFields({
  klass,
  onClassChange,
  palierCount,
  onPalierCountChange,
}: {
  klass: string;
  onClassChange: (value: string) => void;
  palierCount: string;
  onPalierCountChange: (value: string) => void;
}) {
  const fallback = defaultPalierCount(klass ? (klass as ClassName) : null);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Niveau</label>
        <select value={klass} onChange={(e) => onClassChange(e.target.value)} className={FIELD}>
          <option value="">Non défini</option>
          {VISIBLE_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Seuls les élèves de ce niveau voient la thématique.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de paliers</label>
        <select
          value={palierCount}
          onChange={(e) => onPalierCountChange(e.target.value)}
          className={FIELD}
        >
          <option value="">
            Par défaut du niveau ({fallback} palier{fallback > 1 ? "s" : ""}, {fallback * PALIER_SIZE} exercices)
          </option>
          {Array.from({ length: MAX_PALIERS_PER_TOPIC }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} palier{n > 1 ? "s" : ""} · {n * PALIER_SIZE} exercices
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Dix exercices par palier. CI et CP : 3, CE : 4, CM : 5 par défaut.
        </p>
      </div>
    </div>
  );
}
