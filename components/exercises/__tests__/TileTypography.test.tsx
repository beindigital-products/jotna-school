import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));
// Pas de Web Audio dans jsdom.
vi.mock("@/lib/sounds/synth", () => ({
  canSynthesize: vi.fn(() => true),
  playClip: vi.fn(() => new Promise<void>(() => {})),
  stopClip: vi.fn(),
}));

import DragDropExercise from "../DragDropExercise";
import ListenExercise from "../ListenExercise";
import MatchExercise from "../MatchExercise";
import OrderExercise from "../OrderExercise";
import QcmExercise from "../QcmExercise";

afterEach(cleanup);

const NBSP = " ";
const withoutNbsp = (text: string | null | undefined) => (text ?? "").replaceAll(NBSP, " ");

/**
 * LA RÈGLE DE L'ÉNONCÉ (PR #97) DANS TOUTES LES TUILES. L'audit visuel d'octobre 2026
 * a vu 155 exercices laisser un « ! », un « ? », un « : » ou un « ; » seul au début
 * d'une ligne de tuile, parce que la donnée a une espace ordinaire avant ces signes.
 * L'écran la rend insécable ; la donnée, la réponse envoyée et ce qui se compare ne
 * changent pas.
 */

const INVITE = "Viens manger chez moi demain !";

/** L'élément le plus profond dont le texte replié est `text`. */
function shown(text: string): HTMLElement {
  const all = [...document.body.querySelectorAll<HTMLElement>("*")].filter((el) => withoutNbsp(el.textContent).trim() === text);
  const found = all.at(-1);
  if (!found) throw new Error(`« ${text} » introuvable`);
  return found;
}

/** Le bouton d'option dont le texte replié finit par `text` (la lettre cachée le précède). */
const optionTile = (text: string) =>
  screen.getAllByRole("button").find((button) => withoutNbsp(button.textContent).endsWith(text)) as HTMLElement;

describe("les tuiles composent leur texte : l'espace avant « ! ? : ; » est insécable", () => {
  it("glisser-déposer : l'étiquette et le nom de la case, et la réponse part en texte d'origine", () => {
    const onSubmit = vi.fn();
    render(
      <DragDropExercise
        prompt="Glisse chaque phrase dans la bonne case."
        payload={{ zones: ["Une invitation : oui", "Un ordre ; non"], items: [{ text: INVITE }, { text: "Range ta chambre !" }] }}
        onSubmit={onSubmit}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(shown(INVITE).textContent).toBe(`Viens manger chez moi demain${NBSP}!`);
    const plate = screen.getAllByRole("heading").find((h) => withoutNbsp(h.textContent) === "Une invitation : oui") as HTMLElement;
    expect(plate.textContent).toBe(`Une invitation${NBSP}: oui`);
    const other = screen.getAllByRole("heading").find((h) => withoutNbsp(h.textContent) === "Un ordre ; non") as HTMLElement;

    const item = (text: string) =>
      [...document.querySelectorAll<HTMLElement>('[aria-roledescription="draggable"]')].find((el) => withoutNbsp(el.textContent).trim() === text) as HTMLElement;
    fireEvent.click(item(INVITE));
    fireEvent.click(plate.parentElement as HTMLElement);
    fireEvent.click(item("Range ta chambre !"));
    fireEvent.click(other.parentElement as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify({ [INVITE]: "Une invitation : oui", "Range ta chambre !": "Un ordre ; non" }));
  });

  it("relier : les deux colonnes, et un calcul de problème qui ne se coupe pas", () => {
    render(
      <MatchExercise
        prompt="Relie chaque problème à son calcul."
        payload={{ left: ["Combien en reste-t-il ?", "Combien chacun reçoit-il ?"], right: ["(22 + 13) ÷ 5", "40 × 4 − 60"] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(shown("Combien en reste-t-il ?").textContent).toBe(`Combien en reste-t-il${NBSP}?`);
    expect(shown("(22 + 13) ÷ 5").textContent).toBe(`(22${NBSP}+${NBSP}13)${NBSP}÷${NBSP}5`);
    // Pas de césure automatique : « pen- ⏎ dant » ne revient plus.
    expect(document.querySelector(".hyphens-auto")).toBeNull();
  });

  it("QCM : l'option est composée, la réponse reste l'index", () => {
    const onSubmit = vi.fn();
    render(
      <QcmExercise
        prompt="Que dis-tu à ton ami qui part ?"
        payload={{ options: ["Au revoir !", "Bonjour !", "Merci ?"] }}
        onSubmit={onSubmit}
        disabled={false}
        isCorrect={null}
      />,
    );
    // La lettre de l'option (sa pastille, et « A » caché) précède le texte dans la tuile.
    const tile = optionTile("Au revoir !");
    expect(tile.textContent?.endsWith(`Au revoir${NBSP}!`)).toBe(true);
    fireEvent.click(tile);
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(onSubmit).toHaveBeenCalledWith("0");
  });

  it("ranger : l'étiquette est composée, la réponse part en textes d'origine", () => {
    render(
      <OrderExercise
        prompt="Remets les phrases dans l'ordre."
        payload={{ items: ["Il pleut !", "Je prends mon parapluie ; je sors."] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(shown("Il pleut !").textContent).toBe(`Il pleut${NBSP}!`);
    expect(shown("Je prends mon parapluie ; je sors.").textContent).toBe(`Je prends mon parapluie${NBSP}; je sors.`);
  });

  it("écouter : l'option est composée", () => {
    render(
      <ListenExercise
        prompt="Écoute. Quel son entends-tu ?"
        payload={{ clips: [{ label: "Son 1", notes: [{ f: 440, d: 300 }] }], options: ["Un tambour ?", "Une flûte !"] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(optionTile("Une flûte !").textContent?.endsWith(`Une flûte${NBSP}!`)).toBe(true);
  });
});
