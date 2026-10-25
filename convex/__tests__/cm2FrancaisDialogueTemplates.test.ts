import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LE DIALOGUE DU CM2 (`fr-cm2-dialogue`).
 *
 * Ce fichier a ses propres expressions régulières, écrites à part de `cm2Dialogue.ts` : celle d'une phrase bien ponctuée avec guillemets (« Awa demande : « Où vas-tu ? » »), celle
 * d'une phrase bien ponctuée avec tiret (« — Où vas-tu ? demande Awa. »), les signes qui manquent, les indices qui imposent un verbe de parole (une question, une réponse, un cri, un secret, un ordre).
 * Il vérifie que la bonne phrase passe l'une des deux expressions et qu'aucun mauvais choix ne passe ni l'une ni l'autre, que les trois phrases disent la même chose, que le verbe
 * de parole choisi est le seul que les indices permettent, que le signe qui manque est celui de la place du trou, et que les répliques sont recomptées.
 */

const STORY: Record<string, string> = {
  "— Je viens demain, dit Awa.": "Awa dit qu'elle vient demain.",
  "— Je suis fatigué, dit Moussa.": "Moussa dit qu'il est fatigué.",
  "— J'ai faim, dit Fatou.": "Fatou dit qu'elle a faim.",
  "— Tu as bien travaillé, dit la maîtresse à Sidy.": "La maîtresse dit à Sidy qu'il a bien travaillé.",
  "— Où vas-tu ? demande Awa à Moussa.": "Awa demande à Moussa où il va.",
  "— As-tu faim ? demande maman à Binta.": "Maman demande à Binta si elle a faim.",
  "— Qui a pris mon cahier ? demande le maître.": "Le maître demande qui a pris son cahier.",
  "— Je ne sais pas, répond Khady.": "Khady répond qu'elle ne sait pas.",
  "— Je suis content, dit Sidy.": "Sidy dit qu'il est content.",
  "— Tu peux venir, dit Mariama à Modou.": "Mariama dit à Modou qu'il peut venir.",
  "— Quelle heure est-il ? demande papa.": "Papa demande quelle heure il est.",
  "— Je chante bien, dit Binta.": "Binta dit qu'elle chante bien.",
};
const PHONE: Record<string, string> = {
  "Que dit-on pour décrocher le téléphone poliment ?": "Allô, bonjour, ici la famille Ba.",
  "Comment demande-t-on poliment à parler à Fatou ?": "Bonjour madame, puis-je parler à Fatou, s'il vous plaît ?",
  "Comment dit-on son nom au début d'un appel ?": "Bonjour, c'est Moussa à l'appareil.",
  "Que dit-on quand on s'est trompé de numéro ?": "Excusez-moi, je me suis trompé de numéro.",
  "Comment termine-t-on poliment un appel ?": "Merci beaucoup, au revoir et à bientôt.",
  "Que fait-on quand la personne n'est pas là ?": "On demande poliment de laisser un message.",
  "Quel ton faut-il avoir au téléphone ?": "Un ton calme et poli.",
  "Que doit-on faire si l'on ne comprend pas ?": "Demander poliment de répéter.",
};
const ROLE: Record<string, string> = {
  "Quel signe encadre les paroles d'un personnage ?": "Guillemets",
  "Quel signe montre qu'un nouveau personnage prend la parole ?": "Tiret",
  "Quel signe suit le verbe de parole et annonce les paroles ?": "Deux-points",
  "À quoi servent les guillemets dans un dialogue ?": "À encadrer les paroles dites",
  "À quoi sert le tiret dans un dialogue ?": "À changer de personnage qui parle",
  "À quoi servent les deux-points avant les paroles ?": "À annoncer les paroles qui suivent",
  "Quand le verbe de parole suit une affirmation, que met-on à la fin de la parole ?": "Virgule",
  "Quelle lettre commence les paroles après les guillemets ?": "Une majuscule",
};
const CONVERSATIONS: string[][] = [
  ["— Allô ?", "— Bonjour, c'est Moussa. Peux-tu venir jouer ?", "— Oui, j'arrive dans cinq minutes.", "— À tout à l'heure !"],
  ["— Bonjour, madame. Je voudrais une mangue.", "— Voilà, elle coûte cent francs.", "— Merci, voici l'argent.", "— Merci à toi, au revoir !"],
  ["— Où as-tu mis mon cahier ?", "— Il est sur la table.", "— Je ne le vois pas.", "— Regarde mieux, il est sous ton livre."],
  ["— Excusez-moi, quelle heure est-il ?", "— Il est midi.", "— Merci beaucoup.", "— Je vous en prie."],
  ["— Bonjour Fatou, comment vas-tu ?", "— Je vais bien, merci, et toi ?", "— Moi aussi, je vais bien.", "— Alors viens jouer avec nous !"],
  ["— Maître, puis-je sortir ?", "— Pourquoi veux-tu sortir ?", "— Je dois boire un peu d'eau.", "— D'accord, mais reviens vite."],
  ["— Que fais-tu demain ?", "— Je vais au marché avec maman.", "— Peux-tu m'acheter une mangue ?", "— Bien sûr, je t'en rapporte une."],
  ["— Allô ?", "— Bonjour Sidy, c'est Binta.", "— Bonjour Binta, que veux-tu ?", "— Peux-tu me prêter ton livre ?"],
];
const SENSES: Record<string, string> = Object.fromEntries([
  ["demander", "poser une question"],
  ["répondre", "donner une réponse"],
  ["s'écrier", "parler très fort sous le coup de l'émotion"],
  ["murmurer", "parler très bas"],
  ["ordonner", "dire de faire quelque chose"],
  ["expliquer", "dire pour faire comprendre"],
]);
const SPOKEN = new Set([
  "Où vas-tu ?", "Je vais au marché.", "Ouvrez vos cahiers.", "Quelle belle surprise !", "As-tu fini tes devoirs ?", "Chut, le bébé dort.",
  "Bravo, tu as gagné !", "Quelle heure est-il ?", "Attention à la voiture !", "Oui, j'arrive.", "Bien sûr, entrez.", "Je suis contente.",
]);
const NARRATED = new Set([
  "demande Awa", "répond Moussa", "dit la maîtresse", "s'écrie Fatou", "murmure le grand-père", "explique le pêcheur",
  "dit Sidy en riant", "répond Khady avec un sourire", "demande maman d'une voix douce", "s'écrie papa de joie", "murmure Cheikh tout bas", "répond le maître calmement",
]);


const SPEECH_VERBS = "demande|répond|dit|s'écrie|murmure|explique";
const QUOTED = new RegExp(`^[A-ZÀ-Ý][^:«»—]* (?:${SPEECH_VERBS}) : « [A-ZÀ-Ý][^«»]*(?:\\.| [?!]) »$`, "u");
const DASHED = new RegExp(`^— [A-ZÀ-Ý][^—«»:]*(?: [?!]|,) (?:${SPEECH_VERBS}) [^.]+\\.$`, "u");
const wellPunctuated = (sentence: string) => QUOTED.test(sentence) || DASHED.test(sentence);
const tokens = (sentence: string) => (sentence.toLowerCase().match(/[\p{L}']+/gu) ?? []).sort().join(" ");

const checkPunct: Check = (exo) => {
  const right = rightOption(exo);
  return all(
    ok(exo.prompt === "Quelle phrase est bien ponctuée ?", `énoncé inconnu : ${exo.prompt}`),
    ok(wellPunctuated(right), `la bonne réponse n'est pas bien ponctuée : ${right}`),
    ...wrongOf(exo).map((option) => ok(!wellPunctuated(option), `un mauvais choix est bien ponctué : ${option}`)),
    ok(optionsOf(exo).every((option) => tokens(option) === tokens(right)), `les trois phrases ne disent pas la même chose : ${optionsOf(exo).join(" | ")}`),
  );
};

type Cue = "question" | "reponse" | "cri" | "secret" | "ordre";
const VALID: Record<Cue, string[]> = { question: ["demande"], reponse: ["répond", "explique", "dit"], cri: ["s'écrie", "crie"], secret: ["murmure", "chuchote"], ordre: ["ordonne", "crie"] };
const WRONG_OK: Record<Cue, string[]> = {
  question: ["répond", "ordonne", "explique"],
  reponse: ["demande", "ordonne"],
  cri: ["murmure", "demande", "répond"],
  secret: ["s'écrie", "demande"],
  ordre: ["demande", "murmure", "répond"],
};
const ANSWER: Record<Cue, string> = { question: "demande", reponse: "répond", cri: "s'écrie", secret: "murmure", ordre: "ordonne" };
function cueOf(text: string): Cue | null {
  if (/\. — [^—]*, ___ /u.test(text)) return "reponse";
  if (/^— [^—]*\? ___ /u.test(text)) return "question";
  if (/^— [^—]*! ___ .*(?:d'un ton sévère|d'une voix ferme)\.$/u.test(text)) return "ordre";
  if (/^— [^—]*! ___ .*(?:de toutes ses forces|très fort|à pleine voix)\.$/u.test(text)) return "cri";
  if (/^— [^—]*, ___ .*(?:tout bas|à voix basse)\.$/u.test(text)) return "secret";
  return null;
}
const checkVerb: Check = (exo) => {
  const cue = cueOf(textOf(exo));
  if (!cue) return `phrase sans indice : ${textOf(exo)}`;
  const blank = blankOf(exo);
  return all(
    ok(exo.prompt === "Choisis le verbe de parole qui convient.", `énoncé inconnu : ${exo.prompt}`),
    ok(blank.answer === ANSWER[cue], `${textOf(exo)} : ${blank.answer} au lieu de ${ANSWER[cue]}`),
    ...blank.options.filter((option) => option !== blank.answer).map((option) => ok(!VALID[cue].includes(option) && WRONG_OK[cue].includes(option), `un mauvais choix peut convenir ou est inconnu : ${option}`)),
  );
};

const checkStory: Check = (exo) => {
  const m = /^Transforme en récit la phrase suivante\. (.+)$/u.exec(exo.prompt);
  if (!m || !STORY[m[1]]) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === STORY[m[1]], `${m[1]} : « ${rightOption(exo)} » au lieu de « ${STORY[m[1]]} »`),
    ...wrongOf(exo).map((option) => ok(option !== STORY[m[1]] && !/ \? /u.test(option) && !/\?/u.test(option), `un mauvais choix est juste ou garde le point d'interrogation : ${option}`)),
  );
};

const checkPhone: Check = (exo) =>
  all(
    ok(PHONE[exo.prompt] !== undefined, `énoncé inconnu : ${exo.prompt}`),
    ok(rightOption(exo) === PHONE[exo.prompt], `${exo.prompt} : « ${rightOption(exo)} » au lieu de « ${PHONE[exo.prompt]} »`),
  );

const checkOrder: Check = (exo) =>
  all(
    ok(exo.prompt === "Remets ces répliques dans l'ordre, selon le sens de la conversation.", `énoncé inconnu : ${exo.prompt}`),
    ok(CONVERSATIONS.some((lines) => lines.join("|") === sequenceOf(exo).join("|")), `conversation inconnue ou mal rangée : ${sequenceOf(exo).join(" | ")}`),
  );

/** Le signe que la place du trou demande, d'après la phrase seule. */
function signOf(text: string): string | null {
  if (text.startsWith("___ ")) return "—";
  if (text.endsWith(" ___")) return "»";
  if (/ : ___ [A-ZÀ-Ý]/u.test(text)) return "«";
  if (/[.?!] ___ [A-ZÀ-Ý]/u.test(text) && text.startsWith("— ")) return "—";
  if (new RegExp(`(?:${SPEECH_VERBS}) ___ « `, "u").test(text)) return ":";
  return null;
}
const checkSign: Check = (exo) => {
  const expected = signOf(textOf(exo));
  if (!expected) return `trou inconnu : ${textOf(exo)}`;
  const blank = blankOf(exo);
  return all(
    ok(exo.prompt === "Choisis le signe qui manque.", `énoncé inconnu : ${exo.prompt}`),
    ok(blank.answer === expected, `${textOf(exo)} : ${blank.answer} au lieu de ${expected}`),
    ok(blank.options.length === 3 && new Set(blank.options).size === 3, "trois signes différents"),
  );
};

const checkRole: Check = (exo) =>
  all(
    ok(ROLE[exo.prompt] !== undefined, `énoncé inconnu : ${exo.prompt}`),
    ok(rightOption(exo) === ROLE[exo.prompt], `${exo.prompt} : « ${rightOption(exo)} » au lieu de « ${ROLE[exo.prompt]} »`),
  );

const NUMBER_WORD: Record<number, string> = { 2: "deux", 3: "trois", 4: "quatre", 5: "cinq" };
const checkCount: Check = (exo) => {
  const m = /^(.+) Combien de répliques ce dialogue contient-il \?$/u.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const count = (m[1].match(/(?:^|\. |\? |! )— /gu) ?? []).length;
  return all(
    ok(count >= 2 && count <= 5, `${count} répliques`),
    ok(acceptedOf(exo).length === 2 && acceptedOf(exo)[0] === String(count) && acceptedOf(exo)[1] === NUMBER_WORD[count], `réponses admises : ${acceptedOf(exo).join(" | ")}`),
    ok(m[1].split("— ").length - 1 === count, "un tiret par réplique"),
  );
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(exo.prompt === "Relie chaque verbe de parole à son sens.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.left)).size === 3, "trois verbes différents attendus"),
    ...pairs.map((pair) => ok(SENSES[pair.left] === pair.right, `${pair.left} ne veut pas dire « ${pair.right} »`)),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Paroles" && zones[1] === "Récit", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === "Paroles").length === 2, "deux morceaux par case"),
    ...items.map((item) => ok(item.correctZone === "Paroles" ? SPOKEN.has(item.text) && !NARRATED.has(item.text) : NARRATED.has(item.text) && !SPOKEN.has(item.text), `« ${item.text} » est rangé dans « ${item.correctZone} »`)),
  );
};

defineMathsTests({
  label: "du dialogue du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 80,
  checks: {
    "cm2-dia-ponctuation": checkPunct,
    "cm2-dia-verbe": checkVerb,
    "cm2-dia-recit": checkStory,
    "cm2-dia-telephone": checkPhone,
    "cm2-dia-ranger": checkOrder,
    "cm2-dia-signe": checkSign,
    "cm2-dia-role": checkRole,
    "cm2-dia-compter": checkCount,
    "cm2-dia-relier": checkLink,
    "cm2-dia-glisser": checkSort,
  },
  topicKinds: {
    "fr-cm2-dialogue": ["cm2-dia-ponctuation", "cm2-dia-verbe", "cm2-dia-recit", "cm2-dia-telephone", "cm2-dia-ranger", "cm2-dia-signe", "cm2-dia-role", "cm2-dia-compter", "cm2-dia-relier", "cm2-dia-glisser"],
  },
});
