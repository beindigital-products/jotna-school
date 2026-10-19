import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import QcmExercise, { EMOJI_OPTION_STACK, PICTURE_OPTION_STACK, PICTURE_OPTION_STICKER } from "../QcmExercise";
import { ItemPicturesProvider } from "../item-pictures";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

const FISH = String.fromCodePoint(0x1f41f);
const ELEPHANT = String.fromCodePoint(0x1f418);
const BANANA = String.fromCodePoint(0x1f34c);
const DOG = String.fromCodePoint(0x1f415);

const MANGOES = { options: ["4", "6", "5", "1"], correctIndex: 2 };

function renderQcm(overrides: Partial<React.ComponentProps<typeof QcmExercise>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    prompt: "Combien de mangues ?",
    payload: MANGOES,
    onSubmit,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<QcmExercise {...props} />);
  return { ...view, onSubmit, props };
}

const option = (letter: string) => screen.getByRole("button", { name: new RegExp(`^${letter}`) });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;

describe("le QCM : des tuiles qu'on choisit, la réponse part comme avant", () => {
  it("nomme chaque option par sa lettre collée à son texte, même sans pastille visible", () => {
    renderQcm();
    // Le nom d'avant (« A » + « 4 »), que la vitrine cherche avec /^[A-D]4$/.
    expect(screen.getByRole("button", { name: /^A4$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^C5$/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^[A-D]\d$/ })).toHaveLength(4);
  });

  it("envoie l'index de la tuile choisie en texte, et rien sans choix", () => {
    const { onSubmit } = renderQcm();
    expect(valider().disabled).toBe(true);
    fireEvent.click(option("C"));
    expect(option("C").getAttribute("aria-pressed")).toBe("true");
    expect(option("A").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(false);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith("2");
  });

  it("met des réponses courtes en deux colonnes et des phrases en une", () => {
    const { container, unmount } = renderQcm();
    expect(container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("deux-colonnes");
    unmount();
    const long = renderQcm({
      payload: { options: ["Parce que la lune tourne autour de la Terre.", "Parce que le soleil se couche."] },
    });
    expect(long.container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("une-colonne");
  });

  it("montre en grand l'émoji qui ouvre une option du CI", () => {
    renderQcm({ payload: { options: [`${FISH} le poisson`, `${ELEPHANT} l'éléphant`, `${BANANA} la banane`] } });
    const fish = option("A");
    expect(fish.textContent).toContain("le poisson");
    const big = fish.querySelector(".text-4xl");
    expect(big?.textContent).toBe(FISH);
  });

  /**
   * LA BRANCHE « ÉMOJI ET MOT » N'A PAS BOUGÉ. Les classes de la pile, copiées de la
   * version d'avant les images : elle sert à toutes les classes (CP, CE1, la démo de la
   * page d'accueil), pas seulement au CI. Un test qui compare du code neuf à du code
   * neuf ne verrait pas qu'une requête média y change : celui-ci compare à la chaîne
   * d'origine. Seule la tuile À IMAGE passe en rangée en paysage.
   */
  it("garde, au caractère près, les classes d'avant pour une tuile d'émoji : pas de rangée en paysage", () => {
    const ORIGINAL =
      "flex flex-col items-center gap-1.5 py-1 [@media(max-height:960px)_and_(min-height:668px)]:gap-1 [@media(max-height:960px)_and_(min-height:668px)]:py-0.5 [@media(max-height:667px)]:gap-1 [@media(max-height:667px)]:py-0";
    expect(EMOJI_OPTION_STACK).toBe(ORIGINAL);
    renderQcm({ payload: { options: [`${FISH} le poisson`, `${ELEPHANT} l'éléphant`, `${BANANA} la banane`] } });
    const stack = option("A").querySelector(".text-4xl")?.parentElement;
    expect(stack?.getAttribute("class")).toBe(ORIGINAL);
    expect(stack?.getAttribute("class")).not.toContain("flex-row");
    expect(stack?.getAttribute("class")).not.toContain("480px");
  });

  it("juste : la tuile choisie gonfle en vert ; fausse : elle dit non en ambre, jamais en rouge", () => {
    const { container, rerender, props } = renderQcm();
    fireEvent.click(option("C"));
    rerender(<QcmExercise {...props} disabled isCorrect />);
    expect(option("C").getAttribute("data-state")).toBe("juste");
    expect(container.innerHTML).toContain("gk-pop");
    expect((option("A") as HTMLButtonElement).disabled).toBe(true);

    cleanup();
    const again = renderQcm();
    fireEvent.click(option("A"));
    again.rerender(<QcmExercise {...again.props} disabled isCorrect={false} />);
    expect(option("A").getAttribute("data-state")).toBe("fausse");
    expect(again.container.innerHTML).toContain("gk-shake-soft");
    expect(again.container.innerHTML).not.toMatch(/red-\d/);
  });

  it("après « pas tout à fait », la tuile se repose et l'enfant rechoisit", () => {
    const { rerender, props } = renderQcm();
    fireEvent.click(option("A"));
    rerender(<QcmExercise {...props} disabled isCorrect={false} />);
    rerender(<QcmExercise {...props} disabled={false} isCorrect={null} />);
    expect(option("A").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(true);
  });

  it("verrouillé, aucune tuile ne répond", () => {
    const { onSubmit } = renderQcm({ disabled: true });
    fireEvent.click(option("B"));
    expect(option("B").getAttribute("aria-pressed")).toBe("false");
    expect(valider().disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <QcmExercise prompt="Combien de mangues ?" payload={MANGOES} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // L'énoncé, lui, n'a plus de bouton devant lui.
    expect(container.querySelector("p")?.closest("[data-scene-actions]")).toBeNull();
    expect(container.querySelector("p")?.parentElement?.querySelector("button")).toBeNull();
  });

  it("sans lecteur, la barre ne porte que Valider", () => {
    const { container } = renderQcm();
    expect([...container.querySelector("[data-scene-actions]")!.querySelectorAll("button")]).toHaveLength(1);
  });

  it("un exercice sans options se saute sans pénalité", () => {
    const onSkip = vi.fn();
    renderQcm({ payload: { options: ["seule"] }, onSkip });
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

/**
 * LE QCM DU CI : une tuile qui NOMME une chose montre son image de référence et
 * garde son nom écrit (`item-pictures.tsx`). L'image se résout à l'affichage, sur
 * le texte de l'option : la donnée et la réponse ne changent pas d'un caractère.
 */
describe("le QCM au CI : la tuile qui nomme une chose montre son image", () => {
  // Quatre noms du catalogue : toutes les tuiles à lettres ont leur image, c'est ce qu'un QCM de CI demande
  // (une tuile à lettres sans image désignerait la bonne réponse par élimination).
  const THINGS = [`${DOG} le chien`, "Lion", "La table", "Le seau"];
  // Le quatrième est un nombre : il n'a pas de lettres, il ne coupe rien et reste ce qu'il était.
  const WITH_NUMBER = [`${DOG} le chien`, "Lion", "La table", "12"];

  function renderCI(
    options: string[],
    { enabled = true, ...overrides }: { enabled?: boolean } & Partial<React.ComponentProps<typeof QcmExercise>> = {},
  ) {
    const onSubmit = vi.fn();
    const props = {
      prompt: "Quel animal aboie ?",
      payload: { options, correctIndex: 0 },
      onSubmit,
      disabled: false,
      isCorrect: null as boolean | null,
      ...overrides,
    };
    const view = render(
      <ItemPicturesProvider enabled={enabled}>
        <QcmExercise {...props} />
      </ItemPicturesProvider>,
    );
    return { ...view, onSubmit, props };
  }

  const pictureOf = (letter: string) => option(letter).querySelector("[data-item-picture]");
  const classesOf = (element: Element | null) => (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);

  it("pose l'image de la chose nommée (émoji de tête, mot nu, article) et laisse un nombre en texte", () => {
    renderCI(WITH_NUMBER);
    expect(pictureOf("A")?.getAttribute("data-item-picture")).toBe("chien");
    expect(pictureOf("B")?.getAttribute("data-item-picture")).toBe("lion");
    expect(pictureOf("C")?.getAttribute("data-item-picture")).toBe("table");
    // « 12 » n'est pas au catalogue, et n'a pas de lettres : pas d'image, et rien ne part avec lui.
    expect(pictureOf("D")).toBeNull();
    expect(option("A").querySelector("img")?.getAttribute("src")).toBe("/objets/chien.webp");
  });

  it("garde le mot écrit, et l'image prend la place de l'émoji de tête", () => {
    renderCI(THINGS);
    // La lettre, puis le mot : l'émoji de tête ne s'écrit plus, son image le remplace.
    expect(option("A").textContent).toBe("Ale chien");
    expect(option("B").textContent).toBe("BLion");
    expect(option("C").textContent).toBe("CLa table");
    expect(option("D").textContent).toBe("DLe seau");
    expect(option("A").querySelector(".text-4xl")).toBeNull();
  });

  it("garde le nom accessible : la lettre, puis le texte ; l'image est décorative", () => {
    renderCI(THINGS);
    expect(screen.getByRole("button", { name: "Ale chien" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "BLion" })).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    for (const image of document.querySelectorAll("img")) expect(image.getAttribute("alt")).toBe("");
  });

  it("sans fournisseur ou porte fermée, le DOM est celui d'avant", () => {
    const bare = render(<QcmExercise prompt="Quel animal aboie ?" payload={{ options: THINGS }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />);
    const before = bare.container.innerHTML;
    cleanup();
    const closed = renderCI(THINGS, { enabled: false });
    expect(closed.container.innerHTML).toBe(before);
    expect(before).not.toContain("<img");
    expect(before).not.toContain("data-item-picture");
    // L'émoji de tête s'y montre en grand, comme avant.
    expect(closed.container.querySelector('[data-option="0"] .text-4xl')?.textContent).toBe(DOG);
  });

  it("une option sans correspondance garde exactement son rendu d'avant", () => {
    const options = ["Fatou", "3 pommes", "les chats"];
    const bare = render(<QcmExercise prompt="Quel animal aboie ?" payload={{ options }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />);
    const before = bare.container.innerHTML;
    cleanup();
    const open = renderCI(options);
    expect(open.container.querySelector("[data-item-picture]")).toBeNull();
    expect(open.container.innerHTML).toBe(before);

    // Mêlée à des tuiles à image, une tuile sans lettres garde son DOM d'avant.
    cleanup();
    renderCI(WITH_NUMBER);
    const mixed = option("D").innerHTML;
    cleanup();
    renderCI(WITH_NUMBER, { enabled: false });
    expect(mixed).toBe(option("D").innerHTML);
    expect(mixed).not.toContain("<img");
  });

  it("la réponse envoyée est la même avec et sans images : l'index de la tuile", () => {
    const withPictures = renderCI(THINGS);
    fireEvent.click(option("B"));
    fireEvent.click(valider());
    expect(withPictures.onSubmit).toHaveBeenCalledTimes(1);
    expect(withPictures.onSubmit).toHaveBeenCalledWith("1");
    cleanup();

    const without = renderCI(THINGS, { enabled: false });
    fireEvent.click(option("B"));
    fireEvent.click(valider());
    expect(without.onSubmit).toHaveBeenCalledTimes(1);
    expect(without.onSubmit).toHaveBeenCalledWith("1");
  });

  it("ne touche pas aux options reçues du serveur", () => {
    const options = [...THINGS];
    const payload = { options, correctIndex: 0 };
    renderCI(options, { payload });
    expect(payload.options).toEqual(THINGS);
    expect(payload.options).toBe(options);
  });

  it("une tuile à image se choisit comme une autre, et prend son état", () => {
    const { rerender, props } = renderCI(THINGS);
    fireEvent.click(option("A"));
    expect(option("A").getAttribute("aria-pressed")).toBe("true");
    rerender(
      <ItemPicturesProvider enabled>
        <QcmExercise {...props} disabled isCorrect />
      </ItemPicturesProvider>,
    );
    expect(option("A").getAttribute("data-state")).toBe("juste");
    expect(pictureOf("A")).not.toBeNull();
  });

  it("garde-fou a : un énoncé qui demande de lire n'a aucune image", () => {
    const { container } = renderCI(["le chat", "le chien", "le lion"], { prompt: "Lis le mot : chat" });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-item-picture]")).toBeNull();
    expect(option("A").textContent).toBe("Ale chat");
  });

  it("garde-fou a : une consigne de syllabe, vraie consigne du CI, n'a aucune image (et « pen » n'est pas un stylo)", () => {
    const { container } = renderCI(["bonbon", "poule", "tata"], { prompt: "Quel mot commence par la syllabe « pou » ?" });
    expect(container.querySelector("img")).toBeNull();
    cleanup();
    const penda = renderCI(["lo", "pen", "lou"], { prompt: "Par quelle syllabe commence « penda » ?" });
    expect(penda.container.querySelector("img")).toBeNull();
    expect(option("B").textContent).toBe("Bpen");
  });

  it("garde-fou b : un énoncé qui montre l'émoji de la réponse n'en laisse aucune", () => {
    const { container } = renderCI(["l'éléphant", "le lion"], { prompt: `Quel animal est-ce ? ${ELEPHANT}` });
    expect(container.querySelector("img")).toBeNull();
  });

  it("garde-fou d : une tuile à lettres sans image, au milieu de tuiles illustrées, retire toutes les images", () => {
    // « Fatou » n'est pas au catalogue : le chien, le lion et la table seuls en auraient une, et la tuile nue
    // aurait désigné la bonne réponse.
    const names = [`${DOG} le chien`, "Lion", "La table", "Fatou"];
    const { container } = renderCI(names);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-item-picture]")).toBeNull();
    // Sans image, c'est le rendu d'avant, au caractère près.
    const html = container.innerHTML;
    cleanup();
    const closed = renderCI(names, { enabled: false });
    expect(closed.container.innerHTML).toBe(html);
  });

  it("garde-fou d : le matin sans image au milieu du soir et de midi n'est plus la seule tuile nue", () => {
    const { container } = renderCI(["l'après-midi", "Le soir", "Midi"], { prompt: "Quand dîne-t-on ?" });
    expect(container.querySelector("img")).toBeNull();
    cleanup();
    const full = renderCI(["Le matin", "Le soir", "Midi"], { prompt: "Le soleil se lève. Quel moment est-ce ?" });
    expect(full.container.querySelectorAll("img")).toHaveLength(3);
  });

  it("garde-fou e : l'image de l'énoncé est celle d'une option, aucune image sur les options", () => {
    const { container } = renderCI(["le chat", "le chien", "le lion"], {
      prompt: "Quel animal vois-tu ?",
      payload: { image: "chat", options: ["le chat", "le chien", "le lion"], correctIndex: 0 },
    });
    // L'image d'énoncé est là (celle de l'énoncé, avec son texte alternatif), les options n'en ont pas.
    expect(container.querySelector("[data-item-picture]")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("/exercices/chat");
  });

  it("en deux colonnes, la pastille est au-dessus du mot ; en une colonne, à sa gauche", () => {
    const two = renderCI([`${DOG} le chien`, "Lion"]);
    expect(two.container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("deux-colonnes");
    const column = pictureOf("A")!.parentElement!;
    expect(classesOf(column)).toContain("flex-col");
    expect(column.firstElementChild).toBe(pictureOf("A"));
    expect(column.lastElementChild?.textContent).toBe("le chien");
    two.unmount();

    // Des noms de plus de douze lettres (ici par l'émoji de tête) : une colonne.
    const one = renderCI([`${String.fromCodePoint(0x1f34e)} une belle pomme`, `${String.fromCodePoint(0x1f34c)} une belle banane`]);
    expect(one.container.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("une-colonne");
    const row = pictureOf("A")!.parentElement!;
    expect(classesOf(row)).not.toContain("flex-col");
    expect(classesOf(row)).toContain("items-center");
    expect(row.firstElementChild).toBe(pictureOf("A"));
    expect(row.lastElementChild?.textContent).toBe("une belle pomme");
    expect(pictureOf("B")?.getAttribute("data-item-picture")).toBe("banane");
  });

  it("la pastille suit l'écran comme l'émoji : 72, 56, 44, 36 puis 32 px en paysage, en deux colonnes", () => {
    renderCI(THINGS);
    const classes = classesOf(pictureOf("A"));
    expect(classes).toContain("size-18");
    for (const name of PICTURE_OPTION_STICKER.split(" ")) expect(classes).toContain(name);
    expect(classes).toContain("[@media(max-height:960px)_and_(min-height:820px)]:size-14");
    expect(classes).toContain("[@media(max-height:819px)_and_(min-height:668px)]:size-11");
    // Les paliers s'excluent : 36 px de 481 à 667 px de haut, 32 px à 480 px ou moins (un téléphone couché).
    expect(classes).toContain("[@media(max-height:667px)_and_(min-height:481px)]:size-9");
    expect(classes).toContain("[@media(max-height:480px)]:size-8");
    expect(classes).not.toContain("[@media(max-height:667px)]:size-9");
  });

  it("en paysage (480 px ou moins), la pastille passe à gauche du mot, et la tuile d'émoji, elle, ne bouge pas", () => {
    renderCI(THINGS);
    const classes = classesOf(pictureOf("A")!.parentElement);
    expect(classes).toContain("flex-col");
    expect(classes).toContain("[@media(max-height:480px)]:flex-row");
    // Un seul palier fixe l'écart de la pile : les requêtes média s'excluent, l'ordre n'a pas à compter.
    expect(classes).toContain("[@media(max-height:667px)_and_(min-height:481px)]:gap-1");
    expect(classes).toContain("[@media(max-height:480px)]:gap-2.5");
    expect(PICTURE_OPTION_STACK).toContain("[@media(max-height:480px)]:flex-row");
    expect(EMOJI_OPTION_STACK).not.toContain("flex-row");
  });

  it("en une colonne, la pastille garde la hauteur de la tuile : 44 px, 36 px sur un écran court, et elle déborde de 2 px", () => {
    renderCI([`${String.fromCodePoint(0x1f34e)} une belle pomme`, `${String.fromCodePoint(0x1f34c)} une belle banane`]);
    const classes = classesOf(pictureOf("A"));
    expect(classes).toContain("size-11");
    expect(classes).toContain("-my-0.5");
    expect(classes).toContain("[@media(max-height:667px)]:size-9");
  });

  it("si le fichier ne charge pas, l'émoji de tête reprend sa place ; sans émoji, la tuile garde son mot", () => {
    renderCI(THINGS);
    fireEvent.error(option("A").querySelector("img") as HTMLImageElement);
    expect(option("A").querySelector("img")).toBeNull();
    expect(option("A").textContent).toContain(DOG);
    expect(option("A").textContent).toContain("le chien");

    fireEvent.error(option("B").querySelector("img") as HTMLImageElement);
    expect(option("B").querySelector("img")).toBeNull();
    expect(option("B").textContent).toBe("BLion");
  });

  it("l'ordre des hooks ne dépend pas des options : un exercice cassé puis réparé ne lève pas d'erreur de hooks", () => {
    const { rerender, props } = renderCI(["seule"]);
    expect(screen.getByText("Cet exercice est cassé, on te le saute.")).toBeTruthy();
    rerender(
      <ItemPicturesProvider enabled>
        <QcmExercise {...props} payload={{ options: THINGS }} />
      </ItemPicturesProvider>,
    );
    expect(pictureOf("A")?.getAttribute("data-item-picture")).toBe("chien");
  });
});
