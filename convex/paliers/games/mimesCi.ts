/**
 * LES GABARITS DES MIMES ET DES ÉMOTIONS DU CI (`ar-ci-mimes`).
 *
 * Cette thématique n'avait aucun jeu : le modèle écrivait ses dix exercices. Sur les seize exercices d'arts du CI relus
 * le 19 octobre 2026, cinq étaient faux. Dans l'export de la production, « Mimes et émotions » demandait de mettre des
 * émotions « dans l'ordre de l'histoire » (aucun ordre n'existe), de relier « Colère » à « Quand on perd un jeu » (on
 * peut y être triste), de choisir « Rester immobile » pour la peur (on peut aussi fuir) et de relier des métiers à des verbes. Ici
 * chaque réponse se lit dans un tableau : un visage et son émotion, une situation que tout enfant ressent de la même
 * façon, un geste, le cri d'un animal.
 *
 * LES TUILES. Un visage est un émoji seul : la voix n'a rien à en dire, l'enfant le reconnaît. Une émotion est un nom
 * sans article (« Joie », comme à la démonstration de la page d'accueil) : « la joie » aurait la forme d'une chose
 * sans dessin au catalogue. Une tuile de geste est un émoji puis au moins quatre mots, sinon l'écran donnerait le
 * dessin de l'émoji de tête. Le dessin d'un animal est celui du catalogue (`lib/item-images.ts`), avec son article.
 * Aucun émoji n'est d'Unicode 12 ou plus, aucun n'est suivi d'un sélecteur de variation.
 *
 * CE QUE LES TABLEAUX NE DISENT PAS, ON NE LE DEMANDE PAS
 * - La peur et la surprise ne se côtoient jamais dans un même exercice : sur un visage, les yeux grands ouverts
 *   disent les deux. La tristesse et la colère ne se côtoient jamais dans les choix d'une situation : perdre un jeu,
 *   c'est l'une ou l'autre.
 * - Aucune situation de surprise : elle est presque toujours aussi de la joie ou de la peur.
 * - Pas de métier à deviner : le catalogue n'a pas de dessin de métier, et une tuile qui le nommerait sans image
 *   romprait la règle des images du CI.
 * - Les verbes des phrases à trou sont à la première personne, qui ne change pas avec le genre de l'enfant ; aucun
 *   mauvais choix ne peut être le bon (« pleurer de joie » existe, on ne le propose pas).
 *
 * LA MÊME QUESTION DEUX FOIS, NON. Un gabarit qui a peu de variantes donne à chaque niveau (donc à chaque palier de la
 * thématique) sa part : trois paliers ne répètent jamais la même question. Les associations vont plus loin : chaque
 * niveau a ses visages (`LINK_FACES`) et ses animaux (`CRY_WINDOWS`), donc deux paliers ne relient jamais plus d'une même
 * paire. Et dans un palier, les cinq exercices à une seule émotion (visage à trouver, émotion d'un visage, d'une
 * situation, geste, phrase à trou) prennent chacun l'une des émotions les moins prises : aucune n'y revient trois fois.
 *
 * RÈGLES POUR AJOUTER UNE ÉMOTION OU UN GESTE
 * - Une seule émotion, sans doute possible, pour un enfant de six ans. Le visage est un émoji d'Unicode 11 au plus.
 * - Un geste a au moins quatre mots après son émoji, et son émoji n'est pas un visage de l'émotion qu'il désigne.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, et vingt mots au plus (la consigne du CI).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, pick, pickFresh, shuffle, takeFresh, type GameContext, type GeneratedGame } from "./shared";
import { linkKey } from "./anglais";
import { byLevel, choiceGame, gapGame, itemsKey, linkGame, sortGame, type Gap } from "./ciTiles";
import { variantsForLevel } from "./tableaux";

export type Emotion = "joie" | "tristesse" | "colère" | "peur" | "surprise";

const EMOTIONS: readonly Emotion[] = ["joie", "tristesse", "colère", "peur", "surprise"];
/** Les trois émotions du premier palier : celles qu'un visage ne laisse pas confondre. */
const EASY_EMOTIONS: readonly Emotion[] = ["joie", "tristesse", "colère"];

/** Le nom d'une émotion sur une tuile : sans article. */
export const EMOTION_NAMES: Record<Emotion, string> = {
  joie: "Joie",
  tristesse: "Tristesse",
  colère: "Colère",
  peur: "Peur",
  surprise: "Surprise",
};

/** Avec son article, pour les énoncés. */
export const EMOTION_THE: Record<Emotion, string> = {
  joie: "la joie",
  tristesse: "la tristesse",
  colère: "la colère",
  peur: "la peur",
  surprise: "la surprise",
};

/** Un visage et l'émotion qu'il montre, rangés pour que chaque tiers (un par niveau) montre des émotions variées. */
export type Face = { face: string; emotion: Emotion };
export const FACES: readonly Face[] = [
  { face: "😀", emotion: "joie" },
  { face: "😢", emotion: "tristesse" },
  { face: "😠", emotion: "colère" },
  { face: "😊", emotion: "joie" },
  { face: "😭", emotion: "tristesse" },
  { face: "😡", emotion: "colère" },
  { face: "😨", emotion: "peur" },
  { face: "😲", emotion: "surprise" },
  { face: "😱", emotion: "peur" },
  { face: "😮", emotion: "surprise" },
  { face: "😄", emotion: "joie" },
];

const facesOf = (emotion: Emotion) => FACES.filter((face) => face.emotion === emotion);
const visageKey = (face: Face) => `visage:${face.face}`;

/** Ce qu'on voit sur le visage, sans nommer l'émotion. */
export const EMOTION_CLUES: Record<Emotion, string> = {
  joie: "Un visage joyeux a la bouche qui sourit.",
  tristesse: "Un visage triste a des larmes ou la bouche qui tombe.",
  colère: "Un visage fâché a les sourcils froncés.",
  peur: "Un visage effrayé a les yeux grands ouverts et la bouche tendue.",
  surprise: "Un visage étonné a la bouche et les yeux grands ouverts.",
};

/** Deux émotions qu'un visage ne distingue pas assez : jamais ensemble dans un exercice. */
const NEAR_FACES: Record<Emotion, readonly Emotion[]> = { joie: [], tristesse: [], colère: [], peur: ["surprise"], surprise: ["peur"] };
/** Deux émotions qu'une situation ne distingue pas : jamais ensemble dans les choix. */
const NEAR_SITUATIONS: Record<Emotion, readonly Emotion[]> = {
  joie: ["surprise"],
  tristesse: ["colère"],
  colère: ["tristesse"],
  peur: ["surprise"],
  surprise: ["peur", "joie"],
};

const MIMES_CONCEPT = "reconnaître les émotions sur un visage, dans une situation et dans un geste";
const CRIS_CONCEPT = "imiter les animaux : reconnaître leur cri";

// ---------------------------------------------------------------------------
// Les visages
// ---------------------------------------------------------------------------

/** Jusqu'à trois émotions différentes de `pool`, jamais la peur avec la surprise. */
function threeEmotions(ctx: GameContext, pool: readonly Emotion[]): Emotion[] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const picked = shuffle(ctx.rng, pool).slice(0, 3);
    if (!(picked.includes("peur") && picked.includes("surprise"))) return picked;
  }
  return ["joie", "tristesse", "colère"];
}

/** Deux émotions différentes de `pool`, jamais la peur avec la surprise : les mauvais choix d'une question. */
const twoOthers = (ctx: GameContext, pool: readonly Emotion[]): Emotion[] => threeEmotions(ctx, pool).slice(0, 2);

/**
 * Les paires de cases du premier palier : deux émotions que tout enfant distingue. Le palier en montre deux, jamais la même
 * paire, et deux paires de trois émotions se croisent toujours : elles partagent la joie, qui a trois visages, plutôt que la
 * colère ou la tristesse, qui n'en ont que deux et se verraient en entier deux fois.
 */
const EASY_PAIRS: readonly (readonly Emotion[])[] = [
  ["joie", "tristesse"],
  ["joie", "colère"],
];

/** Les émotions des cases de « Glisse chaque visage dans la bonne case. », par niveau. */
function sortEmotions(ctx: GameContext): Emotion[] {
  if (ctx.level === 1) return [...pickFresh(ctx, EASY_PAIRS, (pair) => `visage-cases:${pair.join("+")}`)];
  if (ctx.level === 2) return ["joie", "tristesse", "colère"];
  return ["tristesse", "colère", ctx.rng() < 0.5 ? "peur" : "surprise"];
}

/**
 * « Glisse chaque visage dans la bonne case. » : quatre visages, cinq aux deux derniers niveaux, sous deux ou trois
 * émotions. Chaque case reçoit au moins un visage.
 */
export function makeVisageSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "visage-glisser",
    () => {
      const zones = sortEmotions(ctx);
      const total = ctx.level <= 2 ? 4 : 5;
      const counts = new Map<Emotion, number>(zones.map((emotion): [Emotion, number] => [emotion, 1]));
      for (const emotion of shuffle(ctx.rng, zones).slice(0, total - zones.length)) counts.set(emotion, 2);
      const items = shuffle(
        ctx.rng,
        zones.flatMap((emotion) =>
          takeFresh(ctx, facesOf(emotion), counts.get(emotion) as number, visageKey).map((face) => ({
            text: face.face,
            correctZone: EMOTION_NAMES[emotion],
          })),
        ),
      );
      return sortGame(
        "visage-glisser",
        ctx,
        "Glisse chaque visage dans la bonne case.",
        zones.map((emotion) => EMOTION_NAMES[emotion]),
        items,
        MIMES_CONCEPT,
        [
          "Regarde la bouche et les yeux de chaque visage.",
          zones
            .slice(0, 2)
            .map((emotion) => EMOTION_CLUES[emotion])
            .join(" "),
          "Pose d'abord les visages dont tu es sûr.",
        ],
      );
    },
    itemsKey,
  );
}

/** Les émotions de « Quel visage montre … ? » et de « Que fais-tu quand … ? », par niveau : une part chacun, jamais la même deux fois. */
const ASKED: readonly [readonly Emotion[], readonly Emotion[], readonly Emotion[]] = [["joie", "tristesse"], ["colère", "peur"], ["surprise"]];

/**
 * Combien d'exercices à une seule émotion (le visage à trouver, l'émotion d'un visage ou d'une situation, le geste, la phrase
 * à trou) ont déjà pris cette émotion dans ce palier. Chacun prend l'une des moins prises : le palier répartit ses émotions
 * au lieu d'en entasser quatre sur la tristesse.
 */
const emotionLoad = (ctx: GameContext, emotion: Emotion) => [...ctx.used].filter((key) => key.startsWith(`demandee:${emotion}#`)).length;

/** Une des émotions de `emotions` les moins prises jusqu'ici dans ce palier, qu'elle compte désormais. */
function lightestEmotion(ctx: GameContext, emotions: readonly Emotion[]): Emotion {
  const candidates = [...new Set(emotions)];
  const least = Math.min(...candidates.map((emotion) => emotionLoad(ctx, emotion)));
  const chosen = pick(ctx.rng, candidates.filter((emotion) => emotionLoad(ctx, emotion) === least));
  ctx.used.add(`demandee:${chosen}#${least + 1}`);
  return chosen;
}

/** « Quel visage montre la colère ? » : le visage de l'émotion parmi trois visages d'émotions différentes. */
export function makeVisageWhich(ctx: GameContext): GeneratedGame {
  // L'émotion se prend une fois, avant `fresh` : un tirage refait ne la compterait pas deux fois.
  const asked = lightestEmotion(ctx, byLevel(ctx.level, ASKED[0], ASKED[1], ASKED[2]));
  return fresh(ctx, "visage-quel", () => {
    const answer = pickFresh(ctx, facesOf(asked), visageKey);
    const pool = (ctx.level === 1 ? EASY_EMOTIONS : EMOTIONS).filter((emotion) => emotion !== asked && !NEAR_FACES[asked].includes(emotion));
    const others = twoOthers(ctx, pool).map((emotion) => takeFresh(ctx, facesOf(emotion), 1, visageKey)[0].face);
    return choiceGame("visage-quel", ctx, `Quel visage montre ${EMOTION_THE[asked]} ?`, answer.face, others, MIMES_CONCEPT, [
      "Regarde la bouche et les yeux de chaque visage.",
      EMOTION_CLUES[asked],
      "Écarte les visages qui ne montrent pas cette émotion.",
    ]);
  });
}

/** « Quelle émotion montre ce visage ? » : l'émotion d'un visage parmi trois noms d'émotions. */
export function makeVisageEmotion(ctx: GameContext): GeneratedGame {
  const candidates = variantsForLevel(FACES, ctx.level);
  const emotion = lightestEmotion(ctx, candidates.map((face) => face.emotion));
  return fresh(ctx, "visage-emotion", () => {
    const shown = pickFresh(ctx, candidates.filter((face) => face.emotion === emotion), visageKey);
    const pool = (ctx.level === 1 ? EASY_EMOTIONS : EMOTIONS).filter(
      (emotion) => emotion !== shown.emotion && !NEAR_FACES[shown.emotion].includes(emotion),
    );
    const others = twoOthers(ctx, pool).map((emotion) => EMOTION_NAMES[emotion]);
    return choiceGame(
      "visage-emotion",
      ctx,
      `Quelle émotion montre ce visage ?\n${shown.face}`,
      EMOTION_NAMES[shown.emotion],
      others,
      MIMES_CONCEPT,
      ["Regarde la bouche et les yeux du visage.", EMOTION_CLUES[shown.emotion], "Écarte les émotions qui ne vont pas avec ce visage."],
    );
  });
}

/**
 * Les visages que « Relie chaque visage à son émotion. » montre à chaque niveau. Aucun visage n'est à deux niveaux, sauf la
 * colère du dernier, qui reprend celle du premier : deux paliers ne partagent jamais plus d'une paire, et aucune paire n'est
 * aux trois paliers. Le dernier niveau n'a pas la peur : elle ne va pas avec la surprise.
 */
const LINK_FACES: readonly [readonly string[], readonly string[], readonly string[]] = [
  ["😀", "😢", "😠"],
  ["😊", "😭", "😡", "😨"],
  ["😄", "😲", "😮", "😠"],
];

/** « Relie chaque visage à son émotion. » : trois visages, trois émotions différentes, celles du niveau. */
export function makeVisageLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "visage-relier",
    () => {
      const shown = byLevel(ctx.level, LINK_FACES[0], LINK_FACES[1], LINK_FACES[2]);
      const allowed = FACES.filter((face) => shown.includes(face.face));
      const emotions = threeEmotions(ctx, [...new Set(allowed.map((face) => face.emotion))]);
      const pairs = emotions.map((emotion) => ({
        left: takeFresh(ctx, allowed.filter((face) => face.emotion === emotion), 1, visageKey)[0].face,
        right: EMOTION_NAMES[emotion],
      }));
      return linkGame("visage-relier", ctx, "Relie chaque visage à son émotion.", pairs, MIMES_CONCEPT, [
        "Regarde la bouche et les yeux de chaque visage.",
        "Commence par le visage dont tu es sûr.",
        "Il reste une émotion pour le dernier visage.",
      ]);
    },
    linkKey,
  );
}

// ---------------------------------------------------------------------------
// Les situations et les gestes
// ---------------------------------------------------------------------------

/** Le choix d'une émotion sur une tuile : le visage, puis son nom. */
export const emotionTile = (emotion: Emotion) => `${facesOf(emotion)[0].face} ${EMOTION_NAMES[emotion]}`;

/** Une situation et l'émotion que tout enfant y ressent. */
export type Situation = { emotion: Emotion; text: string };

/** Rangées pour que chaque niveau montre des émotions variées. Aucune situation de surprise. */
export const SITUATIONS: readonly Situation[] = [
  { emotion: "joie", text: "Tu reçois un beau cadeau." },
  { emotion: "tristesse", text: "Tu perds ton jouet préféré." },
  { emotion: "colère", text: "Un enfant casse ton jouet exprès." },
  { emotion: "peur", text: "Tu entends un grand bruit dans le noir." },
  { emotion: "joie", text: "Tu joues avec tous tes amis." },
  { emotion: "tristesse", text: "Ton meilleur ami part très loin." },
  { emotion: "colère", text: "Un enfant te pousse exprès." },
  { emotion: "peur", text: "Un gros chien aboie près de toi." },
];

/** Ce qu'on ressent, sans nommer l'émotion. */
export const SITUATION_CLUES: Record<Emotion, string> = {
  joie: "Quand on est content, on sourit et on a envie de sauter.",
  tristesse: "Quand on a du chagrin, on a envie de pleurer.",
  colère: "Quand on est très fâché, on serre les poings.",
  peur: "Quand quelque chose nous effraie, on se cache et on tremble.",
  surprise: "Quand on est étonné, on ouvre grand les yeux.",
};

/** « Tu reçois un beau cadeau. Que ressens-tu ? » : l'émotion de la situation parmi trois visages nommés. */
export function makeEmotionSituation(ctx: GameContext): GeneratedGame {
  const candidates = variantsForLevel(SITUATIONS, ctx.level);
  const emotion = lightestEmotion(ctx, candidates.map((row) => row.emotion));
  return fresh(
    ctx,
    "emotion-situation",
    () => {
      const situation = pickFresh(ctx, candidates.filter((row) => row.emotion === emotion), (row) => `situation:${row.text}`);
      const others = (["joie", "tristesse", "colère", "peur"] as Emotion[]).filter(
        (emotion) => emotion !== situation.emotion && !NEAR_SITUATIONS[situation.emotion].includes(emotion),
      );
      return choiceGame(
        "emotion-situation",
        ctx,
        `${situation.text} Que ressens-tu ?`,
        emotionTile(situation.emotion),
        shuffle(ctx.rng, others).slice(0, 2).map(emotionTile),
        MIMES_CONCEPT,
        ["Imagine que cela t'arrive vraiment.", SITUATION_CLUES[situation.emotion], "Écarte les visages qui ne vont pas avec ce qui arrive."],
      );
    },
    (game) => String(game.prompt),
  );
}

/** Le geste de chaque émotion : un émoji qui n'est pas un visage, puis au moins quatre mots. */
export const GESTURES: Record<Emotion, string> = {
  joie: "🕺 Je souris et je saute de joie",
  tristesse: "💧 Je pleure et je baisse la tête",
  colère: "👊 Je serre les poings et je tape du pied",
  peur: "🙈 Je me cache et je tremble",
  surprise: "👀 J'ouvre grand la bouche et les yeux",
};

/** « Que fais-tu quand tu ressens de la joie ? » : le geste de l'émotion parmi trois gestes. */
export function makeEmotionGesture(ctx: GameContext): GeneratedGame {
  const asked = lightestEmotion(ctx, byLevel(ctx.level, ASKED[0], ASKED[1], ASKED[2]));
  return fresh(ctx, "emotion-geste", () => {
    const pool = EMOTIONS.filter((emotion) => emotion !== asked && !NEAR_FACES[asked].includes(emotion));
    return choiceGame(
      "emotion-geste",
      ctx,
      `Que fais-tu quand tu ressens de ${EMOTION_THE[asked]} ?`,
      GESTURES[asked],
      twoOthers(ctx, pool).map((emotion) => GESTURES[emotion]),
      MIMES_CONCEPT,
      [
        "Imagine que tu ressens cela vraiment.",
        "Pense à ce que ton corps fait quand tu ressens cela.",
        "Écarte les gestes qui ne vont pas avec cette émotion.",
      ],
    );
  });
}

// ---------------------------------------------------------------------------
// Les animaux que l'on imite
// ---------------------------------------------------------------------------

/** Un animal, son cri en français, et un indice qui ne le nomme pas. */
export type AnimalCry = { animal: string; cry: string; hint: string };

/** Rangés pour que chaque tiers (un par niveau) montre des animaux variés. */
export const ANIMAL_CRIES: readonly AnimalCry[] = [
  { animal: "le chat", cry: "miaou", hint: "Cet animal vit souvent dans la maison et chasse les souris." },
  { animal: "la vache", cry: "meuh", hint: "Cet animal nous donne du lait." },
  { animal: "le chien", cry: "ouaf ouaf", hint: "Cet animal garde la maison." },
  { animal: "la poule", cry: "cot cot", hint: "Cet animal pond des œufs." },
  { animal: "le mouton", cry: "bê bê", hint: "Cet animal vit à la ferme et mange de l'herbe." },
  { animal: "l'âne", cry: "hi-han", hint: "Cet animal a de très grandes oreilles." },
  { animal: "le poussin", cry: "piou piou", hint: "Cet animal est tout petit et tout jaune." },
];

const cryKey = (cry: AnimalCry) => `cri:${cry.animal}`;

/** « Quel animal fait miaou ? » : l'animal de ce cri parmi trois dessins. */
export function makeCriAnimal(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cri-animal", () => {
    const cry = pickFresh(ctx, variantsForLevel(ANIMAL_CRIES, ctx.level), cryKey);
    const others = takeFresh(
      ctx,
      ANIMAL_CRIES.filter((row) => row.animal !== cry.animal),
      2,
      cryKey,
    ).map((row) => row.animal);
    return choiceGame("cri-animal", ctx, `Quel animal fait ${cry.cry} ?`, cry.animal, others, CRIS_CONCEPT, [
      "Écoute le cri dans ta tête.",
      cry.hint,
      "Écarte les animaux qui ne font pas ce bruit.",
    ]);
  });
}

/**
 * Les animaux de « Relie chaque animal à son cri. » à chaque niveau, par rang dans `ANIMAL_CRIES` : trois chacun, un seul en
 * commun avec le niveau voisin (le chien, le mouton), aucun aux trois niveaux. Le premier n'a que les quatre premiers.
 */
const CRY_WINDOWS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [2, 3, 4],
  [4, 5, 6],
];

/** « Relie chaque animal à son cri. » : trois animaux, trois cris, ceux du niveau. */
export function makeCriLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "cri-relier",
    () => {
      const window = byLevel(ctx.level, CRY_WINDOWS[0], CRY_WINDOWS[1], CRY_WINDOWS[2]);
      const rows = takeFresh(ctx, window.map((rank) => ANIMAL_CRIES[rank]), 3, cryKey);
      return linkGame(
        "cri-relier",
        ctx,
        "Relie chaque animal à son cri.",
        rows.map((row) => ({ left: row.animal, right: row.cry })),
        CRIS_CONCEPT,
        [
          "Écoute dans ta tête le cri de chaque animal.",
          "Commence par l'animal dont tu connais le cri.",
          "Il reste un cri pour le dernier animal.",
        ],
      );
    },
    linkKey,
  );
}

// ---------------------------------------------------------------------------
// Les phrases à trou
// ---------------------------------------------------------------------------

/**
 * Les phrases à trou des émotions : un verbe à la première personne, ou un clown qui fait rire, et l'émotion qu'elles disent.
 * Une, deux, puis deux par niveau.
 */
export const EMOTION_GAPS: readonly (Gap & { emotion: Emotion })[] = [
  { text: "Quand je suis triste, je ___.", answer: "pleure", wrong: ["saute", "danse"], hint: "Une personne triste a souvent des larmes.", emotion: "tristesse" },
  { text: "Quand j'ai peur, je ___.", answer: "tremble", wrong: ["danse", "mange"], hint: "Quand on a très peur, tout le corps bouge tout seul.", emotion: "peur" },
  { text: "Quand je suis en colère, je ___.", answer: "crie", wrong: ["dors", "danse"], hint: "Quand on est très fâché, on parle très fort.", emotion: "colère" },
  {
    text: "Quand on me donne un beau cadeau, je ___ de joie.",
    answer: "saute",
    wrong: ["dors", "mange"],
    hint: "Un beau cadeau nous rend content, et tout le corps bouge.",
    emotion: "joie",
  },
  { text: "Le clown me fait ___.", answer: "rire", wrong: ["dormir", "manger"], hint: "Un clown fait des grimaces drôles.", emotion: "joie" },
];

/** « Quand je suis triste, je ___. » : le verbe de l'émotion dans le trou. */
export function makeEmotionGap(ctx: GameContext): GeneratedGame {
  const candidates = variantsForLevel(EMOTION_GAPS, ctx.level);
  const emotion = lightestEmotion(ctx, candidates.map((row) => row.emotion));
  return fresh(
    ctx,
    "emotion-trou",
    () => {
      const gap = pickFresh(ctx, candidates.filter((row) => row.emotion === emotion), (row) => `emotion-trou:${row.text}`);
      return gapGame("emotion-trou", ctx, gap, MIMES_CONCEPT);
    },
    // La phrase qu'on lit fait l'identité : la même phrase avec une autre réponse serait la même question.
    (game) => String(game.payload.text),
  );
}
