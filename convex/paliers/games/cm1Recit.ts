/**
 * LES GABARITS DE LECTURE D'UN RÉCIT DU CM1 : personnages, lieux, moments, ordre des événements, temps du récit, mots qui décrivent (`fr-cm1-recit`).
 *
 * Sur l'échantillon de CM1 lu le 23 octobre 2026, le modèle écrivait ici des questions sans texte (« Qui est le personnage principal ? » sans histoire), des textes qui
 * ne disaient pas la réponse, des réponses écrites dans l'énoncé et des ordres d'événements qui ne suivaient pas le texte. Ici le TEXTE est dans l'énoncé (dix récits écrits
 * pour l'exercice, de sept à neuf phrases, dans un cadre sénégalais, sans apostrophe droite, sans deux-points ni chiffre) et chaque question porte la phrase du texte qui y répond :
 * la bonne réponse est écrite dans cette phrase, les mauvais choix n'y sont pas.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TEXTES ÉVITENT
 * - Un énoncé n'a qu'une apostrophe droite au plus : le texte entier n'en a aucune, la question une au plus. Les récits évitent « l'eau », « d'une », « qu'il » :
 *   « la rivière », « une », « que ».
 * - Une réponse à écrire n'est jamais dans le texte : on demande un nombre (de phrases, de fois qu'un mot revient), jamais un nom.
 * - Un mauvais choix peut être dans le texte (un autre personnage, un autre lieu), mais jamais dans la phrase qui répond.
 * - Le mot à retrouver dans une phrase à trou revient ailleurs dans le texte : le contexte suffit à le choisir, et les mauvais choix n'y sont jamais.
 * - Le titre juste est celui du texte ; les deux autres sont les titres d'autres récits, de longueur voisine.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé, trois indices sans chiffre ni mot de quatre lettres ou plus d'une bonne
 * réponse, d'une option ou d'une tuile), plus un texte de cent cinquante mots au plus avec sa question (le plafond du CM1 du contrôleur).
 *
 * HORS FICHE, À FAIRE RELIRE : les dix récits (leurs personnages, leurs lieux, leurs noms propres sénégalais), leurs questions, leurs trente phrases rangées en action ou en portrait.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "comprendre un récit : personnages, lieux, moments, ordre des événements, temps, mots qui décrivent";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

export type Tense = "Présent" | "Imparfait" | "Passé composé";
/** Une question dont la réponse est écrite dans la phrase du texte qui contient `pivot`. */
export type Ask = { question: string; pivot: string; answer: string; wrong: readonly [string, string] };
export type Story = {
  title: string;
  text: string;
  asks: readonly [Ask, Ask, Ask];
  word: Ask;
  order: readonly [string, string, string, string];
  verb: readonly [string, Tense];
  statement: { right: string; evidence: string; wrong: readonly [string, string]; absent: readonly [string, string] };
  cloze: { word: string; wrong: readonly [string, string] };
  pairs: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  actions: readonly [string, string, string];
  portraits: readonly [string, string];
};
const ask = (question: string, pivot: string, answer: string, w1: string, w2: string): Ask => ({ question, pivot, answer, wrong: [w1, w2] });

export const STORIES: readonly Story[] = [
  // Palier 1.
  {
    title: "Une matinée de pêche",
    text: "Tôt le matin, Mamadou pousse sa pirogue sur le fleuve. Le ciel est rose et la brume est légère sur la rivière. Le fleuve est large et très calme. Il lance son grand filet bleu. Pendant deux heures, rien ne bouge. Soudain, un poisson argenté saute dans la pirogue. Mamadou sourit et rentre vite au village.",
    asks: [
      ask("Qui pousse sa pirogue sur le fleuve ?", "pousse sa pirogue", "Mamadou", "Moussa", "Cheikh"),
      ask("Où Mamadou pousse-t-il sa pirogue ?", "pousse sa pirogue", "sur le fleuve", "sur la plage", "dans la mer"),
      ask("Quand Mamadou pousse-t-il sa pirogue ?", "pousse sa pirogue", "Tôt le matin", "Tard le soir", "À midi"),
    ],
    word: ask("Comment est le poisson ?", "un poisson", "argenté", "doré", "noir"),
    order: ["Mamadou pousse sa pirogue sur le fleuve", "Il lance son grand filet bleu", "un poisson argenté saute dans la pirogue", "Mamadou sourit et rentre vite au village"],
    verb: ["pousse", "Présent"],
    statement: { right: "Un poisson saute dans la pirogue.", evidence: "un poisson argenté saute dans la pirogue", wrong: ["Mamadou rentre sans rien.", "Mamadou pêche dans la mer."], absent: ["sans rien", "dans la mer"] },
    cloze: { word: "pirogue", wrong: ["voiture", "maison"] },
    pairs: [["Mamadou", "pousse sa pirogue sur le fleuve"], ["Le ciel", "est rose"], ["un poisson argenté", "saute dans la pirogue"]],
    actions: ["Il lance son grand filet bleu.", "Soudain, un poisson argenté saute dans la pirogue.", "Mamadou sourit et rentre vite au village."],
    portraits: ["Le ciel est rose et la brume est légère sur la rivière.", "Le fleuve est large et très calme."],
  },
  {
    title: "Fatou au marché",
    text: "Fatou va au marché avec sa grand-mère. Elle porte un panier rouge sur la tête. Sa grand-mère est fatiguée mais souriante. Le marché est bruyant et très coloré. Un vendeur crie le prix des mangues. Fatou choisit la plus grosse mangue, jaune et douce. Sa grand-mère paie avec une grosse pièce. Fatou croque la mangue sur le chemin du retour.",
    asks: [
      ask("Qui va au marché avec sa grand-mère ?", "va au marché", "Fatou", "Awa", "Khady"),
      ask("Où Fatou croque-t-elle la mangue ?", "croque la mangue", "sur le chemin du retour", "au marché", "dans la cour"),
      ask("Que porte Fatou sur la tête ?", "porte un panier", "un panier rouge", "un seau vert", "un sac noir"),
    ],
    word: ask("Comment est la mangue choisie par Fatou ?", "choisit la plus grosse mangue", "jaune", "verte", "rouge"),
    order: ["Fatou va au marché avec sa grand-mère", "Fatou choisit la plus grosse mangue", "Sa grand-mère paie avec une grosse pièce", "Fatou croque la mangue sur le chemin du retour"],
    verb: ["porte", "Présent"],
    statement: { right: "Fatou croque la mangue sur le chemin du retour.", evidence: "croque la mangue sur le chemin du retour", wrong: ["Fatou croque la mangue au marché.", "Fatou achète une papaye."], absent: ["croque la mangue au marché", "papaye"] },
    cloze: { word: "grand-mère", wrong: ["cousine", "voisine"] },
    pairs: [["Fatou", "va au marché avec sa grand-mère"], ["Un vendeur", "crie le prix des mangues"], ["Sa grand-mère", "paie avec une grosse pièce"]],
    actions: ["Fatou va au marché avec sa grand-mère.", "Un vendeur crie le prix des mangues.", "Fatou croque la mangue sur le chemin du retour."],
    portraits: ["Sa grand-mère est fatiguée mais souriante.", "Le marché est bruyant et très coloré."],
  },
  // Palier 2.
  {
    title: "Le baobab du village",
    text: "Autrefois, un énorme baobab se dressait au milieu du village. Il était très vieux et très haut. Son tronc était gris et ses branches étaient larges. Chaque soir, les vieux se reposaient sous son ombre. Les enfants jouaient autour de lui. Un jour, une grande tempête a couché le baobab. Tout le village a pleuré.",
    asks: [
      ask("Qui se reposait sous son ombre chaque soir ?", "se reposaient sous son ombre", "les vieux", "les pêcheurs", "les maîtres"),
      ask("Où se dressait le baobab ?", "se dressait", "au milieu du village", "au bord du fleuve", "près de la mosquée"),
      ask("Quand une tempête a-t-elle couché le baobab ?", "a couché le baobab", "Un jour", "Chaque soir", "Chaque matin"),
    ],
    word: ask("Comment est le tronc du baobab ?", "tronc", "gris", "blanc", "noir"),
    order: ["un énorme baobab se dressait au milieu du village", "les vieux se reposaient sous son ombre", "une grande tempête a couché le baobab", "Tout le village a pleuré"],
    verb: ["se dressait", "Imparfait"],
    statement: { right: "Une tempête a couché le baobab.", evidence: "une grande tempête a couché le baobab", wrong: ["Le baobab a donné des fruits.", "Les enfants dormaient sous le baobab."], absent: ["fruits", "dormaient"] },
    cloze: { word: "baobab", wrong: ["manguier", "palmier"] },
    pairs: [["Son tronc", "était gris"], ["Les enfants", "jouaient autour de lui"], ["une grande tempête", "a couché le baobab"]],
    actions: ["Chaque soir, les vieux se reposaient sous son ombre.", "Les enfants jouaient autour de lui.", "Un jour, une grande tempête a couché le baobab."],
    portraits: ["Il était très vieux et très haut.", "Son tronc était gris et ses branches étaient larges."],
  },
  {
    title: "Le lièvre et le lion",
    text: "Un jour, le lièvre rusé a rencontré le lion près de la rivière. La rivière était large et profonde. Le lion, gros et fier, avait très faim. Le lièvre a proposé une course vers le grand rocher. Le lion a accepté en riant. Pendant la course, le lièvre a pris un raccourci par les herbes hautes. Il est arrivé le premier. Le lion a baissé la tête et a promis de respecter le lièvre.",
    asks: [
      ask("Qui a proposé une course vers le grand rocher ?", "a proposé une course", "Le lièvre", "Le singe", "Le chacal"),
      ask("Où le lièvre a-t-il rencontré le lion ?", "a rencontré le lion", "près de la rivière", "dans le village", "sous le baobab"),
      ask("Par où le lièvre est-il passé pendant la course ?", "a pris un raccourci", "par les herbes hautes", "par la rivière", "par le village"),
    ],
    word: ask("Comment est le lion ?", "gros et fier", "gros", "maigre", "petit"),
    order: ["le lièvre rusé a rencontré le lion", "Le lièvre a proposé une course", "le lièvre a pris un raccourci", "Le lion a baissé la tête"],
    verb: ["a rencontré", "Passé composé"],
    statement: { right: "Le lièvre est arrivé le premier.", evidence: "Il est arrivé le premier", wrong: ["Le lion est arrivé le premier.", "Le lièvre a perdu la course."], absent: ["Le lion est arrivé", "perdu"] },
    cloze: { word: "lion", wrong: ["chacal", "singe"] },
    pairs: [["Le lièvre", "a proposé une course vers le grand rocher"], ["Le lion", "a accepté en riant"], ["Il", "est arrivé le premier"]],
    actions: ["Le lièvre a proposé une course vers le grand rocher.", "Le lion a accepté en riant.", "Le lion a baissé la tête et a promis de respecter le lièvre."],
    portraits: ["La rivière était large et profonde.", "Le lion, gros et fier, avait très faim."],
  },
  // Palier 3.
  {
    title: "La fête du village",
    text: "Samedi soir, tout le village était en fête. Les tambours résonnaient sur la grande place. Les femmes dansaient en boubou coloré. Awa portait un beau pagne jaune. La nuit était chaude et claire. Soudain, la pluie a commencé à tomber. Les danseurs ont couru sous le grand arbre pour fuir la pluie.",
    asks: [
      ask("Qui portait un beau pagne jaune ?", "portait un beau pagne", "Awa", "Fatou", "Khady"),
      ask("Où résonnaient les tambours ?", "résonnaient", "sur la grande place", "dans la case", "au bord du fleuve"),
      ask("Quand le village était-il en fête ?", "en fête", "Samedi soir", "Dimanche matin", "Lundi midi"),
    ],
    word: ask("Quelle couleur a le pagne porté par Awa ?", "beau pagne", "jaune", "rouge", "vert"),
    order: ["tout le village était en fête", "Les femmes dansaient en boubou coloré", "la pluie a commencé à tomber", "Les danseurs ont couru sous le grand arbre"],
    verb: ["dansaient", "Imparfait"],
    statement: { right: "La pluie a commencé à tomber.", evidence: "la pluie a commencé à tomber", wrong: ["Les danseurs ont continué sous la pluie.", "Awa portait un pagne rouge."], absent: ["continué", "pagne rouge"] },
    cloze: { word: "pluie", wrong: ["neige", "fumée"] },
    pairs: [["Les tambours", "résonnaient sur la grande place"], ["Les femmes", "dansaient en boubou coloré"], ["Awa", "portait un beau pagne jaune"]],
    actions: ["Les tambours résonnaient sur la grande place.", "Les femmes dansaient en boubou coloré.", "Les danseurs ont couru sous le grand arbre pour fuir la pluie."],
    portraits: ["La nuit était chaude et claire.", "Samedi soir, tout le village était en fête."],
  },
  {
    title: "Mariama au puits",
    text: "Chaque matin, Mariama marche vers le puits du village avec un seau vert. Le chemin est long et sablonneux. Le soleil est déjà brûlant. Elle croise un vieux berger et ses chèvres blanches. Au puits, elle descend la corde et remplit son seau. Le seau est très lourd. Mariama le porte sur la tête et rentre à la maison.",
    asks: [
      ask("Qui marche vers le puits du village ?", "marche vers le puits", "Mariama", "Aminata", "Khady"),
      ask("Où Mariama remplit-elle son seau ?", "remplit son seau", "Au puits", "Au marché", "Sur la plage"),
      ask("Quand Mariama marche-t-elle vers le puits ?", "marche vers le puits", "Chaque matin", "Chaque soir", "Le dimanche"),
    ],
    word: ask("Comment est le chemin ?", "Le chemin est", "long", "court", "large"),
    order: ["Mariama marche vers le puits du village", "Elle croise un vieux berger", "elle descend la corde", "Mariama le porte sur la tête et rentre à la maison"],
    verb: ["croise", "Présent"],
    statement: { right: "Le seau est très lourd.", evidence: "Le seau est très lourd", wrong: ["Le seau est léger.", "Mariama rentre en pirogue."], absent: ["léger", "pirogue"] },
    cloze: { word: "seau", wrong: ["panier", "sac"] },
    pairs: [["Mariama", "marche vers le puits du village"], ["Le chemin", "est long et sablonneux"], ["Le seau", "est très lourd"]],
    actions: ["Elle croise un vieux berger et ses chèvres blanches.", "Au puits, elle descend la corde et remplit son seau.", "Mariama le porte sur la tête et rentre à la maison."],
    portraits: ["Le chemin est long et sablonneux.", "Le soleil est déjà brûlant."],
  },
  // Palier 4.
  {
    title: "Le voleur de mangues",
    text: "Hier soir, Moussa a surpris un voleur dans le verger de son oncle. Le voleur était petit et maigre. Il avait un sac plein de mangues mûres. La nuit était sombre et silencieuse. Moussa a crié très fort. Le voleur a laissé tomber son sac et a filé dans la nuit. Les voisins sont arrivés avec des lampes. Moussa a rendu les mangues à son oncle.",
    asks: [
      ask("Qui a surpris un voleur dans le verger ?", "a surpris un voleur", "Moussa", "Pape", "Cheikh"),
      ask("Où Moussa a-t-il surpris le voleur ?", "a surpris un voleur", "dans le verger de son oncle", "dans la case du chef", "sur le chemin du puits"),
      ask("Quand Moussa a-t-il surpris le voleur ?", "a surpris un voleur", "Hier soir", "Ce matin", "Samedi dernier"),
    ],
    word: ask("Comment est le voleur ?", "Le voleur était", "petit", "grand", "gros"),
    order: ["Moussa a surpris un voleur", "Moussa a crié très fort", "Le voleur a laissé tomber son sac", "Moussa a rendu les mangues à son oncle"],
    verb: ["a surpris", "Passé composé"],
    statement: { right: "Le voleur avait un sac plein de mangues.", evidence: "avait un sac plein de mangues", wrong: ["Le voleur avait un panier de papayes.", "Le voleur a gardé les mangues."], absent: ["papayes", "gardé"] },
    cloze: { word: "mangues", wrong: ["bananes", "oranges"] },
    pairs: [["Moussa", "a surpris un voleur dans le verger de son oncle"], ["Le voleur", "était petit et maigre"], ["Les voisins", "sont arrivés avec des lampes"]],
    actions: ["Moussa a crié très fort.", "Le voleur a laissé tomber son sac et a filé dans la nuit.", "Les voisins sont arrivés avec des lampes."],
    portraits: ["Le voleur était petit et maigre.", "La nuit était sombre et silencieuse."],
  },
  {
    title: "La pirogue de Cheikh",
    text: "Il y a longtemps, Cheikh vivait près de la mer avec son père. Chaque matin, ils partaient pêcher dans une vieille pirogue. Le vent était fort et les vagues étaient grandes. Cheikh restait calme. Son père ramait avec courage dans la pirogue. Le ciel était gris et lourd. Le soir, ils revenaient au village avec des poissons.",
    asks: [
      ask("Qui vivait près de la mer ?", "vivait près de la mer", "Cheikh", "Omar", "Pape"),
      ask("Où Cheikh vivait-il ?", "vivait", "près de la mer", "près du fleuve", "au milieu du désert"),
      ask("Quand partaient-ils pêcher ?", "partaient pêcher", "Chaque matin", "Chaque soir", "Chaque dimanche"),
    ],
    word: ask("Comment est la pirogue ?", "partaient pêcher", "vieille", "neuve", "grande"),
    order: ["Cheikh vivait près de la mer", "ils partaient pêcher", "Son père ramait avec courage", "ils revenaient au village"],
    verb: ["vivait", "Imparfait"],
    statement: { right: "Le père de Cheikh ramait avec courage.", evidence: "Son père ramait avec courage", wrong: ["Le père de Cheikh avait peur.", "Ils partaient pêcher le soir."], absent: ["avait peur", "pêcher le soir"] },
    cloze: { word: "pirogue", wrong: ["voiture", "charrette"] },
    pairs: [["Cheikh", "vivait près de la mer avec son père"], ["Le vent", "était fort"], ["Son père", "ramait avec courage dans la pirogue"]],
    actions: ["Chaque matin, ils partaient pêcher dans une vieille pirogue.", "Son père ramait avec courage dans la pirogue.", "Le soir, ils revenaient au village avec des poissons."],
    portraits: ["Le ciel était gris et lourd.", "Le vent était fort et les vagues étaient grandes."],
  },
  // Palier 5.
  {
    title: "Le concours de dessin",
    text: "La maîtresse a organisé un concours de dessin dans la classe. Les élèves devaient dessiner leur animal préféré. Aminata a choisi un éléphant gris avec de grandes oreilles. Omar a dessiné un lion jaune au milieu de la savane. Le silence était total dans la classe. Après une heure, le concours était terminé. La maîtresse a regardé tous les dessins. Elle a donné le premier prix à Aminata.",
    asks: [
      ask("Qui a organisé le concours ?", "a organisé un concours", "La maîtresse", "Le directeur", "Le chef"),
      ask("Où Omar a-t-il placé son lion ?", "lion jaune", "au milieu de la savane", "au bord du fleuve", "dans un village"),
      ask("Quel animal Aminata a-t-elle choisi ?", "a choisi", "un éléphant gris", "un lion jaune", "un singe noir"),
    ],
    word: ask("Comment est le lion dessiné par Omar ?", "lion", "jaune", "gris", "noir"),
    order: ["La maîtresse a organisé un concours", "Aminata a choisi un éléphant gris", "La maîtresse a regardé tous les dessins", "Elle a donné le premier prix à Aminata"],
    verb: ["a donné", "Passé composé"],
    statement: { right: "Aminata a gagné le premier prix.", evidence: "le premier prix à Aminata", wrong: ["Omar a gagné le premier prix.", "Le concours a duré une journée."], absent: ["prix à Omar", "journée"] },
    cloze: { word: "concours", wrong: ["match", "spectacle"] },
    pairs: [["La maîtresse", "a organisé un concours de dessin dans la classe"], ["Aminata", "a choisi un éléphant gris"], ["Omar", "a dessiné un lion jaune"]],
    actions: ["La maîtresse a organisé un concours de dessin dans la classe.", "Aminata a choisi un éléphant gris avec de grandes oreilles.", "Elle a donné le premier prix à Aminata."],
    portraits: ["Le silence était total dans la classe.", "Après une heure, le concours était terminé."],
  },
  {
    title: "La nuit des étoiles",
    text: "Cette nuit-là, Khady ne dormait pas. Elle regardait le ciel noir, qui brillait de mille étoiles. La nuit était douce et le village était calme. Son grand-père est venu près de Khady avec une natte. Il était vieux et très doux. Il lui a montré la Grande Ourse. Khady a compté les étoiles pendant une heure. Puis elle a fermé les yeux avec un grand sourire.",
    asks: [
      ask("Qui est venu près de Khady avec une natte ?", "est venu près de Khady", "Son grand-père", "Son frère", "Son oncle"),
      ask("Que regardait Khady ?", "regardait", "le ciel noir", "la mer", "le fleuve"),
      ask("Quand Khady ne dormait-elle pas ?", "ne dormait pas", "Cette nuit-là", "Ce matin-là", "Ce soir-là"),
    ],
    word: ask("Comment est le ciel ?", "le ciel", "noir", "bleu", "gris"),
    order: ["Elle regardait le ciel noir", "Son grand-père est venu près de Khady", "Khady a compté les étoiles", "elle a fermé les yeux"],
    verb: ["regardait", "Imparfait"],
    statement: { right: "Khady a compté les étoiles pendant une heure.", evidence: "a compté les étoiles pendant une heure", wrong: ["Khady a compté les étoiles toute la nuit.", "Son grand-père a chanté une chanson."], absent: ["toute la nuit", "chanté"] },
    cloze: { word: "étoiles", wrong: ["lampes", "bougies"] },
    pairs: [["Khady", "ne dormait pas"], ["Son grand-père", "est venu près de Khady avec une natte"], ["le ciel noir", "brillait de mille étoiles"]],
    actions: ["Elle regardait le ciel noir, qui brillait de mille étoiles.", "Son grand-père est venu près de Khady avec une natte.", "Khady a compté les étoiles pendant une heure."],
    portraits: ["La nuit était douce et le village était calme.", "Il était vieux et très doux."],
  },
];

const withText = (story: Story, question: string) => `${story.text}\n\nLis le texte. ${question}`;
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// ---------------------------------------------------------------------------
// Qui, où, quand ? et le mot qui décrit
// ---------------------------------------------------------------------------

const ASK_HINTS = hints("Relis la phrase qui parle de ce que demande la question.", "Cherche le mot qui répond à qui, où ou quand.", "Élimine les réponses absentes de la phrase qui répond.");
export const ASK_ROWS: readonly QuestionRow[] = STORIES.flatMap((story, index) => story.asks.map((entry, j) => qr(withText(story, entry.question), entry.answer, entry.wrong, ASK_HINTS, `rec:${index}:q${j}`)));
export function makeCm1RecAsk(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-rec-question", CONCEPT, ASK_ROWS);
}

const WORD_HINTS = hints("Retrouve la phrase qui parle de ce que décrit la question.", "Le mot cherché dit comment est la personne ou la chose.", "Élimine les mots absents de la phrase qui répond.");
export const WORD_ROWS: readonly QuestionRow[] = STORIES.map((story, index) => qr(withText(story, story.word.question), story.word.answer, story.word.wrong, WORD_HINTS, `rec:${index}:mot`));
export function makeCm1RecWord(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-rec-mot", CONCEPT, WORD_ROWS);
}

// ---------------------------------------------------------------------------
// L'ordre des événements, le temps d'un verbe
// ---------------------------------------------------------------------------

const ORDER_HINTS = hints("Cherche ce qui arrive au commencement du texte.", "Les événements se suivent comme les phrases du texte.", "Repère le dernier événement du texte.");
export const ORDER_ROWS: readonly OrderRow[] = STORIES.map((story, index) => ordr(withText(story, "Remets les événements dans l'ordre du récit."), story.order.map(upperFirst), ORDER_HINTS, `rec:${index}:ordre`));
export function makeCm1RecOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm1-rec-ordre", CONCEPT, ORDER_ROWS);
}

const TENSES: readonly Tense[] = ["Présent", "Imparfait", "Passé composé"];
const TENSE_HINTS = hints("Regarde la fin du verbe.", "Compte les mots du verbe, un ou deux.", "Remplace le début de la phrase par hier, maintenant ou demain.");
export const TENSE_ROWS: readonly QuestionRow[] = STORIES.map((story, index) =>
  qr(withText(story, `À quel temps est écrit le verbe « ${story.verb[0]} » dans le texte ?`), story.verb[1], TENSES.filter((tense) => tense !== story.verb[1]) as unknown as [string, string], TENSE_HINTS, `rec:${index}:temps`),
);
export function makeCm1RecTense(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-rec-temps", CONCEPT, TENSE_ROWS);
}

// ---------------------------------------------------------------------------
// Vrai d'après le texte, le titre
// ---------------------------------------------------------------------------

const TRUE_HINTS = hints("Relis le texte phrase par phrase.", "Une phrase vraie se retrouve presque mot pour mot au fil du texte.", "Élimine ce que le texte ne dit pas.");
export const TRUE_ROWS: readonly QuestionRow[] = STORIES.map((story, index) => qr(withText(story, "Quelle phrase est vraie d'après le texte ?"), story.statement.right, story.statement.wrong, TRUE_HINTS, `rec:${index}:vrai`));
export function makeCm1RecTrue(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-rec-vrai", CONCEPT, TRUE_ROWS);
}

const TITLE_HINTS = hints("Pense à ce dont parle tout le texte.", "Un titre court donne envie de lire.", "Élimine les titres qui parlent d'une autre histoire.");
/** Les deux titres des autres récits les plus proches en longueur : la bonne réponse ne se détache pas. */
function titleRows(): QuestionRow[] {
  return STORIES.map((story, index) => {
    const others = STORIES.filter((other) => other.title !== story.title)
      .map((other) => other.title)
      .sort((a, b) => Math.abs(a.length - story.title.length) - Math.abs(b.length - story.title.length) || a.localeCompare(b));
    return qr(withText(story, "Quel titre convient le mieux à ce texte ?"), story.title, [cycle(others, index), cycle(others, index + 3)], TITLE_HINTS, `rec:${index}:titre`);
  });
}
export const TITLE_ROWS: readonly QuestionRow[] = titleRows();
export function makeCm1RecTitle(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-rec-titre", CONCEPT, TITLE_ROWS);
}

// ---------------------------------------------------------------------------
// Compléter le texte, compter
// ---------------------------------------------------------------------------

const CLOZE_HINTS = hints("Lis tout le texte avant de choisir.", "Le mot qui manque revient ailleurs dans le texte.", "Élimine les mots absents du texte.");
export const CLOZE_ROWS: readonly GapRow[] = STORIES.map((story, index) =>
  gr(story.text.replace(story.cloze.word, "___"), story.cloze.word, story.cloze.wrong, CLOZE_HINTS, `rec:${index}:trou`),
);
export function makeCm1RecGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-rec-trou", CONCEPT, CLOZE_ROWS, 1, 0, "Complète le texte avec le bon mot.");
}

const COUNT_HINTS = hints("Compte avec ton doigt, phrase après phrase.", "Une phrase finit par un point.", "Relis le texte pour ne rien oublier.");
const WORD_COUNT_HINTS = hints("Lis le texte en cherchant ce mot.", "Barre le mot chaque fois que tu le vois.", "Relis le texte pour ne rien oublier.");
const sentenceCount = (text: string) => (text.match(/[.!?](?:\s|$)/gu) ?? []).length;
const occurrences = (text: string, word: string) => (text.match(new RegExp(`(?<![\\p{L}-])${word}(?![\\p{L}-])`, "giu")) ?? []).length;
export const COUNT_ROWS: readonly WriteRow[] = STORIES.flatMap((story, index) => [
  wr(withText(story, "Combien de phrases a ce texte ?"), [String(sentenceCount(story.text))], COUNT_HINTS, `rec:${index}:phrases`),
  wr(withText(story, `Combien de fois le mot « ${story.cloze.word} » est-il écrit dans ce texte ?`), [String(occurrences(story.text, story.cloze.word))], WORD_COUNT_HINTS, `rec:${index}:fois`),
]);
export function makeCm1RecCount(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-rec-compte", CONCEPT, COUNT_ROWS);
}

// ---------------------------------------------------------------------------
// Relier un personnage à ce qu'il fait, ranger des phrases en événements ou portraits
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Débute par le personnage dont tu es sûr.", "Retrouve chaque phrase en relisant le texte.", "Élimine les actions déjà reliées.");
export const LINK_ROWS: readonly LinkRow[] = STORIES.map((story, index) => ({
  prompt: withText(story, "Relie chaque début de phrase à sa suite."),
  pairs: story.pairs.map(([left, right]) => ({ left: upperFirst(left), right })),
  hints: LINK_HINTS,
  fact: `rec:${index}:relier`,
}));
export function makeCm1RecLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-rec-relier", CONCEPT, LINK_ROWS);
}

const SORT_HINTS = hints("Un événement dit ce que fait un personnage.", "Un portrait dit comment est une personne ou une chose.", "Cherche le verbe être parmi les phrases qui décrivent.");
const SORT_ZONES = ["Action", "Description"] as const;
/** Pour chaque palier : trois actions et trois descriptions prises dans les deux récits du palier, six façons de les choisir. */
function sortRows(): SortRow[] {
  return [0, 1, 2, 3, 4].flatMap((stage) => {
    const pair = [STORIES[stage * 2], STORIES[stage * 2 + 1]];
    const actions = pair.flatMap((story) => story.actions);
    const portraits = pair.flatMap((story) => story.portraits);
    return Array.from({ length: 6 }, (_, n) => {
      const acts = Array.from({ length: 3 }, (__, slot) => cycle(actions, n + slot));
      const descs = Array.from({ length: 3 }, (__, slot) => cycle(portraits, n + slot + 1));
      return {
        prompt: "Glisse chaque phrase dans la bonne case.",
        zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
        items: [...acts.map((text) => ({ text, zone: SORT_ZONES[0] })), ...descs.map((text) => ({ text, zone: SORT_ZONES[1] }))],
        hints: SORT_HINTS,
      };
    });
  });
}
export const SORT_ROWS: readonly SortRow[] = sortRows();
export function makeCm1RecSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-rec-glisser", CONCEPT, SORT_ROWS);
}
