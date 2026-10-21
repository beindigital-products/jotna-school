import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import ExercisePrompt, { promptSizeClass } from "../ExercisePrompt";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const NBSP = "\u00a0";

/**
 * Le texte affiché avec ses espaces insécables remises en espaces ordinaires :
 * l'écran met des insécables avant « ? », « ! », « : », « ; » (voir
 * « l'espace avant la ponctuation haute » plus bas), et ces tests-ci gardent
 * l'autre promesse, celle de ne perdre aucun mot.
 */
const withoutNbsp = (text: string | null | undefined) => (text ?? "").replaceAll(NBSP, " ");

/** Les paragraphes affichés, et si l'un d'eux est la carte de la citation. */
function shown(prompt: string) {
  const { container } = render(<ExercisePrompt prompt={prompt} />);
  const paragraphs = [...container.querySelectorAll("p")];
  const card = paragraphs.find((p) => p.hasAttribute("data-prompt-quote"));
  return {
    texts: paragraphs.map((p) => withoutNbsp(p.textContent)),
    card: card ? withoutNbsp(card.textContent) : null,
  };
}

describe("la consigne d'un exercice : on n'en perd jamais un mot", () => {
  it("met en carte la citation qui TERMINE la consigne (guillemets français)", () => {
    const { texts, card } = shown("Trouve le temps du verbe : « Aujourd'hui, nous jouons. »");
    expect(texts).toEqual(["Trouve le temps du verbe", "Aujourd'hui, nous jouons."]);
    expect(card).toBe("Aujourd'hui, nous jouons.");
  });

  it("met en carte la citation entre guillemets droits, même avec une apostrophe dedans", () => {
    const { texts, card } = shown('Trouve le temps du verbe : "Aujourd\'hui, nous jouons."');
    expect(texts).toEqual(["Trouve le temps du verbe", "Aujourd'hui, nous jouons."]);
    expect(card).toBe("Aujourd'hui, nous jouons.");
  });

  it("garde la ponctuation finale après la citation sans la perdre ni la mettre en carte", () => {
    const { card } = shown("Complète la phrase « Demain, nous ___ au ballon. » ?");
    expect(card).toBe("Demain, nous ___ au ballon.");
  });

  it("montre la consigne EN ENTIER quand du texte suit la citation", () => {
    const prompt =
      "Lis : « Fatou se lève tôt. Elle va au puits avec sa grande sœur. » Avec qui Fatou va-t-elle au puits ?";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("montre la consigne EN ENTIER quand elle a deux citations", () => {
    const prompt = "Dans « Modou mange la mangue », quel pronom remplace « la mangue » ?";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("ne prend pas l'apostrophe pour un guillemet", () => {
    const prompt = "Aïssatou a 3 mangues. Elle va à l'école d'abord, puis au marché de l'ouest.";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("garde le deux-points devant une phrase à lire ou à compléter", () => {
    const { texts, card } = shown("Complète avec le verbe au futur simple : Demain, nous ___ (jouer) au ballon.");
    expect(texts).toEqual(["Complète avec le verbe au futur simple", "Demain, nous ___ (jouer) au ballon."]);
    expect(card).toBe("Demain, nous ___ (jouer) au ballon.");
  });

  it("ne coupe pas une consigne courte ni sans citation", () => {
    for (const prompt of ["Quel est le résultat ?", "Relie chaque mot à son contraire.", "Choisis : a ou b ?"]) {
      expect(shown(prompt).texts, prompt).toEqual([prompt]);
      cleanup();
    }
  });

  it("pose une rangée d'émojis sur un socle sans toucher au texte, et colle la ponctuation qui suit au socle", () => {
    const row = [0x1f418, 0x1f41f, 0x1f34c].map((code) => String.fromCodePoint(code)).join(" ");
    const prompt = `Regarde la rangée ${row}. Lequel est au milieu ?`;
    const { container } = render(<ExercisePrompt prompt={prompt} />);
    const socle = container.querySelector(".gk-socle");
    expect(socle?.textContent).toBe(row);
    expect(socle?.className).toContain("text-4xl");
    expect(withoutNbsp(container.querySelector("p")?.textContent)).toBe(prompt);
    // Le « . » ne part jamais seul en tête de ligne : il est dans le même `nowrap` que le socle.
    const glued = socle?.parentElement;
    expect(glued?.className).toContain("whitespace-nowrap");
    expect(glued?.textContent).toBe(`${row}.`);
    // Une rangée sur une seule ligne se plie encore sur un écran étroit : `pre` est réservé aux scènes.
    expect(socle?.className).not.toContain("whitespace-pre");
  });

  it("pose un cadran d'horloge seul en grand sur son socle, sous la phrase, sans toucher au texte", () => {
    // À la taille d'un mot, un cadran n'a plus d'aiguilles lisibles (relu sur l'iPhone 17, 21 octobre 2026).
    const clock = String.fromCodePoint(0x1f566);
    const prompt = `Quelle heure est-il ? ${clock}`;
    const { container } = render(<ExercisePrompt prompt={prompt} />);
    const horloge = container.querySelector("[data-prompt-horloge]");
    expect(horloge?.textContent).toBe(clock);
    expect(horloge?.className).toContain("gk-socle");
    expect(horloge?.className).toContain("text-[5rem]");
    // Un bloc centré : il passe sous la phrase au lieu de rester au bout de la ligne.
    expect(horloge?.className).toContain("block");
    expect(horloge?.className).toContain("mx-auto");
    expect(withoutNbsp(container.querySelector("p")?.textContent)).toBe(prompt);
  });

  it("garde un autre émoji seul en ligne, et deux cadrans sur le socle des rangées", () => {
    const dress = String.fromCodePoint(0x1f457);
    const { container } = render(<ExercisePrompt prompt={`Penda a une robe ${dress}.`} />);
    expect(container.querySelector("[data-prompt-horloge]")).toBeNull();
    expect(container.querySelector(".gk-socle")).toBeNull();
    cleanup();
    const pair = `${String.fromCodePoint(0x1f552)} ${String.fromCodePoint(0x1f566)}`;
    const row = render(<ExercisePrompt prompt={`Regarde ${pair}.`} />).container;
    expect(row.querySelector("[data-prompt-horloge]")).toBeNull();
    expect(row.querySelector(".gk-socle")?.textContent).toBe(pair);
  });

  it("pose un quadrillage sur UN socle qui garde ses lignes et ne se coupe pas", () => {
    // Trois rangées de trois dessins. Avec `pre-line`, Safari et le webview iOS mesuraient le socle
    // trop étroit d'un cheveu et coupaient chaque rangée en un dessin seul puis deux : la grille
    // n'en était plus une (relu sur l'iPhone 17, 19 octobre 2026). Chromium, lui, ne la coupait pas.
    const codes = [
      [0x1f408, 0x1f404, 0x1f992],
      [0x1f34e, 0x1f96d, 0x1f414],
      [0x1f415, 0x1f41f, 0x1f34b],
    ];
    const scene = codes.map((row) => row.map((code) => String.fromCodePoint(code)).join(" ")).join("\n");
    const { container } = render(<ExercisePrompt prompt={`Regarde le quadrillage.\n${scene}\nLequel est au milieu ?`} />);
    const socles = container.querySelectorAll(".gk-socle");
    expect(socles).toHaveLength(1);
    expect(socles[0].textContent).toBe(scene);
    expect(socles[0].className).toContain("whitespace-pre");
    expect(withoutNbsp(container.querySelector("p")?.textContent)).toBe(`Regarde le quadrillage.\n${scene}\nLequel est au milieu ?`);
  });

  it("ne coupe pas un mot à trait d'union, et laisse les autres mots en texte nu", () => {
    const prompt = "Aïssatou a 3 mangues. Combien en a-t-elle maintenant ?";
    const { container } = render(<ExercisePrompt prompt={prompt} />);
    const p = container.querySelector("p")!;
    expect(withoutNbsp(p.textContent)).toBe(prompt);
    const nowrap = [...p.querySelectorAll("span")];
    expect(nowrap.map((s) => s.textContent)).toEqual(["a-t-elle"]);
    expect(nowrap[0].className).toContain("whitespace-nowrap");
    // Les nœuds de texte nus autour, pour `getByText`.
    expect([...p.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => withoutNbsp(n.textContent))).toEqual([
      "Aïssatou a 3 mangues. Combien en ",
      " maintenant ?",
    ]);
    cleanup();
    // Sans trait d'union : un seul nœud de texte, rien d'enveloppé.
    const plain = render(<ExercisePrompt prompt="Combien de mangues ?" />);
    expect(plain.container.querySelector("p")?.querySelector("span")).toBeNull();
  });

  it("une citation courte (des syllabes) se lit en Fredoka extra-grasse, droite ; une longue en Poppins, droite", () => {
    const { container } = render(<ExercisePrompt prompt="Lis les syllabes : mi - te - mar." />);
    const quote = container.querySelector("[data-prompt-quote]")!;
    expect(quote.getAttribute("data-prompt-quote")).toBe("courte");
    expect(quote.className).toContain("font-display");
    expect(quote.className).toContain("font-extrabold");
    expect(quote.className).not.toContain("italic");
    cleanup();
    const long = render(<ExercisePrompt prompt="Trouve le temps du verbe : « Aujourd'hui, nous jouons au ballon dans la cour. »" />);
    const card = long.container.querySelector("[data-prompt-quote]")!;
    expect(card.getAttribute("data-prompt-quote")).toBe("longue");
    expect(card.className).not.toContain("italic");
    expect(card.className).not.toContain("font-display");
  });

  it("parle avec la voix de Pio : Fredoka, texte ambre, jamais gris", () => {
    const { container } = render(<ExercisePrompt prompt="Trouve le temps du verbe : « Aujourd'hui, nous jouons. »" />);
    const [instruction] = container.querySelectorAll("p");
    expect(instruction.className).toContain("font-display");
    expect(container.innerHTML).not.toMatch(/gray-\d|indigo-\d/);
  });

  it("grandit avec l'écran quand elle est courte, reste à 20 px quand elle est longue", () => {
    expect(promptSizeClass("Combien de mangues ?")).toBe("text-[clamp(1.25rem,5.6vw,1.625rem)]");
    // Longue : 20 px, et 18 px sur un écran court (le budget du premier écran).
    expect(promptSizeClass("Aïssatou a 3 mangues. On lui en donne 2 de plus. Combien en a-t-elle maintenant ?")).toBe(
      "text-xl [@media(max-height:667px)]:text-lg",
    );
    const { container } = render(<ExercisePrompt prompt="Combien de mangues ?" />);
    expect(container.querySelector("p")?.className).toContain("clamp(1.25rem,5.6vw,1.625rem)");
  });

  it("dans une classe qui apprend à lire, prend toute la largeur : aucun bouton devant elle", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ExercisePrompt prompt="Combien de mangues ?" />
      </PromptReaderProvider>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[data-prompt-reading]")).not.toBeNull();
    expect(withoutNbsp(container.querySelector("p")?.textContent)).toBe("Combien de mangues ?");
  });
});

describe("l'espace avant la ponctuation haute : insécable à l'affichage, jamais en base", () => {
  /** Le texte du premier paragraphe, tel que l'écran le tient. */
  const rendered = (prompt: string) => render(<ExercisePrompt prompt={prompt} />).container.querySelector("p")!.textContent!;

  it("tient « ? » au mot qui le précède (le défaut vu sur WebKit : « …sera août ⏎ ? Écris le nombre. »)", () => {
    const prompt = "Nous sommes en février. Dans combien de mois sera août ? Écris le nombre.";
    expect(rendered(prompt)).toBe(`Nous sommes en février. Dans combien de mois sera août${NBSP}? Écris le nombre.`);
  });

  it("fait de même pour « ! », « : » et « ; »", () => {
    expect(rendered("Bravo ! Tu as gagné.")).toBe(`Bravo${NBSP}! Tu as gagné.`);
    expect(rendered("Choisis : a ou b ?")).toBe(`Choisis${NBSP}: a ou b${NBSP}?`);
    expect(rendered("Lis ; puis écris.")).toBe(`Lis${NBSP}; puis écris.`);
  });

  it("colle les guillemets français à leur mot, et les tranches d'un nombre entre elles", () => {
    expect(rendered("Dans « Modou mange la mangue », quel pronom remplace « la mangue » ?")).toBe(
      `Dans «${NBSP}Modou mange la mangue${NBSP}», quel pronom remplace «${NBSP}la mangue${NBSP}»${NBSP}?`,
    );
    expect(rendered("Un car roule à 60 km pendant 3 h. Il paie 1 200 F.")).toBe(
      `Un car roule à 60${NBSP}km pendant 3${NBSP}h. Il paie 1${NBSP}200${NBSP}F.`,
    );
  });

  it("n'a plus aucune espace ordinaire devant la ponctuation haute, citation en carte comprise", () => {
    const { container } = render(<ExercisePrompt prompt="Trouve le temps du verbe : « Aujourd'hui, nous jouons ! »" />);
    const paragraphs = [...container.querySelectorAll("p")];
    expect(paragraphs.map((p) => p.textContent)).toEqual(["Trouve le temps du verbe", `Aujourd'hui, nous jouons${NBSP}!`]);
    // La carte tient le « ! » à « jouons ».
    expect(container.querySelector("[data-prompt-quote]")?.textContent).toBe(`Aujourd'hui, nous jouons${NBSP}!`);
    for (const p of paragraphs) expect(p.textContent).not.toMatch(/ [?!:;»]|« /u);
  });

  it("tient aussi la ponctuation du texte qui suit une rangée d'émojis", () => {
    const row = [0x1f418, 0x1f41f, 0x1f34c].map((code) => String.fromCodePoint(code)).join(" ");
    const text = rendered(`Regarde la rangée ${row}. Lequel est au milieu ? Dis-le !`);
    expect(text).toBe(`Regarde la rangée ${row}. Lequel est au milieu${NBSP}? Dis-le${NBSP}!`);
  });

  it("garde le mot à trait d'union en nowrap et ses voisins en texte nu, avec l'insécable", () => {
    const { container } = render(<ExercisePrompt prompt="Combien en a-t-elle maintenant ?" />);
    const p = container.querySelector("p")!;
    expect([...p.querySelectorAll("span")].map((s) => s.textContent)).toEqual(["a-t-elle"]);
    expect([...p.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent)).toEqual([
      "Combien en ",
      ` maintenant${NBSP}?`,
    ]);
  });

  it("ne touche que l'affichage : le texte reçu garde ses espaces ordinaires, et `getByText` le retrouve", () => {
    const prompt = "Dans combien de mois sera août ?";
    render(<ExercisePrompt prompt={prompt} />);
    // Le normaliseur de Testing Library replie les insécables : la consigne de la base s'y retrouve.
    expect(screen.getByText(prompt)).toBeTruthy();
    expect(prompt).not.toContain(NBSP);
  });
});
