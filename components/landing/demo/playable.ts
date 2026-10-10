/**
 * UN EXERCICE DE LA BANQUE, PRÊT À JOUER : la forme que lit le lecteur
 * (`demo-player.tsx`), avec un identifiant stable, et la vue qu'en reçoit
 * l'enfant.
 *
 * L'identifiant sert de graine au mélange des tuiles (`sanitizePayload`) : le
 * même exercice se remélange pareil, d'une visite à l'autre.
 */
import { sanitizePayload } from "@/convex/paliers/exerciseRules";
import type { ClassicItem, DemoClass, DemoSubject, PlayableExercise } from "./demo-types";

const NBSP = "\u00a0";

/** Les unités qui ne se séparent pas de leur nombre : « 60 km », « 8 h », « 500 F ». */
const UNITS = "km|m|cm|mm|dm|kg|g|L|dL|cL|mL|h|min|F|FCFA|%";

/**
 * LA TYPOGRAPHIE FRANÇAISE des textes de la banque : des espaces INSÉCABLES.
 *
 * Un nombre à plusieurs tranches (« 1 200 000 000 ») ne doit pas se couper en
 * deux sur la ligne d'un téléphone : l'enfant lirait « 1 200 000 », puis
 * « 000 » à la ligne. Il en va de même d'un nombre et de son unité (« 60 km »),
 * d'un guillemet français et de son mot, d'un point d'interrogation, d'un
 * point d'exclamation, d'un deux-points ou d'un point-virgule, qui ne doivent
 * jamais commencer une ligne.
 *
 * La banque s'écrit avec des espaces ordinaires (lisibles dans le code, et le
 * QCM retrouve sa bonne réponse par son texte) ; cette passe les remplace à
 * l'arrivée, PARTOUT À LA FOIS : la consigne, les propositions, les étiquettes
 * et les mots à trous restent identiques entre eux, la correction compare des
 * textes qui ont tous reçu le même traitement.
 */
export function typeset(text: string): string {
  return text
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(new RegExp(`(\\d) (?=(?:${UNITS})(?![\\p{L}\\d]))`, "gu"), `$1${NBSP}`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ ([»?!:;])/g, `${NBSP}$1`);
}

/** `typeset` sur tous les textes d'une valeur : chaînes, listes et objets, sans toucher aux nombres. */
function typesetDeep<T>(value: T): T {
  if (typeof value === "string") return typeset(value) as T;
  if (Array.isArray(value)) return value.map(typesetDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, typesetDeep(inner)])) as T;
  }
  return value;
}

export function toPlayable(item: ClassicItem, subject: DemoSubject, klass: DemoClass): PlayableExercise {
  return {
    id: `demo:${subject}:${klass}:${item.type}`,
    type: item.type,
    prompt: typeset(item.prompt),
    payload: typesetDeep(item.payload),
    hints: item.hints.map(typeset),
    topic: typeset(item.topic),
    stage: item.stage,
  };
}

type ViewShape = { items?: unknown; right?: unknown };

/** Le mélange est-il tombé sur l'arrangement déjà juste ? (mise en ordre, association) */
function alreadySolved(exercise: PlayableExercise, view: ViewShape): boolean {
  const payload = exercise.payload as { correctSequence?: unknown; pairs?: { right: unknown }[] };
  if (exercise.type === "order") return JSON.stringify(view.items) === JSON.stringify(payload.correctSequence);
  if (exercise.type === "match") {
    return JSON.stringify(view.right) === JSON.stringify((payload.pairs ?? []).map((pair) => pair.right));
  }
  return false;
}

/**
 * CE QUE L'ENFANT VOIT : le payload sans la réponse, mélangé comme la séance le
 * mélange (`sanitizePayload`). La séance, elle, laisse parfois le hasard
 * présenter des tuiles DÉJÀ rangées ; une démonstration ne le peut pas : un
 * parent qui n'a rien à déplacer croirait l'exercice cassé. Quand la graine
 * tombe sur le bon ordre, on en essaie une autre (le même exercice se mélange
 * toujours pareil : les essais sont déterministes).
 */
export function viewOf(exercise: PlayableExercise): unknown {
  for (let attempt = 0; attempt < 12; attempt++) {
    const view = sanitizePayload(exercise.type, exercise.payload, exercise.id, attempt === 0 ? "demo" : `demo:${attempt}`);
    if (!alreadySolved(exercise, view as ViewShape)) return view;
  }
  return sanitizePayload(exercise.type, exercise.payload, exercise.id, "demo");
}
