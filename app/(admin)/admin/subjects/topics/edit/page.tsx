"use client";

import { Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { refusalMessage } from "@/lib/refusalMessage";
import type { VisibleClassName } from "@/convex/curriculum";
import { TopicLevelFields } from "@/components/admin/topic-level-fields";

function TopicEditPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const topicId = searchParams.get("topicId") ?? "";
  const router = useRouter();
  const topic = useQuery(api.topics.getById, { id: topicId as Id<"topics"> });
  const subject = useQuery(api.subjects.getById, { id: id as Id<"subjects"> });
  const updateTopic = useMutation(api.topics.update);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [klass, setKlass] = useState("");
  const [palierCount, setPalierCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Rempli une seule fois, pendant le rendu, dès que le thème arrive : un effet
  // aurait affiché un rendu de trop avec le formulaire vide.
  if (topic && !initialized) {
    setName(topic.name);
    setDescription(topic.description);
    setOrder(topic.order);
    setKlass(topic.class ?? "");
    setPalierCount(topic.palierCount === undefined ? "" : String(topic.palierCount));
    setInitialized(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTopic({
        id: topicId as Id<"topics">,
        name,
        description,
        order,
        class: klass ? (klass as VisibleClassName) : undefined,
        // Vide : la thématique reprend le défaut de son niveau.
        palierCount: palierCount === "" ? null : Number(palierCount),
      });
      router.push(`/admin/subjects/detail?id=${id}`);
    } catch (err) {
      setError(
        refusalMessage(err, "Erreur lors de la mise à jour"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (topic === undefined || subject === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (topic === null) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Thématique introuvable
        </h2>
        <Link
          href={`/admin/subjects/detail?id=${id}`}
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la matière
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin/subjects"
          className="hover:text-gray-700 transition-colors"
        >
          Matières
        </Link>
        <span>/</span>
        <Link
          href={`/admin/subjects/detail?id=${id}`}
          className="hover:text-gray-700 transition-colors"
        >
          {subject?.name ?? "..."}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Modifier la thématique</span>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">
            Modifier la thématique
          </h1>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <TopicLevelFields
              klass={klass}
              onClassChange={setKlass}
              palierCount={palierCount}
              onPalierCountChange={setPalierCount}
            />
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </button>
              <Link
                href={`/admin/subjects/detail?id=${id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TopicEditPage() {
  return (
    <Suspense fallback={null}>
      <TopicEditPageInner />
    </Suspense>
  );
}
