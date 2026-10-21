/**
 * LES GABARITS DES SCIENCES DU CP : solide, liquide ou gaz ; les êtres vivants grandissent ; bien manger ; les maladies du
 * milieu ; protéger la nature (`sc-cp-matiere`, `sc-cp-grandir`, `sc-cp-manger`, `sc-cp-maladies`, `sc-cp-nature`).
 *
 * Sur l'échantillon de CP, le modèle écrivait des exercices à refaire dans un cas sur huit : « Mafé » rangé dans « Liquide »,
 * « Associe chaque étape de vie à son nom » avec des paires qui se suivent (Bébé~Enfant, Enfant~Adulte), « Associe les aliments
 * aux catégories » où « Plat » revient deux fois, un ordre « Mets ces étapes pour faire du yassa » sous une thématique qui parle
 * d'états de la matière, un indice « Le yassa est un plat solide ». Ici tout vient de tableaux FERMÉS, écrits une fois, que le
 * test recalcule à part.
 *
 * LES CINQ FICHES, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Matière : l'eau liquide, la glace solide, la vapeur ; le sable, la pierre, l'air ; ce qui coule et ce qui garde sa forme.
 *   Rien de plus savant : pas de fumée, de nuage, de pâte ni de miel, dont l'état se discute.
 * - Grandir : l'œuf, le poussin, la poule ; la graine, la jeune plante, la plante ; le bébé, l'enfant, l'adulte, le vieillard.
 *   S'y ajoutent la grenouille (œuf, têtard, grenouille) et le nom du petit de quelques animaux de la ferme.
 * - Bien manger : les aliments utiles (fruits, légumes, poisson, mil, lait caillé, niébé), les aliments nuisibles (trop de
 *   sucre, aliments avariés ou mal conservés), manger propre.
 * - Maladies : le paludisme (le moustique, la moustiquaire), la diarrhée (l'eau sale, les mains sales), comment s'en protéger,
 *   aller au dispensaire.
 * - Nature : ne pas jeter de sachets, garder la cour propre, planter et arroser un arbre, protéger plantes et animaux.
 *
 * LES HABITUDES (manger, maladies, nature) suivent la méthode de `gestes.ts` : une SCÈNE est une situation avec LE geste qui
 * convient et trois gestes qui ne conviennent pas, tous compris HORS de leur scène (« Je mange un poisson pourri » est
 * mauvais partout ; jamais « Je le mange », qui dépend de ce qu'on mange). Le `group` rassemble les scènes dont les bons gestes
 * se ressembleraient : elles ne sont jamais reliées dans le même exercice.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Un fait de la fiche, vrai pour un enfant de CP sans « ça dépend » : une chose ne tient dans les tableaux que si son état,
 *   son nom ou sa place se lit sans deviner.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse. Les gestes de toute la table sont tous différents.
 * - Aucun indice n'écrit un mot de quatre lettres ou plus de la bonne réponse ni d'une tuile à placer.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus (la consigne du CP). Aucun émoji.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { cap, choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";

/** Le mot sans son article : « l'agneau » devient « agneau », « la chèvre » devient « chèvre ». */
const bare = (phrase: string) => phrase.replace(/^(l'|le |la |les |un |une |du |de la |des )/u, "");

/** Le texte d'une tuile qui nomme une chose : le nom seul, sans article, avec sa majuscule (« la pierre » devient « Pierre »). */
const tile = (phrase: string) => cap(bare(phrase));

// ===========================================================================
// SOLIDE, LIQUIDE OU GAZ (sc-cp-matiere)
// ===========================================================================

export type MatterState = "solide" | "liquide" | "gaz";

const STATES: readonly MatterState[] = ["solide", "liquide", "gaz"];

/** Des choses de la vie de tous les jours, dont l'état ne se discute pas. */
export const MATTER: readonly { thing: string; state: MatterState }[] = [
  { thing: "le bois", state: "solide" },
  { thing: "la pierre", state: "solide" },
  { thing: "le fer", state: "solide" },
  { thing: "la glace", state: "solide" },
  { thing: "le caillou", state: "solide" },
  { thing: "la craie", state: "solide" },
  { thing: "le sable", state: "solide" },
  { thing: "l'eau", state: "liquide" },
  { thing: "le lait", state: "liquide" },
  { thing: "l'huile", state: "liquide" },
  { thing: "le jus de bissap", state: "liquide" },
  { thing: "la pluie", state: "liquide" },
  { thing: "l'air", state: "gaz" },
  { thing: "la vapeur d'eau", state: "gaz" },
  { thing: "le vent", state: "gaz" },
];

/** Deux indices par état, sans jamais écrire son nom. */
const STATE_HINTS: Record<MatterState, readonly [string, string]> = {
  solide: ["On peut le prendre dans la main sans qu'il coule.", "Il garde sa forme tout seul."],
  liquide: ["On peut le verser d'un récipient dans un autre.", "Il prend la forme du verre où on le verse."],
  gaz: ["On ne peut pas le tenir dans la main.", "Il remplit toute la place qu'on lui laisse."],
};

/** « Dans quel état est la pierre ? » : solide, liquide ou gaz. */
export function makeMatterChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "etat-qcm", "l'état d'une chose", () => {
    const entry = pickFresh(ctx, MATTER, (candidate) => `etat-qcm:${candidate.thing}`);
    return {
      prompt: `Dans quel état est ${entry.thing} ?`,
      answer: entry.state,
      wrong: STATES.filter((state) => state !== entry.state),
      hints: ["Lis la question en entier.", STATE_HINTS[entry.state][0], STATE_HINTS[entry.state][1]],
    };
  });
}

/** Ce qui sépare deux états, pour l'indice du glissé. */
const PAIR_HINTS: Record<string, string> = {
  "liquide|solide": "Ce qui coule d'un verre n'est pas ce qu'on tient dans la main.",
  "gaz|solide": "On tient dans la main ce qui garde sa forme, pas ce qui flotte autour de nous.",
  "gaz|liquide": "On peut verser ce qui coule, pas ce qui flotte autour de nous.",
};

/** « Glisse chaque chose dans la bonne case. » : deux états sur trois, deux ou trois choses de chacun. */
export function makeMatterSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "etat-glisser", "ranger des choses selon leur état", () => {
    const [first, second] = shuffle(ctx.rng, STATES).slice(0, 2);
    const each = ctx.level === 1 ? 2 : 3;
    const items = [first, second].flatMap((state) =>
      shuffle(
        ctx.rng,
        MATTER.filter((entry) => entry.state === state),
      )
        .slice(0, each)
        .map((entry) => ({ text: tile(entry.thing), zone: cap(state) })),
    );
    return {
      prompt: "Glisse chaque chose dans la bonne case.",
      zones: [cap(first), cap(second)],
      items,
      hints: ["Lis les mots un par un.", PAIR_HINTS[[first, second].sort().join("|")], "Commence par celui dont tu es certain."],
    };
  });
}

/** « Relie chaque état à un exemple. » : les trois états, un exemple de chacun. */
export function makeMatterLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "etat-relier", "relier un état et un exemple", () => ({
    prompt: "Relie chaque état à un exemple.",
    pairs: STATES.map((state) => ({
      left: cap(state),
      right: tile(
        pick(
          ctx.rng,
          MATTER.filter((entry) => entry.state === state),
        ).thing,
      ),
    })),
    hints: ["Lis les trois états, puis les trois exemples.", "Pense à ce qui coule et à ce qui garde sa forme.", "Commence par celui dont tu es certain."],
  }));
}

/** Ce qui arrive à l'eau quand elle chauffe ou refroidit, dans les trois sens que la fiche nomme. */
const CHANGES: readonly { question: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { question: "Que devient un glaçon posé au soleil ?", answer: "Eau", wrong: ["Pierre", "Bois"], hint: "Ce qui était dur coule maintenant." },
  { question: "Que devient l'eau mise longtemps au congélateur ?", answer: "Glace", wrong: ["Vapeur", "Lait"], hint: "Le froid fait durcir ce qui coulait." },
  { question: "Que voit-on monter d'une casserole qui bout ?", answer: "Vapeur", wrong: ["Glace", "Sable"], hint: "La chaleur envoie l'eau dans les airs." },
];

/** « Que devient un glaçon posé au soleil ? » : ce que le chaud ou le froid fait à l'eau. */
export function makeMatterChange(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "etat-change", "ce que la chaleur et le froid font à l'eau", () => {
    const entry = pickFresh(ctx, CHANGES, (candidate) => `etat-change:${candidate.question}`);
    return {
      prompt: entry.question,
      answer: entry.answer,
      wrong: entry.wrong,
      hints: ["Lis la question en entier.", entry.hint, "Pense au chaud et au froid."],
    };
  });
}

/** Deux suites qui n'ont qu'un ordre : la glace qu'on chauffe, la vapeur qu'on refroidit. */
const MATTER_ORDERS: readonly { prompt: string; steps: readonly [string, string, string] }[] = [
  { prompt: "Mets dans le bon ordre ce que devient un glaçon chauffé longtemps.", steps: ["Glace", "Eau", "Vapeur"] },
  { prompt: "Mets dans le bon ordre ce que devient de la vapeur qu'on refroidit longtemps.", steps: ["Vapeur", "Eau", "Glace"] },
];

/** « Mets dans le bon ordre ce que devient un glaçon chauffé longtemps. » */
export function makeMatterOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "etat-ordre", "remettre dans l'ordre les changements de l'eau", () => {
    const entry = pickFresh(ctx, MATTER_ORDERS, (candidate) => `etat-ordre:${candidate.prompt}`);
    return {
      prompt: entry.prompt,
      sequence: entry.steps,
      hints: ["Lis les trois mots avant de les ranger.", "Le froid durcit, la chaleur fait couler.", "Pense à ce qui arrive en premier."],
    };
  });
}

/** Des phrases à trou sur les états : un seul mot va dans la phrase. */
export const MATTER_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { text: "Un ___ garde sa forme.", answer: "solide", wrong: ["liquide", "gaz"], hint: "Une pierre reste comme elle est." },
  { text: "Un ___ coule et prend la forme du verre.", answer: "liquide", wrong: ["solide", "gaz"], hint: "On peut le verser d'un récipient dans un autre." },
  { text: "Un ___ remplit toute la place qu'il trouve.", answer: "gaz", wrong: ["solide", "liquide"], hint: "On ne peut pas le tenir dans la main." },
  { text: "L'air est un ___.", answer: "gaz", wrong: ["solide", "liquide"], hint: "On ne le voit pas, mais il est partout autour de nous." },
  { text: "La glace est de l'eau ___.", answer: "solide", wrong: ["liquide", "gaz"], hint: "Elle est dure, on peut la tenir." },
  { text: "L'eau du robinet est un ___.", answer: "liquide", wrong: ["solide", "gaz"], hint: "Elle coule dans le verre." },
  { text: "Le bois est un ___.", answer: "solide", wrong: ["liquide", "gaz"], hint: "Une table garde sa forme." },
  { text: "Le lait est un ___.", answer: "liquide", wrong: ["solide", "gaz"], hint: "On le verse dans un bol." },
  { text: "Au congélateur, l'eau devient de la ___.", answer: "glace", wrong: ["vapeur", "pierre"], hint: "Le froid fait durcir l'eau." },
  { text: "Quand l'eau bout dans la casserole, elle donne de la ___.", answer: "vapeur", wrong: ["glace", "poussière"], hint: "Elle monte dans les airs en nuage blanc." },
  { text: "Au soleil, un glaçon ___.", answer: "fond", wrong: ["durcit", "grandit"], hint: "Il devient de l'eau." },
];

/** « L'air est un ___. » : un seul mot va dans la phrase. */
export function makeMatterGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "etat-trou", "compléter une phrase sur les états de la matière", () => {
    const gap = pickFresh(ctx, MATTER_GAPS, (candidate) => `etat-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase avec le bon mot.",
      text: gap.text,
      answer: gap.answer,
      wrong: gap.wrong,
      hints: ["Lis la phrase en entier.", gap.hint, `Le mot commence par la lettre ${firstLetter(gap.answer)}.`],
    };
  });
}

/** Un mot à écrire : l'état, ou le nom de l'eau quand elle change. Les variantes admises sont des mots de la liste fermée. */
export const MATTER_WORDS: readonly { prompt: string; accepted: readonly string[]; hint: string }[] = [
  {
    prompt: "Dans le congélateur, l'eau devient dure comme une pierre. Écris le mot qui la nomme.",
    accepted: ["glace", "la glace", "de la glace", "glaçon", "un glaçon", "le glaçon"],
    hint: "On en met dans une boisson pour la rafraîchir.",
  },
  {
    prompt: "Quand une casserole bout, un nuage blanc monte. Écris son nom.",
    accepted: ["vapeur", "la vapeur", "de la vapeur"],
    hint: "L'eau chaude monte dans les airs sous cette forme.",
  },
  {
    prompt: "Une pierre garde sa forme. Écris le mot qui dit son état.",
    accepted: ["solide", "un solide"],
    hint: "On peut la prendre dans la main sans qu'elle coule.",
  },
  {
    prompt: "Le lait coule dans un verre. Écris le mot qui dit son état.",
    accepted: ["liquide", "un liquide"],
    hint: "On peut le verser d'un récipient dans un autre.",
  },
  {
    prompt: "Autour de nous, il y a de l'air. Écris le mot qui dit son état.",
    accepted: ["gaz", "un gaz"],
    hint: "On ne le voit pas et on ne peut pas le tenir.",
  },
];

/** « Une pierre garde sa forme. Écris le mot qui dit son état. » : un mot à écrire. */
export function makeMatterWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "etat-ecrire", () => {
    const entry = pickFresh(ctx, MATTER_WORDS, (candidate) => `etat-ecrire:${candidate.accepted[0]}`);
    return {
      type: "short-answer",
      prompt: entry.prompt,
      payload: { acceptedAnswers: [...entry.accepted], game: originOf("etat-ecrire", ctx), concept: "écrire l'état de la matière" },
      answerKey: entry.accepted[0],
      hints: ["Lis bien la phrase.", entry.hint, `Le mot commence par la lettre ${firstLetter(entry.accepted[0])}.`],
    };
  });
}

// ===========================================================================
// LES ÊTRES VIVANTS GRANDISSENT (sc-cp-grandir)
// ===========================================================================

/** Une vie, étape par étape. `who` complète « Dans la vie… » : jamais d'apostrophe en plus de celle d'une étape. */
export const CYCLES: readonly { who: string; steps: readonly string[] }[] = [
  { who: "de la poule", steps: ["l'œuf", "le poussin", "la poule"] },
  { who: "de la plante", steps: ["la graine", "la jeune plante", "la plante"] },
  { who: "de la personne", steps: ["le bébé", "l'enfant", "l'adulte", "le vieillard"] },
  { who: "de la grenouille", steps: ["l'œuf", "le têtard", "la grenouille"] },
];

/** « Mets dans le bon ordre les étapes de la vie de la poule. » */
export function makeLifeOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "vie-ordre", "remettre dans l'ordre les étapes d'une vie", () => {
    const cycle = pickFresh(ctx, CYCLES, (candidate) => `vie-ordre:${candidate.who}`);
    return {
      prompt: `Mets dans le bon ordre les étapes de la vie ${cycle.who}.`,
      sequence: cycle.steps.map(tile),
      hints: ["Lis tous les mots avant de les ranger.", "Le temps passe d'une étape à la suivante.", "Commence par le tout début de la vie."],
    };
  });
}

/** Chaque étape avec la suivante et la précédente : de quoi demander « juste après » et « juste avant ». */
const NEIGHBOURS = CYCLES.flatMap((cycle) =>
  cycle.steps.flatMap((step, index) => [
    ...(index < cycle.steps.length - 1 ? [{ cycle, step, answer: cycle.steps[index + 1], way: "après" }] : []),
    ...(index > 0 ? [{ cycle, step, answer: cycle.steps[index - 1], way: "avant" }] : []),
  ]),
);

const ALL_STEPS = Array.from(new Set(CYCLES.flatMap((cycle) => cycle.steps)));

/** « Dans la vie de la poule, quelle étape vient juste après l'œuf ? » : les mauvais choix sont d'une autre vie. */
export function makeLifeNext(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "vie-suite", "l'étape qui vient juste avant ou juste après", () => {
    const entry = pickFresh(ctx, NEIGHBOURS, (candidate) => `vie-suite:${candidate.cycle.who}:${candidate.step}:${candidate.way}`);
    const elsewhere = ALL_STEPS.filter((step) => !entry.cycle.steps.includes(step));
    return {
      prompt: `Dans la vie ${entry.cycle.who}, quelle étape vient juste ${entry.way} ${entry.step} ?`,
      answer: tile(entry.answer),
      wrong: shuffle(ctx.rng, elsewhere).slice(0, 2).map(tile),
      hints: ["Lis bien la question.", "Imagine l'être vivant qui grandit, une étape après l'autre.", "Les autres choix viennent d'une autre vie."],
    };
  });
}

/** Le petit de quelques animaux de la ferme. `of` complète « le petit… ». */
export const YOUNG: readonly { adult: string; of: string; young: string }[] = [
  { adult: "la poule", of: "de la poule", young: "le poussin" },
  { adult: "le chien", of: "du chien", young: "le chiot" },
  { adult: "le chat", of: "du chat", young: "le chaton" },
  { adult: "le mouton", of: "du mouton", young: "l'agneau" },
  { adult: "la vache", of: "de la vache", young: "le veau" },
  { adult: "la chèvre", of: "de la chèvre", young: "le chevreau" },
  { adult: "le cheval", of: "du cheval", young: "le poulain" },
];

/** « Comment s'appelle le petit du chien ? » ou « Le chiot est le petit de quel animal ? » */
export function makeLifeYoung(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "vie-petit", "le petit d'un animal", () => {
    const entry = pickFresh(ctx, YOUNG, (candidate) => `vie-petit:${candidate.adult}`);
    const others = YOUNG.filter((other) => other !== entry);
    if (ctx.rng() < 0.5) {
      return {
        prompt: `Comment s'appelle le petit ${entry.of} ?`,
        answer: tile(entry.young),
        wrong: shuffle(ctx.rng, others).map((other) => tile(other.young)),
        hints: ["Lis bien la question.", "Chaque petit a un nom à lui.", `Le mot commence par la lettre ${firstLetter(bare(entry.young))}.`],
      };
    }
    return {
      prompt: `${cap(entry.young)} est le petit de quel animal ?`,
      answer: tile(entry.adult),
      wrong: shuffle(ctx.rng, others).map((other) => tile(other.adult)),
      hints: ["Lis bien la question.", "Un petit a une mère de son espèce.", `Le mot commence par la lettre ${firstLetter(bare(entry.adult))}.`],
    };
  });
}

/** « Relie chaque animal à son petit. » : trois ou quatre paires. */
export function makeLifeLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "vie-relier", "relier un animal et son petit", () => ({
    prompt: "Relie chaque animal à son petit.",
    pairs: shuffle(ctx.rng, YOUNG)
      .slice(0, ctx.level >= 3 ? 4 : 3)
      .map((entry) => ({ left: tile(entry.adult), right: tile(entry.young) })),
    hints: ["Lis les petits un par un.", "Chaque petit a une seule mère.", "Commence par celui dont tu es certain."],
  }));
}

const GROWS = ["le poussin", "le chat", "l'enfant", "le manguier", "le mil", "le mouton", "le bébé", "le baobab", "la plante", "le chiot", "le têtard", "la chèvre"];
const STAYS = ["la pierre", "la chaise", "le cahier", "le seau", "le ballon", "la table", "le crayon", "la tasse", "le caillou", "le balai"];

/** « Glisse chaque mot dans la bonne case. » : ce qui grandit, ce qui ne grandit pas. */
export function makeLifeSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "vie-glisser", "ce qui grandit et ce qui ne grandit pas", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque mot dans la bonne case.",
      zones: ["Ça grandit", "Ça ne grandit pas"],
      items: [
        ...shuffle(ctx.rng, GROWS)
          .slice(0, each)
          .map((text) => ({ text: tile(text), zone: "Ça grandit" })),
        ...shuffle(ctx.rng, STAYS)
          .slice(0, each)
          .map((text) => ({ text: tile(text), zone: "Ça ne grandit pas" })),
      ],
      hints: ["Lis les mots un par un.", "Un être vivant grandit avec le temps.", "Un objet reste tel qu'il est."],
    };
  });
}

/** Des phrases à trou sur la vie qui grandit : un seul mot va dans la phrase. */
export const LIFE_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { text: "Un œuf de poule donne un ___.", answer: "poussin", wrong: ["chiot", "agneau"], hint: "C'est un tout petit oiseau jaune." },
  { text: "Le poussin devient une ___ en grandissant.", answer: "poule", wrong: ["graine", "pierre"], hint: "C'est l'oiseau que l'on élève dans la cour." },
  { text: "Une graine pousse et devient une ___.", answer: "plante", wrong: ["poule", "pierre"], hint: "Elle a des racines et des feuilles." },
  { text: "Le bébé devient un ___ en grandissant.", answer: "enfant", wrong: ["poussin", "têtard"], hint: "Il marche, court et va à l'école." },
  { text: "Un enfant devient un ___ en grandissant.", answer: "adulte", wrong: ["poussin", "têtard"], hint: "Il est grand et il travaille." },
  { text: "Le têtard devient une ___.", answer: "grenouille", wrong: ["poule", "graine"], hint: "Elle saute près de la mare." },
  { text: "Une ___ ne grandit pas.", answer: "pierre", wrong: ["plante", "poule"], hint: "Elle est dure, et elle ne vit pas." },
  { text: "Le petit du chien s'appelle le ___.", answer: "chiot", wrong: ["poussin", "veau"], hint: "C'est un petit qui aboie." },
  { text: "Le petit de la vache s'appelle le ___.", answer: "veau", wrong: ["chaton", "agneau"], hint: "Il boit le lait de sa mère." },
];

/** « Le têtard devient une ___. » : un seul mot va dans la phrase. */
export function makeLifeGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "vie-trou", "compléter une phrase sur les êtres vivants qui grandissent", () => {
    const gap = pickFresh(ctx, LIFE_GAPS, (candidate) => `vie-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase avec le bon mot.",
      text: gap.text,
      answer: gap.answer,
      wrong: gap.wrong,
      hints: ["Lis la phrase en entier.", gap.hint, `Le mot commence par la lettre ${firstLetter(gap.answer)}.`],
    };
  });
}

// ===========================================================================
// LES HABITUDES : bien manger, les maladies du milieu, protéger la nature
// ===========================================================================

export type HabitTopic = "manger" | "maladies" | "nature";

/** Les trois thématiques. La clé `vocabulary` d'un jeu d'habitudes est l'une d'elles ; sans elle, toutes les scènes servent. */
export const HABIT_TOPICS: readonly HabitTopic[] = ["manger", "maladies", "nature"];

type Habit = {
  topic: HabitTopic;
  /** Les scènes d'un même groupe ont des bons gestes qui se ressemblent : jamais reliées dans le même exercice. */
  group: string;
  /** La situation, dite à l'enfant : elle ne dit pas ce qu'il faut faire. */
  text: string;
  /** La même situation en étiquette courte, pour l'association. */
  label: string;
  /** Le seul geste qui convienne. */
  right: string;
  /** Trois gestes à éviter, mauvais même hors de la scène. */
  wrong: readonly [string, string, string];
  /** Pourquoi, en une phrase qui n'écrit aucun mot du bon geste. */
  hint: string;
};

export const HABITS: readonly Habit[] = [
  // ===== Bien manger =====
  {
    topic: "manger",
    group: "mains",
    text: "Tu vas manger ton repas.",
    label: "Avant de manger",
    right: "Je me lave les mains avec du savon avant de manger.",
    wrong: ["Je mange avec des mains sales.", "Je touche le sol puis je mange.", "Je m'essuie les mains sur mon pantalon."],
    hint: "Les microbes aiment les doigts sales.",
  },
  {
    topic: "manger",
    group: "mains",
    text: "Tu aides à préparer le repas.",
    label: "Tu aides en cuisine",
    right: "Je me lave les mains avant de toucher la nourriture.",
    wrong: ["Je touche la nourriture avec des mains sales.", "Je goûte la sauce avec mes doigts sales.", "Je pose la viande crue sur le sol."],
    hint: "On évite de salir ce que l'on va manger.",
  },
  {
    topic: "manger",
    group: "fruit",
    text: "Tu as acheté un fruit au marché.",
    label: "Un fruit du marché",
    right: "Je lave le fruit avant de le manger.",
    wrong: ["Je mange le fruit sans le laver.", "Je ramasse le fruit par terre et je le mange.", "Je frotte le fruit sur mon habit sale."],
    hint: "La peau garde la poussière du marché.",
  },
  {
    topic: "manger",
    group: "reste",
    text: "Il reste du riz après le repas.",
    label: "Du riz qui reste",
    right: "Je couvre le riz qui reste avec un couvercle.",
    wrong: ["Je laisse le riz sans couvercle toute la nuit.", "Je laisse le riz par terre dans la cour.", "Je pose le riz sur le sol de la cuisine."],
    hint: "Les mouches aiment se poser sur un plat ouvert.",
  },
  {
    topic: "manger",
    group: "poisson",
    text: "Le poisson sent très mauvais.",
    label: "Un poisson abîmé",
    right: "Je jette un poisson qui sent mauvais.",
    wrong: ["Je mange un poisson qui sent mauvais.", "Je donne un poisson pourri à mon petit frère.", "Je mange un poisson pourri après l'avoir fait cuire."],
    hint: "Un aliment abîmé peut rendre malade.",
  },
  {
    topic: "manger",
    group: "pain",
    text: "Le pain a des taches vertes.",
    label: "Du pain avec des taches",
    right: "Je jette le pain qui a des taches vertes.",
    wrong: ["Je mange le pain qui a des taches vertes.", "Je donne du pain moisi à mon camarade.", "Je range du pain moisi dans mon cartable."],
    hint: "Un aliment abîmé fait mal au ventre.",
  },
  {
    topic: "manger",
    group: "bonbons",
    text: "On t'offre beaucoup de bonbons.",
    label: "Beaucoup de bonbons",
    right: "Je mange un bonbon et je garde le reste pour demain.",
    wrong: ["Je mange tous les bonbons d'un seul coup.", "Je mange des bonbons à la place du repas.", "Je mange des bonbons toute la journée."],
    hint: "Trop de sucre abîme les dents.",
  },
  {
    topic: "manger",
    group: "variete",
    text: "Tu veux bien manger.",
    label: "Un bon repas",
    right: "Je mange des fruits, des légumes et du poisson.",
    wrong: ["Je mange seulement des bonbons.", "Je ne mange que du sucre.", "Je saute le repas pour manger des gâteaux."],
    hint: "Un repas varié aide le corps à grandir.",
  },
  {
    topic: "manger",
    group: "table",
    text: "Le repas est servi.",
    label: "Le repas est servi",
    right: "Je m'assois à table pour manger calmement.",
    wrong: ["Je mange en courant dans la cour.", "Je mange en jouant au ballon.", "Je mange debout en marchant partout."],
    hint: "Un repas se prend sans courir.",
  },
  // ===== Les maladies du milieu =====
  {
    topic: "maladies",
    group: "nuit",
    text: "La nuit, les moustiques sont nombreux.",
    label: "La nuit avec les moustiques",
    right: "Je dors sous une moustiquaire.",
    wrong: ["Je dors sans moustiquaire.", "Je dors dans l'herbe, les bras à l'air.", "Je laisse la porte ouverte toute la nuit."],
    hint: "Un filet fin empêche les insectes de piquer.",
  },
  {
    topic: "maladies",
    group: "eau-qui-dort",
    text: "De l'eau reste dans de vieux seaux.",
    label: "Eau dans de vieux seaux",
    right: "Je vide l'eau des vieux seaux.",
    wrong: ["Je laisse l'eau dormir dans les vieux seaux.", "Je remplis d'eau les vieux seaux et je les laisse.", "Je laisse les seaux pleins d'eau sale dans la cour."],
    hint: "Les moustiques pondent dans l'eau qui ne bouge pas.",
  },
  {
    topic: "maladies",
    group: "boire",
    text: "Tu as très soif.",
    label: "Tu as soif",
    right: "Je bois de l'eau propre.",
    wrong: ["Je bois l'eau sale de la mare.", "Je bois l'eau d'un seau plein de saletés.", "Je bois l'eau qui traîne dans la rue."],
    hint: "Une eau claire et couverte ne rend pas malade.",
  },
  {
    topic: "maladies",
    group: "mains",
    text: "Tu sors des toilettes.",
    label: "Tu sors des toilettes",
    right: "Je me lave les mains avec du savon après les toilettes.",
    wrong: ["Je retourne jouer sans me laver les mains.", "Je m'essuie les mains sur mon habit.", "Je passe de l'eau sale sur mes mains."],
    hint: "Les microbes restent sur les doigts.",
  },
  {
    topic: "maladies",
    group: "soin",
    text: "Tu as de la fièvre et tu te sens très mal.",
    label: "Tu as de la fièvre",
    right: "Je préviens un adulte pour aller au dispensaire.",
    wrong: ["Je me cache et je ne dis rien.", "Je reste seul sans parler à personne.", "Je prends un médicament trouvé dans la rue."],
    hint: "Un soignant sait quoi donner afin de guérir.",
  },
  {
    topic: "maladies",
    group: "conseil",
    text: "Le médecin te donne un conseil.",
    label: "Un conseil du médecin",
    right: "J'écoute le médecin et je suis ses conseils.",
    wrong: ["Je n'écoute pas le médecin.", "Je jette le médicament donné par le médecin.", "Je donne mon médicament à un camarade."],
    hint: "Il sait ce qui fait guérir.",
  },
  {
    topic: "maladies",
    group: "soir",
    text: "Le soir, les moustiques sortent.",
    label: "Le soir arrive",
    right: "Je porte des habits longs le soir.",
    wrong: ["Je sors torse nu à la tombée de la nuit.", "Je reste en short près de la mare le soir.", "Je joue dehors sans rien sur les bras le soir."],
    hint: "Le tissu couvre la peau que les insectes piquent.",
  },
  {
    topic: "maladies",
    group: "soin",
    text: "Ton ventre te fait mal et tu vas souvent aux toilettes.",
    label: "Ton ventre te fait mal",
    right: "Je dis à un adulte que j'ai mal au ventre.",
    wrong: ["Je cache mon mal de ventre à tout le monde.", "Je bois de l'eau sale pour me soigner.", "Je cours jouer en oubliant mon mal de ventre."],
    hint: "Une grande personne sait comment t'aider.",
  },
  // ===== Protéger la nature =====
  {
    topic: "nature",
    group: "dechet",
    text: "Tu as fini ton goûter, le sachet est vide.",
    label: "Un sachet vide",
    right: "Je mets le sachet vide à la poubelle.",
    wrong: ["Je jette le sachet vide par terre.", "Je jette le sachet vide dans la rivière.", "Je cache le sachet vide sous une pierre."],
    hint: "Un déchet a sa place, et ce n'est pas dehors.",
  },
  {
    topic: "nature",
    group: "cour",
    text: "La cour est pleine de papiers.",
    label: "Une cour pleine de papiers",
    right: "Je ramasse les papiers de la cour.",
    wrong: ["Je laisse les papiers par terre.", "J'ajoute d'autres papiers sur le sol.", "Je pousse les papiers sous un arbre."],
    hint: "Un endroit propre fait du bien à tous.",
  },
  {
    topic: "nature",
    group: "arbre",
    text: "Tu as un petit arbre à planter.",
    label: "Un petit arbre à planter",
    right: "Je plante le petit arbre dans la terre.",
    wrong: ["Je jette le petit arbre sur le sol.", "Je piétine le petit arbre.", "Je coupe le petit arbre pour jouer."],
    hint: "Les racines doivent aller sous le sol.",
  },
  {
    topic: "nature",
    group: "arbre",
    text: "Le petit arbre a soif.",
    label: "Un arbre qui a soif",
    right: "J'arrose le petit arbre avec de l'eau.",
    wrong: ["Je laisse le petit arbre sans eau pendant des jours.", "Je tire fort sur les feuilles du petit arbre.", "Je coupe les branches du petit arbre sans raison."],
    hint: "Une plante boit par ses racines.",
  },
  {
    topic: "nature",
    group: "oiseaux",
    text: "Tu trouves un nid d'oiseau dans un arbre.",
    label: "Un nid dans un arbre",
    right: "Je laisse le nid tranquille.",
    wrong: ["Je prends les œufs du nid.", "Je jette des cailloux sur le nid.", "Je casse la branche du nid."],
    hint: "Les petits oiseaux ont besoin de leur maison.",
  },
  {
    topic: "nature",
    group: "insectes",
    text: "Un papillon se pose sur une fleur.",
    label: "Un papillon sur une fleur",
    right: "Je regarde le papillon sans le toucher.",
    wrong: ["J'attrape le papillon pour le serrer fort.", "J'écrase le papillon avec mon pied.", "J'enferme le papillon dans une boîte fermée."],
    hint: "Un animal fragile mérite le calme.",
  },
  {
    topic: "nature",
    group: "fleurs",
    text: "Il y a des fleurs dans le jardin de l'école.",
    label: "Des fleurs à l'école",
    right: "Je regarde les fleurs sans les arracher.",
    wrong: ["J'arrache les fleurs pour jouer.", "Je marche sur les fleurs pour aller plus vite.", "Je coupe toutes les fleurs sans raison."],
    hint: "Une fleur arrachée ne repousse pas.",
  },
  {
    topic: "nature",
    group: "dechet",
    text: "Des sacs en plastique volent dans la rue.",
    label: "Des sacs en plastique",
    right: "Je ramasse les sacs en plastique avec un adulte.",
    wrong: ["Je laisse les sacs en plastique dans la rue.", "Je jette les sacs en plastique dans le fleuve.", "Je mets le feu aux sacs en plastique."],
    hint: "Ce qui est jeté dehors abîme le quartier.",
  },
  {
    topic: "nature",
    group: "chien",
    text: "Un chien a soif dans la cour.",
    label: "Un chien qui a soif",
    right: "Je donne de l'eau à un chien qui a soif.",
    wrong: ["Je lance des cailloux à un chien qui a soif.", "Je chasse un chien qui a soif avec un bâton.", "Je tire la queue d'un chien qui a soif."],
    hint: "Tous les êtres vivants ont besoin de boire.",
  },
  {
    topic: "nature",
    group: "ombre",
    text: "Un grand arbre donne de l'ombre dans la cour.",
    label: "Un arbre qui fait de l'ombre",
    right: "Je prends soin du grand arbre de la cour.",
    wrong: ["Je grave mon nom dans l'écorce du grand arbre.", "Je casse les branches du grand arbre.", "Je mets le feu au pied du grand arbre."],
    hint: "Il nous protège du soleil et de la chaleur.",
  },
];

type Routine = { topic: HabitTopic; prompt: string; steps: readonly string[] };

/** Des suites de gestes qui n'ont qu'un ordre. */
export const ROUTINES: readonly Routine[] = [
  { topic: "manger", prompt: "Mets ces gestes dans le bon ordre pour manger propre.", steps: ["Je me lave les mains.", "Je m'assois à table.", "Je mange mon repas."] },
  { topic: "manger", prompt: "Mets ces gestes dans le bon ordre pour manger un fruit.", steps: ["Je prends le fruit.", "Je lave le fruit avec de l'eau propre.", "Je mange le fruit."] },
  { topic: "manger", prompt: "Mets ces gestes dans le bon ordre pour préparer le poisson.", steps: ["Je me lave les mains.", "Je lave le poisson.", "Je fais cuire le poisson."] },
  { topic: "maladies", prompt: "Mets ces gestes dans le bon ordre quand tu es malade.", steps: ["Je dis que je suis malade.", "Je vais au dispensaire avec un adulte.", "Je suis les conseils du médecin."] },
  { topic: "maladies", prompt: "Mets ces gestes dans le bon ordre après les toilettes.", steps: ["Je sors des toilettes.", "Je me lave les mains avec du savon.", "Je retourne en classe."] },
  { topic: "maladies", prompt: "Mets ces gestes dans le bon ordre pour boire de l'eau propre.", steps: ["Je prends un verre propre.", "Je verse de l'eau propre.", "Je bois mon eau."] },
  { topic: "nature", prompt: "Mets ces gestes dans le bon ordre pour planter un arbre.", steps: ["Je fais un trou dans la terre.", "Je plante le petit arbre.", "J'arrose le petit arbre."] },
  { topic: "nature", prompt: "Mets ces gestes dans le bon ordre pour garder la cour propre.", steps: ["Je prends un balai.", "Je balaie la cour.", "Je mets les déchets à la poubelle."] },
  { topic: "nature", prompt: "Mets ces gestes dans le bon ordre pour jeter un sachet.", steps: ["Je mange mon goûter.", "Je prends le sachet vide.", "Je mets le sachet à la poubelle."] },
];

type HabitGap = { topic: HabitTopic; text: string; answer: string; wrong: readonly [string, string]; hint: string };

/** Des phrases à trou : un seul mot va dans la phrase. */
export const HABIT_GAPS: readonly HabitGap[] = [
  { topic: "manger", text: "Avant de manger, je me lave les ___.", answer: "mains", wrong: ["pieds", "genoux"], hint: "On s'en sert pour tenir la cuillère." },
  { topic: "manger", text: "Je lave le fruit avec de l'eau ___.", answer: "propre", wrong: ["sale", "boueuse"], hint: "Elle est claire et ne rend pas malade." },
  { topic: "manger", text: "Un aliment pourri me rend ___.", answer: "malade", wrong: ["content", "fort"], hint: "Le ventre fait mal." },
  { topic: "manger", text: "Trop de bonbons abîment mes ___.", answer: "dents", wrong: ["chaussures", "cheveux"], hint: "On les brosse après le repas." },
  { topic: "manger", text: "Je couvre le repas pour que les ___ ne se posent pas dessus.", answer: "mouches", wrong: ["éléphants", "étoiles"], hint: "Ce sont de petits insectes qui volent." },
  { topic: "manger", text: "Le poisson, le mil et le niébé sont des aliments ___.", answer: "utiles", wrong: ["nuisibles", "pourris"], hint: "Ils aident le corps à grandir." },
  { topic: "manger", text: "Je mange des fruits et des ___ tous les jours.", answer: "légumes", wrong: ["cailloux", "crayons"], hint: "Ce sont des carottes, des choux ou des oignons." },
  { topic: "maladies", text: "Le paludisme se prend par la piqûre d'un ___.", answer: "moustique", wrong: ["escargot", "papillon"], hint: "C'est un insecte qui vole la nuit." },
  { topic: "maladies", text: "Pour dormir sans être piqué, je mets une ___.", answer: "moustiquaire", wrong: ["casserole", "chaussure"], hint: "C'est un filet fin au-dessus du lit." },
  { topic: "maladies", text: "L'eau sale peut donner la ___.", answer: "diarrhée", wrong: ["chance", "musique"], hint: "On a mal au ventre et on court aux toilettes." },
  { topic: "maladies", text: "Je bois de l'eau ___ pour ne pas être malade.", answer: "propre", wrong: ["sale", "trouble"], hint: "Elle est claire et bien gardée." },
  { topic: "maladies", text: "Je me lave les mains avec du ___.", answer: "savon", wrong: ["sable", "sucre"], hint: "Il fait de la mousse." },
  { topic: "maladies", text: "Quand je suis malade, je vais au ___.", answer: "dispensaire", wrong: ["marché", "stade"], hint: "Un infirmier y soigne les gens." },
  { topic: "maladies", text: "Les moustiques pondent dans l'eau qui ne ___ pas.", answer: "bouge", wrong: ["chante", "mange"], hint: "Une eau calme reste au même endroit." },
  { topic: "nature", text: "Je mets mes déchets dans la ___.", answer: "poubelle", wrong: ["rivière", "rue"], hint: "Elle a un couvercle et on la vide." },
  { topic: "nature", text: "Un petit arbre a besoin d'être ___ souvent.", answer: "arrosé", wrong: ["coupé", "brûlé"], hint: "On lui verse de l'eau." },
  { topic: "nature", text: "Les sachets en plastique abîment la ___.", answer: "nature", wrong: ["musique", "soupe"], hint: "Elle comprend les plantes, les animaux et l'eau." },
  { topic: "nature", text: "Je ramasse les papiers pour garder la cour ___.", answer: "propre", wrong: ["sale", "cassée"], hint: "On peut s'y asseoir sans se salir." },
  { topic: "nature", text: "Pour protéger les oiseaux, je laisse leur ___ tranquille.", answer: "nid", wrong: ["cartable", "ballon"], hint: "C'est leur maison dans l'arbre." },
  { topic: "nature", text: "Quand un arbre est coupé, je plante un nouvel ___.", answer: "arbre", wrong: ["ballon", "cahier"], hint: "Il pousse dans la terre et donne de l'ombre." },
  { topic: "nature", text: "Je ne jette pas de papier ___.", answer: "par terre", wrong: ["à la poubelle", "dans le sac"], hint: "Le sol de la cour doit rester net." },
];

// ===========================================================================
// LES CHOIX D'HABITUDES
// ===========================================================================

const isHabitTopic = (value: string | undefined): value is HabitTopic => HABIT_TOPICS.includes(value as HabitTopic);

/** Les scènes de la thématique du jeu (sans `vocabulary`, toutes). */
const habitsOf = (ctx: GameContext): readonly Habit[] => (isHabitTopic(ctx.vocabulary) ? HABITS.filter((habit) => habit.topic === ctx.vocabulary) : HABITS);

/** Des scènes toutes différentes : les `n` premières d'un mélange. */
const someHabits = (ctx: GameContext, n: number) => shuffle(ctx.rng, habitsOf(ctx)).slice(0, n);

/** Le dernier indice d'une situation : ce que le bon geste protège. */
const ASK: Record<HabitTopic, string> = {
  manger: "Choisis le geste qui aide ton corps à rester en bonne santé.",
  maladies: "Choisis le geste qui te protège de la maladie.",
  nature: "Choisis le geste qui protège la nature.",
};

/** « Tu as très soif. Que faut-il faire ? » : le bon geste parmi deux mauvais. */
export function makeHabitChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "habitude-situation", "le bon geste dans une situation", () => {
    const habit = pickFresh(ctx, habitsOf(ctx), (candidate) => `habitude-situation:${candidate.text}`);
    return {
      prompt: `${habit.text} Que faut-il faire ?`,
      answer: habit.right,
      // Les deux mauvais gestes de longueur la plus proche : un bon geste deux fois plus long que les autres se devine.
      wrong: [...habit.wrong].sort((a, b) => Math.abs(a.length - habit.right.length) - Math.abs(b.length - habit.right.length)).slice(0, 2),
      hints: ["Lis bien la situation.", habit.hint, ASK[habit.topic]],
    };
  });
}

/** « Glisse chaque geste dans la bonne case. » : les bons gestes de plusieurs scènes, leurs mauvais gestes. */
export function makeHabitSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "habitude-glisser", "ranger les gestes à faire et à éviter", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const habits = someHabits(ctx, each * 2);
    const good = habits.slice(0, each).map((habit) => ({ text: habit.right, zone: "À faire" }));
    const bad = habits.slice(each).map((habit) => ({ text: shuffle(ctx.rng, habit.wrong)[0], zone: "À éviter" }));
    return {
      prompt: "Glisse chaque geste dans la bonne case.",
      zones: ["À faire", "À éviter"],
      items: [...good, ...bad],
      hints: ["Lis les gestes un par un.", "Un geste qui aide la santé ou la nature appartient à « À faire ».", "Un geste qui abîme ou rend malade appartient à « À éviter »."],
    };
  });
}

/** Deux gestes de longueur voisine de `target`, tirés parmi les quatre plus proches. */
const alike = (ctx: GameContext, target: string, pool: readonly string[]): string[] =>
  shuffle(
    ctx.rng,
    [...pool].sort((a, b) => Math.abs(a.length - target.length) - Math.abs(b.length - target.length)).slice(0, 4),
  ).slice(0, 2);

/** « Quel geste est bien ? » ou « …n'est pas bien ? » : un geste d'un côté, deux de l'autre, de trois scènes différentes. */
export function makeHabitOdd(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "habitude-intrus", "reconnaître un bon ou un mauvais geste", () => {
    const [first, ...others] = shuffle(ctx.rng, habitsOf(ctx));
    const wantGood = ctx.rng() < 0.5;
    const wrongOf = (habit: Habit) => shuffle(ctx.rng, habit.wrong)[0];
    if (wantGood) {
      return {
        prompt: "Quel geste est bien ?",
        answer: first.right,
        wrong: alike(ctx, first.right, others.map(wrongOf)),
        hints: ["Lis les trois gestes un par un.", "Un bon geste protège le corps ou la nature.", "Un geste fautif cause du tort."],
      };
    }
    const answer = wrongOf(first);
    return {
      prompt: "Quel geste n'est pas bien ?",
      answer,
      wrong: alike(
        ctx,
        answer,
        others.map((habit) => habit.right),
      ),
      hints: ["Lis les trois gestes un par un.", "Les bons gestes protègent le corps ou la nature.", "Un geste fautif cause du tort."],
    };
  });
}

/** « Relie chaque situation au bon geste. » : trois ou quatre scènes de groupes différents. */
export function makeHabitLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "habitude-relier", "relier une situation et le bon geste", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: Habit[] = [];
    for (const habit of shuffle(ctx.rng, habitsOf(ctx))) {
      if (chosen.every((other) => other.group !== habit.group)) chosen.push(habit);
      if (chosen.length === wanted) break;
    }
    return {
      prompt: "Relie chaque situation au bon geste.",
      pairs: chosen.map((habit) => ({ left: habit.label, right: habit.right })),
      hints: ["Lis une situation, puis un geste.", "Trouve le geste qui aide à rester en bonne santé.", "Commence par celle dont tu es certain."],
    };
  });
}

/** « Mets ces gestes dans le bon ordre pour planter un arbre. » : une suite qui n'a qu'un ordre. */
export function makeHabitSequence(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "habitude-ordre", "remettre des gestes dans l'ordre", () => {
    const pool = isHabitTopic(ctx.vocabulary) ? ROUTINES.filter((routine) => routine.topic === ctx.vocabulary) : ROUTINES;
    const routine = pickFresh(ctx, pool, (candidate) => `habitude-ordre:${candidate.prompt}`);
    return {
      prompt: routine.prompt,
      sequence: routine.steps,
      hints: ["Pense d'abord au début de la scène.", "Un geste en entraîne un autre.", "Imagine la scène en lisant les gestes."],
    };
  });
}

/** « Je mets mes déchets dans la ___. » : un seul mot va dans la phrase. */
export function makeHabitGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "habitude-trou", "compléter une règle de santé ou de nature", () => {
    const pool = isHabitTopic(ctx.vocabulary) ? HABIT_GAPS.filter((gap) => gap.topic === ctx.vocabulary) : HABIT_GAPS;
    const gap = pickFresh(ctx, pool, (candidate) => `habitude-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase avec le bon mot.",
      text: gap.text,
      answer: gap.answer,
      wrong: gap.wrong,
      hints: ["Lis la phrase en entier.", gap.hint, `Le mot commence par la lettre ${firstLetter(gap.answer)}.`],
    };
  });
}

// ===========================================================================
// BIEN MANGER : les aliments (sc-cp-manger)
// ===========================================================================

/** Des aliments utiles : ceux de la fiche. */
export const GOOD_FOODS: readonly string[] = ["la mangue", "la banane", "l'orange", "la papaye", "la carotte", "le chou", "le poisson frais", "le mil", "le lait caillé", "le niébé"];

/** Des aliments nuisibles : trop de sucre, ou avariés. */
export const BAD_FOODS: readonly string[] = ["trop de bonbons", "trop de sucre", "trop de gâteaux", "du poisson pourri", "du pain moisi", "du riz resté au soleil", "un fruit pourri", "de la viande avariée"];

/** « Quel aliment fait du bien au corps ? » ou « Quel aliment faut-il éviter ? » : un aliment d'un côté, deux de l'autre. */
export function makeMealChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "repas-qcm", "reconnaître un aliment utile ou nuisible", () => {
    if (ctx.rng() < 0.5) {
      const [answer] = shuffle(ctx.rng, GOOD_FOODS);
      return {
        prompt: "Quel aliment fait du bien au corps ?",
        answer: tile(answer),
        wrong: shuffle(ctx.rng, BAD_FOODS)
          .slice(0, 2)
          .map(tile),
        hints: ["Lis les trois aliments.", "Un aliment propre et bien gardé aide le corps à grandir.", "Un aliment abîmé ou donné en excès fait du mal."],
      };
    }
    const [answer] = shuffle(ctx.rng, BAD_FOODS);
    return {
      prompt: "Quel aliment faut-il éviter ?",
      answer: tile(answer),
      wrong: shuffle(ctx.rng, GOOD_FOODS)
        .slice(0, 2)
        .map(tile),
      hints: ["Lis les trois aliments.", "Un aliment abîmé peut rendre malade.", "Des douceurs en grande quantité abîment les dents."],
    };
  });
}

/** « Glisse chaque aliment dans la bonne case. » : bon pour le corps, à éviter. */
export function makeMealSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "repas-glisser", "ranger les aliments utiles et nuisibles", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque aliment dans la bonne case.",
      zones: ["Bon pour le corps", "À éviter"],
      items: [
        ...shuffle(ctx.rng, GOOD_FOODS)
          .slice(0, each)
          .map((food) => ({ text: tile(food), zone: "Bon pour le corps" })),
        ...shuffle(ctx.rng, BAD_FOODS)
          .slice(0, each)
          .map((food) => ({ text: tile(food), zone: "À éviter" })),
      ],
      hints: ["Lis les aliments un par un.", "Un aliment propre et bien gardé fait du bien.", "Un aliment abîmé ou donné en excès est à éviter."],
    };
  });
}

/** Des fruits et des légumes dont le classement ne se discute pas (ni tomate, ni gombo, ni aubergine, fruits pour le botaniste). */
export const FRUITS: readonly string[] = ["la mangue", "la banane", "l'orange", "la papaye", "la pastèque", "la goyave"];
export const VEGETABLES: readonly string[] = ["la carotte", "le chou", "la laitue", "l'oignon", "le navet"];

/** « Glisse chaque aliment dans la bonne case. » : fruits, légumes. */
export function makeFruitVegetableSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "repas-fruit-legume", "distinguer un fruit et un légume", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque aliment dans la bonne case.",
      zones: ["Fruits", "Légumes"],
      items: [
        ...shuffle(ctx.rng, FRUITS)
          .slice(0, each)
          .map((food) => ({ text: tile(food), zone: "Fruits" })),
        ...shuffle(ctx.rng, VEGETABLES)
          .slice(0, each)
          .map((food) => ({ text: tile(food), zone: "Légumes" })),
      ],
      hints: ["Lis les aliments un par un.", "Un fruit est doux et pousse sur un arbre ou une plante.", "Un légume accompagne souvent le plat de riz ou de poisson."],
    };
  });
}

// ===========================================================================
// LES MALADIES DU MILIEU : se protéger (sc-cp-maladies)
// ===========================================================================

const AGAINST_MALARIA: readonly string[] = ["Dormir sous une moustiquaire", "Vider les vieux seaux d'eau", "Porter des habits longs le soir", "Fermer la fenêtre avant la nuit"];
const AGAINST_DIARRHEA: readonly string[] = ["Boire de l'eau propre", "Se laver les mains avec du savon", "Laver les fruits avant de les manger", "Couvrir les restes du repas"];

export const ILLNESS_ZONES = ["Contre le paludisme", "Contre la diarrhée"] as const;

/** « Glisse chaque geste dans la bonne case. » : contre le paludisme, contre la diarrhée. */
export function makeIllnessSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "maladie-glisser", "se protéger du paludisme et de la diarrhée", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque geste dans la bonne case.",
      zones: [ILLNESS_ZONES[0], ILLNESS_ZONES[1]],
      items: [
        ...shuffle(ctx.rng, AGAINST_MALARIA)
          .slice(0, each)
          .map((text) => ({ text, zone: ILLNESS_ZONES[0] })),
        ...shuffle(ctx.rng, AGAINST_DIARRHEA)
          .slice(0, each)
          .map((text) => ({ text, zone: ILLNESS_ZONES[1] })),
      ],
      hints: ["Lis les gestes un par un.", "Un insecte pique, une eau sale donne mal au ventre.", "Pense à ce qui arrête le moustique, puis à ce qui garde le ventre sain."],
    };
  });
}

/** Les causes et les protections, une question à la fois. Les mauvais choix ne sont ni une cause ni une protection. */
export const ILLNESS_FACTS: readonly { question: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { question: "Par quoi le paludisme se prend-il ?", answer: "la piqûre d'un moustique", wrong: ["la piqûre d'une fourmi", "le vent du soir"], hint: "C'est un insecte qui vole la nuit." },
  { question: "Qu'est-ce qui peut donner la diarrhée ?", answer: "boire de l'eau sale", wrong: ["dormir sous une moustiquaire", "se laver les mains"], hint: "Ce qu'on avale peut faire mal au ventre." },
  { question: "Qu'est-ce qui peut donner la diarrhée ?", answer: "manger avec des mains sales", wrong: ["boire de l'eau propre", "dormir sous une moustiquaire"], hint: "Les microbes passent des doigts à la bouche." },
  { question: "Que faut-il faire pour ne pas attraper le paludisme ?", answer: "dormir sous une moustiquaire", wrong: ["laisser l'eau dormir dans les seaux", "sortir torse nu le soir"], hint: "Un filet fin empêche l'insecte de piquer." },
  { question: "Que faut-il faire pour ne pas attraper la diarrhée ?", answer: "se laver les mains avec du savon", wrong: ["dormir sous une moustiquaire", "jouer dans l'eau sale"], hint: "Il fait de la mousse et chasse les microbes." },
  { question: "Où va-t-on quand on est très malade ?", answer: "au dispensaire", wrong: ["au marché", "au stade"], hint: "Un infirmier y soigne les gens." },
];

/** « Qu'est-ce qui peut donner la diarrhée ? » : la cause ou la protection, parmi trois. */
export function makeIllnessFact(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "maladie-cause", "les causes et les protections des maladies du milieu", () => {
    const fact = pickFresh(ctx, ILLNESS_FACTS, (candidate) => `maladie-cause:${candidate.question}|${candidate.answer}`);
    return {
      prompt: fact.question,
      answer: cap(fact.answer),
      wrong: fact.wrong.map(cap),
      hints: ["Lis la question en entier.", fact.hint, "Les deux autres choix sont à côté de la question."],
    };
  });
}

// ===========================================================================
// PROTÉGER LA NATURE : réparer (sc-cp-nature)
// ===========================================================================

/** Un problème et ce qui le répare. Les problèmes d'un même groupe se réparent de façons voisines : jamais dans le même exercice. */
export const REPAIRS: readonly { group: string; problem: string; repair: string }[] = [
  { group: "propre", problem: "Une cour sale", repair: "La balayer" },
  { group: "propre", problem: "Des papiers par terre", repair: "Les ramasser" },
  { group: "plante", problem: "Une plante sans eau", repair: "L'arroser" },
  { group: "arbre", problem: "Un arbre coupé", repair: "Planter un arbre" },
  { group: "arbre", problem: "Une fleur arrachée", repair: "Planter une fleur" },
  { group: "animal", problem: "Un chien qui a soif", repair: "Lui donner de l'eau" },
  { group: "dechet", problem: "Un sachet par terre", repair: "À la poubelle" },
];

/** « Relie chaque problème à ce qui le répare. » : trois ou quatre paires de groupes différents. */
export function makeRepairLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "nature-reparer", "relier un problème de la nature et ce qui le répare", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: (typeof REPAIRS)[number][] = [];
    for (const entry of shuffle(ctx.rng, REPAIRS)) {
      if (chosen.every((other) => other.group !== entry.group)) chosen.push(entry);
      if (chosen.length === wanted) break;
    }
    return {
      prompt: "Relie chaque problème à ce qui le répare.",
      pairs: chosen.map((entry) => ({ left: entry.problem, right: entry.repair })),
      hints: ["Lis un problème, puis une réparation.", "Pense à ce que tu peux faire pour arranger les choses.", "Commence par celui dont tu es certain."],
    };
  });
}
