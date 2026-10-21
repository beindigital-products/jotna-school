/**
 * LES GABARITS DE « JOUER UN RÔLE » AU CP (`ar-cp-roles`) : qui fait quoi (le vendeur au marché, le maître, l'infirmière, le
 * pêcheur), quel objet pour quel rôle, imiter un animal.
 *
 * Sur l'échantillon de CP, le modèle écrivait « Le pêcheur a besoin d'un chapeau » (le filet, pas le chapeau), « Qui est le
 * vendeur au marché ? » avec « le marchand » pour bonne réponse, « Nomme un rôle que l'on trouve au marché » avec trois réponses
 * admises dont « acheteur », un ordre « Choisir un costume, Imiter le rôle, Jouer avec des amis » sans rien de vrai ni de faux.
 * Ici chaque métier est écrit une fois, avec son travail, son objet, ses deux gestes ; c'est de là que vient tout le reste.
 *
 * LA MAISON DES MÉTIERS. Huit métiers que l'enfant de CP voit autour de lui. Chacun a UN objet qui n'est à aucun autre
 * (la balance, la craie, le thermomètre, le filet, la daba, le volant, la machine à coudre, le four) et DEUX gestes de son
 * travail, qui ne sont à aucun autre. Un jeu de rôles est un jeu : on ne demande pas à l'enfant de connaître le métier, mais
 * de reconnaître le geste ou l'objet qui lui va.
 *
 * LES CRIS. Huit animaux de la maison et de la mare, avec le cri que tous les enfants imitent.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Un objet ou un geste qui n'est à aucun autre métier de la table : « un thermomètre » est à l'infirmière, pas « une blouse ».
 * - Aucun indice n'écrit un mot de quatre lettres ou plus de la bonne réponse.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus (la consigne du CP). Aucun émoji.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { cap, choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";

/** Le mot sans son article : « l'infirmière » devient « infirmière », « le pêcheur » devient « pêcheur ». */
const bare = (phrase: string) => phrase.replace(/^(l'|le |la |les |un |une )/u, "");

/** Le texte d'une tuile qui nomme une chose : le nom seul, sans article, avec sa majuscule (« la pierre » devient « Pierre »). */
const tile = (phrase: string) => cap(bare(phrase));

type Job = {
  /** Le nom entier, avec son article : l'option d'un QCM. */
  job: string;
  /** « au pêcheur », « à l'infirmière » : pour demander « Quel objet sert… ». */
  to: string;
  /** Le nom court, une étiquette d'association. */
  label: string;
  /** Deux gestes de son travail, à la troisième personne. Aucun n'est à un autre métier de la table. */
  tasks: readonly [string, string];
  /** Son objet, qui n'est à aucun autre métier de la table. */
  tool: string;
  /** À quoi sert l'objet, sans en écrire le nom. */
  toolHint: string;
};

export const JOBS: readonly Job[] = [
  { job: "le vendeur", to: "au vendeur", label: "vendeur", tasks: ["vend des mangues au marché", "pèse les fruits sur la balance"], tool: "une balance", toolHint: "Il sert à peser ce qu'on achète." },
  { job: "le maître", to: "au maître", label: "maître", tasks: ["apprend à lire aux élèves", "écrit au tableau"], tool: "une craie", toolHint: "Il sert à écrire sur le tableau noir." },
  { job: "l'infirmière", to: "à l'infirmière", label: "infirmière", tasks: ["soigne les malades", "prend la température"], tool: "un thermomètre", toolHint: "Il sert à savoir si l'on a de la fièvre." },
  { job: "le pêcheur", to: "au pêcheur", label: "pêcheur", tasks: ["attrape des poissons", "répare ses filets"], tool: "un filet", toolHint: "Il sert à prendre les poissons dans l'eau." },
  { job: "le cultivateur", to: "au cultivateur", label: "cultivateur", tasks: ["cultive le champ", "sème le mil"], tool: "une daba", toolHint: "Il sert à retourner la terre du champ." },
  { job: "le chauffeur", to: "au chauffeur", label: "chauffeur", tasks: ["conduit le car", "tient le volant"], tool: "un volant", toolHint: "Il sert à tourner pour guider le car." },
  { job: "le tailleur", to: "au tailleur", label: "tailleur", tasks: ["coud des habits", "prend les mesures d'un client"], tool: "une machine à coudre", toolHint: "Elle sert à assembler le tissu avec du fil." },
  { job: "le boulanger", to: "au boulanger", label: "boulanger", tasks: ["fait le pain", "fait cuire des baguettes"], tool: "un four", toolHint: "Il sert à cuire la pâte." },
];

/** Un métier et deux autres, tous différents. */
const threeJobs = (ctx: GameContext) => shuffle(ctx.rng, JOBS).slice(0, 3);

/** « Qui soigne les malades ? » : le métier, parmi trois. */
export function makeJobWho(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "metier-qui", "qui fait quoi", () => {
    // Deux questions d'un même palier ne parlent pas du même métier.
    const entry = pickFresh(ctx, JOBS, (candidate) => `metier-qui:${candidate.job}`);
    const others = shuffle(
      ctx.rng,
      JOBS.filter((other) => other !== entry),
    ).slice(0, 2);
    const task = shuffle(ctx.rng, entry.tasks)[0];
    return {
      prompt: `Qui ${task} ?`,
      answer: tile(entry.job),
      wrong: others.map((other) => tile(other.job)),
      hints: ["Lis bien la question.", "Pense au métier de chacun.", `Le mot commence par la lettre ${firstLetter(bare(entry.job))}.`],
    };
  });
}

/** « Quel objet sert au pêcheur ? » : l'objet de ce métier, parmi trois. */
export function makeJobTool(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "metier-outil", "quel objet pour quel rôle", () => {
    const [entry, ...others] = threeJobs(ctx);
    return {
      prompt: `Quel objet sert ${entry.to} ?`,
      answer: tile(entry.tool),
      wrong: others.map((other) => tile(other.tool)),
      hints: ["Lis bien la question.", entry.toolHint, "Un objet aide à faire le travail."],
    };
  });
}

/** « Relie chaque métier à son travail. » ou « …à son objet. » : trois ou quatre paires. */
export function makeJobLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "metier-relier", "relier un métier et son travail ou son objet", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen = shuffle(ctx.rng, JOBS).slice(0, wanted);
    if (ctx.rng() < 0.5) {
      return {
        prompt: "Relie chaque métier à son travail.",
        pairs: chosen.map((entry) => ({ left: entry.label, right: shuffle(ctx.rng, entry.tasks)[0] })),
        hints: ["Lis les travaux un par un.", "Chaque métier a son travail.", "Commence par celui dont tu es certain."],
      };
    }
    return {
      prompt: "Relie chaque métier à son objet.",
      pairs: chosen.map((entry) => ({ left: entry.label, right: tile(entry.tool) })),
      hints: ["Lis les objets un par un.", "Un objet aide à faire le travail.", "Commence par celui dont tu es certain."],
    };
  });
}

/** « Glisse chaque travail chez celui qui le fait. » : deux métiers, leurs deux gestes chacun. */
export function makeJobSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "metier-glisser", "ranger les gestes de deux métiers", () => {
    const [first, second] = shuffle(ctx.rng, JOBS);
    return {
      prompt: "Glisse chaque travail chez celui qui le fait.",
      zones: [tile(first.job), tile(second.job)],
      items: [
        ...first.tasks.map((task) => ({ text: cap(task), zone: tile(first.job) })),
        ...second.tasks.map((task) => ({ text: cap(task), zone: tile(second.job) })),
      ],
      hints: ["Lis les travaux un par un.", "Chaque métier a son travail.", "Commence par celui dont tu es certain."],
    };
  });
}

/** Des phrases à trou : un seul mot va dans la phrase. */
export const JOB_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { text: "Le ___ attrape des poissons avec un filet.", answer: "pêcheur", wrong: ["vendeur", "tailleur"], hint: "Il va sur l'eau, en pirogue." },
  { text: "L'infirmière soigne les ___.", answer: "malades", wrong: ["poissons", "habits"], hint: "Elle travaille au dispensaire." },
  { text: "Le maître apprend à lire aux ___.", answer: "élèves", wrong: ["poissons", "champs"], hint: "Ils sont assis dans la classe." },
  { text: "Pour jouer le pêcheur, je prends un ___.", answer: "filet", wrong: ["four", "volant"], hint: "Il sert à prendre les poissons dans l'eau." },
  { text: "Le boulanger fait cuire le ___.", answer: "pain", wrong: ["filet", "tableau"], hint: "On le mange avec la sauce ou avec du beurre." },
  { text: "Le cultivateur travaille dans son ___.", answer: "champ", wrong: ["four", "tableau"], hint: "Le mil y pousse." },
  { text: "Le chauffeur conduit le ___.", answer: "car", wrong: ["poisson", "pain"], hint: "Il emmène les gens sur la route." },
  { text: "Le tailleur coud des ___.", answer: "habits", wrong: ["poissons", "pains"], hint: "On les porte sur le corps." },
  { text: "Le vendeur pèse les fruits sur la ___.", answer: "balance", wrong: ["craie", "daba"], hint: "Elle indique combien ça pèse." },
];

/** « Le chauffeur conduit le ___. » : un seul mot va dans la phrase. */
export function makeJobGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "metier-trou", "compléter une phrase sur un métier", () => {
    const gap = pickFresh(ctx, JOB_GAPS, (candidate) => `metier-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase avec le bon mot.",
      text: gap.text,
      answer: gap.answer,
      wrong: gap.wrong,
      hints: ["Lis la phrase en entier.", gap.hint, `Le mot commence par la lettre ${firstLetter(gap.answer)}.`],
    };
  });
}

/** Des suites qui n'ont qu'un ordre : le travail d'un métier, un achat au marché, le jeu de rôles lui-même. */
export const JOB_ORDERS: readonly { prompt: string; steps: readonly [string, string, string] }[] = [
  { prompt: "Mets dans le bon ordre le travail du pêcheur.", steps: ["Il lance son filet.", "Il tire son filet.", "Il apporte les poissons au marché."] },
  { prompt: "Mets dans le bon ordre le travail du boulanger.", steps: ["Il prépare la pâte.", "Il fait cuire le pain.", "Il vend le pain chaud."] },
  { prompt: "Mets dans le bon ordre une visite chez l'infirmière.", steps: ["Le malade entre au dispensaire.", "L'infirmière prend sa température.", "L'infirmière le soigne."] },
  { prompt: "Mets dans le bon ordre un achat au marché.", steps: ["Le client dit bonjour.", "Le client choisit une mangue.", "Le client paye le vendeur."] },
  { prompt: "Mets dans le bon ordre le jeu de rôles.", steps: ["Je choisis mon rôle.", "Je prends mon déguisement.", "Je joue mon rôle avec mes amis."] },
  { prompt: "Mets dans le bon ordre le travail du cultivateur.", steps: ["Il prépare la terre avec sa daba.", "Il sème le mil.", "Il récolte le mil mûr."] },
];

/** « Mets dans le bon ordre le travail du pêcheur. » : une suite qui n'a qu'un ordre. */
export function makeJobOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "metier-ordre", "remettre dans l'ordre un travail ou une scène", () => {
    const order = pickFresh(ctx, JOB_ORDERS, (candidate) => `metier-ordre:${candidate.prompt}`);
    return {
      prompt: order.prompt,
      sequence: order.steps,
      hints: ["Pense d'abord au début de la scène.", "Un geste en entraîne un autre.", "Imagine la scène en lisant les phrases."],
    };
  });
}

/**
 * Un métier à écrire : le geste ou l'objet qui le désigne, jamais son nom. Les variantes admises sont les noms du même métier
 * (le marchand vend, le couturier coud, le conducteur conduit, le paysan cultive, l'instituteur enseigne).
 */
export const JOB_WORDS: readonly { prompt: string; accepted: readonly string[]; hint: string }[] = [
  {
    prompt: "Dans un jeu de rôles, tu lances un filet à la mer pour attraper des poissons. Quel métier joues-tu ? Écris le mot.",
    accepted: ["pêcheur", "un pêcheur", "le pêcheur"],
    hint: "Il va sur l'eau, en pirogue.",
  },
  {
    prompt: "Dans un jeu de rôles, tu pèses des mangues et tu les vends au marché. Quel métier joues-tu ? Écris le mot.",
    accepted: ["vendeur", "un vendeur", "le vendeur", "vendeuse", "une vendeuse", "marchand", "un marchand", "le marchand"],
    hint: "Il crie le prix de ses fruits.",
  },
  {
    prompt: "Dans un jeu de rôles, tu fais cuire du pain dans un four. Quel métier joues-tu ? Écris le mot.",
    accepted: ["boulanger", "un boulanger", "le boulanger"],
    hint: "Il se lève très tôt pour que le pain soit chaud.",
  },
  {
    prompt: "Dans un jeu de rôles, tu couds des habits avec du fil et une aiguille. Quel métier joues-tu ? Écris le mot.",
    accepted: ["tailleur", "un tailleur", "le tailleur", "couturier", "un couturier", "le couturier"],
    hint: "Il prend les mesures de ses clients.",
  },
  {
    prompt: "Dans un jeu de rôles, tu tiens un volant et tu conduis le car. Quel métier joues-tu ? Écris le mot.",
    accepted: ["chauffeur", "un chauffeur", "le chauffeur", "conducteur", "un conducteur", "le conducteur"],
    hint: "Il emmène les gens d'une ville à l'autre.",
  },
  {
    prompt: "Dans un jeu de rôles, tu travailles la terre du champ avec une daba. Quel métier joues-tu ? Écris le mot.",
    accepted: ["cultivateur", "un cultivateur", "le cultivateur", "paysan", "un paysan", "le paysan"],
    hint: "Il sème le mil et attend la pluie.",
  },
  {
    prompt: "Dans un jeu de rôles, tu écris au tableau et tu apprends à lire aux élèves. Quel métier joues-tu ? Écris le mot.",
    accepted: ["maître", "un maître", "le maître", "maîtresse", "une maîtresse", "la maîtresse", "instituteur", "un instituteur", "institutrice", "une institutrice"],
    hint: "Il travaille dans la classe, devant les élèves.",
  },
  {
    prompt: "Dans un jeu de rôles, tu prends la température d'un malade et tu le soignes. Quel métier joues-tu ? Écris le mot.",
    accepted: ["infirmière", "une infirmière", "l'infirmière", "infirmier", "un infirmier", "l'infirmier"],
    hint: "Elle travaille au dispensaire.",
  },
];

/** « Dans un jeu de rôles, tu lances un filet à la mer. Quel métier joues-tu ? » : un mot à écrire. */
export function makeJobWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "metier-ecrire", () => {
    const entry = pickFresh(ctx, JOB_WORDS, (candidate) => `metier-ecrire:${candidate.accepted[0]}`);
    return {
      type: "short-answer",
      prompt: entry.prompt,
      payload: { acceptedAnswers: [...entry.accepted], game: originOf("metier-ecrire", ctx), concept: "écrire le nom d'un métier" },
      answerKey: entry.accepted[0],
      hints: ["Lis bien la phrase.", entry.hint, `Le mot commence par la lettre ${firstLetter(entry.accepted[0])}.`],
    };
  });
}

// ===========================================================================
// IMITER UN ANIMAL
// ===========================================================================

/** Huit animaux et le cri que tous les enfants imitent. */
export const CRIES: readonly { animal: string; cry: string }[] = [
  { animal: "le chat", cry: "miaou" },
  { animal: "le chien", cry: "ouaf" },
  { animal: "la vache", cry: "meuh" },
  { animal: "le mouton", cry: "bê" },
  { animal: "le coq", cry: "cocorico" },
  { animal: "la grenouille", cry: "coa-coa" },
  { animal: "l'âne", cry: "hi-han" },
  { animal: "le canard", cry: "coin-coin" },
];

/** « Quel animal fait « miaou » ? » ou « Que dit le chat ? » : l'animal ou son cri, parmi trois. */
export function makeCryChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "imiter-qcm", "imiter un animal", () => {
    const entry = pickFresh(ctx, CRIES, (candidate) => `imiter-qcm:${candidate.animal}`);
    const others = shuffle(
      ctx.rng,
      CRIES.filter((other) => other !== entry),
    );
    if (ctx.rng() < 0.5) {
      return {
        prompt: `Quel animal fait « ${entry.cry} » ?`,
        answer: tile(entry.animal),
        wrong: others.map((other) => tile(other.animal)),
        hints: ["Lis bien la question.", "Chaque animal a son cri.", `Le mot commence par la lettre ${firstLetter(bare(entry.animal))}.`],
      };
    }
    return {
      prompt: `Que dit ${entry.animal} ?`,
      answer: entry.cry,
      wrong: others.map((other) => other.cry),
      hints: ["Lis bien la question.", "Chaque animal a son cri.", `Le mot commence par la lettre ${firstLetter(entry.cry)}.`],
    };
  });
}

/** « Relie chaque animal à son cri. » : trois ou quatre paires. */
export function makeCryLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "imiter-relier", "relier un animal et son cri", () => ({
    prompt: "Relie chaque animal à son cri.",
    pairs: shuffle(ctx.rng, CRIES)
      .slice(0, ctx.level >= 3 ? 4 : 3)
      .map((entry) => ({ left: tile(entry.animal), right: entry.cry })),
    hints: ["Lis les cris un par un.", "Chaque animal a son cri.", "Commence par celui dont tu es certain."],
  }));
}
