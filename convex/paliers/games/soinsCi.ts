/**
 * LES GABARITS DES SCIENCES DU CI, SECONDE PARTIE : le corps et la propreté, les outils de la maison et de l'école
 * (`sc-ci-hygiene`, `sc-ci-outils`).
 *
 * Sur les vingt-cinq exercices de sciences du CI que nous avons relus, le modèle avait rangé « Se laver les mains »
 * sous une case « Se laver » (la case répétait la tuile), fait « jouer avec des amis » passer pour de l'hygiène,
 * donné « Frapper doucement » comme une réponse fausse alors qu'elle va aussi, des cases qui étaient les outils et
 * des tuiles qui étaient leurs descriptions. Ici deux familles de tableaux, relues une par une.
 *
 * LES SCÈNES. Comme pour l'instruction civique (`civique.ts`, dont ce module reprend l'idée et les garde-fous), une
 * scène est une situation de la vie d'un enfant (« Tu vas manger ton repas. »), avec LE geste qui convient et trois
 * gestes qui ne conviennent pas, mauvais même hors de leur scène : « Je mange avec les mains sales » est mauvais
 * partout. Le QCM pose la scène, la case « à faire » reçoit des bons gestes de plusieurs scènes et la case « à
 * éviter » leurs mauvais gestes, l'intrus en prend deux d'un côté et un de l'autre.
 *
 * LES AUTRES TABLEAUX. Les sens (avec quoi je vois, j'entends, je sens, je goûte, je prends) ne demandent que des
 * parties du corps entre lesquelles un seul va. Les soins associent la main, la dent et l'ongle à ce qu'on leur
 * fait (la chevelure et la brosse sont écartées : on brosse aussi les cheveux). Les ordres ne portent que des suites
 * qui n'ont qu'un ordre : on mouille avant de savonner, on prend avant de se servir, on range à la fin. Les outils
 * sont reliés à ce qu'ils font, jamais deux outils qui font presque la même chose dans le même exercice (le seau et
 * l'arrosoir portent de l'eau tous les deux, le marteau et le pilon frappent tous les deux).
 *
 * RÈGLES POUR AJOUTER UNE SCÈNE
 * - Le bon geste est le seul qui convienne, et aucun mauvais geste n'est « presque bien ».
 * - Tous les textes de gestes sont différents dans toute la table, et les émojis d'une scène aussi.
 * - Un geste a quatre mots au moins après son émoji : avec moins, l'écran donnerait à la tuile le dessin de
 *   l'émoji de tête quand l'émoji est une chose du catalogue (`pictureForTile`, règle du repli).
 * - Un émoji ancien (Unicode 11 au plus), jamais suivi de U+FE0F : pas de ✂ ni de ✏, pas de brosse à dents (U13).
 * - L'énoncé n'a aucun « : », au plus une apostrophe droite, vingt mots au plus (la consigne du CI).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, shuffle, sortedOptions, takeFresh, type GameContext, type GeneratedGame } from "./shared";
import { linkKey } from "./anglais";

/** Un geste : son émoji, puis ce que l'enfant fait, à la première personne. */
export type Act = readonly [emoji: string, text: string];

const actTile = (act: Act) => `${act[0]} ${act[1]}`;

export type Scene = {
  id: string;
  /** Les scènes d'un même groupe ont des bons gestes qui se ressemblent : jamais reliées dans le même exercice. */
  group: string;
  /** La situation, dite à l'enfant : elle ne dit pas ce qu'il faut faire. */
  text: string;
  emoji: string;
  /** Le seul geste qui convienne. */
  right: Act;
  /** Trois gestes à éviter, mauvais même hors de la scène. */
  wrong: readonly [Act, Act, Act];
  /** Pourquoi, en une phrase qui n'écrit pas le bon geste. */
  hint: string;
};

/**
 * Une banque de scènes : son nom, ce qu'elle enseigne, et ce qui fait, pour une scène, la chose apprise (`fact`). Deux
 * gabarits qui montrent des scènes de la même banque ne reprennent pas la même chose dans un palier tant qu'il en reste
 * d'autres.
 */
type Bank = { name: string; concept: string; scenes: readonly Scene[]; fact: (scene: Scene) => string };

/** La clé d'une chose apprise, déjà montrée dans ce palier. */
const factKey = (bank: Bank, scene: Scene) => `${bank.name}-fait:${bank.fact(scene)}`;

/** L'écart de longueur d'un groupe de gestes : sans précaution, le bon geste, plus court, se devinerait. */
const spread = (acts: readonly Act[]) => Math.max(...acts.map((act) => act[1].length)) / Math.min(...acts.map((act) => act[1].length));

// ===========================================================================
// LES SCÈNES DE L'HYGIÈNE
// ===========================================================================

export const HYGIENE_SCENES: readonly Scene[] = [
  {
    id: "hy1",
    group: "mains",
    text: "Tu vas manger ton repas.",
    emoji: "😋",
    right: ["🧼", "Je me lave les mains avant de manger"],
    wrong: [
      ["🤢", "Je mange avec les mains sales"],
      ["👅", "Je mets mes doigts sales dans la bouche"],
      ["🍞", "Je mange du pain tombé dans la poussière"],
    ],
    hint: "Des mains sales peuvent donner mal au ventre.",
  },
  {
    id: "hy2",
    group: "mains",
    text: "Tu sors des toilettes.",
    emoji: "🚽",
    right: ["🚰", "Je me lave les mains après les toilettes"],
    wrong: [
      ["🙅", "Je ne me lave jamais les mains"],
      ["🏃", "Je file jouer sans me laver les mains"],
      ["🍪", "Je prends mon goûter avec les mains sales"],
    ],
    hint: "Les toilettes salissent les mains, même quand on ne le voit pas.",
  },
  {
    id: "hy3",
    group: "dents",
    text: "Tu as mangé des bonbons.",
    emoji: "🍬",
    right: ["🦷", "Je me brosse bien les dents"],
    wrong: [
      ["🛌", "Je me couche sans me brosser les dents"],
      ["🍭", "Je mange encore des bonbons au lit"],
      ["🙈", "Je ne me brosse jamais les dents"],
    ],
    hint: "Le sucre reste collé sur les dents et les abîme.",
  },
  {
    id: "hy4",
    group: "ongles",
    text: "Tes ongles sont longs et sales.",
    emoji: "💅",
    right: ["👐", "Je coupe mes ongles quand ils sont longs"],
    wrong: [
      ["😬", "Je ronge mes ongles avec les dents"],
      ["🙈", "Je garde mes ongles longs et sales"],
      ["🤕", "Je me gratte avec mes ongles sales"],
    ],
    hint: "Sous des ongles longs, la saleté se cache.",
  },
  {
    id: "hy5",
    group: "fruit",
    text: "Tu as acheté une mangue au marché.",
    emoji: "🛒",
    right: ["🥭", "Je lave la mangue avant de la manger"],
    wrong: [
      ["😋", "Je mange la mangue sans la laver"],
      ["🤮", "Je mange une mangue ramassée dans la boue"],
      ["👶", "Je donne la mangue sale à mon petit frère"],
    ],
    hint: "La peau d'un fruit garde la poussière du marché.",
  },
  {
    id: "hy6",
    group: "repas",
    text: "Il reste du riz sur la table.",
    emoji: "🍚",
    right: ["🥘", "Je couvre le riz avec un couvercle"],
    wrong: [
      ["🌙", "Je laisse le riz découvert toute la nuit"],
      ["🐜", "Je laisse le riz ouvert près des fourmis"],
      ["🚮", "Je pose le riz par terre dans la cour"],
    ],
    hint: "Un plat ouvert attire les petits animaux et la saleté.",
  },
  {
    id: "hy7",
    group: "corps",
    text: "Tu as joué dans la poussière.",
    emoji: "🧒",
    right: ["🚿", "Je me lave avec de l'eau et du savon"],
    wrong: [
      ["😴", "Je me couche sans me laver"],
      ["👕", "Je garde mes habits sales plusieurs jours"],
      ["🙅", "Je ne me lave jamais le corps"],
    ],
    hint: "La poussière colle à la peau et la salit.",
  },
  {
    id: "hy8",
    group: "eau",
    text: "Il fait chaud et tu as soif.",
    emoji: "🥵",
    right: ["🥤", "Je bois de l'eau propre"],
    wrong: [
      ["💦", "Je bois l'eau sale de la flaque"],
      ["🚮", "Je bois l'eau du caniveau"],
      ["🤮", "Je bois de l'eau qui sent mauvais"],
    ],
    hint: "Une eau sale peut rendre malade.",
  },
];

// ===========================================================================
// LES SCÈNES DES OUTILS
// ===========================================================================

export const TOOL_SCENES: readonly Scene[] = [
  {
    id: "ou1",
    group: "ciseaux",
    text: "Tu as fini de couper avec les ciseaux.",
    emoji: "📄",
    right: ["🧺", "Je range les ciseaux à leur place"],
    wrong: [
      ["😱", "Je laisse les ciseaux ouverts par terre"],
      ["🏃", "Je cours avec les ciseaux à la main"],
      ["👉", "Je pointe les ciseaux vers mon ami"],
    ],
    hint: "Des ciseaux qui traînent ou qui pointent peuvent blesser quelqu'un.",
  },
  {
    id: "ou2",
    group: "marteau",
    text: "Tu vas enfoncer un clou avec le marteau.",
    emoji: "🔨",
    right: ["👀", "Je regarde bien le clou en frappant"],
    wrong: [
      ["🙈", "Je ferme les yeux en frappant"],
      ["🤾", "Je lance le marteau à mon ami"],
      ["🏃", "Je cours avec le marteau dans la cour"],
    ],
    hint: "Il faut voir où l'on frappe pour ne pas se faire mal.",
  },
  {
    id: "ou3",
    group: "balai",
    text: "La classe est pleine de poussière.",
    emoji: "🧹",
    right: ["🚮", "Je balaie la poussière vers la poubelle"],
    wrong: [
      ["🤸", "Je joue à l'épée avec le balai"],
      ["💨", "Je soulève la poussière sur mes amis"],
      ["🙅", "Je ne balaie jamais la classe"],
    ],
    hint: "Un balai sert à nettoyer, pas à jouer ni à gêner les autres.",
  },
  {
    id: "ou4",
    group: "arrosoir",
    text: "Les plantes ont soif.",
    emoji: "🌱",
    right: ["💧", "J'arrose les plantes avec l'arrosoir"],
    wrong: [
      ["💦", "J'arrose mon ami avec l'arrosoir"],
      ["😠", "Je jette l'arrosoir par terre"],
      ["🥀", "Je laisse les plantes sans eau"],
    ],
    hint: "Une plante a besoin d'eau pour vivre, et l'arrosoir lui en donne.",
  },
  {
    id: "ou5",
    group: "pilon",
    text: "Tu piles le mil avec le pilon.",
    emoji: "🌾",
    right: ["🤲", "Je tiens bien le pilon à deux mains"],
    wrong: [
      ["🤾", "Je lance le pilon à mon ami"],
      ["😴", "Je pile en regardant ailleurs"],
      ["🏃", "Je cours avec le pilon dans la cour"],
    ],
    hint: "Le pilon est lourd : on le tient solidement pour ne pas l'échapper.",
  },
  {
    id: "ou6",
    group: "seau",
    text: "Le seau est plein d'eau et très lourd.",
    emoji: "💧",
    right: ["🤝", "Je demande de l'aide à un grand"],
    wrong: [
      ["🏃", "Je porte le seau en courant"],
      ["😤", "Je tire le seau seul en forçant"],
      ["🙈", "Je soulève le seau sans regarder"],
    ],
    hint: "Ce qui est trop lourd pour un enfant se porte à deux.",
  },
];

const HYGIENE: Bank = {
  name: "hygiene",
  concept: "l'hygiène du corps : se laver les mains, les dents, les ongles, manger et boire propre",
  scenes: HYGIENE_SCENES,
  fact: (scene) => scene.id,
};

/** Les scènes des outils ont pour groupe l'identifiant de l'outil : c'est lui qu'elles apprennent à manier. */
const TOOLS: Bank = {
  name: "outil",
  concept: "les outils de la maison et de l'école : à quoi ils servent, comment s'en servir sans se blesser, les ranger",
  scenes: TOOL_SCENES,
  fact: (scene) => scene.group,
};

// ===========================================================================
// QUE FAIS-TU ? UNE SITUATION, TROIS GESTES
// ===========================================================================

/** « Tu vas manger ton repas. Que fais-tu ? » : le bon geste parmi trois, deux mauvais de longueur voisine pris dans les trois de la scène. */
function sceneChoice(kind: string, bank: Bank, ctx: GameContext): GeneratedGame {
  return fresh(ctx, kind, () => {
    const scene = pickFresh(ctx, bank.scenes, (candidate) => factKey(bank, candidate));
    const [first, second, third] = scene.wrong;
    const pairs: [Act, Act][] = [
      [first, second],
      [first, third],
      [second, third],
    ];
    const tightest = Math.min(...pairs.map((pair) => spread([scene.right, ...pair])));
    const wrong = pick(
      ctx.rng,
      pairs.filter((pair) => spread([scene.right, ...pair]) <= tightest + 0.15),
    );
    const options = shuffle(ctx.rng, [scene.right, ...wrong].map(actTile));
    return {
      type: "qcm",
      prompt: `${scene.text} Que fais-tu ?`,
      payload: { options, correctIndex: options.indexOf(actTile(scene.right)), game: originOf(kind, ctx), concept: bank.concept },
      answerKey: actTile(scene.right),
      hints: ["Lis la situation, doucement.", scene.hint, "Écarte les gestes qui font du mal ou du danger."],
    };
  });
}

/**
 * Des gestes de scènes différentes, aux émojis tous différents : deux étiquettes au même dessin se confondraient. De
 * préférence des scènes que le palier n'a pas encore montrées. L'appelant marque les scènes prises (`markSeen`) une fois
 * le tirage accepté : un tirage refusé n'en use aucune.
 */
function drawActs(ctx: GameContext, bank: Bank, goodCount: number, badCount: number): { good: Act[]; bad: Act[]; scenes: Scene[] } {
  let drawn: { good: Act[]; bad: Act[]; scenes: Scene[] } = { good: [], bad: [], scenes: [] };
  for (let attempt = 0; attempt < 30; attempt++) {
    const unseen = shuffle(ctx.rng, bank.scenes.filter((scene) => !ctx.used.has(factKey(bank, scene))));
    const seen = shuffle(ctx.rng, bank.scenes.filter((scene) => ctx.used.has(factKey(bank, scene))));
    const picked = [...unseen, ...seen].slice(0, goodCount + badCount);
    drawn = {
      good: picked.slice(0, goodCount).map((scene) => scene.right),
      bad: picked.slice(goodCount).map((scene) => pick(ctx.rng, scene.wrong)),
      scenes: picked,
    };
    const emojis = [...drawn.good, ...drawn.bad].map((act) => act[0]);
    if (new Set(emojis).size === emojis.length) break;
  }
  return drawn;
}

/** Les scènes dont un exercice a pris un geste ont servi dans ce palier. */
function markSeen(ctx: GameContext, bank: Bank, scenes: readonly Scene[]): void {
  for (const scene of scenes) ctx.used.add(factKey(bank, scene));
}

/** Les deux cases, dans les mots de la démonstration : la première reçoit les bons gestes, la seconde les mauvais. */
const ZONES = ["✅ À faire", "❌ À éviter"] as const;

/**
 * « Glisse chaque geste dans la bonne case. » : quatre gestes, deux de chaque côté, à tous les niveaux. Des phrases
 * entières font des tuiles hautes : à cinq, la page de la séance dépasse l'écran d'un téléphone de 375 × 812 de 440 px.
 */
function sceneSort(kind: string, bank: Bank, ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const { good, bad, scenes } = drawActs(ctx, bank, 2, 2);
      markSeen(ctx, bank, scenes);
      const items = shuffle(ctx.rng, [
        ...good.map((act) => ({ text: actTile(act), correctZone: ZONES[0] as string })),
        ...bad.map((act) => ({ text: actTile(act), correctZone: ZONES[1] as string })),
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque geste dans la bonne case.",
        payload: { zones: shuffle(ctx.rng, [...ZONES]), items, game: originOf(kind, ctx), concept: bank.concept },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis les gestes l'un après l'autre.",
          "Un geste à faire protège ta santé ou celle des autres.",
          "Un geste à éviter fait du mal ou du danger.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Quel geste est bon pour la santé ? » ou « … mauvais pour la santé ? » : trois gestes de trois scènes, un seul d'un côté. */
function sceneOdd(kind: string, bank: Bank, ask: { good: string; bad: string }, ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const answerIsBad = ctx.rng() < 0.5;
      const draw = () => drawActs(ctx, bank, answerIsBad ? 2 : 1, answerIsBad ? 1 : 2);
      let drawn = draw();
      // Les trois gestes de longueur voisine : la réponse ne se devine pas au texte le plus long ou le plus court.
      for (let attempt = 0; attempt < 30 && spread([...drawn.good, ...drawn.bad]) >= 1.8; attempt++) drawn = draw();
      markSeen(ctx, bank, drawn.scenes);
      const { good, bad } = drawn;
      const answer = answerIsBad ? bad[0] : good[0];
      const options = shuffle(ctx.rng, [...good, ...bad].map(actTile));
      return {
        type: "qcm",
        prompt: answerIsBad ? ask.bad : ask.good,
        payload: { options, correctIndex: options.indexOf(actTile(answer)), game: originOf(kind, ctx), concept: bank.concept },
        answerKey: actTile(answer),
        hints: [
          "Lis les trois gestes l'un après l'autre.",
          answerIsBad
            ? "Deux gestes protègent, un seul fait du mal ou du danger."
            : "Deux gestes font du mal ou du danger, un seul protège.",
          "Pense à ce qui te garde en bonne santé.",
        ],
      };
    },
    sortedOptions,
  );
}

/**
 * Une suite qui n'a qu'un ordre : « Mets les gestes dans l'ordre pour te laver les mains. » Trois ou quatre gestes : à
 * cinq, le dernier passe sous le dock d'un téléphone de 375 × 812. `fact` dit l'outil ou la chose qu'elle apprend à
 * manier, quand une scène de la banque l'apprend aussi.
 */
type Sequence = { id: string; prompt: string; steps: readonly Act[]; fact?: string };

/**
 * Une suite au hasard. Une suite qui apprend la même chose qu'une scène déjà montrée dans le palier passe après les
 * autres.
 */
function sceneSteps(kind: string, bank: Bank, sequences: readonly Sequence[], ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const sequence = pickFresh(ctx, sequences, (candidate) =>
        candidate.fact ? `${bank.name}-fait:${candidate.fact}` : `${kind}-seq:${candidate.prompt}`,
      );
      const tiles = sequence.steps.map(actTile);
      return {
        type: "order",
        prompt: sequence.prompt,
        payload: { correctSequence: tiles, game: originOf(kind, ctx), concept: bank.concept },
        answerKey: tiles.join(", "),
        hints: ["Pense à ce qui se passe en premier.", "Cherche ce qui arrive en dernier.", "Dis les gestes à voix haute, dans l'ordre."],
      };
    },
    (game) => String(game.answerKey),
  );
}

type Gap = { text: string; answer: string; wrong: readonly [string, string]; hint: string };

/** Une phrase à trou : le mot juste parmi trois, deux qui ne vont pas dans la phrase. `keyOf` dit ce qui fait son identité dans le palier. */
function gapGame<G extends Gap>(
  kind: string,
  gaps: readonly G[],
  concept: string,
  ctx: GameContext,
  lastHint: string,
  keyOf: (gap: G) => string = (gap) => `${kind}-gap:${gap.text}`,
): GeneratedGame {
  return fresh(ctx, kind, () => {
    const gap = pickFresh(ctx, gaps, keyOf);
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
      hints: ["Lis la phrase en entier, doucement.", gap.hint, lastHint],
    };
  });
}

// ===========================================================================
// MON CORPS ET LA PROPRETÉ (sc-ci-hygiene)
// ===========================================================================

export function makeHygieneChoice(ctx: GameContext): GeneratedGame {
  return sceneChoice("hygiene-situation", HYGIENE, ctx);
}

export function makeHygieneSort(ctx: GameContext): GeneratedGame {
  return sceneSort("hygiene-glisser", HYGIENE, ctx);
}

export function makeHygieneOdd(ctx: GameContext): GeneratedGame {
  return sceneOdd(
    "hygiene-intrus",
    HYGIENE,
    { good: "Quel geste est bon pour la santé ?", bad: "Quel geste est mauvais pour la santé ?" },
    ctx,
  );
}

export const HYGIENE_SEQUENCES: readonly Sequence[] = [
  {
    id: "sq-hy-mains",
    prompt: "Mets les gestes dans l'ordre pour te laver les mains.",
    steps: [
      ["💧", "Je mouille mes mains"],
      ["🧼", "Je mets du savon"],
      ["👐", "Je frotte mes mains"],
      ["🚰", "Je rince mes mains"],
    ],
  },
  {
    id: "sq-hy-dents",
    prompt: "Mets les gestes dans l'ordre pour te brosser les dents.",
    steps: [
      ["🤲", "Je prends ma brosse à dents"],
      ["🦷", "Je brosse bien mes dents"],
      ["💧", "Je rince ma bouche à l'eau"],
    ],
  },
  {
    id: "sq-hy-corps",
    prompt: "Mets les gestes dans l'ordre pour te laver le corps.",
    steps: [
      ["🚿", "Je mouille tout mon corps"],
      ["🧼", "Je me savonne partout"],
      ["💦", "Je me rince bien à l'eau"],
    ],
  },
  {
    id: "sq-hy-repas",
    prompt: "Mets les gestes dans l'ordre du repas.",
    steps: [
      ["🧼", "Je me lave les mains d'abord"],
      ["💺", "Je m'assois à table"],
      ["🥣", "Je mange mon repas"],
    ],
  },
];

export function makeHygieneSteps(ctx: GameContext): GeneratedGame {
  return sceneSteps("hygiene-ordre", HYGIENE, HYGIENE_SEQUENCES, ctx);
}

/** Une partie du corps, la question qui la désigne par ce qu'elle fait, et un indice qui n'écrit pas son nom. */
type Sense = { question: string; answer: string; hint: string };

export const SENSES: readonly Sense[] = [
  { question: "Avec quoi je vois ?", answer: "les yeux", hint: "On les ouvre le matin et on les ferme pour dormir." },
  { question: "Avec quoi j'entends ?", answer: "les oreilles", hint: "Elles sont de chaque côté de la tête." },
  { question: "Avec quoi je sens les odeurs ?", answer: "le nez", hint: "Il est au milieu du visage, au-dessus de la bouche." },
  { question: "Avec quoi je goûte ?", answer: "la langue", hint: "Elle est dans la bouche, elle sent le sucré et le salé." },
  { question: "Avec quoi je prends un objet ?", answer: "les mains", hint: "Elles sont au bout des bras, avec cinq doigts chacune." },
];

/** « Avec quoi je vois ? » : la partie du corps qui fait cela, parmi trois, jamais deux qui vont. */
export function makeHygieneSense(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "hygiene-sens",
    () => {
      const sense = pickFresh(ctx, SENSES, (candidate) => `hygiene-sens:${candidate.answer}`);
      const others = SENSES.filter((other) => other !== sense).map((other) => other.answer);
      const options = shuffle(ctx.rng, [sense.answer, ...shuffle(ctx.rng, others).slice(0, 2)]);
      return {
        type: "qcm",
        prompt: sense.question,
        payload: { options, correctIndex: options.indexOf(sense.answer), game: originOf("hygiene-sens", ctx), concept: HYGIENE.concept },
        answerKey: sense.answer,
        hints: ["Regarde les trois dessins, l'un après l'autre.", sense.hint, "Pense à ce que tu fais chaque jour."],
      };
    },
    sortedOptions,
  );
}

/** Une partie du corps et le soin qu'on lui donne : trois paires où un seul soin va à chaque partie. */
export const CARES: readonly { part: string; care: string }[] = [
  { part: "les mains", care: "Les laver avec du savon" },
  { part: "les dents", care: "Les brosser" },
  { part: "les ongles", care: "Les couper" },
];

/** « Relie chaque partie du corps à son soin. » : les mains, les dents, les ongles. */
export function makeHygieneCare(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "hygiene-soin",
    () => {
      const pairs = shuffle(ctx.rng, CARES).map((care) => ({ left: care.part, right: care.care }));
      return {
        type: "match",
        prompt: "Relie chaque partie du corps à son soin.",
        payload: { pairs, game: originOf("hygiene-soin", ctx), concept: HYGIENE.concept },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde les parties du corps, l'une après l'autre.",
          "Pense à ce que tu fais chaque jour pour rester propre.",
          "Chaque soin ne va qu'avec une partie.",
        ],
      };
    },
    linkKey,
  );
}

export const HYGIENE_GAPS: readonly Gap[] = [
  { text: "Je me brosse les ___.", answer: "dents", wrong: ["yeux", "oreilles"], hint: "On les brosse le matin et le soir, après avoir mangé." },
  { text: "Je me lave les mains avec du ___.", answer: "savon", wrong: ["lait", "riz"], hint: "Il fait de la mousse et il enlève la saleté." },
  { text: "Je coupe mes ___ quand ils sont longs.", answer: "ongles", wrong: ["dents", "yeux"], hint: "Ils poussent au bout des doigts." },
];

/** « Je me brosse les ___. » : le mot juste parmi trois, deux qui ne vont pas dans la phrase. */
export function makeHygieneGap(ctx: GameContext): GeneratedGame {
  return gapGame("hygiene-trou", HYGIENE_GAPS, HYGIENE.concept, ctx, "Écarte les mots qui ne vont pas dans la phrase.");
}

// ===========================================================================
// LES OUTILS DE LA MAISON ET DE L'ÉCOLE (sc-ci-outils)
// ===========================================================================

/**
 * Un outil, la question qui le désigne, ce qu'il sert à faire, et son groupe : deux outils d'un même groupe font
 * presque la même chose, jamais ensemble dans une association. `others` est la liste des outils qui ne font sûrement
 * pas cela, les seuls mauvais choix de la question.
 */
type Tool = {
  id: string;
  name: string;
  ask: string;
  use: string;
  group: string;
  others: readonly string[];
  hint: string;
};

export const TOOLS_LIST: readonly Tool[] = [
  {
    id: "ciseaux",
    name: "les ciseaux",
    ask: "Avec quoi je coupe le papier ?",
    use: "Couper du papier",
    group: "coupe",
    others: ["le marteau", "le balai", "l'arrosoir", "le seau", "le pilon"],
    hint: "Il a deux lames qui se ferment l'une sur l'autre.",
  },
  {
    id: "marteau",
    name: "le marteau",
    ask: "Avec quoi j'enfonce un clou ?",
    use: "Enfoncer un clou",
    group: "frappe",
    others: ["les ciseaux", "le balai", "l'arrosoir", "le seau"],
    hint: "Il a un manche et une tête dure pour frapper.",
  },
  {
    id: "balai",
    name: "le balai",
    ask: "Avec quoi je balaie la cour ?",
    use: "Balayer la cour",
    group: "nettoie",
    others: ["les ciseaux", "le marteau", "l'arrosoir", "le pilon"],
    hint: "Il a un long manche et des brins qui poussent la poussière.",
  },
  {
    id: "arrosoir",
    name: "l'arrosoir",
    ask: "Avec quoi j'arrose les plantes ?",
    use: "Arroser les plantes",
    group: "eau",
    others: ["les ciseaux", "le marteau", "le balai", "le pilon"],
    hint: "L'eau sort par le bec, en petites gouttes.",
  },
  {
    id: "pilon",
    name: "le pilon",
    ask: "Avec quoi je pile le mil dans le mortier ?",
    use: "Piler le mil",
    group: "frappe",
    others: ["les ciseaux", "le balai", "l'arrosoir", "le seau"],
    hint: "C'est un gros bâton lourd, que l'on lève et que l'on baisse.",
  },
  {
    id: "seau",
    name: "le seau",
    ask: "Avec quoi je porte de l'eau du puits ?",
    use: "Puiser et porter de l'eau",
    group: "eau",
    others: ["les ciseaux", "le marteau", "le balai", "le pilon"],
    hint: "Il a une anse, et il garde l'eau sans la perdre.",
  },
];

/** « Avec quoi je coupe le papier ? » : l'outil qui le fait, parmi trois, deux qui ne le font sûrement pas. */
export function makeToolWho(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "outil-qui",
    () => {
      const tool = pickFresh(ctx, TOOLS_LIST, (candidate) => `outil-fait:${candidate.id}`);
      const options = shuffle(ctx.rng, [tool.name, ...shuffle(ctx.rng, tool.others).slice(0, 2)]);
      return {
        type: "qcm",
        prompt: tool.ask,
        payload: { options, correctIndex: options.indexOf(tool.name), game: originOf("outil-qui", ctx), concept: TOOLS.concept },
        answerKey: tool.name,
        hints: ["Regarde les trois outils, l'un après l'autre.", tool.hint, "Pense à un outil que tu as vu à la maison ou à l'école."],
      };
    },
    sortedOptions,
  );
}

/**
 * « Relie chaque outil à ce qu'il sert à faire. » : trois paires, à tous les niveaux, d'outils de trois groupes
 * différents. Quatre feraient passer une tuile sous le dock d'un téléphone de 375 × 812.
 */
export function makeToolLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "outil-relier",
    () => {
      const groups = new Map<string, Tool[]>();
      for (const tool of TOOLS_LIST) groups.set(tool.group, [...(groups.get(tool.group) ?? []), tool]);
      const chosen = shuffle(ctx.rng, [...groups.values()])
        .slice(0, 3)
        .map((tools) => takeFresh(ctx, tools, 1, (tool) => `outil-fait:${tool.id}`)[0]);
      const pairs = chosen.map((tool) => ({ left: tool.name, right: tool.use }));
      return {
        type: "match",
        prompt: "Relie chaque outil à ce qu'il sert à faire.",
        payload: { pairs, game: originOf("outil-relier", ctx), concept: TOOLS.concept },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde les outils, l'un après l'autre.",
          "Pense à ce que tu fais avec chaque outil, à l'école ou à la maison.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/** Une phrase à trou des outils ; `tool` est l'identifiant de l'outil de la phrase (voir `Tool`). */
type ToolGap = Gap & { tool: string };

export const TOOL_GAPS: readonly ToolGap[] = [
  { tool: "ciseaux", text: "Je coupe le papier avec ___.", answer: "les ciseaux", wrong: ["le marteau", "le balai"], hint: "Il a deux lames qui se ferment." },
  { tool: "balai", text: "Pour balayer la cour, je prends ___.", answer: "le balai", wrong: ["les ciseaux", "l'arrosoir"], hint: "Il a un long manche." },
  { tool: "arrosoir", text: "J'arrose les plantes avec ___.", answer: "l'arrosoir", wrong: ["le balai", "le marteau"], hint: "L'eau sort par son bec." },
  { tool: "marteau", text: "J'enfonce un clou avec ___.", answer: "le marteau", wrong: ["le balai", "les ciseaux"], hint: "Sa tête est dure, pour frapper." },
  { tool: "pilon", text: "Je pile le mil avec ___.", answer: "le pilon", wrong: ["les ciseaux", "le balai"], hint: "C'est un gros bâton lourd." },
  { tool: "seau", text: "Je porte de l'eau dans ___.", answer: "le seau", wrong: ["le balai", "les ciseaux"], hint: "Il a une anse pour le porter." },
];

/** « Je coupe le papier avec ___. » : l'outil juste parmi trois, deux qui ne conviennent pas. Un outil déjà demandé dans le palier passe après les autres. */
export function makeToolGap(ctx: GameContext): GeneratedGame {
  return gapGame("outil-trou", TOOL_GAPS, TOOLS.concept, ctx, "Écarte les outils qui ne conviennent pas.", (gap) => `outil-fait:${gap.tool}`);
}

export const TOOL_SEQUENCES: readonly Sequence[] = [
  {
    id: "sq-ou-balai",
    fact: "balai",
    prompt: "Mets les gestes dans l'ordre pour utiliser le balai.",
    steps: [
      ["🧹", "Je prends le balai"],
      ["💨", "Je balaie la cour"],
      ["🧺", "Je range le balai"],
    ],
  },
  {
    id: "sq-ou-arrosoir",
    fact: "arrosoir",
    prompt: "Mets les gestes dans l'ordre pour arroser les plantes.",
    steps: [
      ["🚰", "Je remplis l'arrosoir d'eau"],
      ["💧", "J'arrose les plantes"],
      ["🧺", "Je range l'arrosoir"],
    ],
  },
  {
    id: "sq-ou-ciseaux",
    fact: "ciseaux",
    prompt: "Mets les gestes dans l'ordre pour couper du papier.",
    steps: [
      ["🤲", "Je prends les ciseaux"],
      ["📄", "Je coupe le papier"],
      ["🧺", "Je range les ciseaux"],
    ],
  },
  {
    id: "sq-ou-marteau",
    fact: "marteau",
    prompt: "Mets les gestes dans l'ordre pour enfoncer un clou.",
    steps: [
      ["🤲", "Je pose le clou sur le bois"],
      ["🔨", "Je frappe sur le clou"],
      ["🧺", "Je range le marteau"],
    ],
  },
  {
    id: "sq-ou-mil",
    fact: "pilon",
    prompt: "Mets les gestes dans l'ordre pour piler le mil.",
    steps: [
      ["🌾", "Je mets le mil dans le mortier"],
      ["💪", "Je pile le mil avec le pilon"],
      ["💦", "Je lave le mortier et le pilon"],
    ],
  },
];

export function makeToolSteps(ctx: GameContext): GeneratedGame {
  return sceneSteps("outil-ordre", TOOLS, TOOL_SEQUENCES, ctx);
}

export function makeToolChoice(ctx: GameContext): GeneratedGame {
  return sceneChoice("outil-geste", TOOLS, ctx);
}

export function makeToolSort(ctx: GameContext): GeneratedGame {
  return sceneSort("outil-glisser", TOOLS, ctx);
}
