import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LA POÉSIE DU CM2 (`fr-cm2-poesie`).
 *
 * Ce fichier a ses propres familles de rimes, écrites à part de `cm2Poesie.ts` : une rime est un son, et chaque famille réunit des mots de même son final, avec leurs pluriels. Il relit chaque
 * poème dans l'énoncé : les vers et les strophes sont recomptés, le schéma des rimes (AABB, ABAB, ABBA) est déduit des derniers mots, le mot du trou est celui qui fait un schéma juste, et
 * un mauvais choix ne rime avec aucun autre vers. Deux familles qui se ressemblent à l'oreille (« soleil » et « famille », « maison » et « chemin ») ne sont jamais ensemble dans un exercice.
 */

const FAMILY_LINES = [
  "soleil réveil sommeil pareil vermeil réveille merveille abeille",
  "maison chanson saison poisson ballon",
  "caillou genou bijou hibou verrou",
  "village nuage courage paysage plage",
  "papier panier cahier sentier fermier",
  "bateau ruisseau oiseau château drapeau rameau tableau chapeau",
  "cuisine voisine colline racine machine",
  "famille fille bille brille coquille",
  "fleur bonheur chaleur couleur douleur voyageur rêveur",
  "rive olive arrive vive dérive",
  "miroir soir espoir noir tiroir",
  "chemin matin main pain jardin chagrin",
  "hirondelle belle ficelle étincelle échelle",
  "vent enfant content volant géant longtemps blanc doucement",
  "port fort dort trésor or",
  "douce pousse mousse secousse rousse",
  "mer hiver fer air éclair vert clair",
  "lune dune prune brune fortune chacune",
  "table aimable sable fable",
  "petite visite limite",
  "toit parfois bois fois roi",
  "ciel miel fiel pluriel",
  "lac sac hamac tabac",
  "ensemble ressemblent rassemble tremble",
  "pluie réjoui ennui",
  "sèche pêche fraîche crèche",
  "gentil sourit petit",
  "commencer travailler jouer chanter",
];
const FAMILY_OF = new Map<string, number>();
FAMILY_LINES.forEach((line, index) => line.split(" ").forEach((word) => FAMILY_OF.set(word, index)));
/** La famille d'un mot, au singulier ou au pluriel. */
function familyOf(word: string): number | null {
  const lower = word.toLowerCase();
  for (const candidate of [lower, lower.replace(/s$/u, ""), lower.replace(/x$/u, ""), lower.replace(/es$/u, "")]) {
    const found = FAMILY_OF.get(candidate);
    if (found !== undefined) return found;
  }
  return null;
}
/** Des familles proches à l'oreille, qui ne vont jamais ensemble : les indices de FAMILY_LINES. */
const CLOSE: number[][] = [[0, 7, 21], [1, 11, 13], [8, 16], [5, 14], [3, 22], [4, 27], [19, 26], [12, 21]];
const closeTo = (a: number, b: number) => a === b || CLOSE.some((group) => group.includes(a) && group.includes(b));

const checkRhyme: Check = (exo) => {
  const m = /^Quel mot rime avec « (\p{L}+) » \?$/u.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const base = familyOf(m[1]);
  const right = familyOf(rightOption(exo));
  if (base === null || right === null) return `mot hors des familles : ${m[1]} / ${rightOption(exo)}`;
  return all(
    ok(base === right && m[1] !== rightOption(exo), `« ${rightOption(exo)} » ne rime pas avec « ${m[1]} »`),
    ...wrongOf(exo).map((option) => {
      const family = familyOf(option);
      return ok(family !== null && !closeTo(base, family), `un mauvais choix rime ou ressemble : « ${option} »`);
    }),
  );
};

const checkOdd: Check = (exo) => {
  const options = optionsOf(exo);
  const families = options.map(familyOf);
  if (families.some((family) => family === null)) return `mot hors des familles : ${options.join(" | ")}`;
  const right = familyOf(rightOption(exo)) as number;
  const others = wrongOf(exo).map((option) => familyOf(option) as number);
  return all(
    ok(exo.prompt === "Quel mot ne rime pas avec les deux autres ?", `énoncé inconnu : ${exo.prompt}`),
    ok(others.length === 2 && others[0] === others[1], `les deux autres mots doivent rimer : ${wrongOf(exo).join(" | ")}`),
    ok(!closeTo(right, others[0]), `l'intrus ressemble aux autres : ${options.join(" | ")}`),
  );
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  const families = pairs.map((pair) => familyOf(pair.left));
  return all(
    ok(exo.prompt === "Relie chaque mot au mot qui rime avec lui.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 3, "trois paires attendues"),
    ...pairs.map((pair) => ok(familyOf(pair.left) !== null && familyOf(pair.left) === familyOf(pair.right) && pair.left !== pair.right, `« ${pair.left} » ne rime pas avec « ${pair.right} »`)),
    ok(families.every((a, i) => families.every((b, j) => i === j || (a !== null && b !== null && !closeTo(a, b)))), `deux familles se ressemblent : ${pairs.map((pair) => pair.left).join(" | ")}`),
    ok(new Set(pairs.flatMap((pair) => [pair.left, pair.right])).size === 6, "six mots différents"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const labels = zones.map((zone) => /^Rime avec (\p{L}+)$/u.exec(zone)?.[1]);
  if (labels.some((label) => !label)) return `cases inconnues : ${zones.join(" ; ")}`;
  const [a, b] = labels.map((label) => familyOf(label as string));
  if (a === null || b === null) return `mot hors des familles : ${labels.join(" | ")}`;
  return all(
    ok(!closeTo(a, b), `les deux cases se ressemblent : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux mots par case"),
    ...items.map((item) => ok(familyOf(item.text) === (item.correctZone === zones[0] ? a : b) && !labels.includes(item.text), `« ${item.text} » est rangé dans « ${item.correctZone} »`)),
  );
};

// ---------------------------------------------------------------------------
// Les poèmes lus dans l'énoncé
// ---------------------------------------------------------------------------

const HEADER = "Poème écrit pour l'exercice.";
const lastWordOf = (verse: string) => verse.split(" ").pop() as string;
type Scheme = "AABB" | "ABAB" | "ABBA";
/** Le schéma que les derniers mots de quatre vers dessinent, ou null s'ils n'en dessinent aucun. */
function schemeOf(ends: string[]): Scheme | null {
  const f = ends.map(familyOf);
  if (f.some((family) => family === null)) return null;
  const [a, b, c, d] = f as number[];
  if (a === b && c === d && a !== c) return "AABB";
  if (a === c && b === d && a !== b) return "ABAB";
  if (a === d && b === c && a !== b) return "ABBA";
  return null;
}
const LABEL: Record<Scheme, string> = { AABB: "Les vers 1 et 2, puis les vers 3 et 4", ABAB: "Les vers 1 et 3, puis les vers 2 et 4", ABBA: "Les vers 1 et 4, puis les vers 2 et 3" };
function readPoem(prompt: string): { stanzas: string[][]; question: string } | null {
  const parts = prompt.split("\n\n");
  if (parts.length < 3 || parts[0] !== HEADER) return null;
  return { stanzas: parts.slice(1, -1).map((part) => part.split("\n")), question: parts[parts.length - 1] };
}

const checkScheme: Check = (exo) => {
  const poem = readPoem(exo.prompt);
  if (!poem || poem.stanzas.length !== 1 || poem.stanzas[0].length !== 4) return `poème illisible : ${exo.prompt}`;
  const scheme = schemeOf(poem.stanzas[0].map(lastWordOf));
  if (!scheme) return `aucun schéma de rimes : ${poem.stanzas[0].join(" / ")}`;
  return all(
    ok(poem.question === "Quels vers riment ensemble ?", `question inconnue : ${poem.question}`),
    ok(rightOption(exo) === LABEL[scheme], `${poem.stanzas[0].join(" / ")} : « ${rightOption(exo)} » au lieu de « ${LABEL[scheme]} »`),
    ok(new Set(optionsOf(exo)).size === 3 && optionsOf(exo).every((option) => Object.values(LABEL).includes(option)), "trois schémas attendus"),
  );
};

const NUMBER_WORD = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"];
const checkCount: Check = (exo) => {
  const poem = readPoem(exo.prompt);
  if (!poem) return `poème illisible : ${exo.prompt}`;
  const verses = poem.stanzas.reduce((total, stanza) => total + stanza.length, 0);
  const asksVerses = poem.question === "Combien de vers ce poème contient-il ?";
  const asksStanzas = poem.question === "Combien de strophes ce poème contient-il ?";
  if (!asksVerses && !asksStanzas) return `question inconnue : ${poem.question}`;
  const expected = asksVerses ? verses : poem.stanzas.length;
  return all(
    ok(poem.stanzas.every((stanza) => stanza.length === 4 && schemeOf(stanza.map(lastWordOf)) !== null), "une strophe sans rimes"),
    ok(acceptedOf(exo).length === 2 && acceptedOf(exo)[0] === String(expected) && acceptedOf(exo)[1] === NUMBER_WORD[expected], `réponses admises : ${acceptedOf(exo).join(" | ")} au lieu de ${expected}`),
  );
};

const checkPoemGap: Check = (exo) => {
  const text = textOf(exo);
  const blank = blankOf(exo);
  const poem = readPoem(`${text}\n\nx`);
  if (!poem) return `poème illisible : ${text}`;
  const at = poem.stanzas.findIndex((stanza) => stanza.some((verse) => verse.endsWith("___")));
  if (at < 0) return "aucun trou";
  const stanza = poem.stanzas[at];
  const verseAt = stanza.findIndex((verse) => verse.endsWith("___"));
  const endsWith = (word: string) => stanza.map((verse, i) => (i === verseAt ? word : lastWordOf(verse)));
  const others = stanza.filter((_, i) => i !== verseAt).map((verse) => familyOf(lastWordOf(verse)));
  return all(
    ok(exo.prompt === "Complète le dernier mot du vers avec celui qui rime.", `énoncé inconnu : ${exo.prompt}`),
    ok(schemeOf(endsWith(blank.answer)) !== null, `${stanza.join(" / ")} : « ${blank.answer} » ne fait aucun schéma de rimes`),
    ...blank.options
      .filter((option) => option !== blank.answer)
      .map((option) => ok(schemeOf(endsWith(option)) === null && !others.some((family) => family !== null && familyOf(option) !== null && closeTo(family, familyOf(option) as number)), `un mauvais choix rime avec un vers de la strophe : « ${option} »`)),
  );
};

// ---------------------------------------------------------------------------
// Les sonorités, les comparaisons
// ---------------------------------------------------------------------------

const initials = (verse: string) => {
  const counts = new Map<string, number>();
  for (const word of verse.toLowerCase().match(/\p{L}+/gu) ?? []) if (word.length >= 4) counts.set(word[0], (counts.get(word[0]) ?? 0) + 1);
  return Math.max(0, ...counts.values());
};
const checkSound: Check = (exo) =>
  all(
    ok(exo.prompt === "Quel vers répète le même son au début de plusieurs mots ?", `énoncé inconnu : ${exo.prompt}`),
    ok(initials(rightOption(exo)) >= 3, `« ${rightOption(exo)} » ne répète pas une initiale trois fois`),
    ...wrongOf(exo).map((option) => ok(initials(option) <= 1, `un mauvais choix répète une initiale : « ${option} »`)),
  );

const COMPARING = /\bcomme\b|\bpareil|\bsemble|\btel\b|\btelle\b|\bressembl/u;
const checkCompare: Check = (exo) =>
  all(
    ok(exo.prompt === "Dans quelle phrase y a-t-il une comparaison ?", `énoncé inconnu : ${exo.prompt}`),
    ok(/ \p{L}+ comme /u.test(rightOption(exo)), `« ${rightOption(exo)} » n'a pas de comparaison avec « comme »`),
    ...wrongOf(exo).map((option) => ok(!COMPARING.test(option), `un mauvais choix compare : « ${option} »`)),
  );

const IMAGES: Record<string, { answer: string; wrong: string[] }> = {
  "Il est fort comme ___.": { answer: "un lion", wrong: ["un escargot", "une plume"] },
  "Elle court, rapide comme ___.": { answer: "l'éclair", wrong: ["une tortue", "un caillou"] },
  "Ce sac est léger comme ___.": { answer: "une plume", wrong: ["un rocher", "un éléphant"] },
  "Cet agneau est doux comme ___.": { answer: "du coton", wrong: ["un caillou", "un clou"] },
  "Mon frère est malin comme ___.": { answer: "un singe", wrong: ["une pierre", "un sac"] },
  "Mon ami est têtu comme ___.": { answer: "une mule", wrong: ["une feuille", "une plume"] },
  "Le coton est blanc comme ___.": { answer: "la neige", wrong: ["le charbon", "la nuit"] },
  "La nuit est noire comme ___.": { answer: "le charbon", wrong: ["la neige", "le lait"] },
  "L'escargot est lent comme ___.": { answer: "une tortue", wrong: ["un éclair", "un guépard"] },
  "L'eau du puits est froide comme ___.": { answer: "la glace", wrong: ["le feu", "le soleil"] },
  "Le four est chaud comme ___.": { answer: "le feu", wrong: ["la glace", "la neige"] },
  "L'enfant est sage comme ___.": { answer: "une image", wrong: ["un orage", "un volcan"] },
};


const checkImage: Check = (exo) => {
  const row = IMAGES[textOf(exo)];
  if (!row) return `phrase inconnue : ${textOf(exo)}`;
  const blank = blankOf(exo);
  return all(
    ok(exo.prompt === "Complète la comparaison.", `énoncé inconnu : ${exo.prompt}`),
    ok(blank.answer === row.answer, `${textOf(exo)} : ${blank.answer} au lieu de ${row.answer}`),
    ok([...blank.options].sort().join("|") === [row.answer, ...row.wrong].sort().join("|"), `choix inattendus : ${blank.options.join(" | ")}`),
  );
};

defineMathsTests({
  label: "de la poésie du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 120,
  checks: {
    "cm2-poe-rime": checkRhyme,
    "cm2-poe-intrus": checkOdd,
    "cm2-poe-relier": checkLink,
    "cm2-poe-glisser": checkSort,
    "cm2-poe-schema": checkScheme,
    "cm2-poe-compter": checkCount,
    "cm2-poe-trou": checkPoemGap,
    "cm2-poe-sonorite": checkSound,
    "cm2-poe-comparer": checkCompare,
    "cm2-poe-comparaison": checkImage,
  },
  topicKinds: {
    "fr-cm2-poesie": ["cm2-poe-rime", "cm2-poe-intrus", "cm2-poe-schema", "cm2-poe-compter", "cm2-poe-sonorite", "cm2-poe-trou", "cm2-poe-relier", "cm2-poe-glisser", "cm2-poe-comparer", "cm2-poe-comparaison"],
  },
});
