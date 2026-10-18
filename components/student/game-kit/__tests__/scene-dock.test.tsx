import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { keyboardInset, layoutViewportHeight, SceneDockProvider, useKeyboardInset, useSceneDock, visualViewportTop } from "../scene-dock";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty("scroll-padding-bottom");
});

/** Une barre qui fait ce que fait `ExerciseActions` : se téléporte dans le dock s'il existe, sinon reste en ligne. */
function Bar({ label = "Valider" }: { label?: string }) {
  const dock = useSceneDock();
  const occupy = dock?.occupy;
  useLayoutEffect(() => occupy?.(), [occupy]);
  const button = <button type="button">{label}</button>;
  if (!dock) return button;
  return dock.slot ? createPortal(button, dock.slot) : null;
}

/** Un `ResizeObserver` de poche : les tests déclenchent la mesure eux-mêmes. */
function stubResizeObserver() {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  return callbacks;
}

/** Le panneau du dock mesure `height` ; tout le reste, zéro (jsdom). */
function stubPanelHeight(height: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const h = this.hasAttribute("data-scene-dock") ? height : 0;
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: h, width: 0, height: h, toJSON: () => ({}) } as DOMRect;
  });
}

describe("SceneDockProvider — la barre collée en bas de l'écran", () => {
  it("hors de la coque, pas de dock : la barre reste en ligne", () => {
    const { container } = render(
      <div data-card>
        <Bar />
      </div>,
    );
    expect(container.querySelector("[data-card] button")).not.toBeNull();
    expect(document.querySelector("[data-scene-dock]")).toBeNull();
  });

  it("le panneau est un groupe nommé, rendu APRÈS le contenu ; vide, il est invisible et ne réserve rien", () => {
    const { container } = render(
      <SceneDockProvider data-root>
        <p>Le contenu</p>
      </SceneDockProvider>,
    );
    const root = container.querySelector<HTMLElement>("[data-root]")!;
    const panel = screen.getByRole("group", { name: "Actions de l'exercice", hidden: true });
    expect(panel.getAttribute("data-dock-empty")).toBe("1");
    expect(panel.className).toContain("invisible");
    expect(panel.className).toContain("fixed");
    expect(panel.className).not.toContain("backdrop");
    expect(root.style.getPropertyValue("--dock-h")).toBe("0px");
    // L'ordre de tabulation : le contenu, puis le dock.
    const content = screen.getByText("Le contenu");
    expect(content.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("une barre se téléporte dans l'emplacement et montre le panneau ; partie, le panneau se cache", () => {
    const { container, rerender } = render(
      <SceneDockProvider data-root>
        <div data-card>
          <Bar />
        </div>
      </SceneDockProvider>,
    );
    const panel = container.querySelector("[data-scene-dock]")!;
    expect(container.querySelector("[data-card] button")).toBeNull();
    expect(container.querySelector("[data-scene-dock-slot] button")?.textContent).toBe("Valider");
    expect(panel.getAttribute("data-dock-empty")).toBeNull();
    expect(panel.className).not.toContain("invisible");

    rerender(
      <SceneDockProvider data-root>
        <div data-card />
      </SceneDockProvider>,
    );
    expect(container.querySelector("[data-scene-dock-slot] button")).toBeNull();
    expect(panel.getAttribute("data-dock-empty")).toBe("1");
  });

  it("la hauteur du panneau est MESURÉE et publiée : `--dock-h` sur la racine, `scroll-padding-bottom` sur le document", () => {
    const callbacks = stubResizeObserver();
    stubPanelHeight(94);
    const { container, unmount } = render(
      <SceneDockProvider data-root>
        <Bar />
      </SceneDockProvider>,
    );
    const root = container.querySelector<HTMLElement>("[data-root]")!;
    expect(callbacks).toHaveLength(1);
    expect(root.style.getPropertyValue("--dock-h")).toBe("94px");
    expect(root.getAttribute("data-dock-height")).toBe("94");
    expect(document.documentElement.style.getPropertyValue("scroll-padding-bottom")).toBe("94px");

    // Le dock passe sur deux rangées (le mot « Écouter ») : la mesure suit.
    stubPanelHeight(170);
    act(() => callbacks[0]());
    expect(root.style.getPropertyValue("--dock-h")).toBe("170px");
    expect(document.documentElement.style.getPropertyValue("scroll-padding-bottom")).toBe("170px");

    unmount();
    expect(document.documentElement.style.getPropertyValue("scroll-padding-bottom")).toBe("");
  });

  it("sans occupant, la hauteur mesurée ne compte pas : `--dock-h` vaut 0", () => {
    stubResizeObserver();
    stubPanelHeight(94);
    const { container } = render(
      <SceneDockProvider data-root>
        <p>x</p>
      </SceneDockProvider>,
    );
    expect(container.querySelector<HTMLElement>("[data-root]")!.style.getPropertyValue("--dock-h")).toBe("0px");
    expect(document.documentElement.style.getPropertyValue("scroll-padding-bottom")).toBe("");
  });
});

describe("le clavier qui monte", () => {
  it("keyboardInset : ce que le clavier recouvre sans redimensionner la fenêtre (iOS), rien sinon", () => {
    // iOS : la fenêtre garde 844 px, le viewport visuel n'en montre que 544.
    expect(keyboardInset(844, { height: 544, offsetTop: 0, scale: 1 })).toBe(300);
    // La page a défilé sous le clavier : le décalage du haut compte.
    expect(keyboardInset(844, { height: 544, offsetTop: 100, scale: 1 })).toBe(200);
    // Android : la fenêtre s'est redimensionnée avec le viewport.
    expect(keyboardInset(544, { height: 544, offsetTop: 0, scale: 1 })).toBe(0);
    // Un zoom au pincement rétrécit aussi le viewport visuel : ignoré.
    expect(keyboardInset(844, { height: 422, offsetTop: 0, scale: 2 })).toBe(0);
    expect(keyboardInset(844, { height: 900, offsetTop: 0, scale: 1 })).toBe(0);
  });

  it("visualViewportTop : le décalage du viewport visuel, 0 pendant un zoom au pincement", () => {
    expect(visualViewportTop({ offsetTop: 0, scale: 1 })).toBe(0);
    // Le clavier matériel d'iOS : la barre d'accessoires de 68 px fait défiler le viewport visuel.
    expect(visualViewportTop({ offsetTop: 68, scale: 1 })).toBe(68);
    expect(visualViewportTop({ offsetTop: 68.4, scale: 1 })).toBe(68);
    expect(visualViewportTop({ offsetTop: 120, scale: 2 })).toBe(0);
  });

  it("publie le décalage du viewport visuel dans `--vv-top` (l'en-tête collant reste sous la barre d'état avec un clavier matériel)", () => {
    const viewport = Object.assign(new EventTarget(), { height: 806, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 874, configurable: true });
    const { container } = render(
      <SceneDockProvider data-root>
        <Bar />
      </SceneDockProvider>,
    );
    const root = container.querySelector<HTMLElement>("[data-root]")!;
    const panel = container.querySelector<HTMLElement>("[data-scene-dock]")!;
    // Au départ, le clavier recouvre 68 px (806 sur 874) : le dock monte.
    expect(root.style.getPropertyValue("--vv-top")).toBe("0px");
    expect(panel.getAttribute("data-keyboard-inset")).toBe("68");
    // Puis WebKit fait défiler le viewport visuel de 68 : le dock redescend
    // (inset 0), et `--vv-top` porte le décalage pour l'en-tête.
    act(() => {
      viewport.offsetTop = 68;
      viewport.dispatchEvent(new Event("scroll"));
    });
    expect(panel.getAttribute("data-keyboard-inset")).toBeNull();
    expect(root.getAttribute("data-keyboard-up")).toBeNull();
    expect(root.style.getPropertyValue("--vv-top")).toBe("68px");
    act(() => {
      viewport.height = 874;
      viewport.offsetTop = 0;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(root.style.getPropertyValue("--vv-top")).toBe("0px");
  });

  it("layoutViewportHeight : le plus grand d'innerHeight et de clientHeight (WKWebView, Safari, Android)", () => {
    const html = document.documentElement;
    const setHeights = (inner: number, client: number) => {
      Object.defineProperty(window, "innerHeight", { value: inner, configurable: true });
      Object.defineProperty(html, "clientHeight", { value: client, configurable: true });
    };
    try {
      // WKWebView de l'application, clavier levé : `innerHeight` a rétréci
      // (874 → 562), `clientHeight` garde la fenêtre ; WebKit a fait défiler le
      // viewport visuel de 312 (mesuré sur l'iPhone 17) : le dock monte de 91.
      setHeights(562, 874);
      expect(layoutViewportHeight()).toBe(874);
      expect(keyboardInset(layoutViewportHeight(), { height: 471, offsetTop: 312, scale: 1 })).toBe(91);
      // Safari, barre d'outils repliée : `innerHeight` est la grande hauteur.
      setHeights(844, 780);
      expect(layoutViewportHeight()).toBe(844);
      // Android, clavier levé : la fenêtre s'est redimensionnée, les deux suivent.
      setHeights(528, 528);
      expect(layoutViewportHeight()).toBe(528);
    } finally {
      Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });
      // @ts-expect-error : on rend sa définition d'origine (le prototype) à jsdom.
      delete html.clientHeight;
    }
  });

  it("le dock monte au-dessus du clavier d'iOS par un transform, et retire la marge de la barre d'accueil", () => {
    const viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 844, configurable: true });

    function Probe() {
      return <output data-inset>{useKeyboardInset()}</output>;
    }
    const { container } = render(
      <SceneDockProvider data-root>
        <Probe />
        <Bar />
      </SceneDockProvider>,
    );
    const root = container.querySelector<HTMLElement>("[data-root]")!;
    const panel = container.querySelector<HTMLElement>("[data-scene-dock]")!;
    expect(container.querySelector("[data-inset]")?.textContent).toBe("0");
    expect(panel.getAttribute("data-keyboard-inset")).toBeNull();
    expect(panel.style.transform).toBe("");

    act(() => {
      viewport.height = 544;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(container.querySelector("[data-inset]")?.textContent).toBe("300");
    expect(panel.getAttribute("data-keyboard-inset")).toBe("300");
    expect(panel.style.transform).toBe("translate3d(0, -300px, 0)");
    // Posé sur le clavier : plus de barre d'accueil, 12 px sous les boutons.
    expect(panel.style.paddingBottom).toBe("12px");
    // La place du clavier est réservée en bas : la page peut défiler d'autant
    // (le panneau mesure 0 dans jsdom : il ne reste que le clavier).
    expect(root.style.getPropertyValue("--dock-h")).toBe("300px");
    expect(document.documentElement.style.getPropertyValue("scroll-padding-bottom")).toBe("300px");

    // La page défile sous le clavier : le décalage suit (`scroll`).
    act(() => {
      viewport.offsetTop = 120;
      viewport.dispatchEvent(new Event("scroll"));
    });
    expect(panel.getAttribute("data-keyboard-inset")).toBe("180");

    act(() => {
      viewport.height = 844;
      viewport.offsetTop = 0;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(panel.getAttribute("data-keyboard-inset")).toBeNull();
    expect(panel.style.transform).toBe("");
    expect(root.style.getPropertyValue("--dock-h")).toBe("0px");
  });
});
