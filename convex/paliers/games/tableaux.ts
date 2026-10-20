/**
 * LES AIDES DES GABARITS À TABLEAU FERMÉ : un QCM, une phrase à trou, un appariement, un glissé et un ordre
 * à partir de ce qu'un tableau écrit à la main dit avec certitude.
 *
 * Les gabarits de `consignes.ts`, `decrire.ts`, `recit.ts`, `invitation.ts` et `arts.ts` reposent tous sur la
 * même idée que ceux de `anglais.ts` et `lecture.ts` : un tableau FERMÉ (le sens d'un verbe de consigne, le
 * contraire d'un mot, ce qu'on fait d'abord dans une histoire, la formule qui invite) dont la bonne réponse se
 * lit sans deviner, et deux mauvais choix qui ne peuvent pas être une deuxième bonne réponse. Ce fichier ne
 * porte que la forme (le payload de chaque type, les indices, la clé qui évite deux exercices identiques dans un
 * palier) : le fond est dans chaque tableau, et c'est le tableau que le test recalcule à part.
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe droite,
 * et vingt-huit mots au plus (la consigne du CP). Aucun indice n'écrit un mot de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, shuffle, type GameContext, type GeneratedGame } from "./shared";

/** Les trois indices d'un exercice : le premier relit la consigne, le dernier mène le plus près de la réponse. */
export type Hints = readonly [string, string, string];

/** Les mauvais choix d'un tirage : sans doublon, sans la bonne réponse. */
const distinct = (answer: string, wrong: readonly string[]) => [...new Set(wrong)].filter((choice) => choice !== answer);

/** Un QCM : la bonne réponse et deux mauvais choix, mélangés. */
export function choiceGame(
  ctx: GameContext,
  kind: string,
  concept: string,
  draw: () => { prompt: string; answer: string; wrong: readonly string[]; hints: Hints },
): GeneratedGame {
  return fresh(ctx, kind, () => {
    const d = draw();
    const options = shuffle(ctx.rng, [d.answer, ...distinct(d.answer, d.wrong).slice(0, 2)]);
    return {
      type: "qcm",
      prompt: d.prompt,
      payload: { options, correctIndex: options.indexOf(d.answer), game: originOf(kind, ctx), concept },
      answerKey: d.answer,
      hints: [...d.hints],
    };
  });
}

/** Une phrase à trou : un trou, la bonne réponse et deux mauvais choix. */
export function gapGame(
  ctx: GameContext,
  kind: string,
  concept: string,
  draw: () => { prompt: string; text: string; answer: string; wrong: readonly string[]; hints: Hints },
): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const d = draw();
      const options = shuffle(ctx.rng, [d.answer, ...distinct(d.answer, d.wrong).slice(0, 2)]);
      return {
        type: "fill-blank",
        prompt: d.prompt,
        payload: { text: d.text, blanks: [{ options, answer: d.answer }], game: originOf(kind, ctx), concept },
        answerKey: d.answer,
        hints: [...d.hints],
      };
    },
    (game) => `${game.prompt}|${String(game.payload.text)}`,
  );
}

/** Un appariement : des paires dont la gauche et la droite sont toutes différentes. */
export function linkGame(
  ctx: GameContext,
  kind: string,
  concept: string,
  draw: () => { prompt: string; pairs: readonly { left: string; right: string }[]; hints: Hints },
): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const d = draw();
      const pairs = d.pairs.map((pair) => ({ left: pair.left, right: pair.right }));
      return {
        type: "match",
        prompt: d.prompt,
        payload: { pairs, game: originOf(kind, ctx), concept },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [...d.hints],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((pair) => pair.left)
        .sort()
        .join(","),
  );
}

/** Un glissé en deux cases : chaque étiquette a une seule case, les deux cases sont servies. */
export function sortGame(
  ctx: GameContext,
  kind: string,
  concept: string,
  draw: () => { prompt: string; zones: readonly [string, string]; items: readonly { text: string; zone: string }[]; hints: Hints },
): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const d = draw();
      const items = shuffle(ctx.rng, d.items).map((item) => ({ text: item.text, correctZone: item.zone }));
      return {
        type: "drag-drop",
        prompt: d.prompt,
        payload: { zones: [...d.zones], items, game: originOf(kind, ctx), concept },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [...d.hints],
      };
    },
    (game) => `${game.prompt}|${JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort())}`,
  );
}

/** Un ordre : la suite juste, les tuiles toutes différentes, au moins trois. */
export function sequenceGame(
  ctx: GameContext,
  kind: string,
  concept: string,
  draw: () => { prompt: string; sequence: readonly string[]; hints: Hints },
): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const d = draw();
      return {
        type: "order",
        prompt: d.prompt,
        payload: { correctSequence: [...d.sequence], game: originOf(kind, ctx), concept },
        answerKey: d.sequence.join(" "),
        hints: [...d.hints],
      };
    },
    (game) => String(game.answerKey),
  );
}

/** Une majuscule à la première lettre. */
export const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** La première lettre d'un mot en minuscule, pour l'indice « Le mot commence par la lettre… ». */
export const firstLetter = (text: string) => text[0].toLowerCase();
