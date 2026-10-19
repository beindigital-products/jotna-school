"use client";

import { useState } from "react";

/**
 * L'ÉDITION D'UN NOUVEL EXERCICE PAR SON JSON. Les jeux (frise, dessin,
 * écoute, couleurs) sont fabriqués par le code et rarement retouchés à la
 * main ; la phrase à trous, elle, s'écrit vite dans ce format. L'aperçu à
 * côté montre l'écran de l'enfant à chaque modification valide.
 */
export const PAYLOAD_EXAMPLES: Record<string, unknown> = {
  "fill-blank": {
    text: "Hier, Modou ___ au marché et Awa ___ des mangues.",
    blanks: [
      { options: ["est allé", "va", "ira"], answer: "est allé" },
      { options: ["a acheté", "achète", "achètera"], answer: "a acheté" },
    ],
  },
  pattern: { sequence: ["🔴", "🟡", "🔴", "🟡", "🔴", null], options: ["🟡", "🔴", "🟢"], answers: ["🟡"] },
  "pixel-art": {
    mode: "copy",
    width: 4,
    height: 4,
    palette: [{ key: "R", color: "#ef4444", name: "rouge" }],
    target: ["R..R", ".RR.", ".RR.", "R..R"],
  },
  listen: {
    clips: [
      { label: "Son 1", notes: [{ f: 130.81, d: 900, v: 0.8, k: "tone" }] },
      { label: "Son 2", notes: [{ f: 523.25, d: 900, v: 0.8, k: "tone" }] },
    ],
    options: ["Le son 1", "Le son 2"],
    correctIndex: 1,
  },
  "color-mix": {
    mode: "result",
    given: [
      { name: "rouge", color: "#ef4444" },
      { name: "jaune", color: "#facc15" },
    ],
    choices: [
      { name: "orange", color: "#f97316" },
      { name: "vert", color: "#22c55e" },
      { name: "violet", color: "#a855f7" },
    ],
    answer: ["orange"],
  },
};

export default function JsonPayloadEditor({
  type,
  payload,
  onChange,
}: {
  type: string;
  payload: unknown;
  onChange: (payload: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(payload ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  const apply = (value: string) => {
    setText(value);
    try {
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("Le contenu doit être un objet JSON.");
        return;
      }
      setError(null);
      onChange(parsed);
    } catch {
      setError("JSON invalide : l'aperçu garde la dernière version valide.");
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => apply(e.target.value)}
        rows={14}
        spellCheck={false}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {PAYLOAD_EXAMPLES[type] !== undefined && (
        <button
          type="button"
          onClick={() => apply(JSON.stringify(PAYLOAD_EXAMPLES[type], null, 2))}
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Partir d&apos;un exemple
        </button>
      )}
    </div>
  );
}
