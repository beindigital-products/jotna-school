/**
 * LES FAITS DU CM1 : des tableaux de faits fermés, dont on tire les lignes d'un QCM, d'une phrase à trou et d'une réponse à écrire.
 *
 * Un FAIT (`Item`) est une question, sa bonne réponse, ses autres façons de la poser, une phrase à trou, et un indice qui parle du
 * sujet sans écrire un mot de la réponse. Les mauvais choix ne s'écrivent pas : ils sont les bonnes réponses des autres faits du même
 * lot (`Pool`), plus quelques intrus que le lot nomme. Un lot ne contient donc que des réponses de même sorte (des royaumes, des
 * dates, des chefs) et jamais deux faits dont la réponse serait aussi juste pour l'autre question (`not`).
 *
 * Le CM1 a cinq paliers (`GameContext.palier`) : chaque gabarit donne à chaque palier sa fenêtre de lignes (`ce2Outils`). Les lignes
 * sont rangées par façon de poser la question : la première façon de chaque fait d'abord, les autres plus loin, donc dans un autre
 * palier.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { hints, ordr, type GapRow, type Hints, type LinkRow, type OrderRow, type QuestionRow, type WriteRow } from "./ce2Outils";

export type Item = {
  /** Ce qui nomme le fait dans sa thématique (« lat-dior-cayor ») : un palier ne le pose pas deux fois. */
  id: string;
  /** Une ou plusieurs façons de poser la question. */
  q: readonly string[];
  /** La bonne réponse, telle qu'elle s'écrit sur une tuile. */
  a: string;
  /** La réponse telle qu'elle s'écrit dans la phrase à trou (sans majuscule ni article quand la phrase les donne). */
  ga?: string;
  /** D'autres écritures admises pour la réponse à écrire. */
  also?: readonly string[];
  /** Les phrases à trou, le trou s'écrit `___`. */
  s?: readonly string[];
  /** La consigne de la réponse à écrire, quand elle n'est pas la première question. */
  w?: string;
  /** Vrai quand la réponse à écrire n'a pas de sens pour ce fait (une autre ligne la pose déjà). */
  noWrite?: boolean;
  /**
   * La consigne d'écriture ajoutée à la question (par défaut « Écris la réponse. »). Un sigle dit « Écris le sigle. » : sans elle, le nom
   * en entier (« Organisation mondiale du commerce ») était juste et refusé.
   */
  writeAs?: string;
  /** D'autres réponses justes à cette question : jamais proposées comme mauvais choix. */
  not?: readonly string[];
  /** Le deuxième indice : parle du sujet, n'écrit aucun mot de quatre lettres ou plus de la réponse ni d'une tuile. */
  hint: string;
};

/**
 * Un lot de faits dont les réponses sont de même sorte. `extras` sont des intrus (QCM), `gextras` les mêmes écrits comme la phrase à
 * trou les veut (par défaut `extras`). `onlyExtras` : les mauvais choix ne viennent que des intrus, parce que les autres réponses du
 * lot seraient justes aussi (« lequel est un résistant ? »).
 */
/** Les faits qui n'ont pas deux mauvais choix : le test exige que la liste reste vide. */
export const SHORT_OF_CHOICES: string[] = [];

export type Pool = { items: readonly Item[]; extras?: readonly string[]; gextras?: readonly string[]; onlyExtras?: boolean };

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (text: string) => fold(text).split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
const ARTICLE = /^(le |la |les |l'|un |une |des |du |de la |de l')/i;
const withoutArticle = (text: string) => text.replace(ARTICLE, "");
const upperFirst = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** Le troisième indice : la première lettre de la réponse (sans son article), ou une relecture quand elle commence par un chiffre. */
function letterHint(answer: string, fallback: string): string {
  const first = fold(withoutArticle(answer)).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? `La réponse commence par la lettre ${first}.` : fallback;
}

/**
 * Le troisième indice d'un choix : la première lettre de la réponse, lue comme les choix sont lus (`initial`), ou la relecture quand un
 * les choix commencent tous par la même lettre (l'indice ne départagerait rien).
 */
function choiceLetterHint(answer: string, wrong: readonly string[], initial: (text: string) => string, fallback: string): string {
  const first = initial(answer);
  if (!/[A-Z]/.test(first) || wrong.every((choice) => initial(choice) === first)) return fallback;
  return `La réponse commence par la lettre ${first}.`;
}
/** Un choix de QCM se lit en entier : « Des enfants qui jouent » commence par D, pas par le E d'« enfants ». */
const tileInitial = (text: string) => fold(text).charAt(0).toUpperCase();
/** Un choix de phrase à trou garde l'article que la phrase demande : la lettre est celle du nom (« le sabar », S). */
const gapInitial = (text: string) => fold(withoutArticle(text)).charAt(0).toUpperCase();

/** Un choix possible, écrit comme une tuile et comme la phrase à trou le veut. */
type Choice = { tile: string; gap: string };

/**
 * Les mauvais choix d'un fait : les réponses des autres faits du lot et ses intrus, à partir du `offset`, sans la bonne réponse, sans
 * une réponse que `not` écarte (sous sa forme de tuile ou de phrase) et sans un mot de l'indice.
 */
function wrongChoices(pool: Pool, item: Item, index: number, offset: number, gap: boolean): [string, string] {
  const clue = new Set(words(item.hint));
  const used = (choice: Choice) => (gap ? choice.gap : choice.tile);
  const own = gap ? (item.ga ?? item.a) : item.a;
  const extras = pool.extras ?? [];
  const gapExtras = pool.gextras ?? extras;
  const fromItems: Choice[] = pool.onlyExtras ? [] : pool.items.map((other) => ({ tile: other.a, gap: other.ga ?? other.a }));
  const fromExtras: Choice[] = extras.map((extra, i) => ({ tile: extra, gap: gapExtras[i] ?? extra }));
  const excluded = new Set(item.not ?? []);
  const seen = new Set<string>();
  const candidates = [...fromItems, ...fromExtras]
    .filter((choice) => used(choice) !== own && !excluded.has(choice.tile) && !excluded.has(choice.gap) && !words(used(choice)).some((word) => clue.has(word)))
    .map(used)
    .filter((choice) => !seen.has(choice) && !!seen.add(choice));
  if (candidates.length < 2) {
    SHORT_OF_CHOICES.push(`fait « ${item.id} » : moins de deux mauvais choix possibles`);
    return [candidates[0] ?? "?", candidates[1] ?? "??"];
  }
  const start = (index + offset) % candidates.length;
  return [candidates[start], candidates[(start + 1) % candidates.length]];
}

/** Les (fait, rang de la façon de poser) d'un lot, rangés par façon : la première façon de chaque fait d'abord. */
function inWaysOrder<T extends { q?: readonly string[]; s?: readonly string[] }>(pools: readonly Pool[], waysOf: (item: Item) => readonly string[] | undefined) {
  const out: { pool: Pool; item: Item; index: number; way: number; text: string }[] = [];
  const most = Math.max(...pools.flatMap((pool) => pool.items.map((item) => waysOf(item)?.length ?? 0)));
  for (let way = 0; way < most; way++) {
    for (const pool of pools) {
      pool.items.forEach((item, index) => {
        const text = waysOf(item)?.[way];
        if (text !== undefined) out.push({ pool, item, index, way, text });
      });
    }
  }
  return out as (typeof out[number] & T)[];
}

const factOf = (topic: string, item: Item) => `${topic}:${item.id}`;

export function questionRows(topic: string, pools: readonly Pool[]): QuestionRow[] {
  return inWaysOrder(pools, (item) => item.q).map(({ pool, item, index, way, text }): QuestionRow => {
    const wrong = wrongChoices(pool, item, index, 1 + 2 * way, false);
    return {
      prompt: text,
      answer: item.a,
      wrong,
      hints: hints("Lis la question en entier, mot après mot.", item.hint, choiceLetterHint(item.a, wrong, tileInitial, "Relis ta leçon, puis choisis.")),
      fact: factOf(topic, item),
    };
  });
}

export function gapRows(topic: string, pools: readonly Pool[]): GapRow[] {
  return inWaysOrder(pools, (item) => item.s).map(({ pool, item, index, way, text }): GapRow => {
    const wrong = wrongChoices(pool, item, index, 2 + 2 * way, true);
    return {
      text,
      answer: item.ga ?? item.a,
      wrong,
      hints: hints("Lis la phrase en entier, mot après mot.", item.hint, choiceLetterHint(item.ga ?? item.a, wrong, gapInitial, "Relis ta leçon, puis choisis.")),
      fact: factOf(topic, item),
    };
  });
}

/**
 * L'indice de la première lettre, remplacé par une relecture quand il égare. Un QCM range ses choix sous les lettres A, B et C : « La
 * réponse commence par la lettre A » s'y lit « choisis A ». Et une lettre que porte aussi un mauvais choix (« Aliments de construction »
 * parmi « Aliments de protection ») ne départage rien. `lettered` : les choix s'affichent sous des lettres (le QCM, pas la phrase à trou).
 * Les lignes qui ne l'appellent pas gardent leur indice : c'est un choix de gabarit, pas une règle de ce fichier.
 */
export function withUsefulLetter<R extends QuestionRow | GapRow>(rows: readonly R[], lettered: boolean): R[] {
  const initial = (text: string) => fold(withoutArticle(text)).charAt(0).toUpperCase();
  return rows.map((row) => {
    const letter = /^La réponse commence par la lettre ([A-Z])\.$/.exec(row.hints[2])?.[1];
    if (letter === undefined) return row;
    const misleading = (lettered && ["A", "B", "C"].includes(letter)) || row.wrong.some((choice) => initial(choice) === letter);
    return misleading ? { ...row, hints: hints(row.hints[0], row.hints[1], "Relis ta leçon, puis choisis.") } : row;
  });
}

/** Les écritures admises d'une réponse : telle quelle, sans accent, sans article, et les variantes du fait. */
function acceptedOf(item: Item): string[] {
  const base = [item.a, ...(item.also ?? [])];
  const forms = base.flatMap((form) => [form, withoutArticle(form), upperFirst(withoutArticle(form))]);
  const plain = forms.map((form) => form.normalize("NFD").replace(/\p{M}/gu, ""));
  return [...new Set([...forms, ...plain])];
}

export function writeRows(topic: string, pools: readonly Pool[]): WriteRow[] {
  return inWaysOrder(pools, (item) => (item.noWrite ? undefined : item.w !== undefined ? [item.w] : item.q.map((question) => `${question} ${item.writeAs ?? "Écris la réponse."}`))).map(({ item, text }): WriteRow => ({
    prompt: text,
    accepted: acceptedOf(item),
    hints: hints("Lis la question en entier, mot après mot.", item.hint, letterHint(item.a, "Relis ta leçon, puis écris.")),
    fact: factOf(topic, item),
  }));
}

export type { Hints };
export { fold, words };

// ---------------------------------------------------------------------------
// Les lignes qui ne se tirent pas d'un fait : l'ordre, l'appariement, le glissé.
// ---------------------------------------------------------------------------

export const SORT_HINTS = hints("Lis chaque étiquette, une par une.", "Demande-toi quelle case lui convient, puis pose-la.", "Les étiquettes d'une même case se ressemblent.");
export const LINK_HINTS = hints("Lis les colonnes en entier avant de relier.", "Commence par la paire dont tu es certain.", "À la fin, il ne reste qu'une seule paire possible.");
export const ORDER_HINTS = hints("Lis toutes les étapes avant de les ranger.", "Cherche d'abord ce qui est arrivé le plus tôt.", "Ce qui est le plus récent se range en dernier.");
export const RANK_HINTS = hints("Lis tous les mots avant de les ranger.", "Cherche d'abord celui qui commence la suite, selon la consigne.", "Celui qui termine la suite se range à la fin.");

export const link = (prompt: string, pairs: readonly (readonly [string, string])[], fact?: string): LinkRow => ({
  prompt,
  pairs: pairs.map(([left, right]) => ({ left, right })),
  hints: LINK_HINTS,
  ...(fact === undefined ? {} : { fact }),
});

export const order = (prompt: string, sequence: readonly string[], fact?: string, h: Hints = ORDER_HINTS): OrderRow => ordr(prompt, sequence, h, fact);
