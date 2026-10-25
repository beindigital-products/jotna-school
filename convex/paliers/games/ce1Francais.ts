/**
 * LES GABARITS DE FRANÇAIS DU CE1, PREMIÈRE MOITIÉ : la phrase, le verbe et le sujet ; le nom, l'article et l'adjectif ; le présent et le
 * passé composé ; l'impératif et le futur ; le dictionnaire et les mots de liaison (`fr-ce1-phrase`, `fr-ce1-nom-adjectif`,
 * `fr-ce1-present-passe`, `fr-ce1-imperatif-futur`, `fr-ce1-dictionnaire`). Les homophones et la lecture, qui demandent des textes à
 * fabriquer, viennent dans un second lot.
 *
 * Sur l'échantillon de CE1 lu le 21 octobre 2026, 17 exercices de français sur 42 étaient faux : « Fatou a mangé au yassa » (une phrase
 * qui n'est pas du français), « Le mot avant yassa est yogourt » (à l'envers), « je irai », des ordres sans critère, des trous à deux
 * réponses. Ici chaque exercice lit une ligne d'un tableau fermé, écrit à la main : la bonne réponse est dans la ligne, et un mauvais
 * choix n'est jamais une deuxième bonne réponse (une forme verbale fausse pour LA personne de l'énoncé, jamais une forme qui irait
 * aussi). Les conjugaisons sont des formes écrites une à une, pas un calcul.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - Un mot qui est aussi un nom (« lave », « joue », « ferme », « lit », « règle ») ne sert jamais d'étiquette de verbe : les étiquettes de
 *   verbes sont des formes qui n'existent que comme verbes (« mangeons », « dormez », « sautent »).
 * - L'accord du participe passé avec « être » n'est demandé qu'avec un sujet masculin (« Moussa est allé », « Ils sont partis »), puisque la
 *   fiche ne dit rien de l'accord. Aucun « je », « tu », « nous » ni « vous » ne va avec « être » : on ne saurait pas le genre.
 * - Une phrase à remettre dans l'ordre n'a qu'un ordre possible : jamais un adverbe qu'on peut placer avant ou après (« Hier, Awa a chanté. »
 *   se dirait aussi « Awa a chanté hier. »).
 * - Un mauvais choix de conjugaison est une forme du présent ou une forme d'une autre personne : jamais l'imparfait, que la fiche n'apprend pas.
 * - Les étiquettes et les choix qui nomment une chose (un aliment, un animal, un lieu) sont refusés par `templatePictures.test.ts` au CI,
 *   qui y voit une tuile sans image : les noms des glissés sont des noms abstraits (« joie », « peur », « histoire »), les thèmes sont
 *   faits de verbes.
 *
 * COMME AU CP ET AU CI : un énoncé n'a aucun « : », au plus une apostrophe droite, vingt-huit mots au plus ; aucun indice n'écrit un
 * mot de quatre lettres ou plus de la bonne réponse, d'une étiquette ou d'une case ; aucun émoji.
 *
 * HORS FICHE, À FAIRE RELIRE : les phrases de la vie courante (Awa, Moussa, Fatou, le ballon, le riz, le marché, la cour), les noms abstraits
 * des glissés, les verbes écouter, regarder, ranger, fermer, laver et marcher au-delà de chanter, jouer, manger et danser, les prénoms de
 * l'ordre alphabétique, les mots « fête » et « chanson », et le classement « Sujet, Verbe, Phrase, Groupe nominal » de l'appariement.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { linkGame, type Hints } from "./tableaux";
import { binSort, factChoice, factGap, factWriteLine, pickPairs, quarter, stepsOrder, type Fact, type GapFact, type Steps, type WriteFact } from "./ce1SciencesOutils";

/** Une phrase à remettre dans l'ordre : ses mots, le premier avec sa majuscule, le dernier avec son point. */
const SENTENCE_PROMPT = "Remets les mots dans l'ordre pour écrire une phrase.";
const SENTENCE_HINTS: Hints = [
  "Une phrase commence par une majuscule.",
  "Cherche le mot qui commence par une majuscule, c'est le premier.",
  "Le dernier mot finit la phrase, avec son point.",
];
const sentence = (text: string): Steps => ({ prompt: SENTENCE_PROMPT, sequence: text.split(" "), hints: SENTENCE_HINTS });

/** Un ordre lu dans la part du niveau (quatre paliers, quatre parts qui couvrent le tableau). */
const orderRows = (ctx: GameContext, kind: string, concept: string, rows: readonly Steps[], uses = 1) => stepsOrder(ctx, kind, concept, quarter(rows, ctx.level, uses));

/** Trois paires prises dans l'une des listes de paires du niveau : la gauche et la droite de chaque paire sont différentes. */
type PairPool = { prompt: string; pairs: readonly (readonly [string, string])[]; hints: Hints };
function poolPairs(ctx: GameContext, kind: string, concept: string, pools: readonly PairPool[]): GeneratedGame {
  return linkGame(ctx, kind, concept, () => {
    const pool = pickFresh(ctx, quarter(pools, ctx.level), (candidate) => `${kind}:${candidate.prompt}`);
    return {
      prompt: pool.prompt,
      pairs: shuffle(ctx.rng, pool.pairs)
        .slice(0, 3)
        .map(([left, right]) => ({ left, right })),
      hints: pool.hints,
    };
  });
}

// ===========================================================================
// LA PHRASE, LE VERBE ET LE SUJET (fr-ce1-phrase)
// ===========================================================================

const PHRASE = "reconnaître une phrase, son verbe et son sujet";

const VERB_HINTS: Hints = ["Le verbe est le mot qui change quand on dit hier ou demain.", "Dis la phrase avec hier : quel mot change ?", "Le verbe dit ce que fait quelqu'un."];
const verbOf = (sentenceText: string, verb: string, wrong: readonly [string, string]): Fact => ({
  question: `Quel mot est le verbe dans « ${sentenceText} » ?`,
  answer: verb,
  wrong,
  hints: VERB_HINTS,
});

const PHRASE_VERBS: readonly Fact[] = [
  // Niveau 1
  verbOf("Awa mange du riz.", "mange", ["Awa", "riz"]),
  verbOf("Moussa joue au ballon.", "joue", ["Moussa", "ballon"]),
  verbOf("Fatou lave le linge.", "lave", ["Fatou", "linge"]),
  // Niveau 2
  verbOf("Ibrahima ferme la porte.", "ferme", ["Ibrahima", "porte"]),
  verbOf("Aminata lit un livre.", "lit", ["Aminata", "livre"]),
  verbOf("Mariama achète du pain.", "achète", ["Mariama", "pain"]),
  // Niveau 3
  verbOf("Cheikh range ses affaires.", "range", ["Cheikh", "affaires"]),
  verbOf("Omar saute dans la cour.", "saute", ["Omar", "cour"]),
  verbOf("Les enfants chantent dans la classe.", "chantent", ["enfants", "classe"]),
  // Niveau 4
  verbOf("Le vendeur compte les pièces.", "compte", ["vendeur", "pièces"]),
  verbOf("La maîtresse écrit au tableau.", "écrit", ["maîtresse", "tableau"]),
  verbOf("Le pêcheur lance son filet.", "lance", ["pêcheur", "filet"]),
];

/** « Quel mot est le verbe dans « Awa mange du riz. » ? » : deux fois par palier. */
export function makeCe1FrPhraseVerb(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-phrase-verbe", PHRASE, PHRASE_VERBS, 2);
}

const SUBJECT_HINTS: Hints = ["Le sujet dit qui fait l'action.", "Pose la question « Qui est-ce qui … ? » avant le verbe.", "Le sujet se trouve avant le verbe."];
const subjectOf = (sentenceText: string, subject: string, wrong: readonly [string, string]): Fact => ({
  question: `Qui fait l'action dans « ${sentenceText} » ?`,
  answer: subject,
  wrong,
  hints: SUBJECT_HINTS,
});

const PHRASE_SUBJECTS: readonly Fact[] = [
  // Niveau 1
  subjectOf("Awa mange du riz.", "Awa", ["mange", "riz"]),
  subjectOf("Moussa joue au ballon.", "Moussa", ["joue", "ballon"]),
  subjectOf("Fatou lave le linge.", "Fatou", ["lave", "linge"]),
  // Niveau 2
  subjectOf("Ibrahima ferme la porte.", "Ibrahima", ["ferme", "porte"]),
  subjectOf("Aminata lit un livre.", "Aminata", ["lit", "livre"]),
  subjectOf("Mariama achète du pain.", "Mariama", ["achète", "pain"]),
  // Niveau 3
  subjectOf("Cheikh range ses affaires.", "Cheikh", ["range", "affaires"]),
  subjectOf("Omar saute dans la cour.", "Omar", ["saute", "cour"]),
  subjectOf("Nous chantons dans la classe.", "Nous", ["chantons", "classe"]),
  // Niveau 4
  subjectOf("Elle écrit au tableau.", "Elle", ["écrit", "tableau"]),
  subjectOf("Ils jouent dans la cour.", "Ils", ["jouent", "cour"]),
  subjectOf("Vous mangez du riz.", "Vous", ["mangez", "riz"]),
];

/** « Qui fait l'action dans « Awa mange du riz. » ? » : le sujet, un prénom ou un pronom, deux fois par palier. */
export function makeCe1FrPhraseSubject(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-phrase-sujet", PHRASE, PHRASE_SUBJECTS, 2);
}

const WELL_WRITTEN_HINTS: Hints = ["Une phrase commence par une majuscule.", "Une phrase finit par un point.", "Cherche celle qui a la majuscule et le point."];
const wellWritten = (text: string): Fact => ({
  question: "Quelle phrase est bien écrite ?",
  answer: text,
  wrong: [`${text[0].toLowerCase()}${text.slice(1)}`, text.slice(0, -1)],
  hints: WELL_WRITTEN_HINTS,
});

const PHRASE_WRITTEN: readonly Fact[] = [
  wellWritten("Awa mange du riz."),
  wellWritten("Moussa joue au ballon."),
  wellWritten("Fatou lave le linge."),
  wellWritten("Ibrahima ferme la porte."),
  wellWritten("Aminata lit un livre."),
  wellWritten("Mariama achète du pain."),
  wellWritten("Cheikh range ses affaires."),
  wellWritten("Omar saute dans la cour."),
  wellWritten("Nous chantons dans la classe."),
  wellWritten("Elle écrit au tableau."),
  wellWritten("Ils jouent dans la cour."),
  wellWritten("Vous mangez du riz."),
];

/** « Quelle phrase est bien écrite ? » : la majuscule et le point, une fois par palier. */
export function makeCe1FrPhraseWritten(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-phrase-ecrite", PHRASE, PHRASE_WRITTEN, 1);
}

const NOUN_GROUP_HINTS: Hints = ["Regarde le nom après le trou : masculin, féminin ou pluriel ?", "Un nom masculin prend le ou un, un nom féminin prend la ou une.", "Un nom pluriel prend les ou des."];
const nounGroup = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: NOUN_GROUP_HINTS });

const PHRASE_NOUN_GROUPS: readonly GapFact[] = [
  // Niveau 1
  nounGroup("___ cartable est lourd.", "Le", ["La", "Les"]),
  nounGroup("___ mangue est sucrée.", "La", ["Le", "Les"]),
  nounGroup("___ enfants jouent.", "Les", ["Le", "La"]),
  // Niveau 2
  nounGroup("Awa a ___ cahier neuf.", "un", ["une", "des"]),
  nounGroup("Moussa ouvre ___ porte.", "la", ["le", "les"]),
  nounGroup("Il y a ___ table dans la classe.", "une", ["un", "des"]),
  // Niveau 3
  nounGroup("___ ballon roule.", "Le", ["La", "Les"]),
  nounGroup("Cheikh achète ___ mangues.", "des", ["un", "une"]),
  nounGroup("___ natte est propre.", "La", ["Le", "Les"]),
  // Niveau 4
  nounGroup("Ils lisent ___ livre.", "un", ["une", "des"]),
  nounGroup("Omar cherche ___ cahier.", "le", ["la", "les"]),
  nounGroup("Fatou range ___ livres.", "les", ["le", "la"]),
];

/** « ___ cartable est lourd. » : le déterminant d'un groupe nominal, selon le genre et le nombre du nom. */
export function makeCe1FrPhraseNounGroup(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-phrase-groupe", PHRASE, PHRASE_NOUN_GROUPS, 1);
}

/** Les mots qui sont toujours des verbes (des formes qui n'existent que comme verbes), et des noms abstraits sans image. */
const VERB_TILES = ["mangeons", "chantons", "dormez", "achetez", "sautent", "écoutent", "courent", "lisent", "écrivent", "travaillent"];
const NOUN_TILES = ["joie", "peur", "idée", "faim", "soif", "couleur", "histoire", "musique", "chanson", "vitesse", "fête"];

/** « Verbe » ou « Nom » : des formes verbales et des noms abstraits. */
export function makeCe1FrPhraseSort(ctx: GameContext): GeneratedGame {
  return binSort(ctx, "ce1-fr-phrase-glisser", PHRASE, "Glisse chaque mot dans la bonne case.", { zone: "Verbe", tiles: VERB_TILES }, { zone: "Nom", tiles: NOUN_TILES }, [
    "Un mot qui change quand on dit hier ou demain dit une action.",
    "Un mot qui désigne une chose, une personne ou un sentiment ne change pas ainsi.",
    "Essaie de dire « il » ou « elle » devant chaque mot.",
  ]);
}

const PHRASE_ORDERS: readonly Steps[] = [
  // Niveau 1
  sentence("Awa mange du riz."),
  sentence("Moussa joue au ballon."),
  sentence("Fatou lave le linge."),
  // Niveau 2
  sentence("Ibrahima ferme la porte."),
  sentence("Aminata lit un livre."),
  sentence("Mariama achète du pain."),
  // Niveau 3
  sentence("Cheikh range ses affaires."),
  sentence("Omar saute dans la cour."),
  sentence("Nous chantons dans la classe."),
  // Niveau 4
  sentence("Elle écrit au tableau."),
  sentence("Ils jouent dans la cour."),
  sentence("Vous mangez du riz."),
];

/** Une phrase simple, sujet puis verbe puis complément, à remettre dans l'ordre : deux fois par palier. */
export function makeCe1FrPhraseOrder(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-phrase-ordre", PHRASE, PHRASE_ORDERS, 2);
}

const PHRASE_PAIRS: readonly (readonly [string, string])[] = [
  ["Le mot qui change avec hier et demain", "Verbe"],
  ["Celui qui fait l'action", "Sujet"],
  ["Elle a une majuscule et un point", "Phrase"],
  ["Un déterminant et un nom", "Groupe nominal"],
];

/** « Relie chaque définition au bon mot. » */
export function makeCe1FrPhraseLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-fr-phrase-relier", PHRASE, "Relie chaque définition au bon mot.", PHRASE_PAIRS, [
    "Lis chaque définition, puis cherche le mot qui lui va.",
    "Débute par la définition que tu comprends le mieux.",
    "Barre les mots que tu as déjà utilisés.",
  ]);
}

// ===========================================================================
// LE NOM, L'ARTICLE ET L'ADJECTIF (fr-ce1-nom-adjectif)
// ===========================================================================

const NOM = "le nom, l'article et l'adjectif";

const GENDER_HINTS: Hints = ["Dis « un » ou « une » devant le mot.", "Si « une » va bien, le petit mot est celui des mots féminins.", "Sinon, c'est celui des mots masculins."];
const article = (word: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `Quel petit mot va devant « ${word} » ?`,
  answer,
  wrong,
  hints: GENDER_HINTS,
});

const NOM_ARTICLES: readonly Fact[] = [
  // Niveau 1
  article("cahier", "le", ["la", "les"]),
  article("mangue", "la", ["le", "les"]),
  article("ballon", "le", ["la", "les"]),
  // Niveau 2
  article("porte", "la", ["le", "les"]),
  article("marché", "le", ["la", "les"]),
  article("maison", "la", ["le", "les"]),
  // Niveau 3
  article("livre", "le", ["la", "les"]),
  article("table", "la", ["le", "les"]),
  article("village", "le", ["la", "les"]),
  // Niveau 4
  article("classe", "la", ["le", "les"]),
  article("stylo", "le", ["la", "les"]),
  article("fenêtre", "la", ["le", "les"]),
];

/** « Quel petit mot va devant « cahier » ? » : le ou la, deux fois par palier. */
export function makeCe1FrNounArticle(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-nom-article", NOM, NOM_ARTICLES, 2);
}

const AGREE_HINTS: Hints = [
  "Regarde le nom : masculin ou féminin, singulier ou pluriel ?",
  "L'adjectif prend le même genre et le même nombre que le nom.",
  "Au féminin on ajoute souvent un e, au pluriel un s.",
];
const agree = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: AGREE_HINTS });

const NOM_AGREEMENTS: readonly GapFact[] = [
  // Niveau 1
  agree("Un ___ arbre.", "grand", ["grande", "grands"]),
  agree("Une ___ case.", "grande", ["grand", "grandes"]),
  agree("Des ___ arbres.", "grands", ["grand", "grande"]),
  // Niveau 2
  agree("Une ___ maison.", "petite", ["petit", "petits"]),
  agree("Un ___ cartable.", "petit", ["petite", "petits"]),
  agree("Une fille ___.", "contente", ["content", "contents"]),
  // Niveau 3
  agree("Des garçons ___.", "contents", ["content", "contente"]),
  agree("Une fleur ___.", "jolie", ["joli", "jolis"]),
  agree("Des fruits ___.", "mûrs", ["mûr", "mûre"]),
  // Niveau 4
  agree("Une mangue ___.", "mûre", ["mûr", "mûrs"]),
  agree("Un chat ___.", "noir", ["noire", "noirs"]),
  agree("Des chattes ___.", "noires", ["noir", "noire"]),
];

/** « Une ___ case. » : l'adjectif accordé avec son nom, deux fois par palier. */
export function makeCe1FrNounAgree(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-nom-accord", NOM, NOM_AGREEMENTS, 2);
}

/** Des noms masculins et des noms féminins qui ne nomment aucune chose qu'on dessine, et dont le genre ne se discute pas. */
const MASCULINE = ["courage", "bonheur", "silence", "travail", "respect", "voyage", "calme", "métier", "conseil"];
const FEMININE = ["joie", "peur", "idée", "faim", "soif", "couleur", "histoire", "musique", "chanson", "vitesse", "fête", "amitié"];

/** « Masculin » ou « Féminin » : des noms abstraits des deux genres. */
export function makeCe1FrNounGender(ctx: GameContext): GeneratedGame {
  return binSort(ctx, "ce1-fr-nom-genre", NOM, "Glisse chaque mot dans la bonne case.", { zone: "Masculin", tiles: MASCULINE }, { zone: "Féminin", tiles: FEMININE }, [
    "Dis « un » ou « une » devant chaque mot.",
    "Les mots qui vont avec « une » sont du même genre que « la fille ».",
    "Les autres vont avec « un », comme « le garçon ».",
  ]);
}

const NOM_ORDERS: readonly Steps[] = [
  // Niveau 1
  sentence("Awa a une grande case."),
  sentence("Moussa a un petit cartable."),
  sentence("Fatou a un chat noir."),
  // Niveau 2
  sentence("Mariama cueille une jolie fleur."),
  sentence("Cheikh mange un fruit mûr."),
  sentence("Omar lit un grand livre."),
  // Niveau 3
  sentence("Aminata porte une petite mangue."),
  sentence("Ibrahima a une belle voix."),
  sentence("Nous voyons des grands arbres."),
  // Niveau 4
  sentence("Elle a des chattes noires."),
  sentence("Ils lisent des livres neufs."),
  sentence("Vous achetez des mangues mûres."),
];

/** « Awa a une grande case. » : un groupe nominal avec son adjectif, à remettre dans l'ordre. */
export function makeCe1FrNounOrder(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-nom-ordre", NOM, NOM_ORDERS, 1);
}

const NOM_PAIRS: readonly (readonly [string, string])[] = [
  ["petit", "petite"],
  ["grand", "grande"],
  ["content", "contente"],
  ["noir", "noire"],
  ["joli", "jolie"],
  ["mûr", "mûre"],
];

/** « Relie chaque adjectif masculin à son féminin. » */
export function makeCe1FrNounLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-fr-nom-relier", NOM, "Relie chaque adjectif masculin à son féminin.", NOM_PAIRS, [
    "Dis l'adjectif devant « un garçon », puis devant « une fille ».",
    "Au féminin, on ajoute souvent un e à la fin.",
    "Débute par la paire dont tu es le plus sûr.",
  ]);
}

const feminine = (masculine: string, answer: string): WriteFact => ({
  prompt: `Écris l'adjectif « ${masculine} » au féminin.`,
  accepted: [answer],
  hints: ["Pense à « une fille » et dis l'adjectif devant ce nom.", "Au féminin, on ajoute souvent un e à la fin.", "Écris l'adjectif en entier, sans espace."],
});

const NOM_WRITES: readonly WriteFact[] = [
  // Niveau 1
  feminine("grand", "grande"),
  feminine("petit", "petite"),
  // Niveau 2
  feminine("content", "contente"),
  feminine("noir", "noire"),
  // Niveau 3
  feminine("joli", "jolie"),
  feminine("mûr", "mûre"),
  // Niveau 4
  feminine("vert", "verte"),
  feminine("blanc", "blanche"),
];

/** « Écris l'adjectif « grand » au féminin. » */
export function makeCe1FrNounWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-fr-nom-ecrire", NOM, NOM_WRITES, 2);
}

// ===========================================================================
// LE PRÉSENT ET LE PASSÉ COMPOSÉ (fr-ce1-present-passe)
// ===========================================================================

const PRESENT = "le présent et le passé composé";

const PRESENT_HINTS: Hints = ["Regarde le petit mot qui est devant le trou : qui fait l'action ?", "Le verbe change avec la personne.", "Dis la phrase en entier avec chaque choix."];
const nowGap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: PRESENT_HINTS });

const PRESENT_NOW: readonly GapFact[] = [
  // Niveau 1 : le premier groupe
  nowGap("Je ___ au ballon.", "joue", ["joues", "jouons"]),
  nowGap("Nous ___ du riz.", "mangeons", ["mange", "mangez"]),
  nowGap("Tu ___ bien.", "chantes", ["chante", "chantent"]),
  nowGap("Ils ___ dans la cour.", "dansent", ["danse", "dansons"]),
  // Niveau 2 : avoir et être
  nowGap("Tu ___ un cahier.", "as", ["ai", "a"]),
  nowGap("Nous ___ contents.", "sommes", ["suis", "sont"]),
  nowGap("Il ___ une mangue.", "a", ["as", "ai"]),
  nowGap("Vous ___ en classe.", "êtes", ["es", "est"]),
  // Niveau 3 : aller, partir et finir
  nowGap("Je ___ au marché.", "vais", ["vas", "va"]),
  nowGap("Nous ___ à l'école.", "allons", ["allez", "vont"]),
  nowGap("Tu ___ ton travail.", "finis", ["finit", "finissons"]),
  nowGap("Ils ___ à midi.", "partent", ["part", "partons"]),
  // Niveau 4 : tout mélangé
  nowGap("Vous ___ au village.", "allez", ["allons", "vont"]),
  nowGap("Elle ___ son riz.", "finit", ["finis", "finissent"]),
  nowGap("Ils ___ un grand sac.", "ont", ["a", "as"]),
  nowGap("Nous ___ la chanson.", "chantons", ["chante", "chantez"]),
];

/** « Je ___ au ballon. » : la forme du verbe au présent, selon la personne, deux fois par palier. */
export function makeCe1FrPresentNow(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-present-present", PRESENT, PRESENT_NOW, 2);
}

const PAST_HINTS: Hints = ["Hier dit que l'action est finie.", "Le verbe a deux mots : avoir ou être, puis le verbe.", "Choisis l'auxiliaire qui va avec la personne."];
const pastGap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: PAST_HINTS });

const PRESENT_PAST: readonly GapFact[] = [
  // Niveau 1 : avoir et un verbe du premier groupe
  pastGap("Hier, nous ___ au ballon.", "avons joué", ["ont joué", "avez joué"]),
  pastGap("Hier, tu ___ du riz.", "as mangé", ["ai mangé", "a mangé"]),
  pastGap("Hier, je ___ une chanson.", "ai chanté", ["as chanté", "a chanté"]),
  pastGap("Hier, ils ___ dans la cour.", "ont dansé", ["a dansé", "avons dansé"]),
  // Niveau 2 : avoir et être
  pastGap("Hier, Awa ___ avec ses amies.", "a dansé", ["ai dansé", "ont dansé"]),
  pastGap("Hier, vous ___ un cahier.", "avez eu", ["avons eu", "ont eu"]),
  pastGap("Hier, nous ___ contents.", "avons été", ["sommes été", "avez été"]),
  pastGap("Hier, il ___ en retard.", "a été", ["est été", "ai été"]),
  // Niveau 3 : aller, partir et finir
  pastGap("Hier, Moussa ___ au marché.", "est allé", ["a allé", "ai allé"]),
  pastGap("Hier, Omar ___ très tôt.", "est parti", ["a parti", "ai parti"]),
  pastGap("Hier, ils ___ leur travail.", "ont fini", ["a fini", "avez fini"]),
  pastGap("Hier, tu ___ ta leçon.", "as fini", ["ai fini", "a fini"]),
  // Niveau 4 : tout mélangé
  pastGap("Hier, ils ___ chez leur tante.", "sont allés", ["ont allés", "sommes allés"]),
  pastGap("Hier, vous ___ du poisson.", "avez mangé", ["avons mangé", "ont mangé"]),
  pastGap("Hier, Cheikh ___ une mangue.", "a mangé", ["ai mangé", "ont mangé"]),
  pastGap("Hier, ils ___ leur chanson.", "ont chanté", ["a chanté", "as chanté"]),
];

/** « Hier, nous ___ au ballon. » : le passé composé, avec le bon auxiliaire. */
export function makeCe1FrPresentPast(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-present-passe", PRESENT, PRESENT_PAST, 2);
}

const TIME_HINTS: Hints = [
  "Dis la phrase « Awa chante », puis « Awa a chanté », et compare.",
  "Un mot parle d'une action finie, un autre de ce qui arrive bientôt, un autre de ce moment.",
  "Choisis le mot qui va avec le temps de la phrase.",
];
const timeWord = (question: string, answer: string, wrong: readonly [string, string]): Fact => ({ question, answer, wrong, hints: TIME_HINTS });

const PRESENT_TIMES: readonly Fact[] = [
  timeWord("Quel mot va avec le passé composé ?", "hier", ["maintenant", "demain"]),
  timeWord("Quel mot va avec le présent ?", "maintenant", ["hier", "demain"]),
  timeWord("Quel mot dit que l'action est déjà faite ?", "hier", ["aujourd'hui", "demain"]),
  timeWord("Quel mot dit que l'action se fait en ce moment ?", "aujourd'hui", ["hier", "demain"]),
  timeWord("Avec quel mot dit-on « Awa a chanté » ?", "hier", ["maintenant", "demain"]),
  timeWord("Avec quel mot dit-on « Awa chante » ?", "maintenant", ["hier", "demain"]),
  timeWord("Avec quel mot dit-on « Nous avons mangé » ?", "hier", ["aujourd'hui", "demain"]),
  timeWord("Avec quel mot dit-on « Nous mangeons » ?", "aujourd'hui", ["hier", "demain"]),
];

/** « Quel mot va avec le passé composé ? » : hier, maintenant ou demain. */
export function makeCe1FrPresentTime(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-present-temps", PRESENT, PRESENT_TIMES, 1);
}

const TENSE_HINTS: Hints = [
  "Cherche le petit mot qui donne le temps au début de chaque phrase.",
  "Un verbe fait de deux mots parle d'une action finie.",
  "Un verbe tout seul parle de ce qui se passe en ce moment.",
];
const tenseOf = (question: string, answer: string, wrong: readonly [string, string]): Fact => ({ question, answer, wrong, hints: TENSE_HINTS });

const PRESENT_TENSES: readonly Fact[] = [
  tenseOf("Dans quelle phrase le verbe est-il au passé composé ?", "Hier, Awa a chanté.", ["Maintenant, Awa chante.", "Aujourd'hui, Awa chante."]),
  tenseOf("Dans quelle phrase le verbe est-il au présent ?", "Maintenant, nous jouons.", ["Hier, nous avons joué.", "Hier, nous avons dansé."]),
  tenseOf("Dans quelle phrase le verbe est-il au passé composé ?", "Hier, Moussa a mangé du riz.", ["Maintenant, Moussa mange du riz.", "Aujourd'hui, Moussa mange du riz."]),
  tenseOf("Dans quelle phrase le verbe est-il au présent ?", "Aujourd'hui, tu danses.", ["Hier, tu as dansé.", "Hier, tu as chanté."]),
  tenseOf("Dans quelle phrase le verbe est-il au passé composé ?", "Hier, nous sommes allés au marché.", ["Maintenant, nous allons au marché.", "Aujourd'hui, nous allons au marché."]),
  tenseOf("Dans quelle phrase le verbe est-il au présent ?", "Maintenant, ils finissent.", ["Hier, ils ont fini.", "Hier, ils ont joué."]),
  tenseOf("Dans quelle phrase le verbe est-il au passé composé ?", "Hier, vous avez chanté.", ["Maintenant, vous chantez.", "Aujourd'hui, vous chantez."]),
  tenseOf("Dans quelle phrase le verbe est-il au présent ?", "Aujourd'hui, elle a faim.", ["Hier, elle a eu faim.", "Hier, elle a été triste."]),
];

/** « Dans quelle phrase le verbe est-il au passé composé ? » : un seul mot avant le temps, deux mots après. */
export function makeCe1FrPresentTense(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-present-reconnaitre", PRESENT, PRESENT_TENSES, 1);
}

const NOW_TILES = ["je chante", "tu danses", "il mange", "nous jouons", "vous finissez", "ils vont", "elle a", "nous sommes"];
const PAST_TILES = ["j'ai chanté", "tu as dansé", "il a mangé", "nous avons joué", "vous avez fini", "ils sont allés", "elle a eu", "nous avons été"];

/** « Présent » ou « Passé composé » : des verbes conjugués avec leur pronom. */
export function makeCe1FrPresentSort(ctx: GameContext): GeneratedGame {
  return binSort(ctx, "ce1-fr-present-glisser", PRESENT, "Glisse chaque verbe dans la bonne case.", { zone: "Présent", tiles: NOW_TILES }, { zone: "Passé composé", tiles: PAST_TILES }, [
    "Un verbe fait de deux mots, avoir ou être puis le verbe, parle d'hier.",
    "Un verbe tout seul avec son pronom parle de maintenant.",
    "Dis « hier » ou « maintenant » devant chaque verbe.",
  ]);
}

const LINK_HINTS: Hints = ["Dis chaque phrase en entier, avec le pronom.", "Le verbe change avec la personne.", "Débute par la paire dont tu es le plus sûr."];
const PRESENT_POOLS: readonly PairPool[] = [
  // Niveau 1
  { prompt: "Relie chaque pronom à la bonne forme du verbe chanter.", pairs: [["je", "chante"], ["tu", "chantes"], ["nous", "chantons"], ["vous", "chantez"], ["ils", "chantent"]], hints: LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe jouer.", pairs: [["je", "joue"], ["tu", "joues"], ["nous", "jouons"], ["vous", "jouez"], ["ils", "jouent"]], hints: LINK_HINTS },
  // Niveau 2
  { prompt: "Relie chaque pronom à la bonne forme du verbe manger.", pairs: [["je", "mange"], ["tu", "manges"], ["nous", "mangeons"], ["vous", "mangez"], ["ils", "mangent"]], hints: LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe avoir.", pairs: [["j'", "ai"], ["tu", "as"], ["nous", "avons"], ["vous", "avez"], ["ils", "ont"]], hints: LINK_HINTS },
  // Niveau 3
  { prompt: "Relie chaque pronom à la bonne forme du verbe être.", pairs: [["je", "suis"], ["tu", "es"], ["nous", "sommes"], ["vous", "êtes"], ["ils", "sont"]], hints: LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe aller.", pairs: [["je", "vais"], ["tu", "vas"], ["nous", "allons"], ["vous", "allez"], ["ils", "vont"]], hints: LINK_HINTS },
  // Niveau 4
  { prompt: "Relie chaque pronom à la bonne forme du verbe finir.", pairs: [["je", "finis"], ["il", "finit"], ["nous", "finissons"], ["vous", "finissez"], ["ils", "finissent"]], hints: LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe partir.", pairs: [["je", "pars"], ["il", "part"], ["nous", "partons"], ["vous", "partez"], ["ils", "partent"]], hints: LINK_HINTS },
];

/** « Relie chaque pronom à la bonne forme du verbe chanter. » : trois paires, un verbe par palier. */
export function makeCe1FrPresentLink(ctx: GameContext): GeneratedGame {
  return poolPairs(ctx, "ce1-fr-present-relier", PRESENT, PRESENT_POOLS);
}

const PRESENT_ORDERS: readonly Steps[] = [
  // Niveau 1
  sentence("Awa mange du riz."),
  sentence("Nous jouons au ballon."),
  sentence("Awa a chanté."),
  // Niveau 2
  sentence("Nous avons mangé du riz."),
  sentence("Tu as dansé."),
  sentence("Moussa a joué dehors."),
  // Niveau 3
  sentence("Ils finissent leur travail."),
  sentence("Moussa est allé au marché."),
  sentence("Vous avez chanté."),
  // Niveau 4
  sentence("Ils sont partis tôt."),
  sentence("Nous avons fini la leçon."),
  sentence("Elle a mangé une mangue."),
];

/** Une phrase au présent ou au passé composé à remettre dans l'ordre, sans adverbe mobile. */
export function makeCe1FrPresentOrder(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-present-ordre", PRESENT, PRESENT_ORDERS, 1);
}

/**
 * La forme avec le pronom de la consigne : « Écris le passé composé de danser avec « ils » » invite à écrire « ils ont dansé », réponse juste que l'app
 * refusait (défaut relevé en production le 25 octobre 2026). Le verbe seul reste la réponse affichée ; « je » s'élide devant une voyelle (« j'ai »).
 */
export function withPronoun(prompt: string, answer: string): string[] {
  const pronoun = /« (\p{L}+) »/u.exec(prompt)?.[1];
  if (!pronoun) return [answer];
  if (pronoun === "je" && /^[aeéèêiouyh]/u.test(answer)) return [answer, `j'${answer}`, `j’${answer}`];
  return [answer, `${pronoun} ${answer}`];
}
const conjugate = (prompt: string, answer: string): WriteFact => ({
  prompt,
  accepted: withPronoun(prompt, answer),
  // Le premier indice ne demande plus le pronom quand le troisième l'interdisait : les deux écritures sont admises.
  hints: ["Dis la phrase à voix basse, avec le pronom de la consigne.", "Le verbe change avec la personne.", "Écris le verbe, avec ou sans le pronom."],
});

const PRESENT_WRITES: readonly WriteFact[] = [
  // Niveau 1
  conjugate("Conjugue chanter au présent avec « ils ».", "chantent"),
  conjugate("Conjugue jouer au présent avec « nous ».", "jouons"),
  conjugate("Conjugue danser au présent avec « vous ».", "dansez"),
  conjugate("Conjugue manger au présent avec « nous ».", "mangeons"),
  // Niveau 2
  conjugate("Conjugue avoir au présent avec « tu ».", "as"),
  conjugate("Conjugue être au présent avec « nous ».", "sommes"),
  conjugate("Écris le passé composé de chanter avec « nous ».", "avons chanté"),
  conjugate("Écris le passé composé de jouer avec « tu ».", "as joué"),
  // Niveau 3
  conjugate("Conjugue aller au présent avec « je ».", "vais"),
  conjugate("Conjugue finir au présent avec « nous ».", "finissons"),
  conjugate("Écris le passé composé de manger avec « vous ».", "avez mangé"),
  conjugate("Écris le passé composé de danser avec « ils ».", "ont dansé"),
  // Niveau 4
  conjugate("Conjugue partir au présent avec « ils ».", "partent"),
  conjugate("Conjugue être au présent avec « vous ».", "êtes"),
  conjugate("Écris le passé composé de finir avec « nous ».", "avons fini"),
  conjugate("Écris le passé composé d'avoir avec « tu ».", "as eu"),
];

/** « Conjugue chanter au présent avec « ils ». » : la forme du verbe, écrite. */
export function makeCe1FrPresentWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-fr-present-ecrire", PRESENT, PRESENT_WRITES, 1);
}

// ===========================================================================
// L'IMPÉRATIF ET LE FUTUR (fr-ce1-imperatif-futur)
// ===========================================================================

const IMPERATIF = "l'impératif, le futur et les sortes de phrases";

const ORDER_HINTS: Hints = ["Lis le pronom entre parenthèses : à qui parle-t-on ?", "À « tu », l'ordre des verbes en -er n'a pas de s à la fin.", "À « nous » on finit par -ons, à « vous » par -ez."];
const imperative = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: ORDER_HINTS });

const IMPERATIVES: readonly GapFact[] = [
  // Niveau 1 : tu
  imperative("(tu) ___ la porte !", "Ferme", ["Fermes", "Fermez"]),
  imperative("(tu) ___ bien la maîtresse !", "Écoute", ["Écoutes", "Écoutez"]),
  imperative("(tu) ___ tes affaires !", "Range", ["Ranges", "Rangez"]),
  // Niveau 2 : nous
  imperative("(nous) ___ la porte !", "Fermons", ["Ferme", "Fermez"]),
  imperative("(nous) ___ bien la maîtresse !", "Écoutons", ["Écoute", "Écoutez"]),
  imperative("(nous) ___ nos affaires !", "Rangeons", ["Range", "Rangez"]),
  // Niveau 3 : vous
  imperative("(vous) ___ la porte !", "Fermez", ["Ferme", "Fermons"]),
  imperative("(vous) ___ bien la maîtresse !", "Écoutez", ["Écoute", "Écoutons"]),
  imperative("(vous) ___ vos affaires !", "Rangez", ["Range", "Rangeons"]),
  // Niveau 4 : les trois personnes
  imperative("(tu) ___ le tableau !", "Regarde", ["Regardes", "Regardez"]),
  imperative("(nous) ___ le tableau !", "Regardons", ["Regarde", "Regardez"]),
  imperative("(vous) ___ le tableau !", "Regardez", ["Regarde", "Regardons"]),
];

/** « (tu) ___ la porte ! » : l'impératif, selon la personne, deux fois par palier. */
export function makeCe1FrImperative(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-imperatif-imperatif", IMPERATIF, IMPERATIVES, 2);
}

const FUTURE_HINTS: Hints = ["Demain parle de ce qui va arriver.", "On garde le verbe en entier et on ajoute la fin.", "La fin change avec la personne : -ai, -as, -a, -ons, -ez, -ont."];
const future = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: FUTURE_HINTS });

const FUTURES: readonly GapFact[] = [
  // Niveau 1
  future("Demain, je ___ une chanson.", "chanterai", ["chante", "chanteras"]),
  future("Demain, tu ___ avec Awa.", "danseras", ["danses", "danserai"]),
  future("Demain, Moussa ___ au ballon.", "jouera", ["joue", "joueront"]),
  // Niveau 2
  future("Demain, nous ___ du riz.", "mangerons", ["mangeons", "mangerez"]),
  future("Demain, vous ___ en classe.", "chanterez", ["chantez", "chanteront"]),
  future("Demain, ils ___ dans la cour.", "danseront", ["dansent", "danserons"]),
  // Niveau 3
  future("Demain, je ___ mes affaires.", "rangerai", ["range", "rangeras"]),
  future("Demain, nous ___ la maîtresse.", "écouterons", ["écoutons", "écouterez"]),
  future("Demain, tu ___ le tableau.", "regarderas", ["regardes", "regarderai"]),
  // Niveau 4
  future("Demain, Fatou ___ la porte.", "fermera", ["ferme", "fermeront"]),
  future("Demain, vous ___ au ballon.", "jouerez", ["jouez", "joueras"]),
  future("Demain, ils ___ du poisson.", "mangeront", ["mangent", "mangerons"]),
];

/** « Demain, je ___ une chanson. » : le futur simple, selon la personne, deux fois par palier. */
export function makeCe1FrFuture(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-imperatif-futur", IMPERATIF, FUTURES, 2);
}

const KIND_HINTS: Hints = [
  "Un ordre ou un conseil n'est pas la même chose qu'un fait.",
  "Une phrase qui commence par « il » sans personne derrière parle du temps qu'il fait.",
  "Une phrase qui commence par « ne pas » suivie d'un verbe en -er donne une consigne sans nommer personne.",
];
const sentenceKind = (text: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `Quelle sorte de phrase est « ${text} » ?`,
  answer,
  wrong,
  hints: KIND_HINTS,
});

const SENTENCE_KINDS: readonly Fact[] = [
  // Niveau 1
  sentenceKind("Ferme la porte.", "Impérative", ["Impersonnelle", "Infinitive"]),
  sentenceKind("Il pleut.", "Impersonnelle", ["Impérative", "Infinitive"]),
  sentenceKind("Ne pas marcher sur les fleurs.", "Infinitive", ["Impérative", "Impersonnelle"]),
  // Niveau 2
  sentenceKind("Écoute bien.", "Impérative", ["Impersonnelle", "Infinitive"]),
  sentenceKind("Il neige.", "Impersonnelle", ["Impérative", "Infinitive"]),
  sentenceKind("Ne pas courir.", "Infinitive", ["Impérative", "Impersonnelle"]),
  // Niveau 3
  sentenceKind("Range tes affaires.", "Impérative", ["Impersonnelle", "Infinitive"]),
  sentenceKind("Il fait chaud.", "Impersonnelle", ["Impérative", "Infinitive"]),
  sentenceKind("Ne pas jeter de papiers par terre.", "Infinitive", ["Impérative", "Impersonnelle"]),
  // Niveau 4
  sentenceKind("Regardez le tableau.", "Impérative", ["Impersonnelle", "Infinitive"]),
  sentenceKind("Il faut écouter la maîtresse.", "Impersonnelle", ["Impérative", "Infinitive"]),
  sentenceKind("Ne pas parler en classe.", "Infinitive", ["Impérative", "Impersonnelle"]),
];

/** « Quelle sorte de phrase est « Ferme la porte. » ? » : impérative, impersonnelle ou infinitive. */
export function makeCe1FrSentenceKind(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-imperatif-sorte", IMPERATIF, SENTENCE_KINDS, 1);
}

const TENSE_QUESTION_HINTS: Hints = [
  "Cherche le petit mot qui donne le temps au début de chaque phrase.",
  "Au futur, la fin du verbe est -ai, -as, -a, -ons, -ez ou -ont.",
  "Un verbe fait de deux mots parle d'une action finie.",
];
const futureSentence = (answer: string, wrong: readonly [string, string]): Fact => ({
  question: "Dans quelle phrase le verbe est-il au futur ?",
  answer,
  wrong,
  hints: TENSE_QUESTION_HINTS,
});

const FUTURE_TENSES: readonly Fact[] = [
  futureSentence("Demain, Awa chantera.", ["Hier, Awa a chanté.", "Maintenant, Awa chante."]),
  futureSentence("Demain, nous jouerons au ballon.", ["Hier, nous avons joué au ballon.", "Maintenant, nous jouons au ballon."]),
  futureSentence("Demain, tu mangeras du riz.", ["Hier, tu as mangé du riz.", "Maintenant, tu manges du riz."]),
  futureSentence("Demain, ils danseront.", ["Hier, ils ont dansé.", "Maintenant, ils dansent."]),
  futureSentence("Demain, vous chanterez.", ["Hier, vous avez chanté.", "Maintenant, vous chantez."]),
  futureSentence("Demain, je rangerai mes affaires.", ["Hier, j'ai rangé mes affaires.", "Maintenant, je range mes affaires."]),
  futureSentence("Demain, Moussa fermera la porte.", ["Hier, Moussa a fermé la porte.", "Maintenant, Moussa ferme la porte."]),
  futureSentence("Demain, nous regarderons le tableau.", ["Hier, nous avons regardé le tableau.", "Maintenant, nous regardons le tableau."]),
];

/** « Dans quelle phrase le verbe est-il au futur ? » : demain, hier ou maintenant. */
export function makeCe1FrFutureTense(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-imperatif-temps", IMPERATIF, FUTURE_TENSES, 1);
}

const ORDER_TILES = ["Chante !", "Mangez !", "Dansons !", "Ferme !", "Écoutez !", "Rangeons !", "Regarde !"];
const FUTURE_TILES = ["chantera", "mangeront", "danserons", "fermeras", "écouterez", "rangerai", "regardera"];

/** « Impératif » ou « Futur » : des ordres avec leur point d'exclamation, des verbes au futur. */
export function makeCe1FrImperativeSort(ctx: GameContext): GeneratedGame {
  return binSort(ctx, "ce1-fr-imperatif-glisser", IMPERATIF, "Glisse chaque verbe dans la bonne case.", { zone: "Impératif", tiles: ORDER_TILES }, { zone: "Futur", tiles: FUTURE_TILES }, [
    "Un ordre se dit avec un point d'exclamation.",
    "Un verbe qui finit par -ai, -as, -a, -ons, -ez ou -ont après le -r- parle de demain.",
    "Dis « demain » devant chaque verbe sans point d'exclamation.",
  ]);
}

const IMPERATIVE_ORDERS: readonly Steps[] = [
  // Niveau 1
  sentence("Ferme la porte."),
  sentence("Écoute bien la maîtresse."),
  sentence("Range tes affaires."),
  // Niveau 2
  sentence("Regarde le tableau."),
  sentence("Mange ton riz."),
  sentence("Lave tes mains."),
  // Niveau 3
  sentence("Fermons la porte."),
  sentence("Écoutons la maîtresse."),
  sentence("Rangeons nos affaires."),
  // Niveau 4
  sentence("Regardez le tableau."),
  sentence("Fermez la porte."),
  sentence("Écoutez la maîtresse."),
];

/** « Ferme la porte. » : une phrase impérative à remettre dans l'ordre. */
export function makeCe1FrImperativeOrder(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-imperatif-ordre", IMPERATIF, IMPERATIVE_ORDERS, 1);
}

const FUTURE_LINK_HINTS: Hints = ["Dis chaque phrase en entier, avec demain.", "La fin du verbe change avec la personne.", "Débute par la paire dont tu es le plus sûr."];
const FUTURE_POOLS: readonly PairPool[] = [
  { prompt: "Relie chaque pronom à la bonne forme du verbe chanter au futur.", pairs: [["je", "chanterai"], ["tu", "chanteras"], ["nous", "chanterons"], ["vous", "chanterez"], ["ils", "chanteront"]], hints: FUTURE_LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe jouer au futur.", pairs: [["je", "jouerai"], ["tu", "joueras"], ["nous", "jouerons"], ["vous", "jouerez"], ["ils", "joueront"]], hints: FUTURE_LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe manger au futur.", pairs: [["je", "mangerai"], ["tu", "mangeras"], ["nous", "mangerons"], ["vous", "mangerez"], ["ils", "mangeront"]], hints: FUTURE_LINK_HINTS },
  { prompt: "Relie chaque pronom à la bonne forme du verbe danser au futur.", pairs: [["je", "danserai"], ["tu", "danseras"], ["nous", "danserons"], ["vous", "danserez"], ["ils", "danseront"]], hints: FUTURE_LINK_HINTS },
];

/** « Relie chaque pronom à la bonne forme du verbe chanter au futur. » : un verbe par palier. */
export function makeCe1FrFutureLink(ctx: GameContext): GeneratedGame {
  return poolPairs(ctx, "ce1-fr-imperatif-relier", IMPERATIF, FUTURE_POOLS);
}

const FUTURE_WRITE_HINTS: Hints = ["Dis la phrase à voix basse, avec le pronom de la consigne.", "On garde le verbe en entier et on ajoute la fin.", "Écris le verbe, avec ou sans le pronom."];
const IMPERATIVE_WRITE_HINTS: Hints = ["Dis l'ordre à voix basse, avec la personne de la consigne.", "À « nous » on finit par -ons, à « vous » par -ez.", "Un ordre se dit sans nommer la personne."];
const futureWrite = (prompt: string, answer: string): WriteFact => ({ prompt, accepted: withPronoun(prompt, answer), hints: FUTURE_WRITE_HINTS });
/** Un ordre ne porte pas de pronom (« vous dansez » n'est pas l'impératif) : l'énoncé le dit, au lieu de le laisser au dernier indice. */
const imperativeWrite = (prompt: string, answer: string): WriteFact => ({ prompt: `${prompt} Écris seulement le verbe.`, accepted: [answer], hints: IMPERATIVE_WRITE_HINTS });

const FUTURE_WRITES: readonly WriteFact[] = [
  // Niveau 1
  futureWrite("Écris chanter au futur avec « nous ».", "chanterons"),
  futureWrite("Écris jouer au futur avec « je ».", "jouerai"),
  // Niveau 2
  imperativeWrite("Écris l'impératif de danser avec « vous ».", "dansez"),
  imperativeWrite("Écris l'impératif de chanter avec « nous ».", "chantons"),
  // Niveau 3
  futureWrite("Écris manger au futur avec « ils ».", "mangeront"),
  futureWrite("Écris danser au futur avec « tu ».", "danseras"),
  // Niveau 4
  imperativeWrite("Écris l'impératif de jouer avec « vous ».", "jouez"),
  imperativeWrite("Écris l'impératif de manger avec « nous ».", "mangeons"),
];

/** « Écris chanter au futur avec « nous ». » : la forme du verbe, écrite. */
export function makeCe1FrFutureWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-fr-imperatif-ecrire", IMPERATIF, FUTURE_WRITES, 2);
}

// ===========================================================================
// LE DICTIONNAIRE ET LES MOTS DE LIAISON (fr-ce1-dictionnaire)
// ===========================================================================

const DICO = "le dictionnaire et les mots de liaison";

/** L'ordre alphabétique des prénoms (aucun n'a d'accent). */
const alphabetical = (words: readonly string[]): string[] => [...words].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "fr"));

const ALPHA_HINTS: Hints = ["Compare les premières lettres en disant l'alphabet, a, b, c, d…", "Si deux mots commencent pareil, regarde la lettre suivante.", "Range d'abord celui qui est le plus près du début de l'alphabet."];
const alphaSteps = (...words: string[]): Steps => ({ prompt: "Range ces mots dans l'ordre alphabétique.", sequence: alphabetical(words), hints: ALPHA_HINTS });

const DICO_ORDERS: readonly Steps[] = [
  // Niveau 1 : trois mots qui commencent par des lettres différentes
  alphaSteps("Moussa", "Awa", "Fatou"),
  alphaSteps("Omar", "Cheikh", "Ibrahima"),
  alphaSteps("Sali", "Binta", "Dame"),
  // Niveau 2 : quatre mots
  alphaSteps("Fatou", "Awa", "Omar", "Cheikh"),
  alphaSteps("Salif", "Binta", "Mamadou", "Dame"),
  alphaSteps("Pape", "Khady", "Aliou", "Ndeye"),
  // Niveau 3 : la deuxième lettre décide
  alphaSteps("Awa", "Aminata", "Abdou"),
  alphaSteps("Moussa", "Mariama", "Malick"),
  alphaSteps("Sidy", "Salif", "Seydou"),
  // Niveau 4 : un début commun plus long
  alphaSteps("Fatou", "Fanta", "Fama", "Faty"),
  alphaSteps("Mamadou", "Malick", "Maty", "Mame"),
  alphaSteps("Binta", "Bineta", "Bintou", "Bacary"),
];

/** « Range ces mots dans l'ordre alphabétique. » : trois mots, puis quatre, puis des mots qui commencent pareil. */
export function makeCe1FrDictionaryOrder(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-dico-ordre", DICO, DICO_ORDERS, 2);
}

const FIRST_HINTS: Hints = ["Compare les premières lettres en disant l'alphabet, a, b, c, d…", "Si deux mots commencent pareil, regarde la lettre suivante.", "Le premier mot du dictionnaire est le plus près du début de l'alphabet."];
const firstOf = (...words: string[]): Fact => {
  const sorted = alphabetical(words);
  return { question: "Quel mot vient en premier dans le dictionnaire ?", answer: sorted[0], wrong: [sorted[1], sorted[2]], hints: FIRST_HINTS };
};

const DICO_FIRSTS: readonly Fact[] = [
  // Niveau 1
  firstOf("Moussa", "Awa", "Omar"),
  firstOf("Fatou", "Cheikh", "Sali"),
  firstOf("Dame", "Binta", "Ibrahima"),
  // Niveau 2
  firstOf("Pape", "Khady", "Ndeye"),
  firstOf("Salif", "Mamadou", "Oumar"),
  firstOf("Aliou", "Fama", "Binta"),
  // Niveau 3
  firstOf("Awa", "Aminata", "Abdou"),
  firstOf("Moussa", "Mariama", "Malick"),
  firstOf("Sidy", "Salif", "Seydou"),
  // Niveau 4
  firstOf("Fatou", "Fanta", "Fama"),
  firstOf("Mame", "Maty", "Mareme"),
  firstOf("Binta", "Bineta", "Bacary"),
];

/** « Quel mot vient en premier dans le dictionnaire ? » : deux fois par palier. */
export function makeCe1FrDictionaryFirst(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-dico-premier", DICO, DICO_FIRSTS, 2);
}

const NEXT_HINTS: Hints = ["Dis l'alphabet, a, b, c, d… et place chaque mot.", "Le mot qui vient après est plus loin dans l'alphabet.", "Le mot qui vient avant est plus près du début."];
const after = (pivot: string, later: string, earlier: readonly [string, string]): Fact => ({
  question: `Quel mot vient après « ${pivot} » dans le dictionnaire ?`,
  answer: later,
  wrong: earlier,
  hints: NEXT_HINTS,
});
const before = (pivot: string, earlier: string, later: readonly [string, string]): Fact => ({
  question: `Quel mot vient avant « ${pivot} » dans le dictionnaire ?`,
  answer: earlier,
  wrong: later,
  hints: NEXT_HINTS,
});

const DICO_NEXT: readonly Fact[] = [
  // Niveau 1
  after("Cheikh", "Moussa", ["Awa", "Abdou"]),
  before("Moussa", "Cheikh", ["Sali", "Omar"]),
  after("Fatou", "Sali", ["Awa", "Binta"]),
  // Niveau 2
  before("Pape", "Khady", ["Sali", "Salif"]),
  after("Binta", "Pape", ["Awa", "Aliou"]),
  before("Salif", "Mamadou", ["Sidy", "Seydou"]),
  // Niveau 3
  after("Awa", "Mariama", ["Abdou", "Aminata"]),
  before("Moussa", "Mariama", ["Omar", "Sali"]),
  after("Dame", "Fatou", ["Binta", "Awa"]),
  // Niveau 4
  before("Sidy", "Salif", ["Tidiane", "Tako"]),
  after("Fama", "Fatou", ["Aliou", "Awa"]),
  before("Pape", "Ndeye", ["Sidy", "Tidiane"]),
];

/** « Quel mot vient après « Cheikh » dans le dictionnaire ? » : un seul des trois mots est du bon côté. */
export function makeCe1FrDictionaryNext(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-fr-dico-apres", DICO, DICO_NEXT, 1);
}

const SEQUENCE_HINTS: Hints = [
  "Imagine la scène : qu'est-ce qui vient au début, au milieu, à la fin ?",
  "Le mot qui manque dit à quel moment on fait l'action.",
  "Cherche ce que l'on doit faire avant de pouvoir faire la suite.",
];
const timeGap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: SEQUENCE_HINTS });

const DICO_TIMES: readonly GapFact[] = [
  // Niveau 1
  timeGap("D'abord, Awa lave le riz. ___, elle le cuit. Enfin, elle le sert.", "Ensuite", ["Mais", "Donc"]),
  timeGap("___, je me lève. Ensuite, je me lave. Enfin, je pars.", "D'abord", ["Mais", "Donc"]),
  // Niveau 2
  timeGap("D'abord, il ouvre la porte. Ensuite, il entre. ___, il s'assoit.", "Enfin", ["Mais", "Donc"]),
  timeGap("Il ferme la porte, ___ il part.", "puis", ["mais", "donc"]),
  // Niveau 3
  timeGap("D'abord, Moussa prend son cahier. ___, il écrit. Enfin, il le range.", "Ensuite", ["Mais", "Donc"]),
  timeGap("___, Fatou se réveille. Ensuite, elle mange. Enfin, elle va à l'école.", "D'abord", ["Mais", "Donc"]),
  // Niveau 4
  timeGap("D'abord, nous pesons le riz. Ensuite, nous le lavons. ___, nous le cuisons.", "Enfin", ["Mais", "Donc"]),
  timeGap("Elle lave le linge, ___ elle l'étend.", "puis", ["mais", "donc"]),
];

/** « D'abord, … ___, … Enfin, … » : un mot de temps qui manque, parmi deux mots qui n'en sont pas. */
export function makeCe1FrDictionaryTime(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-dico-temps", DICO, DICO_TIMES, 1);
}

const LOGIC_HINTS: Hints = [
  "Un de ces mots dit pourquoi, un autre dit ce qui en résulte, un autre oppose deux idées.",
  "Dis la phrase en entier avec chaque choix, à voix basse.",
  "Une seule phrase a du sens.",
];
const logicGap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: LOGIC_HINTS });

const DICO_LOGIC: readonly GapFact[] = [
  // Niveau 1
  logicGap("Il pleut, ___ je prends mon parapluie.", "donc", ["mais", "parce que"]),
  logicGap("Je prends mon parapluie ___ il pleut.", "parce que", ["mais", "donc"]),
  logicGap("Awa veut jouer, ___ elle doit travailler.", "mais", ["donc", "parce que"]),
  // Niveau 2
  logicGap("Moussa est content ___ il a gagné.", "parce que", ["mais", "donc"]),
  logicGap("Il a faim, ___ il mange.", "donc", ["mais", "parce que"]),
  logicGap("J'aime le riz, ___ je n'aime pas le poisson.", "mais", ["donc", "parce que"]),
  // Niveau 3
  logicGap("Fatou est fatiguée ___ elle a couru.", "parce que", ["mais", "donc"]),
  logicGap("Il fait chaud, ___ nous buvons de l'eau.", "donc", ["mais", "parce que"]),
  logicGap("Je veux sortir, ___ il pleut.", "mais", ["donc", "parce que"]),
  // Niveau 4
  logicGap("Cheikh pleure ___ il est tombé.", "parce que", ["mais", "donc"]),
  logicGap("Elle est malade, ___ elle reste à la maison.", "donc", ["mais", "parce que"]),
  logicGap("Tu es petit, ___ tu cours vite.", "mais", ["donc", "parce que"]),
];

/** « Il pleut, ___ je prends mon parapluie. » : mais, parce que ou donc, deux fois par palier. */
export function makeCe1FrDictionaryLogic(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-fr-dico-logique", DICO, DICO_LOGIC, 2);
}

const story = (...lines: string[]): Steps => ({ prompt: "Remets ces phrases dans le bon ordre.", sequence: lines, hints: SEQUENCE_HINTS });

const DICO_STORIES: readonly Steps[] = [
  story("D'abord, Awa lave le riz.", "Ensuite, elle le cuit.", "Enfin, elle le sert."),
  story("D'abord, je me lève.", "Ensuite, je me lave.", "Enfin, je pars à l'école."),
  story("D'abord, Moussa prend son cahier.", "Ensuite, il écrit.", "Enfin, il le range."),
  story("D'abord, Fatou se réveille.", "Ensuite, elle mange.", "Enfin, elle va à l'école."),
  story("D'abord, nous pesons le riz.", "Ensuite, nous le lavons.", "Enfin, nous le cuisons."),
  story("D'abord, il ouvre la porte.", "Ensuite, il entre.", "Enfin, il s'assoit."),
  story("D'abord, la maîtresse écrit la date.", "Ensuite, nous la copions.", "Enfin, nous la lisons."),
  story("D'abord, Cheikh sort sa ligne.", "Ensuite, il attend.", "Enfin, il prend un poisson."),
];

/** « D'abord, … Ensuite, … Enfin, … » : trois phrases à remettre dans l'ordre de l'histoire. */
export function makeCe1FrDictionaryStory(ctx: GameContext): GeneratedGame {
  return orderRows(ctx, "ce1-fr-dico-recit", DICO, DICO_STORIES, 1);
}

const CONNECTOR_PAIRS: readonly (readonly [string, string])[] = [
  ["d'abord", "Au début"],
  ["enfin", "À la fin"],
  ["mais", "Oppose deux idées"],
  ["parce que", "Donne la raison"],
  ["donc", "Donne le résultat"],
];

/** « Relie chaque mot de liaison à ce qu'il dit. » */
export function makeCe1FrDictionaryLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-fr-dico-relier", DICO, "Relie chaque mot de liaison à ce qu'il dit.", CONNECTOR_PAIRS, [
    "Dis le mot de liaison dans une phrase.",
    "Certains mots disent quand, d'autres disent pourquoi.",
    "Débute par la paire dont tu es le plus sûr.",
  ]);
}

/** Des verbes d'un même thème, sans nom de chose qu'on dessine : l'école et le marché, sans verbe qui irait aux deux. */
const SCHOOL_WORDS = ["lire", "écrire", "copier", "réciter", "dessiner", "apprendre"];
const MARKET_WORDS = ["vendre", "acheter", "payer", "peser", "emballer", "livrer"];

/** « École » ou « Marché » : des verbes de l'école et des verbes du marché. */
export function makeCe1FrDictionaryTheme(ctx: GameContext): GeneratedGame {
  return binSort(ctx, "ce1-fr-dico-theme", DICO, "Glisse chaque mot dans le bon thème.", { zone: "École", tiles: SCHOOL_WORDS }, { zone: "Marché", tiles: MARKET_WORDS }, [
    "Pense à ce que l'on fait dans chaque endroit.",
    "À la maîtresse, on lit, on écrit et on retient.",
    "Chez le vendeur, on paie et on pèse.",
  ]);
}
