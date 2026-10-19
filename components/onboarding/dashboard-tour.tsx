"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VISIBLE_CLASSES, type VisibleClassName } from "@/convex/curriculum";
import { isDashboardTourDone } from "@/convex/profileRules";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CodeChip } from "@/components/classroom/code-chip";
import { refusalMessage } from "@/lib/refusalMessage";
import { SpotlightTour } from "./tour";
import { TOUR_STEPS, type TourRole } from "./tour-steps";

/**
 * LA VISITE GUIDÉE ET L'ONBOARDING DU PREMIER ENFANT.
 *
 * Trois temps, une seule fois par compte :
 *
 * 1. un accueil : « Faire la visite » ou « Passer » ;
 * 2. la visite elle-même (`SpotlightTour`) : le menu s'éclaire, une page après
 *    l'autre, avec ce qu'on y fait ;
 * 3. pour un parent qui n'a encore aucun enfant, le formulaire du premier
 *    compte. Le professeur et l'école finissent sur une étape qui les envoie
 *    vers leurs classes, où un compte élève se crée.
 *
 * « PASSER » EST DANS LES TROIS TEMPS, ET IL EST DÉFINITIF. Passer, terminer,
 * Échap ou un clic hors de l'accueil posent tous le même drapeau
 * (`preferences.dashboardTourDone`, via `profiles.updateProfile`) : la visite
 * ne revient ni à la prochaine page, ni à la prochaine connexion, ni sur un
 * autre appareil. Une copie dans le navigateur la masque sans attendre la
 * réponse du serveur, et la garde fermée si l'envoi échoue (hors connexion
 * dans l'application).
 */

const storageKey = (profileId: string) => `jotna:tour-done:${profileId}`;

function readLocalDone(profileId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(profileId)) === "1";
  } catch {
    return false;
  }
}

function writeLocalDone(profileId: string) {
  try {
    window.localStorage.setItem(storageKey(profileId), "1");
  } catch {
    // Navigation privée ou stockage bloqué : le drapeau serveur suffit.
  }
}

type Phase = "welcome" | "tour" | "child";

export function DashboardTour({ role }: { role: TourRole }) {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const children = useQuery(
    api.family.myChildren,
    role === "parent" ? {} : "skip",
  );
  const updateProfile = useMutation(api.profiles.updateProfile);

  const [phase, setPhase] = useState<Phase>("welcome");
  const [index, setIndex] = useState(0);
  const [closed, setClosed] = useState(false);

  // Lu au rendu : rien ne s'affiche avant que le profil arrive du serveur,
  // donc jamais pendant le rendu serveur ni avant l'hydratation.
  const localDone = profile ? readLocalDone(profile._id) : false;

  // Le parent attend la liste de ses enfants : sans elle, on ne sait pas s'il
  // faut lui proposer le premier compte.
  const ready =
    profile !== undefined &&
    profile !== null &&
    (role !== "parent" || (children !== undefined && children !== null));

  if (!ready || !profile) return null;
  if (closed || localDone || isDashboardTourDone(profile.preferences)) {
    return null;
  }

  const steps = TOUR_STEPS[role];
  const noChildYet =
    role === "parent" && Array.isArray(children) && children.length === 0;

  function finish() {
    if (!profile) return;
    setClosed(true);
    writeLocalDone(profile._id);
    updateProfile({ dashboardTourDone: true }).catch(() => {
      // Le drapeau local garde la visite fermée sur cet appareil.
    });
  }

  if (phase === "tour") {
    return (
      <SpotlightTour
        steps={steps}
        index={index}
        onIndexChange={setIndex}
        onSkip={finish}
        // Le parent sans enfant passe au formulaire ; les autres ont fini.
        onFinish={() => (noChildYet ? setPhase("child") : finish())}
        finishLabel={noChildYet ? "Créer le compte" : "Terminer"}
      />
    );
  }

  if (phase === "child") {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) finish();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créez le compte de votre premier enfant</DialogTitle>
            <DialogDescription>
              Nom et classe suffisent. Vous recevez un code de connexion à
              donner à votre enfant.
            </DialogDescription>
          </DialogHeader>
          <FirstChildForm onDone={finish} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={finish}>
              Passer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bienvenue sur Jotna School</DialogTitle>
          <DialogDescription>
            {role === "parent"
              ? "Une visite de 30 secondes vous montre où tout se trouve. Ensuite, vous créez le compte de votre premier enfant."
              : role === "student"
                ? "Pio te montre où trouver chaque chose. Ça prend 30 secondes."
                : "Une visite de 30 secondes vous montre où tout se trouve."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={finish}>
            Passer
          </Button>
          <Button type="button" onClick={() => setPhase("tour")}>
            Faire la visite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Le premier compte enfant. Même action que la page « Mes enfants »
 * (`studentAccounts.createStudent`) : le code de connexion s'affiche une fois
 * le compte créé, et « Terminer » ferme l'onboarding pour de bon.
 *
 * Le résultat vit ICI, pas dans la liste des enfants : cette liste se met à
 * jour en direct, et l'écran du code ne doit pas disparaître avec elle.
 */
function FirstChildForm({ onDone }: { onDone: () => void }) {
  const createStudent = useAction(api.studentAccounts.createStudent);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<VisibleClassName | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    loginCode: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!level) {
      setError("Choisissez la classe de votre enfant.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createStudent({ name, level });
      setCreated({ name: result.name, loginCode: result.loginCode });
    } catch (err) {
      setError(refusalMessage(err, "Le compte n'a pas pu être créé."));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-3 rounded-xl bg-lime-50 p-4 text-sm text-gray-800">
        <p>
          Le compte de <strong>{created.name}</strong> est prêt. Son code de
          connexion pour l&apos;application :
        </p>
        <CodeChip code={created.loginCode} size="lg" label="code de connexion" />
        <p className="text-xs text-gray-500">
          Retrouvez-le à tout moment dans « Mes enfants ».
        </p>
        <Button type="button" className="w-full" onClick={onDone}>
          Terminer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="text"
        required
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Prénom et nom de l'enfant"
        aria-label="Prénom et nom de l'enfant"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
      />
      <select
        required
        value={level}
        onChange={(e) => setLevel(e.target.value as VisibleClassName)}
        aria-label="Classe"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
      >
        <option value="">Classe</option>
        {VISIBLE_CLASSES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        <UserPlus />
        {busy ? "Création..." : "Créer le compte"}
      </Button>
    </form>
  );
}
