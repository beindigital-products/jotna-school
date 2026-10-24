/**
 * LES GABARITS DES TEXTES QUI EXPLIQUENT ET QUI INFORMENT DU CM1 : le texte injonctif (recette, règle de jeu, notice) et le texte informatif (article, fiche
 * documentaire) ; retrouver une information, comprendre l'ordre des étapes, le rôle du titre et des intertitres (`fr-cm1-informer`).
 *
 * Sur l'échantillon de CM1 lu le 23 octobre 2026, le modèle écrivait ici des questions sur un texte absent, des « étapes » dans le désordre, des intertitres qui ne
 * correspondaient pas au paragraphe et des réponses écrites dans l'énoncé. Ici le TEXTE est dans l'énoncé (dix documents écrits pour l'exercice : un titre, deux intertitres,
 * deux paragraphes, sans apostrophe droite, sans deux-points ni chiffre) et chaque question porte la phrase du texte qui y répond.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TEXTES ÉVITENT
 * - Un énoncé n'a qu'une apostrophe droite au plus : les documents n'en ont aucune (« la rivière », « des milliers de petites ouvrières », « fais bouillir les fleurs »).
 * - Un texte injonctif donne des ordres (« chauffe le lait », « verse la farine »), à l'impératif et sans sujet ; un texte informatif dit comment sont les choses (« Le lion est un grand
 *   félin »). Les phrases à ranger ou à reconnaître sont prises dans les documents et suivent cette règle.
 * - Le paragraphe d'une information est celui qui est juste sous son intertitre ; un mauvais intertitre est un autre intertitre du texte, ou un intertitre qui n'existe pas.
 * - Une réponse à écrire est un nombre de phrases : jamais un mot du texte. Les titres et les intertitres ne sont pas des phrases.
 * - Le contrôleur voit une bonne option plus de deux fois plus longue que les autres : « Fiche documentaire » (18 lettres) ne côtoie jamais seulement « Recette » et « Notice ».
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé, trois indices sans chiffre ni mot de quatre lettres ou plus d'une bonne
 * réponse, d'une option ou d'une tuile), plus un texte de cent cinquante mots au plus avec sa question (le plafond du CM1 du contrôleur).
 *
 * HORS FICHE, À FAIRE RELIRE : les dix documents (leurs chiffres écrits en lettres : mille sept cents kilomètres, six joueurs, vingt heures), leurs questions, leurs quarante phrases d'ordre
 * et d'information.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "lire un texte qui explique ou qui informe : type de texte, information, étapes, intertitres";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export type Kind = "Recette" | "Règle de jeu" | "Notice" | "Fiche documentaire" | "Article";
export type Ask = { question: string; pivot: string; answer: string; wrong: readonly [string, string] };
export type Doc = {
  kind: Kind;
  title: string;
  sections: readonly [{ heading: string; text: string }, { heading: string; text: string }];
  info: Ask;
  where: { question: string; fragment: string; heading: string; wrong: readonly [string, string] };
  /** Quatre étapes dans l'ordre du texte (documents qui donnent des ordres) ; vide pour une fiche ou un article. */
  steps: readonly string[];
  statement: { right: string; evidence: string; wrong: readonly [string, string]; absent: readonly [string, string] };
  cloze: { word: string; wrong: readonly [string, string] };
  pairs: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  /** Quatre phrases du texte : des ordres (documents injonctifs) ou des informations (documents informatifs). */
  sentences: readonly [string, string, string, string];
};
const ask = (question: string, pivot: string, answer: string, w1: string, w2: string): Ask => ({ question, pivot, answer, wrong: [w1, w2] });
const section = (heading: string, text: string) => ({ heading, text });

export const DOCS: readonly Doc[] = [
  // Palier 1.
  {
    kind: "Recette",
    title: "La bouillie de mil",
    sections: [section("Les ingrédients", "Il faut de la farine de mil, du lait, du sucre et une marmite."), section("La préparation", "Premièrement, chauffe le lait dans la marmite. Puis verse la farine en remuant. Ensuite, laisse cuire dix minutes. Enfin, ajoute le sucre et sers chaud.")],
    info: ask("Que faut-il chauffer en premier ?", "chauffe", "le lait", "la farine", "le sucre"),
    where: { question: "Sous quel intertitre lit-on la liste des produits ?", fragment: "Il faut de la farine de mil", heading: "Les ingrédients", wrong: ["La préparation", "Le goût"] },
    steps: ["chauffe le lait dans la marmite", "verse la farine en remuant", "laisse cuire dix minutes", "ajoute le sucre et sers chaud"],
    statement: { right: "La bouillie cuit pendant dix minutes.", evidence: "laisse cuire dix minutes", wrong: ["On ajoute des œufs à la bouillie.", "On sert la bouillie froide."], absent: ["œufs", "froide"] },
    cloze: { word: "farine", wrong: ["huile", "viande"] },
    pairs: [["chauffe", "le lait"], ["verse", "la farine"], ["ajoute", "le sucre"]],
    sentences: ["Premièrement, chauffe le lait dans la marmite.", "Puis verse la farine en remuant.", "Ensuite, laisse cuire dix minutes.", "Enfin, ajoute le sucre et sers chaud."],
  },
  {
    kind: "Fiche documentaire",
    title: "Le baobab",
    sections: [section("Son aspect", "Le baobab est un arbre immense. Son tronc très large peut mesurer dix mètres de tour. Ses branches ressemblent à des racines."), section("Sa vie", "Le baobab vit plus de mille ans. Ses fruits, les pains de singe, sont riches en vitamines. Les oiseaux nichent dans ses branches.")],
    info: ask("Combien de mètres de tour le tronc peut-il mesurer ?", "tronc très large", "dix mètres", "deux mètres", "trois mètres"),
    where: { question: "Sous quel intertitre lit-on combien de temps vit le baobab ?", fragment: "vit plus de mille ans", heading: "Sa vie", wrong: ["Son aspect", "Son histoire"] },
    steps: [],
    statement: { right: "Le baobab vit plus de mille ans.", evidence: "vit plus de mille ans", wrong: ["Le baobab vit dix ans.", "Le baobab est un petit arbuste."], absent: ["dix ans", "arbuste"] },
    cloze: { word: "branches", wrong: ["fleurs", "feuilles"] },
    pairs: [["Son tronc très large", "peut mesurer dix mètres de tour"], ["Ses fruits", "sont riches en vitamines"], ["Les oiseaux", "nichent dans ses branches"]],
    sentences: ["Le baobab est un arbre immense.", "Le baobab vit plus de mille ans.", "Les oiseaux nichent dans ses branches.", "Ses branches ressemblent à des racines."],
  },
  // Palier 2.
  {
    kind: "Règle de jeu",
    title: "Le jeu du mouchoir",
    sections: [section("Les joueurs", "Il faut au moins six joueurs et un mouchoir."), section("Le déroulement", "Premièrement, forme un grand cercle avec les autres joueurs. Puis tourne autour du cercle avec le mouchoir. Ensuite, dépose le mouchoir derrière un joueur sans le prévenir. Enfin, cours vite pour reprendre ta place.")],
    info: ask("Combien de joueurs faut-il au moins ?", "au moins", "six", "dix", "trois"),
    where: { question: "Sous quel intertitre lit-on le nombre de joueurs ?", fragment: "au moins six joueurs", heading: "Les joueurs", wrong: ["Le déroulement", "Le gagnant"] },
    steps: ["forme un grand cercle", "tourne autour du cercle", "dépose le mouchoir derrière un joueur", "cours vite pour reprendre ta place"],
    statement: { right: "Le joueur dépose le mouchoir derrière un autre joueur.", evidence: "dépose le mouchoir derrière un joueur", wrong: ["Le joueur jette le mouchoir très haut.", "Le joueur garde le mouchoir dans sa poche."], absent: ["jette", "poche"] },
    cloze: { word: "mouchoir", wrong: ["ballon", "bâton"] },
    pairs: [["forme", "un grand cercle"], ["tourne", "autour du cercle"], ["dépose", "le mouchoir"]],
    sentences: ["Premièrement, forme un grand cercle avec les autres joueurs.", "Puis tourne autour du cercle avec le mouchoir.", "Ensuite, dépose le mouchoir derrière un joueur sans le prévenir.", "Enfin, cours vite pour reprendre ta place."],
  },
  {
    kind: "Fiche documentaire",
    title: "Le fleuve Sénégal",
    sections: [section("Sa longueur", "Le fleuve Sénégal mesure environ mille sept cents kilomètres. Il prend sa source en Guinée et se jette dans la mer à Saint-Louis."), section("Ses richesses", "Ses rives donnent du riz et du mil. Les pêcheurs attrapent beaucoup de poissons. De nombreux oiseaux viennent boire sur ses rives.")],
    info: ask("Où le fleuve Sénégal prend-il sa source ?", "prend sa source", "en Guinée", "au Mali", "au Maroc"),
    where: { question: "Sous quel intertitre lit-on ce que les pêcheurs attrapent ?", fragment: "attrapent beaucoup de poissons", heading: "Ses richesses", wrong: ["Sa longueur", "Son histoire"] },
    steps: [],
    statement: { right: "Le fleuve Sénégal se jette dans la mer à Saint-Louis.", evidence: "se jette dans la mer à Saint-Louis", wrong: ["Le fleuve Sénégal se jette dans un lac.", "Le fleuve Sénégal est très court."], absent: ["un lac", "très court"] },
    cloze: { word: "rives", wrong: ["bords", "berges"] },
    pairs: [["Le fleuve Sénégal", "mesure environ mille sept cents kilomètres"], ["Ses rives", "donnent du riz et du mil"], ["Les pêcheurs", "attrapent beaucoup de poissons"]],
    sentences: ["Le fleuve Sénégal mesure environ mille sept cents kilomètres.", "Ses rives donnent du riz et du mil.", "Les pêcheurs attrapent beaucoup de poissons.", "De nombreux oiseaux viennent boire sur ses rives."],
  },
  // Palier 3.
  {
    kind: "Notice",
    title: "La lampe solaire",
    sections: [section("Avant la nuit", "Pose la lampe au soleil pendant toute la journée. Vérifie que le panneau est propre."), section("Le soir", "Appuie sur le bouton pour allumer la lumière. Éteins la lampe quand tu dors.")],
    info: ask("Quand faut-il poser la lampe au soleil ?", "Pose la lampe", "pendant toute la journée", "pendant la nuit", "le soir"),
    where: { question: "Sous quel intertitre lit-on comment allumer la lumière ?", fragment: "Appuie sur le bouton", heading: "Le soir", wrong: ["Avant la nuit", "Le matin"] },
    steps: ["Pose la lampe au soleil", "Vérifie que le panneau est propre", "Appuie sur le bouton", "Éteins la lampe"],
    statement: { right: "Il faut éteindre la lampe quand on dort.", evidence: "Éteins la lampe quand tu dors", wrong: ["Il faut laisser la lampe allumée toute la nuit.", "Il faut poser la lampe dans le noir."], absent: ["toute la nuit", "dans le noir"] },
    cloze: { word: "lampe", wrong: ["radio", "bougie"] },
    pairs: [["Pose", "la lampe au soleil"], ["Vérifie", "que le panneau est propre"], ["Appuie", "sur le bouton"]],
    sentences: ["Pose la lampe au soleil pendant toute la journée.", "Vérifie que le panneau est propre.", "Appuie sur le bouton pour allumer la lumière.", "Éteins la lampe quand tu dors."],
  },
  {
    kind: "Article",
    title: "Les abeilles",
    sections: [section("La vie de la ruche", "Une ruche abrite des milliers de petites ouvrières. Une seule reine pond les œufs."), section("Le travail des abeilles", "Les ouvrières butinent les fleurs pour récolter le nectar. Elles fabriquent ensuite le miel dans la ruche.")],
    info: ask("Combien de reines y a-t-il dans une ruche ?", "reine", "Une seule", "deux", "des milliers"),
    where: { question: "Sous quel intertitre lit-on ce que font les ouvrières ?", fragment: "butinent les fleurs", heading: "Le travail des abeilles", wrong: ["La vie de la ruche", "Les ennemis"] },
    steps: [],
    statement: { right: "Les ouvrières fabriquent le miel dans la ruche.", evidence: "le miel dans la ruche", wrong: ["Les ouvrières fabriquent le miel dans un arbre.", "La reine fabrique le miel."], absent: ["dans un arbre", "reine fabrique"] },
    cloze: { word: "ouvrières", wrong: ["guêpes", "fourmis"] },
    pairs: [["Une ruche", "abrite des milliers de petites ouvrières"], ["Une seule reine", "pond les œufs"], ["Les ouvrières", "butinent les fleurs pour récolter le nectar"]],
    sentences: ["Une ruche abrite des milliers de petites ouvrières.", "Une seule reine pond les œufs.", "Les ouvrières butinent les fleurs pour récolter le nectar.", "Elles fabriquent ensuite le miel dans la ruche."],
  },
  // Palier 4.
  {
    kind: "Recette",
    title: "Le jus de bissap",
    sections: [section("Les ingrédients", "Il faut des fleurs de bissap, du sucre, de la menthe et une grande casserole."), section("La préparation", "Premièrement, lave les fleurs. Ensuite, fais bouillir les fleurs dans la casserole. Puis laisse refroidir la boisson. Enfin, ajoute le sucre et la menthe.")],
    info: ask("Que faut-il laver en premier ?", "lave", "les fleurs", "la menthe", "la casserole"),
    where: { question: "Sous quel intertitre lit-on la liste des produits ?", fragment: "des fleurs de bissap", heading: "Les ingrédients", wrong: ["La préparation", "La dégustation"] },
    steps: ["lave les fleurs", "fais bouillir les fleurs", "laisse refroidir la boisson", "ajoute le sucre et la menthe"],
    statement: { right: "Il faut laisser refroidir la boisson.", evidence: "laisse refroidir la boisson", wrong: ["Il faut boire le jus brûlant.", "Il faut ajouter du lait."], absent: ["brûlant", "lait"] },
    cloze: { word: "fleurs", wrong: ["feuilles", "fruits"] },
    pairs: [["lave", "les fleurs"], ["fais bouillir", "les fleurs dans la casserole"], ["ajoute", "le sucre et la menthe"]],
    sentences: ["Premièrement, lave les fleurs.", "Ensuite, fais bouillir les fleurs dans la casserole.", "Puis laisse refroidir la boisson.", "Enfin, ajoute le sucre et la menthe."],
  },
  {
    kind: "Fiche documentaire",
    title: "Le lion",
    sections: [section("Son corps", "Le lion est un grand félin. Le mâle porte une crinière épaisse. Il pèse plus de cent cinquante kilos."), section("Sa vie", "Les lions vivent en groupe, la troupe. Les lionnes chassent pour nourrir la troupe. Un lion dort presque vingt heures par jour.")],
    info: ask("Pendant combien de temps un lion dort-il par jour ?", "dort presque", "presque vingt heures", "quatre heures", "dix heures"),
    where: { question: "Sous quel intertitre lit-on qui chasse dans la troupe ?", fragment: "chassent pour nourrir la troupe", heading: "Sa vie", wrong: ["Son corps", "Sa chasse"] },
    steps: [],
    statement: { right: "Le mâle porte une crinière épaisse.", evidence: "Le mâle porte une crinière épaisse", wrong: ["La lionne porte une crinière épaisse.", "Le lion est un petit animal."], absent: ["La lionne porte", "petit animal"] },
    cloze: { word: "troupe", wrong: ["famille", "classe"] },
    pairs: [["Le mâle", "porte une crinière épaisse"], ["Les lionnes", "chassent pour nourrir la troupe"], ["Un lion", "dort presque vingt heures par jour"]],
    sentences: ["Le lion est un grand félin.", "Le mâle porte une crinière épaisse.", "Les lionnes chassent pour nourrir la troupe.", "Il pèse plus de cent cinquante kilos."],
  },
  // Palier 5.
  {
    kind: "Règle de jeu",
    title: "La marelle",
    sections: [section("Le matériel", "Trace des cases sur le sol avec une craie. Prends un petit caillou."), section("Les règles", "Premièrement, lance le caillou dans la première case. Puis saute à cloche-pied sur chaque case. Ensuite, reviens en sautant de la même manière. Enfin, ramasse ton caillou sans poser le second pied.")],
    info: ask("Avec quoi trace-t-on les cases ?", "Trace des cases", "une craie", "un bâton", "un crayon"),
    where: { question: "Sous quel intertitre lit-on quoi prendre pour jouer ?", fragment: "Prends un petit caillou", heading: "Le matériel", wrong: ["Les règles", "Les gagnants"] },
    steps: ["lance le caillou dans la première case", "saute à cloche-pied sur chaque case", "reviens en sautant", "ramasse ton caillou"],
    statement: { right: "Il faut ramasser son caillou à la fin.", evidence: "ramasse ton caillou", wrong: ["Il faut jeter le caillou très loin.", "Il faut poser les deux pieds ensemble."], absent: ["très loin", "ensemble"] },
    cloze: { word: "caillou", wrong: ["ballon", "bâton"] },
    pairs: [["Trace", "des cases"], ["Prends", "un petit caillou"], ["lance", "le caillou"]],
    sentences: ["Trace des cases sur le sol avec une craie.", "Premièrement, lance le caillou dans la première case.", "Puis saute à cloche-pied sur chaque case.", "Enfin, ramasse ton caillou sans poser le second pied."],
  },
  {
    kind: "Article",
    title: "La saison des pluies",
    sections: [section("Le début", "La saison des pluies commence en juin au Sénégal. Le ciel devient gris et les orages éclatent. Les orages arrosent le sol sec."), section("Les travaux des champs", "Les paysans sèment le mil et les arachides dès les premières pluies. Les champs deviennent verts en quelques semaines.")],
    info: ask("Que sèment les paysans ?", "sèment", "le mil et les arachides", "du riz et du blé", "des fleurs"),
    where: { question: "Sous quel intertitre lit-on comment change le ciel ?", fragment: "Le ciel devient gris", heading: "Le début", wrong: ["Les travaux des champs", "La fin"] },
    steps: [],
    statement: { right: "La saison des pluies commence en juin.", evidence: "commence en juin", wrong: ["La saison des pluies commence en mars.", "Les champs restent secs."], absent: ["en mars", "restent secs"] },
    cloze: { word: "orages", wrong: ["vents", "nuages"] },
    pairs: [["La saison des pluies", "commence en juin au Sénégal"], ["Les paysans", "sèment le mil et les arachides"], ["Les champs", "deviennent verts en quelques semaines"]],
    sentences: ["La saison des pluies commence en juin au Sénégal.", "Le ciel devient gris et les orages éclatent.", "Les orages arrosent le sol sec.", "Les champs deviennent verts en quelques semaines."],
  },
];

/** Le texte tel que l'enfant le lit : le titre, puis chaque intertitre au-dessus de son paragraphe. */
export const textOf = (doc: Doc) => [doc.title, ...doc.sections.map((s) => `${s.heading}\n${s.text}`)].join("\n\n");
const withText = (doc: Doc, question: string) => `${textOf(doc)}\n\nLis le texte. ${question}`;
const INJUNCTIVE = DOCS.filter((doc) => doc.steps.length > 0);

// ---------------------------------------------------------------------------
// Le type de texte, une information, les étapes, l'intertitre
// ---------------------------------------------------------------------------

const KINDS: readonly Kind[] = ["Recette", "Règle de jeu", "Notice", "Fiche documentaire", "Article"];
const KIND_HINTS = hints("Regarde le titre et les intertitres du texte.", "Le texte donne-t-il des ordres ou des informations ?", "Les verbes donnent-ils des ordres, comme chauffe ou verse ?");
/** Deux autres genres de texte ; « Fiche documentaire » ne se présente jamais avec deux noms courts, ni « Article » avec « Fiche documentaire » (même forme, même contenu : l'élève ne peut pas les départager). */
function wrongKinds(kind: Kind, seed: number): [string, string] {
  const informative = kind === "Article" || kind === "Fiche documentaire";
  const others = KINDS.filter((candidate) => candidate !== kind && !(informative && (candidate === "Article" || candidate === "Fiche documentaire")));
  const first = cycle(others, seed);
  let second = cycle(others, seed + 2);
  if (second === first) second = cycle(others, seed + 3);
  if (kind.length > 2 * Math.max(first.length, second.length)) second = others.find((candidate) => candidate !== first && candidate.length * 2 >= kind.length) as Kind;
  return [first, second];
}
export const KIND_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, "Quel est le type de ce texte ?"), doc.kind, wrongKinds(doc.kind, index), KIND_HINTS, `inf:${index}:type`));
export function makeCm1InfKind(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-inf-type", CONCEPT, KIND_ROWS);
}

const INFO_HINTS = hints("Relis la phrase qui parle de ce que demande la question.", "Cherche le mot qui répond.", "Élimine les réponses absentes de la phrase qui répond.");
export const INFO_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, doc.info.question), doc.info.answer, doc.info.wrong, INFO_HINTS, `inf:${index}:info`));
export function makeCm1InfInfo(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-inf-info", CONCEPT, INFO_ROWS);
}

const ORDER_HINTS = hints("Cherche ce qui se fait au commencement.", "Les étapes se suivent comme les phrases du texte.", "Repère la dernière étape du texte.");
export const ORDER_ROWS: readonly OrderRow[] = INJUNCTIVE.map((doc) => ordr(withText(doc, "Remets les étapes dans l'ordre du texte."), doc.steps.map(upperFirst), ORDER_HINTS, `inf:${DOCS.indexOf(doc)}:ordre`));
export function makeCm1InfOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm1-inf-ordre", CONCEPT, ORDER_ROWS);
}

const HEADING_HINTS = hints("Un intertitre annonce ce que dit le paragraphe qui le suit.", "Cherche le passage qui répond à la question.", "Regarde l'intertitre juste au-dessus de ce passage.");
export const HEADING_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, doc.where.question), doc.where.heading, doc.where.wrong, HEADING_HINTS, `inf:${index}:intertitre`));
export function makeCm1InfHeading(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-inf-titre", CONCEPT, HEADING_ROWS);
}

// ---------------------------------------------------------------------------
// Vrai d'après le texte, compléter, compter
// ---------------------------------------------------------------------------

const TRUE_HINTS = hints("Relis le texte phrase par phrase.", "Une phrase vraie se retrouve presque mot pour mot au fil du texte.", "Élimine ce que le texte ne dit pas.");
export const TRUE_ROWS: readonly QuestionRow[] = DOCS.map((doc, index) => qr(withText(doc, "Quelle phrase est vraie d'après le texte ?"), doc.statement.right, doc.statement.wrong, TRUE_HINTS, `inf:${index}:vrai`));
export function makeCm1InfTrue(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-inf-vrai", CONCEPT, TRUE_ROWS);
}

const CLOZE_HINTS = hints("Lis tout le texte avant de choisir.", "Le mot qui manque revient ailleurs dans le texte.", "Élimine les mots absents du texte.");
/** Le mot est caché dans le corps du texte, jamais dans le titre (« La lampe solaire »). */
const hideWord = (doc: Doc) => `${doc.title}\n\n${doc.sections.map((s) => `${s.heading}\n${s.text}`).join("\n\n").replace(doc.cloze.word, "___")}`;
export const CLOZE_ROWS: readonly GapRow[] = DOCS.map((doc, index) => gr(hideWord(doc), doc.cloze.word, doc.cloze.wrong, CLOZE_HINTS, `inf:${index}:trou`));
export function makeCm1InfGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-inf-trou", CONCEPT, CLOZE_ROWS, 1, 0, "Complète le texte avec le bon mot.");
}

const COUNT_HINTS = hints("Compte avec ton doigt, phrase après phrase.", "Une phrase finit par un point.", "Les titres et les intertitres ne sont pas des phrases.");
const sentenceCount = (text: string) => (text.match(/[.!?](?:\s|$)/gu) ?? []).length;
export const COUNT_ROWS: readonly WriteRow[] = DOCS.flatMap((doc, index) => [
  wr(withText(doc, "Combien de phrases a ce texte ?"), [String(sentenceCount(doc.sections.map((s) => s.text).join(" ")))], COUNT_HINTS, `inf:${index}:phrases`),
  wr(withText(doc, `Combien de phrases a le paragraphe « ${doc.sections[1].heading} » ?`), [String(sentenceCount(doc.sections[1].text))], COUNT_HINTS, `inf:${index}:paragraphe`),
]);
export function makeCm1InfCount(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-inf-compte", CONCEPT, COUNT_ROWS);
}

// ---------------------------------------------------------------------------
// Relier, ranger des phrases en ordres et en informations, reconnaître un ordre
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Débute par l'ordre que tu connais.", "Retrouve chaque phrase en relisant le texte.", "Élimine les mots déjà reliés.");
export const LINK_ROWS: readonly LinkRow[] = DOCS.map((doc, index) => ({
  prompt: withText(doc, "Relie chaque début de phrase à sa suite."),
  pairs: doc.pairs.map(([left, right]) => ({ left: upperFirst(left), right })),
  hints: LINK_HINTS,
  fact: `inf:${index}:relier`,
}));
export function makeCm1InfLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-inf-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Une phrase qui commande dit ce qu'il faut faire.", "Une phrase qui renseigne dit comment sont les choses.", "Regarde le premier mot de la phrase.");
const SORT_ZONES = ["Ordre", "Information"] as const;
/** Pour chaque palier : trois ordres d'un document injonctif et trois informations d'un document informatif, six façons de les choisir. */
function sortRows(): SortRow[] {
  const orders = INJUNCTIVE.map((doc) => doc.sentences);
  const facts = DOCS.filter((doc) => doc.steps.length === 0).map((doc) => doc.sentences);
  return [0, 1, 2, 3, 4].flatMap((stage) =>
    Array.from({ length: 6 }, (_, n) => {
      const skipOrder = n % 4;
      const skipFact = Math.floor(n / 2) % 4;
      return {
        prompt: "Glisse chaque phrase dans la bonne case.",
        zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
        items: [
          ...orders[stage].filter((_, at) => at !== skipOrder).map((text) => ({ text, zone: SORT_ZONES[0] })),
          ...facts[stage].filter((_, at) => at !== skipFact).map((text) => ({ text, zone: SORT_ZONES[1] })),
        ],
        hints: SORT_HINTS,
      };
    }),
  );
}
export const SORT_ROWS: readonly SortRow[] = sortRows();
export function makeCm1InfSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-inf-glisser", CONCEPT, SORT_ROWS);
}

const VERB_HINTS = hints("Cherche la phrase qui commande de faire quelque chose.", "Le verbe d'un ordre s'écrit à l'impératif.", "Les phrases qui renseignent disent seulement comment sont les choses.");
export const VERB_ROWS: readonly QuestionRow[] = INJUNCTIVE.flatMap((doc, stage) => {
  const facts = DOCS.filter((candidate) => candidate.steps.length === 0)[stage].sentences;
  return [0, 1, 2].map((n) => qr("Dans quelle phrase le verbe donne-t-il un ordre ?", doc.sentences[n], [facts[n], facts[(n + 1) % 4]], VERB_HINTS, `inf:${DOCS.indexOf(doc)}:verbe${n}`));
});
export function makeCm1InfVerb(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-inf-verbe", CONCEPT, VERB_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}
