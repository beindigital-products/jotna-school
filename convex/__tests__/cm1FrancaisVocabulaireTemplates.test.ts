import { describe, expect, it } from "vitest";
import {
  ANTONYMS as SOURCE_ANTONYMS,
  ANTONYM_ROWS,
  EXPRESSIONS as SOURCE_EXPRESSIONS,
  GAP_ROWS,
  INTRUDERS,
  LINK_ROWS,
  PREFIXES as SOURCE_PREFIXES,
  PREFIX_ROWS,
  SENSE_ROWS,
  SORT_ROWS,
  SUFFIXES as SOURCE_SUFFIXES,
  SUFFIX_ROWS,
  SYNONYMS as SOURCE_SYNONYMS,
  SYNONYM_ROWS,
  THEMES as SOURCE_THEMES,
  THEME_ROWS,
  WRITE_ROWS,
} from "../paliers/games/cm1Vocabulaire";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LE VOCABULAIRE DU CM1 (`fr-cm1-vocabulaire`).
 *
 * Ce fichier a ses propres dictionnaires, écrits à part de `cm1Vocabulaire.ts` : les groupes de synonymes, les couples de contraires, les mots formés avec in-, im-, dé-, re-,
 * -eur, -age, -ment, le sens de trente expressions et les mots de cinq thèmes. Il RECALCULE : le préfixe d'un mot (dé- pour un verbe, im- devant b, m, p, in- sinon), le mot formé
 * (la règle de la terminaison et un dictionnaire des mots qui existent), le groupe d'un synonyme, le couple d'un contraire. Un mauvais choix n'est jamais un synonyme ni un contraire
 * du mot de l'énoncé, ni un mot du même groupe que la réponse, ni un mot qui existe quand l'énoncé demande une faute.
 */

const words = (text: string) => text.split(" ");
const GROUPS = [
  "beau joli magnifique", "content heureux ravi", "triste malheureux chagriné", "fatigué épuisé las", "grand immense géant", "petit minuscule menu", "difficile dur ardu", "facile simple aisé",
  "commencer débuter entamer", "finir terminer achever", "regarder observer contempler", "interroger questionner", "aider secourir assister", "parler discuter bavarder", "cacher dissimuler masquer",
  "choisir sélectionner élire", "casser briser fracasser", "fabriquer construire bâtir", "maison demeure habitation", "voiture auto véhicule", "peur frayeur crainte", "colère fureur rage",
  "ami camarade copain", "bateau navire embarcation", "enfant gamin bambin",
].map(words);
const clusterOf = (word: string) => GROUPS.findIndex((group) => group.includes(word));
const OPPOSITES: [string, string][] = (
  "grand petit,chaud froid,haut bas,lourd léger,plein vide,propre sale,rapide lent,clair sombre,riche pauvre,fort faible,vrai faux,jeune vieux,ouvrir fermer,monter descendre,arriver partir,commencer finir," +
  "acheter vendre,entrer sortir,jour nuit,début fin,victoire défaite,paix guerre,joie tristesse,ami ennemi,aimer détester,gagner perdre,courage peur,avant après,facile difficile,présent absent"
)
  .split(",")
  .map((pair) => words(pair) as [string, string]);
const oppositesOf = (word: string) => OPPOSITES.flatMap(([a, b]) => (a === word ? [b] : b === word ? [a] : []));

const DE_VERBS = new Set(words("faire coller couvrir plier monter brancher charger boucher nouer"));
const REGULAR_WORDS = new Set(
  words(
    "impossible impoli immobile impatient imparfait improbable inutile invisible injuste inconnu inactif inhabile défaire décoller découvrir déplier démonter débrancher incapable incomplet indirect décharger déboucher dénouer " +
      "immortel immoral imprécis imbuvable inattentif inégal refaire relire revoir recommencer remonter redire",
  ),
);
const SUFFIX_WORDS = new Set(
  words(
    "chanteur nageur danseur pêcheur vendeur porteur voleur joueur coiffeur travailleur tricheur rêveur lavage nettoyage jardinage bricolage arrosage tissage triage labourage changement rangement logement vêtement " +
      "classement déplacement remplacement rassemblement encouragement développement",
  ),
);
const prefixOf = (base: string) => (DE_VERBS.has(base) ? "dé-" : /^[bmp]/u.test(base) ? "im-" : "in-");
const suffixed = (verb: string, suffix: string) => {
  if (suffix === "ment") return verb === "vêtir" ? "vêtement" : `${verb.slice(0, -1)}ment`;
  return `${verb.slice(0, -2)}${suffix}`;
};

const EXPRESSIONS: Record<string, string> = {
  "avoir la tête dans les nuages": "être distrait", "coûter les yeux de la tête": "coûter très cher", "avoir un cœur d'or": "être très généreux", "tomber dans les pommes": "s'évanouir",
  "poser un lapin": "ne pas venir à un rendez-vous", "avoir le cafard": "se sentir triste", "mettre son grain de sel": "donner son avis sans qu'on le demande", "casser les pieds": "ennuyer quelqu'un",
  "être sur son trente-et-un": "être très bien habillé", "avoir un chat dans la gorge": "avoir la voix enrouée", "donner sa langue au chat": "renoncer à deviner", "avoir la main verte": "réussir ses plantations",
  "avoir un froid de canard": "avoir très froid", "avoir un appétit d'oiseau": "manger très peu", "mener quelqu'un en bateau": "le tromper", "être comme un poisson dans l'eau": "se sentir très à l'aise",
  "avoir un trou de mémoire": "oublier un instant", "mettre la main à la pâte": "aider à faire un travail", "avoir les dents longues": "être très ambitieux", "prendre ses jambes à son cou": "s'enfuir en courant",
  "revenir bredouille": "revenir sans rien avoir attrapé", "être fier comme un paon": "être très orgueilleux", "se mettre en quatre": "faire tout son possible", "en faire tout un plat": "exagérer l'importance d'une chose",
  "avoir du pain sur la planche": "avoir beaucoup de travail", "tourner autour du pot": "ne pas dire clairement ce qu'on veut", "faire la tête": "bouder", "être dans de beaux draps": "se trouver dans une situation difficile",
  "avoir une faim de loup": "avoir très faim", "tirer le diable par la queue": "avoir du mal à gagner sa vie",
};
const THEMES: Record<string, string[]> = {
  pêche: words("filet pirogue poisson hameçon canne barque appât sardine"),
  hivernage: words("pluie semis champ orage mil houe boue graine"),
  fête: words("musique danse tambour invités cadeau gâteau joie chant"),
  école: words("cahier maîtresse classe leçon tableau craie cartable stylo"),
  marché: words("vendeur client prix étal panier balance monnaie caisse"),
};
const themeOf = (word: string) => Object.keys(THEMES).find((theme) => THEMES[theme].includes(word));

const quoted = (prompt: string) => [...prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1]);
const isSynonym = (a: string, b: string) => a !== b && clusterOf(a) >= 0 && clusterOf(a) === clusterOf(b);

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const checkPrefix: Check = (exo) => {
  const [base] = quoted(exo.prompt);
  const expected = prefixOf(base);
  return all(
    ok(REGULAR_WORDS.has(expected.slice(0, -1) + base), `le mot formé n'existe pas : ${expected}${base}`),
    ok(rightOption(exo) === expected, `« ${base} » prend ${expected}, pas ${rightOption(exo)}`),
    ok(new Set(optionsOf(exo)).size === 3 && optionsOf(exo).every((option) => ["in-", "im-", "dé-"].includes(option)), "les trois préfixes"),
  );
};

const checkSuffix: Check = (exo) => {
  const [verb, suffix] = quoted(exo.prompt);
  const expected = suffixed(verb, suffix.replace("-", ""));
  return all(
    ok(SUFFIX_WORDS.has(expected), `le mot formé n'existe pas : ${expected}`),
    ok(rightOption(exo) === expected, `${verb} + ${suffix} donne ${expected}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((word) => word !== expected && !SUFFIX_WORDS.has(word) && !REGULAR_WORDS.has(word)), `un mauvais choix est un vrai mot : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkSynonym: Check = (exo) => {
  const [word] = quoted(exo.prompt);
  return all(
    ok(isSynonym(word, rightOption(exo)), `« ${rightOption(exo)} » n'est pas un synonyme de ${word}`),
    ok(wrongOf(exo).every((option) => !isSynonym(word, option) && option !== word && !oppositesOf(word).includes(option) && clusterOf(option) !== clusterOf(rightOption(exo))), `un mauvais choix est un synonyme ou un contraire : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkAntonym: Check = (exo) => {
  const [word] = quoted(exo.prompt);
  return all(
    ok(oppositesOf(word).includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas le contraire de ${word}`),
    ok(wrongOf(exo).every((option) => !oppositesOf(word).includes(option) && !isSynonym(option, rightOption(exo)) && !isSynonym(option, word) && option !== word), `un mauvais choix peut être un contraire : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkSense: Check = (exo) => {
  const [expression] = quoted(exo.prompt);
  const meaning = EXPRESSIONS[expression];
  return all(
    ok(meaning !== undefined && rightOption(exo) === meaning, `« ${expression} » veut dire « ${meaning} », pas « ${rightOption(exo)} »`),
    ok(wrongOf(exo).every((option) => option !== meaning), `un mauvais choix est le bon sens : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkTheme: Check = (exo) => {
  const [theme] = quoted(exo.prompt);
  const intruder = rightOption(exo);
  return all(
    ok(theme in THEMES, `thème inconnu : ${theme}`),
    ok(themeOf(intruder) !== undefined && themeOf(intruder) !== theme, `« ${intruder} » n'est pas hors du thème ${theme}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((word) => themeOf(word) === theme), `les deux autres mots ne sont pas du thème ${theme} : ${optionsOf(exo).join(" | ")}`),
    ok(!(INTRUDERS[theme] ?? []).some((word) => THEMES[theme].includes(word)), "un intrus est du thème"),
  );
};

const checkGap: Check = (exo) => {
  const word = textOf(exo).match(/\((\p{L}+)\)$/u)?.[1] ?? "";
  const { options, answer } = blankOf(exo);
  return all(
    ok(exo.prompt === "Complète avec le mot de même sens que celui entre parenthèses.", "énoncé inattendu"),
    ok(isSynonym(word, answer), `« ${answer} » n'est pas un synonyme de ${word}`),
    ok(options.filter((option) => option !== answer).every((option) => !isSynonym(word, option) && option !== word && !oppositesOf(word).includes(option)), `un mauvais choix est un synonyme ou un contraire : ${options.join(" | ")}`),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  for (const item of items) if (themeOf(item.text) !== item.correctZone) return `« ${item.text} » est du thème ${themeOf(item.text)}, pas ${item.correctZone}`;
  return all(ok(zones.length === 2 && new Set(zones).size === 2 && zones.every((zone) => zone in THEMES), "deux thèmes"), ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois mots par thème"));
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  const kind = exo.prompt;
  const good = (left: string, right: string) => {
    if (kind === "Relie chaque mot à un mot de même sens.") return isSynonym(left, right);
    if (kind === "Relie chaque mot à son contraire.") return oppositesOf(left).includes(right);
    if (kind === "Relie chaque mot à son contraire formé avec un préfixe.") return REGULAR_WORDS.has(prefixOf(left).slice(0, -1) + left) && right === prefixOf(left).slice(0, -1) + left;
    if (kind === "Relie chaque verbe au nom formé avec un suffixe.") return SUFFIX_WORDS.has(right) && ["eur", "age", "ment"].some((suffix) => suffixed(left, suffix) === right);
    return false;
  };
  return all(
    ok(pairs.every((pair) => good(pair.left, pair.right)), `une paire fausse : ${pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")} (${kind})`),
    ok(pairs.length === 3, "trois paires"),
  );
};

const checkWrite: Check = (exo) => {
  const prompt = exo.prompt;
  const answer = exo.answerKey;
  let expected: string | null = null;
  const prefixed = prompt.match(/^Écris le mot formé avec le préfixe « (\S+) » et le mot « (\p{L}+) »\.$/u);
  const suffixedMatch = prompt.match(/^Écris le nom formé à partir du verbe « (\p{L}+) » avec le suffixe « -(\p{L}+) »\.$/u);
  const contrary = prompt.match(/^Écris le contraire de « (\p{L}+) »\.$/u);
  if (prefixed) expected = prefixed[1] === "re-" ? `re${prefixed[2]}` : prefixed[1] === prefixOf(prefixed[2]) ? prefixed[1].slice(0, -1) + prefixed[2] : null;
  else if (suffixedMatch) expected = suffixed(suffixedMatch[1], suffixedMatch[2]);
  else if (contrary) expected = oppositesOf(contrary[1])[0] ?? null;
  const exists = expected !== null && (REGULAR_WORDS.has(expected) || SUFFIX_WORDS.has(expected) || oppositesOf((contrary?.[1] as string) ?? "").includes(expected));
  return all(
    ok(expected !== null && exists, `énoncé illisible ou mot inexistant : ${prompt}`),
    ok(answer === expected, `la réponse est ${expected}, pas ${answer}`),
    ok(acceptedOf(exo)[0] === answer, "réponse admise"),
  );
};

defineMathsTests({
  label: "du français du CM1 (le vocabulaire)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm1-voc-prefixe": checkPrefix,
    "cm1-voc-suffixe": checkSuffix,
    "cm1-voc-synonyme": checkSynonym,
    "cm1-voc-contraire": checkAntonym,
    "cm1-voc-sens": checkSense,
    "cm1-voc-champ": checkTheme,
    "cm1-voc-trou": checkGap,
    "cm1-voc-glisser": checkSort,
    "cm1-voc-relier": checkLink,
    "cm1-voc-ecrire": checkWrite,
  },
  topicKinds: {
    "fr-cm1-vocabulaire": ["cm1-voc-prefixe", "cm1-voc-suffixe", "cm1-voc-synonyme", "cm1-voc-contraire", "cm1-voc-sens", "cm1-voc-champ", "cm1-voc-trou", "cm1-voc-glisser", "cm1-voc-relier", "cm1-voc-ecrire"],
  },
});

describe("les tableaux du vocabulaire s'accordent avec les dictionnaires écrits à part", () => {
  it("les groupes de synonymes, les contraires, les expressions et les thèmes sont les mêmes", () => {
    expect(SOURCE_SYNONYMS.map((group) => [...group])).toEqual(GROUPS);
    expect(SOURCE_ANTONYMS.map((pair) => [...pair])).toEqual(OPPOSITES);
    expect(Object.fromEntries(SOURCE_EXPRESSIONS.map((entry) => [entry.text, entry.meaning]))).toEqual(EXPRESSIONS);
    expect(Object.fromEntries(Object.entries(SOURCE_THEMES).map(([theme, list]) => [theme, [...list]]))).toEqual(THEMES);
  });

  it("chaque mot n'est que dans un groupe de synonymes et un thème ; aucun contraire n'est un synonyme", () => {
    const all = GROUPS.flat();
    expect(new Set(all).size).toBe(all.length);
    const themed = Object.values(THEMES).flat();
    expect(new Set(themed).size).toBe(themed.length);
    for (const [a, b] of OPPOSITES) expect(isSynonym(a, b), `${a} ${b}`).toBe(false);
  });

  it("les trente mots à préfixe suivent la règle ; les trente mots à suffixe suivent la règle et existent", () => {
    expect(SOURCE_PREFIXES).toHaveLength(30);
    for (const entry of SOURCE_PREFIXES) {
      expect(entry.prefix, entry.base).toBe(prefixOf(entry.base));
      expect(entry.word, entry.base).toBe(entry.prefix.slice(0, -1) + entry.base);
      expect(REGULAR_WORDS.has(entry.word), entry.word).toBe(true);
    }
    expect(SOURCE_SUFFIXES).toHaveLength(30);
    for (const entry of SOURCE_SUFFIXES) {
      expect(entry.word, entry.verb).toBe(suffixed(entry.verb, entry.suffix));
      expect(SUFFIX_WORDS.has(entry.word), entry.word).toBe(true);
      expect(entry.faults.every((fault) => fault !== entry.word && !SUFFIX_WORDS.has(fault)), entry.word).toBe(true);
    }
  });

  it("toutes les lignes de chaque tableau passent la vérification de leur gabarit", () => {
    const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) => ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0 } }) as Exo;
    const rowsOf: [string, readonly { prompt: string; answer: string; wrong: readonly string[] }[], Check][] = [
      ["préfixe", PREFIX_ROWS, checkPrefix], ["suffixe", SUFFIX_ROWS, checkSuffix], ["synonyme", SYNONYM_ROWS, checkSynonym], ["contraire", ANTONYM_ROWS, checkAntonym], ["sens", SENSE_ROWS, checkSense], ["champ", THEME_ROWS, checkTheme],
    ];
    for (const [name, rows, check] of rowsOf) {
      expect(rows, name).toHaveLength(30);
      for (const row of rows) {
        expect(new Set([row.answer, ...row.wrong]).size, `${name} : ${row.prompt}`).toBe(3);
        expect(check(qcmOf(row)), `${name} : ${row.prompt}`).toBeNull();
        expect(row.answer.length, `${name} : ${row.prompt}`).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
      }
    }
    expect(GAP_ROWS).toHaveLength(30);
    for (const row of GAP_ROWS) {
      expect(new Set([row.answer, ...row.wrong]).size, row.text).toBe(3);
      expect(checkGap({ prompt: "Complète avec le mot de même sens que celui entre parenthèses.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } } as Exo), row.text).toBeNull();
    }
    expect(WRITE_ROWS).toHaveLength(30);
    for (const row of WRITE_ROWS) expect(checkWrite({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    expect(LINK_ROWS).toHaveLength(30);
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), row.prompt).toBeNull();
    expect(SORT_ROWS).toHaveLength(30);
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
  });

  it("aucune ligne en double dans un tableau", () => {
    for (const keys of [PREFIX_ROWS.map((r) => r.prompt), SUFFIX_ROWS.map((r) => r.prompt), SYNONYM_ROWS.map((r) => r.prompt), ANTONYM_ROWS.map((r) => r.prompt), SENSE_ROWS.map((r) => r.prompt), THEME_ROWS.map((r) => `${r.prompt}|${r.answer}`), GAP_ROWS.map((r) => r.text), WRITE_ROWS.map((r) => r.prompt), LINK_ROWS.map((r) => `${r.prompt}|${JSON.stringify(r.pairs)}`), SORT_ROWS.map((r) => JSON.stringify(r.items))]) {
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("les vérifications du vocabulaire voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;

  it("im- devant b, m, p ; in- ailleurs ; dé- pour un verbe", () => {
    expect(checkPrefix(qcm("Quel préfixe faut-il ajouter à « possible » pour former son contraire ?", ["im-", "in-", "dé-"], 0))).toBeNull();
    expect(checkPrefix(qcm("Quel préfixe faut-il ajouter à « possible » pour former son contraire ?", ["im-", "in-", "dé-"], 1))).not.toBeNull();
    expect(checkPrefix(qcm("Quel préfixe faut-il ajouter à « faire » pour former son contraire ?", ["im-", "in-", "dé-"], 2))).toBeNull();
  });

  it("un mauvais choix ne peut pas être un synonyme, un contraire ou un vrai mot", () => {
    expect(checkSynonym(qcm("Quel mot a presque le même sens que « joli » ?", ["beau", "triste", "épuisé"], 0))).toBeNull();
    expect(checkSynonym(qcm("Quel mot a presque le même sens que « joli » ?", ["beau", "magnifique", "épuisé"], 0))).not.toBeNull();
    expect(checkAntonym(qcm("Quel est le contraire de « grand » ?", ["petit", "immense", "fort"], 0))).not.toBeNull();
    expect(checkSuffix(qcm("Quel nom se forme à partir du verbe « chanter » avec le suffixe « -eur » ?", ["chanteur", "chantheur", "chantage"], 0))).toBeNull();
  });

  it("le thème : l'intrus est d'un autre thème, les deux autres du thème", () => {
    expect(checkTheme(qcm("Quel mot ne va pas avec le thème « pêche » ?", ["tableau", "filet", "canne"], 0))).toBeNull();
    expect(checkTheme(qcm("Quel mot ne va pas avec le thème « pêche » ?", ["filet", "tableau", "canne"], 0))).not.toBeNull();
    // « pluie » n'est pas du marché : c'est un intrus ; « gâteau » est de la fête, mais un gâteau se vend : il ne figure pas parmi les intrus du marché.
    expect(checkTheme(qcm("Quel mot ne va pas avec le thème « marché » ?", ["pluie", "panier", "étal"], 0))).toBeNull();
    expect(INTRUDERS.marché).not.toContain("gâteau");
  });

  it("le sens d'une expression", () => {
    expect(checkSense(qcm("Que veut dire « poser un lapin » ?", ["ne pas venir à un rendez-vous", "offrir un animal", "jouer avec un lapin"], 0))).toBeNull();
    expect(checkSense(qcm("Que veut dire « poser un lapin » ?", ["offrir un animal", "ne pas venir à un rendez-vous", "bouder"], 0))).not.toBeNull();
    expect(new Set(Object.values(EXPRESSIONS)).size).toBe(30);
  });
});
