/**
 * LES GABARITS DE LA POLITESSE : bonjour, au revoir, merci, s'il te plaît, pardon, « est-ce que je
 * peux ? », dire ce qu'on ressent. Pour l'enfant de CI qui apprend à parler aux autres (français,
 * `fr-ci-politesse`).
 *
 * Le modèle écrivait « Quand tu veux de l'eau, tu dis ___ s'il te plaît. » avec « s'il te plaît »
 * comme réponse (la phrase le disait déjà deux fois), rangeait « S'il te plaît » dans « Remerciements »,
 * demandait de mettre « Bonjour, Comment ça va ?, Merci » dans l'ordre (aucun ordre n'est le bon), et
 * mettait le même 🙏 sur « Merci » et sur « S'il te plaît ». Ici chaque situation est écrite une fois,
 * avec LA formule qui lui va, et chaque formule a son émoji, différent des autres.
 *
 * RÈGLES POUR AJOUTER UNE SITUATION
 * - Une seule formule lui va. Si une deuxième irait aussi (« Tu veux de l'eau » : « s'il te plaît »
 *   ou « est-ce que je peux ? »), on la met dans `also` : elle n'est jamais proposée à côté.
 * - Le texte de la situation ne dit jamais la formule (« Tu dois dire merci » est interdit).
 * - Un émoji ancien (Unicode 11 au plus, sans sélecteur de variation), DIFFÉRENT de tous les autres,
 *   formules et situations comprises : deux étiquettes au même dessin se confondraient.
 * - Au plus une apostrophe droite dans le texte, jamais de « : ».
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une
 * apostrophe droite, et vingt mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";

export type FormulaId = "bonjour" | "aurevoir" | "merci" | "svp" | "pardon" | "permission";

export type Formula = {
  id: FormulaId;
  label: string;
  emoji: string;
  /** À quel moment on la dit, sans la nommer : l'indice qui explique sans donner. */
  usage: string;
};

/** Les formules, dans l'ordre où l'enfant les apprend : les trois premières au premier palier. */
export const FORMULAS: readonly Formula[] = [
  { id: "bonjour", label: "Bonjour", emoji: "😊", usage: "On la dit au début, quand on arrive ou qu'on voit quelqu'un." },
  { id: "aurevoir", label: "Au revoir", emoji: "👋", usage: "On la dit à la fin, quand on s'en va ou qu'on quitte quelqu'un." },
  { id: "merci", label: "Merci", emoji: "🙏", usage: "On la dit pour remercier, quand on reçoit quelque chose ou de l'aide." },
  { id: "svp", label: "S'il te plaît", emoji: "🤲", usage: "On la dit pour demander quelque chose poliment." },
  { id: "pardon", label: "Pardon", emoji: "😔", usage: "On la dit pour s'excuser, quand on a fait de la peine ou une bêtise." },
  { id: "permission", label: "Est-ce que je peux ?", emoji: "✋", usage: "On la demande avant de faire quelque chose, pour avoir la permission." },
];

const formulaOf = (id: FormulaId) => FORMULAS.find((formula) => formula.id === id) as Formula;

/** L'étiquette d'une formule : l'émoji devant, le nom écrit. */
export const formulaTile = (formula: Formula) => `${formula.emoji} ${formula.label}`;

export type Situation = {
  id: string;
  formula: FormulaId;
  /** La situation, dite à l'enfant : elle ne nomme jamais la formule. */
  text: string;
  /** La même situation en étiquette courte, à la première personne. */
  short: string;
  emoji: string;
  /** Les formules qui iraient aussi : jamais proposées à côté de la bonne. */
  also?: FormulaId[];
};

export const SITUATIONS: readonly Situation[] = [
  // Bonjour
  { id: "b1", formula: "bonjour", text: "Tu arrives à l'école le matin.", short: "J'arrive à l'école", emoji: "🏫" },
  { id: "b2", formula: "bonjour", text: "Tu vois ton ami en arrivant.", short: "Je vois mon ami", emoji: "🧒" },
  { id: "b3", formula: "bonjour", text: "Tu entres dans la classe.", short: "J'entre dans la classe", emoji: "🔔" },
  { id: "b4", formula: "bonjour", text: "Tu croises ta voisine.", short: "Je croise ma voisine", emoji: "👵" },
  { id: "b5", formula: "bonjour", text: "Ton grand-père arrive chez toi.", short: "Grand-père arrive", emoji: "👴" },
  { id: "b6", formula: "bonjour", text: "Tu rencontres le directeur dans la cour.", short: "Je vois le directeur", emoji: "👨" },
  { id: "b7", formula: "bonjour", text: "Tu arrives chez ta tante.", short: "J'arrive chez ma tante", emoji: "🏡" },
  // Au revoir
  { id: "a1", formula: "aurevoir", text: "Tu pars de l'école.", short: "Je pars de l'école", emoji: "🎒" },
  { id: "a2", formula: "aurevoir", text: "La classe est finie, tu rentres chez toi.", short: "Je rentre à la maison", emoji: "🏠" },
  { id: "a3", formula: "aurevoir", text: "Ton ami s'en va.", short: "Mon ami s'en va", emoji: "🚶" },
  { id: "a4", formula: "aurevoir", text: "Tu quittes la maîtresse en fin de journée.", short: "Je quitte la maîtresse", emoji: "🌇" },
  { id: "a5", formula: "aurevoir", text: "Ton oncle repart en voyage.", short: "Mon oncle repart", emoji: "🚌" },
  { id: "a6", formula: "aurevoir", text: "Tes amis rentrent chez eux.", short: "Mes amis rentrent", emoji: "👥" },
  { id: "a7", formula: "aurevoir", text: "Tu sors de chez ta tante.", short: "Je pars de chez ma tante", emoji: "🚲" },
  { id: "a8", formula: "aurevoir", text: "Le car s'en va.", short: "Le car s'en va", emoji: "🚐" },
  // Merci
  { id: "m1", formula: "merci", text: "On te donne un cadeau.", short: "On me donne un cadeau", emoji: "🎁" },
  { id: "m2", formula: "merci", text: "Ton ami t'aide.", short: "Mon ami m'aide", emoji: "🤝" },
  { id: "m3", formula: "merci", text: "La maîtresse te donne un cahier.", short: "On me donne un cahier", emoji: "📒" },
  { id: "m4", formula: "merci", text: "Maman te sert à manger.", short: "Maman me sert à manger", emoji: "🍲" },
  { id: "m5", formula: "merci", text: "Un monsieur te tient la porte.", short: "On me tient la porte", emoji: "🚪" },
  { id: "m6", formula: "merci", text: "Ton ami te prête son crayon.", short: "On me prête un crayon", emoji: "📝" },
  { id: "m7", formula: "merci", text: "Ton oncle te donne un jus.", short: "On me donne un jus", emoji: "🍹" },
  { id: "m8", formula: "merci", text: "Ta tante te donne une mangue.", short: "On me donne une mangue", emoji: "🥭" },
  // S'il te plaît
  { id: "s1", formula: "svp", text: "Tu veux de l'eau.", short: "Je veux de l'eau", emoji: "🥤", also: ["permission"] },
  { id: "s2", formula: "svp", text: "Tu veux un bonbon.", short: "Je veux un bonbon", emoji: "🍬", also: ["permission"] },
  { id: "s3", formula: "svp", text: "Tu veux une banane.", short: "Je veux une banane", emoji: "🍌", also: ["permission"] },
  { id: "s4", formula: "svp", text: "Tu demandes du pain à papa.", short: "Je demande du pain", emoji: "🍞", also: ["permission"] },
  // Pardon
  { id: "p1", formula: "pardon", text: "Tu marches sur le pied de ton ami.", short: "Je marche sur son pied", emoji: "🦶" },
  { id: "p2", formula: "pardon", text: "Tu casses le jouet de ton ami.", short: "Je casse son jouet", emoji: "🧸" },
  { id: "p3", formula: "pardon", text: "Tu bouscules ton ami sans le vouloir.", short: "Je bouscule mon ami", emoji: "💥" },
  { id: "p4", formula: "pardon", text: "Tu renverses l'eau de ton ami.", short: "Je renverse son eau", emoji: "💦" },
  // Est-ce que je peux ?
  { id: "q1", formula: "permission", text: "Tu veux sortir de la classe.", short: "Je veux sortir", emoji: "🏃", also: ["svp"] },
  { id: "q2", formula: "permission", text: "Tu veux jouer avec le ballon de ton ami.", short: "Je veux son ballon", emoji: "⚽", also: ["svp"] },
  { id: "q3", formula: "permission", text: "Tu veux aller boire de l'eau.", short: "Je veux aller boire", emoji: "🚰", also: ["svp"] },
  { id: "q4", formula: "permission", text: "Tu veux t'asseoir à côté de ton ami.", short: "Je veux m'asseoir", emoji: "💺", also: ["svp"] },
];

const situationTile = (situation: Situation) => `${situation.emoji} ${situation.short}`;

/** Les formules du palier : trois au premier, « s'il te plaît » au deuxième, toutes ensuite. */
function formulasFor(level: number): Formula[] {
  const ids: FormulaId[] =
    level <= 1 ? ["bonjour", "aurevoir", "merci"] : level === 2 ? ["bonjour", "aurevoir", "merci", "svp"] : ["bonjour", "aurevoir", "merci", "svp", "pardon", "permission"];
  return ids.map(formulaOf);
}

/** « S'il te plaît » et « est-ce que je peux ? » vont aux mêmes demandes : jamais dans le même exercice. */
const conflicts = (a: FormulaId, b: FormulaId) => (a === "svp" && b === "permission") || (a === "permission" && b === "svp");

/** `count` formules du palier qui ne se contredisent pas. */
function chooseFormulas(ctx: GameContext, count: number): Formula[] {
  const chosen: Formula[] = [];
  for (const formula of shuffle(ctx.rng, formulasFor(ctx.level))) {
    if (chosen.length === count) break;
    if (chosen.some((other) => conflicts(other.id, formula.id))) continue;
    chosen.push(formula);
  }
  return chosen;
}

/** `count` situations de cette formule, toutes différentes, de préférence pas encore vues dans le palier. */
function takeSituations(ctx: GameContext, formula: FormulaId, count: number): Situation[] {
  const taken: Situation[] = [];
  for (let i = 0; i < count; i++) {
    const pool = SITUATIONS.filter((situation) => situation.formula === formula && !taken.includes(situation));
    taken.push(pickFresh(ctx, pool, (situation) => `politesse:${situation.id}`));
  }
  return taken;
}

/** Les deux mauvaises formules d'une situation : jamais une qui irait aussi. */
function wrongFormulas(ctx: GameContext, situation: Situation): Formula[] {
  const pool = formulasFor(ctx.level).filter((formula) => formula.id !== situation.formula && !(situation.also ?? []).includes(formula.id));
  return shuffle(ctx.rng, pool).slice(0, 2);
}

/** Un indice d'usage qui ne nomme pas la formule, entre deux phrases qui ne la nomment pas non plus. */
const choiceHints = (formula: Formula): [string, string, string] => [
  "Pense à ce que tu dis dans cette situation, avec les mots de la politesse.",
  formula.usage,
  "Dis chaque formule dans ta tête et vois si elle va avec la situation.",
];

// ===========================================================================
// LA FORMULE QUI VA AVEC LA SITUATION
// ===========================================================================

/** « Tu arrives à l'école le matin. Que dis-tu ? » : trois formules, une seule va. */
export function makeSituationChoice(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "politesse-situation", () => {
    const allowed = new Set(formulasFor(ctx.level).map((formula) => formula.id));
    const situation = pickFresh(
      ctx,
      SITUATIONS.filter((candidate) => allowed.has(candidate.formula)),
      (candidate) => `politesse:${candidate.id}`,
    );
    const right = formulaOf(situation.formula);
    const options = shuffle(ctx.rng, [formulaTile(right), ...wrongFormulas(ctx, situation).map(formulaTile)]);
    return {
      type: "qcm",
      prompt: `${situation.text} Que dis-tu ?`,
      payload: {
        options,
        correctIndex: options.indexOf(formulaTile(right)),
        game: originOf("politesse-situation", ctx),
        concept: "la formule de politesse qui va avec la situation",
      },
      answerKey: formulaTile(right),
      hints: choiceHints(right),
    };
  });
}

/** « Tu veux de l'eau. ___ ! » : la même situation, la formule à écrire dans le trou. */
export function makeFormulaGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "politesse-trou", () => {
    const allowed = new Set(formulasFor(ctx.level).map((formula) => formula.id));
    const situation = pickFresh(
      ctx,
      SITUATIONS.filter((candidate) => allowed.has(candidate.formula)),
      (candidate) => `politesse:${candidate.id}`,
    );
    const right = formulaOf(situation.formula);
    const options = shuffle(ctx.rng, [formulaTile(right), ...wrongFormulas(ctx, situation).map(formulaTile)]);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase.",
      payload: {
        text: `${situation.text} Tu dis ___ !`,
        blanks: [{ options, answer: formulaTile(right) }],
        game: originOf("politesse-trou", ctx),
        concept: "la formule de politesse qui va avec la situation",
      },
      answerKey: formulaTile(right),
      hints: choiceHints(right),
    };
  });
}

// ===========================================================================
// CE QU'ON RESSENT
// ===========================================================================

type Feeling = {
  id: string;
  /** Ce que l'enfant dit. */
  label: string;
  emoji: string;
  /** Ce qui se passe, sans nommer ce qu'on ressent. */
  situation: string;
  /** Le premier niveau où ce sentiment est proposé. */
  stage: 1 | 2 | 3;
};

export const FEELINGS: readonly Feeling[] = [
  { id: "soif", label: "J'ai soif", emoji: "🥛", situation: "Il fait très chaud et tu veux boire.", stage: 1 },
  { id: "faim", label: "J'ai faim", emoji: "🍚", situation: "Tu n'as rien mangé depuis ce matin.", stage: 1 },
  { id: "content", label: "Je suis content", emoji: "😀", situation: "Tu as reçu un beau cadeau.", stage: 1 },
  { id: "triste", label: "Je suis triste", emoji: "😢", situation: "Ton jouet est cassé.", stage: 2 },
  { id: "sommeil", label: "J'ai sommeil", emoji: "😴", situation: "Il est tard et tes yeux se ferment.", stage: 3 },
  { id: "peur", label: "J'ai peur", emoji: "😨", situation: "Un gros chien aboie très fort.", stage: 3 },
];

const feelingTile = (feeling: Feeling) => `${feeling.emoji} ${feeling.label}`;

/** « Il fait très chaud et tu veux boire. Que dis-tu ? » : dire un besoin ou un sentiment. */
export function makeFeelingChoice(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "politesse-besoin", () => {
    const stage = ctx.level <= 1 ? 1 : ctx.level === 2 ? 2 : 3;
    const pool = FEELINGS.filter((feeling) => feeling.stage <= stage);
    const feeling = pickFresh(ctx, pool, (candidate) => `besoin:${candidate.id}`);
    const wrong = shuffle(
      ctx.rng,
      pool.filter((candidate) => candidate.id !== feeling.id),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [feelingTile(feeling), ...wrong.map(feelingTile)]);
    return {
      type: "qcm",
      prompt: `${feeling.situation} Que dis-tu ?`,
      payload: {
        options,
        correctIndex: options.indexOf(feelingTile(feeling)),
        game: originOf("politesse-besoin", ctx),
        concept: "dire un besoin ou un sentiment",
      },
      answerKey: feelingTile(feeling),
      hints: [
        "Pense à ce que tu ressens dans cette situation.",
        "Chaque phrase dit une chose que l'on ressent ou dont on a besoin.",
        "Dis la phrase à voix haute pour voir si elle va avec la situation.",
      ],
    };
  });
}

// ===========================================================================
// RELIER, RANGER
// ===========================================================================

/** « Relie chaque formule à la situation qui lui va. » : trois paires au début, quatre ensuite. */
export function makeFormulaMatch(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "politesse-relier",
    () => {
      const formulas = chooseFormulas(ctx, ctx.level >= 3 ? 4 : 3);
      const pairs = formulas.map((formula) => {
        const [situation] = takeSituations(ctx, formula.id, 1);
        return { left: formulaTile(formula), right: situationTile(situation) };
      });
      return {
        type: "match",
        prompt: "Relie chaque formule à la situation qui lui va.",
        payload: {
          pairs,
          game: originOf("politesse-relier", ctx),
          concept: "relier une formule de politesse et sa situation",
        },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde bien chaque formule et pense à quand on la dit.",
          "Chaque formule va avec une seule situation.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    (game) => JSON.stringify([...((game.payload.pairs as { left: string; right: string }[]) ?? [])].map((pair) => pair.left + pair.right).sort()),
  );
}

/**
 * « Glisse chaque situation sous ce que l'on dit. » : deux formules et trois situations au début,
 * trois formules ensuite. Chaque case reçoit au moins une situation, au plus deux.
 */
export function makeFormulaSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "politesse-glisser",
    () => {
      const zoneCount = ctx.level <= 1 ? 2 : 3;
      const itemCount = ctx.level <= 1 ? 3 : ctx.level === 2 ? 4 : 5;
      const formulas = chooseFormulas(ctx, zoneCount);
      const perZone = formulas.map(() => 1);
      for (let extra = itemCount - zoneCount; extra > 0; extra--) {
        const open = perZone.flatMap((count, i) => (count < 2 ? [i] : []));
        perZone[pick(ctx.rng, open)] += 1;
      }
      const items = shuffle(
        ctx.rng,
        formulas.flatMap((formula, i) =>
          takeSituations(ctx, formula.id, perZone[i]).map((situation) => ({ text: situationTile(situation), correctZone: formulaTile(formula) })),
        ),
      );
      const zones = shuffle(ctx.rng, formulas.map(formulaTile));
      return {
        type: "drag-drop",
        prompt: "Glisse chaque situation sous ce que l'on dit.",
        payload: {
          zones,
          items,
          game: originOf("politesse-glisser", ctx),
          concept: "ranger des situations sous la formule de politesse qui leur va",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis chaque situation et pense à ce que tu dis.",
          "Chaque situation va sous une seule formule.",
          "Commence par la situation dont tu es le plus sûr.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** Les prénoms de la rencontre : sans apostrophe, jamais deux fois le même dans un palier. */
const NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"] as const;

/**
 * « Mets les paroles dans l'ordre de la rencontre. » : on salue, on dit son nom, on part. L'ordre
 * d'une rencontre ne se discute pas : on ne se présente pas après avoir dit au revoir.
 */
export function makeMeeting(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "politesse-rencontre", () => {
    const name = pickFresh(ctx, NAMES, (candidate) => `rencontre:${candidate}`);
    const sequence = [formulaTile(formulaOf("bonjour")), `🙋 Je m'appelle ${name}`, formulaTile(formulaOf("aurevoir"))];
    return {
      type: "order",
      prompt: "Mets les paroles dans l'ordre de la rencontre.",
      payload: {
        correctSequence: sequence,
        game: originOf("politesse-rencontre", ctx),
        concept: "l'ordre d'une rencontre : saluer, se présenter, prendre congé",
      },
      answerKey: sequence.join(", "),
      hints: [
        "Pense à ce qu'on dit en premier quand on rencontre quelqu'un.",
        "On dit son nom après avoir salué.",
        "On prend congé à la fin, quand on s'en va.",
      ],
    };
  });
}
