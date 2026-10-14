/**
 * LE CONTRÔLEUR STRUCTUREL DE CHAQUE EXERCICE : UNE LISTE DE DÉFAUTS TYPÉS, SANS
 * APPEL AU MODÈLE.
 *
 * Un parent a signalé « Combien de billes as-tu ? » sans billes à l'écran, et
 * « beaucoup d'erreurs » : des images qui manquent, des phrases coupées, des
 * options qui ne tiennent pas debout. Les exercices sont écrits par un modèle
 * de langage ; l'écran de l'enfant n'affiche que le texte de l'énoncé et les
 * options. Chaque garde ajoutée jusqu'ici (`missingVisual.ts`, `mathRepair.ts`,
 * `dragDropRepair.ts`) répond à UN défaut vu une fois. Ce module les range
 * tous derrière une seule question : cet exercice est-il jouable et sensé ?
 *
 * `auditExercise` rend une liste de défauts `{ code, severity, detail }`, au
 * plus un par code :
 *
 *   - `blocking` : l'exercice est injouable ou faux à coup sûr (une phrase
 *     coupée, une bonne réponse absente des options, deux options qui disent la
 *     même chose dont la bonne, une scène qui n'existe pas). La génération
 *     l'écarte du lot (`toPersistedShape`) ; en base, `pregen:auditExercises`
 *     le signale et fait refaire son palier.
 *   - `warning` : l'exercice se joue mais il est maladroit (indice qui donne la
 *     réponse, option « Toutes les réponses », énoncé trop long pour la classe,
 *     markdown dans le texte). Rien n'est écarté ; la génération les compte.
 *
 * LA PRUDENCE EST LA RÈGLE : un faux positif écarte un bon exercice, et le
 * palier se refait pour rien. Un défaut n'est donc `blocking` que si aucun
 * exercice correct ne peut l'avoir. `convex/__tests__/exerciseAudit.test.ts`
 * le fait respecter : aucun défaut `blocking` sur la banque écrite à la main
 * (`components/landing/demo/bank`), aucun défaut du tout sur les exercices
 * corrects du test.
 *
 * CE QUE CE MODULE NE VOIT PAS : une erreur de fait (« la capitale du Sénégal
 * est Thiès »), une faute d'orthographe, un énoncé fluide mais absurde, une
 * bonne réponse qui n'en est pas une alors que l'option désignée est cohérente
 * avec la clé écrite. Il juge la FORME. Le sens se relit (ou se vérifie, en
 * mathématiques, par `mathRepair.ts`).
 *
 * Module pur, sans Convex : la génération (`paliers/index.ts`), l'audit en base
 * (`paliers/pregen.ts`) et les tests s'en servent.
 */
import { isGenericZoneLabel } from "./dragDropRepair";
import { validateFillBlank } from "./fillBlank";
import { displayedText, findMissingVisualOnScreen, withoutDanglingHints } from "./missingVisual";
import { BLANK_MARK } from "./games/types";

// ===========================================================================
// LES CODES DE DÉFAUT ET LEUR GRAVITÉ
// ===========================================================================

export type Severity = "blocking" | "warning";

/**
 * La gravité est une propriété du code, pas de l'exercice : deux codes quand
 * le même constat change de gravité (une option dupliquée est `blocking` si
 * c'est la bonne, `warning` si ce sont deux mauvaises).
 */
export const DEFECT_SEVERITY = {
  // --- Énoncé -------------------------------------------------------------
  prompt_empty: "blocking",
  prompt_too_short: "warning",
  prompt_truncated: "blocking",
  prompt_ends_midphrase: "warning",
  prompt_unclosed_pair: "warning",
  prompt_dangling_colon: "blocking",
  prompt_too_long_for_class: "warning",
  visual_missing: "blocking",
  hole_without_hole: "warning",
  payload_malformed: "blocking",
  short_answer_in_ci: "warning",
  // --- QCM ----------------------------------------------------------------
  qcm_options_few: "blocking",
  qcm_options_many: "warning",
  qcm_correct_index_out_of_range: "blocking",
  qcm_correct_option_empty: "blocking",
  qcm_option_empty: "warning",
  qcm_correct_option_duplicated: "blocking",
  qcm_option_duplicated: "warning",
  qcm_option_case_twin: "warning",
  qcm_equivalent_options_with_correct: "blocking",
  qcm_equivalent_options: "warning",
  qcm_answer_key_mismatch: "blocking",
  qcm_answer_key_unrelated: "warning",
  qcm_catch_all_option: "warning",
  qcm_correct_option_stands_out: "warning",
  // --- Association --------------------------------------------------------
  match_pairs_invalid: "blocking",
  match_pairs_count: "warning",
  match_side_empty: "blocking",
  match_pair_duplicated: "warning",
  match_left_repeated: "warning",
  match_right_repeated: "warning",
  // --- Remise en ordre ----------------------------------------------------
  order_too_few: "blocking",
  order_few: "warning",
  order_item_empty: "blocking",
  order_item_duplicated: "warning",
  order_already_sorted: "warning",
  // --- Glisser-déposer ----------------------------------------------------
  dragdrop_zones_few: "blocking",
  dragdrop_items_few: "blocking",
  dragdrop_generic_zone: "blocking",
  dragdrop_zone_duplicated: "blocking",
  dragdrop_zone_missing: "blocking",
  dragdrop_label_without_zone: "blocking",
  dragdrop_empty_zone: "warning",
  dragdrop_item_empty: "warning",
  // --- Réponse courte -----------------------------------------------------
  short_answer_no_answer: "blocking",
  short_answer_empty_accepted: "warning",
  short_answer_answer_in_prompt: "warning",
  // --- Phrase à trous -----------------------------------------------------
  fill_blank_invalid: "blocking",
  fill_blank_off_limits: "warning",
  // --- Indices ------------------------------------------------------------
  hints_few: "warning",
  hint_empty: "warning",
  hints_duplicated: "warning",
  hint_gives_answer: "warning",
  hint_dangling_visual: "warning",
  // --- Texte --------------------------------------------------------------
  text_double_space: "warning",
  text_markup: "warning",
  text_placeholder: "blocking",
  text_replacement_char: "blocking",
  text_english_in_young_class: "warning",
  text_foreign_currency: "warning",
} as const satisfies Record<string, Severity>;

export type DefectCode = keyof typeof DEFECT_SEVERITY;

export type AuditDefect = {
  code: DefectCode;
  severity: Severity;
  /** Une phrase pour le relecteur : ce qui a été vu, avec l'extrait en cause. */
  detail: string;
};

export type AuditInput = {
  type: string;
  prompt: string;
  payload: unknown;
  /** La réponse écrite par le modèle (`correctAnswer`) ; absente, aucun recoupement avec le payload. */
  answerKey?: string | null;
  hints?: readonly string[] | null;
  /** « CI » … « CM2 » : sans elle, ni plafond de longueur ni règle propre aux petites classes. */
  class?: string | null;
  /** Le nom de la matière : sans lui, la langue de l'énoncé n'est pas jugée. */
  subject?: string | null;
};

export function isBlocking(defect: AuditDefect): boolean {
  return defect.severity === "blocking";
}

export function blockingDefects(defects: readonly AuditDefect[]): AuditDefect[] {
  return defects.filter(isBlocking);
}

/**
 * Le plafond de mots d'un énoncé, par classe. `LANGUAGE_LEVEL` (prompts.ts)
 * dit « 8 mots au plus » au CI et « 12 » au CP, et la banque écrite à la main
 * atteint 16 et 21 mots : un plafond au mot près rejetterait de bons énoncés
 * (un petit problème de CI en compte quinze). Celui-ci attrape l'énoncé qui
 * déborde, pas celui qui est un peu long. À partir du CE1, l'énoncé porte
 * parfois un petit texte à lire : le plafond laisse la place du texte.
 */
export const PROMPT_WORD_CEILING: Record<string, number> = {
  CI: 20,
  CP: 28,
  CE1: 80,
  CE2: 110,
  CM1: 150,
  CM2: 220,
};

/** Le nombre maximal d'options d'un QCM que l'écran d'un enfant montre sans défiler. */
const MAX_QCM_OPTIONS = 6;
const MAX_MATCH_PAIRS = 6;
const MIN_MATCH_PAIRS = 3;

// ===========================================================================
// OUTILS DE TEXTE
// ===========================================================================

const PICTOGRAPH = /\p{Extended_Pictographic}/u;
const PICTOGRAPHS = /\p{Extended_Pictographic}[︎️]?/gu;

/** Espaces ramenés à un, bords retirés : ce que l'enfant lit comme « le même texte ». */
function collapse(text: string): string {
  return text.replace(/[\s  ]+/g, " ").trim();
}

/** Sans casse, sans accents, sans ponctuation de bord, apostrophe droite. */
function fold(text: string): string {
  return collapse(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `needle` figure dans `haystack` comme mot entier (les deux déjà passés par `fold`). */
function hasWord(haystack: string, needle: string): boolean {
  if (needle === "") return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, "u").test(haystack);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => (typeof entry === "string" ? entry : "")) : [];
}

function wordCount(text: string): number {
  return text
    .replace(PICTOGRAPHS, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function excerpt(text: string, max = 60): string {
  const flat = collapse(text);
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

// ---------------------------------------------------------------------------
// Les nombres : « 5 », « 2,5 », « cinq », « 1/2 »
// ---------------------------------------------------------------------------

const UNITS: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
};

/** « quatre-vingt-douze », « deux cents », « mille deux » : le nombre, ou `null`. */
function frenchNumberWords(raw: string): number | null {
  const tokens = fold(raw)
    .replace(/-/g, " ")
    .split(" ")
    .filter((token) => token !== "" && token !== "et")
    .map((token) => (/^(?:vingt|cent)s$/.test(token) ? token.slice(0, -1) : token));
  if (tokens.length === 0) return null;
  let total = 0;
  let current = 0;
  for (const token of tokens) {
    if (token === "cent") current = (current === 0 ? 1 : current) * 100;
    else if (token === "mille") {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
    } else if (token === "vingt" && current === 4) current *= 20;
    else if (token in UNITS) current += UNITS[token];
    else return null;
  }
  return total + current;
}

type NumberForm = { value: number; fraction: boolean };

/** Le nombre que ce texte SEUL écrit (pas d'unité, pas de calcul), ou `null`. */
function numberForm(raw: string): NumberForm | null {
  const text = collapse(raw);
  if (text === "") return null;
  const compact = text.replace(/(\d)[\s  ]+(?=\d{3}(?!\d))/g, "$1");
  if (/^-?\d+(?:[.,]\d+)?$/.test(compact)) {
    return { value: Number(compact.replace(",", ".")), fraction: false };
  }
  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(compact);
  if (fraction && Number(fraction[2]) !== 0) {
    return { value: Number(fraction[1]) / Number(fraction[2]), fraction: true };
  }
  // « un » et « une » sont des articles avant d'être un nombre (« un » / « une »
  // se choisit dans une phrase à trous) : seuls, ils ne valent pas 1.
  if (/^(?:un|une)$/i.test(text)) return null;
  const words = frenchNumberWords(text);
  return words === null ? null : { value: words, fraction: false };
}

// ===========================================================================
// LE TEXTE QUE L'ENFANT LIT
// ===========================================================================

type Shown = { where: string; text: string };

/** Tous les textes affichés, étiquetés : l'énoncé, les options, les tuiles, les indices. */
function shownTexts(input: AuditInput, payload: Record<string, unknown> | null): Shown[] {
  const out: Shown[] = [{ where: "l'énoncé", text: input.prompt }];
  (input.hints ?? []).forEach((hint, i) => out.push({ where: `l'indice ${i + 1}`, text: String(hint) }));
  if (!payload) return out;
  const add = (where: string, list: unknown[]) =>
    list.forEach((text, i) => {
      if (typeof text === "string") out.push({ where: `${where} ${i + 1}`, text });
    });
  switch (input.type) {
    case "qcm":
      add("l'option", strings(payload.options));
      break;
    case "match":
      if (Array.isArray(payload.pairs)) {
        payload.pairs.forEach((pair, i) => {
          const entry = asRecord(pair);
          if (!entry) return;
          if (typeof entry.left === "string") out.push({ where: `la paire ${i + 1} (gauche)`, text: entry.left });
          if (typeof entry.right === "string") out.push({ where: `la paire ${i + 1} (droite)`, text: entry.right });
        });
      }
      break;
    case "order":
      add("l'élément", strings(payload.correctSequence));
      break;
    case "drag-drop":
      add("la zone", strings(payload.zones));
      if (Array.isArray(payload.items)) {
        payload.items.forEach((item, i) => {
          const entry = asRecord(item);
          if (entry && typeof entry.text === "string") out.push({ where: `l'étiquette ${i + 1}`, text: entry.text });
        });
      }
      break;
    case "fill-blank":
      if (typeof payload.text === "string") out.push({ where: "la phrase à trous", text: payload.text });
      if (Array.isArray(payload.blanks)) {
        payload.blanks.forEach((blank, i) => {
          add(`le mot du trou ${i + 1}, option`, strings(asRecord(blank)?.options));
        });
      }
      break;
    default:
      break;
  }
  return out;
}

const PLACEHOLDER =
  /(?<![\p{L}\p{N}])(?:undefined|null)(?![\p{L}\p{N}])|\[object Object\]|\{\{[^}]*\}\}|\$\{/iu;
/** « NaN » s'écrit ainsi : « nan » est un mot wolof. */
const NOT_A_NUMBER = /(?<![\p{L}\p{N}])NaN(?![\p{L}\p{N}])/u;
const MARKUP: RegExp[] = [
  /\*\*[^*\s][^*]*\*\*/,
  /^\s*#{1,6}\s+\S/m,
  /`/,
  /<\/?(?:b|i|u|br|p|div|span|strong|em|ul|ol|li|h[1-6]|img|a|table|tr|td)\b[^>]*>/i,
  /\[[^\]]+\]\([^)]+\)/,
];
const CURRENCY = /€|(?<![\p{L}\p{N}-])(?:euros?|dollars?)(?![\p{L}\p{N}])|(?<![\p{L}\p{N}\\])\$(?!\{)/iu;
const CURRENCY_CODE = /(?<![\p{L}\p{N}-])(?:EUR|USD)(?![\p{L}\p{N}])/u;

/** Des mots qu'aucun énoncé français n'emploie : l'anglais d'un énoncé de CI ou de CP. */
const ENGLISH_MARKERS = new Set([
  "the", "is", "my", "you", "your", "what", "this", "that", "with", "he", "she", "we", "they",
  "have", "has", "like", "hello", "goodbye", "please", "thank", "thanks", "morning", "where", "how",
]);

/** Les citations « … » et “ … ” : l'anglais qu'on y met est celui qu'on enseigne. */
function withoutQuotes(text: string): string {
  return text.replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, " ");
}

function englishWords(text: string): string[] {
  // Sans retirer les accents : « thé » n'est pas « the ».
  const words = withoutQuotes(text).toLowerCase().split(/[^\p{L}]+/u);
  return Array.from(new Set(words.filter((word) => ENGLISH_MARKERS.has(word))));
}

// ===========================================================================
// LE CONTRÔLEUR
// ===========================================================================

class Findings {
  private readonly byCode = new Map<DefectCode, string[]>();

  add(code: DefectCode, detail: string): void {
    const list = this.byCode.get(code);
    if (list) {
      if (!list.includes(detail)) list.push(detail);
    } else {
      this.byCode.set(code, [detail]);
    }
  }

  /** Une entrée par code, les `blocking` d'abord. */
  list(): AuditDefect[] {
    const defects = Array.from(this.byCode, ([code, details]) => ({
      code,
      severity: DEFECT_SEVERITY[code] as Severity,
      detail: details.slice(0, 3).join(" ; "),
    }));
    return [
      ...defects.filter((defect) => defect.severity === "blocking"),
      ...defects.filter((defect) => defect.severity === "warning"),
    ];
  }
}

const ANGLAIS = /anglais|english/i;
const FRANCAIS = /fran[cç]ais|langue/i;

export function auditExercise(input: AuditInput): AuditDefect[] {
  const found = new Findings();
  try {
    auditInto(found, input);
  } catch {
    // Un payload que le contrôleur ne sait pas lire est un payload qu'aucun
    // écran ne saura lire.
    found.add("payload_malformed", "le contenu de l'exercice n'a pas la forme attendue");
  }
  return found.list();
}

function auditInto(found: Findings, input: AuditInput): void {
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  const payload = asRecord(input.payload);
  const classic = ["qcm", "match", "order", "drag-drop", "short-answer", "fill-blank"].includes(input.type);
  const subject = input.subject ?? null;

  auditPrompt(found, input, prompt, payload);
  auditText(found, input, payload, classic);

  if (classic) {
    if (!payload) {
      found.add("payload_malformed", `un exercice « ${input.type} » sans contenu`);
    } else {
      switch (input.type) {
        case "qcm":
          auditQcm(found, input, payload, subject);
          break;
        case "match":
          auditMatch(found, payload);
          break;
        case "order":
          auditOrder(found, prompt, payload);
          break;
        case "drag-drop":
          auditDragDrop(found, payload);
          break;
        case "short-answer":
          auditShortAnswer(found, prompt, payload);
          break;
        case "fill-blank":
          auditFillBlank(found, payload);
          break;
        default:
          break;
      }
      auditHints(found, input, prompt, payload);
    }
  }
}

// ---------------------------------------------------------------------------
// L'énoncé
// ---------------------------------------------------------------------------

/** Ces mots ne finissent jamais une phrase : elle est coupée. */
const HARD_DANGLING = new Set(["de", "dans", "avec", "pour", "sans", "sous", "chez", "vers", "que", "qui"]);
/** Ceux-là finissent parfois une consigne sur des homophones (« et ou est ») : un avertissement seulement. */
const SOFT_DANGLING = new Set(["le", "la", "les", "un", "une", "du", "des", "au", "aux", "et", "ou", "en", "par", "sur"]);

const COMPLETE_FIRST = /^[^\p{L}]*(?:compl[èe]te|compl[ée]tez|compl[ée]ter|remplis|remplissez)(?![\p{L}])/iu;
const HOLE_MARK = /_|…|\.{3}|\?|□|▢|\[\s*\]|\(\s*\)|=\s*$|(?<![\p{L}])manque(?![\p{L}])/u;
const COMPLETES_A_SERIES = /(?<![\p{L}])(?:suite|série|serie|tableau|colonne|ligne|frise|liste)(?![\p{L}])/iu;

function auditPrompt(
  found: Findings,
  input: AuditInput,
  prompt: string,
  payload: Record<string, unknown> | null,
): void {
  const text = prompt.trim();
  if (!/[\p{L}\p{N}]/u.test(text) && !PICTOGRAPH.test(text)) {
    found.add("prompt_empty", "l'énoncé est vide");
    return;
  }
  if (text.replace(/\s/g, "").length < 4) {
    found.add("prompt_too_short", `l'énoncé « ${text} » est trop court pour être compris`);
  }

  // Une phrase coupée.
  if (/[,;(\[{]$/.test(text)) {
    found.add("prompt_truncated", `l'énoncé s'arrête au milieu d'une phrase : « …${excerpt(text.slice(-30))} »`);
  } else {
    const elision = /(?<![\p{L}])(?:d|l|qu|n|s|j|c|m|t)['’]$/iu.test(text);
    const last = /([\p{L}'’-]+)$/u.exec(text)?.[1]?.toLowerCase();
    if (elision || (last && !last.includes("-") && HARD_DANGLING.has(last))) {
      found.add("prompt_truncated", `l'énoncé s'arrête au milieu d'une phrase : « …${excerpt(text.slice(-30))} »`);
    } else if (last && !last.includes("-") && SOFT_DANGLING.has(last)) {
      found.add("prompt_ends_midphrase", `l'énoncé finit sur « ${last} » : phrase peut-être coupée`);
    }
  }
  const opened = (text.match(/\(/g) ?? []).length - (text.match(/\)/g) ?? []).length;
  const quotes = (text.match(/«/g) ?? []).length - (text.match(/»/g) ?? []).length;
  const curly = (text.match(/“/g) ?? []).length - (text.match(/”/g) ?? []).length;
  const straight = (text.match(/"/g) ?? []).length;
  if (opened > 0 || quotes > 0 || curly > 0 || straight % 2 === 1) {
    found.add("prompt_unclosed_pair", "une parenthèse ou un guillemet ouvert n'est jamais fermé");
  }

  // « : » final : rien à répondre derrière, pour un type qui ne montre rien en dessous.
  // Pas quand la matière vient d'être citée (« Écris le pluriel de 'mangue' : ») :
  // la zone de réponse suit l'énoncé.
  if (input.type === "short-answer" && /:\s*$/.test(text) && !/['‘’«“"][^'‘’«»“”"]+['’»”"]\s*:\s*$/u.test(text)) {
    found.add("prompt_dangling_colon", `l'énoncé finit par « : » et rien ne suit : « …${excerpt(text.slice(-30))} »`);
  }

  // Une scène que l'écran ne montre pas.
  const missing = findMissingVisualOnScreen(prompt, input.type, payload);
  if (missing) {
    found.add(
      "visual_missing",
      missing === "counts_what_is_not_there"
        ? "l'énoncé fait compter des objets qui ne sont pas à l'écran"
        : "l'énoncé renvoie à une image, un dessin ou des objets qui ne sont pas à l'écran",
    );
  }

  // Un trou promis, sans trou.
  if (
    input.type !== "fill-blank" &&
    COMPLETE_FIRST.test(text) &&
    !COMPLETES_A_SERIES.test(text) &&
    !HOLE_MARK.test(text.replace(/\?\s*$/, ""))
  ) {
    found.add("hole_without_hole", "l'énoncé demande de compléter mais ne montre aucun trou (___ ou ?)");
  }

  if (input.type === "short-answer" && input.class === "CI") {
    found.add("short_answer_in_ci", "une réponse à écrire au clavier, que l'enfant de CI ne sait pas encore faire");
  }

  const ceiling = input.class ? PROMPT_WORD_CEILING[input.class] : undefined;
  if (ceiling !== undefined) {
    const words = wordCount(text);
    if (words > ceiling) {
      found.add("prompt_too_long_for_class", `${words} mots en ${input.class}, au-delà de ${ceiling}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Le texte de tout l'exercice
// ---------------------------------------------------------------------------

function auditText(
  found: Findings,
  input: AuditInput,
  payload: Record<string, unknown> | null,
  classic: boolean,
): void {
  for (const { where, text } of shownTexts(input, payload)) {
    if (PLACEHOLDER.test(text) || NOT_A_NUMBER.test(text)) {
      found.add("text_placeholder", `« undefined », « null » ou un champ non rempli dans ${where} : « ${excerpt(text)} »`);
    }
    if (text.includes("�")) {
      found.add("text_replacement_char", `caractère illisible (�) dans ${where} : « ${excerpt(text)} »`);
    }
    if (!classic) continue;
    if (/\S[ ]{2,}\S/.test(text)) {
      found.add("text_double_space", `espaces doubles dans ${where} : « ${excerpt(text)} »`);
    }
    if (MARKUP.some((pattern) => pattern.test(text))) {
      found.add("text_markup", `balise ou markdown dans ${where} : « ${excerpt(text)} »`);
    }
    if (CURRENCY.test(text) || CURRENCY_CODE.test(text)) {
      found.add("text_foreign_currency", `monnaie étrangère dans ${where} (le franc CFA seul) : « ${excerpt(text)} »`);
    }
  }
  // L'anglais d'un énoncé de CI ou de CP, hors de la matière qui l'enseigne.
  if (
    classic &&
    (input.class === "CI" || input.class === "CP") &&
    input.subject &&
    !ANGLAIS.test(input.subject)
  ) {
    const words = englishWords(input.prompt);
    if (words.length > 0) {
      found.add("text_english_in_young_class", `mots anglais dans un énoncé de ${input.class} : ${words.join(", ")}`);
    }
  }
}

// ---------------------------------------------------------------------------
// QCM
// ---------------------------------------------------------------------------

const CATCH_ALL =
  /^(?:toutes?\s+(?:les\s+|ces\s+)?(?:r[ée]ponses?|propositions?|options?|choix)(?:\s+ci-dessus)?|toutes?\s+ces\s+(?:r[ée]ponses?|propositions?)|aucune?\s+(?:de\s+)?(?:ces|les|ses)\s+(?:r[ée]ponses?|propositions?|options?|choix)|aucune?\s+r[ée]ponse|aucune?\s+des\s+(?:r[ée]ponses?|propositions?|options?)|les\s+(?:deux|trois)(?:\s+(?:r[ée]ponses?|propositions?))?(?:\s+ci-dessus)?|tous?\s+(?:les\s+)?(?:deux|trois)|a\s+et\s+b|b\s+et\s+c|a\s+et\s+c|all of the above|none of the above|both)$/iu;

/**
 * L'énoncé interroge l'écriture d'un nombre, pas sa valeur : « Quel nombre est
 * écrit en chiffres ? » oppose légitimement « 450 » et « quatre cent cinquante »,
 * « Quel nombre est juste en écriture ? » « cent » et « cents ».
 */
const ASKS_ABOUT_WRITING =
  /(?<!\p{L})(?:en\s+(?:chiffres?|lettres?)|[ée]crit(?:e|es|s)?|[ée]criture|orthograph\p{L}*|s['’][ée]crit|[ée]cris|[ée]crivez|[ée]crire)(?!\p{L})/iu;

function auditQcm(
  found: Findings,
  input: AuditInput,
  payload: Record<string, unknown>,
  subject: string | null,
): void {
  const rawOptions = Array.isArray(payload.options) ? payload.options : [];
  const options = rawOptions.map((option) => (typeof option === "string" ? option : ""));
  const count = options.length;
  if (count < 2) {
    found.add("qcm_options_few", `${count} option${count > 1 ? "s" : ""} : il en faut au moins 2`);
  } else if (count > MAX_QCM_OPTIONS) {
    found.add("qcm_options_many", `${count} options, au plus ${MAX_QCM_OPTIONS}`);
  }

  const index = payload.correctIndex;
  const correct =
    typeof index === "number" && Number.isInteger(index) && index >= 0 && index < count ? index : -1;
  if (correct === -1) {
    found.add(
      "qcm_correct_index_out_of_range",
      `la bonne réponse désigne l'option ${String(index)} sur ${count} : aucune option ne correspond`,
    );
  }

  // Vides.
  options.forEach((option, i) => {
    if (collapse(option) !== "") return;
    if (i === correct) found.add("qcm_correct_option_empty", `l'option juste (n° ${i + 1}) est vide`);
    else found.add("qcm_option_empty", `l'option n° ${i + 1} est vide`);
  });

  // Dupliquées : identiques à la casse près, aux espaces près, aux accents près.
  const exact = new Map<string, number[]>();
  const loose = new Map<string, Set<string>>();
  options.forEach((option, i) => {
    const key = collapse(option);
    if (key === "") return;
    exact.set(key, [...(exact.get(key) ?? []), i]);
    const folded = fold(option);
    loose.set(folded, (loose.get(folded) ?? new Set()).add(key));
  });
  for (const [key, positions] of exact) {
    if (positions.length < 2) continue;
    if (positions.includes(correct)) {
      found.add("qcm_correct_option_duplicated", `l'option juste « ${excerpt(key)} » est écrite deux fois`);
    } else {
      found.add("qcm_option_duplicated", `l'option « ${excerpt(key)} » est écrite deux fois`);
    }
  }
  // « a » et « à », « Paris » et « paris » : une leçon d'orthographe les oppose légitimement.
  if (!(subject && FRANCAIS.test(subject) && !ANGLAIS.test(subject))) {
    for (const [, variants] of loose) {
      if (variants.size > 1) {
        found.add("qcm_option_case_twin", `options qui ne diffèrent que par la casse ou les accents : ${Array.from(variants).map((v) => `« ${excerpt(v, 25)} »`).join(", ")}`);
      }
    }
  }

  // Deux écritures du même nombre : « 5 » et « cinq », « 0,5 » et « 0.50 ».
  const forms = options.map((option) => numberForm(option));
  const writingQuestion = ASKS_ABOUT_WRITING.test(input.prompt);
  for (let i = 0; i < count && !writingQuestion; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = forms[i];
      const b = forms[j];
      if (!a || !b || (a.fraction && b.fraction)) continue;
      if (collapse(options[i]) === collapse(options[j])) continue;
      if (Math.abs(a.value - b.value) > 1e-9) continue;
      const detail = `« ${excerpt(options[i], 25)} » et « ${excerpt(options[j], 25)} » valent le même nombre`;
      if (i === correct || j === correct) found.add("qcm_equivalent_options_with_correct", detail);
      else found.add("qcm_equivalent_options", detail);
    }
  }

  // « Toutes les réponses », « Aucune de ces réponses », « Les deux ».
  for (const option of options) {
    if (CATCH_ALL.test(collapse(option).replace(/[.!]+$/, ""))) {
      found.add("qcm_catch_all_option", `l'option « ${excerpt(option, 40)} » dépend des autres options`);
    }
  }

  // La bonne réponse se devine à sa longueur.
  if (correct !== -1) {
    const length = (text: string) => collapse(text.replace(PICTOGRAPHS, "")).length;
    const others = options.filter((_, i) => i !== correct && collapse(options[i]) !== "");
    const longest = Math.max(0, ...others.map(length));
    if (others.length >= 2 && length(options[correct]) >= 24 && length(options[correct]) >= 2 * longest) {
      found.add(
        "qcm_correct_option_stands_out",
        `la bonne option fait ${length(options[correct])} caractères, les autres ${longest} au plus : elle se devine à sa longueur`,
      );
    }
  }

  // La réponse écrite par le modèle contre l'option qu'il désigne.
  const key = typeof input.answerKey === "string" ? input.answerKey : "";
  if (key.trim() !== "" && correct !== -1) {
    const foldedKey = fold(key);
    const keyNumber = numberForm(key);
    const matches = options.flatMap((option, i) => {
      const foldedOption = fold(option);
      if (foldedOption === "") return [];
      const optionNumber = numberForm(option);
      const sameNumber = keyNumber && optionNumber && Math.abs(keyNumber.value - optionNumber.value) < 1e-9;
      const contained =
        foldedKey.length >= 2 && foldedOption.length >= 2 && (hasWord(foldedKey, foldedOption) || hasWord(foldedOption, foldedKey));
      return foldedOption === foldedKey || sameNumber || contained ? [i] : [];
    });
    if (matches.length > 0) {
      if (!matches.includes(correct)) {
        found.add(
          "qcm_answer_key_mismatch",
          `la réponse écrite « ${excerpt(key, 40)} » est l'option « ${excerpt(options[matches[0]], 40)} », mais l'option désignée est « ${excerpt(options[correct], 40)} »`,
        );
      }
    } else {
      const letter = /^\(?([a-f])[).]?$/i.exec(key.trim());
      const digit = /^\(?([1-6])[).]?$/.exec(key.trim());
      const pointed = letter ? letter[1].toLowerCase().charCodeAt(0) - 97 : digit ? Number(digit[1]) - 1 : null;
      if (pointed !== null && pointed < count) {
        if (pointed !== correct) {
          found.add(
            "qcm_answer_key_mismatch",
            `la réponse écrite « ${key.trim()} » désigne l'option n° ${pointed + 1}, mais l'option désignée est la n° ${correct + 1}`,
          );
        }
      } else {
        found.add(
          "qcm_answer_key_unrelated",
          `la réponse écrite « ${excerpt(key, 40)} » ne ressemble à aucune option`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Association
// ---------------------------------------------------------------------------

function auditMatch(found: Findings, payload: Record<string, unknown>): void {
  const pairs = (Array.isArray(payload.pairs) ? payload.pairs : [])
    .map((pair) => asRecord(pair))
    .filter((pair): pair is Record<string, unknown> => pair !== null)
    .map((pair) => ({
      left: typeof pair.left === "string" ? pair.left : "",
      right: typeof pair.right === "string" ? pair.right : "",
    }));
  if (pairs.length < 2) {
    found.add("match_pairs_invalid", `${pairs.length} paire : il en faut au moins 2 pour associer`);
    return;
  }
  if (pairs.length < MIN_MATCH_PAIRS || pairs.length > MAX_MATCH_PAIRS) {
    found.add("match_pairs_count", `${pairs.length} paires, entre ${MIN_MATCH_PAIRS} et ${MAX_MATCH_PAIRS} attendues`);
  }
  if (pairs.some((pair) => collapse(pair.left) === "" || collapse(pair.right) === "")) {
    found.add("match_side_empty", "une paire a un côté vide");
  }
  const seenPair = new Set<string>();
  const lefts = new Map<string, number>();
  const rights = new Map<string, number>();
  for (const pair of pairs) {
    const left = collapse(pair.left);
    const right = collapse(pair.right);
    if (left === "" || right === "") continue;
    const id = JSON.stringify([fold(left), fold(right)]);
    if (seenPair.has(id)) found.add("match_pair_duplicated", `la paire « ${excerpt(left, 25)} » – « ${excerpt(right, 25)} » est écrite deux fois`);
    seenPair.add(id);
    lefts.set(fold(left), (lefts.get(fold(left)) ?? 0) + 1);
    rights.set(fold(right), (rights.get(fold(right)) ?? 0) + 1);
  }
  const repeated = (counts: Map<string, number>) => Array.from(counts).filter(([, n]) => n > 1).map(([text]) => `« ${excerpt(text, 25)} »`);
  const repeatedLeft = repeated(lefts);
  const repeatedRight = repeated(rights);
  if (repeatedLeft.length > 0) found.add("match_left_repeated", `côté gauche répété : ${repeatedLeft.join(", ")}`);
  if (repeatedRight.length > 0) found.add("match_right_repeated", `côté droit répété : ${repeatedRight.join(", ")}`);
}

// ---------------------------------------------------------------------------
// Remise en ordre
// ---------------------------------------------------------------------------

const ORDER_SAYS =
  /(?<![\p{L}])(?:ordre|croissants?|d[ée]croissants?|alphab\w*|chronolog\w*|[ée]tapes?|plus|moins|suite|phrase|histoire|dialogue|syllabes?|d'abord|ensuite|puis|avant|apr[èe]s|premier|derni\w*|début|fin|range[rz]?|remets?|remettre|reconstitue\w*|classe[rz]?|num[ée]rote\w*|file|rang|jours?|mois|saisons?|semaine|cycle|phases?|temps|si[èe]cle|date|grand|petit)(?![\p{L}])/iu;

function auditOrder(found: Findings, prompt: string, payload: Record<string, unknown>): void {
  const sequence = strings(payload.correctSequence);
  if (sequence.length < 2) {
    found.add("order_too_few", `${sequence.length} élément : il en faut au moins 2 pour ordonner`);
    return;
  }
  if (sequence.length < 3) found.add("order_few", "2 éléments seulement : l'enfant a une chance sur deux");
  if (sequence.some((item) => collapse(item) === "")) found.add("order_item_empty", "un élément de la suite est vide");

  const seen = new Set<string>();
  for (const item of sequence) {
    const key = collapse(item);
    if (key === "") continue;
    if (seen.has(key)) found.add("order_item_duplicated", `l'élément « ${excerpt(key, 25)} » est écrit deux fois`);
    seen.add(key);
  }

  // Une suite rangée dans l'ordre alphabétique ou croissant sans que l'énoncé dise quel ordre.
  if (sequence.length >= 3 && !ORDER_SAYS.test(prompt)) {
    const numbers = sequence.map((item) => numberForm(item));
    const numeric = numbers.every((n) => n !== null);
    const ascending = numeric
      ? numbers.every((n, i) => i === 0 || n!.value > numbers[i - 1]!.value)
      : sequence.every((item, i) => i === 0 || fold(sequence[i - 1]).localeCompare(fold(item), "fr") < 0);
    if (ascending) {
      found.add(
        "order_already_sorted",
        "la suite est déjà rangée par ordre alphabétique ou croissant, et l'énoncé ne dit pas quel ordre suivre",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Glisser-déposer
// ---------------------------------------------------------------------------

function auditDragDrop(found: Findings, payload: Record<string, unknown>): void {
  // Les étiquettes se comparent aux zones TELLES QU'ÉCRITES : l'écran envoie le
  // texte de la zone, `verifyDragDrop` le compare sans le nettoyer.
  const rawZones = strings(payload.zones);
  const zones = rawZones.map(collapse);
  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => ({
      text: typeof item.text === "string" ? item.text : "",
      zone: typeof item.correctZone === "string" ? item.correctZone : "",
    }));

  // Les accents comptent : « a » et « à » sont deux zones pour l'écran et pour
  // `verifyDragDrop` (une leçon d'homophones les oppose).
  const distinct = new Set(zones.filter((zone) => zone !== "").map((zone) => zone.toLocaleLowerCase("fr")));
  if (distinct.size < 2) found.add("dragdrop_zones_few", "il faut au moins 2 zones différentes");
  if (zones.length > distinct.size && distinct.size >= 2) {
    found.add("dragdrop_zone_duplicated", "deux zones portent le même nom");
  }
  if (items.length < 2) found.add("dragdrop_items_few", `${items.length} étiquette : il en faut au moins 2`);

  const generic = zones.filter((zone) => isGenericZoneLabel(zone));
  if (generic.length > 0) {
    found.add("dragdrop_generic_zone", `zones sans sens pour l'enfant : ${generic.map((zone) => `« ${zone} »`).join(", ")}`);
  }

  const used = new Set<string>();
  for (const item of items) {
    if (collapse(item.text) === "") found.add("dragdrop_item_empty", "une étiquette est vide");
    if (collapse(item.zone) === "") {
      found.add("dragdrop_label_without_zone", `l'étiquette « ${excerpt(item.text, 25)} » n'a pas de zone`);
    } else if (!rawZones.includes(item.zone)) {
      found.add(
        "dragdrop_zone_missing",
        `l'étiquette « ${excerpt(item.text, 25)} » va dans « ${excerpt(item.zone, 25)} », qui n'est pas une zone`,
      );
    } else {
      used.add(item.zone);
    }
  }
  if (items.length >= 2) {
    const empty = rawZones.filter((zone) => collapse(zone) !== "" && !used.has(zone));
    if (empty.length > 0 && !items.some((item) => collapse(item.zone) === "" || !rawZones.includes(item.zone))) {
      found.add("dragdrop_empty_zone", `aucune étiquette ne va dans ${empty.map((zone) => `« ${excerpt(zone, 25)} »`).join(", ")}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Réponse courte
// ---------------------------------------------------------------------------

function auditShortAnswer(found: Findings, prompt: string, payload: Record<string, unknown>): void {
  const accepted = strings(payload.acceptedAnswers);
  const filled = accepted.filter((answer) => collapse(answer) !== "");
  if (filled.length === 0) {
    found.add("short_answer_no_answer", "aucune réponse acceptée");
    return;
  }
  if (filled.length < accepted.length) {
    found.add("short_answer_empty_accepted", "une des réponses acceptées est vide");
  }
  // L'énoncé ne contient pas sa réponse (un nombre peut y figurer : « 10 − 3 + 3 »).
  const first = fold(filled[0]);
  if (first.length >= 3 && numberForm(first) === null && hasWord(fold(prompt), first)) {
    found.add("short_answer_answer_in_prompt", `la réponse « ${excerpt(filled[0], 30)} » est écrite dans l'énoncé`);
  }
}

// ---------------------------------------------------------------------------
// Phrase à trous
// ---------------------------------------------------------------------------

function auditFillBlank(found: Findings, payload: Record<string, unknown>): void {
  if (validateFillBlank(payload).valid) return;
  const text = typeof payload.text === "string" ? payload.text.replace(/_{2,}/g, BLANK_MARK).trim() : "";
  const blanks = (Array.isArray(payload.blanks) ? payload.blanks : [])
    .map((blank) => asRecord(blank))
    .filter((blank): blank is Record<string, unknown> => blank !== null)
    .map((blank) => ({
      options: Array.from(new Set(strings(blank.options).map((option) => option.trim()).filter(Boolean))),
      answer: typeof blank.answer === "string" ? blank.answer.trim() : "",
    }));
  const holes = text.split(BLANK_MARK).length - 1;
  if (text === "") {
    found.add("fill_blank_invalid", "la phrase à trous est vide");
  } else if (blanks.length === 0) {
    found.add("fill_blank_invalid", "aucun mot n'est proposé pour les trous");
  } else if (holes !== blanks.length) {
    found.add("fill_blank_invalid", `${holes} trou${holes > 1 ? "s" : ""} dans la phrase, ${blanks.length} jeu${blanks.length > 1 ? "x" : ""} de mots`);
  } else if (blanks.some((blank) => !blank.options.includes(blank.answer))) {
    found.add("fill_blank_invalid", "la bonne réponse d'un trou ne figure pas parmi les mots proposés");
  } else {
    found.add("fill_blank_off_limits", "trop de trous (plus de 4), ou un trou avec moins de 2 ou plus de 5 mots");
  }
}

// ---------------------------------------------------------------------------
// Indices
// ---------------------------------------------------------------------------

type AnswerWithChoices = { answer: string; others: string[] };

/** La bonne réponse telle qu'on pourrait la lire dans un indice, avec les autres choix de l'écran. */
function answersOf(input: AuditInput, payload: Record<string, unknown>): AnswerWithChoices[] {
  switch (input.type) {
    case "qcm": {
      const options = strings(payload.options);
      const index = payload.correctIndex;
      if (typeof index !== "number" || !options[index]) return [];
      return [{ answer: options[index], others: options.filter((_, i) => i !== index) }];
    }
    case "short-answer": {
      const first = strings(payload.acceptedAnswers).find((answer) => collapse(answer) !== "");
      return first ? [{ answer: first, others: [] }] : [];
    }
    case "fill-blank":
      return (Array.isArray(payload.blanks) ? payload.blanks : []).flatMap((blank) => {
        const entry = asRecord(blank);
        const answer = entry?.answer;
        if (typeof answer !== "string" || answer.trim() === "") return [];
        return [{ answer, others: strings(entry?.options).filter((option) => option !== answer) }];
      });
    default:
      return [];
  }
}

/**
 * L'indice donne la réponse : il écrit le bon choix SANS parler des autres.
 * Un indice qui compare les choix (« Individuelle parle d'une seule personne,
 * collective de tout le monde ») les explique, il ne désigne pas le bon.
 */
function leaks(hint: string, { answer, others }: AnswerWithChoices, prompt: string): boolean {
  const foldedAnswer = fold(answer);
  if (foldedAnswer === "") return false;
  const foldedHint = fold(hint);
  const compact = collapse(answer);
  if (numberForm(answer) !== null) {
    // Un nombre figure dans bien des indices (« compte 3 mangues ») : on ne
    // retient que celui qui est donné comme le résultat.
    const digits = escapeRegExp(compact);
    return (
      new RegExp(`=\\s*${digits}(?![\\d.,])`).test(foldedHint) ||
      new RegExp(
        `(?:reponse|resultat|total|somme|produit|difference|reste|quotient)\\s+(?:est|=|:|vaut|fait|font)\\s+(?:de\\s+)?${digits}(?![\\d.,])`,
      ).test(foldedHint)
    );
  }
  if (foldedAnswer.length < 3 || !hasWord(foldedHint, foldedAnswer) || hasWord(fold(prompt), foldedAnswer)) {
    return false;
  }
  return !others.some((other) => fold(other).length >= 3 && hasWord(foldedHint, fold(other)));
}

function auditHints(
  found: Findings,
  input: AuditInput,
  prompt: string,
  payload: Record<string, unknown>,
): void {
  const hints = (input.hints ?? []).map((hint) => String(hint));
  const filled = hints.filter((hint) => collapse(hint) !== "");
  if (filled.length < 2) found.add("hints_few", `${filled.length} indice${filled.length > 1 ? "s" : ""} : il en faut au moins 2`);
  if (filled.length < hints.length) found.add("hint_empty", "un indice est vide");
  const seen = new Set<string>();
  for (const hint of filled) {
    const key = fold(hint);
    if (seen.has(key)) found.add("hints_duplicated", `l'indice « ${excerpt(hint, 40)} » est écrit deux fois`);
    seen.add(key);
  }
  if (filled.length > 0) {
    const answers = answersOf(input, payload);
    if (answers.length > 0 && answers.every((choice) => leaks(filled[0], choice, prompt))) {
      found.add("hint_gives_answer", `le premier indice donne déjà la réponse : « ${excerpt(filled[0], 50)} »`);
    }
  }
  if (withoutDanglingHints(`${prompt} ${displayedText(input.type, payload)}`, hints).length < hints.length) {
    found.add("hint_dangling_visual", "un indice renvoie à une image ou à des objets que l'énoncé ne montre pas");
  }
}

// ===========================================================================
// LES COMPTES D'UN LOT
// ===========================================================================

/** Le nombre d'exercices touchés par chaque code, pour une génération ou un audit. */
export function tallyCodes(defects: readonly AuditDefect[], into: Record<string, number>): void {
  for (const defect of defects) into[defect.code] = (into[defect.code] ?? 0) + 1;
}
