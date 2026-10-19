"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Camera, Check, Lock, LogOut, School, Volume2, VolumeX } from "lucide-react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { setSoundEnabledLocal } from "@/lib/sounds";
import { Pio } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";
import { useLogout } from "@/hooks/use-logout";
import { classLongName, schoolClassDisplay } from "@/lib/classLabels";
import { useStudentActions, useStudentStats } from "@/hooks/use-student-data";
import { useOffline, useOfflineModel } from "@/components/offline/context";
import { kidMessages } from "@/lib/kidCopy";

/**
 * Réduit la photo choisie à un carré de 512 px, en JPEG : l'avatar s'affiche
 * en rond, et un fichier léger ménage la donnée (le terrain, c'est Dakar).
 */
async function fileToSquareBlob(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Encodage impossible"))),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    bitmap.close();
  }
}

/**
 * MODIFIER MON PROFIL — la page qu'ouvre l'avatar de l'en-tête.
 *
 * L'avatar ne déroule plus un menu : il mène ici. L'enfant change ce qui lui
 * appartient (son prénom, le son) ; ce que l'école a posé (la classe, l'école,
 * le professeur) se lit mais ne se touche pas, cadenassé et expliqué. La
 * déconnexion vit en bas, en deux temps, pour qu'un doigt qui glisse ne
 * renvoie pas un enfant de huit ans sur l'écran de connexion.
 *
 * L'avatar reste une image posée par l'école (ou les initiales) : sans
 * téléversement dans l'application, il n'y a rien à y changer ici.
 *
 * SANS RÉSEAU, la page s'ouvre et le son se règle (il part au serveur au
 * retour du réseau). Le prénom et la photo, eux, se changent en ligne : le
 * serveur peut refuser un prénom, et la photo doit être téléversée.
 */
export default function StudentProfileEditPage() {
  const stats = useStudentStats();
  const { connected } = useOffline();
  const { setSoundEnabled } = useStudentActions();
  const currentProfile = useQuery(api.profiles.getCurrentProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateAvatarUploadUrl = useMutation(api.profiles.generateAvatarUploadUrl);
  const setMyAvatarMut = useMutation(api.profiles.setMyAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Le brouillon du prénom : `null` tant qu'on n'a rien tapé, l'écran suit
  // alors la valeur du serveur. Après un enregistrement, on repasse à `null`
  // pour re-synchroniser sur la valeur fraîche.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSound = () => {
    if (!stats) return;
    const next = !stats.soundEnabled;
    setSoundEnabledLocal(next);
    setSoundEnabled(next);
  };

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // autorise le re-choix du même fichier
    if (!file) return;
    setAvatarError(null);
    setUploading(true);
    try {
      const blob = await fileToSquareBlob(file);
      const postUrl = await generateAvatarUploadUrl();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!res.ok) throw new Error("Envoi refusé");
      const { storageId } = (await res.json()) as { storageId: string };
      await setMyAvatarMut({ storageId });
    } catch (err) {
      setAvatarError(
        err instanceof ConvexError
          ? String(err.data)
          : "Impossible de changer la photo. Réessaie.",
      );
    } finally {
      setUploading(false);
    }
  };

  if (stats === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Pio state="think" size={150} />
        <p className="font-display text-lg font-bold text-amber-900/70">J&apos;ouvre ton profil...</p>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Pio state="sad" size={140} />
        <p className="font-display font-bold text-amber-900/70">Profil introuvable. Reconnecte-toi.</p>
      </div>
    );
  }

  const serverName = stats.student.name;
  const name = draft ?? serverName;
  const initials = serverName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const schooling = stats.schooling;
  const classDisplay = schooling
    ? schoolClassDisplay(schooling.class, schooling.classLabel)
    : stats.class;
  const email = currentProfile?.email ?? null;

  const trimmed = name.trim();
  const dirty = draft !== null && trimmed !== serverName;
  const canSave = dirty && trimmed.length > 0 && !saving && connected;

  const handleSaveName = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile({ name: trimmed });
      setDraft(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "Impossible d'enregistrer. Réessaie.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
      {/* ── En-tête : l'avatar ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={uploading || !connected}
          aria-label="Changer ma photo"
          className="relative h-24 w-24 rounded-full shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-orange-300 disabled:opacity-80"
        >
          {stats.student.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stats.student.avatar}
              alt={serverName}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-display text-3xl font-extrabold text-white">
              {initials}
            </span>
          )}
          {/* La pastille appareil-photo : elle dit « touche-moi pour changer ». */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#fff8e6] bg-orange-500 text-white shadow">
            <Camera className="h-4 w-4" aria-hidden />
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-white/40 border-t-white" aria-hidden />
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={uploading || !connected}
          className="font-display text-sm font-extrabold text-orange-600 underline-offset-2 hover:underline disabled:opacity-60"
        >
          {uploading ? "Je change la photo…" : "Changer ma photo"}
        </button>
        {!connected && (
          <p className="text-center text-xs font-bold text-sky-700">{kidMessages.offline.profileOnline}</p>
        )}
        {avatarError && <p className="text-sm font-bold text-red-600">{avatarError}</p>}
        <h1 className="mt-1 font-display text-2xl font-extrabold text-amber-950">Mon profil</h1>
      </div>

      {/* ── Éditable : mon nom ──────────────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-amber-200 bg-white/90 p-5">
        <label htmlFor="profil-nom" className="font-display text-base font-extrabold text-amber-950">
          Mon nom
        </label>
        <p className="mb-3 text-xs text-amber-900/70">C&apos;est ce que Pio affiche pour te saluer.</p>
        <input
          id="profil-nom"
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 font-display text-lg font-bold text-amber-950 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200"
        />
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
        <div className="mt-4 flex items-center gap-3">
          <GameButton
            tone="green"
            onClick={handleSaveName}
            disabled={!canSave}
            icon={<Check className="h-5 w-5" aria-hidden />}
          >
            {saving ? "J'enregistre…" : "Enregistrer"}
          </GameButton>
          {saved && (
            <span className="inline-flex items-center gap-1 font-display text-sm font-extrabold text-green-700">
              <Check className="h-4 w-4" aria-hidden />
              Enregistré
            </span>
          )}
        </div>
      </div>

      {/* ── Éditable : le son ───────────────────────────────────────────── */}
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

      {/* ── Lecture seule : fourni par l'école ──────────────────────────── */}
      <section
        aria-labelledby="profil-ecole"
        className="select-none rounded-3xl border-2 border-slate-200 bg-slate-100/70 p-5"
      >
        <h2
          id="profil-ecole"
          className="mb-1 flex items-center gap-2 font-display text-lg font-extrabold text-slate-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-white shadow-inner">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          Fourni par mon école
        </h2>
        <p className="mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <School className="h-3.5 w-3.5" aria-hidden />
          Seule ton école peut changer ça. Tu ne peux pas y toucher ici.
        </p>
        <dl className="grid grid-cols-2 gap-3">
          {classDisplay && (
            <ReadOnlyFact
              label="Ma classe"
              value={classDisplay}
              hint={schooling ? classLongName(schooling.class) : undefined}
            />
          )}
          {schooling?.teacherName && <ReadOnlyFact label="Mon prof" value={schooling.teacherName} />}
          {schooling?.schoolName && <ReadOnlyFact label="Mon école" value={schooling.schoolName} wide />}
          {email && <ReadOnlyFact label="Mon adresse" value={email} wide />}
        </dl>
      </section>

      {/* ── Déconnexion, en bas ─────────────────────────────────────────── */}
      <LogoutCard />
    </div>
  );
}

/** Une information posée par l'école : elle se lit, elle ne se touche pas. */
function ReadOnlyFact({
  label,
  value,
  hint,
  wide = false,
}: {
  label: string;
  value: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white/50 px-4 py-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="font-display text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words font-display text-lg font-extrabold leading-tight text-slate-500">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs font-semibold text-slate-400">{hint}</dd>}
    </div>
  );
}

/**
 * La déconnexion, en deux temps. Un premier appui demande confirmation ;
 * « Je reste » est le bouton le plus visible, parce que c'est l'appui
 * accidentel qu'on veut rattraper.
 */
function LogoutCard() {
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Ce que le serveur n'a pas encore reçu : on le dit avant de partir, il
  // partira à la prochaine connexion de l'enfant.
  const { engine } = useOffline();
  useOfflineModel();
  const pending = engine?.pendingCount() ?? 0;

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      setLeaving(false);
    }
  };

  if (!confirming) {
    return (
      <div className="pb-4">
        <GameButton
          tone="red"
          onClick={() => setConfirming(true)}
          icon={<LogOut className="h-5 w-5" aria-hidden />}
          className="w-full"
        >
          Se déconnecter
        </GameButton>
      </div>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="profil-quitter"
      className="flex flex-col items-center rounded-3xl border-2 border-amber-200 bg-[#fff8e6] p-5 text-center"
    >
      <Pio state="sad" size={96} />
      <p id="profil-quitter" className="mt-2 font-display text-lg font-extrabold text-amber-950">
        Tu pars déjà&nbsp;?
      </p>
      <p className="mt-1 text-sm font-semibold text-amber-900/70">
        Ton profil t&apos;attendra ici, avec toutes tes étoiles.
      </p>
      {pending > 0 && (
        <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
          {kidMessages.offline.logoutPending}
        </p>
      )}
      <div className="mt-5 flex w-full flex-col gap-4 sm:flex-row">
        <GameButton tone="green" onClick={() => setConfirming(false)} disabled={leaving} className="w-full sm:flex-1">
          Je reste
        </GameButton>
        <GameButton
          tone="red"
          onClick={handleLogout}
          disabled={leaving}
          icon={<LogOut className="h-5 w-5" aria-hidden />}
          className="w-full sm:flex-1"
        >
          {leaving ? "À bientôt…" : "Oui, je me déconnecte"}
        </GameButton>
      </div>
    </div>
  );
}
