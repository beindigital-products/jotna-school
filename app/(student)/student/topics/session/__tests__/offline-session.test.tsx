import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { OfflineSession } from "../offline-session";

/**
 * LA SÉANCE SUR L'APPAREIL OUVRE LA PORTE DES IMAGES DE TUILE POUR LE CI, ET POUR LUI SEUL.
 *
 * `offline-session.tsx` entoure l'exercice de `<ItemPicturesProvider enabled={isPictureTileClass(classe)}>`,
 * avec la classe que lit déjà le lecteur de consignes : celle du profil de l'enfant, à défaut celle
 * de la thématique. Ce test joue la vraie séance (le paquet de la classe remplacé par un modèle
 * fixe d'un exercice) et remplace seulement l'écran de l'exercice par une sonde qui lit la porte.
 */

// Les entrées de la carte et de la bulle sont animées : dans un test, d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** Le modèle que la séance lit, que chaque test remplit. */
const device = vi.hoisted(() => ({ model: null as unknown }));
/** Le lecteur de consigne lit à l'arrivée de la carte (CI et CP) : il cherche son clip, et n'en trouve pas. */
const noClip = vi.hoisted(() => async () => null);
const offline = vi.hoisted(() => ({
  engine: null,
  sync: null,
  connected: false,
  confirmed: false,
  enabled: true,
  requestSync: () => {},
}));
const studentActions = vi.hoisted(() => ({ setSoundEnabled: () => {} }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams("id=topic-1&palier=1"),
}));
vi.mock("convex/react", () => ({
  useAction: () => vi.fn(),
  useConvex: () => ({ query: vi.fn() }),
}));
vi.mock("@/components/offline/context", () => ({
  useOffline: () => offline,
  useOfflineModel: () => device.model,
}));
vi.mock("@/hooks/use-student-data", () => ({
  useSoundPreference: () => null,
  useStudentActions: () => studentActions,
}));
vi.mock("@/lib/offline/engine", () => ({ newSessionId: () => "session-brouillon" }));
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
// L'écran de l'exercice : une sonde qui dit si la porte des images est ouverte.
vi.mock("@/components/student/game/session-screens", async (importOriginal) => {
  const { useItemPicturesEnabled } = await import("@/components/exercises/item-pictures");
  return {
    ...(await importOriginal<typeof import("@/components/student/game/session-screens")>()),
    ExerciseRenderer: () => <p data-testid="porte">{useItemPicturesEnabled() ? "images" : "sans images"}</p>,
  };
});

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  device.model = null;
});

/** Le paquet d'un palier d'un exercice, pour un enfant de `profile` sur une thématique de `topic`. */
function modelFor(profile: string | undefined, topic: string | undefined) {
  return {
    profile: { class: profile },
    hasContent: true,
    topicsById: new Map([["topic-1", { _id: "topic-1", name: "Trier et ranger", subjectId: "subject-1", class: topic }]]),
    palierById: new Map([["palier-1", { _id: "palier-1", topicId: "topic-1", palierIndex: 1, exerciseIds: ["exo-1"] }]]),
    exerciseById: new Map([
      [
        "exo-1",
        {
          _id: "exo-1",
          palierId: "palier-1",
          order: 0,
          type: "qcm",
          prompt: "Quel animal miaule ?",
          payload: { options: ["Lion", "Poule", "Chat", "Âne"], correctIndex: 2 },
          hints: [],
          explanation: null,
        },
      ],
    ]),
    attempts: [],
    sessions: [],
  };
}

/** Joue la séance d'un enfant de cette classe (et d'une thématique de cette classe) jusqu'au premier exercice. */
function door(profile: string | undefined, topic: string | undefined = profile) {
  device.model = modelFor(profile, topic);
  render(<OfflineSession />);
  return screen.getByTestId("porte").textContent;
}

describe("la séance sur l'appareil et les images de tuile", () => {
  it("ouvre la porte pour un enfant de CI", () => {
    expect(door("CI")).toBe("images");
  });

  it("la ferme pour un enfant de CP et pour un enfant de CE1", () => {
    expect(door("CP")).toBe("sans images");
    cleanup();
    expect(door("CE1")).toBe("sans images");
  });

  it("la ferme pour les classes plus grandes", () => {
    for (const klass of ["CE2", "CM1", "CM2"]) {
      expect(door(klass), klass).toBe("sans images");
      cleanup();
    }
  });

  it("lit la classe de l'enfant d'abord : un CP sur une thématique de CI ne voit pas d'images", () => {
    expect(door("CP", "CI")).toBe("sans images");
  });

  it("à défaut de classe sur le profil, lit celle de la thématique, comme le lecteur de consignes", () => {
    expect(door(undefined, "CI")).toBe("images");
    cleanup();
    expect(door(undefined, "CE1")).toBe("sans images");
  });
});
