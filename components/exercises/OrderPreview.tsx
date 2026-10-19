"use client";

/**
 * L'aperçu d'une mise en ordre pour le professeur : la bonne suite, une
 * marche numérotée par élément, dans les teintes du Monde de Pio. Statique.
 */
interface OrderPayload {
  correctSequence: string[];
}

interface OrderPreviewProps {
  prompt: string;
  payload: OrderPayload;
}

export default function OrderPreview({ prompt, payload }: OrderPreviewProps) {
  const { correctSequence } = payload;

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-extrabold text-amber-950">{prompt}</p>
      <ol className="space-y-2">
        {correctSequence.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-[#fff8e6] px-4 py-3 shadow-[0_3px_0_#d6c39a]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-display text-sm font-extrabold text-amber-950 shadow-[inset_0_-2px_0_rgb(0_0_0_/_0.15)]">
              {index + 1}
            </span>
            <span className="text-sm font-bold text-amber-950">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
