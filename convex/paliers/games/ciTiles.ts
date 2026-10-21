/**
 * LES OUTILS DES GABARITS DU CI : un QCM de trois tuiles, un glisser-déposer, une phrase à trou, une association et
 * une mise en ordre, sous la forme que le contrôleur et l'écran attendent. Les arts du CI (`plastiqueCi.ts`,
 * `mimesCi.ts`) les partagent. Les sciences du CI (`milieuCi.ts`, `soinsCi.ts`) gardent leurs propres copies.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { originOf, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";

export const capital = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);

/** La part de chaque niveau : un palier de la thématique par niveau (1, 2, puis 3 et 4 qui se confondent). */
export const byLevel = <T>(level: GameLevel, first: T, second: T, third: T): T => (level === 1 ? first : level === 2 ? second : third);

/** Trois choix mélangés : la bonne réponse et deux autres de `others`, différentes d'elle. */
export function threeOf(ctx: GameContext, answer: string, others: readonly string[]): string[] {
  return shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, others.filter((other) => other !== answer)).slice(0, 2)]);
}

/** Un QCM de trois tuiles : la bonne réponse, deux autres. */
export function choiceGame(
  kind: string,
  ctx: GameContext,
  prompt: string,
  answer: string,
  others: readonly string[],
  concept: string,
  hints: string[],
): GeneratedGame {
  const options = threeOf(ctx, answer, others);
  return {
    type: "qcm",
    prompt,
    payload: { options, correctIndex: options.indexOf(answer), game: originOf(kind, ctx), concept },
    answerKey: answer,
    hints,
  };
}

/** Un glisser-déposer : les cases dans un ordre mélangé, les tuiles déjà mélangées par l'appelant. */
export function sortGame(
  kind: string,
  ctx: GameContext,
  prompt: string,
  zones: readonly string[],
  items: { text: string; correctZone: string }[],
  concept: string,
  hints: string[],
): GeneratedGame {
  return {
    type: "drag-drop",
    prompt,
    payload: { zones: shuffle(ctx.rng, [...zones]), items, game: originOf(kind, ctx), concept },
    answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
    hints,
  };
}

/** Ce qui fait l'identité d'un glisser-déposer : ses tuiles, sans l'ordre où l'écran les mélange. */
export const itemsKey = (game: GeneratedGame) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort());

/** Une phrase à trou : un seul trou, le mot juste et deux mots qui ne vont pas dans la phrase. */
export type Gap = { text: string; answer: string; wrong: readonly [string, string]; hint: string };

export function gapGame(kind: string, ctx: GameContext, gap: Gap, concept: string): GeneratedGame {
  return {
    type: "fill-blank",
    prompt: "Complète la phrase.",
    payload: {
      text: gap.text,
      blanks: [{ options: shuffle(ctx.rng, [gap.answer, ...gap.wrong]), answer: gap.answer }],
      game: originOf(kind, ctx),
      concept,
    },
    answerKey: gap.answer,
    hints: ["Lis la phrase en entier, doucement.", gap.hint, "Écarte les mots qui ne vont pas dans la phrase."],
  };
}

/** Une association : les paires dans un ordre mélangé. */
export function linkGame(
  kind: string,
  ctx: GameContext,
  prompt: string,
  pairs: readonly { left: string; right: string }[],
  concept: string,
  hints: string[],
): GeneratedGame {
  const shown = shuffle(ctx.rng, pairs);
  return {
    type: "match",
    prompt,
    payload: { pairs: shown, game: originOf(kind, ctx), concept },
    answerKey: shown.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
    hints,
  };
}

/** Une mise en ordre : la suite juste, l'écran la mélange. */
export function orderGame(
  kind: string,
  ctx: GameContext,
  prompt: string,
  sequence: readonly string[],
  concept: string,
  hints: string[],
): GeneratedGame {
  return {
    type: "order",
    prompt,
    payload: { correctSequence: [...sequence], game: originOf(kind, ctx), concept },
    answerKey: sequence.join(", "),
    hints,
  };
}
