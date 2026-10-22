/**
 * LES GABARITS DES SCIENCES DU CI, PREMIÈRE PARTIE : ce qui est naturel ou fabriqué, les animaux, les plantes
 * (`sc-ci-milieu`, `sc-ci-animaux`, `sc-ci-plantes`).
 *
 * Sur les vingt-cinq exercices de sciences du CI que le modèle avait écrits et que nous avons relus, six étaient faux.
 * Ceux du modèle montraient entre autres un ordre « par habitat » (Lion, Crocodile, Poule) sans ordre ni critère,
 * l'arachide rangée parmi les céréales, le bissap « fabriqué » dans un exercice et « naturel » dans le suivant,
 * « Naturel » écrit deux fois dans une association, de longues descriptions en guise de tuiles, « Le baobab a des ___
 * très nutritifs » où les feuilles et les fruits vont. Ici chaque réponse se lit dans un tableau : une chose, ce qu'on
 * en sait avec certitude, et rien d'autre.
 *
 * LES TUILES. Une tuile qui nomme une chose est « article + nom », un mot du catalogue des images
 * (`lib/item-images.ts`) : au CI l'écran y met le dessin et garde le nom écrit. Une tuile n'a donc pas d'émoji de
 * tête (plusieurs émojis de la chose sont trop récents pour un appareil ancien). Dans un même exercice, toutes les
 * tuiles sont des mots du catalogue ou aucune ne l'est : une seule tuile sans image désignerait la bonne réponse
 * (ou la mauvaise) par élimination, et l'écran retire alors toutes les images.
 *
 * CE QUE LES TABLEAUX NE DISENT PAS, ON NE LE DEMANDE PAS
 * - Le crocodile vit dans l'eau et sur la terre : il n'est jamais rangé selon son habitat. La poule vole un peu :
 *   elle n'est jamais le mauvais choix de « Quel animal vole ? ».
 * - Le mouton a de la laine, la chèvre des poils longs, l'éléphant une peau presque nue : aucune question sur ce
 *   qui couvre leur corps.
 * - Aucun aliment préparé dans « naturel ou fabriqué » (le yassa, le bissap, le pain : l'enfant ne sait pas ce
 *   qu'on en attend). Les choses sont les éléments du milieu que la fiche nomme, et des objets que l'enfant voit
 *   chaque jour.
 * - La plante qui donne l'arachide est « l'arachidier » (le dessin du catalogue), son fruit « l'arachide ».
 *
 * RÈGLES POUR AJOUTER UNE CHOSE
 * - Le nom, avec son article, est un mot du catalogue (`pictureForTile` le reconnaît), et un test le vérifie.
 * - Une seule catégorie sans doute possible, pour une classe de six ans.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, et vingt mots au plus (la consigne du CI).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pickFresh, randomInt, shuffle, sortedOptions, takeFresh, type GameContext, type GeneratedGame } from "./shared";
import { linkKey } from "./anglais";
import { pickForLevel } from "./tableaux";

const capital = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);

/** Trois choix mélangés : la bonne réponse et deux autres de `others`, différentes d'elle. */
function threeOf(ctx: GameContext, answer: string, others: readonly string[]): string[] {
  return shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, others.filter((other) => other !== answer)).slice(0, 2)]);
}

/** Un QCM de trois tuiles : la bonne réponse, deux autres. */
function choiceGame(
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
function sortGame(
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
const itemsKey = (game: GeneratedGame) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort());

/** Une phrase à trou : un seul trou, le mot juste et deux mots qui ne vont pas dans la phrase. */
type Gap = { text: string; answer: string; wrong: readonly [string, string]; hint: string };

function gapGame(kind: string, ctx: GameContext, gap: Gap, concept: string): GeneratedGame {
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

// ===========================================================================
// NATUREL OU FABRIQUÉ ? (sc-ci-milieu)
// ===========================================================================

const MILIEU_CONCEPT = "les éléments naturels du milieu et les objets fabriqués par l'homme";

/** Ce qui existe sans l'homme : les éléments du milieu que la fiche nomme, les plantes et les animaux. */
export const NATURAL_THINGS: readonly string[] = [
  "l'arbre",
  "l'eau",
  "le sable",
  "la pierre",
  "le soleil",
  "le ciel",
  "la fleur",
  "la feuille",
  "la montagne",
  "le baobab",
  "le poisson",
  "l'oiseau",
  "le lion",
  "l'éléphant",
  "le singe",
  "la girafe",
];

/** Ce que des personnes ont fait : des objets de la maison, de l'école, de la rue. */
export const MADE_THINGS: readonly string[] = [
  "la table",
  "la chaise",
  "le seau",
  "le vélo",
  "la pirogue",
  "la voiture",
  "le bus",
  "la maison",
  "le ballon",
  "la lampe",
  "le livre",
  "le balai",
  "le marteau",
  "les ciseaux",
  "l'assiette",
  "le cahier",
  "le stylo",
  "le crayon",
  "la règle",
  "la robe",
  "le tee-shirt",
  "le chapeau",
  "le lit",
  "l'armoire",
  "la radio",
  "le cartable",
];

/** Au premier palier, les choses dont personne ne doute ; ensuite, toute la liste (la pierre, le sable, la pirogue, la maison). */
const EASY_NATURAL: readonly string[] = ["l'arbre", "l'eau", "le soleil", "la fleur", "le poisson", "le lion"];
const EASY_MADE: readonly string[] = ["la table", "le vélo", "le seau", "la voiture", "le ballon", "le livre"];

const naturalOf = (level: number) => (level === 1 ? EASY_NATURAL : NATURAL_THINGS);
const madeOf = (level: number) => (level === 1 ? EASY_MADE : MADE_THINGS);

/** La clé d'une chose déjà montrée dans ce palier, la même pour les trois gabarits de la thématique. */
const milieuKey = (thing: string) => `milieu:${thing}`;

/** « Quelle chose est fabriquée par l'homme ? » : une chose fabriquée parmi deux de la nature, ou l'inverse. */
export function makeMilieuOdd(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "milieu-intrus",
    () => {
      const answerIsMade = ctx.rng() < 0.5;
      const [answer] = takeFresh(ctx, answerIsMade ? madeOf(ctx.level) : naturalOf(ctx.level), 1, milieuKey);
      return choiceGame(
        "milieu-intrus",
        ctx,
        answerIsMade ? "Quelle chose est fabriquée par l'homme ?" : "Quelle chose existe dans la nature, sans l'homme ?",
        answer,
        takeFresh(ctx, answerIsMade ? naturalOf(ctx.level) : madeOf(ctx.level), 2, milieuKey),
        MILIEU_CONCEPT,
        [
          "Regarde les trois dessins, l'un après l'autre.",
          answerIsMade
            ? "Une chose fabriquée, des personnes l'ont faite avec leurs mains ou une machine."
            : "Une chose de la nature est là sans que personne l'ait faite.",
          answerIsMade
            ? "Les deux autres choses sont là dans la nature, personne ne les a faites."
            : "Les deux autres choses ont été faites par des personnes.",
        ],
      );
    },
    sortedOptions,
  );
}

const MILIEU_ZONES = ["Naturel", "Fabriqué"] as const;

/**
 * « Glisse chaque chose dans la bonne case. » : quatre choses, cinq aux deux derniers niveaux, des deux sortes. Pas plus :
 * sur un téléphone de 375 × 812, six tuiles à image font trois rangées et les cases passent sous le dock.
 */
export function makeMilieuSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "milieu-glisser",
    () => {
      const total = ctx.level <= 2 ? 4 : 5;
      const naturalCount = Math.floor(total / 2) + (total % 2 === 1 ? randomInt(ctx.rng, 0, 1) : 0);
      const items = shuffle(ctx.rng, [
        ...takeFresh(ctx, naturalOf(ctx.level), naturalCount, milieuKey).map((text) => ({ text, correctZone: MILIEU_ZONES[0] as string })),
        ...takeFresh(ctx, madeOf(ctx.level), total - naturalCount, milieuKey).map((text) => ({ text, correctZone: MILIEU_ZONES[1] as string })),
      ]);
      return sortGame("milieu-glisser", ctx, "Glisse chaque chose dans la bonne case.", MILIEU_ZONES, items, MILIEU_CONCEPT, [
        "Regarde les dessins, l'un après l'autre.",
        "Naturel veut dire que la chose est là dans la nature, sans l'homme.",
        "Fabriqué veut dire que des personnes l'ont faite.",
      ]);
    },
    itemsKey,
  );
}

/** « Le sable, la pierre et ___ sont dans la nature. » : deux exemples dans la phrase, la troisième chose dans le trou. */
export function makeMilieuGap(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "milieu-trou",
    () => {
      const answerIsMade = ctx.rng() < 0.5;
      const [first, second, answer] = takeFresh(ctx, answerIsMade ? madeOf(ctx.level) : naturalOf(ctx.level), 3, milieuKey);
      const wrong = takeFresh(ctx, answerIsMade ? naturalOf(ctx.level) : madeOf(ctx.level), 2, milieuKey) as [string, string];
      return gapGame(
        "milieu-trou",
        ctx,
        {
          text: `${capital(first)}, ${second} et ___ ${answerIsMade ? "sont fabriqués par l'homme" : "sont dans la nature"}.`,
          answer,
          wrong,
          hint: answerIsMade
            ? "Les deux premières choses ont été faites par des personnes."
            : "Les deux premières choses sont là sans que personne les ait faites.",
        },
        MILIEU_CONCEPT,
      );
    },
    // La phrase qu'on lit fait l'identité : la même phrase avec une autre réponse serait la même question.
    (game) => String(game.payload.text),
  );
}

// ===========================================================================
// LES ANIMAUX AUTOUR DE MOI (sc-ci-animaux)
// ===========================================================================

type Keeper = "domestique" | "sauvage";
type Cover = "poils" | "plumes" | "écailles";
type Home = "eau" | "terre" | "air";

/** Un animal, avec ce qu'on en sait avec certitude : `null` quand la réponse se discute (la laine, l'eau et la terre). */
export type Animal = { name: string; keeper: Keeper | null; cover: Cover | null; home: Home | null };

export const ANIMALS: readonly Animal[] = [
  { name: "le chat", keeper: "domestique", cover: "poils", home: "terre" },
  { name: "le chien", keeper: "domestique", cover: "poils", home: "terre" },
  { name: "le mouton", keeper: "domestique", cover: null, home: "terre" },
  { name: "la chèvre", keeper: "domestique", cover: null, home: "terre" },
  { name: "la poule", keeper: "domestique", cover: "plumes", home: "terre" },
  { name: "l'âne", keeper: "domestique", cover: "poils", home: "terre" },
  { name: "la vache", keeper: "domestique", cover: "poils", home: "terre" },
  { name: "le cheval", keeper: "domestique", cover: "poils", home: "terre" },
  { name: "le lion", keeper: "sauvage", cover: "poils", home: "terre" },
  { name: "le singe", keeper: "sauvage", cover: "poils", home: "terre" },
  { name: "la hyène", keeper: "sauvage", cover: "poils", home: "terre" },
  { name: "le crocodile", keeper: "sauvage", cover: "écailles", home: null },
  { name: "l'éléphant", keeper: "sauvage", cover: null, home: "terre" },
  { name: "la girafe", keeper: "sauvage", cover: "poils", home: "terre" },
  { name: "le poisson", keeper: null, cover: "écailles", home: "eau" },
  { name: "l'étoile de mer", keeper: null, cover: null, home: "eau" },
  { name: "l'oiseau", keeper: null, cover: "plumes", home: "air" },
  { name: "la fourmi", keeper: null, cover: null, home: "terre" },
];

const names = (animals: readonly Animal[]) => animals.map((animal) => animal.name);

const DOMESTIC = names(ANIMALS.filter((animal) => animal.keeper === "domestique"));
const WILD = names(ANIMALS.filter((animal) => animal.keeper === "sauvage"));
const WATER = names(ANIMALS.filter((animal) => animal.home === "eau"));
const AIR = names(ANIMALS.filter((animal) => animal.home === "air"));
const LAND = names(ANIMALS.filter((animal) => animal.home === "terre"));

const FAUNE_CONCEPT = "les animaux du Sénégal : domestiques ou sauvages, leur corps, l'endroit où ils vivent";

/** Les animaux qui ont ce qui couvre leur corps, et ceux qui en ont un autre (jamais ceux dont on discute). */
const covered = (cover: Cover) => names(ANIMALS.filter((animal) => animal.cover === cover));
const notCovered = (cover: Cover) => names(ANIMALS.filter((animal) => animal.cover !== null && animal.cover !== cover));

/** La clé d'un animal déjà montré dans ce palier, la même pour tous les gabarits de la thématique. */
const faunaKey = (animal: string) => `faune:${animal}`;

const ZONES_KEEPER = ["Domestiques", "Sauvages"] as const;

/** « Glisse chaque animal dans la bonne case. » : domestiques ou sauvages, quatre animaux, cinq aux deux derniers niveaux. */
export function makeFauneSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-glisser",
    () => {
      const total = ctx.level <= 2 ? 4 : 5;
      const domesticCount = Math.floor(total / 2) + (total % 2 === 1 ? randomInt(ctx.rng, 0, 1) : 0);
      const items = shuffle(ctx.rng, [
        ...takeFresh(ctx, DOMESTIC, domesticCount, faunaKey).map((text) => ({ text, correctZone: ZONES_KEEPER[0] as string })),
        ...takeFresh(ctx, WILD, total - domesticCount, faunaKey).map((text) => ({ text, correctZone: ZONES_KEEPER[1] as string })),
      ]);
      return sortGame("faune-glisser", ctx, "Glisse chaque animal dans la bonne case.", ZONES_KEEPER, items, FAUNE_CONCEPT, [
        "Regarde les animaux, l'un après l'autre.",
        "Un animal domestique vit près des gens : la famille s'en occupe.",
        "Un animal sauvage vit libre, loin des maisons.",
      ]);
    },
    itemsKey,
  );
}

const ZONES_HOME = ["Dans l'eau", "Sur la terre", "Dans les airs"] as const;

/**
 * « Glisse chaque animal là où il vit. » : dans l'eau, sur la terre ou dans les airs, au moins un animal dans chaque
 * case. Quatre animaux, cinq aux deux derniers niveaux (un animal de l'eau de plus) : trois cases font déjà un écran haut.
 */
export function makeFauneHabitat(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-habitat",
    () => {
      const water = takeFresh(ctx, WATER, ctx.level >= 3 ? 2 : 1, faunaKey);
      const land = takeFresh(ctx, LAND, 2, faunaKey);
      const items = shuffle(ctx.rng, [
        ...water.map((text) => ({ text, correctZone: ZONES_HOME[0] as string })),
        ...land.map((text) => ({ text, correctZone: ZONES_HOME[1] as string })),
        ...AIR.map((text) => ({ text, correctZone: ZONES_HOME[2] as string })),
      ]);
      return sortGame("faune-habitat", ctx, "Glisse chaque animal là où il vit.", ZONES_HOME, items, FAUNE_CONCEPT, [
        "Regarde les animaux, l'un après l'autre.",
        "Un animal qui nage vit dans l'eau, un animal qui vole vit dans les airs.",
        "Les autres animaux marchent : ils vivent sur la terre.",
      ]);
    },
    itemsKey,
  );
}

/** « Quel animal est domestique ? » ou « Quel animal est sauvage ? » : un animal d'un côté, deux de l'autre. */
export function makeFauneOdd(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-intrus",
    () => {
      const answerIsWild = ctx.rng() < 0.5;
      const [answer] = takeFresh(ctx, answerIsWild ? WILD : DOMESTIC, 1, faunaKey);
      return choiceGame(
        "faune-intrus",
        ctx,
        answerIsWild ? "Quel animal est sauvage ?" : "Quel animal est domestique ?",
        answer,
        takeFresh(ctx, answerIsWild ? DOMESTIC : WILD, 2, faunaKey),
        FAUNE_CONCEPT,
        [
          "Regarde les trois animaux, l'un après l'autre.",
          answerIsWild ? "Un animal sauvage vit libre, loin des maisons." : "Un animal domestique vit près des gens : la famille s'en occupe.",
          answerIsWild ? "Les deux autres animaux vivent près des gens." : "Les deux autres animaux vivent libres, loin des maisons.",
        ],
      );
    },
    sortedOptions,
  );
}

const COVERS: readonly { cover: Cover; prompt: string; hint: string }[] = [
  { cover: "poils", prompt: "Quel animal a des poils ?", hint: "Les poils sont doux ou durs, et on peut les caresser." },
  { cover: "plumes", prompt: "Quel animal a des plumes ?", hint: "Les plumes sont légères, et l'animal a des ailes." },
  { cover: "écailles", prompt: "Quel animal a des écailles ?", hint: "Les écailles sont dures et lisses, comme de petites plaques." },
];

/** « Quel animal a des plumes ? » : un animal qui a ce que dit l'énoncé, deux qui ont autre chose. */
export function makeFauneCover(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-couvre",
    () => {
      const asked = COVERS[Math.floor(ctx.rng() * COVERS.length)];
      const [answer] = takeFresh(ctx, covered(asked.cover), 1, faunaKey);
      return choiceGame("faune-couvre", ctx, asked.prompt, answer, takeFresh(ctx, notCovered(asked.cover), 2, faunaKey), FAUNE_CONCEPT, [
        "Regarde le corps de chaque animal.",
        asked.hint,
        "Les deux autres animaux ont autre chose sur le corps.",
      ]);
    },
    sortedOptions,
  );
}

/** Les animaux dont personne ne dit qu'ils nagent ou qu'ils volent : ni la poule, ni le crocodile. */
const WALKERS = names(ANIMALS.filter((animal) => animal.home === "terre" && animal.name !== "la poule"));

/** « Quel animal vit dans l'eau ? » ou « Quel animal vole dans le ciel ? » : l'animal de l'eau ou de l'air, deux animaux qui marchent. */
export function makeFauneLives(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-vit",
    () => {
      // Trois questions en tout (le poisson, l'étoile de mer, l'oiseau) : chaque palier a la sienne. Leur clé est à elles : les autres jeux de
      // la thématique ont déjà pris ces bêtes dans le palier, et la fenêtre du palier serait vide.
      const asks = [...WATER.map((name) => ({ inWater: true, answer: name })), ...AIR.map((name) => ({ inWater: false, answer: name }))];
      const { inWater, answer } = pickForLevel(ctx, asks, (ask) => `faune-vit-question:${ask.answer}`);
      return choiceGame(
        "faune-vit",
        ctx,
        inWater ? "Quel animal vit dans l'eau ?" : "Quel animal vole dans le ciel ?",
        answer,
        takeFresh(ctx, WALKERS, 2, faunaKey),
        FAUNE_CONCEPT,
        [
          "Regarde les trois animaux, l'un après l'autre.",
          inWater ? "Cet animal vit sous l'eau, jamais sur la terre." : "Cet animal a des ailes et des plumes.",
          "Les deux autres animaux marchent sur la terre.",
        ],
      );
    },
    sortedOptions,
  );
}

/** « Relie chaque animal à l'endroit où il vit. » : un animal de l'eau, un de l'air, un de la terre, face à leur endroit. */
export function makeFauneLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "faune-relier",
    () => {
      const [water] = takeFresh(ctx, WATER, 1, faunaKey);
      const [land] = takeFresh(ctx, LAND, 1, faunaKey);
      const [air] = AIR;
      const pairs = shuffle(ctx.rng, [
        { left: water, right: ZONES_HOME[0] as string },
        { left: air, right: ZONES_HOME[2] as string },
        { left: land, right: ZONES_HOME[1] as string },
      ]);
      return {
        type: "match",
        prompt: "Relie chaque animal à l'endroit où il vit.",
        payload: { pairs, game: originOf("faune-relier", ctx), concept: FAUNE_CONCEPT },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde les animaux, l'un après l'autre.",
          "Un animal qui nage vit dans l'eau, un animal qui vole vit dans les airs.",
          "Il reste l'endroit des animaux qui marchent.",
        ],
      };
    },
    linkKey,
  );
}

export const FAUNE_GAPS: readonly Gap[] = [
  { text: "Le poisson a des ___.", answer: "écailles", wrong: ["plumes", "poils"], hint: "Ce sont de petites plaques dures et lisses sur la peau." },
  { text: "La poule a des ___.", answer: "plumes", wrong: ["écailles", "poils"], hint: "Elles sont légères, et elles couvrent les ailes." },
  { text: "Le chat a des ___.", answer: "poils", wrong: ["plumes", "écailles"], hint: "On peut les caresser, ils sont doux." },
  { text: "Le poisson vit dans ___.", answer: "l'eau", wrong: ["le ciel", "l'arbre"], hint: "C'est là qu'il nage toute sa vie." },
  { text: "L'oiseau vole dans ___.", answer: "le ciel", wrong: ["l'eau", "le sable"], hint: "C'est tout en haut, au-dessus des arbres." },
  { text: "La vache donne ___.", answer: "du lait", wrong: ["du riz", "du sable"], hint: "On le boit, il est blanc." },
  { text: "La poule pond ___.", answer: "un œuf", wrong: ["un ballon", "un livre"], hint: "Il a une coquille, et un poussin peut en sortir." },
];

/** « Le poisson a des ___. » : le mot juste parmi trois, deux qui ne vont pas dans la phrase. */
export function makeFauneGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "faune-trou", () => {
    const gap = pickFresh(ctx, FAUNE_GAPS, (candidate) => `faune-gap:${candidate.text}`);
    return gapGame("faune-trou", ctx, gap, FAUNE_CONCEPT);
  });
}

// ===========================================================================
// LES PLANTES AUTOUR DE MOI (sc-ci-plantes)
// ===========================================================================

const PLANTE_CONCEPT = "les plantes du milieu et leurs parties : racine, tige, feuille, fleur, fruit";

/**
 * Une question sur une partie de la plante : la partie qui répond, et celles qui ne répondent pas du tout. `fact` dit
 * ce que l'enfant apprend, pour que la même chose ne soit pas demandée deux fois dans un palier par deux gabarits
 * (`plante-partie`, `plante-qui`, `plante-donne`, `plante-trou`).
 */
type PartClue = { fact: string; question: string; answer: string; others: readonly string[]; hint: string };

export const PART_CLUES: readonly PartClue[] = [
  {
    fact: "racine-sous-terre",
    question: "Quelle partie de la plante est sous la terre ?",
    answer: "la racine",
    others: ["la tige", "la feuille", "la fleur", "le fruit"],
    hint: "Elle boit l'eau de la terre, cachée dans le sol.",
  },
  {
    fact: "tige-porte-feuilles",
    question: "Quelle partie de la plante porte les feuilles ?",
    answer: "la tige",
    others: ["la racine", "la fleur", "le fruit"],
    hint: "Elle monte vers le ciel, droite, comme un petit tronc.",
  },
  {
    fact: "fruit-se-mange",
    question: "Quelle partie du manguier se mange ?",
    answer: "le fruit",
    others: ["la racine", "la tige", "la feuille"],
    hint: "Elle est sucrée, et elle pousse quand elle est mûre.",
  },
  {
    fact: "fleur-coloree",
    question: "Quelle partie de la plante est jolie et colorée ?",
    answer: "la fleur",
    others: ["la racine", "la tige", "la feuille"],
    hint: "Elle est rouge, jaune ou rose, et les abeilles l'aiment.",
  },
];

/** La clé d'une chose apprise, déjà montrée dans ce palier, la même pour les gabarits des plantes. */
const planteKey = (fact: string) => `plante-fait:${fact}`;

/** « Quelle partie de la plante est sous la terre ? » : la partie qui répond, parmi trois. */
export function makePlantePart(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plante-partie",
    () => {
      const clue = pickFresh(ctx, PART_CLUES, (candidate) => planteKey(candidate.fact));
      return choiceGame("plante-partie", ctx, clue.question, clue.answer, clue.others, PLANTE_CONCEPT, [
        "Regarde les trois dessins, l'un après l'autre.",
        clue.hint,
        "Pense à une plante que tu connais, au village.",
      ]);
    },
    sortedOptions,
  );
}

/** Une plante, et ce qu'elle donne ; `ask` est la question « Quelle plante donne… ? » quand le produit se dit sans nommer la plante. */
type Giver = { fact: string; plant: string; product: string; ask?: { question: string; emoji: string } };

export const GIVERS: readonly Giver[] = [
  { fact: "manguier-mangue", plant: "le manguier", product: "la mangue", ask: { question: "Quelle plante donne des mangues ?", emoji: "🥭" } },
  { fact: "arachidier-arachide", plant: "l'arachidier", product: "l'arachide", ask: { question: "Quelle plante donne des arachides ?", emoji: "🥜" } },
  { fact: "mil-grains", plant: "le mil", product: "les grains de mil", ask: { question: "Quelle plante donne des grains de mil ?", emoji: "🌾" } },
  { fact: "baobab-fruit", plant: "le baobab", product: "le fruit du baobab" },
  { fact: "fromager-fruit", plant: "le fromager", product: "le fruit du fromager" },
];

const PLANTS = GIVERS.map((giver) => giver.plant);

/** « Quelle plante donne des mangues ? » : la plante, parmi trois ; le produit est rappelé par un émoji sous l'énoncé. */
export function makePlanteWho(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plante-qui",
    () => {
      const giver = pickFresh(
        ctx,
        GIVERS.filter((candidate) => candidate.ask !== undefined),
        (candidate) => planteKey(candidate.fact),
      );
      const { question, emoji } = giver.ask!;
      return choiceGame("plante-qui", ctx, `${question}\n${emoji}`, giver.plant, PLANTS, PLANTE_CONCEPT, [
        "Regarde les trois plantes, l'une après l'autre.",
        "Pense à ce que tu manges et à la plante qui le donne.",
        "Une plante ne donne que ses propres fruits ou graines.",
      ]);
    },
    sortedOptions,
  );
}

/**
 * « Relie chaque plante à ce qu'elle donne. » : trois paires, à tous les niveaux. Quatre feraient une tuile passer sous le
 * dock sur un téléphone de 375 × 812 (la colonne de droite est haute : « le fruit du fromager » tient sur deux lignes).
 */
export function makePlanteLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plante-donne",
    () => {
      const pairs = takeFresh(ctx, GIVERS, 3, (giver) => planteKey(giver.fact)).map((giver) => ({
        left: giver.plant,
        right: giver.product,
      }));
      return {
        type: "match",
        prompt: "Relie chaque plante à ce qu'elle donne.",
        payload: { pairs, game: originOf("plante-donne", ctx), concept: PLANTE_CONCEPT },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde les plantes, puis ce qu'elles donnent.",
          "Chaque plante donne une seule chose de la liste.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

const ZONES_PLANT = ["Un arbre", "Une plante du champ"] as const;
const TREES = ["le baobab", "le manguier", "le fromager"];
const FIELD_PLANTS = ["le mil", "l'arachidier"];

/**
 * « Glisse chaque plante dans la bonne case. » : un arbre ou une plante du champ, deux arbres parmi trois et les deux
 * plantes du champ. Toujours quatre plantes : avec les cinq, deux exercices du même palier seraient les mêmes.
 */
export function makePlanteSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plante-type",
    () => {
      const items = shuffle(ctx.rng, [
        ...shuffle(ctx.rng, TREES)
          .slice(0, 2)
          .map((text) => ({ text, correctZone: ZONES_PLANT[0] as string })),
        ...FIELD_PLANTS.map((text) => ({ text, correctZone: ZONES_PLANT[1] as string })),
      ]);
      return sortGame("plante-type", ctx, "Glisse chaque plante dans la bonne case.", ZONES_PLANT, items, PLANTE_CONCEPT, [
        "Regarde les plantes, l'une après l'autre.",
        "Un arbre est grand, avec un tronc et des branches.",
        "Une plante du champ pousse en rangs, dans la terre que l'on a travaillée.",
      ]);
    },
    itemsKey,
  );
}

/** « Mets les parties de la plante dans l'ordre du bas vers le haut. » : la racine, la tige, la feuille. */
export function makePlanteOrder(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plante-ordre", () => {
    const sequence = ["la racine", "la tige", "la feuille"];
    return {
      type: "order",
      prompt: "Mets les parties de la plante dans l'ordre du bas vers le haut.",
      payload: { correctSequence: sequence, game: originOf("plante-ordre", ctx), concept: PLANTE_CONCEPT },
      answerKey: sequence.join(", "),
      hints: [
        "Pense à une plante dans la terre.",
        "Ce qui est dans le sol est tout en bas.",
        "Les feuilles sont tout en haut, au bout de la tige.",
      ],
    };
  });
}

/** Une phrase à trou des plantes, avec ce qu'elle apprend (voir `PartClue`). */
type PlantGap = Gap & { fact: string };

export const PLANTE_GAPS: readonly PlantGap[] = [
  { fact: "fruit-se-mange", text: "La mangue est ___ du manguier.", answer: "le fruit", wrong: ["la racine", "la feuille"], hint: "C'est la partie sucrée qu'on cueille sur l'arbre." },
  { fact: "racine-sous-terre", text: "Sous la terre, il y a ___ du manguier.", answer: "la racine", wrong: ["la feuille", "le fruit"], hint: "On ne la voit pas, elle boit l'eau du sol." },
  { fact: "manguier-mangue", text: "Le manguier donne ___.", answer: "la mangue", wrong: ["l'arachide", "le fruit du baobab"], hint: "C'est un fruit sucré, jaune et rouge quand il est mûr." },
  { fact: "arachide-sous-terre", text: "L'arachide pousse ___.", answer: "sous la terre", wrong: ["sur un arbre", "dans l'eau"], hint: "On l'arrache du sol, avec toute la plante." },
  { fact: "champ", text: "Le mil et l'arachide poussent dans ___.", answer: "le champ", wrong: ["la mer", "la forêt"], hint: "C'est la terre que le paysan a travaillée." },
];

/** « La mangue est ___ du manguier. » : le mot juste parmi trois, deux qui ne vont pas dans la phrase. */
export function makePlanteGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plante-trou", () => {
    const gap = pickFresh(ctx, PLANTE_GAPS, (candidate) => planteKey(candidate.fact));
    return gapGame("plante-trou", ctx, gap, PLANTE_CONCEPT);
  });
}
