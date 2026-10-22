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
import { fresh, levelGroup, originOf, pick, shuffle, variantsForLevel, type GameContext, type GameLevel, type GeneratedGame } from "./shared";

// Les aides de partage par palier vivent dans `shared.ts` (`pickFresh` et `takeFresh` s'en servent) ; on les réexporte ici pour les gabarits à tableau.
export { levelGroup, variantsForLevel };

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

/**
 * Les variantes d'un palier quand la liste est longue et rangée sans ordre voulu : celles dont la place, dans la liste, tombe dans le groupe du
 * palier (la 1re, la 4e, la 7e… au niveau 1 ; la 2e, la 5e… au niveau 2). Là où `variantsForLevel` donne un tiers d'un seul bloc, celle-ci
 * mêle : un palier a un peu de tout.
 */
export function spreadForLevel<T>(items: readonly T[], level: GameLevel, shift = 0): T[] {
  const mine = items.filter((_, index) => index % 3 === (levelGroup(level) + shift) % 3);
  return mine.length > 0 ? mine : [...items];
}

/**
 * Une variante pour ce palier : d'abord une de celles que le palier préfère (`own`) et qui n'a pas encore servi dans ce palier, sinon une autre qui
 * n'a pas servi, sinon n'importe laquelle. `keyOf` dit ce qui fait l'identité d'une variante ; elle est notée dans `ctx.used`. C'est ce qui permet à
 * un gabarit qui pose plusieurs fois la même question dans un palier (« Quel animal est le plus… ? » quatre fois au CI) de ne pas se tenir à un seul
 * groupe : le premier tirage prend le groupe du palier, les suivants prennent ce qui n'a pas servi.
 */
export function pickPreferred<T>(ctx: GameContext, items: readonly T[], own: readonly T[], keyOf: (item: T) => string): T {
  const unused = (list: readonly T[]) => list.filter((item) => !ctx.used.has(keyOf(item)));
  const ownUnused = unused(own);
  const anyUnused = unused(items);
  const chosen = pick(ctx.rng, ownUnused.length > 0 ? ownUnused : anyUnused.length > 0 ? anyUnused : items);
  ctx.used.add(keyOf(chosen));
  return chosen;
}

/**
 * `pickPreferred` avec, pour variantes du palier, son tiers de la liste (`variantsForLevel`), ou ses places mêlées (`spreadForLevel`).
 * `shift` décale le groupe de 0, 1 ou 2 crans : plusieurs genres d'une même thématique, qui puisent dans la même banque de faits, prennent
 * chacun un décalage différent et préfèrent ainsi, dans un même palier, des tiers différents au lieu de se disputer le même.
 */
export function pickForLevel<T>(
  ctx: GameContext,
  items: readonly T[],
  keyOf: (item: T) => string,
  mode: "thirds" | "spread" = "thirds",
  shift = 0,
): T {
  const own = mode === "thirds" ? variantsForLevel(items, ctx.level, shift) : spreadForLevel(items, ctx.level, shift);
  return pickPreferred(ctx, items, own, keyOf);
}

/** Une majuscule à la première lettre. */
export const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** La première lettre d'un mot en minuscule, pour l'indice « Le mot commence par la lettre… ». */
export const firstLetter = (text: string) => text[0].toLowerCase();
