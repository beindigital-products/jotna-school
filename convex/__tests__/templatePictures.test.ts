import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { CATEGORIES, COLORS, MOMENTS, SIZE_SCALE, WEIGHT_SCALE, optionOf, type Thing } from "../paliers/games/things";
import { pictureForTile } from "../../lib/item-pictures";

/**
 * LA RÈGLE DU CI, TENUE PAR LES GABARITS DU CODE.
 *
 * En CI, une tuile qui nomme une chose a son image (`lib/item-images.ts`,
 * `docs/paliers-et-exercices.md`, « Des images sur les tuiles (CI) »). Le modèle
 * reçoit la liste des mots du catalogue dans sa consigne (`tilePicturesRule`) ;
 * les gabarits, eux, sont du code : ce fichier est ce qui leur impose la même
 * règle, pour toujours. Un gabarit qui nomme une chose sans image ne passe plus
 * les tests : il faut fabriquer l'image (une entrée au catalogue) OU retirer la
 * chose du gabarit. Rien ne se contourne en silence.
 */

const HOW =
  "Ajoute l'image de cette chose au catalogue (docs/paliers-et-exercices.md, « Des images sur les tuiles (CI) »), ou retire-la du gabarit.";

/** Toutes les choses des listes de `things.ts`, avec la liste qui les porte. */
const THINGS: Array<[string, Thing]> = [
  ...Object.entries(CATEGORIES).flatMap(([key, group]) =>
    group.things.map((thing): [string, Thing] => [`CATEGORIES.${key}`, thing]),
  ),
  ...Object.entries(COLORS).flatMap(([key, list]) => list.map((thing): [string, Thing] => [`COLORS.${key}`, thing])),
  ...SIZE_SCALE.map((thing): [string, Thing] => ["SIZE_SCALE", thing]),
  ...WEIGHT_SCALE.map((thing): [string, Thing] => ["WEIGHT_SCALE", thing]),
];

describe("les listes de choses des gabarits du CI", () => {
  it("chaque chose a son image, avec son article seul comme avec son émoji de tête", () => {
    const missing = THINGS.filter(([, thing]) => !pictureForTile(thing.label) || !pictureForTile(optionOf(thing))).map(
      ([where, thing]) => `${where} : « ${thing.label} »`,
    );
    expect(missing, HOW).toEqual([]);
  });

  it("l'émoji d'une chose et son nom désignent la même image", () => {
    for (const [where, thing] of THINGS) {
      const named = pictureForTile(thing.label);
      const withEmoji = pictureForTile(optionOf(thing));
      expect(withEmoji?.id, `${where} : ${thing.label}`).toBe(named?.id);
    }
  });

  it("chaque moment de la journée a son image", () => {
    const missing = MOMENTS.filter((moment) => !pictureForTile(moment.label)).map((moment) => `« ${moment.label} »`);
    expect(missing, HOW).toEqual([]);
  });

  it("chaque forme et chaque solide que `geometry.ts` nomme a son image", () => {
    const names = ["le carré", "le rond", "le triangle", "le rectangle", "le cube", "le pavé", "le cylindre", "la boule"];
    const missing = names.filter((name) => !pictureForTile(name));
    expect(missing, HOW).toEqual([]);
  });
});

describe("les exercices fabriqués pour le CI", () => {
  const LEVELS: GameLevel[] = [1, 2, 3, 4];
  const VOCABULARIES = [undefined, "mots-1", "mots-2", "mots-3", "mots-4"] as const;
  const SEEDS = [0, 1, 2, 3, 4];

  it("ne nomment aucune chose sans image : le contrôleur n'a rien à signaler", () => {
    const failures: string[] = [];
    let checked = 0;
    for (const kind of Object.keys(GAME_KINDS) as GameKind[]) {
      for (const level of LEVELS) {
        for (const vocabulary of VOCABULARIES) {
          for (const n of SEEDS) {
            const seed = `images:${kind}:${level}:${vocabulary ?? "tous"}:${n}`;
            const exo = GAME_KINDS[kind].make(makeContext("CI", level, seed, undefined, vocabulary));
            checked += 1;
            const defect = auditExercise({
              type: exo.type,
              prompt: exo.prompt,
              payload: exo.payload,
              answerKey: exo.answerKey,
              hints: exo.hints,
              class: "CI",
              subject: "Mathématiques",
            }).find((found) => found.code === "ci_tile_without_picture");
            if (defect) failures.push(`${kind} : ${defect.detail}`);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect([...new Set(failures)], HOW).toEqual([]);
    // Plus de deux cents gabarits, quatre niveaux, cinq vocabulaires, cinq graines : sur le serveur d'intégration, partagé entre
    // tous les fichiers de test, le délai de cinq secondes ne suffit plus (la CI l'a dépassé avec les gabarits du CP).
  }, 30_000);
});
