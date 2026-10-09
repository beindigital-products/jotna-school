import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useServerFormSync } from "../use-server-form-sync";

type Settings = { budget: number; economy: boolean };
const keyOf = (s: Settings) => JSON.stringify([s.budget, s.economy]);

function setup(initial: Settings | null | undefined) {
  const apply = vi.fn();
  const view = renderHook(
    ({ data }: { data: Settings | null | undefined }) =>
      useServerFormSync(data, keyOf, apply),
    { initialProps: { data: initial } },
  );
  return { apply, view };
}

describe("useServerFormSync", () => {
  it("attend les données, puis les applique une fois à leur arrivée", () => {
    const { apply, view } = setup(undefined);
    expect(apply).not.toHaveBeenCalled();

    view.rerender({ data: { budget: 250, economy: true } });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith({ budget: 250, economy: true });
  });

  it("applique des données déjà en cache au premier rendu", () => {
    const { apply } = setup({ budget: 100, economy: false });
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("ignore une nouvelle référence aux mêmes valeurs", () => {
    const { apply, view } = setup({ budget: 100, economy: false });
    view.rerender({ data: { budget: 100, economy: false } });
    view.rerender({ data: { budget: 100, economy: false } });
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("applique de nouveau quand les valeurs du serveur changent", () => {
    const { apply, view } = setup({ budget: 100, economy: false });
    view.rerender({ data: { budget: 300, economy: false } });
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenLastCalledWith({ budget: 300, economy: false });
  });

  it("ne fait rien quand le document n'existe pas", () => {
    const { apply } = setup(null);
    expect(apply).not.toHaveBeenCalled();
  });
});
