import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { pioSays } from "@/lib/pioCopy";
import { LostTrail } from "../lost-trail";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe("LostTrail — le sentier perdu", () => {
  it("dit ce qui manque dans la voix de Pio et rend deux sorties", () => {
    render(<LostTrail kind="topic" />);
    expect(screen.getByText(pioSays.lostTrail.topic.title)).toBeTruthy();
    expect(screen.getByText(pioSays.lostTrail.topic.bubble)).toBeTruthy();
    expect(screen.getByRole("img", { name: "Pio réfléchit" })).toBeTruthy();
    expect(screen.getByRole("link", { name: pioSays.lostTrail.toMap }).getAttribute("href")).toBe("/student/map");
    expect(screen.getByRole("link", { name: pioSays.lostTrail.toCamp }).getAttribute("href")).toBe("/student/home");
  });

  it("un monde absent a son propre titre", () => {
    render(<LostTrail kind="world" />);
    expect(screen.getByText(pioSays.lostTrail.world.title)).toBeTruthy();
  });
});
