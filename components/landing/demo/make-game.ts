/**
 * UN JEU FABRIQUÉ À LA DEMANDE, pour la démonstration de la vitrine.
 *
 * Les jeux (frises, dessin sur quadrillage, écoute, atelier des couleurs) ne
 * sont pas écrits par le modèle : le code les calcule (`convex/paliers/games`),
 * à la classe et à la difficulté demandées. La vitrine appelle donc les
 * MÊMES générateurs que l'application : le jeu qu'un parent essaie ici est
 * celui que son enfant aura, à sa classe.
 *
 * « UN AUTRE EXEMPLE » avance `round` : une autre graine, donc un autre
 * dessin ou une autre frise ; il passe aussi d'une variante du jeu à la
 * suivante (une classe peut en demander plusieurs, de thématiques
 * différentes) et monte la difficulté d'un cran, pour qu'on voie l'échelle
 * découverte → maîtrise. Le premier exemple est le niveau « consolidation ».
 *
 * Importé par le lot des cartes (`demo-cards.tsx`), jamais par la vitrine
 * seule : ces générateurs ne se chargent qu'à la demande.
 */
import { GAME_KINDS } from "@/convex/paliers/games";
import { makeContext, type GameLevel } from "@/convex/paliers/games/shared";
import type { GameOffer } from "./demo-matrix";
import type { DemoClass, DemoSubject, PlayableExercise } from "./demo-types";

/** L'ordre des exemples : consolidation d'abord, puis on monte, puis on recommence au début. */
const LEVELS: readonly GameLevel[] = [2, 3, 4, 1];

export function makeGame(
  subject: DemoSubject,
  klass: DemoClass,
  offer: GameOffer,
  round: number,
): PlayableExercise {
  const option = offer.options[round % offer.options.length];
  const level = LEVELS[round % LEVELS.length];
  const id = `demo:${subject}:${klass}:${option.kind}:${round}`;
  const made = GAME_KINDS[option.kind].make(makeContext(klass, level, id));
  return {
    id,
    type: made.type,
    prompt: made.prompt,
    payload: made.payload,
    hints: made.hints,
    topic: option.topic,
    stage: level,
    gameLabel: GAME_KINDS[option.kind].label,
  };
}
