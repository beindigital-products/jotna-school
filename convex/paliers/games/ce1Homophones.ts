/**
 * LES GABARITS DES HOMOPHONES DU CE1 : a ou à, et ou est, on ou ont, avec les astuces de la fiche (a se remplace par avait, est par était,
 * ont par avaient), l'accord du verbe avec son sujet et le signe qui termine une phrase (`fr-ce1-homophones`).
 *
 * Le modèle écrivait des phrases où deux mots allaient, ou aucun : « Awa ___ un cahier » avec « a » et « est » parmi les choix, des
 * trous sans astuce possible, des signes de ponctuation laissés au hasard. Ici chaque exercice lit une phrase d'un tableau fermé, écrite
 * à la main, où UN SEUL des mots proposés va : les deux autres choix font une phrase fausse (une faute, pas une autre bonne réponse).
 *
 * COMMENT UNE PHRASE EST CHOISIE
 * - Pour a ou à : « a » quand la phrase reste juste avec « avait » (un sujet à la troisième personne, jamais « tu »), « à » quand elle ne le
 *   supporte pas (jouer à, aller à, à midi, à côté de). Le troisième choix est « as » : il n'a pas de sens avec un sujet à la troisième personne.
 * - Pour et ou est : « est » quand la phrase reste juste avec « était », « et » quand elle ajoute une chose à une autre. Troisième choix : « es ».
 * - Pour on ou ont : « ont » quand la phrase reste juste avec « avaient », « on » quand « il » ou « elle » la remplace. Troisième choix : « en ».
 * - Un verbe s'accorde avec son sujet : un seul sujet (-e), « tu » (-es), plusieurs sujets (-ent). Les trois formes sont écrites une à une.
 * - Un signe de fin se choisit sur ce que la phrase FAIT, dit dans l'énoncé (elle raconte, elle pose une question, elle crie la joie) :
 *   un point, un point d'interrogation, un point d'exclamation. La virgule ne termine jamais une phrase.
 *
 * PIÈGES
 * - Un homophone qui va dans les deux sens (« Awa est un cahier » est une phrase juste mais absurde) ne sert pas dans un appariement : les
 *   phrases de `LINK_POOL` n'admettent qu'un seul des six mots.
 * - « à » et « a » ne se distinguent pas à l'écrit sans accent : une réponse à écrire ne porte jamais sur cette paire (le contrôle d'une
 *   réponse effacerait l'accent). Les réponses à écrire sont « est », « et », « on » et « ont ».
 * - Un indice ne répète aucun mot de quatre lettres ou plus d'une bonne réponse ou d'un choix ; les mots « avait », « était » et « avaient »
 *   ne s'écrivent donc jamais dans l'indice de la question qui les demande.
 * - Les étiquettes sont des mots-outils : aucune ne nomme une chose, rien à illustrer au CI.
 *
 * COMME AU CP ET AU CI : un énoncé n'a aucun « : », au plus une apostrophe droite, vingt-huit mots au plus ; aucun émoji.
 *
 * HORS FICHE, À FAIRE RELIRE : les phrases de la vie courante (Awa, Moussa, Fatou, le riz, le marché, la mosquée, la plage), les verbes
 * regarder, écouter, ranger, laver, lancer au-delà de chanter, jouer, manger et danser, et la façon de dire le signe de fin (« une phrase
 * qui crie la joie »).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { linkGame, type Hints } from "./tableaux";
import { binSort, factChoice, factGap, factWriteLine, quarter, triples, type Bin, type Fact, type GapFact, type WriteFact } from "./ce1SciencesOutils";

const HOMOPHONES = "choisir entre a et à, et et est, on et ont";

// ===========================================================================
// A OU À, ET OU EST, ON OU ONT : une phrase à trou, trois choix
// ===========================================================================

const A_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par avait.",
  "La phrase reste juste avec ce mot, c'est donc le verbe avoir.",
];
const A_GRAVE_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par avait.",
  "La phrase devient bizarre avec ce mot, c'est donc le petit mot qui relie deux mots.",
];
const verbA = (text: string): GapFact => ({ text, answer: "a", wrong: ["à", "as"], hints: A_HINTS });
const prepA = (text: string): GapFact => ({ text, answer: "à", wrong: ["a", "as"], hints: A_GRAVE_HINTS });

const A_ROWS: readonly GapFact[] = [
  // Niveau 1
  verbA("Awa ___ un beau cahier."),
  prepA("Moussa va ___ l'école."),
  verbA("Fatou ___ une robe bleue."),
  // Niveau 2
  prepA("Les enfants jouent ___ cache-cache."),
  verbA("Le chat ___ faim."),
  prepA("Nous allons ___ la plage."),
  // Niveau 3
  verbA("Aminata ___ un petit frère."),
  prepA("Le car part ___ midi."),
  verbA("Mon oncle ___ un grand bateau."),
  // Niveau 4
  prepA("Je donne un cadeau ___ Mariama."),
  verbA("Omar ___ mangé du riz ce matin."),
  prepA("Le marché est ___ côté de la mosquée."),
];

/** « Awa ___ un beau cahier. » avec a, à ou as : une fois par palier. */
export function makeCe1FrHomoA(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-homo-a", HOMOPHONES, A_ROWS, 1);
}

const EST_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par était.",
  "La phrase reste juste avec ce mot, c'est donc le verbe être.",
];
const ET_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par était.",
  "La phrase devient bizarre avec ce mot, c'est donc le petit mot qui relie deux choses.",
];
const verbEst = (text: string): GapFact => ({ text, answer: "est", wrong: ["et", "es"], hints: EST_HINTS });
const linkEt = (text: string): GapFact => ({ text, answer: "et", wrong: ["est", "es"], hints: ET_HINTS });

const ET_ROWS: readonly GapFact[] = [
  // Niveau 1
  verbEst("Moussa ___ grand."),
  linkEt("Awa mange du riz ___ du poisson."),
  verbEst("Le chat ___ sur la natte."),
  // Niveau 2
  linkEt("Fatou ___ Aminata jouent."),
  verbEst("Ma maman ___ au marché."),
  linkEt("J'ai un cahier ___ un stylo."),
  // Niveau 3
  verbEst("Le ciel ___ bleu."),
  linkEt("Le chien court ___ saute."),
  verbEst("La mangue ___ très sucrée."),
  // Niveau 4
  linkEt("Il chante ___ il danse."),
  verbEst("Cheikh ___ content de sa note."),
  linkEt("Nous lavons le riz ___ nous le mettons dans la marmite."),
];

/** « Moussa ___ grand. » avec est, et ou es : une fois par palier. */
export function makeCe1FrHomoEt(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-homo-et", HOMOPHONES, ET_ROWS, 1);
}

const ONT_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par avaient.",
  "La phrase reste juste avec ce mot, c'est donc le verbe avoir.",
];
const ON_HINTS: Hints = [
  "Lis la phrase en entier.",
  "Remplace le trou par il.",
  "La phrase reste juste avec ce petit mot, qui parle de quelqu'un sans le nommer.",
];
const verbOnt = (text: string): GapFact => ({ text, answer: "ont", wrong: ["on", "en"], hints: ONT_HINTS });
const pronounOn = (text: string): GapFact => ({ text, answer: "on", wrong: ["ont", "en"], hints: ON_HINTS });

const ON_ROWS: readonly GapFact[] = [
  // Niveau 1
  verbOnt("Les filles ___ des robes neuves."),
  pronounOn("Au marché, ___ achète des mangues."),
  verbOnt("Moussa et Awa ___ un chat."),
  // Niveau 2
  pronounOn("À midi, ___ mange du poisson."),
  verbOnt("Les élèves ___ leurs cahiers."),
  pronounOn("Dans la classe, ___ écoute la maîtresse."),
  // Niveau 3
  verbOnt("Mes cousins ___ une grande case."),
  pronounOn("Le soir, ___ regarde les étoiles."),
  verbOnt("Ils ___ gagné le match."),
  // Niveau 4
  pronounOn("Quand il fait chaud, ___ boit de l'eau."),
  verbOnt("Les pêcheurs ___ attrapé des poissons."),
  pronounOn("À la récréation, ___ joue au ballon."),
];

/** « Les filles ___ des robes neuves. » avec ont, on ou en : une fois par palier. */
export function makeCe1FrHomoOn(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-homo-on", HOMOPHONES, ON_ROWS, 1);
}

// ===========================================================================
// L'ASTUCE : par quel mot remplacer a, est, ont
// ===========================================================================

const TRICK_PAST: Hints = ["Pense à hier : le verbe change de temps.", "Le mot cherché est une forme du verbe avoir.", "Il se dit pour une seule personne ou un seul animal."];
const TRICK_BE: Hints = ["Pense à hier : le verbe change de temps.", "Le mot cherché est une forme du verbe être.", "Il se dit pour une seule personne ou une seule chose."];
const TRICK_PLURAL: Hints = ["Pense à hier : le verbe change de temps.", "Le mot cherché est une forme du verbe avoir.", "Il se dit pour plusieurs personnes."];
const trickA = (sentence: string): Fact => ({
  question: `Quel mot peut remplacer le mot a dans « ${sentence} » ?`,
  answer: "avait",
  wrong: ["était", "avaient"],
  hints: TRICK_PAST,
});
const trickEst = (sentence: string): Fact => ({
  question: `Quel mot peut remplacer le mot est dans « ${sentence} » ?`,
  answer: "était",
  wrong: ["avait", "avaient"],
  hints: TRICK_BE,
});
const trickOnt = (sentence: string): Fact => ({
  question: `Quel mot peut remplacer le mot ont dans « ${sentence} » ?`,
  answer: "avaient",
  wrong: ["avait", "était"],
  hints: TRICK_PLURAL,
});

const TRICKS: readonly Fact[] = [
  // Niveau 1
  trickA("Awa a un chat."),
  trickEst("Moussa est grand."),
  trickOnt("Les filles ont des robes."),
  // Niveau 2
  trickA("Le chat a faim."),
  trickEst("Le ciel est bleu."),
  trickOnt("Mes cousins ont une case."),
  // Niveau 3
  trickA("Mon oncle a un bateau."),
  trickEst("La mangue est sucrée."),
  trickOnt("Ils ont gagné le match."),
  // Niveau 4
  trickA("Omar a mangé du riz."),
  trickEst("Cheikh est content."),
  trickOnt("Les pêcheurs ont attrapé un poisson."),
];

/** « Quel mot peut remplacer le mot a dans « Awa a un chat. » ? » : l'astuce de la fiche, une fois par palier. */
export function makeCe1FrHomoTrick(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-homo-astuce", HOMOPHONES, TRICKS, 1);
}

// ===========================================================================
// LA PHRASE BIEN ÉCRITE : trois phrases, un seul homophone juste
// ===========================================================================

const WRITTEN_HINTS: Hints = [
  "Lis chaque phrase en entier.",
  "Cherche le petit mot qui change d'une phrase à l'autre.",
  "Remplace le petit mot par avait, était, avaient ou il.",
];
/** Une phrase avec un trou, le mot juste et les deux mots faux : la bonne phrase, et les deux phrases fautives. */
const written = (text: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: "Quelle phrase est bien écrite ?",
  answer: text.replace("___", answer),
  wrong: [text.replace("___", wrong[0]), text.replace("___", wrong[1])],
  hints: WRITTEN_HINTS,
});

const WRITTEN: readonly Fact[] = [
  // Niveau 1
  written("Awa ___ un grand panier.", "a", ["à", "as"]),
  written("Moussa ___ Awa sont amis.", "et", ["est", "es"]),
  written("Les garçons ___ soif.", "ont", ["on", "en"]),
  // Niveau 2
  written("Mariama va ___ la pêche.", "à", ["a", "as"]),
  written("Le riz ___ chaud.", "est", ["et", "es"]),
  written("Dans la cour, ___ joue.", "on", ["ont", "en"]),
  // Niveau 3
  written("Le vendeur ___ vendu des mangues.", "a", ["à", "as"]),
  written("Nous mangeons du pain ___ du fromage.", "et", ["est", "es"]),
  written("Mes frères ___ un ballon.", "ont", ["on", "en"]),
  // Niveau 4
  written("Ma grand-mère pense ___ nous.", "à", ["a", "as"]),
  written("Ce garçon ___ très fort.", "est", ["et", "es"]),
  written("Le soir, ___ dort dans sa case.", "on", ["ont", "en"]),
];

/** « Quelle phrase est bien écrite ? » : une phrase juste et deux fautes d'homophone, une fois par palier. */
export function makeCe1FrHomoWritten(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-homo-phrase", HOMOPHONES, WRITTEN, 1);
}

// ===========================================================================
// L'ACCORD DU VERBE AVEC SON SUJET
// ===========================================================================

const AGREE_HINTS: Hints = [
  "Cherche le sujet, celui qui fait l'action.",
  "Le verbe s'accorde avec son sujet.",
  "Un seul sujet, plusieurs sujets ou tu, la fin du verbe change.",
];
const agree = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: AGREE_HINTS });

const AGREE_ROWS: readonly GapFact[] = [
  // Niveau 1
  agree("Moussa ___ au ballon.", "joue", ["jouent", "joues"]),
  agree("Les enfants ___ dans la cour.", "jouent", ["joue", "joues"]),
  agree("Tu ___ du riz.", "manges", ["mange", "mangent"]),
  // Niveau 2
  agree("Awa ___ une chanson.", "chante", ["chantent", "chantes"]),
  agree("Les filles ___ ensemble.", "dansent", ["danse", "danses"]),
  agree("Tu ___ bien.", "chantes", ["chante", "chantent"]),
  // Niveau 3
  agree("Mes amis ___ au marché.", "marchent", ["marche", "marches"]),
  agree("Le vendeur ___ les pièces.", "compte", ["comptent", "comptes"]),
  agree("Tu ___ ton cahier.", "ranges", ["range", "rangent"]),
  // Niveau 4
  agree("Les élèves ___ la maîtresse.", "écoutent", ["écoute", "écoutes"]),
  agree("Mon grand frère ___ le riz.", "lave", ["lavent", "laves"]),
  agree("Les pêcheurs ___ leur filet.", "lancent", ["lance", "lances"]),
];

/** « Les enfants ___ dans la cour. » avec joue, jouent ou joues : une fois par palier. */
export function makeCe1FrHomoAgree(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-homo-accord", "accorder le verbe avec son sujet", AGREE_ROWS, 1);
}

// ===========================================================================
// LE SIGNE QUI TERMINE UNE PHRASE
// ===========================================================================

const SIGN_QUESTION: Hints = [
  "Lis la phrase à voix haute.",
  "Une phrase qui pose une question demande une réponse.",
  "Le signe se courbe en haut, avec un rond en dessous.",
];
const SIGN_TELL: Hints = ["Lis la phrase à voix haute.", "Une phrase qui raconte finit tout doucement.", "Le signe est le plus petit, un seul rond."];
const SIGN_JOY: Hints = ["Lis la phrase à voix haute.", "Une phrase qui crie la joie se dit fort.", "Le signe est un trait droit avec un rond en dessous."];
const signAsk = (sentence: string): Fact => ({
  question: `Quel signe termine cette phrase qui pose une question ? « ${sentence} »`,
  answer: "point d'interrogation",
  wrong: ["point", "point d'exclamation"],
  hints: SIGN_QUESTION,
});
const signTell = (sentence: string): Fact => ({
  question: `Quel signe termine cette phrase qui raconte quelque chose ? « ${sentence} »`,
  answer: "point",
  wrong: ["point d'interrogation", "point d'exclamation"],
  hints: SIGN_TELL,
});
const signJoy = (sentence: string): Fact => ({
  question: `Quel signe termine cette phrase qui crie la joie ? « ${sentence} »`,
  answer: "point d'exclamation",
  wrong: ["point", "point d'interrogation"],
  hints: SIGN_JOY,
});

const SIGNS: readonly Fact[] = [
  // Niveau 1
  signAsk("Où vas-tu"),
  signTell("Awa mange du riz"),
  signJoy("Nous avons gagné"),
  // Niveau 2
  signAsk("Qui joue avec moi"),
  signTell("Le chat dort sur la natte"),
  signJoy("Tu as réussi"),
  // Niveau 3
  signAsk("Pourquoi pleures-tu"),
  signTell("Moussa joue au ballon"),
  signJoy("Quel beau cadeau"),
  // Niveau 4
  signAsk("Quand part le car"),
  signTell("Nous allons au marché"),
  signJoy("Le voilà enfin"),
];

/**
 * « Quel signe termine cette phrase qui pose une question ? » : le point, le point d'interrogation, le point d'exclamation. Les choix sont les
 * NOMS des signes : le contrôleur efface la ponctuation, il ne verrait aucun rapport entre la réponse « ? » et ses options.
 */
export function makeCe1FrHomoSign(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-homo-signe", "choisir le signe qui termine une phrase", SIGNS, 1);
}

// ===========================================================================
// ÉCRIRE LE MOT : est, et, on, ont (jamais a ou à, que le contrôle ne distinguerait pas)
// ===========================================================================

const WRITE_EST: Hints = ["Lis la phrase en entier.", "Remplace le trou par était.", "La phrase reste juste avec ce mot, c'est donc le verbe être."];
const WRITE_ET: Hints = ["Lis la phrase en entier.", "Remplace le trou par était.", "La phrase devient bizarre avec ce mot, c'est donc le petit mot qui relie deux choses."];
const WRITE_ONT: Hints = ["Lis la phrase en entier.", "Remplace le trou par avaient.", "La phrase reste juste avec ce mot, c'est donc le verbe avoir."];
const WRITE_ON: Hints = ["Lis la phrase en entier.", "Remplace le trou par il.", "La phrase reste juste avec ce petit mot, qui parle de quelqu'un sans le nommer."];
/**
 * Le choix est nommé dans l'énoncé : sans lui, « Le pain ___ chaud » accepte aussi « était » ou « devient », et « Au marché, ___ vend » accepte « il » ou
 * « elle » (relevé à la relecture de la production du 25 octobre 2026, comme au CM1). Le contrôleur ne compte pas ce choix fermé comme une réponse donnée.
 */
const WRITE_CHOICE: Record<string, string> = { est: "est ou et", et: "est ou et", on: "on ou ont", ont: "on ou ont" };
const writeWord = (text: string, word: string, hints: Hints): WriteFact => ({
  prompt: `Écris le mot qui manque (${WRITE_CHOICE[word]}) dans « ${text} »`,
  accepted: [word],
  hints,
});

const WRITES: readonly WriteFact[] = [
  // Niveau 1
  writeWord("Le pain ___ chaud.", "est", WRITE_EST),
  writeWord("Awa ___ Moussa chantent.", "et", WRITE_ET),
  writeWord("Les chats ___ faim.", "ont", WRITE_ONT),
  // Niveau 2
  writeWord("Au marché, ___ vend des fruits.", "on", WRITE_ON),
  writeWord("Ma tante ___ gentille.", "est", WRITE_EST),
  writeWord("Le chat ___ le chien dorment.", "et", WRITE_ET),
  // Niveau 3
  writeWord("Les enfants ___ un ballon.", "ont", WRITE_ONT),
  writeWord("Le dimanche, ___ va à la mosquée.", "on", WRITE_ON),
  writeWord("Ce garçon ___ très rapide.", "est", WRITE_EST),
  // Niveau 4
  writeWord("Fatou lit un livre ___ range sa case.", "et", WRITE_ET),
  writeWord("Elles ___ fini leur travail.", "ont", WRITE_ONT),
  writeWord("Le soir, ___ rentre à la maison.", "on", WRITE_ON),
];

/** « Écris le mot qui manque dans « Le pain ___ chaud. » » : est, et, on ou ont, au clavier. */
export function makeCe1FrHomoWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-fr-homo-ecrire", HOMOPHONES, WRITES, 1);
}

// ===========================================================================
// RELIER ET GLISSER
// ===========================================================================

/** Six phrases, une par mot : dans chacune, un seul des six mots va (aucune ne supporte un autre homophone, même absurde). */
const LINK_POOL: readonly (readonly [string, string])[] = [
  ["Le singe ___ soif.", "a"],
  ["Il pense ___ sa maman.", "à"],
  ["Le riz ___ le poisson sont chauds.", "et"],
  ["Le garçon ___ fatigué.", "est"],
  ["Après l'école, ___ rentre à la case.", "on"],
  ["Les poules ___ des poussins.", "ont"],
];

/**
 * Les trios de phrases : trois des six mots, jamais « a » avec « à » (le contrôleur efface l'accent et y verrait un côté droit répété, et
 * l'enfant, deux étiquettes presque pareilles). Seize trios, quatre par niveau.
 */
const LINK_TRIOS = triples(LINK_POOL).filter((trio) => !(trio.some((pair) => pair[1] === "a") && trio.some((pair) => pair[1] === "à")));
const LINK_HINTS: Hints = ["Lis chaque phrase en entier.", "Commence par la phrase où un seul mot va.", "Remplace le trou par avait, était, avaient ou il."];

/** Relie trois phrases à trou au mot qui les complète. */
export function makeCe1FrHomoLink(ctx: GameContext): GeneratedGame {
  const kind = "ce1-fr-homo-relier";
  return linkGame(ctx, kind, HOMOPHONES, () => {
    const trio = pickFresh(ctx, quarter(LINK_TRIOS, ctx.level, 1), (candidate) => `${kind}:${candidate.map((pair) => pair[1]).join("|")}`);
    return {
      prompt: "Relie chaque phrase au mot qui complète son trou.",
      pairs: shuffle(ctx.rng, trio).map(([left, right]) => ({ left, right })),
      hints: LINK_HINTS,
    };
  });
}

const SORT_A: Bin = {
  zone: "a",
  tiles: ["Ma sœur ___ un chat noir.", "Le maître ___ une règle.", "Awa ___ très peur.", "Mon père ___ un vélo.", "Elle ___ cassé son stylo.", "Le chien ___ un os."],
};
const SORT_A_GRAVE: Bin = {
  zone: "à",
  tiles: ["Nous parlons ___ la maîtresse.", "Le bus part ___ huit heures.", "Tu joues ___ la corde.", "Je vais ___ la pêche.", "Elle écrit ___ son oncle.", "Ils rentrent ___ la maison."],
};
const SORT_ET: Bin = {
  zone: "et",
  tiles: ["Moussa ___ Fatou lisent.", "Je mange du pain ___ du beurre.", "Il court ___ il saute.", "La rue ___ la place sont vides.", "Elle rit ___ elle chante.", "Le soleil ___ la lune brillent."],
};
const SORT_EST: Bin = {
  zone: "est",
  tiles: ["Le chat ___ noir.", "Mon frère ___ au lit.", "La nuit ___ calme.", "Ce fruit ___ mûr.", "Elle ___ en retard.", "Le lac ___ profond."],
};
const SORT_ON: Bin = {
  zone: "on",
  tiles: ["Ce soir, ___ chante.", "À la fête, ___ danse.", "Chez moi, ___ mange tôt.", "Au village, ___ se connaît.", "Sous l'arbre, ___ s'assoit.", "Le matin, ___ se lève."],
};
const SORT_ONT: Bin = {
  zone: "ont",
  tiles: ["Mes sœurs ___ un chien.", "Les chats ___ soif.", "Elles ___ peur du noir.", "Les vaches ___ du lait.", "Ils ___ une grande case.", "Les oiseaux ___ des ailes."],
};
const SORT_FAMILIES: readonly { bins: readonly [Bin, Bin]; hints: Hints }[] = [
  { bins: [SORT_A, SORT_A_GRAVE], hints: ["Lis chaque phrase en entier.", "Remplace le trou par avait.", "La phrase qui reste juste avec ce mot se range avec le mot a."] },
  { bins: [SORT_EST, SORT_ET], hints: ["Lis chaque phrase en entier.", "Remplace le trou par était.", "La phrase qui reste juste avec ce mot se range avec le mot est."] },
  { bins: [SORT_ON, SORT_ONT], hints: ["Lis chaque phrase en entier.", "Remplace le trou par avaient ou il.", "La phrase qui reste juste avec avaient se range avec le mot ont."] },
];

/** Range des phrases à trou sous le mot qui les complète : a et à au niveau 1, est et et au 2, on et ont au 3, une paire tirée au 4. */
export function makeCe1FrHomoSort(ctx: GameContext): GeneratedGame {
  const family = ctx.level < 4 ? SORT_FAMILIES[ctx.level - 1] : pick(ctx.rng, SORT_FAMILIES);
  return binSort(ctx, "ce1-fr-homo-glisser", HOMOPHONES, "Range chaque phrase sous le mot qui complète son trou.", family.bins[0], family.bins[1], family.hints);
}
