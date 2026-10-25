import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LE TEXTE QUI ARGUMENTE ET LE DÉBAT DU CM2 (`fr-cm2-argumenter`).
 *
 * Ce fichier a ses propres tableaux, écrits à part de `cm2Argumenter.ts` : les faits et les opinions, les huit idées avec leurs arguments pour et contre, les règles du débat, le rôle de
 * chaque mot de liaison. Il relit chaque énoncé : une phrase rangée « fait » est dans la liste des faits et jamais dans celle des opinions ; un argument qui défend une idée est un des
 * arguments pour de CETTE idée, un mauvais choix un des arguments contre ; le mot qui manque dans une liste d'arguments est celui que le texte n'emploie pas ; le nombre de raisons est recompté.
 */

const FACT = new Set(["Une semaine compte sept jours.", "Le Sénégal a pour capitale Dakar.", "Un triangle a trois côtés.", "Le riz est une céréale.", "La Terre tourne autour du soleil.", "Un kilomètre fait mille mètres.", "Le français est la langue officielle du Sénégal.", "Le cheval est un mammifère.", "Les poissons respirent grâce à leurs branchies.", "Le fleuve Sénégal se jette dans l'océan Atlantique.", "Le baobab est un arbre.", "Une année compte douze mois.", "Le Sahara est un désert.", "Le sel se dissout dans l'eau.", "Le lion est un animal sauvage.", "L'eau bout à cent degrés."]);
const OPINION = new Set(["Le riz au poisson est le plat le plus délicieux.", "Le football est plus amusant que le basket.", "Les devoirs sont ennuyeux.", "Le bleu est la plus jolie couleur.", "Les vacances sont trop courtes.", "Lire est le meilleur des loisirs.", "Les chats sont plus gentils que les chiens.", "Cette chanson est magnifique.", "Le français est une langue difficile.", "Les mathématiques sont passionnantes.", "Le lion est le plus bel animal.", "La musique est plus belle le soir.", "Le baobab est l'arbre le plus impressionnant.", "Il vaut mieux vivre à la campagne qu'en ville.", "L'école devrait commencer plus tard.", "Il est mal de se coucher tard."]);
const GOOD = new Set(["Écouter l'autre jusqu'au bout", "Lever la main pour demander la parole", "Donner une raison pour son avis", "Parler calmement", "Respecter le temps de parole", "Accepter que l'on ne pense pas pareil", "Répéter ce que l'autre a dit avant de répondre", "Remercier l'autre à la fin"]);
const BAD = new Set(["Couper la parole", "Crier plus fort que les autres", "Se moquer de l'avis de l'autre", "Insulter l'autre", "Parler sans arrêt sans laisser les autres", "Refuser d'écouter", "Dire que l'autre a tort sans raison", "Se fâcher et quitter la salle"]);
const THESES: Record<string, { pro: string[]; con: string[] }> = {
  "Il faut lire tous les jours.": { pro: ["Lire apprend de nouveaux mots.", "Lire aide à mieux écrire.", "Lire permet de voyager sans quitter sa chambre."], con: ["Lire fatigue les yeux le soir.", "Certains livres coûtent très cher.", "On peut apprendre autrement, avec la radio."] },
  "Les enfants doivent faire du sport.": { pro: ["Le sport rend le corps fort.", "Le sport apprend à jouer en équipe.", "Le sport aide à mieux dormir."], con: ["Le sport peut blesser quand on tombe.", "Les terrains sont parfois trop loin.", "Certains enfants préfèrent se reposer."] },
  "Il faut planter des arbres.": { pro: ["Les arbres donnent de la fraîcheur.", "Les arbres retiennent la terre.", "Les arbres abritent les oiseaux."], con: ["Un arbre demande beaucoup d'eau.", "Planter coûte du temps et de l'argent.", "Les racines abîment parfois les murs."] },
  "On doit porter un uniforme en classe.": { pro: ["Tous les élèves sont habillés pareil.", "Les parents dépensent moins en vêtements.", "On reconnaît vite les élèves de la même école."], con: ["Chacun veut montrer son style.", "Un uniforme peut être trop chaud.", "Les enfants grandissent vite."] },
  "Il faut manger des fruits chaque jour.": { pro: ["Les fruits donnent des vitamines.", "Les fruits donnent de la force.", "Les fruits sont bons et pas chers au marché."], con: ["Certains fruits sont chers hors saison.", "Les fruits se gâtent vite sous la chaleur.", "Un fruit ne suffit pas à faire un repas."] },
  "Les élèves devraient aider à nettoyer la cour.": { pro: ["Chacun apprend à respecter les lieux.", "Le travail est vite fini à plusieurs.", "La cour reste propre pour tous."], con: ["Les élèves perdent du temps de classe.", "Le nettoyage est un travail pour des adultes.", "Des élèves peuvent se blesser avec le matériel."] },
  "Il faut limiter les écrans.": { pro: ["Regarder trop longtemps fatigue les yeux.", "Les écrans prennent le temps des devoirs.", "Jouer dehors est meilleur pour le corps."], con: ["Les écrans permettent d'apprendre des choses.", "Un écran aide à parler à la famille éloignée.", "Un film peut se regarder en famille."] },
  "On doit économiser notre eau.": { pro: ["Les villages manquent souvent de bonne eau.", "Chaque goutte coûte du travail pour la puiser.", "Un robinet qui coule gaspille des litres."], con: ["Il faut aussi se laver pour rester en bonne santé.", "Les plantes ont besoin de beaucoup d'eau.", "Boire peu est mauvais pour le corps."] },
};


const ORDERING = ["D'abord", "De plus", "Enfin"];
const ROLE: Record<string, { valid: string[]; never: string[] }> = {
  "Quel mot de liaison annonce le premier argument ?": { valid: ["D'abord"], never: ["D'abord"] },
  "Quel mot de liaison ajoute un argument ?": { valid: ["De plus", "Ensuite"], never: [] },
  "Quel mot de liaison annonce le dernier argument ?": { valid: ["Enfin"], never: [] },
  "Quel mot de liaison oppose deux idées ?": { valid: ["Cependant", "Pourtant", "Au contraire"], never: [] },
  "Quel mot de liaison dit le contraire de ce qui vient d'être dit ?": { valid: ["Au contraire"], never: [] },
};
const OPPOSE = ["Cependant", "Pourtant", "Au contraire"];
const ADD = ["De plus", "Ensuite"];
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const checkNature: Check = (exo) => {
  const fact = exo.prompt === "Laquelle de ces phrases est un fait ?";
  const opinion = exo.prompt === "Laquelle de ces phrases est une opinion ?";
  if (!fact && !opinion) return `énoncé inconnu : ${exo.prompt}`;
  const own = fact ? FACT : OPINION;
  const other = fact ? OPINION : FACT;
  return all(
    ok(own.has(rightOption(exo)) && !other.has(rightOption(exo)), `« ${rightOption(exo)} » n'est pas ${fact ? "un fait" : "une opinion"}`),
    ...wrongOf(exo).map((option) => ok(other.has(option) && !own.has(option), `un mauvais choix est de la bonne sorte : « ${option} »`)),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Fait" && zones[1] === "Opinion", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === "Fait").length === 2, "deux phrases par case"),
    ...items.map((item) => ok((item.correctZone === "Fait" ? FACT.has(item.text) && !OPINION.has(item.text) : OPINION.has(item.text) && !FACT.has(item.text)), `« ${item.text} » est rangée dans « ${item.correctZone} »`)),
  );
};

const ideaOf = (prompt: string, verb: string) => new RegExp(`^Quel argument ${verb} cette idée « (.+) » \\?$`, "u").exec(prompt)?.[1];
const checkFor: Check = (exo) => {
  const idea = ideaOf(exo.prompt, "défend");
  if (!idea || !THESES[idea]) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(THESES[idea].pro.includes(rightOption(exo)), `« ${rightOption(exo)} » ne défend pas « ${idea} »`),
    ...wrongOf(exo).map((option) => ok(THESES[idea].con.includes(option), `un mauvais choix ne va pas contre l'idée : « ${option} »`)),
  );
};
const checkAgainst: Check = (exo) => {
  const idea = ideaOf(exo.prompt, "va contre");
  if (!idea || !THESES[idea]) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(THESES[idea].con.includes(rightOption(exo)), `« ${rightOption(exo)} » ne va pas contre « ${idea} »`),
    ...wrongOf(exo).map((option) => ok(THESES[idea].pro.includes(option), `un mauvais choix ne défend pas l'idée : « ${option} »`)),
  );
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(exo.prompt === "Relie chaque idée à l'argument qui la défend.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.left)).size === 3, "trois idées différentes attendues"),
    ...pairs.map((pair) => ok(!!THESES[pair.left] && THESES[pair.left].pro.includes(pair.right), `« ${pair.right} » ne défend pas « ${pair.left} »`)),
  );
};

/** L'idée, puis les phrases « Mot, argument. » : chaque phrase a son mot de liaison. */
function readArguments(text: string): { idea: string; steps: { word: string; argument: string }[] } | null {
  const idea = Object.keys(THESES).find((candidate) => text.startsWith(`${candidate} `));
  if (!idea) return null;
  const rest = text.slice(idea.length + 1);
  const steps: { word: string; argument: string }[] = [];
  for (const m of rest.matchAll(/(D'abord|De plus|Enfin|___), ([^.]+\.)/gu)) steps.push({ word: m[1], argument: m[2] });
  return { idea, steps };
}
const isProOf = (idea: string, argumentText: string) => THESES[idea].pro.some((pro) => lowerFirst(pro) === argumentText);

const checkGap: Check = (exo) => {
  const read = readArguments(textOf(exo));
  if (!read || read.steps.length !== 3) return `texte inconnu : ${textOf(exo)}`;
  const blank = blankOf(exo);
  const at = read.steps.findIndex((step) => step.word === "___");
  const present = read.steps.filter((step) => step.word !== "___").map((step) => step.word);
  return all(
    ok(at >= 0, "aucun trou"),
    ok(blank.answer === ORDERING[at], `${textOf(exo)} : ${blank.answer} au lieu de ${ORDERING[at]}`),
    ok(!present.includes(blank.answer), "la bonne réponse est déjà dans le texte"),
    ok(present.every((word, i) => word === ORDERING[ORDERING.indexOf(word)]) && ORDERING.every((word) => word === blank.answer || present.includes(word)), "les deux autres mots doivent être dans le texte"),
    ok([...blank.options].sort().join("|") === [...ORDERING].sort().join("|"), `choix inattendus : ${blank.options.join(" | ")}`),
    ...read.steps.map((step) => ok(isProOf(read.idea, step.argument), `« ${step.argument} » n'est pas un argument pour « ${read.idea} »`)),
    ok(new Set(read.steps.map((step) => step.argument)).size === 3, "trois arguments différents"),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Voici une idée à défendre\. (.+?) Remets les trois arguments dans le bon ordre, selon les mots de liaison\.$/u.exec(exo.prompt);
  if (!m || !THESES[m[1]]) return `énoncé inconnu : ${exo.prompt}`;
  const sequence = sequenceOf(exo);
  const parsed = sequence.map((tile) => /^(D'abord|De plus|Enfin), (.+)$/u.exec(tile));
  if (parsed.some((p) => p === null)) return `tuile inconnue : ${sequence.join(" | ")}`;
  const steps = parsed as RegExpExecArray[];
  return all(
    ok(steps.map((step) => step[1]).join(",") === ORDERING.join(","), `les mots de liaison ne sont pas dans l'ordre : ${sequence.join(" | ")}`),
    ...steps.map((step) => ok(isProOf(m[1], step[2]), `« ${step[2]} » n'est pas un argument pour « ${m[1]} »`)),
    ok(new Set(steps.map((step) => step[2])).size === 3, "trois arguments différents"),
  );
};

const checkCount: Check = (exo) => {
  const m = /^(.+) Combien de raisons ce texte donne-t-il \?$/u.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const read = readArguments(m[1]);
  if (!read) return `texte inconnu : ${m[1]}`;
  const count = read.steps.length;
  return all(
    ok(count === 2 || count === 3, `${count} raisons`),
    ok(acceptedOf(exo)[0] === String(count) && acceptedOf(exo).length === 2 && acceptedOf(exo)[1] === (count === 2 ? "deux" : "trois"), `réponses admises : ${acceptedOf(exo).join(" | ")}`),
    ...read.steps.map((step) => ok(isProOf(read.idea, step.argument), `« ${step.argument} » n'est pas un argument pour « ${read.idea} »`)),
    ok(count === 3 ? read.steps.map((step) => step.word).join(",") === ORDERING.join(",") : read.steps.map((step) => step.word).join(",") === "D'abord,Enfin", "mots de liaison inattendus"),
  );
};

const checkRole: Check = (exo) => {
  const role = ROLE[exo.prompt];
  if (!role) return `énoncé inconnu : ${exo.prompt}`;
  const right = rightOption(exo);
  const group = exo.prompt.includes("oppose") || exo.prompt.includes("contraire") ? OPPOSE : exo.prompt.includes("ajoute") ? ADD : [];
  return all(
    ok(role.valid.includes(right), `« ${right} » ne répond pas à « ${exo.prompt} »`),
    ...wrongOf(exo).map((option) => ok(!role.valid.includes(option) && !group.includes(option) && !(exo.prompt.includes("ajoute") && option === "Enfin"), `un mauvais choix peut aussi convenir : « ${option} »`)),
  );
};

const checkDebate: Check = (exo) => {
  const doRule = exo.prompt === "Dans un débat respectueux, que doit-on faire ?";
  const dontRule = exo.prompt === "Dans un débat respectueux, que ne faut-il pas faire ?";
  if (!doRule && !dontRule) return `énoncé inconnu : ${exo.prompt}`;
  const own = doRule ? GOOD : BAD;
  const other = doRule ? BAD : GOOD;
  return all(
    ok(own.has(rightOption(exo)) && !other.has(rightOption(exo)), `« ${rightOption(exo)} » ne répond pas à « ${exo.prompt} »`),
    ...wrongOf(exo).map((option) => ok(other.has(option) && !own.has(option), `un mauvais choix répond aussi : « ${option} »`)),
  );
};

defineMathsTests({
  label: "du texte qui argumente et du débat du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 120,
  checks: {
    "cm2-arg-nature": checkNature,
    "cm2-arg-glisser": checkSort,
    "cm2-arg-argument": checkFor,
    "cm2-arg-contre": checkAgainst,
    "cm2-arg-relier": checkLink,
    "cm2-arg-trou": checkGap,
    "cm2-arg-ordre": checkOrder,
    "cm2-arg-compter": checkCount,
    "cm2-arg-liaison": checkRole,
    "cm2-arg-debat": checkDebate,
  },
  topicKinds: {
    "fr-cm2-argumenter": ["cm2-arg-nature", "cm2-arg-glisser", "cm2-arg-argument", "cm2-arg-contre", "cm2-arg-relier", "cm2-arg-trou", "cm2-arg-ordre", "cm2-arg-compter", "cm2-arg-liaison", "cm2-arg-debat"],
  },
});
