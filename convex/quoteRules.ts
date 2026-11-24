/**
 * Règles de la demande de devis d'une école — fonctions PURES.
 *
 * Une famille paie un prix affiché ; une école demande un devis (demande du
 * propriétaire, 24 novembre 2026). La vitrine lui pose les questions dont
 * l'équipe a besoin pour chiffrer : qui elle est, qui écrit, combien d'élèves
 * et de classes, quelles classes, avec ou sans le module Arabe & Coran.
 *
 * Aucune lecture de base ici : `quotes.request` passe la saisie brute et écrit
 * ce que `cleanQuoteRequest` rend. Même découpage que `waitlistRules.ts` (pur,
 * testé) / `waitlist.ts` (I/O).
 */
import { v, type Infer } from "convex/values";

import { normalizeWaitlistEmail } from "./waitlistRules";

/** Les six classes du primaire, dans l'ordre. */
export const QUOTE_LEVELS = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const;
export type QuoteLevel = (typeof QUOTE_LEVELS)[number];

export const quoteLevelValidator = v.union(
  v.literal("CI"),
  v.literal("CP"),
  v.literal("CE1"),
  v.literal("CE2"),
  v.literal("CM1"),
  v.literal("CM2"),
);

export const quoteSchoolTypeValidator = v.union(
  v.literal("privee"),
  v.literal("publique"),
  v.literal("autre"),
);
export type QuoteSchoolType = Infer<typeof quoteSchoolTypeValidator>;

export const QUOTE_SCHOOL_TYPE_LABELS: Record<QuoteSchoolType, string> = {
  privee: "École privée",
  publique: "École publique",
  autre: "Autre",
};

/**
 * Ce que l'école fournit — les champs de la table `quoteRequests` et les
 * arguments de `quotes.request`, écrits une seule fois.
 */
export const quoteRequestFields = {
  schoolName: v.string(),
  city: v.string(),
  schoolType: quoteSchoolTypeValidator,
  contactName: v.string(),
  contactRole: v.string(),
  email: v.string(),
  phone: v.string(),
  studentCount: v.number(),
  classCount: v.number(),
  // Six valeurs au plus : la liste est bornée par `QUOTE_LEVELS`.
  levels: v.array(quoteLevelValidator),
  wantsArabic: v.boolean(),
  /** Le démarrage souhaité, un jour du calendrier « AAAA-MM-JJ » (`isQuoteDate`). */
  startWhen: v.optional(v.string()),
  message: v.optional(v.string()),
};

export const quoteRequestValidator = v.object(quoteRequestFields);
export type QuoteRequest = Infer<typeof quoteRequestValidator>;

/** Le champ en faute, pour que le formulaire pose l'erreur au bon endroit. */
export type QuoteField = keyof QuoteRequest;

export type QuoteCheck =
  | { ok: true; value: QuoteRequest }
  | { ok: false; field: QuoteField; message: string };

export const QUOTE_LIMITS = {
  shortText: 120,
  message: 2000,
  maxStudents: 20000,
  maxClasses: 500,
} as const;

/** Au plus trois demandes par adresse et par jour : au-delà, c'est une erreur de saisie ou un abus. */
export const QUOTE_MAX_PER_EMAIL_PER_DAY = 3;
/** Au plus trente demandes par heure, toutes adresses confondues : chaque demande envoie un courriel. */
export const QUOTE_MAX_PER_HOUR = 30;

const collapse = (raw: string) => raw.replace(/\s+/g, " ").trim();

/**
 * Une date du calendrier, écrite « AAAA-MM-JJ » — ce que le sélecteur de date
 * du formulaire envoie pour le démarrage souhaité.
 *
 * UN JOUR, PAS UN INSTANT : aucune heure, aucun fuseau. Le 15 janvier choisi à
 * Dakar reste le 15 janvier dans le courriel, où que tourne le serveur. La
 * date doit exister (pas de 31 février) ; qu'elle soit passée ou future n'est
 * pas vérifié ici, le formulaire grise les jours passés.
 */
export function isQuoteDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** « 15 janvier 2027 », pour le formulaire et le courriel. */
export function formatQuoteDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

function fail(field: QuoteField, message: string): QuoteCheck {
  return { ok: false, field, message };
}

/**
 * Le numéro tel qu'on le stocke, ou `null`.
 *
 * LA FORME SEULEMENT : un « + » facultatif, puis de 7 à 15 chiffres, que la
 * personne a pu séparer par des espaces, des points ou des tirets. Un numéro
 * sénégalais s'écrit « 77 123 45 67 » comme « +221 77 123 45 67 » : on ne
 * devine pas l'indicatif, on garde ce qui est écrit.
 */
export function normalizeQuotePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\+?[\d\s.\-()]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

export type QuoteDial = {
  country: string;
  code: string;
  /** Les groupes de chiffres du numéro national, dans l'ordre (« 77 123 45 67 » : 2, 3, 2, 2). */
  groups: readonly number[];
  /** Un numéro d'exemple, en chiffres : il sert de modèle dans le champ. */
  example: string;
  /**
   * Le zéro de tête fait partie du numéro (Côte d'Ivoire, Bénin, Gabon). Sans
   * ce drapeau, c'est un zéro d'appel national (« 06 12… » en France, « 06… »
   * au Maroc) : il tombe, car l'indicatif le remplace.
   */
  keepZero?: boolean;
};

/**
 * Les indicatifs proposés par le formulaire : le Sénégal d'abord (choisi par
 * défaut), ses voisins et l'Afrique de l'Ouest, puis les pays d'où écrit le
 * plus souvent une école ou une famille installée à l'étranger.
 *
 * Chaque pays porte la forme de son numéro (groupes, exemple) : le formulaire
 * s'en sert pour poser le modèle dans le champ et espacer les chiffres à la
 * frappe. Ces formes sont celles des numéros mobiles courants ; elles guident
 * la saisie, elles ne refusent rien (`normalizeQuotePhone` ne regarde que le
 * nombre de chiffres).
 */
export const QUOTE_DIAL_CODES: readonly QuoteDial[] = [
  { country: "Sénégal", code: "+221", groups: [2, 3, 2, 2], example: "771234567" },
  { country: "Gambie", code: "+220", groups: [3, 4], example: "3012345" },
  { country: "Mauritanie", code: "+222", groups: [2, 2, 2, 2], example: "22123456" },
  { country: "Mali", code: "+223", groups: [2, 2, 2, 2], example: "70123456" },
  { country: "Guinée", code: "+224", groups: [3, 2, 2, 2], example: "621123456" },
  { country: "Guinée-Bissau", code: "+245", groups: [3, 3, 3], example: "955123456" },
  { country: "Cap-Vert", code: "+238", groups: [3, 2, 2], example: "9912345" },
  { country: "Côte d'Ivoire", code: "+225", groups: [2, 2, 2, 2, 2], example: "0712345678", keepZero: true },
  { country: "Burkina Faso", code: "+226", groups: [2, 2, 2, 2], example: "70123456" },
  { country: "Niger", code: "+227", groups: [2, 2, 2, 2], example: "90123456" },
  { country: "Togo", code: "+228", groups: [2, 2, 2, 2], example: "90123456" },
  { country: "Bénin", code: "+229", groups: [2, 2, 2, 2, 2], example: "0197123456", keepZero: true },
  { country: "Nigeria", code: "+234", groups: [3, 3, 4], example: "8031234567" },
  { country: "Ghana", code: "+233", groups: [2, 3, 4], example: "241234567" },
  { country: "Cameroun", code: "+237", groups: [1, 2, 2, 2, 2], example: "671234567" },
  { country: "Gabon", code: "+241", groups: [2, 2, 2, 2], example: "06123456", keepZero: true },
  { country: "Maroc", code: "+212", groups: [1, 2, 2, 2, 2], example: "612345678" },
  { country: "Algérie", code: "+213", groups: [1, 2, 2, 2, 2], example: "551234567" },
  { country: "Tunisie", code: "+216", groups: [2, 3, 3], example: "20123456" },
  { country: "France", code: "+33", groups: [1, 2, 2, 2, 2], example: "612345678" },
  { country: "Belgique", code: "+32", groups: [3, 2, 2, 2], example: "470123456" },
  { country: "Suisse", code: "+41", groups: [2, 3, 2, 2], example: "781234567" },
  { country: "Espagne", code: "+34", groups: [3, 3, 3], example: "612345678" },
  { country: "Italie", code: "+39", groups: [3, 3, 4], example: "3123456789" },
  { country: "Canada et États-Unis", code: "+1", groups: [3, 3, 4], example: "5145550123" },
];

export const QUOTE_DEFAULT_DIAL_CODE = "+221";

const dialFor = (code: string): QuoteDial =>
  QUOTE_DIAL_CODES.find((d) => d.code === code) ?? QUOTE_DIAL_CODES[0];

/** Des chiffres, espacés selon les groupes du pays. */
function groupDigits(digits: string, groups: readonly number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

/**
 * Le numéro national tel qu'il s'affiche à la frappe : espacé comme dans le pays
 * (« 771234567 » devient « 77 123 45 67 » au Sénégal, « 612345678 » devient
 * « 6 12 34 56 78 » en France), sans lettres, sans zéro d'appel national, et
 * borné au nombre de chiffres du pays.
 *
 * Qui tape son propre « + » écrit un numéro complet, avec son indicatif : on ne
 * touche à rien.
 */
export function formatQuoteLocalPhone(dialCode: string, raw: string): string {
  if (raw.trimStart().startsWith("+")) return raw;
  const dial = dialFor(dialCode);
  let digits = raw.replace(/\D/g, "");
  if (!dial.keepZero) digits = digits.replace(/^0+/, "");
  const max = dial.groups.reduce((sum, size) => sum + size, 0);
  return groupDigits(digits.slice(0, max), dial.groups);
}

/** Le modèle posé dans le champ vide, au format du pays. */
export function quotePhoneExample(dialCode: string): string {
  const dial = dialFor(dialCode);
  return groupDigits(dial.example, dial.groups);
}

/**
 * Le numéro complet, à partir de l'indicatif choisi et de ce que la personne a
 * tapé. Qui a tapé son propre « + » a déjà écrit un numéro complet : on le
 * garde tel quel.
 */
export function joinQuotePhone(dialCode: string, local: string): string {
  const typed = local.trim();
  if (typed.startsWith("+")) return typed;
  return `${dialCode} ${formatQuoteLocalPhone(dialCode, typed)}`;
}

function requiredText(field: QuoteField, raw: string, label: string): QuoteCheck | string {
  const text = collapse(raw);
  if (text === "") return fail(field, `${label} est obligatoire.`);
  if (text.length > QUOTE_LIMITS.shortText) {
    return fail(field, `${label} est trop long (${QUOTE_LIMITS.shortText} caractères au plus).`);
  }
  return text;
}

function count(field: QuoteField, raw: number, max: number, label: string): QuoteCheck | number {
  if (!Number.isInteger(raw) || raw < 1) return fail(field, `${label} doit être un nombre entier, au moins 1.`);
  if (raw > max) return fail(field, `${label} ne peut pas dépasser ${max}.`);
  return raw;
}

/**
 * La demande telle qu'on la stocke, ou le premier champ en faute.
 *
 * Les textes sont débarrassés de leurs espaces en trop ; l'adresse passe par
 * la même normalisation que la liste d'attente ; les classes sont dédoublonnées
 * et rangées du CI au CM2 ; un champ facultatif laissé vide n'est pas stocké.
 */
export function cleanQuoteRequest(raw: QuoteRequest): QuoteCheck {
  const schoolName = requiredText("schoolName", raw.schoolName, "Le nom de l'école");
  if (typeof schoolName !== "string") return schoolName;
  const city = requiredText("city", raw.city, "La ville");
  if (typeof city !== "string") return city;
  const contactName = requiredText("contactName", raw.contactName, "Votre nom");
  if (typeof contactName !== "string") return contactName;
  const contactRole = requiredText("contactRole", raw.contactRole, "Votre fonction");
  if (typeof contactRole !== "string") return contactRole;

  const email = normalizeWaitlistEmail(raw.email);
  if (email === null) return fail("email", "Cette adresse e-mail n'est pas valide.");
  const phone = normalizeQuotePhone(raw.phone);
  if (phone === null) return fail("phone", "Ce numéro de téléphone n'est pas valide.");

  const studentCount = count("studentCount", raw.studentCount, QUOTE_LIMITS.maxStudents, "Le nombre d'élèves");
  if (typeof studentCount !== "number") return studentCount;
  const classCount = count("classCount", raw.classCount, QUOTE_LIMITS.maxClasses, "Le nombre de classes");
  if (typeof classCount !== "number") return classCount;

  const levels = QUOTE_LEVELS.filter((level) => raw.levels.includes(level));
  if (levels.length === 0) return fail("levels", "Choisissez au moins une classe.");

  const startWhen = (raw.startWhen ?? "").trim();
  if (startWhen !== "" && !isQuoteDate(startWhen)) {
    return fail("startWhen", "Cette date de démarrage n'est pas valide.");
  }
  // Le message garde ses retours à la ligne : seuls les bords sont rognés.
  const message = (raw.message ?? "").trim();
  if (message.length > QUOTE_LIMITS.message) {
    return fail("message", `Le message est trop long (${QUOTE_LIMITS.message} caractères au plus).`);
  }

  return {
    ok: true,
    value: {
      schoolName,
      city,
      schoolType: raw.schoolType,
      contactName,
      contactRole,
      email,
      phone,
      studentCount,
      classCount,
      levels,
      wantsArabic: raw.wantsArabic,
      ...(startWhen === "" ? {} : { startWhen }),
      ...(message === "" ? {} : { message }),
    },
  };
}
