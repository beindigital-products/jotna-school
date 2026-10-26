/**
 * LES GABARITS DES LOISIRS EN ANGLAIS, AU CM1 (`an-cm1-hobbies`) : « I like playing football. », « She likes swimming. ».
 *
 * Le plan (`docs/programme-anglais-v2.md`, lot 4) : les loisirs manquaient au programme, et le -ing après « like » n'était
 * enseigné nulle part. La thématique vient après le présent simple, « he, she, it » et le présent continu (`an-cm1-continuous`).
 *
 * NEUF LOISIRS, TROIS PAR PALIER, chacun avec un dessin d'Unicode 11 au plus, sans U+FE0F :
 *   palier 1 : play football ⚽, play basketball 🏀, read 📖 ;
 *   palier 2 : draw 🎨, sing 🎤, cook 🍳 ;
 *   palier 3 : dance 💃, swim 🏊, run 🏃 (le e tombe, la lettre double : dancing, swimming, running).
 * Les sports prennent « playing » et leur nom (« playing football »). Les autres loisirs sont un verbe en -ing seul.
 *
 * LES FAUTES SONT CELLES DES FRANCOPHONES : « I like play football » (le verbe nu après like), « I likes playing » (le s de
 * la troisième personne avec I), « dancing » écrit « danceing », « swimming » écrit « swiming ». Un mauvais choix n'est jamais
 * une phrase juste.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sentence, sortTiles, writeLine, type Bands, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const BANDS: Bands = 3;
const CONCEPT = "les loisirs en anglais : like et le -ing";

export type Hobby = {
  /** Le verbe, « play », « swim ». */
  verb: string;
  /** Le mot qui suit le verbe, seulement pour un sport : « football », « basketball ». */
  object?: string;
  /** Le verbe en -ing, bien écrit. */
  ing: string;
  /** Deux écritures fausses de la forme en -ing (« swiming », « swim »). */
  wrongIng: readonly [string, string];
  /** L'activité en français, pour l'indice. */
  fr: string;
  emoji: string;
};

export const HOBBIES: readonly Hobby[] = [
  { verb: "play", object: "football", ing: "playing", wrongIng: ["play", "plays"], fr: "jouer au football", emoji: "⚽" },
  { verb: "play", object: "basketball", ing: "playing", wrongIng: ["play", "plays"], fr: "jouer au basket", emoji: "🏀" },
  { verb: "read", ing: "reading", wrongIng: ["read", "reads"], fr: "lire", emoji: "📖" },
  { verb: "draw", ing: "drawing", wrongIng: ["draw", "draws"], fr: "dessiner", emoji: "🎨" },
  { verb: "sing", ing: "singing", wrongIng: ["sing", "sings"], fr: "chanter", emoji: "🎤" },
  { verb: "cook", ing: "cooking", wrongIng: ["cook", "cooks"], fr: "cuisiner", emoji: "🍳" },
  { verb: "dance", ing: "dancing", wrongIng: ["danceing", "dance"], fr: "danser", emoji: "💃" },
  { verb: "swim", ing: "swimming", wrongIng: ["swiming", "swim"], fr: "nager", emoji: "🏊" },
  { verb: "run", ing: "running", wrongIng: ["runing", "run"], fr: "courir", emoji: "🏃" },
];

/** « playing football », « swimming » : l'activité telle qu'elle suit « like ». */
export const activity = (hobby: Hobby) => (hobby.object ? `${hobby.ing} ${hobby.object}` : hobby.ing);
/** « play football », « swim » : l'activité au présent simple. */
export const base = (hobby: Hobby) => (hobby.object ? `${hobby.verb} ${hobby.object}` : hobby.verb);

const hobbyHints = (hobby: Hobby, clue: string): Hints => [`Pense à l'activité « ${hobby.fr} ».`, clue, `Le mot commence par la lettre ${hobby.ing[0]}.`];

const AFTER_LIKE = "Après like, le verbe prend -ing.";
const SPELLING = (hobby: Hobby) =>
  hobby.verb === "dance" ? "Le e de dance tombe avant -ing." : hobby.verb === "swim" || hobby.verb === "run" ? "La dernière lettre se double avant -ing." : AFTER_LIKE;

/** « I like ___ football. » : le verbe en -ing, une fois sur deux avec « She likes ». */
const GAPS: readonly EnGap[] = HOBBIES.map((hobby, index) => ({
  prompt: `Regarde le dessin et complète la phrase avec le verbe en -ing.\n${hobby.emoji}`,
  text: `${index % 2 === 1 ? "She likes" : "I like"} ___${hobby.object ? ` ${hobby.object}` : ""}.`,
  answer: hobby.ing,
  wrong: hobby.wrongIng,
  hints: hobbyHints(hobby, SPELLING(hobby)),
}));

export function makeCm1EnHobbyGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "cm1-hb-trou", CONCEPT, GAPS, BANDS, 3);
}

/** « Regarde le dessin et choisis la bonne phrase. » : `I like playing football.`, parmi `I like play football.` et `I likes playing football.` */
const PICTURE_CHOICES: readonly Fact[] = HOBBIES.map((hobby) => ({
  question: `Regarde le dessin et choisis la bonne phrase.\n${hobby.emoji}`,
  answer: `I like ${activity(hobby)}.`,
  wrong: [`I like ${base(hobby)}.`, `I likes ${activity(hobby)}.`] as [string, string],
  hints: hobbyHints(hobby, SPELLING(hobby)),
}));

export function makeCm1EnHobbyPicture(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "cm1-hb-phrase", CONCEPT, PICTURE_CHOICES, BANDS, 1);
}

/** « Choisis la bonne réponse à « What do you do on Saturday? » » : le présent simple, pas le -ing. */
const QA_CHOICES: readonly Fact[] = HOBBIES.map((hobby) => ({
  question: `Choisis la bonne réponse à « What do you do on Saturday? »\n${hobby.emoji}`,
  answer: `I ${base(hobby)}.`,
  wrong: [`I ${activity(hobby)}.`, `I ${hobby.verb}s${hobby.object ? ` ${hobby.object}` : ""}.`] as [string, string],
  hints: hobbyHints(hobby, "Une habitude se dit au présent simple, sans -ing et sans s avec I."),
}));

export function makeCm1EnHobbyAnswer(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "cm1-hb-reponse", CONCEPT, QA_CHOICES, BANDS, 1);
}

/** « I like playing football. » remis dans l'ordre, une fois sur deux avec « She likes ». */
const SENTENCES = HOBBIES.map((hobby, index) => sentence(`${index % 2 === 0 ? "She likes" : "I like"} ${activity(hobby)}.`));

export function makeCm1EnHobbyOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "cm1-hb-ordre", CONCEPT, SENTENCES, BANDS);
}

/** « Écris le verbe de la parenthèse avec -ing. » puis `I like ___ (swim).` : `swimming`. */
const WRITES: readonly EnWrite[] = HOBBIES.map((hobby) => ({
  prompt: `Écris le verbe de la parenthèse avec -ing.\nI like ___${hobby.object ? ` ${hobby.object}` : ""} (${hobby.verb}).`,
  accepted: [hobby.ing],
  hints: hobbyHints(hobby, SPELLING(hobby)),
}));

export function makeCm1EnHobbyWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "cm1-hb-ecrire", CONCEPT, WRITES, BANDS, 2);
}

/** `swim ~ swimming` : le verbe et sa forme en -ing. Les deux « play » ne comptent qu'une fois. */
const ING_PAIRS: readonly (readonly [string, string])[] = HOBBIES.filter((hobby) => hobby.object !== "basketball").map((hobby) => [hobby.verb, hobby.ing] as const);

export function makeCm1EnHobbyLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "cm1-hb-relier",
    CONCEPT,
    "Relie chaque verbe à sa forme en -ing.",
    ING_PAIRS,
    ["Ajoute -ing à la fin du verbe.", "Regarde si le e tombe ou si la lettre double.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Glisse chaque verbe dans la bonne case. » : la dernière lettre double, ou on ajoute seulement -ing. */
export function makeCm1EnHobbySort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "cm1-hb-glisser",
    CONCEPT,
    "Glisse chaque verbe dans la bonne case.",
    { zone: "La lettre double", tiles: ["swim", "run"] },
    { zone: "Seulement -ing", tiles: ["read", "draw", "sing", "cook", "play"] },
    ["Écris chaque verbe avec -ing.", "Certains verbes courts doublent leur dernière lettre.", "Les autres prennent -ing sans rien changer."],
  );
}
