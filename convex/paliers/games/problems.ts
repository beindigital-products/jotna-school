/**
 * LES GABARITS DE PETITS PROBLÈMES : trouver un indice dans une image, lire un
 * tableau à double entrée, repérer la donnée et la question d'un problème, les
 * données utiles et inutiles. Pour l'enfant de CI (« Petits problèmes »,
 * `ma-ci-problemes`), qui entend l'énoncé avant de savoir le lire.
 *
 * Le modèle écrivait « Awa a 3 mangues, elle en mange 5 », « Combien de billes
 * as-tu ? » sans billes à l'écran, et des tableaux que l'écran ne dessine pas.
 * Ici l'histoire est tirée d'un lexique fermé (`stories.ts`), la réponse est
 * CALCULÉE ou LUE dans ce que l'énoncé montre, jamais écrite à part, et les
 * mauvais choix sont des erreurs d'enfant (tout compter, oublier de calculer,
 * se servir de la donnée inutile) qui ne valent jamais la bonne réponse.
 *
 * CE QUE TOUS LES GABARITS RESPECTENT
 * - Le plafond des nombres vient de la fiche (`vocabulary`, « nombres-20 »),
 *   et monte avec le palier : 5, puis 10, puis 15 et 20 (`TOP_BY_LEVEL`).
 *   Le CI à trois paliers joue les niveaux 1, 2 et 4 : le niveau 3 n'est vu
 *   qu'avec quatre paliers, et se joue comme le dernier.
 * - Une rangée d'émojis ne dépasse jamais dix ; au-delà de dix, un nombre
 *   s'écrit en chiffres, sans émojis. Aucun calcul ne passe la dizaine
 *   (`noTenCrossing`) : 7 − 3, 10 + 6 et 17 − 4, jamais 8 + 5 ni 13 − 5.
 * - Deux phrases au plus, vingt mots au plus (émojis non comptés), aucun
 *   deux-points, une apostrophe droite au plus : un prénom à voyelle ou un
 *   pluriel à voyelle par énoncé, pas les deux.
 * - La voix de Pio ne dit que l'énoncé, sans les émojis : un émoji illustre un
 *   mot écrit ou EST la donnée à regarder, l'énoncé reste correct sans lui.
 * - Trois indices, du plus vague au plus précis, sans chiffre, sans la
 *   réponse : aucun prénom quand la réponse est un prénom, aucun mot proposé
 *   quand la réponse est un mot.
 * - Les prénoms et les objets se tirent avec `pickFresh` et des clés partagées
 *   par les dix gabarits (« prenom:Awa », « objet:🥭 ») : dix histoires d'un
 *   palier changent de personnages et de choses.
 *
 * LE TABLEAU À DOUBLE ENTRÉE n'a pas de rendu de grille : l'énoncé est du
 * texte. Deux approximations honnêtes : une grille d'émojis sur plusieurs
 * lignes (`ExercisePrompt` affiche les retours à la ligne, et les émojis ont
 * tous la même largeur) dont une case manque, et un tableau de nombres dit en
 * deux lignes. Ce que cela ne couvre pas : les en-têtes écrits, la lecture
 * inverse, le remplissage d'un tableau d'effectifs.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { numberCap } from "./numbers";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import {
  AGES,
  CELLS,
  CHILDREN,
  ITEMS,
  LARGE_GRIDS,
  MISSING_CELL,
  SCENES,
  SMALL_GRIDS,
  VERBS,
  asks,
  cellOf,
  clash,
  hasHe,
  ofChild,
  ofItems,
  pronoun,
  quantity,
  type Cell,
  type Child,
  type Item,
  type Verb,
} from "./stories";

// ===========================================================================
// LES NOMBRES : plafond, passage de la dizaine, mauvais choix
// ===========================================================================

/** Le plus grand nombre d'un palier : 5 à la découverte, le plafond de la fiche à la maîtrise. */
const TOP_BY_LEVEL: Record<10 | 20, Record<GameLevel, number>> = {
  10: { 1: 5, 2: 7, 3: 9, 4: 10 },
  20: { 1: 5, 2: 10, 3: 15, 4: 20 },
};

export function topOf(ctx: GameContext): number {
  return TOP_BY_LEVEL[numberCap(ctx.vocabulary)][ctx.level];
}

/** Le plus grand nombre qu'une rangée d'émojis dessine : jamais plus de dix (consigne du CI). */
const rowMax = (ctx: GameContext): number => Math.min(10, topOf(ctx));

/**
 * Un calcul du CI ne passe pas la dizaine : 4 + 3, 7 − 3, et de 11 à 20 seulement
 * 10 + 6, 12 + 5, 17 − 4, 14 − 4. Ni 8 + 5, ni 13 − 5.
 */
export function noTenCrossing(a: number, op: "+" | "-", b: number): boolean {
  if (b < 1) return false;
  if (op === "+") return a + b <= 10 || (a >= 10 && (a % 10) + b <= 9);
  return b < a && (a <= 10 || b <= a % 10);
}

/** Toutes les paires (a, b) permises, puis une au hasard : un tirage qui ne peut pas échouer. */
function drawPair(
  ctx: GameContext,
  op: "+" | "-",
  range: { aLo: number; aHi: number; bMax: number; top: number },
  keep: (a: number, b: number) => boolean = () => true,
): [number, number] | null {
  const pairs: [number, number][] = [];
  for (let a = range.aLo; a <= range.aHi; a++) {
    for (let b = 1; b <= range.bMax; b++) {
      const result = op === "+" ? a + b : a - b;
      if (noTenCrossing(a, op, b) && result >= 1 && result <= range.top && keep(a, b)) pairs.push([a, b]);
    }
  }
  return pairs.length > 0 ? pick(ctx.rng, pairs) : null;
}

/** `count` nombres tous différents entre `lo` et `hi`. */
function distinct(ctx: GameContext, count: number, lo: number, hi: number): number[] {
  return shuffle(
    ctx.rng,
    Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
  ).slice(0, count);
}

/**
 * Les options d'un QCM de nombre : la réponse, puis les erreurs d'enfant propres
 * au gabarit (`anchors`, dans l'ordre : la première est l'erreur que le gabarit
 * fait voir, elle n'est jamais écartée au profit d'une autre), puis les voisins.
 * Tout reste entre 1 et le plafond du palier (jamais 11 au deuxième palier),
 * différent de la réponse et des autres. Les options sont mélangées à la fin.
 */
function numberOptions(
  ctx: GameContext,
  answer: number,
  anchors: readonly number[],
  count = 3,
): { options: string[]; correctIndex: number } {
  const top = topOf(ctx);
  const wrong: number[] = [];
  const add = (n: number) => {
    if (wrong.length < count - 1 && Number.isInteger(n) && n >= 1 && n <= top && n !== answer && !wrong.includes(n)) wrong.push(n);
  };
  for (const n of anchors) add(n);
  for (const d of [1, 2, 3, 4]) for (const n of shuffle(ctx.rng, [answer - d, answer + d])) add(n);
  const options = shuffle(ctx.rng, [answer, ...wrong]).map(String);
  return { options, correctIndex: options.indexOf(String(answer)) };
}

function qcm(
  kind: string,
  ctx: GameContext,
  concept: string,
  prompt: string,
  answer: number,
  anchors: readonly number[],
  hints: [string, string, string],
  count = 3,
): GeneratedGame {
  return {
    type: "qcm",
    prompt,
    payload: { ...numberOptions(ctx, answer, anchors, count), game: originOf(kind, ctx), concept },
    answerKey: String(answer),
    hints,
  };
}

// ===========================================================================
// LES PERSONNAGES ET LES CHOSES D'UNE HISTOIRE
// ===========================================================================

const childKey = (child: Child) => `prenom:${child.name}`;
const itemKey = (thing: Item) => `objet:${thing.emoji}`;

function pickChild(ctx: GameContext, keep: (child: Child) => boolean = () => true): Child {
  const pool = CHILDREN.filter(keep);
  return pickFresh(ctx, pool.length > 0 ? pool : CHILDREN, childKey);
}

/**
 * L'enfant qui donne quelque chose au héros d'une histoire dont la question
 * reprend le héros par un pronom seul (« Combien en a-t-elle maintenant ? ») :
 * de l'autre genre, pour que le pronom ne puisse désigner que le héros, à
 * l'oral aussi (« Lamine a ces ballons et Ousmane lui en donne 2. Combien en
 * a-t-il maintenant ? » laissait deviner de qui on parle).
 */
const pickGiver = (ctx: GameContext, hero: Child): Child => pickChild(ctx, (c) => c !== hero && c.gender !== hero.gender);

/**
 * Plusieurs enfants pour une même histoire, tous différents. `maxVowel` borne les
 * prénoms à voyelle (« d'Awa » est une apostrophe) ; `firstConsonant` évite
 * « qu'Awa » pour le premier.
 */
function pickChildren(ctx: GameContext, count: number, limits: { maxVowel?: number; firstConsonant?: boolean } = {}): Child[] {
  const out: Child[] = [];
  let vowels = 0;
  for (let i = 0; i < count; i++) {
    const noVowel = vowels >= (limits.maxVowel ?? count) || (i === 0 && limits.firstConsonant === true);
    const chosen = pickChild(ctx, (c) => !out.includes(c) && !(noVowel && c.vowel));
    if (chosen.vowel) vowels++;
    out.push(chosen);
  }
  return out;
}

function pickItem(ctx: GameContext, keep: (thing: Item) => boolean = () => true): Item {
  const pool = ITEMS.filter(keep);
  return pickFresh(ctx, pool.length > 0 ? pool : ITEMS, itemKey);
}

const row = (thing: Item, count: number) => thing.emoji.repeat(count);
const verbOf = (ctx: GameContext, thing: Item): Verb => VERBS[pick(ctx.rng, thing.remove)];
const oneByOne = (thing: Item) => (thing.gender === "f" ? "une par une" : "un par un");

// ===========================================================================
// 1. TROUVER UN INDICE DANS UNE IMAGE
// ===========================================================================

/**
 * « Combien de poules vois-tu dans la cour ? 🐔 🐑 🐔 🐔 🐑 » : une scène pleine de
 * choses, et seule la sorte nommée compte. Deux sortes aux premiers paliers,
 * trois ensuite ; la rangée tient dans le plafond du palier, pour que « tout
 * compter » (le total) reste un mauvais choix proposable.
 */
export function makeCountInScene(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "image-compter", () => {
    const scene = pick(ctx.rng, SCENES);
    const target = pickFresh(ctx, scene.things, itemKey);
    const others = shuffle(
      ctx.rng,
      scene.things.filter((t) => t !== target),
    ).slice(0, ctx.level >= 3 ? 2 : 1);
    const max = rowMax(ctx);
    const [lo, hi] = ctx.level === 1 ? [2, 4] : ctx.level === 2 ? [2, 6] : [3, 7];
    const n = randomInt(ctx.rng, lo, Math.max(lo, Math.min(hi, max - others.length)));
    // Chaque autre sorte : au moins une, jamais autant que la sorte demandée, le total dans la rangée.
    let left = max - n;
    const counts = others.map((_, i) => {
      const stillToPlace = others.length - i - 1;
      const candidates = Array.from({ length: left - stillToPlace }, (_, k) => k + 1).filter((c) => c !== n);
      const c = pick(ctx.rng, candidates);
      left -= c;
      return c;
    });
    const drawn = shuffle(ctx.rng, [
      ...Array.from({ length: n }, () => target.emoji),
      ...others.flatMap((t, i) => Array.from({ length: counts[i] }, () => t.emoji)),
    ]);
    const total = n + counts.reduce((sum, c) => sum + c, 0);
    return qcm(
      "image-compter",
      ctx,
      "trouver un indice dans une image",
      `Combien de ${target.plural} vois-tu ${scene.place} ? ${drawn.join(" ")}`,
      n,
      [total, ...counts],
      [
        `Cherche seulement les ${target.plural}, sans regarder les autres dessins.`,
        `Touche chaque ${target.singular} du doigt, ${oneByOne(target)}, sans compter le reste.`,
        "Le dernier nombre que tu dis est la réponse.",
      ],
    );
  });
}

/**
 * « Voici les billes de Moussa 🔵🔵, de Fatou 🔵🔵🔵🔵🔵 et de Cheikh 🔵. Qui a le plus
 * de billes ? » : la réponse n'est écrite nulle part, elle se lit dans l'image.
 * Au premier palier « le plus », avec un écart d'au moins deux ; ensuite « le
 * moins » aussi ; au dernier « autant que », avec quatre enfants. Toujours trois
 * enfants au moins : il faut deux mauvais choix.
 */
export function makeWhoHas(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "image-qui", () => {
    // Un pluriel à consonne (« le plus de billes ») et un prénom à voyelle au plus : une apostrophe au plus.
    const thing = pickItem(ctx, (t) => !t.vowel);
    if (ctx.level >= 3) {
      const [ref, ...others] = pickChildren(ctx, 4, { maxVowel: 1, firstConsonant: true });
      // Le premier enfant en a `r` ; un seul autre en a autant, les deux derniers un autre nombre chacun.
      const r = randomInt(ctx.rng, 1, 6);
      const [x, y] = shuffle(
        ctx.rng,
        [1, 2, 3, 4, 5, 6].filter((v) => v !== r),
      ).slice(0, 2);
      const counts = shuffle(ctx.rng, [r, x, y]);
      const winner = others[counts.indexOf(r)];
      const kids = [ref, ...others];
      const all = [r, ...counts];
      const shown = kids.map((kid, i) => `${ofChild(kid)} ${row(thing, all[i])}`);
      const options = shuffle(ctx.rng, others).map((kid) => kid.name);
      return {
        type: "qcm",
        prompt: `Voici les ${thing.plural} ${shown.slice(0, 3).join(", ")} et ${shown[3]}. Qui a autant de ${thing.plural} que ${ref.name} ?`,
        payload: { options, correctIndex: options.indexOf(winner.name), game: originOf("image-qui", ctx), concept: "lire une image pour savoir qui" },
        answerKey: winner.name,
        hints: [
          `Compte d'abord les ${thing.plural} du premier enfant.`,
          `Compte ensuite les ${thing.plural} de chaque autre enfant.`,
          "Cherche l'enfant qui en a le même nombre.",
        ],
      };
    }
    const kids = pickChildren(ctx, 3, { maxVowel: 1 });
    const most = ctx.level === 1 || ctx.rng() < 0.5;
    let counts: number[];
    if (ctx.level === 1) {
      // Le gagnant dépasse les deux autres d'au moins deux : 4 ou 5, les autres en dessous de deux crans.
      const winner = randomInt(ctx.rng, 4, 5);
      counts = shuffle(ctx.rng, [winner, ...distinct(ctx, 2, 1, winner - 2)]);
    } else {
      counts = distinct(ctx, 3, 1, Math.min(7, rowMax(ctx)));
    }
    const answer = most ? Math.max(...counts) : Math.min(...counts);
    const winner = kids[counts.indexOf(answer)];
    const shown = kids.map((kid, i) => `${ofChild(kid)} ${row(thing, counts[i])}`);
    const options = shuffle(ctx.rng, kids).map((kid) => kid.name);
    return {
      type: "qcm",
      prompt: `Voici les ${thing.plural} ${shown[0]}, ${shown[1]} et ${shown[2]}. Qui a le ${most ? "plus" : "moins"} de ${thing.plural} ?`,
      payload: { options, correctIndex: options.indexOf(winner.name), game: originOf("image-qui", ctx), concept: "lire une image pour savoir qui" },
      answerKey: winner.name,
      hints: [
        `Regarde les ${thing.plural} de chaque enfant.`,
        `Compte les ${thing.plural} de chaque enfant, ${oneByOne(thing)}.`,
        most ? "Compare les nombres que tu as trouvés, le plus grand gagne." : "Le moins, c'est le plus petit des nombres que tu as trouvés.",
      ],
    };
  });
}

/**
 * « Awa cueille ces mangues 🥭🥭🥭🥭 et en mange 1. Combien lui en reste-t-il ? » : le
 * premier nombre n'est écrit nulle part, il se compte dans l'image. Un seul
 * objet (sinon « en » serait ambigu), un seul chiffre, le verbe dit l'opération.
 */
export function makeDatumInImage(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "image-donnee", () => {
    const thing = pickItem(ctx);
    const hero = pickChild(ctx);
    const top = topOf(ctx);
    const max = rowMax(ctx);
    const [aLo, aHi] = ctx.level === 1 ? [2, Math.min(5, max)] : ctx.level === 2 ? [2, Math.min(7, max)] : ctx.level === 3 ? [5, max] : [6, max];
    const bMax = ctx.level === 1 ? 2 : ctx.level === 2 ? 3 : ctx.level === 3 ? 5 : 9;
    const range = { aLo, aHi, bMax, top };
    const added = ctx.rng() < 0.45 ? drawPair(ctx, "+", range) : null;
    const start = `${hero.name} ${thing.gets} ces ${thing.plural} `;
    if (added) {
      const [a, b] = added;
      const giver = pickGiver(ctx, hero);
      return qcm(
        "image-donnee",
        ctx,
        "prendre une donnée dans une image",
        `${start}${row(thing, a)} et ${giver.name} lui en donne ${b}. Combien en ${hasHe(hero)} maintenant ?`,
        a + b,
        [a, a - b, b],
        [
          `Compte d'abord les ${thing.plural} du dessin.`,
          `On lui en donne, ${pronoun(hero)} en a donc plus qu'avant.`,
          "Pars du nombre du dessin et avance d'autant de pas qu'on lui en donne.",
        ],
      );
    }
    const [a, b] = drawPair(ctx, "-", range) ?? [aHi, 1];
    const verb = verbOf(ctx, thing);
    return qcm(
      "image-donnee",
      ctx,
      "prendre une donnée dans une image",
      `${start}${row(thing, a)} et en ${verb.present} ${b}. Combien lui en reste-t-il ?`,
      a - b,
      [a, a + b, b],
      [
        `Compte d'abord les ${thing.plural} du dessin.`,
        `Enlève ce qu'${pronoun(hero)} ${verb.present}, ${oneByOne(thing)}.`,
        `Compte les ${thing.plural} qui restent.`,
      ],
    );
  });
}

// ===========================================================================
// 2. LIRE UN TABLEAU À DOUBLE ENTRÉE
// ===========================================================================

/**
 * Une grille d'émojis sur deux ou trois lignes, dont une case manque (❔) :
 * chaque ligne n'a qu'une sorte d'objet, chaque colonne qu'une couleur (ou
 * l'inverse). « Quel dessin manque dans le tableau ? » ne nomme ni la ligne ni
 * la colonne : il faut lire les deux. Les mauvais choix sont un dessin de la
 * même sorte dans une autre couleur, et un dessin de la même couleur d'une
 * autre sorte, pris hors de la grille quand la table en a (sinon une case de
 * la même ligne ou de la même colonne). Aucun nombre : le premier palier du CI
 * est pré-numérique.
 */
export function makeTableCell(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "tableau-case", () => {
    const grid = pick(ctx.rng, ctx.level >= 3 ? LARGE_GRIDS : SMALL_GRIDS);
    const objects = shuffle(ctx.rng, grid.objects);
    const colors = shuffle(ctx.rng, grid.colors);
    const objectRows = ctx.rng() < 0.5;
    const rows: Cell[][] = objectRows
      ? objects.map((object) => colors.map((color) => cellOf(object, color)!))
      : colors.map((color) => objects.map((object) => cellOf(object, color)!));
    const r = randomInt(ctx.rng, 0, rows.length - 1);
    const c = randomInt(ctx.rng, 0, rows[0].length - 1);
    const missing = rows[r][c];
    const lines = rows.map((line, i) => line.map((cell, j) => (i === r && j === c ? MISSING_CELL : cell.emoji)).join(" "));
    const inGrid = new Set(rows.flat().map((cell) => cell.emoji));
    const shown = rows.flat().filter((cell) => cell !== missing);
    const groups = [
      CELLS.filter((cell) => cell.object === missing.object && !inGrid.has(cell.emoji)),
      CELLS.filter((cell) => cell.color === missing.color && !inGrid.has(cell.emoji)),
      shown.filter((cell) => cell.object === missing.object),
      shown.filter((cell) => cell.color === missing.color),
      shown.filter((cell) => cell.object !== missing.object && cell.color !== missing.color),
    ].map((group) => shuffle(ctx.rng, group));
    const wrong: Cell[] = [];
    const take = (group: Cell[]) => {
      const cell = group.find((candidate) => !wrong.includes(candidate));
      if (cell) wrong.push(cell);
    };
    // D'abord une erreur de couleur et une erreur de sorte, puis de quoi compléter.
    take(groups[0].length > 0 ? groups[0] : groups[2]);
    take(groups[1].length > 0 ? groups[1] : groups[3]);
    const wanted = ctx.level === 1 ? 2 : 3;
    for (const group of groups) while (wrong.length < wanted && group.some((cell) => !wrong.includes(cell))) take(group);
    const options = shuffle(ctx.rng, [missing, ...wrong.slice(0, wanted)]).map((cell) => cell.emoji);
    return {
      type: "qcm",
      prompt: `Regarde le tableau.\n${lines.join("\n")}\nQuel dessin manque dans le tableau ?`,
      payload: { options, correctIndex: options.indexOf(missing.emoji), game: originOf("tableau-case", ctx), concept: "lire un tableau à double entrée" },
      answerKey: missing.emoji,
      // La case qui manque montre un point d'interrogation, pas du vide : les indices disent ce que l'écran montre.
      hints: objectRows
        ? [
            "Trouve la case du point d'interrogation, puis regarde les dessins de sa ligne.",
            "Regarde ensuite la couleur des dessins de sa colonne.",
            "Le dessin qui manque ressemble à ceux de sa ligne, avec la couleur de sa colonne.",
          ]
        : [
            "Trouve la case du point d'interrogation, puis regarde la couleur des dessins de sa ligne.",
            "Regarde ensuite les dessins de sa colonne.",
            "Le dessin qui manque ressemble à ceux de sa colonne, avec la couleur de sa ligne.",
          ],
    };
  });
}

/**
 * « Awa a 3 mangues 🥭🥭🥭 et 1 banane 🍌,\nMoussa a 2 mangues 🥭🥭 et 4 bananes 🍌🍌🍌🍌.
 * Combien de bananes a Moussa ? » : deux enfants, deux objets, quatre nombres tous
 * différents ; trouver la ligne (l'enfant), puis la colonne (l'objet). Les
 * mauvais choix sont les autres cases. Des émojis jusqu'au deuxième palier,
 * des chiffres seuls ensuite.
 */
export function makeTableNumber(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "tableau-nombre", () => {
    const first = pickItem(ctx);
    const second = pickItem(ctx, (t) => t !== first && !clash(t, first));
    const [top1, top2] = pickChildren(ctx, 2);
    const withEmojis = ctx.level <= 2;
    const values = distinct(ctx, 4, 1, withEmojis ? 5 : topOf(ctx));
    const cells = [
      [values[0], values[1]],
      [values[2], values[3]],
    ];
    const text = (n: number, thing: Item) => `${quantity(n, thing)}${withEmojis ? ` ${row(thing, n)}` : ""}`;
    const line = (kid: Child, a: number, b: number) => `${kid.name} a ${text(a, first)} et ${text(b, second)}`;
    const askRow = ctx.rng() < 0.5 ? 0 : 1;
    const askCol = ctx.rng() < 0.5 ? 0 : 1;
    const who = askRow === 0 ? top1 : top2;
    const what = askCol === 0 ? first : second;
    const answer = cells[askRow][askCol];
    const sameRow = cells[askRow][1 - askCol];
    const sameCol = cells[1 - askRow][askCol];
    const diagonal = cells[1 - askRow][1 - askCol];
    return qcm(
      "tableau-nombre",
      ctx,
      "lire un nombre dans un tableau",
      `${line(top1, cells[0][0], cells[0][1])},\n${line(top2, cells[1][0], cells[1][1])}. Combien ${ofItems(what)} a ${who.name} ?`,
      answer,
      ctx.level === 1 ? [sameRow, sameCol] : [sameRow, sameCol, diagonal],
      [
        `Trouve la ligne ${ofChild(who)}.`,
        `Sur la ligne ${ofChild(who)}, cherche les ${what.plural}.`,
        `Le nombre écrit juste devant les ${what.plural} est la réponse.`,
      ],
      ctx.level === 1 ? 3 : 4,
    );
  });
}

// ===========================================================================
// 3. LA DONNÉE ET LA QUESTION D'UN PROBLÈME
// ===========================================================================

/**
 * « Fatou a 4 bananes, elle en donne 1 à Moussa. Combien de bananes Fatou
 * a-t-elle au début ? » : retrouver une donnée sans calculer. Le mauvais choix
 * principal est le résultat du calcul, que l'enfant fait trop tôt. Au premier
 * palier seulement « au début » ; ensuite aussi le nombre donné, mangé, perdu ou
 * vendu. Le résultat diffère toujours des deux données (jamais a = 2b).
 */
export function makeFindDatum(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "probleme-donnee", () => {
    const thing = pickItem(ctx);
    const hero = pickChild(ctx);
    const top = topOf(ctx);
    const bMax = ctx.level === 1 ? 2 : ctx.level === 2 ? 4 : 9;
    const range = { aLo: 2, aHi: top, bMax, top };
    const askStart = ctx.level === 1 || ctx.rng() < 0.5;
    const hints = (second: string): [string, string, string] => [
      "Écoute bien la question, elle ne demande pas de calcul.",
      second,
      "Ce nombre est déjà écrit dans la première phrase.",
    ];
    const added = ctx.level >= 2 && ctx.rng() < 0.4 ? drawPair(ctx, "+", { ...range, aLo: 1 }, (a, b) => a !== b) : null;
    if (added) {
      const [a, b] = added;
      const giver = pickChild(ctx, (c) => c !== hero);
      const story = `${hero.name} a ${quantity(a, thing)}, ${giver.name} lui en donne ${b}.`;
      return askStart
        ? qcm("probleme-donnee", ctx, "repérer la donnée d'un problème", `${story} Combien ${ofItems(thing)} ${hero.name} ${hasHe(hero)} au début ?`, a, [b, a + b], hints(`Cherche combien ${ofItems(thing)} ${hero.name} a avant que quelque chose se passe.`))
        : qcm("probleme-donnee", ctx, "repérer la donnée d'un problème", `${story} Combien ${ofItems(thing)} ${giver.name} donne-t-${pronoun(giver)} ?`, b, [a, a + b], hints(`Cherche ce que fait ${giver.name} dans le problème.`));
    }
    const [a, b] = drawPair(ctx, "-", range, (x, y) => x !== 2 * y) ?? [top, 1];
    const verb = verbOf(ctx, thing);
    const to = verb === VERBS.donne ? ` à ${pickChild(ctx, (c) => c !== hero).name}` : "";
    const story = `${hero.name} a ${quantity(a, thing)}, ${pronoun(hero)} en ${verb.present} ${b}${to}.`;
    return askStart
      ? qcm("probleme-donnee", ctx, "repérer la donnée d'un problème", `${story} Combien ${ofItems(thing)} ${hero.name} ${hasHe(hero)} au début ?`, a, [b, a - b], hints(`Cherche combien ${ofItems(thing)} ${hero.name} a avant que quelque chose se passe.`))
      : qcm("probleme-donnee", ctx, "repérer la donnée d'un problème", `${story} Combien ${ofItems(thing)} ${hero.name} ${asks(verb, hero)} ?`, b, [a, a - b], hints(`Cherche ce que fait ${hero.name} dans le problème.`));
  });
}

const ZONE_KNOWN = "Ce que je sais";
const ZONE_SOUGHT = "Ce que je cherche";
const ZONE_USEFUL = "Ce qui sert";
const ZONE_USELESS = "Ce qui ne sert pas";

type Label = { text: string; correctZone: string };

/**
 * « Glisse chaque phrase du problème dans la bonne case, ce que je sais ou ce
 * que je cherche. » : les phrases du problème en étiquettes, deux cases. Chaque
 * étiquette se comprend seule (l'écran les mélange : ni pronom, ni « en »), et
 * la question finit par un point d'interrogation, le repère qu'on apprend. Au
 * dernier palier, l'histoire peut être une comparaison, ou recevoir l'âge de
 * l'enfant : les cases sont alors « Ce qui sert », « Ce qui ne sert pas » et
 * « Ce que je cherche ». Pas « Ce que je sais » à côté de « Ce qui ne sert
 * pas » : l'âge est aussi quelque chose que je sais, l'enfant qui l'y posait
 * avait une réponse défendable que l'écran refusait. Les trois cases ne se
 * recouvrent pas.
 */
export function makeDatumOrQuestion(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "donnee-ou-question",
    () => {
      const thing = pickItem(ctx);
      const hero = pickChild(ctx);
      const top = topOf(ctx);
      const withEmojis = ctx.level <= 2;
      const emo = (n: number) => (withEmojis ? ` ${row(thing, n)}` : "");
      const range = { aLo: 2, aHi: withEmojis ? rowMax(ctx) : top, bMax: ctx.level === 1 ? 2 : ctx.level === 2 ? 3 : 9, top };
      const story = ctx.level >= 3 ? pick(ctx.rng, ["comparaison", "retrait", "ajout"] as const) : pick(ctx.rng, ["retrait", "ajout"] as const);
      const added = story === "ajout" ? drawPair(ctx, "+", range) : null;
      // Au dernier palier, l'âge du héros : un nombre qui ne sert à rien. La case des données s'appelle alors « Ce qui sert ».
      const useless = ctx.level >= 3 && story !== "comparaison";
      const known = useless ? ZONE_USEFUL : ZONE_KNOWN;
      const labels: Label[] = [];
      let a: number;
      let b: number;
      if (story === "comparaison") {
        const other = pickChild(ctx, (c) => c !== hero);
        [a, b] = distinct(ctx, 2, 1, top);
        labels.push({ text: `${hero.name} a ${quantity(a, thing)}.`, correctZone: known });
        labels.push({ text: `${other.name} a ${quantity(b, thing)}.`, correctZone: known });
        labels.push({ text: `Qui a le plus ${ofItems(thing)} ?`, correctZone: ZONE_SOUGHT });
      } else if (added) {
        [a, b] = added;
        const giver = pickChild(ctx, (c) => c !== hero);
        labels.push({ text: `${hero.name} a ${quantity(a, thing)}${emo(a)}.`, correctZone: known });
        labels.push({ text: `${giver.name} donne ${quantity(b, thing)}${emo(b)} à ${hero.name}.`, correctZone: known });
        labels.push({ text: `Combien ${ofItems(thing)} ${hero.name} ${hasHe(hero)} maintenant ?`, correctZone: ZONE_SOUGHT });
      } else {
        [a, b] = drawPair(ctx, "-", range) ?? [range.aHi, 1];
        const verb = verbOf(ctx, thing);
        labels.push({ text: `${hero.name} a ${quantity(a, thing)}${emo(a)}.`, correctZone: known });
        labels.push({ text: `${hero.name} ${verb.present} ${quantity(b, thing)}${emo(b)}.`, correctZone: known });
        labels.push({ text: `Combien ${ofItems(thing)} reste-t-il à ${hero.name} ?`, correctZone: ZONE_SOUGHT });
      }
      if (useless) {
        // L'âge diffère des deux données.
        const age = pick(ctx.rng, AGES.filter((candidate) => candidate !== a && candidate !== b));
        labels.push({ text: `${hero.name} a ${age} ans.`, correctZone: ZONE_USELESS });
      }
      const zones = useless ? [ZONE_USEFUL, ZONE_USELESS, ZONE_SOUGHT] : [ZONE_KNOWN, ZONE_SOUGHT];
      const items = shuffle(ctx.rng, labels);
      return {
        type: "drag-drop",
        // Vingt mots au plus : la consigne à trois cases perd « du problème » et « la bonne ».
        prompt: useless
          ? "Glisse chaque phrase dans sa case, ce qui sert, ce qui ne sert pas, ce que je cherche."
          : "Glisse chaque phrase du problème dans la bonne case, ce que je sais ou ce que je cherche.",
        payload: { zones, items, game: originOf("donnee-ou-question", ctx), concept: "la donnée et la question d'un problème" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis chaque phrase, une par une.",
          useless
            ? "Un nombre qui ne parle pas de ce que la question demande ne sert pas."
            : "Une phrase qui raconte ce qui se passe dit ce que tu sais.",
          "La phrase qui pose une question finit par un point d'interrogation.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as Label[]).map((item) => item.text).sort()),
  );
}

/**
 * « Awa a 4 mangues 🥭🥭🥭🥭 et elle en mange 1. Complète la question du problème. »
 * puis « Combien de ___ lui reste-t-il ? » : la question parle de ce que racontent
 * les données. Un seul objet dans l'histoire, des pluriels à consonne (« de
 * ___ », jamais « d'___ »), et aucun article devant le trou. Les mauvais mots
 * viennent d'autres familles aux premiers paliers, de la même famille ensuite.
 */
export function makeProblemQuestion(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "probleme-question", () => {
    const thing = pickItem(ctx, (t) => !t.vowel);
    const hero = pickChild(ctx);
    const top = topOf(ctx);
    const withEmojis = ctx.level <= 2;
    const range = { aLo: 2, aHi: withEmojis ? rowMax(ctx) : top, bMax: ctx.level === 1 ? 2 : ctx.level === 2 ? 3 : 9, top };
    const emo = (n: number) => (withEmojis ? ` ${row(thing, n)}` : "");
    const added = ctx.rng() < 0.4 ? drawPair(ctx, "+", range) : null;
    let story: string;
    let text: string;
    if (added) {
      const [a, b] = added;
      const giver = pickGiver(ctx, hero);
      story = `${hero.name} a ${quantity(a, thing)}${emo(a)} et ${giver.name} lui en donne ${b}.`;
      text = `Combien de ___ ${hasHe(hero)} maintenant ?`;
    } else {
      const [a, b] = drawPair(ctx, "-", range) ?? [range.aHi, 1];
      story = `${hero.name} a ${quantity(a, thing)}${emo(a)} et ${pronoun(hero)} en ${verbOf(ctx, thing).present} ${b}.`;
      text = "Combien de ___ lui reste-t-il ?";
    }
    // Les mauvais mots : d'autres familles au premier palier, un de la même famille au deuxième, le plus possible ensuite.
    const sameFamily = shuffle(ctx.rng, ITEMS.filter((t) => !t.vowel && t !== thing && t.family === thing.family));
    const otherFamily = shuffle(ctx.rng, ITEMS.filter((t) => !t.vowel && t.family !== thing.family));
    const wantedSame = ctx.level === 1 ? 0 : ctx.level === 2 ? 1 : 2;
    const wrong = [...sameFamily.slice(0, wantedSame), ...otherFamily].slice(0, 2);
    const label = (t: Item) => (withEmojis ? `${t.plural} ${t.emoji}` : t.plural);
    const options = shuffle(ctx.rng, [thing, ...wrong]).map(label);
    return {
      type: "fill-blank",
      prompt: `${story} Complète la question du problème.`,
      payload: {
        text,
        blanks: [{ options, answer: label(thing) }],
        game: originOf("probleme-question", ctx),
        concept: "la question d'un problème",
      },
      answerKey: label(thing),
      hints: [
        "Écoute bien de quoi parle le problème.",
        "La question demande quelque chose dont le problème parle.",
        "Essaie chaque mot dans la question, un seul va avec le problème.",
      ],
    };
  });
}

// ===========================================================================
// 4. LES DONNÉES UTILES ET INUTILES
// ===========================================================================

/** La donnée qui ne sert à rien : l'âge de l'enfant, ou un second objet (d'une autre famille, puis de la même). */
type Useless = { kind: "age"; value: number } | { kind: "thing"; value: number; thing: Item };

/**
 * L'histoire avec une donnée en trop. Au premier palier un second objet d'une
 * autre famille (un âge dépasserait le plafond de 5) ; au deuxième un âge ou un
 * autre objet ; ensuite un objet de la même famille (des oranges avec les
 * mangues). La donnée inutile diffère des deux données utiles et du résultat,
 * et de préférence un calcul fait avec elle (à la place de l'une ou l'autre
 * donnée) tient sous le plafond : c'est le mauvais choix que `probleme-inutile`
 * fait voir, il doit pouvoir être proposé.
 */
function drawUseless(ctx: GameContext, thing: Item, a: number, op: "+" | "-", b: number): Useless {
  const top = topOf(ctx);
  const result = op === "+" ? a + b : a - b;
  const taken = new Set([a, b, result]);
  const fits = (n: number) => n >= 1 && n <= top;
  const usable = (u: number) => (op === "+" ? fits(u + b) || fits(a + u) : fits(u - b) || fits(a - u));
  // Un âge seulement quand un calcul fait avec lui tient sous le plafond (6 ans avec 3 + 2 sous 7 : aucun) ; sinon un objet.
  const ages = AGES.filter((age) => age <= top && !taken.has(age) && usable(age));
  const form = ctx.level >= 3 ? "same" : ctx.level === 2 && ages.length > 0 && ctx.rng() < 0.5 ? "age" : "other";
  if (form === "age") return { kind: "age", value: pick(ctx.rng, ages) };
  const other = pickItem(ctx, (t) => t !== thing && !clash(t, thing) && (form === "same" ? t.family === thing.family : t.family !== thing.family));
  const values = Array.from({ length: top }, (_, i) => i + 1).filter((n) => !taken.has(n));
  const good = values.filter(usable);
  return { kind: "thing", value: pick(ctx.rng, good.length > 0 ? good : values), thing: other };
}

/** « Awa, 7 ans, a 3 mangues et en mange 1. » ou « Awa a 3 mangues et 2 ballons, elle mange 1 mangue. » */
function uselessStory(hero: Child, thing: Item, a: number, verb: Verb, b: number, useless: Useless): string {
  return useless.kind === "age"
    ? `${hero.name}, ${useless.value} ans, a ${quantity(a, thing)} et en ${verb.present} ${b}.`
    : `${hero.name} a ${quantity(a, thing)} et ${quantity(useless.value, useless.thing)}, ${pronoun(hero)} ${verb.present} ${quantity(b, thing)}.`;
}

/** « Awa, 7 ans, a 3 mangues, Moussa lui donne 2 mangues. » ou « Awa a 3 mangues et 2 ballons, Moussa lui donne 2 mangues. » */
function uselessGift(hero: Child, giver: Child, thing: Item, a: number, b: number, useless: Useless): string {
  const gift = `${giver.name} lui donne ${quantity(b, thing)}.`;
  return useless.kind === "age"
    ? `${hero.name}, ${useless.value} ans, a ${quantity(a, thing)}, ${gift}`
    : `${hero.name} a ${quantity(a, thing)} et ${quantity(useless.value, useless.thing)}, ${gift}`;
}

function uselessRange(ctx: GameContext) {
  const top = topOf(ctx);
  return { aLo: 2, aHi: top, bMax: ctx.level === 1 ? 2 : ctx.level === 2 ? 3 : 9, top };
}

/**
 * « Awa, 7 ans, a 3 mangues et en mange 1. Quel nombre est inutile pour les mangues
 * qui restent ? » : les trois options sont les trois nombres du problème. La
 * question nomme ce qu'on cherche (les mangues qui restent), sinon « inutile »
 * se discuterait ; « inutile » est le mot de la fiche, le premier indice le
 * traduit. Vingt mots tout juste avec deux objets : aucune variante plus longue.
 */
export function makeUselessDatum(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "donnee-inutile", () => {
    const thing = pickItem(ctx);
    const hero = pickChild(ctx);
    const [a, b] = drawPair(ctx, "-", uselessRange(ctx)) ?? [topOf(ctx), 1];
    const verb = verbOf(ctx, thing);
    const useless = drawUseless(ctx, thing, a, "-", b);
    const options = shuffle(ctx.rng, [useless.value, a, b]).map(String);
    return {
      type: "qcm",
      prompt: `${uselessStory(hero, thing, a, verb, b, useless)} Quel nombre est inutile pour les ${thing.plural} qui restent ?`,
      payload: { options, correctIndex: options.indexOf(String(useless.value)), game: originOf("donnee-inutile", ctx), concept: "les données utiles et inutiles" },
      answerKey: String(useless.value),
      hints: [
        "Inutile veut dire qui ne sert pas pour répondre à la question.",
        `Pour chaque nombre, demande-toi s'il parle des ${thing.plural}.`,
        "Un seul nombre parle d'autre chose.",
      ],
    };
  });
}

/**
 * « Cheikh a 17 moutons et 3 poules, il vend 5 moutons. Combien de moutons lui
 * reste-t-il ? » : résoudre en laissant la donnée inutile de côté. Les mauvais
 * choix sont les deux calculs faits avec elle (à la place de l'une ou l'autre
 * donnée) et le nombre de départ.
 */
export function makeSolveWithUseless(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "probleme-inutile", () => {
    const thing = pickItem(ctx);
    const hero = pickChild(ctx);
    const range = uselessRange(ctx);
    const added = ctx.rng() < 0.4 ? drawPair(ctx, "+", range) : null;
    if (added) {
      const [a, b] = added;
      const useless = drawUseless(ctx, thing, a, "+", b);
      const giver = pickGiver(ctx, hero);
      return qcm(
        "probleme-inutile",
        ctx,
        "résoudre sans la donnée inutile",
        `${uselessGift(hero, giver, thing, a, b, useless)} Combien ${ofItems(thing)} ${hasHe(hero)} maintenant ?`,
        a + b,
        [useless.value + b, a + useless.value, a],
        [
          `Cherche les nombres qui parlent des ${thing.plural}.`,
          `Un des nombres ne parle pas des ${thing.plural}, laisse-le de côté.`,
          // Pas « compte tout » : tout, donnée inutile comprise, est le piège de l'exercice.
          `Ajoute ce qu'on lui donne, puis compte les ${thing.plural}.`,
        ],
      );
    }
    const [a, b] = drawPair(ctx, "-", range) ?? [range.top, 1];
    const verb = verbOf(ctx, thing);
    const useless = drawUseless(ctx, thing, a, "-", b);
    return qcm(
      "probleme-inutile",
      ctx,
      "résoudre sans la donnée inutile",
      `${uselessStory(hero, thing, a, verb, b, useless)} Combien ${ofItems(thing)} lui reste-t-il ?`,
      a - b,
      [useless.value - b, a - useless.value, a],
      [
        `Cherche les nombres qui parlent des ${thing.plural}.`,
        `Un des nombres ne parle pas des ${thing.plural}, laisse-le de côté.`,
        "Enlève ce qui part, puis compte ce qui reste.",
      ],
    );
  });
}
