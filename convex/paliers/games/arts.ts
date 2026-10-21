/**
 * LES GABARITS DES ARTS DU CP : le matériel du peintre, les lignes et les traits, ce qu'on prend pour modeler,
 * peindre ou dessiner, de la voix qui chuchote à la voix qui crie (`ar-cp-melanges`, `ar-cp-traits`, `ar-cp-decorer`,
 * `ar-cp-rythmes`).
 *
 * Ces quatre thématiques mêlaient déjà des jeux (couleurs, dessin sur quadrillage, frises, rythmes) à des exercices
 * du modèle. Les exercices du modèle y étaient faux : « Place les lignes dans les bonnes zones » avec « ~~~ » pour le
 * zigzag (un trait n'est pas un dessin), « Trait délié ~~~~ » (un trait délié est un trait fin, pas une vague),
 * « Associe chaque objet avec son motif » (des fleurs pour la calebasse, des rayures pour le pagne : rien ne le dit),
 * « Associe chaque rythme à son nom » avec « Fais du bruit » rangé dans « Fortement ». Sept exercices sur treize
 * étaient faux. Ici on ne dessine JAMAIS une ligne avec des signes : on la DÉCRIT, ou on la reconnaît dans une chose
 * que l'enfant voit tous les jours, et rien n'invente un lien que la fiche ne donne pas.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Le matériel du peintre : le pinceau, la palette, le gobelet d'eau. Chacun a UN travail.
 * - Les lignes (droite, courbe, zigzag, spirale) et les traits (plein, délié, modulé), chacun défini par ce qu'on voit :
 *   la droite ne tourne jamais, le trait plein est toujours aussi épais. Les « lignes brisées » ne sont pas posées : un
 *   zigzag est déjà une ligne brisée, et les deux se confondraient.
 * - Modeler, peindre, dessiner, et la matière qui va avec chacun : l'argile, le pinceau, le crayon. Aucun motif n'est
 *   attaché à un objet (calebasse, pagne, poterie) : la fiche ne le dit pas.
 * - Les voix, de la plus douce à la plus forte : chuchoter, parler doucement, parler fort, crier.
 *
 * RÈGLES POUR AJOUTER UN ÉLÉMENT
 * - Une ligne se décrit par ce qu'on voit, jamais par un dessin en signes, et deux lignes n'ont jamais la même description.
 * - Un exemple de ligne droite ou courbe est une chose de tous les jours dont la forme ne se discute pas.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Une étiquette est un mot
 *   seul ou une phrase entière, jamais « article + un nom » (au CI, il demanderait une image du catalogue).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame, variantsForLevel } from "./tableaux";

// ===========================================================================
// LE MATÉRIEL DU PEINTRE
// ===========================================================================

/** Les trois outils de la fiche, chacun avec son travail. */
export const PAINT_TOOLS: readonly { tool: string; the: string; role: string }[] = [
  { tool: "pinceau", the: "le pinceau", role: "étaler la peinture" },
  { tool: "palette", the: "la palette", role: "mélanger les couleurs" },
  { tool: "gobelet d'eau", the: "le gobelet d'eau", role: "laver le pinceau" },
];

/** « Quel outil sert à mélanger les couleurs ? » ou « À quoi sert la palette ? » : un outil ou un travail parmi trois. */
export function makePaintTool(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "peinture-outil", "le matériel du peintre", () => {
    const entry = pick(ctx.rng, PAINT_TOOLS);
    const others = PAINT_TOOLS.filter((other) => other.tool !== entry.tool);
    if (ctx.rng() < 0.5) {
      return {
        prompt: `Quel outil sert à ${entry.role} ?`,
        answer: entry.tool,
        wrong: others.map((other) => other.tool),
        hints: ["Pense à ce que tu fais quand tu peins.", "Chaque outil a son travail.", `Le mot commence par la lettre ${firstLetter(entry.tool)}.`],
      };
    }
    return {
      prompt: `À quoi sert ${entry.the} ?`,
      answer: entry.role,
      wrong: others.map((other) => other.role),
      hints: ["Pense à ce que tu fais quand tu peins.", "Chaque outil a son travail.", `Le mot de la réponse commence par la lettre ${firstLetter(entry.role)}.`],
    };
  });
}

/** « Relie chaque outil du peintre à son travail. » : les trois outils, chacun avec son seul travail. */
export function makePaintLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "peinture-relier", "le matériel du peintre", () => ({
    prompt: "Relie chaque outil du peintre à son travail.",
    pairs: shuffle(ctx.rng, PAINT_TOOLS).map((entry) => ({ left: entry.tool, right: entry.role })),
    hints: ["Pense à ce que tu fais quand tu peins.", "Chaque outil a son travail.", "Commence par la paire dont tu es le plus sûr."],
  }));
}

// ===========================================================================
// LES LIGNES ET LES TRAITS
// ===========================================================================

/** Les lignes de la fiche, décrites par ce qu'on voit : deux lignes n'ont jamais la même description. */
export const LINES: readonly { name: string; desc: string }[] = [
  { name: "droite", desc: "ne tourne jamais" },
  { name: "courbe", desc: "est arrondie, comme un arc-en-ciel" },
  { name: "zigzag", desc: "monte et descend en faisant des pointes" },
  { name: "spirale", desc: "tourne en s'enroulant sur elle-même, comme un escargot" },
];

/** « Quelle ligne ne tourne jamais ? » : le nom parmi trois noms de lignes. */
export function makeLineChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ligne-qcm", "reconnaître une ligne", () => {
    // La droite au premier palier, la courbe au deuxième, le zigzag ou la spirale ensuite : deux paliers ne posent jamais la même question.
    const entry = pick(ctx.rng, variantsForLevel(LINES, ctx.level));
    return {
      prompt: `Quelle ligne ${entry.desc} ?`,
      answer: entry.name,
      wrong: shuffle(
        ctx.rng,
        LINES.filter((other) => other.name !== entry.name),
      ).map((other) => other.name),
      hints: ["Imagine la ligne sur ta feuille.", "Lis bien comment elle avance.", `Le mot commence par la lettre ${firstLetter(entry.name)}.`],
    };
  });
}

/** « Relie chaque ligne à ce qu'on voit. » : trois ou quatre lignes et leur description. */
export function makeLineLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ligne-relier", "reconnaître les lignes", () => {
    // Trois lignes au premier palier (droite, courbe, zigzag), trois autres au deuxième, les quatre ensuite : deux paliers n'ont jamais les mêmes paires.
    const lines = ctx.level === 1 ? LINES.slice(0, 3) : ctx.level === 2 ? LINES.slice(1) : LINES;
    return {
      prompt: "Relie chaque ligne à ce qu'on voit.",
      pairs: shuffle(ctx.rng, lines).map((line) => ({ left: line.name, right: line.desc })),
      hints: ["Imagine chaque ligne sur ta feuille.", "Lis bien comment la ligne avance.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

/** Des choses de tous les jours dont le bord est une ligne droite, d'autres dont il est une ligne courbe. */
export const STRAIGHT_THINGS: readonly string[] = ["le bord d'une règle", "un fil bien tendu", "le bord d'un cahier", "le haut du tableau"];
export const CURVED_THINGS: readonly string[] = ["la forme d'un arc-en-ciel", "le bord d'une roue", "le bord d'une assiette", "le bord d'un ballon"];

/** « Glisse chaque chose dans la bonne case. » : une ligne droite, ou une ligne courbe. */
export function makeLineSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ligne-glisser", "ligne droite ou ligne courbe", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque chose dans la bonne case.",
      zones: ["Ligne droite", "Ligne courbe"],
      items: [
        ...shuffle(ctx.rng, STRAIGHT_THINGS)
          .slice(0, each)
          .map((text) => ({ text, zone: "Ligne droite" })),
        ...shuffle(ctx.rng, CURVED_THINGS)
          .slice(0, each)
          .map((text) => ({ text, zone: "Ligne courbe" })),
      ],
      hints: ["Imagine chaque chose en la regardant avec attention.", "Une ligne droite ne tourne pas, une ligne courbe est arrondie.", "Suis le contour de chaque chose avec ton doigt."],
    };
  });
}

/** Les trois traits de la fiche, décrits par leur épaisseur. */
export const STROKES: readonly { name: string; desc: string }[] = [
  { name: "plein", desc: "est toujours aussi épais" },
  { name: "délié", desc: "est très fin" },
  { name: "modulé", desc: "est tantôt épais, tantôt fin" },
];

/** « Quel trait est tantôt épais, tantôt fin ? » : le nom parmi les trois traits. */
export function makeStrokeChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "trait-qcm", "reconnaître un trait", () => {
    const entry = pick(ctx.rng, STROKES);
    return {
      prompt: `Quel trait ${entry.desc} ?`,
      answer: entry.name,
      wrong: STROKES.filter((other) => other.name !== entry.name).map((other) => other.name),
      hints: ["Pense à l'épaisseur du trait.", "Regarde bien les trois mots.", `Le mot commence par la lettre ${firstLetter(entry.name)}.`],
    };
  });
}

// ===========================================================================
// MODELER, PEINDRE, DESSINER
// ===========================================================================

/** Les trois gestes de la fiche, ce qu'on modèle, peint ou dessine, et ce qu'on prend pour le faire. */
export const TECHNIQUES: readonly { verb: string; thing: string; material: string; wrong: readonly string[] }[] = [
  { verb: "modeler", thing: "un pot", material: "argile", wrong: ["pinceau", "ciseaux"] },
  { verb: "peindre", thing: "un mur", material: "pinceau", wrong: ["argile", "ciseaux"] },
  { verb: "dessiner", thing: "une maison", material: "crayon", wrong: ["argile", "ciseaux"] },
];

/** « Que prends-tu pour modeler un pot ? » : la matière parmi trois, dont aucune ne va aussi. */
export function makeTechniqueChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "technique-qcm", "modeler, peindre, dessiner", () => {
    const entry = pick(ctx.rng, TECHNIQUES);
    return {
      prompt: `Que prends-tu pour ${entry.verb} ${entry.thing} ?`,
      answer: entry.material,
      wrong: entry.wrong,
      hints: ["Pense à ce que tes mains tiennent.", "Lis bien ce qu'on veut faire.", `Le mot commence par la lettre ${firstLetter(entry.material)}.`],
    };
  });
}

/** « Relie chaque geste à ce qu'on prend. » : modeler, peindre, dessiner. */
export function makeTechniqueLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "technique-relier", "modeler, peindre, dessiner", () => ({
    prompt: "Relie chaque geste à ce qu'on prend.",
    pairs: shuffle(ctx.rng, TECHNIQUES).map((entry) => ({ left: entry.verb, right: entry.material })),
    hints: ["Pense à ce que tes mains tiennent.", "Touche un geste, puis ce qu'on prend pour le faire.", "Commence par la paire dont tu es le plus sûr."],
  }));
}

// ===========================================================================
// LES VOIX
// ===========================================================================

/** Les voix, de la plus douce à la plus forte. */
export const VOICES: readonly string[] = ["chuchoter", "parler doucement", "parler fort", "crier"];

/** « Mets ces façons de parler dans l'ordre, de la plus douce à la plus forte. » : trois au premier palier, quatre ensuite. */
export function makeVoiceOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "voix-ordre", "du plus doux au plus fort", () => {
    const soft = ctx.rng() < 0.5;
    const chosen = ctx.level === 1 ? shuffle(ctx.rng, VOICES).slice(0, 3).sort((a, b) => VOICES.indexOf(a) - VOICES.indexOf(b)) : [...VOICES];
    return {
      prompt: `Mets ces façons de parler dans l'ordre, ${soft ? "de la plus douce à la plus forte" : "de la plus forte à la plus douce"}.`,
      sequence: soft ? chosen : [...chosen].reverse(),
      hints: ["Pense à ta voix quand tu parles.", "Un murmure s'entend à peine.", "Le cri est ce qui s'entend le plus loin."],
    };
  });
}

/** « Quelle façon de parler est la plus forte ? » : trois voix parmi quatre, la plus forte ou la plus douce des trois. */
export function makeVoiceChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "voix-qcm", "la voix la plus douce ou la plus forte", () => {
    const three = shuffle(ctx.rng, VOICES)
      .slice(0, 3)
      .sort((a, b) => VOICES.indexOf(a) - VOICES.indexOf(b));
    const loud = ctx.rng() < 0.5;
    const answer = loud ? three[2] : three[0];
    return {
      prompt: loud ? "Quelle façon de parler est la plus forte ?" : "Quelle façon de parler est la plus douce ?",
      answer,
      wrong: three.filter((voice) => voice !== answer),
      hints: ["Pense à ta voix quand tu parles.", loud ? "Cherche la voix qu'on entend le plus loin." : "Cherche la voix qu'on entend à peine.", "Compare les trois voix une par une."],
    };
  });
}

/**
 * Une phrase sur la voix, et la seule façon de parler qui la rend vraie. Chaque phrase offre « doucement » ou « fort » parmi
 * des mots qui disent la même chose en plus fort ou en plus doux : une seule des trois réponses va, jamais deux.
 */
const VOICE_SENTENCES: readonly { text: string; answer: string; wrong: readonly string[] }[] = [
  { text: "Une berceuse se chante ___ pour endormir bébé.", answer: "doucement", wrong: ["très fort", "en criant"] },
  { text: "Pour ne pas réveiller bébé, on parle ___.", answer: "doucement", wrong: ["très fort", "en criant"] },
  { text: "Pour dire un secret à l'oreille, on parle ___.", answer: "doucement", wrong: ["fort", "en criant"] },
  { text: "Dans la bibliothèque, on parle ___.", answer: "doucement", wrong: ["fort", "en criant"] },
  { text: "Pour appeler un ami de l'autre côté de la cour, on parle ___.", answer: "fort", wrong: ["doucement", "en chuchotant"] },
  { text: "Pour être entendu au fond de la classe, on parle ___.", answer: "fort", wrong: ["doucement", "en chuchotant"] },
];

/** « Choisis la bonne réponse pour finir la phrase. » : « Une berceuse se chante ___ pour endormir bébé. » */
export function makeVoiceGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "voix-trou", "chanter ou parler doucement ou fort", () => {
    const entry = pick(ctx.rng, VOICE_SENTENCES);
    return {
      prompt: "Choisis la bonne réponse pour finir la phrase.",
      text: entry.text,
      answer: entry.answer,
      wrong: entry.wrong,
      hints: ["Lis toute la phrase en entier.", "Pense à la voix qu'on prend dans cette situation.", `Le mot commence par la lettre ${firstLetter(entry.answer)}.`],
    };
  });
}
