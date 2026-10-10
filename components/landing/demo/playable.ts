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
import { typeset } from "../typeset";

// Là où la banque la cherchait jusqu'ici : `typeset` vit dans `../typeset.ts`.
export { typeset };

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
