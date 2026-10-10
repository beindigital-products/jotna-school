/**
 * LES OUTILS D'ÉCRITURE DE LA BANQUE (`bank/*.ts`) : un constructeur par type
 * d'exercice classique, qui rend le payload tel que le modèle l'écrit et que
 * l'écran le lit (`convex/paliers/index.ts`, `validatePayload`).
 *
 * POURQUOI DES CONSTRUCTEURS ET PAS DES OBJETS ÉCRITS À LA MAIN. La forme du
 * payload n'est pas la même d'un type à l'autre (`correctIndex`, `pairs`,
 * `correctSequence`, `zones` et `items`…) : un champ oublié ou mal nommé fait
 * un exercice cassé que l'enfant saute. Ici, on écrit ce qu'on pense — la
 * bonne option par son TEXTE, les étiquettes rangées PAR ZONE — et le
 * constructeur en tire la forme du serveur et l'index de la bonne réponse.
 *
 * Rien n'est vérifié ici : `__tests__/demo-bank.test.ts` joue chaque
 * exercice avec la vraie règle de correction.
 */
import type { ClassicItem, Stage } from "./demo-types";

type Base = {
  /** La thématique du programme dont l'exercice est un exemple (nom exact, vérifié par un test). */
  topic: string;
  stage: Stage;
  /** La consigne, au tutoiement, comme l'écrit le modèle. */
  prompt: string;
  /** Deux ou trois indices, du plus général au plus proche de la réponse. */
  hints: string[];
  /** Mathématiques : l'expression dont la valeur est la bonne réponse. */
  expression?: string;
};

function base(input: Base) {
  const { topic, stage, prompt, hints, expression } = input;
  return { topic, stage, prompt, hints, ...(expression ? { expression } : {}) };
}

/** Un QCM : les propositions dans l'ordre où l'enfant les voit, la bonne par son texte. */
export function qcm(
  input: Base & { options: string[]; answer: string; explanation?: string },
): ClassicItem {
  return {
    ...base(input),
    type: "qcm",
    payload: {
      options: input.options,
      correctIndex: input.options.indexOf(input.answer),
      ...(input.explanation ? { explanation: input.explanation } : {}),
    },
  };
}

/** Un glisser-déposer : `items` range les étiquettes PAR ZONE, `zones` donne l'ordre des zones. */
export function dragDrop(input: Base & { zones: string[]; items: Record<string, string[]> }): ClassicItem {
  return {
    ...base(input),
    type: "drag-drop",
    payload: {
      zones: input.zones,
      items: Object.entries(input.items).flatMap(([zone, texts]) =>
        texts.map((text) => ({ text, correctZone: zone })),
      ),
    },
  };
}

/** Une association : les paires `[gauche, droite]` ; l'écran mélange la colonne de droite. */
export function match(input: Base & { pairs: [string, string][] }): ClassicItem {
  return {
    ...base(input),
    type: "match",
    payload: { pairs: input.pairs.map(([left, right]) => ({ left, right })) },
  };
}

/** Une mise en ordre : la suite BONNE ; l'écran la mélange. */
export function order(input: Base & { sequence: string[] }): ClassicItem {
  return { ...base(input), type: "order", payload: { correctSequence: input.sequence } };
}

/** Une réponse courte : les écritures acceptées, la première est celle qu'on montre. */
export function shortAnswer(input: Base & { accepted: string[] }): ClassicItem {
  return { ...base(input), type: "short-answer", payload: { acceptedAnswers: input.accepted } };
}

/** Une phrase à trous : chaque trou s'écrit `___` dans `text`, avec ses mots proposés et le bon. */
export function fillBlank(
  input: Base & { text: string; blanks: { options: string[]; answer: string }[] },
): ClassicItem {
  return { ...base(input), type: "fill-blank", payload: { text: input.text, blanks: input.blanks } };
}
