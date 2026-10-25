import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { CATEGORIES, COLORS, MOMENTS, SIZE_SCALE, WEIGHT_SCALE, optionOf, type Thing } from "../paliers/games/things";
import { allProgrammeEntries } from "../programme";
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

/**
 * Les gabarits que le programme joue VRAIMENT en CI (`convex/programme`, la classe
 * CI). Les options d'un texte à trous montrent leur image depuis octobre 2026
 * (`FillBlankExercise`) : le contrôleur les juge désormais, mais un texte à trous du
 * CE1 au CM2 (« le djembé », « la kora ») n'est jamais posé à un enfant de CI, et ses
 * noms n'ont pas à être au catalogue.
 */
const CI_KINDS: ReadonlySet<string> = new Set(
  allProgrammeEntries()
    .filter((entry) => entry.klass === "CI")
    .flatMap((entry) => (entry.topic.games ?? []).map((game) => game.kind)),
);

describe("les exercices fabriqués pour le CI", () => {
  const LEVELS: GameLevel[] = [1, 2, 3, 4];
  const VOCABULARIES = [undefined, "mots-1", "mots-2", "mots-3", "mots-4"] as const;
  const SEEDS = [0, 1, 2, 3, 4];

  it("le programme du CI joue des textes à trous, que le contrôleur juge", () => {
    const blanks = [...CI_KINDS].filter((kind) => {
      const exo = GAME_KINDS[kind as GameKind].make(makeContext("CI", 1, `trous:${kind}`));
      return exo.type === "fill-blank";
    });
    // « Les outils de la maison », « Les plantes autour de moi », « Naturel ou fabriqué ? »… : l'audit visuel les a vus sans image.
    expect(blanks.length).toBeGreaterThan(5);
  });

  it("un texte à trous du CI qui nomme une chose sans image est signalé", () => {
    const defect = auditExercise({
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: { text: "Pour faire de la musique, je prends ___.", blanks: [{ options: ["le djembé", "le balai", "les ciseaux"] }] },
      answerKey: "le djembé",
      hints: [],
      class: "CI",
      subject: "Éducation artistique",
    }).find((found) => found.code === "ci_tile_without_picture");
    expect(defect?.detail).toContain("le djembé");
  });

  it("ne nomment aucune chose sans image : le contrôleur n'a rien à signaler", () => {
    const failures: string[] = [];
    let checked = 0;
    for (const kind of Object.keys(GAME_KINDS) as GameKind[]) {
      for (const level of LEVELS) {
        for (const vocabulary of VOCABULARIES) {
          for (const n of SEEDS) {
            const seed = `images:${kind}:${level}:${vocabulary ?? "tous"}:${n}`;
            const exo = GAME_KINDS[kind].make(makeContext("CI", level, seed, undefined, vocabulary));
            // Un texte à trous d'une autre classe n'est jamais posé en CI (`CI_KINDS`).
            if (exo.type === "fill-blank" && !CI_KINDS.has(kind)) continue;
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
    // Plus de neuf cents gabarits, quatre niveaux, cinq vocabulaires, cinq graines : sur le serveur d'intégration, partagé entre
    // tous les fichiers de test, le délai de cinq secondes ne suffit plus (la CI l'a dépassé avec les gabarits du CP), ni celui de
    // trente secondes avec les mathématiques du CE2 (33 secondes mesurées). Chaque lot de gabarits allonge ce test : le délai a de la marge.
  }, 120_000);
});
