/**
 * UNE PHRASE À TROUS QUE L'ENFANT PEUT FINIR : autant de trous écrits que de
 * trous décrits, chaque trou avec deux à cinq mots dont la bonne réponse, et
 * pas deux fois le même mot. Le modèle écrit parfois « ____ » ou « ... » : on
 * ramène tout repère d'au moins deux tirets bas à `___`.
 *
 * Module pur, sans Convex : `paliers/index.ts` (la génération) et
 * `paliers/exerciseAudit.ts` (le contrôleur) s'en servent, sans que l'un
 * importe l'autre. `paliers/index.ts` le ré-exporte sous son ancien nom.
 */
import { BLANK_MARK } from "./games/types";

export function validateFillBlank(
  p: Record<string, unknown>,
  optional: Record<string, unknown> = {},
): { valid: boolean; payload: unknown } {
  const text = typeof p.text === "string" ? p.text.replace(/_{2,}/g, BLANK_MARK).trim() : "";
  const rawBlanks = Array.isArray(p.blanks) ? p.blanks : [];
  const blanks = rawBlanks
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
    .map((b) => {
      const options = Array.isArray(b.options)
        ? Array.from(new Set(b.options.filter((o): o is string => typeof o === "string").map((o) => o.trim()).filter(Boolean)))
        : [];
      const answer = typeof b.answer === "string" ? b.answer.trim() : "";
      return { options, answer };
    });
  const holes = text.split(BLANK_MARK).length - 1;
  const ok =
    text.length > 0 &&
    blanks.length >= 1 &&
    blanks.length <= 4 &&
    holes === blanks.length &&
    blanks.every((b) => b.options.length >= 2 && b.options.length <= 5 && b.options.includes(b.answer));
  if (!ok) return { valid: false, payload: p };
  return { valid: true, payload: { ...optional, text, blanks } };
}
