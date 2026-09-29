"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { refusalMessage } from "@/lib/refusalMessage";
import { BADGE_CONDITIONS, badgeParams, isSupportedCondition } from "@/convex/badgeRules";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
} from "lucide-react";

// Les conditions que le moteur sait attribuer (`convex/badgeRules.ts`).
const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  BADGE_CONDITIONS.map((c) => [c.key, c.label]),
);

export default function AdminBadgesPage() {
  const badges = useQuery(api.badges.list);
  const subjects = useQuery(api.subjects.list);
  const createBadge = useMutation(api.badges.create);
  const updateBadge = useMutation(api.badges.update);
  const removeBadge = useMutation(api.badges.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [condition, setCondition] = useState("paliers_validated_total");
  const [threshold, setThreshold] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("");
    setCondition("paliers_validated_total");
    setThreshold("");
    setSubjectId("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (badge: {
    _id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
    conditionParams?: unknown;
    subjectId?: string;
  }) => {
    setEditingId(badge._id);
    setName(badge.name);
    setDescription(badge.description);
    setIcon(badge.icon);
    setCondition(badge.condition);
    const params = badgeParams(badge.condition, badge.conditionParams);
    setThreshold(typeof params.count === "number" ? String(params.count) : "");
    setSubjectId(badge.subjectId ?? "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Le seuil saisi complète les paramètres par défaut de la condition ;
      // une matière liée sert aussi de paramètre (maîtrise d'une matière).
      const conditionParams = {
        ...badgeParams(condition, undefined),
        ...(threshold.trim() !== "" && Number.isFinite(Number(threshold)) ? { count: Number(threshold) } : {}),
        ...(subjectId ? { subjectId } : {}),
      };
      if (editingId) {
        await updateBadge({
          id: editingId as Id<"badges">,
          name,
          description,
          icon,
          condition,
          conditionParams,
          subjectId: subjectId ? (subjectId as Id<"subjects">) : undefined,
        });
      } else {
        await createBadge({
          name,
          description,
          icon,
          condition,
          conditionParams,
          subjectId: subjectId ? (subjectId as Id<"subjects">) : undefined,
        });
      }
      resetForm();
    } catch (err) {
      setError(refusalMessage(err, "Erreur lors de l'opération"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await removeBadge({ id: id as Id<"badges"> });
      setDeleteConfirm(null);
    } catch (err) {
      setError(
        refusalMessage(err, "Erreur lors de la suppression"),
      );
      setDeleteConfirm(null);
    }
  };

  if (badges === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement des badges...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les badges et récompenses des élèves
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un badge
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? "Modifier le badge" : "Nouveau badge"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Explorateur"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icône (emoji ou nom Lucide)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  required
                  placeholder="ex: 🏆 ou Trophy"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="Description du badge..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {BADGE_CONDITIONS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seuil (optionnel)
                </label>
                <input
                  type="number"
                  min={1}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={String(badgeParams(condition, undefined).count ?? "")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Vide : le seuil par défaut de la condition. Les autres réglages (temps, heure) gardent leurs défauts.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matière (optionnel)
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Toutes les matières</option>
                  {subjects?.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingId ? "Enregistrer" : "Créer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {badges.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Aucun badge
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Commencez par créer un badge pour motiver vos élèves.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const linkedSubject = subjects?.find(
              (s) => s._id === badge.subjectId,
            );
            return (
              <div
                key={badge._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-2xl">
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {badge.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {CONDITION_LABELS[badge.condition] ?? badge.condition}
                  </span>
                  {!isSupportedCondition(badge.condition) && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      Condition inconnue : jamais attribué
                    </span>
                  )}
                  {linkedSubject && (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: linkedSubject.color }}
                    >
                      {linkedSubject.name}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => startEdit(badge)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                  {deleteConfirm === badge._id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(badge._id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(badge._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
