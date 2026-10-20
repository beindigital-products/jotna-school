import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { OnlineSession } from "../online-session";

/**
 * LA SÉANCE EN LIGNE OUVRE LA PORTE DES IMAGES DE TUILE POUR LE CI, ET POUR LUI SEUL.
 *
 * `online-session.tsx` entoure l'exercice de `<ItemPicturesProvider enabled={isPictureTileClass(classe)}>`,
 * avec la classe que lit déjà le lecteur de consignes : celle de l'enfant, à défaut celle de la
 * thématique. Ce test joue la vraie séance (Convex remplacé par des données fixes) et remplace
 * seulement l'écran de l'exercice par une sonde qui lit la porte.
 */

// Les entrées de la carte et de la bulle sont animées : dans un test, d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** La classe de l'enfant, celle de la thématique et sa fiche du programme, que chaque test choisit. */
const classes = vi.hoisted(() => ({
  profile: "CI" as string | undefined,
  topic: "CI" as string | undefined,
  programmeKey: undefined as string | undefined,
}));
/** Le lecteur de consigne lit à l'arrivée de la carte (CI et CP) : il cherche son clip, et n'en trouve pas. */
const noClip = vi.hoisted(() => async () => null);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams("id=topic-1&palier=1"),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const topic = () => ({
    _id: "topic-1",
    name: "Trier et ranger",
    subjectId: "subject-1",
    class: classes.topic,
    programmeKey: classes.programmeKey,
  });
  const exercise = {
    _id: "exo-1",
    type: "qcm",
    prompt: "Quel animal miaule ?",
    payload: { options: ["Lion", "Poule", "Chat", "Âne"] },
    hintsAvailable: 0,
    palierAttemptId: "attempt-1",
    isVariation: false,
  };
  const progress = { currentIndex: 0, completedCount: 0, totalCount: 1, failedAttemptsThisExo: 0, hintsUsedThisExo: 0 };
  // Les mêmes objets d'un rendu à l'autre : la séance s'en sert comme dépendances d'effets.
  const stable = new Map<string, unknown>();
  const once = <T,>(key: string, make: () => T): T => {
    if (!stable.has(key)) stable.set(key, make());
    return stable.get(key) as T;
  };
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      if (args === "skip") return undefined;
      switch (getFunctionName(ref)) {
        case "profiles:getCurrentProfile":
          return { class: classes.profile };
        case "topics:getById":
          return topic();
        case "paliers/index:getExercisesForPalier":
          return once("exercises", () => [exercise]);
        case "palierAttempts:getProgressForPalierAttempt":
          return progress;
        default:
          return null;
      }
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) =>
      getFunctionName(ref) === "paliers/index:startPalierAttempt" ? async () => "attempt-1" : vi.fn(),
    useAction: (ref: Parameters<typeof getFunctionName>[0]) =>
      getFunctionName(ref) === "paliers/index:getBucket" ? async () => ({ palierId: "palier-1" }) : vi.fn(),
  };
});

vi.mock("@/components/offline/context", () => ({
  useOffline: () => ({ enabled: false, engine: null, sync: null, connected: false, confirmed: false, requestSync: vi.fn() }),
}));
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => noClip }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
// Pas de Howler dans jsdom : le son est un module muet.
vi.mock("@/lib/sounds", () => ({
  preloadAll: vi.fn(),
  getSoundEnabledLocal: () => false,
  setSoundEnabledLocal: vi.fn(),
  play: vi.fn(),
  playCorrect: vi.fn(),
}));
// L'écran de l'exercice : une sonde qui dit si la porte des images et celle de la voix des tuiles sont ouvertes.
vi.mock("@/components/student/game/session-screens", async (importOriginal) => {
  const { useItemPicturesEnabled } = await import("@/components/exercises/item-pictures");
  const { usePromptReader } = await import("@/components/exercises/prompt-reader");
  return {
    ...(await importOriginal<typeof import("@/components/student/game/session-screens")>()),
    ExerciseRenderer: () => (
      <>
        <p data-testid="porte">{useItemPicturesEnabled() ? "images" : "sans images"}</p>
        <p data-testid="voix">{usePromptReader()?.tileVoice ? "voix des tuiles" : "sans voix des tuiles"}</p>
      </>
    ),
  };
});

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  classes.profile = "CI";
  classes.topic = "CI";
  classes.programmeKey = undefined;
});

/** Joue la séance d'un enfant de cette classe (et d'une thématique de cette classe) jusqu'au premier exercice. */
async function door(profile: string | undefined, topic: string | undefined = profile) {
  classes.profile = profile;
  classes.topic = topic;
  render(<OnlineSession />);
  return (await screen.findByTestId("porte")).textContent;
}

/** La même séance, vue par la porte de la voix des tuiles (`isTileVoiceClass`, hors anglais). */
async function voice(profile: string | undefined, topic: string | undefined = profile, programmeKey?: string) {
  classes.profile = profile;
  classes.topic = topic;
  classes.programmeKey = programmeKey;
  render(<OnlineSession />);
  return (await screen.findByTestId("voix")).textContent;
}

describe("la séance en ligne et les images de tuile", () => {
  it("ouvre la porte pour un enfant de CI", async () => {
    expect(await door("CI")).toBe("images");
  });

  it("la ferme pour un enfant de CP et pour un enfant de CE1", async () => {
    expect(await door("CP")).toBe("sans images");
    cleanup();
    expect(await door("CE1")).toBe("sans images");
  });

  it("la ferme pour les classes plus grandes", async () => {
    for (const klass of ["CE2", "CM1", "CM2"]) {
      expect(await door(klass), klass).toBe("sans images");
      cleanup();
    }
  });

  it("lit la classe de l'enfant d'abord : un CP sur une thématique de CI ne voit pas d'images", async () => {
    expect(await door("CP", "CI")).toBe("sans images");
  });

  it("à défaut de classe sur le profil, lit celle de la thématique, comme le lecteur de consignes", async () => {
    expect(await door(undefined, "CI")).toBe("images");
    cleanup();
    expect(await door(undefined, "CE1")).toBe("sans images");
  });
});

describe("la séance en ligne et la voix des tuiles", () => {
  it("l'allume pour un enfant de CI", async () => {
    expect(await voice("CI")).toBe("voix des tuiles");
  });

  it("l'éteint pour un enfant de CP (qui a pourtant la voix des consignes) et pour les classes plus grandes", async () => {
    expect(await voice("CP")).toBe("sans voix des tuiles");
    for (const klass of ["CE1", "CE2", "CM2"]) {
      cleanup();
      expect(await voice(klass), klass).toBe("sans voix des tuiles");
    }
  });

  it("lit la classe de l'enfant d'abord : un CP sur une thématique de CI ne l'entend pas", async () => {
    expect(await voice("CP", "CI")).toBe("sans voix des tuiles");
  });

  it("à défaut de classe sur le profil, lit celle de la thématique", async () => {
    expect(await voice(undefined, "CI")).toBe("voix des tuiles");
    cleanup();
    expect(await voice(undefined, "CE1")).toBe("sans voix des tuiles");
  });

  it("l'éteint en anglais : la fiche du programme (« an- ») le dit", async () => {
    expect(await voice("CI", "CI", "an-ci-colours")).toBe("sans voix des tuiles");
    cleanup();
    expect(await voice("CI", "CI", "fr-ci-lettres")).toBe("voix des tuiles");
  });
});
