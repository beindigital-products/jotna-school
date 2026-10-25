/**
 * LES GABARITS DE L'HISTOIRE DU CE1 : le temps qui passe, l'histoire de la famille, de l'école et du quartier
 * (`hi-ce1-temps`, `hi-ce1-famille`, `hi-ce1-ecole`, `hi-ce1-quartier`).
 *
 * Sur l'échantillon de CE1, le modèle écrivait des exercices faux dans un cas sur deux en histoire : « Quel est le nom de ton
 * quartier ? » (aucune réponse possible), « Le maire de notre commune s'appelle ___ » (Cheikh, Ibrahima ou Penda), « Mets ces
 * événements dans l'ordre : création du marché, élection du maire, construction de l'école » (aucun ordre n'est le bon), « Qui
 * sont les grands-parents d'Aminata ? Les parents d'Aminata ». Ici la réponse se calcule ou se lit dans ce que l'énoncé montre :
 * des années écrites dans l'énoncé, une famille dont les liens sont fixés, des définitions que la fiche donne.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Le temps : la ligne du temps, les générations (grands-parents, parents, enfants), autrefois et aujourd'hui. Les dates des
 *   chronologies sont INVENTÉES par le gabarit et ÉCRITES dans l'énoncé : on y lit la réponse, on n'a besoin de rien savoir de
 *   l'histoire du village. « Autrefois » ne range que des couples (une chose plus ancienne et celle qui l'a remplacée pour le même
 *   besoin) : jamais deux choses de besoins différents.
 * - La famille : l'arbre généalogique (grand-père, grand-mère, oncle, tante, cousin), les objets et les souvenirs de famille. Les
 *   liens (le frère de ma mère est mon oncle) ne se discutent pas.
 * - L'école : les anciens élèves, les photos, les registres (la fiche), plus l'ancien instituteur et le vieux cahier. Ce qui a
 *   changé depuis la construction est dit par une chronologie écrite dans l'énoncé, jamais par un fait propre à une école.
 * - Le quartier : le fondateur, le maire, la mairie, les monuments, la commune. « L'origine du nom » d'un village est un fait
 *   propre à chaque village : aucun gabarit n'en parle.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom SEUL, avec sa majuscule, sans article (« Mairie », « Photo ancienne »).
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe droite, vingt-huit mots
 *   au plus. Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { MONTHS } from "./calendrier";
import { cap, drawDated, drawYears, FEMININE_NAMES, joinFrench, MASCULINE_NAMES, SCHOOL_EVENTS, sentenceOf, VILLAGE_EVENTS, windowFor, type ChronoEvent } from "./ce1Outils";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame, type Hints } from "./tableaux";

// ===========================================================================
// LE TEMPS QUI PASSE (hi-ce1-temps)
// ===========================================================================

/** Les familles à ranger par génération : trois personnes aux premiers paliers, quatre aux derniers. */
const GENERATIONS: readonly { young: readonly string[]; down: boolean }[] = [
  { young: ["Enfant", "Père", "Grand-père"], down: false },
  { young: ["Fille", "Mère", "Grand-mère"], down: true },
  { young: ["Petit-fils", "Père", "Grand-père"], down: false },
  { young: ["Petite-fille", "Mère", "Grand-mère"], down: true },
  { young: ["Petit-fils", "Père", "Grand-père", "Arrière-grand-père"], down: false },
  { young: ["Petite-fille", "Mère", "Grand-mère", "Arrière-grand-mère"], down: true },
  { young: ["Fils", "Père", "Grand-père", "Arrière-grand-père"], down: true },
  { young: ["Fille", "Mère", "Grand-mère", "Arrière-grand-mère"], down: false },
];

/** « Mets ces personnes d'une même famille de la plus jeune à la plus âgée. » : les générations, dans un sens ou dans l'autre. */
export function makeCe1GenerationOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-generation-ordre", "ranger les générations d'une famille", () => {
    const entry = pickFresh(ctx, windowFor(GENERATIONS, ctx.level, 1), (candidate) => `ce1-generation-ordre:${candidate.young.join("")}`);
    const sequence = entry.down ? [...entry.young].reverse() : [...entry.young];
    return {
      prompt: `Mets ces personnes d'une même famille ${entry.down ? "de la plus âgée à la plus jeune" : "de la plus jeune à la plus âgée"}.`,
      sequence,
      hints: [
        "Pense à l'âge de chacune de ces personnes.",
        entry.down ? "Commence par celle qui est née il y a le plus longtemps." : "Commence par celle qui est née il y a le moins longtemps.",
        entry.down ? "Termine par celle qui est née il y a le moins longtemps." : "Termine par celle qui est née il y a le plus longtemps.",
      ],
    };
  });
}

/** « Moussa est né en 1950, Cheikh en 1985 et Modou en 2015. Qui est né en premier ? » : l'année la plus petite, ou la plus grande. */
export function makeCe1BornFirst(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-naissance", "lire des années de naissance", () => {
    const feminine = ctx.rng() < 0.5;
    const names = shuffle(ctx.rng, feminine ? FEMININE_NAMES : MASCULINE_NAMES).slice(0, 3);
    const years = shuffle(ctx.rng, drawYears(ctx, 3));
    const first = ctx.rng() < 0.5;
    const born = feminine ? "née" : "né";
    const list = names.map((name, i) => (i === 0 ? `${name} est ${born} en ${years[0]}` : `${name} en ${years[i]}`));
    const target = first ? Math.min(...years) : Math.max(...years);
    const answer = names[years.indexOf(target)];
    const rank = first ? "premier" : "dernier";
    return {
      prompt: `${joinFrench(list)}. Qui est ${born} en ${rank} ?`,
      answer,
      wrong: names.filter((name) => name !== answer),
      hints: [
        "Lis les trois années, une à une.",
        first ? "La personne arrivée le plus tôt a l'année la plus petite." : "La personne arrivée le plus tard a l'année la plus grande.",
        "Compare les nombres en regardant d'abord le chiffre des milliers, puis celui des centaines.",
      ],
    };
  });
}

/** « Le marché ouvre en 1980, la mairie est bâtie en 1950 et le puits est creusé en 2000. Mets-les du plus ancien au plus récent. » */
export function makeCe1ChronoOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-ligne-ordre", "ranger des événements datés", () => {
    const { chronological, shown } = drawDated(ctx, VILLAGE_EVENTS, 3);
    return {
      prompt: `${sentenceOf(shown)} Mets-les du plus ancien au plus récent.`,
      sequence: chronological.map((entry) => entry.event.tile),
      hints: [
        "Lis les trois années, une à une.",
        "Le plus ancien est celui dont l'année est la plus petite.",
        "Place ensuite celui dont l'année est juste après, puis le dernier.",
      ],
    };
  });
}

/** « Le puits est creusé en 1950 et la mairie est bâtie en 1985. Combien d'années passent entre ces deux dates ? Écris le nombre. » */
export function makeCe1ChronoGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-ligne-ecart", () => {
    const { chronological, shown } = drawDated(ctx, VILLAGE_EVENTS, 2);
    const gap = chronological[1].year - chronological[0].year;
    return {
      type: "short-answer",
      prompt: `${sentenceOf(shown)} Combien d'années passent entre ces deux dates ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(gap)], game: originOf("ce1-ligne-ecart", ctx), concept: "calculer le temps qui passe entre deux dates" },
      answerKey: String(gap),
      hints: [
        "Repère la date la plus ancienne et la date la plus récente.",
        "Pour savoir combien d'années passent, retire la petite date de la grande.",
        "Calcule avec une soustraction, en comptant par dizaines si tu veux.",
      ],
    };
  });
}

/** Combien de mois on avance ou on recule au plus, selon le niveau. */
const SHIFT_MAX = { 1: 2, 2: 3, 3: 4, 4: 6 } as const;
const SHIFT_WORDS = ["", "un", "deux", "trois", "quatre", "cinq", "six"] as const;

/** « Nous sommes en novembre. Quel mois sera dans trois mois ? » : le mois d'après ou d'avant, d'une année à l'autre. */
export function makeCe1MonthShift(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mois-decalage", "avancer ou reculer de quelques mois", () => {
    const start = randomInt(ctx.rng, 0, 11);
    const size = randomInt(ctx.rng, ctx.level === 1 ? 1 : 2, SHIFT_MAX[ctx.level]);
    const forward = ctx.rng() < 0.5;
    const target = (start + (forward ? size : -size) + 12) % 12;
    const question = forward ? `Quel mois sera dans ${SHIFT_WORDS[size]} mois ?` : `Quel mois était il y a ${SHIFT_WORDS[size]} mois ?`;
    return {
      prompt: `Nous sommes en ${MONTHS[start]}. ${question}`,
      answer: MONTHS[target],
      wrong: [MONTHS[(target + 1) % 12], MONTHS[(target + 11) % 12]],
      hints: [
        "Récite les mois de l'année dans l'ordre.",
        forward ? "Pars du mois de la phrase et avance d'un mois à la fois." : "Pars du mois de la phrase et recule d'un mois à la fois.",
        "Compte chaque mois avec tes doigts, un par un.",
      ],
    };
  });
}

/** Les phrases à trou sur les générations : tout ce que la fiche dit des grands-parents, des parents et des enfants. */
const GENERATION_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hints: Hints }[] = [
  {
    text: "Les parents de mes parents sont mes ___.",
    answer: "grands-parents",
    wrong: ["oncles", "cousins"],
    hints: ["Pense à deux générations avant la tienne.", "Ce sont les personnes les plus âgées de ta famille proche.", "Elles ont élevé les adultes de ta maison quand ils étaient petits."],
  },
  {
    text: "Les enfants de mes enfants seront mes ___.",
    answer: "petits-enfants",
    wrong: ["cousins", "neveux"],
    hints: ["Pense à deux générations après la tienne.", "Quand tu seras âgé, ils seront les plus jeunes de ta famille.", "Ils ne sont pas encore nés."],
  },
  {
    text: "Mes grands-parents sont plus ___ que mes parents.",
    answer: "âgés",
    wrong: ["jeunes", "petits"],
    hints: ["Compare le nombre d'années vécues.", "Ils sont nés avant tes parents.", "Ils ont vécu plus longtemps."],
  },
  {
    text: "Un enfant est plus ___ que ses parents.",
    answer: "jeune",
    wrong: ["âgé", "ancien"],
    hints: ["Compare le nombre d'années vécues.", "Il est né après eux.", "Il a moins d'années qu'eux."],
  },
  {
    text: "Mon arrière-grand-mère est la mère de ma ___.",
    answer: "grand-mère",
    wrong: ["tante", "cousine"],
    hints: ["Pense à trois générations avant la tienne.", "C'est la génération qui vient juste avant celle de tes parents.", "Cette personne a elle-même des enfants et des petits-enfants."],
  },
  {
    text: "Mes parents sont plus ___ que mes grands-parents.",
    answer: "jeunes",
    wrong: ["âgés", "anciens"],
    hints: ["Compare le nombre d'années vécues.", "Ils sont nés après eux.", "Ils ont moins d'années qu'eux."],
  },
];

/** « Les parents de mes parents sont mes ___. » : un mot de la famille ou de l'âge, parmi trois. */
export function makeCe1GenerationGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-generation-trou", "les générations d'une famille", () => {
    const entry = pickFresh(ctx, windowFor(GENERATION_GAPS, ctx.level, 1), (candidate) => `ce1-generation-trou:${candidate.text}`);
    return { prompt: "Complète la phrase.", text: entry.text, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/**
 * AUTREFOIS ET AUJOURD'HUI : pour un même besoin, une chose plus ancienne et celle qui l'a remplacée. La fiche ne donne aucun couple :
 * ceux-ci sont les exemples d'école d'un enfant de CE1 (la lampe à pétrole et l'électricité, la lettre et le téléphone, la charrette
 * et la voiture, le feu de bois et le gaz, le puits et le robinet). Le gabarit ne compare JAMAIS deux choses de besoins différents.
 */
type Need = {
  need: string;
  then: string;
  now: string;
  thenText: string;
  nowText: string;
  thenHints: readonly [string, string];
  nowHints: readonly [string, string];
  /** Les AUTRES besoins que la chose d'autrefois sert aussi (un feu de bois éclaire) : elle n'est jamais un mauvais choix pour eux. */
  thenAlso?: readonly string[];
  /** Les AUTRES besoins que la chose d'aujourd'hui sert aussi (un téléphone portable éclaire) : jamais un mauvais choix pour eux. */
  nowAlso?: readonly string[];
};

export const NEEDS: readonly Need[] = [
  {
    need: "avoir de la lumière",
    then: "Lampe à pétrole",
    now: "Lampe électrique",
    thenText: "une lampe à pétrole",
    nowText: "une lampe électrique",
    thenHints: ["On la remplissait de liquide, puis on l'allumait avec une flamme.", "Elle donnait une lumière jaune et vacillante."],
    nowHints: ["Elle fonctionne avec le courant de la maison.", "On l'allume en appuyant sur un bouton."],
  },
  {
    need: "envoyer des nouvelles de loin",
    then: "Lettre",
    now: "Téléphone portable",
    thenText: "une lettre",
    nowText: "un téléphone portable",
    thenHints: ["On l'écrit sur du papier et on la glisse dans une enveloppe.", "Elle met plusieurs jours à arriver."],
    nowHints: ["On l'utilise pour appeler ou envoyer un message écrit.", "La réponse arrive en quelques secondes."],
    nowAlso: ["avoir de la lumière"],
  },
  {
    need: "voyager sur une longue route",
    then: "Charrette",
    now: "Voiture",
    thenText: "une charrette",
    nowText: "une voiture",
    thenHints: ["Un animal la tire sur la route.", "Elle avance lentement, à la vitesse d'un cheval."],
    nowHints: ["Elle roule avec un moteur.", "Elle avance bien plus vite qu'un cheval."],
  },
  {
    need: "faire cuire le riz",
    then: "Feu de bois",
    now: "Cuisinière à gaz",
    thenText: "un feu de bois",
    nowText: "une cuisinière à gaz",
    thenHints: ["On faisait brûler des morceaux d'arbre sous la marmite.", "Il faut le rallumer et le surveiller."],
    nowHints: ["On tourne un bouton et la flamme apparaît.", "Il suffit d'une bouteille branchée à l'appareil."],
    thenAlso: ["avoir de la lumière"],
  },
  {
    need: "avoir de l'eau à la maison",
    then: "Puits",
    now: "Robinet",
    thenText: "un puits",
    nowText: "un robinet",
    thenHints: ["On y descend un seau attaché à une corde.", "Il faut tirer pour remonter l'eau."],
    nowHints: ["On tourne la poignée et l'eau coule.", "L'eau arrive par un tuyau."],
  },
];

type Era = "then" | "now";
const ERAS: readonly Era[] = ["then", "now"];

/** Toutes les questions « quel besoin, quelle époque » : cinq besoins, deux époques. */
const NEED_ERAS = NEEDS.flatMap((need) => ERAS.map((era) => ({ need, era })));

const tileOfEra = (need: Need, era: Era) => (era === "then" ? need.then : need.now);

/** Les autres besoins dont la chose de l'époque ne sert PAS aussi le besoin demandé : les seuls mauvais choix possibles. */
const otherNeeds = (need: Need, era: Era) =>
  NEEDS.filter((candidate) => candidate !== need && !(era === "then" ? candidate.thenAlso : candidate.nowAlso)?.includes(need.need));

/** « Pour avoir de la lumière, que faisait-on autrefois ? » : ce qu'on utilisait pour un besoin, parmi trois choses de trois besoins. */
export function makeCe1PastQuestion(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-autrefois-qcm", "ce qu'on utilisait autrefois et aujourd'hui", () => {
    const { need, era } = pickFresh(ctx, windowFor(NEED_ERAS, ctx.level, 1), (candidate) => `ce1-autrefois:${candidate.need.need}:${candidate.era}`);
    const others = shuffle(ctx.rng, otherNeeds(need, era)).slice(0, 2);
    return {
      prompt: era === "then" ? `Pour ${need.need}, que faisait-on autrefois ?` : `Pour ${need.need}, que fait-on de nos jours ?`,
      answer: tileOfEra(need, era),
      wrong: others.map((other) => tileOfEra(other, era)),
      hints: ["Lis le besoin en entier.", ...(era === "then" ? need.thenHints : need.nowHints)],
    };
  });
}

/** « Relie chaque besoin à la bonne chose. » : trois besoins, chacun à son époque. */
export function makeCe1PastLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-autrefois-relier", "relier un besoin et ce qu'on utilisait à son époque", () => {
    const needs = shuffle(ctx.rng, NEEDS).slice(0, 3);
    const pairs = needs.map((need) => {
      const era = pick(ctx.rng, ERAS);
      return { left: era === "then" ? `Autrefois, pour ${need.need}` : `De nos jours, pour ${need.need}`, right: tileOfEra(need, era) };
    });
    return {
      prompt: "Relie chaque besoin à la bonne chose.",
      pairs,
      hints: ["Lis chaque besoin en entier, avec son époque.", "Il y a longtemps, on n'avait pas ce qu'on a maintenant.", "Commence par le besoin dont tu connais la réponse."],
    };
  });
}

/** Les couples de besoins que le glissé peut montrer : deux besoins parmi cinq. */
const NEED_PAIRS = NEEDS.flatMap((first, i) => NEEDS.slice(i + 1).map((second) => [first, second] as const));

/** « Pour avoir de la lumière et pour voyager sur une longue route, glisse chaque chose dans la bonne case. » */
export function makeCe1PastSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-autrefois-glisser", "ranger des choses selon leur époque", () => {
    const [first, second] = pickFresh(ctx, windowFor(NEED_PAIRS, ctx.level, 1), (candidate) => `ce1-autrefois-glisser:${candidate[0].need}:${candidate[1].need}`);
    const items = [first, second].flatMap((need) => [
      { text: need.then, zone: "Autrefois" },
      { text: need.now, zone: "Aujourd'hui" },
    ]);
    return {
      prompt: `Pour ${first.need} et pour ${second.need}, glisse chaque chose dans la bonne case.`,
      zones: ["Autrefois", "Aujourd'hui"],
      items,
      hints: [
        "Lis les quatre choses une à une.",
        "Pour chaque besoin, une chose est plus ancienne que l'autre.",
        "La chose du temps passé va dans la case du passé.",
      ],
    };
  });
}

/** « Autrefois, pour avoir de la lumière, on utilisait ___. » : la chose de l'époque, parmi trois choses de trois besoins. */
export function makeCe1PastGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-autrefois-trou", "compléter une phrase sur autrefois ou aujourd'hui", () => {
    const { need, era } = pickFresh(ctx, windowFor(NEED_ERAS, ctx.level, 1), (candidate) => `ce1-autrefois:${candidate.need.need}:${candidate.era}`);
    const others = shuffle(ctx.rng, otherNeeds(need, era)).slice(0, 2);
    const textOf = (entry: Need) => (era === "then" ? entry.thenText : entry.nowText);
    return {
      prompt: "Complète la phrase.",
      text: era === "then" ? `Autrefois, pour ${need.need}, on utilisait ___.` : `De nos jours, pour ${need.need}, on utilise ___.`,
      answer: textOf(need),
      wrong: others.map(textOf),
      hints: ["Lis la phrase en entier.", ...(era === "then" ? need.thenHints : need.nowHints)],
    };
  });
}

// ===========================================================================
// L'HISTOIRE DE MA FAMILLE (hi-ce1-famille)
// ===========================================================================

type Term = "Grand-père" | "Grand-mère" | "Oncle" | "Tante" | "Cousin" | "Cousine";
const TERMS: readonly Term[] = ["Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin", "Cousine"];
const FEMININE_TERMS: ReadonlySet<Term> = new Set(["Grand-mère", "Tante", "Cousine"]);

/** Deux indices par nom de la famille : la génération, puis le lien. Aucun n'écrit le nom lui-même. */
const TERM_HINTS: Record<Term, readonly [string, string]> = {
  "Grand-père": ["C'est un homme de la génération d'avant tes parents.", "Il est le papa de l'un de tes parents."],
  "Grand-mère": ["C'est une femme de la génération d'avant tes parents.", "Elle est la maman de l'un de tes parents."],
  Oncle: ["C'est un homme de la génération de tes parents.", "Il est le frère de l'un de tes parents."],
  Tante: ["C'est une femme de la génération de tes parents.", "Elle est la sœur de l'un de tes parents."],
  Cousin: ["C'est un garçon de ta génération.", "Il est le fils du frère ou de la sœur d'un de tes parents."],
  Cousine: ["C'est une fille de ta génération.", "Elle est la fille du frère ou de la sœur d'un de tes parents."],
};

/** Qui l'on désigne : le mot et les deux possessifs (« ta mère » pour l'enfant à qui l'on parle, « ma mère » pour celui qui parle). */
const OWNERS = {
  mère: { you: "ta", me: "ma" },
  père: { you: "ton", me: "mon" },
  oncle: { you: "ton", me: "mon" },
  tante: { you: "ta", me: "ma" },
} as const;

type Link = { role: string; of: keyof typeof OWNERS; answer: Term };

/** Les liens de la fiche, dits d'après un parent : le père de ma mère est mon grand-père. */
export const LINKS: readonly Link[] = [
  { role: "le père", of: "mère", answer: "Grand-père" },
  { role: "la mère", of: "père", answer: "Grand-mère" },
  { role: "le père", of: "père", answer: "Grand-père" },
  { role: "la mère", of: "mère", answer: "Grand-mère" },
  { role: "le frère", of: "mère", answer: "Oncle" },
  { role: "le frère", of: "père", answer: "Oncle" },
  { role: "la sœur", of: "mère", answer: "Tante" },
  { role: "la sœur", of: "père", answer: "Tante" },
  { role: "le fils", of: "oncle", answer: "Cousin" },
  { role: "la fille", of: "oncle", answer: "Cousine" },
  { role: "le fils", of: "tante", answer: "Cousin" },
  { role: "la fille", of: "tante", answer: "Cousine" },
];

const youOf = (link: Link) => `${link.role} de ${OWNERS[link.of].you} ${link.of}`;
const meOf = (link: Link) => `${link.role} de ${OWNERS[link.of].me} ${link.of}`;

/** « Qui est le père de ta mère ? » : le nom du lien, parmi trois noms de la famille. */
export function makeCe1FamilyLink(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-lien-qcm", "nommer un membre de la famille", () => {
    const link = pickFresh(ctx, windowFor(LINKS, ctx.level, 2), (candidate) => `ce1-lien:${youOf(candidate)}`);
    return {
      prompt: `Qui est ${youOf(link)} ?`,
      answer: link.answer,
      wrong: shuffle(
        ctx.rng,
        TERMS.filter((term) => term !== link.answer),
      ).slice(0, 2),
      hints: ["Lis bien de qui l'on parle.", ...TERM_HINTS[link.answer]],
    };
  });
}

/** « Le frère de ma mère est mon ___. » : le nom du lien, parmi trois noms du même genre. */
export function makeCe1FamilyGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-lien-trou", "compléter une phrase sur la famille", () => {
    const link = pickFresh(ctx, windowFor(LINKS, ctx.level, 2), (candidate) => `ce1-lien:${meOf(candidate)}`);
    const feminine = FEMININE_TERMS.has(link.answer);
    const sameGender = TERMS.filter((term) => FEMININE_TERMS.has(term) === feminine);
    return {
      prompt: "Complète la phrase.",
      text: `${cap(meOf(link))} est ${feminine ? "ma" : "mon"} ___.`,
      answer: link.answer.toLowerCase(),
      wrong: sameGender.filter((term) => term !== link.answer).map((term) => term.toLowerCase()),
      hints: ["Lis bien de qui l'on parle.", ...TERM_HINTS[link.answer]],
    };
  });
}

/** « Relie chaque membre de la famille à son nom. » : trois liens, trois noms différents. */
export function makeCe1FamilyLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-lien-relier", "relier un lien de famille et son nom", () => {
    const chosen: Link[] = [];
    for (const link of shuffle(ctx.rng, LINKS)) {
      if (chosen.length < 3 && !chosen.some((other) => other.answer === link.answer)) chosen.push(link);
    }
    return {
      prompt: "Relie chaque membre de la famille à son nom.",
      pairs: chosen.map((link) => ({ left: cap(youOf(link)), right: link.answer })),
      hints: ["Lis bien de qui l'on parle dans chaque phrase.", "Pense à la génération de chaque personne.", "Commence par le lien dont tu es certain."],
    };
  });
}

/** Les trois générations, avec ceux qui en font partie. */
const GENERATION_ZONES: readonly { zone: string; members: readonly string[] }[] = [
  { zone: "Ma génération", members: ["Frère", "Sœur", "Cousin", "Cousine"] },
  { zone: "Génération de mes parents", members: ["Père", "Mère", "Oncle", "Tante"] },
  { zone: "Génération de mes grands-parents", members: ["Grand-père", "Grand-mère"] },
];

/** « Glisse chaque personne dans la case de sa génération. » : deux générations parmi trois, deux ou trois personnes de chacune. */
export function makeCe1FamilySort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-famille-glisser", "ranger les membres d'une famille par génération", () => {
    const [first, second] = shuffle(ctx.rng, GENERATION_ZONES).slice(0, 2);
    const items = [first, second].flatMap((generation) =>
      shuffle(ctx.rng, generation.members)
        .slice(0, ctx.level <= 2 ? 2 : 3)
        .map((text) => ({ text, zone: generation.zone })),
    );
    return {
      prompt: "Glisse chaque personne dans la case de sa génération.",
      zones: [first.zone, second.zone],
      items,
      hints: [
        "Pense à l'âge de chaque personne par rapport à toi.",
        "Une personne de ton âge est dans la même case que toi.",
        "Plus la personne est âgée, plus sa case est ancienne.",
      ],
    };
  });
}

/** Ce que la fiche dit de l'arbre généalogique et des souvenirs de famille. */
const MEMORIES: readonly { question: string; answer: string; wrong: readonly [string, string]; hints: Hints }[] = [
  {
    question: "Que montre un arbre généalogique ?",
    answer: "Les liens entre les membres d'une famille",
    wrong: ["Les saisons de l'année", "Les routes d'un village"],
    hints: ["Pense aux branches qui partent d'un tronc.", "Chaque branche réunit deux personnes.", "On y lit qui est le papa de qui."],
  },
  {
    question: "À quoi sert un arbre généalogique ?",
    answer: "À retrouver qui est lié à qui",
    wrong: ["À prévoir la pluie", "À compter les élèves"],
    hints: ["Il ne parle ni de la météo ni de l'école.", "Il parle des personnes d'une même parenté.", "On le lit pour savoir qui descend de qui."],
  },
  {
    question: "Que garde une photo de famille ancienne ?",
    answer: "Le souvenir d'un moment passé",
    wrong: ["Le nom de tous les élèves", "Le prix du marché"],
    hints: ["Elle a été prise il y a longtemps.", "Elle montre des personnes à une date précise.", "On la regarde pour se rappeler."],
  },
  {
    question: "Que raconte un grand-parent sur la famille ?",
    answer: "Ce que la famille a vécu autrefois",
    wrong: ["La météo de demain", "Le programme de l'école"],
    hints: ["Il a plus d'années que toi.", "Il se rappelle beaucoup de choses.", "Il parle du temps où tes parents étaient petits."],
  },
];

/** « Que montre un arbre généalogique ? » : ce que dit la fiche de l'arbre et des souvenirs. */
export function makeCe1MemoryChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-souvenir-qcm", "l'arbre généalogique et les souvenirs de famille", () => {
    const entry = pickFresh(ctx, windowFor(MEMORIES, ctx.level, 1), (candidate) => `ce1-souvenir:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** Ce que chaque souvenir de famille apporte. */
const MEMORY_LINKS: readonly { left: string; right: string }[] = [
  { left: "Arbre généalogique", right: "Montre qui est lié à qui" },
  { left: "Photo ancienne", right: "Garde l'image d'un moment passé" },
  { left: "Récit d'un grand-parent", right: "Raconte ce que la famille a vécu" },
  { left: "Acte de naissance", right: "Donne la date de naissance d'une personne" },
  { left: "Livret de famille", right: "Liste les parents et les enfants" },
];

/** « Relie chaque souvenir de famille à ce qu'il apporte. » : trois souvenirs parmi quatre. */
export function makeCe1MemoryLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-souvenir-relier", "relier un souvenir de famille et ce qu'il apporte", () => ({
    prompt: "Relie chaque souvenir de famille à ce qu'il apporte.",
    pairs: shuffle(ctx.rng, MEMORY_LINKS).slice(0, 3),
    hints: ["Lis les trois souvenirs, puis les trois phrases.", "Un souvenir qu'on écoute n'est pas un souvenir qu'on regarde.", "Commence par celui dont tu es certain."],
  }));
}

/** Les personnes qu'une phrase de comptage nomme, avec leur singulier et leur pluriel. */
const RELATIVES = [
  { one: "oncle", many: "oncles" },
  { one: "tante", many: "tantes" },
  { one: "cousin", many: "cousins" },
  { one: "cousine", many: "cousines" },
] as const;

/** « Awa a 2 oncles et 3 tantes. Combien a-t-elle de personnes de cette famille en tout ? Écris le nombre. » : la somme de deux ou trois nombres. */
export function makeCe1FamilyCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-famille-compte", () => {
    const feminine = ctx.rng() < 0.5;
    const name = pick(ctx.rng, feminine ? FEMININE_NAMES : MASCULINE_NAMES);
    const groups = shuffle(ctx.rng, RELATIVES).slice(0, ctx.level <= 2 ? 2 : 3);
    const top = [4, 8, 6, 9][ctx.level - 1];
    const counts = groups.map(() => randomInt(ctx.rng, ctx.level <= 2 ? 1 : 2, top));
    const total = counts.reduce((sum, count) => sum + count, 0);
    const parts = groups.map((group, i) => `${counts[i]} ${counts[i] === 1 ? group.one : group.many}`);
    return {
      type: "short-answer",
      prompt: `${name} a ${joinFrench(parts)}. Combien a-t-${feminine ? "elle" : "il"} de personnes de cette famille en tout ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(total)], game: originOf("ce1-famille-compte", ctx), concept: "compter les membres d'une famille" },
      answerKey: String(total),
      hints: ["Lis chaque nombre de la phrase.", "Pour savoir combien en tout, on additionne.", "Ajoute les nombres un à un, en gardant le total dans ta tête."],
    };
  });
}

// ===========================================================================
// L'HISTOIRE DE MON ÉCOLE (hi-ce1-ecole)
// ===========================================================================

type Source = { tile: string; kind: "personne" | "document"; gives: string; hints: readonly [string, string] };

/** Comment on retrouve l'histoire d'une école : les trois sources de la fiche (anciens élèves, photos, registres) et deux autres. */
export const SOURCES: readonly Source[] = [
  { tile: "Ancien élève", kind: "personne", gives: "Raconte ses souvenirs d'élève", hints: ["Pense à quelqu'un qui est allé à l'école il y a longtemps.", "Cette personne parle et tu l'écoutes."] },
  { tile: "Ancien instituteur", kind: "personne", gives: "Raconte comment il faisait la classe", hints: ["Pense à une personne qui enseignait autrefois.", "Cette personne parle et tu l'écoutes."] },
  { tile: "Photo ancienne", kind: "document", gives: "Montre l'école d'autrefois", hints: ["Pense à une image prise il y a longtemps.", "On la regarde, on ne l'écoute pas."] },
  { tile: "Registre", kind: "document", gives: "Garde les noms des élèves", hints: ["Pense à un gros livre où l'on écrit des noms.", "On le lit pour retrouver des noms."] },
  { tile: "Vieux cahier", kind: "document", gives: "Montre ce qu'on écrivait en classe", hints: ["Pense à un objet rempli de pages écrites par un élève d'un autre temps.", "On l'ouvre et on le lit."] },
];

const sourceOf = (tile: string) => SOURCES.find((source) => source.tile === tile) as Source;

/** Les questions sur les sources : à chaque question, une seule source qui y répond. */
const SOURCE_QUESTIONS: readonly { question: string; answer: string; wrong: readonly [string, string] }[] = [
  { question: "Qui peut raconter comment était l'école il y a longtemps ?", answer: "Ancien élève", wrong: ["Registre", "Photo ancienne"] },
  { question: "Que regarde-t-on pour voir comment était l'école autrefois ?", answer: "Photo ancienne", wrong: ["Registre", "Vieux cahier"] },
  { question: "Où sont écrits les noms des élèves inscrits depuis longtemps ?", answer: "Registre", wrong: ["Photo ancienne", "Vieux cahier"] },
  { question: "Que lit-on pour voir ce que les élèves écrivaient autrefois ?", answer: "Vieux cahier", wrong: ["Registre", "Photo ancienne"] },
  { question: "Qui peut raconter comment on faisait la classe autrefois ?", answer: "Ancien instituteur", wrong: ["Registre", "Photo ancienne"] },
  { question: "Qui a sûrement des souvenirs de l'école, il y a longtemps ?", answer: "Ancien élève", wrong: ["Vieux cahier", "Registre"] },
  { question: "Que peut-on regarder pour voir comment on s'habillait autrefois ?", answer: "Photo ancienne", wrong: ["Registre", "Vieux cahier"] },
  { question: "Que lit-on pour savoir qui était inscrit à l'école autrefois ?", answer: "Registre", wrong: ["Photo ancienne", "Vieux cahier"] },
  { question: "Que peut-on ouvrir pour voir comment écrivait un élève autrefois ?", answer: "Vieux cahier", wrong: ["Registre", "Photo ancienne"] },
  { question: "Qui peut expliquer comment il enseignait il y a longtemps ?", answer: "Ancien instituteur", wrong: ["Vieux cahier", "Photo ancienne"] },
];

/** « Que regarde-t-on pour voir l'école d'autrefois ? » : la source qui répond, parmi trois. */
export function makeCe1SourceChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-source-qcm", "retrouver l'histoire d'une école", () => {
    const entry = pickFresh(ctx, windowFor(SOURCE_QUESTIONS, ctx.level, 2), (candidate) => `ce1-source:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: ["Lis la question en entier.", ...sourceOf(entry.answer).hints] };
  });
}

/** « Relie chaque source à ce qu'elle apporte. » : trois sources parmi cinq. */
export function makeCe1SourceLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-source-relier", "relier une source et ce qu'elle apporte", () => ({
    prompt: "Relie chaque source à ce qu'elle apporte.",
    pairs: shuffle(ctx.rng, SOURCES)
      .slice(0, 3)
      .map((source) => ({ left: source.tile, right: source.gives })),
    hints: [
      "Pense à ce que tu fais avec chaque source, l'écouter, la regarder ou la lire.",
      "Une source qu'on écoute ne se feuillette pas.",
      "Commence par celle dont tu es certain.",
    ],
  }));
}

/** « Glisse chaque source dans la bonne case. » : deux personnes, deux ou trois documents. */
export function makeCe1SourceSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-source-glisser", "ranger les sources de l'histoire d'une école", () => {
    const people = SOURCES.filter((source) => source.kind === "personne");
    const documents = shuffle(
      ctx.rng,
      SOURCES.filter((source) => source.kind === "document"),
    ).slice(0, ctx.level <= 2 ? 2 : 3);
    return {
      prompt: "Glisse chaque source dans la bonne case.",
      zones: ["Personne", "Document"],
      items: [...people.map((source) => ({ text: source.tile, zone: "Personne" })), ...documents.map((source) => ({ text: source.tile, zone: "Document" }))],
      hints: [
        "Pose-toi la question pour chaque mot, est-ce quelqu'un ou est-ce un objet ?",
        "Quelqu'un parle, un objet ne parle pas.",
        "Une image, un livre ou une page ne parlent pas.",
      ],
    };
  });
}

/** Les phrases à trou sur les sources, avec trois mots du même genre. */
const SOURCE_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { text: "On peut lire les noms des élèves d'autrefois dans un ___.", answer: "registre", wrong: ["ballon", "crayon"], hint: "Pense à un gros livre où l'on écrit des noms." },
  { text: "Pour voir l'école d'autrefois, on regarde une ___ ancienne.", answer: "photo", wrong: ["règle", "craie"], hint: "Pense à une image prise il y a longtemps." },
  { text: "Un ancien élève nous raconte ses ___.", answer: "souvenirs", wrong: ["crayons", "ballons"], hint: "Ce sont des choses qu'il garde dans sa tête." },
  { text: "Un registre garde les ___ des élèves.", answer: "noms", wrong: ["prix", "voitures"], hint: "On les écrit en haut de chaque cahier." },
];

/** « On peut lire les noms des élèves d'autrefois dans un ___. » : un mot de l'histoire de l'école, parmi trois. */
export function makeCe1SourceGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-source-trou", "compléter une phrase sur l'histoire d'une école", () => {
    const entry = pickFresh(ctx, windowFor(SOURCE_GAPS, ctx.level, 1), (candidate) => `ce1-source-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase.",
      text: entry.text,
      answer: entry.answer,
      wrong: entry.wrong,
      hints: ["Lis la phrase en entier.", entry.hint, "Cherche le mot qui va avec le reste de la phrase."],
    };
  });
}

/** La première classe de l'école, qui ouvre avant tout ce qui s'ajoute. */
const FIRST_CLASS: ChronoEvent = { tile: "Première classe", clause: (y) => `la première classe ouvre en ${y}` };

/** « La cantine ouvre en 1975, le puits est creusé en 1960 et la clôture est posée en 1990. Mets-les du plus ancien au plus récent. » */
export function makeCe1SchoolOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-ecole-ordre", "ranger les ajouts d'une école dans le temps", () => {
    const { chronological, shown } = drawDated(ctx, SCHOOL_EVENTS, 3);
    return {
      prompt: `${sentenceOf(shown)} Mets-les du plus ancien au plus récent.`,
      sequence: chronological.map((entry) => entry.event.tile),
      hints: [
        "Lis les trois années, une à une.",
        "Le plus ancien est celui dont l'année est la plus petite.",
        "Place ensuite celui dont l'année est juste après, puis le dernier.",
      ],
    };
  });
}

/** « La première classe ouvre en 1950, la cantine ouvre en 1975 et le puits est creusé en 1960. Quel ajout est le plus récent ? » */
export function makeCe1SchoolLatest(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-ecole-recent", "lire les dates d'une école", () => {
    const { chronological, baseYear } = drawDated(ctx, SCHOOL_EVENTS, 2, true);
    const second = ctx.rng() < 0.5;
    // Les trois événements sont dits dans un ordre qui n'est pas celui du temps.
    const sentence = sentenceOf(shuffle(ctx.rng, [{ event: FIRST_CLASS, year: baseYear }, ...chronological]));
    const answer = second ? chronological[0].event.tile : chronological[1].event.tile;
    return {
      prompt: `${sentence} ${second ? "Quel ajout est arrivé juste après la première classe ?" : "Quel ajout est le plus récent ?"}`,
      answer,
      wrong: [FIRST_CLASS.tile, ...chronological.map((entry) => entry.event.tile).filter((tile) => tile !== answer)],
      hints: [
        "Lis les trois années, une à une.",
        second ? "Parmi les ajouts, cherche celui dont l'année est la plus proche de celle de la première classe." : "Cherche l'année la plus grande des trois.",
        "Compare les nombres en regardant d'abord le chiffre des milliers, puis celui des centaines.",
      ],
    };
  });
}

/** « La cantine ouvre en 1960 et la bibliothèque ouvre en 1985. Combien d'années passent entre ces deux dates ? Écris le nombre. » */
export function makeCe1SchoolGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-ecole-ecart", () => {
    const { chronological, shown } = drawDated(ctx, SCHOOL_EVENTS, 2);
    const gap = chronological[1].year - chronological[0].year;
    return {
      type: "short-answer",
      prompt: `${sentenceOf(shown)} Combien d'années passent entre ces deux dates ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(gap)], game: originOf("ce1-ecole-ecart", ctx), concept: "calculer le temps qui passe entre deux dates" },
      answerKey: String(gap),
      hints: [
        "Repère la date la plus ancienne et la date la plus récente.",
        "Pour savoir combien d'années passent, retire la petite date de la grande.",
        "Calcule avec une soustraction, en comptant par dizaines si tu veux.",
      ],
    };
  });
}

// ===========================================================================
// MON QUARTIER, MON VILLAGE, MA COMMUNE (hi-ce1-quartier)
// ===========================================================================

/** Les mots du quartier et de la commune : la définition de chacun, que la fiche donne sans « ça dépend ». */
type Word = { tile: string; gives: string; hints: readonly [string, string] };

export const WORDS: readonly Word[] = [
  { tile: "Maire", gives: "Dirige la commune", hints: ["C'est une personne que les habitants choisissent.", "Elle s'occupe de la vie de toute la commune."] },
  { tile: "Fondateur", gives: "A créé le village", hints: ["C'est une personne du temps passé.", "Elle est arrivée la première et s'est installée avec les siens."] },
  { tile: "Mairie", gives: "Là où travaille le maire", hints: ["C'est un bâtiment, pas une personne.", "On y va pour les papiers de la commune."] },
  { tile: "Monument", gives: "Rappelle un événement du passé", hints: ["C'est une construction qu'on a élevée exprès.", "On la regarde pour se souvenir."] },
  { tile: "Commune", gives: "Plusieurs quartiers ou villages réunis", hints: ["C'est un territoire, pas un bâtiment.", "Il rassemble plusieurs endroits où vivent des habitants."] },
];

const wordOf = (tile: string) => WORDS.find((word) => word.tile === tile) as Word;

/** Les questions sur les mots du quartier : à chaque question, un seul mot qui y répond. */
const WORD_QUESTIONS: readonly { question: string; answer: string; wrong: readonly [string, string] }[] = [
  { question: "Comment s'appelle la personne qui dirige la commune ?", answer: "Maire", wrong: ["Mairie", "Monument"] },
  { question: "Comment s'appelle la personne qui a créé le village ?", answer: "Fondateur", wrong: ["Mairie", "Monument"] },
  { question: "Comment s'appelle le bâtiment où travaille le maire ?", answer: "Mairie", wrong: ["Monument", "Puits"] },
  { question: "Quelle construction rappelle un événement du passé ?", answer: "Monument", wrong: ["Mairie", "Puits"] },
  { question: "Comment appelle-t-on l'ensemble des quartiers ou villages dirigés par un maire ?", answer: "Commune", wrong: ["Quartier", "Monument"] },
  { question: "Qui est élu pour diriger la commune ?", answer: "Maire", wrong: ["Monument", "Mairie"] },
  { question: "Qui a fondé le village il y a très longtemps ?", answer: "Fondateur", wrong: ["Mairie", "Monument"] },
  { question: "Dans quel bâtiment le maire reçoit-il les habitants ?", answer: "Mairie", wrong: ["Monument", "Puits"] },
  { question: "Que construit-on pour garder le souvenir d'une personne importante ?", answer: "Monument", wrong: ["Mairie", "Puits"] },
  { question: "Quel mot désigne tout le territoire dirigé par le maire ?", answer: "Commune", wrong: ["Mairie", "Monument"] },
];

/** « Comment s'appelle la personne qui dirige la commune ? » : le mot du quartier, parmi trois. */
export function makeCe1WordChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mot-qcm", "les mots du quartier et de la commune", () => {
    const entry = pickFresh(ctx, windowFor(WORD_QUESTIONS, ctx.level, 2), (candidate) => `ce1-mot:${candidate.question}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: ["Lis la question en entier.", ...wordOf(entry.answer).hints] };
  });
}

/** « Relie chaque mot à ce qu'il veut dire. » : trois mots parmi cinq. */
export function makeCe1WordLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-mot-relier", "relier un mot du quartier et son sens", () => ({
    prompt: "Relie chaque mot à ce qu'il veut dire.",
    pairs: shuffle(ctx.rng, WORDS)
      .slice(0, 3)
      .map((word) => ({ left: word.tile, right: word.gives })),
    hints: ["Lis les trois mots, puis les trois phrases.", "Une personne n'est pas un bâtiment.", "Commence par le mot dont tu es certain."],
  }));
}

/** « Glisse chaque mot dans la bonne case. » : deux personnes, deux ou trois lieux. */
export function makeCe1WordSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-mot-glisser", "ranger les mots du quartier", () => {
    const places = shuffle(ctx.rng, ["Mairie", "Monument", "Puits", "Marché"]).slice(0, ctx.level <= 2 ? 2 : 3);
    return {
      prompt: "Glisse chaque mot dans la bonne case.",
      zones: ["Personne", "Lieu"],
      items: [...["Maire", "Fondateur"].map((text) => ({ text, zone: "Personne" })), ...places.map((text) => ({ text, zone: "Lieu" }))],
      hints: [
        "Pose-toi la question pour chaque mot, est-ce quelqu'un ou est-ce un endroit ?",
        "Quelqu'un peut parler, un endroit ne parle pas.",
        "On peut aller dans un endroit, on ne peut pas aller dans quelqu'un.",
      ],
    };
  });
}

/** Les phrases à trou sur le quartier, avec trois mots du même genre. */
const WORD_GAPS: readonly { text: string; answer: string; wrong: readonly [string, string]; hint: string }[] = [
  { text: "Le ___ dirige la commune.", answer: "maire", wrong: ["monument", "puits"], hint: "C'est une personne que les habitants ont choisie." },
  { text: "Le maire travaille à la ___.", answer: "mairie", wrong: ["mosquée", "boutique"], hint: "C'est le bâtiment de la commune." },
  { text: "Le ___ a créé le village il y a longtemps.", answer: "fondateur", wrong: ["maire", "monument"], hint: "C'est une personne arrivée la première." },
  { text: "Un ___ garde le souvenir d'un événement du passé.", answer: "monument", wrong: ["puits", "marché"], hint: "On l'a élevé exprès pour se souvenir." },
  { text: "La commune est dirigée par le ___.", answer: "maire", wrong: ["fondateur", "monument"], hint: "C'est une personne choisie par les habitants." },
  { text: "Le maire est choisi par les ___ de la commune.", answer: "habitants", wrong: ["monuments", "puits"], hint: "Ce sont les personnes qui vivent dans la commune." },
  { text: "On va à la ___ pour voir le maire.", answer: "mairie", wrong: ["mosquée", "boutique"], hint: "C'est le bâtiment de la commune." },
  { text: "Le ___ est une construction qui rappelle le passé.", answer: "monument", wrong: ["maire", "fondateur"], hint: "On l'a élevé exprès pour se souvenir." },
  { text: "Le village a été créé par son ___.", answer: "fondateur", wrong: ["maire", "monument"], hint: "C'est une personne arrivée la première." },
];

/** « Le ___ dirige la commune. » : un mot du quartier, parmi trois. */
export function makeCe1WordGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-mot-trou", "compléter une phrase sur le quartier et la commune", () => {
    const entry = pickFresh(ctx, windowFor(WORD_GAPS, ctx.level, 2), (candidate) => `ce1-mot-trou:${candidate.text}`);
    return {
      prompt: "Complète la phrase.",
      text: entry.text,
      answer: entry.answer,
      wrong: entry.wrong,
      hints: ["Lis la phrase en entier.", entry.hint, "Cherche le mot qui va avec le reste de la phrase."],
    };
  });
}

/** La fondation du village, qui vient avant tout ce qui s'y bâtit. */
const FOUNDING: ChronoEvent = { tile: "Fondation", clause: (y) => `le village est fondé en ${y}` };

/** « Le marché ouvre en 1980, la mairie est bâtie en 1950 et le puits est creusé en 2000. Mets-les du plus ancien au plus récent. » */
export function makeCe1VillageOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-village-ordre", "ranger les événements d'un village dans le temps", () => {
    const { chronological, shown } = drawDated(ctx, VILLAGE_EVENTS, 3);
    return {
      prompt: `${sentenceOf(shown)} Mets-les du plus ancien au plus récent.`,
      sequence: chronological.map((entry) => entry.event.tile),
      hints: [
        "Lis les trois années, une à une.",
        "Le plus ancien est celui dont l'année est la plus petite.",
        "Place ensuite celui dont l'année est juste après, puis le dernier.",
      ],
    };
  });
}

/** « Le village est fondé en 1900, le puits est creusé en 1950 et la mairie est bâtie en 1970. Quel ajout est le plus récent ? » */
export function makeCe1VillageLatest(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-village-recent", "lire les dates d'un village", () => {
    const { chronological, baseYear } = drawDated(ctx, VILLAGE_EVENTS, 2, true);
    const second = ctx.rng() < 0.5;
    const sentence = sentenceOf(shuffle(ctx.rng, [{ event: FOUNDING, year: baseYear }, ...chronological]));
    const answer = second ? chronological[0].event.tile : chronological[1].event.tile;
    return {
      prompt: `${sentence} ${second ? "Quel ajout est arrivé juste après la fondation ?" : "Quel ajout est le plus récent ?"}`,
      answer,
      wrong: [FOUNDING.tile, ...chronological.map((entry) => entry.event.tile).filter((tile) => tile !== answer)],
      hints: [
        "Lis les trois années, une à une.",
        second ? "Parmi les ajouts, cherche celui dont l'année est la plus proche de celle de la fondation." : "Cherche l'année la plus grande des trois.",
        "Compare les nombres en regardant d'abord le chiffre des milliers, puis celui des centaines.",
      ],
    };
  });
}

/** « Le pont est construit en 1950 et la route est goudronnée en 1985. Combien d'années passent entre ces deux dates ? Écris le nombre. » */
export function makeCe1VillageGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-village-ecart", () => {
    const { chronological, shown } = drawDated(ctx, VILLAGE_EVENTS, 2);
    const gap = chronological[1].year - chronological[0].year;
    return {
      type: "short-answer",
      prompt: `${sentenceOf(shown)} Combien d'années passent entre ces deux dates ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(gap)], game: originOf("ce1-village-ecart", ctx), concept: "calculer le temps qui passe entre deux dates" },
      answerKey: String(gap),
      hints: [
        "Repère la date la plus ancienne et la date la plus récente.",
        "Pour savoir combien d'années passent, retire la petite date de la grande.",
        "Calcule avec une soustraction, en comptant par dizaines si tu veux.",
      ],
    };
  });
}

/** Une personne de chaque génération : un grand-parent, un parent ou un oncle ou une tante, un frère, une sœur ou un cousin. */
const FAMILY_BY_GENERATION: readonly (readonly string[])[] = [
  ["Grand-père", "Grand-mère"],
  ["Père", "Mère", "Oncle", "Tante"],
  ["Frère", "Sœur", "Cousin", "Cousine"],
];

/** « Mets ces membres de ta famille de la génération la plus âgée à la plus jeune. » : un grand-parent, un parent, un frère ou un cousin. */
export function makeCe1FamilyOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-famille-ordre", "ranger des membres d'une famille par génération", () => {
    const oldestFirst = ctx.rng() < 0.5;
    const members = FAMILY_BY_GENERATION.map((generation) => pick(ctx.rng, generation));
    return {
      prompt: `Mets ces membres de ta famille ${oldestFirst ? "de la génération la plus âgée à la plus jeune" : "de la génération la plus jeune à la plus âgée"}.`,
      sequence: oldestFirst ? members : [...members].reverse(),
      hints: [
        "Pense à l'âge de chaque personne par rapport à toi.",
        "Une personne de ton âge est dans ta génération.",
        "Plus la personne est âgée, plus sa génération est ancienne.",
      ],
    };
  });
}
