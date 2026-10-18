"use client";

import dynamic from "next/dynamic";

/** Montée côté client seulement, comme la galerie (`../exercices/client.tsx`). */
export const FakeSessionClient = dynamic(() => import("./seance").then((m) => m.FakeSession), {
  ssr: false,
});
