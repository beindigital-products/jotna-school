/**
 * LES GABARITS DE LECTURE DU CP : lire des mots de deux ou trois syllabes, les assembler, distinguer des
 * sons proches (`fr-cp-lecture`).
 *
 * Le modèle écrivait « Quel mot a le son 'ou' ? » avec « bateau » pour réponse, « Écris le mot 'mouton' »
 * (le mot est dans l'énoncé), « Associe chaque aliment à sa couleur » avec deux fois « rouge » : des
 * exercices qui ne font pas lire. Ici chaque mot vient d'un tableau fermé (le mot, ses syllabes, son dessin),
 * et chaque réponse se lit dans ce tableau : le dessin donne le mot, les syllabes se recollent, le son se
 * vérifie sur l'orthographe.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les mots du quotidien de la fiche (mouton, bateau, tomate, savon, poulet, marmite, malade) et des mots
 *   de même famille, tous de deux ou trois syllabes, tous écrits avec les sons que l'enfant a vus au CI.
 * - Les sons proches de la fiche : é et è, ou et u, on et o ; et les lettres que l'on confond, b, d et p.
 * - Un son se reconnaît à l'ORTHOGRAPHE (`sounds.ts` pour é, è, ou, u ; `hasNasalOn` et `hasPlainO` ici) : un
 *   mot dont l'orthographe est douteuse n'est jamais un mauvais choix (« poulet » finit par le son è et
 *   s'écrit « et » : on ne l'offre pas quand la question porte sur é ou è).
 *
 * RÈGLES POUR AJOUTER UN MOT
 * - Ses syllabes recollées font le mot, sans un caractère de plus. Son dessin (émoji Unicode 11 au plus,
 *   jamais suivi de U+FE0F) ne montre que lui : « poule » et « poulet » ne sont jamais ensemble.
 * - Un mot dont une syllabe se répète (bonbon, bébé) n'entre ni dans « remets les syllabes » ni dans
 *   « assemble » : deux tuiles identiques ne se rangent pas.
 * - Une étiquette est un mot SEUL, sans article : au CI, une tuile « article + un nom » doit avoir son image
 *   au catalogue (`lib/item-images.ts`). Ces gabarits ne sont câblés qu'au CP, mais le CI les joue aussi
 *   dans les tests.
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe
 *   droite, et vingt-huit mots au plus (la consigne du CP). Aucun indice n'écrit le mot de la réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { genderOf } from "../genders";
import { hasSound, type KnownSound } from "../sounds";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";

// ===========================================================================
// LES MOTS
// ===========================================================================

type ReadingWord = {
  word: string;
  /** Les syllabes, dans l'ordre : recollées, elles font `word`. */
  syllables: readonly string[];
  /** Son dessin, quand un émoji sûr le montre. */
  emoji?: string;
};

export const READING_WORDS: readonly ReadingWord[] = [
  { word: "mouton", syllables: ["mou", "ton"], emoji: "🐑" },
  { word: "bateau", syllables: ["ba", "teau"], emoji: "⛵" },
  { word: "tomate", syllables: ["to", "ma", "te"], emoji: "🍅" },
  { word: "savon", syllables: ["sa", "von"], emoji: "🧼" },
  { word: "poulet", syllables: ["pou", "let"], emoji: "🍗" },
  { word: "marmite", syllables: ["mar", "mi", "te"], emoji: "🍲" },
  { word: "malade", syllables: ["ma", "la", "de"], emoji: "🤒" },
  { word: "lune", syllables: ["lu", "ne"], emoji: "🌙" },
  { word: "robe", syllables: ["ro", "be"], emoji: "👗" },
  { word: "ballon", syllables: ["bal", "lon"], emoji: "⚽" },
  { word: "banane", syllables: ["ba", "na", "ne"], emoji: "🍌" },
  { word: "radio", syllables: ["ra", "di", "o"], emoji: "📻" },
  { word: "poule", syllables: ["pou", "le"], emoji: "🐔" },
  { word: "vélo", syllables: ["vé", "lo"], emoji: "🚲" },
  { word: "lapin", syllables: ["la", "pin"], emoji: "🐇" },
  { word: "bonbon", syllables: ["bon", "bon"], emoji: "🍬" },
  { word: "tortue", syllables: ["tor", "tue"], emoji: "🐢" },
  { word: "girafe", syllables: ["gi", "ra", "fe"], emoji: "🦒" },
  { word: "ananas", syllables: ["a", "na", "nas"], emoji: "🍍" },
  { word: "mangue", syllables: ["man", "gue"], emoji: "🥭" },
  { word: "soupe", syllables: ["sou", "pe"], emoji: "🥣" },
  { word: "bébé", syllables: ["bé", "bé"], emoji: "👶" },
  // Sans dessin sûr : ils ne servent qu'aux sons et aux lettres.
  { word: "café", syllables: ["ca", "fé"] },
  { word: "été", syllables: ["é", "té"] },
  { word: "fumée", syllables: ["fu", "mée"] },
  { word: "père", syllables: ["pè", "re"] },
  { word: "mère", syllables: ["mè", "re"] },
  { word: "moto", syllables: ["mo", "to"] },
  { word: "dodo", syllables: ["do", "do"] },
  { word: "salon", syllables: ["sa", "lon"] },
  { word: "jupe", syllables: ["ju", "pe"] },
  { word: "sucre", syllables: ["su", "cre"] },
  { word: "papa", syllables: ["pa", "pa"] },
  { word: "dent", syllables: ["dent"] },
  { word: "pain", syllables: ["pain"] },
];

const PICTURED = READING_WORDS.filter((entry) => entry.emoji);
/** Deux syllabes différentes au moins : on peut les mélanger sans les confondre, puis écrire le mot. */
const ASSEMBLABLE = PICTURED.filter((entry) => entry.syllables.length >= 2 && new Set(entry.syllables).size === entry.syllables.length);
/** Trois syllabes au moins : avec deux tuiles seulement, l'enfant a une chance sur deux (le contrôleur le signale). */
const ORDERABLE = ASSEMBLABLE.filter((entry) => entry.syllables.length >= 3);

/** Deux mots dont le dessin pourrait être pris l'un pour l'autre : jamais ensemble dans un même exercice. */
const LOOK_ALIKE: readonly (readonly [string, string])[] = [["poule", "poulet"]];
const together = (a: ReadingWord, b: ReadingWord) =>
  !LOOK_ALIKE.some(([x, y]) => (a.word === x && b.word === y) || (a.word === y && b.word === x));

/** Un son nasal « on » : « on » devant une consonne ou à la fin du mot (mouton, ballon, bonbon), pas « on » devant une voyelle. */
export const hasNasalOn = (word: string) => /on(?![aeiouyéèêâîôûhnm])/u.test(word);

/** Un « o » simple : moto, robe, tomate. Jamais le « o » de « ou » ni de « on ». */
export const hasPlainO = (word: string) =>
  word.replace(/ou/gu, "").replace(/o[nm](?![aeiouyéèêâîôûh])/gu, "").includes("o");

const withFirstLetter = (letter: string) => READING_WORDS.filter((entry) => entry.word.startsWith(letter));

/** Les mots d'un exercice : le bon mot et deux mots qui ne se confondent pas avec lui. */
function wrongWords(ctx: GameContext, answer: ReadingWord, pool: readonly ReadingWord[]): ReadingWord[] {
  const allowed = pool.filter((entry) => entry.word !== answer.word && together(answer, entry));
  const sameStart = allowed.filter((entry) => entry.word[0] === answer.word[0]);
  const ordered =
    ctx.level >= 2
      ? [...shuffle(ctx.rng, sameStart), ...shuffle(ctx.rng, allowed.filter((entry) => !sameStart.includes(entry)))]
      : shuffle(
          ctx.rng,
          allowed.filter((entry) => entry.word[0] !== answer.word[0]),
        );
  const picked: ReadingWord[] = [];
  for (const entry of ordered) {
    if (picked.length === 2) break;
    if (picked.every((other) => together(other, entry))) picked.push(entry);
  }
  return picked;
}

const startsHint = (entry: ReadingWord) => `Le mot commence par la lettre ${entry.word[0]}.`;

// ===========================================================================
// LIRE UN MOT ET LE DESSIN
// ===========================================================================

/** « Quel mot va avec ce dessin ? » : le dessin sur sa propre ligne, trois mots à lire. */
export function makeReadPicture(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-dessin", () => {
    const answer = pickFresh(ctx, PICTURED, (entry) => `lire:${entry.word}`);
    const options = shuffle(
      ctx.rng,
      [answer, ...wrongWords(ctx, answer, PICTURED)].map((entry) => entry.word),
    );
    return {
      type: "qcm",
      prompt: `Quel mot va avec ce dessin ?\n${answer.emoji}`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.word),
        game: originOf("lire-dessin", ctx),
        concept: "lire un mot et le relier à son dessin",
      },
      answerKey: answer.word,
      hints: ["Regarde bien le dessin.", "Lis chaque mot doucement, syllabe après syllabe.", startsHint(answer)],
    };
  });
}

/** « Relie chaque mot à son dessin. » : trois à cinq paires, jamais deux dessins qui se ressemblent. */
export function makeReadLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "lire-relier",
    () => {
      const count = Math.min(PICTURED.length, ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5);
      const chosen: ReadingWord[] = [];
      for (const entry of shuffle(ctx.rng, PICTURED)) {
        if (chosen.length === count) break;
        if (chosen.every((other) => together(other, entry))) chosen.push(entry);
      }
      const pairs = chosen.map((entry) => ({ left: entry.word, right: entry.emoji as string }));
      return {
        type: "match",
        prompt: "Relie chaque mot à son dessin.",
        payload: { pairs, game: originOf("lire-relier", ctx), concept: "lire un mot et le relier à son dessin" },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Lis les mots l'un après l'autre, doucement.",
          "Regarde chaque dessin et dis son nom dans ta tête.",
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

// ===========================================================================
// LES SYLLABES
// ===========================================================================

/** « Remets les syllabes dans l'ordre pour écrire le mot de ce dessin. » */
export function makeReadSyllables(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-syllabes", () => {
    const entry = pickFresh(ctx, ORDERABLE, (candidate) => `lire:${candidate.word}`);
    return {
      type: "order",
      prompt: `Remets les syllabes dans l'ordre pour écrire le mot de ce dessin.\n${entry.emoji}`,
      payload: {
        correctSequence: [...entry.syllables],
        game: originOf("lire-syllabes", ctx),
        concept: "assembler les syllabes d'un mot",
      },
      answerKey: entry.word,
      hints: [
        "Regarde le dessin et dis son nom lentement.",
        "Dis le mot en le coupant en morceaux, un morceau à chaque frappe dans les mains.",
        `Le premier morceau commence par la lettre ${entry.syllables[0][0]}.`,
      ],
    };
  });
}

/** Les syllabes dans un autre ordre que celui du mot. */
function scrambled(ctx: GameContext, syllables: readonly string[]): string[] {
  for (let attempt = 0; attempt < 12; attempt++) {
    const mixed = shuffle(ctx.rng, syllables);
    if (mixed.join("-") !== syllables.join("-")) return mixed;
  }
  return [...syllables].reverse();
}

/** « Assemble les syllabes la - ma - de pour écrire le mot de ce dessin. » : les syllabes, mélangées, dans la phrase. */
export function makeReadAssemble(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-assembler", () => {
    const entry = pickFresh(ctx, ASSEMBLABLE, (candidate) => `lire:${candidate.word}`);
    const mixed = scrambled(ctx, entry.syllables);
    return {
      type: "short-answer",
      prompt: `Assemble les syllabes ${mixed.join(" - ")} pour écrire le mot de ce dessin.\n${entry.emoji}`,
      payload: {
        acceptedAnswers: [entry.word],
        game: originOf("lire-assembler", ctx),
        concept: "assembler les syllabes d'un mot",
      },
      answerKey: entry.word,
      hints: [
        "Regarde le dessin et dis son nom lentement.",
        "Essaie les syllabes dans un autre ordre, jusqu'à entendre le mot du dessin.",
        startsHint(entry),
      ],
    };
  });
}

// ===========================================================================
// LES SONS PROCHES ET LES LETTRES QU'ON CONFOND
// ===========================================================================

type SoundPair = {
  /** Le son demandé, écrit comme dans la consigne. */
  sound: string;
  has: (word: string) => boolean;
  /** Le son avec lequel on le confond : ses mots sont les mauvais choix. */
  versus: string;
  hasVersus: (word: string) => boolean;
  /** Les mots que la question n'offre jamais (le son s'y entend sans s'y lire). */
  ambiguous?: (word: string) => boolean;
};

const soundOf = (sound: KnownSound) => (word: string) => hasSound(word, sound);
const eitherAccent = (word: string) => hasSound(word, "é") || hasSound(word, "è");
/** « et » et « ai » font entendre le son è sans l'écrire : ces mots ne sont jamais offerts pour é ou è. */
const hearsE = (word: string) => /et$|ai/u.test(word);
/** « au » et « eau » font entendre le son o : le mot n'a pas la lettre o seule, mais l'enfant l'entend. */
const hearsO = (word: string) => /au|eau/u.test(word);

/**
 * Les trois paires de sons proches de la fiche. Les mots d'une paire sont ceux qui font entendre l'un ou
 * l'autre : jamais un mot qui fait entendre les deux, jamais un mot dont l'orthographe est douteuse.
 */
const SOUND_PAIRS: readonly SoundPair[] = [
  { sound: "ou", has: soundOf("ou"), versus: "u", hasVersus: soundOf("u") },
  { sound: "u", has: soundOf("u"), versus: "ou", hasVersus: soundOf("ou") },
  { sound: "on", has: hasNasalOn, versus: "o", hasVersus: hasPlainO, ambiguous: hearsO },
  { sound: "o", has: hasPlainO, versus: "on", hasVersus: hasNasalOn, ambiguous: hearsO },
  { sound: "é", has: soundOf("é"), versus: "è", hasVersus: soundOf("è"), ambiguous: hearsE },
  { sound: "è", has: soundOf("è"), versus: "é", hasVersus: soundOf("é"), ambiguous: hearsE },
];

/** Un mot que la paire peut offrir : il ne fait pas entendre les deux sons, et son orthographe n'est pas douteuse. */
function usable(pair: SoundPair, word: ReadingWord): boolean {
  if (pair.ambiguous?.(word.word)) return false;
  return !(pair.has(word.word) && pair.hasVersus(word.word));
}

/** Les mots qui n'ont ni l'un ni l'autre des deux sons, ni accent, ni « on » ni « o » : de quoi faire un troisième choix. */
function neutralWords(pair: SoundPair): ReadingWord[] {
  return READING_WORDS.filter(
    (word) =>
      usable(pair, word) &&
      !pair.has(word.word) &&
      !pair.hasVersus(word.word) &&
      !hasNasalOn(word.word) &&
      !hasPlainO(word.word) &&
      !hearsO(word.word) &&
      !hearsE(word.word) &&
      !eitherAccent(word.word),
  );
}

/** « Quel mot a le son ou ? » : un mot qui l'a, un qui a le son proche, un qui n'a ni l'un ni l'autre. */
export function makeReadSound(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-son", () => {
    const pair = pickFresh(ctx, SOUND_PAIRS, (candidate) => `lire-son:${candidate.sound}`);
    const answer = pickFresh(
      ctx,
      READING_WORDS.filter((word) => usable(pair, word) && pair.has(word.word)),
      (word) => `lire:${word.word}`,
    );
    const close = shuffle(
      ctx.rng,
      READING_WORDS.filter((word) => usable(pair, word) && pair.hasVersus(word.word) && !pair.has(word.word)),
    )[0];
    const other = shuffle(ctx.rng, neutralWords(pair))[0];
    const options = shuffle(
      ctx.rng,
      [answer, close, other].map((word) => word.word),
    );
    return {
      type: "qcm",
      prompt: `Quel mot a le son ${pair.sound} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.word),
        game: originOf("lire-son", ctx),
        concept: "distinguer des sons proches",
      },
      answerKey: answer.word,
      hints: [
        "Lis chaque mot à voix basse, en allongeant le son.",
        `Écoute bien si tu entends ${pair.sound}, et pas ${pair.versus}.`,
        pair.sound === "o" ? "Le mot s'écrit avec la lettre o toute seule." : `Le mot s'écrit avec les lettres ${pair.sound}.`,
      ],
    };
  });
}

/** « Glisse chaque mot dans la bonne case. » : le son ou et le son u, le son on et le son o, le son é et le son è. */
export function makeReadSoundSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "lire-son-glisser",
    () => {
      const [first, second] = pick(ctx.rng, [
        [SOUND_PAIRS[0], SOUND_PAIRS[1]],
        [SOUND_PAIRS[2], SOUND_PAIRS[3]],
        [SOUND_PAIRS[4], SOUND_PAIRS[5]],
      ] as const);
      const total = ctx.level === 1 ? 4 : 5;
      const left = shuffle(
        ctx.rng,
        READING_WORDS.filter((word) => usable(first, word) && first.has(word.word) && !first.hasVersus(word.word)),
      );
      const right = shuffle(
        ctx.rng,
        READING_WORDS.filter((word) => usable(second, word) && second.has(word.word) && !second.hasVersus(word.word)),
      );
      const leftCount = Math.min(left.length, Math.floor(total / 2) + randomInt(ctx.rng, 0, 1));
      const rightCount = Math.min(right.length, total - leftCount);
      const zones = [`Le son ${first.sound}`, `Le son ${second.sound}`];
      const items = shuffle(ctx.rng, [
        ...left.slice(0, leftCount).map((word) => ({ text: word.word, correctZone: zones[0] })),
        ...right.slice(0, rightCount).map((word) => ({ text: word.word, correctZone: zones[1] })),
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque mot dans la bonne case.",
        payload: { zones, items, game: originOf("lire-son-glisser", ctx), concept: "distinguer des sons proches" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis chaque mot à voix basse, en allongeant le son.",
          `Écoute si tu entends ${first.sound} ou ${second.sound}.`,
          "Les deux sons se ressemblent, prends ton temps.",
        ],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** Les lettres que l'on confond : b, d et p. */
const CONFUSED = ["b", "d", "p"] as const;

/** « Quel mot commence par la lettre b ? » : un mot en b, un mot en d, un mot en p. */
export function makeReadLetter(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-lettre", () => {
    const letter = pick(ctx.rng, CONFUSED);
    const answer = pickFresh(ctx, withFirstLetter(letter), (word) => `lire:${word.word}`);
    const wrong = CONFUSED.filter((other) => other !== letter).map((other) => pick(ctx.rng, withFirstLetter(other)));
    const options = shuffle(
      ctx.rng,
      [answer, ...wrong].map((word) => word.word),
    );
    return {
      type: "qcm",
      prompt: `Quel mot commence par la lettre ${letter} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.word),
        game: originOf("lire-lettre", ctx),
        concept: "ne pas confondre b, d et p",
      },
      answerKey: answer.word,
      hints: [
        "Regarde la première lettre de chaque mot.",
        letter === "b"
          ? "Un b a son ventre à droite, un d a son ventre à gauche."
          : letter === "d"
            ? "Un d a son ventre à droite, un b a son ventre à gauche."
            : "Un p a sa tige qui descend sous la ligne.",
        "Lis les mots à voix basse pour être sûr.",
      ],
    };
  });
}

// ===========================================================================
// LIRE UNE PHRASE
// ===========================================================================

/** Les mots dessinés qui ont un article sûr (`genders.ts`) : de quoi écrire « Voici un ___. » sans se tromper. */
const WITH_GENDER = PICTURED.filter((entry) => genderOf(entry.word) !== null);

/** « Voici un ___. » : le dessin dit le mot, le genre dit l'article, les mauvais choix ont le même genre. */
export function makeReadGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-trou", () => {
    const answer = pickFresh(ctx, WITH_GENDER, (entry) => `lire:${entry.word}`);
    const article = genderOf(answer.word) === "m" ? "un" : "une";
    const wrong = shuffle(
      ctx.rng,
      WITH_GENDER.filter((entry) => entry.word !== answer.word && together(answer, entry) && genderOf(entry.word) === genderOf(answer.word)),
    ).slice(0, 2);
    const options = shuffle(
      ctx.rng,
      [answer, ...wrong].map((entry) => entry.word),
    );
    return {
      type: "fill-blank",
      prompt: "Regarde le dessin et complète la phrase.",
      payload: {
        text: `${answer.emoji} Voici ${article} ___.`,
        blanks: [{ options, answer: answer.word }],
        game: originOf("lire-trou", ctx),
        concept: "lire une phrase avec le mot du dessin",
      },
      answerKey: answer.word,
      hints: ["Regarde bien le dessin.", "Lis les trois mots, puis relis la phrase avec chacun.", startsHint(answer)],
    };
  });
}

/** Les prénoms des petits textes : sans apostrophe, jamais deux fois le même dans un texte. */
const READERS = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"] as const;

/** Ce que fait quelqu'un : dans un texte, chaque action n'est faite que par une personne. */
const ACTIONS = [
  "mange une mangue",
  "boit du lait",
  "porte un sac",
  "lit un livre",
  "joue au ballon",
  "range son cahier",
  "lave un bol",
  "chante une chanson",
] as const;

/** « Awa mange une mangue. Modou boit du lait. Qui boit du lait ? » : deux phrases, une question. */
export function makeReadSentence(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "lire-phrase", () => {
    const [first, second, third] = shuffle(ctx.rng, READERS);
    const [firstAction, secondAction, spareAction] = shuffle(ctx.rng, ACTIONS);
    const text = `${first} ${firstAction}. ${second} ${secondAction}.`;
    const target = ctx.rng() < 0.5 ? { name: first, action: firstAction } : { name: second, action: secondAction };
    if (ctx.rng() < 0.5) {
      const options = shuffle(ctx.rng, [first, second, third]);
      return {
        type: "qcm",
        prompt: `${text}\nQui ${target.action} ?`,
        payload: {
          options,
          correctIndex: options.indexOf(target.name),
          game: originOf("lire-phrase", ctx),
          concept: "lire deux phrases et répondre",
        },
        answerKey: target.name,
        hints: ["Lis les deux phrases doucement.", "Repère les mots de la question dans le texte.", "Le nom qui vient juste avant ces mots est la réponse."],
      };
    }
    const options = shuffle(ctx.rng, [firstAction, secondAction, spareAction]);
    return {
      type: "qcm",
      prompt: `${text}\nQue fait ${target.name} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(target.action),
        game: originOf("lire-phrase", ctx),
        concept: "lire deux phrases et répondre",
      },
      answerKey: target.action,
      hints: ["Lis les deux phrases doucement.", "Repère le nom de la question dans le texte.", "Ce que fait cette personne est écrit juste après son nom."],
    };
  });
}
