/**
 * SOLIDES ET VOLUMES AU CM2 (`ma-cm2-volumes`) : le volume du cube et du pavé droit, les unités de volume (cm³, dm³, m³ et le litre), les angles.
 *
 * La thématique n'avait aucun jeu de code. Ici la réponse est CALCULÉE : le volume d'un pavé droit est la longueur fois la largeur fois la hauteur, celui
 * d'un cube est son arête multipliée trois fois par elle-même, et une conversion se fait par un facteur de mille.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Deux solides : le cube et le pavé droit. Le cylindre n'a pas de volume ici. Les longueurs sont des nombres entiers de centimètres, de décimètres ou de
 *   mètres ; un pavé a toujours un volume entier.
 * - Les unités de volume sont le centimètre cube (cm³), le décimètre cube (dm³) et le mètre cube (m³). Le LITRE y est ajouté : un litre est un décimètre cube,
 *   mille litres un mètre cube. La fiche ne le nomme pas, mais c'est le lien habituel entre une unité de volume et une contenance. Le millilitre n'est pas utilisé.
 * - Une conversion tombe toujours juste : aucune virgule, jamais de décimal. « 2 500 cm³ » ne se convertit pas en dm³ ; « 3 000 cm³ » si.
 * - Les angles se nomment d'après leur mesure en degrés : aigu (moins de quatre-vingt-dix), droit (quatre-vingt-dix), obtus (entre quatre-vingt-dix et cent
 *   quatre-vingts), plat (cent quatre-vingts). L'angle plat n'est servi qu'à partir du deuxième palier. Aucun angle n'est mesuré, ni dessiné, ni nul.
 * - Les erreurs d'enfant : additionner les dimensions, prendre l'aire d'une face pour le volume, multiplier l'arête par trois, se tromper d'un facteur dix ou
 *   cent dans une conversion, laisser le nombre sans changer l'unité.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES LONGUEURS ET LES VOLUMES D'UN SOLIDE
// ===========================================================================

type Length = "cm" | "dm" | "m";
const CUBIC: Record<Length, string> = { cm: "cm³", dm: "dm³", m: "m³" };

/** L'unité de longueur et la plage des dimensions entières servies à chaque palier. */
const SOLID: Record<Step, { unit: Length; lo: number; hi: number }> = {
  1: { unit: "cm", lo: 2, hi: 5 },
  2: { unit: "cm", lo: 2, hi: 9 },
  3: { unit: "dm", lo: 2, hi: 10 },
  4: { unit: "cm", lo: 10, hi: 30 },
  5: { unit: "m", lo: 2, hi: 12 },
};

type Box = { unit: Length; length: number; width: number; height: number; volume: number };

/** Un pavé droit de trois dimensions entières, de la plus grande à la plus petite, qui ne sont pas toutes égales (ce serait un cube). */
function drawBox(ctx: GameContext): Box {
  const { unit, lo, hi } = SOLID[stepOf(ctx)];
  for (let attempt = 0; attempt < 200; attempt++) {
    const dims = [randomInt(ctx.rng, lo, hi), randomInt(ctx.rng, lo, hi), randomInt(ctx.rng, lo, hi)].sort((a, b) => b - a);
    if (dims[0] === dims[2]) continue;
    return { unit, length: dims[0], width: dims[1], height: dims[2], volume: dims[0] * dims[1] * dims[2] };
  }
  return { unit, length: lo + 2, width: lo + 1, height: lo, volume: (lo + 2) * (lo + 1) * lo };
}

/** Un cube : l'unité et l'arête. */
function drawCube(ctx: GameContext): { unit: Length; edge: number; volume: number } {
  const { unit, lo, hi } = SOLID[stepOf(ctx)];
  const edge = randomInt(ctx.rng, lo, Math.min(hi, unit === "cm" && lo >= 10 ? 20 : hi));
  return { unit, edge, volume: edge ** 3 };
}

const inCubic = (n: number, unit: Length) => `${show(n)} ${CUBIC[unit]}`;
/** Les deux mauvais choix d'un volume : les erreurs d'enfant d'abord, les voisins ensuite, jamais un nombre de `avoid`. */
function wrongVolumes(ctx: GameContext, answer: number, pool: readonly number[], avoid: readonly number[], format: (n: number) => string): string[] {
  return wrongNumbers(ctx, answer, pool, 1, Math.max(answer * 3, 20), avoid).map((text) => format(Number(text.replace(/ /g, ""))));
}

/** « Un pavé droit mesure 5 cm sur 4 cm sur 3 cm. Quel est son volume ? » : la longueur fois la largeur fois la hauteur. */
export function makeCm2VolBox(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vol-pave", "calculer le volume d'un pavé droit", () => {
    const box = drawBox(ctx);
    const { length, width, height, volume, unit } = box;
    // Les erreurs d'enfant : additionner les dimensions, prendre l'aire de la base, l'aire de toutes les faces, ajouter la hauteur à l'aire de la base.
    const pool = [length + width + height, length * width, 2 * (length * width + width * height + length * height), length * width + height];
    return {
      prompt: `Un pavé droit mesure ${length} ${unit} sur ${width} ${unit} sur ${height} ${unit}. Quel est son volume ?`,
      answer: inCubic(volume, unit),
      wrong: wrongVolumes(ctx, volume, pool, [length, width, height], (n) => inCubic(n, unit)),
      hints: [
        "Le volume d'un pavé droit est la place qu'il occupe.",
        "Pour le calculer, multiplie la longueur, la largeur et la hauteur.",
        "Écris le résultat avec l'unité de volume qui correspond aux longueurs.",
      ],
    };
  });
}

/** « Un cube a une arête de 4 cm. Quel est son volume ? » : l'arête multipliée trois fois par elle-même. */
export function makeCm2VolCube(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vol-cube", "calculer le volume d'un cube", () => {
    const { unit, edge, volume } = drawCube(ctx);
    // Les erreurs d'enfant : multiplier l'arête par trois, la multiplier deux fois seulement, par six (les faces), la doubler.
    const pool = [edge * 3, edge * edge, edge * 6, edge * 2, edge * edge * 2];
    return {
      prompt: `Un cube a une arête de ${edge} ${unit}. Quel est son volume ?`,
      answer: inCubic(volume, unit),
      wrong: wrongVolumes(ctx, volume, pool, [edge], (n) => inCubic(n, unit)),
      hints: [
        "Un cube a ses trois dimensions égales à son arête.",
        "Pour calculer son volume, multiplie l'arête trois fois par elle-même.",
        "Écris le résultat avec l'unité de volume qui correspond à l'arête.",
      ],
    };
  });
}

/** Une phrase à trou : une dimension d'un pavé droit, ou l'arête d'un cube, d'après le volume. */
export function makeCm2VolGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-vol-trou", "trouver une dimension d'après le volume", () => {
    if (ctx.rng() < 0.5) {
      const box = drawBox(ctx);
      const { length, width, height, volume, unit } = box;
      // Les erreurs d'enfant : diviser par une seule dimension, par la somme, se tromper d'un cran.
      const pool = [volume / length, volume / (length + width), height + 1, height - 1, length * width];
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un pavé droit de volume ${inCubic(volume, unit)} a une longueur de ${length} ${unit} et une largeur de ${width} ${unit}. Sa hauteur est ___ ${unit}.`,
        answer: show(height),
        wrong: wrongNumbers(ctx, height, pool, 1, Math.max(height * 4, 12), [length, width, volume]),
        hints: [
          "Le volume est le produit de la longueur, de la largeur et de la hauteur.",
          "Pour trouver une dimension, divise le volume par le produit des deux autres.",
          "Calcule d'abord le produit des deux dimensions connues.",
        ],
      };
    }
    const { unit, edge, volume } = drawCube(ctx);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Un cube de volume ${inCubic(volume, unit)} a une arête de ___ ${unit}.`,
      answer: show(edge),
      wrong: wrongNumbers(ctx, edge, [volume / 3, edge + 1, edge - 1, edge * edge, Math.round(volume / edge)], 1, Math.max(edge * 4, 12), [volume]),
      hints: ["Un cube a ses trois dimensions égales.", "Cherche le nombre qui, multiplié trois fois par lui-même, donne le volume.", "Essaie les petits nombres l'un après l'autre."],
    };
  });
}

/** « Un cube a une arête de 6 cm. Écris son volume en cm³. » : une réponse à écrire. */
export function makeCm2VolWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-vol-ecrire", () => {
    const cube = ctx.rng() < 0.5;
    const box = drawBox(ctx);
    const { unit } = box;
    const edge = drawCube(ctx).edge;
    const volume = cube ? edge ** 3 : box.volume;
    return {
      type: "short-answer",
      prompt: cube ? `Un cube a une arête de ${edge} ${unit}. Écris son volume en ${CUBIC[unit]}.` : `Un pavé droit mesure ${box.length} ${unit} sur ${box.width} ${unit} sur ${box.height} ${unit}. Écris son volume en ${CUBIC[unit]}.`,
      payload: { acceptedAnswers: [...new Set([show(volume), String(volume)])], game: originOf("cm2-vol-ecrire", ctx), concept: "écrire un volume" },
      answerKey: show(volume),
      hints: ["Le volume est la place que prend un solide.", cube ? "Multiplie l'arête trois fois par elle-même." : "Multiplie les trois dimensions.", "Écris seulement le nombre, sans l'unité."],
    };
  });
}

// ===========================================================================
// LES UNITÉS DE VOLUME
// ===========================================================================

type Volume = "cm³" | "dm³" | "m³" | "L";
/** La valeur d'une unité de volume en centimètres cubes : un litre vaut un décimètre cube. */
const IN_CM3: Record<Volume, number> = { "cm³": 1, "dm³": 1000, L: 1000, "m³": 1000000 };

/** Les conversions servies à chaque palier : le litre et le décimètre cube, puis les centimètres cubes, puis les mètres cubes. */
const CONVERSIONS: Record<Step, readonly (readonly [Volume, Volume])[]> = {
  1: [["dm³", "L"], ["L", "dm³"]],
  2: [["dm³", "L"], ["L", "dm³"], ["dm³", "cm³"], ["cm³", "dm³"]],
  3: [["dm³", "L"], ["L", "dm³"], ["dm³", "cm³"], ["cm³", "dm³"], ["L", "cm³"], ["cm³", "L"]],
  4: [["dm³", "cm³"], ["cm³", "dm³"], ["L", "cm³"], ["cm³", "L"], ["m³", "dm³"], ["dm³", "m³"], ["m³", "L"], ["L", "m³"]],
  5: [["dm³", "cm³"], ["cm³", "dm³"], ["L", "cm³"], ["cm³", "L"], ["m³", "dm³"], ["dm³", "m³"], ["m³", "L"], ["L", "m³"]],
};
const COUNT_TOP: Record<Step, number> = { 1: 9, 2: 9, 3: 20, 4: 50, 5: 90 };

/** Une conversion : le nombre de départ, son unité, l'unité d'arrivée et le résultat, toujours entier. */
function drawConversion(ctx: GameContext, from?: Volume, to?: Volume): { n: number; from: Volume; to: Volume; result: number } {
  const step = stepOf(ctx);
  const [a, b] = from && to ? [from, to] : pick(ctx.rng, CONVERSIONS[step]);
  // Le plus petit des deux nombres est tiré, l'autre s'en déduit par le facteur : jamais de virgule.
  const count = randomInt(ctx.rng, 2, COUNT_TOP[step]);
  if (IN_CM3[a] >= IN_CM3[b]) return { n: count, from: a, to: b, result: (count * IN_CM3[a]) / IN_CM3[b] };
  return { n: (count * IN_CM3[b]) / IN_CM3[a], from: a, to: b, result: count };
}

/** « Convertis 4 dm³ en cm³. » : un facteur de mille, ou rien entre le litre et le décimètre cube. */
export function makeCm2VolUnits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vol-unites", "convertir une unité de volume", () => {
    const { n, from, to, result } = drawConversion(ctx);
    // Les erreurs d'enfant : se tromper d'un facteur dix ou cent, oublier de changer le nombre.
    const pool = [result * 10, result / 10, result * 100, result / 100, n];
    return {
      prompt: `Convertis ${show(n)} ${from} en ${to}.`,
      answer: `${show(result)} ${to}`,
      wrong: wrongNumbers(ctx, result, pool, 1, Math.max(result * 100, 1000), [n]).map((text) => `${text} ${to}`),
      hints: ["Un litre est le volume d'un décimètre cube.", "Un décimètre cube contient mille centimètres cubes.", "Un mètre cube contient mille décimètres cubes."],
    };
  });
}

/** « Un aquarium en forme de pavé droit mesure 5 dm sur 4 dm sur 3 dm. Combien de litres d'eau contient-il quand il est plein ? » */
export function makeCm2VolContent(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vol-boite", "calculer une contenance en litres", () => {
    const step = stepOf(ctx);
    // Du palier 1 au 2 des décimètres, au palier 3 des dizaines de centimètres, aux paliers 4 et 5 des mètres.
    const unit: Length = step <= 2 ? "dm" : step === 3 ? "cm" : "m";
    const [lo, hi] = step === 1 ? [2, 5] : step === 2 ? [3, 8] : step === 3 ? [1, 5] : step === 4 ? [2, 4] : [2, 6];
    const scale = unit === "cm" ? 10 : 1;
    let dims: number[];
    do dims = [randomInt(ctx.rng, lo, hi), randomInt(ctx.rng, lo, hi), randomInt(ctx.rng, lo, hi)].sort((a, b) => b - a);
    while (dims[0] === dims[2]);
    const [length, width, height] = dims.map((d) => d * scale);
    // Le volume en litres : des dm³ tels quels, des cm³ divisés par mille, des m³ multipliés par mille.
    const litres = unit === "dm" ? length * width * height : unit === "cm" ? (length * width * height) / 1000 : length * width * height * 1000;
    const container = unit === "dm" ? "Un aquarium" : unit === "cm" ? "Une caisse" : "Une citerne";
    const full = unit === "m" ? "elle" : unit === "cm" ? "elle" : "il";
    const pool = unit === "dm" ? [length + width + height, litres * 10, litres / 10, length * width] : unit === "cm" ? [length * width * height, litres * 10, litres * 100, litres / 10] : [litres / 1000, litres / 10, litres * 10, litres / 100];
    return {
      prompt: `${container} en forme de pavé droit mesure ${length} ${unit} sur ${width} ${unit} sur ${height} ${unit}. Combien de litres d'eau contient-${full} quand ${full} est ${unit === "dm" ? "plein" : "pleine"} ?`,
      answer: `${show(litres)} L`,
      wrong: wrongNumbers(ctx, litres, pool, 1, Math.max(litres * 100, 1000), [length, width, height]).map((text) => `${text} L`),
      hints: [
        "La contenance d'un récipient est son volume.",
        "Calcule le volume en multipliant les trois dimensions.",
        "Un décimètre cube contient un litre, et un mètre cube contient mille litres.",
      ],
    };
  });
}

/** Quatre volumes de valeurs toutes différentes, dans au moins deux unités. Chaque tuile est « 2 500 cm³ », « 3 dm³ », « 4 L » ou « 2 m³ ». */
function volumeTiles(ctx: GameContext, count: number): { cm3: number; text: string }[] {
  const step = stepOf(ctx);
  const units: readonly Volume[] = step <= 2 ? ["cm³", "dm³"] : step === 3 ? ["cm³", "dm³", "L"] : ["cm³", "dm³", "L", "m³"];
  for (let attempt = 0; attempt < 500; attempt++) {
    const out = new Map<number, { cm3: number; text: string }>();
    let guard = 0;
    while (out.size < count && guard++ < 200) {
      const unit = pick(ctx.rng, units);
      const amount = unit === "cm³" ? randomInt(ctx.rng, 1, 18) * 500 : unit === "m³" ? randomInt(ctx.rng, 1, 3) : randomInt(ctx.rng, 1, 9);
      const cm3 = amount * IN_CM3[unit];
      if (unit === "cm³" && amount % 1000 === 0) continue;
      if (!out.has(cm3)) out.set(cm3, { cm3, text: `${show(amount)} ${unit}` });
    }
    const tiles = [...out.values()];
    if (tiles.length === count && new Set(tiles.map((tile) => tile.text.split(" ").pop())).size >= 2) return tiles;
  }
  return [
    { cm3: 1000, text: "1 dm³" },
    { cm3: 2500, text: "2 500 cm³" },
    { cm3: 3000, text: "3 L" },
    { cm3: 4000, text: "4 dm³" },
  ].slice(0, count);
}

/** « Range ces volumes, du plus petit au plus grand. » : quatre volumes dans des unités différentes. */
export function makeCm2VolOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-vol-ranger", "ranger des volumes", () => {
    const tiles = volumeTiles(ctx, 4);
    const ascending = ctx.rng() < 0.65;
    return {
      prompt: ascending ? "Range ces volumes, du plus petit au plus grand." : "Range ces volumes, du plus grand au plus petit.",
      sequence: [...tiles].sort((a, b) => (ascending ? a.cm3 - b.cm3 : b.cm3 - a.cm3)).map((tile) => tile.text),
      hints: ["Change tous les volumes dans la même unité.", "Un litre vaut un décimètre cube, soit mille centimètres cubes.", ascending ? "Mets d'abord le plus petit volume." : "Mets d'abord le plus grand volume."],
    };
  });
}

/** « Relie chaque volume à son égal. » : trois volumes de valeurs différentes, écrits dans deux unités. */
export function makeCm2VolLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-vol-relier", "relier deux écritures d'un même volume", () => {
    const pairs = new Map<number, { left: string; right: string }>();
    let guard = 0;
    while (pairs.size < 3 && guard++ < 500) {
      const { n, from, to, result } = drawConversion(ctx);
      const cm3 = n * IN_CM3[from];
      if (!pairs.has(cm3)) pairs.set(cm3, { left: `${show(n)} ${from}`, right: `${show(result)} ${to}` });
    }
    const out = [...pairs.values()];
    return {
      prompt: "Relie chaque volume à son égal.",
      pairs: out,
      hints: ["Change les volumes dans la même unité pour les comparer.", "Un litre vaut un décimètre cube, soit mille centimètres cubes.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

// ===========================================================================
// LES ANGLES
// ===========================================================================

/** Les mesures servies à chaque palier : des angles faciles, puis proches de l'angle droit. Jamais zéro, jamais plus de cent quatre-vingts. */
const ANGLES: Record<Step, readonly number[]> = {
  1: [30, 45, 60, 90, 120, 135, 150],
  2: [20, 40, 70, 90, 100, 110, 140, 160, 180],
  3: [10, 80, 85, 90, 95, 105, 170, 180],
  4: [5, 15, 88, 89, 90, 91, 92, 175, 179, 180],
  5: [5, 15, 88, 89, 90, 91, 92, 175, 179, 180],
};

const ANGLE_NAMES = { acute: "Un angle aigu", right: "Un angle droit", obtuse: "Un angle obtus", flat: "Un angle plat" } as const;
const angleKind = (degrees: number) => (degrees < 90 ? "acute" : degrees === 90 ? "right" : degrees < 180 ? "obtuse" : "flat");

/** « Comment s'appelle un angle de 135 degrés ? » : aigu, droit, obtus ou plat. */
export function makeCm2VolAngle(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-vol-angle", "nommer un angle d'après sa mesure", () => {
    const step = stepOf(ctx);
    const degrees = pick(ctx.rng, ANGLES[step]);
    const right = angleKind(degrees);
    // L'angle plat n'est proposé comme mauvais choix qu'à partir du deuxième palier.
    const names = (step === 1 ? ["acute", "right", "obtuse"] : ["acute", "right", "obtuse", "flat"]) as (keyof typeof ANGLE_NAMES)[];
    const others = shuffle(ctx.rng, names.filter((name) => name !== right)).slice(0, 2);
    return {
      prompt: `Comment s'appelle un angle de ${degrees} degrés ?`,
      answer: ANGLE_NAMES[right],
      wrong: others.map((name) => ANGLE_NAMES[name]),
      hints: [
        "Une équerre dessine un angle de quatre-vingt-dix degrés.",
        "Un angle plus petit que celui de l'équerre est aigu, et un angle plus grand est obtus.",
        "Deux côtés alignés forment un angle de cent quatre-vingts degrés.",
      ],
    };
  });
}

/** « Glisse chaque angle dans la bonne case. » : deux angles aigus, deux angles obtus, jamais un angle droit ni plat. */
export function makeCm2VolSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-vol-glisser", "classer des angles", () => {
    const step = stepOf(ctx);
    const pool = ANGLES[step].filter((degrees) => degrees !== 90 && degrees !== 180);
    const acute = shuffle(ctx.rng, pool.filter((degrees) => degrees < 90)).slice(0, 2);
    const obtuse = shuffle(ctx.rng, pool.filter((degrees) => degrees > 90)).slice(0, 2);
    const zones: readonly [string, string] = ["Angle aigu", "Angle obtus"];
    return {
      prompt: "Glisse chaque angle dans la bonne case.",
      zones,
      items: [...acute.map((degrees) => ({ text: `${degrees} degrés`, zone: zones[0] })), ...obtuse.map((degrees) => ({ text: `${degrees} degrés`, zone: zones[1] }))],
      hints: ["Compare chaque angle à l'angle droit.", "Un angle droit mesure quatre-vingt-dix degrés.", "Un angle plus petit que l'angle droit est aigu, plus grand il est obtus."],
    };
  });
}
