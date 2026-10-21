/**
 * LIGNES, FRISES ET FIGURES AU CP (`ma-cp-figures`) : le matériel du géomètre (règle, double décimètre, ciseaux, gomme) et les étapes
 * pour reproduire, tracer ou découper une figure.
 *
 * La thématique avait déjà quatre jeux de code sur dix (le dessin à reproduire sur quadrillage, la frise de formes) ; ses six autres
 * exercices étaient écrits par le modèle, dont une figure « rangée à l'envers » dans l'échantillon. Les lignes droites et courbes
 * viennent des gabarits des arts (`ligne-qcm`, `ligne-relier`, `ligne-glisser`, `arts.ts`), les coins d'une forme de la géométrie du
 * CI (`forme-coins`) : ce fichier ne porte que ce qui manquait.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - La règle sert à tracer un trait droit, le double décimètre à mesurer un trait. Les deux se confondent (le double décimètre EST une
 *   règle graduée) : ils ne se proposent jamais ensemble dans les choix d'une même question.
 * - Chaque suite d'étapes n'a qu'un ordre possible (dessiner avant de découper, découper avant de coller). Aucune étape ne dépend d'un
 *   goût (ranger ses ciseaux avant ou après).
 * - Une étiquette est un mot seul ou un groupe de mots : jamais « article + nom », qui demanderait au CI une image du catalogue.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, sequenceGame, variantsForLevel } from "./tableaux";

/** Chaque outil et ce qu'on en fait ; `never` : les deux autres outils qui ne peuvent PAS être la bonne réponse. */
const TOOLS: readonly { ask: string; tool: string; never: readonly [string, string] }[] = [
  // Premier palier : tracer et dessiner.
  { ask: "Avec quoi trace-t-on un trait bien droit ?", tool: "Règle", never: ["Gomme", "Ciseaux"] },
  { ask: "Avec quoi dessine-t-on un trait sur la feuille ?", tool: "Crayon", never: ["Gomme", "Ciseaux"] },
  // Deuxième palier : effacer et coller.
  { ask: "Avec quoi enlève-t-on un trait fait au crayon ?", tool: "Gomme", never: ["Ciseaux", "Règle"] },
  { ask: "Avec quoi fixe-t-on une figure découpée sur le cahier ?", tool: "Colle", never: ["Règle", "Gomme"] },
  // Dernier palier : découper et mesurer.
  { ask: "Avec quoi découpe-t-on une figure ?", tool: "Ciseaux", never: ["Gomme", "Règle"] },
  { ask: "Avec quoi mesure-t-on la longueur d'un trait ?", tool: "Double décimètre", never: ["Gomme", "Ciseaux"] },
];

/** « Avec quoi trace-t-on un trait bien droit ? » : l'outil parmi trois. */
export function makeGeometryTool(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "outil-geometrie", "choisir l'outil du géomètre", () => {
    // Deux questions par palier : un enfant ne revoit pas la même d'un palier à l'autre.
    const entry = pick(ctx.rng, variantsForLevel(TOOLS, ctx.level));
    return {
      prompt: entry.ask,
      answer: entry.tool,
      wrong: entry.never,
      hints: ["Pense à ce que tu fais avec cet outil.", "Chaque outil a son travail.", `Le mot commence par la lettre ${firstLetter(entry.tool)}.`],
    };
  });
}

/** Les suites d'étapes de la fiche, chacune dans un seul ordre. */
const PROCEDURES: readonly { prompt: string; steps: readonly string[] }[] = [
  // Premier palier : tracer un trait. Deuxième : reproduire. Dernier : découper.
  {
    prompt: "Mets dans le bon ordre les étapes pour tracer un trait droit.",
    steps: ["Je pose la règle sur la feuille.", "Je tiens bien la règle.", "Je trace le trait le long de la règle."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes pour reproduire une figure.",
    steps: ["Je regarde bien la figure.", "Je trace les traits avec la règle.", "Je compare avec la figure."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes pour découper une figure.",
    steps: ["Je dessine la figure sur la feuille.", "Je découpe en suivant le trait.", "Je colle la figure sur le cahier."],
  },
];

/** « Mets dans le bon ordre les étapes pour découper une figure. » : trois étapes, une seule suite possible. */
export function makeFigureSteps(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "figure-etapes", "les étapes pour reproduire, tracer ou découper une figure", () => {
    const procedure = pick(ctx.rng, variantsForLevel(PROCEDURES, ctx.level));
    return {
      prompt: procedure.prompt,
      sequence: [...procedure.steps],
      hints: ["Pense à ce que tu fais en premier.", "Chaque étape prépare la suivante.", "La dernière étape arrive quand le travail est fini."],
    };
  });
}
