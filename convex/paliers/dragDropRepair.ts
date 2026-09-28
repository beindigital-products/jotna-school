/**
 * RÉPARER UN GLISSER-DÉPOSER QUE L'ENFANT NE PEUT PAS COMPRENDRE.
 *
 * Le modèle produit trois formes de glisser-déposer sans queue ni tête :
 *
 *   1. Des zones nommées « Zone A », « Zone B », « zone1 » : « Associe
 *      chaque produit avec son résultat » sans aucun résultat à l'écran.
 *      L'enfant voit trois boîtes vides de sens.
 *   2. Une étiquette identique à sa zone (« a » à poser sur « a ») : un
 *      choix de mot dans une phrase, mis en glisser-déposer. La bonne
 *      réponse est le nom de la zone ; le geste ne teste rien.
 *   3. Une zone cible qui n'existe pas (« 3 » va dans « 6 », et « 6 » n'est
 *      pas une zone) : l'exercice est injouable, quoi qu'on fasse.
 *
 * On répare ce qu'on sait réparer, sans rien inventer :
 *
 *   - Un ordre à reconstituer (l'énoncé parle d'ordre, de phrase, de
 *     syllabes ; une étiquette par zone) devient un exercice `order`, la
 *     suite étant l'ordre des zones.
 *   - Des étiquettes qui sont des calculs (« 2 × 6 ») sous des zones
 *     génériques : les zones prennent le résultat calculé (« 12 »).
 *   - Une étiquette identique à sa zone, avec une seule bonne réponse
 *     (« a » dans « Mariama ___ un collier ») devient un QCM dont les
 *     options sont les zones.
 *   - Une zone cible qui diffère seulement par la casse ou les espaces est
 *     remise d'aplomb.
 *
 * Le reste est déclaré irréparable : à la génération, l'exercice est écarté ;
 * en base, son palier repasse en `stale` pour être régénéré. Module pur, sans
 * Convex, testé dans `convex/__tests__/dragDropRepair.test.ts`.
 */
import { formatNumber, solveOrEvaluate } from "./mathRepair";

export type DragDropItem = { text: string; correctZone: string };

export type DragDropRepairInput = {
  prompt: string;
  payload: unknown;
  /** La réponse écrite par le modèle : elle désigne l'option d'un QCM. */
  answerKey: string;
};

export type DragDropRepairOutcome =
  | { kind: "ok" }
  /** Zones remises d'aplomb (casse, espaces) : même exercice, payload propre. */
  | { kind: "cleaned"; payload: { zones: string[]; items: DragDropItem[] } }
  | { kind: "order"; payload: { correctSequence: string[] }; answerKey: string }
  | { kind: "qcm"; payload: { options: string[]; correctIndex: number }; answerKey: string }
  | {
      kind: "relabeled";
      payload: { zones: string[]; items: DragDropItem[] };
      answerKey: string;
    }
  | {
      kind: "unrepairable";
      reason: "shape" | "zone_missing" | "generic_zones" | "tautology";
    };

/** « Zone A », « zone 1 », « ZONE B », « zone3 » : un nom de boîte, pas une étiquette. */
export function isGenericZoneLabel(label: string): boolean {
  return /^(zone|case|boîte|boite|groupe|colonne)\s*[a-z0-9]{0,2}$/i.test(label.trim());
}

const ORDER_PROMPT = /\b(ordre|croissant|décroissant|decroissant|phrase|dialogue|chronolog\w*|étapes?|etapes?|séquence|sequence|syllabes?|former (?:le|un) mot)\b/i;

export function repairDragDrop(input: DragDropRepairInput): DragDropRepairOutcome {
  const p = input.payload && typeof input.payload === "object" ? (input.payload as Record<string, unknown>) : {};
  const zones = Array.isArray(p.zones)
    ? p.zones.filter((z): z is string => typeof z === "string").map((z) => z.trim()).filter(Boolean)
    : [];
  const items: DragDropItem[] = Array.isArray(p.items)
    ? p.items
        .filter(
          (it): it is { text: string; correctZone: string } =>
            !!it &&
            typeof it === "object" &&
            typeof (it as Record<string, unknown>).text === "string" &&
            typeof (it as Record<string, unknown>).correctZone === "string",
        )
        .map((it) => ({ text: it.text.trim(), correctZone: it.correctZone.trim() }))
        .filter((it) => it.text !== "")
    : [];
  if (new Set(zones).size < 2 || items.length < 2) return { kind: "unrepairable", reason: "shape" };

  // Les zones cibles qui ne diffèrent que par la casse ou les espaces.
  let cleaned = false;
  const byKey = new Map(zones.map((z) => [normalise(z), z]));
  for (const it of items) {
    if (zones.includes(it.correctZone)) continue;
    const match = byKey.get(normalise(it.correctZone));
    if (!match) return { kind: "unrepairable", reason: "zone_missing" };
    it.correctZone = match;
    cleaned = true;
  }

  const generic = zones.some(isGenericZoneLabel) || lettersWithoutInitials(zones, items);
  const tautology = items.every((it) => normalise(it.text) === normalise(it.correctZone));
  const orderable = ORDER_PROMPT.test(input.prompt) && oneItemPerZone(zones, items);

  // Un mot à choisir dans une phrase (« Mariama ___ un collier », zones
  // « a » et « à ») : la réponse du modèle nomme une zone, c'est un QCM,
  // même si l'énoncé parle de phrase.
  if (tautology && !generic) {
    const key = normalise(input.answerKey);
    const correctIndex = zones.findIndex((z) => normalise(z) === key);
    if (correctIndex !== -1 && zones.length <= 6) {
      return { kind: "qcm", payload: { options: zones, correctIndex }, answerKey: zones[correctIndex] };
    }
  }

  if ((generic || tautology) && orderable) {
    const sequence = sortedZones(zones).map((z) => items.find((it) => it.correctZone === z)!.text);
    return {
      kind: "order",
      payload: { correctSequence: sequence },
      answerKey: sequence.join(/phrase|dialogue|mot/i.test(input.prompt) ? " " : ", "),
    };
  }

  if (generic) {
    const relabeled = relabelWithResults(zones, items);
    if (relabeled) {
      return {
        kind: "relabeled",
        payload: relabeled,
        answerKey: relabeled.items.map((it) => `${it.text} = ${it.correctZone}`).join(", "),
      };
    }
    return { kind: "unrepairable", reason: "generic_zones" };
  }

  if (tautology) return { kind: "unrepairable", reason: "tautology" };

  return cleaned ? { kind: "cleaned", payload: { zones, items } } : { kind: "ok" };
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Des zones d'une seule lettre majuscule sont des étiquettes quand chaque
 * mot commence par sa lettre (« Ibrahima » sous « I », en CI). Sinon, ce
 * sont des noms de boîte (« A », « B », « C »).
 */
function lettersWithoutInitials(zones: string[], items: DragDropItem[]): boolean {
  if (!zones.every((z) => /^[A-Z]$/.test(z))) return false;
  if (items.every((it) => /^[A-Za-z]$/.test(it.text))) return false;
  return !items.every((it) => it.text.charAt(0).toUpperCase() === it.correctZone);
}

function oneItemPerZone(zones: string[], items: DragDropItem[]): boolean {
  if (items.length !== zones.length) return false;
  const seen = new Set(items.map((it) => it.correctZone));
  return seen.size === zones.length;
}

/** L'ordre des zones : par leur numéro ou leur lettre, sinon tel quel. */
function sortedZones(zones: string[]): string[] {
  const rank = (z: string): number | null => {
    const num = z.match(/(\d+)\s*$/);
    if (num) return Number(num[1]);
    const letter = z.match(/([A-Za-z])\s*$/);
    if (letter && (isGenericZoneLabel(z) || z.length === 1)) return letter[1].toUpperCase().charCodeAt(0);
    return null;
  };
  const ranks = zones.map(rank);
  if (ranks.some((r) => r === null)) return zones;
  return zones
    .map((z, i) => ({ z, r: ranks[i] as number }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.z);
}

/**
 * Chaque étiquette est un calcul (« 2 × 6 ») : sa zone prend le résultat.
 * Deux étiquettes d'une même zone doivent valoir pareil, deux zones ne
 * doivent pas se retrouver avec le même résultat.
 */
function relabelWithResults(
  zones: string[],
  items: DragDropItem[],
): { zones: string[]; items: DragDropItem[] } | null {
  if (!items.every((it) => /[+\-−×x*÷/:]/.test(it.text) && /\d/.test(it.text))) return null;
  const valueOfZone = new Map<string, number>();
  for (const it of items) {
    const value = solveOrEvaluate(it.text);
    if (value === null) return null;
    const previous = valueOfZone.get(it.correctZone);
    if (previous !== undefined && Math.abs(previous - value) > 1e-6) return null;
    valueOfZone.set(it.correctZone, value);
  }
  if (valueOfZone.size !== zones.length) return null;
  const labels = new Map<string, string>();
  for (const z of zones) labels.set(z, formatNumber(valueOfZone.get(z)!));
  if (new Set(labels.values()).size !== zones.length) return null;
  return {
    zones: zones.map((z) => labels.get(z)!),
    items: items.map((it) => ({ text: it.text, correctZone: labels.get(it.correctZone)! })),
  };
}
