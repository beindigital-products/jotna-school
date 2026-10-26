/**
 * LES GABARITS DE L'ESPACE : sur et sous, devant et derrière, à côté, entre, près et loin, droite et
 * gauche, les repères fixes et mobiles, le quadrillage. Pour l'enfant de CI qui se repère autour de
 * lui (géographie, étape 1 : `ge-ci-position`, `ge-ci-lateralite`, `ge-ci-reperes`,
 * `ge-ci-quadrillage`).
 *
 * Le modèle écrivait « Place le chien à droite et le chat à gauche » sans rien montrer, « La case D4
 * est en bas à droite » sans quadrillage, « Mets ces repères en ordre d'apparition : portail, baobab,
 * mosquée » (aucun ordre n'est le bon) : quinze exercices sur dix-neuf étaient faux ou injouables.
 * Ici la scène est DESSINÉE par des émojis sur plusieurs lignes de l'énoncé (une rangée, une pile,
 * un quadrillage : `ExercisePrompt` garde les retours à la ligne), ou donnée en mots (« Le chat est
 * devant le chien »), et la bonne réponse se lit dans la scène. Les mauvais choix ne peuvent pas
 * être une deuxième bonne réponse : on ne demande « à côté de » que d'un dessin au bout de la
 * rangée, qui n'a qu'un voisin.
 *
 * RÈGLES POUR AJOUTER UNE CHOSE
 * - Un émoji ancien (Unicode 11 au plus, sans sélecteur de variation), et un nom du catalogue
 *   d'images (`lib/item-images.ts`) : un test refuse une tuile « le + un nom » sans image au CI.
 * - Les dessins d'une scène n'ont pas d'élision (« l'éléphant », « l'ananas », « l'orange ») : un
 *   énoncé qui les nomme aurait deux apostrophes, et l'écran n'en veut qu'une.
 * - La gauche est du côté où l'on commence à lire, la droite du côté où l'on finit (comme
 *   `rangee-position`), le haut est en haut de l'écran.
 * - Un repère FIXE ne bouge jamais (un arbre, une mosquée, un portail), un repère MOBILE se déplace
 *   (une voiture, un âne, une charrette).
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une
 * apostrophe droite, et vingt mots au plus. La voix de Pio ne dit pas les émojis : un énoncé nomme
 * toujours le dessin par son nom (« la poule »), jamais par son seul émoji.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, levelGroup, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, type GameContext, type GeneratedGame } from "./shared";
import { CATEGORIES, optionOf, type Thing } from "./things";

const isElided = (thing: Thing) => /^l['’]/.test(thing.label);

/** Les dessins des rangées et des quadrillages : douze animaux et fruits, sans élision, tous différents. */
export const SCENE_THINGS: readonly Thing[] = [...CATEGORIES.animal.things, ...CATEGORIES.fruit.things].filter((thing) => !isElided(thing));

/** Les animaux des petites histoires : ceux qui marchent sur la terre, devant une maison ou sous un arbre. */
export const LAND_ANIMALS: readonly Thing[] = CATEGORIES.animal.things.filter((thing) => ["🐔", "🐑", "🐄", "🐈", "🐕"].includes(thing.emoji));

/** Les supports d'une pile : on est SUR eux ou SOUS eux. */
export const SUPPORTS: readonly Thing[] = [
  { emoji: "🌳", label: "l'arbre" },
  { emoji: "🏠", label: "la maison" },
  { emoji: "🚗", label: "la voiture" },
  { emoji: "📦", label: "la boîte" },
];

const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;
const rowText = (things: readonly Thing[]) => things.map((thing) => thing.emoji).join(" ");

/** « de la poule », « du chien » : la préposition « de » qui va avec l'article (les dessins d'une scène n'ont pas d'élision). */
const deOf = (label: string) => (label.startsWith("le ") ? `du ${label.slice(3)}` : `de ${label}`);

/** Les choix d'un QCM : la bonne réponse et `count` mauvais dessins de `pool`, jamais la bonne réponse deux fois. */
function withWrong(ctx: GameContext, answer: Thing, pool: readonly Thing[], count = 2): string[] {
  const wrong = shuffle(
    ctx.rng,
    pool.filter((thing) => thing.emoji !== answer.emoji),
  ).slice(0, count);
  return shuffle(ctx.rng, [answer, ...wrong]).map(optionOf);
}

// ===========================================================================
// SUR ET SOUS, DEVANT ET DERRIÈRE
// ===========================================================================

/** « Regarde le dessin. (un animal, une maison, un animal) Qui est sur la maison ? » : la pile se lit de haut en bas. */
export function makeOnUnder(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "sur-sous", () => {
    // Deux piles d'un même palier n'ont pas le même support : « Qui est sous la boîte ? » deux fois se remarquerait.
    const support = pickFresh(ctx, SUPPORTS, (thing) => `sur-sous-support:${thing.label}`);
    const [top, bottom, third] = shuffle(ctx.rng, LAND_ANIMALS);
    // Au premier palier, seulement « sur » ; ensuite aussi « sous ».
    const ask = ctx.level === 1 ? "sur" : pick(ctx.rng, ["sur", "sous"] as const);
    const answer = ask === "sur" ? top : bottom;
    const options = shuffle(ctx.rng, [top, bottom, third]).map(optionOf);
    return {
      type: "qcm",
      prompt: `Regarde le dessin.\n${top.emoji}\n${support.emoji}\n${bottom.emoji}\nQui est ${ask} ${support.label} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("sur-sous", ctx),
        concept: "sur et sous",
      },
      answerKey: optionOf(answer),
      hints: [
        "Regarde le dessin de haut en bas, ligne après ligne.",
        "Ce qui est sur est au-dessus, ce qui est sous est au-dessous.",
        "Dis le nom de chaque animal.",
      ],
    };
  });
}

/** « Le chat est devant le chien. Qui est derrière ? » : en mots, avec trois animaux au dernier palier. */
export function makeFrontBehind(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "devant-derriere", () => {
    const [a, b, c] = shuffle(ctx.rng, LAND_ANIMALS);
    if (ctx.level >= 3) {
      // Trois animaux à la queue leu leu : celui du milieu, ou celui qui ferme la file.
      const askLast = ctx.rng() < 0.5;
      const answer = askLast ? c : b;
      const options = shuffle(ctx.rng, [a, b, c]).map(optionOf);
      return {
        type: "qcm",
        prompt: `${cap(a.label)} est devant ${b.label}. ${cap(b.label)} est devant ${c.label}. Qui est ${askLast ? "tout derrière" : "au milieu"} ?`,
        payload: {
          options,
          correctIndex: options.indexOf(optionOf(answer)),
          game: originOf("devant-derriere", ctx),
          concept: "devant et derrière",
        },
        answerKey: optionOf(answer),
        hints: [
          "Écoute bien qui est devant qui, phrase après phrase.",
          "Celui qui est devant tous les autres est le premier de la file.",
          "Celui qui suit tous les autres est le dernier de la file.",
        ],
      };
    }
    const askBehind = ctx.level >= 2 && ctx.rng() < 0.5;
    const answer = askBehind ? b : a;
    const options = shuffle(ctx.rng, [a, b, c]).map(optionOf);
    return {
      type: "qcm",
      prompt: `${cap(a.label)} est devant ${b.label}. Qui est ${askBehind ? "derrière" : "devant"} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("devant-derriere", ctx),
        concept: "devant et derrière",
      },
      answerKey: optionOf(answer),
      hints: [
        "Écoute bien qui est devant qui.",
        "Devant, c'est la place de celui qui est le premier.",
        "Derrière, c'est la place de celui qui suit.",
      ],
    };
  });
}

/** Les repères d'une petite histoire : sans élision, chacun a son image au catalogue. */
const REFERENCES = ["la maison", "la voiture", "le baobab", "la mosquée", "le portail"] as const;

/** « Le chat est devant la mosquée. Le chien est derrière la mosquée. Glisse chaque animal dans sa case. » */
export function makeFrontBehindSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "position-glisser",
    () => {
      const [a, b] = shuffle(ctx.rng, LAND_ANIMALS);
      const reference = pick(ctx.rng, REFERENCES);
      const zoneFront = `Devant ${reference}`;
      const zoneBehind = `Derrière ${reference}`;
      const items = shuffle(ctx.rng, [
        { text: a.label, correctZone: zoneFront },
        { text: b.label, correctZone: zoneBehind },
      ]);
      return {
        type: "drag-drop",
        prompt: `${cap(a.label)} est devant ${reference}. ${cap(b.label)} est derrière ${reference}. Glisse chaque animal dans sa case.`,
        payload: {
          zones: [zoneFront, zoneBehind],
          items,
          game: originOf("position-glisser", ctx),
          concept: "devant et derrière",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Écoute bien où est chaque animal.",
          "Celui qui est devant se met dans la case du devant.",
          "Celui qui est derrière se met dans l'autre case.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/**
 * « Le chat est devant le chien. Le chien est devant la poule. Mets-les dans l'ordre de la file. » : trois
 * animaux (un ordre de deux se devine une fois sur deux). Chaque phrase lie deux voisins de la file, donc
 * un seul ordre les respecte toutes. Au premier palier on dit « devant » dans l'ordre de la file ; ensuite
 * on dit aussi « derrière », et au dernier palier les phrases ne suivent plus l'ordre de la file.
 */
export function makeQueueOrder(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "file-ordre", () => {
    const queue = shuffle(ctx.rng, LAND_ANIMALS).slice(0, 3);
    const sentences = queue.slice(1).map((back, i) => {
      const front = queue[i];
      return ctx.level >= 2 && ctx.rng() < 0.5 ? `${cap(back.label)} est derrière ${front.label}.` : `${cap(front.label)} est devant ${back.label}.`;
    });
    const told = ctx.level >= 3 && ctx.rng() < 0.5 ? sentences.reverse() : sentences;
    const sequence = queue.map(optionOf);
    return {
      type: "order",
      prompt: `${told.join(" ")} Mets-les dans l'ordre de la file.`,
      payload: {
        correctSequence: sequence,
        game: originOf("file-ordre", ctx),
        concept: "devant et derrière",
      },
      answerKey: sequence.join(", "),
      hints: [
        "Écoute bien qui est devant qui, phrase après phrase.",
        "Le premier de la file est celui qui n'a personne devant lui.",
        "Place d'abord le premier, puis celui qui est juste derrière.",
      ],
    };
  });
}

// ===========================================================================
// À CÔTÉ, ENTRE, PRÈS, LOIN : UNE RANGÉE
// ===========================================================================

/** « Regarde la rangée 🐔 🍌 🐄 🍎. Lequel est à côté de la poule ? » : le dessin est au bout, il n'a qu'un voisin. */
export function makeBeside(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "a-cote", () => {
    const length = ctx.level >= 3 ? 5 : 4;
    const row = shuffle(ctx.rng, SCENE_THINGS).slice(0, length);
    const atStart = ctx.rng() < 0.5;
    const target = atStart ? row[0] : row[length - 1];
    const neighbour = atStart ? row[1] : row[length - 2];
    // Les deux autres choix ne touchent pas le dessin : un seul a un voisin.
    const far = row.filter((thing) => thing !== target && thing !== neighbour);
    const options = withWrong(ctx, neighbour, far);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${rowText(row)}. Lequel est à côté ${deOf(target.label)} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(neighbour)),
        game: originOf("a-cote", ctx),
        concept: "à côté de",
      },
      answerKey: optionOf(neighbour),
      hints: [
        "Cherche le dessin de la question dans la rangée.",
        "À côté, c'est tout près, sans rien entre les deux.",
        "Ce dessin est au bout de la rangée : il n'a qu'un voisin.",
      ],
    };
  });
}

/** « Lequel est entre la banane et la pomme ? » : trois dessins au premier palier, cinq ensuite. */
export function makeBetween(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "entre", () => {
    const length = ctx.level === 1 ? 3 : 5;
    const things = shuffle(ctx.rng, SCENE_THINGS);
    const row = things.slice(0, length);
    const at = randomInt(ctx.rng, 0, length - 3);
    const [first, middle, last] = [row[at], row[at + 1], row[at + 2]];
    // Les deux dessins nommés ne se proposent pas : la réponse n'est pas trouvée par élimination. Au premier palier,
    // les autres choix viennent d'ailleurs que de la rangée ; ensuite aussi de la rangée.
    const others = [...row.filter((thing) => thing !== first && thing !== middle && thing !== last), ...things.slice(length)];
    const options = withWrong(ctx, middle, others);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${rowText(row)}. Lequel est entre ${first.label} et ${last.label} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(middle)),
        game: originOf("entre", ctx),
        concept: "entre",
      },
      answerKey: optionOf(middle),
      hints: [
        "Cherche les deux dessins de la question dans la rangée.",
        "Entre veut dire au milieu des deux, avec un dessin de chaque côté.",
        "Dis le nom de chaque dessin, de gauche à droite.",
      ],
    };
  });
}

/** « Lequel est le plus loin de la poule ? » : le dessin est au bout, le plus près est son voisin, le plus loin l'autre bout. */
export function makeNearFar(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "pres-loin", () => {
    const length = ctx.level >= 3 ? 5 : 4;
    const row = shuffle(ctx.rng, SCENE_THINGS).slice(0, length);
    const atStart = ctx.rng() < 0.5;
    const ordered = atStart ? row : [...row].reverse();
    const target = ordered[0];
    const near = ctx.rng() < 0.5;
    const answer = near ? ordered[1] : ordered[length - 1];
    const middle = ordered[randomInt(ctx.rng, 2, length - 2)];
    // Les trois choix : le plus près, le plus loin et un dessin entre les deux.
    const options = shuffle(ctx.rng, [ordered[1], ordered[length - 1], middle]).map(optionOf);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${rowText(row)}. Lequel est le plus ${near ? "près" : "loin"} ${deOf(target.label)} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("pres-loin", ctx),
        concept: "près et loin",
      },
      answerKey: optionOf(answer),
      hints: [
        "Cherche le dessin de la question dans la rangée.",
        "Le plus près est celui qu'on touche presque, le plus loin est celui qui demande le plus de pas.",
        "Compte les pas depuis le dessin de la question jusqu'à chaque choix.",
      ],
    };
  });
}

// ===========================================================================
// DROITE ET GAUCHE
// ===========================================================================

/** « Lequel est juste à droite de la banane ? » : le voisin immédiat, jamais un dessin lointain. */
export function makeRowNeighbour(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "rangee-voisin", () => {
    const length = ctx.level === 1 ? 3 : 4;
    const things = shuffle(ctx.rng, SCENE_THINGS);
    const row = things.slice(0, length);
    const right = ctx.rng() < 0.5;
    // À droite d'un dessin : il en faut un à sa droite, donc pas le dernier ; à gauche, pas le premier.
    const at = right ? randomInt(ctx.rng, 0, length - 2) : randomInt(ctx.rng, 1, length - 1);
    const target = row[at];
    const answer = row[at + (right ? 1 : -1)];
    // Trois choix : le voisin et deux dessins qui ne sont pas juste à côté de ce côté-là (un de la rangée, un d'ailleurs si elle est courte).
    const others = [...row.filter((thing) => thing !== target && thing !== answer), ...things.slice(length)];
    const options = withWrong(ctx, answer, others);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${rowText(row)}. Lequel est juste à ${right ? "droite" : "gauche"} ${deOf(target.label)} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("rangee-voisin", ctx),
        concept: "à droite de, à gauche de",
      },
      answerKey: optionOf(answer),
      hints: [
        "Lis la rangée de gauche à droite, comme un mot.",
        right ? "La droite est le côté où la rangée finit." : "La gauche est le côté où la rangée commence.",
        "Cherche le dessin de la question, puis regarde juste à côté de lui.",
      ],
    };
  });
}

/** Les doigts qui montrent une direction : leur sens ne se discute pas. */
export const POINTING = [
  { emoji: "👉", direction: "la droite" },
  { emoji: "👈", direction: "la gauche" },
  { emoji: "👆", direction: "le haut" },
  { emoji: "👇", direction: "le bas" },
] as const;

/** Les directions que chaque groupe de niveaux demande : la droite ou la gauche d'abord, puis le haut, puis le bas. */
const POINTING_ASKS: readonly (readonly (typeof POINTING)[number][])[] = [POINTING.slice(0, 2), [POINTING[2]], [POINTING[3]]];

/** « Quel doigt montre la droite ? » : trois doigts à choisir, sans mot à lire. */
export function makePointing(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "doigt-direction", () => {
    // Chaque palier a sa direction : la droite ou la gauche au premier, le haut au deuxième, le bas au dernier. Trois paliers ne posent
    // ainsi jamais la même question.
    const asked = pickFresh(ctx, POINTING_ASKS[levelGroup(ctx.level)], (finger) => `doigt-direction-sens:${finger.direction}`);
    const wrong = shuffle(
      ctx.rng,
      POINTING.filter((finger) => finger.emoji !== asked.emoji),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [asked, ...wrong]).map((finger) => finger.emoji as string);
    return {
      type: "qcm",
      prompt: `Quel doigt montre ${asked.direction} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(asked.emoji),
        game: originOf("doigt-direction", ctx),
        concept: "droite, gauche, haut et bas",
      },
      answerKey: asked.emoji,
      hints: [
        "Regarde de quel côté chaque doigt est tourné.",
        "La droite est du côté où l'on finit de lire, la gauche du côté où l'on commence.",
        "Le haut est vers le ciel, le bas est vers le sol.",
      ],
    };
  });
}

/** Ce que l'enfant relie au doigt : « à droite », pas « la droite », qui ressemblerait à une chose sans image. */
const POINTING_WORDS: Record<string, string> = { "la droite": "à droite", "la gauche": "à gauche", "le haut": "en haut", "le bas": "en bas" };

/** « Relie chaque doigt à la direction qu'il montre. » : trois doigts, les quatre au dernier palier. */
export function makePointingLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "doigt-relier",
    () => {
      const fingers = shuffle(ctx.rng, POINTING).slice(0, ctx.level >= 3 ? 4 : 3);
      const pairs = fingers.map((finger) => ({ left: finger.emoji as string, right: POINTING_WORDS[finger.direction] }));
      return {
        type: "match",
        prompt: "Relie chaque doigt à la direction qu'il montre.",
        payload: { pairs, game: originOf("doigt-relier", ctx), concept: "droite, gauche, haut et bas" },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde bien où pointe chaque doigt.",
          "Pointe ton propre doigt dans la même direction que lui.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((pair) => pair.left)
        .sort()
        .join(","),
  );
}

/** « Glisse chaque dessin à gauche ou à droite de la banane. » : le dessin de la question n'est pas au bout. */
export function makeSideSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "gauche-droite-glisser",
    () => {
      const length = ctx.level >= 3 ? 5 : 4;
      const row = shuffle(ctx.rng, SCENE_THINGS).slice(0, length);
      // Au moins un dessin de chaque côté : le dessin de la question n'est ni le premier ni le dernier.
      const at = randomInt(ctx.rng, 1, length - 2);
      const target = row[at];
      const items = shuffle(
        ctx.rng,
        row
          .map((thing, i) => ({ thing, i }))
          .filter(({ i }) => i !== at)
          .map(({ thing, i }) => ({ text: optionOf(thing), correctZone: i < at ? "À gauche" : "À droite" })),
      );
      return {
        type: "drag-drop",
        prompt: `Regarde la rangée ${rowText(row)}. Glisse chaque dessin à gauche ou à droite ${deOf(target.label)}.`,
        payload: {
          zones: ["À gauche", "À droite"],
          items,
          game: originOf("gauche-droite-glisser", ctx),
          concept: "à gauche de, à droite de",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis la rangée de gauche à droite, comme un mot.",
          "Cherche le dessin de la question : ceux d'avant lui sont d'un côté.",
          "Ceux d'après lui sont de l'autre côté.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Regarde la rangée. Mets ces dessins dans le même ordre, de gauche à droite. » : trois dessins, quatre ensuite. */
export function makeRowCopy(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "rangee-copie",
    () => {
      const row = shuffle(ctx.rng, SCENE_THINGS).slice(0, ctx.level === 1 ? 3 : 4);
      const sequence = row.map(optionOf);
      return {
        type: "order",
        prompt: `Regarde la rangée ${rowText(row)}. Mets ces dessins dans le même ordre, de gauche à droite.`,
        payload: {
          correctSequence: sequence,
          game: originOf("rangee-copie", ctx),
          concept: "lire de gauche à droite",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Lis la rangée de gauche à droite, comme un mot.",
          "Cherche le dessin qui commence la rangée, et place-le en premier.",
          "Place ensuite celui qui est juste à sa droite, puis le suivant.",
        ],
      };
    },
    sortedOptions,
  );
}

// ===========================================================================
// LES REPÈRES FIXES ET MOBILES
// ===========================================================================

/** Les repères qui ne bougent jamais : chacun a son image au catalogue. */
export const FIXED_LANDMARKS: readonly string[] = ["le baobab", "la mosquée", "le portail", "la maison", "le marché", "le manguier", "le fromager"];

/** Les repères qui se déplacent : chacun a son image au catalogue. */
export const MOBILE_LANDMARKS: readonly string[] = ["la voiture", "le bus", "la charrette", "l'âne", "le vélo", "la moto", "le cheval", "la pirogue"];

export const ZONE_FIXED = "Repères fixes";
export const ZONE_MOBILE = "Repères mobiles";

/** « Glisse chaque dessin dans la bonne case, repère fixe ou repère mobile. » : quatre dessins, cinq ensuite. */
export function makeLandmarkSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "repere-glisser",
    () => {
      const total = ctx.level === 1 ? 4 : 5;
      const fixedCount = total === 4 ? 2 : pick(ctx.rng, [2, 3]);
      const fixed = shuffle(ctx.rng, FIXED_LANDMARKS).slice(0, fixedCount);
      const mobile = shuffle(ctx.rng, MOBILE_LANDMARKS).slice(0, total - fixedCount);
      const items = shuffle(ctx.rng, [
        ...fixed.map((text) => ({ text, correctZone: ZONE_FIXED })),
        ...mobile.map((text) => ({ text, correctZone: ZONE_MOBILE })),
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque dessin dans la bonne case, repère fixe ou repère mobile.",
        payload: {
          zones: [ZONE_FIXED, ZONE_MOBILE],
          items,
          game: originOf("repere-glisser", ctx),
          concept: "les repères fixes et les repères mobiles",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Dis le nom de chaque dessin.",
          "Un repère qui ne bouge pas reste toujours au même endroit.",
          "Un repère qui bouge peut être ailleurs demain.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Lequel ne bouge pas ? » ou « Lequel peut bouger ? » : un seul de l'autre sorte parmi trois. */
export function makeLandmarkPick(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "repere-qcm", () => {
    // Au premier palier, seulement le repère qui ne bouge pas ; ensuite aussi celui qui bouge.
    const fixed = ctx.level === 1 || ctx.rng() < 0.5;
    const answer = pick(ctx.rng, fixed ? FIXED_LANDMARKS : MOBILE_LANDMARKS);
    const wrong = shuffle(ctx.rng, fixed ? MOBILE_LANDMARKS : FIXED_LANDMARKS).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]);
    return {
      type: "qcm",
      prompt: fixed ? "Lequel ne bouge pas ?" : "Lequel peut bouger ?",
      payload: {
        options,
        correctIndex: options.indexOf(answer),
        game: originOf("repere-qcm", ctx),
        concept: "un repère fixe, un repère mobile",
      },
      answerKey: answer,
      hints: [
        "Dis le nom de chaque dessin.",
        "Un repère qui ne bouge pas reste toujours au même endroit.",
        // Les deux autres sont de la même sorte, l'autre sorte que la réponse : « pas de la même sorte » était faux (la charrette et le bus bougent tous deux).
        fixed ? "Les deux autres dessins peuvent bouger." : "Les deux autres dessins ne bougent jamais.",
      ],
    };
  });
}

/** « Un seul de ces dessins ne bouge jamais. Lequel ? » : trois repères de la même sorte, un de l'autre. */
export function makeLandmarkOdd(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "repere-intrus",
    () => {
      const fixedMain = ctx.rng() < 0.5;
      const main = shuffle(ctx.rng, fixedMain ? FIXED_LANDMARKS : MOBILE_LANDMARKS).slice(0, 3);
      const odd = pick(ctx.rng, fixedMain ? MOBILE_LANDMARKS : FIXED_LANDMARKS);
      const options = shuffle(ctx.rng, [...main, odd]);
      return {
        type: "qcm",
        // Le critère est dans l'énoncé : sans lui, le cheval (seul vivant parmi des véhicules) ou la mosquée (seul bâtiment parmi des
        // arbres) était un intrus défendable, refusé.
        prompt: fixedMain ? "Un seul de ces dessins peut bouger. Lequel ?" : "Un seul de ces dessins ne bouge jamais. Lequel ?",
        payload: {
          options,
          correctIndex: options.indexOf(odd),
          game: originOf("repere-intrus", ctx),
          concept: "trouver celui qui n'est pas de la même sorte",
        },
        answerKey: odd,
        hints: [
          "Dis le nom de chaque dessin.",
          "Cherche trois dessins qui bougent, ou trois qui ne bougent jamais.",
          "Celui qui reste n'est pas de cette sorte.",
        ],
      };
    },
    // Deux questions d'un palier ne gardent pas le même intrus, même entourées d'autres dessins.
    (game) => game.answerKey,
  );
}

/** Les repères d'un trajet : des lieux fixes, sans élision. */
const ROUTE_STOPS: readonly string[] = ["la maison", "le baobab", "la mosquée", "le portail", "le marché", "le manguier", "le fromager"];
const NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"] as const;

/** « part de la maison » ou « part du portail ». */
const departureOf = (label: string) => (label.startsWith("le ") ? `du ${label.slice(3)}` : `de ${label}`);
/** « arrive à la mosquée » ou « arrive au marché ». */
const arrivalAt = (label: string) => (label.startsWith("le ") ? `au ${label.slice(3)}` : `à ${label}`);

/** « Awa part de la maison, passe devant le baobab et arrive à la mosquée. Mets-les dans l'ordre du trajet. » */
export function makeLandmarkRoute(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "repere-trajet",
    () => {
      const [start, middle, end] = shuffle(ctx.rng, ROUTE_STOPS);
      const name = pickFresh(ctx, NAMES, (n) => `repere-trajet-nom:${n}`);
      const sequence = [start, middle, end];
      return {
        type: "order",
        prompt: `${name} part ${departureOf(start)}, passe devant ${middle} et arrive ${arrivalAt(end)}. Mets-les dans l'ordre du trajet.`,
        payload: {
          correctSequence: sequence,
          game: originOf("repere-trajet", ctx),
          concept: "suivre un trajet de repère en repère",
        },
        answerKey: sequence.join(", "),
        hints: [
          "Écoute le trajet en entier, du départ jusqu'à l'arrivée.",
          "Le départ est le premier repère, l'arrivée est le dernier.",
          "Le repère du milieu est celui devant lequel on passe.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

// ===========================================================================
// LE QUADRILLAGE
// ===========================================================================

type Grid = Thing[][];

function drawGrid(ctx: GameContext, size: number): Grid {
  const things = shuffle(ctx.rng, SCENE_THINGS).slice(0, size * size);
  return Array.from({ length: size }, (_, r) => things.slice(r * size, r * size + size));
}

/** Le quadrillage écrit sur plusieurs lignes de l'énoncé : une ligne d'émojis par rangée. */
const gridText = (grid: Grid) => grid.map((row) => rowText(row)).join("\n");

const flat = (grid: Grid) => grid.flat();

/** Les places qu'on sait dire : les quatre coins, et le milieu d'un quadrillage de trois. */
function placesOf(size: number): { words: string; r: number; c: number }[] {
  const last = size - 1;
  const places = [
    { words: "en haut à gauche", r: 0, c: 0 },
    { words: "en haut à droite", r: 0, c: last },
    { words: "en bas à gauche", r: last, c: 0 },
    { words: "en bas à droite", r: last, c: last },
  ];
  if (size === 3) places.push({ words: "au milieu", r: 1, c: 1 });
  return places;
}

/** « Regarde le quadrillage. Lequel est en bas à gauche ? » : deux lignes de deux dessins, puis trois de trois. */
export function makeGridPosition(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "grille-position", () => {
    const size = ctx.level === 1 ? 2 : 3;
    const grid = drawGrid(ctx, size);
    // Les trois questions de place d'un palier (celle-ci et le texte à trous) ne demandent pas la même place.
    const place = pickFresh(ctx, placesOf(size), (entry) => `grille-place:${entry.words}`);
    const answer = grid[place.r][place.c];
    const options = withWrong(ctx, answer, flat(grid));
    return {
      type: "qcm",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nLequel est ${place.words} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("grille-position", ctx),
        concept: "se repérer sur un quadrillage",
      },
      answerKey: optionOf(answer),
      hints: [
        "Lis le quadrillage ligne après ligne, de haut en bas.",
        "Le haut est la première ligne, le bas est la dernière ligne.",
        "La gauche est le côté où chaque ligne commence, la droite celui où elle finit.",
      ],
    };
  });
}

const ORDINAL_FEMININE = ["première", "deuxième", "troisième"] as const;

/** « Lequel est dans la deuxième ligne et la première colonne ? » : la ligne et la colonne se croisent sur un seul dessin. */
export function makeGridCell(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "grille-ligne-colonne", () => {
    const size = ctx.level === 1 ? 2 : 3;
    const grid = drawGrid(ctx, size);
    const r = randomInt(ctx.rng, 0, size - 1);
    const c = randomInt(ctx.rng, 0, size - 1);
    const answer = grid[r][c];
    const options = withWrong(ctx, answer, flat(grid));
    return {
      type: "qcm",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nLequel est dans la ${ORDINAL_FEMININE[r]} ligne et la ${ORDINAL_FEMININE[c]} colonne ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("grille-ligne-colonne", ctx),
        concept: "la ligne et la colonne d'une case",
      },
      answerKey: optionOf(answer),
      hints: [
        "Une ligne se lit de gauche à droite, une colonne se lit de haut en bas.",
        "Compte les lignes en partant du haut, avec le doigt.",
        "Compte les colonnes en partant de la gauche, avec le doigt.",
      ],
    };
  });
}

/** « Regarde le quadrillage. En bas à droite, il y a ___. » : la place se lit dans le quadrillage, le trou se remplit par un dessin. */
export function makeGridBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "grille-trou", () => {
    const size = ctx.level === 1 ? 2 : 3;
    const grid = drawGrid(ctx, size);
    const place = pickFresh(ctx, placesOf(size), (entry) => `grille-place:${entry.words}`);
    const answer = grid[place.r][place.c];
    const options = withWrong(ctx, answer, flat(grid));
    return {
      type: "fill-blank",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nComplète la phrase.`,
      payload: {
        text: `${cap(place.words)}, il y a ___.`,
        blanks: [{ options, answer: optionOf(answer) }],
        game: originOf("grille-trou", ctx),
        concept: "se repérer sur un quadrillage",
      },
      answerKey: optionOf(answer),
      hints: [
        "Lis le quadrillage ligne après ligne, de haut en bas.",
        "Cherche la place que dit la phrase : le haut, le bas, la gauche ou la droite.",
        "Dis le nom du dessin qui est à cette place, puis choisis-le.",
      ],
    };
  });
}

type Step = { word: "monte" | "descend" | "gauche" | "droite"; dr: number; dc: number };
const STEPS: readonly Step[] = [
  { word: "monte", dr: -1, dc: 0 },
  { word: "descend", dr: 1, dc: 0 },
  { word: "gauche", dr: 0, dc: -1 },
  { word: "droite", dr: 0, dc: 1 },
];

/** « d'une case » ou « de deux cases », avec le verbe qui va. */
function stepPhrase(step: Step, cases: 1 | 2): string {
  const how = cases === 1 ? "d'une case" : "de deux cases";
  if (step.word === "monte") return `monte ${how}`;
  if (step.word === "descend") return `descend ${how}`;
  return `va ${how} vers la ${step.word}`;
}

/** « Le pion est sur le chat. Il monte d'une case. Où arrive-t-il ? » : un pas, ou deux cases au dernier palier, toujours dans le quadrillage. */
export function makeGridMove(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "pion-deplacement", () => {
    const size = ctx.level === 1 ? 2 : 3;
    const cases: 1 | 2 = ctx.level >= 3 ? 2 : 1;
    const grid = drawGrid(ctx, size);
    // Un départ et un sens dont l'arrivée reste dans le quadrillage.
    const moves: { r: number; c: number; step: Step }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        for (const step of STEPS) {
          const toRow = r + step.dr * cases;
          const toCol = c + step.dc * cases;
          if (toRow >= 0 && toRow < size && toCol >= 0 && toCol < size) moves.push({ r, c, step });
        }
      }
    }
    const { r, c, step } = pick(ctx.rng, moves);
    const start = grid[r][c];
    const answer = grid[r + step.dr * cases][c + step.dc * cases];
    // Les mauvais choix sont des erreurs d'enfant : le dessin d'un pas seulement, celui du sens contraire, celui du départ.
    const traps: Thing[] = [];
    if (cases === 2) traps.push(grid[r + step.dr][c + step.dc]);
    const backRow = r - step.dr;
    const backCol = c - step.dc;
    if (backRow >= 0 && backRow < size && backCol >= 0 && backCol < size) traps.push(grid[backRow][backCol]);
    traps.push(start);
    const wrong = [...new Set([...traps, ...shuffle(ctx.rng, flat(grid))])].filter((thing) => thing.emoji !== answer.emoji).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]).map(optionOf);
    return {
      type: "qcm",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nLe pion est sur ${start.label}. Il ${stepPhrase(step, cases)}. Où arrive-t-il ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("pion-deplacement", ctx),
        concept: "déplacer un pion sur un quadrillage",
      },
      answerKey: optionOf(answer),
      hints: [
        "Cherche d'abord le dessin où se trouve le pion.",
        "Monter va vers le haut, descendre va vers le bas.",
        "Avance case après case, avec le doigt, dans le sens de la phrase.",
      ],
    };
  });
}

/** « Glisse chaque dessin en haut ou en bas. » : un quadrillage de quatre dessins, coupé en lignes ou en colonnes. */
export function makeGridSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "grille-glisser",
    () => {
      const grid = drawGrid(ctx, 2);
      const byRows = ctx.level === 1 || ctx.rng() < 0.5;
      const items = shuffle(
        ctx.rng,
        grid.flatMap((row, r) =>
          row.map((thing, c) => ({
            text: optionOf(thing),
            correctZone: byRows ? (r === 0 ? "En haut" : "En bas") : c === 0 ? "À gauche" : "À droite",
          })),
        ),
      );
      return {
        type: "drag-drop",
        prompt: `Regarde le quadrillage.\n${gridText(grid)}\nGlisse chaque dessin ${byRows ? "en haut ou en bas" : "à gauche ou à droite"}.`,
        payload: {
          zones: byRows ? ["En haut", "En bas"] : ["À gauche", "À droite"],
          items,
          game: originOf("grille-glisser", ctx),
          concept: "le haut et le bas, la gauche et la droite d'un quadrillage",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis le quadrillage ligne après ligne, de haut en bas.",
          byRows
            ? "Les dessins de la première ligne sont d'un côté, ceux de la seconde de l'autre."
            : "Les dessins de la première colonne sont d'un côté, ceux de la seconde de l'autre.",
          "Dis le nom de chaque dessin, puis cherche sa place dans le quadrillage.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}
