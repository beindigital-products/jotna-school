/**
 * LES GABARITS DU TEXTE QUI ARGUMENTE ET DU DÉBAT DU CM2 (`fr-cm2-argumenter`).
 *
 * La fiche demande de distinguer un fait d'une opinion, de trouver l'argument qui défend une idée, les mots de liaison de l'argumentation (d'abord, de plus, enfin, cependant, au
 * contraire) et les règles d'un débat respectueux. Ici chaque exercice est BÂTI à partir de tableaux fermés : seize faits et seize opinions, huit idées avec trois arguments pour et trois
 * contre, seize règles de débat, jamais écrits par le modèle.
 *
 * LES PIÈGES DU FRANÇAIS QUE CE FICHIER ÉVITE
 * - Un fait se vérifie (« Une semaine compte sept jours ») ; une opinion dit ce que quelqu'un pense ou aime, avec un mot qui juge (« délicieux », « ennuyeux », « le plus beau »).
 *   Aucune phrase du tableau ne se range dans les deux : on n'y met ni goût caché dans un fait, ni chiffre caché dans une opinion.
 * - Un argument qui défend une idée est une raison qui va dans son sens ; les mauvais choix sont les raisons qui vont contre. Ils ne sont jamais hors sujet : l'enfant doit lire le sens.
 * - Le mot de liaison manquant d'une liste d'arguments est celui que le texte n'emploie pas : les deux autres s'y lisent déjà, donc un seul va. « Cependant » et « au contraire »
 *   ne se posent pas dans le trou, parce qu'ils se lisent presque partout ; ils sont demandés à part, dans une question sur leur rôle.
 * - Un énoncé n'a qu'une apostrophe droite au plus : les idées et les arguments à lire dans un texte n'en ont aucune, il ne reste que « d'abord ».
 *
 * HORS FICHE, À FAIRE RELIRE : les seize faits et les seize opinions, les huit idées (lire, le sport, les arbres, l'uniforme, les fruits, nettoyer la cour, les écrans, l'eau) et leurs arguments,
 * « ensuite » et « pourtant » comme mots de liaison, les seize règles du débat.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, wr, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

const CONCEPT = "distinguer un fait d'une opinion, défendre une idée avec des arguments, débattre";
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// ===========================================================================
// LES FAITS ET LES OPINIONS
// ===========================================================================

export const FACTS: readonly string[] = [
  "Une semaine compte sept jours.",
  "Le Sénégal a pour capitale Dakar.",
  "Un triangle a trois côtés.",
  "Le riz est une céréale.",
  "La Terre tourne autour du soleil.",
  "Un kilomètre fait mille mètres.",
  "Le français est la langue officielle du Sénégal.",
  "Le cheval est un mammifère.",
  "Les poissons respirent grâce à leurs branchies.",
  "Le fleuve Sénégal se jette dans l'océan Atlantique.",
  "Le baobab est un arbre.",
  "Une année compte douze mois.",
  "Le Sahara est un désert.",
  "Le sel se dissout dans l'eau.",
  "Le lion est un animal sauvage.",
  "L'eau bout à cent degrés.",
];
export const OPINIONS: readonly string[] = [
  "Le riz au poisson est le plat le plus délicieux.",
  "Le football est plus amusant que le basket.",
  "Les devoirs sont ennuyeux.",
  "Le bleu est la plus jolie couleur.",
  "Les vacances sont trop courtes.",
  "Lire est le meilleur des loisirs.",
  "Les chats sont plus gentils que les chiens.",
  "Cette chanson est magnifique.",
  "Le français est une langue difficile.",
  "Les mathématiques sont passionnantes.",
  "Le lion est le plus bel animal.",
  "La musique est plus belle le soir.",
  "Le baobab est l'arbre le plus impressionnant.",
  "Il vaut mieux vivre à la campagne qu'en ville.",
  "L'école devrait commencer plus tard.",
  "Il est mal de se coucher tard.",
];

/** Les deux phrases de `pool` dont la longueur est la plus proche de `target`, en tournant parmi les quatre plus proches : la bonne réponse ne se devine pas à sa longueur. */
function similar(pool: readonly string[], target: string, index: number): [string, string] {
  const ranked = [...pool].sort((a, b) => Math.abs(a.length - target.length) - Math.abs(b.length - target.length) || a.localeCompare(b)).slice(0, 4);
  return [cycle(ranked, index), cycle(ranked, index + 1)];
}

const NATURE_HINTS_FACT = hints("On peut contrôler ce genre de phrase avec un livre ou une mesure.", "Cherche la phrase que tout le monde peut vérifier.", "Une phrase qui dit ce que l'on aime ne se contrôle pas.");
const NATURE_HINTS_OPINION = hints("Une opinion dit ce que quelqu'un pense ou aime.", "Cherche la phrase qui juge ce qui est beau, bon ou agréable.", "Une phrase que l'on peut vérifier n'est pas une opinion.");

/** Une phrase de la bonne sorte et deux de l'autre, les rangs qui changent d'une ligne à l'autre. */
export const NATURE_ROWS: readonly QuestionRow[] = Array.from({ length: 32 }, (_, index) => {
  const fact = index % 2 === 0;
  const own = fact ? FACTS : OPINIONS;
  const other = fact ? OPINIONS : FACTS;
  const at = Math.floor(index / 2);
  const answer = cycle(own, at * 3 + 1);
  return qr(
    fact ? "Laquelle de ces phrases est un fait ?" : "Laquelle de ces phrases est une opinion ?",
    answer,
    similar(other, answer, at),
    fact ? NATURE_HINTS_FACT : NATURE_HINTS_OPINION,
    `arg:nature:${fact ? "fait" : "opinion"}:${at}`,
  );
});
export function makeCm2ArgNature(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-arg-nature", CONCEPT, NATURE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

const SORT_HINTS = hints("On peut contrôler une phrase de ce genre.", "L'autre genre de phrase dit ce que l'on pense, ce que l'on aime.", "Cherche le mot qui juge ce qui est beau, bon ou agréable.");
const SORT_ZONES = ["Fait", "Opinion"] as const;
export const SORT_ROWS: readonly SortRow[] = Array.from({ length: 30 }, (_, index) => ({
  prompt: "Glisse chaque phrase dans la bonne case.",
  zones: [SORT_ZONES[0], SORT_ZONES[1]] as const,
  items: [
    { text: cycle(FACTS, index * 3), zone: SORT_ZONES[0] },
    { text: cycle(FACTS, index * 3 + 5), zone: SORT_ZONES[0] },
    { text: cycle(OPINIONS, index * 2 + 1), zone: SORT_ZONES[1] },
    { text: cycle(OPINIONS, index * 2 + 6), zone: SORT_ZONES[1] },
  ],
  hints: SORT_HINTS,
  fact: `arg:glisser:${index}`,
}));
export function makeCm2ArgSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm2-arg-glisser", CONCEPT, SORT_ROWS);
}

// ===========================================================================
// LES IDÉES, LEURS ARGUMENTS POUR ET CONTRE
// ===========================================================================

export type Thesis = { idea: string; pro: readonly [string, string, string]; con: readonly [string, string, string] };
export const THESES: readonly Thesis[] = [
  {
    idea: "Il faut lire tous les jours.",
    pro: ["Lire apprend de nouveaux mots.", "Lire aide à mieux écrire.", "Lire permet de voyager sans quitter sa chambre."],
    con: ["Lire fatigue les yeux le soir.", "Certains livres coûtent très cher.", "On peut apprendre autrement, avec la radio."],
  },
  {
    idea: "Les enfants doivent faire du sport.",
    pro: ["Le sport rend le corps fort.", "Le sport apprend à jouer en équipe.", "Le sport aide à mieux dormir."],
    con: ["Le sport peut blesser quand on tombe.", "Les terrains sont parfois trop loin.", "Certains enfants préfèrent se reposer."],
  },
  {
    idea: "Il faut planter des arbres.",
    pro: ["Les arbres donnent de la fraîcheur.", "Les arbres retiennent la terre.", "Les arbres abritent les oiseaux."],
    con: ["Un arbre demande beaucoup d'eau.", "Planter coûte du temps et de l'argent.", "Les racines abîment parfois les murs."],
  },
  {
    idea: "On doit porter un uniforme en classe.",
    pro: ["Tous les élèves sont habillés pareil.", "Les parents dépensent moins en vêtements.", "On reconnaît vite les élèves de la même école."],
    con: ["Chacun veut montrer son style.", "Un uniforme peut être trop chaud.", "Les enfants grandissent vite."],
  },
  {
    idea: "Il faut manger des fruits chaque jour.",
    pro: ["Les fruits donnent des vitamines.", "Les fruits donnent de la force.", "Les fruits sont bons et pas chers au marché."],
    con: ["Certains fruits sont chers hors saison.", "Les fruits se gâtent vite sous la chaleur.", "Un fruit ne suffit pas à faire un repas."],
  },
  {
    idea: "Les élèves devraient aider à nettoyer la cour.",
    pro: ["Chacun apprend à respecter les lieux.", "Le travail est vite fini à plusieurs.", "La cour reste propre pour tous."],
    con: ["Les élèves perdent du temps de classe.", "Le nettoyage est un travail pour des adultes.", "Des élèves peuvent se blesser avec le matériel."],
  },
  {
    idea: "Il faut limiter les écrans.",
    pro: ["Regarder trop longtemps fatigue les yeux.", "Les écrans prennent le temps des devoirs.", "Jouer dehors est meilleur pour le corps."],
    con: ["Les écrans permettent d'apprendre des choses.", "Un écran aide à parler à la famille éloignée.", "Un film peut se regarder en famille."],
  },
  {
    idea: "On doit économiser notre eau.",
    pro: ["Les villages manquent souvent de bonne eau.", "Chaque goutte coûte du travail pour la puiser.", "Un robinet qui coule gaspille des litres."],
    con: ["Il faut aussi se laver pour rester en bonne santé.", "Les plantes ont besoin de beaucoup d'eau.", "Boire peu est mauvais pour le corps."],
  },
];

const PRO_HINTS = hints("Un argument est une raison qui soutient l'idée.", "Pose-toi la question : cette raison donne-t-elle envie de croire l'idée ?", "Élimine les raisons qui vont contre l'idée.");
const CON_HINTS = hints("Un argument contre est une raison qui s'oppose à l'idée.", "Pose-toi la question : cette raison donne-t-elle tort à l'idée ?", "Élimine les raisons qui soutiennent l'idée.");

export const PRO_ROWS: readonly QuestionRow[] = THESES.flatMap((thesis, index) =>
  [0, 1, 2].map((n) => qr(`Quel argument défend cette idée « ${thesis.idea} » ?`, thesis.pro[n], [thesis.con[n], thesis.con[(n + 1) % 3]], PRO_HINTS, `arg:${index}:pour${n}`)),
);
export function makeCm2ArgFor(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-arg-argument", CONCEPT, PRO_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

export const CON_ROWS: readonly QuestionRow[] = THESES.flatMap((thesis, index) =>
  [0, 1, 2].map((n) => qr(`Quel argument va contre cette idée « ${thesis.idea} » ?`, thesis.con[n], [thesis.pro[n], thesis.pro[(n + 1) % 3]], CON_HINTS, `arg:${index}:contre${n}`)),
);
export function makeCm2ArgAgainst(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-arg-contre", CONCEPT, CON_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

const LINK_HINTS = hints("Une idée se défend avec une raison qui va dans son sens.", "Cherche le thème que l'idée et la raison ont en commun.", "Commence par la paire dont tu es sûr.");
export const LINK_ROWS: readonly LinkRow[] = THESES.map((_, index) => {
  const picked = [index, (index + 3) % THESES.length, (index + 5) % THESES.length];
  return {
    prompt: "Relie chaque idée à l'argument qui la défend.",
    pairs: picked.map((at, n) => ({ left: THESES[at].idea, right: THESES[at].pro[(index + n) % 3] })),
    hints: LINK_HINTS,
    fact: `arg:relier:${picked.join(",")}`,
  };
});
export function makeCm2ArgLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm2-arg-relier", CONCEPT, LINK_ROWS);
}

// ===========================================================================
// UN TEXTE QUI ARGUMENTE : l'idée, puis « d'abord », « de plus », « enfin »
// ===========================================================================

const FIRST = "D'abord";
const SECOND = "De plus";
const LAST = "Enfin";
const ORDERING = [FIRST, SECOND, LAST] as const;
/** Une idée et trois arguments, avec les trois mots de liaison. L'énoncé n'a que l'apostrophe de « d'abord ». */
const argumentText = (thesis: Thesis, blank: number | null) =>
  [thesis.idea, ...ORDERING.map((word, n) => `${n === blank ? "___" : word}, ${lowerFirst(thesis.pro[n])}`)].join(" ");

const TROU_HINTS = hints("Lis les trois arguments dans l'ordre.", "Chaque mot de liaison ne sert qu'une seule fois dans le texte.", "Le premier argument commence, le dernier conclut.");
export const GAP_ROWS: readonly GapRow[] = THESES.flatMap((thesis, index) =>
  [0, 1, 2].map((blank) => {
    const wrong = ORDERING.filter((word) => word !== ORDERING[blank]);
    return gr(argumentText(thesis, blank), ORDERING[blank], [wrong[0], wrong[1]], TROU_HINTS, `arg:${index}:trou${blank}`);
  }),
);
export function makeCm2ArgGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm2-arg-trou", CONCEPT, GAP_ROWS, 1, 0, "Complète le texte avec le bon mot de liaison.");
}

const ORDER_HINTS = hints("Le premier argument commence par le mot qui ouvre la liste.", "Le mot de liaison du milieu ajoute une raison.", "Le mot de liaison qui conclut vient en dernier.");
export const ORDER_ROWS: readonly OrderRow[] = THESES.map((thesis, index) =>
  ordr(
    `Voici une idée à défendre. ${thesis.idea} Remets les trois arguments dans le bon ordre, selon les mots de liaison.`,
    ORDERING.map((word, n) => `${word}, ${lowerFirst(thesis.pro[(index + n) % 3])}`),
    ORDER_HINTS,
    `arg:ordre:${index}`,
  ),
);
export function makeCm2ArgOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "cm2-arg-ordre", CONCEPT, ORDER_ROWS);
}

const COUNT_HINTS = hints("Cherche les mots de liaison qui ouvrent chaque phrase.", "Chaque raison commence par un mot de liaison.", "Compte les raisons, pas l'idée de départ.");
/** Deux ou trois arguments : le texte s'arrête au deuxième ou au troisième. */
export const COUNT_ROWS: readonly WriteRow[] = THESES.flatMap((thesis, index) =>
  [2, 3].map((count) => {
    const words = count === 2 ? [FIRST, LAST] : ORDERING;
    const text = [thesis.idea, ...words.map((word, n) => `${word}, ${lowerFirst(thesis.pro[n])}`)].join(" ");
    return wr(`${text} Combien de raisons ce texte donne-t-il ?`, [String(count), count === 2 ? "deux" : "trois"], COUNT_HINTS, `arg:${index}:compte${count}`);
  }),
);
export function makeCm2ArgCount(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm2-arg-compter", CONCEPT, COUNT_ROWS);
}

// ===========================================================================
// LE RÔLE DES MOTS DE LIAISON
// ===========================================================================

const ROLE_HINTS = hints("Pense à ce que le mot fait dans un texte.", "Certains mots ouvrent, d'autres ajoutent, d'autres concluent, d'autres opposent.", "Élimine les mots qui ont un autre rôle.");
type Role = { prompt: string; answer: string; wrong: readonly string[] };
const ROLES: readonly Role[] = [
  { prompt: "Quel mot de liaison annonce le premier argument ?", answer: "D'abord", wrong: ["Enfin", "Cependant", "Au contraire", "De plus"] },
  { prompt: "Quel mot de liaison ajoute un argument ?", answer: "De plus", wrong: ["Cependant", "Au contraire", "Pourtant"] },
  { prompt: "Quel mot de liaison annonce le dernier argument ?", answer: "Enfin", wrong: ["D'abord", "Cependant", "Au contraire"] },
  { prompt: "Quel mot de liaison oppose deux idées ?", answer: "Cependant", wrong: ["D'abord", "De plus", "Enfin"] },
  { prompt: "Quel mot de liaison dit le contraire de ce qui vient d'être dit ?", answer: "Au contraire", wrong: ["D'abord", "De plus", "Enfin"] },
  { prompt: "Quel mot de liaison oppose deux idées ?", answer: "Pourtant", wrong: ["D'abord", "Ensuite", "Enfin"] },
  { prompt: "Quel mot de liaison ajoute un argument ?", answer: "Ensuite", wrong: ["Pourtant", "Au contraire", "Cependant"] },
];
/** Chaque rôle revient avec deux paires de mauvais choix, pour que les enfants lisent le rôle et ne retiennent pas la place d'un mot. */
export const ROLE_ROWS: readonly QuestionRow[] = ROLES.flatMap((role, index) =>
  [0, 1].map((n) => qr(role.prompt, role.answer, [role.wrong[n % role.wrong.length], role.wrong[(n + 1 + (role.wrong.length > 3 ? 1 : 0)) % role.wrong.length]], ROLE_HINTS, `arg:role:${index}:${n}`)),
);
export function makeCm2ArgRole(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-arg-liaison", CONCEPT, ROLE_ROWS, 1, (row) => `${row.prompt}|${row.answer}|${row.wrong.join(",")}`);
}

// ===========================================================================
// LES RÈGLES D'UN DÉBAT RESPECTUEUX
// ===========================================================================

export const GOOD_RULES: readonly string[] = [
  "Écouter l'autre jusqu'au bout",
  "Lever la main pour demander la parole",
  "Donner une raison pour son avis",
  "Parler calmement",
  "Respecter le temps de parole",
  "Accepter que l'on ne pense pas pareil",
  "Répéter ce que l'autre a dit avant de répondre",
  "Remercier l'autre à la fin",
];
export const BAD_RULES: readonly string[] = [
  "Couper la parole",
  "Crier plus fort que les autres",
  "Se moquer de l'avis de l'autre",
  "Insulter l'autre",
  "Parler sans arrêt sans laisser les autres",
  "Refuser d'écouter",
  "Dire que l'autre a tort sans raison",
  "Se fâcher et quitter la salle",
];
const DO_HINTS = hints("Dans un débat, on cherche à comprendre celui qui parle.", "Une bonne règle montre du respect.", "Élimine ce qui blesse ou coupe la discussion.");
const DONT_HINTS = hints("Dans un débat, on cherche à comprendre celui qui parle.", "Une mauvaise conduite blesse ou coupe la discussion.", "Élimine ce qui montre du respect.");
export const DEBATE_ROWS: readonly QuestionRow[] = [
  ...GOOD_RULES.map((rule, index) => qr("Dans un débat respectueux, que doit-on faire ?", rule, similar(BAD_RULES, rule, index), DO_HINTS, `arg:debat:bien${index}`)),
  ...BAD_RULES.map((rule, index) => qr("Dans un débat respectueux, que ne faut-il pas faire ?", rule, similar(GOOD_RULES, rule, index), DONT_HINTS, `arg:debat:mal${index}`)),
];
export function makeCm2ArgDebate(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm2-arg-debat", CONCEPT, DEBATE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}
