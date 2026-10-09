"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Lock, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  RARITY_TIERS,
  getRarityChipClass,
  getRarityGlowStyle,
  getRarityLabel,
  getRarityRingClass,
  type RarityTier,
} from "@/lib/badges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BadgeShield } from "@/components/student/badge-icon";
import { Pio } from "@/components/student/pio";
import { pioSays } from "@/lib/pioCopy";

/**
 * LA SALLE DES TROPHÉES — les badges, rangés sur des étagères par rareté.
 *
 * Un « coffre » se fouille ; une salle des trophées se visite. Les étagères
 * vont du plus rare au plus commun : ce qui brille est en haut, et une
 * étagère vide dit à l'enfant qu'il reste quelque chose à conquérir. La
 * jauge de collection en tête est la seule mesure qui compte ici.
 *
 * LA MÉCANIQUE D'AVANT EST CONSERVÉE : les trois filtres (D10), la fiche
 * d'un trophée dans un dialog, le halo par rareté. Seule la disposition
 * change — et les mots, qui parlent de trophées, pas de badges.
 */
type Tab = "all" | "earned" | "locked";

type BadgeRow = {
  _id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  rarity: RarityTier;
  criteriaText: string;
  /** Le moteur sait juger cette condition ; sinon la vitrine ne la montre pas. */
  supported?: boolean;
};

type ProgressRow = { badgeId: string; value: number; target: number };

type EarnedRow = {
  badgeId: string;
  earnedAt: number;
};

/** Du plus rare au plus commun : l'ordre des étagères. */
const SHELVES: readonly RarityTier[] = [...RARITY_TIERS].reverse();

const SHELF_TONE: Record<RarityTier, string> = {
  legendary: "from-amber-500 via-yellow-400 to-amber-500",
  epic: "from-purple-500 via-fuchsia-400 to-purple-500",
  rare: "from-sky-500 via-cyan-400 to-sky-500",
  common: "from-amber-800 via-amber-700 to-amber-800",
};

export default function StudentBadgesPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const allBadges = useQuery(api.badges.list);
  // L'élève est dérivé de la session côté serveur : plus d'argument, donc
  // plus de "skip" en attente du profil.
  const earned = useQuery(api.badges.listMyEarned);
  // Où en est l'enfant sur ce qu'il n'a pas encore : la barre sous chaque trophée fermé.
  const progress = useQuery(api.badges.getMyBadgeProgress);

  const [tab, setTab] = useState<Tab>("all");
  const [detailBadge, setDetailBadge] = useState<{
    badge: BadgeRow;
    earnedAt: number | null;
  } | null>(null);

  const earnedBadgeIds = useMemo(
    () => new Set((earned ?? []).map((e: EarnedRow) => e.badgeId)),
    [earned],
  );

  const earnedAtById = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of earned ?? []) map.set(e.badgeId, e.earnedAt);
    return map;
  }, [earned]);

  const progressById = useMemo(() => {
    const map = new Map<string, ProgressRow>();
    for (const p of (progress ?? []) as ProgressRow[]) map.set(p.badgeId, p);
    return map;
  }, [progress]);

  if (allBadges === undefined || profile === undefined || earned === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Pio state="think" size={150} />
        <p className="font-display text-lg font-bold text-amber-900/70">J&apos;ouvre la salle...</p>
      </div>
    );
  }

  const badges = ((allBadges as BadgeRow[]) ?? []).filter((b) => b.supported !== false);
  const earnedCount = earnedBadgeIds.size;
  const totalCount = badges.length;
  const lockedCount = totalCount - earnedCount;
  const collectionPct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const visibleBadges = badges.filter((b) => {
    const isEarned = earnedBadgeIds.has(b._id);
    if (tab === "earned") return isEarned;
    if (tab === "locked") return !isEarned;
    return true;
  });

  const shelves = SHELVES.map((tier) => ({
    tier,
    items: visibleBadges.filter((b) => b.rarity === tier),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* ── En-tête : la jauge de collection ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#7a3e12_0%,#a5602c_55%,#c98240_100%)] p-5 text-white shadow-xl sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
            <Trophy className="h-9 w-9 text-yellow-300 drop-shadow" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-outline font-display text-2xl font-extrabold sm:text-3xl">
              {pioSays.trophiesTitle}
            </h1>
            <p className="font-display text-sm font-bold text-amber-100">
              {earnedCount}/{totalCount} trophée{totalCount > 1 ? "s" : ""}
              {earnedCount > 0 ? " dans la vitrine" : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/25 shadow-inner" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-[width] duration-700"
            style={{ width: `${collectionPct}%` }}
          />
        </div>
        <p className="mt-1 text-right font-display text-xs font-extrabold text-amber-100">
          Collection : {collectionPct}%
        </p>
      </div>

      {/* ── Filtres (D10) ───────────────────────────────────────────────── */}
      <div className="flex gap-2" role="tablist" aria-label="Filtre des trophées">
        <TabPill isActive={tab === "all"} onClick={() => setTab("all")} label="Tous" count={totalCount} />
        <TabPill isActive={tab === "earned"} onClick={() => setTab("earned")} label="Gagnés" count={earnedCount} />
        <TabPill isActive={tab === "locked"} onClick={() => setTab("locked")} label="À conquérir" count={lockedCount} />
      </div>

      {/* ── Les étagères ────────────────────────────────────────────────── */}
      {shelves.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-amber-300 bg-white/70 p-8 text-center">
          <Pio state="encourage" size={140} />
          <p className="font-display text-base font-bold text-amber-900">
            {tab === "earned"
              ? pioSays.trophiesEmpty
              : tab === "locked"
                ? "Tu as tout conquis. Quel explorateur !"
                : "Aucun trophée pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {shelves.map(({ tier, items }) => (
            <section key={tier} aria-label={`Étagère ${getRarityLabel(tier)}`}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-display text-lg font-extrabold text-amber-950">
                  {getRarityLabel(tier)}
                  {tier !== "common" ? "s" : "s"}
                </h2>
                {tier === "legendary" && <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {items.map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge._id);
                  const p = progressById.get(badge._id);
                  const pct = p && p.target > 0 ? Math.min(100, Math.round((p.value / p.target) * 100)) : 0;
                  return (
                    <motion.button
                      type="button"
                      key={badge._id}
                      onClick={() =>
                        setDetailBadge({ badge, earnedAt: earnedAtById.get(badge._id) ?? null })
                      }
                      whileHover={{ scale: 1.04, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      style={isEarned ? getRarityGlowStyle(badge.rarity) : undefined}
                      className={`group relative flex min-h-44 flex-col items-center justify-between gap-2 overflow-hidden rounded-3xl border-2 bg-white p-4 text-center shadow-md transition-shadow hover:shadow-xl ${
                        isEarned ? `border-white ${getRarityRingClass(badge.rarity)}` : "border-amber-100"
                      }`}
                      aria-label={isEarned ? `${badge.name} — gagné` : `${badge.name} — à conquérir`}
                    >
                      {isEarned && badge.rarity !== "common" && (
                        <span
                          className={`absolute right-2 top-2 z-20 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getRarityChipClass(badge.rarity)}`}
                        >
                          {badge.rarity === "legendary" && <Sparkles className="h-2.5 w-2.5" aria-hidden />}
                          {getRarityLabel(badge.rarity)}
                        </span>
                      )}

                      <div className={`mt-1 transition-transform duration-200 group-hover:scale-[1.05] ${isEarned ? "" : "opacity-70 grayscale"}`}>
                        <BadgeShield
                          iconName={badge.icon}
                          badgeName={badge.name}
                          tier={badge.rarity}
                          locked={!isEarned}
                          size={88}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className={`font-display text-sm font-extrabold ${isEarned ? "text-amber-950" : "text-amber-900/70"}`}>
                          {badge.name}
                        </p>
                        {isEarned ? (
                          <p className="text-[11px] leading-tight text-amber-900/70">{badge.description}</p>
                        ) : p ? (
                          <div className="w-full" aria-label={`${p.value} sur ${p.target}`}>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1 font-display text-[10px] font-extrabold text-amber-800">
                              {Math.min(p.value, p.target)} / {p.target}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 self-center rounded-full bg-amber-100 px-2 py-0.5 font-display text-[10px] font-extrabold text-amber-800">
                            <Lock className="h-2.5 w-2.5" aria-hidden />
                            À conquérir
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* La planche de l'étagère */}
              <div
                aria-hidden
                className={`mt-2 h-3 rounded-full bg-gradient-to-r ${SHELF_TONE[tier]} shadow-[0_6px_10px_-6px_rgba(0,0,0,0.5)]`}
              />
            </section>
          ))}
        </div>
      )}

      {/* ── La fiche d'un trophée ───────────────────────────────────────── */}
      <Dialog
        open={detailBadge !== null}
        onOpenChange={(open) => {
          if (!open) setDetailBadge(null);
        }}
      >
        <DialogContent>
          {detailBadge && (
            <>
              <DialogHeader>
                <div className="mb-2">
                  <BadgeShield
                    iconName={detailBadge.badge.icon}
                    badgeName={detailBadge.badge.name}
                    tier={detailBadge.badge.rarity}
                    locked={!earnedBadgeIds.has(detailBadge.badge._id)}
                    size={140}
                  />
                </div>
                <DialogTitle>{detailBadge.badge.name}</DialogTitle>
                {detailBadge.badge.rarity !== "common" && (
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getRarityChipClass(detailBadge.badge.rarity)}`}
                  >
                    {detailBadge.badge.rarity === "legendary" && <Sparkles className="h-3 w-3" aria-hidden />}
                    {getRarityLabel(detailBadge.badge.rarity)}
                  </span>
                )}
                <DialogDescription>
                  {earnedBadgeIds.has(detailBadge.badge._id)
                    ? detailBadge.badge.description
                    : detailBadge.badge.criteriaText}
                </DialogDescription>
              </DialogHeader>
              {detailBadge.earnedAt !== null ? (
                <p className="text-center text-xs font-semibold text-amber-700">
                  Gagné le {new Date(detailBadge.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              ) : (
                (() => {
                  const p = progressById.get(detailBadge.badge._id);
                  return p ? (
                    <p className="text-center font-display text-sm font-extrabold text-amber-800">
                      Tu en es à {Math.min(p.value, p.target)} sur {p.target}
                    </p>
                  ) : null;
                })()
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabPill({
  isActive,
  onClick,
  label,
  count,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-display text-sm font-extrabold transition-all ${
        isActive
          ? "bg-orange-500 text-white shadow-md shadow-orange-300/60"
          : "bg-white/80 text-amber-900 hover:bg-amber-50"
      }`}
    >
      <span>{label}</span>
      <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${isActive ? "bg-white/25" : "bg-amber-100"}`}>
        {count}
      </span>
    </button>
  );
}
