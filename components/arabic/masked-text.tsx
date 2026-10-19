"use client";

/**
 * LE TEXTE QUI S'EFFACE — ce que l'enfant voit pendant qu'il récite.
 *
 * TROIS DEGRÉS, ET UN SEUL ENDROIT QUI DÉCIDE LEQUEL. Le masque vient de
 * l'étape de séance (`SessionStep.mask`, construite par `buildHifzSession`),
 * jamais d'un état local : une révision doit se faire à texte caché même si
 * l'enfant recharge la page, et un composant qui déciderait tout seul pourrait
 * rendre le texte en douce au premier remontage.
 *
 * LE NOMBRE DE MOTS RESTE VISIBLE À TOUS LES DEGRÉS. C'est l'aide qu'un maître
 * donne en levant les doigts ; elle ne dit pas ce qu'il faut dire, elle dit
 * combien il en reste. La retirer ne rendrait pas l'exercice plus juste, juste
 * plus décourageant.
 *
 * LE BOUTON « MONTRER » EXISTE, ET IL NE TRICHE PAS. Un enfant bloqué doit
 * pouvoir revoir le texte plutôt que fermer l'onglet — c'est la même doctrine
 * que le « Passer » des autres exercices. Ce qu'il récite ensuite est jugé par
 * le serveur sur ce qu'il DIT, pas sur ce qu'il voyait : regarder ne donne
 * donc aucun point, ça donne un départ.
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { maskAyah, wordCount, type MaskDegree } from "@/convex/arabic/hifz";
import { arabicCopy } from "@/lib/arabic/copy";

export function MaskedText({
  text,
  mask,
}: {
  text: string;
  mask: MaskDegree;
}) {
  const [revealed, setRevealed] = useState(false);
  const shown = revealed ? text : maskAyah(text, mask);
  const count = wordCount(text);

  return (
    <div className="space-y-3">
      <p
        dir="rtl"
        lang="ar"
        className="font-arabic rounded-3xl bg-white px-5 py-8 text-4xl leading-[1.9] text-gray-900 shadow-sm sm:text-5xl"
      >
        {shown}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-semibold text-gray-500">
          {arabicCopy.memorize.words(count)}
        </span>
        {mask !== "full" && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            {revealed ? (
              <>
                <EyeOff className="h-4 w-4" aria-hidden />
                Cacher
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden />
                Montrer
              </>
            )}
          </button>
        )}
      </div>

      {!revealed && (
        <p className="text-sm font-medium text-gray-500">
          {mask === "hints"
            ? arabicCopy.memorize.hintsNote
            : arabicCopy.memorize.hiddenNote}
        </p>
      )}
    </div>
  );
}
