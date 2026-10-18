"use client";

import { Link2 } from "lucide-react";

/**
 * L'aperçu d'une association pour le professeur : chaque paire sur une ligne,
 * reliée par un maillon, dans les teintes du Monde de Pio (crème, ambre, le
 * bleu du geste « choisir »). Statique : rien ne se joue ici.
 */
interface MatchPayload {
  pairs: { left: string; right: string }[];
}

interface MatchPreviewProps {
  prompt: string;
  payload: MatchPayload;
}

export default function MatchPreview({ prompt, payload }: MatchPreviewProps) {
  const { pairs } = payload;

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-extrabold text-amber-950">{prompt}</p>
      <div className="space-y-2">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-[#fff8e6] px-4 py-3 shadow-[0_3px_0_#d6c39a]"
          >
            <span className="flex-1 rounded-xl border-2 border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-bold text-blue-900">
              {pair.left}
            </span>
            <Link2 className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
            <span className="flex-1 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-bold text-amber-900">
              {pair.right}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
