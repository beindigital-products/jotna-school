/**
 * LES GABARITS DES ARTS DU CE2 : le coloriage magique, reproduire un modèle, les mélodies, l'hymne national et les chants, jouer une scène
 * (`ar-ce2-coloriage`, `ar-ce2-reproduire`, `ar-ce2-melodies`, `ar-ce2-hymne`, `ar-ce2-theatre`).
 *
 * Quatre de ces fiches avaient déjà des jeux (le coloriage magique et les couleurs chaudes et froides, copier un dessin, de mémoire ou
 * par symétrie, écouter une mélodie ou deux sons, un rythme) qui ne remplissaient que deux à huit places sur dix : le modèle écrivait le
 * reste. La cinquième, « Jouer une scène », n'avait aucun jeu. Sur l'échantillon de CE2, le modèle écrivait ici : « Quelle mélodie
 * monte ? » quatre fois à l'identique, « Nomme un aliment que l'on pourrait vendre au marché » (une question hors sujet), « Quel
 * instrument peut accompagner l'hymne ? » avec un piano, un couteau et une chaise. Ici chaque exercice lit une ligne d'un tableau fermé, ou
 * se calcule (une mélodie monte ou descend selon l'ordre de ses notes).
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Coloriage : les couleurs chaudes (rouge, orange, jaune) et froides (bleu, vert, violet) ; choisir ses couleurs pour donner une ambiance.
 * - Reproduire : le quadrillage, le calque, le pochoir ; décorer par pliage et par collage ; produire des objets décoratifs.
 * - Mélodies : imiter des sons et des mélodies ; une mélodie qui monte, qui descend, deux mélodies pareilles ou différentes. Les notes vont
 *   de do à si ; une mélodie monte quand chaque note est plus loin dans cet ordre que la précédente.
 * - Hymne : « Le Lion rouge », paroles de Léopold Sédar Senghor ; on le chante au lever des couleurs, en se tenant bien ; accompagner un chant de
 *   gestes et d'instruments ; composer un petit chant. AUCUNE parole de l'hymne n'est citée.
 * - Théâtre : des scènes de la vie courante (au marché, chez le tailleur, au dispensaire) et des scènes imaginaires, la parodie, interpréter un
 *   rôle, les étapes pour préparer une saynète.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Civique.ts`. Les jeux déjà là gardent leurs places : les gabarits prennent celles qui restent
 * (deux au coloriage, trois à reproduire, deux aux mélodies, huit à l'hymne, dix au théâtre). Les mélodies n'ont donc que trois sortes d'exercices
 * par palier : huit écoutes et deux gabarits.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  ce2Gap,
  ce2Link,
  ce2Order,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  gr,
  hints,
  inFactOrder,
  ordr,
  qr,
  sortRows,
  wr,
  type GapRow,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import { pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame } from "./tableaux";

// ===========================================================================
// LE COLORIAGE MAGIQUE : LES COULEURS CHAUDES ET FROIDES
// ===========================================================================

const WARM_COLORS = ["Rouge", "Orange", "Jaune"] as const;
const COLD_COLORS = ["Bleu", "Vert", "Violet"] as const;
const COLOR_FACTS = ["couleur:Rouge", "couleur:Bleu", "ambiance:feu", "couleur:Orange", "ambiance:lac", "couleur:Jaune", "ambiance:forêt", "couleur:Vert", "ambiance:coucher", "couleur:Violet", "ambiance:désert", "ambiance:mer"];

const COLOR_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Quelle couleur est chaude ?", "Rouge", ["Bleu", "Vert"], hints("Pense au feu.", "Elle donne une impression de chaleur.", "On la voit sur un charbon brûlant."), "couleur:Rouge"),
    qr("Quelle couleur est chaude ?", "Orange", ["Violet", "Bleu"], hints("Pense au soleil qui se couche.", "Elle donne une impression de chaleur.", "C'est la couleur d'un fruit rond."), "couleur:Orange"),
    qr("Quelle couleur est chaude ?", "Jaune", ["Vert", "Violet"], hints("Pense au soleil au milieu du ciel.", "Elle donne une impression de chaleur.", "C'est la couleur d'une banane mûre."), "couleur:Jaune"),
    qr("Quelle couleur est froide ?", "Bleu", ["Rouge", "Jaune"], hints("Pense à l'eau et au ciel.", "Elle donne une impression de fraîcheur.", "On la voit sur la mer."), "couleur:Bleu"),
    qr("Quelle couleur est froide ?", "Vert", ["Orange", "Rouge"], hints("Pense aux feuilles et à l'herbe.", "Elle donne une impression de fraîcheur.", "On la voit dans les arbres."), "couleur:Vert"),
    qr("Quelle couleur est froide ?", "Violet", ["Jaune", "Orange"], hints("Pense au mélange du bleu et du rouge.", "Elle donne une impression de fraîcheur.", "C'est la couleur du bissap foncé."), "couleur:Violet"),
    qr("Pour dessiner un feu de camp, quelle couleur choisis-tu ?", "Rouge", ["Bleu", "Vert"], hints("Pense aux flammes.", "Un feu donne chaud.", "Il faut une couleur chaude."), "ambiance:feu"),
    qr("Pour dessiner un coucher de soleil, quelle couleur choisis-tu ?", "Orange", ["Bleu", "Vert"], hints("Pense au ciel quand le soleil descend.", "Le ciel paraît chaud.", "Il faut une couleur chaude."), "ambiance:coucher"),
    qr("Pour dessiner le soleil du désert, quelle couleur choisis-tu ?", "Jaune", ["Bleu", "Vert"], hints("Pense au sable et à la chaleur.", "Le désert est très chaud.", "Il faut une couleur chaude."), "ambiance:désert"),
    qr("Pour dessiner un lac calme, quelle couleur choisis-tu ?", "Bleu", ["Rouge", "Orange"], hints("Pense à l'eau fraîche.", "Un lac donne une impression de calme.", "Il faut une couleur froide."), "ambiance:lac"),
    qr("Pour dessiner une forêt fraîche, quelle couleur choisis-tu ?", "Vert", ["Rouge", "Jaune"], hints("Pense aux feuilles des arbres.", "L'ombre donne de la fraîcheur.", "Il faut une couleur froide."), "ambiance:forêt"),
    qr("Pour dessiner une mer calme, quelle couleur choisis-tu ?", "Bleu", ["Orange", "Jaune"], hints("Pense à l'océan.", "L'eau est fraîche.", "Il faut une couleur froide."), "ambiance:mer"),
  ],
  COLOR_FACTS,
);

const COLOR_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque couleur dans la bonne case.",
  ["Chaudes", "Froides"],
  WARM_COLORS,
  COLD_COLORS,
  hints("Pense au feu, au soleil, à l'eau et à la forêt.", "Un côté fait penser à la chaleur, l'autre à la fraîcheur.", "Il y a trois couleurs de chaque sorte."),
  8,
);

export function makeCe2ColorChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-couleur-qcm", "reconnaître une couleur chaude ou froide, et la couleur d'une ambiance", COLOR_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 0);
}
export function makeCe2ColorSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-couleur-glisser", "ranger les couleurs chaudes et froides", COLOR_SORT_ROWS, 1, 0);
}

// ===========================================================================
// REPRODUIRE UN MODÈLE : QUADRILLAGE, CALQUE, POCHOIR, PLIAGE ET COLLAGE
// ===========================================================================

const TECHNIQUE_FACTS = ["tech:calque", "tech:quadrillage", "tech:pochoir", "tech:pliage", "tech:collage", "tech:décor", "tech:cases", "tech:objet"];

const TECHNIQUE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("On pose un papier transparent sur le modèle et on suit les traits. Quelle technique est-ce ?", "Calque", ["Pochoir", "Pliage"], hints("Pense à ce qu'on voit à travers le papier.", "On repasse sur les traits du modèle.", "Le papier est transparent."), "tech:calque"),
    qr("On divise le modèle et la feuille en petites cases égales. Quelle technique est-ce ?", "Quadrillage", ["Collage", "Pliage"], hints("Pense aux cases d'un cahier de calcul.", "On copie case par case.", "Chaque case garde sa place."), "tech:quadrillage"),
    qr("On peint dans les trous d'une feuille découpée. Quelle technique est-ce ?", "Pochoir", ["Calque", "Quadrillage"], hints("Pense à la feuille percée de formes.", "On répète le même motif.", "La peinture passe par les trous."), "tech:pochoir"),
    qr("On rabat le papier sur lui-même pour faire une forme. Quelle technique est-ce ?", "Pliage", ["Calque", "Pochoir"], hints("Pense à une feuille qu'on retourne.", "Rien n'est collé ni peint.", "On fait des plis nets."), "tech:pliage"),
    qr("On fixe des morceaux de papier sur une feuille avec de la colle. Quelle technique est-ce ?", "Collage", ["Quadrillage", "Calque"], hints("Pense à ce qu'on tient dans un tube.", "On assemble des morceaux.", "Il faut de la colle."), "tech:collage"),
    qr("Pour copier un dessin case par case, quelle technique utilise-t-on ?", "Quadrillage", ["Pochoir", "Collage"], hints("Pense à une grille.", "On copie une case après l'autre.", "Le modèle est lui aussi découpé en cases."), "tech:cases"),
    qr("Pour repasser sur les traits d'un modèle à travers un papier, quelle technique utilise-t-on ?", "Calque", ["Collage", "Quadrillage"], hints("Pense à un papier fin et transparent.", "On voit le modèle en dessous.", "On suit les traits avec un crayon."), "tech:calque"),
    qr("Pour répéter plusieurs fois le même motif, quelle technique utilise-t-on ?", "Pochoir", ["Pliage", "Calque"], hints("Pense à une feuille avec une forme découpée.", "La forme revient toujours pareille.", "On passe la peinture dans le trou."), "tech:pochoir"),
    qr("Pour faire un bateau ou un oiseau avec une feuille, quelle technique utilise-t-on ?", "Pliage", ["Collage", "Pochoir"], hints("Pense à une feuille qu'on retourne.", "On fait des plis nets.", "On ne coupe rien."), "tech:pliage"),
    qr("Pour faire un tableau avec des morceaux de tissu et de papier, quelle technique utilise-t-on ?", "Collage", ["Calque", "Pliage"], hints("Pense à ce qu'on tient dans un tube.", "On assemble des morceaux.", "Les morceaux sont fixés sur la feuille."), "tech:collage"),
    qr("Pour décorer une boîte, on colle des morceaux de tissu. Quelle technique est-ce ?", "Collage", ["Quadrillage", "Pochoir"], hints("Pense à ce qui fait tenir les morceaux.", "Un objet devient plus joli.", "On assemble des tissus."), "tech:décor"),
    qr("Pour décorer une carte, on plie du papier en forme d'étoile. Quelle technique est-ce ?", "Pliage", ["Calque", "Collage"], hints("Pense à une feuille qu'on retourne.", "La forme vient des plis.", "On ne colle rien."), "tech:objet"),
  ],
  TECHNIQUE_FACTS,
);

const TECHNIQUE_LINK_POOL = [
  { left: "Quadrillage", right: "Copier un dessin case par case" },
  { left: "Calque", right: "Suivre les traits à travers un papier transparent" },
  { left: "Pochoir", right: "Peindre dans les trous d'une feuille découpée" },
  { left: "Pliage", right: "Faire une forme en rabattant le papier" },
  { left: "Collage", right: "Fixer des morceaux sur une feuille" },
] as const;
const TECHNIQUE_LINK_ROWS: readonly LinkRow[] = combinations(TECHNIQUE_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque technique à ce qu'on fait.",
    pairs,
    hints: hints("Pense à ce que fait la main pour chaque technique.", "Lis les phrases une par une.", "Une seule phrase correspond à chaque mot."),
  }));

const TECHNIQUE_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Avec le ___, on copie un dessin case par case.", "quadrillage", ["pochoir", "collage"], hints("Pense à une grille.", "Chaque case garde sa place.", "Le mot commence par la lettre q."), "tech:quadrillage"),
    gr("Le ___ est un papier transparent posé sur le modèle.", "calque", ["pochoir", "pliage"], hints("Pense à ce qu'on voit à travers.", "On repasse sur les traits.", "Le mot commence par la lettre c."), "tech:calque"),
    gr("Avec un ___, on peint dans les trous d'une feuille découpée.", "pochoir", ["calque", "pliage"], hints("Pense à une feuille percée de formes.", "On répète le même motif.", "Le mot commence par la lettre p."), "tech:pochoir"),
    gr("Le ___ fait une forme en rabattant le papier.", "pliage", ["collage", "calque"], hints("Pense à une feuille qu'on retourne.", "On fait des plis nets.", "Le mot commence par la lettre p."), "tech:pliage"),
    gr("Le ___ fixe des morceaux sur une feuille avec de la colle.", "collage", ["quadrillage", "pochoir"], hints("Pense à ce qu'on tient dans un tube.", "On assemble des morceaux.", "Le mot commence par la lettre c."), "tech:collage"),
    gr("Pour décorer un objet, on peut le plier ou le ___.", "coller", ["manger", "vendre"], hints("Pense à ce qui fixe les morceaux.", "Il faut de la colle.", "Le verbe commence par la lettre c."), "tech:décor"),
    gr("Un objet fait pour décorer est un objet ___.", "décoratif", ["comestible", "bruyant"], hints("Pense à ce qui rend un lieu joli.", "Il sert à embellir.", "Le mot commence par la lettre d."), "tech:objet"),
    gr("Pour copier un dessin, on peut le diviser en petites ___.", "cases", ["boules", "tiges"], hints("Pense à une grille.", "Elles sont égales.", "Le mot est court."), "tech:cases"),
  ],
  TECHNIQUE_FACTS,
);

export function makeCe2TechniqueChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-technique-qcm", "reconnaître le quadrillage, le calque, le pochoir, le pliage et le collage", TECHNIQUE_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2TechniqueLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-technique-relier", "relier une technique de reproduction à ce qu'on fait", TECHNIQUE_LINK_ROWS, 1, 0);
}
export function makeCe2TechniqueGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-technique-trou", "compléter une phrase sur les techniques de reproduction et de décoration", TECHNIQUE_GAP_ROWS, 1, 2);
}

// ===========================================================================
// LES MÉLODIES : UNE MÉLODIE QUI MONTE, QUI DESCEND, DEUX MÉLODIES PAREILLES
// ===========================================================================

/** Les sept notes, de la plus grave à la plus aiguë : une mélodie monte quand chaque note est plus loin dans cet ordre que la précédente. */
const NOTES = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"] as const;
const noteCount = (level: number) => (level <= 2 ? 3 : 4);
const spell = (steps: readonly number[]) => steps.map((step) => NOTES[step]).join(", ");
const isRising = (steps: readonly number[]) => steps.every((step, i) => i === 0 || step > steps[i - 1]);
const isFalling = (steps: readonly number[]) => steps.every((step, i) => i === 0 || step < steps[i - 1]);

/** Des notes toutes différentes, rangées de la plus grave à la plus aiguë. */
function risingSteps(ctx: GameContext, count: number): number[] {
  return shuffle(ctx.rng, [0, 1, 2, 3, 4, 5, 6])
    .slice(0, count)
    .sort((a, b) => a - b);
}
/** Des notes toutes différentes, dans un ordre qui ne monte pas et ne descend pas. */
function zigzagSteps(ctx: GameContext, count: number): number[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const steps = shuffle(ctx.rng, [0, 1, 2, 3, 4, 5, 6]).slice(0, count);
    if (!isRising(steps) && !isFalling(steps)) return steps;
  }
  return count === 3 ? [0, 4, 2] : [0, 4, 2, 5];
}
/** La même mélodie avec une note changée. */
function changedSteps(ctx: GameContext, steps: readonly number[], position: number): number[] {
  const next = [...steps];
  const others = [0, 1, 2, 3, 4, 5, 6].filter((step) => step !== steps[position]);
  next[position] = pick(ctx.rng, others);
  return next;
}

const MELODY_HINTS = hints(
  "Compare la première note avec la dernière.",
  "Les notes vont de do à si dans cet ordre : do, ré, mi, fa, sol, la, si.",
  "Une dernière note plus loin que la première fait aller la mélodie vers le haut.",
);
const SAME_HINTS = hints("Compare les deux mélodies note par note.", "Deux mélodies pareilles ont toutes leurs notes pareilles.", "Une seule note changée suffit à les rendre différentes.");

/** « Quelle mélodie monte ? », « Quelle mélodie descend ? », « Quelles mélodies sont pareilles ? » : des notes à comparer. */
export function makeCe2MelodyChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-melodie-choisir", "reconnaître une mélodie qui monte, qui descend ou deux mélodies pareilles", () => {
    const count = noteCount(ctx.level);
    const form = randomInt(ctx.rng, 0, 2);
    if (form === 2) {
      const base = risingSteps(ctx, count);
      const order = shuffle(ctx.rng, base);
      const same = `${spell(order)} et ${spell(order)}`;
      const a = Math.floor(ctx.rng() * count);
      const b = (a + 1 + Math.floor(ctx.rng() * (count - 1))) % count;
      const one = `${spell(order)} et ${spell(changedSteps(ctx, order, a))}`;
      const two = `${spell(order)} et ${spell(changedSteps(ctx, order, b))}`;
      return { prompt: "Quelles mélodies sont pareilles ?", answer: same, wrong: [one, two], hints: SAME_HINTS };
    }
    const rising = form === 0;
    const base = risingSteps(ctx, count);
    const right = rising ? base : [...base].reverse();
    const opposite = rising ? [...base].reverse() : base;
    const wrong = [spell(opposite), spell(zigzagSteps(ctx, count))];
    return { prompt: rising ? "Quelle mélodie monte ?" : "Quelle mélodie descend ?", answer: spell(right), wrong, hints: MELODY_HINTS };
  });
}

/** « La mélodie Do, Ré, Mi ___ » : monte, descend, ou s'arrête. */
export function makeCe2MelodyGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-melodie-trou", "dire si une mélodie monte ou descend d'après ses notes", () => {
    const rising = ctx.rng() < 0.5;
    const base = risingSteps(ctx, noteCount(ctx.level));
    const steps = rising ? base : [...base].reverse();
    return {
      prompt: "Complète la phrase.",
      text: `La mélodie ${spell(steps)} ___.`,
      answer: rising ? "monte" : "descend",
      wrong: [rising ? "descend" : "monte", "s'arrête"],
      hints: MELODY_HINTS,
    };
  });
}

// ===========================================================================
// L'HYMNE NATIONAL ET LES CHANTS
// ===========================================================================

const ANTHEM_FACTS = ["hymne:titre", "hymne:quand", "hymne:auteur", "hymne:tenue", "hymne:accompagner", "hymne:composer", "hymne:chanter", "hymne:respect"];

const ANTHEM_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Quel est le titre de l'hymne national du Sénégal ?", "Le Lion rouge", ["Le Chant du matin", "La Voix du fleuve"], hints("Pense à un animal et à une couleur.", "C'est le nom de notre hymne.", "Il commence par un article."), "hymne:titre"),
    qr("Qui a écrit les paroles de l'hymne national ?", "Léopold Sédar Senghor", ["Un griot du village", "Un ministre d'aujourd'hui"], hints("Pense à un grand poète sénégalais.", "Il a aussi dirigé le pays.", "Son nom est connu de tous les élèves."), "hymne:auteur"),
    qr("Quand chante-t-on l'hymne national ?", "Au lever des couleurs", ["À la fin du repas", "Pendant la récréation"], hints("Pense au drapeau qui monte.", "C'est une cérémonie du matin.", "Les élèves sont rangés."), "hymne:quand"),
    qr("Comment se tient-on quand on chante l'hymne ?", "Debout et bien droit", ["Assis par terre", "En courant dans la cour"], hints("Pense à une posture respectueuse.", "On ne bouge pas.", "On regarde devant soi."), "hymne:tenue"),
    qr("Quel nom porte notre hymne national ?", "Le Lion rouge", ["La Voix du fleuve", "Le Chant du matin"], hints("Pense à un animal et à une couleur.", "C'est le nom de notre hymne.", "Il compte trois mots."), "hymne:titre"),
    qr("Quel poète a écrit les paroles de notre hymne ?", "Léopold Sédar Senghor", ["Un griot du village", "Un ministre d'aujourd'hui"], hints("Pense à un grand poète sénégalais.", "Il a aussi dirigé le pays.", "Son nom est connu de tous les élèves."), "hymne:auteur"),
    qr("Que fait-on au lever des couleurs ?", "On chante l'hymne", ["On fait la sieste", "On joue au ballon"], hints("Pense à ce que font les élèves rangés.", "C'est un moment sérieux.", "On le fait en chœur."), "hymne:quand"),
    qr("Qui chante l'hymne au lever des couleurs ?", "Tous les élèves ensemble", ["Un seul élève", "Seulement la maîtresse"], hints("Pense à la foule alignée dans la cour.", "Personne n'est oublié.", "On chante en chœur."), "hymne:chanter"),
    qr("Comment peut-on accompagner un chant ?", "Avec des gestes et des instruments", ["Avec des cris très forts", "En restant sans bouger"], hints("Pense à ce qui rend un chant plus beau.", "On bouge ses mains et on joue.", "Il y a de la musique."), "hymne:accompagner"),
    qr("Quel instrument peut accompagner un chant ?", "Tama", ["Cahier", "Natte"], hints("Pense à un objet qui fait de la musique.", "On le joue avec ses mains.", "C'est un petit tambour."), "hymne:accompagner"),
    qr("Que doit-on faire pendant le chant de l'hymne ?", "Rester sérieux et attentif", ["Faire des grimaces", "Bavarder avec son voisin"], hints("Pense au respect.", "On ne rit pas.", "Tout le monde fait attention."), "hymne:tenue"),
    qr("Que montre-t-on en chantant l'hymne ?", "Du respect pour notre pays", ["De la colère envers tout le monde", "De l'ennui et de la fatigue"], hints("Pense à ce qu'on doit à sa patrie.", "On le fait avec sérieux.", "Cela touche tout le monde."), "hymne:respect"),
  ],
  ANTHEM_FACTS,
);

const ANTHEM_DO = ["Se tenir debout", "Se tenir droit", "Chanter avec les autres", "Écouter en silence"] as const;
const ANTHEM_DONT = ["Bavarder", "S'asseoir par terre", "Jouer avec ses amis", "Rire fort"] as const;
const ANTHEM_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque geste dans la bonne case.",
  ["On le fait", "On ne le fait pas"],
  ANTHEM_DO,
  ANTHEM_DONT,
  hints("Pense à une cérémonie sérieuse.", "Un côté montre du respect, l'autre non.", "Chacun garde sa place."),
  16,
);

const ANTHEM_LINK_POOL = [
  { left: "Titre", right: "Le Lion rouge" },
  { left: "Auteur", right: "Léopold Sédar Senghor" },
  { left: "Moment", right: "Le lever des couleurs" },
  { left: "Posture", right: "Debout et bien droit" },
  { left: "Accompagnement", right: "Des gestes et des instruments" },
] as const;
const ANTHEM_LINK_ROWS: readonly LinkRow[] = combinations(ANTHEM_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque mot à ce qui lui correspond.",
    pairs,
    hints: hints("Pense à ce qu'on sait de l'hymne.", "Lis les propositions une par une.", "Une seule proposition va avec chaque mot."),
  }));

const ANTHEM_ORDER_ROWS: readonly OrderRow[] = [
  ordr("Mets ces étapes dans l'ordre du temps pour composer un petit chant.", ["Choisir un thème", "Trouver les paroles", "Inventer la mélodie", "Chanter devant la classe"], hints("Tout commence par une idée.", "Les mots viennent avant la musique.", "Le chant se montre à la fin."), "hymne:composer"),
  ordr("Mets ces gestes dans l'ordre du temps au lever des couleurs.", ["Les élèves se rangent", "On se tient droit", "On chante l'hymne"], hints("Il faut d'abord se mettre en place.", "Ensuite on adopte une bonne posture.", "Le chant vient à la fin."), "hymne:quand"),
  ordr("Mets ces étapes dans l'ordre du temps pour accompagner un chant.", ["On apprend le chant", "On choisit des gestes et un instrument", "On répète ensemble", "On chante avec l'accompagnement"], hints("Il faut d'abord se familiariser un peu.", "Ensuite on prépare de quoi embellir.", "Le résultat se montre à la fin."), "hymne:accompagner"),
  ordr("Mets ces étapes dans l'ordre du temps pour apprendre un chant.", ["On écoute le chant", "On le chante phrase par phrase", "On le chante en entier"], hints("Il faut d'abord l'entendre.", "On avance par petits morceaux.", "Le résultat final vient à la fin."), "hymne:chanter"),
];

const ANTHEM_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Notre hymne national s'appelle Le Lion ___.", "rouge", ["bleu", "vert"], hints("Pense à une couleur chaude.", "C'est celle du feu.", "Le mot est court."), "hymne:titre"),
    gr("Les paroles de l'hymne ont été écrites par Léopold Sédar ___.", "Senghor", ["Sarr", "Ba"], hints("Pense à un grand poète.", "Il a aussi dirigé le pays.", "Son nom commence par la lettre S."), "hymne:auteur"),
    gr("On chante l'hymne au lever des ___.", "couleurs", ["tambours", "repas"], hints("Pense au drapeau qui monte.", "C'est une cérémonie du matin.", "Le mot commence par la lettre c."), "hymne:quand"),
    gr("Pendant l'hymne, on se tient ___ et bien droit.", "debout", ["assis", "couché"], hints("Pense à une posture respectueuse.", "On ne bouge pas.", "Le mot commence par la lettre d."), "hymne:tenue"),
    gr("On peut accompagner un chant avec des gestes et des ___.", "instruments", ["cailloux", "cahiers"], hints("Pense à ce qui fait de la musique.", "Il y en a de toutes sortes.", "Le mot commence par la lettre i."), "hymne:accompagner"),
    gr("Le Lion rouge est notre hymne ___.", "national", ["familial", "étranger"], hints("Pense à tout le pays.", "Il est chanté par tous les Sénégalais.", "Le mot commence par la lettre n."), "hymne:titre"),
    gr("Dans un chant, les mots s'appellent les ___.", "paroles", ["notes", "gestes"], hints("Pense à ce qu'on chante.", "Ce sont les mots du chant.", "Le mot commence par la lettre p."), "hymne:composer"),
    gr("Pour chanter ensemble, on suit la même ___.", "mélodie", ["recette", "route"], hints("Pense à la musique du chant.", "Elle monte ou descend.", "Le mot commence par la lettre m."), "hymne:chanter"),
    gr("Au lever des couleurs, tous les élèves chantent ___.", "ensemble", ["seuls", "dehors"], hints("Pense à ceux qui sont rangés.", "Personne ne chante tout seul.", "Le mot commence par la lettre e."), "hymne:chanter"),
    gr("Quand on invente un petit chant, on le ___.", "compose", ["mange", "vend"], hints("Pense à ce qu'on fait avec des mots et des notes.", "On l'invente.", "Le verbe commence par la lettre c."), "hymne:composer"),
    gr("On chante l'hymne avec ___ et respect.", "sérieux", ["colère", "paresse"], hints("Pense à une cérémonie importante.", "On ne rit pas.", "Le mot commence par la lettre s."), "hymne:respect"),
    gr("Pour mettre un chant en valeur, on peut ajouter des ___.", "gestes", ["devoirs", "légumes"], hints("Pense à ce que font les mains.", "On bouge en chantant.", "Le mot commence par la lettre g."), "hymne:accompagner"),
  ],
  ANTHEM_FACTS,
);

const ANTHEM_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quel est le titre de l'hymne national ? Écris les trois mots.", ["le lion rouge", "Le Lion rouge"], hints("Pense à un animal et à une couleur.", "C'est le nom de notre hymne.", "Le premier mot est un article."), "hymne:titre"),
    wr("Qui a écrit les paroles de l'hymne national ? Écris son nom de famille.", ["senghor", "Senghor"], hints("Pense à un grand poète sénégalais.", "Il a aussi dirigé le pays.", "Son nom commence par la lettre S."), "hymne:auteur"),
    wr("Au lever de quoi chante-t-on l'hymne ? Écris le mot.", ["couleurs", "des couleurs"], hints("Pense au drapeau qui monte.", "C'est une cérémonie du matin.", "Le mot commence par la lettre c."), "hymne:quand"),
    wr("Comment se tient-on pendant l'hymne ? Écris le mot.", ["debout"], hints("Pense à une posture respectueuse.", "On ne bouge pas.", "Le mot commence par la lettre d."), "hymne:tenue"),
    wr("Avec quoi accompagne-t-on un chant, en plus des gestes ? Écris le mot.", ["instruments", "instrument", "un instrument"], hints("Pense à ce qui fait de la musique.", "Il y en a de toutes sortes.", "Le mot commence par la lettre i."), "hymne:accompagner"),
    wr("Comment appelle-t-on les mots d'un chant ? Écris le mot.", ["paroles", "les paroles"], hints("Pense à ce qu'on chante.", "Ce sont les mots du chant.", "Le mot commence par la lettre p."), "hymne:composer"),
    wr("Quel verbe veut dire inventer un petit chant ? Écris le verbe.", ["composer"], hints("Pense à ce qu'on fait avec des mots et des notes.", "On l'invente.", "Le verbe commence par la lettre c."), "hymne:composer"),
    wr("Que fait-on ensemble au lever des couleurs ? Écris le verbe.", ["chanter"], hints("Pense à ce qu'on fait avec sa voix.", "On le fait en chœur.", "Le verbe commence par la lettre c."), "hymne:chanter"),
  ],
  ANTHEM_FACTS,
);

export function makeCe2AnthemChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-hymne-qcm", "l'hymne national : son titre, son auteur, quand et comment on le chante, accompagner un chant", ANTHEM_ROWS, 2, (row) => row.prompt, 0);
}
export function makeCe2AnthemSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-hymne-glisser", "ranger ce qu'on fait et ce qu'on ne fait pas pendant l'hymne", ANTHEM_SORT_ROWS, 1, 0);
}
export function makeCe2AnthemLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-hymne-relier", "relier un mot de l'hymne à ce qui lui correspond", ANTHEM_LINK_ROWS, 1, 0);
}
export function makeCe2AnthemOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-hymne-ordre", "ranger les étapes pour composer, apprendre ou accompagner un chant", ANTHEM_ORDER_ROWS, 1, 0);
}
export function makeCe2AnthemGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-hymne-trou", "compléter une phrase sur l'hymne national et les chants", ANTHEM_GAP_ROWS, 2, 1);
}
export function makeCe2AnthemWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-hymne-ecrire", "écrire un mot sur l'hymne national et les chants", ANTHEM_WRITE_ROWS, 1, 3);
}

// ===========================================================================
// JOUER UNE SCÈNE
// ===========================================================================

const STAGE_FACTS = ["scène:marché", "rôle:vendeur", "scène:dispensaire", "mot:parodie", "scène:tailleur", "rôle:client", "mot:saynète", "rôle:infirmier", "mot:rôle", "mot:répéter", "scène:imaginaire", "mot:dramatiser"];

const STAGE_PLACE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("On pèse du riz et on discute le prix. Quel est le lieu de la scène ?", "Marché", ["Dispensaire", "Atelier du tailleur"], hints("Pense aux étals et aux vendeurs.", "On marchande.", "On y achète des légumes."), "scène:marché"),
    qr("On regarde des étals de mangues et de légumes. Quel est le lieu de la scène ?", "Marché", ["Dispensaire", "Atelier du tailleur"], hints("Pense aux fruits posés sur des tables.", "Beaucoup de gens y passent.", "On y achète à manger."), "scène:marché"),
    qr("Une vendeuse appelle les clients pour ses tomates. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"], hints("Pense à une femme qui crie le prix.", "Beaucoup de clients passent.", "On y fait ses courses."), "scène:marché"),
    qr("Une infirmière prend la température d'un enfant. Quel est le lieu de la scène ?", "Dispensaire", ["Marché", "Atelier du tailleur"], hints("Pense à un lieu de soins.", "On y vient quand on est malade.", "On y reçoit des médicaments."), "scène:dispensaire"),
    qr("On attend son tour pour être soigné. Quel est le lieu de la scène ?", "Dispensaire", ["Marché", "Atelier du tailleur"], hints("Pense à une salle d'attente.", "On vient pour sa santé.", "Un infirmier reçoit les malades."), "scène:dispensaire"),
    qr("Un médecin donne des médicaments au malade. Quel est le lieu de la scène ?", "Dispensaire", ["Atelier du tailleur", "Marché"], hints("Pense à qui vient se faire soigner.", "On y trouve des médicaments.", "C'est un lieu de santé."), "scène:dispensaire"),
    qr("Le tailleur prend les mesures d'un client. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Marché", "Dispensaire"], hints("Pense à un mètre ruban.", "On y fait faire des habits.", "Une machine à coudre y tourne."), "scène:tailleur"),
    qr("On coud un boubou avec une machine. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Marché", "Dispensaire"], hints("Pense à du fil et du tissu.", "On y fabrique des habits.", "Une machine y tourne."), "scène:tailleur"),
    qr("Un client choisit un beau tissu pour sa tenue. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Dispensaire", "Marché"], hints("Pense à des tissus de toutes les couleurs.", "On y fait faire un habit.", "Un artisan les coud."), "scène:tailleur"),
    qr("On entend les cris des vendeurs et on marchande. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"], hints("Pense à beaucoup de bruit et de monde.", "On discute les prix.", "On achète et on vend."), "scène:marché"),
    qr("Une affiche rappelle de se faire vacciner. Quel est le lieu de la scène ?", "Dispensaire", ["Marché", "Atelier du tailleur"], hints("Pense à la santé des enfants.", "Une affiche parle de vaccins.", "Des infirmiers y travaillent."), "scène:dispensaire"),
    qr("Le client essaie son pantalon devant le miroir. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Marché", "Dispensaire"], hints("Pense à un habit en train d'être fait.", "On vérifie qu'il va bien.", "L'artisan règle les mesures."), "scène:tailleur"),
  ],
  STAGE_FACTS,
);

const STAGE_ROLE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Dans la scène au marché, qui vend les légumes ?", "Vendeur", ["Client", "Infirmier"], hints("Pense à celui qui propose sa marchandise.", "Il annonce les prix.", "Il est derrière son étal."), "rôle:vendeur"),
    qr("Dans la scène chez le tailleur, qui prend les mesures ?", "Tailleur", ["Client", "Vendeur"], hints("Pense à l'artisan qui coud.", "Il a un mètre ruban.", "C'est lui qui fait l'habit."), "scène:tailleur"),
    qr("Dans la scène au dispensaire, qui soigne les malades ?", "Infirmier", ["Client", "Tailleur"], hints("Pense à celui qui travaille en blouse.", "Il examine les malades.", "Il donne des médicaments."), "rôle:infirmier"),
    qr("Au marché, qui achète des mangues ?", "Client", ["Vendeur", "Tailleur"], hints("Pense à celui qui paie.", "Il choisit ses fruits.", "Il discute le prix."), "rôle:client"),
    qr("Chez le tailleur, qui commande un boubou ?", "Client", ["Tailleur", "Infirmier"], hints("Pense à celui qui veut un habit.", "Il paie pour son boubou.", "Il choisit son tissu."), "rôle:client"),
    qr("Au dispensaire, qui vient se faire soigner ?", "Malade", ["Infirmier", "Vendeur"], hints("Pense à celui qui ne se sent pas bien.", "Il vient pour sa santé.", "Il attend son tour."), "rôle:infirmier"),
    qr("Au dispensaire, qui donne les médicaments ?", "Infirmier", ["Client", "Vendeur"], hints("Pense à celui qui travaille en blouse.", "Il connaît les médicaments.", "Il s'occupe des malades."), "rôle:infirmier"),
    qr("Au marché, qui discute le prix pour acheter ?", "Client", ["Infirmier", "Tailleur"], hints("Pense à celui qui veut payer moins cher.", "Il choisit ce qu'il veut.", "Il marchande."), "rôle:client"),
  ],
  STAGE_FACTS,
);

const STAGE_WORD_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que fait-on dans une parodie ?", "On imite en exagérant pour faire rire", ["On récite un texte sérieux", "On reste immobile sans parler"], hints("Pense à ce qui amuse le public.", "On exagère les gestes et les mots.", "Le but est d'amuser."), "mot:parodie"),
    qr("Quel est le but d'une parodie ?", "Faire rire le public", ["Faire peur au public", "Endormir le public"], hints("Pense à ce qu'on veut provoquer.", "Les spectateurs s'amusent.", "On exagère pour amuser."), "mot:parodie"),
    qr("Que veut dire le mot saynète ?", "Une petite scène jouée", ["Un long chant triste", "Un plat de riz"], hints("Pense à un petit spectacle.", "Des élèves la jouent.", "Elle dure peu de temps."), "mot:saynète"),
    qr("Que fait un acteur qui interprète un rôle ?", "Il joue un personnage", ["Il copie son voisin", "Il écrit le texte"], hints("Pense à ce que fait un comédien.", "Il devient quelqu'un d'autre.", "Il parle et bouge comme lui."), "mot:rôle"),
    qr("Que veut dire une scène imaginaire ?", "Une histoire inventée", ["Un lieu qui existe", "Une leçon de maths"], hints("Pense à ce qui n'existe pas vraiment.", "On la crée avec son idée.", "Un lion peut y parler."), "scène:imaginaire"),
    qr("Que veut dire une scène de la vie courante ?", "Un moment de tous les jours", ["Un voyage sur la lune", "Un conte de dragons"], hints("Pense à ce qu'on voit chaque jour.", "Elle vient de la vraie vie.", "Le marché en est un exemple."), "scène:marché"),
    qr("Que veut dire répéter une scène ?", "La jouer plusieurs fois avant le spectacle", ["La montrer une seule fois", "La jouer sans les costumes"], hints("Pense à ce qu'on fait pour bien la connaître.", "On s'entraîne.", "La représentation vient après."), "mot:répéter"),
    qr("Que veut dire dramatiser une scène ?", "La jouer comme au théâtre", ["La raconter assis", "L'écrire sur un cahier"], hints("Pense à ce que font les acteurs.", "On bouge et on parle à la façon des personnages.", "Il y a un public."), "mot:dramatiser"),
  ],
  STAGE_FACTS,
);

const LIFE_SCENES = ["Acheter des mangues au marché", "Se faire soigner au dispensaire", "Faire coudre un boubou chez le tailleur", "Faire ses devoirs à la maison"] as const;
const IMAGINARY_SCENES = ["Un lion qui parle au roi", "Un voyage sur la lune", "Un arbre qui danse", "Un poisson qui joue au football"] as const;
const STAGE_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque scène dans la bonne case.",
  ["Vie courante", "Imaginaire"],
  LIFE_SCENES,
  IMAGINARY_SCENES,
  hints("Pense à ce qu'on peut voir autour de soi.", "Un côté existe vraiment, l'autre est inventé.", "Un animal qui discute est une invention."),
  16,
);

const STAGE_LINK_POOL = [
  { left: "Saynète", right: "Une petite scène jouée" },
  { left: "Parodie", right: "Imiter en exagérant pour faire rire" },
  { left: "Rôle", right: "Le personnage qu'on joue" },
  { left: "Répétition", right: "Jouer la scène avant le spectacle" },
  { left: "Dramatisation", right: "Jouer une scène comme au théâtre" },
] as const;
const STAGE_LINK_ROWS: readonly LinkRow[] = combinations(STAGE_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque mot du théâtre à son sens.",
    pairs,
    hints: hints("Pense à ce qu'on fait devant un public.", "Lis les phrases une par une.", "Une seule phrase correspond à chaque mot."),
  }));

const STAGE_ORDER_ROWS: readonly OrderRow[] = [
  ordr("Mets ces étapes dans l'ordre du temps pour préparer une saynète.", ["Choisir le sujet", "Écrire les répliques", "Distribuer les rôles", "Répéter la scène", "Jouer devant le public"], hints("Tout commence par une idée.", "Les mots et les personnages se préparent avant l'entraînement.", "Les spectateurs viennent à la fin."), "mot:saynète"),
  ordr("Mets ces étapes dans l'ordre du temps.", ["Distribuer les rôles", "Apprendre ses répliques", "Répéter ensemble", "Jouer la saynète"], hints("Chacun reçoit d'abord son personnage.", "Il faut connaître ses mots.", "Le spectacle vient après l'entraînement."), "mot:répéter"),
  ordr("Mets ces événements dans l'ordre du temps.", ["Le vendeur installe ses mangues", "Le client demande le prix", "Ils discutent et se mettent d'accord", "Le client paie et repart"], hints("Tout commence par l'installation de l'étal.", "L'acheteur pose une question.", "La vente se termine par un paiement."), "scène:marché"),
  ordr("Mets ces événements dans l'ordre du temps.", ["Un malade arrive", "L'infirmière l'examine", "Elle lui donne un médicament"], hints("Tout commence par l'arrivée de quelqu'un.", "L'examen vient avant les soins.", "Les soins se terminent par un remède."), "scène:dispensaire"),
];

const STAGE_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Une ___ est une petite scène jouée.", "saynète", ["chanson", "danse"], hints("Pense à un petit spectacle.", "Des élèves la jouent.", "Le mot commence par la lettre s."), "mot:saynète"),
    gr("Dans une ___, on imite en exagérant pour faire rire.", "parodie", ["leçon", "prière"], hints("Pense à ce qui amuse le public.", "On exagère les gestes et les mots.", "Le mot commence par la lettre p."), "mot:parodie"),
    gr("L'acteur joue un ___ dans la scène.", "rôle", ["repas", "marché"], hints("Pense au personnage qu'on interprète.", "Chaque acteur en a un.", "Le mot est court."), "mot:rôle"),
    gr("Avant le spectacle, on doit ___ la scène.", "répéter", ["oublier", "vendre"], hints("Pense à ce qu'on fait pour bien la connaître.", "On s'entraîne plusieurs fois.", "Le verbe commence par la lettre r."), "mot:répéter"),
    gr("Au marché, le ___ vend ses mangues.", "vendeur", ["tailleur", "infirmier"], hints("Pense à celui qui propose sa marchandise.", "Il annonce les prix.", "Le mot commence par la lettre v."), "rôle:vendeur"),
    gr("Chez le tailleur, on coud un ___.", "boubou", ["ballon", "puits"], hints("Pense à un habit traditionnel.", "On le porte les jours de fête.", "Le mot commence par la lettre b."), "scène:tailleur"),
    gr("Au dispensaire, l'infirmier ___ les malades.", "soigne", ["vend", "coud"], hints("Pense à ce qu'il fait pour la santé.", "Il donne des médicaments.", "Le verbe commence par la lettre s."), "rôle:infirmier"),
    gr("Une scène imaginaire est une histoire ___.", "inventée", ["vraie", "lue"], hints("Pense à ce qui n'existe pas vraiment.", "On la crée avec son idée.", "Le mot commence par la lettre i."), "scène:imaginaire"),
    gr("Dans une scène de la vie courante, on joue un moment de tous les ___.", "jours", ["rêves", "lions"], hints("Pense à ce qu'on vit chaque matin.", "C'est tout à fait normal.", "Le mot est court."), "scène:marché"),
    gr("Pour jouer un rôle, l'acteur ___ un personnage.", "interprète", ["efface", "achète"], hints("Pense à ce que fait un comédien.", "Il devient quelqu'un d'autre.", "Le verbe commence par la lettre i."), "mot:rôle"),
    gr("Pour bien jouer, on apprend ses ___.", "répliques", ["cailloux", "sandales"], hints("Pense à ce que dit chaque acteur.", "Ce sont ses phrases.", "Le mot commence par la lettre r."), "mot:saynète"),
    gr("Dramatiser une scène, c'est la jouer comme au ___.", "théâtre", ["marché", "stade"], hints("Pense à un lieu de spectacle.", "Il y a une scène et un public.", "Le mot commence par la lettre t."), "mot:dramatiser"),
  ],
  STAGE_FACTS,
);

const STAGE_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Comment appelle-t-on une petite scène jouée ? Écris le mot.", ["saynète", "saynete", "une saynète"], hints("Pense à un petit spectacle.", "Des élèves la jouent.", "Le mot commence par la lettre s."), "mot:saynète"),
    wr("Comment appelle-t-on une scène où l'on imite en exagérant pour faire rire ? Écris le mot.", ["parodie", "une parodie"], hints("Pense à ce qui amuse le public.", "On exagère les gestes et les mots.", "Le mot commence par la lettre p."), "mot:parodie"),
    wr("Quel mot veut dire le personnage qu'on joue ? Écris le mot.", ["rôle", "role", "un rôle"], hints("Pense à ce que chaque acteur interprète.", "Il peut être vendeur ou client.", "Le mot est court."), "mot:rôle"),
    wr("Que fait-on avant le spectacle pour bien jouer ? Écris le verbe.", ["répéter", "repeter"], hints("Pense à l'entraînement.", "On joue la scène plusieurs fois.", "Le verbe commence par la lettre r."), "mot:répéter"),
    wr("Qui vend des légumes dans la scène du marché ? Écris le mot.", ["vendeur", "vendeuse", "marchand"], hints("Pense à celui qui propose sa marchandise.", "Il annonce les prix.", "Le mot commence par la lettre v."), "rôle:vendeur"),
    wr("Qui soigne les malades dans la scène du dispensaire ? Écris le mot.", ["infirmier", "infirmière", "médecin"], hints("Pense à celui qui travaille en blouse.", "Il examine les malades.", "Le mot commence par la lettre i."), "rôle:infirmier"),
    wr("Qui prend les mesures d'un client pour lui coudre un boubou ? Écris le mot.", ["tailleur", "le tailleur"], hints("Pense à l'artisan qui coud.", "Il a un mètre ruban.", "Le mot commence par la lettre t."), "scène:tailleur"),
    wr("Comment appelle-t-on les mots que dit chaque acteur ? Écris le mot.", ["répliques", "réplique", "texte"], hints("Pense à ce qu'on apprend par cœur.", "Ce sont ses phrases.", "Le mot commence par la lettre r."), "mot:saynète"),
  ],
  STAGE_FACTS,
);

export function makeCe2StagePlace(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-theatre-lieu", "reconnaître le lieu d'une scène : le marché, le dispensaire, l'atelier du tailleur", STAGE_PLACE_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2StageRole(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-theatre-role", "reconnaître le personnage d'une scène : vendeur, client, tailleur, infirmier, malade", STAGE_ROLE_ROWS, 1, (row) => row.prompt, 1);
}
export function makeCe2StageWord(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-theatre-parodie", "le sens des mots du théâtre : parodie, saynète, rôle, répéter, dramatiser", STAGE_WORD_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2StageSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-theatre-glisser", "ranger les scènes de la vie courante et les scènes imaginaires", STAGE_SORT_ROWS, 1, 0);
}
export function makeCe2StageLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-theatre-relier", "relier un mot du théâtre à son sens", STAGE_LINK_ROWS, 1, 0);
}
export function makeCe2StageOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-theatre-ordre", "ranger les étapes pour préparer une saynète et le déroulement d'une scène", STAGE_ORDER_ROWS, 1, 1);
}
export function makeCe2StageGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-theatre-trou", "compléter une phrase sur le théâtre", STAGE_GAP_ROWS, 2, 2);
}
export function makeCe2StageWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-theatre-ecrire", "écrire un mot sur le théâtre", STAGE_WRITE_ROWS, 2, 3);
}
