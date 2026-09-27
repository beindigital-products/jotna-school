"use client";

import { BookCheck, Award, Clock, Star, Heart, Flame, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setSoundEnabledLocal } from "@/lib/sounds";
import { Pio } from "@/components/student/pio";
import { pioSays } from "@/lib/pioCopy";

/**
 * LE CARNET D'EXPLORATEUR — le profil de l'élève, vu comme un carnet de bord.
 *
 * Une page de carnet, crème, avec des tampons : niveau, étoiles, étapes,
 * trophées, série. Pio y a sa place en marge, comme un compagnon de route.
 * Ce n'est pas un tableau de bord : c'est ce que l'enfant montre à sa mère.
 *
 * Tout ce qui existait reste : l'anneau de niveau (D3b), le réglage des sons
 * (D6/D22), la matière préférée, les derniers trophées. Cold start sans zéros
 * (D8) : un tampon à zéro ne s'imprime pas, il reste en pointillé.
 */
const EXOS_PER_LEVEL_UI = 50; // Mirrors students.EXOS_PER_LEVEL.

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0min";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export default function StudentProfilePage() {
  const stats = useQuery(api.students.getMyStats);
  const setSoundEnabledMut = useMutation(api.streak.setSoundEnabled);

  const handleToggleSound = async () => {
    if (!stats) return;
    const next = !stats.soundEnabled;
    setSoundEnabledLocal(next);
    try {
      await setSoundEnabledMut({ enabled: next });
    } catch {
      // Mutation queues offline; UI reflects optimistic state via memo + Convex.
    }
  };

  if (stats === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Pio state="think" size={150} />
        <p className="font-display text-lg font-bold text-amber-900/70">J&apos;ouvre ton carnet...</p>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Pio state="sad" size={140} />
        <p className="font-display font-bold text-amber-900/70">Carnet introuvable. Reconnecte-toi.</p>
      </div>
    );
  }

  const initials = stats.student.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const level = stats.level ?? 1;
  const remaining = stats.exosToNextLevel ?? EXOS_PER_LEVEL_UI;
  const xpInLevel = EXOS_PER_LEVEL_UI - remaining;
  const xpProgress = Math.max(0, Math.min(100, (xpInLevel / EXOS_PER_LEVEL_UI) * 100));
  const studentClass = (stats.student as { class?: string | null }).class ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
      {/* ── La page de garde ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-amber-200 bg-[#fff8e6] p-6 shadow-xl">
        {/* Lignes de carnet */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0 27px, #f2d9a6 27px 28px)",
          }}
        />
        {/* Pio en marge */}
        <div aria-hidden className="absolute -right-3 -top-2 hidden sm:block">
          <Pio state="think" size={120} />
        </div>

        <div className="relative flex flex-col items-center">
          <p className="mb-3 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700">
            {pioSays.notebookTitle}
          </p>

          <LevelRing progressPct={xpProgress}>
            {stats.student.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.student.avatar}
                alt={stats.student.name}
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-display text-3xl font-extrabold text-white shadow-lg">
                {initials}
              </div>
            )}
          </LevelRing>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-1 font-display text-sm font-extrabold text-white shadow">
            <Sparkles className="h-4 w-4" aria-hidden />
            Niveau {level}
          </span>

          <h1 className="mt-3 font-display text-2xl font-extrabold text-amber-950">{stats.student.name}</h1>
          {studentClass && (
            <p className="font-display text-sm font-bold text-amber-800/80">Classe de {studentClass}</p>
          )}

          {remaining > 0 && (
            <p className="mt-1 font-display text-xs font-bold text-amber-800/70">
              {remaining} bonne{remaining > 1 ? "s" : ""} réponse{remaining > 1 ? "s" : ""} avant le niveau {level + 1}
            </p>
          )}
        </div>
      </div>

      {/* ── Les tampons ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stamp icon={<Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />} label="Étoiles" value={stats.totalStars ?? 0} tone="yellow" />
        <Stamp icon={<BookCheck className="h-6 w-6 text-green-600" />} label="Exercices" value={stats.totalExercises ?? 0} tone="green" />
        <Stamp icon={<Award className="h-6 w-6 text-purple-600" />} label="Trophées" value={stats.badgeCount ?? 0} tone="purple" />
        {stats.streaksEnabled ? (
          <Stamp
            icon={<Flame className="h-6 w-6 fill-orange-500 text-orange-500" />}
            label={`Série${(stats.longestStreak ?? 0) > 0 ? ` · record ${stats.longestStreak}` : ""}`}
            value={stats.currentStreak ?? 0}
            suffix=" j"
            tone="orange"
          />
        ) : (
          <Stamp icon={<Clock className="h-6 w-6 text-sky-600" />} label="Temps" value={formatDuration(stats.totalTimeMs ?? 0)} tone="sky" />
        )}
      </div>

      {/* ── Matière préférée ────────────────────────────────────────────── */}
      {stats.favoriteSubject && (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-pink-200 bg-pink-50 p-5">
          <Heart className="h-6 w-6 fill-pink-400 text-pink-500" aria-hidden />
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-pink-700">Monde préféré</p>
            <p className="font-display text-lg font-extrabold text-amber-950">{stats.favoriteSubject}</p>
          </div>
        </div>
      )}

      {/* ── Sons (D6/D22) ───────────────────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-amber-200 bg-white/90 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.soundEnabled ? (
              <Volume2 className="h-6 w-6 text-orange-600" aria-hidden />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-500" aria-hidden />
            )}
            <div>
              <p className="font-display text-base font-extrabold text-amber-950">Sons</p>
              <p className="text-xs text-amber-900/70">Petit son joyeux quand tu réussis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            role="switch"
            aria-checked={stats.soundEnabled}
            aria-label={stats.soundEnabled ? "Couper les sons" : "Activer les sons"}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
              stats.soundEnabled ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                stats.soundEnabled ? "translate-x-7" : "translate-x-1"
              }`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* ── Derniers trophées ───────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold text-amber-950">Derniers trophées</h2>
        {stats.recentBadges.length === 0 ? (
          <p className="font-display text-sm font-bold text-amber-900/70">{pioSays.trophiesEmpty}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {stats.recentBadges.map((eb) => (
              <div
                key={eb._id}
                className="flex flex-col items-center rounded-3xl border-2 border-yellow-200 bg-gradient-to-b from-yellow-50 to-orange-50 p-4 text-center"
              >
                <span className="text-3xl">{eb.badge.icon}</span>
                <p className="mt-2 font-display text-sm font-extrabold text-amber-950">{eb.badge.name}</p>
                <p className="mt-0.5 text-xs text-amber-900/60">
                  {new Date(eb.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Un tampon du carnet. Un compteur à zéro ne s'imprime pas : il reste en
 * pointillé, comme une case à remplir (D8).
 */
function Stamp({
  icon,
  label,
  value,
  suffix = "",
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  tone: "yellow" | "green" | "purple" | "orange" | "sky";
}) {
  const empty = value === 0;
  const tones: Record<typeof tone, string> = {
    yellow: "border-yellow-300 bg-yellow-50",
    green: "border-green-300 bg-green-50",
    purple: "border-purple-300 bg-purple-50",
    orange: "border-orange-300 bg-orange-50",
    sky: "border-sky-300 bg-sky-50",
  };
  return (
    <div
      className={`flex flex-col items-center rounded-3xl border-2 p-4 text-center ${
        empty ? "border-dashed border-amber-200 bg-white/60" : tones[tone]
      }`}
    >
      <span className={empty ? "opacity-40" : ""}>{icon}</span>
      <p className={`mt-1 font-display text-2xl font-extrabold ${empty ? "text-amber-900/40" : "text-amber-950"}`}>
        {empty ? "·" : `${value}${suffix}`}
      </p>
      <p className="font-display text-[11px] font-extrabold uppercase tracking-wide text-amber-900/60">{label}</p>
    </div>
  );
}

function LevelRing({
  children,
  progressPct,
  size = 120,
  stroke = 7,
}: {
  children: React.ReactNode;
  progressPct: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (progressPct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#fde68a" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#level-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-[stroke-dasharray] duration-700"
        />
        <defs>
          <linearGradient id="level-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
