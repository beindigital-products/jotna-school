import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * LA LECTURE DE L'ÉNONCÉ ET DES PROPOSITIONS, DE BOUT EN BOUT.
 *
 * Les autres tests de la voix (`prompt-reader.test.tsx`, `TileVoice.test.tsx`,
 * `TileVoiceScreens.test.tsx`) remplacent la source des sons et le lecteur audio
 * par des doubles : ils vérifient la file, pas la chaîne. Ici tout est vrai, de
 * l'écran jusqu'au bord du réseau et du haut-parleur :
 *   l'écran de l'exercice, `useTileVoice`, `PromptReaderProvider`,
 *   `useClipSource` (les lots de tuiles, les nouvelles demandes), `voice-player`
 *   (l'élément audio unique, le refus de lecture automatique).
 * Seuls deux bords sont simulés : l'action Convex `offline/voice:prepareClips`
 * (un faux serveur qui compte ses appels simultanés) et `HTMLMediaElement`
 * (jsdom ne joue pas de son ; le test termine chaque son lui-même).
 *
 * Ce que ces tests tiennent, pour les cinq écrans à propositions : Pio dit la
 * consigne, PUIS CHAQUE PROPOSITION, dans l'ordre de l'écran, à chaque fois,
 * même quand le fournisseur refuse une synthèse, quand une action se perd, ou
 * quand le navigateur refuse la lecture automatique.
 */

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const mocks = vi.hoisted(() => ({ prepare: vi.fn() }));

vi.mock("convex/react", () => ({ useAction: () => mocks.prepare }));
vi.mock("@/components/offline/context", () => ({ useOffline: () => ({ enabled: false, connected: true }) }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

import { TILE_BATCH } from "@/components/offline/clip-source";
import { clipRequestKey, type ClipRequest } from "@/convex/offline/contract";
import DragDropExercise from "../DragDropExercise";
import FillBlankExercise from "../FillBlankExercise";
import MatchExercise from "../MatchExercise";
import OrderExercise from "../OrderExercise";
import QcmExercise from "../QcmExercise";
import { PromptReaderProvider } from "../prompt-reader";

/* ── Le faux haut-parleur ─────────────────────────────────────────────────── */

type Sound = { key: string; audio: HTMLAudioElement; ended: boolean };
const sounds: Sound[] = [];
/** Vrai tant que le navigateur refuse la lecture automatique (aucun geste encore). */
let autoplayBlocked = false;

/** `https://clip/<clé encodée>` : la clé du son, telle que le serveur l'a rendue. */
const keyOf = (src: string) => decodeURIComponent(src.replace("https://clip/", ""));

/* ── Le faux serveur ──────────────────────────────────────────────────────── */

type ServerStats = { calls: string[][]; maxInFlight: number; maxTileCallsInFlight: number };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `prepareClips` : une synthèse prend du temps, et le serveur compte ses appels
 * en cours. `refuseOnce` : les clés que le fournisseur refuse une fois (`pending`).
 * `loseTileCalls` : le nombre d'appels de tuiles perdus en vol (l'action lève).
 */
function startServer(options: { refuseOnce?: string[]; loseTileCalls?: number } = {}): ServerStats {
  const stats: ServerStats = { calls: [], maxInFlight: 0, maxTileCallsInFlight: 0 };
  const refuse = new Set(options.refuseOnce ?? []);
  let lose = options.loseTileCalls ?? 0;
  let inFlight = 0;
  let tileCalls = 0;
  mocks.prepare.mockImplementation(async ({ requests }: { requests: ClipRequest[] }) => {
    const isTile = requests[0]?.kind === "tile";
    stats.calls.push(requests.map(clipRequestKey));
    inFlight += 1;
    if (isTile) tileCalls += 1;
    stats.maxInFlight = Math.max(stats.maxInFlight, inFlight);
    stats.maxTileCallsInFlight = Math.max(stats.maxTileCallsInFlight, tileCalls);
    try {
      if (isTile && lose > 0) {
        lose -= 1;
        await wait(50);
        throw new Error("Connection lost while action was in flight");
      }
      const results = [];
      for (const request of requests) {
        await wait(isTile ? 300 : 200);
        const key = clipRequestKey(request);
        if (refuse.delete(key)) results.push({ key, status: "pending", reason: "provider_error" });
        else results.push({ key, status: "ready", clipId: `clip-${key}`, url: `https://clip/${encodeURIComponent(key)}` });
      }
      return results;
    } finally {
      inFlight -= 1;
      if (isTile) tileCalls -= 1;
    }
  });
  return stats;
}

/* ── Le déroulé ───────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  sounds.length = 0;
  autoplayBlocked = false;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    // Le silence du déblocage (`voice-player`, `unlock`) n'est pas un son de Pio.
    if (!this.src.startsWith("https://clip/")) return Promise.resolve();
    if (autoplayBlocked) return Promise.reject(Object.assign(new Error("bloqué"), { name: "NotAllowedError" }));
    sounds.push({ key: keyOf(this.src), audio: this as HTMLAudioElement, ended: false });
    return Promise.resolve();
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/**
 * Laisse Pio tout dire : termine chaque son dès qu'il joue, et s'arrête après
 * cinq secondes de silence (plus long que les nouvelles demandes au serveur).
 */
async function letPioSpeak() {
  let silence = 0;
  for (let step = 0; step < 200 && silence < 10; step++) {
    await flush(500);
    const last = sounds[sounds.length - 1];
    if (last && !last.ended) {
      for (const sound of sounds) sound.ended = true;
      await act(async () => {
        last.audio.onended?.(new Event("ended"));
      });
      silence = 0;
    } else {
      silence += 1;
    }
  }
}

const said = () => sounds.map((sound) => sound.key);
const tiles = (texts: string[]) => texts.map((text) => `tile:${text}`);

function inSession(exerciseId: string, node: ReactNode) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} tileVoice>
      {node}
    </PromptReaderProvider>
  );
}

const common = { onSubmit: () => {}, disabled: false, isCorrect: null } as const;

/** Les cinq écrans à propositions, et ce que Pio doit dire sur chacun, dans l'ordre. */
const SCREENS: { name: string; build: (tag: string) => { node: ReactNode; expected: string[] } }[] = [
  {
    name: "QCM",
    build: (tag) => {
      const options = [`le chat ${tag}`, `le chien ${tag}`, `la girafe ${tag}`, `le lion ${tag}`];
      return {
        node: <QcmExercise prompt="Quel animal miaule ?" payload={{ options, correctIndex: 0 }} {...common} />,
        expected: tiles(options),
      };
    },
  },
  {
    name: "association",
    build: (tag) => {
      const left = [`la vache ${tag}`, `la poule ${tag}`, `l'abeille ${tag}`];
      const right = [`le lait ${tag}`, `l'œuf ${tag}`, `le miel ${tag}`];
      return {
        node: <MatchExercise prompt="Associe chaque animal à ce qu'il donne." payload={{ left, right }} {...common} />,
        expected: tiles([...left, ...right]),
      };
    },
  },
  {
    name: "mise en ordre",
    build: (tag) => {
      const correctSequence = [`le matin ${tag}`, `le midi ${tag}`, `le soir ${tag}`];
      return {
        node: <OrderExercise prompt="Remets la journée dans l'ordre." payload={{ correctSequence }} {...common} />,
        expected: tiles(correctSequence),
      };
    },
  },
  {
    name: "glisser-déposer",
    build: (tag) => {
      const zones = [`la ferme ${tag}`, `la forêt ${tag}`];
      const items = [`la vache ${tag}`, `le lion ${tag}`, `la poule ${tag}`];
      return {
        node: (
          <DragDropExercise
            prompt="Range chaque animal là où il vit."
            payload={{ zones, items: items.map((text) => ({ text })) }}
            {...common}
          />
        ),
        expected: tiles([...items, ...zones]),
      };
    },
  },
  {
    name: "phrase à trous",
    build: (tag) => {
      const text = `Le ___ miaule ${tag}.`;
      const options = [`chat ${tag}`, `chien ${tag}`, `lion ${tag}`];
      return {
        node: <FillBlankExercise prompt="Complète la phrase." payload={{ text, blanks: [{ options }] }} {...common} />,
        expected: tiles([text, ...options]),
      };
    },
  },
];

describe.each(SCREENS)("de bout en bout : $name", ({ name, build }) => {
  const tag = (suffix: string) => `${name.replace(/[^a-z]/gi, "")}-${suffix}`;

  it("dit la consigne, puis chaque proposition, dans l'ordre de l'écran", async () => {
    const stats = startServer();
    const { node, expected } = build(tag("a"));
    render(inSession(`ex-${tag("a")}`, node));
    await letPioSpeak();

    expect(said()).toEqual([`prompt:ex-${tag("a")}`, ...expected]);
    // Deux synthèses en même temps au plus (la consigne et un lot de tuiles), un
    // seul appel de tuiles à la fois, et des lots bornés : le fournisseur ne
    // reçoit jamais la rafale qui lui faisait refuser des propositions.
    expect(stats.maxInFlight).toBeLessThanOrEqual(2);
    expect(stats.maxTileCallsInFlight).toBe(1);
    for (const call of stats.calls) expect(call.length).toBeLessThanOrEqual(TILE_BATCH);
    // Chaque son n'est demandé qu'une fois.
    const asked = stats.calls.flat();
    expect(new Set(asked).size).toBe(asked.length);
  });

  it("dit quand même toutes les propositions quand le fournisseur en refuse une première fois", async () => {
    const { node, expected } = build(tag("b"));
    // La première et la dernière proposition : `pending`, puis prêtes à la seconde demande.
    const stats = startServer({ refuseOnce: [expected[0], expected[expected.length - 1]] });
    render(inSession(`ex-${tag("b")}`, node));
    await letPioSpeak();

    expect(said()).toEqual([`prompt:ex-${tag("b")}`, ...expected]);
    expect(stats.maxTileCallsInFlight).toBe(1);
  });

  it("dit quand même toutes les propositions quand un appel se perd en vol", async () => {
    const stats = startServer({ loseTileCalls: 1 });
    const { node, expected } = build(tag("c"));
    render(inSession(`ex-${tag("c")}`, node));
    await letPioSpeak();

    expect(said()).toEqual([`prompt:ex-${tag("c")}`, ...expected]);
    expect(stats.maxTileCallsInFlight).toBe(1);
  });

  it("relit tout au premier geste quand le navigateur a refusé la lecture automatique", async () => {
    startServer();
    const { node, expected } = build(tag("d"));
    autoplayBlocked = true;
    render(inSession(`ex-${tag("d")}`, node));
    await letPioSpeak();
    // Refusée : rien n'a joué, et rien ne joue tant que l'enfant ne touche pas la page.
    expect(said()).toEqual([]);

    // L'enfant touche l'écran, n'importe où : le navigateur accepte désormais.
    autoplayBlocked = false;
    await act(async () => {
      fireEvent.click(document.body);
    });
    await letPioSpeak();
    expect(said()).toEqual([`prompt:ex-${tag("d")}`, ...expected]);

    // Une seule fois : un autre toucher ailleurs ne relance pas la lecture.
    await act(async () => {
      fireEvent.click(document.body);
    });
    await letPioSpeak();
    expect(said()).toHaveLength(expected.length + 1);
  });

  it("« Écouter » redit tout, sans rien redemander au serveur", async () => {
    const stats = startServer();
    const { node, expected } = build(tag("e"));
    render(inSession(`ex-${tag("e")}`, node));
    await letPioSpeak();
    const calls = stats.calls.length;
    sounds.length = 0;

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Écouter l'énoncé/ }));
    });
    await letPioSpeak();
    expect(said()).toEqual([`prompt:ex-${tag("e")}`, ...expected]);
    expect(stats.calls).toHaveLength(calls);
  });
});

describe("de bout en bout : le toucher", () => {
  it("après un refus de lecture automatique, toucher une proposition la dit, elle seule", async () => {
    startServer();
    const options = ["le chat touche", "le chien touche", "la girafe touche"];
    autoplayBlocked = true;
    render(
      inSession(
        "ex-touche",
        <QcmExercise prompt="Quel animal miaule ?" payload={{ options, correctIndex: 0 }} {...common} />,
      ),
    );
    await letPioSpeak();
    expect(said()).toEqual([]);

    // Le premier geste de l'enfant est un toucher sur une tuile : c'est elle qu'il veut entendre.
    autoplayBlocked = false;
    await act(async () => {
      fireEvent.click(document.querySelector('[data-option="1"]') as HTMLElement);
    });
    await letPioSpeak();
    expect(said()).toEqual(["tile:le chien touche"]);
  });

  it("toucher une proposition pendant la lecture coupe la file et dit cette proposition", async () => {
    startServer();
    const options = ["le chat coupe", "le chien coupe", "la girafe coupe"];
    render(
      inSession(
        "ex-coupe",
        <QcmExercise prompt="Quel animal miaule ?" payload={{ options, correctIndex: 0 }} {...common} />,
      ),
    );
    // La consigne joue : l'enfant n'attend pas.
    await flush(600);
    expect(said()).toEqual(["prompt:ex-coupe"]);
    await act(async () => {
      fireEvent.click(document.querySelector('[data-option="2"]') as HTMLElement);
    });
    await letPioSpeak();
    expect(said()).toEqual(["prompt:ex-coupe", "tile:la girafe coupe"]);
  });
});
