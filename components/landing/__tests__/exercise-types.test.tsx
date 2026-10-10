import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ExerciseTypes } from "../exercise-types";
import { BANK as mathematiques } from "../demo/bank/mathematiques";

// Les confettis dessinent sur un canvas : jsdom n'en a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

/**
 * LES OBSERVATEURS DE LA PAGE : les cartes apparaissent au défilement
 * (`whileInView`) et la section charge ses exercices quand on s'en approche.
 * jsdom n'en a pas ; celui-ci se déclenche à la demande.
 */
const watchers: { callback: IntersectionObserverCallback; margin: string }[] = [];

beforeAll(async () => {
  // Le premier chargement du lot des cartes compile les écrans de l'élève : une fois pour tout le fichier.
  await import("../demo/demo-cards");
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        watchers.push({ callback, margin: options?.rootMargin ?? "" });
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}, 60_000);
beforeEach(() => {
  watchers.length = 0;
});
afterEach(cleanup);

/** Le visiteur arrive près de la section : seul l'observateur de chargement se déclenche. */
function approachSection() {
  act(() => {
    for (const watcher of watchers.filter((entry) => entry.margin === "900px 0px")) {
      watcher.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}

/** Le premier chargement du lot des cartes compile les écrans de l'élève : laisse-lui le temps. */
const LOAD = { timeout: 20_000 };

const TYPE_TITLES = {
  qcm: "Questions à choix multiples",
  dragDrop: "Classer par le geste",
  match: "Relier les paires",
  order: "Remettre en ordre",
  shortAnswer: "Écrire la réponse",
  fillBlank: "Compléter la phrase",
};
const ALL_SIX = Object.values(TYPE_TITLES);
const NO_SHORT_ANSWER = ALL_SIX.filter((title) => title !== TYPE_TITLES.shortAnswer);
/** Les mathématiques n'ont pas de phrase à trous : un calcul à trou s'y écrit en réponse courte. */
const MATHS_CLASSIC = ALL_SIX.filter((title) => title !== TYPE_TITLES.fillBlank);

const panel = () => screen.getByRole("tabpanel");
/** Le titre de chaque carte : le groupe est nommé par son titre (les écrans d'exercice ont d'autres titres). */
const cardTitles = () =>
  within(panel())
    .getAllByRole("group")
    .map((card) => document.getElementById(card.getAttribute("aria-labelledby") ?? "")?.textContent);
/** « En CE2 : 6 types d'exercices » (les écrans de jeu ont leurs propres zones d'annonce). */
const countPill = () => within(panel()).getByText(/^En (CI|CP|CE1|CE2|CM1|CM2) : /).textContent;
/** Un geste du visiteur : choisir une matière lance le chargement des exercices, qu'on attend. */
const gesture = (action: () => void) =>
  act(async () => {
    action();
  });
const chooseSubject = (name: string) => gesture(() => fireEvent.click(screen.getByRole("tab", { name })));
const chooseClass = (name: string) =>
  gesture(() => fireEvent.click(screen.getByRole("radio", { name: new RegExp(`^${name}`) })));
const press = (element: HTMLElement, key: string) => gesture(() => fireEvent.keyDown(element, { key }));
const selectedClass = () => screen.getByRole("radio", { checked: true }).textContent;

describe("la section « Exercices » : une matière, une classe, des exercices à jouer", () => {
  it("présente les huit matières en onglets, le français d'abord", () => {
    render(<ExerciseTypes />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Français",
      "Mathématiques",
      "Éveil scientifique",
      "Histoire",
      "Géographie",
      "Instruction civique",
      "Éducation artistique",
      "Anglais",
    ]);
    expect(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true")).toEqual([tabs[0]]);
  });

  it("propose les six classes du CI au CM2, avec l'âge, et commence au CE2", () => {
    render(<ExerciseTypes />);
    const group = screen.getByRole("radiogroup", { name: "Classe de votre enfant" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual([
      "CI5-6 ans",
      "CP6-7 ans",
      "CE17-8 ans",
      "CE28-9 ans",
      "CM19-10 ans",
      "CM210-11 ans",
    ]);
    expect(selectedClass()).toBe("CE28-9 ans");
  });

  it("montre au français de CE2 ses six types d'exercices, sans jeu", () => {
    render(<ExerciseTypes />);
    expect(cardTitles()).toEqual(ALL_SIX);
    expect(countPill()).toBe("En CE2 : 6 types d'exercices");
    expect(within(panel()).queryByText("Les jeux")).toBeNull();
  });

  it("retire la réponse courte au CI : l'enfant n'écrit pas encore au clavier", async () => {
    render(<ExerciseTypes />);
    await chooseClass("CI");
    expect(cardTitles()).toEqual(NO_SHORT_ANSWER);
    expect(countPill()).toBe("En CI : 5 types d'exercices");
    await chooseClass("CP");
    expect(cardTitles()).toEqual(ALL_SIX);
  });

  it("change de jeux avec la classe : les mathématiques ont deux jeux au CE2, un seul au CM2", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Mathématiques");
    expect(cardTitles()).toEqual([...MATHS_CLASSIC, "Continuer la suite", "Dessiner sur quadrillage"]);
    expect(countPill()).toBe("En CE2 : 5 types d'exercices · 2 types de jeux");
    expect(cardTitles()).not.toContain(TYPE_TITLES.fillBlank);

    await chooseClass("CM2");
    expect(cardTitles()).toContain("Dessiner sur quadrillage");
    expect(cardTitles()).not.toContain("Continuer la suite");
    expect(countPill()).toBe("En CM2 : 5 types d'exercices · 1 type de jeu");
    expect(within(panel()).getByText("Les jeux")).toBeTruthy();
  });

  it("n'a pas de jeu où le programme n'en a pas, et n'affiche alors aucune rubrique « Les jeux »", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Géographie");
    await chooseClass("CE1");
    expect(cardTitles()).toEqual(ALL_SIX);
    expect(within(panel()).queryByText("Les jeux")).toBeNull();
    expect(within(panel()).queryByText("Les exercices")).toBeNull();

    await chooseClass("CI");
    expect(countPill()).toBe("En CI : 5 types d'exercices · 1 type de jeu");
  });

  it("garde l'écoute et l'atelier des couleurs pour l'éducation artistique du CI", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Éducation artistique");
    await chooseClass("CI");
    expect(cardTitles()).toContain("Écouter et reconnaître");
    expect(cardTitles()).toContain("L'atelier des couleurs");
    expect(cardTitles()).toHaveLength(5 + 4);

    await chooseSubject("Histoire");
    expect(cardTitles()).toEqual(NO_SHORT_ANSWER);
  });

  it("garde la classe choisie quand on change de matière", async () => {
    render(<ExerciseTypes />);
    await chooseClass("CM1");
    await chooseSubject("Histoire");
    expect(selectedClass()).toBe("CM19-10 ans");
    expect(countPill()).toBe("En CM1 : 6 types d'exercices");
  });

  it("dit aux parents des plus petits que Pio lit les consignes dans l'application", async () => {
    render(<ExerciseTypes />);
    expect(screen.queryByText(/Pio lit chaque consigne/)).toBeNull();

    await chooseClass("CP");
    expect(panel().textContent).toContain("Au CP, l'enfant apprend à lire");
    expect(panel().textContent).toContain("Pio lit chaque consigne à voix haute");
    expect(panel().textContent).not.toContain("au clavier");

    await chooseClass("CI");
    expect(panel().textContent).toContain("Au CI, l'enfant apprend à lire");
    expect(panel().textContent).toContain("aucune réponse n'est à taper au clavier");

    await chooseClass("CE1");
    expect(screen.queryByText(/Pio lit chaque consigne/)).toBeNull();
  });

  it("relie le panneau à l'onglet choisi", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Anglais");
    const selected = screen.getByRole("tab", { selected: true });
    expect(selected.textContent).toBe("Anglais");
    expect(panel().getAttribute("aria-labelledby")).toBe(selected.id);
    expect(within(panel()).getByRole("heading", { level: 3 }).textContent).toBe("Anglais");
  });

  it("se parcourt au clavier : les matières par flèches, Début et Fin", async () => {
    render(<ExerciseTypes />);
    const tablist = screen.getByRole("tablist", { name: "Matières" });

    await press(tablist, "ArrowRight");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Mathématiques");

    await press(tablist, "End");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Anglais");

    await press(tablist, "ArrowRight");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Français");

    await press(tablist, "ArrowLeft");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Anglais");

    await press(tablist, "Home");
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Français");
  });

  it("se parcourt au clavier : les classes comme un groupe de boutons radio", async () => {
    render(<ExerciseTypes />);
    const group = screen.getByRole("radiogroup", { name: "Classe de votre enfant" });

    await press(group, "ArrowRight");
    expect(selectedClass()).toBe("CM19-10 ans");

    await press(group, "End");
    expect(selectedClass()).toBe("CM210-11 ans");

    await press(group, "ArrowRight");
    expect(selectedClass()).toBe("CI5-6 ans");

    await press(group, "ArrowLeft");
    expect(selectedClass()).toBe("CM210-11 ans");

    await press(group, "Home");
    expect(selectedClass()).toBe("CI5-6 ans");

    // Une autre touche ne change rien.
    await press(group, "a");
    expect(selectedClass()).toBe("CI5-6 ans");
  });

  it("ne laisse qu'un onglet et qu'une classe dans l'ordre de tabulation", () => {
    render(<ExerciseTypes />);
    expect(screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    expect(screen.getAllByRole("radio").filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
  });

  it("dit comment se jouent les cartes : l'erreur est permise, Pio encourage, les indices s'ouvrent", () => {
    render(<ExerciseTypes />);
    expect(panel().textContent).toContain("Pio encourage, un indice s'ouvre après chaque erreur");
    expect(panel().textContent).toContain("la bonne réponse s'affiche au troisième essai raté");
  });

  it("invite à s'inscrire, sans rien promettre de ce qui n'est pas enregistré ici", () => {
    render(<ExerciseTypes />);
    const link = screen.getByRole("link", { name: "S'inscrire" });
    expect(link.getAttribute("href")).toBe("/register");
    expect(screen.getByText(/Rien n'est enregistré ici/)).toBeTruthy();
  });
});

describe("la section « Exercices » : les exercices jouables arrivent à la demande", () => {
  const skeletons = (container: HTMLElement) => container.querySelectorAll("[aria-hidden].animate-pulse");

  it("montre d'abord les cartes vides de la classe, et charge les exercices quand le visiteur approche", async () => {
    const { container } = render(<ExerciseTypes />);
    // Le pré-rendu : une carte vide par type, pas un seul écran d'exercice.
    expect(skeletons(container)).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "Valider" })).toBeNull();

    approachSection();
    await waitFor(() => expect(skeletons(container)).toHaveLength(0), LOAD);
  });

  it("charge tout de suite quand le visiteur choisit une matière", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Mathématiques");
    const qcm = mathematiques.CE2.find((item) => item.type === "qcm")!;
    expect(await screen.findByText(qcm.prompt, {}, LOAD)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Valider" }).length).toBeGreaterThan(0);
  });

  it("change d'exercices avec la classe : ceux du CP, plus ceux du CE2", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Mathématiques");
    const ce2 = mathematiques.CE2.find((item) => item.type === "qcm")!;
    const cp = mathematiques.CP.find((item) => item.type === "qcm")!;
    await screen.findByText(ce2.prompt, {}, LOAD);

    await chooseClass("CP");
    expect(await screen.findByText(cp.prompt, {}, LOAD)).toBeTruthy();
    expect(screen.queryByText(ce2.prompt)).toBeNull();
    // Le thème du programme et le niveau de l'exemple sont dits sur la carte.
    expect(within(panel()).getByText(cp.topic)).toBeTruthy();
  });

  it("étiquette chaque exercice de sa thématique et de son niveau", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Mathématiques");
    const qcm = mathematiques.CE2.find((item) => item.type === "qcm")!;
    await screen.findByText(qcm.prompt, {}, LOAD);
    expect(within(panel()).getByText(qcm.topic)).toBeTruthy();
    // « Découverte » pour un exercice de niveau 1.
    expect(within(panel()).getAllByText("Découverte").length).toBeGreaterThan(0);
  });

  it("se joue : une bonne réponse est fêtée, sans compte ni réseau", async () => {
    render(<ExerciseTypes />);
    await chooseSubject("Mathématiques");
    const qcm = mathematiques.CE2.find((item) => item.type === "qcm")!;
    const card = (await screen.findByText(qcm.prompt, {}, LOAD)).closest("div.space-y-3")!;
    const scope = within(card as HTMLElement);

    fireEvent.click(scope.getByRole("button", { name: /^D8$/ }));
    fireEvent.click(scope.getByRole("button", { name: "Valider" }));
    expect(scope.getByRole("status").querySelector("img")?.getAttribute("src")).toBe("/images/pio/mini/cheer.webp");
  });
});
