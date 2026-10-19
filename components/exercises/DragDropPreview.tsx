"use client";

/**
 * L'aperçu d'un glisser-déposer pour le professeur : chaque case avec les
 * étiquettes qui lui reviennent, dans les teintes du Monde de Pio (une boîte
 * crème à plaque ambre). Statique : rien ne se glisse ici.
 */
interface DragDropPayload {
  zones: string[];
  items: { text: string; correctZone: string }[];
}

interface DragDropPreviewProps {
  prompt: string;
  payload: DragDropPayload;
}

export default function DragDropPreview({
  prompt,
  payload,
}: DragDropPreviewProps) {
  const { zones, items } = payload;

  // Les étiquettes rangées par case, pour l'aperçu.
  const itemsByZone: Record<string, string[]> = {};
  for (const zone of zones) {
    itemsByZone[zone] = [];
  }
  for (const item of items) {
    if (itemsByZone[item.correctZone]) {
      itemsByZone[item.correctZone].push(item.text);
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-extrabold text-amber-950">{prompt}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {zones.map((zone) => (
          <div
            key={zone}
            className="rounded-2xl border-2 border-amber-200 bg-[#fff8e6] p-3 shadow-[0_3px_0_#d6c39a]"
          >
            <h4 className="mb-3 rounded-xl bg-amber-200 px-3 py-1.5 text-center font-display text-sm font-extrabold text-amber-950">
              {zone}
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {(itemsByZone[zone] ?? []).map((text, index) => (
                <div
                  key={index}
                  className="rounded-xl border-2 border-white bg-white px-3 py-2 text-center text-sm font-bold text-amber-950 shadow-[0_2px_0_#d6c39a]"
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
