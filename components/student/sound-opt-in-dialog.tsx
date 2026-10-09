"use client";

import { useState } from "react";
import { Volume2, Volume1 } from "lucide-react";
import { useStudentActions } from "@/hooks/use-student-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pio } from "@/components/student/pio";
import {
  markOptInAsked,
  playCorrect,
  preloadAll,
  setSoundEnabledLocal,
} from "@/lib/sounds";

/**
 * Phase A.5 — Sound opt-in dialog (D20, D32, D33).
 *
 *   D20 — Triggered from /complete page (NOT /home), after the kid has
 *         completed their first session. The kid is in a happy moment, so
 *         the question "want sound for the next ones?" lands well.
 *   D32 — CE2-friendly copy. Single short sentence, no abstract concepts,
 *         no hint that they can change later (the toggle in /profil exists,
 *         parents/teachers will tell them).
 *   D33 — "Écouter d'abord" is the FIRST and LARGEST CTA. Forces a preview
 *         which doubles as iOS audio context unlock gesture.
 */
export function SoundOptInDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Le choix s'écrit au journal de l'appareil, et part au serveur avec le réseau.
  const { setSoundEnabled } = useStudentActions();
  const [previewed, setPreviewed] = useState(false);
  const [busy, setBusy] = useState(false);

  const handlePreview = async () => {
    setSoundEnabledLocal(true); // Allow play() to fire even before opt-in is persisted.
    await preloadAll();
    void playCorrect();
    setPreviewed(true);
  };

  const handleAccept = async () => {
    setBusy(true);
    setSoundEnabledLocal(true);
    markOptInAsked(userId);
    void preloadAll();
    setSoundEnabled(true);
    setBusy(false);
    onOpenChange(false);
  };

  const handleDecline = async () => {
    setBusy(true);
    setSoundEnabledLocal(false);
    markOptInAsked(userId);
    setSoundEnabled(false);
    setBusy(false);
    onOpenChange(false);
  };

  // ESC / outside-click → treat as decline so we don't re-prompt next visit.
  const handleOpenChange = (next: boolean) => {
    if (!next && open) {
      void handleDecline();
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <DialogContent>
        <DialogHeader>
          <Pio state="cheer" size={96} animated={false} />
          <DialogTitle>Tu veux entendre Pio ?</DialogTitle>
          <DialogDescription>
            Il fait un petit son quand tu réussis !
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {/* D33 — preview = primary first CTA, large + iOS audio unlock */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl disabled:opacity-50"
          >
            <Volume2 className="h-5 w-5" aria-hidden />
            {previewed ? "Encore une fois" : "Écouter d'abord"}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-green-600 disabled:opacity-50"
            >
              <Volume1 className="h-5 w-5" aria-hidden />
              Oui
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={busy}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              Non merci
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
