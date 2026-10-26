/**
 * LES GABARITS DE CONJUGAISON DU CE2 : l'imparfait et le passé composé ; l'impératif et le futur simple (`fr-ce2-imparfait`,
 * `fr-ce2-imperatif-futur`).
 *
 * Sur l'échantillon de CE2 lu le 22 octobre 2026, le modèle écrivait ici des exercices faux (« Place les verbes : fais, Prendre, voir » comme
 * si un infinitif était l'autre temps d'une série d'impératifs), des réponses qui contredisaient la phrase (« Demain, je ___ (aller) »
 * corrigé par « je vais »), des ordres de phrases qui ne racontaient rien (« Hier, je. ») et des glissés sans clé lisible. Ici chaque exercice
 * lit une ligne d'un tableau fermé : le verbe est donné (entre parenthèses ou dans l'énoncé), la personne est dite, et un mauvais choix est
 * une forme que le temps ou la personne de la phrase interdit.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - L'imparfait des verbes usuels des trois groupes (terminaisons -ais, -ais, -ait, -ions, -iez, -aient) ; le passé composé de faire, courir,
 *   voir et prendre ; le choix entre l'imparfait (ce qui durait, ce qui se répétait) et le passé composé (une action courte et finie).
 * - L'impératif des verbes des deuxième et troisième groupes (finis, prends, fais, viens, va) ; le futur simple de faire, partir, voir,
 *   venir, avoir, être, aller et finir.
 *
 * LES PIÈGES DU FRANÇAIS QUE CES TABLEAUX ÉVITENT
 * - Un mauvais choix de conjugaison n'est jamais une forme qui irait aussi : pour une phrase qui dit « autrefois » ou « chaque soir », les mauvais
 *   choix sont une forme d'une AUTRE PERSONNE et un PRÉSENT ou un FUTUR (jamais un passé composé, qu'un récit peut accepter). Pour une phrase
 *   qui dit « soudain » ou « tout à coup », les mauvais choix sont l'imparfait et le présent.
 * - Le passé composé avec « être » (aller, partir, venir, tomber) accorde le participe avec le sujet : les phrases du passé composé n'emploient que
 *   l'auxiliaire « avoir » (faire, courir, voir, prendre, finir, trouver, entendre).
 * - L'impératif de « aller » est « va » (sans s) et celui des verbes en -ir du deuxième groupe « finis » : un mauvais choix « vas » n'est écrit que
 *   pour montrer le piège, jamais comme bonne réponse ; « va » seul peut être le présent de « il va » : les glissés ne le mettent qu'avec des
 *   formes sans pronom, qui sont des ordres.
 * - Le futur de « voir » est « verrai », de « venir » « viendrai », de « aller » « irai », de « être » « serai », de « avoir » « aurai » : le
 *   radical change, pas seulement la terminaison. Un trou n'écrit jamais un futur en -erai sur ces verbes.
 * - Une histoire à remettre dans l'ordre porte son ordre dans trois mots (D'abord, Ensuite, Enfin) ; les indices n'écrivent pas ces mots.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans
 * chiffre ni mot de quatre lettres ou plus d'une bonne réponse, d'une option ou d'une tuile, une liste de 4, 8, 12, 16 ou 20 lignes).
 *
 * HORS FICHE, À FAIRE RELIRE : les verbes de l'imparfait au-delà de la fiche (jouer, nager, raconter, boire, vendre, marcher, finir, courir),
 * les phrases de la vie courante (le marché, la cour, le baobab), les douze histoires à remettre dans l'ordre.
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
import type { GameContext, GeneratedGame } from "./shared";

const ct = (left: string, right: string) => ({ left, right });

// ===========================================================================
// L'IMPARFAIT ET LE PASSÉ COMPOSÉ (fr-ce2-imparfait)
// ===========================================================================

const IMPARFAIT = "l'imparfait et le passé composé";

const IMPARFAIT_GAP_HINTS = hints(
  "Le début de la phrase dit que l'action se répétait ou durait.",
  "Cherche la fin du verbe qui va avec la personne.",
  "À l'imparfait, la fin du verbe est ais, ait, ions, iez ou aient.",
);
const imparfaitGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, IMPARFAIT_GAP_HINTS);
/** Le verbe est donné entre parenthèses ; les mauvais choix sont une autre personne et un présent ou un futur. */
export const IMPARFAIT_GAP_ROWS: readonly GapRow[] = [
  imparfaitGap("Autrefois, je ___ (jouer) au ballon.", "jouais", ["jouait", "joue"]),
  imparfaitGap("Tous les soirs, Awa ___ (raconter) une histoire.", "racontait", ["racontaient", "raconte"]),
  imparfaitGap("Quand nous étions petits, nous ___ (nager) dans la rivière.", "nagions", ["nageons", "nagiez"]),
  imparfaitGap("Autrefois, vous ___ (aller) au puits.", "alliez", ["allez", "allaient"]),
  imparfaitGap("Quand j'étais petit, je ___ (boire) du lait.", "buvais", ["bois", "buvait"]),
  imparfaitGap("Avant, les enfants ___ (marcher) à pied.", "marchaient", ["marchent", "marchait"]),
  imparfaitGap("Autrefois, tu ___ (aller) souvent chez ta tante.", "allais", ["vas", "allait"]),
  imparfaitGap("Quand il pleuvait, nous ___ (rester) à la maison.", "restions", ["restons", "restiez"]),
  imparfaitGap("Le soir, grand-mère ___ (dire) des contes.", "disait", ["dit", "disaient"]),
  imparfaitGap("Autrefois, mon père ___ (vendre) des mangues.", "vendait", ["vend", "vendaient"]),
  imparfaitGap("Quand vous étiez petits, vous ___ (courir) dans la cour.", "couriez", ["courez", "couraient"]),
  imparfaitGap("Chaque jour, je ___ (finir) mon devoir.", "finissais", ["finis", "finissait"]),
];

const TENSE_CHOICE_HINTS = hints(
  "Cherche le mot de temps au début de la phrase.",
  "Un verbe d'un seul mot parle de ce qui durait ou se répétait, un verbe en deux mots d'une action finie.",
  "Les trois phrases racontent la même chose, mais à des moments différents.",
);
const IMPARFAIT_PROMPT = "Dans quelle phrase le verbe est-il à l'imparfait ?";
const COMPOSE_PROMPT = "Dans quelle phrase le verbe est-il au passé composé ?";
const imparfaitChoice = (answer: string, wrong: readonly [string, string], fact?: string): QuestionRow => qr(IMPARFAIT_PROMPT, answer, wrong, TENSE_CHOICE_HINTS, fact);
const composeChoice = (answer: string, wrong: readonly [string, string], fact?: string): QuestionRow => qr(COMPOSE_PROMPT, answer, wrong, TENSE_CHOICE_HINTS, fact);
export const TENSE_CHOICE_ROWS: readonly QuestionRow[] = [
  imparfaitChoice("Autrefois, Awa jouait dans la cour.", ["Hier, Awa a joué dans la cour.", "Demain, Awa jouera dans la cour."]),
  composeChoice("Ce matin, Moussa a mangé du riz.", ["Autrefois, Moussa mangeait du riz.", "Demain, Moussa mangera du riz."]),
  imparfaitChoice("Chaque soir, les enfants écoutaient un conte.", ["Hier soir, les enfants ont écouté un conte.", "Ce soir, les enfants écoutent un conte."]),
  composeChoice("Hier, nous avons lavé la voiture.", ["Autrefois, nous lavions la voiture.", "Maintenant, nous lavons la voiture."]),
  imparfaitChoice("Autrefois, le marché ouvrait très tôt.", ["Hier, le marché a ouvert très tôt.", "Demain, le marché ouvrira très tôt."]),
  composeChoice("Soudain, le chien a aboyé.", ["Autrefois, le chien aboyait.", "Demain, le chien aboiera."], "récit:chien"),
  imparfaitChoice("Quand j'étais petit, je chantais sous le manguier.", ["Hier, j'ai chanté sous le manguier.", "Demain, je chanterai sous le manguier."]),
  composeChoice("Hier soir, Omar a fini ses devoirs.", ["Chaque soir, Omar finissait ses devoirs.", "Demain, Omar finira ses devoirs."]),
  imparfaitChoice("Quand elle était petite, Fatou dormait chez sa tante.", ["Hier, Fatou a dormi chez sa tante.", "Demain, Fatou dormira chez sa tante."]),
  composeChoice("Ce matin, ils ont couru jusqu'à l'école.", ["Autrefois, ils couraient jusqu'à l'école.", "Demain, ils courront jusqu'à l'école."]),
  imparfaitChoice("Autrefois, ils vendaient des mangues au bord de la route.", ["Hier, ils ont vendu des mangues au bord de la route.", "Demain, ils vendront des mangues au bord de la route."]),
  composeChoice("Tout à coup, la cloche a sonné.", ["Chaque matin, la cloche sonnait.", "Maintenant, la cloche sonne."], "récit:cloche"),
];

const STORY_GAP_HINTS = hints(
  "Soudain ou tout à coup annonce une action courte, déjà finie.",
  "Le verbe de l'action courte est au passé composé, avec avoir.",
  "Choisis le verbe fait de deux mots.",
);
const storyGap = (text: string, answer: string, wrong: readonly [string, string], fact?: string): GapRow => gr(text, answer, wrong, STORY_GAP_HINTS, fact);
export const STORY_GAP_ROWS: readonly GapRow[] = [
  storyGap("Le soleil brillait quand, tout à coup, la pluie ___ (commencer).", "a commencé", ["commençait", "commence"], "récit:pluie"),
  storyGap("Pendant que Fatou lisait, soudain son frère ___ (crier).", "a crié", ["criait", "crie"]),
  storyGap("Il faisait nuit quand, soudain, un chien ___ (aboyer).", "a aboyé", ["aboyait", "aboie"], "récit:chien"),
  storyGap("Nous jouions dans la cour quand, soudain, la cloche ___ (sonner).", "a sonné", ["sonnait", "sonne"], "récit:cloche"),
  storyGap("Moussa cherchait des mangues quand, tout à coup, il ___ (trouver) un gros fruit.", "a trouvé", ["trouvait", "trouve"]),
  storyGap("Les enfants dormaient quand, tout à coup, le tonnerre ___ (gronder).", "a grondé", ["grondait", "gronde"]),
  storyGap("Il pleuvait depuis le matin quand, soudain, le vent ___ (souffler).", "a soufflé", ["soufflait", "souffle"]),
  storyGap("Nous marchions dans le village quand, soudain, nous ___ (voir) un lion.", "avons vu", ["voyions", "voyons"]),
  storyGap("Tu cherchais ton cahier quand, tout à coup, tu le ___ (trouver).", "as trouvé", ["trouvais", "trouves"]),
  storyGap("Ils jouaient au ballon quand, soudain, ils ___ (entendre) un grand bruit.", "ont entendu", ["entendaient", "entendent"]),
  storyGap("Je rangeais mes affaires quand, tout à coup, j'___ (trouver) une lettre.", "ai trouvé", ["trouvais", "trouve"]),
  storyGap("Vous pêchiez quand, soudain, vous ___ (voir) un gros poisson.", "avez vu", ["voyiez", "voyez"]),
];

const COMPOSE_GAP_HINTS = hints(
  "Hier ou ce matin dit que l'action est finie.",
  "Le verbe a deux mots : avoir conjugué puis le participe passé.",
  "Choisis l'auxiliaire qui va avec le sujet.",
);
const composeGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, COMPOSE_GAP_HINTS);
export const COMPOSE_GAP_ROWS: readonly GapRow[] = [
  composeGap("Hier, Awa ___ son devoir. (faire)", "a fait", ["ai fait", "ont fait"]),
  composeGap("Hier, nous ___ jusqu'au marché. (courir)", "avons couru", ["avez couru", "ont couru"]),
  composeGap("Ce matin, tu ___ un lion. (voir)", "as vu", ["ai vu", "a vu"]),
  composeGap("Hier, Moussa ___ le bus. (prendre)", "a pris", ["ai pris", "as pris"]),
  composeGap("Hier, vous ___ du gâteau. (faire)", "avez fait", ["avons fait", "ont fait"]),
  composeGap("Ce matin, les garçons ___ vers la plage. (courir)", "ont couru", ["a couru", "avons couru"]),
  composeGap("Hier, j'___ un oiseau. (voir)", "ai vu", ["as vu", "a vu"]),
  composeGap("Ce matin, nous ___ notre sac. (prendre)", "avons pris", ["avez pris", "ont pris"]),
  composeGap("Hier soir, Fatou ___ la vaisselle. (faire)", "a fait", ["as fait", "ai fait"]),
  composeGap("Ce matin, tu ___ très vite. (courir)", "as couru", ["a couru", "ai couru"]),
  composeGap("Hier, Pape et Omar ___ un vieux baobab. (voir)", "ont vu", ["a vu", "avons vu"]),
  composeGap("Hier, vous ___ le même chemin. (prendre)", "avez pris", ["avons pris", "ont pris"]),
];

const PARTICIPLES = [
  ct("faire", "fait"),
  ct("courir", "couru"),
  ct("voir", "vu"),
  ct("prendre", "pris"),
  ct("manger", "mangé"),
  ct("finir", "fini"),
  ct("avoir", "eu"),
  ct("boire", "bu"),
] as const;
const PARTICIPLE_HINTS = hints(
  "Le participe passé est la forme qui suit l'auxiliaire dans le passé composé.",
  "Dis « hier, j'ai » puis le verbe pour entendre le participe.",
  "Commence par le verbe dont tu connais le participe.",
);
const participleRows = (): LinkRow[] => {
  const all = combinations(PARTICIPLES, 3);
  const step = all.length / 12;
  return Array.from({ length: 12 }, (_, i) => ({ prompt: "Relie chaque verbe à son participe passé.", pairs: all[Math.floor(i * step)], hints: PARTICIPLE_HINTS }));
};
export const PARTICIPLE_ROWS: readonly LinkRow[] = participleRows();

const TENSE_TILES_IMPARFAIT = ["il chantait", "je finissais", "nous jouions", "elles marchaient", "tu allais", "vous couriez"] as const;
const TENSE_TILES_COMPOSE = ["il a chanté", "j'ai fini", "nous avons joué", "elles ont marché", "tu as vu", "vous avez pris"] as const;
export const TENSE_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque verbe dans la bonne case.",
  ["Imparfait", "Passé composé"],
  TENSE_TILES_IMPARFAIT,
  TENSE_TILES_COMPOSE,
  hints(
    "Un verbe fait de deux mots, avoir puis un participe, raconte une action finie.",
    "Un seul mot qui finit par ait, ais, ions ou aient décrit ce qui durait.",
    "Dis « autrefois » ou « hier » devant chaque verbe.",
  ),
  12,
);

const STORY_ORDER_HINTS = hints(
  "Cherche le petit mot qui ouvre l'histoire.",
  "Chaque phrase s'ouvre par un mot qui dit sa place.",
  "Le mot de la dernière phrase annonce la fin.",
);
const storyOrder = (first: string, second: string, third: string, fact?: string): OrderRow => ordr("Remets ces phrases dans l'ordre du temps.", [first, second, third], STORY_ORDER_HINTS, fact);
export const STORY_ORDER_ROWS: readonly OrderRow[] = [
  storyOrder("D'abord, Awa a pris son panier.", "Ensuite, elle a couru au marché.", "Enfin, elle a acheté des mangues."),
  storyOrder("D'abord, Moussa a vu un lion.", "Ensuite, il a couru vers le village.", "Enfin, il a prévenu le chef."),
  storyOrder("D'abord, nous avons fait un feu.", "Ensuite, nous avons cuit le riz.", "Enfin, nous avons mangé ensemble."),
  storyOrder("D'abord, Fatou a pris son cahier.", "Ensuite, elle a fait son devoir.", "Enfin, elle a rangé son cartable."),
  storyOrder("D'abord, les enfants ont couru jusqu'à la plage.", "Ensuite, ils ont vu des pêcheurs.", "Enfin, ils ont pris un poisson."),
  storyOrder("D'abord, j'ai pris le car.", "Ensuite, j'ai vu mon cousin.", "Enfin, nous avons fait une promenade."),
  storyOrder("D'abord, la maîtresse a pris la craie.", "Ensuite, elle a écrit la date.", "Enfin, les élèves ont copié la leçon."),
  storyOrder("D'abord, Omar a vu un nuage noir.", "Ensuite, il a couru à la maison.", "Enfin, la pluie a commencé.", "récit:pluie"),
  storyOrder("D'abord, Khady a fait la cuisine.", "Ensuite, elle a mis la table.", "Enfin, toute la famille a mangé."),
  storyOrder("D'abord, Pape a pris ses filets.", "Ensuite, il a lancé les filets.", "Enfin, il a ramené beaucoup de poissons."),
  storyOrder("D'abord, Aminata a vu une affiche.", "Ensuite, elle a lu la date.", "Enfin, elle a prévenu ses amies."),
  storyOrder("D'abord, nous avons couru dans la cour.", "Ensuite, la cloche a sonné.", "Enfin, nous avons pris nos cahiers.", "récit:cloche"),
];

const IMPARFAIT_WRITE_HINTS = hints(
  "Pense à la personne de la phrase.",
  "Le début du verbe reste presque le même, la fin change avec la personne.",
  "Écris seulement le verbe.",
);
const COMPOSE_WRITE_HINTS = hints(
  "Pense à la personne de la phrase.",
  "Il y a deux mots : avoir conjugué puis le participe passé.",
  "Écris seulement les deux mots du verbe.",
);
const imparfaitWrite = (verb: string, person: string, answer: string): WriteRow => wr(`Écris le verbe ${verb} à l'imparfait avec ${person}.`, [answer], IMPARFAIT_WRITE_HINTS);
const composeWrite = (verb: string, person: string, answer: string): WriteRow => wr(`Écris le verbe ${verb} au passé composé avec ${person}.`, [answer], COMPOSE_WRITE_HINTS);
export const IMPARFAIT_WRITE_ROWS: readonly WriteRow[] = [
  imparfaitWrite("jouer", "nous", "jouions"),
  imparfaitWrite("chanter", "ils", "chantaient"),
  imparfaitWrite("finir", "je", "finissais"),
  imparfaitWrite("aller", "tu", "allais"),
  imparfaitWrite("manger", "il", "mangeait"),
  imparfaitWrite("faire", "vous", "faisiez"),
  imparfaitWrite("prendre", "nous", "prenions"),
  imparfaitWrite("voir", "ils", "voyaient"),
  composeWrite("faire", "tu", "as fait"),
  composeWrite("courir", "nous", "avons couru"),
  composeWrite("voir", "il", "a vu"),
  composeWrite("prendre", "vous", "avez pris"),
];

/**
 * L'énoncé nomme le temps : un mauvais choix est au présent, et « Tous les soirs, Awa raconte une histoire » est juste au présent d'habitude
 * quand l'énoncé dit seulement « Complète la phrase » (défaut relevé en production le 25 octobre 2026).
 */
export const IMPARFAIT_GAP_PROMPT = "Complète la phrase avec le verbe à l'imparfait.";
export function makeCe2ImparfaitGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-imparfait-forme", IMPARFAIT, IMPARFAIT_GAP_ROWS, 2, 0, IMPARFAIT_GAP_PROMPT);
}
export function makeCe2TenseChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-imparfait-choisir", IMPARFAIT, TENSE_CHOICE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}
export function makeCe2StoryGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-imparfait-recit", IMPARFAIT, STORY_GAP_ROWS);
}
export function makeCe2ComposeGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-compose-forme", IMPARFAIT, COMPOSE_GAP_ROWS, 2);
}
export function makeCe2ParticipleLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-compose-relier", IMPARFAIT, PARTICIPLE_ROWS);
}
export function makeCe2TenseSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-imparfait-glisser", IMPARFAIT, TENSE_SORT_ROWS);
}
export function makeCe2StoryOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-imparfait-ordre", IMPARFAIT, STORY_ORDER_ROWS);
}
export function makeCe2ImparfaitWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-imparfait-ecrire", IMPARFAIT, IMPARFAIT_WRITE_ROWS);
}

// ===========================================================================
// L'IMPÉRATIF ET LE FUTUR SIMPLE (fr-ce2-imperatif-futur)
// ===========================================================================

const IMPERATIF = "l'impératif et le futur simple";

const IMPERATIF_GAP_HINTS = hints(
  "Un ordre s'adresse à une ou plusieurs personnes.",
  "Observe à qui l'on parle : à une personne ou à plusieurs.",
  "À l'impératif, on n'écrit pas le pronom devant le verbe.",
);
const imperatifGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, IMPERATIF_GAP_HINTS);
export const IMPERATIF_GAP_ROWS: readonly GapRow[] = [
  imperatifGap("Moussa, ___ ton cahier ! (prendre)", "prends", ["prenez", "prend"]),
  imperatifGap("Enfants, ___ votre leçon ! (finir)", "finissez", ["finis", "finissons"]),
  imperatifGap("Fatou, ___ ici ! (venir)", "viens", ["venez", "vient"]),
  imperatifGap("Les amis, ___ au marché ! (aller)", "allez", ["va", "vont"]),
  imperatifGap("Omar, ___ ton devoir ! (faire)", "fais", ["faites", "fait"]),
  imperatifGap("Les élèves, ___ silence ! (faire)", "faites", ["fais", "font"]),
  imperatifGap("Awa, ___ vite à la maison ! (aller)", "va", ["vas", "allez"]),
  imperatifGap("Mariama, ___ ton repas ! (finir)", "finis", ["finit", "finissez"]),
  imperatifGap("Les enfants, ___ avec moi ! (venir)", "venez", ["viens", "vient"]),
  imperatifGap("Fatou et Awa, ___ le riz ! (prendre)", "prenez", ["prends", "prend"]),
  imperatifGap("Cheikh, ___ attention ! (faire)", "fais", ["faites", "fait"]),
  imperatifGap("Aminata, ___ voir ma poupée ! (venir)", "viens", ["venez", "vient"]),
];

const FUTUR_GAP_HINTS = hints(
  "Demain ou bientôt annonce une action qui n'est pas encore faite.",
  "Le verbe change de forme : sa fin dit la personne.",
  "Choisis la forme qui parle de ce qui arrivera.",
);
const futurGap = (text: string, answer: string, wrong: readonly [string, string]): GapRow => gr(text, answer, wrong, FUTUR_GAP_HINTS);
export const FUTUR_GAP_ROWS: readonly GapRow[] = [
  futurGap("Demain, je ___ au marché. (aller)", "irai", ["iras", "vais"]),
  futurGap("Demain, nous ___ nos devoirs. (faire)", "ferons", ["ferez", "faisons"]),
  futurGap("Demain, tu ___ un lion. (voir)", "verras", ["verrai", "vois"]),
  futurGap("Ce soir, Moussa ___ chez nous. (venir)", "viendra", ["viendrai", "vient"]),
  futurGap("Demain, vous ___ en retard. (être)", "serez", ["serons", "êtes"]),
  futurGap("Dans une semaine, elles ___ en vacances. (partir)", "partiront", ["partira", "partent"]),
  futurGap("Demain, j'___ un cadeau. (avoir)", "aurai", ["auras", "ai"]),
  futurGap("Bientôt, tu ___ ton travail. (finir)", "finiras", ["finirai", "finis"]),
  futurGap("Demain, ils ___ au village. (aller)", "iront", ["irons", "vont"]),
  futurGap("Dimanche, nous ___ la fête. (voir)", "verrons", ["verrez", "voyons"]),
  futurGap("Demain, il ___ beau. (faire)", "fera", ["feras", "fait"]),
  futurGap("Cet été, vous ___ au village. (venir)", "viendrez", ["viendrons", "venez"]),
];

const IMPERATIF_CHOICE_HINTS = hints(
  "Un ordre ne se dit pas en nommant la personne devant le verbe.",
  "Les trois phrases parlent de la même action, mais une seule la demande.",
  "L'impératif donne un ordre ou un conseil.",
);
const IMPERATIF_PROMPT = "Dans quelle phrase le verbe est-il à l'impératif ?";
const imperatifChoice = (answer: string, wrong: readonly [string, string]): QuestionRow => qr(IMPERATIF_PROMPT, answer, wrong, IMPERATIF_CHOICE_HINTS);
export const IMPERATIF_CHOICE_ROWS: readonly QuestionRow[] = [
  imperatifChoice("Prends ton cahier !", ["Tu prends ton cahier.", "Tu prendras ton cahier."]),
  imperatifChoice("Viens ici !", ["Tu viens ici.", "Tu viendras ici."]),
  imperatifChoice("Finis ton riz !", ["Tu finis ton riz.", "Tu finiras ton riz."]),
  imperatifChoice("Va au puits !", ["Tu vas au puits.", "Tu iras au puits."]),
  imperatifChoice("Fais ton lit !", ["Tu fais ton lit.", "Tu feras ton lit."]),
  imperatifChoice("Venez à la fête !", ["Vous venez à la fête.", "Vous viendrez à la fête."]),
  imperatifChoice("Prenez vos cahiers !", ["Vous prenez vos cahiers.", "Vous prendrez vos cahiers."]),
  imperatifChoice("Finissez votre travail !", ["Vous finissez votre travail.", "Vous finirez votre travail."]),
  imperatifChoice("Allez au marché !", ["Vous allez au marché.", "Vous irez au marché."]),
  imperatifChoice("Faites silence !", ["Vous faites silence.", "Vous ferez silence."]),
  imperatifChoice("Prends cette mangue !", ["Elle prend cette mangue.", "Elle prendra cette mangue."]),
  imperatifChoice("Viens avec moi !", ["Il vient avec moi.", "Il viendra avec moi."]),
];

const FUTUR_CHOICE_HINTS = hints(
  "Cherche le petit mot qui donne le temps au début de la phrase.",
  "Un moment à venir annonce un verbe qui n'est pas encore arrivé.",
  "Les trois phrases racontent la même chose, mais à des moments différents.",
);
const FUTUR_PROMPT = "Dans quelle phrase le verbe est-il au futur ?";
const futurChoice = (answer: string, wrong: readonly [string, string]): QuestionRow => qr(FUTUR_PROMPT, answer, wrong, FUTUR_CHOICE_HINTS);
export const FUTUR_CHOICE_ROWS: readonly QuestionRow[] = [
  futurChoice("Demain, nous irons au marché.", ["Aujourd'hui, nous allons au marché.", "Hier, nous sommes allés au marché."]),
  futurChoice("Demain, Awa fera un gâteau.", ["Hier, Awa a fait un gâteau.", "Aujourd'hui, Awa fait un gâteau."]),
  futurChoice("Bientôt, tu verras ton oncle.", ["Hier, tu as vu ton oncle.", "Maintenant, tu vois ton oncle."]),
  futurChoice("Demain, ils viendront chez nous.", ["Hier, ils sont venus chez nous.", "Maintenant, ils viennent chez nous."]),
  futurChoice("Dimanche, je serai au village.", ["Hier, j'ai été au village.", "Maintenant, je suis au village."]),
  futurChoice("Demain, vous aurez un cadeau.", ["Hier, vous avez eu un cadeau.", "Maintenant, vous avez un cadeau."]),
  futurChoice("Ce soir, elles partiront en voyage.", ["Hier, elles sont parties en voyage.", "Maintenant, elles partent en voyage."]),
  futurChoice("Demain, Moussa finira son travail.", ["Hier, Moussa a fini son travail.", "Maintenant, Moussa finit son travail."]),
  futurChoice("Demain, je ferai mes devoirs.", ["Hier, j'ai fait mes devoirs.", "Maintenant, je fais mes devoirs."]),
  futurChoice("Dans une semaine, nous partirons.", ["Il y a une semaine, nous sommes partis.", "Maintenant, nous partons."]),
  futurChoice("Demain, tu iras à l'école.", ["Hier, tu es allé à l'école.", "Maintenant, tu vas à l'école."]),
  futurChoice("Bientôt, il aura dix ans.", ["Hier, il a eu dix ans.", "Maintenant, il a dix ans."]),
];

const IMPERATIF_TILES = ["prends", "finis", "viens", "fais", "va", "allez", "venez", "faites"] as const;
const FUTUR_TILES = ["je prendrai", "tu finiras", "il viendra", "nous ferons", "j'irai", "vous irez", "ils feront"] as const;
export const IMPERATIF_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque verbe dans la bonne case.",
  ["Impératif", "Futur"],
  IMPERATIF_TILES,
  FUTUR_TILES,
  hints("Un verbe sans pronom devant lui donne un ordre.", "Un verbe avec son pronom qui parle de demain annonce une action à venir.", "Dis « demain » devant chaque verbe pour entendre ce qui arrivera."),
  12,
);

const IMPERATIF_LINK_PAIRS = [ct("finir", "finis"), ct("prendre", "prends"), ct("faire", "fais"), ct("venir", "viens"), ct("aller", "va")] as const;
const FUTUR_LINK_PAIRS = [ct("faire", "ferai"), ct("être", "serai"), ct("avoir", "aurai"), ct("aller", "irai"), ct("voir", "verrai"), ct("venir", "viendrai")] as const;
const IMPERATIF_LINK_HINTS = hints("Dis l'ordre que tu donnerais à un ami avec ce verbe.", "Le verbe de l'ordre n'a pas de pronom devant lui.", "Commence par le verbe dont tu es le plus sûr.");
const FUTUR_LINK_HINTS = hints("Dis « demain, je » devant chaque verbe.", "Pour plusieurs verbes, le radical change avant la terminaison.", "Commence par le verbe dont tu es le plus sûr.");
export const IMPERATIF_LINK_ROWS: readonly LinkRow[] = [
  ...combinations(IMPERATIF_LINK_PAIRS, 3)
    .slice(0, 6)
    .map((pairs) => ({ prompt: "Relie chaque verbe à son impératif avec tu.", pairs, hints: IMPERATIF_LINK_HINTS })),
  ...combinations(FUTUR_LINK_PAIRS, 3)
    .filter((_, i) => i % 3 === 0)
    .slice(0, 6)
    .map((pairs) => ({ prompt: "Relie chaque verbe à son futur avec je.", pairs, hints: FUTUR_LINK_HINTS })),
];

const RECIPE_HINTS = hints(
  "Cherche le mot qui ouvre la suite.",
  "Chaque phrase s'ouvre par un mot qui dit sa place.",
  "Le mot de la dernière phrase annonce la fin.",
);
const recipe = (first: string, second: string, third: string): OrderRow => ordr("Mets ces ordres dans l'ordre du temps.", [first, second, third], RECIPE_HINTS);
export const RECIPE_ORDER_ROWS: readonly OrderRow[] = [
  recipe("D'abord, prends une feuille.", "Ensuite, fais un pli au milieu.", "Enfin, finis ton dessin avec des couleurs."),
  recipe("D'abord, prends une casserole.", "Ensuite, fais bouillir l'eau.", "Enfin, mets le riz."),
  recipe("D'abord, prends ton cartable.", "Ensuite, viens à l'école.", "Enfin, va en classe."),
  recipe("D'abord, finis ton repas.", "Ensuite, lave ton assiette.", "Enfin, range-la."),
  recipe("D'abord, fais ton lit.", "Ensuite, prends ton petit déjeuner.", "Enfin, va à l'école."),
  recipe("D'abord, prends la corde.", "Ensuite, fais-la tourner.", "Enfin, saute."),
  recipe("D'abord, viens près du puits.", "Ensuite, prends le seau.", "Enfin, remplis-le d'eau."),
  recipe("D'abord, fais un trou.", "Ensuite, prends une graine.", "Enfin, mets-la dans le trou."),
  recipe("D'abord, finis tes devoirs.", "Ensuite, va jouer.", "Enfin, reviens avant la nuit."),
  recipe("D'abord, prends un crayon.", "Ensuite, fais un dessin.", "Enfin, finis-le avec des couleurs."),
  recipe("D'abord, viens au marché.", "Ensuite, prends du poisson.", "Enfin, va payer."),
  recipe("D'abord, fais la queue.", "Ensuite, prends ton billet.", "Enfin, va au bateau."),
];

const IMPERATIF_WRITE_HINTS = hints("Pense à qui l'on parle : une personne ou plusieurs.", "À l'impératif, on n'écrit pas le pronom.", "Écris seulement le verbe.");
const FUTUR_WRITE_HINTS = hints("Pense à la personne de la phrase.", "Le verbe change de forme : sa fin dit la personne.", "Écris seulement le verbe.");
const imperatifWrite = (verb: string, person: string, answer: string): WriteRow => wr(`Écris le verbe ${verb} à l'impératif avec ${person}.`, [answer], IMPERATIF_WRITE_HINTS);
const futurWrite = (verb: string, person: string, answer: string): WriteRow => wr(`Écris le verbe ${verb} au futur avec ${person}.`, [answer], FUTUR_WRITE_HINTS);
export const IMPERATIF_WRITE_ROWS: readonly WriteRow[] = [
  imperatifWrite("venir", "tu", "viens"),
  imperatifWrite("prendre", "vous", "prenez"),
  imperatifWrite("faire", "tu", "fais"),
  imperatifWrite("finir", "vous", "finissez"),
  imperatifWrite("aller", "tu", "va"),
  imperatifWrite("aller", "vous", "allez"),
  futurWrite("aller", "je", "irai"),
  futurWrite("faire", "nous", "ferons"),
  futurWrite("voir", "tu", "verras"),
  futurWrite("venir", "il", "viendra"),
  futurWrite("être", "vous", "serez"),
  futurWrite("avoir", "ils", "auront"),
];

export function makeCe2ImperatifGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-imperatif-forme", IMPERATIF, IMPERATIF_GAP_ROWS, 2);
}
/** L'énoncé nomme le temps : « Demain, je vais au marché » (présent à valeur de futur) est juste, et un mauvais choix est au présent. */
export const FUTUR_GAP_PROMPT = "Complète la phrase avec le verbe au futur.";
export function makeCe2FuturGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-futur-forme", IMPERATIF, FUTUR_GAP_ROWS, 2, 0, FUTUR_GAP_PROMPT);
}
export function makeCe2ImperatifChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-imperatif-choisir", IMPERATIF, IMPERATIF_CHOICE_ROWS, 1, (row) => row.answer);
}
export function makeCe2FuturChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-futur-choisir", IMPERATIF, FUTUR_CHOICE_ROWS, 1, (row) => row.answer);
}
export function makeCe2ImperatifSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-imperatif-glisser", IMPERATIF, IMPERATIF_SORT_ROWS);
}
export function makeCe2ImperatifLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-imperatif-relier", IMPERATIF, IMPERATIF_LINK_ROWS);
}
export function makeCe2RecipeOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-imperatif-ordre", IMPERATIF, RECIPE_ORDER_ROWS);
}
export function makeCe2ImperatifWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-imperatif-ecrire", IMPERATIF, IMPERATIF_WRITE_ROWS);
}
