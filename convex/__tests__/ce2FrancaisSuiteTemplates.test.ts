import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LE FRANÇAIS DU CE2, SECONDE MOITIÉ : l'orthographe (féminin et pluriel des noms, ou et où, son et sont), le vocabulaire (synonymes, familles de mots,
 * homonymes, formules de lettre, ordre alphabétique), la lecture (une lettre, une affiche, un poème) (`fr-ce2-orthographe`, `fr-ce2-vocabulaire`,
 * `fr-ce2-lecture`).
 *
 * Ces tests ne relisent pas les tableaux des gabarits : ils RECALCULENT chaque réponse avec leurs propres règles et leurs propres tables.
 * - Le féminin (-on devient -onne, -er devient -ère, -eur devient -euse, -ien devient -ienne, sinon un e) et le pluriel (-al devient -aux, -au et -eu
 *   prennent x, sinon un s) sont des RÈGLES, appliquées au mot de l'énoncé.
 * - son et sont, ou et où : une règle (un nom derrière « son », deux mots du même genre autour de « ou »), plus une table de contextes pour les trous.
 * - Les synonymes, les familles de mots et les homonymes sont des tables de classes ; l'ordre alphabétique est celui du tri français.
 * - Une lettre, une affiche et un poème sont LUS dans l'énoncé : le test relit le texte (la dernière ligne, la ligne après « Cher », le nombre de blancs
 *   entre deux strophes) et recalcule la réponse ; les rimes se comparent par le son de la fin du mot, dans une table.
 * À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, puis son énoncé, et chaque vérification doit le voir.
 * L'échantillon du modèle comptait 20 exercices faux ou creux sur 30 en orthographe, vocabulaire et lecture du CE2 (« Combien de strophes a ce poème ? »
 * sans poème, « Quel est le synonyme de rapide ? » avec « vite », « ___ (ils/ils sont) là »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2fr2:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);
const VS16 = String.fromCharCode(0xfe0f);
const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const wordsOf = (text: string): string[] => text.toLowerCase().replace(/’/g, "'").match(/[\p{L}]+(?:-[\p{L}]+)*'?/gu) ?? [];

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
const quoted = (prompt: string, index = 1) => [...prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1])[index - 1] ?? "";
/** Les options d'un trou sans la bonne réponse. */
const blankWrongs = (exo: Exo) => blankOf(exo).options.filter((option) => option !== blankOf(exo).answer);

// ===========================================================================
// L'ORTHOGRAPHE : des règles, pas des tableaux
// ===========================================================================

/** Le féminin d'un nom, par la règle de la fiche et ses cas : -on devient -onne, -ien devient -ienne, -er devient -ère, -eur devient -euse, sinon un e. */
function feminineByRule(masculine: string): string {
  if (masculine === "maître") return "maîtresse";
  if (masculine.endsWith("ien") || masculine.endsWith("on")) return `${masculine}ne`;
  if (masculine.endsWith("er")) return `${masculine.slice(0, -2)}ère`;
  if (masculine.endsWith("eur")) return `${masculine.slice(0, -3)}euse`;
  return `${masculine}e`;
}
/** Le pluriel d'un nom, par la règle de la fiche : -al devient -aux, -au et -eu prennent x, sinon un s. */
function pluralByRule(singular: string): string {
  if (singular.endsWith("al")) return `${singular.slice(0, -2)}aux`;
  if (singular.endsWith("au") || singular.endsWith("eu")) return `${singular}x`;
  return `${singular}s`;
}
/** Les noms qui peuvent suivre « son » dans les phrases (un nom derrière le petit mot : c'est « son », sinon c'est le verbe « sont »). */
const NOUNS_AFTER_SON = new Set(["cahier", "sac", "frère", "crayon", "vélo", "père", "riz"]);
const PLURAL_SUBJECTS = new Set(["ils", "elles"]);
/** « son » ou « sont » pour un petit mot suivi de `next` et précédé de `previous`. */
function sonOrSont(previous: string | undefined, next: string | undefined): "son" | "sont" {
  if (next !== undefined && NOUNS_AFTER_SON.has(next)) return "son";
  if (previous !== undefined && (PLURAL_SUBJECTS.has(previous) || previous.endsWith("s"))) return "sont";
  throw new Error(`ni son ni sont : ${previous} ___ ${next}`);
}
/** Les groupes de mots que « ou » relie : deux prénoms, deux boissons, deux couleurs, deux aliments. */
const ALTERNATIVES = [new Set(["fatou", "awa"]), new Set(["lait", "jus"]), new Set(["bleu", "rouge"]), new Set(["riz", "pain"]), new Set(["pied", "car"]), new Set(["fruit", "jus"])];
const PLACE_NOUNS = new Set(["village", "champ", "case", "puits"]);
/** « ou » (deux choses au choix autour du mot) ou « où » (un endroit : une question, ou un lieu que la phrase décrit). */
function ouOrOu(words: string[], at: number): "ou" | "où" {
  const previous = words[at - 1];
  const around = [previous, ...words.slice(at + 1, at + 4)].filter((word): word is string => word !== undefined);
  if (ALTERNATIVES.some((group) => around.filter((word) => group.has(word)).length >= 2)) return "ou";
  if (at === 0 || PLACE_NOUNS.has(previous ?? "") || previous === "pas") return "où";
  throw new Error(`ni ou ni où : ${words.join(" ")}`);
}
const homophoneWords = ["son", "sont", "ont", "ou", "où", "au"];

// ===========================================================================
// LE VOCABULAIRE : des classes écrites à part
// ===========================================================================

/** Les mots qui veulent dire presque la même chose : une classe par sens. */
const SYNONYM_CLASSES: readonly (readonly string[])[] = [
  ["heureux", "content"],
  ["triste", "malheureux"],
  ["beau", "joli"],
  ["finir", "terminer"],
  ["commencer", "débuter"],
  ["cadeau", "présent"],
  ["peur", "crainte"],
  ["courageux", "brave"],
  ["gentil", "aimable"],
  ["voiture", "auto"],
  ["malin", "rusé"],
  ["énorme", "immense"],
];
const classOf = (word: string) => SYNONYM_CLASSES.find((entry) => entry.includes(word));
const FAMILY_MEMBERS: Record<string, readonly string[]> = {
  terre: ["terrain", "enterrer", "terrasse", "atterrir", "terrestre"],
  dent: ["dentiste", "dentier", "denture", "dentifrice"],
  fleur: ["fleuriste", "fleurir", "fleuri"],
  lait: ["laitier", "laitage", "laiterie"],
  porte: ["portier", "portail", "portillon"],
  jardin: ["jardinier", "jardiner", "jardinage"],
  mer: ["marin", "marée", "maritime", "marine"],
  cuisine: ["cuisinier", "cuisiner", "cuisinière"],
  plume: ["plumage", "plumeau", "plumer"],
  danse: ["danseur", "danser", "danseuse"],
  chant: ["chanteur", "chanter", "chantre"],
  neige: ["neiger", "neigeux"],
};
const rootOf = (word: string) => Object.keys(FAMILY_MEMBERS).find((root) => FAMILY_MEMBERS[root].includes(word));
/** Pour chaque phrase à trou de la série vert, verre, vers, ver, mer, mère, maire : tous les mots de la série qui y tiennent. */
const VALID_HOMONYMS: Record<string, readonly string[]> = {
  "Il boit un ___ d'eau.": ["verre"],
  "Les bateaux naviguent sur la ___.": ["mer"],
  "Le feuillage du manguier est ___.": ["vert"],
  "Ma ___ prépare le repas.": ["mère", "maire"],
  "Awa court ___ la porte.": ["vers"],
  "Le ___ du village parle aux habitants.": ["maire"],
  "Un petit ___ sort de la terre.": ["ver"],
  "Les pêcheurs partent en ___.": ["mer", "vers"],
  "Le chemin va ___ le puits.": ["vers"],
  "La ___ de Moussa lui sourit.": ["mère", "maire"],
  "Le ___ s'est cassé sur la table.": ["verre"],
  "Le ___ signe un papier important.": ["maire"],
};
const OPENING_FORMULA = /^(?:Cher|Chère|Chers|Chères|Bonjour)(?![\p{L}])/u;

// ===========================================================================
// LA LECTURE : le test relit le texte
// ===========================================================================

/** Le son de la fin de chaque mot qui finit un vers : deux mots riment quand leur son est le même. */
const RHYME_SOUND: Record<string, string> = {
  jour: "uR", tour: "uR", doux: "u", genoux: "u", toit: "wa", moi: "wa", mer: "ER", terre: "ER", matin: "E~", chemin: "E~", ciel: "El", miel: "El", port: "OR", encore: "OR",
  nuit: "Ui", bruit: "Ui", plage: "aZ", visage: "aZ", fleur: "oeR", couleur: "oeR", soir: "waR", noir: "waR", natte: "at", patte: "at", maison: "o~", saison: "o~", dormir: "iR", souvenir: "iR",
};
const lastWordOf = (verse: string) => verse.replace(/[.,;!?]+$/u, "").split(" ").slice(-1)[0];
/** Les couples de vers du test, copiés à part des gabarits : le test vérifie que le trou d'un vers rend un couple qui existe. */
const COUPLETS: readonly (readonly [string, string])[] = [
  ["Au village il fait grand jour,", "les enfants font un tour."],
  ["Sous le baobab tout est doux,", "le vent berce mes genoux."],
  ["La pluie tombe sur le toit,", "elle chante près de moi."],
  ["Le soir descend sur la mer,", "les pêcheurs rentrent sur la terre."],
  ["Le coq chante au petit matin,", "il réveille tout le chemin."],
  ["Les oiseaux volent vers le ciel,", "ils goûtent le doux miel."],
  ["Le jour se lève sur le port,", "les bateaux dorment encore."],
  ["Une étoile brille dans la nuit,", "elle ne fait aucun bruit."],
  ["La lune éclaire la plage,", "le sable a un doux visage."],
  ["Dans mon jardin il y a une fleur,", "elle a une belle couleur."],
  ["Je la regarde chaque soir,", "elle brille sous le ciel noir."],
  ["Le chat dort sur la natte,", "il est doux comme une patte."],
  ["Le chien garde la maison,", "il aboie en toute saison."],
  ["Il est temps de dormir,", "je garde un doux souvenir."],
];
const SIGNATURES = new Set(["Awa", "Omar", "Khady", "Pape", "Mariama", "Ibou", "Rokhaya", "Seynabou", "Modou", "Abdou", "Dieynaba", "Alioune"]);
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type LetterParts = { place: string; date: string; salutation: string; dest: string; body: string; closing: string; sender: string; question: string };
function parseLetter(prompt: string): LetterParts {
  const [text, question] = prompt.split("\n\n");
  const lines = text.split("\n");
  const head = /^(.+), le (.+)\.$/u.exec(lines[0]);
  if (lines.length !== 5 || !head) throw new Error(`lettre mal formée : ${text}`);
  return {
    place: head[1],
    date: head[2],
    salutation: lines[1].replace(/,$/u, ""),
    dest: lines[1].replace(/,$/u, "").replace(/^(?:Cher|Chère) /u, ""),
    body: lines[2],
    closing: lines[3].replace(/,$/u, ""),
    sender: lines[4],
    question,
  };
}
type PosterParts = { title: string; place: string; when: string; price: string; question: string };
function parsePoster(prompt: string): PosterParts {
  const [text, question] = prompt.split("\n\n");
  const lines = text.split("\n");
  if (lines.length !== 4) throw new Error(`affiche mal formée : ${text}`);
  return { title: lines[0], place: lines[1], when: lines[2], price: lines[3], question };
}
/** Les noms féminins des tableaux du pluriel : tous les autres sont masculins. */
const FEMININE_NOUNS = new Set(["fille", "mangue"]);
const posterKind = (tile: string): "Où" | "Quand" | "Combien" => (/fcfa|gratuit/iu.test(tile) ? "Combien" : /heure|matin|soir/iu.test(tile) ? "Quand" : "Où");

// ===========================================================================
// LES VÉRIFICATIONS, UNE PAR GABARIT
// ===========================================================================

const CHECKS: Record<string, Check> = {
  // ----- Le féminin et le pluriel -----
  "ce2-ortho-feminin": (exo) => {
    const masculine = quoted(exo.prompt);
    const expected = feminineByRule(masculine);
    return all(ok(/^Quel est le féminin de « .+ » \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`), ok(rightOption(exo) === expected, `le féminin de « ${masculine} » est « ${expected} », pas « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== expected && option !== masculine), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-ortho-feminin-trou": (exo) => {
    const masculine = /^Un (.+), une ___\.$/u.exec(textOf(exo))?.[1] ?? "";
    const expected = feminineByRule(masculine);
    return all(ok(blankOf(exo).answer === expected, `le féminin de « ${masculine} » est « ${expected} », le trou dit « ${blankOf(exo).answer} »`), ok(blankWrongs(exo).length === 2 && blankWrongs(exo).every((option) => option !== expected && option !== masculine), `mauvais choix ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-ortho-feminin-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque nom à son féminin.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(feminineByRule(pair.left) === pair.right, `le féminin de « ${pair.left} » est « ${feminineByRule(pair.left)} », pas « ${pair.right} »`)),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-ortho-pluriel": (exo) => {
    const singular = quoted(exo.prompt);
    const expected = pluralByRule(singular);
    return all(ok(/^Quel est le pluriel de « .+ » \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`), ok(rightOption(exo) === expected, `le pluriel de « ${singular} » est « ${expected} », pas « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== expected), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-ortho-pluriel-trou": (exo) => {
    const match = /^(Un|Une) (.+), des ___\.$/u.exec(textOf(exo));
    const singular = match?.[2] ?? "";
    const expected = pluralByRule(singular);
    // Le genre du nom vient de la liste du test, pas du gabarit : « Une mangue », « Une fille », « Un cahier ».
    const article = FEMININE_NOUNS.has(singular) ? "Une" : "Un";
    return all(ok(match?.[1] === article, `« ${singular} » prend « ${article} », l'énoncé dit « ${match?.[1]} »`), ok(blankOf(exo).answer === expected, `le pluriel de « ${singular} » est « ${expected} », le trou dit « ${blankOf(exo).answer} »`), ok(blankWrongs(exo).length === 2 && blankWrongs(exo).every((option) => option !== expected), `mauvais choix ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-ortho-pluriel-glisser": (exo) =>
    all(
      ok(sameSeq(zonesOf(exo), ["Singulier", "Pluriel"]), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(item.correctZone === (/[sx]$/u.test(item.text) ? "Pluriel" : "Singulier"), `« ${item.text} » rangé dans « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-ortho-ou": (exo) => {
    const text = textOf(exo);
    const words = wordsOf(text.replace("___", "xx"));
    const at = words.indexOf("xx");
    const expected = ouOrOu(words, at);
    const answer = text.startsWith("___") ? capitalise(expected) : expected;
    return all(ok(blankOf(exo).answer === answer, `c'est « ${answer} », le trou dit « ${blankOf(exo).answer} »`), ok(sameSeq([...blankOf(exo).options].map((option) => option.toLowerCase()).sort(), ["au", "ou", "où"].sort()), `les choix : ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-ortho-son": (exo) => {
    const text = textOf(exo);
    const words = wordsOf(text.replace("___", "xx"));
    const at = words.indexOf("xx");
    const expected = sonOrSont(words[at - 1], words[at + 1]);
    const answer = text.startsWith("___") ? capitalise(expected) : expected;
    const wrongs = blankWrongs(exo).map((option) => option.toLowerCase());
    return all(ok(blankOf(exo).answer === answer, `c'est « ${answer} », le trou dit « ${blankOf(exo).answer} »`), ok(sameSeq([...wrongs].sort(), ["ont", expected === "son" ? "sont" : "son"].sort()), `mauvais choix ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-ortho-homophone": (exo) => {
    const verdict = (sentence: string): boolean => {
      const words = wordsOf(sentence);
      const at = words.findIndex((word) => homophoneWords.includes(word));
      if (at < 0) throw new Error(`aucun petit mot dans « ${sentence} »`);
      const word = words[at];
      if (["son", "sont", "ont"].includes(word)) return word === sonOrSont(words[at - 1], words[at + 1]);
      return word === ouOrOu(words, at);
    };
    return all(
      ok(exo.prompt === "Quelle phrase est écrite correctement ?", `énoncé inconnu : ${exo.prompt}`),
      ok(verdict(rightOption(exo)), `« ${rightOption(exo)} » n'est pas écrite juste`),
      ...wrongOf(exo).map((option) => ok(!verdict(option), `« ${option} » est écrite juste aussi`)),
    );
  },
  "ce2-ortho-ecrire": (exo) => {
    const feminine = /^Écris le féminin (de |d')(.+)\.$/u.exec(exo.prompt);
    const plural = /^Écris le pluriel (de |d')(.+)\.$/u.exec(exo.prompt);
    let expected: string | null = null;
    // « de » s'élide devant une voyelle ou un h muet : « d'animal », « d'oiseau », « de cahier ». Aucun nom du tableau n'a de h aspiré.
    const elided = (match: RegExpExecArray | null) => match === null || match[1] === (/^[aeiouyàâéèêëîïôûùh]/iu.test(match[2]) ? "d'" : "de ");
    if (!elided(feminine) || !elided(plural)) return `« de » mal élidé dans « ${exo.prompt} »`;
    if (feminine) expected = feminineByRule(feminine[2]);
    else if (plural) expected = pluralByRule(plural[2]);
    else if (/^Quel mot complète « ___ habites-tu \? » Écris le mot\.$/u.test(exo.prompt)) expected = "où";
    else if (/^Quel mot complète « Moussa range ___ sac\. » Écris le mot\.$/u.test(exo.prompt)) expected = "son";
    return ok(expected !== null && sameSeq(acceptedOf(exo), [expected]) && exo.answerKey === expected, `la réponse est « ${expected} », la clé dit « ${acceptedOf(exo).join(" | ")} » pour « ${exo.prompt} »`);
  },

  // ----- Le vocabulaire -----
  "ce2-vocab-synonyme": (exo) => {
    const word = quoted(exo.prompt);
    const group = classOf(word);
    return all(
      ok(/^Quel mot a presque le même sens que « .+ » \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`),
      ok(group !== undefined && group.includes(rightOption(exo)) && rightOption(exo) !== word, `« ${rightOption(exo)} » n'a pas le sens de « ${word} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !group?.includes(option) && option !== word), `un mauvais choix a le sens de « ${word} » : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-vocab-synonyme-relier": (exo) => {
    const classes = pairsOf(exo).map((pair) => classOf(pair.left));
    return all(
      ok(exo.prompt === "Relie chaque mot à un mot de même sens.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(classOf(pair.left)?.includes(pair.right) === true && pair.left !== pair.right, `« ${pair.left} » n'a pas le sens de « ${pair.right} »`)),
      ok(new Set(classes).size === 3, "deux paires du même sens : une gauche irait avec deux droites"),
    );
  },
  "ce2-vocab-famille": (exo) => {
    const root = quoted(exo.prompt);
    const members = FAMILY_MEMBERS[root] ?? [];
    return all(
      ok(/^Quel mot est de la famille de « .+ » \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`),
      ok(members.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas de la famille de « ${root} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !members.includes(option) && option !== root), `un mauvais choix est de la famille : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-vocab-famille-glisser": (exo) =>
    all(
      ok(exo.prompt === "Glisse chaque mot dans la famille de son mot de départ.", `énoncé inconnu : ${exo.prompt}`),
      ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => FAMILY_MEMBERS[zone.toLowerCase()] !== undefined), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(rootOf(item.text) !== undefined && capitalise(rootOf(item.text) as string) === item.correctZone, `« ${item.text} » est de la famille de « ${rootOf(item.text)} », rangé dans « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-vocab-homonyme": (exo) => {
    const valid = VALID_HOMONYMS[textOf(exo)];
    if (!valid) return `phrase inconnue : ${textOf(exo)}`;
    return all(ok(valid.includes(blankOf(exo).answer), `« ${blankOf(exo).answer} » ne va pas dans « ${textOf(exo)} »`), ok(blankWrongs(exo).every((option) => !valid.includes(option)), `un mauvais choix va aussi : ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-vocab-lettre": (exo) => {
    const opening = exo.prompt === "Quelle formule sert à commencer une lettre ?";
    const closing = exo.prompt === "Quelle formule sert à terminer une lettre ?";
    const isOpening = (formula: string) => OPENING_FORMULA.test(formula);
    return all(
      ok(opening || closing, `énoncé inconnu : ${exo.prompt}`),
      ok(isOpening(rightOption(exo)) === opening, `« ${rightOption(exo)} » ne ${opening ? "commence" : "termine"} pas une lettre`),
      ...wrongOf(exo).map((option) => ok(isOpening(option) !== opening, `« ${option} » est du même groupe que la bonne réponse`)),
    );
  },
  "ce2-vocab-ordre": (exo) => {
    const sorted = [...sequenceOf(exo)].sort(new Intl.Collator("fr").compare);
    return all(ok(exo.prompt === "Mets ces mots dans l'ordre alphabétique.", `énoncé inconnu : ${exo.prompt}`), ok(sameSeq(sequenceOf(exo), sorted), `l'ordre alphabétique est ${sorted.join(" > ")}`));
  },
  "ce2-vocab-ecrire": (exo) => {
    const prompt = fold(exo.prompt);
    let expected: string[] | null = null;
    if (/sens d'un mot|livre explique/u.test(exo.prompt) || /dictionnaire/u.test(prompt) === false && /explique les mots/u.test(prompt)) expected = ["dictionnaire", "le dictionnaire"];
    else if (/se disent pareil|disent pareil/u.test(prompt) && /ecrivent autrement|vert, verre/u.test(prompt)) expected = ["homonymes", "des homonymes"];
    else if (/sens proche|presque la meme chose/u.test(prompt)) expected = ["synonymes", "des synonymes"];
    // « Écris les trois mots » se lisait « recopie-les » : la phrase porte un trou d'un seul mot, que l'énoncé demande.
    else if (/terre, terrain|dent, dentiste/u.test(prompt)) expected = /forment une ___ de mots\. Écris le mot qui manque\.$/u.test(exo.prompt) ? ["famille", "famille de mots"] : null;
    else if (/quel ordre|selon quel ordre/u.test(prompt)) expected = ["ordre alphabétique", "l'ordre alphabétique", "alphabétique"];
    else if (/homonyme de « mer »/u.test(exo.prompt)) expected = ["mère"];
    else if (/homonyme de « verre »/u.test(exo.prompt)) expected = ["vert"];
    // Un indice qui donne la première lettre doit donner celle de la réponse : « commence par h » pour « vert » mène à « homonymes ».
    const initials = exo.hints.map((hint) => /commence par (\p{L})\.$/u.exec(hint)?.[1]).filter((letter): letter is string => letter !== undefined);
    return all(
      ok(expected !== null && sameSeq(acceptedOf(exo), expected), `écritures ${acceptedOf(exo).join(" | ")} pour « ${exo.prompt} »`),
      ok(exo.answerKey === acceptedOf(exo)[0], "clé = première écriture"),
      ok(initials.every((letter) => fold(exo.answerKey).startsWith(letter)), `un indice donne la lettre ${initials.join(", ")}, la réponse est « ${exo.answerKey} »`),
    );
  },

  // ----- La lecture -----
  "ce2-lecture-lettre": (exo) => {
    const letter = parseLetter(exo.prompt);
    const written = exo.prompt.split("\n\n")[0];
    let expected = "";
    if (letter.question === "Qui a écrit cette lettre ?") expected = letter.sender;
    else if (letter.question === "À qui cette lettre est-elle adressée ?") expected = letter.dest;
    else if (letter.question === "Quelle est la date de cette lettre ?") expected = letter.date;
    else if (letter.question === "Quelle formule de politesse termine cette lettre ?") expected = letter.closing;
    else return `question inconnue : ${letter.question}`;
    return all(
      ok(SIGNATURES.has(letter.sender) || letter.sender !== "", "pas de signature"),
      ok(MONTHS.some((month) => letter.date.includes(month)), `la date « ${letter.date} » n'a pas de mois`),
      ok(rightOption(exo) === expected, `la réponse est « ${expected} », pas « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !written.includes(option) && option !== expected), `un mauvais choix est écrit dans la lettre : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-lecture-affiche": (exo) => {
    const poster = parsePoster(exo.prompt);
    const written = exo.prompt.split("\n\n")[0];
    const expected =
      poster.question === "De quoi parle cette affiche ?" ? poster.title
      : poster.question === "Où a lieu cet événement ?" ? poster.place
      : poster.question === "Quand a lieu cet événement ?" ? poster.when
      : poster.question === "Combien faut-il payer ?" ? poster.price
      : null;
    return all(
      ok(expected !== null, `question inconnue : ${poster.question}`),
      ok(rightOption(exo) === expected, `la réponse est « ${expected} », pas « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !written.includes(option) && option !== expected), `un mauvais choix est écrit sur l'affiche : ${wrongOf(exo).join(" | ")}`),
      // « Entrée gratuite » et « Participation gratuite » disent la même chose : une seule des trois propositions est gratuite quand la bonne l'est.
      ok(!/gratuit/iu.test(expected ?? "") || optionsOf(exo).filter((option) => /gratuit/iu.test(option)).length === 1, `deux propositions gratuites : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce2-lecture-affiche-glisser": (exo) =>
    all(
      ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => ["Où", "Quand", "Combien"].includes(zone)), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(posterKind(item.text) === item.correctZone, `« ${item.text} » répond à « ${posterKind(item.text)} », rangé dans « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-lecture-poeme": (exo) => {
    const [poem, question] = exo.prompt.split("\n\n\n").length > 1 ? exo.prompt.split("\n\n\n") : [exo.prompt.slice(0, exo.prompt.lastIndexOf("\n\n")), exo.prompt.slice(exo.prompt.lastIndexOf("\n\n") + 2)];
    const stanzas = poem.split("\n\n");
    const verses = stanzas.flatMap((stanza) => stanza.split("\n"));
    if (question === "Combien de strophes a ce poème ?") {
      const expected = `${stanzas.length} strophes`;
      return all(ok(rightOption(exo) === expected, `le poème a ${expected}, pas « ${rightOption(exo)} »`), ok(new Set(optionsOf(exo)).size === 3, "trois choix"));
    }
    if (question === "Combien de vers a ce poème ?") {
      const expected = `${verses.length} vers`;
      return all(ok(rightOption(exo) === expected, `le poème a ${expected}, pas « ${rightOption(exo)} »`), ok(new Set(optionsOf(exo)).size === 3, "trois choix"));
    }
    const target = /^Quel mot rime avec « (.+) » dans ce poème \?$/u.exec(question)?.[1];
    if (!target) return `question inconnue : ${question}`;
    const couplet = stanzas.map((stanza) => stanza.split("\n")).find((lines) => lastWordOf(lines[0]) === target);
    if (!couplet) return `« ${target} » ne finit aucun premier vers`;
    const expected = lastWordOf(couplet[1]);
    const ends = verses.map(lastWordOf);
    return all(
      ok(rightOption(exo) === expected && RHYME_SOUND[expected] === RHYME_SOUND[target], `« ${expected} » rime avec « ${target} », pas « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => ends.includes(option) && RHYME_SOUND[option] !== RHYME_SOUND[target]), `un mauvais choix rime ou n'est pas dans le poème : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-lecture-poeme-trou": (exo) => {
    const text = textOf(exo);
    const [first, second] = text.split(" / ");
    const answer = blankOf(exo).answer;
    const full = second.replace("___", answer);
    const known = COUPLETS.some((couplet) => couplet[0] === first && couplet[1] === full);
    return all(
      ok(exo.prompt === "Complète le vers avec le mot qui rime.", `énoncé inconnu : ${exo.prompt}`),
      ok(known, `« ${first} / ${full} » n'est pas un couple du poème`),
      ok(RHYME_SOUND[answer] === RHYME_SOUND[lastWordOf(first)], `« ${answer} » ne rime pas avec « ${lastWordOf(first)} »`),
      ok(blankWrongs(exo).length === 2 && blankWrongs(exo).every((option) => RHYME_SOUND[option] !== undefined && RHYME_SOUND[option] !== RHYME_SOUND[lastWordOf(first)]), `un mauvais choix rime : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce2-lecture-lettre-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    const role = (line: string): string =>
      /^.+, le .+\.$/u.test(line) ? "date"
      : /^(?:Cher|Chère) .+,$/u.test(line) ? "salutation"
      : SIGNATURES.has(line) ? "signature"
      : /,$/u.test(line) ? "formule"
      : "message";
    return all(
      ok(exo.prompt === "Remets les parties de cette lettre dans l'ordre, de haut en bas.", `énoncé inconnu : ${exo.prompt}`),
      ok(sameSeq(sequence.map(role), ["date", "salutation", "message", "formule", "signature"]), `rôles ${sequence.map(role).join(" > ")}`),
    );
  },
  "ce2-lecture-ecrire": (exo) => {
    const prompt = exo.prompt;
    let expected: string[] | null = null;
    if (/personne qui écrit une lettre|celui qui envoie une lettre/u.test(prompt)) expected = ["expéditeur", "l'expéditeur"];
    else if (/personne qui reçoit une lettre|à qui une lettre est adressée/u.test(prompt)) expected = ["destinataire", "le destinataire"];
    else if (/groupe de vers|paragraphe de poème/u.test(prompt)) expected = ["strophe", "une strophe"];
    else if (/chaque ligne d'un poème|ligne de poème/u.test(prompt)) expected = ["vers", "un vers"];
    else if (/son identique|son qui revient/u.test(prompt)) expected = ["rime", "la rime"];
    else if (/À bientôt|Amicalement/u.test(prompt)) expected = ["formule de politesse", "une formule de politesse"];
    return all(ok(expected !== null && sameSeq(acceptedOf(exo), expected), `écritures ${acceptedOf(exo).join(" | ")} pour « ${prompt} »`), ok(exo.answerKey === acceptedOf(exo)[0], "clé = première écriture"));
  },
};

/** Une vérification qui lève une erreur (un mot inconnu dans un exercice abîmé) dit simplement que l'exercice est faux. */
for (const kind of Object.keys(CHECKS)) {
  const check = CHECKS[kind];
  CHECKS[kind] = (exo) => {
    try {
      return check(exo);
    } catch (error) {
      return String(error);
    }
  };
}

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "fr-ce2-orthographe": ["ce2-ortho-feminin", "ce2-ortho-feminin-trou", "ce2-ortho-feminin-relier", "ce2-ortho-pluriel", "ce2-ortho-pluriel-trou", "ce2-ortho-pluriel-glisser", "ce2-ortho-ou", "ce2-ortho-son", "ce2-ortho-homophone", "ce2-ortho-ecrire"],
  "fr-ce2-vocabulaire": ["ce2-vocab-synonyme", "ce2-vocab-synonyme-relier", "ce2-vocab-famille", "ce2-vocab-famille-glisser", "ce2-vocab-homonyme", "ce2-vocab-lettre", "ce2-vocab-ordre", "ce2-vocab-ecrire"],
  "fr-ce2-lecture": ["ce2-lecture-lettre", "ce2-lecture-affiche", "ce2-lecture-affiche-glisser", "ce2-lecture-poeme", "ce2-lecture-poeme-trou", "ce2-lecture-lettre-ordre", "ce2-lecture-ecrire"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;
/** La place d'un texte : un énoncé de lecture a jusqu'à 110 mots (le plafond du CE2), les autres vingt-huit. */
const wordCeiling = (kind: string) => (topicOfKind(kind) === "fr-ce2-lecture" ? 110 : 28);

describe("chaque gabarit de français du CE2 (orthographe, vocabulaire, lecture) a sa vérification", () => {
  it("couvre exactement les vingt-cinq gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(25);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de français du CE2 recalculent juste, depuis des règles et des tables écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se recalcule, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
      }
    });
  }
});

describe("les règles du test sont saines", () => {
  it("accordent les noms : féminin et pluriel", () => {
    expect(feminineByRule("lion")).toBe("lionne");
    expect(feminineByRule("boulanger")).toBe("boulangère");
    expect(feminineByRule("maître")).toBe("maîtresse");
    expect(feminineByRule("chanteur")).toBe("chanteuse");
    expect(feminineByRule("musicien")).toBe("musicienne");
    expect(feminineByRule("cousin")).toBe("cousine");
    expect(feminineByRule("ami")).toBe("amie");
    expect(pluralByRule("cheval")).toBe("chevaux");
    expect(pluralByRule("gâteau")).toBe("gâteaux");
    expect(pluralByRule("feu")).toBe("feux");
    expect(pluralByRule("fille")).toBe("filles");
    expect(pluralByRule("hôpital")).toBe("hôpitaux");
  });

  it("distinguent son et sont, ou et où", () => {
    expect(sonOrSont("moussa", "sac")).toBe("son");
    expect(sonOrSont("enfants", "contents")).toBe("sont");
    expect(sonOrSont("ils", "au")).toBe("sont");
    expect(ouOrOu(["xx", "habites-tu"], 0)).toBe("où");
    expect(ouOrOu(["veux-tu", "du", "riz", "xx", "du", "pain"], 3)).toBe("ou");
    expect(ouOrOu(["le", "village", "xx", "je", "suis", "né"], 2)).toBe("où");
  });

  it("lisent une lettre, une affiche et un poème", () => {
    const letter = parseLetter("Dakar, le 5 mai.\nCher Moussa,\nViens à ma fête samedi à midi.\nÀ bientôt,\nAwa\n\nQui a écrit cette lettre ?");
    expect(letter).toMatchObject({ place: "Dakar", date: "5 mai", dest: "Moussa", closing: "À bientôt", sender: "Awa" });
    const poster = parsePoster("Match de football\nAu stade municipal\nLe dimanche 3 mars à 17 heures\nEntrée gratuite\n\nOù a lieu cet événement ?");
    expect(poster.place).toBe("Au stade municipal");
    expect(posterKind("500 FCFA")).toBe("Combien");
    expect(posterKind("samedi à 16 heures")).toBe("Quand");
    expect(posterKind("au stade")).toBe("Où");
    expect(lastWordOf("les enfants font un tour.")).toBe("tour");
    expect(RHYME_SOUND.toit).toBe(RHYME_SOUND.moi);
    expect(RHYME_SOUND.jour).not.toBe(RHYME_SOUND.doux);
    expect(["école", "fleuve", "route"].sort(new Intl.Collator("fr").compare)).toEqual(["école", "fleuve", "route"]);
    expect(["lampe", "lion", "lait"].sort(new Intl.Collator("fr").compare)).toEqual(["lait", "lampe", "lion"]);
  });
});

// ===========================================================================
// LES MUTATIONS : une vérification qui ne voit pas une réponse abîmée ne prouve rien
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. `null` si rien ne peut être abîmé. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      const first = (payload.acceptedAnswers as string[])[0];
      payload.acceptedAnswers = [`${first}x`];
      return copy();
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const d of draws.filter((_, i) => i % 4 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  const draw = (kind: string, level: GameLevel, seed: string) => make(kind as GameKind, { level, seed }) as unknown as Exo;
  /** Cherche, parmi quarante graines par niveau, des exercices qui passent `want`, et vérifie que `damage` les rend faux pour les règles. */
  function seesDamage(kind: string, want: (exo: Exo) => boolean, damage: (exo: Exo) => Exo): void {
    let tried = 0;
    for (const level of LEVELS) {
      for (let i = 0; i < 40; i++) {
        const exo = draw(kind, level, `mut:${kind}:${i}`);
        if (!want(exo)) continue;
        tried += 1;
        expect(CHECKS[kind](exo), `${kind} : l'exercice juste doit passer : ${exo.prompt}`).toBeNull();
        expect(CHECKS[kind](damage(exo)), `${kind} : l'exercice abîmé doit échouer : ${exo.prompt}`).not.toBeNull();
      }
    }
    expect(tried, kind).toBeGreaterThan(0);
  }

  it("voient aussi un énoncé abîmé : un mot, une règle, une date, un son ou une case changés", () => {
    // Le mot de l'énoncé change : la bonne réponse n'est plus la bonne.
    seesDamage("ce2-ortho-feminin", () => true, (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ »/u, "« zzz »") }));
    seesDamage("ce2-ortho-pluriel", (exo) => !exo.prompt.includes("cheval"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ »/u, "« cheval »") }));
    // Un nom écrit derrière le trou : « sont » ne va plus, c'est « son ».
    seesDamage("ce2-ortho-son", (exo) => blankOf(exo).answer === "sont", (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/___ \p{L}+/u, "___ sac") } }));
    // La phrase d'un trou change de mot : « ou » devient une question de lieu.
    seesDamage("ce2-ortho-ou", (exo) => blankOf(exo).answer === "ou", (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/^(.*?) ___ /u, "___ ") } }));
    // Le mot de l'énoncé d'un synonyme change.
    seesDamage("ce2-vocab-synonyme", (exo) => !exo.prompt.includes("énorme"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ »/u, "« énorme »") }));
    // « commencer » devient « terminer » dans l'énoncé d'une formule de lettre.
    seesDamage("ce2-vocab-lettre", (exo) => exo.prompt.includes("commencer"), (exo) => ({ ...exo, prompt: exo.prompt.replace("commencer", "terminer") }));
    seesDamage("ce2-vocab-famille", () => true, (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ »/u, "« zzz »") }));
    // La signature d'une lettre devient autre chose : la question sur l'expéditeur n'a plus la même réponse.
    seesDamage("ce2-lecture-lettre", (exo) => exo.prompt.endsWith("Qui a écrit cette lettre ?"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/\n[A-Za-zé]+\n\nQui/u, "\nZoé\n\nQui") }));
    seesDamage("ce2-lecture-lettre", (exo) => exo.prompt.endsWith("Quelle est la date de cette lettre ?"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/, le [^.]+\./u, ", le 31 mai.") }));
    // Le prix d'une affiche change dans le texte.
    seesDamage("ce2-lecture-affiche", (exo) => exo.prompt.endsWith("Combien faut-il payer ?"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/\n[^\n]*FCFA\n|\n[^\n]*gratuit[^\n]*\n/u, "\nEntrée 777 FCFA\n") }));
    // Un mot de la rime change dans la question d'un poème.
    seesDamage("ce2-lecture-poeme", (exo) => exo.prompt.includes("rime avec « jour »") === false && exo.prompt.includes("rime avec"), (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ »/u, "« jour »") }));
    // Le mot qui rime remplacé par un mot qui ne rime pas, dans le texte d'un trou.
    seesDamage("ce2-lecture-poeme-trou", () => true, (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/^[^/]+ \//u, "Le soleil brille là-haut, /") } }));
    // Deux cases échangées : chaque étiquette se retrouve dans l'autre case.
    for (const kind of ["ce2-ortho-pluriel-glisser", "ce2-vocab-famille-glisser", "ce2-lecture-affiche-glisser"]) {
      seesDamage(kind, () => true, (exo) => {
        const [a, b] = zonesOf(exo);
        return { ...exo, payload: { ...exo.payload, items: itemsOf(exo).map((item) => ({ ...item, correctZone: item.correctZone === a ? b : a })) } };
      });
    }
    // Deux droites échangées : chaque mot se retrouve avec la réponse de l'autre.
    for (const kind of ["ce2-ortho-feminin-relier", "ce2-vocab-synonyme-relier"]) {
      seesDamage(kind, () => true, (exo) => {
        const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
        [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
        return { ...exo, payload: { ...exo.payload, pairs } };
      });
    }
    // L'énoncé qui demande un féminin demande un pluriel : la réponse écrite n'est plus la bonne.
    seesDamage("ce2-ortho-ecrire", (exo) => exo.prompt.startsWith("Écris le féminin"), (exo) => ({ ...exo, prompt: exo.prompt.replace("le féminin", "le pluriel") }));
    seesDamage("ce2-lecture-ecrire", (exo) => exo.prompt.includes("reçoit"), (exo) => ({ ...exo, prompt: exo.prompt.replace("reçoit", "écrit") }));
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de français du CE2 (orthographe, vocabulaire, lecture)", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus (cent dix avec un texte à lire)", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(wordCeiling(kind));
      if (exo.payload.blanks) expect(apostrophes(textOf(exo)), `${kind} : ${textOf(exo)}`).toBeLessThanOrEqual(1);
    }
  });

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      expect(exo.prompt.includes(VS16), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes(VS16), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(pairs.length, kind).toBe(3);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE2 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE2",
        subject: subjectOfKind(kind),
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
    }
  });

  it("écrivent la bonne réponse d'un QCM ou d'un trou parmi les choix, et aucune réponse à écrire n'est vide", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) expect(optionsOf(exo), kind).toContain(exo.answerKey);
      if (exo.payload.blanks) expect(blankOf(exo).options, kind).toContain(blankOf(exo).answer);
      if (exo.payload.acceptedAnswers) {
        expect(acceptedOf(exo).length, kind).toBeGreaterThan(0);
        for (const answer of acceptedOf(exo)) expect(answer.trim(), kind).not.toBe("");
      }
    }
  });

  it("n'écrivent pas la bonne option beaucoup plus longue que les autres : l'enfant la devinerait à sa longueur", () => {
    for (const { kind, exo } of exos) {
      if (!exo.payload.options) continue;
      const right = rightOption(exo).length;
      const longest = Math.max(...wrongOf(exo).map((option) => option.length));
      expect(right >= 24 && right >= 2 * longest, `${kind} : ${optionsOf(exo).join(" | ")}`).toBe(false);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les trois dernières thématiques de français du CE2", () => {
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS.slice().sort()).toEqual(["fr-ce2-lecture", "fr-ce2-orthographe", "fr-ce2-vocabulaire"]);
  });

  it("achèvent le CE2 : plus aucune thématique du CE2 n'est écrite par le modèle", () => {
    const withoutCode = allProgrammeEntries()
      .filter((entry) => entry.klass === "CE2" && (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) < PALIER_SIZE)
      .map((entry) => entry.topic.key);
    expect(withoutCode).toEqual([]);
  });

  it("fabriquent des paliers entiers, de dix exercices, dont les gabarits sont tous différents, et qui passent le contrôleur et les règles", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CE2",
              subject: entryOf(key).subject.name,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins cinq sortes d'exercices sur dix", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("ne reposent pas la même question d'un palier à l'autre : chaque palier a sa part des lignes", () => {
    for (const key of TOPIC_KEYS) {
      let total = 0;
      let repeated = 0;
      for (let n = 0; n < 20; n++) {
        const seen = new Map<string, number>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `variete:${key}:${n}:${palierIndex}` });
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            const items = game.payload.items as { text: string; correctZone: string }[] | undefined;
            const pairs = game.payload.pairs as { left: string; right: string }[] | undefined;
            const answer = items
              ? items.map((item) => `${item.text}>${item.correctZone}`).sort().join(";")
              : pairs
                ? pairs.map((pair) => `${pair.left}~${pair.right}`).sort().join(";")
                : game.answerKey;
            const question = `${kind}|${game.prompt}|${String(game.payload.text ?? "")}|${answer}`;
            total += 1;
            if (seen.has(question) && seen.get(question) !== palierIndex) repeated += 1;
            if (!seen.has(question)) seen.set(question, palierIndex);
          }
        }
      }
      expect(repeated / total, key).toBeLessThan(0.05);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    // La banque de la vitrine veut, sur une thématique tout en gabarits, un gabarit du type de chaque exercice de sa banque : le QCM, la phrase à
    // trous, le glissé et l'ordre ou l'appariement.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
      expect(typesOf(key).has("order" as never) || typesOf(key).has("match" as never), `${key} : ordre ou appariement`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, "CE2", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
