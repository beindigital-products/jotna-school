/**
 * L'ÉCOUTE — grave ou aigu, long ou court, fort ou doux, compter les coups de
 * tam-tam, reconnaître un rythme, suivre une mélodie.
 *
 * Programme d'éducation musicale : « discrimination de sons (graves/aigus,
 * longs/courts, forts/doux) » à l'étape 1, « imitation de sons et de
 * mélodies » à l'étape 2, les rythmes et l'accompagnement à l'étape 3.
 *
 * LES SONS SONT DÉCRITS, PAS ENREGISTRÉS : l'écran les synthétise
 * (`lib/sounds/synth.ts`). Aucun fichier à télécharger, rien à mettre en
 * cache pour jouer sans réseau, et la bonne réponse se calcule sur les
 * fréquences et les durées : elle ne peut pas être fausse.
 *
 * UN PALIER NE POSE JAMAIS DEUX FOIS LE MÊME EXERCICE : mêmes sons, même
 * question. Les genres qui n'ont que quelques variantes (grave ou aigu, long
 * ou court, fort ou doux, la mélodie) les dressent toutes et en tirent une qui
 * n'a pas encore servi (`pickFresh`) ; les autres, qui en ont des centaines,
 * refont un tirage identique à un exercice déjà posé (`fresh`). Quand un palier
 * demande plus d'exercices qu'un genre n'a de variantes, elles reviennent.
 */
import type { ListenClip, ListenNote, ListenPayload } from "./types";
import { fresh, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";

/** Les notes de la gamme de do, en hertz. */
const NOTE = {
  C3: 130.81,
  E3: 164.81,
  G3: 196.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
} as const;

/** La gamme montante, du grave à l'aigu, pour les mélodies. */
const SCALE = [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.F4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.C5, NOTE.D5, NOTE.E5];

const LISTEN_HINTS_GENERIC = "Touche chaque bouton pour réécouter, autant de fois que tu veux.";

function soundLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Son ${i + 1}`);
}

function tone(f: number, d: number, v = 0.8): ListenNote {
  return { f, d, v, k: "tone" };
}

function drum(gapAfter: number, v = 0.9): ListenNote[] {
  // Un coup de tam-tam : bref et sourd, suivi de son silence.
  return [
    { f: 110, d: 160, v, k: "drum" },
    { f: 0, d: gapAfter },
  ];
}

/** Les entiers de `from` à `to`, bornes comprises. */
function inclusive(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/** Toutes les façons de ranger quelques éléments : les ordres dans lesquels on joue les sons. */
function orders<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) => orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

/**
 * Ce que l'enfant entend et ce qu'on lui demande : l'énoncé et les sons. Deux tirages qui s'y confondent sont le même
 * exercice, même si les choix écrits n'y sont pas dans le même ordre.
 */
const heard = (game: GeneratedGame) => JSON.stringify([game.prompt, game.payload.clips]);

/**
 * Les paires de sons de chaque niveau. L'écart se resserre avec le palier :
 * deux octaves en découverte, une tierce en maîtrise.
 */
const PITCH_PAIRS: Record<number, [number, number][]> = {
  1: [
    [NOTE.C3, NOTE.C5],
    [NOTE.E3, NOTE.E5],
    [NOTE.G3, NOTE.C6],
  ],
  2: [
    [NOTE.C4, NOTE.C5],
    [NOTE.E3, NOTE.E4],
    [NOTE.G3, NOTE.G4],
  ],
  3: [
    [NOTE.C4, NOTE.G4],
    [NOTE.D4, NOTE.A4],
    [NOTE.E4, NOTE.B4],
  ],
  4: [
    [NOTE.C4, NOTE.E4],
    [NOTE.F4, NOTE.A4],
    [NOTE.G4, NOTE.B4],
  ],
};

/**
 * Le plus aigu (ou le plus grave) parmi deux ou trois sons. Un niveau pose chaque paire dans chaque ordre, pour « le plus
 * aigu » et pour « le plus grave » : douze exercices en tout (trente-six avec trois sons), et un palier n'en repose aucun.
 */
export function makePitch(ctx: GameContext): GeneratedGame {
  const level = Math.min(4, ctx.level + (ctx.band === 2 ? 1 : 0));
  const threeSounds = ctx.band > 0 && ctx.level >= 3;
  const variants = PITCH_PAIRS[level].flatMap(([low, high]) =>
    orders(threeSounds ? [low, high, (low + high) / 2] : [low, high]).flatMap((order) =>
      [true, false].map((askHigh) => ({ order, askHigh })),
    ),
  );
  const { order, askHigh } = pickFresh(ctx, variants, (v) => `ecoute-hauteur:${v.order.join("-")}:${v.askHigh}`);
  const target = askHigh ? Math.max(...order) : Math.min(...order);
  const labels = soundLabels(order.length);
  const payload: ListenPayload = {
    clips: order.map((f, i) => ({ label: labels[i], notes: [tone(f, 900)] })),
    options: labels.map((l) => `Le ${l.toLowerCase()}`),
    correctIndex: order.indexOf(target),
  };
  return {
    type: "listen",
    prompt: askHigh
      ? `Écoute les ${order.length === 2 ? "deux" : "trois"} sons. Lequel est le plus aigu ?`
      : `Écoute les ${order.length === 2 ? "deux" : "trois"} sons. Lequel est le plus grave ?`,
    payload: { ...payload, concept: "sons graves et aigus", game: { kind: "ecoute-hauteur", level: ctx.level } },
    answerKey: payload.options[payload.correctIndex],
    hints: [
      LISTEN_HINTS_GENERIC,
      "Un son aigu est fin, comme le chant d'un oiseau ; un son grave est gros, comme un tambour.",
      "Chante doucement chaque son : ta voix monte pour le son aigu, elle descend pour le grave.",
    ],
  };
}

/** Les durées du son court et du son long, en millisecondes : l'écart se resserre avec le palier. */
const DURATION_GAPS: Record<number, [number, number]> = {
  1: [300, 1600],
  2: [400, 1200],
  3: [500, 1000],
  4: [600, 900],
};

/** Les notes sur lesquelles on compare des durées. */
const DURATION_NOTES = [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4];

/**
 * Le plus long (ou le plus court) : même note, durées différentes. Chaque note est jouée dans chaque ordre, pour « le plus
 * long » et pour « le plus court » : seize exercices (quarante-huit avec trois sons), et un palier n'en repose aucun.
 */
export function makeDuration(ctx: GameContext): GeneratedGame {
  const [short, long] = DURATION_GAPS[Math.min(4, ctx.level + (ctx.band === 2 ? 1 : 0))];
  const threeSounds = ctx.band > 0 && ctx.level >= 3;
  const lengths = threeSounds ? [short, long, Math.round((short + long) / 2)] : [short, long];
  const variants = DURATION_NOTES.flatMap((f) =>
    orders(lengths).flatMap((durations) => [true, false].map((askLong) => ({ f, durations, askLong }))),
  );
  const { f, durations, askLong } = pickFresh(
    ctx,
    variants,
    (v) => `ecoute-duree:${v.f}:${v.durations.join("-")}:${v.askLong}`,
  );
  const target = askLong ? Math.max(...durations) : Math.min(...durations);
  const labels = soundLabels(durations.length);
  const payload: ListenPayload = {
    clips: durations.map((d, i) => ({ label: labels[i], notes: [tone(f, d)] })),
    options: labels.map((l) => `Le ${l.toLowerCase()}`),
    correctIndex: durations.indexOf(target),
  };
  return {
    type: "listen",
    prompt: askLong ? "Écoute bien. Quel son dure le plus longtemps ?" : "Écoute bien. Quel son est le plus court ?",
    payload: { ...payload, concept: "sons longs et courts", game: { kind: "ecoute-duree", level: ctx.level } },
    answerKey: payload.options[payload.correctIndex],
    hints: [
      LISTEN_HINTS_GENERIC,
      "Compte dans ta tête pendant que le son joue : « un, deux, trois… ».",
      "Le son long continue encore quand le son court est déjà fini.",
    ],
  };
}

/** Les volumes du son doux et du son fort : l'écart se resserre avec le palier. */
const VOLUME_LEVELS: Record<number, [number, number]> = {
  1: [0.15, 1],
  2: [0.25, 0.9],
  3: [0.35, 0.85],
  4: [0.45, 0.85],
};

/** Les notes sur lesquelles on compare des volumes. */
const VOLUME_NOTES = [NOTE.C4, NOTE.G4, NOTE.A4];

/**
 * Le plus fort (ou le plus doux) : même note, volumes différents. Chaque note est jouée dans chaque ordre, pour « le plus
 * fort » et pour « le plus doux » : douze exercices, et un palier n'en repose aucun.
 */
export function makeVolume(ctx: GameContext): GeneratedGame {
  const [soft, loud] = VOLUME_LEVELS[Math.min(4, ctx.level + (ctx.band === 2 ? 1 : 0))];
  const variants = VOLUME_NOTES.flatMap((f) =>
    orders([soft, loud]).flatMap((levels) => [true, false].map((askLoud) => ({ f, levels, askLoud }))),
  );
  const { f, levels, askLoud } = pickFresh(
    ctx,
    variants,
    (v) => `ecoute-intensite:${v.f}:${v.levels.join("-")}:${v.askLoud}`,
  );
  const target = askLoud ? Math.max(...levels) : Math.min(...levels);
  const labels = soundLabels(levels.length);
  const payload: ListenPayload = {
    clips: levels.map((v, i) => ({ label: labels[i], notes: [tone(f, 1000, v)] })),
    options: labels.map((l) => `Le ${l.toLowerCase()}`),
    correctIndex: levels.indexOf(target),
  };
  return {
    type: "listen",
    prompt: askLoud ? "Écoute les deux sons. Lequel est le plus fort ?" : "Écoute les deux sons. Lequel est le plus doux ?",
    payload: { ...payload, concept: "sons forts et doux", game: { kind: "ecoute-intensite", level: ctx.level } },
    answerKey: payload.options[payload.correctIndex],
    hints: [
      LISTEN_HINTS_GENERIC,
      "Un son fort fait du bruit comme un cri ; un son doux chuchote.",
      "Écoute les deux sons l'un après l'autre, sans changer le volume de l'appareil.",
    ],
  };
}

/** Combien de coups de tam-tam ? */
export function makeBeatCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ecoute-rythme", () => beatCount(ctx), heard);
}

function beatCount(ctx: GameContext): GeneratedGame {
  const ranges: Record<number, [number, number]> = { 0: [2, 5], 1: [3, 7], 2: [4, 9] };
  const [min, max] = ranges[ctx.band];
  const count = randomInt(ctx.rng, min, max);
  // Régulier en découverte ; ensuite les coups se groupent, et il faut
  // compter sans se laisser porter par la pulsation.
  const irregular = ctx.level >= 2;
  const notes: ListenNote[] = [];
  for (let i = 0; i < count; i++) {
    const gap = i === count - 1 ? 0 : irregular ? pick(ctx.rng, [160, 260, 520]) : 420;
    notes.push(...drum(gap));
  }
  const candidates = [count - 1, count, count + 1].filter((n) => n >= 1);
  const options = candidates.map(String);
  const payload: ListenPayload = {
    clips: [{ label: "Le tam-tam", notes }],
    options,
    correctIndex: options.indexOf(String(count)),
  };
  return {
    type: "listen",
    prompt: "Écoute le tam-tam. Combien de coups entends-tu ?",
    payload: { ...payload, concept: "compter les coups d'un rythme", game: { kind: "ecoute-rythme", level: ctx.level } },
    answerKey: String(count),
    hints: [
      LISTEN_HINTS_GENERIC,
      "Lève un doigt à chaque coup de tam-tam.",
      "Tape sur la table en même temps que le tam-tam, puis compte tes tapes.",
    ],
  };
}

/** Un rythme écrit : TAM pour un coup long, ti pour un coup court. */
function rhythmText(pattern: ("L" | "S")[]): string {
  return pattern.map((p) => (p === "L" ? "TAM" : "ti")).join(" · ");
}

export function makeRhythmPattern(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ecoute-motif-rythmique", () => rhythmPattern(ctx), heard);
}

function rhythmPattern(ctx: GameContext): GeneratedGame {
  const length = Math.min(7, 3 + ctx.band + (ctx.level >= 3 ? 1 : 0));
  const make = (): ("L" | "S")[] => Array.from({ length }, () => (ctx.rng() < 0.5 ? "L" : "S"));
  let pattern = make();
  // Un rythme tout long ou tout court ne s'entend pas : on varie.
  for (let i = 0; i < 10 && new Set(pattern).size < 2; i++) pattern = make();
  if (new Set(pattern).size < 2) pattern[0] = pattern[0] === "L" ? "S" : "L";

  const correct = rhythmText(pattern);
  const variants = new Set<string>([correct]);
  for (let i = 0; i < 30 && variants.size < 3; i++) {
    const copy = [...pattern];
    // Jamais le dernier coup : il n'est suivi d'aucun silence, donc ni long ni court à l'oreille, et deux options qui ne diffèrent que par lui
    // sonnent pareil (relevé à la relecture de la production : une réponse juste à l'oreille était refusée).
    const flip = randomInt(ctx.rng, 0, copy.length - 2);
    copy[flip] = copy[flip] === "L" ? "S" : "L";
    variants.add(rhythmText(copy));
  }
  const options = shuffle(ctx.rng, Array.from(variants));
  const notes: ListenNote[] = pattern.flatMap((p, i) =>
    drum(i === pattern.length - 1 ? 0 : p === "L" ? 620 : 180),
  );
  const payload: ListenPayload = {
    clips: [{ label: "Le rythme", notes }],
    options,
    correctIndex: options.indexOf(correct),
  };
  return {
    type: "listen",
    prompt: "Écoute le rythme. Lequel est écrit ? TAM est un coup long, ti un coup court.",
    payload: { ...payload, concept: "reconnaître un rythme", game: { kind: "ecoute-motif-rythmique", level: ctx.level } },
    answerKey: correct,
    hints: [
      LISTEN_HINTS_GENERIC,
      "Après un TAM, on attend longtemps ; après un ti, le coup suivant arrive vite.",
      "Dis « TAM » ou « ti » à voix haute en même temps que chaque coup.",
    ],
  };
}

type MelodyShape = "up" | "down" | "arch";

/**
 * La mélodie monte, descend, ou monte puis descend. Chaque forme part de chaque note où elle tient dans la gamme : une
 * mélodie de trois notes en découverte a douze départs possibles, et un palier n'en repose aucun.
 */
export function makeMelody(ctx: GameContext): GeneratedGame {
  const length = ctx.band === 0 ? 3 : ctx.band === 1 ? 4 : 5;
  const allowArch = ctx.level >= 3;
  // Un pas de deux notes en découverte s'entend mieux qu'un pas d'une note.
  const step = ctx.level >= 2 ? 1 : 2;
  // L'arche monte d'une note à chaque fois jusqu'au sommet, puis redescend : le départ laisse la place de redescendre
  // sans sortir de la gamme.
  const top = Math.ceil(length / 2);
  const shapes: readonly MelodyShape[] = allowArch ? ["up", "down", "arch"] : ["up", "down"];
  const variants = shapes.flatMap((shape) =>
    (shape === "arch"
      ? inclusive(Math.max(0, length + 1 - 2 * top), SCALE.length - top)
      : inclusive(0, SCALE.length - 1 - (length - 1) * step)
    ).map((start) => ({ shape, start })),
  );
  const { shape, start } = pickFresh(ctx, variants, (v) => `ecoute-melodie:${v.shape}:${v.start}`);
  let indexes: number[];
  if (shape === "arch") {
    indexes = Array.from({ length }, (_, i) => (i < top ? start + i : start + 2 * (top - 1) - i));
  } else {
    const span = Array.from({ length }, (_, i) => start + i * step);
    indexes = shape === "up" ? span : [...span].reverse();
  }
  const notes = indexes.map((i) => tone(SCALE[i], 420));
  const options = allowArch
    ? ["Elle monte", "Elle descend", "Elle monte puis descend"]
    : ["Elle monte", "Elle descend"];
  const correct = shape === "up" ? 0 : shape === "down" ? 1 : 2;
  const payload: ListenPayload = {
    clips: [{ label: "La mélodie", notes }],
    options,
    correctIndex: correct,
  };
  return {
    type: "listen",
    prompt: "Écoute la mélodie. Comment bouge-t-elle ?",
    payload: { ...payload, concept: "mélodie qui monte ou qui descend", game: { kind: "ecoute-melodie", level: ctx.level } },
    answerKey: options[correct],
    hints: [
      LISTEN_HINTS_GENERIC,
      "Monte ta main quand la note devient plus aiguë, descends-la quand elle devient plus grave.",
      // Comparer la première et la dernière note ne tranche qu'entre monter et descendre : une mélodie qui monte puis
      // descend finit plus bas qu'elle ne part (ou au même endroit), et cet indice pousserait vers « Elle descend ».
      allowArch
        ? "Cherche la note la plus aiguë : est-elle au début, à la fin, ou au milieu ?"
        : "Compare la première note et la dernière : laquelle est la plus aiguë ?",
    ],
  };
}

/** Deux mélodies : pareilles, ou une note a changé ? */
export function makeSameDifferent(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ecoute-pareil", () => sameDifferent(ctx), heard);
}

function sameDifferent(ctx: GameContext): GeneratedGame {
  const length = ctx.band === 0 ? 3 : 4;
  const melody = Array.from({ length }, () => randomInt(ctx.rng, 0, SCALE.length - 1));
  const same = ctx.rng() < 0.5;
  const other = [...melody];
  if (!same) {
    const at = randomInt(ctx.rng, 0, length - 1);
    // Plus le palier avance, plus la note changée est proche de l'originale.
    const shift = ctx.level >= 3 ? 1 : 3;
    other[at] = melody[at] + shift < SCALE.length ? melody[at] + shift : melody[at] - shift;
  }
  const clip = (indexes: number[], label: string): ListenClip => ({
    label,
    notes: indexes.map((i) => tone(SCALE[i], 380)),
  });
  const options = ["Pareilles", "Différentes"];
  const payload: ListenPayload = {
    clips: [clip(melody, "Mélodie 1"), clip(other, "Mélodie 2")],
    options,
    correctIndex: same ? 0 : 1,
  };
  return {
    type: "listen",
    prompt: "Écoute les deux mélodies. Sont-elles pareilles ou différentes ?",
    payload: { ...payload, concept: "comparer deux mélodies", game: { kind: "ecoute-pareil", level: ctx.level } },
    answerKey: options[payload.correctIndex],
    hints: [
      LISTEN_HINTS_GENERIC,
      "Écoute note par note : la première, puis la deuxième…",
      "Fredonne la première mélodie, puis vérifie si la seconde chante pareil.",
    ],
  };
}
