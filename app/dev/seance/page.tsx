import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEV_PAGES_ENABLED } from "../garde";
import { FakeSessionClient } from "./client";

/**
 * `/dev/seance/` — la coque d'une séance avec des données factices (voir
 * `./seance.tsx`). Développement seulement, ou `NEXT_PUBLIC_EXERCISE_GALLERY=1`
 * (`../garde.ts`).
 */
export const metadata: Metadata = {
  title: "Séance factice (dev)",
  robots: { index: false, follow: false },
};

export default function FakeSessionPage() {
  if (!DEV_PAGES_ENABLED) notFound();
  return <FakeSessionClient />;
}
