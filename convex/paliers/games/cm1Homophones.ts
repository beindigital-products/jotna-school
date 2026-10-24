/**
 * LES GABARITS DES HOMOPHONES GRAMMATICAUX DU CM1 : a/à, et/est, on/ont, son/sont, ou/où, ces/ses, ce/se, leur/leurs, mais/mes, la/l'a/là (`fr-cm1-homophones`).
 *
 * Sur l'échantillon de CM1 lu le 23 octobre 2026, le modèle écrivait ici des phrases à deux bonnes réponses (« Awa ___ la fièvre » entre « a » et « à » sans
 * contexte), des astuces fausses (« remplace ou par ou bien » pour un lieu) et des trous sans réponse unique. Ici chaque exercice est BÂTI à partir d'une
 * banque fermée de soixante phrases, dix familles de six : le mot qui manque est le seul qui convienne, parce que la phrase ne laisse qu'une lecture et
 * que les deux autres choix sont des mots de la même famille que l'astuce de remplacement écarte.
 *
 * LES PIÈGES DU FRANÇAIS QUE CETTE BANQUE ÉVITE
 * - Une phrase n'a qu'un bon mot : « Awa ___ un livre » (a) n'accepte pas « à », et « as » ne va qu'avec « tu ». Les phrases où deux mots conviennent (« Il ___ le roi » entre
 *   est et et, « Regarde ___ oiseaux » entre ces et ses) ne sont pas dans la banque.
 * - « ses » ne s'emploie que quand le sujet possède ce qu'il touche, une partie de lui ou de sa famille (« Omar embrasse ses parents », « Awa lave ses mains »), jamais pour un objet
 *   qu'on peut montrer ; « ces » ouvre la phrase (« Ces enfants jouent »).
 * - « leur » devant un nom au singulier ou devant un verbe, « leurs » devant un nom au pluriel : les phrases du trou ne mettent « leur » que devant un nom.
 * - « mais » après une virgule, « mes » devant un nom à moi. « où » en tête de question ou après un lieu (« la maison où »).
 * - Le trou ne montre qu'une apostrophe droite au plus : « J'aime le riz, ___ pas le mil » et « l'a » comme choix ne se rencontrent pas dans le même trou.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Grammaire.ts` (une apostrophe droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot de quatre lettres
 * ou plus d'une bonne réponse, d'une option ou d'une tuile).
 *
 * HORS FICHE, À FAIRE RELIRE : les soixante phrases de la banque, les onze astuces de remplacement, les quatre-vingt-dix glissés.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Question, ce2Sort, ce2Write, gr, hints, qr, wr, type GapRow, type Hints, type LinkRow, type QuestionRow, type SortRow, type WriteRow } from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

export type Family = "a/à" | "et/est" | "on/ont" | "son/sont" | "ou/où" | "ces/ses" | "ce/se" | "leur/leurs" | "mais/mes" | "la/l'a/là";
export type Homophone = { text: string; answer: string; family: Family };

/** Les trois mots d'une famille : le troisième est un mot plausible que la phrase écarte toujours (« as » pour un sujet qui n'est pas « tu »). */
export const FAMILIES: Record<Family, readonly [string, string, string]> = {
  "a/à": ["a", "à", "as"],
  "et/est": ["et", "est", "es"],
  "on/ont": ["on", "ont", "an"],
  "son/sont": ["son", "sont", "sons"],
  "ou/où": ["ou", "où", "au"],
  "ces/ses": ["ces", "ses", "ce"],
  "ce/se": ["ce", "se", "me"],
  "leur/leurs": ["leur", "leurs", "eux"],
  "mais/mes": ["mais", "mes", "mets"],
  "la/l'a/là": ["la", "l'a", "là"],
};
const hom = (family: Family, text: string, answer: string): Homophone => ({ text, answer, family });

/** Soixante phrases, six par famille, deux familles par palier. */
export const BANK: readonly Homophone[] = [
  // Palier 1.
  hom("a/à", "Awa ___ un beau livre.", "a"),
  hom("a/à", "Moussa va ___ Dakar.", "à"),
  hom("a/à", "Le chat ___ faim.", "a"),
  hom("a/à", "Fatou parle ___ sa tante.", "à"),
  hom("a/à", "Mon frère ___ deux sœurs.", "a"),
  hom("a/à", "Omar pense ___ ses amis.", "à"),
  hom("et/est", "Awa ___ Moussa jouent dans la cour.", "et"),
  hom("et/est", "Le chef ___ fatigué.", "est"),
  hom("et/est", "Moussa paraît grand ___ fort.", "et"),
  hom("et/est", "Mon frère ___ sur la natte.", "est"),
  hom("et/est", "Fatou ___ Khady chantent.", "et"),
  hom("et/est", "La soupe ___ très chaude.", "est"),
  // Palier 2.
  hom("on/ont", "Les enfants ___ un ballon.", "ont"),
  hom("on/ont", "Alors ___ mange le riz.", "on"),
  hom("on/ont", "Les pêcheurs ___ lancé le filet.", "ont"),
  hom("on/ont", "Dans mon village, ___ danse le samedi.", "on"),
  hom("on/ont", "Elles ___ fini leur devoir.", "ont"),
  hom("on/ont", "Ensuite, ___ rentre à la maison.", "on"),
  hom("son/sont", "Les mangues ___ mûres.", "sont"),
  hom("son/sont", "Pape range ___ cahier.", "son"),
  hom("son/sont", "Ils ___ partis tôt.", "sont"),
  hom("son/sont", "Awa lave ___ petit frère.", "son"),
  hom("son/sont", "Les cousines ___ gentilles.", "sont"),
  hom("son/sont", "Omar cherche ___ ballon.", "son"),
  // Palier 3.
  hom("ou/où", "Veux-tu du thé ___ du lait ?", "ou"),
  hom("ou/où", "___ habites-tu ?", "où"),
  hom("ou/où", "Awa ___ Moussa viendra demain.", "ou"),
  hom("ou/où", "Voici la maison ___ j'habite.", "où"),
  hom("ou/où", "Prends la rouge ___ la verte.", "ou"),
  hom("ou/où", "Le village ___ je suis né est calme.", "où"),
  hom("ces/ses", "___ enfants jouent dans la cour.", "ces"),
  hom("ces/ses", "Awa lave ___ mains.", "ses"),
  hom("ces/ses", "___ belles mangues viennent du marché.", "ces"),
  hom("ces/ses", "Omar embrasse ___ parents.", "ses"),
  hom("ces/ses", "___ petits poissons nagent dans la mer.", "ces"),
  hom("ces/ses", "Fatou brosse ___ dents.", "ses"),
  // Palier 4.
  hom("ce/se", "Il ___ lave les mains.", "se"),
  hom("ce/se", "___ matin, il fait chaud.", "ce"),
  hom("ce/se", "Awa ___ promène sur la plage.", "se"),
  hom("ce/se", "Moussa lit ___ livre.", "ce"),
  hom("ce/se", "Les enfants ___ couchent tôt.", "se"),
  hom("ce/se", "Je connais ___ garçon.", "ce"),
  hom("leur/leurs", "Les enfants rangent ___ livres.", "leurs"),
  hom("leur/leurs", "Les pêcheurs lavent ___ filet.", "leur"),
  hom("leur/leurs", "Elles aiment ___ maîtresse.", "leur"),
  hom("leur/leurs", "Les cousins cherchent ___ chaussures.", "leurs"),
  hom("leur/leurs", "Les villageois aiment ___ village.", "leur"),
  hom("leur/leurs", "Les élèves ouvrent ___ cahiers.", "leurs"),
  // Palier 5.
  hom("mais/mes", "Je voudrais jouer, ___ il pleut.", "mais"),
  hom("mais/mes", "Je range ___ affaires.", "mes"),
  hom("mais/mes", "Il est petit, ___ il court vite.", "mais"),
  hom("mais/mes", "Je lave ___ mains.", "mes"),
  hom("mais/mes", "J'aime le riz, ___ pas le mil.", "mais"),
  hom("mais/mes", "J'ai perdu ___ clés.", "mes"),
  hom("la/l'a/là", "Awa ___ vu hier.", "l'a"),
  hom("la/l'a/là", "Moussa lave ___ voiture.", "la"),
  hom("la/l'a/là", "Pose-le ___ !", "là"),
  hom("la/l'a/là", "Pape ___ lu en entier.", "l'a"),
  hom("la/l'a/là", "Regarde ___ maison bleue.", "la"),
  hom("la/l'a/là", "Le livre ? Il est ___ !", "là"),
];

const CONCEPT = "ne pas confondre les homophones grammaticaux";
const wrongOf = (entry: Homophone): [string, string] => FAMILIES[entry.family].filter((word) => word !== entry.answer) as [string, string];
/** La phrase avec son mot : une majuscule quand le trou ouvre la phrase (« Ces enfants »). */
const filled = (entry: Homophone, word: string) => {
  const sentence = entry.text.replace("___", word);
  return entry.text.startsWith("___") ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : sentence;
};
const cycle = <T,>(items: readonly T[], index: number): T => items[((index % items.length) + items.length) % items.length];

/** Trois indices par famille : le dernier donne l'astuce de remplacement, jamais un mot du choix. */
export const FAMILY_HINTS: Record<Family, Hints> = {
  "a/à": hints("Cherche si le mot est un verbe ou un petit mot qui relie.", "Essaie de dire « avait » à la place du mot.", "Si « avait » va, le mot s'écrit sans accent."),
  "et/est": hints("Cherche si le mot relie deux mots ou fait partie du verbe.", "Essaie de dire « était » à la place du mot.", "Si « était » va, écris le verbe être."),
  "on/ont": hints("Cherche si le mot est un pronom ou un verbe.", "Essaie de dire « il » ou « avaient » à la place du mot.", "Après ils ou elles, le verbe avoir s'écrit avec un t."),
  "son/sont": hints("Cherche si le mot parle d'une possession ou s'il est un verbe.", "Essaie de dire « mon » ou « étaient » à la place du mot.", "Si « étaient » va, le mot est le verbe être."),
  "ou/où": hints("Cherche si le mot indique un lieu ou un choix.", "Essaie de dire « ou bien » à la place du mot.", "Si « ou bien » va, écris le mot sans accent."),
  "ces/ses": hints("Cherche si le mot montre quelque chose ou s'il dit ce qui appartient à quelqu'un.", "Essaie de dire « mes » ou « ce » à la place du mot.", "Avec « mes », on écrit ses ; avec « ce », on écrit ces."),
  "ce/se": hints("Cherche si le mot est devant un nom ou devant un verbe.", "Essaie de dire « me » à la place du mot.", "Si « me » va, le mot s'écrit avec un s."),
  "leur/leurs": hints("Regarde le nom qui suit le mot.", "Cherche s'il y a un seul objet ou plusieurs.", "Un nom pluriel demande la marque du pluriel."),
  "mais/mes": hints("Cherche si le mot relie deux idées ou s'il annonce un nom.", "Essaie de dire « tes » à la place du mot.", "Si « tes » va, écris le mot avec un e."),
  "la/l'a/là": hints("Cherche si le mot annonce un nom, un verbe ou un lieu.", "Essaie de dire « l'avait » à la place du mot.", "Si « l'avait » va, le mot est écrit en deux lettres avec une apostrophe."),
};

// ---------------------------------------------------------------------------
// Compléter la phrase, la choisir, trouver l'erreur, écrire le mot
// ---------------------------------------------------------------------------

export const GAP_ROWS: readonly GapRow[] = BANK.map((entry, index) => gr(entry.text, entry.answer, wrongOf(entry), FAMILY_HINTS[entry.family], `hom:${index}`));
export function makeCm1HomGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "cm1-hom-trou", CONCEPT, GAP_ROWS, 3);
}

const PHRASE_HINTS = hints("Lis chaque phrase à voix haute.", "Trouve le mot qui change d'une phrase à l'autre.", "Essaie de remplacer ce mot pour vérifier.");
export const PHRASE_ROWS: readonly QuestionRow[] = BANK.map((entry, index) => qr("Quelle phrase est bien écrite ?", filled(entry, entry.answer), wrongOf(entry).map((word) => filled(entry, word)) as [string, string], PHRASE_HINTS, `hom:${index}`));
export function makeCm1HomPhrase(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-hom-phrase", CONCEPT, PHRASE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`);
}

const FAMILY_WORDS = new Set(Object.values(FAMILIES).flat());
const ERROR_HINTS = hints("Lis la phrase à voix haute.", "Trouve le mot qui peut s'écrire de plusieurs façons.", "Essaie de le remplacer par un mot qui sonne pareil pour vérifier.");
/** « Mon frère à deux sœurs. » : le mot mal écrit et deux autres mots de la phrase (hors famille). */
function errorRow(entry: Homophone, index: number): QuestionRow | null {
  const wrong = cycle(wrongOf(entry), index);
  const sentence = filled(entry, wrong);
  // Le mot s'écrit comme dans la phrase : avec une majuscule quand le trou ouvre la phrase.
  const shown = entry.text.startsWith("___") ? wrong.charAt(0).toUpperCase() + wrong.slice(1) : wrong;
  const tokens = sentence.match(/[\p{L}'-]+/gu) ?? [];
  const others = tokens.filter((token) => !FAMILY_WORDS.has(token.toLowerCase()) && token.length >= Math.ceil(wrong.length / 2) && token.length >= 3 && token !== shown);
  if (others.length < 2) return null;
  const first = others[0];
  const second = others[others.length - 1];
  if (first === second) return null;
  return qr(`Quel mot est mal écrit dans la phrase « ${sentence} » ?`, shown, [first, second], ERROR_HINTS, `hom:${index}`);
}
export const ERROR_ROWS: readonly QuestionRow[] = BANK.flatMap((entry, index) => {
  const row = errorRow(entry, index);
  return row ? [row] : [];
});
export function makeCm1HomError(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-hom-erreur", CONCEPT, ERROR_ROWS, 1, (row) => row.prompt);
}

export const WRITE_ROWS: readonly WriteRow[] = BANK.map((entry, index) =>
  wr(`Écris le mot qui manque dans la phrase « ${entry.text} ».`, entry.answer === "l'a" ? ["l'a", "l’a"] : [entry.answer], FAMILY_HINTS[entry.family], `hom:${index}`),
);
export function makeCm1HomWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "cm1-hom-ecrire", CONCEPT, WRITE_ROWS, 2);
}

// ---------------------------------------------------------------------------
// Glisser des phrases dans deux mots de la famille
// ---------------------------------------------------------------------------

const SORT_HINTS = hints("Lis chaque phrase en pensant au mot qui manque.", "Essaie de remplacer le trou par un mot qui sonne pareil.", "Classe d'abord les phrases dont tu es sûr.");
const FAMILY_ORDER: readonly Family[] = ["a/à", "et/est", "on/ont", "son/sont", "ou/où", "ces/ses", "ce/se", "leur/leurs", "mais/mes", "la/l'a/là"];
function sortRows(): SortRow[] {
  return FAMILY_ORDER.flatMap((family) => {
    const members = BANK.filter((entry) => entry.family === family);
    const words = FAMILIES[family];
    const textsOf = (word: string) => members.filter((entry) => entry.answer === word).map((entry) => entry.text);
    const pairs: (readonly [string, string])[] = family === "la/l'a/là" ? [["la", "l'a"], ["la", "là"], ["l'a", "là"]] : [[words[0], words[1]], [words[0], words[1]], [words[0], words[1]]];
    return pairs.map(([left, right], k) => {
      const pick = (word: string) => {
        const texts = textsOf(word);
        return [cycle(texts, k), cycle(texts, k + 1)];
      };
      return {
        prompt: "Lis chaque phrase et glisse-la dans la bonne case.",
        zones: [left, right] as const,
        items: [...pick(left).map((text) => ({ text, zone: left })), ...pick(right).map((text) => ({ text, zone: right }))],
        hints: SORT_HINTS,
      };
    });
  });
}
export const SORT_ROWS: readonly SortRow[] = sortRows();
export function makeCm1HomSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "cm1-hom-glisser", CONCEPT, SORT_ROWS);
}

// ---------------------------------------------------------------------------
// L'astuce de remplacement
// ---------------------------------------------------------------------------

/** Le mot qui prend la place d'un homophone pour vérifier, et la famille de ce remplaçant. */
export const TRICKS: Record<string, { trick: string; kind: "verbe" | "déterminant" | "autre" }> = {
  a: { trick: "avait", kind: "verbe" },
  est: { trick: "était", kind: "verbe" },
  ont: { trick: "avaient", kind: "verbe" },
  sont: { trick: "étaient", kind: "verbe" },
  "l'a": { trick: "l'avait", kind: "verbe" },
  son: { trick: "mon", kind: "déterminant" },
  ses: { trick: "mes", kind: "déterminant" },
  mes: { trick: "tes", kind: "déterminant" },
  on: { trick: "il", kind: "autre" },
  et: { trick: "et puis", kind: "autre" },
  ou: { trick: "ou bien", kind: "autre" },
  se: { trick: "me", kind: "autre" },
};
const TRICK_HINTS = hints("Pense à la phrase sans le mot.", "Cherche un mot qui garde le sens de la phrase.", "Le mot de remplacement s'accorde avec le sujet.");
/** Deux remplaçants d'une autre famille que la bonne, dont un assez long pour que la bonne réponse ne se détache pas. */
function wrongTricks(word: string, index: number): [string, string] {
  const right = TRICKS[word];
  const pool = Object.entries(TRICKS)
    .filter(([other, value]) => other !== word && value.kind !== right.kind && value.trick !== right.trick)
    .map(([, value]) => value);
  const long = pool.filter((value) => value.trick.length * 2 >= right.trick.length);
  const first = cycle(long, index);
  const rest = pool.filter((value) => value.trick !== first.trick && value.kind !== first.kind);
  const second = cycle(rest.length > 0 ? rest : pool.filter((value) => value.trick !== first.trick), index);
  return [first.trick, second.trick];
}
export const TRICK_ROWS: readonly QuestionRow[] = BANK.flatMap((entry, index) => {
  const trick = TRICKS[entry.answer];
  // « l'a » a une apostrophe de trop dans l'énoncé qui cite le mot.
  if (!trick || entry.answer === "l'a") return [];
  const sentence = filled(entry, entry.answer);
  return [qr(`Lis la phrase « ${sentence} ». Par quel mot peut-on remplacer « ${entry.answer} » pour vérifier ?`, trick.trick, wrongTricks(entry.answer, index), TRICK_HINTS, `hom:${index}`)];
});
export function makeCm1HomTrick(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-hom-astuce", CONCEPT, TRICK_ROWS, 1, (row) => row.prompt);
}

// ---------------------------------------------------------------------------
// Relier un homophone à son remplaçant
// ---------------------------------------------------------------------------

const LINK_HINTS = hints("Débute par le mot dont tu connais le remplaçant.", "Un verbe se remplace par une autre forme du même verbe.", "Un petit mot se remplace par un mot de la même famille.");
/** Les couples qui ne se prêtent pas à une paire : « ses » et « mes » acceptent tous deux « tes », « et » accepte « et puis » ou « ensuite ». */
const LINK_WORDS = ["a", "est", "ont", "sont", "l'a", "son", "ses", "on", "ou", "se", "et"] as const;
function linkRows(): LinkRow[] {
  const triples: string[][] = [];
  for (let i = 0; i < LINK_WORDS.length; i++) {
    for (let j = i + 1; j < LINK_WORDS.length; j++) {
      for (let k = j + 1; k < LINK_WORDS.length; k++) triples.push([LINK_WORDS[i], LINK_WORDS[j], LINK_WORDS[k]]);
    }
  }
  const step = triples.length / 30;
  return Array.from({ length: 30 }, (_, row) => triples[Math.floor(row * step)]).map((words) => ({
    prompt: "Lis chaque mot et relie-le au mot qui peut le remplacer.",
    pairs: words.map((word) => ({ left: word, right: TRICKS[word].trick })),
    hints: LINK_HINTS,
  }));
}
export const LINK_ROWS: readonly LinkRow[] = linkRows();
export function makeCm1HomLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "cm1-hom-relier", CONCEPT, LINK_ROWS);
}
