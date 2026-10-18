/**
 * LES SPÉCIMENS DE LA GALERIE : un exercice réaliste par type d'écran, pris
 * là où la vitrine prend les siens (`components/landing/demo/bank/*.ts`,
 * `make-game.ts`) ou fabriqué par les gabarits du serveur
 * (`convex/paliers/games`). Le même contenu que l'enfant reçoit : des
 * émojis au CI (« Regarde la rangée 🐔 🍌 🐄… »), des syllabes, des formes.
 *
 * Et LES GESTES QUI AMÈNENT CHAQUE ÉCRAN DANS UN ÉTAT. Les composants
 * d'exercice gardent leur choix en état interne et n'ont aucune prop pour le
 * préremplir ; la galerie ne les modifie pas (leurs props sont un contrat
 * partagé par la séance, la vitrine et les aperçus des professeurs). Alors
 * elle fait ce qu'un enfant ferait : elle touche. `armSpecimen` joue les
 * touchers dans le DOM rendu, puis la galerie pose `disabled` et `isCorrect`.
 */
import { BANK as FRANCAIS } from "@/components/landing/demo/bank/francais";
import { BANK as MATHEMATIQUES } from "@/components/landing/demo/bank/mathematiques";
import { gamesFor } from "@/components/landing/demo/demo-matrix";
import type {
  ClassicType,
  DemoClass,
  DemoSubject,
  GameType,
  PlayableExercise,
  SubjectBank,
} from "@/components/landing/demo/demo-types";
import { makeGame } from "@/components/landing/demo/make-game";
import { toPlayable, viewOf } from "@/components/landing/demo/playable";
import { GAME_KINDS, type GameKind } from "@/convex/paliers/games";
import { makeContext } from "@/convex/paliers/games/shared";
import { EMPTY_CELL } from "@/convex/paliers/games/types";

export const KINDS = [
  "qcm3",
  "qcm4",
  "match",
  "order",
  "drag-drop",
  "fill-blank",
  "short-answer",
  "short-answer-texte",
  "pattern",
  "color-mix",
  "listen",
  "pixel-art",
] as const;

export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  qcm3: "QCM, 3 options (rangée d'émojis, CI)",
  qcm4: "QCM, 4 options (mangues, CI)",
  match: "Association (nombres et mangues, CI)",
  order: "Mise en ordre (syllabes, CI)",
  "drag-drop": "Glisser-déposer (formes, CI)",
  "fill-blank": "Phrase à trous (un, une, CI)",
  "short-answer": "Réponse courte (billes, CP)",
  // Un mot à taper : le clavier des lettres du téléphone monte (la seule
  // réponse courte de la galerie qui l'ouvre ; les chiffres ont leur pavé).
  "short-answer-texte": "Réponse courte en lettres (marmite, CP)",
  pattern: "Frise (CI)",
  "color-mix": "Atelier des couleurs (CI)",
  listen: "Écoute (CI)",
  "pixel-art": "Dessin sur quadrillage (CI)",
};

export const STATES = ["repos", "choisie", "bonne", "mauvaise", "desactive"] as const;

export type StageState = (typeof STATES)[number];

export const STATE_LABELS: Record<StageState, string> = {
  repos: "Repos",
  choisie: "Une option choisie",
  bonne: "Bonne réponse",
  mauvaise: "Mauvaise réponse",
  desactive: "Désactivé",
};

export type Specimen = {
  kind: Kind;
  label: string;
  klass: DemoClass;
  /** L'exercice complet, réponse comprise : les gestes et la correction en ont besoin. */
  exercise: PlayableExercise;
  /** Ce que l'écran reçoit : sans la réponse, mélangé comme en séance. */
  view: unknown;
};

/** Un exercice de la banque, par type, pour une matière et une classe. */
function classic(bank: SubjectBank, subject: DemoSubject, klass: DemoClass, type: ClassicType): PlayableExercise {
  const item = bank[klass].find((candidate) => candidate.type === type);
  if (!item) throw new Error(`Banque ${subject} ${klass} : pas d'exercice « ${type} »`);
  return toPlayable(item, subject, klass);
}

/** Un jeu que le programme donne à la classe, fabriqué comme la vitrine le fabrique. */
function offered(subject: DemoSubject, klass: DemoClass, type: GameType): PlayableExercise {
  const offer = gamesFor(subject, klass).find((candidate) => candidate.type === type);
  if (!offer) throw new Error(`${subject} ${klass} : pas de jeu « ${type} »`);
  return makeGame(subject, klass, offer, 0);
}

/** Un exercice d'un gabarit du serveur (une rangée d'émojis, par exemple), à graine fixe. */
function template(kind: GameKind, klass: DemoClass, seed: string): PlayableExercise {
  const made = GAME_KINDS[kind].make(makeContext(klass, 2, seed));
  return {
    id: `galerie:${kind}:${seed}`,
    type: made.type,
    prompt: made.prompt,
    payload: made.payload,
    hints: made.hints,
    topic: GAME_KINDS[kind].label,
    stage: 2,
    gameLabel: GAME_KINDS[kind].label,
  };
}

function specimen(kind: Kind, klass: DemoClass, exercise: PlayableExercise): Specimen {
  return { kind, label: KIND_LABELS[kind], klass, exercise, view: viewOf(exercise) };
}

/** Les douze spécimens. Calculés une fois par page : les graines sont fixes, le résultat aussi. */
export function buildSpecimens(): Record<Kind, Specimen> {
  return {
    qcm3: specimen("qcm3", "CI", template("rangee-position", "CI", "galerie-rangee-3")),
    qcm4: specimen("qcm4", "CI", classic(MATHEMATIQUES, "mathematiques", "CI", "qcm")),
    match: specimen("match", "CI", classic(MATHEMATIQUES, "mathematiques", "CI", "match")),
    order: specimen("order", "CI", classic(FRANCAIS, "francais", "CI", "order")),
    "drag-drop": specimen("drag-drop", "CI", classic(MATHEMATIQUES, "mathematiques", "CI", "drag-drop")),
    "fill-blank": specimen("fill-blank", "CI", classic(FRANCAIS, "francais", "CI", "fill-blank")),
    "short-answer": specimen("short-answer", "CP", classic(MATHEMATIQUES, "mathematiques", "CP", "short-answer")),
    "short-answer-texte": specimen("short-answer-texte", "CP", classic(FRANCAIS, "francais", "CP", "short-answer")),
    pattern: specimen("pattern", "CI", offered("mathematiques", "CI", "pattern")),
    "color-mix": specimen("color-mix", "CI", offered("education-artistique", "CI", "color-mix")),
    listen: specimen("listen", "CI", offered("education-artistique", "CI", "listen")),
    "pixel-art": specimen("pixel-art", "CI", offered("mathematiques", "CI", "pixel-art")),
  };
}

export function isKind(value: string | null | undefined): value is Kind {
  return (KINDS as readonly string[]).includes(value ?? "");
}

export function isState(value: string | null | undefined): value is StageState {
  return (STATES as readonly string[]).includes(value ?? "");
}

/** Vrai pour les états qui demandent un geste de l'enfant avant d'être posés. */
export function needsArming(state: StageState): boolean {
  return state === "choisie" || state === "bonne" || state === "mauvaise";
}

// ---------------------------------------------------------------------------
// Les gestes
// ---------------------------------------------------------------------------

const tick = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Un toucher, puis le temps que React l'ait digéré. Deux `click()` dans la
 * même tâche voient le MÊME état : le second toucher d'une association
 * croyait qu'aucune tuile n'était choisie et sélectionnait au lieu de relier.
 * React pose ses mises à jour en microtâche ; un tour de boucle suffit.
 */
async function press(element: HTMLElement | null | undefined): Promise<void> {
  element?.click();
  await tick(16);
}

const allButtons = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLButtonElement>("button"));

/**
 * Les boutons de RÉPONSE d'un écran : tout sauf « Valider », le lecteur de
 * consigne, les lecteurs de son de l'écoute et les trous d'une phrase.
 */
function answerButtons(root: HTMLElement): HTMLButtonElement[] {
  return allButtons(root).filter((button) => {
    const label = button.getAttribute("aria-label") ?? "";
    if (button.textContent?.trim() === "Valider") return false;
    if (/consigne/i.test(label)) return false;
    if (/^Écouter/.test(label)) return false;
    if (/^Trou /.test(label)) return false;
    return true;
  });
}

function byText(buttons: HTMLButtonElement[], text: string): HTMLButtonElement | undefined {
  return buttons.find((button) => button.textContent?.trim() === text.trim());
}

function byLabel(root: HTMLElement, label: string): HTMLButtonElement | null {
  return root.querySelector<HTMLButtonElement>(`button[aria-label="${CSS.escape(label)}"]`);
}

/** Un index faux : le premier qui n'est pas le bon. */
const wrongIndex = (correct: number, count: number) => (correct === 0 ? Math.min(1, count - 1) : 0);

/** Une touche du clavier, telle que dnd-kit l'écoute (`code`, pas seulement `key`). */
function pressKey(target: EventTarget, key: string, code: string) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true }));
}

/** Écrit dans un champ contrôlé par React : le setter natif, puis l'évènement `input`. */
function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Un doigt posé puis levé au centre d'une case du quadrillage. */
function tapCell(grid: HTMLElement, cell: HTMLElement) {
  const rect = cell.getBoundingClientRect();
  const init: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    buttons: 1,
  };
  grid.dispatchEvent(new PointerEvent("pointerdown", init));
  grid.dispatchEvent(new PointerEvent("pointerup", { ...init, buttons: 0 }));
}

/**
 * Amène l'écran rendu sous `root` dans l'état demandé, par des touchers.
 * `choisie` : un seul geste, rien de validé. `bonne` : la réponse juste
 * complète. `mauvaise` : une réponse complète et fausse. Les états `repos`
 * et `desactive` ne demandent aucun geste.
 *
 * Tout se joue sur le DOM tel que les composants le rendent aujourd'hui ;
 * un écran redessiné peut casser un geste : la galerie le dit en console et
 * pose quand même l'état final.
 */
export async function armSpecimen(root: HTMLElement, specimen: Specimen, state: StageState): Promise<void> {
  if (!needsArming(state)) return;
  const right = state !== "mauvaise";
  const full = specimen.exercise.payload as Record<string, unknown>;
  const view = specimen.view as Record<string, unknown>;

  switch (specimen.kind) {
    case "qcm3":
    case "qcm4":
    case "listen": {
      const options = (full.options as string[]) ?? [];
      const correct = typeof full.correctIndex === "number" ? full.correctIndex : 0;
      const index = right ? correct : wrongIndex(correct, options.length);
      await press(answerButtons(root)[index]);
      return;
    }

    case "match": {
      const pairs = (full.pairs as { left: string; right: string }[]) ?? [];
      const rightColumn = (view.right as string[]) ?? [];
      const buttons = answerButtons(root);
      const n = pairs.length;
      const lefts = buttons.slice(0, n);
      const rights = buttons.slice(n, 2 * n);
      const count = state === "choisie" ? 1 : n;
      for (let i = 0; i < count; i++) {
        // Faux : chaque gauche prend la droite de la paire suivante.
        const partner = right ? pairs[i].right : pairs[(i + 1) % n].right;
        await press(lefts[i]);
        if (state === "choisie") return;
        await press(rights[rightColumn.indexOf(partner)]);
      }
      return;
    }

    case "order": {
      // Au clavier, comme dnd-kit le permet : Espace prend la tuile, la flèche
      // la descend d'un cran, Espace la pose. `choisie` la garde en main.
      const handle = root.querySelector<HTMLElement>('[aria-roledescription="sortable"]');
      if (!handle) return;
      handle.focus();
      pressKey(handle, " ", "Space");
      if (state === "choisie") return;
      await tick(60);
      pressKey(handle.ownerDocument, "ArrowDown", "ArrowDown");
      await tick(60);
      pressKey(handle.ownerDocument, " ", "Space");
      await tick(60);
      return;
    }

    case "drag-drop": {
      const items = (full.items as { text: string; correctZone: string }[]) ?? [];
      const zones = (full.zones as string[]) ?? [];
      const zoneBox = (name: string) => {
        const header = Array.from(root.querySelectorAll<HTMLElement>("h4")).find(
          (h4) => h4.textContent?.trim() === name,
        );
        return header?.parentElement ?? null;
      };
      // Toucher l'étiquette, puis sa case : le geste qui marche sur tout écran.
      for (let guard = 0; guard < items.length; guard++) {
        const chip = root.querySelector<HTMLElement>('.border-dashed [aria-roledescription="draggable"]');
        if (!chip) break;
        const text = chip.textContent?.trim() ?? "";
        const correctZone = items.find((item) => item.text === text)?.correctZone ?? zones[0];
        const zone = right ? correctZone : zones[(zones.indexOf(correctZone) + 1) % zones.length];
        await press(chip);
        if (state === "choisie") return;
        await press(zoneBox(zone));
      }
      return;
    }

    case "fill-blank": {
      const blanks = (full.blanks as { options: string[]; answer: string }[]) ?? [];
      for (const blank of blanks) {
        const word = right ? blank.answer : (blank.options.find((option) => option !== blank.answer) ?? blank.answer);
        await press(byText(answerButtons(root), word));
        if (state === "choisie") return;
      }
      return;
    }

    case "pattern": {
      const answers = (full.answers as string[]) ?? [];
      const options = (full.options as string[]) ?? [];
      for (const answer of answers) {
        const token = right ? answer : (options.find((option) => option !== answer) ?? answer);
        await press(byLabel(root, `Placer ${token}`));
        if (state === "choisie") return;
      }
      return;
    }

    case "color-mix": {
      const answer = (full.answer as string[]) ?? [];
      const choices = ((full.choices as { name: string }[]) ?? []).map((paint) => paint.name);
      const names = right ? answer : choices.filter((name) => !answer.includes(name)).slice(0, answer.length);
      for (const name of names) {
        await press(byLabel(root, `Pot ${name}`));
        if (state === "choisie") return;
      }
      return;
    }

    case "short-answer":
    case "short-answer-texte": {
      const input = root.querySelector<HTMLInputElement>("input");
      if (!input) return;
      const accepted = (full.acceptedAnswers as string[]) ?? [];
      const answer = accepted[0] ?? "";
      typeInto(input, state === "choisie" ? answer.slice(0, 1) : right ? answer : `${answer}0`);
      return;
    }

    case "pixel-art": {
      const grid = root.querySelector<HTMLElement>('[role="grid"]');
      if (!grid) return;
      const cells = Array.from(grid.querySelectorAll<HTMLElement>('[role="gridcell"]'));
      const width = typeof full.width === "number" ? full.width : 0;
      const target = (full.target as string[]) ?? [];
      const palette = (full.palette as { key: string; name: string }[]) ?? [];
      // L'écran capture le pointeur (`setPointerCapture`) : un pointeur
      // synthétique n'existe pas pour le navigateur, l'appel lèverait. On le
      // neutralise le temps des gestes, sur ce seul élément.
      Object.defineProperty(grid, "setPointerCapture", { value: () => {}, configurable: true });
      try {
        const wanted: { r: number; c: number; key: string }[] = [];
        target.forEach((row, r) => {
          for (let c = 0; c < width; c++) {
            const key = row[c] ?? EMPTY_CELL;
            if (key !== EMPTY_CELL) wanted.push({ r, c, key });
          }
        });
        const plan =
          state === "choisie"
            ? wanted.slice(0, 2)
            : right
              ? wanted
              : // Faux : trois cases de la première couleur, là où le modèle est vide.
                target
                  .flatMap((row, r) =>
                    Array.from({ length: width }, (_, c) => ({ r, c, key: palette[0]?.key ?? "A", empty: (row[c] ?? EMPTY_CELL) === EMPTY_CELL })),
                  )
                  .filter((cell) => cell.empty)
                  .slice(0, 3);
        let current: string | null = null;
        for (const { r, c, key } of plan) {
          if (key !== current) {
            const name = palette.find((paint) => paint.key === key)?.name;
            if (name) await press(byLabel(root, name));
            current = key;
          }
          const cell = cells[r * width + c];
          if (cell) tapCell(grid, cell);
          await tick(0);
        }
      } finally {
        delete (grid as unknown as Record<string, unknown>).setPointerCapture;
      }
      return;
    }
  }
}
